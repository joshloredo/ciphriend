import { describe, it, expect } from 'vitest';
import { polybius, letterToCoords, GRID, type PolybiusOpts } from '../../src/ciphers/classical/polybius';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { fc } from '../helpers/properties';

const file = loadVectors<PolybiusOpts>('classical/polybius.json');

describe('polybius — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? polybius.encode! : polybius.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('polybius — letterToCoords helper', () => {
  it('maps each grid letter to its row/col', () => {
    expect(letterToCoords('A')).toEqual([1, 1]);
    expect(letterToCoords('Z')).toEqual([5, 5]);
    expect(letterToCoords('H')).toEqual([2, 3]);
  });

  it('I and J both map to (2, 4)', () => {
    expect(letterToCoords('I')).toEqual([2, 4]);
    expect(letterToCoords('J')).toEqual([2, 4]);
  });

  it('returns null for non-letters', () => {
    expect(letterToCoords('?')).toBeNull();
    expect(letterToCoords('1')).toBeNull();
    expect(letterToCoords(' ')).toBeNull();
  });
});

describe('polybius — properties', () => {
  // Round-trip property: the J-merge means we can only round-trip text that
  // contains no J's (or where every J is already going to land as I).
  const noJArb = fc.stringMatching(/^[A-IK-Z]{1,16}$/);

  it('round-trip: decode(encode(x)) === x for J-free upper-case input', () => {
    fc.assert(
      fc.property(noJArb, (input) => {
        return polybius.decode!(polybius.encode!(input, {}) as string, {}) === input;
      }),
    );
  });

  it('encoded form is space-separated 2-digit pairs', () => {
    fc.assert(
      fc.property(noJArb, (input) => {
        const out = polybius.encode!(input, {}) as string;
        return out.split(' ').every((tok) => /^[1-5]{2}$/.test(tok));
      }),
    );
  });
});

describe('polybius — error handling', () => {
  it('throws on odd-length digit stream', () => {
    expect(() => polybius.decode!('123', {})).toThrow(/even/);
  });

  it('throws on out-of-range digits', () => {
    expect(() => polybius.decode!('06', {})).toThrow(/range 1-5/);
    expect(() => polybius.decode!('99', {})).toThrow(/range 1-5/);
  });

  it('throws on non-digit input', () => {
    expect(() => polybius.decode!('AB', {})).toThrow();
  });
});

describe('polybius — spec metadata', () => {
  it('grid is 5x5', () => {
    expect(GRID).toHaveLength(5);
    for (const row of GRID) expect(row).toHaveLength(5);
  });

  it('category and viz registered', () => {
    expect(polybius.category).toBe('classical');
    expect(polybius.viz).toBeDefined();
  });
});
