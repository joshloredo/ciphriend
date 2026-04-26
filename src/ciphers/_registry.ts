import type { CipherSpec } from './_types';
import { caesar } from './classical/caesar';
import { rot13 } from './classical/rot13';
import { atbash } from './classical/atbash';
import { vigenere } from './classical/vigenere';
import { railFence } from './classical/rail-fence';
import { affine } from './classical/affine';
import { bacon } from './classical/bacon';
import { base64 } from './encoding/base64';
import { hex } from './encoding/hex';
import { url } from './encoding/url';
import { binary } from './encoding/binary';
import { sha256 } from './hash/sha-256';
import { aesGcm } from './modern/aes-gcm';
import { morse } from './fun/morse';
import { reverse } from './fun/reverse';
import { spongebob } from './fun/spongebob';
import { leet } from './fun/leet';
import { nato } from './fun/nato';
import { pigLatin } from './fun/pig-latin';
import { frequency } from './analysis/frequency';

/**
 * The single source of truth for which ciphers exist.
 * Adding a new cipher = import its CipherSpec + push it here. That's it.
 */
export const ciphers: CipherSpec[] = [
  caesar as CipherSpec,
  rot13 as CipherSpec,
  atbash as CipherSpec,
  vigenere as CipherSpec,
  railFence as CipherSpec,
  affine as CipherSpec,
  bacon as CipherSpec,
  base64 as CipherSpec,
  hex as CipherSpec,
  url as CipherSpec,
  binary as CipherSpec,
  sha256 as CipherSpec,
  aesGcm as CipherSpec,
  morse as CipherSpec,
  reverse as CipherSpec,
  spongebob as CipherSpec,
  leet as CipherSpec,
  nato as CipherSpec,
  pigLatin as CipherSpec,
  frequency as CipherSpec,
];

/** Look up a cipher by id. Used by route handlers and the workbench. */
export function getCipher(id: string): CipherSpec | undefined {
  return ciphers.find(c => c.id === id);
}

/** Group ciphers by category for the home grid. */
export function ciphersByCategory(): Record<string, CipherSpec[]> {
  const grouped: Record<string, CipherSpec[]> = {};
  for (const c of ciphers) {
    (grouped[c.category] ??= []).push(c);
  }
  return grouped;
}
