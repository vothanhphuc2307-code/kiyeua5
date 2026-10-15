/* A5 Loading Experience v1.0 — startup sparkle + delayed busy-screen manager */
(() => {
  'use strict';

  if (window.__A5_LOADING_EXPERIENCE_V1__) return;
  window.__A5_LOADING_EXPERIENCE_V1__ = true;

  const BUSY_SELECTOR = [
    '.loading-card',
    '.a5-chat-loading',
    '.yearbook-loading-page',
    '.officers-loading',
    '.a5-wish-loading',
    '.profile-archive-loading',
    '.loading-inline',
    '.skeleton-loading',
    '[aria-busy="true"]'
  ].join(',');

  const TAB_LABELS = {
    home: 'Đang trở về trang chủ…',
    gallery: 'Đang sắp xếp những bức ảnh…',
    yearbook: 'Đang gom kỷ niệm vào cuốn sổ…',
    people: 'Đang gọi tên những người bạn…',
    profile: 'Đang mở góc nhỏ của cậu…',
    chat: 'Đang mở góc trò chuyện…'
  };

  let screen, caption;
  let overlayVisibleAt = 0;
  let hideTimer = 0;
  let pageWatchTimer = 0;
  let owners = new Map();
  let sequence = 0;

  const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function enhanceSplash() {
    const splash = document.querySelector('#splash');
    const paper = splash?.querySelector('.splash-paper');
    if (!splash || !paper || paper.dataset.a5Enhanced === 'true') return;
    paper.dataset.a5Enhanced = 'true';
    ['✦', '♡', '✿', '✧'].forEach((symbol, index) => {
      const sparkle = document.createElement('span');
      sparkle.className = 'a5-splash-spark';
      sparkle.setAttribute('aria-hidden', 'true');
      sparkle.textContent = symbol;
      sparkle.dataset.a5Spark = String(index + 1);
      paper.appendChild(sparkle);
    });
  }

  function createOverlay() {
    if (screen) return;
    screen = document.createElement('div');
    screen.id = 'a5LoadingExperience';
    screen.setAttribute('role', 'status');
    screen.setAttribute('aria-live', 'polite');
    screen.setAttribute('aria-hidden', 'true');
    screen.innerHTML = `
      <div class="a5-loading-card" role="presentation">
        <div class="a5-loading-emblem" aria-hidden="true">A5<span class="a5-loading-flower">✿</span></div>
        <h2 class="a5-loading-title">Một chút xíu thôi nha…</h2>
        <p class="a5-loading-caption" id="a5LoadingCaption">Đang chuẩn bị những mảnh ký ức…</p>
        <div class="a5-loading-track" aria-hidden="true"><span></span></div>
        <div class="a5-loading-dots" aria-hidden="true"><i></i><i></i><i></i></div>
      </div>`;
    document.body.appendChild(screen);
    caption = screen.querySelector('#a5LoadingCaption');
  }

  function currentLabel() {
    const values = [...owners.values()];
    return values.length ? values[values.length - 1] : 'Đang chuẩn bị những mảnh ký ức…';
  }

  function syncOverlay() {
    if (!screen) return;
    window.clearTimeout(hideTimer);

    if (owners.size) {
      if (!screen.classList.contains('is-visible')) {
        overlayVisibleAt = performance.now();
        screen.classList.add('is-visible');
        screen.setAttribute('aria-hidden', 'false');
      }
      if (caption) caption.textContent = currentLabel();
      return;
    }

    if (!screen.classList.contains('is-visible')) return;
    const elapsed = performance.now() - overlayVisibleAt;
    const wait = Math.max(150, 430 - elapsed);
    hideTimer = window.setTimeout(() => {
      if (owners.size) return syncOverlay();
      screen.classList.remove('is-visible');
      screen.setAttribute('aria-hidden', 'true');
    }, wait);
  }

  function show(label = 'Đang tải kỷ niệm…', token = 'manual') {
    owners.set(String(token), String(label));
    syncOverlay();
  }

  function hide(token = 'manual') {
    owners.delete(String(token));
    syncOverlay();
  }

  function track(promise, label = 'Đang hoàn thành thao tác…') {
    const token = `track-${++sequence}`;
    const delay = window.setTimeout(() => show(label, token), 420);
    return Promise.resolve(promise).finally(() => {
      window.clearTimeout(delay);
      hide(token);
    });
  }

  window.A5LoadingExperience = Object.freeze({ show, hide, track });

  function activePage() {
    const app = document.querySelector('#appShell');
    if (!app || app.classList.contains('hidden')) return null;
    return app.querySelector('.page-view.active:not(.hidden)');
  }

  function findBusy(page) {
    if (!page) return null;
    const nodes = page.querySelectorAll(BUSY_SELECTOR);
    for (const node of nodes) {
      if (node.closest('.hidden') || node.dataset.a5NoGlobalLoader === 'true') continue;
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      return node;
    }
    return null;
  }

  function labelFor(page, busyNode) {
    if (busyNode?.matches('.a5-chat-loading')) return 'Đang tìm lại tin nhắn…';
    if (busyNode?.matches('.yearbook-loading-page')) return 'Đang gom kỷ niệm vào cuốn sổ…';
    if (busyNode?.matches('.officers-loading')) return 'Đang chuẩn bị danh sách thành viên…';
    const tab = page?.id?.replace(/^page-/, '');
    return TAB_LABELS[tab] || 'Đang chuẩn bị những mảnh ký ức…';
  }

  function startPageWatch(maxDuration = 7800) {
    window.clearTimeout(pageWatchTimer);
    const startedAt = performance.now();
    let busySince = 0;
    let lastLabel = '';
    let stopped = false;

    const step = () => {
      if (stopped) return;
      const now = performance.now();
      const page = activePage();
      const busyNode = findBusy(page);

      if (busyNode) {
        if (!busySince) busySince = now;
        const label = labelFor(page, busyNode);
        if (now - busySince >= 560) {
          if (label !== lastLabel) {
            lastLabel = label;
            show(label, 'auto-page');
          }
        }
      } else {
        busySince = 0;
        if (lastLabel) {
          lastLabel = '';
          hide('auto-page');
        }
      }

      if (now - startedAt >= maxDuration) {
        stopped = true;
        hide('auto-page');
        return;
      }
      pageWatchTimer = window.setTimeout(step, reduceMotion() ? 260 : 180);
    };
    step();
  }

  function watchStartup() {
    const started = performance.now();
    let shown = false;

    const poll = () => {
      const app = document.querySelector('#appShell');
      const auth = document.querySelector('#authScreen');
      const splash = document.querySelector('#splash');
      const shellVisible = app && !app.classList.contains('hidden');
      const authVisible = auth && !auth.classList.contains('hidden');

      if (shellVisible || authVisible) {
        if (shown) hide('startup');
        startPageWatch(5200);
        return;
      }

      if (performance.now() - started > 850) {
        shown = true;
        show('Đang kết nối góc lưu bút A5…', 'startup');
      }
      if (performance.now() - started > 14000) {
        hide('startup');
        return;
      }
      // Place the loader beneath the existing splash; it is revealed as the splash fades.
      if (splash && !splash.classList.contains('done') && screen) screen.style.zIndex = '1900';
      window.setTimeout(poll, 190);
    };
    window.setTimeout(poll, 220);
  }

  function handleIntent(event) {
    const tabButton = event.target.closest?.('[data-tab]');
    const actionButton = event.target.closest?.('[data-action]');
    const action = actionButton?.dataset?.action || '';
    if (!tabButton && !['open-yearbook', 'welcome-yearbook', 'chat-open-conversation'].includes(action)) return;
    // Let the existing A5 click handler perform its navigation first.
    window.setTimeout(() => startPageWatch(7800), 80);
  }

  function init() {
    enhanceSplash();
    createOverlay();
    document.addEventListener('click', handleIntent, true);

    // Catch startup delays even when auth/session resolution has not revealed either screen.
    watchStartup();

    // Expose simple lifecycle hooks for future async flows without patching app.js.
    window.addEventListener('pageshow', () => {
      startPageWatch(5000);
    });

    window.addEventListener('online', () => {
      // A reconnect may trigger loading markers; let the regular delayed watcher decide.
      startPageWatch(6000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();