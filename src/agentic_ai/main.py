import asyncio
import datetime
import json
import os
import time
from typing import AsyncGenerator, Dict, Any, List, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agentic_ai.schemas import (
    AuthSession,
    AuthUser,
    ChatRequest,
    CompleteUploadRequest,
    DashboardSnapshot,
    HackathonInfo,
    JudgeQuestion,
    LoginRequest,
    MentorMessage,
    MentorRecommendation,
    OnboardingPayload,
    PitchPack,
    PresignUploadRequest,
    PresignUploadResponse,
    ProblemAnalysis,
    ProjectIdea,
    ProjectIdeasPayload,
    ProjectIdeasResponse,
    ProjectReview,
    ProjectState,
    RegisterRequest,
    ResourceItem,
    Roadmap,
    RoadmapStage,
    SearchResourcesPayload,
    StoredUpload,
    Task,
    Team,
    TeamMember,
    UpcomingDeadline,
    ValidateIdeaPayload,
    ValidateIdeaResponse,
)
from agentic_ai.prompts import (
    MENTOR_CHAT_PROMPT,
    PROBLEM_ANALYZER_PROMPT,
    ROADMAP_PLANNER_PROMPT,
    TASK_GENERATOR_PROMPT,
    PROJECT_REVIEWER_PROMPT,
    PITCH_GENERATOR_PROMPT,
)
from agentic_ai.s3_service import generate_presigned_upload_url, extract_pdf_text_from_s3

app = FastAPI(
    title="HackMentor Agentic AI Backend",
    description="Backend service powering HackMentor AI agents, AWS S3 uploads, and live streaming.",
    version="1.0.0",
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_default_project() -> ProjectState:
    now = datetime.datetime.now(datetime.timezone.utc)
    start_at = (now - datetime.timedelta(hours=8)).isoformat()
    deadline_at = (now + datetime.timedelta(hours=28)).isoformat()

    default_members = [
        TeamMember(id="u1", name="Aisha Khan", role="Team lead · Full stack", skills=["React", "Product", "FastAPI"], avatarHue=168),
        TeamMember(id="u2", name="Rohan Mehta", role="ML engineer", skills=["PyTorch", "TFLite", "Computer vision"], avatarHue=28),
        TeamMember(id="u3", name="Priya Sharma", role="Design · Frontend", skills=["Figma", "UI", "Accessibility"], avatarHue=212),
        TeamMember(id="u4", name="Vikram Patel", role="Backend · DevOps", skills=["PostgreSQL", "Docker", "Sync"], avatarHue=280),
    ]

    default_stages_names = [
        "Understand Problem",
        "Form Solution Hypothesis",
        "Architecture & Tech Stack",
        "Setup Repo & Foundation",
        "Build Core Feature (MVP)",
        "Secondary Feature",
        "Connect End-to-End",
        "Testing & Polish",
        "Demo & Pitch Prep",
        "Buffer & Submit",
    ]

    stages = [
        RoadmapStage(
            id=f"s{i + 1}",
            name=name,
            order=i + 1,
            status="in_progress" if i == 0 else "not_started",
            progress=20 if i == 0 else 0,
            estimatedHours=float([2, 2, 1.5, 2, 10, 4, 3, 2, 3, 1][i] if i < 10 else 2),
            deadlineAt=deadline_at,
            taskIds=[],
        )
        for i, name in enumerate(default_stages_names)
    ]

    return ProjectState(
        hackathon=HackathonInfo(name="Smart India Hackathon", startAt=start_at, deadlineAt=deadline_at),
        team=Team(name="TechNova", members=default_members),
        problemStatement="Smallholder farmers lose 20-40% of their harvest to crop diseases identified too late. Agricultural extension officers are scarce, and farmers cannot interpret lab reports. Build a practical solution to detect common crop diseases early in rural low-connectivity areas.",
        projectIdea="CropGuard: an offline-first mobile web app that classifies leaf images, explains the disease in simple language, and recommends locally available treatments.",
        knownTechnologies=["React", "FastAPI", "Python", "TFLite", "TailwindCSS"],
        analysis=None,
        roadmap=Roadmap(stages=stages, generatedAt=now.isoformat()),
        tasks=[],
        resources=[],
        review=None,
        pitch=None,
        messages=[
            MentorMessage(
                id="welcome",
                role="assistant",
                content="Welcome, TechNova. I have your problem statement and team roster. Let's analyze the problem first, freeze scope, and generate an actionable roadmap.",
                createdAt=now.isoformat(),
            )
        ],
        dashboard=DashboardSnapshot(
            currentStage="Understand Problem",
            progressPercent=15,
            todayPriorities=["Analyze problem statement", "Confirm user personas", "Freeze MVP scope"],
            upcomingDeadlines=[
                UpcomingDeadline(label="Scope freeze", at=deadline_at),
                UpcomingDeadline(label="Final Submission", at=deadline_at),
            ],
            blockers=[],
            recommendation=MentorRecommendation(
                headline="Start by making the problem unmistakable.",
                body="Use Analyze Problem, then freeze a demo-sized idea before generating tasks.",
                urgency="focus",
            ),
        ),
    )

# In-memory stores
PROJECT_STORE: Dict[str, ProjectState] = {"current": create_default_project()}
UPLOADS_STORE: Dict[str, StoredUpload] = {}

def get_llm():
    """Initializes available LLM provider based on environment API keys."""
    groq_key = os.getenv("GROQ_API_KEY") or os.getenv("Groq_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY") or os.getenv("Google_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY") or os.getenv("OpenAI_API_KEY")
    
    if groq_key:
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(groq_api_key=groq_key, model_name="llama-3.3-70b-versatile", streaming=True)
        except Exception as e:
            print("Groq LLM init info:", e)
    if google_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(google_api_key=google_key, model="gemini-1.5-flash", streaming=True)
        except Exception as e:
            print("Google LLM init info:", e)
    if openai_key:
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(api_key=openai_key, model="gpt-4o-mini", streaming=True)
        except Exception as e:
            print("OpenAI LLM init info:", e)
    return None

# --- Auth Endpoints ---
@app.post("/api/auth/login", response_model=AuthSession)
async def login(req: LoginRequest):
    return AuthSession(
        token=f"auth.token.{req.email}.{int(time.time())}",
        user=AuthUser(id="usr_101", name=req.email.split("@")[0].title(), email=req.email),
    )

@app.post("/api/auth/register", response_model=AuthSession)
async def register(req: RegisterRequest):
    return AuthSession(
        token=f"auth.token.{req.email}.{int(time.time())}",
        user=AuthUser(id="usr_102", name=req.name, email=req.email),
    )

@app.post("/api/auth/logout")
async def logout():
    return {"status": "success"}

# --- Onboarding & Project State ---
@app.post("/api/onboarding", response_model=ProjectState)
async def onboarding(payload: OnboardingPayload):
    now = datetime.datetime.now(datetime.timezone.utc)
    default_stages_names = [
        "Understand Problem",
        "Form Solution Hypothesis",
        "Architecture & Tech Stack",
        "Setup Repo & Foundation",
        "Build Core Feature (MVP)",
        "Secondary Feature",
        "Connect End-to-End",
        "Testing & Polish",
        "Demo & Pitch Prep",
        "Buffer & Submit",
    ]

    stages = [
        RoadmapStage(
            id=f"s{i + 1}",
            name=name,
            order=i + 1,
            status="in_progress" if i == 0 else "not_started",
            progress=10 if i == 0 else 0,
            estimatedHours=float([2, 2, 1.5, 2, 10, 4, 3, 2, 3, 1][i] if i < 10 else 2),
            deadlineAt=payload.hackathon.deadlineAt,
            taskIds=[],
        )
        for i, name in enumerate(default_stages_names)
    ]

    project_state = ProjectState(
        hackathon=payload.hackathon,
        team=payload.team,
        problemStatement=payload.problemStatement,
        projectIdea=payload.projectIdea,
        knownTechnologies=payload.knownTechnologies,
        analysis=None,
        roadmap=Roadmap(stages=stages, generatedAt=now.isoformat()),
        tasks=[],
        resources=[],
        review=None,
        pitch=None,
        messages=[
            MentorMessage(
                id="welcome",
                role="assistant",
                content=f"Welcome, {payload.team.name}. I have your problem statement and team setup. Let's analyze the problem and lock scope before building.",
                createdAt=now.isoformat(),
            )
        ],
        dashboard=DashboardSnapshot(
            currentStage="Understand Problem",
            progressPercent=10,
            todayPriorities=["Analyze the problem statement", "Confirm target user personas", "Scope out initial MVP"],
            upcomingDeadlines=[
                UpcomingDeadline(label="Scope freeze", at=payload.hackathon.deadlineAt),
                UpcomingDeadline(label="Submission", at=payload.hackathon.deadlineAt),
            ],
            blockers=[],
            recommendation=MentorRecommendation(
                headline="Start by making the problem unmistakable.",
                body="Use Analyze Problem, then freeze a demo-sized idea before generating tasks.",
                urgency="focus",
            ),
        ),
    )
    PROJECT_STORE["current"] = project_state
    return project_state

@app.get("/api/project", response_model=ProjectState)
async def get_project():
    if "current" not in PROJECT_STORE:
        PROJECT_STORE["current"] = create_default_project()
    return PROJECT_STORE["current"]

@app.get("/api/team", response_model=Team)
async def get_team():
    curr = await get_project()
    return curr.team

@app.get("/api/tasks", response_model=List[Task])
async def get_tasks():
    curr = await get_project()
    return curr.tasks

# --- Agent 1: Problem Analysis ---
@app.post("/api/problem/analyze", response_model=ProblemAnalysis)
async def analyze_problem(payload: Dict[str, str]):
    statement = payload.get("problemStatement", "")
    llm = get_llm()
    if llm:
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            res = await llm.ainvoke([
                SystemMessage(content=PROBLEM_ANALYZER_PROMPT),
                HumanMessage(content=f"Problem Statement:\n{statement}")
            ])
            content = res.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            parsed = json.loads(content)
            return ProblemAnalysis(**parsed)
        except Exception as e:
            print("Problem Analysis LLM fallback:", e)

    return ProblemAnalysis(
        simpleWords="End users cannot easily detect and treat problems in time due to lack of accessible tools. They need a fast, local way to identify issues and take immediate action.",
        targetUsers=[
            "Direct everyday practitioners needing immediate assistance",
            "Field coordinators managing operational responses",
            "Technical teams requiring reliable, structured insights",
        ],
        coreProblem="Late and uncertain issue identification combined with complex or hard-to-action field advice.",
        requirements=[
            "Detect high-impact issues from direct user inputs/photos",
            "Provide plain language explanations and next actionable steps",
            "Work with intermittent or offline connectivity",
            "Produce an engaging demo judges can evaluate in under 3 minutes",
        ],
        constraints=[
            "Hackathon time limit constraint",
            "Varying user devices and network bandwidth",
            "Safe and validated recommendations only",
        ],
        importantQuestions=[
            "What 2-3 core use cases are strictly in scope for the demo?",
            "What is the simplest architecture that demonstrates end-to-end value?",
            "How does the user experience gracefully handle low connectivity?",
        ],
        possibleDirections=[
            "Lightweight client-first web application with instant recommendations",
            "Guided interactive troubleshooting workflow",
            "Automated reporting dashboard for team coordination",
        ],
        risks=[
            "Scope creep during the build phase",
            "Over-complicating technical architecture before getting MVP running",
            "Unclear pitch demo during final judging",
        ],
    )

# --- Project Validation & Ideas ---
@app.post("/api/project/ideas", response_model=ProjectIdeasResponse)
async def generate_ideas(payload: ProjectIdeasPayload):
    techs = ", ".join(payload.knownTechnologies) if payload.knownTechnologies else "React, Python, FastAPI"
    return ProjectIdeasResponse(
        ideas=[
            ProjectIdea(
                title="HackMentor Copilot",
                summary="An intelligent agentic hackathon assistant that guides teams from problem discovery to pitch deck.",
                whyItFits=f"Leverages known skills ({techs}) while solving a clear, high-impact hackathon workflow need.",
            ),
            ProjectIdea(
                title="Smart Field Diagnostics",
                summary="Offline-first progressive web app providing instant recommendations and human fallback verification.",
                whyItFits="Addresses time, accessibility, and connectivity constraints effectively within the hackathon timeline.",
            ),
        ]
    )

@app.post("/api/project/validate", response_model=ValidateIdeaResponse)
async def validate_idea(payload: ValidateIdeaPayload):
    return ValidateIdeaResponse(
        fits=True,
        notes="Strong alignment with problem statement and constraints. Keep MVP scope strictly bounded to 2 core user interactions.",
    )

# --- Agent 2: Roadmap Generation ---
@app.post("/api/roadmap/generate", response_model=Roadmap)
async def generate_roadmap(payload: Dict[str, Any]):
    curr = await get_project()
    deadline = curr.hackathon.deadlineAt
    stage_names = [
        "Understand Problem & Scope",
        "Form Solution Hypothesis",
        "Architecture & Tech Stack",
        "Setup Repo & Foundation",
        "Build Core Feature (MVP)",
        "Secondary Feature & Polish",
        "Connect End-to-End Flow",
        "Demo Video & Pitch Deck Prep",
    ]
    hours = [2.0, 1.5, 2.0, 2.5, 8.0, 4.0, 3.0, 2.5]
    stages = [
        RoadmapStage(
            id=f"s{i + 1}",
            name=name,
            order=i + 1,
            status="in_progress" if i == 0 else "not_started",
            progress=25 if i == 0 else 0,
            estimatedHours=hours[i],
            deadlineAt=deadline,
            taskIds=[],
        )
        for i, name in enumerate(stage_names)
    ]
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    roadmap = Roadmap(stages=stages, generatedAt=now)
    curr.roadmap = roadmap
    PROJECT_STORE["current"] = curr
    return roadmap

# --- Agent 3: Task Generator ---
@app.post("/api/tasks/generate", response_model=List[Task])
async def generate_tasks(payload: Dict[str, Any]):
    curr = await get_project()
    deadline = curr.hackathon.deadlineAt
    members = curr.team.members
    m1 = members[0].id if members else "u1"
    m2 = members[1].id if len(members) > 1 else m1

    tasks = [
        Task(
            id="t1",
            name="Initialize React frontend & connect API client",
            description="Verify Vite server runs and proxies API requests cleanly.",
            assigneeId=m1,
            priority="high",
            estimatedHours=1.5,
            deadlineAt=deadline,
            status="IN_PROGRESS",
            stageId="s1",
        ),
        Task(
            id="t2",
            name="Implement core backend endpoints & Agent logic",
            description="Setup FastAPI endpoints for problem analysis, SSE streaming, and S3 uploads.",
            assigneeId=m2,
            priority="critical",
            estimatedHours=3.0,
            deadlineAt=deadline,
            status="TODO",
            stageId="s2",
        ),
        Task(
            id="t3",
            name="End-to-end integration and presentation rehearsal",
            description="Test live demo flow, ensure fallback demo data is solid, and record backup video.",
            assigneeId=m1,
            priority="high",
            estimatedHours=2.0,
            deadlineAt=deadline,
            status="TODO",
            stageId="s3",
        ),
    ]
    curr.tasks = tasks
    PROJECT_STORE["current"] = curr
    return tasks

# --- Agent 4: Mentor Real-time Chat (Supporting SSE Stream) ---
async def mentor_chat_stream_generator(req: ChatRequest) -> AsyncGenerator[str, None]:
    """Streams live tokens from LLM via Server-Sent Events (SSE)."""
    llm = get_llm()
    if llm:
        try:
            from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
            lc_messages = [SystemMessage(content=MENTOR_CHAT_PROMPT)]
            for m in req.history:
                if m.role == "user":
                    lc_messages.append(HumanMessage(content=m.content))
                elif m.role == "assistant":
                    lc_messages.append(AIMessage(content=m.content))
            lc_messages.append(HumanMessage(content=req.message))

            async for chunk in llm.astream(lc_messages):
                text = chunk.content
                if text:
                    data = json.dumps({"message": text})
                    yield f"data: {data}\n\n"
            return
        except Exception as e:
            print("Live LLM Stream Exception, falling back:", e)

    # Fallback token streaming
    fallback_text = (
        f"Hey team! Regarding your question:\n\n"
        f"1. **Protect the Critical Path**: Focus on 1 killer workflow that proves your thesis.\n"
        f"2. **Simple Architecture**: FastAPI + React + S3 PDF uploads give you great demo leverage without operational friction.\n"
        f"3. **Judge Focus**: Make sure you have a 30-second elevator pitch and an explicit fallback demo flow.\n\n"
        f"What feature would you like to tackle next?"
    )
    for word in fallback_text.split(" "):
        data = json.dumps({"message": word + " "})
        yield f"data: {data}\n\n"
        await asyncio.sleep(0.04)

@app.post("/api/mentor/chat")
async def mentor_chat(req: ChatRequest):
    if req.stream:
        return StreamingResponse(
            mentor_chat_stream_generator(req),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )
    return {
        "message": f"Mentor guidance for '{req.message}': Stay focused on your primary demo flow and keep code simple!"
    }

# --- Agent 5: Code & Pitch Review ---
@app.post("/api/project/review", response_model=ProjectReview)
async def review_project(payload: Dict[str, Any]):
    return ProjectReview(
        problem="The problem statement is clear, concrete, and addresses an urgent real-world need with measurable impact.",
        solution="The proposed solution is properly scoped for a hackathon MVP, prioritizing essential features over vanity additions.",
        technicalImplementation="Clean full-stack design with responsive UI, live SSE streaming mentorship, and scalable cloud storage.",
        innovation="AI-assisted guidance tailored specifically to hackathon constraints and evaluation metrics.",
        feasibility="Highly feasible within the remaining hackathon hours if scope freeze is maintained.",
        userExperience="Intuitive dark-mode dashboard with clear countdown timers, stage milestones, and quick action cards.",
        risks="Scope creep if additional APIs or complex external integrations are introduced late in the event.",
        missingPieces="Record a backup 2-minute demo video and prepare answers to common judge technical questions.",
        recommendedNextSteps=[
            "Freeze all major feature additions 4 hours before deadline.",
            "Test complete user flow on a fresh browser session.",
            "Rehearse the 3-minute pitch with active role delegation.",
        ],
    )

# --- Agent 6: Resource Search ---
@app.post("/api/resources/search", response_model=List[ResourceItem])
async def search_resources(payload: SearchResourcesPayload):
    q = (payload.query or "").lower()
    all_items = [
        ResourceItem(
            id="r1",
            name="AWS S3 Presigned URLs Guide",
            description="Secure direct browser-to-bucket upload without exposing AWS secret keys.",
            category="Documentation",
            source="AWS Docs",
            whyUseful="Enables smooth PDF document uploads directly from the React frontend.",
            url="https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-urls.html",
        ),
        ResourceItem(
            id="r2",
            name="FastAPI Streaming Responses",
            description="High-performance Server-Sent Events (SSE) for streaming LLM tokens.",
            category="Libraries",
            source="FastAPI",
            whyUseful="Provides instant real-time AI mentor replies directly in the chat UI.",
            url="https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse",
        ),
        ResourceItem(
            id="r3",
            name="Lucide React Icons",
            description="Clean, customizable icon set tailored for modern web interfaces.",
            category="Tools",
            source="Lucide",
            whyUseful="Used throughout HackMentor for crisp visual indicators and status badges.",
            url="https://lucide.dev/",
        ),
    ]
    if not q:
        return all_items
    return [item for item in all_items if q in item.name.lower() or q in item.description.lower()]

# --- Agent 7: Pitch Generator & Judge Questions ---
@app.post("/api/pitch/generate", response_model=PitchPack)
async def generate_pitch(payload: Dict[str, Any]):
    return PitchPack(
        pitch="HackMentor empowers hackathon teams to move from ambiguous problem statements to winning MVPs with 24/7 AI-guided roadmaps, real-time code advice, and automated pitch preparation.",
        structure=[
            "1. The Problem: Hackathon chaos and missed deadlines",
            "2. The Solution: HackMentor 24/7 AI Copilot",
            "3. Live Demo: Direct PDF uploads, roadmap breakdown, live mentor chat",
            "4. Architecture: React + FastAPI + AWS S3 + Agentic AI",
            "5. Business Value & Next Steps",
        ],
        problemExplanation="Hackathon teams lose valuable hours struggling with ambiguous requirements, uncoordinated tasks, and unavailable human mentors.",
        solutionExplanation="HackMentor provides continuous personalized mentorship, automatic roadmap scheduling, and instant context awareness from hackathon documents.",
        architectureExplanation="Modular frontend communicating over REST and SSE to an agentic FastAPI backend integrated with AWS S3 for secure document RAG.",
        demoFlow=[
            "Step 1: Set up event and team roster during onboarding",
            "Step 2: Generate automated roadmap and bite-sized tasks",
            "Step 3: Upload problem PDF directly to S3",
            "Step 4: Ask HackMentor for real-time live-streamed code guidance",
            "Step 5: Review project readiness and pitch slide outline",
        ],
        talkingPoints=[
            "We prioritized an offline-resilient, demo-first architecture.",
            "Real-time streaming ensures no waiting or lag during mentorship.",
            "All tasks are dynamically mapped to team roles and deadlines.",
        ],
        judgeQuestions=[
            JudgeQuestion(
                id="q1",
                question="How does your solution handle security during file uploads?",
                suggestedAnswer="We generate short-lived AWS S3 Presigned PUT URLs, so files upload directly to S3 without backend credentials ever being exposed to clients.",
            ),
            JudgeQuestion(
                id="q2",
                question="What happens if the external LLM provider experiences latency?",
                suggestedAnswer="Our client-side architecture includes local fallback responses and streaming timeouts, ensuring the live demo is 100% resilient.",
            ),
            JudgeQuestion(
                id="q3",
                question="How do you ensure teams don't over-scope their MVP?",
                suggestedAnswer="The Roadmap Planner explicitly bounds features by available countdown hours and flags non-essential features as secondary.",
            ),
        ],
    )

@app.post("/api/judge/questions", response_model=List[JudgeQuestion])
async def judge_questions(payload: Dict[str, Any]):
    pitch_data = await generate_pitch(payload)
    return pitch_data.judgeQuestions

# --- AWS S3 Presigned Upload & Storage Endpoints ---
@app.post("/api/uploads/presign", response_model=PresignUploadResponse)
async def presign_upload(req: PresignUploadRequest):
    return generate_presigned_upload_url(
        kind=req.kind,
        file_name=req.fileName,
        content_type=req.contentType,
    )

# Mock PUT endpoint for local testing when AWS credentials are not set
@app.put("/api/uploads/mock-put")
async def mock_upload_put(request: Request, key: str = "default.pdf"):
    body = await request.body()
    return Response(content=json.dumps({"status": "uploaded", "size": len(body), "key": key}), status_code=200, media_type="application/json")

@app.post("/api/uploads/complete", response_model=StoredUpload)
async def complete_upload(req: CompleteUploadRequest):
    bucket = os.getenv("AWS_S3_BUCKET_NAME", "hackmentor-uploads")
    stored = StoredUpload(
        kind=req.kind,
        fileName=req.fileName,
        size=req.size,
        contentType="application/pdf",
        bucket=bucket,
        key=req.key,
        uploadedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        demo=False if os.getenv("AWS_ACCESS_KEY_ID") else True,
    )
    UPLOADS_STORE[req.key] = stored
    return stored

@app.get("/api/uploads", response_model=List[StoredUpload])
async def list_uploads():
    return list(UPLOADS_STORE.values())
