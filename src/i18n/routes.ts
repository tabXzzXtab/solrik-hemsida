/**
 * Central URL map. Every internal link, hreflang pair and the sitemap are built
 * from here, so a slug is only ever written once.
 *
 * Every path is prefixed with the site's base path, so the same build works on a
 * custom domain ("/tjanster/") and on a github.io project URL ("/solrik-hemsida/tjanster/").
 */

/** "" on a domain root, "/solrik-hemsida" on the github.io project URL. */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Prefix a root-relative path ("/dokument/x.pdf") with the base path. */
export function withBase(path: string): string {
  return `${BASE}${path}`;
}

export const LANGS = ['sv', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'sv';

/** Display order everywhere (menus, cards, footer): property management first. */
export const SERVICE_KEYS = ['fastighetsforvaltning', 'fastighetsdrift', 'renovering', 'nybyggnation'] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

export const PROJECT_CATEGORIES = ['nybyggnad', 'renovering', 'ombyggnad', 'förvaltning'] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

const ROUTES = {
  home: { sv: '/', en: '/en/' },
  services: { sv: '/tjanster/', en: '/en/services/' },
  brf: { sv: '/bostadsrattsforeningar/', en: '/en/housing-cooperatives/' },
  projects: { sv: '/projekt/', en: '/en/projects/' },
  tenants: { sv: '/hyresgast/', en: '/en/tenants/' },
  faultReport: { sv: '/hyresgast/felanmalan/', en: '/en/tenants/report-a-fault/' },
  about: { sv: '/om-oss/', en: '/en/about/' },
  news: { sv: '/nyheter/', en: '/en/news/' },
  careers: { sv: '/karriar/', en: '/en/careers/' },
  contact: { sv: '/kontakt/', en: '/en/contact/' },
  privacy: { sv: '/integritetspolicy/', en: '/en/privacy-policy/' },
  cookies: { sv: '/cookies/', en: '/en/cookies/' },
  accessibility: { sv: '/tillganglighet/', en: '/en/accessibility/' },
  thanks: { sv: '/tack/', en: '/en/thank-you/' },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteKey = keyof typeof ROUTES;

/** Static routes that are indexable (used by the sitemap). */
export const INDEXABLE_ROUTES: RouteKey[] = [
  'home', 'services', 'brf', 'projects', 'tenants', 'faultReport', 'about',
  'news', 'careers', 'contact', 'privacy', 'cookies', 'accessibility',
];

export const SERVICE_SLUGS: Record<ServiceKey, Record<Lang, string>> = {
  nybyggnation: { sv: 'nybyggnation', en: 'new-construction' },
  renovering: { sv: 'renovering', en: 'renovation' },
  fastighetsforvaltning: { sv: 'fastighetsforvaltning', en: 'property-management' },
  fastighetsdrift: { sv: 'fastighetsdrift', en: 'property-maintenance' },
};

export function routePath(key: RouteKey, lang: Lang): string {
  return withBase(ROUTES[key][lang]);
}

export function servicePath(key: ServiceKey, lang: Lang): string {
  return `${routePath('services', lang)}${SERVICE_SLUGS[key][lang]}/`;
}

export function serviceKeyFromSlug(slug: string, lang: Lang): ServiceKey | undefined {
  return SERVICE_KEYS.find((key) => SERVICE_SLUGS[key][lang] === slug);
}

export type CollectionName = 'projects' | 'news' | 'jobs';
const COLLECTION_BASE: Record<CollectionName, RouteKey> = { projects: 'projects', news: 'news', jobs: 'careers' };

export function entryPath(collection: CollectionName, slug: string, lang: Lang): string {
  return `${routePath(COLLECTION_BASE[collection], lang)}${slug}/`;
}

/**
 * Resolve a route reference written in the copy files, e.g.
 * "contact", "service:renovering" or "tenants#faq".
 */
export function resolveRoute(ref: string, lang: Lang): string {
  const [base, hash] = ref.split('#');
  let path: string;
  if (base.startsWith('service:')) {
    path = servicePath(base.slice('service:'.length) as ServiceKey, lang);
  } else if (base in ROUTES) {
    path = routePath(base as RouteKey, lang);
  } else {
    throw new Error(`Unknown route reference "${ref}" in copy file`);
  }
  return hash ? `${path}#${hash}` : path;
}

/** hreflang alternates for a static route. */
export function routeAlternates(key: RouteKey): Partial<Record<Lang, string>> {
  return { sv: routePath(key, 'sv'), en: routePath(key, 'en') };
}

export function serviceAlternates(key: ServiceKey): Partial<Record<Lang, string>> {
  return { sv: servicePath(key, 'sv'), en: servicePath(key, 'en') };
}
