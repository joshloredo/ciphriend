import type { CipherSpec, CharTransform, Mode } from '../_types';

export type LeetOpts = Record<string, never>;

/**
 * Common Leet substitutions. Decode is intentionally not supported because
 * the mapping isn't bijective — `1` could be `i` or `l`, `0` could be `o`,
 * `5` could be `s`. Rather than guess, we ship encode-only.
 */
const LEET: Record<string, string> = {
  a: '4', b: '8', e: '3', g: '9', i: '1', l: '1',
  o: '0', s: '5', t: '7', z: '2',
};

function encode(input: string): string {
  let out = '';
  for (const ch of input) {
    const lower = ch.toLowerCase();
    out += LEET[lower] ?? ch;
  }
  return out;
}

function trace(input: string, _opts: LeetOpts, _mode: Mode): CharTransform[] {
  const chars = Array.from(input);
  const out: CharTransform[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const replacement = LEET[ch.toLowerCase()];
    if (replacement) {
      out.push({
        inIndex: i,
        inChar: ch,
        outChar: replacement,
        op: replacement,
        detail: `${ch} → ${replacement}`,
      });
    } else {
      out.push({
        inIndex: i,
        inChar: ch,
        outChar: ch,
        op: '·',
        detail: 'passthrough',
      });
    }
  }
  return out;
}

export const leet: CipherSpec<LeetOpts> = {
  id: 'leet',
  name: 'Leet (1337)',
  tagline: 'Substitute letters with lookalike digits. h3110 fr13nd.',
  category: 'fun',
  modes: ['encode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'hello friend', opts: {}, output: 'h3110 fr13nd' },
    { label: 'Greetz', input: 'leet greetz', opts: {}, output: '1337 9r3372' },
  ],
  encode,
  trace: (input, opts, mode) => trace(input, opts, mode),
};
