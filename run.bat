@echo off
title PEC AI Chatbot - Launcher
echo ====================================================
echo           Starting PEC AI Chatbot System
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Backend Server (Port 3001)...
start "PEC Bot - Backend Server" cmd /k "cd /d "%~dp0pec-bot-server" && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend Client (Port 5173)...
start "PEC Bot - Frontend Client" cmd /k "cd /d "%~dp0pec-bot-client" && npm run dev"

echo.
echo ====================================================
echo Both services are starting in separate windows:
echo   - Backend:  http://localhost:3001
echo   - Frontend: http://localhost:5173
echo ====================================================
echo.
pause
