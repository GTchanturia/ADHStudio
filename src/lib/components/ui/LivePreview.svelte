<script>
  import { appState, tokenMap } from '$lib/stores/platform.svelte.js';
  import { resolveToken } from '$lib/utils/aliases.js';
  import { toCssVariables } from '$lib/utils/export.js';

  let { onclose } = $props();

  // Build CSS variables string for the preview
  const cssVars = $derived.by(() => {
    const vars = {};
    for (const setId of appState.activeSetIds) {
      const set = appState.tokenSets.find(s => s.id === setId);
      if (!set?.tokens) continue;
      for (const token of set.tokens) {
        const resolved = resolveToken(token.name, tokenMap());
        const value = resolved.value ?? token.value?.value ?? token.value ?? '';
        if (value) vars[`--${token.name}`] = String(value);
      }
    }
    return vars;
  });

  const styleStr = $derived(
    Object.entries(cssVars).map(([k, v]) => `${k}: ${v}`).join('; ')
  );
</script>

<div class="preview-overlay" onclick={e => { if (e.target === e.currentTarget) onclose(); }}>
  <div class="preview-panel animate-fade-in">
    <div class="preview-header">
      <span class="preview-title">Live Preview</span>
      <span class="preview-subtitle">CSS variables applied to sample components</span>
      <button class="preview-close" onclick={onclose}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="preview-body" style={styleStr}>
      <!-- Sample Card -->
      <div class="sample-section">
        <span class="sample-label">Card Component</span>
        <div class="sample-card" style:background="var(--color-neutral-50, #fafafa)" style:border-color="var(--color-neutral-200, #e5e5e5)">
          <div class="sample-card-header" style:color="var(--color-neutral-900, #171717)">
            <span class="sample-card-title" style:font-size="var(--typography-lg, 20px)">Design System</span>
            <span class="sample-card-subtitle" style:color="var(--color-neutral-500, #737373)" style:font-size="var(--typography-sm, 13px)">Consistent, scalable, maintainable</span>
          </div>
          <div class="sample-card-body" style:color="var(--color-neutral-800, #262626)" style:font-size="var(--typography-base, 16px)" style:padding="var(--spacing-4, 16px)">
            Your design tokens power every component across the entire product suite.
          </div>
          <div class="sample-card-actions" style:gap="var(--spacing-2, 8px)" style:padding="var(--spacing-4, 16px)">
            <button class="sample-btn-primary" style:background="var(--button-bg, var(--color-primary, #3b82f6))" style:color="var(--button-text, #fff)" style:border-radius="var(--button-radius, 6px)" style:padding="var(--button-padding-v, 8px) var(--button-padding-h, 16px)" style:box-shadow="var(--button-shadow, none)">
              Primary Action
            </button>
            <button class="sample-btn-ghost" style:color="var(--color-primary, #3b82f6)" style:border-color="var(--color-primary, #3b82f6)" style:border-radius="var(--button-radius, 6px)" style:padding="var(--button-padding-v, 8px) var(--button-padding-h, 16px)">
              Secondary
            </button>
            <button class="sample-btn-danger" style:background="var(--button-danger, var(--color-error, #ef4444))" style:color="#fff" style:border-radius="var(--button-radius, 6px)" style:padding="var(--button-padding-v, 8px) var(--button-padding-h, 16px)">
              Danger
            </button>
          </div>
        </div>
      </div>

      <!-- Color Palette -->
      <div class="sample-section">
        <span class="sample-label">Color Palette</span>
        <div class="color-row">
          {#each Object.entries(cssVars).filter(([k]) => k.startsWith('--color-') && /#[0-9a-fA-F]{6}/.test(cssVars[k])).slice(0, 8) as [name, value]}
            <div class="color-chip" style:background={value}>
              <span class="color-chip-name">{name.replace('--color-', '')}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Spacing Scale -->
      <div class="sample-section">
        <span class="sample-label">Spacing Scale</span>
        <div class="spacing-demo">
          {#each Object.entries(cssVars).filter(([k]) => k.startsWith('--spacing-')).slice(0, 6) as [name, value]}
            <div class="spacing-chip">
              <div class="spacing-bar" style:width={value} style:background="var(--color-primary, #3b82f6)"></div>
              <span class="spacing-name">{name.replace('--spacing-', '')} — {value}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Typography Scale -->
      <div class="sample-section">
        <span class="sample-label">Typography Scale</span>
        <div class="type-demo">
          {#each Object.entries(cssVars).filter(([k]) => k.startsWith('--typography-')).slice(0, 5) as [name, value]}
            <div class="type-row">
              <span class="type-preview" style:font-size={value} style:color="var(--color-neutral-900, #171717)">Aa</span>
              <span class="type-name">{name.replace('--typography-', '')} — {value}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .preview-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(4px);
  }

  .preview-panel {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 12px; width: 720px; max-width: 95vw;
    max-height: 85vh; display: flex; flex-direction: column;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  }

  .preview-header {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 20px; border-bottom: 1px solid var(--color-border); flex-shrink: 0;
  }

  .preview-title { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }

  .preview-subtitle { font-size: 11px; color: var(--color-text-tertiary); flex: 1; }

  .preview-close {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px;
    background: transparent; border: none;
    color: var(--color-text-tertiary); cursor: pointer; transition: all 0.15s;
  }

  .preview-close:hover { background: var(--color-surface-4); color: var(--color-text-primary); }

  .preview-body {
    flex: 1; overflow-y: auto; padding: 20px;
    display: flex; flex-direction: column; gap: 24px;
    background: #ffffff; border-radius: 0 0 12px 12px;
  }

  .sample-section { display: flex; flex-direction: column; gap: 10px; }

  .sample-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: #737373;
  }

  .sample-card {
    border: 1px solid; border-radius: 8px; overflow: hidden;
  }

  .sample-card-header { padding: 16px 16px 8px; display: flex; flex-direction: column; gap: 4px; }

  .sample-card-title { font-weight: 700; line-height: 1.2; }
  .sample-card-subtitle { line-height: 1.3; }

  .sample-card-body { line-height: 1.5; }

  .sample-card-actions { display: flex; flex-wrap: wrap; padding-bottom: 16px; }

  .sample-btn-primary, .sample-btn-ghost, .sample-btn-danger {
    font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s;
  }

  .sample-btn-ghost { background: transparent; border-width: 1px; border-style: solid; }

  .color-row { display: flex; gap: 6px; flex-wrap: wrap; }

  .color-chip {
    width: 64px; height: 48px; border-radius: 6px;
    display: flex; align-items: flex-end; justify-content: center;
    padding-bottom: 4px; border: 1px solid rgba(0,0,0,0.1);
  }

  .color-chip-name {
    font-size: 8px; font-family: monospace; color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5); white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; max-width: 56px;
  }

  .spacing-demo { display: flex; flex-direction: column; gap: 6px; }

  .spacing-chip { display: flex; align-items: center; gap: 8px; }

  .spacing-bar { height: 8px; border-radius: 4px; min-width: 4px; }

  .spacing-name { font-size: 11px; font-family: monospace; color: #52525b; }

  .type-demo { display: flex; flex-direction: column; gap: 6px; }

  .type-row { display: flex; align-items: baseline; gap: 12px; }

  .type-preview { font-weight: 700; line-height: 1; }

  .type-name { font-size: 11px; font-family: monospace; color: #52525b; }
</style>
