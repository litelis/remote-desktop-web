import { mouse, keyboard, Point, Button, Key, scroll } from '@nut-tree/nut.js';
import logger from '../utils/logger.js';

class InputControlService {
  constructor() {
    // Mapeo completo de teclas especiales
    this.keyMap = {
      // Navegación
      'Enter': Key.Enter,
      'Tab': Key.Tab,
      'Escape': Key.Escape,
      'Backspace': Key.Backspace,
      'Delete': Key.Delete,
      'Insert': Key.Insert,
      'Home': Key.Home,
      'End': Key.End,
      'PageUp': Key.PageUp,
      'PageDown': Key.PageDown,
      
      // Flechas
      'ArrowUp': Key.Up,
      'ArrowDown': Key.Down,
      'ArrowLeft': Key.Left,
      'ArrowRight': Key.Right,
      
      // Modificadores
      'Control': Key.LeftControl,
      'Alt': Key.LeftAlt,
      'Shift': Key.LeftShift,
      'Meta': Key.LeftWin,
      'CapsLock': Key.CapsLock,
      
      // Funciones
      'F1': Key.F1, 'F2': Key.F2, 'F3': Key.F3, 'F4': Key.F4,
      'F5': Key.F5, 'F6': Key.F6, 'F7': Key.F7, 'F8': Key.F8,
      'F9': Key.F9, 'F10': Key.F10, 'F11': Key.F11, 'F12': Key.F12,
      
      // Espacio
      ' ': Key.Space,
      'Space': Key.Space,
      
      // Números del teclado numérico
      'NumLock': Key.NumLock,
      'Numpad0': Key.NumPad0,
      'Numpad1': Key.NumPad1,
      'Numpad2': Key.NumPad2,
      'Numpad3': Key.NumPad3,
      'Numpad4': Key.NumPad4,
      'Numpad5': Key.NumPad5,
      'Numpad6': Key.NumPad6,
      'Numpad7': Key.NumPad7,
      'Numpad8': Key.NumPad8,
      'Numpad9': Key.NumPad9,
      'NumpadEnter': Key.NumPadEnter,
      'NumpadAdd': Key.NumPadPlus,
      'NumpadSubtract': Key.NumPadMinus,
      'NumpadMultiply': Key.NumPadMultiply,
      'NumpadDivide': Key.NumPadDivide,
      'NumpadDecimal': Key.NumPadDecimal,
      
      // Símbolos comunes
      'Comma': Key.Comma,
      'Period': Key.Period,
      'Slash': Key.Slash,
      'Semicolon': Key.Semicolon,
      'Quote': Key.Quote,
      'BracketLeft': Key.LeftBracket,
      'BracketRight': Key.RightBracket,
      'Backslash': Key.Backslash,
      'Minus': Key.Minus,
      'Equal': Key.Equal,
      'Backquote': Key.Grave
    };

    this.buttonMap = {
      'left': Button.LEFT,
      'right': Button.RIGHT,
      'middle': Button.MIDDLE
    };
  }

  async moveMouse(x, y) {
    try {
      await mouse.move([new Point(Math.round(x), Math.round(y))]);
    } catch (error) {
      logger.error('Error moviendo mouse:', error);
      throw new Error('No se pudo mover el cursor');
    }
  }

  async click(button = 'left', type = 'click') {
    try {
      const btn = this.buttonMap[button] || Button.LEFT;
      
      switch(type) {
        case 'down':
          await mouse.pressButton(btn);
          break;
        case 'up':
          await mouse.releaseButton(btn);
          break;
        case 'double':
          await mouse.doubleClick(btn);
          break;
        case 'click':
        default:
          await mouse.click(btn);
      }
    } catch (error) {
      logger.error('Error en click:', error);
      throw new Error('No se pudo realizar el click');
    }
  }

  async keyPress(key, modifiers = []) {
    try {
      let keys = [];
      
      // Agregar modificadores
      if (modifiers.includes('Control')) keys.push(Key.LeftControl);
      if (modifiers.includes('Alt')) keys.push(Key.LeftAlt);
      if (modifiers.includes('Shift')) keys.push(Key.LeftShift);
      if (modifiers.includes('Meta')) keys.push(Key.LeftWin);
      
      // Agregar tecla principal
      const mainKey = this.keyMap[key] || (key.length === 1 ? key : null);
      if (mainKey) {
        keys.push(mainKey);
      }
      
      if (keys.length === 0) {
        throw new Error(`Tecla no soportada: ${key}`);
      }
      
      // Presionar todas las teclas
      if (keys.length === 1) {
        await keyboard.type(keys[0]);
      } else {
        await keyboard.type(...keys);
      }
    } catch (error) {
      logger.error('Error en key press:', error);
      throw new Error(`No se pudo enviar la tecla: ${key}`);
    }
  }

  async scroll(deltaX, deltaY) {
    try {
      const steps = Math.abs(Math.round(deltaY / 100));
      if (deltaY > 0) {
        await mouse.scrollDown(steps);
      } else if (deltaY < 0) {
        await mouse.scrollUp(steps);
      }
    } catch (error) {
      logger.error('Error en scroll:', error);
      throw new Error('No se pudo realizar el scroll');
    }
  }
}

export default InputControlService;