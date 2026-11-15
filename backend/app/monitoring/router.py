"""
Öffentliche und interne API-Endpunkte für das Monitoring-System.

Öffentliche Endpunkte sind ohne Authentifizierung zugänglich.
Der Heartbeat-Endpunkt erfordert den internen API-Key.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.monitoring import service

logger = logging.getLogger("astra.monitoring.router")

class HeartbeatOk(BaseModel):
    status: str = Field(description="Ergebnisstatus des Heartbeat-Aufrufs", default="ok")


router = APIRouter(prefix="/status", tags=["Monitoring"])


@router.get(
    "/",
    summary="Gesamtstatus abrufen",
    description=(
        "Öffentlicher Endpunkt: Aggregierter Gesamtstatus für die öffentliche Statusseite. "
        "Liefert bei Fehlern ein Fallback‑Objekt mit 'unknown'."
    ),
    responses={
        200: {"description": "Statusdaten erfolgreich geliefert."},
    },
)
async def get_status_page():
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


@router.get(
    "/services",
    summary="Dienststatus abrufen",
    description="Öffentlicher Endpunkt: Liefert den Status aller überwachten Dienste.",
    responses={
        200: {"description": "Liste der Dienste mit Status."},
    },
)
async def get_services_status():
    try:
        services = await service.get_all_services_status()
        return {"services": services}
    except Exception:
        logger.exception("Fehler beim Abrufen der Dienststatus")
        return {"services": []}


@router.get(
    "/incidents",
    summary="Störungshistorie abrufen",
    description="Öffentlicher Endpunkt: Gibt die bekannten Störungen/Incidents zurück.",
    responses={
        200: {"description": "Liste der bekannten Incidents."},
    },
)
async def get_incidents():
    try:
        incidents = await service.get_public_incidents()
        return {"incidents": incidents}
    except Exception:
        logger.exception("Fehler beim Abrufen der Störungen")
        return {"incidents": []}


@router.post(
    "/heartbeat",
    response_model=HeartbeatOk,
    summary="Heartbeat empfangen (intern)",
    description=(
        "Interner Endpunkt: Empfängt Heartbeats vom Astra Bot. "
        "Erfordert den internen API‑Key im Header 'X-API-Key'."
    ),
    responses={
        200: {"description": "Heartbeat akzeptiert.", "content": {"application/json": {"example": {"status": "ok"}}}},
        401: {"description": "Ungültiger oder fehlender API‑Key."},
        503: {"description": "Heartbeat‑Authentifizierung serverseitig nicht konfiguriert."},
    },
)
async def receive_heartbeat(
    body: dict,
    x_api_key: Optional[str] = Header(
        None,
        alias="X-API-Key",
        description="Interner API‑Key für Heartbeat‑Authentifizierung",
        example="xxxxxxxxxxxxxxxx",
    ),
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
