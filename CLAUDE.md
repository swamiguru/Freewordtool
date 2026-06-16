# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FreeWordTool (`freewordtool.com`) — a static, client-side word/character counter site built with Astro and Tailwind CSS v4. There is no backend, no API, no database, and no analytics/tracking beyond an optional cookieless page-view counter mentioned in the privacy policy. All text analysis happens in the browser via vanilla JS; user text is never sent anywhere.

## Commands

```sh
npm install        # install dependencies
npm run dev         # start dev server at localhost:4321
npm run build        # build production site to ./dist/
npm run preview      # preview the production build locally
npm run astro -- --help   # Astro CLI help (e.g. `npm run astro check` for type-checking)
```

There is no test suite, linter, or CI config in this repo. `npm run astro check` is the closest thing to type validation (checks `.astro` files against `tsconfig.json`, which extends `astro/tsconfigs/strict`).

Node `>=22.12.0` is required (see `package.json` engines).

## Architecture

- **Pages are the unit of duplication, not abstraction.** `src/pages/index.astro` (Word Counter) and `src/pages/character-counter.astro` (Character Counter) both render the same `<WordCounter>` component with a different `heading` prop — they're really the same tool with different SEO copy/titles for different search intent. `src/pages/privacy.astro` does not use `WordCounter` and instead duplicates the header/footer markup inline (it predates/bypasses the shared layout's nav).
- **All logic lives in `src/components/WordCounter.astro`.** This single component contains the textarea, the stats panel, and a large inline `<script>` block with all the counting logic (`countWords`, `countSentences`, `countParagraphs`, `countLines`, `getKeywords`, character-limit tracking, copy/download/clear handlers). There is no separate JS module or shared utils file — if you need to change counting behavior, this is the only place to look.
- **`src/layouts/Layout.astro`** is the HTML shell (head/meta/SEO tags, dark-mode bootstrap script) used by every page via `<slot />`. It reads `Astro.site` (configured in `astro.config.mjs` as `https://www.freewordtool.com`) to build canonical URLs.
- **Dark mode** is implemented twice: an inline bootstrap script in `Layout.astro` (sets the `dark` class on `<html>` before paint, based on `localStorage.theme` or `prefers-color-scheme`) and a per-page toggle button/script (in `WordCounter.astro` and duplicated again in `privacy.astro`) that flips the class and persists the choice. There's no shared script include — toggle logic is copy-pasted across pages that need it.
- **Styling** is Tailwind v4 via the Vite plugin (`@tailwindcss/vite`, configured in `astro.config.mjs`), not the `@astrojs/tailwind` integration. Dark mode variant is declared manually in `src/styles/global.css` (`@custom-variant dark (&:where(.dark, .dark *))`), which is why `dark:` classes work even though Tailwind v4 doesn't enable class-based dark mode by default.
- **SEO assets** (`public/robots.txt`, `public/sitemap.xml`, Google site-verification HTML file) are static files, not generated — update them by hand if pages are added/removed.

## Conventions

- New tool pages should follow the index.astro / character-counter.astro pattern: wrap `<Layout>` around `<WordCounter heading="..." />`, add page-specific SEO `title`/`description`, and add any unique supporting content (FAQ, intro copy) below the component.
- Keep counting/text-analysis logic inside `WordCounter.astro`'s script block unless it grows enough to justify extraction — there's currently no module structure to slot a new file into.
- Update `src/components/WordCounter.astro`'s nav links and the per-page footers together when adding/removing pages (currently duplicated in 3 places: `Layout`-using pages don't include nav/footer — `WordCounter.astro` and `privacy.astro` each hardcode their own header/footer markup).
