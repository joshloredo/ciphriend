# Ciphriend Test Vectors

This directory holds the test vectors that prove our ciphers and encodings produce correct output. **It is load-bearing.** No cipher ships in production without vector coverage cited from a credible source.

## Why this exists

A bug in a cipher implementation that ships silently is significantly worse than a bug almost anywhere else in the app. If Caesar silently breaks for inputs containing combining-Unicode characters, users who relied on it might never know — they'd just get wrong ciphertext and assume the recipient was confused. For modern crypto (AES-GCM, SHA-256), a subtle implementation flaw can leak plaintext, leak keys, or accept forged tags.

Our defense is layered:

1. **Hand-written reference vectors** — the textbook cases. Fast feedback, easy to read, but limited coverage.
2. **Vendored authoritative vectors** — files committed from sources like Project Wycheproof and NIST CAVP. Catch implementation bugs no human would think to test for.
3. **Property-based tests** — `fast-check` verifies invariants (`decode(encode(x, k), k) === x`, hash determinism, encoding involutions) over thousands of generated inputs.
4. **Cross-implementation validation** — for select primitives, we run the same input through `node:crypto` or the browser's native API and confirm matching output.

All four are required for a cipher to be considered "production-ready."

## Sources

| Subdir | Source | License | Use for |
|---|---|---|---|
| `wycheproof/` | [C2SP/wycheproof](https://github.com/C2SP/wycheproof) (formerly Google) | Apache 2.0 | AES-GCM, AES-CBC, HMAC, SHA-2 family, ECDSA, RSA. **Adversarial — the gold standard.** |
| `nist/` | [NIST CAVP](https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program) | Public domain (US Govt) | The official certification suite. AES, SHA-2/3, HMAC, etc. Slower than Wycheproof; more thorough. |
| `rfc/` | [IETF RFCs](https://www.rfc-editor.org/) (4648 §10 Base64, 6234 SHA-2, 3174 SHA-1, etc.) | IETF (test vectors are fair use) | Encodings + hashes — definitive. |
| `classical/` | Wikipedia, [CrypTool](https://www.cryptool.org/), [dCode](https://www.dcode.fr/) cross-validation captures | Captured outputs (cite sources per file) | Caesar, Vigenère, Atbash, Rail Fence, Morse, etc. |

Each file in these subdirectories MUST start with a JSON header that names its source, license, version (commit hash or release tag for Wycheproof; document number for NIST; RFC number; or capture date + tool URL for classical).

## File format

We use a single JSON shape across all sources, with a per-file header. Bigger external vendor formats (Wycheproof's `testGroups`/`tests` shape, NIST's `.rsp` files) get normalized into our shape at import time.

```json
{
  "source": "RFC 4648 §10",
  "license": "IETF / fair-use citation",
  "version": "RFC 4648 (October 2006)",
  "imported": "2026-04-26",
  "vectors": [
    {
      "id": "rfc4648-base64-1",
      "comment": "empty input",
      "input": "",
      "opts": {},
      "expected": "",
      "mode": "encode"
    },
    {
      "id": "rfc4648-base64-2",
      "comment": "f -> Zg==",
      "input": "f",
      "opts": {},
      "expected": "Zg==",
      "mode": "encode"
    }
  ]
}
```

Optional fields per vector:
- `flags`: `["long-message"]`, `["edge-case"]`, `["thorough-only"]` — the runner can skip vectors with specific flags depending on which test tier is active.
- `mode`: `"encode"` or `"decode"`. Defaults to `"encode"` if omitted.

## How to import a new vendor file

**Wycheproof** (e.g. `aes_gcm_test.json`):
1. Pick a specific commit on [C2SP/wycheproof](https://github.com/C2SP/wycheproof). **Pin to that commit, never to `main`.**
2. Download the file: `curl -fL https://raw.githubusercontent.com/C2SP/wycheproof/<COMMIT>/testvectors_v1/aes_gcm_test.json -o tests/vectors/wycheproof/aes_gcm_test.json`
3. Add a `header` block to the file (or alongside it) with `source`, `license`, `version: <commit hash>`, `imported: <ISO date>`. Wycheproof's native format already includes most of this — preserve it.
4. Add or update the cipher's `*.test.ts` to point at the file via the runner.
5. Add the upstream license file once: `tests/vectors/wycheproof/LICENSE` (verbatim from the upstream repo).

**NIST CAVP**: download the `.rsp` files, write a small one-time normalizer to convert to our JSON shape, commit the JSON (not the `.rsp`).

**RFC**: hand-encode the vectors from the RFC text into our shape; cite the section in `comment`.

**Classical**: capture from CrypTool / dCode by hand, cite the URL or tool version in `comment`. These are the only category where we can't fully automate sourcing — be diligent about citing.

## Pinning policy (load-bearing)

- Never reference upstream `main` / `master` / `latest`. Always a commit hash, release tag, or specific document number.
- A change to a vector file is a deliberate, reviewable PR. Never auto-update.
- If an upstream vector changes (rare but it happens — Wycheproof gets updates), the diff in our vendored file should be reviewed character-by-character.
- If our implementation starts failing a vector we used to pass, the bug is in our implementation, not in the vector. (This is the entire point.)

## Tiers

The test runner respects `flags` arrays on individual vectors and a `PROP_ITERATIONS` env var for property tests:

| Script | Vectors run | Property iterations | When |
|---|---|---|---|
| `npm test` | All except `flags: ["thorough-only"]` and `flags: ["long-message"]` | 200 | Every PR |
| `npm run test:thorough` | Everything except `flags: ["full-only"]` | 5000 | Pre-release / nightly |
| `npm run test:full` | Everything | 5000 + cross-impl validation | Manual / paranoia |

## Adding a new cipher — checklist

A cipher PR is **not mergeable** until all of these are satisfied:

- [ ] At least 5 hand-written reference vectors in `tests/ciphers/<id>.test.ts`, citing source for each (Wikipedia link, RFC section, etc.).
- [ ] Property test for the cipher's reversibility / determinism / involution.
- [ ] If the cipher has formal authoritative vectors (AES, SHA, HMAC, Base64), the corresponding vendored file in `tests/vectors/` and a runner test that consumes it.
- [ ] Edge cases covered: empty input, all-whitespace, Unicode (combining + emoji), input length 1, very long input.
- [ ] All tests pass on `npm test` AND `npm run test:thorough`.

If you're tempted to ship a cipher with weaker coverage "just for now," don't. The whole point of this directory is that "later" never comes and silent bugs ship.
