from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from app.core.logging import logger
from app.models.requests import PitchGenerationRequest
from app.models.responses import PitchGenerationResponse, JudgeQuestionItem
from app.services.pitch_service import pitch_service

router = APIRouter(tags=["Pitch Generation"])

@router.post("/api/pitch/generate", response_model=PitchGenerationResponse)
async def generate_pitch(req: PitchGenerationRequest):
    """
    Feature D: Pitch Generation.
    Generates a structured pitch deck outline, demo sequence, technical explanation,
    and anticipated judge Q&A grounded in project context.
    """
    try:
        response = await pitch_service.generate_pitch(req)
        return response
    except Exception as e:
        logger.error(f"Error generating pitch: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Pitch generation failed: {str(e)}")

@router.post("/api/judge/questions", response_model=List[JudgeQuestionItem])
async def judge_questions(payload: Dict[str, Any]):
    """Returns likely judge questions for the project."""
    req = PitchGenerationRequest(
        project_id=payload.get("project_id", "default_project"),
        solution_description=payload.get("projectIdea", "")
    )
    pitch_data = await pitch_service.generate_pitch(req)
    return pitch_data.likely_judge_questions
