"""
Persistente MySQL-basierte Session-Verwaltung für das Astra Dashboard.

Alle Tokens (Session, OAuth-State, Exchange) werden ausschließlich als SHA-256-Hashes gespeichert.
"""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from pydantic import BaseModel

from app.database import get_pool

logger = logging.getLogger("astra.sessions")


def _hash_token(token: str) -> str:
    """SHA-256-Hash eines Tokens für die Datenbank."""
    return hashlib.sha256(token.encode()).hexdigest()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SessionData(BaseModel):
    user_id: str
    username: str
    display_name: str
    avatar_url: Optional[str]
    expires_at: float
    last_active: float


class SessionManager:
    """Async MySQL-basierter Session-Manager."""

    async def create_session(self, user_data: Dict[str, Any], max_age: int) -> str:
        """Erstellt eine neue Session und gibt den Klartext-Token zurück."""
        token = secrets.token_urlsafe(32)
        token_hash = _hash_token(token)
        now = _utcnow()
        expires_at = now + timedelta(seconds=max_age)

        user_id = user_data.get("id")
        avatar_hash = user_data.get("avatar")
        if avatar_hash:
            avatar_url = f"https://cdn.discordapp.com/avatars/{user_id}/{avatar_hash}.png"
        else:
            default_avatar_index = (int(user_id) >> 22) % 6
            avatar_url = f"https://cdn.discordapp.com/embed/avatars/{default_avatar_index}.png"

        username = user_data.get("username", "")
        display_name = user_data.get("global_name") or username

        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """INSERT INTO dashboard_sessions
                       (session_token_hash, user_id, username, display_name, avatar_url, created_at, last_active, expires_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (token_hash, user_id, username, display_name, avatar_url, now, now, expires_at),
                )

        return token

    async def get_session(self, token: str, inactivity_timeout: int = 0) -> Optional[SessionData]:
        """Gibt SessionData zurück oder None wenn ungültig/abgelaufen."""
        token_hash = _hash_token(token)
        now = _utcnow()

        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """SELECT user_id, username, display_name, avatar_url, expires_at, last_active
                       FROM dashboard_sessions
                       WHERE session_token_hash = %s""",
                    (token_hash,),
                )
                row = await cur.fetchone()

        if not row:
            return None

        user_id, username, display_name, avatar_url, expires_at, last_active = row

        # Naive datetimes aus MySQL als UTC interpretieren
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if last_active.tzinfo is None:
            last_active = last_active.replace(tzinfo=timezone.utc)

        if now > expires_at:
            # Abgelaufene Session löschen
            async with pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        "DELETE FROM dashboard_sessions WHERE session_token_hash = %s",
                        (token_hash,),
                    )
            return None

        if inactivity_timeout > 0:
            inactivity_limit = last_active + timedelta(seconds=inactivity_timeout)
            if now > inactivity_limit:
                async with pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        await cur.execute(
                            "DELETE FROM dashboard_sessions WHERE session_token_hash = %s",
                            (token_hash,),
                        )
                return None

        # last_active aktualisieren, aber nicht über expires_at hinaus
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "UPDATE dashboard_sessions SET last_active = %s WHERE session_token_hash = %s",
                    (now, token_hash),
                )

        return SessionData(
            user_id=user_id,
            username=username,
            display_name=display_name,
            avatar_url=avatar_url,
            expires_at=expires_at.timestamp(),
            last_active=now.timestamp(),
        )

    async def delete_session(self, token: str) -> None:
        """Invalidiert eine Session sofort."""
        token_hash = _hash_token(token)
        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "DELETE FROM dashboard_sessions WHERE session_token_hash = %s",
                    (token_hash,),
                )

    async def create_state(self) -> str:
        """Erstellt einen OAuth2-State und gibt den Klartext zurück."""
        state = secrets.token_urlsafe(16)
        state_hash = _hash_token(state)
        now = _utcnow()
        expires_at = now + timedelta(seconds=600)

        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO oauth_states (state_hash, expires_at, created_at) VALUES (%s, %s, %s)",
                    (state_hash, expires_at, now),
                )

        return state

    async def verify_state(self, state: str) -> bool:
        """Validiert und konsumiert einen OAuth2-State atomar (einmalig)."""
        state_hash = _hash_token(state)
        now = _utcnow()

        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                # Atomar löschen und prüfen ob Zeile existierte
                await cur.execute(
                    "DELETE FROM oauth_states WHERE state_hash = %s AND expires_at >= %s",
                    (state_hash, now),
                )
                return cur.rowcount > 0

    async def create_exchange_token(self, session_token: str) -> str:
        """Erstellt ein einmaliges Exchange-Token für den Session-Token."""
        token = secrets.token_urlsafe(32)
        token_hash = _hash_token(token)
        session_token_hash = _hash_token(session_token)
        now = _utcnow()
        expires_at = now + timedelta(seconds=60)

        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """INSERT INTO oauth_exchange_tokens
                       (token_hash, session_token_hash, expires_at, created_at)
                       VALUES (%s, %s, %s, %s)""",
                    (token_hash, session_token_hash, expires_at, now),
                )

        return token

    async def exchange_token(self, token: str) -> Optional[str]:
        """Konsumiert ein Exchange-Token atomar.

        Generiert einen neuen Session-Token, aktualisiert den Hash in der
        Session-Tabelle und gibt den neuen Klartext-Token zurück (für das Cookie).
        """
        token_hash = _hash_token(token)
        now = _utcnow()

        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.begin()
            try:
                async with conn.cursor() as cur:
                    await cur.execute(
                        """SELECT session_token_hash FROM oauth_exchange_tokens
                           WHERE token_hash = %s AND expires_at >= %s""",
                        (token_hash, now),
                    )
                    row = await cur.fetchone()

                    if not row:
                        await conn.rollback()
                        return None

                    old_session_hash = row[0]

                    # Exchange-Token löschen (einmalig)
                    await cur.execute(
                        "DELETE FROM oauth_exchange_tokens WHERE token_hash = %s",
                        (token_hash,),
                    )

                    # Neuen Session-Token generieren und Hash in der Session aktualisieren
                    new_session_token = secrets.token_urlsafe(32)
                    new_session_hash = _hash_token(new_session_token)

                    await cur.execute(
                        """UPDATE dashboard_sessions
                           SET session_token_hash = %s
                           WHERE session_token_hash = %s""",
                        (new_session_hash, old_session_hash),
                    )

                    if cur.rowcount == 0:
                        await conn.rollback()
                        return None

                await conn.commit()
            except Exception:
                await conn.rollback()
                raise

            return new_session_token

    async def cleanup(self) -> None:
        """Bereinigt abgelaufene Sessions, States und Exchange-Tokens."""
        now = _utcnow()
        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("DELETE FROM dashboard_sessions WHERE expires_at < %s", (now,))
                deleted_sessions = cur.rowcount

                await cur.execute("DELETE FROM oauth_states WHERE expires_at < %s", (now,))
                deleted_states = cur.rowcount

                await cur.execute("DELETE FROM oauth_exchange_tokens WHERE expires_at < %s", (now,))
                deleted_tokens = cur.rowcount

        if deleted_sessions or deleted_states or deleted_tokens:
            logger.info(
                "Bereinigung: %d Sessions, %d States, %d Exchange-Tokens entfernt",
                deleted_sessions, deleted_states, deleted_tokens,
            )


session_manager = SessionManager()
