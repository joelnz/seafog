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

  /* hover tilt: the thumbnail leans toward the mouse like a little block,
     with its edge showing on the side that turns toward you */
  if (!window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
  var MAX = 22, DEPTH = 7;
  function tilt(img, px, py) {
    var ext = [];
    for (var i = 1; i <= DEPTH; i++) ext.push((px * i * 1.1).toFixed(1) + "px " + (py * i * 1.1).toFixed(1) + "px 0 #6d6d6d");
    img.style.transform = "perspective(420px) rotateX(" + (-py * MAX).toFixed(1) + "deg) rotateY(" + (px * MAX).toFixed(1) + "deg) scale(1.06)";
    img.style.boxShadow = ext.join(",") + "," + (px * 14).toFixed(1) + "px " + (py * 14 + 8).toFixed(1) + "px 14px rgba(0,0,0,.28)";
  }
  track.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var a = e.target.closest("a"), img = a && a.querySelector("img");
    if (!img) return;
    var r = a.getBoundingClientRect();
    img.classList.add("tilting");
    tilt(img, (e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
  });
  track.addEventListener("pointerout", function (e) {
    var a = e.target.closest("a");
    if (!a || a.contains(e.relatedTarget)) return;
    var img = a.querySelector("img");
    img.classList.remove("tilting");
    img.style.transform = ""; img.style.boxShadow = "";
  });
})();
