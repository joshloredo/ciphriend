import { describe, it, expect } from 'vitest';
import { url, type UrlOpts } from '../../src/ciphers/encoding/url';
import { loadVectors, runnableVectors } from '../helpers/vector-runner';
import { roundTrip, fc } from '../helpers/properties';

const file = loadVectors<UrlOpts>('encoding/url.json');

describe('url — vendored reference vectors', () => {
  for (const v of runnableVectors(file)) {
    const mode = v.mode ?? 'encode';
    it(`${v.id} (${mode}): ${v.comment ?? ''}`, () => {
      const fn = mode === 'encode' ? url.encode! : url.decode!;
      expect(fn(v.input, v.opts)).toBe(v.expected);
    });
  }
});

describe('url — properties', () => {
  it('round-trip: decode(encode(x)) === x', () => {
    roundTrip<UrlOpts>({
      encode: (input) => url.encode!(input, {}) as string,
      decode: (input) => url.decode!(input, {}) as string,
      opts: fc.constant({} as UrlOpts),
    });
  });

  it('matches platform encodeURIComponent', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        return url.encode!(input, {}) === encodeURIComponent(input);
      }),
    );
  });
});

describe('url — error handling', () => {
  it('throws on malformed percent-escape', () => {
    expect(() => url.decode!('%G1', {})).toThrow();
  });
});
