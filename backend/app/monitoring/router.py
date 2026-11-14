"""
Öffentliche und interne API-Endpunkte für das Monitoring-System.

Öffentliche Endpunkte sind ohne Authentifizierung zugänglich.
Der Heartbeat-Endpunkt erfordert den internen API-Key.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from app.config import settings
from app.monitoring import service

logger = logging.getLogger("astra.monitoring.router")

router = APIRouter(prefix="/status", tags=["Status"])


@router.get("/")
async def get_status_page():
    """Öffentlicher Endpunkt: Gesamtstatus für die Status Page."""
    try:
        data = await service.get_status_page_data()
        return data
    except Exception:
        logger.exception("Fehler beim Abrufen der Statusdaten")
        return {
            "overall": {
                "status": "unknown",
                "label": "Status nicht verfügbar",
                "services": [],
            },
            "incidents": [],
            "last_updated": None,
        }


@router.get("/services")
async def get_services_status():
    """Öffentlicher Endpunkt: Status aller Dienste."""
    try:
        services = await service.get_all_services_status()
        return {"services": services}
    except Exception:
        logger.exception("Fehler beim Abrufen der Dienststatus")
        return {"services": []}


@router.get("/incidents")
async def get_incidents():
    """Öffentlicher Endpunkt: Störungshistorie."""
    try:
        incidents = await service.get_public_incidents()
        return {"incidents": incidents}
    except Exception:
        logger.exception("Fehler beim Abrufen der Störungen")
        return {"incidents": []}


@router.post("/heartbeat")
async def receive_heartbeat(
    body: dict,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """Interner Endpunkt: Empfängt Heartbeats vom Astra Bot."""
    if not settings.ASTRA_INTERNAL_API_KEY:
        raise HTTPException(status_code=503, detail="Heartbeat-Authentifizierung nicht konfiguriert")

    if x_api_key != settings.ASTRA_INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Ungültiger API-Key")

    source = body.get("source", "astra_bot")
    status = body.get("status", "alive")
    details = body.get("details")

    await service.receive_heartbeat(source, status, details)
    return {"status": "ok"}
