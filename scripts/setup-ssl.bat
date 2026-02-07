@echo off
chcp 65001 >nul
title Configurador SSL - Remote Desktop Web
color 0A
cls

:: Habilitar manejo de errores
setlocal EnableDelayedExpansion

echo ============================================
echo  🔒 CONFIGURADOR SSL - REMOTE DESKTOP WEB
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

echo [1/4] Verificando OpenSSL...

where openssl >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ OpenSSL no encontrado. Intentando instalar...
    echo ℹ️  Descargando OpenSSL...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://slproweb.com/download/Win64OpenSSL_Light-3_2_1.exe' -OutFile 'openssl-installer.exe'}" || (
        call :handle_error "Error descargando OpenSSL" 0
        goto :openssl_manual
    )
    echo ℹ️  Instalando OpenSSL...
    openssl-installer.exe /silent /verysilent /norestart || (
        call :handle_error "Error instalando OpenSSL" 0
        del openssl-installer.exe 2>nul
        goto :openssl_manual
    )
    del openssl-installer.exe 2>nul || call :handle_error "No se pudo eliminar el instalador de OpenSSL" 0
    echo ✅ OpenSSL instalado. Reinicia el script.
    pause
    exit /b
)

:openssl_manual
for /f "tokens=*" %%a in ('openssl version') do set OPENSSL_VERSION=%%a
echo ✅ OpenSSL encontrado: %OPENSSL_VERSION%

echo.
echo [2/4] Creando directorio para certificados...

cd /d "%~dp0.." || (
    call :handle_error "Error cambiando al directorio del proyecto" 1
)

if not exist "ssl" (
    mkdir ssl || (
        call :handle_error "Error creando directorio ssl" 1
    )
    echo ✅ Directorio ssl creado
) else (
    echo ℹ️  Directorio ssl ya existe
)

cd ssl || (
    call :handle_error "Error accediendo al directorio ssl" 1
)

echo.
echo [3/4] Generando certificado SSL autofirmado...

:: Verificar si ya existen certificados
if exist "cert.pem" (
    echo ⚠️  Ya existe un certificado. ¿Deseas sobrescribirlo?
    choice /C YN /M "Selecciona Y para sobrescribir o N para cancelar"
    if errorlevel 2 (
        echo ℹ️  Operación cancelada por el usuario
        goto :ssl_complete
    )
)

:: Generar clave privada
echo    → Generando clave privada (2048 bits)...
openssl genrsa -out key.pem 2048 2>nul || (
    call :handle_error "Error generando clave privada" 0
    goto :ssl_error
)

:: Generar CSR
echo    → Generando CSR...
openssl req -new -key key.pem -out csr.pem -subj "/C=US/ST=State/L=City/O=RemoteDesktopWeb/CN=localhost" 2>nul || (
    call :handle_error "Error generando CSR" 0
    del key.pem 2>nul
    goto :ssl_error
)

:: Generar certificado autofirmado
echo    → Generando certificado autofirmado (365 días)...
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem 2>nul || (
    call :handle_error "Error generando certificado" 0
    del key.pem 2>nul
    del csr.pem 2>nul
    goto :ssl_error
)

:: Limpiar archivos temporales
del csr.pem 2>nul || call :handle_error "No se pudo eliminar csr.pem" 0

:: Verificar archivos generados
if not exist "cert.pem" (
    call :handle_error "El archivo cert.pem no fue generado" 0
    goto :ssl_error
)
if not exist "key.pem" (
    call :handle_error "El archivo key.pem no fue generado" 0
    goto :ssl_error
)

echo ✅ Certificado SSL generado correctamente

echo.
echo [4/4] Configurando permisos...

:: Intentar establecer permisos (puede fallar en algunos sistemas)
icacls key.pem /inheritance:r /grant:r "%USERNAME%:R" 2>nul || (
    call :handle_error "No se pudieron establecer permisos en key.pem" 0
)
icacls cert.pem /inheritance:r /grant:r "%USERNAME%:R" 2>nul || (
    call :handle_error "No se pudieron establecer permisos en cert.pem" 0
)

:ssl_complete
echo.
echo ============================================
if %ERROR_COUNT% gtr 0 (
    echo  ⚠️  CONFIGURACIÓN SSL COMPLETADA CON ERRORES
    echo ============================================
    echo.
    echo Se encontraron %ERROR_COUNT% errores durante la configuración.
    echo Revisa los mensajes anteriores para mas detalles.
) else (
    echo  ✅ CONFIGURACIÓN SSL COMPLETADA EXITOSAMENTE
    echo ============================================
)
echo.
echo Archivos generados:
echo    📄 ssl/cert.pem - Certificado público
echo    🔑 ssl/key.pem  - Clave privada
echo.
echo ⚠️  IMPORTANTE:
echo    - Guarda estos archivos en un lugar seguro
echo    - No compartas key.pem con nadie
echo    - El certificado es autofirmado, los navegadores mostraran advertencia
echo.
echo Para usar el certificado en producción:
echo    1. Copia cert.pem y key.pem al servidor
echo    2. Configura las variables en server\.env:
echo       SSL_CERT_PATH=./ssl/cert.pem
echo       SSL_KEY_PATH=./ssl/key.pem
echo.
pause
exit /b 0

:ssl_error
echo.
echo ❌ Error generando certificado SSL
echo    Revisa los mensajes de error anteriores
echo.
pause
exit /b 1

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
    echo ⛔ Error crítico. Deteniendo configuración.
    pause
    exit /b 1
) else (
    echo ⚠️  Continuando con la configuración...
)
exit /b 0
