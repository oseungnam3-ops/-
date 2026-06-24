@echo off
title 목양온 로컬 웹 서버
echo =========================================================
echo   파주목양교회 목양온(MokyangOn) 로컬 웹 서버 구동기
echo =========================================================
echo.
echo   * 유튜브 동영상 플레이어 보안 이슈(오류 153)를 해결하기 위해
echo     윈도우 자체 파워쉘 기능으로 가벼운 로컬 웹 서버를 구동합니다.
echo   * 이 검은색 콘솔 창을 닫으면 로컬 서버가 종료됩니다.
echo.
echo   [안내] 자동으로 브라우저가 열리지 않으면 아래 주소를 
echo          주소창에 복사해서 접속해 주세요.
echo   ▶ 주소: http://localhost:8000/index.html
echo.
echo =========================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process 'http://localhost:8000/index.html'; $l = New-Object System.Net.HttpListener; $l.Prefixes.Add('http://localhost:8000/'); $l.Start(); while($l.IsListening){$c = $l.GetContext(); $req = $c.Request; $res = $c.Response; $p = Join-Path (Get-Location) $req.Url.LocalPath.TrimStart('/'); if(Test-Path $p -PathType Leaf){$b = [System.IO.File]::ReadAllBytes($p); $res.ContentLength64 = $b.Length; $res.OutputStream.Write($b, 0, $b.Length)}else{$res.StatusCode = 404}; $res.Close()}"
pause
