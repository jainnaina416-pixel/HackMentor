import type { AuthSession } from "../types";

export const SESSION_KEY = "hackmentor-session";
export const UPLOADS_KEY = "hackmentor-uploads";
export const DOCS_SEEN_KEY = "hackmentor-docs-seen";
export const DEMO_USERS_KEY = "hackmentor-demo-users";

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export function getAccessToken(): string | null {
  return loadSession()?.token ?? null;
}

export function demoBucket() {
  return (import.meta.env.VITE_S3_BUCKET || "hackmentor-uploads").replace(/\/$/, "");
}
