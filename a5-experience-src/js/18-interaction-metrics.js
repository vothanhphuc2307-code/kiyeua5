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
