import { describe, it, expect } from 'vitest';
import { braille, dotsFor, type BrailleOpts } from '../../src/ciphers/encoding/braille';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { fc } from '../helpers/properties';

const file = loadVectors<BrailleOpts>('encoding/braille.json');

describe('braille — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? braille.encode! : braille.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('braille — dotsFor helper', () => {
  it('returns the correct dot pattern for known letters', () => {
    expect(dotsFor('A')).toEqual([1]);
    expect(dotsFor('B')).toEqual([1, 2]);
    expect(dotsFor('Z')).toEqual([1, 3, 5, 6]);
  });

  it('is case-insensitive', () => {
    expect(dotsFor('h')).toEqual([1, 2, 5]);
  });

  it('returns null for unsupported characters', () => {
    expect(dotsFor('!')).toBeNull();
    expect(dotsFor('1')).toBeNull();
  });
});

describe('braille — properties', () => {
  const wordArb = fc.stringMatching(/^[A-Z]{1,8}$/);
  const inputArb = fc
    .array(wordArb, { minLength: 1, maxLength: 4 })
    .map((words) => words.join(' '));

  it('round-trip: decode(encode(x)) === x for upper-case A-Z + spaces', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        return braille.decode!(braille.encode!(input, {}) as string, {}) === input;
      }),
    );
  });

  it('every encoded code point is in the U+2800-U+28FF block', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const encoded = braille.encode!(input, {}) as string;
        for (const ch of encoded) {
          const cp = ch.codePointAt(0)!;
          if (cp < 0x2800 || cp > 0x28ff) return false;
        }
        return true;
      }),
    );
  });
});

describe('braille — spec metadata', () => {
  it('encoding category, both modes, custom viz', () => {
    expect(braille.category).toBe('encoding');
    expect(braille.modes).toEqual(['encode', 'decode']);
    expect(braille.viz).toBeDefined();
  });
});
