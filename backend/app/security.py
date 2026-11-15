import logging
from fastapi import HTTPException, Request
from app.config import settings

logger = logging.getLogger("astra.security")


async def verify_same_origin(request: Request) -> None:
    """
    Zentrale Browser-Origin-Prüfung für CSRF-Schutz.

    - Liest den Origin-Header aus.
    - Vergleicht ihn exakt mit settings.CORS_ORIGINS.
    - Fehlt der Origin oder ist nicht erlaubt → 403.

    Hinweis: Diese Prüfung ist für browserbasierte, session-authentifizierte
    Schreibzugriffe gedacht und kann als FastAPI-Dependency genutzt werden.
    """
    origin = request.headers.get("origin")
    if not origin:
        logger.warning("Anfrage ohne Origin-Header blockiert (Pfad: %s)", request.url.path)
        raise HTTPException(status_code=403, detail="Forbidden origin")

    # Exakter Abgleich – keine Wildcards, keine Teilstring-Vergleiche
    if origin not in settings.CORS_ORIGINS:
        logger.warning("Anfrage mit nicht erlaubter Origin blockiert: %s (Pfad: %s)", origin, request.url.path)
        raise HTTPException(status_code=403, detail="Forbidden origin")

    # Erfolgsfall: einfach zurückkehren
    return None
