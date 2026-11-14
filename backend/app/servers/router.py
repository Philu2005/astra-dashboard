import logging

from fastapi import APIRouter, HTTPException, Request
from app.config import settings
from app.auth.sessions import session_manager
from app.services.astra_client import astra_client, AstraApiError

router = APIRouter(prefix="/api")
logger = logging.getLogger("astra.servers")


async def _get_user_id_from_session(request: Request) -> str:
    """Ermittelt die Discord-User-ID aus der validierten Session."""
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Nicht angemeldet.")

    session = await session_manager.get_session(
        session_id,
        inactivity_timeout=settings.SESSION_INACTIVITY_TIMEOUT,
    )
    if not session:
        raise HTTPException(status_code=401, detail="Sitzung abgelaufen oder ungültig.")

    return session.user_id


def _handle_astra_error(exc: AstraApiError) -> HTTPException:
    """Wandelt AstraApiError in eine sichere HTTP-Antwort um."""
    status_map = {
        401: 502,  # Interner Auth-Fehler → Bad Gateway für den Client
        403: 403,
        404: 404,
        503: 503,
        504: 504,
    }
    status = status_map.get(exc.status_code or 502, 502)
    return HTTPException(status_code=status, detail=str(exc))


@router.get("/servers")
async def get_servers(request: Request):
    user_id = await _get_user_id_from_session(request)

    try:
        data = await astra_client.get_servers(user_id)
    except AstraApiError as exc:
        logger.warning("Serverliste konnte nicht geladen werden: %s", exc)
        raise _handle_astra_error(exc)

    return data


@router.get("/servers/{guild_id}")
async def get_server(guild_id: str, request: Request):
    user_id = await _get_user_id_from_session(request)
    logger.info("Serverlisten-Anfrage für Discord-User-ID: %s", user_id)

    try:
        data = await astra_client.get_server(guild_id, user_id)
    except AstraApiError as exc:
        logger.warning("Serverdetails konnten nicht geladen werden (guild=%s): %s", guild_id, exc)
        raise _handle_astra_error(exc)

    return data


@router.get("/servers/{guild_id}/roles")
async def get_server_roles(guild_id: str, request: Request):
    user_id = await _get_user_id_from_session(request)

    try:
        data = await astra_client.get_server_roles(guild_id, user_id)
    except AstraApiError as exc:
        logger.warning("Serverrollen konnten nicht geladen werden (guild=%s): %s", guild_id, exc)
        raise _handle_astra_error(exc)

    return data


@router.get("/status")
async def get_astra_status():
    try:
        data = await astra_client.get_status()
    except AstraApiError as exc:
        logger.warning("Astra-Status konnte nicht abgefragt werden: %s", exc)
        raise _handle_astra_error(exc)

    return data
