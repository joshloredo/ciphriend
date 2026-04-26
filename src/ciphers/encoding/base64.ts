import type { CipherSpec } from '../_types';

export type Base64Opts = Record<string, never>;

/** Encode UTF-8 bytes of `input` as standard Base64 (RFC 4648 §4). */
function encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

/** Decode Base64 (RFC 4648 §4) and return the resulting UTF-8 text. */
function decode(input: string): string {
  const cleaned = input.replace(/\s+/g, '');
  if (cleaned === '') return '';
  let bin: string;
  try {
    bin = atob(cleaned);
  } catch {
    throw new Error('Input is not valid Base64.');
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Decoded bytes are not valid UTF-8.');
  }
}

export const base64: CipherSpec<Base64Opts> = {
  id: 'base64',
  name: 'Base64',
  tagline: 'Pack arbitrary bytes into the printable subset of ASCII.',
  category: 'encoding',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Hello', input: 'Hello, World!', opts: {}, output: 'SGVsbG8sIFdvcmxkIQ==' },
    { label: 'foobar', input: 'foobar', opts: {}, output: 'Zm9vYmFy' },
  ],
  encode,
  decode,
};
