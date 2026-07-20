import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { handleApiError } from "@/lib/api-error";

// POST /api/stripe/connect/onboard — creates (if needed) a Stripe Connect
// Express account for the carrier and returns an onboarding link. Carrier
// must complete this before /api/shipments/:id/deliver can pay them out.
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "CARRIER") {
      return NextResponse.json({ error: "Carrier account required" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const profile = await prisma.carrierProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Complete your carrier profile first" }, { status: 409 });

    try {
      const stripe = getStripe();

      let accountId = profile.stripeAccountId;
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          email: session.user.email!,
          capabilities: { transfers: { requested: true } },
        });
        accountId = account.id;
        await prisma.carrierProfile.update({ where: { id: profile.id }, data: { stripeAccountId: accountId } });
      }

      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXTAUTH_URL}/carrier/dashboard`,
        return_url: `${process.env.NEXTAUTH_URL}/carrier/dashboard?onboarded=1`,
        type: "account_onboarding",
      });

      return NextResponse.json({ url: link.url });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Stripe not configured" }, { status: 500 });
    }

  } catch (err) {
    return handleApiError(err);
  }
}
