// 성경 삼국지 — 말씀 카드: 전투 중 기도로 모은 영력을 써서 말씀을 선포한다.
// 시대(시나리오)와 가진 성물에 따라 열린다. tactics.js(직접 지휘)와 game.js(자동 전투)가 함께 쓴다.
(() => {
  'use strict';
  // 시대 순서: 새 시대 시나리오 id(e_patriarchs · e_exodus · e_judges · e_united · e_divided · e_inter)와 지금 id를 함께 받는다
  // e_exodus는 출애굽과 여호수아의 가나안 정복을 함께 다루므로 2(정복)로 둔다
  const ERA_OF = { e_patriarchs: 0, e_exodus: 2, e_judges: 3, e_united: 4, e_divided: 5, e_inter: 6,
    patriarchs: 0, exodus: 1, conquest: 2, judges: 3, saul: 4, united: 4, david: 4, divided: 5, maccabees: 6, intertestamental: 6 };
  const ERA_NAME = ['족장 시대', '출애굽 시대', '가나안 정복', '사사 시대', '통일 왕국', '분열 왕국', '신구약 중간 시대'];
  const era = scn => ERA_OF[scn] ?? 4;

  // cost 영력 · cd 다시 쓸 때까지 턴 · once 한 전투에 한 번 · target 'foe' 적 부대를 고른다 · need 쓸 수 있는 전장
  // refs: 시대에 따라 다른 구절(가장 늦은 era ≤ 지금 시대를 쓴다) · items: 이 성물 중 하나를 가지면 시대와 상관없이 열린다
  // 시나리오(SCENARIOS)에 words: [id…]가 있으면 시대 대신 그 목록을 쓴다
  const WORDS = [
    { id: 'fear_not', name: '두려워하지 말라', icon: '🕊', cost: 25, cd: 2, era: 0, items: ['psalm_scroll'], fx: '아군의 혼란·불길을 걷어 내고 사기 +25',
      refs: [{ era: 0, ref: '창 15:1', text: '아브람아 두려워하지 말라 나는 너의 방패요 너의 지극히 큰 상급이니라' }, { era: 2, ref: '수 1:9', text: '강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라' }] },
    { id: 'jireh', name: '여호와 이레', icon: '🐏', cost: 35, cd: 3, era: 0, fx: '모든 아군 병력 10% 회복',
      refs: [{ era: 0, ref: '창 22:14', text: '아브라함이 그 땅 이름을 여호와 이레라 하였으므로 오늘날까지 사람들이 이르기를 여호와의 산에서 준비되리라 하더라' }] },
    { id: 'mahanaim', name: '하나님의 군대', icon: '👼', cost: 50, cd: 4, era: 0, fx: '하늘 군대가 둘러싼다 — 2턴 동안 아군이 받는 피해 -30%',
      refs: [{ era: 0, ref: '창 32:1-2', text: '하나님의 사자들이 그를 만난지라 야곱이 그들을 볼 때에 이르되 이는 하나님의 군대라 하고 그 땅 이름을 마하나임이라 하였더라' }, { era: 5, ref: '왕하 6:17', text: '여호와께서 그 청년의 눈을 여시매 그가 보니 불말과 불병거가 산에 가득하여 엘리사를 둘렀더라' }] },
    { id: 'nissi', name: '여호와 닛시', icon: '🚩', cost: 40, cd: 4, era: 1, items: ['moses_staff', 'torah_scroll'], fx: '선포한 장수가 제자리를 지키는 동안(최대 3턴) 아군 공격 +25%',
      refs: [{ era: 1, ref: '출 17:11, 15', text: '모세가 손을 들면 이스라엘이 이기고 손을 내리면 아말렉이 이기더니 … 모세가 제단을 쌓고 그 이름을 여호와 닛시라 하고' }] },
    { id: 'red_sea', name: '홍해를 가르시다', icon: '🌊', cost: 50, cd: 5, era: 1, items: ['moses_staff'], need: 'water', fx: '2턴 동안 아군이 강을 걸어서 건넌다 · 물이 돌아올 때 강과 여울의 적이 휩쓸린다',
      refs: [{ era: 1, ref: '출 14:21', text: '모세가 바다 위로 손을 내밀매 여호와께서 큰 동풍이 밤새도록 바닷물을 물러가게 하시니 물이 갈라져 바다가 마른 땅이 된지라' }] },
    { id: 'jericho_shout', name: '여리고의 함성', icon: '📯', cost: 80, cd: 99, once: true, era: 2, items: ['ark'], need: 'siege', fx: '성벽과 성문이 무너져 내린다 · 성벽 위의 적이 떨어져 다친다',
      refs: [{ era: 2, ref: '수 6:20', text: '백성이 나팔 소리를 들을 때에 크게 소리 질러 외치니 성벽이 무너져 내린지라 백성이 각기 앞으로 나아가 그 성에 들어가서 그 성을 점령하고' }] },
    { id: 'sun_stand_still', name: '태양아 머물라', icon: '☀', cost: 90, cd: 99, once: true, era: 2, fx: '해가 머문다 — 아군이 이번 턴을 한 번 더 움직인다',
      refs: [{ era: 2, ref: '수 10:12-13', text: '태양아 너는 기브온 위에 머무르라 달아 너도 아얄론 골짜기에서 그리할지어다 하매 태양이 머물고 달이 멈추기를 백성이 그 대적에게 원수를 갚기까지 하였느니라' }] },
    { id: 'gideon_torch', name: '기드온의 나팔과 횃불', icon: '🔥', cost: 60, cd: 5, era: 3, items: ['gideon_trumpet'], fx: '모든 적이 혼란 · 붙어 있는 적끼리 서로 친다',
      refs: [{ era: 3, ref: '삿 7:20, 22', text: '나팔을 불며 항아리를 부수고 … 외쳐 이르되 여호와와 기드온의 칼이다 하고 … 여호와께서 그 온 진영에서 친구끼리 칼로 치게 하시므로' }] },
    { id: 'lord_of_hosts', name: '만군의 여호와의 이름으로', icon: '🪨', cost: 45, cd: 3, era: 4, items: ['david_sling'], target: 'foe', fx: '적 한 부대에 큰 타격(병력 -30%, 사기 -30) · 이번 전투 일기토 무력 +10',
      refs: [{ era: 4, ref: '삼상 17:45', text: '너는 칼과 창과 단창으로 내게 나아오거니와 나는 만군의 여호와의 이름 곧 네가 모욕하는 이스라엘 군대의 하나님의 이름으로 네게 나아가노라' }] },
    { id: 'fire_from_heaven', name: '하늘에서 내린 불', icon: '⚡', cost: 55, cd: 3, era: 5, items: ['elijah_mantle'], target: 'foe', fx: '불기둥 — 과녁 -25%, 둘레 -10%, 불이 붙고 코끼리는 날뛴다',
      refs: [{ era: 5, ref: '왕상 18:38', text: '이에 여호와의 불이 내려서 번제물과 나무와 돌과 흙을 태우고 또 도랑의 물을 핥은지라' }] },
  ];
  const byId = Object.fromEntries(WORDS.map(w => [w.id, w]));
  // 지금 시대에 맞는 구절
  const verse = (w, e) => w.refs.filter(r => r.era <= e).pop() || w.refs[0];
  // 열린 카드: 시대가 되었거나 해금 성물을 가졌을 때
  const scnWords = scn => { try { const sc = typeof SCENARIOS !== 'undefined' && SCENARIOS.find(x => x.id === scn); return sc && Array.isArray(sc.words) ? sc.words : null; } catch (e) { return null; } };
  const own = (items, k) => items && (items.has ? items.has(k) : items[k] > 0);
  const unlocked = (scn, items) => { const list = scnWords(scn); return WORDS.filter(w => (list ? list.includes(w.id) : era(scn) >= w.era) || (w.items || []).some(k => own(items, k))); };

  window.WORDS = { WORDS, byId, era, ERA_OF, ERA_NAME, verse, unlocked };
})();
