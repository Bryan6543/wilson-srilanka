"use server";

import { getStore } from "@/lib/server/database";
import { env, services } from "@/lib/server/env";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { contactFormSchema, fieldErrors, newsletterSchema } from "@/lib/validation";

export interface FormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    company: formData.get("company") || undefined,
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  if (!(await rateLimit("newsletter", await clientIp(), 5, 3600))) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }
  const store = getStore();
  if (!store.writable) return { status: "error", message: "Newsletter sign-up is not available right now." };
  try {
    const result = await store.addSubscriber(parsed.data.email.toLowerCase());
    return {
      status: "success",
      message: result === "exists" ? "You're already on the list — thanks!" : "Thanks! You're on the list.",
    };
  } catch {
    return { status: "error", message: "We couldn't save your email. Please try again." };
  }
}

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
    company: formData.get("company") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  if (!(await rateLimit("contact", await clientIp(), 5, 3600))) {
    return { status: "error", message: "You've sent several messages recently. Please try again in an hour." };
  }
  if (!services.email) {
    return {
      status: "error",
      message: "Online messages aren't available at the moment. Please call or email the store using the details on this page.",
    };
  }

  const { name, email, phone, subject, message } = parsed.data;
  // Plain-text email only: visitor input is never rendered as HTML.
  const text = [`From: ${name} <${email}>`, phone ? `Phone: ${phone}` : null, "", message].filter((l) => l !== null).join("\n");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.resendFrom,
        to: env.contactTo!.split(",").map((s) => s.trim()),
        reply_to: email,
        subject: `[Website] ${subject.replace(/[\r\n]+/g, " ")}`,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[contact] Resend responded", res.status, await res.text().catch(() => ""));
      throw new Error("send failed");
    }
    return { status: "success", message: "Thanks — your message has been sent. We'll reply by email." };
  } catch {
    return { status: "error", message: "Your message could not be sent. Please try again or contact the store directly." };
  }
}
