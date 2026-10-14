#!/usr/bin/env python3
"""자동 장면 코드 — project.json(장면 · 비율 · 분위기)을 읽어 motion-studio 엔진으로 굽는다.
작업 폴더(= 이 파일이 복사된 곳)에서:  python3 scenes_auto.py --bake
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
SKILL = os.environ.get('MOTION_SKILL') or os.path.join(HERE, '..', '..', 'skills', 'motion-studio')
sys.path.insert(0, os.path.join(SKILL, 'scripts'))

from core import appear, audio, bake, camera, canvas, kit, motion   # noqa: E402
from core.ease import seg                                            # noqa: E402

P = json.load(open('project.json', encoding='utf-8'))
W, H, FPS = P['W'], P['H'], P.get('fps', 30)
N = len(P['scenes'])


def _len(p):
    try: return len(audio.read_wav(p)) / audio.SR
    except Exception: return 0


VOICE = {i: s['voice'] for i, s in enumerate(P['scenes']) if s.get('voice') and os.path.exists(s['voice'])}
VOFF = 0.3
DURS = [max(s['dur'], _len(VOICE[i]) + VOFF + 0.7) if i in VOICE else s['dur'] for i, s in enumerate(P['scenes'])]
STARTS = [sum(DURS[:i]) for i in range(N)]
SCENES = [(a, a + d) for a, d in zip(STARTS, DURS)]
DUR = SCENES[-1][1]
B = [canvas.read_board(os.path.join('boards', f'Scene{i + 1:02d}.dc.html')) for i in range(N)]
K = kit.load(P.get('kit', '팝'))


def _parts(els):
    d = {}
    for e in els: d.setdefault(e['data'].get('role', 'x'), []).append(e)
    return d


def scene(k, lt, root, els):
    """장면마다 찍는 법이 다르다 — 위치(훅 · 본문 · 마무리)와 순번으로 고른다"""
    r = _parts(els); img = canvas.background(root)
    for e in r.get('deco', []): appear.put(img, e, seg(lt, 0.0, 0.7), 'fade')
    for e in r.get('bar', []): appear.put(img, e, seg(lt, 0.15, 0.7), 'wipe', dir='left')
    for e in r.get('tag', []): appear.put(img, e, seg(lt, 0.3, 0.8), 'up', dist=30)
    txt = (r.get('text') or [None])[0]
    eff = P.get('effect', 'auto')   # 메뉴판에서 고른 글자 등장 효과
    how = eff if eff != 'auto' else (['lines', 'type', 'pop'][k % 3] if 0 < k < N - 1 else ('pop' if k == 0 else 'lines'))
    if txt is not None:
        if how == 'lines': appear.lines(img, txt, seg(lt, 0.35, 1.3))
        elif how == 'type': appear.type_text(img, txt, seg(lt, 0.35, 1.5))
        elif how == 'write': motion.write(img, txt, seg(lt, 0.3, 0.3 + min(5.0, 0.22 * len(txt['text'].replace(' ', '')) + 0.4)))   # 손글씨: 자모 획 순서대로
        else: appear.put(img, txt, seg(lt, 0.3, 0.9), 'pop')
        if k == N - 1 and lt > 1.2: motion.put(img, txt, s=motion.pulse(lt, 1.3))
    full = camera.full(img)
    if txt is None: return camera.shoot(img, full, (W, H))
    if k == 0:   c = camera.keys(lt, [(0, camera.on(txt, img, fill=1.5)), (1.0, full, '부드럽게')])
    elif k % 3 == 1: c = camera.keys(lt, [(0, camera.on(txt, img, fill=0.9)), (1.2, full, '부드럽게')])
    elif k % 3 == 2: c = camera.keys(lt, [(0, full), (1.4, camera.on(txt, img, fill=0.82), '부드럽게')])
    else: c = camera.keys(lt, [(0, camera.at(W / 2 + 80, H / 2, 1.12)), (1.5, full, '부드럽게')])
    return camera.shoot(img, camera.drift(c, max(0, lt - 1.2), DURS[k]), (W, H))


LEVELS = [3 if i == 0 else (2 if i == N - 1 else 1 + (i % 2)) for i in range(N)]
EDIT = K.cuts(LEVELS[1:])


def render(k, t, xf=0.0):
    root, els = B[k]; lt = t - STARTS[k] + (xf / 2 if k > 0 else 0)
    return scene(k, lt, root, els)


def frame(t):
    k = max(i for i, s in enumerate(STARTS) if s <= t + 1e-9)
    for j in (k, k + 1):
        if j in EDIT:
            name, xf, opt = EDIT[j]
            if abs(t - STARTS[j]) < xf / 2:
                a = render(j - 1, STARTS[j] - xf / 2, EDIT.get(j - 1, ('', 0))[1]); b_ = render(j, t, xf)
                return K.finish(K.edit(name, a, b_, (t - (STARTS[j] - xf / 2)) / xf, **opt), t)
    return K.finish(render(k, t, EDIT.get(k, ('', 0, {}))[1]), t)


def build_audio(path):
    import numpy as np
    rng = np.random.default_rng(7); sfx = audio.new_track(DUR)
    for j, (name, xf, _) in EDIT.items():
        if name == 'impact': audio.hit(sfx, rng, STARTS[j], 0.8)
        elif name != 'cut': audio._put(sfx, audio.whoosh(rng, max(0.3, xf), 0.45, 2400), STARTS[j] - xf / 2)
    bg = None
    if P.get('bgm', True):
        try:
            bg = audio.bgm([(0, 1.2, 'sting', {}), (1.2, DUR - 1.5, P.get('mood_music', 'bouncy'), {}), (DUR - 1.5, DUR, 'outro', {'hit': DUR - 1.0})], DUR, palette=K.music)
        except BaseException as e:   # 사운드폰트 · 배경음 도구가 없으면 배경음 없이
            print('배경음 없이 진행:', e)
    voices = [(STARTS[i] + VOFF, p) for i, p in VOICE.items()]
    return audio.mixdown(DUR, path, bg, sfx, voices)


if __name__ == '__main__':
    bake.cli(sys.modules[__name__], out='out/video.mp4', audio=build_audio)
