export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type StageStatus = "not_started" | "in_progress" | "completed" | "at_risk";
export type ResourceCategory =
  | "Datasets"
  | "APIs"
  | "Documentation"
  | "Libraries"
  | "Tutorials"
  | "Research papers"
  | "Similar projects"
  | "Tools";

export interface HackathonInfo {
  name: string;
  startAt: string;
  deadlineAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  avatarHue: number;
}

export interface Team {
  name: string;
  members: TeamMember[];
}

export interface ProblemAnalysis {
  simpleWords: string;
  targetUsers: string[];
  coreProblem: string;
  requirements: string[];
  constraints: string[];
  importantQuestions: string[];
  possibleDirections: string[];
  risks: string[];
}

export interface ProjectIdea {
  title: string;
  summary: string;
  whyItFits: string;
}

export interface RoadmapStage {
  id: string;
  name: string;
  order: number;
  status: StageStatus;
  progress: number;
  estimatedHours: number;
  deadlineAt: string;
  taskIds: string[];
  notes?: string;
}

export interface Roadmap {
  stages: RoadmapStage[];
  generatedAt?: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  assigneeId: string | null;
  priority: TaskPriority;
  estimatedHours: number;
  deadlineAt: string;
  status: TaskStatus;
  stageId?: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  source: string;
  whyUseful: string;
  url: string;
}

export interface ReviewSection {
  title: string;
  body: string;
}

export interface ProjectReview {
  problem: string;
  solution: string;
  technicalImplementation: string;
  innovation: string;
  feasibility: string;
  userExperience: string;
  risks: string;
  missingPieces: string;
  recommendedNextSteps: string[];
}

export interface PitchPack {
  pitch: string;
  structure: string[];
  problemExplanation: string;
  solutionExplanation: string;
  architectureExplanation: string;
  demoFlow: string[];
  talkingPoints: string[];
  judgeQuestions: JudgeQuestion[];
}

export interface JudgeQuestion {
  id: string;
  question: string;
  suggestedAnswer: string;
}

export interface SourceCitation {
  source_id?: string;
  title: string;
  excerpt: string;
  relevance?: number | null;
  url?: string | null;
}

export interface MentorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: SourceCitation[];
}

export interface MentorRecommendation {
  headline: string;
  body: string;
  urgency: "calm" | "focus" | "critical";
}

export interface DashboardSnapshot {
  currentStage: string;
  progressPercent: number;
  todayPriorities: string[];
  upcomingDeadlines: { label: string; at: string }[];
  blockers: string[];
  recommendation: MentorRecommendation;
}

export interface ProjectState {
  hackathon: HackathonInfo;
  team: Team;
  problemStatement: string;
  projectIdea: string;
  knownTechnologies: string[];
  analysis: ProblemAnalysis | null;
  roadmap: Roadmap;
  tasks: Task[];
  resources: ResourceItem[];
  review: ProjectReview | null;
  pitch: PitchPack | null;
  messages: MentorMessage[];
  dashboard: DashboardSnapshot;
}

export interface OnboardingPayload {
  hackathon: HackathonInfo;
  team: Team;
  problemStatement: string;
  projectIdea: string;
  knownTechnologies: string[];
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface ChatRequest {
  message: string;
  history: MentorMessage[];
  context: {
    problemStatement: string;
    projectIdea: string;
    team: Team;
    tasks: Task[];
    roadmap: Roadmap;
    remainingMs: number;
  };
}

export type RequestState = "idle" | "loading" | "streaming" | "error" | "success";

export type UploadKind = "team_details" | "project_description";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface StoredUpload {
  kind: UploadKind;
  fileName: string;
  size: number;
  contentType: string;
  bucket: string;
  key: string;
  uploadedAt: string;
  demo: boolean;
  statusMessage?: string;
}

export interface PresignResponse {
  uploadUrl: string;
  method: "PUT" | "POST";
  bucket: string;
  key: string;
  headers: Record<string, string>;
}
