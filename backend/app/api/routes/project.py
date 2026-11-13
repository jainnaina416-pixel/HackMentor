from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException

from app.core.logging import logger
from app.models.requests import OnboardingRequest
from app.services.project_service import project_service
from app.services.resource_service import resource_service

router = APIRouter(tags=["Project & Onboarding"])

def get_default_project_state(pid: str = "default_project") -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    deadline = (now + timedelta(hours=28)).isoformat()
    return {
        "id": pid,
        "hackathon": {
            "name": "Smart India Hackathon",
            "startAt": (now - timedelta(hours=8)).isoformat(),
            "deadlineAt": deadline,
        },
        "team": {
            "name": "TechNova",
            "members": [
                {"id": "u1", "name": "Aisha Khan", "role": "Team lead · Full stack", "skills": ["React", "FastAPI"], "avatarHue": 168},
                {"id": "u2", "name": "Rohan Mehta", "role": "ML engineer", "skills": ["PyTorch", "Computer Vision"], "avatarHue": 28},
                {"id": "u3", "name": "Priya Sharma", "role": "Design · Frontend", "skills": ["UI/UX", "Tailwind"], "avatarHue": 212},
            ]
        },
        "problemStatement": "Smallholder farmers lose crop yield to diseases identified too late. Need low-connectivity early detection tool.",
        "projectIdea": "CropGuard: an offline-first mobile web app classifying leaf images with local language advice.",
        "knownTechnologies": ["React", "FastAPI", "Python", "TFLite", "ChromaDB"],
        "analysis": None,
        "roadmap": {
            "stages": [
                {"id": "s1", "name": "Understand Problem & Scope", "order": 1, "status": "in_progress", "progress": 25, "estimatedHours": 2.0, "deadlineAt": deadline, "taskIds": []},
                {"id": "s2", "name": "Core MVP Architecture", "order": 2, "status": "not_started", "progress": 0, "estimatedHours": 6.0, "deadlineAt": deadline, "taskIds": []},
                {"id": "s3", "name": "Connect End-to-End Demo", "order": 3, "status": "not_started", "progress": 0, "estimatedHours": 4.0, "deadlineAt": deadline, "taskIds": []},
                {"id": "s4", "name": "Pitch Deck & Rehearsal", "order": 4, "status": "not_started", "progress": 0, "estimatedHours": 2.5, "deadlineAt": deadline, "taskIds": []},
            ],
            "generatedAt": now.isoformat()
        },
        "tasks": [
            {"id": "t1", "name": "Initialize React frontend and connect API", "description": "Verify Vite server and API routes.", "assigneeId": "u1", "priority": "high", "estimatedHours": 1.5, "deadlineAt": deadline, "status": "IN_PROGRESS", "stageId": "s1"},
            {"id": "t2", "name": "Build RAG vector pipeline and PDF extraction", "description": "Index Devpost dataset and handle team uploads.", "assigneeId": "u2", "priority": "critical", "estimatedHours": 3.0, "deadlineAt": deadline, "status": "TODO", "stageId": "s2"},
        ],
        "resources": resource_service.get_all_resources(),
        "review": None,
        "pitch": None,
        "messages": [
            {"id": "welcome", "role": "assistant", "content": "Welcome to HackMentor! Your RAG-powered hackathon mentor is online. How can I help you scope your project?", "createdAt": now.isoformat()}
        ],
        "dashboard": {
            "currentStage": "Understand Problem & Scope",
            "progressPercent": 20,
            "todayPriorities": ["Review historical hackathon submissions", "Upload team guidelines PDF", "Finalize core MVP scope"],
            "upcomingDeadlines": [{"label": "Scope Freeze", "at": deadline}],
            "blockers": [],
            "recommendation": {
                "headline": "Lock down 1 killer demo workflow.",
                "body": "Avoid building auth from scratch. Focus on the core value proposition.",
                "urgency": "focus"
            }
        }
    }

@router.post("/api/onboarding")
async def onboarding(req: OnboardingRequest):
    """Creates a new hackathon project context and stores it in SQLite."""
    pid = req.project_id or "default_project"
    name = req.name or (req.hackathon.get("name") if req.hackathon else "My Hackathon Project")
    
    project_service.create_or_update_project(
        project_id=pid,
        name=name,
        problem_statement=req.problem_statement,
        solution=req.project_idea,
        metadata={
            "hackathon": req.hackathon,
            "team": req.team,
            "knownTechnologies": req.known_technologies,
        }
    )
    
    state = get_default_project_state(pid)
    state["problemStatement"] = req.problem_statement or state["problemStatement"]
    state["projectIdea"] = req.project_idea or state["projectIdea"]
    if req.hackathon:
        state["hackathon"].update(req.hackathon)
    if req.team:
        state["team"].update(req.team)
    if req.known_technologies:
        state["knownTechnologies"] = req.known_technologies
    return state

@router.get("/api/project/{project_id}")
async def get_project_by_id_route(project_id: str):
    """Retrieves full stored project context and uploaded documents."""
    record = project_service.get_project(project_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Project with ID '{project_id}' not found.")
    
    state = get_default_project_state(project_id)
    state["problemStatement"] = record.get("problem_statement") or state["problemStatement"]
    state["projectIdea"] = record.get("solution") or state["projectIdea"]
    state["documents"] = record.get("documents", [])
    return state

@router.get("/api/project")
async def get_current_project():
    """Returns the active or default project context."""
    return await get_project_by_id_route("default_project")

@router.get("/api/team")
async def get_team():
    proj = await get_current_project()
    return proj["team"]

@router.get("/api/tasks")
async def get_tasks():
    proj = await get_current_project()
    return proj["tasks"]

@router.post("/api/roadmap/generate")
async def generate_roadmap(payload: Dict[str, Any]):
    proj = await get_current_project()
    return proj["roadmap"]

@router.post("/api/tasks/generate")
async def generate_tasks(payload: Dict[str, Any]):
    proj = await get_current_project()
    return proj["tasks"]

@router.get("/api/resources")
async def get_all_resources():
    return resource_service.get_all_resources()

@router.post("/api/resources/search")
async def search_resources(payload: Dict[str, Any]):
    query = payload.get("query", "")
    problem = payload.get("problemStatement", "")
    idea = payload.get("idea", "")
    return await resource_service.search_resources(query=query, problem_statement=problem, idea=idea)

# Auth mock endpoints for local frontend
@router.post("/api/auth/login")
async def auth_login(payload: Dict[str, Any]):
    email = payload.get("email", "hacker@hackmentor.local")
    return {
        "token": f"mock_jwt_{email}",
        "user": {"id": "u1", "email": email, "name": email.split("@")[0].title()}
    }

@router.post("/api/auth/register")
async def auth_register(payload: Dict[str, Any]):
    email = payload.get("email", "hacker@hackmentor.local")
    name = payload.get("name", "Hacker")
    return {
        "token": f"mock_jwt_{email}",
        "user": {"id": "u1", "email": email, "name": name}
    }

@router.post("/api/auth/logout")
async def auth_logout():
    return {"status": "success"}
