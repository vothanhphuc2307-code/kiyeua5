/* Store only error categories locally; never transmit error details or user data. */
window.A5ExperienceSuite.register('error-observer', function (ctx) {
  ctx.on(window, 'error', event => {
    if (event && event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
      ctx.metric('asset_error', 1, { kind: String(event.target.tagName).toLowerCase() });
    } else ctx.metric('window_error', 1, { kind: 'runtime' });
  }, true);
  ctx.on(window, 'unhandledrejection', () => ctx.metric('promise_rejection', 1, { kind: 'unhandled' }));
});
