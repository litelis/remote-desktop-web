# 🖥️ Remote Desktop Web

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=flat&logo=windows&logoColor=white)](https://www.microsoft.com/windows)
[![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat&logo=linux&logoColor=black)](https://www.linux.org)
[![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)](https://www.apple.com/macos)

> **Control remoto de escritorio vía navegador web** - Accede y controla tu computadora desde cualquier lugar con conexión segura WebSocket.

![Demo](https://via.placeholder.com/800x450/2a5298/ffffff?text=Remote+Desktop+Web+Demo)

---

## ✨ Características

- 🔒 **Autenticación segura** con JWT y bcrypt
- 🖱️ **Control completo** (mouse, teclado, scroll) en tiempo real
- 📺 **Streaming de pantalla** optimizado (10-60 FPS configurable)
- 🌐 **WebSocket con reconexión automática** y fallback a polling
- 🔄 **Reinicio/apagado** del sistema remotamente
- 📊 **Monitoreo en tiempo real** (FPS, latencia, resolución)
- 🎚️ **Control de calidad** ajustable (20%-100%)
- 📱 **Responsive** - Funciona en desktop y tablets
- 🐳 **Dockerizado** - Fácil despliegue con Docker Compose
- 🚀 **Producción listo** - PM2, logs, rate limiting
- 🪟 **Windows nativo** - Soporte completo para Windows 10/11

---

## 🚀 Inicio Rápido (Windows)

### Opción 1: Instalación Automática (Recomendado)

```cmd
git clone https://github.com/litelis/remote-desktop-web.git
cd remote-desktop-web
scripts\install.bat

npm run dev
```

Abre tu navegador en `http://localhost:3000`

### Opción 2: Docker (Producción)

```cmd
docker-compose up -d
```

Accede a `http://localhost:8443`

### Opción 3: Instalación Manual

```cmd
# 1. Clonar repositorio
git clone https://github.com/litelis/remote-desktop-web.git
cd remote-desktop-web

# 2. Instalar dependencias
npm run install:all


# 3. Configurar variables de entorno
copy server\.env.example server\.env
copy client\.env.example client\.env

# 4. Editar contraseña en server\.env
notepad server\.env

# 5. Iniciar en modo desarrollo
npm run dev
```

### Opción 4: Python desde VS Code (Recomendado para desarrollo)

```cmd
# 1. Clonar repositorio
git clone https://github.com/litelis/remote-desktop-web.git
cd remote-desktop-web


# 2. Iniciar con Python (instala dependencias automáticamente)
python start_project.py --install
```

**Ventajas de usar Python:**
- ✅ Verificación automática de prerrequisitos (Node.js, npm)
- ✅ Instalación automática de dependencias
- ✅ Output coloreado y organizado por servicio
- ✅ Manejo graceful de interrupciones (Ctrl+C)
- ✅ Ideal para desarrollo en VS Code

**Requisitos:** Python 3.6+ (incluido en la mayoría de sistemas modernos)

---

## 📋 Requisitos del Sistema


| Sistema | Requisitos |
|---------|-----------|
| **Windows** | Windows 10/11 (64 bits), Node.js 18+, Permisos de Administrador |
| **Linux** | Ubuntu 20.04+, libx11-dev, libxtst-dev |
| **macOS** | macOS 12+, Xcode Command Line Tools |

### Windows Específico

- ✅ **Node.js 18+** ([Descargar](https://nodejs.org))
- ✅ **Windows Build Tools** (se instalan automáticamente)
- ✅ **Permisos de Administrador** (para control de sistema)
- ⚠️ **Windows Defender**: Agregar excepción para la carpeta del proyecto
- ⚠️ **Firewall**: Permitir acceso Node.js en redes privadas

---

## 📁 Estructura del Proyecto

```
remote-desktop-web/
├── 📁 server/                 # Backend Node.js
│   ├── 📁 src/
│   │   ├── 📁 config/         # Configuración JWT
│   │   ├── 📁 middleware/     # Auth, rate limiting
│   │   ├── 📁 routes/         # API endpoints
│   │   ├── 📁 services/       # Screen capture, input control
│   │   ├── 📁 utils/          # Logger, helpers
│   │   └── index.js           # Entry point
│   ├── ecosystem.config.js    # PM2 configuration
│   └── package.json
│
├── 📁 client/                 # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 components/     # Login, DesktopViewer, ControlBar
│   │   ├── 📁 hooks/          # Custom React hooks
│   │   ├── 📁 styles/         # CSS global
│   │   ├── App.jsx            # Main component
│   │   └── index.js           # React entry
│   └── package.json
│
├── 📁 scripts/                # Scripts de instalación
│   ├── install.bat            # Windows installer
│   └── install.sh             # Linux/Mac installer
│
├── docker-compose.yml         # Docker orchestration
├── package.json               # Root package.json
├── start_project.py           # 🐍 Script Python para VS Code
└── README.md                  # This file


```

---

## 🔧 Configuración

### Variables de Entorno (Server)

Crea `server/.env` basado en `server/.env.example`:

```env
# Puerto del servidor (cambiar si está en uso)
PORT=8443

# ⚠️ OBLIGATORIO: Cambiar en producción
ADMIN_PASSWORD=tu_contraseña_segura_aqui

# Clave secreta JWT (mínimo 32 caracteres)
JWT_SECRET=super-secret-key-cambiar-en-produccion-123456789

# Entorno: development | production
NODE_ENV=development

# URL del frontend (para CORS)
CORS_ORIGIN=http://localhost:3000

# Rate limiting (15 minutos = 900000ms)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=5
```

### Variables de Entorno (Client)

Crea `client/.env` basado en `client/.env.example`:

```env
REACT_APP_API_URL=http://localhost:8443
REACT_APP_WS_URL=ws://localhost:8443
```

---

## 🎮 Uso

### Interfaz de Login

1. Accede a `http://localhost:3000`
2. Ingresa la contraseña configurada en `ADMIN_PASSWORD`
3. Haz clic en "Acceder al Sistema"

### Control Remoto

| Acción | Descripción |
|--------|-------------|
| **Mover mouse** | Mueve el cursor en la pantalla remota |
| **Click izquierdo** | Clic normal |
| **Click derecho** | Menú contextual (desactivado en canvas) |
| **Scroll** | Rueda del mouse para scroll vertical/horizontal |
| **Teclado** | Todas las teclas incluyendo atajos (Ctrl+C, Alt+Tab, etc.) |
| **Calidad** | Slider para ajustar calidad vs velocidad |
| **Reiniciar** | Botón rojo para reiniciar el sistema remoto |
| **Apagar** | Botón naranja para apagar el sistema |

### Atajos de Teclado Soportados

- `Ctrl + C / V / X` - Copiar, pegar, cortar
- `Alt + Tab` - Cambiar ventanas
- `Windows / Meta` - Tecla Inicio
- `F1-F12` - Teclas de función
- `Ctrl + Alt + Del` - Comando especial (puede requerir permisos)

---


## 📚 Tutorial Completo de Uso de Scripts

Esta sección explica en detalle todas las opciones disponibles para ejecutar el proyecto.

### 🪟 Scripts Batch (Windows)

#### `scripts\install.bat` - Instalador Automático

**Uso básico:**
```cmd
scripts\install.bat
```

**Qué hace:**
1. Verifica permisos de administrador (eleva automáticamente si es necesario)
2. Comprueba Node.js (lo descarga e instala si falta)
3. Instala dependencias globales (node-gyp, windows-build-tools, nodemon)
4. Instala dependencias del proyecto (raíz, server, client)
5. Configura archivos `.env` automáticamente
6. Genera JWT_SECRET aleatorio

**Manejo de errores:**
- Si falla la instalación del servidor (robotjs/node-gyp), muestra soluciones específicas
- Continúa con la instalación incluso si hay errores menores
- Al final muestra resumen de errores encontrados
- **No se cierra solo**: Espera que presiones ENTER para ver los mensajes

**Solución de problemas comunes:**
```cmd
# Si falla robotjs por falta de Visual Studio Build Tools:
npm install --global windows-build-tools

# O instala manualmente desde:
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

---

#### `scripts\setup-ssl.bat` - Configurador de Certificados SSL

**Uso básico:**
```cmd
scripts\setup-ssl.bat
```

**Qué hace:**
1. Verifica/instala OpenSSL
2. Crea directorio `ssl/`
3. Genera certificado autofirmado (válido 365 días)
4. Configura permisos de seguridad

**Archivos generados:**
- `ssl/cert.pem` - Certificado público
- `ssl/key.pem` - Clave privada (¡mantener segura!)

**Uso en producción:**
Edita `server/.env`:
```env
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem
HTTPS_ENABLED=true
```

**⚠️ Advertencia:** Los navegadores mostrarán advertencia de seguridad con certificados autofirmados. Para producción, usa certificados de Let's Encrypt o similar.

---

### 🐍 Scripts Python (Cross-Platform)

#### `start_project.py` - Lanzador de Desarrollo

**Opciones disponibles:**

| Opción | Descripción | Ejemplo |
|--------|-------------|---------|
| *(sin opciones)* | Inicia el proyecto (verifica dependencias primero) | `python start_project.py` |
| `-i`, `--install` | Instala dependencias antes de iniciar | `python start_project.py -i` |
| `--check-only` | Solo verifica prerrequisitos, no inicia | `python start_project.py --check-only` |
| `--debug` | Muestra información detallada de errores | `python start_project.py --debug` |

**Ejemplos de uso:**

```cmd
# Inicio normal (recomendado para uso diario)
python start_project.py

# Primera instalación o después de limpiar node_modules
python start_project.py --install

# Verificar que todo está instalado correctamente
python start_project.py --check-only

# Depurar problemas (muestra tracebacks completos)
python start_project.py --debug

# Instalar y verificar en un solo comando
python start_project.py -i --check-only
```

**Características:**
- ✅ Output coloreado por servicio (SERVER en verde, CLIENT en cyan)
- ✅ Verifica Node.js, npm y Python automáticamente
- ✅ Manejo graceful de Ctrl+C (detiene ambos servicios limpiamente)
- ✅ Muestra URLs de acceso al iniciar
- ✅ No se detiene ante errores menores (intenta continuar)

---

#### `update.py` - Actualizador desde GitHub

**Opciones disponibles:**

| Opción | Descripción | Ejemplo |
|--------|-------------|---------|
| *(sin opciones)* | Verifica y pregunta para actualizar | `python update.py` |
| `-f`, `--force` | Actualiza sin preguntar (silencioso) | `python update.py --force` |
| `-c`, `--check` | Solo verifica, no actualiza | `python update.py --check` |
| `--debug` | Muestra información detallada de errores | `python update.py --debug` |

**Ejemplos de uso:**

```cmd
# Verificar si hay actualizaciones (solo consulta)
python update.py --check

# Actualización interactiva normal (pregunta confirmación)
python update.py

# Actualización automática (ideal para scripts/Cron)
python update.py --force

# Verificar con información detallada de errores
python update.py --check --debug

# Forzar actualización y subir cambios locales
python update.py --force
```

**Flujo de trabajo:**
1. Consulta último commit en GitHub API
2. Compara con versión local (archivo `.version`)
3. Si hay diferencias, pregunta (o fuerza con `--force`)
4. Ejecuta `git pull` para descargar cambios
5. Realiza `git add`, `commit`, `push` automáticamente
6. Actualiza archivo `.version` con nuevo commit

**Archivos gestionados:**
- `.version` - Almacena hash del último commit (ignorado por git)

---

### 📊 Comparativa de Métodos de Inicio

| Método | Ideal para | Ventajas | Desventajas |
|--------|-----------|----------|-------------|
| `install.bat` | Primera instalación en Windows | Todo automático, configura .env | Requiere permisos admin, puede fallar robotjs |
| `start_project.py` | Desarrollo diario | Colores, manejo de errores, fácil debug | Requiere Python |
| `npm run dev` | Desarrollo estándar | Simple, sin dependencias extras | Output mezclado, menos manejo de errores |
| `docker-compose` | Producción/Servidores | Aislamiento, no requiere Node.js nativo | Más recursos, configuración extra |

---

### 🔄 Flujos de Trabajo Recomendados

#### **Primer uso (Windows):**
```cmd
git clone https://github.com/litelis/remote-desktop-web.git
cd remote-desktop-web
scripts\install.bat
python start_project.py
```

#### **Desarrollo diario:**
```cmd
python start_project.py
# O si hay problemas:
python start_project.py --debug
```

#### **Actualizar a última versión:**
```cmd
python update.py
# O automáticamente:
python update.py --force
```

#### **Solución de problemas:**
```cmd
# Verificar todo
python start_project.py --check-only

# Si hay errores, ver detalles
python start_project.py --debug

# Reinstalar todo
rmdir /s node_modules server\node_modules client\node_modules
python start_project.py --install
```

## 📦 Scripts NPM Disponibles

```bash
# Instalación
npm run install:all          # Instala todas las dependencias

# Desarrollo
npm run dev                  # Inicia cliente y servidor en paralelo
npm run dev:server           # Solo servidor con nodemon
npm run dev:client           # Solo cliente React

# Producción
npm run build                # Compila cliente para producción
npm start                    # Inicia servidor con PM2
npm run stop                 # Detiene PM2
npm run restart              # Reinicia PM2

# Docker
npm run docker:up            # Levanta stack completo
npm run docker:down          # Detiene stack
```



---


## 🐳 Docker - Tutorial Completo para Principiantes

Docker te permite ejecutar el proyecto sin instalar Node.js ni ninguna dependencia en tu computadora. Es ideal para producción o si tienes problemas con la instalación nativa.

---

### 📥 Paso 1: Instalar Docker

#### **Windows:**
1. Ve a [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Descarga **Docker Desktop for Windows**
3. Ejecuta el instalador (requiere reiniciar)
4. Abre Docker Desktop desde el menú Inicio
5. Espera a que diga "Docker Desktop is running" (puede tardar unos minutos la primera vez)

**Verificar instalación:**
```cmd
docker --version
```
Debe mostrar algo como: `Docker version 24.0.7, build afdd53b`

#### **Linux (Ubuntu/Debian):**
```bash
# Actualizar repositorios
sudo apt-get update

# Instalar dependencias
sudo apt-get install ca-certificates curl gnupg

# Añadir llave GPG oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Añadir repositorio
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar
docker --version
sudo docker run hello-world
```

#### **macOS:**
1. Descarga [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
2. Abre el archivo `.dmg` y arrastra Docker a Applications
3. Abre Docker Desktop desde Applications
4. Espera a que inicie completamente

---

### 🚀 Paso 2: Iniciar el Proyecto con Docker

#### **Opción A: Primera vez (construir e iniciar)**

```cmd
# 1. Clonar el repositorio (si no lo has hecho)
git clone https://github.com/litelis/remote-desktop-web.git
cd remote-desktop-web

# 2. Iniciar con Docker Compose
docker-compose up -d --build
```

**Qué hace este comando:**
- `-d` = Detached (corre en segundo plano, no bloquea la terminal)
- `--build` = Construye las imágenes la primera vez

**Verificar que está funcionando:**
```cmd
docker-compose ps
```
Debe mostrar el servicio `server` con estado `Up`

#### **Opción B: Si ya lo construiste antes (solo iniciar)**

```cmd
docker-compose up -d
```

---

### 🌐 Paso 3: Usar la Aplicación

Una vez iniciado, accede en tu navegador:

```
http://localhost:8443
```

**Credenciales por defecto:**
- Contraseña: `admin123` (cámbiala en producción)

---

### 📋 Comandos Esenciales de Docker

#### **Ver estado de los contenedores**
```cmd
docker-compose ps
```

#### **Ver logs (mensajes del servidor)**
```cmd
# Ver logs en tiempo real
docker-compose logs -f server

# Ver últimos 100 logs
docker-compose logs --tail=100 server

# Ver logs de todos los servicios
docker-compose logs
```

#### **Detener el proyecto**
```cmd
docker-compose down
```

#### **Reiniciar el proyecto**
```cmd
docker-compose restart
```

#### **Actualizar a nueva versión**
```cmd
# 1. Descargar cambios del código
git pull

# 2. Reconstruir con los cambios nuevos
docker-compose up -d --build

# O si solo cambió la imagen base:
docker-compose pull
docker-compose up -d
```

---

### 🔧 Paso 4: Configurar Variables de Entorno

Docker usa el archivo `server/.env`. Si no existe, créalo:

```cmd
# Windows
copy server\.env.example server\.env
notepad server\.env

# Linux/Mac
cp server/.env.example server/.env
nano server/.env
```

**Variables importantes para Docker:**
```env
PORT=8443
ADMIN_PASSWORD=tu_contraseña_segura
JWT_SECRET=una-clave-secreta-larga-de-64-caracteres-minimo
NODE_ENV=production
```

**Aplicar cambios:**
```cmd
docker-compose restart
```

---

### 💾 Paso 5: Persistencia de Datos

Docker guarda automáticamente:
- ✅ Logs en `server/logs/`
- ✅ Archivos de sesión

**No se pierden al reiniciar** gracias a los volúmenes configurados en `docker-compose.yml`.

---

### 🛠️ Solución de Problemas con Docker

#### **Error: "Docker daemon is not running"**
```cmd
# Windows/Mac: Abre Docker Desktop y espera a que inicie
# Linux:
sudo systemctl start docker
```

#### **Error: "Port 8443 is already allocated"**
```cmd
# Ver qué usa el puerto
netstat -ano | findstr :8443

# O cambia el puerto en docker-compose.yml
# ports:
#   - "8444:8443"  # Usa 8444 en tu máquina
```

#### **Error: "Cannot connect to the Docker daemon"**
```cmd
# Linux: Añade tu usuario al grupo docker
sudo usermod -aG docker $USER
# Cierra sesión y vuelve a entrar
```

#### **Limpiar todo y empezar de cero**
```cmd
# Detener y eliminar contenedores
docker-compose down

# Eliminar imágenes (opcional)
docker rmi remote-desktop-web_server

# Eliminar volúmenes (⚠️ pierdes logs)
docker volume prune

# Reconstruir desde cero
docker-compose up -d --build
```

#### **Ver uso de recursos**
```cmd
docker stats
```

---

### 📊 Comparativa: Docker vs Instalación Nativa

| Aspecto | Docker | Instalación Nativa |
|---------|--------|-------------------|
| **Instalación** | Solo instalar Docker | Instalar Node.js, Python, build tools |
| **Robotjs/errores nativos** | ✅ No hay problemas | ❌ Puede fallar la compilación |
| **Aislamiento** | ✅ Procesos aislados | ❌ En tu sistema directamente |
| **Recursos** | Usa más RAM (~200MB extra) | Más ligero |
| **Actualización** | `docker-compose up -d --build` | `git pull` + reinstalar dependencias |
| **Logs** | `docker-compose logs` | Archivos en `server/logs/` |
| **Ideal para** | Producción, principiantes | Desarrollo, debugging |

---

### 🎯 Flujo de Trabajo Recomendado con Docker

#### **Primera vez:**
```cmd
git clone https://github.com/litelis/remote-desktop-web.git
cd remote-desktop-web
docker-compose up -d --build
# Abre http://localhost:8443
```

#### **Uso diario:**
```cmd
# Ver que está corriendo
docker-compose ps

# Ver logs si hay problemas
docker-compose logs -f server

# Detener al terminar
docker-compose down
```

#### **Actualizar:**
```cmd
git pull
docker-compose up -d --build
```

#### **Backup de logs antes de limpiar:**
```cmd
# Copiar logs fuera del contenedor
docker cp remote-desktop-web_server_1:/app/logs ./backup-logs
docker-compose down
```

---

### 📚 Glosario Docker para Principiantes

| Término | Significado |
|---------|-------------|
| **Contenedor** | Una "caja" aislada que ejecuta tu aplicación |
| **Imagen** | La "plantilla" para crear contenedores |
| **Docker Compose** | Herramienta para manejar múltiples contenedores |
| **Volumen** | Carpeta compartida entre tu PC y el contenedor |
| **Puerto** | "Puerta" de comunicación (8443 en este proyecto) |
| **Logs** | Registro de mensajes y errores del programa |
| **Build** | Construir la imagen desde el código fuente |
| **Daemon** | El servicio de Docker que corre en segundo plano |

---

### ✅ Checklist de Verificación

Después de instalar, verifica que todo funciona:

- [ ] `docker --version` muestra la versión
- [ ] `docker-compose ps` muestra el servicio "Up"
- [ ] Acceder a `http://localhost:8443` muestra el login
- [ ] Puedes iniciar sesión con la contraseña
- [ ] `docker-compose logs` no muestra errores rojos
- [ ] Puedes detener con `docker-compose down` y reiniciar

---

### 🆘 ¿Necesitas más ayuda?

- 📖 [Documentación oficial de Docker](https://docs.docker.com/get-started/)
- 🐛 [GitHub Issues](https://github.com/litelis/remote-desktop-web/issues)
- 💬 Comando de diagnóstico completo:
```cmd
docker-compose ps && docker-compose logs --tail=50 server
```


---

## 🔒 Seguridad

| Característica | Implementación |
|---------------|----------------|
| **Autenticación** | JWT con expiración de 8 horas |
| **Contraseñas** | Hash bcrypt con salt |
| **Rate Limiting** | 5 intentos cada 15 minutos |
| **Headers HTTP** | Helmet.js con CSP |
| **CORS** | Origen específico configurable |
| **WebSocket** | Auth token en handshake |
| **Input Sanitization** | Sin ejecución de shell arbitrario |
| **Sesiones** | Una sesión activa por usuario |

### Recomendaciones Producción

- [ ] Cambiar `ADMIN_PASSWORD` por contraseña de 16+ caracteres
- [ ] Generar `JWT_SECRET` aleatorio de 64 caracteres
- [ ] Usar HTTPS/WSS con certificados válidos
- [ ] Configurar firewall (solo puerto 443/8443)
- [ ] Deshabilitar root login SSH
- [ ] Habilitar fail2ban
- [ ] Logs de auditoría regulares

---

## 🛠️ Solución de Problemas

### Error: "Cannot find module 'screenshot-desktop'"

```cmd
# Windows: Reinstalar build tools
npm install --global windows-build-tools
npm rebuild

# Linux: Instalar dependencias del sistema
sudo apt-get install libx11-dev libxtst-dev libxt-dev libxinerama-dev
```

### Error: "EACCES: permission denied" (Windows)

- Ejecutar CMD/PowerShell como **Administrador**
- Verificar permisos en carpeta: `icacls "C:\ruta\proyecto" /grant %username%:F`

### Error: "No se puede capturar la pantalla"

1. Windows: Verificar que no haya restricciones UAC
2. Desactivar modo seguro de pantalla completa en juegos
3. Ejecutar con privilegios de administrador

### WebSocket no conecta

- Verificar firewall de Windows
- Comprobar que `PORT` no esté en uso: `netstat -ano | findstr :8443`
- Revisar logs en `server/logs/`

### Latencia alta

- Reducir calidad de imagen (slider a 50%)
- Usar escala menor (0.5 en lugar de 0.8)
- Verificar conexión de red
- Cerrar aplicaciones que consuman ancho de banda

---

## 🏗️ Arquitectura

```
┌─────────────────┐     WebSocket/WSS      ┌─────────────────┐
│   Navegador     │ ◄────────────────────► │   Node.js       │
│   (React)       │   Auth JWT + Socket.io │   Server        │
│                 │                        │                 │
│  ┌───────────┐  │                        │  ┌───────────┐  │
│  │  Canvas   │  │ ◄── screen_frame ──────┤  │  Screen   │  │
│  │  (Render) │  │                        │  │  Capture  │  │
│  └───────────┘  │                        │  └───────────┘  │
│                 │ ─── mouse_move ───────►│                 │
│  ┌───────────┐  │ ─── mouse_click ──────►│  ┌───────────┐  │
│  │  Input    │  │ ─── key_press ────────►│  │   Input   │  │
│  │  Events   │  │                        │  │  Control  │  │
│  │  (Hooks)  │  │ ◄── session_terminated─┤  │ (nut.js)  │  │
│  └───────────┘  │                        │  └───────────┘  │
│                 │                        │                 │
└─────────────────┘                        │  ┌───────────┐  │
                                           │  │  System   │  │
                                           │  │  Control  │  │
                                           │  │ (shutdown)│  │
                                           │  └───────────┘  │
                                           └─────────────────┘
```

---

## 🤝 Contribución

1. Fork el repositorio
2. Crea tu feature branch (`git checkout -b feature/nueva-funcion`)
3. Commit tus cambios (`git commit -m 'Add: nueva función'`)
4. Push a la branch (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

### Estándares de Código

- ESLint + Prettier configurados
- Commits en español o inglés
- Testing antes de PR
- Documentar funciones nuevas

---

## 📝 Changelog

### v1.0.0 (2024-01-XX)
- ✨ Lanzamiento inicial
- 🖥️ Soporte Windows completo
- 🐳 Docker integration
- 🔒 Sistema de autenticación JWT
- 🎮 Control mouse/teclado en tiempo real

---

## ⚠️ Descargo de Responsabilidad

> **Este software está diseñado exclusivamente para acceso remoto autorizado a sistemas propios.** 

El uso no autorizado de sistemas informáticos es **ilegal** en la mayoría de jurisdicciones. El autor no se hace responsable de:

- Acceso no autorizado a terceros
- Pérdida de datos por reinicio/apagado remoto
- Uso malintencionado de la herramienta
- Daños directos o indirectos derivados del uso

**Úsalo bajo tu propia responsabilidad y siempre con permiso explícito del propietario del sistema.**

---

## 📞 Soporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/litelis/remote-desktop-web/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/litelis/remote-desktop-web/discussions)

---

<p align="center">
  Hecho con ❤️ y ☕ por <a href="https://github.com/litelis">@litelis</a>

</p>

<p align="center">
  <a href="https://github.com/litelis/remote-desktop-web/stargazers">⭐ Star este repo</a> si te fue útil

</p>
