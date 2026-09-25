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
  // 그림체: 웹툰(기본) / 실사. 보는 사람 브라우저에 기억한다.
  const ART_STYLE_KEY = 'bible-samguk-artstyle';
  const artStyle = () => { try { return localStorage.getItem(ART_STYLE_KEY) || 'webtoon'; } catch (e) { return 'webtoon'; } };
  const setArtStyle = v => { try { localStorage.setItem(ART_STYLE_KEY, v); } catch (e) { /* 저장소 없음 */ } };
  const artKey = k => { const a = (artStyle() === 'real' ? window.ART_REAL : window.ART) || {}, b = (artStyle() === 'real' ? window.ART : window.ART_REAL) || {}; return a[k] || b[k] || null; };
  const artOf = o => artKey(S.scn + ':' + o.name) || artKey(o.name);
  const portraitOf = (o, big) => {
    const svg = window.PORTRAIT ? PORTRAIT.portrait(o, { color: o.fac && S.facs[o.fac] ? fac(o.fac).color : '#6b6250', ruler: !!(o.fac && S.facs[o.fac] && fac(o.fac).ruler === o.id) }) : '';
    const url = artOf(o);
    return url ? `<span class="pimg${big ? ' big' : ''}">${svg}<img src="${url}" alt="${esc(o.name)}" loading="lazy" onerror="this.remove()"></span>` : svg;
  };
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
    S.story = { ch: 0, counts: {}, base: 0, done: [], kingdom: 10 };
    startChapter();
    log(`${sc.title} — ${fac(player).name}의 역사가 시작된다.`, 'gold');
    sel = fac(player).capital;
  }

  function addOfficer(row, i) {
    const [name, war, int, pol, cha, fai, f, cid, desc, ref] = row;
    const o = { id: 'o' + (i ?? S.offs.length) + '_' + name, name, war, int, pol, cha, fai, fac: f, origin: f, city: cid, desc, ref, alive: true, done: false };
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
    const s = o[C.stat]; let msg = '', found = null;
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
          const t = free[0]; t.fac = f; t.city = cid; found = t.id;
          msg = `${t.name}을(를) 찾아 등용했다! — ${t.desc}`;
        } else if (Math.random() < 0.3) { const g = Math.round(rnd(50, 150)); F.gold += g; msg = `인재는 없었지만 금 ${g}을 얻었다.`; }
        else msg = '쓸 만한 인재를 찾지 못했다.';
        break;
      }
    }
    fixCity(c); o.done = true;
    return { ok: true, msg, found };
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
      const lootG = c.comm * 8, lootF = c.agri * 40; fac(af).gold += lootG; fac(af).food += lootF;
      lines.push(`전리품: 금 ${fmt(lootG)}, 식량 ${fmt(lootF)}`);
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
    queue.push(done => runEvents(done));
    queue.push(done => checkStory(done));
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
      openModal(`<p class="eyebrow">승리 · BC ${S.year}년</p><h2>${esc(fac(P).name)}의 천하</h2><p>${esc((sc.goalText && sc.goalText[P]) || '가나안의 열여덟 성을 차지했다.')}</p><p>하나님 나라: <b>${esc(kStage().name)}</b> (${S.story.kingdom}/100)</p><p class="mute">${S.turn}턴 만에 목표를 이루었다. 계속 플레이할 수 있다.</p>`,
        [{ label: '계속 다스린다', primary: true, fn: () => { S.over = false; S.flags.won = true; render(); } }, { label: '처음으로', fn: showTitle }]);
    }
  }

  // ---------- 저장 ----------
  // 슬롯: auto(자동 저장) + 1~3(수동). 각 슬롯에 요약 정보와 게임 상태를 함께 담는다.
  const SLOT_KEY = k => 'bible-samguk-slot-' + k;
  const SLOTS = ['auto', '1', '2', '3'];
  let storageOk = true, lastAuto = null;
  function snapshot() {
    const F = fac(S.player), r = offById(F.ruler);
    return { v: 2, savedAt: Date.now(), scn: S.scn, player: S.player, facName: F.name, color: F.color, ruler: r ? r.name : '', year: S.year, season: S.season, turn: S.turn, cities: citiesOf(S.player).length, kingdom: S.story ? S.story.kingdom : 0, chapter: S.story ? S.story.ch : 0, data: S };
  }
  function writeSlot(k) {
    if (!S) return false;
    try { localStorage.setItem(SLOT_KEY(k), JSON.stringify(snapshot())); storageOk = true; return true; }
    catch (e) { storageOk = false; return false; }
  }
  function readSlot(k) {
    try {
      const t = localStorage.getItem(SLOT_KEY(k));
      if (t) { const d = JSON.parse(t); return d && d.data ? d : null; }
      if (k === 'auto') { const old = localStorage.getItem(SAVE_KEY); if (old) { const data = JSON.parse(old); return { v: 1, savedAt: 0, scn: data.scn, player: data.player, facName: data.facs[data.player].name, color: data.facs[data.player].color, ruler: '', year: data.year, season: data.season, turn: data.turn, cities: 0, kingdom: data.story ? data.story.kingdom : 0, data }; } }
    } catch (e) { storageOk = false; }
    return null;
  }
  function deleteSlot(k) { try { localStorage.removeItem(SLOT_KEY(k)); if (k === 'auto') localStorage.removeItem(SAVE_KEY); } catch (e) { /* 저장소 없음 */ } }
  function latestSave() { return SLOTS.map(readSlot).filter(Boolean).sort((a, b) => b.savedAt - a.savedAt)[0] || null; }
  // 자동 저장: 명령·전투·턴·사명마다 조용히 기록
  let autoTimer = null;
  function autosave() { clearTimeout(autoTimer); autoTimer = setTimeout(() => { if (S && writeSlot('auto')) lastAuto = Date.now(); }, 250); }
  function save(quiet) { if (quiet) return autosave(); saveDialog(); }
  const when = t => { if (!t) return '이전 버전 저장'; const d = new Date(t); const p = n => String(n).padStart(2, '0'); return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  function slotCard(k, d, mode) {
    const name = k === 'auto' ? '자동 저장' : `슬롯 ${k}`;
    if (!d) return `<li class="slot empty"><div><b>${name}</b><small>비어 있음</small></div>${mode === 'save' && k !== 'auto' ? `<button class="btn primary" data-save="${k}">여기에 저장</button>` : ''}</li>`;
    const sc = SCENARIOS.find(x => x.id === d.scn);
    return `<li class="slot"><span class="fbadge" style="--fc:${d.color || '#888'}">${esc((d.facName || '?')[0])}</span>
      <div><b>${name} · ${esc(d.facName || '')}${d.ruler ? ' · ' + esc(d.ruler) : ''}</b><small>${esc(sc ? sc.title : '')} · BC ${d.year}년 ${SEASONS[d.season] || ''} · ${d.turn}턴 · 성 ${d.cities || '?'} · 나라 ${d.kingdom}</small><small>${when(d.savedAt)}</small></div>
      <div class="slot-btns">${mode === 'save' && k !== 'auto' ? `<button class="btn primary" data-save="${k}">덮어쓰기</button>` : `<button class="btn primary" data-load="${k}">불러오기</button>`}<button class="btn" data-del="${k}" aria-label="${name} 삭제">삭제</button></div></li>`;
  }
  function saveDialog(mode = 'save') {
    const html = `${!storageOk ? '<p class="warn">이 브라우저는 저장소를 쓸 수 없습니다(사생활 보호 모드 등). 아래 <b>저장 코드</b>로 보관하세요.</p>' : ''}
      <ul class="slots">${SLOTS.map(k => slotCard(k, readSlot(k), mode)).join('')}</ul>
      <p class="mute">자동 저장은 명령·전투·턴이 끝날 때마다 이 브라우저에 기록됩니다.${lastAuto ? ` 마지막 자동 저장 ${when(lastAuto)}.` : ''}</p>
      <div class="codebox"><p class="rw-title">저장 코드</p><p class="mute">다른 기기나 브라우저로 옮기거나, 브라우저 데이터가 지워질 때를 대비해 보관하세요.</p>
        <div class="code-btns">${S && mode === 'save' ? '<button class="btn" id="codeCopy">저장 코드 복사</button>' : ''}<button class="btn" id="codeLoad">저장 코드로 불러오기</button></div>
        <textarea id="codeArea" rows="3" placeholder="여기에 저장 코드를 붙여 넣으세요" spellcheck="false" hidden></textarea></div>`;
    openModal(html, [], { title: mode === 'save' ? '저장' : '불러오기', wide: true });
    const body = $('#modalBody');
    body.querySelectorAll('[data-save]').forEach(b => b.addEventListener('click', () => { if (writeSlot(b.dataset.save)) { toast(`슬롯 ${b.dataset.save}에 저장했습니다.`); saveDialog(mode); } else toast('저장하지 못했습니다. 저장 코드를 복사해 보관하세요.'); }));
    body.querySelectorAll('[data-load]').forEach(b => b.addEventListener('click', () => { const d = readSlot(b.dataset.load); if (d) loadData(d.data); }));
    body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.armed) { deleteSlot(b.dataset.del); saveDialog(mode); return; }
      b.dataset.armed = '1'; b.textContent = '정말 삭제'; b.classList.add('danger');
    }));
    const area = $('#codeArea');
    const cc = $('#codeCopy');
    if (cc) cc.addEventListener('click', () => {
      const code = encodeSave();
      area.hidden = false; area.value = code; area.select();
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => toast('저장 코드를 복사했습니다.'), () => toast('코드를 길게 눌러 직접 복사하세요.'));
      else toast('코드를 길게 눌러 직접 복사하세요.');
    });
    $('#codeLoad').addEventListener('click', () => {
      if (area.hidden || !area.value.trim()) { area.hidden = false; area.value = ''; area.focus(); toast('저장 코드를 붙여 넣은 뒤 다시 누르세요.'); return; }
      const data = decodeSave(area.value.trim());
      if (data) loadData(data); else toast('저장 코드를 읽을 수 없습니다. 코드 전체를 붙여 넣었는지 확인하세요.');
    });
  }
  function encodeSave() { const bytes = new TextEncoder().encode(JSON.stringify(snapshot())); let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); }); return 'BSG2:' + btoa(bin); }
  function decodeSave(code) {
    try {
      const b64 = code.replace(/^BSG2:/, '').replace(/\s+/g, '');
      const bin = atob(b64); const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      const d = JSON.parse(new TextDecoder().decode(bytes));
      const data = d.data || d;
      return data && data.scn && data.cities && data.offs ? data : null;
    } catch (e) { return null; }
  }
  function loadData(data) {
    closeModal();
    if (window.TOWN) TOWN.exit(true);
    S = data; migrate(); sel = null; VB = null;
    startPlay();
    autosave();
    toast(`${fac(S.player).name} · BC ${S.year}년 ${SEASONS[S.season]}부터 이어갑니다.`);
  }

  // ---------- 화면: 지도 (그림 지도 + 드래그/확대) ----------
  const VB_FULL = { x: -20, y: -20, w: 660, h: 840 };
  let VB = null;
  const SEA_PTS = '-500,-200 272,-200 268,0 262,100 237,190 212,212 200,270 150,407 125,470 80,545 0,650 -500,760';
  const MOUNTAINS = [[430, 62, 1.5, 1], [468, 80, 1.1, 1], [312, 196, 0.9], [330, 150, 0.8], [226, 238, 0.9], [318, 318, 1], [262, 338, 0.8], [318, 520, 0.9], [206, 588, 0.8], [505, 345, 1.1], [512, 392, 1], [482, 602, 1], [452, 662, 1.1], [320, 700, 1.2], [420, 770, 1.1], [520, 520, 1], [560, 160, 1.1], [590, 110, 1]];
  const FORESTS = [[330, 240, 5], [470, 240, 6], [205, 330, 5], [520, 450, 5], [360, 120, 4], [225, 410, 4], [300, 590, 3], [540, 300, 5]];
  const PALMCL = [[330, 480, 4], [70, 580, 3], [160, 665, 3]];

  function mtn(x, y, s, snow) {
    const w = 16 * s, h = 14 * s;
    return `<g class="mtn"><path d="M${x - w} ${y} L${x - w * 0.2} ${y - h} L${x + w * 0.5} ${y}Z" fill="#8c8468"/><path d="M${x - w * 0.2} ${y - h} L${x + w * 0.5} ${y} L${x + w * 0.1} ${y}Z" fill="#6d6650"/>
      <path d="M${x - w * 0.1} ${y} L${x + w * 0.55} ${y - h * 0.72} L${x + w * 1.05} ${y}Z" fill="#9d957a"/><path d="M${x + w * 0.55} ${y - h * 0.72} L${x + w * 1.05} ${y} L${x + w * 0.7} ${y}Z" fill="#7a7359"/>
      ${snow ? `<path d="M${x - w * 0.2} ${y - h} L${x - w * 0.42} ${y - h * 0.7} L${x - w * 0.05} ${y - h * 0.74}Z" fill="#f4f1e8"/>` : ''}</g>`;
  }
  function trees(x, y, n, palm) {
    let h = '';
    for (let i = 0; i < n; i++) {
      const a = i * 2.4, r = 3 + (i % 3) * 4, tx = x + Math.cos(a) * r * 1.6, ty = y + Math.sin(a) * r;
      h += palm ? `<path d="M${tx} ${ty} l0 -7" stroke="#6b5334" stroke-width="1.2"/><path d="M${tx - 5} ${ty - 6} Q${tx} ${ty - 10} ${tx + 5} ${ty - 6} M${tx - 4} ${ty - 8} Q${tx} ${ty - 5} ${tx + 4} ${ty - 8}" stroke="#4f7a36" stroke-width="1.6" fill="none"/>`
        : `<circle cx="${tx}" cy="${ty}" r="${3.4 + (i % 2)}" fill="${i % 3 ? '#4d7434' : '#5f8a3c'}"/><circle cx="${tx - 1}" cy="${ty - 1.2}" r="1.4" fill="#86a95a" opacity=".7"/>`;
    }
    return h;
  }
  function governor(cid) {
    const c = city(cid); if (!c.owner) return null;
    return offsIn(cid, c.owner).sort((a, b) => (b.pol + b.cha) - (a.pol + a.cha))[0] || null;
  }
  function cityIcon(c, color, cap) {
    const s = cap ? 1.25 : 1;
    return `<g transform="scale(${s})">
      <ellipse cx="0" cy="8" rx="19" ry="6" fill="#000" opacity=".28"/>
      <path d="M-15 -4 L0 3.5 L0 7.5 L-15 0Z" fill="#b3a482"/><path d="M0 3.5 L15 -4 L15 0 L0 7.5Z" fill="#978a6c"/>
      <path d="M-15 -4 L0 -11.5 L15 -4 L0 3.5Z" fill="#d8ccad" stroke="#7d705a" stroke-width=".8"/>
      <path d="M-6 -9 L0 -6 L0 -1 L-6 -4Z" fill="#e8dcbd"/><path d="M0 -6 L6 -9 L6 -4 L0 -1Z" fill="#c9bb98"/>
      <path d="M-6 -9 L0 -12 L6 -9 L0 -6Z" fill="${color}" stroke="#2a2418" stroke-width=".5"/>
      ${[[-15, -4], [15, -4], [0, -11.5], [0, 3.5]].map(([x, y]) => `<rect x="${x - 1.8}" y="${y - 5}" width="3.6" height="6" fill="#c7b995" stroke="#7d705a" stroke-width=".5"/><rect x="${x - 2.2}" y="${y - 6}" width="4.4" height="1.4" fill="#8f836a"/>`).join('')}
      <path d="M0 -12 L0 -20" stroke="#3b2d1c" stroke-width=".8"/><path d="M0 -20 L6 -18 L0 -16Z" fill="${color}"/>
    </g>`;
  }
  function drawMap() {
    const svg = $('#map');
    const P = S.player, q = storyTarget();
    if (!VB) resetView();
    let h = `<defs>
      <linearGradient id="landG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d8d41"/><stop offset=".45" stop-color="#8a9a4d"/><stop offset=".75" stop-color="#b19a5a"/><stop offset="1" stop-color="#c3a669"/></linearGradient>
      <linearGradient id="seaG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b5064"/><stop offset="1" stop-color="#2d7285"/></linearGradient>
      <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d6" stop-opacity=".22"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></linearGradient>
      <filter id="paint" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="4" seed="11" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .18  0 0 0 0 .22  0 0 0 0 .08  0 0 0 .9 -.15" result="t"/><feComposite in="t" in2="SourceGraphic" operator="in" result="tc"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="tc"/></feMerge></filter>
      <radialGradient id="desert" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d4b476" stop-opacity=".75"/><stop offset="1" stop-color="#d4b476" stop-opacity="0"/></radialGradient>
    </defs>
    <rect x="-500" y="-300" width="1700" height="1400" fill="url(#landG)" filter="url(#paint)"/>
    <ellipse cx="620" cy="560" rx="220" ry="320" fill="url(#desert)"/><ellipse cx="150" cy="780" rx="230" ry="120" fill="url(#desert)"/>
    <polygon points="${SEA_PTS}" fill="none" stroke="#e0cf98" stroke-width="10" stroke-linejoin="round" opacity=".7"/>
    <polygon points="${SEA_PTS}" fill="url(#seaG)"/>
    <polygon points="-40,-200 60,-200 -160,760 -300,760" fill="url(#ray)"/><polygon points="90,-200 150,-200 -20,700 -110,700" fill="url(#ray)"/><polygon points="190,-200 230,-200 60,600 0,600" fill="url(#ray)"/>
    <path d="M378 110 L372 150 L368 192" fill="none" stroke="#3f86a8" stroke-width="3"/>
    <ellipse cx="367" cy="212" rx="12" ry="21" fill="#2b6f86" stroke="#d6c38f" stroke-width="2"/>
    <path d="M367 232 Q360 290 364 330 T352 400 Q346 440 350 478" fill="none" stroke="#3f86a8" stroke-width="3"/>
    <path d="M345 478 Q330 520 336 580 Q340 640 350 660 Q362 640 364 580 Q366 520 356 478 Z" fill="#2b6f86" stroke="#d6c38f" stroke-width="2"/>
    <text class="geo" x="40" y="330">대 해</text><text class="geo sm" x="380" y="228">갈릴리 바다</text>
    <text class="geo sm" x="372" y="560" transform="rotate(80 372 560)">염 해</text><text class="geo sm" x="160" y="760">네 게 브</text><text class="geo sm" x="520" y="300">길 르 앗</text>
    ${FORESTS.map(([x, y, n]) => trees(x, y, n)).join('')}${PALMCL.map(([x, y, n]) => trees(x, y, n, true)).join('')}
    ${MOUNTAINS.map(([x, y, s, snow]) => mtn(x, y, s, snow)).join('')}`;
    const hot = sel && city(sel) && city(sel).owner === P ? (ADJ[sel] || []) : [];
    ROADS.forEach(([a, b]) => {
      const A = CITY_INFO[a], B = CITY_INFO[b];
      const on = (a === sel && hot.includes(b)) || (b === sel && hot.includes(a));
      h += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="road-b"/><line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="road${on ? ' hot' : ''}"/>`;
    });
    Object.values(S.cities).forEach(c => {
      const ci = CITY_INFO[c.id];
      const color = c.owner ? fac(c.owner).color : '#8d877a';
      const cap = c.owner && fac(c.owner).capital === c.id;
      const gov = governor(c.id);
      const badge = c.owner ? fac(c.owner).name[0] : '·';
      h += `<g class="city${sel === c.id ? ' sel' : ''}" data-id="${c.id}" tabindex="0" role="button" aria-label="${ci.name}" transform="translate(${ci.x} ${ci.y})">
        <circle r="24" fill="transparent"/>${cityIcon(c, color, cap)}
        <g transform="translate(0 ${cap ? 20 : 16})">
          <path d="M-30 -1 h12 v15 l-6 -4 l-6 4z" fill="${color}" stroke="#1d1a14" stroke-width=".8"/><text x="-24" y="9" class="cbadge">${esc(badge)}</text>
          <text x="-15" y="7" class="cname">${ci.name}</text>
          <text x="-15" y="16" class="cgov">${gov ? '태수 ' + esc(gov.name) : '태수 없음'}</text>
        </g>
        <g transform="translate(14 -20)"><rect x="-2" y="-8" width="${String(fmtK(c.soldiers)).length * 5.6 + 10}" height="11" rx="2" fill="#141b2c" opacity=".82"/><text x="3" y="0" class="csold">${fmtK(c.soldiers)}</text></g>`;
      if (sel === c.id) h += `<path class="bracket" d="M-26 -20 v-8 h8 M26 -20 v-8 h-8 M-26 14 v8 h8 M26 14 v8 h-8" fill="none" stroke="#ffd36a" stroke-width="2.4"/>`;
      if (q && q === c.id) h += `<g class="qmark" transform="translate(0 -40)"><text y="-16" class="qlabel">사명</text><circle r="10" fill="#1b2233" stroke="#e6b64a" stroke-width="2.4"/><text y="5" class="qbang">!</text><path d="M-5 9 L0 16 L5 9Z" fill="#e6b64a"/></g>`;
      h += `</g>`;
    });
    svg.innerHTML = h;
    applyView();
    drawMini();
  }
  const fmtK = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  function resetView(full) {
    const wrap = $('#mapWrap'), ar = wrap.clientWidth / Math.max(1, wrap.clientHeight);
    if (full) { VB = Object.assign({}, VB_FULL); if (ar > VB.w / VB.h) { const w = VB.h * ar; VB.x -= (w - VB.w) / 2; VB.w = w; } else { const hh = VB.w / ar; VB.y -= (hh - VB.h) / 2; VB.h = hh; } return; }
    const cap = CITY_INFO[S && fac(S.player).capital] || CITY_INFO.jerusalem;
    const w = ar > 0.7 ? Math.min(560 * ar, 900) : 250, hh = w / ar; VB = { x: cap.x - w / 2, y: cap.y - hh / 2, w, h: hh }; clampView();
  }
  function clampView() { VB.x = clamp(VB.x, -160, 760 - VB.w); VB.y = clamp(VB.y, -120, 900 - VB.h); }
  function applyView() { $('#map').setAttribute('viewBox', `${VB.x} ${VB.y} ${VB.w} ${VB.h}`); const r = $('#miniView'); if (r) { r.setAttribute('x', VB.x); r.setAttribute('y', VB.y); r.setAttribute('width', VB.w); r.setAttribute('height', VB.h); } }
  function drawMini() {
    let h = `<rect x="-20" y="-20" width="660" height="840" fill="#5d7440"/><polygon points="${SEA_PTS}" fill="#1f5a6e"/>`;
    Object.values(S.cities).forEach(c => { const ci = CITY_INFO[c.id]; h += `<circle cx="${ci.x}" cy="${ci.y}" r="${c.owner === S.player ? 16 : 12}" fill="${c.owner ? fac(c.owner).color : '#8d877a'}" stroke="${c.owner === S.player ? '#fff' : 'none'}" stroke-width="5"/>`; });
    h += `<rect id="miniView" fill="none" stroke="#ffd36a" stroke-width="8"/>`;
    $('#mini').innerHTML = h; applyView();
  }
  // 드래그·휠·핀치
  function bindPanZoom() {
    const svg = $('#map'), pts = new Map(); let moved = 0, start = null, pinch = null;
    const toMap = (cx, cy) => { const r = svg.getBoundingClientRect(); return { x: VB.x + (cx - r.left) / r.width * VB.w, y: VB.y + (cy - r.top) / r.height * VB.h }; };
    const zoom = (f, cx, cy) => { const p = toMap(cx, cy); const nw = clamp(VB.w * f, 180, 1100); const k = nw / VB.w; VB.x = p.x - (p.x - VB.x) * k; VB.y = p.y - (p.y - VB.y) * k; VB.w = nw; VB.h *= k; clampView(); applyView(); };
    svg.addEventListener('pointerdown', e => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) { moved = 0; start = { x: e.clientX, y: e.clientY, vx: VB.x, vy: VB.y }; } if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } });
    svg.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); zoom(pinch / d, (a.x + b.x) / 2, (a.y + b.y) / 2); pinch = d; moved = 99; return; }
      if (start) { const r = svg.getBoundingClientRect(); const dx = e.clientX - start.x, dy = e.clientY - start.y; moved = Math.max(moved, Math.hypot(dx, dy)); if (moved > 6) { svg.setPointerCapture && svg.setPointerCapture(e.pointerId); VB.x = start.vx - dx / r.width * VB.w; VB.y = start.vy - dy / r.height * VB.h; clampView(); applyView(); } }
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) start = null; };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 0.89, e.clientX, e.clientY); }, { passive: false });
    svg.addEventListener('click', e => { if (moved > 6) { e.stopPropagation(); return; } const g = e.target.closest('.city'); if (g) onCityTap(g.dataset.id); }, true);
    $('#minimap').addEventListener('click', () => { resetView(true); applyView(); });
    window.addEventListener('resize', () => { if (S && !$('#app').hidden) { resetView(); drawMap(); } });
  }

  // ---------- 화면: 상단 HUD ----------
  const ICON = {
    gold: '<svg viewBox="0 0 24 24"><path d="M3 17 L6 9 H18 L21 17Z" fill="#f2c14e" stroke="#8a5d12"/><path d="M6 9 L8 5 H16 L18 9" fill="#ffd978" stroke="#8a5d12"/></svg>',
    food: '<svg viewBox="0 0 24 24"><path d="M12 22 V6" stroke="#c99a3a" stroke-width="2"/>' + [0, 1, 2, 3].map(i => `<ellipse cx="${i % 2 ? 15 : 9}" cy="${7 + i * 3}" rx="3" ry="1.6" fill="#e4bb57" transform="rotate(${i % 2 ? -35 : 35} ${i % 2 ? 15 : 9} ${7 + i * 3})"/>`).join('') + '</svg>',
    troop: '<svg viewBox="0 0 24 24"><path d="M5 19 L19 5 M16 5 H19 V8" stroke="#d9dde6" stroke-width="2" fill="none"/><path d="M19 19 L5 5 M5 8 V5 H8" stroke="#d9dde6" stroke-width="2" fill="none"/></svg>',
    city: '<svg viewBox="0 0 24 24"><path d="M3 20 V9 H6 V12 H9 V7 H15 V12 H18 V9 H21 V20Z" fill="#c9bfa6" stroke="#6d6250"/></svg>',
    faith: '<svg viewBox="0 0 24 24"><path d="M12 3 C15 8 18 10 17 15 A5 5 0 0 1 7 15 C6 11 10 10 12 3Z" fill="#ff9a3c"/><path d="M12 10 C13.5 13 15 14 14.5 16 A2.6 2.6 0 0 1 9.5 16 C9.3 14 11 13 12 10Z" fill="#ffe08a"/></svg>',
    king: '<svg viewBox="0 0 24 24"><path d="M3 18 L5 8 L9.5 12 L12 5 L14.5 12 L19 8 L21 18Z" fill="#e6b64a" stroke="#8a5d12"/></svg>',
  };
  function power(f) {
    const cs = citiesOf(f), offs = S.offs.filter(o => o.alive && o.fac === f);
    return Math.round(cs.reduce((s, c) => s + c.soldiers * (0.6 + c.train / 250), 0) / 10 + offs.reduce((s, o) => s + o.war * 3 + o.int, 0));
  }
  function drawHud() {
    const F = fac(S.player), cs = citiesOf(S.player), sold = cs.reduce((s, c) => s + c.soldiers, 0);
    const ks = kStage();
    $('#resBar').innerHTML = [
      ['gold', '금', fmt(F.gold)], ['food', '식량', fmtK(F.food)], ['troop', '병력', fmtK(sold)], ['city', '성', cs.length], ['faith', '신앙', Math.round(avgFaith(S.player))], ['king', '나라', S.story.kingdom],
    ].map(([k, lb, v]) => `<span class="res" title="${lb}"><i>${ICON[k]}</i><b>${v}</b><small>${lb}</small></span>`).join('');
    const ruler = offById(F.ruler);
    $('#lordBtn').innerHTML = `<span class="lord-img">${ruler ? portraitOf(ruler) : ''}<em>${ks.lv}</em></span><span class="lord-name">${ruler ? esc(ruler.name) : '공위'}</span>`;
    $('#lordMeta').innerHTML = `<div class="lm-row"><span class="fbadge" style="--fc:${F.color}">${esc(F.name[0])}</span><b>${esc(F.name)}</b><span class="stage">${esc(ks.name)}</span></div>
      <div class="lm-row"><span class="season">${yearLabel()}</span><span class="turn">${S.turn}턴</span></div>
      <div class="power"><i>${ICON.troop}</i>${fmt(power(S.player))}</div>`;
    const ch = curChapter();
    if (ch) {
      const p = progress(ch.goal);
      $('#questText').innerHTML = `<span class="qch">${esc(ch.title)}</span><span class="qgoal">${esc(ch.goal.text)} <em class="${p.done ? 'ok' : ''}">(${p.cur}/${p.n})</em></span>`;
    } else $('#questText').innerHTML = `<span class="qch">사명 완수</span><span class="qgoal">모든 사명을 이루었다. 나라를 계속 다스리자.</span>`;
  }

  function render() { if (!S) return; drawHud(); drawMap(); if (hooks.onRender) hooks.onRender(); if (!$('#app').hidden) autosave(); }
  const hooks = {};

  // ---------- 성 선택 ----------
  function onCityTap(cid) {
    sel = cid;
    const c = city(cid);
    if (c.owner === S.player) { render(); if (window.TOWN) TOWN.enter(cid); return; }
    render(); cityPopup(cid);
  }
  function bestSource(target) {
    const P = S.player;
    return (ADJ[target] || []).map(city).filter(c => c.owner === P && idleOffs(c.id).length && c.soldiers >= 500).sort((a, b) => b.soldiers - a.soldiers)[0] || null;
  }
  function defPower(c) { return Math.round(c.soldiers * (0.6 + c.train / 250) * (1 + c.def / 180) / 10 + (c.owner ? offsIn(c.id, c.owner).reduce((s, o) => s + o.war * 3 + o.int, 0) : 0)); }
  function cityPopup(cid) {
    const c = city(cid), ci = CITY_INFO[cid], P = S.player, src = bestSource(cid);
    const dp = defPower(c);
    const myP = src ? Math.round(src.soldiers * 0.7 * (0.6 + src.train / 250) / 10 + offsIn(src.id, P).sort((a, b) => b.war - a.war).slice(0, 3).reduce((s, o) => s + o.war * 3 + o.int, 0)) : 0;
    const ratio = myP / Math.max(1, dp);
    const diff = !src ? ['정찰', 'dim'] : ratio > 2 ? ['쉬움', 'easy'] : ratio > 1.2 ? ['보통', 'mid'] : ratio > 0.8 ? ['어려움', 'hard'] : ['매우 어려움', 'vhard'];
    const defs = c.owner ? offsIn(cid, c.owner) : [];
    const gov = governor(cid);
    const rel = c.owner ? getRel(P, c.owner) : null;
    openModal(`<div class="pop-city">
      <div class="pc-left">${gov ? `<div class="pc-art">${portraitOf(gov)}</div><p class="pc-cap">태수 <b>${esc(gov.name)}</b></p>` : `<div class="pc-art empty"><svg viewBox="-24 -26 48 40">${cityIcon(c, c.owner ? fac(c.owner).color : '#8d877a', false)}</svg></div><p class="pc-cap">태수 없음</p>`}
        <p class="mute pc-desc">${esc(ci.desc)}</p></div>
      <div class="pc-box">
        <p class="pc-diff ${diff[1]}">${diff[0]}</p>
        <div class="pc-name">${c.owner ? `<span class="fbadge" style="--fc:${fac(c.owner).color}">${esc(fac(c.owner).name[0])}</span>${esc(fac(c.owner).name)}` : '주인 없는 성읍'}</div>
        <dl class="pc-stats"><dt>수비 병력</dt><dd>${fmt(c.soldiers)}</dd><dt>성벽</dt><dd>${c.def}</dd><dt>수비 장수</dt><dd>${defs.length}명</dd>${rel !== null ? `<dt>관계</dt><dd>${rel}${allied(P, c.owner) ? ' 동맹' : ''}</dd>` : ''}
        <dt>추천 전투력</dt><dd class="pw">${fmt(Math.round(dp * 1.3))}</dd>${src ? `<dt>출전 가능 전투력</dt><dd class="pw mine">${fmt(myP)}</dd>` : ''}</dl>
      </div></div>
      <div class="rewards"><p class="rw-title">점령 보상</p><div class="rw-row">
        <span class="rw"><i>${ICON.city}</i><b>${ci.name}</b><small>성 획득</small></span>
        <span class="rw"><i>${ICON.gold}</i><b>${fmt(c.comm * 8)}</b><small>금</small></span>
        <span class="rw"><i>${ICON.food}</i><b>${fmt(c.agri * 40)}</b><small>식량</small></span>
        ${defs.length ? `<span class="rw blue"><i>${portraitOf(defs[0])}</i><b>포로</b><small>등용 기회</small></span>` : ''}
      </div></div>
      ${src ? `<p class="mute">출전 성: ${CITY_INFO[src.id].name} (병력 ${fmt(src.soldiers)})</p>` : `<p class="mute">맞닿은 내 성에서 대기 중인 장수와 병력 500 이상이 있어야 공격할 수 있습니다.</p>`}`,
      [{ label: '성 살펴보기', fn: () => { if (window.TOWN) TOWN.enter(cid); } }].concat(src ? [{ label: '공격', primary: true, fn: () => attackDialog(src.id, cid) }] : []),
      { title: `${ci.name} ${src ? '정벌' : '정찰'}`, cancel: false });
  }

  // ---------- 사명(스토리) ----------
  function chain() { const sc = STORY[S.scn] || {}; return sc[S.player] || STORY.generic; }
  function curChapter() { return chain()[S.story.ch] || null; }
  function kStage() { let i = 0; KINGDOM_STAGES.forEach((s, j) => { if (S.story.kingdom >= s[0]) i = j; }); const s = KINGDOM_STAGES[i]; return { lv: i + 1, name: s[1], desc: s[2], next: KINGDOM_STAGES[i + 1] }; }
  function addKingdom(d, why) {
    const before = kStage().lv;
    S.story.kingdom = clamp(Math.round((S.story.kingdom + d) * 10) / 10, 0, 100);
    const after = kStage();
    if (after.lv > before) { log(`하나님 나라가 '${after.name}' 단계에 이르렀다.`, 'gold'); pendingStage = after; }
    if (why && Math.abs(d) >= 2) toast(`${why} · 나라 ${d > 0 ? '+' : ''}${d}`);
  }
  let pendingStage = null;
  function progress(g) {
    const P = S.player;
    switch (g.t) {
      case 'cmd': { const cur = S.story.counts[g.key] || 0; return { cur: Math.min(cur, g.n), n: g.n, done: cur >= g.n }; }
      case 'own': { const ok = city(g.city).owner === P; return { cur: ok ? 1 : 0, n: 1, done: ok }; }
      case 'cities': { const cur = citiesOf(P).length; return { cur: Math.min(cur, g.n), n: g.n, done: cur >= g.n }; }
      case 'faith': { const cur = Math.round(avgFaith(P)); return { cur: Math.min(cur, g.n), n: g.n, done: cur >= g.n }; }
      case 'officers': { const cur = S.offs.filter(o => o.alive && o.fac === P).length; return { cur: Math.min(cur, g.n), n: g.n, done: cur >= g.n }; }
      case 'flag': { const ok = !!S.flags[g.flag]; return { cur: ok ? 1 : 0, n: 1, done: ok }; }
      case 'rel': { const cur = exists(g.fac) ? getRel(P, g.fac) : 100; return { cur: Math.min(cur, g.n), n: g.n, done: cur >= g.n }; }
      case 'gain': { const cur = Math.max(0, citiesOf(P).length - (S.story.base || 0)); return { cur: Math.min(cur, g.n), n: g.n, done: cur >= g.n }; }
      case 'goal': {
        const list = (scn().goals || {})[P] || HOLY_LAND; const cur = list.filter(c => city(c).owner === P).length;
        const fOk = !g.faith || avgFaith(P) >= g.faith;
        return { cur, n: list.length, done: cur >= list.length && fOk };
      }
    }
    return { cur: 0, n: 1, done: false };
  }
  function storyTarget() {
    const ch = S && S.story && curChapter(); if (!ch) return null;
    const g = ch.goal;
    if (g.city) return g.city;
    if (g.t === 'goal') { const list = (scn().goals || {})[S.player] || HOLY_LAND; return list.find(c => city(c).owner !== S.player && (ADJ[c] || []).some(n => city(n).owner === S.player)) || null; }
    if (g.t === 'gain') { const t = Object.values(S.cities).find(c => c.owner !== S.player && (ADJ[c.id] || []).some(n => city(n).owner === S.player)); return t ? t.id : null; }
    return fac(S.player).capital;
  }
  function startChapter() { S.story.counts = {}; S.story.base = citiesOf(S.player).length; }
  let storyBusy = false;
  function checkStory(done) {
    if (storyBusy || !S || S.over) return done && done();
    const ch = curChapter();
    const fin = () => { if (pendingStage) { const st = pendingStage; pendingStage = null; showStage(st, done); } else if (done) done(); };
    if (!ch || !progress(ch.goal).done) return fin();
    storyBusy = true;
    const r = ch.reward || {};
    const F = fac(S.player);
    if (r.gold) F.gold += r.gold; if (r.food) F.food += r.food;
    addKingdom(r.k || 0);
    log(`[사명 완수] ${ch.title} — 나라 +${r.k || 0}${r.gold ? `, 금 +${r.gold}` : ''}${r.food ? `, 식량 +${r.food}` : ''}`, 'gold');
    S.story.done.push(S.story.ch);
    S.story.ch++;
    startChapter();
    playDialogue(ch.outro || [], () => {
      openModal(`<div class="clear-banner"><p class="eyebrow">사명 완수 · ${esc(ch.ref)}</p><h2>${esc(ch.title)}</h2></div>
        <div class="rewards"><p class="rw-title">보상</p><div class="rw-row">
        <span class="rw"><i>${ICON.king}</i><b>+${r.k || 0}</b><small>하나님 나라</small></span>
        ${r.gold ? `<span class="rw"><i>${ICON.gold}</i><b>${fmt(r.gold)}</b><small>금</small></span>` : ''}${r.food ? `<span class="rw"><i>${ICON.food}</i><b>${fmt(r.food)}</b><small>식량</small></span>` : ''}</div></div>`,
        [{ label: '다음 사명', primary: true, fn: () => { storyBusy = false; render(); const nx = curChapter(); if (nx) playDialogue(nx.intro, () => { render(); checkStory(done); }, nx); else fin(); } }], { title: '사명 완수' });
    }, ch);
    render();
  }
  function showStage(st, done) {
    openModal(`<div class="stage-card"><p class="eyebrow">하나님 나라 · ${st.lv}단계</p><h2>${esc(st.name)}</h2><p class="scripture">${esc(st.desc)}</p></div>`, [{ label: '계속', primary: true, fn: () => done && done() }], { title: '나라가 자라다' });
  }

  // ---------- 대화 ----------
  function speaker(who) {
    if (who === 'narr') return { name: '', narr: true };
    if (who === 'word') return { name: '여호와의 말씀', word: true };
    const P = S.player, F = fac(P);
    if (who === '@ruler') { const r = offById(F.ruler); return r ? { name: r.name, o: r } : { name: F.name, narr: true }; }
    if (who === '@advisor') { const a = S.offs.filter(o => o.alive && o.fac === P && o.id !== F.ruler).sort((x, y) => y.int - x.int)[0]; return a ? { name: a.name, o: a } : speaker('@ruler'); }
    const o = S.offs.find(x => x.name === who && x.alive) || S.offs.find(x => x.name === who);
    return o ? { name: o.name, o } : { name: who };
  }
  function playDialogue(lines, done, ch) {
    const box = $('#dialogue');
    if (!lines || !lines.length) return done && done();
    let i = 0, typing = null;
    box.hidden = false;
    const show = () => {
      const [who, text] = lines[i]; const sp = speaker(who);
      box.className = 'dialogue' + (sp.narr ? ' narr' : '') + (sp.word ? ' word' : '');
      $('#dlgBust').innerHTML = sp.o ? portraitOf(sp.o, true) : '';
      $('#dlgName').textContent = sp.narr ? (ch ? `${ch.title} · ${ch.ref}` : '') : sp.name;
      const t = $('#dlgText'); t.textContent = '';
      clearInterval(typing);
      if (reduceMotion) { t.textContent = text; return; }
      let k = 0; typing = setInterval(() => { k += 2; t.textContent = text.slice(0, k); if (k >= text.length) { clearInterval(typing); typing = null; } }, 18);
    };
    const next = () => {
      if (typing) { clearInterval(typing); typing = null; $('#dlgText').textContent = lines[i][1]; return; }
      i++; if (i >= lines.length) { close(); return; } show();
    };
    const close = () => { clearInterval(typing); box.hidden = true; box.onclick = null; $('#dlgSkip').onclick = null; done && done(); };
    box.onclick = e => { if (e.target.closest('#dlgSkip')) return; next(); };
    $('#dlgSkip').onclick = e => { e.stopPropagation(); close(); };
    show();
  }

  // ---------- 하단 메뉴 화면 ----------
  function grade(o) { const t = o.war + o.int + o.pol + o.cha + o.fai; return t >= 400 ? ['명장', 'g-gold'] : t >= 330 ? ['용장', 'g-purple'] : ['장수', 'g-blue']; }
  function roleName(o) { const r = window.PORTRAIT ? PORTRAIT.roleOf(o, fac(o.fac || S.player) && o.fac && fac(o.fac).ruler === o.id) : 'elder'; return { king: '군주', philking: '군주', priest: '제사장', prophet: '선지자', warrior: '무장', phil: '무장', egypt: '군주', woman: '책사', elder: o.int >= o.war ? '책사' : '무장' }[r] || '장수'; }
  function skills(o) {
    const s = [];
    if (o.war >= 90) s.push(['돌격', 5]); else if (o.war >= 80) s.push(['용맹', 3]);
    if (o.int >= 88) s.push(['신산', 5]); else if (o.int >= 75) s.push(['계략', 3]);
    if (o.fai >= 92) s.push(['기도', 5]); else if (o.fai >= 80) s.push(['경건', 3]);
    if (o.cha >= 88) s.push(['인덕', 4]); if (o.pol >= 85) s.push(['치세', 4]);
    return s.slice(0, 3);
  }
  function opower(o) { return o.war * 30 + o.int * 12 + o.pol * 5 + o.cha * 5 + o.fai * 8; }
  function heroScreen() {
    const list = S.offs.filter(o => o.alive && o.fac === S.player).sort((a, b) => opower(b) - opower(a));
    openModal(`<div class="hero-grid">${list.map(o => { const g = grade(o); return `<button class="hcard ${g[1]}" data-hero="${o.id}"><span class="hc-img">${portraitOf(o)}</span><span class="hc-grade">${g[0]}</span><b>${esc(o.name)}</b><small>${CITY_INFO[o.city].name} · ${o.done ? '완료' : '대기'}</small><span class="hc-pw"><i>${ICON.troop}</i>${fmt(opower(o))}</span></button>`; }).join('')}</div>
      <p class="mute">장수를 누르면 능력치와 기록을 볼 수 있습니다.</p>`, [{ label: '인물 도감', fn: showRoster }], { title: `영웅 · ${list.length}명`, wide: true });
  }
  function showBio(id) {
    const o = offById(id); const g = grade(o);
    const bar = (k, v) => `<div class="sbar"><span>${k}</span><div><i style="width:${v}%"></i></div><b>${v}</b></div>`;
    $('#heroView').innerHTML = `<div class="hv-art">${portraitOf(o, true)}</div>
      <div class="hv-panel">
        <div class="hv-head"><span class="hv-grade ${g[1]}">${g[0][0]}<br>${g[0][1]}</span><h2>${esc(o.name)}</h2><span class="hv-role">${roleName(o)}</span><span class="hv-fac">${esc(facName(o.fac))}${o.alive ? '' : ' · 사망'}</span></div>
        ${bar('무력', o.war)}${bar('지력', o.int)}${bar('정치', o.pol)}${bar('매력', o.cha)}${bar('신앙', o.fai)}
        <div class="hv-skills">${skills(o).map(([n, l], i) => `<span class="${i === 1 ? 'on' : ''}"><b>${n}</b><em>${l}</em></span>`).join('')}</div>
        <p class="hv-desc">${esc(o.desc)} <span class="mute">${esc(o.ref)}</span></p>
        <p class="hv-close">화면을 누르면 닫힙니다</p>
      </div>`;
    $('#heroView').hidden = false;
  }
  function warScreen() {
    const P = S.player, rows = [];
    Object.values(S.cities).forEach(c => { if (c.owner === P) return; if ((ADJ[c.id] || []).some(n => city(n).owner === P)) rows.push(c); });
    rows.sort((a, b) => defPower(a) - defPower(b));
    openModal(rows.length ? `<ul class="war-list">${rows.map(c => { const src = bestSource(c.id); return `<li><span class="fbadge" style="--fc:${c.owner ? fac(c.owner).color : '#8d877a'}">${c.owner ? esc(fac(c.owner).name[0]) : '·'}</span>
      <div><b>${CITY_INFO[c.id].name}</b><small>${c.owner ? esc(fac(c.owner).name) : '주인 없음'} · 병력 ${fmt(c.soldiers)} · 성벽 ${c.def}</small></div>
      <span class="pw">${fmt(Math.round(defPower(c) * 1.3))}</span><button class="btn ${src ? 'primary' : ''}" data-target="${c.id}">${src ? '정벌' : '정찰'}</button></li>`; }).join('')}</ul>` : '<p>맞닿은 적의 성이 없습니다.</p>', [], { title: '출전', wide: true });
    $('#modalBody').querySelectorAll('[data-target]').forEach(b => b.addEventListener('click', () => { const t = b.dataset.target; closeModal(); sel = t; render(); cityPopup(t); }));
  }
  function storyScreen() {
    const ch = curChapter(), all = chain();
    openModal(`${ch ? `<div class="quest-card"><p class="eyebrow">제${S.story.ch + 1}장 · ${esc(ch.ref)}</p><h2>${esc(ch.title)}</h2>
      <p class="q-goal">${esc(ch.goal.text)} <em>(${progress(ch.goal).cur}/${progress(ch.goal).n})</em></p>
      <div class="rewards"><p class="rw-title">보상</p><div class="rw-row"><span class="rw"><i>${ICON.king}</i><b>+${ch.reward.k}</b><small>나라</small></span>
      ${ch.reward.gold ? `<span class="rw"><i>${ICON.gold}</i><b>${fmt(ch.reward.gold)}</b><small>금</small></span>` : ''}${ch.reward.food ? `<span class="rw"><i>${ICON.food}</i><b>${fmt(ch.reward.food)}</b><small>식량</small></span>` : ''}</div></div></div>` : '<p>모든 사명을 이루었습니다.</p>'}
      <ol class="ch-list">${all.map((c, i) => `<li class="${i < S.story.ch ? 'done' : i === S.story.ch ? 'now' : ''}"><b>${esc(c.title)}</b><small>${esc(c.ref)}</small>${i <= S.story.ch ? `<button class="btn" data-replay="${i}">대화 보기</button>` : ''}</li>`).join('')}</ol>`,
      ch ? [{ label: '가기', primary: true, fn: () => { const t = storyTarget(); if (t) { const ci = CITY_INFO[t]; VB.x = ci.x - VB.w / 2; VB.y = ci.y - VB.h / 2; clampView(); sel = t; render(); } } }] : [], { title: '사명' });
    $('#modalBody').querySelectorAll('[data-replay]').forEach(b => b.addEventListener('click', () => { const c = all[+b.dataset.replay]; closeModal(); playDialogue(c.intro.concat(+b.dataset.replay < S.story.ch ? c.outro : []), null, c); }));
  }
  function logScreen() {
    openModal(`<ul id="log" class="log">${S.log.slice(0, 80).map(l => `<li class="${l.kind}"><time>${l.t}</time>${esc(l.msg)}</li>`).join('')}</ul>`, [], { title: '연대기' });
  }
  function nationScreen() {
    const sc = scn(), P = S.player, ks = kStage();
    const next = ks.next ? ks.next[0] : 100;
    const facsRows = Object.values(S.facs).filter(f => f.alive).map(f => `<tr class="${f.id === P ? 'me' : ''}"><td><span class="fbadge" style="--fc:${f.color}">${esc(f.name[0])}</span>${esc(f.name)}</td><td>${citiesOf(f.id).length}</td><td>${fmtK(citiesOf(f.id).reduce((s, c) => s + c.soldiers, 0))}</td><td>${fmt(power(f.id))}</td><td>${f.id === P ? '—' : getRel(P, f.id) + (allied(P, f.id) ? ' 동맹' : '')}</td></tr>`).join('');
    openModal(`<div class="kingdom"><p class="eyebrow">하나님 나라 · ${ks.lv}단계</p><h2>${esc(ks.name)}</h2><p class="mute">${esc(ks.desc)}</p>
      <div class="kbar"><i style="width:${S.story.kingdom}%"></i></div><p class="kinfo">${S.story.kingdom} / 100 ${ks.next ? `· 다음 단계 '${esc(ks.next[1])}'까지 ${Math.max(0, next - S.story.kingdom)}` : ''}</p>
      <p class="mute">사명을 이루고, 구휼을 베풀고, 포로를 너그럽게 풀어주면 나라가 자랍니다. 처형과 우상은 나라를 무너뜨립니다.</p></div>
      <p><b>시나리오 목표</b> — ${esc((sc.goalText && sc.goalText[P]) || '가나안의 열여덟 성을 차지한다.')}</p>
      <div class="tablewrap"><table class="roster"><thead><tr><th>세력</th><th>성</th><th>병력</th><th>전투력</th><th>관계</th></tr></thead><tbody>${facsRows}</tbody></table></div>`,
      [{ label: '외교', fn: () => diploDialog(fac(P).capital) }, { label: `그림체: ${artStyle() === 'real' ? '실사' : '웹툰'}`, keep: true, fn: () => { setArtStyle(artStyle() === 'real' ? 'webtoon' : 'real'); render(); nationScreen(); toast(`그림체를 ${artStyle() === 'real' ? '실사' : '웹툰'}로 바꿨습니다.`); } }, { label: '도움말', fn: showHelp }, { label: '저장·불러오기', primary: true, fn: () => saveDialog('save') }, { label: '처음으로', danger: true, fn: showTitle }], { title: `${fac(P).name} · 국가`, wide: true });
  }
  function showHelp() {
    openModal(`<ul class="help">
      <li>내 성을 누르면 <b>3D 성 안</b>으로 들어가 장수에게 명령합니다. 적의 성을 누르면 <b>정벌</b> 창이 열립니다.</li>
      <li>장수 한 명은 한 계절에 명령 하나. 모두 마쳤으면 <b>턴 종료</b>.</li>
      <li>가을에 농업만큼 식량을 거두고, 계절마다 상업만큼 금이 들어옵니다. 병사는 계절마다 식량을 먹습니다.</li>
      <li><b>신앙</b>이 높으면 전투 사기가 오르고 민심이 따라옵니다. 계절마다 식으니 <b>제사</b>로 지키세요.</li>
      <li>하단의 <b>사명</b>을 따라가면 인물들의 대화와 함께 하나님 나라가 자랍니다.</li>
      <li>지도는 끌어서 옮기고, 휠이나 두 손가락으로 확대합니다. 미니맵을 누르면 전체 지도로 돌아갑니다.</li></ul>`, [], { title: '도움말' });
  }

  // ---------- 모달 ----------
  function openModal(html, buttons = [], opts = {}) {
    const m = $('#modal');
    $('#modalTitle').textContent = opts.title || '';
    $('#modalHead').hidden = !opts.title;
    m.querySelector('.dlg').classList.toggle('wide', !!opts.wide);
    $('#modalBody').innerHTML = html;
    const bar = $('#modalBtns'); bar.innerHTML = '';
    buttons.forEach(b => {
      const el = document.createElement('button');
      el.className = 'btn' + (b.primary ? ' primary' : '') + (b.danger ? ' danger' : '');
      el.textContent = b.label;
      el.addEventListener('click', () => { if (b.keep) { b.fn(); return; } closeModal(); b.fn && b.fn(); });
      bar.appendChild(el);
    });
    if ((!buttons.length || opts.cancel) && !opts.title) {
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
      `<button class="pick" data-o="${o.id}"><span class="thumb">${portraitOf(o)}</span><b>${esc(o.name)}</b><span>${STAT_NAME[stat]} ${o[stat]}</span></button>`).join('')}</div>`, [], { cancel: true });
    $('#modalBody').querySelectorAll('.pick').forEach(b => b.addEventListener('click', () => { closeModal(); then(offById(b.dataset.o)); }));
  }

  function onCmd(key) {
    const cid = sel;
    if (CMDS[key]) {
      const C = CMDS[key];
      pickOfficer(cid, C.stat, `${C.label} — ${CITY_INFO[cid].name}`, o => {
        const r = doCmd(S.player, o, cid, key);
        if (r.ok) {
          log(`${CITY_INFO[cid].name}: ${o.name}의 ${C.label} — ${r.msg}`);
          S.story.counts[key] = (S.story.counts[key] || 0) + 1;
          if (key === 'relief') addKingdom(1); if (key === 'worship') addKingdom(0.5);
        }
        if (r.ok && hooks.onCommand && hooks.onCommand(o, cid, key, r)) { render(); return; }
        toast(r.ok ? `${o.name}: ${r.msg}` : r.msg);
        render(); if (r.ok) checkStory();
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

  function attackDialog(cid, pre) {
    const P = S.player, c = city(cid);
    const targets = (ADJ[cid] || []).filter(n => city(n).owner !== P);
    const offs = idleOffs(cid);
    if (!targets.length) { toast('맞닿은 적의 성이 없습니다.'); return; }
    if (!offs.length) { toast('출진할 장수가 없습니다.'); return; }
    if (c.soldiers < 500) { toast('병력이 500명 이상 있어야 출진할 수 있습니다.'); return; }
    openModal(`<h2>출진 — ${CITY_INFO[cid].name}</h2>
      <label class="fld" for="atTo">공격할 성</label>
      <select id="atTo">${targets.map(t => { const tc = city(t); const w0 = tc.owner ? (allied(P, tc.owner) ? ' · 동맹!' : peaceBlocks(P, tc.owner) ? ' · 휴전 중' : '') : ''; const w = w0; return `<option value="${t}" ${t === pre ? 'selected' : ''}>${CITY_INFO[t].name} — ${tc.owner ? esc(fac(tc.owner).name) : '주인 없음'} ${fmt(tc.soldiers)}명 · 성벽 ${tc.def}${w}</option>`; }).join('')}</select>
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
      } }], { cancel: true, title: `출진 · ${CITY_INFO[cid].name}` });
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
    if (!caps.length) { render(); checkEnd(); checkStory(); return; }
    const o = caps.shift();
    const P = S.player, ruler = offById(fac(P).ruler);
    const wasRuler = o.fac && exists(o.fac) && fac(o.fac).ruler === o.id;
    const chance = clamp(35 + ((ruler ? ruler.cha : 60) - 60) / 2 - (wasRuler ? 30 : 0) + (o.fai > 80 && avgFaith(P) > 60 ? 15 : 0), 5, 90);
    const from = o.fac;
    const after = () => { if (wasRuler && o.fac !== from) succession(from); render(); captiveDialog(caps); };
    openModal(`<div class="bio-portrait">${portraitOf(o)}</div><p class="eyebrow">포로</p><h2>${esc(o.name)}</h2><p>${esc(o.desc)} <span class="mute">${esc(o.ref)}</span></p>
      <p class="st">무${o.war} 지${o.int} 정${o.pol} 매${o.cha} 신${o.fai} · ${esc(facName(o.fac))}${wasRuler ? ' 군주' : ''}</p><p class="mute">등용 성공 가능성 약 ${Math.round(chance)}%</p>`, [
      { label: '등용한다', primary: true, fn: () => {
        if (Math.random() * 100 < chance) { o.fac = P; o.city = sel; o.done = true; log(`${o.name}이(가) 우리 편이 되었다.`, 'gold'); toast(`${o.name} 등용 성공!`); }
        else { releaseTo(o); log(`${o.name}이(가) 등용을 거절하고 떠났다.`); toast(`${o.name}이(가) 거절했습니다.`); }
        after();
      } },
      { label: '풀어준다', fn: () => { releaseTo(o); addKingdom(2, '자비를 베풀었다'); setRel(P, from || P, getRel(P, from || P) + 10); citiesOf(P).forEach(c => { c.loy += 2; fixCity(c); }); log(`${o.name}을(를) 너그러이 풀어주었다.`); after(); } },
      { label: '처형한다', danger: true, fn: () => { killOfficer(o); addKingdom(-4, '피를 흘렸다'); citiesOf(P).forEach(c => { c.loy -= 3; fixCity(c); }); after(); } },
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

  function showRoster() {
    const rows = S.offs.slice().sort((a, b) => (a.fac === S.player ? -1 : 0) - (b.fac === S.player ? -1 : 0) || (a.fac || 'zz').localeCompare(b.fac || 'zz'));
    openModal(`<h2>인물 도감</h2><p class="mute">${esc(scn().title)} · ${esc(scn().ref)}</p><div class="tablewrap"><table class="roster"><thead><tr><th>이름</th><th>세력</th><th>위치</th><th>무</th><th>지</th><th>정</th><th>매</th><th>신</th></tr></thead><tbody>${
      rows.map(o => `<tr class="${o.alive ? '' : 'dead'}"><td><button class="oname" data-bio="${o.id}">${esc(o.name)}</button></td><td>${o.alive ? esc(facName(o.fac)) : '사망'}</td><td>${CITY_INFO[o.city].name}</td><td>${o.war}</td><td>${o.int}</td><td>${o.pol}</td><td>${o.cha}</td><td>${o.fai}</td></tr>`).join('')
    }</tbody></table></div>`, []);
  }

  // ---------- 타이틀 ----------
  function showTitle() {
    closeModal();
    const saved = latestSave();
    const t = $('#title');
    if (window.TOWN) TOWN.exit(true);
    t.hidden = false;
    $('#app').hidden = true;
    const A = { '@title': artKey('@title'), '@conquest': artKey('@conquest'), '@david': artKey('@david'), '@divided': artKey('@divided') };
    let h = `<div class="title-art" style="${A['@title'] ? `background-image:url('${A['@title']}')` : ''}"></div>
      <div class="title-inner">
      <p class="eyebrow">성경 역사 전략 시뮬레이션</p>
      <h1>성경 삼국지</h1>
      <p class="lede">여호수아의 정복에서 다윗의 통일, 왕국의 분열까지. 인물들과 대화하며 성을 다스리고, 칼이 아닌 언약 위에 하나님 나라를 세워 간다.</p>
      <div class="title-btns">${saved ? `<button class="gbtn" id="contBtn"><span>이어하기</span><small>${esc(SCENARIOS.find(x => x.id === saved.scn).title)} · ${esc(saved.facName)} · BC ${saved.year}년 ${SEASONS[saved.season] || ''} · ${saved.turn}턴</small></button>` : ''}
      <button class="btn" id="loadBtn">불러오기</button></div>
      <h2 class="sec">시나리오</h2><div class="scns">`;
    SCENARIOS.forEach(sc => {
      const main = sc.factions.filter(f => STORY[sc.id] && STORY[sc.id][f.id]), rest = sc.factions.filter(f => !main.includes(f));
      const fb = f => `<button class="facbtn${main.includes(f) ? ' story' : ''}" data-scn="${sc.id}" data-fac="${f.id}" style="--fc:${f.color}"><i>${esc(f.name[0])}</i><b>${esc(f.name)}</b><small>${esc(f.ruler)} · ${Object.keys(f.cities).length}성${main.includes(f) ? ' · 스토리' : ''}</small></button>`;
      h += `<article class="scn"><div class="scn-art" style="${A['@' + sc.id] ? `background-image:url('${A['@' + sc.id]}')` : ''}"><span class="yr">BC ${sc.year}</span><h3>${esc(sc.title)}</h3><span class="ref">${esc(sc.ref)}</span></div>
        <p>${esc(sc.intro)}</p><div class="facs">${main.map(fb).join('')}
          <details><summary>다른 세력으로 시작</summary><div class="facs">${rest.map(fb).join('')}</div></details>
        </div></article>`;
    });
    h += `</div><p class="foot">인물과 사건은 성경 기록을 바탕으로 요약·각색했습니다. 능력치와 전투 결과, 인물 일러스트는 창작입니다.</p></div>`;
    t.innerHTML = h;
    t.querySelectorAll('.facbtn').forEach(b => b.addEventListener('click', () => confirmStart(b.dataset.scn, b.dataset.fac)));
    const cb = $('#contBtn'); if (cb) cb.addEventListener('click', () => loadData(saved.data));
    $('#loadBtn').addEventListener('click', () => saveDialog('load'));
  }
  function migrate() {
    if (!S.story) { S.story = { ch: 0, counts: {}, base: citiesOf(S.player).length, done: [], kingdom: 10 }; }
    S.offs.forEach(o => { if (o.origin === undefined) o.origin = o.fac; });
  }

  function confirmStart(scnId, facId) {
    const sc = SCENARIOS.find(x => x.id === scnId), f = sc.factions.find(x => x.id === facId);
    const ruler = sc.officers.find(r => r[0] === f.ruler);
    const fakeO = ruler ? { name: ruler[0], war: ruler[1], int: ruler[2], pol: ruler[3], cha: ruler[4], fai: ruler[5], fac: null, origin: facId, desc: ruler[8] } : null;
    const url = fakeO && (artKey(scnId + ':' + fakeO.name) || artKey(fakeO.name));
    const art = fakeO ? `<div class="cs-art">${window.PORTRAIT ? PORTRAIT.portrait(fakeO, { color: f.color, ruler: true }) : ''}${url ? `<img src="${url}" alt="" onerror="this.remove()">` : ''}</div>` : '';
    openModal(`<div class="confirm-start">${art}<div><p class="eyebrow">BC ${sc.year} · ${esc(sc.title)}</p><h2 style="color:${f.color}">${esc(f.name)}</h2><p>${esc(f.desc)}</p>
      <p class="mute">군주 ${esc(f.ruler)} · 도읍 ${CITY_INFO[f.capital].name} · 금 ${fmt(f.gold)} · 식량 ${fmt(f.food)}</p>
      <p><b>목표</b> — ${esc((sc.goalText && sc.goalText[facId]) || '가나안의 열여덟 성을 차지한다.')}</p>
      <p class="mute">${STORY[scnId] && STORY[scnId][facId] ? `스토리 사명 ${STORY[scnId][facId].length}장` : '일반 사명 4장'}</p></div></div>`,
      [{ label: '이 세력으로 시작', primary: true, fn: () => { newGame(scnId, facId); VB = null; startPlay(true); autosave(); } }], { title: '세력 선택' });
  }

  function startPlay(fresh) {
    $('#title').hidden = true;
    $('#app').hidden = false;
    render();
    if (fresh) {
      const sc = scn(), ch = curChapter();
      playDialogue([['narr', sc.intro]].concat(ch ? ch.intro : []), () => { render(); runEvents(() => checkStory()); }, ch ? { title: `제1장 ${ch.title}`, ref: ch.ref } : { title: sc.title, ref: sc.ref });
    }
  }

  // ---------- 입력 ----------
  function bind() {
    bindPanZoom();
    $('#map').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const g = e.target.closest('.city'); if (g) { e.preventDefault(); onCityTap(g.dataset.id); } } });
    $('#modalBody').addEventListener('click', e => { const bio = e.target.closest('[data-bio]'); if (bio) showBio(bio.dataset.bio); const hc = e.target.closest('[data-hero]'); if (hc) showBio(hc.dataset.hero); });
    $('#modalClose').addEventListener('click', closeModal);
    $('#heroView').addEventListener('click', () => { $('#heroView').hidden = true; });
    $('#endTurn').addEventListener('click', askEndTurn);
    $('#lordBtn').addEventListener('click', () => { const r = offById(fac(S.player).ruler); if (r) showBio(r.id); });
    $('#questBtn').addEventListener('click', storyScreen);
    $('#questText').addEventListener('click', storyScreen);
    document.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => {
      const n = b.dataset.nav;
      if (n === 'land') { const cap = fac(S.player).capital; if (window.TOWN) { sel = cap; render(); TOWN.enter(cap); } }
      else if (n === 'hero') heroScreen(); else if (n === 'war') warScreen(); else if (n === 'story') storyScreen(); else if (n === 'log') logScreen(); else if (n === 'nation') nationScreen();
    }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#heroView').hidden) $('#heroView').hidden = true; else if (!$('#modal').hidden && !$('#modalHead').hidden) closeModal(); } });
  }
  function askEndTurn() {
    const idle = S.offs.filter(o => o.alive && o.fac === S.player && !o.done).length;
    if (idle) openModal(`<p>아직 명령을 받지 않은 장수가 <b>${idle}명</b> 있습니다. 이대로 계절을 넘길까요?</p>`, [{ label: '턴 종료', primary: true, fn: endTurn }], { title: '턴 종료' });
    else endTurn();
  }

  window.GAME = {
    get S() { return S; }, get sel() { return sel; }, set sel(v) { sel = v; },
    hooks, city, fac, offById, offsIn, freeIn, citiesOf, CITY_INFO, ADJ, CMDS, STAT_NAME,
    onCmd, askEndTurn, render, showBio, toast, portraitOf, avgFaith, facName, yearLabel, fmt, esc, idleOffs, checkStory, playDialogue,
    SEASONS,
  };
  bind();
  const flush = () => { if (S && !$('#app').hidden) { clearTimeout(autoTimer); writeSlot('auto'); } };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  showTitle();
})();
