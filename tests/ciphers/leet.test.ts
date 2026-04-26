import { describe, it, expect } from 'vitest';
import { leet, type LeetOpts } from '../../src/ciphers/fun/leet';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { traceMatchesOutput, fc } from '../helpers/properties';

const file = loadVectors<LeetOpts>('encoding/leet.json');

describe('leet — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    it(`${v.id}: ${v.comment ?? ''}`, () => {
      expect(leet.encode!(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('leet — properties', () => {
  it('output length equals input length (1:1 substitution)', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        return (leet.encode!(input, {}) as string).length === input.length;
      }),
    );
  });

  it('idempotent: applying twice equals applying once (digits stay digits)', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const once = leet.encode!(input, {}) as string;
        const twice = leet.encode!(once, {}) as string;
        return once === twice;
      }),
    );
  });

  it('trace().outChar joined === encode()', () => {
    traceMatchesOutput<LeetOpts, { outChar: string }>({
      encode: (input, opts) => leet.encode!(input, opts) as string,
      trace: (input, opts) => leet.trace!(input, opts, 'encode'),
      opts: fc.constant({} as LeetOpts),
    });
  });
});

describe('leet — spec metadata', () => {
  it('is encode-only (decode is intentionally ambiguous)', () => {
    expect(leet.modes).toEqual(['encode']);
    expect(leet.decode).toBeUndefined();
  });
});
