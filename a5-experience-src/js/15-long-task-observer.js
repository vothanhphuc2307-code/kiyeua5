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
