import time
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.auth.sessions import SessionManager
from app.main import app
from app.auth import router as auth_router_module


def setup_function():
    manager = auth_router_module.session_manager
    manager._sessions.clear()
    manager._states.clear()
    manager._exchange_tokens.clear()


# --- Session Manager Unit Tests ---

def test_session_creation_and_retrieval():
    manager = SessionManager()
    user_data = {
        "id": "123456789",
        "username": "testuser",
        "global_name": "Test User",
        "avatar": "abcdef"
    }

    session_id = manager.create_session(user_data, 3600)
    assert session_id is not None

    session = manager.get_session(session_id)
    assert session is not None
    assert session.user_id == "123456789"
    assert session.username == "testuser"
    assert session.display_name == "Test User"
    assert "avatars/123456789/abcdef.png" in session.avatar_url


def test_session_expiration():
    manager = SessionManager()
    user_data = {"id": "1", "username": "u"}

    # Create session that expires in 0 seconds
    session_id = manager.create_session(user_data, -1)
    session = manager.get_session(session_id)
    assert session is None


def test_state_verification():
    manager = SessionManager()
    state = manager.create_state()
    assert manager.verify_state(state) is True
    # State should be invalidated after one use
    assert manager.verify_state(state) is False


def test_invalid_state():
    manager = SessionManager()
    assert manager.verify_state("nonexistent") is False


def test_exchange_token_creation_and_use():
    manager = SessionManager()
    user_data = {"id": "1", "username": "u"}
    session_id = manager.create_session(user_data, 3600)

    token = manager.create_exchange_token(session_id)
    assert token is not None

    # Exchange should return session_id
    result = manager.exchange_token(token)
    assert result == session_id

    # Token should be single-use
    result2 = manager.exchange_token(token)
    assert result2 is None


def test_exchange_token_expired():
    manager = SessionManager()
    user_data = {"id": "1", "username": "u"}
    session_id = manager.create_session(user_data, 3600)

    token = manager.create_exchange_token(session_id)
    # Manually expire the token
    manager._exchange_tokens[token] = (session_id, time.time() - 1)

    result = manager.exchange_token(token)
    assert result is None


def test_session_deletion():
    manager = SessionManager()
    user_data = {"id": "1", "username": "u"}
    session_id = manager.create_session(user_data, 3600)

    assert manager.get_session(session_id) is not None
    manager.delete_session(session_id)
    assert manager.get_session(session_id) is None


# --- API Endpoint Tests ---

def test_me_requires_session_cookie():
    client = TestClient(app)
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_with_valid_session():
    """Authenticated /auth/me should return user data."""
    manager = auth_router_module.session_manager
    user_data = {
        "id": "999",
        "username": "realuser",
        "global_name": "Real User",
        "avatar": "abc123"
    }
    session_id = manager.create_session(user_data, 3600)

    client = TestClient(app)
    client.cookies.set("session_id", session_id)
    response = client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["user"]["username"] == "realuser"
    assert data["user"]["display_name"] == "Real User"


def test_me_with_expired_session():
    """Expired session should return 401."""
    manager = auth_router_module.session_manager
    user_data = {"id": "1", "username": "u"}
    session_id = manager.create_session(user_data, -1)

    client = TestClient(app)
    client.cookies.set("session_id", session_id)
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_discord_login_sets_state_cookie_and_redirects():
    client = TestClient(app)
    response = client.get("/auth/discord/login", follow_redirects=False)
    assert response.status_code in (302, 307)
    assert "discord.com/api/oauth2/authorize" in response.headers["location"]
    assert "oauth_state=" in response.headers.get("set-cookie", "")


def test_callback_rejects_invalid_state():
    client = TestClient(app)
    response = client.get("/auth/discord/callback?code=test-code&state=invalid", follow_redirects=False)
    assert response.status_code in (302, 307)
    assert "error=invalid_state" in response.headers["location"]


def test_callback_success_redirects_with_exchange_token():
    """Successful OAuth callback should redirect to frontend /auth/callback with token."""
    manager = auth_router_module.session_manager
    state = manager.create_state()

    mock_user = {
        "id": "555",
        "username": "discorduser",
        "global_name": "Discord User",
        "avatar": "hash123"
    }

    client = TestClient(app)
    client.cookies.set("oauth_state", state)

    with patch("app.auth.router.discord_service") as mock_service:
        mock_service.exchange_code = AsyncMock(return_value="fake_access_token")
        mock_service.get_user_profile = AsyncMock(return_value=mock_user)

        response = client.get(
            f"/auth/discord/callback?code=testcode&state={state}",
            follow_redirects=False
        )

    assert response.status_code in (302, 307)
    location = response.headers["location"]
    assert "/auth/callback?token=" in location


def test_exchange_endpoint_sets_session_cookie():
    """POST /auth/exchange with valid token should set session_id cookie."""
    manager = auth_router_module.session_manager
    user_data = {
        "id": "777",
        "username": "exchangeuser",
        "global_name": "Exchange User",
        "avatar": "av123"
    }
    session_id = manager.create_session(user_data, 3600)
    token = manager.create_exchange_token(session_id)

    client = TestClient(app)
    response = client.post("/auth/exchange", json={"token": token})
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["user"]["username"] == "exchangeuser"

    # Cookie should be set
    assert "session_id" in response.cookies


def test_exchange_endpoint_rejects_invalid_token():
    client = TestClient(app)
    response = client.post("/auth/exchange", json={"token": "bogus"})
    assert response.status_code == 401


def test_exchange_endpoint_rejects_reused_token():
    """Exchange token should be single-use."""
    manager = auth_router_module.session_manager
    user_data = {"id": "1", "username": "u"}
    session_id = manager.create_session(user_data, 3600)
    token = manager.create_exchange_token(session_id)

    client = TestClient(app)
    response1 = client.post("/auth/exchange", json={"token": token})
    assert response1.status_code == 200

    response2 = client.post("/auth/exchange", json={"token": token})
    assert response2.status_code == 401


def test_logout_clears_session():
    """Logout should invalidate session and clear cookie."""
    manager = auth_router_module.session_manager
    user_data = {"id": "1", "username": "u"}
    session_id = manager.create_session(user_data, 3600)

    client = TestClient(app)
    client.cookies.set("session_id", session_id)

    response = client.post("/auth/logout")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Session should be gone
    assert manager.get_session(session_id) is None


def test_me_after_logout():
    """/auth/me should return 401 after logout."""
    manager = auth_router_module.session_manager
    user_data = {"id": "1", "username": "u"}
    session_id = manager.create_session(user_data, 3600)

    client = TestClient(app)
    client.cookies.set("session_id", session_id)

    # Logout
    client.post("/auth/logout")

    # me should fail
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_session_persists_across_requests():
    """Session cookie should work across multiple requests (simulates page reload)."""
    manager = auth_router_module.session_manager
    user_data = {
        "id": "888",
        "username": "persistuser",
        "global_name": "Persist User",
        "avatar": None
    }
    session_id = manager.create_session(user_data, 3600)

    client = TestClient(app)
    client.cookies.set("session_id", session_id)

    # First request
    r1 = client.get("/auth/me")
    assert r1.status_code == 200

    # Second request (simulates reload)
    r2 = client.get("/auth/me")
    assert r2.status_code == 200
    assert r2.json()["user"]["username"] == "persistuser"


# --- Inactivity Timeout Tests ---

def test_session_inactivity_timeout():
    """Session should expire after inactivity timeout."""
    manager = SessionManager()
    user_data = {"id": "1", "username": "u"}
    session_id = manager.create_session(user_data, 3600)

    # Simulate inactivity by setting last_active in the past
    session = manager._sessions[session_id]
    session.last_active = time.time() - 7200  # 2 hours ago

    result = manager.get_session(session_id, inactivity_timeout=3600)
    assert result is None


def test_session_active_within_timeout():
    """Session should remain valid when active within timeout."""
    manager = SessionManager()
    user_data = {"id": "1", "username": "u"}
    session_id = manager.create_session(user_data, 3600)

    result = manager.get_session(session_id, inactivity_timeout=3600)
    assert result is not None


def test_session_last_active_updated():
    """get_session should update last_active timestamp."""
    manager = SessionManager()
    user_data = {"id": "1", "username": "u"}
    session_id = manager.create_session(user_data, 3600)

    # Set last_active slightly in the past
    session = manager._sessions[session_id]
    old_active = time.time() - 10
    session.last_active = old_active

    manager.get_session(session_id, inactivity_timeout=3600)
    assert session.last_active > old_active


# --- Security Tests ---

def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_me_with_invalid_session_id():
    """Random session ID should return 401."""
    client = TestClient(app)
    client.cookies.set("session_id", "totally-fake-session-id")
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_exchange_rejects_empty_body():
    client = TestClient(app)
    response = client.post("/auth/exchange", content="not json", headers={"Content-Type": "application/json"})
    assert response.status_code in (400, 422)


def test_exchange_rejects_missing_token():
    client = TestClient(app)
    response = client.post("/auth/exchange", json={})
    assert response.status_code == 400
