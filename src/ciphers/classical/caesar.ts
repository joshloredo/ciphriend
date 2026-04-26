import type { CipherSpec, CharTransform, Mode } from '../_types';
import { isLetter, shiftChar } from '../_shared/alphabet';

export interface CaesarOpts {
  shift: number;
}

function encode(input: string, opts: CaesarOpts): string {
  const shift = opts.shift | 0;
  let out = '';
  for (let i = 0; i < input.length; i++) {
    out += shiftChar(input[i]!, shift);
  }
  return out;
}

function decode(input: string, opts: CaesarOpts): string {
  return encode(input, { shift: -opts.shift });
}

function trace(input: string, opts: CaesarOpts, mode: Mode): CharTransform[] {
  const effectiveShift = mode === 'decode' ? -opts.shift : opts.shift;
  const sign = effectiveShift >= 0 ? '+' : '';
  const out: CharTransform[] = [];
  for (let i = 0; i < input.length; i++) {
    const inChar = input[i]!;
    const code = inChar.charCodeAt(0);
    const outChar = shiftChar(inChar, effectiveShift);
    const isLetterChar = isLetter(code);
    out.push({
      inIndex: i,
      inChar,
      outChar,
      detail: isLetterChar
        ? `shift ${sign}${effectiveShift}`
        : 'passthrough (non-letter)',
      group: 0,
    });
  }
  return out;
}

export const caesar: CipherSpec<CaesarOpts> = {
  id: 'caesar',
  name: 'Caesar Cipher',
  tagline: 'Shift each letter by a fixed amount.',
  category: 'classical',
  modes: ['encode', 'decode'],
  options: [
    {
      id: 'shift',
      label: 'Shift',
      kind: 'number',
      default: 3,
      min: -25,
      max: 25,
      step: 1,
      description: 'How many positions each letter moves (negative = backward).',
    },
  ],
  examples: [
    { label: 'Classic', input: 'HELLO', opts: { shift: 3 }, output: 'KHOOR' },
    { label: 'ROT13', input: 'Hello, World!', opts: { shift: 13 }, output: 'Uryyb, Jbeyq!' },
  ],
  encode,
  decode,
  trace,
};
