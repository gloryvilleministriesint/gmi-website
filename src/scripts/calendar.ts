// Church Calendar: month grid and list views, category and department filters,
// day panel and keyboard navigation. State lives in the URL so filtered views can be shared.
// Dates are handled as YYYY-MM-DD strings (Lagos time is fixed by the build), so no time-zone maths here.

interface CalItem {
  id: string; title: string; category: string; key: string; href: string;
  time: string | null; venue: string | null; sample: boolean; department?: string;
  from?: string; to?: string; weekday?: number; until?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL_KEYS = ['weekly', 'special', 'programme', 'church', 'department'];

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const fromIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const addDays = (s: string, n: number) => { const d = fromIso(s); d.setUTCDate(d.getUTCDate() + n); return toIso(d); };
const monthOf = (s: string) => s.slice(0, 7);
const longDay = (s: string) => { const d = fromIso(s); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const isRecurring = (i: CalItem) => i.weekday !== undefined;
function occursOn(i: CalItem, day: string) {
  if (isRecurring(i)) return fromIso(day).getUTCDay() === i.weekday && day >= (i.from ?? '') && (!i.until || day <= i.until);
  return day >= i.from! && day <= i.to!;
}
function nextOccurrence(i: CalItem, from: string) {
  let d = from < (i.from ?? '') ? i.from! : from;
  for (let n = 0; n < 7; n++, d = addDays(d, 1)) if (occursOn(i, d)) return d;
  return null;
}

export function initCalendar(root: HTMLElement) {
  const items: CalItem[] = JSON.parse(root.querySelector('[data-cal-items]')!.textContent || '[]');
  const today = root.dataset.today!;
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;

  const grid = $('[data-grid]');
  const panel = $('[data-day-panel]');
  const monthView = $('[data-month-view]');
  const listView = $('[data-list-view]');
  const label = $('[data-month-label]');
  const caption = $('[data-caption]');
  const deptWrap = $('[data-dept-wrap]');
  const deptSelect = $<HTMLSelectElement>('[data-dept]');
  const filterBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const viewBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-view]'));

  // ----- State (from the URL, with sensible defaults) -----
  const params = new URLSearchParams(location.search);
  const state = {
    view: params.get('view') ?? (matchMedia('(max-width: 760px)').matches ? 'list' : 'month'),
    month: /^\d{4}-\d{2}$/.test(params.get('month') ?? '') ? params.get('month')! : monthOf(today),
    cats: new Set((params.get('show') ?? ALL_KEYS.join(',')).split(',').filter((k) => ALL_KEYS.includes(k))),
    dept: params.get('dept') ?? '',
    day: '',
  };
  if (!state.cats.size) ALL_KEYS.forEach((k) => state.cats.add(k));
  state.day = monthOf(today) === state.month ? today : `${state.month}-01`;
  deptSelect.value = state.dept;

  const syncUrl = () => {
    const p = new URLSearchParams();
    if (state.view !== (matchMedia('(max-width: 760px)').matches ? 'list' : 'month')) p.set('view', state.view);
    if (state.month !== monthOf(today)) p.set('month', state.month);
    if (state.cats.size !== ALL_KEYS.length) p.set('show', [...state.cats].join(','));
    if (state.dept && state.cats.has('department')) p.set('dept', state.dept);
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  };

  const visible = (i: CalItem) =>
    state.cats.has(i.key) && !(i.key === 'department' && state.dept && i.department && i.department !== state.dept);
  const itemsOn = (day: string) =>
    items.filter((i) => visible(i) && occursOn(i, day)).sort((a, b) => Number(isRecurring(b)) - Number(isRecurring(a)));

  // ----- Month grid -----
  function renderGrid(focus = false) {
    const first = fromIso(`${state.month}-01`);
    const offset = (first.getUTCDay() + 6) % 7; // Monday first
    let day = addDays(`${state.month}-01`, -offset);
    let html = '';
    for (let w = 0; w < 6; w++) {
      html += '<tr>';
      for (let i = 0; i < 7; i++, day = addDays(day, 1)) {
        const list = itemsOn(day);
        const out = monthOf(day) !== state.month;
        const cls = [out && 'is-out', day === today && 'is-today', day === state.day && 'is-selected'].filter(Boolean).join(' ');
        const labels = list.slice(0, 3).map((it) =>
          `<span class="label ${isRecurring(it) ? 'label--recurring' : `label--${it.key}`}"><span class="dot dot--${it.key}"></span><span>${esc(it.title)}</span></span>`).join('');
        const more = list.length > 3 ? `<span class="more">+${list.length - 3} more</span>` : '';
        const aria = `${longDay(day)}${list.length ? `, ${list.length} ${list.length === 1 ? 'item' : 'items'}` : ''}`;
        html += `<td class="${cls}"><button type="button" class="day-btn" data-day="${day}" tabindex="${day === state.day ? 0 : -1}" aria-label="${aria}" aria-pressed="${day === state.day}">` +
          `<span class="day-num" aria-hidden="true">${fromIso(day).getUTCDate()}</span><span class="labels" aria-hidden="true">${labels}${more}</span></button></td>`;
      }
      html += '</tr>';
    }
    grid.innerHTML = html;
    if (focus) grid.querySelector<HTMLButtonElement>(`[data-day="${state.day}"]`)?.focus();
  }

  function renderPanel() {
    const list = itemsOn(state.day);
    const d = fromIso(state.day);
    panel.innerHTML =
      `<p class="dp-weekday">${DAYS[d.getUTCDay()]}</p><h3 class="dp-date">${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}</h3>` +
      (list.length
        ? `<ul>${list.map((it) => `<li><span class="dot dot--${it.key}" aria-hidden="true"></span><div><a class="dp-title" href="${it.href}">${esc(it.title)}</a>` +
            `<p class="dp-meta">${esc(it.category)}${it.time ? ` · ${esc(it.time)}` : ''}</p></div></li>`).join('')}</ul>`
        : '<p class="dp-empty">Nothing scheduled for this day.</p>');
  }

  // ----- List view -----
  function renderList() {
    const start = state.month === monthOf(today) ? today : `${state.month}-01`;
    const recurring = items.filter((i) => isRecurring(i) && visible(i))
      .map((i) => ({ i, next: nextOccurrence(i, start) }))
      .filter((r) => r.next);
    const end = toIso(new Date(Date.UTC(+state.month.slice(0, 4), +state.month.slice(5, 7), 0)));
    const oneOff = items.filter((i) => !isRecurring(i) && visible(i) && i.to! >= start && i.from! <= end)
      .sort((a, b) => (a.from! < b.from! ? -1 : 1));
    const [y, m] = state.month.split('-').map(Number);

    const row = (it: CalItem, dateBlock: string, when: string) =>
      `<li>${dateBlock}<div><a class="lv-title" href="${it.href}">${esc(it.title)}</a><p class="lv-meta">` +
      `<span class="lv-cat"><span class="dot dot--${it.key}" aria-hidden="true"></span>${esc(it.category)}</span><span>${when}</span>` +
      `${it.venue ? `<span>${esc(it.venue)}</span>` : ''}</p></div><a class="link-arrow lv-go" href="${it.href}" tabindex="-1" aria-hidden="true">Details</a></li>`;

    let html = '';
    if (recurring.length) {
      html += `<div class="lv-group"><h3 class="lv-heading">Every week</h3><ul>${recurring.map(({ i, next }) => {
        const d = fromIso(next!);
        return row(i, `<span class="lv-date lv-date--repeat" aria-hidden="true">${DAYS[i.weekday!].slice(0, 3)}<strong>${d.getUTCDate()}</strong></span>`,
          `Every ${DAYS[i.weekday!]}${i.time ? ` · ${esc(i.time)}` : ''} · Next: ${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`);
      }).join('')}</ul></div>`;
    }
    html += `<div class="lv-group"><h3 class="lv-heading">${MONTHS[m - 1]} ${y}</h3>`;
    html += oneOff.length
      ? `<ul>${oneOff.map((it) => {
          const d = fromIso(it.from!);
          const range = it.to !== it.from ? ` – ${longDay(it.to!)}` : '';
          return row(it, `<span class="lv-date" aria-hidden="true">${MONTHS[d.getUTCMonth()].slice(0, 3)}<strong>${d.getUTCDate()}</strong></span>`,
            `${longDay(it.from!)}${range}${it.time ? ` · ${esc(it.time)}` : ''}`);
        }).join('')}</ul>`
      : `<p class="lv-empty">No special meetings, programmes or events in ${MONTHS[m - 1]}${state.cats.size < ALL_KEYS.length ? ' for the categories shown' : ''}. Weekly activities continue as usual.</p>`;
    html += '</div>';
    listView.innerHTML = html;
  }

  function render(focusDay = false) {
    const [y, m] = state.month.split('-').map(Number);
    label.textContent = `${MONTHS[m - 1]} ${y}`;
    caption.textContent = `${MONTHS[m - 1]} ${y}. Select a day to see its events.`;
    viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
    filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(state.cats.has(b.dataset.filter!))));
    deptWrap.hidden = !state.cats.has('department');
    monthView.hidden = state.view !== 'month';
    listView.hidden = state.view !== 'list';
    if (state.view === 'month') { renderGrid(focusDay); renderPanel(); } else renderList();
    syncUrl();
  }

  const shiftMonth = (n: number) => {
    const d = fromIso(`${state.month}-01`);
    d.setUTCMonth(d.getUTCMonth() + n);
    state.month = toIso(d).slice(0, 7);
    state.day = monthOf(today) === state.month ? today : `${state.month}-01`;
    render();
  };

  // ----- Events -----
  $('[data-prev]').addEventListener('click', () => shiftMonth(-1));
  $('[data-next]').addEventListener('click', () => shiftMonth(1));
  $('[data-today-btn]').addEventListener('click', () => { state.month = monthOf(today); state.day = today; render(); });
  viewBtns.forEach((b) => b.addEventListener('click', () => { state.view = b.dataset.view!; render(); }));
  filterBtns.forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.filter!;
    if (state.cats.has(k) && state.cats.size === 1) return; // keep at least one category on
    state.cats.has(k) ? state.cats.delete(k) : state.cats.add(k);
    render();
  }));
  deptSelect.addEventListener('change', () => { state.dept = deptSelect.value; render(); });

  grid.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-day]');
    if (!btn) return;
    state.day = btn.dataset.day!;
    if (monthOf(state.day) !== state.month) state.month = monthOf(state.day);
    render(true);
  });
  grid.addEventListener('keydown', (e) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    state.day = addDays(state.day, moves[e.key]);
    state.month = monthOf(state.day);
    render(true);
  });

  render();
}
