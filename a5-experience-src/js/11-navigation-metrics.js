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
