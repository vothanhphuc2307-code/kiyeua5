/* Add defensive aria labels only when absent; do not overwrite app-authored labels. */
window.A5ExperienceSuite.register('accessibility', function (ctx) {
  const apply = root => {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('alt') && !img.closest('.avatar, .a5-chat-avatar, .decorative, [aria-hidden="true"]')) img.setAttribute('alt', '');
    });
  };
  apply(document);
  ctx.onMediaRefresh(apply);
  ctx.on(document, 'keydown', event => {
    if (event.key === 'Escape') document.getElementById('a5-experience-diagnostics')?.setAttribute('hidden', '');
  });
});
