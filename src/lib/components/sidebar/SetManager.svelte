<script>
  import { appState, createTokenSet, deleteTokenSet, toggleSetActive, selectToken } from '$lib/stores/platform.svelte.js';

  let { projectId } = $props();

  let newSetName = $state('');
  let addingSet = $state(false);
  let expandedFolders = $state(new Set());

  // Build folder tree from slash-notation names
  const folderTree = $derived(() => {
    const root = { children: {}, sets: [] };
    for (const set of appState.tokenSets) {
      const parts = set.name.split('/');
      if (parts.length === 1) {
        root.sets.push(set);
      } else {
        let node = root;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!node.children[part]) node.children[part] = { children: {}, sets: [] };
          node = node.children[part];
        }
        node.sets.push(set);
      }
    }
    return root;
  });

  async function handleAddSet() {
    if (!newSetName.trim() || !projectId) return;
    try {
      await createTokenSet(newSetName.trim(), projectId);
      newSetName = '';
      addingSet = false;
    } catch (e) {
      console.error(e);
    }
  }

  function toggleFolder(name) {
    if (expandedFolders.has(name)) {
      expandedFolders.delete(name);
    } else {
      expandedFolders.add(name);
    }
    expandedFolders = new Set(expandedFolders);
  }

  function tokenCount(set) {
    return set.tokens?.length ?? 0;
  }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <span class="sidebar-title">Token Sets</span>
    <button class="icon-btn" onclick={() => addingSet = !addingSet} title="New set">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  {#if addingSet}
    <div class="add-set-form animate-fade-in">
      <input
        type="text"
        placeholder="Brand/Light, Core/Typography..."
        bind:value={newSetName}
        onkeydown={e => e.key === 'Enter' && handleAddSet()}
        class="set-input"
        autofocus
      />
      <div class="add-set-actions">
        <button class="btn-primary btn-xs" onclick={handleAddSet}>Create</button>
        <button class="btn-ghost btn-xs" onclick={() => { addingSet = false; newSetName = ''; }}>Cancel</button>
      </div>
    </div>
  {/if}

  <div class="set-tree">
    {#if appState.tokenSets.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="8" width="24" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M4 13h24" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 6v4M22 6v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <p>No token sets yet</p>
        <button class="btn-primary btn-xs" onclick={() => addingSet = true}>Create your first set</button>
      </div>
    {:else}
      {#each Object.entries(folderTree().children) as [folderName, folder]}
        {@const fullPath = folderName}
        {@const isExpanded = expandedFolders.has(fullPath)}
        <div class="folder">
          <button class="folder-btn" onclick={() => toggleFolder(fullPath)}>
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              class="chevron" class:rotated={isExpanded}
            >
              <path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 4a1 1 0 011-1h3l1.5 2H12a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="currentColor" stroke-width="1.2" fill="none"/>
            </svg>
            <span class="folder-name">{folderName}</span>
            <span class="folder-count">{folder.sets.length}</span>
          </button>
          {#if isExpanded}
            <div class="folder-children animate-fade-in">
              {#each folder.sets as set}
                <SetItem {set} indent={1} />
              {/each}
            </div>
          {/if}
        </div>
      {/each}

      {#each folderTree().sets as set}
        <SetItem {set} indent={0} />
      {/each}
    {/if}
  </div>
</aside>

{#snippet SetItem(set, indent)}
  <div
    class="set-item"
    class:active={appState.selectedSetId === set.id}
    style:padding-left={`${8 + indent * 16}px`}
  >
    <label class="set-checkbox-label">
      <input
        type="checkbox"
        checked={appState.activeSetIds.includes(set.id)}
        onchange={() => toggleSetActive(set.id)}
        class="set-checkbox"
      />
    </label>
    <button
      class="set-name-btn"
      onclick={() => appState.selectedSetId = set.id}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
        <path d="M3.5 6h5M6 3.5v5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      <span class="set-name-text">{set.name.split('/').pop()}</span>
    </button>
    <span class="set-count">{tokenCount(set)}</span>
    {#if appState.activeSetIds.includes(set.id)}
      <span class="set-active-dot"></span>
    {/if}
  </div>
{/snippet}

<style>
  .sidebar {
    width: 240px;
    min-width: 200px;
    background: var(--color-surface-1);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 12px 8px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .sidebar-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
  }

  .icon-btn:hover {
    background: var(--color-surface-3);
    color: var(--color-text-primary);
  }

  .add-set-form {
    padding: 8px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-2);
  }

  .set-input {
    width: 100%;
    background: var(--color-surface-3);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 12px;
    color: var(--color-text-primary);
    outline: none;
    margin-bottom: 6px;
  }

  .set-input:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent-muted);
  }

  .add-set-actions {
    display: flex;
    gap: 4px;
  }

  .set-tree {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 16px;
    text-align: center;
    color: var(--color-text-tertiary);
  }

  .empty-icon {
    opacity: 0.4;
  }

  .empty-state p {
    font-size: 12px;
    margin: 0;
  }

  .folder {
    margin: 1px 0;
  }

  .folder-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    padding: 5px 8px;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.12s;
    text-align: left;
  }

  .folder-btn:hover {
    background: var(--color-surface-2);
    color: var(--color-text-primary);
  }

  .chevron {
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .chevron.rotated {
    transform: rotate(90deg);
  }

  .folder-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .folder-count {
    font-size: 10px;
    color: var(--color-text-tertiary);
    background: var(--color-surface-3);
    padding: 1px 5px;
    border-radius: 8px;
  }

  .folder-children {
    margin-left: 0;
  }

  .set-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    cursor: pointer;
    transition: background 0.12s;
    border-radius: 3px;
    margin: 1px 4px;
  }

  .set-item:hover {
    background: var(--color-surface-3);
  }

  .set-item.active {
    background: var(--color-accent-muted);
  }

  .set-checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .set-checkbox {
    width: 12px;
    height: 12px;
    accent-color: var(--color-accent);
    cursor: pointer;
  }

  .set-name-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 12px;
    cursor: pointer;
    text-align: left;
    padding: 0;
    min-width: 0;
  }

  .set-name-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .set-count {
    font-size: 10px;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
  }

  .set-active-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    padding: 5px 10px;
    transition: all 0.15s;
    font-weight: 500;
  }

  .btn-primary:hover { background: var(--color-accent-hover); }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    padding: 5px 10px;
    transition: all 0.15s;
  }

  .btn-ghost:hover {
    background: var(--color-surface-3);
    color: var(--color-text-primary);
  }

  .btn-xs {
    padding: 3px 8px;
    font-size: 11px;
  }
</style>
