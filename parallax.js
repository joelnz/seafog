/* Seafog — banner parallax.
   The .top banner is oversized in CSS (140% height, -20% top) precisely so it
   has slack to drift within: at a 0.15 scroll factor the banner would need to
   move roughly 0.15 * (scroll distance while .top is still on screen), and
   .top scrolls off-screen after roughly its own height, so 20% headroom on
   a real .top comfortably covers it at any viewport size. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var banner = document.querySelector(".top .banner");
  if (!banner) return;

  var ticking = false;
  function frame() {
    ticking = false;
    banner.style.transform = "translate3d(0," + (window.scrollY * 0.15).toFixed(1) + "px,0)";
  }
  addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  frame();
})();
