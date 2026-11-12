@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Vinyl needs Node.js 22 or newer for this one-time build.
  echo Install it from https://nodejs.org/ and run INSTALL_VINYL.bat again.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 goto failed
call npm run check
if errorlevel 1 goto failed
call npm run build:win
if errorlevel 1 goto failed
for /f "delims=" %%V in ('node -p "require('./package.json').version"') do set "VINYL_VERSION=%%V"
if not defined VINYL_VERSION goto failed
set "INSTALLER=dist\Vinyl-Setup-%VINYL_VERSION%.exe"
if not exist "%INSTALLER%" goto failed
start "" "%INSTALLER%"
echo Vinyl's installer has opened. Finish installing to get a desktop app icon.
exit /b 0
:failed
echo Vinyl could not build an installer. Review the error above.
pause
exit /b 1
