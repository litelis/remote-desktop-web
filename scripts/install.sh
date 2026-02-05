#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  🖥️  INSTALADOR REMOTE DESKTOP WEB${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Detectar OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    INSTALL_CMD="sudo apt-get install -y"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    INSTALL_CMD="brew install"
else
    echo -e "${RED}❌ Sistema operativo no soportado${NC}"
    exit 1
fi

# Verificar Node.js
echo -e "${YELLOW}[1/5] Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no instalado. Instalando...${NC}"
    if [ "$OS" == "linux" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        brew install node@20
    fi
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js encontrado: $NODE_VERSION${NC}"

# Verificar versión mínima
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}❌ Se requiere Node.js 18+. Versión actual: $NODE_VERSION${NC}"
    exit 1
fi

# Instalar dependencias del sistema
echo ""
echo -e "${YELLOW}[2/5] Instalando dependencias del sistema...${NC}"
if [ "$OS" == "linux" ]; then
    sudo apt-get update
    sudo apt-get install -y build-essential libx11-dev libxtst-dev libxt-dev libxinerama-dev
elif [ "$OS" == "mac" ]; then
    xcode-select --install 2>/dev/null || true
fi
echo -e "${GREEN}✅ Dependencias del sistema listas${NC}"

# Instalar dependencias del proyecto
echo ""
echo -e "${YELLOW}[3/5] Instalando dependencias del proyecto...${NC}"
cd "$(dirname "$0")/.."

echo -e "${BLUE}📦 Instalando dependencias raíz...${NC}"
npm install

echo -e "${BLUE}📦 Instalando dependencias del servidor...${NC}"
cd server
npm install

echo -e "${BLUE}📦 Instalando dependencias del cliente...${NC}"
cd ../client
npm install

cd ..
echo -e "${GREEN}✅ Todas las dependencias instaladas${NC}"

# Configurar entorno
echo ""
echo -e "${YELLOW}[4/5] Configurando variables de entorno...${NC}"

if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    echo -e "${GREEN}✅ Archivo .env del servidor creado${NC}"
else
    echo -e "${BLUE}ℹ️  .env del servidor ya existe${NC}"
fi

if [ ! -f "client/.env" ]; then
    cp client/.env.example client/.env
    echo -e "${GREEN}✅ Archivo .env del cliente creado${NC}"
else
    echo -e "${BLUE}ℹ️  .env del cliente ya existe${NC}"
fi

# Generar JWT_SECRET si no existe
if ! grep -q "JWT_SECRET" server/.env; then
    JWT_SECRET=$(openssl rand -base64 48 2>/dev/null || head -c 64 /dev/urandom | base64)
    echo "JWT_SECRET=$JWT_SECRET" >> server/.env
    echo -e "${GREEN}🔑 JWT_SECRET generado automáticamente${NC}"
else
    echo -e "${BLUE}ℹ️  JWT_SECRET ya existe${NC}"
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  ✅ INSTALACIÓN COMPLETADA${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Edita server/.env y cambia ADMIN_PASSWORD"
echo "2. Ejecuta: npm run dev"
echo "3. Abre http://localhost:3000 en tu navegador"
echo ""
echo "Para producción con Docker:"
echo "   docker-compose up -d"
echo ""