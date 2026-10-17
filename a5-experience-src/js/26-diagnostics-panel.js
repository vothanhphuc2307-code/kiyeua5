/* On-demand local diagnostics, Alt+Shift+E. No panel is shown during login. */
window.A5ExperienceSuite.register('diagnostics-panel', function (ctx) {
  let panel = null;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const ensure = () => {
    if (panel) return panel;
    panel = document.createElement('section');
    panel.id = 'a5-experience-diagnostics'; panel.className = 'a5-exp-diagnostics-panel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'A5 Performance Diagnostics');
    panel.innerHTML = '<div class="a5-exp-diagnostics-head"><span class="a5-exp-diagnostics-mark" aria-hidden="true">✿</span><div><strong>A5 Performance Lab</strong><small>Chỉ đo cục bộ trên thiết bị này</small></div><button type="button" data-a5-exp-close aria-label="Đóng bảng">×</button></div><div class="a5-exp-diagnostics-body"><div class="a5-exp-stat-grid" data-a5-exp-stats></div><p class="a5-exp-diagnostics-hint">Mở bằng Alt + Shift + E. Báo cáo không chứa URL, tên tài khoản, nội dung chat hay chú thích ảnh.</p></div><div class="a5-exp-diagnostics-actions"><button type="button" data-a5-exp-refresh>Làm mới</button><button type="button" data-a5-exp-export>Tải báo cáo JSON</button></div>';
    document.body.appendChild(panel);
    panel.addEventListener('click', event => {
      if (event.target.closest('[data-a5-exp-close]')) panel.hidden = true;
      if (event.target.closest('[data-a5-exp-refresh]')) refresh();
      if (event.target.closest('[data-a5-exp-export]')) download();
    });
    return panel;
  };
  const refresh = () => {
    const p = ensure(); const report = window.A5ExperienceSuite.getReport();
    const stats = [
      ['Mở trang', report.navigation ? `${report.navigation.domContentLoadedMs} ms` : 'Không hỗ trợ'],
      ['Chuyển tab', report.runtime.lastNavigationMs == null ? 'Chưa đo' : `${report.runtime.lastNavigationMs} ms`],
      ['Mở trình xem', report.runtime.lastViewerOpenMs == null ? 'Chưa đo' : `${report.runtime.lastViewerOpenMs} ms`],
      ['Long tasks', report.runtime.longTaskCount],
      ['Ảnh lỗi', report.runtime.imageErrorCount],
      ['CLS', report.runtime.cumulativeLayoutShift],
      ['Thẻ trên trang chủ', document.querySelectorAll('#homeMediaGrid > .a5-home-memory-card').length],
      ['Chế độ tiết kiệm', report.environment.saveData ? 'Bật' : 'Tắt']
    ];
    const host = p.querySelector('[data-a5-exp-stats]');
    host.innerHTML = stats.map(([label, value]) => `<div class="a5-exp-stat"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join('');
  };
  const download = () => {
    const report = window.A5ExperienceSuite.getReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `a5-performance-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    ctx.metric('diagnostic_export', 1, { format: 'json' });
  };
  ctx.on(document, 'keydown', event => {
    if (!(event.altKey && event.shiftKey && event.code === 'KeyE')) return;
    const target = event.target;
    if (target && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName || ''))) return;
    if (!ctx.isAppOpen()) return;
    event.preventDefault(); const p = ensure(); p.hidden = !p.hidden; if (!p.hidden) refresh();
  });
  ctx.addReporter(() => ({ diagnosticCapabilities: { longTaskObserver: 'PerformanceObserver' in window, resourceTiming: !!(performance.getEntriesByType), pointerType: document.documentElement.dataset.a5ExpPointer || 'unknown' } }));
});
