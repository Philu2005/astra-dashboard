import logging
from typing import Any, Optional

import httpx
from app.config import settings

logger = logging.getLogger("astra.internal_api")


class AstraApiError(Exception):
    """Fehler bei der Kommunikation mit der internen Astra Bot API."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class AstraClient:
    """Zentraler Client für die Kommunikation mit der internen Astra Bot API."""

    def __init__(self):
        self.base_url = settings.ASTRA_INTERNAL_API_URL.rstrip("/")
        self.api_key = settings.ASTRA_INTERNAL_API_KEY
        self.timeout = httpx.Timeout(10.0, connect=5.0)

    def _auth_headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}"}

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[dict[str, str]] = None,
        json: Optional[dict[str, Any]] = None,
        authenticated: bool = True,
    ) -> Any:
        url = f"{self.base_url}{path}"
        headers = self._auth_headers() if authenticated else {}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(method, url, params=params, headers=headers, json=json)
        except httpx.ConnectError:
            logger.warning("Astra Bot API nicht erreichbar: %s", url)
            raise AstraApiError("Astra ist derzeit nicht erreichbar.", status_code=503)
        except httpx.TimeoutException:
            logger.warning("Timeout bei Anfrage an Astra Bot API: %s", url)
            raise AstraApiError("Zeitüberschreitung bei der Verbindung zu Astra.", status_code=504)
        except httpx.HTTPError as exc:
            logger.warning("HTTP-Fehler bei Astra-Anfrage: %s (%s)", url, exc.__class__.__name__)
            raise AstraApiError("Kommunikationsfehler mit Astra.", status_code=502)

        if response.status_code == 401:
            logger.error("Astra Bot API: Ungültiger API-Schlüssel")
            raise AstraApiError("Interner Authentifizierungsfehler.", status_code=401)

        if response.status_code == 403:
            raise AstraApiError("Keine ausreichenden Berechtigungen.", status_code=403)

        if response.status_code == 404:
            raise AstraApiError("Server nicht gefunden oder Astra nicht installiert.", status_code=404)

        if response.status_code == 503:
            raise AstraApiError("Astra ist derzeit nicht bereit.", status_code=503)

        if response.status_code >= 500:
            logger.warning("Astra Bot API: Interner Fehler (HTTP %s)", response.status_code)
            raise AstraApiError("Interner Fehler auf Astra-Seite.", status_code=response.status_code)

        if response.status_code >= 400:
            logger.warning("Astra Bot API: Fehlerhafte Anfrage (HTTP %s)", response.status_code)
            raise AstraApiError("Ungültige Anfrage.", status_code=response.status_code)

        try:
            data = response.json()
        except ValueError:
            logger.warning("Astra Bot API: Ungültige JSON-Antwort von %s", url)
            raise AstraApiError("Ungültige Antwort von Astra.", status_code=502)

        return data

    async def get_status(self) -> dict[str, Any]:
        """GET /status – ohne Authentifizierung."""
        return await self._request("GET", "/status", authenticated=False)

    async def get_servers(self, user_id: str) -> dict[str, Any]:
        """GET /servers?user_id=<user_id>"""
        return await self._request("GET", "/servers", params={"user_id": user_id})

    async def get_server(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /servers/{guild_id}?user_id=<user_id>"""
        return await self._request("GET", f"/servers/{guild_id}", params={"user_id": user_id})

    async def get_server_roles(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /servers/{guild_id}/roles?user_id=<user_id>"""
        return await self._request("GET", f"/servers/{guild_id}/roles", params={"user_id": user_id})

    async def get_server_channels(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /servers/{guild_id}/channels?user_id=<user_id>

        Liefert die Kanäle (inkl. Typ/Kategoriebezug) eines Discord‑Servers.
        Die Antwortstruktur wird von der internen Astra‑API vorgegeben und ungeändert durchgereicht.
        """
        return await self._request("GET", f"/servers/{guild_id}/channels", params={"user_id": user_id})

    async def get_server_categories(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /servers/{guild_id}/categories?user_id=<user_id>

        Liefert die Kanal‑Kategorien eines Discord‑Servers.
        """
        return await self._request("GET", f"/servers/{guild_id}/categories", params={"user_id": user_id})

    async def get_dashboard_stats(self) -> dict[str, Any]:
        """GET /dashboard/stats – Globale Statistiken von der Bot-API."""
        data = await self._request("GET", "/dashboard/stats")

        # Antwort validieren
        if not isinstance(data, dict) or "stats" not in data:
            logger.warning("Astra Bot API: Unerwartetes Antwortformat von /dashboard/stats")
            raise AstraApiError("Ungültige Statistik-Antwort von Astra.", status_code=502)

        stats = data["stats"]
        if not isinstance(stats, dict):
            raise AstraApiError("Ungültige Statistik-Antwort von Astra.", status_code=502)

        return {
            "stats": {
                "users": stats.get("users", 0),
                "guilds": stats.get("guilds", 0),
                "commands": stats.get("commands", 0),
            },
            "last_successful_sync": data.get("last_successful_sync"),
            "stale": data.get("stale", False),
        }

    async def get_command_statistics(self) -> dict[str, Any]:
        """GET /statistics/commands – Globale Command-Nutzung (letzte 7 Tage)."""
        data = await self._request("GET", "/statistics/commands")

        # Erwartetes Format validieren
        if not isinstance(data, dict):
            raise AstraApiError("Ungültige Antwort von Astra.", status_code=502)

        period = data.get("period")
        total = data.get("total")
        days = data.get("data")

        if period != "7d" or not isinstance(total, int) or not isinstance(days, list) or len(days) != 7:
            logger.warning("Astra Bot API: Unerwartetes Antwortformat von /statistics/commands")
            raise AstraApiError("Ungültige Statistik-Antwort von Astra.", status_code=502)

        for day in days:
            if not isinstance(day, dict):
                raise AstraApiError("Ungültige Statistik-Antwort von Astra.", status_code=502)
            if not all(k in day for k in ("date", "weekday", "count")):
                raise AstraApiError("Ungültige Statistik-Antwort von Astra.", status_code=502)
            if not isinstance(day["date"], str) or not isinstance(day["weekday"], str) or not isinstance(day["count"], int):
                raise AstraApiError("Ungültige Statistik-Antwort von Astra.", status_code=502)

        return {"period": period, "total": total, "data": days}

    # --- Moderation: AutoMod ---
    async def get_automod_config(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /moderation/automod/{guild_id}?user_id=<user_id>"""
        return await self._request("GET", f"/moderation/automod/{guild_id}", params={"user_id": user_id})

    async def put_automod_config(self, guild_id: str, user_id: str, config: dict[str, Any]) -> dict[str, Any]:
        """PUT /moderation/automod/{guild_id}?user_id=<user_id> { json: config }"""
        return await self._request(
            "PUT",
            f"/moderation/automod/{guild_id}",
            params={"user_id": user_id},
            json=config,
        )

    # --- Moderation: Modlog ---
    async def get_modlog(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /moderation/modlog/{guild_id}?user_id=<user_id>"""
        return await self._request("GET", f"/moderation/modlog/{guild_id}", params={"user_id": user_id})

    async def put_modlog(self, guild_id: str, user_id: str, channel_id: str) -> dict[str, Any]:
        """PUT /moderation/modlog/{guild_id}?user_id=<user_id> { json: { channel_id } }"""
        return await self._request(
            "PUT",
            f"/moderation/modlog/{guild_id}",
            params={"user_id": user_id},
            json={"channel_id": channel_id},
        )

    async def delete_modlog(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """DELETE /moderation/modlog/{guild_id}?user_id=<user_id>"""
        return await self._request("DELETE", f"/moderation/modlog/{guild_id}", params={"user_id": user_id})

    # --- Moderation: Warns ---
    async def get_warns(self, guild_id: str, member_id: str, user_id: str) -> dict[str, Any]:
        """GET /moderation/warns/{guild_id}/{member_id}?user_id=<user_id>"""
        return await self._request(
            "GET",
            f"/moderation/warns/{guild_id}/{member_id}",
            params={"user_id": user_id},
        )

    async def delete_warn(self, guild_id: str, member_id: str, user_id: str, warn_id: Optional[str] = None, delete_all: bool = False) -> dict[str, Any]:
        """DELETE /moderation/warns/{guild_id}/{member_id}?user_id=<user_id>&warn_id=... or &all=true"""
        params: dict[str, str] = {"user_id": user_id}
        if delete_all:
            params["all"] = "true"
        if warn_id:
            params["warn_id"] = warn_id
        return await self._request(
            "DELETE",
            f"/moderation/warns/{guild_id}/{member_id}",
            params=params,
        )

    async def get_warns_guild(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /moderation/warns/{guild_id}?user_id=<user_id>

        Liefert alle Verwarnungen einer Guild (userID ASC, warnID DESC sortiert lt. Bot‑API).
        """
        return await self._request(
            "GET",
            f"/moderation/warns/{guild_id}",
            params={"user_id": user_id},
        )

    async def delete_warns_guild(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """DELETE /moderation/warns/{guild_id}?user_id=<user_id>

        Löscht alle Verwarnungen einer Guild transaktional.
        """
        return await self._request(
            "DELETE",
            f"/moderation/warns/{guild_id}",
            params={"user_id": user_id},
        )


    # --- Tickets ---

    async def get_ticket_config(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /tickets/config/{guild_id}?user_id=<user_id>"""
        return await self._request("GET", f"/tickets/config/{guild_id}", params={"user_id": user_id})

    async def put_ticket_config(self, guild_id: str, user_id: str, config: dict[str, Any]) -> dict[str, Any]:
        """PUT /tickets/config/{guild_id}?user_id=<user_id>"""
        return await self._request("PUT", f"/tickets/config/{guild_id}", params={"user_id": user_id}, json=config)

    async def get_ticket_panels(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /tickets/panels/{guild_id}?user_id=<user_id>"""
        return await self._request("GET", f"/tickets/panels/{guild_id}", params={"user_id": user_id})

    async def publish_ticket_panel(self, guild_id: str, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """POST /tickets/panels/{guild_id}/publish?user_id=<user_id>"""
        return await self._request("POST", f"/tickets/panels/{guild_id}/publish", params={"user_id": user_id}, json=payload)

    async def update_ticket_panel(self, guild_id: str, channel_id: str, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """PUT /tickets/panels/{guild_id}/{channel_id}/update?user_id=<user_id>"""
        return await self._request("PUT", f"/tickets/panels/{guild_id}/{channel_id}/update", params={"user_id": user_id}, json=payload)

    async def delete_ticket_panel(self, guild_id: str, channel_id: str, message_id: str, user_id: str) -> dict[str, Any]:
        """DELETE /tickets/panels/{guild_id}/{channel_id}/{message_id}?user_id=<user_id>"""
        return await self._request("DELETE", f"/tickets/panels/{guild_id}/{channel_id}/{message_id}", params={"user_id": user_id})

    async def update_ticket_panel_config(self, guild_id: str, channel_id: str, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """PUT /tickets/panels/{guild_id}/{channel_id}/config?user_id=<user_id>"""
        return await self._request("PUT", f"/tickets/panels/{guild_id}/{channel_id}/config", params={"user_id": user_id}, json=payload)

    async def get_ticket_panels_status(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /tickets/panels/{guild_id}/status?user_id=<user_id>"""
        return await self._request("GET", f"/tickets/panels/{guild_id}/status", params={"user_id": user_id})

    async def get_ticket_status(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /tickets/status/{guild_id}?user_id=<user_id>"""
        return await self._request("GET", f"/tickets/status/{guild_id}", params={"user_id": user_id})

    async def get_ticket_log(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """GET /tickets/log/{guild_id}?user_id=<user_id>"""
        return await self._request("GET", f"/tickets/log/{guild_id}", params={"user_id": user_id})

    async def put_ticket_log(self, guild_id: str, user_id: str, channel_id: str) -> dict[str, Any]:
        """PUT /tickets/log/{guild_id}?user_id=<user_id>"""
        return await self._request("PUT", f"/tickets/log/{guild_id}", params={"user_id": user_id}, json={"channel_id": channel_id})

    async def delete_ticket_log(self, guild_id: str, user_id: str) -> dict[str, Any]:
        """DELETE /tickets/log/{guild_id}?user_id=<user_id>"""
        return await self._request("DELETE", f"/tickets/log/{guild_id}", params={"user_id": user_id})

    # --- Moderation: Member Lookup ---
    async def get_members_lookup(self, guild_id: str, user_id: str, member_ids: list[str]) -> dict[str, Any]:
        """GET /moderation/members/lookup/{guild_id}?user_id=<user_id>&member_ids=id1,id2..."""
        params = {
            "user_id": user_id,
            "member_ids": ",".join(member_ids)
        }
        return await self._request("GET", f"/moderation/members/lookup/{guild_id}", params=params)


astra_client = AstraClient()
