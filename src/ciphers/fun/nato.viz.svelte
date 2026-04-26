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
  let phonetic = $derived(mode === 'encode' ? output : input);

  // Split phonetic by " / " for words, then by spaces for tokens.
  let words = $derived(
    phonetic
      .trim()
      .split(/\s*\/\s*/)
      .map((w) => w.split(/\s+/).filter(Boolean)),
  );

  let plainWords = $derived(
    plaintext
      .toUpperCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => [...w]),
  );
</script>

<div class="space-y-3">
  <p class="text-xs text-muted-foreground">
    Each letter is spelled out as its phonetic word — useful over noisy radio. Words separated by <code class="font-display text-foreground">/</code>.
  </p>

  {#if words.length === 0 || (words.length === 1 && words[0]!.length === 0)}
    <p class="text-xs text-muted-foreground italic">Type input above to spell it out.</p>
  {:else}
    <div
      class="font-display rounded-md border border-border bg-card/60 p-3 overflow-x-auto sm:p-4"
      role="img"
      aria-label="NATO phonetic spelling cards"
    >
      <div class="flex flex-wrap gap-2 items-start">
        {#each words as word, wIdx}
          <div class="flex flex-wrap gap-1.5">
            {#each word as token, tIdx}
              {@const plainCh = plainWords[wIdx]?.[tIdx] ?? ''}
              <div class="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded border border-border bg-secondary/40 min-w-[4.5rem]">
                <span class="text-base text-primary leading-none">{plainCh || '?'}</span>
                <span class="text-[11px] text-muted-foreground/90">{token}</span>
              </div>
            {/each}
          </div>
          {#if wIdx < words.length - 1}
            <div class="self-center px-2 text-muted-foreground/60 text-xs">/</div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
