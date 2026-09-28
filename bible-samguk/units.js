// 성경 삼국지 — 병종: 창병·보병·궁수·물매병·기마·전차·코끼리·낙타의 상성과 세력별 편성.
// game.js(자동 전투·출진 창)와 tactics.js(전술 전투)가 함께 쓴다. game.js보다 먼저 불러온다.
(() => {
  'use strict';
  // mv 이동력 · rng 사거리 · atk/def 기본 공격·방어 배율 · cls 계통(foot 보병 · shot 원거리 · horse 말 · beast 큰 짐승)
  // gold: 출진 1명당 금(유지비) · camp: 필요한 병영 레벨
  const TYPES = {
    spear: { n: '창병', tag: '창', mv: 4, rng: 1, atk: 1.0, def: 1.1, cls: 'foot', camp: 0, gold: 0, col: '#8fb4ff', desc: '긴 창으로 말과 전차를 막는다 · 기마·전차·낙타에 강함' },
    foot: { n: '보병', tag: '보', mv: 4, rng: 1, atk: 1.1, def: 1.0, cls: 'foot', camp: 0, gold: 0, col: '#c9d3e6', desc: '칼과 큰 방패 · 궁수·물매병을 붙잡으면 강하다' },
    archer: { n: '궁수', tag: '궁', mv: 3, rng: 3, atk: 0.9, def: 0.8, cls: 'shot', camp: 1, gold: 0, col: '#9be07a', desc: '사거리 3 · 느린 보병·코끼리를 멀리서 쏜다 · 기마에 약함' },
    sling: { n: '물매병', tag: '물', mv: 3, rng: 2, atk: 1.0, def: 0.85, cls: 'shot', camp: 0, gold: 0, col: '#d8e07a', desc: '사거리 2 · 보병에 강함, 첫 두 턴 +20% (삿 20:16)' },
    cavalry: { n: '기마', tag: '기', mv: 6, rng: 1, atk: 1.15, def: 0.95, cls: 'horse', camp: 3, gold: 1 / 40, col: '#ffb070', desc: '이동 6 · 궁수·물매병을 짓밟는다 · 창병·낙타에 약함' },
    chariot: { n: '전차병', tag: '전', mv: 6, rng: 1, atk: 1.2, def: 1.0, cls: 'horse', camp: 5, gold: 1 / 20, col: '#ffd060', desc: '평지 돌격 +25%, 숲·언덕 -25% · 창병에 약함' },
    elephant: { n: '코끼리', tag: '象', mv: 3, rng: 1, atk: 1.45, def: 1.35, cls: 'beast', camp: 6, gold: 1 / 12, col: '#d6b8ff', desc: '가장 강한 돌격 · 말이 겁낸다 · 불을 보면 날뛰어 아군을 밟는다' },
    camel: { n: '낙타', tag: '낙', mv: 5, rng: 1, atk: 1.05, def: 1.0, cls: 'beast', camp: 3, gold: 1 / 50, col: '#f0c890', desc: '냄새로 적의 말을 놀라게 한다(기마·전차 -25%) · 궁수에 강함' },
    guard: { n: '수비대', tag: '수', mv: 3, rng: 1, atk: 0.95, def: 1.2, cls: 'foot', camp: 0, gold: 0, col: '#b0b8c8', desc: '성을 지키는 백성' },
    prophet: { n: '선지자', tag: '예', mv: 3, rng: 0, atk: 0, def: 0.8, cls: 'foot', camp: 0, gold: 0, col: '#fff0b0', desc: '싸우지 않고 기도한다' },
  };
  // 상성: VS[공격][수비] 배율 (없으면 1)
  const VS = {
    spear: { cavalry: 1.5, chariot: 1.6, camel: 1.3, elephant: 1.15 },
    foot: { archer: 1.3, sling: 1.3, spear: 1.15, guard: 1.1 },
    archer: { spear: 1.25, foot: 1.2, guard: 1.2, elephant: 1.3, cavalry: 0.8, chariot: 0.85, camel: 0.9 },
    sling: { spear: 1.2, foot: 1.15, guard: 1.2, archer: 1.1, cavalry: 0.85 },
    cavalry: { archer: 1.55, sling: 1.55, prophet: 1.3, foot: 1.05, spear: 0.7, camel: 0.75, elephant: 0.7 },
    chariot: { archer: 1.4, sling: 1.4, foot: 1.2, guard: 1.1, spear: 0.65, camel: 0.75, elephant: 0.7 },
    elephant: { cavalry: 1.4, chariot: 1.4, foot: 1.25, spear: 1.1, guard: 1.3, camel: 1.2 },
    camel: { cavalry: 1.45, chariot: 1.4, archer: 1.3, sling: 1.25, spear: 0.8 },
    guard: {},
  };
  const vs = (a, d) => (VS[a] && VS[a][d]) || 1;

  // ---------- 세력별 편성 ----------
  // 모두가 창병·보병을 쓴다. 여기에는 그 세력만의 병종을 적는다 (앞쪽이 주력).
  const BASE = ['spear', 'foot'];
  const BY_SCN = {
    patriarchs: { abraham: ['sling', 'camel'], gerar: ['archer'], salem: ['sling'], sodom: ['archer'], east: ['archer', 'camel', 'chariot'], hamor: ['sling'], edom: ['archer', 'camel'] },
    conquest: { israel: ['sling', 'archer'], jericho: ['archer'], south: ['archer', 'sling'], north: ['chariot', 'archer'], philistia: ['chariot', 'archer'], moab: ['archer', 'camel'], ammon: ['archer', 'camel'], edom: ['archer', 'camel'], aram: ['chariot', 'cavalry', 'archer'], tyre: ['archer', 'sling'] },
    judges: { israel: ['sling', 'archer'], aram: ['chariot', 'archer'], moab: ['archer'], canaan: ['chariot', 'archer'], midian: ['camel', 'archer'], ammon: ['archer', 'camel'], philistia: ['chariot', 'archer'], jebus: ['archer', 'sling'], tyre: ['archer'] },
    saul: { israel: ['sling', 'archer'], philistia: ['chariot', 'archer', 'cavalry'], ammon: ['archer', 'camel'], amalek: ['camel', 'archer'], moab: ['archer'], edom: ['archer', 'camel'], aram: ['chariot', 'cavalry'], tyre: ['archer'], jebus: ['archer', 'sling'] },
    david: { judah: ['sling', 'archer'], israel: ['archer', 'sling'], philistia: ['chariot', 'archer'], jebus: ['archer', 'sling'], moab: ['archer'], ammon: ['archer', 'chariot'], edom: ['archer', 'camel'], aram: ['chariot', 'cavalry', 'archer'], tyre: ['archer'] },
    divided: { judah: ['archer', 'sling', 'chariot'], israel: ['chariot', 'archer', 'cavalry'], egypt: ['chariot', 'archer'], philistia: ['archer', 'chariot'], aram: ['chariot', 'cavalry', 'archer'], moab: ['archer'], ammon: ['archer', 'camel'], edom: ['archer', 'camel'], tyre: ['archer'] },
    maccabees: { judea: ['sling', 'archer', 'cavalry'], seleucid: ['elephant', 'cavalry', 'archer'], idumea: ['archer', 'camel'], ammon: ['archer', 'cavalry'], nabatea: ['camel', 'archer', 'cavalry'], coast: ['archer', 'cavalry'], tyre: ['archer', 'sling'] },
  };
  // 새로 생기는 세력(다른 시나리오·반란)은 이름으로 짐작한다
  const BY_NAME = [
    [/앗수르|아시리아|니느웨/, ['chariot', 'cavalry', 'archer']],
    [/바벨론|갈대아|느부갓네살/, ['chariot', 'archer', 'cavalry']],
    [/헷|히타이트/, ['chariot', 'archer']],
    [/로마|카이사르|폼페이/, ['foot', 'cavalry', 'archer']],
    [/프톨레마이오스|톨레미|알렉산드리아/, ['elephant', 'cavalry', 'chariot']],
    [/셀레우코스|수리아|안디옥|마게도냐|헬라/, ['elephant', 'cavalry', 'archer']],
    [/파르티아|바대/, ['cavalry', 'camel', 'archer']],
    [/페르시아|바사|메대|엘람/, ['cavalry', 'archer', 'chariot']],
    [/애굽|이집트|바로/, ['chariot', 'archer']],
    [/아람|다메섹|소바/, ['chariot', 'cavalry']],
    [/블레셋|가드|가사|아스돗/, ['chariot', 'archer']],
    [/미디안|아말렉|나바티아|이스마엘|아라비아|게달|스바/, ['camel', 'archer']],
    [/에돔|이두매|모압|암몬/, ['archer', 'camel']],
    [/두로|시돈|해안/, ['archer', 'sling']],
    [/이스라엘|유다|하스몬|지파|마카비/, ['sling', 'archer']],
  ];
  // 마하나임 — 하나님의 군대(세력 id 'army'): 시대마다 병종이 자란다
  // 족장: 창·활·낙타(종들) → 출애굽·사사: 창·물매·활 → 통일 왕국: 솔로몬의 병거·마병 → 분열·중간기: 창·활·기마·전차
  const GOD_ARMY = [['archer', 'camel'], ['sling', 'archer'], ['sling', 'archer'], ['sling', 'archer'], ['archer', 'sling', 'chariot', 'cavalry'], ['archer', 'cavalry', 'chariot'], ['archer', 'cavalry', 'chariot']];
  // 새 시대 시나리오의 나라별 세력 id
  const BY_ID = {
    egypt: ['chariot', 'archer'], amalek: ['camel', 'archer'], edom: ['archer', 'camel'], moab: ['archer', 'camel'], ammon: ['archer', 'camel'],
    philistia: ['chariot', 'archer'], canaan: ['chariot', 'archer'], amorite: ['archer', 'chariot'], midian: ['camel', 'archer'], arab: ['camel', 'archer'],
    aram: ['chariot', 'cavalry', 'archer'], assyria: ['cavalry', 'chariot', 'archer'], babylon: ['chariot', 'cavalry', 'archer'], persia: ['cavalry', 'archer', 'chariot'],
    elam: ['archer', 'cavalry'], greece: ['cavalry', 'archer'], pella: ['cavalry', 'archer'], ptolemy: ['elephant', 'cavalry', 'chariot'], seleucid: ['elephant', 'cavalry', 'archer'],
    rome: ['foot', 'cavalry', 'archer'], israel_n: ['chariot', 'archer', 'cavalry'], hittite: ['chariot', 'archer'], nabatea: ['camel', 'archer', 'cavalry'],
  };
  function special(f) {
    const S = window.GAME && GAME.S; if (!S || !f) return ['archer', 'sling'];
    const s = BY_SCN[S.scn] && BY_SCN[S.scn][f]; if (s) return s;
    const F = S.facs[f], nm = F ? F.name || '' : '';
    if (f === 'army' || f === 'mahanaim' || /마하나임|하나님의 군대/.test(nm)) return GOD_ARMY[window.WORDS ? WORDS.era(S.scn) : 4];
    if (BY_ID[f]) return BY_ID[f];
    for (const [re, list] of BY_NAME) if (re.test(nm)) return list;
    return ['archer', 'sling'];
  }
  // 세력이 쓸 수 있는 병종 (창병·보병 + 고유 병종)
  const avail = f => BASE.concat(special(f).filter(t => !BASE.includes(t)));
  // 대표 병종 (고유 병종 중 첫째)
  const signature = f => special(f)[0] || 'spear';

  // 장수 성향으로 병종을 고른다. 무력 높으면 돌격 병종, 지력 높으면 원거리. 겹치지 않게 나눠 준다.
  function assign(f, offs, opts = {}) {
    const av = avail(f), used = [], out = {};
    const shock = av.filter(t => ['elephant', 'chariot', 'cavalry', 'camel'].includes(t));
    const shot = av.filter(t => TYPES[t].cls === 'shot');
    offs.forEach((o, i) => {
      let t;
      if (o.int > o.war + 8 && shot.length) t = shot.find(x => !used.includes(x)) || shot[0];
      else if (i === 0 && shock.length && !opts.siege) t = shock[0];
      else if (i === 1 && shot.length) t = shot.find(x => !used.includes(x)) || shot[0];
      else if (i === 2 && shock.length > 1 && !opts.siege) t = shock[1];
      else t = used.includes('spear') ? (shot[0] && !used.includes(shot[0]) ? shot[0] : 'foot') : 'spear';
      if (opts.siege && TYPES[t].cls !== 'shot' && i > 0 && shot.length && !used.some(x => TYPES[x].cls === 'shot')) t = shot[0];
      used.push(t); out[o.id] = t;
    });
    return out;
  }

  // 자동 전투용: 두 편 병종 구성 비교로 전력 배율(0.8~1.25)과 설명 한 줄
  // comp: [{t, n}] (병종과 병력)
  function matchup(ac, dc, flat, siege) {
    const tot = a => a.reduce((s, x) => s + x.n, 0) || 1;
    const terr = t => {
      const c = TYPES[t].cls;
      if (siege) return c === 'shot' ? 1.1 : c === 'horse' ? 0.8 : t === 'elephant' ? 0.9 : 1;
      if (t === 'chariot') return flat ? 1.25 : 0.8;
      if (c === 'horse' || t === 'elephant') return flat ? 1.1 : 0.9;
      return 1;
    };
    let ak = 0, dk = 0; const TA = tot(ac), TD = tot(dc);
    ac.forEach(a => dc.forEach(d => { const w = a.n / TA * d.n / TD; ak += w * vs(a.t, d.t) * TYPES[a.t].atk * terr(a.t); dk += w * vs(d.t, a.t) * TYPES[d.t].atk * terr(d.t); }));
    const k = Math.max(0.8, Math.min(1.25, Math.sqrt((ak || 1) / (dk || 1))));
    // 가장 두드러진 상성 한 줄
    let best = null;
    ac.forEach(a => dc.forEach(d => { const v = vs(a.t, d.t), u = vs(d.t, a.t); if (!best || Math.abs(v - u) > Math.abs(best.v - best.u)) best = { a: a.t, d: d.t, v, u }; }));
    let line = '';
    if (best && Math.abs(best.v - best.u) >= 0.2) line = best.v > best.u ? `⚔ 상성 유리 — 아군 ${TYPES[best.a].n}이(가) 적 ${TYPES[best.d].n}을(를) 압도한다.` : `⚠ 상성 불리 — 적 ${TYPES[best.d].n}이(가) 아군 ${TYPES[best.a].n}을(를) 누른다.`;
    return { k, line };
  }

  window.UNITDEF = { TYPES, VS, vs, avail, signature, special, assign, matchup, BY_SCN, BY_NAME, BY_ID, GOD_ARMY };
})();
