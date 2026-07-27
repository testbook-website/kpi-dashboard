@echo off
title Team KPI Dashboard Launcher
color 0B
echo ==================================================
echo           TEAM KPI DASHBOARD STARTER
echo ==================================================
echo Starting local server for KPI Dashboard...
echo.

:: Check if node_modules exists
if not exist node_modules (
    echo First time setup: Installing required packages...
    npm install
    echo.
)

:: Start the server
echo Server is starting! Open your browser to http://localhost:3000
echo Keep this black window open while using the dashboard.
echo To stop the server, press Ctrl+C or close this window.
echo.
node local-server.js
pause
