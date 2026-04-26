<script lang="ts">
  import type { OptionField } from '../ciphers/_types';

  interface Props {
    field: OptionField;
    value: unknown;
    onchange: (next: unknown) => void;
  }

  let { field, value, onchange }: Props = $props();

  function update(next: unknown) {
    onchange(next);
  }
</script>

<label class="flex flex-col gap-1.5 text-sm">
  <span class="font-display text-xs uppercase tracking-wider text-muted-foreground">
    {field.label}
    {#if field.ephemeral || field.kind === 'password'}
      <span class="text-primary/80 normal-case ml-1">(ephemeral — never shared)</span>
    {/if}
  </span>

  {#if field.kind === 'number'}
    <input
      type="number"
      class="bg-card border border-input rounded-md px-3 py-2 font-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      value={value as number}
      min={field.min}
      max={field.max}
      step={field.step ?? 1}
      oninput={(e) => update(Number((e.currentTarget as HTMLInputElement).value))}
    />
  {:else if field.kind === 'select'}
    <select
      class="bg-card border border-input rounded-md px-3 py-2 font-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      value={value as string}
      onchange={(e) => update((e.currentTarget as HTMLSelectElement).value)}
    >
      {#each field.options ?? [] as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  {:else if field.kind === 'toggle'}
    <button
      type="button"
      class="self-start px-3 py-1.5 rounded-md font-display text-xs border border-input bg-card hover:bg-secondary transition-colors"
      aria-pressed={Boolean(value)}
      onclick={() => update(!value)}
    >
      {value ? 'on' : 'off'}
    </button>
  {:else if field.kind === 'password'}
    <input
      type="password"
      autocomplete="off"
      class="bg-card border border-input rounded-md px-3 py-2 font-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      value={(value ?? '') as string}
      placeholder="Never persisted, never shared"
      oninput={(e) => update((e.currentTarget as HTMLInputElement).value)}
    />
  {:else}
    <input
      type="text"
      class="bg-card border border-input rounded-md px-3 py-2 font-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      value={(value ?? '') as string}
      oninput={(e) => update((e.currentTarget as HTMLInputElement).value)}
    />
  {/if}

  {#if field.description}
    <span class="text-xs text-muted-foreground">{field.description}</span>
  {/if}
</label>
