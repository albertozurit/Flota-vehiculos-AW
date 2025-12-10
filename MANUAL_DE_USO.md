# Manual de Uso - FlotaWei

Sistema de gestión de flota de vehículos eléctricos para la empresa FlotaWei.

## Inicio Rápido

### Acceder al Sistema
- URL: http://localhost:3000
- Administrador por defecto:
  - Email: admin@flotawei.com
  - Contraseña: Admin123

### Carga Inicial de Datos (Primera vez)
1. Inicia sesión como administrador
2. Ve a Panel de Administrador y selecciona Cargar datos (JSON)
3. Selecciona el archivo datos.json
4. Haz clic en Cargar datos

---

## Funcionalidades por Rol

### EMPLEADO

#### Registrarse
1. Haz clic en Registrarse
2. Completa el formulario:
   - Email corporativo (debe terminar en @flotawei.com)
   - Contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número)
   - Nombre completo
3. Haz clic en Registrarse

#### Ver Vehículos Disponibles
1. Inicia sesión
2. Ve a Vehículos en el menú
3. Verás todas las tarjetas de vehículos disponibles

#### Filtrar Vehículos
1. En la vista de vehículos, haz clic en Filtros
2. Selecciona los criterios que necesites:
   - Autonomía mínima en kilómetros
   - Número de plazas
   - Color
   - Ciudad
   - Fechas de disponibilidad
3. Haz clic en Aplicar filtros

#### Reservar un Vehículo
1. En la tarjeta del vehículo, haz clic en Reservar
2. Se abrirá un formulario donde debes completar:
   - Fecha y hora de inicio
   - Fecha y hora de fin
   - Teléfono (opcional)
   - Acepta las condiciones de uso
3. Haz clic en Reservar
4. El vehículo cambiará automáticamente a estado "Reservado"

#### Ver Mis Reservas
1. Ve a Reservas en el menú
2. Verás tu historial completo de reservas: activas, finalizadas y canceladas

#### Cancelar Reserva
1. En Reservas, busca la reserva activa que quieres cancelar
2. Haz clic en Cancelar
3. Confirma la acción

---

### ADMINISTRADOR

El administrador tiene acceso a todas las funcionalidades de empleado, además de:

#### Panel de Administración
1. Haz clic en Panel de Administrador
2. Verás las siguientes estadísticas:
   - Total de vehículos
   - Total de concesionarios
   - Total de usuarios
   - Total de reservas
   - Reservas por concesionario
   - Vehículo más usado

#### Gestión de Vehículos

Alta de vehículo:
1. En el Panel, haz clic en Alta vehículo
2. Completa el formulario con los siguientes datos:
   - Matrícula (exactamente 7 caracteres)
   - Marca
   - Modelo
   - Año (entre 1900 y 2100)
   - Plazas (entre 1 y 9)
   - Autonomía (1-10000 km)
   - Color
   - Imagen (opcional)
   - Concesionario asignado
3. Haz clic en Crear

Editar vehículo:
1. En la tabla de vehículos, localiza el vehículo
2. Haz clic en Editar
3. Modifica los campos necesarios
4. Haz clic en Guardar cambios

Dar de baja vehículo:
1. En la tabla de vehículos, haz clic en Baja
2. Confirma la acción

#### Gestión de Concesionarios

Alta:
1. Completa el formulario en la sección de concesionarios:
   - Nombre
   - Ciudad
   - Dirección
   - Teléfono
2. Haz clic en Crear concesionario

Editar:
1. Haz clic en Editar en la tabla
2. Modifica los datos necesarios
3. Haz clic en Guardar cambios

Baja:
1. Haz clic en Baja
2. Confirma la acción

#### Gestión de Usuarios

Crear usuario:
1. Haz clic en Crear usuario
2. Completa los datos:
   - Nombre
   - Email corporativo
   - Contraseña
   - Concesionario base
   - Rol (empleado o administrador)
3. Haz clic en Crear

Editar usuario:
1. Haz clic en Editar
2. Modifica el rol o el concesionario base asignado
3. Haz clic en Guardar cambios

#### Estadísticas
En el panel principal se muestran automáticamente:
- Tabla de reservas por concesionario (nombre, ciudad y número de reservas)
- Vehículo más usado (muestra marca, modelo, matrícula y número total de usos)

---

## Accesibilidad

### Activar Opciones de Accesibilidad
1. Haz clic en el botón de Accesibilidad en la esquina superior
2. En el modal que se abre, puedes seleccionar:
   
   Modos de visualización:
   - Alto contraste: fondo blanco con texto negro
   - Modo daltonismo: esquema de colores adaptado
   
   Tamaño de texto:
   - Pequeño (80%)
   - Normal (100%)
   - Grande (120%)
   
   Atajos de teclado:
   - Puedes personalizar las teclas para realizar acciones rápidas
   - Usa la tecla Tab para navegar entre elementos

3. Haz clic en Guardar preferencias
4. Tus preferencias se guardarán en tu cuenta y se aplicarán automáticamente en futuras sesiones

---

## Seguridad

### Cerrar Sesión
- Haz clic en tu nombre en la esquina superior derecha
- Selecciona Cerrar sesión

### Cambiar Contraseña
- Contacta con el administrador del sistema para solicitar el restablecimiento de tu contraseña

---

## Validaciones del Sistema

### Matrícula de vehículo
- Debe tener exactamente 7 caracteres (letras y números)
- No se aceptan matrículas de más o menos caracteres

### Fechas de reserva
- La fecha de fin debe ser posterior a la fecha de inicio
- No se permiten reservas en fechas pasadas
- No se permiten reservas que se solapen con otras existentes

### Contraseñas
- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 número

### Email corporativo
- Debe terminar obligatoriamente en @flotawei.com

---

## Diseño Responsive

El sistema se adapta automáticamente a diferentes dispositivos:
- Ordenadores de escritorio
- Tablets
- Teléfonos móviles

---

## Solución de Problemas Comunes

### No puedo iniciar sesión
- Verifica que tu email termine en @flotawei.com
- Asegúrate de que la contraseña cumpla los requisitos mínimos
- Si persiste el problema, contacta con el administrador

### No veo vehículos disponibles
- Revisa si hay filtros aplicados que puedan estar limitando los resultados
- Comprueba las fechas seleccionadas en el filtro
- Es posible que todos los vehículos estén reservados en ese momento

### Error al crear un vehículo
- Verifica que la matrícula tenga exactamente 7 caracteres
- Asegúrate de completar todos los campos obligatorios
- Comprueba que el año esté entre 1900 y 2100
- Verifica que el número de plazas esté entre 1 y 9

---

## Datos de Ejemplo

Administrador por defecto:
- Email: admin@flotawei.com
- Contraseña: Admin123

Empleados de ejemplo (crear manualmente si es necesario):
- juan@flotawei.com
- maria@flotawei.com

Al cargar el archivo JSON se importarán automáticamente:
- Concesionarios: Madrid Centro, Barcelona Norte, Valencia Sur
- Vehículos: Tesla Model 3, Nissan Leaf, BMW i3, entre otros

---

## Funcionalidades Implementadas

El sistema incluye todas las siguientes funcionalidades:

- Registro, inicio y cierre de sesión con seguridad
- Carga inicial de datos desde archivo JSON
- Listado completo de vehículos con sistema de filtros
- Sistema de reservas de vehículos
- Gestión dinámica de disponibilidad según las fechas
- Panel de administración completo
- Gestión de vehículos (alta, edición y baja)
- Gestión de concesionarios (alta, edición y baja)
- Gestión de usuarios
- Estadísticas administrativas (reservas por concesionario y vehículo más usado)
- Sistema de accesibilidad (contraste, tamaño de fuente, navegación por teclado)
- Diseño responsive que se adapta a cualquier dispositivo
- Validaciones completas en todos los formularios

---

Para cualquier consulta o problema técnico, contacta con el administrador del sistema.

Versión: 1.0.0
Última actualización: Diciembre 2025
