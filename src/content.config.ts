import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Entries marked `sample: true` are design placeholders. Delete them once real content is added.

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['Weekly activity', 'Special meeting', 'Programme', 'Church event', 'Department meeting']),
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    time: z.string().optional(),
    venue: z.string().optional(),
    summary: z.string().optional(),
    department: z.string().optional(),
    image: z.string().optional(),
    // Repeating activities (e.g. a department meeting). Weekly services come from src/data/site.json.
    repeat: z.enum(['weekly']).optional(),
    repeatUntil: z.coerce.date().optional(),
    // Programme outline shown on the event page.
    outline: z.array(z.object({ time: z.string(), session: z.string() })).default([]),
    // Registration: shown only when true. Set `registrationStatus` to close it or mark it full.
    registration: z.boolean().default(false),
    // Optional outside registration page (e.g. a form link from the flyer). When set, the event page links to it instead of showing the built-in form.
    registrationUrl: z.string().url().optional(),
    registrationStatus: z.enum(['open', 'closed', 'full']).default('open'),
    maxAttending: z.number().int().min(1).max(20).default(5),
    sample: z.boolean().default(false),
  }),
});

const messages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/messages' }),
  schema: z.object({
    title: z.string(),
    speaker: z.string().optional(),
    date: z.coerce.date(),
    series: z.string().optional(),
    youtube: z.string().optional(),
    audio: z.string().optional(),
    topics: z.array(z.string()).default([]),
    scripture: z.array(z.string()).default([]),
    summary: z.string().optional(),
    artwork: z.string().optional(),
    duration: z.string().optional(), // e.g. "52:10"
    notesFile: z.string().optional(), // link to sermon notes (PDF), if published
    featured: z.boolean().default(false),
    sample: z.boolean().default(false),
  }),
});

const updates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/updates' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    image: z.string().optional(),
    expires: z.coerce.date().optional(),
    sample: z.boolean().default(false),
  }),
});

// ---------- Digital Library categories (Blueprint 5.2–5.7) ----------

const series = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/series' }),
  schema: z.object({
    name: z.string(), // must match the `series` value used on messages
    summary: z.string().optional(),
    image: z.string().optional(),
    sample: z.boolean().default(false),
  }),
});

const tracks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tracks' }),
  schema: z.object({
    title: z.string(),
    collection: z.string().optional(), // album or collection name
    audio: z.string().optional(), // hosted audio file
    link: z.string().url().optional(), // official streaming link
    credits: z.string().optional(),
    duration: z.string().optional(),
    date: z.coerce.date(),
    order: z.number().default(0),
    sample: z.boolean().default(false),
  }),
});

const albums = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/albums' }),
  schema: z.object({
    title: z.string(), // occasion name
    date: z.coerce.date(),
    kind: z.enum(['Service', 'Special occasion', 'Programme', 'Department']).default('Service'),
    cover: z.string().optional(),
    photos: z.array(z.object({ src: z.string(), alt: z.string() })).default([]),
    videos: z.array(z.object({ title: z.string(), youtube: z.string() })).default([]),
    sample: z.boolean().default(false),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/resources' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['Article', 'Download', 'Devotional']),
    date: z.coerce.date(),
    summary: z.string().optional(),
    author: z.string().optional(),
    file: z.string().optional(), // e.g. /files/devotional.pdf (in public/files)
    image: z.string().optional(),
    sample: z.boolean().default(false),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    cover: z.string().optional(),
    recommendedBy: z.string().optional(),
    summary: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    date: z.coerce.date(),
    sample: z.boolean().default(false),
  }),
});

// Published testimonies only. Submissions are moderated outside the public site and added here once approved.
const testimonies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonies' }),
  schema: z.object({
    name: z.string(), // display name, as approved by the member (e.g. "Sister A. O." or "Anonymous")
    date: z.coerce.date(), // date shared or published
    excerpt: z.string(), // short pull quote for cards
    category: z.string().optional(), // e.g. Healing, Provision
    video: z.string().optional(), // YouTube link for a video testimony
    photo: z.string().optional(),
    featured: z.boolean().default(false),
    sample: z.boolean().default(false),
  }),
});

export const collections = { events, messages, updates, testimonies, series, tracks, albums, resources, books };
