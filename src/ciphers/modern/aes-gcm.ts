import type { CipherSpec } from '../_types';

/**
 * AES-256-GCM with passphrase-derived keys.
 *
 * Wire format (base64): salt(16) || iv(12) || ciphertext+tag
 *
 * Key derivation: PBKDF2-SHA-256, 100,000 iterations, 256-bit output.
 * Both salt and IV are random per encryption — same plaintext + same
 * passphrase produces different ciphertexts every time. Decryption is
 * deterministic: parse salt + iv from the prefix, derive key, decrypt.
 *
 * The passphrase field is marked ephemeral so it never leaves tab memory
 * (no localStorage, no URL fragment, no error reporting).
 */

export interface AesGcmOpts {
  passphrase: string;
}

const PBKDF2_ITERATIONS = 100_000;
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_BITS = 256;

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s+/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return globalThis.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_BITS },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encode(input: string, opts: AesGcmOpts): Promise<string> {
  if (!opts.passphrase) throw new Error('Passphrase required.');
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(opts.passphrase, salt);
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(input),
  );
  const ct = new Uint8Array(ciphertext);
  const combined = new Uint8Array(SALT_LEN + IV_LEN + ct.length);
  combined.set(salt, 0);
  combined.set(iv, SALT_LEN);
  combined.set(ct, SALT_LEN + IV_LEN);
  return bytesToBase64(combined);
}

async function decode(input: string, opts: AesGcmOpts): Promise<string> {
  if (!opts.passphrase) throw new Error('Passphrase required.');
  let combined: Uint8Array;
  try {
    combined = base64ToBytes(input);
  } catch {
    throw new Error('Input is not valid base64.');
  }
  if (combined.length < SALT_LEN + IV_LEN + 16) {
    throw new Error('Ciphertext too short to be valid.');
  }
  const salt = combined.slice(0, SALT_LEN);
  const iv = combined.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const ct = combined.slice(SALT_LEN + IV_LEN);
  const key = await deriveKey(opts.passphrase, salt);
  let plaintext: ArrayBuffer;
  try {
    plaintext = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ct,
    );
  } catch {
    throw new Error('Decryption failed — wrong passphrase or corrupted ciphertext.');
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
  } catch {
    throw new Error('Decrypted bytes are not valid UTF-8.');
  }
}

export const aesGcm: CipherSpec<AesGcmOpts> = {
  id: 'aes-gcm',
  name: 'AES-GCM',
  tagline: 'Modern authenticated encryption. AES-256 + PBKDF2-derived key from your passphrase.',
  category: 'modern',
  modes: ['encode', 'decode'],
  options: [
    {
      id: 'passphrase',
      label: 'Passphrase',
      kind: 'password',
      description: 'Used to derive the encryption key (PBKDF2-SHA-256, 100,000 iterations). Never persisted, never included in share links.',
      ephemeral: true,
    },
  ],
  examples: [
    {
      label: 'Quick',
      input: 'A friendly secret.',
      opts: { passphrase: 'open-sesame' },
      output: '',
    },
  ],
  encode,
  decode,
};
