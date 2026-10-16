/* Brougham Physio (concept): the home page skeleton. A real anatomical model
   (BodyParts3D) in navy haze, framed on the ribs and held still; a pulse of tape
   pink runs down the spine, lighting each disc
   as it passes. Depth of field keeps the nearest bones sharp and lets the far side
   soften. Leans toward the mouse; scrolling turns it part way round. A single
   still frame for reduced motion; the hero works without it if loading fails. */
import * as THREE from "./vendor/three.module.min.js";
import { GLTFLoader, MeshoptDecoder } from "./vendor/gltf.min.js";
/* three's post-processing, bundled; the bokeh shader is patched to keep alpha so the CSS backdrop shows */
import { EffectComposer, RenderPass, BokehPass, OutputPass } from "./vendor/post.min.js";

const hero = document.querySelector(".hero3d");
const canvas = document.getElementById("spine");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const NAVY = 0x1d2238, TAPE = 0xe5457b;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(NAVY, 0.019);
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);

/* the composer draws off screen, which loses the browser's edge smoothing; a multisampled
   target puts it back so edges don't crawl as the camera moves */
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 11, aperture: 0.0035, maxblur: 0.006 });
composer.addPass(bokeh);
composer.addPass(new OutputPass());

scene.add(new THREE.HemisphereLight(0x9aa6ff, 0x141829, 0.55));
/* the lights travel with the camera, so the look holds from every angle:
   warm key from the front right, tape pink behind on the left, blue behind on the right */
const aim = new THREE.Object3D();
scene.add(aim);
function light(color, intensity, side, up, back) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.target = aim;
  l.rig = [side, up, back];
  scene.add(l);
  return l;
}
const lights = [
  light(0xfff4ea, 2.3, 0.7, 0.9, -1),
  light(TAPE, 1.15, -1, 0.25, 1),
  light(0x7d8cff, 1.6, 1, 0.3, 0.9)
];
const pulseLight = new THREE.PointLight(TAPE, 0, 4, 1.6);
scene.add(pulseLight);

/* bone with a soft fresnel edge, so it glows against the dark the way it would in an X-ray */
function withRim(mat, color, strength) {
  mat.onBeforeCompile = (s) => {
    s.uniforms.uRim = { value: new THREE.Color(color).multiplyScalar(strength) };
    s.fragmentShader = "uniform vec3 uRim;\n" + s.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n  totalEmissiveRadiance += uRim * pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6);"
    );
  };
  return mat;
}
const bone = withRim(new THREE.MeshStandardMaterial({ color: 0xe9e2d3, roughness: 0.62 }), 0x8f9bff, 0.55);
const cartilage = withRim(new THREE.MeshStandardMaterial({ color: 0xcfc2d6, roughness: 0.5 }), 0x8f9bff, 0.4);

/* a soft round texture for the dust */
function glowTexture(stops) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([at, col]) => grad.addColorStop(at, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* dust drifting up through the light */
const DUST = 900;
const dustPos = new Float32Array(DUST * 3), dustSpeed = new Float32Array(DUST);
for (let i = 0; i < DUST; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * 14;
  dustPos[i * 3 + 1] = Math.random() * 20 - 1;
  dustPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
  dustSpeed[i] = 0.15 + Math.random() * 0.35;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  size: 0.07, map: glowTexture([[0, "rgba(255,255,255,1)"], [1, "rgba(255,255,255,0)"]]), color: 0xd9ddff,
  transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending
}));
scene.add(dust);

/* camera rig: from the whole body, front three-quarter, round to the lower back */
const rig = { target: new THREE.Vector3(), dist: 1, az: 0, el: 0 };
let ribs = new THREE.Vector3();
let spinScroll = 0;
const vertebrae = [], discs = [];

function size() {
  const w = hero.clientWidth, h = hero.clientHeight;
  renderer.setSize(w, h, false);
  /* the blur hides fine detail, so the post-processed frame can run a little under full Retina */
  composer.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
  composer.setSize(w, h);
  camera.aspect = w / h;
  /* on wide screens the skeleton stands to the right of the words */
  if (w > 900) camera.setViewOffset(w, h, -w * 0.25, 0, w, h);
  /* on phones the words sit low, so the skeleton rides higher */
  else camera.setViewOffset(w, h, 0, h * 0.16, w, h);
  camera.updateProjectionMatrix();
}
new ResizeObserver(size).observe(hero);
size();

let mx = 0, my = 0, tx = 0, ty = 0;
hero.addEventListener("pointermove", (e) => {
  const r = hero.getBoundingClientRect();
  tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
  ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
});
hero.addEventListener("pointerleave", () => { tx = ty = 0; });

let visible = true;
new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(hero);

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const pink = new THREE.Color(TAPE), dark = new THREE.Color(0x000000);
const tmp = new THREE.Vector3();
let start = 0;

function frame(now) {
  if (!start) start = now;
  const t = still ? 60 : (now - start) / 1000;

  if (visible) {
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    const fit = Math.sqrt(Math.max(1, 0.9 / camera.aspect));
    const scroll = clamp01(window.scrollY / hero.clientHeight);
    /* scrolling through the hero turns the skeleton about a quarter, eased so it glides */
    spinScroll += (clamp01(window.scrollY / (hero.clientHeight * 0.75)) - spinScroll) * 0.08;

    /* it holds still on the ribs: only the cursor leans it, and scrolling turns it */
    rig.target.copy(ribs);
    rig.target.y -= scroll * 0.6;
    rig.dist = 11 * fit * (1 - scroll * 0.15);
    rig.az = 0.45 + spinScroll * Math.PI * 0.55 + mx * 0.18;
    rig.el = 0.1 + my * 0.04;

    camera.position.set(
      rig.target.x + Math.sin(rig.az) * Math.cos(rig.el) * rig.dist,
      rig.target.y + Math.sin(rig.el) * rig.dist,
      rig.target.z + Math.cos(rig.az) * Math.cos(rig.el) * rig.dist
    );
    camera.lookAt(rig.target);
    aim.position.copy(rig.target);
    const fwd = tmp.subVectors(rig.target, camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    lights.forEach((l) => {
      const [sd, up, back] = l.rig;
      l.position.copy(rig.target).addScaledVector(right, sd * 10).addScaledVector(camera.up, up * 10).addScaledVector(fwd, back * 10);
    });

    /* the pulse: every few seconds, neck to tailbone */
    const period = 4.2, n = vertebrae.length;
    const phase = still ? 0.82 : (t % period) / period;
    const at = phase * (n + 6) - 2;
    let lx = 0, ly = 0, lz = 0, lw = 0;
    vertebrae.forEach((v, i) => {
      const g = Math.exp(-((i - at) ** 2) / 2.2);
      v.material.emissive.lerpColors(dark, pink, g * 0.3);
      lx += v.center.x * g; ly += v.center.y * g; lz += v.center.z * g; lw += g;
    });
    discs.forEach((dk) => {
      const g = Math.exp(-((dk.level + 0.5 - at) ** 2) / 1.6);
      dk.material.emissiveIntensity = 0.55 + g * 3.2;
    });
    if (lw > 0.05) {
      pulseLight.position.set(lx / lw, ly / lw, lz / lw - 0.7);
      pulseLight.intensity = Math.min(1, lw) * 9;
    } else pulseLight.intensity = 0;

    /* dust rises slowly and wraps */
    if (!still) {
      for (let i = 0; i < DUST; i++) {
        let y = dustPos[i * 3 + 1] + dustSpeed[i] * 0.006;
        if (y > 19) y = -1;
        dustPos[i * 3 + 1] = y;
        dustPos[i * 3] += Math.sin(t * 0.3 + i) * 0.0009;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    /* focus sits just in front of the spine, on the bones nearest the camera */
    bokeh.uniforms.focus.value = rig.dist - 0.8;
    composer.render();
  }
  if (!still) requestAnimationFrame(frame);
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.load("model/skeleton.glb", (gltf) => {
  const box = new THREE.Box3();
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.computeVertexNormals();
    const name = o.name || o.parent.name;
    if (/^V\d\d$/.test(name)) {
      o.material = bone.clone();
      o.material.onBeforeCompile = bone.onBeforeCompile;
      /* positions are quantized, so measure in world space */
      o.center = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
      vertebrae[+name.slice(1)] = o;
    } else if (/^D\d\d$/.test(name)) {
      o.material = new THREE.MeshStandardMaterial({ color: TAPE, emissive: TAPE, emissiveIntensity: 0.55, roughness: 0.35 });
      o.level = +name.slice(1);
      discs.push(o);
    } else if (name === "CART") o.material = cartilage;
    else o.material = bone;
    box.expandByObject(o);
  });
  scene.add(gltf.scene);

  /* framing: the lower ribs (T8 to L2), close enough that the head stays out of shot */
  ribs = new THREE.Vector3();
  for (let i = 14; i < 21; i++) ribs.add(vertebrae[i].center);
  ribs.divideScalar(7).add(tmp.set(0, 0, 0.6));

  hero.classList.add("has-3d");
  requestAnimationFrame(frame);
  if (still) new ResizeObserver(() => requestAnimationFrame(frame)).observe(hero);
}, undefined, () => canvas.remove());
