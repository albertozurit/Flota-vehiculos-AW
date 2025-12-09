# Manual de Uso - FlotaWei

## Índice
1. [Introducción](#introducción)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Inicio de Sesión](#inicio-de-sesión)
4. [Roles de Usuario](#roles-de-usuario)
5. [Funcionalidades por Rol](#funcionalidades-por-rol)
6. [Gestión de Vehículos](#gestión-de-vehículos)
7. [Gestión de Reservas](#gestión-de-reservas)
8. [Panel de Administración](#panel-de-administración)
9. [Atajos de Teclado](#atajos-de-teclado)

---

## Introducción

**FlotaWei** es una aplicación web para la gestión de flotas de vehículos eléctricos. Permite a los empleados reservar vehículos y a los administradores gestionar toda la flota, usuarios y concesionarios.

---

## Requisitos del Sistema

### Navegadores Compatibles
- Google Chrome (v90+)
- Mozilla Firefox (v88+)
- Microsoft Edge (v90+)
- Safari (v14+)

### Conexión a Internet
- Requerida para todas las funcionalidades

---

## Inicio de Sesión

### Acceder a la Plataforma
1. Abrir el navegador web
2. Navegar a la URL de la aplicación
3. Hacer clic en el icono de usuario en la parte superior derecha
4. Ingresar correo corporativo (@flotawei.com) y contraseña
5. Opcionalmente marcar "Recordar sesión" para mantener la sesión activa 30 días

### Requisitos de Contraseña
- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 número

### Recuperar Contraseña
Contactar con el administrador del sistema para restablecer la contraseña.

---

## Roles de Usuario

### Empleado
- Visualizar vehículos disponibles
- Realizar reservas
- Consultar mis reservas
- Gestionar perfil personal

### Administrador
- Todas las funcionalidades de empleado
- Gestionar usuarios
- Gestionar vehículos
- Gestionar concesionarios
- Acceder a estadísticas
- Cargar datos iniciales

---

## Funcionalidades por Rol

### Como Empleado

#### Consultar Vehículos Disponibles
1. Iniciar sesión
2. Navegar a "Vehículos disponibles"
3. Aplicar filtros (opcional):
   - Autonomía mínima
   - Número de plazas
   - Color
   - Ciudad del concesionario
4. Visualizar detalles de cada vehículo en tarjetas

#### Realizar una Reserva
1. En la lista de vehículos, hacer clic en "Reservar"
2. Seleccionar fecha y hora de inicio
3. Seleccionar fecha y hora de fin
4. Confirmar reserva
5. La reserva aparecerá en "Mis reservas"

#### Consultar Mis Reservas
1. Navegar a "Mis reservas"
2. Ver listado de todas las reservas (activas, finalizadas, canceladas)
3. Los estados se actualizan automáticamente

### Como Administrador

#### Acceder al Panel de Administración
1. Iniciar sesión como administrador
2. Hacer clic en "Administración" en el menú

#### Gestionar Vehículos
**Crear vehículo:**
1. En el panel de administración, sección "Vehículos"
2. Hacer clic en "Nuevo vehículo"
3. Completar formulario:
   - Matrícula (obligatorio)
   - Marca (obligatorio)
   - Modelo (obligatorio)
   - Año de matriculación
   - Número de plazas
   - Autonomía en km
   - Color
   - Imagen (opcional)
   - Concesionario asignado
4. Guardar

**Editar vehículo:**
1. En la lista de vehículos, hacer clic en "Editar"
2. Modificar campos deseados
3. Guardar cambios

**Dar de baja vehículo:**
1. Hacer clic en "Eliminar" junto al vehículo
2. El vehículo quedará marcado como inactivo (baja lógica)

#### Gestionar Usuarios
**Crear usuario:**
1. En el panel de administración, hacer clic en "Nuevo usuario"
2. Completar formulario:
   - Nombre
   - Correo corporativo
   - Contraseña (cumplir requisitos)
   - Rol (Empleado/Admin)
   - Concesionario base
3. Guardar

**Editar usuario:**
1. Hacer clic en "Editar" junto al usuario
2. Modificar rol o concesionario base
3. Guardar

**Dar de baja usuario:**
1. Hacer clic en "Eliminar" junto al usuario
2. El usuario quedará inactivo (baja lógica)
3. No se puede eliminar el propio usuario administrador

#### Gestionar Concesionarios
**Crear concesionario:**
1. En el panel de administración, hacer clic en "Nuevo concesionario"
2. Completar formulario:
   - Nombre
   - Ciudad
   - Dirección
   - Teléfono de contacto
3. Guardar

**Editar concesionario:**
1. Hacer clic en "Editar" junto al concesionario
2. Modificar campos
3. Guardar

**Dar de baja concesionario:**
1. Hacer clic en "Eliminar"
2. El concesionario quedará inactivo (baja lógica)

#### Cargar Datos Iniciales
1. Navegar a "Carga inicial desde JSON"
2. Asegurar que la base de datos está vacía (usar "Vaciar BD" si es necesario)
3. Hacer clic en "Cargar datos"
4. El archivo `bd_vacia.json` se procesará automáticamente

#### Consultar Estadísticas
1. En el panel de administración, hacer clic en "Estadísticas"
2. Visualizar:
   - Total de reservas
   - Reservas activas
   - Reservas finalizadas
   - Vehículo más usado
   - Reservas por concesionario

---

## Gestión de Vehículos

### Estados de Vehículos
- **Disponible**: El vehículo está libre para reservar
- **Reservado**: El vehículo tiene una reserva activa
- **Mantenimiento**: El vehículo no está disponible
- **Inactivo**: El vehículo ha sido dado de baja (no visible)

### Filtros Disponibles
- **Autonomía mínima**: Filtrar vehículos con al menos X km de autonomía
- **Número de plazas**: Filtrar por capacidad
- **Color**: Buscar por color específico
- **Ciudad**: Filtrar por ubicación del concesionario

---

## Gestión de Reservas

### Estados de Reservas
- **Activa**: La reserva está en curso
- **Finalizada**: La reserva ha terminado (automático al pasar la fecha)
- **Cancelada**: La reserva fue cancelada manualmente

### Reglas de Reservas
- No se pueden solapar reservas del mismo vehículo
- Las fechas de inicio y fin son obligatorias
- La fecha de fin debe ser posterior a la de inicio
- Al reservar, el vehículo cambia automáticamente a estado "Reservado"

---

## Atajos de Teclado

### Atajos Predeterminados del Sistema
- **Alt + I**: Ir a Inicio
- **Alt + V**: Ir a Vehículos disponibles
- **Alt + H**: Ir a Mis reservas (empleados)
- **Alt + A**: Ir a Administración (administradores)

### Atajos Personalizables
Los usuarios pueden configurar atajos personalizados desde el menú de Accesibilidad:
- Atajo para reservar vehículo
- Atajo para ver mis reservas

### Configurar Atajos Personalizados
1. Hacer clic en el icono de accesibilidad (parte superior derecha)
2. Navegar a la sección "Atajos de teclado"
3. Ingresar combinación de teclas deseada
4. Guardar preferencias

---

## Soporte y Contacto

Para soporte técnico o consultas, contactar con el administrador del sistema.

**Usuario administrador por defecto:**
- Correo: admin@flotawei.com
- Contraseña: Admin123

---

**Versión del Manual**: 1.0  
**Última actualización**: Diciembre 2024
