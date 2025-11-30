const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

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
            res.render('admin', { title: 'Panel de administración', stats, preferencias: req.session.preferencias || {} });
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
    pool.getConnection((err, connection) => {
        if (err) return res.render('admin/concesionarios/lista', { concesionarios: [], mensaje: 'Error', preferencias: req.session.preferencias || {} });
        connection.query('SELECT id_concesionario, nombre, ciudad, direccion, telefono_contacto FROM Concesionarios', (err, rows) => {
            connection.release();
            if (err) {
                console.error('Error listando concesionarios (admin):', err);
                return res.render('admin/concesionarios/lista', { concesionarios: [], mensaje: 'Error', preferencias: req.session.preferencias || {} });
            }
            res.render('admin/concesionarios/lista', { title: 'Concesionarios', concesionarios: rows, mensaje: null, preferencias: req.session.preferencias || {} });
        });
    });
});

router.get('/concesionarios/nuevo', requireAuth, requireAdmin, (req, res) => {
    res.render('admin/concesionarios/nuevo', { title: 'Nuevo Concesionario', mensaje: null, preferencias: req.session.preferencias || {} });
});

router.post('/concesionarios/nuevo', requireAuth, requireAdmin, (req, res) => {
    const { nombre, ciudad, direccion, telefono_contacto } = req.body;
    if (!nombre) return res.render('admin/concesionarios/nuevo', { title: 'Nuevo Concesionario', mensaje: 'Nombre requerido', preferencias: req.session.preferencias || {} });
    pool.getConnection((err, connection) => {
        if (err) return res.redirect('/admin/concesionarios');
        const sql = 'INSERT INTO Concesionarios (nombre, ciudad, direccion, telefono_contacto) VALUES (?,?,?,?)';
        connection.query(sql, [nombre, ciudad || null, direccion || null, telefono_contacto || null], (err) => {
            connection.release();
            if (err) console.error('Error creando concesionario (admin):', err);
            res.redirect('/admin/concesionarios');
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
