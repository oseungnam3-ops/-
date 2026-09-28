// 성경 삼국지 — 3D 전장 (Three.js). tactics.js의 전투 상태(B)를 그대로 비춰 보여 준다.
// 지형 칸(풀밭·숲·언덕·강·여울·절벽·성벽·망루·성문·본영), 병종마다 다른 모양의 부대, 세력 깃발,
// 이동·공격·화살·손실, 그리고 화계의 불길·연기, 교란의 소용돌이, 기도의 빛기둥, 충차와 성문, 나팔·횃불 효과.
// 판정은 모두 tactics.js가 하고, 여기서는 보여 주기와 칸 누르기(레이캐스트)만 맡는다.
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const GM = () => window.GAME;
  if (!window.THREE) { window.TAC3D = { available: () => false, open() {}, close() {}, sync() {}, fx() {} }; return; }
  const T = THREE;
  const S = 2; // 한 칸 크기
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const v3 = (x, y, z) => new T.Vector3(x, y, z);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const TOP = { '.': 0.3, f: 0.3, h: 0.95, '~': 0.1, '=': 0.18, '#': 2.4, W: 2.3, T: 2.9, G: 0.3, t: 0.34, H: 0.36, R: 0.55 };
  const LOOK = {
    field: { sky: '#bcd6e4', fog: '#d8dcc8', ground: '#7f9a4c', far: '#8aa257' },
    valley: { sky: '#c7d3d8', fog: '#cfd0c4', ground: '#86934f', far: '#7d7a5c' },
    siege: { sky: '#d9d2bd', fog: '#e0d6bd', ground: '#a39463', far: '#a89a6c' },
  };

  // ---------- 공용 형상·재질 ----------
  const MATS = {};
  const mat = (c, o) => { const k = 'l' + c + (o ? JSON.stringify(o) : ''); return MATS[k] || (MATS[k] = new T.MeshLambertMaterial(Object.assign({ color: c }, o || {}))); };
  const hlMat = (c, op) => { const k = 'h' + c + op; return MATS[k] || (MATS[k] = new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false })); };
  const glow = (c, op = 0.9) => { const k = 'g' + c + op; return MATS[k] || (MATS[k] = new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false })); };
  const G = {
    box: new T.BoxGeometry(1, 1, 1), cyl: new T.CylinderGeometry(1, 1, 1, 8), cyl12: new T.CylinderGeometry(1, 1, 1, 14), cone: new T.ConeGeometry(1, 1, 7),
    cone4: new T.ConeGeometry(1, 1, 4), sph: new T.SphereGeometry(1, 10, 8), hemi: new T.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    bow: new T.TorusGeometry(0.22, 0.025, 4, 10, Math.PI), torus: new T.TorusGeometry(1, 0.06, 6, 40), thin: new T.TorusGeometry(1, 0.014, 4, 72), ring: new T.RingGeometry(0.72, 0.9, 28),
    disc: new T.CircleGeometry(0.9, 28), plane: new T.PlaneGeometry(1, 1), flag: new T.PlaneGeometry(0.62, 0.4, 4, 1), rock: new T.DodecahedronGeometry(1, 0),
    beam: new T.CylinderGeometry(0.9, 1.3, 16, 18, 1, true), flame: new T.ConeGeometry(0.22, 0.7, 6),
  };
  function mesh(geo, m, sx = 1, sy = 1, sz = 1, shadow = true) { const me = new T.Mesh(geo, m); me.scale.set(sx, sy, sz); me.castShadow = shadow; me.receiveShadow = false; return me; }
  function put(parent, o, x, y, z, ry = 0) { o.position.set(x, y, z); o.rotation.y = ry; parent.add(o); return o; }
  const shade = (hex, k) => { const c = new T.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
  const mix = (a, b, k) => { const c = new T.Color(a); c.lerp(new T.Color(b), k); return '#' + c.getHexString(); };
  // 캔버스 무늬(스프라이트): 물음표, 소용돌이, 빛
  const TEX = {};
  function tex(kind) {
    if (TEX[kind]) return TEX[kind];
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    if (kind === 'glow') { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,240,190,.7)'); g.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
    else if (kind === 'q') { x.font = 'bold 50px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 6; x.strokeStyle = '#2a0f4a'; x.strokeText('?', 32, 34); x.fillStyle = '#d9b8ff'; x.fillText('?', 32, 34); }
    else if (kind === 'swirl') { x.strokeStyle = '#c9a0ff'; x.lineWidth = 5; x.beginPath(); for (let a = 0; a < 12; a += 0.2) { const r = 2 + a * 2.4; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } x.stroke(); }
    else if (kind === 'smoke') { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(90,86,80,.85)'); g.addColorStop(0.6, 'rgba(110,104,96,.45)'); g.addColorStop(1, 'rgba(120,114,106,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
    else if (kind === 'fire') { const g = x.createRadialGradient(32, 38, 0, 32, 36, 30); g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(0.3, 'rgba(255,190,60,.95)'); g.addColorStop(0.7, 'rgba(240,80,20,.55)'); g.addColorStop(1, 'rgba(200,40,10,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
    const t = new T.CanvasTexture(c); TEX[kind] = t; return t;
  }
  const sprite = (kind, size, opts = {}) => { const s = new T.Sprite(new T.SpriteMaterial(Object.assign({ map: tex(kind), transparent: true, depthWrite: false }, opts))); s.scale.set(size, size, size); return s; };

  // ---------- 상태 ----------
  let renderer = null, scene, camera, controls, wrap, labels, flashEl, raf = 0, last = 0, now = 0;
  let B = null, api = null, board, hemi, sun;
  let extWalls = [], tiles = [], hls = [], squads = new Map(), anims = [], parts = [], floats = [], tileFire = new Map(), lootProps = [], gate = null, gateLabel = null, burnt = new Set();
  let ok = null, fitDist = 30, fitOff = 0, baseAz = 0;
  const wx = x => (x - (api.COLS - 1) / 2) * S, wz = y => (y - (api.ROWS - 1) / 2) * S;
  const topAt = (x, y) => TOP[B.map[y] && B.map[y][x]] ?? 0.3;

  function available() {
    if (ok != null) return ok;
    try { const c = document.createElement('canvas'); ok = !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { ok = false; }
    return ok;
  }

  // ---------- 틀 ----------
  function ensure() {
    if (renderer) return;
    wrap = document.createElement('div'); wrap.id = 't3';
    renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);
    labels = document.createElement('div'); labels.className = 't3-labels'; wrap.appendChild(labels);
    flashEl = document.createElement('div'); flashEl.className = 't3-flash'; wrap.appendChild(flashEl);
    $('#tField').appendChild(wrap);
    camera = new T.PerspectiveCamera(40, 1, 0.5, 400);
    controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.12; controls.screenSpacePanning = false;
    controls.minPolarAngle = 0.28; controls.maxPolarAngle = 1.18; controls.rotateSpeed = 0.6;
    controls.addEventListener('change', clampTarget);
    // 누르기: 끌지 않고 짧게 누르면 칸/부대를 고른다
    let down = null;
    const el = renderer.domElement;
    el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; });
    el.addEventListener('pointerup', e => { if (!down || down.id !== e.pointerId) return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null; if (d < 10 && dt < 600) pick(e.clientX, e.clientY); });
    window.addEventListener('resize', () => { if (B && wrap.style.display !== 'none') resize(true); });
  }
  function clampTarget() {
    const t = controls.target, lim = { x: api ? api.COLS * S / 2 : 11, z: api ? api.ROWS * S / 2 : 9 };
    t.x = Math.max(-lim.x, Math.min(lim.x, t.x)); t.z = Math.max(-lim.z, Math.min(lim.z, t.z)); t.y = Math.max(0, Math.min(3, t.y));
  }
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  function pick(cx, cy) {
    if (!B || !api) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const prox = [...squads.values()].filter(s => !s.gone && !s.u.dead).map(s => s.proxy);
    let hit = ray.intersectObjects(prox, false)[0];
    if (hit) { const u = hit.object.userData.u; return api.tap(u.x, u.y); }
    hit = ray.intersectObjects(tiles.map(t => t.block), false)[0];
    if (hit) { const { x, y } = hit.object.userData; api.tap(x, y); }
  }

  // ---------- 열기 · 닫기 ----------
  function open(b, a) {
    if (!available()) return;
    B = b; api = a; ensure();
    wrap.style.display = '';
    build();
    resize(false);
    last = performance.now();
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function close() {
    if (raf) cancelAnimationFrame(raf); raf = 0;
    if (wrap) { wrap.style.display = 'none'; labels.innerHTML = ''; wrap.querySelectorAll('.t3-sun').forEach(e => e.remove()); }
    gateLabel = null; gate = null; parted = null; sunFx = null; camBusy = false; shakeT = 0; if (controls) controls.enabled = true;
    squads.forEach(s => s.label.remove()); squads.clear();
    anims = []; parts = []; floats = []; tileFire.clear(); lootProps = []; burnt = new Set();
    if (scene) scene.traverse(o => { if (o.material && o.material.map && !Object.values(TEX).includes(o.material.map)) o.material.map.dispose(); });
    scene = null;
  }
  function resize(keep) {
    const w = wrap.clientWidth || window.innerWidth, h = wrap.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
    camera.aspect = w / h; camera.updateProjectionMatrix();
    fit(keep);
  }
  // 전장이 화면에 꼭 차도록 거리를 잡는다. 세로 화면이면 공격군이 아래, 수비군이 위에 오도록 옆에서 본다.
  function fit(keep) {
    const portrait = camera.aspect < 0.9;
    baseAz = portrait ? -Math.PI / 2 : 0;
    const polar = portrait ? 0.5 : 0.8;
    const corners = [];
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => [0, 2.6].forEach(y => corners.push(v3(sx * api.COLS * S / 2, y, sz * api.ROWS * S / 2)))));
    // 화면 위아래 틀(상단 막대·하단 단추)을 피해 가장 크게 보이는 거리와 중심을 찾는다
    const place = (d, off) => { const t = portrait ? v3(off, 0, 0) : v3(0, 0, off); camera.position.set(t.x + d * Math.sin(polar) * Math.sin(baseAz), d * Math.cos(polar), t.z + d * Math.sin(polar) * Math.cos(baseAz)); camera.lookAt(t); camera.updateMatrixWorld(); return t; };
    const top = portrait ? 0.64 : 0.5, bot = portrait ? -0.7 : -0.76, side = portrait ? 1.02 : 0.97;
    const fits = () => corners.every(c => { const p = c.clone().project(camera); return Math.abs(p.x) < side && p.y < top && p.y > bot; });
    let best = { d: 1e9, off: 0 };
    for (let off = -4; off <= 4; off += 0.5) {
      let lo = 8, hi = 120;
      for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; place(m, off); if (fits()) hi = m; else lo = m; }
      if (hi < best.d) best = { d: hi, off };
    }
    const hi = best.d; fitOff = best.off;
    fitDist = hi;
    if (!keep) { const t = place(hi, fitOff); controls.target.copy(t); }
    controls.minDistance = fitDist * 0.45; controls.maxDistance = fitDist * 1.35;
    controls.minAzimuthAngle = baseAz - 0.85; controls.maxAzimuthAngle = baseAz + 0.85;
    controls.update();
  }

  // ---------- 전장 짓기 ----------
  function build() {
    const L = LOOK[B.kind];
    scene = new T.Scene(); scene.background = new T.Color(L.sky); scene.fog = new T.Fog(L.fog, 50, 130);
    hemi = new T.HemisphereLight('#fff6e0', '#6a6050', 0.62); scene.add(hemi);
    sun = new T.DirectionalLight('#fff1d6', 0.72); sun.position.set(-14, 26, 18); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 }); sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    board = new T.Group(); scene.add(board);
    tiles = []; hls = []; gate = null; extWalls = [];
    // 바깥 땅
    const ground = mesh(G.box, mat(L.far), 140, 1, 140, false); ground.position.y = -0.5; ground.receiveShadow = true; board.add(ground);
    const W = api.COLS * S, D = api.ROWS * S;
    const rim = mesh(G.box, mat('#5a4a33'), W + 0.6, 0.5, D + 0.6, false); rim.position.y = 0.0; board.add(rim);
    for (let y = 0; y < api.ROWS; y++) for (let x = 0; x < api.COLS; x++) buildTile(x, y);
    scenery();
    // 칸 강조판
    for (let y = 0; y < api.ROWS; y++) for (let x = 0; x < api.COLS; x++) {
      const m = mesh(G.plane, glow('#4fa3ff', 0.35), S * 0.9, S * 0.9, 1, false); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 2;
      m.position.set(wx(x), topAt(x, y) + 0.04, wz(y)); board.add(m); hls.push(m);
    }
    B.loot.filter(l => !l.taken).forEach(l => lootProps.push(buildLoot(l)));
    B.units.filter(u => !u.dead).forEach(u => squads.set(u.id, buildSquad(u)));
    B.burn.forEach((v, k) => { const [x, y] = k.split(',').map(Number); scorch(x, y, true); });
    gateLabel = null;
    if (B.kind === 'siege') { gateLabel = document.createElement('div'); gateLabel.className = 't3-gate'; labels.appendChild(gateLabel); }
  }
  function tileMat(k, x, y) {
    const n = (x * 7 + y * 13) % 3;
    const C = { '.': ['#86a34f', '#7e9a49', '#8fac56'], f: ['#6c8a40', '#66843c', '#718f44'], h: ['#a6955c', '#9c8b55', '#ab9b62'], '=': ['#b9ab7e'], '~': ['#35708a'], '#': ['#7a6d5c', '#716452'], W: ['#b3a582'], T: ['#bcae8a'], G: ['#9b8a66'], t: ['#d3c39c', '#cbbb94', '#d8c8a2'], H: ['#d7b872'] }[k] || ['#888'];
    return mat(C[n % C.length]);
  }
  function buildTile(x, y) {
    const k = B.map[y][x], X = wx(x), Z = wz(y), h = TOP[k] ?? 0.3;
    const blk = mesh(G.box, tileMat(k, x, y), S, k === '~' ? 0.1 : h, S, false); blk.position.set(X, (k === '~' ? 0.1 : h) / 2, Z); blk.receiveShadow = true;
    blk.userData = { x, y }; board.add(blk);
    const t = { k, block: blk, trees: [], objs: [] }; tiles.push(t);
    const r = (a, b) => a + ((x * 31 + y * 17 + a * 7) % 10) / 10 * (b - a);
    if (k === 'f') {
      [[-0.45, -0.4], [0.45, -0.2], [-0.1, 0.5], [0.5, 0.55]].forEach(([dx, dz], i) => {
        const tr = new T.Group(); const s = 0.8 + ((x + y + i) % 3) * 0.15;
        tr.add(put(tr, mesh(G.cyl, mat('#5b4128'), 0.08, 0.5, 0.08), 0, 0.25, 0));
        const leaf = mesh(G.cone, mat('#3f6a2c'), 0.48, 0.9, 0.48); put(tr, leaf, 0, 0.85, 0);
        const leaf2 = mesh(G.cone, mat('#4a7a33'), 0.36, 0.7, 0.36); put(tr, leaf2, 0, 1.25, 0);
        tr.scale.setScalar(s); put(board, tr, X + dx, h, Z + dz); t.trees.push(leaf, leaf2);
      });
    } else if (k === 'h') {
      const m = mesh(G.sph, mat('#a4935a'), 0.95, 0.35, 0.95); m.position.set(X, h, Z); m.receiveShadow = true; board.add(m);
      const rk = mesh(G.rock, mat('#8b7b58'), 0.2, 0.15, 0.2); rk.position.set(X + 0.5, h + 0.1, Z - 0.4); board.add(rk);
    } else if (k === '~') {
      const w = mesh(G.plane, new T.MeshPhongMaterial({ color: '#3e8fb0', transparent: true, opacity: 0.85, shininess: 80, specular: '#cfefff' }), S, S, 1, false); w.rotation.x = -Math.PI / 2; w.position.set(X, 0.22, Z); board.add(w); t.water = w;
    } else if (k === '=') {
      const w = mesh(G.plane, new T.MeshPhongMaterial({ color: '#8cc6d6', transparent: true, opacity: 0.55, shininess: 60 }), S, S, 1, false); w.rotation.x = -Math.PI / 2; w.position.set(X, 0.24, Z); board.add(w); t.water = w;
      for (let i = 0; i < 4; i++) { const s = mesh(G.sph, mat('#a39a88'), 0.18, 0.07, 0.15); s.position.set(X - 0.6 + i * 0.4, 0.26, Z + (i % 2 ? 0.25 : -0.25)); board.add(s); }
    } else if (k === '#') {
      for (let i = 0; i < 3; i++) { const rk = mesh(G.rock, mat(i % 2 ? '#6f6250' : '#85775f'), 0.7 + i * 0.1, 0.6 + (i % 2) * 0.3, 0.7); rk.position.set(X + (i - 1) * 0.55, h + 0.1, Z + (i % 2 ? 0.3 : -0.3)); rk.rotation.set(i, i * 2, 0); board.add(rk); }
    } else if (k === 'W' || k === 'T') {
      const bw = k === 'T' ? 1.15 : 1, addT = o => { board.add(o); t.objs.push(o); };
      if (k === 'T') { const tw = mesh(G.box, mat('#c2b38e'), S * 1.08, 0.6, S * 1.08); tw.position.set(X, h - 0.1, Z); addT(tw); }
      for (let i = 0; i < 4; i++) { const c = mesh(G.box, mat('#9f9170'), 0.34 * bw, 0.4, 0.34 * bw); c.position.set(X - 0.85, h + 0.2 + (k === 'T' ? 0.2 : 0), Z - 0.75 + i * 0.5); addT(c); }
      if (k === 'T') { const pole = mesh(G.cyl, mat('#5b4128'), 0.04, 1.4, 0.04); pole.position.set(X + 0.6, h + 0.9, Z + 0.6); addT(pole); const fl = mesh(G.flag, mat(facCol(B.df), { side: T.DoubleSide }), 1, 1, 1, false); fl.position.set(X + 0.91, h + 1.4, Z + 0.6); addT(fl); t.flag = fl; }
    } else if (k === 'G') {
      gate = { x, y, g: new T.Group(), broken: false };
      const g = gate.g; g.position.set(X, 0, Z); board.add(g);
      const lint = mesh(G.box, mat('#a8987a'), 0.9, 0.5, S * 1.05); lint.position.set(0, 2.2, 0); g.add(lint);
      gate.doors = [-0.47, 0.47].map(dz => { const d = mesh(G.box, mat('#6b4524'), 0.26, 1.85, 0.92); d.position.set(-0.35, 1.05, dz); g.add(d); for (let i = 0; i < 3; i++) { const band = mesh(G.box, mat('#3a3a3a'), 0.28, 0.08, 0.94); band.position.set(0, -0.6 + i * 0.6, 0); d.add(band); } return d; });
    } else if (k === 'H') {
      const tent = new T.Group();
      const body = mesh(G.cone4, mat('#ecdcb4'), 0.95, 1.3, 0.95); body.position.y = 0.65; body.rotation.y = Math.PI / 4; tent.add(body);
      const door = mesh(G.plane, mat('#5a2a1c', { side: T.DoubleSide }), 0.35, 0.5, 1, false); door.position.set(-0.52, 0.28, 0); door.rotation.y = -Math.PI / 2; tent.add(door);
      const pole = mesh(G.cyl, mat('#5b4128'), 0.04, 2.2, 0.04); pole.position.set(0, 1.4, 0); tent.add(pole);
      const fl = mesh(G.flag, mat(facCol(B.df), { side: T.DoubleSide }), 1.2, 1.2, 1, false); fl.position.set(0.37, 2.2, 0); tent.add(fl); t.flag = fl;
      put(board, tent, X + 0.35, h, Z - 0.35);
    }
  }
  // 전장 밖 풍경: 나무·바위, 계곡이면 높은 산, 공성전이면 성 안 집들
  function scenery() {
    const W = api.COLS * S / 2, D = api.ROWS * S / 2;
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2, r = rnd(Math.hypot(W, D) + 2, 44);
      const x = Math.cos(a) * r * 1.1, z = Math.sin(a) * r;
      if (Math.abs(x) < W + 1.5 && Math.abs(z) < D + 1.5) continue;
      if (B.kind === 'siege' && x > W - 2) continue;
      if (Math.random() < 0.6) { const tr = new T.Group(); tr.add(put(tr, mesh(G.cyl, mat('#5b4128'), 0.12, 0.8, 0.12), 0, 0.4, 0)); tr.add(put(tr, mesh(B.kind === 'siege' ? G.sph : G.cone, mat(B.kind === 'siege' ? '#6f8a44' : '#456f30'), 0.7, B.kind === 'siege' ? 0.6 : 1.5, 0.7), 0, 1.3, 0)); tr.scale.setScalar(rnd(0.9, 1.6)); put(board, tr, x, 0, z); }
      else { const rk = mesh(G.rock, mat('#8b7d62'), rnd(0.4, 1.2), rnd(0.3, 0.8), rnd(0.4, 1.2)); rk.position.set(x, 0.1, z); board.add(rk); }
    }
    if (B.kind === 'valley') [-1, 1].forEach(sz => { for (let i = 0; i < 9; i++) { const m = mesh(G.cone, mat(i % 2 ? '#7d705a' : '#6c604c'), rnd(3, 5), rnd(4, 8), rnd(3, 5)); m.position.set(-W + i * 2.8 + rnd(-1, 1), 2, sz * (D + rnd(2.5, 5))); board.add(m); } });
    if (B.kind === 'siege') {
      // 성 안 동네: 네모난 흙벽 집, 평평한 지붕
      for (let i = 0; i < 16; i++) { const x = W + rnd(1.5, 12), z = rnd(-D - 4, D + 4); const hh = rnd(0.9, 1.8); const m = mesh(G.box, mat(i % 3 ? '#d6c49a' : '#c7b187'), rnd(1.2, 2.2), hh, rnd(1.2, 2.2)); m.position.set(x, hh / 2, z); board.add(m); }
      // 성벽이 전장 밖으로도 이어진다
      [-1, 1].forEach(sz => { const m = mesh(G.box, mat('#b3a582'), S, 2.3, 16); m.position.set(wx(7), 1.15, sz * (D + 8)); board.add(m); extWalls.push(m); });
    }
  }
  const facCol = f => { try { return f && GM().fac(f) ? GM().fac(f).color : '#9a8f7a'; } catch (e) { return '#9a8f7a'; } };

  // ---------- 보물 상자 · 보급 수레 ----------
  function buildLoot(l) {
    const g = new T.Group(), X = wx(l.x), Z = wz(l.y), h = topAt(l.x, l.y);
    if (l.kind === 'chest') {
      g.add(put(g, mesh(G.box, mat('#8a5a2a'), 0.7, 0.4, 0.5), 0, 0.2, 0));
      const lid = new T.Group(); lid.position.set(0, 0.4, -0.25); g.add(lid);
      lid.add(put(lid, mesh(G.box, mat('#9b6a33'), 0.72, 0.16, 0.52), 0, 0.08, 0.25));
      g.add(put(g, mesh(G.box, mat('#e2b04a'), 0.74, 0.08, 0.08), 0, 0.3, 0.22));
      g.userData.lid = lid;
    } else {
      g.add(put(g, mesh(G.box, mat('#8b6a3e'), 1.0, 0.3, 0.6), 0, 0.45, 0));
      [-0.3, 0.3].forEach(dz => { const w = mesh(G.cyl12, mat('#4d3620'), 0.28, 0.08, 0.28); w.rotation.x = Math.PI / 2; w.position.set(0, 0.28, dz * 1.2); g.add(w); });
      for (let i = 0; i < 3; i++) g.add(put(g, mesh(G.sph, mat('#d8c89a'), 0.2, 0.17, 0.2), -0.3 + i * 0.3, 0.72, 0));
    }
    const sp = sprite('glow', 1.6, { color: '#ffd978', blending: T.AdditiveBlending, opacity: 0.8 }); sp.position.y = 0.6; g.add(sp); g.userData.glow = sp;
    g.position.set(X + 0.55, h, Z + 0.55); g.rotation.y = 0.4; board.add(g);
    return { l, g };
  }

  // ---------- 부대 ----------
  // 병종별 사람 수(모형): 보병 6, 말 3, 전차 2, 코끼리 1
  const FIGS = { spear: 6, foot: 6, archer: 6, sling: 6, guard: 6, cavalry: 3, camel: 3, chariot: 2, elephant: 1, prophet: 3 };
  const SKIN = ['#c98e62', '#b97d52', '#d39b6f', '#a86f47'];
  function person(o) {
    // o: { tunic, helm, skin, s }
    const g = new T.Group();
    g.add(put(g, mesh(G.cyl, mat(o.tunic), 0.17, 0.5, 0.15), 0, 0.3, 0));
    g.add(put(g, mesh(G.cyl, mat(shade(o.tunic, 0.6)), 0.06, 0.2, 0.06), -0.06, 0.05, 0));
    g.add(put(g, mesh(G.cyl, mat(shade(o.tunic, 0.6)), 0.06, 0.2, 0.06), 0.06, 0.05, 0));
    g.add(put(g, mesh(G.sph, mat(o.skin), 0.12, 0.12, 0.12), 0, 0.66, 0));
    if (o.helm === 'cone') g.add(put(g, mesh(G.cone, mat('#b08d4a'), 0.13, 0.18, 0.13), 0, 0.8, 0));
    else if (o.helm === 'round') g.add(put(g, mesh(G.hemi, mat('#b88a3f'), 0.13, 0.11, 0.13), 0, 0.7, 0));
    else if (o.helm === 'plume') { g.add(put(g, mesh(G.hemi, mat('#d8b050'), 0.14, 0.12, 0.14), 0, 0.7, 0)); g.add(put(g, mesh(G.box, mat('#c0392b'), 0.04, 0.12, 0.22), 0, 0.84, 0)); }
    else if (o.helm === 'band') g.add(put(g, mesh(G.cyl, mat(o.band || '#e8dcc0'), 0.125, 0.05, 0.125), 0, 0.7, 0));
    else if (o.helm === 'hood') g.add(put(g, mesh(G.cone, mat(o.hood || '#6f5a3c'), 0.15, 0.26, 0.15), 0, 0.78, 0));
    return g;
  }
  function soldier(type, fc, side, lead) {
    const tunic = mix(fc, side === 'A' ? '#d8d0bc' : '#8a7d6a', 0.35), sk = SKIN[Math.floor(Math.random() * SKIN.length)];
    let g;
    if (type === 'prophet') {
      g = person({ tunic: '#ece7da', helm: 'hood', hood: '#d9d2c0', skin: sk });
      g.add(put(g, mesh(G.cyl, mat('#6b4a2a'), 0.025, 1.1, 0.025), 0.2, 0.5, 0));
      const halo = mesh(G.torus, glow('#ffe08a', 0.8), 0.14, 0.14, 0.14, false); halo.rotation.x = Math.PI / 2; halo.position.y = 0.86; g.add(halo);
      return g;
    }
    if (type === 'archer') {
      g = person({ tunic, helm: 'hood', hood: shade(fc, 0.7), skin: sk });
      const b = mesh(G.bow, mat('#5a3a1a'), 1.4, 1.4, 1.4); b.position.set(0.16, 0.45, 0.02); b.rotation.set(0, Math.PI / 2, Math.PI / 2); g.add(b);
      g.add(put(g, mesh(G.box, mat('#6b4524'), 0.08, 0.3, 0.08), -0.1, 0.45, -0.12));
    } else if (type === 'sling') {
      g = person({ tunic: mix(tunic, '#c9b48f', 0.4), helm: 'band', band: fc, skin: sk });
      g.add(put(g, mesh(G.cyl, mat('#8a7050'), 0.012, 0.35, 0.012), 0.2, 0.6, 0));
      g.add(put(g, mesh(G.sph, mat('#777'), 0.05, 0.05, 0.05), 0.2, 0.8, 0));
    } else if (type === 'foot') {
      g = person({ tunic, helm: 'round', skin: sk });
      const sh = mesh(G.box, mat(fc), 0.05, 0.42, 0.3); sh.position.set(0.17, 0.35, 0); g.add(sh);
      const sw = mesh(G.box, mat('#cfd3d8'), 0.03, 0.34, 0.04); sw.position.set(-0.16, 0.42, 0.06); sw.rotation.x = 0.4; g.add(sw);
    } else if (type === 'guard') {
      g = person({ tunic: mix(tunic, '#8a8a8a', 0.3), helm: 'cone', skin: sk });
      const sh = mesh(G.box, mat(shade(fc, 0.85)), 0.06, 0.55, 0.36); sh.position.set(0.18, 0.35, 0); g.add(sh);
      g.add(put(g, mesh(G.cyl, mat('#6b4a2a'), 0.018, 1.2, 0.018), -0.15, 0.6, 0));
    } else { // spear
      g = person({ tunic, helm: lead ? 'plume' : 'cone', skin: sk });
      const sh = mesh(G.cyl12, mat(fc), 0.17, 0.04, 0.17); sh.rotation.z = Math.PI / 2; sh.position.set(0.17, 0.38, 0); g.add(sh);
      g.add(put(g, mesh(G.cyl, mat('#6b4a2a'), 0.018, 1.35, 0.018), -0.14, 0.62, 0));
      g.add(put(g, mesh(G.cone, mat('#d0d4da'), 0.035, 0.12, 0.035), -0.14, 1.34, 0));
    }
    if (lead) { const cape = mesh(G.box, mat(fc), 0.04, 0.45, 0.28); cape.position.set(-0.13, 0.36, 0); g.add(cape); }
    return g;
  }
  function horse(col = '#7a5230') {
    const g = new T.Group();
    g.add(put(g, mesh(G.box, mat(col), 0.8, 0.32, 0.28), 0, 0.55, 0));
    const neck = mesh(G.box, mat(col), 0.2, 0.4, 0.16); neck.position.set(0.42, 0.78, 0); neck.rotation.z = -0.6; g.add(neck);
    g.add(put(g, mesh(G.box, mat(shade(col, 0.9)), 0.3, 0.14, 0.14), 0.6, 0.92, 0));
    [[0.3, 0.1], [0.3, -0.1], [-0.3, 0.1], [-0.3, -0.1]].forEach(([x, z]) => g.add(put(g, mesh(G.box, mat(shade(col, 0.8)), 0.07, 0.42, 0.07), x, 0.2, z)));
    g.add(put(g, mesh(G.box, mat('#2a1a10'), 0.25, 0.06, 0.05), -0.48, 0.55, 0));
    return g;
  }
  function mount(type, fc, side, lead) {
    const g = new T.Group();
    if (type === 'cavalry') {
      g.add(horse(['#7a5230', '#4a3020', '#9a7a5a', '#2e2420'][Math.floor(Math.random() * 4)]));
      const r = soldier('spear', fc, side, lead); r.scale.setScalar(0.85); r.position.set(-0.05, 0.62, 0); g.add(r);
      const cloth = mesh(G.box, mat(fc), 0.4, 0.1, 0.34); cloth.position.set(-0.05, 0.72, 0); g.add(cloth);
    } else if (type === 'camel') {
      const col = '#c9a26a';
      g.add(put(g, mesh(G.sph, mat(col), 0.45, 0.24, 0.2), 0, 0.85, 0));
      g.add(put(g, mesh(G.sph, mat(shade(col, 0.95)), 0.2, 0.2, 0.16), -0.05, 1.05, 0));
      const neck = mesh(G.cyl, mat(col), 0.07, 0.55, 0.07); neck.position.set(0.45, 1.0, 0); neck.rotation.z = -0.5; g.add(neck);
      g.add(put(g, mesh(G.box, mat(col), 0.26, 0.12, 0.12), 0.62, 1.25, 0));
      [[0.25, 0.09], [0.25, -0.09], [-0.25, 0.09], [-0.25, -0.09]].forEach(([x, z]) => g.add(put(g, mesh(G.box, mat(shade(col, 0.8)), 0.06, 0.7, 0.06), x, 0.35, z)));
      const r = soldier('archer', fc, side, lead); r.scale.setScalar(0.8); r.position.set(-0.22, 1.02, 0); g.add(r);
      g.add(put(g, mesh(G.box, mat(fc), 0.3, 0.06, 0.34), -0.2, 1.1, 0));
    } else if (type === 'chariot') {
      g.add(put(g, horse('#6a4a2a'), 0.75, 0, 0.2)); g.add(put(g, horse('#8a6a4a'), 0.75, 0, -0.2));
      g.add(put(g, mesh(G.box, mat('#8b5a2b'), 0.55, 0.12, 0.6), -0.35, 0.45, 0));
      g.add(put(g, mesh(G.box, mat(fc), 0.05, 0.35, 0.6), -0.1, 0.65, 0));
      [-0.34, 0.34].forEach(z => { const w = mesh(G.cyl12, mat('#3d2a18'), 0.32, 0.06, 0.32); w.rotation.x = Math.PI / 2; w.position.set(-0.4, 0.32, z); g.add(w); const hub = mesh(G.cyl, mat('#c9a24a'), 0.07, 0.08, 0.07); hub.rotation.x = Math.PI / 2; hub.position.set(-0.4, 0.32, z * 1.08); g.add(hub); });
      g.add(put(g, mesh(G.box, mat('#6b4a2a'), 0.8, 0.04, 0.04), 0.3, 0.45, 0));
      const d = soldier('spear', fc, side, lead); d.scale.setScalar(0.8); d.position.set(-0.35, 0.5, 0.12); g.add(d);
      const a = soldier('archer', fc, side); a.scale.setScalar(0.8); a.position.set(-0.45, 0.5, -0.14); g.add(a);
    } else if (type === 'elephant') {
      const col = '#8e8b87';
      g.add(put(g, mesh(G.sph, mat(col), 0.75, 0.55, 0.52), 0, 1.15, 0));
      [[0.4, 0.28], [0.4, -0.28], [-0.4, 0.28], [-0.4, -0.28]].forEach(([x, z]) => g.add(put(g, mesh(G.cyl, mat(shade(col, 0.85)), 0.15, 0.8, 0.15), x, 0.42, z)));
      g.add(put(g, mesh(G.sph, mat(col), 0.34, 0.34, 0.32), 0.78, 1.35, 0));
      [0.3, -0.3].forEach(z => { const ear = mesh(G.sph, mat(shade(col, 0.92)), 0.08, 0.3, 0.26); ear.position.set(0.68, 1.4, z); g.add(ear); });
      const tr1 = mesh(G.cyl, mat(col), 0.09, 0.45, 0.09); tr1.position.set(1.05, 1.12, 0); tr1.rotation.z = 0.35; g.add(tr1);
      const tr2 = mesh(G.cyl, mat(col), 0.07, 0.4, 0.07); tr2.position.set(1.17, 0.78, 0); tr2.rotation.z = -0.1; g.add(tr2);
      [0.12, -0.12].forEach(z => { const tk = mesh(G.cone, mat('#f3ecd8'), 0.05, 0.42, 0.05); tk.position.set(1.02, 1.0, z); tk.rotation.z = -2.1; g.add(tk); });
      // 등 위의 망루(하우다)
      g.add(put(g, mesh(G.box, mat('#6b4524'), 0.6, 0.35, 0.55), -0.05, 1.82, 0));
      g.add(put(g, mesh(G.box, mat(fc), 0.7, 0.06, 0.62), -0.05, 2.02, 0));
      g.add(put(g, mesh(G.box, mat(fc), 0.9, 0.08, 0.95), -0.05, 1.55, 0));
      const r = soldier('archer', fc, side, lead); r.scale.setScalar(0.75); r.position.set(-0.05, 1.8, 0); g.add(r);
      const r2 = soldier('spear', fc, side); r2.scale.setScalar(0.7); r2.position.set(0.55, 1.5, 0); g.add(r2);
    }
    return g;
  }
  function buildSquad(u) {
    const side = u.side, fc = facCol(side === 'A' ? B.opts.af : B.df);
    const g = new T.Group(); board.add(g);
    const n = FIGS[u.type] || 6, big = ['cavalry', 'camel', 'chariot', 'elephant'].includes(u.type);
    const figs = [];
    const spots = n === 6 ? [[0.3, -0.52], [0.3, 0], [0.3, 0.52], [-0.3, -0.52], [-0.3, 0], [-0.3, 0.52]] : n === 3 ? [[0.3, -0.45], [-0.15, 0.45], [-0.5, -0.3]] : n === 2 ? [[0.15, -0.45], [-0.35, 0.45]] : [[-0.25, 0]];
    spots.forEach(([dx, dz], i) => {
      const f = big ? mount(u.type, fc, side, u.o && i === 0) : soldier(u.type, fc, side, false);
      f.scale.setScalar(u.type === 'elephant' ? 1.2 : u.type === 'chariot' ? 1.15 : big ? 1.25 : 1.4);
      f.position.set(dx + rnd(-0.05, 0.05), 0, dz + rnd(-0.05, 0.05)); f.userData.base = f.position.clone(); f.userData.ph = Math.random() * 6;
      g.add(f); figs.push(f);
    });
    // 장수: 맨 앞에 크게 (말 탄 병종은 앞 사람이 장수)
    let lead = null;
    if (u.o && !big) { lead = soldier(u.type === 'prophet' ? 'prophet' : u.type === 'archer' ? 'archer' : 'spear', fc, side, true); lead.scale.setScalar(1.8); lead.position.set(0.72, 0, 0); lead.userData.base = lead.position.clone(); lead.userData.ph = 0; g.add(lead); }
    // 발밑 고리(아군 파랑 · 적군 빨강)와 세력 깃발
    const ring = mesh(G.ring, glow(side === 'A' ? '#4aa8ff' : '#ff5a48', 0.85), 1.05, 1.05, 1, false); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
    const disc = mesh(G.disc, new T.MeshBasicMaterial({ color: side === 'A' ? '#1d4c7a' : '#6a1e16', transparent: true, opacity: 0.35, depthWrite: false }), 1, 1, 1, false); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.04; g.add(disc);
    const bh = u.type === 'elephant' ? 3.1 : big ? 2.4 : 1.9;
    const pole = mesh(G.cyl, mat('#4a3420'), 0.03, bh, 0.03); pole.position.set(-0.7, bh / 2, -0.7); g.add(pole);
    const flag = mesh(G.flag, new T.MeshLambertMaterial({ color: fc, side: T.DoubleSide }), 1, 1, 1, false); flag.position.set(-0.39, bh - 0.22, -0.7); g.add(flag);
    const tip = mesh(G.cone, mat('#e2b04a'), 0.05, 0.14, 0.05); tip.position.set(-0.7, bh + 0.05, -0.7); g.add(tip);
    // 누르기용 투명 상자
    const proxy = new T.Mesh(G.box, new T.MeshBasicMaterial({ visible: false })); proxy.scale.set(S * 0.95, u.type === 'elephant' ? 3 : 2, S * 0.95); proxy.position.y = 1; proxy.userData.u = u; g.add(proxy);
    const label = document.createElement('div'); label.className = 'u3l ' + (side === 'A' ? 'ally' : 'foe'); labels.appendChild(label);
    const sq = { u, g, figs, lead, ring, disc, flag, pole, proxy, label, shown: figs.length, pos: v3(wx(u.x), topAt(u.x, u.y), wz(u.y)), cell: [u.x, u.y], face: side === 'A' ? 0 : Math.PI, gone: false, fire: null, conf: null, lh: bh + 0.3, sel: false, labelKey: '' };
    g.position.copy(sq.pos); g.rotation.y = sq.face;
    return sq;
  }
  // 부대를 보이는 사람 수로 맞추고 쓰러지는 모습
  function setShown(sq) {
    const u = sq.u, want = u.dead ? 0 : Math.max(1, Math.ceil(sq.figs.length * u.soldiers / u.max));
    while (sq.shown > want) { const f = sq.figs[sq.shown - 1]; sq.shown--; fall(f); }
    while (sq.shown < want) { const f = sq.figs[sq.shown]; f.visible = true; f.rotation.set(0, 0, 0); f.position.copy(f.userData.base); f.userData.down = false; sq.shown++; }
  }
  function fall(f) {
    if (f.userData.down) return; f.userData.down = true;
    const dir = Math.random() < 0.5 ? 1 : -1;
    anim(0.7, k => { f.rotation.z = dir * k * 1.45; f.position.y = f.userData.base.y - k * 0.1; }, () => { anim(0.8, k => { f.position.y = f.userData.base.y - 0.1 - k * 0.5; }, () => { f.visible = false; }); });
  }

  // ---------- 동기화 (render마다) ----------
  function sync(b, hl) {
    if (!scene || b !== B) return;
    const tgt = new Set((hl.ts || []).concat(hl.pend || []).map(e => e.x + ',' + e.y)), mv = new Set((hl.rs || []).map(([x, y]) => x + ',' + y));
    hls.forEach((m, i) => { const x = i % api.COLS, y = Math.floor(i / api.COLS), k = x + ',' + y; m.position.y = topAt(x, y) + 0.04; if (tgt.has(k)) { m.visible = true; m.material = hlMat((hl.pend || []).some(e => e.x === x && e.y === y) ? '#a55cff' : '#ff3a22', 0.55); } else if (mv.has(k)) { m.visible = true; m.material = hlMat('#2f7bff', 0.45); } else m.visible = false; });
    B.units.forEach(u => {
      let sq = squads.get(u.id); if (!sq) { if (u.dead) return; sq = buildSquad(u); squads.set(u.id, sq); }
      if (sq.gone) return;
      if (u.dead) { if (!sq.routing) rout(sq); return; }
      setShown(sq);
      if (sq.cell[0] !== u.x || sq.cell[1] !== u.y) walk(sq, u.x, u.y);
      sq.sel = B.sel === u;
      // 불붙음 · 혼란 표시
      if (u.burning && !sq.fire) { sq.fire = emitter(3, 1.2); sq.g.add(sq.fire.g); }
      if (!u.burning && sq.fire) { sq.g.remove(sq.fire.g); sq.fire = null; }
      if (u.side === 'A' && B.host > 0 && !sq.host) sq.host = hostOn(sq);
      if (sq.host && !(B.host > 0)) { const hg = sq.host; sq.host = null; anim(0.8, k => hg.scale.setScalar(1 - k), () => sq.g.remove(hg)); }
      const isN = B.nissi && B.nissi.caster === u;
      if (isN && !sq.nissi) sq.nissi = nissiOn(sq);
      if (!isN && sq.nissi) { sq.g.remove(sq.nissi); sq.nissi = null; }
      if (!sq.moving && Math.abs(sq.pos.y - topAt(u.x, u.y)) > 0.05) { const y0 = sq.pos.y, y1 = topAt(u.x, u.y); sq.moving = true; anim(0.5, k => { sq.pos.y = y0 + (y1 - y0) * k * k; sq.g.position.copy(sq.pos); }, () => { sq.moving = false; }); }
      if (u.confused && !sq.conf) sq.conf = swirl(sq);
      if (!u.confused && sq.conf) { sq.g.remove(sq.conf.g); sq.conf = null; }
      const t = api.UT[u.type], k = [u.soldiers, u.acted, sq.sel, u.morale > 0 ? Math.round(u.morale / 10) : 0].join();
      if (sq.labelKey !== k) {
        sq.labelKey = k;
        sq.label.className = 'u3l ' + (u.side === 'A' ? 'ally' : 'foe') + (u.acted && u.side === 'A' ? ' done' : '') + (sq.sel ? ' sel' : '');
        sq.label.innerHTML = `<i style="--tc:${t.col}">${t.tag}</i><b>${esc(api.name(u))}</b><small>${GM().fmt(u.soldiers)}</small><span class="hp"><em style="width:${Math.max(0, u.soldiers / u.max * 100)}%"></em></span>`;
      }
    });
    // 성문
    if (gate && B.gateHp <= 0 && !gate.broken) breakGate();
    if (gateLabel) { gateLabel.hidden = !gate || gate.broken; if (gate && !gate.broken) gateLabel.innerHTML = `성문 <b>${Math.round(B.gateHp / B.gateMax * 100)}%</b>`; }
    // 불타는 칸
    B.burn.forEach((v, k) => { if (!tileFire.has(k)) { const [x, y] = k.split(',').map(Number); const e = emitter(5, 1.6); e.g.position.set(wx(x), topAt(x, y), wz(y)); board.add(e.g); tileFire.set(k, e); scorch(x, y, true); } });
    [...tileFire.keys()].forEach(k => { if (!B.burn.has(k)) { const e = tileFire.get(k); board.remove(e.g); tileFire.delete(k); const [x, y] = k.split(',').map(Number); scorch(x, y, false); smokeBurst(v3(wx(x), topAt(x, y) + 0.5, wz(y)), 4); } });
    // 전리품
    lootProps.forEach(p => { if (p.l.taken && !p.opened) openLoot(p); });
  }
  const esc = s => GM().esc(s);
  // 숲이 타면 잎이 붉게, 불이 꺼지면 검게 그을린다
  function scorch(x, y, burning) {
    const t = tiles[y * api.COLS + x]; if (!t || !t.trees.length) return;
    t.trees.forEach(m => { m.material = mat(burning ? '#8a3a18' : '#3a3228'); });
    if (!burning) burnt.add(x + ',' + y);
  }
  function walk(sq, x, y) {
    const a = sq.pos.clone(), b = v3(wx(x), topAt(x, y), wz(y));
    sq.cell = [x, y];
    const d = Math.max(1, Math.hypot(b.x - a.x, b.z - a.z) / S), dur = reduce ? 0.05 : Math.min(1.1, 0.28 + d * 0.12);
    const face = Math.atan2(-(b.z - a.z), b.x - a.x);
    if (d > 0.1) turnTo(sq, face);
    const climb = Math.abs(b.y - a.y) > 1.2;
    sq.moving = true;
    anim(dur, k => {
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      sq.pos.set(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * (climb ? Math.min(1, k * 1.6) : e) + Math.sin(k * Math.PI) * (climb ? 0.8 : 0.15), a.z + (b.z - a.z) * e);
      sq.g.position.copy(sq.pos);
      sq.figs.forEach(f => { if (f.visible && !f.userData.down) f.position.y = f.userData.base.y + Math.abs(Math.sin(k * 18 + f.userData.ph)) * 0.08; });
      if (Math.random() < 0.08) dust(sq.pos.clone().add(v3(rnd(-0.5, 0.5), 0.1, rnd(-0.5, 0.5))));
    }, () => { sq.moving = false; sq.pos.copy(b); sq.g.position.copy(b); setTimeout(() => turnTo(sq, sq.u.side === 'A' ? 0 : Math.PI), 400); });
  }
  function turnTo(sq, ang) {
    const a0 = sq.g.rotation.y; let d = ((ang - a0 + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    anim(0.25, k => { sq.g.rotation.y = a0 + d * k; });
  }
  function rout(sq) {
    sq.routing = true; sq.label.classList.add('gone');
    sq.figs.forEach((f, i) => setTimeout(() => fall(f), i * 60));
    if (sq.lead) fall(sq.lead);
    smokeBurst(sq.pos.clone().add(v3(0, 0.6, 0)), 5);
    const f = sq.flag, p = sq.pole;
    anim(1.2, k => { p.rotation.z = k * 1.3; f.rotation.z = k * 1.3; f.position.y = p.position.y * 2 - 0.22 - k * 1.2; }, () => {
      sq.ring.material = glow('#555555', 0.6);
      anim(0.6, k => { sq.ring.scale.setScalar(1 - k * 0.9); sq.disc.scale.setScalar(1 - k * 0.9); }, () => { board.remove(sq.g); sq.label.remove(); sq.gone = true; });
    });
  }

  // ---------- 효과 ----------
  function anim(dur, step, done) { anims.push({ t: 0, dur: Math.max(0.01, dur), step, done }); }
  function part(m, o) { m.userData = Object.assign({ v: v3(0, 0, 0), life: 1, age: 0, grav: 0, grow: 0, fade: true, spin: 0 }, o); board.add(m); parts.push(m); return m; }
  function spark(p, n = 10, col = '#ffd070') {
    for (let i = 0; i < n; i++) { const m = mesh(G.box, glow(col, 1).clone(), 0.08, 0.08, 0.08, false); m.position.copy(p); part(m, { v: v3(rnd(-3, 3), rnd(1, 4), rnd(-3, 3)), life: rnd(0.3, 0.6), grav: 9 }); }
  }
  function dust(p) { const s = sprite('smoke', 0.6, { color: '#c8b58a', opacity: 0.5 }); s.position.copy(p); part(s, { v: v3(rnd(-0.3, 0.3), 0.6, rnd(-0.3, 0.3)), life: 0.7, grow: 1.2 }); }
  function smokeBurst(p, n = 6) { for (let i = 0; i < n; i++) { const s = sprite('smoke', rnd(0.8, 1.4), { opacity: 0.7 }); s.position.copy(p).add(v3(rnd(-0.6, 0.6), rnd(0, 0.5), rnd(-0.6, 0.6))); part(s, { v: v3(rnd(-0.3, 0.3), rnd(0.8, 1.6), rnd(-0.3, 0.3)), life: rnd(1.2, 2.2), grow: 1.4 }); } }
  // 불꽃 묶음(계속 타오름): n개의 불꽃과 연기
  function emitter(n, spread) {
    const g = new T.Group(), fl = [];
    for (let i = 0; i < n; i++) {
      const s = sprite('fire', rnd(0.7, 1.1), { blending: T.AdditiveBlending }); s.position.set(rnd(-spread, spread) * 0.5, 0.4, rnd(-spread, spread) * 0.5); s.userData = { ph: Math.random() * 6, base: s.position.clone(), sz: s.scale.x }; g.add(s); fl.push(s);
      const c = mesh(G.flame, glow(i % 2 ? '#ff7a1c' : '#ffb43a', 0.75), 1, 1, 1, false); c.position.copy(s.position); c.position.y = 0.35; c.userData = { ph: Math.random() * 6 }; g.add(c); fl.push(c);
    }
    return { g, fl, t: 0 };
  }
  function tickEmitter(e, dt, p) {
    e.t += dt;
    e.fl.forEach(f => { const ph = f.userData.ph; if (f.isSprite) { const s = f.userData.sz * (0.8 + 0.35 * Math.sin(now * 11 + ph)); f.scale.set(s, s * 1.3, s); f.position.y = f.userData.base.y + 0.15 * Math.sin(now * 7 + ph); } else { f.scale.set(1, 0.7 + 0.5 * Math.abs(Math.sin(now * 9 + ph)), 1); f.rotation.y += dt * 2; } });
    if (Math.random() < dt * 4) { const w = new T.Vector3(); e.g.getWorldPosition(w); const s = sprite('smoke', rnd(0.6, 1.0), { opacity: 0.55 }); s.position.copy(w).add(v3(rnd(-0.5, 0.5), 1.1, rnd(-0.5, 0.5))); part(s, { v: v3(rnd(-0.2, 0.4), rnd(1.2, 1.8), rnd(-0.2, 0.2)), life: rnd(1.6, 2.4), grow: 1.6 }); }
  }
  function swirl(sq) {
    const g = new T.Group(), ss = [];
    ['q', 'swirl', 'q'].forEach((k, i) => { const s = sprite(k, 0.55); s.userData.ph = i * Math.PI * 2 / 3; g.add(s); ss.push(s); });
    g.position.y = sq.lh + 0.2; sq.g.add(g);
    return { g, ss };
  }
  function projectile(a, d, kind) {
    const from = v3(wx(a.x), topAt(a.x, a.y) + 0.8, wz(a.y)), to = v3(wx(d.x), topAt(d.x, d.y) + 0.5, wz(d.y));
    const n = kind === 'stone' ? 6 : 7, dur = reduce ? 0.1 : 0.55 + from.distanceTo(to) * 0.03;
    for (let i = 0; i < n; i++) {
      const m = kind === 'stone' ? mesh(G.sph, mat('#6e6a64'), 0.07, 0.07, 0.07, false) : mesh(G.box, kind === 'fire' ? glow('#ff9a3a', 1) : mat('#3b2b1b'), 0.04, 0.04, 0.5, false);
      const off = v3(rnd(-0.5, 0.5), 0, rnd(-0.5, 0.5)), off2 = v3(rnd(-0.6, 0.6), 0, rnd(-0.6, 0.6));
      const f = from.clone().add(off), t2 = to.clone().add(off2), h = 1.5 + f.distanceTo(t2) * 0.18;
      let trail = null; if (kind === 'fire') { trail = sprite('fire', 0.45, { blending: T.AdditiveBlending }); board.add(trail); }
      board.add(m);
      const delay = i * 0.05;
      anim(dur + delay, k0 => {
        const k = Math.max(0, (k0 * (dur + delay) - delay) / dur); m.visible = k > 0;
        const p = f.clone().lerp(t2, k); p.y += Math.sin(k * Math.PI) * h; const q = f.clone().lerp(t2, Math.min(1, k + 0.03)); q.y += Math.sin(Math.min(1, k + 0.03) * Math.PI) * h;
        m.position.copy(p); m.lookAt(q); if (trail) { trail.position.copy(p); trail.visible = k > 0; }
      }, () => { board.remove(m); if (trail) board.remove(trail); if (i === 0) { dust(to.clone()); if (kind === 'fire') spark(to, 8, '#ff8a3a'); } });
    }
  }
  function lunge(a, d, at) {
    const sq = squads.get(a.id), ts = d ? squads.get(d.id) : { pos: at }; if (!sq || !ts || !ts.pos) return;
    const p0 = sq.pos.clone(), dir = ts.pos.clone().sub(p0); dir.y = 0; const face = Math.atan2(-dir.z, dir.x); turnTo(sq, face);
    anim(reduce ? 0.1 : 0.55, k => { const e = Math.sin(k * Math.PI); sq.g.position.copy(p0).addScaledVector(dir, e * 0.38); if (k > 0.45 && !sq._hit) { sq._hit = true; spark(ts.pos.clone().add(v3(0, 0.7, 0)).addScaledVector(dir, -0.3), 14); if (ts.g) shakeSq(ts); } }, () => { sq._hit = false; sq.g.position.copy(sq.pos); setTimeout(() => turnTo(sq, sq.u.side === 'A' ? 0 : Math.PI), 300); });
  }
  function shakeSq(sq) { const p = sq.pos.clone(); anim(0.35, k => { if (sq.moving) return; sq.g.position.set(p.x + Math.sin(k * 40) * 0.08 * (1 - k), p.y, p.z); }, () => { if (!sq.moving) sq.g.position.copy(sq.pos); }); }
  function beam(p, col = '#ffe08a', dur = 2) {
    const m = mesh(G.beam, glow(col, 0.0).clone(), 1, 1, 1, false); m.position.copy(p).add(v3(0, 8, 0)); board.add(m);
    const r = mesh(G.torus, glow(col, 0.9).clone(), 1, 1, 1, false); r.rotation.x = Math.PI / 2; r.position.copy(p).add(v3(0, 0.15, 0)); board.add(r);
    anim(dur, k => { m.material.opacity = Math.sin(k * Math.PI) * 0.45; m.rotation.y += 0.02; r.scale.setScalar(0.5 + k * 2.2); r.material.opacity = (1 - k) * 0.9; }, () => { board.remove(m); board.remove(r); });
    for (let i = 0; i < 14; i++) { const s = sprite('glow', 0.35, { color: col, blending: T.AdditiveBlending }); s.position.copy(p).add(v3(rnd(-0.8, 0.8), rnd(0, 0.5), rnd(-0.8, 0.8))); part(s, { v: v3(0, rnd(1.5, 3), 0), life: rnd(1, 1.8) }); }
  }
  function lightning(p) {
    const pts = []; let x = p.x + rnd(-1, 1), z = p.z + rnd(-1, 1);
    for (let y = 18; y > p.y; y -= 1.6) { pts.push(v3(x, y, z)); x += rnd(-0.6, 0.6); z += rnd(-0.6, 0.6); } pts.push(p.clone());
    const l = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: '#eaf4ff', transparent: true })); board.add(l);
    anim(0.45, k => { l.material.opacity = k < 0.2 ? 1 : (Math.random() < 0.5 ? 1 - k : 0.2); }, () => board.remove(l));
    spark(p.clone().add(v3(0, 0.5, 0)), 12, '#cfe6ff');
  }
  function flash(col = '#fff', ms = 400) { flashEl.style.background = col; flashEl.classList.remove('on'); void flashEl.offsetWidth; flashEl.classList.add('on'); setTimeout(() => flashEl.classList.remove('on'), ms); }
  function breakGate() {
    if (!gate || gate.broken) return; gate.broken = true;
    gate.doors.forEach((d, i) => { const r0 = d.rotation.clone(); anim(0.8, k => { d.rotation.z = r0.z + k * 1.5; d.position.x = -0.35 + k * 0.9; d.position.y = 1.05 - k * 0.8; d.rotation.x = (i ? 1 : -1) * k * 0.3; }); });
    const p = v3(wx(gate.x), 1, wz(gate.y)); smokeBurst(p, 10); spark(p, 20, '#ffd9a0'); shake(0.4, 0.8); focus(p, { dist: fitDist * 0.5, go: 0.5, hold: 1.0 });
    for (let i = 0; i < 8; i++) { const m = mesh(G.box, mat('#6b4524'), rnd(0.1, 0.3), 0.08, rnd(0.1, 0.4)); m.position.copy(p); part(m, { v: v3(rnd(0, 4), rnd(2, 5), rnd(-3, 3)), life: 1.4, grav: 9, fade: false, spin: 6 }); }
  }
  // 충차: 통나무에 바퀴와 지붕, 성문 앞으로 굴러가 세 번 들이받는다
  function ram(a) {
    if (!gate) return;
    const g = new T.Group();
    const log = mesh(G.cyl, mat('#6b4524'), 0.16, 1.8, 0.16); log.rotation.z = Math.PI / 2; log.position.y = 0.55; g.add(log);
    g.add(put(g, mesh(G.cone, mat('#8a8a8a'), 0.18, 0.3, 0.18), 0.95, 0.55, 0)).rotation.z = -Math.PI / 2;
    const roof = mesh(G.cone4, mat('#7a5a34'), 0.9, 0.6, 0.7); roof.position.y = 1.1; roof.rotation.y = Math.PI / 4; g.add(roof);
    [[-0.5, 0.35], [-0.5, -0.35], [0.4, 0.35], [0.4, -0.35]].forEach(([x, z]) => { const w = mesh(G.cyl12, mat('#3d2a18'), 0.18, 0.06, 0.18); w.rotation.x = Math.PI / 2; w.position.set(x, 0.18, z); g.add(w); });
    const to = v3(wx(gate.x) - 1.3, 0.3, wz(gate.y)), fr = v3(wx(a.x), topAt(a.x, a.y), wz(a.y));
    g.position.copy(fr); board.add(g);
    anim(1.9, k => {
      if (k < 0.35) g.position.copy(fr.clone().lerp(to, k / 0.35));
      else { const kk = (k - 0.35) / 0.65, hit = Math.sin(kk * Math.PI * 3); log.position.x = Math.max(0, hit) * 0.45; if (hit > 0.95 && !g.userData.h) { g.userData.h = 1; spark(v3(wx(gate.x) - 0.4, 1, wz(gate.y)), 10, '#ffd9a0'); gate.doors.forEach(d => { d.rotation.y = rnd(-0.08, 0.08); }); } if (hit < 0.5) g.userData.h = 0; }
    }, () => { anim(0.5, k => { g.scale.setScalar(1 - k); }, () => board.remove(g)); });
  }
  function rings(center, col = '#ffd978', n = 3, size = 16, gap = 350) {
    for (let i = 0; i < n; i++) setTimeout(() => {
      if (!scene) return;
      const r = mesh(G.thin, glow(col, 0.9).clone(), 1, 1, 1, false); r.rotation.x = Math.PI / 2; r.position.copy(center); board.add(r);
      anim(1.6, k => { r.scale.setScalar(0.5 + k * size); r.scale.z = 1 + k * 4; r.material.opacity = (1 - k) * 0.8; }, () => board.remove(r));
    }, i * gap);
  }
  // 횃불과 항아리: 잠깐 밤이 되고, 적진 둘레에 횃불이 켜지며 항아리 조각이 튄다
  function torchNight(list) {
    const h0 = hemi.intensity, s0 = sun.intensity, bg = scene.background.clone(), night = new T.Color('#1a2033');
    const torches = [];
    list.forEach(u => { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + rnd(0, 1); const p = v3(wx(u.x) + Math.cos(a) * 1.4, topAt(u.x, u.y), wz(u.y) + Math.sin(a) * 1.4); const g = new T.Group(); g.add(put(g, mesh(G.cyl, mat('#4a3420'), 0.03, 0.9, 0.03), 0, 0.45, 0)); const f = sprite('fire', 0.8, { blending: T.AdditiveBlending }); f.position.y = 1.0; g.add(f); g.position.copy(p); g.visible = false; board.add(g); torches.push(g); setTimeout(() => { g.visible = true; for (let j = 0; j < 5; j++) { const m = mesh(G.box, mat('#b0643a'), 0.1, 0.06, 0.1); m.position.copy(p).add(v3(0, 0.8, 0)); part(m, { v: v3(rnd(-2, 2), rnd(1, 3), rnd(-2, 2)), life: 0.9, grav: 9, fade: false, spin: 8 }); } }, 400 + Math.random() * 900); } });
    anim(3.6, k => { const n = k < 0.2 ? k / 0.2 : k > 0.8 ? (1 - k) / 0.2 : 1; hemi.intensity = h0 * (1 - 0.7 * n); sun.intensity = s0 * (1 - 0.85 * n); scene.background.copy(bg).lerp(night, n); }, () => { hemi.intensity = h0; sun.intensity = s0; scene.background.copy(bg); torches.forEach(t => board.remove(t)); });
  }
  function openLoot(p) {
    p.opened = true; const g = p.g, lid = g.userData.lid;
    const w = new T.Vector3(); g.getWorldPosition(w);
    if (p.l.kind === 'chest' && lid) anim(0.5, k => { lid.rotation.x = -k * 1.9; });
    for (let i = 0; i < 16; i++) { const s = sprite('glow', 0.3, { color: '#ffd24a', blending: T.AdditiveBlending }); s.position.copy(w).add(v3(0, 0.5, 0)); part(s, { v: v3(rnd(-1.2, 1.2), rnd(2.5, 4.5), rnd(-1.2, 1.2)), life: rnd(0.8, 1.3), grav: 4 }); }
    setTimeout(() => anim(0.6, k => { g.scale.setScalar(1 - k); }, () => board.remove(g)), 900);
  }
  function floatAt(u, text, cls) {
    const el = document.createElement('div'); el.className = 't3-float ' + (cls || ''); el.textContent = text; labels.appendChild(el);
    const p = v3(wx(u.x) + rnd(-0.3, 0.3), topAt(u.x, u.y) + 2.2, wz(u.y));
    floats.push({ el, p, t: 0 });
  }

  // ---------- 카메라 연출 ----------
  let camBusy = false, shakeT = 0, shakeAmp = 0, camHome = null, camTok = 0;
  // 한 곳으로 다가가 잠시 보여 주고 제자리로 돌아온다 (연출 중에 새 연출이 오면 이어받고, 돌아갈 곳은 처음 자리)
  function focus(p, o = {}) {
    if (reduce || !controls) return;
    if (!camBusy) camHome = { t: controls.target.clone(), c: camera.position.clone() };
    camBusy = true; controls.enabled = false; const tok = ++camTok;
    const t0 = controls.target.clone(), c0 = camera.position.clone(), home = camHome;
    const dir = home.c.clone().sub(home.t).normalize(), dist = o.dist || fitDist * 0.55;
    const t1 = p.clone(), c1 = p.clone().addScaledVector(dir, dist); c1.y = Math.max(c1.y, p.y + dist * 0.45);
    const go = o.go || 0.6, hold = o.hold || 1.2, back = o.back || 0.8;
    const ez = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    anim(go, k => { if (tok !== camTok) return; const e = ez(k); controls.target.copy(t0).lerp(t1, e); camera.position.copy(c0).lerp(c1, e); camera.lookAt(controls.target); }, () => {
      setTimeout(() => { if (tok !== camTok) return; anim(back, k => { if (tok !== camTok) return; const e = ez(k); controls.target.copy(t1).lerp(home.t, e); camera.position.copy(c1).lerp(home.c, e); camera.lookAt(controls.target); }, () => { if (tok !== camTok) return; camBusy = false; controls.enabled = true; }); }, hold * 1000);
    });
  }
  function shake(amp = 0.35, dur = 0.6) { if (reduce) return; shakeT = dur; shakeAmp = amp; }
  const center = list => { const c = v3(0, 0, 0); list.forEach(u => c.add(v3(wx(u.x), topAt(u.x, u.y), wz(u.y)))); return c.multiplyScalar(1 / Math.max(1, list.length)); };
  function screenOf(u) {
    if (!scene || !camera) return null;
    const sq = squads.get(u.id), p = sq ? sq.g.position.clone() : v3(wx(u.x), topAt(u.x, u.y), wz(u.y)); p.y += 1;
    p.project(camera); const r = renderer.domElement.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  }

  // ---------- 기도 · 말씀 효과 ----------
  // 가는 빛기둥(기도하는 부대에서 하늘로)
  function riseLight(p, col = '#ffe7a0', dur = 1.6) {
    const m = mesh(G.cyl12, glow(col, 0).clone(), 0.35, 9, 0.35, false); m.position.copy(p).add(v3(0, 4.5, 0)); board.add(m);
    anim(dur, k => { m.material.opacity = Math.sin(k * Math.PI) * 0.55; m.scale.x = m.scale.z = 0.35 + k * 0.25; }, () => board.remove(m));
    for (let i = 0; i < 10; i++) { const s = sprite('glow', 0.32, { color: col, blending: T.AdditiveBlending }); s.position.copy(p).add(v3(rnd(-0.6, 0.6), rnd(0, 0.4), rnd(-0.6, 0.6))); part(s, { v: v3(0, rnd(2, 4), 0), life: rnd(0.9, 1.6) }); }
  }
  function kneel(sq) { if (!sq) return; sq.figs.concat(sq.lead ? [sq.lead] : []).forEach(f => { if (!f.visible) return; const s = f.scale.y; anim(1.4, k => { f.scale.y = s * (1 - Math.sin(k * Math.PI) * 0.25); }); }); }
  // 하늘 군대: 빛나는 천사와 불말(부대마다 둘러선다)
  function angel(col = '#fff6d8') {
    const g = new T.Group(), m = glow(col, 0.55);
    g.add(put(g, mesh(G.cone, m, 0.28, 0.9, 0.28, false), 0, 0.45, 0));
    g.add(put(g, mesh(G.sph, m, 0.13, 0.13, 0.13, false), 0, 1.0, 0));
    [-1, 1].forEach(s => { const w = mesh(G.plane, glow('#ffe7a0', 0.45), 0.5, 0.7, 1, false); w.material.side = T.DoubleSide; w.position.set(-0.08, 0.75, s * 0.28); w.rotation.set(0, s * 0.6, s * 0.4); g.add(w); });
    const halo = mesh(G.torus, glow('#ffd978', 0.9), 0.12, 0.12, 0.12, false); halo.rotation.x = Math.PI / 2; halo.position.y = 1.18; g.add(halo);
    return g;
  }
  function fireHorse() { const h = horse('#ff8a2a'); h.traverse(o => { if (o.isMesh) o.material = glow('#ff9a3a', 0.6); }); return h; }
  function hostOn(sq) {
    const g = new T.Group();
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4, e = i % 2 ? angel() : fireHorse(); e.position.set(Math.cos(a) * 1.25, 0.6, Math.sin(a) * 1.25); e.rotation.y = -a; e.userData.ph = a; e.scale.setScalar(0.01); g.add(e); anim(0.8, k => e.scale.setScalar(k * (i % 2 ? 1.2 : 0.9))); }
    sq.g.add(g); return g;
  }
  function nissiOn(sq) {
    const g = new T.Group();
    const pole = mesh(G.cyl, mat('#c9a24a'), 0.05, 3.6, 0.05); pole.position.y = 1.8; g.add(pole);
    const fl = mesh(G.flag, glow('#fff3c4', 0.85), 2.2, 2.2, 1, false); fl.material = new T.MeshBasicMaterial({ color: '#fff3c4', side: T.DoubleSide, transparent: true, opacity: 0.92 }); fl.position.set(0.68, 3.2, 0); g.add(fl); g.userData.flag = fl;
    const sp = sprite('glow', 3, { color: '#ffd978', blending: T.AdditiveBlending, opacity: 0.7 }); sp.position.y = 3.3; g.add(sp);
    g.position.set(-0.2, 0, 0.2); sq.g.add(g); return g;
  }
  // 홍해: 강물이 빠지고 양옆으로 물벽이 선다
  let parted = null;
  function partSea() {
    if (parted) return; parted = [];
    tiles.forEach((t, i) => {
      if (t.k !== '~' && t.k !== '=') return; const x = i % api.COLS, y = Math.floor(i / api.COLS);
      const X = wx(x), Z = wz(y);
      if (t.water) { const w0 = t.water; anim(1.2, k => { w0.scale.x = 1 - k * 0.95; }); }
      const old = t.block.material; t.block.material = mat('#b9a36e'); t.oldMat = old;
      if (t.k === '~') [-1, 1].forEach(s => { const wl = mesh(G.box, new T.MeshPhongMaterial({ color: '#3f8fbf', transparent: true, opacity: 0.62, shininess: 90, specular: '#e8f8ff' }), 0.35, 1, S, false); wl.position.set(X + s * 1.05, 0.1, Z); wl.scale.y = 0.01; board.add(wl); parted.push(wl); anim(1.4, k => { wl.scale.y = k * 3.4; wl.position.y = 0.1 + k * 1.7; }); for (let j = 0; j < 3; j++) { const sp = sprite('glow', 0.7, { color: '#cfefff', blending: T.AdditiveBlending }); sp.position.set(X + s * 1.05, rnd(1, 3), Z + rnd(-1, 1)); part(sp, { v: v3(s * rnd(0.5, 1.5), rnd(1, 2), 0), life: 1.2, grav: 3 }); } });
    });
  }
  function unpartSea() {
    if (!parted) return; const walls = parted; parted = null;
    walls.forEach(wl => { anim(0.9, k => { wl.scale.y = 3.4 * (1 - k); wl.position.y = 0.1 + 1.7 * (1 - k); wl.position.x += (wl.position.x > 0 ? -1 : 1) * 0.0; }, () => board.remove(wl)); });
    tiles.forEach(t => { if (t.oldMat) { t.block.material = t.oldMat; t.oldMat = null; } if (t.water) { const w0 = t.water; anim(0.9, k => { w0.scale.x = 0.05 + k * 0.95; }); for (let j = 0; j < 2; j++) { const sp = sprite('glow', 1.1, { color: '#bfe8ff', blending: T.AdditiveBlending }); sp.position.copy(t.block.position).add(v3(rnd(-0.8, 0.8), 0.5, rnd(-0.8, 0.8))); part(sp, { v: v3(rnd(-1, 1), rnd(2, 4), rnd(-1, 1)), life: 1, grav: 6 }); } } });
    shake(0.25, 0.8);
  }
  // 여리고: 성벽이 가라앉으며 무너지고 돌무더기가 된다
  function collapse(list) {
    const c = v3(wx(7), 1.5, 0);
    focus(c, { dist: fitDist * 0.62, go: 0.7, hold: 1.8, back: 0.9 });
    setTimeout(() => shake(0.5, 1.6), 600);
    extWalls.forEach(m => setTimeout(() => { const y0 = m.position.y; anim(1.4, k => { m.position.y = y0 - k * 2.2; m.rotation.x = k * 0.05; }); smokeBurst(m.position.clone().setY(1.5), 6); }, 700));
    list.forEach(([x, y], i) => {
      const t = tiles[y * api.COLS + x]; if (!t) return;
      const objs = [t.block].concat(t.objs || []), delay = 500 + i * 70;
      setTimeout(() => {
        objs.forEach(o => { const y0 = o.position.y, r = rnd(-0.3, 0.3); anim(1.1, k => { o.position.y = y0 - k * 2.6; o.rotation.z = r * k; }, () => { if (o !== t.block) board.remove(o); }); });
        smokeBurst(v3(wx(x), 1.2, wz(y)), 4);
        for (let j = 0; j < 4; j++) { const m = mesh(G.rock, mat('#b3a582'), rnd(0.15, 0.3), rnd(0.12, 0.25), rnd(0.15, 0.3)); m.position.set(wx(x), 2, wz(y)); part(m, { v: v3(rnd(-2, 2), rnd(1, 4), rnd(-2, 2)), life: 1.1, grav: 10, fade: false, spin: 5 }); }
        setTimeout(() => rubble(t, x, y), 1250);
      }, delay);
    });
    if (gate && !gate.broken) { gate.broken = true; setTimeout(() => { gate.doors.forEach(d => { anim(0.8, k => { d.rotation.z = k * 1.5; d.position.y = 1.05 - k * 0.9; }); }); anim(1, k => { gate.g.position.y = -k * 2.4; }); }, 600); }
  }
  function rubble(t, x, y) {
    t.k = 'R'; t.objs = [];
    const blk = t.block; blk.material = mat('#a69a7c'); blk.scale.y = 0.55; blk.position.y = 0.275; blk.rotation.z = 0;
    for (let j = 0; j < 5; j++) { const rk = mesh(G.rock, mat(j % 2 ? '#b3a582' : '#8f8268'), rnd(0.2, 0.45), rnd(0.15, 0.3), rnd(0.2, 0.45)); rk.position.set(wx(x) + rnd(-0.7, 0.7), 0.6, wz(y) + rnd(-0.7, 0.7)); rk.rotation.set(rnd(0, 3), rnd(0, 3), 0); board.add(rk); t.objs.push(rk); }
  }
  // 태양아 머물라: 하늘 가운데 큰 해, 금빛 하늘
  let sunFx = null;
  function sunStand() {
    if (sunFx) return;
    // 해는 화면 위쪽에 빛으로 띄운다(카메라 각도와 상관없이 보이게)
    const s = document.createElement('div'); s.className = 't3-sun'; wrap.appendChild(s);
    const bg0 = scene.background.clone(), gold = new T.Color('#ffd98a'), h0 = hemi.intensity, sc0 = sun.color.clone();
    sunFx = { s, bg0, h0, sc0 };
    anim(1.6, k => { scene.background.copy(bg0).lerp(gold, k * 0.55); hemi.intensity = h0 * (1 + k * 0.3); sun.color.copy(sc0).lerp(new T.Color('#ffc870'), k * 0.6); });
    flash('rgba(255,230,150,.55)', 700);
  }
  function sunEnd() { if (!sunFx) return; const f = sunFx; sunFx = null; f.s.classList.add('off'); anim(1.2, k => { scene.background.copy(f.bg0).lerp(new T.Color('#ffd98a'), 0.55 * (1 - k)); hemi.intensity = f.h0 * (1 + 0.3 * (1 - k)); }, () => { f.s.remove(); hemi.intensity = f.h0; sun.color.copy(f.sc0); }); }
  // 언약궤: 금 상자, 그룹 둘, 채 둘 — 아군 뒤에 빛나며 놓인다
  function ark() {
    const g = new T.Group(), gold = mat('#e2b04a', { emissive: '#5a3a08' });
    g.add(put(g, mesh(G.box, gold, 0.9, 0.5, 0.55), 0, 0.55, 0));
    g.add(put(g, mesh(G.box, mat('#f3d27a', { emissive: '#6a4a10' }), 0.95, 0.06, 0.6), 0, 0.82, 0));
    [-0.3, 0.3].forEach(x => { const c = mesh(G.cone, gold, 0.1, 0.35, 0.1); c.position.set(x, 1.02, 0); c.rotation.z = x > 0 ? 0.5 : -0.5; g.add(c); });
    [-0.2, 0.2].forEach(z => { const p = mesh(G.cyl, mat('#8b5a2b'), 0.03, 1.8, 0.03); p.rotation.z = Math.PI / 2; p.position.set(0, 0.45, z * 1.5); g.add(p); });
    const sp = sprite('glow', 2.6, { color: '#ffe7a0', blending: T.AdditiveBlending, opacity: 0.8 }); sp.position.y = 1; g.add(sp);
    g.position.set(wx(0) - 1.6, 0.3, 0); g.rotation.y = Math.PI / 2; board.add(g);
    riseLight(g.position.clone(), '#ffe7a0', 2.4);
  }
  // 말씀 선포 순간: 선포하는 장수에게서 금빛 고리와 빛, 하늘이 잠깐 밝아진다
  function wordCast(u, own) {
    const sq = u && squads.get(u.id), p = sq ? sq.pos.clone() : v3(wx(0), 0.4, 0);
    flash('rgba(255,236,170,.45)', 500);
    rings(p.clone().add(v3(0, 0.3, 0)), '#ffc850', 2, 5);
    riseLight(p, '#fff1c0', 2.2);
    if (sq) { kneel(sq); if (own) focus(p.clone().add(v3(0, 0.8, 0)), { dist: fitDist * 0.5, go: 0.5, hold: 0.9, back: 0.6 }); }
  }
  function smite(u, t) {
    const sq = u && squads.get(u.id), a = sq ? sq.pos.clone().add(v3(0, 1.4, 0)) : v3(wx(0), 3, 0), b = v3(wx(t.x), topAt(t.x, t.y) + 0.6, wz(t.y));
    const st = mesh(G.sph, glow('#fff3c4', 1), 0.22, 0.22, 0.22, false); board.add(st);
    const tr = sprite('glow', 1.3, { color: '#ffd978', blending: T.AdditiveBlending }); board.add(tr);
    focus(b, { dist: fitDist * 0.5, go: 0.5, hold: 1.2 });
    anim(0.75, k => { const p = a.clone().lerp(b, k); p.y += Math.sin(k * Math.PI) * 3; st.position.copy(p); tr.position.copy(p); }, () => {
      board.remove(st); board.remove(tr); flash('rgba(255,248,210,.8)', 350); shake(0.45, 0.6);
      const r = mesh(G.torus, glow('#ffe7a0', 1).clone(), 1, 1, 1, false); r.rotation.x = Math.PI / 2; r.position.copy(b); board.add(r);
      anim(0.9, k => { r.scale.setScalar(0.3 + k * 5); r.material.opacity = 1 - k; }, () => board.remove(r));
      spark(b, 30, '#fff1b0'); smokeBurst(b, 6);
    });
  }
  function skyFire(t) {
    const p = v3(wx(t.x), topAt(t.x, t.y), wz(t.y));
    focus(p, { dist: fitDist * 0.55, go: 0.5, hold: 1.4 });
    const col = mesh(G.beam, glow('#ff8a2a', 0).clone(), 0.9, 1, 0.9, false); col.position.copy(p).add(v3(0, 8, 0)); board.add(col);
    const core = mesh(G.cyl12, glow('#fff0b0', 0).clone(), 0.35, 16, 0.35, false); core.position.copy(p).add(v3(0, 8, 0)); board.add(core);
    anim(1.8, k => { const o = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85; col.material.opacity = o * 0.7; core.material.opacity = o; col.rotation.y += 0.08; }, () => { board.remove(col); board.remove(core); });
    for (let i = 0; i < 16; i++) setTimeout(() => { const f = sprite('fire', rnd(0.8, 1.5), { blending: T.AdditiveBlending }); f.position.copy(p).add(v3(rnd(-1, 1), rnd(6, 12), rnd(-1, 1))); part(f, { v: v3(0, -14, 0), life: 0.7 }); }, i * 50);
    setTimeout(() => { flash('rgba(255,150,60,.6)', 400); shake(0.5, 0.7); spark(p.clone().add(v3(0, 0.6, 0)), 30, '#ffb04a'); smokeBurst(p.clone().add(v3(0, 0.8, 0)), 8); }, 300);
  }
  function gideonFx(list) {
    torchNight(list); rings(center(B.units.filter(u => u.side === 'A' && !u.dead)).setY(0.6), '#ffd978', 3);
    list.forEach((u, i) => setTimeout(() => { const sq = squads.get(u.id); if (sq) { shakeSq(sq); spark(sq.pos.clone().add(v3(0, 0.8, 0)), 8, '#ffd9a0'); } }, 700 + i * 120));
    focus(center(list).setY(0.8), { dist: fitDist * 0.7, go: 0.6, hold: 1.4 });
  }

  // tactics.js가 부르는 효과
  function fx(kind, d) {
    if (!scene) return;
    const sqOf = u => u && squads.get(u.id), P = u => v3(wx(u.x), topAt(u.x, u.y), wz(u.y));
    switch (kind) {
      case 'move': { const sq = sqOf(d.u); if (sq && (sq.cell[0] !== d.u.x || sq.cell[1] !== d.u.y)) walk(sq, d.u.x, d.u.y); break; }
      case 'melee': lunge(d.a, d.d); break;
      case 'shot': { projectile(d.a, d.d, d.kind); const sq = sqOf(d.a), ts = sqOf(d.d); if (sq && ts) { const dir = ts.pos.clone().sub(sq.pos); turnTo(sq, Math.atan2(-dir.z, dir.x)); setTimeout(() => { shakeSq(ts); turnTo(sq, d.a.side === 'A' ? 0 : Math.PI); }, 700); } break; }
      case 'gate': if (d.ram) ram(d.a); else { lunge(d.a, null, v3(wx(d.x), 0.3, wz(d.y))); if (gate) gate.doors.forEach(o => { const r = o.rotation.y; anim(0.4, k => { o.rotation.y = r + Math.sin(k * 30) * 0.05 * (1 - k); }); }); } if (d.broke) setTimeout(breakGate, d.ram ? 1300 : 200); break;
      case 'cast': { const sq = sqOf(d.u); if (!sq) break; const col = d.kind === 'fire' ? '#ff8a3a' : '#b58cff'; const r = mesh(G.ring, glow(col, 0.9).clone(), 1, 1, 1, false); r.rotation.x = -Math.PI / 2; r.position.copy(sq.pos).add(v3(0, 0.1, 0)); board.add(r); anim(0.8, k => { r.scale.setScalar(1 + k * 1.2); r.material.opacity = 1 - k; }, () => board.remove(r));
        if (d.kind === 'fire') { const f = sprite('fire', 0.9, { blending: T.AdditiveBlending }), a = P(d.u).add(v3(0, 1.2, 0)), b = P(d.e).add(v3(0, 0.6, 0)); board.add(f); anim(0.6, k => { f.position.copy(a).lerp(b, k); f.position.y += Math.sin(k * Math.PI) * 2; }, () => board.remove(f)); }
        else { const s = sprite('swirl', 0.8), a = P(d.u).add(v3(0, 1.2, 0)), b = P(d.e).add(v3(0, 1.4, 0)); board.add(s); anim(0.6, k => { s.position.copy(a).lerp(b, k); s.material.rotation = k * 12; }, () => board.remove(s)); }
        break; }
      case 'fire': d.tiles.forEach(([x, y], i) => setTimeout(() => { const p = v3(wx(x), topAt(x, y) + 0.3, wz(y)); spark(p, 12, '#ff8a3a'); smokeBurst(p, 3); }, 250 + i * 180)); flash('rgba(255,140,40,.35)', 300); break;
      case 'burn': break; // sync가 불꽃을 붙인다
      case 'fizzle': { const p = P(d.e).add(v3(0, 1, 0)); smokeBurst(p, 3); break; }
      case 'confuse': { const sq = sqOf(d.e); if (sq) { const r0 = sq.g.rotation.y; anim(1.2, k => { sq.g.rotation.y = r0 + Math.sin(k * 20) * 0.35 * (1 - k); }); } break; }
      case 'pray': beam(P(d.u)); (d.near || []).forEach(u => { if (u !== d.u) { const p = P(u); for (let i = 0; i < 6; i++) { const s = sprite('glow', 0.3, { color: '#b8ffb0', blending: T.AdditiveBlending }); s.position.copy(p).add(v3(rnd(-0.7, 0.7), 0.3, rnd(-0.7, 0.7))); part(s, { v: v3(0, rnd(1, 2), 0), life: 1.2 }); } } }); break;
      case 'thunder': flash('rgba(230,240,255,.8)', 450); (d.list || []).forEach((u, i) => setTimeout(() => lightning(P(u)), i * 120)); break;
      case 'trumpet': { const A = B.units.filter(u => u.side === 'A'); const c = A.reduce((s, u) => s.add(P(u)), v3(0, 0, 0)).multiplyScalar(1 / Math.max(1, A.length)); c.y = 0.6; rings(c); break; }
      case 'torch': torchNight(d.list || []); break;
      case 'rout': { const sq = sqOf(d.u); if (sq && !sq.routing) rout(sq); break; }
      case 'panic': { const sq = sqOf(d.u); if (!sq) break; const f = sq.figs[0]; if (f) { const r = f.rotation.z; anim(1.0, k => { f.rotation.z = r + Math.sin(k * Math.PI) * 0.5; }); } shakeSq(sq); for (let i = 0; i < 4; i++) dust(sq.pos.clone().add(v3(rnd(-1, 1), 0.2, rnd(-1, 1)))); break; }
      case 'loot': { const p = lootProps.find(q => q.l.x === d.u.x && q.l.y === d.u.y && !q.opened); if (p) { if (d.lost) { smokeBurst(P(d.u).add(v3(0, 0.6, 0)), 5); } openLoot(p); } break; }
      case 'float': floatAt(d.u, d.text, d.cls); break;
      case 'duel': { const a = P(d.a), b = P(d.d), m = a.clone().lerp(b, 0.5).add(v3(0, 1.4, 0)); spark(m, 18, '#ffe7a0'); flash('rgba(255,90,60,.25)', 300); focus(m, { dist: fitDist * 0.42, go: 0.5, hold: 0.8 }); break; }
      case 'faith': if (d.u) { const p = P(d.u).add(v3(0, 1.2, 0)); for (let i = 0; i < 6; i++) { const s = sprite('glow', 0.35, { color: '#ffe7a0', blending: T.AdditiveBlending }); s.position.copy(p); part(s, { v: v3(rnd(-0.5, 0.5), rnd(2, 3.5), rnd(-0.5, 0.5)), life: 0.9 }); } } break;
      case 'prayLite': { riseLight(P(d.u)); kneel(sqOf(d.u)); break; }
      case 'word': wordCast(d.u, ['fear_not', 'jireh'].includes(d.w && d.w.id)); break;
      case 'wave': { const c = center(d.list || []).setY(0.5); rings(c, '#d8f0ff', 2); (d.list || []).forEach(u => { const sq = sqOf(u); if (sq) { sq.figs.forEach(f => { if (f.visible && !f.userData.down) { const y = f.userData.base.y; anim(0.6, k => { f.position.y = y + Math.sin(k * Math.PI) * 0.3; }); } }); spark(sq.pos.clone().add(v3(0, 1, 0)), 6, '#e8f6ff'); } }); break; }
      case 'jireh': (d.list || []).forEach((u, i) => setTimeout(() => riseLight(P(u), '#c8ffb0', 1.4), i * 120)); break;
      case 'host': flash('rgba(255,250,220,.6)', 500); focus(center(d.list || []).setY(1), { dist: fitDist * 0.6, go: 0.6, hold: 1.4 }); break;
      case 'nissi': { const p = P(d.u); riseLight(p, '#fff3c4', 2.4); focus(p.clone().add(v3(0, 1.5, 0)), { dist: fitDist * 0.45, go: 0.5, hold: 1.2 }); break; }
      case 'part': partSea(); focus(v3(wx(5), 0.5, 0), { dist: fitDist * 0.7, go: 0.7, hold: 1.6 }); shake(0.2, 1.4); break;
      case 'unpart': unpartSea(); break;
      case 'jericho': rings(center(B.units.filter(u => u.side === 'A' && !u.dead)).setY(0.6), '#ffd978', 7); collapse(d.tiles || []); break;
      case 'sun': sunStand(); break;
      case 'turn': sunEnd(); break;
      case 'gideon': gideonFx(d.list || []); break;
      case 'smite': smite(d.u, d.t); break;
      case 'skyfire': skyFire(d.t); break;
      case 'ark': ark(); break;
      case 'duelEnd': { const sq = sqOf(d.win); if (sq) spark(sq.pos.clone().add(v3(0, 1.6, 0)), 16, '#ffd978'); break; }
      case 'hq': beam(P(d.u), '#ffd978', 1.6); break;
      case 'end': if (d.win) { rings(v3(0, 0.6, 0), '#ffd978', 2); for (let i = 0; i < 30; i++) { const s = sprite('glow', 0.4, { color: ['#ffd978', '#ff8a70', '#7cc4ff'][i % 3], blending: T.AdditiveBlending }); s.position.set(rnd(-8, 8), rnd(3, 6), rnd(-6, 6)); part(s, { v: v3(rnd(-1, 1), rnd(1, 3), rnd(-1, 1)), life: 1.5, grav: 2 }); } } break;
      default: break;
    }
  }

  // ---------- 그리기 ----------
  const tmp = new T.Vector3();
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (!scene) return;
    const dt = Math.min(0.05, (t - last) / 1000); last = t; now = t / 1000;
    for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i]; a.t += dt; const k = Math.min(1, a.t / a.dur); a.step(k); if (k >= 1) { anims.splice(i, 1); a.done && a.done(); } }
    for (let i = parts.length - 1; i >= 0; i--) {
      const m = parts[i], u = m.userData; u.age += dt; const k = u.age / u.life;
      if (k >= 1) { board.remove(m); parts.splice(i, 1); continue; }
      u.v.y -= u.grav * dt; m.position.addScaledVector(u.v, dt);
      if (u.grow) m.scale.multiplyScalar(1 + u.grow * dt);
      if (u.spin) { m.rotation.x += u.spin * dt; m.rotation.z += u.spin * dt * 0.7; }
      if (u.fade && m.material) { if (u.op0 == null) u.op0 = m.material.opacity ?? 1; m.material.opacity = u.op0 * (1 - k); }
    }
    // 부대 가만히 숨쉬기 · 깃발 나부낌 · 선택 고리
    squads.forEach(sq => {
      if (sq.gone) return;
      if (sq.routing) return;
      sq.flag.rotation.y = Math.sin(now * 3 + sq.pos.x) * 0.25;
      if (!reduce && !sq.moving) sq.figs.forEach(f => { if (f.visible && !f.userData.down) f.position.y = f.userData.base.y + Math.max(0, Math.sin(now * 2 + f.userData.ph)) * 0.02; });
      const s = sq.sel ? 1.12 + Math.sin(now * 6) * 0.08 : 1.0; sq.ring.scale.set(s, s, 1);
      sq.ring.material = sq.sel ? glow('#ffd978', 0.95) : glow(sq.u.side === 'A' ? '#4aa8ff' : '#ff5a48', sq.u.acted && sq.u.side === 'A' ? 0.35 : 0.85);
      if (sq.fire) tickEmitter(sq.fire, dt);
      if (sq.host) sq.host.children.forEach(e => { const a = e.userData.ph + now * 0.6; e.position.set(Math.cos(a) * 1.25, 0.6 + Math.sin(now * 2 + a) * 0.15, Math.sin(a) * 1.25); e.rotation.y = -a; });
      if (sq.nissi) sq.nissi.userData.flag.rotation.y = Math.sin(now * 2.5) * 0.3;
      if (sq.conf) sq.conf.ss.forEach(s2 => { const a = now * 3 + s2.userData.ph; s2.position.set(Math.cos(a) * 0.7, Math.sin(now * 5 + s2.userData.ph) * 0.15, Math.sin(a) * 0.7); s2.material.rotation = -now * 4; });
      // 이름표
      tmp.copy(sq.g.position); tmp.y += sq.lh; tmp.project(camera);
      const w = wrap.clientWidth, h = wrap.clientHeight, vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
      sq.label.style.display = vis ? '' : 'none';
      if (vis) sq.label.style.transform = `translate(${((tmp.x + 1) / 2 * w).toFixed(1)}px, ${((1 - tmp.y) / 2 * h).toFixed(1)}px) translate(-50%, -100%)`;
    });
    tileFire.forEach(e => tickEmitter(e, dt));
    lootProps.forEach(p => { if (!p.opened) { p.g.userData.glow.material.opacity = 0.5 + Math.sin(now * 4) * 0.3; p.g.position.y = topAt(p.l.x, p.l.y) + Math.abs(Math.sin(now * 2)) * 0.06; } });
    tiles.forEach(t => { if (t.water) t.water.material.color.setHSL(0.54, 0.45, (t.k === '~' ? 0.42 : 0.62) + Math.sin(now * 1.5 + t.block.position.x * 0.5 + t.block.position.z) * 0.03); if (t.flag) t.flag.rotation.y = Math.sin(now * 3 + t.block.position.z) * 0.3; });
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.t += dt; if (f.t > 1.3) { f.el.remove(); floats.splice(i, 1); continue; } tmp.copy(f.p); tmp.y += f.t * 1.2; tmp.project(camera); f.el.style.transform = `translate(${((tmp.x + 1) / 2 * wrap.clientWidth).toFixed(1)}px, ${((1 - tmp.y) / 2 * wrap.clientHeight).toFixed(1)}px) translate(-50%, -50%)`; f.el.style.opacity = f.t > 0.9 ? (1.3 - f.t) / 0.4 : 1; }
    if (gateLabel && gate && !gate.broken) { tmp.set(wx(gate.x), 3.0, wz(gate.y)).project(camera); gateLabel.style.transform = `translate(${((tmp.x + 1) / 2 * wrap.clientWidth).toFixed(1)}px, ${((1 - tmp.y) / 2 * wrap.clientHeight).toFixed(1)}px) translate(-50%, -100%)`; }
    if (controls.enabled) controls.update();
    let sh = null;
    if (shakeT > 0) { shakeT -= dt; sh = v3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(shakeAmp * Math.max(0, shakeT)); camera.position.add(sh); }
    renderer.render(scene, camera);
    if (sh) camera.position.sub(sh);
  }

  const tileScreen = (x, y) => { const p = v3(wx(x), topAt(x, y), wz(y)).project(camera), r = renderer.domElement.getBoundingClientRect(); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }; };
  window.TAC3D = { available, open, close, sync, fx, screenOf, tileScreen, focus, get scene() { return scene; }, get camera() { return camera; } };
})();
