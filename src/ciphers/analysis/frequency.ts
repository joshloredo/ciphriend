import type { CipherSpec } from '../_types';

export type FrequencyOpts = Record<string, never>;

/**
 * Approximate English letter frequencies (from standard prose corpora).
 * Used by the visualizer as a baseline overlay so users can spot deviations
 * suggestive of a substitution cipher.
 */
export const ENGLISH_BASELINE: Record<string, number> = {
  A: 8.2, B: 1.5, C: 2.8, D: 4.3, E: 12.7, F: 2.2, G: 2.0, H: 6.1, I: 7.0,
  J: 0.15, K: 0.77, L: 4.0, M: 2.4, N: 6.7, O: 7.5, P: 1.9, Q: 0.095,
  R: 6.0, S: 6.3, T: 9.1, U: 2.8, V: 0.98, W: 2.4, X: 0.15, Y: 2.0, Z: 0.074,
};

export interface FrequencyResult {
  total: number;
  counts: Record<string, number>;
  percentages: Record<string, number>;
  /** Top entries by frequency, sorted descending. */
  ranked: { letter: string; count: number; pct: number }[];
}

export function analyze(input: string): FrequencyResult {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const raw of input) {
    const ch = raw.toUpperCase();
    if (ch >= 'A' && ch <= 'Z') {
      counts[ch] = (counts[ch] ?? 0) + 1;
      total++;
    }
  }
  const percentages: Record<string, number> = {};
  if (total > 0) {
    for (const [k, v] of Object.entries(counts)) {
      percentages[k] = (v / total) * 100;
    }
  }
  const ranked = Object.entries(counts)
    .map(([letter, count]) => ({ letter, count, pct: percentages[letter] ?? 0 }))
    .sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter));
  return { total, counts, percentages, ranked };
}

function encode(input: string): string {
  const r = analyze(input);
  if (r.total === 0) return 'No letters in input.';
  const top = r.ranked
    .slice(0, 5)
    .map(({ letter, pct }) => `${letter}: ${pct.toFixed(1)}%`)
    .join(', ');
  return `${r.total} letter${r.total === 1 ? '' : 's'} · top 5: ${top}`;
}

export const frequency: CipherSpec<FrequencyOpts> = {
  id: 'frequency',
  name: 'Frequency Analysis',
  tagline: 'Count how often each letter appears and compare to the English baseline.',
  category: 'analysis',
  modes: ['encode'],
  options: [],
  examples: [
    {
      label: 'Pangram',
      input: 'The quick brown fox jumps over the lazy dog',
      opts: {},
      output: '35 letters · top 5: O: 11.4%, E: 8.6%, H: 5.7%, R: 5.7%, T: 5.7%',
    },
    {
      label: 'All As',
      input: 'AAAAA',
      opts: {},
      output: '5 letters · top 5: A: 100.0%',
    },
  ],
  encode,
  viz: () => import('./frequency.viz.svelte'),
};
