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

## 📦 Scripts Disponibles

```bash
# Instalación
npm run install:all          # Instala todas las dependencias

# Desarrollo
npm run dev                  # Inicia cliente y servidor en paralelo
npm run dev:server           # Solo servidor con nodemon
npm run dev:client           # Solo cliente React
python start_project.py      # Inicia con Python (VS Code)
python start_project.py -i   # Instala dependencias e inicia

# Producción
npm run build                # Compila cliente para producción
npm start                    # Inicia servidor con PM2
npm run stop                 # Detiene PM2
npm run restart              # Reinicia PM2

# Docker
npm run docker:up            # Levanta stack completo
npm run docker:down          # Detiene stack
npm run docker:logs          # Muestra logs
```


---

## 🐳 Docker

### Producción con Docker Compose

```yaml
# docker-compose.yml incluye:
# - Server Node.js optimizado
# - Variables de entorno configurables
# - Volúmenes persistentes para logs
# - Red bridge aislada
```

```bash
# Construir e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f server

# Detener
docker-compose down

# Actualizar
docker-compose pull
docker-compose up -d --build
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
