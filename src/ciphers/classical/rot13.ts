import type { CipherSpec, CharTransform } from '../_types';
import { isLetter, shiftChar } from '../_shared/alphabet';

export type Rot13Opts = Record<string, never>;

const SHIFT = 13;

function apply(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) out += shiftChar(input[i]!, SHIFT);
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
      outChar: shiftChar(ch, SHIFT),
      detail: isLetterChar ? 'shift +13 (involution)' : 'passthrough (non-letter)',
      op: isLetterChar ? '+13' : '·',
      group: 0,
    });
  }
  return out;
}

export const rot13: CipherSpec<Rot13Opts> = {
  id: 'rot13',
  name: 'ROT13',
  tagline: 'Caesar with shift 13. Encoding and decoding are the same operation.',
  category: 'classical',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'Hello, World!', opts: {}, output: 'Uryyb, Jbeyq!' },
    { label: 'Spoiler', input: 'The answer is 42', opts: {}, output: 'Gur nafjre vf 42' },
  ],
  encode: (input) => apply(input),
  decode: (input) => apply(input),
  trace: (input) => trace(input),
};
