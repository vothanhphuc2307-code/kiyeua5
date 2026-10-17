/* The first home card remains eager; cards behind it stay lazy and low priority. */
window.A5ExperienceSuite.register('home-deck-priority', function (ctx) {
  const process = root => {
    const rail = root && root.querySelector ? (root.matches?.('#homeMediaGrid') ? root : root.querySelector('#homeMediaGrid')) : null;
    if (!rail) return;
    const cards = ctx.queryAll(':scope > .a5-home-memory-card', rail);
    cards.forEach((card, index) => {
      card.dataset.a5ExpDeckIndex = String(index);
      const img = card.querySelector('img');
      if (!img) return;
      img.decoding = 'async';
      img.loading = index === 0 ? 'eager' : 'lazy';
      try { img.fetchPriority = index === 0 ? 'high' : 'low'; } catch (_) {}
    });
    ctx.metric('home_deck_rendered_cards', cards.length, { maxVisible: 4 });
  };
  ctx.onMediaRefresh(process); process(document);
});
