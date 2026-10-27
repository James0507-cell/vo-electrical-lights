/**
 * GLSL for the hero solar-field scene.
 *
 * Everything is procedural (no textures / HDRIs) and written in GLSL1 syntax which
 * three.js upgrades for WebGL2. Colour uniforms are THREE.Color instances, i.e. already
 * converted to the renderer's linear working space, and every fragment shader ends with
 * three's tone-mapping + output-colour-space chunks so ACES is applied exactly once.
 */

/** Shared atmosphere uniforms + sky model, injected into most fragment shaders. */
export const COMMON = /* glsl */ `#define PI 3.141592653589793

uniform vec3  uSunDir;        // normalised world direction towards the sun
uniform float uSunElev;       // sun elevation (radians)
uniform vec3  uZenith;        // deep sky
uniform vec3  uSkyMid;        // mid sky
uniform vec3  uHorizonCool;   // horizon away from the sun
uniform vec3  uHorizonWarm;   // horizon toward the sun
uniform vec3  uSunGlow;       // wide amber scattering
uniform vec3  uRose;          // dusty rose transition band
uniform vec3  uSunCore;       // sun disc
uniform vec3  uSunYellow;     // solar-yellow inner corona
uniform float uSunPower;      // disc / bloom intensity for the time of day
uniform float uWarmth;        // 0..1 golden-hour warmth
uniform float uStars;         // 0..1 star visibility
uniform float uHazeAmt;       // 0..1 horizon haze thickness
uniform float uCloud;         // 0..1 backlit stratus strength
uniform float uFogDensity;    // aerial-perspective density

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm2(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + 11.7;
    a *= 0.5;
  }
  return v;
}


/** Cheap atmosphere lookup for reflections & haze (no fbm, 2 dot products). */
vec3 skyColorCheap(vec3 dir) {
  float hh = max(dir.y, 0.0);
  vec2 sh = normalize(uSunDir.xz + vec2(1e-5));
  vec2 dh = normalize(dir.xz + vec2(1e-5));
  float azWarm = pow(clamp(0.5 + 0.5 * dot(dh, sh), 0.0, 1.0), 2.4);
  vec3 low = mix(uHorizonCool, uHorizonWarm, azWarm);
  vec3 col = mix(low, uSkyMid, smoothstep(0.0, 0.06, hh));
  col = mix(col, uZenith, smoothstep(0.015, 0.28, hh));
  col += uSunGlow * exp(-hh * 12.0) * (0.05 + 0.35 * azWarm);
  float sd = clamp(dot(dir, uSunDir), 0.0, 1.0);
  col += uSunGlow * pow(sd, 45.0) * 0.30;
  return col;
}

/** Sky radiance for a world direction. Shared by dome, ground haze and reflections. */
vec3 skyColor(vec3 dir, float starAmt) {
  float hh = max(dir.y, 0.0);
  float ang = atan(dir.x, -dir.z);

  vec2 sh = uSunDir.xz;
  float shl = length(sh);
  vec2 dh = dir.xz;
  float dhl = length(dh);
  float az = (shl > 1e-4 && dhl > 1e-4) ? dot(dh / dhl, sh / shl) : 1.0;
  float azWarm = pow(clamp(0.5 + 0.5 * az, 0.0, 1.0), 2.6);
  float sunDot = clamp(dot(dir, uSunDir), 0.0, 1.0);

  // Deep ink sky with a faint blue-violet cast, warming only near the horizon.
  vec3 col = mix(uSkyMid, uZenith, smoothstep(0.0, 0.62, hh));
  float horizonMask = exp(-hh * 20.0);
  vec3 horizonCol = mix(uHorizonCool, uHorizonWarm, azWarm);
  col = mix(col, horizonCol, horizonMask * (0.45 + 0.55 * azWarm));

  // ---- sunrise glow: anisotropic (wide along the horizon, tight vertically)
  float az0 = ang;
  float azSun = atan(uSunDir.x, -uSunDir.z);
  float dAz = mod(az0 - azSun + PI, 2.0 * PI) - PI;

  float horizonFall = exp(-hh * 14.0);
  float wideAz = exp(-pow(dAz / 0.85, 2.0));
  float coreAz = exp(-pow(dAz / 0.30, 2.0));

  col += uSunGlow * horizonFall * (0.10 + 0.30 * wideAz + 2.10 * coreAz) * (0.7 + 0.4 * uWarmth);
  col += uHorizonWarm * exp(-hh * 26.0) * (0.08 + 1.25 * coreAz) * (0.7 + 0.5 * uWarmth);
  col += uSunGlow * pow(sunDot, 9.0) * 0.030 * uWarmth;
  col += uSunYellow * exp(-hh * 34.0) * (0.05 + 0.34 * coreAz) * uWarmth;
  col += uRose * exp(-pow((hh - 0.07) / 0.05, 2.0)) * (0.05 + 0.12 * wideAz) * 0.12;

  // Sun "render": smooth overlapping gaussians, deliberately kept below the
  // tone-mapping shoulder so the disc keeps a warm gradient instead of going flat.
  float sunAng = acos(clamp(sunDot, -1.0, 1.0));
  float sunHotG = exp(-pow(sunAng / 0.0080, 2.0));
  float sunCoreG = exp(-pow(sunAng / 0.0185, 2.0));
  float sunLimbG = exp(-pow(sunAng / 0.0235, 2.0));
  float sunInnerG = exp(-pow(sunAng / 0.055, 2.0));
  float sunMidG = exp(-pow(sunAng / 0.135, 2.0));
  float sunWideG = exp(-pow(sunAng / 0.200, 2.0));
  // warm sun: white-hot centre, amber limb, wide warm bloom
  col += uSunCore * sunHotG * 4.4 * uSunPower;
  col += uSunCore * sunCoreG * 6.4 * uSunPower;
  col += uSunGlow * sunLimbG * 2.30 * uSunPower;
  col += uSunGlow * sunInnerG * 0.85 * uSunPower;
  col += uSunGlow * sunMidG * 0.28 * uSunPower;
  col += uSunGlow * sunWideG * 0.11 * uSunPower;

  // Backlit stratus drifting across the low sky: thin darker bands silhouetted
  // against the glow — the cheapest, most convincing sunrise cue there is.
  float cloud = fbm2(vec2(ang * 1.55 + 5.0, hh * 30.0 + 1.0));
  cloud = smoothstep(0.53, 0.80, cloud);
  float cloudBand = exp(-pow((hh - 0.035) / 0.075, 2.0));
  vec3 cloudCol = mix(uHorizonWarm * 0.75, uSkyMid * 1.3, 0.45);
  col = mix(col, cloudCol, cloud * cloudBand * 0.42 * uCloud);

  float cloud2 = fbm2(vec2(ang * 0.95 + 13.0, hh * 14.0));
  cloud2 = smoothstep(0.58, 0.88, cloud2) * exp(-pow((hh - 0.15) / 0.13, 2.0));
  col = mix(col, mix(uSkyMid, uHorizonCool, 0.4) * 1.1, cloud2 * 0.24 * uCloud);

  // cool counter-glow keeps the upper sky from going muddy
  col += uHorizonCool * 0.10 * exp(-hh * 7.0) * (1.0 - azWarm);

  // Thin high wisps catching the first light.
  float streak = fbm2(vec2(ang * 2.4 + 11.0, hh * 52.0 + 3.0));
  streak = smoothstep(0.55, 0.95, streak) * exp(-hh * 10.0);
  col += mix(uHorizonCool, uHorizonWarm, 0.45 + 0.55 * azWarm) * streak * (0.07 + 0.05 * uWarmth);

  // Horizon dust veil.
  col = mix(col, mix(uHorizonCool, uHorizonWarm, azWarm * 0.85), exp(-hh * 90.0) * 0.22 * uHazeAmt);

  // Stars, fading out near the horizon and toward the sun.
  if (starAmt > 0.001) {
    vec3 q = dir * 120.0;
    vec3 id = floor(q);
    float r = hash31(id);
    vec3 f = fract(q) - 0.5;
    float star = smoothstep(0.9976, 1.0, r) * smoothstep(0.34, 0.02, length(f));
    star *= smoothstep(0.03, 0.24, hh) * (1.0 - 0.8 * azWarm);
    col += vec3(0.62, 0.72, 1.0) * star * starAmt * 0.65;
  }

  return col;
}
`;

/* ---- Sky dome ---------------------------------------------------------- */

export const SKY_VERT = /* glsl */ `varying vec3 vWorldPos;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const SKY_FRAG = /* glsl */ `${COMMON}

varying vec3 vWorldPos;

void main() {
  vec3 dir = normalize(vWorldPos - cameraPosition);
  vec3 col = skyColor(dir, uStars);

  // Dither to stop 8-bit banding across the long dark gradient.
  col += (hash21(gl_FragCoord.xy * 1.73) - 0.5) * 0.0016;

  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/* ---- Ground plane (earth, baked row shadows, aerial perspective) -------- */

export const GROUND_VERT = /* glsl */ `varying vec3 vWorldPos;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const GROUND_FRAG = /* glsl */ `${COMMON}

uniform vec3  uGroundA;
uniform vec3  uGroundB;
uniform vec3  uGroundWarm;
uniform vec2  uFieldDir;
uniform vec2  uFieldNormal;
uniform float uRowV0;
uniform float uRowSpacing;
uniform float uShadowLen;
uniform vec2  uSunDirXZ;

varying vec3 vWorldPos;

void main() {
  vec3 toF = vWorldPos - cameraPosition;
  float dist = length(toF);
  vec3 dir = toF / dist;
  vec2 xz = vWorldPos.xz;

  // ---- earth ------------------------------------------------------------
  float broad = fbm2(xz * 0.045 + 7.3);
  float fine = fbm2(xz * 1.1 + 2.1);
  float detail = 1.0 - smoothstep(26.0, 150.0, dist);
  float grain = mix(0.5, fine, detail);

  vec3 g = mix(uGroundA, uGroundB, broad * 0.85 + 0.08);
  g *= 0.72 + 0.5 * grain;

  // warm dust toward the sunrise
  vec2 dh = normalize(vec2(dir.x, dir.z) + vec2(1e-5));
  float az = clamp(0.5 + 0.5 * dot(dh, uSunDirXZ), 0.0, 1.0);
  g += uGroundWarm * pow(az, 4.0) * exp(-dist * 0.02) * 0.05;

  // ---- baked row shadows -----------------------------------------------
  float v = dot(xz, uFieldNormal);
  float vRow = uRowV0 + floor((v - uRowV0) / uRowSpacing) * uRowSpacing;
  float s = v - vRow;

  float band = smoothstep(-0.35, 0.55, s) * (1.0 - smoothstep(uShadowLen * 0.7, uShadowLen * 1.05, s));
  float under = 1.0 - smoothstep(0.0, 1.4, abs(s + 0.4));
  float shade = clamp(band * 0.5 + under * 0.55, 0.0, 0.82);
  shade *= mix(1.0, 0.75 + 0.5 * fine, detail);
  g *= 1.0 - shade;

  // faint gravel tracks running along the rows
  float track = smoothstep(0.94, 0.995, abs(sin(dot(xz, uFieldDir) * 0.55)));
  g *= 1.0 - track * 0.06 * detail;

  // ---- aerial perspective ----------------------------------------------
  vec3 horizonDir = normalize(vec3(dir.x, 0.015, dir.z));
  vec3 hazeCol = skyColor(horizonDir, 0.0);
  // the earth keeps its own weight: only a thin veiling of atmosphere
  hazeCol = mix(hazeCol * 0.6, uGroundA, 0.55);
  float fog = 1.0 - exp(-dist * uFogDensity * 0.34);
  g = mix(g, hazeCol, fog);

  // glow licking the ground just under the sun
  g += uSunGlow * pow(az, 3.0) * exp(-dist * 0.014) * 0.014;

  gl_FragColor = vec4(max(g, vec3(0.0)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ---- PV glass (instanced) ---------------------------------------------- */

export const GLASS_VERT = /* glsl */ `attribute vec2 aMeta;        // x: row depth 0..1 (near -> far), y: per-panel seed

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;
varying vec2 vMeta;

void main() {
  mat4 im = instanceMatrix;
  vec4 wp = modelMatrix * im * vec4(position, 1.0);
  vWorldPos = wp.xyz;

  mat3 nm = mat3(im[0].xyz, im[1].xyz, im[2].xyz);
  vWorldNormal = normalize(mat3(modelMatrix) * nm * normal);

  vUv = uv;
  vMeta = aMeta;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const GLASS_FRAG = /* glsl */ `${COMMON}

uniform vec3  uGlass;       // PV glass base colour
uniform vec3  uFrame;       // aluminium module frame
uniform vec3  uSliver;      // warm light skimming the module tops
uniform float uSweep;       // 0..1 row-depth position of the sunlight sweep
uniform float uRimGain;     // scroll-driven sliver strength

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;
varying vec2 vMeta;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 toCam = cameraPosition - vWorldPos;
  float dist = length(toCam);
  vec3 V = toCam / dist;

  float facing = clamp(dot(N, V), 0.0, 1.0);
  float fres = 0.04 + 0.96 * pow(1.0 - facing, 4.2);

  // ---- PV cell grid -----------------------------------------------------
  vec2 cells = vec2(6.0, 10.0);
  vec2 cuv = vUv * cells;
  vec2 cellId = floor(cuv);
  vec2 cfr = fract(cuv);
  vec2 aa = max(fwidth(cuv) * 1.1, vec2(1e-5));
  vec2 lineD = min(cfr, 1.0 - cfr);
  float grid = min(smoothstep(0.0, aa.x, lineD.x), smoothstep(0.0, aa.y, lineD.y));
  float cellRand = hash21(cellId + vMeta.y * 37.0);
  float dust = hash21(vec2(vMeta.y * 91.3, vMeta.x * 17.7));
  float sheen = hash21(vec2(vMeta.y * 12.7 + 3.0, vMeta.x * 57.1));

  // Sun-side panels catch the dawn; the far side of the array falls into shadow.
  vec3 dirP = normalize(vWorldPos - cameraPosition);
  float towardSun = max(dot(normalize(vec3(dirP.x, 0.0, dirP.z)), normalize(vec3(uSunDir.x, 0.0, uSunDir.z))), 0.0);
  float sideLight = smoothstep(-0.15, 0.85, towardSun);

  // deep navy glass, faint cell-to-cell variation — panels stay near-silhouette
  vec3 col = uGlass * (0.55 + 0.55 * cellRand) * (0.65 + 0.55 * dust);
  col *= mix(0.22, 1.0, grid);
  col += uSkyMid * (1.0 - grid) * 0.05;

  // ---- sky reflection ---------------------------------------------------
  vec3 R = reflect(-V, N);
  vec3 skyRef = skyColorCheap(R);
  col += skyRef * (0.05 + 0.95 * fres) * 0.28;
  col += uSkyMid * (0.14 + 0.55 * fres);

  // art-directed dawn catch, concentrated on the upper third of the glass
  float warmZone = smoothstep(0.55, 1.0, vUv.y);
  vec3 dawnRefl = mix(uSkyMid * 1.1, uHorizonWarm * (0.75 + 0.85 * sheen), warmZone);
  col += dawnRefl * (0.06 + 0.20 * fres);

  // broad diagonal sheen: glass is never perfectly flat
  float diag = smoothstep(0.0, 0.6, vUv.x * 0.6 + vUv.y * 0.8 - 0.25 + 0.3 * sheen);
  col += uHorizonWarm * diag * 0.022 * sheen;

  // scattered glints where a module happens to catch the dawn
  vec3 glintDir = normalize(vec3(uSunDir.x * 0.5, 0.34, 0.86));
  float glint = pow(max(dot(R, glintDir), 0.0), 20.0);
  col += uSliver * glint * sheen * 1.6;

  // ---- aluminium module frame -------------------------------------------
  vec2 edgeDist = min(vUv, 1.0 - vUv);
  float border = 1.0 - smoothstep(0.0, 0.009, min(edgeDist.x, edgeDist.y));
  float topRail = 1.0 - smoothstep(0.0, 0.013, 1.0 - vUv.y);

  vec3 frameCol = uFrame * (0.8 + 0.4 * dust);
  frameCol += skyRef * 0.22;
  frameCol += uSliver * topRail * (0.85 + 1.05 * uRimGain) * (0.4 + 0.6 * sideLight);
  frameCol += uSliver * border * 0.10;
  col = mix(col, frameCol, border * 0.95);

  // ---- amber sliver skimming the module top edge -------------------------
  float sweep = exp(-pow((vMeta.x - uSweep) * 3.0, 2.0));
  float topGlow = exp(-pow((vUv.y - 0.975) * 48.0, 2.0));
  float upperWash = smoothstep(0.78, 1.0, vUv.y) * 0.12;
  col += uSliver * (topGlow * 2.8 + upperWash * 0.7) * (0.5 + 0.5 * sweep) * uRimGain * (0.35 + 0.65 * sideLight);

  // lower lip of the frame
  float bottomLip = exp(-pow((vUv.y - 0.012) * 110.0, 2.0));
  col += uSliver * bottomLip * 0.16 * (0.4 + 0.6 * dust);

  // ---- aerial perspective ------------------------------------------------
  // Deliberately not the sunlit horizon colour: glass stays blue-black and only
  // a thin, cool veil builds up with distance.
  vec3 hazeCol = skyColorCheap(normalize(vec3(-V.x, 0.02, -V.z)));
  hazeCol = mix(hazeCol * 0.30, uSkyMid * 0.7, 0.5);
  float fog = 1.0 - exp(-dist * uFogDensity * 0.55);
  col = mix(col, hazeCol, fog * 0.55);
  col += uSunGlow * exp(-dist * 0.008) * 0.012;

  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/* ---- Panel frame / metal structure (instanced) ------------------------- */

export const FRAME_VERT = /* glsl */ `varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  mat4 im = instanceMatrix;
  vec4 wp = modelMatrix * im * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  mat3 nm = mat3(im[0].xyz, im[1].xyz, im[2].xyz);
  vWorldNormal = normalize(mat3(modelMatrix) * nm * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const FRAME_FRAG = /* glsl */ `${COMMON}

uniform vec3  uFrame;
uniform vec3  uSliver;
uniform float uRimGain;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 toCam = cameraPosition - vWorldPos;
  float dist = length(toCam);
  vec3 V = toCam / dist;

  float f = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - f, 3.0);

  vec3 R = reflect(-V, N);
  vec3 skyRef = skyColorCheap(R);

  vec3 dirF = normalize(vWorldPos - cameraPosition);
  float frameSide = smoothstep(-0.15, 0.85, max(dot(normalize(vec3(dirF.x, 0.0, dirF.z)), normalize(vec3(uSunDir.x, 0.0, uSunDir.z))), 0.0));

  vec3 col = uFrame;
  // brushed metal picks up the whole sky, strongest at grazing angles
  col += skyRef * (0.12 + 0.85 * fres) * 0.9;
  // warm rim from the sunrise side
  col += uSliver * (0.05 + 0.34 * fres) * uRimGain;
  // weak direct sun on upward faces
  col += uSliver * max(dot(N, uSunDir), 0.0) * 0.35;

  vec3 hazeCol = skyColor(normalize(vec3(-V.x, 0.03, -V.z)), 0.0);
  float fog = 1.0 - exp(-dist * uFogDensity * 0.94);
  col = mix(col, hazeCol, fog * 0.93);

  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ---- Posts / torque tubes — silhouettes with haze ---------------------- */

export const STRUCT_VERT = /* glsl */ `varying vec3 vWorldPos;

void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const STRUCT_FRAG = /* glsl */ `${COMMON}

uniform vec3 uSkin;

varying vec3 vWorldPos;

void main() {
  vec3 toF = vWorldPos - cameraPosition;
  float dist = length(toF);
  vec3 dir = toF / dist;

  vec3 col = uSkin;
  vec3 hazeCol = skyColor(normalize(vec3(dir.x, 0.02, dir.z)), 0.0);
  float fog = 1.0 - exp(-dist * uFogDensity * 1.15);
  col = mix(col, hazeCol, fog * 0.9);
  col += uSunGlow * exp(-dist * 0.02) * 0.012;

  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ---- Utility pole silhouettes ------------------------------------------ */

export const SOLID_VERT = /* glsl */ `varying vec3 vWorldPos;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const SOLID_FRAG = /* glsl */ `${COMMON}

uniform vec3 uSkin;

varying vec3 vWorldPos;

void main() {
  vec3 toF = vWorldPos - cameraPosition;
  float dist = length(toF);
  vec3 dir = toF / dist;

  vec3 col = uSkin;
  vec3 hazeCol = skyColor(normalize(vec3(dir.x, 0.02, dir.z)), 0.0);
  col = mix(col, hazeCol, 1.0 - exp(-dist * uFogDensity * 0.8));

  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;


/* ---- Additive sun bloom billboard -------------------------------------- */

export const BLOOM_VERT = /* glsl */ `varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const BLOOM_FRAG = /* glsl */ `uniform vec3  uBloomCore;
uniform vec3  uBloomHalo;
uniform float uBloomIntensity;

varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r2 = dot(p, p);
  float core = exp(-r2 * 9.0);
  float halo = exp(-r2 * 2.4);
  vec3 col = uBloomCore * core * 0.16 + uBloomHalo * halo * 0.16;
  gl_FragColor = vec4(col * uBloomIntensity, 1.0);
}`;
