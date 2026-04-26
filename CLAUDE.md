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

A client-side web tool ("Cipher" + "Friend") for encoding, decoding, and visualizing ciphers. **Live at https://ciphriend.joshloredo.com.** Long-term scope: full cipher hub. Pure browser execution — no backend, ever.

### Current cipher catalog (23 entries)

| Category | id | Name | Notes |
|---|---|---|---|
| classical | `caesar` | Caesar | trace viz, `+N` op |
| classical | `rot13` | ROT13 | trace viz, `+13` op, involution |
| classical | `atbash` | Atbash | trace viz, `↔` op, involution |
| classical | `vigenere` | Vigenère | trace viz, `K(+N)` op, key-cycle group |
| classical | `rail-fence` | Rail Fence | custom viz (zigzag grid) |
| classical | `affine` | Affine | trace viz, math op |
| classical | `bacon` | Bacon's Cipher | custom viz (5-bit A/B grid) |
| classical | `polybius` | Polybius Square | custom viz (5×5 grid) |
| classical | `tap-code` | Tap Code | custom viz (tap rhythm) |
| encoding | `base64` | Base64 | custom viz (24-bit window), RFC 4648 vectors |
| encoding | `hex` | Hex | no viz |
| encoding | `url` | URL | no viz |
| encoding | `binary` | Binary | no viz |
| encoding | `braille` | Braille | custom viz (2×3 dot grid) |
| hash | `sha-256` | SHA-256 | no viz, NIST vectors, async |
| modern | `aes-gcm` | AES-GCM | no viz, ephemeral passphrase, async |
| fun | `morse` | Morse | custom viz (dit-dah timing) |
| fun | `reverse` | Reverse | trace viz, `↶` op, involution |
| fun | `spongebob` | SpongeBob | trace viz, `↑↓` op, encode === decode |
| fun | `leet` | Leet (1337) | trace viz, encode-only (ambiguous decode) |
| fun | `nato` | NATO Phonetic | custom viz (letter cards) |
| fun | `pig-latin` | Pig Latin | custom viz (word transform), encode-only |
| analysis | `frequency` | Frequency Analysis | custom viz (histogram), encode-only |

Categories: `classical | modern | encoding | hash | fun | analysis`. Adding a new category requires updating `CipherCategory` in `src/ciphers/_types.ts`; the home-page filter chips populate from the registry automatically.

Deferred to a future session: Pigpen, Music note, Semaphore, Dancing Men, Zalgo. See `docs/superpowers/specs/2026-04-26-cipher-backlog.md`.

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
| Node | 24 (current LTS), pinned in `.nvmrc`. CI uses `actions/checkout@v6` + `actions/setup-node@v6` to satisfy GitHub's June 2026 Node-20 deprecation. |

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
4. **No third-party fonts/scripts/CDNs in our authored code.** Self-host everything we ship. JetBrains Mono lives in `public/fonts/` as woff2. Do not add `<script src="https://...">` or external font/CSS imports.

   **Accepted platform-level exception:** Cloudflare Pages auto-injects a Web Analytics beacon (`static.cloudflareinsights.com/beacon.min.js`) on every page. This was an explicit user decision to keep enabled — it tracks aggregate pageview metrics only, never sees URL fragments (where cipher I/O lives), and is part of the hosting platform rather than something we author. If you want this disabled, the toggle is in the Cloudflare Pages project settings; do not attempt to suppress it from the HTML directly (it'll be re-injected on next deploy).

If you find yourself wanting to break any of #1-3 above, STOP and ask the user. Don't add disclaimers to compensate; remove the offending feature.

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

A cipher PR is **not mergeable** until ALL of these are satisfied. There are no exceptions for "just for now" or "we'll add tests later." For a worked walkthrough with code samples, see `docs/adding-a-cipher.md`.

### The five files

You'll touch exactly five files (the engine, the registry, the vector JSON, the test, and optionally a viz component). If you find yourself editing anything outside this set, **the abstraction is wrong — flag it before continuing.**

1. **`src/ciphers/<category>/<id>.ts`** — the engine. Exports a `CipherSpec`. Pure TypeScript, no framework imports. Pick the category that fits (`classical | modern | encoding | hash | fun | analysis`).
2. **`src/ciphers/_registry.ts`** — add an `import` for your spec and push it into the `ciphers` array.
3. **`tests/vectors/<source>/<id>.json`** — at least 5 hand-written reference vectors. Each MUST cite a source in its `comment` field. Source folders:
   - `wycheproof/` — vendored from C2SP/Wycheproof (Apache 2.0). Pin to a commit.
   - `nist/` — NIST CAVP / FIPS document references.
   - `rfc/` — IETF RFC test tables. Cite section.
   - `classical/` — hand-written classical cipher cases (Wikipedia / CrypTool / dCode cross-checked).
   - `encoding/` — hand-written encoding cases (Hex, URL, Binary, Morse, Reverse, etc.) cross-checked against platform globals.
   - `modern/` — Ciphriend-generated decode-only fixtures for composite schemes (e.g., AES-GCM with PBKDF2). Don't put non-composite modern crypto here — vendor Wycheproof.
4. **`tests/ciphers/<id>.test.ts`** — the test file. Always uses `loadVectors()` + `runnableVectors()` to consume the JSON, plus a property helper from `tests/helpers/properties.ts`.
5. **`src/ciphers/<category>/<id>.viz.svelte`** *(optional)* — custom Svelte viz component. Only when `trace()`-based viz won't fit.

### When to use which property helper

| Property | Use when | Examples |
|---|---|---|
| `roundTrip` | The cipher is reversible — `decode(encode(x, k), k) === x` | Caesar, Vigenère, Base64, Affine, Polybius, Bacon, Rail Fence |
| `involution` | The cipher is its own inverse | ROT13, Atbash, Reverse, SpongeBob |
| `determinism` | One-way (no decode) but deterministic | SHA-256, Frequency |
| `traceMatchesOutput` | The cipher exports `trace()` | Every trace-based cipher (catches drift between viz and engine) |

For non-deterministic ciphers (AES-GCM with random salt/IV), use a custom round-trip property that re-encrypts and decrypts; see `tests/ciphers/aes-gcm.test.ts`.

### Visualization decision tree

```
Does each input character produce one output character?
├── YES → add `trace(input, opts, mode) → CharTransform[]` to the spec.
│         The generic <TraceVisualizer> renders it for free.
│         Set the `op` field for the middle row glyph (see conventions below).
│
└── NO → drop a colocated `<id>.viz.svelte` and point `viz` at it.
         The component receives (input, output, opts, mode) as props.
         Component must be a pure renderer — no fetching, no global state.
```

**`op` glyph conventions (trace-based viz)**

| Pattern | Glyph | Used by |
|---|---|---|
| Numeric shift | `+N` / `-N` | Caesar, ROT13, Affine, Reverse-as-shift |
| Mirror | `↔` | Atbash |
| Polyalphabetic | `K(+N)` (key letter + shift) | Vigenère |
| Substitution | the digit/symbol replacing the letter | Leet (`3` for `e`) |
| Reversal | `↶` | Reverse |
| Case toggle | `↑` / `↓` | SpongeBob |
| Pass-through | `·` | non-letter chars in any cipher |

When in doubt, keep the glyph short (≤4 chars) and use the verbose form in `detail` for the hover tooltip.

### Templates by cipher shape

| Your cipher looks like… | Copy from |
|---|---|
| Caesar with a different shift schedule | `src/ciphers/classical/caesar.ts` |
| Polyalphabetic with a key | `src/ciphers/classical/vigenere.ts` |
| Involution (encode === decode) | `src/ciphers/classical/atbash.ts` or `src/ciphers/fun/rot13.ts` |
| Substitution table | `src/ciphers/fun/leet.ts` (encode-only) |
| Word-level transform | `src/ciphers/fun/pig-latin.ts` (custom viz, encode-only) |
| Bytes-in / bytes-out encoding | `src/ciphers/encoding/base64.ts` |
| Hash (one-way) | `src/ciphers/hash/sha-256.ts` |
| Authenticated encryption | `src/ciphers/modern/aes-gcm.ts` |
| Transposition (output positions ≠ input positions) | `src/ciphers/classical/rail-fence.ts` |
| Grid lookup (5×5) | `src/ciphers/classical/polybius.ts` |
| Analysis (encode-only, output is summary) | `src/ciphers/analysis/frequency.ts` |

### Verify checklist

Before opening a PR (or before saying "done"):

- [ ] `npm test` green
- [ ] `npm run test:thorough` green
- [ ] `npm run build` produces a route at `/c/<your-id>/` with no errors
- [ ] Vector file's `source` cites where the cases came from
- [ ] If keys/secrets are involved, the option field is `kind: 'password'` or `ephemeral: true`
- [ ] Visited `localhost:4321/c/<your-id>` and confirmed the workbench renders correctly
- [ ] If trace-based viz, the `op` glyph is short and informative
- [ ] If custom viz, it honors prefers-reduced-motion (covered globally; don't add inline animations that bypass)

## Deployment

**Live at https://ciphriend.joshloredo.com**, hosted on Cloudflare Pages (project name `ciphriend`).

### Active deploy path: local CLI (Path A)

We deploy from the developer's machine via wrangler:

```bash
npm run deploy
# = astro build && wrangler pages deploy dist --project-name=ciphriend
```

Wrangler authenticates via OAuth (`npx wrangler login`, one-time browser flow). The OAuth credential persists in `~/Library/Preferences/.wrangler/config/` on macOS.

**Before deploying:** run `npm test` and `npm run test:thorough`. Both must pass — production deploys without test gating are technically possible from a local machine, but our discipline is to gate. CI (`test.yml`) runs the same suite on every push as a backstop.

### Dormant: GitHub Actions auto-deploy (Path B)

`.github/workflows/deploy.yml` runs `npm ci → npm test → npm run build` on every push to `main` (the test step is the live CI backstop). The deploy step is **gated** on the two Cloudflare secrets being present:

- `CLOUDFLARE_API_TOKEN` — generate at https://dash.cloudflare.com/profile/api-tokens
- `CLOUDFLARE_ACCOUNT_ID` — `npx wrangler whoami` shows it

When the secrets are absent (current default), the deploy step is skipped via `if: env.CLOUDFLARE_API_TOKEN != '' && env.CLOUDFLARE_ACCOUNT_ID != ''` and the workflow goes green. Tests still run. To enable auto-deploy later: `gh secret set CLOUDFLARE_API_TOKEN` + `gh secret set CLOUDFLARE_ACCOUNT_ID`. No workflow file edit needed — the existing `if:` will start matching. Path A and B can coexist; whichever runs last wins.

### Domain

- Custom domain `ciphriend.joshloredo.com` is configured at the Pages project level (Cloudflare dashboard → Pages → ciphriend → Custom domains). DNS auto-managed because `joshloredo.com` is in the same Cloudflare account.
- Default URL `ciphriend.pages.dev` also still works — same files, no SSL difference.

## Out of Scope (don't drift here without an explicit user request)

- Backend services / accounts / cross-device sync
- Brute-force / cryptanalysis tools beyond the existing frequency analysis
- File upload / binary inputs (text only)
- PWA / install banner / offline service worker
- Theme switching / light mode
- i18n
- Analytics that we author or that touch cipher I/O (the platform-level Cloudflare beacon is documented as an accepted exception; don't add more)

If a request seems to require any of these, surface the conflict before implementing.
