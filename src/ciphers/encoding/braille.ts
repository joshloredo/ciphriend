import type { CipherSpec } from '../_types';

export type BrailleOpts = Record<string, never>;

/**
 * Grade 1 (uncontracted) English Braille for letters A-Z.
 * Each letter's 6-dot pattern is encoded as a list of dot positions:
 *   1 4
 *   2 5
 *   3 6
 * Dots map to bits 0-5 of the offset from U+2800.
 */
const PATTERNS: Record<string, number[]> = {
  A: [1], B: [1,2], C: [1,4], D: [1,4,5], E: [1,5],
  F: [1,2,4], G: [1,2,4,5], H: [1,2,5], I: [2,4], J: [2,4,5],
  K: [1,3], L: [1,2,3], M: [1,3,4], N: [1,3,4,5], O: [1,3,5],
  P: [1,2,3,4], Q: [1,2,3,4,5], R: [1,2,3,5], S: [2,3,4], T: [2,3,4,5],
  U: [1,3,6], V: [1,2,3,6], W: [2,4,5,6], X: [1,3,4,6], Y: [1,3,4,5,6],
  Z: [1,3,5,6],
};

const BRAILLE_BASE = 0x2800;

function dotsToCodePoint(dots: number[]): number {
  let mask = 0;
  for (const d of dots) mask |= 1 << (d - 1);
  return BRAILLE_BASE + mask;
}

const ENCODE_TABLE: Record<string, string> = (() => {
  const t: Record<string, string> = {};
  for (const [letter, dots] of Object.entries(PATTERNS)) {
    t[letter] = String.fromCodePoint(dotsToCodePoint(dots));
  }
  return t;
})();

const DECODE_TABLE: Record<string, string> = (() => {
  const t: Record<string, string> = {};
  for (const [letter, glyph] of Object.entries(ENCODE_TABLE)) t[glyph] = letter;
  return t;
})();

/** Get the dot positions for a letter. Used by the visualizer. */
export function dotsFor(letter: string): number[] | null {
  return PATTERNS[letter.toUpperCase()] ?? null;
}

/** Whether a code point is in the Braille block U+2800-U+28FF. */
function isBraille(cp: number): boolean {
  return cp >= 0x2800 && cp <= 0x28ff;
}

function encode(input: string): string {
  let out = '';
  for (const ch of input.toUpperCase()) {
    const glyph = ENCODE_TABLE[ch];
    if (glyph) {
      out += glyph;
    } else if (ch === ' ') {
      out += '⠀'; // blank braille cell as word separator
    }
    // Other characters are dropped silently.
  }
  return out;
}

function decode(input: string): string {
  let out = '';
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp === 0x2800) {
      out += ' ';
      continue;
    }
    if (!isBraille(cp)) continue;
    out += DECODE_TABLE[ch] ?? '?';
  }
  return out;
}

export const braille: CipherSpec<BrailleOpts> = {
  id: 'braille',
  name: 'Braille',
  tagline: 'Tactile script for the visually impaired. Six-dot patterns per letter (Grade 1).',
  category: 'encoding',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'Hello', opts: {}, output: '⠓⠑⠇⠇⠕' },
    { label: 'Hi friend', input: 'Hi friend', opts: {}, output: '⠓⠊⠀⠋⠗⠊⠑⠝⠙' },
  ],
  encode,
  decode,
  viz: () => import('./braille.viz.svelte'),
};
