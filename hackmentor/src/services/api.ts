import { HttpError, extractCleanMessage, getApiBaseUrl, isDemoMode, readStream, request } from "../api/client";
import { endpoints } from "../api/endpoints";
import { getAccessToken } from "../api/session";
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
import * as mock from "./mockApi";

export const api = {
  onboarding(payload: OnboardingPayload) {
    if (isDemoMode()) return mock.mockOnboarding(payload);
    return request<ProjectState>(endpoints.onboarding, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getProject() {
    if (isDemoMode()) return mock.mockGetProject();
    return request<ProjectState>(endpoints.project);
  },

  getTeam() {
    if (isDemoMode()) return mock.mockGetTeam();
    return request<Team>(endpoints.team);
  },

  getTasks() {
    if (isDemoMode()) return mock.mockGetTasks();
    return request<Task[]>(endpoints.tasks);
  },

  analyzeProblem(problemStatement: string) {
    if (isDemoMode()) return mock.mockAnalyzeProblem(problemStatement);
    return request<ProblemAnalysis>(endpoints.analyzeProblem, {
      method: "POST",
      body: JSON.stringify({ problemStatement }),
    });
  },

  generateIdeas(payload: { problemStatement: string; knownTechnologies: string[] }) {
    if (isDemoMode()) {
      return Promise.resolve({
        ideas: [
          {
            title: "CropGuard",
            summary: "Offline-first leaf diagnosis with local action cards.",
            whyItFits: "Matches the connectivity and language constraints.",
          },
        ],
      });
    }
    return request<{ ideas: { title: string; summary: string; whyItFits: string }[] }>(endpoints.projectIdeas, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  validateIdea(payload: { problemStatement: string; projectIdea: string }) {
    if (isDemoMode()) {
      return Promise.resolve({
        fits: true,
        notes: "The idea maps to late identification and unusable advice. Keep the demo scope tiny.",
      });
    }
    return request<{ fits: boolean; notes: string }>(endpoints.validateIdea, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  generateRoadmap(payload: ProjectState) {
    if (isDemoMode()) return mock.mockGenerateRoadmap();
    return request<Roadmap>(endpoints.generateRoadmap, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  generateTasks(payload: ProjectState) {
    if (isDemoMode()) return mock.mockGenerateTasks();
    return request<Task[]>(endpoints.generateTasks, {
      method: "POST",
      body: JSON.stringify({
        idea: payload.projectIdea,
        roadmap: payload.roadmap,
        team: payload.team,
      }),
    });
  },

  reviewProject(payload: ProjectState) {
    if (isDemoMode()) return mock.mockReviewProject();
    return request<ProjectReview>(endpoints.reviewProject, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  searchResources(query: string, project: ProjectState) {
    if (isDemoMode()) return mock.mockSearchResources(query);
    return request<ResourceItem[]>(endpoints.searchResources, {
      method: "POST",
      body: JSON.stringify({ query, problemStatement: project.problemStatement, idea: project.projectIdea }),
    });
  },

  generatePitch(payload: ProjectState) {
    if (isDemoMode()) return mock.mockGeneratePitch();
    return request<PitchPack>(endpoints.generatePitch, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  judgeQuestions(payload: ProjectState) {
    if (isDemoMode()) return mock.mockJudgeQuestions();
    return request<PitchPack["judgeQuestions"]>(endpoints.judgeQuestions, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async mentorChat(req: ChatRequest): Promise<{ message: string; sources?: any[] }> {
    if (isDemoMode()) return mock.mockChat(req);
    const data = await request<any>(endpoints.mentorChat, {
      method: "POST",
      body: JSON.stringify(req),
    });
    return {
      message: extractCleanMessage(data),
      sources: Array.isArray(data?.sources) ? data.sources : undefined,
    };
  },

  async streamMentorChat(
    req: ChatRequest,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
    onSources?: (sources: any[]) => void,
  ): Promise<{ text: string; sources?: any[] }> {
    if (isDemoMode()) {
      const text = await mock.mockStreamChat(req, onChunk, signal);
      return { text: extractCleanMessage(text) };
    }

    const base = getApiBaseUrl();
    const response = await fetch(`${base}${endpoints.mentorChat}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
        ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      },
      body: JSON.stringify({ ...req, stream: true }),
      signal,
    });

    if (!response.ok) {
      throw new HttpError("Mentor request failed", response.status);
    }

    const type = response.headers.get("content-type") ?? "";
    if (type.includes("application/json")) {
      const data = await response.json();
      const clean = extractCleanMessage(data);
      onChunk(clean);
      const sources = Array.isArray(data?.sources) ? data.sources : undefined;
      if (sources && onSources) onSources(sources);
      return { text: clean, sources };
    }

    return readStream(response, onChunk, signal, onSources);
  },

  login(email: string, password: string) {
    if (isDemoMode()) return mock.mockLogin(email, password);
    return request<AuthSession>(endpoints.login, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(name: string, email: string, password: string) {
    if (isDemoMode()) return mock.mockRegister(name, email, password);
    return request<AuthSession>(endpoints.register, {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  logout() {
    if (isDemoMode()) return Promise.resolve();
    return request<void>(endpoints.logout, { method: "POST" });
  },

  verifyGoogleToken(credential: string) {
    return request<AuthSession>(endpoints.googleAuth, {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
  },

  async uploadDocument(kind: UploadKind, file: File, userId: string): Promise<StoredUpload> {
    if (isDemoMode()) return mock.mockUploadDocument(kind, file, userId);

    const base = getApiBaseUrl();
    const form = new FormData();
    form.append("file", file);
    form.append("project_id", userId || "default_project");
    form.append("kind", kind);

    const headers = new Headers();
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let response: Response;
    try {
      response = await fetch(`${base}${endpoints.uploadPdf}`, {
        method: "POST",
        body: form,
        headers,
      });
    } catch {
      throw new HttpError("Could not reach the backend to upload the PDF.");
    }

    if (!response.ok) {
      let message = `Upload failed (${response.status})`;
      try {
        const data = (await response.json()) as { message?: string; detail?: string };
        if (data.message) message = data.message;
        else if (data.detail) message = data.detail;
      } catch {
        /* ignore */
      }
      throw new HttpError(message, response.status);
    }

    const data = (await response.json()) as {
      filename: string;
      file_size: number;
      uploaded_at: string;
      bucket?: string;
      s3_key?: string;
      status_message?: string;
    };

    return {
      kind,
      fileName: data.filename ?? file.name,
      size: data.file_size ?? file.size,
      contentType: file.type || "application/pdf",
      bucket: data.bucket || "hackmentor-demo-storage",
      key: data.s3_key || "",
      uploadedAt: data.uploaded_at,
      demo: false,
      statusMessage: data.status_message,
    };
  },
};
