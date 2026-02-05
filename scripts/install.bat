@echo off
chcp 65001 >nul
title Instalador Remote Desktop Web
color 0A
cls

echo ============================================
echo  🖥️  INSTALADOR REMOTE DESKTOP WEB
echo ============================================
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Este script necesita permisos de Administrador
    echo ℹ️  Ejecutando elevación de privilegios...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [1/5] Verificando Node.js...

where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js no encontrado. Descargando instalador...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile 'node-installer.msi'}"
    echo ℹ️  Instalando Node.js...
    msiexec /i node-installer.msi /quiet /norestart
    del node-installer.msi
    echo ✅ Node.js instalado. Reinicia el script.
    pause
    exit /b
)

for /f "tokens=*" %%a in ('node -v') do set NODE_VERSION=%%a
echo ✅ Node.js encontrado: %NODE_VERSION%

echo.
echo [2/5] Instalando dependencias globales...

call npm install -g node-gyp windows-build-tools --silent >nul 2>&1
call npm install -g nodemon --silent >nul 2>&1

echo ✅ Dependencias globales listas

echo.
echo [3/5] Instalando dependencias del proyecto...

cd /d "%~dp0.."

echo 📦 Instalando dependencias raíz...
call npm install

echo 📦 Instalando dependencias del servidor...
cd server
call npm install

echo 📦 Instalando dependencias del cliente...
cd ..\client
call npm install

cd ..

echo ✅ Todas las dependencias instaladas

echo.
echo [4/5] Configurando variables de entorno...

if not exist "server\.env" (
    copy "server\.env.example" "server\.env"
    echo ✅ Archivo .env del servidor creado
) else (
    echo ℹ️  .env del servidor ya existe
)

if not exist "client\.env" (
    copy "client\.env.example" "client\.env"
    echo ✅ Archivo .env del cliente creado
) else (
    echo ℹ️  .env del cliente ya existe
)

:: Generar JWT_SECRET aleatorio si no existe
powershell -Command "$envFile='server\.env'; $content=Get-Content $envFile -Raw; if (-not ($content -match 'JWT_SECRET')) { $secret=-join ((48..57) + (65..90) + (97..122) + (33,35,36,37,38,64) | Get-Random -Count 64 | ForEach-Object {[char]$_}); Add-Content $envFile ('JWT_SECRET=' + $secret); Write-Host '🔑 JWT_SECRET generado automáticamente' } else { Write-Host 'ℹ️  JWT_SECRET ya existe' }"

echo.
echo ============================================
echo  ✅ INSTALACIÓN COMPLETADA
echo ============================================
echo.
echo Próximos pasos:
echo 1. Edita server\.env y cambia ADMIN_PASSWORD
echo 2. Ejecuta: npm run dev
echo 3. Abre http://localhost:3000 en tu navegador
echo.
echo Para producción con Docker:
echo    docker-compose up -d
echo.
pause