import type { CipherSpec } from '../_types';

export type HexOpts = Record<string, never>;

/** Encode UTF-8 bytes as a hex string (lowercase, no separator). */
function encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i]!.toString(16).padStart(2, '0');
  return out;
}

/** Decode a hex string and return the resulting UTF-8 text. Tolerates whitespace and uppercase. */
function decode(input: string): string {
  const cleaned = input.replace(/\s+/g, '').toLowerCase();
  if (cleaned === '') return '';
  if (cleaned.length % 2 !== 0) {
    throw new Error('Hex input must have an even number of digits.');
  }
  if (!/^[0-9a-f]+$/.test(cleaned)) {
    throw new Error('Hex input contains invalid characters.');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Decoded bytes are not valid UTF-8.');
  }
}

export const hex: CipherSpec<HexOpts> = {
  id: 'hex',
  name: 'Hex',
  tagline: 'Bytes as base-16 digits, two characters per byte.',
  category: 'encoding',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'Hello', opts: {}, output: '48656c6c6f' },
    { label: 'World', input: 'World!', opts: {}, output: '576f726c6421' },
  ],
  encode,
  decode,
};
