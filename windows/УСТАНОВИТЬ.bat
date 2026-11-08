@echo off
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1" -Mode Install
set "YMC_EXIT=%ERRORLEVEL%"
pause
exit /b %YMC_EXIT%
