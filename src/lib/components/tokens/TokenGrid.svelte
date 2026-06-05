<script>
  import { onMount } from 'svelte';
  import { appState } from '$lib/stores/platform.svelte.js';
  import TokenCard from './TokenCard.svelte';
  import AddTokenModal from './AddTokenModal.svelte';

  let { tokens, tokenMap } = $props();

  let containerEl = $state(null);
  let containerHeight = $state(600);
  let scrollTop = $state(0);
  let addModalOpen = $state(false);

  const ROW_HEIGHT = 37;
  const HEADER_H = 36;
  const OVERSCAN_PX = 600;

  // Group tokens by type
  const grouped = $derived.by(() => {
    const types = ['color', 'typography', 'spacing', 'border', 'shadow', 'other'];
    return types.map(type => ({
      type,
      items: tokens.filter(t => (type === 'other' ? !types.slice(0, -1).includes(t.type) : t.type === type))
    })).filter(g => g.items.length > 0);
  });

  // Flat list of virtual items
  const flatItems = $derived.by(() => {
    const result = [];
    for (const group of grouped) {
      result.push({ kind: 'header', type: group.type, label: group.type.charAt(0).toUpperCase() + group.type.slice(1), count: group.items.length });
      for (const token of group.items) {
        result.push({ kind: 'token', token });
      }
    }
    return result;
  });

  // Y-position for each flat item
  const itemPositions = $derived.by(() => {
    const positions = [];
    let y = 0;
    for (const item of flatItems) {
      const h = item.kind === 'header' ? HEADER_H : ROW_HEIGHT;
      positions.push({ y, h });
      y += h;
    }
    return positions;
  });

  const totalHeight = $derived(
    itemPositions.length > 0
      ? itemPositions[itemPositions.length - 1].y + itemPositions[itemPositions.length - 1].h
      : 0
  );

  // Visible items based on current scrollTop
  const visibleItems = $derived.by(() => {
    const viewStart = scrollTop - OVERSCAN_PX;
    const viewEnd = scrollTop + containerHeight + OVERSCAN_PX;
    return flatItems
      .map((item, i) => ({ ...item, index: i, top: itemPositions[i]?.y ?? 0 }))
      .filter(item => {
        const pos = itemPositions[item.index];
        if (!pos) return false;
        return pos.y + pos.h > viewStart && pos.y < viewEnd;
      });
  });

  onMount(() => {
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        containerHeight = e.contentRect.height;
      }
    });
    if (containerEl) ro.observe(containerEl);
    return () => ro.disconnect();
  });

  function handleScroll() {
    if (containerEl) scrollTop = containerEl.scrollTop;
  }

  const typeIcons = {
    color: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/></svg>`,
    typography: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2.5h8M6 2.5v7M4 9.5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    spacing: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M2 4v4M10 4v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    border: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.4"/></svg>`,
    shadow: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor" opacity="0.25"/><rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1"/></svg>`,
    other: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="1.2" fill="currentColor"/><circle cx="2.5" cy="6" r="1.2" fill="currentColor"/><circle cx="9.5" cy="6" r="1.2" fill="currentColor"/></svg>`
  };
</script>

<div
  class="token-grid-container"
  bind:this={containerEl}
  onscroll={handleScroll}
>
  {#if tokens.length === 0}
    <div class="empty-grid">
      <div class="empty-grid-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="4" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
          <rect x="26" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
          <rect x="4" y="26" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
          <rect x="26" y="26" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>
          <path d="M24 16v16M16 24h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        </svg>
      </div>
      <h3>No tokens yet</h3>
      <p>
        {#if appState.activeSetIds.length === 0}
          Activate a token set in the sidebar, or create a new set.
        {:else}
          Add your first token to get started.
        {/if}
      </p>
      <button class="btn-primary" onclick={() => addModalOpen = true}>Add Token</button>
    </div>
  {:else}
    <!-- Column headers -->
    <div class="column-headers">
      <span class="col-header col-swatch"></span>
      <span class="col-header col-name">Name</span>
      <span class="col-header col-value">Value</span>
      <span class="col-header col-badge">Layer</span>
      <span class="col-header col-badge">Type</span>
      <span class="col-header col-actions"></span>
    </div>

    <div class="virtual-scroller" style:height="{totalHeight}px">
      {#each visibleItems as item (item.index)}
        <div class="virtual-item" style:top="{item.top}px" style:height="{item.kind === 'header' ? HEADER_H : ROW_HEIGHT}px">
          {#if item.kind === 'header'}
            <div class="type-group-header">
              <div class="type-header-icon type-{item.type}">
                {@html typeIcons[item.type] ?? typeIcons.other}
              </div>
              <span class="type-header-label">{item.label}</span>
              <span class="type-header-count">{item.count}</span>
            </div>
          {:else if item.kind === 'token'}
            <TokenCard token={item.token} {tokenMap} />
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <button class="add-token-fab" onclick={() => addModalOpen = true} title="Add token (Ctrl+N)">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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
    display: flex;
    flex-direction: column;
  }

  .column-headers {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px 0 12px;
    height: 32px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-1);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .col-header {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-tertiary);
  }

  .col-swatch { width: 24px; flex-shrink: 0; }
  .col-name { flex: 1; min-width: 0; }
  .col-value { min-width: 100px; max-width: 180px; }
  .col-badge { width: 70px; text-align: center; }
  .col-actions { width: 72px; }

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
    gap: 6px;
    padding: 0 12px;
    height: 100%;
    background: var(--color-surface-1);
    border-bottom: 1px solid var(--color-border);
  }

  .type-header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  .type-header-icon.type-color { color: var(--color-token-color); background: rgba(248,113,113,0.12); }
  .type-header-icon.type-typography { color: var(--color-token-typography); background: rgba(167,139,250,0.12); }
  .type-header-icon.type-spacing { color: var(--color-token-spacing); background: rgba(52,211,153,0.12); }
  .type-header-icon.type-border { color: var(--color-token-border); background: rgba(251,191,36,0.12); }
  .type-header-icon.type-shadow { color: var(--color-token-shadow); background: rgba(96,165,250,0.12); }
  .type-header-icon.type-other { color: var(--color-token-other); background: rgba(148,163,184,0.12); }

  .type-header-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .type-header-count {
    font-size: 10px;
    color: var(--color-text-tertiary);
    background: var(--color-surface-3);
    padding: 1px 6px;
    border-radius: 8px;
    font-weight: 600;
  }

  .empty-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 12px;
    color: var(--color-text-tertiary);
    text-align: center;
    padding: 48px 24px;
  }

  .empty-grid-icon { opacity: 0.3; }

  .empty-grid h3 {
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .empty-grid p {
    font-size: 12px;
    margin: 0;
    max-width: 260px;
    line-height: 1.5;
  }

  .add-token-fab {
    position: fixed;
    bottom: 36px;
    right: 24px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-accent);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(59,130,246,0.4);
    transition: all 0.2s;
    z-index: 50;
  }

  .add-token-fab:hover {
    background: var(--color-accent-hover);
    transform: scale(1.08);
    box-shadow: 0 6px 28px rgba(59,130,246,0.5);
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    padding: 7px 18px;
    transition: all 0.15s;
    font-weight: 600;
  }

  .btn-primary:hover { background: var(--color-accent-hover); }
</style>
