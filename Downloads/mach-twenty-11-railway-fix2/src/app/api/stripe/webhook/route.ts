import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, BIDDING_ALLOWED_STRIPE_STATUSES } from "@/lib/stripe";
import Stripe from "stripe";
import { handleApiError } from "@/lib/api-error";
import { auditLog } from "@/lib/audit";

// POST /api/stripe/webhook — Stripe subscription + payment lifecycle
// events. Point your Stripe webhook (or `stripe listen --forward-to`)
// here. Verifies the signature with STRIPE_WEBHOOK_SECRET; rejects
// unsigned requests rather than trusting the payload.
//
// Idempotency: every event's `id` is checked against WebhookEvent before
// processing. Stripe explicitly documents that the same event can be
// delivered more than once (retries, at-least-once delivery) — without
// this check, a subscription could be double-activated or an invoice
// double-recorded.
export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !secret) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err: any) {
      return NextResponse.json({ error: `Signature verification failed: ${err.message}` }, { status: 400 });
    }

    // Idempotency check — must happen before any side effect below.
    const alreadyProcessed = await prisma.webhookEvent.findUnique({ where: { stripeEventId: event.id } });
    if (alreadyProcessed) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const carrierProfileId = session.metadata?.carrierProfileId;
        const subscriptionId = session.subscription as string | null;
        if (carrierProfileId && subscriptionId) {
          const stripe = getStripe();
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const status = mapStripeStatus(sub.status);
          const priceId = sub.items.data[0]?.price.id || "";
          await prisma.$transaction([
            prisma.subscription.upsert({
              where: { carrierProfileId },
              update: {
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                status: status as any,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                cancelAtPeriodEnd: sub.cancel_at_period_end,
              },
              create: {
                carrierProfileId,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                status: status as any,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                cancelAtPeriodEnd: sub.cancel_at_period_end,
              },
            }),
            prisma.carrierProfile.update({
              where: { id: carrierProfileId },
              data: {
                membershipActive: BIDDING_ALLOWED_STRIPE_STATUSES.includes(sub.status as any),
                membershipTier: "carrier",
              },
            }),
          ]);
          await auditLog({ action: "subscription.activated", targetType: "CarrierProfile", targetId: carrierProfileId, metadata: { subscriptionId, status } });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const record = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: sub.id } });
        if (record) {
          const status = mapStripeStatus(sub.status);
          await prisma.$transaction([
            prisma.subscription.update({
              where: { id: record.id },
              data: {
                status: status as any,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                cancelAtPeriodEnd: sub.cancel_at_period_end,
              },
            }),
            prisma.carrierProfile.update({
              where: { id: record.carrierProfileId },
              data: { membershipActive: BIDDING_ALLOWED_STRIPE_STATUSES.includes(sub.status as any) },
            }),
          ]);
          await auditLog({ action: `subscription.${event.type === "customer.subscription.deleted" ? "canceled" : "updated"}`, targetType: "CarrierProfile", targetId: record.carrierProfileId, metadata: { status } });
        }
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const profile = await prisma.carrierProfile.findFirst({ where: { stripeCustomerId: customerId } });
        if (profile) {
          await prisma.invoice.upsert({
            where: { stripeInvoiceId: invoice.id },
            update: {
              amount: (invoice.amount_paid || invoice.amount_due) / 100,
              status: invoice.status || "unknown",
              hostedInvoiceUrl: invoice.hosted_invoice_url || null,
              invoicePdfUrl: invoice.invoice_pdf || null,
            },
            create: {
              userId: profile.userId,
              stripeInvoiceId: invoice.id,
              amount: (invoice.amount_paid || invoice.amount_due) / 100,
              status: invoice.status || "unknown",
              hostedInvoiceUrl: invoice.hosted_invoice_url || null,
              invoicePdfUrl: invoice.invoice_pdf || null,
              periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
              periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
            },
          });
          if (event.type === "invoice.payment_failed") {
            await prisma.carrierProfile.update({ where: { id: profile.id }, data: { membershipActive: false } });
            await auditLog({ action: "invoice.payment_failed", targetType: "CarrierProfile", targetId: profile.id, metadata: { invoiceId: invoice.id } });
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        // Urgent-quote fee confirmation — see
        // src/app/api/shipments/[id]/urgent/checkout/route.ts, which sets
        // metadata.shipmentId and metadata.kind="urgent_fee" on creation.
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata?.kind === "urgent_fee" && pi.metadata?.shipmentId) {
          const shipmentId = pi.metadata.shipmentId;
          await prisma.$transaction([
            prisma.shipment.update({ where: { id: shipmentId }, data: { isUrgent: true, urgentFeeStatus: "SUCCEEDED" as any } }),
            prisma.transaction.updateMany({
              where: { stripePaymentIntentId: pi.id },
              data: { status: "SUCCEEDED" as any },
            }),
          ]);
          await auditLog({ action: "urgent_fee.paid", targetType: "Shipment", targetId: shipmentId, metadata: { paymentIntentId: pi.id } });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata?.kind === "urgent_fee" && pi.metadata?.shipmentId) {
          await prisma.transaction.updateMany({
            where: { stripePaymentIntentId: pi.id },
            data: { status: "FAILED" as any },
          });
          await prisma.shipment.update({ where: { id: pi.metadata.shipmentId }, data: { urgentFeeStatus: "FAILED" as any } });
        }
        break;
      }

      default:
        break;
    }

    // Record the event as processed only after successful handling —
    // record it even for event types we don't act on (the `default`
    // case above), so a retry of an ignored event type is also a no-op.
    await prisma.webhookEvent.create({ data: { stripeEventId: event.id, type: event.type } });

    return NextResponse.json({ received: true });

  } catch (err) {
    return handleApiError(err);
  }
}

// Stripe's subscription status strings are already lowercase snake_case
// (active, past_due, canceled, unpaid, incomplete, incomplete_expired,
// trialing, paused) — this just maps to our uppercase enum values.
function mapStripeStatus(stripeStatus: string): string {
  return stripeStatus.toUpperCase();
}
