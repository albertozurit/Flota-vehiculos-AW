# 🚗 Flota de Vehículos Eléctricos - Documentación de Entrega

## ✅ CHECKLIST DE REQUISITOS OBLIGATORIOS

### 1. Configuración Base de Datos
```javascript
host: 'localhost',
user: 'root',
database: 'flotawei'
// Sin contraseña
```
**Ubicación:** `config/config.js`

### 2. Organización de Carpetas ✅
```
Flota-vehiculos-AW/
├── app.js                  # Punto de entrada
├── config/                 # Configuración DB
├── middlewares/            # Autenticación y autorización
├── routes/                 # Rutas organizadas por funcionalidad
├── validators/             # Validaciones con express-validator
├── views/                  # Vistas EJS organizadas
│   ├── admin/
│   ├── partials/
│   ├── reservas/
│   ├── usuarios/
│   └── vehiculos/
└── public/                 # Recursos estáticos
    ├── css/
    ├── images/
    └── js/
```

### 3. Nomenclatura ✅
- **Base de datos:** `flotawei`
- **Tablas:** PascalCase (`Vehiculos`, `Concesionarios`, `Reservas`, `Usuarios`)
- **Archivos:** snake_case o camelCase según convención
- **Variables:** camelCase

### 4. Imágenes ✅
- **Ubicación:** `/public/images/vehiculos/`
- **Fallback:** `no-image.png` disponible
- **Todas las imágenes verificadas y funcionando**

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### Funcionalidades Básicas (5 puntos)
| Funcionalidad | Estado | Notas |
|--------------|--------|-------|
| Registro/Login/Logout | ✅ | Validaciones con express-validator |
| Correo corporativo | ✅ | Regex: `@empresa.com` |
| Contraseña segura | ✅ | Min 8 chars, 1 mayúscula, 1 número |
| Empleado → Concesionario | ✅ | Asignación obligatoria |
| Carga JSON inicial | ✅ | `/admin/carga-json` con modal |
| Panel administrador | ✅ | CRUD completo + concesionarios |
| Listado vehículos | ✅ | Disponibles para empleados |
| Filtros básicos | ✅ | Concesionario y ciudad |
| Reserva con fecha/hora | ✅ | Date/time pickers Bootstrap |
| Histórico reservas | ✅ | Activas y finalizadas |
| Diseño responsive | ✅ | Bootstrap 5.3 + grid system |
| Accesibilidad básica | ✅ | Contraste, tamaño, navegación teclado |

### Funcionalidades Intermedias (8 puntos)
| Funcionalidad | Estado | Notas |
|--------------|--------|-------|
| Roles diferenciados | ✅ | Admin/Empleado con middlewares |
| Gestión disponibilidad | ✅ | Automática según reservas |
| Filtros avanzados | ✅ | Autonomía, plazas, color |
| AJAX en reservas | ✅ | Sin recargar página |
| Preferencias en sesión | ✅ | Modal accesibilidad guardado |
| Estadísticas básicas | ✅ | Reservas por concesionario |

---

## 🚀 INSTALACIÓN Y USO

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear base de datos
```bash
mysql -u root
CREATE DATABASE flotawei;
USE flotawei;
SOURCE config/schema.sql;
```

### 3. Iniciar aplicación
```bash
npm start
# Servidor en http://localhost:3000
```

### 4. Cargar datos iniciales
1. Acceder como admin (o crear usuario admin desde registro)
2. Ir a Panel de Administración → Carga desde JSON
3. La BD debe estar vacía (0 vehículos, 0 concesionarios)
4. Se cargarán automáticamente desde `bd_vacia.json`

---

## 👤 USUARIOS DE PRUEBA

Después de cargar el JSON, crear usuarios manualmente o usar:

**Administrador:**
- Email: `admin@empresa.com`
- Password: `Admin123`
- Rol: Administrador

**Empleado:**
- Email: `empleado@empresa.com`
- Password: `Empleado123`
- Rol: Empleado
- Concesionario: Seleccionar uno disponible

---

## 📋 FUNCIONALIDADES POR ROL

### Administrador
- ✅ CRUD completo de vehículos (modal)
- ✅ CRUD de concesionarios (modal)
- ✅ Gestión de usuarios (roles, asignaciones)
- ✅ Estadísticas de reservas
- ✅ Carga/Vaciado de BD
- ✅ Ver TODOS los vehículos de TODOS los concesionarios
- ✅ Hacer reservas

### Empleado
- ✅ Ver vehículos de SU concesionario únicamente
- ✅ Filtrar vehículos (ciudad, color, autonomía, plazas)
- ✅ Hacer reservas
- ✅ Ver historial de reservas (activas/finalizadas)
- ✅ Configurar preferencias de accesibilidad

---

## 🎨 TECNOLOGÍAS UTILIZADAS

### Backend
- **Express.js 4.21.1** - Framework web
- **express-session** - Manejo de sesiones
- **bcryptjs** - Hash de contraseñas
- **express-validator** - Validaciones
- **mysql** - Conexión a BD

### Frontend
- **Bootstrap 5.3** - Framework CSS
- **EJS** - Template engine
- **Bootstrap Icons** - Iconografía
- **JavaScript vanilla** - Interactividad (AJAX, modales)

### Estructura
- **MVC adaptado** - Separación de responsabilidades
- **Middlewares** - Autenticación y autorización
- **Modales Bootstrap** - Toda la interacción principal
- **AJAX** - Actualizaciones dinámicas

---

## 🔒 SEGURIDAD

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Validación de sesiones en cada ruta protegida
- ✅ Middleware de autorización por rol
- ✅ Validaciones estrictas en servidor (express-validator)
- ✅ Protección contra SQL injection (queries parametrizadas)
- ✅ Sanitización de inputs

---

## 📱 CARACTERÍSTICAS DESTACADAS

### Diseño
- **Responsive** - Funciona en móvil, tablet y desktop
- **Carrusel de vehículos** - Página de inicio atractiva
- **Tarjetas de vehículos** - Diseño tipo BMW/Audi
- **Modales** - Toda la funcionalidad sin cambiar de página

### UX/UI
- **Filtros en tiempo real** - Con AJAX
- **Feedback visual** - Mensajes de éxito/error
- **Navegación intuitiva** - Header con enlaces contextuales
- **Preferencias guardadas** - En sesión del usuario

### Accesibilidad
- **Atajos de teclado** - Navegación sin ratón
- **Contraste configurable** - Alto contraste disponible
- **Tamaño de letra ajustable** - Pequeño, normal, grande
- **Navegación clara** - Estructura semántica

---

## 🐛 PUNTOS CRÍTICOS VERIFICADOS

### ✅ Base de Datos
- Configuración correcta en `config/config.js`
- Usuario: `root`, BD: `flotawei`
- Schema SQL funcional en `config/schema.sql`

### ✅ Imágenes
- Todas ubicadas en `/public/images/vehiculos/`
- Imagen por defecto `no-image.png` disponible
- Sin enlaces rotos

### ✅ Rutas
- Todas las rutas correctamente definidas
- Nomenclatura consistente
- Modales implementados (sin cambios de página innecesarios)

### ✅ Bootstrap
- Presente en todas las vistas
- Modales utilizados extensivamente
- Grid system implementado

### ✅ Validaciones
- Cliente y servidor
- Mensajes de error claros
- express-validator configurado

---

## 📄 ARCHIVOS IMPORTANTES

- `app.js` - Configuración principal del servidor
- `bd_vacia.json` - Datos iniciales (30 vehículos, 6 concesionarios)
- `config/schema.sql` - Estructura de la BD
- `RUTAS_COMENTADAS.md` - Documentación de rutas
- `README.md` - Documentación general
- `package.json` - Dependencias del proyecto

---

## 🎓 NOTAS PARA LA CORRECCIÓN

1. **Base de datos limpia**: Usar `bd_vacia.json` para cargar datos de prueba
2. **Usuarios**: Crear manualmente después de cargar BD (usuarios no incluidos en JSON)
3. **Imágenes**: Todas verificadas y funcionando
4. **Navegación**: Principalmente por modales (Bootstrap)
5. **Roles**: Verificar con usuario admin y empleado
6. **Responsive**: Probar en diferentes tamaños de pantalla

---

## 📞 ESTRUCTURA DE CONTACTOS

**Desarrollado por:** [Tu nombre/grupo]
**Asignatura:** Aplicaciones Web
**Curso:** 2024/2025
**Universidad:** [Tu universidad]

---

**Última actualización:** Diciembre 2024
