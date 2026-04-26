/**
 * URL fragment serialization for shareable cipher state.
 *
 * Format:
 *   #c=<cipherId>&m=<mode>&<optKey>=<optValue>&...&p=<base64UrlPayload>
 *
 * Invariants (load-bearing — see CLAUDE.md):
 *   - Ephemeral fields (keys/passwords) are NEVER included.
 *   - Fragments cap at 6kB. Above the cap, refuse to serialize.
 *   - Payload is base64url-encoded UTF-8 to survive URL parsing.
 */

import type { CipherSpec, Mode, OptionField } from '../ciphers/_types';

export const FRAGMENT_MAX_BYTES = 6 * 1024;

export interface FragmentState {
  cipherId: string;
  mode: Mode;
  /** Non-ephemeral option values, keyed by OptionField.id. */
  opts: Record<string, string | number | boolean>;
  payload: string;
}

export type SerializeResult =
  | { ok: true; hash: string }
  | { ok: false; reason: 'too-large'; bytes: number };

/* -------------------------- base64url helpers -------------------------- */

export function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* -------------------------- serialize / parse -------------------------- */

function isEphemeral(field: OptionField): boolean {
  return field.kind === 'password' || field.ephemeral === true;
}

export function serialize(
  cipher: CipherSpec,
  state: { mode: Mode; opts: Record<string, unknown>; payload: string },
): SerializeResult {
  const params = new URLSearchParams();
  params.set('c', cipher.id);
  params.set('m', state.mode);

  for (const field of cipher.options) {
    if (isEphemeral(field)) continue;
    const value = state.opts[field.id];
    if (value === undefined || value === null) continue;
    params.set(field.id, String(value));
  }

  if (state.payload.length > 0) {
    params.set('p', toBase64Url(state.payload));
  }

  const hash = '#' + params.toString();
  const bytes = new TextEncoder().encode(hash).length;
  if (bytes > FRAGMENT_MAX_BYTES) {
    return { ok: false, reason: 'too-large', bytes };
  }
  return { ok: true, hash };
}

export function parse(
  hash: string,
  cipher: CipherSpec,
): Partial<FragmentState> {
  const trimmed = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!trimmed) return {};
  const params = new URLSearchParams(trimmed);

  const cipherId = params.get('c') ?? undefined;
  const rawMode = params.get('m');
  const mode: Mode | undefined = rawMode === 'encode' || rawMode === 'decode' ? rawMode : undefined;

  const opts: Record<string, string | number | boolean> = {};
  for (const field of cipher.options) {
    if (isEphemeral(field)) continue;
    const raw = params.get(field.id);
    if (raw === null) continue;
    opts[field.id] = coerce(raw, field);
  }

  const rawPayload = params.get('p');
  let payload: string | undefined;
  if (rawPayload !== null) {
    try {
      payload = fromBase64Url(rawPayload);
    } catch {
      payload = undefined;
    }
  }

  const out: Partial<FragmentState> = {};
  if (cipherId !== undefined) out.cipherId = cipherId;
  if (mode !== undefined) out.mode = mode;
  if (Object.keys(opts).length > 0) out.opts = opts;
  if (payload !== undefined) out.payload = payload;
  return out;
}

function coerce(raw: string, field: OptionField): string | number | boolean {
  if (field.kind === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : (field.default as number) ?? 0;
  }
  if (field.kind === 'toggle') return raw === 'true' || raw === '1';
  return raw;
}
