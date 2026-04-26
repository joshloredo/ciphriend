import { describe, it, expect } from 'vitest';
import { reverse, type ReverseOpts } from '../../src/ciphers/fun/reverse';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { involution, traceMatchesOutput, fc } from '../helpers/properties';

const file = loadVectors<ReverseOpts>('encoding/reverse.json');

describe('reverse — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? reverse.encode! : reverse.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('reverse — properties', () => {
  it('is its own inverse (involution)', () => {
    involution({ apply: (input) => reverse.encode!(input, {}) as string });
  });

  it('preserves length', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        return (reverse.encode!(input, {}) as string).length === input.length;
      }),
    );
  });

  it('trace().outChar joined === encode()', () => {
    traceMatchesOutput<ReverseOpts, { outChar: string }>({
      encode: (input, opts) => reverse.encode!(input, opts) as string,
      trace: (input, opts) => reverse.trace!(input, opts, 'encode'),
      opts: fc.constant({} as ReverseOpts),
    });
  });
});

describe('reverse — spec metadata', () => {
  it('is in the fun category with both modes', () => {
    expect(reverse.category).toBe('fun');
    expect(reverse.modes).toEqual(['encode', 'decode']);
  });

  it('trace records outIndex for connecting-arc visualizations', () => {
    const transforms = reverse.trace!('abcd', {}, 'encode');
    expect(transforms[0]?.outIndex).toBe(3);
    expect(transforms[3]?.outIndex).toBe(0);
  });
});
