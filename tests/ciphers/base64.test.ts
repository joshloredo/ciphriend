import { describe, it, expect } from 'vitest';
import { base64, type Base64Opts } from '../../src/ciphers/encoding/base64';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { roundTrip, fc } from '../helpers/properties';

const file = loadVectors<Base64Opts>('rfc/base64.json');

describe('base64 — RFC 4648 §10 + extended vectors', () => {
  it('vector file declares its source', () => {
    expect(file.source).toMatch(/RFC 4648/);
  });

  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? base64.encode! : base64.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('base64 — properties', () => {
  it('round-trip: decode(encode(x)) === x for arbitrary text', () => {
    roundTrip<Base64Opts>({
      encode: (input) => base64.encode!(input, {}) as string,
      decode: (input) => base64.decode!(input, {}) as string,
      opts: fc.constant({} as Base64Opts),
    });
  });

  it('matches platform Buffer.from(s).toString("base64") for ASCII', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const ours = base64.encode!(input, {}) as string;
        const platform = Buffer.from(input, 'utf8').toString('base64');
        return ours === platform;
      }),
    );
  });
});

describe('base64 — error handling', () => {
  it('throws on invalid base64 input', () => {
    expect(() => base64.decode!('!!!notbase64!!!', {})).toThrow();
  });
});

describe('base64 — spec metadata', () => {
  it('has the bit-grouping viz registered', () => {
    expect(base64.viz).toBeDefined();
    expect(typeof base64.viz).toBe('function');
  });
});
