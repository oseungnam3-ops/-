"""AI 음성 스튜디오 서버 — 무료 Microsoft Edge 신경망 음성(edge-tts)으로 대본을 mp3로 변환."""
import asyncio
import io
import re
import zipfile
from pathlib import Path

import edge_tts
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

STATIC = Path(__file__).parent / "static"
app = FastAPI(title="AI Voice Studio")

# 감정 프리셋: 무료 음성은 감정 모델이 없으므로 속도/음높이/볼륨으로 근사한다.
EMOTIONS = {
    "normal": dict(rate=0, pitch=0, volume=0),
    "happy": dict(rate=8, pitch=4, volume=5),
    "sad": dict(rate=-15, pitch=-4, volume=-10),
    "angry": dict(rate=10, pitch=-2, volume=20),
    "high": dict(rate=0, pitch=8, volume=0),
    "low": dict(rate=0, pitch=-8, volume=0),
    "whisper": dict(rate=-10, pitch=0, volume=-40),
}

FALLBACK_VOICES = [
    {"id": "ko-KR-SunHiNeural", "name": "선히", "gender": "Female", "locale": "ko-KR"},
    {"id": "ko-KR-InJoonNeural", "name": "인준", "gender": "Male", "locale": "ko-KR"},
    {"id": "ko-KR-HyunsuMultilingualNeural", "name": "현수", "gender": "Male", "locale": "ko-KR"},
]

# 24kHz/48kbps/mono MPEG-2 Layer III 무음 프레임 (24ms). edge-tts 기본 출력과 동일 규격이라 이어붙여도 안전.
SILENT_FRAME = bytes([0xFF, 0xF3, 0x64, 0xC0]) + bytes(140)
FRAME_MS = 24


def silence(ms: int) -> bytes:
    return SILENT_FRAME * max(0, round(ms / FRAME_MS))


def fmt(v: int, unit: str) -> str:
    return f"{v:+d}{unit}"


class Block(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice: str = "ko-KR-SunHiNeural"
    emotion: str = "normal"
    speed: float = Field(1.0, ge=0.5, le=2.0)


class Render(BaseModel):
    blocks: list[Block] = Field(min_length=1, max_length=200)
    pause_ms: int = Field(300, ge=0, le=5000)
    split: bool = False  # True면 블록별 mp3를 zip으로


VOICE_RE = re.compile(r"^[a-z]{2,3}-[A-Z]{2}-[A-Za-z0-9]+Neural$")




_audio_cache: dict[tuple, bytes] = {}


async def synth(b: Block) -> bytes:
    if not VOICE_RE.match(b.voice):
        raise HTTPException(400, "잘못된 음성 ID")
    emo = EMOTIONS.get(b.emotion, EMOTIONS["normal"])
    rate = round((b.speed - 1) * 100) + emo["rate"]
    key = (b.text, b.voice, rate, emo["pitch"], emo["volume"])
    if key in _audio_cache:
        return _audio_cache[key]
    comm = edge_tts.Communicate(
        b.text, b.voice,
        rate=fmt(max(-90, min(100, rate)), "%"),
        pitch=fmt(emo["pitch"], "Hz"),
        volume=fmt(emo["volume"], "%"),
    )
    buf = bytearray()
    try:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                buf += chunk["data"]
    except Exception as e:  # 네트워크/서비스 오류
        raise HTTPException(502, f"음성 합성 서버 오류: {e}")
    if not buf:
        raise HTTPException(502, "음성이 생성되지 않았습니다")
    if len(_audio_cache) > 300:
        _audio_cache.pop(next(iter(_audio_cache)))
    _audio_cache[key] = bytes(buf)
    return _audio_cache[key]


@app.get("/api/voices")
async def voices():
    try:
        raw = await edge_tts.list_voices()
    except Exception:
        return FALLBACK_VOICES
    out = []
    for v in raw:
        loc = v["Locale"]
        if loc.startswith(("ko", "en-US", "ja", "zh-CN")):
            name = v["ShortName"].split("-", 2)[2].replace("Neural", "")
            ko = {"SunHi": "선히", "InJoon": "인준", "HyunsuMultilingual": "현수"}
            out.append({"id": v["ShortName"], "name": ko.get(name, name),
                        "gender": v["Gender"], "locale": loc})
    out.sort(key=lambda x: (not x["locale"].startswith("ko"), x["locale"], x["name"]))
    return out


@app.post("/api/tts")
async def tts(b: Block):
    return Response(await synth(b), media_type="audio/mpeg")


@app.post("/api/render")
async def render(r: Render):
    sem = asyncio.Semaphore(4)

    async def one(b):
        async with sem:
            return await synth(b)

    parts = await asyncio.gather(*(one(b) for b in r.blocks))
    if r.split:
        z = io.BytesIO()
        with zipfile.ZipFile(z, "w") as zf:
            for i, p in enumerate(parts, 1):
                zf.writestr(f"{i:03d}.mp3", p)
        return Response(z.getvalue(), media_type="application/zip",
                        headers={"Content-Disposition": 'attachment; filename="voice.zip"'})
    gap = silence(r.pause_ms)
    return Response(gap.join(parts), media_type="audio/mpeg",
                    headers={"Content-Disposition": 'attachment; filename="voice.mp3"'})


@app.get("/")
async def index():
    return FileResponse(STATIC / "index.html")


app.mount("/", StaticFiles(directory=STATIC), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
