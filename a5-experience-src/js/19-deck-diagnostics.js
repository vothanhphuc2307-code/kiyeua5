/* Record home deck node count only when that small collection changes. */
window.A5ExperienceSuite.register('deck-diagnostics', function (ctx) {
  const rail = document.getElementById('homeMediaGrid');
  if (!rail) return;
  const update = () => {
    const cards = rail.querySelectorAll(':scope > .a5-home-memory-card');
    ctx.metric('home_deck_dom_card_count', cards.length, { expectedMax: 4 });
  };
  update();
  if ('MutationObserver' in window) {
    const observer = new MutationObserver(update); observer.observe(rail, { childList: true }); ctx.addCleanup(() => observer.disconnect());
  }
});
