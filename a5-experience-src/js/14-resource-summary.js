/* Aggregate resources by type, with no URL, query string, or filename in report. */
window.A5ExperienceSuite.register('resource-summary', function (ctx) {
  const snapshot = () => {
    const entries = performance.getEntriesByType ? performance.getEntriesByType('resource') : [];
    const groups = {};
    for (const item of entries) {
      const type = String(item.initiatorType || 'other').slice(0, 24);
      const g = groups[type] || (groups[type] = { count: 0, totalDurationMs: 0, transferBytes: 0, encodedBytes: 0 });
      g.count += 1; g.totalDurationMs += Number(item.duration || 0); g.transferBytes += Number(item.transferSize || 0); g.encodedBytes += Number(item.encodedBodySize || 0);
    }
    Object.values(groups).forEach(g => { g.totalDurationMs = Math.round(g.totalDurationMs); });
    return { resources: { totalCount: entries.length, byType: groups } };
  };
  ctx.addReporter(snapshot);
  ctx.on(window, 'pagehide', () => { try { ctx.metric('resource_entry_count', performance.getEntriesByType('resource').length, { category: 'resources' }); } catch (_) {} });
});
