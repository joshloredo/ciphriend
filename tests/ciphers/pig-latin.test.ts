import { describe, it, expect } from 'vitest';
import { pigLatin, analyzeWord, type PigLatinOpts } from '../../src/ciphers/fun/pig-latin';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';

const file = loadVectors<PigLatinOpts>('encoding/pig-latin.json');

describe('pig-latin — vendored vectors', () => {
  for (const v of runnableVectors(file)) {
    it(`${v.id}: ${v.comment ?? ''}`, () => {
      expect(pigLatin.encode!(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('pig-latin — analyzeWord helper', () => {
  it('classifies vowel-start words with empty cluster', () => {
    const a = analyzeWord('apple');
    expect(a.cluster).toBe('');
    expect(a.suffix).toBe('way');
  });

  it('classifies consonant-cluster start', () => {
    const a = analyzeWord('string');
    expect(a.cluster).toBe('str');
    expect(a.rest).toBe('ing');
    expect(a.suffix).toBe('ay');
  });

  it('separates leading and trailing punctuation from the core', () => {
    const a = analyzeWord('"hello"');
    expect(a.leading).toBe('"');
    expect(a.trailing).toBe('"');
    expect(a.core).toBe('hello');
    expect(a.encoded).toBe('"ellohay"');
  });

  it('handles empty / non-letter tokens without crashing', () => {
    const a = analyzeWord('!!!');
    expect(a.core).toBe('');
    expect(a.encoded).toBe('!!!');
  });
});

describe('pig-latin — spec metadata', () => {
  it('is encode-only (decode is ambiguous)', () => {
    expect(pigLatin.modes).toEqual(['encode']);
    expect(pigLatin.decode).toBeUndefined();
  });

  it('category is fun, has custom viz', () => {
    expect(pigLatin.category).toBe('fun');
    expect(pigLatin.viz).toBeDefined();
  });
});
