// 성경 삼국지 — 인물 초상화 (SVG 절차 생성)
// 이름으로 얼굴을 고정 생성하고, 신분(왕·제사장·선지자·용사·블레셋·애굽·여인)에 따라 머리 장식을 바꾼다.
(() => {
  'use strict';
  const hash = s => { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pickR = (r, a) => a[Math.floor(r() * a.length)];
  const WOMEN = ['라합'];
  const OLD = ['갈렙', '엘르아살', '나단', '아히야', '잇도', '벧엘의 늙은 선지자', '아히도벨', '르호보암', '히람', '아기스'];

  function roleOf(o, isRuler) {
    const d = o.desc || '', origin = o.origin ?? o.fac;
    if (WOMEN.includes(o.name)) return 'woman';
    if (origin === 'egypt') return 'egypt';
    if (d.includes('제사장')) return 'priest';
    if (/선지자|선견자|하나님의 사람/.test(d)) return 'prophet';
    if (origin === 'philistia' || d.includes('거인') || d.includes('아낙')) return isRuler ? 'philking' : 'phil';
    if (isRuler || /왕$| 왕/.test(o.name)) return 'king';
    if (o.war >= 78) return 'warrior';
    return 'elder';
  }

  function portrait(o, opts = {}) {
    const r = rng(hash(o.name));
    const role = opts.role || roleOf(o, opts.ruler);
    const bg = opts.color || '#6b6250';
    const skin = pickR(r, ['#c98e62', '#b97d52', '#d39b6f', '#a86f47', '#bf8659']);
    const shade = '#00000026';
    const old = OLD.includes(o.name);
    const hairC = old ? pickR(r, ['#d9d4c8', '#bdb7aa', '#a39d91']) : pickR(r, ['#2a1c12', '#3b2717', '#1d1510', '#4a2f1b']);
    const fierce = (o.war - 50) / 50; // -1..1
    const wise = (o.int - 50) / 50;
    const robe = { king: '#7a2e3a', priest: '#e9e4d6', prophet: '#6b5238', warrior: '#5b4a33', elder: pickR(r, ['#3f5670', '#5a6b3c', '#6e4a3a']), phil: '#8a3b2a', philking: '#8a3b2a', egypt: '#f0e8d0', woman: '#8e2f3a' }[role];
    const id = 'p' + hash(o.name + role).toString(36);
    const faceW = 16 + r() * 2.5, faceH = 20 + r() * 2;
    const eyeY = 56 - r() * 1.5, browTilt = fierce * 2.2;
    let s = `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" class="portrait" role="img" aria-label="${o.name} 초상">
<defs><radialGradient id="${id}b" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="${bg}" stop-opacity=".95"/><stop offset="1" stop-color="#0b1020"/></radialGradient>
<linearGradient id="${id}f" x1="0" x2="1"><stop offset="0" stop-color="${skin}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="#00000030"/></linearGradient></defs>
<rect width="100" height="120" fill="url(#${id}b)"/>
<path d="M0 120 L0 104 Q18 86 38 84 L62 84 Q82 86 100 104 L100 120 Z" fill="${robe}"/>
<path d="M38 84 L50 104 L62 84" fill="none" stroke="${shade}" stroke-width="2"/>`;
    // 신분별 어깨 장식
    if (role === 'priest') s += `<rect x="36" y="92" width="28" height="22" rx="2" fill="#c9a24a"/>${[0, 1, 2, 3].map(i => [0, 1, 2].map(j => `<circle cx="${41 + j * 9}" cy="${96 + i * 5}" r="1.9" fill="${['#b0413e', '#3f7d5a', '#3c63a8', '#d6b94a'][(i + j) % 4]}"/>`).join('')).join('')}`;
    if (role === 'king' || role === 'philking') s += `<path d="M20 98 Q50 90 80 98" stroke="#d7a93f" stroke-width="3" fill="none"/>`;
    if (role === 'warrior' || role === 'phil') s += `<path d="M14 104 Q30 90 46 90 L54 90 Q70 90 86 104 L86 112 L14 112 Z" fill="#8a6a3c" opacity=".85"/><path d="M20 100 L80 100 M22 106 L78 106" stroke="#5e4424" stroke-width="1.2"/>`;
    if (role === 'prophet') s += `<path d="M0 120 L0 100 Q20 80 34 76 L50 96 L66 76 Q80 80 100 100 L100 120 Z" fill="#4c3a28"/>`;
    // 목, 귀, 얼굴
    s += `<rect x="43" y="72" width="14" height="14" fill="${skin}"/><rect x="43" y="80" width="14" height="6" fill="${shade}"/>
<ellipse cx="${50 - faceW}" cy="58" rx="3" ry="4.5" fill="${skin}"/><ellipse cx="${50 + faceW}" cy="58" rx="3" ry="4.5" fill="${skin}"/>
<ellipse cx="50" cy="56" rx="${faceW}" ry="${faceH}" fill="url(#${id}f)"/>`;
    // 머리카락 (머리 장식 없는 부분)
    if (role !== 'egypt') s += `<path d="M${50 - faceW} 52 Q${50 - faceW} 34 50 33 Q${50 + faceW} 34 ${50 + faceW} 52 Q${50 + faceW - 4} 42 50 41 Q${50 - faceW + 4} 42 ${50 - faceW} 52 Z" fill="${hairC}"/>`;
    // 눈썹·눈
    s += `<path d="M${38} ${eyeY - 6 + browTilt} L${46} ${eyeY - 6 - browTilt * 0.4}" stroke="${hairC === '#d9d4c8' ? '#8f887c' : hairC}" stroke-width="${2.2 + Math.max(0, fierce)}" stroke-linecap="round"/>
<path d="M${62} ${eyeY - 6 + browTilt} L${54} ${eyeY - 6 - browTilt * 0.4}" stroke="${hairC === '#d9d4c8' ? '#8f887c' : hairC}" stroke-width="${2.2 + Math.max(0, fierce)}" stroke-linecap="round"/>
<ellipse cx="42" cy="${eyeY}" rx="3.2" ry="${1.7 + wise * 0.3}" fill="#f3ead8"/><ellipse cx="58" cy="${eyeY}" rx="3.2" ry="${1.7 + wise * 0.3}" fill="#f3ead8"/>
<circle cx="42.4" cy="${eyeY}" r="1.5" fill="#20150d"/><circle cx="58.4" cy="${eyeY}" r="1.5" fill="#20150d"/>
<path d="M38.5 ${eyeY - 2} Q42 ${eyeY - 3.6} 45.5 ${eyeY - 2}" stroke="#3a2718" stroke-width=".9" fill="none"/><path d="M54.5 ${eyeY - 2} Q58 ${eyeY - 3.6} 61.5 ${eyeY - 2}" stroke="#3a2718" stroke-width=".9" fill="none"/>`;
    if (role === 'egypt') s += `<path d="M36 ${eyeY} L32 ${eyeY + 1}" stroke="#1a1a2a" stroke-width="1.2"/><path d="M64 ${eyeY} L68 ${eyeY + 1}" stroke="#1a1a2a" stroke-width="1.2"/>`;
    // 코·입
    s += `<path d="M50 ${eyeY + 1} Q${47.5 - r() * 1.5} ${eyeY + 10} 50 ${eyeY + 12} Q52 ${eyeY + 12.5} 53 ${eyeY + 11}" stroke="#00000055" stroke-width="1.2" fill="none"/>`;
    const mouthY = eyeY + 18;
    // 수염
    const beard = !['woman', 'egypt'].includes(role);
    if (beard) {
      const len = 8 + r() * 10 + (old ? 6 : 0) + (role === 'prophet' ? 5 : 0);
      s += `<path d="M${50 - faceW + 1} 58 Q${50 - faceW + 1} ${mouthY + len} 50 ${mouthY + len + 2} Q${50 + faceW - 1} ${mouthY + len} ${50 + faceW - 1} 58 Q${50 + faceW - 5} ${mouthY - 2} 50 ${mouthY - 3} Q${50 - faceW + 5} ${mouthY - 2} ${50 - faceW + 1} 58 Z" fill="${hairC}"/>
<path d="M44 ${mouthY - 4} Q50 ${mouthY - 7} 56 ${mouthY - 4}" stroke="${hairC}" stroke-width="3" fill="none"/>`;
      s += `<path d="M46 ${mouthY} Q50 ${mouthY + 1.2} 54 ${mouthY}" stroke="#5a2c22" stroke-width="1.3" fill="none"/>`;
    } else {
      s += `<path d="M45.5 ${mouthY - 1} Q50 ${mouthY + 1.5} 54.5 ${mouthY - 1}" stroke="#8c3b35" stroke-width="1.8" fill="none"/>`;
      if (role === 'egypt') s += `<rect x="47.5" y="${mouthY + 3}" width="5" height="10" rx="1.5" fill="#2a2a3a"/>`;
    }
    // 머리 장식
    const T = 50 - faceW - 3, R = 50 + faceW + 3;
    switch (role) {
      case 'king':
        s += `<path d="M${T} 44 Q50 30 ${R} 44 L${R + 2} 70 L${R - 3} 70 L${R - 4} 48 Q50 40 ${T + 4} 48 L${T + 3} 70 L${T - 2} 70 Z" fill="#e8dcc0"/>
<path d="M${T + 1} 40 L${T + 4} 26 L${T + 10} 36 L50 22 L${R - 10} 36 L${R - 4} 26 L${R - 1} 40 Z" fill="#d9aa3c" stroke="#8a6412" stroke-width="1"/>
<circle cx="50" cy="33" r="2.4" fill="#b0413e"/>`; break;
      case 'philking': case 'phil':
        s += `<rect x="${T}" y="38" width="${R - T}" height="6" fill="#b58a3c"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${T + 2 + i * (R - T - 4) / 8} 39 L${T + 1 + i * (R - T - 4) / 8} 16 L${T + 5 + i * (R - T - 4) / 8} 16 L${T + 4 + i * (R - T - 4) / 8} 39 Z" fill="${i % 2 ? '#e7dfcf' : '#cfc3a8'}"/>`).join('')}
${role === 'philking' ? '<circle cx="50" cy="41" r="2.4" fill="#d9aa3c"/>' : ''}`; break;
      case 'warrior':
        s += `<path d="M${T} 50 Q${T} 24 50 23 Q${R} 24 ${R} 50 L${R - 3} 50 Q${R - 4} 38 50 37 Q${T + 4} 38 ${T + 3} 50 Z" fill="#b08d57" stroke="#6d5328" stroke-width="1"/>
<path d="M50 23 L50 37" stroke="#6d5328" stroke-width="1.5"/><path d="M${T} 50 L${T - 2} 64 L${T + 3} 60 Z" fill="#8a6d3f"/><path d="M${R} 50 L${R + 2} 64 L${R - 3} 60 Z" fill="#8a6d3f"/>`; break;
      case 'priest':
        s += `<path d="M${T + 1} 44 Q${T - 2} 22 50 20 Q${R + 2} 22 ${R - 1} 44 Q50 40 ${T + 1} 44 Z" fill="#f4f0e4" stroke="#cfc8b4"/>
<path d="M${T + 2} 32 Q50 27 ${R - 2} 32" stroke="#dcd5c2" stroke-width="1.2" fill="none"/><rect x="42" y="37" width="16" height="5" rx="1" fill="#d9aa3c"/>`; break;
      case 'prophet':
        s += `<path d="M${T - 4} 80 Q${T - 8} 30 50 22 Q${R + 8} 30 ${R + 4} 80 L${R - 1} 80 Q${R} 44 50 38 Q${T} 44 ${T + 1} 80 Z" fill="#5d4630"/>
<path d="M${T - 2} 60 Q${T - 3} 36 50 28" stroke="#3e2e1e" stroke-width="1.2" fill="none"/>`; break;
      case 'egypt':
        s += `<path d="M${T - 1} 50 Q${T - 1} 26 50 25 Q${R + 1} 26 ${R + 1} 50 L${R + 6} 86 L${R - 4} 86 L${R - 3} 52 Q50 44 ${T + 3} 52 L${T + 4} 86 L${T - 6} 86 Z" fill="#e2c255"/>
${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${T - 3 - i * 0.3} ${56 + i * 5} L${T + 4} ${56 + i * 5} M${R - 4} ${56 + i * 5} L${R + 3 + i * 0.3} ${56 + i * 5}" stroke="#2f4f8a" stroke-width="2.4"/>`).join('')}
${[0, 1, 2, 3].map(i => `<path d="M${T + 2} ${32 + i * 5} Q50 ${27 + i * 5} ${R - 2} ${32 + i * 5}" stroke="#2f4f8a" stroke-width="2" fill="none"/>`).join('')}
<path d="M47 28 Q50 18 53 28" fill="#d9aa3c" stroke="#8a6412"/>`; break;
      case 'woman':
        s += `<path d="M${T - 3} 84 Q${T - 8} 28 50 24 Q${R + 8} 28 ${R + 3} 84 L${R - 2} 84 Q${R + 1} 46 50 40 Q${T - 1} 46 ${T + 2} 84 Z" fill="#b23b3e"/>
<path d="M${T} 44 Q50 32 ${R} 44" stroke="#d9aa3c" stroke-width="1.6" fill="none"/><circle cx="${50 - faceW}" cy="66" r="1.8" fill="#d9aa3c"/><circle cx="${50 + faceW}" cy="66" r="1.8" fill="#d9aa3c"/>`; break;
      default: // elder: 줄무늬 두건과 끈
        s += `<path d="M${T - 3} 78 Q${T - 7} 30 50 26 Q${R + 7} 30 ${R + 3} 78 L${R - 2} 78 Q${R} 46 50 42 Q${T} 46 ${T + 2} 78 Z" fill="#ddd3bd"/>
<path d="M${T - 3} 58 L${T + 2} 58 M${R - 2} 58 L${R + 3} 58 M${T - 4} 66 L${T + 2} 66 M${R - 2} 66 L${R + 4} 66" stroke="#9b3d33" stroke-width="1.6"/>
<path d="M${T} 42 Q50 34 ${R} 42" stroke="#2a2018" stroke-width="3" fill="none"/>`;
    }
    s += `<rect x=".75" y=".75" width="98.5" height="118.5" fill="none" stroke="#d7a93f" stroke-width="1.5" opacity=".7"/></svg>`;
    return s;
  }

  window.PORTRAIT = { portrait, roleOf };
})();
