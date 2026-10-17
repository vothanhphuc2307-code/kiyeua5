(() => {
  const out = document.getElementById('results');
  const lines = [];
  const check = (name, ok, detail = '') => lines.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  setTimeout(() => {
    const api = window.A5ExperienceSuite;
    check('suite global exists', !!api);
    check('suite version', !!api && api.version === '1.0.0', api ? api.version : 'missing');
    check('boot completed', !!api && !!api.started);
    check('report contains privacy-safe environment', !!api && !!api.getReport().environment && !('url' in api.getReport().environment));
    check('diagnostics panel is opt-in', !document.getElementById('a5-experience-diagnostics') || document.getElementById('a5-experience-diagnostics').hidden);
    check('media image has async decode hint', document.querySelector('#homeMediaGrid img')?.decoding === 'async');
    check('card remains in DOM', document.querySelectorAll('#homeMediaGrid .a5-home-memory-card').length === 1);
    out.textContent = lines.join('\n');
    out.dataset.failed = String(lines.filter(x => x.startsWith('FAIL')).length);
  }, 100);
})();
