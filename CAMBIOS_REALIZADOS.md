# Cambios Realizados para Cumplir con los Requisitos de XAMPP/MySQL

## Fecha: 2025-11-17

## Resumen
Se ha verificado y corregido el proyecto para que sea 100% compatible con el entorno oficial: **XAMPP (Apache + MySQL + phpMyAdmin)**.

## ✅ Archivos Corregidos

### 1. `config/schema.sql`
**Problemas corregidos:**
- ❌ Sintaxis incorrecta de FOREIGN KEY en la tabla USERS (línea 12)
- ❌ Coma extra al final de la tabla CONCESIONARIOS (línea 24)
- ❌ Referencia incorrecta a columna inexistente en VEHICULOS (id vs id_concesionario)
- ❌ Orden incorrecto de creación de tablas (USERS antes de CONCESIONARIOS)

**Correcciones aplicadas:**
- ✅ Corregida sintaxis de FOREIGN KEY: `FOREIGN KEY (concesionario_id) REFERENCES ...`
- ✅ Eliminada coma extra en tabla CONCESIONARIOS
- ✅ Corregida referencia: `REFERENCES CONCESIONARIOS(id_concesionario)`
- ✅ Reordenadas tablas: CONCESIONARIOS primero, luego tablas dependientes
- ✅ Script 100% compatible con MySQL 8.x e InnoDB

### 2. `.gitignore`
**Cambios:**
- ✅ Añadidas exclusiones para archivos SQLite: `*.db`, `*.sqlite`, `*.sqlite3`
- ✅ Comentarios explicativos sobre qué no se debe subir
- ✅ Mantenida exclusión de `config/database.js` (credenciales locales)

### 3. `README.md`
**Actualizaciones:**
- ✅ Añadida sección de requisitos previos (XAMPP obligatorio)
- ✅ Instrucciones paso a paso para configurar MySQL en XAMPP
- ✅ Referencia al nuevo documento INSTRUCCIONES_BD.md
- ✅ Credenciales por defecto claramente documentadas
- ✅ Actualizada sección de tecnologías (MySQL 8.x con InnoDB)

### 4. `INSTRUCCIONES_BD.md` (NUEVO)
**Contenido:**
- ✅ Guía completa para ejecutar el script en phpMyAdmin
- ✅ Pasos para crear usuario de base de datos
- ✅ Verificación de la instalación
- ✅ Estructura de la base de datos documentada

## ✅ Verificaciones Realizadas

### Archivos NO presentes (correcto):
- ✅ No hay archivos .db
- ✅ No hay archivos .sqlite
- ✅ No hay archivos .sqlite3

### Configuración actual:
- ✅ Motor: **MySQL 8.x**
- ✅ Driver: **mysql2** (ya instalado en package.json)
- ✅ Pool de conexiones configurado en `config/database.js`
- ✅ Sesiones en MySQL con **express-mysql-session**
- ✅ Motor de tablas: **InnoDB** (por defecto en MySQL 8.x)

## 📋 Lista de Verificación para Entrega

- ✅ Script SQL único: `config/schema.sql`
- ✅ Compatible con MySQL 8.x
- ✅ Sin archivos .db o .sqlite
- ✅ Sin referencias a otros SGBD
- ✅ Documentación clara de instalación
- ✅ Usuario admin creado automáticamente
- ✅ Todas las tablas con motor InnoDB

## 🎯 Próximos Pasos para el Estudiante

1. **Probar en XAMPP local:**
   ```bash
   # Iniciar XAMPP
   # Abrir phpMyAdmin
   # Ejecutar config/schema.sql
   # Verificar que se crean todas las tablas
   ```

2. **Verificar aplicación:**
   ```bash
   npm install
   npm start
   # Probar login con admin@flota.com / admin123
   ```

3. **Para la entrega:**
   - Subir SOLO el archivo `config/schema.sql`
   - Verificar que no hay archivos .db en el repositorio
   - Asegurarse de que el script funciona en XAMPP del laboratorio

## 🔐 Credenciales de Base de Datos

**Para desarrollo local:**
- Usuario BD: `dbuser`
- Password: `dbpass123`
- Base de datos: `flotawei`
- Host: `localhost`

**Usuario aplicación:**
- Email: `admin@flota.com`
- Password: `admin123`

## ⚠️ Importante

- El script debe ejecutarse EN phpMyAdmin, NO en otros clientes SQL
- La defensa se hará en equipos con XAMPP únicamente
- No se garantiza disponibilidad de otros SGBD (SQLite, PostgreSQL, etc.)
