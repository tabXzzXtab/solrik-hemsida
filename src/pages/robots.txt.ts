import type { APIRoute } from 'astro';
import { NOINDEX } from '~/config/site';
import { withBase } from '~/i18n/routes';

/**
 * Production: everything crawlable (incl. SemrushBot/AhrefsBot for SEO audits).
 * Preview/branch deploys (or PUBLIC_NOINDEX=true): block all crawling.
 * AI crawlers are allowed by default; add explicit rules here if the company decides otherwise.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(withBase('/sitemap.xml'), site).href;
  const body = NOINDEX
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
