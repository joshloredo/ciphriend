<script lang="ts">
  import type { Mode } from '../_types';

  interface Props {
    input: string;
    output: string;
    opts: Record<string, never>;
    mode: Mode;
  }

  let { input, output, mode }: Props = $props();

  let plaintext = $derived(mode === 'encode' ? input : output);
  let baconString = $derived(mode === 'encode' ? output : input);

  /** Words → letters; each letter has its 5-letter Bacon pattern + plaintext char. */
  let words = $derived.by(() => {
    if (!baconString) return [] as { letters: { pattern: string; plainChar: string }[] }[];
    const baconWords = baconString.trim().split(/\s*\/\s*/);
    const plainWords = plaintext
      .toUpperCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => [...w]);
    return baconWords.map((word, wi) => {
      const tokens = word.split(/\s+/).filter(Boolean);
      return {
        letters: tokens.map((pattern, li) => ({
          pattern,
          plainChar: plainWords[wi]?.[li] ?? '?',
        })),
      };
    });
  });

  let totalLetters = $derived(words.reduce((acc, w) => acc + w.letters.length, 0));
</script>

<div class="space-y-3">
  <p class="text-xs text-muted-foreground">
    Each letter encodes as a 5-bit pattern of <span class="text-primary font-display">A</span>'s and <span class="text-primary font-display">B</span>'s — the first ASCII-style binary, from Francis Bacon, 1605.
  </p>

  {#if totalLetters === 0}
    <p class="text-xs text-muted-foreground italic">Type input above to see the binary patterns.</p>
  {:else}
    <div
      class="font-display rounded-md border border-border bg-card/60 p-4 overflow-x-auto"
      role="img"
      aria-label="Bacon's cipher 5-bit patterns"
    >
      <div class="flex flex-wrap items-start gap-x-4 gap-y-3">
        {#each words as word, wIdx}
          <div class="flex flex-wrap gap-2">
            {#each word.letters as { pattern, plainChar }}
              <div class="flex flex-col items-center gap-1">
                <span class="text-base text-primary leading-none">{plainChar}</span>
                <div class="flex gap-px">
                  {#each [...pattern] as bit}
                    <span
                      class={[
                        'w-4 h-4 grid place-items-center text-[10px] rounded-sm border',
                        bit === 'A'
                          ? 'border-border bg-secondary/40 text-muted-foreground'
                          : 'border-primary bg-primary/20 text-primary',
                      ]}
                      aria-label={bit}
                    >{bit}</span>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
          {#if wIdx < words.length - 1}
            <div class="self-center text-muted-foreground/60 text-xs px-1">/</div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
