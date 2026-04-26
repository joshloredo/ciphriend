<script lang="ts">
  import type { Mode } from '../_types';

  interface Props {
    input: string;
    output: string;
    opts: Record<string, never>;
    mode: Mode;
  }

  let { input, output, mode }: Props = $props();

  // Always show the plaintext-with-its-morse rendering. In encode mode
  // input is plaintext; in decode mode output is plaintext.
  let plaintext = $derived(mode === 'encode' ? input : output);
  let morseString = $derived(mode === 'encode' ? output : input);

  /**
   * Parse the morse string into a structured form: word[] → letter[] → token[].
   * Tokens are 'dit' (.) or 'dah' (-). Words are separated by " / ", letters by spaces.
   */
  let parsed = $derived.by(() => {
    if (!morseString) return [] as { letters: { tokens: ('dit' | 'dah')[] }[] }[];
    return morseString
      .trim()
      .split(/\s*\/\s*/)
      .map((word) => ({
        letters: word
          .split(/\s+/)
          .filter(Boolean)
          .map((tok) => ({
            tokens: [...tok].map((c): 'dit' | 'dah' => (c === '.' ? 'dit' : 'dah')),
          })),
      }));
  });

  // Flat letter list paired with the corresponding plaintext letter (best-effort).
  let plainLetters = $derived(
    plaintext
      .toUpperCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => [...w]),
  );

  let totalLetters = $derived(parsed.reduce((acc, w) => acc + w.letters.length, 0));
</script>

<div class="space-y-4">
  <p class="text-xs text-muted-foreground">
    Dits are short, dahs are long (3× a dit). Letter gaps are 3 dit-units; word gaps are 7 dit-units.
  </p>

  {#if totalLetters === 0}
    <p class="text-xs text-muted-foreground italic">Type input above to see the timing.</p>
  {:else}
    <div
      class="font-display text-sm overflow-x-auto rounded-md border border-border bg-card/60 p-3 sm:p-4"
      role="img"
      aria-label="Morse timing diagram"
    >
      <div class="flex flex-wrap items-end gap-x-7 gap-y-4">
        {#each parsed as word, wIdx}
          <div class="flex items-end gap-3">
            {#each word.letters as letter, lIdx}
              {@const flatIdx = parsed.slice(0, wIdx).reduce((a, w) => a + w.letters.length, 0) + lIdx}
              {@const plainCh = plainLetters[wIdx]?.[lIdx] ?? ''}
              <div class="flex flex-col items-center gap-1 select-none">
                <span class="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
                  {plainCh || `#${flatIdx + 1}`}
                </span>
                <div class="flex items-end gap-1 h-7">
                  {#each letter.tokens as token, tIdx}
                    <span
                      class={[
                        'block bg-primary rounded-[2px] transition-colors',
                        token === 'dit' ? 'w-1.5' : 'w-5',
                      ]}
                      style:height="1rem"
                      style:opacity={1 - tIdx * 0.05}
                      title={token}
                      aria-hidden="true"
                    ></span>
                  {/each}
                </div>
                <span class="text-[10px] text-primary/80">
                  {letter.tokens.map((t) => (t === 'dit' ? '·' : '−')).join('')}
                </span>
              </div>
            {/each}
          </div>
          {#if wIdx < parsed.length - 1}
            <div class="self-center text-muted-foreground/60 font-display text-xs">/</div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
