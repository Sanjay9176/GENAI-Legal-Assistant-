# src/config.py
import os
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, Field
from typing import Optional, List

# --- Project Root ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Settings(BaseSettings):
    """
    Manages all application settings.
    Reads from environment variables and/or a .env file.
    """

    # MongoDB
    MONGO_DB_URL: str
    MONGO_DB_NAME: str = "legal_assistant_db"

    # API / CORS
    CLIENT_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    CHROMA_DB_DIR: str = "db/chroma_db"
    CHROMA_COLLECTION_NAME: str = "legal_documents"
    RESET_DATABASE: bool = False

    # Data Paths
    DATA_DIR_NAME: str = "data"
    RAW_DATA_SUBDIR: str = "raw/legal_corpus"
    PROCESSED_DATA_FILE: str = "processed/processed_legal_chunks.csv"
    SAMPLE_TEMPLATES_SUBDIR: str = "raw/Sample_Templates"

    # Models
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    GEMINI_MODEL_NAME: str = "gemini-pro-latest"
    GOOGLE_API_KEY: str = Field(...)
    RERANKER_MODEL_NAME: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # RAG
    TOP_K_RESULTS: int = 10
    N_TO_RETRIEVE: int = 20
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # Logging
    INGEST_LOG_FILE_NAME: str = "ingest.log"
    QUERY_LOG_FILE_NAME: str = "query_engine.log"

    # --- SECURITY SETTINGS (New) ---
    # Defaults provided here, but can be overridden by .env
    JWT_SECRET_KEY: str = "super_secret_fallback_key_change_this"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 Days

    class Config:
        env_file = os.path.join(PROJECT_ROOT, ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

# --- Set Google Credentials for Vision API ---
if settings.GOOGLE_APPLICATION_CREDENTIALS:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.GOOGLE_APPLICATION_CREDENTIALS
else:
    # Optional: Commenting this out to reduce noise if you don't always need OCR
    # print("WARNING: GOOGLE_APPLICATION_CREDENTIALS is not set in .env. OCR will fail.")
    pass

# --- Computed Paths ---
CHROMA_DB_PATH = os.path.join(PROJECT_ROOT, settings.CHROMA_DB_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, settings.DATA_DIR_NAME)
RAW_DATA_DIR = os.path.join(DATA_DIR, settings.RAW_DATA_SUBDIR)
PROCESSED_DATA_PATH = os.path.join(DATA_DIR, settings.PROCESSED_DATA_FILE)
SAMPLE_TEMPLATES_DIR = os.path.join(DATA_DIR, settings.SAMPLE_TEMPLATES_SUBDIR)
INGEST_LOG_FILE = os.path.join(PROJECT_ROOT, settings.INGEST_LOG_FILE_NAME)
QUERY_LOG_FILE = os.path.join(PROJECT_ROOT, settings.QUERY_LOG_FILE_NAME)