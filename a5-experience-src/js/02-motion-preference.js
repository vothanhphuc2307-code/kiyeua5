/* Respect operating-system reduced-motion preference without cancelling existing A5 motion. */
window.A5ExperienceSuite.register('motion-preference', function (ctx) {
  const media = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const sync = () => {
    ctx.state.reducedMotion = Boolean(media && media.matches);
    document.documentElement.dataset.a5ExpReducedMotion = ctx.state.reducedMotion ? 'true' : 'false';
  };
  sync();
  if (media) {
    if (media.addEventListener) ctx.on(media, 'change', sync);
    else if (media.addListener) { media.addListener(sync); ctx.addCleanup(() => media.removeListener(sync)); }
  }
});
