import type { CipherSpec } from './_types';
import { caesar } from './classical/caesar';
import { rot13 } from './classical/rot13';
import { atbash } from './classical/atbash';
import { vigenere } from './classical/vigenere';

/**
 * The single source of truth for which ciphers exist.
 * Adding a new cipher = import its CipherSpec + push it here. That's it.
 */
export const ciphers: CipherSpec[] = [
  caesar as CipherSpec,
  rot13 as CipherSpec,
  atbash as CipherSpec,
  vigenere as CipherSpec,
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
