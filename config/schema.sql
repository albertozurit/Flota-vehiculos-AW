-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS flotawei;
USE flotawei;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS USERS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'empleado') DEFAULT 'empleado',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
