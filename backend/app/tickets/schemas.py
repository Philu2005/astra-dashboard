"""Pydantic-Modelle für die Ticket-API-Endpunkte."""

from typing import Any, Optional
from pydantic import BaseModel, Field


# --- Ticket-Konfiguration ---

class TicketConfigResponse(BaseModel):
    """Antwort beim Laden der Ticket-Konfiguration."""
    success: bool = True
    config: dict[str, Any] = Field(
        ...,
        description="Ticket-Konfiguration des Servers. Die genauen Felder werden von der internen Astra-API bestimmt.",
    )


class TicketConfigUpdateRequest(BaseModel):
    """Request zum Aktualisieren der Ticket-Konfiguration."""
    config: dict[str, Any] = Field(
        ...,
        description="Zu aktualisierende Konfigurationsfelder.",
    )


# --- Ticket-Panels ---

class TicketPanelsResponse(BaseModel):
    """Antwort beim Auflisten der Ticket-Panels."""
    success: bool = True
    panels: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Liste der Ticket-Panels. Jedes Panel kann panel_message_id enthalten, sofern verfügbar.",
    )


class TicketPanelPublishRequest(BaseModel):
    """Request zum Veröffentlichen eines Ticket-Panels in Discord."""
    channel_id: str = Field(..., description="Zielkanal-ID für die Veröffentlichung.")
    title: Optional[str] = Field(None, description="Optionaler Titel des Panel-Embeds.")
    description: Optional[str] = Field(None, description="Optionale Beschreibung des Panel-Embeds.")
    support_role_id: Optional[str] = Field(None, description="Support-Rollen-ID.")
    category_id: Optional[str] = Field(None, description="Ticket-Kategorie-ID.")


class TicketPanelPublishResponse(BaseModel):
    """Antwort nach dem Auslösen einer Panel-Veröffentlichung."""
    success: bool = True
    message: str = Field(
        default="Veröffentlichung ausgelöst.",
        description="Statusnachricht. Hinweis: Erfolg bedeutet, dass die Veröffentlichung ausgelöst wurde – "
                    "nicht zwingend, dass die Discord-Nachricht bereits erstellt wurde.",
    )
    panel_message_id: Optional[str] = Field(
        None,
        description="Message-ID der veröffentlichten Discord-Nachricht, sofern verfügbar. "
                    "Abhängig von der panelMsgID-Migration.",
    )


class TicketPanelUpdateRequest(BaseModel):
    """Request zum Aktualisieren eines bereits veröffentlichten Panels."""
    title: Optional[str] = Field(None, description="Neuer Titel des Panel-Embeds.")
    description: Optional[str] = Field(None, description="Neue Beschreibung des Panel-Embeds.")


class TicketPanelUpdateResponse(BaseModel):
    """Antwort nach dem Aktualisieren eines veröffentlichten Panels."""
    success: bool = True
    message: str = "Panel aktualisiert."


class TicketPanelConfigRequest(BaseModel):
    """Request zum Ändern der Panel-Konfiguration (inkl. Verschieben)."""
    channel_id: Optional[str] = Field(None, description="Neuer Zielkanal (zum Verschieben).")
    support_role_id: Optional[str] = Field(None, description="Support-Rollen-ID.")
    category_id: Optional[str] = Field(None, description="Ticket-Kategorie-ID.")
    topic: Optional[str] = Field(None, description="Thema des Panels.")
    title: Optional[str] = Field(None, description="Panel-Titel.")
    description: Optional[str] = Field(None, description="Panel-Beschreibung.")


class TicketPanelConfigResponse(BaseModel):
    """Antwort nach dem Ändern der Panel-Konfiguration."""
    success: bool = True
    message: str = "Panel-Konfiguration aktualisiert."
    channel_id: Optional[str] = Field(None, description="Neue Channel-ID nach Verschieben.")
    panel_message_id: Optional[str] = Field(None, description="Neue Message-ID nach Verschieben.")


class TicketPanelDeleteResponse(BaseModel):
    """Antwort nach dem Löschen eines Panels."""
    success: bool = True
    message: str = "Panel gelöscht."


class TicketPanelStatusResponse(BaseModel):
    """Veröffentlichungsstatus der Ticket-Panels."""
    success: bool = True
    status: dict[str, Any] = Field(
        default_factory=dict,
        description="Veröffentlichungsstatus. Enthält Informationen zu veröffentlichten Panels und Message-IDs, "
                    "sofern die panelMsgID-Migration ausgeführt wurde.",
    )


# --- Offene Tickets ---

class TicketStatusResponse(BaseModel):
    """Antwort mit offenen Tickets eines Servers."""
    success: bool = True
    tickets: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Liste offener Tickets mit relevanten Informationen.",
    )


# --- Ticket-Log ---

class TicketLogResponse(BaseModel):
    """Antwort beim Laden der Ticket-Log-Konfiguration."""
    success: bool = True
    channel_id: Optional[str] = Field(
        None,
        description="Kanal-ID des konfigurierten Ticket-Log-Kanals. Null wenn nicht konfiguriert.",
    )


class TicketLogUpdateRequest(BaseModel):
    """Request zum Setzen des Ticket-Log-Kanals."""
    channel_id: str = Field(..., description="Kanal-ID des gewünschten Log-Kanals.")


class TicketLogDeleteResponse(BaseModel):
    """Antwort nach dem Entfernen der Ticket-Log-Konfiguration."""
    success: bool = True
    message: str = "Ticket-Log-Konfiguration entfernt."
