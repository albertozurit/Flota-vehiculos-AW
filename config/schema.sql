-- ***************************************************************
-- 1. CREACIÓN DE TABLAS (Desde la tabla principal hacia las relaciones)
-- ***************************************************************

-- 1. Tabla Concesionarios
CREATE TABLE Concesionarios (
    id_concesionario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(50) NOT NULL,
    direccion VARCHAR(255),
    telefono_contacto VARCHAR(20)
) ENGINE=InnoDB;


-- 2. Tabla Usuarios
CREATE TABLE Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE, -- Restricción: Correo ÚNICO
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('empleado', 'admin') NOT NULL DEFAULT 'empleado',
    telefono VARCHAR(20),
    id_concesionario INT NOT NULL,
    preferencias_accesibilidad TEXT      -- Para JSON o datos largos
) ENGINE=InnoDB;


-- 3. Tabla Vehiculos
CREATE TABLE Vehiculos (
    id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL UNIQUE, -- Restricción: Matrícula ÚNICA
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio_matriculacion YEAR NOT NULL,
    numero_plazas INT NOT NULL,
    autonomia_km INT,
    color VARCHAR(30),
    imagen_ruta VARCHAR(255),
    estado ENUM('disponible', 'reservado', 'mantenimiento') NOT NULL DEFAULT 'disponible',
    id_concesionario INT NOT NULL
) ENGINE=InnoDB;


-- 4. Tabla Reservas
CREATE TABLE Reservas (
    id_reserva INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_vehiculo INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    estado ENUM('activa', 'finalizada', 'cancelada') NOT NULL DEFAULT 'activa',
    kilometros_recorridos DECIMAL(10, 2),
    incidencias_reportadas TEXT
) ENGINE=InnoDB;


-- ***************************************************************
-- 2. ESTABLECER CLAVES FORÁNEAS (RELACIONES)
-- ***************************************************************

-- Relaciones para la tabla Usuarios
ALTER TABLE Usuarios
    ADD CONSTRAINT FK_Usuarios_Concesionario FOREIGN KEY (id_concesionario)
    REFERENCES Concesionarios(id_concesionario)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Relaciones para la tabla Vehiculos
ALTER TABLE Vehiculos
    ADD CONSTRAINT FK_Vehiculos_Concesionario FOREIGN KEY (id_concesionario)
    REFERENCES Concesionarios(id_concesionario)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Relaciones para la tabla Reservas
ALTER TABLE Reservas
    ADD CONSTRAINT FK_Reservas_Usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT FK_Reservas_Vehiculo FOREIGN KEY (id_vehiculo)
    REFERENCES Vehiculos(id_vehiculo)
    ON DELETE CASCADE ON UPDATE CASCADE;