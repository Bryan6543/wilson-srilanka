"use server";

import { redirect } from "next/navigation";
import { checkCredentials, createSession, destroySession } from "@/lib/server/auth";
import { services } from "@/lib/server/env";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { loginSchema } from "@/lib/validation";

export interface LoginState {
  error?: string;
  /** Echoed back so the email field survives React's post-action form reset. */
  email?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!services.adminAuth) {
    return { error: "Admin sign-in is not configured on this server. See README → Admin setup." };
  }
  const emailInput = String(formData.get("email") ?? "").slice(0, 200);
  const parsed = loginSchema.safeParse({ email: emailInput, password: formData.get("password") });
  if (!parsed.success) return { error: "Enter your email and password.", email: emailInput };

  const ip = await clientIp();
  // Limit by IP and by account to slow down password guessing.
  const [ipOk, accountOk] = await Promise.all([
    rateLimit("login-ip", ip, 10, 15 * 60),
    rateLimit("login-account", parsed.data.email.toLowerCase(), 5, 15 * 60),
  ]);
  if (!ipOk || !accountOk) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again.", email: emailInput };
  }

  if (!(await checkCredentials(parsed.data.email, parsed.data.password))) {
    return { error: "Incorrect email or password.", email: emailInput };
  }
  await createSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
