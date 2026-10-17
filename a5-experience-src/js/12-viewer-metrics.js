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
