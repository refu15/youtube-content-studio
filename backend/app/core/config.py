import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # API Keys
    GEMINI_API_KEY: str = ""
    YOUTUBE_API_KEY: str = ""

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "YouTube Content Studio AI"

    class Config:
        env_file = ".env"
        case_sensitive = True

    def get_allowed_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS and return as list"""
        origins = os.getenv("ALLOWED_ORIGINS", self.ALLOWED_ORIGINS)
        if isinstance(origins, str) and origins:
            parsed = []
            for origin in origins.split(','):
                origin = origin.strip()
                if origin:
                    # Remove trailing slash for consistency
                    origin = origin.rstrip('/')
                    parsed.append(origin)
            return parsed
        return []


settings = Settings()
