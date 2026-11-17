import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from app.auth.sessions import session_manager
from app.config import settings
from app.services.astra_client import astra_client, AstraApiError


router = APIRouter(prefix="/api/moderation", tags=["Moderation"])
logger = logging.getLogger("astra.moderation")


async def _get_user_id_from_session(request: Request) -> str:
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
    status_map = {401: 502, 403: 403, 404: 404, 503: 503, 504: 504}
    status = status_map.get(exc.status_code or 502, 502)
    return HTTPException(status_code=status, detail=str(exc))


# --- AutoMod ---
@router.get("/automod/{guild_id}")
async def get_automod(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        data = await astra_client.get_automod_config(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)

    # Die interne API liefert {rules, capslock, blacklist, ...} flach.
    # Das Frontend erwartet {success, config: {rules, capslock, blacklist}}.
    if isinstance(data, dict) and "config" not in data:
        return {"success": True, "config": data}
    return data


@router.put("/automod/{guild_id}")
async def put_automod(guild_id: str, request: Request, body: dict[str, Any]) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)

    # Nur die von der internen API unterstützten Felder weiterleiten.
    # Interne API erwartet: rules, capslock: {enabled, percent}, blacklist: {enabled}
    payload: dict[str, Any] = {}
    if "rules" in body:
        payload["rules"] = body["rules"]
    if "capslock" in body:
        payload["capslock"] = body["capslock"]
    if "blacklist" in body:
        payload["blacklist"] = body["blacklist"]

    try:
        data = await astra_client.put_automod_config(guild_id, user_id, payload)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)

    if isinstance(data, dict) and "config" not in data:
        return {"success": True, "config": data}
    return data


# --- Modlog ---
@router.get("/modlog/{guild_id}")
async def get_modlog(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        return await astra_client.get_modlog(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)


@router.put("/modlog/{guild_id}")
async def put_modlog(guild_id: str, request: Request, body: dict[str, Any]) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    channel_id = body.get("channel_id")
    if not isinstance(channel_id, str) or not channel_id:
        raise HTTPException(status_code=400, detail="Ungültige Kanal-ID.")
    try:
        return await astra_client.put_modlog(guild_id, user_id, channel_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)


@router.delete("/modlog/{guild_id}")
async def delete_modlog(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        return await astra_client.delete_modlog(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)


# --- Warns ---
@router.get("/warns/{guild_id}")
async def get_guild_warns(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        return await astra_client.get_warns_guild(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)

@router.delete("/warns/{guild_id}")
async def delete_guild_warns(guild_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        return await astra_client.delete_warns_guild(guild_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)

@router.get("/warns/{guild_id}/{member_id}")
async def get_warns(guild_id: str, member_id: str, request: Request) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        return await astra_client.get_warns(guild_id, member_id, user_id)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)


@router.delete("/warns/{guild_id}/{member_id}")
async def delete_warns(guild_id: str, member_id: str, request: Request, warn_id: str | None = None, all: bool = False) -> dict[str, Any]:
    user_id = await _get_user_id_from_session(request)
    try:
        return await astra_client.delete_warn(guild_id, member_id, user_id, warn_id=warn_id, delete_all=all)
    except AstraApiError as exc:
        raise _handle_astra_error(exc)
