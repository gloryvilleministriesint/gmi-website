// Site-wide motion (Nov 2026 redesign, inspired by petracc.org):
// 1. Scroll reveal: blocks fade up as they enter the viewport, cards in a row stagger.
// 2. Watermark drift: giant faded words slide sideways as their section scrolls past.
// Nothing is hidden unless this script runs, and all of it is skipped for reduced motion.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Blocks that reveal on their own, and groups whose children stagger.
const SINGLE = [
  '[data-reveal]',
  'main .section-head',
  'main .section > .container > h2',
  'main .section > .container > .eyebrow',
  'main .section > .container > p',
  'main .form-card',
  'main .lib-panel',
  'main .page-hero__inner > *',
];
const GROUPS = [
  '[data-reveal-group]',
  'main .lib-grid',
  'main .cards',
  'main .grid',
  'main .resp',
  'main .rhythm',
  'main .platforms',
  'main .series',
  'main .parts',
  'main .tracks',
  'main .list',
  'main .related',
];

// Generic pass so every page gets motion without per-page markup: short lists of cards/items
// stagger, and the remaining blocks of each section fade up in turn.
const SKIP = '[data-no-reveal], .hero, .acc, .track, form, nav, [role=tablist], [role=tabpanel] > ul, .mobile-menu, .mcard, .footer';

function setupReveal() {
  const targets = new Set<HTMLElement>();
  const add = (el: HTMLElement, i = 0, depth = 0) => {
    if (el.matches('script, style, .watermark, .sr-only') || el.closest(SKIP)) return;
    for (const t of targets) if (t.contains(el)) return; // already animated by an ancestor
    const inner = [...targets].some((t) => el.contains(t));
    if (inner) {
      // A block that holds a staggered list: animate its other children instead.
      if (depth < 2) Array.from(el.children).forEach((c, j) => add(c as HTMLElement, i + j, depth + 1));
      return;
    }
    el.style.setProperty('--rv-i', String(Math.min(i % 6, 5)));
    targets.add(el);
  };

  // 1. Explicit groups and lists (staggered).
  const lists = new Set<HTMLElement>([
    ...document.querySelectorAll<HTMLElement>(GROUPS.join(',')),
    ...document.querySelectorAll<HTMLElement>('main section ul, main section ol'),
  ]);
  lists.forEach((list) => {
    if (list.closest(SKIP)) return;
    const items = Array.from(list.children) as HTMLElement[];
    if (!list.matches(GROUPS.join(',')) && (items.length < 3 || items.length > 14)) return;
    items.forEach((li, i) => add(li, i));
  });
  // 2. Explicit single blocks.
  document.querySelectorAll<HTMLElement>(SINGLE.join(',')).forEach((el) => add(el));
  // 3. Every other block in each section container (two/three-column grids reveal per column).
  document.querySelectorAll<HTMLElement>('main section').forEach((section) => {
    if (section.closest(SKIP) || section.matches(SKIP)) return;
    const container = section.querySelector<HTMLElement>(':scope > .container') ?? section;
    (Array.from(container.children) as HTMLElement[]).forEach((b, i) => {
      const cs = getComputedStyle(b);
      const isCols = cs.display === 'grid' && b.children.length >= 2 && b.children.length <= 3;
      if (isCols) (Array.from(b.children) as HTMLElement[]).forEach((c, j) => add(c, i + j));
      else add(b, i);
    });
  });
  if (!targets.size) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('rv--in');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -4% 0px', threshold: 0 },
  );
  targets.forEach((el) => {
    el.classList.add('rv');
    if (el.dataset.reveal === 'left') el.classList.add('rv--left');
    if (el.dataset.reveal === 'right') el.classList.add('rv--right');
    if (el.dataset.reveal === 'scale') el.classList.add('rv--scale');
    io.observe(el);
  });
}

function setupWatermarks() {
  const marks = Array.from(document.querySelectorAll<HTMLElement>('.watermark'));
  if (!marks.length) return;
  let ticking = false;
  const update = () => {
    const vh = innerHeight;
    marks.forEach((m) => {
      const host = m.parentElement!;
      const r = host.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      // -1 when the section enters from the bottom, +1 when it leaves at the top.
      const progress = (vh - r.top) / (vh + r.height) * 2 - 1;
      const dir = m.dataset.dir === 'right' ? 1 : -1;
      m.style.transform = `translateX(${(progress * 8 * dir).toFixed(2)}%)`;
    });
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update, { passive: true });
  update();
}

if (!reduced) {
  setupReveal();
  setupWatermarks();
}

// Header: solid background once the page scrolls (used by the transparent header over the home hero).
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
