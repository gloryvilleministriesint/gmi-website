// Digital Library: search, filters, sort and "load more" over the server-rendered message cards.
// State is kept in the URL (?q=&speaker=&topic=&series=&format=&sort=) so results can be shared.

const PAGE = 9;
const KEYS = ['speaker', 'topic', 'series', 'format', 'sort'] as const;
type Key = (typeof KEYS)[number];

export function initLibrary() {
  const root = document.querySelector<HTMLElement>('[data-library]');
  if (!root) return;
  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-item]'));
  const count = root.querySelector<HTMLElement>('[data-count]')!;
  const empty = root.querySelector<HTMLElement>('[data-empty]')!;
  const more = root.querySelector<HTMLButtonElement>('[data-more]')!;
  const status = root.querySelector<HTMLElement>('[data-search-status]')!;
  const statusText = root.querySelector<HTMLElement>('[data-search-text]')!;
  const selects = Object.fromEntries(KEYS.map((k) => [k, root.querySelector<HTMLSelectElement>(`[data-f="${k}"]`)!])) as Record<Key, HTMLSelectElement>;
  const searchForm = document.querySelector<HTMLFormElement>('[data-lib-search]');
  const searchInput = searchForm?.querySelector<HTMLInputElement>('input[name=q]');
  const seriesBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-series-pick]'));

  const params = new URLSearchParams(location.search);
  const state = { q: params.get('q')?.trim() ?? '', shown: PAGE } as { q: string; shown: number } & Partial<Record<Key, string>>;
  for (const k of KEYS) {
    const v = params.get(k) ?? '';
    if ([...selects[k].options].some((o) => o.value === v)) { state[k] = v; selects[k].value = v; }
  }
  if (searchInput) searchInput.value = state.q;

  const matches = (el: HTMLElement) => {
    const d = el.dataset;
    if (state.speaker && d.speaker !== state.speaker) return false;
    if (state.topic && !(d.topics ?? '').split('|').includes(state.topic)) return false;
    if (state.series && d.series !== state.series) return false;
    if (state.format && !(d.format ?? '').split(' ').includes(state.format)) return false;
    if (state.q) {
      const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.every((w) => (d.text ?? '').includes(w))) return false;
    }
    return true;
  };

  function syncUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    for (const k of KEYS) if (state[k]) p.set(k, state[k]!);
    const qs = p.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
  }

  function render() {
    const sorted = [...items].sort((a, b) => {
      const diff = Date.parse(b.dataset.date!) - Date.parse(a.dataset.date!);
      return state.sort === 'oldest' ? -diff : diff;
    });
    sorted.forEach((el) => grid.appendChild(el));
    const hits = sorted.filter(matches);
    sorted.forEach((el) => (el.hidden = true));
    hits.slice(0, state.shown).forEach((el) => (el.hidden = false));

    const shown = Math.min(state.shown, hits.length);
    count.textContent = hits.length
      ? `Showing ${shown} of ${hits.length} ${hits.length === 1 ? 'message' : 'messages'}`
      : 'No messages match';
    empty.hidden = hits.length > 0;
    more.hidden = hits.length <= state.shown;
    status.hidden = !state.q;
    statusText.textContent = state.q ? `Results for “${state.q}”` : '';
    seriesBtns.forEach((b) => b.hasAttribute('aria-pressed') && b.setAttribute('aria-pressed', String(state.series === b.dataset.seriesPick)));
    syncUrl();
  }

  const reset = () => { state.shown = PAGE; };
  const scrollToResults = () => root.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

  for (const k of KEYS) selects[k].addEventListener('change', () => { state[k] = selects[k].value; reset(); render(); });

  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = searchInput?.value.trim() ?? '';
    reset(); render(); scrollToResults();
  });

  seriesBtns.forEach((b) => b.addEventListener('click', () => {
    const name = b.dataset.seriesPick!;
    state.series = state.series === name && b.hasAttribute('aria-pressed') ? '' : name;
    selects.series.value = state.series ?? '';
    reset(); render(); scrollToResults();
  }));

  const clearAll = () => {
    state.q = '';
    if (searchInput) searchInput.value = '';
    for (const k of KEYS) { state[k] = ''; selects[k].value = ''; }
    reset(); render();
  };
  root.querySelectorAll('[data-clear-all]').forEach((b) => b.addEventListener('click', clearAll));
  root.querySelector('[data-clear-search]')?.addEventListener('click', () => {
    state.q = ''; if (searchInput) searchInput.value = ''; reset(); render();
  });

  more.addEventListener('click', () => {
    const firstNew = state.shown;
    state.shown += PAGE;
    render();
    // Move focus to the first newly shown card so keyboard users continue from there.
    grid.querySelectorAll<HTMLElement>('[data-item]:not([hidden])')[firstNew]?.querySelector<HTMLElement>('a')?.focus();
  });

  render();
  if (state.q || KEYS.some((k) => state[k])) scrollToResults();
}
