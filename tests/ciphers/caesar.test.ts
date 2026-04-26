import { describe, it, expect } from 'vitest';
import { caesar, type CaesarOpts } from '../../src/ciphers/classical/caesar';

const o = (shift: number): CaesarOpts => ({ shift });

describe('caesar.encode', () => {
  it('canonical example: HELLO with shift=3 → KHOOR', () => {
    expect(caesar.encode!('HELLO', o(3))).toBe('KHOOR');
  });

  it('preserves case', () => {
    expect(caesar.encode!('Hello', o(3))).toBe('Khoor');
  });

  it('passes non-letters through unchanged', () => {
    expect(caesar.encode!('Hello, World!', o(3))).toBe('Khoor, Zruog!');
  });

  it('handles wrap-around at end of alphabet', () => {
    expect(caesar.encode!('XYZ', o(3))).toBe('ABC');
  });

  it('handles negative shifts', () => {
    expect(caesar.encode!('ABC', o(-3))).toBe('XYZ');
  });

  it('handles shifts larger than the alphabet', () => {
    expect(caesar.encode!('ABC', o(29))).toBe('DEF');
  });

  it('shift=0 is identity', () => {
    expect(caesar.encode!('Hello, World!', o(0))).toBe('Hello, World!');
  });

  it('handles empty string', () => {
    expect(caesar.encode!('', o(3))).toBe('');
  });

  it('handles Unicode (passes non-ASCII through)', () => {
    // H→K, é stays (non-ASCII), l→o, l→o, o→r, space stays, lock stays
    expect(caesar.encode!('Héllo 🔒', o(3))).toBe('Kéoor 🔒');
  });
});

describe('caesar.decode', () => {
  it('decode is the inverse of encode', () => {
    expect(caesar.decode!('KHOOR', o(3))).toBe('HELLO');
  });

  it('matches encode with negative shift', () => {
    expect(caesar.decode!('ABC', o(3))).toBe(caesar.encode!('ABC', o(-3)));
  });
});

describe('caesar round-trip property', () => {
  const seed = 0x1234abcd;
  let state = seed;
  // mulberry32 — small deterministic PRNG for reproducible randomness
  function rand() {
    state |= 0; state = (state + 0x6D2B79F5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function randomString(len: number): string {
    let s = '';
    for (let i = 0; i < len; i++) {
      s += String.fromCharCode(32 + Math.floor(rand() * 95));
    }
    return s;
  }

  it('decode(encode(x, k), k) === x for 200 random strings × 13 shifts', () => {
    for (let i = 0; i < 200; i++) {
      const len = 1 + Math.floor(rand() * 100);
      const input = randomString(len);
      for (let shift = -6; shift <= 6; shift++) {
        const encoded = caesar.encode!(input, o(shift));
        const decoded = caesar.decode!(encoded, o(shift));
        expect(decoded).toBe(input);
      }
    }
  });
});

describe('caesar.trace', () => {
  it('emits one transform per input character', () => {
    const transforms = caesar.trace!('Hi!', o(3), 'encode');
    expect(transforms).toHaveLength(3);
  });

  it('outChar concatenated equals encode output', () => {
    const input = 'Hello, World!';
    const opts = o(3);
    const expected = caesar.encode!(input, opts);
    const transforms = caesar.trace!(input, opts, 'encode');
    const fromTrace = transforms.map(t => t.outChar).join('');
    expect(fromTrace).toBe(expected);
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
});

describe('caesar.spec metadata', () => {
  it('has the expected shape', () => {
    expect(caesar.id).toBe('caesar');
    expect(caesar.category).toBe('classical');
    expect(caesar.modes).toEqual(expect.arrayContaining(['encode', 'decode']));
    expect(caesar.options.find(o => o.id === 'shift')).toBeDefined();
  });
});
