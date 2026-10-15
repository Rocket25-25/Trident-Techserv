/* Loaded in <head> (no defer) so the saved theme is applied before first paint. */
(function () {
  var KEY = 'theme', root = document.documentElement;
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function system() { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  root.classList.add('js');
  root.setAttribute('data-theme', saved() || system());

  window.TridentTheme = {
    init: function () {
      var btn = document.querySelector('[data-theme-toggle]');
      if (!btn) return;
      function sync() {
        var dark = root.getAttribute('data-theme') === 'dark';
        var label = dark ? 'Switch to light theme' : 'Switch to dark theme';
        btn.setAttribute('aria-label', label); btn.title = label; btn.setAttribute('aria-pressed', dark);
      }
      sync();
      // Theme switch = one clean cross-fade of the whole page (browser snapshot), not a colour transition on every
      // element. The old per-element fade was heavy (blurred cards + the hero video swap) and could leave dark text on
      // the dark video, or the reverse, for a few seconds. Falls back to an instant switch where unsupported.
      var st = document.createElement('style');
      st.textContent = '.theme-instant *,.theme-instant *::before,.theme-instant *::after{transition:none!important}' +
        '::view-transition-old(root),::view-transition-new(root){animation-duration:.3s}';
      document.head.appendChild(st);
      // warm the cache with both hero posters so the video swap never flashes an empty frame
      ['assets/video/hero-tech-poster.jpg', 'assets/video/hero-tech-light-poster.jpg'].forEach(function (u) { new Image().src = u; });

      btn.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        function apply() {
          root.setAttribute('data-theme', next);
          try { localStorage.setItem(KEY, next); } catch (e) {}
          sync();
        }
        function done() { root.classList.remove('theme-instant'); }
        root.classList.add('theme-instant');
        if (document.startViewTransition && !reduce) {
          try { var vt = document.startViewTransition(apply); vt.finished.then(done, done); return; } catch (e) {}
        }
        apply();
        setTimeout(done, 80);
      });
    }
  };
})();