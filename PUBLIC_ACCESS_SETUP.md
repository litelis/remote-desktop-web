# 🔓 Acceso Público - Guía de Configuración

## Resumen

Se ha implementado una funcionalidad de **acceso público con contraseña** que permite compartir tu escritorio remoto de forma segura a través de internet, pero solo para personas que tengan la contraseña correcta.

## 🚀 Características

- ✅ **Modo Público/Privado**: Toggle en el login para elegir el tipo de conexión
- ✅ **Contraseña separada**: Diferente contraseña para acceso público
- ✅ **Límite de conexiones**: Máximo número de usuarios públicos simultáneos
- ✅ **Sesiones temporales**: Expiración automática (1 hora por defecto)
- ✅ **Acceso restringido**: Sin reinicio/apagado del sistema en modo público
- ✅ **Logging de seguridad**: Registro de todas las conexiones públicas con IP
- ✅ **Indicadores visuales**: Banner naranja para identificar modo público

## ⚙️ Configuración

### Variables de Entorno

Añade estas variables a tu archivo `.env` en la carpeta `server/`:

```env
# Habilitar acceso público (true/false)
PUBLIC_ACCESS_ENABLED=true

# Contraseña para acceso público (diferente a la de admin)
PUBLIC_ACCESS_PASSWORD=tu_contraseña_pública_segura

# Máximo de conexiones públicas simultáneas (default: 5)
MAX_PUBLIC_CONNECTIONS=5

# Tiempo de expiración de sesión en milisegundos (default: 1 hora)
PUBLIC_SESSION_TIMEOUT=3600000
```

### Notas de Seguridad

1. **Usa una contraseña fuerte** para el acceso público
2. **Cambia las contraseñas regularmente**
3. **Monitorea los logs** para detectar accesos no autorizados
4. **Deshabilita el acceso público** cuando no lo necesites
5. **Usa HTTPS** en producción para conexiones seguras

## 🖥️ Uso

### Para el Propietario (Servidor)

1. Configura las variables de entorno mencionadas arriba
2. Inicia el servidor normalmente
3. Verás en los logs si el acceso público está habilitado:
   ```
   🌐 Acceso público: Habilitado (máx: 5 conexiones)
   ```

### Para los Usuarios (Clientes)

1. Abre la aplicación en el navegador
2. Verás dos botones de modo: **🔒 Privado** y **🌐 Público**
3. Selecciona el modo **Público**
4. Ingresa la contraseña pública
5. Verás un banner naranja indicando "Modo Público - Acceso Limitado"
6. Las funciones de reinicio y apagado estarán deshabilitadas

## 🔒 Diferencias entre Modos

| Característica | Modo Privado | Modo Público |
|---------------|--------------|--------------|
| Contraseña | Admin | Pública separada |
| Reinicio/Apagado | ✅ Sí | ❌ No |
| Duración de sesión | 8 horas | 1 hora (configurable) |
| Límite de conexiones | 1 por usuario | 5 máximo (configurable) |
| Indicador visual | Normal | Banner naranja |
| Logging | Sí | Sí + IP tracking |

## 📊 Endpoints API

### Verificar estado público
```
GET /api/auth/public-status
```
Respuesta:
```json
{
  "enabled": true,
  "availableSlots": 3,
  "message": "Acceso público disponible"
}
```

### Login público
```
POST /api/auth/public-login
Body: { "password": "tu_contraseña" }
```

## 🛡️ Seguridad Implementada

1. **Rate limiting** en endpoints de autenticación
2. **IP logging** para todas las conexiones públicas
3. **Token JWT** con expiración para sesiones públicas
4. **Validación de conexiones** en tiempo real
5. **Restricción de funciones** peligrosas en modo público
6. **Sesiones únicas** - una sesión por token

## 📝 Logs

Los logs incluyen información detallada:
```
[INFO] Acceso público - login: 192.168.1.100
[WARN] Intento de login público fallido desde IP: 192.168.1.100
[INFO] Conexión pública registrada: public-123456 desde IP: 192.168.1.100
[INFO] Conexión pública eliminada: public-123456
```

## 🔄 Deshabilitar Acceso Público

Para deshabilitar temporalmente el acceso público:

```env
PUBLIC_ACCESS_ENABLED=false
```

O simplemente no definas la variable (default: false).

## 🆘 Solución de Problemas

### "Acceso público deshabilitado"
- Verifica que `PUBLIC_ACCESS_ENABLED=true` en el `.env`
- Reinicia el servidor después de cambiar variables

### "Límite de conexiones públicas alcanzado"
- Espera a que otro usuario se desconecte
- Aumenta `MAX_PUBLIC_CONNECTIONS` si es necesario

### "Contraseña inválida"
- Verifica que estás usando la contraseña pública, no la de admin
- Revisa que `PUBLIC_ACCESS_PASSWORD` esté configurada

## 🎨 Personalización

Puedes personalizar los estilos en:
- `client/src/components/Login/Login.css` - Estilos del login
- `client/src/components/DesktopViewer/DesktopViewer.css` - Banner público
- `client/src/components/ControlBar/ControlBar.css` - Indicador público

---

¡Listo! Ahora puedes compartir tu escritorio remoto de forma segura con quien tenga la contraseña. 🎉
