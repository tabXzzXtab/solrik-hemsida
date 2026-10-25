# SEO handoff: Solrik AB website

Static Astro 7 site, Swedish (default, `/`) and English (`/en/`). No CMS: all SEO fields are in
version-controlled files (see "Where things are edited").

## Access

- Repository: [add URL]
- Hosting: Netlify (recommended) or Vercel – redirects in `netlify.toml` / `vercel.json`, headers in `public/_headers`
- Search Console: [verify via DNS TXT (preferred) or set `PUBLIC_GOOGLE_SITE_VERIFICATION`]
- Bing Webmaster Tools: [set `PUBLIC_BING_SITE_VERIFICATION` or import from Search Console]
- Analytics: none by default (no cookies). Optional Plausible/Umami with consent – see README.

## Where things are edited

| Task | Where |
|---|---|
| Title / meta description per page | `src/i18n/sv.json` + `en.json` → `<page>.seo.title` / `.description` (brand appended automatically) |
| H1 per page | same files → `h1` (separate from the title) |
| Slugs / URL map | `src/i18n/routes.ts` (one place for links, hreflang, sitemap) |
| Projects / news / job ads (incl. `seoTitle`, `seoDescription`) | Markdown in `src/content/{projects,news,jobs}/{sv,en}/` |
| noindex an entry | frontmatter `example: true` (or `draft: true` to not build it) |
| FAQ (also FAQPage schema) | `sv.json`/`en.json` → `services.items.<service>.faq`, `brf.faq`, `tenants.faq` |
| NAP, opening hours, area served, social profiles | `src/config/company.ts` |
| Images + alt text | `src/config/images.ts`; entries: frontmatter `images[].alt` |
| Redirects (301) | `netlify.toml` / `vercel.json` |
| Verification tags, analytics | environment variables (`.env.example`) |

## Site structure

- URL pattern: `/{hub}/{slug}/`, lowercase ASCII (å/ä/ö transliterated), trailing slash, no dates.
- Hubs: `/tjanster/` (4 service pages), `/projekt/`, `/nyheter/`, `/karriar/`, `/hyresgast/`.
- Templates: home, service hub, service page, BRF landing page, project list/detail, tenants, fault
  report, about, news list/detail, careers/job ad, contact, legal (3), thank-you (noindex), 404.
- Languages: sv (default, root) and en (`/en/`), translated slugs, reciprocal hreflang
  sv/en/x-default (→ sv) in `<head>` and in `sitemap.xml`. No IP/language redirects.
- Schema per template:
  - all pages: `GeneralContractor` (#organization) + `ProfessionalService`/`RealEstateAgent`
    (#property-management) + `WebSite` + `WebPage` (AboutPage/ContactPage/CollectionPage where apt)
    + `BreadcrumbList`
  - service pages: `Service` + `FAQPage`; BRF page: `Service` + `FAQPage`; tenants: `FAQPage`
  - news: `NewsArticle`; job ads: `JobPosting`; projects: `CreativeWork` (real entries only)
  - Placeholder values (`[…]`) are omitted from JSON-LD automatically.
- Click depth ≤ 3 for every indexable page; breadcrumbs on all pages below home; related-service /
  related-project / related-news blocks.

## Current status (2026-10-25)

- Type check: 0 errors / 0 warnings / 0 hints.
- `npm run qa` (custom crawl of `dist/`): 0 errors, 0 warnings. 28 URLs in sitemap. Intentionally
  noindex: thank-you pages, the hidden tenants page, and the Projects/News archives while they are
  empty (they return to menus and sitemap as soon as an entry is published).
- Browser tests (all pages × 360 px and 1440 px): no horizontal overflow, no console errors.
- Lighthouse mobile (median of 3 runs, local production preview):

  | Template | Performance | Accessibility | Best practices | SEO | LCP | CLS |
  |---|---|---|---|---|---|---|
  | Home `/` | 99 | 100 | 100 | 100 | 2.2 s | 0 |
  | Service `/tjanster/fastighetsforvaltning/` | 100 | 100 | 100 | 100 | 1.7 s | 0 |
  | Contact `/kontakt/` | 100 | 100 | 100 | 100 | 1.5 s | 0 |
  | About (EN) `/en/about/` | 100 | 100 | 100 | 100 | 1.7 s | 0 |

  Lab numbers on a local server – re-measure on the production domain with PageSpeed Insights.
- Open items: see `PLACEHOLDERS.md` (registered office, F-skatt, key figures, certifications,
  projects, production domain).
- Migration: new site, no redirect map needed. If an old site exists, map its URLs to the new ones
  with 301s before launch.

## Recommendations for the SEO specialist

- Build the keyword → URL map. Each service already has its own URL; the IA allows more service
  pages (add a key in `routes.ts` + copy in the JSON files).
- Area pages (e.g. "Fastighetsförvaltning Lund") only with genuinely unique local content.
- Fill `OPENING_HOURS_SCHEMA` and `GEO` in `company.ts`, and link the Google Business Profile
  (`GOOGLE_MAPS_URL`, plus `sameAs` via LinkedIn/Instagram URLs).
- Photos are Pexels stock images (credited). Replace them with real, unique project photography
  over time (keep descriptive alt texts); re-run Lighthouse after.
- The home H1 is "Fastighetsförvaltning – en del av Radiant Group" (title tag: "Bygg, renovering och
  förvaltning i {ort}"). Align the title tag with the primary keyword once the keyword map is done.
- AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) are allowed by default in
  `robots.txt` – decide with the company and document the choice.
- Log every SEO-relevant change in `SEO-CHANGELOG.md`.
