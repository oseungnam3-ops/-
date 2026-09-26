// 성경 삼국지 — 전술 전투: 들판 · 계곡 · 공성전을 칸 위에서 직접 지휘하고, 장수끼리 일기토를 벌인다.
// 출진 창에서 '직접 지휘'를 고르면 열린다. 결과는 game.js의 applyBattleResult로 넘겨 점령·포로·전리품을 처리한다.
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const GM = () => window.GAME, T = () => GAME.tac;
  const COLS = 11, ROWS = 9, MAX_TURN = 20;

  // ---------- 전장 지도 ----------
  // . 풀밭  f 숲  h 언덕  ~ 강  = 여울  # 절벽  W 성벽  T 망루  G 성문  t 성 안  H 본영
  const MAPS = {
    field: { name: '들판 전투', desc: '탁 트인 들판 — 전차가 힘을 쓰고, 숲과 언덕이 방패가 된다.', rows: [
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
    t: { n: '성 안', cost: 1, def: 0.1 }, H: { n: '본영', cost: 1, def: 0.3 },
  };
  const UT = {
    spear: { n: '창병', mv: 4, rng: 1, tag: '창' }, sling: { n: '물매병', mv: 3, rng: 2, tag: '물' },
    chariot: { n: '전차병', mv: 6, rng: 1, tag: '전' }, prophet: { n: '선지자', mv: 3, rng: 0, tag: '예' },
    guard: { n: '수비대', mv: 3, rng: 1, tag: '수' },
  };

  let B = null; // 전투 상태
  const R = (a, b) => a + Math.random() * (b - a);
  const esc = s => GM().esc(s), fmt = n => GM().fmt(n);
  const snd = (...a) => T().snd(...a);
  const at = (x, y) => B.units.find(u => !u.dead && u.x === x && u.y === y);
  const ter = (x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS) ? '#' : B.map[y][x];
  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const live = side => B.units.filter(u => !u.dead && u.side === side);

  // ---------- 시작 ----------
  // opts: { af, gens, soldiers, cid, train, unit, prophet, items, done(res) }
  function start(opts) {
    const S = GM().S, c = GM().city(opts.cid), df = c.owner;
    const plains = T().PLAINS.includes(opts.cid), cap = df && GM().fac(df).capital === opts.cid;
    const kind = c.def >= 70 || cap ? 'siege' : plains ? 'field' : 'valley';
    const M = MAPS[kind], it = new Set(opts.items || []);
    B = { kind, map: M.rows.map(r => r.split('')), turn: 1, units: [], opts, it, c, df, sel: null, phase: 'player', log: [], captured: [], gateHp: 0, gateMax: 0, busy: false, duelsTried: new Set(), miracle: !!opts.prophet, ended: false };
    if (kind === 'siege') { B.gateMax = B.gateHp = 400 + c.def * 12; }
    const wallK = (it.has('ladder') ? 0.5 : 1) * (it.has('ram') ? 0.65 : 1);
    B.wallBonus = kind === 'siege' ? c.def * wallK / 180 : c.def * wallK / 400;
    // 공격군 배치: 왼쪽 두 줄
    const gens = opts.gens.slice(), wsum = gens.reduce((s, o) => s + o.war, 0);
    let rest = opts.soldiers - (opts.prophet ? 200 : 0);
    const spots = [[1, 4], [1, 2], [1, 6], [0, 3], [0, 5]];
    gens.forEach((o, i) => { const n = i === gens.length - 1 ? rest : Math.round((opts.soldiers - (opts.prophet ? 200 : 0)) * o.war / wsum); rest -= n; addUnit('A', o, n, opts.unit || 'spear', spots[i]); });
    if (opts.prophet) addUnit('A', opts.prophet, 200, 'prophet', [0, 4]);
    // 수비군 배치
    const doffs = df ? GM().offsIn(opts.cid, df).sort((a, b) => b.war - a.war).slice(0, 4) : [];
    const total = c.soldiers, garrison = doffs.length ? Math.round(total * 0.25) : total;
    const dsp = kind === 'siege' ? [[8, 3], [8, 5], [7, 3], [7, 5], [9, 4]] : kind === 'valley' ? [[7, 4], [7, 2], [7, 6], [9, 3], [9, 5]] : [[8, 4], [8, 2], [8, 6], [9, 3], [9, 5]];
    const siegeSpots = [[8, 0], [8, 8], [7, 3], [7, 5], [8, 4]];
    const dws = doffs.reduce((s, o) => s + o.war, 0);
    doffs.forEach((o, i) => {
      const n = Math.round((total - garrison) * o.war / Math.max(1, dws));
      const type = kind === 'siege' && i < 2 ? 'sling' : (i === doffs.length - 1 && o.int > o.war ? 'sling' : 'spear');
      addUnit('D', o, n, type, kind === 'siege' ? siegeSpots[i] : dsp[i]);
    });
    if (garrison > 0) addUnit('D', null, garrison, 'guard', kind === 'siege' ? [9, 3] : [10, 4 === 4 ? 5 : 4]);
    // 믿음·기도·도구 보정
    B.units.forEach(u => { u.pw = power(u); });
    if (opts.prophet) B.units.filter(u => u.side === 'A').forEach(u => { u.pw *= 1 + Math.max(0, opts.prophet.fai - 60) / 200; });
    if (it.has('trumpet')) { live('D').forEach(u => { u.soldiers = Math.round(u.soldiers * 0.92); u.morale -= 15; }); say('📯 양각 나팔 소리가 울리자 적진이 술렁인다!', 'horn'); }
    render(true);
    $('#tactic').hidden = false; document.body.classList.add('in-tactic');
    T().setInBattle(true); snd('bgm', 'war'); snd('sfx', 'march');
    say(`⚔ ${M.name} — ${GM().CITY_INFO[opts.cid].name}. ${M.desc}`);
    if (opts.gens[0]) T().voiceOf(opts.gens[0], 'battle');
    hint('내 부대를 누르면 갈 수 있는 칸(파랑)과 공격할 적(빨강)이 보입니다.');
  }
  function addUnit(side, o, n, type, spot) {
    let [x, y] = spot;
    for (let k = 0; k < 20 && (at(x, y) || TER[ter(x, y)].cost > 50 && !(side === 'D' && 'WT'.includes(ter(x, y)))); k++) { y = (y + 1) % ROWS; if (k > 8) x = side === 'A' ? 0 : COLS - 1; }
    B.units.push({ id: 'u' + B.units.length, side, o, soldiers: Math.max(50, Math.round(n)), max: Math.max(50, Math.round(n)), type, x, y, moved: false, acted: false, morale: 70, confused: 0, dead: false });
  }
  function power(u) {
    const S = GM().S, f = u.side === 'A' ? B.opts.af : B.df;
    const lead = u.o ? u.o.war : 45, strat = u.o ? u.o.int : 40, train = u.side === 'A' ? B.opts.train : B.c.train;
    let p = (1 + (lead - 50) / 100 + (strat - 50) / 250) * (0.6 + train / 250);
    if (f) p *= (0.85 + GM().avgFaith(f) / 330) * (1 + T().buffVal(f, 'atk'));
    return p;
  }

  // ---------- 이동 가능 칸 ----------
  function passable(u, x, y) {
    const k = ter(x, y);
    if (k === 'G') return u.side === 'D' || B.gateHp <= 0;
    if (k === 'W' || k === 'T') return u.side === 'D' || B.it.has('ladder');
    return TER[k].cost < 50;
  }
  function stepCost(u, x, y) {
    const k = ter(x, y);
    if ((k === 'W' || k === 'T') && u.side === 'A') return 99; // 사다리: 인접해 있으면 한 번에 올라탄다
    if (k === 'G') return 1;
    if (u.type === 'chariot' && (k === 'f' || k === 'h')) return 3;
    return TER[k].cost === 99 ? 1 : TER[k].cost;
  }
  function reach(u) {
    const mv = u.confused ? 0 : UT[u.type].mv, best = new Map(); const q = [[u.x, u.y, 0]]; best.set(u.x + ',' + u.y, 0);
    while (q.length) {
      const [x, y, c] = q.shift();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy; if (!passable(u, nx, ny)) return;
        const o = at(nx, ny); if (o && o.side !== u.side) return;
        let nc = c + stepCost(u, nx, ny);
        if (nc >= 99) { if (c === 0) nc = mv; else return; } // 성벽 오르기는 출발 칸에서만
        if (nc > mv) return; const key = nx + ',' + ny;
        if (best.has(key) && best.get(key) <= nc) return; best.set(key, nc); q.push([nx, ny, nc]);
      });
    }
    return [...best.keys()].map(k => k.split(',').map(Number)).filter(([x, y]) => !at(x, y) || (x === u.x && y === u.y));
  }
  function targets(u, from) {
    const p = from || u, rng = UT[u.type].rng; if (!rng) return [];
    const ts = B.units.filter(e => !e.dead && e.side !== u.side && dist(p, e) <= rng && dist(p, e) >= 1);
    if (u.side === 'A' && B.kind === 'siege' && B.gateHp > 0) { const g = gatePos(); if (dist(p, g) <= 1) ts.push({ gate: true, x: g.x, y: g.y }); }
    return ts;
  }
  const gatePos = () => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (B.map[y][x] === 'G') return { x, y }; return { x: -9, y: -9 }; };

  // ---------- 전투 계산 ----------
  function defMul(u) { const k = ter(u.x, u.y); let d = 1 + TER[k].def; if (u.side === 'D' && 'WTtHG'.includes(k)) d += B.wallBonus; if (u.type === 'chariot' && (k === 'f' || k === 'h')) d *= 0.8; return d; }
  function atkMul(u, tgt) { let m = 1; const k = ter(u.x, u.y); if (u.type === 'chariot') m *= (k === '.' ? 1.25 : 0.75); if (u.type === 'sling' && u.side === 'A' && B.it.has('sling')) m *= 1.12; if (u.morale > 85) m *= 1.1; if (u.morale < 30) m *= 0.8; if (tgt && tgt.side === 'A' && B.it.has('shield')) m *= 0.8; return m; }
  function strike(a, d, counter) {
    const k = counter ? 0.5 : 1;
    const dmg = Math.min(d.soldiers, a.soldiers * 0.14 * k * a.pw * atkMul(a, d) / Math.max(0.3, d.pw * defMul(d)) * R(0.85, 1.15));
    d.soldiers = Math.round(d.soldiers - dmg); d.morale -= dmg / d.max * 60;
    floatText(d, '-' + fmt(Math.round(dmg)), 'hurt');
    return dmg;
  }
  function attack(a, d) {
    a.acted = a.moved = true;
    if (d.gate) {
      const dmg = Math.round(a.soldiers * 0.08 * (B.it.has('ram') ? 3 : 1) * R(0.8, 1.2)); B.gateHp = Math.max(0, B.gateHp - dmg);
      floatText(d, '-' + fmt(dmg), 'hurt'); snd('sfx', 'build');
      say(B.gateHp > 0 ? `🪵 ${name(a)}이(가) 성문을 들이친다 — 성문 ${Math.round(B.gateHp / B.gateMax * 100)}%` : `💥 성문이 부서졌다! ${name(a)}의 부대가 성 안으로 밀려든다!`);
      if (B.gateHp <= 0) B.map[d.y][d.x] = 't';
      afterAction(); return;
    }
    snd('sfx', Math.random() < 0.5 ? 'clash' : 'hit'); shake(d);
    const dmg = strike(a, d, false);
    let line = `${a.side === 'A' ? '⚔' : '🛡'} ${name(a)} → ${name(d)} ${fmt(Math.round(dmg))}명`;
    if (UT[a.type].rng === 1 && dist(a, d) === 1 && !d.dead && d.soldiers > 0 && UT[d.type].rng >= 1) { const c = strike(d, a, true); line += ` · 반격 ${fmt(Math.round(c))}`; }
    say(line);
    checkRout(d); checkRout(a); afterAction();
  }
  function checkRout(u) {
    if (u.dead) return;
    if (u.soldiers < u.max * 0.12 || u.morale <= 0 || u.soldiers < 40) {
      u.dead = true; snd('sfx', u.side === 'D' ? 'victory' : 'defeat');
      let tail = '';
      if (u.o && u.side === 'D' && Math.random() < 0.35) { B.captured.push(u.o); tail = ` ${u.o.name}을(를) 사로잡았다!`; }
      say(`${u.side === 'D' ? '🏳' : '💀'} ${name(u)} 부대가 무너졌다!${tail}`);
      B.units.filter(x => !x.dead && x.side === u.side).forEach(x => { x.morale -= 8; });
    }
  }
  const name = u => u.o ? u.o.name : (u.type === 'guard' ? '성 수비대' : UT[u.type].n);

  // ---------- 계략 · 기도 ----------
  function stratTargets(u) { return u.o && u.type !== 'prophet' ? B.units.filter(e => !e.dead && e.side !== u.side && dist(u, e) <= 2) : []; }
  function scheme(u, e, kind) {
    u.acted = u.moved = true;
    const ei = e.o ? e.o.int : 40, torch = u.side === 'A' && B.it.has('torch');
    const k = ter(e.x, e.y);
    if (kind === 'fire') {
      const p = 0.35 + (u.o.int - ei) / 100 + (torch ? 0.25 : 0) - ('~=tWTG'.includes(k) ? 0.3 : 0);
      if (Math.random() < p) { const loss = Math.round(e.soldiers * (k === 'f' ? 0.3 : 0.16)); e.soldiers -= loss; e.morale -= 15; snd('sfx', 'fire'); flash(e, 'fire'); floatText(e, '🔥-' + fmt(loss), 'hurt'); say(`🔥 ${name(u)}의 화계! ${name(e)} 부대가 불길에 휩싸였다 (-${fmt(loss)})${k === 'f' ? ' — 숲이 크게 탄다!' : ''}`); checkRout(e); }
      else { say(`💨 ${name(u)}의 화계가 ${name(e)}에게 간파당했다.`); snd('sfx', 'page'); }
    } else {
      const p = 0.3 + (u.o.int - ei) / 90;
      if (Math.random() < p) { e.confused = 2; e.morale -= 10; flash(e, 'confuse'); say(`🌀 ${name(u)}의 교란! ${name(e)} 부대가 혼란에 빠져 움직이지 못한다.`); snd('sfx', 'horn'); }
      else say(`${name(e)}이(가) 교란에 넘어가지 않았다.`);
    }
    afterAction();
  }
  function pray(u) {
    u.acted = u.moved = true; snd('sfx', 'holy');
    const near = B.units.filter(x => !x.dead && x.side === u.side && dist(x, u) <= 2);
    near.forEach(x => { const h = Math.round(x.max * 0.08); x.soldiers = Math.min(x.max, x.soldiers + h); x.morale = Math.min(100, x.morale + 12); floatText(x, '+' + fmt(h), 'heal'); });
    let line = `🙏 ${name(u)}이(가) 기도하니 곁의 부대들이 힘을 얻는다.`;
    if (B.miracle && Math.random() < 0.3) { B.miracle = false; live(u.side === 'A' ? 'D' : 'A').forEach(e => { e.soldiers = Math.round(e.soldiers * 0.9); e.morale -= 20; flash(e, 'fire'); }); line += ' ⚡ 여호와께서 큰 우레를 발하사 적진이 어지러워졌다! (삼상 7:10)'; snd('sfx', 'thunder'); }
    say(line); afterAction();
  }

  // ---------- 일기토 ----------
  function duelTargets(u) { return u.o && u.type !== 'prophet' ? B.units.filter(e => !e.dead && e.side !== u.side && e.o && dist(u, e) === 1) : []; }
  function challenge(u, e, byAI) {
    const a = u.o, d = e.o, key = [a.id, d.id].sort().join();
    if (byAI) { askDuel(e, u); return; }
    B.duelsTried.add(key); u.acted = u.moved = true;
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
    const W = o => o.war + (P.o === o && B.it.has('sword_goliath') ? 15 : 0);
    const st = { hp: [100, 100], ki: [0, 0], round: 1, log: [] };
    const box = $('#tDuel'); B.busy = true; snd('sfx', 'horn');
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
      let line = `🗡 일기토! ${P.o.name} 대 ${E.o.name} — ${win.o.name}의 승리!${note ? ' ' + note : ''}`;
      if (!note) {
        if (lose.side === 'D' && Math.random() < 0.3) { B.captured.push(lose.o); lose.dead = true; line += ` ${lose.o.name}을(를) 사로잡았다!`; }
        else if (Math.random() < 0.1 && !lose.o.hero) { T().killOfficer(lose.o); lose.dead = true; line += ` ${lose.o.name}이(가) 쓰러졌다.`; }
      }
      say(line); snd('sfx', win.side === 'A' ? 'victory' : 'defeat');
      checkRout(lose); render(); then();
    };
    const bind = () => box.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => turn(b.dataset.c)));
    box.hidden = false; T().voiceOf(P.o, 'battle'); setTimeout(() => T().voiceOf(E.o, 'battle'), 900);
    drawD(aiStarted ? `${esc(E.o.name)}이(가) 먼저 칼을 뽑았다! 수를 고르세요.` : `${esc(P.o.name)}이(가) ${esc(E.o.name)}에게 일기토를 청했다! 수를 고르세요.`); bind();
  }

  // ---------- 플레이어 입력 ----------
  function tap(x, y) {
    if (B.busy || B.phase !== 'player' || B.ended) return;
    const u = at(x, y), s = B.sel;
    if (s && !s.acted) {
      const tg = targets(s).find(e => e.x === x && e.y === y);
      if (tg && (tg.gate || tg.side !== s.side)) { attack(s, tg); return; }
      if (B.pending) { const e = at(x, y); if (e && e.side === 'D' && B.pending.list.includes(e)) { const p = B.pending; B.pending = null; if (p.kind === 'duel') challenge(s, e); else scheme(s, e, p.kind); return; } }
      if (!s.moved && !u && reach(s).some(([rx, ry]) => rx === x && ry === y)) { s.x = x; s.y = y; s.moved = true; snd('sfx', 'page'); render(); if (!targets(s).length && !stratTargets(s).length && !duelTargets(s).length && s.type !== 'prophet') { s.acted = true; B.sel = null; render(); checkEndTurn(); } return; }
    }
    if (u && u.side === 'A' && !u.acted) { B.sel = u; B.pending = null; snd('sfx', 'click'); render(); return; }
    if (u) { info(u); return; }
    B.sel = null; B.pending = null; render();
  }
  function afterAction() { B.sel = null; B.pending = null; render(); if (checkWin()) return; if (B.phase === 'player') checkEndTurn(); }
  function checkEndTurn() { if (live('A').every(u => u.acted)) setTimeout(() => { if (!B.ended && B.phase === 'player') endPlayer(); }, 350); }
  function info(u) { hint(`${u.side === 'A' ? '아군' : '적군'} ${name(u)} · ${UT[u.type].n} · 병력 ${fmt(u.soldiers)}/${fmt(u.max)} · 사기 ${Math.max(0, Math.round(u.morale))}${u.o ? ` · 무${u.o.war} 지${u.o.int}` : ''} · ${TER[ter(u.x, u.y)].n}${u.confused ? ' · 혼란' : ''}`); }

  // ---------- 턴 ----------
  function endPlayer() {
    if (B.ended) return;
    // 본영 점령
    const hq = live('A').find(u => ter(u.x, u.y) === 'H'); if (hq) { say(`🚩 ${name(hq)}이(가) 본영을 차지했다!`); return finish(true); }
    B.phase = 'enemy'; B.sel = null; render(); hint('적군이 움직입니다…');
    B.queue = live('D').slice(); setTimeout(aiStep, 400);
  }
  function aiStep() {
    if (B.ended || B.busy) return;
    const u = B.queue.shift();
    if (!u) return newTurn();
    if (u.dead) return aiStep();
    if (u.confused) { u.confused--; u.acted = true; return setTimeout(aiStep, 120); }
    aiAct(u, 'A');
    if (checkWin()) return;
    if (!B.busy) setTimeout(aiStep, 260);
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
    let ts = targets(u).filter(e => !e.gate || foeSide === 'D');
    if (ts.length) return attack(u, pickTarget(ts));
    const hold = u.side === 'D' && B.kind === 'siege' && 'WTtHG'.includes(ter(u.x, u.y)) && !foes.some(f => dist(f, u) <= 3);
    if (!hold) moveToward(u, foes);
    ts = targets(u).filter(e => !e.gate || foeSide === 'D');
    if (ts.length) return attack(u, pickTarget(ts));
    if (u.o && u.side === 'A' && stratTargets(u).length && Math.random() < 0.5) { scheme(u, pickTarget(stratTargets(u)), 'fire'); return; }
    if (foeSide === 'D' && B.kind === 'siege' && B.gateHp > 0) { const g = gatePos(); if (dist(u, g) === 1) return attack(u, { gate: true, x: g.x, y: g.y }); }
    u.acted = true; render();
  }
  const pickTarget = ts => ts.slice().sort((a, b) => (a.gate ? 1e9 : a.soldiers) - (b.gate ? 1e9 : b.soldiers))[0];
  function moveToward(u, foes) {
    const rs = reach(u); if (!rs.length) return;
    const goal = B.kind === 'siege' && u.side === 'A' ? (B.gateHp > 0 && !B.it.has('ladder') ? gatePos() : { x: 9, y: 4 }) : null;
    const score = ([x, y]) => { const p = { x, y }; const d = goal && !foes.some(f => dist(f, u) <= 4) ? dist(p, goal) : Math.min(...foes.map(f => dist(p, f))); return d - TER[ter(x, y)].def * 2; };
    rs.sort((a, b) => score(a) - score(b)); const [x, y] = rs[0];
    if (x !== u.x || y !== u.y) { u.x = x; u.y = y; u.moved = true; render(); }
  }
  function newTurn() {
    if (checkWin()) return;
    B.turn++;
    if (B.turn > MAX_TURN) { say(`⏳ ${MAX_TURN}턴이 지나도록 성을 떨어뜨리지 못했다. 군량이 다해 물러난다.`); return finish(false); }
    B.units.forEach(u => { u.moved = u.acted = false; if (u.side === 'A' && u.confused) { u.confused--; if (u.confused >= 0) u.acted = u.moved = true; } });
    B.phase = 'player'; render(); hint(`제${B.turn}턴 — 내 부대를 움직이세요.`);
    if (B.auto) setTimeout(autoPlay, 300);
  }
  function autoPlay() {
    if (B.ended || B.phase !== 'player') return;
    const us = live('A').filter(u => !u.acted);
    const step = () => { if (B.ended || B.busy) return; const u = us.shift(); if (!u) return endPlayer(); aiAct(u, 'D'); u.acted = u.moved = true; if (checkWin()) return; setTimeout(step, 180); };
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
    const res = T().applyBattleResult(o.af, o.gens, o.soldiers, o.cid, o.train, B.it, A, win ? 0 : Math.max(D, 1), lines, win);
    B.captured.forEach(c => { if (c.alive && !res.captives.includes(c) && c.fac !== o.af) res.captives.push(c); });
    snd('sfx', win ? 'victory' : 'defeat');
    setTimeout(() => { $('#tactic').hidden = true; document.body.classList.remove('in-tactic'); T().setInBattle(false); o.done(res); }, 900);
  }
  function retreat() { if (B.busy || B.ended) return; say('🏃 군사를 물린다.'); finish(false); }

  // ---------- 화면 ----------
  let tile = 40;
  function layout() {
    const W = window.innerWidth, H = window.innerHeight;
    tile = Math.floor(Math.max(28, Math.min((W - 12) / COLS, (H - 250) / ROWS, 72)));
    const g = $('#tGrid'); g.style.width = tile * COLS + 'px'; g.style.height = tile * ROWS + 'px'; g.style.setProperty('--t', tile + 'px');
  }
  function render(full) {
    if (!B) return;
    layout();
    const g = $('#tGrid'), s = B.sel, rs = s && !s.moved && !s.acted ? reach(s) : [], ts = s && !s.acted ? targets(s) : [];
    const pend = B.pending ? B.pending.list : [];
    let h = '';
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const k = B.map[y][x], cls = { '.': 'g', f: 'f', h: 'h', '~': 'r', '=': 'fd', '#': 'c', W: 'w', T: 'tw', G: 'gt', t: 'tn', H: 'hq' }[k];
      const mv = rs.some(([a, b]) => a === x && b === y) ? ' mv' : '', tg = ts.some(e => e.x === x && e.y === y) || pend.some(e => e.x === x && e.y === y) ? ' tg' : '';
      h += `<div class="tt ${cls}${mv}${tg}" data-x="${x}" data-y="${y}" style="left:${x * tile}px;top:${y * tile}px">${k === 'G' && B.gateHp > 0 ? `<i class="gate-hp" style="width:${B.gateHp / B.gateMax * 100}%"></i>` : ''}</div>`;
    }
    B.units.forEach(u => {
      if (u.dead) return;
      h += `<div class="tu ${u.side === 'A' ? 'ally' : 'foe'}${u === s ? ' sel' : ''}${u.acted && u.side === 'A' ? ' done' : ''}${u.confused ? ' conf' : ''}" id="${u.id}" style="transform:translate(${u.x * tile}px,${u.y * tile}px)">
        <span class="tu-face">${u.o ? GM().portraitOf(u.o) : `<b>${UT[u.type].tag}</b>`}</span><em>${UT[u.type].tag}</em><small>${fmt(u.soldiers)}</small><i class="tu-hp" style="width:${Math.max(0, u.soldiers / u.max * 100)}%"></i></div>`;
    });
    g.innerHTML = h;
    const A = live('A').reduce((a, u) => a + u.soldiers, 0), D = live('D').reduce((a, u) => a + u.soldiers, 0);
    $('#tTop').innerHTML = `<b>${MAPS[B.kind].name}</b><span>${GM().CITY_INFO[B.opts.cid].name}</span><span class="t-turn">제${B.turn}/${MAX_TURN}턴</span><span class="t-a">아군 ${fmt(A)}</span><span class="t-d">적군 ${fmt(D)}</span>${B.kind === 'siege' ? `<span>성문 ${B.gateHp > 0 ? Math.round(B.gateHp / B.gateMax * 100) + '%' : '파괴'}</span>` : ''}`;
    const acts = [];
    if (s && !s.acted && B.phase === 'player') {
      if (stratTargets(s).length) { acts.push(`<button class="btn" data-act="fire">🔥 화계</button>`); acts.push(`<button class="btn" data-act="confuse">🌀 교란</button>`); }
      if (duelTargets(s).length) acts.push(`<button class="btn danger" data-act="duel">🗡 일기토</button>`);
      if (s.type === 'prophet') acts.push(`<button class="btn primary" data-act="pray">🙏 기도</button>`);
      acts.push(`<button class="btn" data-act="wait">대기</button>`);
    }
    $('#tActs').innerHTML = (s ? `<span class="t-sel"><b>${esc(name(s))}</b> ${UT[s.type].n} · ${fmt(s.soldiers)}명 · 사기 ${Math.max(0, Math.round(s.morale))}</span>` : '') + acts.join('') +
      `<span class="t-sp"></span><button class="btn" data-act="auto">${B.auto ? '자동 중…' : '자동 진행'}</button><button class="btn primary" data-act="end" ${B.phase !== 'player' ? 'disabled' : ''}>턴 종료</button><button class="btn" data-act="flee">퇴각</button>`;
  }
  function say(t, sfxName) { B.log.push(t); const l = $('#tLog'); if (l) { const p = document.createElement('p'); p.textContent = t; l.prepend(p); while (l.children.length > 4) l.lastChild.remove(); } if (sfxName) snd('sfx', sfxName); }
  function hint(t) { const e = $('#tHint'); if (e) e.textContent = t; }
  function floatText(u, t, cls) { const g = $('#tGrid'); if (!g) return; const e = document.createElement('div'); e.className = 'tfloat ' + cls; e.textContent = t; e.style.left = (u.x + 0.5) * tile + 'px'; e.style.top = u.y * tile + 'px'; g.appendChild(e); setTimeout(() => e.remove(), 1100); }
  function shake(u) { const e = document.getElementById(u.id); if (e) { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); } }
  function flash(u, k) { const e = document.getElementById(u.id); if (e) { e.classList.add(k); setTimeout(() => e.classList.remove(k), 700); } }

  function bindUI() {
    $('#tGrid').addEventListener('click', e => { const t = e.target.closest('.tt, .tu'); if (!t) return; if (t.classList.contains('tu')) { const u = B.units.find(x => x.id === t.id); if (u) tap(u.x, u.y); } else tap(+t.dataset.x, +t.dataset.y); });
    $('#tActs').addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b || !B || B.busy) return; const s = B.sel, a = b.dataset.act;
      if (a === 'end') { live('A').forEach(u => { u.acted = true; }); B.sel = null; endPlayer(); }
      else if (a === 'flee') retreat();
      else if (a === 'auto') { B.auto = !B.auto; render(); if (B.auto && B.phase === 'player') autoPlay(); }
      else if (!s) return;
      else if (a === 'wait') { s.acted = s.moved = true; B.sel = null; render(); checkEndTurn(); }
      else if (a === 'pray') pray(s);
      else if (a === 'fire' || a === 'confuse') { B.pending = { kind: a, list: stratTargets(s) }; hint(a === 'fire' ? '불을 놓을 적 부대를 누르세요 (2칸 안, 숲이면 크게 탑니다).' : '혼란시킬 적 부대를 누르세요 (2칸 안).'); render(); }
      else if (a === 'duel') { const ds = duelTargets(s); if (ds.length === 1) challenge(s, ds[0]); else { B.pending = { kind: 'duel', list: ds }; hint('일기토를 청할 적장을 누르세요.'); render(); } }
    });
    window.addEventListener('resize', () => { if (B && !$('#tactic').hidden) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindUI); else bindUI();
  window.TACTICS = { start, get state() { return B; } };
})();
