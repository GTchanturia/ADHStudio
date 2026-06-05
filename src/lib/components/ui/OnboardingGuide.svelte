<script>
  import { appState, completeOnboarding, skipOnboarding } from '$lib/stores/platform.svelte.js';

  let step = $state(appState.settings.onboardingStep ?? 0);

  const steps = [
    {
      title: 'Welcome to Token Studio',
      description: 'Your professional design token management platform. This quick tour will show you the essentials — it takes about 30 seconds.',
      target: null,
    },
    {
      title: 'Sidebar — Token Sets',
      description: 'Organize tokens into sets and folders. Toggle sets on/off to control which appear in the grid. Click a set to filter.',
      target: '.set-manager',
    },
    {
      title: 'Token Grid',
      description: 'All your active tokens displayed as cards. Double-click any value to edit inline. Use the type and layer filters to narrow results.',
      target: '.main-canvas',
    },
    {
      title: 'Inspector Panel',
      description: 'Select a token to see resolved values, alias chains, LCH color data, and WCAG contrast ratios. Press Ctrl+I to toggle.',
      target: '.right-panel',
    },
    {
      title: 'Command Palette',
      description: 'Press Ctrl+K anytime to open the command palette. Quickly search tokens, run commands, or navigate — just like Figma or VS Code.',
      target: null,
    },
    {
      title: 'Export & Preview',
      description: 'Export tokens to CSS, Tailwind, Swift, Android XML, or W3C JSON. Use Live Preview to see tokens applied to sample components.',
      target: null,
    },
    {
      title: 'Keyboard Shortcuts',
      description: 'Press ? to see all shortcuts. Ctrl+E for export, Ctrl+P for preview, Ctrl+, for settings. All shortcuts are customizable in Settings > Shortcuts.',
      target: null,
    },
    {
      title: 'You\'re all set!',
      description: 'Tip: Use the three-layer model (Core → Semantic → Component) for scalable design systems. Access Settings anytime with Ctrl+, — enjoy Token Studio!',
      target: null,
    },
  ];

  function next() {
    if (step < steps.length - 1) {
      step++;
      appState.settings.onboardingStep = step;
    } else {
      completeOnboarding();
    }
  }

  function back() {
    if (step > 0) step--;
  }

  function skip() {
    skipOnboarding();
  }

  let spotlightEl = $state(null);

  $effect(() => {
    const target = steps[step]?.target;
    if (target) {
      requestAnimationFrame(() => {
        spotlightEl = document.querySelector(target);
      });
    } else {
      spotlightEl = null;
    }
  });

  let spotlightRect = $derived.by(() => {
    if (!spotlightEl) return null;
    const r = spotlightEl.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  });

  let tooltipPos = $derived.by(() => {
    if (!spotlightRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const sr = spotlightRect;
    const fitsRight = sr.left + sr.width + 320 < window.innerWidth;
    const fitsBelow = sr.top + sr.height + 200 < window.innerHeight;
    if (fitsRight) {
      return { top: `${sr.top + sr.height / 2}px`, left: `${sr.left + sr.width + 16}px`, transform: 'translateY(-50%)' };
    }
    if (fitsBelow) {
      return { top: `${sr.top + sr.height + 16}px`, left: `${sr.left + sr.width / 2}px`, transform: 'translateX(-50%)' };
    }
    return { top: `${sr.top - 16}px`, left: `${sr.left + sr.width / 2}px`, transform: 'translate(-50%, -100%)' };
  });
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') skip(); if (e.key === 'ArrowRight' || e.key === 'Enter') next(); if (e.key === 'ArrowLeft') back(); }} />

<div class="onboarding-overlay">
  {#if spotlightRect}
    <!-- spotlight cutout -->
    <div
      class="spotlight-box"
      style="top:{spotlightRect.top - 4}px;left:{spotlightRect.left - 4}px;width:{spotlightRect.width + 8}px;height:{spotlightRect.height + 8}px"
    ></div>
  {/if}

  <div class="tooltip-card animate-fade-in" style="top:{tooltipPos.top};left:{tooltipPos.left};transform:{tooltipPos.transform}">
    <div class="tooltip-step-indicator">
      {#each steps as _, i (i)}
        <span class="step-dot" class:active={i === step} class:done={i < step}></span>
      {/each}
    </div>

    <h3 class="tooltip-title">{steps[step].title}</h3>
    <p class="tooltip-desc">{steps[step].description}</p>

    <div class="tooltip-actions">
      <button class="tooltip-btn-skip" onclick={skip}>Skip tour</button>
      <div class="tooltip-btn-right">
        {#if step > 0}
          <button class="tooltip-btn-secondary" onclick={back}>Back</button>
        {/if}
        <button class="tooltip-btn-primary" onclick={next}>
          {step < steps.length - 1 ? 'Next' : 'Get started'}
        </button>
      </div>
    </div>

    <div class="tooltip-footer">
      {step + 1} of {steps.length}
    </div>
  </div>
</div>

<style>
  .onboarding-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.65);
    z-index: 3000;
    pointer-events: auto;
  }

  .spotlight-box {
    position: absolute;
    border-radius: 8px;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.65);
    border: 2px solid var(--color-accent);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 3001;
  }

  .tooltip-card {
    position: absolute;
    width: 300px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    padding: 20px;
    z-index: 3002;
    transition: top 0.35s cubic-bezier(0.4, 0, 0.2, 1),
               left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .tooltip-step-indicator {
    display: flex; gap: 5px; margin-bottom: 12px;
  }

  .step-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--color-surface-5);
    transition: all 0.2s;
  }

  .step-dot.active { background: var(--color-accent); transform: scale(1.3); }
  .step-dot.done { background: var(--color-accent); opacity: 0.5; }

  .tooltip-title {
    font-size: 14px; font-weight: 700;
    color: var(--color-text-primary); margin: 0 0 6px;
  }

  .tooltip-desc {
    font-size: 12px; color: var(--color-text-secondary);
    line-height: 1.5; margin: 0;
  }

  .tooltip-actions {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-top: 16px;
  }

  .tooltip-btn-skip {
    background: transparent; border: none;
    color: var(--color-text-tertiary); font-size: 11px;
    cursor: pointer; padding: 0;
    transition: color 0.15s;
  }

  .tooltip-btn-skip:hover { color: var(--color-text-secondary); }

  .tooltip-btn-right { display: flex; gap: 6px; }

  .tooltip-btn-secondary {
    padding: 5px 12px;
    background: var(--color-surface-3);
    border: 1px solid var(--color-border);
    border-radius: 5px;
    color: var(--color-text-secondary); font-size: 11px;
    font-weight: 600; cursor: pointer;
    transition: all 0.15s;
  }

  .tooltip-btn-secondary:hover { background: var(--color-surface-4); color: var(--color-text-primary); }

  .tooltip-btn-primary {
    padding: 5px 14px;
    background: var(--color-accent);
    border: none; border-radius: 5px;
    color: white; font-size: 11px;
    font-weight: 600; cursor: pointer;
    transition: all 0.15s;
  }

  .tooltip-btn-primary:hover { filter: brightness(1.1); }

  .tooltip-footer {
    margin-top: 12px;
    font-size: 10px; color: var(--color-text-tertiary);
    text-align: center;
  }
</style>
