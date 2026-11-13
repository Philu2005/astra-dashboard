import secrets
import time
from typing import Dict, Optional, Any
from pydantic import BaseModel


class SessionData(BaseModel):
    user_id: str
    username: str
    display_name: str
    avatar_url: Optional[str]
    expires_at: float
    last_active: float


class SessionManager:
    def __init__(self):
        # In-memory session store
        self._sessions: Dict[str, SessionData] = {}
        # state -> expires_at
        self._states: Dict[str, float] = {}
        # exchange_token -> (session_id, expires_at)
        self._exchange_tokens: Dict[str, tuple[str, float]] = {}

    def create_session(self, user_data: Dict[str, Any], max_age: int) -> str:
        session_id = secrets.token_urlsafe(32)
        now = time.time()
        expires_at = now + max_age

        # Determine avatar URL
        user_id = user_data.get("id")
        avatar_hash = user_data.get("avatar")
        if avatar_hash:
            avatar_url = f"https://cdn.discordapp.com/avatars/{user_id}/{avatar_hash}.png"
        else:
            default_avatar_index = (int(user_id) >> 22) % 6
            avatar_url = f"https://cdn.discordapp.com/embed/avatars/{default_avatar_index}.png"

        session_data = SessionData(
            user_id=user_id,
            username=user_data.get("username"),
            display_name=user_data.get("global_name") or user_data.get("username"),
            avatar_url=avatar_url,
            expires_at=expires_at,
            last_active=now,
        )
        self._sessions[session_id] = session_data
        return session_id

    def get_session(self, session_id: str, inactivity_timeout: int = 0) -> Optional[SessionData]:
        session = self._sessions.get(session_id)
        if not session:
            return None

        now = time.time()

        if now > session.expires_at:
            del self._sessions[session_id]
            return None

        # Check inactivity timeout
        if inactivity_timeout > 0 and (now - session.last_active) > inactivity_timeout:
            del self._sessions[session_id]
            return None

        # Update last activity
        session.last_active = now
        return session

    def delete_session(self, session_id: str):
        self._sessions.pop(session_id, None)

    def create_state(self) -> str:
        state = secrets.token_urlsafe(16)
        self._states[state] = time.time() + 600  # 10 minutes
        return state

    def verify_state(self, state: str) -> bool:
        expires_at = self._states.pop(state, None)
        if not expires_at:
            return False
        return time.time() <= expires_at

    def create_exchange_token(self, session_id: str) -> str:
        """Create a short-lived one-time token that can be exchanged for a session cookie."""
        token = secrets.token_urlsafe(32)
        self._exchange_tokens[token] = (session_id, time.time() + 60)  # 60 seconds
        return token

    def exchange_token(self, token: str) -> Optional[str]:
        """Exchange a one-time token for a session_id. Returns None if invalid/expired."""
        entry = self._exchange_tokens.pop(token, None)
        if not entry:
            return None
        session_id, expires_at = entry
        if time.time() > expires_at:
            return None
        return session_id

    def cleanup(self):
        current_time = time.time()
        expired_sessions = [sid for sid, data in self._sessions.items() if current_time > data.expires_at]
        for sid in expired_sessions:
            del self._sessions[sid]

        expired_states = [state for state, expiry in self._states.items() if current_time > expiry]
        for state in expired_states:
            del self._states[state]

        expired_tokens = [t for t, (_, exp) in self._exchange_tokens.items() if current_time > exp]
        for t in expired_tokens:
            del self._exchange_tokens[t]


session_manager = SessionManager()
