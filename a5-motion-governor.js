/* A5 Motion Governor v1.0 — optional, dependency-free, no data/network access. */
(function () {
  'use strict';
  try {
    var root = document.documentElement;
    if (!root) return;

    var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var touchQuery = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;
    var smallQuery = window.matchMedia ? window.matchMedia('(max-width: 760px)') : null;

    function syncDeviceClasses() {
      try {
        root.classList.toggle('a5-prefers-reduced-motion', !!(reduceQuery && reduceQuery.matches));
        root.classList.toggle('a5-touch-device', !!((touchQuery && touchQuery.matches) || (smallQuery && smallQuery.matches)));
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        var lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
        var dataSaver = !!(connection && connection.saveData);
        if (((touchQuery && touchQuery.matches) || (smallQuery && smallQuery.matches)) && (lowMemory || dataSaver)) {
          root.classList.add('a5-auto-lite');
        }
      } catch (_) { /* Best-effort only; the website stays functional without these APIs. */ }
    }

    syncDeviceClasses();
    if (reduceQuery && reduceQuery.addEventListener) reduceQuery.addEventListener('change', syncDeviceClasses);
    if (touchQuery && touchQuery.addEventListener) touchQuery.addEventListener('change', syncDeviceClasses);
    if (smallQuery && smallQuery.addEventListener) smallQuery.addEventListener('change', syncDeviceClasses);

    function syncVisibility() {
      root.classList.toggle('a5-tab-hidden', document.visibilityState !== 'visible');
    }
    document.addEventListener('visibilitychange', syncVisibility, { passive: true });
    syncVisibility();

    /* A long-task observer is supported by some browsers (not all). If the main
       thread is repeatedly blocked after initial load, reduce only decorative
       motion. This is a conservative heuristic, not an FPS measurement. */
    var hasLongTaskObserver = typeof window.PerformanceObserver === 'function' &&
      Array.isArray(window.PerformanceObserver.supportedEntryTypes) &&
      window.PerformanceObserver.supportedEntryTypes.indexOf('longtask') !== -1;
    if (hasLongTaskObserver) {
      var bootAt = window.performance && performance.now ? performance.now() : 0;
      var recent = [];
      var observer = new PerformanceObserver(function (list) {
        try {
          var now = performance.now();
          if (document.visibilityState === 'hidden' || now - bootAt < 10000) return;
          list.getEntries().forEach(function (entry) {
            if (entry.duration >= 80) recent.push(entry.startTime);
          });
          recent = recent.filter(function (start) { return now - start <= 12000; });
          if (recent.length >= 4) {
            root.classList.add('a5-auto-lite');
            observer.disconnect();
          }
        } catch (_) { /* Never interfere with the core application. */ }
      });
      try { observer.observe({ entryTypes: ['longtask'] }); } catch (_) { /* Unsupported implementation: skip. */ }
    }
  } catch (_) {
    /* Fail closed: this helper must never stop app.js from loading. */
  }
})();
