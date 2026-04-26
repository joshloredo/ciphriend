import type { CipherSpec } from '../_types';

export type TapCodeOpts = Record<string, never>;

/**
 * Standard Tap Code 5×5 grid: C and K share the same cell. Encoding K
 * produces the same taps as C. Decoding (1,3) always returns C.
 */
export const TAP_GRID: readonly (readonly string[])[] = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'J'],
  ['L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z'],
];

export function letterToTaps(ch: string): [number, number] | null {
  let normalized = ch.toUpperCase();
  if (normalized === 'K') normalized = 'C';
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (TAP_GRID[r]![c] === normalized) return [r + 1, c + 1];
    }
  }
  return null;
}

function tapsToLetter(r: number, c: number): string | null {
  if (r < 1 || r > 5 || c < 1 || c > 5) return null;
  return TAP_GRID[r - 1]![c - 1] ?? null;
}

function dots(n: number): string {
  return '.'.repeat(n);
}

function encode(input: string): string {
  const wordChunks: string[] = [];
  for (const word of input.toUpperCase().split(/\s+/).filter(Boolean)) {
    const tokens: string[] = [];
    for (const ch of word) {
      const taps = letterToTaps(ch);
      if (taps) tokens.push(`${dots(taps[0])} ${dots(taps[1])}`);
    }
    if (tokens.length > 0) wordChunks.push(tokens.join('  '));
  }
  return wordChunks.join(' / ');
}

function decode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const wordChunks = trimmed.split(/\s*\/\s*/);
  return wordChunks
    .map((chunk) => {
      // Split on 2+ spaces (letter boundary)
      const letterTokens = chunk.split(/\s{2,}/).map((t) => t.trim()).filter(Boolean);
      return letterTokens
        .map((letter) => {
          const parts = letter.split(/\s+/);
          if (parts.length !== 2) return '?';
          const r = parts[0]!.length;
          const c = parts[1]!.length;
          if (r < 1 || r > 5 || c < 1 || c > 5) return '?';
          if (!/^\.+$/.test(parts[0]!) || !/^\.+$/.test(parts[1]!)) return '?';
          return tapsToLetter(r, c) ?? '?';
        })
        .join('');
    })
    .join(' ');
}

export const tapCode: CipherSpec<TapCodeOpts> = {
  id: 'tap-code',
  name: 'Tap Code',
  tagline: 'Each letter as two clusters of taps — row count, then column count. C and K share a cell.',
  category: 'classical',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'HELLO', opts: {}, output: '.. ...  . .....  ... .  ... .  ... ....' },
    { label: 'SOS', input: 'SOS', opts: {}, output: '.... ...  ... ....  .... ...' },
  ],
  encode,
  decode,
  viz: () => import('./tap-code.viz.svelte'),
};
