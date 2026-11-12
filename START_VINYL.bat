@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
    echo Node.js 22 or later is required to run the Vinyl prototype.
    echo Install it from https://nodejs.org and then run this file again.
    pause
    exit /b 1
)
if not exist "node_modules\electron" (
    echo Installing Vinyl's Chromium runtime and build dependencies...
    call npm install
    if errorlevel 1 (
        echo Installation failed. Check your connection and try again.
        pause
        exit /b 1
    )
)
call npm start
if errorlevel 1 pause
