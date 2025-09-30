@echo off
title Guest Check-in System - Server Stopper
color 0C

echo ================================================================
echo                 GUEST CHECK-IN SYSTEM STOPPER
echo ================================================================
echo.

echo [INFO] Stopping all Guest Check-in System servers...
echo.

:: Stop all Node.js processes
echo [INFO] Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

:: Stop any Vite processes
echo [INFO] Stopping Vite development servers...
for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq node.exe" /FO CSV ^| find "node.exe"') do (
    taskkill /PID %%i /F >nul 2>&1
)

:: Wait a moment
timeout /t 2 /nobreak >nul

echo.
echo ================================================================
echo [SUCCESS] All servers have been stopped!
echo ================================================================
echo.
echo [INFO] The following services have been terminated:
echo   - Backend API Server (Port 3000)
echo   - Frontend Dashboard (Port 3001)
echo   - All Node.js processes
echo   - All Vite development servers
echo.
echo [INFO] You can now safely restart the system using start-servers.bat
echo.
pause