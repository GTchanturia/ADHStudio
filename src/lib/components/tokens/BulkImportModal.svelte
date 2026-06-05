<script>
  import { appState, bulkCreateTokens, notify } from '$lib/stores/platform.svelte.js';

  let { onclose } = $props();

  let jsonInput = $state('');
  let targetSetId = $state(appState.activeSetIds[0] ?? '');
  let parseError = $state('');
  let parsedTokens = $state([]);
  let importing = $state(false);
  let step = $state('input'); // 'input' | 'review' | 'done'

  function parseW3cJson(input) {
    const errors = [];
    if (!input.trim()) { errors.push('Paste your W3C JSON tokens'); return { tokens: [], errors }; }

    let obj;
    try { obj = JSON.parse(input); } catch (e) { return { tokens: [], errors: [`Invalid JSON: ${e.message}`] }; }

    const tokens = [];

    function walk(node, prefix = '') {
      for (const [key, val] of Object.entries(node)) {
        const name = prefix ? prefix + '-' + key : key;
        if (val && typeof val === 'object' && val.$value !== undefined) {
          tokens.push({
            name,
            type: val.$type ?? guessType(val.$value),
            layer: 'core',
            value: { value: String(val.$value) },
            description: val.$description ?? ''
          });
        } else if (val && typeof val === 'object' && !val.$value) {
          walk(val, name);
        }
      }
    }

    walk(obj);
    return { tokens, errors };
  }

  function guessType(value) {
    if (typeof value !== 'string') return 'other';
    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return 'color';
    if (/^\d+(\.\d+)?px$/.test(value)) return 'spacing';
    if (/^\d+(\.\d+)?px$/.test(value) && value.match(/^\d+/)?.[0] > 20) return 'typography';
    if (/^\d+px/.test(value)) return 'border';
    if (/rgba?\(/.test(value) || /box-shadow/i.test(value)) return 'shadow';
    return 'other';
  }

  function handleParse() {
    const result = parseW3cJson(jsonInput);
    parseError = result.errors.join('; ');
    parsedTokens = result.tokens;
    if (result.tokens.length > 0) {
      step = 'review';
      parseError = '';
    }
  }

  async function handleImport() {
    if (!targetSetId) { parseError = 'Select a target token set'; return; }
    importing = true;

    const tokenDataArray = parsedTokens.map(t => ({
      token_set_id: targetSetId,
      name: t.name,
      type: t.type,
      layer: t.layer,
      value: t.value,
      description: t.description
    }));

    try {
      await bulkCreateTokens(tokenDataArray);
      step = 'done';
    } catch (e) {
      parseError = e.message ?? 'Import failed';
    } finally {
      importing = false;
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onclose();
  }
</script>

<div class="modal-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true">
  <div class="modal animate-fade-in">
    <div class="modal-header">
      <h2>Import Tokens</h2>
      <button class="modal-close" onclick={onclose}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="modal-body">
      {#if parseError}
        <div class="form-error animate-fade-in">{parseError}</div>
      {/if}

      {#if step === 'input'}
        <p class="modal-desc">Paste your tokens in W3C Design Token JSON format to bulk-import them into a token set.</p>

        <div class="form-group">
          <label class="form-label">Target Token Set</label>
          <select bind:value={targetSetId} class="form-select">
            {#each appState.tokenSets as set}
              <option value={set.id}>{set.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">W3C JSON</label>
          <textarea
            bind:value={jsonInput}
            placeholder='{`{
  "color": {
    "primary": { "$value": "#3b82f6", "$type": "color" },
    "success": { "$value": "#22c55e", "$type": "color" }
  },
  "spacing": {
    "sm": { "$value": "8px", "$type": "spacing" }
  }
}`}'
            class="form-textarea mono"
            rows="10"
          ></textarea>
        </div>
      {:else if step === 'review'}
        <div class="review-header">
          <span class="review-count">{parsedTokens.length} tokens parsed</span>
          <button class="btn-ghost btn-xs" onclick={() => step = 'input'}>Edit JSON</button>
        </div>

        <div class="review-list">
          {#each parsedTokens.slice(0, 50) as token, i}
            <div class="review-row">
              <span class="review-name">{token.name}</span>
              <span class="token-badge type-{token.type}">{token.type}</span>
              <span class="review-value">{token.value.value}</span>
            </div>
          {/each}
          {#if parsedTokens.length > 50}
            <div class="review-more">+{parsedTokens.length - 50} more...</div>
          {/if}
        </div>
      {:else if step === 'done'}
        <div class="done-state">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="17" stroke="var(--color-success)" stroke-width="1.5"/>
            <path d="M13 20l5 5 9-9" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="done-text">{parsedTokens.length} tokens imported successfully</span>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      {#if step === 'input'}
        <button class="btn-ghost" onclick={onclose}>Cancel</button>
        <button class="btn-primary" onclick={handleParse} disabled={!jsonInput.trim()}>
          Parse JSON
        </button>
      {:else if step === 'review'}
        <button class="btn-ghost" onclick={onclose}>Cancel</button>
        <button class="btn-primary" onclick={handleImport} disabled={importing}>
          {importing ? 'Importing...' : `Import ${parsedTokens.length} Tokens`}
        </button>
      {:else}
        <button class="btn-primary" onclick={onclose}>Done</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(4px);
  }

  .modal {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 12px; width: 560px; max-width: 95vw;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  }

  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 { font-size: 15px; font-weight: 700; margin: 0; color: var(--color-text-primary); }

  .modal-close {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px;
    background: transparent; border: none;
    color: var(--color-text-tertiary); cursor: pointer; transition: all 0.15s;
  }

  .modal-close:hover { background: var(--color-surface-4); color: var(--color-text-primary); }

  .modal-body { padding: 20px; }

  .modal-desc {
    font-size: 12px; color: var(--color-text-secondary); margin: 0 0 16px; line-height: 1.5;
  }

  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }

  .form-label {
    font-size: 11px; font-weight: 600; color: var(--color-text-secondary);
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  .form-select, .form-textarea {
    background: var(--color-surface-3); border: 1px solid var(--color-border);
    border-radius: 6px; padding: 7px 10px; font-size: 12px;
    color: var(--color-text-primary); outline: none;
    transition: border-color 0.15s;
  }

  .form-select:focus, .form-textarea:focus { border-color: var(--color-accent); }
  .form-textarea { resize: vertical; min-height: 120px; line-height: 1.4; }
  .form-textarea::placeholder { color: var(--color-text-tertiary); }
  .mono { font-family: var(--font-mono); font-size: 11px; }

  .form-error {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
    border-radius: 6px; padding: 8px 12px; font-size: 12px;
    color: var(--color-error); margin-bottom: 16px;
  }

  .review-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }

  .review-count { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }

  .review-list {
    max-height: 300px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 3px;
  }

  .review-row {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 8px; background: var(--color-surface-3); border-radius: 4px;
  }

  .review-name {
    font-family: var(--font-mono); font-size: 11px;
    color: var(--color-text-primary); font-weight: 600;
    flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .review-value {
    font-family: var(--font-mono); font-size: 10px;
    color: var(--color-text-tertiary); max-width: 100px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .token-badge {
    display: inline-flex; align-items: center; padding: 1px 5px; border-radius: 3px;
    font-size: 9px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  }

  .type-color { color: var(--color-token-color); background: rgba(248,113,113,0.12); }
  .type-typography { color: var(--color-token-typography); background: rgba(167,139,250,0.12); }
  .type-spacing { color: var(--color-token-spacing); background: rgba(52,211,153,0.12); }
  .type-other { color: var(--color-token-other); background: rgba(148,163,184,0.12); }

  .review-more {
    font-size: 11px; color: var(--color-text-tertiary); text-align: center; padding: 8px;
  }

  .done-state {
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; padding: 32px; text-align: center;
  }

  .done-text { font-size: 14px; font-weight: 600; color: var(--color-success); }

  .modal-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 16px 20px; border-top: 1px solid var(--color-border);
  }

  .btn-primary {
    background: var(--color-accent); color: white; border: none;
    border-radius: 6px; cursor: pointer; font-size: 13px;
    padding: 7px 18px; transition: all 0.15s; font-weight: 600;
  }

  .btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    background: transparent; color: var(--color-text-secondary);
    border: 1px solid var(--color-border); border-radius: 6px;
    cursor: pointer; font-size: 13px; padding: 7px 18px; transition: all 0.15s;
  }

  .btn-ghost:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
  .btn-xs { padding: 4px 10px; font-size: 11px; }
</style>
