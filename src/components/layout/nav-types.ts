export interface NavCategory {
  slug: string;
  name: string;
  count: number;
  image?: string;
  sport?: string;
}

export interface NavSport {
  key: string;
  label: string;
  href: string;
  categories: NavCategory[];
}

export const STATIC_NAV = [
  { label: "Technologies", href: "/technologies" },
  { label: "Stories", href: "/stories" },
  { label: "About", href: "/about" },
] as const;
