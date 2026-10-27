// Technology descriptions summarised from official Wilson product copy (wilson.com, retrieved
// 2026-10-23) and the verified retailer listing. Every entry links to its source.
export interface Technology {
  slug: string;
  name: string;
  family: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  relatedTag?: string;
}

export const TECHNOLOGIES: Technology[] = [
  {
    slug: "x-loop",
    name: "X-Loop geometry",
    family: "Blade V10",
    summary:
      "Geometry in the shoulders of the frame that Wilson describes as giving the Blade V10 “a unique feel and stability that make a Blade a Blade.”",
    sourceUrl: "https://www.wilson.com/en-us/products/blade-100l-v10-tennis-racket-wr20830",
    sourceName: "Wilson — Blade 100L V10",
    relatedTag: "blade",
  },
  {
    slug: "braided-composition",
    name: "Braided composition",
    family: "Blade V10 Pro",
    summary: "A braided layup that improves the flex of the racket for enhanced feel and control.",
    sourceUrl: "https://www.wilson.com/en-us/products/blade-98-pro-16x19-v10-tennis-racket-wr20760",
    sourceName: "Wilson — Blade 98 Pro 16x19 V10",
    relatedTag: "blade",
  },
  {
    slug: "si3d",
    name: "SI3D",
    family: "Ultra V5 · Clash V3",
    summary:
      "A patented layup that optimises how the frame bends. Wilson says it gives a mix of power, spin and control, with better pocketing and shot shaping.",
    sourceUrl: "https://www.wilson.com/en-us/products/ultra-100-v5-tennis-racket-wr17880",
    sourceName: "Wilson — Ultra 100 V5",
    relatedTag: "ultra",
  },
  {
    slug: "fortyfive",
    name: "FORTYFIVE°",
    family: "Ultra V5",
    summary:
      "Patented technology that boosts frame stability for more consistent strokes and greater confidence on every shot.",
    sourceUrl: "https://www.wilson.com/en-us/products/ultra-100ul-v5-tennis-racket-wr17900",
    sourceName: "Wilson — Ultra 100UL V5",
    relatedTag: "ultra",
  },
  {
    slug: "crush-zone-parallel-drilling",
    name: "Crush Zone & Parallel Drilling",
    family: "Ultra V5",
    summary:
      "A Crush Zone grommet system that enlarges the sweet spot, paired with Parallel Drilling and a dual-taper beam that add power.",
    sourceUrl: "https://www.wilson.com/en-us/products/ultra-111-v5-tennis-racket-wr17910",
    sourceName: "Wilson — Ultra 111 V5",
    relatedTag: "ultra",
  },
  {
    slug: "paradigm-bending",
    name: "Paradigm Bending & 45° braid",
    family: "Pro Staff",
    summary:
      "Optimises the bending profile between shaft and hoop for precise control. A double braid set at 45-degree angles lets the frame “breathe” on impact, adding dwell time while keeping the signature Pro Staff feel.",
    sourceUrl: "https://www.wilson.com/en-us/products/pro-staff-97-classic-tennis-racket-wr20130",
    sourceName: "Wilson — Pro Staff 97 Classic",
    relatedTag: "pro-staff",
  },
  {
    slug: "agiplast-click-and-go",
    name: "Agiplast & Click & Go",
    family: "Clash V3",
    summary:
      "A plant-based Agiplast bumper, grommets and end cap reduce environmental footprint, and the Click & Go bumper system makes replacement quick and easy.",
    sourceUrl: "https://www.wilson.com/en-us/products/clash-100-v3-tennis-racket-wr17280",
    sourceName: "Wilson — Clash 100 V3",
    relatedTag: "clash",
  },
  {
    slug: "4d-support-chassis",
    name: "4D Support Chassis",
    family: "Rush Pro footwear",
    summary:
      "Adds stability during quick changes of direction. In the Rush Pro Ace it is paired with a breathable Sensifeel upper, R-DST+ midsole cushioning and a Duralast outsole.",
    sourceUrl: "https://www.unitedsports.lk/products/wilson-rush-pro-ace-tennis-shoes-1",
    sourceName: "United Sports — Rush Pro Ace listing",
    relatedTag: "rush-pro",
  },
];
