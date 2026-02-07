#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔄 Remote Desktop Web - Update Script
Script para verificar y actualizar desde el repositorio GitHub

Uso:
    python update.py
    python update.py --force  # Forzar actualización sin preguntar
"""

import os
import sys
import subprocess
import argparse
import json
import urllib.request
import urllib.error
from pathlib import Path

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

# Configuración
GITHUB_REPO = "litelis/remote-desktop-web"
GITHUB_API_URL = f"https://api.github.com/repos/{GITHUB_REPO}/commits/main"
VERSION_FILE = ".version"

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
        print(f"{Colors.RED}❌ Error HTTP al consultar GitHub: {e.code}{Colors.ENDC}")
        return None
    except urllib.error.URLError as e:
        print(f"{Colors.RED}❌ Error de conexión: {e.reason}{Colors.ENDC}")
        return None
    except Exception as e:
        print(f"{Colors.RED}❌ Error obteniendo commit remoto: {e}{Colors.ENDC}")
        return None

def get_local_commit():
    """Obtiene el commit local almacenado"""
    try:
        if os.path.exists(VERSION_FILE):
            with open(VERSION_FILE, 'r') as f:
                return f.read().strip()
    except Exception:
        pass
    return None

def save_local_commit(commit_sha):
    """Guarda el commit local"""
    try:
        with open(VERSION_FILE, 'w') as f:
            f.write(commit_sha)
        return True
    except Exception as e:
        print(f"{Colors.RED}❌ Error guardando versión local: {e}{Colors.ENDC}")
        return False

def get_git_commit():
    """Obtiene el commit actual de git"""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            capture_output=True,
            text=True,
            check=True,
            shell=True
        )
        return result.stdout.strip()
    except Exception:
        return None

def check_git_installed():
    """Verifica que git esté instalado"""
    try:
        subprocess.run(['git', '--version'], capture_output=True, check=True, shell=True)
        return True
    except Exception:
        return False

def check_git_repo():
    """Verifica que estemos en un repositorio git"""
    try:
        subprocess.run(['git', 'status'], capture_output=True, check=True, shell=True)
        return True
    except Exception:
        return False

def ask_user(prompt):
    """Pregunta al usuario y/n"""
    while True:
        try:
            response = input(f"{Colors.YELLOW}{prompt} (y/n): {Colors.ENDC}").lower().strip()
            if response in ['y', 'yes', 's', 'si', 'sí']:
                return True
            elif response in ['n', 'no']:
                return False
            else:
                print(f"{Colors.CYAN}   Por favor responde 'y' o 'n'{Colors.ENDC}")
        except KeyboardInterrupt:
            print(f"\n{Colors.YELLOW}🛑 Operación cancelada{Colors.ENDC}")
            return False

def perform_update():
    """Realiza la actualización desde git"""
    print(f"\n{Colors.YELLOW}📥 Actualizando archivos...{Colors.ENDC}")
    
    try:
        # Fetch latest changes
        print(f"{Colors.BLUE}   → Descargando cambios...{Colors.ENDC}")
        result = subprocess.run(
            ['git', 'fetch', 'origin'],
            capture_output=True,
            text=True,
            shell=True
        )
        if result.returncode != 0:
            print(f"{Colors.RED}❌ Error en git fetch: {result.stderr}{Colors.ENDC}")
            return False
        
        # Pull changes
        print(f"{Colors.BLUE}   → Aplicando cambios...{Colors.ENDC}")
        result = subprocess.run(
            ['git', 'pull', 'origin', 'main'],
            capture_output=True,
            text=True,
            shell=True
        )
        if result.returncode != 0:
            print(f"{Colors.RED}❌ Error en git pull: {result.stderr}{Colors.ENDC}")
            return False
        
        print(f"{Colors.GREEN}✅ Archivos actualizados correctamente{Colors.ENDC}")
        return True
        
    except Exception as e:
        print(f"{Colors.RED}❌ Error durante la actualización: {e}{Colors.ENDC}")
        return False

def perform_git_operations():
    """Realiza git add, commit y push"""
    print(f"\n{Colors.YELLOW}📤 Subiendo cambios a GitHub...{Colors.ENDC}")
    
    try:
        # Git add
        print(f"{Colors.BLUE}   → Agregando cambios...{Colors.ENDC}")
        result = subprocess.run(
            ['git', 'add', '.'],
            capture_output=True,
            text=True,
            shell=True
        )
        if result.returncode != 0:
            print(f"{Colors.RED}❌ Error en git add: {result.stderr}{Colors.ENDC}")
            return False
        
        # Check if there are changes to commit
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True,
            text=True,
            shell=True
        )
        if not result.stdout.strip():
            print(f"{Colors.CYAN}   ℹ️ No hay cambios para commitear{Colors.ENDC}")
        else:
            # Git commit
            print(f"{Colors.BLUE}   → Creando commit...{Colors.ENDC}")
            result = subprocess.run(
                ['git', 'commit', '-m', 'Update from remote repository'],
                capture_output=True,
                text=True,
                shell=True
            )
            if result.returncode != 0:
                print(f"{Colors.RED}❌ Error en git commit: {result.stderr}{Colors.ENDC}")
                return False
            print(f"{Colors.GREEN}✅ Commit creado{Colors.ENDC}")
        
        # Git push
        print(f"{Colors.BLUE}   → Subiendo a GitHub...{Colors.ENDC}")
        result = subprocess.run(
            ['git', 'push', 'origin', 'main'],
            capture_output=True,
            text=True,
            shell=True
        )
        if result.returncode != 0:
            print(f"{Colors.RED}❌ Error en git push: {result.stderr}{Colors.ENDC}")
            return False
        
        print(f"{Colors.GREEN}✅ Cambios subidos correctamente{Colors.ENDC}")
        return True
        
    except Exception as e:
        print(f"{Colors.RED}❌ Error en operaciones git: {e}{Colors.ENDC}")
        return False

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(
        description='Verifica y actualiza el proyecto desde GitHub',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python update.py         # Verificar y preguntar para actualizar
  python update.py --force # Forzar actualización sin preguntar
  python update.py --check # Solo verificar, no actualizar
        """
    )
    parser.add_argument(
        '-f', '--force',
        action='store_true',
        help='Forzar actualización sin preguntar'
    )
    parser.add_argument(
        '-c', '--check',
        action='store_true',
        help='Solo verificar, no actualizar'
    )
    
    args = parser.parse_args()
    
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
        sys.exit(1)
    
    local = get_local_commit()
    git_current = get_git_commit()
    
    # Mostrar información
    print(f"\n{Colors.CYAN}{Colors.BOLD}📊 Información de versiones:{Colors.ENDC}")
    print(f"   {Colors.BLUE}Remoto:{Colors.ENDC}  {Colors.GREEN}{remote['sha']}{Colors.ENDC} - {remote['message'][:50]}")
    print(f"   {Colors.BLUE}Autor:{Colors.ENDC}   {remote['author']} ({remote['date']})")
    
    if local:
        print(f"   {Colors.BLUE}Local:{Colors.ENDC}   {Colors.YELLOW}{local}{Colors.ENDC}")
    else:
        print(f"   {Colors.BLUE}Local:{Colors.ENDC}   {Colors.YELLOW}No registrado{Colors.ENDC}")
    
    if git_current:
        print(f"   {Colors.BLUE}Git:{Colors.ENDC}     {Colors.CYAN}{git_current}{Colors.ENDC}")
    
    # Verificar si hay actualización
    needs_update = False
    
    if not local:
        needs_update = True
        print(f"\n{Colors.YELLOW}⚠️ No hay registro de versión local{Colors.ENDC}")
    elif local != remote['sha']:
        needs_update = True
        print(f"\n{Colors.YELLOW}⚠️ Hay una nueva versión disponible!{Colors.ENDC}")
    else:
        print(f"\n{Colors.GREEN}✅ Estás en la última versión{Colors.ENDC}")
    
    # Solo verificar
    if args.check:
        sys.exit(0)
    
    # Actualizar si es necesario
    if needs_update:
        if args.force or ask_user("¿Quieres actualizar a la última versión?"):
            if perform_update():
                # Guardar nueva versión
                save_local_commit(remote['sha'])
                
                # Realizar operaciones git
                perform_git_operations()
                
                print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 Actualización completada!{Colors.ENDC}")
                print(f"{Colors.CYAN}   Versión actual: {remote['sha']}{Colors.ENDC}")
            else:
                print(f"\n{Colors.RED}❌ La actualización falló{Colors.ENDC}")
                sys.exit(1)
        else:
            print(f"\n{Colors.CYAN}ℹ️ Actualización cancelada por el usuario{Colors.ENDC}")
    else:
        # Aún así hacer push si hay cambios locales
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True,
            text=True,
            shell=True
        )
        if result.stdout.strip():
            print(f"\n{Colors.YELLOW}📤 Hay cambios locales para subir{Colors.ENDC}")
            if args.force or ask_user("¿Quieres subir tus cambios a GitHub?"):
                perform_git_operations()
    
    print(f"\n{Colors.GREEN}✨ Proceso finalizado{Colors.ENDC}")

if __name__ == "__main__":
    main()
