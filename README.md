# Solrik – website

Static, bilingual (Swedish / English) website for **Solrik AB** (org.nr 559200-5077), a property
management and construction company in Skåne and part of Radiant Group (SNI 41.200, 43.xxx, 68.320, 81.100). Built with **Astro 7**, **TypeScript** and
**Tailwind CSS 4**. No database, no server: it builds to plain HTML and deploys to Netlify or Vercel.

No `[placeholder]` text is shown on the site: facts that are still missing (registered office,
key figures, certifications …) are hidden until they are filled in. See
**[PLACEHOLDERS.md](PLACEHOLDERS.md)** for what is missing and which texts to review.

---

## Contents

1. [Quick start](#quick-start)
2. [Project structure](#project-structure)
3. [Edit company details](#edit-company-details)
4. [Edit texts (sv/en)](#edit-texts-sven)
5. [Add projects, news and job ads](#add-projects-news-and-job-ads)
6. [Swap images](#swap-images)
7. [Forms](#forms)
8. [Analytics and cookies](#analytics-and-cookies)
9. [SEO features](#seo-features)
10. [Deploy](#deploy)
11. [Quality checks](#quality-checks)
12. [Change colours, fonts and logo](#change-colours-fonts-and-logo)

---

## Quick start

Requirements: **Node.js 22.22 or newer** (Astro 7.4 requires it) and npm.

```bash
npm install
npm run dev        # http://localhost:4321 – live reload while editing
npm run build      # type check (astro check) + production build to dist/
npm run preview    # serve dist/ locally to test the real build
npm run qa         # SEO/quality audit of dist/ (run after build)
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | `astro check` (types, 0 errors required) + `astro build` |
| `npm run build:only` | Build without the type check |
| `npm run preview` | Serve the production build |
| `npm run qa` | Audits titles, descriptions, canonicals, H1, hreflang, JSON-LD, images, broken links, click depth, sitemap |
| `npm run placeholders` | Re-generates the downloadable PDFs (`-- --force` overwrites) |
| `npm run brand -- logo.png` | Builds the header logo, `public/logo.png` and the favicons from a transparent logo PNG |
| `npm run photos -- search \| download` | Pick and download stock photos from Pexels (see "Swap images") |

## Project structure

```
src/
  config/
    company.ts        ← ALL company data (name, org.nr, phone, key figures, promises, page switches …)
    images.ts         ← image slots for fixed pages (+ alt text)
    site.ts           ← technical settings from environment variables (forms, analytics)
  i18n/
    sv.json, en.json  ← ALL page copy, per language (same structure in both)
    routes.ts         ← URL map: every slug in both languages, used for links/hreflang/sitemap
  content/
    projects/{sv,en}/*.md   ← one file per project and language (+ images/)
    news/{sv,en}/*.md       ← news posts (+ images/)
    jobs/{sv,en}/*.md       ← job ads
  content.config.ts   ← frontmatter schemas for the three collections
  views/              ← page templates (one per page type, shared by sv and en)
  pages/              ← thin route files: Swedish at /, English under /en/
  components/
    layout/  Header, Logo, Footer, Wordmark, MobileActionBar, Breadcrumbs, LanguageSwitcher, ConsentBanner …
    ui/      Button, Container, Section, SectionHeader, Heading, Figure, PageHero, Icon …
    blocks/  RoutingTile, ServiceCard, PromiseStrip, StatFigure, ProjectCard, ProjectFilter,
             FactsBox, Gallery, FAQAccordion, ProcessSteps, CTABand, Checklist …
    forms/   Form, Field, ConsentField, RadioGroup, QuoteForm, FaultReportForm
  scripts/            ← the only client JS: menu.ts, project-filter.ts, forms.ts, consent.ts
  styles/global.css   ← design tokens (colours, type scale) and utilities
  assets/             ← images and logo (optimised at build) and self-hosted fonts
public/
  dokument/           ← downloadable PDFs (checklist, tenant forms)
  _headers            ← Netlify security/cache headers
scripts/
  brand-assets.mjs, generate-placeholders.mjs, pexels.mjs, qa-audit.mjs
```

### URLs

| Page | Swedish | English |
|---|---|---|
| Home | `/` | `/en/` |
| Services | `/tjanster/` | `/en/services/` |
| – New construction | `/tjanster/nybyggnation/` | `/en/services/new-construction/` |
| – Renovation | `/tjanster/renovering/` | `/en/services/renovation/` |
| – Property management | `/tjanster/fastighetsforvaltning/` | `/en/services/property-management/` |
| – Property maintenance | `/tjanster/fastighetsdrift/` | `/en/services/property-maintenance/` |
| For BRF boards | `/bostadsrattsforeningar/` | `/en/housing-cooperatives/` |
| Projects (+ detail) | `/projekt/` `/projekt/<slug>/` | `/en/projects/` … |
| Tenants (hidden: `SHOW_TENANTS_PAGE = false`) | `/hyresgast/` | `/en/tenants/` |
| Fault report | `/hyresgast/felanmalan/` | `/en/tenants/report-a-fault/` |
| About | `/om-oss/` | `/en/about/` |
| News (+ detail) | `/nyheter/` | `/en/news/` |
| Careers (+ job ad) | `/karriar/` | `/en/careers/` |
| Contact + quote form | `/kontakt/` (form at `#offert`) | `/en/contact/` |
| Privacy / Cookies / Accessibility | `/integritetspolicy/` `/cookies/` `/tillganglighet/` | `/en/privacy-policy/` `/en/cookies/` `/en/accessibility/` |
| Thank-you (no-JS form fallback, noindex) | `/tack/` | `/en/thank-you/` |

Slugs are defined once in `src/i18n/routes.ts`. If you change a published URL, add a 301 redirect
in `netlify.toml` / `vercel.json` at the same time.

## Edit company details

Open **`src/config/company.ts`**. The file is commented in Swedish so the company can edit it
directly. Empty values and empty lists are simply not shown.

- `PARENT_GROUP` (currently **Radiant Group**) appears in the home-page headline, the footer and
  as `parentOrganization` in the structured data. Add the group's website in `url` if it has one.
- Values that differ per language are written `{ sv: '…', en: '…' }`.
- Contact is **phone + contact form only**: no e-mail address, street address, opening hours,
  map or staff are shown. `PHONE` is written as it should be displayed; `tel:` links and the
  E.164 format for search engines are generated automatically. The same number is used for
  emergencies.
- **Placeholders never reach structured data**: a value still in `[brackets]` is left out of the
  JSON-LD. The business is marked up as a service-area business (region Skåne län, no street address).
- `KEY_FIGURES`, `CERTIFICATIONS`, `PROMISES`: only publish what is true. An empty list hides the
  section (home page figures, About page certifications).
- `SHOW_TENANTS_PAGE`: `false` keeps the tenants page out of menus, footer and sitemap (noindex).
  The fault report form is unaffected.

## Edit texts (sv/en)

All copy lives in **`src/i18n/sv.json`** and **`src/i18n/en.json`**. Both files must have the
same keys – the build fails (type error) if the English file is missing something.

Tokens in curly braces are filled in from `company.ts` at build time, so company data is never
duplicated in the copy:

`{companyName}` `{companyShortName}` `{parentGroup}` `{primaryCity}` `{serviceArea}` `{phone}`
`{orgNr}` `{formProvider}` `{year}` `{analyticsName}`

Every page has its own `seo.title` and `seo.description` (" | Solrik" is appended to titles
automatically). Keep titles ≲ 60 characters and descriptions ≲ 160 – `npm run qa` warns otherwise.

## Add projects, news and job ads

Create one Markdown file per language. The **same `translationKey`** links the Swedish and English
versions (for the language switcher and hreflang). An entry may exist in one language only.

### Project – `src/content/projects/sv/<slug>.md`

```yaml
---
title: "Stambyte i BRF Exempelgården"
description: "Ett–två meningar. Visas på kort, som ingress och som metabeskrivning."
location: "Malmö"
year: 2025
category: renovering          # nybyggnad | renovering | ombyggnad | förvaltning
client: "BRF Exempelgården"
contractType: "Totalentreprenad"   # optional
scope: "48 lägenheter"             # optional
translationKey: stambyte-exempelgarden
images:                            # first image = cover/hero
  - src: ../images/stambyte-1.jpg
    alt: "Gården efter projektet"
  - src: ../images/stambyte-2.jpg
    alt: "Nytt badrum"
order: 0          # optional: higher = earlier within the same year
example: false    # true = template: only built with PUBLIC_SHOW_EXAMPLES=true (then noindex, with a notice)
draft: false      # true = not built at all
---

Brödtext i Markdown (## mellanrubriker, listor, länkar …).
```

The URL is the file name: `projekt/stambyte-exempelgarden.md` → `/projekt/stambyte-exempelgarden/`.
Images go in `src/content/projects/images/` (any size; Astro creates AVIF/WebP and all widths).
The three most recent projects (by `year`, then `order`) appear on the home page. While there are no
projects, the home-page section is hidden and the Projects page is left out of the menus and sitemap
(same for News).

### News – `src/content/news/sv/<slug>.md`

```yaml
---
title: "Rubrik"
description: "Ingress / metabeskrivning."
date: 2026-11-01
updated: 2026-11-05        # optional
image: ../images/bild.jpg  # optional
imageAlt: "Beskrivning av bilden"
translationKey: min-nyhet
example: false
---
```

### Job ad – `src/content/jobs/sv/<slug>.md`

```yaml
---
title: "Snickare"
description: "En mening om tjänsten."
location: "Malmö"
extent: "Heltid, tillsvidare"
published: 2026-11-01
deadline: 2026-12-15      # optional – the ad disappears automatically on the next build after this date
contactEmail: "jobb@solrik.se"  # optional – without it, "Apply" goes to the contact form
translationKey: snickare-2026
example: false
---
```

Real job ads get `JobPosting` structured data (example ads don't).

**Example entries:** the files marked `example: true` in `src/content/*/` are templates and are not
published. Preview them with `PUBLIC_SHOW_EXAMPLES=true npm run dev`; copy one, set `example: false`
and write the real content to publish an entry.

## Swap images

Fixed-page images are configured in **`src/config/images.ts`** (hero, BRF, home "local" section,
about, careers, the four service images). Project and news images are set in each Markdown file.

**Current photos are stock images from [Pexels](https://www.pexels.com)** (free licence, no credit
required – none is shown; `src/config/photo-credits.json` records the source of each). Replace them
with your own project photography over time – real photos of your own buildings build far more trust.

### Use your own photo

1. Save it over the file in `src/assets/images/` (e.g. `hero.jpg`; JPG/PNG/WebP, ideally ≥ 2000 px
   wide), **or** add a new file and change the import in `images.ts`.
2. Update `alt` (sv + en).

### Pick other stock photos from Pexels

The script `scripts/pexels.mjs` (needs `PEXELS_API_KEY` in `.env`) searches Pexels per slot:

```bash
npm run photos -- search hero      # contact sheet in .pexels-cache/sheet-hero.jpg (numbered candidates)
# put the chosen photo id in "pick" for that slot in scripts/pexels-slots.json (change "query" to search again)
npm run photos -- download         # downloads every picked photo + writes src/config/photo-credits.json
```

Astro generates responsive AVIF/WebP versions, `srcset`, width/height (no layout shift) and lazy
loading. The hero and the first image on each page load with high priority. The Open Graph image
(1200×630) is cropped automatically from the page's main image.

`npm run placeholders` only regenerates the downloadable PDFs – never photos. The logo and favicons
come from `npm run brand -- <transparent-logo.png>`.

## Forms

Two forms: **Offertförfrågan / contact** (contact page) and **Felanmälan** (fault report). Both have accessible
validation, an error summary, honeypot spam protection, file upload (max 8 MB) and success/error
states. Without JavaScript they still post normally.

Choose the provider with environment variables (see `.env.example`):

| `PUBLIC_FORM_PROVIDER` | Setup |
|---|---|
| `netlify` (default) | Nothing to configure. Netlify detects the forms on deploy (`offertforfragan`, `felanmalan`). In the Netlify UI: **Forms → Form notifications** → add the e-mail address(es) to notify. Spam is filtered with the `bot-field` honeypot. |
| `formspree` | Create two forms at formspree.io and set `PUBLIC_FORM_ENDPOINT_QUOTE` and `PUBLIC_FORM_ENDPOINT_FAULT_REPORT` to `https://formspree.io/f/…`. File uploads require a paid Formspree plan. |
| `custom` | Any endpoint that accepts `multipart/form-data` and returns 2xx (e.g. an n8n Webhook node). Set the two endpoint variables. The endpoint must allow the site's origin (CORS), otherwise the browser blocks the response and the form shows its error state. With n8n, use the production `/webhook/…` URL – `/webhook-test/…` only works while the editor is listening. |

Field names are identical in both languages, so Swedish and English submissions arrive in the same
form. Dropdown values are always sent in Swedish. A hidden `language` field tells you which
version was used. With `formspree` or `custom`, a hidden `form` field (`quote` or `faultReport`)
tells you which form was sent, so both can share one endpoint.

## Analytics and cookies

Default: **no analytics, no cookies, no banner**. The cookie page then states that no cookies are
used.

To enable privacy-friendly analytics set `PUBLIC_ANALYTICS_PROVIDER=plausible` (plus
`PUBLIC_PLAUSIBLE_DOMAIN`) or `umami` (plus `PUBLIC_UMAMI_WEBSITE_ID`, `PUBLIC_UMAMI_SRC`). A consent
banner then appears and the script loads only after the visitor accepts. The choice is stored in
`localStorage`, and the cookie page gets a "change my choice" button. Set
`PUBLIC_ANALYTICS_REQUIRE_CONSENT=false` only if you have confirmed that your cookieless setup does
not require consent.

## SEO features

- Per-page `<title>`, meta description, self-referencing canonical, Open Graph/Twitter cards with a
  1200×630 image, `<html lang>`.
- Translated slugs, reciprocal `hreflang` (sv, en, x-default → Swedish) and a language switcher that
  links to the same page in the other language. No automatic language redirects.
- Local SEO: service area (Skåne) in titles and copy, name and phone identical everywhere (from
  `company.ts`), `tel:` links. Marked up as a service-area business (no street address).
- JSON-LD graph on every page: `GeneralContractor` (the company) + `ProfessionalService`/
  `RealEstateAgent` (property-management arm) + `WebSite` + `WebPage` + `BreadcrumbList`;
  `Service` + `FAQPage` on service pages and the BRF page; `FAQPage` on the tenants page;
  `NewsArticle`, `JobPosting` and project data on detail pages.
- `/sitemap.xml` (canonical, indexable URLs only, with hreflang alternates and real `lastmod`) and
  `/robots.txt`.
- Preview/branch deploys are automatically `noindex` + `Disallow: /` (Netlify `CONTEXT`,
  Vercel `VERCEL_ENV`, or `PUBLIC_NOINDEX=true`). Production is indexable.
- Breadcrumbs everywhere below the home page; every page ≤ 3 clicks from home.

See **[SEO-HANDOFF.md](SEO-HANDOFF.md)** for the SEO specialist.

## Deploy

### Netlify (recommended – forms work out of the box)

1. Push the project to a Git repository and choose **Add new site → Import an existing project**.
2. Build command `npm run build`, publish directory `dist` (already in `netlify.toml`).
3. **Site configuration → Environment variables:** set `PUBLIC_SITE_URL` to the final address,
   e.g. `https://www.foretaget.se` (Netlify's `URL` is used as a fallback).
4. Add the custom domain and enable HTTPS. Choose www or apex as primary – Netlify 301-redirects the
   other.
5. **Forms → Form notifications:** add e-mail notifications for both forms.

`public/_headers` sets security headers (HSTS, nosniff, referrer policy) and long caching for
hashed assets.

### Vercel

Import the repository; `vercel.json` sets the build, trailing slashes, headers and redirects. Set
`PUBLIC_SITE_URL` and choose `formspree` or `custom` forms (Netlify Forms only works on Netlify).

### Any static host

`npm run build` and upload `dist/`. Configure the host to serve `404.html` with status 404 and to
redirect URLs without a trailing slash to the slash version.

## Quality checks

Verified at handover (see SEO-HANDOFF.md for the full numbers):

- `astro check`: 0 errors, 0 warnings, 0 hints.
- `npm run qa`: 0 errors (remaining warnings are the example entries' titles).
- Browser tests (headless Chrome, 47 pages at 360 px and 1440 px): no horizontal overflow, no
  console errors; mobile menu, project filter, both forms (validation, error summary, success,
  honeypot) pass.
- Lighthouse mobile – see SEO-HANDOFF.md.

Re-run Lighthouse after replacing the placeholder images with real photos: keep the hero photo
around 2400 px wide; Astro handles the rest.

## Change colours, fonts and logo

- **Colours:** `src/styles/global.css`, the `--c-*` variables under `:root`. The site is
  **light-only** by design (it stays light even when a visitor's device is in dark mode). The
  accent is `--c-accent` (deep forest green, `#1e6b47`), with `--c-accent-soft` for light sage
  panels. Check contrast (≥ 4.5:1 for text) if you change it.
- **Spacing:** section padding lives in `src/components/ui/Section.astro`, page margins in the
  `container-site` utility in `global.css`.
- **Fonts:** Inter (body) and Inter Tight (headings) are self-hosted from `src/assets/fonts/` via
  Astro's font API (`astro.config.mjs`). Swap the `.woff2` files and names there.
- **Logo:** the header shows the symbol from the logo artwork (`src/assets/logo/solrik-symbol.png`)
  with the name "Solrik" set in the heading font (Inter Tight) beside it – see
  `src/components/layout/Logo.astro`. The dark footer uses the text wordmark (`Wordmark.astro`).
  To update everything from a new transparent logo PNG: `npm run brand -- path/to/logo.png` (writes
  the symbol, the full logo, `public/logo.png` for structured data, `favicon.ico`,
  `favicon-96x96.png` and `apple-touch-icon.png`).
