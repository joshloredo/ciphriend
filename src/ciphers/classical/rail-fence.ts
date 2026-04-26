import type { CipherSpec } from '../_types';

export interface RailFenceOpts {
  rails: number;
}

/**
 * Compute the rail (row index) of each output position when zigzagging
 * across N rails. Used by both encode and decode and by the visualizer.
 */
export function railPattern(length: number, rails: number): number[] {
  const out: number[] = [];
  if (length === 0 || rails <= 1) {
    for (let i = 0; i < length; i++) out.push(0);
    return out;
  }
  let rail = 0;
  let dir = 1;
  for (let i = 0; i < length; i++) {
    out.push(rail);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  return out;
}

function clampRails(opts: RailFenceOpts): number {
  return Math.max(2, Math.floor(opts.rails));
}

function encode(input: string, opts: RailFenceOpts): string {
  const rails = clampRails(opts);
  if (input.length === 0) return '';
  const buckets: string[][] = Array.from({ length: rails }, () => []);
  const pattern = railPattern(input.length, rails);
  for (let i = 0; i < input.length; i++) {
    buckets[pattern[i]!]!.push(input[i]!);
  }
  return buckets.map((r) => r.join('')).join('');
}

function decode(input: string, opts: RailFenceOpts): string {
  const rails = clampRails(opts);
  if (input.length === 0) return '';
  const pattern = railPattern(input.length, rails);
  const railLengths = new Array(rails).fill(0);
  for (const r of pattern) railLengths[r]++;
  const railContents: string[] = [];
  let cursor = 0;
  for (let r = 0; r < rails; r++) {
    railContents.push(input.slice(cursor, cursor + railLengths[r]!));
    cursor += railLengths[r]!;
  }
  const railIndex = new Array(rails).fill(0);
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const r = pattern[i]!;
    out += railContents[r]!.charAt(railIndex[r]++);
  }
  return out;
}

export const railFence: CipherSpec<RailFenceOpts> = {
  id: 'rail-fence',
  name: 'Rail Fence',
  tagline: 'Write the message in a zigzag across N rails, then read off rail by rail.',
  category: 'classical',
  modes: ['encode', 'decode'],
  options: [
    {
      id: 'rails',
      label: 'Rails',
      kind: 'number',
      default: 3,
      min: 2,
      max: 12,
      step: 1,
      description: 'Number of rails to zigzag across. More rails = more scrambled.',
    },
  ],
  examples: [
    {
      label: 'Wikipedia',
      input: 'WEAREDISCOVEREDFLEEATONCE',
      opts: { rails: 3 },
      output: 'WECRLTEERDSOEEFEAOCAIVDEN',
    },
    {
      label: 'Four rails',
      input: 'Hello, friend!',
      opts: { rails: 4 },
      output: 'H de,fn!loreli',
    },
  ],
  encode,
  decode,
  viz: () => import('./rail-fence.viz.svelte'),
};
