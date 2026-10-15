/* Command-center metrics: count-up when the block scrolls into view. Final values live in the HTML, so with no JS
   or reduced motion the numbers are simply correct. The fade/line/module motion is CSS (see "16 Command center"). */
(function () {
  var root = document.querySelector('.cc');
  if (!root || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = [].slice.call(root.querySelectorAll('[data-cc]'));
  function fmt(el, v) { el.textContent = v.toFixed(+(el.dataset.dec || 0)) + (el.dataset.suffix || ''); }
  var io = new IntersectionObserver(function (en) {
    if (!en[0].isIntersecting) return;
    io.disconnect();
    var t0 = performance.now() + 350;
    els.forEach(function (el) {
      var to = +el.dataset.cc, from = +el.dataset.from || 0;
      fmt(el, from);
      (function step(now) {
        var p = Math.min(1, Math.max(0, (now - t0) / 1600));
        fmt(el, from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    });
  }, { threshold: 0.25 });
  io.observe(root);
})();