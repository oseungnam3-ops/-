// 성경 삼국지 — 시대 3: 사사 시대 (BC 1375–1050, 사사기 · 룻기 · 사무엘상 1–7장)
// 플레이어는 언제나 "마하나임 하나님의 군대"(army). 옷니엘에서 사무엘까지 사사들이 차례로 일어나 군대를 이끈다.
// 옛 'judges' 시나리오의 인물·사건·대화를 옮겨 오고, 세계 성읍(하란·갈그미스·애굽·헷·앗수르)을 더했다.
(() => {
  const ID = 'e_judges', P = 'army';

  // 시대별 성 표(ERA_CITIES)가 옛 시나리오 id('judges')로만 적혀 있으면 이 시대에도 같은 성을 보이게 한다.
  if (typeof ERA_CITIES !== 'undefined') Object.values(ERA_CITIES).forEach(l => { if (Array.isArray(l) && l.includes('judges') && !l.includes(ID)) l.push(ID); });

  // ---------- 사건 도우미 ----------
  // 사사들이 차례로 일어나고(raise), 신앙이 식으면 압제자가 돌아온다(apostasy).
  const K = {
    on: (G, cid) => !!G.city(cid),
    mine: (G, cid) => K.on(G, cid) && G.ownerOf(cid) === P,
    // 인물을 하나님의 군대에 합류시키고, lead면 지도자(군주)로 세운다
    raise: (G, name, cid, lead) => {
      if (!G.exists(P) || !G.alive(name)) return false;
      if (G.facOf(name) !== P) G.join(name, P, cid && K.mine(G, cid) ? cid : undefined);
      if (lead) G.setRuler(P, name);
      return true;
    },
    faith: G => G.avgFaith(P),
    faithAll: (G, d, loy) => { if (G.exists(P)) G.eachCity(P, c => { c.faith += d; if (loy) c.loy += loy; }); },
    cut: (G, f, k, only) => { if (G.exists(f)) G.eachCity(f, c => { if (!only || only.includes(c.id)) c.soldiers = Math.floor(c.soldiers * k); }); },
    stat: (G, name, k, d) => { const o = G.o(name); if (o && o.alive) o[k] = Math.max(0, Math.min(100, o[k] + d)); },
    gold: (G, d) => { const F = G.fac(P); F.gold = Math.max(0, F.gold + d); },
    food: (G, d) => { const F = G.fac(P); F.food = Math.max(0, F.food + d); },
    next: (G, n) => { G.flags.jNext = G.turn + n; },
    after: (G, id) => !!G.done[id] && G.turn >= (G.flags.jNext || 0) && G.exists(P),
    // 하나님의 군대 본거지 (도읍을 잃었으면 병력이 가장 많은 성)
    home: G => {
      if (!G.exists(P)) return null;
      const cap = G.fac(P).capital; if (K.mine(G, cap)) return G.city(cap);
      let best = null; G.eachCity(P, c => { if (!best || c.soldiers > best.soldiers) best = c; }); return best;
    },
    add: (G, n) => { const c = K.home(G); if (c) c.soldiers += n; return !!c; },
    // 지금 시대의 압제자: 아직 구원 사건이 일어나지 않은 첫 세력
    oppressor: G => {
      const seq = [['aram', 'cushan'], ['moab', 'ehud'], ['canaan', 'deborah'], ['midian', 'gideon300'], ['ammon', 'jephthah'], ['philistia', 'mizpah']];
      const live = seq.filter(([f]) => G.exists(f) && G.cityCount(f) > 0);
      const cur = live.find(([, e]) => !G.done[e]) || live[live.length - 1];
      return cur ? cur[0] : null;
    },
    // 압제자와 맞닿은 군대의 성 가운데 가장 약한 곳 (없으면 가장 약한 성)
    target: (G, f) => {
      if (!f || !G.exists(P)) return null;
      const mine = []; G.eachCity(P, c => mine.push(c));
      const near = mine.filter(c => ROADS.some(([a, b]) => K.on(G, a) && K.on(G, b) && ((a === c.id && G.ownerOf(b) === f) || (b === c.id && G.ownerOf(a) === f))));
      const pool = (near.length ? near : mine).sort((a, b) => a.soldiers - b.soldiers);
      return pool.length ? pool[0].id : null;
    },
    // 성 하나를 군대에 넘긴다 (그 성의 적 장수는 제 도읍으로 물러난다)
    give: (G, cid, sold, loy) => {
      if (!K.on(G, cid) || K.mine(G, cid) || !G.exists(P)) return false;
      const c = G.city(cid), prev = c.owner;
      if (prev && G.exists(prev)) {
        const back = G.fac(prev).capital !== cid ? G.fac(prev).capital : null;
        if (!back) return false; // 적의 도읍은 사건으로 넘기지 않는다
        SCENARIOS.find(s => s.id === ID).officers.forEach(r => { const o = G.o(r[0]); if (o && o.alive && o.fac === prev && o.city === cid) o.city = back; });
      }
      c.owner = P; c.soldiers = Math.max(sold, Math.floor(c.soldiers * 0.3)); c.loy = loy || 60; c.faith += 10;
      return true;
    },
    // 다곤 신전 (삿 16:21-30)
    dagon: G => {
      G.kill('삼손'); G.kill('가사 방백');
      K.cut(G, 'philistia', 0.6, ['gaza']); K.cut(G, 'philistia', 0.85);
      G.buff('philistia', 'atk', 3, -0.2); K.faithAll(G, 5);
      G.flags.dagon = true; K.next(G, 4); G.kingdom(2, '삼손의 마지막 기도');
      return '들릴라가 삼손의 머리털 일곱 가닥을 밀자 힘이 떠났고, 그는 여호와께서 떠나신 줄을 깨닫지 못했다(16:19-20). 블레셋 사람들이 그의 눈을 빼고 가사로 끌고 가 옥에서 맷돌을 돌리게 했다. 그러나 머리털이 다시 자라기 시작했다. 다곤의 큰 제사 날, 삼손이 두 기둥을 붙들고 기도했다. "주 여호와여 구하옵나니 나를 생각하옵소서, 이번만 나를 강하게 하사"(16:28). 신전이 무너져 방백들과 온 백성이 깔렸다. 삼손과 가사 방백이 죽었다. 가사의 블레셋 군 40%, 블레셋 모든 성 15% 궤멸, 블레셋 3턴 동안 공격력 -20%, 신앙 +5.';
    },
  };

  SCENARIOS.push({
    id: ID,
    title: '사사 시대',
    year: 1375,
    ref: '사사기 · 룻기 · 사무엘상 1–7장',
    intro: '여호수아와 그 세대가 다 조상들에게 돌아가고, 여호와를 알지 못하는 다른 세대가 일어났다. 이스라엘이 바알들을 섬기자 여호와께서 그들을 노략하는 자의 손에 넘기셨고, 그들이 부르짖을 때마다 사사들을 세워 구원하셨다 (삿 2:10-19). 옷니엘에서 사무엘까지 삼백 년이 넘는 이야기를 한 시대로 압축했다. 실로의 회막에서 마하나임 하나님의 군대가 일어난다 — 야곱이 마하나임에서 본 "하나님의 군대"(창 32:1-2)처럼, 이 게임에서는 각 시대 믿음의 사람들이 이끄는 군대다. 사사들은 사건을 따라 차례로 일어난다. "그 때에는 이스라엘에 왕이 없으므로 사람이 각기 자기의 소견에 옳은 대로 행하였더라" (삿 21:25).',
    words: ['mahanaim', 'fear_not', 'gideon_torch', 'lord_of_hosts'],
    factions: [
      { id: P, name: '하나님의 군대', ruler: '옷니엘', color: '#e2b04a', capital: 'shiloh', gold: 700, food: 10000, aggr: 0.35,
        desc: '마하나임 하나님의 군대. 왕도 상비군도 없이 느슨하게 묶인 열두 지파가 실로의 회막을 중심으로 모였다. 구원할 때마다 여호와께서 사사를 세우시지만, 사사가 죽으면 백성은 다시 돌아선다 (삿 2:18-19). 사사들 대부분은 아직 재야에 있고, 사건을 따라 차례로 군대를 이끈다.',
        cities: { shiloh: 3000, shechem: 2200, bethel: 1800, hebron: 1800, bethlehem: 1200, mahanaim: 1500, ramoth: 1200 } },
      { id: 'aram', name: '아람 나하라임', ruler: '구산 리사다임', color: '#6f8fd8', capital: 'haran', gold: 1200, food: 8000, aggr: 0.4,
        desc: '메소보다미아(아람 나하라임, 유브라데 강 상류의 "두 강 사이 아람") 왕 구산 리사다임. 이스라엘이 그를 팔 년 동안 섬겼다 (삿 3:8). 성경의 역사에서 그의 정체는 밝혀지지 않았다(이 무렵 그 땅을 다스린 미탄니 계열의 왕으로 보는 견해 등이 있다). 이 게임에서는 하란을 도읍으로, 다메섹을 전진 기지로 삼았다.',
        cities: { haran: 5000, carchemish: 3500, damascus: 4500 } },
      { id: 'moab', name: '모압', ruler: '에글론', color: '#9a6fbf', capital: 'kirhareseth', gold: 800, food: 6000, aggr: 0.45,
        desc: '에글론이 암몬과 아말렉을 모아 종려나무 성읍(여리고)을 점령하고 이스라엘을 열여덟 해 동안 섬기게 했다 (삿 3:12-14).',
        cities: { kirhareseth: 3500, dibon: 2500, jericho: 4000 } },
      { id: 'amalek', name: '아말렉', ruler: '아말렉 족장', color: '#a0876a', capital: 'kadesh', gold: 600, food: 5000, aggr: 0.35,
        desc: '남방 광야의 유목민. 에글론과 함께(삿 3:13), 또 미디안과 함께(6:3) 올라와 이스라엘을 쳤다.',
        cities: { kadesh: 3000, beersheba: 3000 } },
      { id: 'canaan', name: '가나안 (하솔)', ruler: '야빈', color: '#cf6d9c', capital: 'hazor', gold: 1200, food: 8000, aggr: 0.4,
        desc: '하솔에서 다스리는 가나안 왕 야빈. 철 병거 구백 대로 이십 년 동안 이스라엘을 심히 학대했다 (삿 4:2-3). 여호수아가 불태운 하솔(수 11:10-13)이 다시 일어섰다.',
        cities: { hazor: 6000, megiddo: 4500, bethshean: 3000 } },
      { id: 'midian', name: '미디안', ruler: '세바', color: '#b98c4e', capital: 'midian', gold: 900, food: 9000, aggr: 0.45,
        desc: '미디안과 아말렉과 동방 사람들. 약대와 함께 메뚜기 떼처럼 올라와 가사에 이르기까지 토지 소산을 멸했다 (삿 6:3-5). 이 게임에서는 요단 동편 에드레이(바산)와 에돔 길의 보스라를 진영으로 삼았다.',
        cities: { midian: 4500, bozrah: 3000, edrei: 3500 } },
      { id: 'ammon', name: '암몬', ruler: '암몬 왕', color: '#5ea67c', capital: 'rabbah', gold: 700, food: 6000, aggr: 0.4,
        desc: '요단 저편 길르앗을 열여덟 해 동안 억압하고, 요단을 건너 유다와 베냐민과 에브라임과도 싸웠다 (삿 10:8-9). 암몬 왕은 "아르논에서 얍복까지 내 땅"이라며 헤스본을 요구했다 (11:13, 26).',
        cities: { rabbah: 5000, heshbon: 2500 } },
      { id: 'philistia', name: '블레셋', ruler: '가사 방백', color: '#c9573f', capital: 'gaza', gold: 1400, food: 9000, aggr: 0.25,
        desc: '해안의 다섯 방백(가사·가드·아스돗·에그론·아스글론, 수 13:3). 시대의 끝에 사십 년 동안 이스라엘을 다스린다 (삿 13:1). 가사와 아스돗에 다곤 신전이 있다 (삿 16:23; 삼상 5:2).',
        cities: { gaza: 5000, gath: 5000, ekron: 4000, ashdod: 4500, ashkelon: 3000, joppa: 2000 } },
      { id: 'canaan_jebus', name: '여부스', ruler: '여부스 왕', color: '#8f86a8', capital: 'jerusalem', gold: 600, food: 4000, aggr: 0.05,
        desc: '베냐민 자손이 쫓아내지 못한 여부스 사람의 산성 (삿 1:21). "이방 사람의 성읍"이라 불렸다 (삿 19:12).',
        cities: { jerusalem: 3000 } },
      { id: 'tyre', name: '시돈', ruler: '시돈 왕', color: '#3fb3b5', capital: 'sidon', gold: 2000, food: 5000, aggr: 0.05,
        desc: '시돈과 두로, 해안의 상인 나라. 싸움보다 장사를 좋아하지만 이스라엘을 압제한 적도 있다 (삿 10:12; 18:7).',
        cities: { sidon: 4000, tyre: 3500 } },
      { id: 'egypt', name: '애굽', ruler: '아멘호텝 3세', color: '#d98a3a', capital: 'thebes', gold: 4000, food: 16000, aggr: 0.04,
        desc: '신왕국 18왕조의 전성기. 가나안의 성읍 왕들은 바로의 봉신이었다(아마르나 편지). 사사기에는 애굽의 이름이 거의 나오지 않는다 — 이 게임에서는 멀리서 지켜보는 세계 강국이다.',
        cities: { thebes: 7000, memphis: 6000, tanis: 4000, goshen: 2500 } },
      { id: 'hittite', name: '헷', ruler: '수필룰리우마 1세', color: '#7d8a99', capital: 'hattusa', gold: 3000, food: 12000, aggr: 0.04,
        desc: '아나돌루 고원의 헷 제국. 수필룰리우마 1세(BC 14세기 중엽)가 미탄니를 꺾고 수리아까지 내려왔다. 성경의 "헷 족속의 온 땅"(수 1:4).',
        cities: { hattusa: 6000, tarsus: 3000 } },
      { id: 'assyria', name: '앗수르', ruler: '앗수르우발릿 1세', color: '#8a63c9', capital: 'ashur', gold: 2500, food: 10000, aggr: 0.04,
        desc: '중기 앗수르. 앗수르우발릿 1세(BC 1363–1328 무렵)가 미탄니에서 벗어나 바로에게 "형제"라 편지를 보냈다. 훗날의 제국은 아직 먼 이야기다.',
        cities: { ashur: 5000, nineveh: 4000 } },
    ],
    // 단 = 아직 단 지파가 차지하지 못한 평온한 성 라이스 (삿 18:7, 27-29). 바락과 야엘이 이 근처(게데스·사아난님)에 있다.
    neutral: { dan: 1000, lachish: 2500, sinai: 500, hamath: 2500, babylon: 4000, ur: 2500, susa: 3500, kittim: 1800 },
    hide: ['alexandria', 'antioch', 'samaria', 'pella', 'rome', 'athens', 'corinth', 'sardis', 'ephesus', 'persepolis', 'modein', 'emmaus', 'gezer'],
    officers: [
      ['옷니엘', 82, 68, 62, 72, 90, P, 'shiloh', '갈렙의 아우 그나스의 아들. 여호와의 영이 임하여 첫 사사가 되었다.', '삿 3:9-11'],
      ['비느하스', 55, 72, 60, 65, 95, P, 'shiloh', '엘르아살의 아들, 아론의 손자인 대제사장. 그 때에 언약궤 앞에 모시고 섰다.', '삿 20:27-28'],
      ['악사', 15, 75, 72, 80, 82, P, 'hebron', '갈렙의 딸, 옷니엘의 아내. "윗샘과 아랫샘"을 구한 지혜로운 여인.', '삿 1:12-15'],
      ['요아스', 40, 55, 60, 60, 35, P, 'shechem', '므낫세 오브라의 아비에셀 사람, 기드온의 아버지. 그의 집에 바알 제단이 있었다.', '삿 6:11, 25-32'],
      ['돌라', 60, 62, 72, 62, 78, P, 'shechem', '잇사갈 사람 부아의 아들. 에브라임 산지 사밀에 살며 이십삼 년 동안 사사로 있었다.', '삿 10:1-2'],
      ['엘론', 58, 58, 68, 60, 72, P, 'shiloh', '스불론 사람. 십 년 동안 이스라엘의 사사로 있었다.', '삿 12:11-12'],
      ['압돈', 52, 60, 74, 70, 70, P, 'bethel', '비라돈 사람 힐렐의 아들. 아들 사십과 손자 삼십이 나귀 칠십을 탔다.', '삿 12:13-15'],
      ['입산', 50, 60, 72, 75, 70, P, 'bethlehem', '베들레헴 사람. 아들 삼십과 딸 삼십을 두었다.', '삿 12:8-10'],
      ['야일', 62, 55, 70, 68, 70, P, 'mahanaim', '길르앗 사람. 아들 삼십이 어린 나귀 삼십을 타고 성읍 삼십을 다스렸다.', '삿 10:3-5'],
      ['에훗', 86, 80, 55, 70, 85, null, 'bethel', '베냐민 사람 게라의 아들, 왼손잡이. 모압 왕에게 조공을 바치러 가는 사자였다.', '삿 3:15'],
      ['삼갈', 90, 35, 30, 55, 75, null, 'hebron', '아낫의 아들. 소 모는 막대기로 블레셋 사람 육백 명을 죽였다.', '삿 3:31'],
      ['드보라', 20, 92, 90, 95, 98, null, 'bethel', '랍비돗의 아내, 여선지자. 라마와 벧엘 사이 종려나무 아래에서 이스라엘을 재판했다. "이스라엘의 어머니".', '삿 4:4-5; 5:7'],
      ['바락', 84, 60, 55, 70, 75, null, 'dan', '납달리 게데스 사람 아비노암의 아들. 믿음의 사람들 가운데 이름이 올랐다.', '삿 4:6; 히 11:32'],
      ['야엘', 45, 80, 40, 70, 80, null, 'dan', '겐 사람 헤벨의 아내. "장막에 거한 여인들보다 더욱 복을 받을 것이로다".', '삿 4:17-22; 5:24'],
      ['기드온', 80, 75, 65, 82, 72, null, 'shechem', '요아스의 아들. 미디안을 피해 포도주 틀에서 밀을 타작하다가 "큰 용사여" 하는 부르심을 받았다.', '삿 6:11-12'],
      ['부라', 60, 45, 30, 50, 70, null, 'shechem', '기드온의 부하. 밤에 기드온과 함께 미디안 진영으로 내려갔다.', '삿 7:10-11'],
      ['입다', 90, 70, 55, 72, 70, null, 'ramoth', '길르앗 사람, 큰 용사. 기생의 아들이라 형제들에게 쫓겨나 돕 땅에 살았다.', '삿 11:1-3'],
      ['나오미', 10, 70, 55, 75, 85, null, 'dibon', '베들레헴 사람 엘리멜렉의 아내. 흉년에 모압으로 갔다가 남편과 두 아들을 잃었다.', '룻 1:1-5, 20-21'],
      ['룻', 20, 70, 50, 88, 92, null, 'dibon', '모압 여인, 나오미의 며느리. "어머니의 하나님이 나의 하나님이 되시리니". 다윗의 증조모.', '룻 1:16; 4:13-17; 마 1:5'],
      ['보아스', 55, 78, 80, 82, 90, null, 'bethlehem', '베들레헴의 유력한 자, 엘리멜렉의 친족. 기업 무를 자로 룻을 아내로 맞았다.', '룻 2:1; 4:9-10'],
      ['마노아', 25, 55, 55, 60, 85, null, 'bethlehem', '소라 땅 단 지파 사람, 삼손의 아버지. 여호와의 사자에게 아이 기를 법을 물었다.', '삿 13:2, 8-12'],
      ['삼손', 99, 40, 25, 65, 70, null, 'bethlehem', '나실인으로 구별된 소라 사람. 여호와의 영이 임하면 누구도 그를 막지 못했다.', '삿 13:24-25; 15:14-16'],
      ['엘리', 20, 70, 62, 60, 75, null, 'shiloh', '실로의 제사장, 사십 년 동안 이스라엘의 사사였다. 아들 홉니와 비느하스를 바로잡지 못했다.', '삼상 1:9; 2:22-25; 4:18'],
      ['한나', 10, 72, 50, 80, 97, null, 'shiloh', '에브라임 라마다임소빔 사람 엘가나의 아내. 실로에서 마음을 쏟아 기도하여 사무엘을 낳았다.', '삼상 1:10-20; 2:1-10'],
      ['사무엘', 20, 95, 90, 92, 99, null, 'shiloh', '한나의 아들. 어려서 실로에서 여호와를 섬기다 부르심을 받았다. 마지막 사사이자 선지자.', '삼상 3:1-21; 7:15'],
      ['구산 리사다임', 78, 65, 62, 50, 10, 'aram', 'haran', '메소보다미아(아람 나하라임) 왕. 이스라엘이 팔 년 동안 그를 섬겼다. "리사다임"은 "두 배로 악한"이라는 뜻으로 읽힌다.', '삿 3:8-10'],
      ['아람 장수', 70, 50, 45, 45, 10, 'aram', 'damascus', '구산 리사다임을 섬기는 다메섹의 아람 장수.', ''],
      ['에글론', 55, 60, 68, 50, 10, 'moab', 'jericho', '모압 왕, 심히 비둔한 자. 종려나무 성읍의 서늘한 다락방에 앉아 조공을 받았다.', '삿 3:12-17, 20'],
      ['모압 장수', 68, 45, 40, 40, 10, 'moab', 'kirhareseth', '요단 나루에서 에훗에게 막힌 모압의 장수.', '삿 3:28-29'],
      ['아말렉 족장', 70, 50, 45, 45, 5, 'amalek', 'kadesh', '남방 광야 아말렉의 족장.', '삿 3:13; 6:3'],
      ['아말렉 장수', 72, 40, 30, 30, 5, 'amalek', 'beersheba', '미디안과 함께 올라온 아말렉 군의 장수.', '삿 6:3, 33'],
      ['야빈', 75, 72, 72, 60, 10, 'canaan', 'hazor', '하솔에서 다스린 가나안 왕. 철 병거 구백 대를 가졌다.', '삿 4:2-3, 23-24'],
      ['시스라', 90, 70, 50, 60, 8, 'canaan', 'megiddo', '하로셋학고임에 사는 야빈의 군대 장관. 병거를 기손 강으로 모았다.', '삿 4:2, 7, 13'],
      ['세바', 78, 65, 62, 58, 8, 'midian', 'midian', '미디안의 두 왕 가운데 하나. 다볼에서 기드온의 형제들을 죽였다.', '삿 8:5, 18-21'],
      ['살문나', 76, 60, 58, 55, 8, 'midian', 'bozrah', '미디안의 두 왕 가운데 하나. 갈골에 군대 만 오천과 함께 있었다.', '삿 8:10-12'],
      ['오렙', 80, 50, 40, 40, 5, 'midian', 'edrei', '미디안의 방백. 오렙 바위에서 죽었다.', '삿 7:25'],
      ['스엡', 78, 50, 40, 40, 5, 'midian', 'edrei', '미디안의 방백. 스엡 포도주 틀에서 죽었다.', '삿 7:25'],
      ['암몬 왕', 65, 58, 55, 45, 10, 'ammon', 'rabbah', '"이스라엘이 애굽에서 올라올 때에 내 땅을 점령했으니 돌려 달라" 한 왕. 성경은 그 이름을 밝히지 않는다.', '삿 11:12-28'],
      ['암몬 장수', 74, 40, 30, 30, 5, 'ammon', 'heshbon', '길르앗에 진을 친 암몬 군의 장수.', '삿 10:17'],
      ['가사 방백', 70, 60, 62, 50, 5, 'philistia', 'gaza', '블레셋 다섯 방백 가운데 하나. 다곤 신전의 큰 제사를 주관했다.', '삿 3:3; 16:23'],
      ['가드 방백', 74, 50, 50, 45, 5, 'philistia', 'gath', '블레셋 다섯 방백 가운데 하나.', '수 13:3; 삼상 6:17'],
      ['아스돗 방백', 68, 62, 60, 45, 5, 'philistia', 'ashdod', '다곤 신전이 있는 아스돗의 방백. 빼앗은 언약궤를 다곤 곁에 두었다.', '삼상 5:1-7'],
      ['에그론 방백', 66, 60, 58, 45, 5, 'philistia', 'ekron', '에그론의 방백. "이스라엘 신의 궤를 보내어 본처로 돌아가게 하라".', '삼상 5:10-11'],
      ['들릴라', 10, 85, 50, 90, 5, 'philistia', 'ashkelon', '소렉 골짜기의 여인. 삼손의 힘이 어디에 있는지 캐물었다.', '삿 16:4-20'],
      ['여부스 왕', 60, 60, 65, 50, 10, 'canaan_jebus', 'jerusalem', '베냐민 자손이 쫓아내지 못한 여부스 사람의 우두머리.', '삿 1:21; 19:10-12'],
      ['시돈 왕', 50, 75, 85, 75, 20, 'tyre', 'sidon', '바다의 상인 왕. 성경은 이 시대 시돈 왕의 이름을 밝히지 않는다.', '삿 10:12'],
      ['아멘호텝 3세', 55, 80, 88, 80, 10, 'egypt', 'thebes', '18왕조의 바로(BC 1390–1352 무렵). 가나안 봉신 왕들의 편지(아마르나 편지)를 받았다.', '역사 자료: 아마르나 편지'],
      ['수필룰리우마 1세', 82, 85, 80, 70, 10, 'hittite', 'hattusa', '헷 제국의 대왕(BC 14세기 중엽). 미탄니를 무너뜨리고 갈그미스까지 차지했다.', '역사 자료: 헷 왕실 기록'],
      ['앗수르우발릿 1세', 72, 78, 80, 62, 10, 'assyria', 'ashur', '중기 앗수르의 왕(BC 1363–1328 무렵). 앗수르를 강국의 반열에 올렸다.', '역사 자료: 아마르나 편지 EA 15-16'],
    ],
    rel: [[P, 'tyre', 40], [P, 'egypt', 35], ['moab', 'ammon', 60], ['moab', 'amalek', 55], ['midian', 'amalek', 70], ['midian', 'ammon', 45], ['philistia', 'ammon', 50], ['egypt', 'canaan', 50],
      [P, 'aram', 10], [P, 'moab', 15], [P, 'canaan', 10], [P, 'midian', 10], [P, 'ammon', 15], [P, 'philistia', 25], [P, 'amalek', 10]],
    goals: { [P]: ['shiloh', 'bethel', 'shechem', 'jericho', 'hebron', 'bethlehem', 'mahanaim', 'ramoth', 'heshbon', 'megiddo', 'hazor', 'ekron', 'gath', 'damascus', 'haran'] },
    goalText: { [P]: '압제자마다 이스라엘을 건진다. 모압의 여리고, 가나안의 하솔·므깃도, 암몬의 헤스본, 블레셋의 에그론·가드(삼상 7:14)를 되찾고, 첫 압제자 구산 리사다임의 다메섹과 하란까지 이른다 — 성경의 역사에서 사사들은 가나안 밖으로 나가지 않았다. 이 게임에서는 하나님의 군대가 메소보다미아까지 간다. 15성.' },
  });

  // ---------- 역사 사건 ----------
  EVENTS[ID] = [
    { id: 'bochim', who: P, auto: 0,
      cond: G => G.turn >= 1 && G.exists(P),
      title: '보김 — 우는 자들', ref: '삿 2:1-5; 수 24:26',
      text: '여호와의 사자가 길갈에서 보김으로 올라와 말했다. "내가 너희를 애굽에서 올라오게 하였으며… 너희는 이 땅의 주민과 언약을 맺지 말며 그들의 제단들을 헐라 하였거늘 너희가 내 목소리를 듣지 아니하였도다." 백성이 소리를 높여 울었고, 그곳 이름을 보김(우는 자들)이라 하였다. 여호수아가 세겜에서 율법책에 기록한 언약의 말씀이 아직 회막에 있다.',
      choices: [
        { label: '울음으로 끝내지 않고, 여호수아의 율법책을 다시 펴서 백성에게 읽힌다', run: G => {
          G.item(P, 'torah_scroll', 1); K.faithAll(G, 8); G.kingdom(4, '율법책을 다시 펴다');
          return '백성이 거기서 여호와께 제사를 드렸다(2:5). 여호수아의 율법책을 얻었다. 신앙 +8.'; } },
        { label: '제사만 드리고 돌아간다', run: G => {
          K.faithAll(G, 3); K.food(G, 1000);
          return '제사를 드리고 각자의 기업으로 돌아갔다. 신앙 +3, 식량 +1000. "그 세대의 사람도 다 그 조상들에게로 돌아갔고…"(2:10).'; } },
      ] },
    { id: 'cushan', who: P, auto: 0,
      cond: G => G.turn >= 2 && G.exists(P),
      title: '구산 리사다임과 옷니엘', ref: '삿 3:7-11',
      text: '이스라엘 자손이 여호와 앞에 악을 행하여 바알들과 아세라들을 섬겼다. 여호와께서 그들을 메소보다미아 왕 구산 리사다임의 손에 파셨고, 이스라엘이 팔 년 동안 그를 섬겼다. 이스라엘 자손이 여호와께 부르짖자 여호와께서 갈렙의 조카 옷니엘을 구원자로 세우셨다.',
      choices: [
        { label: '여호와께 부르짖고, 영이 임한 옷니엘을 따라 출전한다', ok: G => G.alive('옷니엘') && G.facOf('옷니엘') === P, run: G => {
          G.buff(P, 'atk', 4, 0.25); K.cut(G, 'aram', 0.7);
          K.faithAll(G, 10); K.stat(G, '옷니엘', 'fai', 5);
          G.flags.otnielWon = true; K.next(G, 3); G.kingdom(5, '부르짖음과 구원');
          return '여호와의 영이 옷니엘에게 임하였다. 4턴 동안 공격력 +25%, 아람 병력 30% 궤멸, 신앙 +10. "그 땅이 평온한 지 사십 년에"(3:11).'; } },
        { label: '구산 리사다임에게 조공을 바치고 평안을 산다', run: G => {
          K.gold(G, -200); G.rel(P, 'aram', 25); K.faithAll(G, -10);
          K.next(G, 3); G.kingdom(-3, '압제자를 섬김');
          return '금 -200, 아람과의 관계 +25. 그러나 신앙 -10. 백성은 여전히 우상 곁에 있다.'; } },
      ] },
    { id: 'amarna', who: P, auto: 0,
      cond: G => G.turn >= 3 && G.done.cushan && G.exists(P) && G.exists('egypt'),
      title: '바로에게 보낸 편지들', ref: '역사 자료: 아마르나 편지 (BC 14세기)',
      text: '애굽 아마르나에서 발견된 점토판 편지들에는 예루살렘·세겜·므깃도·하솔 같은 가나안 성읍의 왕들이 바로에게 "하비루(아피루) 사람들이 왕의 땅을 빼앗는다, 군사를 보내 달라"고 호소한 글이 남아 있다. 하비루를 성경의 히브리 사람과 같은 이들로 보는 견해도 있으나, 여러 민족의 떠돌이 무리를 가리키는 말이라는 견해가 더 많다. 지금 가나안 왕들이 바로에게 사절을 보내고 있다.',
      choices: [
        { label: '"말과 병거를 의지하지 않는다" — 바로 대신 여호와를 의지한다', run: G => {
          K.faithAll(G, 5); G.eachCity(P, c => { c.def += 3; }); G.kingdom(3, '여호와만 의지함');
          return '신앙 +5, 모든 성 성벽 +3. "어떤 사람은 병거, 어떤 사람은 말을 의지하나 우리는 여호와 우리 하나님의 이름을 자랑하리로다"(시 20:7).'; } },
        { label: '우리도 바로에게 예물을 보내 화친한다', run: G => {
          K.gold(G, -150); G.rel(P, 'egypt', 25); G.rel('egypt', 'canaan', -15);
          return '금 -150, 애굽과의 관계 +25. 바로는 멀리 있고 대답은 더디다. 애굽과 가나안의 관계 -15.'; } },
      ] },
    { id: 'ehud', who: P, auto: 0,
      cond: G => K.after(G, 'cushan') && G.turn >= 5,
      title: '왼손잡이 에훗과 에글론', ref: '삿 3:12-30',
      text: '그나스의 아들 옷니엘이 죽었다. 이스라엘이 다시 악을 행하자 모압 왕 에글론이 암몬과 아말렉을 모아 종려나무 성읍(여리고)을 점령했고, 이스라엘이 열여덟 해 동안 그를 섬겼다. 백성이 부르짖자 여호와께서 베냐민 사람 왼손잡이 에훗을 세우셨다. 그가 한 규빗 되는 양날 칼을 오른쪽 허벅지 옷 속에 차고 조공을 바치러 간다.',
      choices: [
        { label: '에훗이 "왕께 은밀한 일을 아뢰려 하나이다" 하고 홀로 들어간다', ok: G => G.alive('에훗') && G.facOf('에훗') !== 'moab', run: G => {
          G.kill('옷니엘'); K.raise(G, '에훗', 'bethel', true);
          const eglon = G.alive('에글론'); G.kill('에글론');
          G.buff(P, 'atk', 4, 0.3); K.cut(G, 'moab', 0.7); K.cut(G, 'moab', 0.8, ['jericho']);
          G.item(P, 'trumpet', 1); K.faithAll(G, 8);
          K.next(G, 4); G.kingdom(6, '에훗의 구원');
          return (eglon ? '에훗이 에글론을 치고 다락문을 잠근 채 빠져나왔다. ' : '') + '에훗이 에브라임 산지에서 나팔을 불어 요단 나루를 막았다. 옷니엘이 세상을 떠나고 에훗이 사사로 섰다. 4턴 동안 공격력 +30%, 모압 병력 30% 궤멸(여리고는 더), 양각 나팔을 얻었다. 신앙 +8. "그 땅이 팔십 년 동안 평온하였더라"(3:30).'; } },
        { label: '조공만 바치고 돌아온다', run: G => {
          G.kill('옷니엘'); K.gold(G, -200); G.rel(P, 'moab', 20);
          K.faithAll(G, -5, -5); K.raise(G, '에훗', 'bethel', true);
          K.next(G, 4); G.kingdom(-3, '모압을 섬김');
          return '옷니엘이 세상을 떠났다. 금 -200, 모압과의 관계 +20, 신앙·민심 -5. 에훗이 군대를 맡았지만 모압의 압제는 계속된다.'; } },
      ] },
    { id: 'shamgar', who: P, auto: 0,
      cond: G => K.after(G, 'ehud'),
      title: '소 모는 막대기', ref: '삿 3:31; 5:6',
      text: '에훗 후에 아낫의 아들 삼갈이 있었다. 해안의 블레셋 사람들이 산지로 올라오자, 그가 소 모는 막대기로 블레셋 사람 육백 명을 죽였고 그도 이스라엘을 구원하였다. 그러나 "아낫의 아들 삼갈의 날에 대로가 비었고 길의 행인들은 오솔길로 다녔다"(5:6).',
      choices: [
        { label: '삼갈을 불러 남쪽 길을 지키게 한다', run: G => {
          K.raise(G, '삼갈', 'hebron'); K.cut(G, 'philistia', 0.85, ['gath', 'ekron']);
          if (K.mine(G, 'hebron')) G.city('hebron').soldiers += 600;
          K.next(G, 2); G.kingdom(2, '삼갈의 막대기');
          return '삼갈이 합류했다. 가드·에그론의 블레셋 군 15% 궤멸, 헤브론 병력 +600. 칼이 없어도 여호와께서 쓰시면 막대기도 무기다.'; } },
      ] },
    { id: 'deborah', who: P, auto: 0,
      cond: G => K.after(G, 'shamgar'),
      title: '드보라와 바락, 다볼 산', ref: '삿 4–5장',
      text: '에훗이 죽은 뒤 하솔 왕 야빈이 철 병거 구백 대로 이십 년 동안 이스라엘을 심히 학대했다. 그 때 랍비돗의 아내 여선지자 드보라가 종려나무 아래에서 이스라엘을 재판하고 있었다. 그가 바락을 불러 말했다. "너는 납달리와 스불론 자손 만 명을 거느리고 다볼 산으로 가라. 내가 시스라와 그의 병거들을 기손 강으로 이끌어 네 손에 넘겨 주리라."',
      choices: [
        { label: '"당신이 나와 함께 가면 나도 가려니와" — 드보라와 함께 다볼 산으로 오른다', run: G => {
          G.kill('에훗'); K.raise(G, '드보라', 'bethel', true); K.raise(G, '바락'); K.raise(G, '야엘');
          const sis = G.alive('시스라'); G.kill('시스라');
          K.cut(G, 'canaan', 0.6, ['megiddo', 'hazor']); K.cut(G, 'canaan', 0.8, ['bethshean']);
          G.buff(P, 'atk', 4, 0.3); G.buff('canaan', 'atk', 3, -0.2); K.faithAll(G, 10);
          G.flags.deborahSong = true; K.next(G, 5); G.kingdom(8, '드보라의 노래');
          return '"별들이 하늘에서부터 싸우되 기손 강은 그 무리를 표류시켰으니"(5:20-21). 비에 불은 기손 강이 병거를 삼켜 므깃도·하솔의 가나안 군 40% 궤멸' + (sis ? ', 도망한 시스라는 겐 사람 헤벨의 아내 야엘의 장막에서 죽었다' : '') + '. 에훗이 세상을 떠나고 드보라가 사사로 섰다. 바락·야엘 합류. 4턴 동안 공격력 +30%, 가나안 3턴 동안 -20%, 신앙 +10.'; } },
        { label: '철 병거 구백 대가 두려워 산지에 머문다', run: G => {
          G.kill('에훗'); K.raise(G, '드보라', 'bethel', true);
          G.buff('canaan', 'atk', 3, 0.2); K.faithAll(G, -5, -5);
          K.next(G, 5); G.kingdom(-3, '병거를 두려워함');
          return '에훗이 세상을 떠났다. 드보라가 군대를 맡았지만 바락은 게데스에 남았다. 가나안 3턴 동안 공격력 +20%, 신앙·민심 -5. "마을 사람들이 그쳤으니"(5:7).'; } },
      ] },
    { id: 'gideonCall', who: P, auto: 0,
      cond: G => K.after(G, 'deborah'),
      title: '큰 용사여, 여호와께서 너와 함께 계시도다', ref: '삿 6장',
      text: '이스라엘이 또 악을 행하자 미디안과 아말렉과 동방 사람들이 약대와 함께 메뚜기 떼처럼 올라와 토지 소산을 멸했다. 기드온이 미디안을 피해 포도주 틀에서 밀을 타작할 때 여호와의 사자가 나타났다. "큰 용사여, 여호와께서 너와 함께 계시도다." 기드온이 두려워하자 말씀하셨다. "너는 안심하라 두려워하지 말라 죽지 아니하리라"(6:23). 그날 밤 말씀이 임했다. "네 아버지의 바알 제단을 헐며 그 곁의 아세라 상을 찍으라."',
      choices: [
        { label: '밤에 바알 제단을 헐고 여호와의 제단을 쌓는다', run: G => {
          G.kill('드보라'); G.kill('바락'); K.raise(G, '기드온', 'shechem'); K.stat(G, '기드온', 'fai', 15); K.stat(G, '요아스', 'fai', 30);
          K.faithAll(G, 15); if (K.mine(G, 'shechem')) G.city('shechem').loy -= 10;
          G.flags.gideonCalled = true; G.flags.jerubbaal = true; K.next(G, 3); G.kingdom(6, '바알 제단을 헐다');
          return '성읍 사람들이 기드온을 죽이려 하자 요아스가 말했다. "바알이 신일진대 그의 제단을 파괴하였은즉 그가 자신을 위해 다툴 것이니라." 기드온은 여룹바알이라 불렸다(6:31-32). 드보라와 바락의 세대가 지나갔다. 기드온 합류, 신앙 +15, 요아스 신앙 +30, 세겜 민심 -10. 양털이 젖고 또 말랐다.'; } },
        { label: '제단은 그대로 두고 조용히 군사만 모은다', run: G => {
          G.kill('드보라'); G.kill('바락'); K.raise(G, '기드온', 'shechem');
          if (K.mine(G, 'shechem')) G.city('shechem').soldiers += 1500;
          K.faithAll(G, -5); G.flags.gideonCalled = true; K.next(G, 3); G.kingdom(-2, '우상을 남겨 둠');
          return '드보라와 바락의 세대가 지나갔다. 기드온이 합류했다. 세겜 병력 +1500. 그러나 바알 제단이 그대로 서 있다 — 신앙 -5.'; } },
      ] },
    { id: 'gideon300', who: P, auto: 0,
      cond: G => K.after(G, 'gideonCall'),
      title: '기드온의 삼백 용사', ref: '삿 7장',
      text: '기드온을 따르는 백성이 삼만 이천 명이었다. 여호와께서 말씀하셨다. "너를 따르는 백성이 너무 많은즉 내가 그들의 손에 미디안 사람을 넘겨 주지 아니하리니, 이는 이스라엘이 나를 거슬러 스스로 자랑하기를 내 손이 나를 구원하였다 할까 함이니라." 두려워 떠는 자 이만 이천이 돌아가고, 물가에서 손으로 물을 움켜 입에 대고 핥은 자는 삼백 명이었다.',
      choices: [
        { label: '삼백 명만 남기고 나팔과 횃불과 항아리를 나눠 준다', run: G => {
          K.raise(G, '기드온', 'shechem', true); K.raise(G, '부라', 'shechem');
          if (K.mine(G, 'shechem')) { const s = G.city('shechem'); s.soldiers = Math.floor(s.soldiers * 0.8); }
          G.item(P, 'gideon_trumpet', 1); G.item(P, 'torch', 2);
          K.cut(G, 'midian', 0.4); G.kill('오렙'); G.kill('스엡');
          G.buff(P, 'atk', 4, 0.35); G.buff('midian', 'atk', 3, -0.2); K.faithAll(G, 15);
          K.stat(G, '기드온', 'fai', 10); K.stat(G, '기드온', 'cha', 5);
          G.flags.three100 = true; K.next(G, 3); G.kingdom(10, '여호와의 칼, 기드온의 칼');
          return '"여호와와 기드온의 칼이다!" 삼백 명이 항아리를 깨뜨리고 횃불을 들고 나팔을 불자 미디안 진영이 서로 칼로 쳤다. 세겜의 병력 20%는 집으로 돌아갔지만, 미디안 병력 60% 궤멸, 방백 오렙과 스엡이 죽었다. 기드온이 사사로 서고 부라가 합류했다. 기드온의 나팔과 횃불·항아리 2, 4턴 동안 공격력 +35%, 신앙 +15.'; } },
        { label: '삼만 이천 명을 모두 데리고 싸운다', run: G => {
          K.raise(G, '기드온', 'shechem', true);
          K.cut(G, 'midian', 0.8); G.buff(P, 'atk', 3, 0.15); K.faithAll(G, -10);
          K.next(G, 3); G.kingdom(-5, '내 손이 나를 구원하였다');
          return '기드온이 사사로 섰다. 미디안 병력 20%가 물러가고 3턴 동안 공격력 +15%. 그러나 백성은 "우리 손이 우리를 구원하였다" 하며 자랑한다 — 신앙 -10.'; } },
      ] },
    { id: 'zebah', who: P, auto: 0,
      cond: G => K.after(G, 'gideon300'),
      title: '피곤하나 추격하며', ref: '삿 8:4-23',
      text: '기드온과 삼백 명이 요단을 건너 "피곤하나 추격하며"(8:4) 미디안의 두 왕 세바와 살문나를 쫓았다. 숙곳과 브누엘 사람들은 떡을 주지 않고 비웃었다. 두 왕은 갈골에 군대 만 오천과 함께 있었다. 싸움이 끝나자 이스라엘 사람들이 기드온에게 말했다. "당신과 당신의 아들과 손자가 우리를 다스리소서."',
      choices: [
        { label: '두 왕을 사로잡고, "여호와께서 너희를 다스리시리라" 하며 왕위를 거절한다', run: G => {
          G.kill('세바'); G.kill('살문나'); K.cut(G, 'midian', 0.6);
          K.faithAll(G, 8); G.flags.noKing = true; K.next(G, 3); G.kingdom(8, '여호와께서 다스리시리라');
          return '세바와 살문나가 죽고 미디안 병력 40% 궤멸. "내가 너희를 다스리지 아니하겠고 나의 아들도 너희를 다스리지 아니할 것이요 여호와께서 너희를 다스리시리라"(8:23). 신앙 +8. "미디안이 이스라엘 자손 앞에 복종하여 다시는 그 머리를 들지 못하였으므로"(8:28).'; } },
        { label: '두 왕을 치고, 백성이 바친 금 귀고리로 에봇을 만든다', run: G => {
          G.kill('세바'); G.kill('살문나'); K.cut(G, 'midian', 0.6);
          K.gold(G, 600); K.faithAll(G, -8); G.flags.goldEphod = true; K.next(G, 3); G.kingdom(-4, '기드온의 에봇');
          return '미디안 병력 40% 궤멸, 금 +600(귀고리 금 천칠백 세겔, 8:26). 그러나 "온 이스라엘이 그것을 음란하게 위하므로 그것이 기드온과 그 집에 올무가 되었다"(8:27). 신앙 -8.'; } },
      ] },
    { id: 'abimelech', who: P, auto: 0,
      cond: G => K.after(G, 'zebah') && !G.exists('abimelech') && K.mine(G, 'shechem') && G.fac(P).capital !== 'shechem' && G.cityCount(P) >= 4,
      title: '아비멜렉의 반역', ref: '삿 9장',
      text: '기드온이 죽자 이스라엘은 다시 바알브릿을 섬겼다. 세겜에 있던 첩의 아들 아비멜렉이 외가 사람들을 꾀어 은 칠십 개로 건달들을 사고 자기 형제들을 해친 뒤, 세겜 사람들에게 왕으로 추대되었다. 막내 요담만 살아남아 그리심 산 꼭대기에서 외쳤다.',
      choices: [
        { label: '요담의 가시나무 비유를 전하며 여호와의 다스림을 선포한다', run: G => {
          G.kill('기드온');
          G.rebel('abimelech', '아비멜렉', 'shechem', ['아비멜렉', 82, 60, 55, 50, 10, null, 'shechem', '기드온이 세겜에 둔 첩의 아들. 형제들을 해치고 세겜에서 스스로 왕이 되었다.', '삿 9:1-6']);
          const c = G.city('shechem'); c.soldiers = 3000; c.loy = 30;
          K.raise(G, '돌라', null, true); K.faithAll(G, 8);
          G.flags.jotham = true; K.next(G, 3); G.kingdom(3, '여호와께서 다스리시리라');
          return '"나무들이 가시나무에게 이르되 너는 와서 우리 위에 왕이 되라 하매…"(9:14-15). 아비멜렉이 세겜에서 일어났지만 하나님이 그와 세겜 사람들 사이에 악한 영을 보내셨다 — 세겜 병력 3000, 민심 30. 기드온이 세상을 떠나고 돌라가 사사로 섰다. 신앙 +8. (아비멜렉은 데베스에서 한 여인이 던진 맷돌 위짝에 쓰러진다, 9:53.)'; } },
        { label: '세겜 사람들의 선택을 인정하고 아비멜렉과 화친한다', run: G => {
          G.kill('기드온');
          G.rebel('abimelech', '아비멜렉', 'shechem', ['아비멜렉', 82, 60, 55, 50, 10, null, 'shechem', '기드온이 세겜에 둔 첩의 아들. 형제들을 해치고 세겜에서 스스로 왕이 되었다.', '삿 9:1-6']);
          G.rel(P, 'abimelech', 50); K.faithAll(G, -10, -5);
          K.raise(G, '돌라', null, true); K.next(G, 3); G.kingdom(-6, '가시나무를 왕으로');
          return '아비멜렉이 세겜의 왕이 되었다. 아비멜렉과의 관계 +50, 그러나 신앙 -10, 민심 -5. 기드온이 세상을 떠나고 돌라가 사사로 섰다.'; } },
      ] },
    { id: 'jephthah', who: P, auto: 0,
      cond: G => K.after(G, 'zebah') && (G.done.abimelech || G.turn >= (G.flags.jNext || 0) + 3),
      title: '입다의 서원', ref: '삿 10:6–11:40',
      text: '이스라엘이 다시 바알들과 아스다롯과 아람·시돈·모압·암몬·블레셋의 신들을 섬겼다. 암몬 자손이 길르앗에 진을 치자 길르앗 장로들이 돕 땅의 입다에게 가서 "우리의 장관이 되라" 청했다. 입다가 암몬 왕에게 사자를 보내 "이스라엘이 헤스본과 아로엘에 거주한 지 삼백 년"이라며 항변했으나 왕은 듣지 않았다. 여호와의 영이 입다에게 임했다. 출전을 앞두고 입다가 여호와께 서원하려 한다.',
      choices: [
        { label: '서원을 하지 않고 "심판하시는 여호와께서 판결하시옵소서" 하며 여호와만 의지한다', run: G => {
          G.kill('기드온'); K.raise(G, '입다', 'ramoth', true);
          K.cut(G, 'ammon', 0.5); G.buff(P, 'atk', 4, 0.3); K.faithAll(G, 10); K.stat(G, '입다', 'fai', 15);
          G.flags.jephthahTrust = true; K.next(G, 3); G.kingdom(8, '여호와께서 판결하시리라');
          return '"심판하시는 여호와께서 오늘 이스라엘 자손과 암몬 자손 사이에 판결하시옵소서"(11:27). 입다가 아로엘에서 민닛까지 암몬을 쳤다. 암몬 병력 50% 궤멸, 4턴 동안 공격력 +30%, 신앙 +10. 입다가 사사로 섰다. 구원은 거래가 아니라 은혜였다.'; } },
        { label: '"누구든지 먼저 나와 나를 영접하는 자를 번제로 드리리라" 서원한다', run: G => {
          G.kill('기드온'); K.raise(G, '입다', 'ramoth', true);
          K.cut(G, 'ammon', 0.5); G.buff(P, 'atk', 4, 0.3); K.faithAll(G, -10, -10);
          K.stat(G, '입다', 'cha', -10); K.stat(G, '입다', 'fai', -10);
          G.flags.rashVow = true; K.next(G, 3); G.kingdom(-8, '경솔한 서원');
          return '암몬은 크게 패했다(병력 50% 궤멸, 4턴 동안 공격력 +30%). 그러나 미스바의 집에 돌아오자 소고를 잡고 춤추며 그를 맞으러 나온 이는 그의 무남독녀였다. 입다가 옷을 찢으며 슬퍼했고, 이스라엘 딸들은 해마다 나흘씩 그를 애곡했다(11:34-40). 여호와께서는 그런 제물을 구하신 적이 없다(신 12:31; 미 6:6-8). 신앙·민심 -10, 입다 매력·신앙 -10.'; } },
      ] },
    { id: 'ruth', who: P, auto: 0,
      cond: G => K.after(G, 'jephthah'),
      title: '베들레헴의 이삭줍기', ref: '룻 1–4장',
      text: '사사들이 치리하던 때에 그 땅에 흉년이 들었다. 모압으로 갔던 나오미가 남편과 두 아들을 잃고 베들레헴으로 돌아왔다. 모압 여인 며느리 룻이 따라오며 말했다. "어머니의 백성이 나의 백성이 되고 어머니의 하나님이 나의 하나님이 되시리니"(1:16). 룻이 보아스의 밭에서 이삭을 줍는다.',
      choices: [
        { label: '보아스가 이삭줍기를 넉넉히 허락하고 기업 무를 자의 책임을 다한다', run: G => {
          ['나오미', '룻', '보아스'].forEach(n => K.raise(G, n, 'bethlehem'));
          K.food(G, 2500); K.faithAll(G, 5, 5); if (K.mine(G, 'bethlehem')) { const b = G.city('bethlehem'); b.loy += 10; b.agri += 10; }
          G.flags.obed = true; K.next(G, 3); G.kingdom(6, '헤세드 — 인애');
          return '"그에게 곡식 단 사이에서 줍게 하고 책망하지 말며"(2:15). 보아스가 성문에서 장로들 앞에 룻을 아내로 맞았고, 아들 오벳을 낳았다 — 오벳은 이새의 아버지요 이새는 다윗의 아버지다(4:17). 나오미·룻·보아스 합류, 식량 +2500, 신앙·민심 +5, 베들레헴 민심·농업 +10.'; } },
        { label: '모압 여인은 받을 수 없다며 밭에서 내보낸다', run: G => {
          K.raise(G, '보아스', 'bethlehem'); K.faithAll(G, -5);
          K.next(G, 3); G.kingdom(-3, '나그네를 내침');
          return '보아스만 합류했다. "너희 땅의 곡물을 벨 때에… 가난한 자와 거류민을 위하여 남겨 두라"(레 19:9-10). 신앙 -5. 룻과 나오미는 재야에 남았다.'; } },
      ] },
    { id: 'samsonBirth', who: P, auto: 0,
      cond: G => K.after(G, 'ruth'),
      title: '나실인 삼손의 출생', ref: '삿 12:7-15; 13장',
      text: '입다가 여섯 해 동안 사사로 있다가 죽었고, 입산과 엘론과 압돈이 차례로 이스라엘을 다스렸다. 이스라엘이 또 악을 행하자 여호와께서 그들을 사십 년 동안 블레셋 사람의 손에 넘기셨다. 소라 땅 마노아의 아내에게 여호와의 사자가 나타났다. "네가 임신하여 아들을 낳으리니 삭도를 그 머리에 대지 말라. 이 아이는 태에서 나옴으로부터 하나님께 바쳐진 나실인이 됨이라. 그가 블레셋 사람의 손에서 이스라엘을 구원하기 시작하리라."',
      choices: [
        { label: '마노아와 아내가 제물을 드리고 나실인의 규례를 지켜 아이를 기른다', run: G => {
          G.kill('입다'); K.raise(G, '마노아', 'bethlehem'); K.raise(G, '삼손', 'bethlehem', true);
          K.stat(G, '삼손', 'fai', 10);
          K.faithAll(G, 5); G.flags.nazirite = true; K.next(G, 3); G.kingdom(3, '나실인의 서원');
          return '제단에서 불꽃이 하늘로 오를 때 여호와의 사자가 그 불꽃 속에서 올라갔다(13:20). 아이가 자라매 여호와의 영이 마하네단에서 그를 움직이기 시작했다(13:25). 입다가 세상을 떠나고 삼손이 사사로 섰다. 마노아 합류, 삼손 신앙 +10, 신앙 +5.'; } },
      ] },
    { id: 'seaPeoples', who: P, auto: 0,
      cond: G => G.done.samsonBirth && G.exists('philistia'),
      title: '바다 민족 블레셋', ref: '암 9:7; 렘 47:4 · 역사 자료: 메디넷 하부 부조',
      text: '블레셋 사람은 "갑돌(그레데)에서" 온 바다의 민족이다(암 9:7). 애굽 바로 람세스 3세(BC 1180 무렵)의 메디넷 하부 신전 벽에는 그가 "바다 민족"과 싸운 장면과 함께 "펠레셋" 사람들이 새겨져 있다. 애굽에 막힌 그들이 가나안 해안의 다섯 성읍에 자리 잡고, 철을 다루며 산지로 밀고 올라온다.',
      choices: [
        { label: '산지의 성벽을 다지고 기다린다', run: G => {
          G.eachCity('philistia', c => { c.soldiers += 800; });
          G.eachCity(P, c => { c.def += 5; });
          return '블레셋 모든 성 병력 +800. 하나님의 군대 모든 성 성벽 +5.'; } },
        { label: '서둘러 해안으로 내려가 싸운다', run: G => {
          G.eachCity('philistia', c => { c.soldiers += 800; });
          G.buff(P, 'atk', 2, 0.1); G.buff('philistia', 'atk', 3, 0.1);
          return '블레셋 모든 성 병력 +800. 하나님의 군대 2턴 동안 공격력 +10%, 블레셋 3턴 동안 +10%.'; } },
      ] },
    { id: 'delilah', who: P, auto: 1,
      cond: G => K.after(G, 'samsonBirth') && G.exists('philistia') && G.alive('삼손') && G.facOf('삼손') === P,
      title: '삼손과 들릴라', ref: '삿 16장',
      text: '삼손이 소렉 골짜기의 여인 들릴라를 사랑했다. 블레셋 방백들이 그에게 은 천백 개씩을 약속했다. 들릴라가 날마다 졸라 "당신의 큰 힘이 무엇으로 말미암아 생기나이까" 하고 물으니 삼손의 마음이 번뇌하여 죽을 지경이 되었다.',
      choices: [
        { label: '들릴라를 떠나 나실인의 서원을 지킨다', run: G => {
          K.stat(G, '삼손', 'fai', 15);
          G.buff(P, 'atk', 3, 0.25); K.cut(G, 'philistia', 0.75, ['gath', 'ekron', 'gaza']); K.faithAll(G, 10);
          G.flags.vowKept = true; K.next(G, 3); G.kingdom(8, '서원을 지킨 삼손');
          return '삼손이 소렉 골짜기를 떠났다. 성경의 역사에서는 삼손이 비밀을 털어놓았다 — 이 게임에서는 서원을 지킨 삼손을 그려 본다. 3턴 동안 공격력 +25%, 가드·에그론·가사의 블레셋 군 25% 궤멸, 신앙 +10.'; } },
        { label: '마음을 다 털어놓는다', run: G => K.dagon(G) },
      ] },
    { id: 'hannah', who: P, auto: 0,
      cond: G => (K.after(G, 'delilah') || (K.after(G, 'samsonBirth') && !(G.exists('philistia') && G.alive('삼손') && G.facOf('삼손') === P))),
      title: '한나의 기도', ref: '삼상 1:1–2:11',
      text: '해마다 실로에 올라가 제사를 드리던 엘가나의 아내 한나에게는 자식이 없었다. 한나가 마음이 괴로워 통곡하며 서원했다. "만군의 여호와여 … 주의 여종에게 아들을 주시면 내가 그의 평생에 그를 여호와께 드리고 삭도를 그 머리에 대지 아니하겠나이다"(1:11). 제사장 엘리는 그가 취한 줄로 생각했다.',
      choices: [
        { label: '엘리가 "평안히 가라. 이스라엘의 하나님이 네가 기도로 구한 것을 허락하시기를" 하고 축복한다', run: G => {
          ['한나', '엘리', '사무엘'].forEach(n => K.raise(G, n, 'shiloh'));
          const gone = ['비느하스', '삼손'].filter(n => G.alive(n)); gone.forEach(n => G.kill(n));
          K.raise(G, '엘리', 'shiloh', true);
          K.faithAll(G, 8); if (K.mine(G, 'shiloh')) G.city('shiloh').faith += 10;
          G.flags.hannahSong = true; K.next(G, 3); G.kingdom(6, '한나의 노래');
          return '한나가 아들을 낳아 사무엘("여호와께 구함")이라 하고, 젖을 뗀 뒤 실로의 회막에 바쳤다. "여호와는 가난하게도 하시고 부하게도 하시며 낮추기도 하시고 높이기도 하시는도다"(2:7). 엘리가 사사로 서고 한나와 어린 사무엘이 합류했다' + (gone.length ? ` (${gone.join('·')}의 세대가 지나갔다)` : '') + '. 신앙 +8, 실로 신앙 +10.'; } },
      ] },
    { id: 'samuelCall', who: P, auto: 0,
      cond: G => K.after(G, 'hannah'),
      title: '사무엘아, 사무엘아', ref: '삼상 3장',
      text: '그 때에는 여호와의 말씀이 희귀하여 이상이 흔히 보이지 않았다. 하나님의 등불은 아직 꺼지지 아니하였고, 사무엘은 하나님의 궤 있는 여호와의 전 안에 누웠다. 여호와께서 "사무엘아 사무엘아" 부르시니, 사무엘이 엘리에게 달려갔다. 세 번째에 엘리가 깨달았다. "가서 누웠다가 그가 너를 부르시거든 네가 말하기를 여호와여 말씀하옵소서 주의 종이 듣겠나이다 하라."',
      choices: [
        { label: '"말씀하옵소서 주의 종이 듣겠나이다" — 두려워도 들은 말씀을 엘리에게 숨김없이 전한다', run: G => {
          K.raise(G, '사무엘', 'shiloh'); G.item(P, 'tabernacle_lamp', 1);
          K.stat(G, '사무엘', 'fai', 1); K.stat(G, '엘리', 'fai', 5); K.faithAll(G, 10);
          G.flags.samuelProphet = true; K.next(G, 3); G.kingdom(8, '주의 종이 듣겠나이다');
          return '"사무엘이 자라매 여호와께서 그와 함께 계셔서 그의 말이 하나도 땅에 떨어지지 않게 하시니, 단에서부터 브엘세바까지의 온 이스라엘이 사무엘은 여호와의 선지자로 세우심을 입은 줄을 알았더라"(3:19-20). 회막의 등불을 얻었다. 신앙 +10.'; } },
        { label: '엘리 집에 대한 말씀이 두려워 말을 줄인다', run: G => {
          K.raise(G, '사무엘', 'shiloh'); G.item(P, 'tabernacle_lamp', 1); K.faithAll(G, 3);
          G.flags.samuelProphet = true; K.next(G, 3);
          return '엘리가 말했다. "네게 무엇을 말씀하셨느냐. 숨기지 말라"(3:17). 사무엘이 결국 다 말하였다. 회막의 등불을 얻었다. 신앙 +3.'; } },
      ] },
    { id: 'aphek', who: P, auto: 0,
      cond: G => K.after(G, 'samuelCall'),
      title: '에벤에셀의 패배', ref: '삼상 4장',
      text: '블레셋이 아벡에 진을 치고 이스라엘을 쳐서 사천 명을 죽였다. 장로들이 말했다. "실로에서 여호와의 언약궤를 우리에게로 가져다가 우리 중에 있게 하여 그것으로 우리를 우리 원수들의 손에서 구원하게 하자." 궤가 진영에 들어오자 온 이스라엘이 큰 소리로 외쳐 땅이 울렸다.',
      choices: [
        { label: '궤를 부적처럼 앞세우지 않는다 — 먼저 이방 신들을 버리고 여호와께 돌아간다', run: G => {
          K.faithAll(G, 6); G.item(P, 'ark', 1);
          const c = K.home(G); if (c) c.soldiers = Math.floor(c.soldiers * 0.9);
          G.kill('엘리'); G.flags.arkKept = true; K.next(G, 2); G.kingdom(4, '궤가 아니라 여호와를');
          return '성경의 역사에서는 궤를 진으로 가져왔다가 빼앗겼다 — 이 게임에서는 궤를 부적으로 쓰지 않는 길을 그려 본다. 싸움에 져서 본거지 병력 10%를 잃었지만 언약궤는 실로에 남았다(언약궤). 늙은 엘리가 소식을 기다리다 세상을 떠났다. 신앙 +6.'; } },
        { label: '궤를 진영으로 메어 온다', run: G => {
          const c = K.home(G); if (c) c.soldiers = Math.floor(c.soldiers * 0.75);
          if (K.mine(G, 'shiloh')) { const s = G.city('shiloh'); s.faith -= 15; s.loy -= 10; }
          G.kill('엘리'); K.faithAll(G, -5); G.flags.arkTaken = G.turn; K.next(G, 2); G.kingdom(-6, '이가봇 — 영광이 떠났다');
          return '이스라엘이 크게 패하여 보병 삼만 명이 엎드러졌고, 하나님의 궤가 빼앗겼으며 엘리의 두 아들 홉니와 비느하스가 죽었다. 소식을 들은 엘리가 의자에서 넘어져 목이 부러져 죽었다(4:18). 본거지 병력 25% 손실, 실로 신앙 -15, 신앙 -5. "영광이 이스라엘에서 떠났다"(4:22). 훗날 예레미야는 "실로에 가서 내가 행한 것을 보라" 하였다(렘 7:12).'; } },
      ] },
    { id: 'arkReturn', who: P, auto: 0,
      cond: G => G.flags.arkTaken && G.turn >= G.flags.arkTaken + 2 && G.exists(P),
      title: '다곤이 엎드러지다', ref: '삼상 5–6장',
      text: '블레셋 사람들이 하나님의 궤를 아스돗 다곤의 신전에 두었다. 이튿날 다곤이 여호와의 궤 앞에서 얼굴을 땅에 대고 엎드러졌고, 그 이튿날에는 머리와 두 손목이 끊어져 문지방에 있었다. 아스돗과 가드와 에그론에 독한 종기가 퍼졌다. 일곱 달 뒤 블레셋 방백들이 궤를 새 수레에 싣고 젖 나는 소 둘에게 끌게 하니, 소가 좌우로 치우치지 않고 벧세메스 길로 올라갔다.',
      choices: [
        { label: '벧세메스에서 궤를 맞아 기뻐하고 기럇여아림으로 모신다', run: G => {
          G.item(P, 'ark', 1); K.cut(G, 'philistia', 0.8, ['ashdod', 'gath', 'ekron']);
          K.faithAll(G, 10); G.flags.arkBack = true; G.kingdom(6, '언약궤가 돌아오다');
          return '언약궤가 돌아왔다(언약궤). 아스돗·가드·에그론의 블레셋 군 20% 궤멸, 신앙 +10. 궤는 이십 년 동안 기럇여아림 아비나답의 집에 머물렀다(7:1-2).'; } },
      ] },
    { id: 'mizpah', who: P, auto: 0,
      cond: G => K.after(G, 'aphek') && (!G.flags.arkTaken || G.done.arkReturn),
      title: '미스바의 에벤에셀', ref: '삼상 7:3-14',
      text: '사무엘이 온 이스라엘에게 말했다. "너희가 전심으로 여호와께 돌아오려거든 이방 신들과 아스다롯을 너희 중에서 제거하고 마음을 여호와께로 향하여 그만 섬기라." 백성이 미스바에 모여 물을 길어 여호와 앞에 붓고 금식하며 "우리가 여호와께 범죄하였나이다" 하였다. 그 때 블레셋 방백들이 미스바로 올라왔다.',
      choices: [
        { label: '사무엘이 젖 먹는 어린 양을 번제로 드리고 부르짖는다', run: G => {
          K.raise(G, '사무엘', 'shiloh', true);
          K.cut(G, 'philistia', 0.55); G.buff(P, 'atk', 5, 0.35); G.buff('philistia', 'atk', 4, -0.25);
          const got = K.give(G, 'ekron', 1500, 70);
          K.faithAll(G, 15, 5); G.flags.ebenezer = true; K.next(G, 2); G.kingdom(12, '에벤에셀');
          return '그 날에 여호와께서 블레셋 사람에게 큰 우레를 발하여 그들을 어지럽게 하시니 그들이 이스라엘 앞에 패하였다(7:10). 사무엘이 미스바와 센 사이에 돌을 세워 "여호와께서 여기까지 우리를 도우셨다" 하고 에벤에셀이라 불렀다(7:12). 사무엘이 사사로 섰다. 블레셋 병력 45% 궤멸, 5턴 동안 공격력 +35%, 블레셋 4턴 동안 -25%' + (got ? ', 에그론이 돌아왔다("에그론부터 가드까지" 7:14)' : '') + '. 신앙 +15, 민심 +5.'; } },
      ] },
    { id: 'toHaran', who: P, auto: 0,
      cond: G => G.flags.ebenezer && K.mine(G, 'damascus') && G.exists('aram'),
      title: '유브라데 강을 향하여', ref: '창 15:18; 신 11:24',
      text: '에벤에셀 이후 블레셋이 다시는 이스라엘 지경에 들어오지 못했다. 성경의 역사에서 사사들과 사무엘은 가나안 밖으로 군대를 이끌고 나간 적이 없다. 이 게임에서는 하나님의 군대가 첫 압제자 구산 리사다임의 땅, 아브라함이 부르심을 받아 떠난 하란까지 올라간다. "애굽 강에서부터 그 큰 강 유브라데까지 네 자손에게 주노니"(창 15:18).',
      choices: [
        { label: '약속을 기억하며 북쪽 길로 나아간다', run: G => {
          G.buff(P, 'atk', 5, 0.3); K.cut(G, 'aram', 0.75); K.gold(G, 500);
          return '5턴 동안 공격력 +30%, 아람 병력 25% 궤멸, 금 +500. 다메섹에서 하맛, 갈그미스를 지나 하란으로 가는 길이 열렸다.'; } },
        { label: '약속의 땅을 먼저 굳게 지킨다', run: G => {
          G.eachCity(P, c => { c.loy += 8; c.def += 5; }); K.faithAll(G, 5);
          return '모든 성 민심 +8, 성벽 +5, 신앙 +5.'; } },
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
    { id: 'apostasy', who: P, auto: 0, repeat: true,
      cond: G => G.turn >= 6 && G.exists(P) && G.turn >= (G.flags.apostasyNext || 0) && K.faith(G) < 45 && !!K.oppressor(G),
      title: '배교의 순환', ref: '삿 2:11-19; 10:10-16',
      text: '이스라엘 자손이 여호와 앞에 악을 행하여 바알들을 섬기고 애굽 땅에서 인도하여 내신 조상들의 하나님 여호와를 버렸다. 여호와께서 진노하사 그들을 노략하는 자의 손에 넘기셨다. "그 때에는 이스라엘에 왕이 없으므로 사람이 각기 자기의 소견에 옳은 대로 행하였더라"(21:25).',
      choices: [
        { label: '"우리가 범죄하였사오니" 부르짖고 이방 신들을 제거한다', run: G => {
          const f = K.oppressor(G), t = K.target(G, f);
          const r = f && t ? G.raid(f, t, 2000) : '';
          K.gold(G, -100); K.faithAll(G, 12);
          G.buff(P, 'atk', 2, 0.15); G.flags.apostasyNext = G.turn + 6; G.kingdom(3, '부르짖음');
          return (r ? `압제: ${r} ` : '') + '백성이 이방 신들을 제하고 여호와를 섬기니 "여호와께서 이스라엘의 곤고로 말미암아 마음에 근심하시니라"(10:16). 금 -100, 신앙 +12, 2턴 동안 공격력 +15%.'; } },
        { label: '각기 자기 소견에 옳은 대로 행한다', run: G => {
          const f = K.oppressor(G), t = K.target(G, f);
          const r = f && t ? G.raid(f, t, 4000) : '';
          if (f) G.buff(f, 'atk', 3, 0.2); K.faithAll(G, -5, -5);
          G.flags.apostasyNext = G.turn + 6; G.kingdom(-4, '각기 자기 소견대로');
          return (r ? `압제: ${r} ` : '') + '압제자의 기세가 3턴 동안 +20%. 신앙·민심 -5.'; } },
      ] },
  ];

  // ---------- 사명(스토리) ----------
  STORY[ID] = {
    [P]: [
      { title: '여호와를 알지 못하는 세대', ref: '삿 2:7-19; 3:7-11',
        intro: [
          ['narr', '여호수아와 그 세대가 다 조상들에게로 돌아갔다. 그 후에 일어난 다른 세대는 여호와를 알지 못하며 여호와께서 이스라엘을 위하여 행하신 일도 알지 못하였다 (2:10).'],
          ['narr', '그러나 실로의 회막 곁에는 아직 한 무리가 남아 있었다. 야곱이 마하나임에서 본 하나님의 군대(창 32:1-2)처럼, 여호와를 기억하는 사람들의 군대다.'],
          ['word', '"여호와께서 그들을 위하여 사사들을 세우실 때에는 그 사사와 함께 하셨고, 그 사사가 사는 날 동안에는 여호와께서 그들을 대적의 손에서 구원하셨으니." (2:18)'],
          ['비느하스', '옷니엘이여, 백성이 산당마다 바알을 섬깁니다. 실로의 회막에는 제물을 가져오는 자가 드뭅니다.'],
          ['옷니엘', '나는 왕이 아니오. 지파들을 묶는 것은 칼이 아니라 이 회막이오. 먼저 여호와께 돌아갑시다.'],
          ['악사', '아버지 갈렙은 여든다섯에도 "이 산지를 내게 주소서" 했습니다. 그 믿음을 다음 세대에 물려주어야 합니다.'],
        ],
        goal: { t: 'cmd', key: 'worship', n: 2, text: '실로 회막에서 제사를 두 번 드린다', city: 'shiloh' },
        reward: { k: 10, food: 2000 },
        outro: [['비느하스', '회막의 등불이 다시 밝습니다. 백성이 여호와를 기억하기 시작했습니다.'], ['옷니엘', '평온한 때에 신앙을 지키는 것, 그것이 다음 사사를 기다리지 않는 길이오.']] },
      { title: '왼손잡이 사사', ref: '삿 3:12-31',
        intro: [
          ['narr', '이스라엘이 다시 악을 행하자 모압 왕 에글론이 암몬과 아말렉을 모아 종려나무 성읍 여리고를 점령했다. 이스라엘이 열여덟 해 동안 그를 섬겼다.'],
          ['에훗', '나는 베냐민 사람, 왼손잡이입니다. 조공을 바치는 사자로 에글론의 다락방까지 들어갈 수 있습니다.'],
          ['@ruler', '조공을 바치러 가는 길이 구원의 길이 될 줄 누가 알았겠소. 여호와께서 세우신 자라면 가시오.'],
          ['비느하스', '여리고는 여호수아 때에 여호와께서 무너뜨리신 성입니다. 그 성이 다시 이방의 손에 있다는 것이 우리의 부끄러움입니다.'],
          ['삼갈', '소 모는 막대기라도 좋소. 나도 싸우겠소!'],
        ],
        goal: { t: 'own', city: 'jericho', text: '종려나무 성읍 여리고를 되찾는다' },
        reward: { k: 15, gold: 500 },
        outro: [['에훗', '나를 따르라. 여호와께서 너희의 원수들인 모압을 너희 손에 넘겨 주셨느니라 (3:28).'], ['narr', '이스라엘이 요단 나루를 장악하여 모압 사람을 하나도 건너가지 못하게 하였다. 그 땅이 팔십 년 동안 평온하였다.']] },
      { title: '이스라엘의 어머니', ref: '삿 4:1–5:31',
        intro: [
          ['narr', '하솔 왕 야빈이 철 병거 구백 대로 이십 년 동안 이스라엘을 학대했다. 대로가 비었고 길을 가는 자들은 오솔길로 다녔다 (5:6).'],
          ['드보라', '바락이여, 이스라엘의 하나님 여호와께서 명령하지 아니하셨느냐. 납달리와 스불론 자손 만 명을 거느리고 다볼 산으로 가라.'],
          ['바락', '만일 당신이 나와 함께 가면 나도 가려니와 만일 당신이 나와 함께 가지 아니하면 나도 가지 아니하겠나이다.'],
          ['드보라', '내가 반드시 너와 함께 가리라. 그러나 이번 일의 영광은 네게 돌아가지 아니하리니 여호와께서 시스라를 여인의 손에 파실 것임이니라.'],
          ['야엘', '우리 겐 사람은 야빈과 화평하다 하나, 내 장막은 여호와의 편에 서겠습니다.'],
          ['드보라', '왕들이 와서 싸울 때에 가나안 왕들이 므깃도 물가 다아낙에서 싸웠소 (5:19). 이스르엘 평야의 관문 므깃도를 되찾읍시다.'],
        ],
        goal: { t: 'own', city: 'megiddo', text: '기손 강가의 므깃도를 차지한다' },
        reward: { k: 15, food: 3000 },
        outro: [['드보라', '이스라엘의 영솔자들이 영솔하였고 백성이 즐거이 헌신하였으니 여호와를 찬송하라 (5:2)!'], ['word', '"여호와여 주의 원수들은 다 이와 같이 망하게 하시고 주를 사랑하는 자들은 해가 힘 있게 돋음 같게 하시옵소서." (5:31)']] },
      { title: '큰 용사여', ref: '삿 6–8장',
        intro: [
          ['narr', '미디안과 아말렉과 동방 사람들이 메뚜기 떼처럼 올라와 가사에 이르기까지 토지 소산을 멸했다. 이스라엘 자손은 산에서 웅덩이와 굴과 산성을 만들었다.'],
          ['기드온', '오 나의 주여, 여호와께서 우리와 함께 계시면 어찌하여 이 모든 일이 우리에게 일어났나이까. 내 집은 므낫세 중에 극히 약하고 나는 아버지 집에서 가장 작은 자니이다.'],
          ['word', '"내가 반드시 너와 함께 하리니 네가 미디안 사람 치기를 한 사람을 치듯 하리라." (6:16)'],
          ['부라', '주인님, 삼백 명으로 어떻게 저 약대 떼를 당합니까? 나팔과 항아리와 횃불이라니요.'],
          ['기드온', '많은 군사가 아니라 여호와의 방법이다. 미디안이 요단 동편으로 달아나거든 피곤하여도 끝까지 쫓아라.'],
          ['narr', '성경의 역사에서는 기드온이 요단을 건너 갈골까지 두 왕을 쫓았다(8:10). 이 게임에서는 요단 동편 바산의 에드레이로 그린다.'],
        ],
        goal: { t: 'own', city: 'edrei', text: '미디안이 진을 친 요단 동편 에드레이를 차지한다' },
        reward: { k: 15, gold: 500 },
        outro: [['기드온', '"여호와와 기드온의 칼이다!" …아니, 이긴 것은 여호와의 칼이오.'], ['narr', '미디안이 이스라엘 자손 앞에 복종하여 다시는 그 머리를 들지 못하였다. 기드온이 사는 사십 년 동안 그 땅이 평온하였다 (8:28).']] },
      { title: '여호와께서 판결하시리라', ref: '삿 9–12장',
        intro: [
          ['narr', '기드온이 죽자 세겜에서 아비멜렉이 스스로 왕이 되었고, 요단 저편에서는 암몬이 길르앗을 열여덟 해 동안 억눌렀다.'],
          ['돌라', '사람의 손으로 세운 권세는 세겜의 망대처럼 무너집니다. 참 왕이신 여호와를 잊지 맙시다.'],
          ['입다', '나는 기생의 아들이라 쫓겨났던 자요. 그래도 여호와께서 나를 쓰신다면, 거래가 아니라 믿음으로 싸우겠소.'],
          ['야일', '암몬 왕은 헤스본이 제 땅이라 합니다. 그러나 이스라엘이 헤스본과 아로엘에 산 지 삼백 년입니다 (11:26).'],
          ['@advisor', '헤스본을 되찾으면 요단 동편의 지파들이 다시 숨을 쉴 것입니다.'],
        ],
        goal: { t: 'own', city: 'heshbon', text: '암몬이 요구한 헤스본을 지킨다(차지한다)' },
        reward: { k: 15, food: 3000 },
        outro: [['입다', '심판하시는 여호와께서 오늘 이스라엘 자손과 암몬 자손 사이에 판결하셨소 (11:27).'], ['word', '"내가 너희를 다스리지 아니하겠고 나의 아들도 너희를 다스리지 아니할 것이요 여호와께서 너희를 다스리시리라." (8:23)']] },
      { title: '여호와께서 여기까지 우리를 도우셨다', ref: '삿 13–16장; 삼상 1–7장',
        intro: [
          ['narr', '여호와께서 이스라엘을 사십 년 동안 블레셋 사람의 손에 넘기셨다. 소라 땅 마노아의 집에 나실인 아이가 태어났고, 실로에서는 한나가 기도하여 사무엘을 낳았다.'],
          ['삼손', '여호와의 영이 나를 움직이면 사자도 블레셋도 두렵지 않소. …그러나 내 눈에 좋은 대로 하고 싶은 마음이 늘 나를 흔드오.'],
          ['사무엘', '너희가 전심으로 여호와께 돌아오려거든 이방 신들과 아스다롯을 제거하고 그만 섬기라. 그리하면 그가 너희를 블레셋 사람의 손에서 건져내시리라 (삼상 7:3).'],
          ['word', '"그 때에는 이스라엘에 왕이 없으므로 사람이 각기 자기의 소견에 옳은 대로 행하였더라." (21:25)'],
          ['narr', '성경의 역사에서 사사 시대는 미스바의 승리와 함께 끝나고, 백성은 곧 왕을 구한다. 이 게임에서는 하나님의 군대가 에그론과 가드, 그리고 첫 압제자의 땅 하란까지 나아간다.'],
          ['@ruler', '사사를 기다리는 나라가 아니라 여호와를 왕으로 모시는 나라가 되자. 약속의 땅을 지키고, 유브라데까지 나아가자.'],
        ],
        goal: { t: 'goal', text: '약속의 땅과 에그론·가드, 다메섹·하란까지 15성을 차지한다', faith: 60 },
        reward: { k: 25 },
        outro: [['사무엘', '에벤에셀 — 여호와께서 여기까지 우리를 도우셨도다 (삼상 7:12).'], ['@ruler', '각기 자기 소견대로가 아니라, 여호와의 말씀대로.'], ['narr', '사무엘이 사는 날 동안 여호와의 손이 블레셋 사람을 막으셨다 (7:13). 이제 이스라엘은 왕을 구하는 시대로 들어간다.']] },
    ],
  };

  // ---------- 주인공 대사 ----------
  HERO_LINES[ID] = {
    [P]: [
      { // 여호와를 알지 못하는 세대
        intro: [['narr', '{name}은(는) 마하나임에서 올라와 실로의 회막 곁에 장막을 쳤다.'], ['@hero', '여호와를 모르는 세대가 되지 않도록, 실로의 회막으로 먼저 돌아갑시다.']],
        outro: [['@hero', '회막의 등불을 끄지 않겠습니다. 평온한 날에도 여호와를 기억하겠습니다.']],
      },
      { // 왼손잡이 사사
        intro: [['@hero', '여호와께서는 약한 손으로도 구원하십니다. 종려나무 성읍을 되찾읍시다.']],
        outro: [['@hero', '여리고가 다시 우리 손에 있습니다. 이번에는 구원 뒤에도 신앙을 지킵시다.']],
      },
      { // 이스라엘의 어머니
        intro: [['@hero', '머뭇거리는 지파가 되지 않겠습니다. 제가 먼저 자원하여 나서겠습니다.']],
        outro: [['@hero', '백성이 즐거이 헌신하였습니다. 싸움을 이기게 하신 여호와를 찬송합시다!']],
      },
      { // 큰 용사여
        intro: [['@hero', '가장 작은 자라도 여호와께서 함께하시면 큰 용사입니다. 피곤하여도 끝까지 쫓겠습니다.']],
        outro: [['@hero', '삼백 명으로 이기게 하신 것은 영광을 오직 여호와께 돌리게 하시려 함입니다.']],
      },
      { // 여호와께서 판결하시리라
        intro: [['@hero', '거래하는 믿음이 아니라 맡기는 믿음으로 싸우겠습니다. 판결은 여호와께 있습니다.']],
        outro: [['@hero', '여호와께서 우리를 다스리십니다. 그 고백 위에 이 백성이 서기를 바랍니다.']],
      },
      { // 에벤에셀
        intro: [['@hero', '각기 자기 소견대로가 아니라, 여호와의 말씀대로 이 땅을 지키겠습니다.']],
        outro: [['@hero', '여기까지 도우신 여호와께서 앞으로도 도우실 것입니다. 에벤에셀!']],
      },
    ],
  };
})();
