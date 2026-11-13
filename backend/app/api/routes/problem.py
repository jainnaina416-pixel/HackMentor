from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException

from app.core.logging import logger
from app.models.requests import ProblemAnalysisRequest
from app.models.responses import ProblemAnalysisResponse
from app.services.analysis_service import analysis_service

router = APIRouter(tags=["Problem Analysis"])

@router.post("/api/problem/analyze", response_model=ProblemAnalysisResponse)
async def analyze_problem(req: ProblemAnalysisRequest):
    """
    Feature A: Problem/Idea Analysis.
    Analyzes a hackathon problem statement alongside the proposed solution
    using RAG retrieval against historical hackathon projects.
    """
    try:
        result = await analysis_service.analyze_problem_and_solution(req)
        return result
    except Exception as e:
        logger.error(f"Error in problem analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Problem analysis failed: {str(e)}")

# Frontend compatibility routes
@router.post("/api/project/ideas")
async def generate_ideas(payload: Dict[str, Any]):
    prob = payload.get("problemStatement", "Hackathon Problem")
    techs = payload.get("knownTechnologies", ["React", "FastAPI"])
    return {
        "ideas": [
            {
                "title": "HackMentor AI",
                "summary": "AI copilot assisting hackathon teams from ideation to pitch deck.",
                "whyItFits": f"Leverages team skills ({', '.join(techs)}) with strong hackathon demo impact.",
            },
            {
                "title": "Smart Community Diagnostics",
                "summary": "Offline-first progressive web app providing instant recommendations.",
                "whyItFits": "Addresses accessibility and network constraints effectively.",
            }
        ]
    }

@router.post("/api/project/validate")
async def validate_idea(payload: Dict[str, Any]):
    return {
        "fits": True,
        "notes": "Strong alignment with problem statement. Keep MVP scope strictly bounded to 2 core user interactions.",
    }
