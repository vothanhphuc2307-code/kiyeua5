/* Mark the immediate media wrapper when an image fails; preserve layout and content. */
window.A5ExperienceSuite.register('broken-media', function (ctx) {
  const process = root => {
    if (!root || !root.querySelectorAll) return;
    const images = [];
    if (root.matches && root.matches('img')) images.push(root);
    const mediaSelectors = ['#homeMediaGrid img', '#galleryMediaGrid img', '.gallery-grid img', '#yearbookSpread img', '#onThisDayGrid img', '#profileMediaGrid img', '#profileArchiveGrid img'];
    if (root === document || root.matches?.('.page-content')) mediaSelectors.forEach(selector => images.push(...ctx.queryAll(selector, root)));
    else if (!root.matches?.('img')) images.push(...ctx.queryAll('img', root));
    for (const img of images) {
      if (!img.matches('img') || img.dataset.a5ExpFallbackBound) continue;
      img.dataset.a5ExpFallbackBound = '1';
      img.addEventListener('error', () => {
        const wrapper = img.closest('.a5-home-memory-cover, .memory-card-media, .yearbook-polaroid, .on-this-day-card, .media-thumb') || img.parentElement;
        wrapper?.classList.add('a5-exp-has-media-error');
      }, { once: true });
      if (img.classList.contains('a5-exp-media-broken')) {
        const wrapper = img.closest('.a5-home-memory-cover, .memory-card-media, .yearbook-polaroid, .on-this-day-card, .media-thumb') || img.parentElement;
        wrapper?.classList.add('a5-exp-has-media-error');
      }
    }
  };
  ctx.onMediaRefresh(process); process(document);
});
