<script lang="ts">
  import { analyze, ENGLISH_BASELINE } from './frequency';

  interface Props {
    input: string;
  }

  let { input }: Props = $props();

  let result = $derived(analyze(input));
  let alphabet = $derived('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));

  // Highest of (input %, baseline %) so the y-scale always shows both.
  let maxPct = $derived.by(() => {
    let m = 0;
    for (const ch of alphabet) {
      m = Math.max(m, result.percentages[ch] ?? 0, ENGLISH_BASELINE[ch] ?? 0);
    }
    return Math.max(m, 1);
  });

  /** Deviation: difference (in percentage points) from the English baseline. */
  function deviation(letter: string): number {
    return (result.percentages[letter] ?? 0) - (ENGLISH_BASELINE[letter] ?? 0);
  }

  function deviationGlyph(letter: string): string {
    const d = deviation(letter);
    if (Math.abs(d) < 1) return '';
    return d > 0 ? '↑' : '↓';
  }
</script>

<div class="space-y-3">
  <p class="text-xs text-muted-foreground">
    Bars are letter frequencies in your input. Faint markers show the English baseline — long deviations (↑/↓) suggest a substitution cipher might be in play.
  </p>

  {#if result.total === 0}
    <p class="text-xs text-muted-foreground italic">Type input above to see the distribution.</p>
  {:else}
    <div
      class="font-display text-xs rounded-md border border-border bg-card/60 p-4"
      role="img"
      aria-label="Letter frequency histogram"
    >
      <div
        class="grid items-end gap-x-1"
        style:grid-template-columns="repeat(26, minmax(0, 1fr))"
        style:height="11rem"
      >
        {#each alphabet as letter}
          {@const pct = result.percentages[letter] ?? 0}
          {@const baseline = ENGLISH_BASELINE[letter] ?? 0}
          <div class="relative h-full flex items-end justify-center" title="{letter}: {pct.toFixed(1)}% (English baseline {baseline.toFixed(1)}%)">
            <!-- baseline marker (faint horizontal line) -->
            <div
              class="absolute left-1 right-1 border-t border-dashed border-muted-foreground/40"
              style:bottom="{(baseline / maxPct) * 100}%"
            ></div>
            <!-- input bar -->
            <div
              class={[
                'w-full rounded-t-sm transition-all',
                pct > 0 ? 'bg-primary' : 'bg-muted/40',
              ]}
              style:height="{(pct / maxPct) * 100}%"
              style:min-height={pct > 0 ? '2px' : '0'}
            ></div>
          </div>
        {/each}
      </div>
      <div
        class="grid gap-x-1 mt-2 text-[10px] text-center text-muted-foreground tabular-nums"
        style:grid-template-columns="repeat(26, minmax(0, 1fr))"
      >
        {#each alphabet as letter}
          <div class="space-y-0.5">
            <div class="text-foreground/80">{letter}</div>
            <div class="text-primary/80">{(result.percentages[letter] ?? 0).toFixed(0)}</div>
            <div class={[
              Math.abs(deviation(letter)) >= 3 ? 'text-foreground' : 'opacity-50',
            ]}>{deviationGlyph(letter)}</div>
          </div>
        {/each}
      </div>
    </div>

    <div class="text-xs text-muted-foreground space-y-1">
      <p>
        <span class="text-foreground font-display">{result.total}</span>
        letter{result.total === 1 ? '' : 's'} counted.
      </p>
      {#if result.ranked.length > 0}
        <p>
          <span class="uppercase tracking-wider">most common:</span>
          {#each result.ranked.slice(0, 5) as { letter, pct }, i}
            <span class="font-display ml-1">
              <span class="text-primary">{letter}</span><span class="text-muted-foreground/80"> ({pct.toFixed(1)}%)</span>{i < Math.min(4, result.ranked.length - 1) ? ',' : ''}
            </span>
          {/each}
        </p>
      {/if}
    </div>
  {/if}
</div>
