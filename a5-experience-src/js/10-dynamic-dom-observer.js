/* The only scoped DOM observer; batches inserted nodes to one frame. */
window.A5ExperienceSuite.register('dynamic-dom-observer', function (ctx) {
  const root = document.querySelector('.page-content');
  ctx.refreshMedia(document);
  if (!root || !('MutationObserver' in window)) return;
  let queued = false; const pending = new Set();
  const observer = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) pending.add(node);
    if (queued || !pending.size) return;
    queued = true;
    const run = () => { queued = false; const nodes = Array.from(pending); pending.clear(); nodes.forEach(node => ctx.refreshMedia(node)); };
    if ('requestAnimationFrame' in window) requestAnimationFrame(run); else setTimeout(run, 16);
  });
  observer.observe(root, { childList: true, subtree: true });
  ctx.addCleanup(() => observer.disconnect());
});
