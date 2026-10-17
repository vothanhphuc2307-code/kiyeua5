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
