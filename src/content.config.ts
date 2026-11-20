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
    registration: z.boolean().default(false),
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
