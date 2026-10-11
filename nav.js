/* Seafog: the toolbar greeting. "Yes, it looks like 2004 on purpose. Today is Friday, 9 October 2026",
   in the visitor's own date, the way every site did it in 2003. */
(function () {
  "use strict";
  var el = document.getElementById("today");
  if (!el) return;
  try {
    el.textContent = "Yes, it looks like 2004 on purpose. Today is " + new Date().toLocaleDateString("en-NZ",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch (e) {}
})();

/* Seafog: the hit counter. One real running total, bumped once per browser
   session; no cookie. Hidden if the counting service can't be reached. */
(function () {
  "use strict";
  var el = document.getElementById("odo");
  if (!el || !window.fetch) return;
  var base = "https://abacus.jasoncameron.dev/", key = "seafog-nz/visits";
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var seen = false;
  try { seen = sessionStorage.getItem("seafog-counted") === "1"; } catch (e) {}
  var bump = !local && !seen;
  fetch(base + (bump ? "hit/" : "get/") + key)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var n = typeof d.value === "number" ? d.value : (d.error === "Key not found" ? 0 : null);
      if (n === null) return;
      if (bump) { try { sessionStorage.setItem("seafog-counted", "1"); } catch (e) {} }
      var s = String(n);
      while (s.length < 6) s = "0" + s;
      el.textContent = s;
      el.parentNode.hidden = false;
    })
    .catch(function () {});
})();
