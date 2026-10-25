// Filters [data-project-item] elements by category and year, and keeps the
// state in the query string (?category=…&year=…) so filtered views can be shared.
const root = document.querySelector<HTMLElement>('[data-project-filter]');

if (root) {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-category-filter]'));
  const select = root.querySelector<HTMLSelectElement>('[data-year-filter]');
  const count = root.querySelector<HTMLElement>('[data-filter-count]');
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-project-item]'));
  const empty = document.querySelector<HTMLElement>('[data-filter-empty]');
  const reset = document.querySelector<HTMLButtonElement>('[data-filter-reset]');

  const params = new URLSearchParams(window.location.search);
  let category = params.get('category') ?? 'all';
  let year = params.get('year') ?? 'all';
  if (!buttons.some((b) => b.dataset.categoryFilter === category)) category = 'all';
  if (select && !Array.from(select.options).some((o) => o.value === year)) year = 'all';

  const apply = () => {
    let visible = 0;
    for (const item of items) {
      const show = (category === 'all' || item.dataset.category === category) && (year === 'all' || item.dataset.year === year);
      item.hidden = !show;
      if (show) visible++;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category));
    if (select) select.value = year;
    if (count) count.textContent = (count.dataset.template ?? '{count}').replace('{count}', String(visible));
    if (empty) empty.hidden = visible > 0;

    const url = new URL(window.location.href);
    if (category === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', category);
    if (year === 'all') url.searchParams.delete('year');
    else url.searchParams.set('year', year);
    window.history.replaceState(null, '', url);
  };

  for (const button of buttons) {
    button.addEventListener('click', () => {
      category = button.dataset.categoryFilter ?? 'all';
      apply();
    });
  }
  select?.addEventListener('change', () => {
    year = select.value;
    apply();
  });
  reset?.addEventListener('click', () => {
    category = 'all';
    year = 'all';
    apply();
    buttons[0]?.focus();
  });

  root.hidden = false;
  apply();
}
