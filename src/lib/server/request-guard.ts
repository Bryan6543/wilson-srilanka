import "server-only";

/**
 * CSRF defence for cookie-authenticated route handlers: the request must come from this
 * site's own origin. (Server actions get an equivalent check from Next.js automatically.)
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
