import { describe, it, expect } from 'vitest';
import { tapCode, letterToTaps, type TapCodeOpts } from '../../src/ciphers/classical/tap-code';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { fc } from '../helpers/properties';

const file = loadVectors<TapCodeOpts>('classical/tap-code.json');

describe('tap-code — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? tapCode.encode! : tapCode.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('tap-code — letterToTaps helper', () => {
  it('maps each letter to its (row, col)', () => {
    expect(letterToTaps('A')).toEqual([1, 1]);
    expect(letterToTaps('Z')).toEqual([5, 5]);
    expect(letterToTaps('H')).toEqual([2, 3]);
  });

  it('C and K both map to (1, 3)', () => {
    expect(letterToTaps('C')).toEqual([1, 3]);
    expect(letterToTaps('K')).toEqual([1, 3]);
  });
});

describe('tap-code — properties', () => {
  // K-free input so round-trip works (every K becomes C).
  const noKArb = fc.stringMatching(/^[A-JL-Z]{1,12}$/);

  it('round-trip: decode(encode(x)) === x for K-free upper-case input', () => {
    fc.assert(
      fc.property(noKArb, (input) => {
        return tapCode.decode!(tapCode.encode!(input, {}) as string, {}) === input;
      }),
    );
  });
});

describe('tap-code — spec metadata', () => {
  it('classical category, both modes, custom viz', () => {
    expect(tapCode.category).toBe('classical');
    expect(tapCode.modes).toEqual(['encode', 'decode']);
    expect(tapCode.viz).toBeDefined();
  });
});
