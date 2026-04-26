import { describe, it, expect } from 'vitest';
import { caesar } from '../../src/ciphers/classical/caesar';
import {
  serialize,
  parse,
  toBase64Url,
  fromBase64Url,
  FRAGMENT_MAX_BYTES,
} from '../../src/lib/url-fragment';
import type { CipherSpec } from '../../src/ciphers/_types';

describe('base64url helpers', () => {
  it('round-trips ASCII', () => {
    expect(fromBase64Url(toBase64Url('HELLO'))).toBe('HELLO');
  });

  it('round-trips Unicode', () => {
    expect(fromBase64Url(toBase64Url('Héllo 🔒 世界'))).toBe('Héllo 🔒 世界');
  });

  it('produces URL-safe output (no +, /, =)', () => {
    const encoded = toBase64Url('?>?>?>?>?>?>');
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('round-trips empty string', () => {
    expect(fromBase64Url(toBase64Url(''))).toBe('');
  });
});

describe('serialize', () => {
  it('encodes cipher, mode, options, and payload', () => {
    const result = serialize(caesar as CipherSpec, {
      mode: 'encode',
      opts: { shift: 3 },
      payload: 'HELLO',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hash).toContain('c=caesar');
      expect(result.hash).toContain('m=encode');
      expect(result.hash).toContain('shift=3');
      expect(result.hash).toContain('p=');
    }
  });

  it('refuses payloads that overflow the fragment cap', () => {
    const huge = 'A'.repeat(FRAGMENT_MAX_BYTES + 100);
    const result = serialize(caesar as CipherSpec, {
      mode: 'encode',
      opts: { shift: 3 },
      payload: huge,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('too-large');
      expect(result.bytes).toBeGreaterThan(FRAGMENT_MAX_BYTES);
    }
  });

  it('omits payload key when payload is empty', () => {
    const result = serialize(caesar as CipherSpec, {
      mode: 'encode',
      opts: { shift: 3 },
      payload: '',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.hash).not.toContain('p=');
  });

  it('excludes ephemeral fields', () => {
    const cipherWithKey: CipherSpec = {
      ...(caesar as CipherSpec),
      id: 'ephemeral-test',
      options: [
        ...caesar.options,
        { id: 'secret', label: 'Secret', kind: 'password', ephemeral: true },
      ],
    };
    const result = serialize(cipherWithKey, {
      mode: 'encode',
      opts: { shift: 3, secret: 'hunter2' },
      payload: 'HELLO',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hash).not.toContain('hunter2');
      expect(result.hash).not.toContain('secret');
    }
  });
});

describe('parse', () => {
  it('round-trips through serialize', () => {
    const result = serialize(caesar as CipherSpec, {
      mode: 'encode',
      opts: { shift: 7 },
      payload: 'Hello, World!',
    });
    if (!result.ok) throw new Error('serialize failed');
    const parsed = parse(result.hash, caesar as CipherSpec);
    expect(parsed.cipherId).toBe('caesar');
    expect(parsed.mode).toBe('encode');
    expect(parsed.opts?.shift).toBe(7);
    expect(parsed.payload).toBe('Hello, World!');
  });

  it('handles fragment without leading hash', () => {
    const parsed = parse('c=caesar&m=decode&shift=4', caesar as CipherSpec);
    expect(parsed.cipherId).toBe('caesar');
    expect(parsed.mode).toBe('decode');
    expect(parsed.opts?.shift).toBe(4);
  });

  it('returns empty object for empty fragment', () => {
    expect(parse('', caesar as CipherSpec)).toEqual({});
    expect(parse('#', caesar as CipherSpec)).toEqual({});
  });

  it('ignores invalid mode values', () => {
    const parsed = parse('#c=caesar&m=hax', caesar as CipherSpec);
    expect(parsed.mode).toBeUndefined();
  });

  it('coerces number fields', () => {
    const parsed = parse('#c=caesar&shift=12', caesar as CipherSpec);
    expect(parsed.opts?.shift).toBe(12);
    expect(typeof parsed.opts?.shift).toBe('number');
  });

  it('falls back gracefully on malformed payload', () => {
    const parsed = parse('#c=caesar&p=!!!notbase64!!!', caesar as CipherSpec);
    expect(parsed.payload).toBeUndefined();
  });
});
