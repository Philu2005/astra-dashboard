import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Query, Depends

from app.auth.sessions import session_manager
from app.config import settings
from app.security import verify_same_origin
from . import service
from .schemas import (
    TicketCreate,
    TicketDetail,
    TicketSummary,
    MessageCreate,
    TicketUpdateStatus,
    TicketCounters,
    TicketUpdatePriority,
    UserInfo,
    UserHistoryItem,
    OperationResult,
)


logger = logging.getLogger("astra.support")
router = APIRouter(prefix="/support", tags=["Support"])

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


@router.get(
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    "/tickets",
    response_model=list[TicketSummary],
    summary="Eigene Tickets auflisten",
    description="Gibt die Tickets des aktuell angemeldeten Benutzers paginiert zurück.",
    responses={
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
    },
)
async def list_my_tickets(
    request: Request,
    offset: int = Query(0, description="Anzahl zu überspringender Einträge für Pagination."),
    limit: int = Query(50, description="Maximale Anzahl zurückzugebender Einträge."),
):
    session = await _require_session(request)
    rows = await service.list_user_tickets(session.user_id, offset=offset, limit=limit)
    return [
        TicketSummary(
            id=r[0], ticket_number=r[1], user_id=r[2], user_name=r[3], subject=r[4], category=r[5], status=r[6], priority=r[7], created_at=r[8], updated_at=r[9]
        )
        for r in rows
    ]


@router.post(
    "/tickets",
    response_model=TicketDetail,
    dependencies=[Depends(verify_same_origin)],
    summary="Neues Ticket erstellen",
    description="Erstellt ein neues Support-Ticket für den angemeldeten Benutzer.",
    responses={
        400: {"description": "Ungültige Eingaben (z. B. Kategorie)."},
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
    },
)
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


@router.get(
    "/tickets/{ticket_id}",
    response_model=TicketDetail,
    summary="Ticket-Details abrufen",
    description="Liest die Details eines Tickets. Zugriff nur für Besitzer oder Admins.",
    responses={
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Kein Zugriff auf das Ticket."},
        404: {"description": "Ticket nicht gefunden."},
    },
)
async def get_ticket(request: Request, ticket_id: int):
    session = await _require_session(request)
    detail = await service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket not found")
    owner_id = detail["user_id"]
    if session.user_id != owner_id and not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return TicketDetail(**detail)


@router.post(
    "/tickets/{ticket_id}/reply",
    response_model=TicketDetail,
    dependencies=[Depends(verify_same_origin)],
    summary="Auf Ticket antworten",
    description="Fügt eine Antwort zum Ticket hinzu. Besitzer oder Admin erforderlich.",
    responses={
        400: {"description": "Ticket ist bereits gelöst."},
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Kein Zugriff auf das Ticket."},
        404: {"description": "Ticket nicht gefunden."},
    },
)
async def reply_ticket(request: Request, ticket_id: int, payload: MessageCreate):
    session = await _require_session(request)
    detail = await service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if detail["status"] == "resolved":
        raise HTTPException(status_code=400, detail="Ticket ist gelöst. Bitte öffne es erneut, um zu antworten.")
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


@router.post(
    "/tickets/{ticket_id}/reopen",
    response_model=TicketDetail,
    dependencies=[Depends(verify_same_origin)],
    summary="Ticket wieder öffnen",
    description="Öffnet ein gelöstes Ticket erneut. Nur der Ersteller darf dies durchführen.",
    responses={
        400: {"description": "Ticket ist nicht gelöst."},
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Nur der Ersteller darf das Ticket wieder öffnen."},
        404: {"description": "Ticket nicht gefunden."},
    },
)
async def reopen_ticket(request: Request, ticket_id: int):
    """Benutzer kann eigenes gelöstes Ticket wieder öffnen."""
    session = await _require_session(request)
    detail = await service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket not found")
    owner_id = detail["user_id"]
    if session.user_id != owner_id:
        raise HTTPException(status_code=403, detail="Nur der Ticket-Ersteller kann dieses Ticket wieder öffnen.")
    if detail["status"] != "resolved":
        raise HTTPException(status_code=400, detail="Nur gelöste Tickets können wieder geöffnet werden.")
    actor_name = session.display_name or session.username
    await service.set_status(ticket_id, "open", actor_name=actor_name)
    new_detail = await service.get_ticket_detail(ticket_id)
    assert new_detail is not None
    return TicketDetail(**new_detail)


# --- Admin endpoints ---


@router.get(
    "/admin/counters",
    response_model=TicketCounters,
    summary="Ticket-Zähler (Admin)",
    description="Aggregierte Zähler über alle Tickets (nur Admin).",
    responses={
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Nur für Admins."},
    },
)
async def get_counters(request: Request):
    session = await _require_session(request)
    if not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return TicketCounters(**await service.counters())


@router.get(
    "/admin/tickets",
    response_model=list[TicketSummary],
    summary="Tickets auflisten (Admin)",
    description="Listet Tickets mit Filtern/Pagination auf (nur Admin).",
    responses={
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Nur für Admins."},
    },
)
async def admin_list_tickets(
    request: Request,
    status: Optional[str] = Query(None, description="Status-Filter (open, in_progress, resolved)"),
    category: Optional[str] = Query(None, description="Kategorie-Filter"),
    priority: Optional[str] = Query(None, description="Priorität-Filter (low, normal, high, critical)"),
    search: Optional[str] = Query(None, description="Freitextsuche in Betreff/Name"),
    exclude_status: Optional[str] = Query(None, description="Diesen Status ausschließen"),
    offset: int = Query(0, description="Pagination: Anzahl zu überspringender Einträge"),
    limit: int = Query(50, description="Pagination: maximale Anzahl Einträge"),
):
    session = await _require_session(request)
    if not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    rows = await service.list_all_tickets(status=status, category=category, search=search, offset=offset, limit=limit, priority=priority, exclude_status=exclude_status)
    return [
        TicketSummary(
            id=r[0], ticket_number=r[1], user_id=r[2], user_name=r[3], subject=r[4], category=r[5], status=r[6], priority=r[7], created_at=r[8], updated_at=r[9]
        )
        for r in rows
    ]


@router.post(
    "/admin/tickets/{ticket_id}/status",
    response_model=TicketDetail,
    dependencies=[Depends(verify_same_origin)],
    summary="Ticket-Status setzen (Admin)",
    description="Setzt den Status eines Tickets auf open/in_progress/resolved (nur Admin).",
    responses={
        400: {"description": "Ungültiger Status."},
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Nur für Admins."},
        404: {"description": "Ticket nicht gefunden."},
    },
)
async def admin_set_status(request: Request, ticket_id: int, payload: TicketUpdateStatus):
    session = await _require_session(request)
    if not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    if payload.status not in ("open", "in_progress", "resolved"):
        raise HTTPException(status_code=400, detail="Invalid status")
    actor_name = "Astra Support"
    await service.set_status(ticket_id, payload.status, actor_name=actor_name)
    detail = await service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketDetail(**detail)


@router.post(
    "/admin/tickets/{ticket_id}/priority",
    response_model=TicketDetail,
    dependencies=[Depends(verify_same_origin)],
    summary="Ticket-Priorität setzen (Admin)",
    description="Setzt die Priorität eines Tickets (low/normal/high/critical).",
    responses={
        400: {"description": "Ungültige Priorität."},
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Nur für Admins."},
        404: {"description": "Ticket nicht gefunden."},
    },
)
async def admin_set_priority(request: Request, ticket_id: int, payload: TicketUpdatePriority):
    session = await _require_session(request)
    if not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    if payload.priority not in ("low", "normal", "high", "critical"):
        raise HTTPException(status_code=400, detail="Invalid priority")
    await service.set_priority(ticket_id, payload.priority)
    detail = await service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketDetail(**detail)


@router.delete(
    "/admin/tickets/{ticket_id}",
    dependencies=[Depends(verify_same_origin)],
    response_model=OperationResult,
    summary="Ticket löschen (Admin)",
    description="Löscht ein Ticket dauerhaft (nur Admin).",
    responses={
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Nur für Admins."},
        404: {"description": "Ticket nicht gefunden."},
    },
)
async def admin_delete_ticket(request: Request, ticket_id: int):
    session = await _require_session(request)
    if not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    owner = await service.get_ticket_owner(ticket_id)
    if owner is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    await service.delete_ticket(ticket_id)
    return {"ok": True}


@router.get(
    "/admin/tickets/{ticket_id}/user-info",
    response_model=UserInfo,
    summary="Benutzerinfo zum Ticket (Admin)",
    description="Liefert Profil- und Ticketstatistiken des Ticket-Erstellers (nur Admin).",
    responses={
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Nur für Admins."},
        404: {"description": "Ticket nicht gefunden."},
    },
)
async def admin_user_info(request: Request, ticket_id: int):
    session = await _require_session(request)
    if not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    detail = await service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket not found")
    user_id = detail["user_id"]
    profile = await service.get_user_profile(user_id)
    stats = await service.get_user_ticket_stats(user_id)
    return UserInfo(
        user_id=user_id,
        username=profile.get("username"),
        display_name=profile.get("display_name"),
        avatar_url=profile.get("avatar_url"),
        account_created_at=profile.get("account_created_at"),
        total_tickets=stats["total"],
        open_tickets=stats["open"],
        resolved_tickets=stats["resolved"],
        in_progress_tickets=stats["in_progress"],
        last_support_activity=stats["last_support_activity"],
    )


@router.get(
    "/admin/tickets/{ticket_id}/user-history",
    response_model=list[UserHistoryItem],
    summary="Ticket-Historie des Nutzers (Admin)",
    description="Gibt die Ticket-Historie des Ticket-Erstellers zurück (nur Admin).",
    responses={
        401: {"description": "Nicht angemeldet oder Session abgelaufen."},
        403: {"description": "Nur für Admins."},
        404: {"description": "Ticket nicht gefunden."},
    },
)
async def admin_user_history(request: Request, ticket_id: int):
    session = await _require_session(request)
    if not _is_admin(session.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    detail = await service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket not found")
    user_id = detail["user_id"]
    rows = await service.list_user_history(user_id=user_id, exclude_ticket_id=ticket_id)
    return [
        UserHistoryItem(
            id=r[0], ticket_number=r[1], subject=r[2], category=r[3], status=r[4], priority=r[5], created_at=r[6], updated_at=r[7]
        )
        for r in rows
    ]
