import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_UPLOAD_DIR } from "@/lib/server/store/local-store";
import { getStore } from "@/lib/server/database";

/**
 * Serves images uploaded to the development file store (.data/uploads). Only active when the
 * local store is in use; filenames are strictly validated to prevent path traversal, and files
 * are always served as WebP images (they were re-encoded by sharp on upload).
 */
export async function GET(_req: Request, { params }: RouteContext<"/api/media/[...path]">) {
  if (getStore().kind !== "local") return new Response("Not found", { status: 404 });
  const parts = (await params).path;
  const name = parts.length === 1 ? parts[0]! : "";
  if (!/^[a-f0-9-]{36}-[a-z0-9.-]{1,60}\.webp$/i.test(name)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(LOCAL_UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
