import { NextRequest } from "next/server";
import { prisma } from "./prisma";

/**
 * Fixed-window rate limiter backed by the rate_limits table (serverless instances
 * share no memory, so the DB is the only place a limit can actually hold).
 * Returns true when the request is allowed. Fails OPEN — a rate-limit outage
 * must never take login/registration down with it.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const now = new Date();
  try {
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt < now) {
      const resetAt = new Date(now.getTime() + windowSec * 1000);
      await prisma.rateLimit.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      });
      return true;
    }
    if (row.count >= limit) return false;
    await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  } catch (e) {
    console.error("[rateLimit]", e);
    return true;
  }
}

/** Client IP on Vercel — first hop of x-forwarded-for. */
export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
