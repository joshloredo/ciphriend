import { describe, it, expect } from 'vitest';
import { frequency, analyze, ENGLISH_BASELINE, type FrequencyOpts } from '../../src/ciphers/analysis/frequency';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { fc } from '../helpers/properties';

const file = loadVectors<FrequencyOpts>('encoding/frequency.json');

describe('frequency — vendored vectors', () => {
  it('vector file declares its source', () => {
    expect(file.source).toMatch(/frequency/i);
  });

  for (const v of runnableVectors(file)) {
    it(`${v.id}: ${v.comment ?? ''}`, () => {
      expect(frequency.encode!(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('frequency — analyze() helper', () => {
  it('counts case-insensitively and ignores non-letters', () => {
    const r = analyze('Hello, World!');
    expect(r.total).toBe(10);
    expect(r.counts.L).toBe(3);
    expect(r.counts.O).toBe(2);
    expect(r.counts.H).toBe(1);
  });

  it('returns total=0 and empty ranked for letterless input', () => {
    const r = analyze('1234 !!!');
    expect(r.total).toBe(0);
    expect(r.ranked).toHaveLength(0);
  });

  it('ranks ties alphabetically for stable ordering', () => {
    const r = analyze('CBA');
    expect(r.ranked.map((x) => x.letter)).toEqual(['A', 'B', 'C']);
  });
});

describe('frequency — properties', () => {
  it('percentages always sum to 100 (or input has no letters)', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const r = analyze(input);
        if (r.total === 0) return Object.keys(r.percentages).length === 0;
        const sum = Object.values(r.percentages).reduce((a, b) => a + b, 0);
        return Math.abs(sum - 100) < 0.0001;
      }),
    );
  });

  it('counts are always non-negative integers', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const r = analyze(input);
        return Object.values(r.counts).every((c) => Number.isInteger(c) && c >= 0);
      }),
    );
  });

  it('total equals sum of counts', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const r = analyze(input);
        return Object.values(r.counts).reduce((a, b) => a + b, 0) === r.total;
      }),
    );
  });
});

describe('frequency — English baseline', () => {
  it('baseline percentages sum to ~100', () => {
    const sum = Object.values(ENGLISH_BASELINE).reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(99);
    expect(sum).toBeLessThan(101);
  });

  it('covers all 26 letters', () => {
    expect(Object.keys(ENGLISH_BASELINE)).toHaveLength(26);
  });
});

describe('frequency — spec metadata', () => {
  it('is encode-only (analysis tool)', () => {
    expect(frequency.modes).toEqual(['encode']);
    expect(frequency.decode).toBeUndefined();
  });

  it('category is analysis', () => {
    expect(frequency.category).toBe('analysis');
  });

  it('has a custom viz registered', () => {
    expect(frequency.viz).toBeDefined();
  });
});
