/* A5 Visual Polish v1.0 — runtime guard + lightweight state sync.
   Deliberately does not bind new touch gestures or duplicate the Motion UI handlers. */
(() => {
  'use strict';
  if (window.__A5_VISUAL_POLISH_V1__) return;
  window.__A5_VISUAL_POLISH_V1__ = true;

  const root = document.documentElement;
  const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia?.('(max-width: 760px) and (pointer: coarse)');
  let authObserver = null;
  let pageObservers = [];
  let queued = false;

  const isVisible = element => Boolean(
    element && !element.classList.contains('hidden') && !element.hasAttribute('hidden') &&
    window.getComputedStyle(element).display !== 'none'
  );

  function updateDeviceState() {
    root.classList.toggle('a5-visual-mobile', Boolean(mobileQuery?.matches));
    root.classList.toggle('a5-visual-reduced-motion', Boolean(motionQuery?.matches));
  }

  function updateActivePage() {
    const appReady = isVisible(document.getElementById('appShell')) &&
      !isVisible(document.getElementById('authScreen'));
    root.classList.toggle('a5-visual-app-ready', appReady);
    root.classList.toggle('a5-visual-auth-only', !appReady);

    if (!appReady) {
      delete root.dataset.a5VisualPage;
      return;
    }
    const page = document.querySelector('#appShell .page-view.active[id^="page-"]');
    if (page) root.dataset.a5VisualPage = page.id.replace(/^page-/, '');
  }

  function scheduleUpdate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      updateActivePage();
    });
  }

  function observePages() {
    pageObservers.forEach(observer => observer.disconnect());
    pageObservers = [];
    if (!('MutationObserver' in window)) return;
    document.querySelectorAll('#appShell .page-view').forEach(page => {
      const observer = new MutationObserver(scheduleUpdate);
      observer.observe(page, { attributes: true, attributeFilter: ['class', 'hidden'] });
      pageObservers.push(observer);
    });
  }

  function boot() {
    updateDeviceState();
    updateActivePage();
    observePages();

    const auth = document.getElementById('authScreen');
    const shell = document.getElementById('appShell');
    if ('MutationObserver' in window) {
      authObserver = new MutationObserver(scheduleUpdate);
      if (auth) authObserver.observe(auth, { attributes: true, attributeFilter: ['class', 'hidden'] });
      if (shell) authObserver.observe(shell, { attributes: true, attributeFilter: ['class', 'hidden'] });
    }

    /* App.js creates the chat page during its DOMContentLoaded initialization.
       A one-time deferred observer refresh handles that dynamic page without watching all DOM mutations. */
    window.setTimeout(() => {
      observePages();
      updateActivePage();
    }, 0);

    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[data-tab]')) scheduleUpdate();
    }, true);
    window.addEventListener('pageshow', scheduleUpdate, { passive: true });
    window.addEventListener('focus', scheduleUpdate, { passive: true });
    mobileQuery?.addEventListener?.('change', updateDeviceState);
    motionQuery?.addEventListener?.('change', updateDeviceState);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
