import logging
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Query, Request, Response, Depends
from fastapi.responses import RedirectResponse

from app.config import settings
from app.auth.sessions import session_manager
from app.auth.service import discord_service
from app.security import verify_same_origin

router = APIRouter(prefix="/auth")
logger = logging.getLogger("astra.auth")


def _build_login_error_redirect(error_code: str) -> RedirectResponse:
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error={error_code}")


@router.get("/discord/login")
async def login(response: Response):
    state = await session_manager.create_state()
    logger.info("OAuth2-Login gestartet")

    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": "identify",
        "state": state,
        "prompt": "consent"
    }

    auth_url = f"{settings.DISCORD_AUTHORIZE_URL}?{urlencode(params)}"

    redirect_response = RedirectResponse(url=auth_url)
    redirect_response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="lax",
        max_age=600,
        path="/",
    )
    return redirect_response


@router.get("/discord/callback")
async def callback(
    request: Request,
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    error_description: str = Query(None)
):
    logger.info("OAuth2-Callback erreicht")

    if error:
        logger.warning("OAuth2-Callback mit Fehler: %s", error)
        return _build_login_error_redirect(error)

    # Validate state (cookie + server-side store)
    cookie_state = request.cookies.get("oauth_state")
    if not state or not cookie_state or state != cookie_state:
        logger.warning("OAuth2-State-Validierung fehlgeschlagen")
        return _build_login_error_redirect("invalid_state")

    if not await session_manager.verify_state(state):
        logger.warning("OAuth2-State ungültig oder abgelaufen")
        return _build_login_error_redirect("expired_state")

    if not code:
        logger.warning("OAuth2-Callback ohne Authorization Code")
        return _build_login_error_redirect("missing_code")

    # Exchange code for token
    access_token = await discord_service.exchange_code(code)
    if not access_token:
        return _build_login_error_redirect("token_exchange_failed")

    logger.info("OAuth2-Token-Austausch erfolgreich")

    # Get user profile
    user_data = await discord_service.get_user_profile(access_token)
    if not user_data:
        return _build_login_error_redirect("user_fetch_failed")

    logger.info("Discord-Benutzerprofil geladen für User-ID: %s", user_data.get("id"))

    # Create session
    session_token = await session_manager.create_session(user_data, settings.SESSION_MAX_AGE)
    logger.info("Session erstellt")

    # Create exchange token for cross-origin cookie setting
    exchange_token = await session_manager.create_exchange_token(session_token)
    logger.info("Exchange-Token erstellt, leite zum Frontend weiter")

    redirect_response = RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/callback?token={exchange_token}")
    redirect_response.delete_cookie("oauth_state", path="/")

    return redirect_response


@router.post("/exchange", dependencies=[Depends(verify_same_origin)])
async def exchange(request: Request, response: Response):
    """Exchange a one-time token for a session cookie (called from frontend same-origin)."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request body")

    token = body.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    session_token = await session_manager.exchange_token(token)
    if not session_token:
        logger.warning("Exchange-Token ungültig oder abgelaufen")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    session = await session_manager.get_session(session_token)
    if not session:
        raise HTTPException(status_code=401, detail="Session not found")

    response.set_cookie(
        key="session_id",
        value=session_token,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="lax",
        max_age=settings.SESSION_MAX_AGE,
        path="/",
    )
    logger.info("Session-Cookie über Token-Exchange ausgestellt")

    return {
        "authenticated": True,
        "user": {
            "id": session.user_id,
            "username": session.username,
            "display_name": session.display_name,
            "avatar_url": session.avatar_url
        }
    }


@router.get("/me")
async def me(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await session_manager.get_session(
        session_id,
        inactivity_timeout=settings.SESSION_INACTIVITY_TIMEOUT,
    )
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    return {
        "authenticated": True,
        "user": {
            "id": session.user_id,
            "username": session.username,
            "display_name": session.display_name,
            "avatar_url": session.avatar_url
        }
    }


@router.post("/logout", dependencies=[Depends(verify_same_origin)])
async def logout(request: Request, response: Response):

    session_id = request.cookies.get("session_id")
    if session_id:
        await session_manager.delete_session(session_id)
        logger.info("Logout: Session invalidiert")
    else:
        logger.info("Logout ohne bestehende Session")

    response.delete_cookie("session_id", path="/", samesite="lax", secure=settings.SESSION_COOKIE_SECURE, httponly=True)
    return {"success": True}
