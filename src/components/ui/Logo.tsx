import Image from "next/image";
import { cn } from "@/lib/utils";

/** Official Wilson wordmark (public/brand/wilson-wordmark.svg — see SOURCES.md). */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Image
      src="/brand/wilson-wordmark.svg"
      alt="Wilson"
      width={807}
      height={200}
      priority
      className={cn("h-6 w-auto md:h-7", inverted && "invert", className)}
    />
  );
}
