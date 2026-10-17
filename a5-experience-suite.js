/* A5 Experience Suite runtime — local-only, modular, no external libraries. */
(function (window, document) {
  'use strict';
  if (window.A5ExperienceSuite && window.A5ExperienceSuite.version === '1.0.0') return;
  const modules = [];
  const cleanups = [];
  const reporters = [];
  const metrics = [];
  const state = {
    startedAt: Date.now(),
    moduleErrors: 0,
    longTaskCount: 0,
    cumulativeLayoutShift: 0,
    imageLoadCount: 0,
    imageErrorCount: 0,
    videoCount: 0,
    lastNavigationMs: null,
    lastViewerOpenMs: null,
    interactionCount: 0,
    reducedMotion: false,
    saveData: false
  };
  const now = () => (window.performance && typeof performance.now === 'function' ? performance.now() : Date.now());
  const capMetric = (name, value, detail = {}) => {
    const safeDetail = {};
    for (const [key, val] of Object.entries(detail || {})) {
      if (val == null || ['string', 'number', 'boolean'].includes(typeof val)) {
        if (typeof val === 'string') safeDetail[key] = val.slice(0, 80);
        else safeDetail[key] = val;
      }
    }
    metrics.push({ name: String(name).slice(0, 64), value: Number.isFinite(Number(value)) ? Number(value) : null, at: Math.round(now()), detail: safeDetail });
    if (metrics.length > 120) metrics.splice(0, metrics.length - 120);
  };
  const appIsOpen = () => {
    const shell = document.getElementById('appShell');
    const auth = document.getElementById('authScreen');
    if (!shell || shell.classList.contains('hidden')) return false;
    if (auth && !auth.classList.contains('hidden')) return false;
    try { return window.getComputedStyle(shell).display !== 'none'; } catch (_) { return true; }
  };
  const ctx = {
    state,
    metrics,
    now,
    query: (selector, root = document) => root.querySelector(selector),
    queryAll: (selector, root = document) => Array.from(root.querySelectorAll(selector)),
    isAppOpen: appIsOpen,
    metric: capMetric,
    addCleanup(fn) { if (typeof fn === 'function') cleanups.push(fn); },
    on(target, type, handler, options) {
      if (!target || !target.addEventListener) return () => {};
      target.addEventListener(type, handler, options);
      const off = () => target.removeEventListener(type, handler, options);
      cleanups.push(off);
      return off;
    },
    onMediaRefresh(fn) { if (typeof fn === 'function') mediaProcessors.push(fn); },
    refreshMedia(root = document) { for (const fn of mediaProcessors) { try { fn(root); } catch (error) { api.reportModuleError('media-refresh', error); } } },
    addReporter(fn) { if (typeof fn === 'function') reporters.push(fn); },
    reportModuleError(name, error) {
      state.moduleErrors += 1;
      capMetric('module_error', 1, { module: String(name || 'unknown'), kind: error && error.name ? String(error.name) : 'Error' });
      try { console.warn('[A5 Experience] module skipped:', name, error && error.message ? error.message : error); } catch (_) {}
    },
    scheduleIdle(fn, timeout = 1200) {
      if (typeof fn !== 'function') return;
      if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout });
      else window.setTimeout(fn, 60);
    }
  };
  const mediaProcessors = [];
  const api = {
    version: '1.0.0',
    state,
    metrics,
    register(name, init) { if (typeof init === 'function') modules.push({ name, init }); },
    getReport() {
      const nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
      const report = {
        product: 'A5 Experience Suite', version: '1.0.0', generatedAt: new Date().toISOString(),
        environment: {
          viewport: { width: window.innerWidth || 0, height: window.innerHeight || 0 },
          devicePixelRatio: Math.round((window.devicePixelRatio || 1) * 100) / 100,
          reducedMotion: Boolean(state.reducedMotion), saveData: Boolean(state.saveData),
          connectionType: (navigator.connection && navigator.connection.effectiveType) || 'unknown',
          page: (document.querySelector('.nav-item.active[data-tab], .mobile-nav-item.active[data-tab]') || {}).dataset?.tab || 'unknown',
          appOpen: appIsOpen()
        },
        navigation: nav ? {
          responseStartMs: Math.round(nav.responseStart || 0), domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd || 0),
          loadEventMs: Math.round(nav.loadEventEnd || 0), transferBytes: Number(nav.transferSize || 0)
        } : null,
        runtime: {
          uptimeMs: Math.round(Math.max(0, Date.now() - state.startedAt)), moduleErrors: state.moduleErrors,
          longTaskCount: state.longTaskCount, cumulativeLayoutShift: Math.round(state.cumulativeLayoutShift * 10000) / 10000,
          imageLoadCount: state.imageLoadCount, imageErrorCount: state.imageErrorCount, videoCount: state.videoCount,
          interactionCount: state.interactionCount, lastNavigationMs: state.lastNavigationMs, lastViewerOpenMs: state.lastViewerOpenMs
        },
        resources: null,
        metrics: metrics.slice(-100)
      };
      for (const reporter of reporters) { try { const extra = reporter(); if (extra && typeof extra === 'object') Object.assign(report, extra); } catch (_) {} }
      return report;
    },
    start() {
      if (api.started) return;
      api.started = true;
      for (const module of modules) {
        try { const cleanup = module.init(ctx); if (typeof cleanup === 'function') cleanups.push(cleanup); }
        catch (error) { ctx.reportModuleError(module.name, error); }
      }
      capMetric('suite_started', 1, { modules: modules.length });
    },
    dispose() {
      while (cleanups.length) { try { cleanups.pop()(); } catch (_) {} }
      api.started = false;
    }
  };
  window.A5ExperienceSuite = api;
  window.A5ExperienceSuiteContext = ctx;
})(window, document);

/* ===== 01-auth-visibility.js ===== */
/* Gate toolkit UI and diagnostics behind the signed-in application shell. */
window.A5ExperienceSuite.register('auth-visibility', function (ctx) {
  const sync = () => {
    const open = ctx.isAppOpen();
    document.body.classList.toggle('a5-exp-app-open', open);
    document.body.classList.toggle('a5-exp-auth-open', !open);
    const panel = document.getElementById('a5-experience-diagnostics');
    if (panel && !open) panel.hidden = true;
  };
  sync();
  const observer = new MutationObserver(sync);
  ['appShell', 'authScreen'].forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] }); });
  ctx.addCleanup(() => observer.disconnect());
});

/* ===== 02-motion-preference.js ===== */
/* Respect operating-system reduced-motion preference without cancelling existing A5 motion. */
window.A5ExperienceSuite.register('motion-preference', function (ctx) {
  const media = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const sync = () => {
    ctx.state.reducedMotion = Boolean(media && media.matches);
    document.documentElement.dataset.a5ExpReducedMotion = ctx.state.reducedMotion ? 'true' : 'false';
  };
  sync();
  if (media) {
    if (media.addEventListener) ctx.on(media, 'change', sync);
    else if (media.addListener) { media.addListener(sync); ctx.addCleanup(() => media.removeListener(sync)); }
  }
});

/* ===== 03-document-visibility.js ===== */
/* Pause only this suite's decorative loading effects when the tab is hidden. */
window.A5ExperienceSuite.register('document-visibility', function (ctx) {
  const sync = () => document.body.classList.toggle('a5-exp-document-hidden', document.hidden);
  sync(); ctx.on(document, 'visibilitychange', sync);
  ctx.on(window, 'pagehide', () => document.body.classList.add('a5-exp-document-hidden'));
  ctx.on(window, 'pageshow', sync);
});

/* ===== 04-input-capabilities.js ===== */
/* Expose coarse pointer / hover capability as data attributes for scoped styling. */
window.A5ExperienceSuite.register('input-capabilities', function () {
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)');
  const hover = window.matchMedia && window.matchMedia('(hover: hover)');
  const sync = () => {
    document.documentElement.dataset.a5ExpPointer = coarse && coarse.matches ? 'coarse' : 'fine';
    document.documentElement.dataset.a5ExpHover = hover && hover.matches ? 'yes' : 'no';
  };
  sync();
  [coarse, hover].filter(Boolean).forEach(m => { if (m.addEventListener) m.addEventListener('change', sync); });
});

/* ===== 05-media-hints.js ===== */
/* Scope media optimisations to real A5 media lists and the existing viewer. */
window.A5ExperienceSuite.register('media-hints', function (ctx) {
  const roots = ['#homeMediaGrid', '#galleryMediaGrid', '.gallery-grid', '#yearbookSpread', '#onThisDayGrid', '#profileMediaGrid', '#profileArchiveGrid', '#viewerMediaContent'];
  const isAvatar = img => Boolean(img.closest('.avatar, .top-avatar, .profile-large-avatar, .public-profile-avatar, .a5-chat-avatar, .person-avatar, .sidebar-user'));
  const process = root => {
    if (!root || !root.querySelectorAll) return;
    const list = [];
    if (root.matches && root.matches('img')) list.push(root);
    roots.forEach(selector => { if (root.matches && root.matches(selector)) list.push(...ctx.queryAll('img', root)); });
    if (root === document || root === document.body || root.matches?.('.page-content')) roots.forEach(selector => list.push(...ctx.queryAll(`${selector} img`, root === document ? document : root)));
    else if (root.querySelectorAll && !root.matches?.('img') && list.length === 0) list.push(...ctx.queryAll('img', root));
    for (const img of new Set(list)) {
      if (isAvatar(img) || img.closest('#mediaViewerModal')) continue;
      if (!img.hasAttribute('decoding')) img.decoding = 'async';
      if (!img.hasAttribute('loading')) img.loading = 'lazy';
      const card = img.closest('.a5-home-memory-card');
      if (card) {
        const front = card.dataset.homeDeckPos === '0' || card.dataset.a5HomeDeckPos === '0';
        img.loading = front ? 'eager' : 'lazy';
        try { img.fetchPriority = front ? 'high' : 'low'; } catch (_) {}
      } else if (!img.hasAttribute('fetchpriority')) {
        try { img.fetchPriority = 'low'; } catch (_) {}
      }
    }
  };
  ctx.onMediaRefresh(process);
  process(document);
});

/* ===== 06-image-loading-state.js ===== */
/* Add low-cost pending/ready classes to media thumbnails; never replace app src values. */
window.A5ExperienceSuite.register('image-loading-state', function (ctx) {
  const seen = new WeakSet();
  const process = root => {
    if (!root || !root.querySelectorAll) return;
    const images = [];
    if (root.matches && root.matches('img')) images.push(root);
    images.push(...ctx.queryAll('#homeMediaGrid img, #galleryMediaGrid img, .gallery-grid img, #yearbookSpread img, #onThisDayGrid img, #profileMediaGrid img, #profileArchiveGrid img', root));
    for (const img of new Set(images)) {
      if (img.closest('.avatar, .top-avatar, .profile-large-avatar, .public-profile-avatar, .a5-chat-avatar, #mediaViewerModal')) continue;
      img.classList.add('a5-exp-media-image');
      if (seen.has(img)) continue;
      seen.add(img);
      const started = ctx.now();
      if (img.complete) {
        if (img.naturalWidth > 0) img.classList.add('a5-exp-media-ready');
        else if (img.currentSrc || img.src) img.classList.add('a5-exp-media-broken');
        continue;
      }
      img.classList.add('a5-exp-media-pending');
      img.addEventListener('load', () => {
        img.classList.remove('a5-exp-media-pending'); img.classList.add('a5-exp-media-ready');
        ctx.state.imageLoadCount += 1; ctx.metric('thumbnail_loaded_ms', ctx.now() - started, { category: 'image' });
      }, { once: true });
      img.addEventListener('error', () => {
        img.classList.remove('a5-exp-media-pending'); img.classList.add('a5-exp-media-broken');
        ctx.state.imageErrorCount += 1; ctx.metric('thumbnail_error', 1, { category: 'image' });
      }, { once: true });
    }
  };
  ctx.onMediaRefresh(process); process(document);
});

/* ===== 07-broken-media.js ===== */
/* Mark the immediate media wrapper when an image fails; preserve layout and content. */
window.A5ExperienceSuite.register('broken-media', function (ctx) {
  const process = root => {
    if (!root || !root.querySelectorAll) return;
    const images = [];
    if (root.matches && root.matches('img')) images.push(root);
    const mediaSelectors = ['#homeMediaGrid img', '#galleryMediaGrid img', '.gallery-grid img', '#yearbookSpread img', '#onThisDayGrid img', '#profileMediaGrid img', '#profileArchiveGrid img'];
    if (root === document || root.matches?.('.page-content')) mediaSelectors.forEach(selector => images.push(...ctx.queryAll(selector, root)));
    else if (!root.matches?.('img')) images.push(...ctx.queryAll('img', root));
    for (const img of images) {
      if (!img.matches('img') || img.dataset.a5ExpFallbackBound) continue;
      img.dataset.a5ExpFallbackBound = '1';
      img.addEventListener('error', () => {
        const wrapper = img.closest('.a5-home-memory-cover, .memory-card-media, .yearbook-polaroid, .on-this-day-card, .media-thumb') || img.parentElement;
        wrapper?.classList.add('a5-exp-has-media-error');
      }, { once: true });
      if (img.classList.contains('a5-exp-media-broken')) {
        const wrapper = img.closest('.a5-home-memory-cover, .memory-card-media, .yearbook-polaroid, .on-this-day-card, .media-thumb') || img.parentElement;
        wrapper?.classList.add('a5-exp-has-media-error');
      }
    }
  };
  ctx.onMediaRefresh(process); process(document);
});

/* ===== 08-video-budget.js ===== */
/* Thumbnails never pre-download video content; the existing full viewer is untouched. */
window.A5ExperienceSuite.register('video-budget', function (ctx) {
  const process = root => {
    if (!root || !root.querySelectorAll) return;
    const videos = [];
    if (root.matches && root.matches('video')) videos.push(root);
    videos.push(...ctx.queryAll('#homeMediaGrid video, #galleryMediaGrid video, .gallery-grid video, #yearbookSpread video, #onThisDayGrid video, #profileMediaGrid video, #profileArchiveGrid video', root));
    for (const video of new Set(videos)) {
      if (video.closest('#mediaViewerModal, #viewerMediaContent')) { ctx.state.videoCount += video.dataset.a5ExpCounted ? 0 : 1; video.dataset.a5ExpCounted = '1'; continue; }
      video.preload = 'none';
      video.setAttribute('playsinline', '');
      video.dataset.a5ExpThumbnail = '1';
      if (!video.dataset.a5ExpErrorBound) {
        video.dataset.a5ExpErrorBound = '1';
        video.addEventListener('error', () => {
          const wrapper = video.closest('.yearbook-video-visual, .media-thumb, .memory-card-media') || video.parentElement;
          wrapper?.classList.add('a5-exp-video-error');
        }, { once: true });
      }
    }
  };
  ctx.onMediaRefresh(process); process(document);
});

/* ===== 09-home-deck-priority.js ===== */
/* The first home card remains eager; cards behind it stay lazy and low priority. */
window.A5ExperienceSuite.register('home-deck-priority', function (ctx) {
  const process = root => {
    const rail = root && root.querySelector ? (root.matches?.('#homeMediaGrid') ? root : root.querySelector('#homeMediaGrid')) : null;
    if (!rail) return;
    const cards = ctx.queryAll(':scope > .a5-home-memory-card', rail);
    cards.forEach((card, index) => {
      card.dataset.a5ExpDeckIndex = String(index);
      const img = card.querySelector('img');
      if (!img) return;
      img.decoding = 'async';
      img.loading = index === 0 ? 'eager' : 'lazy';
      try { img.fetchPriority = index === 0 ? 'high' : 'low'; } catch (_) {}
    });
    ctx.metric('home_deck_rendered_cards', cards.length, { maxVisible: 4 });
  };
  ctx.onMediaRefresh(process); process(document);
});

/* ===== 10-dynamic-dom-observer.js ===== */
/* The only scoped DOM observer; batches inserted nodes to one frame. */
window.A5ExperienceSuite.register('dynamic-dom-observer', function (ctx) {
  const root = document.querySelector('.page-content');
  ctx.refreshMedia(document);
  if (!root || !('MutationObserver' in window)) return;
  let queued = false; const pending = new Set();
  const observer = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) pending.add(node);
    if (queued || !pending.size) return;
    queued = true;
    const run = () => { queued = false; const nodes = Array.from(pending); pending.clear(); nodes.forEach(node => ctx.refreshMedia(node)); };
    if ('requestAnimationFrame' in window) requestAnimationFrame(run); else setTimeout(run, 16);
  });
  observer.observe(root, { childList: true, subtree: true });
  ctx.addCleanup(() => observer.disconnect());
});

/* ===== 11-navigation-metrics.js ===== */
/* Measure the interaction-to-next-paint proxy for tab switches, not network time. */
window.A5ExperienceSuite.register('navigation-metrics', function (ctx) {
  let token = 0;
  ctx.on(document, 'click', event => {
    const target = event.target.closest('[data-tab]');
    if (!target || !ctx.isAppOpen()) return;
    const started = ctx.now(); const id = ++token; const tab = (target.dataset.tab || 'unknown').slice(0, 24);
    const finish = () => {
      if (id !== token) return;
      const elapsed = Math.max(0, ctx.now() - started);
      ctx.state.lastNavigationMs = Math.round(elapsed * 10) / 10;
      ctx.metric('tab_next_paint_proxy_ms', elapsed, { tab });
    };
    requestAnimationFrame(() => requestAnimationFrame(finish));
  }, true);
});

/* ===== 12-viewer-metrics.js ===== */
/* Measure time from selecting a memory card to the existing viewer opening. */
window.A5ExperienceSuite.register('viewer-metrics', function (ctx) {
  ctx.on(document, 'click', event => {
    const trigger = event.target.closest('[data-action="open-viewer"][data-media-id]');
    if (!trigger || !ctx.isAppOpen()) return;
    const started = ctx.now();
    let frames = 0;
    const check = () => {
      const viewer = document.getElementById('mediaViewerModal');
      if (viewer && !viewer.classList.contains('hidden')) {
        const elapsed = Math.max(0, ctx.now() - started);
        ctx.state.lastViewerOpenMs = Math.round(elapsed * 10) / 10;
        ctx.metric('viewer_open_ui_ms', elapsed, { kind: 'media-viewer' });
        return;
      }
      if (++frames < 30) requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }, true);
});

/* ===== 13-navigation-timing.js ===== */
/* Keep only numeric Navigation Timing values; never persist full resource URLs. */
window.A5ExperienceSuite.register('navigation-timing', function (ctx) {
  const collect = () => {
    const entry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (!entry) return;
    ctx.metric('navigation_response_start_ms', entry.responseStart || 0, { category: 'navigation' });
    ctx.metric('navigation_dom_ready_ms', entry.domContentLoadedEventEnd || 0, { category: 'navigation' });
    ctx.metric('navigation_load_event_ms', entry.loadEventEnd || 0, { category: 'navigation' });
  };
  if (document.readyState === 'complete') ctx.scheduleIdle(collect, 2000); else ctx.on(window, 'load', () => ctx.scheduleIdle(collect, 2000), { once: true });
});

/* ===== 14-resource-summary.js ===== */
/* Aggregate resources by type, with no URL, query string, or filename in report. */
window.A5ExperienceSuite.register('resource-summary', function (ctx) {
  const snapshot = () => {
    const entries = performance.getEntriesByType ? performance.getEntriesByType('resource') : [];
    const groups = {};
    for (const item of entries) {
      const type = String(item.initiatorType || 'other').slice(0, 24);
      const g = groups[type] || (groups[type] = { count: 0, totalDurationMs: 0, transferBytes: 0, encodedBytes: 0 });
      g.count += 1; g.totalDurationMs += Number(item.duration || 0); g.transferBytes += Number(item.transferSize || 0); g.encodedBytes += Number(item.encodedBodySize || 0);
    }
    Object.values(groups).forEach(g => { g.totalDurationMs = Math.round(g.totalDurationMs); });
    return { resources: { totalCount: entries.length, byType: groups } };
  };
  ctx.addReporter(snapshot);
  ctx.on(window, 'pagehide', () => { try { ctx.metric('resource_entry_count', performance.getEntriesByType('resource').length, { category: 'resources' }); } catch (_) {} });
});

/* ===== 15-long-task-observer.js ===== */
/* Long task counter; supported Chromium browsers only. */
window.A5ExperienceSuite.register('long-task-observer', function (ctx) {
  if (!('PerformanceObserver' in window)) return;
  try {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        ctx.state.longTaskCount += 1;
        ctx.metric('long_task_ms', entry.duration, { category: 'main-thread' });
      }
    });
    observer.observe({ type: 'longtask', buffered: true });
    ctx.addCleanup(() => observer.disconnect());
  } catch (_) {}
});

/* ===== 16-layout-shift-observer.js ===== */
/* Cumulative layout shift observer; ignores shifts tied to recent user input. */
window.A5ExperienceSuite.register('layout-shift-observer', function (ctx) {
  if (!('PerformanceObserver' in window)) return;
  try {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) ctx.state.cumulativeLayoutShift += Number(entry.value || 0);
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    ctx.addCleanup(() => observer.disconnect());
  } catch (_) {}
});

/* ===== 17-network-hints.js ===== */
/* Use browser data-saver hints to reduce only this suite's decorative work. */
window.A5ExperienceSuite.register('network-hints', function (ctx) {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const sync = () => {
    const saveData = Boolean(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));
    ctx.state.saveData = saveData;
    document.documentElement.classList.toggle('a5-exp-low-data', saveData);
    document.documentElement.dataset.a5ExpNetwork = saveData ? 'conserve' : 'normal';
  };
  sync();
  if (connection && connection.addEventListener) ctx.on(connection, 'change', sync);
});

/* ===== 18-interaction-metrics.js ===== */
/* Capture lightweight interaction timing without labels, user content, or text. */
window.A5ExperienceSuite.register('interaction-metrics', function (ctx) {
  const starts = new WeakMap();
  ctx.on(document, 'pointerdown', event => {
    const target = event.target.closest('button, a, [role="button"], [data-tab], [data-action]');
    if (target && ctx.isAppOpen()) starts.set(target, ctx.now());
  }, true);
  ctx.on(document, 'click', event => {
    const target = event.target.closest('button, a, [role="button"], [data-tab], [data-action]');
    if (!target || !ctx.isAppOpen()) return;
    const started = starts.get(target);
    if (typeof started === 'number') {
      ctx.state.interactionCount += 1;
      ctx.metric('pointer_to_click_ms', Math.max(0, ctx.now() - started), { control: target.hasAttribute('data-tab') ? 'navigation' : target.hasAttribute('data-action') ? 'action' : 'control' });
      starts.delete(target);
    }
  }, true);
});

/* ===== 19-deck-diagnostics.js ===== */
/* Record home deck node count only when that small collection changes. */
window.A5ExperienceSuite.register('deck-diagnostics', function (ctx) {
  const rail = document.getElementById('homeMediaGrid');
  if (!rail) return;
  const update = () => {
    const cards = rail.querySelectorAll(':scope > .a5-home-memory-card');
    ctx.metric('home_deck_dom_card_count', cards.length, { expectedMax: 4 });
  };
  update();
  if ('MutationObserver' in window) {
    const observer = new MutationObserver(update); observer.observe(rail, { childList: true }); ctx.addCleanup(() => observer.disconnect());
  }
});

/* ===== 20-accessibility.js ===== */
/* Add defensive aria labels only when absent; do not overwrite app-authored labels. */
window.A5ExperienceSuite.register('accessibility', function (ctx) {
  const apply = root => {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('alt') && !img.closest('.avatar, .a5-chat-avatar, .decorative, [aria-hidden="true"]')) img.setAttribute('alt', '');
    });
  };
  apply(document);
  ctx.onMediaRefresh(apply);
  ctx.on(document, 'keydown', event => {
    if (event.key === 'Escape') document.getElementById('a5-experience-diagnostics')?.setAttribute('hidden', '');
  });
});

/* ===== 21-safe-external-links.js ===== */
/* Security hygiene for future links; no destination is changed. */
window.A5ExperienceSuite.register('safe-external-links', function (ctx) {
  const apply = root => {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('a[target="_blank"]').forEach(link => {
      const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener'); rel.add('noreferrer'); link.setAttribute('rel', Array.from(rel).join(' '));
    });
  };
  apply(document); ctx.onMediaRefresh(apply);
});

/* ===== 22-effect-budget.js ===== */
/* Use lower-cost treatment only for suite-owned UI on coarse/low-data devices. */
window.A5ExperienceSuite.register('effect-budget', function (ctx) {
  const sync = () => {
    const coarse = document.documentElement.dataset.a5ExpPointer === 'coarse';
    document.documentElement.classList.toggle('a5-exp-mobile', coarse);
    document.documentElement.classList.toggle('a5-exp-reduced-work', coarse || ctx.state.saveData || ctx.state.reducedMotion);
  };
  sync();
  ctx.on(window, 'resize', sync, { passive: true });
  ctx.on(window, 'orientationchange', sync, { passive: true });
});

/* ===== 23-pageshow-media-refresh.js ===== */
/* Refresh safe media hints when a page returns from the back-forward cache. */
window.A5ExperienceSuite.register('pageshow-media-refresh', function (ctx) {
  ctx.on(window, 'pageshow', () => ctx.refreshMedia(document));
});

/* ===== 24-idle-audit.js ===== */
/* Do the first diagnostic snapshot at idle; do not delay app initialization. */
window.A5ExperienceSuite.register('idle-audit', function (ctx) {
  ctx.scheduleIdle(() => {
    try {
      const imgCount = document.querySelectorAll('#homeMediaGrid img, #galleryMediaGrid img, .gallery-grid img, #yearbookSpread img').length;
      ctx.metric('visible_media_dom_count', imgCount, { category: 'media' });
    } catch (_) {}
  }, 1800);
});

/* ===== 25-error-observer.js ===== */
/* Store only error categories locally; never transmit error details or user data. */
window.A5ExperienceSuite.register('error-observer', function (ctx) {
  ctx.on(window, 'error', event => {
    if (event && event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
      ctx.metric('asset_error', 1, { kind: String(event.target.tagName).toLowerCase() });
    } else ctx.metric('window_error', 1, { kind: 'runtime' });
  }, true);
  ctx.on(window, 'unhandledrejection', () => ctx.metric('promise_rejection', 1, { kind: 'unhandled' }));
});

/* ===== 26-diagnostics-panel.js ===== */
/* On-demand local diagnostics, Alt+Shift+E. No panel is shown during login. */
window.A5ExperienceSuite.register('diagnostics-panel', function (ctx) {
  let panel = null;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const ensure = () => {
    if (panel) return panel;
    panel = document.createElement('section');
    panel.id = 'a5-experience-diagnostics'; panel.className = 'a5-exp-diagnostics-panel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'A5 Performance Diagnostics');
    panel.innerHTML = '<div class="a5-exp-diagnostics-head"><span class="a5-exp-diagnostics-mark" aria-hidden="true">✿</span><div><strong>A5 Performance Lab</strong><small>Chỉ đo cục bộ trên thiết bị này</small></div><button type="button" data-a5-exp-close aria-label="Đóng bảng">×</button></div><div class="a5-exp-diagnostics-body"><div class="a5-exp-stat-grid" data-a5-exp-stats></div><p class="a5-exp-diagnostics-hint">Mở bằng Alt + Shift + E. Báo cáo không chứa URL, tên tài khoản, nội dung chat hay chú thích ảnh.</p></div><div class="a5-exp-diagnostics-actions"><button type="button" data-a5-exp-refresh>Làm mới</button><button type="button" data-a5-exp-export>Tải báo cáo JSON</button></div>';
    document.body.appendChild(panel);
    panel.addEventListener('click', event => {
      if (event.target.closest('[data-a5-exp-close]')) panel.hidden = true;
      if (event.target.closest('[data-a5-exp-refresh]')) refresh();
      if (event.target.closest('[data-a5-exp-export]')) download();
    });
    return panel;
  };
  const refresh = () => {
    const p = ensure(); const report = window.A5ExperienceSuite.getReport();
    const stats = [
      ['Mở trang', report.navigation ? `${report.navigation.domContentLoadedMs} ms` : 'Không hỗ trợ'],
      ['Chuyển tab', report.runtime.lastNavigationMs == null ? 'Chưa đo' : `${report.runtime.lastNavigationMs} ms`],
      ['Mở trình xem', report.runtime.lastViewerOpenMs == null ? 'Chưa đo' : `${report.runtime.lastViewerOpenMs} ms`],
      ['Long tasks', report.runtime.longTaskCount],
      ['Ảnh lỗi', report.runtime.imageErrorCount],
      ['CLS', report.runtime.cumulativeLayoutShift],
      ['Thẻ trên trang chủ', document.querySelectorAll('#homeMediaGrid > .a5-home-memory-card').length],
      ['Chế độ tiết kiệm', report.environment.saveData ? 'Bật' : 'Tắt']
    ];
    const host = p.querySelector('[data-a5-exp-stats]');
    host.innerHTML = stats.map(([label, value]) => `<div class="a5-exp-stat"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join('');
  };
  const download = () => {
    const report = window.A5ExperienceSuite.getReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `a5-performance-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    ctx.metric('diagnostic_export', 1, { format: 'json' });
  };
  ctx.on(document, 'keydown', event => {
    if (!(event.altKey && event.shiftKey && event.code === 'KeyE')) return;
    const target = event.target;
    if (target && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName || ''))) return;
    if (!ctx.isAppOpen()) return;
    event.preventDefault(); const p = ensure(); p.hidden = !p.hidden; if (!p.hidden) refresh();
  });
  ctx.addReporter(() => ({ diagnosticCapabilities: { longTaskObserver: 'PerformanceObserver' in window, resourceTiming: !!(performance.getEntriesByType), pointerType: document.documentElement.dataset.a5ExpPointer || 'unknown' } }));
});

/* Bootstrap once; classic deferred script is loaded after the existing A5 modules. */
(function () {
  const api = window.A5ExperienceSuite;
  if (!api) return;
  const run = () => api.start();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
