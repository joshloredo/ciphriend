<script lang="ts">
  interface Props {
    playing: boolean;
    step: number;
    total: number;
    speed: number;
    onPlayToggle: () => void;
    onScrub: (n: number) => void;
    onSpeed: (s: number) => void;
  }

  let { playing, step, total, speed, onPlayToggle, onScrub, onSpeed }: Props = $props();

  const speeds = [0.25, 0.5, 1, 2];
</script>

<div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-display">
  <button
    type="button"
    class="grid place-items-center size-8 rounded-md border border-input bg-card hover:bg-secondary transition-colors shrink-0"
    onclick={onPlayToggle}
    aria-label={playing ? 'Pause' : 'Play'}
  >
    {#if playing}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        <rect x="2" y="2" width="3" height="8" />
        <rect x="7" y="2" width="3" height="8" />
      </svg>
    {:else}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        <path d="M2 2 L10 6 L2 10 Z" />
      </svg>
    {/if}
  </button>

  <input
    type="range"
    class="flex-1 min-w-[8rem] accent-primary"
    min={0}
    max={Math.max(total, 1)}
    value={step}
    oninput={(e) => onScrub(Number((e.currentTarget as HTMLInputElement).value))}
    aria-label="Step"
  />

  <span class="text-muted-foreground tabular-nums w-16 text-right shrink-0">
    {step} / {total}
  </span>

  <div class="flex items-center gap-1 shrink-0 ml-auto sm:ml-0" role="group" aria-label="Playback speed">
    {#each speeds as s}
      <button
        type="button"
        class={[
          'px-2 py-1 rounded border transition-colors',
          speed === s
            ? 'border-primary text-primary bg-primary/10'
            : 'border-input text-muted-foreground hover:text-foreground',
        ]}
        onclick={() => onSpeed(s)}
        aria-pressed={speed === s}
      >
        {s}×
      </button>
    {/each}
  </div>
</div>
