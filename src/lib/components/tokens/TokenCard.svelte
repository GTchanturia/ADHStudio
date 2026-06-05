<script>
  import { appState, selectToken, deleteToken, updateToken, createToken, notify } from '$lib/stores/platform.svelte.js';
  import { resolveToken, isAlias } from '$lib/utils/aliases.js';

  let { token, tokenMap } = $props();

  let editing = $state(false);
  let editValue = $state('');
  let saving = $state(false);
  let renaming = $state(false);
  let renameValue = $state('');

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
    } catch {
      // error handled in store
    } finally {
      saving = false;
    }
  }

  function cancelEdit() {
    editing = false;
    editValue = '';
  }

  async function duplicateToken(e) {
    e?.stopPropagation();
    const setId = token.token_set_id;
    if (!setId) return;
    const suffix = '-copy';
    const newName = token.name + suffix;
    try {
      const result = await createToken({
        token_set_id: setId,
        name: newName,
        type: token.type,
        layer: token.layer,
        value: { value: token.value?.value ?? token.value },
        description: token.description ?? ''
      });
      if (result) {
        renameValue = newName;
        renaming = true;
        selectToken(result.id);
      }
    } catch {
      // error handled in store
    }
  }

  function startRenaming(e) {
    e?.stopPropagation();
    renameValue = token.name;
    renaming = true;
  }

  async function saveRename() {
    if (!renameValue.trim() || renameValue === token.name) {
      renaming = false;
      return;
    }
    try {
      await updateToken(token.id, { name: renameValue.trim() });
      renaming = false;
    } catch {
      // error handled in store
    }
  }

  function cancelRename() {
    renaming = false;
    renameValue = '';
  }

  function handleRowKeydown(e) {
    if (e.key === 'Enter' && !editing && !renaming) selectToken(token.id);
    if (e.key === 'F2') startRenaming(e);
  }

  function handleGlobalRename() {
    if (isSelected && !renaming) {
      renameValue = token.name;
      renaming = true;
    }
  }

  function handleGlobalDuplicate() {
    if (isSelected) duplicateToken(new Event('click'));
  }

  $effect(() => {
    window.addEventListener('token-rename', handleGlobalRename);
    window.addEventListener('token-duplicate', handleGlobalDuplicate);
    return () => {
      window.removeEventListener('token-rename', handleGlobalRename);
      window.removeEventListener('token-duplicate', handleGlobalDuplicate);
    };
  });
</script>

<div
  class="token-row"
  class:selected={isSelected}
  class:error={hasError}
  onclick={() => { if (!editing && !renaming) selectToken(token.id); }}
  role="button"
  tabindex="0"
  onkeydown={handleRowKeydown}
>
  <!-- Color swatch -->
  <div class="row-swatch">
    {#if token.type === 'color'}
      {#if isValidHex(displayValue)}
        <div class="swatch-color" style:background={displayValue}></div>
      {:else if isAliasRef && hasError}
        <div class="swatch-error">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke="var(--color-error)" stroke-width="1"/>
            <path d="M5 3v2M5 6.5v.5" stroke="var(--color-error)" stroke-width="1" stroke-linecap="round"/>
          </svg>
        </div>
      {:else}
        <div class="swatch-color swatch-alias" style:background={isValidHex(resolved.value ?? '') ? resolved.value : undefined}>
          {#if isAliasRef}
            <span class="swatch-alias-label">{token.value?.value ?? token.value}</span>
          {/if}
        </div>
      {/if}
    {:else if token.type === 'spacing'}
      <div class="swatch-type-icon type-spacing-bg">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 5h8M1 3v4M9 3v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>
    {:else if token.type === 'typography'}
      <div class="swatch-type-icon type-typography-bg">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 2h6M5 2v6M3 8h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>
    {:else if token.type === 'border'}
      <div class="swatch-type-icon type-border-bg">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="1" y="1" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
        </svg>
      </div>
    {:else if token.type === 'shadow'}
      <div class="swatch-type-icon type-shadow-bg">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="2" y="2" width="6" height="6" rx="1" fill="currentColor" opacity="0.3"/>
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1"/>
        </svg>
      </div>
    {:else}
      <div class="swatch-type-icon type-other-bg">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1" opacity="0.6"/>
        </svg>
      </div>
    {/if}
  </div>

  <!-- Token name -->
  <div class="row-name-cell">
    {#if renaming}
      <div class="inline-rename" onclick={e => e.stopPropagation()}>
        <input
          type="text"
          bind:value={renameValue}
          class="inline-rename-input"
          onkeydown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') cancelRename(); }}
          autofocus
        />
        <button class="inline-save" onclick={saveRename} title="Save">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="inline-cancel" onclick={cancelRename} title="Cancel">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    {:else}
      <span class="row-name" title={token.name}>
        {#if isAliasRef}
          <svg class="alias-icon" width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M6 1l3 4-3 4M1 5h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/if}
        {token.name}
      </span>
      {#if token.description}
        <span class="row-desc-indicator" title={token.description}>i</span>
      {/if}
    {/if}
  </div>

  <!-- Value -->
  <div class="row-value-cell">
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
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="inline-cancel" onclick={cancelEdit} title="Cancel">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    {:else if hasError}
      <span class="value-error" title={resolved.error}>{resolved.error?.slice(0, 30)}</span>
    {:else}
      <span class="row-value" title="Double-click to edit" ondblclick={startEditing} role="button" tabindex="-1">{displayValue}</span>
    {/if}
  </div>

  <!-- Layer badge -->
  <span class="row-badge layer-{token.layer ?? 'core'}">{token.layer}</span>

  <!-- Type badge -->
  <span class="row-badge type-{token.type ?? 'other'}">{token.type}</span>

  <!-- Actions -->
  <div class="row-actions">
    <button class="row-action-btn" onclick={startRenaming} title="Rename (F2)">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M7 2l2 2-5 5H2V7l5-5z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
      </svg>
    </button>
    <button class="row-action-btn" onclick={duplicateToken} title="Duplicate token">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.1"/>
        <path d="M7 3V2a1 1 0 00-1-1H2a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="currentColor" stroke-width="1.1"/>
      </svg>
    </button>
    <button class="row-action-btn danger" onclick={e => { e.stopPropagation(); deleteToken(token.id); }} title="Delete">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M2 2l7 7M9 2l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .token-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px 0 12px;
    height: 36px;
    border-bottom: 1px solid var(--color-border-subtle);
    cursor: pointer;
    transition: background 0.1s;
    background: transparent;
  }

  .token-row:hover {
    background: var(--color-surface-2);
  }

  .token-row.selected {
    background: var(--color-accent-muted);
    border-bottom-color: transparent;
  }

  .token-row.error {
    border-bottom-color: rgba(239,68,68,0.15);
  }

  /* Swatch */
  .row-swatch {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .swatch-color {
    width: 24px;
    height: 24px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.08);
    position: relative;
    overflow: hidden;
    transition: transform 0.12s, box-shadow 0.12s;
  }

  .token-row:hover .swatch-color {
    transform: scale(1.1);
    box-shadow: 0 0 0 2px var(--color-surface-4);
  }

  .swatch-alias {
    background: linear-gradient(135deg, var(--color-surface-4), var(--color-surface-5)) !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .swatch-alias-label {
    font-size: 7px;
    font-family: var(--font-mono);
    color: var(--color-text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    padding: 0 2px;
  }

  .swatch-error {
    width: 24px;
    height: 24px;
    border-radius: 5px;
    background: rgba(239,68,68,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .swatch-type-icon {
    width: 24px;
    height: 24px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s;
  }

  .token-row:hover .swatch-type-icon { transform: scale(1.1); }

  .type-spacing-bg { background: rgba(52,211,153,0.12); color: var(--color-token-spacing); }
  .type-typography-bg { background: rgba(167,139,250,0.12); color: var(--color-token-typography); }
  .type-border-bg { background: rgba(251,191,36,0.12); color: var(--color-token-border); }
  .type-shadow-bg { background: rgba(96,165,250,0.12); color: var(--color-token-shadow); }
  .type-other-bg { background: rgba(148,163,184,0.12); color: var(--color-token-other); }

  /* Name cell */
  .row-name-cell {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .row-name {
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .alias-icon { color: var(--color-accent); flex-shrink: 0; }

  .row-desc-indicator {
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--color-surface-4);
    color: var(--color-text-tertiary);
    font-size: 8px; font-weight: 700; font-style: italic;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: background 0.12s;
  }

  .token-row:hover .row-desc-indicator { background: var(--color-surface-5); }

  /* Value */
  .row-value-cell {
    min-width: 100px;
    max-width: 180px;
    flex-shrink: 0;
  }

  .row-value {
    font-size: 11px;
    color: var(--color-text-secondary);
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    cursor: text;
    transition: color 0.12s;
  }

  .row-value:hover { color: var(--color-accent); }

  .value-error {
    font-size: 11px;
    color: var(--color-error);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }

  /* Inline edits */
  .inline-edit, .inline-rename {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .inline-edit-input, .inline-rename-input {
    width: 100%;
    background: var(--color-surface-4);
    border: 1px solid var(--color-accent);
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
    outline: none;
    min-width: 0;
  }

  .inline-save, .inline-cancel {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 3px;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.12s;
  }

  .inline-save { background: var(--color-accent-muted); color: var(--color-accent); }
  .inline-save:hover { background: var(--color-accent); color: white; }
  .inline-save:disabled { opacity: 0.4; }

  .inline-cancel { background: transparent; color: var(--color-text-tertiary); }
  .inline-cancel:hover { background: var(--color-surface-4); color: var(--color-text-primary); }

  /* Badges */
  .row-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    flex-shrink: 0;
    transition: opacity 0.12s;
  }

  .token-row:not(:hover):not(.selected) .row-badge {
    opacity: 0.6;
  }

  /* Actions */
  .row-actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.12s;
    flex-shrink: 0;
  }

  .token-row:hover .row-actions,
  .token-row.selected .row-actions {
    opacity: 1;
  }

  .row-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    transition: all 0.1s;
    background: transparent;
    color: var(--color-text-tertiary);
  }

  .row-action-btn:hover { background: var(--color-surface-4); color: var(--color-text-primary); }
  .row-action-btn.danger:hover { background: rgba(239,68,68,0.15); color: var(--color-error); }
</style>
