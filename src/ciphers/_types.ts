/**
 * Ciphriend cipher engine — type definitions.
 *
 * Pure TypeScript. NO framework imports. Anything in src/ciphers/ must be
 * runnable in plain Node (for tests) and in the browser (for the UI) without
 * adapters. Violating this assumption breaks tests and portability.
 */

export type CipherCategory =
  | 'classical'
  | 'modern'
  | 'encoding'
  | 'hash'
  | 'analysis';

export type Mode = 'encode' | 'decode';

export interface OptionField {
  id: string;
  label: string;
  kind: 'text' | 'number' | 'select' | 'toggle' | 'password';
  default?: unknown;
  description?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  /** When true, this field's value is NEVER persisted or URL-shared.
   *  Use for keys, passwords, and any other sensitive material. */
  ephemeral?: true;
}

/**
 * One step of a per-character transformation, used by visualizations.
 * `outChar` is `''` if the input char is dropped (e.g., whitespace).
 * `outIndex` is set when the output position differs from the input position
 * (transpositions like Rail Fence). `group` is a small integer used by the
 * generic visualizer for color grouping (e.g., Vigenère key-cycle position).
 *
 * `op` is the compact operation glyph shown between input and output rows
 * in the generic visualizer (e.g., "+3" for Caesar, "K(+10)" for Vigenère,
 * "↔" for Atbash). Use "·" or "—" for passthrough characters so columns
 * stay aligned. `detail` is the verbose hover/aria-label version.
 */
export interface CharTransform {
  inIndex: number;
  inChar: string;
  outChar: string;
  outIndex?: number;
  detail?: string;
  op?: string;
  group?: number;
}

export interface CipherExample<O = Record<string, unknown>> {
  input: string;
  opts: O;
  output: string;
  /** Optional human-readable label shown in the "Try an example" UI. */
  label?: string;
}

export interface CipherSpec<O = Record<string, unknown>> {
  /** URL slug, e.g. 'caesar'. */
  id: string;
  /** Display name, e.g. 'Caesar Cipher'. */
  name: string;
  /** One-line description shown on cards. */
  tagline: string;
  category: CipherCategory;
  /** Hashes are encode-only; most others support both. */
  modes: Mode[];
  options: OptionField[];
  examples?: CipherExample<O>[];
  encode?: (input: string, opts: O) => string | Promise<string>;
  decode?: (input: string, opts: O) => string | Promise<string>;
  /**
   * Optional pure function returning a per-character transformation trace.
   * When present (and `viz` is omitted), the workbench renders the generic
   * <TraceVisualizer> using these transforms.
   */
  trace?: (input: string, opts: O, mode: Mode) => CharTransform[];
  /**
   * Optional custom Svelte visualization component. Wins over `trace` if
   * both are present. Lazy-loaded — only fetched when the cipher page mounts.
   */
  viz?: () => Promise<{ default: unknown }>;
}
