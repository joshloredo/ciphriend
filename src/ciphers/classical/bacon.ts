import type { CipherSpec } from '../_types';

export type BaconOpts = Record<string, never>;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Encode a letter index 0-25 as a 5-bit A/B pattern. */
function letterToBacon(idx: number): string {
  let out = '';
  for (let bit = 4; bit >= 0; bit--) {
    out += ((idx >> bit) & 1) === 0 ? 'A' : 'B';
  }
  return out;
}

const TABLE: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (let i = 0; i < 26; i++) out[ALPHABET[i]!] = letterToBacon(i);
  return out;
})();

const REVERSE: Record<string, string> = (() => {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(TABLE)) r[v] = k;
  return r;
})();

function encode(input: string): string {
  const words = input.toUpperCase().split(/\s+/).filter(Boolean);
  return words
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

export const bacon: CipherSpec<BaconOpts> = {
  id: 'bacon',
  name: "Bacon's Cipher",
  tagline: 'Each letter as a 5-bit A/B pattern. The first ASCII-style binary, from 1605.',
  category: 'classical',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'Hello', opts: {}, output: 'AABBB AABAA ABABB ABABB ABBBA' },
    { label: 'Phrase', input: 'Bacon was here', opts: {}, output: 'AAAAB AAAAA AAABA ABBBA ABBAB / BABBA AAAAA BAABA / AABBB AABAA BAAAB AABAA' },
  ],
  encode,
  decode,
  viz: () => import('./bacon.viz.svelte'),
};
