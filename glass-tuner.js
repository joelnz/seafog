/* Seafog — liquid glass tuner. Dev only: loaded by index.html when the URL
   carries ?tune=1, so nothing of this reaches a visitor.

   Every control writes either a CSS custom property on :root or an attribute on
   the SVG filter, live. "Copy CSS" gives back exactly the block to paste into
   style.css, so whatever you land on is what ships. */
(function () {
  "use strict";

  var root = document.documentElement;
  var lens = window.SeafogLens;
  if (!lens) return;

  // the lens half of the panel edits SeafogLens.cfg and rebuilds the filter
  // at the pill's measured size; the rest are plain custom properties
  var S = {
    strength: lens.cfg.strength,
    depth: lens.cfg.depth,
    bevel: lens.cfg.edge,
    aberration: lens.cfg.aberration,
    edgeBlur: lens.cfg.softness,
    glassBlur: 1,
    glassSat: 1.45,
    glassBright: 1.03,
    tintDark: 0,       // 0 = clear glass, 100 = smoked
    tintAlpha: 0.07,
    edge: 0.62,
    edgeSide: 0.22,
    shadow: 0.7,
    textWhite: 100,    // 100 = white, 0 = ink
    halo: 0.65
  };

  function mix(a, b, t) { return Math.round(a + (b - a) * t); }

  // ---- colour-theory hero: one base hue, turned into a real scheme -------
  var CH = {
    on: false,
    scheme: "split",   // complementary | split | analogous | triadic
    hue: 320,          // matches the brand plum's own hue
    sat: 30,
    light: 42,
    shape: 30          // circle size, vw
  };

  // glass.js already read this same key on page load and set the html class
  // to match, before this script ever runs — restoring the rest of CH here
  // just brings the sliders' starting positions into line with it.
  try {
    var savedCh = JSON.parse(localStorage.getItem("seafog-color-hero"));
    if (savedCh) { for (var k in CH) if (k in savedCh) CH[k] = savedCh[k]; }
  } catch (e) {}

  function hsl(h, s, l) {
    h = ((h % 360) + 360) % 360;
    return "hsl(" + h.toFixed(0) + "," + s + "%," + l + "%)";
  }

  function applyColorHero() {
    document.documentElement.classList.toggle("color-hero", CH.on);
    var h = CH.hue, s = CH.sat, l = CH.light, b, c;
    if (CH.scheme === "complementary") {
      b = hsl(h + 180, s, l);
      c = hsl(h + 180, Math.min(s + 15, 90), Math.min(l + 18, 88));
    } else if (CH.scheme === "analogous") {
      b = hsl(h + 30, s, l);
      c = hsl(h - 30, Math.min(s + 10, 90), Math.min(l + 15, 88));
    } else if (CH.scheme === "triadic") {
      b = hsl(h + 120, s, l);
      c = hsl(h + 240, s, l);
    } else { // split-complementary, the default
      b = hsl(h + 150, s, l);
      c = hsl(h + 210, Math.min(s + 10, 90), Math.min(l + 15, 88));
    }
    root.style.setProperty("--ch-a", hsl(h, s, l));
    root.style.setProperty("--ch-b", b);
    root.style.setProperty("--ch-c", c);
    root.style.setProperty("--ch-ink", l > 55 ? "#1d1b24" : "#fff");
    document.documentElement.style.setProperty(
      "--ch-shape-vw", CH.shape + "vw"
    );
    try {
      localStorage.setItem("seafog-color-hero", JSON.stringify(CH));
    } catch (e) {}
  }

  function apply() {
    // the lens itself
    lens.cfg.strength = S.strength;
    lens.cfg.depth = S.depth;
    lens.cfg.edge = S.bevel;
    lens.cfg.aberration = S.aberration;
    lens.cfg.softness = S.edgeBlur;
    lens.apply();

    // the glass body
    var t = S.tintDark / 100;
    root.style.setProperty("--glass-tint",
      mix(255, 20, t) + "," + mix(255, 16, t) + "," + mix(255, 26, t));
    root.style.setProperty("--glass-tint-a", S.tintAlpha);
    root.style.setProperty("--glass-blur", S.glassBlur + "px");
    root.style.setProperty("--glass-sat", S.glassSat);
    root.style.setProperty("--glass-bright", S.glassBright);
    root.style.setProperty("--glass-edge", S.edge);
    root.style.setProperty("--glass-edge-side", S.edgeSide);
    root.style.setProperty("--glass-shadow", S.shadow);

    // the type
    var w = S.textWhite / 100;
    root.style.setProperty("--nav-ink",
      "rgb(" + mix(29, 255, w) + "," + mix(27, 255, w) + "," + mix(36, 255, w) + ")");
    root.style.setProperty("--nav-halo", S.halo);

    document.getElementById("tuneOut").textContent = css();
  }

  function css() {
    var t = S.tintDark / 100, w = S.textWhite / 100;
    return "/* style.css — :root */\n" +
      "--glass-blur:" + S.glassBlur + "px;\n" +
      "--glass-sat:" + S.glassSat + ";\n" +
      "--glass-bright:" + S.glassBright + ";\n" +
      "--glass-tint:" + mix(255, 20, t) + "," + mix(255, 16, t) + "," + mix(255, 26, t) + ";\n" +
      "--glass-tint-a:" + S.tintAlpha + ";\n" +
      "--glass-edge:" + S.edge + ";\n" +
      "--glass-edge-side:" + S.edgeSide + ";\n" +
      "--glass-shadow:" + S.shadow + ";\n" +
      "--nav-ink:rgb(" + mix(29, 255, w) + "," + mix(27, 255, w) + "," + mix(36, 255, w) + ");\n" +
      "--nav-halo:" + S.halo + ";\n\n" +
      "/* glass.js — SeafogLens.cfg */\n" +
      "strength:" + S.strength + ", depth:" + S.depth + ", edge:" + S.bevel +
      ", aberration:" + S.aberration + ", softness:" + S.edgeBlur + "\n\n" +
      "/* colour hero — " + (CH.on ? "on" : "off") + " */\n" +
      "scheme:" + CH.scheme + ", hue:" + CH.hue + ", sat:" + CH.sat +
      ", light:" + CH.light + ", shape:" + CH.shape + "vw\n" +
      "a:" + getComputedStyle(root).getPropertyValue("--ch-a") +
      "  b:" + getComputedStyle(root).getPropertyValue("--ch-b") +
      "  c:" + getComputedStyle(root).getPropertyValue("--ch-c");
  }

  var FIELDS = [
    ["Lens", [
      ["strength", "Sides: − pulls in, + magnifies", -150, 150, 1],
      ["depth", "Top/bottom: − in, + magnify", -80, 80, 1],
      ["bevel", "Bevel width (px)", 2, 60, 1],
      ["aberration", "Chromatic aberration", 0, 20, 0.5],
      ["edgeBlur", "Edge softness", 0, 3, 0.1]
    ]],
    ["Glass", [
      ["glassBlur", "Frost (blur px)", 0, 20, 0.5],
      ["glassSat", "Saturation", 0.5, 2.5, 0.05],
      ["glassBright", "Brightness", 0.7, 1.4, 0.01],
      ["tintDark", "Tint: clear → smoked", 0, 100, 1],
      ["tintAlpha", "Tint opacity", 0, 0.7, 0.01]
    ]],
    ["Edge", [
      ["edge", "Bevel highlight", 0, 1, 0.02],
      ["edgeSide", "Side highlight", 0, 1, 0.02],
      ["shadow", "Drop shadow", 0, 1, 0.02]
    ]],
    ["Type", [
      ["textWhite", "Colour: ink → white", 0, 100, 1],
      ["halo", "Halo behind the type", 0, 1, 0.02]
    ]]
  ];

  var panel = document.createElement("div");
  panel.id = "tuner";
  panel.innerHTML =
    '<style>' +
    '#tuner{position:fixed;top:12px;left:12px;z-index:999;width:288px;max-height:calc(100vh - 24px);' +
    'overflow:auto;background:rgba(18,15,24,.9);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);' +
    'color:#fff;border-radius:14px;padding:14px 16px 16px;font:12px/1.4 ui-sans-serif,system-ui,sans-serif;' +
    'box-shadow:0 30px 70px -30px rgba(0,0,0,.9)}' +
    '#tuner h4{margin:14px 0 8px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;opacity:.5}' +
    '#tuner h4:first-of-type{margin-top:10px}' +
    '#tuner .r{margin:0 0 9px}' +
    '#tuner .r label{display:flex;justify-content:space-between;gap:8px;margin-bottom:3px;opacity:.85}' +
    '#tuner .r b{font-weight:600;font-variant-numeric:tabular-nums;opacity:.9}' +
    '#tuner input[type=range]{width:100%;accent-color:#c9a6c0;margin:0}' +
    '#tuner .hd{display:flex;justify-content:space-between;align-items:center;gap:8px}' +
    '#tuner .hd strong{font-size:12.5px;letter-spacing:.02em}' +
    '#tuner.min #tuneBody,#tuner.min pre{display:none}' +
    '#tuner button{font:inherit;font-weight:600;color:#1d1b24;background:#fff;border:0;' +
    'border-radius:7px;padding:6px 10px;cursor:pointer}' +
    '#tuner button.g{background:rgba(255,255,255,.16);color:#fff}' +
    '#tuner pre{margin:10px 0 0;padding:9px;background:rgba(0,0,0,.42);border-radius:8px;' +
    'font:10.5px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;max-height:180px;overflow:auto}' +
    '#tuner .apply{display:flex;align-items:center;justify-content:space-between;gap:10px;' +
    'margin:2px 0 12px;padding:10px 11px;background:rgba(255,255,255,.08);border-radius:9px}' +
    '#tuner .apply span{font-size:12px;line-height:1.35}' +
    '#tuner .sw{position:relative;flex:none;width:36px;height:21px;border-radius:11px;' +
    'background:rgba(255,255,255,.25);cursor:pointer;border:0;padding:0}' +
    '#tuner .sw::after{content:"";position:absolute;top:2px;left:2px;width:17px;height:17px;' +
    'border-radius:50%;background:#fff;transition:transform .15s ease}' +
    '#tuner .sw.on{background:#7ee0c4}' +
    '#tuner .sw.on::after{transform:translateX(15px)}' +
    '#tuner select{width:100%;font:inherit;font-size:12.5px;color:#fff;' +
    'background:rgba(255,255,255,.12);border:0;border-radius:6px;padding:7px 8px;margin-top:2px}' +
    '#tuner select option{color:#1d1b24}' +
    '#tuner .swatches{display:flex;gap:6px;margin:8px 0 2px}' +
    '#tuner .swatches span{flex:1;height:22px;border-radius:5px}' +
    '</style>' +
    '<div class="hd"><strong>Liquid glass</strong>' +
    '<span><button class="g" id="tuneMin">–</button> ' +
    '<button class="g" id="tuneReset">Reset</button> ' +
    '<button id="tuneCopy">Copy CSS</button></span></div>' +
    '<div class="apply"><span>Glass banner card<br><span style="opacity:.6">.top .in, every page</span></span>' +
    '<button class="sw" id="tuneBannerToggle" type="button" role="switch" aria-label="Glass banner card"></button></div>' +
    '<div class="apply"><span>Colour hero, no photo<br><span style="opacity:.6">hides .banner, every page</span></span>' +
    '<button class="sw" id="tuneChToggle" type="button" role="switch" aria-label="Colour hero"></button></div>' +
    '<div id="tuneBody"></div>' +
    '<h4>Colour theory</h4>' +
    '<div class="r"><label>Scheme</label>' +
    '<select id="tuneChScheme">' +
    '<option value="split">Split-complementary</option>' +
    '<option value="complementary">Complementary</option>' +
    '<option value="analogous">Analogous</option>' +
    '<option value="triadic">Triadic</option>' +
    '</select></div>' +
    '<div id="tuneChSliders"></div>' +
    '<div class="swatches"><span id="tuneChSwA"></span><span id="tuneChSwB"></span><span id="tuneChSwC"></span></div>' +
    '<pre id="tuneOut"></pre>';
  document.body.appendChild(panel);

  // the toggle decides WHERE the lens shows up (the banner card instead of,
  // or alongside, the nav pill and the fab); it's independent of the sliders
  // below, which just tune how it looks once it's on. Stored so it survives
  // a reload or a click through to another page while comparing.
  var bannerBtn = panel.querySelector("#tuneBannerToggle");
  function setBanner(on) {
    document.documentElement.classList.toggle("glass-banner", on);
    bannerBtn.classList.toggle("on", on);
    try { localStorage.setItem("seafog-glass-banner-2", on ? "1" : "0"); } catch (e) {}
  }
  setBanner(document.documentElement.classList.contains("glass-banner"));
  bannerBtn.addEventListener("click", function () {
    setBanner(!bannerBtn.classList.contains("on"));
  });

  // ---- colour hero controls ----
  var chBtn = panel.querySelector("#tuneChToggle");
  var chScheme = panel.querySelector("#tuneChScheme");
  var chSliders = panel.querySelector("#tuneChSliders");
  var chSwA = panel.querySelector("#tuneChSwA");
  var chSwB = panel.querySelector("#tuneChSwB");
  var chSwC = panel.querySelector("#tuneChSwC");

  var CH_FIELDS = [
    ["hue", "Base hue", 0, 360, 1],
    ["sat", "Saturation", 5, 80, 1],
    ["light", "Lightness", 20, 70, 1],
    ["shape", "Circle size", 14, 46, 1]
  ];
  CH_FIELDS.forEach(function (f) {
    var key = f[0], row = document.createElement("div");
    row.className = "r";
    row.innerHTML = '<label>' + f[1] + '<b></b></label>' +
      '<input type="range" min="' + f[2] + '" max="' + f[3] + '" step="' + f[4] + '">';
    var input = row.querySelector("input"), out = row.querySelector("b");
    input.value = CH[key];
    out.textContent = CH[key];
    input.addEventListener("input", function () {
      CH[key] = parseFloat(input.value);
      out.textContent = input.value;
      refreshColorHero();
    });
    chSliders.appendChild(row);
  });
  chScheme.value = CH.scheme;
  chScheme.addEventListener("change", function () {
    CH.scheme = chScheme.value;
    refreshColorHero();
  });
  chBtn.addEventListener("click", function () {
    CH.on = !CH.on;
    refreshColorHero();
  });

  function refreshColorHero() {
    applyColorHero();
    chBtn.classList.toggle("on", CH.on);
    chSwA.style.background = "var(--ch-a)";
    chSwB.style.background = "var(--ch-b)";
    chSwC.style.background = "var(--ch-c)";
    document.getElementById("tuneOut").textContent = css();
  }
  refreshColorHero();

  var body = panel.querySelector("#tuneBody");
  FIELDS.forEach(function (group) {
    var h = document.createElement("h4");
    h.textContent = group[0];
    body.appendChild(h);
    group[1].forEach(function (f) {
      var key = f[0], row = document.createElement("div");
      row.className = "r";
      row.innerHTML = '<label>' + f[1] + '<b></b></label>' +
        '<input type="range" min="' + f[2] + '" max="' + f[3] + '" step="' + f[4] + '">';
      var input = row.querySelector("input"), out = row.querySelector("b");
      input.value = S[key];
      out.textContent = S[key];
      input.addEventListener("input", function () {
        S[key] = parseFloat(input.value);
        out.textContent = input.value;
        apply();
      });
      body.appendChild(row);
    });
  });

  panel.querySelector("#tuneCopy").addEventListener("click", function (e) {
    navigator.clipboard.writeText(css());
    e.target.textContent = "Copied";
    setTimeout(function () { e.target.textContent = "Copy CSS"; }, 1200);
  });
  panel.querySelector("#tuneReset").addEventListener("click", function () {
    location.reload();
  });
  panel.querySelector("#tuneMin").addEventListener("click", function (e) {
    var min = panel.classList.toggle("min");
    e.target.textContent = min ? "+" : "–";
  });

  apply();
})();
