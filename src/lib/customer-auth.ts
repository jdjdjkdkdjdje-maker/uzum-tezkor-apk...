import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { users, refreshTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export const SESSION_COOKIE = "bm_session";
const SESSION_DAYS = 30;

// ─── Parol hash ────────────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ─── Sessiya ───────────────────────────────────────────────────────────────────
export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({ userId, token, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export type CustomerUser = typeof users.$inferSelect;

export async function getCustomer(): Promise<CustomerUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const rows = await db
      .select({ user: users })
      .from(refreshTokens)
      .innerJoin(users, eq(refreshTokens.userId, users.id))
      .where(and(eq(refreshTokens.token, token), gt(refreshTokens.expiresAt, new Date())))
      .limit(1);
    const user = rows[0]?.user;
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json(
    { error: "Avval tizimga kiring", code: "UNAUTHORIZED" },
    { status: 401 }
  );
}

export function normalizePhone(raw: string): string {
  let p = raw.replace(/[^\d+]/g, "");
  if (p.startsWith("998") && p.length === 12) p = "+" + p;
  if (/^\d{9}$/.test(p)) p = "+998" + p;
  return p;
}
