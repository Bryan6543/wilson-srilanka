import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/server/auth";
import { services } from "@/lib/server/env";
import { Logo } from "@/components/ui/Logo";
import { Notice } from "@/components/ui/States";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo />
          <p className="font-extended text-[11px] text-muted">Catalogue admin</p>
        </div>
        <div className="rounded-md bg-white p-6 shadow-sm">
          <h1 className="mb-6 text-xl font-bold">Sign in</h1>
          {services.adminAuth ? (
            <LoginForm />
          ) : (
            <Notice tone="warning" title="Admin sign-in is not set up yet">
              Set <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD_HASH</code> and <code>ADMIN_SESSION_SECRET</code> in the server
              environment. Run <code>npm run hash-password</code> to generate them (see README).
            </Notice>
          )}
        </div>
      </div>
    </main>
  );
}
