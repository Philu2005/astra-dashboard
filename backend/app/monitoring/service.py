"""
Zentraler Monitoring-Service für das Astra Dashboard.

Führt periodische Prüfungen aller registrierten Dienste durch,
speichert Ergebnisse in MySQL und verwaltet Störungen.
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import aiohttp

from app.config import settings
from app.database import get_pool

logger = logging.getLogger("astra.monitoring")

# Scheduler-Lock: Verhindert doppelte Instanzen
_scheduler_running = False
_scheduler_task: Optional[asyncio.Task] = None

# Status-Konstanten
STATUS_OPERATIONAL = "operational"
STATUS_DEGRADED = "degraded"
STATUS_OUTAGE = "outage"
STATUS_UNKNOWN = "unknown"

# Incident-Status
INCIDENT_INVESTIGATING = "investigating"
INCIDENT_IDENTIFIED = "identified"
INCIDENT_MONITORING = "monitoring"
INCIDENT_RESOLVED = "resolved"

# Standard-Dienste
DEFAULT_SERVICES = [
    {
        "name": "Landing Page",
        "description": "Öffentliche Astra-Website",
        "service_type": "http",
        "check_interval": 120,
        "config": json.dumps({
            "url": settings.FRONTEND_URL,
            "timeout": 15,
        }),
    },
    {
        "name": "Dashboard",
        "description": "Astra Dashboard & Backend",
        "service_type": "http",
        "check_interval": 120,
        "config": json.dumps({
            "url": f"{settings.FRONTEND_URL}/api/health",
            "timeout": 15,
            "expect_json": True,
        }),
    },
    {
        "name": "Astra API",
        "description": "Astra Bot REST-API",
        "service_type": "astra_api",
        "check_interval": 120,
        "config": json.dumps({
            "base_url": settings.ASTRA_INTERNAL_API_URL,
            "timeout": 15,
        }),
    },
    {
        "name": "Astra Bot",
        "description": "Discord-Bot-Prozess",
        "service_type": "heartbeat",
        "check_interval": 120,
        "config": json.dumps({
            "max_age_seconds": 300,
        }),
    },
    {
        "name": "MySQL",
        "description": "Datenbank-Server",
        "service_type": "mysql",
        "check_interval": 120,
        "config": json.dumps({}),
    },
    {
        "name": "Discord",
        "description": "Discord-Plattform",
        "service_type": "discord",
        "check_interval": 120,
        "config": json.dumps({
            "url": "https://discordstatus.com/api/v2/status.json",
            "timeout": 15,
        }),
    },
]

# Dienst-Gewichtung für Gesamtstatus
SERVICE_WEIGHTS = {
    "Dashboard": 3,
    "Astra API": 3,
    "Astra Bot": 3,
    "MySQL": 3,
    "Landing Page": 2,
    "Discord": 1,  # Extern – geringere Gewichtung
    "Website": 3,  # Kombiniert: Landing Page + Dashboard
}

# Dienste, die zu "Website" zusammengeführt werden
WEBSITE_SUB_SERVICES = {"Landing Page", "Dashboard"}


async def init_monitoring_tables() -> None:
    """Erstellt die Monitoring-Tabellen idempotent."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS status_services (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    description VARCHAR(255) NOT NULL DEFAULT '',
                    service_type VARCHAR(50) NOT NULL,
                    is_active TINYINT(1) NOT NULL DEFAULT 1,
                    check_interval INT NOT NULL DEFAULT 120,
                    config JSON,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_active (is_active)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            await cur.execute("""
                CREATE TABLE IF NOT EXISTS status_checks (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    service_id BIGINT UNSIGNED NOT NULL,
                    checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) NOT NULL,
                    response_time_ms FLOAT NULL,
                    error_details TEXT NULL,
                    CONSTRAINT fk_status_checks_service
                        FOREIGN KEY (service_id) REFERENCES status_services(id)
                        ON DELETE CASCADE,
                    INDEX idx_service_checked (service_id, checked_at),
                    INDEX idx_checked (checked_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            await cur.execute("""
                CREATE TABLE IF NOT EXISTS status_incidents (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    service_id BIGINT UNSIGNED NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description VARCHAR(1000) NOT NULL DEFAULT '',
                    status VARCHAR(30) NOT NULL DEFAULT 'investigating',
                    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    resolved_at DATETIME NULL,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    CONSTRAINT fk_status_incidents_service
                        FOREIGN KEY (service_id) REFERENCES status_services(id)
                        ON DELETE CASCADE,
                    INDEX idx_service (service_id),
                    INDEX idx_status (status),
                    INDEX idx_started (started_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            # Heartbeat-Tabelle für Bot-Status
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS status_heartbeats (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    source VARCHAR(50) NOT NULL DEFAULT 'astra_bot',
                    status VARCHAR(30) NOT NULL DEFAULT 'alive',
                    details JSON NULL,
                    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_source_received (source, received_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

    logger.info("Monitoring-Tabellen initialisiert")


async def seed_default_services() -> None:
    """Fügt Standard-Dienste ein, falls noch nicht vorhanden."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            for svc in DEFAULT_SERVICES:
                await cur.execute(
                    """
                    INSERT IGNORE INTO status_services (name, description, service_type, check_interval, config)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (svc["name"], svc["description"], svc["service_type"],
                     svc["check_interval"], svc["config"]),
                )
    logger.info("Standard-Dienste geprüft/eingefügt")


# ─── Prüfungen ───────────────────────────────────────────────

async def _check_http(config: dict) -> tuple[str, float, Optional[str]]:
    """HTTP-Erreichbarkeitsprüfung."""
    url = config.get("url", "")
    timeout_s = config.get("timeout", 15)
    expect_json = config.get("expect_json", False)

    try:
        start = time.monotonic()
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout_s), ssl=False) as resp:
                elapsed = (time.monotonic() - start) * 1000

                if expect_json:
                    try:
                        data = await resp.json()
                        if resp.status == 200 and data.get("status") == "healthy":
                            return STATUS_OPERATIONAL, elapsed, None
                    except Exception:
                        pass

                if resp.status == 200:
                    return STATUS_OPERATIONAL, elapsed, None
                elif resp.status < 500:
                    return STATUS_DEGRADED, elapsed, f"HTTP {resp.status}"
                else:
                    return STATUS_OUTAGE, elapsed, f"HTTP {resp.status}"
    except asyncio.TimeoutError:
        return STATUS_OUTAGE, 0, "Timeout"
    except Exception as e:
        return STATUS_OUTAGE, 0, str(e)[:500]


async def _check_astra_api(config: dict) -> tuple[str, float, Optional[str]]:
    """Prüft Astra Bot API über /health/live und /health/ready."""
    base_url = config.get("base_url", settings.ASTRA_INTERNAL_API_URL).rstrip("/")
    timeout_s = config.get("timeout", 15)

    try:
        start = time.monotonic()
        async with aiohttp.ClientSession() as session:
            # /health/live prüfen
            try:
                async with session.get(
                    f"{base_url}/health/live",
                    timeout=aiohttp.ClientTimeout(total=timeout_s),
                    ssl=False,
                ) as resp:
                    live_ok = resp.status == 200
            except Exception:
                live_ok = False

            if not live_ok:
                elapsed = (time.monotonic() - start) * 1000
                return STATUS_OUTAGE, elapsed, "API-Prozess nicht erreichbar (/health/live)"

            # /health/ready prüfen
            try:
                async with session.get(
                    f"{base_url}/health/ready",
                    timeout=aiohttp.ClientTimeout(total=timeout_s),
                    ssl=False,
                ) as resp:
                    ready_ok = resp.status == 200
            except Exception:
                ready_ok = False

            elapsed = (time.monotonic() - start) * 1000

            if ready_ok:
                return STATUS_OPERATIONAL, elapsed, None
            else:
                return STATUS_DEGRADED, elapsed, "API läuft, aber nicht bereit (/health/ready)"

    except Exception as e:
        return STATUS_OUTAGE, 0, str(e)[:500]


async def _check_heartbeat(config: dict) -> tuple[str, float, Optional[str]]:
    """Prüft den letzten Bot-Heartbeat aus der Datenbank."""
    max_age = config.get("max_age_seconds", 300)

    try:
        pool = get_pool()
        start = time.monotonic()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT status, details, received_at
                    FROM status_heartbeats
                    WHERE source = 'astra_bot'
                    ORDER BY received_at DESC
                    LIMIT 1
                    """
                )
                row = await cur.fetchone()
        elapsed = (time.monotonic() - start) * 1000

        if not row:
            return STATUS_UNKNOWN, elapsed, "Kein Heartbeat empfangen"

        hb_status, hb_details, received_at = row

        # Prüfe Alter des Heartbeats
        now = datetime.now(timezone.utc)
        if received_at.tzinfo is None:
            received_at = received_at.replace(tzinfo=timezone.utc)
        age = (now - received_at).total_seconds()

        if age > max_age:
            return STATUS_OUTAGE, elapsed, f"Heartbeat veraltet ({int(age)}s alt, max {max_age}s)"

        if hb_status == "shutdown":
            return STATUS_OUTAGE, elapsed, "Bot wurde heruntergefahren"

        if hb_status in ("alive", "ready"):
            return STATUS_OPERATIONAL, elapsed, None

        return STATUS_DEGRADED, elapsed, f"Heartbeat-Status: {hb_status}"

    except Exception as e:
        return STATUS_UNKNOWN, 0, str(e)[:500]


async def _check_mysql(config: dict) -> tuple[str, float, Optional[str]]:
    """Prüft die MySQL-Verbindung über den bestehenden Pool."""
    try:
        pool = get_pool()
        start = time.monotonic()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
                await cur.fetchone()
        elapsed = (time.monotonic() - start) * 1000

        if elapsed > 5000:
            return STATUS_DEGRADED, elapsed, f"Langsame Antwort ({int(elapsed)}ms)"
        return STATUS_OPERATIONAL, elapsed, None

    except Exception as e:
        return STATUS_OUTAGE, 0, str(e)[:500]


async def _check_discord(config: dict) -> tuple[str, float, Optional[str]]:
    """Prüft den Discord-Status über die offizielle Status-API."""
    url = config.get("url", "https://discordstatus.com/api/v2/status.json")
    timeout_s = config.get("timeout", 15)

    try:
        start = time.monotonic()
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout_s)) as resp:
                elapsed = (time.monotonic() - start) * 1000

                if resp.status != 200:
                    return STATUS_UNKNOWN, elapsed, f"Discord Status API HTTP {resp.status}"

                data = await resp.json()
                indicator = data.get("status", {}).get("indicator", "unknown")

                if indicator == "none":
                    return STATUS_OPERATIONAL, elapsed, None
                elif indicator in ("minor", "major"):
                    return STATUS_DEGRADED, elapsed, f"Discord: {data.get('status', {}).get('description', indicator)}"
                elif indicator == "critical":
                    return STATUS_OUTAGE, elapsed, f"Discord: {data.get('status', {}).get('description', indicator)}"
                else:
                    return STATUS_UNKNOWN, elapsed, f"Unbekannter Indikator: {indicator}"

    except asyncio.TimeoutError:
        return STATUS_UNKNOWN, 0, "Discord Status API Timeout"
    except Exception as e:
        return STATUS_UNKNOWN, 0, str(e)[:500]


# Prüfungs-Dispatcher
CHECK_HANDLERS = {
    "http": _check_http,
    "astra_api": _check_astra_api,
    "heartbeat": _check_heartbeat,
    "mysql": _check_mysql,
    "discord": _check_discord,
}


async def run_check(service_id: int, service_type: str, config_str: str) -> None:
    """Führt eine einzelne Prüfung durch und speichert das Ergebnis."""
    handler = CHECK_HANDLERS.get(service_type)
    if not handler:
        logger.warning("Kein Handler für Diensttyp: %s", service_type)
        return

    try:
        config = json.loads(config_str) if config_str else {}
    except json.JSONDecodeError:
        config = {}

    try:
        status, response_time, error = await handler(config)
    except Exception as e:
        status = STATUS_UNKNOWN
        response_time = 0
        error = f"Unerwarteter Fehler: {str(e)[:500]}"

    # Ergebnis speichern
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO status_checks (service_id, checked_at, status, response_time_ms, error_details)
                VALUES (%s, UTC_TIMESTAMP(), %s, %s, %s)
                """,
                (service_id, status, response_time, error),
            )

    # Störungsverwaltung
    await _manage_incidents(service_id, status, error)


async def _manage_incidents(service_id: int, status: str, error: Optional[str]) -> None:
    """Erstellt oder löst Störungen basierend auf dem Prüfergebnis."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Aktive Störung suchen
            await cur.execute(
                """
                SELECT id, status FROM status_incidents
                WHERE service_id = %s AND resolved_at IS NULL
                ORDER BY started_at DESC LIMIT 1
                """,
                (service_id,),
            )
            active_incident = await cur.fetchone()

            if status in (STATUS_OUTAGE, STATUS_DEGRADED):
                if not active_incident:
                    # Neue Störung erstellen
                    sev = "Störung" if status == STATUS_OUTAGE else "Beeinträchtigung"
                    desc = error or "Automatisch erkannt"
                    # Keine internen Details veröffentlichen
                    public_desc = f"{sev} erkannt"
                    await cur.execute(
                        """
                        INSERT INTO status_incidents
                            (service_id, title, description, status, started_at)
                        VALUES (%s, %s, %s, %s, UTC_TIMESTAMP())
                        """,
                        (service_id, sev, public_desc, INCIDENT_INVESTIGATING),
                    )
                else:
                    # Incident-Status aktualisieren falls nötig
                    inc_id, inc_status = active_incident
                    if inc_status == INCIDENT_INVESTIGATING:
                        await cur.execute(
                            "UPDATE status_incidents SET status = %s, updated_at = UTC_TIMESTAMP() WHERE id = %s",
                            (INCIDENT_IDENTIFIED, inc_id),
                        )

            elif status == STATUS_OPERATIONAL and active_incident:
                inc_id, _ = active_incident
                await cur.execute(
                    """
                    UPDATE status_incidents
                    SET status = %s, resolved_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
                    WHERE id = %s
                    """,
                    (INCIDENT_RESOLVED, inc_id),
                )


# ─── Scheduler ────────────────────────────────────────────────

async def _run_all_checks() -> None:
    """Führt alle aktiven Prüfungen durch."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id, service_type, config FROM status_services WHERE is_active = 1"
            )
            services = await cur.fetchall()

    for svc_id, svc_type, config_str in services:
        try:
            await run_check(svc_id, svc_type, config_str or "{}")
        except Exception:
            logger.exception("Fehler bei Prüfung von Service %s", svc_id)


async def _scheduler_loop(interval: int = 120) -> None:
    """Periodische Monitoring-Schleife."""
    global _scheduler_running

    # Initiale Prüfung sofort ausführen
    logger.info("Monitoring-Scheduler gestartet (Intervall: %ds)", interval)
    try:
        await _run_all_checks()
    except Exception:
        logger.exception("Fehler bei initialer Monitoring-Prüfung")

    while _scheduler_running:
        try:
            await asyncio.sleep(interval)
            if not _scheduler_running:
                break
            await _run_all_checks()
        except asyncio.CancelledError:
            break
        except Exception:
            logger.exception("Fehler im Monitoring-Scheduler")


async def start_scheduler(interval: int = 120) -> None:
    """Startet den Monitoring-Scheduler (mit Schutz vor Doppelstart)."""
    global _scheduler_running, _scheduler_task

    if _scheduler_running:
        logger.warning("Monitoring-Scheduler läuft bereits")
        return

    # Tabellen und Dienste initialisieren
    await init_monitoring_tables()
    await seed_default_services()

    _scheduler_running = True
    _scheduler_task = asyncio.create_task(_scheduler_loop(interval))
    logger.info("Monitoring-Scheduler initialisiert")


async def stop_scheduler() -> None:
    """Stoppt den Monitoring-Scheduler sauber."""
    global _scheduler_running, _scheduler_task

    _scheduler_running = False

    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        try:
            await _scheduler_task
        except asyncio.CancelledError:
            pass

    _scheduler_task = None
    logger.info("Monitoring-Scheduler gestoppt")


# ─── Datenabfragen für API ────────────────────────────────────

async def get_all_services_status() -> list[dict]:
    """Gibt den aktuellen Status aller aktiven Dienste zurück."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id, name, description, service_type FROM status_services WHERE is_active = 1 ORDER BY id"
            )
            services = await cur.fetchall()

    result = []
    for svc_id, name, description, service_type in services:
        status_data = await _get_service_current_status(svc_id)
        uptime = await _calculate_uptime(svc_id, 90)
        history = await _get_daily_history(svc_id, 90)

        result.append({
            "id": svc_id,
            "name": name,
            "description": description,
            "service_type": service_type,
            "current_status": status_data["status"],
            "response_time_ms": status_data["response_time_ms"],
            "last_check": status_data["last_check"],
            "uptime_percent": uptime,
            "daily_history": history,
        })

    return result


async def _get_service_current_status(service_id: int) -> dict:
    """Holt den letzten Prüfstatus eines Dienstes."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT status, response_time_ms, checked_at
                FROM status_checks
                WHERE service_id = %s
                ORDER BY checked_at DESC
                LIMIT 1
                """,
                (service_id,),
            )
            row = await cur.fetchone()

    if not row:
        return {"status": STATUS_UNKNOWN, "response_time_ms": None, "last_check": None}

    return {
        "status": row[0],
        "response_time_ms": row[1],
        "last_check": row[2],
    }


async def _calculate_uptime(service_id: int, days: int = 90) -> float:
    """Berechnet die prozentuale Verfügbarkeit basierend auf Zeiträumen."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            await cur.execute(
                """
                SELECT status, checked_at
                FROM status_checks
                WHERE service_id = %s AND checked_at >= %s
                ORDER BY checked_at ASC
                """,
                (service_id, cutoff),
            )
            checks = await cur.fetchall()

    if not checks:
        return 0.0

    total_seconds = 0.0
    operational_seconds = 0.0

    for i in range(len(checks)):
        status = checks[i][0]
        check_time = checks[i][1]
        if check_time.tzinfo is None:
            check_time = check_time.replace(tzinfo=timezone.utc)

        if i + 1 < len(checks):
            next_time = checks[i + 1][1]
            if next_time.tzinfo is None:
                next_time = next_time.replace(tzinfo=timezone.utc)
            interval = (next_time - check_time).total_seconds()
        else:
            # Letzter Check bis jetzt
            interval = (datetime.now(timezone.utc) - check_time).total_seconds()

        # Maximal 300s pro Intervall (Schutz vor großen Lücken)
        interval = min(interval, 300)
        total_seconds += interval

        if status == STATUS_OPERATIONAL:
            operational_seconds += interval
        elif status == STATUS_DEGRADED:
            operational_seconds += interval * 0.5  # Teilweise verfügbar

    if total_seconds == 0:
        return 0.0

    return round((operational_seconds / total_seconds) * 100, 2)


async def _get_daily_history(service_id: int, days: int = 90) -> list[dict]:
    """Gibt 90 Tageswerte für die historischen Balken zurück."""
    pool = get_pool()
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days - 1)

    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT DATE(checked_at) as check_date,
                       SUM(CASE WHEN status = 'operational' THEN 1 ELSE 0 END) as ok_count,
                       SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END) as degraded_count,
                       SUM(CASE WHEN status = 'outage' THEN 1 ELSE 0 END) as outage_count,
                       COUNT(*) as total_count
                FROM status_checks
                WHERE service_id = %s AND checked_at >= %s
                GROUP BY DATE(checked_at)
                ORDER BY check_date ASC
                """,
                (service_id, start_date),
            )
            rows = await cur.fetchall()

    # In ein Dict umwandeln für schnellen Zugriff
    day_data = {}
    for row in rows:
        date_str = row[0].isoformat() if hasattr(row[0], 'isoformat') else str(row[0])
        ok = row[1] or 0
        degraded = row[2] or 0
        outage = row[3] or 0
        total = row[4] or 0

        if total == 0:
            day_status = STATUS_UNKNOWN
        elif outage > 0:
            day_status = STATUS_OUTAGE if outage / total > 0.3 else STATUS_DEGRADED
        elif degraded > 0:
            day_status = STATUS_DEGRADED if degraded / total > 0.3 else STATUS_OPERATIONAL
        else:
            day_status = STATUS_OPERATIONAL

        uptime_pct = round((ok / total) * 100, 1) if total > 0 else 0
        day_data[date_str] = {"status": day_status, "uptime_percent": uptime_pct}

    # Genau 90 Tage generieren
    result = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        d_str = d.isoformat()
        if d_str in day_data:
            result.append({"date": d_str, **day_data[d_str]})
        else:
            result.append({"date": d_str, "status": STATUS_UNKNOWN, "uptime_percent": 0})

    return result


def _calculate_overall_status(services: list[dict]) -> tuple[str, str]:
    """Berechnet den Gesamtstatus mit Gewichtung."""
    if not services:
        return STATUS_UNKNOWN, "Status unbekannt"

    weighted_scores = []
    for svc in services:
        weight = SERVICE_WEIGHTS.get(svc["name"], 2)
        status = svc["current_status"]

        if status == STATUS_OPERATIONAL:
            score = 1.0
        elif status == STATUS_DEGRADED:
            score = 0.5
        elif status == STATUS_OUTAGE:
            score = 0.0
        else:
            score = 0.5  # unknown zählt neutral

        weighted_scores.append((score, weight))

    total_weight = sum(w for _, w in weighted_scores)
    if total_weight == 0:
        return STATUS_UNKNOWN, "Status unbekannt"

    weighted_avg = sum(s * w for s, w in weighted_scores) / total_weight

    if weighted_avg >= 0.95:
        return STATUS_OPERATIONAL, "Alle Systeme laufen"
    elif weighted_avg >= 0.5:
        return STATUS_DEGRADED, "Eingeschränkter Betrieb"
    elif weighted_avg > 0:
        return STATUS_OUTAGE, "Störung"
    else:
        return STATUS_OUTAGE, "Schwere Störung"


def _merge_website_services(services: list[dict]) -> list[dict]:
    """Führt Landing Page und Dashboard zu einem 'Website'-Dienst zusammen."""
    sub_services = [s for s in services if s["name"] in WEBSITE_SUB_SERVICES]
    other_services = [s for s in services if s["name"] not in WEBSITE_SUB_SERVICES]

    if not sub_services:
        return other_services

    # Status berechnen: worst-case der Subkomponenten
    statuses = [s["current_status"] for s in sub_services]
    if all(st == STATUS_OPERATIONAL for st in statuses):
        combined_status = STATUS_OPERATIONAL
    elif any(st == STATUS_OUTAGE for st in statuses):
        if all(st == STATUS_OUTAGE for st in statuses):
            combined_status = STATUS_OUTAGE
        else:
            combined_status = STATUS_DEGRADED
    elif any(st == STATUS_DEGRADED for st in statuses):
        combined_status = STATUS_DEGRADED
    elif any(st == STATUS_UNKNOWN for st in statuses):
        combined_status = STATUS_DEGRADED
    else:
        combined_status = STATUS_UNKNOWN

    # Uptime: Durchschnitt der Subkomponenten
    uptimes = [s["uptime_percent"] for s in sub_services if s["uptime_percent"] > 0]
    combined_uptime = round(sum(uptimes) / len(uptimes), 2) if uptimes else 0.0

    # Response-Time: Maximum
    response_times = [s["response_time_ms"] for s in sub_services if s["response_time_ms"] is not None]
    combined_rt = max(response_times) if response_times else None

    # Last check: neuester
    last_checks = [s["last_check"] for s in sub_services if s["last_check"] is not None]
    combined_last = max(last_checks) if last_checks else None

    # Daily history: worst-case pro Tag zusammenführen
    history_by_date = {}
    for s in sub_services:
        for day in s["daily_history"]:
            d = day["date"]
            if d not in history_by_date:
                history_by_date[d] = {"date": d, "status": day["status"], "uptime_percent": day["uptime_percent"]}
            else:
                existing = history_by_date[d]
                # Worst-case Status
                priority = {STATUS_OUTAGE: 0, STATUS_DEGRADED: 1, STATUS_UNKNOWN: 2, STATUS_OPERATIONAL: 3}
                if priority.get(day["status"], 2) < priority.get(existing["status"], 2):
                    existing["status"] = day["status"]
                # Niedrigere Uptime übernehmen
                existing["uptime_percent"] = min(existing["uptime_percent"], day["uptime_percent"])

    combined_history = sorted(history_by_date.values(), key=lambda x: x["date"])

    # Sub-Status-Details für Frontend
    sub_status_details = []
    for s in sub_services:
        if s["current_status"] != STATUS_OPERATIONAL:
            label = "ausgefallen" if s["current_status"] == STATUS_OUTAGE else "beeinträchtigt"
            sub_status_details.append(f"{s['name']} {label}")

    website_service = {
        "id": sub_services[0]["id"],
        "name": "Website",
        "description": "Öffentliche Astra-Website und Dashboard",
        "service_type": "http",
        "current_status": combined_status,
        "response_time_ms": combined_rt,
        "last_check": combined_last,
        "uptime_percent": combined_uptime,
        "daily_history": combined_history,
        "sub_status": ", ".join(sub_status_details) if sub_status_details else None,
    }

    return [website_service] + other_services


async def get_status_page_data() -> dict:
    """Gibt alle Daten für die öffentliche Status Page zurück."""
    services = await get_all_services_status()
    merged_services = _merge_website_services(services)
    overall_status, overall_label = _calculate_overall_status(merged_services)
    incidents = await get_public_incidents()

    return {
        "overall": {
            "status": overall_status,
            "label": overall_label,
            "services": merged_services,
        },
        "incidents": incidents,
        "last_updated": datetime.now(timezone.utc),
    }


async def get_public_incidents(limit: int = 20) -> list[dict]:
    """Gibt öffentliche Störungen zurück (keine internen Details)."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT i.id, s.name, i.title, i.status, i.started_at, i.resolved_at, i.description
                FROM status_incidents i
                JOIN status_services s ON i.service_id = s.id
                ORDER BY i.started_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            rows = await cur.fetchall()

    return [
        {
            "id": row[0],
            "service_name": row[1],
            "title": row[2],
            "status": row[3],
            "started_at": row[4],
            "resolved_at": row[5],
            "description": row[6],
        }
        for row in rows
    ]


async def receive_heartbeat(source: str, status: str, details: Optional[dict] = None) -> None:
    """Empfängt und speichert einen Heartbeat."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO status_heartbeats (source, status, details, received_at)
                VALUES (%s, %s, %s, UTC_TIMESTAMP())
                """,
                (source, status, json.dumps(details) if details else None),
            )


async def cleanup_old_data(retention_days: int = 180) -> None:
    """Bereinigt alte Monitoring-Daten."""
    pool = get_pool()
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "DELETE FROM status_checks WHERE checked_at < %s", (cutoff,)
            )
            deleted = cur.rowcount
            if deleted:
                logger.info("Alte Monitoring-Daten bereinigt: %d Einträge", deleted)

            await cur.execute(
                "DELETE FROM status_heartbeats WHERE received_at < %s", (cutoff,)
            )
