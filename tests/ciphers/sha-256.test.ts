import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { sha256, type Sha256Opts } from '../../src/ciphers/hash/sha-256';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { determinism, fc } from '../helpers/properties';

const file = loadVectors<Sha256Opts>('nist/sha-256.json');

describe('sha-256 — NIST FIPS 180-4 vectors', () => {
  it('vector file declares its source', () => {
    expect(file.source).toMatch(/NIST FIPS 180-4/);
  });

  for (const v of runnableVectors(file)) {
    it(`${v.id}: ${v.comment ?? ''}`, async () => {
      expect(await sha256.encode!(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('sha-256 — properties', () => {
  it('is deterministic (same input → same digest)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (input) => {
        const a = await sha256.encode!(input, {});
        const b = await sha256.encode!(input, {});
        return a === b;
      }),
    );
  });

  it('matches Node native crypto.createHash("sha256")', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (input) => {
        const ours = await sha256.encode!(input, {});
        const node = createHash('sha256').update(input, 'utf8').digest('hex');
        return ours === node;
      }),
    );
  });

  it('output is always 64 lowercase hex characters', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (input) => {
        const out = await sha256.encode!(input, {});
        return /^[0-9a-f]{64}$/.test(out);
      }),
    );
  });

  it('avalanche: a 1-character change changes most output bits', async () => {
    const a = await sha256.encode!('The quick brown fox jumps over the lazy dog', {});
    const b = await sha256.encode!('The quick brown fox jumps over the lazy doh', {});
    let diff = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
    // For SHA-256's hex form, ~30+ of 64 chars differ on a 1-char input change.
    expect(diff).toBeGreaterThan(20);
  });
});

describe('sha-256 — spec metadata', () => {
  it('is encode-only (no decode)', () => {
    expect(sha256.modes).toEqual(['encode']);
    expect(sha256.decode).toBeUndefined();
  });
});
