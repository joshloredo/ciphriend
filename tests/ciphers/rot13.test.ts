import { describe, it, expect } from 'vitest';
import { rot13, type Rot13Opts } from '../../src/ciphers/classical/rot13';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { involution, traceMatchesOutput, fc } from '../helpers/properties';

const file = loadVectors<Rot13Opts>('classical/rot13.json');

describe('rot13 — vendored reference vectors', () => {
  it('vector file declares its source', () => {
    expect(file.source).toMatch(/Wikipedia/);
  });

  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? rot13.encode! : rot13.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('rot13 — properties', () => {
  it('is its own inverse (involution)', () => {
    involution({ apply: (input) => rot13.encode!(input, {}) as string });
  });

  it('encode === decode', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        return rot13.encode!(input, {}) === rot13.decode!(input, {});
      }),
    );
  });

  it('trace().outChar joined === encode()', () => {
    traceMatchesOutput<Rot13Opts, { outChar: string }>({
      encode: (input, opts) => rot13.encode!(input, opts) as string,
      trace: (input, opts) => rot13.trace!(input, opts, 'encode'),
      opts: fc.constant({} as Rot13Opts),
    });
  });
});

describe('rot13 — spec metadata', () => {
  it('has id, name, category, modes', () => {
    expect(rot13.id).toBe('rot13');
    expect(rot13.category).toBe('classical');
    expect(rot13.modes).toEqual(['encode', 'decode']);
    expect(rot13.options).toHaveLength(0);
  });
});

describe('rot13.trace', () => {
  it('emits +13 op for letters and · for passthrough', () => {
    const transforms = rot13.trace!('A1', {}, 'encode');
    expect(transforms[0]?.op).toBe('+13');
    expect(transforms[1]?.op).toBe('·');
  });
});
