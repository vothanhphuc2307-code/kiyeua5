/* Add low-cost pending/ready classes to media thumbnails; never replace app src values. */
window.A5ExperienceSuite.register('image-loading-state', function (ctx) {
  const seen = new WeakSet();
  const process = root => {
    if (!root || !root.querySelectorAll) return;
    const images = [];
    if (root.matches && root.matches('img')) images.push(root);
    images.push(...ctx.queryAll('#homeMediaGrid img, #galleryMediaGrid img, .gallery-grid img, #yearbookSpread img, #onThisDayGrid img, #profileMediaGrid img, #profileArchiveGrid img', root));
    for (const img of new Set(images)) {
      if (img.closest('.avatar, .top-avatar, .profile-large-avatar, .public-profile-avatar, .a5-chat-avatar, #mediaViewerModal')) continue;
      img.classList.add('a5-exp-media-image');
      if (seen.has(img)) continue;
      seen.add(img);
      const started = ctx.now();
      if (img.complete) {
        if (img.naturalWidth > 0) img.classList.add('a5-exp-media-ready');
        else if (img.currentSrc || img.src) img.classList.add('a5-exp-media-broken');
        continue;
      }
      img.classList.add('a5-exp-media-pending');
      img.addEventListener('load', () => {
        img.classList.remove('a5-exp-media-pending'); img.classList.add('a5-exp-media-ready');
        ctx.state.imageLoadCount += 1; ctx.metric('thumbnail_loaded_ms', ctx.now() - started, { category: 'image' });
      }, { once: true });
      img.addEventListener('error', () => {
        img.classList.remove('a5-exp-media-pending'); img.classList.add('a5-exp-media-broken');
        ctx.state.imageErrorCount += 1; ctx.metric('thumbnail_error', 1, { category: 'image' });
      }, { once: true });
    }
  };
  ctx.onMediaRefresh(process); process(document);
});
