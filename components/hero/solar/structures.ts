import * as THREE from "three";

/**
 * A single rural utility pole with distribution wires — the quiet "electrical"
 * anchor on the horizon that ties the solar field to the company's trade.
 * Silhouette geometry only: two draw calls (pole group + line segments).
 */

export interface UtilityLines {
  group: THREE.Group;
  meshes: THREE.Mesh[];
  wires: THREE.LineSegments;
}

const POLE = new THREE.Vector3(34, 0, -50);
const POLE_HEIGHT = 9.2;

/** Quadratic sag between two attachment points. */
function wirePoints(
  from: THREE.Vector3,
  to: THREE.Vector3,
  sag: number,
  segments: number
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().lerpVectors(from, to, t);
    p.y -= sag * 4 * t * (1 - t);
    pts.push(p);
  }
  return pts;
}

export function buildUtilityLines(material: THREE.Material): UtilityLines {
  const group = new THREE.Group();
  group.name = "utility-line";

  // ---- pole ------------------------------------------------------------
  const poleGeom = new THREE.CylinderGeometry(0.115, 0.21, POLE_HEIGHT, 7, 1, false);
  const pole = new THREE.Mesh(poleGeom, material);
  pole.position.set(POLE.x, POLE_HEIGHT / 2, POLE.z);
  group.add(pole);

  // crossarms
  const armGeom = new THREE.BoxGeometry(0.12, 0.13, 2.9);
  const armHigh = new THREE.Mesh(armGeom, material);
  armHigh.position.set(POLE.x, POLE_HEIGHT - 0.55, POLE.z);
  const armLow = new THREE.Mesh(armGeom, material);
  armLow.position.set(POLE.x, POLE_HEIGHT - 1.65, POLE.z);
  group.add(armHigh, armLow);

  // ---- wires -----------------------------------------------------------
  const positions: number[] = [];
  const pushWire = (from: THREE.Vector3, to: THREE.Vector3, sag: number) => {
    const pts = wirePoints(from, to, sag, 14);
    for (let i = 0; i < pts.length - 1; i++) {
      positions.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
    }
  };

  const offsets = [-0.95, 0, 0.95];
  const leftEnd = new THREE.Vector3(-70, POLE_HEIGHT - 4.2, -6);
  const rightEnd = new THREE.Vector3(104, POLE_HEIGHT - 2.2, -96);

  for (let i = 0; i < offsets.length; i++) {
    const z = POLE.z + offsets[i];
    const top = new THREE.Vector3(POLE.x, POLE_HEIGHT - 0.55, z);
    const low = new THREE.Vector3(POLE.x, POLE_HEIGHT - 1.65, z);

    // to the left (crosses the dawn sky) and right (runs off frame)
    pushWire(top, leftEnd.clone().add(new THREE.Vector3(0, i * 0.18, 0)), 2.4);
    pushWire(low, rightEnd.clone().add(new THREE.Vector3(0, i * 0.14, 0)), 1.8);
  }

  const wireGeom = new THREE.BufferGeometry();
  wireGeom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x05070a,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const wires = new THREE.LineSegments(wireGeom, wireMat);
  wires.name = "wires";
  wires.frustumCulled = false;

  return { group, meshes: [pole, armHigh, armLow], wires };
}
