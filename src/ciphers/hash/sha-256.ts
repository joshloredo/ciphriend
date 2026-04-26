import type { CipherSpec } from '../_types';

export type Sha256Opts = Record<string, never>;

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i]!.toString(16).padStart(2, '0');
  return out;
}

async function encode(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

export const sha256: CipherSpec<Sha256Opts> = {
  id: 'sha-256',
  name: 'SHA-256',
  tagline: 'One-way 256-bit cryptographic hash. Same input always yields the same digest.',
  category: 'hash',
  modes: ['encode'],
  options: [],
  examples: [
    {
      label: 'Hello',
      input: 'Hello, World!',
      opts: {},
      output: 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f',
    },
    {
      label: 'Quick fox',
      input: 'The quick brown fox jumps over the lazy dog',
      opts: {},
      output: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
    },
  ],
  encode,
};
