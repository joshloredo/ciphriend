import { describe, it, expect } from 'vitest';
import { nato, type NatoOpts } from '../../src/ciphers/fun/nato';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { fc } from '../helpers/properties';

const file = loadVectors<NatoOpts>('encoding/nato.json');

describe('nato — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? nato.encode! : nato.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('nato — properties', () => {
  const wordArb = fc.stringMatching(/^[A-Z0-9]{1,8}$/);
  const inputArb = fc
    .array(wordArb, { minLength: 1, maxLength: 4 })
    .map((words) => words.join(' '));

  it('round-trip: decode(encode(x)) === x', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        return nato.decode!(nato.encode!(input, {}) as string, {}) === input;
      }),
    );
  });
});

describe('nato — spec metadata', () => {
  it('is in the fun category with both modes and a custom viz', () => {
    expect(nato.category).toBe('fun');
    expect(nato.modes).toEqual(['encode', 'decode']);
    expect(nato.viz).toBeDefined();
  });
});
