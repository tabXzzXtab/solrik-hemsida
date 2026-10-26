import sv from './sv.json';
import en from './en.json';
import type { Lang } from './routes';
import { ADDRESS, COMPANY_NAME, COMPANY_SHORT_NAME, ORG_NR, PARENT_GROUP, PRIMARY_CITY, SERVICE_AREA } from '~/config/company';
import { ANALYTICS, FORM_PROVIDER } from '~/config/site';
import { fill } from '~/lib/format';

export type Dict = typeof sv;

/** "Aspögatan 1, 211 54 Malmö" */
export const addressLine = `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}`;

/** Type check: the English file must have every key the Swedish file has. */
const enDict: Dict = en;

const ANALYTICS_NAMES = { none: '', plausible: 'Plausible Analytics', umami: 'Umami' } as const;
const FORM_PROVIDER_NAMES: Record<Lang, Record<typeof FORM_PROVIDER, string>> = {
  sv: { netlify: 'Netlify', formspree: 'Formspree', custom: 'vår formulärleverantör' },
  en: { netlify: 'Netlify', formspree: 'Formspree', custom: 'our form provider' },
};

/** Tokens available in every copy string, e.g. "{serviceArea}". */
export function globalVars(lang: Lang): Record<string, string> {
  return {
    companyName: COMPANY_NAME,
    companyShortName: COMPANY_SHORT_NAME,
    parentGroup: PARENT_GROUP.name,
    primaryCity: PRIMARY_CITY,
    serviceArea: SERVICE_AREA[lang],
    address: addressLine,
    orgNr: ORG_NR,
    formProvider: FORM_PROVIDER_NAMES[lang][FORM_PROVIDER],
    year: String(new Date().getFullYear()),
    analyticsName: ANALYTICS_NAMES[ANALYTICS.provider],
  };
}

function deepFill<T>(value: T, vars: Record<string, string>): T {
  if (typeof value === 'string') return fill(value, vars) as T;
  if (Array.isArray(value)) return value.map((item) => deepFill(item, vars)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepFill(v, vars)])) as T;
  }
  return value;
}

const cache = new Map<Lang, Dict>();

/** Copy for a language with company tokens already filled in. */
export function getDict(lang: Lang): Dict {
  let dict = cache.get(lang);
  if (!dict) {
    dict = deepFill(lang === 'sv' ? sv : enDict, globalVars(lang));
    cache.set(lang, dict);
  }
  return dict;
}

export const OTHER_LANG: Record<Lang, Lang> = { sv: 'en', en: 'sv' };
