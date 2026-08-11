@echo off
cd /d "%~dp0"
echo Dang khoi dong Review AFS...
start "Review AFS Server" cmd /k npm run dev
timeout /t 6 /nobreak >nul
start http://localhost:3000
