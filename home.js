/* Seafog home: the search.

   Nine results for whatever the visitor types. "Your business" starts on
   the last line and climbs one place at a time to the first, overtaking
   each result on the way. Runs once when the panel first comes into view,
   and again on every search or example. Rows only move: nothing fades or
   shrinks. With reduced motion the list simply shows the finished order.

   The other results are generic on purpose (example.com style addresses,
   no real businesses named): it is an illustration and says so. */
(function () {
  "use strict";

  var list = document.querySelector(".serp-list");
  var form = document.querySelector(".serp-search");
  var input = document.getElementById("serp-q");
  if (!list || !form || !input) return;

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var timer = null;

  function cap(s) { return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }

  function results(q) {
    q = q.trim().replace(/\s+/g, " ").slice(0, 60) || "electrician christchurch";
    var words = q.split(" ");
    var city = words.length > 1 ? cap(words[words.length - 1]) : "your area";
    var slug = q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
      you: { t: "Your business, " + city, u: "yourbusiness.co.nz" },
      others: [
        { t: "The 10 best " + q + " near you", u: "directory.example/" + slug },
        { t: cap(q) + ": compare quotes", u: "quotes.example/" + slug },
        { t: "A national chain with a big ad budget", u: "franchise.example" },
        { t: "Another " + city + " business with a newer website", u: "competitor.example" },
        { t: "A Facebook page, last posted in 2022", u: "facebook.example" }
      ]
    };
  }

  function row(item, you) {
    var li = document.createElement("li");
    if (you) li.className = "you";
    li.innerHTML = '<span class="rk"></span>' +
      '<span class="t"><b></b><span></span></span>';
    li.querySelector("b").textContent = item.t;
    li.querySelector(".t span").textContent = item.u;
    return li;
  }

  /* order[i] = the row element at position i */
  function place(order) {
    var h = order[0].offsetHeight;
    order.forEach(function (li, i) {
      li.style.transform = "translateY(" + (i * h) + "px)";
      li.querySelector(".rk").textContent = (i + 1) + ".";
    });
  }

  function run(q) {
    clearTimeout(timer);
    var r = results(q);
    list.innerHTML = "";
    var order = r.others.map(function (o) { var li = row(o); list.appendChild(li); return li; });
    var you = row(r.you, true);
    list.appendChild(you);
    order.push(you);

    if (reduce) { order.unshift(order.pop()); place(order); return; }

    /* start on the ninth line with no transition, then climb */
    order.forEach(function (li) { li.style.transition = "none"; });
    place(order);
    list.offsetHeight;
    order.forEach(function (li) { li.style.transition = ""; });

    var pos = order.length - 1;
    (function climb() {
      if (pos === 0) return;
      timer = setTimeout(function () {
        var above = order[pos - 1];
        order[pos - 1] = you; order[pos] = above; pos--;
        place(order);
        climb();
      }, pos === order.length - 1 ? 650 : 210);
    })();
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); run(input.value); });

  var tries = [].slice.call(document.querySelectorAll(".serp-try button"));
  tries.forEach(function (b) {
    b.addEventListener("click", function () {
      tries.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      input.value = b.getAttribute("data-q");
      run(input.value);
    });
  });

  /* the first run waits until the panel is actually on screen */
  var started = false;
  function start() { if (!started) { started = true; run(input.value); } }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { start(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(list);
  } else start();

  addEventListener("resize", function () {
    var order = [].slice.call(list.children).sort(function (a, b) {
      return parseInt(a.querySelector(".rk").textContent, 10) - parseInt(b.querySelector(".rk").textContent, 10);
    });
    if (order.length) place(order);
  });
})();

/* the reflection ripples harder while the mouse moves across it,
   then settles back to its usual gentle wobble */
(function () {
  "use strict";
  var water = document.querySelector(".wet-reflect"), map = document.getElementById("ripple-map");
  if (!water || !map || !window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var REST = 16, MAXED = 60, level = REST, stir = 0, lastX = null, lastY = null, running = false;
  function frame() {
    level += (REST + stir - level) * 0.2;
    stir *= 0.97;
    map.setAttribute("scale", level.toFixed(1));
    running = stir > 0.2 || Math.abs(level - REST) > 0.2;
    if (running) requestAnimationFrame(frame); else map.setAttribute("scale", REST);
  }
  water.addEventListener("pointermove", function (e) {
    if (lastX !== null) stir = Math.min(MAXED - REST, stir + Math.hypot(e.clientX - lastX, e.clientY - lastY) * 1.6);
    lastX = e.clientX; lastY = e.clientY;
    if (!running) { running = true; requestAnimationFrame(frame); }
  });
  water.addEventListener("pointerleave", function () { lastX = lastY = null; });
})();
