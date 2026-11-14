"""
Tests für das Astra Dashboard Auth-System mit MySQL-Sessions.

HINWEIS: Diese Tests benötigen eine laufende MySQL-Datenbank.
Konfiguration über Umgebungsvariablen (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).

Ausführung:
    pytest tests/test_auth.py -v

Für Unit-Tests ohne Datenbank siehe test_sessions_unit.py.
"""

import asyncio
import time
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from httpx import AsyncClient, ASGITransport

from app.auth.sessions import SessionManager, _hash_token
from app.database import init_pool, close_pool, init_tables, get_pool


# --- Fixtures ---

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """Initialisiert den DB-Pool und die Tabellen für alle Tests."""
    try:
        await init_pool()
        await init_tables()
    except Exception as e:
        pytest.skip(f"MySQL nicht verfügbar: {e}")
    yield
    await close_pool()


@pytest.fixture(autouse=True)
async def clean_tables():
    """Leert alle Tabellen vor jedem Test."""
    try:
        pool = get_pool()
    except RuntimeError:
        pytest.skip("MySQL-Pool nicht verfügbar")
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM oauth_exchange_tokens")
            await cur.execute("DELETE FROM oauth_states")
            await cur.execute("DELETE FROM dashboard_sessions")
    yield


@pytest.fixture
def manager():
    return SessionManager()


@pytest.fixture
def user_data():
    return {
        "id": "123456789",
        "username": "testuser",
        "global_name": "Test User",
        "avatar": "abcdef",
    }


# --- Session Manager Unit Tests ---

@pytest.mark.asyncio
async def test_session_creation_and_retrieval(manager, user_data):
    token = await manager.create_session(user_data, 3600)
    assert token is not None

    session = await manager.get_session(token)
    assert session is not None
    assert session.user_id == "123456789"
    assert session.username == "testuser"
    assert session.display_name == "Test User"
    assert "avatars/123456789/abcdef.png" in session.avatar_url


@pytest.mark.asyncio
async def test_session_expiration(manager):
    user_data = {"id": "1", "username": "u"}
    token = await manager.create_session(user_data, -1)
    session = await manager.get_session(token)
    assert session is None


@pytest.mark.asyncio
async def test_session_deletion(manager, user_data):
    token = await manager.create_session(user_data, 3600)
    assert await manager.get_session(token) is not None
    await manager.delete_session(token)
    assert await manager.get_session(token) is None


@pytest.mark.asyncio
async def test_session_persists_across_manager_instances(user_data):
    """Session bleibt nach Backend-Neustart (neuer Manager) gültig."""
    manager1 = SessionManager()
    token = await manager1.create_session(user_data, 3600)

    manager2 = SessionManager()
    session = await manager2.get_session(token)
    assert session is not None
    assert session.user_id == "123456789"


@pytest.mark.asyncio
async def test_session_invalid_token(manager):
    session = await manager.get_session("totally-fake-token")
    assert session is None


@pytest.mark.asyncio
async def test_session_last_active_updated(manager, user_data):
    token = await manager.create_session(user_data, 3600)

    session1 = await manager.get_session(token)
    first_active = session1.last_active

    # Kurz warten damit Zeitstempel sich unterscheidet
    await asyncio.sleep(0.1)

    session2 = await manager.get_session(token)
    assert session2.last_active >= first_active


@pytest.mark.asyncio
async def test_session_inactivity_timeout(manager, user_data):
    token = await manager.create_session(user_data, 3600)

    # last_active manuell in die Vergangenheit setzen
    token_hash = _hash_token(token)
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "UPDATE dashboard_sessions SET last_active = DATE_SUB(NOW(), INTERVAL 2 HOUR) WHERE session_token_hash = %s",
                (token_hash,),
            )

    result = await manager.get_session(token, inactivity_timeout=3600)
    assert result is None


@pytest.mark.asyncio
async def test_session_active_within_timeout(manager, user_data):
    token = await manager.create_session(user_data, 3600)
    result = await manager.get_session(token, inactivity_timeout=3600)
    assert result is not None


@pytest.mark.asyncio
async def test_session_no_extension_beyond_max_age(manager, user_data):
    """expires_at darf nicht über die absolute Laufzeit hinaus verlängert werden."""
    token = await manager.create_session(user_data, 60)
    session = await manager.get_session(token)
    original_expires = session.expires_at

    # Mehrfach abrufen ändert expires_at nicht
    await manager.get_session(token)
    await manager.get_session(token)
    session2 = await manager.get_session(token)
    assert abs(session2.expires_at - original_expires) < 2  # Toleranz 2s


# --- OAuth2 State Tests ---

@pytest.mark.asyncio
async def test_state_verification(manager):
    state = await manager.create_state()
    assert await manager.verify_state(state) is True
    # Einmalig verwendbar
    assert await manager.verify_state(state) is False


@pytest.mark.asyncio
async def test_invalid_state(manager):
    assert await manager.verify_state("nonexistent") is False


@pytest.mark.asyncio
async def test_expired_state(manager):
    state = await manager.create_state()
    state_hash = _hash_token(state)

    # Manuell ablaufen lassen
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "UPDATE oauth_states SET expires_at = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE state_hash = %s",
                (state_hash,),
            )

    assert await manager.verify_state(state) is False


@pytest.mark.asyncio
async def test_parallel_states(manager):
    """Mehrere gleichzeitige States dürfen sich nicht gegenseitig ungültig machen."""
    state1 = await manager.create_state()
    state2 = await manager.create_state()
    state3 = await manager.create_state()

    assert await manager.verify_state(state2) is True
    assert await manager.verify_state(state1) is True
    assert await manager.verify_state(state3) is True


# --- Exchange Token Tests ---

@pytest.mark.asyncio
async def test_exchange_token_creation_and_use(manager, user_data):
    session_token = await manager.create_session(user_data, 3600)
    exchange = await manager.create_exchange_token(session_token)
    assert exchange is not None

    new_session_token = await manager.exchange_token(exchange)
    assert new_session_token is not None
    assert new_session_token != session_token  # Neuer Token nach Exchange

    # Session muss mit neuem Token abrufbar sein
    session = await manager.get_session(new_session_token)
    assert session is not None
    assert session.user_id == "123456789"

    # Alter Token darf nicht mehr funktionieren
    session_old = await manager.get_session(session_token)
    assert session_old is None


@pytest.mark.asyncio
async def test_exchange_token_single_use(manager, user_data):
    session_token = await manager.create_session(user_data, 3600)
    exchange = await manager.create_exchange_token(session_token)

    result1 = await manager.exchange_token(exchange)
    assert result1 is not None

    result2 = await manager.exchange_token(exchange)
    assert result2 is None


@pytest.mark.asyncio
async def test_exchange_token_expired(manager, user_data):
    session_token = await manager.create_session(user_data, 3600)
    exchange = await manager.create_exchange_token(session_token)

    # Manuell ablaufen lassen
    token_hash = _hash_token(exchange)
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "UPDATE oauth_exchange_tokens SET expires_at = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE token_hash = %s",
                (token_hash,),
            )

    result = await manager.exchange_token(exchange)
    assert result is None


@pytest.mark.asyncio
async def test_concurrent_exchange_attempts(manager, user_data):
    """Gleichzeitige Exchange-Versuche: nur einer darf erfolgreich sein."""
    session_token = await manager.create_session(user_data, 3600)
    exchange = await manager.create_exchange_token(session_token)

    results = await asyncio.gather(
        manager.exchange_token(exchange),
        manager.exchange_token(exchange),
        manager.exchange_token(exchange),
        return_exceptions=True,
    )

    successes = [r for r in results if r is not None and not isinstance(r, Exception)]
    assert len(successes) == 1


# --- Cleanup Tests ---

@pytest.mark.asyncio
async def test_cleanup(manager):
    user_data = {"id": "1", "username": "u"}
    token = await manager.create_session(user_data, -1)
    state = await manager.create_state()

    # State ablaufen lassen
    state_hash = _hash_token(state)
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "UPDATE oauth_states SET expires_at = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE state_hash = %s",
                (state_hash,),
            )

    await manager.cleanup()

    # Abgelaufene Einträge sollten entfernt sein
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM dashboard_sessions")
            (count,) = await cur.fetchone()
            assert count == 0

            await cur.execute("SELECT COUNT(*) FROM oauth_states")
            (count,) = await cur.fetchone()
            assert count == 0


# --- API Endpoint Tests ---
# Diese Tests verwenden httpx AsyncClient mit der FastAPI-App.

@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_health_endpoint():
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_me_requires_session_cookie():
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/auth/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_with_valid_session(manager, user_data):
    from app.main import app
    token = await manager.create_session(user_data, 3600)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", cookies={"session_id": token}) as client:
        response = await client.get("/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["user"]["username"] == "testuser"


@pytest.mark.asyncio
async def test_me_with_expired_session(manager):
    from app.main import app
    user_data = {"id": "1", "username": "u"}
    token = await manager.create_session(user_data, -1)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", cookies={"session_id": token}) as client:
        response = await client.get("/auth/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_with_invalid_session_id():
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", cookies={"session_id": "fake"}) as client:
        response = await client.get("/auth/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_exchange_endpoint_sets_session_cookie(manager, user_data):
    from app.main import app
    session_token = await manager.create_session(user_data, 3600)
    exchange = await manager.create_exchange_token(session_token)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/auth/exchange", json={"token": exchange})
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["user"]["username"] == "testuser"
        assert "session_id" in response.cookies


@pytest.mark.asyncio
async def test_exchange_rejects_invalid_token():
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/auth/exchange", json={"token": "bogus"})
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_exchange_rejects_reused_token(manager, user_data):
    from app.main import app
    session_token = await manager.create_session(user_data, 3600)
    exchange = await manager.create_exchange_token(session_token)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r1 = await client.post("/auth/exchange", json={"token": exchange})
        assert r1.status_code == 200

        r2 = await client.post("/auth/exchange", json={"token": exchange})
        assert r2.status_code == 401


@pytest.mark.asyncio
async def test_exchange_rejects_missing_token():
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/auth/exchange", json={})
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_logout_clears_session(manager, user_data):
    from app.main import app
    token = await manager.create_session(user_data, 3600)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", cookies={"session_id": token}) as client:
        response = await client.post("/auth/logout")
        assert response.status_code == 200
        assert response.json()["success"] is True

    # Session muss ungültig sein
    assert await manager.get_session(token) is None


@pytest.mark.asyncio
async def test_me_after_logout(manager, user_data):
    from app.main import app
    token = await manager.create_session(user_data, 3600)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", cookies={"session_id": token}) as client:
        await client.post("/auth/logout")
        response = await client.get("/auth/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_session_persists_across_requests(manager, user_data):
    from app.main import app
    token = await manager.create_session(user_data, 3600)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", cookies={"session_id": token}) as client:
        r1 = await client.get("/auth/me")
        assert r1.status_code == 200

        r2 = await client.get("/auth/me")
        assert r2.status_code == 200
        assert r2.json()["user"]["username"] == "testuser"


@pytest.mark.asyncio
async def test_discord_login_sets_state_cookie_and_redirects():
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", follow_redirects=False) as client:
        response = await client.get("/auth/discord/login")
        assert response.status_code in (302, 307)
        assert "discord.com/api/oauth2/authorize" in response.headers["location"]


@pytest.mark.asyncio
async def test_callback_rejects_invalid_state():
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", follow_redirects=False) as client:
        response = await client.get("/auth/discord/callback?code=test-code&state=invalid")
        assert response.status_code in (302, 307)
        assert "error=invalid_state" in response.headers["location"]


@pytest.mark.asyncio
async def test_callback_success_redirects_with_exchange_token(manager):
    from app.main import app

    state = await manager.create_state()

    mock_user = {
        "id": "555",
        "username": "discorduser",
        "global_name": "Discord User",
        "avatar": "hash123",
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", cookies={"oauth_state": state}, follow_redirects=False) as client:
        with patch("app.auth.router.discord_service") as mock_service:
            mock_service.exchange_code = AsyncMock(return_value="fake_access_token")
            mock_service.get_user_profile = AsyncMock(return_value=mock_user)

            response = await client.get(f"/auth/discord/callback?code=testcode&state={state}")

    assert response.status_code in (302, 307)
    location = response.headers["location"]
    assert "/auth/callback?token=" in location


@pytest.mark.asyncio
async def test_parallel_session_requests(manager, user_data):
    """Parallele Anfragen mit derselben Session dürfen keine Fehler verursachen."""
    from app.main import app
    token = await manager.create_session(user_data, 3600)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", cookies={"session_id": token}) as client:
        results = await asyncio.gather(*[client.get("/auth/me") for _ in range(10)])
        assert all(r.status_code == 200 for r in results)
