import os
import math
import hashlib
from typing import List
from langchain_core.embeddings import Embeddings
from app.core.config import settings
from app.core.logging import logger

class DeterministicLocalEmbeddings(Embeddings):
    """
    A lightweight, deterministic in-memory embedding model for offline testing and development.
    Maps text to a normalized 384-dimensional vector using deterministic hashing and token bag.
    Requires zero external API calls or large model downloads.
    """
    def __init__(self, dim: int = 384):
        self.dim = dim

    def _embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self.dim
        tokens = text.lower().split()
        if not tokens:
            return vec

        for token in tokens:
            # Deterministic hash to dimension index
            idx = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16) % self.dim
            vec[idx] += 1.0

        # L2 normalize
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed_text(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed_text(text)

def get_embedding_model() -> Embeddings:
    """Returns the configured embeddings instance with graceful fallback."""
    provider = settings.EMBEDDING_PROVIDER.lower()
    
    # 1. Google Gemini Embeddings
    google_key = settings.GOOGLE_API_KEY or os.getenv("Google_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if provider == "google" and google_key:
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            logger.info("Initialized GoogleGenerativeAIEmbeddings")
            return GoogleGenerativeAIEmbeddings(
                google_api_key=google_key,
                model="models/embedding-001"
            )
        except Exception as e:
            logger.warning(f"Failed to initialize Google embeddings: {e}. Falling back.")

    # 2. OpenAI Embeddings
    openai_key = settings.OPENAI_API_KEY or os.getenv("OpenAI_API_KEY") or os.getenv("OPENAI_API_KEY")
    if provider == "openai" and openai_key:
        try:
            from langchain_openai import OpenAIEmbeddings
            logger.info("Initialized OpenAIEmbeddings")
            return OpenAIEmbeddings(
                api_key=openai_key,
                model="text-embedding-3-small"
            )
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI embeddings: {e}. Falling back.")

    # 3. HuggingFace Embeddings
    if provider == "huggingface":
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            logger.info(f"Initialized HuggingFaceEmbeddings with {settings.EMBEDDING_MODEL}")
            return HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
        except Exception as e:
            logger.warning(f"HuggingFace embeddings not available: {e}. Falling back.")

    # 4. Default Deterministic Local Embeddings (offline / test safe)
    logger.info("Using DeterministicLocalEmbeddings (fast, offline, deterministic vector model).")
    return DeterministicLocalEmbeddings()
