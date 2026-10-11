/* Seafog — banner image test drop. Dev only: loaded by the shared ?tune=1
   loader alongside the glass tuner, so nothing here reaches a visitor.

   Drag a photo onto a page's banner (or click "Choose file") to preview it
   there instantly. It's a local object URL swapped into the existing <img>,
   so the crop, the parallax drift and the glass toggle all keep working on
   whatever you drop in — nothing is uploaded, nothing is saved, and it's
   gone the moment you reload. */
(function () {
  "use strict";

  var top = document.querySelector(".top");
  var banner = top && top.querySelector(".banner");
  if (!top || !banner) return;

  var originalSrc = banner.getAttribute("src");
  var originalSrcset = banner.getAttribute("srcset");
  var objectUrl = null;

  var panel = document.createElement("div");
  panel.id = "bannerDrop";
  panel.innerHTML =
    "<style>" +
    "#bannerDrop{position:absolute;right:14px;bottom:14px;z-index:6;max-width:min(78%,320px);" +
    "display:flex;align-items:center;gap:8px;padding:8px 8px 8px 14px;border-radius:100px;" +
    "background:rgba(18,15,24,.72);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);" +
    "color:#fff;font:12px/1.3 ui-sans-serif,system-ui,sans-serif}" +
    "#bannerDrop span{opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#bannerDrop button{flex:none;font:inherit;font-weight:600;color:#1d1b24;" +
    "background:#fff;border:0;border-radius:100px;padding:6px 12px;cursor:pointer}" +
    "#bannerDrop button.reset{display:none;background:rgba(255,255,255,.18);color:#fff}" +
    ".top.drop-active{outline:2px dashed rgba(255,255,255,.85);outline-offset:-8px}" +
    "@media(max-width:600px){#bannerDrop{left:14px;right:14px;max-width:none}}" +
    "</style>" +
    '<span id="bannerDropLabel">Drop an image to test it here</span>' +
    '<button type="button" id="bannerDropPick">Choose file</button>' +
    '<button type="button" id="bannerDropReset" class="reset">Reset</button>' +
    '<input type="file" accept="image/*" id="bannerDropInput" style="display:none">';
  top.appendChild(panel);

  var label = panel.querySelector("#bannerDropLabel");
  var resetBtn = panel.querySelector("#bannerDropReset");
  var input = panel.querySelector("#bannerDropInput");

  function setBanner(file) {
    if (!file || file.type.indexOf("image/") !== 0) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    banner.removeAttribute("srcset");
    banner.src = objectUrl;
    label.textContent = file.name;
    resetBtn.style.display = "inline-block";
  }

  function reset() {
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    banner.src = originalSrc;
    if (originalSrcset) banner.setAttribute("srcset", originalSrcset);
    else banner.removeAttribute("srcset");
    label.textContent = "Drop an image to test it here";
    resetBtn.style.display = "none";
  }

  panel.querySelector("#bannerDropPick").addEventListener("click", function () { input.click(); });
  input.addEventListener("change", function () { setBanner(input.files[0]); });
  resetBtn.addEventListener("click", reset);

  ["dragenter", "dragover"].forEach(function (evt) {
    top.addEventListener(evt, function (e) {
      e.preventDefault();
      top.classList.add("drop-active");
    });
  });
  ["dragleave", "dragend"].forEach(function (evt) {
    top.addEventListener(evt, function () { top.classList.remove("drop-active"); });
  });
  top.addEventListener("drop", function (e) {
    e.preventDefault();
    top.classList.remove("drop-active");
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    setBanner(file);
  });
})();
