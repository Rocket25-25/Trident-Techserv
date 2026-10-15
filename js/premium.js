/* Pauses the hero's looping CSS motion while the hero is off-screen (saves paint work). */
(function () {
  var hero = document.querySelector('.hero');
  if (!hero || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (es) {
    es.forEach(function (e) { hero.classList.toggle('is-offscreen', !e.isIntersecting); });
  }, { threshold: 0 }).observe(hero);
})();
