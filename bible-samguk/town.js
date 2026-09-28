// 성경 삼국지 — 3D 성내 화면 (Three.js)
// 지도에서 성을 누르면 들어오는 화면. 성벽·집·궁·제단·시장·창고·농지·훈련장을 도시 수치에 맞게 짓고,
// 명령을 내리면 맡은 장수가 해당 장소로 걸어가 일하는 모습을 보여 준다.
// 장수는 제 자리(궁·장터·농장·훈련장·제단)에 머물고, 장수와 백성을 누르면 다가가 이야기를 나눈다.
// '걷기'를 켜면 주인공(없으면 군주)이 되어 성 안을 걸어 다닐 수 있다.
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
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const R = 24; // 성벽 반지름
  const P2 = Math.PI / 2;
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
    { sky: '#cfe2ea', fog: '#e4dfcf', ground: '#b9a56d', crop: '#7ea84b', tuft: '#5f8f3a', sun: '#fff4dc', int: 0.74 },
    { sky: '#dbe6e8', fog: '#ebe2cc', ground: '#caae70', crop: '#a8aa43', tuft: '#8c9a3a', sun: '#fff0cf', int: 0.84 },
    { sky: '#ead9bd', fog: '#eadcc2', ground: '#c09e62', crop: '#d8b04a', tuft: '#c8962e', sun: '#ffe1b3', int: 0.74 },
    { sky: '#c8d3dd', fog: '#d9dcdc', ground: '#aa9b7d', crop: '#8b7e59', tuft: '#6f6648', sun: '#e9eef5', int: 0.6 },
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
    torus: new T.TorusGeometry(0.22, 0.05, 6, 14), leaf: new T.BoxGeometry(0.5, 0.05, 3), arc: new T.TorusGeometry(0.5, 0.025, 4, 12, Math.PI),
    puff: new T.SphereGeometry(1, 7, 5),
  };
  function mesh(geo, m, sx = 1, sy = 1, sz = 1, shadow = true) {
    const me = new T.Mesh(geo, m); me.scale.set(sx, sy, sz);
    me.castShadow = shadow; me.receiveShadow = true; return me;
  }

  // ---------- 상태 ----------
  let renderer, scene, camera, controls, raf = 0, last = 0;
  let cid = null, open = false, busy = false, focus = null;
  let actors = [], officerActors = new Map(), parts = {}, tweens = [], particles = [], labels = [], fire = null, farmers = [];
  let seen = {}, solids = [], emitters = [], puffs = [], birds = [];
  const puffPool = [];
  let talkA = null, walker = null, walkTemp = false, nearA = null, nearT = 0, keys = {};
  const joy = { x: 0, y: 0 };

  // ---------- 인물 ----------
  function person(o) {
    const g = new T.Group();
    const body = mesh(GEO.robe, mat(o.robe)); body.position.y = 0.75; g.add(body);
    const belt = mesh(GEO.cyl, mat(o.sash || '#5b3f25'), 0.43, 0.08, 0.43, false); belt.position.y = 1.08; g.add(belt);
    const head = mesh(GEO.head, mat(o.skin)); head.position.y = 1.78; g.add(head);
    if (o.kind === 'soldier') {
      const hel = mesh(GEO.hemi, mat(o.helm || '#b08d57'), 0.3, 0.3, 0.3, false); hel.position.y = 1.82; g.add(hel);
    } else {
      const cap = mesh(GEO.hemi, mat(o.cap), 0.3, 0.32, 0.3, false); cap.position.y = 1.8; g.add(cap);
      const drape = mesh(GEO.box, mat(o.cap), 0.5, 0.55, 0.1, false); drape.position.set(0, 1.6, -0.2); g.add(drape);
      if (o.priest) { const mitre = mesh(GEO.cyl, mat('#f4f0e4'), 0.25, 0.35, 0.25, false); mitre.position.y = 2.1; g.add(mitre); }
    }
    if (o.crown) { const cr = mesh(GEO.torus, mat('#d9aa3c', { emissive: '#3a2800' }), 1, 1, 1, false); cr.rotation.x = Math.PI / 2; cr.position.y = 2.02; g.add(cr); }
    if (o.cloak) { const ck = mesh(GEO.cloak, mat(o.cloak, { side: T.DoubleSide })); ck.position.y = 0.98; g.add(ck); }
    const mkArm = side => {
      const p = new T.Group(); p.position.set(side * 0.37, 1.45, 0);
      const a = mesh(GEO.arm, mat(o.robe), 1, 1, 1, false); a.position.y = -0.32; p.add(a);
      const h = mesh(GEO.hand, mat(o.skin), 1, 1, 1, false); h.position.y = -0.68; p.add(h);
      g.add(p); return p;
    };
    const armL = mkArm(-1), armR = mkArm(1);
    if (o.kind === 'soldier') {
      const sp = mesh(GEO.spear, mat('#6b4a2a'), 1, 1, 1, false); sp.position.set(0, -0.62, 0.12); armR.add(sp);
      const tip = mesh(GEO.tip, mat('#c9c3b5'), 1, 1, 1, false); tip.position.set(0, 0.62, 0.12); armR.add(tip);
      sp.rotation.x = tip.rotation.x = 0; // 팔이 앞으로 들리면 창끝이 앞을 향한다
      const sh = mesh(GEO.shield, mat(o.shield || '#8a6d3f'), 1, 1, 1, false); sh.rotation.x = Math.PI / 2; sh.position.set(-0.08, -0.4, 0.2); armL.add(sh);
    }
    if (o.tool === 'hoe') {
      const st = mesh(GEO.cyl, mat('#6b4a2a'), 0.03, 1.4, 0.03, false); st.position.set(0, -0.9, 0.1); armR.add(st);
      const bl = mesh(GEO.box, mat('#8d8a80'), 0.25, 0.06, 0.3, false); bl.position.set(0, -1.58, 0.22); armR.add(bl);
    }
    if (o.tool === 'sickle') { const s = mesh(GEO.arc, mat('#b9b4a8'), 0.45, 0.45, 0.45, false); s.position.set(0, -0.78, 0.18); s.rotation.y = P2; armR.add(s); }
    if (o.tool === 'hammer') {
      const hd = mesh(GEO.cyl, mat('#6b4a2a'), 0.03, 0.55, 0.03, false); hd.rotation.x = P2; hd.position.set(0, -0.68, 0.28); armR.add(hd);
      const hh = mesh(GEO.box, mat('#4a4a4f'), 0.14, 0.2, 0.14, false); hh.position.set(0, -0.68, 0.55); armR.add(hh);
    }
    if (o.tool === 'bow') { const b = mesh(GEO.arc, mat('#6b4a2a'), 1.1, 1.1, 1.1, false); b.position.set(0, -0.7, 0); b.rotation.set(0, P2, -P2); armL.add(b); }
    if (o.staff) { const st = mesh(GEO.cyl, mat('#7a5a34'), 0.04, 2.2, 0.04, false); st.position.set(0, -0.2, 0.12); armR.add(st); }
    g.userData = { armL, armR, body };
    if (o.scale) g.scale.setScalar(o.scale);
    return g;
  }

  function sheep() {
    const g = new T.Group();
    const b = mesh(GEO.sph, mat('#eee8d8'), 0.55, 0.42, 0.8); b.position.y = 0.62; g.add(b);
    const h = mesh(GEO.sph, mat('#3a3028'), 0.2, 0.22, 0.26, false); h.position.set(0, 0.78, 0.75); g.add(h);
    [[-0.25, 0.4], [0.25, 0.4], [-0.25, -0.4], [0.25, -0.4]].forEach(([x, z]) => { const l = mesh(GEO.box, mat('#3a3028'), 0.1, 0.45, 0.1, false); l.position.set(x, 0.22, z); g.add(l); });
    g.userData = {};
    return g;
  }
  // 낙타·나귀: 머리를 숙였다 드는 모습(graze)
  function beast(camel) {
    const g = new T.Group(), col = camel ? '#c49a62' : '#8a8078', leg = camel ? 1.5 : 0.8;
    const b = mesh(GEO.sph, mat(col), camel ? 0.62 : 0.38, camel ? 0.55 : 0.36, camel ? 1.15 : 0.7); b.position.y = leg + (camel ? 0.4 : 0.15); g.add(b);
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([x, z]) => { const l = mesh(GEO.box, mat(col), camel ? 0.16 : 0.1, leg, camel ? 0.16 : 0.1, false); l.position.set(x * (camel ? 0.3 : 0.18), leg / 2, z * (camel ? 0.7 : 0.42)); g.add(l); });
    const hg = new T.Group(); hg.position.set(0, leg + (camel ? 0.55 : 0.25), camel ? 0.95 : 0.55); g.add(hg);
    const neck = mesh(GEO.box, mat(col), camel ? 0.28 : 0.18, camel ? 1.1 : 0.5, camel ? 0.3 : 0.22, false); neck.position.set(0, camel ? 0.45 : 0.2, camel ? 0.25 : 0.1); neck.rotation.x = camel ? 0.45 : 0.6; hg.add(neck);
    const hd = mesh(GEO.box, mat(col), camel ? 0.3 : 0.2, camel ? 0.3 : 0.22, camel ? 0.62 : 0.5); hd.position.set(0, camel ? 0.98 : 0.45, camel ? 0.6 : 0.35); hg.add(hd);
    if (camel) {
      const hump = mesh(GEO.sph, mat(col), 0.42, 0.5, 0.5); hump.position.set(0, leg + 0.85, -0.1); g.add(hump);
      const rug = mesh(GEO.box, mat('#9e3b33'), 1.0, 0.08, 0.9, false); rug.position.set(0, leg + 0.9, 0.25); g.add(rug);
    } else {
      [-1, 1].forEach(s => { const e = mesh(GEO.box, mat('#5e564f'), 0.05, 0.26, 0.08, false); e.position.set(s * 0.07, 0.64, 0.2); hg.add(e); });
      [-1, 1].forEach(s => { const k = mesh(GEO.sph, mat('#a8864f'), 0.2, 0.24, 0.26, false); k.position.set(s * 0.42, leg + 0.1, 0); g.add(k); });
    }
    g.userData = { head: hg };
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
    // 제자리 동작 (장수·백성 공용)
    pose(s) {
      const u = this.g.userData, t = this.t; if (!u.armL) return;
      switch (s) {
        case 'gesture': u.armL.rotation.set(-0.25, 0, 0); u.armR.rotation.set(-1.05 + Math.sin(t * 4.5) * 0.3, 0, 0.3 + Math.sin(t * 2.3) * 0.15); break;
        case 'point': u.armR.rotation.set(-1.5, 0, 0.1); u.armL.rotation.set(0, 0, 0); break;
        case 'pray': this.arms(-2.6 + Math.sin(t * 2) * 0.12, 0.35); break;
        case 'bow': this.arms(-0.2, 0); u.body.rotation.x = Math.max(0, Math.sin(t * 1.3)) * 0.35; break;
        case 'inspect': this.arms(-0.9, 0.1); u.body.rotation.x = 0.4; break;
        case 'hands': this.arms(0.4, 0.08); break;
        case 'draw': { const s2 = Math.sin(t * 3); u.armL.rotation.set(-1.7 + s2 * 0.45, 0, 0); u.armR.rotation.set(-1.7 - s2 * 0.45, 0, 0); break; }
        case 'drill': { const s2 = Math.sin(t * 5 + this.phase); u.armL.rotation.set(-0.5, 0, 0); u.armR.rotation.set(-0.6 - Math.max(0, s2) * 1.1, 0, 0); break; }
        case 'cheer': u.armR.rotation.set(-2.9 + Math.sin(t * 8) * 0.2, 0, 0); u.armL.rotation.set(0, 0, 0); break;
        default: this.arms(Math.sin(t * 1.5) * 0.05, 0);
      }
    }
    postTick(dt) {
      const P = this.g.position, h = this.home; if (!h) return this.pose('idle');
      const d = Math.hypot(P.x - h.x, P.z - h.z);
      if (d > 2.6) { this.goTo(h.clone(), null, d > 5 ? 4 : 1.4); return; }
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = 2.5 + Math.random() * 4.5;
        this.sub = pick(Math.random, this.anims || ['idle']);
        if (this.sub === 'stroll') { this.sub = 'idle'; this.face = null; this.goTo(v(h.x + (Math.random() - 0.5) * 2.4, 0, h.z + (Math.random() - 0.5) * 2), null, 1.1); return; }
        if (d > 0.3) this.goTo(h.clone(), null, 1.1);
        this.face = this.postFace ?? null;
      }
      if (this.sub === 'look' && this.postFace != null) this.face = this.postFace + Math.sin(this.t * 0.6) * 0.9;
      this.pose(this.sub);
    }
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
          const f = this.kind === 'sheep' ? 5 : this.speed > 4.5 ? 12 : 9;
          P.y = Math.abs(Math.sin(this.t * f)) * 0.08;
          if (u.armL) { const sw = Math.sin(this.t * f) * 0.6; u.armL.rotation.x = sw; u.armR.rotation.x = -sw; u.armL.rotation.z = u.armR.rotation.z = 0; }
          if (u.armL && this.mode === 'rows') { u.armR.rotation.x = -0.5 - Math.abs(Math.sin(this.t * 2.2)) * 1.1; u.armR.rotation.z = Math.sin(this.t * 2.2) * 0.5; } // 씨 뿌리기
          if (u.body) u.body.rotation.x = 0;
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
        case 'post': this.postTick(dt); break;
        case 'talk': this.pose('gesture'); break;
        case 'rows': // 봄: 이랑을 따라 오가며 씨를 뿌린다
          this.arms(0, 0); this.wait -= dt;
          if (this.wait <= 0 && this.rowA) { this.wait = 0.4 + Math.random(); this.goTo((P.distanceTo(this.rowA) < 0.5 ? this.rowB : this.rowA).clone(), null, 0.9); }
          break;
        case 'spar': { // 둘씩 마주 서서 겨루기
          const s = Math.sin(this.t * 3.2 + this.phase);
          u.armL.rotation.set(-0.9, 0, 0); u.armR.rotation.set(-1.1 - Math.max(0, s) * 0.9, 0, 0);
          u.body.rotation.x = Math.max(0, s) * 0.15;
          if (this.base) { P.x = this.base.x + Math.sin(this.face) * s * 0.18; P.z = this.base.z + Math.cos(this.face) * s * 0.18; }
          break;
        }
        case 'archer': {
          this.wait -= dt;
          const k = clamp(1 - this.wait / 2.2, 0, 1);
          u.armL.rotation.set(-1.57, 0, 0); u.armR.rotation.set(-1.57 + k * 0.35, 0, -0.35 * k);
          if (this.wait <= 0) { this.wait = 2.2 + Math.random() * 1.6; if (!reduce && this.target) shoot(v(P.x + 0.8, 1.55, P.z), v(this.target.x - 0.1, 1.25 + Math.random() * 0.35, this.target.z + (Math.random() - 0.5) * 0.4)); }
          break;
        }
        case 'hammer': {
          const s = Math.sin(this.t * 4.2 + this.phase);
          u.armR.rotation.set(-1.2 - Math.max(0, s) * 1.2, 0, 0); u.armL.rotation.set(-0.7, 0, 0);
          if (this.prevS > 0 && s <= 0 && this.anvil && !reduce) burst('ember', this.anvil, 3);
          this.prevS = s; break;
        }
        case 'graze': if (u.head) u.head.rotation.x = 0.1 + Math.max(0, Math.sin(this.t * 0.5 + this.phase)) * 0.9; break;
        default: this.arms(Math.sin(this.t * 1.5) * 0.05, 0);
      }
      if (this.face != null) this.g.rotation.y = lerpAngle(this.g.rotation.y, this.face, 0.12);
    }
  }
  function addActor(g, o) { scene.add(g); const a = new Actor(g, o); g.userData.actor = a; actors.push(a); return a; }
  function removeActor(a) {
    scene.remove(a.g); actors = actors.filter(x => x !== a);
    labels = labels.filter(l => { if (l.actor === a) { l.el.remove(); return false; } return true; });
    if (talkA === a) closeTalk();
    if (nearA === a) nearA = null;
  }

  // ---------- 초기화 ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2(), groundPl = new T.Plane(v(0, 1, 0), 0);
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
    // 짧게 눌렀다 떼면(끌지 않으면) 인물 선택 / 걷기 중엔 그 자리로 이동
    const cv = renderer.domElement; let down = null;
    cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    cv.addEventListener('pointerup', e => {
      if (!down) return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
      if (d < 10 && dt < 600) tap(e.clientX, e.clientY);
    });
    window.addEventListener('resize', resize);
  }
  function resize() {
    if (!renderer || !open) return;
    const el = $('#townStage'); const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    hudVars();
  }
  function hudVars() { const t = $('.town-top'); if (t) $('#town').style.setProperty('--th', Math.round(t.getBoundingClientRect().bottom) + 'px'); }

  function clearAll() {
    while (scene.children.length) scene.remove(scene.children[0]);
    actors = []; officerActors = new Map(); parts = {}; tweens = []; particles = []; farmers = []; fire = null;
    solids = []; emitters = []; puffs = []; birds = [];
    labels.forEach(l => l.el.remove()); labels = [];
  }
  function group(name) { if (parts[name]) scene.remove(parts[name]); const g = new T.Group(); parts[name] = g; scene.add(g); return g; }

  // ---------- 건설 ----------
  function build() {
    closeTalk(); stopWalk(true);
    clearAll();
    const S = GM().S, c = GM().city(cid), look = SEASON_LOOK[S.season], rng = mkRng(hash(cid));
    scene.background = new T.Color(look.sky);
    scene.fog = new T.Fog(look.fog, 120, 340);
    scene.add(new T.HemisphereLight('#f2e8d4', '#5a4a30', 0.55));
    const sun = new T.DirectionalLight(look.sun, look.int);
    sun.position.set(-45, 75, 40); sun.castShadow = true;
    sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
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
    buildWalls(c.def); buildPalace(c); buildAltar(c); buildGranary(); buildWell(); buildHouses(c, rng);
    buildMarket(c.comm); buildFields(c.agri); buildTraining(); buildSoldiers(c.soldiers); buildTrees(rng); buildLife(c, rng); buildBirds(rng);
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
  // 걷기 모드 충돌: 네모(box)와 원(r)
  const solidBox = (x0, x1, z0, z1) => solids.push({ x0, x1, z0, z1 });
  const solidCirc = (x, z, r) => solids.push({ x, z, r });
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
    solidBox(-6.3, 6.3, -16.3, -7.2);
  }

  function buildAltar(c) {
    const g = group('altar');
    const court = mat('#e9dfc8');
    [[-15.5, 4, 0.4, 9], [-6.5, 4, 0.4, 9], [-11, -0.5, 9, 0.4]].forEach(([x, z, w, d]) => { const f = mesh(GEO.box, court, w, 1.1, d); f.position.set(x, 0.55, z); g.add(f); solidBox(x - w / 2 - 0.1, x + w / 2 + 0.1, z - d / 2 - 0.1, z + d / 2 + 0.1); });
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
    solidBox(-12.9, -9.1, -0.3, 3.1); solidBox(-12.3, -9.7, 4.3, 6.9); solidCirc(-8, 5.6, 1.1);
    emitters.push({ p: v(-11, 2.6, 5.6), every: 0.45, t: 0, col: '#bdb6aa', s: 0.32 });
  }

  function buildGranary() {
    const g = group('granary');
    [6, 9.5, 13].forEach(x => {
      const b = mesh(GEO.cyl, mat('#cdb487'), 1.5, 2.2, 1.5); b.position.set(x, 1.1, -12); g.add(b);
      const d = mesh(GEO.hemi, mat('#c2a877'), 1.5, 1.4, 1.5); d.position.set(x, 2.2, -12); g.add(d);
      solidCirc(x, -12, 1.8);
    });
    for (let i = 0; i < 4; i++) { const s = mesh(GEO.sph, mat('#b89a62'), 0.45, 0.4, 0.35); s.position.set(7 + i * 1.5, 0.35, -9.4); g.add(s); }
  }
  // 우물: 여인들이 물을 긷는 곳
  const WELL = v(-5.2, 0, 13.2);
  function buildWell() {
    const g = group('well');
    const ring = mesh(GEO.cyl, mat('#a99a84'), 0.95, 0.8, 0.95); ring.position.set(WELL.x, 0.4, WELL.z); g.add(ring);
    const water = mesh(GEO.cyl, mat('#3d6f8a'), 0.75, 0.05, 0.75, false); water.position.set(WELL.x, 0.78, WELL.z); g.add(water);
    [-1, 1].forEach(s => { const p = mesh(GEO.cyl, mat('#6b4a2a'), 0.07, 2, 0.07); p.position.set(WELL.x + s * 0.9, 1, WELL.z); g.add(p); });
    const bar = mesh(GEO.cyl, mat('#6b4a2a'), 0.06, 2, 0.06); bar.rotation.z = P2; bar.position.set(WELL.x, 1.9, WELL.z); g.add(bar);
    [[0.8, 0.9], [1.2, -0.6]].forEach(([dx, dz]) => { const j = mesh(GEO.sph, mat('#b8733c'), 0.26, 0.32, 0.26); j.position.set(WELL.x + dx, 0.3, WELL.z + dz); g.add(j); });
    solidCirc(WELL.x, WELL.z, 1.3);
  }

  function inZone(x, z) {
    return (Math.abs(x) < 8.5 && z > -17.5 && z < -2.8) || Math.hypot(x + 11, z - 3) < 6.8 || Math.hypot(x - WELL.x, z - WELL.z) < 3.4 ||
      (x > 3 && x < 22.5 && z > -1.5 && z < 11) || (x > 3.5 && x < 16 && z > -15 && z < -7.5) || (Math.abs(x) < 3.6 && z > -5);
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
      const door = mesh(GEO.box, mat('#4a3320'), 0.8, 1.4, 0.1, false); door.position.set(0, 0.7, d / 2 + 0.03); hg.add(door);
      if (rng() < 0.35) { const u = mesh(GEO.box, mat(col), w * 0.45, 1.3, d * 0.45); u.position.set(w * 0.2, h + 0.9, -d * 0.2); hg.add(u); }
      if (rng() < 0.3) { const aw = mesh(GEO.box, mat(pick(rng, ['#9e3b33', '#3f5f8a', '#c9a24a'])), w * 0.6, 0.08, 1, false); aw.position.set(0, h * 0.75, d / 2 + 0.5); hg.add(aw); }
      g.add(hg);
      solidCirc(x, z, Math.min(w, d) / 2 + 0.45);
      if (placed.length <= 3 && !reduce) emitters.push({ p: v(x, h + 0.5, z), every: 1.1, t: rng(), col: '#e4ded2', s: 0.35 }); // 부엌 연기
    }
  }

  const stallCount = comm => clamp(2 + Math.round(comm / 12), 2, 10);
  const stallPos = i => v(5.5 + Math.floor(i / 2) * 2.9, 0, 1.6 + (i % 2) * 6.2);
  function wares(s, i) { // 좌판 물건: 항아리·과일·천·곡식 자루
    const k = i % 4;
    if (k === 0) for (let j = 0; j < 3; j++) { const p = mesh(GEO.cyl, mat(['#b8733c', '#a5553f', '#c98e62'][j]), 0.2, 0.42, 0.2, false); p.position.set(-0.6 + j * 0.6, 1.01, 0); s.add(p); }
    else if (k === 1) for (let j = 0; j < 3; j++) { const f = mesh(GEO.hemi, mat(['#9e3b33', '#d9b04a', '#7c9a3a'][j]), 0.3, 0.26, 0.3, false); f.position.set(-0.6 + j * 0.6, 0.8, 0); s.add(f); }
    else if (k === 2) {
      for (let j = 0; j < 3; j++) { const r = mesh(GEO.cyl, mat(['#3f5f8a', '#8a4f7a', '#c9a24a'][j]), 0.13, 1.4, 0.13, false); r.rotation.z = P2; r.position.set(0, 0.93 + j * 0.2, -0.2 + j * 0.15); s.add(r); }
      const cl = mesh(GEO.box, mat('#b0413e'), 0.05, 0.9, 1.1, false); cl.position.set(1.05, 1.45, 0); s.add(cl);
    } else for (let j = 0; j < 3; j++) { const b = mesh(GEO.sph, mat('#c9a870'), 0.28, 0.33, 0.28, false); b.position.set(-0.6 + j * 0.6, 1.1, 0); s.add(b); }
  }
  function buildMarket(comm, popNew) {
    const g = group('market'); const n = stallCount(comm);
    const awn = ['#b0413e', '#3f5f8a', '#c9a24a', '#4f7a4a', '#8a4f7a', '#d0703c'];
    for (let i = 0; i < n; i++) {
      const p = stallPos(i), s = new T.Group(); s.position.copy(p);
      [[-1, -0.7], [1, -0.7], [-1, 0.7], [1, 0.7]].forEach(([px, pz]) => { const q = mesh(GEO.cyl, mat('#6b4a2a'), 0.06, 2, 0.06, false); q.position.set(px, 1, pz); s.add(q); });
      const a = mesh(GEO.box, mat(awn[i % awn.length]), 2.4, 0.1, 1.8); a.position.y = 2.05; a.rotation.z = 0.08; s.add(a);
      const tb = mesh(GEO.box, mat('#8a6a44'), 2, 0.8, 1.1); tb.position.y = 0.4; s.add(tb);
      wares(s, i);
      if (popNew && i === n - 1) { s.scale.setScalar(0.01); tween(0.8, k => s.scale.setScalar(Math.max(0.01, k))); }
      g.add(s);
    }
    solids = solids.filter(x => !x.stall);
    for (let i = 0; i < n; i++) { const p = stallPos(i); solids.push({ x0: p.x - 1.1, x1: p.x + 1.1, z0: p.z - 0.65, z1: p.z + 0.65, stall: true }); }
    // 좌판 뒤 상인 (앞의 여섯 좌판)
    actors.filter(a => a.kind === 'merchant').forEach(removeActor);
    const r = mkRng(hash(cid + 'm'));
    for (let i = 0; i < Math.min(n, 6); i++) {
      const p = stallPos(i), row = i % 2, g2 = person(Object.assign(villagerLook(r), r() < 0.3 ? { robe: '#8e2f3a', cap: '#b23b3e' } : {}));
      g2.position.set(p.x + 0.5, 0, p.z + (row ? -1.15 : 1.15)); // 좌판 앞에서 손님을 부른다
      const a = addActor(g2, { mode: 'post', kind: 'merchant', face: row ? Math.PI : 0 });
      Object.assign(a, { home: g2.position.clone(), postFace: row ? Math.PI : 0, anims: ['idle', 'gesture', 'gesture', 'hands', 'look', 'point'] });
      meet(a, 'merchant', pick(r, NAMES_M), 'elder');
    }
  }

  const plotCount = agri => clamp(Math.round(agri / 7), 2, 14);
  function plotPos(i) { const col = i % 2, row = Math.floor(i / 2); return v(-44 + col * 9.4, 0, -27 + row * 9); }
  function buildFields(agri, popNew) {
    const g = group('fields'); const n = plotCount(agri), sn = GM().S.season, look = SEASON_LOOK[sn];
    for (let i = 0; i < n; i++) {
      const p = plotPos(i), pg = new T.Group(); pg.position.copy(p);
      const plot = mesh(GEO.box, mat(sn === 0 ? '#8f7b4f' : look.crop), 8.4, 0.22, 7.6, false); plot.position.y = 0.11; pg.add(plot);
      for (let k = -1; k <= 1; k++) { const f = mesh(GEO.box, mat('#7b6440'), 8.2, 0.06, 0.25, false); f.position.set(0, 0.25, k * 2.4); pg.add(f); }
      // 계절: 봄 새싹 · 여름 푸른 이삭 · 가을 황금 이삭과 볏단 · 겨울 빈 밭
      if (sn === 0) for (let k = 0; k < 6; k++) { const t = mesh(GEO.cone, mat('#7fb24a'), 0.2, 0.32, 0.2, false); t.position.set(-3 + (k % 3) * 3, 0.36, -1.2 + Math.floor(k / 3) * 2.4); pg.add(t); }
      else if (sn === 1) for (let k = 0; k < 6; k++) { const t = mesh(GEO.cone, mat(look.tuft), 0.35, 0.8, 0.35); t.position.set(-3 + (k % 3) * 3, 0.6, -1.2 + Math.floor(k / 3) * 2.4); pg.add(t); }
      else if (sn === 2) {
        for (let k = 0; k < 3; k++) { const t = mesh(GEO.cone, mat(look.tuft), 0.34, 1.1, 0.34); t.position.set(-3 + k * 3, 0.75, -1.2); pg.add(t); }
        for (let k = 0; k < 3; k++) { const sh = mesh(GEO.cyl, mat('#d9b04a'), 0.24, 0.85, 0.24); sh.position.set(-3 + k * 3, 0.64, 1.6); sh.rotation.z = (k - 1) * 0.12; pg.add(sh); }
      }
      if (popNew && i === n - 1) { pg.scale.set(1, 0.01, 1); tween(1, k => pg.scale.set(1, Math.max(0.01, k), 1)); }
      g.add(pg);
    }
    const wall = mesh(GEO.box, mat('#b9a17a'), 0.5, 0.8, 66, false); wall.position.set(-48.8, 0.4, 3); g.add(wall);
  }

  // 훈련장: 대열 훈련 · 겨루기 · 활쏘기 과녁 · 대장간
  const TARGETS = [v(49.2, 0, 19.2), v(49.2, 0, 21.2)], ANVIL = v(32.5, 0.7, 20.6);
  function buildTraining() {
    const g = group('training');
    const yard = mesh(GEO.box, mat('#a98a5d'), 21, 0.1, 24, false); yard.position.set(40, 0.05, 10); g.add(yard);
    for (let i = 0; i <= 10; i++) {
      [[29.5, -2 + i * 2.4], [50.5, -2 + i * 2.4]].forEach(([x, z]) => { const p = mesh(GEO.cyl, mat('#6b4a2a'), 0.1, 1.2, 0.1); p.position.set(x, 0.6, z); g.add(p); });
    }
    const rack = mesh(GEO.box, mat('#6b4a2a'), 3, 1.6, 0.3); rack.position.set(33, 0.8, -1.5); g.add(rack);
    for (let i = 0; i < 5; i++) { const sp = mesh(GEO.cyl, mat('#7a5a34'), 0.03, 2.4, 0.03, false); sp.position.set(31.8 + i * 0.6, 1.2, -1.3); sp.rotation.x = -0.15; g.add(sp); }
    const stand = mesh(GEO.box, mat('#8a6a44'), 3, 0.6, 2); stand.position.set(40, 0.3, -2.4); g.add(stand);
    TARGETS.forEach(t => {
      const leg = mesh(GEO.box, mat('#6b4a2a'), 0.12, 1.4, 0.12); leg.position.set(t.x + 0.2, 0.7, t.z); g.add(leg);
      [['#d8c28a', 0.7, 0.14], ['#b0413e', 0.46, 0.16], ['#efe6cc', 0.2, 0.18]].forEach(([c, r, h]) => { const d = mesh(GEO.cyl, mat(c), r, h, r); d.rotation.z = P2; d.position.set(t.x, 1.45, t.z); g.add(d); });
    });
    const forge = mesh(GEO.box, mat('#8e806c'), 1.4, 1, 1.3); forge.position.set(31, 0.5, 20.6); g.add(forge);
    const coal = mesh(GEO.box, basic('#ff7a2a'), 1, 0.1, 0.9, false); coal.position.set(31, 1.03, 20.6); g.add(coal);
    const anv = mesh(GEO.box, mat('#4a4a4f'), 0.4, 0.5, 0.3); anv.position.set(ANVIL.x, 0.25, ANVIL.z); g.add(anv);
    const top = mesh(GEO.box, mat('#5a5a60'), 0.75, 0.16, 0.34); top.position.set(ANVIL.x, 0.58, ANVIL.z); g.add(top);
    emitters.push({ p: v(31, 1.3, 20.6), every: 0.7, t: 0, col: '#9a948a', s: 0.25 });
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
    if (Math.hypot(x, z) < R) solidCirc(x, z, 0.6);
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

  // ---------- 백성 ----------
  const NAMES_M = ['므나헴', '요엘', '바룩', '아삽', '미가', '나답', '엘리압', '하난', '삽밧', '아비후', '셀렉', '오벳'];
  const NAMES_F = ['한나', '미리암', '노아', '밀가', '디르사', '아비가일', '다말'];
  const NAMES_C = ['엘가나', '요나단', '미갈', '살룸', '베냐민', '에셀'];
  const ROLE_NAME = { merchant: '상인', camel: '낙타 몰이꾼', farmer: '농부', shepherd: '목자', smith: '대장장이', soldier: '병사', watch: '파수꾼', priest: '제사장', child: '아이', woman: '우물가 여인', folk: '백성' };
  function villagerLook(r) { return { robe: pick(r, ROBES), cap: pick(r, CAPS), skin: pick(r, SKINS) }; }
  // 만날 수 있는 사람으로 표시: 이름표(label)는 이름 있는 역할만 단다
  function meet(a, role, name, pr, label = true) { a.meet = { role, name, pr }; if (label) addLabel(a, 'npc'); return a; }
  const inTown = () => { const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * (R - 8); const p = v(Math.cos(a) * r, 0, Math.sin(a) * r); return inZone(p.x, p.z) && Math.random() < 0.6 ? v(Math.random() * 4 - 2, 0, 6 + Math.random() * 12) : p; };
  const outTown = () => Math.random() < 0.5 ? v(-3 + Math.random() * 6, 0, R + 8 + Math.random() * 30) : v(-30 - Math.random() * 16, 0, -24 + Math.random() * 50);
  const aisle = () => v(5 + Math.random() * 12.5, 0, 3.6 + Math.random() * 2.2);
  function npc(look, pos, face, o, role, name, pr, label) {
    const g = person(look); g.position.copy(pos); g.rotation.y = face ?? 0;
    const a = addActor(g, Object.assign({ mode: 'post', kind: 'npc', face }, o));
    Object.assign(a, { home: pos.clone(), postFace: face, anims: o.anims });
    if (role) meet(a, role, name, pr, label);
    return a;
  }
  function buildLife(c, rng) {
    const n = clamp(Math.round(c.pop / 1700), 6, 20), sn = GM().S.season;
    for (let i = 0; i < n; i++) {
      const g = person(villagerLook(rng)); const out = i % 4 === 0;
      g.position.copy(out ? outTown() : inTown());
      meet(addActor(g, { mode: 'wander', speed: 1.6 + rng() * 0.6, area: out ? () => (Math.random() < 0.7 ? outTown() : inTown()) : () => (Math.random() < 0.85 ? inTown() : outTown()), kind: 'villager' }), 'folk', pick(rng, NAMES_M), 'elder', false);
    }
    // 장터 손님: 좌판 사이를 오간다
    for (let i = 0; i < 5; i++) {
      const g = person(villagerLook(rng)); g.position.copy(aisle());
      meet(addActor(g, { mode: 'wander', speed: 1.2 + rng() * 0.4, area: aisle, kind: 'villager' }), 'folk', pick(rng, NAMES_F), 'woman', false);
    }
    // 낙타 몰이꾼과 낙타, 짐 실은 나귀
    const camel = addActor(beast(true), { mode: 'graze', kind: 'animal', face: -2.6 }); camel.g.position.set(20.4, 0, 6.2); camel.g.rotation.y = -2.6;
    solidCirc(20.4, 6.2, 1.3);
    npc(Object.assign(villagerLook(rng), { robe: '#6e4f3a', cap: '#e8dcc0', staff: true }), v(19.6, 0, 3.9), -1.9, { anims: ['idle', 'gesture', 'look', 'hands'] }, 'camel', pick(rng, NAMES_M), 'elder');
    [[3.8, 9.8, 0.4], [19.2, -0.4, -2.2]].forEach(([x, z, f]) => { const d = addActor(beast(false), { mode: 'graze', kind: 'animal', face: f }); d.g.position.set(x, 0, z); d.g.rotation.y = f; solidCirc(x, z, 0.8); });
    // 농부: 봄엔 씨 뿌리기, 여름엔 김매기, 가을엔 낫으로 추수, 겨울엔 몇 명만 밭을 손본다
    const nf = Math.min(sn === 3 ? 3 : 8, plotCount(c.agri));
    for (let i = 0; i < nf; i++) {
      const p = plotPos(i); const g = person(Object.assign(villagerLook(rng), { tool: sn === 0 ? null : sn === 2 ? 'sickle' : 'hoe' }));
      let a;
      if (sn === 0) {
        const zz = p.z + (rng() < 0.5 ? -1.2 : 1.2), A = v(p.x - 3.6, 0, zz), B = v(p.x + 3.6, 0, zz);
        g.position.copy(A.clone().lerp(B, rng()));
        a = addActor(g, { mode: 'rows', kind: 'farmer', speed: 0.9 }); a.rowA = A; a.rowB = B;
      } else {
        g.position.set(p.x + (rng() - 0.5) * 5, 0, p.z + (rng() - 0.5) * 4);
        a = addActor(g, { mode: 'work', intense: sn === 3 ? 0.4 : sn === 2 ? 0.9 : 0.7, kind: 'farmer', face: rng() * 6 });
      }
      farmers.push(meet(a, 'farmer', pick(rng, NAMES_M), 'elder', i < 2));
    }
    const pasture = () => v(-8 + Math.random() * 22, 0, -52 + Math.random() * 14);
    for (let i = 0; i < 10; i++) { const g = sheep(); g.position.copy(pasture()); addActor(g, { mode: 'wander', speed: 0.7, area: pasture, kind: 'sheep' }); }
    const sh = person(Object.assign(villagerLook(rng), { staff: true })); sh.position.set(2, 0, -40);
    meet(addActor(sh, { mode: 'wander', speed: 1, area: pasture, kind: 'shepherd' }), 'shepherd', pick(rng, NAMES_M), 'prophet');
    // 훈련장: 겨루는 병사 두 쌍, 활 쏘는 병사, 대장장이
    [[34, 35.5], [38.2, 39.7]].forEach(([x1, x2], k) => {
      [[x1, P2, 0], [x2, -P2, Math.PI]].forEach(([x, f, ph], j) => {
        const a = npc(soldierLook(), v(x, 0, 17.4), f, { mode: 'spar', kind: 'sparrer' });
        a.phase = ph + k; a.base = v(x, 0, 17.4);
        if (k === 0 && j === 0) meet(a, 'soldier', pick(rng, NAMES_M), 'warrior');
      });
    });
    TARGETS.forEach((t, i) => { const a = npc(Object.assign(soldierLook(), { tool: 'bow', kind: 'archer', cap: '#d8cfb8' }), v(41.8, 0, t.z), P2, { mode: 'archer', kind: 'sparrer' }); a.target = t; a.wait = i * 1.3 + 0.5; });
    const smith = npc(Object.assign(villagerLook(rng), { robe: '#5b4a3a', cap: '#3a3028', tool: 'hammer' }), v(33.3, 0, 20.6), -P2, { mode: 'hammer' }, 'smith', pick(rng, NAMES_M), 'elder');
    smith.anvil = ANVIL;
    // 성문 파수꾼, 제단의 제사장, 우물가 여인, 뛰노는 아이들
    npc(Object.assign(soldierLook(), { kind: 'soldier' }), v(3, 0, R - 3.4), 0, { anims: ['idle', 'look', 'look', 'hands'] }, 'watch', pick(rng, NAMES_M), 'warrior');
    npc({ robe: '#ece7da', cap: '#f4f0e4', skin: pick(rng, SKINS), priest: true, sash: '#3f5f8a' }, v(-8.6, 0, 3.9), -1.1, { anims: ['pray', 'idle', 'bow', 'gesture', 'pray'] }, 'priest', pick(rng, NAMES_M), 'priest');
    npc({ robe: '#8e2f3a', cap: '#b23b3e', skin: pick(rng, SKINS) }, v(WELL.x + 1.4, 0, WELL.z + 0.3), -1.8, { anims: ['draw', 'draw', 'idle', 'gesture'] }, 'woman', pick(rng, NAMES_F), 'woman');
    const kid = () => v(-7 + Math.random() * 9, 0, 5 + Math.random() * 12);
    for (let i = 0; i < 2; i++) {
      const g = person(Object.assign(villagerLook(rng), { scale: 0.62 })); g.position.copy(kid());
      meet(addActor(g, { mode: 'wander', speed: 2.8, area: kid, kind: 'child' }), 'child', pick(rng, NAMES_C), 'elder');
    }
  }
  // 하늘을 도는 새
  function buildBirds(rng) {
    const m = basic('#3a3530');
    for (let i = 0; i < 6; i++) {
      const g = new T.Group(), lw = new T.Group(), rw = new T.Group();
      const l = new T.Mesh(GEO.box, m); l.scale.set(0.9, 0.05, 0.3); l.position.x = -0.45; lw.add(l);
      const r = new T.Mesh(GEO.box, m); r.scale.set(0.9, 0.05, 0.3); r.position.x = 0.45; rw.add(r);
      g.add(lw, rw); scene.add(g);
      birds.push({ g, lw, rw, r: 20 + rng() * 40, h: 16 + rng() * 10, a: rng() * 6.28, sp: (0.12 + rng() * 0.1) * (rng() < 0.5 ? -1 : 1), ph: rng() * 6, cx: (rng() - 0.5) * 30, cz: (rng() - 0.5) * 30 });
    }
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
  // 장수가 머무는 자리: 군주는 궁, 제사장·선지자는 제단, 용사는 훈련장, 정치가는 장터·농장, 지략가는 궁
  const POSTS = {
    palace: { name: '궁', anim: ['idle', 'hands', 'look', 'gesture', 'stroll'], cmds: ['search', 'relief', 'wall'] },
    market: { name: '장터', anim: ['gesture', 'look', 'point', 'stroll', 'idle', 'hands'], cmds: ['comm', 'relief'] },
    farm: { name: '농장', anim: ['inspect', 'look', 'point', 'stroll', 'inspect', 'hands'], cmds: ['agri'] },
    training: { name: '훈련장', anim: ['point', 'hands', 'cheer', 'look', 'stroll'], cmds: ['train', 'recruit'] },
    temple: { name: '제단', anim: ['pray', 'bow', 'idle', 'pray', 'gesture'], cmds: ['worship'] },
  };
  function slotsOf(k) {
    switch (k) {
      case 'palace': return [[v(0, 0, -5.2), 0], [v(-2.8, 0, -4.6), 0.2], [v(2.8, 0, -4.6), -0.2], [v(-5.2, 0, -4), 0.4], [v(5.2, 0, -4), -0.4]];
      case 'market': return [[v(7.2, 0, 4.7), Math.PI], [v(11.5, 0, 4.7), 0], [v(15.6, 0, 4.7), Math.PI], [v(9.3, 0, 4.3), 0]];
      case 'training': return [[v(40, 0, 0.4), 0], [v(35.6, 0, 0.8), 0.2], [v(44.4, 0, 0.8), -0.2], [v(31.4, 0, 8), P2], [v(48.6, 0, 8), -P2]];
      case 'temple': return [[v(-12.3, 0, 8.9), Math.PI], [v(-9.7, 0, 8.9), Math.PI], [v(-13.9, 0, 4.6), 1.2], [v(-13.7, 0, 7.4), 2.2]];
      default: { const rows = Math.ceil(plotCount(GM().city(cid).agri) / 2), out = []; for (let i = 0; i < 5; i++) { const r = i % rows; out.push(i < rows ? [v(-29.6, 0, -27 + r * 9), -P2] : [v(-39.3, 0, -24.5 + r * 9), P2]); } return out; }
    }
  }
  function assignPosts(list, c) {
    const S = GM().S, F = c.owner && S.facs[c.owner], used = { palace: 0, market: 0, farm: 0, training: 0, temple: 0 }, out = new Map();
    const slots = {}; Object.keys(used).forEach(k => { slots[k] = slotsOf(k); });
    const ordered = list.slice().sort((a, b) => (F && F.ruler === b.id ? 1 : 0) - (F && F.ruler === a.id ? 1 : 0));
    ordered.forEach(o => {
      const ruler = !!(F && F.ruler === o.id), role = window.PORTRAIT ? PORTRAIT.roleOf(o, ruler) : 'elder';
      let pref;
      if (ruler) pref = ['palace'];
      else {
        pref = [['training', o.war], ['palace', o.int], [used.farm <= used.market ? 'farm' : 'market', o.pol], ['market', o.cha], ['temple', o.fai || 0]].sort((a, b) => b[1] - a[1]).map(x => x[0]);
        if (role === 'priest' || role === 'prophet') pref.unshift('temple'); else if (role === 'warrior' || role === 'phil' || role === 'philking') pref.unshift('training');
      }
      const k = pref.concat(['palace', 'market', 'farm', 'training', 'temple']).find(k => used[k] < slots[k].length) || 'palace';
      const i = used[k]++, s = slots[k][i % slots[k].length];
      out.set(o.id, { post: k, pos: s[0], face: s[1], slot: i, warrior: role === 'warrior' || role === 'phil' });
    });
    return out;
  }
  function syncOfficers(spawnFrom) {
    const c = GM().city(cid); const list = c.owner ? GM().offsIn(cid, c.owner) : [];
    const ids = new Set(list.map(o => o.id));
    for (const [id, a] of officerActors) if (!ids.has(id)) { if (a === walker) stopWalk(true); removeActor(a); officerActors.delete(id); }
    const plan = assignPosts(list, c);
    list.forEach(o => {
      let a = officerActors.get(o.id); const pl = plan.get(o.id);
      if (!a) {
        const g = person(officerLook(o));
        g.position.copy(spawnFrom && spawnFrom.id === o.id ? spawnFrom.pos : pl.pos); g.rotation.y = pl.face;
        a = addActor(g, { mode: 'post', speed: 3, kind: 'officer', face: pl.face });
        a.o = o; officerActors.set(o.id, a);
        addLabel(a, 'off');
      }
      Object.assign(a, { o, post: pl.post, home: pl.pos, postFace: pl.face, anims: POSTS[pl.post].anim.concat(pl.warrior && pl.post === 'training' ? ['drill', 'drill'] : []) });
      if (a.label) a.label.h = 3.1 + (pl.slot % 2) * 1.1;
    });
    labels.forEach(l => { if (l.actor && l.actor.o) l.el.classList.toggle('done', !!l.actor.o.done); });
  }
  function addLabel(a, type) {
    const el = document.createElement('button'); el.type = 'button';
    if (type === 'off') { el.className = 'tl-off'; el.innerHTML = `${GM().S.facs[a.o.fac] && GM().fac(a.o.fac).ruler === a.o.id ? '<i>王</i>' : ''}${GM().esc(a.o.name)}`; }
    else { el.className = 'tl-npc'; el.textContent = ROLE_NAME[a.meet.role]; }
    el.addEventListener('click', () => talk(a));
    $('#townLabels').appendChild(el);
    const l = { el, actor: a, h: type === 'off' ? 3.1 : 2.45 * a.g.scale.y, npc: type !== 'off' };
    labels.push(l); a.label = l;
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
  const tmp = new T.Vector3(), tmp2 = new T.Vector3(), fw = new T.Vector3();
  function updateLabels() {
    const el = $('#townStage'), w = el.clientWidth, h = el.clientHeight;
    labels.forEach(l => {
      if (l.actor) tmp.copy(l.actor.g.position).setY(l.actor.g.position.y + l.h); else tmp.copy(l.pos);
      // 백성 이름표는 가까이 다가갔을 때만
      const far = l.npc && camera.position.distanceTo(tmp) > (walker ? 30 : 44);
      tmp.project(camera);
      const vis = !far && tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
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
      else if (kind === 'ember') { m = new T.Mesh(GEO.sph, basic(Math.random() < 0.5 ? '#ffd36a' : '#ff8a2a')); m.scale.setScalar(0.06); vel = v((Math.random() - 0.5) * 2.5, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 2.5); life = 0.45; }
      else if (kind === 'sack') { m = new T.Mesh(GEO.sph, mat('#c9a870')); m.scale.set(0.35, 0.3, 0.3); vel = v((Math.random() - 0.5) * 4, 5, (Math.random() - 0.5) * 4); }
      m.position.copy(pos).add(kind === 'ember' ? v(0, 0, 0) : v((Math.random() - 0.5) * 2, 0.5, (Math.random() - 0.5) * 2));
      scene.add(m); particles.push({ m, vel, grav, life, max: life, spin, kind });
    }
  }
  function shoot(from, to) { // 화살: 과녁에 꽂혔다가 사라진다
    const m = mesh(GEO.cyl, mat('#5b3f25'), 0.025, 0.9, 0.025, false); m.rotation.z = P2; m.position.copy(from); scene.add(m);
    tweens.push({ dur: 0.4, t: 0, fn: (k, t) => { const q = Math.min(1, t / 0.4); m.position.lerpVectors(from, to, q); m.position.y += Math.sin(q * Math.PI) * 0.35; }, done: () => wait(1.4, () => scene.remove(m)) });
  }
  function puff(e) { // 연기
    let m = puffPool.pop();
    if (!m) m = new T.Mesh(GEO.puff, new T.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.4, depthWrite: false }));
    m.material.color.set(e.col); m.position.copy(e.p).add(v((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3)); m.scale.setScalar(e.s);
    scene.add(m); puffs.push({ m, life: 3.2, max: 3.2, s: e.s });
  }
  function lightColumn(pos) {
    const m = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 40, 18, 1, true), new T.MeshBasicMaterial({ color: '#fff1c4', transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    m.position.copy(pos).setY(20); scene.add(m);
    tween(2.6, k => { m.material.opacity = Math.sin(k * Math.PI) * 0.5; m.scale.x = m.scale.z = 1 + k * 0.6; }, () => scene.remove(m));
  }
  function glideCam(toT, toC, dur = 0.9) {
    focus = null;
    const fT = controls.target.clone(), fC = camera.position.clone();
    tween(dur, k => { controls.target.lerpVectors(fT, toT, k); camera.position.lerpVectors(fC, toC, k); });
  }
  function glideTo(p, dist) {
    const dir = camera.position.clone().sub(controls.target).setY(0); if (dir.lengthSq() < 0.01) dir.set(0, 0, 1); dir.normalize();
    const t = p.clone().setY(1.6);
    glideCam(t, t.clone().addScaledVector(dir, dist * 0.62).setY(1.6 + dist * 0.8));
  }

  // ---------- 루프 ----------
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    walkInput();
    actors.forEach(a => a.update(dt));
    if (walker) walkAfter(dt);
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]; if (!tw) continue; tw.t += dt; const k = Math.min(1, tw.t / tw.dur); tw.fn(ease(k), tw.t);
      if (k >= 1) { tweens.splice(tweens.indexOf(tw), 1); tw.done && tw.done(); }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.life -= dt; p.vel.y += p.grav * dt;
      p.m.position.addScaledVector(p.vel, dt); p.m.rotation.x += p.spin * dt; p.m.rotation.y += p.spin * dt;
      if (p.kind === 'dust') p.m.scale.multiplyScalar(1 + dt * 1.5);
      if (p.life <= 0 || p.m.position.y < -0.5) { scene.remove(p.m); particles.splice(i, 1); }
    }
    if (!reduce) emitters.forEach(e => { e.t -= dt; if (e.t <= 0) { e.t = e.every * (0.7 + Math.random() * 0.6); puff(e); } });
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i]; p.life -= dt; const k = 1 - p.life / p.max;
      p.m.position.y += dt * 0.9; p.m.position.x += dt * 0.28; p.m.scale.setScalar(p.s * (1 + k * 2.4)); p.m.material.opacity = 0.42 * (1 - k);
      if (p.life <= 0) { scene.remove(p.m); puffs.splice(i, 1); puffPool.push(p.m); }
    }
    birds.forEach(b => {
      b.a += b.sp * dt; b.g.position.set(b.cx + Math.cos(b.a) * b.r, b.h + Math.sin(ts / 900 + b.ph), b.cz + Math.sin(b.a) * b.r);
      b.g.rotation.y = -b.a + (b.sp > 0 ? 0 : Math.PI); const f = Math.sin(ts / 110 + b.ph) * 0.6; b.lw.rotation.z = f; b.rw.rotation.z = -f;
    });
    if (fire) { const b = fire.userData.base * (fire.userData.boost || 1); fire.scale.set(b * (1 + Math.sin(ts / 90) * 0.05), b * (1 + Math.sin(ts / 70) * 0.12), b * (1 + Math.cos(ts / 90) * 0.05)); }
    if (focus) { const d = focus.clone().sub(controls.target); d.y = 0; d.multiplyScalar(Math.min(1, dt * 2.2)); controls.target.add(d); camera.position.add(d); }
    controls.update();
    renderer.render(scene, camera);
    updateLabels();
  }

  // ---------- 만나서 이야기하기 ----------
  function threatOf() {
    const G = GM(), c = G.city(cid); let best = null;
    (G.ADJ[cid] || []).forEach(id => { const n = G.city(id); if (n && n.owner && n.owner !== c.owner && (!best || n.soldiers > best.n.soldiers)) best = { id, n }; });
    return best && { name: G.CITY_INFO[best.id].name, fac: G.fac(best.n.owner).name, n: best.n.soldiers };
  }
  function ctx() {
    const G = GM(), S = G.S, c = G.city(cid), own = c.owner ? G.fac(c.owner) : null;
    return { G, S, c, F: own || G.fac(S.player), own, city: G.CITY_INFO[cid].name, sn: S.season, season: G.SEASONS[S.season], th: threatOf(), n: G.fmt, fac: own ? own.name : '주인 없는 성' };
  }
  const WARES = ['올리브기름', '무화과', '석류', '양털', '포도주', '보리', '구리 그릇', '베 옷감'];
  const OFF_LINES = {
    market: [
      X => `상업이 ${X.c.comm}이라 장터에 발길이 끊이지 않습니다. 계절마다 곳간에 금이 들어오니, 지금 금은 ${X.n(X.F.gold)}입니다.`,
      X => X.c.comm < 45 ? `아직 장터가 작습니다(상업 ${X.c.comm}). 상업에 힘쓰면 좌판이 늘고 들어오는 금도 늘어날 것입니다.` : `두로와 다메섹의 대상들이 이 성을 찾아옵니다. 상업 ${X.c.comm}이면 부끄럽지 않은 장터입니다.`,
      X => `민심이 ${X.c.loy}입니다. 백성의 마음이 편해야 장사도 잘됩니다. 민심이 낮으면 거두는 세금도 줄지요.`,
      '저울추를 속이는 자가 없도록 살피고 있습니다. "속이는 저울은 여호와께서 미워하시나 공평한 추는 그가 기뻐하시느니라"(잠 11:1)',
      X => `식량은 ${X.n(X.F.food)} 남았습니다. ${X.F.food < 3000 ? '곡식이 모자라면 구휼로 백성을 먹일 수 없으니 걱정입니다.' : '곳간이 넉넉하니 굶주린 이웃에게 구휼을 베풀 만합니다.'}`,
      X => X.sn === 3 ? '겨울이라 길이 험해 대상이 뜸합니다. 그래도 장은 서야지요.' : `${X.season} 장이 섰습니다. 기름과 포도주, 양털과 무화과가 오갑니다.`,
    ],
    farm: [
      X => [`봄비가 내렸으니 씨 뿌릴 때입니다. 지금 개간해 두면 가을 추수가 풍성해집니다. (농업 ${X.c.agri})`, `김매기가 한창입니다. 가을이면 농업 ${X.c.agri}만큼 곡식을 거두겠지요.`, `추수의 계절입니다! 이번 가을 곡식이 곳간에 들어갑니다. 지금 식량 ${X.n(X.F.food)}.`, `겨울에는 땅이 쉽니다. 쟁기를 고치며 봄을 기다리지요. 곳간 식량 ${X.n(X.F.food)}으로 병사 ${X.n(X.c.soldiers)}명을 먹여야 합니다.`][X.sn],
      X => `밭이 ${plotCount(X.c.agri)}뙈기입니다. 개간하면 밭이 늘고, 가을에 거두는 곡식도 늘어납니다.`,
      X => X.c.agri < 40 ? `농업이 ${X.c.agri}뿐이라 마음이 무겁습니다. 병사가 늘면 먹을 입도 늘어나니까요.` : `농업이 ${X.c.agri}입니다. 이 땅이 젖과 꿀이 흐르는 땅이 되어 가고 있습니다.`,
      '"땅이 있을 동안에는 심음과 거둠과 추위와 더위와 여름과 겨울과 낮과 밤이 쉬지 아니하리라"(창 8:22)',
      X => `가을 추수는 농사만이 아니라 인구와 민심에도 달렸습니다. 백성이 ${X.n(X.c.pop)}명, 민심은 ${X.c.loy}입니다.`,
    ],
    training: [
      X => `훈련이 ${X.c.train}입니다. ${X.c.train < 50 ? '아직 창끝이 흔들립니다. 더 조련해야 합니다.' : X.c.train < 80 ? '제법 대열이 잡혔습니다.' : '이만하면 어떤 적과도 겨룰 만합니다!'}`,
      X => `병사 ${X.n(X.c.soldiers)}명이 이 성을 지킵니다. ${X.th ? `${X.th.name}에 ${X.th.fac} 군사 ${X.n(X.th.n)}명이 있으니 방심할 수 없습니다.` : '가까이에 큰 적은 보이지 않습니다.'}`,
      '새로 뽑은 병사는 창 잡는 법도 모릅니다. 징병한 뒤에는 꼭 훈련을 시키십시오.',
      X => `징병하면 병력은 늘지만 민심이 떨어집니다. 지금 민심은 ${X.c.loy}입니다.`,
      '"여호와께서 내 손을 가르쳐 싸우게 하시며"(시 144:1) — 오늘도 칼을 갈고 있습니다.',
      X => X.c.def < 45 ? `성벽이 ${X.c.def}로 낮습니다. 성을 지키려면 병사만큼 성벽도 중요합니다.` : `성벽 ${X.c.def}에 훈련 ${X.c.train} — 성을 지키기엔 모자람이 없습니다.`,
    ],
    temple: [
      X => `신앙이 ${X.c.faith}입니다. ${X.c.faith < 50 ? '백성의 마음이 식어 가니 제사를 드려야 하겠습니다.' : '백성이 여호와를 경외하니 성이 평안합니다.'}`,
      '신앙은 계절마다 조금씩 식습니다. 신앙이 높으면 민심도 따라 오르니 꾸준히 제사를 드려야 합니다.',
      '"제단 위에 불은 항상 피워 꺼지지 않게 할지니라"(레 6:13) — 오늘도 번제를 올렸습니다.',
      '싸움에 나갈 때 선지자나 제사장이 함께 가면 군대가 힘을 얻습니다.',
      '"여호와를 경외하는 것이 지혜의 근본이요 거룩하신 자를 아는 것이 명철이니라"(잠 9:10)',
      X => X.sn === 2 ? '추수를 마치면 초막절이 옵니다. 곡식을 거두게 하신 분께 감사를 드려야지요.' : X.sn === 0 ? '봄에는 유월절을 지킵니다. 애굽에서 건지신 날을 잊지 말아야지요.' : null,
    ],
    palace: [
      X => `민심이 ${X.c.loy}입니다. ${X.c.loy < 40 ? '민심이 더 떨어지면 민란이 일어날까 두렵습니다. 구휼을 베푸소서.' : '백성이 기꺼이 따르고 있습니다.'}`,
      X => X.th ? `${X.th.name}에 ${X.th.fac} 군사 ${X.n(X.th.n)}명이 모여 있다 합니다. 우리 성벽은 ${X.c.def}, 병력은 ${X.n(X.c.soldiers)}입니다.` : '사방이 잠잠합니다. 이럴 때 내실을 다져 두소서.',
      X => `${X.G.yearLabel()}, 백성 ${X.n(X.c.pop)}명, 금 ${X.n(X.F.gold)}, 식량 ${X.n(X.F.food)}. 나라 살림이 이러합니다.`,
      X => X.G.freeIn(cid).length ? '이 성 근처에 아직 어느 편도 섬기지 않는 인물이 있다는 소문이 들립니다. 인재를 찾아보시지요.' : '인재는 나라의 기둥입니다. 때때로 재야를 살펴 숨은 인물을 찾으소서.',
      X => `성벽을 보수하려면 목재와 석재가 듭니다. 지금 목재 ${X.n(X.F.wood || 0)}, 석재 ${X.n(X.F.stone || 0)}입니다.`,
    ],
  };
  const RULER_LINES = [
    (X, o) => `나는 ${X.fac}의 ${o.name}이라. 이 ${X.city} 성을 여호와의 뜻대로 다스리려 하노라.`,
    X => `${X.season}이 깊어 가는구나. 백성이 배불리 먹고 있는지 늘 마음이 쓰이노라.`,
    X => X.th ? `${X.th.name}에 ${X.th.fac} 군사 ${X.n(X.th.n)}명이 모였다 하니, 성벽(${X.c.def})과 군사(${X.n(X.c.soldiers)})를 살피라.` : '사방이 잠잠하니 이때에 나라의 기초를 든든히 하리라.',
    X => `이 성 백성이 ${X.n(X.c.pop)}명이라. 민심이 ${X.c.loy}이니 ${X.c.loy < 40 ? '내 마음이 무겁도다. 곳간을 열어 구휼하리라.' : '감사할 일이로다.'}`,
    X => `곳간에 금 ${X.n(X.F.gold)}, 식량 ${X.n(X.F.food)}이 있도다. 헛되이 쓰지 말고 백성을 위해 쓰라.`,
    '"지혜를 얻는 것이 금을 얻는 것보다 얼마나 나은고"(잠 16:16) — 그대의 생각을 들려주오.',
  ];
  const ENEMY_LINES = [
    X => `이곳은 ${X.fac}의 땅이오. 무슨 일로 오셨소?`,
    X => `우리 성벽은 ${X.c.def}, 병사는 ${X.n(X.c.soldiers)}명이오. 쉽게 넘볼 생각은 마시오.`,
    X => `우리 군사의 훈련은 ${X.c.train}이오. 얕보다가는 큰코다칠 것이오.`,
    '사신이라면 궁으로 가시오. 첩자라면… 조용히 돌아가는 편이 좋을 것이오.',
  ];
  const NPC_LINES = {
    merchant: [
      X => `어서 오십시오! 오늘 들어온 ${pick(Math.random, WARES)}, 한번 보고 가십시오.`,
      X => `상업이 ${X.c.comm}이 되니 손님이 부쩍 늘었습니다. 좌판을 하나 더 낼까 합니다.`,
      X => X.c.loy < 45 ? '요즘 인심이 흉흉해서 손님이 줄었습니다. 성주께서 백성을 좀 돌봐 주시면 좋으련만.' : '요즘은 인심이 넉넉해서 외상도 잘 갚습니다. 다 성주님 덕이지요.',
      X => X.sn === 3 ? '겨울엔 대상이 뜸해서 물건값이 오릅니다.' : X.sn === 2 ? '가을 추수 뒤엔 곡식값이 내려가지요. 지금이 사 둘 때입니다.' : '봄여름엔 길이 좋아 먼 데 물건이 많이 들어옵니다.',
      '장사는 신용이지요. 저는 저울추를 두 개씩 가지고 다니지 않습니다.',
    ],
    camel: [
      X => `다메섹에서 애굽까지 왕의 대로를 따라 다닙니다. 이 성 장터는 ${X.c.comm >= 50 ? '쉬어 갈 만합니다.' : '아직 작아서 오래 머물지는 않지요.'}`,
      '낙타는 물 없이도 며칠을 걷습니다. 사막 길이라면 제게 맡기십시오.',
      '바닷가에 항구가 있는 성은 교역으로 금이 더 들어온다더군요.',
      X => X.th ? `오는 길에 ${X.th.name} 쪽에서 군사들이 모이는 걸 봤습니다. 조심하십시오.` : '오는 길은 평안했습니다. 도적 떼도 요즘은 잠잠하더군요.',
    ],
    farmer: [
      X => ['봄에 씨를 뿌려야 가을에 거둡니다. 개간을 하면 밭이 늘어나지요.', '여름 볕에 잡초가 무성합니다. 김을 매야 이삭이 여뭅니다.', '추수입니다! 올해 곡식은 가을에 한꺼번에 곳간으로 들어갑니다.', '겨울엔 밭을 쉬게 하고 쟁기를 손봅니다. 봄이 오면 다시 바빠지지요.'][X.sn],
      X => `농업이 ${X.c.agri}입니다. 가을에 거두는 곡식은 농사만이 아니라 인구와 민심에도 달렸답니다.`,
      '밭 모퉁이는 다 거두지 않고 가난한 이와 나그네를 위해 남겨 둡니다(레 19:9).',
      X => X.F.food < 3000 ? '곳간이 비어 간다는 소문이 돕니다. 병사가 많으면 식량이 금방 줄지요.' : '곳간이 넉넉하다니 마음이 놓입니다.',
    ],
    shepherd: [
      '양들은 제 목소리를 압니다. 불러 보면 다 따라오지요.',
      '들에 사자와 곰이 나와도 양은 제가 지킵니다(삼상 17:34).',
      X => X.sn === 3 ? '겨울엔 풀이 모자라 양들을 멀리까지 끌고 다닙니다.' : '풀이 좋아 양들이 살이 올랐습니다.',
      '"여호와는 나의 목자시니 내게 부족함이 없으리로다"(시 23:1)',
    ],
    smith: [
      '창과 방패를 벼리고 있습니다. 병영이 커지면 더 좋은 전쟁 도구를 만들 수 있지요.',
      '예전엔 블레셋 사람만 쇠를 다뤄서, 우리는 괭이 하나 벼리러 그들에게 갔답니다(삼상 13:19-20).',
      X => `훈련이 ${X.c.train}이라 창끝이 금방 무뎌집니다. ${X.c.train >= 60 ? '그만큼 열심히들 하는 게지요.' : '더 세게 조련하셔도 칼은 제가 대겠습니다.'}`,
      '공성 사다리와 충차에는 목재가, 물매 돌에는 석재가 든답니다.',
    ],
    soldier: [
      X => `훈련 ${X.c.train}! ${X.c.train < 50 ? '아직 발이 안 맞아 교관께 혼나고 있습니다.' : '대열이 흐트러지지 않습니다!'}`,
      X => X.th ? `${X.th.name}의 적이 ${X.n(X.th.n)}명이라 들었습니다. 언제든 싸울 준비가 되어 있습니다.` : '적이 오면 이 창으로 막아 내겠습니다!',
      '새로 들어온 신병은 훈련이 낮아 부대 전체의 훈련이 떨어집니다. 징병 뒤엔 꼭 훈련을!',
      X => `이 성 병력은 ${X.n(X.c.soldiers)}명입니다. 식량만 넉넉하면 싸울 맛이 나지요.`,
    ],
    watch: [
      X => X.c.def < 45 ? `성벽이 낮으면 적이 사다리 하나로 넘어옵니다. 성벽을 보수해 주십시오. (성벽 ${X.c.def})` : `성벽이 ${X.c.def}이니 적이 쉽게 오르지 못할 것입니다.`,
      X => X.th ? `성벽 위에서 보면 ${X.th.name} 쪽이 수상합니다. ${X.th.fac} 군사가 ${X.n(X.th.n)}명이라더군요.` : '오늘도 성문 밖은 조용합니다. 나그네와 상인만 오갑니다.',
      '"여호와께서 성을 지키지 아니하시면 파수꾼의 깨어 있음이 헛되도다"(시 127:1)',
      X => { const w = X.G.CMDS.wall.cost; return `성벽을 보수하려면 목재 ${w.wood}와 석재 ${w.stone}이 듭니다. 지금 목재 ${X.n(X.F.wood || 0)}, 석재 ${X.n(X.F.stone || 0)}입니다.`; },
    ],
    priest: [
      X => `이 성의 신앙은 ${X.c.faith}입니다. ${X.c.faith < 50 ? '제단의 불이 약해졌습니다. 제사를 드려 주십시오.' : '제단의 불길이 힘차게 타오릅니다.'}`,
      '성전을 높이 지으면 제사의 효험이 더해지고, 계절마다 신앙이 절로 오릅니다.',
      '신앙이 높으면 민심이 오르고, 민심이 높으면 세금과 곡식이 늘어납니다.',
      X => X.sn === 0 ? '곧 유월절입니다. 흠 없는 어린양을 준비하고 있습니다.' : X.sn === 2 ? '추수 뒤 초막절에는 온 성이 초막을 짓고 감사를 드립니다.' : '"여호와께 감사하라 그는 선하시며 그 인자하심이 영원함이로다"(시 136:1)',
    ],
    child: [
      '장터에 가면 무화과를 얻어먹을 수 있어요!',
      X => X.th ? `아빠가 그러는데 ${X.th.name}에 적군이 있대요. 무서워요…` : '우리 아빠는 훈련장에서 창 쓰는 법을 배워요!',
      X => X.sn === 3 ? '겨울이라 손이 시려요. 그래도 양털 옷이 있어서 괜찮아요.' : X.sn === 1 ? '여름엔 우물가가 제일 시원해요!' : '양 떼 보러 성 밖에 나가고 싶어요!',
      '다윗은 물맷돌 하나로 골리앗을 이겼대요! 저도 연습하고 있어요.',
    ],
    woman: [
      X => X.sn === 1 ? '여름이라 우물 물이 줄었어요. 아침 일찍 길으러 나와야 해요.' : '물 길으러 왔어요. 이 우물은 할아버지의 할아버지 때부터 있었대요.',
      X => X.c.loy >= 60 ? '요즘은 인심이 좋아서 이웃끼리 떡을 나눠 먹어요.' : '요즘 인심이 흉흉해서 다들 문을 걸어 잠가요. 구휼이라도 베풀어 주시면…',
      '곳간을 열어 구휼하시면 백성들 마음이 금방 돌아온답니다.',
      X => `이 성에 사는 사람이 ${X.n(X.c.pop)}명이래요. 민심이 좋으면 사람이 더 모여들지요.`,
    ],
    folk: [
      X => X.c.loy >= 60 ? '성주님 덕분에 평안히 지냅니다.' : '살기가 팍팍합니다. 세금은 늘고 곡식은 모자라고요.',
      X => `${X.season}이네요. ${['밭에 씨를 뿌리느라 다들 바빠요.', '포도가 익어 가요.', '올리브를 딸 때가 되었어요.', '비가 넉넉히 와야 할 텐데요.'][X.sn]}`,
      X => X.c.faith < 45 ? '요즘은 제단에 가는 사람이 줄었어요.' : '안식일마다 제단에 사람이 가득해요.',
      '장터에 새 물건이 들어왔대요. 한번 가 봐야겠어요.',
    ],
  };
  const nameOf = a => a.o ? a.o.name : a.meet ? `${ROLE_NAME[a.meet.role]} ${a.meet.name}` : '';
  function lineFor(a) {
    const X = ctx(), o = a.o;
    const pool = o ? (o.fac !== X.S.player ? ENEMY_LINES : X.F.ruler === o.id ? RULER_LINES : OFF_LINES[a.post] || OFF_LINES.palace) : NPC_LINES[a.meet.role] || NPC_LINES.folk;
    const list = pool.map(f => (typeof f === 'function' ? f(X, o) : f)).filter(Boolean).filter(s => s !== a.line);
    return list.length ? pick(Math.random, list) : a.line || '…';
  }
  function talk(a) {
    if (!open || !a || !actors.includes(a) || a === walker) return;
    if (busy) { GM().toast('명령을 수행하는 중입니다.'); return; }
    if (walker && walker.g.position.distanceTo(a.g.position) > 4) { // 걷기 중이면 먼저 다가간다
      const P = a.g.position, dir = walker.g.position.clone().sub(P).setY(0).normalize();
      walker.kbd = false; walker.face = null; walker.goTo(P.clone().addScaledVector(dir, 1.8).setY(0), () => talk(a), 5.5); return;
    }
    if (talkA && talkA !== a) release(talkA);
    if (talkA !== a) { a.prevMode = a.mode; a.prevFace = a.face; }
    talkA = a; a.path = []; a.onArrive = null; a.mode = 'talk'; a.g.position.y = 0;
    const V = walker ? walker.g.position : camera.position, P = a.g.position;
    a.face = Math.atan2(V.x - P.x, V.z - P.z);
    if (walker) walker.face = Math.atan2(P.x - V.x, P.z - V.z); else glideTo(P, 19);
    showTalk(a);
  }
  function release(a) { a.mode = a.prevMode && a.prevMode !== 'talk' ? a.prevMode : 'idle'; a.face = a.prevFace ?? null; a.wait = 1 + Math.random() * 2; }
  function closeTalk() {
    if (talkA) { const a = talkA; talkA = null; release(a); }
    const el = $('#townTalk'); if (el) el.hidden = true;
    $('#town').classList.remove('talking');
  }
  function showTalk(a, view) {
    const G = GM(), S = G.S, o = a.o, el = $('#townTalk');
    const mine = !!o && o.fac === S.player && G.city(cid).owner === S.player;
    if (!view) a.line = lineFor(a);
    const art = o ? G.portraitOf(o) : window.PORTRAIT ? PORTRAIT.portrait({ name: a.meet.name + a.meet.role, war: a.meet.pr === 'warrior' ? 70 : 45, int: 55 }, { role: a.meet.pr, color: '#6b6250' }) : '';
    const sub = o ? `${POSTS[a.post] ? POSTS[a.post].name : G.CITY_INFO[cid].name} · ${G.facName(o.fac)}${o.done && mine ? ' · 이번 계절 명령 완료' : ''}` : `${G.CITY_INFO[cid].name}의 ${ROLE_NAME[a.meet.role]}`;
    let btns;
    if (view === 'cmd') {
      btns = (POSTS[a.post] ? POSTS[a.post].cmds : []).map(k => `<button class="cmd" data-tk="${k}"><b>${G.CMDS[k].label}</b><small>${G.CMDS[k].hint}</small></button>`).join('') + '<button class="btn" data-tt="back">뒤로</button>';
    } else {
      btns = (o ? `${mine ? `<button class="btn primary" data-tt="cmd"${o.done ? ' disabled' : ''}>${o.done ? '명령 완료' : '이 장수에게 명령'}</button>` : ''}<button class="btn" data-tt="bio">인물 정보</button>` : '') +
        '<button class="btn" data-tt="more">다른 이야기</button><button class="btn" data-tt="close">닫기</button>';
    }
    el.innerHTML = `<div class="tt-art">${art}</div><div class="tt-body"><p class="tt-who"><b>${G.esc(nameOf(a))}</b><small>${G.esc(sub)}</small></p>
      <p class="tt-line">${view === 'cmd' ? '「무엇을 맡기시겠습니까?」' : `「${G.esc(a.line)}」`}</p><div class="tt-btns${view === 'cmd' ? ' tt-cmds' : ''}">${btns}</div></div>`;
    el.hidden = false; $('#town').classList.add('talking');
  }

  // ---------- 누르기 (인물 선택 / 걷기 이동) ----------
  function tap(cx, cy) {
    if (!open || busy) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const cands = actors.filter(a => (a.o || a.meet) && a !== walker);
    let hit = null;
    const hits = ray.intersectObjects(cands.map(a => a.g), true);
    if (hits.length) { let o = hits[0].object; while (o && !(o.userData && o.userData.actor)) o = o.parent; hit = o && o.userData.actor; }
    if (!hit) { // 손가락으로도 누르기 쉽게: 화면에서 가까운 인물
      let bd = coarse ? 34 : 22;
      cands.forEach(a => {
        tmp.copy(a.g.position).setY(1.1 * a.g.scale.y); tmp.project(camera); if (tmp.z > 1) return;
        const d = Math.hypot((tmp.x * 0.5 + 0.5) * r.width + r.left - cx, (-tmp.y * 0.5 + 0.5) * r.height + r.top - cy);
        if (d < bd) { bd = d; hit = a; }
      });
    }
    if (hit) return talk(hit);
    if (walker && ray.ray.intersectPlane(groundPl, tmp2) && Math.hypot(tmp2.x, tmp2.z) < 110) {
      closeTalk(); walker.kbd = false; walker.face = null; walker.goTo(tmp2.clone().setY(0), null, 5.5); marker(tmp2);
    } else if (talkA) closeTalk();
  }
  function marker(p) {
    const m = mesh(GEO.torus, basic('#ffd978'), 1, 1, 1, false); m.rotation.x = P2; m.position.set(p.x, 0.12, p.z); scene.add(m);
    tween(0.7, k => m.scale.setScalar(1 + k * 2.5), () => scene.remove(m));
  }

  // ---------- 걷기 모드 ----------
  function walkerPick() {
    const G = GM(), S = G.S, c = G.city(cid);
    if (c.owner === S.player) {
      for (const id of [S.hero && S.hero.id, G.fac(S.player).ruler]) if (id && officerActors.has(id)) return officerActors.get(id);
      if (officerActors.size) return officerActors.values().next().value;
    }
    return null;
  }
  function startWalk() {
    if (walker || busy || !open) return;
    closeTalk();
    let a = walkerPick();
    if (!a) { // 남의 성이나 장수가 없는 성: 나그네로 걷는다
      const g = person(Object.assign(villagerLook(Math.random), { staff: true, cloak: GM().fac(GM().S.player).color, scale: 1.15 }));
      g.position.set(0, 0, R - 4); a = addActor(g, { kind: 'traveler', speed: 5 }); walkTemp = true;
    }
    walker = a; a.path = []; a.onArrive = null; a.mode = 'ctl'; a.face = null; a.g.position.y = 0;
    if (controls.enablePan !== undefined) { controls.minDistance = 5; controls.maxDistance = 45; controls.enablePan = false; }
    const P = a.g.position.clone().setY(1.6), dir = camera.position.clone().sub(controls.target).setY(0);
    if (dir.lengthSq() < 0.01) dir.set(0, 0, 1); dir.normalize();
    glideCam(P, P.clone().addScaledVector(dir, 12).setY(14));
    $('#town').classList.add('walking'); $('#townWalk').classList.add('on'); $('#townWalk').textContent = '걷기 끝'; $('#townJoy').hidden = false;
    GM().toast(`${a.o ? a.o.name : '나그네'} — ${coarse ? '조이스틱이나 땅을 눌러' : '방향키·WASD나 땅을 눌러'} 걸어 보세요`);
  }
  function stopWalk(quiet) {
    if (!walker) return;
    const a = walker; walker = null;
    if (walkTemp) removeActor(a); else { a.path = []; a.kbd = false; a.mode = a.o ? 'post' : 'idle'; a.wait = 0; a.face = null; }
    walkTemp = false; keys = {}; joy.x = joy.y = 0; nearA = null;
    if (controls.enablePan !== undefined) { controls.minDistance = 14; controls.maxDistance = 170; controls.enablePan = true; }
    $('#town').classList.remove('walking'); $('#townWalk').classList.remove('on'); $('#townWalk').textContent = '걷기';
    $('#townJoy').hidden = true; $('#townTalkBtn').hidden = true;
    const k = $('#townJoy i'); if (k) k.style.transform = '';
    if (!quiet) overview();
  }
  function overview() { glideCam(v(0, 0, 4), v(0, 60, 86)); }
  function walkInput() {
    const a = walker; if (!a) return;
    let ix = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + joy.x, iy = (keys.u ? 1 : 0) - (keys.d ? 1 : 0) + joy.y;
    const m = Math.hypot(ix, iy);
    if (m > 0.15) {
      if (m > 1) { ix /= m; iy /= m; }
      if (talkA) closeTalk();
      fw.copy(controls.target).sub(camera.position).setY(0).normalize();
      const dx = fw.x * iy - fw.z * ix, dz = fw.z * iy + fw.x * ix, sp = 5.5 * Math.min(1, m);
      a.speed = sp; a.onArrive = null; a.face = null; a.kbd = true;
      a.path = [v(a.g.position.x + dx * sp * 0.12, 0, a.g.position.z + dz * sp * 0.12)];
    } else if (a.kbd) { a.path = []; a.kbd = false; }
  }
  function collide(P) {
    const r = Math.hypot(P.x, P.z);
    if (Math.abs(r - R) < 1.3 && Math.abs(P.x) > 1.4) { const k = (r < R ? R - 1.3 : R + 1.3) / r; P.x *= k; P.z *= k; } // 성벽 (성문만 열려 있다)
    if (r > 110) { P.x *= 110 / r; P.z *= 110 / r; }
    solids.forEach(s => {
      if (s.r) { const dx = P.x - s.x, dz = P.z - s.z, d = Math.hypot(dx, dz), m = s.r + 0.35; if (d < m && d > 0.001) { P.x = s.x + dx / d * m; P.z = s.z + dz / d * m; } return; }
      const x0 = s.x0 - 0.35, x1 = s.x1 + 0.35, z0 = s.z0 - 0.35, z1 = s.z1 + 0.35;
      if (P.x > x0 && P.x < x1 && P.z > z0 && P.z < z1) {
        const o = [[P.x - x0, 'x', x0], [x1 - P.x, 'x', x1], [P.z - z0, 'z', z0], [z1 - P.z, 'z', z1]].sort((a, b) => a[0] - b[0])[0];
        P[o[1]] = o[2];
      }
    });
  }
  function walkAfter(dt) {
    const a = walker, P = a.g.position;
    const bx = P.x, bz = P.z; collide(P);
    if (a.path.length && !a.kbd) { // 눌러서 가는 길이 막히면 멈춘다
      const moved = Math.hypot(P.x - (a.lx ?? P.x), P.z - (a.lz ?? P.z));
      a.stuck = moved < a.speed * dt * 0.3 || Math.hypot(P.x - bx, P.z - bz) > 0.001 && moved < 0.02 ? (a.stuck || 0) + dt : 0;
      if (a.stuck > 0.5) { a.path = []; a.onArrive = null; a.stuck = 0; }
    }
    a.lx = P.x; a.lz = P.z;
    fw.set(P.x - controls.target.x, 1.6 - controls.target.y, P.z - controls.target.z).multiplyScalar(Math.min(1, dt * 6));
    controls.target.add(fw); camera.position.add(fw);
    nearT -= dt;
    if (nearT <= 0) {
      nearT = 0.2; let best = null, bd = 3.6;
      actors.forEach(x => { if (x === a || !(x.o || x.meet)) return; const d = x.g.position.distanceTo(P); if (d < bd) { bd = d; best = x; } });
      if (best !== nearA) {
        nearA = best; const b = $('#townTalkBtn'); b.hidden = !best;
        if (best) b.innerHTML = `<b>대화</b><small>${GM().esc(nameOf(best))}</small>`;
      }
    }
  }

  // ---------- 명령 연출 ----------
  function pathLen(a, pts) { let L = 0, p = a; pts.forEach(q => { L += Math.hypot(q.x - p.x, q.z - p.z); p = q; }); return L; }
  function onCommand(o, cityId, key, r) {
    if (!open || cityId !== cid) return false;
    act(o, key, r); return true;
  }
  function act(o, key, r) {
    closeTalk(); stopWalk(true);
    setBusy(true);
    let a = officerActors.get(o.id);
    if (!a) { syncOfficers(); a = officerActors.get(o.id); }
    const spot = SPOT[key].clone();
    if (camera.position.distanceTo(controls.target) < 30) glideTo(spot, 42); // 대화하느라 가까이 있었으면 한 걸음 물러나 본다
    else focus = spot.clone();
    const pts = route(a.g.position, spot);
    a.mode = 'idle'; a.face = null;
    a.goTo(spot, () => {
      a.face = FACE[key];
      perform(key, a, r, () => {
        floatText(spot, `${o.name} · ${r.msg}`, 'good');
        refreshParts(key, r);
        a.mode = 'idle'; a.face = 0;
        wait(reduce ? 0.05 : 0.9, () => {
          a.goTo(a.home, () => { a.mode = 'post'; a.face = a.postFace; a.wait = 0.5; }, 8);
          setBusy(false); focus = null; GM().render(); GM().checkStory();
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
        for (let i = 0; i < add; i++) {
          const g = person(villagerLook(Math.random)); g.position.set((Math.random() - 0.5) * 3, 0, R + 10 + i * 1.5);
          const x = addActor(g, { mode: 'idle', kind: 'recruit' });
          x.goTo(slotPos(Math.min(47, have + i)), null, 9);
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
          wait(reduce ? 0.4 : 4.4, () => { removeActor(x); syncOfficers({ id: o.id, pos: v(0, 0, R + 9) }); const na = officerActors.get(o.id); if (na) na.goTo(na.home, () => { na.face = na.postFace; }, 8); done(); });
        } else { floatText(v(0, 0, R + 12), '…', ''); wait(D, done); }
        break;
      }
      default: wait(D, done);
    }
  }

  function refreshParts(key) {
    const c = GM().city(cid);
    if (key === 'agri' && plotCount(c.agri) !== seen.agri) { buildFields(c.agri, true); seen.agri = plotCount(c.agri); syncOfficers(); }
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
    $('#townRes').innerHTML = `<span class="stat"><b>${Gm.yearLabel()}</b></span><span class="stat"><b>금</b>${Gm.fmt(F.gold)}</span><span class="stat"><b>식량</b>${Gm.fmt(F.food)}</span><span class="stat"><b>목재</b>${Gm.fmt(F.wood || 0)}</span><span class="stat"><b>석재</b>${Gm.fmt(F.stone || 0)}</span>`;
    const st = [['병력', Gm.fmt(c.soldiers)], ['인구', Gm.fmt(c.pop)], ['농업', c.agri], ['상업', c.comm], ['성벽', c.def], ['훈련', c.train], ['민심', c.loy], ['신앙', c.faith]];
    $('#townStats').innerHTML = st.map(([k, val]) => `<span><b>${k}</b>${val}</span>`).join('');
    const offs = owner ? Gm.offsIn(cid, owner) : [];
    let h = `<div class="t-offs">${offs.length ? offs.map(o => { const a = officerActors.get(o.id), where = a && POSTS[a.post] ? POSTS[a.post].name : ''; return `<button class="t-card${o.done && mine ? ' done' : ''}" data-bio="${o.id}" title="${Gm.esc(o.name)} — 만나기"><span class="thumb">${Gm.portraitOf(o)}</span><b>${Gm.esc(o.name)}</b><small>${mine ? (o.done ? '완료' : where || '대기') : '무' + o.war + ' 지' + o.int}</small></button>`; }).join('') : '<p class="mute">머무는 장수가 없다.</p>'}</div>`;
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
    hudVars();
  }
  function setBusy(b) { busy = b; const d = $('#townDock'); if (d) d.classList.toggle('busy', b); document.querySelectorAll('.tl-bld.act').forEach(e => { e.disabled = b; }); const w = $('#townWalk'); if (w) w.disabled = b; }

  function runCmd(key) {
    if (busy) return;
    closeTalk();
    if (key === 'attack' || key === 'move' || key === 'diplo') { exit(); GM().sel = cid; GM().onCmd(key); return; }
    GM().sel = cid; GM().onCmd(key);
  }

  // ---------- 진입·퇴장 ----------
  function enter(id) {
    if (!renderer) init();
    cid = id; open = true; busy = false; focus = null;
    $('#town').hidden = false;
    document.body.classList.add('in-town');
    if (window.SND) SND.bgm('land');
    resize();
    build();
    renderHud();
    setBusy(false);
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function exit(silent) {
    if (!open) return;
    closeTalk(); stopWalk(true);
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

  const KEYMAP = { w: 'u', arrowup: 'u', s: 'd', arrowdown: 'd', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r' };
  function bind() {
    $('#townBack').addEventListener('click', () => exit());
    $('#townEnd').addEventListener('click', () => { if (!busy) { closeTalk(); GM().askEndTurn(); } });
    $('#townDock').addEventListener('click', e => {
      const b = e.target.closest('[data-tcmd]'); if (b) return runCmd(b.dataset.tcmd);
      const bio = e.target.closest('[data-bio]');
      if (bio) { const a = officerActors.get(bio.dataset.bio); if (a && !busy) talk(a); else GM().showBio(bio.dataset.bio); }
    });
    $('#townReset').addEventListener('click', () => { closeTalk(); if (walker) stopWalk(); else overview(); });
    $('#townWalk').addEventListener('click', () => { if (walker) stopWalk(); else startWalk(); });
    $('#townTalkBtn').addEventListener('click', () => { if (nearA) talk(nearA); });
    $('#townTalk').addEventListener('click', e => {
      const a = talkA; if (!a) return;
      const k = e.target.closest('[data-tk]');
      if (k) { const o = a.o; closeTalk(); GM().sel = cid; if (GM().cmdWith) GM().cmdWith(k.dataset.tk, o.id); else GM().onCmd(k.dataset.tk); return; }
      const b = e.target.closest('[data-tt]'); if (!b || b.disabled) return;
      const t = b.dataset.tt;
      if (t === 'cmd') showTalk(a, 'cmd'); else if (t === 'back') showTalk(a, 'keep'); else if (t === 'bio') GM().showBio(a.o.id); else if (t === 'more') showTalk(a); else closeTalk();
    });
    // 조이스틱 (휴대폰)
    const J = $('#townJoy'), knob = $('#townJoy i'); let jid = null;
    const jMove = e => {
      const r = J.getBoundingClientRect(), h = r.width / 2; let x = (e.clientX - r.left - h) / h, y = (e.clientY - r.top - h) / h; const m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; } joy.x = x; joy.y = -y; knob.style.transform = `translate(${x * h * 0.55}px, ${y * h * 0.55}px)`;
    };
    J.addEventListener('pointerdown', e => { jid = e.pointerId; try { J.setPointerCapture(jid); } catch (err) { /* 무시 */ } jMove(e); e.preventDefault(); });
    J.addEventListener('pointermove', e => { if (e.pointerId === jid) jMove(e); });
    const jEnd = e => { if (e.pointerId !== jid) return; jid = null; joy.x = joy.y = 0; knob.style.transform = ''; };
    J.addEventListener('pointerup', jEnd); J.addEventListener('pointercancel', jEnd);
    // 걷기 키보드
    const typing = e => e.target && e.target.closest && e.target.closest('input, select, textarea');
    document.addEventListener('keydown', e => {
      if (!open || !walker || !$('#modal').hidden || typing(e)) return;
      const k = KEYMAP[e.key.toLowerCase()];
      if (k) { keys[k] = true; e.preventDefault(); return; }
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') && nearA && !talkA) { talk(nearA); e.preventDefault(); }
    });
    document.addEventListener('keyup', e => { const k = KEYMAP[(e.key || '').toLowerCase()]; if (k) keys[k] = false; });
    window.addEventListener('blur', () => { keys = {}; });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !open || !$('#modal').hidden || !$('#heroView').hidden) return;
      if (talkA) closeTalk(); else if (walker) stopWalk(); else exit();
    });
  }

  bind();
  window.TOWN = { enter, exit, refresh, get open() { return open; }, get walkerPos() { return walker ? walker.g.position.toArray() : null; }, talk: id => { const a = officerActors.get(id); if (a) talk(a); }, walk: on => (on ? startWalk() : stopWalk()) };
  const hookUp = () => { if (window.GAME) { GAME.hooks.onCommand = onCommand; GAME.hooks.onRender = refresh; } else setTimeout(hookUp, 50); };
  hookUp();
})();
