// 성경 삼국지 — 시대: 분열 왕국 (BC 930–586)
// 플레이어는 언제나 '하나님의 군대'(army). 유다의 신실한 왕들과 선지자들이 사건을 따라 차례로 이끈다.
// 사백 년 가까운 시대를 한 판으로 압축했다. 아직 때가 이르지 않은 인물은 숨은 성(핫투사)에 '재야'로 두었다가
// 사건이 일어날 때 무대에 올린다(DIV_KIT.enter). 나라들의 흥망(앗수르의 다메섹·사마리아 정복, 바벨론의 일어남)도 사건이 옮긴다.

// 분열 왕국 이벤트 도우미
const DIV_KIT = {
  P: 'army',
  WAIT: 'hattusa', // 아직 등장하지 않은 인물이 기다리는 숨은 성
  on: (G, cid) => !!G.city(cid),
  owns: (G, cid, f) => DIV_KIT.on(G, cid) && G.ownerOf(cid) === f,
  mine: (G, cid) => DIV_KIT.owns(G, cid, 'army'),
  live: (G, f) => G.exists(f) && G.cityCount(f) > 0,
  names: () => SCENARIOS.find(s => s.id === 'e_divided').officers.map(r => r[0]).concat(['나보폴라살']),
  faithAll: (G, d, loy) => { if (G.exists('army')) G.eachCity('army', c => { c.faith += d; if (loy) c.loy += loy; }); },
  cut: (G, f, k, only) => { if (G.exists(f)) G.eachCity(f, c => { if (!only || only.includes(c.id)) c.soldiers = Math.floor(c.soldiers * k); }); },
  // 하나님의 군대의 본거지 (도읍을 잃었으면 병력이 가장 많은 성)
  home: G => {
    if (!G.exists('army')) return null;
    const cap = G.fac('army').capital;
    if (DIV_KIT.mine(G, cap)) return G.city(cap);
    let best = null; G.eachCity('army', c => { if (!best || c.soldiers > best.soldiers) best = c; });
    return best;
  },
  add: (G, n) => { const c = DIV_KIT.home(G); if (c) c.soldiers += n; return !!c; },
  // 세력의 도읍이 남의 손에 넘어갔으면 가장 큰 성으로 옮긴다
  fixCap: (G, f) => {
    if (!G.exists(f)) return;
    const F = G.fac(f); if (DIV_KIT.owns(G, F.capital, f)) return;
    let best = null; G.eachCity(f, c => { if (!best || c.soldiers > best.soldiers) best = c; });
    if (best) F.capital = best.id;
  },
  // 성이 하나도 없는 세력은 사라진다. 남은 장수는 재야가 된다
  prune: (G, f) => {
    if (!G.exists(f) || G.cityCount(f) > 0) return;
    G.fac(f).alive = false;
    DIV_KIT.names().forEach(n => { const o = G.o(n); if (o && o.alive && o.fac === f) o.fac = null; });
  },
  // 성 하나를 다른 세력에 넘긴다 (하나님의 군대의 성은 사건으로 빼앗지 않는다)
  give: (G, cid, f, sold) => {
    if (!DIV_KIT.on(G, cid) || !G.exists(f)) return false;
    const c = G.city(cid), prev = c.owner;
    if (prev === 'army' || prev === f) return false;
    c.owner = f; c.loy = Math.max(c.loy, 45); if (sold) c.soldiers = Math.max(c.soldiers, sold);
    if (prev) {
      DIV_KIT.fixCap(G, prev);
      const cap = G.exists(prev) && G.cityCount(prev) ? G.fac(prev).capital : null;
      DIV_KIT.names().forEach(n => { const o = G.o(n); if (o && o.alive && o.fac === prev && o.city === cid) { if (cap) o.city = cap; else o.fac = null; } });
      DIV_KIT.prune(G, prev);
    }
    return true;
  },
  giveAll: (G, list, from, to) => list.filter(cid => DIV_KIT.owns(G, cid, from) && DIV_KIT.give(G, cid, to)).length,
  // 세력 f와 맞닿은 하나님의 군대 성 가운데 가장 약한 곳 (없으면 가장 약한 성)
  front: (G, f) => {
    const mine = []; if (G.exists('army')) G.eachCity('army', c => mine.push(c));
    const near = mine.filter(c => ROADS.some(([a, b]) => DIV_KIT.on(G, a) && DIV_KIT.on(G, b) &&
      ((a === c.id && G.ownerOf(b) === f) || (b === c.id && G.ownerOf(a) === f))));
    const pool = (near.length ? near : mine).sort((x, y) => x.soldiers - y.soldiers);
    return pool.length ? pool[0].id : null;
  },
  // 적의 침공. 병력은 그 나라 도읍에서 나오고, 지키는 군사보다 지나치게 많지 않게 맞춘다
  raid: (G, f, max, cid) => {
    if (!DIV_KIT.live(G, f) || !G.exists('army')) return '';
    DIV_KIT.fixCap(G, f);
    const t = cid && DIV_KIT.mine(G, cid) ? cid : DIV_KIT.front(G, f);
    if (!t) return '';
    const d = G.city(t).soldiers;
    return G.raid(f, t, Math.max(600, Math.min(max, Math.round(d * 1.15) + 1500)));
  },
  // 때가 된 인물을 무대에 올린다. 하나님의 군대에 들어온 사람은 적이 데려가지 못한다
  enter: (G, name, f = 'army', cid) => {
    if (!G.alive(name) || !G.exists(f)) return false;
    const cur = G.facOf(name);
    if (cur === f) return true;
    if (f !== 'army' && cur === 'army') return false;
    G.join(name, f, cid && DIV_KIT.owns(G, cid, f) ? cid : undefined);
    return true;
  },
  lead: (G, name, f = 'army') => { if (DIV_KIT.enter(G, name, f)) { G.setRuler(f, name); return true; } return false; },
  stat: (G, name, k, d) => { const o = G.o(name); if (o && o.alive) o[k] = Math.max(0, Math.min(100, o[k] + d)); },
  pay: (G, f, gold) => { if (G.exists(f)) G.fac(f).gold = Math.max(0, G.fac(f).gold - gold); },
  // 새로 일어난 나라(G.rebel)에 모양을 갖춘다
  dress: (G, f, color, aggr, gold, food) => {
    if (!G.exists(f)) return;
    const F = G.fac(f); F.color = color; F.aggr = aggr; F.items = F.items || {};
    G.res(f, { gold, food, wood: 2000, stone: 1500 });
  },
  // 엘리야는 죽음을 보지 않고 하늘로 올라갔다 (왕하 2:11) — 세상을 떠났다는 기록을 남기지 않는다
  takeUp: (G, name) => {
    const o = G.o(name); if (!o || !o.alive) return false;
    if (o.fac && G.exists(o.fac) && G.fac(o.fac).ruler === o.id) return false;
    o.alive = false; return true;
  },
};

SCENARIOS.push({
  id: 'e_divided',
  title: '분열 왕국',
  year: 930,
  ref: '열왕기상 12장 – 열왕기하 25장; 역대하 10–36장; 이사야; 예레미야',
  intro: '솔로몬이 죽자 르호보암이 세겜에서 "내 새끼손가락이 내 아버지의 허리보다 굵으니"라고 답했고, 열 지파가 떠나 여로보암을 왕으로 세웠다 (왕상 12:10-20). 나라가 둘로 갈라진 BC 930년부터 예루살렘이 무너진 BC 586년까지 사백 년 가까운 시대를 한 판으로 압축했다. 이 시대 마하나임 "하나님의 군대"(창 32:2; 왕하 6:17)는 예루살렘에서 일어나, 유다의 신실한 왕들과 선지자들 — 스마야, 아사, 여호사밧, 엘리야와 엘리사, 이사야와 히스기야, 요시야와 예레미야 — 이 사건을 따라 차례로 이끈다. 애굽의 시삭, 아람의 벤하닷과 하사엘, 모압의 메사, 앗수르의 살만에셀·디글랏빌레셀·사르곤·산헤립, 그리고 바벨론의 느부갓네살이 차례로 일어난다.',
  words: ['jericho_shout', 'fear_not', 'fire_from_heaven', 'mahanaim', 'lord_of_hosts'],
  factions: [
    { id: 'army', name: '하나님의 군대', ruler: '스마야', color: '#e2b04a', capital: 'jerusalem', gold: 1500, food: 9000, aggr: 0.4,
      desc: '마하나임의 하나님의 군대 — 이 시대에는 다윗의 성 예루살렘과 유다 산지에서 일어난다. 하나님의 사람 스마야가 먼저 이끌고, 아사·여호사밧·히스기야·요시야 같은 신실한 왕들과 엘리야·엘리사·이사야·예레미야 같은 선지자들이 사건을 따라 대를 잇는다. 르호보암이 견고하게 한 라기스와 헤브론이 남쪽 방패다 (대하 11:5-12).',
      cities: { jerusalem: 6000, bethlehem: 2000, hebron: 3000, beersheba: 1800, lachish: 2500 } },
    { id: 'israel_n', name: '북이스라엘', ruler: '여로보암', color: '#5a93d8', capital: 'shechem', gold: 1500, food: 11000, aggr: 0.25,
      desc: '열 지파의 북 왕국. 여로보암이 세겜을 도읍으로 삼고 벧엘과 단에 금송아지를 세웠다 (왕상 12:25-33). 오므리가 사마리아를 세운 뒤로는 그곳이 도읍이 된다. 형제의 나라이니 칼보다 언약으로 다시 하나 되기를 — 그러나 BC 722년 앗수르에 무너진다.',
      cities: { shechem: 5000, samaria: 1500, shiloh: 1500, bethel: 3000, jericho: 2000, mahanaim: 2500, bethshean: 2500, megiddo: 3000, hazor: 2500, dan: 2500, ramoth: 2500, heshbon: 2000 } },
    { id: 'egypt', name: '애굽', ruler: '시삭', color: '#d98a3a', capital: 'tanis', gold: 3000, food: 14000, aggr: 0.2,
      desc: '제22왕조의 바로 시삭(셰숑크 1세). 소안(타니스)과 부바스티스에서 다스렸다. 그가 가나안에서 빼앗은 성읍들의 이름이 카르낙 신전 벽에 새겨져 있다. 훗날 애굽 왕 소, 구스 왕 디르하가, 느고 2세가 차례로 일어난다.',
      cities: { tanis: 6000, memphis: 4000, thebes: 3000, goshen: 2000 } },
    { id: 'philistia', name: '블레셋', ruler: '블레셋 방백', color: '#c9573f', capital: 'gath', gold: 1000, food: 7000, aggr: 0.15,
      desc: '해안의 다섯 성읍과 욥바 항구. 다윗 이후 힘이 꺾였으나 여전히 유다의 서쪽 이웃이다. 가드는 BC 830년 무렵 아람 왕 하사엘에게 무너진다 (왕하 12:17).',
      cities: { gath: 3000, ekron: 2500, ashdod: 3000, ashkelon: 2500, gaza: 3500, joppa: 1500 } },
    { id: 'aram', name: '아람 (다메섹)', ruler: '벤하닷', color: '#cf6d9c', capital: 'damascus', gold: 1800, food: 9000, aggr: 0.25,
      desc: '다메섹의 아람 왕국. 성경은 여러 대의 왕을 "벤하닷"이라 부른다 (왕상 15:18; 20:1; 왕하 13:3). 하사엘이 왕위를 빼앗고 이스라엘을 괴롭혔으며(왕하 8:15; 10:32), 마지막 왕 르신 때 BC 732년 앗수르에 멸망한다 (왕하 16:9).',
      cities: { damascus: 5000, edrei: 2500 } },
    { id: 'moab', name: '모압', ruler: '메사', color: '#9a6fbf', capital: 'kirhareseth', gold: 800, food: 5000, aggr: 0.15,
      desc: '양을 치는 왕 메사의 나라 (왕하 3:4). 1868년 디본에서 발견된 메사 석비에 "오므리가 모압을 여러 날 억압했다"는 메사 자신의 기록이 남아 있다. 시대를 압축해 처음부터 메사가 다스린다.',
      cities: { kirhareseth: 3000, dibon: 2000 } },
    { id: 'ammon', name: '암몬', ruler: '암몬 왕', color: '#5ea67c', capital: 'rabbah', gold: 800, food: 5000, aggr: 0.12,
      desc: '랍바의 암몬 자손. 여호사밧 때 모압·마온 사람과 함께 엔게디로 쳐들어왔다 (대하 20:1-2).',
      cities: { rabbah: 3000 } },
    { id: 'edom', name: '에돔', ruler: '하닷', color: '#b5804f', capital: 'bozrah', gold: 700, food: 4500, aggr: 0.15,
      desc: '세일 산의 에서 자손. 솔로몬의 대적 하닷이 애굽에서 돌아왔다 (왕상 11:14-22). 여호람 때 유다를 배반하고 스스로 왕을 세웠다 (왕하 8:20).',
      cities: { bozrah: 2500, midian: 1200 } },
    { id: 'tyre', name: '두로·시돈', ruler: '엣바알', color: '#3fb3b5', capital: 'sidon', gold: 2800, food: 5000, aggr: 0.05,
      desc: '시돈 사람의 왕 엣바알의 베니게 해상 왕국. 그의 딸 이세벨이 아합의 아내가 되어 바알 숭배를 이스라엘에 들여왔다 (왕상 16:31). 깃딤(구브로)까지 배가 오간다.',
      cities: { sidon: 3000, tyre: 4000, kittim: 1500 } },
    { id: 'assyria', name: '앗수르', ruler: '살만에셀 3세', color: '#8a8f99', capital: 'nineveh', gold: 4000, food: 16000, aggr: 0.1,
      desc: '티그리스 강가의 제국. 처음에는 멀리 있으나, 살만에셀 3세가 카르카르에서 서방 연합군과 싸운(BC 853) 뒤로 해마다 서쪽으로 온다. 디글랏빌레셀 3세가 다메섹을, 살만에셀 5세와 사르곤 2세가 사마리아를 무너뜨리고, 산헤립이 예루살렘을 에워싼다.',
      cities: { nineveh: 6000, ashur: 4500, haran: 3000 } },
  ],
  // 하맛·갈그미스는 신 헷 왕국과 아람 사람의 작은 나라들, 바벨론은 아직 앗수르의 그늘에 있다
  neutral: { kadesh: 1500, sinai: 500, hamath: 3000, carchemish: 3500, tarsus: 2000, babylon: 4000, ur: 2500, susa: 3500, sardis: 2500, ephesus: 2000, athens: 2000, corinth: 2000 },
  hide: ['alexandria', 'antioch', 'hattusa', 'pella', 'rome'], // 알렉산더 이후의 성과 이미 버려진 핫투사
  officers: [
    // 하나님의 군대 (처음부터)
    ['스마야', 20, 85, 60, 75, 97, 'army', 'jerusalem', '하나님의 사람. 형제와 싸우러 나선 십팔만 용사를 말씀 한마디로 돌려보냈고, 시삭 앞에서 왕과 방백들을 겸비하게 했다.', '왕상 12:22-24; 대하 12:5-8'],
    ['르호보암', 60, 45, 50, 40, 50, 'army', 'jerusalem', '솔로몬의 아들. 원로의 조언을 버려 나라가 갈라졌으나, 시삭 앞에서 스스로 겸비하여 멸망을 면했다.', '왕상 12:1-15; 대하 12:6-12'],
    ['아비야', 72, 60, 55, 60, 60, 'army', 'jerusalem', '르호보암의 아들. 스마라임 산 위에서 "소금 언약"을 외치고 제사장들의 나팔과 함께 여로보암을 이겼다.', '대하 13:4-20'],
    ['아사', 70, 70, 80, 75, 90, 'army', 'hebron', '아비야의 아들. 우상을 없애고 태후 마아가까지 폐한 선한 왕. 구스 사람 세라의 백만 대군 앞에서 "주밖에 도와 줄 이가 없사오니" 기도했다.', '왕상 15:9-15; 대하 14:2-15'],
    ['잇도', 15, 88, 60, 70, 92, 'army', 'jerusalem', '선견자. 르호보암과 아비야의 행적과 족보를 기록했다.', '대하 12:15; 13:22'],
    // 아직 때가 이르지 않은 믿음의 사람들 (사건으로 등장)
    ['아사랴', 20, 82, 60, 72, 95, null, 'hattusa', '오뎃의 아들 선지자. "너희가 여호와와 함께 하면 여호와께서 너희와 함께 하실지라" 외쳐 아사의 개혁을 일으켰다.', '대하 15:1-8'],
    ['여호사밧', 72, 80, 88, 85, 90, null, 'hattusa', '아사의 아들. 레위 사람들에게 율법책을 들려 유다 성읍을 두루 가르치게 했고, 대군 앞에서 "오직 주만 바라보나이다" 기도했다.', '대하 17:3-9; 20:12'],
    ['아드나', 86, 55, 50, 60, 70, null, 'hattusa', '여호사밧의 천부장, 큰 용사 삼십만을 거느렸다.', '대하 17:14'],
    ['아마시야', 80, 58, 50, 65, 92, null, 'hattusa', '시그리의 아들. "자기를 여호와께 즐거이 드린 자" — 큰 용사 이십만을 거느렸다.', '대하 17:16'],
    ['엘리아다', 78, 60, 52, 58, 72, null, 'hattusa', '베냐민의 큰 용사. 활과 방패를 잡은 자 이십만을 거느렸다.', '대하 17:17'],
    ['엘리야', 60, 88, 55, 85, 100, null, 'hattusa', '길르앗 디셉 사람. 비를 그치게 하고 갈멜산에서 하늘의 불을 불렀다. 죽음을 보지 않고 회오리바람으로 하늘에 올라갔다.', '왕상 17:1; 18:36-39; 왕하 2:11'],
    ['오바댜', 30, 78, 80, 72, 94, null, 'hattusa', '아합의 궁내대신. 이세벨이 선지자들을 죽일 때 백 명을 오십 명씩 굴에 숨기고 떡과 물을 먹였다.', '왕상 18:3-4'],
    ['엘리사', 45, 92, 70, 82, 99, null, 'hattusa', '사밧의 아들. 밭을 갈다 부름을 받아 엘리야의 겉옷과 갑절의 영감을 받았다. 도단에서 불말과 불병거를 보았다.', '왕상 19:19-21; 왕하 2:9-15; 6:17'],
    ['미가야', 15, 86, 50, 60, 98, null, 'hattusa', '이믈라의 아들. 사백 명의 선지자와 달리 "여호와께서 내게 말씀하시는 것 곧 그것을 내가 말하리라" 했다.', '왕상 22:8-28'],
    ['이사야', 25, 97, 80, 88, 99, null, 'hattusa', '아모스의 아들. 웃시야 왕이 죽던 해에 "내가 여기 있나이다 나를 보내소서" 했고, 아하스와 히스기야에게 여호와를 굳게 믿으라고 외쳤다.', '사 6:1-8; 7:9; 37:21-35'],
    ['히스기야', 65, 82, 86, 85, 95, null, 'hattusa', '아하스의 아들. "그의 전후 유다 여러 왕 중에 그러한 자가 없었으니" — 산헤립의 편지를 여호와 앞에 펴 놓고 기도했다. 실로암 수로를 팠다.', '왕하 18:5; 19:14-19; 20:20'],
    ['엘리아김', 45, 80, 86, 70, 82, null, 'hattusa', '힐기야의 아들, 히스기야의 궁내대신. 랍사게와 윗못 수도 곁에서 담판했다.', '왕하 18:18, 26; 사 22:20-22'],
    ['요아', 40, 72, 78, 60, 75, null, 'hattusa', '아삽의 아들, 사관. 엘리아김과 함께 랍사게를 맞았다.', '왕하 18:18'],
    ['요시야', 70, 80, 85, 88, 98, null, 'hattusa', '여덟 살에 왕이 된 아몬의 아들. 성전에서 발견된 율법책의 말씀을 듣고 옷을 찢었다. "요시야와 같이 마음을 다하며… 여호와께로 돌이킨 왕은 전에도 없었고 그 후에도 없었다".', '왕하 22:1-2, 11; 23:25'],
    ['힐기야', 20, 82, 70, 70, 95, null, 'hattusa', '대제사장. 성전 수리 중에 율법책을 발견했다.', '왕하 22:8'],
    ['사반', 25, 84, 82, 60, 85, null, 'hattusa', '서기관. 발견된 율법책을 왕 앞에서 읽었다.', '왕하 22:8-10'],
    ['훌다', 10, 88, 60, 78, 97, null, 'hattusa', '여선지자, 예복을 주관하는 살룸의 아내. 율법책의 말씀을 확증하고 요시야의 겸비를 전했다.', '왕하 22:14-20'],
    ['예레미야', 20, 92, 60, 72, 100, null, 'hattusa', '아나돗의 제사장 힐기야의 아들. "나는 아이라" 했으나 사십 년 동안 눈물로 말씀을 전했다. 바벨론의 멸망과 칠십 년 뒤의 귀환도 예언했다.', '렘 1:1-10; 25:11-12; 29:10-11; 50–51장'],
    ['바룩', 20, 82, 70, 60, 88, null, 'hattusa', '네리야의 아들, 예레미야의 서기관. 두루마리에 말씀을 받아 적었다.', '렘 36:4; 45:1-5'],
    ['에벳멜렉', 60, 60, 55, 70, 90, null, 'hattusa', '구스 사람 내시. 진흙 구덩이에 빠진 예레미야를 헌 옷과 줄로 끌어올렸다.', '렘 38:7-13; 39:15-18'],
    // 북이스라엘
    ['여로보암', 78, 85, 80, 85, 30, 'israel_n', 'shechem', '느밧의 아들, 에브라임 사람. 북 왕국의 첫 왕. 벧엘과 단에 금송아지를 세웠다.', '왕상 11:26-40; 12:25-33'],
    ['아히야', 15, 90, 55, 80, 96, 'israel_n', 'shiloh', '겉옷을 열두 조각으로 찢어 여로보암에게 열 조각을 준 실로의 선지자. 훗날 그 집의 멸망도 예언했다.', '왕상 11:29-39; 14:1-16'],
    ['나답', 65, 45, 40, 40, 25, 'israel_n', 'bethel', '여로보암의 아들. 두 해를 다스리다 바아사에게 죽임을 당했다.', '왕상 15:25-28'],
    ['바아사', 85, 60, 55, 55, 20, 'israel_n', 'megiddo', '잇사갈 지파 아히야의 아들. 나답을 죽이고 왕이 되었으며, 라마를 건축해 유다를 막았다.', '왕상 15:27; 대하 16:1'],
    ['오므리', 84, 80, 82, 70, 10, 'israel_n', 'megiddo', '군대 장관에서 왕이 된 자. 세멜의 산을 사서 사마리아를 세웠다. 앗수르 기록은 이스라엘을 "오므리의 집"이라 불렀다.', '왕상 16:16-28'],
    ['아합', 82, 72, 75, 70, 5, null, 'hattusa', '오므리의 아들. 이세벨과 결혼해 사마리아에 바알의 신전을 세웠다. 카르카르에서 병거 이천 대로 앗수르에 맞섰다고 앗수르 비문이 전한다.', '왕상 16:29-33; 22:34-37'],
    ['이세벨', 30, 85, 78, 75, 0, null, 'hattusa', '시돈 왕 엣바알의 딸, 아합의 왕비. 여호와의 선지자들을 죽이고 나봇의 포도원을 빼앗았다.', '왕상 16:31; 19:1-2; 21:1-16; 왕하 9:30-37'],
    ['요람', 72, 55, 55, 50, 15, null, 'hattusa', '아합의 아들, 이스라엘 왕. 메사를 치러 갔고, 이스르엘에서 예후의 화살에 죽었다.', '왕하 3:1-27; 9:24'],
    ['예후', 90, 70, 65, 70, 40, null, 'hattusa', '님시의 손자. 라못길르앗에서 기름 부음을 받고 아합의 집과 바알 숭배자들을 쳤다. 앗수르 "검은 오벨리스크"에 살만에셀 3세 앞에 엎드린 모습이 새겨졌다.', '왕하 9:1-10:31'],
    ['베가', 80, 60, 55, 55, 10, null, 'hattusa', '르말랴의 아들, 이스라엘 왕. 아람 왕 르신과 함께 예루살렘을 쳤다.', '왕하 15:27-29; 16:5; 사 7:1'],
    ['호세아', 70, 60, 60, 50, 20, null, 'hattusa', '엘라의 아들, 북이스라엘의 마지막 왕. 애굽 왕 소를 의지해 앗수르를 배반했다가 옥에 갇혔다.', '왕하 17:1-6'],
    // 애굽
    ['시삭', 80, 80, 85, 70, 10, 'egypt', 'tanis', '애굽 왕 셰숑크 1세. 르호보암 제오년에 올라와 성전 보물과 솔로몬의 금방패를 빼앗았다.', '왕상 14:25-26; 대하 12:2-9'],
    ['애굽 병거대장', 82, 50, 40, 40, 5, 'egypt', 'tanis', '병거 천이백 대와 마병 육만을 이끈 장수.', '대하 12:3'],
    ['세라', 84, 55, 45, 50, 5, 'egypt', 'memphis', '구스 사람. 백만 대군과 병거 삼백 대로 마레사까지 왔다가 아사 앞에서 무너졌다.', '대하 14:9-13'],
    ['소', 60, 60, 60, 55, 5, null, 'hattusa', '애굽 왕. 북이스라엘 왕 호세아가 앗수르를 배반하고 사자를 보내 의지했다.', '왕하 17:4'],
    ['디르하가', 82, 70, 72, 68, 5, null, 'hattusa', '구스 왕(제25왕조 타하르카). 산헤립과 싸우러 나왔다는 소문이 앗수르 진영을 흔들었다.', '왕하 19:9; 사 37:9'],
    ['느고 2세', 80, 78, 80, 65, 10, null, 'hattusa', '애굽 왕. 앗수르를 도우러 유브라데로 가다 므깃도에서 요시야를 죽였으나, 갈그미스에서 느부갓네살에게 크게 패했다.', '왕하 23:29-35; 대하 35:20-24; 렘 46:2'],
    // 블레셋·아람·모압·암몬·에돔·두로
    ['블레셋 방백', 68, 55, 55, 45, 5, 'philistia', 'gath', '해안 다섯 성읍의 방백.', '대하 17:11; 21:16'],
    ['벤하닷', 80, 72, 70, 66, 5, 'aram', 'damascus', '다메섹의 아람 왕. 사마리아를 에워쌌고, 도단에 불말과 불병거가 가득한 날 그의 군대는 눈이 어두워졌다. (성경은 여러 대의 왕을 이 이름으로 부른다)', '왕상 15:18; 20:1; 왕하 6:8-24'],
    ['나아만', 88, 65, 60, 72, 30, 'aram', 'damascus', '아람 왕의 군대 장관, 큰 용사. 요단 강에 일곱 번 몸을 씻고 나아 "이스라엘 외에는 온 천하에 신이 없는 줄을" 고백했다.', '왕하 5:1-19'],
    ['하사엘', 88, 80, 72, 55, 5, null, 'hattusa', '벤하닷의 신하. 엘리사가 그를 보고 울었다. 왕을 죽이고 아람 왕이 되어 이스라엘을 괴롭히고 가드를 쳤다.', '왕하 8:7-15; 10:32; 12:17'],
    ['르신', 76, 62, 60, 55, 5, null, 'hattusa', '다메섹의 마지막 아람 왕. 베가와 함께 예루살렘을 쳤으나, 디글랏빌레셀에게 죽었다.', '왕하 16:5-9; 사 7:1-8'],
    ['메사', 78, 72, 70, 66, 5, 'moab', 'kirhareseth', '모압 왕, 양을 치는 자. 해마다 새끼 양 십만의 털을 바치다 아합이 죽자 배반했다. 길하레셋 성벽 위에서 맏아들을 번제로 드렸다.', '왕하 3:4-27; 메사 석비'],
    ['암몬 왕', 62, 50, 50, 45, 10, 'ammon', 'rabbah', '랍바의 암몬 자손의 왕.', '대하 20:1'],
    ['하닷', 70, 65, 55, 60, 20, 'edom', 'bozrah', '에돔 왕족, 솔로몬의 대적.', '왕상 11:14-22'],
    ['엣바알', 55, 76, 86, 72, 5, 'tyre', 'sidon', '시돈 사람의 왕, 이세벨의 아버지.', '왕상 16:31'],
    // 앗수르
    ['살만에셀 3세', 86, 76, 80, 60, 5, 'assyria', 'nineveh', '앗수르 왕. BC 853 카르카르에서 다메섹·하맛·이스라엘의 연합군과 싸웠고, 예후의 조공을 "검은 오벨리스크"에 새겼다.', '카르카르 비문(쿠르흐 석비); 검은 오벨리스크'],
    ['디글랏빌레셀 3세', 88, 82, 88, 60, 5, null, 'hattusa', '앗수르 왕. 성경은 "불"이라고도 부른다. 다메섹을 무너뜨리고 갈릴리와 길르앗 백성을 사로잡아 갔다.', '왕하 15:19, 29; 16:7-9; 대상 5:26'],
    ['살만에셀 5세', 80, 66, 70, 55, 5, null, 'hattusa', '앗수르 왕. 사마리아를 삼 년 동안 에워쌌다.', '왕하 17:3-5; 18:9-10'],
    ['사르곤 2세', 88, 80, 84, 62, 5, null, 'hattusa', '앗수르 왕. 사마리아 백성 이만 칠천여 명을 끌어갔다고 기록했다. 그의 장군 다르단이 아스돗을 쳤다.', '사 20:1; 사르곤 연대기'],
    ['산헤립', 86, 78, 80, 62, 5, null, 'hattusa', '앗수르 왕. 라기스를 무너뜨리고 예루살렘을 에워쌌으나 한 밤에 군사 십팔만 오천을 잃고 니느웨로 돌아갔다. 니스록 신전에서 아들들에게 죽었다.', '왕하 18:13–19:37; 사 36–37장'],
    ['랍사게', 75, 72, 60, 70, 5, null, 'hattusa', '앗수르의 "술 맡은 관원장"(직함). 윗못 수도 곁에서 히브리 말로 예루살렘 백성을 흔들었다.', '왕하 18:17-35'],
    // 바벨론 (나보폴라살은 사건으로 일어난다)
    ['느부갓네살 2세', 92, 88, 90, 75, 20, null, 'hattusa', '바벨론 왕. 갈그미스에서 애굽을 꺾고, BC 586 예루살렘을 무너뜨렸다. 훗날 다니엘 앞에서 "하늘의 왕"을 찬양했다.', '왕하 24–25장; 렘 46:2; 단 4:37'],
    ['느부사라단', 84, 66, 70, 55, 5, null, 'hattusa', '바벨론의 시위대장관. 성전과 왕궁을 불사르고 성벽을 헐었으나, 예레미야를 풀어 주었다.', '왕하 25:8-11; 렘 39:11-14; 40:1-5'],
  ],
  rel: [['army', 'israel_n', 30], ['army', 'egypt', 30], ['army', 'tyre', 55], ['israel_n', 'tyre', 55], ['israel_n', 'egypt', 55],
    ['aram', 'israel_n', 25], ['moab', 'ammon', 60], ['assyria', 'aram', 25], ['assyria', 'israel_n', 30], ['edom', 'army', 40],
    ['army', 'ammon', 55], ['egypt', 'philistia', 60], ['moab', 'edom', 60], ['moab', 'israel_n', 60], ['ammon', 'israel_n', 55],
    ['tyre', 'philistia', 65], ['tyre', 'aram', 60], ['tyre', 'egypt', 65], ['edom', 'egypt', 55]],
  goals: { army: ['jerusalem', 'samaria', 'dan', 'beersheba', 'damascus', 'nineveh', 'babylon'] },
  goalText: { army: '단에서 브엘세바까지 갈라진 형제를 하나로 묶고(사마리아), 아람의 다메섹과 앗수르의 니느웨를 지나 바벨론까지 — 목표 7성. 성경의 역사에서는 유다가 바벨론에 사로잡혀 갔고 바벨론은 BC 539 바사에 무너졌다. 이 게임에서는 하나님의 군대가 예레미야의 바벨론 심판 예언(렘 50–51장)을 따라 그 도읍까지 나아간다.' },
});

EVENTS.e_divided = [
  // ---- 1장: 르호보암과 스마야 ----
  { id: 'shemaiah', who: 'army', auto: 0,
    cond: G => G.turn >= 1 && G.exists('army') && G.exists('israel_n'),
    title: '너희 형제와 싸우지 말라', ref: '왕상 12:21-24; 대하 11:1-4',
    text: '르호보암이 유다와 베냐민 족속에서 택한 용사 십팔만을 모아 이스라엘과 싸워 나라를 되찾으려 했다. 그때 하나님의 사람 스마야에게 여호와의 말씀이 임했다. "너희는 올라가지 말라 이스라엘 자손 너희 형제와 싸우지 말고 각기 집으로 돌아가라 이 일이 나로 말미암아 난 것이라" (왕상 12:24).',
    choices: [
      { label: '말씀에 순종하여 군대를 돌려보낸다', run: G => {
        DIV_KIT.faithAll(G, 10, 10); G.rel('army', 'israel_n', 45); G.flags.brothers = G.turn;
        G.kingdom(2, '형제와 싸우지 않다');
        return '하나님의 군대 신앙 +10, 민심 +10. 북이스라엘과의 관계 +45 — 한동안 형제의 나라는 서로 칼을 들지 않는다. "그들이 여호와의 말씀을 듣고 돌아갔더라" (왕상 12:24).'; } },
      { label: '용사 십팔만으로 진군한다', run: G => {
        DIV_KIT.add(G, 3000); DIV_KIT.faithAll(G, -15); G.rel('army', 'israel_n', -15);
        G.kingdom(-2, '말씀을 거스르다');
        return '본거지 병력 +3000. 그러나 말씀을 거스른 진군에 백성의 마음이 식었다 — 신앙 -15, 북이스라엘과의 관계 -15.'; } },
    ] },
  { id: 'calves', who: 'israel_n', auto: 0,
    cond: G => G.turn >= 2 && G.exists('israel_n') && G.facOf('여로보암') === 'israel_n',
    title: '벧엘과 단의 금송아지', ref: '왕상 12:26-33; 대하 11:13-17',
    text: '여로보암이 속으로 말했다. "이 백성이 예루살렘에 있는 여호와의 성전에 제사를 드리고자 하여 올라가면 이 백성의 마음이 유다 왕 르호보암에게로 돌아가리라." 그가 금송아지 둘을 만들어 하나는 벧엘에, 하나는 단에 두었다. "이스라엘아 이는 너를 애굽 땅에서 인도하여 올린 너희 신들이라" (왕상 12:27-28).',
    choices: [
      { label: '벧엘과 단에 금송아지를 세운다', run: G => {
        G.eachCity('israel_n', c => { c.loy += 12; c.faith -= 25; });
        DIV_KIT.add(G, 1000); DIV_KIT.faithAll(G, 5);
        return '북이스라엘 민심 +12, 신앙 -25. "이 일이 죄가 되었으니" (왕상 12:30). 그러자 온 이스라엘의 제사장들과 레위 사람들, 여호와를 찾기로 마음을 굳게 정한 자들이 예루살렘으로 내려왔다 — 하나님의 군대 본거지 병력 +1000, 신앙 +5 (대하 11:13-16).'; } },
      { label: '백성이 예루살렘에 올라가도록 둔다', run: G => {
        G.eachCity('israel_n', c => { c.loy -= 10; c.faith += 10; }); G.rel('army', 'israel_n', 15);
        return '북이스라엘 신앙 +10, 민심 -10. 하나님의 군대와의 관계 +15.'; } },
    ] },
  { id: 'shishak', who: 'army', auto: 0,
    cond: G => G.turn >= 4 && DIV_KIT.live(G, 'egypt') && G.exists('army'),
    title: '시삭의 침공', ref: '왕상 14:25-28; 대하 12:1-12',
    text: '르호보암 제오년(BC 925)에 애굽 왕 시삭이 병거 천이백 대와 마병 육만을 거느리고 올라와 유다의 견고한 성읍들을 빼앗고 예루살렘에 이르렀다. 스마야가 왕과 방백들에게 말했다. "여호와께서 이렇게 말씀하시기를 너희가 나를 버렸으므로 나도 너희를 버려 시삭의 손에 넘겼노라 하셨다." 시삭이 이 원정에서 빼앗은 성읍들의 이름은 지금도 카르낙 신전 벽에 새겨져 있다 — 므깃도 같은 북이스라엘의 성읍도 그 목록에 있다.',
    choices: [
      { label: '왕과 방백들이 스스로 겸비한다', run: G => {
        const F = G.fac('army'); F.gold = Math.floor(F.gold / 2);
        DIV_KIT.faithAll(G, 10); G.rel('army', 'egypt', 30); G.item('army', 'shield', 1);
        DIV_KIT.cut(G, 'israel_n', 0.8, ['megiddo', 'bethshean']);
        G.flags.humbled = true; G.kingdom(2, '스스로 겸비하다');
        return '"그들이 스스로 겸비하였으니 내가 멸하지 아니하고 저희를 조금 구원하리라" (대하 12:7). 성전 보물과 솔로몬의 금방패를 빼앗겨 금이 절반이 되었지만 나라는 보존되었다. 르호보암이 놋으로 방패를 만들어 대신했다 — 큰 방패 1개, 신앙 +10, 애굽과의 관계 +30. 시삭은 북쪽 므깃도·벧산도 쳤다 (북이스라엘 병력 20% 손실).'; } },
      { label: '성문을 닫고 맞서 싸운다', run: G => {
        const r = DIV_KIT.raid(G, 'egypt', 7000, 'lachish');
        DIV_KIT.cut(G, 'egypt', 0.85);
        return (r ? `시삭의 공격: ${r} ` : '') + '애굽 군도 병력 15%를 잃었다.'; } },
    ] },
  // ---- 2장: 아비야와 아사 ----
  { id: 'zemaraim', who: 'army', auto: 0,
    cond: G => G.turn >= 6 && G.exists('army') && DIV_KIT.live(G, 'israel_n') && G.alive('아비야'),
    title: '스마라임 산의 외침', ref: '대하 13:1-20',
    text: '아비야가 에브라임 산지 스마라임 산 위에 서서 외쳤다. "여로보암과 온 이스라엘아 들으라 이스라엘 하나님 여호와께서 소금 언약으로 이스라엘 나라를 영원히 다윗과 그의 자손에게 주신 것을 너희가 알 것 아니냐… 하나님이 우리와 함께 하사 우리의 머리가 되시고 그의 제사장들도 우리와 함께 하여 전쟁의 나팔을 불어 너희를 공격하느니라" (13:5, 12). 그 사이 여로보암의 복병이 뒤로 돌아왔다.',
    choices: [
      { label: '여호와께 부르짖고 제사장들이 나팔을 불며 소리 지른다', run: G => {
        G.buff('army', 'atk', 4, 0.3); G.rel('army', 'israel_n', -60); G.item('army', 'trumpet', 1);
        DIV_KIT.cut(G, 'israel_n', 0.55, ['bethel']); DIV_KIT.cut(G, 'israel_n', 0.85);
        G.flags.zemaraim = true; G.kingdom(2, '소금 언약');
        return '"유다 사람이 소리 지르매 유다 사람이 소리 지를 때에 하나님이 여로보암과 온 이스라엘을 아비야와 유다 앞에서 치시니" (13:15). 4턴 동안 공격력 +30%, 양각 나팔 1개. 벧엘의 북이스라엘군 45%, 나머지 성 15% 궤멸. 형제의 나라와의 평화는 깨졌다 (관계 -60). 아비야는 벧엘과 여사나와 에브론을 빼앗았다 — 이제 벧엘로!'; } },
    ] },
  { id: 'asaKing', who: 'army', auto: 0,
    cond: G => G.turn >= 9 && G.exists('army') && (G.done.zemaraim || G.turn >= 12),
    title: '아사가 왕위에 오르다', ref: '왕상 15:1-11, 25-30; 대하 12:16; 13:20–14:1',
    text: '르호보암이 죽어 다윗 성에 장사되고(BC 913), 아비야도 삼 년을 다스리고 죽었다. 그의 아들 아사가 왕이 되었다. "아사가 그의 조상 다윗 같이 여호와 보시기에 정직하게 행하여" (왕상 15:11). 같은 무렵 북쪽에서는 여로보암이 여호와의 치심을 입어 죽었고, 그 아들 나답은 이 년 만에 바아사에게 죽임을 당했다 — 아히야의 예언대로 여로보암의 집이 끊어졌다 (왕상 15:29). 애굽의 시삭도 세상을 떠났다.',
    choices: [
      { label: '아사를 세우고, 오뎃의 아들 아사랴의 말씀을 듣는다', run: G => {
        G.kill('르호보암'); G.kill('아비야'); const a = DIV_KIT.lead(G, '아사'); DIV_KIT.enter(G, '아사랴');
        if (G.exists('israel_n')) { G.kill('여로보암'); G.kill('나답'); if (G.facOf('바아사') === 'israel_n') G.setRuler('israel_n', '바아사'); G.eachCity('israel_n', c => { c.loy -= 10; }); }
        G.kill('시삭');
        DIV_KIT.faithAll(G, 5, 5); G.flags.asaKing = true;
        return (a ? '아사가 하나님의 군대를 이끈다. ' : '') + '선지자 아사랴가 합류했다. 신앙 +5, 민심 +5. 북이스라엘에서는 바아사가 왕이 되었고 반역의 피로 민심이 흔들렸다 (-10). 애굽의 시삭이 죽었다.'; } },
    ] },
  { id: 'zerah', who: 'army', auto: 0,
    cond: G => G.turn >= 11 && G.done.asaKing && G.exists('army') && DIV_KIT.live(G, 'egypt'),
    title: '구스 사람 세라와 마레사의 기도', ref: '대하 14:9-15',
    text: '구스 사람 세라가 군사 백만과 병거 삼백 대를 거느리고 마레사에 이르렀다. 아사가 스바다 골짜기에 진을 치고 여호와께 부르짖었다. "여호와여 힘이 강한 자와 약한 자 사이에는 주밖에 도와 줄 이가 없사오니 우리 하나님 여호와여 우리를 도우소서 우리가 주를 의지하오며 주의 이름을 의탁하옵고 이 많은 무리를 치러 왔나이다… 원하건대 사람이 주를 이기지 못하게 하옵소서" (14:11).',
    choices: [
      { label: '"주밖에 도와 줄 이가 없사오니" — 기도하고 나아간다', run: G => {
        const r = DIV_KIT.raid(G, 'egypt', 4000, 'lachish');
        G.kill('세라'); DIV_KIT.cut(G, 'egypt', 0.7); G.buff('army', 'atk', 3, 0.25);
        G.fac('army').gold += 900; G.fac('army').food += 3000; G.kingdom(2, '주밖에 도와 줄 이가 없사오니');
        return (r ? `마레사의 싸움: ${r} ` : '') + '"여호와께서 구스 사람들을 아사와 유다 사람들 앞에서 치시니" (14:12). 세라가 쓰러지고 애굽 모든 성의 병력 30% 궤멸. 그랄까지 쫓아가 많은 물건을 얻었다 — 금 +900, 식량 +3000, 3턴 동안 공격력 +25%.'; } },
      { label: '성을 굳게 닫고 지나가기를 기다린다', run: G => {
        const r = DIV_KIT.raid(G, 'egypt', 6000, 'lachish'); G.eachCity('army', c => { c.def += 6; });
        return (r ? `세라의 공격: ${r} ` : '') + '모든 성 성벽 +6.'; } },
    ] },
  { id: 'asaReform', who: 'army', auto: 0,
    cond: G => G.turn >= 13 && G.done.asaKing && G.exists('army'),
    title: '아사의 개혁과 언약', ref: '대하 15:1-19; 왕상 15:12-15',
    text: '하나님의 영이 오뎃의 아들 아사랴에게 임했다. "아사와 및 유다와 베냐민의 무리들아 내 말을 들으라 너희가 여호와와 함께 하면 여호와께서 너희와 함께 하실지라 너희가 만일 그를 찾으면 그가 너희와 만나게 되시려니와 너희가 만일 그를 버리면 그가 너희를 버리시리라" (15:2). 아사가 가증한 물건들을 없애고, 그의 어머니 마아가가 아세라의 가증한 목상을 만들었으므로 태후의 자리를 폐했다.',
    choices: [
      { label: '우상을 찍어 기드론 시냇가에서 불사르고 언약을 맺는다', run: G => {
        G.eachCity('army', c => { c.faith += 20; c.loy -= 3; c.def += 5; });
        DIV_KIT.add(G, 1200); G.flags.asaReform = true; G.kingdom(3, '마음을 다하여 여호와를 찾다');
        return '신앙 +20, 민심 -3, 모든 성 성벽 +5. 에브라임과 므낫세와 시므온 가운데서도 여호와께서 아사와 함께 계심을 보고 많은 사람이 돌아왔다 (15:9) — 본거지 병력 +1200. "온 유다가 마음을 다하여 맹세하고… 여호와께서 그들의 사방에 평안을 주셨더라" (15:15).'; } },
    ] },
  { id: 'ramah', who: 'army', auto: 0,
    cond: G => G.turn >= 14 && G.done.asaReform && G.exists('army') && DIV_KIT.live(G, 'israel_n') && DIV_KIT.live(G, 'aram'),
    title: '라마의 요새와 선견자 하나니', ref: '왕상 15:16-22; 대하 16:1-10',
    text: '이스라엘 왕 바아사가 유다를 치러 올라와 라마를 건축하여 사람들이 유다 왕 아사와 왕래하지 못하게 했다. 아사가 여호와의 성전 곳간과 왕궁 곳간의 은금을 내어 다메섹의 아람 왕 벤하닷에게 보내며 말했다. "나와 당신 사이에 약조가 있었느니라… 이스라엘 왕 바아사와 세운 약조를 깨뜨려서 그가 나를 떠나게 하라."',
    choices: [
      { label: '성전의 은금을 아람 왕에게 보낸다 (역사의 선택)', run: G => {
        const F = G.fac('army'); F.gold = Math.floor(F.gold * 0.6);
        G.rel('army', 'aram', 30); G.rel('aram', 'israel_n', -40);
        DIV_KIT.cut(G, 'israel_n', 0.6, ['dan', 'hazor']); DIV_KIT.faithAll(G, -8); G.kingdom(-2, '사람을 의지하다');
        return '금 -40%. 벤하닷이 이스라엘의 단과 이욘과 아벨벧마아가와 납달리 온 땅을 쳤다 — 단·하솔의 북이스라엘군 40% 궤멸. 그러나 선견자 하나니가 아사에게 말했다. "왕이 아람 왕을 의지하고 왕의 하나님 여호와를 의지하지 아니하였으므로… 여호와의 눈은 온 땅을 두루 감찰하사 전심으로 자기에게 향하는 자들을 위하여 능력을 베푸시나니" (대하 16:7, 9). 신앙 -8.'; } },
      { label: '"여호와의 눈은 온 땅을 감찰하신다" — 성전의 은금을 지키고 여호와를 의지한다', run: G => {
        DIV_KIT.faithAll(G, 8); G.buff('army', 'atk', 3, 0.2);
        const b = DIV_KIT.owns(G, 'bethel', 'israel_n') ? G.city('bethel') : null; if (b) b.soldiers = Math.floor(b.soldiers * 0.7);
        G.kingdom(2, '전심으로 향하다');
        return '신앙 +8, 3턴 동안 공격력 +20%.' + (b ? ' 라마를 짓던 바아사의 일꾼들이 흩어졌다 — 벧엘의 북이스라엘군 30% 손실.' : '') + ' 성경의 역사에서는 아사가 은금을 보냈고 하나니에게 책망을 받았다. 이 게임에서는 다른 길을 걸어 볼 수 있다.'; } },
    ] },
  // ---- 3장: 여호사밧과 엘리야 ----
  { id: 'jehoshaphat', who: 'army', auto: 0,
    cond: G => G.turn >= 16 && G.done.asaKing && G.exists('army'),
    title: '여호사밧과 율법책', ref: '대하 16:12–17:19',
    text: '아사가 왕위에 있은 지 삼십구 년에 발에 병이 들어 심히 중했으나 여호와께 구하지 아니하고 의원들에게 구했다. 그가 죽자(BC 870) 아들 여호사밧이 왕이 되었다. 여호사밧은 방백들과 레위 사람들과 제사장들을 보냈다. "그들이 여호와의 율법책을 가지고 유다에서 가르치되 그 모든 유다 성읍들로 두루 다니며 백성들을 가르쳤더라" (17:9). 블레셋 사람과 아라비아 사람도 예물을 가져왔다.',
    choices: [
      { label: '레위 사람들에게 율법책을 들려 온 유다를 가르치게 한다', run: G => {
        G.kill('아사'); const j = DIV_KIT.lead(G, '여호사밧');
        ['아드나', '아마시야', '엘리아다'].forEach(n => DIV_KIT.enter(G, n));
        G.item('army', 'torah_scroll', 1); DIV_KIT.faithAll(G, 10); DIV_KIT.add(G, 2500);
        G.fac('army').gold += 700; G.eachCity('army', c => { c.train += 8; });
        G.flags.jehoshaphat = true; G.kingdom(2, '율법책을 가르치다');
        return '아사가 세상을 떠났다. ' + (j ? '여호사밧이 하나님의 군대를 이끈다. ' : '') + '천부장 아드나, "자기를 여호와께 즐거이 드린" 아마시야, 베냐민의 용사 엘리아다가 합류했다. 율법 두루마리 1개, 신앙 +10, 본거지 병력 +2500, 훈련 +8, 블레셋과 아라비아의 예물 금 +700.'; } },
    ] },
  { id: 'ahab', who: 'israel_n', auto: 0,
    cond: G => G.turn >= 17 && G.done.jehoshaphat && G.exists('israel_n'),
    title: '오므리의 사마리아와 아합의 바알', ref: '왕상 16:23-33',
    text: '북쪽에서는 군대 장관 오므리가 왕이 되어 은 두 달란트로 세멜에게서 사마리아 산을 사서 성을 건축했다. 앗수르 사람들은 그 뒤로 이스라엘을 "오므리의 집"이라 불렀고, 메사 석비도 "오므리가 모압을 여러 날 억압했다"고 적었다. 오므리의 아들 아합은 시돈 왕 엣바알의 딸 이세벨을 아내로 맞아 사마리아에 바알의 신전을 세웠다. "그 이전의 모든 사람보다 더욱 여호와 보시기에 악을 행하여" (16:30).',
    choices: [
      { label: '사마리아를 도읍으로 삼고 바알의 신전을 세운다', run: G => {
        G.kill('바아사'); G.kill('오므리'); DIV_KIT.lead(G, '아합', 'israel_n'); DIV_KIT.enter(G, '이세벨', 'israel_n');
        if (DIV_KIT.owns(G, 'samaria', 'israel_n')) { G.fac('israel_n').capital = 'samaria'; const s = G.city('samaria'); s.soldiers += 2500; s.def += 10; }
        G.eachCity('israel_n', c => { c.faith -= 20; }); if (G.exists('tyre')) G.rel('israel_n', 'tyre', 30);
        return '아합이 북이스라엘의 왕이 되었다. ' + (DIV_KIT.owns(G, 'samaria', 'israel_n') ? '도읍이 사마리아로 옮겨졌다 (병력 +2500, 성벽 +10). ' : '') + '북이스라엘 신앙 -20, 두로·시돈과의 관계 +30.'; } },
    ] },
  { id: 'elijah', who: 'army', auto: 0,
    cond: G => G.turn >= 18 && (G.done.ahab || !G.exists('israel_n') || G.turn >= 21) && G.exists('army'),
    title: '디셉 사람 엘리야', ref: '왕상 17:1-24; 18:1-4',
    text: '길르앗에 우거하는 자 중에 디셉 사람 엘리야가 아합에게 말했다. "내가 섬기는 이스라엘의 하나님 여호와께서 살아 계심을 두고 맹세하노니 내 말이 없으면 수 년 동안 비도 이슬도 있지 아니하리라" (17:1). 가뭄이 이스라엘과 시돈 땅을 덮었다. 엘리야는 그릿 시냇가에서 까마귀가 날라 온 떡을 먹었고, 시돈 땅 사르밧의 과부는 마지막 가루 한 움큼으로 그를 먹였다 — "통의 가루가 떨어지지 아니하고 병의 기름이 없어지지 아니하리라" (17:14). 그 무렵 아합의 궁내대신 오바댜는 이세벨이 여호와의 선지자들을 죽일 때 백 명을 굴에 숨겨 먹였다.',
    choices: [
      { label: '엘리야와 오바댜를 맞아들이고, 가뭄 속에 곳간을 연다', run: G => {
        DIV_KIT.enter(G, '엘리야'); DIV_KIT.enter(G, '오바댜');
        if (G.exists('israel_n')) { const F = G.fac('israel_n'); F.food = Math.floor(F.food * 0.5); G.eachCity('israel_n', c => { c.agri -= 12; c.loy -= 8; }); }
        if (G.exists('tyre')) { const T = G.fac('tyre'); T.food = Math.floor(T.food * 0.6); }
        G.fac('army').food += 1500; DIV_KIT.faithAll(G, 5, 5);
        return '엘리야와 오바댜가 하나님의 군대에 합류했다. 가뭄으로 북이스라엘 식량 절반, 농업 -12, 민심 -8, 두로·시돈 식량 -40%. 사르밧의 가루통처럼 곳간이 비지 않았다 — 식량 +1500, 신앙·민심 +5.'; } },
    ] },
  { id: 'carmel', who: 'army', auto: 0,
    cond: G => G.turn >= 20 && G.done.elijah && G.exists('army'),
    title: '갈멜산의 불', ref: '왕상 18:17-46; 19:1-21',
    text: '엘리야가 갈멜산에서 바알의 선지자 사백오십 명과 온 백성 앞에 섰다. "너희가 어느 때까지 둘 사이에서 머뭇머뭇 하려느냐 여호와가 만일 하나님이면 그를 따르고 바알이 만일 하나님이면 그를 따를지니라" (18:21). 바알의 선지자들은 아침부터 낮까지 부르짖고 칼로 몸을 상하게 했으나 아무 소리도 없었다. 엘리야가 무너진 여호와의 제단을 열두 돌로 다시 쌓고, 제물과 나무 위에 물을 세 번이나 부었다. 저녁 소제를 드릴 때에 그가 기도했다. "여호와여 내게 응답하옵소서 이 백성에게 주 여호와는 하나님이신 것과 주는 그들의 마음을 되돌이키심을 알게 하옵소서" (18:37).',
    choices: [
      { label: '엘리야와 함께 하늘의 불을 구한다', run: G => {
        G.eachCity('israel_n', c => { c.faith += 30; c.loy -= 5; }); G.rel('army', 'israel_n', 25);
        DIV_KIT.faithAll(G, 10); DIV_KIT.add(G, 1500); DIV_KIT.enter(G, '엘리사');
        G.fac('army').food += 2000; if (G.exists('israel_n')) G.fac('israel_n').food += 3000;
        G.flags.carmel = true; G.kingdom(4, '여호와 그는 하나님이시로다');
        return '"이에 여호와의 불이 내려서 번제물과 나무와 돌과 흙을 태우고 또 도랑의 물을 핥은지라 모든 백성이 보고 엎드려 말하되 여호와 그는 하나님이시로다 여호와 그는 하나님이시로다" (18:38-39). 북이스라엘 신앙 +30, 관계 +25, 큰 비가 내려 식량이 돌아왔다. 이세벨의 위협에 엘리야는 호렙까지 도망했으나 거기서 세미한 소리를 들었다 — "바알에게 무릎을 꿇지 아니한 칠천 명을 남기리니" (19:18). 그 남은 자들이 모여 본거지 병력 +1500, 신앙 +10. 밭 갈던 엘리사가 겉옷을 받고 따라왔다 (19:19-21).'; } },
    ] },
  { id: 'qarqar', who: 'assyria', auto: 0,
    cond: G => G.turn >= 21 && G.done.carmel && DIV_KIT.live(G, 'assyria'),
    title: '카르카르 전투 (BC 853)', ref: '살만에셀 3세의 쿠르흐 석비; 왕상 20:34; 22:1',
    text: '성경에는 나오지 않지만 앗수르 비문이 전하는 싸움이다. 앗수르 왕 살만에셀 3세가 서쪽으로 와서 오론테스 강가 카르카르에서 열두 왕의 연합군과 맞섰다. 비문은 "다메섹의 하닷에셀 병거 천이백 대, 하맛의 이르훌레니 병거 칠백 대, 이스라엘 사람 아합 병거 이천 대와 보병 만 명"이라고 적었다. 아합의 이름이 성경 밖 기록에 처음 나오는 곳이다. 이 무렵 아합과 아람 왕은 삼 년 동안 싸우지 않았다 (왕상 22:1).',
    choices: [
      { label: '큰 승리를 새기고 물러간다', run: G => {
        DIV_KIT.cut(G, 'assyria', 0.8, [G.fac('assyria').capital]); DIV_KIT.cut(G, 'aram', 0.8); DIV_KIT.cut(G, 'israel_n', 0.85);
        const h = G.city('hamath'); if (h && !h.owner) h.soldiers = Math.floor(h.soldiers * 0.7);
        G.fac('assyria').aggr = 0.15; G.rel('aram', 'israel_n', 20);
        G.flags.qarqar = true;
        return '앗수르는 크게 이겼다고 새겼으나 곧 물러갔다. 앗수르 도읍 병력 20%, 아람 20%, 북이스라엘 15%, 하맛 30% 손실. 이제 앗수르의 눈이 서쪽을 향한다.'; } },
    ] },
  // ---- 4장: 엘리사와 도단 ----
  { id: 'micaiah', who: 'army', auto: 0,
    cond: G => G.turn >= 22 && G.done.carmel && G.exists('army') && G.alive('아합'),
    title: '미가야와 라못길르앗', ref: '왕상 22:1-40; 대하 18:1–19:3',
    text: '아합이 여호사밧에게 청했다. "라못길르앗은 본래 우리의 것인 줄을 너희가 알지 못하느냐… 나와 함께 가서 싸우겠느냐." 사백 명의 선지자가 "올라가소서" 했으나 여호사밧은 "이 외에 우리가 물을 만한 여호와의 선지자가 여기 있지 아니하니이까" 물었다. 불려 온 이믈라의 아들 미가야가 말했다. "여호와께서 내게 말씀하시는 것 곧 그것을 내가 말하리라… 내가 보니 온 이스라엘이 목자 없는 양 같이 산에 흩어졌는데" (22:14, 17).',
    choices: [
      { label: '미가야의 말을 듣고 아합과 함께 가지 않는다', run: G => {
        DIV_KIT.enter(G, '미가야'); DIV_KIT.faithAll(G, 6); G.rel('army', 'israel_n', -10);
        G.kill('아합'); DIV_KIT.lead(G, '요람', 'israel_n'); DIV_KIT.cut(G, 'israel_n', 0.8, ['ramoth', 'mahanaim']);
        G.flags.micaiah = true; G.kingdom(2, '여호와의 말씀을 먼저 묻다');
        return '미가야가 옥에서 풀려나 하나님의 군대에 합류했다. 신앙 +6. 아합은 변장하고 홀로 나갔으나 "한 사람이 무심코 활을 당겨" 그 갑옷 솔기를 맞혔다 (22:34). 아합이 죽고 개들이 그 피를 핥았다. 요람이 북이스라엘 왕이 되었고, 라못길르앗·마하나임의 북이스라엘군 20% 손실. 이제 라못길르앗으로!'; } },
      { label: '"나는 당신과 다름이 없나이다" — 아합과 함께 올라간다 (역사의 선택)', run: G => {
        const h = DIV_KIT.home(G); if (h) h.soldiers = Math.floor(h.soldiers * 0.8);
        DIV_KIT.enter(G, '미가야'); G.kill('아합'); DIV_KIT.lead(G, '요람', 'israel_n'); DIV_KIT.cut(G, 'israel_n', 0.75, ['ramoth']);
        DIV_KIT.faithAll(G, -4); G.rel('army', 'israel_n', 10); G.flags.micaiah = true;
        return '아람 병거의 장관들이 왕복을 입은 여호사밧을 에워싸자 "여호사밧이 소리를 지르매 여호와께서 그를 도우시며" (대하 18:31). 본거지 병력 20% 손실. 아합이 죽고 요람이 뒤를 이었다. 선견자 예후가 여호사밧에게 말했다. "왕이 악한 자를 돕고 여호와를 미워하는 자들을 사랑하는 것이 옳으니이까" (대하 19:2) — 신앙 -4. 미가야가 합류했다.'; } },
    ] },
  { id: 'berakah', who: 'army', auto: 0,
    cond: G => G.turn >= 24 && G.done.jehoshaphat && G.exists('army') && (DIV_KIT.live(G, 'moab') || DIV_KIT.live(G, 'ammon')),
    title: '브라가 골짜기의 찬양', ref: '대하 20:1-30',
    text: '모압 자손과 암몬 자손과 마온 사람들이 큰 무리를 이끌고 사해 건너편에서 엔게디까지 올라왔다. 여호사밧이 두려워하여 온 유다에 금식을 공포하고 여호와의 전 새 뜰 앞에 서서 기도했다. "우리 하나님이여… 우리를 치러 오는 이 큰 무리를 우리가 대적할 능력이 없고 어떻게 할 줄도 알지 못하옵고 오직 주만 바라보나이다" (20:12). 레위 사람 야하시엘에게 여호와의 영이 임했다. "이 큰 무리로 말미암아 두려워하거나 놀라지 말라 이 전쟁은 너희에게 속한 것이 아니요 하나님께 속한 것이니라" (20:15).',
    choices: [
      { label: '노래하는 자들을 군대 앞에 세우고 "여호와께 감사하세" 찬송한다', run: G => {
        DIV_KIT.cut(G, 'moab', 0.5); DIV_KIT.cut(G, 'ammon', 0.5);
        G.rel('army', 'moab', -20); G.rel('army', 'ammon', -20); G.item('army', 'psalm_scroll', 1);
        G.fac('army').gold += 1200; DIV_KIT.faithAll(G, 8); G.buff('army', 'atk', 3, 0.2);
        G.flags.berakah = true; G.kingdom(3, '이 전쟁은 하나님께 속한 것');
        return '"그 노래와 찬송이 시작될 때에 여호와께서 복병을 두어 유다를 치러 온 암몬 자손과 모압과 세일 산 사람들을 치게 하시므로" 그들이 서로 쳐 죽였다 (20:22-23). 모압·암몬 모든 성의 병력 절반이 사라졌다. 사흘 동안 물건을 거두고 넷째 날에 브라가(찬송) 골짜기에서 여호와를 송축했다 — 금 +1200, 시편 두루마리 1개, 신앙 +8, 3턴 동안 공격력 +20%.'; } },
      { label: '성벽 위에서 방어한다', run: G => {
        const r = DIV_KIT.raid(G, DIV_KIT.live(G, 'moab') ? 'moab' : 'ammon', 5000);
        G.eachCity('army', c => { c.def += 5; });
        return (r ? `모압·암몬의 공격: ${r} ` : '') + '모든 성 성벽 +5.'; } },
    ] },
  { id: 'mesha', who: 'army', auto: 0,
    cond: G => G.turn >= 25 && G.done.micaiah && G.exists('army') && DIV_KIT.live(G, 'moab'),
    title: '메사의 반역과 메사 석비', ref: '왕하 3:4-27; 메사 석비(루브르 박물관)',
    text: '모압 왕 메사는 양을 치는 자라 새끼 양 십만의 털과 숫양 십만의 털을 이스라엘 왕에게 바쳤는데, 아합이 죽자 배반했다. 이스라엘 왕 요람이 여호사밧과 에돔 왕과 함께 에돔 광야 길로 칠 일을 돌아가다 물이 떨어졌다. 엘리사가 말했다. "이 골짜기에 개천을 많이 파라… 너희가 바람도 보지 못하고 비도 보지 못하되 이 골짜기에 물이 가득하여" (3:16-17). 1868년 디본에서 발견된 메사 석비에는 메사 자신의 말이 새겨져 있다. "나는 그모스[야트]의 아들 메사, 모압의 왕 디본 사람이다… 이스라엘의 왕 오므리가 모압을 여러 날 억압하였으니 그모스가 그 땅에 노하였음이라." 이 석비에는 "여호와(YHWH)"라는 이름도 나온다.',
    choices: [
      { label: '엘리사의 말대로 개천을 파고 모압을 친다', run: G => {
        DIV_KIT.enter(G, '엘리사'); DIV_KIT.cut(G, 'moab', 0.5, ['dibon']); DIV_KIT.cut(G, 'moab', 0.75, ['kirhareseth']);
        G.eachCity('moab', c => { c.agri -= 15; }); G.buff('army', 'atk', 3, 0.15); G.rel('army', 'moab', -25);
        DIV_KIT.faithAll(G, 4); G.flags.mesha = true;
        return '아침에 물이 에돔 쪽에서 흘러와 골짜기에 가득했다. 모압 사람들이 햇빛에 붉게 비친 물을 피로 알고 달려들었다가 무너졌다 (3:22-24). 디본의 모압군 50%, 길하레셋 25% 궤멸, 모압 땅 농업 -15. 그러나 메사가 길하레셋 성벽 위에서 맏아들을 번제로 드리자 "이스라엘에게 크게 격노함이 임하매" 연합군이 물러갔다 (3:27). 3턴 동안 공격력 +15%, 신앙 +4.'; } },
      { label: '북이스라엘의 전쟁에 끼지 않는다', run: G => {
        G.rel('army', 'moab', 15); G.rel('army', 'israel_n', -10); if (G.exists('moab')) G.eachCity('moab', c => { c.loy += 10; });
        G.flags.mesha = true;
        return '모압과의 관계 +15, 북이스라엘과의 관계 -10. 메사는 석비에 "이스라엘은 영원히 망하였다"고 새겼다. 그러나 여호와의 이름은 그 돌 위에도 남았다.'; } },
    ] },
  { id: 'chariot', who: 'army', auto: 0,
    cond: G => G.turn >= 26 && G.done.carmel && G.exists('army'),
    title: '불수레와 불말 — 엘리야의 겉옷', ref: '왕하 2:1-15',
    text: '엘리야와 엘리사가 요단을 건넜다. 엘리야가 말했다. "나를 네게서 데려감을 당하기 전에 내가 네게 어떻게 할지를 구하라." 엘리사가 말했다. "당신의 성령이 하시는 역사가 갑절이나 내게 있게 하소서." 두 사람이 길을 가며 말하더니 불수레와 불말들이 두 사람을 갈라놓고 엘리야가 회오리바람으로 하늘로 올라갔다. 엘리사가 외쳤다. "내 아버지여 내 아버지여 이스라엘의 병거와 그 마병이여" (2:9-12).',
    choices: [
      { label: '엘리야의 겉옷을 들고 요단 물을 친다', run: G => {
        DIV_KIT.enter(G, '엘리사'); DIV_KIT.takeUp(G, '엘리야'); G.item('army', 'elijah_mantle', 1);
        DIV_KIT.stat(G, '엘리사', 'fai', 1); DIV_KIT.stat(G, '엘리사', 'cha', 4); DIV_KIT.faithAll(G, 6);
        G.flags.mantle = true; G.kingdom(2, '갑절의 영감');
        return '엘리야가 죽음을 보지 않고 하늘로 올라갔다. 엘리사가 떨어진 겉옷으로 요단 물을 치며 "엘리야의 하나님 여호와는 어디 계시니이까" 하자 물이 갈라졌다 (2:14). 엘리야의 겉옷 1개, 엘리사 매력 +4, 신앙 +6. 선지자의 제자들이 "엘리야의 성령이 엘리사 위에 머물렀다" 하며 엎드렸다 (2:15).'; } },
    ] },
  { id: 'dothan', who: 'army', auto: 0,
    cond: G => G.turn >= 28 && G.done.chariot && G.exists('army') && DIV_KIT.live(G, 'aram'),
    title: '도단의 불말과 불병거', ref: '왕하 6:8-23; 창 32:1-2',
    text: '아람 왕이 엘리사가 도단에 있다는 말을 듣고 말과 병거와 많은 군사를 보내 밤에 그 성을 에워쌌다. 이른 아침 엘리사의 사환이 나가 보고 외쳤다. "아아, 내 주여 우리가 어찌하리이까." 엘리사가 대답했다. "두려워하지 말라 우리와 함께 한 자가 그들과 함께 한 자보다 많으니라" 하고 기도했다. "여호와여 원하건대 그의 눈을 열어서 보게 하옵소서." 여호와께서 그 청년의 눈을 여시매 "불말과 불병거가 산에 가득하여 엘리사를 둘렀더라" (6:15-17). 야곱이 마하나임에서 만난 바로 그 하나님의 군대였다 (창 32:1-2).',
    choices: [
      { label: '눈이 어두워진 아람 군대를 먹이고 돌려보낸다 (엘리사의 길)', run: G => {
        DIV_KIT.cut(G, 'aram', 0.6, [G.fac('aram').capital]); G.rel('army', 'aram', 30); G.fac('aram').aggr = 0.1;
        DIV_KIT.faithAll(G, 10, 5); G.buff('army', 'atk', 4, 0.25); G.flags.dothan = G.turn; G.flags.mahanaim = true;
        G.kingdom(4, '우리와 함께 한 자가 더 많으니라');
        return '엘리사가 기도하자 아람 군대의 눈이 어두워졌고, 그는 그들을 사마리아로 이끌었다. "치지 마소서… 떡과 물을 그들 앞에 두어 먹고 마시게 하고 그들의 주인에게로 돌려보내소서" (6:22). 큰 잔치를 받고 돌아간 "아람 군사의 부대가 다시는 이스라엘 땅에 들어오지 못하니라" (6:23). 아람 도읍 병력 40% 손실, 관계 +30, 공세가 누그러졌다. 하나님의 군대 신앙 +10, 민심 +5, 4턴 동안 공격력 +25%.'; } },
      { label: '에워싼 군대를 모두 친다', run: G => {
        DIV_KIT.cut(G, 'aram', 0.45, [G.fac('aram').capital]); G.rel('army', 'aram', -30); G.buff('aram', 'atk', 4, 0.2);
        DIV_KIT.faithAll(G, -5); G.flags.dothan = G.turn; G.flags.mahanaim = true;
        return '아람 도읍 병력 55% 궤멸. 그러나 엘리사는 "치지 마소서" 했었다 — 신앙 -5, 아람과의 관계 -30, 복수를 다짐한 아람 4턴 동안 공격력 +20%.'; } },
    ] },
  { id: 'jehu', who: 'army', auto: 0,
    cond: G => G.turn >= 30 && G.done.chariot && (G.done.dothan || G.turn >= 33) && G.exists('army'),
    title: '하사엘과 예후 (BC 841)', ref: '왕하 8:7-15; 9:1–10:36; 12:17; 살만에셀 3세의 검은 오벨리스크',
    text: '엘리사가 다메섹에 가자 병든 벤하닷이 신하 하사엘을 보냈다. 엘리사가 하사엘을 쏘아보다가 울었다. "네가 이스라엘 자손에게 행할 모든 악을 내가 앎이라" (8:12). 이튿날 하사엘이 젖은 이불로 왕의 얼굴을 덮어 죽이고 왕이 되었다. 그 무렵 엘리사는 선지자의 제자 하나에게 기름병을 들려 라못길르앗으로 보냈다. 제자가 군대 장관 예후의 머리에 기름을 붓고 말했다. "내가 너에게 기름을 부어 여호와의 백성 곧 이스라엘의 왕으로 삼노니" (9:6).',
    choices: [
      { label: '엘리사의 기름병을 라못길르앗으로 보낸다', run: G => {
        G.item('army', 'anointing_horn', 1);
        if (G.exists('aram')) { G.kill('벤하닷'); DIV_KIT.lead(G, '하사엘', 'aram'); G.fac('aram').aggr = 0.35; G.rel('army', 'aram', -25); G.rel('aram', 'israel_n', -30); }
        let t = '';
        if (DIV_KIT.live(G, 'israel_n')) {
          G.kill('요람'); G.kill('이세벨'); DIV_KIT.lead(G, '예후', 'israel_n');
          G.eachCity('israel_n', c => { c.faith += 12; c.loy -= 8; }); DIV_KIT.cut(G, 'israel_n', 0.85);
          t = '예후가 이스르엘에서 요람을 쏘고, 창문에서 내던져진 이세벨은 엘리야의 말대로 개들에게 먹혔다 (9:24, 33-37). 예후가 바알의 신전을 헐었으나 금송아지는 떠나지 않았다 (10:28-29). 북이스라엘 신앙 +12, 민심 -8, 병력 15% 손실. 살만에셀 3세의 검은 오벨리스크에는 예후가 앗수르 왕 앞에 엎드려 조공을 바치는 모습이 새겨져 있다 — 이스라엘 왕의 모습이 남은 유일한 옛 그림이다. ';
          if (DIV_KIT.live(G, 'assyria')) { G.fac('assyria').gold += 800; G.fac('israel_n').gold = Math.max(0, G.fac('israel_n').gold - 800); }
        }
        let g = '';
        if (G.exists('aram') && DIV_KIT.owns(G, 'gath', 'philistia') && DIV_KIT.give(G, 'gath', 'aram', 2500)) g = ' 하사엘이 가드를 쳐서 빼앗았다 (12:17).';
        return '기름 뿔 1개. 하사엘이 아람 왕이 되었다 — 아람이 다시 거세진다. ' + t + g; } },
    ] },
  // ---- 5장: 이사야와 히스기야 ----
  { id: 'isaiah', who: 'army', auto: 0,
    cond: G => G.turn >= 32 && (G.done.jehu || G.turn >= 36) && G.exists('army'),
    title: '웃시야 왕이 죽던 해에', ref: '왕하 11장; 대하 26장; 사 6:1-8',
    text: '여호사밧 이후 백 년이 흘렀다. 아합의 딸 아달랴가 다윗의 씨를 진멸하려 했으나 제사장 여호야다가 어린 요아스를 성전에 여섯 해 숨겨 다윗의 등불을 지켰고(왕하 11장), 웃시야는 오십이 년을 다스리며 나라를 강하게 했으나 교만하여 나병이 들었다 (대하 26:16-21). "웃시야 왕이 죽던 해(BC 740)에 내가 본즉 주께서 높이 들린 보좌에 앉으셨는데… 스랍들이 서로 불러 이르되 거룩하다 거룩하다 거룩하다 만군의 여호와여 그의 영광이 온 땅에 충만하도다" (사 6:1-3).',
    choices: [
      { label: '"내가 여기 있나이다 나를 보내소서"', run: G => {
        ['여호사밧', '아드나', '엘리아다', '오바댜', '미가야'].forEach(n => G.kill(n));
        const i = DIV_KIT.lead(G, '이사야'); DIV_KIT.faithAll(G, 8); DIV_KIT.add(G, 2000);
        G.flags.isaiah = true; G.kingdom(2, '거룩하다 거룩하다 거룩하다');
        return '여호사밧과 그 시대의 용사들과 선지자들이 조상들에게로 돌아갔다. ' + (i ? '이사야가 하나님의 군대를 이끈다. ' : '') + '"내가 누구를 보내며 누가 우리를 위하여 갈꼬" — "내가 여기 있나이다 나를 보내소서" (사 6:8). 신앙 +8, 본거지 병력 +2000.'; } },
    ] },
  { id: 'syroEphraim', who: 'army', auto: 0,
    cond: G => G.turn >= 34 && G.done.isaiah && G.exists('army'),
    title: '르신과 베가 — 굳게 믿으라', ref: '왕하 16:5-9; 사 7:1-14',
    text: '아람 왕 르신과 르말랴의 아들 이스라엘 왕 베가가 예루살렘을 치러 올라왔다. "왕의 마음과 그의 백성의 마음이 숲이 바람에 흔들림 같이 흔들렸더라" (사 7:2). 이사야가 아하스 왕에게 가서 말했다. "너는 삼가며 조용하라 두려워하지 말며 르신과 아람과 르말리야의 아들이 심히 노할지라도 이들은 연기 나는 두 부지깽이 그루터기에 불과하니 낙심하지 말라… 만일 너희가 굳게 믿지 아니하면 너희는 굳게 서지 못하리라" (7:4, 9). 그러나 아하스는 앗수르 왕 디글랏빌레셀에게 사자와 은금을 보내려 한다.',
    choices: [
      { label: '이사야의 말대로 여호와를 굳게 믿는다', run: G => {
        if (G.exists('aram')) { G.kill('하사엘'); DIV_KIT.lead(G, '르신', 'aram'); }
        if (G.exists('israel_n')) { G.kill('예후'); DIV_KIT.lead(G, '베가', 'israel_n'); }
        const r = DIV_KIT.raid(G, DIV_KIT.live(G, 'aram') ? 'aram' : 'israel_n', 4500);
        G.buff('army', 'atk', 4, 0.25); DIV_KIT.faithAll(G, 8); G.flags.firmFaith = true; G.kingdom(2, '굳게 믿으면 굳게 서리라');
        return (r ? `르신과 베가의 공격: ${r} ` : '') + '4턴 동안 공격력 +25%, 신앙 +8. "처녀가 잉태하여 아들을 낳을 것이요 그의 이름을 임마누엘이라 하리라" (사 7:14) — 하나님이 우리와 함께 계신다.'; } },
      { label: '성전 은금을 앗수르 왕에게 보낸다 (아하스의 선택)', run: G => {
        if (G.exists('aram')) { G.kill('하사엘'); DIV_KIT.lead(G, '르신', 'aram'); }
        if (G.exists('israel_n')) { G.kill('예후'); DIV_KIT.lead(G, '베가', 'israel_n'); }
        const F = G.fac('army'); F.gold = Math.floor(F.gold * 0.5); DIV_KIT.faithAll(G, -10);
        DIV_KIT.cut(G, 'aram', 0.6); G.rel('army', 'assyria', 30); G.kingdom(-2, '앗수르를 의지하다');
        return '금 절반을 앗수르에 바쳤다. "나는 왕의 신복이요 왕의 아들이라" (왕하 16:7). 앗수르가 아람을 쳐서 아람 병력 40% 손실, 앗수르와의 관계 +30. 그러나 아하스는 다메섹의 제단을 본떠 성전에 두었다 — 신앙 -10.'; } },
    ] },
  { id: 'tiglath', who: 'assyria', auto: 0,
    cond: G => G.turn >= 36 && G.done.syroEphraim && DIV_KIT.live(G, 'assyria'),
    title: '디글랏빌레셀 3세 — 다메섹이 무너지다 (BC 732)', ref: '왕하 15:19, 29; 16:9; 대상 5:26',
    text: '앗수르 왕 디글랏빌레셀 3세(성경은 "불"이라고도 부른다)가 서쪽으로 왔다. 그는 정복한 백성을 먼 땅으로 옮겨 섞는 정책을 폈다. "앗수르 왕이 그 청을 듣고 곧 올라와서 다메섹을 쳐서 점령하여 그 백성을 사로잡아 기르로 옮기고 또 르신을 죽였더라" (왕하 16:9). 갈릴리와 길르앗, 납달리 온 땅의 백성도 앗수르로 끌려갔다 (15:29). BC 729에는 바벨론의 왕위까지 차지했다.',
    choices: [
      { label: '다메섹과 갈릴리와 길르앗을 차지한다', run: G => {
        G.kill('살만에셀 3세'); DIV_KIT.lead(G, '디글랏빌레셀 3세', 'assyria');
        let t = '';
        if (G.exists('aram')) { G.kill('르신'); const n = DIV_KIT.giveAll(G, ['damascus', 'edrei', 'gath'], 'aram', 'assyria'); if (n) t += `아람의 성 ${n}곳이 앗수르에 넘어가고 아람이 멸망했다. `; if (G.exists('aram') && !G.cityCount('aram')) G.fac('aram').alive = false; }
        const n2 = DIV_KIT.giveAll(G, ['dan', 'hazor', 'ramoth', 'megiddo', 'bethshean', 'mahanaim'], 'israel_n', 'assyria'); if (n2) t += `북이스라엘의 성 ${n2}곳(갈릴리·길르앗)이 앗수르의 속주가 되었다. `;
        const b = G.city('babylon'); if (b && !b.owner) { DIV_KIT.give(G, 'babylon', 'assyria', 3000); t += '바벨론도 앗수르의 손에 들어갔다. '; }
        const h = G.city('hamath'); if (h && !h.owner) DIV_KIT.give(G, 'hamath', 'assyria', 2500);
        G.eachCity('assyria', c => { c.soldiers += 800; }); G.fac('assyria').aggr = 0.3; G.fac('assyria').gold += 2000;
        G.flags.tiglath = true;
        return '디글랏빌레셀 3세가 앗수르 왕이 되었다. ' + t + '앗수르 모든 성 병력 +800. 이제 하나님의 군대의 북쪽 이웃은 앗수르다.'; } },
    ] },
  { id: 'samariaFalls', who: 'assyria', auto: 0,
    cond: G => G.turn >= 38 && G.done.tiglath && DIV_KIT.live(G, 'assyria'),
    title: '사마리아의 함락 (BC 722)', ref: '왕하 17:1-23; 18:9-12; 사르곤 2세 연대기',
    text: '이스라엘의 마지막 왕 호세아가 앗수르에 조공을 끊고 애굽 왕 소에게 사자를 보냈다. 앗수르 왕 살만에셀 5세가 올라와 사마리아를 삼 년 동안 에워쌌고, 그 뒤를 이은 사르곤 2세는 "사마리아 사람 이만 칠천이백구십 명을 끌어갔다"고 새겼다. "이 일은 이스라엘 자손이 자기들을 애굽 땅에서 인도하여… 내신 그들의 하나님 여호와께 죄를 범하고 또 다른 신들을 경외하며" (17:7). 앗수르는 다른 땅의 백성을 사마리아 성읍들에 옮겨 살게 했다 — 훗날 사마리아인의 뿌리다 (17:24).',
    choices: [
      { label: '사마리아를 무너뜨리고 백성을 옮긴다', run: G => {
        G.kill('디글랏빌레셀 3세'); DIV_KIT.lead(G, '사르곤 2세', 'assyria'); DIV_KIT.enter(G, '살만에셀 5세', 'assyria');
        if (G.exists('egypt')) DIV_KIT.lead(G, '소', 'egypt');
        let t = '';
        if (DIV_KIT.live(G, 'israel_n')) {
          G.kill('베가'); DIV_KIT.enter(G, '호세아', 'israel_n');
          const n = DIV_KIT.giveAll(G, ['samaria', 'shechem', 'shiloh', 'bethel', 'jericho', 'heshbon', 'dan', 'hazor', 'ramoth', 'megiddo', 'bethshean', 'mahanaim'], 'israel_n', 'assyria');
          G.kill('호세아'); if (G.exists('israel_n')) { G.fac('israel_n').alive = false; }
          t = `북이스라엘의 남은 성 ${n}곳이 앗수르에 넘어가고 북이스라엘이 멸망했다. `;
        }
        if (DIV_KIT.mine(G, 'samaria')) { const r = DIV_KIT.raid(G, 'assyria', 7000, 'samaria'); t += `하나님의 군대가 지키는 사마리아로 앗수르가 왔다: ${r} `; }
        G.eachCity('assyria', c => { if (['samaria', 'shechem', 'bethel', 'jericho', 'shiloh'].includes(c.id)) c.loy = 30; });
        G.flags.samariaFell = true;
        return '사르곤 2세가 앗수르 왕이 되었다. ' + t + '열 지파는 흩어졌다. 그러나 남은 자들이 있다 — 히스기야는 훗날 그들에게 유월절 편지를 보낸다.'; } },
    ] },
  { id: 'hezekiah', who: 'army', auto: 0,
    cond: G => G.turn >= 39 && G.done.isaiah && G.exists('army') && (G.done.samariaFalls || G.turn >= 42),
    title: '히스기야와 느후스단', ref: '왕하 18:1-8; 대하 29–31장',
    text: '아하스의 아들 히스기야가 스물다섯 살에 왕이 되었다(BC 715). "히스기야가 이스라엘 하나님 여호와를 의지하였는데 그의 전후 유다 여러 왕 중에 그러한 자가 없었으니" (왕하 18:5). 그가 성전 문을 다시 열고, 브엘세바에서 단까지 온 이스라엘에 보발꾼을 보내 유월절에 초청했다. "이스라엘 자손들아 너희는 아브라함과 이삭과 이스라엘의 하나님 여호와께로 돌아오라" (대하 30:6). 그리고 모세가 만든 놋뱀 앞에 이르렀다. 이스라엘 자손이 그때까지 그것에게 분향하고 있었다.',
    choices: [
      { label: '놋뱀을 부수고 "느후스단(놋 조각)"이라 부른다', run: G => {
        DIV_KIT.lead(G, '히스기야'); DIV_KIT.enter(G, '엘리아김'); DIV_KIT.enter(G, '요아');
        DIV_KIT.faithAll(G, 15, 5); DIV_KIT.add(G, 2500); G.kingdom(4, '오직 여호와만 의지하다');
        G.flags.hezekiah = true; G.flags.nehushtan = true;
        return '히스기야가 하나님의 군대를 이끈다(이사야는 곁에서 말씀을 전한다). 궁내대신 엘리아김과 사관 요아가 합류했다. 산당을 없애고 놋뱀을 부수었다 (왕하 18:4). 신앙 +15, 민심 +5. 아셀과 므낫세와 스불론 중의 몇 사람이 스스로 겸손한 마음으로 예루살렘에 왔다 (대하 30:11) — 본거지 병력 +2500.'; } },
      { label: '모세의 놋뱀을 성물로 간직한다', run: G => {
        DIV_KIT.lead(G, '히스기야'); DIV_KIT.enter(G, '엘리아김'); DIV_KIT.enter(G, '요아');
        G.item('army', 'bronze_serpent', 1); DIV_KIT.faithAll(G, -8); DIV_KIT.add(G, 2500); G.kingdom(-2, '놋뱀에게 분향하다');
        G.flags.hezekiah = true;
        return '놋뱀 1개. 그러나 백성은 계속 그 앞에 분향했다 — 신앙 -8. 본거지 병력 +2500. 성경의 역사에서 히스기야는 놋뱀을 부수었다. 구원은 놋뱀이 아니라 그것을 쳐다보라 하신 여호와께 있었다 (민 21:8-9; 요 3:14-15).'; } },
    ] },
  { id: 'merodach', who: 'army', auto: 0,
    cond: G => G.turn >= 41 && G.done.hezekiah && G.exists('army') && G.alive('히스기야'),
    title: '히스기야의 병과 바벨론 사절', ref: '왕하 20:1-19; 사 38–39장',
    text: '히스기야가 병들어 죽게 되었을 때 벽을 향하여 기도하며 심히 통곡했다. 여호와께서 이사야를 보내 말씀하셨다. "내가 네 기도를 들었고 네 눈물을 보았노라… 네 날에 십오 년을 더할 것이며" (20:5-6). 아하스의 해시계 그림자가 뒤로 십 도 물러갔다. 그 무렵 바벨론 왕 므로닥발라단(앗수르 비문의 마르둑-아플라-이디나 2세)이 편지와 예물을 보냈다. 히스기야가 사자들을 반기며 보물고를 보여 주려 한다.',
    choices: [
      { label: '보물고와 무기고를 다 보여 준다 (역사의 선택)', run: G => {
        G.fac('army').gold += 600; DIV_KIT.faithAll(G, -5); G.flags.showedTreasure = true;
        return '금 +600 (바벨론의 예물). 이사야가 말했다. "날이 이르리니 왕궁의 모든 것과 왕의 조상들이 쌓아 두었던 것이 바벨론으로 옮긴 바 되고 하나도 남지 아니할 것이요" (20:17). 신앙 -5. 훗날 바벨론은 그 보물을 기억한다.'; } },
      { label: '예물을 받되 영광은 여호와께 돌린다', run: G => {
        DIV_KIT.faithAll(G, 6); G.item('army', 'psalm_scroll', 1); G.kingdom(2, '살아 있는 자는 주를 찬양하리이다');
        return '히스기야가 병에서 나은 뒤에 노래를 지었다. "오직 산 자 곧 산 자는 오늘 내가 하는 것과 같이 주께 감사하며" (사 38:19). 시편 두루마리 1개, 신앙 +6.'; } },
    ] },
  { id: 'sennacherib', who: 'army', auto: 0,
    cond: G => G.turn >= 43 && G.done.hezekiah && G.exists('army'),
    title: '산헤립과 랍사게, 그리고 한 밤 (BC 701)', ref: '왕하 18:13–19:37; 대하 32:1-23; 사 36–37장',
    text: '히스기야 제십사년에 앗수르 왕 산헤립이 올라와 유다의 모든 견고한 성을 쳤다. 그가 라기스를 에워싼 장면은 니느웨 궁전 벽에 새겨져 지금 대영박물관에 있다. 랍사게가 예루살렘 윗못 수도 곁에 서서 히브리 말로 외쳤다. "너희는 히스기야가 너희를 속이지 못하게 하라… 열국의 신들 중에 누가 그의 땅을 내 손에서 건졌느냐" (18:29, 33). 히스기야는 기혼 샘에서 실로암으로 물길을 팠고(20:20; 실로암 비문), 산헤립의 편지를 받아 여호와의 전에 올라가 그 앞에 펴 놓았다.',
    choices: [
      { label: '편지를 여호와 앞에 펴 놓고 기도한다', run: G => {
        DIV_KIT.lead(G, '산헤립', 'assyria'); G.kill('사르곤 2세'); G.kill('살만에셀 5세'); DIV_KIT.enter(G, '랍사게', 'assyria');
        if (G.exists('egypt')) DIV_KIT.lead(G, '디르하가', 'egypt');
        const j = G.city('jerusalem'); if (j && j.owner === 'army') j.def += 12;
        const r = DIV_KIT.raid(G, 'assyria', 9000, 'lachish');
        DIV_KIT.cut(G, 'assyria', 0.5); G.buff('assyria', 'atk', 6, -0.3); G.kill('랍사게');
        G.fac('assyria').aggr = 0.15; DIV_KIT.faithAll(G, 12); G.buff('army', 'atk', 4, 0.25);
        G.flags.angel185 = true; G.kingdom(5, '천하 만국이 알리이다');
        return (r ? `라기스 공성: ${r} ` : '') + '예루살렘 성벽 +12 (실로암 수로). 히스기야가 기도했다. "우리 하나님 여호와여 원하건대 이제 우리를 그의 손에서 구원하옵소서 그리하시면 천하 만국이 주 여호와가 홀로 하나님이신 줄 알리이다" (19:19). "이 밤에 여호와의 사자가 나가서 앗수르 진영에서 군사 십팔만 오천 명을 쳤으므로" (19:35). 앗수르 모든 성의 병력 절반이 사라지고 6턴 동안 공격력 -30%. 산헤립은 니느웨로 돌아갔다 — 그의 비문도 히스기야를 "새장 속의 새처럼 가두었다"고만 적었을 뿐 예루살렘을 빼앗았다고는 말하지 못한다. 신앙 +12, 4턴 동안 공격력 +25%.'; } },
      { label: '먼저 은 삼백 달란트와 금 삼십 달란트를 바친다', run: G => {
        DIV_KIT.lead(G, '산헤립', 'assyria'); G.kill('사르곤 2세'); G.kill('살만에셀 5세'); DIV_KIT.enter(G, '랍사게', 'assyria');
        const F = G.fac('army'); F.gold = Math.floor(F.gold * 0.4);
        const r = DIV_KIT.raid(G, 'assyria', 6000, 'lachish');
        DIV_KIT.cut(G, 'assyria', 0.5); G.buff('assyria', 'atk', 6, -0.3); G.kill('랍사게'); G.fac('assyria').aggr = 0.15;
        G.flags.angel185 = true; G.kingdom(2, '그래도 구원하시다');
        return '금 -60%. 성경의 역사에서도 히스기야는 먼저 조공을 바쳤으나(18:14-16) 산헤립은 그래도 랍사게를 보냈다. ' + (r ? `라기스 공성: ${r} ` : '') + '결국 히스기야는 여호와께 부르짖었고, 그 밤에 여호와의 사자가 앗수르 군사 십팔만 오천을 쳤다 (19:35). 앗수르 모든 성 병력 절반 손실, 6턴 동안 공격력 -30%.'; } },
    ] },
  // ---- 6장: 요시야와 예레미야, 바벨론 ----
  { id: 'josiah', who: 'army', auto: 0,
    cond: G => G.turn >= 46 && G.done.sennacherib && G.exists('army'),
    title: '므낫세의 오십오 년과 여덟 살 왕 요시야', ref: '왕하 21:1–22:2; 대하 33:10-16; 34:1-3; 렘 1:4-10',
    text: '히스기야의 아들 므낫세는 오십오 년 동안 다스리며 바알의 제단을 다시 쌓고 무죄한 자의 피를 많이 흘렸다 (왕하 21:16). 그러나 앗수르에 사로잡혀 바벨론으로 끌려갔을 때 "그의 조상들의 하나님 앞에 크게 겸손하여" 기도했고 돌아와 이방 신들을 없앴다 (대하 33:12-15). 이사야는 이 무렵 톱으로 켜 죽임을 당했다는 전승이 있다 (히 11:37 참조). 그 손자 요시야가 여덟 살에 왕이 되었고(BC 640), 열여섯 살에 "그의 조상 다윗의 하나님을 비로소 찾고" (대하 34:3). 요시야 제십삼년(BC 627) 아나돗의 청년 예레미야에게 말씀이 임했다.',
    choices: [
      { label: '어린 요시야를 세우고 예레미야를 부른다', run: G => {
        ['히스기야', '이사야', '엘리아김', '요아', '아마시야', '엘리사', '미가야', '잇도', '아사랴', '스마야'].forEach(n => G.kill(n));
        const j = DIV_KIT.lead(G, '요시야'); ['힐기야', '사반', '훌다', '예레미야'].forEach(n => DIV_KIT.enter(G, n));
        DIV_KIT.faithAll(G, -10); G.flags.josiah = true;
        return '히스기야와 이사야와 그 시대의 사람들이 떠났다. 므낫세의 긴 세월이 남긴 우상이 백성의 신앙을 식혔다 — 신앙 -10. ' + (j ? '요시야가 하나님의 군대를 이끈다. ' : '') + '대제사장 힐기야, 서기관 사반, 여선지자 훌다, 그리고 "나는 아이라" 하던 예레미야가 합류했다. "너는 아이라 말하지 말고… 두려워하지 말라 내가 너와 함께 하여 너를 구원하리라" (렘 1:7-8).'; } },
    ] },
  { id: 'bookFound', who: 'army', auto: 0,
    cond: G => G.turn >= 48 && G.done.josiah && G.exists('army'),
    title: '성전에서 발견된 율법책 (BC 622)', ref: '왕하 22:3–23:25; 대하 34:8–35:19',
    text: '요시야 제십팔년, 성전을 수리하던 대제사장 힐기야가 여호와의 율법책을 발견했다. 서기관 사반이 그것을 왕 앞에서 읽자 왕이 옷을 찢었다. 여선지자 훌다가 말했다. "네가… 마음이 부드러워져서 여호와 앞 곧 내 앞에서 겸비하여 옷을 찢고 통곡하였으므로 나도 네 말을 들었노라" (22:19). 왕이 모든 백성 앞에서 언약을 새롭게 하고, 벧엘의 제단과 사마리아 성읍들의 산당까지 헐었다. 그리고 레위 사람들에게 명했다. "거룩한 궤를 이스라엘 왕 다윗의 아들 솔로몬이 건축한 전 가운데 두고 다시는 너희 어깨에 메지 말고" (대하 35:3).',
    choices: [
      { label: '언약을 새롭게 하고 유월절을 지킨다', run: G => {
        G.item('army', 'torah_scroll', 1); G.item('army', 'ark', 1); DIV_KIT.faithAll(G, 22, 8);
        let t = '';
        const b = G.city('bethel');
        if (b && b.owner !== 'army' && b.owner !== 'babylon' && ROADS.some(([x, y]) => (x === 'bethel' && DIV_KIT.mine(G, y)) || (y === 'bethel' && DIV_KIT.mine(G, x)))) {
          b.soldiers = Math.floor(b.soldiers * 0.5); DIV_KIT.give(G, 'bethel', 'army', 1500); b.loy = 70; b.faith += 20;
          t = ' 앗수르가 기울어 가는 틈에 요시야의 개혁이 벧엘에 이르렀다 — 벧엘이 하나님의 군대에 들어왔다 (23:15).';
        }
        G.flags.bookFound = true; G.kingdom(5, '마음을 다하며 뜻을 다하며 힘을 다하여');
        return '율법 두루마리 1개, 언약궤. 신앙 +22, 민심 +8. "사무엘 시대 이후로 이스라엘 가운데서 유월절을 이같이 지키지 못하였고" (대하 35:18). "요시야와 같이 마음을 다하며 뜻을 다하며 힘을 다하여 모세의 모든 율법을 따라 여호와께로 돌이킨 왕은 요시야 전에도 없었고 그 후에도 그와 같은 자가 일어난 일이 없었더라" (왕하 23:25).' + t; } },
    ] },
  { id: 'babylonRise', who: 'army', auto: 0,
    cond: G => G.turn >= 49 && G.done.josiah && G.exists('army') && !G.exists('babylon'),
    title: '바벨론이 일어나고 니느웨가 무너지다 (BC 626–612)', ref: '나 1:1; 3:1-7; 습 2:13-15; 바벨론 연대기',
    text: '갈대아 사람 나보폴라살이 BC 626 바벨론에서 왕이 되어 앗수르에 맞섰다. 그는 메대와 손을 잡고 BC 614 앗수르 성을, BC 612 니느웨를 무너뜨렸다. 백 년 전 요나의 외침에 회개했던 그 큰 성이었다. 선지자 나훔은 이렇게 노래했다. "화 있을진저 피의 성이여 그 안에는 거짓이 가득하고 포악이 가득하며… 니느웨가 황폐하였도다 누가 그것을 위하여 애곡하랴" (나 3:1, 7). 남은 앗수르 사람들은 하란으로 물러갔다.',
    choices: [
      { label: '나훔의 노래를 백성에게 들려준다', run: G => {
        const cid = ['babylon', 'ur', 'susa'].find(c => DIV_KIT.on(G, c) && !DIV_KIT.mine(G, c));
        let t = '';
        if (cid) {
          const prev = G.ownerOf(cid);
          G.rebel('babylon', '바벨론', cid, ['나보폴라살', 84, 80, 82, 70, 10, null, cid, '갈대아 사람, 신 바벨론 제국을 세운 왕. 메대와 함께 니느웨를 무너뜨렸다.', '바벨론 연대기']);
          DIV_KIT.dress(G, 'babylon', '#c9a227', 0.35, 3000, 14000);
          if (prev) { DIV_KIT.fixCap(G, prev); DIV_KIT.prune(G, prev); }
          DIV_KIT.enter(G, '느부갓네살 2세', 'babylon'); DIV_KIT.enter(G, '느부사라단', 'babylon');
          const n = DIV_KIT.giveAll(G, ['nineveh', 'ashur', 'ur', 'susa'], 'assyria', 'babylon');
          ['ur', 'susa'].forEach(c => { const x = G.city(c); if (x && !x.owner) DIV_KIT.give(G, c, 'babylon', 2500); });
          G.eachCity('babylon', c => { c.soldiers += 2500; c.train = Math.max(c.train, 60); });
          G.rel('army', 'babylon', 25);
          if (G.exists('assyria')) { G.kill('산헤립'); DIV_KIT.cut(G, 'assyria', 0.7); DIV_KIT.fixCap(G, 'assyria'); if (DIV_KIT.owns(G, 'haran', 'assyria')) G.fac('assyria').capital = 'haran'; }
          t = `나보폴라살의 바벨론이 일어났다. 앗수르의 성 ${n}곳(니느웨·앗수르 등)이 바벨론에 넘어갔고, 남은 앗수르는 하란으로 물러갔다 (병력 30% 손실). `;
        }
        DIV_KIT.faithAll(G, 4); G.flags.ninevehFell = true;
        return t + '신앙 +4. "여호와는 선하시며 환난 날에 산성이시라 그는 자기에게 피하는 자들을 아시느니라" (나 1:7).'; } },
    ] },
  { id: 'megiddo', who: 'army', auto: 0,
    cond: G => G.turn >= 51 && G.done.babylonRise && G.exists('army'),
    title: '므깃도의 요시야 (BC 609)', ref: '왕하 23:28-30; 대하 35:20-25',
    text: '애굽 왕 느고가 유브라데 강 가의 갈그미스로 올라가 앗수르를 도우려 했다. 요시야가 므깃도로 나가 막으려 하자 느고가 사신을 보냈다. "유다 왕이여 내가 그대와 무슨 관계가 있느냐 내가 오늘 그대를 치려는 것이 아니요 나와 더불어 싸우는 족속을 치려는 것이라 하나님이 나에게 명령하사 속히 하라 하셨은즉 나와 함께 계시는 하나님을 거스르지 말라" (대하 35:21). 요시야는 변장하고 므깃도 골짜기로 나가려 한다.',
    choices: [
      { label: '변장하고 므깃도로 나간다 (역사의 선택)', run: G => {
        DIV_KIT.lead(G, '느고 2세', 'egypt'); G.kill('디르하가'); G.kill('소');
        G.kill('요시야'); const h = DIV_KIT.home(G); if (h) h.soldiers = Math.floor(h.soldiers * 0.85);
        const jr = DIV_KIT.lead(G, '예레미야'); DIV_KIT.enter(G, '바룩'); DIV_KIT.enter(G, '에벳멜렉');
        const cc = G.city('carchemish'); if (cc && cc.owner !== 'army' && cc.owner !== 'babylon') DIV_KIT.give(G, 'carchemish', 'egypt', 5000);
        DIV_KIT.faithAll(G, -3); G.flags.megiddo = true;
        return '활 쏘는 자들이 요시야를 쏘았다. 그가 예루살렘에 돌아와 죽으니 온 유다와 예루살렘이 슬퍼했고 예레미야가 애가를 지었다 (대하 35:23-25). 본거지 병력 15% 손실, 신앙 -3. ' + (jr ? '이제 예레미야가 하나님의 군대를 이끈다 — 바룩과 에벳멜렉이 곁에 섰다. ' : '') + '느고가 갈그미스에 진을 쳤다.'; } },
      { label: '느고의 입에서 나온 하나님의 말씀을 분별하고 므깃도로 나가지 않는다', run: G => {
        DIV_KIT.lead(G, '느고 2세', 'egypt'); G.kill('디르하가'); G.kill('소');
        DIV_KIT.enter(G, '바룩'); DIV_KIT.enter(G, '에벳멜렉'); DIV_KIT.faithAll(G, 6); G.rel('army', 'egypt', 20);
        const cc = G.city('carchemish'); if (cc && cc.owner !== 'army' && cc.owner !== 'babylon') DIV_KIT.give(G, 'carchemish', 'egypt', 5000);
        G.flags.megiddo = true; G.kingdom(2, '하나님을 거스르지 않다');
        return '성경의 역사에서는 요시야가 므깃도에서 활에 맞아 죽었다 — "느고의 말을 듣지 아니하고" (대하 35:22). 이 게임에서는 요시야가 살아 하나님의 군대를 계속 이끈다. 신앙 +6, 애굽과의 관계 +20. 예레미야의 서기관 바룩과 구스 사람 에벳멜렉이 합류했다. 느고가 갈그미스에 진을 쳤다.'; } },
    ] },
  { id: 'carchemish', who: 'babylon', auto: 0,
    cond: G => G.turn >= 53 && (G.done.megiddo || G.turn >= 56) && DIV_KIT.live(G, 'babylon'),
    title: '갈그미스 전투 (BC 605)', ref: '렘 46:2-12; 왕하 24:7; 단 1:1-2; 렘 25:1-12',
    text: '바벨론 왕의 아들 느부갓네살이 유브라데 강 가 갈그미스에서 애굽 왕 느고의 군대를 쳐부수었다. "그들이 놀라 물러가며 그들의 용사들은 패하여 황급히 도망하며 뒤를 돌아보지 아니함은 어찜이냐 두려움이 그들의 사방에 있음이로다" (렘 46:5). 그해 나보폴라살이 죽고 느부갓네살 2세가 왕이 되었다. "애굽 왕이 다시는 그 땅에서 나오지 못하였으니 이는 바벨론 왕이 애굽 강에서부터 유브라데 강까지 애굽 왕에게 속한 땅을 다 점령하였음이더라" (왕하 24:7). 같은 해 소년 다니엘과 세 친구가 바벨론으로 끌려갔고, 예레미야는 "칠십 년"을 예언했다 (렘 25:11).',
    choices: [
      { label: '갈그미스를 무너뜨리고 서쪽을 차지한다', run: G => {
        if (!G.exists('babylon')) return '바벨론은 이미 무너졌다.';
        G.kill('나보폴라살'); DIV_KIT.lead(G, '느부갓네살 2세', 'babylon');
        let n = DIV_KIT.giveAll(G, ['carchemish'], 'egypt', 'babylon');
        const cc = G.city('carchemish'); if (cc && !cc.owner) { DIV_KIT.give(G, 'carchemish', 'babylon', 4000); n++; }
        if (G.exists('assyria')) { ['산헤립', '살만에셀 3세'].forEach(x => G.kill(x)); n += DIV_KIT.giveAll(G, ['haran', 'nineveh', 'ashur', 'hamath', 'damascus', 'edrei', 'gath', 'dan', 'hazor', 'ramoth', 'megiddo', 'bethshean', 'mahanaim', 'samaria', 'shechem', 'shiloh', 'bethel', 'jericho', 'heshbon'], 'assyria', 'babylon'); if (G.exists('assyria')) G.fac('assyria').alive = false; }
        const h = G.city('hamath'); if (h && !h.owner) { DIV_KIT.give(G, 'hamath', 'babylon', 3000); n++; }
        DIV_KIT.cut(G, 'egypt', 0.5); if (G.exists('egypt')) G.fac('egypt').aggr = 0.1;
        G.fac('babylon').aggr = 0.4; G.eachCity('babylon', c => { c.soldiers += 1500; });
        G.flags.carchemish = true;
        return `느부갓네살 2세가 바벨론 왕이 되었다. 앗수르가 완전히 사라지고, 갈그미스와 앗수르가 쥐고 있던 성 ${n}곳이 바벨론에 넘어갔다. 애굽 모든 성의 병력 절반이 사라졌다. 바벨론 모든 성 병력 +1500 — 이제 바벨론이 세계의 강국이다.`; } },
    ] },
  { id: 'fall586', who: 'army', auto: 0,
    cond: G => G.turn >= 56 && G.done.carchemish && G.exists('army') && DIV_KIT.live(G, 'babylon'),
    title: '느부사라단과 아나돗의 밭 (BC 588–586)', ref: '렘 32:1-15; 39:1-10; 52:12-16; 왕하 25:1-11; 애 3:22-23',
    text: '바벨론 왕 느부갓네살이 모든 군대를 거느리고 예루살렘을 에워쌌다. 성이 에워싸인 그때 여호와께서 옥에 갇힌 예레미야에게 말씀하셨다. "너는 아나돗에 있는 내 밭을 사라." 예레미야가 은 십칠 세겔을 달아 주고 증서에 인을 쳤다. "사람이 이 땅에서 집과 밭과 포도원을 다시 사게 되리라" (32:15). 성경의 역사에서는 BC 586 시위대장관 느부사라단이 성전과 왕궁을 불사르고 성벽을 헐었으며, 백성은 바벨론으로 사로잡혀 갔다 (왕하 25:8-11). 이 게임에서는 하나님의 군대가 그날을 맞선다.',
    choices: [
      { label: '아나돗의 밭을 산다 — 소망을 붙들고 성을 지킨다', run: G => {
        DIV_KIT.enter(G, '느부사라단', 'babylon');
        const j = DIV_KIT.mine(G, 'jerusalem') ? 'jerusalem' : null;
        const r = DIV_KIT.raid(G, 'babylon', 9000, j);
        G.eachCity('army', c => { c.loy += 10; }); G.fac('army').food += 3000; DIV_KIT.faithAll(G, 8);
        G.buff('army', 'atk', 5, 0.25); G.buff('babylon', 'atk', 3, -0.15);
        G.flags.anathoth = true; G.kingdom(3, '너희에게 미래와 희망을');
        return (r ? `바벨론의 공격: ${r} ` : '') + '민심 +10, 식량 +3000, 신앙 +8, 5턴 동안 공격력 +25%. "너희를 향한 나의 생각을 내가 아나니 평안이요 재앙이 아니니라 너희에게 미래와 희망을 주는 것이니라" (렘 29:11). 예레미야는 바벨론의 멸망도 예언했다 — "바벨론이 함락되고 벨이 수치를 당하며" (렘 50:2). 성경의 역사에서 그 말씀은 BC 539 바사의 고레스를 통해 이루어진다. 이 게임에서는 하나님의 군대가 바벨론으로 나아간다.'; } },
      { label: '애굽의 군대를 기다리며 끝까지 싸운다', run: G => {
        DIV_KIT.enter(G, '느부사라단', 'babylon');
        const j = DIV_KIT.mine(G, 'jerusalem') ? 'jerusalem' : null;
        const r = DIV_KIT.raid(G, 'babylon', 11000, j); DIV_KIT.faithAll(G, -5);
        G.flags.anathoth = true;
        return (r ? `바벨론의 공격: ${r} ` : '') + '예레미야가 경고했다. "너희를 도우려고 나왔던 바로의 군대는 자기 땅 애굽으로 돌아가겠고" (렘 37:7). 사람을 의지한 싸움에 신앙 -5.'; } },
    ] },
];

STORY.e_divided = {
  army: [
    { title: '견고한 성읍들', ref: '왕상 12:1-24; 대하 11:5-17',
      intro: [
        ['narr', '솔로몬이 죽었다. 세겜에 모인 온 이스라엘이 "왕의 아버지가 우리의 멍에를 무겁게 하였으나 이제 가볍게 하소서" 청했다. 르호보암은 노인들의 자문을 버리고 젊은 신하들의 말을 따랐다 (왕상 12:4-14).'],
        ['narr', '"우리가 다윗과 무슨 관계가 있느냐… 이스라엘아 너희의 장막으로 돌아가라." 열 지파가 떠나 여로보암을 왕으로 세웠다 (12:16-20). 예루살렘에는 유다와 베냐민만 남았다.'],
        ['word', '"여호와의 군대 대장이 여호수아에게 이르되 네 발에서 신을 벗으라." (수 5:15) — 칼보다 먼저, 이 군대가 누구의 군대인지 기억하라.'],
        ['스마야', '왕이여, 이 일은 여호와께로 말미암아 난 것입니다. 떠난 마음은 칼로 돌아오지 않습니다. 남은 성읍부터 견고하게 하십시오.'],
        ['르호보암', '베들레헴과 헤브론과 라기스… 성읍마다 방패와 창을 두고 크게 견고하게 하라. 남쪽 애굽의 시삭이 심상치 않다.'],
        ['잇도', '레위 사람들이 목초지와 산업을 떠나 예루살렘으로 내려오고 있습니다. 북쪽에서도 여호와를 찾는 자들이 옵니다 (대하 11:14-16).'],
      ],
      goal: { t: 'cmd', key: 'wall', n: 3, text: '성벽 보수를 3번 한다 — 르호보암이 라기스와 헤브론을 견고하게 한 것처럼 (대하 11:5-12)', city: 'lachish' },
      reward: { k: 10, gold: 500 },
      outro: [['narr', '"그 견고한 성읍들을 더욱 견고하게 하고 지휘관들을 그 가운데에 두고 양식과 기름과 포도주를 저축하고" (대하 11:11). 삼 년 동안 백성이 다윗과 솔로몬의 길로 행했다.'], ['스마야', '성벽은 섰습니다. 그러나 성을 지키시는 이는 여호와이십니다. 교만해지는 날을 조심하십시오.']] },
    { title: '스마라임 산의 외침', ref: '대하 13:1-20; 14–16장',
      intro: [
        ['narr', '르호보암의 아들 아비야가 군사 사십만을 이끌고 나가자 여로보암은 팔십만으로 맞섰다. 아비야가 스마라임 산 위에 섰다.'],
        ['아비야', '여로보암과 온 이스라엘아! 여호와께서 소금 언약으로 이 나라를 다윗에게 주신 것을 모르느냐. 너희는 금송아지를 두고 아론의 자손 제사장들을 쫓아냈다. 우리의 하나님은 우리와 함께 계시다!'],
        ['word', '"이스라엘 자손들아 너희 조상들의 하나님 여호와와 싸우지 말라 너희가 형통하지 못하리라." (대하 13:12)'],
        ['잇도', '복병이 뒤로 돌아오고 있습니다! 앞뒤가 막혔습니다!'],
        ['아비야', '제사장들은 나팔을 불라. 온 유다는 소리 질러라! 그리고 벧엘로 — 금송아지가 선 그 성을 되찾자.'],
      ],
      goal: { t: 'own', city: 'bethel', text: '벧엘을 되찾는다 — 아비야가 벧엘과 여사나와 에브론을 빼앗았다 (대하 13:19)', city: 'bethel' },
      reward: { k: 15, gold: 800 },
      outro: [['narr', '"그 때에 이스라엘 자손이 항복하고 유다 자손이 이겼으니 이는 그들이 그들의 조상들의 하나님 여호와를 의지하였음이라" (대하 13:18).'], ['아사', '할아버지 르호보암도, 아버지 아비야도 이 성을 원했습니다. 이제 이 땅의 산당과 우상도 찍어 내겠습니다. 여호와를 찾는 나라가 되게 하소서.']] },
    { title: '갈멜산의 불', ref: '대하 17–20장; 왕상 17–19장',
      intro: [
        ['narr', '아사가 죽고 여호사밧이 왕이 되었다. 그는 레위 사람들에게 율법책을 들려 온 유다를 가르치게 했다. 한편 북쪽에서는 오므리가 사마리아를 세웠고, 그 아들 아합이 시돈 공주 이세벨과 함께 바알의 신전을 지었다.'],
        ['여호사밧', '칼보다 말씀이 먼저 유다 성읍마다 들어가게 하라. 백성이 율법을 알면 두려워할 것이 없다.'],
        ['엘리야', '"내가 섬기는 이스라엘의 하나님 여호와께서 살아 계심을 두고 맹세하노니 내 말이 없으면 수 년 동안 비도 이슬도 있지 아니하리라." (왕상 17:1)'],
        ['오바댜', '이세벨이 여호와의 선지자들을 죽이고 있습니다. 저는 백 명을 오십 명씩 굴에 숨겨 떡과 물을 먹이고 있습니다. 엘리야여, 이제 어찌하시렵니까?'],
        ['엘리야', '갈멜산으로 온 이스라엘과 바알의 선지자 사백오십 명을 모으라. 불로 응답하시는 이가 하나님이시다.'],
        ['@advisor', '가뭄이 계속되는 동안 곳간을 지키고 성읍을 가르치십시오. 여호와께서 응답하실 날(20턴 무렵)이 옵니다.'],
      ],
      goal: { t: 'flag', flag: 'carmel', text: '엘리야가 갈멜산에서 하늘의 불을 부를 때까지(20턴 무렵) 유다를 말씀으로 가르치고 굳게 지킨다', city: 'jerusalem' },
      reward: { k: 15, food: 4000 },
      outro: [['narr', '"여호와 그는 하나님이시로다 여호와 그는 하나님이시로다." (왕상 18:39) 그러나 이세벨의 위협에 엘리야는 광야로 달아나 로뎀 나무 아래에서 죽기를 구했다. 천사가 그를 먹였고, 호렙 산에서 그는 바람과 지진과 불 뒤에 오는 세미한 소리를 들었다 (19:4-12).'], ['엘리야', '나만 홀로 남았다고 생각했습니다. 그런데 바알에게 무릎 꿇지 않은 칠천 명이 있다 하십니다. 엘리사야, 이 겉옷을 받아라.']] },
    { title: '도단의 불말과 불병거', ref: '왕상 22장; 왕하 2–10장',
      intro: [
        ['narr', '아합은 라못길르앗에서 한 병사가 무심코 쏜 화살에 죽었다. 엘리야는 회오리바람으로 하늘에 올라갔고, 그 겉옷은 엘리사에게 남았다.'],
        ['엘리사', '"내 아버지여 내 아버지여 이스라엘의 병거와 그 마병이여." 그분이 떠나셨어도 그분의 하나님은 여기 계십니다.'],
        ['narr', '아람 왕이 이스라엘을 칠 때마다 엘리사가 그 계획을 미리 알렸다. 아람 왕이 크게 노하여 엘리사가 머문 도단을 밤에 에워쌌다.'],
        ['word', '"두려워하지 말라 우리와 함께 한 자가 그들과 함께 한 자보다 많으니라." (왕하 6:16)'],
        ['엘리사', '여호와여, 저 청년의 눈을 열어 보게 하소서. 야곱이 마하나임에서 본 그 군대가 오늘도 이 산에 있습니다.'],
        ['@advisor', '라못길르앗은 본래 우리 백성의 땅입니다 (왕상 22:3). 길르앗의 도피성을 되찾으면 요단 동편이 열립니다.'],
      ],
      goal: { t: 'own', city: 'ramoth', text: '라못길르앗을 차지한다 (왕상 22:3; 왕하 9:1)', city: 'ramoth' },
      reward: { k: 20, gold: 1000 },
      outro: [['narr', '라못길르앗은 이 시대 내내 싸움터였다. 아합이 여기서 쓰러졌고, 예후가 여기서 기름 부음을 받았다 (왕하 9:1-6).'], ['엘리사', '불말과 불병거를 본 눈으로 이제 이 땅을 봅니다. 이 성은 칼로 얻은 것이 아니라 맡겨 주신 것입니다.']] },
    { title: '히스기야의 기도', ref: '사 6–7장; 왕하 17–19장; 대하 29–32장',
      intro: [
        ['narr', '백 년이 흘렀다. 웃시야 왕이 죽던 해, 이사야가 높이 들린 보좌를 보았다. 그러나 동쪽에서 앗수르가 일어났다. 디글랏빌레셀이 다메섹을, 사르곤이 사마리아를 삼켰다. 열 지파가 흩어졌다.'],
        ['이사야', '"너는 삼가며 조용하라 두려워하지 말며 낙심하지 말라… 만일 너희가 굳게 믿지 아니하면 너희는 굳게 서지 못하리라." (사 7:4, 9)'],
        ['히스기야', '성전 문을 다시 열고, 브엘세바에서 단까지 보발꾼을 보내라. 흩어진 형제들에게 유월절에 돌아오라고 전하라.'],
        ['narr', '그리고 BC 701, 앗수르 왕 산헤립이 유다의 견고한 성읍 마흔여섯을 쳤다. 라기스가 에워싸였다.'],
        ['word', '"그와 함께 하는 자는 육신의 팔이요 우리와 함께 하는 자는 우리의 하나님 여호와시라 반드시 우리를 도우시고 우리를 대신하여 싸우시리라." (대하 32:8)'],
        ['@advisor', '기혼 샘의 물길을 성 안으로 돌리고 성벽을 보수하십시오. 산헤립의 군대(43턴 무렵)가 오기 전에 준비해야 합니다.'],
      ],
      goal: { t: 'flag', flag: 'angel185', text: '산헤립의 침공(43턴 무렵)을 기도로 이겨 낸다 — 그동안 성벽을 쌓고 흩어진 형제들을 모은다', city: 'lachish' },
      reward: { k: 20, gold: 1200 },
      outro: [['narr', '"이 밤에 여호와의 사자가 나가서 앗수르 진영에서 군사 십팔만 오천 명을 쳤으므로 아침에 일찍이 일어나 보니 다 송장이 되었더라. 이에 앗수르 왕 산헤립이 떠나 돌아가서 니느웨에 거주하더니" (왕하 19:35-36).'], ['히스기야', '저는 편지를 펴 놓았을 뿐입니다. 싸우신 이는 만군의 여호와이십니다. 천하 만국이 알게 하소서.'], ['이사야', '"내가 나와 나의 종 다윗을 위하여 이 성을 보호하여 구원하리라" (왕하 19:34). 그러나 왕이여, 바벨론을 조심하십시오.']] },
    { title: '바벨론을 향한 말씀', ref: '왕하 22–25장; 렘 29:10-14; 50–51장; 애 3:22-23',
      intro: [
        ['narr', '므낫세의 긴 세월이 지나고 여덟 살 요시야가 왕이 되었다. 성전에서 율법책이 발견되었고, 온 백성이 언약을 새롭게 했다. 그러나 동쪽에서는 바벨론이 니느웨를 무너뜨리고 새 강국이 되었다.'],
        ['예레미야', '"슬프도소이다 주 여호와여 보소서 나는 아이라 말할 줄을 알지 못하나이다." 그런데 그분이 제 입에 말씀을 두셨습니다. 열방과 나라들 위에, 뽑고 파괴하며 건설하고 심게 하려고 (렘 1:6, 9-10).'],
        ['word', '"바벨론이 함락되고 벨이 수치를 당하며 므로닥이 부스러지며… 이는 북쪽에서 한 나라가 나와서 그를 쳐서 그 땅으로 황폐하게 하여." (렘 50:2-3)'],
        ['narr', '성경의 역사에서는 BC 586 예루살렘이 무너지고 유다가 바벨론에 사로잡혀 갔다. 칠십 년 뒤 바사 왕 고레스가 바벨론을 무너뜨려 예레미야의 말씀을 이루었다 (단 5장; 스 1:1).'],
        ['narr', '이 게임에서는 마하나임의 군대가 그 말씀을 따라 앞서 나아간다 — 갈라진 형제의 땅 사마리아와 단, 아람의 다메섹, 앗수르의 니느웨를 지나 바벨론까지.'],
        ['@advisor', '다메섹에서 하맛과 갈그미스를 거쳐 하란으로, 하란에서 니느웨와 앗수르를 지나면 바벨론입니다. 먼 길입니다. 군량과 성벽을 먼저 챙기십시오.'],
      ],
      goal: { t: 'goal', faith: 60, text: '사마리아·단·브엘세바·다메섹·니느웨·바벨론까지 목표 7성을 차지하고 평균 신앙 60을 지킨다' },
      reward: { k: 25 },
      outro: [
        ['narr', '하나님의 군대가 바벨론 성문 앞에 섰다. 백 년 전 히스기야가 보물고를 보여 주었던 그 나라, 성전의 기구를 가져가려던 그 나라였다.'],
        ['word', '"여호와의 인자와 긍휼이 무궁하시므로 우리가 진멸되지 아니함이니이다 이것들이 아침마다 새로우니 주의 성실하심이 크시도소이다." (애 3:22-23)'],
        ['narr', '성경의 역사에서 이 말씀은 포로의 눈물 속에서 쓰였다. 무너진 예루살렘에서도 소망은 끊어지지 않았고, 칠십 년이 차자 백성은 돌아왔다 (렘 29:10; 스 1장). 이 게임의 승리는 그 소망을 미리 걸어 본 길이다.'],
        ['예레미야', '우리가 이긴 것이 아닙니다. 말씀이 이긴 것입니다. 이제 무너진 것들을 다시 세우고 심는 일이 남았습니다.'],
      ] },
  ],
};

HERO_LINES.e_divided = {
  army: [
    { // 견고한 성읍들
      intro: [
        ['narr', '{name}은(는) 세겜에서 돌아온 르호보암의 행렬 끝에서 열 지파가 떠나는 것을 보았다.'],
        ['@hero', '갈라진 형제를 칼로 붙잡을 수는 없습니다. 저는 남은 성읍의 돌을 나르겠습니다.'],
      ],
      outro: [['@hero', '성벽이 높아졌어도 마음이 낮아야 합니다. 이 돌들이 교만의 기념비가 되지 않게 하소서.']],
    },
    { // 스마라임 산의 외침
      intro: [['@hero', '나팔 소리가 들리면 저도 소리 지르겠습니다. 우리 머리가 되신 분이 앞서 가십니다.']],
      outro: [['@hero', '벧엘은 "하나님의 집"이라는 뜻입니다. 금송아지 대신 제단이 다시 서기를 기도합니다.']],
    },
    { // 갈멜산의 불
      intro: [['@hero', '머뭇거리지 않겠습니다. 여호와가 하나님이시면 끝까지 그분을 따르겠습니다.']],
      outro: [['@hero', '불도 보았고 세미한 소리도 들었습니다. 저도 무릎 꿇지 않은 칠천 명 가운데 하나이고 싶습니다.']],
    },
    { // 도단의 불말과 불병거
      intro: [['@hero', '적이 성을 에워싸도 눈을 들겠습니다. 우리와 함께한 자가 더 많습니다.']],
      outro: [['@hero', '불말과 불병거를 본 날부터 두려움이 달라졌습니다. 이 군대는 우리가 만든 군대가 아닙니다.']],
    },
    { // 히스기야의 기도
      intro: [['@hero', '랍사게의 말이 성벽을 넘어오더라도 대답하지 않겠습니다. 왕과 함께 편지를 여호와 앞에 펴겠습니다.']],
      outro: [['@hero', '아침에 일어나 보니 싸움이 끝나 있었습니다. 우리를 대신하여 싸우신 분께 영광을 돌립니다.']],
    },
    { // 바벨론을 향한 말씀
      intro: [
        ['narr', '{name}은(는) 예레미야가 아나돗의 밭 증서를 토기에 담는 것을 지켜보았다.'],
        ['@hero', '무너질 것 같은 날에도 밭을 사는 믿음을 배우겠습니다. 소망을 들고 먼 길을 가겠습니다.'],
      ],
      outro: [['@hero', '바벨론 성문 앞에서 교만하지 않겠습니다. 말씀이 이루어지는 것을 보았을 뿐입니다.']],
    },
  ],
};
