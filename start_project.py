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
import traceback
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

# Contador de errores
ERROR_COUNT = 0

def log_error(message, exception=None, critical=False):
    """Log errors with detailed information"""
    global ERROR_COUNT
    ERROR_COUNT += 1
    
    print(f"\n{Colors.RED}{Colors.BOLD}❌ ERROR:{Colors.ENDC} {message}")
    
    if exception:
        print(f"{Colors.RED}   Detalles: {str(exception)}{Colors.ENDC}")
        if os.getenv('DEBUG'):
            print(f"{Colors.YELLOW}   Traceback:{Colors.ENDC}")
            traceback.print_exc()
    
    print(f"{Colors.CYAN}   Ubicación: {sys._getframe(1).f_code.co_name}{Colors.ENDC}")
    
    if critical:
        print(f"{Colors.RED}{Colors.BOLD}⛔ Error crítico. Deteniendo ejecución.{Colors.ENDC}")
        sys.exit(1)
    else:
        print(f"{Colors.YELLOW}⚠️  Continuando con la ejecución...{Colors.ENDC}\n")
    
    return False

def safe_run(command, cwd=None, shell=True, check=True, capture_output=True, error_msg=None):
    """Safely run a subprocess command with error handling"""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=shell,
            capture_output=capture_output,
            text=True,
            check=check
        )
        return result
    except subprocess.CalledProcessError as e:
        msg = error_msg or f"Error ejecutando: {' '.join(command) if isinstance(command, list) else command}"
        log_error(msg, e)
        return None
    except Exception as e:
        msg = error_msg or f"Excepción ejecutando: {' '.join(command) if isinstance(command, list) else command}"
        log_error(msg, e)
        return None


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
                              capture_output=True, text=True, check=True, shell=True)
        node_version = result.stdout.strip()
        print(f"{Colors.GREEN}✅ Node.js: {node_version}{Colors.ENDC}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print(f"{Colors.RED}❌ Node.js no está instalado{Colors.ENDC}")
        print(f"{Colors.YELLOW}   Descarga desde: https://nodejs.org/{Colors.ENDC}")
        return False

    
    # Verificar npm
    try:
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, text=True, check=True, shell=True)
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
    try:
        root_node_modules = Path("node_modules").exists()
        server_node_modules = Path("server/node_modules").exists()
        client_node_modules = Path("client/node_modules").exists()
        
        if not root_node_modules:
            log_error("No se encontraron dependencias raíz (node_modules)", critical=False)
        if not server_node_modules:
            log_error("No se encontraron dependencias del servidor", critical=False)
        if not client_node_modules:
            log_error("No se encontraron dependencias del cliente", critical=False)
        
        return root_node_modules and server_node_modules and client_node_modules
    except Exception as e:
        log_error("Error verificando dependencias", e)
        return False


def install_dependencies():
    """Instala todas las dependencias del proyecto"""
    print(f"\n{Colors.YELLOW}📦 Instalando dependencias...{Colors.ENDC}")
    print(f"{Colors.CYAN}   Esto puede tomar varios minutos...{Colors.ENDC}\n")
    
    success = True
    
    # Instalar dependencias raíz
    print(f"{Colors.BLUE}   → Instalando dependencias raíz...{Colors.ENDC}")
    result = safe_run(['npm', 'install'], cwd=".", error_msg="Error instalando dependencias raíz")
    if not result or result.returncode != 0:
        success = False
    
    # Instalar dependencias server
    print(f"{Colors.BLUE}   → Instalando dependencias del servidor...{Colors.ENDC}")
    result = safe_run(['npm', 'install'], cwd="server", error_msg="Error instalando dependencias del servidor")
    if not result or result.returncode != 0:
        success = False
    
    # Instalar dependencias client
    print(f"{Colors.BLUE}   → Instalando dependencias del cliente...{Colors.ENDC}")
    result = safe_run(['npm', 'install'], cwd="client", error_msg="Error instalando dependencias del cliente")
    if not result or result.returncode != 0:
        success = False
    
    if success:
        print(f"\n{Colors.GREEN}✅ Todas las dependencias instaladas correctamente{Colors.ENDC}")
        return True
    else:
        log_error("Algunas dependencias no se instalaron correctamente", critical=False)
        return False


def run_command(command, cwd, name, color):
    """Ejecuta un comando y muestra output con color"""
    try:
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
        
        try:
            for line in process.stdout:
                line = line.rstrip()
                if line:
                    print(f"{prefix} {line}")
        except Exception as e:
            log_error(f"Error leyendo output de {name}", e, critical=False)
        
        process.wait()
        
        if process.returncode != 0:
            log_error(f"El proceso {name} terminó con código {process.returncode}", critical=False)
        
        return process.returncode
        
    except Exception as e:
        log_error(f"No se pudo iniciar el proceso {name}", e, critical=False)
        return -1


def start_services():
    """Inicia el servidor y cliente en paralelo"""
    print(f"\n{Colors.YELLOW}🚀 Iniciando servicios...{Colors.ENDC}\n")
    
    server_thread = None
    client_thread = None
    
    try:
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
        
        # Mantener el script corriendo
        while (server_thread and server_thread.is_alive()) or (client_thread and client_thread.is_alive()):
            time.sleep(1)
            
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}🛑 Deteniendo servicios...{Colors.ENDC}")
        time.sleep(1)
        print(f"{Colors.GREEN}✅ Servicios detenidos{Colors.ENDC}")
    except Exception as e:
        log_error("Error en los servicios", e, critical=False)
        print(f"\n{Colors.RED}❌ Error ejecutando servicios. Revisa los errores anteriores.{Colors.ENDC}")


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
    global ERROR_COUNT
    
    parser = argparse.ArgumentParser(
        description='Inicia el proyecto Remote Desktop Web desde VS Code',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python start_project.py           # Iniciar proyecto
  python start_project.py --install # Instalar dependencias e iniciar
  python start_project.py -i        # Instalar dependencias e iniciar (corto)
  python start_project.py --debug   # Modo debug con información detallada de errores
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
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Mostrar información detallada de errores (traceback)'
    )
    
    args = parser.parse_args()
    
    # Habilitar modo debug si se solicita
    if args.debug:
        os.environ['DEBUG'] = '1'
        print(f"{Colors.CYAN}🐛 Modo DEBUG habilitado{Colors.ENDC}\n")
    
    try:
        # Configurar handlers de señales
        setup_signal_handlers()
        
        # Imprimir banner
        print_banner()
        
        # Verificar prerrequisitos
        if not check_prerequisites():
            print(f"\n{Colors.RED}❌ Prerrequisitos no cumplidos. Abortando.{Colors.ENDC}")
            if ERROR_COUNT > 0:
                print(f"{Colors.YELLOW}   Se encontraron {ERROR_COUNT} errores.{Colors.ENDC}")
            sys.exit(1)
        
        if args.check_only:
            if ERROR_COUNT == 0:
                print(f"\n{Colors.GREEN}✅ Todos los prerrequisitos están instalados{Colors.ENDC}")
            else:
                print(f"\n{Colors.YELLOW}⚠️  Se encontraron {ERROR_COUNT} problemas.{Colors.ENDC}")
            sys.exit(0)
        
        # Verificar/instalar dependencias
        if args.install or not check_dependencies():
            if not install_dependencies():
                print(f"\n{Colors.RED}❌ No se pudieron instalar las dependencias{Colors.ENDC}")
                if ERROR_COUNT > 0:
                    print(f"{Colors.YELLOW}   Total de errores: {ERROR_COUNT}{Colors.ENDC}")
                sys.exit(1)
        else:
            print(f"{Colors.GREEN}✅ Dependencias ya instaladas{Colors.ENDC}")
        
        # Iniciar servicios
        start_services()
        
    except Exception as e:
        log_error("Error fatal en la ejecución principal", e, critical=True)


if __name__ == "__main__":
    main()
