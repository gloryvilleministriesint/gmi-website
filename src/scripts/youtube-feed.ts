// Keeps the home page's YouTube rows current: asks /api/youtube (a Cloudflare Pages Function that reads the
// channel feed, cached for ~10 minutes) and redraws the rows when there are newer uploads than the build had.
import { cardHtml, shortHtml, split, type Video } from '../lib/youtube';

const byId = (list: Video[]) => list.map((v) => v.id).join();

export async function refreshYouTube() {
  const fullRow = document.querySelector<HTMLElement>('[data-yt-row="full"] [data-track]');
  const shortRow = document.querySelector<HTMLElement>('[data-yt-row="shorts"] [data-track]');
  const seed = document.getElementById('yt-seed');
  if (!fullRow || !seed) return;
  const built: Video[] = JSON.parse(seed.textContent || '[]');
  try {
    const res = await fetch('/api/youtube', { headers: { accept: 'application/json' } });
    if (!res.ok) return;
    const { videos } = (await res.json()) as { videos: Video[] };
    if (!Array.isArray(videos) || !videos.length) return;
    const seen = new Set<string>();
    const all = [...videos, ...built].filter((v) => !seen.has(v.id) && seen.add(v.id))
      .sort((a, b) => b.published.localeCompare(a.published));
    const now = split(all), before = split(built);
    if (byId(now.full) !== byId(before.full)) { fullRow.innerHTML = now.full.map((v) => cardHtml(v)).join(''); fullRow.scrollLeft = 0; }
    if (shortRow && byId(now.shorts) !== byId(before.shorts)) { shortRow.innerHTML = now.shorts.map((v) => shortHtml(v)).join(''); shortRow.scrollLeft = 0; }
    [fullRow, shortRow].forEach((r) => r?.dispatchEvent(new Event('scroll')));
  } catch { /* keep the cards from the build */ }
}
