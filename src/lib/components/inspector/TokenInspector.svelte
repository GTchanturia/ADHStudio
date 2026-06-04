<script>
  import { appState, updateToken, selectToken } from '$lib/stores/platform.svelte.js';
  import { resolveToken, getAliasPath, isAlias } from '$lib/utils/aliases.js';
  import { checkWcag, toLch, applyModifier } from '$lib/utils/color.js';
  import { toCssVariables, toTailwindConfig, toSwift, toAndroidXml, toW3cJson } from '$lib/utils/export.js';

  let { token, tokenMap } = $props();

  let editing = $state(false);
  let editName = $state('');
  let editValue = $state('');
  let editDescription = $state('');
  let editType = $state('color');
  let editLayer = $state('core');
  let saving = $state(false);
  let activeExportTab = $state('css');

  // Alias chain
  const resolved = $derived(resolveToken(token?.name ?? '', tokenMap));
  const displayValue = $derived(resolved.value ?? token?.value?.value ?? token?.value ?? '');
  const aliasChain = $derived(resolved.chain ?? []);

  // WCAG check for color tokens
  const wcag = $derived(() => {
    if (token?.type !== 'color') return null;
    if (typeof displayValue !== 'string' || !displayValue.startsWith('#')) return null;
    return {
      onWhite: checkWcag(displayValue, '#ffffff'),
      onBlack: checkWcag(displayValue, '#000000')
    };
  });

  // LCH values
  const lchValues = $derived(() => {
    if (token?.type !== 'color') return null;
    if (typeof displayValue !== 'string') return null;
    return toLch(displayValue);
  });

  $effect(() => {
    if (token) {
      editName = token.name;
      editValue = token.value?.value ?? token.value ?? '';
      editDescription = token.description ?? '';
      editType = token.type;
      editLayer = token.layer;
      editing = false;
    }
  });

  async function handleSave() {
    if (!token) return;
    saving = true;
    try {
      await updateToken(token.id, {
        name: editName,
        value: { value: editValue },
        description: editDescription,
        type: editType,
        layer: editLayer
      });
      editing = false;
    } finally {
      saving = false;
    }
  }

  // Export previews
  const exportPreviews = $derived(() => {
    if (!appState.project) return {};
    return {
      css: toCssVariables(appState.tokenSets, appState.activeSetIds),
      tailwind: toTailwindConfig(appState.tokenSets, appState.activeSetIds),
      swift: toSwift(appState.tokenSets, appState.activeSetIds),
      android: toAndroidXml(appState.tokenSets, appState.activeSetIds),
      w3c: toW3cJson(appState.tokenSets, appState.activeSetIds)
    };
  });

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  const isExportMode = $derived(appState.exportPanelOpen);
</script>

<aside class="inspector" class:slide-in={!!token || isExportMode}>
  {#if isExportMode}
    <!-- Export Panel Mode -->
    <div class="inspector-header">
      <span class="inspector-title">Export</span>
      <button class="inspector-close" onclick={() => appState.exportPanelOpen = false}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="export-tabs">
      {#each ['css', 'tailwind', 'swift', 'android', 'w3c'] as tab}
        <button
          class="export-tab"
          class:active={activeExportTab === tab}
          onclick={() => activeExportTab = tab}
        >{tab.toUpperCase()}</button>
      {/each}
    </div>

    <div class="export-content">
      <div class="export-actions">
        <button class="copy-btn" onclick={() => copyToClipboard(exportPreviews()[activeExportTab] ?? '')}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/>
            <path d="M8 4V2a1 1 0 00-1-1H2a1 1 0 00-1 1v5a1 1 0 001 1h2" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          Copy
        </button>
      </div>
      <pre class="export-code">{exportPreviews()[activeExportTab] ?? ''}</pre>
    </div>
  {:else if token}
    <!-- Token Inspector Mode -->
    <div class="inspector-header">
      <span class="inspector-title">Inspector</span>
      <div class="inspector-header-actions">
        {#if !editing}
          <button class="icon-btn" onclick={() => editing = true} title="Edit">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2l2 2-6 6H2V8l6-6z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
            </svg>
          </button>
        {/if}
        <button class="inspector-close" onclick={() => selectToken(null)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="inspector-body">
      {#if editing}
        <!-- Edit Form -->
        <div class="edit-form animate-fade-in">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input mono" bind:value={editName} />
          </div>
          <div class="form-group">
            <label class="form-label">Value</label>
            <input class="form-input mono" bind:value={editValue} />
          </div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" bind:value={editType}>
              {#each ['color','typography','spacing','border','shadow','other'] as t}
                <option value={t}>{t}</option>
              {/each}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Layer</label>
            <select class="form-select" bind:value={editLayer}>
              {#each ['core','semantic','component'] as l}
                <option value={l}>{l}</option>
              {/each}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input class="form-input" bind:value={editDescription} />
          </div>
          <div class="edit-actions">
            <button class="btn-ghost btn-sm" onclick={() => editing = false}>Cancel</button>
            <button class="btn-primary btn-sm" onclick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      {:else}
        <!-- Token Details -->
        <!-- Color preview -->
        {#if token.type === 'color' && typeof displayValue === 'string' && displayValue.startsWith('#')}
          <div class="color-large-preview" style:background={displayValue}>
            <div class="color-hex-badge">{displayValue}</div>
          </div>
        {/if}

        <div class="inspector-section">
          <div class="detail-row">
            <span class="detail-label">Name</span>
            <span class="detail-value mono">{token.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Raw value</span>
            <span class="detail-value mono">{token.value?.value ?? token.value}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Resolved</span>
            <span class="detail-value mono">{displayValue}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Type</span>
            <span class="token-badge type-{token.type}">{token.type}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Layer</span>
            <span class="token-badge layer-{token.layer}">{token.layer}</span>
          </div>
          {#if token.description}
            <div class="detail-row">
              <span class="detail-label">Description</span>
              <span class="detail-value">{token.description}</span>
            </div>
          {/if}
        </div>

        <!-- Alias Chain -->
        {#if aliasChain.length > 1}
          <div class="inspector-section">
            <div class="section-title">Alias Chain</div>
            <div class="alias-chain">
              {#each aliasChain as step, i}
                <div class="alias-step">
                  <div class="alias-step-content">
                    {#if step.token?.type === 'color' && typeof (step.token.value?.value ?? step.token.value) === 'string'}
                      {@const v = step.token.value?.value ?? step.token.value}
                      {#if v.startsWith('#')}
                        <div class="alias-swatch" style:background={v}></div>
                      {/if}
                    {/if}
                    <div>
                      <div class="alias-step-name">{step.name}</div>
                      <div class="alias-step-value">{step.token?.value?.value ?? step.token?.value ?? ''}</div>
                    </div>
                  </div>
                  {#if i < aliasChain.length - 1}
                    <div class="alias-arrow">→</div>
                  {/if}
                </div>
              {/each}
            </div>
            {#if resolved.error}
              <div class="alias-error">{resolved.error}</div>
            {/if}
          </div>
        {/if}

        <!-- LCH Values -->
        {#if lchValues()}
          <div class="inspector-section">
            <div class="section-title">LCH Color Space</div>
            <div class="lch-grid">
              <div class="lch-value">
                <span class="lch-label">L</span>
                <div class="lch-bar">
                  <div class="lch-bar-fill" style:width="{lchValues().l}%" style:background="var(--color-text-secondary)"></div>
                </div>
                <span class="lch-num">{Math.round(lchValues().l)}</span>
              </div>
              <div class="lch-value">
                <span class="lch-label">C</span>
                <div class="lch-bar">
                  <div class="lch-bar-fill" style:width="{Math.min(lchValues().c / 150 * 100, 100)}%" style:background="var(--color-token-color)"></div>
                </div>
                <span class="lch-num">{Math.round(lchValues().c)}</span>
              </div>
              <div class="lch-value">
                <span class="lch-label">H</span>
                <div class="lch-bar">
                  <div class="lch-bar-fill" style:width="{(lchValues().h ?? 0) / 360 * 100}%" style:background="var(--color-token-typography)"></div>
                </div>
                <span class="lch-num">{Math.round(lchValues().h ?? 0)}°</span>
              </div>
            </div>
          </div>
        {/if}

        <!-- WCAG Accessibility -->
        {#if wcag()}
          <div class="inspector-section">
            <div class="section-title">Accessibility</div>
            <div class="wcag-grid">
              <div class="wcag-row">
                <div class="wcag-preview" style:background={displayValue} style:color="white">Aa</div>
                <div class="wcag-info">
                  <span class="wcag-label">On White</span>
                  <span class="wcag-ratio">{wcag().onWhite.ratio}:1</span>
                  <div class="wcag-badges">
                    <span class="wcag-badge" class:pass={wcag().onWhite.aa}>AA</span>
                    <span class="wcag-badge" class:pass={wcag().onWhite.aaa}>AAA</span>
                  </div>
                </div>
              </div>
              <div class="wcag-row">
                <div class="wcag-preview" style:background={displayValue} style:color="black">Aa</div>
                <div class="wcag-info">
                  <span class="wcag-label">On Black</span>
                  <span class="wcag-ratio">{wcag().onBlack.ratio}:1</span>
                  <div class="wcag-badges">
                    <span class="wcag-badge" class:pass={wcag().onBlack.aa}>AA</span>
                    <span class="wcag-badge" class:pass={wcag().onBlack.aaa}>AAA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- CSS snippet -->
        <div class="inspector-section">
          <div class="section-title">CSS Variable</div>
          <div class="code-snippet">
            <code>--{token.name}: {displayValue};</code>
            <button class="snippet-copy" onclick={() => copyToClipboard(`--${token.name}: ${displayValue};`)}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" stroke="currentColor" stroke-width="1.1"/>
                <path d="M7.5 3.5V2a1 1 0 00-1-1H1.5a1 1 0 00-1 1v5a1 1 0 001 1H3" stroke="currentColor" stroke-width="1.1"/>
              </svg>
            </button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="inspector-empty">
      <div class="inspector-empty-icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="6" stroke="currentColor" stroke-width="1.5"/>
          <path d="M28 4v32" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
          <path d="M8 14h14M8 20h10M8 26h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p>Select a token to inspect</p>
    </div>
  {/if}
</aside>

<style>
  .inspector {
    width: 280px;
    min-width: 260px;
    background: var(--color-surface-1);
    border-left: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .inspector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 12px 8px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .inspector-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .inspector-header-actions {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .inspector-close, .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: all 0.15s;
  }

  .inspector-close:hover, .icon-btn:hover {
    background: var(--color-surface-3);
    color: var(--color-text-primary);
  }

  .inspector-body {
    flex: 1;
    overflow-y: auto;
  }

  .inspector-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--color-text-tertiary);
    padding: 24px;
    text-align: center;
  }

  .inspector-empty-icon { opacity: 0.3; }

  .inspector-empty p {
    font-size: 12px;
    margin: 0;
  }

  .color-large-preview {
    height: 80px;
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: 8px;
    flex-shrink: 0;
  }

  .color-hex-badge {
    font-size: 11px;
    font-family: var(--font-mono);
    color: white;
    background: rgba(0,0,0,0.4);
    padding: 2px 8px;
    border-radius: 4px;
    backdrop-filter: blur(4px);
  }

  .inspector-section {
    padding: 12px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .section-title {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
  }

  .detail-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 4px 0;
    font-size: 12px;
  }

  .detail-label {
    width: 72px;
    flex-shrink: 0;
    color: var(--color-text-tertiary);
    font-size: 11px;
  }

  .detail-value {
    color: var(--color-text-primary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .detail-value.mono { font-family: var(--font-mono); font-size: 11px; }

  .mono { font-family: var(--font-mono); font-size: 11px; }

  .token-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
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

  .alias-chain {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .alias-step {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .alias-step-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: var(--color-surface-3);
    border-radius: 6px;
    font-size: 11px;
  }

  .alias-swatch {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .alias-step-name {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-primary);
    font-weight: 600;
  }

  .alias-step-value {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-tertiary);
  }

  .alias-arrow {
    text-align: center;
    color: var(--color-text-tertiary);
    font-size: 14px;
    padding: 2px 8px;
  }

  .alias-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 11px;
    color: var(--color-error);
    margin-top: 6px;
  }

  .lch-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lch-value {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lch-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-tertiary);
    width: 12px;
    flex-shrink: 0;
  }

  .lch-bar {
    flex: 1;
    height: 4px;
    background: var(--color-surface-4);
    border-radius: 2px;
    overflow: hidden;
  }

  .lch-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s;
    opacity: 0.8;
  }

  .lch-num {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    width: 32px;
    text-align: right;
    flex-shrink: 0;
  }

  .wcag-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .wcag-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .wcag-preview {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.08);
  }

  .wcag-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .wcag-label {
    font-size: 11px;
    color: var(--color-text-secondary);
    flex: 1;
  }

  .wcag-ratio {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
    font-weight: 600;
  }

  .wcag-badges {
    display: flex;
    gap: 3px;
  }

  .wcag-badge {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid var(--color-border);
    color: var(--color-text-tertiary);
    background: transparent;
  }

  .wcag-badge.pass {
    background: rgba(34,197,94,0.15);
    border-color: var(--color-success);
    color: var(--color-success);
  }

  .code-snippet {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--color-surface-3);
    border-radius: 6px;
    padding: 8px 10px;
  }

  .code-snippet code {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-primary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .snippet-copy {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s;
  }

  .snippet-copy:hover {
    background: var(--color-surface-5);
    color: var(--color-text-primary);
  }

  /* Edit form */
  .edit-form {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .form-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .form-input, .form-select {
    background: var(--color-surface-3);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 12px;
    color: var(--color-text-primary);
    outline: none;
    transition: border-color 0.15s;
  }

  .form-input:focus, .form-select:focus { border-color: var(--color-accent); }

  .edit-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
    padding-top: 4px;
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    padding: 6px 14px;
    transition: all 0.15s;
    font-weight: 600;
  }

  .btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    padding: 6px 14px;
    transition: all 0.15s;
  }

  .btn-ghost:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
  .btn-sm { padding: 4px 10px; font-size: 11px; }

  /* Export panel */
  .export-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
    overflow-x: auto;
  }

  .export-tab {
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .export-tab:hover { color: var(--color-text-secondary); }
  .export-tab.active {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
  }

  .export-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .export-actions {
    display: flex;
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background: var(--color-surface-3);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text-secondary);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .copy-btn:hover {
    background: var(--color-surface-4);
    color: var(--color-text-primary);
  }

  .export-code {
    flex: 1;
    overflow: auto;
    padding: 12px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-secondary);
    white-space: pre;
    background: transparent;
    margin: 0;
    line-height: 1.6;
  }
</style>
