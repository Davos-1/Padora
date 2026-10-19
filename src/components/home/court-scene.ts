import type * as ThreeNs from "three";
import { HOME_VIEW, ZONE_IDS, ZONES, type ZoneId, type ZoneSelection } from "./court-zones";

type Three = typeof ThreeNs;
type Vec3 = readonly [number, number, number];

export type CourtController = {
  setActive: (zone: ZoneSelection) => void;
  dispose: () => void;
};

/**
 * Builds the 10 × 20 m padel court with three.js, wires drag-to-orbit and the
 * camera fly-to, and keeps the HTML hotspots projected onto the canvas.
 * Scene colours are 3D material values, not UI colours.
 */
export function createCourt(
  THREE: Three,
  host: HTMLElement,
  overlay: HTMLElement,
  hotspots: Record<ZoneId, HTMLElement | null>,
  initial: ZoneSelection,
): CourtController {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const el = renderer.domElement;
  el.style.cssText = "display:block;width:100%;height:100%";
  host.appendChild(el);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0xf4f7f2, 0x7c8a86, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(9, 18, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 });
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 4;
  scene.add(sun);

  const M = {
    turf: new THREE.MeshStandardMaterial({ color: 0x2a5ca8, roughness: 0.95 }),
    apron: new THREE.MeshStandardMaterial({ color: 0x1d3f73, roughness: 0.95 }),
    slab: new THREE.MeshStandardMaterial({ color: 0xd9ddd6, roughness: 1 }),
    line: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x1c2226, roughness: 0.45, metalness: 0.6 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xd6eef0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    brand: new THREE.MeshStandardMaterial({ color: 0x147a80, roughness: 0.5 }),
    black: new THREE.MeshStandardMaterial({ color: 0x16191c, roughness: 0.35, metalness: 0.2 }),
    racket: new THREE.MeshStandardMaterial({ color: 0xd9ddd6, roughness: 0.5 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6dd, emissiveIntensity: 1.2 }),
  };

  // Diamond wire-mesh texture for the fences
  const textures: ThreeNs.Texture[] = [];
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const cx = cv.getContext("2d");
  if (cx) {
    cx.strokeStyle = "#1c2226";
    cx.lineWidth = 5;
    cx.beginPath();
    cx.moveTo(0, 0);
    cx.lineTo(128, 128);
    cx.moveTo(128, 0);
    cx.lineTo(0, 128);
    cx.stroke();
  }
  const fenceMat = (w: number, h: number) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(w / 0.11, h / 0.11);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    textures.push(t);
    return new THREE.MeshStandardMaterial({
      map: t,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.4,
    });
  };

  const court = new THREE.Group();
  const box = (w: number, h: number, d: number, mat: ThreeNs.Material, x: number, y: number, z: number, shadow = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    court.add(m);
    return m;
  };

  // ground, slab, apron, turf
  const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.16;
  ground.receiveShadow = true;
  scene.add(ground);
  box(13, 0.14, 23, M.slab, 0, -0.09, 0, false);
  box(11.6, 0.03, 21.6, M.apron, 0, -0.005, 0, false);
  box(10, 0.03, 20, M.turf, 0, 0.002, 0, false);
  // lines
  [-6.95, 6.95].forEach((z) => box(10, 0.006, 0.05, M.line, 0, 0.02, z, false));
  box(0.05, 0.006, 13.9, M.line, 0, 0.02, 0, false);
  // net
  [-5.1, 5.1].forEach((x) => box(0.08, 1.0, 0.08, M.steel, x, 0.5, 0));
  const net = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 0.86), fenceMat(10.2, 0.86));
  net.position.set(0, 0.45, 0);
  net.castShadow = true;
  court.add(net);
  box(10.2, 0.05, 0.02, M.line, 0, 0.9, 0);

  // walls
  const glassPanel = (w: number, h: number, x: number, y: number, z: number, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), M.glass);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    court.add(m);
  };
  const fence = (w: number, h: number, x: number, y: number, z: number, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fenceMat(w, h));
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.castShadow = true;
    court.add(m);
  };
  const post = (x: number, z: number, h: number) => box(0.05, h, 0.05, M.steel, x, h / 2, z);
  [-1, 1].forEach((s) => {
    const zb = s * 10;
    for (let i = 0; i < 5; i++) glassPanel(1.98, 3, -4 + i * 2, 1.5, zb);
    fence(10, 1, 0, 3.5, zb);
    for (let i = 0; i <= 5; i++) post(-5 + i * 2, zb, 4);
    box(10, 0.05, 0.05, M.steel, 0, 4, zb);
    box(10, 0.05, 0.05, M.steel, 0, 3, zb);
    [-5, 5].forEach((x) => {
      glassPanel(1.98, 3, x, 1.5, zb - s * 1, Math.PI / 2);
      glassPanel(1.98, 3, x, 1.5, zb - s * 3, Math.PI / 2);
      fence(2, 1, x, 3.5, zb - s * 1, Math.PI / 2);
      post(x, zb - s * 2, 4);
      post(x, zb - s * 4, 3);
      box(0.05, 0.05, 4, M.steel, x, 3, zb - s * 2);
      box(0.05, 0.05, 2, M.steel, x, 4, zb - s * 1);
    });
  });
  [-5, 5].forEach((x) => {
    fence(4.5, 3, x, 1.5, -3.75, Math.PI / 2);
    fence(4.5, 3, x, 1.5, 3.75, Math.PI / 2);
    [-6, -4, -1.5, 1.5, 4, 6].forEach((z) => post(x, z, 3));
    box(0.05, 0.05, 12, M.steel, x, 3, 0);
  });
  // floodlight poles
  ([[-5.6, -10.6], [5.6, -10.6], [-5.6, 10.6], [5.6, 10.6]] as const).forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 6.2, 16), M.steel);
    p.position.set(x, 3.1, z);
    p.castShadow = true;
    court.add(p);
    const head = box(0.9, 0.12, 0.35, M.steel, x - Math.sign(x) * 0.35, 6.2, z);
    head.rotation.z = Math.sign(x) * 0.25;
    const lamp = box(0.82, 0.02, 0.28, M.lamp, x - Math.sign(x) * 0.36, 6.13, z, false);
    lamp.rotation.z = Math.sign(x) * 0.25;
  });

  // Placeholder product geometry (scaled up for legibility), replace with real models later
  const S = 3;
  const cam = () => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.05), M.black);
    body.castShadow = true;
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 32), M.black);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.034;
    g.add(body, lens);
    return g;
  };
  {
    const g = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 40), M.brand);
    cup.rotation.x = Math.PI / 2;
    cup.castShadow = true;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 16), M.brand);
    arm.rotation.x = Math.PI / 2;
    arm.position.z = 0.055;
    const c = cam();
    c.position.z = 0.125;
    g.add(cup, arm, c);
    g.scale.setScalar(S);
    g.position.set(0, 1.75, -9.98);
    court.add(g);
  }
  {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.08), M.brand);
    base.castShadow = true;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 8, 24, Math.PI), M.brand);
    hook.position.set(0.012, 0.06, 0);
    hook.rotation.y = Math.PI / 2;
    const dove = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.05), M.brand);
    dove.position.x = -0.03;
    const c = cam();
    c.rotation.y = -Math.PI / 2;
    c.position.x = -0.085;
    g.add(base, hook, dove, c);
    g.scale.setScalar(S);
    g.position.set(4.97, 1.55, -3);
    court.add(g);
  }
  {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.08), M.brand);
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), M.brand);
    fork.position.set(0.04, -0.05, 0);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.035, 48), M.racket);
    head.rotation.z = Math.PI / 2;
    head.position.set(0.05, 0.2, 0);
    head.castShadow = true;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 16), M.black);
    neck.position.set(0.05, -0.07, 0);
    neck.castShadow = true;
    g.add(base, fork, head, neck);
    g.scale.setScalar(2.2);
    g.position.set(-4.97, 1.0, 3);
    court.add(g);
  }
  scene.add(court);

  // ── orbit + fly-to ──
  const toVec = (v: Vec3) => new THREE.Vector3(v[0], v[1], v[2]);
  const view = {
    target: toVec(HOME_VIEW.target),
    sph: new THREE.Spherical().setFromVector3(toVec(HOME_VIEW.off)),
  };
  let active: ZoneSelection = initial;
  let anim: {
    t: number;
    t0: ThreeNs.Vector3;
    t1: ThreeNs.Vector3;
    s0: ThreeNs.Spherical;
    s1: ThreeNs.Spherical;
  } | null = null;

  const flyTo = (z: { target: Vec3; off: Vec3 }, instant = false) => {
    const s1 = new THREE.Spherical().setFromVector3(toVec(z.off));
    let d = s1.theta - view.sph.theta;
    d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest rotation
    s1.theta = view.sph.theta + d;
    const t1 = toVec(z.target);
    if (instant) {
      view.target.copy(t1);
      view.sph.copy(s1);
      return;
    }
    anim = { t: 0, t0: view.target.clone(), t1, s0: view.sph.clone(), s1 };
  };
  flyTo(initial ? ZONES[initial] : HOME_VIEW, true);

  let drag: { x: number; y: number } | null = null;
  let idle = 0;
  const onDown = (e: PointerEvent) => {
    drag = { x: e.clientX, y: e.clientY };
    anim = null;
    el.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    view.sph.theta -= (e.clientX - drag.x) * 0.006;
    view.sph.phi = Math.min(1.45, Math.max(0.35, view.sph.phi - (e.clientY - drag.y) * 0.004));
    drag = { x: e.clientX, y: e.clientY };
    idle = 0;
  };
  const onUp = () => {
    drag = null;
  };
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);

  // On desktop the court is shifted/scaled beside the selection panel (tokens.css: --court-*).
  const desktop = window.matchMedia("(min-width: 768px)");
  const token = (name: string, fallback: number) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return fallback;
    return raw.endsWith("%") ? n / 100 : n;
  };
  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (desktop.matches) {
      camera.setViewOffset(w, h, -w * token("--court-x", 0.24), -h * token("--court-y", 0), w, h);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
  };
  desktop.addEventListener("change", resize);
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  let visible = true;
  const io = new IntersectionObserver((es) => {
    visible = es[0]?.isIntersecting ?? true;
  });
  io.observe(host);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tmp = new THREE.Vector3();
  const fit = () => {
    const zoomOut = desktop.matches ? 1 / token("--court-scale", 0.7) : 1;
    return Math.pow(Math.max(1, 1.45 / camera.aspect), active ? 0.4 : 0.85) * zoomOut;
  };
  const place = () => {
    tmp.setFromSpherical(view.sph).multiplyScalar(fit()).add(view.target);
    camera.position.copy(tmp);
    camera.lookAt(view.target);
  };

  let last = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible) return;
    if (anim) {
      const a = anim;
      a.t = Math.min(1, a.t + dt / (reduce ? 0.01 : 1.1));
      const k = a.t < 0.5 ? 4 * a.t ** 3 : 1 - (-2 * a.t + 2) ** 3 / 2;
      view.target.lerpVectors(a.t0, a.t1, k);
      view.sph.radius = a.s0.radius + (a.s1.radius - a.s0.radius) * k;
      view.sph.phi = a.s0.phi + (a.s1.phi - a.s0.phi) * k;
      view.sph.theta = a.s0.theta + (a.s1.theta - a.s0.theta) * k;
      if (a.t >= 1) anim = null;
    } else if (!drag && !active && !reduce) {
      idle += dt;
      if (idle > 2) view.sph.theta += dt * 0.05;
    }
    place();
    renderer.render(scene, camera);

    // Hotspots live in an unscaled overlay; map the (possibly CSS-scaled) canvas rect into it.
    const c = host.getBoundingClientRect();
    const o = overlay.getBoundingClientRect();
    for (const id of ZONE_IDS) {
      const b = hotspots[id];
      if (!b) continue;
      const p = ZONES[id].pos;
      tmp.set(p[0], p[1], p[2]).project(camera);
      if (tmp.z > 1) {
        b.style.transform = "translate(-9999px,0)";
        continue;
      }
      const x = c.left - o.left + (tmp.x * 0.5 + 0.5) * c.width - 24;
      const y = c.top - o.top + (-tmp.y * 0.5 + 0.5) * c.height - 24;
      b.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    }
  };
  place();
  renderer.render(scene, camera);
  raf = requestAnimationFrame(tick);

  return {
    setActive(zone) {
      active = zone;
      flyTo(zone ? ZONES[zone] : HOME_VIEW);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      desktop.removeEventListener("change", resize);
      io.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      Object.values(M).forEach((m) => m.dispose());
      ground.material.dispose();
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      el.remove();
    },
  };
}
