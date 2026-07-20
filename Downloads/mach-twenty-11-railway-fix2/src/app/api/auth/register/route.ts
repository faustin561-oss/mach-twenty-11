import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { toJsonArray } from "@/lib/json-array";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateRawToken, hashToken, TOKEN_EXPIRY_MS } from "@/lib/tokens";
import { sendMailOrDevFallback } from "@/lib/mail";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["CUSTOMER", "CARRIER"]).default("CUSTOMER"),
});

// POST /api/auth/register — creates a real account (previously the
// "Register" nav link just pointed at /login, a dead end). Carrier
// sign-ups get a stub CarrierProfile so /carrier/dashboard and
// /carrier/fleet have something to attach to immediately; membership
// still needs activating via Stripe Checkout before bidding is allowed.
// Also sends an email-verification link — see src/lib/mail.ts for what
// happens if email sending isn't configured (dev-mode token fallback,
// never in production).
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`register:${ip}`, 5, 15 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many registration attempts — try again later." }, { status: 429 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        ...(role === "CARRIER"
          ? { carrierProfile: { create: { legalName: name, equipmentTypes: toJsonArray([]) as any, operatingAreas: toJsonArray([]) as any } } }
          : {}),
      },
    });

    const rawToken = generateRawToken();
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS) },
    });
    const verifyUrl = `${process.env.NEXTAUTH_URL || ""}/verify-email?token=${rawToken}`;
    const { devToken } = await sendMailOrDevFallback(
      { to: email, subject: "Verify your Mach Twenty 11 email", html: `<p>Confirm your email: <a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 1 hour.</p>` },
      rawToken
    );

    return NextResponse.json({ id: user.id, email: user.email, ...(devToken ? { devVerifyUrl: verifyUrl } : {}) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
