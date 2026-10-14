# 빌드 컨텍스트 = 저장소 루트 (voice-studio + skills/motion-studio)
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY voice-studio/requirements.txt voice-studio/requirements.txt
RUN pip install --no-cache-dir -r voice-studio/requirements.txt
COPY voice-studio voice-studio
COPY skills skills
WORKDIR /app/voice-studio
CMD ["sh","-c","uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
