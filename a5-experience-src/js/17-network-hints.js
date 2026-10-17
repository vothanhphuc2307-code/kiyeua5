/* Use browser data-saver hints to reduce only this suite's decorative work. */
window.A5ExperienceSuite.register('network-hints', function (ctx) {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const sync = () => {
    const saveData = Boolean(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));
    ctx.state.saveData = saveData;
    document.documentElement.classList.toggle('a5-exp-low-data', saveData);
    document.documentElement.dataset.a5ExpNetwork = saveData ? 'conserve' : 'normal';
  };
  sync();
  if (connection && connection.addEventListener) ctx.on(connection, 'change', sync);
});
