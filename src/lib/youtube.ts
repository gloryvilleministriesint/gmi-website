// GMI YouTube channel feed: parsing, tidying and card markup.
// Shared by the build (src/pages/index.astro), the Cloudflare Pages Function (functions/api/youtube.ts)
// and the browser (src/scripts/youtube-feed.ts), so the cards look the same wherever they are made.
// No API key is needed: YouTube publishes the 15 most recent uploads of every channel as a public feed.

export const CHANNEL_ID = 'UCH_EuG8WKrfToZwdNmJOaVg'; // @gloryvilleglobal
export const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export interface Video {
  id: string;
  title: string; // tidied title for display
  rawTitle: string; // title as posted on YouTube
  speaker?: string;
  kind: string; // "Sunday Service", "Message", "Short"
  published: string; // ISO date and time of upload (used for ordering)
  date?: string; // service date written in the title, when there is one (YYYY-MM-DD)
  short: boolean;
  description: string;
}

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const tag = (s: string, t: string) => {
  const m = s.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`));
  return m ? decode(m[1]).trim() : '';
};

/** Parse YouTube's Atom feed into raw entries. */
export function parseFeed(xml: string): Video[] {
  return xml.split('<entry>').slice(1).map((e) => {
    const id = tag(e, 'yt:videoId');
    const rawTitle = tag(e, 'title');
    const short = /\/shorts\//.test(e);
    return tidy({ id, rawTitle, published: tag(e, 'published'), short, description: tag(e, 'media:description').slice(0, 400) });
  }).filter((v) => /^[\w-]{11}$/.test(v.id));
}

const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'is']);
const titleCase = (s: string) => s.toLowerCase().split(/(\s+)/).map((w, i) => {
  if (/^\s+$/.test(w)) return w;
  if (i > 0 && SMALL.has(w)) return w;
  return w.replace(/^([^a-z]*)([a-z])/, (_, p, c) => p + c.toUpperCase());
}).join('');

const MONTHS = /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d/i;
const SPEAKER = /^(pastor|prophet|prophetess|rev(erend)?\.?|dr\.?|apostle|bishop|evangelist|minister)\s/i;
const CHURCH = /gloryville\s+ministries\s+international/i;

/** Turn a YouTube title such as "SUNDAY SERVICE || GLORYVILLE MINISTRIES INTERNATIONAL || NOVEMBER 22, 2026"
 *  into a clean display title, speaker and kind. */
export function tidy(v: { id: string; rawTitle: string; published: string; short: boolean; description: string }): Video {
  let speaker: string | undefined;
  const dm = v.rawTitle.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  const date = dm ? `${dm[3]}-${String(new Date(`${dm[1]} 1, 2000`).getMonth() + 1).padStart(2, '0')}-${dm[2].padStart(2, '0')}` : undefined;
  const parts = v.rawTitle
    .replace(/#[\p{L}\p{N}_]+/gu, '')
    .split('|')
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((p) => {
      if (CHURCH.test(p) && p.replace(CHURCH, '').trim().length < 3) return false;
      if (MONTHS.test(p) && p.replace(MONTHS, '').replace(/[\d,\s]|th|st|nd|rd/gi, '').length < 4) return false;
      if (/^\d{1,2}\s*-\s*\d{1,2}\s*-\s*\d{4}$/.test(p)) return false;
      if (SPEAKER.test(p)) { speaker ??= p; return false; }
      return true;
    })
    .map((p) => (/[a-z]/.test(p) ? p : titleCase(p)));
  if (speaker && !/[a-z]/.test(speaker)) speaker = titleCase(speaker);
  const title = parts.join(' · ') || titleCase(v.rawTitle);
  const kind = v.short ? 'Short' : /service/i.test(title) ? 'Service' : 'Message';
  return { ...v, title, speaker, kind, date };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const fmtDate = (iso: string) =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00+01:00` : iso)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' });
export const shownDate = (v: Video) => fmtDate(v.date ?? v.published);

const isNew = (iso: string, now = Date.now()) => now - new Date(iso).getTime() < 7 * 864e5;

export const watchUrl = (v: Video) => `/library/watch/?v=${v.id}`;

/** Card for a full-length video (services and messages). */
export function cardHtml(v: Video, now?: number): string {
  return `<li class="track__item"><article class="ytc">
  <a class="ytc__link" href="${watchUrl(v)}">
    <div class="ytc__thumb">
      <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy" decoding="async" />
      <span class="ytc__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span>
      ${isNew(v.published, now) ? '<span class="ytc__new">New</span>' : ''}
    </div>
    <p class="ytc__kind">${esc(v.kind)}</p>
    <h3 class="ytc__title">${esc(v.title)}</h3>
  </a>
  <p class="ytc__meta">${v.speaker ? `<span>${esc(v.speaker)}</span>` : ''}<span>${shownDate(v)}</span></p>
</article></li>`;
}

/** Card for a YouTube Short (vertical). */
export function shortHtml(v: Video, now?: number): string {
  return `<li class="track__item"><a class="yts" href="${watchUrl(v)}">
  <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy" decoding="async" />
  ${isNew(v.published, now) ? '<span class="ytc__new">New</span>' : ''}
  <span class="yts__body"><span class="yts__title">${esc(v.title)}</span><span class="yts__date">${shownDate(v)}</span></span>
</a></li>`;
}

export const split = (videos: Video[]) => ({
  full: videos.filter((v) => !v.short).slice(0, 8),
  shorts: videos.filter((v) => v.short).slice(0, 12),
});
