import { describe, it, expect } from 'vitest';
import { hex, type HexOpts } from '../../src/ciphers/encoding/hex';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { roundTrip, fc } from '../helpers/properties';

const file = loadVectors<HexOpts>('encoding/hex.json');

describe('hex — vendored reference vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? hex.encode! : hex.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('hex — properties', () => {
  it('round-trip: decode(encode(x)) === x', () => {
    roundTrip<HexOpts>({
      encode: (input) => hex.encode!(input, {}) as string,
      decode: (input) => hex.decode!(input, {}) as string,
      opts: fc.constant({} as HexOpts),
    });
  });

  it('matches platform Buffer.from(s, "utf8").toString("hex")', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const ours = hex.encode!(input, {}) as string;
        const platform = Buffer.from(input, 'utf8').toString('hex');
        return ours === platform;
      }),
    );
  });
});

describe('hex — error handling', () => {
  it('throws on odd-length hex', () => {
    expect(() => hex.decode!('abc', {})).toThrow(/even/);
  });

  it('throws on non-hex characters', () => {
    expect(() => hex.decode!('zz', {})).toThrow(/invalid/);
  });
});
