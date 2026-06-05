<script>
  import { appState, clearFilters, selectToken } from '$lib/stores/platform.svelte.js';

  let { onclose } = $props();

  const shortcuts = [
    { keys: ['Ctrl', 'K'], action: 'Search tokens' },
    { keys: ['Esc'], action: 'Close modal / Clear selection' },
    { keys: ['Ctrl', 'E'], action: 'Toggle export panel' },
    { keys: ['Ctrl', 'I'], action: 'Toggle inspector' },
    { keys: ['Ctrl', 'P'], action: 'Live preview' },
    { keys: ['/'], action: 'Focus search' },
    { keys: ['↑', '↓'], action: 'Navigate tokens' },
    { keys: ['Delete'], action: 'Delete selected token' },
  ];
</script>

<div class="shortcuts-overlay" onclick={e => { if (e.target === e.currentTarget) onclose(); }}>
  <div class="shortcuts-panel animate-fade-in">
    <div class="shortcuts-header">
      <span class="shortcuts-title">Keyboard Shortcuts</span>
      <button class="shortcuts-close" onclick={onclose}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="shortcuts-list">
      {#each shortcuts as s}
        <div class="shortcut-row">
          <div class="shortcut-keys">
            {#each s.keys as key, i}
              {#if i > 0}<span class="shortcut-plus">+</span>{/if}
              <kbd class="shortcut-key">{key}</kbd>
            {/each}
          </div>
          <span class="shortcut-action">{s.action}</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .shortcuts-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(4px);
  }

  .shortcuts-panel {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 12px; width: 400px; max-width: 95vw;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  }

  .shortcuts-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--color-border);
  }

  .shortcuts-title { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }

  .shortcuts-close {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px;
    background: transparent; border: none;
    color: var(--color-text-tertiary); cursor: pointer; transition: all 0.15s;
  }

  .shortcuts-close:hover { background: var(--color-surface-4); color: var(--color-text-primary); }

  .shortcuts-list { padding: 20px; display: flex; flex-direction: column; gap: 4px; }

  .shortcut-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 4px; gap: 12px;
  }

  .shortcut-keys { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

  .shortcut-key {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 26px; height: 24px; padding: 0 6px;
    background: var(--color-surface-3); border: 1px solid var(--color-border);
    border-radius: 4px; font-size: 11px; font-family: var(--font-mono);
    color: var(--color-text-primary); font-weight: 600;
  }

  .shortcut-plus {
    font-size: 10px; color: var(--color-text-tertiary);
  }

  .shortcut-action {
    font-size: 12px; color: var(--color-text-secondary); text-align: right;
  }
</style>
