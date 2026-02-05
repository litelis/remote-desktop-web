#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 Remote Desktop Web - Project Launcher
Script de Python para iniciar el proyecto desde VS Code

Uso:
    python start_project.py
    python start_project.py --install  # Instalar dependencias primero
"""

import os
import sys
import subprocess
import argparse
import time
import signal
from pathlib import Path
from threading import Thread
import platform

# Colores para terminal
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    """Imprime banner de inicio"""
    banner = f"""
{Colors.CYAN}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════╗
║           🖥️  REMOTE DESKTOP WEB - PROJECT LAUNCHER           ║
║                                                              ║
║  Control remoto de escritorio vía navegador web             ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}
    """
    print(banner)

def check_prerequisites():
    """Verifica que Node.js y npm estén instalados"""
    print(f"{Colors.YELLOW}🔍 Verificando prerrequisitos...{Colors.ENDC}")
    
    # Verificar Node.js
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True, check=True)
        node_version = result.stdout.strip()
        print(f"{Colors.GREEN}✅ Node.js: {node_version}{Colors.ENDC}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print(f"{Colors.RED}❌ Node.js no está instalado{Colors.ENDC}")
        print(f"{Colors.YELLOW}   Descarga desde: https://nodejs.org/{Colors.ENDC}")
        return False
    
    # Verificar npm
    try:
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, text=True, check=True)
        npm_version = result.stdout.strip()
        print(f"{Colors.GREEN}✅ npm: v{npm_version}{Colors.ENDC}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print(f"{Colors.RED}❌ npm no está instalado{Colors.ENDC}")
        return False
    
    # Verificar Python
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print(f"{Colors.GREEN}✅ Python: v{python_version}{Colors.ENDC}")
    
    return True

def check_dependencies():
    """Verifica si las dependencias están instaladas"""
    root_node_modules = Path("node_modules").exists()
    server_node_modules = Path("server/node_modules").exists()
    client_node_modules = Path("client/node_modules").exists()
    
    return root_node_modules and server_node_modules and client_node_modules

def install_dependencies():
    """Instala todas las dependencias del proyecto"""
    print(f"\n{Colors.YELLOW}📦 Instalando dependencias...{Colors.ENDC}")
    print(f"{Colors.CYAN}   Esto puede tomar varios minutos...{Colors.ENDC}\n")
    
    try:
        # Instalar dependencias raíz
        print(f"{Colors.BLUE}   → Instalando dependencias raíz...{Colors.ENDC}")
        subprocess.run(['npm', 'install'], check=True, cwd=".")
        
        # Instalar dependencias server
        print(f"{Colors.BLUE}   → Instalando dependencias del servidor...{Colors.ENDC}")
        subprocess.run(['npm', 'install'], check=True, cwd="server")
        
        # Instalar dependencias client
        print(f"{Colors.BLUE}   → Instalando dependencias del cliente...{Colors.ENDC}")
        subprocess.run(['npm', 'install'], check=True, cwd="client")
        
        print(f"\n{Colors.GREEN}✅ Todas las dependencias instaladas correctamente{Colors.ENDC}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"\n{Colors.RED}❌ Error instalando dependencias: {e}{Colors.ENDC}")
        return False

def run_command(command, cwd, name, color):
    """Ejecuta un comando y muestra output con color"""
    process = subprocess.Popen(
        command,
        cwd=cwd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    
    prefix = f"{color}[{name}]{Colors.ENDC}"
    
    for line in process.stdout:
        line = line.rstrip()
        if line:
            print(f"{prefix} {line}")
    
    process.wait()
    return process.returncode

def start_services():
    """Inicia el servidor y cliente en paralelo"""
    print(f"\n{Colors.YELLOW}🚀 Iniciando servicios...{Colors.ENDC}\n")
    
    # Crear threads para cada servicio
    server_thread = Thread(
        target=run_command,
        args=(['npm', 'run', 'dev'], 'server', 'SERVER', Colors.GREEN)
    )
    
    client_thread = Thread(
        target=run_command,
        args=(['npm', 'start'], 'client', 'CLIENT', Colors.CYAN)
    )
    
    # Iniciar threads
    server_thread.daemon = True
    client_thread.daemon = True
    
    server_thread.start()
    time.sleep(2)  # Esperar 2 segundos para que el servidor inicie primero
    client_thread.start()
    
    print(f"\n{Colors.GREEN}{Colors.BOLD}✨ Servicios iniciados:{Colors.ENDC}")
    print(f"   {Colors.CYAN}→ Servidor: http://localhost:8443{Colors.ENDC}")
    print(f"   {Colors.CYAN}→ Cliente:  http://localhost:3000{Colors.ENDC}")
    print(f"\n{Colors.YELLOW}Presiona Ctrl+C para detener todos los servicios{Colors.ENDC}\n")
    
    try:
        # Mantener el script corriendo
        while server_thread.is_alive() or client_thread.is_alive():
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}🛑 Deteniendo servicios...{Colors.ENDC}")
        # Los threads daemon se cerrarán automáticamente
        time.sleep(1)
        print(f"{Colors.GREEN}✅ Servicios detenidos{Colors.ENDC}")

def setup_signal_handlers():
    """Configura handlers para señales"""
    def signal_handler(sig, frame):
        print(f"\n\n{Colors.YELLOW}🛑 Señal de interrupción recibida...{Colors.ENDC}")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    if platform.system() != 'Windows':
        signal.signal(signal.SIGTERM, signal_handler)

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(
        description='Inicia el proyecto Remote Desktop Web desde VS Code',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python start_project.py           # Iniciar proyecto
  python start_project.py --install # Instalar dependencias e iniciar
  python start_project.py -i        # Instalar dependencias e iniciar (corto)
        """
    )
    parser.add_argument(
        '-i', '--install',
        action='store_true',
        help='Instalar dependencias antes de iniciar'
    )
    parser.add_argument(
        '--check-only',
        action='store_true',
        help='Solo verificar prerrequisitos sin iniciar'
    )
    
    args = parser.parse_args()
    
    # Configurar handlers de señales
    setup_signal_handlers()
    
    # Imprimir banner
    print_banner()
    
    # Verificar prerrequisitos
    if not check_prerequisites():
        print(f"\n{Colors.RED}❌ Prerrequisitos no cumplidos. Abortando.{Colors.ENDC}")
        sys.exit(1)
    
    if args.check_only:
        print(f"\n{Colors.GREEN}✅ Todos los prerrequisitos están instalados{Colors.ENDC}")
        sys.exit(0)
    
    # Verificar/instalar dependencias
    if args.install or not check_dependencies():
        if not install_dependencies():
            print(f"\n{Colors.RED}❌ No se pudieron instalar las dependencias{Colors.ENDC}")
            sys.exit(1)
    else:
        print(f"{Colors.GREEN}✅ Dependencias ya instaladas{Colors.ENDC}")
    
    # Iniciar servicios
    start_services()

if __name__ == "__main__":
    main()
