/**
 * "SUN, WIRED." art direction + time-of-day model for the hero solar-field scene.
 *
 * Pure data / maths, no three.js. Colours are sRGB triplets (0..1); the scene
 * converts them into the renderer's linear working space each frame.
 */

export const DEG = Math.PI / 180;
export const TAU = Math.PI * 2;

/** Azimuth of the sun, measured from the camera's default -Z axis toward +X. */
export const SUN_AZIMUTH = 19.0 * DEG;

/** Hero default: early golden light (05:00 -> 19:00 slider value). */
export const DEFAULT_TIME = 0.16;

type RGB = [number, number, number];

const hex = (value: string): RGB => {
  const n = parseInt(value.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** A fully art-directed moment of the day. */
export interface TimeKey {
  /** 0 = 05:00 first light, 0.5 = noon, 1 = 19:00 just after sunset. */
  t: number;
  /** Sun elevation above the horizon, degrees. */
  elevation: number;
  /** Multiplier for the sun disc + tight bloom. */
  sunPower: number;
  zenith: string;
  skyMid: string;
  horizonCool: string;
  horizonWarm: string;
  sunGlow: string;
  sunCore: string;
  sunYellow: string;
  rose: string;
  groundA: string;
  groundB: string;
  groundWarm: string;
  /** Strength of horizon/sun warmth. */
  warmth: number;
  /** Horizon haze thickness. */
  haze: number;
  /** Star visibility. */
  stars: number;
  /** Exponential fog density for the array (per metre). */
  fog: number;
  /** Tone-mapping exposure. */
  exposure: number;
  /** Amber rim-light strength on the module frames. */
  rim: number;
  /** Additive bloom intensity. */
  bloom: number;
  /** Backlit stratus strength. */
  cloud: number;
}

export const TIME_KEYS: TimeKey[] = [
  {
    t: 0.0,
    elevation: 1.0,
    sunPower: 1.0,
    zenith: "#050a20",
    skyMid: "#0a1640",
    horizonCool: "#1a2652",
    horizonWarm: "#a83a16",
    sunGlow: "#ff6a1e",
    sunCore: "#ffe6b8",
    sunYellow: "#ffb050",
    rose: "#5a2440",
    groundA: "#06070b",
    groundB: "#101118",
    groundWarm: "#3a2110",
    warmth: 0.55,
    haze: 0.9,
    stars: 1.0,
    fog: 0.015,
    exposure: 0.92,
    rim: 0.9,
    bloom: 0.5,
    cloud: 0.55,
  },
  {
    t: 0.18,
    elevation: 4.8,
    sunPower: 2.6,
    zenith: "#060a28",
    skyMid: "#0a1746",
    horizonCool: "#33335a",
    horizonWarm: "#ff6a12",
    sunGlow: "#ff7a12",
    sunCore: "#ffe0a0",
    sunYellow: "#ffb830",
    rose: "#3a2a48",
    groundA: "#05060a",
    groundB: "#0b0b0e",
    groundWarm: "#3a2410",
    warmth: 1.0,
    haze: 0.65,
    stars: 0.3,
    fog: 0.0042,
    exposure: 1.45,
    rim: 1.1,
    bloom: 1.15,
    cloud: 0.5,
  },
  {
    t: 0.33,
    elevation: 12.5,
    sunPower: 1.35,
    zenith: "#081444",
    skyMid: "#123a86",
    horizonCool: "#5a7fb8",
    horizonWarm: "#ffb04a",
    sunGlow: "#ffd05a",
    sunCore: "#fff6dc",
    sunYellow: "#ffd21e",
    rose: "#8a5a3a",
    groundA: "#0a0b0e",
    groundB: "#1c1712",
    groundWarm: "#6a4218",
    warmth: 0.82,
    haze: 0.5,
    stars: 0.0,
    fog: 0.0072,
    exposure: 1.12,
    rim: 0.8,
    bloom: 0.62,
    cloud: 0.35,
  },
  {
    t: 0.5,
    elevation: 18.5,
    sunPower: 1.45,
    zenith: "#0a1f52",
    skyMid: "#173f88",
    horizonCool: "#7fa4d6",
    horizonWarm: "#ffe6a8",
    sunGlow: "#fff3d6",
    sunCore: "#ffffff",
    sunYellow: "#fff0c0",
    rose: "#8fa0c0",
    groundA: "#101010",
    groundB: "#26221c",
    groundWarm: "#7a5a28",
    warmth: 0.4,
    haze: 0.22,
    stars: 0.0,
    fog: 0.005,
    exposure: 1.08,
    rim: 0.6,
    bloom: 0.24,
    cloud: 0.18,
  },
  {
    t: 0.7,
    elevation: 12.5,
    sunPower: 1.30,
    zenith: "#081848",
    skyMid: "#123a88",
    horizonCool: "#6a86bc",
    horizonWarm: "#ffb347",
    sunGlow: "#ffcf4a",
    sunCore: "#fff2cc",
    sunYellow: "#ffd21e",
    rose: "#8a6250",
    groundA: "#0c0b0c",
    groundB: "#201a13",
    groundWarm: "#6e4a1a",
    warmth: 0.85,
    haze: 0.45,
    stars: 0.0,
    fog: 0.0072,
    exposure: 1.1,
    rim: 0.85,
    bloom: 0.65,
    cloud: 0.4,
  },
  {
    t: 0.86,
    elevation: 3.0,
    sunPower: 1.30,
    zenith: "#060e33",
    skyMid: "#0d1c55",
    horizonCool: "#2e3566",
    horizonWarm: "#ff6a22",
    sunGlow: "#ff7a24",
    sunCore: "#ffe6b8",
    sunYellow: "#ffb050",
    rose: "#7e3040",
    groundA: "#08080b",
    groundB: "#171310",
    groundWarm: "#5e3214",
    warmth: 1.0,
    haze: 0.82,
    stars: 0.1,
    fog: 0.011,
    exposure: 1.02,
    rim: 1.0,
    bloom: 0.95,
    cloud: 0.65,
  },
  {
    t: 1.0,
    elevation: -2.4,
    sunPower: 0.6,
    zenith: "#04081c",
    skyMid: "#081230",
    horizonCool: "#1a2145",
    horizonWarm: "#c0441e",
    sunGlow: "#ff5a1a",
    sunCore: "#ffd0a0",
    sunYellow: "#ff9a30",
    rose: "#4a2038",
    groundA: "#04050a",
    groundB: "#0c0d13",
    groundWarm: "#3a2010",
    warmth: 0.5,
    haze: 0.72,
    stars: 0.85,
    fog: 0.012,
    exposure: 0.9,
    rim: 0.55,
    bloom: 0.5,
    cloud: 0.5,
  },
];

/** Interpolated state of the world for a slider value 0..1. */
export interface TimeSample {
  t: number;
  elevation: number;
  sunPower: number;
  zenith: RGB;
  skyMid: RGB;
  horizonCool: RGB;
  horizonWarm: RGB;
  sunGlow: RGB;
  sunCore: RGB;
  sunYellow: RGB;
  rose: RGB;
  groundA: RGB;
  groundB: RGB;
  groundWarm: RGB;
  warmth: number;
  haze: number;
  stars: number;
  fog: number;
  exposure: number;
  rim: number;
  bloom: number;
  cloud: number;
}

const rgbCache = new Map<string, RGB>();
const cacheRGB = (value: string): RGB => {
  let cached = rgbCache.get(value);
  if (!cached) {
    cached = hex(value);
    rgbCache.set(value, cached);
  }
  return cached;
};

const COLOR_FIELDS = [
  "zenith",
  "skyMid",
  "horizonCool",
  "horizonWarm",
  "sunGlow",
  "sunCore",
  "sunYellow",
  "rose",
  "groundA",
  "groundB",
  "groundWarm",
] as const;

/** Sample the art-directed time-of-day curve. */
export function sampleTimeOfDay(value: number): TimeSample {
  const t = clamp01(value);
  let i = 0;
  while (i < TIME_KEYS.length - 2 && t > TIME_KEYS[i + 1].t) i += 1;
  const a = TIME_KEYS[i];
  const b = TIME_KEYS[Math.min(i + 1, TIME_KEYS.length - 1)];
  const span = b.t - a.t || 1;
  const u = smooth(clamp01((t - a.t) / span));

  const out: Record<string, unknown> = { t };
  for (const field of COLOR_FIELDS) {
    out[field] = lerpRGB(cacheRGB(a[field]), cacheRGB(b[field]), u);
  }
  const numbers = [
    "elevation",
    "sunPower",
    "warmth",
    "haze",
    "stars",
    "fog",
    "exposure",
    "rim",
    "bloom",
    "cloud",
  ] as const;
  for (const field of numbers) out[field] = lerp(a[field], b[field], u);
  return out as unknown as TimeSample;
}

/** Solar-field world layout, shared by the mesh builder and the ground shader. */
export const FIELD = {
  tilt: 27 * DEG,
  moduleW: 1.16,
  moduleH: 2.3,
  moduleGap: 0.055,
  baseHeight: 0.75,
  rowSpacing: 6.2,
  rowStartZ: -6,
  rows: 30,
  yaw: 10 * DEG,
  maxHalfWidth: 110,
  tableEvery: 16,
} as const;

/** Camera framing that does not depend on the time slider. */
export interface Framing {
  fov: number;
  yaw: number;
  pitch: number;
  camY: number;
  camZ: number;
  /** Extra elevation (radians) used only in portrait to keep the sun high. */
  elevationBoost: number;
  horizonNdc: number;
}

/**
 * Compose the camera so the sun lands at a deliberate screen position for any
 * aspect ratio while the horizon stays low. Landscape: sun ~68% across, ~56%
 * down, horizon ~70% down. Portrait: sun ~72% across, ~31% down.
 */
export function planFraming(aspect: number): Framing {
  const t = smooth(clamp01((aspect - 0.62) / (1.45 - 0.62)));

  const fov = lerp(55, 46, t);
  const tanV = Math.tan((fov * DEG) / 2);

  const sunNdcX = lerp(0.44, 0.52, t);
  const sunNdcY = lerp(0.30, 0.04, t);
  const nominalElevation = 4.8 * DEG;

  const camY = lerp(5.6, 7.2, t);
  const camZ = lerp(13.5, 14.0, t);
  const elevationBoost = lerp(9.5, 0, t) * DEG;

  const yaw = SUN_AZIMUTH - Math.atan(sunNdcX * tanV * aspect);
  const pitch = nominalElevation + elevationBoost - Math.atan(sunNdcY * tanV);
  const horizonNdc = -Math.tan(pitch) / tanV;

  return { fov, yaw, pitch, camY, camZ, elevationBoost, horizonNdc };
}
