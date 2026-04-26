import { describe, it, expect } from 'vitest';
import { bacon, type BaconOpts } from '../../src/ciphers/classical/bacon';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { fc } from '../helpers/properties';

const file = loadVectors<BaconOpts>('classical/bacon.json');

describe('bacon — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? bacon.encode! : bacon.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('bacon — properties', () => {
  const wordArb = fc.stringMatching(/^[A-Z]{1,8}$/);
  const inputArb = fc
    .array(wordArb, { minLength: 1, maxLength: 4 })
    .map((words) => words.join(' '));

  it('round-trip: decode(encode(x)) === x for upper-case A-Z words', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        return bacon.decode!(bacon.encode!(input, {}) as string, {}) === input;
      }),
    );
  });

  it('encoded length is 5*N letters + 4*(N-1) spaces per word, where N = letters in word', () => {
    fc.assert(
      fc.property(wordArb, (word) => {
        const encoded = bacon.encode!(word, {}) as string;
        const expectedLength = 5 * word.length + (word.length - 1);
        return encoded.length === expectedLength;
      }),
    );
  });

  it('every encoded sequence is exactly 5 characters of A or B', () => {
    fc.assert(
      fc.property(wordArb, (word) => {
        const encoded = bacon.encode!(word, {}) as string;
        return encoded.split(' ').every((tok) => /^[AB]{5}$/.test(tok));
      }),
    );
  });
});

describe('bacon — spec metadata', () => {
  it('category is classical with both modes and a custom viz', () => {
    expect(bacon.category).toBe('classical');
    expect(bacon.modes).toEqual(['encode', 'decode']);
    expect(bacon.viz).toBeDefined();
  });
});
