import * as THREE from "three";
import { FIELD } from "./palette";

/**
 * Builds the instanced solar field: glass modules, thin metal frames, posts and the
 * torque tubes that tie each row together. Four draw calls total, all static,
 * deterministic (seeded PRNG) so every QA screenshot is comparable.
 */

export interface PanelField {
  group: THREE.Group;
  /** Meshes are owned by the scene; exposed for stats / disposal. */
  meshes: THREE.Mesh[];
}

/** Small deterministic PRNG — keeps the field identical between reloads. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PanelTransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  normal: THREE.Vector3;
  rowNorm: number;
  seed: number;
  rowZ: number;
}

export interface PanelFieldMaterials {
  glass: THREE.Material;
  frame: THREE.Material;
  structure: THREE.Material;
}

export function buildPanelField(materials: PanelFieldMaterials): PanelField {
  const rand = mulberry32(0x51a7);
  const group = new THREE.Group();
  group.name = "solar-field";

  const pitch = FIELD.moduleW + FIELD.moduleGap;
  const tiltCos = Math.cos(FIELD.tilt);
  const tiltSin = Math.sin(FIELD.tilt);

  const panels: PanelTransform[] = [];
  const rowSpans: { z: number; x0: number; x1: number }[] = [];

  // Reference camera sits at z=14 (landscape); enough margin so portrait crops
  // never run out of field.
  const camRefZ = 14;

  for (let r = 0; r < FIELD.rows; r++) {
    const rowZ = FIELD.rowStartZ - r * FIELD.rowSpacing + (rand() - 0.5) * 0.3;
    const dist = camRefZ - rowZ;
    const halfWidth = Math.min(FIELD.maxHalfWidth, 0.8 * dist + 8);
    const columns = Math.max(4, Math.floor((halfWidth * 2) / pitch));
    // Offset each row a little so the table joints never line up like a grid.
    const x0 = -halfWidth + (rand() - 0.5) * 1.4;

    const rowNorm = FIELD.rows > 1 ? r / (FIELD.rows - 1) : 0;
    let minX = Infinity;
    let maxX = -Infinity;

    for (let c = 0; c <= columns; c++) {
      // Short table breaks break up the printed-grid look.
      if (c > 0 && c % FIELD.tableEvery === 0) continue;
      // A few modules are simply not installed yet.
      if (rand() < 0.008) continue;

      const x = x0 + c * pitch + (rand() - 0.5) * 0.02;

      const tilt = FIELD.tilt + (rand() - 0.5) * 0.022;
      const yawJitter = (rand() - 0.5) * 0.028;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-tilt, yawJitter, 0, "YXZ")
      );
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);

      const position = new THREE.Vector3(
        x,
        FIELD.baseHeight + (FIELD.moduleH / 2) * cosT,
        rowZ - (FIELD.moduleH / 2) * sinT + (rand() - 0.5) * 0.04
      );

      panels.push({
        position,
        quaternion,
        normal,
        rowNorm,
        seed: rand(),
        rowZ,
      });

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }

    rowSpans.push({ z: rowZ, x0: minX, x1: maxX });
  }

  const count = panels.length;

  // ---- glass ------------------------------------------------------------
  const glassGeom = new THREE.PlaneGeometry(FIELD.moduleW, FIELD.moduleH);
  const meta = new Float32Array(count * 2);
  panels.forEach((p, i) => {
    meta[i * 2] = p.rowNorm;
    meta[i * 2 + 1] = p.seed;
  });
  glassGeom.setAttribute("aMeta", new THREE.InstancedBufferAttribute(meta, 2));

  const glass = new THREE.InstancedMesh(glassGeom, materials.glass, count);
  glass.name = "panel-glass";
  glass.frustumCulled = false;
  glass.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  // ---- frames -----------------------------------------------------------
  const frameGeom = new THREE.BoxGeometry(
    FIELD.moduleW + 0.06,
    FIELD.moduleH + 0.06,
    0.06
  );
  const frame = new THREE.InstancedMesh(frameGeom, materials.frame, count);
  frame.name = "panel-frames";
  frame.frustumCulled = false;
  frame.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  // ---- posts ------------------------------------------------------------
  const legGeom = new THREE.BoxGeometry(1, 1, 1);
  const leg = new THREE.InstancedMesh(legGeom, materials.structure, count);
  leg.name = "panel-posts";
  leg.frustumCulled = false;
  leg.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const m = new THREE.Matrix4();
  const one = new THREE.Vector3(1, 1, 1);
  const legPos = new THREE.Vector3();
  const legScale = new THREE.Vector3(0.075, FIELD.baseHeight * 0.92, 0.075);
  const framePos = new THREE.Vector3();

  panels.forEach((p, i) => {
    m.compose(p.position, p.quaternion, one);
    glass.setMatrixAt(i, m);

    framePos.copy(p.position).addScaledVector(p.normal, -0.042);
    m.compose(framePos, p.quaternion, one);
    frame.setMatrixAt(i, m);

    legPos.set(p.position.x, FIELD.baseHeight * 0.46, p.rowZ - 0.22);
    m.compose(legPos, new THREE.Quaternion(), legScale);
    leg.setMatrixAt(i, m);
  });

  glass.instanceMatrix.needsUpdate = true;
  frame.instanceMatrix.needsUpdate = true;
  leg.instanceMatrix.needsUpdate = true;

  // ---- torque tubes (one long beam per row) -----------------------------
  const tubeGeom = new THREE.BoxGeometry(1, 1, 1);
  const tube = new THREE.InstancedMesh(tubeGeom, materials.structure, rowSpans.length);
  tube.name = "torque-tubes";
  tube.frustumCulled = false;
  tube.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const tubePos = new THREE.Vector3();
  const tubeScale = new THREE.Vector3();
  rowSpans.forEach((row, i) => {
    const width = Math.max(1, row.x1 - row.x0);
    tubePos.set((row.x0 + row.x1) / 2, FIELD.baseHeight - 0.06, row.z - 0.32);
    tubeScale.set(width, 0.12, 0.14);
    m.compose(tubePos, new THREE.Quaternion(), tubeScale);
    tube.setMatrixAt(i, m);
  });
  tube.instanceMatrix.needsUpdate = true;

  group.add(glass, frame, leg, tube);

  return { group, meshes: [glass, frame, leg, tube] };
}
