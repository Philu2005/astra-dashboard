
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html

from app.config import settings
from app.auth.router import router as auth_router
from app.servers.router import router as servers_router
from app.database import init_pool, close_pool, init_tables
from app.auth.sessions import session_manager
from app.support.router import router as support_router


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

    logger.info("Astra Dashboard Backend gestartet")

    yield

    # Shutdown
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


# Custom Swagger UI
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/api/openapi.json",
        title=f"{app.title} – Swagger UI",
    )


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


# API routers
# Auth bleibt bewusst ohne /api-Prefix, da die bestehende Infrastruktur /auth/* direkt zum Backend proxied
app.include_router(auth_router)
app.include_router(servers_router)

# Support-API wird unter /api/support/* bereitgestellt, damit der Frontend-Client
# (Basis /api) konsistent darauf zugreifen kann und Apache /api/* → FastAPI weiterleitet
app.include_router(support_router, prefix="/api")


# Health check – available at both /health (direct) and /api/health (via reverse proxy)
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/health")
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
