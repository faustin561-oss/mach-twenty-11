import { randomBytes, createHash } from "crypto";

// Shared helpers for email-verification and password-reset tokens. The
// raw token is only ever emailed to the user, never stored — the
// database stores a SHA-256 hash of it, so a database leak alone can't
// be used to reset accounts (the same reasoning as storing a password
// hash instead of the password itself).
export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
