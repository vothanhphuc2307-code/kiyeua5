/* Thumbnails never pre-download video content; the existing full viewer is untouched. */
window.A5ExperienceSuite.register('video-budget', function (ctx) {
  const process = root => {
    if (!root || !root.querySelectorAll) return;
    const videos = [];
    if (root.matches && root.matches('video')) videos.push(root);
    videos.push(...ctx.queryAll('#homeMediaGrid video, #galleryMediaGrid video, .gallery-grid video, #yearbookSpread video, #onThisDayGrid video, #profileMediaGrid video, #profileArchiveGrid video', root));
    for (const video of new Set(videos)) {
      if (video.closest('#mediaViewerModal, #viewerMediaContent')) { ctx.state.videoCount += video.dataset.a5ExpCounted ? 0 : 1; video.dataset.a5ExpCounted = '1'; continue; }
      video.preload = 'none';
      video.setAttribute('playsinline', '');
      video.dataset.a5ExpThumbnail = '1';
      if (!video.dataset.a5ExpErrorBound) {
        video.dataset.a5ExpErrorBound = '1';
        video.addEventListener('error', () => {
          const wrapper = video.closest('.yearbook-video-visual, .media-thumb, .memory-card-media') || video.parentElement;
          wrapper?.classList.add('a5-exp-video-error');
        }, { once: true });
      }
    }
  };
  ctx.onMediaRefresh(process); process(document);
});
