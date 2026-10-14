"""대본 → 모션 그래픽 mp4 자동 생성 (motion-studio 엔진 사용).

장면 = 대본의 문단 하나. 문단마다 캔버스 아트보드(.dc.html)를 자동으로 만들고,
scenes_auto.py 가 카메라 · 등장 · 전환 · 효과음을 얹어 굽는다. 나레이션은 선택(무료 edge-tts).
"""
import asyncio
import html
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import uuid
from pathlib import Path

HERE = Path(__file__).parent
JOBS = Path(os.environ.get("MOTION_JOBS", "/tmp/voice-studio-jobs"))
STATE: dict[str, dict] = {}

# 분위기: 배경(위→아래 그라데이션), 글자, 강조색, 배경음 무드, 키트
MOODS = {
    "pop":    dict(bg=("#1b1f3b", "#2d1b5e"), fg="#ffffff", acc="#ffd23f", dim="#b9b4e0", music="bouncy", kit="팝"),
    "calm":   dict(bg=("#f6efe3", "#ead9bd"), fg="#2b2118", acc="#d9622b", dim="#8a7b68", music="calm", kit="팝"),
    "fresh":  dict(bg=("#0f3d3e", "#126b60"), fg="#f4fffb", acc="#7dffc1", dim="#a9d9cc", music="groove", kit="팝"),
    "bold":   dict(bg=("#111111", "#1d1d1d"), fg="#ffffff", acc="#ff4d3d", dim="#9a9a9a", music="main", kit="팝"),
}
SIZES = {"sd": 2 / 3, "hd": 1.0}
RATIOS = {"9:16": (1080, 1920), "16:9": (1920, 1080), "1:1": (1080, 1080)}


def split_scenes(text: str) -> list[str]:
    """문단(줄)마다 한 장면. 너무 긴 문단은 문장 단위로 쪼갠다."""
    out = []
    for line in re.split(r"\n+", text.strip()):
        line = line.strip()
        if not line:
            continue
        if len(line) > 70:
            parts = re.findall(r"[^.!?。]+[.!?。]?", line)
            buf = ""
            for p in parts:
                if len(buf) + len(p) > 60 and buf:
                    out.append(buf.strip()); buf = ""
                buf += p
            if buf.strip():
                out.append(buf.strip())
        else:
            out.append(line)
    return out[:40]


def fit_size(text: str, box_w: float, box_h: float, s: float) -> int:
    for size in (116, 100, 88, 76, 66, 58):
        size_px = size * s
        per_line = max(1, int(box_w / (size_px * 0.92)))
        lines = sum(max(1, -(-len(seg) // per_line)) for seg in text.split("\n"))
        if lines * size_px * 1.3 <= box_h:
            return size
    return 52


def board_html(i: int, n: int, text: str, W: int, H: int, m: dict, s: float, ratio: str) -> str:
    vertical = H > W
    safe_l, safe_r = (60 * s, 200 * s) if vertical else (160 * s, 160 * s)
    top, bot = (300 * s, 480 * s) if vertical else (140 * s, 140 * s)
    box_w = W - safe_l - safe_r
    box_h = H - top - bot - 140 * s
    size = fit_size(text, box_w, box_h, s)
    fs = size * s
    lines = max(1, sum(max(1, -(-len(seg) // max(1, int(box_w / (fs * 0.92))))) for seg in text.split("\n")))
    th = lines * fs * 1.3
    ty = top + 110 * s + max(0, (box_h - th) / 2)
    esc = html.escape(text).replace("\n", "<br>")
    px = lambda v: f"{v:.0f}px"
    d = lambda role, style, inner="": f'<div data-role="{role}" style="position:absolute;{style}">{inner}</div>'
    r = 360 * s
    parts = [
        d("deco", f"left:{px(W - r * 0.7)};top:{px(-r * 0.4)};width:{px(r)};height:{px(r)};border-radius:{px(r)};background:{m['acc']};opacity:0.16"),
        d("deco", f"left:{px(-r * 0.5)};top:{px(H - r * 0.9)};width:{px(r * 1.1)};height:{px(r * 1.1)};border-radius:{px(r)};background:{m['dim']};opacity:0.12"),
        d("bar", f"left:{px(safe_l)};top:{px(ty - 56 * s)};width:{px(140 * s)};height:{px(14 * s)};border-radius:{px(7 * s)};background:{m['acc']}"),
        d("tag", f"left:{px(safe_l)};top:{px(top - 10 * s)};width:{px(box_w)};height:{px(60 * s)};font-size:{px(36 * s)};line-height:{px(60 * s)};font-weight:700;letter-spacing:{px(4 * s)};color:{m['dim']}",
          f"{i + 1:02d} / {n:02d}"),
        d("text", f"left:{px(safe_l)};top:{px(ty)};width:{px(box_w)};height:{px(th + fs)};font-size:{px(fs)};line-height:{px(fs * 1.3)};font-weight:700;color:{m['fg']};word-break:keep-all",
          esc),
    ]
    c1, c2 = m["bg"]
    return (f'<x-dc><div style="position:relative;width:{W}px;height:{H}px;background:linear-gradient(180deg,{c1} 0%,{c2} 100%);'
            f'font-family:Pretendard;color:{m["fg"]}">{"".join(parts)}</div></x-dc>')


async def _tts_all(scenes, voice, emotion, folder: Path):
    sys.path.insert(0, str(HERE.parent))
    import server  # synth 재사용(캐시 · 감정 프리셋)
    out = []
    for i, t in enumerate(scenes):
        mp3 = folder / f"{i + 1:02d}.mp3"
        data = await server.synth(server.Block(text=t, voice=voice, emotion=emotion))
        mp3.write_bytes(data)
        wav = folder / f"{i + 1:02d}.wav"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(mp3), "-ar", "44100", "-ac", "1", str(wav)], check=True)
        out.append(str(wav))
    return out


def build_project(work: Path, scenes: list[str], ratio: str, mood: str, size: str, voices: list[str] | None, bgm: bool):
    m = MOODS.get(mood, MOODS["pop"])
    W0, H0 = RATIOS.get(ratio, RATIOS["9:16"])
    s = SIZES.get(size, 2 / 3)
    W, H = int(W0 * s) // 2 * 2, int(H0 * s) // 2 * 2
    (work / "boards").mkdir(parents=True, exist_ok=True)
    proj = {"W": W, "H": H, "fps": 30, "kit": m["kit"], "mood_music": m["music"], "bgm": bgm, "scenes": []}
    for i, t in enumerate(scenes):
        (work / "boards" / f"Scene{i + 1:02d}.dc.html").write_text(board_html(i, len(scenes), t, W, H, m, s, ratio), encoding="utf-8")
        dur = max(2.8, len(re.sub(r"\s", "", t)) * 0.13 + 1.6)
        proj["scenes"].append({"text": t, "dur": round(dur, 2), "voice": (voices[i] if voices else None)})
    (work / "project.json").write_text(json.dumps(proj, ensure_ascii=False), encoding="utf-8")
    shutil.copy(HERE / "scenes_auto.py", work / "scenes_auto.py")
    return proj


def run_job(job_id: str, text: str, ratio="9:16", mood="pop", size="sd", narration=False,
            voice="ko-KR-SunHiNeural", emotion="normal", bgm=True):
    st = STATE[job_id]
    try:
        work = JOBS / job_id; work.mkdir(parents=True, exist_ok=True)
        scenes = split_scenes(text)
        if not scenes:
            raise ValueError("대본이 비어 있습니다")
        voices = None
        if narration:
            st.update(stage="나레이션 만드는 중", progress=0.05)
            (work / "voice").mkdir(exist_ok=True)
            voices = asyncio.run(_tts_all(scenes, voice, emotion, work / "voice"))
        st.update(stage="장면 디자인 중", progress=0.1)
        proj = build_project(work, scenes, ratio, mood, size, voices, bgm)
        env = dict(os.environ, MOTION_SKILL=str(HERE.parent.parent / "skills" / "motion-studio"))
        st.update(stage="영상 굽는 중", progress=0.15, scenes=len(scenes))
        p = subprocess.Popen([sys.executable, "scenes_auto.py", "--bake"], cwd=work, env=env,
                             stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        total = None
        log = []
        for line in p.stdout:
            log.append(line.rstrip())
            mm = re.search(r"(\d+)/(\d+) 프레임", line)
            if mm:
                st["progress"] = 0.15 + 0.8 * int(mm.group(1)) / int(mm.group(2))
        p.wait()
        out = work / "out" / "video.mp4"
        if p.returncode != 0 or not out.exists():
            raise RuntimeError("굽기 실패: " + "\n".join(log[-8:]))
        st.update(stage="완료", progress=1.0, done=True, file=str(out))
    except Exception as e:
        st.update(stage="오류", error=str(e), done=True)


def start(**kw) -> str:
    job_id = uuid.uuid4().hex[:10]
    STATE[job_id] = dict(stage="대기 중", progress=0.0, done=False)
    threading.Thread(target=run_job, args=(job_id,), kwargs=kw, daemon=True).start()
    return job_id
