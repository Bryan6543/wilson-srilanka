import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env, services } from "./env";
import { verifyPassword } from "./password";

export const SESSION_COOKIE = "wsl_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

interface SessionPayload {
  sub: string; // admin email
  iat: number;
  exp: number;
  /** Fingerprint of the password hash — changing the password invalidates old sessions. */
  v: string;
}

export interface AdminSession {
  email: string;
  expiresAt: Date;
}

const credentialVersion = () =>
  createHash("sha256").update(env.adminPasswordHash ?? "").digest("base64url").slice(0, 12);

function sign(data: string): string {
  return createHmac("sha256", env.adminSessionSecret!).update(data).digest("base64url");
}

function encode(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string | undefined): SessionPayload | null {
  if (!token || !services.adminAuth) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp * 1000 < Date.now()) return null;
    if (payload.sub !== env.adminEmail || payload.v !== credentialVersion()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Checks credentials in constant-ish time. Returns false when admin auth is not configured. */
export async function checkCredentials(email: string, password: string): Promise<boolean> {
  if (!services.adminAuth) return false;
  const emailOk = email.trim().toLowerCase() === env.adminEmail;
  // Always run the hash so response timing does not reveal whether the email matched.
  const passwordOk = await verifyPassword(password, env.adminPasswordHash!).catch(() => false);
  return emailOk && passwordOk;
}

export async function createSession(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = encode({ sub: env.adminEmail!, iat: now, exp: now + SESSION_TTL_SECONDS, v: credentialVersion() });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const payload = decode((await cookies()).get(SESSION_COOKIE)?.value);
  return payload ? { email: payload.sub, expiresAt: new Date(payload.exp * 1000) } : null;
}

/** For admin pages: redirects to the login page when there is no valid session. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "UnauthorizedError";
  }
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function assertAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new UnauthorizedError();
  return session;
}
