// 성경 삼국지 — 3D 성내 화면 (Three.js)
// 지도에서 성을 누르면 들어오는 화면. 성벽·집·궁·제단·시장·창고·농지·훈련장을 도시 수치에 맞게 짓고,
// 명령을 내리면 맡은 장수가 해당 장소로 걸어가 일하는 모습을 보여 준다.
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const GM = () => window.GAME;
  if (!window.THREE) {
    window.TOWN = { enter() { GM().toast('3D 엔진을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침하세요.'); }, exit() {}, refresh() {} };
    return;
  }
  const T = THREE;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = 24; // 성벽 반지름
  const v = (x, y, z) => new T.Vector3(x, y, z);
  const GATE_IN = v(0, 0, R - 3), GATE_OUT = v(0, 0, R + 4);
  const COAST = ['tyre', 'joppa', 'gaza', 'ashkelon', 'ashdod'];
  const PALMS = ['jericho', 'gaza', 'beersheba', 'ashkelon'];
  const SPOT = {
    agri: v(-31, 0, 2), comm: v(9.5, 0, 0.5), wall: v(-R + 3.5, 0, -6), worship: v(-11, 0, 7.8),
    relief: v(9.5, 0, -6), recruit: v(40, 0, -1.5), train: v(40, 0, -1.5), search: v(0, 0, R + 7),
  };
  const FACE = { agri: -Math.PI / 2, comm: 0, wall: -Math.PI / 2, worship: Math.PI, relief: Math.PI, recruit: 0, train: 0, search: Math.PI };
  const SEASON_LOOK = [
    { sky: '#cfe2ea', fog: '#e4dfcf', ground: '#b9a56d', crop: '#7ea84b', tuft: '#5f8f3a', sun: '#fff4dc' },
    { sky: '#dbe6e8', fog: '#ebe2cc', ground: '#caae70', crop: '#a8aa43', tuft: '#8c9a3a', sun: '#fff0cf' },
    { sky: '#ead9bd', fog: '#eadcc2', ground: '#c09e62', crop: '#d8b04a', tuft: '#c8962e', sun: '#ffe1b3' },
    { sky: '#c8d3dd', fog: '#d9dcdc', ground: '#aa9b7d', crop: '#8b7e59', tuft: '#6f6648', sun: '#e9eef5' },
  ];
  const ROBES = ['#8b6f4e', '#a5553f', '#5d6e8a', '#7d7a4a', '#c9b48f', '#6e4f6b', '#9a8260', '#4f6b5a'];
  const CAPS = ['#e8dcc0', '#c9b28a', '#9e3b33', '#d8cfb8', '#6f5a3c'];
  const SKINS = ['#c98e62', '#b97d52', '#d39b6f', '#a86f47', '#bf8659'];
  const ROLE_ROBE = { king: '#7a2e3a', priest: '#ece7da', prophet: '#6b5238', warrior: '#6a5638', elder: '#4d607a', phil: '#8a3b2a', philking: '#8a3b2a', egypt: '#efe6cc', woman: '#8e2f3a' };

  const hash = s => { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const mkRng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerpAngle = (a, b, t) => { const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; };
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  // ---------- 공용 형상·재질 ----------
  const MATS = {};
  const mat = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return MATS[k] || (MATS[k] = new T.MeshLambertMaterial(Object.assign({ color: c }, o || {}))); };
  const basic = (c, o) => { const k = 'b' + c + (o ? JSON.stringify(o) : ''); return MATS[k] || (MATS[k] = new T.MeshBasicMaterial(Object.assign({ color: c }, o || {}))); };
  const GEO = {
    box: new T.BoxGeometry(1, 1, 1), cyl: new T.CylinderGeometry(1, 1, 1, 10), cone: new T.ConeGeometry(1, 1, 8),
    cone4: new T.ConeGeometry(1, 1, 4), sph: new T.SphereGeometry(1, 12, 10), hemi: new T.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    robe: new T.CylinderGeometry(0.3, 0.55, 1.5, 8), head: new T.SphereGeometry(0.26, 10, 8), arm: new T.BoxGeometry(0.14, 0.68, 0.14),
    hand: new T.SphereGeometry(0.09, 6, 5), spear: new T.CylinderGeometry(0.03, 0.03, 2.6, 5), tip: new T.ConeGeometry(0.07, 0.28, 5),
    shield: new T.CylinderGeometry(0.4, 0.4, 0.06, 12), cloak: new T.CylinderGeometry(0.38, 0.68, 1.4, 10, 1, true, Math.PI * 0.5, Math.PI),
    torus: new T.TorusGeometry(0.22, 0.05, 6, 14), leaf: new T.BoxGeometry(0.5, 0.05, 3),
  };
  function mesh(geo, m, sx = 1, sy = 1, sz = 1, shadow = true) {
    const me = new T.Mesh(geo, m); me.scale.set(sx, sy, sz);
    me.castShadow = shadow; me.receiveShadow = true; return me;
  }

  // ---------- 상태 ----------
  let renderer, scene, camera, controls, raf = 0, last = 0;
  let cid = null, open = false, busy = false, focus = null;
  let actors = [], officerActors = new Map(), parts = {}, tweens = [], particles = [], labels = [], fire = null, farmers = [];
  let seen = {};

  // ---------- 인물 ----------
  function person(o) {
    const g = new T.Group();
    const body = mesh(GEO.robe, mat(o.robe)); body.position.y = 0.75; g.add(body);
    const belt = mesh(GEO.cyl, mat(o.sash || '#5b3f25'), 0.43, 0.08, 0.43); belt.position.y = 1.08; g.add(belt);
    const head = mesh(GEO.head, mat(o.skin)); head.position.y = 1.78; g.add(head);
    if (o.kind === 'soldier') {
      const hel = mesh(GEO.hemi, mat(o.helm || '#b08d57'), 0.3, 0.3, 0.3); hel.position.y = 1.82; g.add(hel);
    } else {
      const cap = mesh(GEO.hemi, mat(o.cap), 0.3, 0.32, 0.3); cap.position.y = 1.8; g.add(cap);
      const drape = mesh(GEO.box, mat(o.cap), 0.5, 0.55, 0.1); drape.position.set(0, 1.6, -0.2); g.add(drape);
      if (o.priest) { const mitre = mesh(GEO.cyl, mat('#f4f0e4'), 0.25, 0.35, 0.25); mitre.position.y = 2.1; g.add(mitre); }
    }
    if (o.crown) { const cr = mesh(GEO.torus, mat('#d9aa3c', { emissive: '#3a2800' })); cr.rotation.x = Math.PI / 2; cr.position.y = 2.02; g.add(cr); }
    if (o.cloak) { const ck = mesh(GEO.cloak, mat(o.cloak, { side: T.DoubleSide })); ck.position.y = 0.98; g.add(ck); }
    const mkArm = side => {
      const p = new T.Group(); p.position.set(side * 0.37, 1.45, 0);
      const a = mesh(GEO.arm, mat(o.robe)); a.position.y = -0.32; p.add(a);
      const h = mesh(GEO.hand, mat(o.skin)); h.position.y = -0.68; p.add(h);
      g.add(p); return p;
    };
    const armL = mkArm(-1), armR = mkArm(1);
    if (o.kind === 'soldier') {
      const sp = mesh(GEO.spear, mat('#6b4a2a')); sp.position.set(0, -0.62, 0.12); armR.add(sp);
      const tip = mesh(GEO.tip, mat('#c9c3b5')); tip.position.set(0, 0.62, 0.12); armR.add(tip);
      sp.rotation.x = tip.rotation.x = 0; // 팔이 앞으로 들리면 창끝이 앞을 향한다
      const sh = mesh(GEO.shield, mat(o.shield || '#8a6d3f')); sh.rotation.x = Math.PI / 2; sh.position.set(-0.08, -0.4, 0.2); armL.add(sh);
    }
    if (o.tool === 'hoe') {
      const st = mesh(GEO.cyl, mat('#6b4a2a'), 0.03, 1.4, 0.03); st.position.set(0, -0.9, 0.1); armR.add(st);
      const bl = mesh(GEO.box, mat('#8d8a80'), 0.25, 0.06, 0.3); bl.position.set(0, -1.58, 0.22); armR.add(bl);
    }
    if (o.staff) { const st = mesh(GEO.cyl, mat('#7a5a34'), 0.04, 2.2, 0.04); st.position.set(0, -0.2, 0.12); armR.add(st); }
    g.userData = { armL, armR, body };
    if (o.scale) g.scale.setScalar(o.scale);
    return g;
  }

  function sheep() {
    const g = new T.Group();
    const b = mesh(GEO.sph, mat('#eee8d8'), 0.55, 0.42, 0.8); b.position.y = 0.62; g.add(b);
    const h = mesh(GEO.sph, mat('#3a3028'), 0.2, 0.22, 0.26); h.position.set(0, 0.78, 0.75); g.add(h);
    [[-0.25, 0.4], [0.25, 0.4], [-0.25, -0.4], [0.25, -0.4]].forEach(([x, z]) => { const l = mesh(GEO.box, mat('#3a3028'), 0.1, 0.45, 0.1); l.position.set(x, 0.22, z); g.add(l); });
    g.userData = {};
    return g;
  }

  // 성벽을 뚫고 걷지 않도록 경로 계산
  function arcPts(a, b, rad) {
    const aA = Math.atan2(a.z, a.x), aB = Math.atan2(b.z, b.x);
    let d = aB - aA; d = ((d + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    const n = Math.ceil(Math.abs(d) / (Math.PI / 4)); const out = [];
    for (let i = 1; i < n; i++) { const t = aA + d * i / n; out.push(v(Math.cos(t) * rad, 0, Math.sin(t) * rad)); }
    return out;
  }
  function crosses(a, b) {
    const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz || 1;
    const t = clamp(-(a.x * dx + a.z * dz) / L, 0, 1);
    return Math.hypot(a.x + dx * t, a.z + dz * t) < R + 2;
  }
  const outPath = (a, b) => (crosses(a, b) ? arcPts(a, b, R + 8) : []);
  function route(a, b) {
    const ia = Math.hypot(a.x, a.z) < R - 0.5, ib = Math.hypot(b.x, b.z) < R - 0.5;
    if (ia && ib) return [b.clone()];
    if (ia && !ib) return [GATE_IN.clone(), GATE_OUT.clone(), ...outPath(GATE_OUT, b), b.clone()];
    if (!ia && ib) return [...outPath(a, GATE_OUT), GATE_OUT.clone(), GATE_IN.clone(), b.clone()];
    return [...outPath(a, b), b.clone()];
  }

  class Actor {
    constructor(g, o = {}) {
      this.g = g; this.path = []; this.speed = o.speed || 2; this.mode = o.mode || 'idle';
      this.t = Math.random() * 10; this.phase = Math.random() * 6; this.area = o.area; this.wait = Math.random() * 4;
      this.onArrive = null; this.intense = o.intense || 1; this.face = o.face ?? null; this.kind = o.kind || 'person';
    }
    goTo(p, cb, speed) {
      this.path = route(this.g.position, p); this.onArrive = cb || null;
      if (speed) this.speed = speed;
    }
    arms(x, z) { const u = this.g.userData; if (!u.armL) return; u.armL.rotation.x = x; u.armR.rotation.x = x; u.armL.rotation.z = -z; u.armR.rotation.z = z; }
    update(dt) {
      this.t += dt;
      const u = this.g.userData, P = this.g.position;
      if (this.path.length) {
        const tg = this.path[0], dx = tg.x - P.x, dz = tg.z - P.z, d = Math.hypot(dx, dz), step = this.speed * dt;
        if (d <= step) {
          P.x = tg.x; P.z = tg.z; this.path.shift();
          if (!this.path.length) { P.y = 0; this.arms(0, 0); const cb = this.onArrive; this.onArrive = null; if (cb) cb(); }
        } else {
          P.x += dx / d * step; P.z += dz / d * step;
          this.g.rotation.y = lerpAngle(this.g.rotation.y, Math.atan2(dx, dz), 0.25);
          const f = this.kind === 'sheep' ? 5 : 9;
          P.y = Math.abs(Math.sin(this.t * f)) * 0.08;
          if (u.armL) { const sw = Math.sin(this.t * f) * 0.6; u.armL.rotation.x = sw; u.armR.rotation.x = -sw; u.armL.rotation.z = u.armR.rotation.z = 0; }
        }
        return;
      }
      P.y = 0;
      if (u.body) u.body.rotation.x = 0;
      switch (this.mode) {
        case 'wander':
          this.arms(Math.sin(this.t * 1.3) * 0.05, 0);
          this.wait -= dt;
          if (this.wait <= 0 && this.area) { this.wait = 2 + Math.random() * 6; this.goTo(this.area()); }
          break;
        case 'drill': {
          const s = Math.sin(this.t * (2 + 3 * this.intense) + this.phase);
          u.armL.rotation.x = -0.5; u.armL.rotation.z = 0;
          u.armR.rotation.z = 0; u.armR.rotation.x = -0.4 - Math.max(0, s) * (0.4 + 0.6 * Math.min(1.5, this.intense));
          P.y = this.intense > 1 ? Math.max(0, s) * 0.08 : 0;
          break;
        }
        case 'work': {
          const s = Math.abs(Math.sin(this.t * 3 * this.intense + this.phase));
          u.armL.rotation.x = u.armR.rotation.x = -2.1 + s * 2; u.armL.rotation.z = u.armR.rotation.z = 0;
          u.body.rotation.x = 0.18 * s;
          break;
        }
        case 'pray': this.arms(-2.6 + Math.sin(this.t * 2) * 0.12, 0.35); break;
        case 'cheer': u.armR.rotation.x = -2.9 + Math.sin(this.t * 8) * 0.2; u.armL.rotation.x = 0; P.y = Math.abs(Math.sin(this.t * 5)) * 0.18; break;
        case 'point': u.armR.rotation.x = -1.5; u.armL.rotation.x = 0; break;
        default: this.arms(Math.sin(this.t * 1.5) * 0.05, 0);
      }
      if (this.face != null) this.g.rotation.y = lerpAngle(this.g.rotation.y, this.face, 0.12);
    }
  }
  function addActor(g, o) { scene.add(g); const a = new Actor(g, o); actors.push(a); return a; }
  function removeActor(a) { scene.remove(a.g); actors = actors.filter(x => x !== a); }

  // ---------- 초기화 ----------
  function init() {
    renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    $('#townStage').appendChild(renderer.domElement);
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(42, 1, 0.5, 700);
    if (T.OrbitControls) {
      controls = new T.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.08;
      controls.maxPolarAngle = 1.3; controls.minDistance = 14; controls.maxDistance = 170;
      controls.screenSpacePanning = false;
    } else {
      controls = { target: v(0, 0, 4), update() { camera.lookAt(this.target); } };
    }
    window.addEventListener('resize', resize);
  }
  function resize() {
    if (!renderer || !open) return;
    const el = $('#townStage'); const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
  }

  function clearAll() {
    while (scene.children.length) scene.remove(scene.children[0]);
    actors = []; officerActors = new Map(); parts = {}; tweens = []; particles = []; farmers = []; fire = null;
    labels.forEach(l => l.el.remove()); labels = [];
  }
  function group(name) { if (parts[name]) scene.remove(parts[name]); const g = new T.Group(); parts[name] = g; scene.add(g); return g; }

  // ---------- 건설 ----------
  function build() {
    clearAll();
    const S = GM().S, c = GM().city(cid), look = SEASON_LOOK[S.season], rng = mkRng(hash(cid));
    scene.background = new T.Color(look.sky);
    scene.fog = new T.Fog(look.fog, 120, 340);
    scene.add(new T.HemisphereLight('#f2e8d4', '#5a4a30', 0.55));
    const sun = new T.DirectionalLight(look.sun, 0.72);
    sun.position.set(-45, 75, 40); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, far: 260 });
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const ground = mesh(new T.PlaneGeometry(900, 900), mat(look.ground), 1, 1, 1, false); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    const floor = mesh(new T.CircleGeometry(R, 48), mat('#d8c49c'), 1, 1, 1, false); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; scene.add(floor);
    const road = mesh(GEO.box, mat('#cfb88e'), 4.5, 0.05, 90, false); road.position.set(0, 0.03, R + 45); scene.add(road);
    const street = mesh(GEO.box, mat('#cbb286'), 4, 0.05, R + 6, false); street.position.set(0, 0.04, (R - 6) / 2 - 4); scene.add(street);
    for (let i = 0; i < 18; i++) {
      const a = rng() * Math.PI * 2, d = 150 + rng() * 80;
      const hill = mesh(GEO.sph, mat(pick(rng, ['#a88a5a', '#b39866', '#9c8457', '#8f7c52'])), 30 + rng() * 30, 10 + rng() * 22, 30 + rng() * 30, false);
      hill.position.set(Math.cos(a) * d, -2, Math.sin(a) * d); scene.add(hill);
    }
    if (COAST.includes(cid)) {
      const sea = mesh(new T.PlaneGeometry(400, 900), mat('#3d7f9c'), 1, 1, 1, false); sea.rotation.x = -Math.PI / 2; sea.position.set(-265, 0.06, 0); scene.add(sea);
      const sand = mesh(new T.PlaneGeometry(14, 900), mat('#e2d0a4'), 1, 1, 1, false); sand.rotation.x = -Math.PI / 2; sand.position.set(-62, 0.05, 0); scene.add(sand);
    }
    buildWalls(c.def); buildPalace(c); buildAltar(c); buildGranary(); buildHouses(c, rng);
    buildMarket(c.comm); buildFields(c.agri); buildTraining(); buildSoldiers(c.soldiers); buildTrees(rng); buildLife(c, rng);
    syncOfficers();
    buildLabels();
    camera.position.set(0, 60, 86); controls.target.set(0, 0, 4); controls.update && controls.update();
    seen = { season: S.season, owner: c.owner, agri: plotCount(c.agri), comm: stallCount(c.comm), def: c.def, sold: soldierCount(c.soldiers), faith: c.faith, cid };
  }

  function wallH(def) { return 2 + def / 100 * 5; }
  function buildWalls(def, fromH) {
    const g = group('walls'); const h = wallH(def), N = 24, seg = 2 * Math.PI * R / N + 0.35;
    const stone = mat('#cdb68c'), dark = mat('#b59e74');
    for (let i = 0; i < N; i++) {
      const a = (i + 0.5) / N * Math.PI * 2;
      if (Math.abs(a - Math.PI / 2) < Math.PI / N + 0.01) continue; // 성문 자리
      const x = R * Math.cos(a), z = R * Math.sin(a), rot = -a - Math.PI / 2;
      const w = mesh(GEO.box, stone, seg, h, 1.7); w.position.set(x, h / 2, z); w.rotation.y = rot; g.add(w);
      for (let k = -1; k <= 1; k++) {
        const cr = mesh(GEO.box, dark, 0.9, 0.7, 1.8); const off = k * seg / 3;
        cr.position.set(x - off * Math.sin(a), h + 0.35, z + off * Math.cos(a)); cr.rotation.y = rot; g.add(cr);
      }
    }
    for (let i = 0; i < N; i += 3) {
      const a = i / N * Math.PI * 2; if (Math.abs(a - Math.PI / 2) < 0.4) continue;
      const t = mesh(GEO.cyl, stone, 1.8, h + 2, 1.8); t.position.set(R * Math.cos(a), (h + 2) / 2, R * Math.sin(a)); g.add(t);
      const top = mesh(GEO.cyl, dark, 2.1, 0.5, 2.1); top.position.set(R * Math.cos(a), h + 2.2, R * Math.sin(a)); g.add(top);
    }
    const ga = Math.PI / N;
    [-1, 1].forEach(sd => {
      const a = Math.PI / 2 + sd * ga;
      const t = mesh(GEO.box, stone, 3.2, h + 3, 3.2); t.position.set(R * Math.cos(a), (h + 3) / 2, R * Math.sin(a)); g.add(t);
      const door = mesh(GEO.box, mat('#6b4a2a'), 0.25, h * 0.75, 2.4); door.position.set(sd * 1.9, h * 0.375, R + 1.4); door.rotation.y = sd * 0.9; g.add(door);
    });
    const lintel = mesh(GEO.box, dark, 6.4, 1.1, 2.2); lintel.position.set(0, h + 0.6, R * Math.cos(ga)); g.add(lintel);
    if (fromH) { g.scale.y = fromH / h; tween(1.4, k => { g.scale.y = fromH / h + (1 - fromH / h) * k; }); }
  }

  function banner(g, x, y, z, color) {
    const pole = mesh(GEO.cyl, mat('#5b3f25'), 0.08, 5, 0.08); pole.position.set(x, y + 2.5, z); g.add(pole);
    const fl = mesh(GEO.box, mat(color), 1.8, 1.1, 0.05); fl.position.set(x + 0.95, y + 4.4, z); g.add(fl);
    return fl;
  }
  function buildPalace(c) {
    const g = group('palace'); const cap = c.owner && GM().fac(c.owner).capital === cid;
    const wallC = mat(cap ? '#e6d6b0' : '#dccaa0');
    const base = mesh(GEO.box, wallC, 12, 4.6, 8); base.position.set(0, 2.3, -12); g.add(base);
    const up = mesh(GEO.box, wallC, 6.5, 2.6, 5); up.position.set(0, 5.9, -12.5); g.add(up);
    const trim = mesh(GEO.box, mat(cap ? '#c9a24a' : '#b8a27a'), 12.4, 0.35, 8.4); trim.position.set(0, 4.7, -12); g.add(trim);
    for (let i = 0; i < 4; i++) { const col = mesh(GEO.cyl, mat('#efe3c6'), 0.35, 4.2, 0.35); col.position.set(-4.5 + i * 3, 2.1, -7.6); g.add(col); }
    const roof = mesh(GEO.box, wallC, 10.5, 0.4, 1.8); roof.position.set(0, 4.3, -7.4); g.add(roof);
    const steps = mesh(GEO.box, mat('#cbb690'), 7, 0.5, 1.6); steps.position.set(0, 0.25, -6.3); g.add(steps);
    const door = mesh(GEO.box, mat('#4a3320'), 1.8, 2.8, 0.2); door.position.set(0, 1.4, -7.95); g.add(door);
    if (c.owner) { banner(g, -6.6, 0, -7.6, GM().fac(c.owner).color); banner(g, 5.2, 0, -7.6, GM().fac(c.owner).color); }
  }

  function buildAltar(c) {
    const g = group('altar');
    const court = mat('#e9dfc8');
    [[-15.5, 4, 0.4, 9], [-6.5, 4, 0.4, 9], [-11, -0.5, 9, 0.4]].forEach(([x, z, w, d]) => { const f = mesh(GEO.box, court, w, 1.1, d); f.position.set(x, 0.55, z); g.add(f); });
    const tent = mesh(GEO.box, mat('#efe7d6'), 3.6, 2.6, 3.2); tent.position.set(-11, 1.3, 1.4); g.add(tent);
    const troof = mesh(GEO.cone4, mat('#7a5b3c'), 2.8, 1.4, 2.6); troof.position.set(-11, 3.3, 1.4); troof.rotation.y = Math.PI / 4; g.add(troof);
    const al = mesh(GEO.box, mat('#a99a84'), 2.4, 1.3, 2.4); al.position.set(-11, 0.65, 5.6); g.add(al);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => { const h = mesh(GEO.cone, mat('#8e806c'), 0.18, 0.4, 0.18); h.position.set(-11 + x * 1.05, 1.5, 5.6 + z * 1.05); g.add(h); });
    const laver = mesh(GEO.cyl, mat('#b08d57'), 0.8, 0.5, 0.8); laver.position.set(-8, 0.5, 5.6); g.add(laver);
    fire = new T.Group(); fire.position.set(-11, 1.3, 5.6);
    [['#ff6a1a', 0.8, 1.6], ['#ffae2e', 0.55, 1.2], ['#fff0a0', 0.3, 0.8]].forEach(([col, r, h]) => {
      const f = new T.Mesh(GEO.cone, basic(col, { transparent: true, opacity: 0.9 })); f.scale.set(r, h, r); f.position.y = h / 2; fire.add(f);
    });
    const light = new T.PointLight('#ff9a3c', 1.1, 16); light.position.y = 1.5; fire.add(light);
    fire.userData.base = 0.45 + c.faith / 90;
    fire.scale.setScalar(fire.userData.base);
    g.add(fire);
  }

  function buildGranary() {
    const g = group('granary');
    [6, 9.5, 13].forEach(x => {
      const b = mesh(GEO.cyl, mat('#cdb487'), 1.5, 2.2, 1.5); b.position.set(x, 1.1, -12); g.add(b);
      const d = mesh(GEO.hemi, mat('#c2a877'), 1.5, 1.4, 1.5); d.position.set(x, 2.2, -12); g.add(d);
    });
    for (let i = 0; i < 4; i++) { const s = mesh(GEO.sph, mat('#b89a62'), 0.45, 0.4, 0.35); s.position.set(7 + i * 1.5, 0.35, -9.4); g.add(s); }
  }

  function inZone(x, z) {
    return (Math.abs(x) < 8.5 && z > -17.5 && z < -5) || Math.hypot(x + 11, z - 3) < 6.8 ||
      (x > 3 && x < 18 && z > -1.5 && z < 11) || (x > 3.5 && x < 16 && z > -15 && z < -7.5) || (Math.abs(x) < 3.6 && z > -5);
  }
  function buildHouses(c, rng) {
    const g = group('houses'); const n = clamp(Math.round(c.pop / 1300), 8, 36); const placed = [];
    const walls = ['#dcc6a2', '#cfb58b', '#e4d4b2', '#c6a77c', '#d6bf96'];
    for (let tries = 0; placed.length < n && tries < 600; tries++) {
      const a = rng() * Math.PI * 2, r = 5 + rng() * (R - 9), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (inZone(x, z) || placed.some(p => Math.hypot(p[0] - x, p[1] - z) < 4.4)) continue;
      placed.push([x, z]);
      const w = 2.8 + rng() * 1.6, h = 2 + rng() * 1.3, d = 2.8 + rng() * 1.6, col = pick(rng, walls);
      const hg = new T.Group(); hg.position.set(x, 0, z); hg.rotation.y = Math.round(rng() * 4) * Math.PI / 2 + (rng() - 0.5) * 0.2;
      const b = mesh(GEO.box, mat(col), w, h, d); b.position.y = h / 2; hg.add(b);
      const roof = mesh(GEO.box, mat('#b89f76'), w + 0.3, 0.25, d + 0.3); roof.position.y = h + 0.12; hg.add(roof);
      const door = mesh(GEO.box, mat('#4a3320'), 0.8, 1.4, 0.1); door.position.set(0, 0.7, d / 2 + 0.03); hg.add(door);
      if (rng() < 0.35) { const u = mesh(GEO.box, mat(col), w * 0.45, 1.3, d * 0.45); u.position.set(w * 0.2, h + 0.9, -d * 0.2); hg.add(u); }
      if (rng() < 0.3) { const aw = mesh(GEO.box, mat(pick(rng, ['#9e3b33', '#3f5f8a', '#c9a24a'])), w * 0.6, 0.08, 1); aw.position.set(0, h * 0.75, d / 2 + 0.5); hg.add(aw); }
      g.add(hg);
    }
  }

  const stallCount = comm => clamp(2 + Math.round(comm / 12), 2, 10);
  function buildMarket(comm, popNew) {
    const g = group('market'); const n = stallCount(comm);
    const awn = ['#b0413e', '#3f5f8a', '#c9a24a', '#4f7a4a', '#8a4f7a', '#d0703c'];
    for (let i = 0; i < n; i++) {
      const row = i % 2, col = Math.floor(i / 2), x = 5.5 + col * 2.9, z = 1.6 + row * 6.2;
      const s = new T.Group(); s.position.set(x, 0, z);
      [[-1, -0.7], [1, -0.7], [-1, 0.7], [1, 0.7]].forEach(([px, pz]) => { const p = mesh(GEO.cyl, mat('#6b4a2a'), 0.06, 2, 0.06); p.position.set(px, 1, pz); s.add(p); });
      const a = mesh(GEO.box, mat(awn[i % awn.length]), 2.4, 0.1, 1.8); a.position.y = 2.05; a.rotation.z = 0.08; s.add(a);
      const tb = mesh(GEO.box, mat('#8a6a44'), 2, 0.8, 1.1); tb.position.y = 0.4; s.add(tb);
      for (let k = 0; k < 3; k++) { const j = mesh(GEO.sph, mat(['#b8733c', '#d9b04a', '#7c9a3a', '#9e3b33'][(i + k) % 4]), 0.22, 0.25, 0.22); j.position.set(-0.6 + k * 0.6, 1.02, 0); s.add(j); }
      if (popNew && i === n - 1) { s.scale.setScalar(0.01); tween(0.8, k => s.scale.setScalar(Math.max(0.01, k))); }
      g.add(s);
    }
  }

  const plotCount = agri => clamp(Math.round(agri / 7), 2, 14);
  function plotPos(i) { const col = i % 2, row = Math.floor(i / 2); return v(-44 + col * 9.4, 0, -27 + row * 9); }
  function buildFields(agri, popNew) {
    const g = group('fields'); const n = plotCount(agri), look = SEASON_LOOK[GM().S.season];
    for (let i = 0; i < n; i++) {
      const p = plotPos(i), pg = new T.Group(); pg.position.copy(p);
      const plot = mesh(GEO.box, mat(look.crop), 8.4, 0.22, 7.6, false); plot.position.y = 0.11; pg.add(plot);
      for (let k = -1; k <= 1; k++) { const f = mesh(GEO.box, mat('#7b6440'), 8.2, 0.06, 0.25, false); f.position.set(0, 0.25, k * 2.4); pg.add(f); }
      for (let k = 0; k < 6; k++) { const t = mesh(GEO.cone, mat(look.tuft), 0.35, 0.8, 0.35); t.position.set(-3 + (k % 3) * 3, 0.6, -1.2 + Math.floor(k / 3) * 2.4); pg.add(t); }
      if (popNew && i === n - 1) { pg.scale.set(1, 0.01, 1); tween(1, k => pg.scale.set(1, Math.max(0.01, k), 1)); }
      g.add(pg);
    }
    const wall = mesh(GEO.box, mat('#b9a17a'), 0.5, 0.8, 66, false); wall.position.set(-48.8, 0.4, 3); g.add(wall);
  }

  function buildTraining() {
    const g = group('training');
    const yard = mesh(GEO.box, mat('#a98a5d'), 21, 0.1, 24, false); yard.position.set(40, 0.05, 10); g.add(yard);
    for (let i = 0; i <= 10; i++) {
      [[29.5, -2 + i * 2.4], [50.5, -2 + i * 2.4]].forEach(([x, z]) => { const p = mesh(GEO.cyl, mat('#6b4a2a'), 0.1, 1.2, 0.1); p.position.set(x, 0.6, z); g.add(p); });
    }
    const rack = mesh(GEO.box, mat('#6b4a2a'), 3, 1.6, 0.3); rack.position.set(33, 0.8, -1.5); g.add(rack);
    const stand = mesh(GEO.box, mat('#8a6a44'), 3, 0.6, 2); stand.position.set(40, 0.3, -2.4); g.add(stand);
    const owner = GM().city(cid).owner;
    if (owner) banner(g, 47, 0, -2, GM().fac(owner).color);
  }

  const soldierCount = n => clamp(Math.round(n / 280), 0, 48);
  function soldierLook() {
    const owner = GM().city(cid).owner, col = owner ? GM().fac(owner).color : '#8a6d3f';
    const egypt = owner === 'egypt', phil = owner === 'philistia';
    return { robe: egypt ? '#efe6cc' : phil ? '#8a3b2a' : '#7a6446', skin: pick(Math.random, SKINS), kind: 'soldier', shield: col, sash: col, helm: phil ? '#d8cfb8' : egypt ? '#2f4f8a' : '#b08d57' };
  }
  function slotPos(i) { const col = i % 8, row = Math.floor(i / 8); return v(40 + (col - 3.5) * 2, 0, 3.5 + row * 2.1); }
  function buildSoldiers(n) {
    actors.filter(a => a.kind === 'soldier').forEach(removeActor);
    const k = soldierCount(n);
    for (let i = 0; i < k; i++) {
      const g = person(soldierLook()); g.position.copy(slotPos(i)); g.rotation.y = Math.PI;
      addActor(g, { mode: 'drill', intense: 0.35, kind: 'soldier', face: Math.PI });
    }
  }

  function palm(g, x, z, r) {
    const h = 6 + r() * 3, tilt = (r() - 0.5) * 0.25;
    const tr = mesh(GEO.cyl, mat('#8a6d48'), 0.28, h, 0.34); tr.position.set(x, h / 2, z); tr.rotation.z = tilt; g.add(tr);
    const top = v(x - Math.sin(tilt) * h / 2 * 2, h, z);
    for (let i = 0; i < 8; i++) {
      const lf = mesh(GEO.leaf, mat(i % 2 ? '#5f8a3a' : '#6f9a45'), 1, 1, 1);
      const a = i / 8 * Math.PI * 2; lf.position.set(top.x + Math.cos(a) * 1.3, top.y - 0.3, top.z + Math.sin(a) * 1.3);
      lf.rotation.y = -a + Math.PI / 2; lf.rotation.x = 0.45; g.add(lf);
    }
  }
  function olive(g, x, z, r) {
    const tr = mesh(GEO.cyl, mat('#6e5a40'), 0.3, 1.8, 0.35); tr.position.set(x, 0.9, z); g.add(tr);
    for (let i = 0; i < 3; i++) { const c = mesh(GEO.sph, mat(i ? '#8a9a6a' : '#7b8c5c'), 1.3 + r() * 0.5, 1 + r() * 0.3, 1.3 + r() * 0.5); c.position.set(x + (r() - 0.5) * 1.4, 2.4 + r() * 0.6, z + (r() - 0.5) * 1.4); g.add(c); }
  }
  function freeGround(x, z) {
    const d = Math.hypot(x, z);
    return d > R + 5 && !(x < -26 && x > -52 && Math.abs(z) < 36) && !(x > 27 && x < 54 && z > -6 && z < 25) && !(Math.abs(x) < 5 && z > 0) && !(z < -34 && z > -56 && x > -12 && x < 18) && !(COAST.includes(cid) && x < -56);
  }
  function buildTrees(rng) {
    const g = group('trees');
    const palms = PALMS.includes(cid) ? 34 : 14, olives = PALMS.includes(cid) ? 8 : 18;
    let placed = 0, tries = 0;
    while (placed < palms + olives && tries++ < 900) {
      const a = rng() * Math.PI * 2, d = R + 6 + rng() * 70, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (!freeGround(x, z)) continue;
      (placed < palms ? palm : olive)(g, x, z, rng); placed++;
    }
    for (let i = 0; i < 4; i++) { const a = rng() * Math.PI * 2, r = 9 + rng() * 9, x = Math.cos(a) * r, z = Math.sin(a) * r; if (!inZone(x, z)) palm(g, x, z, rng); }
    for (let i = 0; i < 24; i++) {
      const a = rng() * Math.PI * 2, d = R + 10 + rng() * 80, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (!freeGround(x, z)) continue;
      const rk = mesh(GEO.sph, mat('#a0957e'), 0.8 + rng() * 1.2, 0.5 + rng() * 0.6, 0.8 + rng() * 1.2); rk.position.set(x, 0.2, z); g.add(rk);
    }
  }

  function villagerLook(r) { return { robe: pick(r, ROBES), cap: pick(r, CAPS), skin: pick(r, SKINS) }; }
  const inTown = () => { const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * (R - 8); const p = v(Math.cos(a) * r, 0, Math.sin(a) * r); return inZone(p.x, p.z) && Math.random() < 0.6 ? v(Math.random() * 4 - 2, 0, 6 + Math.random() * 12) : p; };
  const outTown = () => Math.random() < 0.5 ? v(-3 + Math.random() * 6, 0, R + 8 + Math.random() * 30) : v(-30 - Math.random() * 16, 0, -24 + Math.random() * 50);
  function buildLife(c, rng) {
    const n = clamp(Math.round(c.pop / 1700), 6, 20);
    for (let i = 0; i < n; i++) {
      const g = person(villagerLook(rng)); const out = i % 4 === 0;
      g.position.copy(out ? outTown() : inTown());
      addActor(g, { mode: 'wander', speed: 1.6 + rng() * 0.6, area: out ? () => (Math.random() < 0.7 ? outTown() : inTown()) : () => (Math.random() < 0.85 ? inTown() : outTown()), kind: 'villager' });
    }
    const nf = Math.min(8, plotCount(c.agri));
    for (let i = 0; i < nf; i++) {
      const p = plotPos(i); const g = person(Object.assign(villagerLook(rng), { tool: 'hoe' }));
      g.position.set(p.x + (rng() - 0.5) * 5, 0, p.z + (rng() - 0.5) * 4);
      farmers.push(addActor(g, { mode: 'work', intense: 0.7, kind: 'farmer', face: rng() * 6 }));
    }
    const pasture = () => v(-8 + Math.random() * 22, 0, -52 + Math.random() * 14);
    for (let i = 0; i < 10; i++) { const g = sheep(); g.position.copy(pasture()); addActor(g, { mode: 'wander', speed: 0.7, area: pasture, kind: 'sheep' }); }
    const sh = person(Object.assign(villagerLook(rng), { staff: true })); sh.position.set(2, 0, -40);
    addActor(sh, { mode: 'wander', speed: 1, area: pasture, kind: 'villager' });
  }

  // ---------- 장수 ----------
  function officerLook(o) {
    const S = GM().S, ruler = !!(o.fac && S.facs[o.fac] && S.facs[o.fac].ruler === o.id);
    const role = window.PORTRAIT ? PORTRAIT.roleOf(o, ruler) : 'elder';
    const r = mkRng(hash(o.name));
    return {
      robe: ROLE_ROBE[role] || '#4d607a', skin: pick(r, SKINS), cap: role === 'priest' ? '#f4f0e4' : role === 'prophet' ? '#5d4630' : role === 'woman' ? '#b23b3e' : '#e2d6bc',
      cloak: o.fac ? GM().fac(o.fac).color : '#777', crown: ruler, priest: role === 'priest', staff: role === 'prophet', scale: 1.25,
      kind: role === 'warrior' || role === 'phil' ? 'soldier' : 'officer', shield: o.fac ? GM().fac(o.fac).color : '#8a6d3f',
      helm: role === 'phil' ? '#d8cfb8' : '#b08d57',
    };
  }
  function homeSlot(i) { return v(-7 + (i % 5) * 3.5, 0, -4 + Math.floor(i / 5) * 2.8); }
  function syncOfficers(spawnFrom) {
    const c = GM().city(cid); const list = c.owner ? GM().offsIn(cid, c.owner) : [];
    const ids = new Set(list.map(o => o.id));
    for (const [id, a] of officerActors) if (!ids.has(id)) { removeActor(a); officerActors.delete(id); labels.filter(l => l.actor === a).forEach(l => l.el.remove()); labels = labels.filter(l => l.actor !== a); }
    list.forEach((o, i) => {
      let a = officerActors.get(o.id);
      if (!a) {
        const g = person(officerLook(o));
        const home = homeSlot(i);
        if (spawnFrom && spawnFrom.id === o.id) { g.position.copy(spawnFrom.pos); }
        else g.position.copy(home);
        a = addActor(g, { mode: 'idle', speed: 3, kind: 'officer', face: 0 });
        a.home = home; a.o = o;
        officerActors.set(o.id, a);
        const el = document.createElement('div'); el.className = 'tl-off';
        el.innerHTML = `${GM().S.facs[o.fac] && GM().fac(o.fac).ruler === o.id ? '<i>王</i>' : ''}${GM().esc(o.name)}`;
        $('#townLabels').appendChild(el);
        labels.push({ el, actor: a, h: 3.1 + (officerActors.size % 2) * 0.8 });
      }
      a.home = homeSlot(i);
    });
    labels.forEach(l => { if (l.actor && l.actor.o) l.el.classList.toggle('done', !!l.actor.o.done); });
  }

  // ---------- 건물 라벨 (눌러서 명령) ----------
  function buildLabels() {
    const c = GM().city(cid), mine = c.owner === GM().S.player;
    const defs = [
      ['농지', '개간', 'agri', v(-39.5, 3.2, -31)], ['시장', '상업', 'comm', v(11, 4, 4.7)], ['성벽', '보수', 'wall', v(-R, wallH(c.def) + 2.2, -8)],
      ['제단', '제사', 'worship', v(-11, 5.2, 3)], ['곡식 창고', '구휼', 'relief', v(9.5, 5, -12)], ['훈련장', '훈련', 'train', v(40, 3.5, 23)],
      ['궁', '인재', 'search', v(0, 9.5, -12)], ['성문', '출진', 'attack', v(0, wallH(c.def) + 4.5, R + 1)],
    ];
    defs.forEach(([name, verb, cmd, pos]) => {
      const el = document.createElement(mine ? 'button' : 'div');
      el.className = 'tl-bld' + (mine ? ' act' : '');
      el.innerHTML = `<b>${name}</b>${mine ? `<span>${verb}</span>` : ''}`;
      if (mine) el.addEventListener('click', () => runCmd(cmd));
      $('#townLabels').appendChild(el);
      labels.push({ el, pos });
    });
  }
  const tmp = new T.Vector3();
  function updateLabels() {
    const el = $('#townStage'), w = el.clientWidth, h = el.clientHeight;
    labels.forEach(l => {
      if (l.actor) tmp.copy(l.actor.g.position).setY(l.actor.g.position.y + l.h); else tmp.copy(l.pos);
      tmp.project(camera);
      const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
      l.el.style.visibility = vis ? 'visible' : 'hidden';
      if (vis) l.el.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
    });
  }
  function floatText(pos, text, cls = '') {
    const el = document.createElement('div'); el.className = 'tl-float ' + cls; el.textContent = text;
    $('#townLabels').appendChild(el);
    const l = { el, pos: pos.clone().setY(4.5) }; labels.push(l);
    tween(reduce ? 0.8 : 2.4, k => { l.pos.y = 4.5 + k * 3; el.style.opacity = String(k < 0.75 ? 1 : 1 - (k - 0.75) * 4); }, () => { el.remove(); labels = labels.filter(x => x !== l); });
  }

  // ---------- 트윈·입자 ----------
  function tween(dur, fn, done) { tweens.push({ dur: reduce ? Math.min(dur, 0.2) : dur, t: 0, fn, done }); }
  function wait(sec, done) { tweens.push({ dur: sec, t: 0, fn: () => {}, done }); }
  function burst(kind, pos, n) {
    for (let i = 0; i < n; i++) {
      let m, vel, grav = -9, life = 1.2, spin = 0;
      if (kind === 'coin') { m = new T.Mesh(GEO.cyl, basic('#f0c24a')); m.scale.set(0.18, 0.04, 0.18); vel = v((Math.random() - 0.5) * 3, 5 + Math.random() * 3, (Math.random() - 0.5) * 3); spin = 10; }
      else if (kind === 'brick') { m = new T.Mesh(GEO.box, mat('#b08a5a')); m.scale.set(0.5, 0.25, 0.3); vel = v((Math.random() - 0.5) * 2, 4 + Math.random() * 3, (Math.random() - 0.5) * 2); spin = 5; }
      else if (kind === 'dust') { m = new T.Mesh(GEO.sph, basic('#d9c49a', { transparent: true, opacity: 0.6 })); m.scale.setScalar(0.3); vel = v((Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2); grav = 0; life = 1; }
      else if (kind === 'spark') { m = new T.Mesh(GEO.sph, basic(Math.random() < 0.5 ? '#ffd36a' : '#ff8a2a')); m.scale.setScalar(0.12); vel = v((Math.random() - 0.5) * 2, 4 + Math.random() * 5, (Math.random() - 0.5) * 2); grav = -1; life = 1.6; }
      else if (kind === 'sack') { m = new T.Mesh(GEO.sph, mat('#c9a870')); m.scale.set(0.35, 0.3, 0.3); vel = v((Math.random() - 0.5) * 4, 5, (Math.random() - 0.5) * 4); }
      m.position.copy(pos).add(v((Math.random() - 0.5) * 2, 0.5, (Math.random() - 0.5) * 2));
      scene.add(m); particles.push({ m, vel, grav, life, max: life, spin, kind });
    }
  }
  function lightColumn(pos) {
    const m = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 40, 18, 1, true), new T.MeshBasicMaterial({ color: '#fff1c4', transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    m.position.copy(pos).setY(20); scene.add(m);
    tween(2.6, k => { m.material.opacity = Math.sin(k * Math.PI) * 0.5; m.scale.x = m.scale.z = 1 + k * 0.6; }, () => scene.remove(m));
  }

  // ---------- 루프 ----------
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    actors.forEach(a => a.update(dt));
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.dur); tw.fn(ease(k), tw.t);
      if (k >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.life -= dt; p.vel.y += p.grav * dt;
      p.m.position.addScaledVector(p.vel, dt); p.m.rotation.x += p.spin * dt; p.m.rotation.y += p.spin * dt;
      if (p.kind === 'dust') p.m.scale.multiplyScalar(1 + dt * 1.5);
      if (p.life <= 0 || p.m.position.y < -0.5) { scene.remove(p.m); particles.splice(i, 1); }
    }
    if (fire) { const b = fire.userData.base * (fire.userData.boost || 1); fire.scale.set(b * (1 + Math.sin(ts / 90) * 0.05), b * (1 + Math.sin(ts / 70) * 0.12), b * (1 + Math.cos(ts / 90) * 0.05)); }
    if (focus) { const d = focus.clone().sub(controls.target); d.y = 0; d.multiplyScalar(Math.min(1, dt * 2.2)); controls.target.add(d); camera.position.add(d); }
    controls.update();
    renderer.render(scene, camera);
    updateLabels();
  }

  // ---------- 명령 연출 ----------
  function pathLen(a, pts) { let L = 0, p = a; pts.forEach(q => { L += Math.hypot(q.x - p.x, q.z - p.z); p = q; }); return L; }
  function onCommand(o, cityId, key, r) {
    if (!open || cityId !== cid) return false;
    act(o, key, r); return true;
  }
  function act(o, key, r) {
    setBusy(true);
    let a = officerActors.get(o.id);
    if (!a) { syncOfficers(); a = officerActors.get(o.id); }
    const spot = SPOT[key].clone();
    focus = spot.clone();
    const pts = route(a.g.position, spot);
    a.mode = 'idle'; a.face = null;
    a.goTo(spot, () => {
      a.face = FACE[key];
      perform(key, a, r, () => {
        floatText(spot, `${o.name} · ${r.msg}`, 'good');
        refreshParts(key, r);
        a.mode = 'idle'; a.face = 0;
        wait(reduce ? 0.05 : 0.9, () => {
          a.goTo(a.home, () => { a.face = 0; }, 8);
          setBusy(false); focus = null; GM().render();
        });
      });
    }, reduce ? 999 : Math.max(6, pathLen(a.g.position, pts) / 3.2));
  }

  function perform(key, a, r, done) {
    const D = reduce ? 0.3 : 2.8;
    const every = (sec, fn) => { let next = 0; tweens.push({ dur: D, t: 0, fn: (k, t) => { while (t >= next) { next += sec; fn(); } } }); };
    const c = GM().city(cid);
    switch (key) {
      case 'agri':
        a.mode = 'work'; a.intense = 1.6; farmers.forEach(f => { f.intense = 2.2; });
        every(0.25, () => { const p = plotPos(Math.floor(Math.random() * plotCount(c.agri))); burst('dust', p, 2); });
        wait(D, () => { farmers.forEach(f => { f.intense = 0.7; }); done(); }); break;
      case 'comm':
        a.mode = 'point';
        every(0.3, () => burst('coin', v(6 + Math.random() * 10, 1, 1 + Math.random() * 7), 3));
        wait(D, done); break;
      case 'wall':
        a.mode = 'work'; a.intense = 1.4;
        every(0.3, () => burst('brick', v(-R + 1.2, wallH(c.def), -6 + (Math.random() - 0.5) * 8), 2));
        wait(D, done); break;
      case 'worship': {
        a.mode = 'pray';
        const near = actors.filter(x => x.kind === 'villager' && x.g.position.distanceTo(SPOT.worship) < 18 && !x.path.length);
        near.forEach(x => { x.prevMode = x.mode; x.mode = 'pray'; x.face = Math.atan2(-11 - x.g.position.x, 5.6 - x.g.position.z); });
        fire.userData.boost = 1; tween(D, k => { fire.userData.boost = 1 + Math.sin(k * Math.PI) * 1.4; });
        lightColumn(v(-11, 0, 5.6));
        every(0.15, () => burst('spark', v(-11, 2, 5.6), 3));
        wait(D, () => { near.forEach(x => { x.mode = x.prevMode || 'wander'; x.face = null; }); done(); }); break;
      }
      case 'relief': {
        a.mode = 'point';
        const vs = actors.filter(x => x.kind === 'villager').slice(0, 8);
        vs.forEach((x, i) => { x.prevMode = x.mode; x.mode = 'idle'; x.goTo(v(6 + (i % 4) * 2, 0, -3.5 + Math.floor(i / 4) * 1.8), () => { x.face = Math.PI; x.mode = 'cheer'; }, 7); });
        every(0.35, () => burst('sack', v(9.5, 1, -10), 2));
        wait(D + 1, () => { vs.forEach(x => { x.mode = 'wander'; x.face = null; x.wait = Math.random() * 2; }); done(); }); break;
      }
      case 'recruit': {
        a.mode = 'cheer';
        const have = actors.filter(x => x.kind === 'soldier').length, want = soldierCount(c.soldiers);
        const add = Math.max(2, Math.min(10, want - have));
        let arrived = 0;
        for (let i = 0; i < add; i++) {
          const g = person(villagerLook(Math.random)); g.position.set((Math.random() - 0.5) * 3, 0, R + 10 + i * 1.5);
          const x = addActor(g, { mode: 'idle', kind: 'recruit' });
          x.goTo(slotPos(Math.min(47, have + i)), () => { arrived++; }, 9);
        }
        wait(D + 2.4, () => { actors.filter(x => x.kind === 'recruit').forEach(removeActor); done(); }); break;
      }
      case 'train': {
        a.mode = 'cheer';
        actors.filter(x => x.kind === 'soldier').forEach(x => { x.t = 0; x.phase = 0; x.intense = 2.6; });
        wait(D + 0.6, () => { actors.filter(x => x.kind === 'soldier').forEach(x => { x.intense = 0.35; x.phase = Math.random() * 6; }); done(); }); break;
      }
      case 'search': {
        a.mode = 'point';
        if (r.found) {
          const o = GM().offById(r.found); const g = person(officerLook(o)); g.position.set(0, 0, R + 50);
          const x = addActor(g, { mode: 'idle', kind: 'guest' });
          x.goTo(v(0, 0, R + 9), () => { x.face = Math.PI; x.mode = 'cheer'; }, 12);
          wait(reduce ? 0.4 : 4.4, () => { removeActor(x); syncOfficers({ id: o.id, pos: v(0, 0, R + 9) }); const na = officerActors.get(o.id); if (na) na.goTo(na.home, () => { na.face = 0; }, 8); done(); });
        } else { floatText(v(0, 0, R + 12), '…', ''); wait(D, done); }
        break;
      }
      default: wait(D, done);
    }
  }

  function refreshParts(key) {
    const c = GM().city(cid);
    if (key === 'agri' && plotCount(c.agri) !== seen.agri) { buildFields(c.agri, true); seen.agri = plotCount(c.agri); }
    if (key === 'comm' && stallCount(c.comm) !== seen.comm) { buildMarket(c.comm, true); seen.comm = stallCount(c.comm); }
    if (key === 'wall' && c.def !== seen.def) { buildWalls(c.def, wallH(seen.def)); seen.def = c.def; }
    if (key === 'worship' && fire) { fire.userData.base = 0.45 + c.faith / 90; seen.faith = c.faith; }
    if (key === 'recruit') { buildSoldiers(c.soldiers); seen.sold = soldierCount(c.soldiers); }
  }

  // ---------- 화면 (HUD) ----------
  const ORDER = ['agri', 'comm', 'wall', 'worship', 'relief', 'recruit', 'train', 'search'];
  function renderHud() {
    const Gm = GM(), S = Gm.S, c = Gm.city(cid), ci = Gm.CITY_INFO[cid], P = S.player, F = Gm.fac(P);
    const owner = c.owner, mine = owner === P;
    const oc = owner ? Gm.fac(owner).color : '#7c7667';
    $('#townTitle').innerHTML = `<h2>${ci.name}</h2><span class="chip fac" style="--fc:${oc}"><i></i>${owner ? Gm.esc(Gm.fac(owner).name) : '주인 없음'}${owner && Gm.fac(owner).capital === cid ? ' · 도읍' : ''}</span>`;
    $('#townRes').innerHTML = `<span class="stat"><b>${Gm.yearLabel()}</b></span><span class="stat"><b>금</b>${Gm.fmt(F.gold)}</span><span class="stat"><b>식량</b>${Gm.fmt(F.food)}</span>`;
    const st = [['병력', Gm.fmt(c.soldiers)], ['인구', Gm.fmt(c.pop)], ['농업', c.agri], ['상업', c.comm], ['성벽', c.def], ['훈련', c.train], ['민심', c.loy], ['신앙', c.faith]];
    $('#townStats').innerHTML = st.map(([k, val]) => `<span><b>${k}</b>${val}</span>`).join('');
    const offs = owner ? Gm.offsIn(cid, owner) : [];
    let h = `<div class="t-offs">${offs.length ? offs.map(o => `<button class="t-card${o.done && mine ? ' done' : ''}" data-bio="${o.id}"><span class="thumb">${Gm.portraitOf(o)}</span><b>${Gm.esc(o.name)}</b><small>${mine ? (o.done ? '완료' : '대기') : '무' + o.war + ' 지' + o.int}</small></button>`).join('') : '<p class="mute">머무는 장수가 없다.</p>'}</div>`;
    if (mine) {
      h += `<div class="t-cmds">${ORDER.map(k => `<button class="cmd" data-tcmd="${k}"><b>${Gm.CMDS[k].label}</b><small>${Gm.CMDS[k].hint}</small></button>`).join('')}
        <button class="cmd" data-tcmd="move"><b>이동</b><small>장수·병력 옮기기</small></button>
        <button class="cmd war" data-tcmd="attack"><b>출진</b><small>지도에서 공격</small></button>
        <button class="cmd" data-tcmd="diplo"><b>외교</b><small>친선·동맹</small></button></div>`;
    } else {
      h += `<p class="hint">${owner ? '다른 세력의 성이다. 성벽과 병력을 살펴 두자.' : '주인 없는 성읍이다. 맞닿은 내 성에서 출진하면 차지할 수 있다.'}</p>`;
    }
    $('#townDock').innerHTML = h;
    $('#townDock').classList.toggle('busy', busy);
  }
  function setBusy(b) { busy = b; const d = $('#townDock'); if (d) d.classList.toggle('busy', b); document.querySelectorAll('.tl-bld.act').forEach(e => { e.disabled = b; }); }

  function runCmd(key) {
    if (busy) return;
    if (key === 'attack' || key === 'move' || key === 'diplo') { exit(); GM().sel = cid; GM().onCmd(key); return; }
    GM().sel = cid; GM().onCmd(key);
  }

  // ---------- 진입·퇴장 ----------
  function enter(id) {
    if (!renderer) init();
    cid = id; open = true; busy = false; focus = null;
    $('#town').hidden = false;
    document.body.classList.add('in-town');
    resize();
    build();
    renderHud();
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function exit(silent) {
    if (!open) return;
    open = false; cancelAnimationFrame(raf);
    $('#town').hidden = true;
    document.body.classList.remove('in-town');
    if (!silent) GM().render();
  }
  function refresh() {
    if (!open) return;
    const S = GM().S; if (!S) return;
    const c = GM().city(cid);
    if (!busy) {
      if (S.season !== seen.season || c.owner !== seen.owner) { build(); }
      else {
        if (plotCount(c.agri) !== seen.agri) { buildFields(c.agri); seen.agri = plotCount(c.agri); }
        if (stallCount(c.comm) !== seen.comm) { buildMarket(c.comm); seen.comm = stallCount(c.comm); }
        if (c.def !== seen.def) { buildWalls(c.def); seen.def = c.def; }
        if (soldierCount(c.soldiers) !== seen.sold) { buildSoldiers(c.soldiers); seen.sold = soldierCount(c.soldiers); }
        if (fire) fire.userData.base = 0.45 + c.faith / 90;
        syncOfficers();
      }
    }
    renderHud();
  }

  function bind() {
    $('#townBack').addEventListener('click', () => exit());
    $('#townEnd').addEventListener('click', () => { if (!busy) GM().askEndTurn(); });
    $('#townDock').addEventListener('click', e => {
      const b = e.target.closest('[data-tcmd]'); if (b) return runCmd(b.dataset.tcmd);
      const bio = e.target.closest('[data-bio]'); if (bio) GM().showBio(bio.dataset.bio);
    });
    $('#townReset').addEventListener('click', () => { focus = null; camera.position.set(0, 60, 86); controls.target.set(0, 0, 4); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && open && $('#modal').hidden) exit(); });
  }

  bind();
  window.TOWN = { enter, exit, refresh, get open() { return open; } };
  const hookUp = () => { if (window.GAME) { GAME.hooks.onCommand = onCommand; GAME.hooks.onRender = refresh; } else setTimeout(hookUp, 50); };
  hookUp();
})();
