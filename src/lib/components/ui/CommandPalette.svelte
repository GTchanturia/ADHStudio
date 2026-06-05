<script>
  import { appState, commandPaletteActions, filteredTokens, selectToken, clearFilters } from '$lib/stores/platform.svelte.js';
  import { onMount } from 'svelte';

  let { onclose, onaction } = $props();

  let query = $state('');
  let selectedIndex = $state(0);
  let listEl = $state(null);

  const allItems = $derived.by(() => {
    const commands = commandPaletteActions.map(a => ({
      kind: 'command',
      id: a.id,
      label: a.label,
      category: a.category,
      icon: a.icon,
      action: a.action
    }));

    const tokens = filteredTokens().slice(0, 20).map(t => ({
      kind: 'token',
      id: `token-${t.id}`,
      label: t.name,
      category: `Token • ${t.type}`,
      icon: 'token',
      tokenId: t.id
    }));

    return [...commands, ...tokens];
  });

  const filtered = $derived.by(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase().split(/\s+/).filter(Boolean);
    return allItems.filter(item =>
      q.every(w => item.label.toLowerCase().includes(w) || item.category.toLowerCase().includes(w))
    );
  });

  const grouped = $derived.by(() => {
    const groups = new Map();
    for (const item of filtered) {
      const cat = item.category;
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(item);
    }
    return [...groups.entries()];
  });

  $effect(() => {
    selectedIndex = 0;
  });

  function executeItem(item) {
    if (item.kind === 'command') {
      item.action();
      onaction?.(item.id);
    } else if (item.kind === 'token') {
      selectToken(item.tokenId);
    }
    onclose();
  }

  function navigateUp() {
    selectedIndex = Math.max(0, selectedIndex - 1);
    scrollToSelected();
  }

  function navigateDown() {
    selectedIndex = Math.min(filtered.length - 1, selectedIndex + 1);
    scrollToSelected();
  }

  function scrollToSelected() {
    requestAnimationFrame(() => {
      const el = listEl?.querySelector(`[data-index="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  function handleKeydown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); navigateDown(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); navigateUp(); }
    else if (e.key === 'Enter' && filtered[selectedIndex]) { executeItem(filtered[selectedIndex]); }
    else if (e.key === 'Escape') { onclose(); }
  }

  const iconSvgs = {
    plus: '<path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    upload: '<path d="M6 9V1M3 4l3-3 3 3M1 9v2a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>',
    download: '<path d="M6 1v8M3 6l3 3 3-3M1 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>',
    panel: '<rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M7 1v10" stroke="currentColor" stroke-width="1.2"/>',
    eye: '<path d="M1 6a5 5 0 0110 0 5 5 0 01-10 0z" stroke="currentColor" stroke-width="1.2"/><circle cx="6" cy="6" r="2" fill="currentColor" opacity="0.4"/>',
    filter: '<path d="M1 1h10M3 5h6M5 9h2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    palette: '<circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.3"/><circle cx="4" cy="4.5" r="0.8" fill="currentColor"/><circle cx="8" cy="4.5" r="0.8" fill="currentColor"/><circle cx="6" cy="8" r="0.8" fill="currentColor"/>',
    folder: '<path d="M1 3.5a1 1 0 011-1h2.5l1 1H10a1 1 0 011 1V9a1 1 0 01-1 1H2a1 1 0 01-1-1V3.5z" stroke="currentColor" stroke-width="1.2" fill="none"/>',
    gear: '<circle cx="6" cy="6" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.5 2.5l1 1M8.5 8.5l1 1M2.5 9.5l1-1M8.5 3.5l1-1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
    keyboard: '<rect x="1" y="3" width="10" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M3 5h1M5 5h1M7 5h1M4 7h4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
    guide: '<circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M6 4v4M6 9.5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    sparkle: '<path d="M6 1l1 4 4 1-4 1-1 4-1-4-4-1 4-1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" fill="none"/>',
    fullscreen: '<path d="M1 4V1h3M7 1h3v3M11 7v3H8M4 11H1V8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
    token: '<rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.2"/>',
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="palette-backdrop" onclick={e => { if (e.target === e.currentTarget) onclose(); }}>
  <div class="palette animate-fade-in">
    <div class="palette-input-row">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="palette-search-icon">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.4"/>
        <path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
      <input
        type="text"
        bind:value={query}
        class="palette-input"
        placeholder="Type a command or search tokens..."
        autofocus
      />
      <kbd class="palette-esc">Esc</kbd>
    </div>

    <div class="palette-list" bind:this={listEl}>
      {#if filtered.length === 0}
        <div class="palette-empty">No results for "{query}"</div>
      {:else}
        {#each grouped as [category, items]}
          <div class="palette-group">
            <div class="palette-group-label">{category}</div>
            {#each items as item}
              {@const idx = filtered.indexOf(item)}
              <button
                class="palette-item"
                class:selected={idx === selectedIndex}
                data-index={idx}
                onclick={() => executeItem(item)}
                onmouseenter={() => selectedIndex = idx}
              >
                <div class="palette-item-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    {@html iconSvgs[item.icon] ?? iconSvgs.token}
                  </svg>
                </div>
                <span class="palette-item-label">{item.label}</span>
                {#if item.kind === 'command'}
                  <span class="palette-item-hint">↵</span>
                {/if}
              </button>
            {/each}
          </div>
        {/each}
      {/if}
    </div>

    <div class="palette-footer">
      <span class="palette-footer-hint"><kbd>↑↓</kbd> navigate</span>
      <span class="palette-footer-hint"><kbd>↵</kbd> select</span>
      <span class="palette-footer-hint"><kbd>Esc</kbd> close</span>
    </div>
  </div>
</div>

<style>
  .palette-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 15vh; z-index: 2000; backdrop-filter: blur(6px);
  }

  .palette {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 12px; width: 560px; max-width: 95vw;
    box-shadow: 0 24px 80px rgba(0,0,0,0.7);
    display: flex; flex-direction: column;
    max-height: 60vh; overflow: hidden;
  }

  .palette-input-row {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 16px; border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .palette-search-icon { color: var(--color-text-tertiary); flex-shrink: 0; }

  .palette-input {
    flex: 1; background: transparent; border: none;
    font-size: 14px; color: var(--color-text-primary);
    outline: none; padding: 0;
  }

  .palette-input::placeholder { color: var(--color-text-tertiary); }

  .palette-esc {
    font-size: 10px; font-family: var(--font-mono); font-weight: 600;
    color: var(--color-text-tertiary); background: var(--color-surface-4);
    padding: 2px 7px; border-radius: 4px; border: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .palette-list {
    flex: 1; overflow-y: auto; padding: 6px 0;
  }

  .palette-empty {
    padding: 24px; text-align: center;
    font-size: 13px; color: var(--color-text-tertiary);
  }

  .palette-group {
    margin-bottom: 4px;
  }

  .palette-group-label {
    padding: 6px 16px 3px;
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--color-text-tertiary);
  }

  .palette-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 8px 16px;
    background: transparent; border: none;
    color: var(--color-text-primary); font-size: 13px;
    cursor: pointer; text-align: left; transition: background 0.08s;
  }

  .palette-item:hover { background: var(--color-surface-3); }
  .palette-item.selected { background: var(--color-accent-muted); }

  .palette-item-icon {
    display: flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 5px;
    background: var(--color-surface-4); color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .palette-item.selected .palette-item-icon { color: var(--color-accent); }

  .palette-item-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .palette-item-hint {
    font-size: 10px; color: var(--color-text-tertiary);
    font-family: var(--font-mono); flex-shrink: 0;
  }

  .palette-footer {
    display: flex; gap: 16px; padding: 10px 16px;
    border-top: 1px solid var(--color-border); flex-shrink: 0;
  }

  .palette-footer-hint {
    font-size: 10px; color: var(--color-text-tertiary);
    display: flex; align-items: center; gap: 4px;
  }

  .palette-footer-hint kbd {
    font-size: 9px; font-family: var(--font-mono); font-weight: 600;
    background: var(--color-surface-4); border: 1px solid var(--color-border);
    padding: 0 4px; border-radius: 3px; color: var(--color-text-secondary);
  }
</style>
