import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({ email: z.string().email() });

// POST /api/newsletter/subscribe — functional email capture: always
// persists to the database. Sending an actual welcome/confirmation email
// is best-effort via Resend and only happens if RESEND_API_KEY is set;
// capture succeeds either way, since the two concerns are independent
// (you can collect emails today and turn on sending later without a
// schema change).
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing && !existing.unsubscribedAt) {
      return NextResponse.json({ status: "already_subscribed" });
    }

    const subscriber = existing
      ? await prisma.newsletterSubscriber.update({ where: { email }, data: { unsubscribedAt: null } })
      : await prisma.newsletterSubscriber.create({ data: { email } });

    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Mach Twenty 11 <updates@mach2011.com>",
          to: email,
          subject: "You're on the list",
          html: "<p>Thanks for subscribing to Mach Twenty 11 rate benchmarks and platform updates.</p>",
        });
      } catch {
        // Non-fatal — the subscription itself already succeeded above.
        // A logging/retry pipeline for failed sends is not built yet.
      }
    }

    return NextResponse.json({ status: "subscribed", id: subscriber.id });

  } catch (err) {
    return handleApiError(err);
  }
}
