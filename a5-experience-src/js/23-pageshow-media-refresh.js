/* Refresh safe media hints when a page returns from the back-forward cache. */
window.A5ExperienceSuite.register('pageshow-media-refresh', function (ctx) {
  ctx.on(window, 'pageshow', () => ctx.refreshMedia(document));
});
