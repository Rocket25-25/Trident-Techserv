/* Scale Engine - visual for "Built for Predictable Scale". Plain canvas, no libraries.
   One stable core -> many systems -> unlimited expansion.
   Stages: 1 core idles - 2 activation pulse - 3 network expands - 4 network scales - 5 stable (particles keep flowing).
   Hover: network expands, lines brighten, particles speed up, core glows, pulses come faster. */
(function () {
  var root = document.getElementById('scaleEngine');
  if (!root) return;
  var cv = root.querySelector('.se__canvas'), ctx = cv && cv.getContext('2d');
  if (!ctx) return;
  var stage = root.querySelector('.se__stage'), steps = root.querySelectorAll('.se__step');
  var reduce = true; /* static network: no animation */
  var W = 0, H = 0, dpr = 1, T = reduce ? 30 : 0, hv = 0, hvT = 0, last = 0, running = false, curStage = 0, lastPulse = 0, col = {}, dark = true;
  var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (p) { return 1 - Math.pow(1 - p, 3); };

  /* network layers: [nodes, radius, spawn start (s), delay per node (s)] */
  var LAYERS = [[6, .18, 2.4, .12], [12, .34, 3.6, .09], [18, .5, 4.9, .07]], nodes = [], starts = [];
  LAYERS.forEach(function (L, k) {
    starts[k] = nodes.length;
    for (var i = 0; i < L[0]; i++) {
      nodes.push({ k: k, i: i, a: i / L[0] * Math.PI * 2 + (k % 2 ? .26 : 0) + (rnd() - .5) * .1, r: L[1] * (1 + (rnd() - .5) * .06),
        par: k ? starts[k - 1] + Math.floor(i * LAYERS[k - 1][0] / L[0]) : -1, t: L[2] + i * L[3], bar: k === 2 && i % 4 === 1, x: 0, y: 0, e: 0 });
    }
  });
  var pulses = [], parts = [], dust = [], streams = [], k2;
  for (k2 = 0; k2 < 46; k2++) dust.push({ x: rnd(), y: rnd(), v: .004 + rnd() * .012, p: rnd() * 6.3 });
  for (k2 = 0; k2 < 7; k2++) streams.push({ x: .08 + rnd() * .84, v: .08 + rnd() * .12, p: rnd() });

  function readColors() {
    var cs = getComputedStyle(root);
    col = { a: cs.getPropertyValue('--se-a').trim() || '#00b9e9', b: cs.getPropertyValue('--se-b').trim() || '#0879ed', hot: cs.getPropertyValue('--se-hot').trim() || '#9be8ff',
            line: cs.getPropertyValue('--se-line').trim() || '#7fb8ff', node: cs.getPropertyValue('--se-node').trim() || '#fff' };
    dark = document.documentElement.getAttribute('data-theme') === 'dark';
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (reduce || !running) draw();
  }
  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function dot(x, y, r, c, a) { ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }

  function draw() {
    var cx = W / 2, cy = H * .46, RX = W * .9, RY = H * .8, i, n, p;
    var S = 1; /* fixed size, no zoom */
    var accent = hv > .3 ? col.hot : col.a;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over'; ctx.lineWidth = 1;

    /* subtle perspective grid underneath */
    var gv = ease(clamp((T - .4) / 1.6, 0, 1)), hz = H * .66;
    ctx.strokeStyle = col.line;
    for (i = 0; i < 9; i++) { ctx.globalAlpha = .13 * gv * (.3 + i / 8 * .7); var gy = hz + Math.pow(i / 8, 1.8) * (H - hz); line(0, gy, W, gy); }
    for (i = -9; i <= 9; i++) { ctx.globalAlpha = .1 * gv; line(cx + i * W * .012, hz, cx + i * W * .11, H); }

    /* vertical data streams */
    var sv = ease(clamp((T - 3) / 2, 0, 1));
    streams.forEach(function (s) {
      var x = s.x * W; ctx.globalAlpha = .07 * sv; ctx.strokeStyle = col.line; line(x, H * .08, x, H * .92);
      var y = H * .08 + ((T * s.v + s.p) % 1) * H * .84; ctx.globalAlpha = (.5 + .3 * hv) * sv; ctx.strokeStyle = accent; ctx.lineWidth = 1.5; line(x, y, x, y + 22); ctx.lineWidth = 1;
    });

    /* orbital rings + a marker travelling on each */
    LAYERS.forEach(function (L, k) {
      var rv = ease(clamp((T - 1.6 - k * .5) / 1.5, 0, 1)); if (!rv) return;
      var rx = L[1] * RX * S * 1.06, ry = L[1] * RY * S * 1.06;
      ctx.globalAlpha = (.2 + .12 * hv) * rv; ctx.strokeStyle = col.line; ctx.setLineDash([3, 9]); ctx.lineDashOffset = -T * 6 * (k % 2 ? -1 : 1);
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
      var an = T * (.32 - k * .08) * (k % 2 ? -1 : 1); dot(cx + Math.cos(an) * rx, cy + Math.sin(an) * ry, 2.2, accent, .9 * rv);
    });

    /* activation pulses travelling outward from the core */
    if (T > 1.2 && T - lastPulse > (hv > .3 ? 1.5 : 3.6)) { pulses.push(T); lastPulse = T; }
    pulses = pulses.filter(function (s) { return T - s < 2.8; });
    pulses.forEach(function (s) {
      var u = (T - s) / 2.8, f = u * .62; ctx.globalAlpha = (1 - u) * .5; ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy, f * RX * S, f * RY * S, 0, 0, 6.2832); ctx.stroke(); ctx.lineWidth = 1;
    });

    /* node positions (they grow out of their parent, smoothly) */
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; n.e = ease(clamp((T - n.t) / 1.4, 0, 1));
      var Sk = S, tx = cx + Math.cos(n.a) * n.r * RX * Sk, ty = cy + Math.sin(n.a) * n.r * RY * Sk;
      var px = n.par < 0 ? cx : nodes[n.par].x, py = n.par < 0 ? cy : nodes[n.par].y;
      n.x = px + (tx - px) * n.e; n.y = py + (ty - py) * n.e;
      n.g = 0; pulses.forEach(function (s) { var d = (n.r - (T - s) / 2.8 * .62) / .07; n.g = Math.max(n.g, Math.exp(-d * d)); });
    }

    /* connections */
    ctx.strokeStyle = col.line;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; if (!n.e) continue;
      var qx = n.par < 0 ? cx : nodes[n.par].x, qy = n.par < 0 ? cy : nodes[n.par].y;
      ctx.globalAlpha = (.3 + .25 * hv + .4 * n.g) * n.e; ctx.lineWidth = n.g > .2 ? 1.4 : 1; line(qx, qy, n.x, n.y);
      var m = nodes[i + 1];
      if (n.k && m && m.k === n.k && n.e > .99 && m.e > .99) { ctx.globalAlpha = .1 + .1 * hv; ctx.lineWidth = 1; line(n.x, n.y, m.x, m.y); }
    }
    ctx.lineWidth = 1;

    /* data particles flowing through the connections */
    if (T > 5.4 && parts.length < 64 && rnd() < .5 + .5 * hv) { var ni = starts[1] + Math.floor(rnd() * (nodes.length - starts[1])); if (nodes[ni].e > .99) parts.push({ n: ni, p: 0, v: .25 + rnd() * .35, out: rnd() < .7 }); }
    if (T > 3.2 && parts.length < 64 && rnd() < .15) { var n0 = Math.floor(rnd() * 6); if (nodes[n0].e > .99) parts.push({ n: n0, p: 0, v: .3 + rnd() * .3, out: rnd() < .7 }); }
    parts = parts.filter(function (q) { return q.p < 1; });
    parts.forEach(function (q) {
      q.p += q.v * (1 + 1.6 * hv) * .016; n = nodes[q.n];
      var ax = n.par < 0 ? cx : nodes[n.par].x, ay = n.par < 0 ? cy : nodes[n.par].y, u = q.out ? q.p : 1 - q.p;
      var x = ax + (n.x - ax) * u, y = ay + (n.y - ay) * u;
      dot(x, y, 4, accent, .22); dot(x, y, 1.7, dark ? '#fff' : col.b, .95);
    });

    /* nodes (+ tiny metric bars on a few outer nodes) */
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; if (!n.e) continue;
      var nr = (2.2 + (2 - n.k) * 1.1 + 2 * n.g) * n.e;
      ctx.shadowColor = accent; ctx.shadowBlur = 8 + 12 * n.g;
      dot(n.x, n.y, nr, n.g > .25 ? accent : col.node, (.85 + .15 * n.g) * n.e); ctx.shadowBlur = 0;
      ctx.globalAlpha = .35 * n.e; ctx.strokeStyle = accent; ctx.beginPath(); ctx.arc(n.x, n.y, nr + 4, 0, 6.2832); ctx.stroke();
      if (n.bar && n.e > .99) for (p = 0; p < 3; p++) { var bh = 3 + 7 * (.5 + .5 * Math.sin(T * 2 + n.i + p * 1.3)); ctx.globalAlpha = .6; ctx.fillStyle = accent; ctx.fillRect(n.x + 9 + p * 4, n.y + 5 - bh, 2, bh); }
    }

    /* core: pulsing orb */
    var ci = ease(clamp(T / 1.2, 0, 1)), cr = Math.min(W, H) * .075 * (1 + .04 * Math.sin(T * 1.6)) * ci, gl = 1 + .6 * hv, g;
    if (cr > 1) {
      g = ctx.createRadialGradient(cx, cy, cr * .4, cx, cy, cr * 3.4); g.addColorStop(0, accent); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = .5 * ci * gl * (dark ? 1 : .55); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, cr * 3.4, 0, 6.2832); ctx.fill();
      g = ctx.createRadialGradient(cx - cr * .3, cy - cr * .3, cr * .1, cx, cy, cr);
      g.addColorStop(0, '#fff'); g.addColorStop(.45, accent); g.addColorStop(1, col.b);
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = .55 * ci; ctx.strokeStyle = accent; ctx.beginPath(); ctx.arc(cx, cy, cr * 1.4, 0, 6.2832); ctx.stroke();
    }

    /* floating particles */
    dust.forEach(function (d) { dot(d.x * W, (((d.y - T * d.v) % 1) + 1) % 1 * H, 1, col.line, (.15 + .25 * Math.sin(T + d.p) * Math.sin(T + d.p)) * ci); });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    /* stage label under the visual */
    var s = T < 1.2 ? 1 : T < 2.4 ? 2 : T < 4.9 ? 3 : T < 7.4 ? 4 : 5;
    if (s !== curStage) { curStage = s; root.setAttribute('data-stage', s); [].forEach.call(steps, function (el, k) { el.classList.toggle('is-on', k < s); }); }
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, .05); last = now;
    try { T += dt; hv += (hvT - hv) * clamp(dt * 4, 0, 1); draw(); } catch (e) { running = false; if (window.console) console.error(e); }
  }
  function start() { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }

  readColors(); resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  new MutationObserver(function () { readColors(); if (!running) draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (reduce) { for (var q = 0; q < 30; q++) { var ni0 = starts[1] + Math.floor(rnd() * (nodes.length - starts[1])); parts.push({ n: ni0, p: .15 + rnd() * .7, v: 0, out: rnd() < .7 }); } draw(); return; }
  root.addEventListener('pointerenter', function () { hvT = 1; });
  root.addEventListener('pointerleave', function () { hvT = 0; });
  root.addEventListener('touchstart', function () { hvT = 1; setTimeout(function () { hvT = 0; }, 1800); }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); else running = false; }, { threshold: .25 }).observe(root);
  else start();
})();