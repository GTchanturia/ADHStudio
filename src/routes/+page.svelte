<script>
  import { onMount } from 'svelte';
  import { appState, loadProject, notify, tokenMap, filteredTokens, selectedToken } from '$lib/stores/platform.svelte.js';
  import { supabase } from '$lib/utils/supabase.js';
  import TopBar from '$lib/components/ui/TopBar.svelte';
  import SetManager from '$lib/components/sidebar/SetManager.svelte';
  import TokenGrid from '$lib/components/tokens/TokenGrid.svelte';
  import TokenInspector from '$lib/components/inspector/TokenInspector.svelte';
  import AiAssistant from '$lib/components/ai/AiAssistant.svelte';
  import Notification from '$lib/components/ui/Notification.svelte';

  let projectId = $state(null);

  onMount(async () => {
    let { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'demo')
      .maybeSingle();

    if (!org) {
      const { data } = await supabase
        .from('organizations')
        .insert({ name: 'Demo Organization', slug: 'demo' })
        .select()
        .single();
      org = data;
    }

    let { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', org.id)
      .maybeSingle();

    if (!project) {
      const { data } = await supabase
        .from('projects')
        .insert({ organization_id: org.id, name: 'Design System v1', description: 'Primary design system tokens' })
        .select()
        .single();
      project = data;
      await seedDemoData(project.id);
    }

    projectId = project.id;
    await loadProject(project.id);
  });

  async function createSetInDb(name, pid, idx) {
    const { data } = await supabase
      .from('token_sets')
      .insert({ name, project_id: pid, order_index: idx })
      .select()
      .single();
    return data.id;
  }

  async function seedDemoData(pid) {
    const coreId = await createSetInDb('Core/Colors', pid, 0);
    const semanticId = await createSetInDb('Semantic/Brand', pid, 1);
    const componentId = await createSetInDb('Components/Button', pid, 2);

    await supabase.from('themes').insert({
      project_id: pid,
      name: 'Light Theme',
      token_set_ids: [coreId, semanticId, componentId]
    });

    const coreTokens = [
      { name: 'color-blue-100', type: 'color', layer: 'core', value: { value: '#dbeafe' }, description: 'Blue 100' },
      { name: 'color-blue-300', type: 'color', layer: 'core', value: { value: '#93c5fd' }, description: 'Blue 300' },
      { name: 'color-blue-500', type: 'color', layer: 'core', value: { value: '#3b82f6' }, description: 'Blue 500' },
      { name: 'color-blue-700', type: 'color', layer: 'core', value: { value: '#1d4ed8' }, description: 'Blue 700' },
      { name: 'color-blue-900', type: 'color', layer: 'core', value: { value: '#1e3a8a' }, description: 'Blue 900' },
      { name: 'color-green-400', type: 'color', layer: 'core', value: { value: '#4ade80' }, description: 'Green 400' },
      { name: 'color-green-500', type: 'color', layer: 'core', value: { value: '#22c55e' }, description: 'Green 500' },
      { name: 'color-red-400', type: 'color', layer: 'core', value: { value: '#f87171' }, description: 'Red 400' },
      { name: 'color-red-500', type: 'color', layer: 'core', value: { value: '#ef4444' }, description: 'Red 500' },
      { name: 'color-amber-400', type: 'color', layer: 'core', value: { value: '#fbbf24' }, description: 'Amber 400' },
      { name: 'color-amber-500', type: 'color', layer: 'core', value: { value: '#f59e0b' }, description: 'Amber 500' },
      { name: 'color-neutral-50', type: 'color', layer: 'core', value: { value: '#fafafa' }, description: 'Neutral 50' },
      { name: 'color-neutral-200', type: 'color', layer: 'core', value: { value: '#e5e5e5' }, description: 'Neutral 200' },
      { name: 'color-neutral-500', type: 'color', layer: 'core', value: { value: '#737373' }, description: 'Neutral 500' },
      { name: 'color-neutral-800', type: 'color', layer: 'core', value: { value: '#262626' }, description: 'Neutral 800' },
      { name: 'color-neutral-900', type: 'color', layer: 'core', value: { value: '#171717' }, description: 'Neutral 900' },
      { name: 'spacing-1', type: 'spacing', layer: 'core', value: { value: '4px' }, description: '4px' },
      { name: 'spacing-2', type: 'spacing', layer: 'core', value: { value: '8px' }, description: '8px' },
      { name: 'spacing-3', type: 'spacing', layer: 'core', value: { value: '12px' }, description: '12px' },
      { name: 'spacing-4', type: 'spacing', layer: 'core', value: { value: '16px' }, description: '16px' },
      { name: 'spacing-6', type: 'spacing', layer: 'core', value: { value: '24px' }, description: '24px' },
      { name: 'spacing-8', type: 'spacing', layer: 'core', value: { value: '32px' }, description: '32px' },
      { name: 'typography-xs', type: 'typography', layer: 'core', value: { value: '11px' } },
      { name: 'typography-sm', type: 'typography', layer: 'core', value: { value: '13px' } },
      { name: 'typography-base', type: 'typography', layer: 'core', value: { value: '16px' } },
      { name: 'typography-lg', type: 'typography', layer: 'core', value: { value: '20px' } },
      { name: 'typography-xl', type: 'typography', layer: 'core', value: { value: '28px' } },
      { name: 'typography-2xl', type: 'typography', layer: 'core', value: { value: '36px' } },
    ];

    for (const t of coreTokens) {
      await supabase.from('tokens').insert({ token_set_id: coreId, ...t });
    }

    const semanticTokens = [
      { name: 'color-primary', type: 'color', layer: 'semantic', value: { value: '{color-blue-500}' }, description: 'Primary brand color' },
      { name: 'color-primary-hover', type: 'color', layer: 'semantic', value: { value: '{color-blue-700}' }, description: 'Primary hover' },
      { name: 'color-primary-subtle', type: 'color', layer: 'semantic', value: { value: '{color-blue-100}' }, description: 'Subtle primary background' },
      { name: 'color-success', type: 'color', layer: 'semantic', value: { value: '{color-green-500}' }, description: 'Success state' },
      { name: 'color-error', type: 'color', layer: 'semantic', value: { value: '{color-red-500}' }, description: 'Error state' },
      { name: 'color-warning', type: 'color', layer: 'semantic', value: { value: '{color-amber-500}' }, description: 'Warning state' },
      { name: 'color-text-primary', type: 'color', layer: 'semantic', value: { value: '{color-neutral-900}' }, description: 'Primary text' },
      { name: 'color-text-secondary', type: 'color', layer: 'semantic', value: { value: '{color-neutral-500}' }, description: 'Secondary text' },
      { name: 'spacing-gap-xs', type: 'spacing', layer: 'semantic', value: { value: '{spacing-1}' } },
      { name: 'spacing-gap-sm', type: 'spacing', layer: 'semantic', value: { value: '{spacing-2}' } },
      { name: 'spacing-gap-md', type: 'spacing', layer: 'semantic', value: { value: '{spacing-4}' } },
      { name: 'spacing-gap-lg', type: 'spacing', layer: 'semantic', value: { value: '{spacing-8}' } },
    ];

    for (const t of semanticTokens) {
      await supabase.from('tokens').insert({ token_set_id: semanticId, ...t });
    }

    const componentTokens = [
      { name: 'button-bg', type: 'color', layer: 'component', value: { value: '{color-primary}' }, description: 'Button background' },
      { name: 'button-bg-hover', type: 'color', layer: 'component', value: { value: '{color-primary-hover}' }, description: 'Button hover' },
      { name: 'button-text', type: 'color', layer: 'component', value: { value: '#ffffff' }, description: 'Button text' },
      { name: 'button-success', type: 'color', layer: 'component', value: { value: '{color-success}' }, description: 'Success button' },
      { name: 'button-danger', type: 'color', layer: 'component', value: { value: '{color-error}' }, description: 'Danger button' },
      { name: 'button-padding-h', type: 'spacing', layer: 'component', value: { value: '{spacing-4}' } },
      { name: 'button-padding-v', type: 'spacing', layer: 'component', value: { value: '{spacing-2}' } },
      { name: 'button-radius', type: 'border', layer: 'component', value: { value: '6px' } },
      { name: 'button-shadow', type: 'shadow', layer: 'component', value: { value: '0 2px 8px rgba(0,0,0,0.15)' } },
    ];

    for (const t of componentTokens) {
      await supabase.from('tokens').insert({ token_set_id: componentId, ...t });
    }
  }
</script>

<svelte:head>
  <title>Token Studio — Design Token Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
</svelte:head>

<div class="platform">
  <TopBar projectName={appState.project?.name ?? 'Token Studio'} />

  <div class="platform-body">
    <SetManager {projectId} />

    <main class="main-canvas">
      {#if appState.isLoading}
        <div class="loading-screen">
          <div class="loading-spinner"></div>
          <span>Loading design system...</span>
        </div>
      {:else}
        <TokenGrid
          tokens={filteredTokens()}
          tokenMap={tokenMap()}
        />
      {/if}
    </main>

    {#if appState.inspectorOpen || appState.exportPanelOpen}
      <div class="right-panel animate-slide-right">
        <TokenInspector
          token={selectedToken()}
          tokenMap={tokenMap()}
        />
        <AiAssistant tokenMap={tokenMap()} />
      </div>
    {/if}
  </div>

  <div class="stats-bar">
    <span class="stat">
      <span class="stat-value">{appState.tokenSets.length}</span> sets
    </span>
    <span class="stat-divider">·</span>
    <span class="stat">
      <span class="stat-value">{appState.tokenSets.flatMap(s => s.tokens ?? []).length}</span> tokens
    </span>
    <span class="stat-divider">·</span>
    <span class="stat">
      <span class="stat-value">{appState.activeSetIds.length}</span> active
    </span>
    {#if appState.searchQuery}
      <span class="stat-divider">·</span>
      <span class="stat stat-accent">
        <span class="stat-value">{filteredTokens().length}</span> results
      </span>
    {/if}
    <span class="stat-spacer"></span>
    <span class="stat stat-version">Token Studio v1.0</span>
  </div>
</div>

{#if appState.notification}
  <Notification message={appState.notification.message} type={appState.notification.type} />
{/if}

<style>
  .platform {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--color-surface-0);
    overflow: hidden;
  }

  .platform-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .main-canvas {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--color-surface-0);
    position: relative;
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    width: 280px;
    min-width: 260px;
    border-left: 1px solid var(--color-border);
    background: var(--color-surface-1);
    overflow: hidden;
    flex-shrink: 0;
  }

  .loading-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--color-text-tertiary);
    font-size: 13px;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid var(--color-surface-4);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .stats-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 16px;
    background: var(--color-surface-1);
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .stat {
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  .stat-value {
    color: var(--color-text-secondary);
    font-weight: 600;
    font-family: var(--font-mono);
  }

  .stat-divider {
    color: var(--color-surface-5);
    font-size: 12px;
  }

  .stat-accent .stat-value { color: var(--color-accent); }

  .stat-spacer { flex: 1; }

  .stat-version {
    font-size: 10px;
    opacity: 0.5;
  }
</style>
