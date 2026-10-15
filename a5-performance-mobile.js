/* A5 Performance + Mobile Experience v1.0
   Lightweight media hints, constrained-device profile and safe mobile tab swipes.
   No external libraries, no network calls, no Supabase/data mutations. */
(() => {
  'use strict';
  if (window.__A5_PERFORMANCE_MOBILE_V1__) return;
  window.__A5_PERFORMANCE_MOBILE_V1__ = true;

  const root = document.documentElement;
  const mobileQuery = window.matchMedia?.('(max-width: 760px) and (pointer: coarse)');
  const reduceQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let mutationObserver = null;
  let queuedRoots = new Set();
  let mediaFrame = 0;
  let gesture = null;

  function updateDeviceProfile() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const lowMemory = Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory > 0 && navigator.deviceMemory <= 2;
    const saveData = Boolean(connection?.saveData);
    const slowNetwork = ['slow-2g', '2g'].includes(String(connection?.effectiveType || '').toLowerCase());
    root.classList.toggle('a5-perf-lite', lowMemory || saveData || slowNetwork);
    root.classList.toggle('a5-mobile-touch', Boolean(mobileQuery?.matches));
  }

  function isInImmediateViewer(img) {
    return Boolean(img.closest(
      '.viewer-media-content, .media-viewer-backdrop:not(.hidden), #mediaViewerModal:not(.hidden), .media-editor-modal, .crop-editor-modal, .a5-chat-lightbox:not(.hidden)'
    ));
  }

  function tuneImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    const immediate = isInImmediateViewer(img) || Boolean(img.closest('#topAvatarButton, .top-avatar, #profileLargeAvatar, #publicProfileAvatar, #a5ChatThreadAvatar'));
    if (!img.hasAttribute('loading')) img.loading = immediate ? 'eager' : 'lazy';
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    if (!img.hasAttribute('fetchpriority') && !immediate && img.closest('.media-grid, .people-grid, .profile-archive-tiles, #publicProfilePhotos, #onThisDayGrid')) {
      img.setAttribute('fetchpriority', 'low');
    }
  }

  function tuneVideo(video) {
    if (!(video instanceof HTMLVideoElement)) return;
    /* Don't prefetch complete clip files in scrolling cards; viewers/editors keep their own behavior. */
    const inList = video.closest('.media-grid, .people-grid, .profile-archive-tiles, #publicProfilePhotos, #onThisDayGrid');
    const inPlayer = video.closest('.viewer-media-content, .media-viewer-backdrop:not(.hidden), .media-editor-modal, .crop-editor-modal, .trim-preview-video');
    if (inList && !inPlayer && !video.hasAttribute('preload')) video.preload = 'none';
    if (inList && !inPlayer && !video.hasAttribute('playsinline')) video.setAttribute('playsinline', '');
  }

  function processAddedRoot(node) {
    if (!(node instanceof Element)) return;
    if (node.matches('img')) tuneImage(node);
    else if (node.matches('video')) tuneVideo(node);
    node.querySelectorAll?.('img').forEach(tuneImage);
    node.querySelectorAll?.('video').forEach(tuneVideo);
  }

  function scheduleMediaHints(nodes) {
    for (const node of nodes) if (node instanceof Element) queuedRoots.add(node);
    if (mediaFrame) return;
    mediaFrame = requestAnimationFrame(() => {
      mediaFrame = 0;
      const roots = [...queuedRoots];
      queuedRoots.clear();
      /* Skip descendants already covered by a queued ancestor. */
      const minimal = roots.filter(node => !roots.some(other => other !== node && other.contains(node)));
      minimal.forEach(processAddedRoot);
    });
  }

  function hydrateMediaHints() {
    scheduleMediaHints([document.body]);
    if (!('MutationObserver' in window) || !document.body) return;
    mutationObserver = new MutationObserver(records => {
      const added = [];
      for (const record of records) {
        for (const node of record.addedNodes) if (node instanceof Element) added.push(node);
      }
      if (added.length) scheduleMediaHints(added);
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  const BLOCK_SWIPE = [
    'button', 'a', 'input', 'textarea', 'select', 'option', 'video', 'audio', 'canvas',
    '[contenteditable="true"]', '[data-a5-no-swipe]', '.media-card', '.memory-card',
    '.person-card', '.yearbook-spread', '.yearbook-book-shell', '.yearbook-page-controls',
    '.media-grid', '.people-grid', '.filter-pills', '.gallery-sort-group', '.memory-filter-right',
    '.modal-card', '.modal-backdrop', '.comments-list', '.a5-chat-layout', '.a5-chat-messages',
    '.a5-chat-conversation-list', '.classroom-rows', '.crop-canvas-wrap', '#imageCropCanvas',
    '.profile-archive-tiles', '.viewer-media-content'
  ].join(',');
  const SWIPE_START = '.home-hero, .page-title-row, .a5-chat-page-heading';

  function activeMobileTabs() {
    return [...document.querySelectorAll('.mobile-nav [data-tab]')]
      .filter(button => button instanceof HTMLButtonElement && !button.disabled && button.getClientRects().length);
  }

  function activeTabIndex(tabs) {
    const activePage = document.querySelector('.page-view.active[id^="page-"]');
    const name = activePage?.id.replace(/^page-/, '');
    return tabs.findIndex(button => button.dataset.tab === name || button.classList.contains('active'));
  }

  function goToTabOffset(offset) {
    if (!mobileQuery?.matches || reduceQuery?.matches) return;
    const tabs = activeMobileTabs();
    if (tabs.length < 2) return;
    const currentIndex = activeTabIndex(tabs);
    if (currentIndex < 0) return;
    const next = tabs[currentIndex + offset];
    if (!next) return; // no loop-around: predictable like native page navigation
    next.click();
  }

  function handlePointerDown(event) {
    if (!mobileQuery?.matches || event.pointerType !== 'touch' || event.isPrimary === false || event.button !== 0) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest(BLOCK_SWIPE)) return;
    if (!target.closest(SWIPE_START)) return;
    const activePage = target.closest('.page-view.active');
    if (!activePage) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, target, page: activePage, at: performance.now() };
  }

  function handlePointerUp(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const start = gesture;
    gesture = null;
    if (!mobileQuery?.matches || !start.page.isConnected || !start.page.classList.contains('active')) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const elapsed = performance.now() - start.at;
    if (Math.abs(dx) < 84 || Math.abs(dy) > 76 || Math.abs(dx) < Math.abs(dy) * 1.35 || elapsed > 950) return;
    if (event.target instanceof Element && event.target.closest(BLOCK_SWIPE)) return;
    goToTabOffset(dx < 0 ? 1 : -1);
  }

  function bindSwipeNavigation() {
    if (!window.PointerEvent || !mobileQuery) return;
    document.addEventListener('pointerdown', handlePointerDown, { passive: true, capture: true });
    document.addEventListener('pointerup', handlePointerUp, { passive: true, capture: true });
    document.addEventListener('pointercancel', () => { gesture = null; }, { passive: true, capture: true });
    mobileQuery.addEventListener?.('change', updateDeviceProfile);
    reduceQuery?.addEventListener?.('change', () => { gesture = null; });
  }

  function boot() {
    updateDeviceProfile();
    hydrateMediaHints();
    bindSwipeNavigation();
    /* Connection settings may change during the session; this event is cheap and rare. */
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    connection?.addEventListener?.('change', updateDeviceProfile);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
