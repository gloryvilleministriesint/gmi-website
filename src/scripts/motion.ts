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

function setupReveal() {
  const targets = new Set<HTMLElement>();
  document.querySelectorAll<HTMLElement>(SINGLE.join(',')).forEach((el) => {
    if (!el.closest('[data-no-reveal]')) targets.add(el);
  });
  document.querySelectorAll<HTMLElement>(GROUPS.join(',')).forEach((group) => {
    if (group.closest('[data-no-reveal]')) return;
    Array.from(group.children).forEach((child, i) => {
      const el = child as HTMLElement;
      el.style.setProperty('--rv-i', String(Math.min(i % 6, 5)));
      targets.add(el);
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
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  targets.forEach((el) => {
    // Elements already well inside the first screen still animate in, just without waiting for scroll.
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
