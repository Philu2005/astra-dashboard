import logging
from typing import Dict, Any, Optional

import httpx
from app.config import settings

logger = logging.getLogger("astra.auth")

class DiscordService:
    def __init__(self):
        self.timeout = httpx.Timeout(10.0, connect=5.0)

    async def exchange_code(self, code: str) -> Optional[str]:
        data = {
            "client_id": settings.DISCORD_CLIENT_ID,
            "client_secret": settings.DISCORD_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.DISCORD_REDIRECT_URI
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(settings.DISCORD_TOKEN_URL, data=data, headers=headers)
        except httpx.HTTPError as exc:
            logger.warning("Token-Austausch mit Discord fehlgeschlagen: Netzwerk/HTTP-Fehler (%s)", exc.__class__.__name__)
            return None

        if response.status_code != 200:
            logger.warning(
                "Token-Austausch mit Discord fehlgeschlagen: HTTP %s – Antwort: %s",
                response.status_code,
                response.text[:500]
            )
            return None

        try:
            token_data = response.json()
        except ValueError:
            logger.warning("Token-Austausch mit Discord fehlgeschlagen: Ungültige JSON-Antwort")
            return None

        access_token = token_data.get("access_token")
        if not access_token:
            logger.warning("Token-Austausch mit Discord fehlgeschlagen: Kein Access-Token in Antwort")
            return None

        return access_token

    async def get_user_profile(self, access_token: str) -> Optional[Dict[str, Any]]:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{settings.DISCORD_API_BASE_URL}/users/@me", headers=headers)
        except httpx.HTTPError as exc:
            logger.warning("Discord-Benutzerprofil konnte nicht geladen werden: Netzwerk/HTTP-Fehler (%s)", exc.__class__.__name__)
            return None

        if response.status_code != 200:
            logger.warning("Discord-Benutzerprofil konnte nicht geladen werden: HTTP %s", response.status_code)
            return None

        try:
            user_profile = response.json()
        except ValueError:
            logger.warning("Discord-Benutzerprofil konnte nicht geladen werden: Ungültige JSON-Antwort")
            return None

        if not user_profile.get("id") or not user_profile.get("username"):
            logger.warning("Discord-Benutzerprofil konnte nicht geladen werden: Pflichtfelder fehlen")
            return None

        return user_profile

discord_service = DiscordService()
