import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: bounce visitors without a session cookie away from admin pages.
// The session is fully verified (signature, expiry, credentials version) in the admin layout,
// in every server action and in every admin route handler.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !request.cookies.has("wsl_admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
