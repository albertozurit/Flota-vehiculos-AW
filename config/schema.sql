-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS flotawei;
USE flotawei;

-- Tabla de concesionarios (debe crearse primero porque otras tablas dependen de ella)
CREATE TABLE IF NOT EXISTS CONCESIONARIOS (
    id_concesionario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(255),
    direccion VARCHAR(255),
    telefono VARCHAR(9)
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS USERS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'empleado') DEFAULT 'empleado',
    concesionario_id INT,
    preferencias_accesibilidad JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concesionario_id) REFERENCES CONCESIONARIOS(id_concesionario) ON DELETE SET NULL
);

-- Tabla de vehículos
CREATE TABLE IF NOT EXISTS VEHICULOS ( 
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    anio_matriculacion INT NOT NULL,
    color VARCHAR(50),
    num_plazas INT,
    autonomia_km INT,
    imagen_url VARCHAR(255),
    estado ENUM('disponible', 'en_mantenimiento', 'reservado') DEFAULT 'disponible',
    concesionario_id INT,
    FOREIGN KEY (concesionario_id) REFERENCES CONCESIONARIOS(id_concesionario) ON DELETE SET NULL
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS RESERVAS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    vehiculo_id INT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
    km_recorridos INT,
    incidencias_reportadas VARCHAR(500),
    FOREIGN KEY (usuario_id) REFERENCES USERS(id) ON DELETE CASCADE,
    FOREIGN KEY (vehiculo_id) REFERENCES VEHICULOS(id) ON DELETE CASCADE
);

-- Tabla de sesiones (para express-mysql-session)
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
    expires INT(11) UNSIGNED NOT NULL,
    data MEDIUMTEXT COLLATE utf8mb4_bin,
    PRIMARY KEY (session_id)
);

-- Insertar un usuario administrador por defecto (password: admin123)
INSERT INTO USERS (nombre, email, password, rol) 
VALUES ('Administrador', 'admin@flota.com', '$2b$10$8DfggNWqCqeoWf7HWvo.V.K0sYDfNEpT8pqRXYhYQTE3fjizArvxe', 'admin')
ON DUPLICATE KEY UPDATE id=id;
