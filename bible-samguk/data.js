// 성경 삼국지 — 지도·시나리오·인물·역사 이벤트 데이터
// 도시: [id, 이름, x, y, 인구, 농업, 상업, 성벽, 설명]
const CITY_TABLE = [
  ['dan', '단', 382, 107, 20000, 40, 30, 40, '이스라엘 최북단, 요단강 발원지'],
  ['hazor', '하솔', 362, 165, 35000, 50, 45, 70, '가나안 북부 여러 나라의 머리'],
  ['tyre', '두로', 272, 102, 45000, 25, 90, 85, '지중해 무역의 중심, 바다의 요새'],
  ['damascus', '다메섹', 542, 48, 50000, 55, 70, 70, '아람의 도읍, 대상로의 교차점'],
  ['megiddo', '므깃도', 265, 275, 30000, 55, 50, 75, '이스르엘 평야를 지키는 관문'],
  ['bethshean', '벧산', 345, 295, 22000, 50, 35, 55, '요단 골짜기와 이스르엘을 잇는 성'],
  ['ramoth', '라못길르앗', 445, 282, 20000, 40, 30, 60, '길르앗의 도피성, 동방의 요새'],
  ['shechem', '세겜', 290, 367, 30000, 50, 40, 50, '에발산과 그리심산 사이의 옛 성읍'],
  ['mahanaim', '마하나임', 385, 380, 18000, 40, 25, 55, '야곱이 하나님의 군대를 만난 곳'],
  ['joppa', '욥바', 157, 407, 20000, 30, 60, 45, '지중해의 항구'],
  ['shiloh', '실로', 292, 405, 15000, 40, 20, 35, '회막과 언약궤가 머물던 성소'],
  ['bethel', '벧엘', 275, 432, 18000, 40, 30, 40, '하나님의 집, 야곱의 사닥다리'],
  ['jericho', '여리고', 335, 455, 15000, 60, 30, 80, '종려나무 성, 요단 도하의 요충지'],
  ['jerusalem', '예루살렘', 282, 480, 25000, 35, 40, 90, '시온 산성'],
  ['rabbah', '랍바', 452, 432, 30000, 45, 40, 70, '암몬 자손의 왕도'],
  ['ekron', '에그론', 182, 440, 22000, 45, 45, 55, '블레셋 다섯 성읍 중 하나'],
  ['ashdod', '아스돗', 125, 470, 30000, 45, 55, 60, '다곤 신전이 있던 블레셋 성읍'],
  ['bethlehem', '베들레헴', 265, 517, 12000, 50, 20, 30, '떡집, 다윗의 고향'],
  ['gath', '가드', 182, 505, 25000, 40, 45, 65, '골리앗의 고향, 블레셋의 성읍'],
  ['ashkelon', '아스글론', 110, 505, 25000, 40, 60, 60, '해안의 블레셋 성읍'],
  ['hebron', '헤브론', 245, 565, 22000, 50, 30, 55, '족장들의 막벨라 굴이 있는 성'],
  ['dibon', '디본', 415, 545, 18000, 45, 30, 50, '아르논 북쪽 모압 고원의 성읍'],
  ['gaza', '가사', 82, 548, 30000, 40, 65, 65, '애굽으로 가는 해안길의 관문'],
  ['beersheba', '브엘세바', 170, 640, 12000, 35, 30, 35, '맹세의 우물, 남방의 끝'],
  ['kirhareseth', '길하레셋', 395, 625, 20000, 40, 35, 80, '모압의 산성 도읍'],
  ['bozrah', '보스라', 370, 737, 18000, 30, 50, 65, '에돔의 도읍'],
];

const ROADS = [
  ['dan', 'hazor'], ['dan', 'tyre'], ['dan', 'damascus'], ['hazor', 'tyre'], ['hazor', 'megiddo'],
  ['hazor', 'bethshean'], ['hazor', 'damascus'], ['tyre', 'megiddo'], ['megiddo', 'bethshean'],
  ['megiddo', 'shechem'], ['megiddo', 'joppa'], ['bethshean', 'shechem'], ['bethshean', 'ramoth'],
  ['bethshean', 'mahanaim'], ['ramoth', 'damascus'], ['ramoth', 'mahanaim'], ['ramoth', 'rabbah'],
  ['shechem', 'shiloh'], ['shechem', 'mahanaim'], ['shechem', 'joppa'], ['shiloh', 'bethel'],
  ['shiloh', 'joppa'], ['bethel', 'jericho'], ['bethel', 'jerusalem'], ['bethel', 'ekron'],
  ['jericho', 'jerusalem'], ['jericho', 'mahanaim'], ['jericho', 'rabbah'], ['mahanaim', 'rabbah'],
  ['jerusalem', 'bethlehem'], ['jerusalem', 'ekron'], ['bethlehem', 'hebron'], ['bethlehem', 'gath'],
  ['hebron', 'beersheba'], ['hebron', 'gath'], ['beersheba', 'gaza'], ['beersheba', 'bozrah'],
  ['gath', 'ekron'], ['gath', 'ashkelon'], ['gath', 'gaza'], ['ekron', 'ashdod'], ['ekron', 'joppa'],
  ['ashdod', 'ashkelon'], ['ashdod', 'joppa'], ['ashkelon', 'gaza'], ['rabbah', 'dibon'],
  ['dibon', 'kirhareseth'], ['kirhareseth', 'bozrah'],
];

// 이스라엘·유다 본토 (다윗 통일/재통일 목표)
const HOLY_LAND = ['dan', 'hazor', 'megiddo', 'bethshean', 'shechem', 'shiloh', 'bethel', 'jericho',
  'jerusalem', 'bethlehem', 'hebron', 'beersheba', 'mahanaim', 'ramoth'];
// 요단 서편 가나안 (여호수아 정복 목표)
const CANAAN_WEST = ['dan', 'hazor', 'megiddo', 'bethshean', 'shechem', 'shiloh', 'bethel', 'jericho',
  'jerusalem', 'bethlehem', 'hebron', 'beersheba'];

// 인물: [이름, 무력, 지력, 정치, 매력, 신앙, 세력(null=재야), 도시, 소개, 성경]
const SCENARIOS = [
  {
    id: 'conquest',
    title: '가나안 정복',
    year: 1406,
    ref: '여호수아 1–11장',
    intro: '모세가 죽고 여호수아가 백성을 이끈다. 요단 동편 길르앗을 차지한 이스라엘 앞에 여리고의 높은 성벽과 가나안 왕들의 연합군이 버티고 있다.',
    factions: [
      { id: 'israel', name: '이스라엘', ruler: '여호수아', color: '#e2b04a', capital: 'mahanaim', gold: 600, food: 12000, aggr: 0.5,
        desc: '광야 40년을 지나 약속의 땅 앞에 선 열두 지파. 만나 덕분에 식량이 넉넉하다.',
        cities: { mahanaim: 8000, ramoth: 5000, dibon: 5000 } },
      { id: 'jericho', name: '여리고', ruler: '여리고 왕', color: '#8f86a8', capital: 'jericho', gold: 800, food: 6000, aggr: 0.1,
        desc: '견고한 이중 성벽의 성읍. 성문을 굳게 닫고 출입을 막았다.',
        cities: { jericho: 5000 } },
      { id: 'south', name: '가나안 남부 동맹', ruler: '아도니세덱', color: '#c9573f', capital: 'jerusalem', gold: 900, food: 8000, aggr: 0.45,
        desc: '예루살렘 왕 아도니세덱이 헤브론·야르뭇 왕들과 맺은 연합.',
        cities: { jerusalem: 4000, hebron: 3500, bethel: 2500, bethlehem: 1500 } },
      { id: 'north', name: '가나안 북부 동맹', ruler: '야빈', color: '#cf6d9c', capital: 'hazor', gold: 1200, food: 9000, aggr: 0.4,
        desc: '하솔 왕 야빈이 이끄는 북방 연합. 병거와 말이 많다.',
        cities: { hazor: 7000, megiddo: 4000, dan: 2000, bethshean: 3000 } },
      { id: 'philistia', name: '블레셋', ruler: '가사 방백', color: '#d98a3a', capital: 'gaza', gold: 1000, food: 7000, aggr: 0.3,
        desc: '해안 평야의 다섯 성읍. 철기를 다룬다.',
        cities: { gaza: 3500, ashkelon: 2500, ashdod: 3000, gath: 3000, ekron: 2500, joppa: 1500 } },
      { id: 'moab', name: '모압', ruler: '발락', color: '#9a6fbf', capital: 'kirhareseth', gold: 700, food: 5000, aggr: 0.25,
        desc: '발람을 불러 이스라엘을 저주하게 하려던 왕 발락의 나라.',
        cities: { kirhareseth: 3500 } },
      { id: 'ammon', name: '암몬', ruler: '암몬 왕', color: '#5ea67c', capital: 'rabbah', gold: 600, food: 5000, aggr: 0.25,
        desc: '롯의 후손, 랍바를 도읍으로 삼은 나라.', cities: { rabbah: 3500 } },
      { id: 'edom', name: '에돔', ruler: '에돔 왕', color: '#b5804f', capital: 'bozrah', gold: 600, food: 4000, aggr: 0.2,
        desc: '에서의 후손. 이스라엘의 통과를 거절했다.', cities: { bozrah: 3000 } },
      { id: 'aram', name: '아람', ruler: '아람 왕', color: '#6f8fd8', capital: 'damascus', gold: 1200, food: 8000, aggr: 0.2,
        desc: '다메섹의 아람 사람들.', cities: { damascus: 5000 } },
      { id: 'tyre', name: '두로', ruler: '두로 왕', color: '#3fb3b5', capital: 'tyre', gold: 2000, food: 5000, aggr: 0.05,
        desc: '바다 무역으로 부유한 베니게의 성읍.', cities: { tyre: 4000 } },
    ],
    neutral: { shechem: 1200, shiloh: 600, beersheba: 800 },
    officers: [
      ['여호수아', 88, 85, 80, 90, 97, 'israel', 'mahanaim', '모세의 후계자. "강하고 담대하라"는 명령을 받았다.', '수 1:1-9'],
      ['갈렙', 90, 70, 60, 75, 96, 'israel', 'mahanaim', '여든다섯에도 "이 산지를 내게 주소서" 했던 용사.', '수 14:6-15'],
      ['엘르아살', 30, 75, 70, 70, 97, 'israel', 'mahanaim', '아론의 아들, 대제사장.', '수 14:1'],
      ['비느하스', 75, 60, 50, 60, 95, 'israel', 'ramoth', '여호와를 위한 질투로 재앙을 그치게 한 제사장.', '민 25:7-13'],
      ['옷니엘', 85, 65, 55, 60, 85, 'israel', 'dibon', '갈렙의 조카, 훗날 첫 사사.', '수 15:17'],
      ['라합', 20, 75, 60, 80, 70, null, 'jericho', '정탐꾼을 숨겨 준 여리고의 여인.', '수 2장; 히 11:31'],
      ['여리고 왕', 65, 55, 50, 45, 5, 'jericho', 'jericho', '성문을 닫고 정탐꾼을 찾던 왕.', '수 2:2-3'],
      ['아도니세덱', 70, 70, 65, 60, 10, 'south', 'jerusalem', '예루살렘 왕, 남부 다섯 왕 연합의 맹주.', '수 10:1-5'],
      ['호함', 72, 50, 45, 40, 10, 'south', 'hebron', '헤브론 왕.', '수 10:3'],
      ['비람', 70, 45, 40, 40, 10, 'south', 'bethel', '야르뭇 왕.', '수 10:3'],
      ['세새', 92, 20, 15, 20, 5, 'south', 'hebron', '거인 아낙의 자손.', '수 15:14'],
      ['아히만', 90, 20, 15, 20, 5, 'south', 'bethlehem', '거인 아낙의 자손.', '민 13:22'],
      ['야빈', 82, 70, 70, 65, 10, 'north', 'hazor', '하솔 왕, 북방 연합군의 총대장.', '수 11:1-5'],
      ['요밥', 75, 50, 45, 45, 10, 'north', 'megiddo', '마돈 왕.', '수 11:1'],
      ['가사 방백', 70, 60, 60, 50, 5, 'philistia', 'gaza', '블레셋 다섯 방백 가운데 하나.', '수 13:3'],
      ['가드 방백', 74, 50, 50, 45, 5, 'philistia', 'gath', '블레셋 다섯 방백 가운데 하나.', '수 13:3'],
      ['발락', 55, 70, 65, 60, 20, 'moab', 'kirhareseth', '십볼의 아들 모압 왕.', '민 22:2'],
      ['암몬 왕', 60, 50, 50, 45, 10, 'ammon', 'rabbah', '랍바의 왕.', '신 2:19'],
      ['에돔 왕', 65, 55, 50, 45, 10, 'edom', 'bozrah', '이스라엘의 통과를 막은 왕.', '민 20:14-21'],
      ['아람 왕', 70, 60, 60, 55, 10, 'aram', 'damascus', '다메섹의 왕.', ''],
      ['두로 왕', 50, 75, 85, 75, 20, 'tyre', 'tyre', '바다의 상인 왕.', ''],
    ],
    goals: { israel: CANAAN_WEST },
    goalText: { israel: '요단 서편 가나안 12성(단~브엘세바)을 차지한다.' },
  },
  {
    id: 'judges',
    title: '사사 시대',
    year: 1200,
    ref: '사사기 3–16장',
    intro: '여호수아와 그 세대가 다 조상들에게 돌아가고, 여호와를 알지 못하는 다른 세대가 일어났다. 이스라엘이 바알들을 섬기자 여호와께서 그들을 노략하는 자의 손에 넘기셨고, 그들이 부르짖을 때마다 사사들을 세워 구원하셨다 (삿 2:10-19). 수백 년에 걸친 옷니엘에서 삼손까지의 이야기를 한 시대로 압축했다. 사사들은 사건을 따라 차례로 일어난다. "그 때에는 이스라엘에 왕이 없으므로 사람이 각기 자기의 소견에 옳은 대로 행하였더라" (삿 21:25).',
    factions: [
      { id: 'israel', name: '이스라엘 지파 연합', ruler: '옷니엘', color: '#e2b04a', capital: 'shiloh', gold: 400, food: 7000, aggr: 0.35,
        desc: '왕도 상비군도 없이 느슨하게 묶인 열두 지파. 실로의 회막이 유일한 중심이다. 구원할 때마다 여호와께서 사사를 세우시지만, 사사가 죽으면 백성은 다시 돌아선다 (삿 2:18-19). 사사들 대부분은 아직 재야에 있다.',
        cities: { shiloh: 2500, shechem: 2000, bethel: 1500, hebron: 1500, bethlehem: 1000, mahanaim: 1200, ramoth: 1000 } },
      { id: 'aram', name: '아람 나하라임', ruler: '구산 리사다임', color: '#6f8fd8', capital: 'damascus', gold: 1200, food: 8000, aggr: 0.45,
        desc: '메소보다미아 왕 구산 리사다임. 이스라엘이 그를 팔 년 동안 섬겼다 (삿 3:8). 첫 번째 압제자.',
        cities: { damascus: 6000 } },
      { id: 'moab', name: '모압', ruler: '에글론', color: '#9a6fbf', capital: 'kirhareseth', gold: 800, food: 6000, aggr: 0.45,
        desc: '에글론이 암몬과 아말렉을 모아 종려나무 성읍(여리고)을 점령하고 이스라엘을 열여덟 해 동안 섬기게 했다 (삿 3:12-14).',
        cities: { kirhareseth: 3500, dibon: 2500, jericho: 4000 } },
      { id: 'canaan', name: '가나안 (하솔)', ruler: '야빈', color: '#cf6d9c', capital: 'hazor', gold: 1200, food: 8000, aggr: 0.4,
        desc: '하솔에서 다스리는 가나안 왕 야빈. 철 병거 구백 대로 이십 년 동안 이스라엘을 심히 학대했다 (삿 4:2-3).',
        cities: { hazor: 6000, megiddo: 4500, bethshean: 3000 } },
      { id: 'midian', name: '미디안', ruler: '세바', color: '#a0876a', capital: 'bozrah', gold: 900, food: 9000, aggr: 0.5,
        desc: '미디안과 아말렉과 동방 사람들. 약대와 함께 메뚜기 떼처럼 올라와 가사에 이르기까지 토지 소산을 멸했다 (삿 6:3-5).',
        cities: { bozrah: 4000, beersheba: 5000 } },
      { id: 'ammon', name: '암몬', ruler: '암몬 왕', color: '#5ea67c', capital: 'rabbah', gold: 700, food: 6000, aggr: 0.4,
        desc: '요단 저편 길르앗을 열여덟 해 동안 억압하고, 요단을 건너 유다와 베냐민과 에브라임과도 싸웠다 (삿 10:8-9).',
        cities: { rabbah: 5000 } },
      { id: 'philistia', name: '블레셋', ruler: '가사 방백', color: '#c9573f', capital: 'gaza', gold: 1400, food: 9000, aggr: 0.3,
        desc: '해안의 다섯 방백. 시대의 끝에 사십 년 동안 이스라엘을 다스린다 (삿 13:1). 다곤 신전이 가사에 있다.',
        cities: { gaza: 5000, gath: 5000, ekron: 4000, ashdod: 4000, ashkelon: 3000, joppa: 2000 } },
      { id: 'jebus', name: '여부스', ruler: '여부스 왕', color: '#8f86a8', capital: 'jerusalem', gold: 600, food: 4000, aggr: 0.05,
        desc: '베냐민 자손이 쫓아내지 못한 여부스 사람의 산성 (삿 1:21). "이방 사람의 성읍"이라 불렸다 (삿 19:12).',
        cities: { jerusalem: 3000 } },
      { id: 'tyre', name: '두로', ruler: '두로 왕', color: '#3fb3b5', capital: 'tyre', gold: 2000, food: 5000, aggr: 0.05,
        desc: '시돈과 함께 해안의 상인 왕국. 싸움보다 장사를 좋아한다 (삿 10:12; 18:7).', cities: { tyre: 4000 } },
    ],
    // 단 = 아직 단 지파가 차지하지 못한 평온한 성 라이스 (삿 18:7, 27-29). 바락과 야엘이 이 근처(게데스·사아난님)에 있다.
    neutral: { dan: 1000 },
    officers: [
      ['옷니엘', 82, 68, 62, 72, 90, 'israel', 'shiloh', '갈렙의 아우 그나스의 아들. 여호와의 영이 임하여 첫 사사가 되었다.', '삿 3:9-11'],
      ['비느하스', 55, 72, 60, 65, 95, 'israel', 'shiloh', '엘르아살의 아들 대제사장. 그 때에 언약궤 앞에 모시고 섰다.', '삿 20:27-28'],
      ['악사', 15, 75, 72, 80, 82, 'israel', 'hebron', '갈렙의 딸, 옷니엘의 아내. "윗샘과 아랫샘"을 구한 지혜로운 여인.', '삿 1:12-15'],
      ['요아스', 40, 55, 60, 60, 35, 'israel', 'shechem', '므낫세 오브라의 아비에셀 사람, 기드온의 아버지. 그의 집에 바알 제단이 있었다.', '삿 6:11, 25-32'],
      ['돌라', 60, 62, 72, 62, 78, 'israel', 'shechem', '잇사갈 사람 부아의 아들. 에브라임 산지 사밀에 살며 이십삼 년 동안 사사로 있었다.', '삿 10:1-2'],
      ['엘론', 58, 58, 68, 60, 72, 'israel', 'shiloh', '스불론 사람. 십 년 동안 이스라엘의 사사로 있었다.', '삿 12:11-12'],
      ['압돈', 52, 60, 74, 70, 70, 'israel', 'bethel', '비라돈 사람 힐렐의 아들. 아들 사십과 손자 삼십이 나귀 칠십을 탔다.', '삿 12:13-15'],
      ['입산', 50, 60, 72, 75, 70, 'israel', 'bethlehem', '베들레헴 사람. 아들 삼십과 딸 삼십을 두었다.', '삿 12:8-10'],
      ['야일', 62, 55, 70, 68, 70, 'israel', 'mahanaim', '길르앗 사람. 아들 삼십이 어린 나귀 삼십을 타고 성읍 삼십을 다스렸다.', '삿 10:3-5'],
      ['에훗', 86, 80, 55, 70, 85, null, 'bethel', '베냐민 사람 게라의 아들, 왼손잡이. 모압 왕에게 조공을 바치러 가는 사자였다.', '삿 3:15'],
      ['삼갈', 90, 35, 30, 55, 75, null, 'hebron', '아낫의 아들. 소 모는 막대기로 블레셋 사람 육백 명을 죽였다.', '삿 3:31'],
      ['드보라', 20, 92, 90, 95, 98, null, 'bethel', '랍비돗의 아내, 여선지자. 라마와 벧엘 사이 종려나무 아래에서 이스라엘을 재판했다. "이스라엘의 어머니".', '삿 4:4-5; 5:7'],
      ['바락', 84, 60, 55, 70, 75, null, 'dan', '납달리 게데스 사람 아비노암의 아들. 믿음의 사람들 가운데 이름이 올랐다.', '삿 4:6; 히 11:32'],
      ['야엘', 45, 80, 40, 70, 80, null, 'dan', '겐 사람 헤벨의 아내. "장막에 거한 여인들보다 더욱 복을 받을 것이로다".', '삿 4:17-22; 5:24'],
      ['기드온', 80, 75, 65, 82, 72, null, 'shechem', '요아스의 아들. 미디안을 피해 포도주 틀에서 밀을 타작하다가 "큰 용사여" 하는 부르심을 받았다.', '삿 6:11-12'],
      ['부라', 60, 45, 30, 50, 70, null, 'shechem', '기드온의 부하. 밤에 기드온과 함께 미디안 진영으로 내려갔다.', '삿 7:10-11'],
      ['입다', 90, 70, 55, 72, 70, null, 'ramoth', '길르앗 사람, 큰 용사. 기생의 아들이라 형제들에게 쫓겨나 돕 땅에 살았다.', '삿 11:1-3'],
      ['마노아', 25, 55, 55, 60, 85, null, 'bethlehem', '소라 땅 단 지파 사람, 삼손의 아버지. 여호와의 사자에게 아이 기를 법을 물었다.', '삿 13:2, 8-12'],
      ['삼손', 99, 40, 25, 65, 70, null, 'bethlehem', '나실인으로 구별된 소라 사람. 여호와의 영이 임하면 누구도 그를 막지 못했다.', '삿 13:24-25; 15:14-16'],
      ['구산 리사다임', 78, 65, 62, 50, 10, 'aram', 'damascus', '메소보다미아(아람 나하라임) 왕. 이스라엘이 팔 년 동안 그를 섬겼다.', '삿 3:8-10'],
      ['아람 왕', 70, 60, 60, 55, 10, 'aram', 'damascus', '구산 리사다임을 섬기는 다메섹의 아람 족장.', ''],
      ['에글론', 55, 60, 68, 50, 10, 'moab', 'jericho', '모압 왕, 심히 비둔한 자. 종려나무 성읍의 서늘한 다락방에 앉아 조공을 받았다.', '삿 3:12-17, 20'],
      ['모압 왕', 62, 55, 60, 50, 15, 'moab', 'kirhareseth', '에글론 뒤를 이을 모압의 왕족.', ''],
      ['야빈', 75, 72, 72, 60, 10, 'canaan', 'hazor', '하솔에서 다스린 가나안 왕. 철 병거 구백 대를 가졌다.', '삿 4:2-3, 23-24'],
      ['시스라', 90, 70, 50, 60, 8, 'canaan', 'megiddo', '하로셋학고임에 사는 야빈의 군대 장관. 병거를 기손 강으로 모았다.', '삿 4:2, 7, 13'],
      ['세바', 78, 65, 62, 58, 8, 'midian', 'bozrah', '미디안의 두 왕 가운데 하나. 다볼에서 기드온의 형제들을 죽였다.', '삿 8:5, 18-21'],
      ['살문나', 76, 60, 58, 55, 8, 'midian', 'bozrah', '미디안의 두 왕 가운데 하나. 갈골에 군대 만 오천과 함께 있었다.', '삿 8:10-12'],
      ['오렙', 80, 50, 40, 40, 5, 'midian', 'beersheba', '미디안의 방백. 오렙 바위에서 죽었다.', '삿 7:25'],
      ['스엡', 78, 50, 40, 40, 5, 'midian', 'beersheba', '미디안의 방백. 스엡 포도주 틀에서 죽었다.', '삿 7:25'],
      ['아말렉 장수', 72, 40, 30, 30, 5, 'midian', 'beersheba', '미디안과 함께 올라온 아말렉 군의 장수.', '삿 6:3, 33'],
      ['암몬 왕', 65, 58, 55, 45, 10, 'ammon', 'rabbah', '"이스라엘이 애굽에서 올라올 때에 내 땅을 점령했으니 돌려 달라" 한 왕.', '삿 11:12-28'],
      ['암몬 장수', 74, 40, 30, 30, 5, 'ammon', 'rabbah', '길르앗에 진을 친 암몬 군의 장수.', '삿 10:17'],
      ['가사 방백', 70, 60, 62, 50, 5, 'philistia', 'gaza', '블레셋 다섯 방백 가운데 하나. 다곤 신전의 큰 제사를 주관했다.', '삿 3:3; 16:23'],
      ['가드 방백', 74, 50, 50, 45, 5, 'philistia', 'gath', '블레셋 다섯 방백 가운데 하나.', '삿 3:3'],
      ['블레셋 방백', 68, 62, 60, 45, 5, 'philistia', 'gaza', '들릴라에게 은 천백 개씩을 약속한 블레셋 방백.', '삿 16:5, 18'],
      ['들릴라', 10, 85, 50, 90, 5, 'philistia', 'ekron', '소렉 골짜기의 여인. 삼손의 힘이 어디에 있는지 캐물었다.', '삿 16:4-20'],
      ['여부스 왕', 60, 60, 65, 50, 10, 'jebus', 'jerusalem', '베냐민 자손이 쫓아내지 못한 여부스 사람의 우두머리.', '삿 1:21; 19:10-12'],
      ['두로 왕', 50, 75, 85, 75, 20, 'tyre', 'tyre', '바다의 상인 왕.', ''],
    ],
    rel: [['israel', 'tyre', 40], ['moab', 'ammon', 60], ['midian', 'ammon', 45], ['philistia', 'ammon', 50], ['israel', 'aram', 10], ['israel', 'moab', 15], ['israel', 'canaan', 10], ['israel', 'midian', 10], ['israel', 'ammon', 15], ['israel', 'philistia', 25]],
    goals: {
      israel: ['shiloh', 'bethel', 'shechem', 'jericho', 'hebron', 'bethlehem', 'beersheba', 'mahanaim', 'ramoth', 'megiddo', 'hazor', 'gath'],
      philistia: ['gaza', 'gath', 'ekron', 'ashdod', 'ashkelon', 'joppa', 'bethlehem', 'hebron', 'bethel', 'shiloh'],
    },
    goalText: {
      israel: '압제자마다 이스라엘을 건진다. 모압의 여리고, 가나안의 하솔·므깃도, 미디안의 브엘세바, 블레셋의 가드를 되찾아 실로에서 길르앗까지 약속의 땅 12성을 지킨다.',
      philistia: '다섯 성읍과 욥바를 지키고, 베들레헴·헤브론에서 벧엘·실로까지 이스라엘 산지를 다스린다 (삿 13:1; 15:11).',
    },
  },
  {
    id: 'saul',
    title: '사울의 왕국',
    year: 1050,
    ref: '사무엘상 9–17장',
    intro: '"우리에게 왕을 주어 다른 나라들 같이 되게 하소서." 백성의 요구에 사무엘이 베냐민 사람 기스의 아들 사울에게 기름을 부었다. 그러나 이스라엘에는 대장장이가 없고, 블레셋 수비대가 믹마스와 게바의 산지를 누르고 있다. 동쪽에서는 암몬 왕 나하스가 길르앗 야베스를 에워쌌다.',
    factions: [
      { id: 'israel', name: '이스라엘', ruler: '사울', color: '#e2b04a', capital: 'bethel', gold: 500, food: 8000, aggr: 0.4,
        desc: '갓 세워진 첫 왕국. 사울이 "믹마스와 벧엘 산지"(벧엘)에 진을 쳤다. 블레셋이 대장장이를 막아 칼과 창을 가진 이는 사울과 요나단뿐이다 (삼상 13:19-22).',
        cities: { bethel: 3000, shiloh: 1500, shechem: 2000, bethlehem: 1200, hebron: 1500, jericho: 1200, mahanaim: 1500 } },
      { id: 'philistia', name: '블레셋', ruler: '아기스', color: '#c9573f', capital: 'gath', gold: 1500, food: 9000, aggr: 0.55,
        desc: '철을 다루는 해안의 다섯 성읍. 병거 삼만과 마병 육천, 해변의 모래 같은 백성으로 믹마스에 진을 쳤다 (삼상 13:5).',
        cities: { gath: 6000, ekron: 5000, ashdod: 4500, ashkelon: 3500, gaza: 4000, joppa: 2500 } },
      { id: 'ammon', name: '암몬', ruler: '나하스', color: '#5ea67c', capital: 'rabbah', gold: 700, food: 6000, aggr: 0.5,
        desc: '길르앗 야베스(라못길르앗)를 에워싸고 "너희 오른눈을 다 빼야" 언약하겠다고 한 나하스의 나라 (삼상 11:1-2).',
        cities: { rabbah: 5000 } },
      { id: 'amalek', name: '아말렉', ruler: '아각', color: '#a0876a', capital: 'beersheba', gold: 600, food: 5000, aggr: 0.4,
        desc: '광야에서 이스라엘의 뒤를 친 남방의 유목민. 여호와께서 그 죄를 기억하셨다 (삼상 15:2).',
        cities: { beersheba: 3500 } },
      { id: 'moab', name: '모압', ruler: '모압 왕', color: '#9a6fbf', capital: 'kirhareseth', gold: 700, food: 5000, aggr: 0.25,
        desc: '사울이 사방에서 싸운 대적 중 하나 (삼상 14:47).', cities: { kirhareseth: 3000, dibon: 2000 } },
      { id: 'edom', name: '에돔', ruler: '에돔 왕', color: '#b5804f', capital: 'bozrah', gold: 600, food: 4000, aggr: 0.2,
        desc: '세일 산의 에돔. 사울의 목자장 도엑이 이 백성이다.', cities: { bozrah: 2500 } },
      { id: 'aram', name: '소바', ruler: '아람 왕', color: '#cf6d9c', capital: 'damascus', gold: 1200, food: 8000, aggr: 0.3,
        desc: '다메섹 북쪽 소바의 왕들이 이끄는 아람 연합 (삼상 14:47).', cities: { damascus: 5000 } },
      { id: 'tyre', name: '두로', ruler: '두로 왕', color: '#3fb3b5', capital: 'tyre', gold: 2000, food: 5000, aggr: 0.05,
        desc: '바다 무역으로 부유한 베니게의 성읍. 싸움보다 장사를 좋아한다.', cities: { tyre: 4000 } },
      { id: 'jebus', name: '여부스', ruler: '아라우나', color: '#8f86a8', capital: 'jerusalem', gold: 600, food: 4000, aggr: 0.05,
        desc: '베냐민 땅 한가운데 남은 가나안의 산성.', cities: { jerusalem: 2500 } },
    ],
    // 라못길르앗 = 나하스에게 포위된 길르앗 야베스. 북쪽 성읍들은 가나안의 남은 무리.
    neutral: { ramoth: 1500, hazor: 1500, megiddo: 1500, bethshean: 1200, dan: 800 },
    officers: [
      ['사울', 85, 50, 60, 85, 60, 'israel', 'bethel', '베냐민 사람 기스의 아들. 모든 백성보다 어깨 위만큼 컸던 이스라엘의 첫 왕.', '삼상 9:1-2; 10:1'],
      ['요나단', 90, 75, 65, 90, 92, 'israel', 'bethel', '사울의 맏아들. "여호와의 구원은 사람이 많고 적음에 달리지 아니하였느니라."', '삼상 14:6'],
      ['아브넬', 88, 78, 72, 75, 55, 'israel', 'bethel', '넬의 아들, 사울의 숙부의 아들이자 군사령관.', '삼상 14:50'],
      ['사무엘', 15, 95, 90, 92, 99, 'israel', 'bethel', '마지막 사사이자 선지자. 벧엘·길갈·미스바를 돌며 이스라엘을 다스렸다. 장수가 아니라 말씀을 전하는 자.', '삼상 7:15-17; 15:22'],
      ['아히야', 20, 70, 60, 65, 85, 'israel', 'shiloh', '아히둡의 아들, 실로의 엘리 가문 제사장. 에봇을 입고 사울 곁에 있었다.', '삼상 14:3, 18'],
      ['기스', 35, 55, 60, 60, 55, 'israel', 'bethel', '아비엘의 아들, 베냐민의 유력한 사람. 사울의 아버지.', '삼상 9:1'],
      ['이스보셋', 30, 40, 55, 50, 50, 'israel', 'mahanaim', '사울의 아들 (이스위). 훗날 마하나임에서 왕이 된다.', '삼상 14:49; 삼하 2:8'],
      ['말기수아', 70, 45, 40, 50, 55, 'israel', 'shechem', '사울의 아들, 아버지와 함께 싸운 왕자.', '삼상 14:49; 31:2'],
      ['아비나답', 68, 45, 40, 50, 55, 'israel', 'jericho', '사울의 아들.', '삼상 31:2'],
      ['미갈', 10, 72, 55, 85, 60, 'israel', 'bethel', '사울의 작은 딸. 다윗을 사랑하여 창문으로 달아나게 했다.', '삼상 18:20; 19:11-17'],
      ['도엑', 75, 50, 40, 20, 5, 'israel', 'bethel', '에돔 사람, 사울의 목자장. 훗날 놉의 제사장들을 죽였다.', '삼상 21:7; 22:18'],
      ['엘리압', 78, 45, 40, 60, 50, 'israel', 'bethlehem', '이새의 맏아들. 용모와 키가 뛰어났으나 여호와께서 버리셨다.', '삼상 16:6-7; 17:13'],
      ['다윗', 85, 78, 65, 92, 98, null, 'bethlehem', '이새의 막내, 들에서 양을 치는 소년. 사자와 곰의 발톱에서 양을 건졌다.', '삼상 16:11-13; 17:34-37'],
      ['이새', 20, 60, 55, 70, 85, null, 'bethlehem', '베들레헴 사람, 오벳의 아들. 여덟 아들의 아버지.', '삼상 16:1; 17:12'],
      ['요압', 85, 70, 55, 55, 50, null, 'bethlehem', '다윗의 누이 스루야의 아들. 아직 이름 없는 젊은 용사.', '삼상 26:6; 삼하 2:13'],
      ['아비새', 85, 50, 40, 55, 60, null, 'hebron', '스루야의 아들, 요압의 아우.', '삼상 26:6-9'],
      ['아사헬', 75, 45, 35, 55, 60, null, 'hebron', '스루야의 아들, 발이 들노루 같이 빠른 청년.', '삼하 2:18'],
      ['발디엘', 40, 50, 55, 60, 60, null, 'bethel', '갈림 사람 라이스의 아들. 훗날 미갈의 남편이 된다.', '삼상 25:44'],
      ['아기스', 60, 70, 75, 70, 20, 'philistia', 'gath', '가드 왕 마옥의 아들.', '삼상 21:10; 27:2'],
      ['골리앗', 99, 30, 20, 40, 5, 'philistia', 'gath', '가드 사람, 키가 여섯 규빗 한 뼘. 놋 투구와 오천 세겔 비늘 갑옷을 입고 사십 일 동안 이스라엘을 모욕했다.', '삼상 17:4-10'],
      ['가드 방백', 70, 55, 55, 45, 5, 'philistia', 'gath', '가드의 방백.', '삼상 29:2'],
      ['블레셋 방백', 68, 60, 60, 45, 5, 'philistia', 'ashdod', '블레셋 다섯 방백 중 하나.', '삼상 6:16; 29:6'],
      ['블레셋 수비대장', 72, 45, 40, 35, 5, 'philistia', 'ekron', '게바와 믹마스 어귀를 지키던 블레셋 수비대의 장수.', '삼상 13:3, 23'],
      ['블레셋 병거대장', 80, 50, 40, 40, 5, 'philistia', 'gaza', '병거 삼만과 마병 육천을 거느린 장수.', '삼상 13:5'],
      ['나하스', 82, 55, 50, 40, 10, 'ammon', 'rabbah', '길르앗 야베스를 에워싸고 오른눈을 빼겠다던 암몬 왕.', '삼상 11:1-2'],
      ['암몬 장수', 75, 40, 30, 30, 5, 'ammon', 'rabbah', '새벽에 사울의 세 부대에 흩어진 암몬 군의 장수.', '삼상 11:11'],
      ['하눈', 55, 45, 45, 35, 15, 'ammon', 'rabbah', '나하스의 아들.', '삼하 10:1'],
      ['아각', 75, 55, 50, 45, 5, 'amalek', 'beersheba', '아말렉 왕. "진실로 사망의 괴로움이 지났도다" 하며 나아왔다.', '삼상 15:8, 32'],
      ['아말렉 장수', 72, 40, 30, 30, 5, 'amalek', 'beersheba', '하윌라에서 술까지 흩어진 아말렉 군의 장수.', '삼상 15:7; 30:1'],
      ['모압 왕', 60, 55, 60, 50, 20, 'moab', 'kirhareseth', '모압의 왕. 훗날 다윗의 부모를 맡아 준다.', '삼상 14:47; 22:3-4'],
      ['에돔 왕', 65, 55, 50, 45, 10, 'edom', 'bozrah', '에돔의 왕.', '삼상 14:47'],
      ['아람 왕', 72, 60, 60, 55, 10, 'aram', 'damascus', '소바의 왕.', '삼상 14:47'],
      ['소바 장수', 78, 45, 35, 40, 10, 'aram', 'damascus', '소바 왕의 군대 장관.', '삼상 14:47'],
      ['두로 왕', 50, 75, 85, 75, 20, 'tyre', 'tyre', '바다의 상인 왕.', ''],
      ['아라우나', 40, 60, 70, 60, 40, 'jebus', 'jerusalem', '여부스 사람, 훗날 성전 터의 주인.', '삼하 24:18'],
    ],
    rel: [['israel', 'tyre', 50], ['israel', 'moab', 40], ['philistia', 'ammon', 45], ['philistia', 'amalek', 45], ['israel', 'philistia', 10], ['israel', 'ammon', 10], ['israel', 'amalek', 5]],
    goals: {
      israel: ['bethel', 'shiloh', 'shechem', 'jericho', 'mahanaim', 'ramoth', 'bethlehem', 'hebron', 'beersheba', 'rabbah', 'ekron', 'gath'],
      philistia: ['gath', 'ekron', 'ashdod', 'ashkelon', 'gaza', 'joppa', 'bethel', 'shiloh', 'shechem', 'jericho', 'bethlehem', 'hebron'],
    },
    goalText: {
      israel: '사방의 대적에게서 이스라엘을 건진다 (삼상 14:47-48). 본토의 성과 길르앗 야베스, 아말렉의 브엘세바, 암몬의 랍바, 블레셋의 에그론·가드까지 12성을 차지한다.',
      philistia: '다섯 성읍과 욥바를 지키고, 벧엘에서 헤브론까지 이스라엘 산지 전체를 다스린다.',
    },
  },
  {
    id: 'david',
    title: '다윗의 통일 전쟁',
    year: 1010,
    ref: '사무엘하 2–8장',
    intro: '사울이 길보아 산에서 죽었다. 유다 사람들은 헤브론에서 다윗에게 기름을 부었고, 아브넬은 사울의 아들 이스보셋을 마하나임에서 왕으로 세웠다. 사울의 집과 다윗의 집 사이에 오랜 전쟁이 시작된다.',
    factions: [
      { id: 'judah', name: '유다', ruler: '다윗', color: '#e2b04a', capital: 'hebron', gold: 800, food: 7000, aggr: 0.45,
        desc: '헤브론에서 기름부음 받은 다윗의 나라. 작지만 용사들이 많다.',
        cities: { hebron: 4000, bethlehem: 2000, beersheba: 1500 } },
      { id: 'israel', name: '이스라엘', ruler: '이스보셋', color: '#5a93d8', capital: 'mahanaim', gold: 1000, food: 9000, aggr: 0.35,
        desc: '사울의 아들 이스보셋. 실권은 군사령관 아브넬에게 있다.',
        cities: { mahanaim: 4000, shechem: 3000, shiloh: 1500, bethel: 2000, jericho: 1500, bethshean: 2000, megiddo: 2500, hazor: 2500, dan: 1500, ramoth: 2000 } },
      { id: 'philistia', name: '블레셋', ruler: '아기스', color: '#c9573f', capital: 'gath', gold: 1200, food: 8000, aggr: 0.5,
        desc: '사울을 쓰러뜨린 해안의 강국.',
        cities: { gath: 5000, ekron: 3500, ashdod: 4000, ashkelon: 3000, gaza: 3500, joppa: 2000 } },
      { id: 'jebus', name: '여부스', ruler: '아라우나', color: '#8f86a8', capital: 'jerusalem', gold: 800, food: 5000, aggr: 0.05,
        desc: '"맹인과 다리 저는 자라도 너를 물리치리라" 자신하던 시온 산성.',
        cities: { jerusalem: 3000 } },
      { id: 'moab', name: '모압', ruler: '모압 왕', color: '#9a6fbf', capital: 'kirhareseth', gold: 700, food: 5000, aggr: 0.25,
        desc: '다윗의 부모가 몸을 의탁했던 나라.', cities: { kirhareseth: 3000, dibon: 2000 } },
      { id: 'ammon', name: '암몬', ruler: '하눈', color: '#5ea67c', capital: 'rabbah', gold: 700, food: 5000, aggr: 0.3,
        desc: '나하스의 아들 하눈이 다스리는 나라.', cities: { rabbah: 3500 } },
      { id: 'edom', name: '에돔', ruler: '하닷', color: '#b5804f', capital: 'bozrah', gold: 600, food: 4000, aggr: 0.25,
        desc: '에돔 왕족 하닷.', cities: { bozrah: 2500 } },
      { id: 'aram', name: '아람', ruler: '하닷에셀', color: '#cf6d9c', capital: 'damascus', gold: 1500, food: 9000, aggr: 0.35,
        desc: '소바 왕 하닷에셀이 이끄는 아람 연합.', cities: { damascus: 6000 } },
      { id: 'tyre', name: '두로', ruler: '히람', color: '#3fb3b5', capital: 'tyre', gold: 2500, food: 5000, aggr: 0.05,
        desc: '다윗을 사랑한 두로 왕 히람.', cities: { tyre: 4000 } },
    ],
    neutral: {},
    officers: [
      ['다윗', 90, 80, 85, 99, 98, 'judah', 'hebron', '이새의 아들, 골리앗을 쓰러뜨린 목동 왕.', '삼상 17장; 삼하 2:4'],
      ['요압', 92, 75, 70, 60, 50, 'judah', 'hebron', '다윗의 조카, 유다의 군대 장관.', '삼하 2:13'],
      ['나단', 20, 92, 80, 85, 99, 'judah', 'hebron', '다윗 곁의 선지자.', '삼하 7장; 12장'],
      ['아히도벨', 15, 98, 88, 60, 40, 'judah', 'hebron', '그의 계략은 하나님께 물어 받은 말씀 같았다.', '삼하 16:23'],
      ['아비아달', 25, 70, 65, 70, 92, 'judah', 'hebron', '놉의 학살에서 홀로 살아남은 제사장.', '삼상 22:20'],
      ['아비새', 90, 55, 40, 55, 60, 'judah', 'bethlehem', '요압의 아우, 창으로 삼백 명을 죽인 용사.', '삼하 23:18'],
      ['브나야', 93, 60, 50, 60, 75, 'judah', 'bethlehem', '눈 오는 날 구덩이에서 사자를 죽인 용사.', '삼하 23:20'],
      ['아사헬', 80, 45, 35, 55, 60, 'judah', 'beersheba', '발이 들노루 같이 빠른 요압의 아우.', '삼하 2:18'],
      ['엘르아살', 94, 45, 30, 45, 70, null, 'bethlehem', '손이 칼에 붙도록 블레셋을 친 세 용사 중 하나.', '삼하 23:9-10'],
      ['요셉밧세벳', 96, 40, 30, 40, 60, null, 'hebron', '세 용사의 우두머리.', '삼하 23:8'],
      ['후새', 30, 85, 70, 75, 80, null, 'bethel', '다윗의 벗, 아렉 사람.', '삼하 15:32-37'],
      ['사독', 30, 80, 70, 75, 95, null, 'shiloh', '엘르아살 계열의 제사장.', '삼하 8:17'],
      ['삼마', 91, 40, 30, 45, 70, null, 'ashkelon', '녹두나무 밭을 홀로 지킨 용사.', '삼하 23:11-12'],
      ['이스보셋', 30, 40, 55, 50, 50, 'israel', 'mahanaim', '사울의 아들, 마하나임에서 왕이 되었다.', '삼하 2:8-10'],
      ['아브넬', 90, 80, 75, 80, 55, 'israel', 'mahanaim', '사울의 군사령관, 이스라엘의 실권자.', '삼하 2:8'],
      ['레갑', 70, 40, 20, 20, 20, 'israel', 'shechem', '브에롯 사람 림몬의 아들, 군 지휘관.', '삼하 4:2'],
      ['바아나', 68, 40, 20, 20, 20, 'israel', 'megiddo', '레갑의 형제, 군 지휘관.', '삼하 4:2'],
      ['시므이', 45, 60, 50, 40, 30, 'israel', 'bethel', '사울 집안의 베냐민 사람.', '삼하 16:5'],
      ['아기스', 60, 70, 75, 70, 20, 'philistia', 'gath', '가드 왕, 한때 다윗을 받아준 자.', '삼상 27:2'],
      ['이스비브놉', 88, 30, 20, 30, 10, 'philistia', 'gath', '거인족의 아들, 삼백 세겔 무게의 창을 든 자.', '삼하 21:16'],
      ['삽', 84, 30, 20, 25, 10, 'philistia', 'ekron', '거인족의 아들.', '삼하 21:18'],
      ['라흐미', 86, 30, 20, 25, 10, 'philistia', 'ashdod', '골리앗의 아우.', '대상 20:5'],
      ['아라우나', 40, 60, 70, 60, 40, 'jebus', 'jerusalem', '여부스 사람, 훗날 성전 터의 주인.', '삼하 24:18'],
      ['모압 왕', 60, 55, 60, 50, 20, 'moab', 'kirhareseth', '모압의 왕.', '삼상 22:3-4'],
      ['하눈', 65, 45, 45, 35, 15, 'ammon', 'rabbah', '다윗의 조문 사절을 모욕한 암몬 왕.', '삼하 10:1-4'],
      ['소비', 50, 60, 65, 70, 50, 'ammon', 'rabbah', '나하스의 아들, 훗날 다윗을 도운 자.', '삼하 17:27'],
      ['하닷', 70, 65, 55, 60, 20, 'edom', 'bozrah', '에돔 왕족.', '왕상 11:14'],
      ['하닷에셀', 80, 70, 70, 60, 20, 'aram', 'damascus', '르홉의 아들 소바 왕.', '삼하 8:3'],
      ['소박', 88, 55, 35, 45, 15, 'aram', 'damascus', '하닷에셀의 군대 장관.', '삼하 10:16'],
      ['르손', 75, 65, 50, 55, 15, 'aram', 'damascus', '훗날 다메섹의 왕이 된 자.', '왕상 11:23-24'],
      ['히람', 50, 80, 90, 85, 50, 'tyre', 'tyre', '백향목과 목수를 보낸 두로 왕.', '삼하 5:11'],
    ],
    rel: [['judah', 'tyre', 70], ['judah', 'moab', 55]],
    goals: { judah: HOLY_LAND, israel: HOLY_LAND },
    goalText: { judah: '단에서 브엘세바까지, 이스라엘과 유다 본토 14성을 하나로 묶는다.', israel: '단에서 브엘세바까지, 이스라엘과 유다 본토 14성을 하나로 묶는다.' },
  },
  {
    id: 'divided',
    title: '분열 왕국',
    year: 930,
    ref: '열왕기상 12–15장; 역대하 10–14장',
    intro: '솔로몬이 죽고 르호보암이 세겜에서 "내 새끼손가락이 아버지의 허리보다 굵다"고 답하자, 열 지파가 떨어져 나가 여로보암을 왕으로 세웠다. 남쪽에서는 애굽 왕 시삭이 기회를 엿본다.',
    factions: [
      { id: 'judah', name: '유다', ruler: '르호보암', color: '#e2b04a', capital: 'jerusalem', gold: 1500, food: 8000, aggr: 0.4,
        desc: '다윗 왕조와 성전을 지킨 남 왕국. 땅은 작지만 예루살렘이 있다.',
        cities: { jerusalem: 6000, bethlehem: 2500, hebron: 3000, beersheba: 2000 } },
      { id: 'israel', name: '이스라엘', ruler: '여로보암', color: '#5a93d8', capital: 'shechem', gold: 1200, food: 10000, aggr: 0.45,
        desc: '열 지파의 북 왕국. 땅과 인구가 많다.',
        cities: { shechem: 5000, shiloh: 2000, bethel: 3000, jericho: 2000, mahanaim: 3000, bethshean: 2500, megiddo: 3500, hazor: 3000, dan: 2500, ramoth: 2500 } },
      { id: 'egypt', name: '애굽', ruler: '시삭', color: '#d98a3a', capital: 'gaza', gold: 3000, food: 14000, aggr: 0.55,
        desc: '제22왕조의 시삭(셰숑크 1세). 가나안 원정을 준비한다.', cities: { gaza: 9000 } },
      { id: 'philistia', name: '블레셋', ruler: '블레셋 방백', color: '#c9573f', capital: 'gath', gold: 900, food: 6000, aggr: 0.3,
        desc: '힘이 약해진 해안 성읍들.', cities: { gath: 3000, ekron: 2500, ashdod: 3000, ashkelon: 2500, joppa: 2000 } },
      { id: 'aram', name: '아람', ruler: '르손', color: '#cf6d9c', capital: 'damascus', gold: 1500, food: 9000, aggr: 0.35,
        desc: '솔로몬의 대적이던 르손이 다메섹에서 일으킨 나라.', cities: { damascus: 5000 } },
      { id: 'moab', name: '모압', ruler: '모압 왕', color: '#9a6fbf', capital: 'kirhareseth', gold: 700, food: 5000, aggr: 0.25,
        desc: '이스라엘에 조공을 바치던 나라.', cities: { kirhareseth: 3000, dibon: 2000 } },
      { id: 'ammon', name: '암몬', ruler: '암몬 왕', color: '#5ea67c', capital: 'rabbah', gold: 700, food: 5000, aggr: 0.25,
        desc: '르호보암의 어머니 나아마의 고향.', cities: { rabbah: 3000 } },
      { id: 'edom', name: '에돔', ruler: '하닷', color: '#b5804f', capital: 'bozrah', gold: 600, food: 4000, aggr: 0.25,
        desc: '솔로몬의 대적 하닷이 돌아온 땅.', cities: { bozrah: 2500 } },
      { id: 'tyre', name: '두로', ruler: '두로 왕', color: '#3fb3b5', capital: 'tyre', gold: 2500, food: 5000, aggr: 0.05,
        desc: '솔로몬과 교역하던 해상 왕국.', cities: { tyre: 4000 } },
    ],
    neutral: {},
    officers: [
      ['르호보암', 60, 45, 50, 40, 50, 'judah', 'jerusalem', '솔로몬의 아들. 원로의 조언을 버렸다.', '왕상 12:1-15'],
      ['아비야', 72, 60, 55, 60, 60, 'judah', 'jerusalem', '르호보암의 아들, 스마라임 산에서 외친 왕.', '대하 13:4-12'],
      ['스마야', 20, 85, 60, 75, 97, 'judah', 'jerusalem', '"너희 형제와 싸우지 말라"를 전한 하나님의 사람.', '왕상 12:22-24'],
      ['아사', 70, 70, 80, 75, 90, 'judah', 'hebron', '아비야의 아들, 우상을 없앤 선한 왕.', '왕상 15:11-14'],
      ['아도람', 40, 60, 75, 30, 40, 'judah', 'bethlehem', '역군의 감독.', '왕상 12:18'],
      ['잇도', 15, 88, 60, 70, 92, null, 'hebron', '족보와 왕들의 행적을 기록한 선견자.', '대하 12:15'],
      ['여로보암', 78, 85, 80, 85, 30, 'israel', 'shechem', '느밧의 아들, 에브라임 사람. 북 왕국의 첫 왕.', '왕상 11:26-40'],
      ['아히야', 15, 90, 55, 80, 96, 'israel', 'shiloh', '겉옷을 열두 조각으로 찢어 예언한 실로 선지자.', '왕상 11:29-31'],
      ['나답', 65, 45, 40, 40, 25, 'israel', 'bethel', '여로보암의 아들.', '왕상 15:25'],
      ['바아사', 85, 60, 55, 55, 20, 'israel', 'megiddo', '잇사갈 지파 아히야의 아들.', '왕상 15:27'],
      ['벧엘의 늙은 선지자', 10, 70, 40, 50, 60, null, 'bethel', '하나님의 사람을 속여 돌이키게 한 선지자.', '왕상 13:11-18'],
      ['시삭', 80, 80, 85, 70, 10, 'egypt', 'gaza', '애굽 왕, 성전 보물과 금방패를 빼앗은 자.', '왕상 14:25-26'],
      ['애굽 병거대장', 82, 50, 40, 40, 5, 'egypt', 'gaza', '병거 천이백 대를 이끈 장수.', '대하 12:3'],
      ['블레셋 방백', 68, 55, 55, 45, 5, 'philistia', 'gath', '블레셋의 방백.', ''],
      ['르손', 75, 65, 50, 55, 15, 'aram', 'damascus', '엘리아다의 아들, 다메섹의 왕.', '왕상 11:23-25'],
      ['헤시온', 60, 60, 65, 55, 10, 'aram', 'damascus', '르손 가문의 아람 사람.', '왕상 15:18'],
      ['모압 왕', 60, 55, 60, 50, 20, 'moab', 'kirhareseth', '모압의 왕.', ''],
      ['암몬 왕', 60, 50, 50, 45, 10, 'ammon', 'rabbah', '랍바의 왕.', ''],
      ['하닷', 70, 65, 55, 60, 20, 'edom', 'bozrah', '에돔 왕족, 솔로몬의 대적.', '왕상 11:14-22'],
      ['두로 왕', 50, 75, 85, 75, 20, 'tyre', 'tyre', '바다의 상인 왕.', ''],
    ],
    rel: [['judah', 'ammon', 60], ['israel', 'egypt', 60]],
    goals: { judah: HOLY_LAND, israel: HOLY_LAND },
    goalText: { judah: '갈라진 열두 지파를 다시 하나로 (본토 14성 통일).', israel: '갈라진 열두 지파를 다시 하나로 (본토 14성 통일).' },
  },
];

// 사사 시대 이벤트 도우미. 사사들이 차례로 일어나고, 신앙이 식으면 압제자가 돌아온다.
const JUDGE_KIT = {
  // 사사를 이스라엘에 합류시키고, lead면 지파 연합의 지도자(군주)로 세운다
  raise: (G, name, cid, lead) => {
    if (!G.exists('israel') || !G.alive(name)) return false;
    if (G.facOf(name) !== 'israel') G.join(name, 'israel', cid && G.ownerOf(cid) === 'israel' ? cid : undefined);
    if (lead) G.fac('israel').ruler = G.o(name).id;
    return true;
  },
  // 이스라엘 평균 신앙 (G에 평균 신앙 조회가 없어 성을 직접 센다)
  faith: G => { const cs = CITY_TABLE.map(r => G.city(r[0])).filter(c => c && c.owner === 'israel'); return cs.length ? cs.reduce((s, c) => s + c.faith, 0) / cs.length : 50; },
  faithAll: (G, d, loy) => G.eachCity('israel', c => { c.faith += d; if (loy) c.loy += loy; }),
  cut: (G, f, k, only) => G.eachCity(f, c => { if (!only || only.includes(c.id)) c.soldiers = Math.floor(c.soldiers * k); }),
  next: (G, n) => { G.flags.jNext = G.turn + n; },
  // 지금 시대의 압제자: 아직 구원 사건이 일어나지 않은 첫 세력
  oppressor: G => {
    const seq = [['aram', 'cushan'], ['moab', 'ehud'], ['canaan', 'deborah'], ['midian', 'gideon300'], ['ammon', 'jephthah'], ['philistia', 'delilah']];
    const live = seq.filter(([f]) => G.exists(f) && G.cityCount(f) > 0);
    const cur = live.find(([, e]) => !G.done[e]) || live[live.length - 1];
    return cur ? cur[0] : null;
  },
  // 압제자와 맞닿은 이스라엘 성 가운데 가장 약한 곳
  target: (G, f) => {
    if (!f) return null;
    const mine = CITY_TABLE.map(r => G.city(r[0])).filter(c => c && c.owner === 'israel');
    const near = mine.filter(c => ROADS.some(([a, b]) => (a === c.id && G.ownerOf(b) === f) || (b === c.id && G.ownerOf(a) === f)));
    const pool = (near.length ? near : mine).sort((a, b) => a.soldiers - b.soldiers);
    return pool.length ? pool[0].id : null;
  },
  // 다곤 신전 (삿 16:21-30)
  dagon: G => {
    G.kill('삼손'); G.kill('블레셋 방백'); G.kill('가사 방백');
    JUDGE_KIT.cut(G, 'philistia', 0.6, ['gaza']); JUDGE_KIT.cut(G, 'philistia', 0.85);
    G.buff('philistia', 'atk', 3, -0.2); JUDGE_KIT.faithAll(G, 5);
    G.flags.dagon = true; G.kingdom(2, '삼손의 마지막 기도');
    return '들릴라가 삼손의 머리털 일곱 가닥을 밀자 힘이 떠났고, 그는 여호와께서 떠나신 줄을 깨닫지 못했다(16:19-20). 블레셋 사람들이 그를 붙잡아 가사로 끌고 가 옥에서 맷돌을 돌리게 했다. 그러나 머리털이 다시 자라기 시작했다. 다곤의 큰 제사 날, 삼손이 두 기둥을 붙들고 기도했다. "주 여호와여 구하옵나니 나를 생각하옵소서, 이번만 나를 강하게 하사"(16:28). 신전이 무너져 방백들과 온 백성이 깔렸다. 삼손과 블레셋 방백·가사 방백이 죽었다. 가사의 블레셋 군 40%, 블레셋 모든 성 15% 궤멸, 블레셋 3턴 동안 공격력 -20%, 이스라엘 신앙 +5.';
  },
};

// 역사 이벤트. who: 선택권을 갖는 세력. 플레이어가 아니면 auto 번째 선택이 자동 적용되고 소식으로 전해진다.
const EVENTS = {
  conquest: [
    { id: 'rahab', who: 'israel', auto: 0,
      cond: G => G.turn >= 1 && G.ownerOf('jericho') === 'jericho',
      title: '라합과 두 정탐꾼', ref: '수 2장',
      text: '여호수아가 싯딤에서 정탐꾼 둘을 여리고로 보냈다. 기생 라합이 그들을 지붕 위 삼대 사이에 숨기고, 붉은 줄을 창문에 매어 두기로 약속했다.',
      choices: [
        { label: '붉은 줄의 약속을 지킨다', run: G => { G.flags.rahab = true; return '여리고를 차지하면 라합이 이스라엘에 합류한다. 여리고의 병력 정보를 얻었다.'; } },
      ] },
    { id: 'jordan', who: 'israel', auto: 0,
      cond: G => G.turn >= 2 && G.exists('israel'),
      title: '요단강이 멈추다', ref: '수 3–4장',
      text: '언약궤를 멘 제사장들의 발이 물가에 잠기자, 넘치던 요단 물이 위에서 멈추어 한 곳에 쌓였다. 백성은 마른 땅으로 건너고 열두 돌을 길갈에 세웠다.',
      choices: [
        { label: '열두 돌을 세워 기념한다', run: G => { G.eachCity('israel', c => { c.faith += 10; c.train = Math.min(100, c.train + 10); }); return '이스라엘 모든 성의 신앙 +10, 훈련 +10'; } },
      ] },
    { id: 'jerichoWalls', who: 'israel', auto: 0,
      cond: G => G.turn >= 3 && G.ownerOf('jericho') === 'jericho' && G.exists('israel'),
      title: '여리고 성을 돌라', ref: '수 6:1-20',
      text: '"너희 모든 군사는 그 성을 둘러 성 주위를 매일 한 번씩 엿새 동안 돌라. 일곱째 날에는 일곱 번 돌며 제사장들은 나팔을 불 것이며…"',
      choices: [
        { label: '말씀대로 칠 일 동안 성을 돈다', run: G => { const c = G.city('jericho'); c.def = 0; c.soldiers = Math.floor(c.soldiers * 0.4); G.eachCity('israel', x => x.faith += 5); return '성벽이 무너져 내렸다! 여리고 성벽 0, 수비병 60% 궤멸.'; } },
        { label: '공성 사다리로 곧장 친다', run: () => '여리고 성벽은 그대로 서 있다.' },
      ] },
    { id: 'achan', who: 'israel', auto: 0,
      cond: G => G.ownerOf('jericho') === 'israel',
      title: '아간의 범죄', ref: '수 7장',
      text: '여리고의 바친 물건 가운데 외투 한 벌과 은 이백 세겔, 금덩이 하나를 누군가 장막 밑에 감추었다. 이 일 뒤로 이스라엘이 아이 사람 앞에서 패하여 도망하였다.',
      choices: [
        { label: '제비를 뽑아 죄를 드러내고 제거한다', run: G => { G.eachCity('israel', c => { c.faith += 8; c.loy -= 3; }); return '신앙 +8, 민심 -3. 이스라엘이 다시 힘을 얻는다.'; } },
        { label: '덮어두고 진군한다', run: G => { G.buff('israel', 'atk', 4, -0.3); G.eachCity('israel', c => c.faith -= 10); return '4턴 동안 공격력 -30%, 신앙 -10.'; } },
      ] },
    { id: 'sunStands', who: 'israel', auto: 0,
      cond: G => G.turn >= 6 && G.exists('south') && G.exists('israel'),
      title: '태양아 기브온 위에 머무르라', ref: '수 10:6-14',
      text: '아모리 다섯 왕이 기브온을 쳤다. 여호수아가 밤새 올라가 그들을 치니, 여호와께서 하늘에서 큰 우박을 내리셨고 해가 중천에 머물러 거의 종일토록 속히 내려가지 아니하였다.',
      choices: [
        { label: '여호와께 부르짖으며 출전한다', run: G => { G.buff('israel', 'atk', 4, 0.3); G.eachCity('south', c => c.soldiers = Math.floor(c.soldiers * 0.8)); return '4턴 동안 공격력 +30%. 남부 동맹 모든 성의 병력 -20% (우박).'; } },
      ] },
    { id: 'caleb', who: 'israel', auto: 0,
      cond: G => G.turn >= 10 && G.alive('갈렙') && G.facOf('갈렙') === 'israel' && G.ownerOf('hebron') !== 'israel',
      title: '이 산지를 내게 주소서', ref: '수 14:6-14',
      text: '갈렙이 말했다. "모세가 나를 보내던 날과 같이 오늘도 내가 여전히 강건하니, 그 날에 여호와께서 말씀하신 이 산지를 지금 내게 주소서."',
      choices: [
        { label: '헤브론을 갈렙에게 맡긴다', run: G => { const o = G.o('갈렙'); o.war = Math.min(100, o.war + 5); o.cha = Math.min(100, o.cha + 5); return '갈렙 무력 +5, 매력 +5. 헤브론을 차지하라!'; } },
      ] },
    { id: 'merom', who: 'israel', auto: 0,
      cond: G => G.turn >= 12 && G.exists('north') && G.exists('israel'),
      title: '메롬 물가의 연합군', ref: '수 11:1-9',
      text: '야빈이 북방 왕들을 불러 모으니 바닷가의 수많은 모래 같고 말과 병거가 심히 많았다. 여호와께서 여호수아에게 "그들로 말미암아 두려워하지 말라" 하셨다.',
      choices: [
        { label: '두려워하지 않고 기습한다', run: G => { G.city(G.fac('north').capital).soldiers += 4000; G.buff('israel', 'atk', 3, 0.25); return '북부 동맹 도읍에 병거대 4000 집결. 이스라엘은 3턴 동안 공격력 +25%.'; } },
      ] },
  ],
  judges: [
    { id: 'cushan', who: 'israel', auto: 0,
      cond: G => G.turn >= 2 && G.exists('israel'),
      title: '구산 리사다임과 옷니엘', ref: '삿 3:7-11',
      text: '이스라엘 자손이 여호와 앞에 악을 행하여 바알들과 아세라들을 섬겼다. 여호와께서 그들을 메소보다미아 왕 구산 리사다임의 손에 파셨고, 이스라엘이 팔 년 동안 그를 섬겼다. 이스라엘 자손이 여호와께 부르짖자 여호와께서 갈렙의 조카 옷니엘을 구원자로 세우셨다.',
      choices: [
        { label: '여호와께 부르짖고, 영이 임한 옷니엘을 따라 출전한다', ok: G => G.alive('옷니엘') && G.facOf('옷니엘') === 'israel', run: G => {
          G.buff('israel', 'atk', 4, 0.25); JUDGE_KIT.cut(G, 'aram', 0.7);
          JUDGE_KIT.faithAll(G, 10);
          const o = G.o('옷니엘'); o.fai = Math.min(100, o.fai + 5);
          JUDGE_KIT.next(G, 3); G.kingdom(5, '부르짖음과 구원');
          return '여호와의 영이 옷니엘에게 임하였다. 4턴 동안 공격력 +25%, 아람 병력 30% 궤멸, 이스라엘 신앙 +10. "그 땅이 평온한 지 사십 년에"(3:11).'; } },
        { label: '구산 리사다임에게 조공을 바치고 평안을 산다', run: G => {
          G.fac('israel').gold -= 200; G.rel('israel', 'aram', 25); JUDGE_KIT.faithAll(G, -10);
          JUDGE_KIT.next(G, 3); G.kingdom(-3, '압제자를 섬김');
          return '금 -200, 아람과의 관계 +25. 그러나 이스라엘 신앙 -10. 백성은 여전히 우상 곁에 있다.'; } },
      ] },
    { id: 'ehud', who: 'israel', auto: 0,
      cond: G => G.done.cushan && G.turn >= 5 && G.turn >= (G.flags.jNext || 0) && G.exists('israel'),
      title: '왼손잡이 에훗과 에글론', ref: '삿 3:12-30',
      text: '그나스의 아들 옷니엘이 죽었다. 이스라엘이 다시 악을 행하자 모압 왕 에글론이 암몬과 아말렉을 모아 종려나무 성읍(여리고)을 점령했고, 이스라엘이 열여덟 해 동안 그를 섬겼다. 백성이 부르짖자 여호와께서 베냐민 사람 왼손잡이 에훗을 세우셨다. 그가 한 규빗 되는 양날 칼을 오른쪽 허벅지 옷 속에 차고 조공을 바치러 간다.',
      choices: [
        { label: '에훗이 "왕께 은밀한 일을 아뢰려 하나이다" 하고 홀로 들어간다', ok: G => G.alive('에훗') && G.facOf('에훗') !== 'moab', run: G => {
          G.kill('옷니엘'); JUDGE_KIT.raise(G, '에훗', 'bethel', true); JUDGE_KIT.raise(G, '삼갈', 'hebron');
          const eglon = G.alive('에글론'); G.kill('에글론');
          G.buff('israel', 'atk', 4, 0.3); JUDGE_KIT.cut(G, 'moab', 0.7); JUDGE_KIT.cut(G, 'moab', 0.8, ['jericho']);
          G.item('israel', 'trumpet', 1); JUDGE_KIT.faithAll(G, 8);
          JUDGE_KIT.next(G, 4); G.kingdom(6, '에훗의 구원');
          return (eglon ? '에훗이 에글론을 치고 다락문을 잠근 채 빠져나왔다. ' : '') + '에훗이 에브라임 산지에서 나팔을 불어 요단 나루를 막았다. 에훗이 사사로 서고 삼갈이 합류했다. 4턴 동안 공격력 +30%, 모압 병력 30% 궤멸(여리고는 더), 양각 나팔을 얻었다. 신앙 +8. "그 땅이 팔십 년 동안 평온하였더라"(3:30).'; } },
        { label: '조공만 바치고 돌아온다', run: G => {
          G.kill('옷니엘'); G.fac('israel').gold -= 200; G.rel('israel', 'moab', 20);
          JUDGE_KIT.faithAll(G, -5, -5); JUDGE_KIT.raise(G, '에훗', 'bethel');
          JUDGE_KIT.next(G, 4); G.kingdom(-3, '모압을 섬김');
          return '옷니엘이 세상을 떠났다. 금 -200, 모압과의 관계 +20, 신앙·민심 -5. 에훗이 합류했지만 모압의 압제는 계속된다.'; } },
      ],
      altWho: 'moab', altText: '이스라엘의 사자 에훗이 조공을 바친 뒤 돌아와 "왕이여, 내가 은밀한 일을 왕에게 아뢰려 하나이다" 하였다.',
      altChoices: [
        { label: '신하들을 물리고 서늘한 다락방에서 홀로 듣는다', run: G => {
          G.kill('옷니엘'); G.kill('에글론'); JUDGE_KIT.raise(G, '에훗', 'bethel', true);
          G.buff('israel', 'atk', 4, 0.3); JUDGE_KIT.cut(G, 'moab', 0.7); JUDGE_KIT.next(G, 4);
          return '에글론이 쓰러졌다. 모압 병력 30%가 요단 나루에서 흩어지고, 이스라엘은 4턴 동안 공격력 +30%.'; } },
        { label: '호위병을 곁에 두고 듣는다', run: G => {
          G.kill('옷니엘'); JUDGE_KIT.raise(G, '에훗', 'bethel', true); G.buff('israel', 'atk', 2, 0.1); JUDGE_KIT.next(G, 4);
          return '에훗은 칼을 뽑지 못하고 돌아갔다. 에글론은 무사하지만 이스라엘이 사사를 세웠다 (이스라엘 2턴 동안 공격력 +10%).'; } },
      ] },
    { id: 'deborah', who: 'israel', auto: 0,
      cond: G => G.done.ehud && G.turn >= (G.flags.jNext || 0) && G.exists('israel'),
      title: '드보라와 바락, 다볼 산', ref: '삿 4–5장',
      text: '에훗이 죽은 뒤 하솔 왕 야빈이 철 병거 구백 대로 이십 년 동안 이스라엘을 심히 학대했다. 그 때 랍비돗의 아내 여선지자 드보라가 종려나무 아래에서 이스라엘을 재판하고 있었다. 그가 바락을 불러 말했다. "너는 납달리와 스불론 자손 만 명을 거느리고 다볼 산으로 가라. 내가 시스라와 그의 병거들을 기손 강으로 이끌어 네 손에 넘겨 주리라."',
      choices: [
        { label: '"당신이 나와 함께 가면 나도 가려니와" — 드보라와 함께 다볼 산으로 오른다', run: G => {
          G.kill('에훗'); JUDGE_KIT.raise(G, '드보라', 'bethel', true); JUDGE_KIT.raise(G, '바락'); JUDGE_KIT.raise(G, '야엘');
          const sis = G.alive('시스라'); G.kill('시스라');
          JUDGE_KIT.cut(G, 'canaan', 0.6, ['megiddo', 'hazor']); JUDGE_KIT.cut(G, 'canaan', 0.8, ['bethshean']);
          G.buff('israel', 'atk', 4, 0.3); G.buff('canaan', 'atk', 3, -0.2); JUDGE_KIT.faithAll(G, 10);
          G.flags.deborahSong = true; JUDGE_KIT.next(G, 5); G.kingdom(8, '드보라의 노래');
          return '"별들이 하늘에서부터 싸우되 기손 강은 그 무리를 표류시켰으니"(5:20-21). 비에 불은 기손 강이 병거를 삼켜 므깃도·하솔의 가나안 군 40% 궤멸' + (sis ? ', 도망한 시스라는 겐 사람 헤벨의 아내 야엘의 장막에서 죽었다' : '') + '. 드보라가 사사로 서고 바락·야엘이 합류했다. 4턴 동안 공격력 +30%, 가나안 3턴 동안 -20%, 신앙 +10.'; } },
        { label: '철 병거 구백 대가 두려워 산지에 머문다', run: G => {
          G.kill('에훗'); JUDGE_KIT.raise(G, '드보라', 'bethel', true);
          G.buff('canaan', 'atk', 3, 0.2); JUDGE_KIT.faithAll(G, -5, -5);
          JUDGE_KIT.next(G, 5); G.kingdom(-3, '병거를 두려워함');
          return '에훗이 세상을 떠났다. 드보라가 합류했지만 바락은 게데스에 남았다. 가나안 3턴 동안 공격력 +20%, 이스라엘 신앙·민심 -5. "마을 사람들이 그쳤으니"(5:7).'; } },
      ],
      altWho: 'canaan', altText: '시스라가 아비노암의 아들 바락이 다볼 산에 오른 것을 듣고 철 병거 구백 대를 기손 강으로 모았다.',
      altChoices: [
        { label: '기손 강가로 병거를 몬다', run: G => {
          G.kill('에훗'); JUDGE_KIT.raise(G, '드보라', 'bethel', true); JUDGE_KIT.raise(G, '바락'); G.kill('시스라');
          JUDGE_KIT.cut(G, 'canaan', 0.6, ['megiddo', 'hazor']); G.buff('israel', 'atk', 4, 0.3); JUDGE_KIT.next(G, 5);
          return '큰 비에 기손 강이 불어 병거가 진창에 빠졌다. 므깃도·하솔의 병력 40% 궤멸, 시스라가 도망하다 죽었다.'; } },
        { label: '평지에 머물러 이스라엘을 기다린다', run: G => {
          G.kill('에훗'); JUDGE_KIT.raise(G, '드보라', 'bethel', true); JUDGE_KIT.raise(G, '바락'); G.buff('israel', 'atk', 3, 0.15); JUDGE_KIT.next(G, 5);
          return '가나안 병거는 평지를 지켰다. 이스라엘에 드보라와 바락이 섰다 (이스라엘 3턴 동안 공격력 +15%).'; } },
      ] },
    { id: 'gideonCall', who: 'israel', auto: 0,
      cond: G => G.done.deborah && G.turn >= (G.flags.jNext || 0) && G.exists('israel'),
      title: '큰 용사여, 여호와께서 너와 함께 계시도다', ref: '삿 6장',
      text: '이스라엘이 또 악을 행하자 미디안과 아말렉과 동방 사람들이 약대와 함께 메뚜기 떼처럼 올라와 토지 소산을 멸했다. 기드온이 미디안을 피해 포도주 틀에서 밀을 타작할 때 여호와의 사자가 나타났다. "큰 용사여, 여호와께서 너와 함께 계시도다." 그날 밤 말씀이 임했다. "네 아버지의 바알 제단을 헐며 그 곁의 아세라 상을 찍으라." 기드온은 양털 한 뭉치를 타작마당에 두고 두 번 표징을 구했다.',
      choices: [
        { label: '밤에 바알 제단을 헐고 여호와의 제단을 쌓는다', run: G => {
          JUDGE_KIT.raise(G, '기드온', 'shechem');
          const g = G.o('기드온'); if (g && g.alive) g.fai = Math.min(100, g.fai + 15);
          const j = G.o('요아스'); if (j && j.alive) j.fai = Math.min(100, j.fai + 30);
          JUDGE_KIT.faithAll(G, 15); if (G.ownerOf('shechem') === 'israel') G.city('shechem').loy -= 10;
          G.flags.gideonCalled = true; G.flags.jerubbaal = true; JUDGE_KIT.next(G, 3); G.kingdom(6, '바알 제단을 헐다');
          return '성읍 사람들이 기드온을 죽이려 하자 요아스가 말했다. "바알이 신일진대 그의 제단을 파괴하였은즉 그가 자신을 위해 다툴 것이니라." 기드온은 여룹바알이라 불렸다(6:31-32). 기드온 합류, 신앙 +15, 요아스 신앙 +30, 세겜 민심 -10. 양털이 젖고 또 말랐다.'; } },
        { label: '제단은 그대로 두고 조용히 군사만 모은다', run: G => {
          JUDGE_KIT.raise(G, '기드온', 'shechem');
          if (G.ownerOf('shechem') === 'israel') G.city('shechem').soldiers += 1500;
          JUDGE_KIT.faithAll(G, -5); G.flags.gideonCalled = true; JUDGE_KIT.next(G, 3); G.kingdom(-2, '우상을 남겨 둠');
          return '기드온이 합류했다. 세겜 병력 +1500. 그러나 바알 제단이 그대로 서 있다 — 이스라엘 신앙 -5.'; } },
      ] },
    { id: 'gideon300', who: 'israel', auto: 0,
      cond: G => G.done.gideonCall && G.turn >= (G.flags.jNext || 0) && G.exists('israel'),
      title: '기드온의 삼백 용사', ref: '삿 7장',
      text: '기드온을 따르는 백성이 삼만 이천 명이었다. 여호와께서 말씀하셨다. "너를 따르는 백성이 너무 많은즉 내가 그들의 손에 미디안 사람을 넘겨 주지 아니하리니, 이는 이스라엘이 나를 거슬러 스스로 자랑하기를 내 손이 나를 구원하였다 할까 함이니라." 두려워 떠는 자 이만 이천이 돌아가고, 물가에서 손으로 물을 움켜 입에 대고 핥은 자는 삼백 명이었다.',
      choices: [
        { label: '삼백 명만 남기고 나팔과 횃불과 항아리를 나눠 준다', run: G => {
          JUDGE_KIT.raise(G, '기드온', 'shechem', true); JUDGE_KIT.raise(G, '부라', 'shechem');
          if (G.ownerOf('shechem') === 'israel') { const s = G.city('shechem'); s.soldiers = Math.floor(s.soldiers * 0.8); }
          G.item('israel', 'torch', 3); G.item('israel', 'trumpet', 3);
          JUDGE_KIT.cut(G, 'midian', 0.4); G.kill('오렙'); G.kill('스엡');
          G.buff('israel', 'atk', 4, 0.35); G.buff('midian', 'atk', 3, -0.2); JUDGE_KIT.faithAll(G, 15);
          const g = G.o('기드온'); if (g && g.alive) { g.fai = Math.min(100, g.fai + 10); g.cha = Math.min(100, g.cha + 5); }
          G.flags.three100 = true; JUDGE_KIT.next(G, 4); G.kingdom(10, '여호와의 칼, 기드온의 칼');
          return '"여호와와 기드온의 칼이다!" 삼백 명이 항아리를 깨뜨리고 횃불을 들고 나팔을 불자 미디안 진영이 서로 칼로 쳤다. 세겜의 병력 20%는 집으로 돌아갔지만, 미디안 병력 60% 궤멸, 방백 오렙과 스엡이 죽었다. 기드온이 사사로 서고 부라가 합류했다. 횃불과 항아리·양각 나팔 각 3, 4턴 동안 공격력 +35%, 신앙 +15.'; } },
        { label: '삼만 이천 명을 모두 데리고 싸운다', run: G => {
          JUDGE_KIT.raise(G, '기드온', 'shechem', true);
          JUDGE_KIT.cut(G, 'midian', 0.8); G.buff('israel', 'atk', 3, 0.15); JUDGE_KIT.faithAll(G, -10);
          JUDGE_KIT.next(G, 4); G.kingdom(-5, '내 손이 나를 구원하였다');
          return '기드온이 사사로 섰다. 미디안 병력 20%가 물러가고 3턴 동안 공격력 +15%. 그러나 백성은 "우리 손이 우리를 구원하였다" 하며 자랑한다 — 신앙 -10.'; } },
      ],
      altWho: 'midian', altText: '미디안 진영의 한 병사가 꿈을 꾸었다. 보리떡 한 덩어리가 진영으로 굴러 들어와 장막을 쳐서 무너뜨렸다. 동무가 말했다. "이는 기드온의 칼이라."',
      altChoices: [
        { label: '밤새 진영을 지킨다', run: G => {
          JUDGE_KIT.raise(G, '기드온', 'shechem', true); JUDGE_KIT.cut(G, 'midian', 0.6); G.kill('오렙'); G.kill('스엡');
          G.buff('israel', 'atk', 3, 0.25); JUDGE_KIT.next(G, 4);
          return '이경 초에 나팔 소리와 횃불이 진영을 둘렀다. 미디안 병력 40%가 서로 칼로 치고 흩어졌고, 오렙과 스엡이 죽었다.'; } },
      ] },
    { id: 'abimelech', who: 'israel', auto: 0,
      cond: G => G.done.gideon300 && G.turn >= (G.flags.jNext || 0) && G.exists('israel') && !G.exists('abimelech') && G.ownerOf('shechem') === 'israel' && G.fac('israel').capital !== 'shechem',
      title: '아비멜렉의 반역', ref: '삿 8:22-23; 9장',
      text: '이스라엘 사람들이 기드온에게 "당신과 당신의 아들과 손자가 우리를 다스리소서" 하였으나 기드온은 "여호와께서 너희를 다스리시리라" 하고 거절했다. 그러나 기드온이 죽자 이스라엘은 다시 바알브릿을 섬겼다. 세겜에 있던 첩의 아들 아비멜렉이 외가 사람들을 꾀어 은 칠십 개로 건달들을 사고 자기 형제들을 해친 뒤, 세겜 사람들에게 왕으로 추대되었다. 막내 요담만 살아남아 그리심 산 꼭대기에서 외쳤다.',
      choices: [
        { label: '요담의 가시나무 비유를 전하며 여호와의 다스림을 선포한다', run: G => {
          G.kill('기드온');
          G.rebel('abimelech', '아비멜렉', 'shechem', ['아비멜렉', 82, 60, 55, 50, 10, null, 'shechem', '기드온이 세겜에 둔 첩의 아들. 형제들을 해치고 세겜에서 스스로 왕이 되었다.', '삿 9:1-6']);
          const c = G.city('shechem'); c.soldiers = 3000; c.loy = 30;
          JUDGE_KIT.raise(G, '돌라', null, true); JUDGE_KIT.faithAll(G, 8);
          G.flags.jotham = true; JUDGE_KIT.next(G, 4); G.kingdom(3, '여호와께서 다스리시리라');
          return '"나무들이 가시나무에게 이르되 너는 와서 우리 위에 왕이 되라 하매…"(9:14-15). 아비멜렉이 세겜에서 일어났지만 하나님이 그와 세겜 사람들 사이에 악한 영을 보내셨다 — 세겜 병력 3000, 민심 30. 기드온이 세상을 떠나고 돌라가 사사로 섰다. 이스라엘 신앙 +8.'; } },
        { label: '세겜 사람들의 선택을 인정하고 아비멜렉과 화친한다', run: G => {
          G.kill('기드온');
          G.rebel('abimelech', '아비멜렉', 'shechem', ['아비멜렉', 82, 60, 55, 50, 10, null, 'shechem', '기드온이 세겜에 둔 첩의 아들. 형제들을 해치고 세겜에서 스스로 왕이 되었다.', '삿 9:1-6']);
          G.rel('israel', 'abimelech', 50); JUDGE_KIT.faithAll(G, -10, -5);
          JUDGE_KIT.raise(G, '돌라', null, true); JUDGE_KIT.next(G, 4); G.kingdom(-6, '가시나무를 왕으로');
          return '아비멜렉이 세겜의 왕이 되었다. 아비멜렉과의 관계 +50, 그러나 이스라엘 신앙 -10, 민심 -5. "사람이 각기 자기의 소견에 옳은 대로 행하였더라." 기드온이 세상을 떠나고 돌라가 사사로 섰다.'; } },
      ] },
    { id: 'jephthah', who: 'israel', auto: 0,
      cond: G => G.done.gideon300 && G.turn >= (G.flags.jNext || 0) && G.exists('israel') && (G.done.abimelech || G.turn >= (G.flags.jNext || 0) + 3),
      title: '입다의 서원', ref: '삿 10:6–11:40',
      text: '이스라엘이 다시 바알들과 아스다롯과 아람·시돈·모압·암몬·블레셋의 신들을 섬겼다. 암몬 자손이 길르앗에 진을 치자 길르앗 장로들이 돕 땅의 입다에게 가서 "우리의 장관이 되라" 청했다. 입다가 암몬 왕에게 사자를 보내 삼백 년의 역사를 들어 항변했으나 왕은 듣지 않았다. 여호와의 영이 입다에게 임했다. 출전을 앞두고 입다가 여호와께 서원하려 한다.',
      choices: [
        { label: '서원을 하지 않고 "심판하시는 여호와께서 판결하시옵소서" 하며 여호와만 의지한다', run: G => {
          JUDGE_KIT.raise(G, '입다', 'ramoth', true);
          JUDGE_KIT.cut(G, 'ammon', 0.5); G.buff('israel', 'atk', 4, 0.3); JUDGE_KIT.faithAll(G, 10);
          const j = G.o('입다'); if (j && j.alive) j.fai = Math.min(100, j.fai + 15);
          G.flags.jephthahTrust = true; JUDGE_KIT.next(G, 4); G.kingdom(8, '여호와께서 판결하시리라');
          return '"심판하시는 여호와께서 오늘 이스라엘 자손과 암몬 자손 사이에 판결하시옵소서"(11:27). 입다가 아로엘에서 민닛까지 암몬을 쳤다. 암몬 병력 50% 궤멸, 4턴 동안 공격력 +30%, 신앙 +10. 입다가 사사로 섰다. 구원은 거래가 아니라 은혜였다.'; } },
        { label: '"누구든지 먼저 나와 나를 영접하는 자를 번제로 드리리라" 서원한다', run: G => {
          JUDGE_KIT.raise(G, '입다', 'ramoth', true);
          JUDGE_KIT.cut(G, 'ammon', 0.5); G.buff('israel', 'atk', 4, 0.3); JUDGE_KIT.faithAll(G, -10, -10);
          const j = G.o('입다'); if (j && j.alive) { j.cha = Math.max(0, j.cha - 10); j.fai = Math.max(0, j.fai - 10); }
          G.flags.rashVow = true; JUDGE_KIT.next(G, 4); G.kingdom(-8, '경솔한 서원');
          return '암몬은 크게 패했다(병력 50% 궤멸, 4턴 동안 공격력 +30%). 그러나 미스바의 집에 돌아오자 소고를 잡고 춤추며 그를 맞으러 나온 이는 그의 무남독녀였다. 입다가 옷을 찢으며 슬퍼했고, 이스라엘 딸들은 해마다 나흘씩 그를 애곡했다(11:34-40). 여호와께서는 그런 제물을 구하신 적이 없다(신 12:31; 미 6:6-8). 신앙·민심 -10, 입다 매력·신앙 -10.'; } },
      ],
      altWho: 'ammon', altText: '입다의 사자가 와서 말했다. "이스라엘이 헤스본과 아로엘에 거주한 지 삼백 년인데 그 동안에 너희가 어찌하여 도로 찾지 아니하였느냐" (11:26).',
      altChoices: [
        { label: '입다의 말을 듣지 않고 싸운다', run: G => {
          JUDGE_KIT.raise(G, '입다', 'ramoth', true); JUDGE_KIT.cut(G, 'ammon', 0.6); G.buff('israel', 'atk', 3, 0.25); JUDGE_KIT.next(G, 4);
          return '여호와의 영이 입다에게 임하였다. 암몬 병력 40%가 아로엘에서 민닛까지 흩어졌다.'; } },
        { label: '길르앗에서 물러난다', run: G => {
          JUDGE_KIT.raise(G, '입다', 'ramoth', true); G.rel('ammon', 'israel', 30); JUDGE_KIT.next(G, 4);
          return '암몬이 물러갔다. 이스라엘과의 관계 +30.'; } },
      ] },
    { id: 'samsonBirth', who: 'israel', auto: 0,
      cond: G => G.done.jephthah && G.turn >= (G.flags.jNext || 0) && G.exists('israel'),
      title: '나실인 삼손의 출생', ref: '삿 12:7-15; 13장',
      text: '입다가 여섯 해 동안 사사로 있다가 죽었고, 입산과 엘론과 압돈이 차례로 이스라엘을 다스렸다. 이스라엘이 또 악을 행하자 여호와께서 그들을 사십 년 동안 블레셋 사람의 손에 넘기셨다. 소라 땅 마노아의 아내에게 여호와의 사자가 나타났다. "네가 임신하여 아들을 낳으리니 삭도를 그 머리에 대지 말라. 이 아이는 태에서 나옴으로부터 하나님께 바쳐진 나실인이 됨이라. 그가 블레셋 사람의 손에서 이스라엘을 구원하기 시작하리라."',
      choices: [
        { label: '마노아와 아내가 제물을 드리고 나실인의 규례를 지켜 아이를 기른다', run: G => {
          G.kill('입다'); JUDGE_KIT.raise(G, '마노아', 'bethlehem'); JUDGE_KIT.raise(G, '삼손', 'bethlehem', true);
          const s = G.o('삼손'); if (s && s.alive) s.fai = Math.min(100, s.fai + 10);
          JUDGE_KIT.faithAll(G, 5); G.flags.nazirite = true; JUDGE_KIT.next(G, 4); G.kingdom(3, '나실인의 서원');
          return '아이가 자라매 여호와께서 그에게 복을 주셨고, 여호와의 영이 소라와 에스다올 사이 마하네단에서 그를 움직이기 시작했다(13:24-25). 입다가 세상을 떠나고 삼손이 사사로 섰다. 마노아 합류, 삼손 신앙 +10, 이스라엘 신앙 +5.'; } },
      ] },
    { id: 'delilah', who: 'israel', auto: 1,
      cond: G => G.done.samsonBirth && G.turn >= (G.flags.jNext || 0) && G.exists('israel') && G.exists('philistia') && G.alive('삼손') && G.facOf('삼손') === 'israel',
      title: '삼손과 들릴라', ref: '삿 16장',
      text: '삼손이 소렉 골짜기의 여인 들릴라를 사랑했다. 블레셋 방백들이 그에게 은 천백 개씩을 약속했다. 들릴라가 날마다 졸라 "당신의 큰 힘이 무엇으로 말미암아 생기나이까" 하고 물으니 삼손의 마음이 번뇌하여 죽을 지경이 되었다.',
      choices: [
        { label: '들릴라를 떠나 나실인의 서원을 지킨다', run: G => {
          const s = G.o('삼손'); if (s && s.alive) s.fai = Math.min(100, s.fai + 15);
          G.buff('israel', 'atk', 3, 0.25); JUDGE_KIT.cut(G, 'philistia', 0.75, ['gath', 'ekron', 'gaza']); JUDGE_KIT.faithAll(G, 10);
          G.flags.vowKept = true; G.kingdom(8, '서원을 지킨 삼손');
          return '삼손이 소렉 골짜기를 떠났다. 서원을 지킨 사사 곁에 여호와의 영이 머문다. 3턴 동안 공격력 +25%, 가드·에그론·가사의 블레셋 군 25% 궤멸, 이스라엘 신앙 +10.'; } },
        { label: '마음을 다 털어놓는다', run: G => JUDGE_KIT.dagon(G) },
      ],
      altWho: 'philistia', altText: '방백들이 들릴라에게 은 천백 개씩을 약속하고 삼손의 비밀을 캐내게 한다.',
      altChoices: [
        { label: '은을 주고 비밀을 캐낸다 (금 -300)', run: G => { G.fac('philistia').gold -= 300; return JUDGE_KIT.dagon(G); } },
        { label: '그만둔다', run: G => { G.buff('israel', 'atk', 3, 0.2); return '삼손은 여전히 블레셋의 두려움이다. 이스라엘 3턴 동안 공격력 +20%.'; } },
      ] },
    { id: 'apostasy', who: 'israel', auto: 0, repeat: true,
      cond: G => G.turn >= 6 && G.exists('israel') && G.turn >= (G.flags.apostasyNext || 0) && JUDGE_KIT.faith(G) < 45 && !!JUDGE_KIT.oppressor(G),
      title: '배교의 순환', ref: '삿 2:11-19; 10:10-16',
      text: '이스라엘 자손이 여호와 앞에 악을 행하여 바알들을 섬기고 애굽 땅에서 인도하여 내신 조상들의 하나님 여호와를 버렸다. 여호와께서 진노하사 그들을 노략하는 자의 손에 넘기셨다. "그 때에는 이스라엘에 왕이 없으므로 사람이 각기 자기의 소견에 옳은 대로 행하였더라"(21:25).',
      choices: [
        { label: '"우리가 범죄하였사오니" 부르짖고 이방 신들을 제거한다', run: G => {
          const f = JUDGE_KIT.oppressor(G), t = JUDGE_KIT.target(G, f);
          const r = f && t ? G.raid(f, t, 2000) : '';
          G.fac('israel').gold = Math.max(0, G.fac('israel').gold - 100); JUDGE_KIT.faithAll(G, 12);
          G.buff('israel', 'atk', 2, 0.15); G.flags.apostasyNext = G.turn + 6; G.kingdom(3, '부르짖음');
          return (r ? `압제: ${r} ` : '') + '백성이 이방 신들을 제하고 여호와를 섬기니 "여호와께서 이스라엘의 곤고로 말미암아 마음에 근심하시니라"(10:16). 금 -100, 신앙 +12, 2턴 동안 공격력 +15%.'; } },
        { label: '각기 자기 소견에 옳은 대로 행한다', run: G => {
          const f = JUDGE_KIT.oppressor(G), t = JUDGE_KIT.target(G, f);
          const r = f && t ? G.raid(f, t, 4000) : '';
          if (f) G.buff(f, 'atk', 3, 0.2); JUDGE_KIT.faithAll(G, -5, -5);
          G.flags.apostasyNext = G.turn + 6; G.kingdom(-4, '각기 자기 소견대로');
          return (r ? `압제: ${r} ` : '') + '압제자의 기세가 3턴 동안 +20%. 이스라엘 신앙·민심 -5.'; } },
      ] },
  ],
  david: [
    { id: 'gibeonPool', who: 'judah', auto: 0,
      cond: G => G.turn >= 2 && G.alive('아사헬') && G.alive('아브넬') && G.facOf('아사헬') === 'judah' && G.facOf('아브넬') === 'israel',
      title: '기브온 못가의 싸움', ref: '삼하 2:12-23',
      text: '양편 청년 열두 명씩 겨루던 싸움이 전면전이 되었다. 발 빠른 아사헬이 아브넬을 끝까지 쫓자, 아브넬이 창 뒤끝으로 그의 배를 찔렀다.',
      choices: [
        { label: '아사헬을 위해 슬퍼한다', run: G => { G.kill('아사헬'); G.flags.joabGrudge = true; return '아사헬이 전사했다. 요압의 가슴에 원한이 남는다.'; } },
      ] },
    { id: 'abner', who: 'judah', auto: 0,
      cond: G => G.turn >= 6 && G.alive('아브넬') && G.facOf('아브넬') === 'israel' && G.exists('judah'),
      title: '아브넬이 언약을 청하다', ref: '삼하 3:6-21',
      text: '이스보셋이 사울의 첩 리스바의 일로 아브넬을 책망하자, 아브넬이 크게 노하여 다윗에게 사자를 보냈다. "나와 언약을 맺으소서. 내 손이 당신을 도와 온 이스라엘이 당신에게 돌아가게 하리이다."',
      choices: [
        { label: '언약을 맺는다', run: G => { G.join('아브넬', 'judah'); G.flags.abnerJoined = G.turn; return '아브넬이 유다에 합류했다.'; } },
        { label: '미갈을 먼저 돌려보내라 하고 거절한다', run: G => { G.rel('judah', 'israel', 10); return '아브넬은 이스라엘에 남았다.'; } },
      ],
      altWho: 'israel', altText: '이스라엘의 왕으로서 아브넬을 붙잡을 수 있다.',
      altChoices: [
        { label: '금 300으로 아브넬을 달랜다', run: G => { G.fac('israel').gold -= 300; return '아브넬이 마음을 돌렸다.'; } },
        { label: '그대로 둔다', run: G => { G.join('아브넬', 'judah'); G.flags.abnerJoined = G.turn; return '아브넬이 다윗에게 넘어갔다.'; } },
      ] },
    { id: 'joabRevenge', who: 'judah', auto: 0,
      cond: G => G.flags.abnerJoined && G.turn >= G.flags.abnerJoined + 1 && G.flags.joabGrudge && G.alive('아브넬') && G.alive('요압') && G.facOf('요압') === 'judah',
      title: '요압의 복수', ref: '삼하 3:26-39',
      text: '요압이 아브넬을 성문 안으로 데려가 조용히 말하는 척하며 그의 배를 찔렀다. 아우 아사헬의 피 때문이었다.',
      choices: [
        { label: '아브넬의 상여를 따르며 금식하고 애곡한다', run: G => { G.kill('아브넬'); G.eachCity('judah', c => c.loy += 10); if (G.exists('israel')) G.eachCity('israel', c => c.loy -= 10); return '아브넬이 죽었다. 온 백성이 왕의 뜻이 아니었음을 알고 기뻐했다 (유다 민심 +10, 이스라엘 민심 -10).'; } },
      ] },
    { id: 'ishbosheth', who: 'judah', auto: 0,
      cond: G => G.turn >= 8 && G.exists('israel') && G.exists('judah') && G.alive('이스보셋') && G.facOf('이스보셋') === 'israel' && G.facOf('아브넬') !== 'israel',
      title: '이스보셋의 죽음', ref: '삼하 4장; 5:1-3',
      text: '레갑과 바아나가 한낮에 이스보셋의 침상으로 들어가 그를 죽이고, 그 머리를 헤브론의 다윗에게 가져왔다. "왕의 원수 사울의 아들의 머리가 여기 있나이다."',
      choices: [
        { label: '악인을 처단하고 이스라엘 장로들과 언약을 맺는다', run: G => {
          G.kill('이스보셋'); G.kill('레갑'); G.kill('바아나'); G.transferAll('israel', 'judah');
          return '온 이스라엘 지파가 헤브론에 와서 다윗에게 기름을 부었다. 이스라엘의 모든 성과 장수가 유다에 합류했다!'; } },
        { label: '그들에게 상을 준다', run: G => {
          G.kill('이스보셋'); G.join('레갑', 'judah'); G.join('바아나', 'judah'); G.eachCity('judah', c => c.faith -= 15);
          return '레갑과 바아나가 합류했지만, 유다의 신앙이 크게 떨어졌다 (-15). 이스라엘은 새 왕을 세운다.'; } },
      ],
      altWho: 'israel', altText: '왕이 암살당했다. 남은 신하들이 나라를 이어간다.',
      altChoices: [
        { label: '남은 자들이 나라를 지킨다', run: G => { G.kill('이스보셋'); G.kill('레갑'); G.kill('바아나'); return '이스보셋과 암살자들이 죽었다.'; } },
      ] },
    { id: 'rephaim', who: 'judah', auto: 0,
      cond: G => G.turn >= 5 && G.exists('philistia') && G.exists('judah') && G.cityCount('judah') >= 4,
      title: '르바임 골짜기', ref: '삼하 5:17-25',
      text: '다윗이 왕이 되었다는 소식에 블레셋 사람들이 르바임 골짜기에 가득 퍼졌다. 다윗이 여호와께 묻자 "뽕나무 꼭대기에서 걸음 걷는 소리가 들리거든 곧 공격하라" 하셨다.',
      choices: [
        { label: '여호와께 묻고 기다린다', run: G => { G.buff('judah', 'atk', 4, 0.3); return '4턴 동안 유다 공격력 +30%.'; } },
        { label: '곧바로 맞서 싸운다', run: G => { G.buff('philistia', 'atk', 3, 0.15); return '블레셋의 기세가 3턴 동안 +15%.'; } },
      ] },
    { id: 'zion', who: 'judah', auto: 0,
      cond: G => G.ownerOf('jerusalem') === 'judah',
      title: '시온 산성, 다윗성', ref: '삼하 5:6-10',
      text: '다윗이 시온 산성을 빼앗았으니 이는 다윗성이다. 다윗이 점점 강성하여 가니 만군의 하나님 여호와께서 그와 함께 계셨다.',
      choices: [
        { label: '예루살렘으로 도읍을 옮긴다', run: G => { G.fac('judah').capital = 'jerusalem'; G.eachCity('judah', c => { c.loy += 5; c.faith += 5; }); G.city('jerusalem').def = Math.min(100, G.city('jerusalem').def + 10); return '도읍 이전. 민심 +5, 신앙 +5, 예루살렘 성벽 +10.'; } },
        { label: '헤브론에 머문다', run: () => '도읍은 헤브론 그대로다.' },
      ] },
    { id: 'hiram', who: 'judah', auto: 0,
      cond: G => G.ownerOf('jerusalem') === 'judah' && G.exists('tyre'),
      title: '히람의 백향목', ref: '삼하 5:11',
      text: '두로 왕 히람이 다윗에게 사절과 백향목과 목수와 석수를 보내어 다윗의 집을 지었다.',
      choices: [
        { label: '두로와 우호를 다진다', run: G => { G.city('jerusalem').def = Math.min(100, G.city('jerusalem').def + 15); G.rel('judah', 'tyre', 25); G.fac('judah').gold += 300; return '예루살렘 성벽 +15, 금 +300, 두로와의 우호 +25.'; } },
      ] },
    { id: 'ark', who: 'judah', auto: 1, repeat: true,
      cond: G => G.done.zion && !G.flags.arkHome && (!G.flags.arkRetry || G.turn >= G.flags.arkRetry),
      title: '언약궤를 다윗성으로', ref: '삼하 6장; 대상 15:2-15',
      text: '다윗이 바알레유다에서 하나님의 궤를 메어 오려고 한다. 어떻게 옮길 것인가?',
      choices: [
        { label: '새 수레에 싣고 옮긴다', run: G => { G.flags.arkRetry = G.turn + 3; G.eachCity('judah', c => c.loy -= 5); return '나곤의 타작마당에서 소들이 뛰자 웃사가 궤를 붙들었다가 죽었다. 궤는 오벧에돔의 집에 석 달 머문다 (민심 -5).'; } },
        { label: '레위인들이 어깨에 메고 옮긴다', run: G => { G.flags.arkHome = true; G.eachCity('judah', c => { c.faith += 15; c.loy += 10; }); return '다윗이 여호와 앞에서 힘을 다해 춤추었다. 유다 모든 성의 신앙 +15, 민심 +10.'; } },
      ] },
    { id: 'absalom', who: 'judah', auto: 1,
      cond: G => G.turn >= 24 && G.isPlayer('judah') && G.cityCount('judah') >= 10 && G.ownerOf('hebron') === 'judah' && G.fac('judah').capital !== 'hebron',
      title: '압살롬의 반란', ref: '삼하 15–18장',
      text: '압살롬이 사십 년 동안 성문 곁에서 백성의 마음을 훔치더니, 헤브론에서 나팔을 불어 왕이 되었다고 선포했다. 아히도벨도 그의 편에 섰다는 소문이다.',
      choices: [
        { label: '후새를 보내 아히도벨의 계략을 무너뜨린다', ok: G => G.alive('후새') && G.facOf('후새') === 'judah', run: G => { G.rebel('absalom', '압살롬', 'hebron', ['압살롬', 70, 75, 70, 95, 30, null, 'hebron', '다윗의 셋째 아들, 백성의 마음을 훔친 자.', '삼하 15:6']); return '압살롬이 헤브론에서 일어났지만, 후새 덕분에 아히도벨은 떠나지 못했다.'; } },
        { label: '성을 떠나 감람산을 울며 오른다', run: G => { G.rebel('absalom', '압살롬', 'hebron', ['압살롬', 70, 75, 70, 95, 30, null, 'hebron', '다윗의 셋째 아들, 백성의 마음을 훔친 자.', '삼하 15:6']); if (G.alive('아히도벨') && G.facOf('아히도벨') === 'judah') G.join('아히도벨', 'absalom', 'hebron'); G.eachCity('judah', c => c.faith += 5); return '압살롬이 헤브론을 차지했고 아히도벨이 그에게 갔다. 왕의 겸손에 백성의 신앙 +5.'; } },
      ] },
  ],
  saul: [
    { id: 'smiths', who: 'israel', auto: 0,
      cond: G => G.turn >= 1 && G.exists('israel') && G.exists('philistia'),
      title: '이스라엘에 대장장이가 없다', ref: '삼상 13:19-22',
      text: '블레셋 사람들이 "히브리 사람이 칼이나 창을 만들까 하노라" 하여 이스라엘 온 땅에 대장장이를 두지 않았다. 보습과 곡괭이를 벼리려면 블레셋 사람에게로 내려가야 했고, 싸우는 날에 칼과 창을 가진 자는 사울과 요나단뿐이었다.',
      choices: [
        { label: '돌과 나무로 물매와 방패를 스스로 마련한다', run: G => {
          G.fac('israel').gold -= 100;
          if (G.item) { G.item('israel', 'sling', 1); G.item('israel', 'shield', 1); }
          if (G.res) G.res('israel', { wood: 200, stone: 200 });
          G.eachCity('israel', c => c.train += 5);
          return '금 -100. 물매 돌과 큰 방패를 얻고 나무·돌 +200. 이스라엘 모든 성의 훈련 +5.'; } },
        { label: '블레셋에 은을 내고 농기구를 벼린다', run: G => {
          G.fac('israel').gold -= 150; G.fac('israel').food += 1500; G.rel('israel', 'philistia', 10);
          return '금 -150, 식량 +1500. 블레셋과의 관계 +10. 칼과 창은 여전히 없다.'; } },
      ] },
    { id: 'jabesh', who: 'israel', auto: 0,
      cond: G => G.turn >= 2 && G.exists('israel') && G.exists('ammon') && !G.ownerOf('ramoth'),
      title: '길르앗 야베스를 구원하라', ref: '삼상 11:1-11',
      text: '암몬 사람 나하스가 길르앗 야베스(라못길르앗)를 에워싸고 "너희 오른눈을 다 빼야 언약하리라" 하였다. 밭에서 소를 몰고 오던 사울이 이 말을 듣자 하나님의 영이 크게 임하였다. 그가 소 한 겨리를 잡아 각을 떠서 이스라엘 온 지경에 보냈다.',
      choices: [
        { label: '온 이스라엘을 모아 새벽에 세 부대로 친다', run: G => {
          const r = G.city('ramoth'); r.owner = 'israel'; r.soldiers += 1500; r.loy = 90; r.faith += 15;
          G.city('rabbah').soldiers = Math.floor(G.city('rabbah').soldiers * 0.7);
          G.buff('israel', 'atk', 3, 0.25); G.eachCity('israel', c => c.loy += 5);
          G.flags.jabesh = true;
          return '새벽에 암몬 군을 쳐서 날이 더울 때까지 죽였다. 길르앗 야베스(라못길르앗)가 이스라엘에 합류했고, 랍바의 암몬 군 30% 궤멸. 3턴 동안 공격력 +25%, 민심 +5. "오늘은 사람을 죽이지 못할 것은 여호와께서 이스라엘 중에 구원을 베푸셨음이라" (11:13).'; } },
        { label: '싸움을 피하고 야베스를 내버려 둔다', run: G => {
          const r = G.city('ramoth'); r.owner = 'ammon'; r.soldiers = 2500;
          G.eachCity('israel', c => { c.loy -= 10; c.faith -= 5; });
          return '나하스가 길르앗 야베스(라못길르앗)를 차지했다. 이스라엘 민심 -10, 신앙 -5. "이 사람이 어떻게 우리를 구원하겠느냐" 하는 불량배들의 말이 퍼진다.'; } },
      ],
      altWho: 'ammon', altText: '나하스가 야베스 사람들에게 이레의 말미를 주었다. 이스라엘의 새 왕이 온다는 소문이다.',
      altChoices: [
        { label: '이레를 기다리지 않고 성을 친다', run: G => { const r = G.city('ramoth'); r.owner = 'ammon'; r.soldiers = 2000; G.eachCity('ammon', c => c.loy -= 5); return '암몬이 길르앗 야베스(라못길르앗)를 차지했다. 서두른 공격에 암몬 민심 -5.'; } },
        { label: '약속대로 이레를 기다린다', run: G => { G.city('ramoth').owner = 'israel'; G.city('rabbah').soldiers = Math.floor(G.city('rabbah').soldiers * 0.7); G.buff('israel', 'atk', 3, 0.25); G.flags.jabesh = true; return '새벽에 사울의 군대가 들이닥쳤다. 라못길르앗을 잃고 랍바의 군사 30%가 흩어졌다.'; } },
      ] },
    { id: 'gilgal', who: 'israel', auto: 1,
      cond: G => G.turn >= 5 && G.exists('israel') && G.exists('philistia') && G.alive('사울') && G.facOf('사울') === 'israel' && G.alive('사무엘'),
      title: '길갈의 제사', ref: '삼상 13:8-14',
      text: '블레셋이 믹마스에 진을 치자 백성이 굴과 수풀과 바위틈에 숨었다. 사울은 사무엘이 정한 이레를 기다렸으나 사무엘이 오지 않고 백성은 흩어져 간다. 사울이 말했다. "번제와 화목제물을 이리로 가져오라."',
      choices: [
        { label: '흩어지는 백성을 보면서도 사무엘을 끝까지 기다린다', run: G => {
          const cap = G.city(G.fac('israel').capital); cap.soldiers = Math.floor(cap.soldiers * 0.85);
          G.eachCity('israel', c => { c.faith += 10; c.loy -= 3; });
          const s = G.o('사울'); s.fai = Math.min(100, s.fai + 10);
          G.flags.waitedSamuel = true; if (G.kingdom) G.kingdom(5, '말씀을 기다림');
          return '도읍의 병력 15%가 흩어졌지만, 사무엘이 와서 제사를 드렸다. 신앙 +10, 민심 -3, 사울 신앙 +10.'; } },
        { label: '왕이 직접 번제를 드린다', run: G => {
          G.eachCity('israel', c => { c.faith -= 10; c.loy += 3; });
          const s = G.o('사울'); s.fai = Math.max(0, s.fai - 15);
          G.flags.gilgalSin = true; if (G.kingdom) G.kingdom(-5, '망령된 제사');
          return '번제를 마치자마자 사무엘이 왔다. "왕이 망령되이 행하였도다. 이제는 왕의 나라가 길지 못할 것이라" (13:13-14). 신앙 -10, 사울 신앙 -15.'; } },
      ] },
    { id: 'michmash', who: 'israel', auto: 0,
      cond: G => G.turn >= 7 && G.exists('israel') && G.exists('philistia') && G.alive('요나단') && G.facOf('요나단') === 'israel',
      title: '요나단과 무기를 든 소년', ref: '삼상 14:1-23',
      text: '요나단이 무기를 든 소년에게 말했다. "할례 받지 않은 자들의 부대에게로 건너가자. 여호와의 구원은 사람이 많고 적음에 달리지 아니하였느니라." 둘이 보세스와 세네 바위 사이로 기어올라 블레셋 수비대를 치자, 땅이 진동하고 블레셋 진영에 큰 떨림이 일어났다.',
      choices: [
        { label: '요나단을 따라 온 군대가 추격하고, 백성을 먹여 힘을 얻게 한다', run: G => {
          G.buff('israel', 'atk', 4, 0.3);
          const t = ['ekron', 'gath', 'ashdod'].find(id => G.ownerOf(id) === 'philistia'); if (t) G.city(t).soldiers = Math.floor(G.city(t).soldiers * 0.6);
          const j = G.o('요나단'); j.war = Math.min(100, j.war + 3); j.cha = Math.min(100, j.cha + 3);
          if (G.item) G.item('israel', 'trumpet', 1);
          return '블레셋 사람들이 서로 칼로 쳤다. 4턴 동안 공격력 +30%' + (t ? `, ${{ ekron: '에그론', gath: '가드', ashdod: '아스돗' }[t]}의 블레셋 수비대 40% 궤멸` : '') + '. 요나단 무력·매력 +3. 양각 나팔을 얻었다.'; } },
        { label: '"원수에게 갚기까지 음식을 먹는 자는 저주를 받으리라" 맹세한다', run: G => {
          G.buff('israel', 'atk', 3, 0.15); G.eachCity('israel', c => c.loy -= 10);
          G.flags.saulOath = true;
          return '백성이 피곤하여 탈진했다. 요나단이 꿀을 찍어 먹은 일로 죽을 뻔했으나 백성이 그를 구원했다 (14:24-45). 3턴 동안 공격력 +15%, 민심 -10.'; } },
      ],
      altWho: 'philistia', altText: '믹마스 어귀의 수비대가 기습을 받았다. 진영이 크게 떨고 있다.',
      altChoices: [
        { label: '진영을 수습한다', run: G => { G.buff('israel', 'atk', 3, 0.2); G.buff('philistia', 'atk', 2, -0.1); return '이스라엘 3턴 동안 공격력 +20%, 블레셋 2턴 동안 공격력 -10%.'; } },
      ] },
    { id: 'amalek', who: 'israel', auto: 1,
      cond: G => G.turn >= 10 && G.exists('israel') && G.exists('amalek') && G.alive('사울') && G.facOf('사울') === 'israel',
      title: '아말렉을 치라', ref: '삼상 15:1-23',
      text: '사무엘이 사울에게 말했다. "만군의 여호와께서 이같이 말씀하시되, 아말렉이 이스라엘에게 행한 일 곧 애굽에서 올라올 때에 길에서 대적한 일로 내가 그들을 벌하노니, 지금 가서 그들의 모든 소유를 남기지 말라."',
      choices: [
        { label: '말씀대로 온전히 행한다', run: G => {
          G.kill('아각'); G.eachCity('amalek', c => c.soldiers = Math.floor(c.soldiers * 0.4));
          G.eachCity('israel', c => c.faith += 15);
          const s = G.o('사울'); if (s) s.fai = Math.min(100, s.fai + 10);
          G.flags.amalekObeyed = true; if (G.kingdom) G.kingdom(10, '온전한 순종');
          return '하윌라에서 술까지 아말렉을 쳤다. 아각이 죽고 아말렉 병력 60% 궤멸. 이스라엘 신앙 +15, 사울 신앙 +10.'; } },
        { label: '아각과 가장 좋은 양과 소를 남긴다', run: G => {
          G.kill('아각'); G.eachCity('amalek', c => c.soldiers = Math.floor(c.soldiers * 0.6));
          const F = G.fac('israel'); F.food += 3000; F.gold += 300;
          G.eachCity('israel', c => c.faith -= 20);
          const s = G.o('사울'); if (s) s.fai = Math.max(0, s.fai - 20);
          G.flags.saulRejected = true; if (G.kingdom) G.kingdom(-10, '여호와께서 사울을 버리심');
          return '식량 +3000, 금 +300. 그러나 사무엘이 말했다. "여호와께서 번제와 다른 제사를 그의 목소리를 청종하는 것을 좋아하심 같이 좋아하시겠나이까. 순종이 제사보다 낫고 듣는 것이 숫양의 기름보다 나으니" (15:22). 사무엘이 길갈에서 아각을 찍었다. 여호와께서 사울을 버리셨다 — 이스라엘 신앙 -20, 사울 신앙 -20.'; } },
      ] },
    { id: 'anoint', who: 'israel', auto: 0,
      cond: G => G.done.amalek && G.exists('israel') && G.alive('다윗') && G.alive('사무엘') && (!G.facOf('다윗') || G.facOf('다윗') === 'israel'),
      title: '이새의 막내에게 기름을 붓다', ref: '삼상 16:1-13',
      text: '"너는 뿔에 기름을 채워 가지고 베들레헴 사람 이새에게로 가라." 엘리압을 보고 사무엘이 "여호와의 기름 부으실 자가 과연 주님 앞에 있도다" 하였으나 여호와께서 말씀하셨다. "사람은 외모를 보거니와 나 여호와는 중심을 보느니라." 들에서 양을 치던 막내 다윗이 불려 왔다.',
      choices: [
        { label: '다윗을 궁으로 불러 수금을 타게 한다', run: G => {
          const d = G.o('다윗'); d.fai = 99; d.cha = Math.min(100, d.cha + 3);
          if (G.facOf('다윗') !== 'israel') G.join('다윗', 'israel');
          G.flags.davidAnointed = true;
          return '여호와의 영이 다윗에게 크게 감동되었다. 사울이 다윗을 사랑하여 무기를 드는 자로 삼았다 (16:21). 다윗이 이스라엘에 합류했다.'; } },
        { label: '이새의 집에 조용히 머물게 둔다', run: G => {
          const d = G.o('다윗'); d.fai = 99; G.flags.davidAnointed = true;
          return '사무엘이 형들 가운데서 다윗에게 기름을 부었다. 다윗은 아직 베들레헴의 들에서 양을 친다 (인재 명령으로 등용할 수 있다).'; } },
      ] },
    { id: 'goliath', who: 'israel', auto: 0,
      cond: G => G.turn >= 12 && G.exists('israel') && G.exists('philistia') && G.alive('골리앗') && G.facOf('골리앗') === 'philistia' && G.alive('다윗') && (!G.facOf('다윗') || G.facOf('다윗') === 'israel'),
      title: '엘라 골짜기의 골리앗', ref: '삼상 17장',
      text: '가드 사람 골리앗이 사십 일 동안 아침저녁으로 나와 "사람을 택하여 내게로 내려보내라" 하고 이스라엘을 모욕했다. 형들에게 떡을 가져온 소년 다윗이 말했다. "너는 칼과 창과 단창으로 내게 나아오거니와 나는 만군의 여호와의 이름으로 네게 나아가노라."',
      choices: [
        { label: '사울의 갑옷을 벗고 물매와 매끄러운 돌 다섯을 든 다윗을 보낸다', run: G => {
          if (G.facOf('다윗') !== 'israel') G.join('다윗', 'israel');
          G.kill('골리앗');
          const d = G.o('다윗'); d.war = Math.min(100, d.war + 5); d.cha = Math.min(100, d.cha + 5);
          if (G.item) G.item('israel', 'sword_goliath', 1);
          G.buff('israel', 'atk', 4, 0.3);
          ['gath', 'ekron'].forEach(id => { if (G.ownerOf(id) === 'philistia') G.city(id).soldiers = Math.floor(G.city(id).soldiers * 0.7); });
          G.eachCity('israel', c => { c.faith += 10; c.loy += 5; });
          G.flags.goliathSlain = true; if (G.kingdom) G.kingdom(8, '여호와의 이름으로');
          return '돌이 골리앗의 이마에 박혔다. 다윗이 이스라엘에 합류하고 골리앗의 칼을 얻었다. 4턴 동안 공격력 +30%, 가드·에그론의 블레셋 군 30% 궤멸, 신앙 +10, 민심 +5. "전쟁은 여호와께 속한 것이라" (17:47).'; } },
        { label: '사십 일을 더 버티며 용사를 찾는다', run: G => {
          G.eachCity('israel', c => c.loy -= 10); G.buff('philistia', 'atk', 3, 0.2);
          return '이스라엘 군이 크게 두려워한다. 민심 -10, 블레셋 3턴 동안 공격력 +20%.'; } },
      ] },
    { id: 'covenant', who: 'israel', auto: 1,
      cond: G => G.done.goliath && G.flags.goliathSlain && G.turn >= 14 && G.alive('다윗') && G.facOf('다윗') === 'israel' && G.alive('사울') && G.facOf('사울') === 'israel',
      title: '사울은 천천이요 다윗은 만만이로다', ref: '삼상 18:1-16; 20:12-17',
      text: '요나단의 마음이 다윗의 마음과 하나가 되어 자기 겉옷과 칼과 활과 띠를 다윗에게 주고 언약을 맺었다. 그러나 여인들이 춤추며 "사울이 죽인 자는 천천이요 다윗은 만만이로다" 하고 노래하자, 그날부터 사울이 다윗을 주목하였다.',
      choices: [
        { label: '질투를 내려놓고 다윗을 천부장으로 세운다', ok: G => G.alive('요나단'), run: G => {
          const d = G.o('다윗'), j = G.o('요나단'); d.fai = Math.min(100, d.fai + 1); j.fai = Math.min(100, j.fai + 3);
          const s = G.o('사울'); s.fai = Math.min(100, s.fai + 5); s.cha = Math.min(100, s.cha + 5);
          G.eachCity('israel', c => c.loy += 10);
          G.flags.jonathanCovenant = true; if (G.kingdom) G.kingdom(5, '요나단과 다윗의 언약');
          return '요나단과 다윗이 여호와 앞에서 언약을 맺었다. 사울이 다윗을 시기하지 않으니 온 이스라엘과 유다가 기뻐했다. 민심 +10, 사울 신앙·매력 +5.'; } },
        { label: '수금을 타는 다윗에게 창을 던진다', run: G => {
          const d = G.o('다윗'); d.fac = null; d.city = 'gath';
          G.eachCity('israel', c => { c.loy -= 10; c.faith -= 10; });
          const s = G.o('사울'); s.fai = Math.max(0, s.fai - 10);
          G.flags.saulJealous = true; if (G.kingdom) G.kingdom(-5, '사울의 질투');
          return '다윗이 두 번 몸을 피했다. 미갈이 그를 창문으로 달아나게 했고, 다윗은 가드 왕 아기스에게로 도망했다 (19:11-17; 21:10). 다윗이 재야로 떠났다. 이스라엘 민심 -10, 신앙 -10.'; } },
      ] },
  ],
  divided: [
    { id: 'shemaiah', who: 'judah', auto: 0,
      cond: G => G.turn >= 1 && G.exists('judah') && G.exists('israel'),
      title: '너희 형제와 싸우지 말라', ref: '왕상 12:21-24',
      text: '르호보암이 유다와 베냐민 족속 중에서 택한 용사 십팔만을 모아 이스라엘과 싸우려 하였다. 그때 하나님의 사람 스마야에게 말씀이 임했다. "너희 형제 이스라엘 자손과 싸우지 말고 각기 집으로 돌아가라."',
      choices: [
        { label: '말씀에 순종하여 군대를 돌려보낸다', run: G => { G.eachCity('judah', c => { c.faith += 10; c.loy += 10; }); G.flags.peaceUntil = G.turn + 8; return '유다 신앙 +10, 민심 +10. 8턴 동안 유다와 이스라엘은 서로 공격하지 않는다.'; } },
        { label: '용사 십팔만으로 진군한다', run: G => { G.city(G.fac('judah').capital).soldiers += 4000; G.eachCity('judah', c => c.faith -= 15); return '도읍 병력 +4000, 유다 신앙 -15.'; } },
      ] },
    { id: 'calves', who: 'israel', auto: 0,
      cond: G => G.turn >= 2 && G.exists('israel') && G.alive('여로보암') && G.facOf('여로보암') === 'israel',
      title: '벧엘과 단의 금송아지', ref: '왕상 12:26-33',
      text: '여로보암이 속으로 말했다. "이 백성이 예루살렘에 있는 여호와의 성전에 제사를 드리러 올라가면 그 마음이 유다 왕 르호보암에게로 돌아가리라." 그가 금송아지 둘을 만들었다.',
      choices: [
        { label: '벧엘과 단에 금송아지를 세운다', run: G => { G.eachCity('israel', c => { c.loy += 15; c.faith -= 25; }); return '이스라엘 민심 +15, 신앙 -25. "이것이 이스라엘을 죄에 빠지게 하는 일이 되었다."'; } },
        { label: '백성이 예루살렘에 올라가도록 둔다', run: G => { G.eachCity('israel', c => { c.loy -= 10; c.faith += 10; }); if (G.exists('judah')) G.rel('judah', 'israel', 20); return '이스라엘 민심 -10, 신앙 +10. 유다와의 관계가 좋아졌다.'; } },
      ] },
    { id: 'shishak', who: 'judah', auto: 0,
      cond: G => G.turn >= 5 && G.exists('egypt') && G.exists('judah') && G.ownerOf('jerusalem') === 'judah',
      title: '시삭의 침공', ref: '왕상 14:25-28; 대하 12:1-12',
      text: '르호보암 제오년에 애굽 왕 시삭이 병거 천이백 대와 마병 육만을 거느리고 올라와 유다의 견고한 성읍들을 빼앗고 예루살렘에 이르렀다. 스마야가 말했다. "너희가 나를 버렸으므로 나도 너희를 버려 시삭의 손에 두었노라."',
      choices: [
        { label: '왕과 방백들이 스스로 겸비한다', run: G => { G.fac('judah').gold = Math.floor(G.fac('judah').gold / 2); G.eachCity('judah', c => c.faith += 10); G.rel('judah', 'egypt', 40); return '"그들이 스스로 겸비하였으니 멸하지 아니하리라." 성전 보물과 금방패를 빼앗겨 금이 절반이 되었지만 나라는 보존되었다 (신앙 +10).'; } },
        { label: '성문을 닫고 맞서 싸운다', run: G => G.raid('egypt', 'jerusalem', 8000) },
      ] },
    { id: 'zemaraim', who: 'judah', auto: 0,
      cond: G => G.turn >= 10 && G.exists('judah') && G.exists('israel') && G.alive('아비야') && G.facOf('아비야') === 'judah',
      title: '스마라임 산의 외침', ref: '대하 13장',
      text: '아비야가 스마라임 산 위에 서서 외쳤다. "여호와께서 소금 언약으로 이스라엘 나라를 영원히 다윗과 그의 자손에게 주신 것을 너희가 알 것 아니냐." 그때 여로보암의 복병이 뒤로 돌아왔다.',
      choices: [
        { label: '여호와께 부르짖고 제사장들이 나팔을 분다', run: G => { G.buff('judah', 'atk', 4, 0.3); const b = G.ownerOf('bethel') === 'israel' ? G.city('bethel') : null; if (b) b.soldiers = Math.floor(b.soldiers * 0.6); return '4턴 동안 유다 공격력 +30%.' + (b ? ' 벧엘의 이스라엘군 40% 궤멸.' : ''); } },
      ],
      altWho: 'israel', altText: '여로보암의 복병이 유다군의 뒤를 돌았다.',
      altChoices: [
        { label: '앞뒤로 협공한다', run: G => { G.buff('israel', 'atk', 2, 0.1); return '2턴 동안 이스라엘 공격력 +10%.'; } },
      ] },
    { id: 'asaReform', who: 'judah', auto: 0,
      cond: G => G.turn >= 16 && G.exists('judah') && G.alive('아사') && G.facOf('아사') === 'judah',
      title: '아사의 개혁', ref: '왕상 15:9-15; 대하 14:2-5',
      text: '아사가 여호와 보시기에 정직하게 행했다. 남색하는 자를 쫓아내고, 그의 어머니 마아가가 아세라의 가증한 우상을 만들자 태후의 자리를 폐하였다.',
      choices: [
        { label: '우상을 찍어 기드론 시냇가에서 불사른다', run: G => { G.eachCity('judah', c => { c.faith += 20; c.loy -= 5; c.def = Math.min(100, c.def + 5); }); return '유다 신앙 +20, 민심 -5, 모든 성벽 +5.'; } },
      ] },
  ],
};
