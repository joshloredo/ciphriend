import { describe, it, expect } from 'vitest';
import { aesGcm, type AesGcmOpts } from '../../src/ciphers/modern/aes-gcm';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { fc } from '../helpers/properties';

const file = loadVectors<AesGcmOpts>('modern/aes-gcm.json');

describe('aes-gcm — decode-only static fixtures', () => {
  it('vector file declares its source', () => {
    expect(file.source).toMatch(/AES-256-GCM/);
  });

  for (const v of runnableVectors(file)) {
    it(`${v.id}: ${v.comment ?? ''}`, async () => {
      expect(await aesGcm.decode!(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('aes-gcm — round-trip property', () => {
  // Smaller iteration count by default — each test does 100k PBKDF2 rounds (slow).
  // PROP_ITERATIONS=200 default × ~15ms per round-trip ≈ 3s, still tolerable.
  // Reduce here to keep the suite fast; thorough tier inherits PROP_ITERATIONS=5000.
  const fastParams = { numRuns: 25 };

  it('round-trip: decode(encode(x, {pp}), {pp}) === x', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string(),
        fc.stringMatching(/^[\x20-\x7e]{4,40}$/),
        async (plaintext, passphrase) => {
          const ct = await aesGcm.encode!(plaintext, { passphrase });
          const pt = await aesGcm.decode!(ct, { passphrase });
          return pt === plaintext;
        },
      ),
      fastParams,
    );
  });

  it('same plaintext + same passphrase produces DIFFERENT ciphertexts (random salt+IV)', async () => {
    const a = await aesGcm.encode!('Hello', { passphrase: 'pw' });
    const b = await aesGcm.encode!('Hello', { passphrase: 'pw' });
    expect(a).not.toBe(b);
  });
});

describe('aes-gcm — error handling', () => {
  it('decode rejects with wrong passphrase', async () => {
    const ct = await aesGcm.encode!('secret message', { passphrase: 'correct' });
    await expect(aesGcm.decode!(ct, { passphrase: 'incorrect' })).rejects.toThrow(/Decryption failed/);
  });

  it('decode rejects garbage input', async () => {
    await expect(aesGcm.decode!('not-base64-at-all-!!!', { passphrase: 'pw' })).rejects.toThrow();
  });

  it('decode rejects too-short ciphertext', async () => {
    // Less than salt(16) + iv(12) + tag(16) = 44 bytes
    await expect(aesGcm.decode!('YWJjZA==', { passphrase: 'pw' })).rejects.toThrow(/too short/);
  });

  it('encode rejects empty passphrase', async () => {
    await expect(aesGcm.encode!('hello', { passphrase: '' })).rejects.toThrow(/required/);
  });
});

describe('aes-gcm — spec metadata', () => {
  it('passphrase field is marked ephemeral', () => {
    const pp = aesGcm.options.find((o) => o.id === 'passphrase');
    expect(pp?.ephemeral).toBe(true);
    expect(pp?.kind).toBe('password');
  });

  it('category is modern, both modes supported', () => {
    expect(aesGcm.category).toBe('modern');
    expect(aesGcm.modes).toEqual(['encode', 'decode']);
  });
});
