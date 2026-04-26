<script lang="ts">
  import { letterToTaps } from './tap-code';
  import type { Mode } from '../_types';

  interface Props {
    input: string;
    output: string;
    opts: Record<string, never>;
    mode: Mode;
  }

  let { input, output, mode }: Props = $props();

  let plaintext = $derived(mode === 'encode' ? input : output);

  let words = $derived.by(() => {
    if (!plaintext) return [] as { letters: { ch: string; taps: [number, number] }[] }[];
    return plaintext
      .toUpperCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({
        letters: [...word]
          .map((ch) => ({ ch, taps: letterToTaps(ch) }))
          .filter((x): x is { ch: string; taps: [number, number] } => x.taps !== null),
      }));
  });

  let totalLetters = $derived(words.reduce((acc, w) => acc + w.letters.length, 0));
</script>

<div class="space-y-3">
  <p class="text-xs text-muted-foreground">
    Each letter's row and column are tapped out separately. Famously used by POWs in Vietnam — the rhythm is the message.
  </p>

  {#if totalLetters === 0}
    <p class="text-xs text-muted-foreground italic">Type input above to see the tap rhythm.</p>
  {:else}
    <div
      class="font-display rounded-md border border-border bg-card/60 p-3 overflow-x-auto sm:p-4"
      role="img"
      aria-label="Tap code rhythm diagram"
    >
      <div class="flex flex-wrap items-end gap-x-7 gap-y-4">
        {#each words as word, wIdx}
          <div class="flex items-end gap-3">
            {#each word.letters as { ch, taps }}
              <div class="flex flex-col items-center gap-1 select-none">
                <span class="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {ch === 'K' ? 'K→C' : ch}
                </span>
                <div class="flex items-center gap-2 h-7">
                  <!-- Row taps -->
                  <div class="flex items-end gap-0.5">
                    {#each Array.from({ length: taps[0] }, (_, i) => i) as i}
                      <span class="block w-1.5 h-3 bg-primary rounded-full"></span>
                    {/each}
                  </div>
                  <span class="text-muted-foreground/50 text-xs">·</span>
                  <!-- Column taps -->
                  <div class="flex items-end gap-0.5">
                    {#each Array.from({ length: taps[1] }, (_, i) => i) as i}
                      <span class="block w-1.5 h-3 bg-primary/70 rounded-full"></span>
                    {/each}
                  </div>
                </div>
                <span class="text-[10px] tabular-nums text-primary/80">
                  {taps[0]}-{taps[1]}
                </span>
              </div>
            {/each}
          </div>
          {#if wIdx < words.length - 1}
            <div class="self-center text-muted-foreground/60 text-xs">/</div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
