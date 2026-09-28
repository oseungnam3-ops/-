// 성경 삼국지 — 전술 전투: 들판 · 계곡 · 공성전을 칸 위에서 직접 지휘하고, 장수끼리 일기토를 벌인다.
// 출진 창에서 '직접 지휘'를 고르면 열린다. 결과는 game.js의 applyBattleResult로 넘겨 점령·포로·전리품을 처리한다.
// 병종(units.js)마다 이동·사거리·상성이 다르고, 3D 전장(tactics3d.js)에서 불·혼란·기도가 눈에 보인다. 2D 칸 보기도 남겨 둔다.
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const GM = () => window.GAME, T = () => GAME.tac;
  const COLS = 11, ROWS = 9, MAX_TURN = 20;

  // ---------- 전장 지도 ----------
  // . 풀밭  f 숲  h 언덕  ~ 강  = 여울  # 절벽  W 성벽  T 망루  G 성문  t 성 안  H 본영
  const MAPS = {
    field: { name: '들판 전투', desc: '탁 트인 들판 — 전차와 기마가 힘을 쓰고, 숲과 언덕이 방패가 된다.', rows: [
      'f....h...ff', '...f.......', '......f....', '..h......h.', '..........H', '....f......', '.f.....h...', '...........', 'ff.......f.'] },
    valley: { name: '계곡 전투', desc: '절벽 사이 좁은 골짜기 — 여울을 누가 먼저 차지하느냐가 승부다.', rows: [
      '###########', '#..f#~#.f.#', '.....~.....', '..f..~.h...', '.....=....H', '...h.~..f..', '.....=.....', '#.f.#~#...#', '###########'] },
    siege: { name: '공성전', desc: '성벽과 성문 — 사다리로 성벽을 넘거나 충차로 성문을 부숴라.', rows: [
      '.......WTtt', '.f.....Wttt', '....h..Wttt', '.......Tttt', '.......GtHt', '.......Tttt', '..h....Wttt', '.f.....Wttt', '.......WTtt'] },
  };
  const TER = {
    '.': { n: '풀밭', cost: 1, def: 0 }, f: { n: '숲', cost: 2, def: 0.2 }, h: { n: '언덕', cost: 2, def: 0.25 },
    '~': { n: '강', cost: 99, def: 0 }, '=': { n: '여울', cost: 2, def: -0.1 }, '#': { n: '절벽', cost: 99, def: 0 },
    W: { n: '성벽', cost: 99, def: 0.5 }, T: { n: '망루', cost: 99, def: 0.6 }, G: { n: '성문', cost: 99, def: 0.5 },
    t: { n: '성 안', cost: 1, def: 0.1 }, H: { n: '본영', cost: 1, def: 0.3 }, R: { n: '무너진 성벽', cost: 2, def: 0.15 },
  };
  const UD = window.UNITDEF, UT = UD.TYPES;
  const HORSE = u => UT[u.type].cls === 'horse', SHOT = u => UT[u.type].cls === 'shot';

  let B = null; // 전투 상태
  const R = (a, b) => a + Math.random() * (b - a);
  const esc = s => GM().esc(s), fmt = n => GM().fmt(n);
  const snd = (...a) => T().snd(...a);
  const at = (x, y) => B.units.find(u => !u.dead && u.x === x && u.y === y);
  const ter = (x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS) ? '#' : B.map[y][x];
  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const live = side => B.units.filter(u => !u.dead && u.side === side);
  const has = (u, k) => u.side === 'A' && B.it.has(k);
  const key = (x, y) => x + ',' + y;

  // ---------- 3D 보기 ----------
  let pref3d = true;
  try { pref3d = localStorage.getItem('bs-tac-view') !== '2d'; } catch (e) { /* 저장소 없음 */ }
  const V = () => (B && B.view3d && window.TAC3D) ? TAC3D : null;
  const fx = (kind, d) => { const v = V(); if (v) try { v.fx(kind, d || {}); } catch (e) { console.warn(e); } };
  const pace = ms => V() ? Math.round(ms * 1.8) : ms; // 3D에서는 움직임이 보이도록 조금 느리게

  // ---------- 시작 ----------
  // opts: { af, gens, soldiers, cid, train, unit, types, prophet, items, done(res) }
  function start(opts) {
    const c = GM().city(opts.cid), df = c.owner;
    const plains = T().PLAINS.includes(opts.cid), cap = df && GM().fac(df).capital === opts.cid;
    const kind = MAPS[opts.kind] ? opts.kind : c.def >= 70 || cap ? 'siege' : plains ? 'field' : 'valley';
    const M = MAPS[kind], it = new Set(opts.items || []);
    B = { kind, map: M.rows.map(r => r.split('')), turn: 1, units: [], opts, it, c, df, sel: null, phase: 'player', log: [], captured: [], beaten: [], duelWins: [], found: [], schemes: 0, burn: new Map(), loot: [], faith: 0, cd: {}, onceUsed: new Set(), wordTurn: 0, host: 0, nissi: null, parted: 0, duelBuff: 0, gateHp: 0, gateMax: 0, busy: false, duelsTried: new Set(), miracle: !!opts.prophet, ended: false };
    if (kind === 'siege') { B.gateMax = B.gateHp = 400 + c.def * 12; }
    const wallK = (it.has('ladder') ? 0.5 : 1) * (it.has('ram') ? 0.65 : 1);
    B.wallBonus = kind === 'siege' ? c.def * wallK / 180 : c.def * wallK / 400;
    // 공격군 배치: 왼쪽 두 줄. 장군마다 고른 병종으로
    const gens = opts.gens.slice(), wsum = gens.reduce((s, o) => s + o.war, 0);
    const types = opts.types || {};
    const tot = opts.soldiers - (opts.prophet ? 200 : 0); let rest = tot;
    const spots = [[1, 4], [1, 2], [1, 6], [0, 3], [0, 5]];
    gens.forEach((o, i) => { const n = i === gens.length - 1 ? rest : Math.round(tot * o.war / wsum); rest -= n; addUnit('A', o, n, types[o.id] || opts.unit || 'spear', spots[i]); });
    if (opts.prophet) addUnit('A', opts.prophet, 200, 'prophet', [0, 4]);
    // 수비군 배치: 그 세력의 병종으로 (공성전이면 성벽 위는 궁수·물매병)
    const doffs = df ? GM().offsIn(opts.cid, df).sort((a, b) => b.war - a.war).slice(0, 4) : [];
    const total = c.soldiers, garrison = doffs.length ? Math.round(total * 0.25) : total;
    const dsp = kind === 'siege' ? [[8, 3], [8, 5], [7, 3], [7, 5], [9, 4]] : kind === 'valley' ? [[7, 4], [7, 2], [7, 6], [9, 3], [9, 5]] : [[8, 4], [8, 2], [8, 6], [9, 3], [9, 5]];
    const siegeSpots = [[8, 0], [8, 8], [7, 3], [7, 5], [8, 4]];
    const dws = doffs.reduce((s, o) => s + o.war, 0);
    const dty = df ? UD.assign(df, doffs, { siege: kind === 'siege' }) : {};
    const shot = df ? UD.avail(df).filter(t => UT[t].cls === 'shot') : [];
    doffs.forEach((o, i) => {
      const n = Math.round((total - garrison) * o.war / Math.max(1, dws));
      let type = dty[o.id] || 'spear';
      if (kind === 'siege' && i < 2) type = shot[i % Math.max(1, shot.length)] || 'sling';
      addUnit('D', o, n, type, kind === 'siege' ? siegeSpots[i] : dsp[i]);
    });
    if (garrison > 0) addUnit('D', null, garrison, 'guard', kind === 'siege' ? [9, 3] : [10, 5]);
    // 믿음·기도·도구 보정
    B.units.forEach(u => { u.pw = power(u); });
    if (opts.prophet) B.units.filter(u => u.side === 'A').forEach(u => { u.pw *= 1 + Math.max(0, opts.prophet.fai - 60) / 200; });
    if ((opts.hops || 1) > 1) { const k = T().marchPow(opts.hops); B.units.filter(u => u.side === 'A').forEach(u => { u.pw *= k; }); }
    if (it.has('banner')) live('A').forEach(u => { u.morale = Math.min(100, u.morale + 15); });
    if (it.has('faith_shield')) live('A').forEach(u => { u.morale = Math.min(100, u.morale + 10); });
    // 영력: 군대의 신앙에서 시작하고 기도로 채운다. 말씀 카드는 시대와 가진 성물로 열린다
    const F = GM().fac(opts.af);
    B.faith = Math.round(Math.max(0, Math.min(40, 10 + (GM().avgFaith(opts.af) - 50) / 2)) + (it.has('anointing_horn') ? 30 : 0));
    B.cards = window.WORDS ? WORDS.unlocked(GM().S.scn, Object.assign({}, F.items || {}, Object.fromEntries([...it].map(k => [k, 1])))) : [];
    placeLoot();
    // 채색화 배경(2D): 불러오면 칸 무늬를 걷어내고 그림 위에 칸만 옅게 남긴다
    const g = $('#tGrid'); g.classList.remove('art'); g.style.backgroundImage = '';
    const url = GM().artKey && GM().artKey('@bf-' + kind);
    if (url) { const im = new Image(); im.onload = () => { if (B && B.kind === kind) { g.style.backgroundImage = `url('${url}')`; g.classList.add('art'); } }; im.src = url; }
    $('#tactic').hidden = false; document.body.classList.add('in-tactic');
    $('#tLog').innerHTML = ''; $('#tWord').hidden = true; $('#tVerse').hidden = true;
    setView(pref3d, true);
    T().setInBattle(true); snd('bgm', 'war'); snd('sfx', 'march');
    say(`⚔ ${M.name} — ${GM().CITY_INFO[opts.cid].name}. ${M.desc}`);
    const dT = [...new Set(live('D').filter(u => u.o).map(u => UT[u.type].n))];
    if (dT.length) say(`🛡 적 편성: ${dT.join('·')}${live('D').some(u => u.type === 'elephant') ? ' — 코끼리는 불을 무서워한다!' : ''}`);
    if ((opts.hops || 1) > 1) say(`🐪 ${opts.hops}칸 먼 길을 행군해 온 원정군 — 전력 ${Math.round(T().marchPow(opts.hops) * 100)}%`);
    if (it.has('trumpet')) { live('D').forEach(u => { u.soldiers = Math.round(u.soldiers * 0.92); u.morale -= 15; }); say('📯 양각 나팔 소리가 울리자 적진이 술렁인다!', 'horn'); fx('trumpet'); }
    if (it.has('torch')) { const ds = live('D'); ds.forEach(u => { u.soldiers = Math.round(u.soldiers * 0.94); u.morale -= 8; }); say('🔥 한밤에 항아리를 깨뜨리고 횃불을 들었다! 적진이 놀라 흩어진다. (삿 7:20)', 'fire'); fx('torch', { list: ds }); ds.filter(u => u.type === 'elephant').forEach(u => panic(u)); }
    if (it.has('banner')) say('🚩 여호와 닛시 — 군기 아래 아군의 사기가 오른다!');
    if (it.has('ark')) { live('D').forEach(u => { u.morale -= 10; }); say('📦 언약궤가 앞서 나아가니 적이 두려워 떤다. (수 6:4)', 'holy'); fx('ark'); }
    if (it.has('gideon_trumpet')) { live('D').forEach(u => { u.soldiers = Math.round(u.soldiers * 0.95); u.morale -= 5; }); say('🏺 항아리를 부수고 나팔을 부니 적진이 술렁인다. (삿 7:20)', 'horn'); fx('trumpet'); }
    if (it.has('anointing_horn')) say('🫙 기름 뿔을 부어 기름 부으니 영력이 차오른다. (삼상 16:13)');
    if (B.loot.length) say(`🎁 전장 곳곳에 ${B.loot.map(l => l.kind === 'chest' ? '보물 상자' : '보급 수레').join('·')}가 있다 — 부대를 보내 차지하라!`);
    if (opts.gens[0]) T().voiceOf(opts.gens[0], 'battle');
    render(true);
    hint('내 부대를 누르면 갈 수 있는 칸(파랑)과 공격할 적(빨강)이 보입니다.');
  }
  function addUnit(side, o, n, type, spot) {
    let [x, y] = spot;
    for (let k = 0; k < 20 && (at(x, y) || TER[ter(x, y)].cost > 50 && !(side === 'D' && 'WT'.includes(ter(x, y)))); k++) { y = (y + 1) % ROWS; if (k > 8) x = side === 'A' ? 0 : COLS - 1; }
    B.units.push({ id: 'u' + B.units.length, side, o, soldiers: Math.max(50, Math.round(n)), max: Math.max(50, Math.round(n)), type, x, y, moved: false, acted: false, morale: 70, confused: 0, burning: 0, dealt: 0, dead: false });
  }
  function power(u) {
    const f = u.side === 'A' ? B.opts.af : B.df;
    const lead = u.o ? u.o.war : 45, strat = u.o ? u.o.int : 40, train = u.side === 'A' ? B.opts.train : B.c.train;
    let p = (1 + (lead - 50) / 100 + (strat - 50) / 250) * (0.6 + train / 250);
    if (f) p *= (0.85 + GM().avgFaith(f) / 330) * (1 + T().buffVal(f, 'atk'));
    return p;
  }
  // 전장에 흩어진 보물 상자·보급 수레 (가운데쯤, 지나갈 수 있는 빈 칸)
  function placeLoot() {
    const n = Math.random() < 0.55 ? 2 : 1, xs = B.kind === 'siege' ? [2, 5] : [3, 7];
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 40; k++) {
        const x = xs[0] + Math.floor(Math.random() * (xs[1] - xs[0] + 1)), y = 1 + Math.floor(Math.random() * (ROWS - 2));
        if (TER[ter(x, y)].cost > 50 || ter(x, y) === 'H' || at(x, y) || B.loot.some(l => dist(l, { x, y }) < 3)) continue;
        B.loot.push({ x, y, kind: i === 0 && Math.random() < 0.6 ? 'chest' : 'supply', taken: false }); break;
      }
    }
  }
  function takeLoot(u) {
    const l = B.loot.find(q => !q.taken && q.x === u.x && q.y === u.y); if (!l) return;
    l.taken = true;
    if (u.side !== 'A') { say(`🔥 적이 ${l.kind === 'chest' ? '보물 상자' : '보급 수레'}를 먼저 차지해 불살랐다.`); fx('loot', { u, kind: l.kind, lost: true }); return; }
    let f, txt;
    if (l.kind === 'chest') {
      if (Math.random() < 0.55) { const k = T().rollItem(GM().fac(B.opts.af), B.kind === 'siege' ? 0.4 : 0.15); const I = T().itemInfo(k); f = { k }; txt = `${I.name}(${T().RARITY[I.rar].name})`; }
      else { const g = Math.round(R(150, 400)); f = { gold: g }; txt = `금 ${fmt(g)}`; }
    } else { const fd = Math.round(R(800, 1500)), wd = Math.round(R(150, 300)); f = { food: fd, wood: wd }; txt = `식량 ${fmt(fd)} · 목재 ${fmt(wd)}`; u.soldiers = Math.min(u.max, u.soldiers + Math.round(u.max * 0.05)); u.morale = Math.min(100, u.morale + 10); }
    B.found.push(f); snd('sfx', 'coin');
    say(`🎁 ${name(u)} 부대가 ${l.kind === 'chest' ? '보물 상자' : '보급 수레'}를 차지했다 — ${txt}!`);
    fx('loot', { u, kind: l.kind }); floatText(u, '🎁 ' + txt, 'heal');
  }

  // ---------- 이동 가능 칸 ----------
  function passable(u, x, y) {
    const k = ter(x, y);
    if (k === 'G') return u.side === 'D' || B.gateHp <= 0;
    if (k === 'W' || k === 'T') return u.side === 'D' || (B.it.has('ladder') && !HORSE(u) && u.type !== 'elephant' && u.type !== 'camel');
    if (k === '~' && (B.parted > 0 || has(u, 'elijah_mantle'))) return true; // 갈라진 바다 · 엘리야의 겉옷
    return TER[k].cost < 50;
  }
  function stepCost(u, x, y) {
    const k = ter(x, y);
    if ((k === 'W' || k === 'T') && u.side === 'A') return 99; // 사다리: 인접해 있으면 한 번에 올라탄다
    if (k === 'G') return 1;
    if (HORSE(u) && (k === 'f' || k === 'h' || k === '=')) return 3;
    if (u.type === 'camel' && k === '=') return 3;
    if (k === '~') return B.parted > 0 ? 1 : 2;
    return TER[k].cost === 99 ? 1 : TER[k].cost;
  }
  const moveOf = u => u.confused ? 0 : UT[u.type].mv + (HORSE(u) && has(u, 'horse') ? 1 : 0);
  const rangeOf = u => UT[u.type].rng + (SHOT(u) && (has(u, 'bow') || has(u, 'jonathan_bow')) ? 1 : 0) + (SHOT(u) && 'WTh'.includes(ter(u.x, u.y)) && u.type === 'archer' ? 1 : 0);
  function reach(u) {
    const mv = moveOf(u), best = new Map(); const q = [[u.x, u.y, 0]]; best.set(key(u.x, u.y), 0);
    while (q.length) {
      const [x, y, c] = q.shift();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy; if (!passable(u, nx, ny)) return;
        const o = at(nx, ny); if (o && o.side !== u.side) return;
        let nc = c + stepCost(u, nx, ny);
        if (nc >= 99) { if (c === 0 && mv > 0) nc = mv; else return; } // 성벽 오르기는 출발 칸에서만
        if (nc > mv) return; const k = key(nx, ny);
        if (best.has(k) && best.get(k) <= nc) return; best.set(k, nc); q.push([nx, ny, nc]);
      });
    }
    return [...best.keys()].map(k => k.split(',').map(Number)).filter(([x, y]) => !at(x, y) || (x === u.x && y === u.y));
  }
  function targets(u, from) {
    const p = from || u, rng = from ? UT[u.type].rng : rangeOf(u); if (!rng) return [];
    const ts = B.units.filter(e => !e.dead && e.side !== u.side && dist(p, e) <= rng && dist(p, e) >= 1);
    if (u.side === 'A' && B.kind === 'siege' && B.gateHp > 0) { const g = gatePos(); if (dist(p, g) <= 1) ts.push({ gate: true, x: g.x, y: g.y }); }
    return ts;
  }
  const gatePos = () => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (B.map[y][x] === 'G') return { x, y }; return { x: -9, y: -9 }; };

  // ---------- 전투 계산 ----------
  function defMul(u, a) {
    const k = ter(u.x, u.y); let d = (1 + TER[k].def) * UT[u.type].def;
    if (u.side === 'D' && 'WTtHG'.includes(k)) d += B.wallBonus;
    if ((HORSE(u) || u.type === 'elephant') && (k === 'f' || k === 'h')) d *= 0.85;
    if (u.side === 'A' && a && dist(a, u) === 1) d *= has(u, 'helmet') ? 1 / 0.88 : 1;
    if (u.side === 'A' && B.it.has('shield')) d *= 1.25;
    if (u.side === 'A' && B.it.has('gold_shield')) d *= 1.1;
    if (u.side === 'A' && B.it.has('faith_shield')) d *= 1 / 0.88;
    if (u.side === 'A' && B.host > 0) d *= 1 / 0.7; // 하늘 군대가 둘러쌈
    return d;
  }
  // 이 공격의 배율과 그 까닭(상성·지형·돌격 등 한두 마디)
  function atkMul(u, tgt, why) {
    let m = UT[u.type].atk; const k = ter(u.x, u.y), note = s => why && why.push(s);
    if (tgt && tgt.type) {
      const v = UD.vs(u.type, tgt.type); m *= v;
      if (v >= 1.25) note(`${UT[u.type].n}→${UT[tgt.type].n} 상성!`); else if (v <= 0.8) note('상성 불리');
      // 낙타 냄새: 낙타 곁의 말은 겁을 먹는다
      if (HORSE(u) && B.units.some(e => !e.dead && e.side !== u.side && e.type === 'camel' && dist(e, u) <= 1)) { m *= 0.75; note('말이 낙타에 놀람'); }
      // 코끼리 앞의 말
      if (HORSE(u) && tgt.type === 'elephant') m *= 0.85;
      if (UT[u.type].cls === 'shot' && dist(u, tgt) === 1) { m *= 0.7; note('근접전 약함'); }
    }
    if (u.type === 'chariot') { m *= k === '.' ? 1.25 : 0.75; if (k !== '.') note('전차가 험지에 막힘'); }
    else if ((HORSE(u) || u.type === 'elephant') && (k === 'f' || k === 'h')) m *= 0.85;
    if ((HORSE(u) || u.type === 'elephant' || u.type === 'camel') && u.moved && u.charge) { m *= 1.15 * (has(u, 'horse') ? 1.15 : 1); note('돌격!'); }
    if (SHOT(u) && tgt && dist(u, tgt) > 1 && ('hWT'.includes(k)) && !'hWT'.includes(ter(tgt.x, tgt.y))) { m *= 1.15; note('높은 곳에서 쏨'); }
    if (u.type === 'sling' && B.turn <= 2) m *= 1.2;
    if (SHOT(u) && has(u, 'sling')) m *= 1.12;
    if (SHOT(u) && has(u, 'bow')) m *= 1.15;
    if (SHOT(u) && has(u, 'jonathan_bow')) m *= 1.25;
    if (u.side === 'A' && u.o === B.opts.gens[0]) { const I = [...B.it].map(T().itemInfo).filter(Boolean); m *= 1 + I.reduce((s, x) => Math.max(s, x.atk || 0), 0) + (B.it.has('jawbone') ? 0.1 : 0); }
    if (u.type === 'sling' && has(u, 'david_sling')) m *= 1.2;
    if (u.side === 'A' && B.nissi && !B.nissi.caster.dead) { m *= 1.25; note('여호와 닛시'); }
    if (u.morale > 85) m *= 1.1; if (u.morale < 30) m *= 0.8;
    if (u.burning) m *= 0.85;
    return m;
  }
  function strike(a, d, counter, why) {
    const k = counter ? 0.5 : 1;
    const dmg = Math.max(0, Math.min(d.soldiers, a.soldiers * 0.14 * k * a.pw * atkMul(a, d, why) / Math.max(0.3, d.pw * defMul(d, a)) * R(0.85, 1.15)));
    d.soldiers = Math.round(d.soldiers - dmg); d.morale -= dmg / d.max * 60; a.dealt += dmg;
    floatText(d, '-' + fmt(Math.round(dmg)), 'hurt');
    return dmg;
  }
  function attack(a, d) {
    a.acted = a.moved = true;
    if (d.gate) {
      const dmg = Math.round(a.soldiers * 0.08 * (B.it.has('ram') ? 3 : 1) * (a.type === 'elephant' ? 2 : 1) * R(0.8, 1.2)); B.gateHp = Math.max(0, B.gateHp - dmg);
      floatText(d, '-' + fmt(dmg), 'hurt'); snd('sfx', 'build');
      say(B.gateHp > 0 ? `🪵 ${name(a)}이(가) ${B.it.has('ram') ? '충차로 ' : a.type === 'elephant' ? '코끼리로 ' : ''}성문을 들이친다 — 성문 ${Math.round(B.gateHp / B.gateMax * 100)}%` : `💥 성문이 부서졌다! ${name(a)}의 부대가 성 안으로 밀려든다!`);
      fx('gate', { a, x: d.x, y: d.y, broke: B.gateHp <= 0, ram: B.it.has('ram') });
      if (B.gateHp <= 0) { B.map[d.y][d.x] = 't'; snd('sfx', 'thunder'); }
      afterAction(); return;
    }
    const ranged = dist(a, d) > 1 || SHOT(a);
    snd('sfx', ranged ? 'page' : Math.random() < 0.5 ? 'clash' : 'hit'); shake(d);
    const fire = a.side === 'A' && a.type === 'archer' && B.it.has('firearrow');
    fx(ranged ? 'shot' : 'melee', { a, d, kind: a.type === 'sling' ? 'stone' : fire ? 'fire' : 'arrow' });
    const why = [];
    const dmg = strike(a, d, false, why);
    let line = `${a.side === 'A' ? '⚔' : '🛡'} ${name(a)}(${UT[a.type].n}) → ${name(d)}(${UT[d.type].n}) ${fmt(Math.round(dmg))}명${why.length ? ' · ' + [...new Set(why)].join(' ') : ''}`;
    if (!ranged && dist(a, d) === 1 && !d.dead && d.soldiers > 0 && UT[d.type].rng >= 1) { const c = strike(d, a, true); line += ` · 반격 ${fmt(Math.round(c))}`; }
    say(line);
    if (fire && !d.dead && Math.random() < 0.3) { ignite(d, 1); say(`🔥 불화살이 ${name(d)} 부대에 불을 붙였다!`); }
    if (a.type === 'elephant' && !ranged) trample(a, d);
    checkRout(d); checkRout(a); afterAction();
  }
  // 코끼리가 짓밟기: 과녁 옆의 적도 조금 다친다
  function trample(a, d) {
    B.units.filter(e => !e.dead && e.side === d.side && e !== d && dist(e, d) === 1).forEach(e => { const l = Math.round(e.soldiers * 0.05); e.soldiers -= l; floatText(e, '-' + fmt(l), 'hurt'); });
  }
  // 불붙음: 부대가 타오르고 코끼리는 날뛴다
  function ignite(u, turns) {
    u.burning = Math.max(u.burning, turns + 1); B.burn.set(key(u.x, u.y), Math.max(B.burn.get(key(u.x, u.y)) || 0, turns + 1));
    fx('burn', { u });
    if (u.type === 'elephant') panic(u);
  }
  function panic(u) {
    if (u.dead || u.panicked) return; u.panicked = true; u.confused = Math.max(u.confused, 2); u.morale -= 15;
    const near = B.units.filter(e => !e.dead && e !== u && dist(e, u) === 1);
    near.forEach(e => { const l = Math.round(e.soldiers * (e.side === u.side ? 0.08 : 0.04)); e.soldiers -= l; e.morale -= 6; floatText(e, '🐘-' + fmt(l), 'hurt'); });
    say(`🐘 불에 놀란 ${name(u)}의 코끼리가 날뛰며 ${near.filter(e => e.side === u.side).length ? '제 편까지 ' : ''}짓밟는다!`, 'thunder');
    fx('panic', { u }); setTimeout(() => { if (u) u.panicked = false; }, 50);
    near.forEach(checkRout);
  }
  function checkRout(u) {
    if (u.dead) return;
    if (u.soldiers < u.max * 0.12 || u.morale <= 0 || u.soldiers < 40) {
      u.dead = true; snd('sfx', u.side === 'D' ? 'victory' : 'defeat');
      let tail = '';
      if (u.side === 'D') gainFaith(6, null);
      if (u.o && u.side === 'D') { B.beaten.push(u.o); if (Math.random() < 0.35) { B.captured.push(u.o); tail = ` ${u.o.name}을(를) 사로잡았다!`; } }
      say(`${u.side === 'D' ? '🏳' : '💀'} ${name(u)} 부대가 무너졌다!${tail}`);
      fx('rout', { u });
      const drop = u.side === 'A' && B.it.has('banner') ? 4 : 8;
      B.units.filter(x => !x.dead && x.side === u.side).forEach(x => { x.morale -= drop; });
    }
  }
  const name = u => u.o ? u.o.name : (u.type === 'guard' ? '성 수비대' : UT[u.type].n);

  // ---------- 계략 · 기도 ----------
  function stratTargets(u) { return u.o && u.type !== 'prophet' ? B.units.filter(e => !e.dead && e.side !== u.side && dist(u, e) <= 2) : []; }
  function scheme(u, e, kind) {
    u.acted = u.moved = true;
    const ei = e.o ? e.o.int : 40, torch = has(u, 'torch'), fa = has(u, 'firearrow'), tr = has(u, 'trumpet');
    const k = ter(e.x, e.y);
    if (kind === 'fire') {
      const p = 0.35 + (u.o.int - ei) / 100 + (torch ? 0.25 : 0) + (fa ? 0.15 : 0) + (has(u, 'urim_thummim') ? 0.2 : 0) + (tr ? 0.05 : 0) + (e.type === 'elephant' ? 0.1 : 0) - ('~=tWTG'.includes(k) ? 0.3 : 0);
      fx('cast', { u, e, kind: 'fire' });
      if (Math.random() < p) {
        const loss = Math.round(e.soldiers * (k === 'f' ? 0.3 : 0.16)); e.soldiers -= loss; e.morale -= 15; B.schemes += u.side === 'A' ? 1 : 0;
        snd('sfx', 'fire'); flash(e, 'fire'); floatText(e, '🔥-' + fmt(loss), 'hurt');
        // 숲은 불이 번진다
        const tiles = [[e.x, e.y]];
        if (k === 'f') [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const x = e.x + dx, y = e.y + dy; if (ter(x, y) === 'f' || (ter(x, y) === '.' && Math.random() < 0.35)) tiles.push([x, y]); });
        tiles.forEach(([x, y]) => B.burn.set(key(x, y), k === 'f' ? 3 : 2));
        say(`🔥 ${name(u)}의 화계! ${name(e)} 부대가 불길에 휩싸였다 (-${fmt(loss)})${k === 'f' ? ' — 숲이 크게 타며 불이 번진다!' : ''}`);
        fx('fire', { e, tiles });
        ignite(e, k === 'f' ? 2 : 1);
        tiles.forEach(([x, y]) => { const o = at(x, y); if (o && o !== e && o.type === 'elephant') panic(o); });
        checkRout(e);
      } else { say(`💨 ${name(u)}의 화계가 ${name(e)}에게 간파당했다.`); snd('sfx', 'page'); fx('fizzle', { e }); }
    } else {
      const p = 0.3 + (u.o.int - ei) / 90 + (tr ? 0.1 : 0) + (has(u, 'urim_thummim') ? 0.2 : 0) - (e.side === 'A' && B.it.has('salvation_helmet') ? 0.2 : 0);
      fx('cast', { u, e, kind: 'confuse' });
      if (Math.random() < p) { e.confused = 2; e.morale -= 10; B.schemes += u.side === 'A' ? 1 : 0; flash(e, 'confuse'); say(`🌀 ${name(u)}의 교란! ${name(e)} 부대가 혼란에 빠져 움직이지 못한다.`); snd('sfx', 'horn'); fx('confuse', { e }); }
      else { say(`${name(e)}이(가) 교란에 넘어가지 않았다.`); fx('fizzle', { e }); }
    }
    afterAction();
  }
  // 기도: 선지자·제사장은 곁의 부대를 고치고 영력을 크게 채운다. 장수도 한 턴을 들여 기도하면 영력을 채운다.
  const prayK = u => (0.7 + GM().avgFaith(B.opts.af) / 100 * 0.6) * (1 + ((u.o ? u.o.fai : 60) - 60) / 150) * (B.it.has('tabernacle_lamp') ? 1.5 : 1);
  function gainFaith(n, u) {
    if (!B || n <= 0) return; const before = B.faith; B.faith = Math.min(100, Math.round(B.faith + n));
    if (B.faith > before) { fx('faith', { u, n: B.faith - before }); orb(u); }
    const cheap = (B.cards || []).filter(w => wordCost(w) <= B.faith && before < wordCost(w));
    if (cheap.length && u) hint(`📖 영력이 찼습니다 — 「${cheap[cheap.length - 1].name}」을(를) 선포할 수 있습니다.`);
  }
  function prayGeneral(u) {
    u.acted = u.moved = true; snd('sfx', 'holy');
    const n = Math.round(14 * prayK(u)); u.morale = Math.min(100, u.morale + 5);
    say(`🙏 ${name(u)}이(가) 무릎 꿇고 기도한다 — 영력 +${n}`);
    fx('prayLite', { u }); gainFaith(n, u); afterAction();
  }
  function pray(u) {
    if (u.type !== 'prophet') return prayGeneral(u);
    u.acted = u.moved = true; snd('sfx', 'holy');
    const aa = u.side === 'A' && B.it.has('aaron_rod') ? 2 : 1;
    const near = B.units.filter(x => !x.dead && x.side === u.side && dist(x, u) <= 2);
    if (u.side === 'A') gainFaith(Math.round(28 * prayK(u) * aa), u);
    near.forEach(x => { const h = Math.round(x.max * 0.08 * aa); x.soldiers = Math.min(x.max, x.soldiers + h); x.morale = Math.min(100, x.morale + 12); if (x.burning) x.burning = 0; floatText(x, '+' + fmt(h), 'heal'); });
    fx('pray', { u, near });
    let line = `🙏 ${name(u)}이(가) 기도하니 곁의 부대들이 힘을 얻는다.`;
    if (B.miracle && Math.random() < 0.3) { B.miracle = false; const foes = live(u.side === 'A' ? 'D' : 'A'); foes.forEach(e => { e.soldiers = Math.round(e.soldiers * 0.9); e.morale -= 20; flash(e, 'fire'); }); line += ' ⚡ 여호와께서 큰 우레를 발하사 적진이 어지러워졌다! (삼상 7:10)'; snd('sfx', 'thunder'); fx('thunder', { list: foes }); }
    say(line); afterAction();
  }

  // ---------- 말씀 선포 ----------
  // 영력을 써서 말씀 카드를 선포한다. 한 턴에 한 번, 카드마다 다시 쓰기까지 몇 턴이 걸린다.
  const WD = () => window.WORDS;
  function wordCost(w) { return Math.round((w.cost - (B.it.has('moses_staff') ? 10 : 0)) * (B.it.has('psalm_scroll') ? 0.75 : 1)); }
  function wordBlock(w) {
    if (B.onceUsed.has(w.id)) return '이번 전투에 이미 선포함';
    if (B.cd[w.id] > 0) return `${B.cd[w.id]}턴 뒤`;
    if (w.need === 'siege' && B.kind !== 'siege') return '공성전에서만';
    if (w.need === 'siege' && B.gateHp <= 0 && !B.map.some(r => r.includes('W'))) return '성벽이 이미 무너짐';
    if (w.need === 'water' && !B.map.some(r => r.some(k => k === '~' || k === '='))) return '물이 있는 전장에서만';
    if (B.wordTurn === B.turn) return '이번 턴에 이미 선포함';
    if (B.faith < wordCost(w)) return `영력 ${wordCost(w)} 필요`;
    return '';
  }
  function wordTray() {
    const box = $('#tWord'); if (!box) return;
    const e = WD().era(GM().S.scn);
    box.innerHTML = `<div class="tw-head"><b>📖 말씀 선포</b><span>영력 <em>${Math.round(B.faith)}</em> / 100 · 한 턴에 한 번</span><button class="btn" data-w="close" aria-label="닫기">✕</button></div>
      <div class="tw-list">${B.cards.map(w => { const why = wordBlock(w), v = WD().verse(w, e); return `<button class="tw-card${why ? ' off' : ''}" data-w="${w.id}" ${why ? 'aria-disabled="true"' : ''}><i>${w.icon}</i><b>${esc(w.name)}</b><em>${wordCost(w)}</em><small>${esc(w.fx)}</small><span class="tw-ref">${esc(v.ref)}${why ? ` · <u>${esc(why)}</u>` : ''}</span></button>`; }).join('') || '<p class="mute">아직 열린 말씀 카드가 없습니다.</p>'}</div>`;
    box.hidden = false;
  }
  function pickWord(id) {
    const w = WD().byId[id], why = wordBlock(w);
    if (why) { GM().toast(`「${w.name}」 — ${why}`); return; }
    $('#tWord').hidden = true;
    if (w.target === 'foe') { B.pending = { kind: 'word', w, list: live('D') }; B.sel = null; render(); hint(`「${w.name}」 — 말씀을 선포할 적 부대를 누르세요.`); return; }
    proclaim(w, null);
  }
  // 말씀 선포: 먼저 구절을 화면에 크게 띄우고, 잠시 뒤 효과가 나타난다
  function proclaim(w, tgt) {
    const cost = wordCost(w), e = WD().era(GM().S.scn), v = WD().verse(w, e), k = B.it.has('torah_scroll') ? 1.25 : 1;
    B.faith -= cost; B.cd[w.id] = w.cd; B.wordTurn = B.turn; if (w.once) B.onceUsed.add(w.id);
    B.busy = true; B.sel = null; B.pending = null; render();
    const caster = live('A').filter(u => u.o).sort((a, b) => (b.type === 'prophet') - (a.type === 'prophet') || b.o.fai - a.o.fai)[0] || live('A')[0];
    const vb = $('#tVerse');
    vb.innerHTML = `<div class="tv-card"><i>${w.icon}</i><p class="tv-name">「${esc(w.name)}」</p><p class="tv-text">${esc(v.text)}</p><p class="tv-ref">— ${esc(v.ref)}${caster && caster.o ? ` · ${esc(caster.o.name)}의 선포` : ''}</p></div>`;
    vb.hidden = false; vb.classList.remove('on'); void vb.offsetWidth; vb.classList.add('on');
    snd('sfx', 'holy'); if (caster && caster.o) T().voiceOf(caster.o, 'excl');
    say(`📖 말씀 선포 — 「${w.name}」 (${v.ref})`);
    fx('word', { w, u: caster, tgt });
    setTimeout(() => { if (!B || B.ended) return; applyWord(w, tgt, caster, k); render(); }, 1300);
    setTimeout(() => { vb.hidden = true; vb.classList.remove('on'); if (!B || B.ended) return; B.busy = false; render(); if (!checkWin() && B.phase === 'player') checkEndTurn(); }, 3300);
  }
  function applyWord(w, tgt, caster, k) {
    const A = live('A'), D = live('D');
    switch (w.id) {
      case 'fear_not':
        A.forEach(u => { u.confused = 0; u.burning = 0; u.morale = Math.min(100, u.morale + Math.round(25 * k)); floatText(u, '사기↑', 'heal'); });
        say('🕊 두려움이 걷히고 아군이 담대해졌다!'); fx('wave', { list: A }); break;
      case 'jireh':
        A.forEach(u => { const h = Math.round(u.max * 0.1 * k); u.soldiers = Math.min(u.max, u.soldiers + h); floatText(u, '+' + fmt(h), 'heal'); });
        say('🐏 여호와께서 준비하셨다 — 아군이 힘을 되찾는다.'); fx('jireh', { list: A }); break;
      case 'mahanaim':
        B.host = Math.round(2 * k); say(`👼 하늘 군대가 아군을 둘러쌌다! ${B.host}턴 동안 받는 피해 -30%`); fx('host', { list: A }); break;
      case 'nissi': {
        const c = caster || A[0]; B.nissi = { caster: c, x: c.x, turns: 3 }; say(`🚩 ${name(c)}이(가) 손을 들었다 — 제자리를 지키는 동안 아군 공격 +25%`); fx('nissi', { u: c }); break;
      }
      case 'red_sea': {
        B.parted = 3; say('🌊 큰 동풍에 물이 갈라져 강바닥이 마른 땅이 되었다! 2턴 동안 강을 건널 수 있다.'); fx('part', {});
        D.filter(u => ter(u.x, u.y) === '=').forEach(u => { const l = Math.round(u.soldiers * 0.12 * k); u.soldiers -= l; floatText(u, '🌊-' + fmt(l), 'hurt'); checkRout(u); });
        break;
      }
      case 'jericho_shout': {
        const tiles = [];
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ('WTG'.includes(B.map[y][x])) { tiles.push([x, y, B.map[y][x]]); B.map[y][x] = 'R'; }
        B.gateHp = 0; B.wallBonus = 0;
        D.filter(u => tiles.some(([x, y]) => x === u.x && y === u.y)).forEach(u => { const l = Math.round(u.soldiers * 0.15 * k); u.soldiers -= l; u.morale -= 20; floatText(u, '-' + fmt(l), 'hurt'); checkRout(u); });
        say('📯 크게 소리 질러 외치니 성벽이 무너져 내렸다! (수 6:20)', 'thunder'); fx('jericho', { tiles }); break;
      }
      case 'sun_stand_still':
        A.forEach(u => { if (!u.confused) { u.acted = u.moved = false; } });
        say('☀ 해가 하늘 가운데 머물렀다 — 아군이 한 번 더 움직인다!'); fx('sun', {}); break;
      case 'gideon_torch': {
        D.forEach(u => { u.confused = Math.max(u.confused, 1); u.morale -= 10; });
        D.forEach(u => { const n = D.filter(o => o !== u && !o.dead && dist(o, u) === 1)[0]; if (n) { const l = Math.round(n.soldiers * 0.07 * k); n.soldiers -= l; floatText(n, '⚔-' + fmt(l), 'hurt'); } });
        D.filter(u => u.type === 'elephant').forEach(panic);
        D.forEach(checkRout);
        say('🔥 여호와와 기드온의 칼이다! 적군이 동무끼리 칼로 친다! (삿 7:22)', 'horn'); fx('gideon', { list: D }); break;
      }
      case 'lord_of_hosts': {
        const t = tgt && !tgt.dead ? tgt : D.sort((a, b) => b.soldiers - a.soldiers)[0]; if (!t) break;
        const l = Math.round(t.soldiers * 0.3 * k); t.soldiers -= l; t.morale -= 30; B.duelBuff = 10; floatText(t, '-' + fmt(l), 'hurt');
        say(`🪨 만군의 여호와의 이름으로! ${name(t)} 부대가 크게 흔들린다 (-${fmt(l)}) · 일기토 무력 +10`); fx('smite', { u: caster, t }); checkRout(t); break;
      }
      case 'fire_from_heaven': {
        const t = tgt && !tgt.dead ? tgt : D[0]; if (!t) break;
        const l = Math.round(t.soldiers * 0.25 * k); t.soldiers -= l; t.morale -= 20; floatText(t, '🔥-' + fmt(l), 'hurt');
        const ring = D.filter(o => o !== t && dist(o, t) === 1); ring.forEach(o => { const q = Math.round(o.soldiers * 0.1 * k); o.soldiers -= q; floatText(o, '🔥-' + fmt(q), 'hurt'); });
        [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const x = t.x + dx, y = t.y + dy; if (TER[ter(x, y)] && TER[ter(x, y)].cost < 50) B.burn.set(key(x, y), 2); });
        say(`⚡ 여호와의 불이 하늘에서 내려 ${name(t)} 부대를 사른다! (-${fmt(l)})`, 'thunder'); fx('skyfire', { t }); ignite(t, 2); ring.forEach(o => { if (o.type === 'elephant') panic(o); }); checkRout(t); ring.forEach(checkRout); break;
      }
      default: break;
    }
  }
  // 갈라진 물이 돌아온다: 강바닥의 적은 휩쓸리고, 아군은 가까운 뭍으로 밀려난다
  function seaReturns() {
    say('🌊 물이 다시 돌아와 강바닥을 덮는다! (출 14:28)', 'thunder');
    B.units.filter(u => !u.dead && ter(u.x, u.y) === '~').forEach(u => {
      if (u.side === 'D') { const l = Math.round(u.soldiers * 0.5); u.soldiers -= l; floatText(u, '🌊-' + fmt(l), 'hurt'); say(`🌊 ${name(u)} 부대가 물에 휩쓸렸다 (-${fmt(l)})`); checkRout(u); return; }
      if (has(u, 'elijah_mantle')) return;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]].map(([dx, dy]) => [u.x + dx, u.y + dy]).find(([x, y]) => TER[ter(x, y)] && TER[ter(x, y)].cost < 50 && !at(x, y));
      if (n) { u.x = n[0]; u.y = n[1]; fx('move', { u }); } else { const l = Math.round(u.soldiers * 0.2); u.soldiers -= l; floatText(u, '🌊-' + fmt(l), 'hurt'); checkRout(u); }
    });
    B.units.filter(u => !u.dead && u.side === 'D' && ter(u.x, u.y) === '=').forEach(u => { const l = Math.round(u.soldiers * 0.2); u.soldiers -= l; floatText(u, '🌊-' + fmt(l), 'hurt'); checkRout(u); });
    fx('unpart', {});
  }
  // 영력 구슬: 기도한 부대에서 영력 막대로 빛이 날아간다
  function orb(u) {
    const bar = $('#tFaith .tf-bar'); if (!bar || !u || $('#tactic').hidden) return;
    const from = V() ? V().screenOf(u) : (() => { const r = $('#tGrid').getBoundingClientRect(); return { x: r.left + (u.x + 0.5) * tile, y: r.top + (u.y + 0.5) * tile }; })();
    if (!from) return;
    const to = bar.getBoundingClientRect(), e = document.createElement('i'); e.className = 't-orb';
    e.style.left = from.x + 'px'; e.style.top = from.y + 'px'; $('#tactic').appendChild(e);
    requestAnimationFrame(() => { e.style.left = (to.left + to.width * Math.min(1, B.faith / 100)) + 'px'; e.style.top = (to.top + to.height / 2) + 'px'; e.style.opacity = '0.2'; });
    setTimeout(() => { e.remove(); bar.classList.remove('gain'); void bar.offsetWidth; bar.classList.add('gain'); }, 750);
  }

  // ---------- 일기토 ----------
  function duelTargets(u) { return u.o && u.type !== 'prophet' ? B.units.filter(e => !e.dead && e.side !== u.side && e.o && dist(u, e) === 1) : []; }
  function challenge(u, e, byAI) {
    const a = u.o, d = e.o, k = [a.id, d.id].sort().join();
    if (byAI) { askDuel(e, u); return; }
    B.duelsTried.add(k); u.acted = u.moved = true;
    const acceptP = d.war >= a.war - 5 ? 0.85 : 0.35;
    if (Math.random() > acceptP) { e.morale -= 15; say(`${d.name}이(가) 일기토를 피했다! 겁먹은 ${name(e)} 부대의 사기가 떨어진다.`); floatText(e, '사기↓', 'hurt'); afterAction(); return; }
    duel(u, e, () => afterAction());
  }
  function askDuel(ai, me) {
    B.busy = true;
    const box = $('#tDuelAsk');
    box.innerHTML = `<div class="tda"><span class="thumb">${GM().portraitOf(ai.o)}</span><p><b>${esc(ai.o.name)}</b>이(가) <b>${esc(me.o.name)}</b>에게 일기토를 청한다!<br><small>무력 ${ai.o.war} 대 ${me.o.war}</small></p>
      <div><button class="btn primary" data-a="y">받아들인다</button><button class="btn" data-a="n">거절한다 (사기 하락)</button></div></div>`;
    box.hidden = false; T().voiceOf(ai.o, 'excl');
    box.onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; box.hidden = true; box.onclick = null;
      if (b.dataset.a === 'y') duel(me, ai, () => { B.busy = false; aiStep(); }, true);
      else { me.morale -= 15; say(`${me.o.name}이(가) 일기토를 거절했다. 부대의 사기가 떨어진다.`); B.busy = false; aiStep(); } };
  }
  // 베기 · 막기 · 필살(기합 3). 서로 고른 수로 겨룬다.
  function duel(mine, theirs, then, aiStarted) {
    const P = mine.side === 'A' ? mine : theirs, E = P === mine ? theirs : mine;
    const W = o => o.war + (P.o === o ? T().duelBonus(B.it) + B.duelBuff : 0);
    const st = { hp: [100, 100], ki: [0, 0], round: 1, log: [] };
    const box = $('#tDuel'); B.busy = true; snd('sfx', 'horn'); fx('duel', { a: P, d: E });
    const dmg = o => (10 + W(o) / 7) * R(0.85, 1.15);
    const drawD = (msg, hit) => {
      box.innerHTML = `<div class="dl-stage"><div class="dl-side me${hit === 0 ? ' hit' : ''}"><div class="dl-art">${GM().portraitOf(P.o, true)}</div><b>${esc(P.o.name)}</b><small>무력 ${W(P.o)}</small>
          <div class="dl-hp"><i style="width:${Math.max(0, st.hp[0])}%"></i></div><span class="dl-ki">기합 ${'●'.repeat(Math.min(5, st.ki[0]))}${'○'.repeat(Math.max(0, 3 - st.ki[0]))}</span></div>
        <div class="dl-vs">일기토<small>${Math.min(st.round, 8)} / 8합</small></div>
        <div class="dl-side foe${hit === 1 ? ' hit' : ''}"><div class="dl-art">${GM().portraitOf(E.o, true)}</div><b>${esc(E.o.name)}</b><small>무력 ${W(E.o)}</small>
          <div class="dl-hp"><i style="width:${Math.max(0, st.hp[1])}%"></i></div><span class="dl-ki">기합 ${'●'.repeat(Math.min(5, st.ki[1]))}${'○'.repeat(Math.max(0, 3 - st.ki[1]))}</span></div></div>
        <p class="dl-msg">${msg}</p>
        <div class="dl-cmds"><button class="btn danger primary" data-c="atk">⚔ 베기</button><button class="btn" data-c="def">🛡 막기</button><button class="btn primary" data-c="spc" ${st.ki[0] >= 3 ? '' : 'disabled'}>💥 필살 (기합 3)</button><button class="btn" data-c="run">물러난다</button></div>`;
    };
    const aiPick = () => { if (st.ki[1] >= 3 && Math.random() < 0.55) return 'spc'; if (st.hp[1] < 35 && Math.random() < 0.5) return 'def'; return Math.random() < 0.62 ? 'atk' : 'def'; };
    const NAME = { atk: '베기', def: '막기', spc: '필살' };
    const turn = c => {
      if (c === 'run') return end(1, `${P.o.name}이(가) 물러났다.`);
      const e = aiPick(); const pick = [c, e]; if (c === 'spc') st.ki[0] -= 3; if (e === 'spc') st.ki[1] -= 3;
      const d = [0, 0], ow = [P.o, E.o];
      const hitTo = (i, amt) => { d[i] += amt; st.ki[i] += 1; };
      for (let i = 0; i < 2; i++) {
        const j = 1 - i, me = pick[i], you = pick[j], base = dmg(ow[i]);
        if (me === 'atk') { if (you === 'def') { hitTo(j, base * 0.3); st.ki[j] += 1; if (Math.random() < 0.4) hitTo(i, dmg(ow[j]) * 0.5); } else hitTo(j, base); }
        if (me === 'spc') hitTo(j, base * (you === 'def' ? 1.3 : you === 'spc' ? 1.8 : 2.2));
        if (me === 'def' && you === 'def') st.ki[i] += 1;
      }
      st.hp[0] -= d[0]; st.hp[1] -= d[1];
      const msg = `${esc(P.o.name)}의 <b>${NAME[c]}</b> 대 ${esc(E.o.name)}의 <b>${NAME[e]}</b> — ${d[1] ? `적 -${Math.round(d[1])}` : '적 무사'} · ${d[0] ? `아군 -${Math.round(d[0])}` : '아군 무사'}`;
      snd('sfx', d[0] + d[1] > 0 ? 'clash' : 'page'); if (c === 'spc' || e === 'spc') snd('sfx', 'hit');
      st.round++;
      if (st.hp[1] <= 0 || st.hp[0] <= 0 || st.round > 8) {
        const w = st.hp[1] <= 0 && st.hp[0] > 0 ? 0 : st.hp[0] <= 0 && st.hp[1] > 0 ? 1 : st.hp[0] === st.hp[1] ? -1 : st.hp[0] > st.hp[1] ? 0 : 1;
        drawD(msg, d[0] > d[1] ? 0 : 1); setTimeout(() => end(w), 700); return;
      }
      drawD(msg, d[0] > d[1] ? 0 : d[1] > 0 ? 1 : -1); bind();
    };
    const end = (w, note) => {
      box.hidden = true; B.busy = false;
      if (w === -1) { say(`🗡 일기토! ${P.o.name} 대 ${E.o.name} — 팽팽하여 승부를 가리지 못했다.`); return then(); }
      const win = w === 0 ? P : E, lose = w === 0 ? E : P;
      win.morale = Math.min(100, win.morale + 20); lose.morale -= 40; lose.soldiers = Math.round(lose.soldiers * 0.75);
      T().voiceOf(win.o, 'excl');
      if (win.side === 'A' && !note) { B.duelWins.push(win.o); B.beaten.push(lose.o); gainFaith(10, win); }
      let line = `🗡 일기토! ${P.o.name} 대 ${E.o.name} — ${win.o.name}의 승리!${note ? ' ' + note : ''}`;
      if (!note) {
        if (lose.side === 'D' && Math.random() < 0.3) { B.captured.push(lose.o); lose.dead = true; line += ` ${lose.o.name}을(를) 사로잡았다!`; fx('rout', { u: lose }); }
        else if (Math.random() < 0.1 && !lose.o.hero) { T().killOfficer(lose.o); lose.dead = true; line += ` ${lose.o.name}이(가) 쓰러졌다.`; fx('rout', { u: lose }); }
      }
      say(line); snd('sfx', win.side === 'A' ? 'victory' : 'defeat'); fx('duelEnd', { win, lose });
      checkRout(lose); render(); then();
    };
    const bind = () => box.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => turn(b.dataset.c)));
    box.hidden = false; T().voiceOf(P.o, 'battle'); setTimeout(() => T().voiceOf(E.o, 'battle'), 900);
    drawD(aiStarted ? `${esc(E.o.name)}이(가) 먼저 칼을 뽑았다! 수를 고르세요.` : `${esc(P.o.name)}이(가) ${esc(E.o.name)}에게 일기토를 청했다! 수를 고르세요.`); bind();
  }

  // ---------- 플레이어 입력 ----------
  function moveUnit(u, x, y) {
    const d = Math.abs(u.x - x) + Math.abs(u.y - y);
    const from = { x: u.x, y: u.y };
    u.x = x; u.y = y; u.moved = true; u.charge = d >= 3;
    fx('move', { u, from });
    takeLoot(u);
    if (B.burn.get(key(x, y)) && u.type === 'elephant') panic(u);
  }
  function tap(x, y) {
    if (!B || B.busy || B.phase !== 'player' || B.ended) return;
    const u = at(x, y), s = B.sel;
    if (B.pending && B.pending.kind === 'word') { if (u && u.side === 'D') { const w = B.pending.w; B.pending = null; proclaim(w, u); } else { B.pending = null; hint('말씀 선포를 거두었습니다.'); render(); } return; }
    if (s && !s.acted) {
      // 계략·일기토 대상 고르기가 먼저 (궁수는 같은 적을 쏠 수도 있으므로)
      if (B.pending) { const e = at(x, y); if (e && e.side === 'D' && B.pending.list.includes(e)) { const p = B.pending; B.pending = null; if (p.kind === 'duel') challenge(s, e); else scheme(s, e, p.kind); return; } }
      const tg = targets(s).find(e => e.x === x && e.y === y);
      if (tg && (tg.gate || tg.side !== s.side)) { attack(s, tg); return; }
      if (!s.moved && !u && reach(s).some(([rx, ry]) => rx === x && ry === y)) { moveUnit(s, x, y); snd('sfx', 'page'); render(); if (!targets(s).length && !stratTargets(s).length && !duelTargets(s).length && s.type !== 'prophet') { s.acted = true; B.sel = null; render(); checkEndTurn(); } return; }
    }
    if (u && u.side === 'A' && !u.acted) { B.sel = u; B.pending = null; snd('sfx', 'click'); render(); info(u); return; }
    if (u) { info(u); return; }
    const l = B.loot.find(q => !q.taken && q.x === x && q.y === y);
    if (l) hint(l.kind === 'chest' ? '🎁 보물 상자 — 부대를 이 칸으로 보내면 아이템이나 금을 얻습니다.' : '🛒 보급 수레 — 차지하면 식량·목재를 얻고 그 부대가 조금 회복합니다.');
    B.sel = null; B.pending = null; render();
  }
  function afterAction() { B.sel = null; B.pending = null; render(); if (checkWin()) return; if (B.phase === 'player') checkEndTurn(); }
  function checkEndTurn() { if (live('A').every(u => u.acted)) setTimeout(() => { if (!B.ended && B.phase === 'player') endPlayer(); }, pace(350)); }
  function info(u) {
    const t = UT[u.type];
    hint(`${u.side === 'A' ? '아군' : '적군'} ${name(u)} · ${t.n}(이동 ${moveOf(u)} · 사거리 ${rangeOf(u)}) · 병력 ${fmt(u.soldiers)}/${fmt(u.max)} · 사기 ${Math.max(0, Math.round(u.morale))}${u.o ? ` · 무${u.o.war} 지${u.o.int}` : ''} · ${TER[ter(u.x, u.y)].n}${u.confused ? ' · 혼란' : ''}${u.burning ? ' · 불붙음' : ''} — ${t.desc}`);
  }

  // ---------- 턴 ----------
  function endPlayer() {
    if (B.ended) return;
    // 본영 점령
    const hq = live('A').find(u => ter(u.x, u.y) === 'H'); if (hq) { say(`🚩 ${name(hq)}이(가) 본영을 차지했다!`); fx('hq', { u: hq }); return finish(true); }
    if (B.nissi && (B.nissi.caster.dead || B.nissi.caster.moved && B.nissi.caster.x !== B.nissi.x)) { B.nissi = null; say('🚩 장수가 자리를 떠나 손이 내려왔다 — 여호와 닛시가 그친다.'); }
    B.phase = 'enemy'; B.sel = null; render(); hint('적군이 움직입니다…');
    B.queue = live('D').slice(); setTimeout(aiStep, pace(400));
  }
  function aiStep() {
    if (B.ended || B.busy) return;
    const u = B.queue.shift();
    if (!u) return newTurn();
    if (u.dead) return aiStep();
    if (u.confused) { u.confused--; u.acted = true; return setTimeout(aiStep, 120); }
    aiAct(u, 'A');
    if (checkWin()) return;
    if (!B.busy) setTimeout(aiStep, pace(260));
  }
  // side: 공격할 상대 편
  function aiAct(u, foeSide) {
    const foes = live(foeSide); if (!foes.length) return;
    // 일기토 도전(적 AI → 플레이어)
    if (foeSide === 'A' && u.o) {
      const cand = duelTargets(u).find(e => !B.duelsTried.has([u.o.id, e.o.id].sort().join()) && u.o.war >= e.o.war - 3);
      if (cand && Math.random() < 0.3) { B.duelsTried.add([u.o.id, cand.o.id].sort().join()); challenge(cand, u, true); return; }
    }
    if (u.type === 'prophet') { if (B.units.some(x => !x.dead && x.side === u.side && x !== u && dist(x, u) <= 2 && x.soldiers < x.max * 0.8)) pray(u); else moveToward(u, foes); return; }
    const best = ts => ts.slice().sort((a, b) => score(b) - score(a))[0];
    const score = e => e.gate ? -1 : UD.vs(u.type, e.type) * 1000 - e.soldiers / 10;
    let ts = targets(u).filter(e => !e.gate || foeSide === 'D');
    // 원거리 병종은 이미 쏠 수 있으면 제자리에서 쏜다
    if (ts.length && (SHOT(u) || u.moved)) return attack(u, best(ts));
    if (ts.length && Math.random() < 0.6) return attack(u, best(ts));
    const hold = u.side === 'D' && B.kind === 'siege' && 'WTtHG'.includes(ter(u.x, u.y)) && !foes.some(f => dist(f, u) <= 3);
    if (!hold) moveToward(u, foes);
    ts = targets(u).filter(e => !e.gate || foeSide === 'D');
    if (ts.length) return attack(u, best(ts));
    if (u.o && stratTargets(u).length && Math.random() < (foeSide === 'D' ? 0.5 : 0.25)) { const st = stratTargets(u), el = st.find(e => e.type === 'elephant'); scheme(u, el || st.sort((a, b) => b.soldiers - a.soldiers)[0], el || Math.random() < 0.6 ? 'fire' : 'confuse'); return; }
    if (foeSide === 'D' && B.kind === 'siege' && B.gateHp > 0) { const g = gatePos(); if (dist(u, g) === 1) return attack(u, { gate: true, x: g.x, y: g.y }); }
    u.acted = true; render();
  }
  function moveToward(u, foes) {
    const rs = reach(u); if (!rs.length) return;
    const goal = B.kind === 'siege' && u.side === 'A' ? (B.gateHp > 0 && !B.it.has('ladder') ? gatePos() : { x: 9, y: 4 }) : null;
    const rg = UT[u.type].rng;
    const score = ([x, y]) => {
      const p = { x, y }; const near = Math.min(...foes.map(f => dist(p, f)));
      let d = goal && !foes.some(f => dist(f, u) <= 4) ? dist(p, goal) : SHOT(u) ? Math.abs(near - rg) + (near < rg ? 1.5 : 0) : near;
      d -= TER[ter(x, y)].def * 2;
      if (HORSE(u) && 'fh'.includes(ter(x, y))) d += 1;
      if (B.burn.get(key(x, y))) d += 3;
      if (B.loot.some(l => !l.taken && l.x === x && l.y === y)) d -= 3;
      return d;
    };
    rs.sort((a, b) => score(a) - score(b)); const [x, y] = rs[0];
    if (x !== u.x || y !== u.y) { moveUnit(u, x, y); render(); }
  }
  function newTurn() {
    if (checkWin()) return;
    B.turn++;
    if (B.turn > MAX_TURN) { say(`⏳ ${MAX_TURN}턴이 지나도록 성을 떨어뜨리지 못했다. 군량이 다해 물러난다.`); return finish(false); }
    // 불길: 타는 칸의 부대가 다치고, 불은 차츰 꺼진다
    B.units.filter(u => !u.dead && (u.burning || B.burn.get(key(u.x, u.y)))).forEach(u => { const l = Math.round(u.soldiers * (has(u, 'bronze_serpent') ? 0.03 : 0.06)); u.soldiers -= l; u.morale -= 5; floatText(u, '🔥-' + fmt(l), 'hurt'); if (u.burning) u.burning--; checkRout(u); });
    [...B.burn.keys()].forEach(k => { const v = B.burn.get(k) - 1; if (v <= 0) B.burn.delete(k); else B.burn.set(k, v); });
    // 영력: 매 턴 조금씩 (언약궤가 있으면 많이)
    gainFaith(5 + (B.it.has('ark') ? 12 : 0), null);
    if (B.host > 0 && --B.host === 0) say('👼 하늘 군대가 물러갔다.');
    if (B.nissi && --B.nissi.turns <= 0) { B.nissi = null; say('🚩 모세의 손이 내려왔다 — 여호와 닛시의 힘이 그친다.'); }
    Object.keys(B.cd).forEach(k => { if (B.cd[k] > 0) B.cd[k]--; });
    if (B.parted > 0) { B.parted--; if (B.parted === 1) say('🌊 갈라진 물이 곧 돌아온다! 강바닥에서 빠져나와라.'); if (B.parted === 0) seaReturns(); }
    if (B.it.has('bronze_serpent')) live('A').forEach(u => { if (u.soldiers < u.max) { const h = Math.round(u.max * 0.04); u.soldiers = Math.min(u.max, u.soldiers + h); floatText(u, '🐍+' + fmt(h), 'heal'); } });
    // 길르앗의 유향: 아군 회복
    if (B.it.has('herb')) live('A').forEach(u => { if (u.soldiers < u.max) { const h = Math.round(u.max * 0.03); u.soldiers = Math.min(u.max, u.soldiers + h); floatText(u, '🌿+' + fmt(h), 'heal'); } });
    B.units.forEach(u => { u.moved = u.acted = false; u.charge = false; if (u.side === 'A' && u.confused) { u.confused--; if (u.confused >= 0) u.acted = u.moved = true; } });
    if (checkWin()) return;
    B.phase = 'player'; render(); hint(`제${B.turn}턴 — 내 부대를 움직이세요.`);
    fx('turn', { n: B.turn });
    if (B.auto) setTimeout(autoPlay, pace(300));
  }
  function autoPlay() {
    if (B.ended || B.phase !== 'player') return;
    const us = live('A').filter(u => !u.acted);
    const step = () => { if (B.ended || B.busy) return; const u = us.shift(); if (!u) return endPlayer(); if (!u.dead && !u.acted) aiAct(u, 'D'); u.acted = u.moved = true; if (checkWin()) return; setTimeout(step, pace(180)); };
    step();
  }
  function checkWin() {
    if (B.ended) return true;
    if (!live('D').length) { say('🏳 수비군이 모두 무너졌다!'); finish(true); return true; }
    if (!live('A').filter(u => u.type !== 'prophet').length) { say('💀 공격군이 모두 무너졌다.'); finish(false); return true; }
    return false;
  }

  // ---------- 끝 ----------
  function finish(win) {
    if (B.ended) return; B.ended = true;
    const o = B.opts, A = live('A').reduce((s, u) => s + u.soldiers, 0), D = live('D').reduce((s, u) => s + u.soldiers, 0);
    const lines = B.log.slice(-12);
    // 가장 많이 무찌른 장수를 맨 앞에 (성장 보너스)
    const mvp = B.units.filter(u => u.side === 'A' && u.o && u.type !== 'prophet').sort((a, b) => b.dealt - a.dealt)[0];
    const gens = mvp ? [mvp.o].concat(o.gens.filter(g => g !== mvp.o)) : o.gens;
    const ex = { beaten: B.beaten.concat(B.captured), duelWins: B.duelWins, found: B.found, schemes: B.schemes };
    const res = T().applyBattleResult(o.af, gens, o.soldiers, o.cid, o.train, B.it, A, win ? 0 : Math.max(D, 1), lines, win, o.hops || 1, ex);
    B.captured.forEach(c => { if (c.alive && !res.captives.includes(c) && c.fac !== o.af) res.captives.push(c); });
    snd('sfx', win ? 'victory' : 'defeat'); fx('end', { win });
    hint(win ? '🏳 승리! 전리품을 거둡니다…' : '퇴각합니다…');
    setTimeout(() => { $('#tactic').hidden = true; document.body.classList.remove('in-tactic'); const v = window.TAC3D; if (v) v.close(); T().setInBattle(false); o.done(res); }, win ? 1600 : 1100);
  }
  function retreat() { if (B.busy || B.ended) return; say('🏃 군사를 물린다.'); finish(false); }

  // ---------- 화면 ----------
  function setView(want3d, first) {
    const ok = want3d && window.TAC3D && TAC3D.available();
    B.view3d = !!ok;
    document.body.classList.toggle('tac3d', !!ok);
    if (ok) TAC3D.open(B, { tap, ter, TER, UT, name, rangeOf, reach, targets, COLS, ROWS });
    else if (window.TAC3D) TAC3D.close();
    if (!first) render();
    if (want3d && !ok && !first) GM().toast('이 기기에서는 3D 전장을 열 수 없어 칸 보기로 봅니다.');
  }
  let tile = 40;
  function layout() {
    const W = window.innerWidth, H = window.innerHeight;
    tile = Math.floor(Math.max(28, Math.min((W - 12) / COLS, (H - 250) / ROWS, 72)));
    const g = $('#tGrid'); g.style.width = tile * COLS + 'px'; g.style.height = tile * ROWS + 'px'; g.style.setProperty('--t', tile + 'px');
  }
  function render() {
    if (!B) return;
    const s = B.sel, rs = s && !s.moved && !s.acted ? reach(s) : [], ts = s && !s.acted ? targets(s) : [];
    const pend = B.pending ? B.pending.list : [];
    if (V()) { V().sync(B, { rs, ts, pend }); $('#tGrid').innerHTML = ''; }
    else {
      layout();
      const g = $('#tGrid');
      let h = '';
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const k = B.map[y][x], cls = { '.': 'g', f: 'f', h: 'h', '~': 'r', '=': 'fd', '#': 'c', W: 'w', T: 'tw', G: 'gt', t: 'tn', H: 'hq', R: 'rb' }[k];
        const mv = rs.some(([a, b]) => a === x && b === y) ? ' mv' : '', tg = ts.some(e => e.x === x && e.y === y) || pend.some(e => e.x === x && e.y === y) ? ' tg' : '';
        const l = B.loot.find(q => !q.taken && q.x === x && q.y === y);
        h += `<div class="tt ${cls}${mv}${tg}${B.burn.get(key(x, y)) ? ' burn' : ''}" data-x="${x}" data-y="${y}" style="left:${x * tile}px;top:${y * tile}px">${k === 'G' && B.gateHp > 0 ? `<i class="gate-hp" style="width:${B.gateHp / B.gateMax * 100}%"></i>` : ''}${l ? `<i class="t-loot">${l.kind === 'chest' ? '🎁' : '🛒'}</i>` : ''}</div>`;
      }
      B.units.forEach(u => {
        if (u.dead) return;
        const t = UT[u.type];
        h += `<div class="tu ${u.side === 'A' ? 'ally' : 'foe'}${u === s ? ' sel' : ''}${u.acted && u.side === 'A' ? ' done' : ''}${u.confused ? ' conf' : ''}${u.burning ? ' burning' : ''}" id="${u.id}" style="transform:translate(${u.x * tile}px,${u.y * tile}px);--tc:${t.col}">
          <span class="tu-face">${u.o ? GM().portraitOf(u.o) : `<b>${t.tag}</b>`}</span><em>${t.tag}</em><small>${fmt(u.soldiers)}</small><i class="tu-hp" style="width:${Math.max(0, u.soldiers / u.max * 100)}%"></i></div>`;
      });
      g.innerHTML = h;
    }
    const A = live('A').reduce((a, u) => a + u.soldiers, 0), D = live('D').reduce((a, u) => a + u.soldiers, 0);
    $('#tTop').innerHTML = `<b>${MAPS[B.kind].name}</b><span>${GM().CITY_INFO[B.opts.cid].name}</span><span class="t-turn">제${B.turn}/${MAX_TURN}턴</span><span class="t-a">아군 ${fmt(A)}</span><span class="t-d">적군 ${fmt(D)}</span>${B.kind === 'siege' ? `<span>성문 ${B.gateHp > 0 ? Math.round(B.gateHp / B.gateMax * 100) + '%' : '파괴'}</span>` : ''}${B.found.length ? `<span class="t-found">🎁 ${B.found.length}</span>` : ''}`;
    const acts = [];
    if (s && !s.acted && B.phase === 'player') {
      if (stratTargets(s).length) { acts.push(`<button class="btn" data-act="fire">🔥 화계</button>`); acts.push(`<button class="btn" data-act="confuse">🌀 교란</button>`); }
      if (duelTargets(s).length) acts.push(`<button class="btn danger" data-act="duel">🗡 일기토</button>`);
      if (s.type === 'prophet') acts.push(`<button class="btn primary" data-act="pray">🙏 기도 · 치유</button>`);
      else if (s.o) acts.push(`<button class="btn" data-act="pray">🙏 기도 (영력)</button>`);
      acts.push(`<button class="btn" data-act="wait">대기</button>`);
    }
    const ut = s ? UT[s.type] : null;
    // 영력 막대와 말씀 선포 단추
    const ready = (B.cards || []).filter(w => !wordBlock(w)).length;
    $('#tFaith').innerHTML = `<span class="tf-lbl">🙏 영력</span><span class="tf-bar${B.faith >= 100 ? ' full' : ''}"><i style="width:${Math.max(0, Math.min(100, B.faith))}%"></i>${(B.cards || []).map(w => `<u style="left:${Math.min(100, wordCost(w))}%" title="${esc(w.name)}"></u>`).join('')}</span><b class="tf-num">${Math.round(B.faith)}</b>
      <button class="btn${ready ? ' primary' : ''} tf-word" data-act="word" ${B.phase !== 'player' || B.busy ? 'disabled' : ''}>📖 말씀${ready ? ` <em>${ready}</em>` : ''}</button>${B.host > 0 ? `<span class="tf-buff">👼 ${B.host}</span>` : ''}${B.nissi ? `<span class="tf-buff">🚩 ${B.nissi.turns}</span>` : ''}${B.parted > 0 ? `<span class="tf-buff">🌊 ${B.parted}</span>` : ''}`;
    $('#tActs').innerHTML = (s ? `<span class="t-sel"><i style="--tc:${ut.col}">${ut.tag}</i><b>${esc(name(s))}</b> ${ut.n} · ${fmt(s.soldiers)}명 · 사기 ${Math.max(0, Math.round(s.morale))}</span>` : '') + acts.join('') +
      `<span class="t-sp"></span>${window.TAC3D && TAC3D.available() ? `<button class="btn t-view" data-act="view" aria-label="보기 바꾸기">${B.view3d ? '칸 보기' : '3D 보기'}</button>` : ''}<button class="btn" data-act="auto">${B.auto ? '자동 중…' : '자동 진행'}</button><button class="btn primary" data-act="end" ${B.phase !== 'player' ? 'disabled' : ''}>턴 종료</button><button class="btn" data-act="flee">퇴각</button>`;
  }
  function say(t, sfxName) { B.log.push(t); const l = $('#tLog'); if (l) { const p = document.createElement('p'); p.textContent = t; l.prepend(p); while (l.children.length > 4) l.lastChild.remove(); } if (sfxName) snd('sfx', sfxName); }
  function hint(t) { const e = $('#tHint'); if (e) e.textContent = t; }
  function floatText(u, t, cls) {
    if (V()) { fx('float', { u, text: t, cls }); return; }
    const g = $('#tGrid'); if (!g) return; const e = document.createElement('div'); e.className = 'tfloat ' + cls; e.textContent = t; e.style.left = (u.x + 0.5) * tile + 'px'; e.style.top = u.y * tile + 'px'; g.appendChild(e); setTimeout(() => e.remove(), 1100);
  }
  function shake(u) { if (V()) return; const e = document.getElementById(u.id); if (e) { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); } }
  function flash(u, k) { if (V()) return; const e = document.getElementById(u.id); if (e) { e.classList.add(k); setTimeout(() => e.classList.remove(k), 700); } }

  function bindUI() {
    $('#tGrid').addEventListener('click', e => { const t = e.target.closest('.tt, .tu'); if (!t) return; if (t.classList.contains('tu')) { const u = B.units.find(x => x.id === t.id); if (u) tap(u.x, u.y); } else tap(+t.dataset.x, +t.dataset.y); });
    $('#tActs').addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b || !B || B.busy) return; const s = B.sel, a = b.dataset.act;
      if (a === 'end') { live('A').forEach(u => { u.acted = true; }); B.sel = null; endPlayer(); }
      else if (a === 'flee') retreat();
      else if (a === 'view') { pref3d = !B.view3d; try { localStorage.setItem('bs-tac-view', pref3d ? '3d' : '2d'); } catch (er) { /* 저장소 없음 */ } setView(pref3d); }
      else if (a === 'word') { if (B.phase === 'player') wordTray(); }
      else if (a === 'auto') { B.auto = !B.auto; render(); if (B.auto && B.phase === 'player') autoPlay(); }
      else if (!s) return;
      else if (a === 'wait') { s.acted = s.moved = true; B.sel = null; render(); checkEndTurn(); }
      else if (a === 'pray') pray(s);
      else if (a === 'fire' || a === 'confuse') { B.pending = { kind: a, list: stratTargets(s) }; hint(a === 'fire' ? '불을 놓을 적 부대를 누르세요 (2칸 안, 숲이면 불이 번지고 코끼리는 날뜁니다).' : '혼란시킬 적 부대를 누르세요 (2칸 안).'); render(); }
      else if (a === 'duel') { const ds = duelTargets(s); if (ds.length === 1) challenge(s, ds[0]); else { B.pending = { kind: 'duel', list: ds }; hint('일기토를 청할 적장을 누르세요.'); render(); } }
    });
    $('#tFaith').addEventListener('click', e => { const b = e.target.closest('[data-act=word]'); if (b && B && !B.busy && B.phase === 'player') wordTray(); });
    $('#tWord').addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (!b || !B) return; if (b.dataset.w === 'close') { $('#tWord').hidden = true; return; } if (B.busy || B.phase !== 'player') return; pickWord(b.dataset.w); });
    window.addEventListener('resize', () => { if (B && !$('#tactic').hidden) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindUI); else bindUI();
  window.TACTICS = { start, tap, pickWord, get state() { return B; }, MAPS, TER };
})();
