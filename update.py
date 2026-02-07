#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔄 Remote Desktop Web - Info Script
Script para verificar y mostrar información del repositorio GitHub

Uso:
    python update.py         # Mostrar información de versiones
    python update.py --debug # Modo debug con información detallada de errores
"""


import os
import sys
import subprocess
import argparse
import json
import urllib.request
import urllib.error
import traceback
from pathlib import Path

# Contador de errores global
ERROR_COUNT = 0


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

def safe_run(command, cwd=None, shell=True, check=False, capture_output=True, error_msg=None):
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


# Configuración
GITHUB_REPO = "litelis/remote-desktop-web"
GITHUB_API_URL = f"https://api.github.com/repos/{GITHUB_REPO}/commits/main"


def print_banner():
    """Imprime banner del script"""
    banner = f"""
{Colors.CYAN}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════╗
║              🔄 REMOTE DESKTOP WEB - UPDATER                ║
║                                                              ║
║  Verifica actualizaciones desde GitHub                      ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}
    """
    print(banner)

def get_remote_commit():
    """Obtiene el último commit del repositorio remoto"""
    try:
        req = urllib.request.Request(
            GITHUB_API_URL,
            headers={
                'User-Agent': 'RemoteDesktopWeb-Updater',
                'Accept': 'application/vnd.github.v3+json'
            }
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            return {
                'sha': data['sha'][:7],
                'full_sha': data['sha'],
                'message': data['commit']['message'].split('\n')[0],
                'author': data['commit']['author']['name'],
                'date': data['commit']['author']['date'][:10]
            }
    except urllib.error.HTTPError as e:
        log_error(f"Error HTTP al consultar GitHub: {e.code}", e)
        return None
    except urllib.error.URLError as e:
        log_error(f"Error de conexión: {e.reason}", e)
        return None
    except Exception as e:
        log_error("Error obteniendo commit remoto", e)
        return None


def get_git_commit():

    """Obtiene el commit actual de git"""
    result = safe_run(
        ['git', 'rev-parse', '--short', 'HEAD'],
        error_msg="Error obteniendo commit actual de git"
    )
    if result and result.returncode == 0:
        return result.stdout.strip()
    return None


def check_git_installed():
    """Verifica que git esté instalado"""
    result = safe_run(['git', '--version'], error_msg="Git no está instalado")
    return result is not None and result.returncode == 0


def check_git_repo():
    """Verifica que estemos en un repositorio git"""
    result = safe_run(['git', 'status'], error_msg="No estás en un repositorio git")
    return result is not None and result.returncode == 0


def main():

    """Función principal"""
    global ERROR_COUNT
    
    parser = argparse.ArgumentParser(
        description='Verifica y muestra información del proyecto desde GitHub',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python update.py         # Mostrar información de versiones
  python update.py --debug # Modo debug con información detallada de errores
        """
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
        # Imprimir banner
        print_banner()
        
        # Verificar prerrequisitos
        print(f"{Colors.YELLOW}🔍 Verificando prerrequisitos...{Colors.ENDC}")
        
        if not check_git_installed():
            print(f"{Colors.RED}❌ Git no está instalado o no está en el PATH{Colors.ENDC}")
            sys.exit(1)
        
        if not check_git_repo():
            print(f"{Colors.RED}❌ No estás en un repositorio git{Colors.ENDC}")
            print(f"{Colors.YELLOW}   Clona el repositorio primero:{Colors.ENDC}")
            print(f"{Colors.CYAN}   git clone https://github.com/{GITHUB_REPO}.git{Colors.ENDC}")
            sys.exit(1)
        
        print(f"{Colors.GREEN}✅ Git está configurado correctamente{Colors.ENDC}")
        
        # Obtener commits
        print(f"\n{Colors.YELLOW}🌐 Consultando GitHub...{Colors.ENDC}")
        remote = get_remote_commit()
        if not remote:
            if ERROR_COUNT > 0:
                print(f"\n{Colors.RED}❌ Se encontraron {ERROR_COUNT} errores. Abortando.{Colors.ENDC}")
            sys.exit(1)
        
        git_current = get_git_commit()
        
        # Mostrar información
        print(f"\n{Colors.CYAN}{Colors.BOLD}📊 Información de versiones:{Colors.ENDC}")
        print(f"   {Colors.BLUE}Remoto:{Colors.ENDC}  {Colors.GREEN}{remote['sha']}{Colors.ENDC} - {remote['message'][:50]}")
        print(f"   {Colors.BLUE}Autor:{Colors.ENDC}   {remote['author']} ({remote['date']})")
        
        if git_current:
            print(f"   {Colors.BLUE}Local:{Colors.ENDC}   {Colors.CYAN}{git_current}{Colors.ENDC}")
        else:
            print(f"   {Colors.BLUE}Local:{Colors.ENDC}   {Colors.YELLOW}No disponible{Colors.ENDC}")
        
        # Verificar si hay actualización
        if git_current and git_current != remote['sha']:
            print(f"\n{Colors.YELLOW}⚠️  Hay una nueva versión disponible en GitHub!{Colors.ENDC}")
            print(f"{Colors.CYAN}   Para actualizar manualmente:{Colors.ENDC}")
            print(f"{Colors.CYAN}   git pull origin main{Colors.ENDC}")
        elif git_current and git_current == remote['sha']:
            print(f"\n{Colors.GREEN}✅ Estás en la última versión{Colors.ENDC}")
        else:
            print(f"\n{Colors.YELLOW}⚠️  No se pudo determinar el estado de actualización{Colors.ENDC}")
        
        print(f"\n{Colors.GREEN}✨ Información mostrada correctamente{Colors.ENDC}")
        if ERROR_COUNT > 0:
            print(f"{Colors.YELLOW}   Total de advertencias/errores: {ERROR_COUNT}{Colors.ENDC}")
            
    except Exception as e:
        log_error("Error fatal en la ejecución principal", e, critical=True)


if __name__ == "__main__":
    main()
