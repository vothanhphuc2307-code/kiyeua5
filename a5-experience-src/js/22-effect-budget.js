/* Use lower-cost treatment only for suite-owned UI on coarse/low-data devices. */
window.A5ExperienceSuite.register('effect-budget', function (ctx) {
  const sync = () => {
    const coarse = document.documentElement.dataset.a5ExpPointer === 'coarse';
    document.documentElement.classList.toggle('a5-exp-mobile', coarse);
    document.documentElement.classList.toggle('a5-exp-reduced-work', coarse || ctx.state.saveData || ctx.state.reducedMotion);
  };
  sync();
  ctx.on(window, 'resize', sync, { passive: true });
  ctx.on(window, 'orientationchange', sync, { passive: true });
});
