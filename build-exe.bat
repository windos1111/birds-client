@echo off
setlocal
cd /d "%~dp0"
echo Building Birds Client Windows installer...
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install the LTS version from https://nodejs.org/ and reopen this window.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 goto failed
call npm run dist
if errorlevel 1 goto failed
echo.
echo Build complete. Check the dist folder for the Birds Client installer.
explorer "%~dp0dist"
pause
exit /b 0
:failed
echo.
echo Build failed. Check the error above.
pause
exit /b 1
