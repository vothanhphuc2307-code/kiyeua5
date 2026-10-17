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
