import type { CipherSpec, CharTransform, Mode } from '../_types';

export type SpongebobOpts = Record<string, never>;

const ALPHA = /[A-Za-z]/;

function apply(input: string): string {
  let out = '';
  let upper = false;
  for (const ch of input) {
    if (ALPHA.test(ch)) {
      out += upper ? ch.toUpperCase() : ch.toLowerCase();
      upper = !upper;
    } else {
      out += ch;
    }
  }
  return out;
}

function trace(input: string, _opts: SpongebobOpts, _mode: Mode): CharTransform[] {
  const chars = Array.from(input);
  const out: CharTransform[] = [];
  let upper = false;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (ALPHA.test(ch)) {
      const next = upper ? ch.toUpperCase() : ch.toLowerCase();
      out.push({
        inIndex: i,
        inChar: ch,
        outChar: next,
        op: upper ? '↑' : '↓',
        detail: upper ? 'upper' : 'lower',
      });
      upper = !upper;
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

export const spongebob: CipherSpec<SpongebobOpts> = {
  id: 'spongebob',
  name: 'SpongeBob',
  tagline: 'aLtErNaTiNg cAsE — encode and decode are the same operation.',
  category: 'fun',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'hello world', opts: {}, output: 'hElLo WoRlD' },
    { label: 'Skeptical', input: 'sure that worked', opts: {}, output: 'sUrE tHaT wOrKeD' },
  ],
  encode: (input) => apply(input),
  decode: (input) => apply(input),
  trace: (input, opts, mode) => trace(input, opts, mode),
};
