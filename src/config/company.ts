/**
 * ============================================================================
 *  FÖRETAGSUPPGIFTER – den enda filen du behöver redigera för företagsdata.
 * ============================================================================
 *
 *  Allt som står inom [hakparenteser] är en platshållare som ska bytas ut.
 *  Hitta alla platshållare:  sök efter "[" i den här filen.
 *
 *  Regler:
 *   - Hitta aldrig på siffror, kunder, certifieringar eller personer.
 *     Lämna platshållaren kvar tills ni har riktiga uppgifter.
 *   - Uppgifter som fortfarande är platshållare tas automatiskt bort ur
 *     strukturerad data (JSON-LD) så att Google aldrig får felaktiga värden.
 *   - Texter som skiljer sig mellan språken skrivs som { sv: '…', en: '…' }.
 *
 *  Projekt, nyheter och lediga jobb redigeras inte här utan som Markdown-filer
 *  i src/content/ (en Markdown-fil per post och språk).
 */

import type { Lang } from '~/i18n/routes';

export type Localized<T = string> = Record<Lang, T>;

/* ---------------------------------------------------------------------------
 *  Grunduppgifter
 * ------------------------------------------------------------------------ */

/** Fullständigt juridiskt namn (visas i sidfot, villkor och strukturerad data). */
export const COMPANY_NAME = 'Solrik AB';

/** Kort namn för ordmärket i sidhuvudet och i sidtitlar ("Kontakt | Solrik"). */
export const COMPANY_SHORT_NAME = 'Solrik';

/** Koncernen företaget ingår i. Visas i startsidans rubrik, sidfoten och strukturerad data. */
export const PARENT_GROUP = {
  name: 'Radiant Group',
  /** Koncernens webbplats (valfritt), t.ex. 'https://www.radiantgroup.se' */
  url: '',
};

/** Organisationsnummer, format XXXXXX-XXXX. */
export const ORG_NR = '559200-5077';

/** Företagets adress. Visas i sidfoten och på kontaktsidan. */
export const ADDRESS = { street: 'Aspögatan 1', postalCode: '211 54', city: 'Malmö' };

/** Län och land för strukturerad data. */
export const REGION = { name: 'Skåne län', country: 'SE' };

/**
 * Styrelsens säte enligt registreringsbeviset (kommun), t.ex. 'Malmö'.
 * Ska stå på webbplatsen – fyll i så visas det i sidfoten. Tom = visas inte.
 */
export const REGISTERED_OFFICE = '';

/** Godkänd för F-skatt – sätt till true när det är bekräftat, så visas det i sidfoten. */
export const F_SKATT = false;

/** Verksamhetsområde i löptext. */
export const SERVICE_AREA: Localized = {
  sv: 'Skåne län',
  en: 'Skåne County',
};

/* ---------------------------------------------------------------------------
 *  Kontakt – kontaktformuläret, och jouren för akuta fel
 * ------------------------------------------------------------------------ */

/**
 * Jourens telefonnummer för akuta fel, t.ex. '040-12 34 56'. Alla röda Jour-knappar leder
 * till sidan Jour, som visar numret och en ring-knapp. Tom = jourlinjen är inte öppen än.
 */
export const EMERGENCY_PHONE = '';

/** Sociala medier. Tom = visas inte. */
export const LINKEDIN_URL = '';
export const INSTAGRAM_URL = '';

/** Extern hyresgästportal ("Mina sidor"). Tom = visas inte. */
export const TENANT_PORTAL_URL = '';

/* ---------------------------------------------------------------------------
 *  Sidor
 * ------------------------------------------------------------------------ */

/**
 * Sidan "Hyresgäst & boende". false = dold: borta ur menyer, sidfot och
 * sitemap, och sidan får noindex. Felanmälan fungerar som vanligt.
 */
export const SHOW_TENANTS_PAGE = false;

/* ---------------------------------------------------------------------------
 *  Företagsfakta
 * ------------------------------------------------------------------------ */

/**
 * Certifieringar och medlemskap – endast sådant ni faktiskt har.
 * Tom lista = avsnittet på Om oss visas inte. Exempel: ['ID06', 'Byggföretagen']
 */
export const CERTIFICATIONS: string[] = [];

/**
 * Nyckeltal – fyll i riktiga värden, hitta aldrig på siffror.
 * Tom lista = avsnittet "i siffror" på startsidan visas inte. Exempel:
 *   { label: { sv: 'Fastigheter i förvaltning', en: 'Properties under management' }, value: '25', unit: { sv: 'st', en: '' } }
 */
export const KEY_FIGURES: Array<{ label: Localized; value: string; unit: Localized }> = [];

/**
 * Löften som visas på startsidan och tjänstesidorna ("Det här kan du räkna med").
 * Ta bort ett löfte om det inte stämmer för er.
 */
export const PROMISES: Array<{ title: Localized; text: Localized }> = [
  {
    title: { sv: 'Fast pris', en: 'Fixed price' },
    text: { sv: 'Ni vet vad det kostar innan vi börjar.', en: 'You know the cost before we start.' },
  },
  {
    title: { sv: 'Garanti på utfört arbete', en: 'Warranty on our work' },
    text: { sv: 'Enligt branschens standardavtal, från slutbesiktning.', en: 'Under standard industry contracts, from final inspection.' },
  },
  {
    title: { sv: 'En avtalspart', en: 'One contract' },
    text: { sv: 'Vi samordnar alla hantverkare i projektet.', en: 'We coordinate every trade on the project.' },
  },
  {
    title: { sv: 'Vi tar arbetsmiljöansvaret', en: 'We take on site safety' },
    text: { sv: 'Som BAS-P och BAS-U när uppdraget kräver det.', en: 'As safety coordinator (BAS-P/BAS-U) when required.' },
  },
  {
    title: { sv: 'Akuta fel går först', en: 'Emergencies come first' },
    text: { sv: 'Vid akuta fastighetsproblem kontaktar du jouren.', en: 'For urgent property problems, contact the on-call team.' },
  },
];

/**
 * Nedladdningsbara dokument (PDF i public/dokument/). Byt fil genom att spara
 * över filen med samma namn, eller ändra sökvägen här.
 */
export const DOCUMENTS = {
  /** "Så arbetar vi" – på Om oss under "Uppfyller vi kraven?". */
  howWeWork: { sv: '/dokument/sa-arbetar-vi.pdf', en: '/dokument/how-we-work.pdf' },
  tenantForms: [
    { file: '/dokument/blankett-andrahandsuthyrning.pdf', title: { sv: 'Ansökan om andrahandsuthyrning', en: 'Application to sublet (in Swedish)' } },
    { file: '/dokument/blankett-uppsagning.pdf', title: { sv: 'Uppsägning av lägenhet', en: 'Notice of termination (in Swedish)' } },
    { file: '/dokument/blankett-andring-i-lagenhet.pdf', title: { sv: 'Ansökan om ändring i lägenhet', en: 'Application for alterations (in Swedish)' } },
    { file: '/dokument/blankett-parkering.pdf', title: { sv: 'Ansökan om parkeringsplats', en: 'Parking space application (in Swedish)' } },
  ],
};

/**
 * PROJECTS hanteras som innehållssamling i src/content/projects/ (en Markdown-fil
 * per projekt och språk) eftersom varje projekt har en egen sida med bilder.
 * Frontmatter-fälten motsvarar { title, location, year, category, client,
 * description, images[] } – se src/content.config.ts.
 */
