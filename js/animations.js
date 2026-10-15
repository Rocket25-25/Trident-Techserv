/* Scroll reveal (numbers are static, no count-up). Uses a single IntersectionObserver; the motion itself lives in css/premium.css. */
window.TridentAnim = {
  init: function () {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = [].slice.call(document.querySelectorAll('.reveal'));
    var STEP = 80, MAX = 5, fired = false;

    function fmt(el, v) { el.textContent = v.toFixed(+(el.dataset.dec || 0)) + (el.dataset.suffix || ''); }

    function count(el, delay, instant) {
      if (el.dataset.counted) return;            // animate only once
      el.dataset.counted = '1';
      var to = parseFloat(el.dataset.count);
      fmt(el, to);                               // numbers are shown as final values straight away (no count-up)
    }

    function reveal(el, delay, instant) {
      el.style.setProperty('--rd', delay + 'ms');
      if (instant) el.classList.add('rv-skip');
      el.classList.add('is-in');
      el.querySelectorAll('[data-count]').forEach(function (n) { count(n, delay + 150, instant); });
    }
    function showAll() { els.forEach(function (el) { reveal(el, 0, true); }); }

    if (reduce || !('IntersectionObserver' in window)) { showAll(); return; }

    // numbers keep their final values from the HTML (150+, 2.8x, 99.9%) - no count-up animation
    document.documentElement.classList.add('reveal-ready');
    // safety net: only if the observer never reports back, show everything
    setTimeout(function () { if (!fired) showAll(); }, 2500);

    var io = new IntersectionObserver(function (entries) {
      fired = true;
      var batch = [];
      entries.forEach(function (en) {
        if (en.isIntersecting) batch.push(en);
        else if (en.boundingClientRect.top < 0) { reveal(en.target, 0, true); io.unobserve(en.target); } // already scrolled past
      });
      // elements entering together cascade in reading order
      batch.sort(function (a, b) {
        var d = a.boundingClientRect.top - b.boundingClientRect.top;
        return Math.abs(d) > 8 ? d : a.boundingClientRect.left - b.boundingClientRect.left;
      });
      batch.forEach(function (en, i) { reveal(en.target, Math.min(i, MAX) * STEP, false); io.unobserve(en.target); });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }
};