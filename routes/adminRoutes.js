const express = require('express');
const router = express.Router();
const pool = require('../config/config');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
<<<<<<< HEAD
const {
    validarVehiculo,
    validarConcesionario,
    validarCambioRol,
    validarAsignarBase,
    handleValidationErrors
} = require('../validators/validators');
=======
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
>>>>>>> 9b46905d3d171b78bf6061f1577a56b0ba0e0657

// Helper: insertarVehiculo (mismo comportamiento que antes, ahora en admin)
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
            vehiculos: 'SELECT COUNT(*) AS c FROM Vehiculos',
            concesionarios: 'SELECT COUNT(*) AS c FROM Concesionarios',
            usuarios: 'SELECT COUNT(*) AS c FROM Usuarios',
            reservas: 'SELECT COUNT(*) AS c FROM Reservas'
        };

        connection.query(`${queries.vehiculos}; ${queries.concesionarios}; ${queries.usuarios}; ${queries.reservas}`, (err, results) => {
            connection.release();
            const stats = {};
            if (!err && Array.isArray(results)) {
                stats.vehiculos = results[0][0].c;
                stats.concesionarios = results[1][0].c;
                stats.usuarios = results[2][0].c;
                stats.reservas = results[3][0].c;
            }
            // Extra stats: reservas por concesionario y vehículo más usado
            pool.getConnection((errS, connS) => {
                const sqlResCon = `SELECT c.nombre, COUNT(r.id_reserva) AS total
                                   FROM Reservas r
                                   JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
                                   JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario
                                   GROUP BY c.id_concesionario
                                   ORDER BY total DESC`;
                const sqlTopVeh = `SELECT v.matricula, v.marca, v.modelo, COUNT(r.id_reserva) AS usos
                                   FROM Reservas r
                                   JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
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
                            const sqlVeh = 'SELECT id_vehiculo AS id, matricula, marca, modelo, numero_plazas, autonomia_km, estado FROM Vehiculos ORDER BY id_vehiculo DESC LIMIT 20';
                            const sqlCon = 'SELECT id_concesionario AS id, nombre, ciudad, direccion, telefono_contacto FROM Concesionarios ORDER BY id_concesionario DESC LIMIT 20';
                            const sqlUsr = 'SELECT id_usuario AS id, nombre, correo, rol, id_concesionario FROM Usuarios ORDER BY id_usuario DESC LIMIT 20';
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

// === Vehículos (CRUD) ===
// Listar
router.get('/vehiculos', requireAuth, requireAdmin, (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error al obtener conexión (admin/vehiculos):', err);
            return res.render('vehiculos/lista', { vehiculos: [], mensaje: 'Error en el servidor', preferencias: req.session.preferencias || {} });
        }

        const sql = `SELECT id_vehiculo AS id, matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, estado FROM Vehiculos`;
        connection.query(sql, (err, rows) => {
            connection.release();
            if (err) {
                console.error('Error consultando vehiculos (admin):', err);
                return res.render('vehiculos/lista', { vehiculos: [], mensaje: 'Error en el servidor', preferencias: req.session.preferencias || {} });
            }
            res.render('vehiculos/lista', { title: 'Gestión de Vehículos', vehiculos: rows, mensaje: null, preferencias: req.session.preferencias || {} });
        });
    });
});

// Form nuevo (reusa vista existente)
router.get('/vehiculos/nuevo', requireAuth, requireAdmin, (req, res) => {
    res.render('vehiculos/nuevo', { title: 'Nuevo Vehículo', mensaje: null, preferencias: req.session.preferencias || {} });
});

// Crear
router.post('/vehiculos/nuevo', requireAuth, requireAdmin, (req, res) => {
    const { matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color } = req.body;
    if (!matricula || !marca || !modelo) {
        return res.render('vehiculos/nuevo', { title: 'Nuevo Vehículo', mensaje: 'Completa matrícula, marca y modelo', preferencias: req.session.preferencias || {} });
    }

    const vehiculo = { matricula, marca, modelo, anio_matriculacion: anio_matriculacion || null, numero_plazas: numero_plazas ? parseInt(numero_plazas) : null, autonomia_km: autonomia_km ? parseInt(autonomia_km) : null, color: color || null, estado: 'disponible', id_concesionario: 1 };

    insertarVehiculo(vehiculo, (err, id) => {
        if (err) {
            console.error('Error insertando vehículo (admin):', err);
            return res.render('vehiculos/nuevo', { title: 'Nuevo Vehículo', mensaje: 'Error al crear vehículo', preferencias: req.session.preferencias || {} });
        }
        res.redirect('/admin/vehiculos');
    });
});

// Editar - formulario
router.get('/vehiculos/:id/editar', requireAuth, requireAdmin, (req, res) => {
    const id = req.params.id;
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin/vehiculos');
        const sql = 'SELECT id_vehiculo AS id, matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, estado FROM Vehiculos WHERE id_vehiculo = ?';
        connection.query(sql, [id], (err, rows) => {
            connection.release();
            if (err || rows.length === 0) return res.redirect('/admin/vehiculos');
            res.render('vehiculos/editar', { title: 'Editar Vehículo', vehiculo: rows[0], mensaje: null, preferencias: req.session.preferencias || {} });
        });
    });
});

// Editar - guardar
router.post('/vehiculos/:id/editar', requireAuth, requireAdmin, (req, res) => {
    const id = req.params.id;
    const { matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color } = req.body;
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin/vehiculos');
        const sql = `UPDATE Vehiculos SET matricula = ?, marca = ?, modelo = ?, anio_matriculacion = ?, numero_plazas = ?, autonomia_km = ?, color = ? WHERE id_vehiculo = ?`;
        const params = [matricula, marca, modelo, anio_matriculacion || null, numero_plazas ? parseInt(numero_plazas) : null, autonomia_km ? parseInt(autonomia_km) : null, color || null, id];
        connection.query(sql, params, (err) => {
            connection.release();
            if (err) {
                console.error('Error actualizando vehiculo (admin):', err);
            }
            res.redirect('/admin/vehiculos');
        });
    });
});

// Eliminar / baja lógica
router.post('/vehiculos/:id/eliminar', requireAuth, requireAdmin, (req, res) => {
    const id = req.params.id;
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin/vehiculos');
        const sql = `UPDATE Vehiculos SET estado = 'mantenimiento' WHERE id_vehiculo = ?`;
        connection.query(sql, [id], (err) => {
            connection.release();
            if (err) console.error('Error marcando vehiculo como mantenimiento (admin):', err);
            res.redirect('/admin/vehiculos');
        });
    });
});

// === Concesionarios (básico) ===
router.get('/concesionarios', requireAuth, requireAdmin, (req, res) => {
    return res.redirect('/admin');
});

router.get('/concesionarios/nuevo', requireAuth, requireAdmin, (req, res) => {
    res.render('admin/nuevo_concesionario', { title: 'Nuevo Concesionario', mensaje: null, preferencias: req.session.preferencias || {} });
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
router.post('/concesionarios/:id/editar', requireAuth, requireAdmin, (req, res) => {
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

// Eliminar concesionario (desde panel)
router.post('/concesionarios/:id/eliminar', requireAuth, requireAdmin, (req, res) => {
    const id = req.params.id;
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin');
        const sql = 'DELETE FROM Concesionarios WHERE id_concesionario = ?';
        connection.query(sql, [id], (err) => {
            connection.release();
            if (err) console.error('Error eliminando concesionario:', err);
            res.redirect('/admin');
        });
    });
});

// Carga inicial desde JSON cuando BD está vacía
router.get('/carga-json', (req, res) => {
    res.render('admin/carga_json', { title: 'Cargar datos iniciales', mensaje: null, preferencias: req.session.preferencias || {} });
});

router.post('/carga-json', (req, res) => {
    let datos;
    try {
        const filePath = path.join(__dirname, '..', 'bd_vacia.json');
        const raw = fs.readFileSync(filePath, 'utf8');
        datos = JSON.parse(raw || '{}');
    } catch (e) {
        req.session.mensaje = 'Error leyendo bd_vacia.json';
        return res.redirect('/');
    }
    pool.getConnection((err, connection) => {
        if (err) { req.session.mensaje = 'Error de conexión'; return res.redirect('/'); }
        const countSql = 'SELECT (SELECT COUNT(*) FROM Vehiculos) AS vehiculos, (SELECT COUNT(*) FROM Concesionarios) AS concesionarios';
        connection.query(countSql, (err, rows) => {
            if (err) { connection.release(); req.session.mensaje = 'Error comprobando BD'; return res.redirect('/'); }
            const row0 = (rows && rows[0]) || {};
            const vehCount = row0.vehiculos || 0; const conCount = row0.concesionarios || 0;
            if (vehCount > 0 || conCount > 0) { connection.release(); req.session.mensaje = 'La BD no está vacía'; return res.redirect('/'); }
            connection.beginTransaction(txErr => {
                if (txErr) { connection.release(); req.session.mensaje = 'Error iniciando transacción'; return res.redirect('/'); }
                const concesionarios = Array.isArray(datos.concesionarios) ? datos.concesionarios : [];
                const vehiculosJson = Array.isArray(datos.vehiculos) ? datos.vehiculos : [];
                const usuariosJson = Array.isArray(datos.usuarios) ? datos.usuarios : [];

                const insertarCon = concesionarios.map(c => [c.nombre || null, c.ciudad || null, c.direccion || null, c.telefono_contacto || null]);
<<<<<<< HEAD
                const insertarVeh = vehiculos.map(v => [v.matricula || null, v.marca || null, v.modelo || null, v.anio_matriculacion || null, v.numero_plazas || null, v.autonomia_km || null, v.color || null, v.imagen || null, v.estado || 'disponible', v.id_concesionario || 1]);
                const doCon = insertarCon.length ? new Promise((resolve, reject) => connection.query('INSERT INTO Concesionarios (nombre, ciudad, direccion, telefono_contacto) VALUES ?', [insertarCon], (e) => e ? reject(e) : resolve())) : Promise.resolve();
                const doVeh = insertarVeh.length ? new Promise((resolve, reject) => connection.query('INSERT INTO Vehiculos (matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario) VALUES ?', [insertarVeh], (e) => e ? reject(e) : resolve())) : Promise.resolve();
                Promise.all([doCon, doVeh]).then(() => {
                    connection.commit(cErr => {
=======

                const doCon = insertarCon.length ? new Promise((resolve,reject)=>connection.query('INSERT INTO Concesionarios (nombre, ciudad, direccion, telefono_contacto) VALUES ?',[insertarCon], (e, result)=> e?reject(e):resolve(result))) : Promise.resolve(null);

                doCon
                  .then((result)=>{
                    // Map JSON id_concesionario (1..N) to actual inserted IDs starting at result.insertId
                    const baseId = result && result.insertId ? result.insertId : null;
                    const consCount = insertarCon.length;
                    const mapId = (k)=>{
                      if (!baseId) return null;
                      const idx = (parseInt(k)||1) - 1; // JSON uses 1-based index
                      return baseId + Math.max(0, Math.min(idx, Math.max(0, consCount-1)));
                    };

                    const insertarVeh = vehiculosJson.map(v => [
                      v.matricula || null,
                      v.marca || null,
                      v.modelo || null,
                      v.anio_matriculacion || null,
                      v.numero_plazas || null,
                      v.autonomia_km || null,
                      v.color || null,
                      v.imagen || null,
                      v.estado || 'disponible',
                      mapId(v.id_concesionario || 1)
                    ]);

                    const insertarUsr = usuariosJson.map(u => [
                      u.nombre || null,
                      u.correo || null,
                      bcrypt.hashSync(u.contrasena || 'Admin1234', 10),
                      (u.rol === 'admin' ? 'admin' : 'empleado'),
                      mapId(u.id_concesionario || 1)
                    ]);

                    const doVeh = insertarVeh.length ? new Promise((resolve,reject)=>connection.query('INSERT INTO Vehiculos (matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario) VALUES ?', [insertarVeh], (e)=> e?reject(e):resolve())) : Promise.resolve();
                    const doUsr = insertarUsr.length ? new Promise((resolve,reject)=>connection.query('INSERT INTO Usuarios (nombre, correo, contrasena, rol, id_concesionario) VALUES ?', [insertarUsr], (e)=> e?reject(e):resolve())) : Promise.resolve();

                    return doVeh.then(()=> doUsr);
                  })
                  .then(()=>{
                    connection.commit(cErr=>{
>>>>>>> 9b46905d3d171b78bf6061f1577a56b0ba0e0657
                        connection.release();
                        if (cErr) { req.session.mensaje = 'Error confirmando transacción'; return res.redirect('/'); }
                        req.session.mensaje = 'Datos cargados correctamente';
                        return res.redirect('/');
                    });
<<<<<<< HEAD
                }).catch(err2 => {
                    connection.rollback(() => { connection.release(); res.render('admin/carga_json', { title: 'Cargar datos iniciales', mensaje: 'Error cargando datos: ' + (err2.message || ''), preferencias: req.session.preferencias || {} }); });
                });
=======
                  })
                  .catch(err2=>{
                    connection.rollback(()=>{ connection.release(); req.session.mensaje = 'Error cargando datos: '+(err2.message||''); return res.redirect('/'); });
                  });
>>>>>>> 9b46905d3d171b78bf6061f1577a56b0ba0e0657
            });
        });
    });
});

// === Usuarios (listado simple) ===
router.get('/usuarios', requireAuth, requireAdmin, (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) return res.render('admin/lista_usuarios', { usuarios: [], mensaje: 'Error', preferencias: req.session.preferencias || {} });
        connection.query('SELECT id_usuario, nombre, correo, rol FROM Usuarios', (err, rows) => {
            connection.release();
            if (err) {
                console.error('Error listando usuarios (admin):', err);
                return res.render('admin/lista_usuarios', { usuarios: [], mensaje: 'Error', preferencias: req.session.preferencias || {} });
            }
            console.log(rows);
            res.render('admin/lista_usuarios', { title: 'Usuarios', usuarios: rows, mensaje: null, preferencias: req.session.preferencias || {} });
        });
    });
});

module.exports = router;
