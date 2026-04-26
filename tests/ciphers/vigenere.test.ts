import { describe, it, expect } from 'vitest';
import { vigenere, type VigenereOpts } from '../../src/ciphers/classical/vigenere';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { roundTrip, traceMatchesOutput, fc } from '../helpers/properties';

const file = loadVectors<VigenereOpts>('classical/vigenere.json');

describe('vigenere — vendored reference vectors', () => {
  it('vector file declares its source', () => {
    expect(file.source).toMatch(/Wikipedia/);
  });

  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? vigenere.encode! : vigenere.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('vigenere — properties', () => {
  // fast-check needs a non-empty key for round-trip (empty key is identity, which is fine but uninformative)
  const keyArb = fc
    .stringMatching(/^[A-Za-z]{1,12}$/)
    .map<VigenereOpts>((key) => ({ key }));

  it('round-trip: decode(encode(x, k), k) === x', () => {
    roundTrip<VigenereOpts>({
      encode: (input, opts) => vigenere.encode!(input, opts) as string,
      decode: (input, opts) => vigenere.decode!(input, opts) as string,
      opts: keyArb,
    });
  });

  it('trace().outChar joined === encode()', () => {
    traceMatchesOutput<VigenereOpts, { outChar: string }>({
      encode: (input, opts) => vigenere.encode!(input, opts) as string,
      trace: (input, opts) => vigenere.trace!(input, opts, 'encode'),
      opts: keyArb,
    });
  });
});

describe('vigenere — spec metadata', () => {
  it('has id, name, category, modes, key option', () => {
    expect(vigenere.id).toBe('vigenere');
    expect(vigenere.category).toBe('classical');
    expect(vigenere.modes).toEqual(['encode', 'decode']);
    const keyField = vigenere.options.find((o) => o.id === 'key');
    expect(keyField).toBeDefined();
    expect(keyField?.kind).toBe('text');
  });

  it('key is NOT marked ephemeral — Vigenère is not real crypto, sharing should include the key', () => {
    const keyField = vigenere.options.find((o) => o.id === 'key');
    expect(keyField?.ephemeral).toBeUndefined();
  });
});

describe('vigenere.trace', () => {
  it('emits compact key+shift op label and groups by key-cycle position', () => {
    const transforms = vigenere.trace!('AB', { key: 'CD' }, 'encode');
    expect(transforms[0]?.op).toBe('C(+2)');
    expect(transforms[1]?.op).toBe('D(+3)');
    expect(transforms[0]?.group).toBe(0);
    expect(transforms[1]?.group).toBe(1);
  });

  it('decode mode flips the sign in the op label', () => {
    const transforms = vigenere.trace!('CE', { key: 'CD' }, 'decode');
    expect(transforms[0]?.op).toBe('C(-2)');
    expect(transforms[1]?.op).toBe('D(-3)');
  });

  it('non-letters do not advance the key cycle', () => {
    const transforms = vigenere.trace!('A!B', { key: 'CD' }, 'encode');
    expect(transforms[0]?.op).toBe('C(+2)');
    expect(transforms[1]?.op).toBe('·');
    expect(transforms[2]?.op).toBe('D(+3)');
  });
});
