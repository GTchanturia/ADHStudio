<script>
  import { onMount } from 'svelte';
  import { appState, createToken, selectToken } from '$lib/stores/platform.svelte.js';
  import TokenCard from './TokenCard.svelte';
  import AddTokenModal from './AddTokenModal.svelte';

  let { tokens, tokenMap } = $props();

  let containerEl = $state(null);
  let containerWidth = $state(800);
  let addModalOpen = $state(false);

  // Virtualization state
  let scrollTop = $state(0);
  let containerHeight = $state(600);

  const CARD_WIDTH = 180;
  const CARD_HEIGHT = 140;
  const GAP = 10;
  const HEADER_H = 48;
  const OVERSCAN = 5;

  const cols = $derived(Math.max(1, Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP))));

  // Group tokens by type
  const grouped = $derived(() => {
    const types = ['color', 'typography', 'spacing', 'border', 'shadow', 'other'];
    return types.map(type => ({
      type,
      items: tokens.filter(t => (type === 'other' ? !types.slice(0, -1).includes(t.type) : t.type === type))
    })).filter(g => g.items.length > 0);
  });

  // Build a flat list of items (headers and cards) for virtualization
  const flatItems = $derived(() => {
    const result = [];
    for (const group of grouped()) {
      result.push({ kind: 'header', type: group.type, label: group.type.charAt(0).toUpperCase() + group.type.slice(1), count: group.items.length });
      const rows = Math.ceil(group.items.length / cols);
      for (let r = 0; r < rows; r++) {
        result.push({ kind: 'row', items: group.items.slice(r * cols, (r + 1) * cols) });
      }
    }
    return result;
  });

  // Calculate positions for each flat item
  const positions = $derived(() => {
    let y = 0;
    return flatItems().map(item => {
      const pos = { y, h: item.kind === 'header' ? HEADER_H : CARD_HEIGHT + GAP };
      y += pos.h;
      return pos;
    });
  });

  const totalHeight = $derived(positions().reduce((acc, p) => Math.max(acc, p.y + p.h), 0));

  // Visible range
  const visibleRange = $derived(() => {
    const items = flatItems();
    const pos = positions();
    let start = 0, end = items.length;
    for (let i = 0; i < pos.length; i++) {
      if (pos[i].y + pos[i].h < scrollTop - OVERSCAN * (CARD_HEIGHT + GAP)) start = i;
      if (pos[i].y > scrollTop + containerHeight + OVERSCAN * (CARD_HEIGHT + GAP)) { end = i; break; }
    }
    return { start, end };
  });

  const visibleItems = $derived(() => {
    const { start, end } = visibleRange();
    return flatItems().slice(start, end).map((item, i) => ({
      ...item,
      absIndex: start + i,
      top: positions()[start + i]?.y ?? 0
    }));
  });

  onMount(() => {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerWidth = entry.contentRect.width;
        containerHeight = entry.contentRect.height;
      }
    });
    if (containerEl) ro.observe(containerEl);
    return () => ro.disconnect();
  });

  const typeIcons = {
    color: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.3"/><circle cx="7" cy="5" r="1.5" fill="currentColor"/><circle cx="4" cy="9" r="1.5" fill="currentColor"/><circle cx="10" cy="9" r="1.5" fill="currentColor"/></svg>`,
    typography: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M7 3v8M4 11h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    spacing: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M2 4v6M12 4v6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    border: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>`,
    shadow: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.3"/><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/></svg>`,
    other: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="1.5" fill="currentColor"/><circle cx="2.5" cy="7" r="1.5" fill="currentColor"/><circle cx="11.5" cy="7" r="1.5" fill="currentColor"/></svg>`
  };
</script>

<div class="token-grid-container" bind:this={containerEl} onscroll={e => scrollTop = e.target.scrollTop}>
  {#if tokens.length === 0}
    <div class="empty-grid">
      <div class="empty-grid-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
          <rect x="36" y="4" width="24" height="24" rx="4" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
          <rect x="4" y="36" width="24" height="24" rx="4" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
          <rect x="36" y="36" width="24" height="24" rx="4" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>
          <path d="M32 20v24M20 32h24" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        </svg>
      </div>
      <h3>No tokens yet</h3>
      <p>Start building your design system by adding your first token</p>
      <button class="btn-primary" onclick={() => addModalOpen = true}>
        Add Token
      </button>
    </div>
  {:else}
    <div class="virtual-scroller" style:height="{totalHeight}px">
      {#each visibleItems() as item (item.absIndex)}
        <div
          class="virtual-item"
          style:top="{item.top}px"
        >
          {#if item.kind === 'header'}
            <div class="type-group-header">
              <div class="type-header-icon type-{item.type}">
                {@html typeIcons[item.type] ?? typeIcons.other}
              </div>
              <span class="type-header-label">{item.label}</span>
              <span class="type-header-count">{item.count}</span>
            </div>
          {:else if item.kind === 'row'}
            <div class="token-row" style:--cols={cols}>
              {#each item.items as token (token.id)}
                <TokenCard {token} {tokenMap} />
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Add token FAB -->
  <button class="add-token-fab" onclick={() => addModalOpen = true} title="Add token">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>
</div>

{#if addModalOpen}
  <AddTokenModal onclose={() => addModalOpen = false} />
{/if}

<style>
  .token-grid-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    padding: 12px;
  }

  .virtual-scroller {
    position: relative;
    width: 100%;
  }

  .virtual-item {
    position: absolute;
    left: 0;
    right: 0;
  }

  .type-group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 2px 8px;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 10px;
  }

  .type-header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
  }

  .type-header-icon.type-color { color: var(--color-token-color); background: rgba(248,113,113,0.12); }
  .type-header-icon.type-typography { color: var(--color-token-typography); background: rgba(167,139,250,0.12); }
  .type-header-icon.type-spacing { color: var(--color-token-spacing); background: rgba(52,211,153,0.12); }
  .type-header-icon.type-border { color: var(--color-token-border); background: rgba(251,191,36,0.12); }
  .type-header-icon.type-shadow { color: var(--color-token-shadow); background: rgba(96,165,250,0.12); }
  .type-header-icon.type-other { color: var(--color-token-other); background: rgba(148,163,184,0.12); }

  .type-header-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-primary);
    letter-spacing: -0.01em;
  }

  .type-header-count {
    font-size: 11px;
    color: var(--color-text-tertiary);
    background: var(--color-surface-3);
    padding: 1px 7px;
    border-radius: 10px;
    font-weight: 600;
  }

  .token-row {
    display: grid;
    grid-template-columns: repeat(var(--cols, 4), 1fr);
    gap: 10px;
  }

  .empty-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 400px;
    gap: 12px;
    color: var(--color-text-tertiary);
    text-align: center;
  }

  .empty-grid-icon { opacity: 0.3; }

  .empty-grid h3 {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .empty-grid p {
    font-size: 13px;
    margin: 0;
    max-width: 280px;
  }

  .add-token-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-accent);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 24px rgba(59,130,246,0.4);
    transition: all 0.2s;
    z-index: 50;
  }

  .add-token-fab:hover {
    background: var(--color-accent-hover);
    transform: scale(1.08);
    box-shadow: 0 6px 32px rgba(59,130,246,0.5);
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    padding: 8px 20px;
    transition: all 0.15s;
    font-weight: 600;
  }

  .btn-primary:hover { background: var(--color-accent-hover); }
</style>
