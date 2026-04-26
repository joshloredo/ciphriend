/**
 * Property-based testing helpers built on fast-check.
 *
 * Centralizes the invariants every cipher / encoding should satisfy so each
 * cipher's test file stays small and focused on the parts that are unique
 * to that cipher.
 *
 * Iteration count comes from the PROP_ITERATIONS env var (default 200).
 *  - npm test                       → 200 iterations
 *  - npm run test:thorough          → 5000 iterations (set in package.json)
 *  - PROP_ITERATIONS=N npm test     → manual override
 *
 * On failure, fast-check shrinks the input to a minimal counter-example,
 * which is the entire reason we use it instead of hand-rolled randomness.
 */

import fc from 'fast-check';

export const PROP_ITERATIONS: number = (() => {
  const raw = process.env.PROP_ITERATIONS;
  const parsed = raw ? Number(raw) : 200;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 200;
})();

const defaultParams: fc.Parameters = {
  numRuns: PROP_ITERATIONS,
};

/**
 * Assert: for every (input, opts), `decode(encode(input, opts), opts) === input`.
 * The canonical property for any reversible cipher.
 */
export function roundTrip<O>(params: {
  encode: (input: string, opts: O) => string;
  decode: (input: string, opts: O) => string;
  opts: fc.Arbitrary<O>;
  input?: fc.Arbitrary<string>;
  /** Optional override for fast-check parameters (numRuns, seed, etc.). */
  fcParams?: Partial<fc.Parameters>;
}): void {
  const inputArb = params.input ?? fc.string();
  fc.assert(
    fc.property(inputArb, params.opts, (input, opts) => {
      return params.decode(params.encode(input, opts), opts) === input;
    }),
    { ...defaultParams, ...params.fcParams },
  );
}

/**
 * Assert: for every input, `apply(apply(input)) === input`.
 * Canonical property for involutive ciphers (Atbash, ROT13).
 */
export function involution(params: {
  apply: (input: string) => string;
  input?: fc.Arbitrary<string>;
  fcParams?: Partial<fc.Parameters>;
}): void {
  const inputArb = params.input ?? fc.string();
  fc.assert(
    fc.property(inputArb, (input) => {
      return params.apply(params.apply(input)) === input;
    }),
    { ...defaultParams, ...params.fcParams },
  );
}

/**
 * Assert: for every input, the function returns the same output across
 * repeated invocations. Canonical property for hashes and pure encodings.
 */
export function determinism(params: {
  apply: (input: string) => string;
  input?: fc.Arbitrary<string>;
  fcParams?: Partial<fc.Parameters>;
}): void {
  const inputArb = params.input ?? fc.string();
  fc.assert(
    fc.property(inputArb, (input) => {
      return params.apply(input) === params.apply(input);
    }),
    { ...defaultParams, ...params.fcParams },
  );
}

/**
 * Assert: the trace's outChars, joined, equal the cipher's output for the
 * same inputs. Catches bugs where `trace()` and `encode()`/`decode()` drift
 * apart.
 */
export function traceMatchesOutput<O, T extends { outChar: string }>(params: {
  encode: (input: string, opts: O) => string;
  trace: (input: string, opts: O) => T[];
  opts: fc.Arbitrary<O>;
  input?: fc.Arbitrary<string>;
  fcParams?: Partial<fc.Parameters>;
}): void {
  const inputArb = params.input ?? fc.string();
  fc.assert(
    fc.property(inputArb, params.opts, (input, opts) => {
      const expected = params.encode(input, opts);
      const fromTrace = params.trace(input, opts).map((t) => t.outChar).join('');
      return fromTrace === expected;
    }),
    { ...defaultParams, ...params.fcParams },
  );
}

export { fc };
