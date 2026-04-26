import type { CipherSpec } from '../_types';

export type NatoOpts = Record<string, never>;

const TABLE: Record<string, string> = {
  A: 'Alpha',  B: 'Bravo',   C: 'Charlie', D: 'Delta',
  E: 'Echo',   F: 'Foxtrot', G: 'Golf',    H: 'Hotel',
  I: 'India',  J: 'Juliet',  K: 'Kilo',    L: 'Lima',
  M: 'Mike',   N: 'November',O: 'Oscar',   P: 'Papa',
  Q: 'Quebec', R: 'Romeo',   S: 'Sierra',  T: 'Tango',
  U: 'Uniform',V: 'Victor',  W: 'Whiskey', X: 'X-ray',
  Y: 'Yankee', Z: 'Zulu',
  '0': 'Zero',  '1': 'One',   '2': 'Two',   '3': 'Three',
  '4': 'Four',  '5': 'Five',  '6': 'Six',   '7': 'Seven',
  '8': 'Eight', '9': 'Nine',
};

const REVERSE: Record<string, string> = (() => {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(TABLE)) r[v.toLowerCase()] = k;
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
  const trimmed = input.trim();
  if (!trimmed) return '';
  const wordChunks = trimmed.split(/\s*\/\s*/);
  return wordChunks
    .map((chunk) =>
      chunk
        .split(/\s+/)
        .filter(Boolean)
        .map((tok) => REVERSE[tok.toLowerCase()] ?? '?')
        .join(''),
    )
    .join(' ');
}

export const nato: CipherSpec<NatoOpts> = {
  id: 'nato',
  name: 'NATO Phonetic',
  tagline: 'Spell each letter as its phonetic word: Alpha, Bravo, Charlie…',
  category: 'fun',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'SOS', input: 'SOS', opts: {}, output: 'Sierra Oscar Sierra' },
    { label: 'Hello', input: 'Hello', opts: {}, output: 'Hotel Echo Lima Lima Oscar' },
    { label: 'Two words', input: 'Hi there', opts: {}, output: 'Hotel India / Tango Hotel Echo Romeo Echo' },
  ],
  encode,
  decode,
  viz: () => import('./nato.viz.svelte'),
};
