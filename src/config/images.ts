/**
 * Image slots used on fixed pages.
 *
 * The current photos are stock images from Pexels (free to use without credit), chosen with
 * `node scripts/pexels.mjs` (see README → "Swap images"); ./photo-credits.json records where
 * each one came from. Replace them with your own project photography over time:
 *   1. Save your photo over the file in src/assets/images/ (or change the import below).
 *   2. Update `alt` (sv + en).
 *
 * Project and news images are set in each Markdown file's frontmatter instead.
 */
import type { ImageMetadata } from 'astro';
import type { Localized } from './company';
import type { ServiceKey } from '~/i18n/routes';

import hero from '~/assets/images/hero.jpg';
import nybyggnation from '~/assets/images/nybyggnation.jpg';
import renovering from '~/assets/images/renovering.jpg';
import fastighetsforvaltning from '~/assets/images/fastighetsforvaltning.jpg';
import fastighetsdrift from '~/assets/images/fastighetsdrift.jpg';
import brf from '~/assets/images/brf.jpg';
import local from '~/assets/images/hyresgast.jpg';
import about from '~/assets/images/om-oss.jpg';
import careers from '~/assets/images/karriar.jpg';

export interface ImageSlot {
  src: ImageMetadata;
  alt: Localized;
}

export const IMAGES = {
  hero: {
    src: hero,
    alt: { sv: 'Moderna flerbostadshus med balkonger och planterad gård', en: 'Modern apartment buildings with balconies and a planted courtyard' },
  },
  brf: {
    src: brf,
    alt: { sv: 'Ljust flerbostadshus med balkonger mot blå himmel', en: 'Bright apartment building with balconies against a blue sky' },
  },
  /** Home page, "Nära fastigheterna vi tar hand om". */
  local: {
    src: local,
    alt: { sv: 'Gröna flerbostadshus med trädgård och bänkar', en: 'Green apartment buildings with a garden and benches' },
  },
  about: {
    src: about,
    alt: { sv: 'Två medarbetare med hjälm och varselväst på en byggarbetsplats', en: 'Two colleagues in hard hats and hi-vis vests on a building site' },
  },
  careers: {
    src: careers,
    alt: { sv: 'Byggnadsarbetare borrar i virke på arbetsplatsen', en: 'Construction worker drilling timber on site' },
  },
} satisfies Record<string, ImageSlot>;

export const SERVICE_IMAGES: Record<ServiceKey, ImageSlot> = {
  fastighetsforvaltning: {
    src: fastighetsforvaltning,
    alt: { sv: 'Flerbostadshus med grön fasad och balkonger', en: 'Apartment building with a green facade and balconies' },
  },
  fastighetsdrift: {
    src: fastighetsdrift,
    alt: { sv: 'Gräsklippning med åkgräsklippare i en grön park', en: 'Groundskeeper mowing a lawn with a ride-on mower' },
  },
  renovering: {
    src: renovering,
    alt: { sv: 'Byggnadsställning vid fasadrenovering', en: 'Scaffolding during a facade renovation' },
  },
  nybyggnation: {
    src: nybyggnation,
    alt: { sv: 'Trähus under uppförande', en: 'Timber-frame house under construction' },
  },
};
