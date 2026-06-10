@echo off
title Monalisa Flores - Servidor Local
echo ============================================
echo   Monalisa Flores - abrindo o site...
echo   Servidor: http://localhost:8765
echo   (Deixe esta janela ABERTA enquanto usa o site)
echo ============================================
echo.
start "" "http://localhost:8765"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0.claude\serve.ps1" -Port 8765
pause
