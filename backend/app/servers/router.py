import logging

from fastapi import APIRouter, HTTPException, Request
from app.config import settings
from app.auth.sessions import session_manager
from app.services.astra_client import astra_client, AstraApiError

router = APIRouter(prefix="/api", tags=["Servers"])
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


@router.get(
    "/servers",
    summary="Eigene Server auflisten",
    description=(
        "Gibt die Liste der Discord‑Server (Guilds) zurück, auf denen der Benutzer berechtigt ist. "
        "Die Daten werden vom Astra Bot (Internal API) abgerufen und unverändert durchgereicht."
    ),
    responses={
        200: {"description": "Liste der Server wurde erfolgreich geladen.", "content": {"application/json": {"example": {"servers": [{"id": "123456789012345678", "name": "Beispielserver", "icon": "https://cdn.discordapp.com/icons/.../icon.png"}]}}}},
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Zugriff verweigert (Upstream)."},
        404: {"description": "Nicht gefunden (Upstream)."},
        502: {"description": "Interner Fehler bei der Upstream‑Kommunikation."},
        503: {"description": "Upstream nicht verfügbar."},
        504: {"description": "Upstream‑Timeout."},
    },
)
async def get_servers(request: Request):
    user_id = await _get_user_id_from_session(request)

    try:
        data = await astra_client.get_servers(user_id)
    except AstraApiError as exc:
        logger.warning("Serverliste konnte nicht geladen werden: %s", exc)
        raise _handle_astra_error(exc)

    return data


@router.get(
    "/servers/{guild_id}",
    summary="Serverdetails abrufen",
    description=(
        "Gibt Details zu einem Discord‑Server (Guild) zurück. "
        "Die Antwortstruktur stammt direkt vom Astra Bot (Internal API)."
    ),
    responses={
        200: {"description": "Serverdetails geladen.", "content": {"application/json": {"example": {"id": "123456789012345678", "name": "Beispielserver", "owner_id": "987654321098765432"}}}},
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Kein Zugriff auf diesen Server (Upstream)."},
        404: {"description": "Server nicht gefunden (Upstream)."},
        502: {"description": "Interner Fehler bei der Upstream‑Kommunikation."},
        503: {"description": "Upstream nicht verfügbar."},
        504: {"description": "Upstream‑Timeout."},
    },
)
async def get_server(guild_id: str, request: Request):
    user_id = await _get_user_id_from_session(request)
    logger.info("Serverlisten-Anfrage für Discord-User-ID: %s", user_id)

    try:
        data = await astra_client.get_server(guild_id, user_id)
    except AstraApiError as exc:
        logger.warning("Serverdetails konnten nicht geladen werden (guild=%s): %s", guild_id, exc)
        raise _handle_astra_error(exc)

    return data


@router.get(
    "/servers/{guild_id}/roles",
    summary="Serverrollen abrufen",
    description=(
        "Gibt die Rollen (Roles) eines Discord‑Servers zurück. "
        "Antwortstruktur kommt direkt vom Astra Bot (Internal API)."
    ),
    responses={
        200: {"description": "Rollenliste geladen.", "content": {"application/json": {"example": {"roles": [{"id": "1", "name": "Admin"}, {"id": "2", "name": "Member"}]}}}},
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Kein Zugriff auf diesen Server (Upstream)."},
        404: {"description": "Server/Rollen nicht gefunden (Upstream)."},
        502: {"description": "Interner Fehler bei der Upstream‑Kommunikation."},
        503: {"description": "Upstream nicht verfügbar."},
        504: {"description": "Upstream‑Timeout."},
    },
)
async def get_server_roles(guild_id: str, request: Request):
    user_id = await _get_user_id_from_session(request)

    try:
        data = await astra_client.get_server_roles(guild_id, user_id)
    except AstraApiError as exc:
        logger.warning("Serverrollen konnten nicht geladen werden (guild=%s): %s", guild_id, exc)
        raise _handle_astra_error(exc)

    return data


@router.get(
    "/servers/{guild_id}/channels",
    summary="Serverkanäle abrufen",
    description=(
        "Gibt die Kanäle eines Discord‑Servers zurück (Text/Voice/Forum etc.). "
        "Antwortstruktur kommt direkt vom Astra Bot (Internal API)."
    ),
    responses={
        200: {"description": "Kanalliste geladen.", "content": {"application/json": {"example": {"channels": [
            {"id": "123", "name": "ticket-support", "type": 0, "parent_id": "999"}
        ]}}}},
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Kein Zugriff auf diesen Server (Upstream)."},
        404: {"description": "Server/Kanäle nicht gefunden (Upstream)."},
        502: {"description": "Interner Fehler bei der Upstream‑Kommunikation."},
        503: {"description": "Upstream nicht verfügbar."},
        504: {"description": "Upstream‑Timeout."},
    },
)
async def get_server_channels(guild_id: str, request: Request):
    user_id = await _get_user_id_from_session(request)

    try:
        data = await astra_client.get_server_channels(guild_id, user_id)
    except AstraApiError as exc:
        logger.warning("Serverkanäle konnten nicht geladen werden (guild=%s): %s", guild_id, exc)
        raise _handle_astra_error(exc)

    return data


@router.get(
    "/servers/{guild_id}/categories",
    summary="Serverkategorien abrufen",
    description=(
        "Gibt die Kanal‑Kategorien eines Discord‑Servers zurück. "
        "Antwortstruktur kommt direkt vom Astra Bot (Internal API)."
    ),
    responses={
        200: {"description": "Kategorien geladen.", "content": {"application/json": {"example": {"categories": [
            {"id": "999", "name": "Support"}
        ]}}}},
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Kein Zugriff auf diesen Server (Upstream)."},
        404: {"description": "Server/Kategorien nicht gefunden (Upstream)."},
        502: {"description": "Interner Fehler bei der Upstream‑Kommunikation."},
        503: {"description": "Upstream nicht verfügbar."},
        504: {"description": "Upstream‑Timeout."},
    },
)
async def get_server_categories(guild_id: str, request: Request):
    user_id = await _get_user_id_from_session(request)

    try:
        data = await astra_client.get_server_categories(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)

    return data


@router.get("/servers/{guild_id}/members/lookup")
async def get_members_lookup(guild_id: str, request: Request, member_ids: str):
    """
    Sucht nach mehreren Discord-Mitgliedern einer Guild (Batch-Lookup).
    member_ids: Kommagetrennte Liste von IDs.
    """
    user_id = await _get_user_id_from_session(request)

    # IDs validieren
    ids_list = [mid.strip() for mid in member_ids.split(",") if mid.strip()]
    if not ids_list:
        raise HTTPException(status_code=400, detail="Keine Member-IDs angegeben.")

    if len(ids_list) > 100:  # Etwas Puffer, Bot-API hat 50er Limit
        raise HTTPException(status_code=400, detail="Zu viele IDs auf einmal (max 100).")

    try:
        # AstraClient.get_members_lookup übernimmt das Batching nicht selbst, 
        # sondern leitet die Anfrage 1:1 weiter. Da die Bot-API 50 IDs pro Request 
        # erlaubt, sollte das Frontend idealerweise bereits batchen, 
        # aber wir können hier auch eine einfache Aufteilung machen, falls nötig.
        # Laut Aufgabe soll das Frontend Batches bilden.
        data = await astra_client.get_members_lookup(guild_id, user_id, ids_list)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)

    return data


@router.get(
    "/dashboard/stats",
    summary="Dashboard‑Statistiken abrufen",
    description=(
        "Gibt aggregierte Statistiken für das Dashboard zurück (z. B. Counters/Verläufe). "
        "Antwortstruktur wird vom Astra Bot geliefert und unverändert durchgereicht."
    ),
    responses={
        200: {"description": "Statistiken geladen.", "content": {"application/json": {"example": {"users": 1200, "guilds": 85, "commands_today": 3421}}}},
        401: {"description": "Nicht angemeldet."},
        502: {"description": "Interner Fehler bei der Upstream‑Kommunikation."},
        503: {"description": "Upstream nicht verfügbar."},
        504: {"description": "Upstream‑Timeout."},
    },
)
async def get_dashboard_stats(request: Request):
    await _get_user_id_from_session(request)

    try:
        data = await astra_client.get_dashboard_stats()
    except AstraApiError as exc:
        logger.warning("Dashboard-Statistiken konnten nicht geladen werden: %s", exc)
        raise _handle_astra_error(exc)

    return data


@router.get(
    "/status",
    summary="Astra Bot Status abrufen",
    description=(
        "Öffentlicher Endpunkt: Liefert den aktuellen Status der Astra‑Dienste gemäß Internal API."
    ),
    responses={
        200: {"description": "Statusdaten geladen.", "content": {"application/json": {"example": {"ok": True, "version": "1.2.3"}}}},
        403: {"description": "Zugriff verweigert (Upstream)."},
        404: {"description": "Nicht gefunden (Upstream)."},
        502: {"description": "Interner Fehler bei der Upstream‑Kommunikation."},
        503: {"description": "Upstream nicht verfügbar."},
        504: {"description": "Upstream‑Timeout."},
    },
)
async def get_astra_status():
    try:
        data = await astra_client.get_status()
    except AstraApiError as exc:
        logger.warning("Astra-Status konnte nicht abgefragt werden: %s", exc)
        raise _handle_astra_error(exc)

    return data


@router.get(
    "/statistics/commands",
    summary="Globale Befehlsstatistiken (7 Tage)",
    description=(
        "Gibt die globalen Command‑Statistiken der letzten 7 Tage zurück. "
        "Erfordert gültige Dashboard‑Session; Daten stammen direkt vom Astra Bot."
    ),
    responses={
        200: {"description": "Statistiken geladen.", "content": {"application/json": {"example": {"days": [{"date": "2026-11-10", "count": 1234}]}}}},
        401: {"description": "Nicht angemeldet."},
        502: {"description": "Interner Fehler bei der Upstream‑Kommunikation."},
        503: {"description": "Upstream nicht verfügbar."},
        504: {"description": "Upstream‑Timeout."},
    },
)
async def get_global_command_statistics(request: Request):
    """Gibt die globalen Command-Statistiken (letzte 7 Tage) zurück.

    Erfordert eine gültige Dashboard-Session. Ruft serverseitig die Internal API auf
    und gibt die validierten Daten ohne Secrets an den Browser weiter.
    """
    await _get_user_id_from_session(request)

    try:
        data = await astra_client.get_command_statistics()
    except AstraApiError as exc:
        logger.warning("Command-Statistiken konnten nicht geladen werden: %s", exc)
        raise _handle_astra_error(exc)

    return data
