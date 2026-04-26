import { describe, it, expect } from 'vitest';
import { morse, type MorseOpts } from '../../src/ciphers/fun/morse';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { fc } from '../helpers/properties';

const file = loadVectors<MorseOpts>('encoding/morse.json');

describe('morse — vendored vectors', () => {
  it('vector file declares its source', () => {
    expect(file.source).toMatch(/Morse Code|ITU/);
  });

  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? morse.encode! : morse.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('morse — properties', () => {
  // Build clean inputs: 1-5 words, each word 1-6 characters from [A-Z0-9].
  const wordArb = fc.stringMatching(/^[A-Z0-9]{1,6}$/);
  const cleanInputArb = fc
    .array(wordArb, { minLength: 1, maxLength: 5 })
    .map((words) => words.join(' '));

  it('round-trip: decode(encode(x)) === x for upper-case A-Z/0-9 inputs with single spaces', () => {
    fc.assert(
      fc.property(cleanInputArb, (input) => {
        return morse.decode!(morse.encode!(input, {}) as string, {}) === input;
      }),
    );
  });

  it('encode normalizes case (decode(encode(lower)) === upper)', () => {
    fc.assert(
      fc.property(cleanInputArb, (input) => {
        const lower = input.toLowerCase();
        return morse.decode!(morse.encode!(lower, {}) as string, {}) === input.toUpperCase();
      }),
    );
  });
});

describe('morse — spec metadata', () => {
  it('category is fun, both modes', () => {
    expect(morse.category).toBe('fun');
    expect(morse.modes).toEqual(['encode', 'decode']);
  });

  it('has a custom viz registered', () => {
    expect(morse.viz).toBeDefined();
  });
});
