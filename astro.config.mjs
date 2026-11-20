// @ts-check
import { defineConfig } from 'astro/config';

// Static site, deployed to Cloudflare Pages.
// Update `site` once the church's domain is confirmed.
export default defineConfig({
  site: 'https://gloryville.pages.dev',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
