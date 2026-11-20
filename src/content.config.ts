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

export const collections = { events, messages, updates };
