
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, JSONResponse
from pathlib import Path

from app.config import settings
from app.auth.router import router as auth_router
from app.servers.router import router as servers_router
from app.database import init_pool, close_pool, init_tables
from app.auth.sessions import session_manager
from app.support.router import router as support_router
from app.monitoring.router import router as monitoring_router
from app.monitoring.service import start_scheduler, stop_scheduler


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("astra")


async def _cleanup_loop():
    """Periodische Bereinigung abgelaufener Sessions, States und Exchange-Tokens."""
    while True:
        try:
            await asyncio.sleep(3600)  # Jede Stunde
            await session_manager.cleanup()
        except asyncio.CancelledError:
            break
        except Exception:
            logger.exception("Fehler bei der periodischen Bereinigung")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_pool()
    await init_tables()

    cleanup_task = asyncio.create_task(_cleanup_loop())

    # Monitoring-Scheduler starten
    await start_scheduler(interval=120)

    logger.info("Astra Dashboard Backend gestartet")

    yield

    # Shutdown
    await stop_scheduler()
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

    await close_pool()

    logger.info("Astra Dashboard Backend heruntergefahren")


# Validate configuration at startup (before lifespan)
settings.validate()


# FastAPI application
# Automatic Swagger documentation is disabled because we provide
# our own Swagger UI route with the correct OpenAPI URL.
app = FastAPI(
    title="Astra Dashboard Backend",
    lifespan=lifespan,
    docs_url=None,
)


# Swagger UI – CSP‑kompatibel, lokal ausgeliefert
DOCS_DIR = Path(__file__).parent / "docs"
ASSETS_DIR = DOCS_DIR / "assets"

# Statische Assets mounten (CSS/JS/Favicon)
app.mount("/api/docs/assets", StaticFiles(directory=str(ASSETS_DIR)), name="swagger-assets")


@app.get("/api/docs", include_in_schema=False)
async def swagger_docs_page() -> FileResponse:
    # Liefert eine reine HTML-Datei ohne Inline-JS, die nur lokale Ressourcen referenziert
    return FileResponse(path=str(DOCS_DIR / "swagger.html"), media_type="text/html")


@app.get("/api/docs/swagger-init.js", include_in_schema=False)
async def swagger_init_js() -> FileResponse:
    # Liefert die lokale Initialisierungsdatei (ohne Inline-JS)
    return FileResponse(path=str(DOCS_DIR / "swagger-init.js"), media_type="application/javascript")


@app.get("/docs", include_in_schema=False)
async def legacy_docs_redirect():
    # Bewahrt Abwärtskompatibilität, ohne die Seite doppelt zu pflegen
    return RedirectResponse(url="/api/docs", status_code=307)


# Alias, damit die OpenAPI-Spezifikation lokal auch unter /api/openapi.json verfügbar ist
@app.get("/api/openapi.json", include_in_schema=False)
async def openapi_alias() -> JSONResponse:
    return JSONResponse(app.openapi())


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE"],
    allow_headers=["Content-Type", "Accept"],
)


# API routers
# Auth bleibt bewusst ohne /api-Prefix, da die bestehende Infrastruktur /auth/* direkt zum Backend proxied
app.include_router(auth_router)
app.include_router(servers_router)

# Support-API wird unter /api/support/* bereitgestellt, damit der Frontend-Client
# (Basis /api) konsistent darauf zugreifen kann und Apache /api/* → FastAPI weiterleitet
app.include_router(support_router, prefix="/api")
app.include_router(monitoring_router, prefix="/api")


# Health check – available at both /health (direct) and /api/health (via reverse proxy)
@app.get(
    "/health",
    tags=["Health"],
    summary="Health‑Check (Root)",
    description="Einfacher Health‑Check des Backends; gibt den Zustand des Dienstes zurück.",
)
async def health_check():
    return {"status": "healthy"}


@app.get(
    "/api/health",
    tags=["Health"],
    summary="Health‑Check (API‑Pfad)",
    description="Gleicher Health‑Check wie /health; wird über den Reverse‑Proxy unter /api/health bereitgestellt.",
)
async def api_health_check():
    return {"status": "healthy"}


# Local development
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
