import * as THREE from "three";
import {
  DEFAULT_TIME,
  DEG,
  FIELD,
  SUN_AZIMUTH,
  clamp01,
  planFraming,
  sampleTimeOfDay,
  type Framing,
  type TimeSample,
} from "./palette";
import { buildPanelField, type PanelField } from "./panelField";
import { buildUtilityLines } from "./structures";
import {
  BLOOM_VERT,
  BLOOM_FRAG,
  SKY_VERT,
  SKY_FRAG,
  GROUND_VERT,
  GROUND_FRAG,
  GLASS_VERT,
  GLASS_FRAG,
  FRAME_VERT,
  FRAME_FRAG,
  STRUCT_VERT,
  STRUCT_FRAG,
  SOLID_VERT,
  SOLID_FRAG,
} from "./shaders";

/**
 * Imperative Three.js controller for the "SUN, WIRED." hero.
 *
 * Time of day is externally controllable:
 *   window.dispatchEvent(new CustomEvent("vo:solar-time", { detail: { value: 0.18 } }))
 *   window.__solarSetTime(0.18)
 * value: 0 = 05:00 first light, 0.5 = noon, 1 = 19:00 just after sunset.
 * Changes are damped over ~0.6s. Without events the scene drifts slowly on its own.
 */

export interface SolarSceneOptions {
  onFirstFrame: () => void;
  onFail: () => void;
}

export interface SolarSceneHandle {
  dispose: () => void;
}

export interface HeroStats {
  mode: "webgl";
  fps: number;
  drawCalls: number;
  triangles: number;
  dpr: number;
  width: number;
  height: number;
  time: number;
  sunElev: number;
  scroll: number;
  reducedMotion: boolean;
}

declare global {
  interface Window {
    __heroStats?: HeroStats;
    __solarReady?: boolean;
    __solarSetTime?: (value: number) => void;
    __solarTime?: number;
  }
}

type Uniforms = Record<string, THREE.IUniform>;

/** Maximum pointer-parallax rotation (radians): ~1.5 deg yaw / ~0.9 deg pitch. */
const MAX_YAW = THREE.MathUtils.degToRad(1.5);
const MAX_PITCH = THREE.MathUtils.degToRad(0.9);

/** Damping time constant for the time-of-day slider (~0.6s to settle). */
const TIME_TAU = 0.19;

/** Colour helpers: palette stores sRGB triplets, renderer wants linear. */
function setColor(uniform: THREE.IUniform, rgb: readonly number[]): void {
  (uniform.value as THREE.Color).setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);
}

export function createSolarScene(host: HTMLElement, options: SolarSceneOptions): SolarSceneHandle {
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer =
    typeof window.matchMedia === "function" && window.matchMedia("(any-pointer: coarse)").matches;
  const dprCap = coarsePointer ? 1.25 : 1.5;

  // ---- canvas / renderer -------------------------------------------------
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("role", "presentation");
  canvas.setAttribute("data-hero-canvas", "");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;" +
    "transition:opacity 1100ms cubic-bezier(0.16,1,0.3,1);pointer-events:none;";
  host.appendChild(canvas);

  // Create the GL context ourselves so a missing WebGL2 fails quietly to the
  // CSS poster without three.js logging a context-creation error.
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      depth: true,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    }) as WebGL2RenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) {
    canvas.remove();
    options.onFail();
    return { dispose: () => undefined };
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl,
      antialias: true,
      alpha: false,
      depth: true,
      stencil: false,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
    });
  } catch (error) {
    canvas.remove();
    options.onFail();
    console.warn("[hero] WebGL unavailable, using CSS poster.", error);
    return { dispose: () => undefined };
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = false;
  renderer.setClearColor(0x08090b, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1.78, 0.1, 5200);
  camera.rotation.order = "YXZ";

  // Shared atmosphere uniforms: the same IUniform objects are referenced by every
  // material, so one write per frame updates sky, haze, reflections and lighting.
  const atmosphere: Uniforms = {
    uSunDir: { value: new THREE.Vector3(0, 0.1, -1).normalize() },
    uSunElev: { value: 0.1 },
    uZenith: { value: new THREE.Color() },
    uSkyMid: { value: new THREE.Color() },
    uHorizonCool: { value: new THREE.Color() },
    uHorizonWarm: { value: new THREE.Color() },
    uSunGlow: { value: new THREE.Color() },
    uSunCore: { value: new THREE.Color() },
    uSunYellow: { value: new THREE.Color() },
    uSunPower: { value: 1 },
    uWarmth: { value: 1 },
    uStars: { value: 0.3 },
    uHazeAmt: { value: 0.8 },
    uCloud: { value: 0.6 },
    uFogDensity: { value: 0.0095 },
  };

  const sunDir = new THREE.Vector3();
  const sunDirXZ = new THREE.Vector2(0, -1);

  // ---- sky ---------------------------------------------------------------
  const skyGeom = new THREE.SphereGeometry(1600, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: { ...atmosphere },
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: true,
  });
  const sky = new THREE.Mesh(skyGeom, skyMat);
  sky.name = "sky-dome";
  sky.renderOrder = -1000;
  sky.frustumCulled = false;
  scene.add(sky);

  // ---- additive sun bloom (cheap fake post) ------------------------------
  const bloomUniforms: Uniforms = {
    uBloomCore: { value: new THREE.Color() },
    uBloomHalo: { value: new THREE.Color() },
    uBloomIntensity: { value: 0.6 },
  };
  const bloomGeom = new THREE.PlaneGeometry(1, 1);
  const bloomMat = new THREE.ShaderMaterial({
    vertexShader: BLOOM_VERT,
    fragmentShader: BLOOM_FRAG,
    uniforms: bloomUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const sunBloom = new THREE.Mesh(bloomGeom, bloomMat);
  sunBloom.name = "sun-bloom";
  sunBloom.frustumCulled = false;
  sunBloom.renderOrder = 900;
  scene.add(sunBloom);
  const BLOOM_DISTANCE = 420;
  const BLOOM_SIZE = 170;

  // ---- ground ------------------------------------------------------------
  const fieldDir = new THREE.Vector2(Math.cos(FIELD.yaw), -Math.sin(FIELD.yaw));
  const fieldNormal = new THREE.Vector2(Math.sin(FIELD.yaw), Math.cos(FIELD.yaw));

  const groundUniforms: Uniforms = {
    ...atmosphere,
    uGroundA: { value: new THREE.Color() },
    uGroundB: { value: new THREE.Color() },
    uGroundWarm: { value: new THREE.Color() },
    uFieldDir: { value: fieldDir },
    uFieldNormal: { value: fieldNormal },
    uRowV0: { value: FIELD.rowStartZ },
    uRowSpacing: { value: FIELD.rowSpacing },
    uShadowLen: { value: 5 },
    uSunDirXZ: { value: sunDirXZ },
  };
  const groundGeom = new THREE.PlaneGeometry(4200, 4200, 1, 1);
  const groundMat = new THREE.ShaderMaterial({
    vertexShader: GROUND_VERT,
    fragmentShader: GROUND_FRAG,
    uniforms: groundUniforms,
    toneMapped: true,
  });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.name = "ground";
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ---- panel field -------------------------------------------------------
  const glassUniforms: Uniforms = {
    ...atmosphere,
    uGlass: { value: new THREE.Color("#03080f") },
    uFrame: { value: new THREE.Color("#39414b") },
    uSliver: { value: new THREE.Color() },
    uSweep: { value: 0.2 },
    uRimGain: { value: 1.0 },
  };
  const frameUniforms: Uniforms = {
    ...atmosphere,
    uFrame: { value: new THREE.Color("#8b949e") },
    uSliver: { value: new THREE.Color() },
    uRimGain: { value: 1.0 },
  };
  const structureUniforms: Uniforms = {
    ...atmosphere,
    uSkin: { value: new THREE.Color("#05070a") },
  };
  const solidUniforms: Uniforms = {
    ...atmosphere,
    uSkin: { value: new THREE.Color("#03050a") },
  };

  const glassMat = new THREE.ShaderMaterial({
    vertexShader: GLASS_VERT,
    fragmentShader: GLASS_FRAG,
    uniforms: glassUniforms,
    toneMapped: true,
  });
  const frameMat = new THREE.ShaderMaterial({
    vertexShader: FRAME_VERT,
    fragmentShader: FRAME_FRAG,
    uniforms: frameUniforms,
    toneMapped: true,
  });
  const structureMat = new THREE.ShaderMaterial({
    vertexShader: STRUCT_VERT,
    fragmentShader: STRUCT_FRAG,
    uniforms: structureUniforms,
    toneMapped: true,
  });
  const solidMat = new THREE.ShaderMaterial({
    vertexShader: SOLID_VERT,
    fragmentShader: SOLID_FRAG,
    uniforms: solidUniforms,
    toneMapped: true,
  });

  const field: PanelField = buildPanelField({
    glass: glassMat,
    frame: frameMat,
    structure: structureMat,
  });
  field.group.rotation.y = FIELD.yaw;
  scene.add(field.group);

  // ---- utility pole + wires ---------------------------------------------
  const utilities = buildUtilityLines(solidMat);
  scene.add(utilities.group);
  scene.add(utilities.wires);

  // ---- camera / input state ---------------------------------------------
  let framing: Framing = planFraming(1.78);
  let scroll = 0;
  let scrollTarget = 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;

  let timeTarget = DEFAULT_TIME;
  let timeCurrent = DEFAULT_TIME;
  let timeSample: TimeSample = sampleTimeOfDay(timeCurrent);

  /** Damped target for the external "sun time" control (0..1). */
  function setTimeTarget(value: number): void {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    timeTarget = clamp01(value);
    if (prefersReducedMotion) {
      timeCurrent = timeTarget;
      timeSample = sampleTimeOfDay(timeCurrent);
      update(0, performance.now() / 1000);
      present(performance.now());
    }
  }

  window.__solarSetTime = setTimeTarget;
  window.__solarTime = timeCurrent;

  const onSolarTime = (event: Event) => {
    const detail = (event as CustomEvent<{ value?: unknown }>).detail;
    if (detail && typeof detail.value === "number") setTimeTarget(detail.value);
  };
  window.addEventListener("vo:solar-time", onSolarTime as EventListener);

  const measureScroll = () => {
    const rect = host.getBoundingClientRect();
    const height = Math.max(1, rect.height);
    scrollTarget = clamp01(-rect.top / height);
  };
  measureScroll();
  scroll = scrollTarget;

  const applySize = () => {
    const width = Math.max(1, host.clientWidth || window.innerWidth);
    const height = Math.max(1, host.clientHeight || window.innerHeight);
    const aspect = width / height;
    framing = planFraming(aspect);
    camera.aspect = aspect;
    camera.fov = framing.fov;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(width, height, false);
    measureScroll();
  };
  applySize();

  // ---- time-of-day application -------------------------------------------
  const panelTopHeight = FIELD.baseHeight + FIELD.moduleH * Math.cos(FIELD.tilt);

  function applyTime(sample: TimeSample) {
    setColor(atmosphere.uZenith, sample.zenith);
    setColor(atmosphere.uSkyMid, sample.skyMid);
    setColor(atmosphere.uHorizonCool, sample.horizonCool);
    setColor(atmosphere.uHorizonWarm, sample.horizonWarm);
    setColor(atmosphere.uSunGlow, sample.sunGlow);
    setColor(atmosphere.uSunCore, sample.sunCore);
    setColor(atmosphere.uSunYellow, sample.sunYellow);

    atmosphere.uSunPower.value = sample.sunPower;
    atmosphere.uWarmth.value = sample.warmth;
    atmosphere.uStars.value = sample.stars;
    atmosphere.uHazeAmt.value = sample.haze;
    atmosphere.uCloud.value = sample.cloud;
    atmosphere.uFogDensity.value = sample.fog;

    setColor(groundUniforms.uGroundA, sample.groundA);
    setColor(groundUniforms.uGroundB, sample.groundB);
    setColor(groundUniforms.uGroundWarm, sample.groundWarm);

    setColor(glassUniforms.uSliver, sample.sunYellow);
    setColor(frameUniforms.uSliver, sample.sunGlow);

    setColor(bloomUniforms.uBloomCore, sample.sunCore);
    setColor(bloomUniforms.uBloomHalo, sample.sunGlow);
    bloomUniforms.uBloomIntensity.value = sample.bloom * 0.46;

    renderer.toneMappingExposure = sample.exposure;
  }

  /** Portrait crops get a lifted sun so it clears the big headline. */
  function elevationForSample(sample: TimeSample): number {
    const boostFactor = clamp01((sample.elevation + 2.0) / 7.0);
    return sample.elevation * DEG + framing.elevationBoost * boostFactor;
  }

  function update(dt: number, timeSec: number) {
    // Damped time-of-day slider (~0.6s settle).
    timeCurrent += (timeTarget - timeCurrent) * (prefersReducedMotion ? 1 : 1 - Math.exp(-dt / TIME_TAU));
    timeSample = sampleTimeOfDay(timeCurrent);
    applyTime(timeSample);

    const easeScroll = prefersReducedMotion ? 1 : 1 - Math.exp(-dt * 6);
    const easePointer = 1 - Math.exp(-dt * 3.4);
    scroll += (scrollTarget - scroll) * easeScroll;
    pointerX += (pointerTargetX - pointerX) * easePointer;
    pointerY += (pointerTargetY - pointerY) * easePointer;

    const p = clamp01(scroll);
    const elevation = elevationForSample(timeSample);
    const cosElev = Math.cos(elevation);

    sunDir
      .set(Math.sin(SUN_AZIMUTH) * cosElev, Math.sin(elevation), -Math.cos(SUN_AZIMUTH) * cosElev)
      .normalize();
    sunDirXZ.set(sunDir.x, sunDir.z).normalize();
    atmosphere.uSunDir.value.copy(sunDir);
    atmosphere.uSunElev.value = elevation;

    // Barely-perceptible dolly + breathing; scroll adds a small extra push.
    const dolly =
      0.42 * (0.5 - 0.5 * Math.cos(timeSec * 0.043)) +
      0.16 * Math.sin(timeSec * 0.027 + 1.3);
    const push = 0.5 * p;
    camera.position.set(
      0.05 * Math.sin(timeSec * 0.031),
      framing.camY + 0.012 * Math.sin(timeSec * 0.41),
      framing.camZ - dolly - push
    );
    camera.rotation.set(
      framing.pitch + pointerY * MAX_PITCH + 0.0015 * Math.sin(timeSec * 0.62),
      -(framing.yaw + pointerX * MAX_YAW),
      0
    );
    camera.updateMatrixWorld();
    sky.position.copy(camera.position);

    // Long low-sun shadows shorten as the sun climbs, and stretch at dusk.
    const shadowLen = (panelTopHeight / Math.max(Math.tan(elevation), 0.06)) * 0.22;
    groundUniforms.uShadowLen.value = THREE.MathUtils.clamp(shadowLen, 1.4, FIELD.rowSpacing * 0.95);

    // Scroll-driven specular sweep across the rows.
    glassUniforms.uSweep.value = 0.06 + p * 1.04;
    glassUniforms.uRimGain.value = timeSample.rim * (0.95 + 0.25 * p);
    frameUniforms.uRimGain.value = timeSample.rim * (0.95 + 0.25 * p);

    // Keep the fake bloom glued to the sun and facing the lens.
    sunBloom.position.copy(camera.position).addScaledVector(sunDir, BLOOM_DISTANCE);
    sunBloom.quaternion.copy(camera.quaternion);
    sunBloom.scale.setScalar(BLOOM_SIZE * (0.92 + 0.16 * timeSample.warmth));
    bloomUniforms.uBloomIntensity.value =
      timeSample.bloom * (0.42 + 0.10 * p) * (elevation < 0 ? 0.5 : 1);

    renderer.toneMappingExposure = timeSample.exposure + 0.03 * p;
    window.__solarTime = timeCurrent;
  }

  function renderFrame() {
    renderer.render(scene, camera);
  }

  // ---- loop / visibility -------------------------------------------------
  const stats: HeroStats = {
    mode: "webgl",
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    dpr: renderer.getPixelRatio(),
    width: 0,
    height: 0,
    time: timeCurrent,
    sunElev: 0,
    scroll: 0,
    reducedMotion: prefersReducedMotion,
  };

  let firstFrame = false;
  let running = false;
  let rafId = 0;
  let last = 0;
  let lastRender = 0;
  let frameCount = 0;
  let statsTime = 0;

  function publishStats(now: number, value: number) {
    stats.fps = value;
    stats.drawCalls = renderer.info.render.calls;
    stats.triangles = renderer.info.render.triangles;
    stats.dpr = renderer.getPixelRatio();
    stats.width = renderer.domElement.width;
    stats.height = renderer.domElement.height;
    stats.time = timeCurrent;
    stats.sunElev = atmosphere.uSunElev.value as number;
    stats.scroll = scroll;
    statsTime = now;
    window.__heroStats = { ...stats };
  }

  function present(now: number) {
    renderFrame();
    if (!firstFrame) {
      firstFrame = true;
      canvas.style.opacity = "1";
      window.__solarReady = true;
      options.onFirstFrame();
      publishStats(now, 0);
    }
  }

  function frame(now: number) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (now - lastRender < 15) return; // ~60 fps cap even on high-refresh displays
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    lastRender = now;
    update(dt, now / 1000);
    present(now);
    frameCount += 1;
    if (now - statsTime > 500) {
      publishStats(now, Math.round((frameCount * 1000) / (now - statsTime)));
      frameCount = 0;
    }
  }

  const canRun = () => !document.hidden && inView && !prefersReducedMotion;

  function start() {
    if (running || !canRun()) return;
    running = true;
    last = performance.now();
    lastRender = last - 16;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // ---- first frame -------------------------------------------------------
  let inView = true;

  if (prefersReducedMotion) {
    timeTarget = DEFAULT_TIME;
    timeCurrent = DEFAULT_TIME;
    timeSample = sampleTimeOfDay(timeCurrent);
    update(0, 12);
    present(performance.now());
  } else {
    update(0, 0);
    present(performance.now());
    start();
  }

  // ---- observers / listeners ---------------------------------------------
  const intersectionObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1];
            inView = entry.isIntersecting;
            if (inView) start();
            else stop();
          },
          { threshold: 0 }
        )
      : null;
  intersectionObserver?.observe(host);

  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const onScroll = () => {
    measureScroll();
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    pointerTargetX = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    pointerTargetY = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  const onResize = () => {
    applySize();
    if (prefersReducedMotion) {
      update(0, 12);
      present(performance.now());
    }
  };

  const resizeObserver =
    typeof ResizeObserver === "function" ? new ResizeObserver(onResize) : null;
  resizeObserver?.observe(host);

  window.addEventListener("resize", onResize);

  const onContextLost = (event: Event) => {
    event.preventDefault();
    stop();
    options.onFail();
  };
  canvas.addEventListener("webglcontextlost", onContextLost, false);

  // ---- dispose ------------------------------------------------------------
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener("vo:solar-time", onSolarTime as EventListener);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("resize", onResize);
    canvas.removeEventListener("webglcontextlost", onContextLost);

    const geometries = new Set<THREE.BufferGeometry>();
    scene.traverse((object) => {
      const asMesh = object as THREE.Mesh;
      if (asMesh.geometry) geometries.add(asMesh.geometry);
    });
    geometries.add(utilities.wires.geometry);
    geometries.forEach((geometry) => geometry.dispose());

    const materials = [
      skyMat,
      groundMat,
      glassMat,
      frameMat,
      structureMat,
      solidMat,
      bloomMat,
      utilities.wires.material as THREE.Material,
    ];
    materials.forEach((material) => material.dispose());

    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    delete window.__heroStats;
    delete window.__solarReady;
    delete window.__solarSetTime;
    delete window.__solarTime;
  }

  return { dispose };
}
