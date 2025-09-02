# 🚀 Configuración de Supabase para Traderfy

## Paso 1: Crear Proyecto Supabase

1. Ve a [supabase.com](https://supabase.com) y regístrate o inicia sesión
2. Haz clic en **"New project"**
3. Selecciona tu organización (o crea una nueva)
4. Configura tu proyecto:
   - **Nombre**: `traderfy-app`
   - **Base de datos password**: Genera una contraseña segura (¡guárdala!)
   - **Región**: Selecciona la más cercana a tu ubicación
   - **Plan**: Free (suficiente para desarrollo)
5. Haz clic en **"Create new project"**
6. **Espera 2-3 minutos** mientras Supabase configura tu proyecto

## Paso 2: Obtener Credenciales

1. Una vez creado el proyecto, ve a **Settings → API** en la barra lateral
2. En la sección "Project API keys", encontrarás:
   - **Project URL**: Copia esta URL (ej: `https://abc123.supabase.co`)
   - **Anon key**: Copia esta clave (empieza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **Service Role Key**: Copia esta clave (¡MANTÉN EN SECRETO!)

## Paso 3: Configurar URLs de Autenticación

1. Ve a **Authentication → URL Configuration** en tu panel de Supabase
2. En **Site URL**, agrega: `https://trade-metrics-12.preview.emergentagent.com`
3. En **Redirect URLs**, agrega estas URLs (una por línea):
   ```
   https://trade-metrics-12.preview.emergentagent.com/**
   https://trade-metrics-12.preview.emergentagent.com/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```
4. Haz clic en **Save** para guardar los cambios

## Paso 4: Crear Base de Datos

1. Ve a **SQL Editor** en tu panel de Supabase
2. Haz clic en **"New query"**
3. Copia y pega todo el contenido del archivo `supabase-setup.sql`
4. Haz clic en **"Run"** para ejecutar el script
5. Deberías ver un mensaje de éxito y las tablas creadas en **Table Editor**

## Paso 5: Configurar Variables de Entorno

1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza las siguientes líneas:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```

   Con tus credenciales reales:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **IMPORTANTE**: 
- La **Service Role Key** tiene permisos de administrador. NUNCA la expongas en el frontend.
- Solo úsala en código del servidor (API routes).
- No la subas a repositorios públicos.

## Paso 6: Reiniciar la Aplicación

1. Guarda el archivo `.env`
2. Reinicia el servidor de desarrollo:
   ```bash
   sudo supervisorctl restart nextjs
   ```
3. La aplicación debería funcionar completamente ahora

## Verificación

Para verificar que todo funciona:

1. **Verifica las tablas**: Ve a **Table Editor** en Supabase y deberías ver:
   - `users`
   - `accounts` 
   - `trades`
   - `rules`

2. **Verifica la aplicación**: 
   - La alerta de configuración debería desaparecer
   - Puedes subir archivos HTML para procesarlos
   - El calendario mostrará los datos procesados

## Estructura de Tablas Creadas

### `users`
- Usuarios del sistema con roles (Admin, Mentor, Trader, Alumno)
- Autenticación integrada con Supabase Auth

### `accounts`
- Cuentas de trading (Broker, Prop Firm, etc.)
- Tags: Live, Demo, Funded
- Balance inicial y actual

### `trades` 
- Operaciones de trading procesadas desde HTML
- Campos: símbolo, dirección, precios, P&L, etc.
- Vinculadas a usuario y cuenta

### `rules`
- Reglas de seguimiento por cuenta
- Límites: pérdida máxima, trades por día, drawdown

## Roles y Permisos

- **Admin**: Acceso completo a todos los datos
- **Mentor**: Puede ver datos de sus Alumnos asignados
- **Trader**: Solo ve sus propios datos
- **Alumno**: Acceso limitado, supervisado por Mentor

## Solución de Problemas

### Error: "Invalid URL"
- Verifica que hayas copiado correctamente la Project URL
- Debe empezar con `https://` y terminar con `.supabase.co`

### Error: "API key not found"
- Verifica que hayas copiado la Anon key completa
- La clave es muy larga (varios cientos de caracteres)

### Tablas no aparecen
- Verifica que ejecutaste todo el script SQL
- Revisa la pestaña de errores en SQL Editor

### Error de autenticación
- Verifica que agregaste las URLs correctas en Authentication
- Asegúrate de incluir tanto HTTP como HTTPS para desarrollo

## Próximos Pasos

Una vez configurado Supabase:

1. ✅ Sube un reporte HTML de MetaTrader para probar el parser
2. ✅ Verifica que los datos aparezcan en el calendario
3. ✅ Crea una cuenta en la sección de Portfolio
4. ✅ Explora las diferentes secciones de la aplicación

## Soporte

Si encuentras problemas:

1. Revisa los logs de la consola del navegador
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el script SQL se ejecutó sin errores
4. Contacta al desarrollador con capturas de pantalla del error