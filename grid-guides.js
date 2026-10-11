/* persistent overlay tracing the real column grid the site is built on */
(function () {
  var wrap = document.createElement('div');
  wrap.id = 'gridGuides';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML =
    '<div class="v left"></div>' +
    '<div class="v right"></div>' +
    '<div class="tick tl"></div>' +
    '<div class="tick tr"></div>' +
    '<div class="spec">1180 / 80 grid</div>';
  document.body.appendChild(wrap);
})();
