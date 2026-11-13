import type { ApiError } from "../types";
import { getAccessToken } from "./session";

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
}

export function isDemoMode(): boolean {
  const mockFlag = import.meta.env.VITE_USE_MOCK;
  if (mockFlag === "false") return false;  // explicit opt-out
  if (mockFlag === "true") return true;
  // Default: demo mode only if no URL AND no proxy (both unset)
  return false;
}

export class HttpError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // base is empty when using Vite proxy (recommended for dev).
  // base is "http://localhost:8000" when hitting the backend directly.
  const base = getApiBaseUrl(); // may be "" — that's fine, path will be relative

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Authorization")) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers });
  } catch {
    throw new HttpError("Could not reach the backend. Check VITE_API_URL and your network.");
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as ApiError & { detail?: unknown };
      if (typeof data.message === "string" && data.message) message = data.message;
      else if (typeof data.detail === "string" && data.detail) message = data.detail;
    } catch {
      /* ignore */
    }
    throw new HttpError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface StreamResult {
  text: string;
  sources?: any[];
}

export async function readStream(
  response: Response,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
  onSources?: (sources: any[]) => void,
): Promise<StreamResult> {
  if (!response.body) {
    const text = await response.text();
    const clean = extractCleanMessage(text);
    onChunk(clean);
    return { text: clean };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";
  let capturedSources: any[] | undefined = undefined;

  while (true) {
    if (signal?.aborted) {
      await reader.cancel();
      break;
    }
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr || dataStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(dataStr);
        if (typeof parsed === "object" && parsed !== null) {
          // If sources event payload
          if (Array.isArray(parsed.sources)) {
            capturedSources = parsed.sources;
            onSources?.(parsed.sources);
            continue;
          }
          // If message chunk
          if ("message" in parsed && typeof parsed.message === "string") {
            fullText += parsed.message;
            onChunk(parsed.message);
            continue;
          }
        }
      } catch {
        // Not JSON formatted data
      }

      // If it's pure text stream chunk
      fullText += dataStr;
      onChunk(dataStr);
    }
  }

  // Handle any remaining in buffer
  if (buffer.trim().startsWith("data:")) {
    const dataStr = buffer.trim().slice(5).trim();
    if (dataStr && dataStr !== "[DONE]") {
      try {
        const parsed = JSON.parse(dataStr);
        if (Array.isArray(parsed?.sources)) {
          capturedSources = parsed.sources;
          onSources?.(parsed.sources);
        } else if (parsed?.message) {
          fullText += parsed.message;
          onChunk(parsed.message);
        }
      } catch {
        fullText += dataStr;
        onChunk(dataStr);
      }
    }
  }

  return { text: fullText, sources: capturedSources };
}

export function extractCleanMessage(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    // Check if it's stringified JSON
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractCleanMessage(parsed);
      } catch {
        return raw;
      }
    }
    return raw;
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, any>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.response === "string") return obj.response;
    if (typeof obj.content === "string") return obj.content;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.answer === "string") return obj.answer;
  }
  return String(raw);
}

