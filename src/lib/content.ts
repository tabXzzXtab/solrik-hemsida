import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_EXAMPLES } from '~/config/site';
import { entryPath, LANGS, type CollectionName, type Lang } from '~/i18n/routes';

type AnyEntry = CollectionEntry<CollectionName>;

/** "sv/exempel-stambyte" → "sv" */
export function entryLang(entry: { id: string }): Lang {
  const lang = entry.id.split('/')[0];
  if (!(LANGS as readonly string[]).includes(lang)) {
    throw new Error(`Content entry "${entry.id}" must live in a sv/ or en/ folder`);
  }
  return lang as Lang;
}

/** "sv/exempel-stambyte" → "exempel-stambyte" */
export function entrySlug(entry: { id: string }): string {
  return entry.id.split('/').slice(1).join('/');
}

/** Drafts never ship; examples only with PUBLIC_SHOW_EXAMPLES=true. */
const published = (data: { draft: boolean; example: boolean }) => !data.draft && (SHOW_EXAMPLES || !data.example);

export async function getProjects(lang: Lang) {
  const items = await getCollection('projects', (e) => published(e.data) && entryLang(e) === lang);
  return items.sort((a, b) => b.data.year - a.data.year || b.data.order - a.data.order || a.data.title.localeCompare(b.data.title));
}

export async function getNews(lang: Lang) {
  const items = await getCollection('news', (e) => published(e.data) && entryLang(e) === lang);
  return items.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Published job ads whose deadline has not passed (evaluated at build time). */
export async function getJobs(lang: Lang) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const items = await getCollection(
    'jobs',
    (e) => published(e.data) && entryLang(e) === lang && (!e.data.deadline || e.data.deadline >= today),
  );
  return items.sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}

const loaders = { projects: getProjects, news: getNews, jobs: getJobs } as const;

/** hreflang alternates for an entry: every language with the same translationKey. */
export async function entryAlternates(collection: CollectionName, entry: AnyEntry): Promise<Partial<Record<Lang, string>>> {
  const alternates: Partial<Record<Lang, string>> = {};
  for (const lang of LANGS) {
    const items: AnyEntry[] = await loaders[collection](lang);
    const match = items.find((item) => item.data.translationKey === entry.data.translationKey);
    if (match) alternates[lang] = entryPath(collection, entrySlug(match), lang);
  }
  return alternates;
}

/** Static paths for a detail route in one language. */
export async function entryStaticPaths<C extends CollectionName>(collection: C, lang: Lang) {
  const items = (await loaders[collection](lang)) as CollectionEntry<C>[];
  return items.map((entry) => ({ params: { slug: entrySlug(entry) }, props: { entry } }));
}
