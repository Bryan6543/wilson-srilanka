import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG, CONTENT_TAG } from "@/lib/catalog";

/** Expire cached catalogue data immediately so saved changes are visible on the next request. */
export function revalidateCatalog(): void {
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

export function revalidateContent(): void {
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}
