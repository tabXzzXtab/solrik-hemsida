/// <reference types="astro/client" />

/** Injected by astro.config.mjs from the deploy environment. */
declare const __NOINDEX__: boolean;

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_NOINDEX?: string;
  readonly PUBLIC_FORM_PROVIDER?: 'netlify' | 'formspree' | 'custom';
  readonly PUBLIC_FORM_ENDPOINT_QUOTE?: string;
  readonly PUBLIC_FORM_ENDPOINT_FAULT_REPORT?: string;
  readonly PUBLIC_ANALYTICS_PROVIDER?: 'none' | 'plausible' | 'umami';
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly PUBLIC_PLAUSIBLE_SRC?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
  readonly PUBLIC_UMAMI_SRC?: string;
  readonly PUBLIC_ANALYTICS_REQUIRE_CONSENT?: string;
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
  readonly PUBLIC_BING_SITE_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
