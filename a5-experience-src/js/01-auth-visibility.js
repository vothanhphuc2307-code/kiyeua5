/* Gate toolkit UI and diagnostics behind the signed-in application shell. */
window.A5ExperienceSuite.register('auth-visibility', function (ctx) {
  const sync = () => {
    const open = ctx.isAppOpen();
    document.body.classList.toggle('a5-exp-app-open', open);
    document.body.classList.toggle('a5-exp-auth-open', !open);
    const panel = document.getElementById('a5-experience-diagnostics');
    if (panel && !open) panel.hidden = true;
  };
  sync();
  const observer = new MutationObserver(sync);
  ['appShell', 'authScreen'].forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] }); });
  ctx.addCleanup(() => observer.disconnect());
});
