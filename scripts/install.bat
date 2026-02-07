@echo off
chcp 65001 >nul
title Instalador Remote Desktop Web
color 0A
cls

:: Habilitar manejo de errores
setlocal EnableDelayedExpansion

echo ============================================
echo  🖥️  INSTALADOR REMOTE DESKTOP WEB
echo ============================================
echo.

:: Inicializar contador de errores
set "ERROR_COUNT=0"

:: Funcion para manejar errores
call :init_error_handler

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Este script necesita permisos de Administrador
    echo ℹ️  Ejecutando elevación de privilegios...
    powershell -Command "Start-Process '%~f0' -Verb RunAs" || (
        call :handle_error "No se pudo elevar privilegios" 1
    )
    exit /b
)


echo [1/5] Verificando Node.js...

where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js no encontrado. Descargando instalador...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile 'node-installer.msi'}" || (
        call :handle_error "Error descargando Node.js" 0
        goto :continue_node
    )
    echo ℹ️  Instalando Node.js...
    msiexec /i node-installer.msi /quiet /norestart || (
        call :handle_error "Error instalando Node.js" 0
        del node-installer.msi 2>nul
        goto :continue_node
    )
    del node-installer.msi 2>nul || call :handle_error "No se pudo eliminar el instalador" 0
    echo ✅ Node.js instalado. Reinicia el script.
    pause
    exit /b
)
:continue_node


for /f "tokens=*" %%a in ('node -v') do set NODE_VERSION=%%a
echo ✅ Node.js encontrado: %NODE_VERSION%

echo.
echo [2/5] Instalando dependencias globales...

call npm install -g node-gyp windows-build-tools --silent >nul 2>&1 || (
    call :handle_error "Error instalando windows-build-tools" 0
)
call npm install -g nodemon --silent >nul 2>&1 || (
    call :handle_error "Error instalando nodemon" 0
)

if %ERROR_COUNT% gtr 0 (
    echo ⚠️  Algunas dependencias globales tuvieron errores, continuando...
) else (
    echo ✅ Dependencias globales listas
)


echo.
echo [3/5] Instalando dependencias del proyecto...

cd /d "%~dp0.." || (
    call :handle_error "Error cambiando al directorio del proyecto" 1
)

echo 📦 Instalando dependencias raíz...
call npm install
if %ERRORLEVEL% neq 0 (
    call :handle_error "Error instalando dependencias raiz (codigo: %ERRORLEVEL%)" 0
)

echo 📦 Instalando dependencias del servidor...
cd server || (
    call :handle_error "Error accediendo a carpeta server" 1
)

:: Verificar si hay dependencias nativas que requieren compilacion
echo    → Verificando dependencias nativas...
findstr /M "robotjs" package.json >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    ⚠️  Se detecto robotjs (requiere Visual Studio Build Tools)
    echo    ℹ️  Si la instalacion falla, instala manualmente:
    echo       npm install --global windows-build-tools
    echo       o descarga desde: https://visualstudio.microsoft.com/visual-cpp-build-tools/
)

call npm install
set "SERVER_ERROR=%ERRORLEVEL%"
if %SERVER_ERROR% neq 0 (
    call :handle_error "Error instalando dependencias del servidor (codigo: %SERVER_ERROR%)" 0
    echo.
    echo ❌ ERROR CRITICO EN SERVER:
    echo    Es posible que falten Visual Studio Build Tools para compilar robotjs.
    echo.
    echo 🔧 Soluciones:
    echo    1. Instala Visual Studio Build Tools con C++ workload
    echo    2. O ejecuta: npm install --global windows-build-tools
    echo    3. O usa Docker en lugar de instalacion nativa
    echo.
    cd ..
    goto :continue_deps
)

echo 📦 Instalando dependencias del cliente...
cd ..\client || (
    call :handle_error "Error accediendo a carpeta client" 0
    cd ..
    goto :continue_deps
)
call npm install
if %ERRORLEVEL% neq 0 (
    call :handle_error "Error instalando dependencias del cliente (codigo: %ERRORLEVEL%)" 0
)

cd .. || call :handle_error "Error regresando al directorio raiz" 0

:continue_deps
if %ERROR_COUNT% gtr 0 (
    echo.
    echo ⚠️  ALERTA: Se encontraron %ERROR_COUNT% errores durante la instalacion.
    echo    Revisa los mensajes anteriores para mas detalles.
    echo.
    echo ❗ Si el error fue en el servidor (robotjs/node-gyp):
    echo    - Necesitas instalar Visual Studio Build Tools
    echo    - O usar Docker: docker-compose up -d
) else (
    echo ✅ Todas las dependencias instaladas correctamente
)



echo.
echo [4/5] Configurando variables de entorno...

if not exist "server\.env.example" (
    call :handle_error "No se encuentra server\.env.example" 0
) else (
    if not exist "server\.env" (
        copy "server\.env.example" "server\.env" || (
            call :handle_error "Error copiando .env del servidor" 0
        )
        echo ✅ Archivo .env del servidor creado
    ) else (
        echo ℹ️  .env del servidor ya existe
    )
)

if not exist "client\.env.example" (
    call :handle_error "No se encuentra client\.env.example" 0
) else (
    if not exist "client\.env" (
        copy "client\.env.example" "client\.env" || (
            call :handle_error "Error copiando .env del cliente" 0
        )
        echo ✅ Archivo .env del cliente creado
    ) else (
        echo ℹ️  .env del cliente ya existe
    )
)

:: Generar JWT_SECRET aleatorio si no existe
powershell -Command "$envFile='server\.env'; if (Test-Path $envFile) { $content=Get-Content $envFile -Raw; if (-not ($content -match 'JWT_SECRET')) { $secret=-join ((48..57) + (65..90) + (97..122) + (33,35,36,37,38,64) | Get-Random -Count 64 | ForEach-Object {[char]$_}); Add-Content $envFile ('JWT_SECRET=' + $secret); Write-Host '🔑 JWT_SECRET generado automaticamente' } else { Write-Host 'ℹ️  JWT_SECRET ya existe' } } else { Write-Host '⚠️  No se encontro archivo .env' }" || (
    call :handle_error "Error generando JWT_SECRET" 0
)

echo.
echo ============================================
if %ERROR_COUNT% gtr 0 (
    echo  ⚠️  INSTALACIÓN COMPLETADA CON ERRORES
    echo ============================================
    echo.
    echo Se encontraron %ERROR_COUNT% errores durante la instalación.
    echo Revisa los mensajes anteriores para mas detalles.
) else (
    echo  ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE
    echo ============================================
)
echo.
echo Próximos pasos:
echo 1. Edita server\.env y cambia ADMIN_PASSWORD
echo 2. Ejecuta: npm run dev
echo 3. Abre http://localhost:3000 en tu navegador
echo.
echo Para producción con Docker:
echo    docker-compose up -d
echo.
echo ============================================
echo  PRESIONA ENTER PARA CERRAR ESTA VENTANA
echo ============================================
pause >nul

:: ============================================
:: FUNCIONES DE MANEJO DE ERRORES
:: ============================================


:init_error_handler
echo ℹ️  Manejador de errores inicializado
exit /b 0

:handle_error
echo.
echo ❌ ERROR: %~1
echo    Código de error: %ERRORLEVEL%
echo    Archivo: %~f0
echo    Línea aproximada: %~2
echo.
set /a ERROR_COUNT+=1
if "%~3"=="1" (
    echo ⛔ Error crítico. Deteniendo instalación.
    pause
    exit /b 1
) else (
    echo ⚠️  Continuando con la instalación...
)
exit /b 0
