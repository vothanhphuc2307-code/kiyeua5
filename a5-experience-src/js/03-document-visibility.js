/* Pause only this suite's decorative loading effects when the tab is hidden. */
window.A5ExperienceSuite.register('document-visibility', function (ctx) {
  const sync = () => document.body.classList.toggle('a5-exp-document-hidden', document.hidden);
  sync(); ctx.on(document, 'visibilitychange', sync);
  ctx.on(window, 'pagehide', () => document.body.classList.add('a5-exp-document-hidden'));
  ctx.on(window, 'pageshow', sync);
});
