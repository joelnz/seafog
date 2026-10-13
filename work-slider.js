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

  /* hover tilt: the thumbnail turns left or right like a flat card,
     following the mouse across it */
  if (!window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
  var MAX = 24;
  function tilt(img, px) {
    img.style.transform = "perspective(500px) rotateY(" + (px * MAX).toFixed(1) + "deg)";
  }
  track.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var a = e.target.closest("a"), img = a && a.querySelector("img");
    if (!img) return;
    var r = a.getBoundingClientRect();
    img.classList.add("tilting");
    tilt(img, (e.clientX - r.left) / r.width - 0.5);
  });
  track.addEventListener("pointerout", function (e) {
    var a = e.target.closest("a");
    if (!a || a.contains(e.relatedTarget)) return;
    var img = a.querySelector("img");
    img.classList.remove("tilting");
    img.style.transform = "";
  });
})();
