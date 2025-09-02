# 🚀 Guía de Migración - Etiquetas y Roles Avanzados

## ⚠️ IMPORTANTE: Nueva Migración Requerida

Esta migración agrega las funcionalidades de **Etiquetas Personalizadas** y **Sistema de Roles Avanzado** a Traderfy.

### 📋 Pasos para la Migración

#### 1. **Ejecutar Script SQL**
- Ve al **SQL Editor** en tu panel de Supabase
- Copia y pega el contenido del archivo `supabase-migration-labels-roles.sql`
- Ejecuta el script completo

#### 2. **Verificar Nuevas Tablas**
Después de la migración, deberías ver estas nuevas tablas:
- ✅ `labels` - Etiquetas personalizadas por usuario
- ✅ `account_labels` - Relaciones cuenta-etiqueta  
- ✅ `mentorships` - Relaciones mentor-alumno
- ✅ `users` - Actualizada con columnas de roles

#### 3. **Nuevos Roles del Sistema**
- **Admin**: Acceso completo a todos los datos
- **Mentor**: Acceso a datos de alumnos asignados
- **Trader**: Acceso estándar a su perfil
- **Alumno**: Acceso limitado, debe seleccionar mentor

### 🎨 Funcionalidades Implementadas

#### **Etiquetas Personalizadas**
- Sistema de colores automático (lila-cian)
- Creación, edición y eliminación de etiquetas
- Organización flexible de cuentas
- Almacenamiento privado por usuario

#### **Sistema de Mentorías**
- Relación 1:N (un mentor → múltiples alumnos)
- Sección "Alumnos" para mentores
- Acceso controlado con RLS
- Métricas agregadas por alumno

### 🔒 Seguridad (RLS)

Las nuevas políticas RLS aseguran:
- Usuarios solo ven sus propios datos
- Mentores solo acceden a datos de sus alumnos
- Admins tienen acceso completo
- Protección contra acceso no autorizado

### 🧪 Testing

Una vez completada la migración:
1. Registra usuarios con diferentes roles
2. Crea etiquetas personalizadas
3. Establece relaciones mentor-alumno
4. Prueba la carga de `sample_mt4_report.html`

### 📊 Estructura de Datos

```sql
-- Labels (Etiquetas)
labels {
  id: UUID PRIMARY KEY
  user_id: UUID → users.id
  name: VARCHAR(50)
  color: VARCHAR(7) -- Hex color
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Account Labels (Relación)
account_labels {
  account_id: UUID → accounts.id
  label_id: UUID → labels.id
}

-- Mentorships (Mentorías)
mentorships {
  mentor_id: UUID → users.id
  alumno_id: UUID → users.id
  status: VARCHAR(20) -- active, inactive, pending
}
```

### 🚨 Resolución de Problemas

**Error: "relation does not exist"**
- Ejecuta el script SQL completo
- Verifica conexión a Supabase

**Error: "RLS policy violation"**  
- Asegúrate de tener el rol correcto
- Verifica que las políticas se crearon

**Error en la aplicación**
- Reinicia el servidor Next.js
- Verifica variables de entorno

---

**✅ Una vez completada esta migración, Traderfy tendrá todas las funcionalidades avanzadas implementadas.**