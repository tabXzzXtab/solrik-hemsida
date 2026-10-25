/**
 * Technical settings read from environment variables (set as repository variables for the GitHub Pages build).
 * Company data lives in ./company.ts, not here.
 */

const env = import.meta.env;

const pick = <T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(value ?? '') ? (value as T) : fallback;

/** True on preview/branch deploys or when PUBLIC_NOINDEX=true (set in astro.config.mjs). */
export const NOINDEX: boolean = __NOINDEX__;

export type FormProvider = 'netlify' | 'formspree' | 'custom';
export type FormName = 'quote' | 'faultReport';

export const FORM_PROVIDER: FormProvider = pick(env.PUBLIC_FORM_PROVIDER, ['netlify', 'formspree', 'custom'], 'custom');

export const FORM_ENDPOINTS: Record<FormName, string> = {
  quote: env.PUBLIC_FORM_ENDPOINT_QUOTE ?? '',
  faultReport: env.PUBLIC_FORM_ENDPOINT_FAULT_REPORT ?? '',
};

/** Form names as registered in Netlify Forms (shared by both languages). */
export const NETLIFY_FORM_NAMES: Record<FormName, string> = {
  quote: 'offertforfragan',
  faultReport: 'felanmalan',
};

/**
 * Example projects, news and job ads (`example: true` in frontmatter) are left
 * out of the build unless PUBLIC_SHOW_EXAMPLES=true – handy for previewing the templates.
 */
export const SHOW_EXAMPLES = env.PUBLIC_SHOW_EXAMPLES === 'true';

/** Max total upload size. Netlify Forms accepts up to 8 MB per submission. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type AnalyticsProvider = 'none' | 'plausible' | 'umami';

export const ANALYTICS = {
  provider: pick<AnalyticsProvider>(env.PUBLIC_ANALYTICS_PROVIDER, ['none', 'plausible', 'umami'], 'none'),
  plausibleDomain: env.PUBLIC_PLAUSIBLE_DOMAIN ?? '',
  plausibleSrc: env.PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js',
  umamiWebsiteId: env.PUBLIC_UMAMI_WEBSITE_ID ?? '',
  umamiSrc: env.PUBLIC_UMAMI_SRC ?? '',
  /** Consent banner before loading analytics. Default true. */
  requireConsent: env.PUBLIC_ANALYTICS_REQUIRE_CONSENT !== 'false',
};

export const ANALYTICS_ENABLED = ANALYTICS.provider !== 'none';

export const VERIFICATION = {
  google: env.PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  bing: env.PUBLIC_BING_SITE_VERIFICATION ?? '',
};
