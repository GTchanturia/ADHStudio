<script>
  let { message, type = 'success' } = $props();

  const icons = {
    success: `<path d="M4 8l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    error: `<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    warning: `<path d="M8 5v4M8 11v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    info: `<path d="M8 7v5M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
  };
</script>

<div class="notification notification-{type} animate-fade-in">
  <svg class="notif-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
    {@html icons[type] ?? icons.info}
  </svg>
  <span>{message}</span>
</div>

<style>
  .notification {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    z-index: 2000;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    border: 1px solid;
    white-space: nowrap;
    pointer-events: none;
  }

  .notif-icon { flex-shrink: 0; }

  .notification-success {
    background: rgba(22,163,74,0.15);
    border-color: rgba(34,197,94,0.4);
    color: var(--color-success);
  }

  .notification-error {
    background: rgba(185,28,28,0.15);
    border-color: rgba(239,68,68,0.4);
    color: var(--color-error);
  }

  .notification-warning {
    background: rgba(180,83,9,0.15);
    border-color: rgba(245,158,11,0.4);
    color: var(--color-warning);
  }

  .notification-info {
    background: rgba(8,145,178,0.15);
    border-color: rgba(6,182,212,0.4);
    color: var(--color-info);
  }
</style>
