<script lang="ts">
  import type { Mode } from '../_types';

  interface Props {
    input: string;
    output: string;
    opts: Record<string, never>;
    mode: Mode;
  }

  let { input, output, mode }: Props = $props();

  // Always reason from the bytes side — that's where the visual story lives.
  // In encode mode: bytes come from the input. In decode mode: bytes come from
  // the output (the cipher's plaintext result).
  let plaintext = $derived(mode === 'encode' ? input : output);
  let encoded = $derived(mode === 'encode' ? output : input);

  /** Group bytes into chunks of 3 (24 bits each) for rendering. */
  type Chunk = {
    bytes: number[];        // 1-3 bytes
    bits: string;           // 8/16/24 bits, padded to 24 with placeholder underscores
    sextets: { value: number | null; bits: string; padding: boolean }[];
    chars: string[];        // 4 chars including '=' padding
  };

  let chunks: Chunk[] = $derived.by(() => {
    if (!plaintext) return [];
    const bytes = Array.from(new TextEncoder().encode(plaintext));
    const out: Chunk[] = [];
    for (let i = 0; i < bytes.length; i += 3) {
      const slice = bytes.slice(i, i + 3);
      let bits = slice.map((b) => b.toString(2).padStart(8, '0')).join('');
      // Pad bits to multiple of 6 with zeros, then pad-with-_ to 24 for layout
      const realBitCount = bits.length;
      while (bits.length % 6 !== 0) bits += '0';
      const sextets: Chunk['sextets'] = [];
      for (let j = 0; j < bits.length; j += 6) {
        const seg = bits.slice(j, j + 6);
        sextets.push({ value: parseInt(seg, 2), bits: seg, padding: false });
      }
      // Pad sextets to 4 with '=' padding markers
      while (sextets.length < 4) sextets.push({ value: null, bits: '------', padding: true });
      // Build display bits string with '_' for missing real bits
      const displayBits = (slice.map((b) => b.toString(2).padStart(8, '0')).join('') +
        '_'.repeat(24 - realBitCount)).slice(0, 24);
      const chars = sextets.map((s) =>
        s.padding ? '=' : SEXTET_CHARS[s.value!]!,
      );
      out.push({ bytes: slice, bits: displayBits, sextets, chars });
    }
    return out;
  });

  const SEXTET_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  function displayChar(b: number): string {
    if (b >= 32 && b <= 126) return String.fromCharCode(b);
    return '·';
  }

  // Color palette for the 4 sextets within a chunk — distinct from rail-fence.
  function sextetColor(i: number): string {
    return [
      'border-primary text-primary bg-primary/10',
      'border-cyan-400 text-cyan-400 bg-cyan-400/10',
      'border-fuchsia-400 text-fuchsia-400 bg-fuchsia-400/10',
      'border-lime-400 text-lime-400 bg-lime-400/10',
    ][i]!;
  }
</script>

<div class="space-y-3">
  <p class="text-xs text-muted-foreground">
    Base64 takes 3 bytes (24 bits) and regroups them into 4 sextets (6 bits each), each indexing into the Base64 alphabet. Inputs whose byte length isn't a multiple of 3 use <code class="font-display text-foreground">=</code> padding to round out the last chunk.
  </p>

  {#if chunks.length === 0}
    <p class="text-xs text-muted-foreground italic">Type input above to see the bit grouping.</p>
  {:else}
    <div class="relative">
    <div
      class="font-display text-xs rounded-md border border-border bg-card/60 p-3 overflow-x-auto sm:p-4"
      role="img"
      aria-label="Base64 bit-grouping diagram"
    >
      <div class="space-y-5">
        {#each chunks as chunk, ci}
          <div class="space-y-1">
            <div class="text-[10px] uppercase tracking-wider text-muted-foreground">
              chunk {ci + 1} of {chunks.length}
            </div>

            <!-- Input bytes row -->
            <div class="flex gap-2 items-end">
              {#each chunk.bytes as byte, bi}
                <div class="flex flex-col items-center gap-0.5 min-w-[6.5rem]">
                  <span class="text-[10px] text-muted-foreground">byte {bi + 1}</span>
                  <span class="text-foreground">{displayChar(byte)} <span class="text-muted-foreground/70">({byte})</span></span>
                </div>
              {/each}
              {#if chunk.bytes.length < 3}
                {#each Array.from({ length: 3 - chunk.bytes.length }, (_, i) => i) as i}
                  <div class="flex flex-col items-center gap-0.5 min-w-[6.5rem] opacity-40">
                    <span class="text-[10px] text-muted-foreground">pad</span>
                    <span class="text-muted-foreground">—</span>
                  </div>
                {/each}
              {/if}
            </div>

            <!-- 24-bit row, partitioned into 6-bit sextets -->
            <div class="flex">
              {#each chunk.sextets as sextet, si}
                <div
                  class={[
                    'border px-2 py-1 mr-px tabular-nums text-center',
                    sextet.padding
                      ? 'border-dashed border-muted-foreground/40 text-muted-foreground/60 bg-muted/10'
                      : sextetColor(si),
                  ]}
                  style:flex="1"
                >
                  {sextet.bits.replace(/_/g, '·').replace(/-/g, '·')}
                </div>
              {/each}
            </div>

            <!-- Decoded sextet values + base64 char -->
            <div class="flex">
              {#each chunk.sextets as sextet, si}
                <div
                  class={[
                    'flex flex-col items-center py-1 mr-px',
                    sextet.padding ? 'opacity-50' : '',
                  ]}
                  style:flex="1"
                >
                  <span class="text-[10px] text-muted-foreground">
                    {sextet.padding ? 'padding' : `sextet ${sextet.value}`}
                  </span>
                  <span class={[
                    'text-base',
                    sextet.padding ? 'text-muted-foreground' : 'text-foreground',
                  ]}>
                    {chunk.chars[si]}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
        <span class="uppercase tracking-wider mr-2">full output:</span>
        <span class="font-display text-foreground break-all">{encoded || '—'}</span>
      </div>
    </div>
    <div
      class="pointer-events-none absolute top-0 right-0 bottom-0 w-6 rounded-r-md bg-gradient-to-l from-card to-transparent sm:hidden"
      aria-hidden="true"
    ></div>
    </div>
  {/if}
</div>
