import json
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "database_status" in data
    assert "vector_store_status" in data

def test_onboarding_and_get_project():
    payload = {
        "project_id": "test_hack_101",
        "name": "EcoSense",
        "problemStatement": "High energy consumption in campus buildings.",
        "projectIdea": "IoT sensor mesh with automated HVAC shutdown.",
        "knownTechnologies": ["Python", "FastAPI", "React", "MQTT"]
    }
    # Onboard
    post_res = client.post("/api/onboarding", json=payload)
    assert post_res.status_code == 200
    project_state = post_res.json()
    assert project_state["id"] == "test_hack_101"
    assert "High energy consumption" in project_state["problemStatement"]

    # Retrieve
    get_res = client.get("/api/project/test_hack_101")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["id"] == "test_hack_101"
    assert retrieved["projectIdea"] == "IoT sensor mesh with automated HVAC shutdown."

@patch("app.services.analysis_service.get_llm")
def test_problem_analysis_endpoint(mock_get_llm):
    # Mock LLM output
    mock_llm = MagicMock()
    mock_response = MagicMock()
    mock_response.content = json.dumps({
        "problem_summary": "Campuses waste large amounts of energy heating empty rooms.",
        "target_users": ["Facilities Managers", "Students"],
        "core_requirements": ["Room occupancy sensing", "Automated thermostat scheduling"],
        "constraints_and_assumptions": ["Limited budget for IoT hardware", "36-hour hackathon"],
        "proposed_solution_assessment": "Sensible approach with measurable demo metrics.",
        "missing_requirements": ["HVAC API protocol integration"],
        "risks": ["Hardware failure during live demo"],
        "recommended_next_steps": ["Simulate sensor feed with mock data"]
    })
    mock_llm.ainvoke = AsyncMock(return_value=mock_response)
    mock_get_llm.return_value = mock_llm

    payload = {
        "project_id": "test_hack_101",
        "problemStatement": "Campuses waste electricity on empty lecture halls.",
        "projectIdea": "Sensor network with smart scheduling"
    }
    res = client.post("/api/problem/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "Facilities Managers" in data["targetUsers"]
    assert len(data["requirements"]) >= 2
    assert "sources_used" in data

@patch("app.services.mentor_service.get_llm")
def test_mentor_chat_endpoint(mock_get_llm):
    mock_llm = MagicMock()
    mock_response = MagicMock()
    mock_response.content = "For a 36-hour hackathon, cut the custom hardware build! Simulate sensor readings using a mock script and focus on a clean dashboard showing live energy savings."
    mock_llm.ainvoke = AsyncMock(return_value=mock_response)
    mock_get_llm.return_value = mock_llm

    payload = {
        "project_id": "test_hack_101",
        "message": "Are we over-scoping this project if we build custom hardware?"
    }
    res = client.post("/api/mentor/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "cut the custom hardware build" in data["message"]
    assert "conversation_id" in data
    assert "sources" in data

@patch("app.services.review_service.get_llm")
def test_project_review_endpoint(mock_get_llm):
    mock_llm = MagicMock()
    mock_response = MagicMock()
    mock_response.content = json.dumps({
        "problem_solution_fit": "Directly tackles waste with automated response.",
        "technical_feasibility": "High if hardware is simulated.",
        "innovation_and_differentiation": "Novel dynamic setback algorithm.",
        "completeness": "Core loop complete.",
        "user_experience": "Clean dark-mode dashboard.",
        "risks": "WiFi drops during judging.",
        "missing_pieces": "30-second elevator pitch.",
        "recommended_improvements": ["Pre-record a video backup"],
        "technical_implementation": "FastAPI + WebSockets"
    })
    mock_llm.ainvoke = AsyncMock(return_value=mock_response)
    mock_get_llm.return_value = mock_llm

    payload = {
        "project_id": "test_hack_101",
        "solution": "Automated energy saver",
        "architecture": "FastAPI, React, MQTT",
        "knownTechnologies": ["Python", "FastAPI"]
    }
    res = client.post("/api/project/review", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "Directly tackles waste" in data["problem"]
    assert "Pre-record a video backup" in data["recommendedNextSteps"]

@patch("app.services.pitch_service.get_llm")
def test_pitch_generate_endpoint(mock_get_llm):
    mock_llm = MagicMock()
    mock_response = MagicMock()
    mock_response.content = json.dumps({
        "project_title_and_tagline": "EcoSense: Slashing Campus Energy Costs",
        "problem": "Universities lose millions heating empty rooms.",
        "proposed_solution": "Smart IoT scheduling that cuts HVAC spend by 30%.",
        "target_users_and_impact": "Campus Sustainability Directors.",
        "key_features": ["Occupancy Detection", "Instant Cutoff", "Savings Analytics"],
        "technical_architecture_explanation": "MQTT telemetry into FastAPI backend.",
        "differentiation": "Installs in 10 minutes without rewiring.",
        "demo_sequence": ["1. Show room empty", "2. Sensor triggers cutoff", "3. Dashboard displays $ saved"],
        "suggested_slide_outline": [
            {"slide_number": 1, "title": "The Problem", "bullets": ["$2M wasted annually"]},
            {"slide_number": 2, "title": "EcoSense Demo", "bullets": ["Instant detection"]}
        ],
        "likely_judge_questions": [
            {"id": "q1", "question": "What if sensors glitch?", "suggested_answer": "Default to baseline temperature."}
        ],
        "missing_information_to_fill": ["Exact price point per room"]
    })
    mock_llm.ainvoke = AsyncMock(return_value=mock_response)
    mock_get_llm.return_value = mock_llm

    payload = {
        "project_id": "test_hack_101",
        "solution": "EcoSense smart HVAC"
    }
    res = client.post("/api/pitch/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "EcoSense" in data["pitch"]
    assert len(data["judgeQuestions"]) >= 1
    assert data["judgeQuestions"][0]["suggestedAnswer"] == "Default to baseline temperature."
