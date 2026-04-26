# Ciphriend — Design Spec

**Date:** 2026-04-26
**Status:** Approved
**Author:** Josh Loredo (with Claude Opus 4.7 brainstorming)

## Summary

Ciphriend ("Cipher" + "Friend") is a client-side web tool for encoding, decoding, and visualizing ciphers. It targets a long-term scope of a "full cipher hub" (classical + modern + encodings + hashes + analysis tools) with a curated v1 of 12 ciphers. Privacy is structural — there is no backend; all computation happens in the browser; URL-fragment sharing keeps payloads off the wire. Each educational cipher ships with a per-character visualization, either rendered by a generic trace-based component (for substitution-style ciphers) or by a custom Svelte component (for ciphers whose natural visualization isn't a 1:1 char map).

## Decisions

| Topic | Decision |
|---|---|
| Long-term scope | Full cipher hub: classical + modern crypto + encodings + hashes + analysis tools |
| v1 scope (13 entries) | Caesar, ROT13, Atbash, Vigenère, Rail Fence, Base64, Hex, URL, Binary, AES-GCM, SHA-256, Morse, Frequency Analysis |
| UI organization | Card picker home → focused per-cipher workspace |
| Stack | Astro 5 + TypeScript (strict) |
| Interactivity | Svelte 5 islands |
| Architecture | Pure client-side, zero backend |
| Sharing | URL fragment encoding (`#c=…&p=…`); cap 6 kB |
| Persistence | None. Stateless. Keys ephemeral, tab-scoped only |
| Hosting | Cloudflare Pages, GitHub Actions deploy |
| Aesthetic | shadcn-svelte + Tailwind. Theme = Sodium Lab (warm dark + amber). Display mono = JetBrains Mono. |
| Testing | Vitest, reference vectors per cipher, runs in CI |
| Visualizations | Generic trace-based renderer + custom Svelte slot per cipher. Playback: live default + ▶ stepped. v1 covers 8 of 13. |

## Architecture

### Layered model

```
┌─────────────────────────────────────────────────┐
│  UI layer (Astro pages + Svelte islands)        │
│   /                  → card grid                │
│   /c/[id]            → focused cipher page      │
│   /about, /privacy   → static content           │
└──────────────┬──────────────────────────────────┘
               │ calls
               ▼
┌─────────────────────────────────────────────────┐
│  Cipher engine (pure TS, no framework imports)  │
│   Each cipher exports a CipherSpec object       │
│   encode / decode / trace / viz                 │
└──────────────┬──────────────────────────────────┘
               │ uses (modern crypto only)
               ▼
┌─────────────────────────────────────────────────┐
│  WebCrypto (browser native) + thin shims        │
└─────────────────────────────────────────────────┘
```

### Cipher engine interface

```typescript
// src/ciphers/_types.ts
export type CipherCategory =
  | 'classical' | 'modern' | 'encoding' | 'hash' | 'analysis';

export type Mode = 'encode' | 'decode';

export interface OptionField {
  id: string;
  label: string;
  kind: 'text' | 'number' | 'select' | 'toggle' | 'password';
  default?: unknown;
  description?: string;
  options?: { value: string; label: string }[];
  min?: number; max?: number; step?: number;
  ephemeral?: true;
}

export interface CharTransform {
  inIndex: number;
  inChar: string;
  outChar: string;
  outIndex?: number;
  detail?: string;
  group?: number;
}

export interface CipherSpec<O = Record<string, unknown>> {
  id: string;
  name: string;
  tagline: string;
  category: CipherCategory;
  modes: Mode[];
  options: OptionField[];
  examples?: { input: string; opts: O; output: string }[];
  encode?: (input: string, opts: O) => string | Promise<string>;
  decode?: (input: string, opts: O) => string | Promise<string>;
  trace?: (input: string, opts: O, mode: Mode) => CharTransform[];
  viz?: () => Promise<{ default: import('svelte').SvelteComponent }>;
}
```

A single interface drives card rendering, route generation, focused-view UI, URL fragment serialization, visualizations, and tests.

### URL fragment format

```
#c=<cipherId>&m=<mode>&<optKey>=<optValue>&...&p=<base64UrlPayload>
```

- Keys/passwords (`ephemeral: true` fields) are NEVER included.
- Payload is base64url-encoded UTF-8.
- Hard cap: 6 kB. Above that, a banner suggests "Copy raw output instead."

### State model

- No global store. Each cipher page is self-contained.
- URL hash is the source of truth for shareable state. On mount, parse `location.hash` → populate inputs. On change, debounce-write back via `history.replaceState`.

## Visualizations

Two mechanisms; one wins per cipher:

1. **Generic trace renderer** (free for substitution-style ciphers): cipher exports `trace()` → `CharTransform[]`. Workbench renders the shared `<TraceVisualizer>`.
2. **Custom Svelte component**: `viz` points to a `*.viz.svelte` file colocated with the engine. Used when the natural visualization isn't a 1:1 char map.

If both present, `viz` wins. If neither, the visualization panel collapses.

### Playback

- **Live (default)**: transforms render instantly; most-recently-changed character pulses amber.
- **Stepped (▶ button)**: `<PlaybackControls>` strip with play/pause/scrub/speed (¼× / ½× / 1× / 2×). Default 250 ms/step.

Same component, two drivers.

### v1 visualization scope

| Cipher | Mechanism | Notes |
|---|---|---|
| Caesar | trace (generic) | shows shift offset per char |
| ROT13 | trace (generic) | identical to Caesar w/ shift=13 |
| Atbash | trace (generic) | shows mirror-mapping |
| Vigenère | trace (generic) | uses `group` for key-cycle highlights |
| Rail Fence | custom Svelte | animated zigzag |
| Base64 | custom Svelte | 24-bit window with bit-grouping |
| Morse | custom Svelte | dits/dahs as timed blocks |
| Frequency Analysis | custom Svelte | histogram with English baseline |

No v1 viz: Hex, URL, Binary, AES-GCM, SHA-256.

### TraceVisualizer rendering

- Top row: input characters in monospace cells.
- Bottom row: output characters, cells aligned to corresponding input cells.
- Subtle connector animates from in→out per transform.
- Hover/focus a cell to see `detail`.
- `group` colors the cell's left border.
- All animations honor `prefers-reduced-motion`.

### Performance

- TraceVisualizer virtualizes when input length > 500 chars.
- Custom visualizations gracefully degrade for very long inputs ("visualization disabled for inputs > N"); engine still runs.

## Stack

| Concern | Choice |
|---|---|
| Framework | Astro 5.x |
| UI islands | Svelte 5 (runes) via `@astrojs/svelte` |
| Styling | Tailwind CSS via `@astrojs/tailwind` |
| Component primitives | shadcn-svelte (copy-in, owned in repo) |
| Language | TypeScript strict |
| Package manager | npm |
| Testing | Vitest + `@testing-library/svelte` |
| Lint/format | None initially |
| Deploy | Cloudflare Pages via wrangler + GitHub Actions |
| Node version | LTS, pinned in `.nvmrc` |

## Directory layout

See plan file at `/Users/josh/.claude/plans/indexed-strolling-castle.md` for the full annotated tree. Summary:

```
src/
├── ciphers/                  # engine — pure TS, no framework imports
│   ├── _types.ts
│   ├── _registry.ts
│   ├── _shared/
│   ├── classical/   modern/   encoding/   hash/   fun/   analysis/
│       └── *.ts                  # one file per cipher
│       └── *.viz.svelte          # optional custom viz, colocated
├── components/               # Astro static
├── islands/                  # Svelte interactive
│   ├── visualizers/          # TraceVisualizer, PlaybackControls
│   └── ...
├── lib/
│   ├── url-fragment.ts
│   ├── debounce.ts
│   └── ui/                   # shadcn-svelte components, owned
├── pages/
│   ├── index.astro
│   ├── c/[id].astro
│   ├── about.astro   privacy.astro   404.astro
└── styles/global.css
tests/
├── ciphers/   lib/
```

## UI flow

### Home

Compact navbar (logo slot, About, Privacy, GitHub link). Hero with tagline ("Your friend for ciphers."). Search/filter bar. Card grid of cipher cards styled as tiny calculators.

### Cipher page (`/c/[id]`)

Breadcrumb. Workbench card containing mode toggle, options panel (rendered from `CipherSpec.options`), input textarea, output textarea (read-only with copy). Visualization panel below output with `<PlaybackControls>` and a "Hide visualization" toggle. Action row: Share link / Copy output / Try an example. Collapsible "How it works" section. Related-ciphers rail.

### Privacy page

Plain language: nothing leaves your browser; URL fragments stay client-side; keys are never persisted or shared.

## Data flow (single cipher page)

1. Astro renders `/c/[id]` at build time, mounts `<CipherWorkbench cipher={spec} />`.
2. On mount: parse `location.hash`, populate inputs.
3. On input change: `$derived` recomputes output. Visualization recomputes from same inputs.
4. On option change: same, plus debounced `history.replaceState` to update hash (excluding ephemeral fields).
5. Share link: validate ≤ 6 kB; copy `location.href` to clipboard; toast.

Keys live only in component state; never persisted, never URL-shared.

## Error handling

- **Invalid input**: friendly inline error, not a thrown exception. Each cipher wraps in try/catch and returns a structured error.
- **Async crypto failure**: same friendly inline error.
- **Malformed URL fragment**: ignore unknown keys; fall back to defaults.
- **No JS**: cipher pages render a static notice. Static pages (about, privacy) work without JS.

## Testing strategy

- One `*.test.ts` per cipher in `tests/ciphers/`.
- Reference vectors (NIST for AES-GCM/SHA-256; canonical examples for classical).
- Round-trip property test: `decode(encode(x, opts), opts) === x` for ~100 random strings (seeded).
- Edge cases: empty, all-whitespace, Unicode, very long.
- Trace correctness: `transforms.map(t => t.outChar).join('') === expectedOutput`.
- URL fragment serialize/parse round-trip.
- Ephemeral fields excluded from URL.

CI: vitest on every PR (required check). Build + deploy on push to main.

Out of test scope for v1: visual regression, E2E browser automation.

## Deployment

```
npm run dev      # localhost:4321
npm run build    # → dist/
npm run preview  # serve dist/
npm run test     # vitest
npm run deploy   # build + wrangler pages deploy
```

GitHub Actions workflows in `.github/workflows/`:
- `test.yml` — vitest on every PR.
- `deploy.yml` — test, build, deploy to Cloudflare Pages on push to main.

Required secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

Domain: TBD (subdomain `ciphriend.joshloredo.com` or own apex).

## Visual design tokens (Sodium Lab)

```css
:root {
  --bg:          25 12%  8%;
  --surface:     25 10% 13%;
  --surface-2:   25  9% 17%;
  --border:      25  8% 25%;
  --text:        40 20% 93%;
  --muted:       30  8% 62%;
  --accent:      35 100% 58%;   /* sodium amber */
  --accent-fg:   25 25%  8%;
  --accent-glow: 35 100% 58% / 0.30;
  --danger:       0 70% 60%;
  --success:    140 50% 55%;
}

.font-display { font-family: 'JetBrains Mono', ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace; }
```

JetBrains Mono self-hosted in `public/fonts/` (no third-party requests).

## Out of scope (explicitly punted)

- More ciphers beyond v1.
- Brute-force / cryptanalysis tools beyond frequency analysis.
- File upload / binary inputs (text only).
- PWA / mobile app.
- Theme switching / light mode.
- i18n.
- Analytics.

## Build sequence

### Chunk A — Skeleton + first cipher end-to-end

1. Initialize Astro project (`package.json`, `astro.config.mjs`, `tsconfig.json`, `.nvmrc`, `.gitignore`).
2. Add `@astrojs/svelte`, `@astrojs/tailwind`, theme tokens.
3. Initialize shadcn-svelte (`components.json` + button, card, input, textarea, badge, dialog, toast).
4. Self-host JetBrains Mono in `public/fonts/`.
5. Write `src/ciphers/_types.ts` and `_registry.ts`.
6. Layout: `Layout.astro`, `Navbar.astro`, `Footer.astro`.
7. Caesar engine (`encode`/`decode`/`trace`) + tests.
8. `<TraceVisualizer>` and `<PlaybackControls>` islands.
9. `<CipherWorkbench>` + `<OptionRenderer>` islands.
10. `pages/c/[id].astro` (dynamic route, `getStaticPaths` from registry).
11. `<CipherCard>` + `<CipherGrid>`. `pages/index.astro` with placeholder search.
12. URL fragment serialization (`src/lib/url-fragment.ts`) + tests.
13. `about.astro`, `privacy.astro`, `404.astro` placeholders.
14. Expanded `README.md` and project-specific `CLAUDE.md` rules.
15. GitHub Actions workflows.
16. Verify: `npm install`, `npm run dev`, `npm test`, `npm run build`.
17. **Stop. Hand back for review.**

### Chunk B — Remaining v1 ciphers

ROT13, Atbash, Vigenère (trace). Hex, URL, Binary (no viz). AES-GCM, SHA-256 (NIST vectors). Wire home-page search.

### Chunk C — Custom visualizations

Rail Fence (zigzag). Base64 (bit-grouping). Morse (timing). Frequency Analysis (histogram).

### Chunk D — Deploy + polish

Cloudflare Pages config. First production deploy. Domain. Copy/microcopy/accessibility audit.

## Verification (post-Chunk-A)

1. `npm install` succeeds.
2. `npm run dev` starts on localhost:4321.
3. Home renders with single Caesar card.
4. `/c/caesar` workbench: typing `HELLO` with shift=3 → `KHOOR`.
5. TraceVisualizer shows H→K, E→H, L→O, L→O, O→R with hover detail.
6. ▶ animates 250 ms/step; pause and scrubber work.
7. Reduced-motion suppresses animation.
8. Share link copies URL with valid hash; pasting in new tab restores state.
9. Direct URL like `/c/caesar#c=caesar&m=encode&shift=3&p=SEVMTE8` restores state.
10. `npm test` passes (engine + URL-fragment lib).
11. `npm run build` produces `dist/index.html` and `dist/c/caesar/index.html`.
12. `npx wrangler pages deploy dist --project-name=ciphriend --dry-run` validates.
