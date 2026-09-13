import { createHash } from "node:crypto";
import { z } from "zod";
import { clientIp, rateLimitDurable } from "~/server/rateLimit";
import { SUPPORT_EMAIL } from "~/lib/support";

export const runtime = "nodejs";
const singleLine = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[\r\n\x00]/.test(value));
const submission = z.object({
  name: singleLine(100),
  email: z
    .string()
    .trim()
    .max(254)
    .email()
    .refine((value) => !/[\r\n\x00]/.test(value)),
  subject: singleLine(160),
  message: z.string().trim().min(1).max(10000),
  website: z.string().max(0),
  token: z.string().max(2048).optional(),
  requestId: z.string().uuid(),
});
const reply = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const origin = new URL(request.url);
  if (request.headers.get("origin") !== origin.origin)
    return reply({ error: "Please submit the form from this site." }, 403);
  const key = process.env.RESEND_API_KEY;
  const from = process.env.SUPPORT_FROM_EMAIL?.trim()
    ? process.env.SUPPORT_FROM_EMAIL
    : process.env.EMAIL_FROM;
  const secret = process.env.SUPPORT_TURNSTILE_SECRET_KEY;
  if (
    !key ||
    !from ||
    Boolean(secret) !== Boolean(process.env.SUPPORT_TURNSTILE_SITE_KEY)
  )
    return reply(
      {
        error: `The support form is unavailable. Please email ${SUPPORT_EMAIL}.`,
      },
      503,
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return reply({ error: "Expected a JSON request." }, 415);

  // Bound the streamed body too, rather than trusting Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "Please complete all fields." }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  let input: unknown;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) {
        await reader.cancel();
        return reply({ error: "Your request is too large." }, 413);
      }
      chunks.push(value);
    }
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }
  const parsed = submission.safeParse(input);
  if (!parsed.success)
    return reply(
      { error: "Please check all required fields and try again." },
      400,
    );
  const data = parsed.data;
  try {
    const hash = (value: string) =>
      createHash("sha256").update(value).digest("hex");
    const limits = await Promise.all([
      rateLimitDurable(
        `support:ip:${hash(clientIp(request.headers))}`,
        5,
        3_600_000,
        "deny",
      ),
      rateLimitDurable(
        `support:email:${hash(data.email.toLowerCase())}`,
        3,
        3_600_000,
        "deny",
      ),
      rateLimitDurable("support:global", 100, 3_600_000, "deny"),
    ]);
    if (limits.some((allowed) => !allowed))
      return reply(
        {
          error:
            "Too many requests. Please try again later or email us directly.",
        },
        429,
      );
    if (secret) {
      if (!data.token)
        return reply({ error: "Please complete the spam verification." }, 400);
      const verification = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret, response: data.token }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const verdict = z
        .object({
          success: z.literal(true),
          hostname: z.literal(origin.hostname),
          action: z.literal("support"),
        })
        .safeParse(await verification.json());
      if (!verification.ok || !verdict.success)
        return reply(
          { error: "Spam verification failed or expired. Please try again." },
          400,
        );
    }
    const email = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `support-${hash(JSON.stringify({ requestId: data.requestId, name: data.name, email: data.email, subject: data.subject, message: data.message }))}`,
      },
      body: JSON.stringify({
        from,
        to: [SUPPORT_EMAIL],
        reply_to: data.email,
        subject: `[LicenseMeter support] ${data.subject}`,
        text: `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const accepted = z
      .object({ id: z.string().min(1) })
      .safeParse(await email.json());
    if (!email.ok || !accepted.success)
      return reply(
        {
          error: `Your request could not be sent. Please try again or email ${SUPPORT_EMAIL}.`,
        },
        502,
      );
    return reply({ success: true });
  } catch {
    return reply(
      {
        error: `We could not confirm your request was sent. Try again or email ${SUPPORT_EMAIL}.`,
      },
      502,
    );
  }
}
