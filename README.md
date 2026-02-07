# 🖥️ Remote Desktop Web

[![Node.js v20](https://img.shields.io/badge/node-v20.11.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=flat&logo=windows&logoColor=white)](https://www.microsoft.com/windows)

> **Control remoto de escritorio vía navegador web** - Accede y controla tu computadora desde cualquier lugar.

---

## 📑 Tabla de Contenidos

Haz clic en cualquier sección para navegar:

- [⚡ Inicio Rápido](#-inicio-rápido) - Empieza en 5 minutos
- [📋 Requisitos](#-requisitos) - Lo que necesitas instalar
- [🔧 Instalación](#-instalación) - 4 métodos diferentes
  - [Opción 1: Automática (Recomendada)](#opción-1-instalación-automática-recomendada)
  - [Opción 2: Docker](#opción-2-docker)
  - [Opción 3: Manual + VS Build Tools](#opción-3-instalación-manual-con-vs-build-tools)
  - [Opción 4: Python](#opción-4-python-vscode)
- [🚀 Uso](#-uso) - Cómo usar la aplicación
- [🐳 Docker](#-docker-guía) - Guía completa de Docker
- [📚 Scripts](#-scripts) - Documentación de scripts
- [❓ Solución de Problemas](#-solución-de-problemas)
- [👤 Creador](#-creador)

---

## ⚡ Inicio Rápido

**Recomendado para Windows (más fácil):**
```cmd
git clone https://github.com/litelis/remote-desktop-web.git
cd remote-desktop-web
scripts\install.bat
npm run dev
```

**O con Docker (sin instalar nada):**
```cmd
docker-compose up -d
```

Luego abre: `http://localhost:3000` (o `http://localhost:8443` para Docker)

---

## 📋 Requisitos

### ✅ Mínimos (Cualquier método)
- Windows 10/11 (64 bits) / Linux / macOS
- 4 GB RAM
- Conexión a internet

### 🔧 Para Instalación Nativa (Opción 1 y 3)
- **[Node.js v20.11.0 LTS](https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi)** ⬅️ **VERSIÓN RECOMENDADA**
- Git
- Permisos de Administrador

### 🐳 Para Docker (Opción 2)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

> ⚠️ **IMPORTANTE**: Usa **Node.js v20** (no v21+ ni v18). Las versiones más nuevas tienen problemas con robotjs.

---

## 🔧 Instalación

### Opción 1: Instalación Automática (Recomendada)

Todo automático, pero puede fallar si faltan Visual Studio Build Tools.

```cmd
git clone https://github.com/litelis/remote-desktop-web.git
cd remote-desktop-web
scripts\install.bat
npm run dev
```

**Si falla con errores de node-gyp/robotjs**, usa la [Opción 3](#opción-3-instalación-manual-con-vs-build-tools).

---

### Opción 2: Docker

**Ideal si no quieres instalar nada en tu sistema.**

```cmd
# 1. Instala Docker Desktop desde https://www.docker.com/products/docker-desktop
# 2. Ejecuta:
docker-compose up -d

# 3. Abre http://localhost:8443
```

**Comandos útiles:**
```cmd
docker-compose ps          # Ver estado
docker-compose logs -f     # Ver logs
docker-compose down        # Detener
```

📖 **[Guía completa de Docker →](#-docker-guía)**

---

### Opción 3: Instalación Manual con VS Build Tools

**Usa esta opción si la automática falló con errores de compilación.**

#### Paso 1: Instalar Node.js v20
1. Descarga: https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
2. Ejecuta el instalador (siguiente, siguiente, siguiente...)
3. Verifica: `node -v` debe mostrar `v20.11.0`

#### Paso 2: Instalar Visual Studio Build Tools (IMPORTANTE)

**Opción A: Visual Studio Community (Gratuito) - Recomendada**

1. Descarga: https://visualstudio.microsoft.com/vs/community/
2. Ejecuta el instalador `VisualStudioSetup.exe`
3. Selecciona: **"Desarrollo para el escritorio con C++"**
   
   ![C++ Workload](https://docs.microsoft.com/en-us/cpp/build/media/vscpp-build-tools-install.png)

4. En la pestaña "Componentes individuales", asegúrate de tener:
   - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
   - ✅ Windows 11 SDK (o Windows 10 SDK)
   - ✅ CMake tools para Windows

5. Haz clic en **Instalar** (ocupa ~7-10 GB)

**Opción B: Build Tools Ligero (Más rápido, menos espacio)**

1. Descarga: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Ejecuta `vs_buildtools.exe`
3. Selecciona: **"Herramientas de compilación de C++"**
4. Instala

#### Paso 3: Instalar el Proyecto

```cmd
# 1. Clonar
git clone https://github.com/litelis/remote-desktop-web.git
cd remote-desktop-web

# 2. Instalar dependencias raíz
npm install

# 3. Instalar dependencias del servidor
cd server
npm install
cd ..

# 4. Instalar dependencias del cliente
cd client
npm install
cd ..

# 5. Configurar variables de entorno
copy server\.env.example server\.env
copy client\.env.example client\.env

# 6. Editar contraseña (IMPORTANTE)
notepad server\.env
# Cambia: ADMIN_PASSWORD=admin123

# 7. Iniciar
npm run dev
```

Abre: `http://localhost:3000`

---

### Opción 4: Python (VS Code)

**Para desarrolladores que usan VS Code.**

```cmd
# 1. Clonar
git clone https://github.com/litelis/remote-desktop-web.git
cd remote-desktop-web

# 2. Iniciar (instala todo automáticamente)
python start_project.py --install
```

**Opciones disponibles:**
```cmd
python start_project.py              # Iniciar
python start_project.py --install    # Instalar e iniciar
python start_project.py --debug      # Modo debug
```

📖 **[Ver todos los scripts →](#-scripts)**

---

## 🚀 Uso

### Acceder
1. Abre `http://localhost:3000` (o `8443` para Docker)
2. Contraseña por defecto: `admin123`
3. ¡Empieza a controlar tu escritorio!

### Controles
| Acción | Cómo |
|--------|------|
| **Mouse** | Mueve el cursor, clic izquierdo/derecho |
| **Teclado** | Escribe normalmente, atajos funcionan (Ctrl+C, Alt+Tab) |
| **Scroll** | Rueda del mouse |
| **Calidad** | Slider para ajustar velocidad vs calidad |
| **Reiniciar/Apagar** | Botones rojo/naranja (requiere permisos) |

---

## 🐳 Docker Guía

### Instalar Docker
- **Windows/Mac**: https://www.docker.com/products/docker-desktop
- **Linux**: `sudo apt install docker.io docker-compose`

### Comandos esenciales
```cmd
# Iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Actualizar
git pull
docker-compose up -d --build
```

### Configurar
```cmd
copy server\.env.example server\.env
notepad server\.env
# Edita ADMIN_PASSWORD
docker-compose restart
```

---

## 📚 Scripts

### Python Scripts

| Script | Uso | Opciones |
|--------|-----|----------|
| `start_project.py` | Iniciar proyecto | `--install`, `--debug`, `--check-only` |
| `update.py` | Actualizar desde GitHub | `--force`, `--check`, `--debug` |

### Batch Scripts (Windows)

| Script | Descripción |
|--------|-------------|
| `scripts\install.bat` | Instalador automático |
| `scripts\setup-ssl.bat` | Generar certificados SSL |

### NPM Scripts

```cmd
npm run dev           # Iniciar desarrollo
npm run build         # Compilar producción
npm run docker:up     # Iniciar Docker
```

---

## ❓ Solución de Problemas

### "Error: Cannot find module 'robotjs'"
**Solución**: Instala [Visual Studio Build Tools](#paso-2-instalar-visual-studio-build-tools-importante)

### "node-gyp rebuild failed"
**Causa**: Faltan herramientas de compilación de C++
**Solución**: 
1. Usa Node.js v20 (no v21+)
2. Instala Visual Studio Community con "Desarrollo para el escritorio con C++"

### "EACCES: permission denied"
**Solución**: Ejecuta CMD como Administrador

### "Puerto 8443 en uso"
```cmd
# Windows
netstat -ano | findstr :8443
taskkill /PID <numero> /F

# O cambia el puerto en server\.env
PORT=8444
```

### Docker no inicia
```cmd
# Verificar que Docker Desktop esté abierto
docker --version

# Si da error en Linux:
sudo systemctl start docker
```

---

## 👤 Creador

**Desarrollado por:** [@litelis](https://github.com/litelis)

<p align="center">
  <a href="https://github.com/litelis/remote-desktop-web">⭐ Star este repo</a> si te fue útil
</p>

---

<p align="center">
  Hecho con ❤️ y ☕
</p>
