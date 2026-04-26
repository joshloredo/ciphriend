<script lang="ts">
  import { railPattern, type RailFenceOpts } from './rail-fence';
  import type { Mode } from '../_types';

  interface Props {
    input: string;
    output: string;
    opts: RailFenceOpts;
    mode: Mode;
  }

  let { input, output, opts, mode }: Props = $props();

  let rails = $derived(Math.max(2, Math.floor(opts.rails ?? 3)));

  // For both modes: render the zigzag grid populated with the PLAINTEXT
  // (the human-readable version). In encode mode, the plaintext IS the
  // input. In decode mode, the plaintext is the output (the workbench
  // gives us the cipher's result, which for decode is the plaintext).
  let plaintext = $derived(mode === 'decode' ? output : input);
  let ciphertext = $derived(mode === 'decode' ? input : output);

  let pattern = $derived(railPattern(plaintext.length, rails));

  // Compute which characters belong to which rail, in order. This is what
  // the cipher reads off (and what the cipher writes onto, in decode).
  let railContents = $derived.by(() => {
    const out: { ch: string; pos: number }[][] = Array.from({ length: rails }, () => []);
    for (let i = 0; i < plaintext.length; i++) {
      out[pattern[i]!]!.push({ ch: plaintext[i]!, pos: i });
    }
    return out;
  });

  // Cumulative offsets so we can map a (rail, indexInRail) → position in ciphertext.
  let railOffsets = $derived.by(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (let r = 0; r < rails; r++) {
      offsets.push(acc);
      acc += railContents[r]!.length;
    }
    return offsets;
  });

  // For hover/highlight: which ciphertext index does each plaintext position map to?
  let plainToCipher = $derived.by(() => {
    const map = new Array(plaintext.length).fill(0);
    const seenInRail = new Array(rails).fill(0);
    for (let i = 0; i < plaintext.length; i++) {
      const r = pattern[i]!;
      map[i] = railOffsets[r]! + seenInRail[r]!;
      seenInRail[r]++;
    }
    return map;
  });

  let highlightedPos = $state<number | null>(null);

  function setHover(i: number | null) {
    highlightedPos = i;
  }

  // Visual constants
  const COL_WIDTH = '1.4rem';
  const ROW_HEIGHT = '1.6rem';

  let categoryHues = ['amber', 'cyan', 'magenta', 'lime', 'rose', 'violet'];
  function railColor(r: number): string {
    return [
      'border-primary text-primary',
      'border-cyan-400 text-cyan-400',
      'border-fuchsia-400 text-fuchsia-400',
      'border-lime-400 text-lime-400',
      'border-rose-400 text-rose-400',
      'border-violet-400 text-violet-400',
    ][r % 6]!;
  }
</script>

<div class="space-y-3">
  <p class="text-xs text-muted-foreground">
    {#if mode === 'encode'}
      Plaintext is written diagonally across {rails} rails; ciphertext is read off rail by rail (top to bottom).
    {:else}
      Ciphertext fills the rails left-to-right; plaintext is read off in zigzag order.
    {/if}
  </p>

  {#if plaintext.length === 0}
    <p class="text-xs text-muted-foreground italic">Type input above to see the zigzag.</p>
  {:else}
    <!-- The zigzag grid -->
    <div class="relative">
    <div
      class="font-display text-sm overflow-x-auto rounded-md border border-border bg-card/60 p-3"
      role="img"
      aria-label="Rail fence zigzag pattern"
    >
      <div
        class="grid gap-y-1"
        style:grid-template-columns="auto repeat({plaintext.length}, {COL_WIDTH})"
      >
        {#each Array.from({ length: rails }, (_, i) => i) as r}
          <span class={[
            'pr-3 text-[10px] uppercase tracking-wider tabular-nums leading-none flex items-center',
            railColor(r),
          ]}>
            rail {r + 1}
          </span>
          {#each Array.from({ length: plaintext.length }, (_, i) => i) as i}
            {@const onRail = pattern[i] === r}
            {@const ch = plaintext[i]}
            {@const isHover = highlightedPos === i}
            <span
              class={[
                'text-center transition-all duration-150 leading-none flex items-center justify-center',
                onRail
                  ? `border-l-2 ${railColor(r)} ${isHover ? 'bg-primary/15 text-foreground scale-110' : ''}`
                  : 'opacity-25 text-muted-foreground/60',
              ]}
              style:height={ROW_HEIGHT}
              role="presentation"
              onmouseenter={() => onRail && setHover(i)}
              onmouseleave={() => setHover(null)}
              title={onRail ? `position ${i} → rail ${r + 1}` : ''}
            >
              {onRail ? (ch === ' ' ? '·' : ch) : '·'}
            </span>
          {/each}
        {/each}
      </div>
    </div>
    <div
      class="pointer-events-none absolute top-0 right-0 bottom-0 w-6 rounded-r-md bg-gradient-to-l from-card to-transparent sm:hidden"
      aria-hidden="true"
    ></div>
    </div>

    <!-- Read-off strip showing the rails concatenated into the ciphertext -->
    <div class="font-display text-xs flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span class="text-muted-foreground uppercase tracking-wider">read-off:</span>
      {#each railContents as rail, r}
        <span class={[
          'inline-flex items-center px-2 py-0.5 rounded border-l-2',
          railColor(r),
        ]}>
          {#each rail as { ch, pos }, j}
            {@const cipherIdx = railOffsets[r] + j}
            {@const isHover = highlightedPos === pos}
            <span
              class={[
                'transition-colors duration-150',
                isHover ? 'text-foreground bg-primary/20 px-0.5' : '',
              ]}
              onmouseenter={() => setHover(pos)}
              onmouseleave={() => setHover(null)}
              role="presentation"
            >
              {ch === ' ' ? '·' : ch}
            </span>
          {/each}
        </span>
      {/each}
    </div>

    <p class="text-[11px] text-muted-foreground">
      Hover a character to see how positions map between the zigzag and the ciphertext.
    </p>
  {/if}
</div>
