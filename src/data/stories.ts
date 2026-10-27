// Editorial stories. Every factual claim cites a source. Stories with status "draft" are
// never rendered publicly, listed in the sitemap or indexed. They are kept for the owner to
// review (e.g. confirm they want to feature another company's launch event).
export interface StorySource {
  label: string;
  url: string;
}

export interface Story {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date the story's facts relate to / were published
  image: string;
  imageAlt: string;
  status: "published" | "draft";
  body: string[]; // paragraphs
  sources: StorySource[];
}

export const STORIES: Story[] = [
  {
    slug: "a-heritage-that-began-in-1913",
    title: "A heritage that began in 1913",
    excerpt: "From a Chicago start-up in 1913 to a name found on courts and fields all over the world.",
    date: "2026-10-23",
    image: "/images/campaign/racket-wall.webp",
    imageAlt: "Wilson tennis rackets hanging on a wooden wall",
    status: "published",
    body: [
      "Wilson's story starts in Chicago in 1913, when the Ashland Manufacturing Company was set up. The business later took the Wilson name, and Wilson Sporting Goods is still based in Chicago, Illinois.",
      "Since 1989 Wilson has been part of Amer Sports, the global sporting goods group.",
      "In tennis, the Pro Staff became one of the sport's best-known frames. Its original Kevlar version is associated with Pete Sampras, and Roger Federer used Wilson racquets when he won the 2009 Wimbledon Championships.",
    ],
    sources: [{ label: "Wikipedia — Wilson Sporting Goods", url: "https://en.wikipedia.org/wiki/Wilson_Sporting_Goods" }],
  },
  {
    slug: "the-ball-on-the-biggest-stages",
    title: "The ball on the biggest stages",
    excerpt: "US Open tennis, the NFL, the NBA and WNBA: Wilson's long record as an official ball supplier.",
    date: "2026-10-23",
    image: "/images/campaign/recreational.webp",
    imageAlt: "A tennis player carrying a white Wilson racket on a blue hard court",
    status: "published",
    body: [
      "Wilson became the official supplier of the NFL in 1941, the same year its Duke football was adopted as the league's official ball.",
      "Wilson tennis balls were first used at the US Open in 1979, and the Australian Open began using them in 2006.",
      "Starting with the 2021 season, Wilson became the official game ball supplier of the NBA and WNBA.",
    ],
    sources: [{ label: "Wikipedia — Wilson Sporting Goods", url: "https://en.wikipedia.org/wiki/Wilson_Sporting_Goods" }],
  },
  {
    slug: "blade-v10-launch-sri-lanka",
    title: "Blade V10 launches in Sri Lanka",
    excerpt: "The tenth-generation Blade was launched at the Sri Lanka Tennis Association on 18 July 2026.",
    date: "2026-07-27",
    image: "/images/campaign/performance.webp",
    imageAlt: "A player holding a green Wilson Blade racket",
    status: "draft",
    body: [
      "The Blade V10 was officially launched in Sri Lanka on 18 July at the Sri Lanka Tennis Association, hosted by Wilson Sri Lanka and Trident Distributors Ltd.",
      "The newest version of Wilson's Blade line features StableFeel Technology for stability, feel and connection. Guests tested it for control, consistency, touch and match play.",
      "The event also introduced Wilson's Junior Athlete Sponsorship Program. Its first athletes, Akeesha Silva and Yuhansa Peiris, each receive a two-year package of Wilson equipment, apparel and brand support.",
    ],
    sources: [
      {
        label: "Daily FT — Wilson Blade V10 launch serves up new chapter for Sri Lankan tennis",
        url: "https://www.ft.lk/sports/Wilson-Blade-V10-launch-serves-up-new-chapter-for-Sri-Lankan-tennis/23-795160",
      },
    ],
  },
];

export const publishedStories = () =>
  STORIES.filter((s) => s.status === "published").sort((a, b) => b.date.localeCompare(a.date));
