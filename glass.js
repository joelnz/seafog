/* Seafog — liquid glass.

   A displacement-map lens for backdrop-filter. The one thing that has to be
   right: the maps must be generated at the element's exact pixel size. SVG
   filter primitives default to primitiveUnits="userSpaceOnUse", so a
   width="100%" on <feImage> resolves against the SVG viewport — which is 0x0
   for a hidden <svg> — and the browser falls back to the image's intrinsic
   size. The lens then sits over the element at the wrong scale: one edge
   refracts, the opposite edge is off the map, and the map's own boundary shows
   as a hard line. So: measure, build the maps at that size, rebuild on resize.

   The ramps are specified in pixels, not percentages, so the bevel is the same
   physical width on every side whatever shape the element is.

   Each [data-glass] element gets its own filter. Nothing happens unless the
   browser can actually do backdrop-filter:url(), so Safari and Firefox keep the
   plain frosting in the stylesheet. */

/* Dev-only banner glass toggle. .top .in already carries data-glass, so the
   filter for it is always built below — this just decides whether any CSS
   actually points at --lens on that element. Flipped from the switch at the
   top of the ?tune=1 panel, remembered in localStorage so it stays on while
   clicking around the whole site to compare. A normal visitor never sets
   this key, so this never does anything for them. */
try {
  if (localStorage.getItem("seafog-glass-banner-2") === "1") {
    document.documentElement.classList.add("glass-banner");
  }
} catch (e) {}

window.SeafogLens = (function () {
  "use strict";

  var api = {}, items = [], n = 0;

  api.cfg = {
    strength: -43,    // how far the left and right ends bend the backdrop, px
    depth: 18,        // how far the top and bottom bend it, px
    edge: 60,         // width of the bevel the bending happens across, px (clamped to 45% of the element)
    aberration: 20,   // % difference between the red, green and blue passes
    softness: 0.6      // blur applied once the three passes recombine
  };

  api.supported = (function () {
    try {
      return CSS.supports("backdrop-filter", "url(#x)") ||
             CSS.supports("-webkit-backdrop-filter", "url(#x)");
    } catch (e) { return false; }
  })();

  // The profile of the bevel. Neutral grey (128) means "no shift"; the ends
  // swing to the extremes across `r` pixels. A straight ramp shears the
  // backdrop at a constant rate, which reads as a smear — a real rounded glass
  // edge bends hardest right at the rim and eases to nothing, so the stops
  // follow a quarter-circle: f = sqrt(1 - u^2) across the bevel.
  //
  // Sign convention: a negative scale samples OUTWARD, pulling the surroundings
  // into the rim the way a lens does. Chrome does serve the backdrop beyond the
  // element's own box, so that is the one that looks like glass; a positive
  // scale samples inward and merely magnifies what is already behind it.
  var STEPS = 9;

  function ramp(w, h, r, axis) {
    var span = axis === "x" ? w : h,
        c = function (v) {
          v = Math.max(0, Math.min(255, Math.round(v)));
          return axis === "x" ? "rgb(" + v + ",128,128)" : "rgb(128," + v + ",128)";
        },
        stops = "";

    for (var i = 0; i <= STEPS; i++) {
      var u = i / STEPS,                      // 0 at the rim, 1 at the bevel's inner end
          f = Math.pow(1 - u, 1.8),            // hardest at the rim, easing to nothing
          o = (u * r / span);
      stops += "%3Cstop offset='" + o.toFixed(4) + "' stop-color='" + c(128 + 127 * f) + "'/%3E";
      // the mirror stop at the far end, written in reverse below
    }
    for (var j = STEPS; j >= 0; j--) {
      var u2 = j / STEPS,
          f2 = Math.pow(1 - u2, 1.8),
          o2 = 1 - (u2 * r / span);
      stops += "%3Cstop offset='" + o2.toFixed(4) + "' stop-color='" + c(128 - 127 * f2) + "'/%3E";
    }

    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + w +
      "' height='" + h + "' preserveAspectRatio='none'%3E%3ClinearGradient id='g' x1='0' y1='0' x2='" +
      (axis === "x" ? "1' y2='0" : "0' y2='1") + "'%3E" + stops +
      "%3C/linearGradient%3E%3Crect width='" + w + "' height='" + h +
      "' fill='url(%23g)'/%3E%3C/svg%3E";
  }

  function build(item) {
    var r = item.el.getBoundingClientRect(),
        w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h) return;
    if (w === item.w && h === item.h && !item.dirty) return;
    item.w = w; item.h = h; item.dirty = false;

    var c = api.cfg,
        rx = Math.min(c.edge, w * 0.45),
        ry = Math.min(c.edge, h * 0.45),
        box = 'x="0" y="0" width="' + w + '" height="' + h + '"',
        s = '<feImage result="mx" preserveAspectRatio="none" ' + box +
            ' href="' + ramp(w, h, rx, "x") + '"/>' +
            '<feImage result="my" preserveAspectRatio="none" ' + box +
            ' href="' + ramp(w, h, ry, "y") + '"/>';

    // one pass per colour channel, each bending slightly differently
    ["R", "G", "B"].forEach(function (ch, i) {
      var k = 1 + (1 - i) * (c.aberration / 100),
          m = [[1,0,0],[0,1,0],[0,0,1]][i];
      s += '<feDisplacementMap in="SourceGraphic" in2="mx" scale="' + (c.strength * k).toFixed(2) +
           '" xChannelSelector="R" yChannelSelector="G" result="' + ch + '1"/>' +
           '<feDisplacementMap in="' + ch + '1" in2="my" scale="' + (c.depth * k).toFixed(2) +
           '" xChannelSelector="R" yChannelSelector="G" result="' + ch + '2"/>' +
           '<feColorMatrix in="' + ch + '2" type="matrix" result="' + ch + '" values="' +
           m[0] + ' 0 0 0 0  0 ' + m[1] + ' 0 0 0  0 0 ' + m[2] + ' 0 0  0 0 0 1 0"/>';
    });

    s += '<feBlend in="R" in2="G" mode="screen" result="RG"/>' +
         '<feBlend in="RG" in2="B" mode="screen" result="RGB"/>' +
         '<feGaussianBlur in="RGB" stdDeviation="' + c.softness + '"/>';

    item.filter.innerHTML = s;
  }

  api.apply = function () {
    items.forEach(function (i) { i.dirty = true; build(i); });
  };

  api.init = function () {
    if (!api.supported) return;
    var els = document.querySelectorAll("[data-glass]");
    if (!els.length) return;

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    document.body.appendChild(svg);

    [].forEach.call(els, function (el) {
      var id = "lens" + (++n),
          f = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      f.setAttribute("id", id);
      // The filter region is the border box exactly, not enlarged. An enlarged
      // region sounds like the right way to let outward (negative-scale)
      // displacement reach real backdrop beyond the element — and Chrome does
      // serve that data — but the displacement MAPS below are only painted
      // across the element's own w×h. Outside that box, inside the enlarged
      // region, feImage renders transparent black, which back-converts to a
      // constant extreme displacement rather than a continued ramp. That
      // constant band meets the ramp right at the element's own edge, i.e.
      // exactly at the visible rim — a hard seam along the top and bottom.
      // A tight region avoids the mismatch: everything the maps don't cover
      // simply isn't part of the filter, so there is nothing to disagree with.
      f.setAttribute("x", "0%"); f.setAttribute("y", "0%");
      f.setAttribute("width", "100%"); f.setAttribute("height", "100%");
      f.setAttribute("color-interpolation-filters", "sRGB");
      svg.appendChild(f);

      var item = { el: el, filter: f, w: 0, h: 0, dirty: true };
      items.push(item);
      build(item);
      el.style.setProperty("--lens", "url(#" + id + ")");

      if (window.ResizeObserver) new ResizeObserver(function () { build(item); }).observe(el);
    });

    document.documentElement.classList.add("lens-on");
    addEventListener("resize", function () {
      items.forEach(build);
    }, { passive: true });
  };

  return api;
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () { SeafogLens.init(); });
} else {
  SeafogLens.init();
}
