<script lang="ts">
  import type { CharTransform } from '../../ciphers/_types';
  import PlaybackControls from './PlaybackControls.svelte';

  interface Props {
    transforms: CharTransform[];
  }
  let { transforms }: Props = $props();

  const MAX_VISIBLE = 500;

  let playing = $state(false);
  let step = $state(0);
  let speed = $state(1);

  // Reset playback when the underlying transforms change.
  $effect(() => {
    transforms;
    if (!playing) step = transforms.length;
  });

  // Drive stepped playback.
  $effect(() => {
    if (!playing) return;
    if (step >= transforms.length) {
      playing = false;
      return;
    }
    const interval = 250 / speed;
    const id = setTimeout(() => {
      step = Math.min(step + 1, transforms.length);
    }, interval);
    return () => clearTimeout(id);
  });

  function onPlayToggle() {
    if (step >= transforms.length) step = 0;
    playing = !playing;
  }
  function onScrub(n: number) {
    playing = false;
    step = Math.max(0, Math.min(n, transforms.length));
  }
  function onSpeed(s: number) {
    speed = s;
  }

  let visibleTransforms = $derived(
    transforms.length > MAX_VISIBLE ? transforms.slice(0, MAX_VISIBLE) : transforms,
  );
  let truncated = $derived(transforms.length > MAX_VISIBLE);
  let hasOps = $derived(visibleTransforms.some((t) => t.op !== undefined));
</script>

<div class="space-y-3">
  {#if transforms.length === 0}
    <p class="text-xs text-muted-foreground italic">Nothing to visualize yet — type into the input above.</p>
  {:else}
    <PlaybackControls
      {playing}
      {step}
      total={transforms.length}
      {speed}
      {onPlayToggle}
      {onScrub}
      {onSpeed}
    />

    <div
      class="font-display text-sm overflow-x-auto rounded-md border border-border bg-card/60 px-3 py-3 motion-safe:transition-colors"
      role="img"
      aria-label="Cipher transformation visualization"
    >
      <div class="flex gap-0.5 mb-1">
        {#each visibleTransforms as t, i}
          {@const active = i < step}
          <span
            class={[
              'min-w-[1.5rem] text-center px-1 py-0.5 rounded-sm border-l-2 transition-all duration-150',
              active ? 'opacity-100 border-primary text-foreground' : 'opacity-40 border-transparent',
            ]}
            title={t.detail ?? ''}
            data-group={t.group ?? 0}
          >
            {t.inChar === ' ' ? '·' : t.inChar}
          </span>
        {/each}
      </div>
      {#if hasOps}
        <div
          class="flex gap-0.5 mb-1 text-[0.65rem] leading-none tabular-nums select-none"
          aria-hidden="true"
        >
          {#each visibleTransforms as t, i}
            {@const active = i < step}
            <span
              class={[
                'min-w-[1.5rem] text-center px-1 py-1 rounded-sm transition-all duration-150',
                active ? 'text-primary/80' : 'text-muted-foreground/50',
              ]}
            >
              {t.op ?? ''}
            </span>
          {/each}
        </div>
      {/if}
      <div class="flex gap-0.5">
        {#each visibleTransforms as t, i}
          {@const active = i < step}
          <span
            class={[
              'min-w-[1.5rem] text-center px-1 py-0.5 rounded-sm border-l-2 transition-all duration-150',
              active
                ? 'opacity-100 border-primary text-primary'
                : 'opacity-40 border-transparent text-muted-foreground',
            ]}
            title={t.detail ?? ''}
          >
            {t.outChar === ' ' ? '·' : (t.outChar || '∅')}
          </span>
        {/each}
      </div>
      {#if truncated}
        <p class="text-xs text-muted-foreground italic mt-2">
          Showing first {MAX_VISIBLE} of {transforms.length} characters. Scroll horizontally for more.
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  @media (prefers-reduced-motion: reduce) {
    .duration-150 { transition-duration: 0ms !important; }
  }
</style>
