# Rutas Comentadas - Acceso a través de Modales

Estas rutas GET ya no son necesarias porque su funcionalidad se ha movido a modales en el panel de administración.

## ✅ Rutas Comentadas

### 1. `/register` (GET) - authRoutes.js
**Razón:** El registro de usuarios se hace desde el modal `modalCrearUsuario` en el panel de admin.
**Modal usado:** `modalCrearUsuario` en `views/admin.ejs`

### 2. `/admin/vehiculos/nuevo` (GET) - adminRoutes.js
**Razón:** La creación de vehículos se hace desde el modal `modalCrearVehiculo` en el panel de admin.
**Modal usado:** `modalCrearVehiculo` en `views/admin.ejs`

### 3. `/admin/concesionarios/nuevo` (GET) - adminRoutes.js
**Razón:** La creación de concesionarios se hace desde el modal `modalCrearConcesionario` en el panel de admin.
**Modal usado:** Formulario inline en `views/admin.ejs`

---

## 📋 Modales Activos en la Aplicación

| Modal | Ubicación | Función |
|-------|-----------|---------|
| `modalAccesibilidad` | `partials/header.ejs` | Ajustes de accesibilidad (contraste, tamaño fuente) |
| `modalCrearUsuario` | `admin.ejs` | Crear nuevos usuarios (solo admin) |
| `modalEditarUsuario` | `admin.ejs` | Editar rol y concesionario de usuarios |
| `modalCrearVehiculo` | `admin.ejs` | Crear nuevos vehículos (solo admin) |
| `modalEditarVehiculo` | `partials/modal_editar_vehiculo.ejs` | Editar vehículos existentes |
| `modalEditarConcesionario` | `admin.ejs` | Editar concesionarios existentes |
| `modalFiltros` | `partials/modal_filtros_vehiculos.ejs` | Filtrar vehículos por autonomía, plazas, color, ciudad |
| `modalPerfil` | `partials/header.ejs` | Ver y editar perfil de usuario |
| `reservarModal` | `partials/modal_reservar.ejs` | Crear reserva de vehículo |

---

## ⚠️ Rutas POST Mantenidas

Las rutas POST se mantienen activas porque son necesarias para procesar los formularios:

- `POST /register` - Procesa el registro de usuarios
- `POST /admin/vehiculos/nuevo` - Procesa la creación de vehículos
- `POST /admin/concesionarios/nuevo` - Procesa la creación de concesionarios
- `POST /admin/usuarios/:id/editar` - Procesa la edición de usuarios
- etc.

---

## 🔄 Si Necesitas Restaurar una Ruta

Solo tienes que descomentar la ruta en el archivo correspondiente y reiniciar el servidor.

**Ejemplo:**
```javascript
// ANTES (comentada)
// router.get('/register', requireAuth, requireAdmin, (request, response) => {
//     ...
// });

// DESPUÉS (activa)
router.get('/register', requireAuth, requireAdmin, (request, response) => {
    ...
});
```
