@echo off
title Team KPI Dashboard Launcher
color 0B
echo ==================================================
echo           TEAM KPI DASHBOARD STARTER
echo ==================================================
echo.
echo Starting the Node.js backend server...
start "KPI Dashboard Server" cmd /c "node server.js & pause"

echo Waiting for server to initialize...
timeout /t 3 /nobreak > nul

echo Launching your dashboard in the browser...
start http://localhost:3000
