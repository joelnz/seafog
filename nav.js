/* Seafog — the bar gets out of the way going down and comes back coming up.

   Hysteresis matters more than it looks: a phone's scroll fires a stream of
   sub-pixel deltas, and reacting to every one makes the bar flicker between
   states. THRESH swallows that noise, and `last` only advances on a movement
   big enough to count, so a slow drift still accumulates into a decision. */
(function () {
  "use strict";

  var nav = document.querySelector(".nav");
  if (!nav) return;

  var THRESH = 8;    /* px of travel before a direction change is believed */
  var ARM_AT = 140;  /* never hide while the header is still near the top */

  var last = window.scrollY;
  var ticking = false;

  function frame() {
    ticking = false;

    var y = window.scrollY;
    var dy = y - last;

    /* the hairline border is invisible against the hero, so the shadow is what
       separates the bar from the page once it is genuinely floating over it */
    if (y > 4) nav.setAttribute("data-stuck", "");
    else nav.removeAttribute("data-stuck");

    if (Math.abs(dy) >= THRESH) {
      if (y > ARM_AT && dy > 0) nav.setAttribute("data-hidden", "");
      else nav.removeAttribute("data-hidden");
      last = y;
    }

    /* back in the top band it is always visible, whatever the last direction was */
    if (y <= ARM_AT) nav.removeAttribute("data-hidden");
  }

  addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });

  /* tabbing into a hidden bar would otherwise focus something off-screen */
  nav.addEventListener("focusin", function () {
    nav.removeAttribute("data-hidden");
  });

  frame();
})();
