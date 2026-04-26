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

  let query = $state('');

  let filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ciphers;
    return ciphers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.tagline.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q),
    );
  });

  function clear() {
    query = '';
  }
</script>

<div class="space-y-5">
  <div class="relative">
    <input
      type="search"
      class="w-full bg-card border border-input rounded-md pl-10 pr-10 py-2.5 font-display text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      placeholder="search ciphers… (try 'classical', 'hash', 'shift', …)"
      bind:value={query}
      autocomplete="off"
      spellcheck="false"
    />
    <svg
      class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
    {#if query}
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground px-2 py-1 text-xs font-display"
        onclick={clear}
        aria-label="Clear search"
      >
        clear
      </button>
    {/if}
  </div>

  {#if filtered.length === 0}
    <p class="text-sm text-muted-foreground italic px-1">
      No ciphers match <span class="font-display text-foreground">{query}</span>. Try a category like
      <button class="font-display text-primary hover:underline" onclick={() => (query = 'classical')}>classical</button>
      or
      <button class="font-display text-primary hover:underline" onclick={() => (query = 'hash')}>hash</button>.
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
      {#if query}matching <span class="text-foreground">{query}</span>{/if}
    </p>
  {/if}
</div>
