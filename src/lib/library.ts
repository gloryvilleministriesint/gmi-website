// Digital Library: shared helpers for the category pages and the Library-wide search.
import { statSync } from 'node:fs';
import { getCollection } from 'astro:content';
import { getMessages, seriesOf, longDate } from './messages';

export { longDate };
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const byDateDesc = <T extends { data: { date: Date } }>(a: T, b: T) => +b.data.date - +a.data.date;

export async function getTracks() {
  return (await getCollection('tracks')).sort((a, b) => byDateDesc(a, b) || a.data.order - b.data.order);
}
export async function getAlbums() {
  return (await getCollection('albums')).sort(byDateDesc);
}
export async function getResources() {
  return (await getCollection('resources')).sort(byDateDesc);
}
export async function getBooks() {
  return (await getCollection('books')).sort(byDateDesc);
}

/** Series pages: every series used by a message, with its optional description entry. */
export async function getSeriesPages() {
  const info = await getCollection('series');
  return seriesOf(await getMessages()).map((s) => ({ ...s, info: info.find((i) => i.data.name === s.name) }));
}

/** Number of items per Library tab (href → count). Live and Online Connections are always shown. */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  return {
    '/library': (await getMessages()).length,
    '/library/music': (await getTracks()).length,
    '/library/live': 1,
    '/library/connect': 1,
    '/library/gallery': (await getAlbums()).length,
    '/library/resources': (await getResources()).length,
    '/library/books': (await getBooks()).length,
  };
}

export interface SearchItem { group: string; title: string; url: string; meta: string; text: string }

/** Everything searchable in the Library, for /library/search. */
export async function getSearchIndex(): Promise<SearchItem[]> {
  const t = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' ').toLowerCase();
  const date = (d: Date, sample: boolean) => (sample ? '' : longDate(d));
  const items: SearchItem[] = [];
  for (const m of await getMessages()) {
    items.push({ group: 'Messages and Sermons', title: m.data.title, url: `/library/messages/${m.id}`,
      meta: [m.data.speaker, m.data.series, date(m.data.date, m.data.sample)].filter(Boolean).join(' · '),
      text: t(m.data.title, m.data.speaker, m.data.series, ...m.data.topics, ...m.data.scripture, m.data.summary) });
  }
  for (const s of await getSeriesPages()) {
    items.push({ group: 'Series', title: s.name, url: `/library/series/${s.slug}`, meta: `${s.messages.length} messages`, text: t(s.name, s.info?.data.summary) });
  }
  for (const tr of await getTracks()) {
    items.push({ group: 'Music and Songs', title: tr.data.title, url: `/library/music#${tr.id}`, meta: [tr.data.collection, tr.data.credits].filter(Boolean).join(' · '), text: t(tr.data.title, tr.data.collection, tr.data.credits) });
  }
  for (const a of await getAlbums()) {
    items.push({ group: 'Gallery', title: a.data.title, url: `/library/gallery/${a.id}`, meta: [a.data.kind, date(a.data.date, a.data.sample)].filter(Boolean).join(' · '), text: t(a.data.title, a.data.kind) });
  }
  for (const r of await getResources()) {
    items.push({ group: 'Publications and Resources', title: r.data.title, url: `/library/resources/${r.id}`, meta: [r.data.type, date(r.data.date, r.data.sample)].filter(Boolean).join(' · '), text: t(r.data.title, r.data.type, r.data.summary, r.data.author, r.body) });
  }
  for (const b of await getBooks()) {
    items.push({ group: 'Recommended Books', title: b.data.title, url: `/library/books/${b.id}`, meta: b.data.author, text: t(b.data.title, b.data.author, b.data.summary) });
  }
  return items;
}

/** File type and size for a download in public/ (e.g. "PDF · 1.2 MB"), or just the type for external files. */
export function fileInfo(path?: string) {
  if (!path) return null;
  const ext = (path.split('?')[0].split('.').pop() ?? '').toUpperCase();
  let size = '';
  if (path.startsWith('/')) {
    try {
      const bytes = statSync(`public${decodeURI(path)}`).size;
      size = bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    } catch { /* file not found at build: show the type only */ }
  }
  return [ext, size].filter(Boolean).join(' · ');
}
