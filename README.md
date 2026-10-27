# Wilson Sri Lanka — product catalogue website

A Wilson-styled product discovery site for Sri Lanka. It has a full catalogue, product pages and
an admin dashboard, and buyers check out at the local retailer (United Sports, configurable).

- **Public site:** homepage, `/products` (search, filters, sort, pagination), `/category/[slug]`,
  `/products/[slug]` (gallery with zoom, variants, specs, “Buy from retailer” deep link,
  related products, share, wishlist), `/search`, `/wishlist`, `/technologies`, `/stories`,
  `/about`, `/contact`, `/privacy`, `/terms`, plus sitemap, robots and structured data.
- **Admin (`/admin`):** dashboard with data-quality checks, product table, product editor
  (images, specs, variants, pricing, publish/draft, duplicate, delete, preview), CSV import/export,
  one-click price/stock sync from the retailer feed, categories, and homepage/contact content.
- **No fake commerce:** no cart and no payments. Each product links to its exact page at the
  retailer, including the selected size or colour where the retailer supports it.

Research notes, design tokens and data sources are in [docs/design-reference.md](docs/design-reference.md).
The import log is in [docs/import-report.md](docs/import-report.md).

---

## 1. Quick start (local)

Requires **Node.js 22.18+** (Node 24 LTS recommended).

```bash
npm install
npm run dev            # http://localhost:3000
```

With no configuration, the site runs read-only on the bundled catalogue
(`src/data/products.seed.json`: 58 real Wilson listings from United Sports, 56 published).

To try the admin locally without a database:

```bash
cp .env.example .env.local
npm run hash-password            # prints ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET
# put those + ADMIN_EMAIL into .env.local and set LOCAL_DATA_STORE=true
npm run dev                      # sign in at /admin
```

`LOCAL_DATA_STORE=true` saves changes to `./.data/` on your computer. This is for development
only, and it is ignored automatically on Netlify/Vercel.

## 2. Production setup

### Supabase (database + image storage)
1. Create a Supabase project.
2. Run `supabase/migrations/20261023000000_initial_schema.sql`, either in the SQL editor or with
   `supabase db push`. It creates the tables, indexes, RLS policies, the rate-limit function and
   the `product-images` storage bucket.
3. Put `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, then load the catalogue:
   ```bash
   npm run seed:supabase              # add -- --only-new to keep existing rows
   ```

### Environment variables
See [.env.example](.env.example). Required in production: `NEXT_PUBLIC_SITE_URL`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`,
`ADMIN_SESSION_SECRET`. Optional: `RESEND_API_KEY` + `RESEND_FROM` + `CONTACT_TO` (contact form
email), `LOCAL_RETAILER_NAME`/`LOCAL_RETAILER_URL`, `RETAILER_UTM_SOURCE`.

Missing optional services are reported in the server log at startup, and the site keeps working:
the contact form shows phone and email instead, and the newsletter is hidden.

### Deploy to Netlify
1. Push the project to a Git repository and import it in Netlify. `netlify.toml` is already set up.
2. Add the environment variables in **Site settings → Environment variables**.
3. Deploy. After deploying, check `/admin/login`, edit a product, and confirm the public page updates.

Before launch, confirm you have permission to use the Wilson logo and campaign images
(`public/brand/SOURCES.md`), or replace them via Admin → Site content.

## 3. Using the admin (for the shop owner)

| Task | Where |
|---|---|
| Add a product | Products → **Add product**. Fill in name, category and description, upload images, then **Save draft** or **Save & publish** |
| Edit / hide / show a product | Products → click the name. Use **Unpublish & save** to hide it, or click the *Published/Draft* badge in the table |
| Feature on homepage | Click the ★ in the products table, or tick *Featured* in the editor |
| Copy a similar product | Products → copy icon (creates a draft copy) |
| Delete | Products → bin icon → confirm. Unpublishing is safer if you might need it again |
| Preview a draft | Eye icon, or **Preview** in the editor |
| Update prices & stock from United Sports | Import / export → **Sync prices & stock now**. Your text and image edits are kept; new listings arrive as drafts |
| Bulk edit in Excel | Import / export → **Export**, edit, then **Import**. If any row has a problem, nothing is saved and every problem is listed |
| Put a product on offer / change its discount | Edit the product → **Offer discount** (e.g. 25). The site shows the offer price, the original price struck through and a “25% off” badge |
| Refresh United Sports’ offers | Import / export → **Sync prices & stock now** also updates every retailer offer. Offers you set yourself are never overwritten |
| Change the photo on the first sale banner | Site content → **Sale banner photo** → Upload a new photo → Save. Only use photos you have the rights to |
| Change homepage banner, announcement, contact details | Site content. In the announcement, `{maxDiscount}` is replaced by the current best offer %, and the bar hides itself when no offers are running |
| Categories (add padel etc.) | Categories |

The dashboard lists products that need attention: missing images, missing source information,
incomplete data, and imported listings with problems.

**Images:** upload JPEG, PNG, WebP, AVIF or GIF files up to 8 MB. They are resized to 2000 px,
converted to WebP, and stripped of camera and GPS metadata. You can also paste image URLs from
the retailer's or Wilson's image servers. Other sites are refused for security.

### Offers / discounts
Offers come from United Sports’ **Anniversary Offers** (`/pages/anniversary-offers`) and its discount
collections (titles containing a %, e.g. “Aniversary Discount 20%”). When a product appears in two
collections, the badge on the offers page wins. Otherwise the lower % is used, and the conflict is
logged in `docs/import-report.md`. Each product stores `discountPercent`. The offer price is always
calculated (`src/lib/pricing.ts`) and rounded to the cent, the same way the retailer does it.
Search, filters, sorting and structured data all use the offer price. A `/offers` page, a homepage
banner, the homepage hero carousel (a sale banner plus one banner per racket family showing up to four of its discounted, in-stock rackets, chosen automatically by `src/lib/promotions.ts`), an **Offers** menu link and the announcement bar highlight the promotion, and they disappear
automatically when there are no offers.

## 4. Development

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript (strict)
npm test             # unit tests (node:test): query/filter/sort, CSV round-trip, importer, links, validation
npm run build        # production build
npm run import:retailer               # rebuild the seed from the live retailer feed
npm run import:retailer -- --from DIR # …or from saved products.json pages
```

### Architecture
```
src/app/(site)/…        public pages (Server Components)
src/app/admin/…         login + protected panel
src/app/actions/        server actions (public forms, admin mutations — each re-checks the session)
src/app/api/            search typeahead, wishlist data, admin upload/export, dev media
src/components/         layout, home, product, admin, forms, ui
src/lib/                pure logic: product-query, csv, retailer-import, retailer-link, validation, utils
src/lib/server/         server-only: env, auth, password (scrypt), rate-limit, images (sharp), products, stores
src/lib/server/store/   DataStore implementations: Supabase · local dev file · read-only seed
src/data/               seed catalogue, categories, default content, stories, technologies
supabase/migrations/    SQL schema + RLS
scripts/                retailer import, Supabase seed, password hashing
```

Public reads are cached (`unstable_cache`, tag `catalog`, 5 min). Every admin mutation calls
`revalidateTag(…, { expire: 0 })` + `revalidatePath("/", "layout")`, so changes show up immediately.

### Security notes
- Admin sessions are HMAC-signed, HTTP-only, SameSite=Lax cookies that last 8 hours. Changing the
  password invalidates existing sessions. `proxy.ts` only does a fast redirect. The real check runs
  in the panel layout, every server action, and every admin route handler.
- Passwords are hashed with scrypt (N=2¹⁵), using a `scrypt:` format with no `$`, so `.env`
  expansion can't corrupt it. Login is rate-limited per IP (10) and per account (5) every 15
  minutes. Rate limits use the database when Supabase is configured, and memory otherwise.
- The service-role key is only used in `server-only` modules. RLS is enabled on every table, and
  the anon role can only read published or visible rows.
- All input is validated with Zod on the server. Uploads are checked by their actual content and
  re-encoded with sharp. Image URLs must come from an allow-list. CSV export guards against
  spreadsheet formula injection. Upload/export routes check the request origin.
- Security headers include CSP, HSTS, `X-Frame-Options: DENY`, nosniff, Referrer-Policy and
  Permissions-Policy. Admin pages are sent with `noindex`.
- Outbound buy links accept only http(s) URLs. The site has no redirect endpoint, so there is no
  open-redirect risk.
- Remaining `npm audit` items are in ESLint's dev-only dependency tree (`braces`). They are not
  shipped to production.

### Scaling note
The catalogue is loaded and filtered in memory, which is fast for hundreds of products. If it grows
past roughly 1,000 products, move filtering into SQL inside `SupabaseStore`.
"# wilson-sri-lanka" 
