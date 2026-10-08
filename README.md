# FlotaWei

Aplicación web para gestionar una flota de vehículos eléctricos repartida en varios concesionarios. Los empleados consultan vehículos, filtran por autonomía, plazas, color, ciudad y fechas, y crean o cancelan reservas. Los administradores mantienen concesionarios, vehículos y usuarios, y ven el uso de la flota.

Proyecto de la asignatura Aplicaciones Web del Grado en Ingeniería del Software (UCM).

## Autores

- [albertozurit](https://github.com/albertozurit)
- [airamsoto](https://github.com/airamsoto)

## Funcionalidad

**Empleado**

- Inicio y cierre de sesión
- Listado de vehículos y filtros (autonomía, plazas, color, ciudad, disponibilidad por fechas)
- Reserva con inicio y fin, sin solapes ni fechas pasadas
- Historial de reservas y cancelación de una reserva activa

**Administrador**

- Alta, edición y baja de vehículos, con imagen
- Alta, edición y baja de concesionarios
- Alta de usuarios con correo `@flotawei.com`, rol y concesionario base
- Carga de la flota desde JSON y vaciado de datos
- Panel con totales, reservas por concesionario y vehículo más usado

Las preferencias de accesibilidad se guardan en la sesión: alto contraste, paleta para daltonismo, tamaño de texto y atajos de teclado. El detalle está en [MANUAL_DE_ACCESIBILIDAD.md](MANUAL_DE_ACCESIBILIDAD.md). El recorrido de pantallas está en [MANUAL_DE_USO.md](MANUAL_DE_USO.md).

## Stack

- Node.js y Express 5
- Vistas EJS
- MySQL, con las sesiones guardadas en base de datos
- Contraseñas con bcrypt
- Validación con express-validator
- Subida de imágenes con multer

## Arrancar

Hace falta Node.js y un MySQL local. La conexión está en `config/config.js`: base `flotawei`, usuario `root`, sin contraseña, en `localhost`.

1. Crea la base y el esquema:

```sql
CREATE DATABASE flotawei CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE flotawei;
SOURCE config/schema.sql;
