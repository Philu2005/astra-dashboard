import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("astra.config")


class Config:
    DISCORD_CLIENT_ID: str = os.getenv("DISCORD_CLIENT_ID", "")
    DISCORD_CLIENT_SECRET: str = os.getenv("DISCORD_CLIENT_SECRET", "")
    DISCORD_REDIRECT_URI: str = os.getenv("DISCORD_REDIRECT_URI", "http://127.0.0.1:8000/auth/discord/callback")

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    SESSION_SECRET: str = os.getenv("SESSION_SECRET", "")
    SESSION_COOKIE_SECURE: bool = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
    SESSION_MAX_AGE: int = int(os.getenv("SESSION_MAX_AGE", "604800"))  # Default 7 days
    SESSION_INACTIVITY_TIMEOUT: int = int(os.getenv("SESSION_INACTIVITY_TIMEOUT", "3600"))  # Default 1 hour

    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # Interne Astra Bot API
    ASTRA_INTERNAL_API_URL: str = os.getenv("ASTRA_INTERNAL_API_URL", "http://127.0.0.1:5000")
    ASTRA_INTERNAL_API_KEY: str = os.getenv("ASTRA_INTERNAL_API_KEY", "")

    DISCORD_API_BASE_URL: str = "https://discord.com/api/v10"
    DISCORD_AUTHORIZE_URL: str = "https://discord.com/api/oauth2/authorize"
    DISCORD_TOKEN_URL: str = "https://discord.com/api/oauth2/token"

    def validate(self) -> None:
        """Validate critical configuration at startup. Raises ValueError on fatal issues."""
        errors: list[str] = []

        if not self.DISCORD_CLIENT_ID:
            errors.append("DISCORD_CLIENT_ID ist nicht gesetzt")
        if not self.DISCORD_CLIENT_SECRET:
            errors.append("DISCORD_CLIENT_SECRET ist nicht gesetzt")
        elif "." in self.DISCORD_CLIENT_SECRET:
            logger.warning(
                "DISCORD_CLIENT_SECRET enthält Punkte und sieht wie ein Bot-Token aus. "
                "Bitte das OAuth2 Client Secret aus dem Discord Developer Portal verwenden."
            )

        if not self.SESSION_SECRET or len(self.SESSION_SECRET) < 32:
            errors.append(
                "SESSION_SECRET ist nicht gesetzt oder zu kurz (min. 32 Zeichen). "
                "Generiere einen sicheren Wert mit: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )

        if errors:
            for err in errors:
                logger.error("Konfigurationsfehler: %s", err)
            raise ValueError("Kritische Konfigurationsfehler – siehe Log-Ausgabe oben.")


settings = Config()
