"""
Asynchroner MySQL Connection-Pool für das Astra Dashboard.

Verwendet aiomysql für nicht-blockierende Datenbankzugriffe.
Der Pool wird über FastAPI-Lifespan initialisiert und geschlossen.
"""

import logging
from typing import Optional

import aiomysql

from app.config import settings

logger = logging.getLogger("astra.database")

_pool: Optional[aiomysql.Pool] = None


async def init_pool() -> None:
    """Erstellt den Connection-Pool beim Startup."""
    global _pool
    if _pool is not None:
        return

    logger.info("Erstelle MySQL Connection-Pool für %s@%s:%s/%s",
                settings.DB_USER, settings.DB_HOST, settings.DB_PORT, settings.DB_NAME)

    _pool = await aiomysql.create_pool(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        db=settings.DB_NAME,
        minsize=1,
        maxsize=10,
        autocommit=True,
        charset="utf8mb4",
        connect_timeout=10,
    )
    logger.info("MySQL Connection-Pool erstellt")


async def close_pool() -> None:
    """Schließt den Connection-Pool beim Shutdown."""
    global _pool
    if _pool is not None:
        _pool.close()
        await _pool.wait_closed()
        _pool = None
        logger.info("MySQL Connection-Pool geschlossen")


def get_pool() -> aiomysql.Pool:
    """Gibt den aktiven Pool zurück. Wirft RuntimeError wenn nicht initialisiert."""
    if _pool is None:
        raise RuntimeError("Datenbank-Pool ist nicht initialisiert")
    return _pool


async def init_tables() -> None:
    """Erstellt die benötigten Tabellen idempotent (IF NOT EXISTS)."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS dashboard_sessions (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    session_token_hash CHAR(64) NOT NULL UNIQUE,
                    user_id VARCHAR(20) NOT NULL,
                    username VARCHAR(100) NOT NULL,
                    display_name VARCHAR(100) NOT NULL,
                    avatar_url VARCHAR(512),
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    last_active DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME NOT NULL,
                    INDEX idx_expires (expires_at),
                    INDEX idx_user (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            await cur.execute("""
                CREATE TABLE IF NOT EXISTS oauth_states (
                    state_hash CHAR(64) NOT NULL PRIMARY KEY,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_expires (expires_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            await cur.execute("""
                CREATE TABLE IF NOT EXISTS oauth_exchange_tokens (
                    token_hash CHAR(64) NOT NULL PRIMARY KEY,
                    session_token_hash CHAR(64) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_expires (expires_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            # Support-Tickets
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS support_tickets (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    ticket_number VARCHAR(20) NOT NULL UNIQUE,
                    user_id VARCHAR(20) NOT NULL,
                    user_name VARCHAR(100) NOT NULL,
                    subject VARCHAR(200) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    closed_at DATETIME NULL,
                    INDEX idx_user (user_id),
                    INDEX idx_status (status),
                    INDEX idx_updated (updated_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            await cur.execute("""
                CREATE TABLE IF NOT EXISTS support_ticket_messages (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    ticket_id BIGINT UNSIGNED NOT NULL,
                    author_id VARCHAR(20) NOT NULL,
                    author_name VARCHAR(100) NOT NULL,
                    is_admin TINYINT(1) NOT NULL DEFAULT 0,
                    message TEXT NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_support_ticket_messages_ticket
                        FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
                        ON DELETE CASCADE,
                    INDEX idx_ticket (ticket_id),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

    logger.info("Datenbanktabellen initialisiert")
