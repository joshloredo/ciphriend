<script lang="ts">
  import { GRID, letterToCoords } from './polybius';
  import type { Mode } from '../_types';

  interface Props {
    input: string;
    output: string;
    opts: Record<string, never>;
    mode: Mode;
  }

  let { input, output, mode }: Props = $props();

  let plaintext = $derived(mode === 'encode' ? input : output);

  /** All letter→coords pairs for the current plaintext, with index for hover sync. */
  let mapped = $derived.by(() => {
    const out: { ch: string; coords: [number, number] | null }[] = [];
    for (const ch of plaintext) {
      const coords = letterToCoords(ch);
      if (coords) out.push({ ch: ch.toUpperCase(), coords });
    }
    return out;
  });

  let hoveredIndex = $state<number | null>(null);

  let highlightedCoord = $derived<[number, number] | null>(
    hoveredIndex !== null ? mapped[hoveredIndex]?.coords ?? null : null,
  );

  function isHighlighted(r: number, c: number): boolean {
    return highlightedCoord !== null && highlightedCoord[0] === r && highlightedCoord[1] === c;
  }
</script>

<div class="space-y-3">
  <p class="text-xs text-muted-foreground">
    Each letter is encoded as its <span class="text-primary font-display">row</span>-<span class="text-primary font-display">column</span> position in this 5×5 grid. <span class="font-display text-foreground">I</span> and <span class="font-display text-foreground">J</span> share a cell.
  </p>

  {#if mapped.length === 0}
    <p class="text-xs text-muted-foreground italic">Type input above to see the grid lookup.</p>
  {:else}
    <div class="grid gap-4 sm:grid-cols-[auto_1fr] items-start">
      <!-- The 5×5 grid -->
      <div
        class="font-display rounded-md border border-border bg-card/60 p-3 inline-block"
        role="img"
        aria-label="5 by 5 Polybius grid"
      >
        <div class="grid gap-1" style:grid-template-columns="repeat(6, 1.6rem)">
          <span class="size-6 grid place-items-center text-[10px] text-muted-foreground/70"></span>
          {#each [1, 2, 3, 4, 5] as c}
            <span class="size-6 grid place-items-center text-[10px] text-primary/80 tabular-nums">{c}</span>
          {/each}
          {#each GRID as row, rIdx}
            <span class="size-6 grid place-items-center text-[10px] text-primary/80 tabular-nums">{rIdx + 1}</span>
            {#each row as letter, cIdx}
              {@const r = rIdx + 1}
              {@const c = cIdx + 1}
              {@const active = isHighlighted(r, c)}
              <span
                class={[
                  'size-6 grid place-items-center text-sm rounded-sm border transition-colors',
                  active
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border/40 text-foreground/80',
                ]}
              >
                {letter === 'I' ? 'I/J' : letter}
              </span>
            {/each}
          {/each}
        </div>
      </div>

      <!-- The letter-by-letter coordinate strip -->
      <div class="space-y-2">
        <p class="text-[10px] uppercase tracking-wider text-muted-foreground">Letter → coordinates</p>
        <div class="font-display flex flex-wrap gap-1.5">
          {#each mapped as { ch, coords }, i}
            {#if coords}
              <button
                type="button"
                class={[
                  'flex flex-col items-center gap-0.5 px-2 py-1 rounded-sm border transition-colors',
                  hoveredIndex === i
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-input text-muted-foreground hover:text-foreground',
                ]}
                onmouseenter={() => (hoveredIndex = i)}
                onmouseleave={() => (hoveredIndex = null)}
                onfocus={() => (hoveredIndex = i)}
                onblur={() => (hoveredIndex = null)}
              >
                <span class="text-sm">{ch === 'J' ? 'J→I' : ch}</span>
                <span class="text-[10px] tabular-nums opacity-75">{coords[0]}{coords[1]}</span>
              </button>
            {/if}
          {/each}
        </div>
        <p class="text-[11px] text-muted-foreground">Hover a letter to see its grid position.</p>
      </div>
    </div>
  {/if}
</div>
