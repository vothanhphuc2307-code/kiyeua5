/* A5 Smart Motion Engine v2.0 — progressive enhancement only.
   No network calls, no Supabase access, no app.js hooks, no data mutations. */
(function () {
  'use strict';
  try {
    var root = document.documentElement;
    if (!root) return;

    var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var touchQuery = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;
    var smallQuery = window.matchMedia ? window.matchMedia('(max-width: 760px)') : null;
    var liteLocked = false;
    var longTasks = [];

    function getConnection() {
      return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    }

    function syncMode() {
      try {
        var touch = !!((touchQuery && touchQuery.matches) || (smallQuery && smallQuery.matches));
        var lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
        var connection = getConnection();
        var saveData = !!(connection && connection.saveData);
        var reducedMotion = !!(reduceQuery && reduceQuery.matches);

        root.classList.toggle('a5-touch-device', touch);
        root.classList.toggle('a5-prefers-reduced-motion', reducedMotion);
        if (reducedMotion || (touch && (lowMemory || saveData)) || liteLocked) {
          root.classList.add('a5-auto-lite');
        } else {
          root.classList.remove('a5-auto-lite');
        }
      } catch (_) { /* Optional adaptation must never block the page. */ }
    }

    function syncVisibility() {
      try { root.classList.toggle('a5-tab-hidden', document.visibilityState !== 'visible'); }
      catch (_) {}
    }

    function onMediaChange() { syncMode(); }
    [reduceQuery, touchQuery, smallQuery].forEach(function (query) {
      if (query && query.addEventListener) query.addEventListener('change', onMediaChange);
      else if (query && query.addListener) query.addListener(onMediaChange);
    });
    var conn = getConnection();
    if (conn && conn.addEventListener) conn.addEventListener('change', syncMode);
    document.addEventListener('visibilitychange', syncVisibility, { passive: true });
    syncMode();
    syncVisibility();

    /* Best-effort main-thread health signal. This is not an FPS meter.
       After boot, repeated long tasks cause decoration to simplify, not core UI. */
    var supported = typeof window.PerformanceObserver === 'function' &&
      Array.isArray(window.PerformanceObserver.supportedEntryTypes) &&
      window.PerformanceObserver.supportedEntryTypes.indexOf('longtask') !== -1;
    if (supported) {
      var start = window.performance && performance.now ? performance.now() : 0;
      var observer;
      try {
        observer = new PerformanceObserver(function (list) {
          try {
            var now = performance.now();
            if (document.visibilityState !== 'visible' || now - start < 8000) return;
            list.getEntries().forEach(function (entry) {
              if (entry.duration >= 100) longTasks.push(entry.startTime);
            });
            longTasks = longTasks.filter(function (time) { return now - time <= 10000; });
            if (longTasks.length >= 4) {
              liteLocked = true;
              root.classList.add('a5-auto-lite');
              observer.disconnect();
            }
          } catch (_) {}
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (_) { /* Unsupported browser: retain standard motion rules. */ }
    }
  } catch (_) {
    /* Fail open: never prevent the core A5 application from loading. */
  }
})();
