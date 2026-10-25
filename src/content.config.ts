/**
 * Content collections. One Markdown file per entry and language:
 *   src/content/projects/sv/<slug>.md   →  /projekt/<slug>/
 *   src/content/projects/en/<slug>.md   →  /en/projects/<slug>/
 * The same `translationKey` in both files links the two language versions.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { PROJECT_CATEGORIES } from '~/i18n/routes';

/** Shared editorial fields. */
const editorial = {
  /** Links the sv and en versions of the same entry. */
  translationKey: z.string(),
  /** Example content: not built unless PUBLIC_SHOW_EXAMPLES=true, then shown with a notice and noindex. */
  example: z.boolean().default(false),
  /** Drafts are not built at all. */
  draft: z.boolean().default(false),
  /** Optional SEO overrides (default: title / description). */
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
};

const projects = defineCollection({
  loader: glob({ pattern: '{sv,en}/**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** One or two sentences: used on cards, as meta description and lead. */
      description: z.string(),
      location: z.string(),
      year: z.number().int(),
      category: z.enum(PROJECT_CATEGORIES),
      client: z.string(),
      /** Entreprenadform, e.g. "Totalentreprenad". */
      contractType: z.string().optional(),
      /** Omfattning, e.g. "48 lägenheter, 3 600 m² BTA". */
      scope: z.string().optional(),
      /** The first image is the hero/cover image. */
      images: z
        .array(z.object({ src: image(), alt: z.string() }))
        .min(1),
      /** Higher numbers appear first among projects from the same year. */
      order: z.number().default(0),
      ...editorial,
    }),
});

const news = defineCollection({
  loader: glob({ pattern: '{sv,en}/**/*.md', base: './src/content/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      ...editorial,
    }),
});

const jobs = defineCollection({
  loader: glob({ pattern: '{sv,en}/**/*.md', base: './src/content/jobs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    location: z.string(),
    /** Omfattning, e.g. "Heltid, tillsvidare". */
    extent: z.string(),
    published: z.coerce.date(),
    /** Ads are hidden automatically after this date. */
    deadline: z.coerce.date().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().optional(),
    ...editorial,
  }),
});

export const collections = { projects, news, jobs };
