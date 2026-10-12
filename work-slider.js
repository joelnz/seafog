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
})();
