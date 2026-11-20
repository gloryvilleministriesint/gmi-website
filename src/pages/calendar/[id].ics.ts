import type { APIRoute, GetStaticPaths } from 'astro';
import { getEvents, toIcs, venueOf, type EventEntry } from '../../lib/calendar';

export const getStaticPaths = (async () => (await getEvents()).map((e) => ({ params: { id: e.id }, props: { e } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) => {
  const e = (props as { e: EventEntry }).e;
  const body = toIcs(e, venueOf(e), new URL(`/calendar/${e.id}`, site).href);
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
