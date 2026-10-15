/* Trident Techserv — scroll + cursor motion.
   Only measures and sets CSS variables (see css/motion.css). One requestAnimationFrame
   loop that runs while something is moving and stops itself when everything has settled. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- fixed background scene (first half of the page = photo a, second half = photo b) ---------- */
  var scene = document.createElement('div');
  scene.className = 'bg-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.setAttribute('data-on', 'a');
  scene.innerHTML = '<i class="bg-scene__a"></i><i class="bg-scene__b"></i>';
  document.body.insertBefore(scene, document.body.firstChild);
  document.documentElement.classList.add('has-scene');

  var sceneSecs = [].slice.call(document.querySelectorAll('main > section:not(.hero)'));
  var sceneQueued = false;
  function updateScene() {
    sceneQueued = false;
    var h = window.innerHeight, mid = h * 0.5, now = scene.getAttribute('data-on'), on = now;
    // first half of the page (down to the middle of the content) = photo a, second half = photo b
    if (sceneSecs.length) {
      var top = sceneSecs[0].getBoundingClientRect().top;
      var bottom = sceneSecs[sceneSecs.length - 1].getBoundingClientRect().bottom;
      on = mid < (top + bottom) / 2 ? 'a' : 'b';
    }
    if (on !== now) scene.setAttribute('data-on', on);
    var max = Math.max(1, document.documentElement.scrollHeight - h);
    scene.style.setProperty('--sp', clamp(window.scrollY / max, 0, 1).toFixed(4));
  }
  function queueScene() { if (!sceneQueued) { sceneQueued = true; requestAnimationFrame(updateScene); } }
  window.addEventListener('scroll', queueScene, { passive: true });
  window.addEventListener('resize', queueScene);
  window.addEventListener('load', queueScene);
  updateScene();

  if (reduce) return;

  var canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var vh = window.innerHeight;
  var scrolls = [], pointers = [];
  var running = false;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v) { return Math.round(v * 1000) / 1000; }

  /* ---------- scroll-driven values ---------- */
  // 1 when the element is fully below the screen, 0 when centred, -1 when fully above
  function viewProgress(el) {
    var r = el.getBoundingClientRect();
    return clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1.2, 1.2);
  }
  function addScroll(el, prop, measure) {
    if (!el) return;
    scrolls.push({ el: el, prop: prop, measure: measure || function () { return viewProgress(el); }, cur: 0, ready: false, out: null });
  }

  /* ---------- cursor-driven values ---------- */
  // area: where the pointer is tracked, host: element that receives the variables,
  // spot: element the glow position is measured against.
  function addPointer(o) {
    var p = { area: o.area, host: o.host || o.area, spot: o.spot || o.area, kx: o.kx, ky: o.ky,
      ease: o.ease || 0.12, tx: 0, ty: 0, cx: 0, cy: 0, tmx: 50, tmy: 50, mx: 50, my: 50, active: false, out: {} };
    pointers.push(p);

    // touch = finger (or devtools mobile emulation): only cards opened with touch:true react, while pressed
    function track(e) {
      var r = p.area.getBoundingClientRect(), s = p.spot.getBoundingClientRect();
      if (!r.width || !r.height) return;
      p.tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      p.ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
      p.tmx = (e.clientX - s.left) / s.width * 100;
      p.tmy = (e.clientY - s.top) / s.height * 100;
      if (!p.active) { p.active = true; p.mx = p.tmx; p.my = p.tmy; } // glow appears under the cursor, not sliding in
      p.host.classList.add('is-hot');
      if (e.pointerType === 'touch') p.host.classList.add('is-touch');
      request();
    }
    function release() {
      p.tx = 0; p.ty = 0; p.active = false;
      p.host.classList.remove('is-hot', 'is-touch');
      request();
    }

    p.area.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' && !o.touch) return;
      track(e);
    }, { passive: true });
    if (o.touch) {
      p.area.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') track(e); }, { passive: true });
      p.area.addEventListener('pointerup', release);
      p.area.addEventListener('pointercancel', release);
    }
    p.area.addEventListener('pointerleave', release);
  }

  /* ---------- the loop ---------- */
  function request() { if (!running) { running = true; requestAnimationFrame(frame); } }

  function frame() {
    var busy = false, i, s, p, t;

    for (i = 0; i < scrolls.length; i++) {
      s = scrolls[i];
      t = s.measure();
      if (!s.ready) { s.cur = t; s.ready = true; }
      else s.cur += (t - s.cur) * 0.14;
      if (Math.abs(t - s.cur) > 0.0015) busy = true; else s.cur = t;
      var v = num(s.cur);
      if (v !== s.out) { s.el.style.setProperty(s.prop, v); s.out = v; }
    }

    for (i = 0; i < pointers.length; i++) {
      p = pointers[i];
      p.cx += (p.tx - p.cx) * p.ease;
      p.cy += (p.ty - p.cy) * p.ease;
      p.mx += (p.tmx - p.mx) * p.ease * 1.4;
      p.my += (p.tmy - p.my) * p.ease * 1.4;
      if (Math.abs(p.tx - p.cx) > 0.002 || Math.abs(p.ty - p.cy) > 0.002) busy = true;
      else { p.cx = p.tx; p.cy = p.ty; }
      if (p.active && (Math.abs(p.tmx - p.mx) > 0.05 || Math.abs(p.tmy - p.my) > 0.05)) busy = true;
      write(p, p.kx, num(p.cx)); write(p, p.ky, num(p.cy));
      write(p, '--mx', num(p.mx) + '%'); write(p, '--my', num(p.my) + '%');
    }

    if (busy) requestAnimationFrame(frame); else running = false;
  }
  function write(p, k, v) { if (p.out[k] !== v) { p.host.style.setProperty(k, v); p.out[k] = v; } }

  /* ---------- wire up ---------- */
  // Background photo drifts a little with the cursor
  if (canHover) addPointer({ area: document.documentElement, host: scene, kx: '--gx', ky: '--gy', ease: 0.05 });

  // Hero: scroll progress + cursor depth + glow that follows the cursor
  var hero = $('.hero');
  if (hero) {
    addScroll(hero, '--hp', function () { return clamp(window.scrollY / Math.max(hero.offsetHeight, 1), 0, 1); });
    if (canHover) {
      var bg = $('.hero__bg', hero), glow = null;
      if (bg) { glow = document.createElement('div'); glow.className = 'hero__glow'; glow.setAttribute('aria-hidden', 'true'); bg.appendChild(glow); }
      addPointer({ area: hero, host: hero, spot: glow || hero, kx: '--cx', ky: '--cy', ease: 0.06 });
    }
  }

  // Pillars: grid drives the staggered card drift, each image has its own scroll value
  addScroll($('.pillars'), '--p');
  $$('.pillar').forEach(function (card) {
    var img = $('.pillar__img', card);
    if (img) addScroll(img, '--ip');
    // pointer is tracked on the whole card (its title button overlays the image)
    if (canHover && img) addPointer({ area: card, host: card, spot: img, kx: '--tx', ky: '--ty' });
  });

  // Mobile view (touch screens, or a window 900px wide or less): there is no cursor, so the pillar card and
  // the case-study screen that sit nearest the middle of the screen get the hover look by themselves
  // (lift / grow + light + image tilt) while you scroll. Wide desktop windows with a mouse never run this.
  var phoneMode = function () { return !canHover || matchMedia('(max-width: 900px)').matches; };
  var autoOn = false, autoQueued = false;
  var autoCards = $$('.pillar'), autoFrames = $$('.frame'), autoMetrics = $$('#why .grid .metric');
  function focusGroup(list, reach) {
    var best = null, bd = 1e9;
    list.forEach(function (c) {
      var r = c.getBoundingClientRect(), mid = r.top + r.height / 2 - vh / 2;
      var ty = clamp(mid / (vh / 2), -1, 1), tx = Math.sin(mid / vh * 4) * 0.9;
      c.style.setProperty('--ty', num(ty)); c.style.setProperty('--tx', num(tx));
      c.style.setProperty('--mx', num(50 + tx * 32) + '%'); c.style.setProperty('--my', num(50 + ty * 32) + '%');
      if (Math.abs(mid) < bd) { bd = Math.abs(mid); best = c; }
    });
    list.forEach(function (c) {
      var on = c === best && bd < vh * reach;
      c.classList.toggle('is-focus', on);
      c.classList.toggle('is-hot', on);
    });
  }
  function updateAuto() {
    autoQueued = false;
    if (!phoneMode()) {
      if (autoOn) {
        autoOn = false;
        autoCards.concat(autoFrames, autoMetrics).forEach(function (c) { c.classList.remove('is-focus'); ['--ty','--tx','--mx','--my'].forEach(function (k) { c.style.removeProperty(k); }); });
      }
      return;
    }
    autoOn = true;
    focusGroup(autoCards, 0.32);
    focusGroup(autoFrames, 0.45);
    focusGroup(autoMetrics, 0.3);
  }
  function queueAuto() { if (!autoQueued) { autoQueued = true; requestAnimationFrame(updateAuto); } }
  window.addEventListener('scroll', queueAuto, { passive: true });
  window.addEventListener('resize', queueAuto);
  window.addEventListener('load', queueAuto);
  updateAuto();

  // Metrics
  addScroll($('#why .grid'), '--mp');

  // Case studies
  $$('.case').forEach(function (c) {
    addScroll(c, '--cp');
    var fr = $('.frame', c);
    if (canHover && fr) addPointer({ area: fr, host: fr, kx: '--tx', ky: '--ty' });
  });

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; request(); });
  window.addEventListener('load', request);
  request();
})();


/* Standards command-center: the numbers count up (and SOC2 decodes) once when the section scrolls into view */
(function () {
  return; /* Standards numbers are static: no count-up / decode animation */
  var cc = document.querySelector('.se, .cc');
  if (!cc || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789', done = false;
  var io = new IntersectionObserver(function (es) {
    if (done || !es[0].isIntersecting) return;
    done = true; io.disconnect();
    [].forEach.call(cc.querySelectorAll('.cc__num'), function (el, i) {
      var final = el.textContent.trim(), m = final.match(/^(\d+(?:\.(\d+))?)(.*)$/), dec = m && m[2] ? m[2].length : 0;
      var t0 = performance.now() + 250 + i * 140, dur = 1500;
      (function tick(now) {
        var p = Math.min(Math.max((now - t0) / dur, 0), 1), e = 1 - Math.pow(1 - p, 3);
        if (m) el.textContent = (parseFloat(m[1]) * e).toFixed(dec) + m[3];
        else el.textContent = final.split('').map(function (c, k) { return k < p * final.length ? c : CH.charAt(Math.random() * CH.length | 0); }).join('');
        if (p < 1) requestAnimationFrame(tick); else el.textContent = final;
      })(performance.now());
    });
  }, { threshold: 0.4 });
  io.observe(cc);
})();