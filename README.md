# Ciphriend

> Cipher + friend. Encode, decode, and visualize ciphers in your browser.

**Live (TBD):** `ciphriend.joshloredo.com`

Ciphriend is a small, opinionated web tool for working with ciphers — from classical substitutions (Caesar, Vigenère, Atbash, Rail Fence…) to modern primitives (AES-GCM, SHA-256) and encodings (Base64, hex, URL, binary). Most ciphers come with a per-character visualization so you can *see* what's happening, not just read the output.

Everything runs in your browser. There is no backend.

## Why "Friend"?

Most cipher tools feel like log viewers. Ciphriend wants to feel like the friend who shows you how the trick works.

## Quick start

```bash
nvm use                  # picks up .nvmrc (Node 22 LTS)
npm install
npm run dev              # http://localhost:4321
npm test                 # vitest — default tier (200 prop iterations, fast vectors)
npm run test:thorough    # 5000 iterations + long-message vectors (release gate)
npm run test:full        # everything incl. cross-impl validation
npm run build            # → dist/
```

## What's in v1

| Category | Cipher | Visualization |
|---|---|---|
| Classical | Caesar, ROT13, Atbash, Vigenère | generic trace renderer |
| Classical | Rail Fence | custom (zigzag) |
| Encoding | Base64 | custom (bit grouping) |
| Encoding | Hex, URL, Binary | none in v1 |
| Modern | AES-GCM | none (opaque by design) |
| Hash | SHA-256 | none (opaque by design) |
| Fun | Morse | custom (dit-dah timing) |
| Analysis | Frequency Analysis | custom (histogram) |

`Chunk A` of the build sequence ships with **Caesar only** end-to-end (engine, tests, workbench, share link, visualization). Everything else lands in subsequent chunks; see `docs/superpowers/specs/2026-04-26-ciphriend-design.md`.

## Architecture in one breath

- **Astro 5** static-first MPA, **Svelte 5** islands for interactivity.
- **Cipher engine** (`src/ciphers/`) is pure TypeScript — no framework imports. Every cipher exports a `CipherSpec` and is registered in `_registry.ts`.
- **Visualizations** are either generic (the cipher exports a `trace()` function and the shared `<TraceVisualizer>` renders it) or custom (a colocated `*.viz.svelte`).
- **Sharing** uses URL fragments (`#c=…&p=…`); ephemeral fields (keys/passwords) are never included.
- **Modern crypto** uses native WebCrypto. No `crypto-js`, no polyfills.
- **Theme** is "Sodium Lab" — warm near-black + sodium amber. JetBrains Mono for cipher I/O.

## Test correctness is load-bearing

Every cipher is defended in four layers: hand-written reference vectors (cited from credible sources, in `tests/vectors/`), vendored authoritative vectors for ciphers with formal specs (Project Wycheproof, NIST CAVP, RFCs), property-based tests via `fast-check` (`roundTrip`, `involution`, `determinism`, `traceMatchesOutput` helpers), and explicit edge-case coverage (empty, Unicode, long input). All four are required for a cipher to ship. Details and source-import procedures live in `tests/vectors/README.md` and `CLAUDE.md`.

## Repo layout

```
src/
├── ciphers/                   # the engine (pure TS)
│   ├── _types.ts
│   ├── _registry.ts
│   ├── _shared/
│   └── classical/  modern/  encoding/  hash/  fun/  analysis/
├── components/                # Astro static pieces
├── islands/                   # Svelte interactive
│   └── visualizers/
├── lib/                       # url-fragment, etc.
├── pages/                     # routes
└── styles/global.css          # Tailwind 4 + Sodium Lab tokens
tests/
├── ciphers/                   # per-cipher test files (load vectors, run properties)
├── helpers/                   # vector-runner.ts + properties.ts (fast-check wrappers)
├── lib/                       # url-fragment serializer tests
└── vectors/                   # vendored test vectors (load-bearing — see README inside)
    ├── classical/             # Wikipedia + CrypTool captures
    ├── rfc/                   # RFC test vectors
    ├── nist/                  # NIST CAVP
    └── wycheproof/            # Project Wycheproof (Apache 2.0)
public/
├── fonts/                     # self-hosted JetBrains Mono
├── favicon.svg
└── robots.txt
docs/
└── superpowers/specs/         # design specs
```

## Adding a new cipher

A cipher PR is **not mergeable** until ALL of these are satisfied:

1. `src/ciphers/<category>/<id>.ts` exports a `CipherSpec`.
2. The spec is registered in `src/ciphers/_registry.ts`.
3. A vector file at `tests/vectors/<source>/<id>.json` with at least 5 vectors (hand-cited or vendored from Wycheproof/NIST/RFC).
4. A test file at `tests/ciphers/<id>.test.ts` that loops the vectors via the `vector-runner` helper AND uses the appropriate `properties` helper (`roundTrip`, `involution`, `determinism`, `traceMatchesOutput`).
5. Edge cases covered: empty, all-whitespace, Unicode, long input.
6. (Optional) A `trace()` function for the generic visualizer, or a `<id>.viz.svelte` for a custom one.
7. BOTH `npm test` AND `npm run test:thorough` pass.

If you find yourself editing files outside `src/ciphers/<category>/`, `tests/ciphers/`, `tests/vectors/`, and `_registry.ts`, the abstraction is wrong — flag it before continuing.

See `CLAUDE.md` and `tests/vectors/README.md` for the full rules of engagement.

## Privacy

Ciphriend has no backend. No telemetry. No analytics that touch cipher I/O. Keys and passwords are tab-scoped and never persisted. URL share links keep payloads in the fragment, which browsers do not send to servers. The architecture is the privacy promise.

## License

MIT. See `LICENSE`.
