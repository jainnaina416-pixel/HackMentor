from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ProblemAnalysisRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_id: Optional[str] = Field(default="default_project", description="Project identifier")
    problem_statement: str = Field(..., alias="problemStatement", description="Problem statement text")
    proposed_solution: Optional[str] = Field(default="", alias="projectIdea", description="Proposed project idea/solution")

class MentorChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_id: Optional[str] = Field(default="default_project", description="Project identifier")
    user_message: str = Field(..., alias="message", description="User question or query")
    conversation_id: Optional[str] = Field(default=None, description="Conversation session ID")
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Recent conversation messages")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Optional extra client context")
    stream: Optional[bool] = Field(default=False, description="Whether to stream response via SSE")

class ProjectReviewRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_id: Optional[str] = Field(default="default_project", description="Project identifier")
    solution_description: Optional[str] = Field(default="", alias="solution", description="Description of the solution")
    architecture: Optional[str] = Field(default="", description="High level architecture overview")
    tech_stack: Optional[List[str]] = Field(default_factory=list, alias="knownTechnologies", description="List of technologies")

class PitchGenerationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_id: Optional[str] = Field(default="default_project", description="Project identifier")
    solution_description: Optional[str] = Field(default="", alias="solution", description="Description of the solution")
    target_audience: Optional[str] = Field(default="Hackathon Judges and End Users", description="Target audience")
    pitch_duration: Optional[str] = Field(default="3 minutes", description="Target duration for demo/pitch")

class OnboardingRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_id: Optional[str] = Field(default=None, description="Optional custom project ID")
    name: Optional[str] = Field(default=None, description="Hackathon or team name")
    problem_statement: Optional[str] = Field(default="", alias="problemStatement")
    project_idea: Optional[str] = Field(default="", alias="projectIdea")
    known_technologies: Optional[List[str]] = Field(default_factory=list, alias="knownTechnologies")
    hackathon: Optional[Dict[str, Any]] = Field(default_factory=dict)
    team: Optional[Dict[str, Any]] = Field(default_factory=dict)

class PresignUploadRequest(BaseModel):
    kind: str
    fileName: str
    contentType: str
    size: int

class CompleteUploadRequest(BaseModel):
    kind: str
    key: str
    fileName: str
    size: int
