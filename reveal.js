/* Seafog — scroll reveal.
   Headings, cards and rows fade and lift into place as they cross into view,
   instead of just being static the moment the page loads. Cards inside the
   same .grid stagger slightly so a row arrives as a small cascade rather than
   all at once. Nothing moves for anyone who has asked for reduced motion. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  var targets = document.querySelectorAll(
    "main section h2, main section .card, main section .row, main section ul.ticks"
  );
  if (!targets.length) return;

  targets.forEach(function (el, i) {
    el.classList.add("reveal");
    var siblingsUp = el.parentElement ? el.parentElement.children.length : 1;
    var stagger = Math.min(i % Math.max(siblingsUp, 1), 4) * 70;
    el.style.transitionDelay = stagger + "ms";
  });

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach(function (el) { io.observe(el); });
})();
