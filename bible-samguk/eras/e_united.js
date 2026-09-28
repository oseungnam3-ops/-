// 성경 삼국지 — 시대 4: 통일 왕국 (BC 1050–930, 사무엘상 8장 – 열왕기상 11장)
// 플레이어는 언제나 "마하나임 하나님의 군대"(army). 사무엘과 사울, 요나단에서 다윗과 그 용사들, 솔로몬까지 사건을 따라 지도자가 이어진다.
// 옛 'saul'·'david' 시나리오의 인물·사건·대화를 옮겨 오고, 솔로몬 시대와 세계 성읍(애굽·하맛·유브라데)을 더했다.
(() => {
  const ID = 'e_united', P = 'army';
  if (typeof ERA_CITIES !== 'undefined') Object.values(ERA_CITIES).forEach(l => { if (Array.isArray(l) && l.includes('united') && !l.includes(ID)) l.push(ID); });
  // 사울의 도읍 기브아는 지도에 없어, 가까운 벧엘("믹마스와 벧엘 산지", 삼상 13:2)에서 시작한다. 다윗 때에 예루살렘으로 옮긴다(사건 zion).
  const CAP = 'bethel';

  // ---------- 사건 도우미 ----------
  const U = {
    on: (G, cid) => !!G.city(cid),
    mine: (G, cid) => U.on(G, cid) && G.ownerOf(cid) === P,
    raise: (G, name, cid) => {
      if (!G.exists(P) || !G.alive(name)) return false;
      if (G.facOf(name) !== P) G.join(name, P, cid && U.mine(G, cid) ? cid : undefined);
      return true;
    },
    // 지도자(군주)를 세운다 (살아 있고 군대에 있을 때만)
    lead: (G, name) => { if (G.alive(name) && G.facOf(name) === P) { G.setRuler(P, name); return true; } return false; },
    inArmy: (G, name) => G.alive(name) && G.facOf(name) === P,
    faithAll: (G, d, loy) => { if (G.exists(P)) G.eachCity(P, c => { c.faith += d; if (loy) c.loy += loy; }); },
    cut: (G, f, k, only) => { if (G.exists(f)) G.eachCity(f, c => { if (!only || only.includes(c.id)) c.soldiers = Math.floor(c.soldiers * k); }); },
    stat: (G, name, k, d) => { const o = G.o(name); if (o && o.alive) o[k] = Math.max(0, Math.min(100, o[k] + d)); },
    gold: (G, d) => { const F = G.fac(P); F.gold = Math.max(0, F.gold + d); },
    food: (G, d) => { const F = G.fac(P); F.food = Math.max(0, F.food + d); },
    next: (G, n) => { G.flags.uNext = G.turn + n; },
    after: (G, id) => !!G.done[id] && G.turn >= (G.flags.uNext || 0) && G.exists(P),
    home: G => {
      if (!G.exists(P)) return null;
      const cap = G.fac(P).capital; if (U.mine(G, cap)) return G.city(cap);
      let best = null; G.eachCity(P, c => { if (!best || c.soldiers > best.soldiers) best = c; }); return best;
    },
    add: (G, n) => { const c = U.home(G); if (c) c.soldiers += n; return !!c; },
    near: (G, cid) => ROADS.some(([a, b]) => (a === cid && U.mine(G, b)) || (b === cid && U.mine(G, a))),
  };
  const ISHBOSHETH = ['이스보셋', 30, 40, 55, 50, 50, null, 'mahanaim', '사울의 아들(이스바알). 아브넬이 그를 마하나임으로 데려가 이스라엘의 왕으로 세웠다.', '삼하 2:8-10'];
  const ABSALOM = ['압살롬', 70, 75, 70, 95, 30, null, 'hebron', '다윗의 셋째 아들, 온 이스라엘에서 가장 아름답다 칭찬받은 자. 성문 곁에서 백성의 마음을 훔쳤다.', '삼하 14:25; 15:6'];

  SCENARIOS.push({
    id: ID,
    title: '통일 왕국 — 사울·다윗·솔로몬',
    year: 1050,
    ref: '사무엘상 8장 – 열왕기상 11장 · 역대상 10장 – 역대하 9장',
    intro: '"우리에게 왕을 주어 다른 나라들 같이 되게 하소서." 백성의 요구에 사무엘이 베냐민 사람 기스의 아들 사울에게 기름을 부었다. 그러나 이스라엘에는 대장장이가 없고, 블레셋 수비대가 믹마스와 게바의 산지를 누르고 있다. 동쪽에서는 암몬 왕 나하스가 길르앗 야베스를 에워쌌다. 마하나임 하나님의 군대 — 야곱이 본 하나님의 군대(창 32:1-2) — 가 사울과 요나단, 이새의 막내 다윗과 그 용사들, 그리고 솔로몬을 따라 백이십 년의 길을 간다. 목표는 "유브라데 강에서부터 블레셋 사람의 땅에 이르기까지와 애굽 지경에 미치기까지"(왕상 4:21)의 나라와, 여호와의 이름을 위한 성전이다.',
    words: ['mahanaim', 'lord_of_hosts', 'fear_not', 'nissi'],
    factions: [
      { id: P, name: '하나님의 군대', ruler: '사울', color: '#e2b04a', capital: CAP, gold: 700, food: 10000, aggr: 0.4,
        desc: '마하나임 하나님의 군대. 갓 세워진 첫 왕 사울이 "믹마스와 벧엘 산지"(벧엘)에 진을 쳤다(도읍 기브아는 벧엘 가까이에 있다). 블레셋이 대장장이를 막아 칼과 창을 가진 이는 사울과 요나단뿐이다 (삼상 13:19-22). 다윗과 그 용사들은 아직 재야에 있고, 사건을 따라 차례로 군대를 이끈다.',
        cities: { bethel: 3500, shiloh: 1500, shechem: 2000, bethlehem: 1200, hebron: 1500, jericho: 1200, mahanaim: 1500, beersheba: 1000 } },
      { id: 'philistia', name: '블레셋', ruler: '아기스', color: '#c9573f', capital: 'gath', gold: 1500, food: 9000, aggr: 0.35,
        desc: '철을 다루는 해안의 다섯 성읍. 병거 삼만과 마병 육천, 해변의 모래 같은 백성으로 믹마스에 진을 쳤다 (삼상 13:5). 벧산 성벽에는 훗날 사울의 시체가 걸린다 (31:10).',
        cities: { gath: 6000, ekron: 5000, ashdod: 4500, ashkelon: 3500, gaza: 4000, joppa: 2500, bethshean: 2500 } },
      { id: 'ammon', name: '암몬', ruler: '나하스', color: '#5ea67c', capital: 'rabbah', gold: 700, food: 6000, aggr: 0.4,
        desc: '길르앗 야베스(라못길르앗)를 에워싸고 "너희 오른눈을 다 빼야" 언약하겠다고 한 나하스의 나라 (삼상 11:1-2). 훗날 그 아들 하눈이 다윗의 조문 사절을 모욕한다 (삼하 10장).',
        cities: { rabbah: 5000, heshbon: 2500 } },
      { id: 'amalek', name: '아말렉', ruler: '아각', color: '#a0876a', capital: 'kadesh', gold: 600, food: 5000, aggr: 0.4,
        desc: '광야에서 이스라엘의 뒤를 친 남방의 유목민. 여호와께서 그 죄를 기억하셨다 (출 17:14; 삼상 15:2). 가데스 광야에서 하윌라와 술까지 흩어져 산다.',
        cities: { kadesh: 4000 } },
      { id: 'moab', name: '모압', ruler: '모압 왕', color: '#9a6fbf', capital: 'kirhareseth', gold: 700, food: 5000, aggr: 0.25,
        desc: '사울이 사방에서 싸운 대적 중 하나 (삼상 14:47). 다윗은 한때 부모를 모압 왕에게 맡겼다 (22:3-4). 훗날 다윗에게 조공을 바친다 (삼하 8:2).',
        cities: { kirhareseth: 3000, dibon: 2000 } },
      { id: 'edom', name: '에돔', ruler: '에돔 왕', color: '#b5804f', capital: 'bozrah', gold: 600, food: 4000, aggr: 0.2,
        desc: '세일 산의 에돔. 사울의 목자장 도엑이 이 백성이다. 다윗이 소금 골짜기에서 에돔을 치고 수비대를 두었다 (삼하 8:13-14).',
        cities: { bozrah: 2500 } },
      { id: 'aram', name: '아람 (소바·다메섹)', ruler: '하닷에셀', color: '#cf6d9c', capital: 'damascus', gold: 1500, food: 9000, aggr: 0.3,
        desc: '르홉의 아들 소바 왕 하닷에셀이 이끄는 아람 연합. 소바는 다메섹 북쪽 베가 골짜기의 나라로, 하닷에셀은 유브라데 강까지 권세를 넓히려 했고 다메섹 아람 사람들이 그를 도우러 왔다 (삼하 8:3-5). 이 게임에서는 소바와 다메섹을 한 세력으로 묶었다.',
        cities: { damascus: 6000, edrei: 2500 } },
      { id: 'canaan_jebus', name: '여부스', ruler: '아라우나', color: '#8f86a8', capital: 'jerusalem', gold: 600, food: 4000, aggr: 0.05,
        desc: '베냐민 땅 한가운데 남은 가나안의 산성. "맹인과 다리 저는 자라도 너를 물리치리라" 자신했다 (삼하 5:6).',
        cities: { jerusalem: 2500 } },
      { id: 'tyre', name: '두로', ruler: '히람', color: '#3fb3b5', capital: 'tyre', gold: 2500, food: 5000, aggr: 0.03,
        desc: '바다 무역으로 부유한 베니게의 성읍. 히람 1세는 평생 다윗을 사랑하여 백향목과 목수와 석수를 보냈고, 솔로몬의 성전을 함께 지었다 (삼하 5:11; 왕상 5:1). 이 게임에서는 처음부터 히람이 다스린다.',
        cities: { tyre: 4000, sidon: 3500 } },
      { id: 'hamath', name: '하맛', ruler: '도이', color: '#6fb0a0', capital: 'hamath', gold: 1200, food: 6000, aggr: 0.03,
        desc: '오론테스 강가의 나라. 하맛 왕 도이는 하닷에셀과 싸우던 적이었기에, 다윗이 하닷에셀을 이기자 아들 요람을 보내 문안하고 금·은·놋 그릇을 바쳤다 (삼하 8:9-10).',
        cities: { hamath: 3000 } },
      { id: 'egypt', name: '애굽', ruler: '바로', color: '#d98a3a', capital: 'tanis', gold: 4000, food: 16000, aggr: 0.04,
        desc: '21왕조의 애굽. 도읍은 나일 삼각주의 소안(타니스)이다. 솔로몬이 바로의 딸을 아내로 맞았고, 바로는 게셀을 빼앗아 딸에게 예물로 주었다 (왕상 3:1; 9:16). 성경은 이 바로의 이름을 밝히지 않는다 — 학자들은 시아문으로 보기도 하나 확실하지 않다.',
        cities: { tanis: 6000, memphis: 5000, thebes: 5000, goshen: 2500 } },
    ],
    // 라못길르앗 = 나하스에게 포위된 길르앗 야베스. 북쪽 성읍들은 가나안의 남은 무리.
    neutral: { ramoth: 1500, hazor: 1500, megiddo: 1500, dan: 800, lachish: 2000, sinai: 500, midian: 1500, carchemish: 3000, haran: 2500,
      nineveh: 3000, ashur: 3000, babylon: 4000, ur: 2500, susa: 3500, tarsus: 2000, kittim: 1800 },
    // 헷 제국의 핫투사는 BC 1180 무렵 버려졌다
    hide: ['hattusa', 'alexandria', 'antioch', 'samaria', 'pella', 'rome', 'athens', 'corinth', 'sardis', 'ephesus', 'persepolis', 'modein', 'emmaus', 'gezer'],
    officers: [
      ['사울', 85, 50, 60, 85, 60, P, CAP, '베냐민 사람 기스의 아들. 모든 백성보다 어깨 위만큼 컸던 이스라엘의 첫 왕.', '삼상 9:1-2; 10:1'],
      ['요나단', 90, 75, 65, 90, 92, P, CAP, '사울의 맏아들. "여호와의 구원은 사람이 많고 적음에 달리지 아니하였느니라."', '삼상 14:6'],
      ['아브넬', 88, 78, 72, 75, 55, P, CAP, '넬의 아들, 사울의 숙부의 아들이자 군사령관.', '삼상 14:50'],
      ['사무엘', 15, 95, 90, 92, 99, P, CAP, '마지막 사사이자 선지자. 벧엘·길갈·미스바를 돌며 이스라엘을 다스렸다. 장수가 아니라 말씀을 전하는 자.', '삼상 7:15-17; 15:22'],
      ['아히야', 20, 70, 60, 65, 85, P, 'shiloh', '아히둡의 아들, 실로의 엘리 가문 제사장. 에봇을 입고 사울 곁에 있었다.', '삼상 14:3, 18'],
      ['기스', 35, 55, 60, 60, 55, P, CAP, '아비엘의 아들, 베냐민의 유력한 사람. 사울의 아버지.', '삼상 9:1'],
      ['말기수아', 70, 45, 40, 50, 55, P, 'shechem', '사울의 아들, 아버지와 함께 싸운 왕자.', '삼상 14:49; 31:2'],
      ['아비나답', 68, 45, 40, 50, 55, P, 'jericho', '사울의 아들.', '삼상 31:2'],
      ['미갈', 10, 72, 55, 85, 60, P, CAP, '사울의 작은 딸. 다윗을 사랑하여 창문으로 달아나게 했다.', '삼상 18:20; 19:11-17'],
      ['도엑', 75, 50, 40, 20, 5, P, CAP, '에돔 사람, 사울의 목자장.', '삼상 21:7; 22:18'],
      ['엘리압', 78, 45, 40, 60, 50, P, 'bethlehem', '이새의 맏아들. 용모와 키가 뛰어났으나 여호와께서 버리셨다.', '삼상 16:6-7; 17:13'],
      ['다윗', 85, 78, 65, 92, 98, null, 'bethlehem', '이새의 막내, 들에서 양을 치는 소년. 사자와 곰의 발톱에서 양을 건졌다.', '삼상 16:11-13; 17:34-37'],
      ['이새', 20, 60, 55, 70, 85, null, 'bethlehem', '베들레헴 사람, 오벳의 아들. 여덟 아들의 아버지.', '삼상 16:1; 17:12; 룻 4:22'],
      ['요압', 85, 70, 55, 55, 50, null, 'bethlehem', '다윗의 누이 스루야의 아들. 훗날 다윗의 군대 장관.', '삼상 26:6; 삼하 2:13; 8:16'],
      ['아비새', 85, 50, 40, 55, 60, null, 'hebron', '스루야의 아들, 요압의 아우. 창으로 삼백 명을 죽였다.', '삼상 26:6-9; 삼하 23:18'],
      ['아사헬', 75, 45, 35, 55, 60, null, 'hebron', '스루야의 아들, 발이 들노루 같이 빠른 청년.', '삼하 2:18'],
      ['브나야', 90, 60, 50, 60, 75, null, 'beersheba', '갑스엘 사람 여호야다의 아들. 눈 올 때에 구덩이에 내려가 사자를 죽였다. 훗날 솔로몬의 군대 장관.', '삼하 23:20-23; 왕상 2:35'],
      ['요셉밧세벳', 96, 40, 30, 40, 60, null, 'hebron', '다그몬 사람, 세 용사의 우두머리. 한 번에 팔백 명을 쳐 죽였다.', '삼하 23:8'],
      ['엘르아살', 94, 45, 30, 45, 70, null, 'bethlehem', '도도의 아들. 손이 피곤하여 칼에 붙도록 블레셋을 친 세 용사 중 하나.', '삼하 23:9-10'],
      ['삼마', 91, 40, 30, 45, 70, null, 'bethlehem', '하랄 사람 아게의 아들. 녹두나무 밭을 홀로 지킨 용사.', '삼하 23:11-12'],
      ['아히멜렉', 15, 65, 55, 65, 88, null, 'shiloh', '아히둡의 아들, 놉의 제사장. 도망하는 다윗에게 진설병과 골리앗의 칼을 주었다.', '삼상 21:1-9; 22:9-19'],
      ['아비아달', 25, 70, 65, 70, 92, null, 'shiloh', '아히멜렉의 아들. 놉의 학살에서 홀로 살아남아 에봇을 가지고 다윗에게 왔다.', '삼상 22:20-23; 23:6'],
      ['갓', 15, 88, 70, 75, 97, null, 'hebron', '다윗의 선견자. "이 요새에 있지 말고 유다 땅으로 들어가라" 하였다.', '삼상 22:5; 삼하 24:11'],
      ['나단', 20, 92, 80, 85, 99, null, 'hebron', '다윗 곁의 선지자. 영원한 왕조의 언약을 전하고, 죄를 지은 왕을 책망했다.', '삼하 7장; 12장'],
      ['사독', 30, 80, 70, 75, 95, null, 'shiloh', '아히둡의 아들, 엘르아살 계열의 제사장. 솔로몬에게 기름을 부었다.', '삼하 8:17; 왕상 1:39'],
      ['후새', 30, 85, 70, 75, 80, null, 'bethel', '아렉 사람, 다윗의 벗. 아히도벨의 계략을 무너뜨렸다.', '삼하 15:32-37; 17:14'],
      ['아히도벨', 15, 98, 88, 60, 40, null, 'hebron', '길로 사람. 그의 계략은 하나님께 물어서 받은 말씀과 같았다.', '삼하 16:23'],
      ['우리아', 82, 60, 50, 65, 88, null, 'hebron', '헷 사람, 다윗의 용사. "언약궤와 이스라엘과 유다가 야영 중에 있거늘 내가 어찌 집에 가겠나이까".', '삼하 11:11; 23:39'],
      ['솔로몬', 40, 99, 95, 88, 90, null, 'jerusalem', '다윗과 밧세바의 아들. 여호와께서 사랑하사 여디디야라 부르셨다. 지혜와 성전의 왕.', '삼하 12:24-25; 왕상 3:12'],
      ['아기스', 60, 70, 75, 70, 20, 'philistia', 'gath', '가드 왕 마옥의 아들. 도망한 다윗을 받아 시글락을 주었다.', '삼상 21:10; 27:2-6'],
      ['골리앗', 99, 30, 20, 40, 5, 'philistia', 'gath', '가드 사람, 키가 여섯 규빗 한 뼘. 놋 투구와 오천 세겔 비늘 갑옷을 입고 사십 일 동안 이스라엘을 모욕했다.', '삼상 17:4-10'],
      ['블레셋 방백', 68, 60, 60, 45, 5, 'philistia', 'ashdod', '블레셋 다섯 방백 중 하나.', '삼상 6:16; 29:6'],
      ['블레셋 수비대장', 72, 45, 40, 35, 5, 'philistia', 'ekron', '게바와 믹마스 어귀를 지키던 블레셋 수비대의 장수.', '삼상 13:3, 23'],
      ['블레셋 병거대장', 80, 50, 40, 40, 5, 'philistia', 'gaza', '병거 삼만과 마병 육천을 거느린 장수.', '삼상 13:5'],
      ['이스비브놉', 88, 30, 20, 30, 10, 'philistia', 'ashkelon', '거인족의 아들, 삼백 세겔 무게의 놋 창을 든 자. 아비새가 죽였다.', '삼하 21:16-17'],
      ['삽', 84, 30, 20, 25, 10, 'philistia', 'joppa', '거인족의 아들. 곱에서 후사 사람 십브개에게 죽었다.', '삼하 21:18'],
      ['라흐미', 86, 30, 20, 25, 10, 'philistia', 'bethshean', '골리앗의 아우.', '대상 20:5'],
      ['나하스', 82, 55, 50, 40, 10, 'ammon', 'rabbah', '길르앗 야베스를 에워싸고 오른눈을 빼겠다던 암몬 왕.', '삼상 11:1-2'],
      ['하눈', 55, 45, 45, 35, 15, 'ammon', 'rabbah', '나하스의 아들. 다윗의 조문 사절의 수염 절반을 깎고 옷을 잘랐다.', '삼하 10:1-4'],
      ['소비', 50, 60, 65, 70, 50, 'ammon', 'heshbon', '나하스의 아들. 훗날 마하나임에서 피난 온 다윗을 먹였다.', '삼하 17:27-29'],
      ['암몬 장수', 75, 40, 30, 30, 5, 'ammon', 'heshbon', '새벽에 사울의 세 부대에 흩어진 암몬 군의 장수.', '삼상 11:11'],
      ['아각', 75, 55, 50, 45, 5, 'amalek', 'kadesh', '아말렉 왕. "진실로 사망의 괴로움이 지났도다" 하며 나아왔다.', '삼상 15:8, 32'],
      ['아말렉 장수', 72, 40, 30, 30, 5, 'amalek', 'kadesh', '하윌라에서 술까지 흩어진 아말렉 군의 장수. 훗날 시글락을 불살랐다.', '삼상 15:7; 30:1'],
      ['모압 왕', 60, 55, 60, 50, 20, 'moab', 'kirhareseth', '모압의 왕. 성경은 그 이름을 밝히지 않는다. 다윗의 부모를 맡아 주었다.', '삼상 14:47; 22:3-4'],
      ['에돔 왕', 65, 55, 50, 45, 10, 'edom', 'bozrah', '에돔의 왕. 성경은 이 무렵 에돔 왕의 이름을 밝히지 않는다.', '삼상 14:47'],
      ['하닷', 70, 65, 55, 60, 20, 'edom', 'bozrah', '에돔 왕족. 어려서 애굽으로 도망했다가 솔로몬의 대적이 되었다.', '왕상 11:14-22'],
      ['하닷에셀', 80, 70, 70, 60, 20, 'aram', 'damascus', '르홉의 아들 소바 왕. 유브라데 강까지 권세를 넓히려 했다.', '삼하 8:3; 10:16'],
      ['소박', 88, 55, 35, 45, 15, 'aram', 'damascus', '하닷에셀의 군대 장관. 헬람에서 다윗에게 죽었다.', '삼하 10:16-18'],
      ['르손', 75, 65, 50, 55, 15, 'aram', 'edrei', '엘리아다의 아들. 하닷에셀을 떠나 무리를 모았고 훗날 다메섹의 왕이 되어 솔로몬의 대적이 되었다.', '왕상 11:23-25'],
      ['아라우나', 40, 60, 70, 60, 40, 'canaan_jebus', 'jerusalem', '여부스 사람. 그의 타작마당이 훗날 성전 터가 된다.', '삼하 24:16-24; 대하 3:1'],
      ['히람', 50, 80, 90, 85, 50, 'tyre', 'tyre', '두로 왕 히람 1세. 다윗을 평생 사랑했고 솔로몬에게 백향목과 잣나무를 보냈다.', '삼하 5:11; 왕상 5:1-12'],
      ['도이', 45, 70, 75, 70, 30, 'hamath', 'hamath', '하맛 왕. 하닷에셀과 싸우던 적이었다 (대상 18:9에서는 도우).', '삼하 8:9-10'],
      ['요람', 50, 60, 65, 70, 30, 'hamath', 'hamath', '도이의 아들 (대상 18:10에서는 하도람). 다윗에게 금·은·놋 그릇을 가져왔다.', '삼하 8:10'],
      ['바로', 55, 80, 85, 75, 10, 'egypt', 'tanis', '솔로몬의 장인이 된 애굽 왕. 성경은 그 이름을 밝히지 않는다(학자들은 21왕조의 시아문으로 보기도 하나 확실하지 않다).', '왕상 3:1; 9:16'],
    ],
    rel: [[P, 'tyre', 60], [P, 'hamath', 45], [P, 'egypt', 35], [P, 'moab', 40], ['philistia', 'ammon', 45], ['philistia', 'amalek', 45], ['aram', 'ammon', 50], ['aram', 'hamath', 10],
      [P, 'philistia', 10], [P, 'ammon', 10], [P, 'amalek', 5], [P, 'aram', 20], [P, 'edom', 20]],
    goals: { [P]: ['jerusalem', 'hebron', 'bethlehem', 'beersheba', 'bethel', 'shiloh', 'shechem', 'megiddo', 'hazor', 'dan', 'mahanaim', 'ramoth', 'rabbah', 'kirhareseth', 'bozrah', 'damascus', 'gaza', 'carchemish'] },
    goalText: { [P]: '"솔로몬이 유브라데 강에서부터 블레셋 사람의 땅에 이르기까지와 애굽 지경에 미치기까지의 모든 나라를 다스리므로"(왕상 4:21). 단에서 브엘세바까지의 본토, 암몬·모압·에돔, 다메섹, 가사, 그리고 유브라데 나루 갈그미스까지 18성 — 성경은 북쪽 끝을 딥사(4:24)라 하는데, 이 게임 지도에서는 가까운 유브라데 나루 갈그미스로 삼았다.' },
  });

  // ---------- 역사 사건 ----------
  EVENTS[ID] = [
    // --- 사울의 왕국 ---
    { id: 'smiths', who: P, auto: 0,
      cond: G => G.turn >= 1 && G.exists(P) && G.exists('philistia'),
      title: '이스라엘에 대장장이가 없다', ref: '삼상 13:19-22',
      text: '블레셋 사람들이 "히브리 사람이 칼이나 창을 만들까 하노라" 하여 이스라엘 온 땅에 대장장이를 두지 않았다. 보습과 곡괭이를 벼리려면 블레셋 사람에게로 내려가야 했고, 싸우는 날에 칼과 창을 가진 자는 사울과 요나단뿐이었다.',
      choices: [
        { label: '돌과 나무로 물매와 방패를 스스로 마련한다', run: G => {
          U.gold(G, -100); G.item(P, 'sling', 1); G.item(P, 'shield', 1); G.res(P, { wood: 200, stone: 200 });
          G.eachCity(P, c => { c.train += 5; });
          return '금 -100. 물매 돌과 큰 방패를 얻고 나무·돌 +200. 모든 성의 훈련 +5.'; } },
        { label: '블레셋에 은을 내고 농기구를 벼린다', run: G => {
          U.gold(G, -150); U.food(G, 1500); G.rel(P, 'philistia', 10);
          return '금 -150, 식량 +1500. 블레셋과의 관계 +10. 칼과 창은 여전히 없다.'; } },
      ] },
    { id: 'jabesh', who: P, auto: 0,
      cond: G => G.turn >= 2 && G.exists(P) && !G.ownerOf('ramoth'),
      title: '길르앗 야베스를 구원하라', ref: '삼상 11:1-15',
      text: '암몬 사람 나하스가 길르앗 야베스(라못길르앗)를 에워싸고 "너희 오른눈을 다 빼야 언약하리라" 하였다. 밭에서 소를 몰고 오던 사울이 이 말을 듣자 하나님의 영이 크게 임하였다. 그가 소 한 겨리를 잡아 각을 떠서 이스라엘 온 지경에 보냈다.',
      choices: [
        { label: '온 이스라엘을 모아 새벽에 세 부대로 친다', run: G => {
          const r = G.city('ramoth'); r.owner = P; r.soldiers += 1500; r.loy = 90; r.faith += 15;
          U.cut(G, 'ammon', 0.7, ['rabbah']);
          G.buff(P, 'atk', 3, 0.25); U.faithAll(G, 0, 5);
          G.flags.jabesh = true; G.kingdom(6, '야베스의 구원');
          return '새벽에 암몬 군을 쳐서 날이 더울 때까지 죽였다. 길르앗 야베스(라못길르앗)가 합류했고, 랍바의 암몬 군 30% 궤멸. 3턴 동안 공격력 +25%, 민심 +5. "오늘은 사람을 죽이지 못할 것은 여호와께서 이스라엘 중에 구원을 베푸셨음이라" (11:13). 백성이 길갈에서 사울을 왕으로 삼고 크게 기뻐했다.'; } },
        { label: '싸움을 피하고 야베스를 내버려 둔다', run: G => {
          if (G.exists('ammon')) { const r = G.city('ramoth'); r.owner = 'ammon'; r.soldiers = 2500; }
          U.faithAll(G, -5, -10);
          return '나하스가 길르앗 야베스(라못길르앗)를 차지했다. 민심 -10, 신앙 -5. "이 사람이 어떻게 우리를 구원하겠느냐" 하는 불량배들의 말이 퍼진다.'; } },
      ] },
    { id: 'gilgal', who: P, auto: 0,
      cond: G => G.turn >= 5 && G.exists(P) && U.inArmy(G, '사울') && G.alive('사무엘'),
      title: '길갈의 제사', ref: '삼상 13:8-14',
      text: '블레셋이 믹마스에 진을 치자 백성이 굴과 수풀과 바위틈에 숨었다. 사울은 사무엘이 정한 이레를 기다렸으나 사무엘이 오지 않고 백성은 흩어져 간다. 사울이 말했다. "번제와 화목제물을 이리로 가져오라."',
      choices: [
        { label: '흩어지는 백성을 보면서도 사무엘을 끝까지 기다린다', run: G => {
          const cap = U.home(G); if (cap) cap.soldiers = Math.floor(cap.soldiers * 0.85);
          U.faithAll(G, 10, -3); U.stat(G, '사울', 'fai', 10);
          G.flags.waitedSamuel = true; G.kingdom(5, '말씀을 기다림');
          return '본거지의 병력 15%가 흩어졌지만, 사무엘이 와서 제사를 드렸다. 신앙 +10, 민심 -3, 사울 신앙 +10. 성경의 역사에서는 사울이 기다리지 못하고 직접 번제를 드렸다(13:9) — 이 게임에서는 기다린 사울을 그려 본다.'; } },
        { label: '왕이 직접 번제를 드린다', run: G => {
          U.faithAll(G, -10, 3); U.stat(G, '사울', 'fai', -15);
          G.flags.gilgalSin = true; G.kingdom(-5, '망령된 제사');
          return '번제를 마치자마자 사무엘이 왔다. "왕이 망령되이 행하였도다. 이제는 왕의 나라가 길지 못할 것이라" (13:13-14). 신앙 -10, 사울 신앙 -15.'; } },
      ] },
    { id: 'michmash', who: P, auto: 0,
      cond: G => G.turn >= 7 && G.exists(P) && G.exists('philistia') && U.inArmy(G, '요나단'),
      title: '요나단과 무기를 든 소년', ref: '삼상 14:1-23',
      text: '요나단이 무기를 든 소년에게 말했다. "할례 받지 않은 자들의 부대에게로 건너가자. 여호와의 구원은 사람이 많고 적음에 달리지 아니하였느니라." 둘이 보세스와 세네 바위 사이로 기어올라 블레셋 수비대를 치자, 땅이 진동하고 블레셋 진영에 큰 떨림이 일어났다.',
      choices: [
        { label: '요나단을 따라 온 군대가 추격하고, 백성을 먹여 힘을 얻게 한다', run: G => {
          G.buff(P, 'atk', 4, 0.3);
          const t = ['ekron', 'gath', 'ashdod'].find(id => G.ownerOf(id) === 'philistia'); if (t) G.city(t).soldiers = Math.floor(G.city(t).soldiers * 0.6);
          U.stat(G, '요나단', 'war', 3); U.stat(G, '요나단', 'cha', 3); G.item(P, 'trumpet', 1);
          G.kingdom(5, '많고 적음에 달리지 않은 구원');
          return '블레셋 사람들이 서로 칼로 쳤다. 4턴 동안 공격력 +30%' + (t ? `, ${{ ekron: '에그론', gath: '가드', ashdod: '아스돗' }[t]}의 블레셋 수비대 40% 궤멸` : '') + '. 요나단 무력·매력 +3. 양각 나팔을 얻었다.'; } },
        { label: '"원수에게 갚기까지 음식을 먹는 자는 저주를 받으리라" 맹세한다', run: G => {
          G.buff(P, 'atk', 3, 0.15); U.faithAll(G, 0, -10);
          G.flags.saulOath = true;
          return '백성이 피곤하여 탈진했다. 요나단이 꿀을 찍어 먹은 일로 죽을 뻔했으나 백성이 그를 구원했다 (14:24-45). 3턴 동안 공격력 +15%, 민심 -10.'; } },
      ] },
    { id: 'amalek', who: P, auto: 0,
      cond: G => G.turn >= 10 && G.exists(P) && U.inArmy(G, '사울'),
      title: '아말렉을 치라', ref: '삼상 15:1-23; 출 17:14-16',
      text: '사무엘이 사울에게 말했다. "만군의 여호와께서 이같이 말씀하시되, 아말렉이 이스라엘에게 행한 일 곧 애굽에서 올라올 때에 길에서 대적한 일로 내가 그들을 벌하노니, 지금 가서 그들의 모든 소유를 남기지 말라." 모세가 르비딤에서 제단을 쌓고 "여호와 닛시"라 부른 그 싸움의 끝이다.',
      choices: [
        { label: '말씀대로 온전히 행한다', run: G => {
          G.kill('아각'); U.cut(G, 'amalek', 0.4); U.faithAll(G, 15); U.stat(G, '사울', 'fai', 10);
          G.flags.amalekObeyed = true; G.kingdom(10, '온전한 순종');
          return '하윌라에서 술까지 아말렉을 쳤다. 아각이 죽고 아말렉 병력 60% 궤멸. 신앙 +15, 사울 신앙 +10. 성경의 역사에서는 사울이 아각과 좋은 가축을 남겼다(15:9) — 이 게임에서는 온전히 순종한 사울을 그려 본다.'; } },
        { label: '아각과 가장 좋은 양과 소를 남긴다', run: G => {
          G.kill('아각'); U.cut(G, 'amalek', 0.6); U.food(G, 3000); U.gold(G, 300);
          U.faithAll(G, -20); U.stat(G, '사울', 'fai', -20);
          G.flags.saulRejected = true; G.kingdom(-10, '여호와께서 사울을 버리심');
          return '식량 +3000, 금 +300. 그러나 사무엘이 말했다. "순종이 제사보다 낫고 듣는 것이 숫양의 기름보다 나으니"(15:22). 사무엘이 길갈에서 아각을 찍었다. 여호와께서 사울을 버리셨다 — 신앙 -20, 사울 신앙 -20.'; } },
      ] },
    { id: 'anoint', who: P, auto: 0,
      cond: G => G.done.amalek && G.exists(P) && G.alive('다윗') && (!G.facOf('다윗') || G.facOf('다윗') === P),
      title: '이새의 막내에게 기름을 붓다', ref: '삼상 16:1-23',
      text: '"너는 뿔에 기름을 채워 가지고 베들레헴 사람 이새에게로 가라." 엘리압을 보고 사무엘이 "여호와의 기름 부으실 자가 과연 주님 앞에 있도다" 하였으나 여호와께서 말씀하셨다. "사람은 외모를 보거니와 나 여호와는 중심을 보느니라." 들에서 양을 치던 막내 다윗이 불려 왔다.',
      choices: [
        { label: '다윗을 궁으로 불러 수금을 타게 한다', run: G => {
          U.raise(G, '다윗'); U.raise(G, '이새', 'bethlehem'); U.stat(G, '다윗', 'fai', 1); U.stat(G, '다윗', 'cha', 3);
          G.item(P, 'anointing_horn', 1); G.flags.davidAnointed = true; G.kingdom(5, '중심을 보시는 여호와');
          return '사무엘이 기름 뿔을 가져다가 형제 중에서 다윗에게 부었다. 여호와의 영이 다윗에게 크게 감동되었다(16:13). 사울이 다윗을 사랑하여 무기를 드는 자로 삼았다(16:21). 다윗과 이새가 합류했다. 기름 뿔을 얻었다.'; } },
        { label: '이새의 집에 조용히 머물게 둔다', run: G => {
          U.stat(G, '다윗', 'fai', 1); G.item(P, 'anointing_horn', 1); G.flags.davidAnointed = true;
          return '사무엘이 형들 가운데서 다윗에게 기름을 부었다. 다윗은 아직 베들레헴의 들에서 양을 친다 (인재 명령으로 등용할 수 있다). 기름 뿔을 얻었다.'; } },
      ] },
    { id: 'goliath', who: P, auto: 0, repeat: true,
      cond: G => G.turn >= 12 && G.exists(P) && !G.flags.goliathSlain && G.turn >= (G.flags.goliathRetry || 0),
      title: '엘라 골짜기의 골리앗', ref: '삼상 17장',
      text: '가드 사람 골리앗이 사십 일 동안 아침저녁으로 나와 "사람을 택하여 내게로 내려보내라" 하고 이스라엘을 모욕했다. 형들에게 떡을 가져온 소년 다윗이 말했다. "너는 칼과 창과 단창으로 내게 나아오거니와 나는 만군의 여호와의 이름 곧 네가 모욕하는 이스라엘 군대의 하나님의 이름으로 네게 나아가노라."',
      choices: [
        { label: '사울의 갑옷을 벗고 물매와 매끄러운 돌 다섯을 든 다윗을 보낸다', run: G => {
          const d = U.raise(G, '다윗');
          G.kill('골리앗'); U.stat(G, '다윗', 'war', 5); U.stat(G, '다윗', 'cha', 5);
          G.item(P, 'david_sling', 1); G.buff(P, 'atk', 4, 0.3);
          ['gath', 'ekron'].forEach(id => { if (G.ownerOf(id) === 'philistia') G.city(id).soldiers = Math.floor(G.city(id).soldiers * 0.7); });
          U.faithAll(G, 10, 5); G.flags.goliathSlain = true; G.kingdom(8, '만군의 여호와의 이름으로');
          return '돌이 골리앗의 이마에 박혔다' + (d ? '. 다윗이 하나님의 군대에 합류하고' : ', ') + ' 다윗의 물매를 얻었다. 4턴 동안 공격력 +30%, 가드·에그론의 블레셋 군 30% 궤멸, 신앙 +10, 민심 +5. "전쟁은 여호와께 속한 것이라" (17:47).'; } },
        { label: '사십 일을 더 버티며 용사를 찾는다', ok: G => (G.flags.goliathWaits || 0) < 2, run: G => {
          U.faithAll(G, 0, -10); G.buff('philistia', 'atk', 3, 0.2); G.flags.goliathRetry = G.turn + 3; G.flags.goliathWaits = (G.flags.goliathWaits || 0) + 1;
          return '이스라엘 군이 크게 두려워한다. 민심 -10, 블레셋 3턴 동안 공격력 +20%. 골리앗은 또 나올 것이다.'; } },
      ] },
    { id: 'covenant', who: P, auto: 0,
      cond: G => G.flags.goliathSlain && G.turn >= 14 && G.exists(P),
      title: '사울은 천천이요 다윗은 만만이로다', ref: '삼상 18:1-16; 20:12-17',
      text: '요나단의 마음이 다윗의 마음과 하나가 되어 자기 겉옷과 칼과 활과 띠를 다윗에게 주고 언약을 맺었다. 그러나 여인들이 춤추며 "사울이 죽인 자는 천천이요 다윗은 만만이로다" 하고 노래하자, 그날부터 사울이 다윗을 주목하였다.',
      choices: [
        { label: '질투를 내려놓고 다윗을 천부장으로 세운다', ok: G => G.alive('요나단') && G.alive('다윗'), run: G => {
          U.raise(G, '다윗'); U.stat(G, '요나단', 'fai', 3); U.stat(G, '사울', 'fai', 5); U.stat(G, '사울', 'cha', 5);
          U.faithAll(G, 0, 10); G.flags.jonathanCovenant = true; G.kingdom(5, '요나단과 다윗의 언약');
          return '요나단과 다윗이 여호와 앞에서 언약을 맺었다. 민심 +10, 사울 신앙·매력 +5. 성경의 역사에서는 사울이 다윗을 시기하여 창을 던졌다(18:11) — 이 게임에서는 질투를 이긴 사울을 그려 본다.'; } },
        { label: '수금을 타는 다윗에게 창을 던진다', run: G => {
          const d = G.o('다윗'); if (d && d.alive) { d.fac = null; d.city = G.exists('philistia') ? G.fac('philistia').capital : 'bethlehem'; }
          U.faithAll(G, -10, -10); U.stat(G, '사울', 'fai', -10);
          G.flags.saulJealous = G.turn; G.kingdom(-5, '사울의 질투');
          return '다윗이 두 번 몸을 피했다. 미갈이 그를 창문으로 달아나게 했고, 다윗은 가드 왕 아기스에게로 도망했다 (19:11-17; 21:10). 다윗이 재야로 떠났다. 민심 -10, 신앙 -10.'; } },
      ] },
    { id: 'nob', who: P, auto: 0,
      cond: G => G.done.covenant && G.turn >= 16 && G.exists(P),
      title: '놉의 제사장들', ref: '삼상 21:1-9; 22:6-23',
      text: '다윗이 놉에 이르러 제사장 아히멜렉에게서 거룩한 떡을 얻었다. 아히멜렉이 말했다. "네가 엘라 골짜기에서 죽인 블레셋 사람 골리앗의 칼이 보자기에 싸여 에봇 뒤에 있으니 네가 그것을 가지려거든 가지라." 그 자리에 사울의 목자장 에돔 사람 도엑이 있었다.',
      choices: [
        { label: '도엑의 고발을 물리치고 제사장들을 보호한다', run: G => {
          ['아히멜렉', '아비아달'].forEach(n => U.raise(G, n, 'shiloh'));
          G.item(P, 'sword_goliath', 1); G.item(P, 'urim_thummim', 1);
          if (U.inArmy(G, '도엑')) G.join('도엑', G.exists('edom') ? 'edom' : P);
          U.faithAll(G, 10); G.flags.nobSpared = true; G.kingdom(6, '제사장을 지키다');
          return '골리앗의 칼과 우림과 둠밈(에봇)을 얻었다. 아히멜렉·아비아달 합류, 신앙 +10' + (G.facOf('도엑') === 'edom' ? ', 도엑은 에돔으로 떠났다' : '') + '. 성경의 역사에서는 사울의 명령으로 도엑이 제사장 팔십오 명을 죽였고 아비아달만 에봇을 가지고 다윗에게 피했다(22:18-20; 23:6) — 이 게임에서는 제사장들이 살아남는 길을 그려 본다.'; } },
        { label: '"너희가 다 공모하여 나를 대적하였다" — 사울이 도엑에게 명한다', run: G => {
          G.kill('아히멜렉'); U.raise(G, '아비아달', 'shiloh'); G.item(P, 'sword_goliath', 1); G.item(P, 'urim_thummim', 1);
          U.faithAll(G, -15); U.stat(G, '사울', 'fai', -15); G.flags.nobMassacre = true; G.kingdom(-8, '놉의 학살');
          return '도엑이 세마포 에봇 입은 제사장 팔십오 명을 죽였다. 아비아달이 홀로 살아남아 에봇을 가지고 도망했고, 다윗이 말했다. "두려워하지 말고 내게 있으라"(22:23). 골리앗의 칼과 우림과 둠밈(에봇)을 얻었다. 신앙 -15, 사울 신앙 -15.'; } },
      ] },
    { id: 'engedi', who: P, auto: 0,
      cond: G => G.flags.saulJealous && G.turn >= G.flags.saulJealous + 3 && G.alive('다윗') && !G.facOf('다윗') && G.exists(P),
      title: '엔게디의 굴', ref: '삼상 24장; 26장',
      text: '사울이 삼천 명을 거느리고 엔게디 들염소 바위에서 다윗을 찾다가 뒤를 보러 굴에 들어갔다. 그 굴 깊은 곳에 다윗과 그의 사람들이 있었다. 사람들이 말했다. "여호와께서 당신에게 이르시기를 내가 원수를 네 손에 넘기리니 네 생각에 좋은 대로 그에게 행하라 하시더니 이것이 그 날이니이다."',
      choices: [
        { label: '"여호와께서 기름 부으신 자를 치는 것은 여호와께서 금하시는 것" — 옷자락만 벤다', run: G => {
          ['다윗', '요압', '아비새', '아사헬', '갓'].forEach(n => U.raise(G, n));
          U.stat(G, '다윗', 'cha', 3); U.stat(G, '사울', 'fai', 5); U.faithAll(G, 8, 5);
          G.flags.engedi = true; G.kingdom(6, '기름 부음 받은 자를 치지 않다');
          return '사울이 소리를 높여 울며 말했다. "너는 나보다 의롭도다"(24:17). 성경의 역사에서는 다윗이 사울에게 돌아가지 않고 광야와 시글락에 머물렀다(27장) — 이 게임에서는 다윗과 그 용사들(요압·아비새·아사헬)과 선견자 갓이 하나님의 군대로 돌아온다. 신앙 +8, 민심 +5.'; } },
        { label: '사람들의 말대로 친다', run: G => {
          ['다윗', '요압', '아비새', '아사헬'].forEach(n => U.raise(G, n));
          G.kill('사울'); U.lead(G, '다윗'); U.faithAll(G, -15, -10); U.stat(G, '다윗', 'fai', -20);
          G.flags.saulSlainByDavid = true; G.kingdom(-12, '기름 부음 받은 자를 치다');
          return '성경의 다윗은 결코 그렇게 하지 않았다(24:6; 26:9-11). 사울이 죽고 다윗이 군대를 이끌지만, 백성의 마음이 무너졌다. 신앙 -15, 민심 -10, 다윗 신앙 -20.'; } },
      ] },
    { id: 'gilboa', who: P, auto: 0,
      cond: G => G.turn >= 22 && G.done.covenant && G.exists(P) && (!G.flags.saulJealous || G.done.engedi || !G.alive('다윗') || !!G.facOf('다윗')),
      title: '길보아 산', ref: '삼상 31장; 삼하 1–2장',
      text: '블레셋 사람들이 수넴에 진을 치고 이스라엘과 길보아 산에서 싸웠다. 이스라엘이 블레셋 앞에서 도망하여 길보아 산에서 엎드러졌고, 블레셋이 사울의 아들 요나단과 아비나답과 말기수아를 죽였다. 사울이 활 쏘는 자에게 중상을 입고 자기 칼 위에 엎드러졌다. 블레셋 사람들이 그 시체를 벧산 성벽에 못 박았고, 길르앗 야베스 사람들이 밤새 달려가 그 시체를 거두었다.',
      choices: [
        { label: '다윗이 활의 노래로 애도하고, 헤브론에서 유다의 왕으로 기름 부음을 받는다', run: G => {
          const sam = G.alive('사무엘'); ['사무엘', '사울', '요나단', '아비나답', '말기수아'].forEach(n => G.kill(n));
          ['다윗', '요압', '아비새', '아사헬'].forEach(n => U.raise(G, n, 'hebron')); U.lead(G, '다윗');
          if (G.exists('philistia') && G.ownerOf('bethshean') === 'philistia') G.city('bethshean').soldiers += 800;
          let t = '';
          if (U.mine(G, 'mahanaim') && G.fac(P).capital !== 'mahanaim' && G.cityCount(P) >= 5 && U.inArmy(G, '아브넬') && !G.exists('israel_n')) {
            G.rebel('israel_n', '이스라엘 (사울의 집)', 'mahanaim', ISHBOSHETH);
            G.join('아브넬', 'israel_n', 'mahanaim'); G.city('mahanaim').soldiers = 3000; G.fac('israel_n').aggr = 0.15;
            G.rel(P, 'israel_n', 40);
            t = ' 아브넬이 사울의 아들 이스보셋을 마하나임으로 데려가 이스라엘의 왕으로 세웠다(삼하 2:8-9) — 마하나임이 "이스라엘 (사울의 집)"이 되었다.';
          }
          U.faithAll(G, 5); G.flags.gilboa = G.turn; G.kingdom(4, '활의 노래');
          return (sam ? '그보다 앞서 사무엘이 죽어 온 이스라엘이 모여 슬피 울었다(삼상 25:1). ' : '') + '"이스라엘아 너의 영광이 산 위에서 죽임을 당하였도다. 오호라 두 용사가 엎드러졌도다… 요나단이여 나는 그대를 위하여 애통함은 그대는 내게 심히 아름다움이라"(삼하 1:19, 26). 사울과 요나단과 두 왕자가 죽었다. 다윗이 하나님의 군대를 이끈다(요압·아비새·아사헬 합류). 벧산의 블레셋 군 +800, 신앙 +5.' + t; } },
      ] },
    { id: 'abnerCovenant', who: P, auto: 0,
      cond: G => G.exists('israel_n') && G.flags.gilboa && G.turn >= G.flags.gilboa + 3 && G.alive('아브넬') && G.facOf('아브넬') === 'israel_n',
      title: '아브넬이 언약을 청하다', ref: '삼하 3:6-21',
      text: '사울의 집과 다윗의 집 사이에 전쟁이 오래 계속되었다. 이스보셋이 사울의 첩 리스바의 일로 아브넬을 책망하자, 아브넬이 크게 노하여 다윗에게 사자를 보냈다. "나와 언약을 맺으소서. 내 손이 당신을 도와 온 이스라엘이 당신에게 돌아가게 하리이다."',
      choices: [
        { label: '언약을 맺는다', run: G => {
          G.join('아브넬', P); G.flags.abnerJoined = G.turn; G.rel(P, 'israel_n', 20);
          return '아브넬이 하나님의 군대에 합류했다. 이스라엘(사울의 집)과의 관계 +20.'; } },
        { label: '"먼저 미갈을 돌려보내라" 하고 거절한다', run: G => {
          G.rel(P, 'israel_n', 10); G.flags.abnerRefused = true;
          return '아브넬은 마하나임에 남았다. 이스라엘(사울의 집)과의 관계 +10.'; } },
      ] },
    { id: 'joabRevenge', who: P, auto: 0,
      cond: G => G.flags.abnerJoined && G.turn >= G.flags.abnerJoined + 1 && U.inArmy(G, '아브넬') && U.inArmy(G, '요압'),
      title: '요압의 복수', ref: '삼하 2:18-23; 3:26-39',
      text: '기브온 못가의 싸움에서 아브넬은 끝까지 쫓아오던 요압의 아우 아사헬을 창 뒤끝으로 찔러 죽였다. 이제 요압이 아브넬을 헤브론 성문 안으로 데려가 조용히 말하는 척하며 그의 배를 찔렀다. 다윗이 말했다. "넬의 아들 아브넬의 피에 대하여 나와 내 나라는 여호와 앞에 영원히 무죄하니."',
      choices: [
        { label: '아브넬의 상여를 따르며 금식하고 애곡한다', run: G => {
          G.kill('아브넬'); G.kill('아사헬'); U.faithAll(G, 0, 10); if (G.exists('israel_n')) G.eachCity('israel_n', c => { c.loy -= 15; });
          return '아사헬과 아브넬이 죽었다. 온 백성이 아브넬의 죽음이 왕의 뜻이 아니었음을 알았다 (민심 +10, 이스라엘(사울의 집) 민심 -15).'; } },
      ] },
    { id: 'ishbosheth', who: P, auto: 0,
      cond: G => G.exists('israel_n') && G.flags.gilboa && G.turn >= G.flags.gilboa + (G.facOf('아브넬') === 'israel_n' ? 9 : 6),
      title: '온 이스라엘이 헤브론으로', ref: '삼하 4장; 5:1-5',
      text: '아브넬이 떠나자 이스보셋의 손이 풀렸다. 레갑과 바아나가 한낮에 이스보셋의 침상으로 들어가 그를 죽이고, 그 머리를 헤브론의 다윗에게 가져왔다. "왕의 원수 사울의 아들의 머리가 여기 있나이다."',
      choices: [
        { label: '악인을 처단하고, 이스라엘 장로들과 헤브론에서 언약을 맺는다', run: G => {
          G.kill('이스보셋'); if (G.exists('israel_n')) G.transferAll('israel_n', P); U.faithAll(G, 5, 5); G.flags.oneKingdom = true; G.kingdom(8, '온 이스라엘의 왕');
          return '다윗이 레갑과 바아나를 처형했다(4:12). 온 이스라엘 지파가 헤브론에 와서 "우리는 왕의 골육이니이다" 하고 다윗에게 기름을 부었다(5:1-3). 이스라엘(사울의 집)의 성과 장수가 모두 하나님의 군대에 합류했다. 신앙·민심 +5.'; } },
        { label: '그들에게 상을 준다', run: G => {
          G.kill('이스보셋'); if (G.exists('israel_n')) G.transferAll('israel_n', P); U.faithAll(G, -15); G.flags.oneKingdom = true; G.kingdom(-5, '피 묻은 상');
          return '이스라엘(사울의 집)이 합류했지만, 의인을 죽인 자에게 상을 준 일로 신앙이 크게 떨어졌다 (-15). 성경의 다윗은 그들을 처형했다(4:9-12).'; } },
      ] },
    // --- 다윗의 나라 ---
    { id: 'zionGate', who: P, auto: 0,
      cond: G => G.done.gilboa && G.exists('canaan_jebus') && G.ownerOf('jerusalem') === 'canaan_jebus' && U.near(G, 'jerusalem'),
      title: '맹인과 다리 저는 자라도', ref: '삼하 5:6-8; 대상 11:4-6',
      text: '다윗과 그의 부하들이 예루살렘으로 가서 여부스 사람을 치려 하자 그들이 말했다. "네가 결코 이리로 들어오지 못하리라. 맹인과 다리 저는 자라도 너를 물리치리라." 다윗이 말했다. "누구든지 여부스 사람을 치거든 물 긷는 데로 올라가서… 먼저 치는 자는 우두머리와 지휘관으로 삼으리라."',
      choices: [
        { label: '요압이 먼저 수구로 올라간다', run: G => {
          U.raise(G, '요압'); U.stat(G, '요압', 'war', 3);
          const j = G.city('jerusalem'); j.soldiers = Math.floor(j.soldiers * 0.35); j.def = Math.max(0, j.def - 30);
          G.buff(P, 'atk', 3, 0.3);
          return '스루야의 아들 요압이 먼저 올라가서 우두머리가 되었다(대상 11:6). 예루살렘 수비병 65% 궤멸, 성벽 -30, 3턴 동안 공격력 +30%. 이제 시온 산성을 치라!'; } },
        { label: '성을 에워싸고 기다린다', run: G => {
          const j = G.city('jerusalem'); j.soldiers = Math.floor(j.soldiers * 0.6);
          return '예루살렘 수비병 40%가 굶주려 흩어졌다. 시온 산성을 치라!'; } },
      ] },
    { id: 'zion', who: P, auto: 0,
      cond: G => U.mine(G, 'jerusalem'),
      title: '시온 산성, 다윗성', ref: '삼하 5:6-10',
      text: '다윗이 시온 산성을 빼앗았으니 이는 다윗성이다. 다윗이 점점 강성하여 가니 만군의 하나님 여호와께서 그와 함께 계셨다. 지파들 사이, 어느 편에도 치우치지 않은 이 산성이 온 이스라엘의 도읍이 된다.',
      choices: [
        { label: '예루살렘으로 도읍을 옮긴다', run: G => {
          G.fac(P).capital = 'jerusalem'; U.faithAll(G, 5, 5); const j = G.city('jerusalem'); j.def = Math.min(100, j.def + 10);
          U.raise(G, '아라우나', 'jerusalem'); G.flags.zionT = G.turn; G.kingdom(8, '다윗성');
          return '도읍을 예루살렘으로 옮겼다. 민심·신앙 +5, 예루살렘 성벽 +10. 여부스 사람 아라우나가 성에 남았다.'; } },
        { label: '지금의 도읍에 머문다', run: G => { G.flags.zionT = G.turn; return '도읍은 그대로다.'; } },
      ] },
    { id: 'hiram', who: P, auto: 0,
      cond: G => G.done.zion && G.exists('tyre'),
      title: '히람의 백향목', ref: '삼하 5:11-12',
      text: '두로 왕 히람이 다윗에게 사절과 백향목과 목수와 석수를 보내매 그들이 다윗을 위하여 집을 지었다. 다윗이 여호와께서 자기를 세우사 이스라엘 왕으로 삼으신 것과 그의 백성 이스라엘을 위하여 그 나라를 높이신 것을 알았다.',
      choices: [
        { label: '두로와 우호를 다진다', run: G => {
          if (U.mine(G, 'jerusalem')) { const j = G.city('jerusalem'); j.def = Math.min(100, j.def + 10); }
          G.rel(P, 'tyre', 25); U.gold(G, 300); G.res(P, { wood: 600, stone: 300 });
          return '예루살렘 성벽 +10, 금 +300, 목재 +600, 석재 +300, 두로와의 우호 +25.'; } },
      ] },
    { id: 'rephaim', who: P, auto: 0,
      cond: G => G.done.zion && G.exists('philistia'),
      title: '르바임 골짜기', ref: '삼하 5:17-25',
      text: '다윗이 온 이스라엘의 왕이 되었다는 소식에 블레셋 사람들이 르바임 골짜기에 가득 퍼졌다. 다윗이 여호와께 묻자 "올라가지 말고 그들 뒤로 돌아서 뽕나무 수풀 맞은편에서 그들을 기습하되, 뽕나무 꼭대기에서 걸음 걷는 소리가 들리거든 곧 공격하라. 그 때에 여호와가 너보다 앞서 가서 블레셋 군대를 치리라" 하셨다.',
      choices: [
        { label: '여호와께 묻고 기다린다', run: G => {
          G.buff(P, 'atk', 4, 0.3); U.cut(G, 'philistia', 0.8, ['gath', 'ekron']); G.kingdom(4, '여호와께 묻다');
          return '다윗이 게바에서 게셀까지 블레셋을 쳤다(5:25). 4턴 동안 공격력 +30%, 가드·에그론 블레셋 군 20% 궤멸.'; } },
        { label: '곧바로 맞서 싸운다', run: G => { G.buff('philistia', 'atk', 3, 0.15); return '블레셋의 기세가 3턴 동안 +15%.'; } },
      ] },
    { id: 'arkCart', who: P, auto: 0,
      cond: G => G.done.zion && G.done.gilboa && G.turn >= (G.flags.zionT || 0) + 1 && G.exists(P),
      title: '언약궤를 다윗성으로', ref: '삼하 6:1-11; 대상 13장; 15:2-15',
      text: '사무엘 때에 블레셋에게서 돌아온 하나님의 궤가 이십 년 넘게 바알레유다(기럇여아림) 아비나답의 집에 머물러 있다. 다윗이 이스라엘에서 뽑은 무리 삼만 명을 모아 궤를 메어 오려고 한다. 어떻게 옮길 것인가?',
      choices: [
        { label: '레위인들이 어깨에 메고 옮긴다 (모세의 규례대로)', run: G => {
          G.item(P, 'ark', 1); G.item(P, 'psalm_scroll', 1); U.faithAll(G, 15, 10);
          G.flags.arkZion = true; G.kingdom(10, '언약궤가 시온에');
          return '"레위 사람 외에는 하나님의 궤를 멜 수 없나니"(대상 15:2). 다윗이 여호와 앞에서 힘을 다해 춤추었고, 아삽과 그 형제들에게 감사 찬송을 부르게 했다(대상 16:7). 언약궤와 시편 두루마리를 얻었다. 신앙 +15, 민심 +10. 성경의 역사에서는 처음에 새 수레로 옮기다 웃사가 죽는 일이 먼저 있었다.'; } },
        { label: '새 수레에 싣고 옮긴다', run: G => {
          G.flags.arkWait = G.turn + 3; U.faithAll(G, 0, -5);
          return '나곤의 타작마당에서 소들이 뛰자 웃사가 손을 들어 궤를 붙들었다가 죽었다(6:6-7). 다윗이 두려워하여 궤를 가드 사람 오벧에돔의 집에 석 달 머물게 했다. 민심 -5.'; } },
      ] },
    { id: 'obedEdom', who: P, auto: 0,
      cond: G => G.flags.arkWait && G.turn >= G.flags.arkWait && !G.flags.arkZion && G.exists(P),
      title: '오벧에돔의 집에 내린 복', ref: '삼하 6:11-19; 대상 15장',
      text: '여호와께서 오벧에돔과 그의 온 집에 복을 주셨다는 소식이 다윗에게 들렸다. 다윗이 이번에는 레위 사람들을 성결하게 하여 궤를 어깨에 메게 하고, 메고 가는 자들이 여섯 걸음을 가매 소와 살진 송아지로 제사를 드렸다.',
      choices: [
        { label: '나팔을 불며 궤를 다윗성으로 모신다', run: G => {
          G.item(P, 'ark', 1); G.item(P, 'psalm_scroll', 1); U.faithAll(G, 15, 10); G.flags.arkZion = true; G.kingdom(8, '언약궤가 시온에');
          return '다윗이 여호와 앞에서 힘을 다해 춤추었다. 모든 백성에게 떡 한 개와 고기 한 조각과 건포도 떡 한 덩이씩 나누어 주었다(6:19). 언약궤와 시편 두루마리를 얻었다. 신앙 +15, 민심 +10.'; } },
      ] },
    { id: 'davidCovenant', who: P, auto: 0,
      cond: G => G.flags.arkZion && G.exists(P),
      title: '영원한 왕조의 언약', ref: '삼하 7장',
      text: '다윗이 선지자 나단에게 말했다. "볼지어다 나는 백향목 궁에 살거늘 하나님의 궤는 휘장 가운데에 있도다." 그 밤에 여호와의 말씀이 나단에게 임하였다. "네가 나를 위하여 내가 살 집을 건축하겠느냐… 여호와가 너를 위하여 집을 이루고… 네 몸에서 날 네 씨를 네 뒤에 세워 그의 나라를 견고하게 하리라. 그는 내 이름을 위하여 집을 건축할 것이요."',
      choices: [
        { label: '"주 여호와여 나는 누구이오며 내 집은 무엇이기에" — 엎드려 감사한다', run: G => {
          U.raise(G, '나단'); U.raise(G, '사독'); U.faithAll(G, 10); G.flags.davidCovenant = true; U.next(G, 3); G.kingdom(10, '다윗 언약');
          return '나단과 사독이 합류했다. 신앙 +10. 성전은 다윗이 아니라 그의 아들이 지을 것이다. 이 언약은 훗날 "다윗의 자손"으로 오실 메시아의 약속이 된다(마 1:1; 눅 1:32-33).'; } },
      ] },
    { id: 'zobah', who: P, auto: 0,
      cond: G => U.after(G, 'davidCovenant'),
      title: '하닷에셀과 하맛 왕 도이', ref: '삼하 8:1-14',
      text: '르홉의 아들 소바 왕 하닷에셀이 유브라데 강으로 가서 자기 권세를 회복하려 하였다. 다메섹의 아람 사람들이 그를 도우러 왔다. 그 밖에도 모압과 에돔과 블레셋이 사방에서 다윗을 대적한다. "다윗이 어디로 가든지 여호와께서 이기게 하셨더라"(8:6, 14).',
      choices: [
        { label: '여호와를 의지하여 사방의 대적을 친다 (병거의 말은 백 대만 남긴다)', run: G => {
          U.cut(G, 'aram', 0.5); U.cut(G, 'moab', 0.7); U.cut(G, 'edom', 0.7); U.cut(G, 'philistia', 0.85);
          G.buff(P, 'atk', 4, 0.3); U.faithAll(G, 5);
          let t = '';
          if (G.exists('hamath')) { G.rel(P, 'hamath', 40); U.gold(G, 800); t = ' 하맛 왕 도이가 아들 요람을 보내 문안하고 금·은·놋 그릇을 바쳤다(8:10; 금 +800, 하맛과의 관계 +40).'; }
          G.flags.zobah = true; U.next(G, 3); G.kingdom(8, '어디로 가든지 이기게 하심');
          return '아람 병력 50%, 모압·에돔 30%, 블레셋 15% 궤멸. 4턴 동안 공격력 +30%, 신앙 +5. 다윗이 병거의 말은 백 대만 남기고 모두 발의 힘줄을 끊었다(8:4; 신 17:16).' + t; } },
        { label: '말과 병거를 모두 거두어 군대를 키운다', run: G => {
          U.cut(G, 'aram', 0.6); U.add(G, 2000); U.faithAll(G, -5); if (G.exists('hamath')) G.rel(P, 'hamath', 20);
          G.flags.zobah = true; U.next(G, 3);
          return '아람 병력 40% 궤멸, 본거지 병력 +2000. 그러나 "왕은 자기를 위하여 말을 많이 두지 말 것이요"(신 17:16) — 신앙 -5.'; } },
      ] },
    { id: 'hanun', who: P, auto: 0,
      cond: G => U.after(G, 'zobah'),
      title: '하눈의 모욕과 랍바', ref: '삼하 10장; 11:1; 12:26-31',
      text: '암몬 왕 나하스가 죽자 다윗이 "나하스가 내게 은총을 베푼 것 같이 내가 그의 아들 하눈에게 은총을 베풀리라" 하고 조문 사절을 보냈다. 그러나 하눈은 사절들의 수염 절반을 깎고 의복의 중동볼기까지 자르고 돌려보냈다. 암몬이 아람 사람 보병 이만과 병거를 삯 내어 싸우러 나왔다.',
      choices: [
        { label: '요압이 말한다. "담대하라. 여호와께서 선히 여기시는 대로 행하시기를 원하노라"', run: G => {
          G.kill('나하스'); G.setRuler('ammon', '하눈'); U.cut(G, 'ammon', 0.5); U.cut(G, 'aram', 0.85); G.buff(P, 'atk', 4, 0.3); U.faithAll(G, 5);
          G.flags.hanunWar = true; U.next(G, 3); G.kingdom(5, '담대하라');
          return '요압과 아비새가 두 편으로 나뉘어 아람과 암몬을 쳤다(10:9-14). 암몬 병력 50%, 아람 15% 궤멸, 4턴 동안 공격력 +30%, 신앙 +5. 이듬해 봄 요압이 랍바를 에워쌌다.'; } },
        { label: '모욕을 참고 사절들을 여리고에 머물게 한다', run: G => {
          G.kill('나하스'); G.setRuler('ammon', '하눈'); G.rel(P, 'ammon', 15); if (U.mine(G, 'jericho')) G.city('jericho').loy += 10;
          G.flags.hanunWar = true; U.next(G, 3);
          return '"너희 수염이 자라기까지 여리고에서 머물다가 돌아오라"(10:5). 암몬과의 관계 +15. 그러나 암몬은 여전히 군대를 모으고 있다.'; } },
      ] },
    { id: 'bathsheba', who: P, auto: 0,
      cond: G => U.after(G, 'hanun'),
      title: '당신이 그 사람이라', ref: '삼하 11–12장; 시 51편',
      text: '그 해가 돌아와 왕들이 출전할 때에 다윗은 예루살렘에 머물러 있었다. 저녁에 왕궁 옥상에서 목욕하는 여인 밧세바를 보고 데려왔고, 그 남편 헷 사람 우리아를 싸움이 가장 맹렬한 곳에 두어 죽게 했다. 선지자 나단이 와서 가난한 사람의 암양 새끼 이야기를 했다. 다윗이 노하자 나단이 말했다. "당신이 그 사람이라."',
      choices: [
        { label: '"내가 여호와께 죄를 범하였노라" — 회개한다', run: G => {
          G.kill('우리아'); U.raise(G, '나단');
          U.stat(G, '다윗', 'fai', -5); U.faithAll(G, 5, -5); U.raise(G, '솔로몬');
          G.flags.bathshebaT = G.turn; U.next(G, 4); G.kingdom(3, '상한 심령');
          return '나단이 말했다. "여호와께서도 당신의 죄를 사하셨나니 당신이 죽지 아니하려니와"(12:13). 우리아가 죽었고, 그 아이도 죽었다. 다윗이 시편 51편을 지었다. "하나님이여 내 속에 정한 마음을 창조하시고 내 안에 정직한 영을 새롭게 하소서." 훗날 밧세바가 솔로몬을 낳았고 여호와께서 그를 사랑하셨다(12:24) — 솔로몬 합류. 신앙 +5, 민심 -5, 다윗 신앙 -5.'; } },
        { label: '선지자를 물리친다', run: G => {
          G.kill('우리아'); U.stat(G, '다윗', 'fai', -25); U.faithAll(G, -20, -10); U.raise(G, '솔로몬');
          G.flags.bathshebaT = G.turn; U.next(G, 4); G.kingdom(-12, '죄를 숨긴 왕');
          return '성경의 다윗은 곧바로 회개했다(12:13). 죄를 숨긴 왕 아래 신앙 -20, 민심 -10, 다윗 신앙 -25. 우리아가 죽었다. "칼이 네 집에서 영원토록 떠나지 아니하리라"(12:10). 솔로몬이 태어났다.'; } },
      ] },
    { id: 'absalom', who: P, auto: 1,
      cond: G => G.flags.bathshebaT && G.turn >= G.flags.bathshebaT + 4 && G.cityCount(P) >= 10 && U.mine(G, 'hebron') && G.fac(P).capital !== 'hebron' && !G.exists('absalom'),
      title: '압살롬의 반란', ref: '삼하 15–17장',
      text: '압살롬이 사 년 동안 성문 곁에서 백성의 마음을 훔치더니, 헤브론에서 나팔을 불어 왕이 되었다고 선포했다. 다윗의 모사 아히도벨도 그의 편에 섰다는 소문이다. 다윗은 맨발로 머리를 가리고 울며 감람산을 올랐다.',
      choices: [
        { label: '후새를 보내 아히도벨의 계략을 무너뜨린다', ok: G => G.alive('후새'), run: G => {
          U.raise(G, '후새'); G.rebel('absalom', '압살롬', 'hebron', ABSALOM);
          if (G.alive('아히도벨')) G.join('아히도벨', 'absalom', 'hebron');
          G.flags.absalomT = G.turn;
          return '압살롬이 헤브론에서 일어났다. 그러나 후새의 말에 압살롬이 아히도벨의 계략을 버렸다 — "여호와께서 압살롬에게 화를 내리려 하사 아히도벨의 좋은 계략을 물리치라고 명령하셨음이더라"(17:14). 아히도벨은 압살롬에게 갔다.'; } },
        { label: '성을 떠나 감람산을 울며 오른다', run: G => {
          G.rebel('absalom', '압살롬', 'hebron', ABSALOM); if (G.alive('아히도벨')) G.join('아히도벨', 'absalom', 'hebron');
          U.faithAll(G, 5); G.flags.absalomT = G.turn;
          return '압살롬이 헤브론을 차지했고 아히도벨이 그에게 갔다. 왕의 겸손에 신앙 +5. "여호와여 나의 대적이 어찌 그리 많은지요"(시 3:1).'; } },
      ] },
    { id: 'absalomEnd', who: P, auto: 0,
      cond: G => G.exists('absalom') && G.flags.absalomT && G.turn >= G.flags.absalomT + 4,
      title: '내 아들 압살롬아', ref: '삼하 18:1–19:8',
      text: '에브라임 수풀에서 싸움이 벌어졌다. 다윗은 "나를 위하여 젊은 압살롬을 너그러이 대우하라" 부탁했으나, 노새를 탄 압살롬의 머리가 상수리나무에 걸렸고 요압이 작은 창 셋으로 그의 심장을 찔렀다. 왕이 문 위층으로 올라가 울며 말했다. "내 아들 압살롬아 내 아들 내 아들 압살롬아 차라리 내가 너를 대신하여 죽었더면."',
      choices: [
        { label: '슬픔을 누르고 백성을 위로한다', run: G => {
          G.kill('압살롬'); G.kill('아히도벨'); if (G.exists('absalom')) G.transferAll('absalom', P); U.faithAll(G, 3, 5);
          return '압살롬이 죽고 아히도벨은 스스로 목숨을 끊었다(17:23). 반란군의 성과 병사가 다시 하나님의 군대로 돌아왔다. 신앙 +3, 민심 +5.'; } },
      ] },
    { id: 'census', who: P, auto: 0,
      cond: G => U.after(G, 'bathsheba') && !G.exists('absalom'),
      title: '아라우나의 타작마당', ref: '삼하 24장; 대상 21장; 대하 3:1',
      text: '다윗이 요압에게 "이스라엘과 유다의 인구를 조사하라" 명했다. 요압이 말렸으나 왕의 명령이 이겼다. 조사를 마친 뒤 다윗의 마음이 자책했다. 선견자 갓이 와서 세 가지 가운데 하나를 택하라 했다. 다윗이 말했다. "우리가 여호와의 손에 빠지고 사람의 손에 빠지지 아니하기를 원하노라."',
      choices: [
        { label: '갓의 말대로 아라우나의 타작마당에 제단을 쌓고, 값을 치르고 산다', run: G => {
          U.raise(G, '갓'); G.eachCity(P, c => { c.soldiers = Math.floor(c.soldiers * 0.9); });
          U.gold(G, -50); U.faithAll(G, 12); G.flags.templeSite = true; U.next(G, 3); G.kingdom(6, '값 없이는 드리지 않으리라');
          return '온역이 돌아 모든 성 병력 10%를 잃었다. 다윗이 말했다. "값 없이는 번제를 내 하나님 여호와께 드리지 아니하리라"(24:24). 은 오십 세겔(금 -50)로 타작마당을 사서 제단을 쌓자 재앙이 그쳤다. 이곳 모리아 산이 훗날 성전 터가 된다(대하 3:1). 신앙 +12.'; } },
        { label: '요압의 간언을 듣고 인구 조사를 멈춘다', run: G => {
          U.raise(G, '갓'); U.faithAll(G, 6); G.flags.templeSite = true; U.next(G, 3);
          return '성경의 역사에서는 조사를 끝까지 마쳐 온역이 내렸다 — 이 게임에서는 멈춘 길을 그려 본다. 교만을 내려놓은 왕이 아라우나의 타작마당에 감사의 제단을 쌓았다. 신앙 +6.'; } },
      ] },
    { id: 'hosts', who: P, auto: 0, repeat: true,
      cond: G => G.turn >= 4 && G.exists(P) && G.cityCount(P) > 0 && G.cityCount(P) <= 3 && G.turn >= (G.flags.hostsNext || 0),
      title: '마하나임 — 하나님의 군대', ref: '창 32:1-2; 왕하 6:16-17',
      text: '성읍들을 잃고 남은 무리가 두려워 떨었다. 그러나 야곱이 길을 갈 때 하나님의 사자들이 그를 만났고, 야곱이 그들을 보고 "이는 하나님의 군대라" 하여 그 땅 이름을 마하나임이라 하였다. 훗날 엘리사의 사환이 눈을 뜨고 보니 "불말과 불병거가 산에 가득하여 엘리사를 둘렀더라." "두려워하지 말라 우리와 함께 한 자가 그들과 함께 한 자보다 많으니라."',
      choices: [
        { label: '"여호와여 원하건대 그의 눈을 열어서 보게 하옵소서" — 기도하고 다시 일어선다', run: G => {
          G.eachCity(P, c => { c.soldiers += 2000; c.loy += 10; c.faith += 10; });
          G.buff(P, 'atk', 4, 0.3); G.flags.hostsNext = G.turn + 10; G.kingdom(3, '하나님의 군대');
          return '남은 모든 성에 병력 +2000, 민심·신앙 +10, 4턴 동안 공격력 +30%. (이 게임에서 하나님의 군대가 무너질 때 한 번씩 찾아오는 도움이다. 열 턴 뒤에 다시 찾아올 수 있다.)'; } },
      ] },
    // --- 솔로몬의 나라 ---
    { id: 'solomonKing', who: P, auto: 0,
      cond: G => U.after(G, 'census'),
      title: '기혼에서 기름 부음 받은 솔로몬', ref: '왕상 1–2장',
      text: '다윗이 나이 많아 늙자 학깃의 아들 아도니야가 스스로 높여 "내가 왕이 되리라" 하고 잔치를 벌였다. 선지자 나단과 밧세바가 다윗에게 나아가 "왕께서 전에 솔로몬이 왕이 되리라 맹세하지 아니하셨나이까" 하였다. 다윗이 말했다. "제사장 사독과 선지자 나단과 브나야를 불러라."',
      choices: [
        { label: '솔로몬을 다윗의 노새에 태우고 기혼에서 기름을 붓는다', run: G => {
          ['솔로몬', '브나야', '사독', '나단'].forEach(n => U.raise(G, n)); U.lead(G, '솔로몬');
          G.kill('다윗'); G.kill('요압'); U.faithAll(G, 5, 5); G.flags.solomon = G.turn; U.next(G, 2); G.kingdom(6, '솔로몬 즉위');
          return '제사장 사독이 성막 가운데서 기름 담은 뿔을 가져다가 솔로몬에게 부었고, 뿔나팔을 불며 "솔로몬 왕 만세" 하였다(1:39). 다윗이 "너는 힘써 대장부가 되고 여호와의 도를 지키라" 유언하고 조상들과 함께 누웠다(2:2-3, 10). 요압도 세상을 떠났고 브나야가 군대 장관이 되었다(2:34-35). 솔로몬이 하나님의 군대를 이끈다. 신앙·민심 +5.'; } },
      ] },
    { id: 'gibeon', who: P, auto: 0,
      cond: G => U.after(G, 'solomonKing'),
      title: '듣는 마음을 주소서', ref: '왕상 3:4-28',
      text: '기브온 산당에서 밤에 여호와께서 솔로몬의 꿈에 나타나 말씀하셨다. "내가 네게 무엇을 줄꼬 너는 구하라." 솔로몬이 말했다. "나는 작은 아이라 출입할 줄을 알지 못하고… 듣는 마음을 종에게 주사 주의 백성을 재판하여 선악을 분별하게 하옵소서."',
      choices: [
        { label: '지혜로운 마음을 구한다', run: G => {
          U.stat(G, '솔로몬', 'int', 1); U.stat(G, '솔로몬', 'pol', 5); U.gold(G, 1500); U.faithAll(G, 8, 10);
          G.flags.wisdom = true; U.next(G, 2); G.kingdom(8, '듣는 마음');
          return '"네가 구하지 아니한 부귀와 영광도 네게 주노니"(3:13). 두 창기의 아이 재판에서 온 이스라엘이 왕에게 하나님의 지혜가 있음을 보았다(3:28). 금 +1500, 신앙 +8, 민심 +10, 솔로몬 정치 +5.'; } },
        { label: '부와 원수의 생명을 구한다', run: G => {
          U.gold(G, 2500); U.faithAll(G, -10); U.next(G, 2); G.kingdom(-4, '자기를 위한 구함');
          return '성경의 솔로몬은 지혜를 구했다. 금 +2500, 그러나 신앙 -10.'; } },
      ] },
    { id: 'pharaohDaughter', who: P, auto: 0,
      cond: G => U.after(G, 'solomonKing') && G.exists('egypt'),
      title: '바로의 딸', ref: '왕상 3:1; 9:16; 11:1-4',
      text: '애굽 왕 바로가 솔로몬에게 혼인 동맹을 청한다. 바로는 가나안의 게셀을 쳐서 불사르고 그 성을 딸에게 예물로 주겠다고 한다. 애굽의 공주가 이방 왕에게 시집가는 일은 드물었다 — 그만큼 이스라엘이 강해졌다는 뜻이다. 성경은 이 바로의 이름을 밝히지 않는다(학자들은 21왕조의 시아문으로 보기도 하나 확실하지 않다).',
      choices: [
        { label: '바로와 혼인 동맹을 맺는다', run: G => {
          G.rel(P, 'egypt', 50); U.gold(G, 1000); U.faithAll(G, -5); G.flags.egyptMarriage = true; U.next(G, 2);
          return '애굽과의 관계 +50, 금 +1000(게셀과 예물). 그러나 이것이 이방 여인들을 사랑한 긴 이야기의 시작이 되었다(11:1). 신앙 -5.'; } },
        { label: '"왕은 아내를 많이 두어 마음이 미혹되게 하지 말라" — 정중히 사양하고 무역만 맺는다', run: G => {
          G.rel(P, 'egypt', 20); U.gold(G, 400); U.faithAll(G, 5); U.next(G, 2);
          return '성경의 역사에서는 솔로몬이 바로의 딸을 맞았다 — 이 게임에서는 신명기 17:17을 지킨 길을 그려 본다. 애굽과의 관계 +20, 금 +400(말과 병거 무역, 10:28), 신앙 +5.'; } },
      ] },
    { id: 'temple', who: P, auto: 0,
      cond: G => G.done.gibeon && (G.done.pharaohDaughter || !G.exists('egypt')) && G.turn >= (G.flags.uNext || 0) && U.mine(G, 'jerusalem'),
      title: '여호와의 이름을 위한 성전', ref: '왕상 5–8장; 대하 3:1',
      text: '이스라엘 자손이 애굽에서 나온 지 사백팔십 년, 솔로몬 넷째 해 시브월에 솔로몬이 모리아 산 아라우나의 타작마당에 여호와의 성전을 건축하기 시작했다(왕상 6:1). 두로 왕 히람이 레바논의 백향목과 잣나무를 바다로 떼를 엮어 보냈다. 칠 년 만에 성전이 완성되고, 제사장들이 언약궤를 지성소로 메어 들이자 여호와의 영광의 구름이 성전에 가득했다.',
      choices: [
        { label: '성전을 봉헌하며 "하늘들의 하늘이라도 주를 용납하지 못하겠거든" 기도한다', run: G => {
          const j = G.city('jerusalem'); j.bld = j.bld || {}; j.bld.temple = Math.min(10, Math.max(j.bld.temple || 1, 5) + 2); j.bld.palace = Math.max(j.bld.palace || 1, j.bld.temple);
          j.faith += 30; j.loy += 15; U.faithAll(G, 15, 5); U.gold(G, -800); if (G.exists('tyre')) G.rel(P, 'tyre', 20);
          G.item(P, 'torah_scroll', 1); G.flags.templeBuilt = G.turn; U.next(G, 3); G.kingdom(15, '성전 봉헌');
          return '"하늘과 하늘들의 하늘이라도 주를 용납하지 못하겠거든 하물며 내가 건축한 이 성전이오리이까"(8:27). 궤 안에는 두 돌판 외에 아무것도 없었다(8:9). 금 -800. 예루살렘 성전 Lv.' + j.bld.temple + ', 신앙 +30, 민심 +15. 모든 성 신앙 +15, 민심 +5. 율법 두루마리를 얻었다.'; } },
      ] },
    { id: 'sheba', who: P, auto: 0,
      cond: G => U.after(G, 'temple'),
      title: '스바 여왕의 방문', ref: '왕상 10:1-13; 마 12:42',
      text: '스바(남아라비아)의 여왕이 솔로몬의 명성을 듣고 어려운 문제로 시험하려고 향품과 심히 많은 금과 보석을 약대에 싣고 예루살렘에 왔다. 성경은 그 이름을 밝히지 않는다(에티오피아 전승은 마케다, 이슬람 전승은 빌키스라 부른다). 여왕이 솔로몬의 모든 지혜와 그가 건축한 왕궁과 성전에 올라가는 층계를 보고 정신이 황홀하였다.',
      choices: [
        { label: '묻는 모든 것에 답하고, 지혜를 주신 여호와를 증언한다', run: G => {
          U.gold(G, 2000); G.res(P, { wood: 400 }); U.faithAll(G, 5, 5); G.flags.sheba = true; U.next(G, 4); G.kingdom(6, '스바 여왕의 찬송');
          return '여왕이 말했다. "당신의 하나님 여호와를 송축할지로다"(10:9). 금 백이십 달란트와 심히 많은 향품과 보석을 드렸다 — 금 +2000, 신앙·민심 +5. 그 무렵 히람의 배들도 오빌에서 금과 백단목을 실어 왔다(10:11; 목재 +400). 예수께서는 "남방 여왕이… 솔로몬의 지혜를 들으려고 땅 끝에서 왔거니와 솔로몬보다 더 큰 이가 여기 있느니라" 하셨다(마 12:42).'; } },
      ] },
    { id: 'adversaries', who: P, auto: 0,
      cond: G => U.after(G, 'sheba'),
      title: '솔로몬의 마음이 돌아서다', ref: '왕상 11:1-40',
      text: '솔로몬이 나이 많을 때에 이방 여인들이 그의 마음을 돌려 다른 신들을 따르게 하였다. 여호와께서 에돔 사람 하닷과 다메섹의 르손을 대적으로 일으키셨고, 에브라임 사람 여로보암에게 선지자 아히야가 새 옷을 열두 조각으로 찢어 열 조각을 주었다. 나라가 나뉠 날이 다가온다(BC 930).',
      choices: [
        { label: '"여호와 앞에 온전하라" — 산당을 헐고 처음 사랑으로 돌아간다', run: G => {
          U.faithAll(G, 12, 5); U.stat(G, '솔로몬', 'fai', 10); G.kingdom(8, '처음 사랑');
          return '성경의 역사에서 솔로몬은 끝내 돌아서지 않았고, 그가 죽자 나라가 둘로 갈라졌다(12장) — 이 게임에서는 돌이킨 솔로몬을 그려 본다. 신앙 +12, 민심 +5.'; } },
        { label: '이방 아내들의 신들을 위하여 산당을 짓는다', run: G => {
          U.faithAll(G, -15, -10); U.stat(G, '솔로몬', 'fai', -20); G.buff('aram', 'atk', 4, 0.2); G.buff('edom', 'atk', 4, 0.2);
          G.flags.heartTurned = true; G.kingdom(-10, '나뉘는 나라');
          return '"그의 마음이 그의 아버지 다윗의 마음과 같지 아니하여"(11:4). 신앙 -15, 민심 -10, 아람·에돔 4턴 동안 공격력 +20%. 나라가 나뉠 날이 가까웠다.'; } },
      ] },
  ];

  // ---------- 사명(스토리) ----------
  STORY[ID] = {
    [P]: [
      { title: '왕을 구하는 백성', ref: '삼상 8:4-7; 10:1, 17-24',
        intro: [
          ['narr', '사무엘이 늙자 이스라엘 장로들이 라마에 모여 말했다. "모든 나라와 같이 우리에게 왕을 세워 우리를 다스리게 하소서."'],
          ['word', '"백성이 네게 한 말을 다 들으라. 그들이 너를 버림이 아니요 나를 버려 자기들의 왕이 되지 못하게 함이니라." (8:7)'],
          ['사무엘', '기스의 아들 사울이여, 잃어버린 암나귀들은 찾았소. 여호와께서 그대에게 기름을 부어 그의 기업의 지도자로 삼으셨소.'],
          ['사울', '나는 이스라엘 지파 중에 가장 작은 베냐민 사람이 아니니이까. 내 가족은 베냐민 모든 가족 중에 가장 미약합니다.'],
          ['요나단', '아버지, 백성이 짐보따리 사이에 숨어 계신 아버지를 찾아냈습니다. 이제는 숨지 마십시오.'],
          ['사무엘', '왕도 백성도 여호와를 경외하여 그의 목소리를 들으면 좋으려니와… 먼저 여호와 앞에 제사를 드립시다. 이 군대의 참 왕은 만군의 여호와이시오.'],
        ],
        goal: { t: 'cmd', key: 'worship', n: 1, text: '도읍에서 제사를 드린다', city: CAP },
        reward: { k: 10, food: 2000 },
        outro: [['사무엘', '이 나라의 참 왕은 여호와이시오. 그대는 그분의 양 떼를 맡은 목자일 뿐이오.'], ['사울', '…명심하겠소. 여호와께서 나를 택하셨으니 그 뜻대로 다스리겠소.']] },
      { title: '길르앗 야베스', ref: '삼상 11:1-15',
        intro: [
          ['narr', '길르앗 야베스(라못길르앗)에서 전령들이 왔다. 암몬 사람 나하스가 성을 에워싸고 오른눈을 다 빼겠다 한다. 백성이 소리 높여 울었다.'],
          ['사울', '백성이 어찌하여 우는가? …누구든지 사울과 사무엘을 따라 나오지 아니하면 그의 소들도 이와 같이 하리라!'],
          ['아브넬', '왕이여, 베섹에 모인 자가 삼십만이 넘습니다. 세 부대로 나누어 새벽에 치면 암몬의 진영을 흩을 수 있습니다.'],
          ['요나단', '야베스 사람들에게 전하라. "내일 해가 더울 때에 너희가 구원을 받으리라."'],
          ['사무엘', '이 싸움으로 왕의 이름을 높이려 하지 마시오. 구원은 여호와께 있소.'],
        ],
        goal: { t: 'own', city: 'ramoth', text: '길르앗 야베스(라못길르앗)를 구원한다' },
        reward: { k: 15, gold: 400 },
        outro: [['사울', '오늘은 아무도 죽이지 못할 것이다. 여호와께서 오늘 이스라엘 중에 구원을 베푸셨음이라.'], ['narr', '온 백성이 길갈에서 여호와 앞에 사울을 왕으로 삼고 크게 기뻐하였다 (11:15). 훗날 길르앗 야베스 사람들은 이 은혜를 잊지 않고 밤새 달려가 사울의 시체를 거두었다 (31:11-13).']] },
      { title: '만군의 여호와의 이름으로', ref: '삼상 13–17장',
        intro: [
          ['narr', '이스라엘 온 땅에 대장장이가 없었다. 블레셋이 소고와 아세가 사이에 모였고, 이스라엘은 엘라 골짜기에 진을 쳤다. 가드 사람 골리앗이 사십 일 동안 이스라엘을 모욕했다.'],
          ['아브넬', '왕이여, 저 거인을 당할 자가 없습니다. 병사들이 그를 보기만 해도 도망합니다.'],
          ['사무엘', '순종이 제사보다 낫고 듣는 것이 숫양의 기름보다 나으니 (15:22). 사람은 외모를 보거니와 여호와는 중심을 보시오.'],
          ['다윗', '살아 계시는 하나님의 군대를 모욕하는 저 할례 받지 않은 블레셋 사람이 누구이기에! 사자와 곰의 발톱에서 나를 건지신 여호와께서 나를 건지시리이다.'],
          ['요나단', '저 소년의 말을 들으니 내 마음이 그와 하나가 되는구나. 아버지, 이 군대는 칼이 아니라 믿음 위에 섭니다.'],
        ],
        goal: { t: 'flag', flag: 'goliathSlain', text: '엘라 골짜기에서 골리앗을 쓰러뜨린다 (사건 선택)' },
        reward: { k: 15, gold: 500 },
        outro: [['다윗', '전쟁은 여호와께 속한 것이라. 온 땅으로 이스라엘에 하나님이 계신 줄 알게 하리이다 (17:46-47).'], ['word', '"여호와의 구원하심이 칼과 창에 있지 아니함을 이 무리에게 알게 하리라." (17:47)']] },
      { title: '시온 산성, 다윗성', ref: '삼상 31장; 삼하 1–5장',
        intro: [
          ['narr', '사울과 요나단이 길보아 산에서 죽었다. 사울의 집과 다윗의 집 사이에 전쟁이 오래 계속되었으나, 다윗은 점점 강하여 가고 사울의 집은 점점 약하여 갔다 (삼하 3:1).'],
          ['다윗', '여호와여, 내가 유다 한 성으로 올라가리이까? …헤브론에서 칠 년 반, 이제 온 이스라엘이 하나가 될 곳이 필요하다.'],
          ['요압', '여부스 사람들이 "맹인과 다리 저는 자라도 너를 물리치리라" 조롱합니다. 수구로 올라가 성을 치는 자를 우두머리로 삼으십시오. 제가 가겠습니다!'],
          ['아비새', '베냐민과 유다 사이, 어느 지파의 땅도 아닌 저 산성이 도읍이 되면 지파들이 다투지 않을 것입니다.'],
          ['다윗', '저 시온 산성이 온 이스라엘의 도읍이 될 것이다.'],
        ],
        goal: { t: 'own', city: 'jerusalem', text: '예루살렘(시온 산성)을 차지한다' },
        reward: { k: 15, gold: 600 },
        outro: [['narr', '다윗이 시온 산성을 빼앗았으니 이는 다윗성이다. 만군의 하나님 여호와께서 그와 함께 계셨다 (삼하 5:7, 10).']] },
      { title: '언약궤를 다윗성으로', ref: '삼하 6–7장; 대상 15–16장',
        intro: [
          ['다윗', '나는 백향목 궁에 사는데 하나님의 궤는 아직 기럇여아림에 있다. 궤를 모셔 오자.'],
          ['아비아달', '레위인이 어깨에 메어야 합니다. 모세가 명한 방법 그대로입니다. 수레는 블레셋 사람들의 방법이었습니다 (삼상 6:7).'],
          ['나단', '왕이여, 나라의 중심은 궁이 아니라 이 궤입니다. 여호와께서 거하시는 곳이 곧 도읍입니다.'],
          ['사독', '레위 사람들을 성결하게 하고, 노래하는 자와 비파와 수금과 제금을 준비하겠습니다.'],
        ],
        goal: { t: 'flag', flag: 'arkZion', text: '언약궤를 다윗성으로 모신다 (사건 선택)', city: 'jerusalem' },
        reward: { k: 15, food: 3000 },
        outro: [['narr', '다윗이 여호와 앞에서 힘을 다해 춤을 추었다. 백성에게 떡과 대추과자와 건포도를 나누어 주었다.'], ['다윗', '여호와께 감사하고 그의 이름을 불러 아뢰며 그가 하는 일을 만민 중에 알게 할지어다 (대상 16:8).']] },
      { title: '유브라데에서 애굽 지경까지', ref: '삼하 8장; 왕상 4:20-25; 5–10장',
        intro: [
          ['narr', '다윗이 어디로 가든지 여호와께서 이기게 하셨다. 그리고 그의 아들 솔로몬 때에 나라는 가장 넓어졌다.'],
          ['word', '"솔로몬이 그 강에서부터 블레셋 사람의 땅에 이르기까지와 애굽 지경에 미치기까지의 모든 나라를 다스리므로… 유다와 이스라엘이 단에서부터 브엘세바에 이르기까지 각기 포도나무 아래와 무화과나무 아래에서 평안히 살았더라." (왕상 4:21, 25)'],
          ['나단', '왕의 아들이 여호와의 이름을 위하여 집을 지을 것입니다. 그러나 나라를 넓히는 것보다 마음을 지키는 것이 먼저입니다.'],
          ['브나야', '다메섹과 소바, 암몬의 랍바와 모압과 에돔, 블레셋의 가사 — 그리고 유브라데 나루까지. 명령만 내리십시오.'],
          ['narr', '성경은 솔로몬 나라의 북쪽 끝을 유브라데 강가의 딥사라 한다(4:24). 이 게임 지도에서는 가까운 유브라데 나루 갈그미스를 목표로 삼았다. 성경의 역사에서 솔로몬은 칼보다 조공과 무역으로 이 나라들을 다스렸다.'],
          ['@ruler', '나라가 넓어져도 이 군대의 참 왕은 만군의 여호와시다. 그분의 이름을 위한 집을 짓고, 그 집 앞에서 겸손하자.'],
        ],
        goal: { t: 'goal', text: '단에서 브엘세바, 다메섹과 가사, 유브라데 나루까지 18성을 다스린다', faith: 60 },
        reward: { k: 25 },
        outro: [['narr', '"다윗이 온 이스라엘을 다스려 모든 백성에게 정의와 공의를 행하였다" (삼하 8:15). 솔로몬의 성전에 여호와의 영광이 가득했다 (왕상 8:11).'], ['@ruler', '여호와께서 집을 세우지 아니하시면 세우는 자의 수고가 헛되도다 (시 127:1).'], ['narr', '성경의 역사에서 솔로몬 뒤에 나라는 둘로 갈라진다 (왕상 12장). 다음 시대, 분열 왕국이 기다린다.']] },
    ],
  };

  // ---------- 주인공 대사 ----------
  HERO_LINES[ID] = {
    [P]: [
      { // 왕을 구하는 백성
        intro: [['narr', '{name}은(는) 마하나임에서 올라와 새 왕의 진영에 합류했다.'], ['@hero', '왕이 서도 이 군대의 참 왕은 여호와이십니다. 제사로 첫걸음을 뗍시다.']],
        outro: [['@hero', '왕도 백성도 말씀 아래 있습니다. 그것을 잊지 않겠습니다.']],
      },
      { // 길르앗 야베스
        intro: [['@hero', '울고 있는 성을 버려 두지 않겠습니다. 새벽에 함께 나아갑시다.']],
        outro: [['@hero', '오늘의 구원은 여호와께서 베푸신 것입니다. 원수를 갚기보다 은혜를 기억합시다.']],
      },
      { // 만군의 여호와의 이름으로
        intro: [['@hero', '사울의 갑옷이 아니라 여호와의 이름입니다. 저도 물매를 들고 저 소년 곁에 서겠습니다.']],
        outro: [['@hero', '거인이 쓰러졌습니다. 전쟁은 여호와께 속한 것입니다!']],
      },
      { // 시온 산성
        intro: [['@hero', '형제와의 싸움은 칼보다 마음으로 이깁니다. 온 이스라엘이 하나 될 도읍으로 갑시다.']],
        outro: [['@hero', '시온이 다윗성이 되었습니다. 이 성이 여호와의 성이 되기를 기도합니다.']],
      },
      { // 언약궤
        intro: [['@hero', '편한 수레가 아니라 말씀의 방법으로 궤를 모십시다. 저도 어깨를 보태겠습니다.']],
        outro: [['@hero', '궤가 시온에 들어왔습니다. 오늘은 체면보다 기쁨으로 춤추겠습니다!']],
      },
      { // 유브라데에서 애굽 지경까지
        intro: [['@hero', '나라가 넓어질수록 마음을 지키겠습니다. 성전보다 먼저 우리 마음을 드립시다.']],
        outro: [['@hero', '포도나무와 무화과나무 아래의 평안 — 이 평안이 오래가도록 끝까지 겸손하겠습니다.']],
      },
    ],
  };
})();
