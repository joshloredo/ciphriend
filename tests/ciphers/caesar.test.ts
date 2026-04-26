import { describe, it, expect } from 'vitest';
import { caesar, type CaesarOpts } from '../../src/ciphers/classical/caesar';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { roundTrip, involution, traceMatchesOutput, fc } from '../helpers/properties';

const o = (shift: number): CaesarOpts => ({ shift });

/* -------------------------------------------------------------------------- */
/* Hand-written reference vectors (loaded from tests/vectors/classical/)       */
/* -------------------------------------------------------------------------- */

const file = loadVectors<CaesarOpts>('classical/caesar.json');

describe('caesar — vendored reference vectors', () => {
  it('vector file declares its source', () => {
    expect(file.source).toMatch(/Wikipedia/);
  });

  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? caesar.encode! : caesar.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

/* -------------------------------------------------------------------------- */
/* Spec metadata + trace-specific assertions                                   */
/* -------------------------------------------------------------------------- */

describe('caesar — spec metadata', () => {
  it('has the expected shape', () => {
    expect(caesar.id).toBe('caesar');
    expect(caesar.category).toBe('classical');
    expect(caesar.modes).toEqual(expect.arrayContaining(['encode', 'decode']));
    expect(caesar.options.find((opt) => opt.id === 'shift')).toBeDefined();
  });
});

describe('caesar.trace', () => {
  it('emits one transform per input character', () => {
    const transforms = caesar.trace!('Hi!', o(3), 'encode');
    expect(transforms).toHaveLength(3);
  });

  it('records detail for letters and group=0 for shift', () => {
    const transforms = caesar.trace!('Ab!', o(3), 'encode');
    expect(transforms[0]?.detail).toContain('+3');
    expect(transforms[0]?.group).toBe(0);
    expect(transforms[1]?.detail).toContain('+3');
    expect(transforms[2]?.detail).toContain('passthrough');
  });

  it('decode mode shows negative shift in detail', () => {
    const transforms = caesar.trace!('K', o(3), 'decode');
    expect(transforms[0]?.detail).toContain('-3');
  });

  it('sets compact op label for the middle visualization row', () => {
    const transforms = caesar.trace!('Ab!', o(3), 'encode');
    expect(transforms[0]?.op).toBe('+3');
    expect(transforms[1]?.op).toBe('+3');
    expect(transforms[2]?.op).toBe('·');
  });

  it('op label flips sign in decode mode', () => {
    const transforms = caesar.trace!('K', o(3), 'decode');
    expect(transforms[0]?.op).toBe('-3');
  });
});

/* -------------------------------------------------------------------------- */
/* Property tests via fast-check                                               */
/* -------------------------------------------------------------------------- */

describe('caesar — properties', () => {
  const shiftArb = fc.integer({ min: -25, max: 25 }).map<CaesarOpts>((shift) => ({ shift }));

  it('round-trip: decode(encode(x, k), k) === x', () => {
    roundTrip<CaesarOpts>({
      encode: (input, opts) => caesar.encode!(input, opts) as string,
      decode: (input, opts) => caesar.decode!(input, opts) as string,
      opts: shiftArb,
    });
  });

  it('shift=13 is its own inverse (ROT13 property)', () => {
    involution({
      apply: (input) => caesar.encode!(input, { shift: 13 }) as string,
    });
  });

  it('trace().outChar joined === encode()', () => {
    traceMatchesOutput<CaesarOpts, { outChar: string }>({
      encode: (input, opts) => caesar.encode!(input, opts) as string,
      trace: (input, opts) => caesar.trace!(input, opts, 'encode'),
      opts: shiftArb,
    });
  });
});
