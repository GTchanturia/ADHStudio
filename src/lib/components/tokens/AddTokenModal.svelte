<script>
  import { appState, createToken, bulkCreateTokens } from '$lib/stores/platform.svelte.js';
  import { generateScale, toLch, lchToHex, lighten, darken } from '$lib/utils/color.js';

  let { onclose } = $props();

  let mode = $state('single'); // 'single' or 'series'
  let name = $state('');
  let type = $state('color');
  let layer = $state('core');
  let value = $state('');
  let description = $state('');
  let selectedSetId = $state(appState.activeSetIds[0] ?? '');
  let saving = $state(false);
  let error = $state('');

  // Series mode options
  let seriesSuffix = $state('50');     // start suffix number
  let seriesCount = $state(10);        // how many tokens
  let seriesStep = $state(10);         // increment per step
  let seriesValueStart = $state('');   // start value (for non-color types)
  let seriesValueEnd = $state('');      // end value (for interpolation)

  const types = ['color', 'typography', 'spacing', 'border', 'shadow', 'other'];
  const layers = ['core', 'semantic', 'component'];

  const preview = $derived.by(() => {
    if (mode !== 'series') return [];

    const startNum = parseInt(seriesSuffix) || 0;
    const count = Math.min(Math.max(seriesCount, 1), 50);
    const step = parseInt(seriesStep) || 10;

    if (type === 'color' && value && /^#[0-9a-fA-F]{3,8}$/.test(value)) {
      // Use LCH scale generation for colors
      const scale = generateScale(value, count);
      return scale.map((s, i) => ({
        name: `${name}-${startNum + i * step}`,
        value: s.hex,
        index: i
      }));
    }

    // For non-color types, interpolate between start and end values
    const results = [];
    for (let i = 0; i < count; i++) {
      let tokenValue;
      if (type === 'spacing' || type === 'typography') {
        const startPx = parseFloat(seriesValueStart) || 0;
        const endPx = parseFloat(seriesValueEnd) || (startPx + (count - 1) * step);
        const px = startPx + (endPx - startPx) * (count > 1 ? i / (count - 1) : 0);
        tokenValue = `${Math.round(px)}px`;
      } else if (type === 'border') {
        const startPx = parseFloat(seriesValueStart) || 0;
        const endPx = parseFloat(seriesValueEnd) || (startPx + (count - 1) * step);
        const px = startPx + (endPx - startPx) * (count > 1 ? i / (count - 1) : 0);
        tokenValue = `${Math.round(px)}px`;
      } else {
        tokenValue = `${startNum + i * step}`;
      }
      results.push({
        name: `${name}-${startNum + i * step}`,
        value: tokenValue,
        index: i
      });
    }
    return results;
  });

  async function handleSave() {
    if (!name.trim()) { error = 'Token name is required'; return; }
    if (!selectedSetId) { error = 'Select a token set'; return; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      error = 'Base name must be lowercase with dashes (e.g., orange-primary)';
      return;
    }

    if (mode === 'single') {
      if (!value.trim()) { error = 'Token value is required'; return; }
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
    } else {
      // Series mode
      if (preview.length === 0) { error = 'No tokens to generate'; return; }
      if (type === 'color' && !value) { error = 'Base color value is required for color series'; return; }
      if ((type === 'spacing' || type === 'typography' || type === 'border') && !seriesValueStart) {
        error = 'Start value is required for this token type';
        return;
      }
      saving = true;
      error = '';
      try {
        const tokens = preview.map(p => ({
          token_set_id: selectedSetId,
          name: p.name,
          type,
          layer,
          value: { value: p.value },
          description: description.trim() || undefined
        }));
        await bulkCreateTokens(tokens);
        onclose();
      } catch (e) {
        error = e.message ?? 'Failed to create token series';
      } finally {
        saving = false;
      }
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onclose();
  }

  const valuePlaceholder = {
    color: '#FF6600 or {color.blue.500}',
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
      <h2>{mode === 'single' ? 'Add Token' : 'Generate Token Series'}</h2>
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

      <!-- Mode switcher -->
      <div class="mode-switcher">
        <button class="mode-btn" class:active={mode === 'single'} onclick={() => mode = 'single'}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Single Token
        </button>
        <button class="mode-btn" class:active={mode === 'series'} onclick={() => mode = 'series'}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.8"/>
            <rect x="5" y="1" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5"/>
            <rect x="9" y="1" width="2" height="3" rx="0.5" fill="currentColor" opacity="0.3"/>
            <rect x="1" y="6" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.4"/>
            <rect x="5" y="6" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3"/>
            <rect x="9" y="6" width="2" height="3" rx="0.5" fill="currentColor" opacity="0.2"/>
          </svg>
          Generate Series
        </button>
      </div>

      {#if mode === 'series'}
        <div class="series-intro">
          Generate multiple tokens from a base name with numeric suffixes.
          For colors, a perceptually uniform LCH scale is created automatically.
        </div>
      {/if}

      <div class="form-grid">
        <!-- Common fields -->
        <div class="form-group">
          <label class="form-label">Token Set</label>
          <select bind:value={selectedSetId} class="form-select">
            {#each appState.tokenSets.filter(s => appState.activeSetIds.includes(s.id)) as set}
              <option value={set.id}>{set.name}</option>
            {/each}
          </select>
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

        <div class="form-group col-span-2">
          <label class="form-label">
            {mode === 'single' ? 'Name' : 'Base Name'}
            <span class="label-hint">dash-notation</span>
          </label>
          <input
            type="text"
            bind:value={name}
            placeholder={mode === 'single' ? 'color-primary-500' : 'orange-primary'}
            class="form-input mono"
            autofocus
          />
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

        {#if mode === 'single'}
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
        {:else}
          <!-- Series-specific fields -->
          <div class="form-group">
            <label class="form-label">Start Suffix</label>
            <input
              type="number"
              bind:value={seriesSuffix}
              placeholder="50"
              class="form-input mono"
              min="0"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Count <span class="label-hint">tokens</span></label>
            <input
              type="number"
              bind:value={seriesCount}
              placeholder="10"
              class="form-input mono"
              min="2"
              max="50"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Step <span class="label-hint">suffix increment</span></label>
            <input
              type="number"
              bind:value={seriesStep}
              placeholder="10"
              class="form-input mono"
              min="1"
            />
          </div>

          {#if type === 'color'}
            <div class="form-group">
              <label class="form-label">Base Color</label>
              <input
                type="text"
                bind:value={value}
                placeholder="#FF6600"
                class="form-input mono"
              />
              {#if value && /^#[0-9a-fA-F]{6}$/.test(value)}
                <div class="color-preview-inline">
                  <div class="color-dot" style:background={value}></div>
                  <span>{value}</span>
                </div>
              {/if}
            </div>
          {:else}
            <div class="form-group">
              <label class="form-label">Start Value</label>
              <input
                type="text"
                bind:value={seriesValueStart}
                placeholder="4px"
                class="form-input mono"
              />
            </div>
            <div class="form-group">
              <label class="form-label">End Value</label>
              <input
                type="text"
                bind:value={seriesValueEnd}
                placeholder="64px"
                class="form-input mono"
              />
            </div>
          {/if}

          <!-- Preview -->
          {#if preview.length > 0}
            <div class="form-group col-span-2">
              <label class="form-label">Preview <span class="label-hint">{preview.length} tokens</span></label>
              <div class="series-preview">
                {#if type === 'color'}
                  <div class="color-scale-preview">
                    {#each preview as p, i (i)}
                      <div class="color-scale-chip" style:background={p.value} title="{p.name}: {p.value}">
                        <span class="chip-label">{p.name.split('-').pop()}</span>
                      </div>
                    {/each}
                  </div>
                {/if}
                <div class="series-list-preview">
                  {#each preview.slice(0, 8) as p, i (i)}
                    <div class="series-preview-row">
                      <span class="series-preview-name">{p.name}</span>
                      <span class="series-preview-value">{p.value}</span>
                    </div>
                  {/each}
                  {#if preview.length > 8}
                    <div class="series-preview-more">... +{preview.length - 8} more</div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        {/if}

        <div class="form-group col-span-2">
          <label class="form-label" for="token-description">Description <span class="label-hint">optional</span></label>
          <input
            id="token-description"
            type="text"
            bind:value={description}
            placeholder={mode === 'single' ? 'Primary brand interaction color' : 'Auto-generated scale'}
            class="form-input"
          />
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-ghost" onclick={onclose}>Cancel</button>
      <button class="btn-primary" onclick={handleSave} disabled={saving}>
        {saving
          ? 'Creating...'
          : mode === 'single'
            ? 'Create Token'
            : `Generate ${preview.length || seriesCount} Tokens`
        }
      </button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(4px);
  }

  .modal {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    width: 540px; max-width: 95vw;
    max-height: 85vh;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .modal-header h2 { font-size: 15px; font-weight: 700; margin: 0; color: var(--color-text-primary); }

  .modal-close {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px;
    background: transparent; border: none;
    color: var(--color-text-tertiary); cursor: pointer; transition: all 0.15s;
  }

  .modal-close:hover { background: var(--color-surface-4); color: var(--color-text-primary); }

  .modal-body {
    padding: 20px; overflow-y: auto; flex: 1;
  }

  /* Mode switcher */
  .mode-switcher {
    display: flex; gap: 4px;
    background: var(--color-surface-3);
    border-radius: 6px; padding: 3px;
    margin-bottom: 16px;
  }

  .mode-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 6px 12px; border-radius: 4px;
    background: transparent; border: none;
    color: var(--color-text-secondary); font-size: 12px;
    font-weight: 600; cursor: pointer; transition: all 0.15s;
  }

  .mode-btn:hover { color: var(--color-text-primary); }
  .mode-btn.active { background: var(--color-surface-0); color: var(--color-accent); box-shadow: 0 1px 3px rgba(0,0,0,0.2); }

  .series-intro {
    font-size: 11px; color: var(--color-text-tertiary);
    padding: 8px 12px; background: var(--color-surface-3);
    border-radius: 6px; margin-bottom: 14px; line-height: 1.5;
  }

  .form-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 6px; padding: 8px 12px;
    font-size: 12px; color: var(--color-error);
    margin-bottom: 16px;
  }

  .form-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .form-group {
    display: flex; flex-direction: column; gap: 6px;
  }

  .col-span-2 { grid-column: span 2; }

  .form-label {
    font-size: 11px; font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase; letter-spacing: 0.06em;
    display: flex; align-items: center; gap: 6px;
  }

  .label-hint {
    font-size: 10px; color: var(--color-text-tertiary);
    text-transform: none; letter-spacing: 0;
    font-weight: 400; font-family: var(--font-mono);
  }

  .form-input, .form-select {
    background: var(--color-surface-3);
    border: 1px solid var(--color-border);
    border-radius: 6px; padding: 7px 10px;
    font-size: 12px; color: var(--color-text-primary);
    outline: none; transition: border-color 0.15s;
  }

  .form-input:focus, .form-select:focus { border-color: var(--color-accent); }
  .form-input::placeholder { color: var(--color-text-tertiary); }
  .mono { font-family: var(--font-mono); }

  .type-selector, .layer-selector {
    display: flex; flex-wrap: wrap; gap: 4px;
  }

  .type-btn, .layer-btn {
    padding: 4px 10px; border-radius: 4px;
    border: 1px solid var(--color-border);
    background: transparent; color: var(--color-text-secondary);
    font-size: 11px; cursor: pointer; transition: all 0.12s; font-weight: 500;
  }

  .type-btn:hover, .layer-btn:hover {
    border-color: var(--color-surface-5); color: var(--color-text-primary);
  }

  .type-btn.active {
    background: var(--color-accent-muted);
    border-color: var(--color-accent); color: var(--color-accent);
  }

  .layer-btn.active.layer-core {
    background: rgba(100,116,139,0.2); border-color: var(--color-layer-core); color: var(--color-layer-core);
  }

  .layer-btn.active.layer-semantic {
    background: rgba(139,92,246,0.15); border-color: var(--color-layer-semantic); color: var(--color-layer-semantic);
  }

  .layer-btn.active.layer-component {
    background: rgba(6,182,212,0.15); border-color: var(--color-layer-component); color: var(--color-layer-component);
  }

  .color-preview-inline {
    display: flex; align-items: center; gap: 8px; margin-top: 4px;
  }

  .color-dot {
    width: 16px; height: 16px; border-radius: 4px;
    flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1);
  }

  .color-dot + span {
    font-family: var(--font-mono); font-size: 11px; color: var(--color-text-secondary);
  }

  /* Series preview */
  .series-preview {
    background: var(--color-surface-3);
    border-radius: 6px; padding: 10px;
    max-height: 240px; overflow-y: auto;
  }

  .color-scale-preview {
    display: flex; gap: 2px; margin-bottom: 8px;
    border-radius: 6px; overflow: hidden;
  }

  .color-scale-chip {
    flex: 1; height: 36px;
    display: flex; align-items: flex-end; justify-content: center;
    padding-bottom: 3px;
    transition: transform 0.12s;
  }

  .color-scale-chip:hover { transform: scaleY(1.15); }

  .chip-label {
    font-size: 8px; font-family: var(--font-mono);
    color: white; background: rgba(0,0,0,0.5);
    padding: 1px 4px; border-radius: 2px;
  }

  .series-list-preview {
    display: flex; flex-direction: column; gap: 2px;
  }

  .series-preview-row {
    display: flex; align-items: center; gap: 10px;
    padding: 3px 6px; border-radius: 3px;
  }

  .series-preview-row:hover { background: var(--color-surface-4); }

  .series-preview-name {
    font-size: 11px; font-family: var(--font-mono);
    color: var(--color-text-primary); font-weight: 600;
    flex: 1;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .series-preview-value {
    font-size: 11px; font-family: var(--font-mono);
    color: var(--color-text-secondary);
  }

  .series-preview-more {
    font-size: 10px; color: var(--color-text-tertiary);
    text-align: center; padding: 4px;
  }

  .modal-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 16px 20px; border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .btn-primary {
    background: var(--color-accent); color: white; border: none;
    border-radius: 6px; cursor: pointer; font-size: 13px;
    padding: 7px 18px; transition: all 0.15s; font-weight: 600;
  }

  .btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    background: transparent; color: var(--color-text-secondary);
    border: 1px solid var(--color-border); border-radius: 6px;
    cursor: pointer; font-size: 13px; padding: 7px 18px; transition: all 0.15s;
  }

  .btn-ghost:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
</style>
