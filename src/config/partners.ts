/**
 * Samarbetspartners – visas på sidan "Våra samarbetspartners" och på startsidan.
 * Texterna finns i src/i18n/sv.json och en.json under partners.items.<id>.
 * url: partnerns webbplats (tom = ingen länk).
 * weight: justerar logotypens storlek så att alla väger lika tungt visuellt (1 = neutral).
 */
import lansforsakringar from '~/assets/partners/lansforsakringar.png';
import akea from '~/assets/partners/akea.png';
import radiantGroup from '~/assets/partners/radiant-group.png';

export const PARTNERS = [
  { id: 'lansforsakringar', name: 'Länsförsäkringar AB', logo: lansforsakringar, url: 'https://www.lansforsakringar.se', weight: 0.8 },
  { id: 'akea', name: 'Akea AB', logo: akea, url: '', weight: 1.15 },
  { id: 'radiant', name: 'Radiant Group AB', logo: radiantGroup, url: '', weight: 1.25 },
] as const;
