<script>
  import { createTheme, notify } from '$lib/stores/platform.svelte.js';

  let { onclose, projectId } = $props();
  let name = $state('');
  let saving = $state(false);

  async function handleCreate() {
    if (!name.trim() || !projectId) return;
    saving = true;
    try {
      await createTheme(projectId, name.trim());
      onclose();
    } catch {
      // error handled in store
    } finally {
      saving = false;
    }
  }
</script>

<div class="modal-backdrop" onclick={e => { if (e.target === e.currentTarget) onclose(); }} role="dialog" aria-modal="true">
  <div class="modal animate-fade-in">
    <div class="modal-header">
      <h2>Create Theme</h2>
      <button class="modal-close" onclick={onclose}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label" for="theme-name">Theme Name</label>
        <input
          id="theme-name"
          type="text"
          bind:value={name}
          placeholder="Light Theme, Dark Mode..."
          class="form-input"
          autofocus
          onkeydown={e => e.key === 'Enter' && handleCreate()}
        />
        <span class="form-hint">The current active sets will be saved with this theme.</span>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick={onclose}>Cancel</button>
      <button class="btn-primary" onclick={handleCreate} disabled={saving || !name.trim()}>
        {saving ? 'Creating...' : 'Create Theme'}
      </button>
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
    border-radius: 12px;
    width: 400px; max-width: 95vw;
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

  .form-group { display: flex; flex-direction: column; gap: 6px; }

  .form-label {
    font-size: 11px; font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  .form-input {
    background: var(--color-surface-3);
    border: 1px solid var(--color-border);
    border-radius: 6px; padding: 7px 10px;
    font-size: 12px; color: var(--color-text-primary);
    outline: none; transition: border-color 0.15s;
  }

  .form-input:focus { border-color: var(--color-accent); }
  .form-input::placeholder { color: var(--color-text-tertiary); }

  .form-hint { font-size: 10px; color: var(--color-text-tertiary); }

  .modal-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 16px 20px; border-top: 1px solid var(--color-border);
  }

  .btn-primary {
    background: var(--color-accent); color: white; border: none;
    border-radius: 6px; cursor: pointer; font-size: 12px;
    padding: 7px 18px; transition: all 0.15s; font-weight: 600;
  }

  .btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    background: transparent; color: var(--color-text-secondary);
    border: 1px solid var(--color-border); border-radius: 6px;
    cursor: pointer; font-size: 12px; padding: 7px 18px; transition: all 0.15s;
  }

  .btn-ghost:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
</style>
