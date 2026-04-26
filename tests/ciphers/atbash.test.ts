import { describe, it, expect } from 'vitest';
import { atbash, type AtbashOpts } from '../../src/ciphers/classical/atbash';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { involution, traceMatchesOutput, fc } from '../helpers/properties';

const file = loadVectors<AtbashOpts>('classical/atbash.json');

describe('atbash — vendored reference vectors', () => {
  it('vector file declares its source', () => {
    expect(file.source).toMatch(/Wikipedia/);
  });

  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? atbash.encode! : atbash.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('atbash — properties', () => {
  it('is its own inverse (involution)', () => {
    involution({ apply: (input) => atbash.encode!(input, {}) as string });
  });

  it('encode === decode', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        return atbash.encode!(input, {}) === atbash.decode!(input, {});
      }),
    );
  });

  it('trace().outChar joined === encode()', () => {
    traceMatchesOutput<AtbashOpts, { outChar: string }>({
      encode: (input, opts) => atbash.encode!(input, opts) as string,
      trace: (input, opts) => atbash.trace!(input, opts, 'encode'),
      opts: fc.constant({} as AtbashOpts),
    });
  });
});

describe('atbash — spec metadata', () => {
  it('has id, name, category, modes', () => {
    expect(atbash.id).toBe('atbash');
    expect(atbash.category).toBe('classical');
    expect(atbash.modes).toEqual(['encode', 'decode']);
    expect(atbash.options).toHaveLength(0);
  });
});

describe('atbash.trace', () => {
  it('emits ↔ op for letters and · for passthrough', () => {
    const transforms = atbash.trace!('A!', {}, 'encode');
    expect(transforms[0]?.op).toBe('↔');
    expect(transforms[1]?.op).toBe('·');
  });
});
