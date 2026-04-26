# Adding a Cipher to Ciphriend

A worked walkthrough. Use this when you want a concrete example to follow; use `CLAUDE.md`'s "Adding a New Cipher" section for the rules.

## The five files (and nothing else)

```
src/ciphers/<category>/<id>.ts            ← engine
src/ciphers/_registry.ts                  ← register one line
tests/vectors/<source>/<id>.json          ← reference cases
tests/ciphers/<id>.test.ts                ← test file
src/ciphers/<category>/<id>.viz.svelte    ← optional custom viz
```

If your change touches anything outside this set — `pages/`, `components/`, `islands/`, the workbench, the layout — **the abstraction is wrong.** Stop and reconsider.

## Walkthrough: build a Bacon variant called "Bacon-Inverted"

Imagine we want to ship Bacon's cipher but with the bits flipped (B for 0, A for 1). Same alphabet, same 5-bit pattern, just the polarity reversed. Categorize: **classical**.

### Step 1 — engine (`src/ciphers/classical/bacon-inverted.ts`)

```typescript
import type { CipherSpec } from '../_types';

export type BaconInvertedOpts = Record<string, never>;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function letterToInverted(idx: number): string {
  let out = '';
  for (let bit = 4; bit >= 0; bit--) {
    out += ((idx >> bit) & 1) === 0 ? 'B' : 'A';
  }
  return out;
}

const TABLE: Record<string, string> = (() => {
  const t: Record<string, string> = {};
  for (let i = 0; i < 26; i++) t[ALPHABET[i]!] = letterToInverted(i);
  return t;
})();

const REVERSE: Record<string, string> = (() => {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(TABLE)) r[v] = k;
  return r;
})();

function encode(input: string): string {
  return input
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      [...word]
        .map((ch) => TABLE[ch])
        .filter((tok): tok is string => Boolean(tok))
        .join(' '),
    )
    .filter(Boolean)
    .join(' / ');
}

function decode(input: string): string {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return '';
  return trimmed
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .split(/\s+/)
        .filter(Boolean)
        .map((tok) => REVERSE[tok] ?? '?')
        .join(''),
    )
    .join(' ');
}

export const baconInverted: CipherSpec<BaconInvertedOpts> = {
  id: 'bacon-inverted',
  name: 'Bacon (Inverted)',
  tagline: "Bacon's cipher with the polarity flipped — A for 1, B for 0.",
  category: 'classical',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'Hello', opts: {}, output: 'BBAAA BBABB BABAA BABAA BAAAB' },
  ],
  encode,
  decode,
};
```

Key decisions:
- `id` is kebab-case URL slug; this becomes `/c/bacon-inverted`.
- `OptsType = Record<string, never>` because the cipher takes no options. If you have options, type them properly (see `caesar.ts`).
- No `viz` field → no visualization. We could add a `viz: () => import('./bacon-inverted.viz.svelte')` later.

### Step 2 — register (`src/ciphers/_registry.ts`)

Add the import + the array entry. Keep the order grouped by category for readability.

```typescript
import { baconInverted } from './classical/bacon-inverted';
// …
export const ciphers: CipherSpec[] = [
  // …other classical ciphers…
  bacon as CipherSpec,
  baconInverted as CipherSpec,  // ← here
  polybius as CipherSpec,
  // …
];
```

### Step 3 — vectors (`tests/vectors/classical/bacon-inverted.json`)

```json
{
  "source": "Hand-written: Bacon's cipher with bit polarity reversed (A↔B). Verified against the standard Bacon table.",
  "license": "Captured outputs.",
  "version": "captured 2026-04-26",
  "imported": "2026-04-26",
  "vectors": [
    {
      "id": "single-A",
      "comment": "A is index 0 → all-B pattern after inversion.",
      "input": "A",
      "opts": {},
      "expected": "BBBBB",
      "mode": "encode"
    },
    {
      "id": "single-Z",
      "comment": "Z is index 25 → AABBA after inversion.",
      "input": "Z",
      "opts": {},
      "expected": "AABBA",
      "mode": "encode"
    },
    {
      "id": "hello",
      "comment": "Five letters → five 5-letter groups.",
      "input": "Hello",
      "opts": {},
      "expected": "BBAAA BBABB BABAA BABAA BAAAB",
      "mode": "encode"
    },
    {
      "id": "decode-roundtrip",
      "comment": "Decode recovers the uppercase original.",
      "input": "BBAAA BBABB BABAA BABAA BAAAB",
      "opts": {},
      "expected": "HELLO",
      "mode": "decode"
    },
    {
      "id": "non-letter-skipped",
      "comment": "Digits and punctuation drop on encode.",
      "input": "Hi 42!",
      "opts": {},
      "expected": "BBAAA BABBB",
      "mode": "encode"
    },
    {
      "id": "empty",
      "comment": "Empty input.",
      "input": "",
      "opts": {},
      "expected": "",
      "mode": "encode"
    }
  ]
}
```

Every vector cites its source in the `comment` field. The file's top-level `source` documents where the family of vectors comes from.

### Step 4 — tests (`tests/ciphers/bacon-inverted.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { baconInverted, type BaconInvertedOpts } from '../../src/ciphers/classical/bacon-inverted';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { fc } from '../helpers/properties';

const file = loadVectors<BaconInvertedOpts>('classical/bacon-inverted.json');

describe('bacon-inverted — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? baconInverted.encode! : baconInverted.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('bacon-inverted — properties', () => {
  const wordArb = fc.stringMatching(/^[A-Z]{1,8}$/);
  const inputArb = fc
    .array(wordArb, { minLength: 1, maxLength: 4 })
    .map((words) => words.join(' '));

  it('round-trip for upper-case A-Z words', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        return baconInverted.decode!(baconInverted.encode!(input, {}) as string, {}) === input;
      }),
    );
  });

  it('every encoded token is exactly 5 chars of A or B', () => {
    fc.assert(
      fc.property(wordArb, (word) => {
        const encoded = baconInverted.encode!(word, {}) as string;
        return encoded.split(' ').every((t) => /^[AB]{5}$/.test(t));
      }),
    );
  });
});
```

### Step 5 — verify

```bash
npm test                  # 200 prop iterations, fast vectors
npm run test:thorough     # 5000 iterations + thorough flagged vectors
npm run build             # produces /c/bacon-inverted/index.html
```

Visit `http://localhost:4321/c/bacon-inverted` after `npm run dev`. The home-page filter chips will show the new cipher in `classical (N+1)` automatically — no UI changes needed.

## When to reach for a custom viz

If your cipher is row-of-cells substitution (each input char → one output char), `trace()` + the generic `<TraceVisualizer>` is almost always what you want. Reach for a custom `*.viz.svelte` only when:

- **Output positions don't match input positions** (transposition like Rail Fence)
- **The visualization is the output** (Frequency histogram, Braille's dot grid, Polybius's grid lookup)
- **There's a unique structural element** worth showing (Base64's bit grouping, Morse's timing, Bacon's 5-bit pattern)

Look at these for templates:

| Custom viz pattern | Reference component |
|---|---|
| Grid with active cell highlight | `src/ciphers/classical/polybius.viz.svelte` |
| Multi-row layout (rails / pages) | `src/ciphers/classical/rail-fence.viz.svelte` |
| Bit-level visual | `src/ciphers/classical/bacon.viz.svelte`, `src/ciphers/encoding/base64.viz.svelte` |
| Timing rhythm | `src/ciphers/fun/morse.viz.svelte`, `src/ciphers/classical/tap-code.viz.svelte` |
| Letter cards | `src/ciphers/fun/nato.viz.svelte` |
| Histogram | `src/ciphers/analysis/frequency.viz.svelte` |
| Word-level transform | `src/ciphers/fun/pig-latin.viz.svelte` |
| Per-letter dot pattern | `src/ciphers/encoding/braille.viz.svelte` |

## Common mistakes

1. **Hardcoding the cipher count or category list anywhere outside the registry.** The home-page filter chips, route generation, and search all read from `_registry.ts` — keep it the source of truth.
2. **Skipping the `traceMatchesOutput` property test for trace-based ciphers.** This catches drift between your visualizer and your engine. Always include it.
3. **Putting cipher state in localStorage.** No state survives a tab close. Even reasonable-feeling caches violate the privacy promise.
4. **Adding a `<style>` block to a viz component instead of using Tailwind utilities.** The global theme tokens live in `src/styles/global.css`; per-component styles drift over time. Stick to utilities.
5. **Marking a non-secret option as `ephemeral`.** Vigenère's key is NOT ephemeral (it's part of the cipher recipe and *should* be in share links). AES-GCM's passphrase IS ephemeral. The test: would a friend need it to decode the message? If yes, not ephemeral.
6. **Editing the workbench or visualizers to accommodate a new cipher.** If your cipher needs the workbench to do something new, you've found a gap in the spec — flag it. Don't bend the architecture.
