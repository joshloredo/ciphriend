import type { CipherSpec } from '../_types';

export type BinaryOpts = Record<string, never>;

/** Encode UTF-8 bytes as 8-bit binary digits, space-separated per byte. */
function encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    parts.push(bytes[i]!.toString(2).padStart(8, '0'));
  }
  return parts.join(' ');
}

/** Decode a binary string (digits 0/1, any whitespace separators) to UTF-8 text. */
function decode(input: string): string {
  const cleaned = input.replace(/\s+/g, '');
  if (cleaned === '') return '';
  if (cleaned.length % 8 !== 0) {
    throw new Error('Binary input length must be a multiple of 8 bits.');
  }
  if (!/^[01]+$/.test(cleaned)) {
    throw new Error('Binary input must contain only 0s and 1s.');
  }
  const bytes = new Uint8Array(cleaned.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 8, i * 8 + 8), 2);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Decoded bytes are not valid UTF-8.');
  }
}

export const binary: CipherSpec<BinaryOpts> = {
  id: 'binary',
  name: 'Binary',
  tagline: 'Bytes as 8-bit binary, space-separated.',
  category: 'encoding',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hi', input: 'Hi', opts: {}, output: '01001000 01101001' },
    { label: 'OK', input: 'OK!', opts: {}, output: '01001111 01001011 00100001' },
  ],
  encode,
  decode,
};
