import robot from 'robotjs';
import logger from '../utils/logger.js';

class InputControlService {
  constructor() {
    // Mapeo de teclas de JavaScript a códigos de robotjs
    this.keyMap = {
      // Navegación
      'Enter': 'enter',
      'Tab': 'tab',
      'Escape': 'escape',
      'Backspace': 'backspace',
      'Delete': 'delete',
      'Insert': 'insert',
      'Home': 'home',
      'End': 'end',
      'PageUp': 'pageup',
      'PageDown': 'pagedown',
      
      // Flechas
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      
      // Modificadores
      'Control': 'control',
      'Alt': 'alt',
      'Shift': 'shift',
      'Meta': 'command',
      'CapsLock': 'capslock',
      
      // Funciones
      'F1': 'f1', 'F2': 'f2', 'F3': 'f3', 'F4': 'f4',
      'F5': 'f5', 'F6': 'f6', 'F7': 'f7', 'F8': 'f8',
      'F9': 'f9', 'F10': 'f10', 'F11': 'f11', 'F12': 'f12',
      
      // Espacio
      ' ': 'space',
      'Space': 'space',
      
      // Símbolos comunes
      'Comma': ',',
      'Period': '.',
      'Slash': '/',
      'Semicolon': ';',
      'Quote': "'",
      'BracketLeft': '[',
      'BracketRight': ']',
      'Backslash': '\\',
      'Minus': '-',
      'Equal': '=',
      'Backquote': '`'
    };

    this.buttonMap = {
      'left': 'left',
      'right': 'right',
      'middle': 'middle'
    };
  }

  async moveMouse(x, y) {
    try {
      robot.moveMouse(Math.round(x), Math.round(y));
    } catch (error) {
      logger.error('Error moviendo mouse:', error);
      throw new Error('No se pudo mover el cursor');
    }
  }

  async click(button = 'left', type = 'click') {
    try {
      const btn = this.buttonMap[button] || 'left';
      
      switch(type) {
        case 'down':
          robot.mouseToggle('down', btn);
          break;
        case 'up':
          robot.mouseToggle('up', btn);
          break;
        case 'double':
          robot.mouseClick(btn, true);
          break;
        case 'click':
        default:
          robot.mouseClick(btn, false);
      }
    } catch (error) {
      logger.error('Error en click:', error);
      throw new Error('No se pudo realizar el click');
    }
  }

  async keyPress(key, modifiers = []) {
    try {
      const robotKey = this.keyMap[key] || key;
      
      // Manejar modificadores
      const modifierKeys = [];
      if (modifiers.includes('Control')) modifierKeys.push('control');
      if (modifiers.includes('Alt')) modifierKeys.push('alt');
      if (modifiers.includes('Shift')) modifierKeys.push('shift');
      if (modifiers.includes('Meta')) modifierKeys.push('command');
      
      if (modifierKeys.length > 0) {
        // Presionar modificadores
        modifierKeys.forEach(mod => robot.keyToggle(mod, 'down'));
        // Presionar tecla principal
        robot.keyTap(robotKey);
        // Soltar modificadores
        modifierKeys.forEach(mod => robot.keyToggle(mod, 'up'));
      } else {
        robot.keyTap(robotKey);
      }
    } catch (error) {
      logger.error('Error en key press:', error);
      throw new Error(`No se pudo enviar la tecla: ${key}`);
    }
  }

  async scroll(deltaX, deltaY) {
    try {
      const steps = Math.abs(Math.round(deltaY / 100)) || 1;
      if (deltaY > 0) {
        robot.scrollMouse(0, -steps);
      } else if (deltaY < 0) {
        robot.scrollMouse(0, steps);
      }
    } catch (error) {
      logger.error('Error en scroll:', error);
      throw new Error('No se pudo realizar el scroll');
    }
  }
}


export default InputControlService;
