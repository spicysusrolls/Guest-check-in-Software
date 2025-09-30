@echo off
title Guest Check-in System - Backend Only
color 0E

echo ================================================================
echo            GUEST CHECK-IN SYSTEM - BACKEND DEVELOPMENT
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

echo [INFO] Node.js version: 
node --version

echo.
echo [INFO] Starting BACKEND SERVER ONLY for development...
echo.

:: Kill any existing backend processes
echo [INFO] Stopping existing backend processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Ensure logs directory exists
if not exist "logs" mkdir logs

echo ================================================================
echo                      LOGGING INFORMATION
echo ================================================================
echo [LOGS] Server startup:    logs/server-startup.log
echo [LOGS] Server errors:     logs/server-errors.log  
echo [LOGS] Webhook activity:  logs/webhooks.log
echo [LOGS] Integration logs:  logs/integrations.log
echo [LOGS] Guest activities:  logs/guest-activities.log
echo ================================================================
echo.

:: Show environment status
echo [ENV] Checking environment configuration...
if exist ".env" (
    echo ✅ Environment file found
) else (
    echo ⚠️  No .env file found - using defaults
)

echo.
echo [INFO] Starting backend API server on port 3000...
echo [INFO] API Endpoints will be available at:
echo   - Health Check: http://localhost:3000/health
echo   - Guest API:    http://localhost:3000/api/guests
echo   - Admin API:    http://localhost:3000/api/admin
echo   - JotForm Hook: http://localhost:3000/api/webhooks/jotform
echo.
echo [INFO] Press Ctrl+C to stop the server
echo ================================================================
echo.

cd /d "%~dp0"

:: Start server with npm for proper dev environment
npm run dev

echo.
echo ================================================================
echo [INFO] Backend server stopped.
echo [INFO] Check logs/ directory for detailed information.
echo [INFO] To start the full system (backend + frontend):
echo        Run start-servers.bat instead
echo ================================================================
echo.
pause