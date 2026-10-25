// Mobile/tablet menu disclosure. Without JS the menu button does nothing, but
// every destination is also reachable from the footer and page content.
const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const panel = document.getElementById('mobile-menu');

if (toggle && panel) {
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    document.documentElement.classList.toggle('overflow-hidden', open);
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  panel.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  });

  window.matchMedia('(min-width: 80rem)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
