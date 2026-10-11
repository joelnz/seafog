/* Seafog: the colour series.

   After Richard Paul Lohse's systematic colour grids. Every square is the
   same size, sits on one grid, and takes its colour from its position:
   colour = (column + row + offset) mod 8, columns counted in from the right
   edge. That makes strict diagonals, and every field on the page belongs to
   the same series.

     .top .field   a column down the right side of the page header
     .field.tab    three squares hanging from the top of each section
     .field.bar    a full-width colour bar that the footer sits on

   As the page scrolls the whole series steps on by one colour, instantly.
   Squares never move, shrink, fade or tween. Reduced motion: no stepping. */
(function () {
  "use strict";

  /* ordered as a spectrum so the diagonals read as a series */
  var SERIES = ["#ffc93c", "#ff7a2f", "#f2413d", "#ff6fa5", "#9c7bff", "#2546f0", "#4cc3ff", "#1fcf9b"];
  var N = SERIES.length;
  var STEP = 90; /* px of scroll per colour step */
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function cellSize() { return Math.round(Math.min(Math.max(innerWidth * 0.034, 26), 56)); }

  /* section tabs, made here so the markup stays clean */
  [].forEach.call(document.querySelectorAll("main section"), function (sec, i) {
    /* none on the first section: it would sit straight under the header's column */
    if (i === 0 || sec.querySelector(":scope > .field.tab")) return;
    var d = document.createElement("div");
    d.className = "field tab"; d.setAttribute("aria-hidden", "true");
    sec.appendChild(d);
  });

  var fields = [].map.call(document.querySelectorAll(".field"), function (el, i) {
    var c = document.createElement("canvas");
    el.appendChild(c);
    return { el: el, canvas: c, ctx: c.getContext("2d"), shift: i * 3, W: 0, H: 0 };
  });
  if (!fields.length) return;

  var cs = cellSize(), offset = -1;

  function size(f) {
    var r = f.el.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    f.W = Math.round(r.width); f.H = Math.round(r.height);
    f.canvas.width = Math.round(f.W * dpr); f.canvas.height = Math.round(f.H * dpr);
    f.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function paint(f) {
    var ctx = f.ctx, cols = Math.floor(f.W / cs), rows = Math.floor(f.H / cs);
    ctx.clearRect(0, 0, f.W, f.H);
    for (var y = 0; y < rows; y++)
      for (var x = 0; x < cols; x++) {
        ctx.fillStyle = SERIES[(((x + y + offset + f.shift) % N) + N) % N];
        /* anchored to the top-right corner; the +1 closes antialiasing seams */
        ctx.fillRect(f.W - (x + 1) * cs, y * cs, cs + 1, cs + 1);
      }
  }

  function all() {
    var o = reduce ? 0 : Math.floor(scrollY / STEP);
    if (o === offset) return;
    offset = o;
    fields.forEach(paint);
  }

  var lastW = 0, lastH = 0;
  /* make the header a whole number of squares tall, so the column down its
     right side ends exactly on the bottom rule instead of short of it */
  function snapHeader() {
    var top = document.querySelector(".top"), hf = top && top.querySelector(".field");
    if (!hf) return;
    top.style.paddingBottom = "";
    if (getComputedStyle(hf).position !== "absolute") return;
    var h = hf.getBoundingClientRect().height, extra = (cs - (Math.round(h) % cs)) % cs;
    if (extra) top.style.paddingBottom = (parseFloat(getComputedStyle(top).paddingBottom) + extra) + "px";
  }

  function layout() {
    cs = cellSize();
    document.documentElement.style.setProperty("--cell", cs + "px");
    snapHeader();
    fields.forEach(size);
    offset = -1; all();
  }

  layout();
  addEventListener("resize", layout);
  if (window.ResizeObserver) {
    /* the --cell change above resizes the fields; only relayout on a real change */
    var ro = new ResizeObserver(function () {
      var w = innerWidth, h = document.documentElement.scrollHeight;
      if (w === lastW && h === lastH) return;
      lastW = w; lastH = h; layout();
    });
    fields.forEach(function (f) { ro.observe(f.el); });
  }
  if (!reduce) {
    var ticking = false;
    addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; all(); }); }
    }, { passive: true });
  }
})();
