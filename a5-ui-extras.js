/* A5 UI Extras v1.0 — lightweight scroll progress + back-to-top.
   No libraries, storage, network calls, or Supabase dependencies. */
(() => {
  'use strict';

  if (window.__A5_UI_EXTRAS_V1__) return;
  window.__A5_UI_EXTRAS_V1__ = true;

  const reduceMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const docScroller = () => document.scrollingElement || document.documentElement;
  const isScrollable = el => Boolean(el && el.nodeType === 1 && el.scrollHeight > el.clientHeight + 32);

  let activeScrollTarget = null;
  let framePending = false;
  let progressRoot = null;
  let progressFill = null;
  let topButton = null;
  let shellObserver = null;
  let modalObserver = null;

  function appIsVisible() {
    const shell = document.getElementById('appShell');
    return !shell || !shell.classList.contains('hidden');
  }

  function modalIsOpen() {
    return Boolean(document.querySelector(
      '.modal-backdrop:not(.hidden), .media-viewer-backdrop:not(.hidden), .a5-chat-lightbox:not(.hidden)'
    ));
  }

  function pageScrollTargetFrom(target) {
    if (!(target instanceof Element)) return docScroller();
    // Only accept the actual page-level scrolling element. Do not mistake a
    // nested chat message list or media editor for the page scroll container.
    return target.matches('.page-content, .app-main, .app-shell') && isScrollable(target)
      ? target
      : docScroller();
  }

  function scrollPosition(el) {
    if (!el || el === document.documentElement || el === document.body || el === docScroller()) {
      return Math.max(window.scrollY || 0, docScroller().scrollTop || 0);
    }
    return Math.max(0, el.scrollTop || 0);
  }

  function maxScroll(el) {
    if (!el || el === document.documentElement || el === document.body || el === docScroller()) {
      const root = docScroller();
      return Math.max(0, root.scrollHeight - window.innerHeight);
    }
    return Math.max(0, el.scrollHeight - el.clientHeight);
  }

  function scrollToTop() {
    const target = activeScrollTarget;
    const behavior = reduceMotion() ? 'auto' : 'smooth';
    if (target && target !== docScroller() && target.isConnected && isScrollable(target)) {
      target.scrollTo({ top: 0, behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
      if (docScroller().scrollTop > 0) docScroller().scrollTop = 0;
    }
  }

  function setVisible(el, visible) {
    el.classList.toggle('is-visible', visible);
    el.setAttribute('aria-hidden', String(!visible));
    el.tabIndex = visible ? 0 : -1;
  }

  function updateUI() {
    framePending = false;
    if (!progressRoot || !topButton) return;

    const enabled = appIsVisible();
    if (!enabled) {
      progressRoot.classList.remove('is-active');
      progressRoot.style.setProperty('--a5-ui-progress', '0');
      setVisible(topButton, false);
      return;
    }

    const target = activeScrollTarget && activeScrollTarget.isConnected ? activeScrollTarget : docScroller();
    const max = maxScroll(target);
    const top = scrollPosition(target);
    const ratio = max > 0 ? Math.max(0, Math.min(1, top / max)) : 0;
    progressRoot.style.setProperty('--a5-ui-progress', String(ratio));
    progressRoot.classList.toggle('is-active', max > 120 && top > 16);

    const shouldShow = top > 620 && !modalIsOpen();
    setVisible(topButton, shouldShow);
  }

  function scheduleUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateUI);
  }

  function onScroll(event) {
    if (event.target === document || event.target === document.documentElement || event.target === document.body || event.target === docScroller()) {
      activeScrollTarget = docScroller();
      scheduleUpdate();
      return;
    }
    if (!(event.target instanceof Element)) return;
    const pageTarget = pageScrollTargetFrom(event.target);
    if (pageTarget !== docScroller() && isScrollable(pageTarget)) {
      activeScrollTarget = pageTarget;
      scheduleUpdate();
    }
  }

  function observeStateChanges() {
    const shell = document.getElementById('appShell');
    const auth = document.getElementById('authScreen');
    if ('MutationObserver' in window) {
      shellObserver = new MutationObserver(scheduleUpdate);
      if (shell) shellObserver.observe(shell, { attributes: true, attributeFilter: ['class', 'hidden'] });
      if (auth) shellObserver.observe(auth, { attributes: true, attributeFilter: ['class', 'hidden'] });

      // Observe only known modal backdrops, not the whole app DOM.
      modalObserver = new MutationObserver(scheduleUpdate);
      document.querySelectorAll('.modal-backdrop, .media-viewer-backdrop, .a5-chat-lightbox').forEach(el => {
        modalObserver.observe(el, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
      });
    }
  }

  function boot() {
    if (!document.body || document.getElementById('a5UiExtrasProgress')) return;

    progressRoot = document.createElement('div');
    progressRoot.className = 'a5-ui-scroll-progress';
    progressRoot.id = 'a5UiExtrasProgress';
    progressRoot.setAttribute('aria-hidden', 'true');
    progressFill = document.createElement('span');
    progressRoot.appendChild(progressFill);

    topButton = document.createElement('button');
    topButton.className = 'a5-ui-back-to-top';
    topButton.id = 'a5UiExtrasTopButton';
    topButton.type = 'button';
    topButton.title = 'Về đầu trang';
    topButton.setAttribute('aria-label', 'Cuộn về đầu trang');
    topButton.setAttribute('aria-hidden', 'true');
    topButton.tabIndex = -1;
    topButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/></svg>';
    topButton.addEventListener('click', scrollToTop);

    document.body.append(progressRoot, topButton);
    activeScrollTarget = docScroller();
    observeStateChanges();
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('pageshow', scheduleUpdate, { passive: true });
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('button, a, [data-tab], [data-action]')) {
        window.setTimeout(scheduleUpdate, 0);
      }
    }, true);
    scheduleUpdate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
