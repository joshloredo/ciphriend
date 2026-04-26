import type { CipherSpec, CharTransform, Mode } from '../_types';

export type ReverseOpts = Record<string, never>;

function apply(input: string): string {
  // Use Array.from to handle surrogate pairs (emoji etc.) as single code points.
  return Array.from(input).reverse().join('');
}

function trace(input: string, _opts: ReverseOpts, _mode: Mode): CharTransform[] {
  const chars = Array.from(input);
  const reversed = [...chars].reverse();
  const out: CharTransform[] = [];
  for (let i = 0; i < chars.length; i++) {
    out.push({
      inIndex: i,
      inChar: chars[i]!,
      outChar: reversed[i]!,
      outIndex: chars.length - 1 - i,
      detail: `from position ${chars.length - 1 - i}`,
      op: '↶',
    });
  }
  return out;
}

export const reverse: CipherSpec<ReverseOpts> = {
  id: 'reverse',
  name: 'Reverse',
  tagline: 'Read the input backwards. The simplest possible cipher.',
  category: 'fun',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'Hello, friend!', opts: {}, output: '!dneirf ,olleH' },
    { label: 'Palindrome', input: 'racecar', opts: {}, output: 'racecar' },
  ],
  encode: (input) => apply(input),
  decode: (input) => apply(input),
  trace: (input, opts, mode) => trace(input, opts, mode),
};
