import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({ token: z.string().min(10) });

// POST /api/auth/verify-email — confirms an email-verification token
// (see registration route for issuance). Tokens are single-use
// (usedAt) and expire after 1 hour.
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const tokenHash = hashToken(parsed.data.token);
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
      prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return NextResponse.json({ verified: true });
  } catch (err) {
    return handleApiError(err);
  }
}
