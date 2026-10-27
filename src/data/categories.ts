import type { Category } from "../types/product.ts";

// Categories enabled for the Sri Lankan catalogue, based on what the verified local
// retailer actually stocks (tennis + basketball). Padel, pickleball etc. can be added in
// Admin → Categories once real products are available.
export const SEED_CATEGORIES: Category[] = [
  {
    slug: "tennis-rackets",
    name: "Tennis Rackets",
    sport: "tennis",
    description:
      "Blade, Clash, Pro Staff, Ultra and RF rackets — from tour-level frames to lightweight and junior models.",
    image: "/images/categories/tennis-rackets.webp",
    sortOrder: 10,
    visible: true,
  },
  {
    slug: "tennis-balls",
    name: "Tennis Balls",
    sport: "tennis",
    description: "Tournament, practice and low-compression junior balls.",
    image: "/images/categories/tennis-balls.webp",
    sortOrder: 20,
    visible: true,
  },
  {
    slug: "tennis-bags",
    name: "Bags & Backpacks",
    sport: "tennis",
    description: "Super Tour, Tour and Team racket bags and backpacks to carry your kit to the court.",
    image: "/images/categories/tennis-bags.webp",
    sortOrder: 30,
    visible: true,
  },
  {
    slug: "tennis-shoes",
    name: "Tennis Shoes",
    sport: "tennis",
    description: "Court shoes built for support, cushioning and traction.",
    image: "/images/categories/tennis-shoes.webp",
    sortOrder: 40,
    visible: true,
  },
  {
    slug: "tennis-accessories",
    name: "Strings, Grips & Accessories",
    sport: "tennis",
    description: "Overgrips, replacement grips, strings and dampeners.",
    image: "/images/categories/tennis-accessories.webp",
    sortOrder: 50,
    visible: true,
  },
  {
    slug: "basketball",
    name: "Basketball",
    sport: "basketball",
    description: "Wilson basketballs for indoor and outdoor play.",
    image: "/images/categories/basketball.webp",
    sortOrder: 60,
    visible: true,
  },
];

export const SPORTS: Record<string, string> = {
  tennis: "Tennis",
  basketball: "Basketball",
  padel: "Padel",
  pickleball: "Pickleball",
};
