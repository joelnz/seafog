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

  /* next free appointment on the home page: the next working morning */
  var nf = $("next-free");
  if (nf) {
    var d = new Date(); d.setDate(d.getDate() + 1);
    var label = "Tomorrow";
    if (d.getDay() === 0) { d.setDate(d.getDate() + 1); label = "Monday"; }
    nf.textContent = label + ", " + (d.getDay() === 6 ? "8:30am" : "7:15am");
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
