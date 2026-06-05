<script>
  import { appState, selectToken, deleteToken, updateToken, notify } from '$lib/stores/platform.svelte.js';
  import { resolveToken, isAlias } from '$lib/utils/aliases.js';

  let { token, tokenMap } = $props();

  let hovering = $state(false);
  let editing = $state(false);
  let editValue = $state('');
  let saving = $state(false);

  const resolved = $derived(resolveToken(token.name, tokenMap));
  const displayValue = $derived(resolved.value ?? token.value?.value ?? token.value ?? '');
  const isAliasRef = $derived(isAlias(token.value?.value ?? token.value));
  const isSelected = $derived(appState.selectedTokenId === token.id);
  const hasError = $derived(!!resolved.error);

  function isValidHex(v) {
    return typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);
  }

  function startEditing(e) {
    e?.stopPropagation();
    editValue = token.value?.value ?? token.value ?? '';
    editing = true;
  }

  async function saveEdit() {
    if (!editValue.trim() || editValue === (token.value?.value ?? token.value)) {
      editing = false;
      return;
    }
    saving = true;
    try {
      await updateToken(token.id, { value: { value: editValue.trim() } });
      editing = false;
    } catch (e) {
      // error handled in store
    } finally {
      saving = false;
    }
  }

  function cancelEdit() {
    editing = false;
    editValue = '';
  }

  function duplicateToken(e) {
    e?.stopPropagation();
    // Copy the token name to clipboard for now, with hint to paste in add modal
    const data = `${token.name}: ${token.value?.value ?? token.value}`;
    navigator.clipboard.writeText(data);
    notify('Token data copied — use Add Token to create duplicate', 'info');
  }
</script>

<div
  class="token-card"
  class:selected={isSelected}
  class:error={hasError}
  class:editing
  onclick={() => { if (!editing) selectToken(token.id); }}
  onmouseenter={() => hovering = true}
  onmouseleave={() => hovering = false}
  role="button"
  tabindex="0"
  onkeydown={e => { if (e.key === 'Enter' && !editing) selectToken(token.id); }}
>
  <!-- Token type preview areas -->
  {#if token.type === 'color'}
    <div class="color-preview-area">
      {#if isValidHex(displayValue)}
        <div class="color-swatch" style:background={displayValue}>
          {#if hovering || isSelected}
            <div class="color-hex-overlay">{displayValue}</div>
          {/if}
        </div>
      {:else if isAliasRef && hasError}
        <div class="color-swatch error-swatch">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 5v4M8 11h0" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round"/>
            <circle cx="8" cy="8" r="6.5" stroke="var(--color-error)" stroke-width="1"/>
          </svg>
        </div>
      {:else}
        <div class="color-swatch alias-swatch" style:background={isValidHex(resolved.value ?? '') ? resolved.value : undefined}>
          {#if isAliasRef}
            <div class="alias-ref-label">{token.value?.value ?? token.value}</div>
          {/if}
        </div>
      {/if}
    </div>
  {:else if token.type === 'spacing'}
    <div class="spacing-preview-area">
      <div class="spacing-visual" style:width="{clamp(parseFloat(displayValue) * 3, 8, 100)}%"></div>
      <span class="spacing-label">{displayValue}</span>
    </div>
  {:else if token.type === 'typography'}
    <div class="typography-preview-area">
      <span class="typography-sample" style:font-size="{Math.min(parseFloat(displayValue) || 16, 48)}px">Aa</span>
    </div>
  {:else if token.type === 'border'}
    <div class="border-preview-area">
      <div class="border-swatch" style:border-radius={displayValue} style:border-width="{Math.min(parseFloat(displayValue) || 2, 8)}px"></div>
    </div>
  {:else if token.type === 'shadow'}
    <div class="shadow-preview-area">
      <div class="shadow-swatch" style:box-shadow={displayValue}></div>
    </div>
  {:else}
    <div class="other-preview-area">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
      </svg>
    </div>
  {/if}

  <div class="token-card-body">
    <div class="token-name-row">
      <span class="token-name" title={token.name}>{token.name}</span>
      {#if isAliasRef}
        <svg class="alias-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" title="Alias reference">
          <path d="M6 1l3 4-3 4M1 5h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      {/if}
      {#if token.description}
        <span class="description-indicator" title={token.description}>i</span>
      {/if}
    </div>

    <div class="token-value-row">
      {#if editing}
        <div class="inline-edit">
          <input
            type="text"
            bind:value={editValue}
            class="inline-edit-input"
            onkeydown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
            onclick={e => e.stopPropagation()}
            autofocus
          />
          <button class="inline-save" onclick={saveEdit} disabled={saving} title="Save">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      {:else if hasError}
        <span class="value-error" title={resolved.error}>{resolved.error?.slice(0, 25)}...</span>
      {:else}
        <span class="token-value" title={String(displayValue)} ondblclick={startEditing} role="button" tabindex="-1">{displayValue}</span>
      {/if}
    </div>

    <div class="token-meta-row">
      <span class="token-badge type-{token.type ?? 'other'}">{token.type}</span>
      <span class="token-badge layer-{token.layer ?? 'core'}">{token.layer}</span>
    </div>
  </div>

  <!-- Hover action bar -->
  {#if hovering && !editing}
    <div class="token-card-actions animate-fade-in">
      <button class="card-action-btn" onclick={duplicateToken} title="Duplicate">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.1"/>
          <path d="M7 3V2a1 1 0 00-1-1H2a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="currentColor" stroke-width="1.1"/>
        </svg>
      </button>
      <button class="card-action-btn" onclick={startEditing} title="Edit value">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M7 2l2 2-5 5H2V7l5-5z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="card-action-btn danger" onclick={e => { e.stopPropagation(); deleteToken(token.id); }} title="Delete">
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

  .token-card.error { border-color: rgba(239,68,68,0.4); }

  .color-preview-area { flex-shrink: 0; height: 56px; }

  .color-swatch {
    width: 100%; height: 100%;
    position: relative;
    display: flex; align-items: center; justify-content: center;
  }

  .color-hex-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.5);
    font-size: 11px; font-family: var(--font-mono);
    color: white; letter-spacing: 0.05em;
    backdrop-filter: blur(2px);
  }

  .alias-swatch {
    background: linear-gradient(135deg, var(--color-surface-4), var(--color-surface-5));
  }

  .alias-ref-label {
    font-size: 9px; font-family: var(--font-mono);
    color: var(--color-text-tertiary);
    background: rgba(0,0,0,0.4); padding: 1px 6px; border-radius: 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%;
  }

  .error-swatch { background: rgba(239,68,68,0.1); }

  .placeholder-swatch {
    background: linear-gradient(135deg, var(--color-surface-4), var(--color-surface-5));
  }

  .spacing-preview-area {
    flex-shrink: 0; height: 56px;
    display: flex; align-items: center; gap: 8px;
    padding: 0 12px;
    background: var(--color-surface-3);
    overflow: hidden;
  }

  .spacing-visual {
    height: 4px; max-width: 100%;
    background: var(--color-token-spacing); border-radius: 2px;
    opacity: 0.8;
  }

  .spacing-label {
    font-size: 10px; font-family: var(--font-mono);
    color: var(--color-text-tertiary); white-space: nowrap;
  }

  .typography-preview-area {
    flex-shrink: 0; height: 56px;
    display: flex; align-items: center; justify-content: center;
    background: var(--color-surface-3); overflow: hidden;
  }

  .typography-sample {
    color: var(--color-token-typography);
    font-weight: 700; line-height: 1;
    max-width: 100%; overflow: hidden;
  }

  .border-preview-area {
    flex-shrink: 0; height: 56px;
    display: flex; align-items: center; justify-content: center;
    background: var(--color-surface-3); padding: 12px;
  }

  .border-swatch {
    width: 40px; height: 40px;
    border: 3px solid var(--color-token-border);
    border-style: solid;
    transition: all 0.15s;
  }

  .shadow-preview-area {
    flex-shrink: 0; height: 56px;
    display: flex; align-items: center; justify-content: center;
    background: var(--color-surface-0); padding: 12px;
  }

  .shadow-swatch {
    width: 36px; height: 36px;
    border-radius: 6px;
    background: var(--color-surface-4);
  }

  .other-preview-area {
    flex-shrink: 0; height: 56px;
    display: flex; align-items: center; justify-content: center;
    background: var(--color-surface-3); color: var(--color-text-tertiary);
  }

  .token-card-body {
    padding: 8px 10px;
    display: flex; flex-direction: column;
    gap: 3px; flex: 1; min-height: 0;
  }

  .token-name-row {
    display: flex; align-items: center; gap: 4px;
  }

  .token-name {
    font-size: 11px; font-weight: 600;
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
  }

  .alias-icon { color: var(--color-accent); flex-shrink: 0; }

  .description-indicator {
    width: 12px; height: 12px; border-radius: 50%;
    background: var(--color-surface-4);
    color: var(--color-text-tertiary);
    font-size: 8px; font-weight: 700; font-style: italic;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .token-value-row { min-height: 18px; }

  .token-value {
    font-size: 10px; color: var(--color-text-secondary);
    font-family: var(--font-mono);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    display: block; cursor: text;
  }

  .token-value:hover { color: var(--color-accent); }

  .value-error {
    font-size: 10px; color: var(--color-error);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    display: block;
  }

  .inline-edit {
    display: flex; align-items: center; gap: 4px;
  }

  .inline-edit-input {
    flex: 1;
    background: var(--color-surface-4);
    border: 1px solid var(--color-accent);
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 10px; font-family: var(--font-mono);
    color: var(--color-text-primary);
    outline: none; min-width: 0;
  }

  .inline-save {
    display: flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; border-radius: 3px;
    background: var(--color-accent-muted); border: none;
    color: var(--color-accent); cursor: pointer;
    flex-shrink: 0; transition: all 0.12s;
  }

  .inline-save:hover { background: var(--color-accent); color: white; }
  .inline-save:disabled { opacity: 0.4; }

  .token-meta-row {
    display: flex; gap: 4px; flex-wrap: wrap; margin-top: auto;
  }

  .token-badge {
    display: inline-flex; align-items: center;
    padding: 1px 5px; border-radius: 3px;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
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
    position: absolute; top: 4px; right: 4px;
    display: flex; gap: 2px;
  }

  .card-action-btn {
    display: flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 4px;
    border: none; cursor: pointer; transition: all 0.12s;
    background: rgba(15,15,16,0.8); color: var(--color-text-secondary);
    backdrop-filter: blur(4px);
  }

  .card-action-btn:hover { color: var(--color-text-primary); background: var(--color-surface-4); }

  .card-action-btn.danger:hover {
    background: rgba(239,68,68,0.2); color: var(--color-error);
  }
</style>
