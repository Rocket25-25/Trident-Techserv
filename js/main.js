/* Loads header/footer components, then boots every module. */
(function () {
  var FALLBACK_HEADER = '<header class="header is-scrolled"><div class="container header__inner"><a class="header__logo" href="#hero"><img src="assets/logo/trident-techserv-logo.png" alt="Trident Techserv" width="83" height="40"></a><nav class="header__nav" style="opacity:1;visibility:visible;position:static;flex-direction:row;padding:0;border:0;box-shadow:none;transform:none"><a href="#hero">Home</a><a href="#about">About</a><a href="#pillars">Pillars</a><a href="#why">Standards</a><a href="#process">Process</a><a href="#cases">Work</a><a href="contact.html">Contact</a></nav><span></span></div></header>';
  var FALLBACK_FOOTER = '<footer class="footer" id="contact"><div class="container"><a href="mailto:headtrident.techserv@gmail.com">headtrident.techserv@gmail.com</a><span class="footer__loc">Pune, India</span></div></footer>';

  function load(id, url, fallback) {
    var host = document.getElementById(id);
    return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) { host.innerHTML = html; })
      .catch(function (e) {
        console.warn('Could not load ' + url + '. Serve the site over http:// (e.g. Live Server) — fetch() is blocked on file://.', e);
        host.innerHTML = fallback;
      });
  }

  var PHASES = [
    { k: 'Phase 01 — Blueprint & Scope', t: 'Discovery & Architecture', d: 'Domain dissection, multitenant schemas, database modeling, compliance mapping, and sprint roadmap planning.', tags: ['Threat Vectors', 'API Spec', 'Schema Design', 'Cost Modeling'], del: ['Technical Architecture Doc', 'Sprint Roadmap Gantt', 'Schema ERDs', 'Risk Matrix'], img: 'assets/images/process-discovery.jpg' },
    { k: 'Phase 02 — High-Fidelity UX', t: 'Design & Design Systems', d: 'Interactive wireframes, complete component design system, edge-case handling, and interactive prototypes tested for conversion.', tags: ['Figma Systems', 'Interactive UX', 'Micro-animations', 'User Journeys'], del: ['Clickable High-Fi Prototype', 'Modular Design System', 'Asset Library', 'Design Sign-off'], img: 'assets/images/process-design.jpg' },
    { k: 'Phase 03 — Sprint Engine', t: 'Building & Iteration', d: 'Bi-weekly releases with full transparency. Each sprint delivers production-ready features with automated testing, code reviews, and live staging links.', tags: ['Git Workflow', 'CI/CD Automation', 'Daily Standups', 'Staging Preview'], del: ['Clean, documented production code', 'Automated unit test coverage', 'Live staging deployment build', 'Bi-weekly sprint demo recording'], img: 'photo-1555066931-4365d14bab8c' },
    { k: 'Phase 04 — Security & Hardening', t: 'Quality Assurance & Auditing', d: 'End-to-end chaos engineering tests, sub-millisecond query optimization, penetration testing, and regulatory validation.', tags: ['Load Stress Tests', 'Penetration Tests', 'Smart Contract Audit', 'E2E Cypress'], del: ['Security Audit Report', 'Performance Optimization Log', 'Zero-Vulnerability Sign-off', 'Disaster Recovery Runbook'], img: 'photo-1563986768609-322da13575f3' },
    { k: 'Phase 05 — Production Rollout', t: 'Launch, Scale & Monitor', d: 'Zero-downtime blue/green deployment, domain cutover, 24/7 telemetry monitoring, and dedicated DevOps handover.', tags: ['Blue/Green Deploy', 'Datadog Telemetry', 'Auto-scaling', 'SRE On-Call'], del: ['Production Handover Package', '24/7 Telemetry Dashboard', 'Infrastructure as Code (IaC)', 'Post-launch Support SLA'], img: 'photo-1518770660439-4636190af475' }
  ];

  function initProcess() {
    var box = document.querySelector('.process'); if (!box) return;
    var steps = [].slice.call(box.querySelectorAll('.step')), panel = document.getElementById('panel');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur = 0, shown = 0, timer, intro = [], introducing = false, inView = false, seen = false;
    function el(id) { return document.getElementById(id); }
    function render(p) {
      el('sk').textContent = p.k; el('st').textContent = p.t; el('sd').textContent = p.d;
      el('stg').innerHTML = p.tags.map(function (x) { return '<span>' + x + '</span>'; }).join('');
      el('sdl').innerHTML = p.del.map(function (x) { return '<li>' + x + '</li>'; }).join('');
      el('si').src = p.img.indexOf('assets/') === 0 ? p.img : 'https://images.unsplash.com/' + p.img + '?w=600&auto=format&fit=crop&q=80';
    }
    var swapTimer, doneTimer;
    // 1) whole box slides out  2) content swaps  3) new box glides in from the other side, items drop in one by one
    function slideTo(i, dir) {
      clearTimeout(swapTimer); clearTimeout(doneTimer);
      panel.style.setProperty('--slide', dir);
      panel.classList.remove('is-entered');
      panel.classList.add('is-swapping');
      swapTimer = setTimeout(function () {
        render(PHASES[i]);
        panel.classList.add('is-entering-start');
        panel.classList.remove('is-swapping');
        void panel.offsetWidth; // commit the parked start position
        panel.classList.remove('is-entering-start');
        panel.classList.add('is-entered');
        doneTimer = setTimeout(function () { panel.classList.remove('is-entered'); }, 2000);
      }, 520);
    }
    function go(i, user) {
      var dir = i > cur ? 1 : -1; // higher step number -> slides in from the right, lower -> from the left
      cur = i;
      steps.forEach(function (s, n) {
        s.classList.toggle('is-active', n === i); s.classList.toggle('is-done', n < i);
        s.setAttribute('aria-selected', n === i); s.tabIndex = n === i ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', 'tab' + i);
      var strip = steps[0].parentNode;
      if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: steps[i].offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
      if (i !== shown) {
        shown = i;
        if (reduce) render(PHASES[i]);
        else slideTo(i, dir);
      }
      if (user) play();
    }
    function stop() { clearInterval(timer); }
    // autoplay only while the section is on screen and the intro has finished
    function play() { if (reduce || !inView || introducing) return; stop(); timer = setInterval(function () { go((cur + 1) % steps.length); }, 4200); }
    function cancelIntro() { intro.forEach(clearTimeout); intro = []; introducing = false; }
    // first time the section is seen: Discovery -> Launch activate one after another, lines fill between them
    var INTRO_START = 600, INTRO_STEP = 2400; // ms: delay before 01, and time between each number (raise for slower)
    function runIntro() {
      seen = true; if (reduce) return;
      introducing = true;
      steps.forEach(function (_, n) { intro.push(setTimeout(function () { go(n); }, INTRO_START + n * INTRO_STEP)); });
      intro.push(setTimeout(function () { introducing = false; play(); }, INTRO_START + (steps.length - 1) * INTRO_STEP + 1500));
    }
    steps.forEach(function (s, i) {
      s.addEventListener('click', function () { cancelIntro(); go(i, true); });
      s.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? (i + 1) % 5 : e.key === 'ArrowLeft' ? (i + 4) % 5 : -1;
        if (n > -1) { e.preventDefault(); cancelIntro(); go(n, true); steps[n].focus(); }
      });
    });
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { box.addEventListener(ev, stop, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { box.addEventListener(ev, play); });
    box.addEventListener('touchend', function () { setTimeout(play, 900); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          inView = e.isIntersecting;
          if (inView && !seen) runIntro(); else if (inView) play(); else stop();
        });
      }, { threshold: 0.35 }).observe(box);
    } else { inView = true; play(); }
  }

  function initHeroVideo() {
    var hv = document.querySelector('.hero__video'); if (!hv) return;
    var root = document.documentElement, cur = '';
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var CLIPS = {
      dark: ['assets/video/hero-tech.mp4', 'assets/video/hero-tech-poster.jpg'],
      light: ['assets/video/hero-tech-light.mp4', 'assets/video/hero-tech-light-poster.jpg']
    };
    function theme() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
    if (reduce) hv.removeAttribute('autoplay');

    // One <video> per theme. The inactive one stays hidden and is pre-loaded in the background, so a theme switch
    // only swaps which video is visible (instant) instead of downloading a new clip while a still poster sits there.
    var vids = {}, first = theme(), second = first === 'dark' ? 'light' : 'dark';
    vids[first] = hv;
    var spare = hv.cloneNode(false);
    spare.muted = true; spare.removeAttribute('autoplay'); spare.preload = 'none'; spare.style.visibility = 'hidden';
    hv.parentNode.insertBefore(spare, hv.nextSibling);
    vids[second] = spare;

    // On Data Saver or a slow (2G/3G) connection, skip the video entirely and show the poster image only.
    var conn = navigator.connection;
    var lite = !!(conn && (conn.saveData || /(^|-)[23]g$/.test(conn.effectiveType || '')));
    function load(t) {
      var v = vids[t];
      v.poster = CLIPS[t][1];
      if (lite || v.getAttribute('src') === CLIPS[t][0]) return;
      v.preload = 'auto'; v.src = CLIPS[t][0]; v.load();
    }
    function sync() {
      var t = theme(); if (t === cur) return;
      var prev = vids[cur], next = vids[t]; cur = t;
      if (prev) { prev.style.visibility = 'hidden'; prev.pause(); }
      load(t);                                   // no-op when it was already pre-loaded
      next.style.visibility = '';
      if (!reduce) { var p = next.play(); if (p && p.catch) p.catch(function () {}); }
    }
    sync();
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    // Pre-load the other theme's clip shortly after the page has finished loading (skipped when Data Saver is on).
    if (!lite) {
      var warm = function () { setTimeout(function () { load(cur === 'dark' ? 'light' : 'dark'); }, 1200); };
      if (document.readyState === 'complete') warm(); else window.addEventListener('load', warm, { once: true });
    }
  }

  // The hero video lives in index.html (not in a component), so start it right away instead of waiting for the
  // header/footer fetches; theme.js has already set data-theme in <head>.
  initHeroVideo();

  Promise.all([
    load('site-header', 'components/header.html', FALLBACK_HEADER),
    load('site-footer', 'components/footer.html', FALLBACK_FOOTER)
  ]).then(function () {
    var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
    // Multi-page support: the header/footer links are written for the home page ("#about"). On any other page
    // (set data-page on <body>) point them back to index.html, and highlight the current page in the menu.
    var page = document.body.getAttribute('data-page') || 'home';
    if (page !== 'home') {
      [].forEach.call(document.querySelectorAll('#site-header a[href^="#"], #site-footer a[href^="#"]'), function (a) {
        var h = a.getAttribute('href');
        if (a.classList.contains('footer__top')) a.setAttribute('href', '#main');   // "Back to top" stays on this page
        else if (h.length > 1) a.setAttribute('href', 'index.html' + h);
      });
      var here = document.querySelector('.header__nav a[href="' + page + '.html"]');
      if (here) here.setAttribute('aria-current', 'true');
    }
    TridentTheme.init(); TridentHeader.init(); TridentAnim.init(); TridentModal.init(); initProcess();
    // Hash handling. A "#section" in the address bar is only followed when the page is OPENED with that link,
    // never on refresh / back (that was throwing visitors to #contact = the footer every time they refreshed).
    var navType = ''; try { var ne = performance.getEntriesByType('navigation')[0]; navType = ne ? ne.type : ''; } catch (e) {}
    if (location.hash.length > 1) {
      if (navType === 'reload') { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
      else if (navType !== 'back_forward') { try { var t = document.querySelector(location.hash); if (t) t.scrollIntoView(); } catch (e) {} }
    }
    // In-page links (menu, buttons, skip link) scroll smoothly and keep the address bar clean (no #contact left behind).
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2 || e.defaultPrevented) return;
      var t; try { t = document.querySelector(a.getAttribute('href')); } catch (x) {}
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      try { t.focus({ preventScroll: true }); } catch (x) {}
      try { history.replaceState(null, '', location.pathname + location.search); } catch (x) {}
    });
  });
})();