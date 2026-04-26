import type { CipherSpec } from '../_types';

export type PigLatinOpts = Record<string, never>;

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

function isLetterChar(ch: string): boolean {
  return /[a-zA-Z]/.test(ch);
}

/** Y is a vowel except at the very start of the word. */
function isVowelAt(word: string, pos: number): boolean {
  const ch = word[pos]?.toLowerCase();
  if (!ch) return false;
  if (VOWELS.has(ch)) return true;
  if (ch === 'y' && pos > 0) return true;
  return false;
}

export interface WordAnalysis {
  /** Leading non-letter punctuation (left-attached). */
  leading: string;
  /** Trailing non-letter punctuation (right-attached). */
  trailing: string;
  /** Letter-only core of the word. */
  core: string;
  /** Consonant cluster moved to the end ('' for vowel-start words). */
  cluster: string;
  /** Letters left in place after extracting the cluster. */
  rest: string;
  /** Suffix appended ('way' for vowel-start, 'ay' otherwise). */
  suffix: 'way' | 'ay';
  /** The encoded word, including leading/trailing punctuation. */
  encoded: string;
}

export function analyzeWord(word: string): WordAnalysis {
  const leading = word.match(/^[^a-zA-Z]*/)?.[0] ?? '';
  const trailing = word.match(/[^a-zA-Z]*$/)?.[0] ?? '';
  const core = word.slice(leading.length, word.length - trailing.length);

  if (!core) {
    return { leading, trailing, core, cluster: '', rest: '', suffix: 'ay', encoded: word };
  }

  // Vowel-start (including Y treated-as-consonant-at-start exception)
  if (isVowelAt(core, 0)) {
    return {
      leading,
      trailing,
      core,
      cluster: '',
      rest: core,
      suffix: 'way',
      encoded: leading + core + 'way' + trailing,
    };
  }

  // Find consonant cluster (everything up to first vowel-position)
  let clusterEnd = 0;
  while (clusterEnd < core.length && !isVowelAt(core, clusterEnd)) clusterEnd++;

  if (clusterEnd === core.length) {
    // All consonants — just append 'ay'
    return {
      leading,
      trailing,
      core,
      cluster: core,
      rest: '',
      suffix: 'ay',
      encoded: leading + core + 'ay' + trailing,
    };
  }

  const cluster = core.slice(0, clusterEnd);
  const rest = core.slice(clusterEnd);

  // Preserve capitalization: if the original core started with a capital,
  // capitalize the new first letter and lower-case the moved cluster.
  const wasCapitalized = /^[A-Z]/.test(core);
  const newRest = wasCapitalized ? rest[0]!.toUpperCase() + rest.slice(1) : rest;
  const movedCluster = wasCapitalized ? cluster.toLowerCase() : cluster;

  return {
    leading,
    trailing,
    core,
    cluster,
    rest,
    suffix: 'ay',
    encoded: leading + newRest + movedCluster + 'ay' + trailing,
  };
}

function encode(input: string): string {
  if (!input) return '';
  return input
    .split(/(\s+)/)
    .map((token) => (/^\s+$/.test(token) ? token : analyzeWord(token).encoded))
    .join('');
}

export const pigLatin: CipherSpec<PigLatinOpts> = {
  id: 'pig-latin',
  name: 'Pig Latin',
  tagline: 'Move the leading consonants to the end and add "ay". Vowel-starts get "way".',
  category: 'fun',
  modes: ['encode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'Hello friend', opts: {}, output: 'Ellohay iendfray' },
    { label: 'Vowel start', input: 'apple of my eye', opts: {}, output: 'appleway ofway ymay eyeway' },
    { label: 'Cluster', input: 'string theory', opts: {}, output: 'ingstray eorythay' },
  ],
  encode,
  viz: () => import('./pig-latin.viz.svelte'),
};
