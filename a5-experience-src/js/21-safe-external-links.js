/* Security hygiene for future links; no destination is changed. */
window.A5ExperienceSuite.register('safe-external-links', function (ctx) {
  const apply = root => {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('a[target="_blank"]').forEach(link => {
      const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener'); rel.add('noreferrer'); link.setAttribute('rel', Array.from(rel).join(' '));
    });
  };
  apply(document); ctx.onMediaRefresh(apply);
});
