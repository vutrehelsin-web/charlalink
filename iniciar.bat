@echo off
title Chat Privado - Servidor
echo ========================================
echo   Iniciando Chat Privado...
echo ========================================
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo Instalando dependencias...
    call npm install
    echo.
)

echo Iniciando servidor en puerto 4000...
echo Abre tu navegador en: http://localhost:4000
echo.
echo Para detener el servidor, presiona Ctrl+C
echo ========================================
echo.

node server.js

pause
