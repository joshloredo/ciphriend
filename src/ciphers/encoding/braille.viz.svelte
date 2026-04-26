<script lang="ts">
  import { dotsFor } from './braille';
  import type { Mode } from '../_types';

  interface Props {
    input: string;
    output: string;
    opts: Record<string, never>;
    mode: Mode;
  }

  let { input, output, mode }: Props = $props();

  let plaintext = $derived(mode === 'encode' ? input : output);

  /** For each character: { ch, dots: number[] | null, isSpace: boolean } */
  let cells = $derived.by(() => {
    if (!plaintext) return [] as { ch: string; dots: number[] | null; isSpace: boolean }[];
    const out: { ch: string; dots: number[] | null; isSpace: boolean }[] = [];
    for (const ch of plaintext.toUpperCase()) {
      if (ch === ' ') {
        out.push({ ch, dots: null, isSpace: true });
        continue;
      }
      const dots = dotsFor(ch);
      if (dots) out.push({ ch, dots, isSpace: false });
    }
    return out;
  });

  // 2x3 grid: positions 1, 4 (top), 2, 5 (mid), 3, 6 (bottom)
  const ROWS: number[][] = [[1, 4], [2, 5], [3, 6]];
</script>

<div class="space-y-3">
  <p class="text-xs text-muted-foreground">
    Each letter is a 6-dot pattern in a 2-column × 3-row cell. Filled dots are <span class="text-primary font-display">amber</span>; empty positions are dim outlines.
  </p>

  {#if cells.length === 0}
    <p class="text-xs text-muted-foreground italic">Type input above to see the braille cells.</p>
  {:else}
    <div
      class="font-display rounded-md border border-border bg-card/60 p-3 overflow-x-auto sm:p-4"
      role="img"
      aria-label="Braille cell diagram"
    >
      <div class="flex flex-wrap items-end gap-2">
        {#each cells as cell}
          {#if cell.isSpace}
            <div class="w-3" aria-label="word break"></div>
          {:else}
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] uppercase tracking-wider text-muted-foreground">
                {cell.ch}
              </span>
              <div class="grid grid-rows-3 gap-1.5 px-1.5 py-1 rounded border border-border/60 bg-secondary/30">
                {#each ROWS as row}
                  <div class="flex gap-1.5">
                    {#each row as dot}
                      {@const filled = cell.dots?.includes(dot)}
                      <span
                        class={[
                          'block size-2.5 rounded-full transition-colors',
                          filled
                            ? 'bg-primary shadow-[0_0_4px_currentColor] text-primary'
                            : 'bg-muted/30 border border-border/60',
                        ]}
                        aria-hidden="true"
                      ></span>
                    {/each}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
