# Instrucciones para configurar la Base de Datos en XAMPP

## Requisitos previos
- XAMPP instalado con Apache y MySQL activos

## Pasos para crear la base de datos

### 1. Iniciar XAMPP
- Abre el Panel de Control de XAMPP
- Inicia **Apache** y **MySQL**

### 2. Crear usuario de base de datos
Abre phpMyAdmin (http://localhost/phpmyadmin) y ejecuta:

```sql
CREATE USER 'dbuser'@'localhost' IDENTIFIED BY 'dbpass123';
GRANT ALL PRIVILEGES ON flotawei.* TO 'dbuser'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Ejecutar el script de base de datos
- En phpMyAdmin, ve a la pestaña **SQL**
- Abre el archivo `config/schema.sql`
- Copia todo su contenido
- Pégalo en el editor SQL de phpMyAdmin
- Haz clic en **Continuar** o **Go**

### 4. Verificar la creación
Deberías ver:
- Base de datos: **flotawei**
- Tablas: CONCESIONARIOS, USERS, VEHICULOS, RESERVAS, sessions
- Usuario admin creado: admin@flota.com / admin123

### 5. Iniciar la aplicación
```bash
npm install
npm start
```

La aplicación estará disponible en: http://localhost:3000

## Credenciales por defecto
- **Email**: admin@flota.com
- **Password**: admin123

## Estructura de la base de datos

### Tablas principales:
1. **CONCESIONARIOS** - Almacena información de concesionarios
2. **USERS** - Usuarios del sistema (admin/empleado)
3. **VEHICULOS** - Flota de vehículos disponibles
4. **RESERVAS** - Reservas de vehículos por usuarios
5. **sessions** - Gestión de sesiones de usuario

## Motor de base de datos
- MySQL 8.x
- Motor InnoDB (por defecto)
- Charset: utf8mb4
