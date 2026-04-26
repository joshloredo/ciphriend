/**
 * Generic test-vector runner.
 *
 * Loads a JSON file from `tests/vectors/<source>/<file>.json`, iterates each
 * vector, and lets the caller assert against it. Filtering by `flags` lets
 * different test tiers skip slow / thorough-only / full-only vectors.
 *
 * File format documented in tests/vectors/README.md.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const VECTORS_ROOT = resolve(HERE, '..', 'vectors');

export type VectorMode = 'encode' | 'decode';

export interface Vector<O = Record<string, unknown>> {
  id: string;
  comment?: string;
  input: string;
  opts: O;
  expected: string;
  mode?: VectorMode;
  flags?: string[];
}

export interface VectorFile<O = Record<string, unknown>> {
  source: string;
  license?: string;
  version?: string;
  imported?: string;
  vectors: Vector<O>[];
}

/** Path to a vector file relative to `tests/vectors/`. */
export function vectorPath(relativePath: string): string {
  return resolve(VECTORS_ROOT, relativePath);
}

/** Load and validate a vector file. Throws if the shape is wrong. */
export function loadVectors<O = Record<string, unknown>>(
  relativePath: string,
): VectorFile<O> {
  const full = vectorPath(relativePath);
  const raw = readFileSync(full, 'utf8');
  const parsed = JSON.parse(raw) as VectorFile<O>;
  if (!parsed.source) {
    throw new Error(`vector file ${relativePath} missing required 'source'`);
  }
  if (!Array.isArray(parsed.vectors)) {
    throw new Error(`vector file ${relativePath} missing 'vectors' array`);
  }
  for (const v of parsed.vectors) {
    if (typeof v.id !== 'string' || !v.id) {
      throw new Error(`vector in ${relativePath} missing 'id'`);
    }
    if (typeof v.expected !== 'string') {
      throw new Error(`vector ${v.id} in ${relativePath} missing 'expected' string`);
    }
  }
  return parsed;
}

/**
 * Test tiers, controlled by the TEST_TIER env var.
 *  - 'default'  → skip vectors flagged 'thorough-only' or 'full-only'
 *  - 'thorough' → skip vectors flagged 'full-only'
 *  - 'full'     → run everything
 */
export type Tier = 'default' | 'thorough' | 'full';

export function currentTier(): Tier {
  const t = (process.env.TEST_TIER ?? 'default').toLowerCase();
  if (t === 'thorough' || t === 'full') return t;
  return 'default';
}

const SKIP_BY_TIER: Record<Tier, ReadonlySet<string>> = {
  default: new Set(['thorough-only', 'full-only', 'long-message']),
  thorough: new Set(['full-only']),
  full: new Set(),
};

export function shouldSkip(vector: Vector, tier: Tier = currentTier()): boolean {
  if (!vector.flags?.length) return false;
  const skip = SKIP_BY_TIER[tier];
  return vector.flags.some((f) => skip.has(f));
}

/**
 * Iterate over the runnable vectors in a file at the current tier.
 * Use this inside an `it.each(...)` or a plain `for ... of`.
 */
export function runnableVectors<O>(file: VectorFile<O>): Vector<O>[] {
  const tier = currentTier();
  return file.vectors.filter((v) => !shouldSkip(v, tier));
}
