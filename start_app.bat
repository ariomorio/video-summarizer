@echo off
echo Starting AI Video Summarizer...
echo.

cd /d "%~dp0"

echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Launching application...
echo Your browser will open automatically when ready.
echo.

start "" "http://localhost:3000"
call npm run dev

pause
