import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { isDemoMode } from "../api/client";
import { DOCS_SEEN_KEY, UPLOADS_KEY, loadSession, saveSession } from "../api/session";
import { createDemoProject } from "../data/mock";
import { api } from "../services/api";
import type {
  AuthSession,
  ChatRequest,
  OnboardingPayload,
  ProjectState,
  StoredUpload,
  Task,
  TeamMember,
  UploadKind,
} from "../types";

const STORAGE_KEY = "hackmentor-project";
const ONBOARDED_KEY = "hackmentor-onboarded";

function loadState(): ProjectState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectState;
  } catch {
    return null;
  }
}

function loadUploads(): Partial<Record<UploadKind, StoredUpload>> {
  try {
    const raw = localStorage.getItem(UPLOADS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<UploadKind, StoredUpload>>;
  } catch {
    return {};
  }
}

interface AppContextValue {
  project: ProjectState | null;
  onboarded: boolean;
  demoMode: boolean;
  error: string | null;
  success: string | null;
  busy: boolean;
  session: AuthSession | null;
  uploads: Partial<Record<UploadKind, StoredUpload>>;
  docsSeen: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (accountOrCredential: {
    credential?: string;
    email?: string;
    name?: string;
    picture?: string;
    id?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  uploadDocument: (kind: UploadKind, file: File) => Promise<void>;
  markDocsSeen: () => void;
  loadDemo: () => void;
  completeOnboarding: (payload: OnboardingPayload) => Promise<void>;
  reset: () => void;
  setError: (msg: string | null) => void;
  updateProject: (patch: Partial<ProjectState> | ((prev: ProjectState) => ProjectState)) => void;
  analyzeProblem: () => Promise<void>;
  generateRoadmap: () => Promise<void>;
  generateTasks: () => Promise<void>;
  reviewProject: () => Promise<void>;
  searchResources: (query: string) => Promise<void>;
  generatePitch: () => Promise<void>;
  generateJudgeQuestions: () => Promise<void>;
  sendMentorMessage: (
    message: string,
    onDelta?: (full: string) => void,
    signal?: AbortSignal,
    onSources?: (sources: any[]) => void,
  ) => Promise<void>;
  upsertTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  updateMember: (member: TeamMember) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ProjectState | null>(() => loadState());
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === "true" && !!loadState());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());
  const [uploads, setUploads] = useState<Partial<Record<UploadKind, StoredUpload>>>(() => loadUploads());
  const [docsSeen, setDocsSeen] = useState(() => localStorage.getItem(DOCS_SEEN_KEY) === "true");

  const persist = useCallback((next: ProjectState | null, onboard = onboarded) => {
    setProject(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(ONBOARDED_KEY, onboard ? "true" : "false");
  }, [onboarded]);

  const updateProject: AppContextValue["updateProject"] = useCallback(
    (patch) => {
      setProject((prev) => {
        if (!prev) return prev;
        const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const applySession = useCallback((next: AuthSession) => {
    saveSession(next);
    setSession(next);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setBusy(true);
      setError(null);
      try {
        applySession(await api.login(email, password));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign in failed");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [applySession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setBusy(true);
      setError(null);
      try {
        applySession(await api.register(name, email, password));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create account");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [applySession],
  );


  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* still clear local session */
    }
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
      } catch {
        /* ignore */
      }
    }
    saveSession(null);
    setSession(null);
    setError(null);
  }, []);

  const markDocsSeen = useCallback(() => {
    setDocsSeen(true);
    localStorage.setItem(DOCS_SEEN_KEY, "true");
  }, []);

  const uploadDocument = useCallback(
    async (kind: UploadKind, file: File) => {
      setBusy(true);
      setError(null);
      setSuccess(null);
      try {
        const userId = session?.user?.id ?? "team_lead";
        const stored = await api.uploadDocument(kind, file, userId);
        setUploads((prev) => {
          const next = { ...prev, [kind]: stored };
          localStorage.setItem(UPLOADS_KEY, JSON.stringify(next));
          return next;
        });
        setSuccess(stored.statusMessage || `PDF uploaded successfully to s3://${stored.bucket}/${stored.key}.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [session],
  );

  const loadDemo = useCallback(() => {
    const demo = createDemoProject();
    setOnboarded(true);
    persist(demo, true);
    setError(null);
  }, [persist]);

  const googleLogin = useCallback(
    async (accountOrCredential: {
      credential?: string;
      email?: string;
      name?: string;
      picture?: string;
      id?: string;
    }) => {
      setBusy(true);
      setError(null);
      try {
        let authSession: AuthSession;

        if (accountOrCredential.credential) {
          // Cryptographically verify with backend via Google's official library
          try {
            authSession = await api.verifyGoogleToken(accountOrCredential.credential);
          } catch (backendErr) {
            if (!isDemoMode()) {
              throw backendErr;
            }
            authSession = {
              token: accountOrCredential.credential,
              user: {
                id: accountOrCredential.id || `google_${accountOrCredential.email?.replace(/[^a-zA-Z0-9]/g, "_") || Date.now()}`,
                email: accountOrCredential.email || "demo@gmail.com",
                name: accountOrCredential.name || "Google User",
                picture: accountOrCredential.picture,
              },
            };
          }
        } else {
          const email = accountOrCredential.email || "user@gmail.com";
          authSession = {
            token: `google_oauth_${Date.now()}`,
            user: {
              id: accountOrCredential.id || `google_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
              email,
              name: accountOrCredential.name || email.split("@")[0],
              picture: accountOrCredential.picture,
            },
          };
        }

        applySession(authSession);

        const existing = loadState();
        if (!existing) {
          loadDemo();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Google sign in failed");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [applySession, loadDemo],
  );

  const completeOnboarding = useCallback(
    async (payload: OnboardingPayload) => {
      setBusy(true);
      setError(null);
      try {
        const next = await api.onboarding(payload);
        setOnboarded(true);
        persist(next, true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Onboarding failed");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [persist],
  );

  const reset = useCallback(() => {
    setOnboarded(false);
    persist(null, false);
    localStorage.removeItem(ONBOARDED_KEY);
  }, [persist]);

  const run = useCallback(
    async (fn: (p: ProjectState) => Promise<void>) => {
      if (!project) return;
      setBusy(true);
      setError(null);
      try {
        await fn(project);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong talking to the backend.");
      } finally {
        setBusy(false);
      }
    },
    [project],
  );

  const analyzeProblem = useCallback(
    () =>
      run(async (p) => {
        const analysis = await api.analyzeProblem(p.problemStatement);
        updateProject({ analysis });
      }),
    [run, updateProject],
  );

  const generateRoadmap = useCallback(
    () =>
      run(async (p) => {
        const roadmap = await api.generateRoadmap(p);
        updateProject({ roadmap });
      }),
    [run, updateProject],
  );

  const generateTasks = useCallback(
    () =>
      run(async (p) => {
        const tasks = await api.generateTasks(p);
        updateProject({ tasks });
      }),
    [run, updateProject],
  );

  const reviewProject = useCallback(
    () =>
      run(async (p) => {
        const review = await api.reviewProject(p);
        updateProject({ review });
      }),
    [run, updateProject],
  );

  const searchResources = useCallback(
    async (query: string) => {
      await run(async (p) => {
        const resources = await api.searchResources(query, p);
        updateProject({ resources });
      });
    },
    [run, updateProject],
  );

  const generatePitch = useCallback(
    () =>
      run(async (p) => {
        const pitch = await api.generatePitch(p);
        updateProject({ pitch });
      }),
    [run, updateProject],
  );

  const generateJudgeQuestions = useCallback(
    () =>
      run(async (p) => {
        const questions = await api.judgeQuestions(p);
        updateProject((prev) => ({
          ...prev,
          pitch: prev.pitch
            ? { ...prev.pitch, judgeQuestions: questions }
            : {
                pitch: "",
                structure: [],
                problemExplanation: "",
                solutionExplanation: "",
                architectureExplanation: "",
                demoFlow: [],
                talkingPoints: [],
                judgeQuestions: questions,
              },
        }));
      }),
    [run, updateProject],
  );

  const sendMentorMessage = useCallback(
    async (
      message: string,
      onDelta?: (full: string) => void,
      signal?: AbortSignal,
      onSources?: (sources: any[]) => void,
    ) => {
      if (!project) return;
      const userMsg = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: message,
        createdAt: new Date().toISOString(),
      };
      updateProject({ messages: [...project.messages, userMsg] });

      const req: ChatRequest = {
        message,
        history: [...project.messages, userMsg],
        context: {
          problemStatement: project.problemStatement,
          projectIdea: project.projectIdea,
          team: project.team,
          tasks: project.tasks,
          roadmap: project.roadmap,
          remainingMs: new Date(project.hackathon.deadlineAt).getTime() - Date.now(),
        },
      };

      let full = "";
      let capturedSources: any[] | undefined = undefined;
      try {
        const result = await api.streamMentorChat(
          req,
          (chunk) => {
            full += chunk;
            onDelta?.(full);
          },
          signal,
          (srcs) => {
            capturedSources = srcs;
            onSources?.(srcs);
          },
        );
        if (result && typeof result === "object") {
          if (result.text) full = result.text;
          if (result.sources) capturedSources = result.sources;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Mentor is unavailable right now.");
        return;
      }

      updateProject((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: full,
            createdAt: new Date().toISOString(),
            sources: capturedSources,
          },
        ],
      }));
    },
    [project, updateProject],
  );

  const upsertTask = useCallback(
    (task: Task) => {
      updateProject((prev) => {
        const exists = prev.tasks.some((t) => t.id === task.id);
        return {
          ...prev,
          tasks: exists ? prev.tasks.map((t) => (t.id === task.id ? task : t)) : [...prev.tasks, task],
        };
      });
    },
    [updateProject],
  );

  const deleteTask = useCallback(
    (id: string) => {
      updateProject((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
    },
    [updateProject],
  );

  const updateMember = useCallback(
    (member: TeamMember) => {
      updateProject((prev) => ({
        ...prev,
        team: {
          ...prev.team,
          members: prev.team.members.map((m) => (m.id === member.id ? member : m)),
        },
      }));
    },
    [updateProject],
  );

  const value = useMemo(
    () => ({
      project,
      onboarded,
      demoMode: isDemoMode(),
      error,
      success,
      busy,
      session,
      uploads,
      docsSeen,
      signIn,
      register,
      googleLogin,
      signOut,
      uploadDocument,
      markDocsSeen,
      loadDemo,
      completeOnboarding,
      reset,
      setError,
      updateProject,
      analyzeProblem,
      generateRoadmap,
      generateTasks,
      reviewProject,
      searchResources,
      generatePitch,
      generateJudgeQuestions,
      sendMentorMessage,
      upsertTask,
      deleteTask,
      updateMember,
    }),
    [
      project,
      onboarded,
      error,
      success,
      busy,
      session,
      uploads,
      docsSeen,
      signIn,
      register,
      googleLogin,
      signOut,
      uploadDocument,
      markDocsSeen,
      loadDemo,
      completeOnboarding,
      reset,
      updateProject,
      analyzeProblem,
      generateRoadmap,
      generateTasks,
      reviewProject,
      searchResources,
      generatePitch,
      generateJudgeQuestions,
      sendMentorMessage,
      upsertTask,
      deleteTask,
      updateMember,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
