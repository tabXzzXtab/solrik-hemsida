// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/**
 * Where the site is served. The GitHub Pages workflow passes the values from
 * actions/configure-pages: the custom domain at its root once one is connected,
 * otherwise the github.io address under /<repo>/.
 */
const SITE_URL = process.env.SITE_ORIGIN || 'http://localhost:4321';
const BASE_PATH = process.env.SITE_BASE_PATH || '/';

/** PUBLIC_NOINDEX=true blocks indexing (e.g. for a staging copy). */
const NOINDEX = process.env.PUBLIC_NOINDEX === 'true';

const fontFallbacks = ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'];

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
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
