import * as THREE from 'three';

// ---------- materiais ----------
const M = {
  navy: new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.3, metalness: 0.25 }),
  red: new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.2, metalness: 0.3 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0x1a1b1f, roughness: 0.6, metalness: 0.15 }),
  carbon: new THREE.MeshStandardMaterial({ color: 0x0d0e11, roughness: 0.5, metalness: 0.3 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x16171a, roughness: 0.92, metalness: 0.0 }),
  alloy: new THREE.MeshStandardMaterial({ color: 0x3a3d43, roughness: 0.35, metalness: 0.6 }),
};

// ---------- helpers de lofting ----------
function roundedRing(w: number, h: number, r: number, seg = 5) {
  const pts: [number, number][] = [];
  r = Math.min(r, w / 2, h / 2);
  const hw = w / 2 - r, hh = h / 2 - r;
  const corners: [number, number, number][] = [
    [hw, hh, 0],
    [-hw, hh, Math.PI / 2],
    [-hw, -hh, Math.PI],
    [hw, -hh, -Math.PI / 2],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return pts;
}

interface LoftSection {
  z: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

// sections: [{z, y, w, h, r}] -> geometria de tubo com skinning entre secoes
function loft(sections: LoftSection[], opts: { seg?: number; capStart?: boolean; capEnd?: boolean } = {}) {
  const seg = opts.seg ?? 5;
  const rings = sections.map((s) => {
    const pts = roundedRing(s.w, s.h, s.r, seg);
    return pts.map(([x, y]): [number, number, number] => [x, y + s.y, s.z]);
  });
  const N = rings[0].length;
  const pos: number[] = [];
  const push = (p: [number, number, number]) => pos.push(p[0], p[1], p[2]);
  for (let k = 0; k < rings.length - 1; k++) {
    const a = rings[k], b = rings[k + 1];
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      push(a[i]); push(b[i]); push(b[j]);
      push(a[i]); push(b[j]); push(a[j]);
    }
  }
  const cap = (ring: [number, number, number][], flip: boolean) => {
    const c = ring.reduce<[number, number, number]>(
      (acc, p) => [acc[0] + p[0] / N, acc[1] + p[1] / N, acc[2] + p[2] / N],
      [0, 0, 0]
    );
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      if (flip) { push(c); push(ring[j]); push(ring[i]); }
      else { push(c); push(ring[i]); push(ring[j]); }
    }
  };
  if (opts.capStart !== false) cap(rings[0], true);
  if (opts.capEnd !== false) cap(rings[rings.length - 1], false);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, name: string) => {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

function mirrorX<T extends THREE.Object3D>(node: T, name: string): T {
  const c = node.clone(true) as T;
  c.scale.x *= -1;
  c.position.x *= -1;
  c.name = name;
  return c;
}

// ---------- montagem ----------
export function buildCar(): THREE.Group {
  const car = new THREE.Group();
  car.name = 'F1_2026_car';

  // Monocoque + cobertura do motor, nariz em +Z
  const body = loft([
    { z: 2.42, y: 0.30, w: 0.11, h: 0.12, r: 0.05 },
    { z: 2.20, y: 0.30, w: 0.21, h: 0.19, r: 0.08 },
    { z: 1.80, y: 0.32, w: 0.33, h: 0.26, r: 0.11 },
    { z: 1.30, y: 0.33, w: 0.42, h: 0.34, r: 0.13 },
    { z: 0.85, y: 0.35, w: 0.58, h: 0.44, r: 0.15 },
    { z: 0.35, y: 0.37, w: 0.74, h: 0.52, r: 0.17 },
    { z: -0.15, y: 0.38, w: 0.78, h: 0.54, r: 0.17 },
    { z: -0.70, y: 0.38, w: 0.68, h: 0.52, r: 0.16 },
    { z: -1.30, y: 0.36, w: 0.50, h: 0.44, r: 0.14 },
    { z: -1.90, y: 0.34, w: 0.34, h: 0.32, r: 0.12 },
    { z: -2.35, y: 0.33, w: 0.24, h: 0.24, r: 0.10 },
  ]);
  car.add(mesh(body, M.navy, 'monocoque'));

  // Airbox / entrada de ar acima do cockpit
  const airbox = loft([
    { z: -0.30, y: 0.72, w: 0.30, h: 0.30, r: 0.13 },
    { z: -0.55, y: 0.76, w: 0.36, h: 0.36, r: 0.16 },
    { z: -0.95, y: 0.72, w: 0.34, h: 0.32, r: 0.14 },
    { z: -1.50, y: 0.62, w: 0.24, h: 0.22, r: 0.10 },
    { z: -2.10, y: 0.52, w: 0.14, h: 0.14, r: 0.06 },
  ]);
  car.add(mesh(airbox, M.navy, 'airbox_engine_cover'));

  // Shark fin
  const fin = mesh(new THREE.BoxGeometry(0.025, 0.30, 1.15), M.navy, 'shark_fin');
  fin.position.set(0, 0.70, -1.55);
  fin.rotation.x = -0.13;
  car.add(fin);

  // Sidepods (um lado, espelhado)
  const podSections: LoftSection[] = [
    { z: 0.75, y: 0.36, w: 0.34, h: 0.30, r: 0.11 },
    { z: 0.45, y: 0.36, w: 0.50, h: 0.42, r: 0.14 },
    { z: 0.00, y: 0.36, w: 0.56, h: 0.46, r: 0.15 },
    { z: -0.55, y: 0.34, w: 0.50, h: 0.40, r: 0.14 },
    { z: -1.10, y: 0.32, w: 0.34, h: 0.26, r: 0.10 },
    { z: -1.55, y: 0.30, w: 0.18, h: 0.16, r: 0.07 },
  ];
  const pod = mesh(loft(podSections), M.navy, 'sidepod_left');
  pod.position.x = 0.52;
  car.add(pod);
  car.add(mirrorX(pod, 'sidepod_right'));

  // Entrada de ar do sidepod
  const inlet = mesh(new THREE.BoxGeometry(0.30, 0.24, 0.06), M.carbon, 'sidepod_inlet_left');
  inlet.position.set(0.55, 0.37, 0.79);
  car.add(inlet);
  car.add(mirrorX(inlet, 'sidepod_inlet_right'));

  // Assoalho + bordas do venturi
  const floor = mesh(new THREE.BoxGeometry(1.42, 0.04, 3.55), M.carbon, 'floor');
  floor.position.set(0, 0.10, -0.30);
  car.add(floor);
  const edge = mesh(new THREE.BoxGeometry(0.06, 0.16, 2.9), M.carbon, 'floor_edge_left');
  edge.position.set(0.71, 0.17, -0.35);
  car.add(edge);
  car.add(mirrorX(edge, 'floor_edge_right'));
  const diffuser = mesh(
    loft([
      { z: -2.05, y: 0.14, w: 1.30, h: 0.10, r: 0.03 },
      { z: -2.55, y: 0.24, w: 1.10, h: 0.30, r: 0.04 },
    ]),
    M.carbon,
    'diffuser'
  );
  car.add(diffuser);

  // Abertura do cockpit + halo
  const cockpit = mesh(new THREE.BoxGeometry(0.44, 0.05, 0.85), M.carbon, 'cockpit_opening');
  cockpit.position.set(0, 0.61, 0.18);
  car.add(cockpit);
  const headrest = mesh(
    loft([
      { z: -0.02, y: 0.66, w: 0.42, h: 0.16, r: 0.07 },
      { z: -0.26, y: 0.70, w: 0.40, h: 0.22, r: 0.09 },
    ]),
    M.red,
    'headrest'
  );
  car.add(headrest);

  const halo = new THREE.Group();
  halo.name = 'halo';
  const hoop = mesh(new THREE.TorusGeometry(0.42, 0.032, 16, 48, Math.PI), M.carbon, 'halo_hoop');
  hoop.rotation.set(Math.PI / 2, 0, 0);
  hoop.position.set(0, 0.70, 0.12);
  hoop.scale.set(1.0, 1.15, 1.0);
  halo.add(hoop);
  const strut = mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.30, 20), M.carbon, 'halo_strut');
  strut.position.set(0, 0.62, 0.60);
  strut.rotation.x = -0.35;
  halo.add(strut);
  const spine = mesh(new THREE.BoxGeometry(0.06, 0.045, 0.62), M.carbon, 'halo_spine');
  spine.position.set(0, 0.845, 0.28);
  halo.add(spine);
  car.add(halo);

  // Espelhos
  const mirror = mesh(new THREE.BoxGeometry(0.16, 0.09, 0.06), M.navy, 'mirror_left');
  mirror.position.set(0.44, 0.60, 0.42);
  car.add(mirror);
  car.add(mirrorX(mirror, 'mirror_right'));

  // ---------- asa dianteira ----------
  const fw = new THREE.Group();
  fw.name = 'front_wing';
  const wingEl = (
    w: number,
    chord: number,
    t: number,
    y: number,
    z: number,
    rot: number,
    mat: THREE.Material,
    name: string
  ) => {
    const m = mesh(new THREE.BoxGeometry(w, t, chord), mat, name);
    m.position.set(0, y, z);
    m.rotation.x = rot;
    return m;
  };
  fw.add(wingEl(1.88, 0.42, 0.025, 0.09, 2.62, 0.06, M.navy, 'front_wing_main'));
  fw.add(wingEl(1.86, 0.26, 0.022, 0.17, 2.50, 0.20, M.red, 'front_wing_flap_1'));
  fw.add(wingEl(1.82, 0.22, 0.022, 0.26, 2.42, 0.34, M.navy, 'front_wing_flap_2'));
  fw.add(wingEl(1.76, 0.18, 0.022, 0.34, 2.36, 0.46, M.yellow, 'front_wing_flap_3'));
  const fep = mesh(new THREE.BoxGeometry(0.03, 0.34, 0.52), M.navy, 'front_endplate_left');
  fep.position.set(0.94, 0.22, 2.48);
  fw.add(fep);
  fw.add(mirrorX(fep, 'front_endplate_right'));
  const pylon = mesh(new THREE.BoxGeometry(0.04, 0.16, 0.30), M.carbon, 'nose_pylon_left');
  pylon.position.set(0.13, 0.19, 2.46);
  fw.add(pylon);
  fw.add(mirrorX(pylon, 'nose_pylon_right'));
  car.add(fw);

  // ---------- asa traseira ----------
  const rw = new THREE.Group();
  rw.name = 'rear_wing';
  const rwMain = mesh(new THREE.BoxGeometry(1.02, 0.03, 0.34), M.navy, 'rear_wing_main');
  rwMain.position.set(0, 0.84, -2.42);
  rwMain.rotation.x = 0.22;
  rw.add(rwMain);
  const rwFlap = mesh(new THREE.BoxGeometry(1.00, 0.028, 0.24), M.red, 'rear_wing_flap');
  rwFlap.position.set(0, 0.98, -2.50);
  rwFlap.rotation.x = 0.42;
  rw.add(rwFlap);
  const rep = mesh(
    loft([
      { z: -2.62, y: 0.86, w: 0.03, h: 0.44, r: 0.01 },
      { z: -2.30, y: 0.80, w: 0.03, h: 0.52, r: 0.01 },
      { z: -2.10, y: 0.72, w: 0.03, h: 0.36, r: 0.01 },
    ]),
    M.navy,
    'rear_endplate_left'
  );
  rep.position.x = 0.52;
  rw.add(rep);
  rw.add(mirrorX(rep, 'rear_endplate_right'));
  const swan = mesh(new THREE.BoxGeometry(0.05, 0.34, 0.10), M.carbon, 'rear_wing_pylon');
  swan.position.set(0, 0.62, -2.36);
  rw.add(swan);
  const beam = mesh(new THREE.BoxGeometry(0.90, 0.025, 0.18), M.carbon, 'beam_wing');
  beam.position.set(0, 0.46, -2.46);
  beam.rotation.x = 0.25;
  rw.add(beam);
  car.add(rw);

  // Estrutura de impacto traseira / escape
  const exhaust = mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.20, 24), M.alloy, 'exhaust');
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(0, 0.36, -2.44);
  car.add(exhaust);

  // ---------- rodas ----------
  function wheel(x: number, z: number, radius: number, width: number, name: string) {
    const g = new THREE.Group();
    g.name = name;
    const tyre = mesh(new THREE.CylinderGeometry(radius, radius, width, 48, 1, false), M.rubber, name + '_tyre');
    tyre.rotation.z = Math.PI / 2;
    g.add(tyre);
    const rim = mesh(new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width + 0.012, 40), M.alloy, name + '_rim');
    rim.rotation.z = Math.PI / 2;
    g.add(rim);
    const band = mesh(new THREE.TorusGeometry(radius * 0.99, 0.018, 12, 48), M.yellow, name + '_sidewall_band');
    band.rotation.y = Math.PI / 2;
    band.position.x = width / 2 + 0.004;
    g.add(band);
    const cover = mesh(new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, 0.03, 32), M.navy, name + '_cover');
    cover.rotation.z = Math.PI / 2;
    cover.position.x = Math.sign(x) * (width / 2 + 0.012);
    g.add(cover);
    g.position.set(x, radius, z);
    return g;
  }
  const FR = 0.36, RR = 0.385;
  car.add(wheel(0.72, 1.72, FR, 0.30, 'wheel_front_left'));
  car.add(wheel(-0.72, 1.72, FR, 0.30, 'wheel_front_right'));
  car.add(wheel(0.74, -1.68, RR, 0.38, 'wheel_rear_left'));
  car.add(wheel(-0.74, -1.68, RR, 0.38, 'wheel_rear_right'));

  // Bracos de suspensao
  function arm(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, r: number, name: string) {
    const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
    const dir = new THREE.Vector3().subVectors(b, a);
    const m = mesh(new THREE.CylinderGeometry(r, r, dir.length(), 12), M.carbon, name);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return m;
  }
  const susp = new THREE.Group();
  susp.name = 'suspension';
  ([[1.72, FR, 0.66, 0.38], [-1.68, RR, 0.68, 0.40]] as [number, number, number, number][]).forEach(
    ([wz, wr, hubX], i) => {
      const tag = i === 0 ? 'front' : 'rear';
      [1, -1].forEach((s) => {
        susp.add(arm(s * 0.30, wr + 0.10, wz + 0.30, s * hubX, wr + 0.06, wz, 0.022, `wishbone_upper_${tag}_${s > 0 ? 'l' : 'r'}`));
        susp.add(arm(s * 0.30, 0.16, wz - 0.24, s * hubX, wr - 0.14, wz, 0.024, `wishbone_lower_${tag}_${s > 0 ? 'l' : 'r'}`));
      });
    }
  );
  car.add(susp);

  // Detalhes da pintura
  const stripe = mesh(new THREE.BoxGeometry(0.12, 0.02, 1.5), M.red, 'nose_stripe');
  stripe.position.set(0, 0.455, 1.42);
  stripe.rotation.x = -0.04;
  car.add(stripe);
  const podFlash = mesh(new THREE.BoxGeometry(0.02, 0.20, 1.1), M.yellow, 'sidepod_flash_left');
  podFlash.position.set(0.79, 0.40, 0.05);
  car.add(podFlash);
  car.add(mirrorX(podFlash, 'sidepod_flash_right'));

  return car;
}
