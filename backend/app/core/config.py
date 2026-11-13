import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App
    APP_NAME: str = "HackMentor Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Directories
    BACKEND_DIR: Path = Path(__file__).resolve().parents[2]
    APP_DIR: Path = Path(__file__).resolve().parents[1]
    DATA_DIR: Path = Path(__file__).resolve().parents[1] / "data"
    UPLOAD_DIR: Path = Path(__file__).resolve().parents[2] / "uploads"
    CHROMA_PERSIST_DIR: Path = Path(__file__).resolve().parents[2] / "chroma_db"
    DATABASE_PATH: Path = Path(__file__).resolve().parents[2] / "hackmentor.db"

    # LLM Settings
    LLM_PROVIDER: str = "groq"  # "groq", "google", "openai"
    LLM_MODEL: str = "openai/gpt-oss-20b"  # Active Groq model; override via LLM_MODEL in .env
    LLM_TEMPERATURE: float = 0.2

    # API Keys — pydantic-settings reads env vars case-insensitively on Linux but
    # Windows PowerShell preserves case. We declare both naming conventions so
    # either "GROQ_API_KEY" or "Groq_API_KEY" in .env will be picked up.
    GROQ_API_KEY: Optional[str] = None
    Groq_API_KEY: Optional[str] = None   # alias for mixed-case .env files
    GOOGLE_API_KEY: Optional[str] = None
    Google_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OpenAI_API_KEY: Optional[str] = None

    # Google OAuth 2.0 Client ID for GIS Verification
    GOOGLE_CLIENT_ID: Optional[str] = None
    Google_CLIENT_ID: Optional[str] = None

    # Embeddings
    EMBEDDING_PROVIDER: str = "default"  # "default", "google", "openai", "huggingface"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # RAG Settings
    RAG_CHUNK_SIZE: int = 800
    RAG_CHUNK_OVERLAP: int = 150
    RAG_RETRIEVAL_TOP_K: int = 4

    # Uploads
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

    # S3 (bucket name/region only — credentials come from the AWS CLI chain)
    AWS_S3_BUCKET: str = "hackmentor-demo-storage"
    AWS_REGION: str = "us-east-1"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [orig.strip() for orig in self.CORS_ORIGINS.split(",") if orig.strip()]

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure runtime directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.CHROMA_PERSIST_DIR.mkdir(parents=True, exist_ok=True)
