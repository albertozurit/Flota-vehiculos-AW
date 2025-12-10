const express = require('express');
const router = express.Router();
const pool = require('../config/config');
const { requireAuth } = require('../middlewares/auth');

// GET /reservas/nuevo/:id - Devuelve el formulario de reserva para AJAX
router.get('/nuevo/:id', requireAuth, (req, res) => {
    const vehiculoId = parseInt(req.params.id);

    if (!vehiculoId || isNaN(vehiculoId)) {
        return res.status(400).send('<div class="alert alert-danger">ID de vehículo inválido</div>');
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error de conexión:', err);
            return res.status(500).send('<div class="alert alert-danger">Error de conexión</div>');
        }

        const sql = `SELECT v.id_vehiculo AS id, v.matricula, v.marca, v.modelo, v.anio_matriculacion, 
                     v.numero_plazas, v.autonomia_km, v.color, v.estado, 
                     c.nombre AS concesionario_nombre, c.ciudad AS concesionario_ciudad
                     FROM Vehiculos v
                     LEFT JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario
                     WHERE v.id_vehiculo = ? AND v.activo = 1`;

        connection.query(sql, [vehiculoId], (err, rows) => {
            connection.release();

            if (err) {
                console.error('Error consultando vehículo:', err);
                return res.status(500).send('<div class="alert alert-danger">Error al cargar el vehículo</div>');
            }

            if (!rows || rows.length === 0) {
                return res.status(404).send('<div class="alert alert-danger">Vehículo no encontrado</div>');
            }

            const vehiculo = rows[0];

            // Renderizar solo el formulario (sin layout completo)
            res.render('reservas/reservas_formulario', {
                vehiculo: vehiculo,
                usuario: req.session.usuario,
                preferencias: req.session.preferencias || {}
            });
        });
    });
});

// Cancelar reserva (solo empleados, propia)
router.post('/cancelar/:id', (req, res) => {
    const idReserva = parseInt(req.params.id);
    if (!req.session || !req.session.usuario) {
        return res.status(401).send('No autorizado');
    }
    if (req.session.usuario.rol !== 'empleado') {
        return res.status(403).send('No permitido');
    }
    const userId = req.session.usuario.id;
    if (!idReserva || isNaN(idReserva)) {
        req.session.mensaje = 'Reserva inválida';
        return res.redirect('/reservas');
    }
    pool.getConnection((err, connection) => {
        if (err) { req.session.mensaje = 'Error de conexión'; return res.redirect('/reservas'); }
        connection.beginTransaction(txErr => {
            if (txErr) { connection.release(); req.session.mensaje = 'Error iniciando cancelación'; return res.redirect('/reservas'); }
            // Obtener el vehículo de la reserva del usuario
            connection.query('SELECT id_vehiculo FROM Reservas WHERE id_reserva = ? AND id_usuario = ? FOR UPDATE', [idReserva, userId], (eSel, rows) => {
                if (eSel) { return connection.rollback(() => { connection.release(); req.session.mensaje = 'Error localizando la reserva'; return res.redirect('/reservas'); }); }
                if (!rows || rows.length === 0) { return connection.rollback(() => { connection.release(); req.session.mensaje = 'Reserva no encontrada o no autorizada'; return res.redirect('/reservas'); }); }
                const idVehiculo = rows[0].id_vehiculo;
                // Marcar reserva como cancelada
                connection.query("UPDATE Reservas SET estado = 'Cancelada' WHERE id_reserva = ? AND id_usuario = ?", [idReserva, userId], (eUpd) => {
                    if (eUpd) { return connection.rollback(() => { connection.release(); req.session.mensaje = 'Error cancelando la reserva'; return res.redirect('/reservas'); }); }
                    // Poner vehículo disponible
                    connection.query("UPDATE Vehiculos SET estado = 'disponible' WHERE id_vehiculo = ?", [idVehiculo], (eVeh) => {
                        if (eVeh) { return connection.rollback(() => { connection.release(); req.session.mensaje = 'Reserva cancelada pero error liberando vehículo'; return res.redirect('/reservas'); }); }
                        connection.commit(cErr => {
                            connection.release();
                            if (cErr) { req.session.mensaje = 'Error confirmando cancelación'; return res.redirect('/reservas'); }
                            req.session.mensaje = 'Reserva cancelada y vehículo disponible';
                            return res.redirect('/reservas');
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
