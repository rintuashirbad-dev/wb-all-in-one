@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo WB Ashirbad Portal - Local Test Launcher
echo ==============================================
where py >nul 2>nul
if errorlevel 1 (
  echo Python launcher not found. Install Python 3.10+ and enable Add Python to PATH.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  echo Creating virtual environment...
  py -3 -m venv .venv
  if errorlevel 1 goto failed
)
echo Installing/updating required packages...
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto failed
set /p ADMIN_PASSWORD=Create an admin password for this local test: 
if "%ADMIN_PASSWORD%"=="" (
  echo Password cannot be blank.
  goto failed
)
set ADMIN_USERNAME=admin
echo.
echo Starting portal. Keep this window open.
echo Open http://127.0.0.1:8000 in your browser.
echo Admin username: admin
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
exit /b 0
:failed
echo.
echo Setup failed. Check the error above, then try again.
pause
exit /b 1
