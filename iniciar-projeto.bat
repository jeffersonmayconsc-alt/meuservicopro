@echo off
setlocal

cd /d "%~dp0"

if not exist "node_modules" (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo.
    echo Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando Meu Servico Online...
echo Abra no navegador: http://127.0.0.1:5173
echo.

call npm run dev -- --host 127.0.0.1

pause
