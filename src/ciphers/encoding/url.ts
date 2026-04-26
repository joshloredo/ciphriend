import type { CipherSpec } from '../_types';

export type UrlOpts = Record<string, never>;

/**
 * Percent-encode for use in URL components.
 * Uses the platform's encodeURIComponent, which conforms to RFC 3986
 * for unreserved characters (a-zA-Z0-9-_.~).
 */
function encode(input: string): string {
  return encodeURIComponent(input);
}

function decode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    throw new Error('Input contains invalid percent-escape sequences.');
  }
}

export const url: CipherSpec<UrlOpts> = {
  id: 'url',
  name: 'URL',
  tagline: 'Percent-encode characters that would break a URL.',
  category: 'encoding',
  modes: ['encode', 'decode'],
  options: [],
  examples: [
    { label: 'Spaces', input: 'hello world', opts: {}, output: 'hello%20world' },
    { label: 'Symbols', input: 'a/b?c=d&e', opts: {}, output: 'a%2Fb%3Fc%3Dd%26e' },
  ],
  encode,
  decode,
};
