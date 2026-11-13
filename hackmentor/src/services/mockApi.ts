import { DEFAULT_STAGES, MOCK_ANALYSIS, MOCK_PITCH, MOCK_REVIEW, MOCK_RESOURCES, createDemoProject, mockMentorReply } from "../data/mock";
import { DEMO_USERS_KEY, demoBucket } from "../api/session";
import type {
  AuthSession,
  ChatRequest,
  OnboardingPayload,
  PitchPack,
  ProblemAnalysis,
  ProjectReview,
  ProjectState,
  ResourceItem,
  Roadmap,
  StoredUpload,
  Task,
  Team,
  UploadKind,
} from "../types";

const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));

function cloneProject(input?: OnboardingPayload): ProjectState {
  const demo = createDemoProject();
  if (!input) return demo;
  return {
    ...demo,
    hackathon: input.hackathon,
    team: input.team,
    problemStatement: input.problemStatement,
    projectIdea: input.projectIdea,
    knownTechnologies: input.knownTechnologies,
    analysis: null,
    review: null,
    pitch: null,
    messages: [
      {
        id: "welcome",
        role: "assistant",
        content: `Welcome, ${input.team.name}. I have your problem statement and team. Analyze the problem first, then we can lock scope and generate a roadmap.`,
        createdAt: new Date().toISOString(),
      },
    ],
    dashboard: {
      ...demo.dashboard,
      currentStage: "Understand Problem",
      progressPercent: 8,
      todayPriorities: ["Analyze the problem statement", "Confirm who you are building for", "Avoid adding features before scope is frozen"],
      upcomingDeadlines: [
        { label: "Scope freeze", at: input.hackathon.deadlineAt },
        { label: "Submission", at: input.hackathon.deadlineAt },
      ],
      blockers: [],
      recommendation: {
        headline: "Start by making the problem unmistakable.",
        body: "Use Analyze Problem, then freeze a demo-sized idea before generating tasks.",
        urgency: "focus",
      },
    },
    tasks: [],
    resources: [],
    roadmap: {
      stages: DEFAULT_STAGES.map((name, i) => ({
        id: `s${i + 1}`,
        name,
        order: i + 1,
        status: i === 0 ? "in_progress" : "not_started",
        progress: i === 0 ? 10 : 0,
        estimatedHours: [2, 2, 1.5, 2, 10, 4, 3, 2, 3, 1][i] ?? 2,
        deadlineAt: input.hackathon.deadlineAt,
        taskIds: [],
      })),
    },
  };
}

export async function mockOnboarding(payload: OnboardingPayload): Promise<ProjectState> {
  await delay(650);
  return cloneProject(payload);
}

export async function mockGetProject(): Promise<ProjectState> {
  await delay(400);
  return createDemoProject();
}

export async function mockGetTeam(): Promise<Team> {
  await delay(300);
  return createDemoProject().team;
}

export async function mockGetTasks(): Promise<Task[]> {
  await delay(300);
  return createDemoProject().tasks;
}

export async function mockAnalyzeProblem(_statement: string): Promise<ProblemAnalysis> {
  await delay(900);
  return MOCK_ANALYSIS;
}

export async function mockGenerateRoadmap(): Promise<Roadmap> {
  await delay(850);
  return createDemoProject().roadmap;
}

export async function mockGenerateTasks(): Promise<Task[]> {
  await delay(850);
  return createDemoProject().tasks;
}

export async function mockReviewProject(): Promise<ProjectReview> {
  await delay(1000);
  return MOCK_REVIEW;
}

export async function mockSearchResources(_query?: string): Promise<ResourceItem[]> {
  await delay(700);
  return MOCK_RESOURCES;
}

export async function mockGeneratePitch(): Promise<PitchPack> {
  await delay(900);
  return MOCK_PITCH;
}

export async function mockJudgeQuestions(): Promise<PitchPack["judgeQuestions"]> {
  await delay(700);
  return MOCK_PITCH.judgeQuestions;
}

export async function mockChat(req: ChatRequest): Promise<{ message: string }> {
  await delay(500);
  return { message: mockMentorReply(req.message) };
}

export async function mockStreamChat(
  req: ChatRequest,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const full = mockMentorReply(req.message);
  const words = full.split(" ");
  let acc = "";
  for (const word of words) {
    if (signal?.aborted) break;
    const piece = (acc ? " " : "") + word;
    acc += (acc ? " " : "") + word;
    onChunk(piece);
    await delay(28);
  }
  return acc;
}

interface DemoUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

function seedUsers(): Record<string, DemoUser> {
  try {
    const raw = localStorage.getItem(DEMO_USERS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, DemoUser>;
  } catch {
    /* ignore */
  }
  const seeded: Record<string, DemoUser> = {
    "team@hackmentor.demo": {
      id: "demo-user-1",
      name: "TechNova lead",
      email: "team@hackmentor.demo",
      password: "mentor123",
    },
  };
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveUsers(users: Record<string, DemoUser>) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function sessionFor(user: DemoUser): AuthSession {
  return {
    token: `demo.${user.id}.${Date.now()}`,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export async function mockLogin(email: string, password: string): Promise<AuthSession> {
  await delay(450);
  const users = seedUsers();
  const user = users[email.trim().toLowerCase()];
  if (!user || user.password !== password) {
    throw new Error("Email or password is incorrect.");
  }
  return sessionFor(user);
}

export async function mockRegister(name: string, email: string, password: string): Promise<AuthSession> {
  await delay(500);
  const users = seedUsers();
  const key = email.trim().toLowerCase();
  if (users[key]) {
    throw new Error("An account with that email already exists in this browser.");
  }
  const user: DemoUser = {
    id: crypto.randomUUID(),
    name: name.trim() || "Hackathon teammate",
    email: key,
    password,
  };
  users[key] = user;
  saveUsers(users);
  return sessionFor(user);
}

export async function mockUploadDocument(
  kind: UploadKind,
  file: File,
  userId: string,
): Promise<StoredUpload> {
  await delay(700);
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const folder = kind === "team_details" ? "team-details" : "project-description";
  const key = `teams/${userId}/${folder}/${Date.now()}-${safeName}`;
  return {
    kind,
    fileName: file.name,
    size: file.size,
    contentType: file.type || "application/pdf",
    bucket: demoBucket(),
    key,
    uploadedAt: new Date().toISOString(),
    demo: true,
  };
}
