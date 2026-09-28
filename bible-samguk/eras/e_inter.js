// 성경 삼국지 — 시대: 신구약 중간 시대 (BC 538–63)
// 플레이어는 언제나 '하나님의 군대'(army). 바벨론에서 돌아온 백성이 예루살렘에서 일어나고, 스룹바벨·에스라·느헤미야에서
// 마카비 형제들까지 그 시대의 믿음의 사람들이 차례로 이끈다. 오백 년에 가까운 시대를 한 판으로 압축했다.
// 나라들의 흥망(바벨론 → 바사 → 알렉산더 → 프톨레마이오스·셀레우코스 → 로마)은 사건이 옮긴다 (G.rebel·G.transferAll).
// 아직 때가 이르지 않은 인물은 숨은 성(핫투사)에 '재야'로 두었다가 사건으로 무대에 올린다.
// 마카비서는 외경이다 — 역사 자료로만 쓰고 "(외경)"이라 표시했다.

// 신구약 중간 시대 이벤트 도우미
const INTER_KIT = {
  on: (G, cid) => !!G.city(cid),
  owns: (G, cid, f) => INTER_KIT.on(G, cid) && G.ownerOf(cid) === f,
  mine: (G, cid) => INTER_KIT.owns(G, cid, 'army'),
  live: (G, f) => G.exists(f) && G.cityCount(f) > 0,
  REBELS: ['알렉산더 대왕', '프톨레마이오스 1세', '셀레우코스 1세', '포필리우스 라이나스', '미트리다테스 1세'],
  names: () => SCENARIOS.find(s => s.id === 'e_inter').officers.map(r => r[0]).concat(INTER_KIT.REBELS),
  faithAll: (G, d, loy) => { if (G.exists('army')) G.eachCity('army', c => { c.faith += d; if (loy) c.loy += loy; }); },
  cut: (G, f, k, only) => { if (G.exists(f)) G.eachCity(f, c => { if (!only || only.includes(c.id)) c.soldiers = Math.floor(c.soldiers * k); }); },
  home: G => {
    if (!G.exists('army')) return null;
    const cap = G.fac('army').capital;
    if (INTER_KIT.mine(G, cap)) return G.city(cap);
    let best = null; G.eachCity('army', c => { if (!best || c.soldiers > best.soldiers) best = c; });
    return best;
  },
  add: (G, n) => { const c = INTER_KIT.home(G); if (c) c.soldiers += n; return !!c; },
  fixCap: (G, f) => {
    if (!G.exists(f)) return;
    const F = G.fac(f); if (INTER_KIT.owns(G, F.capital, f)) return;
    let best = null; G.eachCity(f, c => { if (!best || c.soldiers > best.soldiers) best = c; });
    if (best) F.capital = best.id;
  },
  prune: (G, f) => {
    if (!G.exists(f) || G.cityCount(f) > 0) return;
    G.fac(f).alive = false;
    INTER_KIT.names().forEach(n => { const o = G.o(n); if (o && o.alive && o.fac === f) o.fac = null; });
  },
  // 성 하나를 다른 세력에 넘긴다 (하나님의 군대의 성은 사건으로 빼앗지 않는다)
  give: (G, cid, f, sold) => {
    if (!INTER_KIT.on(G, cid) || !G.exists(f)) return false;
    const c = G.city(cid), prev = c.owner;
    if (prev === 'army' || prev === f) return false;
    c.owner = f; c.loy = Math.max(c.loy, 45); if (sold) c.soldiers = Math.max(c.soldiers, sold);
    if (prev) {
      INTER_KIT.fixCap(G, prev);
      const cap = G.exists(prev) && G.cityCount(prev) ? G.fac(prev).capital : null;
      INTER_KIT.names().forEach(n => { const o = G.o(n); if (o && o.alive && o.fac === prev && o.city === cid) { if (cap) o.city = cap; else o.fac = null; } });
      INTER_KIT.prune(G, prev);
    }
    return true;
  },
  giveAll: (G, list, from, to) => list.filter(cid => INTER_KIT.owns(G, cid, from) && INTER_KIT.give(G, cid, to)).length,
  // 세력 f의 모든 성과 장수를 to에게 (to가 없으면 아무것도 하지 않는다)
  absorb: (G, from, to) => { if (!G.exists(from) || !G.exists(to)) return 0; const n = G.cityCount(from); G.transferAll(from, to); INTER_KIT.fixCap(G, to); return n; },
  front: (G, f) => {
    const mine = []; if (G.exists('army')) G.eachCity('army', c => mine.push(c));
    const near = mine.filter(c => ROADS.some(([a, b]) => INTER_KIT.on(G, a) && INTER_KIT.on(G, b) &&
      ((a === c.id && G.ownerOf(b) === f) || (b === c.id && G.ownerOf(a) === f))));
    const pool = (near.length ? near : mine).sort((x, y) => x.soldiers - y.soldiers);
    return pool.length ? pool[0].id : null;
  },
  raid: (G, f, max, cid) => {
    if (!INTER_KIT.live(G, f) || !G.exists('army')) return '';
    INTER_KIT.fixCap(G, f);
    const t = cid && INTER_KIT.mine(G, cid) ? cid : INTER_KIT.front(G, f);
    if (!t) return '';
    const d = G.city(t).soldiers;
    return G.raid(f, t, Math.max(600, Math.min(max, Math.round(d * 1.15) + 1500)));
  },
  enter: (G, name, f = 'army', cid) => {
    if (!G.alive(name) || !G.exists(f)) return false;
    const cur = G.facOf(name);
    if (cur === f) return true;
    if (f !== 'army' && cur === 'army') return false;
    G.join(name, f, cid && INTER_KIT.owns(G, cid, f) ? cid : undefined);
    return true;
  },
  lead: (G, name, f = 'army') => { if (INTER_KIT.enter(G, name, f)) { G.setRuler(f, name); return true; } return false; },
  stat: (G, name, k, d) => { const o = G.o(name); if (o && o.alive) o[k] = Math.max(0, Math.min(100, o[k] + d)); },
  // 역사에서 조용히 물러난 인물 (죽음이 기록되지 않았거나 먼 훗날의 일)
  retire: (G, name) => {
    const o = G.o(name); if (!o || !o.alive) return false;
    if (o.fac && G.exists(o.fac) && G.fac(o.fac).ruler === o.id) { G.kill(name); return true; }
    o.alive = false; return true;
  },
  // 새 나라를 세운다 (G.rebel). 그 성의 주인이 하나님의 군대이면 세우지 않는다
  rise: (G, id, name, cands, row, color, aggr, gold, food) => {
    if (G.exists(id)) return true;
    const cid = cands.find(c => INTER_KIT.on(G, c) && !INTER_KIT.mine(G, c));
    if (!cid) return false;
    const prev = G.ownerOf(cid);
    G.rebel(id, name, cid, row.slice(0, 7).concat([cid], row.slice(8)));
    const F = G.fac(id); F.color = color; F.aggr = aggr; F.items = F.items || {};
    G.res(id, { gold, food, wood: 2000, stone: 1500 });
    if (prev) { INTER_KIT.fixCap(G, prev); INTER_KIT.prune(G, prev); }
    return true;
  },
};

SCENARIOS.push({
  id: 'e_inter',
  title: '신구약 중간 시대',
  year: 538,
  ref: '에스라; 느헤미야; 에스더; 학개; 스가랴; 말라기; 다니엘 5–12장; 요 10:22 · 역사 자료: 마카비1·2서(외경), 요세푸스',
  intro: '"바사 왕 고레스 원년에 여호와께서 예레미야의 입을 통하여 하신 말씀을 이루시려고" (스 1:1). 칠십 년의 포로 생활이 끝나고, 스룹바벨과 대제사장 여호수아가 이끄는 사만 이천여 명이 예루살렘에 돌아왔다(BC 538). 이 시대 마하나임 "하나님의 군대"는 무너진 예루살렘에서 다시 일어난다 — 스룹바벨과 학개·스가랴가 성전을, 에스더와 모르드개가 목숨을, 에스라가 말씀을, 느헤미야가 성벽을 세우고, 말라기 이후 선지자의 음성이 끊긴 긴 세월을 지나 맛다디아와 마카비 형제들이 일어선다. 바벨론의 벨사살, 바사의 고레스·아하수에로·하만, 산발랏과 도비야와 게셈, 알렉산더 대왕, 프톨레마이오스와 셀레우코스의 왕들, 그리고 로마의 폼페이우스가 차례로 온다. 오백 년 가까운 시대를 한 판으로 압축했다.',
  words: ['lord_of_hosts', 'fear_not', 'gideon_torch', 'mahanaim'],
  factions: [
    { id: 'army', name: '하나님의 군대', ruler: '스룹바벨', color: '#e2b04a', capital: 'jerusalem', gold: 1500, food: 6000, aggr: 0.4,
      desc: '마하나임의 하나님의 군대 — 이 시대에는 포로에서 돌아온 남은 자들로 일어난다. 다윗의 자손 스룹바벨과 대제사장 여호수아가 먼저 이끌고, 에스라·느헤미야, 그리고 사백 년 뒤 맛다디아와 마카비 형제들이 사건을 따라 대를 잇는다. 고레스가 돌려준 성전 기구 오천사백 개가 곳간에 있다 (스 1:11).',
      cities: { jerusalem: 3500, bethlehem: 1200 } },
    { id: 'babylon', name: '바벨론', ruler: '벨사살', color: '#c9a227', capital: 'babylon', gold: 3000, food: 12000, aggr: 0.1,
      desc: '신 바벨론 제국의 마지막 날들. 왕 나보니두스는 하란의 달 신을 섬기며 오래 도읍을 비웠고, 그 아들 벨사살이 바벨론을 다스린다 (나보니두스 원통 비문). 그날 밤 잔치가 한창이다 (단 5장).',
      cities: { babylon: 6000, haran: 2000, carchemish: 2000, hamath: 2000, damascus: 2500 } },
    { id: 'persia', name: '바사', ruler: '고레스', color: '#6f8fd8', capital: 'susa', gold: 5000, food: 18000, aggr: 0.1,
      desc: '메대와 바사의 제국. 고레스는 "내 목자"라 불린 이방 왕이다 (사 44:28; 45:1). 사로잡힌 백성을 고향으로 돌려보낸 그의 정책이 고레스 원통에 새겨져 있다. 훗날 다리오·아하수에로·아닥사스다가 다스리다 BC 331 알렉산더에게 무너진다.',
      cities: { susa: 7000, persepolis: 3000, ashur: 2500, sardis: 3500, ephesus: 2000, tarsus: 2000 } },
    { id: 'egypt', name: '애굽', ruler: '아마시스', color: '#d98a3a', capital: 'memphis', gold: 3000, food: 14000, aggr: 0.1,
      desc: '제26왕조의 바로 아마시스(아흐모세 2세). BC 525 바사의 캄비세스에게 정복된다.',
      cities: { memphis: 5000, tanis: 3000, thebes: 3000, goshen: 1500 } },
    { id: 'samaria_gov', name: '사마리아 총독 산발랏', ruler: '산발랏', color: '#9a6fbf', capital: 'samaria', gold: 1500, food: 9000, aggr: 0.2,
      desc: '호론 사람 산발랏이 다스리는 사마리아 지방. 암몬 사람 도비야가 요단 동편을 쥐고 있다. 그들은 성전과 성벽 재건을 끝까지 방해했다 (스 4장; 느 4; 6장). 엘레판틴 파피루스(BC 407)에도 "사마리아 총독 산발랏"이 나온다.',
      cities: { samaria: 3000, shechem: 2500, megiddo: 2000, rabbah: 2000 } },
    { id: 'nabatea', name: '아라비아 (게달)', ruler: '게셈', color: '#c79a3a', capital: 'bozrah', gold: 1500, food: 5000, aggr: 0.15,
      desc: '아라비아 사람 게셈의 부족 연합. 텔 엘마스쿠타의 은그릇에 "게달 왕 가이누, 가스무(게셈)의 아들"이라는 글이 새겨져 있다. 에돔의 옛 땅을 차지했고, 훗날 이 땅에 나바티아 왕국이 선다 (마카비 시대의 아레다).',
      cities: { bozrah: 2500, kirhareseth: 1500, dibon: 1500, midian: 1500 } },
    { id: 'idumea', name: '이두매', ruler: '이두매 족장', color: '#b5804f', capital: 'hebron', gold: 800, food: 5000, aggr: 0.25,
      desc: '포로기 동안 유다 남쪽으로 올라와 헤브론까지 차지한 에돔 사람들. 훗날 "이두매"라 불렸고, 헤롯이 이 족속에서 나온다.',
      cities: { hebron: 2500, beersheba: 1500, lachish: 1500 } },
    { id: 'philistia', name: '아스돗 (해안 성읍)', ruler: '아스돗 장관', color: '#c9573f', capital: 'ashdod', gold: 1200, food: 6000, aggr: 0.2,
      desc: '옛 블레셋의 해안 성읍들. 아스돗 사람들도 느헤미야의 성벽을 막으려 산발랏과 손잡았다 (느 4:7). 느헤미야 때 유다 사람의 자녀 절반이 아스돗 방언을 했다 (느 13:24).',
      cities: { ashdod: 2500, ashkelon: 2000, gaza: 3000 } },
    { id: 'tyre', name: '시돈·두로', ruler: '에슈무나자르', color: '#3fb3b5', capital: 'sidon', gold: 2500, food: 5000, aggr: 0.05,
      desc: '바사 함대의 중심이던 베니게 항구들. 시돈 왕 에슈무나자르 2세의 석관 비문에는 바사 왕이 그에게 "돌(도르)과 욥바"를 주었다고 새겨져 있다. 성전 재건 때 레바논의 백향목을 욥바로 실어 날랐다 (스 3:7).',
      cities: { sidon: 3500, tyre: 3000, joppa: 1500, kittim: 1500 } },
  ],
  // 벧엘·여리고·엠마오·모데인은 돌아온 백성이 다시 살 성읍들 (스 2:21-35). 알렉산드리아와 안디옥은 아직 세워지기 전의 작은 터다.
  neutral: { bethel: 800, jericho: 800, emmaus: 600, modein: 500, gezer: 1500, shiloh: 600, mahanaim: 1200, ramoth: 1500, heshbon: 1500, edrei: 1500,
    dan: 1200, hazor: 1500, bethshean: 1500, kadesh: 1000, sinai: 500, alexandria: 800, antioch: 800, pella: 2500, athens: 2500, corinth: 2500, rome: 3500 },
  hide: ['hattusa', 'nineveh', 'ur', 'gath', 'ekron'], // 니느웨는 BC 612 이후 폐허, 가드는 이미 사라졌고 그 일대의 요새는 게셀이다
  officers: [
    // 하나님의 군대 (처음부터)
    ['스룹바벨', 60, 78, 84, 86, 90, 'army', 'jerusalem', '스알디엘의 아들, 다윗의 자손 유다 총독. 성전의 지대를 놓고 완성했다. "힘으로 되지 아니하며 능력으로 되지 아니하고 오직 나의 영으로 되느니라".', '스 3:2, 8; 학 2:23; 슥 4:6-9; 마 1:12'],
    ['대제사장 여호수아', 30, 80, 70, 78, 97, 'army', 'jerusalem', '여호사닥의 아들 대제사장. 스가랴의 환상에서 더러운 옷을 벗고 아름다운 옷을 입었다.', '스 3:2; 학 1:1; 슥 3:1-5'],
    ['세스바살', 45, 72, 78, 66, 80, 'army', 'bethlehem', '유다 목백. 고레스가 돌려준 성전 기구를 가지고 올라와 하나님의 성전 지대를 놓았다.', '스 1:8-11; 5:14-16'],
    // 바벨론
    ['벨사살', 60, 55, 50, 58, 5, 'babylon', 'babylon', '나보니두스의 아들, 바벨론을 다스린 왕. 예루살렘 성전의 금 그릇으로 술을 마시던 밤, 벽에 손가락이 나타나 글을 썼다.', '단 5:1-30; 나보니두스 원통'],
    ['나보니두스', 50, 82, 70, 50, 10, 'babylon', 'haran', '신 바벨론의 마지막 왕. 하란의 달 신 신전을 다시 세우고 아라비아 데마에 오래 머물렀다. 고레스가 그를 살려 주었다.', '나보니두스 연대기'],
    ['다니엘', 30, 98, 95, 88, 100, 'babylon', 'babylon', '유다 왕족 소년으로 바벨론에 끌려와 칠십 년을 지낸 선지자. 벽의 글씨를 읽었고, 사자 굴에서 건짐을 받았다. 그의 환상은 알렉산더와 그 후계자들까지 내다보았다.', '단 1:1-6; 5:13-28; 6:22; 8–11장'],
    // 바사
    ['고레스', 85, 92, 92, 92, 40, 'persia', 'susa', '바사 왕. 바벨론을 싸움 없이 얻고 포로들을 고향으로 돌려보냈다. 여호와께서 "나의 목자", "기름 부음을 받은 자"라 부르셨다.', '사 44:28–45:4; 스 1:1-4; 고레스 원통'],
    ['구바루', 82, 70, 62, 50, 10, 'persia', 'ashur', '고레스의 장군. 바벨론에 싸움 없이 들어갔다고 나보니두스 연대기가 전한다.', '나보니두스 연대기'],
    ['캄비세스 2세', 80, 55, 50, 40, 5, 'persia', 'susa', '고레스의 아들, 바사 왕. BC 525 애굽을 정복했다.', '헤로도토스, 역사 3권'],
    ['다리오 1세', 82, 88, 94, 80, 30, 'persia', 'sardis', '바사 왕. 악메다 궁에서 고레스의 조서를 찾아내어 성전 건축을 도왔다. 베히스툰 비문을 남겼다.', '스 6:1-15; 학 1:1'],
    ['닷드내', 55, 70, 78, 60, 20, 'persia', 'susa', '유브라데 강 서쪽 총독. 성전 건축을 조사해 다리오 왕에게 편지했고, 조서가 내려오자 "신속히" 도왔다.', '스 5:3-6:13'],
    ['아마시스', 65, 82, 85, 78, 10, 'egypt', 'memphis', '애굽 제26왕조의 바로(아흐모세 2세). 헬라 상인들을 나우크라티스에 살게 하며 나라를 부유하게 했다. 캄비세스가 오기 직전에 죽었다.', '헤로도토스, 역사 2–3권'],
    ['아하수에로', 80, 55, 60, 70, 5, null, 'hattusa', '바사 왕(크세르크세스 1세). 인도에서 구스까지 백이십칠 지방을 다스렸다. 헬라 원정(BC 480)을 떠나기 전 수산 궁에서 큰 잔치를 열었다.', '에 1:1-4; 헤로도토스, 역사 7권'],
    ['하만', 55, 78, 75, 60, 0, null, 'hattusa', '아각 사람 함므다다의 아들. 모르드개가 절하지 않자 온 유다인을 멸하려는 조서를 꾸몄다.', '에 3:1-15; 7:10'],
    ['아닥사스다 1세', 70, 80, 85, 70, 25, null, 'hattusa', '바사 왕. 에스라에게 조서와 은금을 주었고, 술 맡은 관원 느헤미야의 얼굴빛을 보고 예루살렘으로 보냈다.', '스 7:11-26; 느 2:1-8'],
    ['다리오 3세', 70, 60, 65, 60, 5, null, 'hattusa', '바사의 마지막 왕. 잇수스와 가우가멜라에서 알렉산더에게 패하고 도망하다 신하에게 죽었다 (BC 330).', '단 8:6-7'],
    // 사마리아·아라비아·이두매·해안·베니게
    ['산발랏', 60, 78, 76, 62, 15, 'samaria_gov', 'samaria', '호론 사람, 사마리아 총독. "이 미약한 유다 사람들이 하는 일이 무엇인가" 비웃으며 성벽을 막았다.', '느 2:10, 19; 4:1-8; 6:1-14'],
    ['도비야', 55, 74, 70, 62, 20, 'samaria_gov', 'rabbah', '암몬 사람 관리. "그들이 건축하는 돌 성벽은 여우가 올라가도 곧 무너지리라" 했다. 훗날 성전 방까지 차지했다가 쫓겨났다.', '느 2:10; 4:3; 13:4-9'],
    ['르훔', 50, 66, 70, 45, 10, 'samaria_gov', 'shechem', '방백. 서기관 심새와 함께 아닥사스다 왕에게 고소 편지를 보내 성의 건축을 멈추게 했다.', '스 4:8-24'],
    ['심새', 35, 72, 66, 40, 10, 'samaria_gov', 'samaria', '서기관. 르훔과 함께 고소 편지를 썼다.', '스 4:8-9'],
    ['게셈', 72, 62, 60, 58, 10, 'nabatea', 'bozrah', '아라비아 사람(가스무). 산발랏·도비야와 함께 느헤미야를 오노 평지로 불러내려 했다.', '느 2:19; 6:1-6'],
    ['이두매 족장', 65, 50, 46, 45, 10, 'idumea', 'hebron', '에서 자손의 족장. 유다 남쪽 헤브론까지 올라와 살았다.', '마카비1서 5:3, 65 (외경)'],
    ['아스돗 장관', 60, 56, 60, 45, 5, 'philistia', 'ashdod', '해안 성읍 아스돗의 우두머리.', '느 4:7; 13:23-24'],
    ['에슈무나자르', 45, 72, 84, 70, 10, 'tyre', 'sidon', '시돈 왕. 바사 왕에게서 돌(도르)과 욥바를 받았다고 석관에 새겼다.', '에슈무나자르 2세 석관 비문'],
    // 아직 때가 이르지 않은 믿음의 사람들
    ['학개', 20, 86, 60, 78, 98, null, 'hattusa', '선지자. "이 성전이 황폐하였거늘 너희가 이 때에 판벽한 집에 거주하는 것이 옳으냐" 외쳐 멈춘 공사를 다시 일으켰다.', '학 1:1-15; 스 5:1'],
    ['스가랴', 20, 92, 62, 80, 98, null, 'hattusa', '잇도의 손자 선지자. 금 등잔대와 두 감람나무 환상을 보았고, 나귀를 타고 오시는 왕을 예언했다.', '슥 4:1-14; 9:9; 스 5:1'],
    ['에스더', 10, 88, 80, 96, 90, null, 'hattusa', '모르드개의 사촌, 바사의 왕후. "죽으면 죽으리이다" 하고 부르심 없이 왕 앞에 나아갔다.', '에 2:7, 17; 4:16; 7:3-6'],
    ['모르드개', 40, 88, 88, 80, 92, null, 'hattusa', '베냐민 사람, 수산 궁의 문지기. 하만에게 절하지 않았고 에스더에게 "이 때를 위함이 아닌지" 물었다. 훗날 왕 다음가는 자가 되었다.', '에 2:5-7; 3:2; 4:14; 10:3'],
    ['에스라', 25, 94, 80, 82, 99, null, 'hattusa', '아론의 자손, 율법에 익숙한 학자. "여호와의 율법을 연구하여 준행하며 가르치기로 결심하였었더라".', '스 7:6, 10; 느 8:1-8'],
    ['느헤미야', 60, 88, 94, 88, 95, null, 'hattusa', '하가랴의 아들, 바사 왕의 술 맡은 관원. 무너진 성벽 소식에 울며 기도했고, 한 손에 일감을 한 손에 병기를 잡게 하여 오십이 일 만에 성벽을 완성했다.', '느 1:1-11; 4:17; 6:15'],
    ['말라기', 15, 90, 55, 70, 98, null, 'hattusa', '구약의 마지막 선지자. "내가 선지자 엘리야를 너희에게 보내리니" 하는 약속을 남기고, 그 뒤 사백 년 동안 선지자의 음성이 끊어졌다.', '말 1:1; 3:1; 4:5-6'],
    ['얏두아', 20, 80, 72, 75, 92, null, 'hattusa', '대제사장. 요세푸스는 그가 예루살렘에 온 알렉산더를 맞았다고 전한다 (전승).', '느 12:11, 22; 요세푸스, 유대 고대사 11권'],
    ['의인 시몬', 30, 84, 82, 85, 96, null, 'hattusa', '오니아스의 아들 대제사장(시몬 2세). 성전을 보수하고 성벽을 두껍게 했으며, "구름 사이의 샛별 같았다"고 집회서가 노래했다.', '집회서 50:1-21 (외경)'],
    ['오니아스 3세', 25, 82, 75, 80, 97, null, 'hattusa', '의인 시몬의 아들 대제사장. 경건하여 헬라화를 막다가 쫓겨나 안디옥 근처 다프네에서 살해되었다 (BC 171).', '마카비2서 3:1; 4:1-6, 33-35 (외경)'],
    ['맛다디아', 55, 75, 65, 88, 98, null, 'hattusa', '모데인의 제사장. "우리와 우리 자녀들은 조상들의 언약을 따라 살겠다" 하며 이방 제단을 허물었다.', '마카비1서 2:1-28 (외경)'],
    ['유다 마카비', 97, 86, 70, 92, 95, null, 'hattusa', '맛다디아의 셋째 아들. "망치(마카비)"라 불린 용사. 적은 무리로 큰 군대를 여러 번 이기고 성전을 정결하게 했다.', '마카비1서 3:1-9; 4:36-59 (외경)'],
    ['시몬', 76, 90, 91, 80, 88, null, 'hattusa', '맛다디아의 둘째 아들. 아버지가 "지혜로운 사람이니 아버지로 여기라" 한 형제. BC 142 이방의 멍에를 벗겼다.', '마카비1서 2:65; 13:41-42 (외경)'],
    ['요나단', 82, 86, 84, 78, 86, null, 'hattusa', '맛다디아의 막내아들. 형 유다를 이어 백성을 이끌고 대제사장이 되었다.', '마카비1서 9:28-31; 10:20 (외경)'],
    ['엘르아살', 92, 50, 40, 72, 90, null, 'hattusa', '맛다디아의 넷째 아들. 벧스가랴에서 왕이 탄 줄 안 코끼리 밑으로 뛰어들었다.', '마카비1서 6:43-46 (외경)'],
    ['요한', 68, 60, 66, 66, 84, null, 'hattusa', '맛다디아의 맏아들. 짐을 맡기러 나바티아로 가던 길에 죽임을 당했다.', '마카비1서 9:35-36 (외경)'],
    ['요한 힐카누스', 80, 80, 84, 76, 70, null, 'hattusa', '시몬의 아들. 아버지를 이어 대제사장과 영도자가 되었고, 게셀에서 군대를 이끌었다.', '마카비1서 13:53; 16:1-24 (외경)'],
    ['하시딤 장로', 40, 72, 55, 72, 97, null, 'hattusa', '율법에 목숨을 건 "경건한 사람들"의 어른. 맛다디아에게 합류했다.', '마카비1서 2:42 (외경)'],
    ['엘르아살 노인', 10, 85, 55, 82, 100, null, 'hattusa', '아흔 살의 서기관. 먹는 척만 하라는 권유도 거절하고 순교했다.', '마카비2서 6:18-31 (외경); 히 11:35'],
    ['일곱 아들의 어머니', 5, 80, 45, 90, 100, null, 'hattusa', '일곱 아들이 한 날에 순교하는 것을 보며 "하늘과 땅을 보라"고 격려한 어머니.', '마카비2서 7장 (외경); 히 11:35'],
    // 헬라 이후의 왕과 장군들 (알렉산더·프톨레마이오스 1세·셀레우코스 1세·포필리우스·미트리다테스는 사건으로 나라를 세운다)
    ['카산드로스', 75, 76, 72, 55, 5, null, 'hattusa', '안티파트로스의 아들, 마게도냐 왕. 알렉산더 뒤에 넷으로 갈라진 나라 가운데 하나를 차지했다.', '단 8:8, 22; 11:4'],
    ['프톨레마이오스 2세', 60, 90, 90, 72, 15, null, 'hattusa', '애굽의 프톨레마이오스 왕. 알렉산드리아 도서관을 키웠고, 그 시대에 유대인의 율법이 헬라어로 옮겨졌다(칠십인역).', '아리스테아스의 편지 (전승)'],
    ['스코파스', 80, 60, 45, 45, 5, null, 'hattusa', '프톨레마이오스의 아이톨리아 출신 장군. 바니아스(단 근처) 전투에서 안티오쿠스 3세에게 패했다.', '단 11:15-16; 폴리비오스'],
    ['안티오쿠스 3세', 88, 84, 84, 78, 10, null, 'hattusa', '"대왕"이라 불린 셀레우코스 왕. 바니아스에서 이겨 유다 땅을 차지했으나 BC 190 마그네시아에서 로마에 크게 졌다.', '단 11:10-19'],
    ['안티오쿠스 4세', 70, 80, 76, 62, 5, null, 'hattusa', '스스로 "신의 현현(에피파네스)"이라 부른 왕. 성전에 이방 제단을 세웠다. 다니엘이 예언한 "비천한 사람".', '단 11:21-36; 마카비1서 1:10-64 (외경)'],
    ['메넬라오스', 30, 72, 72, 30, 5, null, 'hattusa', '돈으로 대제사장 자리를 산 헬라파.', '마카비2서 4:23-29 (외경)'],
    ['리시아스', 76, 80, 86, 60, 8, null, 'hattusa', '왕의 섭정. 대군과 코끼리를 이끌고 벧술과 벧스가랴로 왔다.', '마카비1서 3:32-37; 6:28-63 (외경)'],
    ['아폴로니우스', 72, 55, 50, 40, 5, null, 'hattusa', '사마리아의 장관. 유다 마카비에게 죽고 그 칼을 빼앗겼다.', '마카비1서 3:10-12 (외경)'],
    ['세론', 70, 45, 40, 45, 5, null, 'hattusa', '수리아 군대 장관. 벧호론 비탈에서 패했다.', '마카비1서 3:13-24 (외경)'],
    ['고르기아스', 82, 78, 50, 45, 5, null, 'hattusa', '밤에 유다의 진을 기습하려다 빈 진을 친 장수.', '마카비1서 4:1-25 (외경)'],
    ['니가노르', 80, 65, 55, 50, 5, null, 'hattusa', '성전을 향해 손을 들고 위협한 장군. 아다르월 13일에 패했다.', '마카비1서 7:26-50 (외경)'],
    ['바키데스', 86, 76, 70, 50, 5, null, 'hattusa', '엘라사에서 유다 마카비를 쓰러뜨린 장군.', '마카비1서 7:8; 9:1-22 (외경)'],
    ['코끼리 부대장', 86, 30, 20, 30, 0, null, 'hattusa', '전투 코끼리 서른두 마리를 모는 장수. 코끼리마다 망대와 궁수를 실었다.', '마카비1서 6:30-37 (외경)'],
    ['아레다', 62, 72, 76, 72, 20, null, 'hattusa', '나바티아 사람들의 왕. 대상로를 다스렸다.', '마카비2서 5:8 (외경)'],
    ['폼페이우스', 90, 84, 82, 80, 5, null, 'hattusa', '로마의 장군 "마그누스". BC 64 셀레우코스 왕국을 없애고 BC 63 예루살렘 성전을 석 달 에워싸 함락했다. 지성소에 들어가 보았으나 아무 형상도 없었다고 한다.', '요세푸스, 유대 고대사 14권'],
  ],
  rel: [['army', 'persia', 70], ['army', 'babylon', 20], ['army', 'samaria_gov', 60], ['army', 'idumea', 40], ['army', 'philistia', 45], ['army', 'tyre', 60], ['army', 'nabatea', 45], ['army', 'egypt', 45],
    ['persia', 'babylon', 5], ['persia', 'tyre', 70], ['persia', 'samaria_gov', 70], ['persia', 'egypt', 20], ['samaria_gov', 'nabatea', 60], ['samaria_gov', 'philistia', 60], ['idumea', 'nabatea', 55]],
  goals: { army: ['jerusalem', 'samaria', 'joppa', 'antioch', 'rome'] },
  goalText: { army: '예루살렘과 사마리아, 바다로 가는 문 욥바, 셀레우코스의 도읍 안디옥, 그리고 로마까지 — 목표 5성. 성경의 역사에서는 BC 63 로마의 폼페이우스가 예루살렘에 들어왔고, 로마의 평화 아래 "때가 차매" 그리스도가 오셨다 (갈 4:4). 이 게임에서는 하나님의 군대가 로마까지 나아간다 — 훗날 바울이 복음을 들고 사슬에 매여 간 그 길이다 (행 28:14-16).' },
});

EVENTS.e_inter = [
  // ---- 1장: 귀환과 제단 ----
  { id: 'belshazzar', who: 'army', auto: 0,
    cond: G => G.turn >= 1 && G.exists('army') && G.exists('babylon'),
    title: '벽의 글씨 — 바벨론의 마지막 밤 (BC 539)', ref: '단 5:1-31; 사 45:1-4; 나보니두스 연대기',
    text: '지난가을, 바벨론 왕 벨사살이 귀족 천 명을 위해 큰 잔치를 베풀고 예루살렘 성전에서 가져온 금 그릇으로 술을 마셨다. 그때 사람의 손가락이 나타나 왕궁 촛대 맞은편 석회벽에 글자를 썼다. 늙은 다니엘이 불려 와 읽었다. "메네 메네 데겔 우바르신… 하나님이 이미 왕의 나라의 시대를 세어서 그것을 끝나게 하셨다… 왕을 저울에 달아 보니 부족함이 보였다… 왕의 나라가 나뉘어서 메대와 바사 사람에게 준 바 되었다" (단 5:25-28). 그날 밤 바사 군대가 바벨론에 들어왔다. 나보니두스 연대기는 "고레스의 군대가 싸움 없이 바벨론에 들어갔다"고 적었다.',
    choices: [
      { label: '다니엘의 해석을 기억하며, 그를 예루살렘으로 맞아들인다', run: G => {
        G.kill('벨사살'); INTER_KIT.retire(G, '나보니두스');
        const d = INTER_KIT.enter(G, '다니엘');
        const n = INTER_KIT.absorb(G, 'babylon', 'persia');
        G.rel('army', 'persia', 5); INTER_KIT.faithAll(G, 6); G.flags.writing = true;
        return `"그 밤에 갈대아 왕 벨사살이 죽임을 당하였고" (단 5:30). 바벨론의 성 ${n}곳이 바사에 넘어갔다. 나보니두스는 목숨을 건졌다. ` + (d ? '다니엘은 바사 궁정에 남아 "고레스 원년까지" 있었다(단 1:21; 6:28). 이 게임에서는 그가 하나님의 군대의 참모로 함께한다. ' : '') + '신앙 +6. (단 5:31의 "메대 사람 다리오"가 누구인지는 학자들 사이에 여러 견해가 있다.)'; } },
    ] },
  { id: 'cyrus', who: 'army', auto: 0,
    cond: G => G.turn >= 2 && G.done.belshazzar && G.exists('army'),
    title: '고레스의 칙령 (BC 538)', ref: '스 1:1-11; 대하 36:22-23; 사 44:28; 고레스 원통',
    text: '"바사 왕 고레스는 말하노니 하늘의 하나님 여호와께서 세상 모든 나라를 내게 주셨고 나에게 명령하사 유다 예루살렘에 성전을 건축하라 하셨나니 너희 중에 그의 백성 된 자는 다 유다 예루살렘으로 올라가서… 여호와의 성전을 건축하라" (스 1:2-3). 이백 년 전 이사야는 이미 그의 이름을 불렀다. "고레스에 대하여는 이르기를 내 목자라 그가 나의 모든 기쁨을 성취하리라" (사 44:28). 대영박물관의 고레스 원통에도 그가 여러 민족을 고향으로 돌려보내고 신전을 다시 세우게 했다는 기록이 있다.',
    choices: [
      { label: '돌려받은 성전 기구를 들고 예루살렘으로 올라간다', run: G => {
        G.fac('army').gold += 1200; G.fac('army').food += 3000; INTER_KIT.add(G, 1800);
        G.rel('army', 'persia', 12); INTER_KIT.faithAll(G, 6, 8);
        G.flags.decree = true; G.kingdom(2, '고레스의 칙령');
        return '금 그릇과 은 그릇 오천사백 개(스 1:11), 금 +1200, 식량 +3000. 이웃들이 은그릇과 금과 가축으로 도왔다 (1:6). 온 회중 사만 이천삼백육십 명 가운데 싸울 수 있는 자들이 모였다 — 본거지 병력 +1800. 바사와의 관계 +12, 신앙 +6, 민심 +8.'; } },
    ] },
  { id: 'altar', who: 'army', auto: 0,
    cond: G => G.turn >= 3 && G.done.cyrus && G.exists('army'),
    title: '제단과 지대 — 울음과 기쁨의 소리', ref: '스 3:1-13',
    text: '일곱째 달에 백성이 일제히 예루살렘에 모였다. 스룹바벨과 대제사장 여호수아가 "그 땅 백성을 두려워하여" 옛 터에 제단을 먼저 세우고 아침저녁으로 번제를 드렸다. 이듬해 성전의 지대를 놓을 때 제사장들은 나팔을, 아삽 자손 레위 사람들은 제금을 들고 찬송했다. "주는 지극히 선하시므로 그의 인자하심이 이스라엘에게 영원하시도다" (3:11). 첫 성전을 보았던 노인들은 대성통곡하고, 많은 사람은 기뻐 크게 함성을 질렀다.',
    choices: [
      { label: '울음과 기쁨이 섞인 찬송으로 지대를 놓는다', run: G => {
        G.item('army', 'psalm_scroll', 1); INTER_KIT.faithAll(G, 10);
        const j = G.city('jerusalem'); if (j && j.owner === 'army') { j.def += 5; j.loy += 8; }
        G.flags.foundation = true; G.kingdom(2, '그의 인자하심이 영원하시도다');
        return '시편 두루마리 1개, 신앙 +10, 예루살렘 민심 +8, 성벽 +5. "백성이 크게 외치므로 즐거이 부르는 소리와 통곡하는 소리를 백성들이 분간하지 못하였느니라" (3:13).'; } },
    ] },
  { id: 'adversaries', who: 'army', auto: 0,
    cond: G => G.turn >= 5 && G.done.altar && G.exists('army'),
    title: '"우리도 함께 건축하게 하라"', ref: '스 4:1-5, 24',
    text: '유다와 베냐민의 대적들이 스룹바벨에게 와서 말했다. "우리도 너희와 함께 건축하게 하라 우리도 너희 같이 너희 하나님을 찾노라 앗수르 왕 에살핫돈이 우리를 이리로 올라오게 한 날부터 우리가 하나님께 제사를 드리노라" (4:2). 앗수르가 옮겨 살게 한 사람들이었다 — 그들은 "여호와도 경외하고 또한 각기 자기의 신들도 섬겼더라" (왕하 17:33).',
    choices: [
      { label: '"우리 하나님의 전을 건축하는 데에 너희는 상관이 없느니라" (스룹바벨의 대답)', run: G => {
        G.rel('army', 'samaria_gov', -40); G.fac('samaria_gov').aggr = 0.25; INTER_KIT.faithAll(G, 5);
        const r = INTER_KIT.raid(G, 'samaria_gov', 2500);
        G.flags.adversaries = true;
        return '사마리아와의 관계 -40. "그 땅 백성이 유다 백성의 손을 약하게 하여 그 건축을 방해하되 바사 왕 고레스의 시대부터 다리오의 시대까지 의사들을 사서 그 계획을 막았으며" (4:4-5). ' + (r ? `산발랏의 무리가 쳐들어왔다: ${r} ` : '') + '신앙 +5. 성전 공사가 멈추었다.'; } },
      { label: '함께 건축하자는 제안을 받아들인다', run: G => {
        G.rel('army', 'samaria_gov', 15); INTER_KIT.faithAll(G, -15); G.fac('army').gold += 500;
        G.flags.adversaries = true; G.kingdom(-2, '섞인 제단');
        return '사마리아와의 관계 +15, 금 +500. 그러나 여러 신을 함께 섬기는 손으로 여호와의 집을 지으니 백성의 마음이 흐려졌다 — 신앙 -15. 성경의 역사에서 스룹바벨은 이 제안을 거절했다.'; } },
    ] },
  { id: 'cambyses', who: 'persia', auto: 0,
    cond: G => G.turn >= 6 && G.done.belshazzar && INTER_KIT.live(G, 'persia'),
    title: '캄비세스의 애굽 정복 (BC 525)', ref: '헤로도토스, 역사 3권; 엘레판틴 파피루스',
    text: '고레스가 동방 원정에서 죽고(BC 530) 그 아들 캄비세스 2세가 왕이 되었다. 그가 가사를 지나 시내 광야를 건너 펠루시움에서 애굽 군대를 무너뜨리고 멤피스를 차지했다. 나일 강 상류 엘레판틴 섬의 유대인 군사 공동체는 훗날 "캄비세스가 애굽에 왔을 때 우리 여호와(야후)의 성전은 이미 있었다"고 편지에 적었다.',
    choices: [
      { label: '애굽을 정복한다', run: G => {
        G.kill('고레스'); INTER_KIT.lead(G, '캄비세스 2세', 'persia'); G.kill('아마시스');
        const n = INTER_KIT.absorb(G, 'egypt', 'persia');
        return `고레스가 죽고 캄비세스 2세가 바사 왕이 되었다. 애굽의 성 ${n}곳이 바사에 넘어가 애굽 왕국이 사라졌다. 이제 바사가 나일에서 인더스까지 다스린다.`; } },
    ] },
  // ---- 2장: 학개와 스가랴 ----
  { id: 'haggai', who: 'army', auto: 0,
    cond: G => G.turn >= 8 && G.done.adversaries && G.exists('army'),
    title: '학개와 스가랴 — 다시 일어나 건축하라 (BC 520)', ref: '학 1:1-15; 2:4-9; 슥 4:6-10; 스 5:1–6:12',
    text: '공사가 멈춘 지 열여섯 해, 다리오 왕 제이년에 여호와의 말씀이 선지자 학개에게 임했다. "이 성전이 황폐하였거늘 너희가 이 때에 판벽한 집에 거주하는 것이 옳으냐… 너희는 너희의 행위를 살필지니라" (학 1:4-5). 스가랴는 금 등잔대와 두 감람나무 환상을 보았다. "힘으로 되지 아니하며 능력으로 되지 아니하고 오직 나의 영으로 되느니라 만군의 여호와의 말씀이니라… 작은 일의 날이라고 멸시하는 자가 누구냐" (슥 4:6, 10). 총독 닷드내가 와서 "누가 너희에게 이 성전을 건축하라고 명령하였느냐" 따졌으나, 다리오가 악메다 궁에서 고레스의 조서를 찾아냈다.',
    choices: [
      { label: '판벽한 집을 두고 산에 올라가 나무를 가져온다', run: G => {
        INTER_KIT.enter(G, '학개'); INTER_KIT.enter(G, '스가랴');
        if (G.exists('persia')) { G.kill('캄비세스 2세'); INTER_KIT.lead(G, '다리오 1세', 'persia'); }
        G.item('army', 'anointing_horn', 1); G.res('army', { gold: 800, wood: 1500, stone: 1000 });
        INTER_KIT.faithAll(G, 10); G.rel('army', 'persia', 8); G.flags.haggai = true; G.kingdom(2, '오직 나의 영으로');
        return '학개와 스가랴가 합류했다. 다리오 1세가 바사 왕이 되어 조서를 내렸다. "강 서쪽에서 거둔 세금 중에서 경비를 이 사람들에게 신속히 주어" (스 6:8) — 금 +800, 목재 +1500, 석재 +1000. 기름 뿔 1개 ("이는 기름 부음 받은 자 둘이니 온 세상의 주 앞에 서 있는 자니라", 슥 4:14). 신앙 +10. 이제 성전을 다시 지어 올리자 (성전 Lv.6).'; } },
    ] },
  { id: 'templeDone', who: 'army', auto: 0,
    cond: G => G.done.haggai && G.exists('army') && INTER_KIT.mine(G, 'jerusalem') &&
      ((G.city('jerusalem').bld && G.city('jerusalem').bld.temple >= 6) || G.turn >= 16),
    title: '둘째 성전의 봉헌 (BC 516)', ref: '스 6:13-22; 학 2:3-9',
    text: '다리오 왕 제육년 아달월 삼일에 성전 건축을 마쳤다. 솔로몬의 성전을 기억하는 노인들의 눈에는 "보잘것없는" 집이었다 (학 2:3). 그러나 학개가 전했다. "이 성전의 나중 영광이 이전 영광보다 크리라 만군의 여호와의 말이니라 내가 이 곳에 평강을 주리라" (학 2:9). 사백 년 뒤 이 성전 뜰에 예수께서 거니셨다.',
    choices: [
      { label: '즐거이 봉헌하고 유월절을 지킨다', run: G => {
        const j = G.city('jerusalem'); j.faith += 20; j.loy += 10; j.bld = j.bld || {}; j.bld.temple = Math.max(j.bld.temple || 1, 6);
        INTER_KIT.faithAll(G, 8); G.fac('army').food += 2000; G.flags.secondTemple = true; G.kingdom(4, '나중 영광이 이전 영광보다');
        return '예루살렘 신앙 +20, 민심 +10, 성전 Lv.6 이상. 모든 성 신앙 +8, 식량 +2000. "여호와께서 그들을 즐겁게 하시고 또 앗수르 왕의 마음을 그들에게로 돌이켜" (스 6:22).'; } },
    ] },
  // ---- 3장: 에스더 ----
  { id: 'xerxes', who: 'persia', auto: 0,
    cond: G => G.turn >= 12 && G.done.haggai && INTER_KIT.live(G, 'persia'),
    title: '아하수에로의 잔치와 살라미스 (BC 483–480)', ref: '에 1:1-22; 2:1-18; 헤로도토스, 역사 7–8권',
    text: '아하수에로(크세르크세스 1세)가 왕위에 있은 지 제삼년에 수산 궁에서 백팔십 일 동안 잔치를 베풀었다 — 헤로도토스는 이 무렵 그가 헬라 원정을 의논했다고 전한다. 왕후 와스디가 부름을 거절하자 폐위되었고, 뒤에 베냐민 사람 모르드개의 사촌 에스더가 왕후가 되었다. BC 480 아하수에로의 대군은 아덴을 불태웠으나 살라미스 바다에서 크게 졌다.',
    choices: [
      { label: '헬라 원정을 떠난다', run: G => {
        G.kill('다리오 1세'); INTER_KIT.lead(G, '아하수에로', 'persia');
        INTER_KIT.cut(G, 'persia', 0.75, [G.fac('persia').capital, 'sardis', 'ephesus']);
        const a = G.city('athens'); if (a && !a.owner) a.soldiers = Math.floor(a.soldiers * 0.6);
        G.flags.xerxes = true;
        return '아하수에로가 바사 왕이 되었다. 헬라 원정에서 바사 도읍과 사데·에베소의 병력 25%를 잃었다. 아덴은 불탔으나 살아남았다. 수산 궁에서는 에스더가 왕후의 관을 썼다 (에 2:17).'; } },
    ] },
  { id: 'purim', who: 'army', auto: 0,
    cond: G => G.turn >= 14 && (G.done.xerxes || G.turn >= 17 || !INTER_KIT.live(G, 'persia')) && G.exists('army'),
    title: '"죽으면 죽으리이다" — 부림절', ref: '에 3–9장',
    text: '아각 사람 하만이 왕 다음가는 자리에 올랐다. 모르드개가 절하지 않자 그는 온 나라의 유다인을 아달월 십삼일 하루에 멸하라는 조서를 왕의 반지로 인쳤다 (3:13). 모르드개가 굵은 베옷을 입고 에스더에게 전했다. "너는 왕궁에 있으니 모든 유다인 중에 홀로 목숨을 건지리라 생각하지 말라… 네가 왕후의 자리를 얻은 것이 이 때를 위함이 아닌지 누가 알겠느냐" (4:13-14). 사마리아와 이두매에서도 조서를 기다리는 자들이 칼을 간다.',
    choices: [
      { label: '사흘 금식하고 에스더가 부름 없이 왕 앞에 나아간다', run: G => {
        INTER_KIT.enter(G, '하만', 'persia'); G.kill('하만');
        const r1 = INTER_KIT.raid(G, 'samaria_gov', 3000), r2 = INTER_KIT.raid(G, 'idumea', 2000);
        G.buff('army', 'atk', 4, 0.3); INTER_KIT.cut(G, 'samaria_gov', 0.8); INTER_KIT.cut(G, 'idumea', 0.8);
        INTER_KIT.enter(G, '에스더'); INTER_KIT.enter(G, '모르드개'); G.rel('army', 'persia', 10);
        INTER_KIT.faithAll(G, 10, 5); G.flags.purim = true; G.kingdom(4, '이 때를 위함이라');
        return '"죽으면 죽으리이다" (4:16). 에스더의 잔치에서 하만의 음모가 드러나 그는 모르드개를 매달려던 나무에 달렸다 (7:10). 새 조서로 유다인이 스스로 생명을 보호하게 되었다 — 4턴 동안 공격력 +30%. ' + [r1, r2].filter(Boolean).map(x => '아달월 십삼일: ' + x).join(' ') + ' 사마리아·이두매 병력 20% 손실. 에스더와 모르드개는 수산에 남았으나, 이 게임에서는 하나님의 군대에 이름을 올린다. 신앙 +10, 민심 +5. "슬픔이 변하여 기쁨이 되고 애통이 변하여 길한 날이 되었으니" (9:22) — 부림절.'; } },
      { label: '왕후의 자리에서 잠잠히 기다린다', run: G => {
        INTER_KIT.enter(G, '하만', 'persia'); G.kill('하만');
        const r1 = INTER_KIT.raid(G, 'samaria_gov', 4000), r2 = INTER_KIT.raid(G, 'idumea', 3000);
        INTER_KIT.enter(G, '모르드개'); INTER_KIT.faithAll(G, -5); G.flags.purim = true;
        return '"네가 만일 이 때에 잠잠하여 말이 없으면 유다인은 다른 데로 말미암아 놓임과 구원을 얻으려니와" (4:14). 구원은 왔지만 더 많은 피를 흘렸다. ' + [r1, r2].filter(Boolean).join(' ') + ' 신앙 -5. 모르드개가 합류했다. 성경의 역사에서 에스더는 목숨을 걸고 나아갔다.'; } },
    ] },
  // ---- 4장: 에스라와 느헤미야 ----
  { id: 'ezra', who: 'army', auto: 0,
    cond: G => G.turn >= 16 && G.done.purim && G.exists('army'),
    title: '에스라의 귀환과 율법책 (BC 458)', ref: '스 7:1-28; 느 8:1-12',
    text: '아닥사스다 왕 제칠년에 학사 에스라가 바벨론에서 올라왔다. "에스라가 여호와의 율법을 연구하여 준행하며 이스라엘에게 율례와 규례를 가르치기로 결심하였었더라" (7:10). 왕은 은금과 제물과 함께 "네 하나님의 율법을 알지 못하는 자는 너희가 가르치라"는 조서를 주었다. 훗날 수문 앞 광장에서 에스라가 새벽부터 정오까지 율법책을 읽자 온 백성이 울었다. "여호와로 인하여 기뻐하는 것이 너희의 힘이니라" (느 8:10).',
    choices: [
      { label: '에스라를 세워 율법을 읽고 가르치게 한다', run: G => {
        ['스룹바벨', '대제사장 여호수아', '세스바살'].forEach(n => G.kill(n));
        const e = INTER_KIT.lead(G, '에스라');
        if (G.exists('persia')) { G.kill('아하수에로'); INTER_KIT.lead(G, '아닥사스다 1세', 'persia'); }
        G.item('army', 'torah_scroll', 1); G.fac('army').gold += 1000; INTER_KIT.faithAll(G, 12); INTER_KIT.add(G, 1500);
        G.flags.ezra = true; G.kingdom(3, '율법을 연구하여 준행하며');
        return '스룹바벨과 대제사장 여호수아와 세스바살이 조상들에게로 돌아갔다. ' + (e ? '에스라가 하나님의 군대를 이끈다. ' : '') + '아닥사스다 1세가 바사 왕이 되었다. 율법 두루마리 1개, 금 +1000, 에스라와 함께 올라온 자들로 본거지 병력 +1500, 신앙 +12.'; } },
    ] },
  { id: 'nehemiah', who: 'army', auto: 0,
    cond: G => G.turn >= 17 && G.done.ezra && G.exists('army'),
    title: '술 맡은 관원 느헤미야 (BC 445)', ref: '느 1:1–2:20',
    text: '수산 궁에서 왕의 술 맡은 관원 느헤미야가 예루살렘 성벽이 무너지고 성문들이 불탔다는 소식을 듣고 앉아서 울고 여러 날 금식하며 기도했다. 넉 달 뒤 왕이 물었다. "네가 병이 없거늘 어찌하여 얼굴에 수심이 있느냐." 느헤미야가 하늘의 하나님께 묵도하고 대답했다 (2:2-4). 왕이 조서와 군대 장관과 마병을 주고, 왕의 삼림 감독 아삽에게 성문과 성곽에 쓸 들보 재목을 주라고 명했다.',
    choices: [
      { label: '밤에 몰래 성벽을 살피고 "일어나 건축하자" 외친다', run: G => {
        const n = INTER_KIT.lead(G, '느헤미야');
        G.res('army', { wood: 2500, stone: 1500 }); INTER_KIT.add(G, 1200); G.rel('army', 'persia', 8);
        const j = G.city('jerusalem'); if (j && j.owner === 'army') j.def += 8;
        G.rel('army', 'samaria_gov', -15); G.flags.nehemiah = true;
        return (n ? '느헤미야가 총독으로 하나님의 군대를 이끈다(에스라는 곁에서 율법을 가르친다). ' : '') + '왕의 삼림에서 재목이 왔다 — 목재 +2500, 석재 +1500, 왕의 마병으로 병력 +1200, 예루살렘 성벽 +8. "하늘의 하나님이 우리를 형통하게 하시리니 그의 종들인 우리가 일어나 건축하려니와" (2:20). 산발랏과 도비야가 "심히 근심하였다" (2:10) — 사마리아와의 관계 -15.'; } },
    ] },
  { id: 'sanballat', who: 'army', auto: 0,
    cond: G => G.turn >= 19 && G.done.nehemiah && G.exists('army'),
    title: '한 손에는 일감, 한 손에는 병기 — 오십이 일', ref: '느 4:1-23; 6:1-16',
    text: '산발랏과 도비야와 아라비아 사람들과 암몬 사람들과 아스돗 사람들이 성벽이 올라간다는 말을 듣고 크게 분노하여 함께 꾀했다 (4:7-8). 느헤미야가 백성을 가문별로 세웠다. "너희는 그들을 두려워하지 말고 지극히 크시고 두려우신 주를 기억하고… 우리 하나님이 우리를 위하여 싸우시리라" (4:14, 20). 산발랏과 게셈은 오노 평지에서 만나자고 네 번이나 사람을 보냈다.',
    choices: [
      { label: '"내가 이제 큰 역사를 하니 내려가지 못하겠노라" — 칼을 차고 성벽을 쌓는다', run: G => {
        const r = INTER_KIT.raid(G, 'samaria_gov', 5000, 'jerusalem');
        const j = G.city('jerusalem'); if (j && j.owner === 'army') { j.def += 20; j.loy += 10; }
        G.buff('army', 'atk', 4, 0.2); G.buff('samaria_gov', 'atk', 3, -0.2); INTER_KIT.faithAll(G, 8);
        G.rel('army', 'samaria_gov', -20); G.rel('army', 'nabatea', -15); G.rel('army', 'philistia', -15);
        G.flags.wall52 = true; G.kingdom(4, '오십이 일');
        return (r ? `산발랏의 공격: ${r} ` : '') + '"건축하는 자는 각각 허리에 칼을 차고 건축하며" (4:18). 예루살렘 성벽 +20, 민심 +10, 신앙 +8, 4턴 동안 공격력 +20%, 사마리아 3턴 동안 -20%. "성벽 역사가 오십이 일 만인 엘룰월 이십오일에 끝나매… 이 역사를 우리 하나님께서 이루신 것을 앎이니라" (6:15-16).'; } },
      { label: '오노 평지로 내려가 담판한다', run: G => {
        const h = INTER_KIT.home(G); if (h) h.soldiers = Math.floor(h.soldiers * 0.75);
        const j = G.city('jerusalem'); if (j && j.owner === 'army') j.def += 8;
        G.flags.wall52 = true; INTER_KIT.faithAll(G, -4);
        return '"그들이 실상은 나를 해하고자 함이었더라" (6:2). 매복에 걸려 본거지 병력 25%를 잃고 돌아왔다. 공사가 늦어져 성벽은 +8에 그쳤다. 신앙 -4.'; } },
    ] },
  { id: 'malachi', who: 'army', auto: 0,
    cond: G => G.turn >= 21 && G.done.sanballat && G.exists('army'),
    title: '말라기 — 그리고 사백 년의 침묵', ref: '말 1:2; 3:1; 4:2, 5-6; 느 13:4-31',
    text: '느헤미야가 두 번째로 돌아와 보니 도비야가 성전 방을 차지했고, 레위 사람들은 몫을 받지 못해 밭으로 돌아갔고, 안식일에 두로 사람들이 생선을 팔고 있었다 (느 13장). 마지막 선지자 말라기가 외쳤다. "내가 너희를 사랑하였노라 하나 너희는 이르기를 주께서 어떻게 우리를 사랑하셨나이까 하는도다" (말 1:2). 그리고 약속을 남겼다. "보라 여호와의 크고 두려운 날이 이르기 전에 내가 선지자 엘리야를 너희에게 보내리니" (4:5). 그 뒤 사백 년 동안 선지자의 음성이 들리지 않았다.',
    choices: [
      { label: '도비야의 세간을 성전 방에서 내던지고 말씀을 기다린다', run: G => {
        INTER_KIT.enter(G, '말라기');
        INTER_KIT.lead(G, '말라기');
        G.rel('army', 'samaria_gov', -10); INTER_KIT.faithAll(G, 10, 5); G.fac('army').food += 2000;
        G.flags.malachi = true; G.kingdom(2, '의로운 해가 떠오르리니');
        return '도비야의 세간을 방 밖으로 내던지고 방을 정결하게 했다 (느 13:8-9). 레위 사람들의 몫을 돌려주고 안식일에 성문을 닫았다. 신앙 +10, 민심 +5, 식량 +2000. 말라기가 하나님의 군대를 이끈다. 성경의 역사에서 학개·스가랴·다니엘·에스더·모르드개·에스라·느헤미야는 이 무렵까지 모두 세상을 떠났다. 이 게임에서는 그들이 선지자 없는 세월 동안 하나님의 군대의 원로로 남아 있다가, 마카비 형제들이 일어설 때 물러난다. "내 이름을 경외하는 너희에게는 공의로운 해가 떠올라서 치료하는 광선을 비추리니" (말 4:2).'; } },
    ] },
  // ---- 5장: 헬라와 마카비 ----
  { id: 'alexander', who: 'army', auto: 0,
    cond: G => G.turn >= 23 && G.done.malachi && G.exists('army'),
    title: '털이 많은 숫염소 — 알렉산더 (BC 334–331)', ref: '단 8:5-8, 21; 슥 9:1-8; 요세푸스, 유대 고대사 11권',
    text: '다니엘이 이백 년 전에 보았다. "한 숫염소가 서쪽에서부터 와서 온 지면에 두루 다니되 땅에 닿지 아니하며 그 염소의 두 눈 사이에는 현저한 뿔이 있더라… 털이 많은 숫염소는 곧 헬라 왕이요" (단 8:5, 21). 마게도냐의 알렉산더가 BC 334 헬레스폰트를 건넜다. 잇수스에서 다리오 3세를 꺾고, 일곱 달 동안 바다 가운데 섬 두로를 둑을 쌓아 무너뜨렸다 — "두로는 자기를 위하여 요새를 건축하며… 주께서 그를 정복하시며 그의 권세를 바다에 치시리니" (슥 9:3-4). 가사도 두 달 만에 무너졌다. 요세푸스는 대제사장 얏두아가 흰 옷을 입고 나가 그를 맞았고 알렉산더가 다니엘서를 보고 예루살렘을 해치지 않았다고 전한다 (전승).',
    choices: [
      { label: '대제사장 얏두아가 성문을 열고 맞으러 나간다 (요세푸스의 전승)', run: G => {
        const t = INTER_KIT.macedon(G);
        INTER_KIT.lead(G, '얏두아'); G.kill('말라기');
        if (G.exists('greece')) G.rel('army', 'greece', 55);
        INTER_KIT.faithAll(G, 5); G.flags.alexander = true;
        return t + ' 얏두아가 하나님의 군대를 이끈다. 헬라와의 관계 +55 — 알렉산더는 예루살렘을 지나갔다. 신앙 +5.'; } },
      { label: '성문을 닫고 두로처럼 버틴다', run: G => {
        const t = INTER_KIT.macedon(G);
        INTER_KIT.lead(G, '얏두아'); G.kill('말라기');
        const r = INTER_KIT.raid(G, 'greece', 7000); G.flags.alexander = true;
        return t + ' 얏두아가 하나님의 군대를 이끈다.' + (r ? ' 알렉산더의 군대가 왔다: ' + r : '');
      } },
    ] },
  { id: 'diadochi', who: 'army', auto: 0,
    cond: G => G.turn >= 26 && G.done.alexander && G.exists('army'),
    title: '큰 뿔이 꺾이고 네 뿔이 나다 (BC 323–301)', ref: '단 8:8, 22; 11:3-6',
    text: '알렉산더는 서른두 살에 바벨론에서 열병으로 죽었다(BC 323). "숫염소가 스스로 심히 강대하여 가더니 강성할 때에 그 큰 뿔이 꺾이고 그 대신에 현저한 뿔 넷이 하늘 사방을 향하여 났더라" (단 8:8). "그의 나라가 갈라져 천하 사방에 나누일 것이나 그의 자손에게로 돌아가지도 아니할 것이요" (11:4). 장군들이 스무 해를 싸운 끝에 애굽은 프톨레마이오스가, 바벨론과 수리아는 셀레우코스가, 마게도냐는 카산드로스가 차지했다. 셀레우코스는 오론테스 강가에 새 도읍 안디옥을 세웠다(BC 300). 유다 땅은 백 년 동안 프톨레마이오스의 손에 있었다.',
    choices: [
      { label: '갈라진 제국 사이에서 성읍을 지킨다', run: G => {
        const t = INTER_KIT.split(G);
        INTER_KIT.faithAll(G, 4); G.eachCity('army', c => { c.def += 5; }); G.flags.diadochi = true;
        return t + ' 모든 성 성벽 +5, 신앙 +4.'; } },
    ] },
  { id: 'septuagint', who: 'army', auto: 0,
    cond: G => G.turn >= 28 && G.done.diadochi && G.exists('army') && G.exists('ptolemy'),
    title: '알렉산드리아의 율법책 — 칠십인역', ref: '아리스테아스의 편지 (전승); 행 8:28-35',
    text: '애굽의 알렉산드리아에는 많은 유대인이 살았고, 그들은 히브리어보다 헬라어가 익숙해졌다. 프톨레마이오스 2세 시대(BC 3세기)에 율법이 헬라어로 옮겨지기 시작했다 — "칠십인역"이다. 왕이 각 지파에서 여섯 명씩 일흔두 명의 장로를 불러 번역하게 했다는 이야기는 "아리스테아스의 편지"가 전하는 전승이다. 훗날 에디오피아 내시가 수레에서 읽은 이사야서, 바울과 사도들이 인용한 성경의 많은 부분이 이 헬라어 번역이었다.',
    choices: [
      { label: '율법에 능한 장로들을 알렉산드리아로 보낸다', run: G => {
        INTER_KIT.lead(G, '프톨레마이오스 2세', 'ptolemy'); G.kill('프톨레마이오스 1세');
        G.rel('army', 'ptolemy', 25); INTER_KIT.faithAll(G, 5); G.fac('army').gold += 800; G.flags.septuagint = true; G.kingdom(2, '열방의 말로 된 율법');
        return '프톨레마이오스 2세가 애굽의 왕이 되었다. 프톨레마이오스와의 관계 +25, 왕의 예물 금 +800, 신앙 +5. 이제 헬라 말을 쓰는 온 세상이 율법과 선지자를 읽을 수 있게 되었다 — 복음이 달려갈 길이 닦였다.'; } },
      { label: '거룩한 말을 이방 말로 옮길 수 없다며 거절한다', run: G => {
        INTER_KIT.lead(G, '프톨레마이오스 2세', 'ptolemy'); G.kill('프톨레마이오스 1세');
        G.rel('army', 'ptolemy', -10); INTER_KIT.faithAll(G, 2); G.flags.septuagint = true;
        return '프톨레마이오스와의 관계 -10. 그래도 알렉산드리아의 유대인들은 스스로 율법을 헬라어로 옮겼다.'; } },
    ] },
  { id: 'panium', who: 'army', auto: 0,
    cond: G => G.turn >= 30 && G.done.diadochi && G.exists('army'),
    title: '바니아스 전투 — 북방 왕이 영화로운 땅에 서다 (BC 200)', ref: '단 11:10-19; 집회서 50:1-4 (외경); 요세푸스, 유대 고대사 12권',
    text: '"북방 왕은 와서 토성을 쌓고 견고한 성읍을 점령할 것이라 남방 군대가 그를 당할 수 없으며… 그가 영화로운 땅에 설 것이요" (단 11:15-16). 셀레우코스 왕 안티오쿠스 3세가 요단 발원지 바니아스(단 근처)에서 프톨레마이오스의 장군 스코파스를 꺾었다. 유다 땅이 셀레우코스의 손에 넘어갔다. 요세푸스는 안티오쿠스 3세가 예루살렘에 세금을 덜어 주고 성전 제사를 돕는 칙령을 내렸다고 전한다. 그 무렵 대제사장은 "구름 사이의 샛별 같던" 의인 시몬이었다 (집회서 50:6, 외경).',
    choices: [
      { label: '의인 시몬이 성전과 성벽을 보수한다', run: G => {
        const t = INTER_KIT.panium(G);
        INTER_KIT.lead(G, '의인 시몬'); G.kill('얏두아');
        const j = G.city('jerusalem'); if (j && j.owner === 'army') { j.def += 10; j.faith += 10; }
        if (G.exists('seleucid')) G.rel('army', 'seleucid', 25); G.fac('army').gold += 600; G.flags.panium = true;
        return t + ' 의인 시몬이 하나님의 군대를 이끈다 — 예루살렘 성벽 +10, 신앙 +10, 안티오쿠스 3세의 칙령으로 금 +600, 셀레우코스와의 관계 +25. 그러나 BC 190 안티오쿠스 3세는 마그네시아에서 로마에 크게 졌다 (단 11:18-19).'; } },
    ] },
  { id: 'hellenism', who: 'army', auto: 0,
    cond: G => G.turn >= 32 && G.done.panium && G.exists('army'),
    title: '예루살렘의 체육관 (BC 175)', ref: '단 11:21-24; 마카비1서 1:10-15 (외경); 마카비2서 4:7-17 (외경)',
    text: '안티오쿠스 4세가 왕이 되었다. "그의 왕위를 이을 자는 한 비천한 사람이라… 그가 평안한 때에 속임수로 그 나라를 얻을 것이며" (단 11:21). 대제사장 오니아스 3세의 동생 야손이 왕에게 돈을 바치고 대제사장 자리를 사서 예루살렘에 헬라식 체육관을 세웠다. 젊은 제사장들이 제단을 버려두고 원반던지기 신호가 울리면 체육관으로 달려갔다 (마카비2서 4:14, 외경). 이어서 메넬라오스가 더 많은 돈으로 그 자리를 샀다.',
    choices: [
      { label: '오니아스 3세와 함께 헬라의 길을 거부한다', run: G => {
        INTER_KIT.hellenize(G); INTER_KIT.lead(G, '오니아스 3세'); G.kill('의인 시몬');
        INTER_KIT.faithAll(G, 10); G.rel('army', 'seleucid', -25); G.flags.hellenism = true; G.kingdom(2, '조상의 길');
        return '안티오쿠스 4세가 셀레우코스 왕이 되었다. 오니아스 3세가 하나님의 군대를 이끈다. 신앙 +10, 셀레우코스와의 관계 -25. "오직 자기의 하나님을 아는 백성은 강하여 용맹을 떨치리라" (단 11:32).'; } },
      { label: '체육관을 세우고 왕의 친구가 된다', run: G => {
        INTER_KIT.hellenize(G); INTER_KIT.lead(G, '오니아스 3세'); G.kill('의인 시몬');
        G.fac('army').gold += 1000; INTER_KIT.faithAll(G, -15); G.rel('army', 'seleucid', 15); G.flags.hellenism = true; G.kingdom(-2, '헬라의 길');
        return '안티오쿠스 4세가 셀레우코스 왕이 되었다. 금 +1000, 셀레우코스와의 관계 +15. 그러나 제사장들이 제단을 버려두었다 — 신앙 -15. 성경의 역사에서 이 길은 성전 모독으로 이어졌다.'; } },
    ] },
  { id: 'eleusis', who: 'seleucid', auto: 0,
    cond: G => G.turn >= 34 && G.done.hellenism && INTER_KIT.live(G, 'seleucid'),
    title: '깃딤의 배 — 엘레우시스의 원 (BC 168)', ref: '단 11:25-30; 폴리비오스, 역사 29권',
    text: '안티오쿠스 4세가 두 번째로 애굽을 치러 가 알렉산드리아 앞 엘레우시스에 이르렀을 때, 로마 원로원의 사절 포필리우스 라이나스가 그를 맞았다. 그가 지팡이로 왕의 둘레에 원을 그리고 말했다. "이 원을 나서기 전에 대답하시오." 같은 해 로마는 피드나에서 마게도냐를 무너뜨렸다. 다니엘이 예언했다. "깃딤의 배들이 이르러 그를 칠 것이므로 그가 낙심하고 돌아가서 맹렬히 거룩한 언약에 대하여 분노하고" (단 11:30).',
    choices: [
      { label: '로마의 요구에 굴복하고 물러난다', run: G => {
        const t = INTER_KIT.romeRise(G);
        if (!G.exists('seleucid')) { G.flags.eleusis = true; return t; }
        G.buff('seleucid', 'atk', 4, 0.2); G.fac('seleucid').aggr = 0.45; G.rel('army', 'seleucid', -20);
        G.flags.eleusis = true;
        return t + ' 치욕을 당한 안티오쿠스는 분노를 예루살렘으로 돌렸다 — 셀레우코스 4턴 동안 공격력 +20%, 관계 -20.'; } },
    ] },
  { id: 'abomination', who: 'seleucid', auto: 0,
    cond: G => G.turn >= 35 && G.done.eleusis && INTER_KIT.live(G, 'seleucid'),
    title: '멸망의 가증한 것 (BC 167)', ref: '단 11:31; 마카비1서 1:20-64 (외경); 마 24:15',
    text: '왕이 보낸 징세 장관 아폴로니우스가 안식일에 예루살렘을 쳤다. 그들이 다윗 성에 높은 성벽과 망대를 쌓아 "아크라" 요새로 삼았다. 왕은 온 나라에 한 백성이 되라 명하고 안식일과 할례와 율법책을 금했다. 기슬르월 십오일, 번제단 위에 "멸망의 가증한 것"이 세워졌다. "군대는 그의 편에 서서 성소 곧 견고한 곳을 더럽히며 매일 드리는 제사를 폐하며 멸망하게 하는 가증한 것을 세울 것이며" (단 11:31). 대제사장 오니아스 3세는 이미 안디옥 근처에서 살해되었다.',
    choices: [
      { label: '예루살렘을 쳐서 성소를 더럽힌다', run: G => {
        ['아폴로니우스', '세론', '고르기아스', '니가노르', '리시아스', '바키데스', '코끼리 부대장'].forEach(n => INTER_KIT.enter(G, n, 'seleucid'));
        G.kill('오니아스 3세');
        const r = INTER_KIT.raid(G, 'seleucid', 9000, INTER_KIT.mine(G, 'jerusalem') ? 'jerusalem' : null);
        const j = G.city('jerusalem');
        if (j && j.owner === 'army') { j.faith = Math.max(0, j.faith - 30); j.loy -= 10; if (j.bld && j.bld.temple > 2) j.bld.temple -= 1; }
        INTER_KIT.faithAll(G, -5); G.flags.abomination = true;
        return (r ? `아폴로니우스의 습격: ${r} ` : '') + (j && j.owner === 'army' ? '성은 버텼으나 아크라 요새의 수비대와 왕의 칙령이 성소를 더럽혔다 — 예루살렘 신앙 -30, 성전 Lv.-1. ' : '예루살렘이 셀레우코스의 손에 넘어갔다. ') + '하나님의 군대 모든 성 신앙 -5. 리시아스·바키데스·니가노르·고르기아스 같은 장군들이 셀레우코스에 모였다. 예수께서 이 일을 기억하게 하셨다 — "멸망의 가증한 것이 거룩한 곳에 선 것을 보거든" (마 24:15).'; } },
    ] },
  { id: 'martyrs', who: 'army', auto: 0,
    cond: G => G.turn >= 36 && G.done.abomination && G.exists('army'),
    title: '엘르아살 노인과 일곱 아들의 어머니', ref: '마카비2서 6:18–7:41 (외경); 히 11:35-36; 단 12:2',
    text: '아흔 살 서기관 엘르아살은 억지로 돼지고기를 먹으라는 명령을 받았다. 친구들이 먹는 척만 하라고 권했지만 그는 거절했다. "이 나이에 거짓으로 꾸미는 것은 합당하지 않다. 젊은이들이 나 때문에 미혹될 것이다." 얼마 뒤 일곱 형제와 어머니가 같은 명령 앞에 섰다. 어머니는 막내에게 말했다. "하늘과 땅을 보아라. 하나님께서 없는 데서 이 모든 것을 만드셨다" (마카비2서 7:28, 외경). "어떤 이들은 더 좋은 부활을 얻고자 하여 악형을 받되 구차히 풀려나기를 원하지 아니하였으며" (히 11:35).',
    choices: [
      { label: '그들의 증언을 전하며 부활의 소망을 붙든다', run: G => {
        G.kill('엘르아살 노인'); G.kill('일곱 아들의 어머니'); INTER_KIT.faithAll(G, 12, 5);
        G.flags.martyrs = true; G.kingdom(3, '더 좋은 부활');
        return '엘르아살 노인과 일곱 아들의 어머니가 순교했다. 신앙 +12, 민심 +5. "땅의 티끌 가운데에서 자는 자 중에 많은 사람이 깨어나 영생을 받는 자도 있겠고" (단 12:2).'; } },
      { label: '슬픔을 딛고 칼을 간다', run: G => {
        G.kill('엘르아살 노인'); G.kill('일곱 아들의 어머니'); INTER_KIT.faithAll(G, 5); G.buff('army', 'atk', 3, 0.2);
        G.flags.martyrs = true;
        return '엘르아살 노인과 일곱 아들의 어머니가 순교했다. 신앙 +5, 3턴 동안 공격력 +20%. 그러나 원수 갚는 것은 여호와께 속했다 (롬 12:19).'; } },
    ] },
  { id: 'modein', who: 'army', auto: 0,
    cond: G => G.turn >= 37 && (G.done.abomination || G.turn >= 41) && G.exists('army'),
    title: '모데인의 제단과 안식일의 결단', ref: '마카비1서 2:1-48 (외경); 단 11:32; 막 2:27',
    text: '왕의 관리들이 모데인에 와서 이방 제단을 쌓고 제사장 맛다디아에게 먼저 제물을 바치라고 했다. "나와 내 아들들과 내 형제들은 우리 조상들의 언약을 따라 살겠소." 한 유다 사람이 제물을 바치러 나서자 맛다디아가 그와 왕의 관리를 치고 제단을 허물며 외쳤다. "율법에 열심이 있고 언약을 지키려는 사람은 모두 나를 따르라!" (마카비1서 2:19-27, 외경). 광야의 굴에 숨은 천 명이 안식일에 공격을 받고 손을 들지 않은 채 죽었다는 소식이 왔다. 율법에 목숨을 건 하시딤의 무리가 찾아왔다.',
    choices: [
      { label: '"안식일이라도 우리를 치러 오면 맞서 싸우자" — 하시딤을 맞는다', run: G => {
        INTER_KIT.hasmon(G); G.eachCity('army', c => { c.train += 12; }); INTER_KIT.add(G, 1500);
        G.buff('army', 'atk', 4, 0.2); G.flags.modein = true; G.kingdom(2, '언약을 따라 살겠다');
        return '원로로 남아 있던 옛 세대가 물러나고, 맛다디아와 다섯 아들 — 요한·시몬·유다·엘르아살·요나단 — 과 하시딤 장로가 하나님의 군대에 모였다. 맛다디아가 이끈다. 모든 성 훈련 +12, 본거지 병력 +1500, 4턴 동안 공격력 +20%. 훗날 예수께서 말씀하셨다. "안식일은 사람을 위하여 있는 것이요 사람이 안식일을 위하여 있는 것이 아니니" (막 2:27).'; } },
      { label: '안식일에는 끝내 손을 들지 않는다', run: G => {
        INTER_KIT.hasmon(G); const h = INTER_KIT.home(G); if (h) h.soldiers = Math.floor(h.soldiers * 0.75);
        INTER_KIT.faithAll(G, 8); G.buff('seleucid', 'atk', 3, 0.15); G.flags.modein = true;
        return '맛다디아와 다섯 아들과 하시딤 장로가 하나님의 군대에 모였다. 안식일마다 적이 찾아와 본거지 병력 25%가 희생되었다. 신앙 +8. 그들은 순전했으나, 율법을 주신 분은 생명을 지키라고 하셨다 (레 18:5).'; } },
    ] },
  { id: 'bethHoron', who: 'army', auto: 0,
    cond: G => G.turn >= 38 && G.done.modein && G.exists('army'),
    title: '맛다디아의 유언과 벧호론 비탈', ref: '마카비1서 2:49-70; 3:10-26 (외경); 수 1:9; 삼상 14:6',
    text: '맛다디아가 죽을 때 아들들에게 말했다. "율법을 위하여 열심을 내고 조상들의 언약을 위하여 목숨을 바쳐라. 시몬은 지혜로운 사람이니 아버지로 여기고, 유다 마카비는 어려서부터 용사였으니 군대의 장관이 되게 하라." 곧 사마리아의 장관 아폴로니우스와 수리아 군대 장관 세론이 벧호론 비탈을 올라왔다. 유다가 말했다. "전쟁의 승리는 군대의 많음에 있지 않고 하늘로부터 오는 힘에 있다" (마카비1서 3:19, 외경).',
    choices: [
      { label: '유다 마카비를 세우고 비탈 위에서 적은 무리로 덮친다', run: G => {
        G.kill('맛다디아'); INTER_KIT.lead(G, '유다 마카비') || INTER_KIT.lead(G, '시몬') || INTER_KIT.lead(G, '요나단');
        const r = INTER_KIT.raid(G, 'seleucid', 3000);
        G.kill('아폴로니우스'); G.kill('세론'); INTER_KIT.cut(G, 'seleucid', 0.7, ['shechem', 'bethel', 'samaria', 'gezer', 'emmaus', 'modein', 'jerusalem']);
        G.buff('army', 'atk', 4, 0.25); G.item('army', 'shield', 1); G.fac('army').gold += 500;
        G.flags.hammer = true; G.kingdom(3, '하늘로부터 오는 힘');
        return '맛다디아가 세상을 떠났다. 유다 마카비가 하나님의 군대를 이끈다. ' + (r ? `적의 진격: ${r} ` : '') + '유다가 아폴로니우스를 쳐서 그 칼을 빼앗아 평생 그것으로 싸웠고, 벧호론 비탈에서 세론의 군대가 무너졌다. 유다 땅 근처의 셀레우코스 군 30% 궤멸, 4턴 동안 공격력 +25%, 큰 방패와 전리품 금 +500. "여호와의 구원은 사람이 많고 적음에 달리지 아니하였느니라" (삼상 14:6).'; } },
    ] },
  { id: 'emmaus', who: 'army', auto: 0,
    cond: G => G.turn >= 39 && G.done.bethHoron && G.exists('army'),
    title: '미스바의 금식과 엠마오의 밤', ref: '마카비1서 3:38–4:25 (외경); 대하 20:12; 신 20:8',
    text: '섭정 리시아스가 니가노르와 고르기아스에게 보병 사만과 기병 칠천을 주어 엠마오에 진을 치게 했다. 유다와 형제들은 미스바에 모여 금식하고 율법책을 펴 놓고 부르짖었다. 유다는 집을 짓는 자, 새로 장가든 자, 포도원을 심은 자, 두려워하는 자를 모두 집으로 돌려보냈다 (신 20:5-8). 그날 밤 고르기아스가 보병 오천과 기병 천으로 유다의 진을 기습하러 떠났다.',
    choices: [
      { label: '진에 불만 남겨 두고 밤새 엠마오의 본진으로 간다', run: G => {
        const h = INTER_KIT.home(G); if (h) h.soldiers = Math.floor(h.soldiers * 0.9);
        INTER_KIT.cut(G, 'seleucid', 0.4, ['emmaus']); INTER_KIT.cut(G, 'seleucid', 0.8, ['jerusalem', 'bethlehem', 'gezer', 'modein']);
        G.buff('army', 'atk', 4, 0.35); INTER_KIT.faithAll(G, 10); G.item('army', 'trumpet', 1);
        G.fac('army').gold += 600; G.flags.mizpah = true; G.kingdom(3, '오직 주만 바라보나이다');
        return '두려워하는 자들이 돌아가 본거지 병력 10%가 줄었다. 새벽에 나팔을 불며 엠마오의 본진을 치자 엠마오의 셀레우코스 군 60%가 무너졌고, 빈 진을 친 고르기아스의 군대는 연기를 보고 흩어졌다. 4턴 동안 공격력 +35%, 신앙 +10, 양각 나팔과 노획한 금 +600. 그들은 돌아오며 "그는 선하시며 그의 인자하심이 영원하도다" 찬송했다 (마카비1서 4:24, 외경; 시 136:1). 이제 성전으로!'; } },
      { label: '진을 굳게 지키며 고르기아스를 기다린다', run: G => {
        const r = INTER_KIT.raid(G, 'seleucid', 3500); G.buff('army', 'atk', 2, 0.1); G.flags.mizpah = true;
        return (r ? `고르기아스의 기습: ${r} ` : '') + '밤새 진을 지켰다. 2턴 동안 공격력 +10%.'; } },
    ] },
  { id: 'dedication', who: 'army', auto: 0,
    cond: G => G.turn >= 40 && G.done.emmaus && G.exists('army') && INTER_KIT.mine(G, 'jerusalem'),
    title: '성전 봉헌 — 수전절 (BC 164)', ref: '마카비1서 4:36-61 (외경); 요 10:22-23',
    text: '유다와 형제들이 시온 산에 올라 보니 성소는 황폐하고 제단은 더럽혀졌으며 문들은 불탔고 뜰에는 풀이 수풀처럼 자라 있었다. 유다는 아크라 요새의 수비대를 막게 하고 율법에 흠 없는 제사장들을 뽑아 성소를 정결하게 했다. 더럽혀진 제단의 돌은 "예언자가 나타나 그 돌들에 대해 알려 줄 때까지" 성전 산 한 곳에 쌓아 두었다 (4:46). 새 등잔대를 들여놓고 불을 켜니 성전 안이 밝아졌다 (4:50). 기슬르월 이십오일, 새 제단 위에서 다시 번제가 올라갔다.',
    choices: [
      { label: '성소를 정결하게 하고 여드레 동안 봉헌한다', run: G => {
        const c = G.city('jerusalem'); c.faith += 30; c.loy += 15; c.def += 10;
        c.bld = c.bld || {}; c.bld.temple = Math.min(10, (c.bld.temple || 1) + 1);
        INTER_KIT.faithAll(G, 10); G.item('army', 'tabernacle_lamp', 1);
        G.flags.hanukkah = G.turn; G.kingdom(5, '성전 봉헌');
        return '예루살렘 신앙 +30, 민심 +15, 성벽 +10, 성전 Lv.+1, 모든 성 신앙 +10, 성막의 등잔 1개. 해마다 기슬르월 이십오일부터 여드레 동안 이 날을 기뻐하기로 정했다 — 수전절이다. "예루살렘에 수전절이 이르니 때는 겨울이라 예수께서 성전 안 솔로몬 행각에서 거니시니" (요 10:22-23). 기름 한 병이 여드레 동안 탔다는 이야기는 후대 랍비 문헌(탈무드)의 전승으로, 마카비서에는 나오지 않는다.'; } },
    ] },
  // ---- 6장: 독립과 로마 ----
  { id: 'elephants', who: 'army', auto: 0,
    cond: G => G.turn >= 42 && G.done.dedication && G.exists('army'),
    title: '안티오쿠스의 죽음과 벧스가랴의 코끼리', ref: '마카비1서 6:1-63 (외경); 단 8:25; 요 15:13',
    text: '동방을 돌던 안티오쿠스 4세가 병들어 죽으며 말했다. "내가 예루살렘에서 행한 악을 이제 기억한다" (마카비1서 6:12, 외경). "그가 사람의 손으로 말미암지 아니하고 깨지리라" (단 8:25). 섭정 리시아스가 어린 왕을 모시고 보병 십만, 기병 이만, 싸움 코끼리 서른두 마리를 이끌고 왔다. 벧스가랴에서 맛다디아의 넷째 아들 엘르아살은 왕의 갑옷을 입은 가장 높은 코끼리를 보았다.',
    choices: [
      { label: '엘르아살이 그 코끼리 밑으로 뛰어든다', run: G => {
        G.kill('안티오쿠스 4세'); if (G.exists('seleucid')) INTER_KIT.lead(G, '리시아스', 'seleucid');
        G.kill('엘르아살'); G.kill('코끼리 부대장');
        const r = INTER_KIT.raid(G, 'seleucid', 5000);
        G.buff('seleucid', 'atk', 3, -0.2); G.rel('army', 'seleucid', 35); INTER_KIT.faithAll(G, 8);
        G.flags.lysiasPeace = true; G.kingdom(3, '친구를 위하여 목숨을');
        return '안티오쿠스 4세가 죽었다. ' + (r ? `벧스가랴의 싸움: ${r} ` : '') + '엘르아살이 코끼리 배 밑에서 창으로 찔렀고, 코끼리가 쓰러지며 그를 덮쳤다. 그때 리시아스가 안디옥의 반란 소식을 듣고 화평을 청했다. "그들이 자기 율법대로 살게 하자" (6:59). 셀레우코스와의 관계 +35, 3턴 동안 공격력 -20%, 신앙 +8. "사람이 친구를 위하여 자기 목숨을 버리면 이보다 더 큰 사랑이 없나니" (요 15:13).'; } },
      { label: '엘르아살을 붙잡고 벧스가랴에서 물러난다', run: G => {
        G.kill('안티오쿠스 4세'); if (G.exists('seleucid')) INTER_KIT.lead(G, '리시아스', 'seleucid');
        G.eachCity('army', c => { c.soldiers = Math.floor(c.soldiers * 0.85); }); G.rel('army', 'seleucid', 20); G.flags.lysiasPeace = true;
        return '안티오쿠스 4세가 죽었다. 물러나는 길에 모든 성의 병력 15%를 잃었다. 그러나 리시아스도 안디옥의 반란 소식에 서둘러 화평을 맺고 돌아갔다 (관계 +20).'; } },
    ] },
  { id: 'nicanor', who: 'army', auto: 0,
    cond: G => G.turn >= 44 && G.done.elephants && G.exists('army'),
    title: '니가노르의 날과 로마의 조약', ref: '마카비1서 7:26-50; 8:1-32 (외경); 왕하 19:35; 시 20:7',
    text: '니가노르가 성전을 향해 손을 들고 "유다를 내 손에 넘기지 않으면 이 집을 불사르겠다" 맹세했다. 유다가 아다사에서 기도했다. "앗수르 왕의 사자들이 모독했을 때 주의 천사가 나가 그들 가운데 십팔만 오천을 쳤습니다. 오늘 이 군대도 우리 앞에서 쳐부수소서" (마카비1서 7:41-42, 외경; 왕하 19:35). 아다르월 십삼일, 니가노르가 먼저 쓰러졌다. 그 뒤 유다는 먼 서쪽의 강국 로마에 사절을 보낼지 의논했다.',
    choices: [
      { label: '로마에 사절을 보내 동맹을 맺는다 (역사의 선택)', run: G => {
        G.kill('니가노르'); INTER_KIT.cut(G, 'seleucid', 0.7, ['jerusalem', 'bethlehem', 'bethel', 'emmaus', 'gezer', 'jericho', 'modein', 'samaria', 'shechem']);
        G.buff('army', 'atk', 4, 0.25); G.buff('seleucid', 'atk', 6, -0.15); if (G.exists('rome')) G.rel('army', 'rome', 40);
        G.fac('army').gold = Math.max(0, G.fac('army').gold - 300); G.flags.nicanorDay = true; G.flags.romeTreaty = true;
        return '니가노르가 죽고 유다 땅 근처의 셀레우코스 군 30% 궤멸. 금 -300으로 로마와 조약을 맺었다 — 로마와의 관계 +40, 4턴 동안 공격력 +25%, 셀레우코스 6턴 동안 -15%. 그러나 백 년 뒤 예루살렘에 들어온 것은 바로 그 로마였다.'; } },
      { label: '병거와 말이 아니라 여호와의 이름을 자랑한다', run: G => {
        G.kill('니가노르'); INTER_KIT.cut(G, 'seleucid', 0.7, ['jerusalem', 'bethlehem', 'bethel', 'emmaus', 'gezer', 'jericho', 'modein', 'samaria', 'shechem']);
        G.buff('army', 'atk', 4, 0.25); INTER_KIT.faithAll(G, 10, 5); G.flags.nicanorDay = true; G.kingdom(4, '여호와의 이름을 자랑하다');
        return '니가노르가 죽고 유다 땅 근처의 셀레우코스 군 30% 궤멸. 4턴 동안 공격력 +25%, 신앙 +10, 민심 +5. "어떤 사람은 병거, 어떤 사람은 말을 의지하나 우리는 여호와 우리 하나님의 이름을 자랑하리로다" (시 20:7).'; } },
    ] },
  { id: 'elasa', who: 'army', auto: 0,
    cond: G => G.turn >= 46 && G.done.nicanor && G.exists('army'),
    title: '엘라사에 쓰러진 망치 (BC 160)', ref: '마카비1서 9:1-22 (외경); 삼하 1:19',
    text: '데메트리오스 왕이 바키데스에게 보병 이만과 기병 이천을 주어 보냈다. 엘라사에 진을 친 유다의 군사 삼천 가운데 팔백 명만 남았다. "지금은 물러났다가 형제들과 함께 돌아와 싸웁시다." 유다가 대답했다. "우리가 도망하는 일은 없을 것이다. 우리의 때가 왔다면 형제들을 위하여 용감하게 죽자. 우리의 명예에 흠을 남기지 말자" (9:10, 외경).',
    choices: [
      { label: '팔백 명과 함께 끝까지 싸운다', run: G => {
        G.kill('유다 마카비'); INTER_KIT.lead(G, '요나단') || INTER_KIT.lead(G, '시몬');
        INTER_KIT.faithAll(G, 8, 5); G.buff('army', 'atk', 4, 0.2); INTER_KIT.cut(G, 'seleucid', 0.85); G.kill('바키데스');
        G.flags.judasFell = true; G.kingdom(2, '형제들을 위하여');
        return '유다가 바키데스의 오른쪽 날개를 무너뜨렸으나 끝내 쓰러졌다. 요나단과 시몬이 형을 모데인 조상의 묘에 장사했다. "어찌하여 이스라엘을 구원하던 용사가 쓰러졌는가" (마카비1서 9:21, 외경; 삼하 1:19). 요나단이 형을 이어 백성을 이끈다. 셀레우코스 모든 성 병력 15% 손실, 신앙 +8, 민심 +5, 4턴 동안 공격력 +20%. (바키데스는 훗날 요나단과 화평을 맺고 돌아갔다.)'; } },
      { label: '물러났다가 형제들과 함께 돌아온다', run: G => {
        INTER_KIT.stat(G, '유다 마카비', 'cha', -8); INTER_KIT.faithAll(G, -3, -10); G.buff('seleucid', 'atk', 3, 0.2);
        const r = INTER_KIT.raid(G, 'seleucid', 4000); G.flags.judasFell = true;
        return '성경 밖의 역사(마카비서)에서 유다는 엘라사에서 쓰러졌다. 이 게임에서는 그가 살아 돌아왔지만 흩어진 군사들은 쉽게 돌아오지 않았다. 유다 마카비 매력 -8, 민심 -10, 셀레우코스 3턴 동안 공격력 +20%.' + (r ? ' 바키데스의 추격: ' + r : ''); } },
    ] },
  { id: 'simonFree', who: 'army', auto: 0,
    cond: G => G.turn >= 48 && G.done.elasa && G.exists('army'),
    title: '이방의 멍에가 벗겨지다 (BC 142)', ref: '마카비1서 13:41-53; 14:1-15, 41 (외경); 미 4:4',
    text: '요나단은 대제사장이 되어 여러 해 백성을 이끌었으나 트리폰의 속임수에 사로잡혀 죽었다. 맛다디아의 아들 가운데 시몬 하나만 남았다. 시몬이 게셀을 에워싸 차지하고 욥바를 항구로 삼았다. 백칠십 년(BC 142), 이방인의 멍에가 이스라엘에서 벗겨졌다 (13:41). 그 무렵 동방에서는 바대(파르티아)가 일어나 바벨론을 빼앗았고, 곧 셀레우코스 왕 데메트리오스 2세를 사로잡았다 (14:1-3). 백성은 시몬을 "신실한 예언자가 나타날 때까지" 대제사장과 영도자로 세웠다 (14:41).',
    choices: [
      { label: '"신실한 예언자가 나타날 때까지" 시몬을 대제사장과 영도자로 세운다', run: G => {
        G.kill('요나단'); G.kill('요한'); INTER_KIT.lead(G, '시몬'); INTER_KIT.enter(G, '요한 힐카누스'); INTER_KIT.enter(G, '아레다', 'nabatea'); if (G.exists('nabatea')) G.setRuler('nabatea', '아레다');
        const t = INTER_KIT.freedom(G);
        INTER_KIT.faithAll(G, 8, 15); G.fac('army').gold += 1000; if (G.exists('seleucid')) G.rel('army', 'seleucid', 30);
        G.flags.independence = true; G.kingdom(4, '이방의 멍에를 벗다');
        return '시몬이 하나님의 군대를 이끈다. 그의 아들 요한 힐카누스가 곁에 섰다. ' + t + ' 금 +1000, 신앙 +8, 민심 +15. "사람마다 자기 포도나무와 무화과나무 아래에 앉았다" (마카비1서 14:12, 외경; 미 4:4).'; } },
      { label: '시몬을 왕으로 세운다', run: G => {
        G.kill('요나단'); G.kill('요한'); INTER_KIT.lead(G, '시몬'); INTER_KIT.enter(G, '요한 힐카누스'); INTER_KIT.enter(G, '아레다', 'nabatea'); if (G.exists('nabatea')) G.setRuler('nabatea', '아레다');
        const t = INTER_KIT.freedom(G);
        INTER_KIT.faithAll(G, -8, 20); G.fac('army').gold += 1000; G.flags.independence = true; G.flags.hasmoneanKing = true; G.kingdom(-2, '다윗의 자손이 아닌 왕');
        return t + ' 금 +1000, 민심 +20. 그러나 제사장 가문이 왕관을 쓰자 경건한 자들은 등을 돌렸다 — 신앙 -8. 훗날 하스몬 왕들은 권력 다툼 끝에 로마를 불러들였다. 약속된 왕은 다윗의 자손으로 오신다 (삼하 7:12-13; 사 11:1).'; } },
    ] },
  { id: 'pompey', who: 'army', auto: 0,
    cond: G => G.turn >= 51 && G.done.simonFree && G.exists('army'),
    title: '폼페이우스와 성전 산 (BC 64–63)', ref: '요세푸스, 유대 고대사 14권; 갈 4:4-5',
    text: '시몬의 자손 하스몬 왕들의 시대가 이어졌으나, 형제 히르카누스 2세와 아리스토불루스 2세가 왕위를 다투며 저마다 로마에 도움을 청했다. 로마 장군 폼페이우스가 BC 64 셀레우코스 왕국을 없애 로마의 수리아 속주로 삼고, BC 63 예루살렘 성전 산을 석 달 동안 에워쌌다. 요세푸스는 그가 안식일마다 공성 둑을 쌓았고, 지성소에 들어가 보았으나 아무 형상도 없었으며 성전의 보물에는 손대지 않았다고 전한다. 이로써 유다는 로마의 손에 들어갔다.',
    choices: [
      { label: '성전 산을 지키며 "때가 차기"를 기다린다', run: G => {
        const t = INTER_KIT.romeEast(G);
        const r = INTER_KIT.raid(G, 'rome', 10000, INTER_KIT.mine(G, 'jerusalem') ? 'jerusalem' : null);
        G.buff('army', 'atk', 5, 0.25); INTER_KIT.faithAll(G, 8); G.flags.pompey = true; G.kingdom(2, '때가 차매');
        return t + (r ? ` 폼페이우스의 공격: ${r}` : '') + ' 신앙 +8, 5턴 동안 공격력 +25%. 성경의 역사에서는 BC 63 예루살렘이 로마의 손에 들어갔고, 로마의 길과 평화 위로 복음이 달려갔다. "때가 차매 하나님이 그 아들을 보내사 여자에게서 나게 하시고 율법 아래에 나게 하신 것은 율법 아래에 있는 자들을 속량하시고 우리로 아들의 명분을 얻게 하려 하심이라" (갈 4:4-5). 이 게임에서는 하나님의 군대가 로마까지 나아간다.'; } },
    ] },
];

// 나라들의 흥망 (알렉산더 · 네 뿔 · 바니아스 · 헬라화 · 로마 · 하스몬 독립 · 폼페이우스)
Object.assign(INTER_KIT, {
  // 마게도냐가 일어나 바사를 삼킨다 (BC 334–331)
  macedon: G => {
    if (!INTER_KIT.rise(G, 'greece', '헬라 (마게도냐)', ['pella', 'athens'], ['알렉산더 대왕', 98, 95, 88, 96, 15, null, null, '마게도냐의 왕. 서른 살에 바사를 무너뜨리고 인더스까지 이르렀다. 다니엘이 본 숫염소의 "현저한 뿔".', '단 8:5-8, 21; 11:3'], '#4fa3c7', 0.35, 5000, 16000)) return '';
    let t = '알렉산더 대왕의 헬라가 일어났다.';
    const a = G.city('athens'); if (a && !a.owner) INTER_KIT.give(G, 'athens', 'greece', 2500);
    if (G.exists('persia')) {
      INTER_KIT.enter(G, '다리오 3세', 'persia'); ['다리오 3세', '아닥사스다 1세', '아하수에로', '다리오 1세', '캄비세스 2세', '고레스', '구바루', '닷드내'].forEach(n => INTER_KIT.retire(G, n));
      const n = INTER_KIT.absorb(G, 'persia', 'greece'); t += ` 바사의 성 ${n}곳이 헬라에 넘어가 바사 제국이 무너졌다 (다리오 3세 BC 330 죽음).`;
    }
    const n2 = INTER_KIT.giveAll(G, ['tyre', 'sidon', 'joppa', 'kittim'], 'tyre', 'greece') + INTER_KIT.giveAll(G, ['gaza', 'ashkelon', 'ashdod'], 'philistia', 'greece');
    if (n2) t += ` 두로와 가사를 비롯한 해안 성 ${n2}곳이 함락되었다.`;
    if (INTER_KIT.owns(G, 'samaria', 'samaria_gov') && INTER_KIT.give(G, 'samaria', 'greece', 3000)) t += ' 반역한 사마리아에는 마게도냐 사람들이 들어와 살았다 (사마리아 사람들은 세겜으로 물러났다).';
    const al = G.city('alexandria'); if (al && !al.owner) { INTER_KIT.give(G, 'alexandria', 'greece', 4000); al.comm += 20; al.pop += 20000; t += ' 나일 어귀에 알렉산드리아가 세워졌다(BC 331).'; }
    G.eachCity('greece', c => { c.soldiers += 800; });
    return t;
  },
  // 알렉산더가 죽고 나라가 갈라진다 (BC 323–301)
  split: G => {
    let t = '';
    if (G.exists('greece')) { INTER_KIT.retire(G, '알렉산더 대왕'); t += '알렉산더가 바벨론에서 죽었다. '; }
    const pt = INTER_KIT.rise(G, 'ptolemy', '프톨레마이오스 왕국', ['alexandria', 'memphis', 'tanis'], ['프톨레마이오스 1세', 82, 85, 86, 72, 10, null, null, '알렉산더의 장군, 애굽의 첫 프톨레마이오스 왕. "남방 왕".', '단 11:5'], '#9cc255', 0.25, 5000, 18000);
    const se = INTER_KIT.rise(G, 'seleucid', '셀레우코스 왕국', ['babylon', 'susa', 'ashur', 'haran'], ['셀레우코스 1세', 86, 84, 84, 74, 10, null, null, '알렉산더의 장군. 바벨론에서 셀레우코스 왕조를 열고 안디옥을 세웠다. "북방 왕".', '단 11:5-6'], '#8a63c9', 0.3, 5000, 18000);
    if (G.exists('greece')) {
      if (pt) INTER_KIT.giveAll(G, ['alexandria', 'memphis', 'tanis', 'thebes', 'goshen', 'sinai', 'kadesh', 'gaza', 'ashkelon', 'ashdod', 'joppa', 'tyre', 'sidon', 'kittim', 'samaria', 'damascus'], 'greece', 'ptolemy');
      if (se) INTER_KIT.giveAll(G, ['babylon', 'susa', 'ashur', 'haran', 'carchemish', 'hamath', 'tarsus', 'sardis', 'ephesus', 'persepolis', 'corinth'], 'greece', 'seleucid');
      INTER_KIT.lead(G, '카산드로스', 'greece');
    }
    if (se) {
      const an = G.city('antioch'); if (an && !an.owner) INTER_KIT.give(G, 'antioch', 'seleucid', 5000);
      if (INTER_KIT.owns(G, 'antioch', 'seleucid')) { G.fac('seleucid').capital = 'antioch'; const c = G.city('antioch'); c.comm += 20; c.pop += 30000; c.soldiers += 3000; }
    }
    if (pt) { G.rel('army', 'ptolemy', 50); G.eachCity('ptolemy', c => { c.soldiers += 600; }); }
    if (se) { G.rel('army', 'seleucid', 40); G.rel('ptolemy', 'seleucid', 5); G.eachCity('seleucid', c => { c.soldiers += 600; }); }
    return t + (pt ? '애굽의 프톨레마이오스(남방 왕), ' : '') + (se ? '바벨론과 수리아의 셀레우코스(북방 왕), ' : '') + '마게도냐의 카산드로스가 제국을 나누었다. 유다 땅 둘레의 해안과 사마리아는 프톨레마이오스의 손에 들어갔다.' + (se ? ' 셀레우코스의 새 도읍은 안디옥이다.' : '');
  },
  // 바니아스 전투 (BC 200): 레반트가 셀레우코스로
  panium: G => {
    let t = '';
    if (G.exists('seleucid')) { G.kill('셀레우코스 1세'); INTER_KIT.lead(G, '안티오쿠스 3세', 'seleucid'); t += '안티오쿠스 3세가 셀레우코스 왕이 되었다. '; }
    if (G.exists('ptolemy') && G.exists('seleucid')) {
      INTER_KIT.enter(G, '스코파스', 'ptolemy'); G.kill('스코파스');
      const n = INTER_KIT.giveAll(G, ['samaria', 'damascus', 'joppa', 'gaza', 'ashkelon', 'ashdod', 'tyre', 'sidon', 'megiddo', 'bethshean', 'dan', 'hazor', 'edrei', 'kadesh'], 'ptolemy', 'seleucid');
      INTER_KIT.cut(G, 'ptolemy', 0.8); G.eachCity('seleucid', c => { c.soldiers += 500; });
      t += `바니아스에서 스코파스가 무너지고 프톨레마이오스의 성 ${n}곳이 셀레우코스에 넘어갔다.`;
    }
    return t;
  },
  // 안티오쿠스 4세가 왕이 되다 (BC 175)
  hellenize: G => {
    if (!G.exists('seleucid')) return;
    G.kill('안티오쿠스 3세'); INTER_KIT.lead(G, '안티오쿠스 4세', 'seleucid'); INTER_KIT.enter(G, '메넬라오스', 'seleucid');
  },
  // 로마가 일어나다 (BC 168 피드나·엘레우시스)
  romeRise: G => {
    const ok = INTER_KIT.rise(G, 'rome', '로마', ['rome'], ['포필리우스 라이나스', 58, 84, 86, 78, 10, null, null, '로마 원로원의 사절. 엘레우시스에서 안티오쿠스 4세 둘레에 원을 그리고 "이 원을 나서기 전에 대답하라" 했다.', '단 11:30; 폴리비오스, 역사 29권'], '#b02a37', 0.2, 8000, 20000);
    if (!ok) return '로마의 사절이 왔다.';
    let t = '로마 공화국이 동방에 나타났다.';
    if (G.exists('greece')) { INTER_KIT.retire(G, '카산드로스'); const n = INTER_KIT.absorb(G, 'greece', 'rome'); t += ` 피드나에서 마게도냐가 무너지고 헬라의 성 ${n}곳이 로마에 넘어갔다.`; }
    G.eachCity('rome', c => { c.soldiers += 1500; c.train = Math.max(c.train, 65); });
    G.rel('army', 'rome', 30); if (G.exists('ptolemy')) G.rel('ptolemy', 'rome', 70);
    return t;
  },
  // 맛다디아와 아들들이 모인다 (BC 167)
  hasmon: G => {
    let mo = '';
    const m = G.city('modein');
    if (m && m.owner !== 'army' && INTER_KIT.give(G, 'modein', 'army', 1500)) { m.loy = 80; m.faith += 20; mo = 'modein'; }
    ['학개', '스가랴', '다니엘', '에스더', '모르드개', '에스라', '느헤미야', '말라기', '얏두아', '의인 시몬'].forEach(n => INTER_KIT.retire(G, n)); // 이 게임에서 원로로 남겨 두었던 옛 세대
    ['맛다디아', '요한', '시몬', '유다 마카비', '엘르아살', '요나단', '하시딤 장로'].forEach(n => INTER_KIT.enter(G, n, 'army', mo || undefined));
    INTER_KIT.lead(G, '맛다디아');
    INTER_KIT.faithAll(G, 8, 5);
  },
  // 시몬의 독립 (BC 142)과 바대의 일어남 (BC 141)
  freedom: G => {
    let t = '';
    const n = ['gezer', 'joppa'].filter(c => INTER_KIT.on(G, c) && G.ownerOf(c) === 'seleucid' && ROADS.some(([a, b]) => (a === c && INTER_KIT.mine(G, b)) || (b === c && INTER_KIT.mine(G, a))) && INTER_KIT.give(G, c, 'army', 2000));
    if (n.length) t += `시몬이 ${n.map(c => ({ gezer: '게셀', joppa: '욥바' })[c]).join('과 ')}을(를) 차지했다. `;
    if (INTER_KIT.mine(G, 'joppa')) { const c = G.city('joppa'); c.bld = c.bld || {}; c.bld.port = Math.min(10, (c.bld.port || 1) + 2); t += '욥바를 항구로 삼아 바다의 섬들로 가는 길을 열었다 (항구 Lv.+2). '; }
    INTER_KIT.cut(G, 'seleucid', 0.7, ['jerusalem', 'gezer', 'joppa', 'emmaus', 'modein', 'bethel', 'jericho', 'bethlehem', 'hebron']);
    if (G.exists('seleucid') && INTER_KIT.rise(G, 'parthia', '바대 (파르티아)', ['susa', 'babylon', 'ashur'], ['미트리다테스 1세', 86, 82, 84, 70, 10, null, null, '바대(파르티아)의 왕 아르사케스 가문. 셀레우코스에게서 메대와 바벨론을 빼앗고 데메트리오스 2세를 사로잡았다.', '마카비1서 14:1-3 (외경); 행 2:9'], '#7a9e6b', 0.3, 4000, 15000)) {
      const k = INTER_KIT.giveAll(G, ['susa', 'babylon', 'ashur', 'persepolis'], 'seleucid', 'parthia');
      t += `동방에서는 바대가 일어나 셀레우코스의 성 ${k + 1}곳을 빼앗았다 — 오순절에 예루살렘에 온 "바대인"의 나라다 (행 2:9).`;
    }
    return t;
  },
  // 폼페이우스가 셀레우코스를 없애고 동방을 차지한다 (BC 64–63)
  romeEast: G => {
    if (!G.exists('rome')) INTER_KIT.romeRise(G);
    if (!G.exists('rome')) return '';
    INTER_KIT.lead(G, '폼페이우스', 'rome'); INTER_KIT.retire(G, '포필리우스 라이나스');
    let t = '폼페이우스가 동방의 로마군을 이끈다.';
    if (G.exists('seleucid')) {
      ['리시아스', '바키데스', '고르기아스', '메넬라오스', '안티오쿠스 3세', '안티오쿠스 4세'].forEach(n => INTER_KIT.retire(G, n));
      const n = INTER_KIT.absorb(G, 'seleucid', 'rome'); t += ` 셀레우코스 왕국이 사라지고 그 성 ${n}곳이 로마의 수리아 속주가 되었다 (BC 64).`;
    }
    G.eachCity('rome', c => { c.soldiers += 1200; c.train = Math.max(c.train, 70); });
    G.fac('rome').aggr = 0.35; G.fac('rome').gold += 4000;
    G.rel('army', 'rome', -40);
    return t;
  },
});

STORY.e_inter = {
  army: [
    { title: '제단을 먼저 쌓다', ref: '스 1–3장; 시 126편',
      intro: [
        ['narr', '"여호와께서 시온의 포로를 돌려보내실 때에 우리는 꿈꾸는 것 같았도다 그 때에 우리 입에는 웃음이 가득하고 우리 혀에는 찬양이 찼었도다" (시 126:1-2). 칠십 년 만에 돌아온 예루살렘은 잿더미였다.'],
        ['스룹바벨', '성벽도 성전도 없습니다. 그 땅 백성의 눈이 우리를 노려봅니다. 무엇부터 해야 하겠습니까?'],
        ['대제사장 여호수아', '제단입니다. 성전보다 먼저, 성벽보다 먼저 옛 터에 제단을 세우고 아침저녁으로 번제를 드립시다. 우리가 누구의 백성인지부터 기억해야 합니다.'],
        ['word', '"그들이 모든 나라 백성을 두려워하여 제단을 그 터에 세우고 그 위에서 아침 저녁으로 여호와께 번제를 드리며." (스 3:3)'],
        ['세스바살', '고레스 왕이 돌려준 금 그릇과 은 그릇이 오천사백 개입니다. 느부갓네살이 가져갔던 것들이 돌아왔습니다.'],
        ['@advisor', '예루살렘에서 제사를 드려 백성의 마음을 모으십시오. 흩어진 자들이 제단 연기를 보고 올 것입니다.'],
      ],
      goal: { t: 'cmd', key: 'worship', n: 3, text: '제사를 3번 드린다 — 옛 터에 제단을 먼저 세운다 (스 3:1-6)', city: 'jerusalem' },
      reward: { k: 10, food: 2000 },
      outro: [['narr', '"주는 지극히 선하시므로 그의 인자하심이 이스라엘에게 영원하시도다" (스 3:11). 지대를 놓는 날, 노인들의 통곡과 젊은이들의 함성이 섞여 멀리까지 들렸다.'], ['스룹바벨', '작은 시작입니다. 그러나 여호와께서 시작하신 일입니다.']] },
    { title: '힘으로 되지 아니하며', ref: '스 4–6장; 학 1–2장; 슥 4장',
      intro: [
        ['narr', '그 땅 백성이 의사들을 사서 공사를 막았다. 백성은 각자 자기 집을 짓느라 바빴고, 성전 터에는 다시 풀이 자랐다. 열여섯 해가 흘렀다.'],
        ['학개', '"이 성전이 황폐하였거늘 너희가 이 때에 판벽한 집에 거주하는 것이 옳으냐… 너희가 많이 뿌릴지라도 수확이 적으며… 품삯을 받는 자는 그것을 구멍 뚫어진 전대에 넣음이 되느니라." (학 1:4-6)'],
        ['스가랴', '금 등잔대와 두 감람나무를 보았습니다. 스룹바벨이여, "힘으로 되지 아니하며 능력으로 되지 아니하고 오직 나의 영으로 되느니라." (슥 4:6)'],
        ['word', '"스룹바벨아 스스로 굳세게 할지어다… 이 땅 모든 백성아 스스로 굳세게 하여 일할지어다 내가 너희와 함께 하노라 나 만군의 여호와의 말이니라." (학 2:4)'],
        ['@advisor', '예루살렘의 왕궁(청사)을 넓히고 성전을 다시 지어 올리십시오. 목재와 석재가 필요합니다 — 성 화면에서 성전을 업그레이드하십시오.'],
      ],
      goal: { t: 'bld', key: 'temple', n: 6, text: '성전을 Lv.6까지 다시 짓는다 (성 화면의 건물 업그레이드 · 왕궁 Lv.6 필요)', city: 'jerusalem' },
      reward: { k: 15, gold: 600 },
      outro: [['narr', '다리오 왕 제육년 아달월 삼일, 성전이 완성되었다 (스 6:15). 솔로몬의 성전에 비하면 보잘것없었다.'], ['word', '"이 성전의 나중 영광이 이전 영광보다 크리라 만군의 여호와의 말이니라 내가 이 곳에 평강을 주리라." (학 2:9)'], ['스가랴', '"작은 일의 날이라고 멸시하는 자가 누구냐." 이 집에 언젠가 평강의 왕이 오실 것입니다.']] },
    { title: '이 때를 위함이라', ref: '에스더 1–10장',
      intro: [
        ['narr', '수산 궁에서 아하수에로 왕이 백팔십 일 동안 잔치를 베풀었다. 왕후 와스디가 폐위되고, 베냐민 사람 모르드개가 기른 사촌 누이 하닷사, 곧 에스더가 왕후가 되었다. 그녀는 자기 민족을 밝히지 않았다.'],
        ['모르드개', '아각 사람 하만이 왕 다음 자리에 올랐다. 모든 신하가 그에게 꿇어 절하지만 나는 그리하지 않겠다.'],
        ['narr', '분노한 하만이 주사위(부르)를 던져 날을 정하고, 온 나라의 유다인을 아달월 십삼일 하루에 멸하라는 조서를 받아 냈다.'],
        ['모르드개', '에스더야, 네가 왕궁에 있으니 홀로 목숨을 건지리라 생각하지 말라. "네가 왕후의 자리를 얻은 것이 이 때를 위함이 아닌지 누가 알겠느냐." (에 4:14)'],
        ['에스더', '수산에 있는 유다인을 다 모으고 나를 위하여 사흘 동안 금식하십시오. 나도 그리하고 규례를 어기고 왕에게 나아가겠습니다. "죽으면 죽으리이다." (에 4:16)'],
        ['@advisor', '조서의 날(15턴 무렵)이 오면 사마리아와 이두매가 칼을 들 것입니다. 성마다 군사를 훈련하고 기다리십시오.'],
      ],
      goal: { t: 'flag', flag: 'purim', text: '하만의 조서가 내리는 날(15턴 무렵)까지 성을 지키고, 에스더와 함께 금식하며 기다린다', city: 'jerusalem' },
      reward: { k: 15, gold: 800 },
      outro: [['narr', '"이 달 이 날에 유다인이 대적에게서 벗어나서 평안함을 얻어 슬픔이 변하여 기쁨이 되고 애통이 변하여 길한 날이 되었으니" (에 9:22). 에스더서에는 하나님의 이름이 한 번도 나오지 않는다. 그러나 모든 장면 뒤에 그분의 손이 있다.'], ['에스더', '저는 두려웠습니다. 그러나 이 자리가 저를 위한 것이 아니라 이 때를 위한 것이었음을 알았습니다.']] },
    { title: '무너진 성벽', ref: '스 7–10장; 느 1–6장; 8:10',
      intro: [
        ['narr', '아닥사스다 왕 때 학사 에스라가 율법책을 들고 올라왔고, 열세 해 뒤 왕의 술 맡은 관원 느헤미야가 성벽 소식에 울며 금식했다.'],
        ['에스라', '"여호와의 율법을 연구하여 준행하며 가르치기로 결심하였습니다." 성벽보다 먼저 이 백성의 마음에 율법이 새겨져야 합니다.'],
        ['느헤미야', '"예루살렘 성은 허물어지고 성문들은 불탔으니 자, 예루살렘 성을 건축하여 다시 수치를 당하지 말자." (느 2:17)'],
        ['narr', '산발랏과 도비야가 비웃었다. "그들이 건축하는 돌 성벽은 여우가 올라가도 곧 무너지리라" (느 4:3).'],
        ['word', '"너희는 그들을 두려워하지 말고 지극히 크시고 두려우신 주를 기억하고 너희 형제와 자녀와 아내와 집을 위하여 싸우라." (느 4:14)'],
        ['@advisor', '예루살렘의 성벽을 다시 쌓으십시오. 한 손에는 일감을, 한 손에는 병기를 — 산발랏의 무리가 곧 옵니다.'],
      ],
      goal: { t: 'cmd', key: 'wall', n: 4, text: '성벽 보수를 4번 한다 — 오십이 일 만에 예루살렘 성벽을 완성한다 (느 6:15)', city: 'jerusalem' },
      reward: { k: 15, gold: 800, food: 3000 },
      outro: [['narr', '"성벽 역사가 오십이 일 만인 엘룰월 이십오일에 끝나매 우리의 모든 대적과 주위에 있는 이방 족속들이 이를 듣고 다 두려워하여 크게 낙담하였으니 이는 이 역사를 우리 하나님께서 이루신 것을 앎이니라" (느 6:15-16).'], ['느헤미야', '성벽을 봉헌하는 날 두 찬양대가 성벽 위를 돌았습니다. "여호와로 인하여 기뻐하는 것이 너희의 힘이니라." (느 8:10)']] },
    { title: '헬라의 숫염소와 마카비', ref: '말 4:5-6; 단 8장; 11:21-35; 마카비1서 1–4장 (외경)',
      intro: [
        ['narr', '말라기 이후 선지자의 음성이 끊어졌다. "보라 날이 이를지라… 내가 기근을 땅에 보내리니 양식이 없어 주림이 아니며 물이 없어 목마름이 아니요 여호와의 말씀을 듣지 못한 기근이라" (암 8:11).'],
        ['narr', '그러나 다니엘이 남긴 환상이 있었다 — 두 뿔 가진 숫양(메대와 바사), 서쪽에서 오는 숫염소(헬라), 꺾인 큰 뿔과 그 대신 난 네 뿔, 그리고 "비천한 사람".'],
        ['word', '"군대는 그의 편에 서서 성소 곧 견고한 곳을 더럽히며 매일 드리는 제사를 폐하며 멸망하게 하는 가증한 것을 세울 것이며… 오직 자기의 하나님을 아는 백성은 강하여 용맹을 떨치리라." (단 11:31-32)'],
        ['말라기', '"보라 여호와의 크고 두려운 날이 이르기 전에 내가 선지자 엘리야를 너희에게 보내리니" (말 4:5). 그날까지 우리는 기다립니다. 침묵은 버리심이 아닙니다.'],
        ['@advisor', '알렉산더와 그 후계자들의 나라가 차례로 올 것입니다. 성읍을 넓히고 군사를 기르십시오. 그리고 성소가 더럽혀지는 날이 오면 — 그것을 다시 정결하게 할 자들이 일어날 것입니다 (성전 봉헌 · 40턴 무렵).'],
      ],
      goal: { t: 'flag', flag: 'hanukkah', text: '다니엘의 환상이 이루어지는 동안 성읍을 지키고, 마카비 형제들과 함께 예루살렘 성전을 다시 봉헌한다 (40턴 무렵 · 예루살렘 필요)', city: 'jerusalem' },
      reward: { k: 20, gold: 1000 },
      outro: [
        ['narr', '기슬르월 이십오일, 이방인들이 제단을 더럽혔던 바로 그날에 새 제단 위에서 율법대로 번제를 드렸다. 노래와 수금과 비파와 제금으로 여드레 동안 봉헌했다 (마카비1서 4:52-56, 외경).'],
        ['word', '"그가 내게 이르되 이천삼백 주야까지니 그 때에 성소가 정결하게 되리라 하였느니라." (단 8:14)'],
        ['유다 마카비', '더럽혀진 제단의 돌은 한쪽에 쌓아 두었습니다. 선지자가 와서 알려 줄 때까지. 우리가 모르는 것은 모른다 합시다.'],
      ] },
    { title: '때가 차매', ref: '마카비1서 9–14장 (외경); 갈 4:4-5; 행 28:14-16',
      intro: [
        ['narr', '유다 마카비가 엘라사에서 쓰러지고, 요나단이 뒤를 이었고, 마침내 시몬이 이방의 멍에를 벗겼다(BC 142). 그러나 그 자손 하스몬 왕들은 권력을 다투었고, 서쪽에서는 로마가 동방으로 손을 뻗고 있었다.'],
        ['시몬', '우리가 벗긴 것은 이방의 멍에였다. 죄의 멍에를 벗기실 이는 따로 오실 것이다. 백성은 나를 "신실한 예언자가 나타날 때까지"만 세웠다.'],
        ['word', '"때가 차매 하나님이 그 아들을 보내사 여자에게서 나게 하시고 율법 아래에 나게 하신 것은 율법 아래에 있는 자들을 속량하시고 우리로 아들의 명분을 얻게 하려 하심이라." (갈 4:4-5)'],
        ['narr', '성경의 역사에서는 BC 63 로마의 폼페이우스가 예루살렘에 들어왔다. 로마가 닦은 길과 헬라 말과 흩어진 회당들 — 모든 것이 한 아기의 탄생과 복음의 길을 준비하고 있었다.'],
        ['narr', '이 게임에서는 마하나임의 군대가 그 길을 앞서 걷는다 — 사마리아와 욥바를 지나 안디옥으로, 그리고 바다 건너 로마까지.'],
        ['@advisor', '안디옥은 하맛과 다소 사이에 있습니다. 로마는 마게도냐나 고린도에서 바다를 건너야 합니다. 군량을 넉넉히 챙기십시오.'],
      ],
      goal: { t: 'goal', faith: 60, text: '예루살렘·사마리아·욥바·안디옥·로마 — 목표 5성을 차지하고 평균 신앙 60을 지킨다' },
      reward: { k: 25 },
      outro: [
        ['narr', '하나님의 군대가 일곱 언덕의 도성 앞에 섰다. 훗날 이 길을 한 죄수가 걸어온다. 그는 쇠사슬에 매였으나 "하나님의 나라를 전파하며 주 예수 그리스도에 관한 모든 것을 담대하게 거침없이 가르쳤다" (행 28:31).'],
        ['word', '"이 천국 복음이 모든 민족에게 증언되기 위하여 온 세상에 전파되리니 그제야 끝이 오리라." (마 24:14)'],
        ['시몬', '칼로 여기까지 왔습니다. 그러나 이 도성을 참으로 이길 것은 칼이 아니라 십자가일 것입니다. 우리는 그 길을 준비한 사람들이었을 뿐입니다.'],
      ] },
  ],
};

HERO_LINES.e_inter = {
  army: [
    { // 제단을 먼저 쌓다
      intro: [
        ['narr', '{name}은(는) 바벨론 강가에서 부르던 노래를 기억하며 예루살렘의 잿더미 위에 섰다.'],
        ['@hero', '꿈꾸는 것 같습니다. 성벽보다 먼저 제단을 쌓는 일에 저도 돌 하나를 보태겠습니다.'],
      ],
      outro: [['@hero', '울음과 웃음이 섞인 노래였습니다. 둘 다 여호와께 드리는 노래였습니다.']],
    },
    { // 힘으로 되지 아니하며
      intro: [['@hero', '판벽한 집에 앉아 있던 제 모습이 부끄럽습니다. 산에 올라가 나무를 가져오겠습니다.']],
      outro: [['@hero', '작은 일의 날을 멸시하지 않겠습니다. 이 작은 집에 큰 영광이 머물 것입니다.']],
    },
    { // 이 때를 위함이라
      intro: [['@hero', '저도 금식하겠습니다. 제가 선 자리도 이 때를 위한 자리인지 모릅니다.']],
      outro: [['@hero', '하나님의 이름이 보이지 않는 날에도 그분의 손은 일하고 계셨습니다.']],
    },
    { // 무너진 성벽
      intro: [['@hero', '한 손에는 일감을, 한 손에는 칼을 들겠습니다. 비웃음에는 대답하지 않고 벽돌로 대답하겠습니다.']],
      outro: [['@hero', '오십이 일이었습니다. 이 역사를 우리 하나님께서 이루셨습니다.']],
    },
    { // 헬라의 숫염소와 마카비
      intro: [
        ['narr', '{name}은(는) 선지자가 없는 긴 세월 동안 다니엘의 두루마리를 읽고 또 읽었다.'],
        ['@hero', '말씀이 들리지 않는 날에도 기록된 말씀은 있습니다. 성소가 더럽혀지는 날, 저도 모데인의 외침을 따르겠습니다.'],
      ],
      outro: [['@hero', '여드레 동안의 노래를 잊지 않겠습니다. 모르는 것은 선지자가 오실 때까지 기다리겠습니다.']],
    },
    { // 때가 차매
      intro: [['@hero', '이방의 멍에는 벗었지만 참 구원은 아직입니다. 그분이 오실 길을 닦는 마음으로 가겠습니다.']],
      outro: [['@hero', '이 먼 길 끝에서 깨닫습니다. 우리는 길을 준비하는 사람이었고, 길 되신 분은 곧 오십니다.']],
    },
  ],
};
