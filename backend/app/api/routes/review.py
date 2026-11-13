from fastapi import APIRouter, HTTPException

from app.core.logging import logger
from app.models.requests import ProjectReviewRequest
from app.models.responses import ProjectReviewResponse
from app.services.review_service import review_service

router = APIRouter(tags=["Project Review"])

@router.post("/api/project/review", response_model=ProjectReviewResponse)
async def review_project(req: ProjectReviewRequest):
    """
    Feature C: Project Review.
    Evaluates project completeness, feasibility, innovation, UX, and risks
    benchmarked against relevant historical hackathon projects.
    """
    try:
        response = await review_service.review_project(req)
        return response
    except Exception as e:
        logger.error(f"Error in project review: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Project review failed: {str(e)}")
