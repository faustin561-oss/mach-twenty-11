import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateRawToken, hashToken, TOKEN_EXPIRY_MS } from "@/lib/tokens";
import { sendMailOrDevFallback } from "@/lib/mail";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({ email: z.string().email() });

// POST /api/auth/password-reset/request — always returns the same
// success response whether or not the email exists, so this endpoint
// can't be used to enumerate registered accounts. Rate-limited by IP
// since there's no authenticated user at this point.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`password-reset:${ip}`, 5, 15 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests — try again later." }, { status: 429 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

    let devResetUrl: string | undefined;
    if (user) {
      const rawToken = generateRawToken();
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS) },
      });
      const resetUrl = `${process.env.NEXTAUTH_URL || ""}/reset-password?token=${rawToken}`;
      const { devToken } = await sendMailOrDevFallback(
        { to: user.email, subject: "Reset your Mach Twenty 11 password", html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>` },
        rawToken
      );
      if (devToken) devResetUrl = resetUrl;
    }
    // Deliberately identical response whether or not `user` was found.
    return NextResponse.json({ message: "If an account exists for that email, a reset link has been sent.", ...(devResetUrl ? { devResetUrl } : {}) });
  } catch (err) {
    return handleApiError(err);
  }
}
