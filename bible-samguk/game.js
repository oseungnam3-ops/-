// 성경 삼국지 — 게임 엔진과 화면
(() => {
  'use strict';
  const SEASONS = ['봄', '여름', '가을', '겨울'];
  const SAVE_KEY = 'bible-samguk-save-v1';
  const $ = s => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const fmt = n => Math.round(n).toLocaleString('ko-KR');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CITY_INFO = {};
  CITY_TABLE.forEach(([id, name, x, y, pop, agri, comm, def, desc]) => { CITY_INFO[id] = { id, name, x, y, pop, agri, comm, def, desc }; });
  const ADJ = {};
  ROADS.forEach(([a, b]) => { (ADJ[a] = ADJ[a] || []).push(b); (ADJ[b] = ADJ[b] || []).push(a); });
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let S = null; // 게임 상태 (JSON 저장 가능)
  let sel = null; // 선택한 도시
  const scn = () => SCENARIOS.find(s => s.id === S.scn);

  // ---------- 상태 조회 ----------
  const city = id => S.cities[id];
  const fac = id => S.facs[id];
  const offById = id => S.offs.find(o => o.id === id);
  const offByName = name => S.offs.find(o => o.name === name);
  const citiesOf = f => Object.values(S.cities).filter(c => c.owner === f);
  const offsIn = (cid, f) => S.offs.filter(o => o.alive && o.city === cid && o.fac === f);
  const freeIn = cid => S.offs.filter(o => o.alive && o.city === cid && o.fac === null);
  const exists = f => !!S.facs[f] && S.facs[f].alive;
  const relKey = (a, b) => [a, b].sort().join('|');
  const getRel = (a, b) => S.rel[relKey(a, b)] ?? 30;
  const setRel = (a, b, v) => { S.rel[relKey(a, b)] = clamp(v, 0, 100); };
  const allied = (a, b) => a && b && getRel(a, b) >= 80;
  const avgFaith = f => { const cs = citiesOf(f); return cs.length ? cs.reduce((s, c) => s + c.faith, 0) / cs.length : 50; };
  const buffVal = (f, k) => { const b = S.buffs[f] && S.buffs[f][k]; return b && b.turns > 0 ? b.val : 0; };
  const peaceBlocks = (a, b) => S.flags.peaceUntil && S.turn < S.flags.peaceUntil && [a, b].sort().join() === 'israel,judah';
  const facName = f => f ? fac(f).name : '재야';
  const yearLabel = () => `BC ${S.year}년 ${SEASONS[S.season]}`;

  function log(msg, kind = '') {
    S.log.unshift({ t: `${S.year} ${SEASONS[S.season]}`, msg, kind });
    S.log.length = Math.min(S.log.length, 120);
  }

  function fixCity(c) {
    ['faith', 'loy', 'train', 'def', 'agri', 'comm'].forEach(k => { c[k] = clamp(Math.round(c[k]), 0, 100); });
    c.soldiers = Math.max(0, Math.round(c.soldiers));
    c.pop = Math.max(1000, Math.round(c.pop));
  }

  // ---------- 새 게임 ----------
  function newGame(scnId, player) {
    const sc = SCENARIOS.find(s => s.id === scnId);
    S = { scn: scnId, player, turn: 1, year: sc.year, season: 0, cities: {}, facs: {}, offs: [], rel: {}, buffs: {}, flags: {}, done: {}, log: [], over: false };
    Object.values(CITY_INFO).forEach(ci => {
      S.cities[ci.id] = { id: ci.id, owner: null, soldiers: 300, train: 40, pop: ci.pop, agri: ci.agri, comm: ci.comm, def: ci.def, faith: 40, loy: 55 };
    });
    sc.factions.forEach(f => {
      S.facs[f.id] = { id: f.id, name: f.name, color: f.color, capital: f.capital, gold: f.gold, food: f.food, aggr: f.aggr, ruler: null, alive: true };
      Object.entries(f.cities).forEach(([cid, sold]) => { const c = S.cities[cid]; c.owner = f.id; c.soldiers = sold; c.train = 50; });
    });
    Object.entries(sc.neutral || {}).forEach(([cid, sold]) => { S.cities[cid].soldiers = sold; });
    sc.officers.forEach((row, i) => addOfficer(row, i));
    sc.factions.forEach(f => { const r = offByName(f.ruler); if (r) S.facs[f.id].ruler = r.id; });
    // 신앙 기본치: 세력 군주의 신앙을 반영
    Object.values(S.cities).forEach(c => { if (c.owner) { const r = offById(fac(c.owner).ruler); c.faith = r ? Math.round(30 + r.fai * 0.35) : 40; } fixCity(c); });
    Object.keys(S.facs).forEach(a => Object.keys(S.facs).forEach(b => { if (a < b) setRel(a, b, 30); }));
    (sc.rel || []).forEach(([a, b, v]) => setRel(a, b, v));
    log(`${sc.title} — ${fac(player).name}의 역사가 시작된다.`, 'gold');
    sel = fac(player).capital;
  }

  function addOfficer(row, i) {
    const [name, war, int, pol, cha, fai, f, cid, desc, ref] = row;
    const o = { id: 'o' + (i ?? S.offs.length) + '_' + name, name, war, int, pol, cha, fai, fac: f, city: cid, desc, ref, alive: true, done: false };
    S.offs.push(o);
    return o;
  }

  // ---------- 이벤트 API ----------
  const G = {
    get turn() { return S.turn; },
    get flags() { return S.flags; },
    get done() { return S.done; },
    get player() { return S.player; },
    isPlayer: f => S.player === f,
    exists, city, fac,
    ownerOf: cid => S.cities[cid].owner,
    o: offByName,
    alive: n => { const o = offByName(n); return !!o && o.alive; },
    facOf: n => { const o = offByName(n); return o && o.alive ? o.fac : undefined; },
    cityCount: f => citiesOf(f).length,
    eachCity: (f, fn) => citiesOf(f).forEach(c => { fn(c); fixCity(c); }),
    buff: (f, k, turns, val) => { S.buffs[f] = S.buffs[f] || {}; S.buffs[f][k] = { turns, val }; },
    rel: (a, b, d) => setRel(a, b, getRel(a, b) + d),
    kill: n => { const o = offByName(n); if (o && o.alive) killOfficer(o); },
    join: (n, f, cid) => { const o = offByName(n); if (!o || !o.alive || !exists(f)) return; const wasRuler = o.fac && fac(o.fac).ruler === o.id; const from = o.fac; o.fac = f; o.city = cid || fac(f).capital; if (wasRuler) succession(from); },
    transferAll: (from, to) => {
      citiesOf(from).forEach(c => { c.owner = to; c.loy = clamp(c.loy + 5, 0, 100); });
      S.offs.filter(o => o.alive && o.fac === from).forEach(o => { o.fac = to; });
      fac(from).alive = false;
    },
    rebel: (id, name, cid, row) => {
      const c = city(cid); const prev = c.owner;
      offsIn(cid, prev).forEach(o => { o.city = fac(prev).capital; });
      const o = addOfficer(row);
      S.facs[id] = { id, name, color: '#e8e1cf', capital: cid, gold: 800, food: 6000, aggr: 0.6, ruler: o.id, alive: true };
      o.fac = id; o.city = cid; c.owner = id; c.soldiers = Math.max(c.soldiers, 5000);
      Object.keys(S.facs).forEach(b => { if (b !== id) setRel(id, b, 20); });
      setRel(id, prev, 0);
    },
    raid: (f, cid, max) => {
      const src = city(fac(f).capital); const n = Math.min(max, src.soldiers);
      if (n < 500) return '적의 군세가 약해 공격이 흐지부지되었다.';
      src.soldiers -= n;
      const offs = S.offs.filter(o => o.alive && o.fac === f).sort((a, b) => b.war - a.war).slice(0, 2);
      const r = battle(f, offs, n, cid, 60);
      if (!r.win) src.soldiers += r.attLeft;
      return r.summary;
    },
  };

  // ---------- 장수 ----------
  function killOfficer(o) {
    o.alive = false;
    log(`${o.name}이(가) 세상을 떠났다.`, 'bad');
    if (o.fac && fac(o.fac).ruler === o.id) succession(o.fac);
  }
  function succession(f) {
    const F = fac(f); if (!F.alive) return;
    const cands = S.offs.filter(o => o.alive && o.fac === f).sort((a, b) => (b.cha + b.pol) - (a.cha + a.pol));
    if (cands.length) { F.ruler = cands[0].id; log(`${F.name}의 새 군주로 ${cands[0].name}이(가) 섰다.`, 'gold'); }
    else F.ruler = null;
  }

  // ---------- 내정 명령 ----------
  const CMDS = {
    agri: { label: '개간', stat: 'pol', cost: { gold: 100 }, hint: '농업 ↑ (가을 수확)' },
    comm: { label: '상업', stat: 'pol', cost: { gold: 100 }, hint: '상업 ↑ (매 계절 금)' },
    wall: { label: '성벽', stat: 'pol', cost: { gold: 100 }, hint: '성벽 ↑ (수비력)' },
    worship: { label: '제사', stat: 'fai', cost: { gold: 60 }, hint: '신앙 ↑ (사기·민심)' },
    relief: { label: '구휼', stat: 'cha', cost: { food: 500 }, hint: '민심 ↑' },
    recruit: { label: '징병', stat: 'cha', cost: { gold: 0 }, hint: '병력 ↑ 민심 ↓' },
    train: { label: '훈련', stat: 'war', cost: {}, hint: '훈련도 ↑' },
    search: { label: '인재', stat: 'int', cost: {}, hint: '재야 인재 찾기' },
  };
  const STAT_NAME = { war: '무력', int: '지력', pol: '정치', cha: '매력', fai: '신앙' };

  function doCmd(f, o, cid, key) {
    const c = city(cid), F = fac(f), C = CMDS[key];
    if (C.cost.gold && F.gold < C.cost.gold) return { ok: false, msg: '금이 부족하다.' };
    if (C.cost.food && F.food < C.cost.food) return { ok: false, msg: '식량이 부족하다.' };
    if (C.cost.gold) F.gold -= C.cost.gold;
    if (C.cost.food) F.food -= C.cost.food;
    const s = o[C.stat]; let msg = '';
    const gain = (base) => Math.max(1, Math.round(base * s / 100 + rnd(0, 3)));
    switch (key) {
      case 'agri': { const g = gain(8); c.agri += g; msg = `농업 +${g}`; break; }
      case 'comm': { const g = gain(8); c.comm += g; msg = `상업 +${g}`; break; }
      case 'wall': { const g = gain(7); c.def += g; msg = `성벽 +${g}`; break; }
      case 'worship': { const g = gain(9); c.faith += g; c.loy += 2; msg = `신앙 +${g}, 민심 +2`; break; }
      case 'relief': { const g = gain(10); c.loy += g; msg = `민심 +${g}`; break; }
      case 'train': { const g = gain(10); c.train += g; msg = `훈련 +${g}`; break; }
      case 'recruit': {
        const n = Math.round(Math.min((400 + s * 12 + c.pop / 60) * (0.6 + c.loy / 250), (c.pop - 1000) * 0.2) / 50) * 50;
        if (n < 100) return { ok: false, msg: '이 성에는 더 모을 장정이 없다.' };
        const cost = Math.round(n / 8);
        if (F.gold < cost) { return { ok: false, msg: `징병에는 금 ${cost}이 필요하다.` }; }
        F.gold -= cost;
        c.train = Math.round((c.train * c.soldiers + 20 * n) / (c.soldiers + n));
        c.soldiers += n; c.pop -= n; c.loy -= 4;
        msg = `병사 +${fmt(n)} (금 -${cost}, 민심 -4)`; break;
      }
      case 'search': {
        const free = freeIn(cid);
        if (free.length && Math.random() < 0.35 + s / 150) {
          const t = free[0]; t.fac = f; t.city = cid;
          msg = `${t.name}을(를) 찾아 등용했다! — ${t.desc}`;
        } else if (Math.random() < 0.3) { const g = Math.round(rnd(50, 150)); F.gold += g; msg = `인재는 없었지만 금 ${g}을 얻었다.`; }
        else msg = '쓸 만한 인재를 찾지 못했다.';
        break;
      }
    }
    fixCity(c); o.done = true;
    return { ok: true, msg };
  }

  // ---------- 전투 ----------
  function sidePower(f, offs, train, isDef, c) {
    const lead = offs.reduce((m, o) => Math.max(m, o.war), 30);
    const strat = offs.reduce((m, o) => Math.max(m, o.int), 30);
    let p = (1 + (lead - 50) / 100 + (strat - 50) / 250) * (0.6 + train / 250) * (0.85 + avgFaith(f) / 330);
    p *= 1 + buffVal(f, 'atk');
    if (isDef) p *= 1 + c.def / 180;
    return p;
  }

  // 공격 실행. 반환: {win, attLeft, lines[], summary, captives[]}
  function battle(af, aoffs, soldiers, cid, train) {
    const c = city(cid), df = c.owner;
    const doffs = df ? offsIn(cid, df) : [];
    const lines = [];
    const aName = facName(af), dName = df ? facName(df) : '성읍 백성';
    let A = soldiers, D = c.soldiers;
    let aP = sidePower(af, aoffs, train, false, c);
    let dP = df ? sidePower(df, doffs, c.train, true, c) : 0.8 * (1 + c.def / 180);
    const aL = aoffs.slice().sort((a, b) => b.war - a.war)[0];
    const dL = doffs.slice().sort((a, b) => b.war - a.war)[0];
    lines.push(`⚔ ${aName}군 ${fmt(A)}명이 ${CITY_INFO[cid].name}(${dName} ${fmt(D)}명)을 공격한다.`);
    if (aL) lines.push(`공격 대장: ${aoffs.map(o => o.name).join(', ')}`);
    if (dL) lines.push(`수비 대장: ${doffs.map(o => o.name).join(', ')}`);
    const wounded = new Set();
    for (let r = 1; r <= 8 && A > 0 && D > 0; r++) {
      // 일기토
      if (aL && dL && !wounded.has(aL.id) && !wounded.has(dL.id) && Math.random() < 0.16) {
        const pa = aL.war ** 3 / (aL.war ** 3 + dL.war ** 3);
        const w = Math.random() < pa ? aL : dL, l = w === aL ? dL : aL;
        lines.push(`🗡 일기토! ${aL.name} 대 ${dL.name} — ${w.name}의 승리!`);
        wounded.add(l.id);
        if (l === aL) { A *= 0.85; aP *= 0.9; } else { D *= 0.85; dP *= 0.9; }
        if (Math.random() < 0.12) { lines.push(`${l.name}이(가) 쓰러졌다.`); killOfficer(l); }
      }
      // 계략
      const aI = aoffs.reduce((m, o) => Math.max(m, o.int), 20), dI = doffs.reduce((m, o) => Math.max(m, o.int), 20);
      if (Math.random() < 0.14) {
        if (aI * Math.random() > dI * Math.random()) { D *= 0.88; lines.push(`🔥 ${aName}군의 계략이 적중했다! (지력 ${aI})`); }
        else { A *= 0.9; lines.push(`🛡 ${dName}이(가) 계략을 간파하고 역습했다.`); }
      }
      const dmgD = Math.min(D, A * 0.11 * aP / Math.max(0.3, dP) * rnd(0.8, 1.2));
      const dmgA = Math.min(A, D * 0.11 * dP / Math.max(0.3, aP) * rnd(0.8, 1.2) + (df ? 0 : 0));
      D -= dmgD; A -= dmgA;
      lines.push(`${r}합 — 공격 ${fmt(A)} / 수비 ${fmt(D)}`);
      if (A < soldiers * 0.25) { lines.push(`${aName}군의 사기가 꺾여 퇴각한다.`); break; }
    }
    A = Math.max(0, Math.round(A)); D = Math.max(0, Math.round(D));
    const win = D <= 0 || (A > D * 2.5 && A > 300);
    const res = { win, attLeft: A, lines, captives: [], summary: '' };
    fac(af).food = Math.max(0, fac(af).food - Math.round(soldiers * 0.3));
    if (win) {
      lines.push(`🏳 ${CITY_INFO[cid].name} 함락! ${aName}의 깃발이 오른다.`);
      c.owner = af; c.soldiers = A; c.train = train; c.loy = clamp(c.loy - 15, 0, 100); c.def = Math.round(c.def * 0.85);
      aoffs.forEach(o => { if (o.alive) o.city = cid; });
      if (df) {
        const escape = (ADJ[cid] || []).filter(n => city(n).owner === df);
        doffs.forEach(o => {
          if (!o.alive) return;
          if (escape.length && Math.random() < 0.5) { o.city = pick(escape); lines.push(`${o.name}은(는) ${CITY_INFO[o.city].name}(으)로 달아났다.`); }
          else { res.captives.push(o); lines.push(`${o.name}을(를) 사로잡았다!`); }
        });
        if (fac(df).capital === cid) {
          const rest = citiesOf(df);
          if (rest.length) fac(df).capital = rest.sort((a, b) => b.soldiers - a.soldiers)[0].id;
        }
        if (!citiesOf(df).length) {
          fac(df).alive = false;
          lines.push(`👑 ${facName(df)}이(가) 멸망했다.`);
          log(`${facName(df)}이(가) 멸망했다.`, 'bad');
          S.offs.filter(o => o.alive && o.fac === df && !res.captives.includes(o)).forEach(o => { o.fac = null; });
        }
      }
      if (S.scn === 'conquest' && cid === 'jericho' && af === 'israel' && S.flags.rahab && G.alive('라합')) {
        const r = offByName('라합'); r.fac = 'israel'; r.city = cid; lines.push('붉은 줄이 매인 집의 라합과 그 가족이 구원받아 이스라엘에 합류했다.');
      }
      res.summary = `${aName}이(가) ${CITY_INFO[cid].name}을(를) 차지했다.`;
    } else {
      c.soldiers = D;
      lines.push(`${CITY_INFO[cid].name}이(가) 버텨냈다. 남은 공격군 ${fmt(A)}명이 돌아간다.`);
      res.summary = `${aName}의 ${CITY_INFO[cid].name} 공격이 실패했다.`;
    }
    if (df) setRel(af, df, getRel(af, df) - 20);
    log(res.summary, win ? 'gold' : '');
    return res;
  }

  function resolveCaptivesAI(capf, captives) {
    captives.forEach(o => {
      if (!o.alive) return;
      const wasRuler = o.fac && fac(o.fac).ruler === o.id; const from = o.fac;
      if (Math.random() < 0.4 && !wasRuler) { o.fac = capf; log(`${o.name}이(가) ${facName(capf)}에 투항했다.`); }
      else { releaseTo(o); }
      if (wasRuler && o.fac !== from) succession(from);
    });
  }
  function releaseTo(o) {
    if (o.fac && exists(o.fac) && citiesOf(o.fac).length) o.city = fac(o.fac).capital;
    else o.fac = null;
  }

  // ---------- AI ----------
  function aiTurn(f) {
    const F = fac(f); if (!F.alive) return;
    const my = citiesOf(f);
    my.forEach(c => {
      const enemies = (ADJ[c.id] || []).map(city).filter(n => n.owner !== f && !allied(f, n.owner));
      const threat = enemies.reduce((m, n) => Math.max(m, n.soldiers), 0);
      offsIn(c.id, f).forEach(o => {
        if (o.done) return;
        let key;
        if (c.soldiers < threat * 0.9 && F.gold > 200) key = 'recruit';
        else if (c.train < 60) key = 'train';
        else if (c.loy < 40 && F.food > 2000) key = 'relief';
        else if (freeIn(c.id).length) key = 'search';
        else key = pick(['agri', 'comm', 'wall', 'worship', 'recruit', 'train']);
        doCmd(f, o, c.id, key);
      });
      // 공격
      if (Math.random() < F.aggr && c.soldiers > 2500) {
        const myP = sidePower(f, offsIn(c.id, f), c.train, false, c);
        const targets = enemies.filter(n => !peaceBlocks(f, n.owner) && (!n.owner || getRel(f, n.owner) < 60))
          .map(n => ({ n, score: c.soldiers * 0.7 * myP / Math.max(1, n.soldiers * (n.owner ? sidePower(n.owner, offsIn(n.id, n.owner), n.train, true, n) : 1)) }))
          .filter(t => t.score > 1.4).sort((a, b) => b.score - a.score);
        if (targets.length) {
          const t = targets[0].n;
          const force = Math.round(c.soldiers * 0.7);
          const offs = offsIn(c.id, f).sort((a, b) => b.war - a.war).slice(0, 2);
          if (offs.length && F.food > force * 0.3) {
            c.soldiers -= force;
            const defOwner = t.owner;
            const r = battle(f, offs, force, t.id, c.train);
            if (!r.win) c.soldiers += r.attLeft;
            if (r.captives.length) resolveCaptivesAI(f, r.captives);
            S.pendingNews.push({ title: `${facName(f)}의 진격`, lines: r.lines, involves: [f, defOwner] });
          }
        }
      }
    });
    // 후방 병력을 전선으로
    citiesOf(f).forEach(c => {
      const front = (ADJ[c.id] || []).some(n => city(n).owner !== f);
      if (!front && c.soldiers > 3000) {
        const to = (ADJ[c.id] || []).map(city).filter(n => n.owner === f && (ADJ[n.id] || []).some(m => city(m).owner !== f));
        if (to.length) { const d = pick(to); const n = Math.round(c.soldiers * 0.5); c.soldiers -= n; d.soldiers += n; }
      }
    });
  }

  // ---------- 계절 정산 ----------
  function seasonUpkeep() {
    Object.values(S.facs).forEach(F => {
      if (!F.alive) return;
      const cs = citiesOf(F.id);
      let gold = 0, food = 0, sold = 0;
      cs.forEach(c => {
        gold += (c.comm * 2 + c.pop / 500) * (0.5 + c.loy / 200);
        if (S.season === 2) food += c.agri * c.pop / 250 * (0.6 + c.loy / 250);
        sold += c.soldiers;
        c.pop *= 1 + (c.loy - 40) / 4000;
        c.faith -= 1;
        c.loy += (c.faith - 50) / 20;
        if (c.loy < 25 && Math.random() < 0.3) { c.soldiers *= 0.9; if (F.id === S.player) log(`${CITY_INFO[c.id].name}에서 민란이 일어나 병사가 흩어졌다.`, 'bad'); }
        fixCity(c);
      });
      if (F.id === 'israel' && S.scn === 'conquest' && S.turn <= 12) food += 1500; // 만나
      F.gold = Math.round(F.gold + gold);
      F.food = Math.round(F.food + food - sold * 0.12);
      if (F.food < 0) {
        cs.forEach(c => { c.soldiers *= 0.8; c.loy -= 8; fixCity(c); });
        F.food = 0;
        if (F.id === S.player) log('식량이 바닥나 병사들이 굶주려 흩어졌다!', 'bad');
      }
    });
    Object.values(S.buffs).forEach(b => Object.values(b).forEach(x => { x.turns--; }));
  }

  // ---------- 턴 진행 ----------
  function endTurn() {
    if (S.over) return;
    S.pendingNews = [];
    Object.keys(S.facs).filter(f => f !== S.player).sort(() => Math.random() - 0.5).forEach(aiTurn);
    seasonUpkeep();
    S.turn++; S.season = (S.season + 1) % 4; if (S.season === 0) S.year--;
    S.offs.forEach(o => { o.done = false; });
    if (S.season === 2) log('가을 추수를 거두었다.', 'gold');
    const news = S.pendingNews.filter(n => n.involves.includes(S.player) || n.lines.some(l => l.includes('멸망')));
    delete S.pendingNews;
    render();
    const queue = news.map(n => () => showNews(n.title, n.lines));
    queue.push(() => runEvents());
    runQueue(queue);
  }

  function runQueue(q) { const next = q.shift(); if (next) next(() => runQueue(q)); else { checkEnd(); save(true); } }

  function showNews(title, lines) {
    return done => openModal(`<h2>${esc(title)}</h2><div class="blog">${lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>`, [{ label: '확인', primary: true, fn: done }]);
  }

  function runEvents(done) {
    const evs = (EVENTS[S.scn] || []).filter(e => !S.done[e.id] && safeCond(e));
    const step = () => {
      const e = evs.shift();
      if (!e) { render(); return done && done(); }
      if (!safeCond(e)) return step();
      showEvent(e, step);
    };
    step();
  }
  function safeCond(e) { try { return e.cond(G); } catch (err) { return false; } }

  function showEvent(e, next) {
    const mine = S.player === e.who, alt = e.altWho && S.player === e.altWho;
    const choices = mine ? e.choices : alt ? e.altChoices : null;
    const finish = (ch) => {
      const out = ch.run(G);
      if (!e.repeat || S.flags.arkHome) S.done[e.id] = true;
      if (e.repeat && !S.flags.arkHome) S.done[e.id] = false;
      Object.values(S.cities).forEach(fixCity);
      log(`[${e.title}] ${out}`, 'gold');
      openModal(`<p class="eyebrow">${esc(e.ref)}</p><h2>${esc(e.title)}</h2><p class="result">${esc(out)}</p>`, [{ label: '계속', primary: true, fn: () => { render(); next(); } }]);
    };
    const head = `<p class="eyebrow">성경 사건 · ${esc(e.ref)}</p><h2>${esc(e.title)}</h2><p class="scripture">${esc(e.text)}</p>`;
    if (choices) {
      const btns = choices.filter(c => !c.ok || c.ok(G));
      openModal(head + (alt ? `<p class="mute">${esc(e.altText)}</p>` : '') + '<p class="mute">어떻게 하시겠습니까?</p>', btns.map((c, i) => ({ label: c.label, primary: i === 0, fn: () => finish(c) })));
    } else {
      const c = (e.choices.filter(x => !x.ok || x.ok(G))[e.auto]) || e.choices[0];
      openModal(head + `<p class="mute">— ${esc(facName(e.who))}의 선택: ${esc(c.label)}</p>`, [{ label: '결과 보기', primary: true, fn: () => finish(c) }]);
    }
  }

  function checkEnd() {
    if (S.over) return;
    const sc = scn(), P = S.player;
    if (!exists(P) || !citiesOf(P).length) {
      S.over = true;
      openModal(`<h2>나라가 무너졌다</h2><p>${esc(fac(P).name)}의 모든 성을 잃었다. "여호와께서 집을 세우지 아니하시면 세우는 자의 수고가 헛되며…" (시 127:1)</p>`, [{ label: '처음으로', primary: true, fn: showTitle }]);
      return;
    }
    const goal = sc.goals && sc.goals[P];
    const won = goal ? goal.every(c => city(c).owner === P) : citiesOf(P).length >= 18;
    if (won) {
      S.over = true;
      openModal(`<p class="eyebrow">승리 · BC ${S.year}년</p><h2>${esc(fac(P).name)}의 천하</h2><p>${esc((sc.goalText && sc.goalText[P]) || '가나안의 열여덟 성을 차지했다.')}</p><p class="mute">${S.turn}턴 만에 목표를 이루었다. 계속 플레이할 수 있다.</p>`,
        [{ label: '계속 다스린다', primary: true, fn: () => { S.over = false; S.flags.won = true; render(); } }, { label: '처음으로', fn: showTitle }]);
    }
  }

  // ---------- 저장 ----------
  function save(quiet) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); if (!quiet) toast('저장했습니다.'); } catch (e) { if (!quiet) toast('이 브라우저에서는 저장할 수 없습니다.'); } }
  function loadSave() { try { const t = localStorage.getItem(SAVE_KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; } }

  // ---------- 화면: 지도 ----------
  const SVGNS = 'http://www.w3.org/2000/svg';
  function drawMap() {
    const svg = $('#map');
    const P = S.player;
    const targetsFor = sel && city(sel).owner === P ? (ADJ[sel] || []) : [];
    let h = `
      <defs>
        <radialGradient id="landG" cx="55%" cy="45%" r="75%"><stop offset="0" stop-color="var(--land-hi)"/><stop offset="1" stop-color="var(--land)"/></radialGradient>
        <pattern id="waves" width="18" height="10" patternUnits="userSpaceOnUse"><path d="M0 5 Q4.5 1 9 5 T18 5" fill="none" stroke="var(--sea-line)" stroke-width="0.8"/></pattern>
      </defs>
      <rect x="-500" y="-200" width="1620" height="1200" fill="url(#landG)"/>
      <polygon points="-500,-200 272,-200 268,0 262,100 237,190 212,212 200,270 150,407 125,470 80,545 0,650 -500,760" fill="var(--sea)"/>
      <polygon points="-500,-200 272,-200 268,0 262,100 237,190 212,212 200,270 150,407 125,470 80,545 0,650 -500,760" fill="url(#waves)"/>
      <path d="M378 110 L372 150 L368 192" fill="none" stroke="var(--river)" stroke-width="2.4"/>
      <ellipse cx="367" cy="212" rx="11" ry="20" fill="var(--sea)" stroke="var(--river)" stroke-width="1"/>
      <path d="M367 232 Q360 290 364 330 T352 400 Q346 440 350 478" fill="none" stroke="var(--river)" stroke-width="2.4"/>
      <path d="M345 478 Q330 520 336 580 Q340 640 350 660 Q362 640 364 580 Q366 520 356 478 Z" fill="var(--sea)" stroke="var(--river)" stroke-width="1"/>
      <text class="geo" x="60" y="300">대 해</text>
      <text class="geo sm" x="376" y="222">갈릴리 바다</text>
      <text class="geo sm" x="360" y="520" transform="rotate(80 360 520)">염 해</text>
      <text class="geo sm" x="370" y="330" transform="rotate(84 370 330)">요단강</text>
      <text class="geo sm" x="150" y="740">네 게 브</text>
      <text class="geo sm" x="520" y="300">길 르 앗</text>`;
    ROADS.forEach(([a, b]) => {
      const A = CITY_INFO[a], B = CITY_INFO[b];
      const hot = (a === sel && targetsFor.includes(b)) || (b === sel && targetsFor.includes(a));
      h += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="road${hot ? ' hot' : ''}"/>`;
    });
    Object.values(S.cities).forEach(c => {
      const ci = CITY_INFO[c.id];
      const color = c.owner ? fac(c.owner).color : 'var(--neutral)';
      const isCap = c.owner && fac(c.owner).capital === c.id;
      const r = 9 + Math.min(6, c.soldiers / 2000);
      h += `<g class="city${sel === c.id ? ' sel' : ''}${c.owner === P ? ' mine' : ''}" data-id="${c.id}" tabindex="0" role="button" aria-label="${ci.name}">`;
      if (sel === c.id) h += `<circle cx="${ci.x}" cy="${ci.y}" r="${r + 7}" class="halo"/>`;
      if (isCap) h += `<circle cx="${ci.x}" cy="${ci.y}" r="${r + 3.5}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
      h += `<circle cx="${ci.x}" cy="${ci.y}" r="${r}" fill="${color}" class="dot"/>`;
      h += `<text x="${ci.x}" y="${ci.y + r + 13}" class="cname">${ci.name}</text>`;
      h += `<text x="${ci.x}" y="${ci.y + 3.5}" class="csold">${c.soldiers >= 1000 ? (c.soldiers / 1000).toFixed(1) : '·'}</text>`;
      h += `</g>`;
    });
    svg.innerHTML = h;
  }

  // ---------- 화면: 상단 바 ----------
  function drawBar() {
    const F = fac(S.player);
    const cs = citiesOf(S.player);
    const sold = cs.reduce((s, c) => s + c.soldiers, 0);
    const ruler = offById(F.ruler);
    $('#barInfo').innerHTML = `
      <span class="chip fac" style="--fc:${F.color}"><i></i>${esc(F.name)}${ruler ? ' · ' + esc(ruler.name) : ''}</span>
      <span class="chip">${yearLabel()} <small>${S.turn}턴</small></span>
      <span class="stat"><b>금</b>${fmt(F.gold)}</span>
      <span class="stat"><b>식량</b>${fmt(F.food)}</span>
      <span class="stat"><b>병력</b>${fmt(sold)}</span>
      <span class="stat"><b>성</b>${cs.length}</span>
      <span class="stat"><b>신앙</b>${Math.round(avgFaith(S.player))}</span>`;
  }

  function meter(label, v, cls = '') { return `<div class="meter ${cls}"><span>${label}</span><div class="track"><div style="width:${clamp(v, 0, 100)}%"></div></div><em>${Math.round(v)}</em></div>`; }

  // ---------- 화면: 도시 패널 ----------
  function drawSide() {
    const P = S.player;
    const el = $('#cityPanel');
    if (!sel) { el.innerHTML = '<p class="mute">지도에서 성을 선택하세요.</p>'; return; }
    const c = city(sel), ci = CITY_INFO[sel];
    const owner = c.owner;
    const mine = owner === P;
    const offs = owner ? offsIn(sel, owner) : [];
    const free = freeIn(sel);
    let h = `<div class="city-head">
      <div><h2>${ci.name}</h2><p class="mute">${esc(ci.desc)}</p></div>
      <span class="chip fac" style="--fc:${owner ? fac(owner).color : 'var(--neutral)'}"><i></i>${owner ? esc(fac(owner).name) : '주인 없음'}${owner && fac(owner).capital === sel ? ' · 도읍' : ''}</span>
    </div>
    <div class="nums">
      <div><span>병력</span><b>${fmt(c.soldiers)}</b></div>
      <div><span>인구</span><b>${fmt(c.pop)}</b></div>
      <div><span>관계</span><b>${owner && !mine ? getRel(P, owner) + (allied(P, owner) ? ' 동맹' : '') : '—'}</b></div>
    </div>
    <div class="meters">
      ${meter('농업', c.agri)}${meter('상업', c.comm)}${meter('성벽', c.def)}
      ${meter('훈련', c.train)}${meter('민심', c.loy, c.loy < 30 ? 'warn' : '')}${meter('신앙', c.faith, 'faith')}
    </div>`;
    h += `<h3>장수 <small>${offs.length}명</small></h3><ul class="offs">`;
    if (!offs.length) h += '<li class="mute">머무는 장수가 없다.</li>';
    offs.forEach(o => {
      const isRuler = fac(o.fac).ruler === o.id;
      h += `<li class="${o.done ? 'done' : ''}"><button class="oname" data-bio="${o.id}">${isRuler ? '<span class="crown">王</span>' : ''}${esc(o.name)}</button>
        <span class="st">무${o.war} 지${o.int} 정${o.pol} 매${o.cha} 신${o.fai}</span>${mine ? `<span class="tag">${o.done ? '완료' : '대기'}</span>` : ''}</li>`;
    });
    h += '</ul>';
    if (mine && free.length) h += `<p class="hint">이 성 어딘가에 재야 인재의 소문이 있다. <b>인재</b> 명령으로 찾아보자.</p>`;
    if (mine) {
      h += `<h3>명령</h3><div class="cmds">`;
      Object.entries(CMDS).forEach(([k, C]) => { h += `<button class="cmd" data-cmd="${k}" title="${C.hint}"><b>${C.label}</b><small>${C.hint}</small></button>`; });
      h += `<button class="cmd" data-cmd="move"><b>이동</b><small>장수·병력 옮기기</small></button>
            <button class="cmd war" data-cmd="attack"><b>출진</b><small>인접한 성 공격</small></button>
            <button class="cmd" data-cmd="diplo"><b>외교</b><small>친선·동맹</small></button></div>`;
    } else if (owner && (ADJ[sel] || []).some(n => city(n).owner === P)) {
      h += `<p class="hint">내 성과 맞닿아 있다. 인접한 내 성을 선택해 <b>출진</b>하면 공격할 수 있다.</p>`;
    }
    el.innerHTML = h;
  }

  function drawLog() {
    $('#log').innerHTML = S.log.slice(0, 40).map(l => `<li class="${l.kind}"><time>${l.t}</time>${esc(l.msg)}</li>`).join('');
  }

  function render() { if (!S) return; drawBar(); drawMap(); drawSide(); drawLog(); }

  // ---------- 모달 ----------
  function openModal(html, buttons = [], opts = {}) {
    const m = $('#modal');
    $('#modalBody').innerHTML = html;
    const bar = $('#modalBtns'); bar.innerHTML = '';
    buttons.forEach(b => {
      const el = document.createElement('button');
      el.className = 'btn' + (b.primary ? ' primary' : '') + (b.danger ? ' danger' : '');
      el.textContent = b.label;
      el.addEventListener('click', () => { if (b.keep) { b.fn(); return; } closeModal(); b.fn && b.fn(); });
      bar.appendChild(el);
    });
    if (!buttons.length || opts.cancel) {
      const el = document.createElement('button'); el.className = 'btn'; el.textContent = '닫기'; el.addEventListener('click', closeModal); bar.appendChild(el);
    }
    m.hidden = false;
    const first = bar.querySelector('.primary') || bar.querySelector('button'); if (first) first.focus();
  }
  function closeModal() { $('#modal').hidden = true; }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2200); }

  function idleOffs(cid) { return offsIn(cid, S.player).filter(o => !o.done); }

  function pickOfficer(cid, stat, title, then) {
    const list = idleOffs(cid).sort((a, b) => b[stat] - a[stat]);
    if (!list.length) { toast('이번 계절에 명령을 받을 수 있는 장수가 없습니다.'); return; }
    openModal(`<h2>${title}</h2><p class="mute">누구에게 맡길까요? (${STAT_NAME[stat]} 순)</p><div class="picklist">${list.map(o =>
      `<button class="pick" data-o="${o.id}"><b>${esc(o.name)}</b><span>${STAT_NAME[stat]} ${o[stat]}</span></button>`).join('')}</div>`, [], { cancel: true });
    $('#modalBody').querySelectorAll('.pick').forEach(b => b.addEventListener('click', () => { closeModal(); then(offById(b.dataset.o)); }));
  }

  function onCmd(key) {
    const cid = sel;
    if (CMDS[key]) {
      const C = CMDS[key];
      pickOfficer(cid, C.stat, `${C.label} — ${CITY_INFO[cid].name}`, o => {
        const r = doCmd(S.player, o, cid, key);
        if (r.ok) log(`${CITY_INFO[cid].name}: ${o.name}의 ${C.label} — ${r.msg}`);
        toast(r.ok ? `${o.name}: ${r.msg}` : r.msg);
        render();
      });
    } else if (key === 'move') moveDialog(cid);
    else if (key === 'attack') attackDialog(cid);
    else if (key === 'diplo') diploDialog(cid);
  }

  function moveDialog(cid) {
    const dests = (ADJ[cid] || []).filter(n => city(n).owner === S.player);
    if (!dests.length) { toast('맞닿은 내 성이 없습니다.'); return; }
    const c = city(cid);
    const offs = idleOffs(cid);
    openModal(`<h2>이동 — ${CITY_INFO[cid].name}에서</h2>
      <label class="fld" for="mvTo">목적지</label>
      <select id="mvTo">${dests.map(d => `<option value="${d}">${CITY_INFO[d].name} (병력 ${fmt(city(d).soldiers)})</option>`).join('')}</select>
      <p class="fld">함께 갈 장수</p>
      <div class="checks">${offs.length ? offs.map(o => `<label><input type="checkbox" value="${o.id}"> ${esc(o.name)}</label>`).join('') : '<span class="mute">대기 중인 장수가 없다</span>'}</div>
      <label class="fld" for="mvN">보낼 병력: <b id="mvNv">0</b></label>
      <input id="mvN" type="range" min="0" max="${c.soldiers}" step="100" value="0">`,
      [{ label: '이동', primary: true, fn: () => {
        const to = $('#mvTo').value, n = +$('#mvN').value;
        const ids = [...document.querySelectorAll('#modalBody .checks input:checked')].map(i => i.value);
        c.soldiers -= n; city(to).soldiers += n;
        ids.forEach(id => { const o = offById(id); o.city = to; o.done = true; });
        log(`${CITY_INFO[cid].name} → ${CITY_INFO[to].name}: 장수 ${ids.length}명, 병력 ${fmt(n)} 이동`);
        render();
      } }], { cancel: true });
    const r = $('#mvN'); r.addEventListener('input', () => { $('#mvNv').textContent = fmt(r.value); });
  }

  function attackDialog(cid) {
    const P = S.player, c = city(cid);
    const targets = (ADJ[cid] || []).filter(n => city(n).owner !== P);
    const offs = idleOffs(cid);
    if (!targets.length) { toast('맞닿은 적의 성이 없습니다.'); return; }
    if (!offs.length) { toast('출진할 장수가 없습니다.'); return; }
    if (c.soldiers < 500) { toast('병력이 500명 이상 있어야 출진할 수 있습니다.'); return; }
    openModal(`<h2>출진 — ${CITY_INFO[cid].name}</h2>
      <label class="fld" for="atTo">공격할 성</label>
      <select id="atTo">${targets.map(t => { const tc = city(t); const w = tc.owner ? (allied(P, tc.owner) ? ' · 동맹!' : peaceBlocks(P, tc.owner) ? ' · 휴전 중' : '') : ''; return `<option value="${t}">${CITY_INFO[t].name} — ${tc.owner ? esc(fac(tc.owner).name) : '주인 없음'} ${fmt(tc.soldiers)}명 · 성벽 ${tc.def}${w}</option>`; }).join('')}</select>
      <p class="fld">출진 장수 (최대 3명)</p>
      <div class="checks">${offs.sort((a, b) => b.war - a.war).map((o, i) => `<label><input type="checkbox" value="${o.id}" ${i === 0 ? 'checked' : ''}> ${esc(o.name)} <small>무${o.war} 지${o.int}</small></label>`).join('')}</div>
      <label class="fld" for="atN">출진 병력: <b id="atNv">${fmt(Math.round(c.soldiers * 0.7 / 100) * 100)}</b> / ${fmt(c.soldiers)}</label>
      <input id="atN" type="range" min="500" max="${c.soldiers}" step="100" value="${Math.round(c.soldiers * 0.7 / 100) * 100}">
      <p class="mute">군량 ${fmt(Math.round(c.soldiers * 0.7 * 0.3))} 소모 예상 · 훈련 ${c.train} · 신앙 ${Math.round(avgFaith(P))}</p>`,
      [{ label: '출진!', primary: true, danger: true, fn: () => {
        const to = $('#atTo').value, n = +$('#atN').value;
        const ids = [...document.querySelectorAll('#modalBody .checks input:checked')].map(i => i.value).slice(0, 3);
        if (!ids.length) { toast('장수를 한 명 이상 고르세요.'); return; }
        const tOwner = city(to).owner;
        if (tOwner && peaceBlocks(P, tOwner)) { toast('말씀에 순종하여 휴전 중입니다. 아직 공격할 수 없습니다.'); return; }
        if (tOwner && allied(P, tOwner)) { setRel(P, tOwner, 0); citiesOf(P).forEach(x => { x.loy -= 10; fixCity(x); }); log(`${fac(tOwner).name}와의 동맹을 깨뜨렸다. 민심이 흔들린다.`, 'bad'); }
        const offs = ids.map(offById);
        offs.forEach(o => { o.done = true; });
        c.soldiers -= n;
        const r = battle(P, offs, n, to, c.train);
        if (!r.win) { c.soldiers += r.attLeft; }
        sel = r.win ? to : cid;
        playBattle(r, () => captiveDialog(r.captives));
      } }], { cancel: true });
    const r = $('#atN'); r.addEventListener('input', () => { $('#atNv').textContent = fmt(r.value); });
  }

  function playBattle(r, then) {
    openModal(`<h2>${r.win ? '승전' : '전투'}</h2><div class="blog" id="blog"></div>`, [{ label: '확인', primary: true, fn: () => { render(); then(); } }]);
    const box = $('#blog');
    const add = l => { const p = document.createElement('p'); p.textContent = l; box.appendChild(p); box.scrollTop = box.scrollHeight; };
    if (reduceMotion) r.lines.forEach(add);
    else r.lines.forEach((l, i) => setTimeout(() => add(l), i * 180));
  }

  function captiveDialog(caps) {
    caps = caps.filter(o => o.alive);
    if (!caps.length) { render(); checkEnd(); return; }
    const o = caps.shift();
    const P = S.player, ruler = offById(fac(P).ruler);
    const wasRuler = o.fac && exists(o.fac) && fac(o.fac).ruler === o.id;
    const chance = clamp(35 + ((ruler ? ruler.cha : 60) - 60) / 2 - (wasRuler ? 30 : 0) + (o.fai > 80 && avgFaith(P) > 60 ? 15 : 0), 5, 90);
    const from = o.fac;
    const after = () => { if (wasRuler && o.fac !== from) succession(from); render(); captiveDialog(caps); };
    openModal(`<p class="eyebrow">포로</p><h2>${esc(o.name)}</h2><p>${esc(o.desc)} <span class="mute">${esc(o.ref)}</span></p>
      <p class="st">무${o.war} 지${o.int} 정${o.pol} 매${o.cha} 신${o.fai} · ${esc(facName(o.fac))}${wasRuler ? ' 군주' : ''}</p><p class="mute">등용 성공 가능성 약 ${Math.round(chance)}%</p>`, [
      { label: '등용한다', primary: true, fn: () => {
        if (Math.random() * 100 < chance) { o.fac = P; o.city = sel; o.done = true; log(`${o.name}이(가) 우리 편이 되었다.`, 'gold'); toast(`${o.name} 등용 성공!`); }
        else { releaseTo(o); log(`${o.name}이(가) 등용을 거절하고 떠났다.`); toast(`${o.name}이(가) 거절했습니다.`); }
        after();
      } },
      { label: '풀어준다', fn: () => { releaseTo(o); setRel(P, from || P, getRel(P, from || P) + 10); citiesOf(P).forEach(c => { c.loy += 2; fixCity(c); }); log(`${o.name}을(를) 너그러이 풀어주었다.`); after(); } },
      { label: '처형한다', danger: true, fn: () => { killOfficer(o); citiesOf(P).forEach(c => { c.loy -= 3; fixCity(c); }); after(); } },
    ]);
  }

  function diploDialog(cid) {
    const P = S.player;
    const others = Object.values(S.facs).filter(f => f.alive && f.id !== P);
    const offs = idleOffs(cid);
    if (!offs.length) { toast('사신으로 보낼 장수가 없습니다.'); return; }
    openModal(`<h2>외교</h2><p class="mute">금 200을 예물로 사신을 보냅니다. 관계 80 이상이면 동맹이 되어 서로 공격하지 않습니다.</p>
      <label class="fld" for="dpTo">상대 세력</label>
      <select id="dpTo">${others.map(f => `<option value="${f.id}">${esc(f.name)} — 관계 ${getRel(P, f.id)}${allied(P, f.id) ? ' (동맹)' : ''}</option>`).join('')}</select>
      <label class="fld" for="dpBy">사신</label>
      <select id="dpBy">${offs.sort((a, b) => b.cha - a.cha).map(o => `<option value="${o.id}">${esc(o.name)} (매력 ${o.cha})</option>`).join('')}</select>`,
      [{ label: '사신 파견', primary: true, fn: () => {
        const F = fac(P); if (F.gold < 200) { toast('금이 부족합니다.'); return; }
        F.gold -= 200;
        const to = $('#dpTo').value, o = offById($('#dpBy').value); o.done = true;
        const before = getRel(P, to);
        const g = Math.round(o.cha / 6 + rnd(0, 8) - (fac(to).aggr * 10));
        setRel(P, to, before + Math.max(2, g));
        const now = getRel(P, to);
        log(`${o.name}이(가) ${fac(to).name}에 사신으로 갔다. 관계 ${before} → ${now}${now >= 80 && before < 80 ? ' · 동맹 성립!' : ''}`, now >= 80 && before < 80 ? 'gold' : '');
        toast(`관계 ${before} → ${now}`);
        render();
      } }], { cancel: true });
  }

  function showBio(id) {
    const o = offById(id);
    openModal(`<p class="eyebrow">${esc(facName(o.fac))}${o.alive ? '' : ' · 사망'}</p><h2>${esc(o.name)}</h2><p>${esc(o.desc)}</p><p class="mute">${esc(o.ref)}</p>
      <div class="meters">${meter('무력', o.war)}${meter('지력', o.int)}${meter('정치', o.pol)}${meter('매력', o.cha)}${meter('신앙', o.fai, 'faith')}</div>`, []);
  }

  function showRoster() {
    const rows = S.offs.slice().sort((a, b) => (a.fac === S.player ? -1 : 0) - (b.fac === S.player ? -1 : 0) || (a.fac || 'zz').localeCompare(b.fac || 'zz'));
    openModal(`<h2>인물 도감</h2><p class="mute">${esc(scn().title)} · ${esc(scn().ref)}</p><div class="tablewrap"><table class="roster"><thead><tr><th>이름</th><th>세력</th><th>위치</th><th>무</th><th>지</th><th>정</th><th>매</th><th>신</th></tr></thead><tbody>${
      rows.map(o => `<tr class="${o.alive ? '' : 'dead'}"><td><button class="oname" data-bio="${o.id}">${esc(o.name)}</button></td><td>${o.alive ? esc(facName(o.fac)) : '사망'}</td><td>${CITY_INFO[o.city].name}</td><td>${o.war}</td><td>${o.int}</td><td>${o.pol}</td><td>${o.cha}</td><td>${o.fai}</td></tr>`).join('')
    }</tbody></table></div>`, []);
  }

  function showMenu() {
    const sc = scn();
    openModal(`<h2>${esc(sc.title)}</h2><p class="mute">${esc(sc.ref)} · BC ${sc.year}년 시작</p>
      <p><b>목표</b> — ${esc((sc.goalText && sc.goalText[S.player]) || '가나안의 열여덟 성을 차지한다.')}</p>
      <ul class="help">
        <li>장수 한 명은 한 계절에 명령 하나를 수행한다. 모두 마쳤으면 <b>턴 종료</b>.</li>
        <li>가을에 농업만큼 식량을 거두고, 계절마다 상업만큼 금이 들어온다. 병사는 계절마다 식량을 먹는다.</li>
        <li><b>신앙</b>이 높으면 전투 사기가 오르고 민심이 따라온다. 계절마다 조금씩 식으니 <b>제사</b>로 지켜야 한다.</li>
        <li>전투에서는 무력 높은 장수끼리 <b>일기토</b>가, 지력 높은 장수가 <b>계략</b>을 펼친다. 성벽과 훈련도가 수비를 돕는다.</li>
        <li>성경 속 사건이 조건을 만나면 일어난다. 말씀대로 선택하면 대체로 보상이 있다.</li>
      </ul>`, [
      { label: '저장', fn: () => save(false) },
      { label: '처음으로', danger: true, fn: showTitle },
    ], { cancel: true });
  }

  // ---------- 타이틀 ----------
  function showTitle() {
    closeModal();
    const saved = loadSave();
    const t = $('#title');
    t.hidden = false;
    $('#app').hidden = true;
    let h = `<div class="title-inner">
      <p class="eyebrow">역사 시뮬레이션</p>
      <h1>성경 삼국지</h1>
      <p class="lede">여호수아의 정복에서 다윗의 통일, 왕국의 분열까지. 성을 다스리고 장수를 모으며 성경의 전쟁사를 다시 걷는다.</p>
      ${saved ? `<button class="btn primary" id="contBtn">이어하기 — ${esc(SCENARIOS.find(s => s.id === saved.scn).title)} · ${esc(saved.facs[saved.player].name)} · BC ${saved.year}년</button>` : ''}
      <h2 class="sec">시나리오</h2><div class="scns">`;
    SCENARIOS.forEach(sc => {
      h += `<article class="scn"><header><span class="yr">BC ${sc.year}</span><h3>${esc(sc.title)}</h3><span class="ref">${esc(sc.ref)}</span></header>
        <p>${esc(sc.intro)}</p><div class="facs">${sc.factions.slice(0, 5).map(f =>
          `<button class="facbtn" data-scn="${sc.id}" data-fac="${f.id}" style="--fc:${f.color}"><i></i><b>${esc(f.name)}</b><small>${esc(f.ruler)} · ${Object.keys(f.cities).length}성</small></button>`).join('')}
          <details><summary>다른 세력</summary><div class="facs">${sc.factions.slice(5).map(f =>
          `<button class="facbtn" data-scn="${sc.id}" data-fac="${f.id}" style="--fc:${f.color}"><i></i><b>${esc(f.name)}</b><small>${esc(f.ruler)} · ${Object.keys(f.cities).length}성</small></button>`).join('')}</div></details>
        </div></article>`;
    });
    h += `</div><p class="foot">인물과 사건은 개역개정 성경의 기록을 바탕으로 게임에 맞게 각색했습니다. 능력치와 전투 결과는 창작입니다.</p></div>`;
    t.innerHTML = h;
    t.querySelectorAll('.facbtn').forEach(b => b.addEventListener('click', () => confirmStart(b.dataset.scn, b.dataset.fac)));
    const cb = $('#contBtn'); if (cb) cb.addEventListener('click', () => { S = saved; sel = fac(S.player).capital; startPlay(); });
  }

  function confirmStart(scnId, facId) {
    const sc = SCENARIOS.find(s => s.id === scnId), f = sc.factions.find(x => x.id === facId);
    openModal(`<p class="eyebrow">BC ${sc.year} · ${esc(sc.title)}</p><h2 style="color:${f.color}">${esc(f.name)}</h2><p>${esc(f.desc)}</p>
      <p class="mute">군주 ${esc(f.ruler)} · 도읍 ${CITY_INFO[f.capital].name} · 금 ${fmt(f.gold)} · 식량 ${fmt(f.food)}</p>
      <p><b>목표</b> — ${esc((sc.goalText && sc.goalText[facId]) || '가나안의 열여덟 성을 차지한다.')}</p>`,
      [{ label: '이 세력으로 시작', primary: true, fn: () => { newGame(scnId, facId); startPlay(true); } }], { cancel: true });
  }

  function startPlay(fresh) {
    $('#title').hidden = true;
    $('#app').hidden = false;
    render();
    if (fresh) {
      const sc = scn();
      openModal(`<p class="eyebrow">BC ${sc.year}년 봄 · ${esc(sc.ref)}</p><h2>${esc(sc.title)}</h2><p class="scripture">${esc(sc.intro)}</p>`, [{ label: '시작', primary: true, fn: () => runEvents() }]);
    }
  }

  // ---------- 입력 ----------
  function bind() {
    $('#map').addEventListener('click', e => { const g = e.target.closest('.city'); if (g) { sel = g.dataset.id; render(); if (window.innerWidth < 860) $('#side').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); } });
    $('#map').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const g = e.target.closest('.city'); if (g) { e.preventDefault(); sel = g.dataset.id; render(); } } });
    $('#side').addEventListener('click', e => {
      const b = e.target.closest('[data-cmd]'); if (b) return onCmd(b.dataset.cmd);
      const bio = e.target.closest('[data-bio]'); if (bio) showBio(bio.dataset.bio);
    });
    $('#modalBody').addEventListener('click', e => { const bio = e.target.closest('[data-bio]'); if (bio) showBio(bio.dataset.bio); });
    $('#endTurn').addEventListener('click', () => {
      const idle = S.offs.filter(o => o.alive && o.fac === S.player && !o.done).length;
      if (idle) openModal(`<h2>턴을 마칠까요?</h2><p>아직 명령을 받지 않은 장수가 ${idle}명 있습니다.</p>`, [{ label: '턴 종료', primary: true, fn: endTurn }], { cancel: true });
      else endTurn();
    });
    $('#rosterBtn').addEventListener('click', showRoster);
    $('#menuBtn').addEventListener('click', showMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden && $('#modalBtns').lastChild && $('#modalBtns').lastChild.textContent === '닫기') closeModal(); });
  }

  bind();
  showTitle();
})();
