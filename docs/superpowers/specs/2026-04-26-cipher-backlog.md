# Cipher Backlog — Items 11-15

**Status:** Deferred from v1. Picked from a longer ranked list of fun/classical/encoding cipher candidates. The first ten (Reverse, SpongeBob, Leet, NATO, Pig Latin, Bacon, Affine, Polybius, Tap Code, Braille) shipped in `C-extra.1` through `C-extra.8`. These five remain.

## Why deferred

Each of these has high implementation effort because the work is in the *art* (custom SVG symbols), in *audio* (Web Audio for Music), or has *limited educational payoff* (Zalgo). v1 ships without them so we can deploy now and revisit deliberately later.

## The five

### 11. Pigpen Cipher — difficulty 6/10
- **Description:** Freemason / Rosicrucian cipher. Each letter maps to a unique geometric symbol formed from a grid + dot system.
- **Engine:** trivial — lookup table letter → symbol identifier.
- **Visualization:** 26 unique SVG glyphs. Either hand-author them, find a permissively-licensed font, or programmatically generate from grid+dot rules (simpler than it sounds — there's a deterministic 4-grid pattern).
- **Category:** `classical`
- **Recommended approach:** Generate SVG paths programmatically from the 4-grid rule rather than hand-drawing 26 glyphs.

### 12. Music Note Cipher — difficulty 7/10 (bonus tier with audio)
- **Description:** Letter → musical note. Simplest scheme: A-G map directly, H onward cycles A-G with octave shifts.
- **Engine:** trivial lookup.
- **Visualization:** rendered musical staff (treble clef, notes at correct pitches). Custom SVG.
- **Audio bonus:** Web Audio API to *play* the encoded message — triples the implementation. **User has explicitly flagged this as a "super bonus" that may stay excluded.** Confirm before building.
- **Category:** `fun`

### 13. Semaphore — difficulty 7/10
- **Description:** Maritime signaling — letter → two flag positions held by a stick figure (left arm + right arm angle).
- **Engine:** lookup table mapping letter to (leftArmDeg, rightArmDeg).
- **Visualization:** animated SVG stick figure with arms rotating between positions. The angle math is the interesting part; the figure itself is simple.
- **Category:** `encoding`

### 14. Dancing Men — difficulty 8/10
- **Description:** Sherlock Holmes' canonical substitution cipher (Doyle, "The Adventure of the Dancing Men"). Each letter is a unique stick-figure dancer pose.
- **Engine:** lookup table.
- **Visualization:** 26 unique stick-figure SVGs. The art is the work — hours-to-days depending on quality target. Public-domain reference figures exist (the original Doyle illustrations are out of copyright).
- **Category:** `classical`

### 15. Zalgo Text — difficulty 3/10 (but underwhelming viz)
- **Description:** Combine random Unicode diacritics on each character to produce "corrupted" looking text.
- **Engine:** trivial — pick random codepoints from the combining-marks Unicode block (U+0300-U+036F), append to each char.
- **Visualization:** the corrupted output IS the viz. Could add an intensity slider (low/medium/full chaos) as the only meaningful interaction.
- **Category:** `fun`
- **Note:** Lowest priority of the five. Most "novelty" of the lot.

## Recommended order (if resuming)

1. **Pigpen** — most visually iconic; if we generate the SVGs programmatically the work is mostly engine.
2. **Zalgo** — quick-win palate cleanser, 1-2 hours.
3. **Semaphore** — pleasant animated figure, moderate scope.
4. **Dancing Men** — only after Pigpen lands; same artwork-heavy pattern.
5. **Music note** — only with explicit user green-light. Web Audio playback is the differentiator.

## Out-of-scope notes

- All five would follow the existing recipe (engine + vectors JSON + test file + registry). No new infrastructure required.
- The category filter chips on the home page populate dynamically from the registry, so adding any of these would just appear in the right bucket automatically.
- None require changes to the cipher engine interface or the workbench.
