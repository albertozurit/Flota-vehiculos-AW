const express = require('express');
const router = express.Router();
const pool = require('../config/config');
// No usamos el middleware que redirige en peticiones AJAX; haremos una comprobación manual

// Ruta asíncrona para obtener el formulario de reserva de un vehículo
// Devuelve únicamente la vista parcial (sin layout) para ser consumida por AJAX/modal
router.get('/nuevo/:id', (req, res) => {
    const vehiculoId = req.params.id;

    // Si la petición viene desde AJAX/modal y no hay sesión, devolvemos 401 en vez de redirigir
    if (!req.session || !req.session.usuario) {
        console.log('Acceso no autorizado a /reservas/nuevo/:id (AJAX)');
        return res.status(401).send('No autorizado');
    }
    if (req.session.usuario.rol !== 'empleado') {
        return res.status(403).send('No permitido');
    }

    console.log(`Petición AJAX /reservas/nuevo/${vehiculoId} por usuario=${req.session.usuario && req.session.usuario.id}`);

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error al obtener conexión:', err);
            return res.status(500).send('Error en el servidor');
        }

    // Seleccionamos usando el esquema nuevo: tabla `Vehiculos` y PK `id_vehiculo`.
    // Hacemos alias de `id_vehiculo AS id` para no romper las vistas que esperan `vehiculo.id`.
    const sql = `SELECT id_vehiculo AS id, matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, estado
                 FROM Vehiculos WHERE id_vehiculo = ?`;
        connection.query(sql, [vehiculoId], (err, rows) => {
            connection.release();

            if (err) {
                console.error('Error en la consulta de vehículo:', err);
                // Devolver mensaje del error para facilitar debugging en entorno local
                return res.status(500).send('Error en la consulta: ' + (err.message || 'consulta SQL fallida'));
            }

            if (rows.length === 0) {
                console.log(`Vehículo ${vehiculoId} no encontrado en la BD`);
                return res.status(404).send('Vehículo no encontrado');
            }

            const vehiculo = rows[0];

            try {
                // Renderizar la vista del formulario de reservas (fragmento)
                res.render('reservas/reservas_formulario', {
                    vehiculo: vehiculo,
                    usuario: req.session.usuario || null,
                    preferencias: req.session.preferencias || {}
                });
            } catch (renderErr) {
                console.error('Error renderizando reservas_formulario:', renderErr);
                return res.status(500).send('Error renderizando plantilla: ' + (renderErr.message || 'error EJS'));
            }
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
                if (eSel) { return connection.rollback(()=>{ connection.release(); req.session.mensaje = 'Error localizando la reserva'; return res.redirect('/reservas'); }); }
                if (!rows || rows.length === 0) { return connection.rollback(()=>{ connection.release(); req.session.mensaje = 'Reserva no encontrada o no autorizada'; return res.redirect('/reservas'); }); }
                const idVehiculo = rows[0].id_vehiculo;
                // Marcar reserva como cancelada
                connection.query("UPDATE Reservas SET estado = 'Cancelada' WHERE id_reserva = ? AND id_usuario = ?", [idReserva, userId], (eUpd) => {
                    if (eUpd) { return connection.rollback(()=>{ connection.release(); req.session.mensaje = 'Error cancelando la reserva'; return res.redirect('/reservas'); }); }
                    // Poner vehículo disponible
                    connection.query("UPDATE Vehiculos SET estado = 'disponible' WHERE id_vehiculo = ?", [idVehiculo], (eVeh) => {
                        if (eVeh) { return connection.rollback(()=>{ connection.release(); req.session.mensaje = 'Reserva cancelada pero error liberando vehículo'; return res.redirect('/reservas'); }); }
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
