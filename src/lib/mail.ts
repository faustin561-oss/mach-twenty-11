// Shared email sending — best-effort via Resend (already a dependency),
// same pattern as the newsletter subscribe route. Returns whether the
// send actually happened, so callers (email verification, password
// reset) can decide what to do when it didn't — unlike the newsletter
// case, a failed send here is not cosmetic: the user has no other way to
// get their token. See sendMailOrDevFallback below for how routes handle
// that honestly instead of silently pretending an email went out.
export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Mach Twenty 11 <support@mach2011.com>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error("[mail] send failed:", err);
    return false;
  }
}

// Wraps sendMail with an explicit, clearly-logged local-dev fallback: if
// RESEND_API_KEY isn't set and this isn't production, the raw token is
// returned directly in the API response instead of emailed, so
// email-verification/password-reset flows are actually testable locally
// without real email infrastructure. This must never happen in
// production — if RESEND_API_KEY is missing there, the token is not
// returned to the client; the request succeeds but the user won't
// receive anything, which is a real ops issue to notice and fix, not a
// security hole to route around.
export async function sendMailOrDevFallback(
  opts: { to: string; subject: string; html: string },
  rawTokenForDevFallback: string
): Promise<{ sent: boolean; devToken?: string }> {
  const sent = await sendMail(opts);
  if (sent) return { sent: true };
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[mail] RESEND_API_KEY not set — dev fallback token for ${opts.to}: ${rawTokenForDevFallback}`);
    return { sent: false, devToken: rawTokenForDevFallback };
  }
  return { sent: false };
}
