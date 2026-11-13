// src/utils/jwt.ts
/**
 * Decodes a Google ID token (JWT) safely in browser environment.
 * Extracts user profile information: sub (Google user ID), email, name, picture.
 */
export interface GoogleIdTokenPayload {
  iss: string;
  sub: string;
  azp?: string;
  aud: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat: number;
  exp: number;
}

export function decodeGoogleIdToken(token: string): GoogleIdTokenPayload {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token provided for decoding.");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT token format: expected 3 dot-separated segments.");
  }

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as GoogleIdTokenPayload;
  } catch (error) {
    throw new Error(`Failed to decode Google ID token payload: ${error instanceof Error ? error.message : String(error)}`);
  }
}
