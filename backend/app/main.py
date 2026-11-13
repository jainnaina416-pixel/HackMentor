from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.core.database import init_db
from app.core.llm import LLMConfigurationError

# Import routers
from app.api.routes.health import router as health_router
from app.api.routes.uploads import router as uploads_router
from app.api.routes.problem import router as problem_router
from app.api.routes.mentor import router as mentor_router
from app.api.routes.review import router as review_router
from app.api.routes.pitch import router as pitch_router
from app.api.routes.project import router as project_router
from app.api.routes.auth import router as auth_router
from app.api.routes.resources import router as resources_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_db()
    logger.info(f"SQLite database initialized at {settings.DATABASE_PATH}")
    logger.info(f"ChromaDB persistence at {settings.CHROMA_PERSIST_DIR}")
    logger.info(f"Uploads stored at {settings.UPLOAD_DIR}")
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="RAG-Powered AI Hackathon Mentor Backend for idea analysis, mentorship, code review, and pitch preparation.",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(LLMConfigurationError)
async def llm_configuration_exception_handler(request: Request, exc: LLMConfigurationError):
    logger.error(f"LLM Configuration Error: {exc}")
    return JSONResponse(
        status_code=503,
        content={
            "error": "LLM_CONFIGURATION_ERROR",
            "message": str(exc),
            "detail": "Please configure GROQ_API_KEY, GOOGLE_API_KEY, or OPENAI_API_KEY in your .env file."
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": str(exc),
            "path": request.url.path
        }
    )

# Register routes
app.include_router(health_router)
app.include_router(uploads_router)
app.include_router(problem_router)
app.include_router(mentor_router)
app.include_router(review_router)
app.include_router(pitch_router)
app.include_router(project_router)
app.include_router(resources_router)
app.include_router(auth_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

