"""Dashboard-API-Endpunkte für das Ticket-Modul.

Kapselt die Kommunikation mit der internen Astra-API und stellt
authentifizierte, berechtigungsgeprüfte Endpunkte für das Frontend bereit.

Hinweis zur Panel-Veröffentlichung:
- Das Speichern der Konfiguration und die Veröffentlichung in Discord sind getrennte Aktionen.
- Die Verfügbarkeit einer persistierten Message-ID (panel_message_id) hängt davon ab,
  ob die Migration `20261117_add_ticketsystem_panel_msg_id.sql` ausgeführt wurde.
- Das Dashboard darf keinen erfolgreichen Veröffentlichungsstatus vortäuschen,
  wenn keine Message-ID verfügbar ist.
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from app.auth.sessions import session_manager
from app.config import settings
from app.services.astra_client import astra_client, AstraApiError
from app.tickets.schemas import (
    TicketConfigResponse,
    TicketConfigUpdateRequest,
    TicketLogDeleteResponse,
    TicketLogResponse,
    TicketLogUpdateRequest,
    TicketPanelConfigRequest,
    TicketPanelConfigResponse,
    TicketPanelDeleteResponse,
    TicketPanelPublishRequest,
    TicketPanelPublishResponse,
    TicketPanelStatusResponse,
    TicketPanelsResponse,
    TicketPanelUpdateRequest,
    TicketPanelUpdateResponse,
    TicketStatusResponse,
)

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])
logger = logging.getLogger("astra.tickets")


async def _get_user_id_from_session(request: Request) -> str:
    """Extrahiert die User-ID aus der aktiven Session."""
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
    """Wandelt AstraApiError in passende HTTPException um."""
    status_map = {401: 502, 403: 403, 404: 404, 503: 503, 504: 504}
    status = status_map.get(exc.status_code or 502, 502)
    return HTTPException(status_code=status, detail=str(exc))


# --- Ticket-Konfiguration ---

@router.get(
    "/config/{guild_id}",
    response_model=TicketConfigResponse,
    summary="Ticket-Konfiguration laden",
    description="Lädt die aktuelle Ticket-Konfiguration eines Servers. "
                "Erfordert eine gültige Session und Berechtigung für den Server.",
    responses={
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Keine ausreichenden Berechtigungen für diesen Server."},
        404: {"description": "Server nicht gefunden oder Astra nicht installiert."},
        502: {"description": "Kommunikationsfehler mit der internen Astra-API."},
        503: {"description": "Astra ist derzeit nicht erreichbar."},
    },
)
async def get_ticket_config(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        data = await astra_client.get_ticket_config(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    if isinstance(data, dict) and "config" not in data:
        return {"success": True, "config": data}
    return data


@router.put(
    "/config/{guild_id}",
    response_model=TicketConfigResponse,
    summary="Ticket-Konfiguration speichern",
    description="Speichert die Ticket-Konfiguration eines Servers. "
                "Dies speichert nur die Konfiguration – es wird kein Panel in Discord veröffentlicht. "
                "Für die Veröffentlichung muss der separate Publish-Endpunkt verwendet werden.",
    responses={
        400: {"description": "Ungültige Konfigurationsdaten."},
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Keine ausreichenden Berechtigungen."},
        404: {"description": "Server nicht gefunden."},
        502: {"description": "Kommunikationsfehler mit der internen Astra-API."},
    },
)
async def put_ticket_config(guild_id: str, request: Request, body: TicketConfigUpdateRequest) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        data = await astra_client.put_ticket_config(guild_id, user_id, body.config)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    if isinstance(data, dict) and "config" not in data:
        return {"success": True, "config": data}
    return data


# --- Ticket-Panels ---

@router.get(
    "/panels/{guild_id}",
    response_model=TicketPanelsResponse,
    summary="Ticket-Panels auflisten",
    description="Listet alle vorhandenen Ticket-Panels eines Servers auf. "
                "Jedes Panel kann eine panel_message_id enthalten, sofern die "
                "panelMsgID-Migration ausgeführt wurde.",
    responses={
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Keine Berechtigung."},
        404: {"description": "Server nicht gefunden."},
        502: {"description": "Kommunikationsfehler."},
    },
)
async def get_ticket_panels(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        data = await astra_client.get_ticket_panels(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    if isinstance(data, dict) and "panels" not in data:
        panels = data.get("data", []) if isinstance(data, dict) else []
        return {"success": True, "panels": panels}
    return data


@router.post(
    "/panels/{guild_id}/publish",
    response_model=TicketPanelPublishResponse,
    summary="Ticket-Panel veröffentlichen",
    description="Löst die Veröffentlichung eines Ticket-Panels in Discord aus. "
                "Der Astra-Bot erstellt eine Discord-Nachricht mit Embed und TicketOpenView. "
                "Erfolg bedeutet, dass die Veröffentlichung ausgelöst wurde – "
                "die tatsächliche Erstellung der Discord-Nachricht erfolgt asynchron über den Bot. "
                "Wenn bereits ein Panel veröffentlicht wurde (panel_message_id vorhanden), "
                "sollte stattdessen der Update-Endpunkt verwendet werden, um Doppelveröffentlichungen zu vermeiden.",
    responses={
        400: {"description": "Ungültige Anfrage (z.B. fehlende channel_id)."},
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Keine Berechtigung oder fehlende Bot-Berechtigungen im Zielkanal."},
        404: {"description": "Server oder Kanal nicht gefunden."},
        502: {"description": "Kommunikationsfehler oder Veröffentlichung fehlgeschlagen."},
    },
)
async def publish_ticket_panel(guild_id: str, request: Request, body: TicketPanelPublishRequest) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    payload: dict[str, Any] = {"channel_id": body.channel_id}
    if body.title is not None:
        payload["title"] = body.title
    if body.description is not None:
        payload["description"] = body.description
    try:
        data = await astra_client.publish_ticket_panel(guild_id, user_id, payload)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    result: dict[str, Any] = {"success": True, "message": "Veröffentlichung ausgelöst."}
    if isinstance(data, dict):
        if "panel_message_id" in data:
            result["panel_message_id"] = data["panel_message_id"]
        if "message" in data:
            result["message"] = data["message"]
    return result


@router.put(
    "/panels/{guild_id}/{channel_id}/update",
    response_model=TicketPanelUpdateResponse,
    summary="Veröffentlichtes Ticket-Panel aktualisieren",
    description="Aktualisiert eine bereits veröffentlichte Panel-Nachricht in Discord, "
                "anstatt eine neue Nachricht zu erstellen. Setzt voraus, dass ein Panel "
                "bereits veröffentlicht wurde und eine Message-ID bekannt ist.",
    responses={
        400: {"description": "Ungültige Anfrage."},
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Keine Berechtigung."},
        404: {"description": "Panel oder Kanal nicht gefunden."},
        502: {"description": "Aktualisierung fehlgeschlagen."},
    },
)
async def update_ticket_panel(guild_id: str, channel_id: str, request: Request, body: TicketPanelUpdateRequest) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    payload: dict[str, Any] = {}
    if body.title is not None:
        payload["title"] = body.title
    if body.description is not None:
        payload["description"] = body.description
    try:
        data = await astra_client.update_ticket_panel(guild_id, channel_id, user_id, payload)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    return {"success": True, "message": data.get("message", "Panel aktualisiert.") if isinstance(data, dict) else "Panel aktualisiert."}


@router.put(
    "/panels/{guild_id}/{channel_id}/config",
    response_model=TicketPanelConfigResponse,
    summary="Panel-Konfiguration ändern und verschieben",
    description="Ändert die Konfiguration eines Panels und verschiebt es optional in einen anderen Kanal.",
    responses={
        400: {"description": "Ungültige Anfrage."},
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Keine Berechtigung."},
        404: {"description": "Panel oder Kanal nicht gefunden."},
        502: {"description": "Kommunikationsfehler."},
    },
)
async def update_ticket_panel_config(guild_id: str, channel_id: str, request: Request, body: TicketPanelConfigRequest) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    payload: dict[str, Any] = {}
    for field in ("channel_id", "support_role_id", "category_id", "topic", "title", "description",
                  "embed_color", "footer", "image_url", "thumbnail_url", "button_label", "button_emoji"):
        val = getattr(body, field, None)
        if val is not None:
            payload[field] = val
    try:
        data = await astra_client.update_ticket_panel_config(guild_id, channel_id, user_id, payload)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    result: dict[str, Any] = {"success": True, "message": "Panel-Konfiguration aktualisiert."}
    if isinstance(data, dict):
        if "channel_id" in data:
            result["channel_id"] = data["channel_id"]
        if "panel_message_id" in data:
            result["panel_message_id"] = data["panel_message_id"]
        if "message" in data:
            result["message"] = data["message"]
    return result


@router.delete(
    "/panels/{guild_id}/{channel_id}/{message_id}",
    response_model=TicketPanelDeleteResponse,
    summary="Ticket-Panel löschen",
    description="Löscht ein Ticket-Panel (Discord-Nachricht und Konfiguration).",
    responses={
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Keine Berechtigung."},
        404: {"description": "Panel nicht gefunden."},
        502: {"description": "Kommunikationsfehler."},
    },
)
async def delete_ticket_panel(guild_id: str, channel_id: str, message_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        data = await astra_client.delete_ticket_panel(guild_id, channel_id, message_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    return {"success": True, "message": data.get("message", "Panel gelöscht.") if isinstance(data, dict) else "Panel gelöscht."}


@router.get(
    "/panels/{guild_id}/status",
    response_model=TicketPanelStatusResponse,
    summary="Veröffentlichungsstatus abrufen",
    description="Liefert den Veröffentlichungsstatus der Ticket-Panels eines Servers. "
                "Die Verfügbarkeit von Message-IDs hängt von der panelMsgID-Migration ab. "
                "Wenn die Migration nicht ausgeführt wurde, kann der Status unvollständig sein.",
    responses={
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Keine Berechtigung."},
        404: {"description": "Server nicht gefunden."},
        502: {"description": "Kommunikationsfehler."},
    },
)
async def get_ticket_panels_status(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        data = await astra_client.get_ticket_panels_status(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    if isinstance(data, dict) and "status" not in data:
        return {"success": True, "status": data}
    return data


# --- Offene Tickets ---

@router.get(
    "/status/{guild_id}",
    response_model=TicketStatusResponse,
    summary="Offene Tickets abrufen",
    description="Liefert eine Liste der aktuell offenen Tickets eines Servers.",
    responses={
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Keine Berechtigung."},
        404: {"description": "Server nicht gefunden."},
        502: {"description": "Kommunikationsfehler."},
    },
)
async def get_ticket_status(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        data = await astra_client.get_ticket_status(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    if isinstance(data, dict) and "tickets" not in data:
        tickets = data.get("data", []) if isinstance(data, dict) else []
        return {"success": True, "tickets": tickets}
    return data


# --- Ticket-Log ---

@router.get(
    "/log/{guild_id}",
    response_model=TicketLogResponse,
    summary="Ticket-Log-Konfiguration laden",
    description="Lädt die aktuelle Ticket-Log-Kanal-Konfiguration eines Servers.",
    responses={
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Keine Berechtigung."},
        404: {"description": "Server nicht gefunden."},
        502: {"description": "Kommunikationsfehler."},
    },
)
async def get_ticket_log(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        data = await astra_client.get_ticket_log(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    if isinstance(data, dict):
        return {"success": True, "channel_id": data.get("channel_id")}
    return {"success": True, "channel_id": None}


@router.put(
    "/log/{guild_id}",
    response_model=TicketLogResponse,
    summary="Ticket-Log-Kanal setzen",
    description="Setzt oder ändert den Ticket-Log-Kanal eines Servers.",
    responses={
        400: {"description": "Ungültige Kanal-ID."},
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Keine Berechtigung."},
        404: {"description": "Server nicht gefunden."},
        502: {"description": "Kommunikationsfehler."},
    },
)
async def put_ticket_log(guild_id: str, request: Request, body: TicketLogUpdateRequest) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        data = await astra_client.put_ticket_log(guild_id, user_id, body.channel_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    if isinstance(data, dict):
        return {"success": True, "channel_id": data.get("channel_id", body.channel_id)}
    return {"success": True, "channel_id": body.channel_id}


@router.delete(
    "/log/{guild_id}",
    response_model=TicketLogDeleteResponse,
    summary="Ticket-Log-Konfiguration entfernen",
    description="Entfernt die Ticket-Log-Kanal-Konfiguration eines Servers.",
    responses={
        401: {"description": "Nicht angemeldet."},
        403: {"description": "Keine Berechtigung."},
        404: {"description": "Server nicht gefunden."},
        502: {"description": "Kommunikationsfehler."},
    },
)
async def delete_ticket_log(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        await astra_client.delete_ticket_log(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
    return {"success": True, "message": "Ticket-Log-Konfiguration entfernt."}
