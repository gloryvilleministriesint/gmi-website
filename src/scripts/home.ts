// Home page motion: hero slideshow and the swipeable messages row.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Hero slideshow: auto-advances every 7 s, pauses on hover/focus or with the pause button,
 *  supports arrows, numbered tabs, swipe and the keyboard. Starts paused for reduced motion (WCAG 2.2.2). */
export function initHero() {
  const root = document.querySelector<HTMLElement>('[data-hero]');
  if (!root) return;
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-go]'));
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-pause]')!;
  if (slides.length < 2) { root.querySelector('.hero__controls')?.remove(); return; }

  const DURATION = 7000;
  root.style.setProperty('--hero-dur', `${DURATION}ms`);
  let index = 0;
  let timer: number | undefined;
  let userPaused = reduced;
  let hoverPaused = false;

  const show = (n: number) => {
    index = (n + slides.length) % slides.length;
    slides.forEach((s, i) => {
      const on = i === index;
      s.classList.toggle('is-active', on);
      if (on) { s.removeAttribute('aria-hidden'); s.inert = false; } else { s.setAttribute('aria-hidden', 'true'); s.inert = true; }
      s.querySelectorAll<HTMLElement>('a').forEach((a) => (a.tabIndex = on ? 0 : -1));
    });
    dots.forEach((d, i) => {
      if (i === index) {
        // Restart the progress bar animation.
        d.removeAttribute('aria-current');
        void d.offsetWidth;
        d.setAttribute('aria-current', 'true');
      } else d.removeAttribute('aria-current');
    });
    schedule();
  };

  const schedule = () => {
    clearTimeout(timer);
    const paused = userPaused || hoverPaused;
    root.classList.toggle('is-paused', paused);
    if (!paused) timer = window.setTimeout(() => show(index + 1), DURATION);
  };

  const setUserPaused = (p: boolean) => {
    userPaused = p;
    pauseBtn.setAttribute('aria-label', p ? 'Play slideshow' : 'Pause slideshow');
    schedule();
  };

  dots.forEach((d) => d.addEventListener('click', () => show(Number(d.dataset.go))));
  root.querySelector('[data-prev]')?.addEventListener('click', () => show(index - 1));
  root.querySelector('[data-next]')?.addEventListener('click', () => show(index + 1));
  pauseBtn.addEventListener('click', () => setUserPaused(!userPaused));

  // Pause while the visitor is reading or using the controls.
  root.addEventListener('mouseenter', () => { hoverPaused = true; schedule(); });
  root.addEventListener('mouseleave', () => { hoverPaused = false; schedule(); });
  root.addEventListener('focusin', () => { hoverPaused = true; schedule(); });
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget as Node)) { hoverPaused = false; schedule(); } });
  document.addEventListener('visibilitychange', () => { hoverPaused = document.hidden; schedule(); });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });

  let x0: number | null = null;
  root.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
  root.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  pauseBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
  show(0);
}

/** Swipeable row with previous/next buttons that scroll one card at a time. */
export function initTrack() {
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((root) => {
    const track = root.querySelector<HTMLElement>('[data-track]');
    if (!track) return;
    const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-scroll]'));
    const step = () => (track.querySelector<HTMLElement>('.track__item')?.offsetWidth ?? 300) + 24;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 4;
      btns.forEach((b) => (b.disabled = b.dataset.scroll === '-1' ? track.scrollLeft <= 4 : track.scrollLeft >= max));
    };
    btns.forEach((b) => b.addEventListener('click', () => {
      track.scrollBy({ left: Number(b.dataset.scroll) * step(), behavior: reduced ? 'auto' : 'smooth' });
    }));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  });
}
