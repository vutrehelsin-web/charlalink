@echo off
title Chat Privado - Servidor Publico (otra red)
echo ========================================
echo   Iniciando Chat Publico (otra red)...
echo ========================================
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo Instalando dependencias del proyecto...
    call npm install
    echo.
)

echo Iniciando servidor y tunel...
echo Esto puede tardar unos segundos...
echo.

start "Servidor Chat" cmd /k "cd /d "%~dp0" && node server.js"

timeout /t 3 /no-nul

echo Abriendo tunel con LocalTunnel...
lt --port 4000

pause
