/**
 * JSON-LD builders. One connected @graph per page; every value comes from
 * src/config/company.ts. Fields that are still placeholders are omitted so
 * search engines never receive "[…]" values.
 */
import {
  ADDRESS, COMPANY_NAME, COMPANY_SHORT_NAME, INSTAGRAM_URL, LINKEDIN_URL, ORG_NR, PARENT_GROUP, REGION, SERVICE_AREA,
} from '~/config/company';
import { servicePath, withBase, type Lang } from '~/i18n/routes';
import { isPlaceholder, isRealUrl } from './format';

type Node = Record<string, unknown>;

const LANG_TAG: Record<Lang, string> = { sv: 'sv-SE', en: 'en-GB' };

/** Drop undefined/empty values (and empty arrays/objects) recursively. */
function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined) as T;
  if (value && typeof value === 'object') {
    const out: Node = {};
    for (const [k, v] of Object.entries(value)) {
      const c = clean(v);
      if (c === undefined || c === null || c === '') continue;
      if (Array.isArray(c) && c.length === 0) continue;
      if (typeof c === 'object' && !Array.isArray(c) && Object.keys(c).length === 0) continue;
      out[k] = c;
    }
    return out as T;
  }
  return value;
}

const real = (v: string) => (isPlaceholder(v) ? undefined : v);

export const ids = (site: URL) => ({
  org: new URL(withBase('/#organization'), site).href,
  propertyManagement: new URL(withBase('/#property-management'), site).href,
  website: new URL(withBase('/#website'), site).href,
});

function businessCommon(lang: Lang) {
  return {
    address: {
      '@type': 'PostalAddress',
      streetAddress: ADDRESS.street,
      postalCode: ADDRESS.postalCode,
      addressLocality: ADDRESS.city,
      addressRegion: REGION.name,
      addressCountry: REGION.country,
    },
    areaServed: real(SERVICE_AREA[lang]) ? { '@type': 'AdministrativeArea', name: SERVICE_AREA[lang] } : undefined,
  };
}

/** Site-wide nodes: the company (GeneralContractor), its property-management arm and the website. */
export function siteNodes(site: URL, lang: Lang, logo: { url: string; width: number; height: number }, imageUrl: string): Node[] {
  const id = ids(site);
  const sameAs = [LINKEDIN_URL, INSTAGRAM_URL].filter(isRealUrl);
  return clean([
    {
      '@type': 'GeneralContractor',
      '@id': id.org,
      name: COMPANY_SHORT_NAME,
      legalName: COMPANY_NAME,
      url: new URL(withBase('/'), site).href,
      logo: { '@type': 'ImageObject', ...logo },
      image: imageUrl,
      taxID: real(ORG_NR),
      parentOrganization: PARENT_GROUP.name
        ? { '@type': 'Organization', name: PARENT_GROUP.name, url: isRealUrl(PARENT_GROUP.url) ? PARENT_GROUP.url : undefined }
        : undefined,
      sameAs,
      ...businessCommon(lang),
      department: { '@id': id.propertyManagement },
    },
    {
      '@type': ['ProfessionalService', 'RealEstateAgent'],
      '@id': id.propertyManagement,
      name: lang === 'sv' ? `${COMPANY_SHORT_NAME} – Fastighetsförvaltning` : `${COMPANY_SHORT_NAME} – Property management`,
      url: new URL(servicePath('fastighetsforvaltning', lang), site).href,
      image: imageUrl,
      parentOrganization: { '@id': id.org },
      ...businessCommon(lang),
    },
    {
      '@type': 'WebSite',
      '@id': id.website,
      url: new URL(withBase('/'), site).href,
      name: COMPANY_SHORT_NAME,
      publisher: { '@id': id.org },
      inLanguage: [LANG_TAG.sv, LANG_TAG.en],
    },
  ]);
}

export function webPageNode(opts: {
  site: URL;
  url: string;
  name: string;
  description: string;
  lang: Lang;
  imageUrl?: string;
  hasBreadcrumb: boolean;
  type?: string;
}): Node {
  const id = ids(opts.site);
  return clean({
    '@type': opts.type ?? 'WebPage',
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    isPartOf: { '@id': id.website },
    about: { '@id': id.org },
    inLanguage: LANG_TAG[opts.lang],
    primaryImageOfPage: opts.imageUrl ? { '@type': 'ImageObject', url: opts.imageUrl } : undefined,
    breadcrumb: opts.hasBreadcrumb ? { '@id': `${opts.url}#breadcrumb` } : undefined,
  });
}

export function breadcrumbNode(url: string, site: URL, crumbs: Array<{ label: string; href: string }>): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: new URL(c.href, site).href,
    })),
  };
}

export function faqNode(url: string, items: Array<{ q: string; a: string }>): Node {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function serviceNode(opts: { site: URL; url: string; name: string; description: string; lang: Lang; provider?: 'org' | 'propertyManagement' }): Node {
  const id = ids(opts.site);
  return clean({
    '@type': 'Service',
    '@id': `${opts.url}#service`,
    name: opts.name,
    description: opts.description,
    serviceType: opts.name,
    url: opts.url,
    provider: { '@id': opts.provider === 'propertyManagement' ? id.propertyManagement : id.org },
    areaServed: real(SERVICE_AREA[opts.lang]) ? { '@type': 'AdministrativeArea', name: SERVICE_AREA[opts.lang] } : undefined,
    inLanguage: LANG_TAG[opts.lang],
  });
}

export function articleNode(opts: {
  site: URL; url: string; headline: string; description: string; lang: Lang;
  imageUrl?: string; published: Date; modified?: Date;
}): Node {
  const id = ids(opts.site);
  return clean({
    '@type': 'NewsArticle',
    '@id': `${opts.url}#article`,
    headline: opts.headline,
    description: opts.description,
    image: opts.imageUrl ? [opts.imageUrl] : undefined,
    datePublished: opts.published.toISOString(),
    dateModified: (opts.modified ?? opts.published).toISOString(),
    author: { '@id': id.org },
    publisher: { '@id': id.org },
    mainEntityOfPage: { '@id': `${opts.url}#webpage` },
    inLanguage: LANG_TAG[opts.lang],
  });
}

export function jobPostingNode(opts: {
  site: URL; url: string; title: string; description: string; lang: Lang;
  published: Date; deadline?: Date; location: string; extent: string;
}): Node {
  const id = ids(opts.site);
  return clean({
    '@type': 'JobPosting',
    '@id': `${opts.url}#job`,
    title: opts.title,
    description: opts.description,
    datePosted: opts.published.toISOString().slice(0, 10),
    validThrough: opts.deadline?.toISOString(),
    employmentType: /deltid|part/i.test(opts.extent) ? 'PART_TIME' : 'FULL_TIME',
    hiringOrganization: { '@id': id.org },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: real(opts.location), addressCountry: REGION.country },
    },
    inLanguage: LANG_TAG[opts.lang],
  });
}

export function projectNode(opts: { site: URL; url: string; name: string; description: string; lang: Lang; imageUrls: string[]; year: number }): Node {
  const id = ids(opts.site);
  return clean({
    '@type': 'CreativeWork',
    '@id': `${opts.url}#project`,
    name: opts.name,
    description: opts.description,
    image: opts.imageUrls,
    dateCreated: String(opts.year),
    creator: { '@id': id.org },
    inLanguage: LANG_TAG[opts.lang],
  });
}
