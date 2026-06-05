<script>
  import { appState, createToken } from '$lib/stores/platform.svelte.js';

  let { onclose } = $props();

  let name = $state('');
  let type = $state('color');
  let layer = $state('core');
  let value = $state('');
  let description = $state('');
  let selectedSetId = $state(appState.activeSetIds[0] ?? '');
  let saving = $state(false);
  let error = $state('');

  const types = ['color', 'typography', 'spacing', 'border', 'shadow', 'other'];
  const layers = ['core', 'semantic', 'component'];

  async function handleSave() {
    if (!name.trim()) { error = 'Token name is required'; return; }
    if (!value.trim()) { error = 'Token value is required'; return; }
    if (!selectedSetId) { error = 'Select a token set'; return; }

    // Validate dash-notation name
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      error = 'Name must use dash-notation (e.g., color-primary-500)';
      return;
    }

    saving = true;
    error = '';
    try {
      await createToken({
        token_set_id: selectedSetId,
        name: name.trim(),
        type,
        layer,
        value: { value: value.trim() },
        description: description.trim()
      });
      onclose();
    } catch (e) {
      error = e.message ?? 'Failed to create token';
    } finally {
      saving = false;
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onclose();
  }

  const valuePlaceholder = {
    color: '#0055FF or {color.blue.500}',
    typography: '16px, 1rem, or {size.base}',
    spacing: '8px, 0.5rem',
    border: '4px, 8px',
    shadow: '0 2px 8px rgba(0,0,0,0.2)',
    other: 'any value or {alias.path}'
  };
</script>

<div class="modal-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true">
  <div class="modal animate-fade-in">
    <div class="modal-header">
      <h2>Add Token</h2>
      <button class="modal-close" onclick={onclose}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="modal-body">
      {#if error}
        <div class="form-error animate-fade-in">{error}</div>
      {/if}

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Token Set</label>
          <select bind:value={selectedSetId} class="form-select">
            {#each appState.tokenSets.filter(s => appState.activeSetIds.includes(s.id)) as set}
              <option value={set.id}>{set.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-group col-span-2">
          <label class="form-label">Name <span class="label-hint">dash-notation</span></label>
          <input
            type="text"
            bind:value={name}
            placeholder="color-primary-500"
            class="form-input mono"
            autofocus
          />
        </div>

        <div class="form-group">
          <label class="form-label">Type</label>
          <div class="type-selector">
            {#each types as t}
              <button
                class="type-btn"
                class:active={type === t}
                onclick={() => type = t}
              >{t}</button>
            {/each}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Layer</label>
          <div class="layer-selector">
            {#each layers as l}
              <button
                class="layer-btn"
                class:active={layer === l}
                class:layer-core={l === 'core'}
                class:layer-semantic={l === 'semantic'}
                class:layer-component={l === 'component'}
                onclick={() => layer = l}
              >{l}</button>
            {/each}
          </div>
        </div>

        <div class="form-group col-span-2">
          <label class="form-label" for="token-value">Value <span class="label-hint">or {"{alias.path}"}</span></label>
          <input
            id="token-value"
            type="text"
            bind:value={value}
            placeholder={valuePlaceholder[type]}
            class="form-input mono"
          />
          {#if type === 'color' && value && /^#[0-9a-fA-F]{6}$/.test(value)}
            <div class="color-preview-inline">
              <div class="color-dot" style:background={value}></div>
              <span>{value}</span>
            </div>
          {/if}
        </div>

        <div class="form-group col-span-2">
          <label class="form-label" for="token-description">Description <span class="label-hint">optional</span></label>
          <input
            id="token-description"
            type="text"
            bind:value={description}
            placeholder="Primary brand interaction color"
            class="form-input"
          />
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-ghost" onclick={onclose}>Cancel</button>
      <button class="btn-primary" onclick={handleSave} disabled={saving}>
        {saving ? 'Creating...' : 'Create Token'}
      </button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    width: 480px;
    max-width: 95vw;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    font-size: 15px;
    font-weight: 700;
    margin: 0;
    color: var(--color-text-primary);
  }

  .modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: all 0.15s;
  }

  .modal-close:hover {
    background: var(--color-surface-4);
    color: var(--color-text-primary);
  }

  .modal-body {
    padding: 20px;
  }

  .form-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--color-error);
    margin-bottom: 16px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .col-span-2 { grid-column: span 2; }

  .form-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .label-hint {
    font-size: 10px;
    color: var(--color-text-tertiary);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    font-family: var(--font-mono);
  }

  .form-input, .form-select {
    background: var(--color-surface-3);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 12px;
    color: var(--color-text-primary);
    outline: none;
    transition: border-color 0.15s;
  }

  .form-input:focus, .form-select:focus {
    border-color: var(--color-accent);
  }

  .form-input::placeholder { color: var(--color-text-tertiary); }
  .mono { font-family: var(--font-mono); }

  .type-selector, .layer-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .type-btn, .layer-btn {
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.12s;
    font-weight: 500;
  }

  .type-btn:hover, .layer-btn:hover {
    border-color: var(--color-surface-5);
    color: var(--color-text-primary);
  }

  .type-btn.active {
    background: var(--color-accent-muted);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .layer-btn.active.layer-core {
    background: rgba(100,116,139,0.2);
    border-color: var(--color-layer-core);
    color: var(--color-layer-core);
  }

  .layer-btn.active.layer-semantic {
    background: rgba(139,92,246,0.15);
    border-color: var(--color-layer-semantic);
    color: var(--color-layer-semantic);
  }

  .layer-btn.active.layer-component {
    background: rgba(6,182,212,0.15);
    border-color: var(--color-layer-component);
    color: var(--color-layer-component);
  }

  .color-preview-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }

  .color-dot {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .color-dot + span {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid var(--color-border);
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    padding: 7px 18px;
    transition: all 0.15s;
    font-weight: 600;
  }

  .btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    padding: 7px 18px;
    transition: all 0.15s;
  }

  .btn-ghost:hover {
    background: var(--color-surface-3);
    color: var(--color-text-primary);
  }
</style>
