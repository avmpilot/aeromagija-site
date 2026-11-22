/* Aeromagija — play muted loop videos only while visible. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("video[data-autoplay]").forEach((v) => {
    if (reduce) { v.controls = true; return; }
    new IntersectionObserver((es) => { es[0].isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.4 }).observe(v);
  });
})();
