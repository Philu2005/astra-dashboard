import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Query

from app.auth.sessions import session_manager
from app.config import settings
from . import service
from .schemas import (
    TicketCreate,
    TicketDetail,
    TicketSummary,
    MessageCreate,
    TicketUpdateStatus,
    TicketCounters,
)


logger = logging.getLogger("astra.support")
router = APIRouter(prefix="/support", tags=["support"])

# Zentrale, erlaubte Kategorien (müssen mit dem Frontend übereinstimmen)
ALLOWED_CATEGORIES = {
    "Fehler melden",
    "Problem mit einem Befehl",
    "Problem mit einer Funktion",
    "Verbesserungsvorschlag",
    "Allgemeine Frage",
    "Sonstiges",
}


async def _require_session(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await session_manager.get_session(session_id, inactivity_timeout=settings.SESSION_INACTIVITY_TIMEOUT)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return session


def _is_admin(discord_user_id: str) -> bool:
    return discord_user_id == settings.ADMIN_DISCORD_ID


@router.get("/tickets", response_model=list[TicketSummary])
async def list_my_tickets(request: Request, offset: int = 0, limit: int = 50):
    session = await _require_session(request)
    rows = await service.list_user_tickets(session.user_id, offset=offset, limit=limit)
    return [
        TicketSummary(
            id=r[0], ticket_number=r[1], user_id=r[2], user_name=r[3], subject=r[4], category=r[5], status=r[6], created_at=r[7], updated_at=r[8]
        )
        for r in rows
    ]


@router.post("/tickets", response_model=TicketDetail)
async def create_ticket(request: Request, payload: TicketCreate):
    session = await _require_session(request)
    if payload.category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    ticket_id = await service.create_ticket(
        user_id=session.user_id,
        user_name=session.display_name or session.username,
        subject=payload.subject,
        category=payload.category,
        description=payload.description,
    )
    detail = await service.get_ticket_detail(ticket_id)
    assert detail is not None
    return TicketDetail(**detail)


@router.get("/tickets/{ticket_id}", response_model=TicketDetail)
async def get_ticket(request: Request, ticket_id: int):
    session = await _require_session(request)
    detail = await service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # owner or admin only
    owner_id = detail["user_id"]
    if session.user_id != owner_id and not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return TicketDetail(**detail)


@router.post("/tickets/{ticket_id}/reply", response_model=TicketDetail)
async def reply_ticket(request: Request, ticket_id: int, payload: MessageCreate):
    session = await _require_session(request)
    detail = await service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if detail["status"] == "closed":
        raise HTTPException(status_code=400, detail="Ticket is closed")
    owner_id = detail["user_id"]
    is_admin = _is_admin(session.user_id)
    if session.user_id != owner_id and not is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    await service.add_message(
        ticket_id=ticket_id,
        author_id=session.user_id,
        author_name=session.display_name or session.username,
        is_admin=is_admin,
        message=payload.message,
    )
    new_detail = await service.get_ticket_detail(ticket_id)
    assert new_detail is not None
    return TicketDetail(**new_detail)


# --- Admin endpoints ---


@router.get("/admin/counters", response_model=TicketCounters)
async def get_counters(request: Request):
    session = await _require_session(request)
    if not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return TicketCounters(**await service.counters())


@router.get("/admin/tickets", response_model=list[TicketSummary])
async def admin_list_tickets(
    request: Request,
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    offset: int = 0,
    limit: int = 50,
):
    session = await _require_session(request)
    if not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    rows = await service.list_all_tickets(status=status, category=category, search=search, offset=offset, limit=limit)
    return [
        TicketSummary(
            id=r[0], ticket_number=r[1], user_id=r[2], user_name=r[3], subject=r[4], category=r[5], status=r[6], created_at=r[7], updated_at=r[8]
        )
        for r in rows
    ]


@router.post("/admin/tickets/{ticket_id}/status", response_model=TicketDetail)
async def admin_set_status(request: Request, ticket_id: int, payload: TicketUpdateStatus):
    session = await _require_session(request)
    if not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    if payload.status not in ("open", "in_progress", "resolved", "closed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    await service.set_status(ticket_id, payload.status)
    detail = await service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketDetail(**detail)
