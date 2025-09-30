@echo off
title Guest Check-in System - Server Launcher
color 0A

echo ================================================================
echo                 GUEST CHECK-IN SYSTEM LAUNCHER
echo ================================================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js detected: 
node --version

echo.
echo [INFO] Starting Guest Check-in System...
echo.

:: Kill any existing Node processes to avoid conflicts
echo [INFO] Stopping any existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

:: Start Backend Server
echo [INFO] Starting Backend Server (Port 3000)...
cd /d "%~dp0"
start "Backend API Server" cmd /k "echo [BACKEND] Starting API Server... && npm run dev"

:: Wait for backend to initialize
timeout /t 6 /nobreak >nul

:: Start Frontend Server  
echo [INFO] Starting Frontend Dashboard (Port 3001)...
cd /d "%~dp0frontend"
start "Frontend Dashboard" cmd /k "echo [FRONTEND] Starting Dashboard... && npx vite --host 127.0.0.1 --port 3001"

:: Wait for servers to start
timeout /t 8 /nobreak >nul

echo.
echo ================================================================
echo                      SYSTEM STATUS
echo ================================================================
echo [✓] Backend API Server:      http://localhost:3000
echo [✓] Frontend Dashboard:      http://127.0.0.1:3001  
echo [✓] Health Check:            http://localhost:3000/health
echo [✓] JotForm Webhook:         http://localhost:3000/api/webhooks/jotform
echo ================================================================
echo.
echo [INFO] Both servers are running in separate windows.
echo [INFO] Press any key to open the dashboard...
pause >nul

:: Open dashboard in default browser
echo [INFO] Opening Guest Check-in Dashboard...
start http://127.0.0.1:3001

echo.
echo ================================================================
echo [SUCCESS] Guest Check-in System is now running!
echo.
echo Backend Features:
echo   - Twilio SMS notifications
echo   - Google Sheets integration  
echo   - Slack notifications
echo   - JotForm webhook processing
echo   - Winston logging system
echo.
echo Dashboard Features:
echo   - Real-time guest statistics
echo   - Live check-in status
echo   - System integration monitoring
echo   - Auto-refresh functionality
echo ================================================================
echo.
echo [INFO] To stop servers: Close their respective windows
echo [INFO] To restart: Run this batch file again
echo.
pause