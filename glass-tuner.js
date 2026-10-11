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
      ", aberration:" + S.aberration + ", softness:" + S.edgeBlur;
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
    '</style>' +
    '<div class="hd"><strong>Liquid glass</strong>' +
    '<span><button class="g" id="tuneMin">–</button> ' +
    '<button class="g" id="tuneReset">Reset</button> ' +
    '<button id="tuneCopy">Copy CSS</button></span></div>' +
    '<div class="apply"><span>Glass banner card<br><span style="opacity:.6">.top .in, every page</span></span>' +
    '<button class="sw" id="tuneBannerToggle" type="button" role="switch" aria-label="Glass banner card"></button></div>' +
    '<div id="tuneBody"></div><pre id="tuneOut"></pre>';
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
