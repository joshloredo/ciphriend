<script lang="ts">
  import { analyzeWord } from './pig-latin';

  interface Props {
    input: string;
    output: string;
    opts: Record<string, never>;
  }

  let { input }: Props = $props();

  /** Each whitespace-separated word with its analysis, plus untouched whitespace tokens. */
  type Token =
    | { kind: 'word'; analysis: ReturnType<typeof analyzeWord> }
    | { kind: 'space'; raw: string };

  let tokens = $derived.by<Token[]>(() => {
    if (!input) return [];
    const out: Token[] = [];
    for (const tok of input.split(/(\s+)/)) {
      if (!tok) continue;
      if (/^\s+$/.test(tok)) out.push({ kind: 'space', raw: tok });
      else out.push({ kind: 'word', analysis: analyzeWord(tok) });
    }
    return out;
  });

  let hasContent = $derived(tokens.some((t) => t.kind === 'word' && t.analysis.core.length > 0));
</script>

<div class="space-y-3">
  <p class="text-xs text-muted-foreground">
    Each word's consonant cluster (amber) is moved to the end and joined with <code class="font-display text-foreground">ay</code>. Words that start with a vowel just get <code class="font-display text-foreground">way</code> appended.
  </p>

  {#if !hasContent}
    <p class="text-xs text-muted-foreground italic">Type input above to see the word-by-word transform.</p>
  {:else}
    <div
      class="font-display rounded-md border border-border bg-card/60 p-4 overflow-x-auto"
      role="img"
      aria-label="Pig Latin word transformations"
    >
      <div class="flex flex-wrap gap-3 items-stretch">
        {#each tokens as token}
          {#if token.kind === 'space'}
            <!-- preserve significant whitespace as a thin gap -->
            <span class="self-center text-muted-foreground/40 text-xs select-none">·</span>
          {:else}
            {@const a = token.analysis}
            {#if a.core.length === 0}
              <!-- punctuation-only token -->
              <span class="self-center text-muted-foreground/70">{a.leading + a.trailing}</span>
            {:else}
              {@const wasCap = a.core.length > 0 && a.core[0]! >= 'A' && a.core[0]! <= 'Z'}
              {@const newRest = wasCap && a.rest ? a.rest[0]!.toUpperCase() + a.rest.slice(1) : a.rest}
              {@const movedCluster = wasCap ? a.cluster.toLowerCase() : a.cluster}
              <div class="flex flex-col items-center gap-1.5 min-w-[8rem]">
                <!-- Original: leading | cluster | rest | trailing -->
                <div class="text-sm leading-tight">
                  {#if a.leading}<span class="text-muted-foreground/70">{a.leading}</span>{/if}
                  {#if a.suffix === 'way'}
                    <span class="text-foreground">{a.rest}</span>
                  {:else if a.cluster && a.rest}
                    <span class="text-primary">{a.cluster}</span><span class="text-foreground">{a.rest}</span>
                  {:else}
                    <span class="text-primary">{a.cluster || a.rest}</span>
                  {/if}
                  {#if a.trailing}<span class="text-muted-foreground/70">{a.trailing}</span>{/if}
                </div>

                <span class="text-primary/70 text-xs leading-none">↓ {a.suffix}</span>

                <!-- Encoded: leading | rest (with first cap) | cluster (lower) | suffix | trailing -->
                <div class="text-sm leading-tight">
                  {#if a.leading}<span class="text-muted-foreground/70">{a.leading}</span>{/if}
                  {#if a.suffix === 'way'}
                    <span class="text-foreground">{a.rest}</span><span class="text-primary">way</span>
                  {:else if a.cluster && a.rest}
                    <span class="text-foreground">{newRest}</span><span class="text-primary">{movedCluster}ay</span>
                  {:else}
                    <span class="text-foreground">{a.cluster || a.rest}</span><span class="text-primary">ay</span>
                  {/if}
                  {#if a.trailing}<span class="text-muted-foreground/70">{a.trailing}</span>{/if}
                </div>
              </div>
            {/if}
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
