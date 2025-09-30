@echo off
title Guest Check-in System - Status Checker
color 0B

echo ================================================================
echo                 GUEST CHECK-IN SYSTEM STATUS
echo ================================================================
echo.

echo [INFO] Checking system status...
echo.

:: Check if Node.js processes are running
echo [PROCESS CHECK] Node.js processes:
tasklist /FI "IMAGENAME eq node.exe" /FO TABLE | findstr /V "INFO:"

echo.

:: Check port 3000 (Backend)
echo [PORT CHECK] Backend Server (Port 3000):
netstat -ano | findstr ":3000" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo ✅ Backend server is running on port 3000
) else (
    echo ❌ Backend server is NOT running on port 3000
)

echo.

:: Check port 3001 (Frontend)
echo [PORT CHECK] Frontend Dashboard (Port 3001):
netstat -ano | findstr ":3001" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo ✅ Frontend dashboard is running on port 3001
) else (
    echo ❌ Frontend dashboard is NOT running on port 3001
)

echo.

:: Test backend health endpoint
echo [HEALTH CHECK] Testing backend API...
powershell -command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/health' -TimeoutSec 5; Write-Host '✅ Backend API is healthy - Status:' $response.StatusCode -ForegroundColor Green } catch { Write-Host '❌ Backend API is not responding' -ForegroundColor Red }"

echo.

:: Test frontend
echo [HEALTH CHECK] Testing frontend dashboard...
powershell -command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:3001' -TimeoutSec 5; Write-Host '✅ Frontend dashboard is accessible - Status:' $response.StatusCode -ForegroundColor Green } catch { Write-Host '❌ Frontend dashboard is not accessible' -ForegroundColor Red }"

echo.
echo ================================================================
echo                      ACCESS URLS
echo ================================================================
echo Backend API:         http://localhost:3000
echo Frontend Dashboard:  http://127.0.0.1:3001
echo Health Check:        http://localhost:3000/health
echo JotForm Webhook:     http://localhost:3000/api/webhooks/jotform
echo ================================================================
echo.
pause