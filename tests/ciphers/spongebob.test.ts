import { describe, it, expect } from 'vitest';
import { spongebob, type SpongebobOpts } from '../../src/ciphers/fun/spongebob';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { traceMatchesOutput, fc } from '../helpers/properties';

const file = loadVectors<SpongebobOpts>('encoding/spongebob.json');

describe('spongebob — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? spongebob.encode! : spongebob.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('spongebob — properties', () => {
  it('output toggles case on each letter starting lowercase', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[A-Za-z]+$/), (input) => {
        const out = spongebob.encode!(input, {}) as string;
        for (let i = 0; i < out.length; i++) {
          const expectedUpper = i % 2 === 1;
          if (expectedUpper && out[i] !== out[i]!.toUpperCase()) return false;
          if (!expectedUpper && out[i] !== out[i]!.toLowerCase()) return false;
        }
        return true;
      }),
    );
  });

  it('encode === decode (operation is the same in both directions)', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        return spongebob.encode!(input, {}) === spongebob.decode!(input, {});
      }),
    );
  });

  it('trace().outChar joined === encode()', () => {
    traceMatchesOutput<SpongebobOpts, { outChar: string }>({
      encode: (input, opts) => spongebob.encode!(input, opts) as string,
      trace: (input, opts) => spongebob.trace!(input, opts, 'encode'),
      opts: fc.constant({} as SpongebobOpts),
    });
  });
});
