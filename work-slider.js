/* Seafog: example sites slider, used on the homepage and the website design
   page. The « » buttons page the row, grey out at either end, and hide when
   every thumbnail already fits. Swipe and trackpad work too. */
(function () {
  "use strict";
  var track = document.querySelector(".work-track");
  if (!track) return;
  var btns = document.querySelectorAll(".work-btn");
  function step() { return Math.max(144, Math.floor(track.clientWidth / 144) * 144); }
  var ctrls = document.querySelector(".work-ctrls");
  function sync() {
    ctrls.hidden = track.scrollWidth <= track.clientWidth + 2;
    btns[0].disabled = track.scrollLeft <= 2;
    btns[1].disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  }
  btns.forEach(function (b) {
    b.addEventListener("click", function () {
      track.scrollBy({ left: +b.dataset.dir * step(), behavior: "smooth" });
      setTimeout(sync, 600);
    });
  });
  track.addEventListener("scroll", sync, { passive: true });
  track.addEventListener("scrollend", sync);
  window.addEventListener("resize", sync);
  sync();

  /* hover tilt: each thumbnail is a springy flap that turns left or right.
     Hovering leans it toward the mouse; a fast sweep across the row kicks
     each one by the mouse speed, and neighbours pull on each other, so the
     row ripples and wobbles back to flat. */
  if (!window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
  var imgs = [].slice.call(track.querySelectorAll("img"));
  var ang = imgs.map(function () { return 0; }), vel = ang.slice(), aim = ang.slice();
  var LEAN = 14, KICK = 0.3, SPRING = 0.05, PULL = 0.02, DAMP = 0.86, LIMIT = 22;
  var running = false, lastX = null, lastT = 0;
  function frame() {
    var moving = false;
    for (var i = 0; i < imgs.length; i++) {
      var l = i ? ang[i - 1] : ang[i], r = i < imgs.length - 1 ? ang[i + 1] : ang[i];
      vel[i] += (aim[i] - ang[i]) * SPRING + (l + r - 2 * ang[i]) * PULL;
      vel[i] *= DAMP;
      ang[i] = Math.max(-LIMIT, Math.min(LIMIT, ang[i] + vel[i]));
      if (Math.abs(vel[i]) > 0.02 || Math.abs(ang[i] - aim[i]) > 0.05) moving = true;
      imgs[i].style.transform = "perspective(320px) rotateY(" + ang[i].toFixed(2) + "deg)";
    }
    running = moving;
    if (moving) requestAnimationFrame(frame);
  }
  function go() { if (!running) { running = true; requestAnimationFrame(frame); } }
  track.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var now = performance.now(), dx = lastX === null || now - lastT > 80 ? 0 : e.clientX - lastX;
    lastX = e.clientX; lastT = now;
    var a = e.target.closest("a"), i = a ? imgs.indexOf(a.querySelector("img")) : -1;
    if (i < 0) return;
    var r = a.getBoundingClientRect();
    aim[i] = ((e.clientX - r.left) / r.width - 0.5) * LEAN * 2;
    vel[i] += Math.max(-4, Math.min(4, dx * KICK));
    go();
  });
  track.addEventListener("pointerout", function (e) {
    var a = e.target.closest("a");
    if (!a || a.contains(e.relatedTarget)) return;
    var i = imgs.indexOf(a.querySelector("img"));
    if (i >= 0) { aim[i] = 0; go(); }
  });
  track.addEventListener("pointerleave", function () { lastX = null; });
})();
