/* Seafog: scroll motion.

   Off for anyone who has asked for reduced motion. The square
   illustrations are squares.js; this file only handles arrivals.

   Arrivals. Anything marked by `pick` below gets data-in, and .is-in once
      it crosses into view. The CSS decides what arriving looks like. Fires
      once per element. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.documentElement.classList.add("motion");

  /* ---- arrivals ---- */
  if (!("IntersectionObserver" in window)) return;

  var pick = [
    "main section h2",
    "main section > .in > .lede",
    ".offer",
    ".grid:not(.cities) .card",
    ".row"
  ].join(",");

  var els = [].slice.call(document.querySelectorAll(pick));
  els.forEach(function (el) {
    /* stagger siblings in a grid row: position among siblings, capped */
    var i = 0, sib = el;
    if (el.classList.contains("card")) {
      while ((sib = sib.previousElementSibling)) i++;
      i = i % 4;
    }
    el.setAttribute("data-in", String(i));
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

  els.forEach(function (el) { io.observe(el); });
})();
