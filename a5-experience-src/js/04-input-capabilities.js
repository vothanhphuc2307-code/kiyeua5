/* Expose coarse pointer / hover capability as data attributes for scoped styling. */
window.A5ExperienceSuite.register('input-capabilities', function () {
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)');
  const hover = window.matchMedia && window.matchMedia('(hover: hover)');
  const sync = () => {
    document.documentElement.dataset.a5ExpPointer = coarse && coarse.matches ? 'coarse' : 'fine';
    document.documentElement.dataset.a5ExpHover = hover && hover.matches ? 'yes' : 'no';
  };
  sync();
  [coarse, hover].filter(Boolean).forEach(m => { if (m.addEventListener) m.addEventListener('change', sync); });
});
