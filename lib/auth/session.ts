import { db } from "@/lib/db/schema";
import { SESSION_DAYS } from "@/lib/auth/config";
import type { AuthSession } from "@/types/models";

const SESSION_ID = "current" as const;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function createToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function createAuthSession(): Promise<AuthSession> {
  const now = new Date();
  const session: AuthSession = {
    id: SESSION_ID,
    token: createToken(),
    createdAt: now.toISOString(),
    expiresAt: addDays(now, SESSION_DAYS).toISOString(),
  };

  await db.authSession.put(session);
  return session;
}

export async function getValidAuthSession(): Promise<AuthSession | null> {
  const session = await db.authSession.get(SESSION_ID);

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await clearAuthSession();
    return null;
  }

  return session;
}

export async function clearAuthSession() {
  await db.authSession.delete(SESSION_ID);
}
