# Wilson design reference & research notes

Research date: 2026-10-23. Primary reference: https://www.wilson.com/en-us/ (live theme HTML/CSS
inspected directly). Regional sites (sg / au / mas) blocked automated access (HTTP 403), so they
were not used for any data.

## 1. Design reference summary (wilson.com)

- **Overall feel:** white pages with near-black type and large full-bleed photography. Colour comes
  from the photos and products, not the UI chrome. Red is a small accent, not a theme colour.
- **Header:** utility bar ("Find a Store" etc.), then the wordmark on the left, uppercase sport
  menus with mega-menu dropdowns, and search on the right. A black announcement bar sits above.
- **Homepage structure:** hero banner (1920×960) → multi-column carousel of portrait tiles
  (480×600) → second hero → **split hero** (two tiles side by side) → **shop by sport** row of
  square tiles on a warm off-white (320×320) → product carousel → footer.
- **Product imagery:** products sit on a warm off-white backdrop (`rgb(243 241 237)`) with portrait
  ratios. Category tiles use the same backdrop.
- **Buttons:** solid black with white text, uppercase, wide (extended) letterforms, ~3px radius.
  Secondary buttons are outlined in grey `rgb(149 149 149)`.
- **Variant pills:** white with a `rgb(214 214 214)` border. When selected: black fill, white text.

## 2. Colour tokens (verified from wilson.com CSS unless marked "derived")

| Token | Value | Source |
|---|---|---|
| ink (primary text) | `#191919` | Most frequent colour in theme CSS |
| ink-strong | `#000000` | Buttons, selected variants |
| ink-soft | `#333333` | `rgb(51 51 51)` hover/selected |
| muted | `#5e5e5e` | Theme CSS (secondary text) |
| line | `#d6d6d6` | `rgb(214 214 214)` variant borders |
| line-soft | `#ebebeb` | Theme CSS |
| surface-alt | `#f5f5f5` | `rgb(245 245 245)` |
| surface-warm | `#f3f1ed` | `rgb(243 241 237)` product/category tiles |
| brand | `#15191d` | Fill of the official `wilson-logo.svg` |
| accent | `#c8102e` | `rgb(200 16 46)` red accent |
| accent-dark | `#a00d26` | `rgb(160 13 38)` |
| success | `#0f7a4d` | **derived:** theme `#13a165` darkened for AA contrast |
| warning / error | `#8a5300` / `#b3261e` | **derived:** chosen for AA contrast |

These are observed values, not official Wilson brand-guideline tokens.

## 3. Typography

wilson.com uses **GT America** (Standard for body, **Compressed** for headlines, **Extended** for
buttons and labels). GT America is a commercial font, so it is not bundled here. Instead the
site uses **Archivo** (Google Fonts, OFL), a variable font with a width axis:

- `font-display`: Archivo at width 62, weight 800, uppercase, leading 0.92 (≈ GT America Compressed)
- body: Archivo at width 100 (≈ GT America Standard)
- `font-extended` / `.btn`: Archivo at width 125, weight 600, uppercase, tracking 0.06em (≈ GT America Extended)

If you license GT America, swap the font in `src/app/layout.tsx` and adjust the utilities in `globals.css`.

## 4. Component & page inventory

Layout: AnnouncementBar, Header (DesktopNavigation mega-menu, MobileNavigation drawer, SearchOverlay
with live suggestions), Footer (with NewsletterForm when storage is configured).
Home: HeroSection (GSAP reveal), CategoryCard, ProductGrid/ProductCard, split campaign tiles, racket
families, recently added, technology strip, editable spotlight, stories.
Catalogue: CatalogView, ProductFilters (desktop sidebar + mobile drawer, URL-synced), CatalogToolbar
(sort), Pagination, EmptyState.
Product: ProductGallery (thumbnails + full-screen zoom), PriceDisplay, AvailabilityBadge,
PurchasePanel/VariantSelector (retailer variant deep links), ProductSpecifications, RelatedProducts,
ShareButton, WishlistButton.
Admin: AdminNav, AdminProductTable, ProductEditor, ImageUploader, ListEditor, CategoryForm,
SiteContentEditor, ImportTools (CSV + retailer sync), ConfirmDialog.

## 5. Category structure

Categories are based on what the verified local retailer actually stocks (Wilson listings at
unitedsports.lk on 2026-10-23):

| Category | Sport | Products at import |
|---|---|---|
| Tennis Rackets | tennis | 26 (+1 draft) |
| Tennis Balls | tennis | 4 (+1 draft) |
| Bags & Backpacks | tennis | 17 |
| Tennis Shoes | tennis | 2 |
| Strings, Grips & Accessories | tennis | 6 |
| Basketball | basketball | 1 |

Padel and pickleball are part of Wilson's Sri Lanka portfolio according to press coverage, but the
retailer had no such listings, so those categories are not created. Add them in Admin → Categories
once real products exist.

## 6. Data sources & limitations

| Data | Source | Notes |
|---|---|---|
| Products, LKR prices, stock, variants, images | `https://www.unitedsports.lk/products.json` (public Shopify feed) | Every product keeps its exact retailer URL and source ID. See `docs/import-report.md` |
| Wordmark, favicon, campaign & category imagery | wilson.com CDN | See `public/brand/SOURCES.md`. Confirm usage rights before launch |
| Technology descriptions | wilson.com product pages (linked per item) | Summarised, with source links |
| Brand history facts | Wikipedia — Wilson Sporting Goods | Cited on About / Stories |
| Sri Lanka launch facts | Daily FT (27 Jul 2026), Daily Mirror (6 May 2026) | Blade V10 story kept as **draft** (it features Trident Distributors' launch event) |
| Retailer contact details | unitedsports.lk/pages/united-sports | Opening hours not published, so left blank |

Known data limitations:
- Retailer product photos carry a "United Sports" watermark.
- The retailer's "compare-at" prices are *lower* than its selling prices on several listings, so
  no sale prices are shown (logged in the import report).
- Two listings are held as drafts: "Championship Tennis Balls" (no description) and "Ultra Team V4"
  (the description is for a badminton string).
- Two different dampener listings share the same title. The retailer should rename them.
- wilson.com's About Us page body could not be extracted, so brand facts are cited from Wikipedia.
