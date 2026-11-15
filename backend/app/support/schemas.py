from __future__ import annotations

from typing import Literal, Optional, List
from pydantic import BaseModel, Field, constr


TicketStatus = Literal["open", "in_progress", "resolved"]
TicketPriority = Literal["low", "normal", "high", "critical"]
MessageType = Literal["user", "support", "system"]


class TicketBase(BaseModel):
    subject: constr(strip_whitespace=True, min_length=5, max_length=200)
    category: constr(strip_whitespace=True, min_length=3, max_length=50)


class TicketCreate(TicketBase):
    description: constr(strip_whitespace=True, min_length=10, max_length=8000)
    
    class Config:
        schema_extra = {
            "example": {
                "subject": "Befehl /stats hängt",
                "category": "Problem mit einem Befehl",
                "description": "Beim Ausführen von /stats kommt keine Antwort seit gestern Abend."
            }
        }


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

    class Config:
        schema_extra = {
            "example": {
                "id": 42,
                "ticket_number": "AST-2026-00123",
                "user_id": "1234567890",
                "user_name": "Alex",
                "subject": "Befehl /stats hängt",
                "category": "Problem mit einem Befehl",
                "status": "open",
                "priority": "normal",
                "created_at": "2026-11-10T08:30:00Z",
                "updated_at": "2026-11-12T17:05:00Z"
            }
        }


class MessageCreate(BaseModel):
    message: constr(strip_whitespace=True, min_length=1, max_length=8000)

    class Config:
        schema_extra = {
            "example": {
                "message": "Gibt es ein Update zu meinem Problem?"
            }
        }


class Message(BaseModel):
    id: int
    author_id: str
    author_name: str
    is_admin: bool
    message: str
    message_type: MessageType = Field(default="user")
    event_type: Optional[str] = None
    created_at: str

    class Config:
        schema_extra = {
            "example": {
                "id": 7,
                "author_id": "1234567890",
                "author_name": "Alex",
                "is_admin": False,
                "message": "Beim Ausführen von /stats kommt keine Antwort.",
                "message_type": "user",
                "created_at": "2026-11-12T16:55:00Z"
            }
        }


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

    class Config:
        schema_extra = {
            "example": {
                "id": 42,
                "ticket_number": "AST-2026-00123",
                "user_id": "1234567890",
                "user_name": "Alex",
                "subject": "Befehl /stats hängt",
                "category": "Problem mit einem Befehl",
                "status": "open",
                "priority": "normal",
                "created_at": "2026-11-10T08:30:00Z",
                "updated_at": "2026-11-12T17:05:00Z",
                "messages": [
                    {
                        "id": 7,
                        "author_id": "1234567890",
                        "author_name": "Alex",
                        "is_admin": False,
                        "message": "Beim Ausführen von /stats kommt keine Antwort.",
                        "message_type": "user",
                        "created_at": "2026-11-12T16:55:00Z"
                    }
                ]
            }
        }


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
    in_progress_tickets: int
    last_support_activity: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "user_id": "1234567890",
                "username": "alex",
                "display_name": "Alex",
                "avatar_url": "https://cdn.discordapp.com/avatars/1234567890/hash.png",
                "account_created_at": "2020-05-01T12:00:00Z",
                "total_tickets": 12,
                "open_tickets": 2,
                "resolved_tickets": 9,
                "in_progress_tickets": 1,
                "last_support_activity": "2026-11-12T17:05:00Z"
            }
        }


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

    class Config:
        schema_extra = {
            "example": {
                "total": 120,
                "open": 35,
                "in_progress": 12,
                "resolved": 73
            }
        }


class OperationResult(BaseModel):
    ok: bool = Field(description="Operation erfolgreich ausgeführt")
    
    class Config:
        schema_extra = {"example": {"ok": True}}
