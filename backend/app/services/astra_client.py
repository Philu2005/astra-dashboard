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
        authenticated: bool = True,
    ) -> Any:
        url = f"{self.base_url}{path}"
        headers = self._auth_headers() if authenticated else {}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(method, url, params=params, headers=headers)
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


astra_client = AstraClient()
