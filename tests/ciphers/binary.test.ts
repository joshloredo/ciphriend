import { describe, it, expect } from 'vitest';
import { binary, type BinaryOpts } from '../../src/ciphers/encoding/binary';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { roundTrip, fc } from '../helpers/properties';

const file = loadVectors<BinaryOpts>('encoding/binary.json');

describe('binary — vendored reference vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? binary.encode! : binary.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('binary — properties', () => {
  it('round-trip: decode(encode(x)) === x', () => {
    roundTrip<BinaryOpts>({
      encode: (input) => binary.encode!(input, {}) as string,
      decode: (input) => binary.decode!(input, {}) as string,
      opts: fc.constant({} as BinaryOpts),
    });
  });

  it('encoded form is exactly 9*N - 1 characters for N input bytes (8 bits + N-1 spaces)', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (input) => {
        const numBytes = new TextEncoder().encode(input).length;
        const encoded = binary.encode!(input, {}) as string;
        return encoded.length === numBytes * 9 - 1;
      }),
    );
  });
});

describe('binary — error handling', () => {
  it('throws on non-multiple-of-8 length', () => {
    expect(() => binary.decode!('0100100', {})).toThrow(/multiple of 8/);
  });

  it('throws on non-binary characters', () => {
    expect(() => binary.decode!('01001002', {})).toThrow(/0s and 1s/);
  });
});
