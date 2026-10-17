/* Do the first diagnostic snapshot at idle; do not delay app initialization. */
window.A5ExperienceSuite.register('idle-audit', function (ctx) {
  ctx.scheduleIdle(() => {
    try {
      const imgCount = document.querySelectorAll('#homeMediaGrid img, #galleryMediaGrid img, .gallery-grid img, #yearbookSpread img').length;
      ctx.metric('visible_media_dom_count', imgCount, { category: 'media' });
    } catch (_) {}
  }, 1800);
});
