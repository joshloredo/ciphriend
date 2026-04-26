## Workflow Orchestration
### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution
### 3. Self-Improvement Loop
- After ANY correction from the user: update 'tasks/lessons.md" with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project
### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check Logs, demonstrate correctness
### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it
### 6. Autonomous Bug Fizing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how
## Task Management
1. **Plan First**: Write plan to 'tasks/todo.md" with checkable items
## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Architectural Patterns
1. **Once a design pattern and architecture has been observed in the codebase, adhere to it strictly.**
2. **Do not break existing design patterns**
3. **If anti-patterns are strictly necessary, ALWAYS ask before implementing them first.**


## Version Control 
1. **ALWAYS get user approval of changes before merging or pulling any changes in**
2. **ALWAYS serve locally and get manual user feedback and approval before merging**
3. **Commit early and often when incremental changes are finished to safeguard regression risks**

---

# Ciphriend — Project-Specific Rules of Engagement

These rules are project-specific and override generic conventions where they conflict. The full design rationale lives in `docs/superpowers/specs/2026-04-26-ciphriend-design.md` — read it before making non-trivial changes.

## What Ciphriend Is

A client-side web tool ("Cipher" + "Friend") for encoding, decoding, and visualizing ciphers. Long-term scope: full cipher hub (classical + modern crypto + encodings + hashes + analysis tools). v1 ships 13 entries. Pure browser execution — no backend, ever.

## Stack & Tooling

| Concern | Choice |
|---|---|
| Framework | Astro 5 (latest) |
| UI islands | Svelte 5 (runes mode) via `@astrojs/svelte` |
| Styling | Tailwind CSS via `@astrojs/tailwind` |
| Component primitives | shadcn-svelte (copy-in, owned in `src/lib/ui/`) |
| Language | TypeScript strict |
| Package manager | npm |
| Testing | Vitest + `@testing-library/svelte` |
| Crypto | WebCrypto (`crypto.subtle`) — no `crypto-js` |
| Lint/format | None initially |
| Hosting | Cloudflare Pages |
| Node | LTS, pinned in `.nvmrc` |

```bash
npm run dev        # Astro dev at localhost:4321
npm run build      # Static output to dist/
npm run preview    # Serve dist/ locally
npm run test       # Vitest
npm run deploy     # Build + wrangler pages deploy
```

## Architecture Invariants

1. **Cipher engine in `src/ciphers/` is pure TypeScript.** It MUST NOT import Svelte, Astro, or any framework runtime. Engine code runs unchanged in Node (for tests) and the browser (for the UI). Violating this breaks tests and portability.
2. **Every cipher exports a `CipherSpec`** (typed in `src/ciphers/_types.ts`) and is registered in `src/ciphers/_registry.ts`. The registry is the single source of truth for which ciphers exist; it drives card rendering, route generation, and search.
3. **WebCrypto is the only dependency for modern crypto.** No `crypto-js`, no `node-forge`, no polyfills for primitives WebCrypto already provides.
4. **Layered model:** UI layer (Astro pages + Svelte islands) → cipher engine → WebCrypto. Never reach across layers; never put UI logic in the engine.

## Privacy Invariants (load-bearing — break with extreme caution)

These are not preferences. They are structural promises Ciphriend makes to its users.

1. **No backend. Ever.** No telemetry endpoints. No analytics that send cipher input/output. No "log this for debugging." The only network traffic is the initial static asset fetch.
2. **Keys/passwords (`ephemeral: true` option fields) are NEVER:**
   - persisted to localStorage / sessionStorage / cookies / IndexedDB
   - included in URL fragments
   - logged to console (in production builds)
   - shipped to any error-tracking service
3. **URL fragments cap at 6 kB.** Above that, refuse to share via link; show "Copy raw output instead." This is enforced in `src/lib/url-fragment.ts`.
4. **No third-party fonts/scripts/CDNs.** Self-host everything. JetBrains Mono lives in `public/fonts/` as woff2.

If you find yourself wanting to break one of these, STOP and ask the user. Don't add disclaimers to compensate; remove the offending feature.

## Visualization Invariants

1. **`trace()` is a pure function.** Same inputs always produce the same `CharTransform[]`. No side effects, no randomness.
2. **Custom `*.viz.svelte` components are pure renderers.** They receive `(input, output, opts, mode, playState)` as props and render based on those alone — no fetching, no global state, no localStorage.
3. **All visualizations honor `prefers-reduced-motion`.** When reduced motion is requested, transforms render instantly with no movement. The information must remain conveyable without animation.
4. **Graceful degradation on long inputs.** Custom visualizations must collapse with a "visualization disabled for inputs > N" notice when input length exceeds their performance budget. The cipher itself always runs regardless.
5. **Generic `<TraceVisualizer>` is the default.** Custom Svelte visualizations are an escape hatch for ciphers whose natural visualization isn't a 1:1 char map. Don't write a custom visualizer when `trace()` would do.

## Conventions

- **Astro `.astro` files for static structure; Svelte `.svelte` only for interactive islands.** No SPA-ifying — Astro is MPA + islands by design.
- **Tailwind classes only.** Avoid scoped `<style>` blocks unless absolutely necessary (e.g., a complex animation). Theme tokens live as CSS custom properties in `src/styles/global.css` so the accent color is swappable.
- **shadcn-svelte components are owned in repo (`src/lib/ui/`).** Modify them in place; do not wrap them in adapter components.
- **Friendly tone in microcopy.** Button labels, empty states, error messages — write them like a friend, not a CI log. The product is named Ciphriend; act like it.
- **Comments are rare.** Code names should explain WHAT. Reserve comments for non-obvious WHY (a hidden invariant, a workaround for a specific bug). Don't write JSDoc for every function.

## Testing Posture (load-bearing)

Cipher correctness is **the** load-bearing concern of this project. A bug in a cipher that ships silently produces wrong output that users may trust — that is materially worse than almost any other class of bug we could ship. Treat the test infrastructure with the same gravity as the privacy invariants.

### Layered defense

Every cipher in production must satisfy ALL FOUR of:

1. **Hand-written reference vectors**, cited from a credible source, stored in `tests/vectors/<source>/<id>.json` and consumed via `loadVectors()` + `runnableVectors()` from `tests/helpers/vector-runner.ts`. At least 5 vectors covering the canonical case + edge cases.
2. **Vendored authoritative vectors** for any cipher with a formal spec (AES-GCM → Wycheproof; SHA-256 → Wycheproof + NIST CAVP; Base64 → RFC 4648 §10; etc.). Pinned to a specific commit/version. License files preserved.
3. **Property-based tests** via `fast-check`, using the helpers in `tests/helpers/properties.ts`:
   - `roundTrip()` for reversible ciphers
   - `involution()` for self-inverse ciphers (Atbash, ROT13)
   - `determinism()` for hashes and pure encodings
   - `traceMatchesOutput()` whenever the cipher exports `trace()` — guards against drift between the visualizer and the engine.
4. **Edge case coverage**: empty input, all-whitespace, Unicode (combining marks + emoji), single-character input, very long input (≥10 KB) flagged `["long-message"]` so it only runs at thorough+ tiers.

### Test tiers

| Script | Vectors run | Property iterations | Use |
|---|---|---|---|
| `npm test` | All except `flags: ["thorough-only", "full-only", "long-message"]` | 200 | Every PR (must pass before merge) |
| `npm run test:thorough` | Adds `long-message` and `thorough-only` flagged vectors | 5000 | Pre-release / nightly |
| `npm run test:full` | Adds `full-only` (cross-impl validation) | 5000 | Manual / paranoia |

`npm test` AND `npm run test:thorough` MUST be green before any production deploy. CI runs `npm test` automatically on every PR.

### Adding new test vectors

- Vector files live in `tests/vectors/<wycheproof|nist|rfc|classical>/<file>.json`.
- See `tests/vectors/README.md` for the file format and source-import procedures.
- Vendor sources MUST be pinned to a specific commit hash, release tag, or document number — NEVER `main`/`latest`.
- Each vector file's `source` field MUST identify exactly where the data came from; for classical-cipher captures, cite the URL of the tool used (CrypTool, dCode) and the date.
- License files for vendored sources (Wycheproof's LICENSE, etc.) MUST be preserved verbatim alongside the vectors.

### Drift detection

If our implementation starts failing a vector that previously passed, the bug is in our implementation. Do NOT update the vector to match the new (broken) output. Investigate the regression first.

If a vendored upstream file has actually changed (Wycheproof releases an update, NIST republishes), that update is a deliberate, separately-reviewable PR — never combined with feature work.

Out of scope for v1: visual regression testing, E2E browser automation. Both are good ideas for v2; both are over-engineering for v1.

## Visual Identity

- **Theme: Sodium Lab** — warm near-black base + sodium amber accent. CSS tokens defined in `src/styles/global.css`. Do not introduce new color tokens; use the existing palette.
- **Display mono: JetBrains Mono** for cipher I/O panels. Self-hosted in `public/fonts/`.
- **Mental model: "cyberpunk pocket calculator."** Each cipher card looks like a tiny calculator face. Vintage CRT / 70s lab equipment / friendly hacker den. Restraint over excess. Subtle amber glows on focus, gentle micro-animations.
- **Logo:** the user will provide an SVG. Until then, `<Navbar>` renders a `<Logo />` placeholder slot. Don't invent a logo.
- **Never drift toward generic dashboard UI** (cool blue accents, neutral gray surfaces, sans-everywhere). If you catch yourself reaching for `bg-slate-950 text-blue-400`, stop.

## Adding a New Cipher (the recipe)

A cipher PR is **not mergeable** until ALL of these are satisfied. There are no exceptions for "just for now" or "we'll add tests later."

1. Create `src/ciphers/<category>/<id>.ts` exporting a `CipherSpec`.
2. Register the spec in `src/ciphers/_registry.ts`.
3. **Vectors** (`tests/vectors/<source>/<id>.json`):
   - At least 5 hand-written reference vectors, each citing a source in its `comment` field.
   - For ciphers with formal specs (AES, SHA, HMAC, Base64), vendor the relevant authoritative file (Wycheproof / NIST / RFC) — see `tests/vectors/README.md`.
4. **Tests** (`tests/ciphers/<id>.test.ts`):
   - Loop through vectors via `loadVectors()` + `runnableVectors()` from `tests/helpers/vector-runner.ts`.
   - Property test the cipher's invariant via `roundTrip()` / `involution()` / `determinism()` from `tests/helpers/properties.ts`.
   - If the cipher exports `trace()`, also assert `traceMatchesOutput()`.
   - Cover edge cases: empty input, all-whitespace, Unicode, single char, long input.
5. **Visualization (optional)**:
   - Substitution-style? Add a `trace()` function (set `op` for the middle row). The generic `<TraceVisualizer>` renders it for free.
   - Needs something custom? Drop a `<id>.viz.svelte` next to the engine file and point `viz` at it.
6. Verify locally: BOTH `npm test` AND `npm run test:thorough` pass.

**If you find yourself editing files outside `src/ciphers/<category>/`, `tests/ciphers/`, `tests/vectors/`, and `src/ciphers/_registry.ts`, the abstraction is wrong — flag it before continuing.**

## Deployment

- **Cloudflare Pages**, project name `ciphriend`. CI via GitHub Actions (`.github/workflows/deploy.yml`).
- **Required secrets** in GitHub: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- **Manual deploy:** `npx wrangler pages deploy dist --project-name=ciphriend`.
- **Domain:** TBD (subdomain `ciphriend.joshloredo.com` or own apex).

## Out of Scope (don't drift here without an explicit user request)

- Backend services / accounts / cross-device sync
- Brute-force / cryptanalysis tools beyond v1's frequency analysis
- File upload / binary inputs (text only for v1)
- PWA / install banner / offline service worker
- Theme switching / light mode
- i18n
- Analytics

If a request seems to require any of these, surface the conflict before implementing.
