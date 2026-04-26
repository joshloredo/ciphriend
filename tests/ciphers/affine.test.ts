import { describe, it, expect } from 'vitest';
import { affine, modInverse, type AffineOpts } from '../../src/ciphers/classical/affine';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { roundTrip, traceMatchesOutput, fc } from '../helpers/properties';

const file = loadVectors<AffineOpts>('classical/affine.json');

describe('affine — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? affine.encode! : affine.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('affine — modInverse helper', () => {
  it('returns null for non-coprime values', () => {
    expect(modInverse(2, 26)).toBeNull();
    expect(modInverse(13, 26)).toBeNull();
    expect(modInverse(0, 26)).toBeNull();
  });

  it('returns correct inverses for valid values', () => {
    expect(modInverse(1, 26)).toBe(1);
    expect(modInverse(3, 26)).toBe(9);
    expect(modInverse(5, 26)).toBe(21);
    expect(modInverse(7, 26)).toBe(15);
    expect(modInverse(25, 26)).toBe(25);
  });

  it('inverse times a equals 1 mod 26 for all valid a', () => {
    const validAs = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
    for (const a of validAs) {
      const inv = modInverse(a, 26);
      expect(inv).not.toBeNull();
      expect((a * inv!) % 26).toBe(1);
    }
  });
});

describe('affine — properties', () => {
  const validAs = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
  const optsArb = fc
    .record({
      a: fc.constantFrom(...validAs),
      b: fc.integer({ min: 0, max: 25 }),
    });

  it('round-trip: decode(encode(x, k), k) === x for valid (a, b)', () => {
    roundTrip<AffineOpts>({
      encode: (input, opts) => affine.encode!(input, opts) as string,
      decode: (input, opts) => affine.decode!(input, opts) as string,
      opts: optsArb,
    });
  });

  it('trace().outChar joined === encode()', () => {
    traceMatchesOutput<AffineOpts, { outChar: string }>({
      encode: (input, opts) => affine.encode!(input, opts) as string,
      trace: (input, opts) => affine.trace!(input, opts, 'encode'),
      opts: optsArb,
    });
  });
});

describe('affine — error handling', () => {
  it('throws when a is not coprime with 26', () => {
    expect(() => affine.encode!('HELLO', { a: 2, b: 3 })).toThrow(/coprime/);
    expect(() => affine.decode!('HELLO', { a: 13, b: 3 })).toThrow(/coprime/);
  });
});
