<script>
  import { appState, updateSettings, updateShortcut, resetSettings, notify } from '$lib/stores/platform.svelte.js';

  let { onclose } = $props();

  let activeTab = $state('general');
  let editingShortcut = $state(null);
  let capturedKeys = $state('');

  const tabs = [
    { id: 'general', label: 'General', icon: '<circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/><circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.4"/>' },
    { id: 'display', label: 'Display', icon: '<rect x="1" y="1" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M3 11h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '<rect x="1" y="3" width="10" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M3 5h1M5 5h1M7 5h1M4 7h4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>' },
    { id: 'tokens', label: 'Tokens', icon: '<rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.2"/>' },
    { id: 'export', label: 'Export', icon: '<path d="M6 1v8M3 6l3 3 3-3M1 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'about', label: 'About', icon: '<circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M6 4v3M6 8.5v.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' },
  ];

  const shortcutEntries = [
    { key: 'search', label: 'Search / Command Palette', description: 'Open the global search and command palette' },
    { key: 'addToken', label: 'Add New Token', description: 'Open the add token dialog' },
    { key: 'export', label: 'Toggle Export Panel', description: 'Show or hide the export panel' },
    { key: 'inspector', label: 'Toggle Inspector', description: 'Show or hide the inspector panel' },
    { key: 'preview', label: 'Live Preview', description: 'Open the live preview window' },
    { key: 'settings', label: 'Open Settings', description: 'Open this settings panel' },
    { key: 'clearFilters', label: 'Clear All Filters', description: 'Reset type and layer filters' },
    { key: 'duplicate', label: 'Duplicate Token', description: 'Duplicate the selected token' },
    { key: 'delete', label: 'Delete Token', description: 'Delete the selected token' },
    { key: 'undo', label: 'Undo', description: 'Undo last action (coming soon)' },
  ];

  function startCapture(shortcutKey) {
    editingShortcut = shortcutKey;
    capturedKeys = '';
  }

  function handleShortcutKeydown(e) {
    if (!editingShortcut) return;
    e.preventDefault();
    e.stopPropagation();

    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    const key = e.key;
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      parts.push(key.length === 1 ? key.toUpperCase() : key);
    }

    const combo = parts.join('+');
    if (combo && !['Ctrl', 'Shift', 'Alt'].includes(combo)) {
      updateShortcut(editingShortcut, combo);
      editingShortcut = null;
      notify('Shortcut updated');
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onclose();
  }

  const accentColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Violet', value: '#8b5cf6' },
  ];
</script>

<svelte:window onkeydown={handleShortcutKeydown} />

<div class="settings-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true">
  <div class="settings-panel animate-fade-in">
    <div class="settings-sidebar">
      <div class="settings-sidebar-title">Settings</div>
      {#each tabs as tab}
        <button
          class="settings-tab"
          class:active={activeTab === tab.id}
          onclick={() => activeTab = tab.id}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="settings-tab-icon">
            {@html tab.icon}
          </svg>
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="settings-content">
      <div class="settings-header">
        <h2 class="settings-title">{tabs.find(t => t.id === activeTab)?.label}</h2>
        <button class="settings-close" onclick={onclose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="settings-body">
        {#if activeTab === 'general'}
          <div class="setting-group">
            <div class="setting-label">Accent Color</div>
            <div class="setting-desc">Choose the primary accent color for the interface.</div>
            <div class="color-picker-row">
              {#each accentColors as c}
                <button
                  class="color-picker-btn"
                  class:active={appState.settings.accentColor === c.value}
                  style:background={c.value}
                  onclick={() => updateSettings({ accentColor: c.value })}
                  title={c.name}
                ></button>
              {/each}
            </div>
          </div>

          <div class="setting-group">
            <div class="setting-label">Confirm Before Deleting</div>
            <div class="setting-desc">Show a confirmation dialog before deleting tokens, sets, or themes.</div>
            <label class="toggle">
              <input type="checkbox" checked={appState.settings.confirmDelete} onchange={e => updateSettings({ confirmDelete: e.target.checked })} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-group">
            <div class="setting-label">Default Token Type</div>
            <div class="setting-desc">Pre-selected type when creating a new token.</div>
            <select
              class="setting-select"
              value={appState.settings.defaultTokenType}
              onchange={e => updateSettings({ defaultTokenType: e.target.value })}
            >
              {#each ['color', 'typography', 'spacing', 'border', 'shadow', 'other'] as t}
                <option value={t}>{t}</option>
              {/each}
            </select>
          </div>

          <div class="setting-group">
            <div class="setting-label">Default Layer</div>
            <div class="setting-desc">Pre-selected layer when creating a new token.</div>
            <select
              class="setting-select"
              value={appState.settings.defaultLayer}
              onchange={e => updateSettings({ defaultLayer: e.target.value })}
            >
              {#each ['core', 'semantic', 'component'] as l}
                <option value={l}>{l}</option>
              {/each}
            </select>
          </div>

          <div class="setting-group">
            <div class="setting-label">WCAG Compliance Level</div>
            <div class="setting-desc">Minimum contrast ratio standard for accessibility audits.</div>
            <select
              class="setting-select"
              value={appState.settings.wcagLevel}
              onchange={e => updateSettings({ wcagLevel: e.target.value })}
            >
              <option value="aa">AA (4.5:1)</option>
              <option value="aaa">AAA (7:1)</option>
            </select>
          </div>

          <div class="setting-group">
            <div class="setting-label">Color Notation</div>
            <div class="setting-desc">Preferred format for displaying color values.</div>
            <select
              class="setting-select"
              value={appState.settings.colorNotation}
              onchange={e => updateSettings({ colorNotation: e.target.value })}
            >
              <option value="hex">HEX (#0055FF)</option>
              <option value="rgb">RGB (rgb(0, 85, 255))</option>
              <option value="hsl">HSL (hsl(220, 100%, 50%))</option>
            </select>
          </div>

        {:else if activeTab === 'display'}
          <div class="setting-group">
            <div class="setting-label">Card Size</div>
            <div class="setting-desc">Token card density in the grid view.</div>
            <div class="seg-control">
              {#each [{ v: 'small', l: 'Compact' }, { v: 'medium', l: 'Default' }, { v: 'large', l: 'Large' }] as opt}
                <button
                  class="seg-btn"
                  class:active={appState.settings.cardSize === opt.v}
                  onclick={() => updateSettings({ cardSize: opt.v })}
                >{opt.l}</button>
              {/each}
            </div>
          </div>

          <div class="setting-group">
            <div class="setting-label">Show Type Badges</div>
            <div class="setting-desc">Display the token type badge (color, spacing, etc.) on cards.</div>
            <label class="toggle">
              <input type="checkbox" checked={appState.settings.showTypeBadges} onchange={e => updateSettings({ showTypeBadges: e.target.checked })} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-group">
            <div class="setting-label">Show Layer Badges</div>
            <div class="setting-desc">Display the layer badge (core, semantic, component) on cards.</div>
            <label class="toggle">
              <input type="checkbox" checked={appState.settings.showLayerBadges} onchange={e => updateSettings({ showLayerBadges: e.target.checked })} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-group">
            <div class="setting-label">Show Descriptions</div>
            <div class="setting-desc">Show the description indicator on token cards.</div>
            <label class="toggle">
              <input type="checkbox" checked={appState.settings.showDescriptions} onchange={e => updateSettings({ showDescriptions: e.target.checked })} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-group">
            <div class="setting-label">Sidebar Width</div>
            <div class="setting-desc">Width of the Set Manager sidebar in pixels.</div>
            <input
              type="range" min="180" max="360" step="10"
              value={appState.settings.sidebarWidth}
              oninput={e => updateSettings({ sidebarWidth: parseInt(e.target.value) })}
              class="setting-range"
            />
            <span class="range-value">{appState.settings.sidebarWidth}px</span>
          </div>

        {:else if activeTab === 'shortcuts'}
          <div class="shortcuts-intro">
            Click any shortcut to remap it. Press your desired key combination, then release.
          </div>

          <div class="shortcut-list">
            {#each shortcutEntries as entry}
              <div class="shortcut-setting-row">
                <div class="shortcut-setting-info">
                  <span class="shortcut-setting-name">{entry.label}</span>
                  <span class="shortcut-setting-desc">{entry.description}</span>
                </div>
                {#if editingShortcut === entry.key}
                  <button class="shortcut-capture-btn active" onclick={() => editingShortcut = null}>
                    Press keys...
                  </button>
                {:else}
                  <button class="shortcut-capture-btn" onclick={() => startCapture(entry.key)}>
                    <kbd>{appState.settings.shortcuts[entry.key]}</kbd>
                  </button>
                {/if}
              </div>
            {/each}
          </div>

          <div class="setting-group" style="margin-top: 20px;">
            <button class="btn-ghost" onclick={() => { resetSettings(); notify('Shortcuts reset'); }}>
              Reset All Shortcuts
            </button>
          </div>

        {:else if activeTab === 'tokens'}
          <div class="setting-group">
            <div class="setting-label">Naming Convention</div>
            <div class="setting-desc">Token names use dash-syntax (e.g., color-primary-500). Set folders use slash-notation (e.g., Brand/Light).</div>
            <div class="naming-guide">
              <div class="naming-row">
                <span class="naming-label">Token names</span>
                <code class="naming-example">color-primary-500</code>
                <span class="naming-hint">Use dashes (-) between words</span>
              </div>
              <div class="naming-row">
                <span class="naming-label">Set folders</span>
                <code class="naming-example">Brand/Light</code>
                <span class="naming-hint">Use slashes (/) for hierarchy</span>
                )
              </div>
              <div class="naming-row">
                <span class="naming-label">Aliases</span>
                <code class="naming-example">{"{color-primary}"}</code>
                <span class="naming-hint">Curly brackets for references</span>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <div class="setting-label">Three-Layer Model</div>
            <div class="setting-desc">Tokens are organized in three layers of abstraction.</div>
            <div class="layer-guide">
              <div class="layer-guide-row">
                <span class="token-badge layer-core">Core</span>
                <span class="layer-guide-text">Raw values — #0055FF, 16px, 8px</span>
              </div>
              <div class="layer-guide-row">
                <span class="token-badge layer-semantic">Semantic</span>
                <span class="layer-guide-text">Named aliases — {"{color-blue-500}"}</span>
              </div>
              <div class="layer-guide-row">
                <span class="token-badge layer-component">Component</span>
                <span class="layer-guide-text">UI mappings — {"{color-primary}"} → button-bg</span>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <div class="setting-label">LCH Color Modifiers</div>
            <div class="setting-desc">Dynamic tokens can modify base colors in LCH space for perceptual uniformity.</div>
            <div class="modifier-list">
              <code>lighten(0.2)</code> — increase lightness by 20%
              <code>darken(0.15)</code> — decrease lightness by 15%
              <code>mix(#000000, 0.3)</code> — blend with another color
            </div>
          </div>

        {:else if activeTab === 'export'}
          <div class="setting-group">
            <div class="setting-label">Default Export Format</div>
            <div class="setting-desc">Pre-selected format when opening the export panel.</div>
            <select
              class="setting-select"
              value={appState.settings.exportFormat}
              onchange={e => updateSettings({ exportFormat: e.target.value })}
            >
              <option value="css">CSS Variables</option>
              <option value="tailwind">Tailwind Config</option>
              <option value="swift">Swift / iOS</option>
              <option value="android">Android XML</option>
              <option value="w3c">W3C JSON</option>
            </select>
          </div>

          <div class="setting-group">
            <div class="setting-label">Available Export Formats</div>
            <div class="setting-desc">Token Studio supports the following output targets.</div>
            <div class="export-format-list">
              {#each [
                { id: 'css', name: 'CSS Custom Properties', desc: ':root scoped CSS variables for web', ext: '.css' },
                { id: 'tailwind', name: 'Tailwind CSS Config', desc: 'JavaScript object for Tailwind extension', ext: '.js' },
                { id: 'swift', name: 'Swift / iOS', desc: 'UIColor extensions for iOS apps', ext: '.swift' },
                { id: 'android', name: 'Android XML', desc: 'Color resources for Android projects', ext: '.xml' },
                { id: 'w3c', name: 'W3C Design Tokens', desc: 'Community Group draft standard JSON', ext: '.json' },
              ] as fmt}
                <div class="export-fmt-row">
                  <span class="export-fmt-name">{fmt.name}</span>
                  <span class="export-fmt-desc">{fmt.desc}</span>
                  <span class="export-fmt-ext">{fmt.ext}</span>
                </div>
              {/each}
            </div>
          </div>

          <div class="setting-group">
            <div class="setting-label">W3C Compliance</div>
            <div class="setting-desc">Export outputs follow the W3C Design Token Community Group draft specification. Tokens use $value, $type, and $description properties.</div>
          </div>

        {:else if activeTab === 'about'}
          <div class="about-content">
            <div class="about-logo">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="4" fill="var(--color-accent)" opacity="0.9"/>
                <rect x="26" y="2" width="20" height="20" rx="4" fill="var(--color-accent)" opacity="0.6"/>
                <rect x="2" y="26" width="20" height="20" rx="4" fill="var(--color-accent)" opacity="0.6"/>
                <rect x="26" y="26" width="20" height="20" rx="4" fill="var(--color-accent)" opacity="0.3"/>
              </svg>
            </div>
            <h3 class="about-name">Token Studio</h3>
            <span class="about-version">Version 1.0.0</span>
            <p class="about-desc">
              A professional design token management platform. The single source of truth for your design decisions across Figma and codebases.
            </p>

            <div class="about-features">
              {#each [
                'Three-layer token model (Core, Semantic, Component)',
                'Alias resolution with circular reference detection',
                'LCH color space math for WCAG compliance',
                '5 export targets (CSS, Tailwind, Swift, Android, W3C)',
                'AI-powered naming, accessibility audit, and smart mapping',
                'Virtualized grid for 30,000+ token performance',
                'Supabase-backed persistence with real-time sync',
              ] as feature}
                <div class="about-feature">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="var(--color-success)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {feature}
                </div>
              {/each}
            </div>

            <div class="about-actions">
              <button class="btn-ghost" onclick={() => { appState.settings.onboardingDone = false; appState.onboardingOpen = true; onclose(); }}>
                Restart Onboarding Guide
              </button>
              <button class="btn-ghost" onclick={resetSettings}>
                Reset All Settings
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .settings-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 1500; backdrop-filter: blur(4px);
  }

  .settings-panel {
    display: flex;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    width: 720px; max-width: 95vw;
    height: 560px; max-height: 85vh;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    overflow: hidden;
  }

  .settings-sidebar {
    width: 160px; flex-shrink: 0;
    border-right: 1px solid var(--color-border);
    padding: 16px 0;
    display: flex; flex-direction: column;
  }

  .settings-sidebar-title {
    font-size: 11px; font-weight: 700;
    color: var(--color-text-tertiary);
    text-transform: uppercase; letter-spacing: 0.08em;
    padding: 0 14px; margin-bottom: 10px;
  }

  .settings-tab {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px; width: 100%;
    background: transparent; border: none;
    color: var(--color-text-secondary); font-size: 12px;
    font-weight: 500; cursor: pointer;
    text-align: left; transition: all 0.12s;
    border-left: 2px solid transparent;
  }

  .settings-tab:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

  .settings-tab.active {
    background: var(--color-accent-muted);
    color: var(--color-accent);
    border-left-color: var(--color-accent);
    font-weight: 600;
  }

  .settings-tab-icon { display: flex; align-items: center; color: inherit; }

  .settings-content {
    flex: 1; display: flex; flex-direction: column;
    min-width: 0;
  }

  .settings-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .settings-title {
    font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0;
  }

  .settings-close {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px;
    background: transparent; border: none;
    color: var(--color-text-tertiary); cursor: pointer; transition: all 0.15s;
  }

  .settings-close:hover { background: var(--color-surface-4); color: var(--color-text-primary); }

  .settings-body {
    flex: 1; overflow-y: auto; padding: 20px;
  }

  .setting-group {
    margin-bottom: 20px;
    display: flex; flex-direction: column; gap: 8px;
  }

  .setting-label {
    font-size: 12px; font-weight: 600;
    color: var(--color-text-primary);
  }

  .setting-desc {
    font-size: 11px; color: var(--color-text-tertiary); line-height: 1.4; margin: 0;
  }

  .color-picker-row { display: flex; gap: 6px; }

  .color-picker-btn {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid transparent; cursor: pointer;
    transition: all 0.15s;
  }

  .color-picker-btn:hover { transform: scale(1.15); }
  .color-picker-btn.active { border-color: white; box-shadow: 0 0 0 2px var(--color-accent); }

  .toggle {
    position: relative; display: inline-block;
    width: 36px; height: 20px;
  }

  .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }

  .toggle-slider {
    position: absolute; inset: 0;
    background: var(--color-surface-4);
    border-radius: 10px; cursor: pointer;
    transition: background 0.2s;
  }

  .toggle-slider::before {
    content: ''; position: absolute;
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--color-text-secondary);
    left: 3px; top: 3px;
    transition: transform 0.2s;
  }

  .toggle input:checked + .toggle-slider { background: var(--color-accent); }
  .toggle input:checked + .toggle-slider::before { transform: translateX(16px); background: white; }

  .setting-select {
    background: var(--color-surface-3); border: 1px solid var(--color-border);
    border-radius: 6px; padding: 6px 10px; font-size: 12px;
    color: var(--color-text-primary); outline: none;
    width: fit-content; min-width: 140px;
  }

  .setting-select:focus { border-color: var(--color-accent); }

  .seg-control { display: flex; gap: 2px; }

  .seg-btn {
    padding: 5px 14px; border: 1px solid var(--color-border);
    background: transparent; color: var(--color-text-secondary);
    font-size: 11px; font-weight: 500; cursor: pointer;
    transition: all 0.12s;
  }

  .seg-btn:first-child { border-radius: 4px 0 0 4px; }
  .seg-btn:last-child { border-radius: 0 4px 4px 0; }

  .seg-btn:hover { background: var(--color-surface-3); }
  .seg-btn.active { background: var(--color-accent-muted); border-color: var(--color-accent); color: var(--color-accent); font-weight: 600; }

  .setting-range {
    width: 200px; accent-color: var(--color-accent);
  }

  .range-value {
    font-size: 11px; font-family: var(--font-mono);
    color: var(--color-text-secondary);
  }

  /* Shortcuts tab */
  .shortcuts-intro {
    font-size: 11px; color: var(--color-text-tertiary);
    padding: 8px 12px; background: var(--color-surface-3);
    border-radius: 6px; margin-bottom: 12px; line-height: 1.4;
  }

  .shortcut-list { display: flex; flex-direction: column; gap: 4px; }

  .shortcut-setting-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; background: var(--color-surface-2);
    border-radius: 6px;
  }

  .shortcut-setting-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }

  .shortcut-setting-name { font-size: 12px; font-weight: 600; color: var(--color-text-primary); }
  .shortcut-setting-desc { font-size: 10px; color: var(--color-text-tertiary); }

  .shortcut-capture-btn {
    padding: 4px 12px; background: var(--color-surface-4);
    border: 1px solid var(--color-border); border-radius: 4px;
    color: var(--color-text-secondary); font-size: 11px;
    cursor: pointer; transition: all 0.12s; flex-shrink: 0;
  }

  .shortcut-capture-btn:hover { border-color: var(--color-surface-5); color: var(--color-text-primary); }
  .shortcut-capture-btn.active { border-color: var(--color-accent); color: var(--color-accent); background: var(--color-accent-muted); }
  .shortcut-capture-btn kbd { font-family: var(--font-mono); font-size: 11px; font-weight: 600; }

  .btn-ghost {
    background: transparent; color: var(--color-text-secondary);
    border: 1px solid var(--color-border); border-radius: 6px;
    cursor: pointer; font-size: 12px; padding: 6px 14px; transition: all 0.15s;
  }

  .btn-ghost:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

  /* Tokens tab */
  .naming-guide {
    display: flex; flex-direction: column; gap: 6px;
    padding: 10px; background: var(--color-surface-3); border-radius: 6px;
  }

  .naming-row {
    display: flex; align-items: center; gap: 10px;
  }

  .naming-label { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); width: 80px; flex-shrink: 0; }
  .naming-example { font-size: 11px; font-family: var(--font-mono); color: var(--color-accent); }
  .naming-hint { font-size: 10px; color: var(--color-text-tertiary); }

  .layer-guide { display: flex; flex-direction: column; gap: 6px; }

  .layer-guide-row { display: flex; align-items: center; gap: 10px; }
  .layer-guide-text { font-size: 11px; color: var(--color-text-secondary); }

  .token-badge {
    display: inline-flex; align-items: center; padding: 2px 7px;
    border-radius: 3px; font-size: 9px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase; flex-shrink: 0;
  }

  .layer-core { color: var(--color-layer-core); background: rgba(100,116,139,0.15); }
  .layer-semantic { color: var(--color-layer-semantic); background: rgba(139,92,246,0.15); }
  .layer-component { color: var(--color-layer-component); background: rgba(6,182,212,0.15); }

  .modifier-list {
    display: flex; flex-direction: column; gap: 4px;
    padding: 8px; background: var(--color-surface-3); border-radius: 6px;
    font-size: 11px; color: var(--color-text-secondary);
  }

  .modifier-list code { font-family: var(--font-mono); color: var(--color-accent); font-size: 11px; }

  /* Export tab */
  .export-format-list { display: flex; flex-direction: column; gap: 5px; }

  .export-fmt-row {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 10px; background: var(--color-surface-2); border-radius: 5px;
  }

  .export-fmt-name { font-size: 12px; font-weight: 600; color: var(--color-text-primary); width: 150px; }
  .export-fmt-desc { font-size: 10px; color: var(--color-text-tertiary); flex: 1; }
  .export-fmt-ext { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-secondary); background: var(--color-surface-4); padding: 1px 6px; border-radius: 3px; }

  /* About tab */
  .about-content {
    display: flex; flex-direction: column;
    align-items: center; gap: 10px;
    padding: 24px 16px; text-align: center;
  }

  .about-logo { margin-bottom: 8px; }

  .about-name { font-size: 20px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
  .about-version { font-size: 12px; font-family: var(--font-mono); color: var(--color-text-tertiary); }
  .about-desc { font-size: 12px; color: var(--color-text-secondary); line-height: 1.5; max-width: 380px; margin: 8px 0; }

  .about-features {
    display: flex; flex-direction: column; gap: 5px;
    text-align: left; width: 100%; max-width: 380px;
    margin-top: 8px;
  }

  .about-feature {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; color: var(--color-text-secondary);
  }

  .about-actions { display: flex; gap: 8px; margin-top: 16px; }
</style>
