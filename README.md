# Gloryville Ministries International website

The official website of Gloryville Ministries International (GMI), Ibadan.

- **Framework:** [Astro](https://astro.build), as a static site
- **Hosting:** Cloudflare Pages, which deploys automatically from this GitHub repository
- **Editing:** church volunteers will use an admin page at `/admin` (added in a later phase)
- **Design:** "Sanctuary Editorial" design system from the GMI UI files. Tokens are in `src/styles/tokens.css`.

## Where things live

| What | File |
| --- | --- |
| Service times, address, phone, email, social links, Live toggle | `src/data/site.json` |
| Menu items, departments, Library categories | `src/data/navigation.ts` |
| Events, messages, church updates | `src/content/events`, `src/content/messages`, `src/content/updates` |
| Logo files | `public/images/brand/` |
| Colours, fonts, spacing | `src/styles/tokens.css` |

Entries marked `sample: true` are design placeholders. Delete them as real content is added.
Text shown as `[bracketed italic]` on the site is waiting for content from the church.

## Run locally

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
```

## Cloudflare Pages settings

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`
