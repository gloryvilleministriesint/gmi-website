// Build-time list of the latest GMI YouTube uploads.
// Tries YouTube's live feed first (the Cloudflare build has internet access), then merges in the saved
// snapshot so older full-length services stay listed. If YouTube cannot be reached, the snapshot alone is used.
import snapshot from '../data/youtube-snapshot.json';
import { FEED_URL, parseFeed, tidy, type Video } from './youtube';

export const merge = (...lists: Video[][]): Video[] => {
  const seen = new Map<string, Video>();
  for (const list of lists) for (const v of list) if (!seen.has(v.id)) seen.set(v.id, v);
  return [...seen.values()].sort((a, b) => b.published.localeCompare(a.published));
};

let cached: Video[] | null = null;
export async function latestVideos(): Promise<Video[]> {
  if (cached) return cached;
  const saved = snapshot.videos.map((v) => tidy(v));
  let live: Video[] = [];
  try {
    const ctl = AbortSignal.timeout(8000);
    const res = await fetch(FEED_URL, { signal: ctl });
    if (res.ok) live = parseFeed(await res.text());
  } catch { /* offline build: snapshot only */ }
  cached = merge(live, saved);
  return cached;
}
