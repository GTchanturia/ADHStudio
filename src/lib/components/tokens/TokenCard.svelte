<script>
  import { appState, selectToken, deleteToken } from '$lib/stores/platform.svelte.js';
  import { resolveToken } from '$lib/utils/aliases.js';
  import { checkWcag } from '$lib/utils/color.js';

  let { token, tokenMap } = $props();

  let hovering = $state(false);

  const resolved = $derived(resolveToken(token.name, tokenMap));
  const displayValue = $derived(resolved.value ?? token.value?.value ?? token.value ?? '');
  const isAlias = $derived(typeof (token.value?.value ?? token.value) === 'string' &&
    (token.value?.value ?? token.value ?? '').startsWith('{'));
  const isSelected = $derived(appState.selectedTokenId === token.id);
  const hasError = $derived(!!resolved.error);

  const typeColors = {
    color: 'var(--color-token-color)',
    typography: 'var(--color-token-typography)',
    spacing: 'var(--color-token-spacing)',
    border: 'var(--color-token-border)',
    shadow: 'var(--color-token-shadow)'
  };

  const typeColor = $derived(typeColors[token.type] ?? 'var(--color-token-other)');

  function isValidHex(v) {
    return typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);
  }
</script>

<div
  class="token-card"
  class:selected={isSelected}
  class:error={hasError}
  onclick={() => selectToken(token.id)}
  onmouseenter={() => hovering = true}
  onmouseleave={() => hovering = false}
  role="button"
  tabindex="0"
  onkeydown={e => e.key === 'Enter' && selectToken(token.id)}
>
  <!-- Color preview for color tokens -->
  {#if token.type === 'color'}
    <div class="color-preview-area">
      {#if isValidHex(displayValue)}
        <div class="color-swatch" style:background={displayValue}>
          {#if hovering}
            <div class="color-hex-overlay">{displayValue}</div>
          {/if}
        </div>
      {:else if isAlias && hasError}
        <div class="color-swatch error-swatch">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 5v4M8 11v1" stroke="var(--color-error)" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="8" cy="8" r="6.5" stroke="var(--color-error)" stroke-width="1"/>
          </svg>
        </div>
      {:else}
        <div class="color-swatch placeholder-swatch"></div>
      {/if}
    </div>
  {:else if token.type === 'spacing'}
    <div class="spacing-preview-area">
      <div class="spacing-visual" style:width={typeof displayValue === 'string' && displayValue.endsWith('px') ? displayValue : '50%'}></div>
    </div>
  {:else if token.type === 'typography'}
    <div class="typography-preview-area">
      <span class="typography-sample" style:font-size={displayValue}>Aa</span>
    </div>
  {/if}

  <div class="token-card-body">
    <div class="token-name-row">
      <span class="token-name" title={token.name}>{token.name}</span>
      {#if isAlias}
        <svg class="alias-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" title="Alias">
          <path d="M6 1l3 4-3 4M1 5h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      {/if}
    </div>

    <div class="token-value-row">
      {#if hasError}
        <span class="value-error" title={resolved.error}>⚠ {resolved.error?.slice(0, 30)}...</span>
      {:else}
        <span class="token-value" title={String(displayValue)}>{displayValue}</span>
      {/if}
    </div>

    <div class="token-meta-row">
      <span class="token-badge type-{token.type ?? 'other'}">{token.type}</span>
      <span class="token-badge layer-{token.layer ?? 'core'}">{token.layer}</span>
    </div>
  </div>

  {#if hovering && !isSelected}
    <div class="token-card-actions animate-fade-in">
      <button
        class="card-action-btn danger"
        onclick={e => { e.stopPropagation(); deleteToken(token.id); }}
        title="Delete token"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2 2l7 7M9 2l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  {/if}
</div>

<style>
  .token-card {
    position: relative;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 140px;
  }

  .token-card:hover {
    border-color: var(--color-surface-5);
    background: var(--color-surface-3);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }

  .token-card.selected {
    border-color: var(--color-accent);
    background: var(--color-surface-3);
    box-shadow: 0 0 0 1px var(--color-accent-muted), 0 4px 16px rgba(59,130,246,0.1);
  }

  .token-card.error {
    border-color: rgba(239,68,68,0.4);
  }

  .color-preview-area {
    flex-shrink: 0;
    height: 56px;
  }

  .color-swatch {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-hex-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.5);
    font-size: 11px;
    font-family: var(--font-mono);
    color: white;
    letter-spacing: 0.05em;
    backdrop-filter: blur(2px);
  }

  .error-swatch {
    background: rgba(239,68,68,0.1);
  }

  .placeholder-swatch {
    background: linear-gradient(135deg, var(--color-surface-4), var(--color-surface-5));
  }

  .spacing-preview-area {
    flex-shrink: 0;
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    background: var(--color-surface-3);
    overflow: hidden;
  }

  .spacing-visual {
    height: 4px;
    max-width: 100%;
    background: var(--color-token-spacing);
    border-radius: 2px;
    opacity: 0.7;
  }

  .typography-preview-area {
    flex-shrink: 0;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-3);
    overflow: hidden;
  }

  .typography-sample {
    color: var(--color-token-typography);
    font-weight: 700;
    line-height: 1;
    max-width: 100%;
    overflow: hidden;
  }

  .token-card-body {
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-height: 0;
  }

  .token-name-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .token-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .alias-icon {
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .token-value-row {
    min-height: 16px;
  }

  .token-value {
    font-size: 10px;
    color: var(--color-text-secondary);
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }

  .value-error {
    font-size: 10px;
    color: var(--color-error);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }

  .token-meta-row {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: auto;
  }

  .token-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .type-color { color: var(--color-token-color); background: rgba(248,113,113,0.12); }
  .type-typography { color: var(--color-token-typography); background: rgba(167,139,250,0.12); }
  .type-spacing { color: var(--color-token-spacing); background: rgba(52,211,153,0.12); }
  .type-border { color: var(--color-token-border); background: rgba(251,191,36,0.12); }
  .type-shadow { color: var(--color-token-shadow); background: rgba(96,165,250,0.12); }
  .type-other { color: var(--color-token-other); background: rgba(148,163,184,0.12); }

  .layer-core { color: var(--color-layer-core); background: rgba(100,116,139,0.15); }
  .layer-semantic { color: var(--color-layer-semantic); background: rgba(139,92,246,0.15); }
  .layer-component { color: var(--color-layer-component); background: rgba(6,182,212,0.15); }

  .token-card-actions {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    gap: 2px;
  }

  .card-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    transition: all 0.12s;
    background: var(--color-surface-4);
    color: var(--color-text-secondary);
  }

  .card-action-btn.danger:hover {
    background: rgba(239,68,68,0.2);
    color: var(--color-error);
  }
</style>
