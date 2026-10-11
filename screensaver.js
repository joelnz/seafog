/* Seafog: the screensaver. After a minute with no input, a flat-shaded orange
   cube with "Are you still there?" on every face bounces around the window,
   1998 style. No library: a hand-rolled orthographic cube on a 2D canvas,
   drawn at a third of screen resolution and scaled up with hard pixels.
   Any mouse, key, touch or scroll input dismisses it. ?saver=1 starts it
   after three seconds, for testing. */
(function () {
  "use strict";
  if (!window.requestAnimationFrame) return;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (e) {}

  var IDLE_MS = /[?&]saver=1/.test(location.search) ? 3000 : 60000;
  var PIXEL = 3;                       // one canvas pixel = 3 screen pixels
  var timer = null, running = false, raf = 0, last = 0;
  var canvas, ctx, tex;
  var W, H, size, px, py, vx, vy, ax = 0.6, ay = 0.4, az = 0;

  /* faces: outward normal, texture "right" and "up" directions */
  var FACES = [
    { n: [0, 0, 1],  u: [1, 0, 0],  up: [0, 1, 0] },
    { n: [0, 0, -1], u: [-1, 0, 0], up: [0, 1, 0] },
    { n: [1, 0, 0],  u: [0, 0, -1], up: [0, 1, 0] },
    { n: [-1, 0, 0], u: [0, 0, 1],  up: [0, 1, 0] },
    { n: [0, 1, 0],  u: [1, 0, 0],  up: [0, 0, -1] },
    { n: [0, -1, 0], u: [1, 0, 0],  up: [0, 0, 1] }
  ];
  var LIGHT = norm([-0.45, 0.6, 0.75]);

  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function add(a, b, k) { return [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]; }

  function rotate(v) {
    var x = v[0], y = v[1], z = v[2], c, s, t;
    c = Math.cos(ax); s = Math.sin(ax); t = y * c - z * s; z = y * s + z * c; y = t;
    c = Math.cos(ay); s = Math.sin(ay); t = x * c + z * s; z = -x * s + z * c; x = t;
    c = Math.cos(az); s = Math.sin(az); t = x * c - y * s; y = x * s + y * c; x = t;
    return [x, y, z];
  }

  /* the face texture: orange tile, bevelled edge, chunky text */
  function makeTexture() {
    var t = document.createElement("canvas"), g, i;
    t.width = t.height = 64;
    g = t.getContext("2d");
    g.fillStyle = "#ff8a00"; g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#ffc266"; g.fillRect(0, 0, 64, 3); g.fillRect(0, 0, 3, 64);
    g.fillStyle = "#b35400"; g.fillRect(0, 61, 64, 3); g.fillRect(61, 0, 3, 64);
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "bold 11px Verdana, Tahoma, sans-serif";
    var lines = ["ARE YOU", "STILL", "THERE?"];
    for (i = 0; i < 3; i++) {
      g.fillStyle = "#7a3a00"; g.fillText(lines[i], 33, 19 + i * 13);
      g.fillStyle = "#fff";    g.fillText(lines[i], 32, 18 + i * 13);
    }
    return t;
  }

  function resize() {
    W = canvas.width = Math.ceil(innerWidth / PIXEL);
    H = canvas.height = Math.ceil(innerHeight / PIXEL);
    size = Math.max(14, Math.min(W, H) * 0.11);
    ctx.imageSmoothingEnabled = false;
  }

  function build() {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;" +
      "image-rendering:pixelated;image-rendering:crisp-edges;cursor:none;display:none";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    tex = makeTexture();
    addEventListener("resize", function () { if (running) resize(); });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, i, f, n, k;
    for (i = 0; i < FACES.length; i++) {
      f = FACES[i];
      n = rotate(f.n);
      if (n[2] <= 0.001) continue;     // facing away
      var u = f.u, d = [-f.up[0], -f.up[1], -f.up[2]];
      var tl = rotate(add(add(f.n, u, -1), d, -1));
      var tr = rotate(add(add(f.n, u, 1), d, -1));
      var br = rotate(add(add(f.n, u, 1), d, 1));
      var bl = rotate(add(add(f.n, u, -1), d, 1));
      var P = [tl, tr, br, bl].map(function (v) { return [px + v[0] * size, py - v[1] * size]; });
      for (k = 0; k < 4; k++) {
        minX = Math.min(minX, P[k][0]); maxX = Math.max(maxX, P[k][0]);
        minY = Math.min(minY, P[k][1]); maxY = Math.max(maxY, P[k][1]);
      }
      /* map the 64px texture onto the face: an affine transform is exact
         for a square under orthographic projection */
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[1][0], P[1][1]);
      ctx.lineTo(P[2][0], P[2][1]); ctx.lineTo(P[3][0], P[3][1]); ctx.closePath();
      ctx.clip();
      ctx.setTransform((P[1][0] - P[0][0]) / 64, (P[1][1] - P[0][1]) / 64,
                       (P[3][0] - P[0][0]) / 64, (P[3][1] - P[0][1]) / 64, P[0][0], P[0][1]);
      ctx.drawImage(tex, 0, 0);
      ctx.restore();
      /* flat shading */
      var lit = 0.6 + 0.4 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      ctx.beginPath();
      ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[1][0], P[1][1]);
      ctx.lineTo(P[2][0], P[2][1]); ctx.lineTo(P[3][0], P[3][1]); ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0," + (1 - lit).toFixed(3) + ")";
      ctx.fill();
      ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke();
    }
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
  }

  function frame(t) {
    if (!running) return;
    var dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    px += vx * dt; py += vy * dt;
    ax += 0.9 * dt; ay += 1.3 * dt; az += 0.4 * dt;
    var b = draw();
    /* bounce off the window edges, nudging back inside so it never sticks */
    if (b.minX < 0 && vx < 0) { vx = -vx; px -= b.minX; }
    if (b.maxX > W && vx > 0) { vx = -vx; px -= b.maxX - W; }
    if (b.minY < 0 && vy < 0) { vy = -vy; py -= b.minY; }
    if (b.maxY > H && vy > 0) { vy = -vy; py -= b.maxY - H; }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || document.hidden) return;
    if (!canvas) build();
    resize();
    px = W * (0.25 + Math.random() * 0.5); py = H * (0.25 + Math.random() * 0.5);
    var speed = Math.max(40, Math.min(W, H) * 0.35);
    vx = speed * (Math.random() < 0.5 ? -1 : 1); vy = speed * 0.75 * (Math.random() < 0.5 ? -1 : 1);
    running = true; last = 0;
    canvas.style.display = "block";
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    if (canvas) canvas.style.display = "none";
  }

  function wake(e) {
    var was = running;
    stop();
    /* a click that dismisses the screensaver shouldn't also follow a link */
    if (was && e && (e.type === "mousedown" || e.type === "touchstart")) {
      addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(function () { removeEventListener("click", swallow, { capture: true }); }, 600);
    }
    clearTimeout(timer);
    timer = setTimeout(start, IDLE_MS);
  }
  function swallow(e) { e.preventDefault(); e.stopPropagation(); }

  ["mousemove", "mousedown", "keydown", "touchstart", "wheel", "scroll"].forEach(function (type) {
    addEventListener(type, wake, { passive: true, capture: true });
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) wake(); });
  wake();
})();
