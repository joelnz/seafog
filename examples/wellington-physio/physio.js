/* Brougham Physio (concept): shared script for every page */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var still = !window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* menu: phones get a toggle, the Treatments submenu opens on tap too */
  var menu = document.querySelector(".menu"), mb = document.querySelector(".menu-btn");
  if (mb) mb.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    mb.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll(".sub-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var li = b.parentNode, open = li.classList.toggle("open");
      b.setAttribute("aria-expanded", open);
    });
  });
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".has-sub.open").forEach(function (li) {
      if (!li.contains(e.target)) { li.classList.remove("open"); li.querySelector(".sub-btn").setAttribute("aria-expanded", "false"); }
    });
  });

  /* opening hours: mark today, in Wellington time */
  var hours = document.querySelector(".hours");
  if (hours) {
    var wd = new Intl.DateTimeFormat("en-NZ", { timeZone: "Pacific/Auckland", weekday: "short" }).format(new Date());
    var idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
    var row = hours.querySelector('[data-days~="' + idx + '"]');
    if (row) row.classList.add("today");
  }

  /* the goniometer: the moving arm sweeps from the first-visit angle to week eight */
  var g = $("gonio");
  if (g) {
    var NS = "http://www.w3.org/2000/svg", CX = 200, CY = 200, R = 170, FROM = 70, TO = 160;
    function pt(deg, r) { var a = (180 - deg) * Math.PI / 180; return [CX + r * Math.cos(a), CY - r * Math.sin(a)]; }
    function el(name, attrs) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); g.appendChild(e); return e; }
    el("path", { class: "rim", d: "M" + (CX - R) + " " + CY + "A" + R + " " + R + " 0 0 1 " + (CX + R) + " " + CY + "Z" });
    for (var d = 0; d <= 180; d += 5) {
      var big = d % 30 === 0, mid = d % 10 === 0, a = pt(d, R), b = pt(d, R - (big ? 18 : mid ? 11 : 6));
      el("line", { class: "tick" + (big ? " big" : ""), x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
      if (big && d % 180) { var t = pt(d, R - 34); el("text", { class: "num", x: t[0], y: t[1] + 5, "text-anchor": "middle" }).textContent = d + "°"; }
    }
    var arc = el("path", { class: "arc" });
    var gh = pt(FROM, R - 6);
    el("line", { class: "ghost", x1: CX, y1: CY, x2: gh[0], y2: gh[1] });
    var gl = pt(FROM, R + 18);
    el("text", { class: "ghost-l", x: gl[0] - 6, y: gl[1], "text-anchor": "end" }).textContent = "First visit";
    el("line", { class: "arm", x1: CX, y1: CY, x2: CX - R + 6, y2: CY });
    var arm = el("line", { class: "arm move", x1: CX, y1: CY });
    el("circle", { class: "pin", cx: CX, cy: CY, r: 9 });
    var read = el("text", { class: "read", x: CX, y: CY + 66, "text-anchor": "middle" });
    function set(deg) {
      var e = pt(deg, R - 6), s = pt(0, R - 46), m = pt(deg, R - 46);
      arm.setAttribute("x2", e[0]); arm.setAttribute("y2", e[1]);
      arc.setAttribute("d", "M" + CX + " " + CY + "L" + s[0] + " " + s[1] + "A" + (R - 46) + " " + (R - 46) + " 0 0 1 " + m[0] + " " + m[1] + "Z");
      read.textContent = Math.round(deg) + "°";
    }
    if (still) set(TO);
    else {
      set(FROM);
      setTimeout(function () {
        var t0 = performance.now(), dur = 2200;
        (function step(t) {
          var p = Math.min(1, (t - t0) / dur), ease = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          set(FROM + (TO - FROM) * ease);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      }, 500);
    }
  }

  /* ACC check: two questions, one plain answer */
  var chk = $("acc-check");
  if (chk) {
    var ANS = {
      yes: ["ACC should cover it", "We lodge the claim at your first visit, no GP needed. You pay $40 for the first visit and $30 after that."],
      overseas: ["ACC won't cover it", "Injuries from overseas aren't covered. Private rates apply: $110 for the first visit and $85 after that. Health insurance often pays part."],
      slow: ["Probably private", "Pain that builds slowly without a specific moment usually isn't an ACC injury. Private rates apply: $110 for the first visit. We'll check at the appointment in case it is."],
      unsure: ["Book and we'll work it out", "Tell us what happened at your first visit. If it's an accident, we lodge the claim then and there and you pay the ACC rate."]
    };
    chk.addEventListener("change", function () {
      var how = (chk.querySelector('[name="how"]:checked') || {}).value, where = (chk.querySelector('[name="where"]:checked') || {}).value;
      if (!how || !where) return;
      var k = where === "away" ? "overseas" : how === "moment" ? "yes" : how === "slow" ? "slow" : "unsure";
      $("acc-a-h").textContent = ANS[k][0]; $("acc-a-p").textContent = ANS[k][1];
      $("acc-answer").hidden = false;
    });
  }

  /* booking: a week of free times, worked out from today */
  var days = $("days");
  if (days) {
    var PEOPLE = { any: "First available", mere: "Mere Tapsell", sam: "Sam Whitlock", ana: "Ana Ferreira", tom: "Tom Hollis" };
    var who = Object.keys(PEOPLE).slice(1);
    var form = $("book-form"), chosen = null;
    var pre = new URLSearchParams(location.search).get("for");
    if (pre && form.elements.what.querySelector('option[value="' + pre + '"]')) form.elements.what.value = pre;
    function fmt(d) { return d.toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short" }); }
    function draw() {
      var pick = form.elements.who.value, d = new Date(), out = "", n = 0;
      d.setHours(0, 0, 0, 0);
      while (n < 5) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() === 0) continue;
        var times = d.getDay() === 6 ? ["8:30am", "10:00am", "11:15am"] : ["7:15am", "9:30am", "12:45pm", "4:30pm", "6:15pm"];
        var seed = d.getDate() * 7 + d.getMonth() * 3;
        var cells = times.map(function (t, k) {
          var p = pick === "any" ? who[(seed + k) % who.length] : pick;
          if ((seed + k * 5 + who.indexOf(p)) % 3 === 0) return "";
          return '<button type="button" class="slot" aria-pressed="false" data-d="' + d.toISOString() + '" data-t="' + t + '" data-p="' + p + '">' + t + "<small>" + PEOPLE[p].split(" ")[0] + "</small></button>";
        }).join("");
        out += '<div class="day"><h4>' + d.toLocaleDateString("en-NZ", { weekday: "long" }) + "<span>" + d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" }) + "</span></h4>" + (cells || '<p class="muted" style="font-size:14px">Fully booked</p>') + "</div>";
        n++;
      }
      days.innerHTML = out; chosen = null; sum();
    }
    function sum() {
      var acc = form.elements.acc.value === "yes";
      $("s-what").textContent = form.elements.what.options[form.elements.what.selectedIndex].text;
      $("s-when").textContent = chosen ? fmt(new Date(chosen.d)) + ", " + chosen.t : "Pick a time";
      $("s-who").textContent = chosen ? PEOPLE[chosen.p] : PEOPLE[form.elements.who.value];
      $("s-cost").textContent = acc ? "$40 (ACC)" : "$110";
      $("confirm").disabled = !chosen;
      $("done").hidden = true;
    }
    days.addEventListener("click", function (e) {
      var b = e.target.closest(".slot"); if (!b) return;
      days.querySelectorAll(".slot").forEach(function (s) { s.setAttribute("aria-pressed", s === b); });
      chosen = { d: b.dataset.d, t: b.dataset.t, p: b.dataset.p }; sum();
    });
    form.addEventListener("change", function (e) { if (e.target.name === "who") draw(); else sum(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); if (chosen) $("done").hidden = false; });
    draw();
  }
})();
