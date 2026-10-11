/* Seafog: the toolbar date. "Today is Friday, 9 October 2026",
   in the visitor's own date, the way every site did it in 2003. */
(function () {
  "use strict";
  var el = document.getElementById("today");
  if (!el) return;
  try {
    el.textContent = "Today is " + new Date().toLocaleDateString("en-NZ",
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

/* Seafog: current weather beside each city in the "Where I work" box.
   One request to Open-Meteo (free, no key, no cookies) for all four cities,
   cached for 30 minutes per browser session. Hidden if it can't be reached. */
(function () {
  "use strict";
  var CITIES = [
    { href: "web-design-wellington.html",   lat: -41.2865, lon: 174.7762 },
    { href: "web-design-christchurch.html", lat: -43.5321, lon: 172.6362 },
    { href: "web-design-auckland.html",     lat: -36.8485, lon: 174.7633 },
    { href: "web-design-queenstown.html",   lat: -45.0312, lon: 168.6626 }
  ];
  var links = CITIES.map(function (c) {
    return document.querySelector('.side .box-links a[href="' + c.href + '"]');
  });
  if (!links[0] || !window.fetch) return;

  /* small 2004-style icons: flat fills, dark outlines */
  var S = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">';
  var SUN = '<circle cx="8" cy="8" r="3.4" fill="#ffc21a" stroke="#d98a00"/>' +
    '<g stroke="#f0a000" stroke-width="1.4" stroke-linecap="round"><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13"/></g>';
  var MOON = '<path d="M10.5 2.5a5.5 5.5 0 1 0 3 9.6A6 6 0 0 1 10.5 2.5z" fill="#f5e27a" stroke="#b8a032"/>';
  var CLOUD = function (x, y, fill) {
    return '<path transform="translate(' + x + ' ' + y + ')" d="M4 12h7.5a2.5 2.5 0 0 0 .3-5A3.5 3.5 0 0 0 5 6.2 2.9 2.9 0 0 0 4 12z" fill="' +
      fill + '" stroke="#7d8a99"/>';
  };
  var ICONS = {
    clear: function (day) { return day ? SUN : MOON; },
    partly: function (day) { return '<g transform="translate(-2 -3) scale(.8)">' + (day ? SUN : MOON) + '</g>' + CLOUD(1, 1, "#f4f6f8"); },
    cloudy: function () { return CLOUD(0, -1, "#dfe4ea"); },
    fog: function () { return '<g stroke="#8b97a5" stroke-width="1.6" stroke-linecap="round"><path d="M2 5h12M3 8h10M2 11h12"/></g>'; },
    rain: function () { return CLOUD(0, -3, "#d3dbe4") + '<g stroke="#2f7fd6" stroke-width="1.4" stroke-linecap="round"><path d="M5 12l-1 2.5M8.5 12l-1 2.5M12 12l-1 2.5"/></g>'; },
    snow: function () { return CLOUD(0, -3, "#e8edf2") + '<g fill="#5aa9e6"><circle cx="4.5" cy="13" r="1"/><circle cx="8" cy="14" r="1"/><circle cx="11.5" cy="13" r="1"/></g>'; },
    storm: function () { return CLOUD(0, -3, "#b9c2cc") + '<path d="M8.5 10.5L6 14h2.2L7 16l3.5-4H8.3l1-1.5z" fill="#ffc21a" stroke="#c98a00" stroke-width=".6"/>'; }
  };
  var WORDS = { clear: "clear", partly: "partly cloudy", cloudy: "cloudy", fog: "fog", rain: "rain", snow: "snow", storm: "thunderstorms" };
  function kind(code) {
    if (code === 0) return "clear";
    if (code <= 2) return "partly";
    if (code === 3) return "cloudy";
    if (code === 45 || code === 48) return "fog";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if (code >= 95) return "storm";
    return "rain";
  }

  function show(data) {
    data.forEach(function (d, i) {
      var a = links[i];
      if (!a || !d) return;
      var k = kind(d.code), t = Math.round(d.temp);
      var el = document.createElement("span");
      el.className = "wx";
      el.title = "Now in " + a.textContent.trim() + ": " + t + "°C, " + WORDS[k];
      el.innerHTML = S + ICONS[k](d.day) + "</svg>" + t + "°";
      el.setAttribute("aria-label", t + " degrees, " + WORDS[k]);
      a.appendChild(el);
    });
  }

  var KEY = "seafog-wx", cached = null;
  try { cached = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) {}
  if (cached && Date.now() - cached.at < 30 * 60 * 1000) { show(cached.data); return; }

  var url = "https://api.open-meteo.com/v1/forecast?latitude=" +
    CITIES.map(function (c) { return c.lat; }).join(",") + "&longitude=" +
    CITIES.map(function (c) { return c.lon; }).join(",") +
    "&current=temperature_2m,weather_code,is_day&timezone=Pacific%2FAuckland";
  fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (json) {
      var list = Array.isArray(json) ? json : [json];
      var data = list.map(function (x) {
        return x && x.current ? { temp: x.current.temperature_2m, code: x.current.weather_code, day: x.current.is_day === 1 } : null;
      });
      try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data: data })); } catch (e) {}
      show(data);
    })
    .catch(function () {});
})();
