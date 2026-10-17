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
