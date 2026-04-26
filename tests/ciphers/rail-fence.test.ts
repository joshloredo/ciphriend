import { describe, it, expect } from 'vitest';
import { railFence, railPattern, type RailFenceOpts } from '../../src/ciphers/classical/rail-fence';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { roundTrip, fc } from '../helpers/properties';

const file = loadVectors<RailFenceOpts>('classical/rail-fence.json');

describe('rail-fence — vendored vectors', () => {
  it('vector file declares its source', () => {
    expect(file.source).toMatch(/Wikipedia/);
  });

  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? railFence.encode! : railFence.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('rail-fence — properties', () => {
  const optsArb = fc
    .integer({ min: 2, max: 8 })
    .map<RailFenceOpts>((rails) => ({ rails }));

  it('round-trip: decode(encode(x, k), k) === x', () => {
    roundTrip<RailFenceOpts>({
      encode: (input, opts) => railFence.encode!(input, opts) as string,
      decode: (input, opts) => railFence.decode!(input, opts) as string,
      opts: optsArb,
    });
  });

  it('encode preserves length (transposition does not add or drop chars)', () => {
    fc.assert(
      fc.property(fc.string(), optsArb, (input, opts) => {
        return (railFence.encode!(input, opts) as string).length === input.length;
      }),
    );
  });

  it('encode is a permutation of the input (multiset equality)', () => {
    fc.assert(
      fc.property(fc.string(), optsArb, (input, opts) => {
        const out = railFence.encode!(input, opts) as string;
        return [...out].sort().join('') === [...input].sort().join('');
      }),
    );
  });
});

describe('rail-fence — railPattern helper', () => {
  it('produces a triangle wave', () => {
    expect(railPattern(7, 3)).toEqual([0, 1, 2, 1, 0, 1, 2]);
  });

  it('one rail returns all zeroes', () => {
    expect(railPattern(5, 1)).toEqual([0, 0, 0, 0, 0]);
  });

  it('zero length returns empty array', () => {
    expect(railPattern(0, 3)).toEqual([]);
  });
});

describe('rail-fence — spec metadata', () => {
  it('has a custom viz registered', () => {
    expect(railFence.viz).toBeDefined();
    expect(typeof railFence.viz).toBe('function');
  });

  it('does NOT have a generic trace (transpositions need custom viz)', () => {
    expect(railFence.trace).toBeUndefined();
  });
});
