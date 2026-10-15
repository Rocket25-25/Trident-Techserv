/* Trident Techserv: futuristic phone view helpers (works with css/mobile-futuristic.css).
   Adds the hero aurora, grid and scan line, a floating "Start a project" button, a tap ripple on buttons,
   and a slow scroll parallax. Everything is hidden by CSS on large screens and skipped for "reduce motion". */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hero = document.querySelector('.hero');
    if (hero && !hero.querySelector('.fx-aurora')) {
      var a = document.createElement('div'); a.className = 'fx-aurora'; a.setAttribute('aria-hidden', 'true'); a.innerHTML = '<i></i><i></i><i></i>';
      var g = document.createElement('div'); g.className = 'fx-grid'; g.setAttribute('aria-hidden', 'true');
      var s = document.createElement('div'); s.className = 'fx-scan'; s.setAttribute('aria-hidden', 'true');
      hero.appendChild(a); hero.appendChild(g); hero.appendChild(s);
    }
    var dock = document.createElement('button');
    dock.type = 'button'; dock.className = 'fx-dock'; dock.setAttribute('data-open-modal', '');
    dock.innerHTML = 'Start a project <b>&rarr;</b>';
    document.body.appendChild(dock);

    var footer = document.querySelector('.footer'), cta = document.querySelector('.cta');
    function inView(el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.top < innerHeight * 0.9 && r.bottom > 0; }
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      dock.classList.toggle('is-on', y > innerHeight * 0.7 && !inView(footer) && !inView(cta));
      if (!reduce && hero) {
        var k = Math.min(y, 1200);
        var orbs = hero.querySelectorAll('.fx-aurora');
        if (orbs[0]) orbs[0].style.transform = 'translate3d(0,' + (k * -0.12).toFixed(1) + 'px,0)';
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();

    if (!reduce) {
      document.addEventListener('pointerdown', function (e) {
        var b = e.target.closest && e.target.closest('.btn, .fx-dock');
        if (!b) return;
        var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 1.6;
        var el = document.createElement('span'); el.className = 'fx-ripple';
        el.style.width = el.style.height = d + 'px';
        el.style.left = (e.clientX - r.left) + 'px'; el.style.top = (e.clientY - r.top) + 'px';
        b.appendChild(el); setTimeout(function () { el.remove(); }, 750);
      }, { passive: true });
    }
  });
})();