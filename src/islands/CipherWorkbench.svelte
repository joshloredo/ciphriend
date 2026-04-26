<script lang="ts">
  import type { CipherSpec, Mode, CharTransform } from '../ciphers/_types';
  import { getCipher } from '../ciphers/_registry';
  import OptionRenderer from './OptionRenderer.svelte';
  import TraceVisualizer from './visualizers/TraceVisualizer.svelte';
  import { serialize, parse, FRAGMENT_MAX_BYTES } from '../lib/url-fragment';

  interface Props {
    cipherId: string;
  }
  let { cipherId }: Props = $props();

  // Resolve the cipher from the registry on the client.
  // Functions can't survive Astro's JSON-serialized prop bridge, so we re-import.
  const cipher: CipherSpec | undefined = getCipher(cipherId);

  function defaultOpts(): Record<string, unknown> {
    if (!cipher) return {};
    const o: Record<string, unknown> = {};
    for (const f of cipher.options) {
      if (f.default !== undefined) o[f.id] = f.default;
    }
    return o;
  }

  let mode = $state<Mode>(cipher?.modes[0] ?? 'encode');
  let opts = $state<Record<string, unknown>>(defaultOpts());
  let input = $state('');
  let output = $state('');
  let error = $state<string | null>(null);
  let shareToast = $state<string | null>(null);
  let showViz = $state(true);
  let CustomViz = $state<unknown>(null);

  // Hydrate from URL fragment on mount.
  $effect(() => {
    if (!cipher || typeof window === 'undefined') return;
    const parsed = parse(window.location.hash, cipher);
    if (parsed.mode) mode = parsed.mode;
    if (parsed.opts) opts = { ...opts, ...parsed.opts };
    if (parsed.payload !== undefined) input = parsed.payload;
  });

  // Lazy-load custom viz component if the cipher has one.
  $effect(() => {
    if (!cipher?.viz) return;
    let cancelled = false;
    cipher.viz().then((mod) => {
      if (!cancelled) CustomViz = mod.default;
    });
    return () => { cancelled = true; };
  });

  // Compute output reactively. Async-aware for crypto ciphers.
  $effect(() => {
    if (!cipher) return;
    const fn = mode === 'encode' ? cipher.encode : cipher.decode;
    if (!fn) {
      error = `${cipher.name} doesn't support ${mode}.`;
      output = '';
      return;
    }
    error = null;
    try {
      const result = fn(input, opts);
      if (result instanceof Promise) {
        result.then((v) => { output = v; }).catch((e) => {
          error = (e instanceof Error ? e.message : String(e));
          output = '';
        });
      } else {
        output = result;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      output = '';
    }
  });

  // Compute trace for the generic visualizer.
  let transforms: CharTransform[] = $derived(
    cipher?.trace ? cipher.trace(input, opts, mode) : []
  );

  // Reflect state into URL hash (debounced).
  let hashTimer: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    if (!cipher || typeof window === 'undefined') return;
    const result = serialize(cipher, { mode, opts, payload: input });
    if (!result.ok) return;
    if (hashTimer) clearTimeout(hashTimer);
    hashTimer = setTimeout(() => {
      const url = window.location.pathname + window.location.search + result.hash;
      window.history.replaceState(null, '', url);
    }, 250);
  });

  function updateOpt(id: string, value: unknown) {
    opts = { ...opts, [id]: value };
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
      shareToast = 'Output copied!';
    } catch {
      shareToast = 'Could not copy. Select and copy manually.';
    }
    setTimeout(() => { shareToast = null; }, 2000);
  }

  async function copyShareLink() {
    const result = serialize(cipher, { mode, opts, payload: input });
    if (!result.ok) {
      shareToast = `Too large to share via link (${result.bytes} bytes > ${FRAGMENT_MAX_BYTES}). Copy the output instead.`;
      setTimeout(() => { shareToast = null; }, 4000);
      return;
    }
    const url = window.location.origin + window.location.pathname + result.hash;
    try {
      await navigator.clipboard.writeText(url);
      shareToast = 'Share link copied!';
    } catch {
      shareToast = 'Could not copy. URL is in your address bar.';
    }
    setTimeout(() => { shareToast = null; }, 2000);
  }

  function loadExample(idx: number) {
    const ex = cipher.examples?.[idx];
    if (!ex) return;
    input = ex.input;
    opts = { ...opts, ...ex.opts };
  }
</script>

{#if !cipher}
  <article class="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
    Cipher <code class="font-display text-foreground">{cipherId}</code> not found.
  </article>
{:else}
<article class="rounded-lg border border-border bg-card overflow-hidden">
  <header class="flex flex-col items-stretch gap-2 px-3 py-3 border-b border-border bg-secondary/40 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
    <div class="min-w-0">
      <h1 class="font-display text-lg leading-tight">{cipher.name}</h1>
      <p class="text-xs text-muted-foreground">{cipher.tagline}</p>
    </div>
    {#if cipher.modes.length > 1}
      <div class="flex self-start rounded-md border border-input overflow-hidden font-display text-xs sm:self-auto">
        {#each cipher.modes as m}
          <button
            type="button"
            class={[
              'px-3 py-1.5 transition-colors',
              mode === m
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-card',
            ]}
            aria-pressed={mode === m}
            onclick={() => (mode = m)}
          >
            {m}
          </button>
        {/each}
      </div>
    {/if}
  </header>

  <div class="p-3 space-y-5 sm:p-5">
    {#if cipher.options.length > 0}
      <section class="grid gap-4 sm:grid-cols-2">
        {#each cipher.options as field}
          <OptionRenderer
            {field}
            value={opts[field.id]}
            onchange={(v) => updateOpt(field.id, v)}
          />
        {/each}
      </section>
    {/if}

    <section class="space-y-2">
      <label class="font-display text-xs uppercase tracking-wider text-muted-foreground" for="cipher-input">
        Input
      </label>
      <textarea
        id="cipher-input"
        class="w-full min-h-28 bg-background border border-input rounded-md px-3 py-2 font-display text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        bind:value={input}
        placeholder="Type or paste here…"
      ></textarea>
    </section>

    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="font-display text-xs uppercase tracking-wider text-muted-foreground">
          Output
        </span>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1 text-xs font-display border border-input rounded-md hover:bg-secondary transition-colors"
            onclick={copyOutput}
          >
            Copy
          </button>
          <button
            type="button"
            class="px-3 py-1 text-xs font-display border border-input text-primary rounded-md hover:bg-primary/10 transition-colors"
            onclick={copyShareLink}
          >
            Share link
          </button>
        </div>
      </div>
      <div
        class={[
          'w-full min-h-20 rounded-md px-3 py-2 font-display text-sm border',
          error
            ? 'border-destructive bg-destructive/10 text-destructive-foreground'
            : 'border-input bg-background',
        ]}
        aria-live="polite"
      >
        {#if error}
          <span>Error: {error}</span>
        {:else}
          <span class="whitespace-pre-wrap break-all">{output}</span>
        {/if}
      </div>
      {#if cipher.examples?.length}
        <div class="flex flex-wrap gap-2 pt-1">
          {#each cipher.examples as ex, i}
            <button
              type="button"
              class="text-xs font-display px-2.5 py-1 rounded-md border border-input text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              onclick={() => loadExample(i)}
            >
              try: {ex.label ?? ex.input.slice(0, 16)}
            </button>
          {/each}
        </div>
      {/if}
    </section>

    {#if cipher.trace || cipher.viz}
      <section class="space-y-2 pt-2 border-t border-border/60">
        <div class="flex items-center justify-between">
          <span class="font-display text-xs uppercase tracking-wider text-muted-foreground">
            Visualization
          </span>
          <button
            type="button"
            class="text-xs font-display text-muted-foreground hover:text-foreground transition-colors"
            onclick={() => (showViz = !showViz)}
            aria-pressed={!showViz}
          >
            {showViz ? 'Hide' : 'Show'}
          </button>
        </div>

        {#if showViz}
          {#if cipher.viz && CustomViz}
            <!-- @ts-ignore -->
            <svelte:component this={CustomViz} {input} {output} {opts} {mode} />
          {:else if cipher.trace}
            <TraceVisualizer {transforms} />
          {/if}
        {/if}
      </section>
    {/if}
  </div>

  {#if shareToast}
    <div
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md bg-card border border-border text-sm font-display shadow-lg"
      role="status"
    >
      {shareToast}
    </div>
  {/if}
</article>
{/if}
