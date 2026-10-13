/* Brougham Physio (concept): the home page spine. Twenty-four vertebrae on the
   real S-curve (7 neck, 12 upper back, 5 lower back), discs in tape pink. It turns
   slowly and leans toward the mouse. Still for reduced motion; the hero works
   without it if WebGL isn't there. */
import * as THREE from "./vendor/three.module.min.js";

const hero = document.querySelector(".hero3d");
const canvas = document.getElementById("spine");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  canvas.remove();
}

if (renderer) {
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 29);

  scene.add(new THREE.AmbientLight(0xc8ccff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(6, 7, 9);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe5457b, 2.4);
  rim.position.set(-7, -1, -7);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x7d8cff, 0.7);
  fill.position.set(-6, 3, 6);
  scene.add(fill);

  const bone = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.55, metalness: 0.02 });
  const disc = new THREE.MeshStandardMaterial({ color: 0xe5457b, roughness: 0.38, emissive: 0x3a0716 });

  /* the S-curve: forward at the neck, back through the ribs, forward at the lower back */
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 5.6, 0.2),
    new THREE.Vector3(0, 4.3, 0.75),
    new THREE.Vector3(0, 2.9, 0.15),
    new THREE.Vector3(0, 0.9, -0.75),
    new THREE.Vector3(0, -1.2, -0.35),
    new THREE.Vector3(0, -3.2, 0.55),
    new THREE.Vector3(0, -5.2, 0.05)
  ]);

  const levels = [];
  for (let i = 0; i < 24; i++) {
    const neck = i < 7, low = i >= 19;
    const k = neck ? i / 6 : low ? (i - 19) / 4 : (i - 7) / 11;
    const r = neck ? 0.27 + k * 0.04 : low ? 0.5 + k * 0.08 : 0.33 + k * 0.14;
    const h = neck ? 0.2 : low ? 0.36 + k * 0.02 : 0.25 + k * 0.08;
    levels.push({ r, h, neck, low, gap: neck ? 0.09 : low ? 0.15 : 0.11 });
  }
  const total = levels.reduce((s, l) => s + l.h + l.gap, 0);

  const spine = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);
  let run = 0;
  levels.forEach((l, i) => {
    const t = (run + l.h / 2) / total;
    run += l.h + l.gap;
    const v = new THREE.Group();

    const body = new THREE.Mesh(new THREE.CylinderGeometry(l.r, l.r * 1.04, l.h, 32), bone);
    body.scale.z = 0.82;
    v.add(body);

    if (i < levels.length - 1) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(l.r * 0.94, l.r * 0.98, l.gap * 0.95, 32), disc);
      d.scale.z = 0.8;
      d.position.y = -(l.h / 2 + l.gap / 2);
      v.add(d);
    }

    /* the arch around the spinal canal */
    const arch = new THREE.Mesh(new THREE.TorusGeometry(l.r * 0.42, l.r * 0.12, 10, 24, Math.PI), bone);
    arch.rotation.x = Math.PI / 2;
    arch.rotation.z = Math.PI;
    arch.position.z = -l.r * 0.82;
    v.add(arch);

    /* the bony point you can feel down your back */
    const spLen = l.neck ? l.r * 0.9 : l.low ? l.r * 1.0 : l.r * 1.5;
    const sp = new THREE.Mesh(new THREE.BoxGeometry(l.r * 0.2, l.h * 0.62, spLen), bone);
    sp.position.set(0, l.low ? 0 : -l.h * 0.35, -l.r * 1.25 - spLen / 2);
    sp.rotation.x = l.low ? -0.05 : l.neck ? 0.15 : 0.55;
    v.add(sp);

    /* the wings out to each side */
    for (const side of [-1, 1]) {
      const tp = new THREE.Mesh(new THREE.CylinderGeometry(l.r * 0.09, l.r * 0.13, l.r * (l.low ? 1.25 : 1.05), 12), bone);
      tp.rotation.z = Math.PI / 2 - side * (l.neck ? 0.05 : 0.25);
      tp.position.set(side * l.r * 0.95, 0.02, -l.r * 0.85);
      v.add(tp);
    }

    v.position.copy(curve.getPointAt(t));
    v.quaternion.setFromUnitVectors(up, curve.getTangentAt(t).normalize());
    spine.add(v);
  });

  const pivot = new THREE.Group();
  pivot.add(spine);
  scene.add(pivot);

  let wide = true;
  function size() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = w > 900;
    /* on wide screens the spine stands to the right of the words */
    pivot.position.x = wide ? Math.min(6.2, 2.6 + (camera.aspect - 1) * 3.2) : 0;
    const fit = wide ? 1.12 : 0.95;
    pivot.scale.setScalar(fit);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(hero);
  size();

  let mx = 0, my = 0, tx = 0, ty = 0, spin = 0.6;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  hero.addEventListener("pointerleave", () => { tx = ty = 0; });

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(hero);

  function frame() {
    if (visible) {
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      if (!still) spin += 0.0035;
      pivot.rotation.y = spin + mx * 0.45;
      pivot.rotation.x = 0.08 + my * 0.12;
      pivot.rotation.z = -0.06;
      renderer.render(scene, camera);
    }
    if (!still) requestAnimationFrame(frame);
  }
  frame();
  if (still) new ResizeObserver(() => renderer.render(scene, camera)).observe(hero);
  hero.classList.add("has-3d");
}
