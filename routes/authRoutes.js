const express = require('express');
const router = express.Router();
const pool = require('../config/config');
const bcrypt = require('bcrypt');
const {
    validarRegistro,
    validarLogin,
    validarReserva,
    validarVehiculo,
    validationResult
} = require('../validators/validators');


//MIDDLEWARE DE PROTECCION: sirven como para restringir rutas (para usarlos los ponemos en los get app.get('/reservas', requireAuth, (req, res))
//Middleware de proteccion auth
function requireAuth(request, response, next) {
    if (request.session.usuario) { //verifica si el user esta en la sesion
        next(); //pasa el control a lo siguiente que venga
    } else {
        console.log("Acceso denegado: usuario no registrado");
        response.redirect('/login'); // redirige a login correcto
    }
}


//HA DICHO DE HACERLO CON MIDDLEWARE NO CON IF PARA LOS PERMISOS

//Middleware de administrador
function requireAdmin(request, response, next) {
    if (request.session.usuario && request.session.usuario.rol === 'admin') {
        next(); //si el usuario esta en la sesion y es de rol admin
    } else {
        console.log("Usuario sin permisos de administrador");
        response.redirect('/');
    }
}


function insertarUsuario(usuario, callback) {
    pool.getConnection((err, connection) => {
        if (err) {
            callback(err);
        }
        else {
            // Nuevo esquema: tabla `Usuarios` (correo, contrasena). Usamos id_concesionario=1 por defecto.
            let sql = "INSERT INTO Usuarios (nombre, correo, contrasena, rol, id_concesionario) VALUES (?,?,?,?,?)";
            connection.query(sql, [usuario.nombre, usuario.email, usuario.password, usuario.rol, usuario.id_concesionario || 1],
                (err, results) => {
                    connection.release();
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, results.insertId);
                    }
                });
        }
    });
}

// insertarVehiculo: Función movida a adminRoutes.js (única ubicación)

//RUTAS POST
router.post('/register', requireAuth, requireAdmin, validarRegistro, (request, response) => {
    // Verificar errores de validación
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.render('usuarios/register', {
            title: 'Registro de usuario',
            usuario: null,
            mensaje: errors.array().map(e => e.msg).join('. '),
            preferencias: request.session.preferencias || {}
        });
    }

    const { nombre, email, password, id_concesionario, rol } = request.body;
    const rolFinal = (rol === 'admin') ? 'admin' : 'empleado';
    const saltRounds = 10;

    // Validación de correo corporativo (cambia el dominio según tu organización)
    const CORPORATE_DOMAIN = 'flotawei.com';
    const emailOk = typeof email === 'string' && email.trim().toLowerCase().endsWith(`@${CORPORATE_DOMAIN}`);
    if (!emailOk) {
        return response.render('usuarios/register', {
            title: 'Registro de usuario',
            usuario: null,
            mensaje: `El correo debe ser corporativo (@${CORPORATE_DOMAIN})`,
            preferencias: request.session.preferencias || {}
        });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
        return response.render('usuarios/register', {
            title: 'Registro de usuario',
            usuario: null,
            mensaje: "La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número",
            preferencias: request.session.preferencias || {}
        });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Error al obtener conexión:", err);
            return response.render('usuarios/register', {
                title: 'Registro de usuario',
                usuario: null,
                mensaje: "Error en el servidor",
                preferencias: request.session.preferencias || {}
            });
        }

        let sqlCheck = 'SELECT correo FROM Usuarios WHERE correo = ? AND activo = 1';
        connection.query(sqlCheck, [email], (err, rows) => {
            if (err) {
                connection.release();
                console.error("Error al verificar email:", err);
                return response.render('usuarios/register', {
                    title: 'Registro de usuario',
                    usuario: null,
                    mensaje: "Error en el servidor",
                    preferencias: request.session.preferencias || {}
                });
            }

            if (rows.length > 0) {
                connection.release();
                return response.render('usuarios/register', {
                    title: 'Registro de usuario',
                    usuario: null,
                    mensaje: "El correo electrónico ya está registrado",
                    preferencias: request.session.preferencias || {}
                });
            }

            bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
                if (err) {
                    connection.release();
                    console.error("Error al hashear la contraseña", err);
                    return response.render('usuarios/register', {
                        title: 'Registro de usuario',
                        usuario: null,
                        mensaje: "Error al procesar la contraseña",
                        preferencias: request.session.preferencias || {}
                    });
                }

                let usuario = {
                    nombre: nombre,
                    email: email,
                    password: hashedPassword,
                    rol: rolFinal,
                    id_concesionario: parseInt(id_concesionario) || 1
                };

                insertarUsuario(usuario, (err, newUserId) => {
                    connection.release();
                    if (!err) {
                        request.session.mensaje = 'Usuario creado correctamente';
                        return response.redirect('/admin');
                    } else {
                        console.log("Error al insertar usuario", err);
                        return response.render('usuarios/register', {
                            title: 'Registro de usuario',
                            usuario: null,
                            mensaje: "Error al crear el usuario: " + (err.message || ''),
                            preferencias: request.session.preferencias || {}
                        });
                    }
                });
            });
        });
    });
});






router.post('/login', validarLogin, (request, response) => {
    // Verificar errores de validación
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.render('usuarios/login', {
            mensaje: errors.array().map(e => e.msg).join('. ')
        });
    }

    const { email, password, recordar } = request.body;

    // Validar correo corporativo también en login para mayor seguridad
    const CORPORATE_DOMAIN = 'flotawei.com';
    const emailOk = typeof email === 'string' && email.trim().toLowerCase().endsWith(`@${CORPORATE_DOMAIN}`);
    if (!emailOk) {
        return response.render('usuarios/login', { mensaje: `El correo debe ser corporativo (@${CORPORATE_DOMAIN})` });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Error al obtener conexión:", err);
            return response.render('usuarios/login', { mensaje: "Error en el servidor" });
        }

        let sql = 'SELECT id_usuario AS id, nombre, correo AS email, contrasena AS password, rol, id_concesionario, preferencias_accesibilidad FROM Usuarios WHERE correo = ? AND activo = 1';
        connection.query(sql, [email], (err, rows) => {
            connection.release();

            if (err) {
                console.error("Error en la consulta:", err);
                return response.render('usuarios/login', { mensaje: "Error en el servidor" });
            }

            if (rows.length === 0) {
                console.log("Usuario no encontrado o inactivo");
                return response.render('usuarios/login', { mensaje: "Usuario no encontrado" });
            }

            const user = rows[0];

            bcrypt.compare(password, user.password, (err, passwordOk) => {
                if (err) {
                    console.error("Error al comparar contraseñas:", err);
                    return response.render('usuarios/login', { mensaje: "Error en el servidor" });
                }

                if (!passwordOk) {
                    console.log("Contraseña incorrecta");
                    return response.render('usuarios/login', { mensaje: "Contraseña incorrecta" });
                }

                // Si se marca "recordar sesión", extender la duración de la cookie
                if (recordar) {
                    request.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
                } else {
                    request.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 horas (por defecto)
                }

                request.session.mensaje = "Login realizado con éxito";
                request.session.usuario = {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.rol,
                    id_concesionario: user.id_concesionario || null
                };

                // Cargar preferencias de accesibilidad desde la base de datos
                if (user.preferencias_accesibilidad) {
                    try {
                        request.session.preferencias = JSON.parse(user.preferencias_accesibilidad);
                        console.log('Preferencias cargadas desde BD para usuario', user.id);
                    } catch (e) {
                        console.error('Error al parsear preferencias desde BD:', e);
                        request.session.preferencias = {};
                    }
                } else {
                    // Si no hay preferencias guardadas, inicializar objeto vacío
                    request.session.preferencias = {};
                }

                request.session.save((err) => {
                    if (err) {
                        console.error("Error al guardar sesión:", err);
                        return response.render('usuarios/login', { mensaje: "Error en el servidor" });
                    }
                    console.log("Login correcto, sesión guardada por:", recordar ? "30 días" : "24 horas");
                    response.redirect('/');
                });
            });
        });
    });
});

//logout 
router.post('/logout', (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            return response.redirect('/');
        }
        response.clearCookie('connect.sid'); //elimina la cookie de sesión del navegador
        response.redirect('/');
    });
});




//Accesibilidad
router.post('/accesibilidad/guardar', requireAuth, (request, response) => {
    const prev = request.session.preferencias || {};

    // Validar y sanitizar entradas
    const fontSizeRaw = parseInt(request.body.fontSize) || 100;
    const fontSizeSanitized = Math.min(Math.max(fontSizeRaw, 80), 120); // Clamped entre 80-120

    const nuevasPreferencias = {
        contraste: request.body.contraste === 'true',
        daltonismo: request.body.daltonismo === 'true',
        fontSize: fontSizeSanitized,
        atajos: {
            reservar: (request.body.atajo_reservar || '').trim().substring(0, 20) || (prev.atajos && prev.atajos.reservar) || '',
            misReservas: (request.body.atajo_mis_reservas || '').trim().substring(0, 20) || (prev.atajos && prev.atajos.misReservas) || ''
        }
    };

    // Guardar en sesión primero para respuesta inmediata
    request.session.preferencias = nuevasPreferencias;

    // Guardar en base de datos para persistencia
    const userId = request.session.usuario.id;
    const preferenciasJSON = JSON.stringify(nuevasPreferencias);

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error al obtener conexión para guardar preferencias:', err);
            // Continuar con sesión aunque falle BD
            return request.session.save(() => {
                response.redirect(request.get('referer') || '/');
            });
        }

        const sql = 'UPDATE Usuarios SET preferencias_accesibilidad = ? WHERE id_usuario = ?';
        connection.query(sql, [preferenciasJSON, userId], (err) => {
            connection.release();

            if (err) {
                console.error('Error al actualizar preferencias en BD:', err);
            }

            // Guardar sesión y redirigir
            request.session.save(() => {
                response.redirect(request.get('referer') || '/');
            });
        });
    });
});

// POST /vehiculos/nuevo: Ruta movida a adminRoutes.js con soporte de imagen y mejor validación

// POST /vehiculos/:id/editar: Ruta de edición ahora solo en adminRoutes.js

//Crear reserva 
router.post('/reservas/guardar', requireAuth, validarReserva, async (req, res) => {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.mensaje = errors.array().map(e => e.msg).join('. ');
        return res.redirect('/vehiculos');
    }

    const { vehiculoId, fechaInicio, horaInicio, fechaFin, horaFin } = req.body;
    const vehiculoIdNum = parseInt(vehiculoId);
    const userId = req.session.usuario.id;

    // Validación básica
    if (!vehiculoId || !fechaInicio || !horaInicio || !fechaFin || !horaFin) {
        return res.status(400).render('reservasformulario', {
            title: 'Nueva Reserva de Vehículo',
            usuario: req.session.usuario,
            vehiculos: [], // Deberías volver a cargar la lista de vehículos aquí
            mensaje: 'Todos los campos de fecha, hora y vehículo son obligatorios.'
        });
    }

    try {
        // **PASO 2:** Lógica para comprobar disponibilidad y guardar en la BD
        const inicio = `${fechaInicio} ${horaInicio}`;
        const fin = `${fechaFin} ${horaFin}`;

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error al obtener conexión para guardar reserva:', err);
                req.session.mensaje = 'Error en el servidor al guardar la reserva';
                return res.redirect('/reservas');
            }

            // Usamos transacción para insertar reserva y actualizar estado del vehículo
            connection.beginTransaction(transactionErr => {
                if (transactionErr) {
                    console.error('Error iniciando transacción:', transactionErr);
                    connection.release();
                    req.session.mensaje = 'Error en el servidor al guardar la reserva';
                    return res.redirect('/reservas');
                }

                // VALIDACIÓN DE SOLAPAMIENTO: Verificar que no haya reservas activas que se solapen
                const checkOverlapSql = `
                    SELECT id_reserva FROM Reservas 
                    WHERE id_vehiculo = ? 
                    AND estado = 'activa'
                    AND NOT (fecha_fin <= ? OR fecha_inicio >= ?)
                `;
                connection.query(checkOverlapSql, [vehiculoIdNum, inicio, fin], (checkErr, overlapRows) => {
                    if (checkErr) {
                        console.error('Error verificando solapamiento:', checkErr);
                        return connection.rollback(() => {
                            connection.release();
                            req.session.mensaje = 'Error al verificar disponibilidad';
                            return res.redirect('/reservas');
                        });
                    }

                    if (overlapRows && overlapRows.length > 0) {
                        // Ya existe una reserva activa en ese rango
                        return connection.rollback(() => {
                            connection.release();
                            req.session.mensaje = 'El vehículo ya tiene una reserva activa en ese horario. Por favor, elige otro rango de fechas.';
                            return res.redirect('/reservas');
                        });
                    }

                    // No hay solapamiento, proceder con la inserción
                    const insertSql = `INSERT INTO Reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado) VALUES (?,?,?,?,?)`;
                    const insertParams = [userId, vehiculoIdNum, inicio, fin, 'activa'];

                    connection.query(insertSql, insertParams, (insertErr, insertRes) => {
                        if (insertErr) {
                            console.error('Error insertando reserva:', insertErr);
                            return connection.rollback(() => {
                                connection.release();
                                req.session.mensaje = 'Error al guardar la reserva';
                                return res.redirect('/reservas');
                            });
                        }

                        // Actualizar estado del vehículo a 'reservado'
                        const updateSql = `UPDATE Vehiculos SET estado = 'reservado' WHERE id_vehiculo = ?`;
                        connection.query(updateSql, [vehiculoIdNum], (updateErr, updateResult) => {
                            if (updateErr) {
                                console.error('Error actualizando estado del vehículo:', updateErr);
                                return connection.rollback(() => {
                                    connection.release();
                                    req.session.mensaje = 'Error al guardar la reserva';
                                    return res.redirect('/reservas');
                                });
                            }

                            connection.commit(commitErr => {
                                if (commitErr) {
                                    console.error('Error al confirmar transacción:', commitErr);
                                    return connection.rollback(() => {
                                        connection.release();
                                        req.session.mensaje = 'Error al guardar la reserva';
                                        return res.redirect('/reservas');
                                    });
                                }

                                connection.release();
                                req.session.mensaje = '¡Reserva realizada con éxito!';
                                return res.redirect('/reservas');
                            });
                        });
                    });
                });
            });
        });

    } catch (error) {
        console.error('Error al guardar la reserva:', error);
        res.render('reservasformulario', {
            title: 'Nueva Reserva de Vehículo',
            usuario: req.session.usuario,
            vehiculos: [],
            mensaje: 'Error al procesar la reserva. Inténtelo de nuevo.'
        });
    }
});

// POST /vehiculos/:id/eliminar: Ruta de eliminación ahora solo en adminRoutes.js (baja lógica simple)







//RUTAS GET
router.get('/', function (request, response) {
    response.status(200);
    response.render('index', {
        title: "Pagina principal",
        usuario: request.session.usuario || null,
        preferencias: request.session.preferencias || {}
    });
    request.session.mensaje = null;
});

//Perfil
router.get('/perfil', requireAuth, (request, response) => {
    const usuario = request.session.usuario;
    response.status(200);
    response.render('usuarios/perfil', {
        usuario: usuario,
        title: "Perfil de usuario",
        preferencias: request.session.preferencias || {}
    });
});

router.get('/login', function (request, response) {
    response.status(200);
    response.render('usuarios/login', {
        title: "Login de usuario",
        mensaje: request.session.mensaje || null,
        preferencias: request.session.preferencias || {}
    });
    request.session.mensaje = null;
});

// RUTA ELIMINADA: La creación de vehículos se hace desde el modal en /admin

// Listar vehículos con filtros y exclusión por rango de reservas
router.get('/vehiculos', requireAuth, (request, response) => {
    const { autonomia_min, plazas, color, inicio, fin, ciudad } = request.query;
    const usuario = request.session && request.session.usuario;
    const baseId = usuario && usuario.id_concesionario ? parseInt(usuario.id_concesionario) : null;
    const esAdmin = usuario && usuario.rol === 'admin';

    // Si no es admin y no tiene concesionario asignado, no puede ver nada
    if (!esAdmin && !baseId) {
        return response.render('vehiculos/lista_vehiculos', {
            title: "Vehículos disponibles",
            vehiculos: [],
            filtros: { autonomia_min, plazas, color, inicio, fin, ciudad },
            mensaje: "No tienes un concesionario base asignado. Consulta con un administrador.",
            preferencias: request.session.preferencias || {}
        });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Error al obtener conexión:", err);
            return response.render('vehiculos/lista_vehiculos', {
                title: "Vehículos disponibles",
                vehiculos: [],
                filtros: { autonomia_min, plazas, color, inicio, fin, ciudad },
                mensaje: "Error en el servidor",
                preferencias: request.session.preferencias || {}
            });
        }

        // Construir filtros dinámicos
        // ADMIN: ve todos los vehículos
        // EMPLEADO: solo los de su concesionario
        const where = [];
        const params = [];

        // Filtrar solo vehículos activos
        where.push('v.activo = 1');

        if (!esAdmin) {
            // Empleado: restringir a su concesionario activo
            where.push('v.id_concesionario = ?');
            params.push(baseId);
        }
        if (autonomia_min) { where.push('v.autonomia_km >= ?'); params.push(parseInt(autonomia_min)); }
        if (plazas) { where.push('v.numero_plazas >= ?'); params.push(parseInt(plazas)); }
        if (color) { where.push('LOWER(v.color) LIKE LOWER(?)'); params.push(`%${color}%`); }
        let joinSql = ' JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario AND c.activo = 1';
        if (ciudad) { where.push('LOWER(c.ciudad) LIKE LOWER(?)'); params.push(`%${ciudad}%`); }

        // Excluir vehículos reservados en el rango [inicio, fin] si ambos están presentes
        let excludeSql = '';
        if (inicio && fin) {
            excludeSql = ` AND NOT EXISTS (
                SELECT 1 FROM Reservas r
                WHERE r.id_vehiculo = v.id_vehiculo
                  AND r.estado = 'activa'
                  AND NOT (r.fecha_fin <= ? OR r.fecha_inicio >= ?)
            )`;
        }

        const baseSql = `SELECT v.id_vehiculo AS id, v.matricula, v.marca, v.modelo, v.anio_matriculacion, v.numero_plazas, v.autonomia_km, v.color, v.imagen, v.estado, c.nombre AS concesionario_nombre, c.ciudad AS concesionario_ciudad
                         FROM Vehiculos v${joinSql}`;
        const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
        //En caso de ser admin, ordenar por concesionario y luego por id vehiculo descendente
        //En caso de ser empleado, ordenar solo por ide dvechiuclo descendente
        const orderSql = esAdmin ? ' ORDER BY c.nombre ASC, v.id_vehiculo DESC' : ' ORDER BY v.id_vehiculo DESC';
        const finalSql = baseSql + whereSql + (inicio && fin ? excludeSql : '') + orderSql;
        const finalParams = params.concat(inicio && fin ? [inicio, fin] : []);

        connection.query(finalSql, finalParams, (err, rows) => {
            connection.release();
            if (err) {
                console.error("Error en la consulta:", err);
                return response.render('vehiculos/lista_vehiculos', {
                    title: "Vehículos disponibles",
                    vehiculos: [],
                    filtros: { autonomia_min, plazas, color, inicio, fin, ciudad },
                    mensaje: "Error en el servidor",
                    preferencias: request.session.preferencias || {}
                });
            }

            const renderData = {
                title: "Vehículos disponibles",
                vehiculos: rows,
                filtros: { autonomia_min, plazas, color, inicio, fin, ciudad },
                mensaje: request.session.mensaje || null,
                preferencias: request.session.preferencias || {}
            };

            request.session.mensaje = null;
            return response.render('vehiculos/lista_vehiculos', renderData);
        });
    });
});

router.get('/reservas', requireAuth, async (req, res) => {
    try {
        const userId = req.session.usuario.id;

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error al obtener conexión en listar reservas:', err);
                return res.status(500).send('Error en el servidor');
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

                const sql = `
                    SELECT r.id_reserva AS id, r.fecha_inicio, r.fecha_fin, r.estado,
                           v.marca, v.modelo, v.matricula
                    FROM Reservas r
                    LEFT JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo AND v.activo = 1
                    WHERE r.id_usuario = ?
                    ORDER BY r.fecha_inicio DESC
                `;

                connection.query(sql, [userId], (err, rows) => {
                    connection.release();
                    if (err) {
                        console.error('Error en la consulta de reservas:', err);
                        return res.status(500).send('Error en la consulta de reservas: ' + (err.message || JSON.stringify(err)));
                    }

                    const misReservas = rows.map(r => {
                        const inicio = r.fecha_inicio ? new Date(r.fecha_inicio).toISOString().slice(0, 16).replace('T', ' ') : '';
                        const fin = r.fecha_fin ? new Date(r.fecha_fin).toISOString().slice(0, 16).replace('T', ' ') : '';
                        return {
                            id: r.id,
                            vehiculo: `${r.marca || ''} ${r.modelo || ''}`.trim(),
                            matricula: r.matricula || '',
                            inicio: inicio,
                            fin: fin,
                            estado: r.estado
                        };
                    });

                    res.render('reservas/lista_reservas', {
                        title: 'Mis Reservas',
                        usuario: req.session.usuario,
                        reservas: misReservas,
                        mensaje: req.session.mensaje || null
                    });
                    req.session.mensaje = null;
                });
            });
        });

    } catch (error) {
        console.error('Error al listar reservas:', error);
        res.status(500).send('Error interno del servidor.');
    }
});


//guardar preferencias de Accesibilidad
router.post('/preferencias', (req, res) => {
    const { tamanoLetra, contraste, animaciones } = req.body;
    req.session.preferencias = {
        tamanoLetra: tamanoLetra || 'normal',
        contraste: contraste || 'normal',
        animaciones: animaciones !== undefined ? animaciones : true
    };

    if (req.session.usuario && req.session.usuario.id) {
        const prefsJson = JSON.stringify(req.session.preferencias);
        pool.getConnection((err, connection) => {
            if (!err) {
                connection.query(
                    'UPDATE Usuarios SET preferencias_accesibilidad = ? WHERE id_usuario = ?',
                    [prefsJson, req.session.usuario.id],
                    (err) => {
                        connection.release();
                        if (err) console.error('Error guardando preferencias en BD:', err);
                    }
                );
            }
        });
    }

    res.json({ success: true });
});

module.exports = router;