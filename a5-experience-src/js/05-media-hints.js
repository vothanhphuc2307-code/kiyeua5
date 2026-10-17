/* Scope media optimisations to real A5 media lists and the existing viewer. */
window.A5ExperienceSuite.register('media-hints', function (ctx) {
  const roots = ['#homeMediaGrid', '#galleryMediaGrid', '.gallery-grid', '#yearbookSpread', '#onThisDayGrid', '#profileMediaGrid', '#profileArchiveGrid', '#viewerMediaContent'];
  const isAvatar = img => Boolean(img.closest('.avatar, .top-avatar, .profile-large-avatar, .public-profile-avatar, .a5-chat-avatar, .person-avatar, .sidebar-user'));
  const process = root => {
    if (!root || !root.querySelectorAll) return;
    const list = [];
    if (root.matches && root.matches('img')) list.push(root);
    roots.forEach(selector => { if (root.matches && root.matches(selector)) list.push(...ctx.queryAll('img', root)); });
    if (root === document || root === document.body || root.matches?.('.page-content')) roots.forEach(selector => list.push(...ctx.queryAll(`${selector} img`, root === document ? document : root)));
    else if (root.querySelectorAll && !root.matches?.('img') && list.length === 0) list.push(...ctx.queryAll('img', root));
    for (const img of new Set(list)) {
      if (isAvatar(img) || img.closest('#mediaViewerModal')) continue;
      if (!img.hasAttribute('decoding')) img.decoding = 'async';
      if (!img.hasAttribute('loading')) img.loading = 'lazy';
      const card = img.closest('.a5-home-memory-card');
      if (card) {
        const front = card.dataset.homeDeckPos === '0' || card.dataset.a5HomeDeckPos === '0';
        img.loading = front ? 'eager' : 'lazy';
        try { img.fetchPriority = front ? 'high' : 'low'; } catch (_) {}
      } else if (!img.hasAttribute('fetchpriority')) {
        try { img.fetchPriority = 'low'; } catch (_) {}
      }
    }
  };
  ctx.onMediaRefresh(process);
  process(document);
});
