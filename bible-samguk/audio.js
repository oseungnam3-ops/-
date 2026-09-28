// 성경 삼국지 — 소리: 배경음악 · 효과음 · 인물 목소리
// 배경음악과 효과음은 파일 없이 Web Audio로 합성한다(리라·목동 피리·드론·틀북·양각 나팔).
// 음계는 고대 근동 느낌의 히자즈(D Eb F# G A Bb C)와 도리아 선법을 쓴다.
// 인물 목소리는 역할별 짧은 한국어 대사(Higgsfield 음성 합성)를 재생한다.
(() => {
  'use strict';
  const PREF_KEY = 'bible-samguk-audio';
  const DEF = { bgm: 0.55, sfx: 0.8, voice: 0.9, on: true, mode: 'hymn' }; // mode: hymn = 찬양 메들리, era = 시대 음악
  const pref = (() => { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) { return Object.assign({}, DEF); } })();
  const savePref = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch (e) { /* 저장소 없음 */ } };

  const BGM_GAIN = 1.3; // 배경음악 버스 배율 (효과음·목소리와 균형)
  let ctx = null, master, bgmBus, sfxBus, noiseBuf = null, verb = null;
  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = pref.on ? 1 : 0; master.connect(ctx.destination);
    // 넓은 성전 같은 잔향: 짧은 노이즈 임펄스
    verb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.28; verb.connect(wet); wet.connect(master);
    bgmBus = ctx.createGain(); bgmBus.gain.value = pref.bgm * BGM_GAIN; bgmBus.connect(master); bgmBus.connect(verb);
    sfxBus = ctx.createGain(); sfxBus.gain.value = pref.sfx; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return ctx;
  }
  const unlock = () => { if (!init()) return; if (ctx.state === 'suspended') ctx.resume(); if (want && !cur) startTrack(want); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlock, { passive: true }));
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  // ---------- 악기 ----------
  function env(g, t, a, peak, d, sus = 0) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t + a + d); }
  function osc(type, f, t, dur, out, gainPeak, a = 0.005, detune = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    env(g, t, a, gainPeak, dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + a + dur + 0.05); return o;
  }
  function lyre(m, t, v = 0.22, out = bgmBus) { // 뜯는 현: 삼각파 + 배음, 빠른 감쇠
    const f = hz(m), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(out);
    osc('triangle', f, t, 1.1, lp, v); osc('sine', f * 2, t, 0.5, lp, v * 0.35); osc('sine', f * 3.01, t, 0.25, lp, v * 0.12);
  }
  function flute(m, t, dur, v = 0.12, out = bgmBus) { // 목동 피리(나이): 사인 + 떨림 + 숨소리
    const f = hz(m), o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f * 0.985, t); o.frequency.linearRampToValueAtTime(f, t + 0.08);
    lfo.frequency.value = 5.2; lg.gain.value = f * 0.012; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.09); g.gain.setValueAtTime(v, t + dur * 0.75); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
    const n = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); n.buffer = noiseBuf; nf.type = 'bandpass'; nf.frequency.value = f * 2; nf.Q.value = 3;
    ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(v * 0.25, t + 0.04); ng.gain.linearRampToValueAtTime(0.0001, t + Math.min(dur, 0.4));
    n.connect(nf); nf.connect(ng); ng.connect(out); n.start(t); n.stop(t + dur);
  }
  function drone(m, t, dur, v = 0.05, out = bgmBus) { // 낮게 깔리는 지속음
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(out);
    [-7, 6].forEach(dt => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.6); g.gain.setValueAtTime(v, t + dur - 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur + 0.05); });
  }
  function doum(t, v = 0.5, out = bgmBus, f0 = 120) { // 틀북 낮은 소리
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.45, t + 0.18);
    env(g, t, 0.003, v, 0.3); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4);
    noise(t, 0.06, v * 0.25, 900, out, 'lowpass');
  }
  function tek(t, v = 0.18, out = bgmBus) { noise(t, 0.05, v, 3200, out, 'bandpass', 2); }
  function noise(t, dur, v, f, out, type = 'bandpass', q = 1) {
    const n = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = noiseBuf; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    env(g, t, 0.002, v, dur); n.connect(fl); fl.connect(g); g.connect(out); n.start(t); n.stop(t + dur + 0.05);
  }
  function horn(m, t, dur, v = 0.14, out = bgmBus) { // 양각 나팔(쇼파르): 톱니파, 음정이 밀려 올라감
    const f = hz(m), o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.82, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12); o.frequency.setValueAtTime(f, t + dur * 0.7); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(1800, t + 0.15); lp.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.07); g.gain.setValueAtTime(v, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  function bell(m, t, v = 0.2, out = sfxBus) { [1, 2.76, 5.4].forEach((r, i) => osc('sine', hz(m) * r, t, 2.2 / (i + 1), out, v / (i + 1.5))); }

  // ---------- 곡 ----------
  // 음 이름 → MIDI. 한 칸 = 16분음. null = 쉼. 각 곡은 마디 묶음을 반복한다.
  const N = s => s == null ? null : { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[s[0]] + (s[1] === '#' ? 1 : s[1] === 'b' ? -1 : 0) + 12 * (+s[s.length - 1] + 1);
  const seq = str => str.trim().split(/\s+/).map(x => x === '.' ? null : x === '-' ? '-' : N(x));
  const TRACKS = {
    // 타이틀: 장엄하고 느린 히자즈 — 드론 위의 피리 선율
    title: { bpm: 66, bars: 8, drone: [38, 45], mel: seq(`D5 - - - Eb5 - F#5 - G5 - - - F#5 - Eb5 - D5 - - - - - - - A4 - Bb4 - C5 - Bb4 - A4 - - - G4 - F#4 - G4 - - - A4 - - - - - - - D5 - - - Eb5 - F#5 - A5 - - - G5 - F#5 - G5 - - - F#5 - Eb5 - D5 - - - - - - - . . . . . . . .`),
      arp: seq('D3 A3 D4 F#4 A4 F#4 D4 A3'), drum: 'D...............D.......t.......', lyreEvery: 2 },
    // 지도: 행군 느낌의 도리아 — 리라 오스티나토와 피리
    map: { bpm: 92, bars: 8, drone: [38], mel: seq(`D5 - F5 - G5 - A5 - - - G5 - F5 - E5 - D5 - - - . . C5 - D5 - E5 - F5 - - - E5 - D5 - C5 - A4 - - - . . A4 - C5 - D5 - F5 - G5 - - - F5 - G5 - A5 - C6 - - - A5 - G5 - F5 - E5 - D5 - - - - - - - . . . . . . . .`),
      arp: seq('D3 A3 D4 A3 F3 A3 C4 A3'), drum: 'D...t...D.t.t...D...t...D.t.tt..', lyreEvery: 1 },
    // 영지·내정: 목가적인 G 선율 — 목동의 피리와 부드러운 리라
    land: { bpm: 80, bars: 8, drone: [43], mel: seq(`G5 - - - A5 - B5 - D6 - - - B5 - A5 - G5 - - - E5 - D5 - E5 - - - - - - - D5 - E5 - G5 - A5 - B5 - - - A5 - G5 - A5 - - - - - - - G5 - - - A5 - B5 - D6 - - - E6 - D6 - B5 - - - A5 - G5 - E5 - - - D5 - - - G5 - - - - - - - . . . . . . . .`),
      arp: seq('G3 D4 G4 B4 D4 G4 B4 G4'), drum: 'D.......t.......D.......t...t...', lyreEvery: 1 },
    // 전쟁: 빠른 히자즈 — 북과 양각 나팔
    war: { bpm: 138, bars: 8, drone: [26, 33], mel: seq(`D5 . D5 Eb5 F#5 - Eb5 - D5 - . . A4 - . . D5 . D5 Eb5 F#5 - G5 - A5 - - - . . . . Bb5 - A5 - G5 - F#5 - G5 - F#5 - Eb5 - D5 - Eb5 - D5 - C5 - Bb4 - A4 - - - . . . .`),
      arp: seq('D3 D3 A2 D3 Eb3 D3 A2 D3'), drum: 'D.D.t.D.DDt.D.t.D.D.t.D.DDt.DDtt', lyreEvery: 1, horn: [0, 4], hornNote: 62 },
    // 대화·사명: 잔잔한 하프와 긴 드론
    story: { bpm: 60, bars: 4, drone: [38, 45], mel: seq(`. . . . A5 - - - - - - - F#5 - - - G5 - - - - - - - . . . . . . . . . . . . D5 - - - - - - - Eb5 - - - D5 - - - - - - - . . . . . . . .`),
      arp: seq('D3 A3 D4 G4 A4 D5 A4 G4'), drum: '................................', lyreEvery: 1 },
  };
  let cur = null, want = null, timer = null, step = 0, nextT = 0, melLevel = 1;
  function startTrack(name) {
    stopTrack(true); if (!ctx) return;
    if (name === 'hymn') { cur = name; fadeIn(); hymnNext(); timer = setInterval(hymnTick, 60); return; }
    const T = TRACKS[name]; if (!T) return;
    cur = name; step = 0; nextT = ctx.currentTime + 0.12; fadeIn();
    timer = setInterval(() => tick(T), 60);
  }
  function fadeIn() { bgmBus.gain.cancelScheduledValues(ctx.currentTime); bgmBus.gain.setValueAtTime(0.0001, ctx.currentTime); bgmBus.gain.linearRampToValueAtTime(pref.bgm * BGM_GAIN, ctx.currentTime + 1.2); }
  function stopTrack(quick) {
    clearInterval(timer); timer = null; cur = null; hs = null;
    if (ctx && bgmBus) { bgmBus.gain.cancelScheduledValues(ctx.currentTime); bgmBus.gain.setValueAtTime(bgmBus.gain.value, ctx.currentTime); bgmBus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + (quick ? 0.25 : 0.8)); }
  }
  function tick(T) {
    const s16 = 60 / T.bpm / 4, total = T.bars * 16;
    while (nextT < ctx.currentTime + 0.25) {
      const i = step % total, t = nextT;
      if (i === 0) T.drone.forEach(m => drone(m, t, s16 * total, T.bpm > 120 ? 0.035 : 0.045));
      // 선율: '-'는 앞 음을 잇는다
      const m = T.mel[i % T.mel.length];
      if (m != null && m !== '-') { let len = 1; while (T.mel[(i + len) % T.mel.length] === '-' && len < 16) len++; flute(m, t, s16 * len * 0.98, T === TRACKS.war ? 0.1 : 0.11 * melLevel); }
      if (i % (2 * T.lyreEvery) === 0) { const a = T.arp[(i / (2 * T.lyreEvery)) % T.arp.length]; if (a != null) lyre(a, t, T === TRACKS.war ? 0.16 : 0.15); }
      const d = T.drum[i % T.drum.length];
      if (d === 'D') doum(t, T === TRACKS.war ? 0.55 : 0.32, bgmBus, T === TRACKS.war ? 95 : 120); else if (d === 't') tek(t, T === TRACKS.war ? 0.16 : 0.1);
      if (T.horn && i % 64 === 0 && T.horn.includes((i / 16) % 8)) horn(T.hornNote, t, s16 * 10, 0.09);
      nextT += s16; step++;
    }
  }
  // 장면 → 곡. 찬양 모드에서는 전쟁을 뺀 모든 장면이 한 메들리를 이어서 듣는다(장면이 바뀌어도 곡이 끊기지 않음).
  const target = name => pref.mode === 'hymn' && name !== 'war' ? 'hymn' : name;
  let scene = 'title';
  function bgm(name, force) {
    if (!force) scene = name;
    want = force ? name : target(name);
    if (!ctx || ctx.state !== 'running') return; // 첫 터치 뒤에 시작
    if (cur !== want) startTrack(want);
  }

  // ---------- 찬양 메들리 ----------
  // hymns.js의 4성부 악보를 경음악으로 연주한다. 1절: 피리 선율 + 현악 패드 + 베이스, 2절: 하프 합주.
  const HY = typeof HYMNS !== 'undefined' ? HYMNS : [];
  const parsed = new Map();
  function parseHymn(h) {
    if (parsed.has(h)) return parsed.get(h);
    const vs = h.v.map(str => { let t = 0; const out = []; str.split(' ').forEach(tok => { const [p, d] = tok.split(':'); const q = +d / 4; if (p !== 'r') out.push({ t, d: q, ps: p.split('.').map(Number) }); t += q; }); return out; });
    const len = Math.max(...vs.map(v => v.length ? v[v.length - 1].t + v[v.length - 1].d : 0));
    const r = { vs, len }; parsed.set(h, r); return r;
  }
  function pad(m, t, dur, v) { // 현악 패드: 살짝 어긋난 톱니파 둘을 부드럽게 거른 소리
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(bgmBus);
    const a = Math.min(0.25, dur * 0.3), rel = Math.min(0.35, dur * 0.4);
    [-6, 5].forEach(dt => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + Math.max(a, dur - rel)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05);
      o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur + 0.1); });
  }
  function harp(m, t, v) { // 하프: 부드럽게 오래 울리는 뜯는 소리
    const f = hz(m), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000; lp.connect(bgmBus);
    osc('triangle', f, t, 2.4, lp, v, 0.004); osc('sine', f * 2, t, 1.2, lp, v * 0.3, 0.004); osc('sine', f * 4.02, t, 0.35, lp, v * 0.06, 0.003);
  }
  function bass(m, t, dur, v) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; lp.connect(bgmBus);
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = hz(m);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.04); g.gain.exponentialRampToValueAtTime(v * 0.45, t + Math.min(dur, 1.2)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.08);
    o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur + 0.15);
  }
  let hs = null, queue = [], songNo = -1;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function hymnNext() {
    if (!HY.length) return;
    if (!queue.length) { queue = shuffle(HY.map((_, i) => i)); if (queue[0] === songNo && queue.length > 1) queue.push(queue.shift()); }
    songNo = queue.shift();
    const h = HY[songNo], P = parseHymn(h);
    const qpm = Math.max(66, Math.min(150, h.bpm)) * 0.8; // 배경으로 듣기 좋게 조금 느리게
    hs = { h, P, spq: 60 / qpm, verse: 0, t0: ctx.currentTime + 0.3, ptr: P.vs.map(() => 0) };
    try { window.dispatchEvent(new CustomEvent('snd-song', { detail: { t: h.t, en: h.en } })); } catch (e) { /* 알림 불가 */ }
  }
  function hymnTick() {
    if (!hs) return;
    const now = ctx.currentTime, horizon = now + 0.3, { P, spq } = hs, harpVerse = hs.verse === 1;
    P.vs.forEach((v, vi) => {
      while (hs.ptr[vi] < v.length) {
        const e = v[hs.ptr[vi]], t = hs.t0 + e.t * spq; if (t > horizon) break;
        hs.ptr[vi]++; if (t < now - 0.05) continue;
        const dur = e.d * spq, top = vi === 0, low = vi === P.vs.length - 1 && P.vs.length > 2;
        e.ps.forEach((m, k) => {
          const lead = top && k === 0;
          if (harpVerse) harp(lead ? m + 12 : m, t, lead ? 0.2 : low ? 0.12 : 0.07);
          else if (lead) flute(m, t, dur * 0.96, 0.12);
          else if (low || (vi === P.vs.length - 1 && k === e.ps.length - 1)) bass(m, t, dur * 0.95, 0.16);
          else pad(m, t, dur * 0.98, 0.022);
        });
        if (harpVerse && low) bass(e.ps[e.ps.length - 1], t, dur * 0.9, 0.08);
      }
    });
    const end = hs.t0 + P.len * spq;
    if (now > end - 0.05) {
      if (hs.verse === 0) { hs.verse = 1; hs.t0 = end + spq; hs.ptr = P.vs.map(() => 0); }
      else if (now > end + 2.2) hymnNext(); // 곡 사이 잠깐 쉼
    }
  }
  function next() { if (cur === 'hymn' && ctx) { hymnNext(); } else if (pref.mode === 'hymn') bgm('title'); }

  // ---------- 효과음 ----------
  const SFX = {
    click: t => { osc('triangle', 880, t, 0.05, sfxBus, 0.08); },
    open: t => { osc('sine', 520, t, 0.12, sfxBus, 0.08); osc('sine', 780, t + 0.05, 0.14, sfxBus, 0.07); },
    coin: t => { osc('square', 1318, t, 0.08, sfxBus, 0.06); osc('square', 1760, t + 0.07, 0.22, sfxBus, 0.06); },
    build: t => { [0, 0.16, 0.32].forEach(d => { noise(t + d, 0.07, 0.35, 1800, sfxBus, 'bandpass', 3); osc('sine', 180, t + d, 0.08, sfxBus, 0.2); }); },
    craft: t => { [0, 0.22].forEach(d => { osc('square', 1560, t + d, 0.35, sfxBus, 0.05); osc('sine', 2340, t + d, 0.5, sfxBus, 0.05); noise(t + d, 0.04, 0.3, 4000, sfxBus); }); },
    clash: t => { noise(t, 0.12, 0.45, 5200, sfxBus, 'highpass'); osc('square', 1900 + Math.random() * 400, t, 0.3, sfxBus, 0.05); osc('sine', 3100, t + 0.01, 0.45, sfxBus, 0.04); },
    hit: t => { doum(t, 0.6, sfxBus, 90); noise(t, 0.12, 0.3, 700, sfxBus, 'lowpass'); },
    march: t => { for (let k = 0; k < 6; k++) doum(t + k * 0.22, 0.4, sfxBus, 100); },
    horn: t => { horn(62, t, 1.3, 0.16, sfxBus); },
    fire: t => { noise(t, 0.9, 0.3, 900, sfxBus, 'bandpass', 0.7); },
    thunder: t => { noise(t, 1.8, 0.6, 180, sfxBus, 'lowpass'); noise(t + 0.05, 0.3, 0.4, 2500, sfxBus, 'bandpass'); },
    victory: t => { [62, 66, 69, 74].forEach((m, k) => { lyre(m, t + k * 0.14, 0.25, sfxBus); }); horn(74, t + 0.56, 1.2, 0.12, sfxBus); bell(86, t + 0.56, 0.15); },
    defeat: t => { [62, 61, 58, 57].forEach((m, k) => flute(m, t + k * 0.35, 0.34, 0.12, sfxBus)); },
    holy: t => { [74, 78, 81].forEach((m, k) => bell(m, t + k * 0.05, 0.14)); },
    gong: t => { [1, 1.48, 2.1, 2.9].forEach((r, k) => osc('sine', 110 * r, t, 3 / (k + 1), sfxBus, 0.18 / (k + 1))); noise(t, 0.05, 0.3, 300, sfxBus, 'lowpass'); },
    level: t => { [67, 71, 74, 79].forEach((m, k) => lyre(m, t + k * 0.09, 0.22, sfxBus)); bell(91, t + 0.36, 0.12); },
    page: t => { noise(t, 0.12, 0.12, 2600, sfxBus, 'bandpass', 0.8); },
  };
  function sfx(name) { if (!ctx || !pref.on || ctx.state !== 'running' || !SFX[name]) return; SFX[name](ctx.currentTime + 0.01); }

  // ---------- 목소리 ----------
  // 역할별 네 마디: [짧은 대꾸, 감탄, 명령 수락, 전투 함성]
  const VB = 'https://d8j0ntlcm91z4.cloudfront.net/user_3I574YtwmpYHnuLndXo7HfkSOzb/';
  const VOICES = typeof VOICE_CLIPS !== 'undefined' ? VOICE_CLIPS : {};
  let lastVoice = null;
  function roleKey(o, isRuler, isEnemy) {
    const r = window.PORTRAIT ? PORTRAIT.roleOf(o, isRuler) : 'elder';
    if (r === 'woman') return 'woman';
    if (isEnemy && (r === 'philking' || r === 'king' || r === 'phil' || r === 'egypt' || r === 'warrior')) return 'enemy';
    if (r === 'king' || r === 'philking' || r === 'egypt') return isRuler ? 'king' : 'warrior';
    if (r === 'priest' || r === 'prophet') return 'sage';
    if (r === 'warrior' || r === 'phil') return 'warrior';
    return o.int >= o.war ? 'sage' : 'warrior';
  }
  function voice(role, kind) {
    if (!pref.on || pref.voice <= 0) return;
    const set = VOICES[role]; if (!set) return;
    const idx = { neutral: 0, excl: 1, obey: 2, battle: 3 }[kind] ?? 0, url = set[idx]; if (!url) return;
    try { if (lastVoice) lastVoice.pause(); const a = new Audio(VB + url); a.volume = Math.min(1, pref.voice); a.play().catch(() => {}); lastVoice = a; } catch (e) { /* 재생 불가 */ }
  }

  // ---------- 설정 ----------
  function set(k, v) {
    pref[k] = v; savePref(); if (!ctx) return;
    if (k === 'mode' && cur !== 'war') bgm(scene);
    if (k === 'on') master.gain.setTargetAtTime(v ? 1 : 0, ctx.currentTime, 0.05);
    if (k === 'bgm') bgmBus.gain.setTargetAtTime(v * BGM_GAIN, ctx.currentTime, 0.05);
    if (k === 'sfx') sfxBus.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  }
  // 점검용: 전체 출력의 최고값·평균 음량
  let an = null;
  function level() { if (!ctx) return null; if (!an) { an = ctx.createAnalyser(); an.fftSize = 2048; master.connect(an); } const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); let pk = 0, s = 0; d.forEach(v => { pk = Math.max(pk, Math.abs(v)); s += v * v; }); return { peak: pk, rms: Math.sqrt(s / d.length) }; }
  window.SND = { bgm, sfx, voice, roleKey, set, level, next, hymns: HY.map(h => ({ t: h.t, en: h.en })), get song() { return cur === 'hymn' && hs ? { t: hs.h.t, en: hs.h.en, verse: hs.verse + 1 } : null; }, get pref() { return Object.assign({}, pref); }, get track() { return cur; }, unlock };
})();
