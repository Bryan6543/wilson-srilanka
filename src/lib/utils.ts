// Pure helpers shared by the app, scripts and tests (no path aliases here on purpose).

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function formatPrice(amount: number, currency = "LKR"): string {
  const formatted = new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return currency === "LKR" ? `Rs. ${formatted}` : `${currency} ${formatted}`;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&nbsp;": " ",
  "&ndash;": "–",
  "&mdash;": "—",
  "&deg;": "°",
  "&times;": "×",
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&[a-z]+;|&#39;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
}

/** Strip tags, decode entities and normalise whitespace. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|li|div|h\d|td|tr)>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** Repairs "sentence.Next sentence" joins that come from tag stripping. */
export function fixSentenceSpacing(text: string): string {
  return text.replace(/([a-z°)%])\.([A-Z])/g, "$1. $2").replace(/\s+/g, " ").trim();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Ensures a slug is unique against `taken`, appending -2, -3… as needed. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const root = base || "product";
  let candidate = root;
  let n = 2;
  while (taken.has(candidate)) candidate = `${root}-${n++}`;
  return candidate;
}

/** "United Sports (Pvt) Ltd" → "United Sports" for use in running text. */
export function shortBusinessName(name: string): string {
  return name.replace(/\s*\((pvt|private)\)\s*(ltd|limited)\.?\s*$/i, "").trim();
}
