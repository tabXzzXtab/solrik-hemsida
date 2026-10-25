// Analytics consent. The choice is stored in localStorage (not a cookie).
const KEY = 'analytics-consent';
const banner = document.getElementById('consent-banner');

const read = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const write = (value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
  } catch {
    /* storage unavailable: the banner simply shows again next visit */
  }
};

if (banner) {
  const { provider, src, domain, websiteId, requireConsent } = banner.dataset;
  let loaded = false;

  const load = () => {
    if (loaded || !src) return;
    loaded = true;
    const script = document.createElement('script');
    script.defer = true;
    script.src = src;
    if (provider === 'plausible' && domain) script.dataset.domain = domain;
    if (provider === 'umami' && websiteId) script.dataset.websiteId = websiteId;
    document.head.append(script);
  };

  const choice = read();
  if (requireConsent === 'false' || choice === 'granted') load();
  else if (!choice) banner.hidden = false;

  banner.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-consent]');
    if (!button) return;
    const value = button.dataset.consent === 'granted' ? 'granted' : 'denied';
    write(value);
    banner.hidden = true;
    if (value === 'granted') load();
  });

  // "Change my choice" button on the cookie page.
  document.querySelectorAll<HTMLButtonElement>('[data-consent-reset]').forEach((button) => {
    button.addEventListener('click', () => {
      write(null);
      banner.hidden = false;
      banner.querySelector<HTMLButtonElement>('[data-consent]')?.focus();
    });
  });
}
