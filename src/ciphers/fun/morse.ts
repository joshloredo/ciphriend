import type { CipherSpec } from '../_types';

export type MorseOpts = Record<string, never>;

/**
 * International Morse Code lookup. Letters, digits, and the common
 * punctuation set most users would expect. Encoding upper-cases the input;
 * unknown characters are dropped silently (as is conventional for Morse).
 */
const TABLE: Record<string, string> = {
  A: '.-',  B: '-...', C: '-.-.', D: '-..',  E: '.',    F: '..-.',
  G: '--.', H: '....', I: '..',   J: '.---', K: '-.-',  L: '.-..',
  M: '--',  N: '-.',   O: '---',  P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-',    U: '..-',  V: '...-', W: '.--',  X: '-..-',
  Y: '-.--',Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.',  '(': '-.--.',  ')': '-.--.-',
  '&': '.-...',  ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.',  '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '@': '.--.-.',
};

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
  const trimmed = input.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s*\/\s*/);
  return words
    .map((word) =>
      word
        .split(/\s+/)
        .filter(Boolean)
        .map((tok) => REVERSE[tok] ?? '?')
        .join(''),
    )
    .join(' ');
}

export const morse: CipherSpec<MorseOpts> = {
  id: 'morse',
  name: 'Morse',
  tagline: 'Dits and dahs. Letters separated by spaces, words by " / ".',
  category: 'fun',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'SOS', input: 'SOS', opts: {}, output: '... --- ...' },
    { label: 'Hello', input: 'Hello World', opts: {}, output: '.... . .-.. .-.. --- / .-- --- .-. .-.. -..' },
    { label: 'Wiki', input: 'MORSE CODE', opts: {}, output: '-- --- .-. ... . / -.-. --- -.. .' },
  ],
  encode,
  decode,
  viz: () => import('./morse.viz.svelte'),
};
