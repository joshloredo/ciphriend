/**
 * Alphabet helpers used by classical-cipher implementations.
 * Everything here is ASCII-only by design — classical ciphers operate on
 * the 26-letter Latin alphabet. Non-letters are passed through unchanged.
 */

export const A_UPPER = 65;
export const Z_UPPER = 90;
export const A_LOWER = 97;
export const Z_LOWER = 122;
export const ALPHABET_SIZE = 26;

export function isUpper(code: number): boolean {
  return code >= A_UPPER && code <= Z_UPPER;
}

export function isLower(code: number): boolean {
  return code >= A_LOWER && code <= Z_LOWER;
}

export function isLetter(code: number): boolean {
  return isUpper(code) || isLower(code);
}

/** Positive modulo — `((-1) %% 26) === 25`, unlike JS `%`. */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * Shift a single letter by `shift` positions, preserving case.
 * Non-letters are returned unchanged.
 */
export function shiftChar(ch: string, shift: number): string {
  const code = ch.charCodeAt(0);
  if (isUpper(code)) {
    return String.fromCharCode(A_UPPER + mod(code - A_UPPER + shift, ALPHABET_SIZE));
  }
  if (isLower(code)) {
    return String.fromCharCode(A_LOWER + mod(code - A_LOWER + shift, ALPHABET_SIZE));
  }
  return ch;
}
