import type { CipherSpec, CharTransform, Mode } from '../_types';
import { ALPHABET_SIZE, A_LOWER, A_UPPER, isLetter, isLower, isUpper, mod } from '../_shared/alphabet';

export interface AffineOpts {
  a: number;
  b: number;
}

/**
 * Modular inverse of a mod m, or null if a is not coprime with m.
 * For Affine over the 26-letter alphabet, a must be coprime with 26 — i.e.,
 * a ∈ {1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25}.
 */
export function modInverse(a: number, m: number): number | null {
  const am = mod(a, m);
  let [oldR, r] = [am, m];
  let [oldS, s] = [1, 0];
  while (r !== 0) {
    const q = Math.floor(oldR / r);
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  if (oldR !== 1) return null;
  return mod(oldS, m);
}

function applyToLetter(ch: string, transform: (x: number) => number): string {
  const code = ch.charCodeAt(0);
  if (isUpper(code)) {
    const x = code - A_UPPER;
    return String.fromCharCode(A_UPPER + mod(transform(x), ALPHABET_SIZE));
  }
  if (isLower(code)) {
    const x = code - A_LOWER;
    return String.fromCharCode(A_LOWER + mod(transform(x), ALPHABET_SIZE));
  }
  return ch;
}

function encode(input: string, opts: AffineOpts): string {
  const { a, b } = opts;
  if (modInverse(a, ALPHABET_SIZE) === null) {
    throw new Error(`'a' must be coprime with 26 (try 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, or 25).`);
  }
  let out = '';
  for (const ch of input) out += applyToLetter(ch, (x) => a * x + b);
  return out;
}

function decode(input: string, opts: AffineOpts): string {
  const { a, b } = opts;
  const aInv = modInverse(a, ALPHABET_SIZE);
  if (aInv === null) {
    throw new Error(`'a' must be coprime with 26 (try 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, or 25).`);
  }
  let out = '';
  for (const ch of input) out += applyToLetter(ch, (y) => aInv * (y - b));
  return out;
}

function trace(input: string, opts: AffineOpts, mode: Mode): CharTransform[] {
  const { a, b } = opts;
  const aInv = modInverse(a, ALPHABET_SIZE);
  const out: CharTransform[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const code = ch.charCodeAt(0);
    if (!isLetter(code) || aInv === null) {
      out.push({
        inIndex: i,
        inChar: ch,
        outChar: ch,
        op: '·',
        detail: aInv === null ? 'invalid a (not coprime with 26)' : 'passthrough',
      });
      continue;
    }
    const upperOffset = isUpper(code) ? A_UPPER : A_LOWER;
    const x = code - upperOffset;
    const y = mode === 'decode'
      ? mod(aInv * (x - b), ALPHABET_SIZE)
      : mod(a * x + b, ALPHABET_SIZE);
    const outChar = String.fromCharCode(upperOffset + y);
    const shift = mod(y - x, ALPHABET_SIZE);
    const sign = shift <= 13 ? '+' : '';
    const displayShift = shift <= 13 ? shift : shift - 26;
    out.push({
      inIndex: i,
      inChar: ch,
      outChar,
      detail:
        mode === 'decode'
          ? `${aInv}·(${x}-${b}) mod 26 = ${y}`
          : `${a}·${x}+${b} mod 26 = ${y}`,
      op: `${sign}${displayShift}`,
      group: 0,
    });
  }
  return out;
}

export const affine: CipherSpec<AffineOpts> = {
  id: 'affine',
  name: 'Affine',
  tagline: 'Linear substitution: y = (a·x + b) mod 26. Caesar is the special case where a = 1.',
  category: 'classical',
  modes: ['encode', 'decode'],
  options: [
    {
      id: 'a',
      label: 'a (multiplier)',
      kind: 'number',
      default: 5,
      min: 1,
      max: 25,
      step: 2,
      description: 'Must be coprime with 26 — valid values: 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25.',
    },
    {
      id: 'b',
      label: 'b (offset)',
      kind: 'number',
      default: 8,
      min: 0,
      max: 25,
      step: 1,
      description: 'Constant added after the multiply. Like Caesar shift when a = 1.',
    },
  ],
  examples: [
    { label: 'Classic', input: 'AFFINECIPHER', opts: { a: 5, b: 8 }, output: 'IHHWVCSWFRCP' },
    { label: 'a=1 (Caesar)', input: 'HELLO', opts: { a: 1, b: 3 }, output: 'KHOOR' },
  ],
  encode,
  decode,
  trace,
};
