<script lang="ts">
  interface CipherCardData {
    id: string;
    name: string;
    tagline: string;
    category: string;
    examplePreview?: { input: string; output: string };
  }

  interface Props {
    ciphers: CipherCardData[];
  }

  let { ciphers }: Props = $props();

  // Build the list of category chips dynamically from the cipher registry,
  // sorted by count (most-populated first) then alphabetically.
  let categories = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const c of ciphers) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([category, count]) => ({ category, count }));
  });

  let selected = $state<Set<string>>(new Set());

  function toggle(category: string) {
    // Reassign to a new Set so Svelte 5's reactivity picks up the change.
    const next = new Set(selected);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    selected = next;
  }

  function clear() {
    selected = new Set();
  }

  let filtered = $derived.by(() => {
    if (selected.size === 0) return ciphers;
    return ciphers.filter((c) => selected.has(c.category));
  });

  let selectedList = $derived([...selected].sort());
</script>

<div class="space-y-5">
  <div class="flex flex-wrap items-center gap-2">
    <span class="font-display text-xs uppercase tracking-wider text-muted-foreground mr-1">
      filter:
    </span>
    {#each categories as { category, count } (category)}
      {@const active = selected.has(category)}
      <button
        type="button"
        class={[
          'px-3 py-1.5 rounded-md font-display text-xs transition-colors border',
          active
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-input text-muted-foreground hover:text-foreground hover:bg-card',
        ]}
        aria-pressed={active}
        onclick={() => toggle(category)}
      >
        {category}
        <span class="opacity-60 ml-1">({count})</span>
      </button>
    {/each}
    {#if selected.size > 0}
      <button
        type="button"
        class="ml-1 px-2 py-1.5 text-xs font-display text-muted-foreground hover:text-foreground transition-colors"
        onclick={clear}
      >
        clear
      </button>
    {/if}
  </div>

  {#if filtered.length === 0}
    <p class="text-sm text-muted-foreground italic px-1">
      No ciphers in the selected categories.
      <button
        class="font-display text-primary hover:underline ml-1"
        onclick={clear}
      >
        Show all
      </button>
    </p>
  {:else}
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each filtered as c (c.id)}
        <a
          href={`/c/${c.id}`}
          class="group block rounded-md border border-border bg-card hover:bg-secondary transition-colors p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <header class="flex items-center justify-between gap-3 mb-3">
            <h3 class="font-display text-base text-foreground group-hover:text-primary transition-colors">
              {c.name}
            </h3>
            <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-display border border-border px-1.5 py-0.5 rounded">
              {c.category}
            </span>
          </header>
          <p class="text-sm text-muted-foreground leading-relaxed">
            {c.tagline}
          </p>
          {#if c.examplePreview}
            <div class="mt-4 font-display text-xs text-muted-foreground/80 truncate">
              <span class="text-foreground">{c.examplePreview.input}</span>
              <span class="text-primary mx-1">→</span>
              <span>{c.examplePreview.output}</span>
            </div>
          {/if}
        </a>
      {/each}
    </section>
    <p class="text-xs text-muted-foreground font-display">
      {filtered.length} of {ciphers.length} {ciphers.length === 1 ? 'cipher' : 'ciphers'}
      {#if selected.size > 0}
        in {selectedList.join(', ')}
      {/if}
    </p>
  {/if}
</div>
