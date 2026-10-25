import { SHOW_TENANTS_PAGE } from '~/config/company';
import { getDict } from '~/i18n';
import { routePath, type Lang, type RouteKey } from '~/i18n/routes';
import { getNews, getProjects } from '~/lib/content';
import type { Crumb } from '~/components/layout/Breadcrumbs.astro';

/**
 * Pages left out of menus, the footer and the sitemap: the tenants page while
 * SHOW_TENANTS_PAGE is false, and the project and news archives while they are empty.
 */
export async function hiddenRoutes(lang: Lang): Promise<Set<RouteKey>> {
  const hidden = new Set<RouteKey>();
  if (!SHOW_TENANTS_PAGE) hidden.add('tenants');
  if (!(await getProjects(lang)).length) hidden.add('projects');
  if (!(await getNews(lang)).length) hidden.add('news');
  return hidden;
}

/** Breadcrumb trail starting at the home page. */
export function crumbs(lang: Lang, ...rest: Array<Crumb | RouteKey>): Crumb[] {
  const t = getDict(lang);
  const labels: Partial<Record<RouteKey, string>> = {
    services: t.nav.services,
    brf: t.nav.brf,
    projects: t.nav.projects,
    tenants: t.nav.tenants,
    about: t.nav.about,
    news: t.nav.news,
    careers: t.nav.careers,
    contact: t.nav.contact,
    faultReport: t.nav.faultReport,
  };
  return [
    { label: t.nav.home, href: routePath('home', lang) },
    ...rest.map((item) => (typeof item === 'string' ? { label: labels[item] ?? item, href: routePath(item, lang) } : item)),
  ];
}
