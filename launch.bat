@echo off
title Guest Check-in System - Master Launcher
color 0A

echo ================================================================
echo                 GUEST CHECK-IN SYSTEM
echo                   Master Launcher
echo ================================================================
echo.
echo Available Options:
echo.
echo [1] Start Full System (Backend + Frontend Dashboard)
echo [2] Start Backend Only (Development Mode)  
echo [3] Check System Status
echo [4] Stop All Servers
echo [5] Exit
echo.
echo ================================================================

:menu
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo Starting full system...
    call "scripts\start-servers.bat"
    goto menu
)
if "%choice%"=="2" (
    echo Starting backend only...
    call "scripts\start-server.bat"
    goto menu
)
if "%choice%"=="3" (
    echo Checking system status...
    call "scripts\check-status.bat"
    goto menu
)
if "%choice%"=="4" (
    echo Stopping all servers...
    call "scripts\stop-servers.bat"
    goto menu
)
if "%choice%"=="5" (
    echo Goodbye!
    exit
)

echo Invalid choice. Please enter 1-5.
goto menu