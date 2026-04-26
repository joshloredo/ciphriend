# Ciphriend

> Cipher + friend. Encode, decode, and visualize ciphers in your browser.

**Live (TBD):** `ciphriend.joshloredo.com`

Ciphriend is a small, opinionated web tool for working with ciphers — from classical substitutions (Caesar, Vigenère, Atbash, Rail Fence…) to modern primitives (AES-GCM, SHA-256) and encodings (Base64, hex, URL, binary). Most ciphers come with a per-character visualization so you can *see* what's happening, not just read the output.

Everything runs in your browser. There is no backend.

## Why "Friend"?

Most cipher tools feel like log viewers. Ciphriend wants to feel like the friend who shows you how the trick works.

## Quick start

```bash
nvm use            # picks up .nvmrc (Node 22 LTS)
npm install
npm run dev        # http://localhost:4321
npm test           # vitest
npm run build      # → dist/
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
├── ciphers/                   # reference vectors per cipher
└── lib/
public/
├── fonts/                     # self-hosted JetBrains Mono
├── favicon.svg
└── robots.txt
docs/
└── superpowers/specs/         # design specs
```

## Adding a new cipher

1. Write `src/ciphers/<category>/<id>.ts` exporting a `CipherSpec`.
2. Add reference-vector tests at `tests/ciphers/<id>.test.ts`.
3. Register the spec in `src/ciphers/_registry.ts`.
4. (Optional) Add a `trace()` for the generic visualizer, or drop a `<id>.viz.svelte` next to the engine for a custom one.

That's it. No other files should need to change. If you find yourself editing other files, the abstraction is wrong — flag it before continuing.

See `CLAUDE.md` for the full rules of engagement.

## Privacy

Ciphriend has no backend. No telemetry. No analytics that touch cipher I/O. Keys and passwords are tab-scoped and never persisted. URL share links keep payloads in the fragment, which browsers do not send to servers. The architecture is the privacy promise.

## License

MIT. See `LICENSE`.
