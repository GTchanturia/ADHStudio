<script>
  import { appState, notify } from '$lib/stores/platform.svelte.js';
  import { checkWcag } from '$lib/utils/color.js';
  import { resolveToken } from '$lib/utils/aliases.js';

  let { tokenMap } = $props();

  let aiPanel = $state('naming'); // 'naming' | 'audit' | 'mapping'
  let hexInput = $state('');
  let namingSuggestions = $state([]);
  let auditResults = $state([]);
  let isAnalyzing = $state(false);

  // Semantic naming patterns based on color properties
  function suggestName(hex) {
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return [];

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 510;
    const s = max === min ? 0 : (max - min) / (l < 0.5 ? max + min : 510 - max - min);
    const hue = max === min ? 0 : max === r
      ? ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / (max - min) + 2) / 6
        : ((r - g) / (max - min) + 4) / 6;

    const h = hue * 360;
    const brightness = l;

    const hueNames = [
      { range: [0, 15], name: 'red' },
      { range: [15, 45], name: 'orange' },
      { range: [45, 70], name: 'yellow' },
      { range: [70, 150], name: 'green' },
      { range: [150, 195], name: 'teal' },
      { range: [195, 240], name: 'cyan' },
      { range: [240, 270], name: 'blue' },
      { range: [270, 300], name: 'violet' },
      { range: [300, 345], name: 'pink' },
      { range: [345, 360], name: 'red' }
    ];

    const hueName = s < 0.15
      ? (brightness < 0.2 ? 'neutral' : brightness > 0.8 ? 'white' : 'gray')
      : (hueNames.find(h2 => h >= h2.range[0] && h < h2.range[1])?.name ?? 'blue');

    const shade = Math.round((1 - brightness) * 9) * 100 + 100;

    return [
      { name: `color-${hueName}-${Math.min(shade, 900)}`, confidence: 0.9, label: 'Palette token' },
      { name: `color-${hueName}-${Math.min(shade, 900)}-base`, confidence: 0.75, label: 'Base variant' },
      brightness < 0.4
        ? { name: `color-${hueName}-dark`, confidence: 0.7, label: 'Dark variant' }
        : { name: `color-${hueName}-light`, confidence: 0.7, label: 'Light variant' },
      { name: s < 0.15 ? `color-neutral-${Math.min(shade, 900)}` : `color-brand-${hueName}`, confidence: 0.65, label: 'Semantic name' }
    ];
  }

  function runAccessibilityAudit() {
    isAnalyzing = true;
    const results = [];

    // Get all color tokens from active sets
    const colorTokens = appState.tokenSets
      .filter(s => appState.activeSetIds.includes(s.id))
      .flatMap(s => s.tokens ?? [])
      .filter(t => t.type === 'color');

    // Check color pairs
    for (let i = 0; i < colorTokens.length; i++) {
      for (let j = i + 1; j < colorTokens.length; j++) {
        const a = colorTokens[i];
        const b = colorTokens[j];
        const av = resolveToken(a.name, tokenMap).value;
        const bv = resolveToken(b.name, tokenMap).value;

        if (!av || !bv || !av.startsWith('#') || !bv.startsWith('#')) continue;

        const wcag = checkWcag(av, bv);
        if (!wcag.aaLarge) {
          results.push({ token1: a.name, color1: av, token2: b.name, color2: bv, ratio: wcag.ratio, aa: wcag.aa, aaLarge: wcag.aaLarge });
        }
      }
    }

    auditResults = results.sort((a, b) => a.ratio - b.ratio).slice(0, 20);
    isAnalyzing = false;
    notify(`Audit complete: ${results.length} potential issues found`, results.length > 0 ? 'warning' : 'success');
  }

  $effect(() => {
    if (hexInput.length === 7) {
      namingSuggestions = suggestName(hexInput);
    } else {
      namingSuggestions = [];
    }
  });
</script>

<div class="ai-panel">
  <div class="ai-header">
    <div class="ai-icon">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      </svg>
    </div>
    <span class="ai-title">AI Design Ops</span>
  </div>

  <div class="ai-tabs">
    <button class="ai-tab" class:active={aiPanel === 'naming'} onclick={() => aiPanel = 'naming'}>Auto-Name</button>
    <button class="ai-tab" class:active={aiPanel === 'audit'} onclick={() => aiPanel = 'audit'}>Accessibility</button>
    <button class="ai-tab" class:active={aiPanel === 'mapping'} onclick={() => aiPanel = 'mapping'}>Mapping</button>
  </div>

  <div class="ai-content">
    {#if aiPanel === 'naming'}
      <div class="ai-section">
        <p class="ai-description">Enter a hex color to get semantic naming suggestions based on your token system's conventions.</p>
        <div class="hex-input-row">
          {#if hexInput.length === 7}
            <div class="hex-preview" style:background={hexInput}></div>
          {/if}
          <input
            type="text"
            bind:value={hexInput}
            placeholder="#0055FF"
            class="form-input mono"
            maxlength="7"
          />
        </div>

        {#if namingSuggestions.length > 0}
          <div class="suggestions animate-fade-in">
            {#each namingSuggestions as s}
              <div class="suggestion-row">
                <div class="suggestion-info">
                  <span class="suggestion-name">{s.name}</span>
                  <span class="suggestion-label">{s.label}</span>
                </div>
                <div class="suggestion-confidence">
                  <div class="confidence-bar">
                    <div class="confidence-fill" style:width="{s.confidence * 100}%"></div>
                  </div>
                  <span class="confidence-pct">{Math.round(s.confidence * 100)}%</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else if aiPanel === 'audit'}
      <div class="ai-section">
        <p class="ai-description">Scan all color tokens for WCAG contrast violations between pairs.</p>
        <button class="btn-primary btn-sm" onclick={runAccessibilityAudit} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Run Accessibility Audit'}
        </button>

        {#if auditResults.length > 0}
          <div class="audit-results animate-fade-in">
            <div class="audit-summary">
              Found {auditResults.length} potential contrast issues
            </div>
            {#each auditResults as r}
              <div class="audit-row">
                <div class="audit-swatches">
                  <div class="audit-swatch" style:background={r.color1}></div>
                  <div class="audit-swatch" style:background={r.color2}></div>
                </div>
                <div class="audit-info">
                  <div class="audit-names">
                    <span>{r.token1}</span>
                    <span class="audit-divider">vs</span>
                    <span>{r.token2}</span>
                  </div>
                  <div class="audit-ratio">
                    <span class="ratio-value">{r.ratio}:1</span>
                    <span class="ratio-status" class:fail={!r.aaLarge}>
                      {r.aaLarge ? (r.aa ? 'AA ✓' : 'AA Large ✓') : 'Fails AA'}
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else if auditResults.length === 0 && !isAnalyzing}
          <div class="audit-clean">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="var(--color-success)" stroke-width="1.5"/>
              <path d="M10 16l4 4 8-8" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>Run audit to check accessibility</p>
          </div>
        {/if}
      </div>
    {:else if aiPanel === 'mapping'}
      <div class="ai-section">
        <p class="ai-description">Smart suggestions for mapping semantic tokens to your core primitives.</p>
        <div class="mapping-suggestions">
          {#each appState.tokenSets.filter(s => appState.activeSetIds.includes(s.id)).flatMap(s => s.tokens ?? []).filter(t => t.layer === 'semantic').slice(0, 8) as token}
            {@const raw = token.value?.value ?? token.value}
            {@const isAliased = typeof raw === 'string' && raw.startsWith('{')}
            <div class="mapping-row">
              <span class="mapping-name">{token.name}</span>
              {#if isAliased}
                <span class="mapping-alias">{raw}</span>
                <span class="mapping-status ok">✓ Mapped</span>
              {:else}
                <span class="mapping-status unmapped">Unmapped</span>
              {/if}
            </div>
          {/each}
          {#if appState.tokenSets.flatMap(s => s.tokens ?? []).filter(t => t.layer === 'semantic').length === 0}
            <p class="empty-text">No semantic tokens found. Add tokens with layer = "semantic" to see mapping suggestions.</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .ai-panel {
    background: var(--color-surface-2);
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .ai-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px 6px;
  }

  .ai-icon {
    color: var(--color-warning);
    display: flex;
  }

  .ai-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .ai-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
  }

  .ai-tab {
    flex: 1;
    padding: 6px;
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .ai-tab:hover { color: var(--color-text-secondary); }
  .ai-tab.active {
    color: var(--color-warning);
    border-bottom-color: var(--color-warning);
  }

  .ai-content {
    overflow-y: auto;
    max-height: 240px;
  }

  .ai-section {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ai-description {
    font-size: 11px;
    color: var(--color-text-tertiary);
    margin: 0;
    line-height: 1.4;
  }

  .hex-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hex-preview {
    width: 28px;
    height: 28px;
    border-radius: 5px;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .form-input {
    flex: 1;
    background: var(--color-surface-3);
    border: 1px solid var(--color-border);
    border-radius: 5px;
    padding: 6px 8px;
    font-size: 12px;
    color: var(--color-text-primary);
    outline: none;
  }

  .form-input:focus { border-color: var(--color-accent); }
  .mono { font-family: var(--font-mono); }

  .suggestions {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .suggestion-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: var(--color-surface-3);
    border-radius: 5px;
  }

  .suggestion-info {
    flex: 1;
    min-width: 0;
  }

  .suggestion-name {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-primary);
    font-weight: 600;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .suggestion-label {
    font-size: 10px;
    color: var(--color-text-tertiary);
  }

  .suggestion-confidence {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .confidence-bar {
    width: 48px;
    height: 3px;
    background: var(--color-surface-5);
    border-radius: 2px;
    overflow: hidden;
  }

  .confidence-fill {
    height: 100%;
    background: var(--color-success);
    border-radius: 2px;
  }

  .confidence-pct {
    font-size: 10px;
    color: var(--color-text-tertiary);
    font-family: var(--font-mono);
    width: 28px;
    text-align: right;
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
    align-self: flex-start;
  }

  .btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-sm { padding: 5px 12px; font-size: 11px; }

  .audit-results {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .audit-summary {
    font-size: 11px;
    color: var(--color-warning);
    font-weight: 600;
    padding: 4px 0;
  }

  .audit-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 8px;
    background: rgba(239,68,68,0.06);
    border: 1px solid rgba(239,68,68,0.15);
    border-radius: 5px;
  }

  .audit-swatches {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  .audit-swatch {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .audit-info { flex: 1; min-width: 0; }

  .audit-names {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .audit-divider { color: var(--color-text-tertiary); }

  .audit-ratio {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }

  .ratio-value {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .ratio-status {
    font-size: 10px;
    font-weight: 600;
    color: var(--color-success);
  }

  .ratio-status.fail { color: var(--color-error); }

  .audit-clean {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
    color: var(--color-text-tertiary);
  }

  .audit-clean p { font-size: 11px; margin: 0; }

  .mapping-suggestions {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .mapping-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    background: var(--color-surface-3);
    border-radius: 4px;
  }

  .mapping-name {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-primary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mapping-alias {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-accent);
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mapping-status {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .mapping-status.ok {
    background: rgba(34,197,94,0.15);
    color: var(--color-success);
  }

  .mapping-status.unmapped {
    background: rgba(245,158,11,0.15);
    color: var(--color-warning);
  }

  .empty-text {
    font-size: 11px;
    color: var(--color-text-tertiary);
    margin: 0;
    font-style: italic;
  }
</style>
