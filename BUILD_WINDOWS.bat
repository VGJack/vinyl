@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
    echo Node.js 22 or later is required to build Vinyl.
    echo Install it from https://nodejs.org and then run this file again.
    pause
    exit /b 1
)
call npm install
if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection.
    pause
    exit /b 1
)
call npm run check
if errorlevel 1 (
    echo Source checks failed.
    pause
    exit /b 1
)
call npm run build:win
if errorlevel 1 (
    echo Installer build failed.
    pause
    exit /b 1
)
echo.
echo Vinyl's installer is in the dist directory.
for /f "delims=" %%V in ('node -p "require('./package.json').version"') do set "VINYL_VERSION=%%V"
echo Run Vinyl-Setup-%VINYL_VERSION%.exe to install with desktop and Start menu shortcuts.
pause
