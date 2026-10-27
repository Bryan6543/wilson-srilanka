import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/database";
import { ImageValidationError, MAX_UPLOAD_BYTES, storeUploadedImage } from "@/lib/server/images";
import { rateLimit } from "@/lib/server/rate-limit";
import { isSameOrigin } from "@/lib/server/request-guard";

/** Admin image upload: one file per request, validated and re-encoded server-side. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  let session;
  try {
    session = await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  }
  if (!getStore().writable) {
    return NextResponse.json({ error: "Image uploads need persistent storage (Supabase) to be configured." }, { status: 503 });
  }
  if (!(await rateLimit("upload", session.email, 120, 3600))) {
    return NextResponse.json({ error: "Upload limit reached. Please try again later." }, { status: 429 });
  }
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Images must be 8 MB or smaller." }, { status: 413 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
    const image = await storeUploadedImage(file);
    return NextResponse.json(image, { status: 201 });
  } catch (err) {
    if (err instanceof ImageValidationError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[upload]", err);
    return NextResponse.json({ error: "The image could not be uploaded. Please try again." }, { status: 500 });
  }
}
