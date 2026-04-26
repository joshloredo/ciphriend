import type { CipherSpec, CharTransform } from '../_types';
import {
  A_LOWER,
  A_UPPER,
  Z_LOWER,
  Z_UPPER,
  isLetter,
  isLower,
  isUpper,
} from '../_shared/alphabet';

export type AtbashOpts = Record<string, never>;

function mirrorChar(ch: string): string {
  const code = ch.charCodeAt(0);
  if (isUpper(code)) return String.fromCharCode(Z_UPPER - (code - A_UPPER));
  if (isLower(code)) return String.fromCharCode(Z_LOWER - (code - A_LOWER));
  return ch;
}

function apply(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) out += mirrorChar(input[i]!);
  return out;
}

function trace(input: string): CharTransform[] {
  const out: CharTransform[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const isLetterChar = isLetter(ch.charCodeAt(0));
    out.push({
      inIndex: i,
      inChar: ch,
      outChar: mirrorChar(ch),
      detail: isLetterChar ? `mirror: ${ch} ↔ ${mirrorChar(ch)}` : 'passthrough (non-letter)',
      op: isLetterChar ? '↔' : '·',
      group: 0,
    });
  }
  return out;
}

export const atbash: CipherSpec<AtbashOpts> = {
  id: 'atbash',
  name: 'Atbash',
  tagline: 'Mirror the alphabet — A↔Z, B↔Y, C↔X, and so on.',
  category: 'classical',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Classic', input: 'HELLO', opts: {}, output: 'SVOOL' },
    { label: 'Mixed', input: 'The quick brown fox', opts: {}, output: 'Gsv jfrxp yildm ulc' },
  ],
  encode: (input) => apply(input),
  decode: (input) => apply(input),
  trace: (input) => trace(input),
};
