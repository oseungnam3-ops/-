// 성경 삼국지 — 시대 1: 족장 시대 (BC 2090, 창세기 12–50장)
// 플레이어는 언제나 "마하나임 하나님의 군대"(army). 아브라함 → 이삭 → 야곱(마하나임, 창 32:1-2) → 요셉이 차례로 이끈다.
// 옛 시나리오 patriarchs의 인물·사건·대화를 옮겨 와 플레이어 세력을 army로 바꾸고, 하란·애굽·엘람·바벨론을 세계 지도 위에 놓았다.

// 족장 시대 이벤트 도우미 (옛 PATRI_KIT을 하나님의 군대에 맞게 옮김)
const EPAT = {
  P: 'army',
  SONS: ['르우벤', '시므온', '레위', '유다', '단', '납달리', '갓', '아셀', '잇사갈', '스불론', '요셉'],
  on: (G, cid) => !!G.city(cid),
  own: (G, cid) => EPAT.on(G, cid) && G.ownerOf(cid) === 'army',
  // 인물을 군대에 합류시키고, lead면 지도자(군주)로 세운다
  raise: (G, name, cid, lead) => {
    if (!G.exists('army') || !G.alive(name)) return false;
    if (G.facOf(name) !== 'army') G.join(name, 'army', cid && EPAT.own(G, cid) ? cid : undefined);
    if (lead) G.setRuler('army', name);
    return true;
  },
  // 앞 사건이 끝나고 정해진 턴이 지났는가
  after: (G, id) => !!G.done[id] && G.turn >= (G.flags.pNext || 0) && G.exists('army'),
  next: (G, n) => { G.flags.pNext = G.turn + n; },
  faithAll: (G, d, loy) => { if (G.exists('army')) G.eachCity('army', c => { c.faith += d; if (loy) c.loy += loy; }); },
  cut: (G, f, k, only) => { if (G.exists(f)) G.eachCity(f, c => { if (!only || only.includes(c.id)) c.soldiers = Math.floor(c.soldiers * k); }); },
  pay: (G, gold, food) => { if (!G.exists('army')) return; const F = G.fac('army'); F.gold = Math.max(0, F.gold - gold); F.food = Math.max(0, F.food - food); },
  stat: (G, name, k, d) => { const o = G.o(name); if (o && o.alive) o[k] = Math.max(0, Math.min(100, o[k] + d)); },
  // 군대의 본진 (도읍을 잃었으면 병력이 가장 많은 성)
  home: G => {
    if (!G.exists('army')) return null;
    const cap = G.fac('army').capital;
    if (EPAT.own(G, cap)) return G.city(cap);
    let best = null; G.eachCity('army', c => { if (!best || c.soldiers > best.soldiers) best = c; });
    return best;
  },
  // 주인 없는 성에 장막을 친다
  settle: (G, cid, sold, loy) => {
    if (!G.exists('army') || !EPAT.on(G, cid)) return false;
    const c = G.city(cid); if (c.owner) return false;
    c.owner = 'army'; c.soldiers += sold; c.loy = loy; c.faith += 10; return true;
  },
  // 롯이 요단 들(소돔)로 옮겨 간다 (13:11-12)
  part: G => { if (G.alive('롯') && G.facOf('롯') === 'army' && G.exists('sodom')) G.join('롯', 'sodom', G.fac('sodom').capital); },
  // 네 왕의 약탈 (14:8-12). 엘람 원정군은 다메섹에 진을 쳤다.
  camp: G => (G.exists('elam') && G.ownerOf('damascus') === 'elam' ? 'damascus' : G.exists('elam') ? G.fac('elam').capital : null),
  sack: G => {
    const j = G.city('jericho'); if (j.owner && j.owner !== 'army') { j.soldiers = Math.floor(j.soldiers * 0.5); j.loy -= 15; }
    if (G.exists('sodom')) { const S = G.fac('sodom'), g = Math.min(S.gold, 600); S.gold -= g; S.food = Math.floor(S.food * 0.6); if (G.exists('elam')) G.fac('elam').gold += g; }
    if (G.exists('elam')) G.fac('elam').aggr = Math.min(G.fac('elam').aggr, 0.1); // 약탈을 마친 원정군은 동방으로 돌아간다
    let lot = false;
    if (G.exists('elam') && G.alive('롯') && G.facOf('롯') !== 'army') { G.join('롯', 'elam', EPAT.camp(G)); lot = true; }
    return '싯딤 골짜기에서 요단 들의 왕들이 패하여 역청 구덩이에 빠졌다. 네 왕이 여리고(소돔)의 수비병 절반을 무너뜨리고 재물과 양식을 빼앗았다' + (lot ? ', 롯도 사로잡혀 다메섹의 원정군 진으로 끌려갔다.' : '.');
  },
  // 롯을 되찾는다 (14:16)
  rescue: G => {
    ['마므레', '에스골', '아넬'].forEach(n => EPAT.raise(G, n, 'hebron'));
    if (G.alive('롯') && G.facOf('롯') === 'elam') { if (G.exists('sodom') && G.cityCount('sodom')) G.join('롯', 'sodom'); else if (G.exists('army')) G.join('롯', 'army'); }
    if (G.exists('elam')) G.fac('elam').aggr = Math.min(G.fac('elam').aggr, 0.05); // 호바까지 쫓긴 동방 연합이 물러간다
    if (G.exists('babylon')) G.fac('babylon').aggr = Math.min(G.fac('babylon').aggr, 0.03);
    G.flags.lotRescued = true;
  },
  // 소돔과 고모라가 엎어진다 (19:24-29)
  overturn: G => {
    const c = G.city('jericho'); let t = '';
    if (c.owner !== 'army') { c.owner = null; c.soldiers = 0; c.agri = 5; c.comm = 5; c.pop = Math.floor(c.pop * 0.2); c.loy = 0; t = ' 여리고(소돔)가 폐허가 되어 주인 없는 성이 되었다.'; }
    if (G.exists('sodom')) {
      ['소돔 왕 베라', '고모라 왕 비르사', '아드마 왕 시납', '스보임 왕 세메벨'].forEach(n => { if (G.facOf(n) === 'sodom') G.kill(n); });
      G.eachCity('sodom', x => { x.owner = null; x.soldiers = Math.floor(x.soldiers * 0.3); });
      G.fac('sodom').alive = false; t += ' 소돔 세력이 사라졌다.';
    }
    const f = G.facOf('롯');
    if (G.alive('롯') && (f === 'sodom' || !f) && G.exists('army')) { G.join('롯', 'army'); t += ' 롯이 두 딸과 함께 소알을 거쳐 살아남아 하나님의 군대에 돌아왔다.'; }
    G.flags.sodomFell = true;
    return '새벽에 두 천사가 머뭇거리는 롯과 그 아내와 두 딸의 손을 잡아 성 밖으로 인도했다. "도망하여 생명을 보존하라. 뒤를 돌아보지 말라"(19:16-17). 여호와께서 하늘에서 유황과 불을 소돔과 고모라에 비같이 내리사 그 성들과 온 들을 엎어 멸하셨고, 롯의 아내는 뒤를 돌아보아 소금 기둥이 되었다(19:24-26).' + t;
  },
  // 사라와 아브라함의 장례, 리브가 (23–25장)
  bury: G => {
    G.flags.machpelah = true;
    if (G.alive('이삭') && G.facOf('이삭') === 'army') G.setRuler('army', '이삭');
    G.kill('사라'); G.kill('아브라함');
    const reb = EPAT.raise(G, '리브가', 'hebron');
    return (reb ? '아브라함의 늙은 종이 나홀의 성(하란)에서 리브가를 데려왔다. 리브가가 "가겠나이다" 하고 따라와 이삭의 아내가 되었다(24:58, 67; 리브가 합류). ' : '') + '사라가 막벨라 굴에 장사되었고, 아브라함은 나이가 높고 늙어 기운이 다하여 죽어 열조에게로 돌아갔다. 그의 아들 이삭과 이스마엘이 그를 막벨라 굴에 장사했다(25:8-9).';
  },
  // 르호봇과 브엘세바 언약 (26:22-33)
  wellsPeace: G => {
    if (G.exists('army')) { G.eachCity('army', c => { c.agri += 10; }); G.fac('army').food += 3000; }
    let t = '이삭이 거기서 옮겨 다른 우물을 팠더니 다투지 아니하였으므로 그 이름을 르호봇이라 하였다. "이제는 여호와께서 우리를 위하여 넓게 하셨으니 이 땅에서 우리가 번성하리로다"(26:22). 식량 +3000, 모든 성의 농업 +10.';
    const b = G.city('beersheba');
    if (G.exists('gerar')) {
      G.rel('army', 'gerar', 40);
      t += ' 아비멜렉이 친구 아훗삿과 군대 장관 비골과 함께 와서 "여호와께서 너와 함께 계심을 우리가 분명히 보았으므로" 언약하자 하였다(26:28). 그랄과의 관계 +40.';
      if (b.owner === 'gerar' && G.cityCount('gerar') > 1 && G.fac('gerar').capital !== 'beersheba') {
        const cap = G.fac('gerar').capital;
        ['비골', '아비멜렉', '아훗삿'].forEach(n => { const o = G.o(n); if (o && o.alive && o.fac === 'gerar' && o.city === 'beersheba') o.city = cap; });
        b.owner = 'army'; b.soldiers = Math.max(1000, Math.floor(b.soldiers * 0.5)); b.loy = 70; b.faith += 10;
        t += ' 맹세의 우물 브엘세바가 하나님의 군대에 속했다(26:33).';
      }
    }
    if (EPAT.settle(G, 'beersheba', 1000, 70)) t += ' 이삭이 브엘세바에 장막을 치고 우물을 팠다(26:23-25).';
    G.flags.beershebaOath = true;
    return t;
  },
  // 하란에서 야곱의 온 집이 합류한다 (29–31장)
  family: G => {
    const home = EPAT.own(G, 'mahanaim') ? 'mahanaim' : null;
    return ['레아', '라헬'].concat(EPAT.SONS).filter(n => EPAT.raise(G, n, home)).length;
  },
  // 마하나임 — 하나님의 군대 (32:1-2)
  mahanaim: (G, extra) => {
    const settled = EPAT.settle(G, 'mahanaim', 1500 + (extra || 0), 80);
    if (!settled && EPAT.own(G, 'mahanaim')) { const m = G.city('mahanaim'); m.soldiers += 1000 + (extra || 0); m.faith += 10; }
    if (G.exists('army')) G.fac('army').name = '마하나임 하나님의 군대';
    ['야곱', '레아', '라헬'].forEach(n => { const o = G.o(n); if (o && o.alive && o.fac === 'army' && EPAT.own(G, 'mahanaim')) o.city = 'mahanaim'; });
    G.flags.mahanaim = true;
    return settled ? ' 야곱이 그 땅 마하나임에 진을 쳤다(마하나임을 얻었다).' : '';
  },
  // 세겜의 일 (34:25-31)
  shechem: (G, keep) => {
    ['하몰', '세겜'].forEach(n => G.kill(n));
    const c = G.city('shechem');
    if (G.exists('canaan_shechem')) { G.eachCity('canaan_shechem', x => { x.owner = null; x.soldiers = 200; x.loy = 20; }); G.fac('canaan_shechem').alive = false; }
    if (keep && G.exists('army')) { c.owner = 'army'; c.soldiers = 1500; c.loy = 20; }
    ['시므온', '레위'].forEach(n => EPAT.stat(G, n, 'fai', -10));
    ['gerar', 'salem', 'sodom', 'edom', 'haran'].forEach(f => { if (G.exists(f)) G.rel('army', f, keep ? -20 : -10); });
    G.flags.shechemSword = true;
  },
  // 베냐민의 출생, 라헬과 이삭의 죽음 (35:16-29)
  bethlehem: G => {
    const settled = EPAT.settle(G, 'bethlehem', 800, 70);
    const ben = EPAT.raise(G, '베냐민', EPAT.own(G, 'bethlehem') ? 'bethlehem' : null);
    G.kill('라헬'); G.kill('이삭');
    if (G.exists('edom')) G.rel('army', 'edom', 10);
    G.flags.twelve = true;
    return '벧엘을 떠나 에브랏에 이르기 전, 라헬이 난산 끝에 아들을 낳고 숨을 거두며 그 이름을 베노니라 했으나 야곱은 베냐민이라 불렀다(35:16-18). ' + (ben ? '베냐민이 합류해 열두 아들이 찼다. ' : '') + '야곱이 베들레헴 길에 라헬의 묘비를 세웠다(35:19-20)' + (settled ? ' — 베들레헴에 장막을 쳤다' : '') + '. 이삭은 백팔십 세에 죽어 에서와 야곱이 함께 그를 장사했다(35:28-29; 에돔과의 관계 +10).';
  },
  // 요셉이 애굽으로 팔려 간다 (37:28, 36)
  sell: G => {
    if (!G.alive('요셉')) return '';
    if (G.exists('egypt')) { G.join('요셉', 'egypt', EPAT.on(G, 'memphis') ? 'memphis' : G.fac('egypt').capital); return ' 요셉이 애굽 바로의 친위대장 보디발의 집으로 팔려 갔다(요셉은 애굽 세력으로).'; }
    return '';
  },
  // 고센 땅 (47:1-12)
  goshen: G => {
    let t = '';
    if (EPAT.on(G, 'goshen') && G.exists('army')) {
      const g = G.city('goshen');
      if (g.owner !== 'army' && (!g.owner || g.owner === 'egypt')) { g.owner = 'army'; g.soldiers = Math.max(g.soldiers, 2500); g.loy = 85; g.faith += 20; t += ' 바로가 "애굽 땅이 네 앞에 있으니 땅의 좋은 곳에 거주하게 하라. 그들이 고센 땅에 거주하게 하라" 하였다(47:6) — 고센이 하나님의 군대의 땅이 되었다.'; }
      else if (g.owner === 'army') { g.soldiers += 1500; g.loy += 10; t += ' 고센에 야곱의 온 집이 모여 살았다(고센 병력 +1500).'; }
      const here = g.owner === 'army' ? 'goshen' : undefined;
      if (G.alive('요셉') && G.facOf('요셉') !== 'army') { G.join('요셉', 'army', here); t += ' 요셉이 형제들과 함께 하나님의 군대에 돌아왔다(애굽의 총리 자리는 그대로이다).'; }
      ['야곱', '베냐민'].forEach(n => { const o = G.o(n); if (o && o.alive && o.fac === 'army' && here) o.city = here; });
    }
    if (G.exists('egypt')) { G.rel('army', 'egypt', 60); G.fac('egypt').aggr = 0; }
    G.flags.goshen = true;
    return t;
  },
};

SCENARIOS.push({
  id: 'e_patriarchs',
  title: '족장 시대',
  year: 2090,
  ref: '창세기 12–50장; 히브리서 11:8-22',
  intro: '"너는 너의 고향과 친척과 아버지의 집을 떠나 내가 네게 보여 줄 땅으로 가라" (창 12:1). 일흔다섯 살의 아브람이 하란을 떠나 헤브론 마므레 상수리나무 숲에 장막을 쳤다. 아브라함·이삭·야곱·요셉 사대 약 이백 년을 한 시대로 압축했다. 야곱은 하란에서 돌아오는 길에 하나님의 사자들을 만나 "이는 하나님의 군대라" 하고 그 곳을 마하나임이라 불렀다 (창 32:1-2) — 이 게임의 플레이어 세력 "마하나임 하나님의 군대"가 그 이름을 딴 것이다. 성경의 역사에서 족장들은 성을 빼앗는 정복자가 아니라 장막에 거하는 나그네였다(히 11:9). 이 게임에서는 그들이 이끄는 무리를 하나의 군대로 삼아, 엘람 왕 그돌라오멜의 원정군을 단까지 쫓고, 제단과 우물과 언약으로 약속의 땅에 머물며, 마지막에는 기근 속 애굽에서 요셉의 지혜로 고센 땅을 얻는다.',
  words: ['fear_not', 'mahanaim'],
  factions: [
    { id: 'army', name: '하나님의 군대', ruler: '아브라함', color: '#e2b04a', capital: 'hebron', gold: 800, food: 9000, aggr: 0.15,
      desc: '마하나임 하나님의 군대. 이 시대에는 성을 쌓지 않고 장막에 거하는 유목 족속이다. 가축과 은과 금이 풍부하고(13:2) 집에서 길리고 훈련된 자 318명이 있다(14:14). 헤브론 마므레 상수리나무 숲과 벧엘 동쪽 제단 곁에 장막을 쳤다. 아브라함 → 이삭 → 야곱 → 요셉이 사건을 따라 차례로 이끌고, 야곱이 마하나임에서 하나님의 군대를 본 뒤 "마하나임 하나님의 군대"라 불린다.',
      cities: { hebron: 5000, bethel: 2500 } },
    { id: 'salem', name: '살렘', ruler: '멜기세덱', color: '#8f86a8', capital: 'jerusalem', gold: 800, food: 5000, aggr: 0,
      desc: '살렘 왕이요 지극히 높으신 하나님의 제사장 멜기세덱의 성, 훗날의 예루살렘 (14:18; 시 76:2). 싸움보다 축복을 베푸는 "의의 왕, 평강의 왕" (히 7:2). 하나님의 군대의 벗이다.',
      cities: { jerusalem: 2000 } },
    { id: 'gerar', name: '그랄', ruler: '아비멜렉', color: '#c9573f', capital: 'gaza', gold: 1200, food: 7000, aggr: 0.05,
      desc: '네겝 서쪽 그랄의 왕 아비멜렉과 군대 장관 비골. 지도에 그랄이 없어 가까운 해안 성 가사로 대신한다. 브엘세바의 우물들을 두고 아브라함·이삭의 목자들과 다투었다 (21:25; 26:15-22). 성경은 이들을 "블레셋 사람"이라 부르지만(26:1), 훗날의 블레셋과 같은 무리인지는 학자들 사이에 견해가 나뉜다.',
      cities: { gaza: 3500, beersheba: 1800 } },
    { id: 'sodom', name: '소돔 (요단 온 들)', ruler: '소돔 왕 베라', color: '#9a6fbf', capital: 'jericho', gold: 1500, food: 9000, aggr: 0.04,
      desc: '"여호와의 동산 같고 애굽 땅과 같이" 물이 넉넉한 요단 온 들의 다섯 성읍 — 소돔·고모라·아드마·스보임·벨라(소알) (13:10; 14:2). 소돔의 자리는 사해 남쪽(또는 북쪽)으로 보는 견해가 나뉘며, 지도에 없어 요단 들의 성 여리고로 대신한다. 소돔 사람은 악하여 여호와 앞에 큰 죄인이었다 (13:13).',
      cities: { jericho: 3000 } },
    { id: 'canaan_shechem', name: '세겜 (히위 족속)', ruler: '하몰', color: '#5ea67c', capital: 'shechem', gold: 700, food: 5000, aggr: 0.03,
      desc: '히위 족속 하몰과 그의 아들 세겜이 다스리는 가나안의 성. 아브람이 처음 제단을 쌓은 모레 상수리나무가 이 곁에 있고(12:6-7), 훗날 야곱이 이 성 앞에서 밭을 산다 (33:18-20).',
      cities: { shechem: 2500 } },
    { id: 'edom', name: '세일 (에서의 족속)', ruler: '에서', color: '#b5804f', capital: 'bozrah', gold: 700, food: 5000, aggr: 0.06,
      desc: '이삭의 맏아들 에서가 세일 땅 에돔 들에 이룬 족속 (32:3; 36:8). 시대를 압축해 처음부터 보스라에 있다. 장자의 명분과 축복을 빼앗긴 원한을 품고 사백 명을 거느린다 (27:41; 32:6).',
      cities: { bozrah: 2500 } },
    { id: 'haran', name: '하란 (라반의 집)', ruler: '라반', color: '#7aa0a8', capital: 'haran', gold: 1200, food: 7000, aggr: 0.03,
      desc: '밧단아람 하란. 데라가 머물다 죽은 곳이요(11:31-32), 아브라함의 동생 나홀의 성이다(24:10). 브두엘의 아들 라반이 집안을 다스린다. 리브가·레아·라헬과 야곱의 열한 아들이 이 땅에서 나왔다. 야곱은 이 집에서 이십 년을 섬겼고, 라반은 그의 품삯을 열 번이나 바꾸었다 (31:41).',
      cities: { haran: 3000 } },
    { id: 'elam', name: '엘람 (동방 연합)', ruler: '그돌라오멜', color: '#6f8fd8', capital: 'susa', gold: 1500, food: 9000, aggr: 0.15,
      desc: '엘람 왕 그돌라오멜과 엘라살 왕 아리옥, 고임 왕 디달의 연합 (14:1-4). 엘람의 도읍은 수사. 요단 들의 다섯 왕을 열두 해 동안 섬기게 했다. 그돌라오멜은 엘람식 이름 "쿠두르-라가마르(라가마르 여신의 종)"로 풀이되지만 그 왕을 직접 기록한 비문은 아직 발견되지 않았다. 엘라살(라르사로 보는 견해가 있다)과 고임("여러 민족")이 어디인지는 확실하지 않다. 게임에서는 서쪽 원정군이 다메섹과 단에 진을 쳤다 — 아브람이 그들을 단까지 쫓아가 다메섹 왼편 호바까지 쳤다 (14:14-15).',
      cities: { susa: 6000, damascus: 4000, dan: 2000 } },
    { id: 'babylon', name: '시날 (바벨론)', ruler: '아므라벨', color: '#5b6fb0', capital: 'babylon', gold: 1500, food: 9000, aggr: 0.05,
      desc: '시날 왕 아므라벨. 시날은 바벨과 우르가 있는 메소포타미아 남부 평야다 (창 10:10; 11:2, 28). 한때 아므라벨을 함무라비와 같은 인물로 보았으나 오늘날 대부분의 학자는 이름과 연대가 맞지 않는다고 본다. 갈대아 우르는 아브라함이 떠나온 고향이다 (11:31; 15:7).',
      cities: { babylon: 5000, ur: 3000 } },
    { id: 'egypt', name: '애굽', ruler: '바로', color: '#c79a3a', capital: 'memphis', gold: 4000, food: 30000, aggr: 0.01,
      desc: '나일 강의 나라 애굽. 성경은 아브라함과 요셉 시대 바로의 이름을 기록하지 않는다 ("바로"는 "큰 집"이라는 뜻의 왕의 칭호). 이른 연대를 따르면 아브라함은 제11왕조 무렵, 요셉은 중왕국 제12왕조(세누스레트 2세·3세 무렵)에 총리가 되었다는 견해가 있고, 셈족 출신 힉소스 왕조(BC 1650년 무렵 이후) 때로 보는 견해도 있다. 중왕국의 도읍 이치타위는 멤피스 가까이에 있었다 — 지도에서는 멤피스. 고센은 삼각주 동쪽의 목초지다.',
      cities: { memphis: 12000, thebes: 8000, tanis: 5000, goshen: 1500 } },
  ],
  // 나머지는 가나안 족속과 브리스 족속의 작은 성읍들(12:6; 13:7)과 먼 나라의 성들이다.
  neutral: { tyre: 3000, sidon: 3000, hazor: 2500, megiddo: 2500, bethshean: 2000, ramoth: 2000, mahanaim: 1200, joppa: 1800, shiloh: 1500,
    rabbah: 2500, ekron: 2000, ashdod: 2500, bethlehem: 1500, gath: 2500, ashkelon: 2000, dibon: 1800, kirhareseth: 2500, lachish: 2500,
    heshbon: 2000, edrei: 2000, kadesh: 800, sinai: 400, midian: 2000, hamath: 3000, carchemish: 3500, tarsus: 2500, hattusa: 4000,
    kittim: 2000, nineveh: 3500, ashur: 3500 },
  // 이 시대에 아직 없거나(사마리아·알렉산드리아·안디옥), 성경 이야기 밖의 먼 성들은 숨긴다.
  hide: ['alexandria', 'antioch', 'samaria', 'gibeah', 'rome', 'pella', 'athens', 'sardis', 'ephesus'],
  officers: [
    ['아브라함', 68, 85, 78, 92, 99, 'army', 'hebron', '데라의 아들, 믿음의 조상. 갈 바를 알지 못하고 부르심에 순종하여 나아갔다. "너는 복이 될지라".', '창 12:1-4; 15:6; 히 11:8-10'],
    ['사라', 15, 75, 70, 88, 88, 'army', 'hebron', '아브라함의 아내 사래. 경수가 끊어진 뒤 웃었으나, 약속하신 이를 미쁘신 줄 알고 아들을 낳았다.', '창 17:15-19; 18:12; 21:1-7; 히 11:11'],
    ['롯', 45, 58, 62, 60, 55, 'army', 'bethel', '아브라함의 조카, 하란의 아들. 요단 온 들을 바라보고 소돔으로 옮겨 갔다. "무법한 자들의 음란한 행실로 말미암아 고통 당하는 의로운 롯".', '창 12:5; 13:10-12; 벧후 2:7'],
    ['엘리에셀', 55, 82, 80, 70, 88, 'army', 'hebron', '다메섹 사람, 아브라함 집의 상속자가 될 뻔한 종. 이삭의 신부를 찾아 나홀의 성으로 간 늙은 종으로 전해진다.', '창 15:2-3; 24:2-27'],
    ['하갈', 10, 55, 45, 62, 65, 'army', 'hebron', '사래의 애굽 여종, 이스마엘의 어머니. 광야 샘물 곁에서 "나를 살피시는 하나님"을 만났다.', '창 16:1-13; 21:14-19'],
    ['이스마엘', 78, 45, 40, 55, 45, 'army', 'hebron', '하갈이 낳은 아브라함의 아들. 활 쏘는 자가 되었고, 하나님이 그도 큰 민족이 되게 하셨다.', '창 16:11-12; 17:20; 21:13, 20'],
    ['마므레', 70, 50, 52, 60, 50, null, 'hebron', '아모리 족속, 에스골과 아넬의 형제. 아브람과 동맹하여 그의 장막이 그 상수리나무 숲에 있었다.', '창 13:18; 14:13, 24'],
    ['에스골', 72, 45, 45, 55, 45, null, 'hebron', '마므레의 형제, 아브람의 아모리 동맹. 네 왕을 쫓는 길에 함께 갔다.', '창 14:13, 24'],
    ['아넬', 70, 45, 45, 55, 45, null, 'hebron', '마므레의 형제, 아브람의 아모리 동맹. 전리품 가운데 자기 몫을 받았다.', '창 14:13, 24'],
    ['이삭', 35, 70, 74, 72, 93, null, 'hebron', '약속의 아들, 이름의 뜻은 "웃음". 모리아 산에 번제 나무를 지고 올랐고, 그랄에서 다투지 않고 우물을 팠다.', '창 21:1-7; 22:6-8; 26:17-25'],
    ['야곱', 62, 90, 80, 78, 80, null, 'hebron', '이삭의 둘째 아들, 형의 발꿈치를 잡은 자. 벧엘에서 사닥다리를 보고, 마하나임에서 하나님의 군대를 만나고, 얍복 강에서 이스라엘이 되었다.', '창 25:26; 28:10-22; 32:1-2, 24-30'],
    ['리브가', 12, 86, 72, 86, 82, null, 'haran', '브두엘의 딸, 라반의 누이. 우물가에서 약대들에게까지 물을 길어 주고 "가겠나이다" 하여 이삭의 아내가 되었다.', '창 24:15-67; 25:21-28'],
    ['라헬', 10, 72, 60, 92, 70, null, 'haran', '라반의 작은딸, 곱고 아리따운 목녀. 요셉과 베냐민의 어머니.', '창 29:9-18; 30:22-24; 35:16-20'],
    ['레아', 10, 72, 68, 70, 86, null, 'haran', '라반의 큰딸. "이제는 내가 여호와를 찬송하리로다" 하며 유다를 낳았다. 막벨라 굴에 장사되었다.', '창 29:16-35; 49:31'],
    ['르우벤', 68, 55, 50, 62, 60, null, 'haran', '야곱의 장자. 물의 끓음 같이 안정이 없었으나 요셉을 구덩이에서 건지려 했다.', '창 29:32; 37:21-22; 49:3-4'],
    ['시므온', 86, 55, 40, 42, 32, null, 'haran', '레아의 둘째 아들. 레위와 함께 세겜에서 칼을 휘둘렀다. "그들의 칼은 폭력의 도구로다".', '창 29:33; 34:25; 49:5-7'],
    ['레위', 84, 60, 45, 45, 38, null, 'haran', '레아의 셋째 아들. 세겜의 일로 저주를 받았으나, 훗날 그 자손이 여호와 편에 서서 제사장 지파가 된다.', '창 29:34; 34:25; 49:5-7; 출 32:26-29'],
    ['유다', 85, 72, 74, 88, 72, null, 'haran', '레아의 넷째 아들. 베냐민 대신 종이 되겠다고 나섰다. "홀이 유다를 떠나지 아니하며" — 사자 새끼 같은 형제들의 지도자.', '창 29:35; 44:18-34; 49:8-10'],
    ['단', 70, 65, 55, 55, 55, null, 'haran', '라헬의 여종 빌하의 아들. "하나님이 나의 억울함을 푸셨다". 길의 뱀 같은 재판관.', '창 30:5-6; 49:16-17'],
    ['납달리', 72, 58, 50, 62, 60, null, 'haran', '빌하의 둘째 아들. "놓인 암사슴이라 아름다운 소리를 발하는도다".', '창 30:7-8; 49:21'],
    ['갓', 78, 50, 45, 55, 55, null, 'haran', '레아의 여종 실바의 아들. "군대가 그를 급격하나 그는 도리어 그 뒤를 급격하리로다".', '창 30:10-11; 49:19'],
    ['아셀', 55, 58, 70, 62, 60, null, 'haran', '실바의 둘째 아들, "기쁨". "그 먹을 것은 기름진 것이라 그가 왕의 수라상을 차리리로다".', '창 30:12-13; 49:20'],
    ['잇사갈', 62, 62, 68, 50, 60, null, 'haran', '레아의 다섯째 아들. "양의 우리 사이에 꿇어앉은 건장한 나귀로다".', '창 30:17-18; 49:14-15'],
    ['스불론', 60, 60, 70, 58, 60, null, 'haran', '레아의 여섯째 아들. "해변에 거주하리니 그 곳은 배 매는 해변이라".', '창 30:19-20; 49:13'],
    ['요셉', 60, 95, 95, 90, 96, null, 'haran', '라헬의 맏아들, 채색옷을 입은 꿈꾸는 자. 애굽에 팔려 가 총리가 되었다. "당신들은 나를 해하려 하였으나 하나님은 그것을 선으로 바꾸사".', '창 30:22-24; 37:3-11; 41:39-44; 50:20'],
    ['베냐민', 76, 55, 50, 65, 70, null, 'bethlehem', '라헬이 에브랏(베들레헴) 길에서 낳고 숨을 거둔 막내. 베노니라 불렸으나 야곱이 "오른손의 아들"이라 했다.', '창 35:16-18; 49:27'],
    ['라반', 50, 82, 72, 55, 30, 'haran', 'haran', '브두엘의 아들, 하란의 라반. 야곱의 품삯을 열 번이나 바꾸었고, 길르앗 미스바에서 야곱과 돌무더기 언약을 맺었다.', '창 24:29; 29:15-30; 31:41-55'],
    ['브두엘', 35, 60, 62, 55, 45, 'haran', 'haran', '나홀과 밀가의 아들, 리브가와 라반의 아버지. "이 일이 여호와께로 말미암았으니" 하고 리브가를 보냈다.', '창 22:22-23; 24:50-51'],
    ['에서', 90, 40, 50, 70, 30, 'edom', 'bozrah', '이삭의 맏아들, 붉고 털이 많은 익숙한 사냥꾼. 팥죽 한 그릇에 장자의 명분을 팔았으나 끝내 아우를 안고 울었다. 에돔의 조상.', '창 25:25-34; 33:4; 36:8'],
    ['엘리바스', 60, 55, 55, 50, 25, 'edom', 'bozrah', '에서의 맏아들, 데만 족속의 조상.', '창 36:4, 10-11'],
    ['아비멜렉', 60, 76, 78, 72, 55, 'gerar', 'gaza', '그랄 왕. 꿈에 하나님의 경고를 듣고 사라를 돌려보냈고, 브엘세바에서 아브라함·이삭과 언약을 맺었다.', '창 20:1-18; 21:22-34; 26:26-31'],
    ['비골', 82, 55, 45, 50, 30, 'gerar', 'beersheba', '아비멜렉의 군대 장관. 왕과 함께 와서 우물의 언약을 맺었다.', '창 21:22, 32; 26:26'],
    ['아훗삿', 40, 68, 70, 62, 30, 'gerar', 'gaza', '아비멜렉의 친구. 왕과 비골과 함께 브엘세바로 이삭을 찾아왔다.', '창 26:26'],
    ['멜기세덱', 30, 92, 88, 92, 99, 'salem', 'jerusalem', '살렘 왕이요 지극히 높으신 하나님의 제사장. 떡과 포도주를 가지고 나와 아브람을 축복했다. "의의 왕, 평강의 왕".', '창 14:18-20; 시 110:4; 히 7:1-3'],
    ['소돔 왕 베라', 50, 55, 60, 45, 5, 'sodom', 'jericho', '요단 들 다섯 왕 가운데 소돔의 왕. "사람은 내게 보내고 물품은 네가 가지라" 했다.', '창 14:2, 17, 21'],
    ['고모라 왕 비르사', 55, 45, 50, 40, 5, 'sodom', 'jericho', '고모라의 왕. 싯딤 골짜기 역청 구덩이에서 네 왕에게 패했다.', '창 14:2, 10'],
    ['아드마 왕 시납', 50, 40, 45, 40, 5, 'sodom', 'jericho', '아드마의 왕. 요단 들 다섯 왕 가운데 하나.', '창 14:2, 8; 신 29:23'],
    ['스보임 왕 세메벨', 52, 40, 45, 40, 5, 'sodom', 'jericho', '스보임의 왕. 요단 들 다섯 왕 가운데 하나.', '창 14:2, 8; 호 11:8'],
    ['그돌라오멜', 85, 70, 65, 60, 5, 'elam', 'susa', '엘람 왕. 요단 들의 다섯 왕을 열두 해 동안 섬기게 한 동방 연합의 맹주.', '창 14:1-5, 17'],
    ['아리옥', 80, 50, 45, 45, 5, 'elam', 'damascus', '엘라살 왕. 동방 연합의 네 왕 가운데 하나. 엘라살이 어디인지는 확실하지 않다.', '창 14:1, 9'],
    ['디달', 78, 45, 40, 45, 5, 'elam', 'dan', '고임(여러 민족)의 왕. 동방 연합의 네 왕 가운데 하나.', '창 14:1, 9'],
    ['아므라벨', 75, 68, 66, 55, 5, 'babylon', 'babylon', '시날 왕. 그돌라오멜과 함께 요단 들을 친 동방의 왕.', '창 14:1, 9'],
    ['하몰', 45, 60, 70, 60, 15, 'canaan_shechem', 'shechem', '히위 족속, 세겜 성의 추장. "이 땅이 너희 앞에 있으니 거주하며 매매하며 기업을 얻으라" 했다.', '창 33:19; 34:2, 8-10, 20-24'],
    ['세겜', 60, 45, 45, 55, 10, 'canaan_shechem', 'shechem', '하몰의 아들, 그 땅의 추장. 야곱의 딸 디나에게 큰 잘못을 저질렀다.', '창 34:2-3, 19'],
    ['바로', 55, 72, 85, 70, 10, 'egypt', 'memphis', '애굽 왕. 성경은 그 이름을 기록하지 않는다. 꿈을 꾸고 번민하다가 요셉을 세워 "애굽 온 땅을 총리"하게 했다.', '창 12:15-20; 41:1-45; 47:7-10'],
    ['보디발', 70, 60, 65, 50, 10, 'egypt', 'memphis', '바로의 신하 친위대장. 요셉을 사서 가정 총무로 세웠으나 아내의 거짓말을 듣고 옥에 가두었다.', '창 37:36; 39:1-20'],
    ['술 맡은 관원장', 30, 55, 60, 55, 10, 'egypt', 'memphis', '옥에서 요셉에게 꿈 해석을 듣고도 그를 잊었다가, 바로가 꿈을 꾸자 비로소 요셉을 기억해 냈다.', '창 40:1-23; 41:9-13'],
  ],
  rel: [['army', 'salem', 80], ['army', 'gerar', 60], ['army', 'sodom', 55], ['army', 'elam', 10], ['army', 'babylon', 20], ['army', 'edom', 60],
    ['army', 'canaan_shechem', 60], ['army', 'haran', 60], ['army', 'egypt', 50], ['elam', 'babylon', 85], ['elam', 'sodom', 10], ['elam', 'salem', 20],
    ['gerar', 'edom', 40], ['egypt', 'gerar', 50]],
  goals: { army: ['hebron', 'beersheba', 'bethel', 'shechem', 'mahanaim', 'goshen'] },
  goalText: { army: '나그네로 살며 약속의 땅에 제단을 쌓고 열두 지파를 이룬다. 헤브론·브엘세바·벧엘·세겜·마하나임 — 족장들이 장막을 치고 제단을 쌓고 우물을 판 다섯 곳을 지키고, 기근 속 애굽에서 요셉을 통해 고센 땅을 얻는다 (창 13:14-17; 28:13-15; 47:6; 히 11:9-10). 성경의 역사에서 족장들은 땅을 차지하지 않고 약속을 바라보았다. 이 게임에서는 그 약속의 자리들을 지키는 것을 승리로 삼는다.' },
});

EVENTS.e_patriarchs = [
  { id: 'call', who: 'army', auto: 0,
    cond: G => G.turn >= 1 && G.exists('army'),
    title: '떠나라, 복이 될지라', ref: '창 12:1-20',
    text: '"너는 너의 고향과 친척과 아버지의 집을 떠나 내가 네게 보여 줄 땅으로 가라. 내가 너로 큰 민족을 이루고 네게 복을 주어 네 이름을 창대하게 하리니 너는 복이 될지라… 땅의 모든 족속이 너로 말미암아 복을 얻을 것이라"(12:1-3). 아브람이 세겜 땅 모레 상수리나무에 이르러 제단을 쌓고, 벧엘 동쪽 산에 장막을 치고 또 제단을 쌓아 여호와의 이름을 불렀다. 그런데 그 땅에 기근이 심하게 들었다.',
    choices: [
      { label: '약속의 땅에 머물며 제단 곁에서 여호와의 이름을 부른다', run: G => {
        EPAT.pay(G, 60, 0); EPAT.faithAll(G, 10); EPAT.stat(G, '아브라함', 'fai', 5);
        G.flags.altars = true; EPAT.next(G, 2); G.kingdom(5, '여호와의 이름을 부르다');
        return '금 -60. 하나님의 군대 모든 성의 신앙 +10. "여호와께서 아브람에게 나타나 이르시되 내가 이 땅을 네 자손에게 주리라 하신지라"(12:7). 기근 속에서도 제단의 불은 꺼지지 않았다.'; } },
      { label: '기근을 피해 애굽으로 내려가고, 사래를 누이라 한다', run: G => {
        if (G.exists('army')) { const F = G.fac('army'); F.food += 3000; F.gold += 300; }
        EPAT.faithAll(G, -8); if (G.exists('egypt')) G.rel('army', 'egypt', -10);
        G.flags.egyptLie = true; EPAT.next(G, 2); G.kingdom(-4, '두려움의 거짓말');
        return '식량 +3000, 금 +300 — 바로가 사래 때문에 아브람에게 양과 소와 나귀와 노비를 후대했다(12:16). 그러나 여호와께서 바로의 집에 큰 재앙을 내리셨고, 바로가 "네가 어찌하여 그를 누이라 하였느냐" 꾸짖어 내보냈다(12:17-20). 신앙 -8, 애굽과의 관계 -10. (성경은 이 바로의 이름을 기록하지 않는다.)'; } },
    ] },
  { id: 'lotParts', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'call'),
    title: '롯과 갈라서다', ref: '창 13장',
    text: '아브람과 롯의 소유가 많아 그 땅이 그들의 동거함을 용납하지 못했다. 두 사람의 목자들이 서로 다투었고, 그 때에 가나안 사람과 브리스 사람도 그 땅에 거주하였다(13:6-7). 롯이 눈을 들어 요단 온 들을 바라보니 소알까지 물이 넉넉하여 여호와의 동산 같고 애굽 땅과 같았다.',
    choices: [
      { label: '"네가 좌하면 나는 우하고 네가 우하면 나는 좌하리라" — 롯에게 먼저 고르게 한다', run: G => {
        EPAT.part(G); if (G.exists('sodom')) G.rel('army', 'sodom', 15);
        EPAT.faithAll(G, 5, 5); G.flags.generous = true; EPAT.next(G, 2); G.kingdom(6, '먼저 양보하다');
        return '롯이 요단 온 들을 택하여 소돔 가까이 장막을 옮겼다(롯은 소돔으로). 소돔과의 관계 +15, 신앙·민심 +5. 여호와께서 말씀하셨다. "너는 눈을 들어 너 있는 곳에서 동서남북을 바라보라. 보이는 땅을 내가 너와 네 자손에게 주리니 영원히 이르리라"(13:14-15).'; } },
      { label: '물 넉넉한 요단 들은 어른인 내가 차지하겠다고 다툰다', run: G => {
        EPAT.part(G); if (G.exists('sodom')) G.rel('army', 'sodom', -10);
        EPAT.faithAll(G, 0, -8); EPAT.next(G, 2); G.kingdom(-5, '친족의 다툼');
        return '목자들의 다툼이 친족의 원한이 되었다. 롯은 끝내 장막을 거두어 소돔으로 떠났다(롯은 소돔으로). 소돔과의 관계 -10, 민심 -8. 요단 들은 여전히 소돔 왕의 것이다.'; } },
    ] },
  { id: 'fourKings', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'lotParts'),
    title: '네 왕의 전쟁 — 단까지 쫓아가다', ref: '창 14:1-16',
    text: '엘람 왕 그돌라오멜이 시날 왕 아므라벨, 엘라살 왕 아리옥, 고임 왕 디달과 함께 요단 들의 다섯 왕을 쳤다. 열두 해 동안 그를 섬기다가 제십삼년에 배반한 소돔과 고모라였다. 네 왕이 소돔과 고모라의 재물과 양식을 빼앗고, 소돔에 거주하는 아브람의 조카 롯과 그 재물도 노략하여 떠났다. 도망한 자가 와서 히브리 사람 아브람에게 알렸다. (그돌라오멜의 이름은 엘람어로 풀이되지만, 이 원정을 기록한 메소포타미아 문서는 아직 발견되지 않았다.)',
    choices: [
      { label: '집에서 길리고 훈련된 자 318명을 거느리고 단까지 쫓아간다', run: G => {
        const s = EPAT.sack(G); EPAT.rescue(G);
        EPAT.cut(G, 'elam', 0.35, ['dan']); EPAT.cut(G, 'elam', 0.6, ['damascus']);
        const h = EPAT.home(G); if (h) h.soldiers += 1000;
        G.buff('army', 'atk', 4, 0.3); G.item('army', 'torch', 1);
        EPAT.next(G, 2); G.kingdom(5, '형제를 위하여');
        return s + ' 아브람이 가신들을 나누어 밤에 그들을 쳐부수고 다메섹 왼편 호바까지 쫓아가 모든 빼앗겼던 재물과 롯과 부녀와 인민을 다 찾아왔다(14:14-16). 아모리 동맹 마므레·에스골·아넬이 합류했다(본진 병력 +1000). 단의 엘람 원정군 65%, 다메섹의 원정군 40% 궤멸, 4턴 동안 공격력 +30%, 횃불과 항아리 1을 얻었다. 이 게임에서는 단을 차지하면 원정군을 몰아낸 것으로 본다.'; } },
      { label: '롯이 스스로 택한 길이니 관여하지 않는다', run: G => {
        const s = EPAT.sack(G); if (G.exists('sodom')) G.rel('army', 'sodom', -15);
        EPAT.faithAll(G, -5); G.flags.lotCaptive = true; G.flags.lotRescued = true;
        EPAT.next(G, 2); G.kingdom(-4, '형제를 버려 둠');
        return s + ' 롯은 동방으로 끌려갔다. 소돔과의 관계 -15, 신앙 -5. "친구는 사랑이 끊어지지 아니하고 형제는 위급한 때를 위하여 났느니라"(잠 17:17). 성경의 역사에서 아브람은 망설이지 않고 쫓아갔다.'; } },
    ],
    altWho: 'elam', altText: '단에 진을 친 밤, 히브리 사람 아브람이 가신 318명과 아모리 동맹을 이끌고 뒤쫓아 왔다.',
    altChoices: [
      { label: '노략물을 지키며 맞서 싸운다', run: G => {
        const s = EPAT.sack(G); EPAT.rescue(G); EPAT.cut(G, 'elam', 0.7, ['dan', 'damascus']);
        G.buff('army', 'atk', 3, 0.2); EPAT.next(G, 2);
        return s + ' 그러나 밤에 나뉘어 달려든 아브람의 가신들에게 진이 무너졌다. 호바까지 쫓기며 서쪽 원정군 30%를 잃고 롯과 노략물을 빼앗겼다.'; } },
      { label: '포로와 재물을 돌려주고 수사로 물러난다', run: G => {
        const s = EPAT.sack(G); EPAT.rescue(G); if (G.exists('army')) G.rel('elam', 'army', 20);
        const E = G.fac('elam'); E.gold = Math.max(0, E.gold - 400); EPAT.next(G, 2);
        return s + ' 싸우지 않고 롯과 노략물을 돌려주었다. 금 -400, 하나님의 군대와의 관계 +20.'; } },
    ] },
  { id: 'melchizedek', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'fourKings'),
    title: '살렘 왕 멜기세덱의 축복', ref: '창 14:17-24; 히 7:1-4',
    text: '아브람이 그돌라오멜과 그와 함께 한 왕들을 쳐부수고 돌아올 때에 소돔 왕이 사웨 골짜기 곧 왕의 골짜기로 나와 그를 영접했다. 살렘 왕 멜기세덱이 떡과 포도주를 가지고 나왔으니 그는 지극히 높으신 하나님의 제사장이었다. "천지의 주재시요 지극히 높으신 하나님이여 아브람에게 복을 주옵소서." 소돔 왕이 말했다. "사람은 내게 보내고 물품은 네가 가지라."',
    choices: [
      { label: '모든 것의 십분의 일을 멜기세덱에게 드리고, 소돔의 물품은 실 한 오라기도 취하지 않는다', run: G => {
        const tithe = G.exists('army') ? Math.max(50, Math.floor(G.fac('army').gold / 10)) : 50; EPAT.pay(G, tithe, 0);
        if (G.exists('salem')) G.rel('army', 'salem', 20); if (G.exists('sodom')) G.rel('army', 'sodom', 10);
        EPAT.faithAll(G, 10); EPAT.stat(G, '아브라함', 'cha', 5);
        G.flags.tithe = true; EPAT.next(G, 2); G.kingdom(8, '십분의 일');
        return `"너희 대적을 네 손에 붙이신 지극히 높으신 하나님을 찬송할지로다"(14:20). 금 -${tithe} (십분의 일). 살렘과의 관계 +20, 소돔 +10, 신앙 +10, 아브라함 매력 +5. "네가 말하기를 내가 아브람으로 치부하게 하였다 할까 하여 네게 속한 것은 실 한 오라기나 들메끈 한 가닥도 내가 가지지 아니하리라"(14:23). 함께 간 마므레·에스골·아넬은 자기 몫을 받았다(14:24).`; } },
      { label: '소돔 왕이 내미는 물품을 받는다', run: G => {
        if (G.exists('army')) { const F = G.fac('army'); F.gold += 500; F.food += 2000; }
        if (G.exists('salem')) G.rel('army', 'salem', -10); EPAT.faithAll(G, -6);
        EPAT.next(G, 2); G.kingdom(-5, '소돔의 재물');
        return '금 +500, 식량 +2000. 소돔 왕이 "내가 아브람을 치부하게 하였다" 하고 자랑한다. 살렘과의 관계 -10, 신앙 -6.'; } },
    ] },
  { id: 'torchCovenant', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'melchizedek'),
    title: '두려워하지 말라 — 횃불 언약', ref: '창 15장',
    text: '그 후에 여호와의 말씀이 환상 중에 임했다. "아브람아 두려워하지 말라 나는 너의 방패요 너의 지극히 큰 상급이니라"(15:1). 아브람이 "나는 자식이 없사오니 나의 상속자는 이 다메섹 사람 엘리에셀이니이다" 하자, 여호와께서 그를 밖으로 이끌고 말씀하셨다. "하늘을 우러러 뭇별을 셀 수 있나 보라. 네 자손이 이와 같으리라." 해가 져서 어두울 때에 연기 나는 화로가 보이며 타는 횃불이 쪼갠 고기 사이로 지나갔다(15:17).',
    choices: [
      { label: '약속을 믿는다 — "여호와께서 이를 그의 의로 여기시고"', run: G => {
        EPAT.faithAll(G, 10); const a = G.o('아브라함'); if (a && a.alive) a.fai = 100;
        G.item('army', 'torch', 1); G.flags.covenant = true; G.flags.word_fear_not = true; EPAT.next(G, 2); G.kingdom(8, '믿음이 의로 여겨지다');
        return '"아브람이 여호와를 믿으니 여호와께서 이를 그의 의로 여기시고"(15:6). "내가 이 땅을 애굽 강에서부터 그 큰 강 유브라데까지 네 자손에게 주노니"(15:18). 또 말씀하셨다. "너는 반드시 알라 네 자손이 이방에서 객이 되어 그들을 섬기겠고 그들은 사백 년 동안 네 자손을 괴롭히리니… 네 자손은 사대 만에 이 땅으로 돌아오리니"(15:13-16) — 훗날의 출애굽이다. 신앙 +10, 아브라함 신앙 100, 횃불과 항아리 1을 얻었다. 말씀 "두려워하지 말라"를 받았다.'; } },
      { label: '"주 여호와여 내가 이 땅을 소유로 받을 것을 무엇으로 알리이까" — 엘리에셀을 상속자로 굳힌다', run: G => {
        EPAT.faithAll(G, -4); EPAT.stat(G, '엘리에셀', 'pol', 5);
        EPAT.next(G, 2); G.kingdom(-2, '사람의 계산');
        return '엘리에셀이 집안 살림을 맡았다(정치 +5). 그러나 여호와께서 말씀하셨다. "그 사람이 네 상속자가 아니라 네 몸에서 날 자가 네 상속자가 되리라"(15:4). 약속은 사람의 계산을 기다리지 않는다. 신앙 -4.'; } },
    ] },
  { id: 'sodom', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'torchCovenant'),
    title: '아브라함의 중보와 소돔의 멸망', ref: '창 18–19장',
    text: '마므레 상수리나무 곁 장막 문에 앉은 아브라함에게 세 사람이 찾아왔다. 아브라함이 달려가 영접하고 떡과 송아지를 대접하니 그들이 말했다. "내년 이맘때 사라에게 아들이 있으리라." 떠나며 여호와께서 말씀하셨다. "소돔과 고모라에 대한 부르짖음이 크고 그들의 죄악이 심히 무거우니." 아브라함이 여호와 앞에 그대로 섰다.',
    choices: [
      { label: '"온 세상을 심판하시는 이가 정의를 행하실 것이 아니니이까" — 의인들을 위해 중보한다', run: G => {
        const r = EPAT.overturn(G); EPAT.stat(G, '아브라함', 'cha', 5); EPAT.faithAll(G, 8);
        G.flags.intercede = true; EPAT.next(G, 3); G.kingdom(8, '의인을 위한 중보');
        return '아브라함이 오십 명에서 열 명까지 여섯 번 구했고, 여호와께서 "열 명으로 말미암아 멸하지 아니하리라" 하셨다(18:23-32). 그러나 그 성에는 의인 열 명이 없었다. ' + r + ' "하나님이 아브라함을 생각하사 롯을 그 엎으시는 중에서 내보내셨더라"(19:29). 신앙 +8, 아브라함 매력 +5.'; } },
      { label: '심판은 여호와께 맡기고 잠잠히 장막으로 돌아간다', run: G => {
        const r = EPAT.overturn(G); EPAT.faithAll(G, 2); EPAT.next(G, 3); G.kingdom(1);
        return r + ' 이튿날 아침 아브라함이 소돔과 고모라를 바라보니 그 땅의 연기가 옹기 가마의 연기 같이 치솟았다(19:27-28). 신앙 +2.'; } },
    ] },
  { id: 'isaac', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'sodom'),
    title: '이삭의 출생과 모리아 산', ref: '창 21:1-21; 22:1-19; 히 11:17-19',
    text: '여호와께서 말씀하신 대로 사라를 돌보셨다. 아브라함이 백 세에 아들을 낳아 이름을 이삭이라 하니, 사라가 "하나님이 나를 웃게 하시니 듣는 자가 다 나와 함께 웃으리로다" 하였다(21:6). 하갈과 이스마엘은 브엘세바 광야로 떠났으나 하나님이 샘물을 보이시고 그 아이와 함께 계셨다(21:14-20). 그 일 후에 하나님이 아브라함을 시험하셨다. "네 아들 네 사랑하는 독자 이삭을 데리고 모리아 땅으로 가라." 산을 오르며 이삭이 물었다. "불과 나무는 있거니와 번제할 어린 양은 어디 있나이까?" 아브라함이 대답했다. "하나님이 자기를 위하여 친히 준비하시리라"(22:7-8).',
    choices: [
      { label: '"여호와 이레" — 하나님이 준비하심을 믿고 산에 오른다', run: G => {
        const joined = EPAT.raise(G, '이삭', 'hebron');
        ['하갈', '이스마엘'].forEach(n => { const o = G.o(n); if (o && o.alive && o.fac === 'army') { o.fac = null; o.city = 'beersheba'; } });
        EPAT.faithAll(G, 12); EPAT.stat(G, '이삭', 'fai', 5);
        G.flags.moriah = true; EPAT.next(G, 2); G.kingdom(10, '여호와 이레');
        return '아브라함이 손을 내밀어 칼을 잡으려 할 때 여호와의 사자가 하늘에서 불렀다. "그 아이에게 네 손을 대지 말라. 네가 네 아들 네 독자까지도 내게 아끼지 아니하였으니 내가 이제야 네가 하나님을 경외하는 줄을 아노라." 수풀에 뿔이 걸린 숫양이 있었다. 아브라함이 그 땅 이름을 여호와 이레라 하였다(22:12-14). "네 씨로 말미암아 천하 만민이 복을 받으리니"(22:18). ' + (joined ? '이삭이 군대에 합류했다. ' : '') + '하갈과 이스마엘은 브엘세바 광야로 떠났다(재야). 신앙 +12, 이삭 신앙 +5.'; } },
    ] },
  { id: 'machpelah', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'isaac'),
    title: '막벨라 굴과 리브가', ref: '창 23장; 24장; 25:7-10',
    text: '사라가 백이십칠 세에 헤브론에서 죽으니 아브라함이 슬퍼하며 애통했다. 그가 헷 족속에게 말했다. "나는 당신들 중에 나그네요 거류하는 자니 당신들 중에서 내게 매장할 소유지를 주어 나로 내 죽은 자를 장사하게 하시오"(23:4). 헷 사람 에브론이 "그 밭을 당신에게 드리고 그 속의 굴도 내가 당신에게 드리나이다" 하였다. 한편 아브라함의 늙은 종이 하란 나홀의 성 우물가에서 기도하니, 리브가가 나와 약대들에게까지 물을 길어 주었다(24:10-20).',
    choices: [
      { label: '"그 밭 값을 당신에게 주리니" — 은 사백 세겔을 달아 값을 온전히 치른다', run: G => {
        EPAT.pay(G, 400, 0);
        if (EPAT.own(G, 'hebron')) { const h = G.city('hebron'); h.loy += 15; h.faith += 5; }
        G.flags.paidFull = true; const t = EPAT.bury(G); EPAT.next(G, 2); G.kingdom(6, '나그네의 값');
        return '아브라함이 상인이 통용하는 은 사백 세겔을 달아 에브론에게 주었다(23:16). 금 -400, 헤브론 민심 +15. 막벨라 밭과 굴이 헷 족속 앞에서 아브라함의 매장할 소유로 확정되었다 — 약속의 땅에서 그가 가진 첫 땅이다(23:17-20). ' + t + ' 이삭이 군대를 이끈다.'; } },
      { label: '에브론이 거저 주겠다는 말을 받아들인다', run: G => {
        const t = EPAT.bury(G); EPAT.next(G, 2); G.kingdom(1);
        return '밭과 굴을 선물로 받았다. 값을 치르지 않은 땅은 훗날 "헷 사람이 준 땅"이라 불릴 것이다. ' + t + ' 이삭이 군대를 이끈다.'; } },
    ] },
  { id: 'wells', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'machpelah'),
    title: '르호봇 — 그랄의 우물과 브엘세바 언약', ref: '창 26:12-33; 21:22-34',
    text: '이삭이 그 땅에서 농사하여 그 해에 백 배나 얻었다. 그랄 사람들이 그를 시기하여 아브라함 때에 판 우물들을 다 흙으로 메웠고, 그랄 목자들이 "이 물은 우리의 것이라" 하며 새로 판 우물마다 다투었다. 이삭이 그 우물들의 이름을 에섹(다툼), 싯나(대적함)라 하였다(26:12-21).',
    choices: [
      { label: '다투지 않고 옮겨 가서 또 우물을 판다', run: G => {
        const t = EPAT.wellsPeace(G); EPAT.stat(G, '이삭', 'cha', 5);
        EPAT.next(G, 3); G.kingdom(8, '르호봇');
        return t + ' 이삭 매력 +5.'; } },
      { label: '"이 물은 우리의 것이라" — 목자들을 무장시켜 우물을 지킨다', run: G => {
        G.buff('army', 'atk', 3, 0.15); if (G.exists('gerar')) G.rel('army', 'gerar', -20);
        EPAT.faithAll(G, 0, -5); EPAT.next(G, 3); G.kingdom(-5, '우물 다툼');
        return '우물마다 칼이 섰다. 그랄과의 관계 -20, 3턴 동안 공격력 +15%, 민심 -5. 브엘세바는 여전히 다툼의 우물이다. 성경의 역사에서 이삭은 다투지 않고 옮겨 갔다.'; } },
    ],
    altWho: 'gerar', altText: '이삭의 목자들이 그랄 골짜기에 장막을 치고 아브라함 때의 옛 우물들을 다시 팠다. 그의 양과 소가 떼를 이루니 백성이 시기한다.',
    altChoices: [
      { label: '"우리를 떠나라" 한 뒤, 브엘세바로 찾아가 언약을 맺는다', run: G => { const t = EPAT.wellsPeace(G); EPAT.next(G, 3); return t; } },
      { label: '우물을 메우고 목자들을 내쫓는다', run: G => {
        if (G.exists('army')) G.rel('gerar', 'army', -20); G.buff('gerar', 'atk', 2, 0.1); EPAT.next(G, 3);
        return '그랄 목자들이 우물을 흙으로 메웠다. 하나님의 군대와의 관계 -20, 2턴 동안 공격력 +10%.'; } },
    ] },
  { id: 'ladder', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'wells'),
    title: '벧엘의 사닥다리', ref: '창 25:27-34; 27장; 28:10-22',
    text: '이삭이 늙어 눈이 어두웠다. 어머니 리브가의 계략으로 둘째 야곱이 형 에서의 옷을 입고 장자의 축복을 받자, 에서가 마음에 이르기를 "아버지를 곡할 때가 가까웠은즉 내가 내 아우 야곱을 죽이리라" 하였다(27:41). 야곱이 브엘세바를 떠나 하란으로 가다가 한 곳에서 돌 하나를 베개로 삼고 잤다. 꿈에 사닥다리가 땅 위에 서 있는데 그 꼭대기가 하늘에 닿았고 하나님의 사자들이 오르락내리락하였다. "내가 너와 함께 있어 네가 어디로 가든지 너를 지키며 너를 이끌어 이 땅으로 돌아오게 할지라"(28:15).',
    choices: [
      { label: '"여호와께서 과연 여기 계시거늘" — 돌베개를 기둥으로 세워 기름을 붓고 십분의 일을 서원한다', run: G => {
        const led = EPAT.raise(G, '야곱', 'bethel', true); EPAT.stat(G, '야곱', 'fai', 10);
        EPAT.faithAll(G, 8); if (G.exists('edom')) G.rel('army', 'edom', -10);
        if (EPAT.own(G, 'bethel')) G.city('bethel').faith += 15;
        G.item('army', 'anointing_horn', 1);
        G.flags.bethelVow = true; EPAT.next(G, 2); G.kingdom(8, '벧엘의 서원');
        return '야곱이 베개로 삼았던 돌을 가져다가 기둥으로 세우고 그 위에 기름을 붓고(28:18), 그 곳 이름을 벧엘(하나님의 집)이라 하고 서원했다. "하나님께서 내게 주신 모든 것에서 십분의 일을 내가 반드시 하나님께 드리겠나이다"(28:20-22). ' + (led ? '야곱이 군대를 이끈다(이삭은 늙어 장막에 머문다). ' : '') + '신앙 +8, 벧엘 신앙 +15, 야곱 신앙 +10, 에돔(에서)과의 관계 -10. 기름 뿔 1을 얻었다.'; } },
      { label: '형의 칼이 두려워 서원도 없이 하란으로 서둘러 달아난다', run: G => {
        const led = EPAT.raise(G, '야곱', 'bethel', true); if (G.exists('edom')) G.rel('army', 'edom', -20);
        EPAT.faithAll(G, -3); EPAT.next(G, 2); G.kingdom(-2);
        return (led ? '야곱이 군대를 이끈다. ' : '') + '그러나 벧엘의 돌베개는 그대로 버려졌다. 에돔(에서)과의 관계 -20, 신앙 -3.'; } },
    ] },
  { id: 'laban', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'ladder'),
    title: '하란의 이십 년과 미스바 언약', ref: '창 29–31장',
    text: '하란에서 이십 년, 야곱은 라반의 두 딸 레아와 라헬을 위해 십사 년, 양 떼를 위해 육 년을 섬겼고 라반은 그의 품삯을 열 번이나 바꾸었다(31:41). 그 사이 열한 아들이 태어났다. 여호와께서 "네 조상의 땅, 네 족속에게로 돌아가라. 내가 너와 함께 있으리라" 하셨다(31:3). 야곱이 온 집을 이끌고 몰래 떠나자, 라반이 칠 일 길을 쫓아와 길르앗 산에서 그를 따라잡았다. 그 밤 하나님이 꿈에 라반에게 이르셨다. "너는 삼가 야곱에게 선악 간에 말하지 말라"(31:24).',
    choices: [
      { label: '돌무더기를 쌓고 언약한다 — "여호와께서 나와 너 사이를 살피시옵소서"', run: G => {
        const n = EPAT.family(G); if (G.exists('haran')) { G.rel('army', 'haran', 30); G.fac('haran').aggr = 0; }
        EPAT.faithAll(G, 5); G.flags.mizpah = true; EPAT.next(G, 2); G.kingdom(6, '미스바 언약');
        return `레아와 라헬과 열한 아들이 합류했다 (${n}명). 야곱과 라반이 돌을 모아 무더기를 이루고 그 이름을 여갈사하두다와 갈르엣이라 하였다. "우리가 서로 떠나 있을 때에 여호와께서 나와 너 사이를 살피시옵소서" 하여 미스바라 하였다(31:47-49). 하란과의 관계 +30, 하란은 더 이상 싸우러 오지 않는다. 신앙 +5.`; } },
      { label: '"내가 이 이십 년을 외삼촌과 함께 하였거니와" — 라반의 불의를 따지며 칼을 든다', run: G => {
        const n = EPAT.family(G); if (G.exists('haran')) G.rel('army', 'haran', -30);
        G.buff('army', 'atk', 3, 0.15); EPAT.faithAll(G, -3); EPAT.next(G, 2); G.kingdom(-3, '외삼촌과의 칼');
        return `레아와 라헬과 열한 아들이 합류했다 (${n}명). 그러나 친족 사이에 원한이 남았다. 하란과의 관계 -30, 3턴 동안 공격력 +15%, 신앙 -3. 성경의 역사에서는 하나님이 라반을 막으셨고, 두 사람은 돌무더기 앞에서 언약을 맺고 평안히 헤어졌다(31:24, 44-55).`; } },
    ],
    altWho: 'haran', altText: '사위 야곱이 딸들과 손자들과 양 떼를 이끌고 몰래 떠났다. 드라빔까지 없어졌다.',
    altChoices: [
      { label: '길르앗 산에서 돌무더기 언약을 맺고 딸들을 축복한다', run: G => { const n = EPAT.family(G); if (G.exists('army')) G.rel('haran', 'army', 30); G.flags.mizpah = true; EPAT.next(G, 2); return `라반이 아침에 일찍이 일어나 손자들과 딸들에게 입맞추고 그들에게 축복하고 떠나 그의 곳으로 돌아갔다(31:55). 야곱의 온 집(${n}명)이 가나안으로 떠났다.`; } },
      { label: '칠 일 길을 쫓아가 끝내 싸운다', run: G => { const n = EPAT.family(G); if (G.exists('army')) G.rel('haran', 'army', -30); EPAT.next(G, 2); return `야곱의 온 집(${n}명)이 떠났다. 하나님이 꿈에 경고하셨으나 라반은 칼을 거두지 않았다. 하나님의 군대와의 관계 -30.`; } },
    ] },
  { id: 'mahanaim', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'laban'),
    title: '마하나임 — 이는 하나님의 군대라', ref: '창 32:1-8; 왕하 6:16-17',
    text: '"야곱이 그의 길을 가는데 하나님의 사자들이 그를 만난지라. 야곱이 그들을 볼 때에 이르되 이는 하나님의 군대라 하고 그 땅 이름을 마하나임이라 하였더라"(32:1-2). 마하나임은 "두 진영"이라는 뜻이다. 앞에는 에서가 사백 명을 거느리고 오고, 뒤에는 라반의 땅이 있다. 그러나 야곱의 진영 곁에 또 하나의 진영, 하나님의 군대가 있었다. 훗날 엘리사의 사환도 눈이 열려 "불말과 불병거가 산에 가득하여 엘리사를 둘렀음"을 보았다(왕하 6:17). 이 군대의 이름이 여기서 나왔다.',
    choices: [
      { label: '"이는 하나님의 군대라" — 눈을 들어 하나님의 진영을 바라보고 진을 친다', run: G => {
        const t = EPAT.mahanaim(G, 0); EPAT.faithAll(G, 10); EPAT.stat(G, '야곱', 'fai', 5);
        G.buff('army', 'atk', 5, 0.25);
        G.flags.word_mahanaim = true; EPAT.next(G, 2); G.kingdom(10, '마하나임');
        return '하나님의 사자들이 야곱의 진영 곁에 진을 쳤다. 군대의 이름이 "마하나임 하나님의 군대"가 되었다.' + t + ' 신앙 +10, 야곱 신앙 +5, 5턴 동안 공격력 +25%. 말씀 "마하나임"을 받았다 — "우리와 함께 한 자가 그들과 함께 한 자보다 많으니라"(왕하 6:16).'; } },
      { label: '심히 두렵고 답답하여 사람과 양 떼를 두 떼로 나눈다', run: G => {
        const t = EPAT.mahanaim(G, 1500); EPAT.faithAll(G, 2);
        G.flags.word_mahanaim = true; EPAT.next(G, 2); G.kingdom(3, '두 진영');
        return '"에서가 와서 한 떼를 치면 남은 한 떼는 피하리라"(32:7-8). 야곱이 자기 무리를 두 진영으로 나누었다. 군대의 이름이 "마하나임 하나님의 군대"가 되었다.' + t + ' 마하나임 병력 +1500, 신앙 +2. 그러나 그 밤 야곱은 기도했다. "주께서 주의 종에게 베푸신 모든 은총과 모든 진실하심을 나는 조금도 감당할 수 없사오나"(32:10). 말씀 "마하나임"을 받았다.'; } },
    ] },
  { id: 'jabbok', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'mahanaim'),
    title: '얍복 나루 — 이스라엘, 그리고 에서와의 화해', ref: '창 32:9–33:17',
    text: '형 에서가 사백 명을 거느리고 온다. 그 밤 얍복 나루에서 어떤 사람이 날이 새도록 야곱과 씨름하다가 야곱의 허벅지 관절을 쳤다. 야곱이 "당신이 내게 축복하지 아니하면 가게 하지 아니하겠나이다" 하자 그가 말했다. "네 이름을 다시는 야곱이라 부를 것이 아니요 이스라엘이라 부를 것이니 이는 네가 하나님과 및 사람들과 겨루어 이겼음이니라"(32:26-28). 야곱이 그 곳 이름을 브니엘이라 하였다.',
    choices: [
      { label: '"주의 종 야곱" — 일곱 번 땅에 굽히고 예물을 앞서 보낸다', run: G => {
        EPAT.pay(G, 200, 2000); const j = G.o('야곱'); if (j && j.alive) { j.fai = Math.min(100, j.fai + 10); j.war = Math.max(0, j.war - 5); }
        if (G.exists('edom')) { G.rel('army', 'edom', 45); G.fac('edom').food += 2000; G.fac('edom').aggr = 0.02; }
        EPAT.faithAll(G, 5); G.flags.israel = true; G.flags.reconciled = true; EPAT.next(G, 2); G.kingdom(10, '형제의 화해');
        return '야곱이 이스라엘이라는 이름을 받고 환도뼈가 위골되어 절게 되었다(야곱 신앙 +10, 무력 -5). 암염소 이백과 숫양 이십, 약대 삼십과 소 사십과 나귀 이십을 예물로 앞서 보냈다(32:13-15; 금 -200, 식량 -2000). 에서가 달려와서 그를 맞이하여 안고 목을 어긋맞추어 그와 입맞추고 서로 울었다(33:4). "내가 형님의 얼굴을 뵈온즉 하나님의 얼굴을 본 것 같사오며"(33:10). 에돔과의 관계 +45, 신앙 +5.'; } },
      { label: '떼를 벌여 세우고 칼을 들고 형을 맞선다', run: G => {
        const j = G.o('야곱'); if (j && j.alive) { j.fai = Math.min(100, j.fai + 5); j.war = Math.max(0, j.war - 5); }
        const h = EPAT.home(G); if (h) h.soldiers += 1500;
        if (G.exists('edom')) { G.rel('army', 'edom', -25); G.buff('edom', 'atk', 3, 0.2); }
        G.flags.israel = true; EPAT.next(G, 2); G.kingdom(-6, '형제의 칼');
        return '야곱이 이스라엘이라는 이름을 받았으나, 칼을 든 형제 사이에 긴장이 흐른다. 본진 병력 +1500, 에돔과의 관계 -25, 에서의 사백 명이 3턴 동안 공격력 +20%. 성경의 역사에서 두 형제는 얼싸안고 울었다(33:4).'; } },
    ],
    altWho: 'edom', altText: '아우 야곱이 하란에서 돌아온다. 그가 사자를 앞서 보내 "주의 종 야곱"이라 부르고 예물 떼를 끝없이 보내 왔다.',
    altChoices: [
      { label: '달려가 아우를 안고 입맞춘다', run: G => {
        if (G.exists('army')) G.rel('edom', 'army', 45); G.fac('edom').food += 2000; G.flags.israel = true; EPAT.next(G, 2);
        return '에서가 아우를 안고 울었다. 식량 +2000, 하나님의 군대와의 관계 +45. "내게 있는 것이 족하니 네 소유는 네가 가지라"(33:9).'; } },
      { label: '사백 명을 이끌고 친다', run: G => {
        const cap = G.exists('army') ? G.fac('army').capital : null; G.flags.israel = true;
        const r = cap && G.city(cap) && G.ownerOf(cap) === 'army' ? G.raid('edom', cap, 3000) : ''; if (G.exists('army')) G.rel('edom', 'army', -30); EPAT.next(G, 2);
        return r + ' 하나님의 군대와의 관계 -30.'; } },
    ] },
  { id: 'shechem', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'jabbok') && G.exists('canaan_shechem') && G.ownerOf('shechem') === 'canaan_shechem' && !G.isPlayer('canaan_shechem'),
    title: '세겜의 일', ref: '창 33:18–34:31; 49:5-7',
    text: '야곱이 밧단아람에서부터 평안히 세겜 성에 이르러 그 성 앞에 장막을 치고, 하몰의 아들들에게서 밭을 사고 제단을 쌓아 엘엘로헤이스라엘이라 불렀다(33:18-20). 그런데 그 땅의 추장 세겜이 야곱의 딸 디나에게 부끄러운 일을 행했다. 야곱의 아들들이 근심하고 심히 노하여 속임수로 할례를 조건 삼았고, 성 사람들이 고통할 때에 시므온과 레위가 칼을 들고 성을 기습하여 남자들을 죽이고 성을 노략했다(34:25-29). 야곱이 말했다. "너희가 내게 화를 끼쳐 나로 이 땅 주민 곧 가나안 족속과 브리스 족속에게 악취를 내게 하였도다"(34:30).',
    choices: [
      { label: '시므온과 레위를 꾸짖고, 노략물과 사로잡은 자들을 돌려보낸다', run: G => {
        EPAT.shechem(G, false); EPAT.next(G, 2); G.kingdom(-2, '세겜의 칼');
        return '하몰과 세겜이 죽고 세겜 성은 폐허가 되어 주인 없는 성이 되었다. 야곱이 노략물을 돌려보내고 그 성을 떠났다. 주변 세력과의 관계 -10, 시므온·레위 신앙 -10. 훗날 야곱은 임종 때에 말했다. "시므온과 레위는 형제요 그들의 칼은 폭력의 도구로다… 그 노여움이 혹독하니 저주를 받을 것이요"(49:5-7). 속임과 보복은 약속의 길이 아니다. (세겜은 주인 없는 성이니 뒷날 다시 장막을 칠 수 있다.)'; } },
      { label: '빼앗은 성과 재물을 그대로 차지한다', run: G => {
        EPAT.shechem(G, true); if (G.exists('army')) { const F = G.fac('army'); F.food += 2000; F.gold += 300; }
        EPAT.faithAll(G, -12, -5); ['시므온', '레위'].forEach(n => EPAT.stat(G, n, 'war', 3));
        EPAT.next(G, 2); G.kingdom(-10, '속임과 칼로 얻은 성');
        return '하몰과 세겜이 죽고 세겜이 하나님의 군대의 성이 되었다. 그러나 그 성은 속임과 칼로 얻은 것이다. 식량 +2000, 금 +300, 신앙 -12, 민심 -5, 주변 세력과의 관계 -20. "나는 수가 적은즉 그들이 나를 치면 나와 내 집이 멸망하리라"(34:30).'; } },
    ] },
  { id: 'bethelAgain', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'jabbok') && (G.done.shechem || G.isPlayer('canaan_shechem') || !(G.exists('canaan_shechem') && G.ownerOf('shechem') === 'canaan_shechem')),
    title: '벧엘로 올라가라 — 베냐민의 출생', ref: '창 35장',
    text: '하나님이 야곱에게 이르셨다. "일어나 벧엘로 올라가서 거기 거주하며 네가 네 형 에서의 낯을 피하여 도망하던 때에 네게 나타났던 하나님께 거기서 제단을 쌓으라." 야곱이 자기 집안 사람과 자기와 함께 한 모든 자에게 말했다. "너희 중에 있는 이방 신상들을 버리고 자신을 정결하게 하고 너희들의 의복을 바꾸어 입으라. 우리가 일어나 벧엘로 올라가자"(35:1-3).',
    choices: [
      { label: '이방 신상들과 귀고리를 세겜 상수리나무 아래 묻고 벧엘에 제단을 쌓는다', run: G => {
        EPAT.faithAll(G, 15, 5); EPAT.stat(G, '야곱', 'fai', 5); const t = EPAT.bethlehem(G);
        G.flags.godsBuried = true; EPAT.next(G, 2); G.kingdom(10, '벧엘의 하나님');
        return '야곱이 그것들을 세겜 근처 상수리나무 아래 묻었다(35:4). 하나님께서 다시 나타나 말씀하셨다. "나는 전능한 하나님이라 생육하며 번성하라. 한 백성과 백성들의 총회가 네게서 나오고 왕들이 네 허리에서 나오리라. 내가 아브라함과 이삭에게 준 땅을 네게 주고"(35:11-12). 신앙 +15, 민심 +5. ' + t; } },
      { label: '라헬의 드라빔을 그대로 둔 채 길을 떠난다', run: G => {
        EPAT.faithAll(G, -8); const t = EPAT.bethlehem(G);
        EPAT.next(G, 2); G.kingdom(-4, '남겨 둔 이방 신상');
        return '장막 안에 라헬이 아버지 집에서 가져온 드라빔이 남았다(31:19, 34). 신앙 -8. ' + t; } },
    ] },
  { id: 'josephSold', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'bethelAgain'),
    title: '꿈꾸는 자 요셉, 애굽으로 팔려 가다', ref: '창 37장; 39:1-6',
    text: '이스라엘이 여러 아들들보다 요셉을 더 사랑하여 채색옷을 지어 입혔다. 요셉이 꿈을 꾸었다. "우리가 밭에서 곡식 단을 묶더니 내 단은 일어서고 당신들의 단은 내 단을 둘러서서 절하더이다"(37:7). 형들이 그를 더욱 미워했다. 도단 들에서 형들이 그를 멀리서 보고 "꿈 꾸는 자가 오는도다" 하며 죽이기를 꾀했다. 르우벤이 "그의 생명은 해치지 말자" 하여 그를 빈 구덩이에 던졌고, 이스마엘 사람의 대상이 길르앗에서 애굽으로 내려가자 유다가 말했다. "우리가 우리 동생을 죽이고 그의 피를 덮어둔들 무엇이 유익할까. 자, 그를 이스마엘 사람들에게 팔고"(37:26-27).',
    choices: [
      { label: '르우벤이 몰래 구덩이로 돌아가 요셉을 건지려 한다', run: G => {
        const t = EPAT.sell(G); EPAT.stat(G, '르우벤', 'fai', 8); EPAT.faithAll(G, -3);
        G.flags.josephSold = true; EPAT.next(G, 2); G.kingdom(-2, '형제의 시기');
        return '르우벤이 구덩이에 돌아가 보니 요셉이 거기 없었다. 그가 옷을 찢고 "아이가 없도다 나는 어디로 갈까" 하였다(37:29-30). 형들은 은 이십에 요셉을 팔고 채색옷에 숫염소의 피를 묻혀 아버지에게 보냈다.' + t + ' 야곱이 옷을 찢고 여러 날 애통하며 위로를 받지 아니했다(37:34-35). 르우벤 신앙 +8, 신앙 -3.'; } },
      { label: '유다의 말대로 요셉을 은 이십에 판다', run: G => {
        const t = EPAT.sell(G); if (G.exists('army')) G.fac('army').gold += 20; EPAT.faithAll(G, -6, -3);
        G.flags.josephSold = true; EPAT.next(G, 2); G.kingdom(-4, '형제를 팔다');
        return '형들이 요셉을 은 이십에 이스마엘 사람들에게 팔았다(37:28; 금 +20).' + t + ' 야곱이 "내가 슬퍼하며 스올로 내려가 아들에게로 가리라" 하며 울었다(37:35). 신앙 -6, 민심 -3. 그러나 "여호와께서 요셉과 함께 하시므로 그가 형통한 자가 되어"(39:2).'; } },
    ] },
  { id: 'pharaohDream', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'josephSold'),
    title: '바로의 꿈과 애굽의 총리', ref: '창 39:7–41:57',
    text: '보디발의 아내가 날마다 요셉에게 청했으나 그는 "내가 어찌 이 큰 악을 행하여 하나님께 죄를 지으리이까" 하고 거절했고, 거짓 고발로 왕의 죄수를 가두는 옥에 갇혔다(39:9, 20). 옥에서 술 맡은 관원장과 떡 굽는 관원장의 꿈을 풀어 주었으나 술 맡은 관원장은 그를 잊었다. 만 이 년 후 바로가 꿈을 꾸었다. 살진 일곱 암소를 흉한 일곱 암소가 먹고, 충실한 일곱 이삭을 마른 일곱 이삭이 삼켰다. 애굽의 점술가와 현인들이 아무도 풀지 못했다. (성경은 이 바로의 이름을 기록하지 않는다. 이른 연대로는 중왕국 제12왕조의 세누스레트 2세·3세 무렵으로 보는 견해가, 힉소스 시대로 보는 견해가 있다.)',
    choices: [
      { label: '"내가 아니라 하나님께서 바로에게 편안한 대답을 하시리이다" — 요셉이 꿈을 푼다', run: G => {
        const j = G.o('요셉'); if (j && j.alive) { j.pol = Math.min(100, j.pol + 3); j.int = Math.min(100, j.int + 2); j.fai = Math.min(100, j.fai + 2); }
        if (G.exists('egypt')) { const E = G.fac('egypt'); E.food += 20000; G.rel('army', 'egypt', 15); }
        EPAT.faithAll(G, 5); G.flags.vizier = true; EPAT.next(G, 2); G.kingdom(8, '해석은 하나님께');
        return '"해석은 하나님께 있지 아니하니이까"(40:8). 요셉이 일곱 해 큰 풍년 뒤에 일곱 해 흉년이 올 것을 알리고, 풍년 동안 오분의 일을 거두어 쌓으라고 권했다(41:25-36). 바로가 말했다. "이와 같이 하나님의 영에 감동된 사람을 우리가 어찌 찾을 수 있으리요"(41:38). 서른 살의 요셉이 애굽 온 땅의 총리가 되었다(41:41-46). 애굽 식량 +20000(일곱 해 풍년의 곡식), 애굽과의 관계 +15, 요셉 정치·지력·신앙 상승, 신앙 +5.'; } },
    ] },
  { id: 'famine', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'pharaohDream'),
    title: '기근 — 유다의 탄원과 요셉의 눈물', ref: '창 41:53–45:15',
    text: '일곱 해 풍년이 그치고 흉년이 들기 시작하니 "각국 백성도 양식을 사려고 애굽으로 들어와 요셉에게로 왔으니 기근이 온 세상에 심함이었더라"(41:57). 야곱이 아들 열을 애굽으로 보냈다. 총리가 된 요셉이 형들을 알아보았으나 그들은 그를 알아보지 못했다. 두 번째 길에 베냐민이 함께 내려오자, 요셉은 베냐민의 자루에 은잔을 넣어 그를 종으로 잡아 두려 했다. 유다가 나아가 말했다. "이제 주의 종으로 그 아이를 대신하여 머물러 있어 내 주의 종이 되게 하시고 그 아이는 그의 형제들과 함께 올려 보내소서"(44:33).',
    choices: [
      { label: '유다가 베냐민 대신 종이 되겠다고 나선다', run: G => {
        EPAT.stat(G, '유다', 'cha', 6); EPAT.stat(G, '유다', 'fai', 10);
        if (G.exists('army')) { const F = G.fac('army'); F.food = Math.max(0, Math.floor(F.food * 0.7)) + 5000; F.gold = Math.max(0, F.gold - 200); }
        if (G.exists('egypt')) G.rel('army', 'egypt', 20);
        EPAT.faithAll(G, 8, 5); G.flags.reunion = true; EPAT.next(G, 2); G.kingdom(10, '형제를 대신하여');
        return '요셉이 자기를 억제하지 못하여 소리 내어 울며 말했다. "나는 당신들의 아우 요셉이니 당신들이 애굽에 판 자라. 당신들이 나를 이곳에 팔았다고 해서 근심하지 마소서 한탄하지 마소서 하나님이 생명을 구원하시려고 나를 당신들보다 먼저 보내셨나이다"(45:4-5). 기근으로 식량 30%를 잃었으나 애굽의 곡식 +5000(은 -200). 애굽과의 관계 +20, 유다 매력 +6·신앙 +10, 신앙 +8, 민심 +5.'; } },
      { label: '"요셉도 없어졌고 시므온도 없어졌거늘 베냐민을 또 빼앗아 가고자 하니" — 막내를 보내지 않고 버틴다', run: G => {
        if (G.exists('army')) { const F = G.fac('army'); F.food = Math.max(0, Math.floor(F.food * 0.4)) + 3000; G.eachCity('army', c => { c.loy -= 8; }); }
        if (G.exists('egypt')) G.rel('army', 'egypt', 10);
        G.flags.reunion = true; EPAT.next(G, 3); G.kingdom(-2, '두려움의 기근');
        return '야곱이 베냐민을 붙들고 버티는 사이 기근이 심해져 식량 60%와 민심 8을 잃었다(42:36-38). 곡식이 다 떨어지자 결국 유다가 "내가 그의 몸을 담보하오리니"(43:9) 하며 베냐민을 데리고 내려갔다. 요셉이 형들에게 자기를 밝히고 울었다(45:1-15). 애굽의 곡식 +3000, 애굽과의 관계 +10.'; } },
    ] },
  { id: 'goshen', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'famine'),
    title: '애굽으로 내려가기를 두려워하지 말라 — 고센 땅', ref: '창 46:1-7; 47:1-12',
    text: '이스라엘이 모든 소유를 이끌고 브엘세바에 이르러 희생을 드렸다. 밤에 하나님이 이상 중에 말씀하셨다. "나는 하나님이라 네 아버지의 하나님이니 애굽으로 내려가기를 두려워하지 말라 내가 거기서 너로 큰 민족을 이루게 하리라. 내가 너와 함께 애굽으로 내려가겠고 반드시 너를 인도하여 다시 올라올 것이며"(46:3-4). 야곱이 바로 앞에 서서 그를 축복했다(47:7). 기근의 세상에서 하나님의 군대는 칼이 아니라 요셉의 지혜로 애굽에 들어간다.',
    choices: [
      { label: '브엘세바에서 제사를 드리고 온 집이 애굽으로 내려간다', run: G => {
        const t = EPAT.goshen(G); EPAT.faithAll(G, 8); if (G.exists('army')) G.fac('army').food += 6000;
        G.flags.word_fear_not = true; EPAT.next(G, 2); G.kingdom(10, '고센 땅');
        return '야곱의 집 칠십 명이 애굽으로 내려갔다(46:27).' + t + ' 애굽과 동맹이 되었다(관계 +60). 요셉이 흉년 동안 아버지와 형들을 봉양했다(47:12; 식량 +6000). 신앙 +8. 성경의 역사에서는 온 집이 애굽으로 내려갔다. 이 게임에서는 약속의 땅의 장막 터를 지키는 진영과 고센으로 내려간 진영, 두 진영(마하나임)으로 나누어 다스린다.'; } },
      { label: '"야곱이 바로에게 축복하고" — 바로 앞에서 나그네 길을 고백하고 내려간다', run: G => {
        const t = EPAT.goshen(G); EPAT.stat(G, '야곱', 'cha', 5); EPAT.faithAll(G, 5);
        if (G.exists('egypt')) G.rel('army', 'egypt', 10);
        G.flags.word_fear_not = true; EPAT.next(G, 2); G.kingdom(10, '바로를 축복하다');
        return '"내 나그네 길의 세월이 백삼십 년이니이다 내 나이가 얼마 못 되니 우리 조상의 나그네 길의 연조에 미치지 못하나 험악한 세월을 보내었나이다"(47:9). 야곱이 바로에게 축복하고 그 앞에서 나왔다(47:10).' + t + ' 애굽과 동맹이 되었다(관계 +70). 야곱 매력 +5, 신앙 +5.'; } },
    ] },
  { id: 'blessing', who: 'army', auto: 0,
    cond: G => EPAT.after(G, 'goshen'),
    title: '야곱의 축복과 요셉의 유언', ref: '창 49–50장; 히 11:21-22',
    text: '야곱이 아들들을 불러 말했다. "너희는 모이라 너희가 후일에 당할 일을 내가 너희에게 이르리라"(49:1). "규가 유다를 떠나지 아니하며 통치자의 지팡이가 그 발 사이에서 떠나지 아니하기를 실로가 오시기까지 이르리니 그에게 모든 백성이 복종하리로다"(49:10). "요셉은 무성한 가지 곧 샘 곁의 무성한 가지라"(49:22). 야곱이 발을 침상에 모으고 숨을 거두니, 요셉과 형제들이 그를 가나안 땅 막벨라 굴에 장사했다(50:13).',
    choices: [
      { label: '"당신들은 나를 해하려 하였으나 하나님은 그것을 선으로 바꾸사" — 요셉이 형들을 위로한다', run: G => {
        G.kill('야곱');
        if (G.alive('요셉') && G.facOf('요셉') === 'army') G.setRuler('army', '요셉');
        EPAT.stat(G, '유다', 'cha', 5); EPAT.faithAll(G, 10, 8);
        G.flags.bones = true; G.kingdom(12, '선으로 바꾸사');
        return '"당신들은 나를 해하려 하였으나 하나님은 그것을 선으로 바꾸사 오늘과 같이 많은 백성의 생명을 구원하게 하시려 하셨나니 당신들은 두려워하지 마소서"(50:20-21). 요셉이 하나님의 군대를 이끈다. 그가 죽을 때에 말했다. "하나님이 반드시 당신들을 돌보시고 당신들을 이 땅에서 인도하여 내사 아브라함과 이삭과 야곱에게 맹세하신 땅에 이르게 하시리라… 당신들은 여기서 내 해골을 메고 올라가겠다 하라"(50:24-25; 히 11:22). 약속은 사백 년 뒤 모세에게로 이어진다. 신앙 +10, 민심 +8.'; } },
    ] },
];

STORY.e_patriarchs = {
  army: [
    { title: '떠나라, 복이 될지라', ref: '창 12:1-9',
      intro: [
        ['narr', '갈대아 우르에서 하란으로, 하란에서 가나안으로. 일흔다섯 살의 아브람이 아내 사래와 조카 롯, 하란에서 얻은 사람들을 이끌고 길을 떠났다.'],
        ['word', '"너는 너의 고향과 친척과 아버지의 집을 떠나 내가 네게 보여 줄 땅으로 가라. 내가 너로 큰 민족을 이루고 네게 복을 주어… 너는 복이 될지라." (12:1-2)'],
        ['사라', '어디로 가는지도 모르고 떠나온 길이에요. 그래도 여호와께서 보여 주신다니 따라가겠어요.'],
        ['아브라함', '이 땅에는 이미 가나안 사람들이 살고 있소. 우리는 성을 빼앗으러 온 것이 아니라, 약속을 따라 온 나그네요.'],
        ['엘리에셀', '주인님, 장막을 칠 곳마다 무엇부터 할까요? 우물입니까, 울타리입니까?'],
        ['아브라함', '제단이다. 세겜에서도, 벧엘 동쪽에서도 먼저 여호와의 이름을 부르자.'],
        ['narr', '이 게임에서 아브라함의 무리는 "하나님의 군대"라 불린다. 그 이름은 훗날 손자 야곱이 마하나임에서 본 하나님의 군대에서 왔다 (창 32:1-2).'],
      ],
      goal: { t: 'cmd', key: 'worship', n: 2, text: '벧엘 동쪽 제단에서 제사를 두 번 드린다', city: 'bethel' },
      reward: { k: 10, food: 2000 },
      outro: [['narr', '아브람이 거기서 여호와를 위하여 제단을 쌓고 여호와의 이름을 불렀다 (12:8).'], ['롯', '삼촌, 장막은 옮겨도 제단은 남는군요.'], ['아브라함', '그렇다. 이 땅에 우리가 남기는 것은 성벽이 아니라 제단이다.']] },
    { title: '단까지 쫓아가다', ref: '창 14장',
      intro: [
        ['narr', '엘람 왕 그돌라오멜과 시날 왕 아므라벨, 엘라살 왕 아리옥, 고임 왕 디달 — 동방의 네 왕이 요단 들을 휩쓸고 롯을 사로잡아 북쪽으로 올라갔다.'],
        ['엘리에셀', '주인님, 도망쳐 온 자의 말로는 원정군이 다메섹과 단에 진을 쳤답니다. 엘람의 도읍 수사는 석 달 길 너머입니다.'],
        ['마므레', '우리 삼 형제도 함께 가겠소. 아브람, 당신의 하나님이 당신과 함께 계심을 우리가 보았소.'],
        ['아브라함', '집에서 길리고 훈련된 자 318명을 불러라. 밤에 군사를 나누어 치자. 형제가 위급한 때를 위하여 났느니라.'],
        ['@advisor', '먼 길입니다. 원정군이 지치기 전에 병사를 조련하고 군량을 넉넉히 챙기십시오. 단을 되찾으면 원정군은 호바 너머로 물러갈 것입니다.'],
        ['narr', '성경의 역사에서 아브람은 원정군을 호바까지 쫓았을 뿐 땅을 차지하지 않았다. 이 게임에서는 단을 차지하면 원정군을 몰아낸 것으로 본다.'],
      ],
      goal: { t: 'own', city: 'dan', text: '엘람 원정군을 쫓아 단을 차지한다' },
      reward: { k: 12, gold: 500 },
      outro: [['narr', '아브람이 그돌라오멜과 그와 함께 한 왕들을 쳐부수고 돌아왔다 (14:17).'], ['멜기세덱', '너희 대적을 네 손에 붙이신 지극히 높으신 하나님을 찬송할지로다.'], ['아브라함', '승리는 318명의 칼이 아니라 방패 되신 여호와께 있소.']] },
    { title: '약속의 아들과 르호봇', ref: '창 21–26장',
      intro: [
        ['narr', '"아브람이 여호와를 믿으니 여호와께서 이를 그의 의로 여기시고" (15:6). 약속의 아들 이삭이 태어났고, 모리아 산에서 여호와께서 숫양을 준비하셨다.'],
        ['이삭', '아버지께서 판 우물들을 그랄 사람들이 흙으로 메웠습니다. 목자들이 칼을 가지러 갑니다.'],
        ['비골', '이 물은 우리의 것이오! 우물마다 흙으로 메우라는 왕의 명이오.'],
        ['이삭', '다투지 말라. 옮겨서 다시 파자. 아버지께서 부르시던 우물 이름을 다시 불러 드리면서.'],
        ['아비멜렉', '여호와께서 너와 함께 계심을 우리가 분명히 보았다. 우리 사이에 맹세하여 너와 계약을 맺으리라.'],
        ['@advisor', '예물을 들려 사신을 보내면 관계가 두터워집니다. 칼보다 언약이 우물을 지켜 줄 것입니다.'],
      ],
      goal: { t: 'rel', fac: 'gerar', n: 70, text: '그랄 왕 아비멜렉과 화평 언약을 맺는다 (관계 70)' },
      reward: { k: 15, food: 3000 },
      outro: [['narr', '그들이 아침에 일찍이 일어나 서로 맹세한 후에 이삭이 그들을 보내매 그들이 평안히 갔더라. 그 날에 이삭의 종들이 와서 "우리가 물을 얻었나이다" 하였다 (26:31-32).'], ['이삭', '세바 — 맹세. 이 성읍을 브엘세바라 부르자.']] },
    { title: '마하나임 — 하나님의 군대', ref: '창 28–33장',
      intro: [
        ['narr', '형의 축복을 가로챈 야곱이 에서의 칼을 피해 하란으로 도망했다. 벧엘의 돌베개 위에서 그는 하늘에 닿은 사닥다리를 보았다.'],
        ['야곱', '여호와께서 과연 여기 계시거늘 내가 알지 못하였도다. 이것은 다름 아닌 하나님의 집이요 이는 하늘의 문이로다.'],
        ['라반', '네가 내게 품삯으로 무엇을 원하느냐? …좋다, 라헬을 위해 칠 년을 더 섬겨라.'],
        ['레아', '이제는 내가 여호와를 찬송하리로다. 넷째 아들의 이름을 유다라 하겠어요.'],
        ['라헬', '하나님이 나의 부끄러움을 씻으셨네요. 이 아이는 요셉이에요.'],
        ['에서', '야곱이 돌아온다고? 사백 명을 모아라. 이십 년을 기다렸다.'],
        ['word', '"야곱이 그의 길을 가는데 하나님의 사자들이 그를 만난지라. 야곱이 그들을 볼 때에 이르되 이는 하나님의 군대라 하고 그 땅 이름을 마하나임이라 하였더라." (32:1-2)'],
      ],
      goal: { t: 'officers', n: 16, text: '하란에서 온 집안을 데려와 군대의 사람 16명을 이룬다' },
      reward: { k: 15, gold: 600 },
      outro: [['야곱', '내가 형님의 얼굴을 뵈온즉 하나님의 얼굴을 본 것 같사오며, 형님도 나를 기뻐하심이니이다.'], ['에서', '내 동생아, 내게 있는 것이 족하니 네 소유는 네가 가지라.'], ['narr', '해가 돋아 브니엘을 지날 때에 야곱이 그 허벅다리로 말미암아 절었더라 (32:31). 두 진영 곁에는 언제나 또 하나의 진영, 하나님의 군대가 있었다.']] },
    { title: '벧엘로 올라가라', ref: '창 35장',
      intro: [
        ['word', '"일어나 벧엘로 올라가서 거기 거주하며… 네게 나타났던 하나님께 거기서 제단을 쌓으라." (35:1)'],
        ['야곱', '너희 중에 있는 이방 신상들을 버리고 자신을 정결하게 하라. 환난 날에 내게 응답하신 하나님께 제단을 쌓자.'],
        ['유다', '아버지, 시므온과 레위의 일로 이 땅 사람들이 우리를 경계합니다. 칼로는 이 땅에 오래 머물 수 없습니다.'],
        ['요셉', '아버지, 꿈에 우리가 밭에서 곡식 단을 묶는데 제 단은 일어서고 형들의 단은 둘러서서 절했습니다.'],
        ['@advisor', '모든 장막에서 제사를 드리고 백성을 돌보십시오. 군대의 힘은 칼보다 제단에서 나옵니다.'],
      ],
      goal: { t: 'faith', n: 65, text: '하나님의 군대 평균 신앙 65 이상' },
      reward: { k: 12, gold: 400 },
      outro: [['narr', '"하나님이 그들의 사방 고을들로 크게 두려워하게 하셨으므로 야곱의 아들들을 추격하는 자가 없었더라" (35:5).'], ['야곱', '벧엘의 하나님께서 내가 가는 길에서 나와 함께 하셨도다.']] },
    { title: '기근과 고센 땅', ref: '창 37–50장; 히 11:21-22',
      intro: [
        ['narr', '채색옷을 입은 꿈꾸는 자 요셉이 형들에게 팔려 애굽으로 내려갔다. 그러나 "여호와께서 요셉과 함께 하시므로 그가 형통한 자가 되었다" (39:2).'],
        ['유다', '우리가 동생을 팔았다. 그 피 값이 우리에게 돌아오는구나. 온 세상에 기근이 든다 한다.'],
        ['요셉', '해석은 하나님께 있지 아니하니이까. 일곱 해 풍년 뒤에 일곱 해 흉년이 옵니다. 곡식을 거두어 쌓으십시오.'],
        ['바로', '이와 같이 하나님의 영에 감동된 사람을 우리가 어찌 찾을 수 있으리요. 내가 너를 애굽 온 땅의 총리가 되게 하노라.'],
        ['@ruler', '기근이 와도 약속은 굶지 않는다. 헤브론·브엘세바·벧엘·세겜·마하나임의 장막 터를 지키고, 요셉이 예비한 고센으로 가자.'],
        ['narr', '성경의 역사에서 애굽의 문은 칼이 아니라 한 사람의 지혜와 용서로 열렸다. 이 게임의 마지막 사명도 그렇다 — 고센은 싸워서가 아니라 사건을 통해 얻는다.'],
      ],
      goal: { t: 'goal', text: '다섯 장막 터와 고센 땅을 지키고 신앙 60을 이룬다', faith: 60 },
      reward: { k: 25 },
      outro: [['요셉', '당신들은 나를 해하려 하였으나 하나님은 그것을 선으로 바꾸사 많은 백성의 생명을 구원하게 하셨나이다.'], ['narr', '"믿음으로 요셉은 임종 시에 이스라엘 자손들이 떠날 것을 말하고 또 자기 뼈를 위하여 명하였으며" (히 11:22).'], ['word', '"그러므로 하나님이 그들의 하나님이라 일컬음 받으심을 부끄러워하지 아니하시고 그들을 위하여 한 성을 예비하셨느니라." (히 11:16)'], ['narr', '야곱의 집은 애굽에서 큰 민족이 된다. 사백 년 뒤, 요셉을 알지 못하는 새 왕이 일어나고 — 약속은 모세에게로 이어진다.']] },
  ],
};

HERO_LINES.e_patriarchs = {
  army: [
    { // 떠나라, 복이 될지라
      intro: [
        ['@hero', '어디로 가는지는 몰라도 부르신 분은 압니다. 저도 이 길을 함께 걷겠습니다.'],
        ['@hero', '장막보다 제단이 먼저입니다. 벧엘 동쪽에서 여호와의 이름을 부릅시다.'],
      ],
      outro: [['@hero', '장막은 걷혀도 제단은 남습니다. 우리의 첫걸음이 예배여서 참 기쁩니다.']],
    },
    { // 단까지 쫓아가다
      intro: [['@hero', '롯을 두고 갈 수는 없습니다. 318명이면 충분합니다 — 방패 되신 분이 앞서 가십니다.']],
      outro: [['@hero', '빼앗긴 사람들이 돌아왔습니다. 실 한 오라기도 우리 것으로 삼지 맙시다.']],
    },
    { // 약속의 아들과 르호봇
      intro: [['@hero', '메워진 우물 때문에 칼을 들지 맙시다. 옮겨서 다시 파고, 화평을 청하겠습니다.']],
      outro: [['@hero', '르호봇 — 이제는 여호와께서 우리를 위하여 넓은 곳을 주셨습니다 (창 26:22).']],
    },
    { // 마하나임 — 하나님의 군대
      intro: [
        ['narr', '{name}은(는) 마하나임 들판에서 야곱과 함께 눈을 들어 하나님의 진영을 보았다.'],
        ['@hero', '우리 곁에 또 하나의 진영이 있습니다. 두려워 말고 흩어진 온 집안을 한 장막에 모읍시다.'],
      ],
      outro: [['@hero', '형제가 얼싸안은 이 진영이 곧 하나님의 군대입니다. 겨루어 이긴 것은 은혜였습니다.']],
    },
    { // 벧엘로 올라가라
      intro: [['@hero', '이방 신상을 묻고 옷을 바꾸어 입읍시다. 벧엘의 하나님께 다시 제단을 쌓겠습니다.']],
      outro: [['@hero', '사방 고을들이 우리를 두려워한 것은 칼 때문이 아니라 하나님 때문이었습니다.']],
    },
    { // 기근과 고센 땅
      intro: [['@hero', '기근에도 약속은 끊어지지 않습니다. 요셉이 예비한 길로 온 집을 이끌겠습니다.']],
      outro: [['@hero', '해하려 한 일을 선으로 바꾸신 하나님을 봅니다. 우리는 언젠가 요셉의 뼈를 메고 올라갈 것입니다.']],
    },
  ],
};
