window.TridentHeader = {
  init: function () {
    var h = document.querySelector('.header'); if (!h) return;
    var nav = h.querySelector('.header__nav'), btn = h.querySelector('.header__menu'), bar = h.querySelector('.header__progress');
    var heroBg = document.querySelector('.hero__bg');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, ticking = false;

    // Safety net: make sure the "Get Started" buttons always exist (desktop bar + mobile menu),
    // even if an older/cached header.html is being served.
    function ensureCta(parent, cls, before) {
      if (!parent || parent.querySelector('.' + cls)) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn btn--primary ' + cls;
      b.setAttribute('data-open-modal', ''); b.textContent = 'Get Started';
      parent.insertBefore(b, before || null);
    }
    var actions = h.querySelector('.header__actions');
    ensureCta(actions, 'header__cta', btn);
    ensureCta(nav, 'header__navcta', null);
    // Safety net #2: if an older/cached header.html has no hamburger button, build it here so the
    // mobile menu can always be opened (the CSS shows it at 900px and below).
    if (!btn && actions && nav) {
      if (!nav.id) nav.id = 'site-nav';
      btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'icon-btn header__menu';
      btn.setAttribute('aria-label', 'Toggle menu'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', nav.id);
      btn.innerHTML = '<svg class="i-open" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg><svg class="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      actions.appendChild(btn);
    }
    function close(refocus) { if (!nav || !btn) return; nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus(); }

    // Single scroll handler (rAF-throttled): header state, progress bar, hero parallax.
    function update() {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      h.classList.toggle('is-scrolled', y > 12);
      if (bar) {
        var max = document.documentElement.scrollHeight - vh;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
      }
      if (heroBg && !reduce && y <= vh * 1.1) heroBg.style.setProperty('--hero-y', Math.min(y * 0.14, 90).toFixed(1) + 'px');
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    update(); window.addEventListener('scroll', onScroll, { passive: true });

    if (btn && nav) btn.addEventListener('click', function () { btn.setAttribute('aria-expanded', nav.classList.toggle('is-open')); });
    if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('a,button')) close(); });
    document.addEventListener('click', function (e) { if (!h.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav && nav.classList.contains('is-open')) close(true); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) close(); onScroll(); });

    var links = nav ? [].slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) links.forEach(function (a) { a.setAttribute('aria-current', a.hash === '#' + e.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (a) { var s = document.querySelector(a.hash); if (s) io.observe(s); });
    }
  }
};