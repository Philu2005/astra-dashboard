from __future__ import annotations

from typing import Literal, Optional, List
from pydantic import BaseModel, Field, constr


TicketStatus = Literal["open", "in_progress", "resolved", "closed"]
TicketPriority = Literal["low", "normal", "high", "critical"]


class TicketBase(BaseModel):
    subject: constr(strip_whitespace=True, min_length=5, max_length=200)
    category: constr(strip_whitespace=True, min_length=3, max_length=50)


class TicketCreate(TicketBase):
    description: constr(strip_whitespace=True, min_length=10, max_length=8000)


class TicketUpdateStatus(BaseModel):
    status: TicketStatus


class TicketSummary(BaseModel):
    id: int
    ticket_number: str
    user_id: str
    user_name: str
    subject: str
    category: str
    status: TicketStatus
    priority: TicketPriority = Field(default="normal")
    created_at: str
    updated_at: str


class MessageCreate(BaseModel):
    message: constr(strip_whitespace=True, min_length=1, max_length=8000)


class Message(BaseModel):
    id: int
    author_id: str
    author_name: str
    is_admin: bool
    message: str
    created_at: str


class TicketDetail(BaseModel):
    id: int
    ticket_number: str
    user_id: str
    user_name: str
    subject: str
    category: str
    status: TicketStatus
    priority: TicketPriority = Field(default="normal")
    created_at: str
    updated_at: str
    closed_at: Optional[str] = None
    messages: List[Message] = Field(default_factory=list)


class TicketUpdatePriority(BaseModel):
    priority: TicketPriority


class UserInfo(BaseModel):
    user_id: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    account_created_at: Optional[str] = None
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    closed_tickets: int
    last_support_activity: Optional[str] = None


class UserHistoryItem(BaseModel):
    id: int
    ticket_number: str
    subject: str
    category: str
    status: TicketStatus
    priority: TicketPriority
    created_at: str
    updated_at: str


class TicketCounters(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    closed: int
