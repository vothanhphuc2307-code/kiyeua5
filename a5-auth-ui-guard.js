/* A5 Auth UI Guard v1.0 — gate app-only mobile chrome while signed out. */
(() => {
  'use strict';
  if (window.__A5_AUTH_UI_GUARD_V1__) return;
  window.__A5_AUTH_UI_GUARD_V1__ = true;

  const root = document.documentElement;
  let observer = null;
  let frame = 0;

  function isVisible(el) {
    return Boolean(el && !el.classList.contains('hidden') && !el.hasAttribute('hidden'));
  }

  function syncAuthUiState() {
    frame = 0;
    const auth = document.getElementById('authScreen');
    const shell = document.getElementById('appShell');
    const authVisible = isVisible(auth);
    const appVisible = isVisible(shell);

    /* Prefer the login screen if the two state classes briefly overlap. */
    const appReady = appVisible && !authVisible;
    root.classList.toggle('a5-auth-only', !appReady);
    root.classList.toggle('a5-app-ready', appReady);

    if (!appReady) {
      const overlay = document.getElementById('a5LoadingExperience');
      if (overlay) {
        overlay.classList.remove('is-visible');
        overlay.setAttribute('aria-hidden', 'true');
      }
      const backToTop = document.getElementById('a5UiExtrasTopButton');
      if (backToTop) {
        backToTop.classList.remove('is-visible');
        backToTop.setAttribute('aria-hidden', 'true');
        backToTop.tabIndex = -1;
      }
      const progress = document.getElementById('a5UiExtrasProgress');
      if (progress) {
        progress.classList.remove('is-active');
        progress.style.setProperty('--a5-ui-progress', '0');
      }
    }
  }

  function scheduleSync() {
    if (frame) return;
    frame = window.requestAnimationFrame(syncAuthUiState);
  }

  function boot() {
    syncAuthUiState();
    if ('MutationObserver' in window) {
      observer = new MutationObserver(scheduleSync);
      const options = { attributes: true, attributeFilter: ['class', 'hidden'] };
      const auth = document.getElementById('authScreen');
      const shell = document.getElementById('appShell');
      if (auth) observer.observe(auth, options);
      if (shell) observer.observe(shell, options);
    }
    window.addEventListener('pageshow', scheduleSync, { passive: true });
    window.addEventListener('focus', scheduleSync, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
