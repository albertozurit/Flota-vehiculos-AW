# Práctica de Gestión de Flotas de Vehículos Eléctricos

## Descripción
Aplicación web para la gestión integral de una flota de vehículos eléctricos compartidos, desarrollada con Node.js, Express y EJS.

## Características Implementadas (Laboratorio 7)

### ✅ Tareas Básicas Completadas
- ✅ Instalación y configuración de express-session
- ✅ Vistas con formularios para registro (/registro) y login (/login)
- ✅ Almacenamiento de usuarios en memoria (email único)
- ✅ Sesión de usuario al hacer login
- ✅ Mensaje personalizado en inicio cuando el usuario está autenticado

### ✅ Tareas Intermedias Completadas
- ✅ Middleware de autenticación para rutas protegidas (/reservas, /listareservas)
- ✅ Botón de cerrar sesión (/logout)
- ✅ Validaciones:
  - Email único
  - Contraseña mínimo 8 caracteres con mayúsculas, minúsculas y números
  - Email corporativo (@ucm.es)
- ✅ Mensajes de error claros en vistas

### ✅ Tareas Avanzadas Completadas
- ✅ Roles de usuario (empleado/admin)
- ✅ Hash de contraseñas con bcrypt
- ✅ Middleware global (res.locals) para usuario en todas las vistas
- ✅ Panel de administración con restricción de acceso

### ✅ Accesibilidad Básica
- ✅ Modal de accesibilidad en la barra de navegación
- ✅ Cambio de tamaño de fuente (pequeño/normal/grande)
- ✅ Cambio de contraste (normal/alto contraste)
- ✅ Navegación por teclado
- ✅ Atajos de teclado:
  - Ctrl+I → Inicio
  - Ctrl+R → Reservar
  - Ctrl+H → Mis reservas
- ✅ Preferencias guardadas en localStorage

## Requisitos Previos

⚠️ **IMPORTANTE**: Esta aplicación requiere **XAMPP** (Apache + MySQL + phpMyAdmin)

- XAMPP instalado y configurado
- MySQL corriendo en XAMPP
- Node.js instalado

## Instalación

### 1. Configurar Base de Datos en XAMPP

**Ver instrucciones detalladas en:** [INSTRUCCIONES_BD.md](INSTRUCCIONES_BD.md)

Resumen rápido:
1. Inicia Apache y MySQL en XAMPP
2. Abre phpMyAdmin (http://localhost/phpmyadmin)
3. Crea el usuario de BD:
```sql
CREATE USER 'dbuser'@'localhost' IDENTIFIED BY 'dbpass123';
GRANT ALL PRIVILEGES ON flotawei.* TO 'dbuser'@'localhost';
FLUSH PRIVILEGES;
```
4. Ejecuta el script completo `config/schema.sql` en la pestaña SQL

### 2. Instalar Dependencias de Node.js

```bash
# Clonar o descargar el proyecto
cd flota-vehiculos-lab7

# Instalar dependencias
npm install

# Iniciar el servidor
npm start
```

El servidor se ejecutará en: http://localhost:3000

### Credenciales por Defecto
- **Usuario admin**: admin@flota.com
- **Contraseña**: admin123

## Estructura del Proyecto

```
flota-vehiculos-lab7/
├── app.js                 # Servidor Express principal
├── package.json           # Dependencias del proyecto
├── public/               
│   ├── css/
│   │   └── estilos.css   # Estilos personalizados
│   ├── js/
│   │   └── accesibilidad.js  # Funciones de accesibilidad
│   └── images/           # Imágenes (por implementar)
└── views/
    ├── partials/
    │   ├── header.ejs    # Cabecera y navegación
    │   └── footer.ejs    # Pie de página y modal accesibilidad
    ├── index.ejs         # Página de inicio
    ├── login.ejs         # Formulario de login
    ├── registro.ejs      # Formulario de registro
    ├── reservas.ejs      # Página de reservas (por completar)
    ├── listareservas.ejs # Listado de reservas
    └── admin.ejs         # Panel de administración
```

## Uso de la Aplicación

### Registro de Usuario
1. Ir a `/registro`
2. Completar el formulario con:
   - Nombre completo
   - Email corporativo (@ucm.es)
   - Contraseña segura (mín. 8 caracteres, mayúsculas, minúsculas, números)
   - Teléfono (opcional)
3. El usuario se crea como "empleado" por defecto

### Inicio de Sesión
1. Ir a `/login`
2. Ingresar email y contraseña
3. Se crea una sesión que dura 24 horas

### Crear un Administrador
Para crear un usuario administrador manualmente:

1. Registrar un usuario normal
2. Detener el servidor
3. En `app.js`, buscar el array `usuarios` y cambiar el rol del usuario deseado a `'admin'`
4. Reiniciar el servidor

### Accesibilidad
- Clic en "⚙️ Accesibilidad" en la barra de navegación
- Ajustar tamaño de fuente y contraste
- Las preferencias se guardan automáticamente

## Próximos Pasos (Para la Práctica Obligatoria)

### 1. Configuración de Base de Datos MySQL
- Crear base de datos y tablas
- Migrar usuarios de memoria a BD
- Implementar pool de conexiones

### 2. Gestión de Vehículos
- CRUD completo de vehículos
- Carga desde JSON
- Gestión de imágenes

### 3. Gestión de Concesionarios
- CRUD de concesionarios
- Asignación de empleados

### 4. Sistema de Reservas
- Crear reservas con validaciones
- Gestión de disponibilidad
- Historial completo

### 5. Estadísticas Avanzadas
- Uso de flota
- Kilómetros recorridos
- Análisis temporal

### 6. Accesibilidad Avanzada
- Persistencia en BD
- Atajos configurables
- Orden de tabulación personalizado

## Tecnologías Utilizadas

- **Backend**: Node.js + Express.js
- **Motor de vistas**: EJS
- **Sesiones**: express-session + express-mysql-session
- **Seguridad**: bcrypt (hash de contraseñas)
- **Frontend**: HTML5, CSS3, Bootstrap 5.3
- **Base de datos**: MySQL 8.x (XAMPP - Motor InnoDB)
- **Pool de conexiones**: mysql2/promise

## Validaciones Implementadas

### Registro
- ✅ Campos obligatorios: nombre, email, contraseña
- ✅ Email formato @ucm.es (regex corporativo)
- ✅ Contraseña: mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
- ✅ Email único (no duplicados)

### Login
- ✅ Verificación de credenciales con bcrypt
- ✅ Mensajes de error sin revelar información sensible

### Rutas Protegidas
- ✅ Middleware requireAuth para empleados
- ✅ Middleware requireAdmin para administradores
- ✅ Redirección automática si no autenticado

## Autor
Laboratorio 7 - Aplicaciones Web
Universidad Complutense de Madrid
