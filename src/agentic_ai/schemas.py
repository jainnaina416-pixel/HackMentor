from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class AuthUser(BaseModel):
    id: str
    email: str
    name: str

class AuthSession(BaseModel):
    token: str
    user: AuthUser

# --- Core Hackathon Project Schemas ---
class HackathonInfo(BaseModel):
    name: str
    startAt: str
    deadlineAt: str

class TeamMember(BaseModel):
    id: str
    name: str
    role: str
    skills: List[str] = []
    avatarHue: int = 168

class Team(BaseModel):
    name: str
    members: List[TeamMember]

class ProblemAnalysis(BaseModel):
    simpleWords: str
    targetUsers: List[str]
    coreProblem: str
    requirements: List[str]
    constraints: List[str]
    importantQuestions: List[str]
    possibleDirections: List[str]
    risks: List[str]

class ProjectIdea(BaseModel):
    title: str
    summary: str
    whyItFits: str

StageStatus = Literal["not_started", "in_progress", "completed", "at_risk"]

class RoadmapStage(BaseModel):
    id: str
    name: str
    order: int
    status: StageStatus = "not_started"
    progress: int = 0
    estimatedHours: float = 2.0
    deadlineAt: str
    taskIds: List[str] = []
    notes: Optional[str] = None

class Roadmap(BaseModel):
    stages: List[RoadmapStage]
    generatedAt: Optional[str] = None

TaskStatus = Literal["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]
TaskPriority = Literal["low", "medium", "high", "critical"]

class Task(BaseModel):
    id: str
    name: str
    description: str = ""
    assigneeId: Optional[str] = None
    priority: TaskPriority = "medium"
    estimatedHours: float = 2.0
    deadlineAt: str
    status: TaskStatus = "TODO"
    stageId: Optional[str] = None

ResourceCategory = Literal[
    "Datasets",
    "APIs",
    "Documentation",
    "Libraries",
    "Tutorials",
    "Research papers",
    "Similar projects",
    "Tools",
]

class ResourceItem(BaseModel):
    id: str
    name: str
    description: str
    category: ResourceCategory = "Tools"
    source: str = "Web"
    whyUseful: str = ""
    url: str = ""

class ProjectReview(BaseModel):
    problem: str
    solution: str
    technicalImplementation: str
    innovation: str
    feasibility: str
    userExperience: str
    risks: str
    missingPieces: str
    recommendedNextSteps: List[str]

class JudgeQuestion(BaseModel):
    id: str
    question: str
    suggestedAnswer: str

class PitchPack(BaseModel):
    pitch: str
    structure: List[str]
    problemExplanation: str
    solutionExplanation: str
    architectureExplanation: str
    demoFlow: List[str]
    talkingPoints: List[str]
    judgeQuestions: List[JudgeQuestion]

class MentorMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    createdAt: str

class MentorRecommendation(BaseModel):
    headline: str
    body: str
    urgency: Literal["calm", "focus", "critical"] = "focus"

class UpcomingDeadline(BaseModel):
    label: str
    at: str

class DashboardSnapshot(BaseModel):
    currentStage: str = "Understand Problem"
    progressPercent: int = 0
    todayPriorities: List[str] = []
    upcomingDeadlines: List[UpcomingDeadline] = []
    blockers: List[str] = []
    recommendation: Optional[MentorRecommendation] = None

class ProjectState(BaseModel):
    hackathon: HackathonInfo
    team: Team
    problemStatement: str
    projectIdea: str
    knownTechnologies: List[str] = []
    analysis: Optional[ProblemAnalysis] = None
    roadmap: Roadmap
    tasks: List[Task] = []
    resources: List[ResourceItem] = []
    review: Optional[ProjectReview] = None
    pitch: Optional[PitchPack] = None
    messages: List[MentorMessage] = []
    dashboard: DashboardSnapshot

class OnboardingPayload(BaseModel):
    hackathon: HackathonInfo
    team: Team
    problemStatement: str
    projectIdea: str
    knownTechnologies: List[str] = []

# --- Project Validation & Ideas ---
class ProjectIdeasPayload(BaseModel):
    problemStatement: str
    knownTechnologies: List[str] = []

class ProjectIdeasResponse(BaseModel):
    ideas: List[ProjectIdea]

class ValidateIdeaPayload(BaseModel):
    problemStatement: str
    projectIdea: str

class ValidateIdeaResponse(BaseModel):
    fits: bool
    notes: str

# --- Mentor Chat Schemas ---
class ChatRequestContext(BaseModel):
    problemStatement: Optional[str] = ""
    projectIdea: Optional[str] = ""
    team: Optional[Team] = None
    tasks: Optional[List[Task]] = None
    roadmap: Optional[Roadmap] = None
    remainingMs: Optional[float] = None

class ChatRequest(BaseModel):
    message: str
    history: List[MentorMessage] = []
    context: Optional[ChatRequestContext] = None
    stream: Optional[bool] = False

# --- Search Resources Payload ---
class SearchResourcesPayload(BaseModel):
    query: str
    problemStatement: Optional[str] = ""
    idea: Optional[str] = None

# --- S3 Upload Schemas ---
class PresignUploadRequest(BaseModel):
    kind: str  # e.g., 'team_details' or 'project_description'
    fileName: str
    contentType: str
    size: int

class PresignUploadResponse(BaseModel):
    uploadUrl: str
    method: str = "PUT"
    bucket: str
    key: str
    headers: Dict[str, str]

class CompleteUploadRequest(BaseModel):
    kind: str
    key: str
    fileName: str
    size: int

class StoredUpload(BaseModel):
    kind: str
    fileName: str
    size: int
    contentType: str
    bucket: str
    key: str
    uploadedAt: str
    demo: bool = False
