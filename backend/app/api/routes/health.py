from fastapi import APIRouter
from app.core.config import settings
from app.core.database import get_db_connection
from app.models.responses import HealthResponse
from app.rag.vector_store import vector_store_manager

router = APIRouter(tags=["Health"])

@router.get("/api/health", response_model=HealthResponse)
async def health_check():
    # Check DB
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {e}"

    # Check Vector Store
    try:
        stats = vector_store_manager.get_stats()
        vs_status = f"healthy ({len(stats)} collections)"
    except Exception as e:
        vs_status = f"unhealthy: {e}"

    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        llm_provider=settings.LLM_PROVIDER,
        embedding_provider=settings.EMBEDDING_PROVIDER,
        vector_store_status=vs_status,
        database_status=db_status,
    )
