import type { CipherSpec, CharTransform, Mode } from '../_types';
import { ALPHABET_SIZE, A_UPPER, isLetter, shiftChar } from '../_shared/alphabet';

export interface VigenereOpts {
  key: string;
}

/** Strip non-letters from the key and uppercase. Returns '' if no letters remain. */
function normalizeKey(key: string): string {
  let out = '';
  for (let i = 0; i < key.length; i++) {
    const code = key.charCodeAt(i);
    if (isLetter(code)) {
      out += code < A_UPPER + ALPHABET_SIZE ? key[i] : key[i]!.toUpperCase();
    }
  }
  return out.toUpperCase();
}

function shiftFor(keyChar: string): number {
  return keyChar.charCodeAt(0) - A_UPPER;
}

function process(input: string, opts: VigenereOpts, mode: Mode): string {
  const key = normalizeKey(opts.key);
  if (!key) return input;
  let out = '';
  let keyIdx = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (isLetter(ch.charCodeAt(0))) {
      const shift = shiftFor(key[keyIdx % key.length]!);
      const effective = mode === 'decode' ? -shift : shift;
      out += shiftChar(ch, effective);
      keyIdx++;
    } else {
      out += ch;
    }
  }
  return out;
}

function trace(input: string, opts: VigenereOpts, mode: Mode): CharTransform[] {
  const key = normalizeKey(opts.key);
  const out: CharTransform[] = [];
  let keyIdx = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const isLetterChar = isLetter(ch.charCodeAt(0));
    if (!isLetterChar) {
      out.push({
        inIndex: i,
        inChar: ch,
        outChar: ch,
        detail: 'passthrough (non-letter)',
        op: '·',
      });
      continue;
    }
    if (!key) {
      out.push({
        inIndex: i,
        inChar: ch,
        outChar: ch,
        detail: 'no key — passthrough',
        op: '·',
      });
      continue;
    }
    const keyChar = key[keyIdx % key.length]!;
    const shift = shiftFor(keyChar);
    const effective = mode === 'decode' ? -shift : shift;
    const sign = effective >= 0 ? '+' : '';
    out.push({
      inIndex: i,
      inChar: ch,
      outChar: shiftChar(ch, effective),
      detail: `key letter ${keyChar} (shift ${sign}${effective})`,
      op: `${keyChar}(${sign}${effective})`,
      group: keyIdx % key.length,
    });
    keyIdx++;
  }
  return out;
}

export const vigenere: CipherSpec<VigenereOpts> = {
  id: 'vigenere',
  name: 'Vigenère',
  tagline: 'Polyalphabetic shift — each letter moves by the matching letter of a repeating key.',
  category: 'classical',
  modes: ['encode', 'decode'],
  options: [
    {
      id: 'key',
      label: 'Key',
      kind: 'text',
      default: 'LEMON',
      description: 'Letters of this word drive the shift, cycling through the input. Non-letters in the key are ignored.',
    },
  ],
  examples: [
    {
      label: 'Canonical',
      input: 'ATTACK AT DAWN',
      opts: { key: 'LEMON' },
      output: 'LXFOPV EF RNHR',
    },
    {
      label: 'Friendly',
      input: 'Hello, friend',
      opts: { key: 'CIPHER' },
      output: 'Jmass, wtqtuh',
    },
  ],
  encode: (input, opts) => process(input, opts, 'encode'),
  decode: (input, opts) => process(input, opts, 'decode'),
  trace: (input, opts, mode) => trace(input, opts, mode),
};
