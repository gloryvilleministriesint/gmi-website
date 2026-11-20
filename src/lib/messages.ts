// Messages (sermons) helpers shared by the Library pages and Home.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Message = CollectionEntry<'messages'>;
const TZ = 'Africa/Lagos';

export const longDate = (d: Date) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(d);

/** All messages, newest first. */
export async function getMessages() {
  return (await getCollection('messages')).sort((a, b) => +b.data.date - +a.data.date);
}

export const hasVideo = (m: Message) => m.data.youtube !== undefined;
export const hasAudio = (m: Message) => m.data.audio !== undefined;
export const formatOf = (m: Message) => (hasVideo(m) ? 'Video' : hasAudio(m) ? 'Audio' : 'Message');

/** YouTube video id from a full URL, a short link or a bare id. */
export function youtubeId(v?: string) {
  if (!v) return null;
  const m = v.match(/(?:youtu\.be\/|v=|embed\/|live\/|shorts\/)([\w-]{11})/) ?? v.match(/^([\w-]{11})$/);
  return m ? m[1] : null;
}

export interface Series { name: string; slug: string; messages: Message[] }

/** Series with their messages in order (oldest first = part 1). */
export function seriesOf(messages: Message[]): Series[] {
  const map = new Map<string, Message[]>();
  for (const m of messages) if (m.data.series) map.set(m.data.series, [...(map.get(m.data.series) ?? []), m]);
  return [...map.entries()]
    .map(([name, list]) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), messages: list.sort((a, b) => +a.data.date - +b.data.date) }))
    .sort((a, b) => +b.messages.at(-1)!.data.date - +a.messages.at(-1)!.data.date);
}
