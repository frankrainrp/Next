import { cookies, headers } from "next/headers";
import { prisma } from "@/server/db";

/**
 * Resolves the current browser's anonymous identity (set by middleware) and
 * maps it to an AppUser row, creating one on first sight. All ownership
 * scoping flows through getCurrentUserId().
 */

export async function getCurrentAnonId(): Promise<string> {
  // Prefer the persisted cookie; fall back to the header middleware injects
  // on the first request (before the cookie has round-tripped).
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("pm_uid")?.value;
  if (fromCookie) return fromCookie;

  const headerStore = await headers();
  const fromHeader = headerStore.get("x-pm-uid");
  if (fromHeader) return fromHeader;

  throw new Error("ANON_ID_MISSING");
}

/**
 * Resolve the current user's id, CREATING the AppUser row if it doesn't exist.
 * Use only for deliberate writes (createProject, agent actions). Never call
 * this from read-only/listing endpoints — bots and crawlers hit those without
 * persisting cookies, so an upsert there would spawn a junk user per request.
 */
export async function getCurrentUserId(): Promise<string> {
  const anonId = await getCurrentAnonId();
  const clerkUserId = `anon_${anonId}`;
  const user = await prisma.appUser.upsert({
    where: { clerkUserId },
    update: {},
    create: {
      clerkUserId,
      email: `${anonId}@anon.local`,
      name: "Guest",
      timezone: "Asia/Shanghai",
    },
  });
  return user.id;
}

/**
 * Resolve the current user's id WITHOUT creating a row. Returns null for a
 * visitor (or crawler) who hasn't created anything yet. Use for read-only
 * endpoints so they stay zero-write under bot traffic.
 */
export async function getCurrentUserIdOrNull(): Promise<string | null> {
  let anonId: string;
  try {
    anonId = await getCurrentAnonId();
  } catch {
    return null;
  }
  const user = await prisma.appUser.findUnique({
    where: { clerkUserId: `anon_${anonId}` },
    select: { id: true },
  });
  return user?.id ?? null;
}
