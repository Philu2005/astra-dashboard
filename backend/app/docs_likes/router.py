import hmac
import hashlib
import base64
import uuid
from typing import Optional, Tuple

from fastapi import APIRouter, Request, Response, HTTPException, Depends

from app.database import get_pool
from app.auth.sessions import session_manager
from app.security import verify_same_origin
from app.config import settings


router = APIRouter(prefix="/docs/articles", tags=["Docs"])

VISITOR_COOKIE_NAME = "visitor_id"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    # add missing padding
    pad = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def _sign_visitor(raw_uuid: str) -> str:
    secret = settings.SESSION_SECRET.encode("utf-8")
    mac = hmac.new(secret, raw_uuid.encode("utf-8"), hashlib.sha256).digest()
    sig = _b64url(mac)
    return f"{raw_uuid}.{sig}"


def _verify_visitor(token: str) -> Optional[str]:
    """Verifiziert das signierte Visitor-Token und gibt die UUID zurück, wenn gültig."""
    if not token or "." not in token:
        return None
    raw_uuid, sig = token.rsplit(".", 1)
    try:
        uuid.UUID(raw_uuid)
    except Exception:
        return None
    expected = _sign_visitor(raw_uuid).rsplit(".", 1)[1]
    # constant-time compare
    if not hmac.compare_digest(sig, expected):
        return None
    return raw_uuid


async def _get_session_user_id(request: Request) -> Optional[str]:
    session_id = request.cookies.get("session_id")
    if not session_id:
        return None
    session = await session_manager.get_session(session_id)
    return session.user_id if session else None


def _get_or_create_visitor_id(request: Request, response: Optional[Response]) -> str:
    token = request.cookies.get(VISITOR_COOKIE_NAME)
    raw = _verify_visitor(token) if token else None
    if raw:
        return raw
    # create new signed token
    new_raw = str(uuid.uuid4())
    signed = _sign_visitor(new_raw)
    if response is not None:
        response.set_cookie(
            VISITOR_COOKIE_NAME,
            signed,
            httponly=True,
            secure=True,
            samesite="Lax",
            path="/",
            max_age=3600 * 24 * 365,
        )
    return new_raw


@router.get("/{slug}/likes")
async def get_likes(slug: str, request: Request):
    """Gibt Zähler und aktuellen Status (hat Benutzer geliked?) zurück."""
    user_id = await _get_session_user_id(request)
    visitor_token = request.cookies.get(VISITOR_COOKIE_NAME)
    visitor_id = _verify_visitor(visitor_token) if visitor_token else None

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Optionaler Merge: Wenn Nutzer jetzt eingeloggt ist und zuvor anonym geliked hat, migrieren
            if user_id and visitor_id:
                # Nur migrieren, wenn noch kein User-Like existiert, aber ein Visitor-Like
                await cur.execute(
                    "SELECT 1 FROM docs_article_likes WHERE article_slug=%s AND user_id=%s LIMIT 1",
                    (slug, user_id),
                )
                has_user = (await cur.fetchone()) is not None
                if not has_user:
                    await cur.execute(
                        "DELETE FROM docs_article_likes WHERE article_slug=%s AND visitor_id=%s",
                        (slug, visitor_id),
                    )
                    await cur.execute(
                        """
                        INSERT INTO docs_article_likes(article_slug, user_id, visitor_id)
                        VALUES(%s,%s,NULL)
                        ON DUPLICATE KEY UPDATE created_at = created_at
                        """,
                        (slug, user_id),
                    )
            await cur.execute(
                "SELECT COUNT(*) FROM docs_article_likes WHERE article_slug=%s",
                (slug,),
            )
            row = await cur.fetchone()
            count = int(row[0]) if row else 0

            liked = False
            if user_id:
                await cur.execute(
                    "SELECT 1 FROM docs_article_likes WHERE article_slug=%s AND user_id=%s LIMIT 1",
                    (slug, user_id),
                )
                liked = (await cur.fetchone()) is not None
            elif visitor_id:
                await cur.execute(
                    "SELECT 1 FROM docs_article_likes WHERE article_slug=%s AND visitor_id=%s LIMIT 1",
                    (slug, visitor_id),
                )
                liked = (await cur.fetchone()) is not None

    return {"count": count, "liked": liked}


@router.post("/{slug}/like", dependencies=[Depends(verify_same_origin)])
async def like_article(slug: str, request: Request, response: Response):
    """Setzt ein Like für den aktuellen Benutzer oder Besucher (idempotent)."""
    user_id = await _get_session_user_id(request)
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            if user_id:
                # Wenn zuvor ein Besucher-Like existierte, auf user_id migrieren
                visitor_token = request.cookies.get(VISITOR_COOKIE_NAME)
                visitor_id = _verify_visitor(visitor_token) if visitor_token else None
                if visitor_id:
                    await cur.execute(
                        "DELETE FROM docs_article_likes WHERE article_slug=%s AND visitor_id=%s",
                        (slug, visitor_id),
                    )
                # Idempotent via Upsert (verhindert Rennbedingungen)
                await cur.execute(
                    """
                    INSERT INTO docs_article_likes(article_slug, user_id, visitor_id)
                    VALUES(%s,%s,NULL)
                    ON DUPLICATE KEY UPDATE created_at = created_at
                    """,
                    (slug, user_id),
                )
            else:
                # Besucher-Like mit stabiler Besucher-ID
                visitor_id = _get_or_create_visitor_id(request, response)
                await cur.execute(
                    """
                    INSERT INTO docs_article_likes(article_slug, user_id, visitor_id)
                    VALUES(%s,NULL,%s)
                    ON DUPLICATE KEY UPDATE created_at = created_at
                    """,
                    (slug, visitor_id),
                )

            # Antwort mit aktuellem Zähler
            await cur.execute(
                "SELECT COUNT(*) FROM docs_article_likes WHERE article_slug=%s",
                (slug,),
            )
            row = await cur.fetchone()
            count = int(row[0]) if row else 0

    return {"ok": True, "count": count, "liked": True}


@router.delete("/{slug}/like", dependencies=[Depends(verify_same_origin)])
async def unlike_article(slug: str, request: Request):
    """Entfernt ein Like des aktuellen Benutzers/Besuchers (idempotent)."""
    user_id = await _get_session_user_id(request)
    visitor_id = None
    if not user_id:
        token = request.cookies.get(VISITOR_COOKIE_NAME)
        visitor_id = _verify_visitor(token) if token else None

    if not user_id and not visitor_id:
        # Nichts zu tun – idempotent
        return {"ok": True, "count": await _get_count(slug)}

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            if user_id:
                await cur.execute(
                    "DELETE FROM docs_article_likes WHERE article_slug=%s AND user_id=%s",
                    (slug, user_id),
                )
            else:
                await cur.execute(
                    "DELETE FROM docs_article_likes WHERE article_slug=%s AND visitor_id=%s",
                    (slug, visitor_id),
                )

            await cur.execute(
                "SELECT COUNT(*) FROM docs_article_likes WHERE article_slug=%s",
                (slug,),
            )
            row = await cur.fetchone()
            count = int(row[0]) if row else 0

    return {"ok": True, "count": count, "liked": False}


async def _get_count(slug: str) -> int:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM docs_article_likes WHERE article_slug=%s", (slug,))
            row = await cur.fetchone()
            return int(row[0]) if row else 0
