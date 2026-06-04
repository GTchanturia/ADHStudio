<script>
  import { appState, applyTheme } from '$lib/stores/platform.svelte.js';

  let { projectName = 'Design Tokens' } = $props();
  let themeSwitcherOpen = $state(false);

  const tokenTypes = ['all', 'color', 'typography', 'spacing', 'border', 'shadow'];
  const tokenLayers = ['all', 'core', 'semantic', 'component'];
</script>

<header class="topbar">
  <div class="topbar-left">
    <div class="app-logo">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="1" y="1" width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.9"/>
        <rect x="12" y="1" width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.6"/>
        <rect x="1" y="12" width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.6"/>
        <rect x="12" y="12" width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.3"/>
      </svg>
    </div>
    <div class="project-info">
      <span class="project-name">{projectName}</span>
      <span class="breadcrumb-sep">/</span>
      <span class="project-subtitle">Token Studio</span>
    </div>
    {#if appState.isLoading}
      <div class="loading-indicator">
        <div class="loading-dot"></div>
        <span>Loading...</span>
      </div>
    {/if}
  </div>

  <div class="topbar-center">
    <div class="search-container">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.3"/>
        <path d="m9.5 9.5 2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      <input
        type="text"
        placeholder="Search tokens... (name, value)"
        bind:value={appState.searchQuery}
        class="search-input"
      />
      {#if appState.searchQuery}
        <button class="clear-search" onclick={() => appState.searchQuery = ''}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      {/if}
    </div>

    <div class="filter-group">
      <select bind:value={appState.filterType} class="filter-select">
        {#each tokenTypes as type}
          <option value={type}>{type === 'all' ? 'All types' : type}</option>
        {/each}
      </select>
      <select bind:value={appState.filterLayer} class="filter-select">
        {#each tokenLayers as layer}
          <option value={layer}>{layer === 'all' ? 'All layers' : layer}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="topbar-right">
    <!-- Theme Switcher -->
    <div class="theme-switcher-container">
      <button
        class="theme-btn"
        onclick={() => themeSwitcherOpen = !themeSwitcherOpen}
        class:active={themeSwitcherOpen}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/>
          <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity="0.5"/>
          <circle cx="7" cy="7" r="2.5" fill="currentColor" opacity="0.4"/>
        </svg>
        <span>Theme</span>
        {#if appState.activeThemeId}
          <span class="theme-active-badge">{appState.themes.find(t => t.id === appState.activeThemeId)?.name ?? ''}</span>
        {/if}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="chevron" class:rotated={themeSwitcherOpen}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      {#if themeSwitcherOpen}
        <div class="theme-dropdown animate-fade-in">
          <div class="theme-dropdown-header">Theme Presets</div>
          {#if appState.themes.length === 0}
            <div class="theme-empty">No themes configured</div>
          {:else}
            {#each appState.themes as theme}
              <button
                class="theme-option"
                class:selected={appState.activeThemeId === theme.id}
                onclick={() => { applyTheme(theme.id); themeSwitcherOpen = false; }}
              >
                <span class="theme-option-check">
                  {#if appState.activeThemeId === theme.id}✓{/if}
                </span>
                <span>{theme.name}</span>
                <span class="theme-set-count">{theme.token_set_ids?.length ?? 0} sets</span>
              </button>
            {/each}
          {/if}
          <div class="theme-dropdown-divider"></div>
          <div class="theme-active-sets-label">Active Sets</div>
          {#each appState.tokenSets as set}
            <div class="theme-set-row">
              <span class="set-dot" class:active={appState.activeSetIds.includes(set.id)}></span>
              <span class="theme-set-name">{set.name}</span>
              <span class="theme-set-token-count">{set.tokens?.length ?? 0}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Export button -->
    <button
      class="topbar-action-btn"
      onclick={() => appState.exportPanelOpen = !appState.exportPanelOpen}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      Export
    </button>

    <!-- Inspector toggle -->
    <button
      class="topbar-action-btn"
      class:active={appState.inspectorOpen}
      onclick={() => appState.inspectorOpen = !appState.inspectorOpen}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.2"/>
        <path d="M9 1v12" stroke="currentColor" stroke-width="1.2"/>
        <path d="M3 4h4M3 7h4M3 10h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      Inspector
    </button>
  </div>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    height: 48px;
    background: var(--color-surface-1);
    border-bottom: 1px solid var(--color-border);
    padding: 0 12px;
    gap: 8px;
    flex-shrink: 0;
    position: relative;
    z-index: 100;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .app-logo {
    display: flex;
    align-items: center;
  }

  .project-info {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .project-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .breadcrumb-sep {
    color: var(--color-text-tertiary);
    font-size: 14px;
  }

  .project-subtitle {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--color-text-tertiary);
    padding: 2px 8px;
    background: var(--color-surface-3);
    border-radius: 12px;
  }

  .loading-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
    animation: pulse-slow 1.5s ease-in-out infinite;
  }

  .topbar-center {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 640px;
  }

  .search-container {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 9px;
    color: var(--color-text-tertiary);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 6px 30px 6px 30px;
    font-size: 12px;
    color: var(--color-text-primary);
    outline: none;
    transition: border-color 0.15s;
  }

  .search-input::placeholder { color: var(--color-text-tertiary); }
  .search-input:focus {
    border-color: var(--color-accent);
    background: var(--color-surface-3);
  }

  .clear-search {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
  }

  .clear-search:hover { color: var(--color-text-primary); }

  .filter-group {
    display: flex;
    gap: 4px;
  }

  .filter-select {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 5px 8px;
    font-size: 11px;
    color: var(--color-text-secondary);
    outline: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  .filter-select:hover, .filter-select:focus {
    border-color: var(--color-accent);
    color: var(--color-text-primary);
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    margin-left: auto;
  }

  .theme-switcher-container {
    position: relative;
  }

  .theme-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .theme-btn:hover, .theme-btn.active {
    background: var(--color-surface-3);
    border-color: var(--color-accent);
    color: var(--color-text-primary);
  }

  .theme-active-badge {
    background: var(--color-accent-muted);
    color: var(--color-accent);
    padding: 1px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
  }

  .chevron {
    transition: transform 0.2s;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  .theme-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    width: 260px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    z-index: 200;
    overflow: hidden;
  }

  .theme-dropdown-header, .theme-active-sets-label {
    padding: 8px 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-tertiary);
  }

  .theme-empty {
    padding: 8px 12px;
    font-size: 12px;
    color: var(--color-text-tertiary);
    font-style: italic;
  }

  .theme-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.12s;
    text-align: left;
  }

  .theme-option:hover { background: var(--color-surface-3); }
  .theme-option.selected { background: var(--color-accent-muted); }

  .theme-option-check {
    width: 14px;
    color: var(--color-accent);
    font-size: 11px;
  }

  .theme-set-count {
    margin-left: auto;
    font-size: 10px;
    color: var(--color-text-tertiary);
  }

  .theme-dropdown-divider {
    height: 1px;
    background: var(--color-border);
    margin: 4px 0;
  }

  .theme-set-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
  }

  .set-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-surface-5);
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .set-dot.active { background: var(--color-success); }

  .theme-set-name {
    flex: 1;
    font-size: 11px;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .theme-set-token-count {
    font-size: 10px;
    color: var(--color-text-tertiary);
  }

  .topbar-action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .topbar-action-btn:hover {
    background: var(--color-surface-3);
    color: var(--color-text-primary);
  }

  .topbar-action-btn.active {
    background: var(--color-accent-muted);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
