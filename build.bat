@echo off
chcp 65001 >nul
call npm install
if errorlevel 1 pause & exit /b 1
call npm run build
echo.
echo Готово! Установщик лежит в папке dist
explorer dist
pause
