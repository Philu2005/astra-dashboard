"""Pydantic-Schemas für das Monitoring-System."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ServiceStatus(BaseModel):
    id: int
    name: str
    description: str
    service_type: str
    current_status: str  # operational, degraded, outage, unknown
    uptime_percent: float
    response_time_ms: Optional[float] = None
    last_check: Optional[datetime] = None
    daily_history: list[dict]  # [{date, status, uptime_percent}] 90 Tage


class OverallStatus(BaseModel):
    status: str  # operational, degraded, outage, unknown
    label: str
    services: list[ServiceStatus]


class IncidentPublic(BaseModel):
    id: int
    service_name: str
    title: str
    status: str  # investigating, identified, monitoring, resolved
    started_at: datetime
    resolved_at: Optional[datetime] = None
    description: str


class StatusPageResponse(BaseModel):
    overall: OverallStatus
    incidents: list[IncidentPublic]
    last_updated: datetime
