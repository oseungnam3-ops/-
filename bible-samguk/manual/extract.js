// 매뉴얼용 게임 데이터 뽑기: node manual/extract.js > manual/mdata.json
// 게임 파일을 그대로 읽어(브라우저 없이) 여섯 시대·인물·말씀 카드·성물·병종을 JSON으로 내보낸다.
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = path.join(__dirname, '..');
const ctx = { window: {}, console, location: { search: '' } };
ctx.window = ctx; vm.createContext(ctx);
const load = f => vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
const html = fs.readFileSync(path.join(D, 'index.html'), 'utf8');
const want = ['data.js', 'world.js', 'story.js', 'hero-lines.js', 'art-real.js', 'art.js', 'words.js', 'units.js'];
const eraFiles = [...html.matchAll(/src="(eras\/[^"]+)"/g)].map(m => m[1]);
['data.js', 'world.js', 'story.js', 'hero-lines.js', ...eraFiles, 'art-real.js', 'art.js', 'words.js', 'units.js'].forEach(f => { if (want.includes(f) || f.startsWith('eras/')) load(f); });
// 성물·아이템: game.js의 ITEMS 표만 떼어 읽는다
const g = fs.readFileSync(path.join(D, 'game.js'), 'utf8');
const a = g.indexOf('  const ITEMS = {'), b = g.indexOf('\n  };', a);
const ITEMS = vm.runInContext('(' + g.slice(a + '  const ITEMS = '.length, b + 4) + ')', ctx);
vm.runInContext('this.__out = { SCENARIOS, STORY, EVENTS, CITY_TABLE, KINGDOM_STAGES, ART: typeof ART !== "undefined" ? ART : {}, ART_REAL: typeof ART_REAL !== "undefined" ? ART_REAL : {} }', ctx);
const { SCENARIOS, STORY, EVENTS, CITY_TABLE, KINGDOM_STAGES, ART, ART_REAL } = ctx.__out;
const W = ctx.WORDS, U = ctx.UNITDEF;
const art = (scn, name) => ART[scn + ':' + name] || ART[name] || ART_REAL[scn + ':' + name] || ART_REAL[name] || '';
const out = { scn: [], people: {}, words: [], items: [], units: [] };
for (const sc of SCENARIOS.filter(s => s.id.startsWith('e_')).sort((x, y) => y.year - x.year)) {
  const st = STORY[sc.id] || {};
  out.scn.push({ id: sc.id, title: sc.title, year: sc.year, ref: sc.ref, intro: sc.intro,
    factions: sc.factions.map(f => ({ id: f.id, name: f.name, ruler: f.ruler, cap: f.capital, n: Object.keys(f.cities).length, story: !!st[f.id], desc: f.desc || '' })),
    goalText: sc.goalText || {}, words: sc.words || [], art: ART['@' + sc.id] || ART_REAL['@' + sc.id] || '',
    chapters: Object.fromEntries(Object.entries(st).map(([k, v]) => [k, v.map(c => ({ t: c.title, ref: c.ref, g: c.goal.text }))])),
    events: (EVENTS[sc.id] || []).map(e => ({ t: e.title, ref: e.ref })),
    artmap: Object.fromEntries(sc.officers.filter(r => art(sc.id, r[0])).map(r => [r[0], art(sc.id, r[0])])),
    // 시대 쪽의 얼굴: 하나님의 군대 인물 넷 + 적국 군주 둘 (그림이 있는 사람)
    faces: [...sc.officers.filter(r => r[6] === 'army'), ...sc.officers.filter(r => r[6] !== 'army' && sc.factions.some(f => f.ruler === r[0]))]
      .filter(r => art(sc.id, r[0])).reduce((acc, r) => { const army = r[6] === 'army'; if (acc.filter(x => x.army === army).length < (army ? 4 : 2)) acc.push({ name: r[0], army, art: art(sc.id, r[0]) }); return acc; }, []) });
  for (const r of sc.officers) {
    const [name, war, int, pol, cha, fai, fac, city, desc, ref] = r;
    const u = art(sc.id, name); if (!u) continue;
    const key = name;
    if (!out.people[key]) out.people[key] = { name, war, int, pol, cha, fai, desc, ref, art: u, scn: [], army: fac === 'army' };
    if (!out.people[key].scn.includes(sc.title)) out.people[key].scn.push(sc.title);
  }
}
out.words = W.WORDS.map(w => ({ id: w.id, name: w.name, icon: w.icon, cost: w.cost, cd: w.cd, desc: w.fx, era: W.ERA_NAME ? W.ERA_NAME[w.era] || w.era : w.era, ref: (w.refs[0] || {}).ref, text: (w.refs[0] || {}).text }));
out.items = Object.entries(ITEMS).map(([k, v]) => ({ id: k, name: v.name, rar: v.rar || '', relic: !!v.relic, faith: !!v.faith, desc: v.desc, cost: v.cost }));
out.units = Object.entries(U.TYPES).map(([k, t]) => ({ id: k, name: t.n, mv: t.mv, rng: t.rng, camp: t.camp, desc: t.desc }));
out.cities = Object.fromEntries(CITY_TABLE.map(r => [r[0], r[1]]));
out.stages = KINGDOM_STAGES;
out.art = Object.assign({}, ART_REAL, ART); // 이름 → 그림 (시대 이름이 붙은 키 포함)
process.stdout.write(JSON.stringify(out, null, 1));
