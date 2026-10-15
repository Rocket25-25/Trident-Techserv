/* Trident Techserv - "reference look" behaviour (works with css/reference-fx.css)
   - pillar cards and case-study cards tilt / light up toward the cursor
   - case studies: All / Production Live / In Progress filter + detail pop-up
   - floating "Book a call" button (right side) that appears after scrolling
   Plain JavaScript, no libraries. Respects "reduce motion". */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }

  /* ---------- cursor follow: tilt + light under the pointer + picture drift ---------- */
  function follow(cards, span) {
    if (!FINE || RM) return;
    var KEYS = ['--fx-rx', '--fx-ry', '--fx-mx', '--fx-my', '--fx-ix', '--fx-iy'];
    cards.forEach(function (el) {
      var raf = 0, ev = null;
      function apply() {
        raf = 0;
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var nx = (ev.clientX - r.left) / r.width, ny = (ev.clientY - r.top) / r.height;
        el.style.setProperty('--fx-ry', ((nx - 0.5) * span).toFixed(2) + 'deg');
        el.style.setProperty('--fx-rx', (-(ny - 0.5) * span).toFixed(2) + 'deg');
        el.style.setProperty('--fx-mx', (ev.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--fx-my', (ev.clientY - r.top).toFixed(0) + 'px');
        el.style.setProperty('--fx-ix', ((nx - 0.5) * 2).toFixed(3));
        el.style.setProperty('--fx-iy', ((ny - 0.5) * 2).toFixed(3));
      }
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        ev = e; if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        KEYS.forEach(function (k) { el.style.removeProperty(k); });
      });
    });
  }
  follow($$('#pillars .pillars .pillar'), 10);
  follow($$('.cs-card'), 12);

  /* ---------- phones / touch: the case card nearest the middle of the screen runs its scanner ---------- */
  if (!FINE && 'IntersectionObserver' in window && !RM) {
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('is-focus', e.isIntersecting); });
    }, { threshold: 0.6 });
    $$('.cs-card').forEach(function (c) { seen.observe(c); });
  }

  /* ---------- case studies: filter tabs ---------- */
  var tabs = $$('.cs-tab'), cards = $$('.cs-card');
  function filter(t) {
    tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); x.tabIndex = x === t ? 0 : -1; });
    var f = t.getAttribute('data-f');
    cards.forEach(function (c) {
      var show = f === 'all' || c.getAttribute('data-s') === f;
      c.hidden = !show;
      if (show) {
        c.classList.add('is-in'); // in case it was still waiting for its scroll reveal
        if (!RM && c.animate) c.animate(
          [{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });
  }
  tabs.forEach(function (t, i) {
    t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
    t.addEventListener('click', function () { filter(t); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : -1;
      if (n > -1) { e.preventDefault(); tabs[n].focus(); filter(tabs[n]); }
    });
  });

  /* ---------- case studies: detail pop-up ---------- */
  var modal = document.getElementById('csModal');
  if (modal) {
    var body = $('.cs-modal__body', modal), closeBtn = $('.modal__close', modal), lastFocus = null;
    function open(card) {
      var tpl = $('template', card); if (!tpl) return;
      body.innerHTML = '';
      body.appendChild(tpl.content.cloneNode(true));
      var h = $('h3', body); if (h) h.id = 'csTitle';
      lastFocus = document.activeElement;
      modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
      setTimeout(function () { closeBtn.focus(); }, 60);
    }
    function close() {
      if (!modal.classList.contains('is-open')) return;
      modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.addEventListener('click', function (e) {
      var hit = e.target.closest && e.target.closest('.cs-hit');
      if (hit) { open(hit.closest('.cs-card')); return; }
      if (e.target === modal || (e.target.closest && e.target.closest('[data-cs-close]'))) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('button,a[href]', modal).filter(function (x) { return x.offsetParent !== null && !x.disabled; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- floating "Book a call" button ---------- */
  var fab = document.getElementById('rfFab'), topBtn = document.getElementById('rfTop');
  if (fab) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      fab.classList.toggle('is-show', y > 600);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    if (topBtn) topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); });
  }
})();
