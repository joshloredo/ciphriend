import type { CipherSpec } from '../_types';

export type PolybiusOpts = Record<string, never>;

/**
 * Standard 5×5 Polybius grid with I/J merged into one cell.
 * Encoding J produces the same coordinates as I; decoding (2,4) always
 * returns I (J never appears in decoded output).
 */
export const GRID: readonly (readonly string[])[] = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'K'],
  ['L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z'],
];

export function letterToCoords(ch: string): [number, number] | null {
  let normalized = ch.toUpperCase();
  if (normalized === 'J') normalized = 'I';
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (GRID[r]![c] === normalized) return [r + 1, c + 1];
    }
  }
  return null;
}

function coordsToLetter(r: number, c: number): string | null {
  if (r < 1 || r > 5 || c < 1 || c > 5) return null;
  return GRID[r - 1]![c - 1] ?? null;
}

function encode(input: string): string {
  const tokens: string[] = [];
  for (const ch of input) {
    const coords = letterToCoords(ch);
    if (coords) tokens.push(`${coords[0]}${coords[1]}`);
  }
  return tokens.join(' ');
}

function decode(input: string): string {
  const cleaned = input.replace(/\s+/g, '');
  if (cleaned === '') return '';
  if (cleaned.length % 2 !== 0) {
    throw new Error('Polybius input must have an even number of digits.');
  }
  if (!/^[1-5]+$/.test(cleaned)) {
    throw new Error('Polybius digits must be in the range 1-5.');
  }
  let out = '';
  for (let i = 0; i < cleaned.length; i += 2) {
    const r = parseInt(cleaned[i]!, 10);
    const c = parseInt(cleaned[i + 1]!, 10);
    const letter = coordsToLetter(r, c);
    if (!letter) throw new Error(`Invalid coordinate ${r}${c}.`);
    out += letter;
  }
  return out;
}

export const polybius: CipherSpec<PolybiusOpts> = {
  id: 'polybius',
  name: 'Polybius Square',
  tagline: 'Each letter encoded as its (row, column) in a 5×5 grid. I and J share a cell.',
  category: 'classical',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'HELLO', opts: {}, output: '23 15 31 31 34' },
    { label: 'Long', input: 'POLYBIUS', opts: {}, output: '35 34 31 54 12 24 45 43' },
  ],
  encode,
  decode,
  viz: () => import('./polybius.viz.svelte'),
};
