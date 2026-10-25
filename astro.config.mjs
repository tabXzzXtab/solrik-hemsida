// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/**
 * Canonical origin. Set PUBLIC_SITE_URL in the hosting dashboard (or .env).
 * Netlify exposes its primary URL as `URL`, used as a fallback.
 */
const SITE_URL = process.env.PUBLIC_SITE_URL || process.env.URL || 'https://www.example.se';

/**
 * Preview and branch deploys must never be indexed. This is decided by the
 * environment, never by a flag in the code that could ship to production.
 */
const NOINDEX =
  process.env.PUBLIC_NOINDEX === 'true' ||
  ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT ?? '') ||
  process.env.VERCEL_ENV === 'preview';

const fontFallbacks = ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'];

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  i18n: {
    defaultLocale: 'sv',
    locales: ['sv', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-inter',
      fallbacks: fontFallbacks,
      options: {
        variants: [{ src: ['./src/assets/fonts/inter-latin-wght-normal.woff2'], weight: '100 900', style: 'normal' }],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Inter Tight',
      cssVariable: '--font-inter-tight',
      fallbacks: fontFallbacks,
      options: {
        variants: [{ src: ['./src/assets/fonts/inter-tight-latin-wght-normal.woff2'], weight: '100 900', style: 'normal' }],
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      __NOINDEX__: JSON.stringify(NOINDEX),
    },
  },
});
