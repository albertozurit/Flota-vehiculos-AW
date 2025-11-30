-- Migration: ensure required columns/tables for reservas listing
-- WARNING: review before running on production. Run on your local DB only.
-- Migration: ensure required columns/tables for reservas listing
-- WARNING: review before running on production. Run on your local DB only.

DELIMITER $$
DROP PROCEDURE IF EXISTS ensure_schema$$
CREATE PROCEDURE ensure_schema()
BEGIN
  -- 1) Add 'matricula' column to VEHICULOS if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'VEHICULOS' AND COLUMN_NAME = 'matricula'
  ) THEN
    ALTER TABLE VEHICULOS ADD COLUMN matricula VARCHAR(20) DEFAULT NULL;
  END IF;

  -- 2) Create RESERVAS table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RESERVAS'
  ) THEN
    CREATE TABLE RESERVAS (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT,
      vehiculo_id INT,
      fecha_inicio DATETIME,
      fecha_fin DATETIME,
      estado ENUM('activa','finalizada','cancelada') DEFAULT 'activa',
      km_recorridos INT,
      incidencias_reportadas VARCHAR(500),
      FOREIGN KEY (usuario_id) REFERENCES USERS(id) ON DELETE CASCADE,
      FOREIGN KEY (vehiculo_id) REFERENCES VEHICULOS(id) ON DELETE CASCADE
    );
  END IF;

  -- 3) Add 'activo' column to VEHICULOS if missing (optional)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'VEHICULOS' AND COLUMN_NAME = 'activo'
  ) THEN
    ALTER TABLE VEHICULOS ADD COLUMN activo TINYINT(1) DEFAULT 1;
  END IF;
END$$

CALL ensure_schema()$$
DROP PROCEDURE IF EXISTS ensure_schema$$
DELIMITER ;

-- End of migration
