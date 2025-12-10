const express = require('express');
const router = express.Router();
const pool = require('../config/config');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const fs = require('fs');
const path = require('path');
const upload = require('../middlewares/upload');
const {
    validarVehiculo,
    validarConcesionario,
    validarCambioRol,
    validarAsignarBase,
    handleValidationErrors
} = require('../validators/validators');

// Helper: insertarVehiculo (guarda ruta de imagen)
function insertarVehiculo(vehiculo, callback) {
    pool.getConnection((err, connection) => {
        if (err) return callback(err);

        const sql = `INSERT INTO Vehiculos (matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
                     VALUES (?,?,?,?,?,?,?,?,?,?)`;

        const params = [
            vehiculo.matricula || null,
            vehiculo.marca || null,
            vehiculo.modelo || null,
            vehiculo.anio_matriculacion || null,
            vehiculo.numero_plazas || null,
            vehiculo.autonomia_km || null,
            vehiculo.color || null,
            vehiculo.imagen || null,
            vehiculo.estado || 'disponible',
            vehiculo.id_concesionario || 1
        ];

        connection.query(sql, params, (err, results) => {
            connection.release();
            if (err) return callback(err);
            callback(null, results.insertId);
        });
    });
}

// Admin dashboard
router.get('/', requireAuth, requireAdmin, (req, res) => {
    // Simple dashboard with counts
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error al obtener conexión para admin dashboard:', err);
            return res.render('admin', { title: 'Admin', stats: {}, preferencias: req.session.preferencias || {} });
        }

        const queries = {
            vehiculos: "SELECT COUNT(*) AS c FROM Vehiculos WHERE activo = 1 AND estado IN ('disponible')",
            concesionarios: 'SELECT COUNT(*) AS c FROM Concesionarios WHERE activo = 1',
            usuarios: 'SELECT COUNT(*) AS c FROM Usuarios WHERE activo = 1',
            reservas: 'SELECT COUNT(*) AS c FROM Reservas'
        };

        // Ejecutar consultas por separado
        connection.query(queries.vehiculos, (err1, rows1) => {
            connection.query(queries.concesionarios, (err2, rows2) => {
                connection.query(queries.usuarios, (err3, rows3) => {
                    connection.query(queries.reservas, (err4, rows4) => {
                        connection.release();

                        const stats = {};
                        stats.vehiculos = (!err1 && rows1 && rows1[0]) ? rows1[0].c : 0;
                        stats.concesionarios = (!err2 && rows2 && rows2[0]) ? rows2[0].c : 0;
                        stats.usuarios = (!err3 && rows3 && rows3[0]) ? rows3[0].c : 0;
                        stats.reservas = (!err4 && rows4 && rows4[0]) ? rows4[0].c : 0;

                        // Extra stats: reservas por concesionario y vehículo más usado
                        pool.getConnection((errS, connS) => {
                            const sqlResCon = `SELECT c.nombre, c.ciudad, COUNT(r.id_reserva) AS num_reservas
                                           FROM Reservas r
                                           JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo AND v.activo = 1
                                           JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario AND c.activo = 1
                                           GROUP BY c.id_concesionario
                                           ORDER BY num_reservas DESC`;
                            const sqlTopVeh = `SELECT v.matricula, v.marca, v.modelo, COUNT(r.id_reserva) AS usos
                                           FROM Reservas r
                                           JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo AND v.activo = 1
                                           GROUP BY v.id_vehiculo
                                           ORDER BY usos DESC
                                           LIMIT 1`;
                            if (errS) {
                                stats.reservasPorConcesionario = [];
                                stats.vehiculoMasUsado = null;
                            } else {
                                connS.query(sqlResCon, (eA, rowsA) => {
                                    connS.query(sqlTopVeh, (eB, rowsB) => {
                                        connS.release();
                                        stats.reservasPorConcesionario = eA ? [] : (rowsA || []);
                                        stats.vehiculoMasUsado = eB ? null : ((rowsB && rowsB[0]) || null);
                                        // Also show short lists on dashboard (avoid multi-statements)
                                        const sqlVeh = 'SELECT v.id_vehiculo AS id, v.matricula, v.marca, v.modelo, v.anio_matriculacion, v.numero_plazas, v.autonomia_km, v.color, v.imagen, v.estado, c.nombre AS concesionario_nombre FROM Vehiculos v LEFT JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario WHERE v.activo = 1 ORDER BY v.id_vehiculo DESC';
                                        const sqlCon = 'SELECT id_concesionario AS id, nombre, ciudad, direccion, telefono_contacto FROM Concesionarios WHERE activo = 1 ORDER BY nombre ASC';
                                        const sqlUsr = 'SELECT u.id_usuario AS id, u.nombre, u.correo, u.rol, u.id_concesionario, c.nombre AS concesionario_nombre FROM Usuarios u LEFT JOIN Concesionarios c ON u.id_concesionario = c.id_concesionario WHERE u.activo = 1 ORDER BY u.id_usuario DESC LIMIT 20';
                                        pool.getConnection((err2, conn2) => {
                                            if (err2) {
                                                return res.render('admin', { title: 'Panel de administración', stats, vehiculos: [], concesionarios: [], usuarios: [], preferencias: req.session.preferencias || {} });
                                            }
                                            conn2.query(sqlVeh, (e1, rowsVeh) => {
                                                conn2.query(sqlCon, (e2, rowsCon) => {
                                                    conn2.query(sqlUsr, (e3, rowsUsr) => {
                                                        conn2.release();
                                                        const vehiculos = e1 ? [] : (rowsVeh || []);
                                                        const concesionarios = e2 ? [] : (rowsCon || []);
                                                        const usuarios = e3 ? [] : (rowsUsr || []);
                                                        res.render('admin', { title: 'Panel de administración', stats, vehiculos, concesionarios, usuarios, preferencias: req.session.preferencias || {} });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    });
                });
            });
        });
    });
});

// === Usuarios (acciones rápidas) ===
router.post('/usuarios/:id/rol', requireAuth, requireAdmin, validarCambioRol, handleValidationErrors, (req, res) => {
    if (req.validationErrors) {
        return res.redirect('/admin');
    }

    const id = parseInt(req.params.id);
    const rol = req.body.rol === 'admin' ? 'admin' : 'empleado';
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin');
        connection.query('UPDATE Usuarios SET rol = ? WHERE id_usuario = ?', [rol, id], (e) => {
            connection.release();
            if (e) console.error('Error actualizando rol:', e);
            // Sincronizar sesión si el admin se edita a sí mismo
            if (req.session && req.session.usuario && req.session.usuario.id === id) {
                req.session.usuario.rol = rol;
            }
            // Si el usuario editado ya no es admin y es el mismo, evitar bucle en /admin
            if (req.session && req.session.usuario && req.session.usuario.id === id && rol !== 'admin') {
                return res.redirect('/');
            }
            res.redirect('/admin');
        });
    });
});

router.post('/usuarios/:id/base', requireAuth, requireAdmin, validarAsignarBase, handleValidationErrors, (req, res) => {
    if (req.validationErrors) {
        return res.redirect('/admin');
    }

    const id = parseInt(req.params.id);
    const base = parseInt(req.body.id_concesionario) || null;
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin');
        connection.query('UPDATE Usuarios SET id_concesionario = ? WHERE id_usuario = ?', [base, id], (e) => {
            connection.release();
            if (e) console.error('Error asignando base:', e);
            if (req.session && req.session.usuario && req.session.usuario.id === id) {
                req.session.usuario.id_concesionario = base;
            }
            res.redirect('/admin');
        });
    });
});

// Ruta combinada para editar rol y concesionario desde el modal
router.post('/usuarios/:id/editar', requireAuth, requireAdmin, validarCambioRol, validarAsignarBase, handleValidationErrors, (req, res) => {
    if (req.validationErrors) {
        console.warn('Errores de validación en editar usuario:', req.validationMessage);
        return res.redirect('/admin');
    }
    const id = parseInt(req.params.id);
    const rol = req.body.rol === 'admin' ? 'admin' : 'empleado';
    const idConcesionario = req.body.id_concesionario ? parseInt(req.body.id_concesionario) : null;

    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin');

        connection.query(
            'UPDATE Usuarios SET rol = ?, id_concesionario = ? WHERE id_usuario = ?',
            [rol, idConcesionario, id],
            (e) => {
                connection.release();
                if (e) {
                    console.error('Error actualizando usuario:', e);
                    return res.redirect('/admin');
                }

                // Sincronizar sesión si el admin se edita a sí mismo
                if (req.session && req.session.usuario && req.session.usuario.id === id) {
                    req.session.usuario.rol = rol;
                    req.session.usuario.id_concesionario = idConcesionario;
                }

                // Si el usuario editado ya no es admin y es el mismo, redirigir a inicio
                if (req.session && req.session.usuario && req.session.usuario.id === id && rol !== 'admin') {
                    return res.redirect('/');
                }

                res.redirect('/admin');
            }
        );
    });
});

// Baja lógica de usuario
router.post('/usuarios/:id/eliminar', requireAuth, requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);

    // Evitar que el admin se elimine a sí mismo
    if (req.session && req.session.usuario && req.session.usuario.id === id) {

        return res.redirect('/admin');
    }

    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin');

        connection.query('UPDATE Usuarios SET activo = 0 WHERE id_usuario = ?', [id], (e) => {
            connection.release();
            if (e) {
                console.error('Error dando de baja usuario:', e);
            }
            res.redirect('/admin');
        });
    });
});

// === Vehículos (CRUD) ===
// Redirigir a /admin (ya no se usa vista separada)
router.get('/vehiculos', requireAuth, requireAdmin, (req, res) => {
    return res.redirect('/admin');
});

// Crear vehículo 
router.post('/vehiculos/nuevo', requireAuth, requireAdmin, upload.single('imagen'), validarVehiculo, handleValidationErrors, (req, res) => {

    if (req.validationErrors && req.validationErrors.length > 0) {
        return res.status(400).json({ error: req.validationMessage });
    }

    const { matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, id_concesionario } = req.body;

    // Validación manual adicional
    if (!matricula || matricula.length !== 7) {
        return res.status(400).json({ error: 'La matrícula debe tener exactamente 7 caracteres' });
    }

    if (!matricula || !marca || !modelo) {
        return res.status(400).json({ error: 'Completa matrícula, marca y modelo' });
    }

    const imagenPath = req.file ? '/images/vehiculos/' + req.file.filename : null;

    const vehiculo = {
        matricula,
        marca,
        modelo,
        anio_matriculacion: anio_matriculacion || null,
        numero_plazas: numero_plazas ? parseInt(numero_plazas) : null,
        autonomia_km: autonomia_km ? parseInt(autonomia_km) : null,
        color: color || null,
        imagen: imagenPath,
        estado: 'disponible',
        id_concesionario: parseInt(id_concesionario) || 1
    };

    insertarVehiculo(vehiculo, (err, id) => {
        if (err) {
            console.error('Error insertando vehículo:', err);
            return res.status(500).json({ error: 'Error al crear vehículo: ' + (err.message || 'Error desconocido') });
        }
        res.json({ success: true, id });
    });
});


// Baja lógica de vehículo
router.post('/vehiculos/:id/eliminar', requireAuth, requireAdmin, (req, res) => {
    const id = req.params.id;
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin');
        const sql = `UPDATE Vehiculos SET activo = 0 WHERE id_vehiculo = ?`;
        connection.query(sql, [id], (err) => {
            connection.release();
            if (err) console.error('Error dando de baja vehículo:', err);
            res.redirect('/admin');
        });
    });
});

// === Concesionarios (básico) ===
router.get('/concesionarios', requireAuth, requireAdmin, (req, res) => {
    return res.redirect('/admin');
});

router.post('/concesionarios/nuevo', requireAuth, requireAdmin, validarConcesionario, handleValidationErrors, (req, res) => {
    // Si hay errores de validación
    if (req.validationErrors) {
        return res.render('admin/nuevo_concesionario', {
            title: 'Nuevo Concesionario',
            mensaje: req.validationMessage,
            preferencias: req.session.preferencias || {}
        });
    }

    const { nombre, ciudad, direccion, telefono_contacto } = req.body;
    if (!nombre) return res.redirect('/admin');
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin');
        const sql = 'INSERT INTO Concesionarios (nombre, ciudad, direccion, telefono_contacto) VALUES (?,?,?,?)';
        connection.query(sql, [nombre, ciudad || null, direccion || null, telefono_contacto || null], (err) => {
            connection.release();
            if (err) console.error('Error creando concesionario (admin):', err);
            res.redirect('/admin');
        });
    });
});

// Editar concesionario (desde panel)
router.post('/concesionarios/:id/editar', requireAuth, requireAdmin, validarConcesionario, handleValidationErrors, (req, res) => {
    if (req.validationErrors) {
        console.warn('Errores de validación en editar concesionario:', req.validationMessage);
        return res.redirect('/admin');
    }
    const id = req.params.id;
    const { nombre, ciudad, direccion, telefono_contacto } = req.body;
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin');
        const sql = 'UPDATE Concesionarios SET nombre=?, ciudad=?, direccion=?, telefono_contacto=? WHERE id_concesionario=?';
        connection.query(sql, [nombre || null, ciudad || null, direccion || null, telefono_contacto || null, id], (err) => {
            connection.release();
            if (err) console.error('Error actualizando concesionario:', err);
            res.redirect('/admin');
        });
    });
});

// Baja lógica de concesionario
router.post('/concesionarios/:id/eliminar', requireAuth, requireAdmin, (req, res) => {
    const id = req.params.id;
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin');
        const sql = 'UPDATE Concesionarios SET activo = 0 WHERE id_concesionario = ?';
        connection.query(sql, [id], (err) => {
            connection.release();
            if (err) console.error('Error dando de baja concesionario:', err);
            res.redirect('/admin');
        });
    });
});

// Carga inicial desde JSON cuando BD está vacía
router.get('/carga-json', requireAuth, requireAdmin, (req, res) => {
    res.render('admin/carga_json', { title: 'Cargar datos iniciales', mensaje: null, preferencias: req.session.preferencias || {} });
});

// Ruta para vaciar la BD
router.post('/vaciar-bd', requireAuth, requireAdmin, (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            return res.render('admin/carga_json', {
                title: 'Cargar datos iniciales',
                mensaje: 'Error de conexión',
                tipo: 'danger',
                preferencias: req.session.preferencias || {}
            });
        }

        connection.beginTransaction(txErr => {
            if (txErr) {
                connection.release();
                return res.render('admin/carga_json', {
                    title: 'Cargar datos iniciales',
                    mensaje: 'Error iniciando transacción',
                    tipo: 'danger',
                    preferencias: req.session.preferencias || {}
                });
            }

            // Orden importante: primero las que tienen FK
            // NOTA: NO se borran usuarios (FK con ON DELETE SET NULL)
            const queries = [
                'DELETE FROM Reservas',
                'DELETE FROM Vehiculos',
                'DELETE FROM Concesionarios',  // Los usuarios quedarán con id_concesionario = NULL automáticamente
                'ALTER TABLE Concesionarios AUTO_INCREMENT = 1',
                'ALTER TABLE Vehiculos AUTO_INCREMENT = 1'
            ];

            let completed = 0;
            queries.forEach((sql, index) => {
                connection.query(sql, (err) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            res.render('admin/carga_json', {
                                title: 'Cargar datos iniciales',
                                mensaje: `Error vaciando BD: ${err.message}`,
                                tipo: 'danger',
                                preferencias: req.session.preferencias || {}
                            });
                        });
                    }

                    completed++;
                    if (completed === queries.length) {
                        connection.commit((cErr) => {
                            connection.release();
                            if (cErr) {
                                return res.render('admin/carga_json', {
                                    title: 'Cargar datos iniciales',
                                    mensaje: 'Error confirmando cambios',
                                    tipo: 'danger',
                                    preferencias: req.session.preferencias || {}
                                });
                            }
                            res.render('admin/carga_json', {
                                title: 'Cargar datos iniciales',
                                mensaje: 'Base de datos vaciada correctamente. Ahora puedes cargar los datos del JSON.',
                                tipo: 'success',
                                preferencias: req.session.preferencias || {}
                            });
                        });
                    }
                });
            });
        });
    });
});

router.post('/carga-json', requireAuth, requireAdmin, (req, res) => {
    let datos;
    try {
        const filePath = path.join(__dirname, '..', 'bd_vacia.json');
        const raw = fs.readFileSync(filePath, 'utf8');
        datos = JSON.parse(raw || '{}');
    } catch (e) {
        return res.render('admin/carga_json', {
            title: 'Cargar datos iniciales',
            mensaje: 'Error: No se pudo leer el archivo bd_vacia.json. Verifica que existe en la raíz del proyecto.',
            tipo: 'danger',
            preferencias: req.session.preferencias || {}
        });
    }
    pool.getConnection((err, connection) => {
        if (err) {
            return res.render('admin/carga_json', {
                title: 'Cargar datos iniciales',
                mensaje: 'Error: No se pudo conectar a la base de datos.',
                tipo: 'danger',
                preferencias: req.session.preferencias || {}
            });
        }
        const countSql = 'SELECT (SELECT COUNT(*) FROM Vehiculos) AS vehiculos, (SELECT COUNT(*) FROM Concesionarios) AS concesionarios';
        connection.query(countSql, (err, rows) => {
            if (err) {
                connection.release();
                return res.render('admin/carga_json', {
                    title: 'Cargar datos iniciales',
                    mensaje: 'Error: No se pudo verificar el estado de la base de datos.',
                    tipo: 'danger',
                    preferencias: req.session.preferencias || {}
                });
            }
            const row0 = (rows && rows[0]) || {};
            const vehCount = row0.vehiculos || 0; const conCount = row0.concesionarios || 0;
            if (vehCount > 0 || conCount > 0) {
                connection.release();
                return res.render('admin/carga_json', {
                    title: 'Cargar datos iniciales',
                    mensaje: `La base de datos NO está vacía (${vehCount} vehículos, ${conCount} concesionarios). Usa el botón "Vaciar BD" primero.`,
                    tipo: 'warning',
                    preferencias: req.session.preferencias || {}
                });
            }
            connection.beginTransaction(txErr => {
                if (txErr) {
                    connection.release();
                    return res.render('admin/carga_json', {
                        title: 'Cargar datos iniciales',
                        mensaje: 'Error: No se pudo iniciar la transacción en la base de datos.',
                        tipo: 'danger',
                        preferencias: req.session.preferencias || {}
                    });
                }
                const concesionarios = Array.isArray(datos.concesionarios) ? datos.concesionarios : [];
                const vehiculosJson = Array.isArray(datos.vehiculos) ? datos.vehiculos : [];
                const usuariosJson = Array.isArray(datos.usuarios) ? datos.usuarios : [];

                const insertarCon = concesionarios.map(c => [c.nombre || null, c.ciudad || null, c.direccion || null, c.telefono_contacto || null]);
                const insertarVeh = vehiculosJson.map(v => [v.matricula || null, v.marca || null, v.modelo || null, v.anio_matriculacion || null, v.numero_plazas || null, v.autonomia_km || null, v.color || null, v.imagen || null, v.estado || 'disponible', v.id_concesionario || 1]);
                const insertarUsr = usuariosJson.map(u => [u.nombre || null, u.correo || null, u.contrasena || null, u.rol || 'empleado', u.telefono || null, u.id_concesionario || null, u.preferencias_accesibilidad || null]);

                // Función async para ejecutar en orden
                (async () => {
                    try {
                        // 1. Insertar concesionarios PRIMERO
                        if (insertarCon.length > 0) {
                            await new Promise((resolve, reject) => {
                                connection.query('INSERT INTO Concesionarios (nombre, ciudad, direccion, telefono_contacto) VALUES ?', [insertarCon], (err, result) => {
                                    if (err) return reject(err);
                                    resolve(result);
                                });
                            });
                        }

                        // 2. Insertar usuarios (después de concesionarios)
                        if (insertarUsr.length > 0) {
                            await new Promise((resolve, reject) => {
                                connection.query('INSERT INTO Usuarios (nombre, correo, contrasena, rol, telefono, id_concesionario, preferencias_accesibilidad) VALUES ?', [insertarUsr], (err, result) => {
                                    if (err) return reject(err);
                                    resolve(result);
                                });
                            });
                        }

                        // 3. Insertar vehículos (al final)
                        if (insertarVeh.length > 0) {
                            await new Promise((resolve, reject) => {
                                connection.query('INSERT INTO Vehiculos (matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario) VALUES ?', [insertarVeh], (err, result) => {
                                    if (err) return reject(err);
                                    resolve(result);
                                });
                            });
                        }

                        // 4. Confirmar transacción
                        connection.commit(cErr => {
                            connection.release();
                            if (cErr) {
                                return res.render('admin/carga_json', {
                                    title: 'Cargar datos iniciales',
                                    mensaje: 'Error: No se pudieron confirmar los cambios. Inténtalo de nuevo.',
                                    tipo: 'danger',
                                    preferencias: req.session.preferencias || {}
                                });
                            }
                            return res.render('admin/carga_json', {
                                title: 'Cargar datos iniciales',
                                mensaje: `Éxito: Se cargaron ${concesionarios.length} concesionarios, ${usuariosJson.length} usuarios y ${vehiculosJson.length} vehículos correctamente.`,
                                tipo: 'success',
                                preferencias: req.session.preferencias || {}
                            });
                        });
                    } catch (err2) {
                        connection.rollback(() => {
                            connection.release();
                            res.render('admin/carga_json', {
                                title: 'Cargar datos iniciales',
                                mensaje: `Error: ${err2.message || 'Error desconocido'}. Verifica que la base de datos esté vacía y el JSON sea válido.`,
                                tipo: 'danger',
                                preferencias: req.session.preferencias || {}
                            });
                        });
                    }
                })();
            });
        });
    });
});

// === Usuarios (listado simple) ===
router.get('/usuarios', requireAuth, requireAdmin, (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) return res.render('admin/lista_usuarios', { usuarios: [], mensaje: 'Error', preferencias: req.session.preferencias || {} });
        connection.query('SELECT id_usuario, nombre, correo, rol FROM Usuarios WHERE activo = 1', (err, rows) => {
            connection.release();
            if (err) {
                console.error('Error listando usuarios (admin):', err);
                return res.render('admin/lista_usuarios', { usuarios: [], mensaje: 'Error', preferencias: req.session.preferencias || {} });
            }
            res.render('admin/lista_usuarios', { title: 'Usuarios', usuarios: rows, mensaje: null, preferencias: req.session.preferencias || {} });
        });
    });
});

// === Estadísticas ===
router.get('/estadisticas', requireAuth, requireAdmin, (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            return res.render('admin/estadisticas', {
                title: 'Estadísticas',
                estadisticas: {
                    totalReservas: 0,
                    reservasActivas: 0,
                    reservasFinalizadas: 0,
                    vehiculoMasUsado: null,
                    reservasPorConcesionario: []
                },
                preferencias: req.session.preferencias || {}
            });
        }

        // Primero actualizar reservas expiradas
        const updateSql = `
            UPDATE Reservas 
            SET estado = 'finalizada' 
            WHERE estado = 'activa' AND fecha_fin < NOW()
        `;

        connection.query(updateSql, (updateErr) => {
            if (updateErr) {
                console.error('Error actualizando reservas expiradas:', updateErr);
            }

            // Consultas de estadísticas
            const sqlTotal = `SELECT COUNT(*) AS total FROM Reservas`;
            const sqlActivas = `SELECT COUNT(*) AS total FROM Reservas WHERE estado = 'activa'`;
            const sqlFinalizadas = `SELECT COUNT(*) AS total FROM Reservas WHERE estado = 'finalizada'`;
            const sqlVehiculoMasUsado = `
                SELECT v.matricula, v.marca, v.modelo, v.color, c.nombre AS nombre_concesionario, c.ciudad, 
                       COUNT(r.id_reserva) AS num_reservas
                FROM Reservas r
                JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo AND v.activo = 1
                JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario AND c.activo = 1
                GROUP BY v.id_vehiculo
                ORDER BY num_reservas DESC
                LIMIT 1
            `;
            const sqlReservasPorConcesionario = `
                SELECT c.nombre, c.ciudad, COUNT(r.id_reserva) AS num_reservas
                FROM Reservas r
                JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo AND v.activo = 1
                JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario AND c.activo = 1
                GROUP BY c.id_concesionario
                ORDER BY num_reservas DESC
            `;

            connection.query(sqlTotal, (err1, rows1) => {
                connection.query(sqlActivas, (err2, rows2) => {
                    connection.query(sqlFinalizadas, (err3, rows3) => {
                        connection.query(sqlVehiculoMasUsado, (err4, rows4) => {
                            connection.query(sqlReservasPorConcesionario, (err5, rows5) => {
                                connection.release();

                                const estadisticas = {
                                    totalReservas: (!err1 && rows1 && rows1[0]) ? rows1[0].total : 0,
                                    reservasActivas: (!err2 && rows2 && rows2[0]) ? rows2[0].total : 0,
                                    reservasFinalizadas: (!err3 && rows3 && rows3[0]) ? rows3[0].total : 0,
                                    vehiculoMasUsado: (!err4 && rows4 && rows4[0]) ? rows4[0] : null,
                                    reservasPorConcesionario: (!err5 && rows5) ? rows5 : []
                                };

                                res.render('admin/estadisticas', {
                                    title: 'Estadísticas',
                                    estadisticas,
                                    preferencias: req.session.preferencias || {}
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
