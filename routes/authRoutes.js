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

        let sqlCheck = 'SELECT correo FROM Usuarios WHERE correo = ?';
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

        let sql = 'SELECT id_usuario AS id, nombre, correo AS email, contrasena AS password, rol, id_concesionario, preferencias_accesibilidad FROM Usuarios WHERE correo = ?';
        connection.query(sql, [email], (err, rows) => {
            connection.release();

            if (err) {
                console.error("Error en la consulta:", err);
                return response.render('usuarios/login', { mensaje: "Error en el servidor" });
            }

            if (rows.length === 0) {
                console.log("Usuario no encontrado");
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
                        console.log('✅ Preferencias cargadas desde BD para usuario', user.id);
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
            console.log("Erorr cerrando sesion: ", err);
            return response.redirect('/');
        }
        response.clearCookie('connect.sid'); //elimina la cookie de sesión del navegador
        response.redirect('/');
    });
});




//Accesibilidad
router.post('/accesibilidad/guardar', requireAuth, (request, response) => {
    const prev = request.session.preferencias || {};
    const nuevasPreferencias = {
        contraste: request.body.contraste === 'true',
        daltonismo: request.body.daltonismo === 'true',
        fontSize: parseInt(request.body.fontSize) || 100,
        atajos: {
            reservar: (request.body.atajo_reservar || '').trim() || (prev.atajos && prev.atajos.reservar) || '',
            misReservas: (request.body.atajo_mis_reservas || '').trim() || (prev.atajos && prev.atajos.misReservas) || ''
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
            } else {
                console.log('✅ Preferencias guardadas en BD para usuario', userId);
            }

            // Guardar sesión y redirigir
            request.session.save(() => {
                response.redirect(request.get('referer') || '/');
            });
        });
    });
});

// Crear vehículo (solo admin)
router.post('/vehiculos/nuevo', requireAuth, requireAdmin, (request, response) => {
    const { matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color } = request.body;

    // Validaciones básicas: matrícula, marca y modelo son obligatorios
    if (!matricula || !marca || !modelo) {
        return response.render('vehiculos/nuevo', {
            mensaje: "Por favor, completa los campos obligatorios: matrícula, marca y modelo"
        });
    }

    const vehiculo = {
        matricula: matricula,
        marca: marca,
        modelo: modelo,
        anio_matriculacion: anio_matriculacion || null,
        numero_plazas: numero_plazas ? parseInt(numero_plazas) : null,
        autonomia_km: autonomia_km ? parseInt(autonomia_km) : null,
        color: color || null,
        estado: 'disponible',
        id_concesionario: 1 // opción A: concesionario por defecto
    };

    insertarVehiculo(vehiculo, (err, newVehicleId) => {
        if (!err) {
            console.log("✅ Vehículo creado con ID:", newVehicleId);
            response.redirect('/vehiculos');
        } else {
            console.error("Error al insertar vehículo:", err);
            response.render('vehiculos/nuevo', {
                mensaje: "Error al crear el vehículo"
            });
        }
    });
});

//editar vehiculo solo admin
router.post('/vehiculos/:id/editar', requireAuth, requireAdmin, (request, response) => {
    const vehiculoId = request.params.id;
    const { matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color } = request.body;

    if (!matricula || !marca || !modelo) {
        return response.render('vehiculos/editar', {
            vehiculo: { id: vehiculoId, matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color },
            mensaje: "Por favor, completa los campos obligatorios: matrícula, marca y modelo"
        });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Error al obtener conexión:", err);
            return response.redirect('/vehiculos');
        }

        const sql = `UPDATE Vehiculos SET matricula = ?, marca = ?, modelo = ?, anio_matriculacion = ?, numero_plazas = ?, autonomia_km = ?, color = ? WHERE id_vehiculo = ?`;
        const params = [matricula, marca, modelo, anio_matriculacion || null, numero_plazas ? parseInt(numero_plazas) : null, autonomia_km ? parseInt(autonomia_km) : null, color || null, vehiculoId];

        connection.query(sql, params, (err, results) => {
            connection.release();

            if (err) {
                console.error("Error al actualizar vehículo:", err);
                return response.redirect('/vehiculos');
            }

            console.log("✅ Vehículo actualizado correctamente");
            response.redirect('/vehiculos');
        });
    });
});

//Crear reserva 
router.post('/reservas/guardar', requireAuth, validarReserva, async (req, res) => {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('reservasformulario', {
            title: 'Nueva Reserva de Vehículo',
            usuario: req.session.usuario,
            vehiculos: [],
            mensaje: errors.array().map(e => e.msg).join('. ')
        });
    }

    const { vehiculoId, fechaInicio, horaInicio, fechaFin, horaFin } = req.body;
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

                const insertSql = `INSERT INTO Reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado) VALUES (?,?,?,?,?)`;
                const insertParams = [userId, vehiculoId, inicio, fin, 'activa'];

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
                    connection.query(updateSql, [vehiculoId], (updateErr) => {
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
                            console.log(`Reserva creada para el vehículo ${vehiculoId} de ${inicio} a ${fin} (id_reserva=${insertRes.insertId})`);
                            req.session.mensaje = '¡Reserva realizada con éxito!';
                            return res.redirect('/reservas');
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

function eliminarVehiculo(vehiculoId, callback) {
    pool.getConnection((err, connection) => {
        if (err) {
            return callback(err);
        }
        // Usamos nuevo esquema: comprobar estado en `Vehiculos` usando id_vehiculo
        let sqlCheckEstado = "SELECT estado FROM Vehiculos WHERE id_vehiculo = ?";
        connection.query(sqlCheckEstado, [vehiculoId], (err, rows) => {
            if (err) {
                connection.release();
                return callback(err);
            }

            if (rows.length === 0) {
                connection.release();
                return callback(new Error("El vehículo no existe."));
            }

            const vehiculo = rows[0];

            if (vehiculo.estado === "reservado") {
                connection.release();
                return callback(new Error("El vehículo está reservado actualmente y no se puede eliminar."));
            }

            // Comprobar si tiene reservas activas en la tabla `Reservas`
            let sqlCheckReservas = `SELECT id_reserva FROM Reservas WHERE id_vehiculo = ? AND estado = 'activa'`;
            connection.query(sqlCheckReservas, [vehiculoId], (err, reservas) => {
                if (err) {
                    connection.release();
                    return callback(err);
                }

                if (reservas.length > 0) {
                    connection.release();
                    return callback(new Error("El vehículo tiene reservas activas y no se puede eliminar."));
                }

                // Baja lógica: marcar como 'mantenimiento'
                let sqlUpdate = "UPDATE Vehiculos SET estado = 'mantenimiento' WHERE id_vehiculo = ?";
                connection.query(sqlUpdate, [vehiculoId], (err, results) => {
                    connection.release();

                    if (err) {
                        return callback(err);
                    }

                    callback(null, results.affectedRows);
                });
            });
        });
    });
}


// Baja lógica del vehículo
router.post('/vehiculos/:id/eliminar', requireAuth, requireAdmin, (request, response) => {
    const vehiculoId = request.params.id;

    eliminarVehiculo(vehiculoId, (err, affectedRows) => {
        if (err) {
            console.error("Error al eliminar vehículo:", err);
            return response.redirect('/vehiculos');
        }

        console.log(`Vehículo ${vehiculoId} marcado como inactivo`);
        response.redirect('/vehiculos');
    });
});







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

router.get('/register', requireAuth, requireAdmin, (request, response) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error al obtener conexión para cargar concesionarios:', err);
            response.status(200);
            return response.render('usuarios/register', {
                title: "Registro de usuario",
                usuario: request.session.usuario || null,
                mensaje: request.session.mensaje || null,
                preferencias: request.session.preferencias || {},
                concesionarios: []
            });
        }
        connection.query('SELECT id_concesionario AS id, nombre FROM Concesionarios ORDER BY nombre', (e, rows) => {
            connection.release();
            response.status(200);
            response.render('usuarios/register', {
                title: "Registro de usuario",
                usuario: request.session.usuario || null,
                mensaje: request.session.mensaje || null,
                preferencias: request.session.preferencias || {},
                concesionarios: e ? [] : (rows || [])
            });
            request.session.mensaje = null;
        });
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

// Formulario para crear vehículo (solo admin)
router.get('/vehiculos/nuevo', requireAuth, requireAdmin, (request, response) => {
    response.status(200);
    response.render('vehiculos/nuevo', {
        title: "Nuevo Vehículo",
        mensaje: null,
        preferencias: request.session.preferencias || {}
    });
});

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

        if (!esAdmin) {
            // Empleado: restringir a su concesionario
            where.push('v.id_concesionario = ?');
            params.push(baseId);
        }
        if (autonomia_min) { where.push('v.autonomia_km >= ?'); params.push(parseInt(autonomia_min)); }
        if (plazas) { where.push('v.numero_plazas >= ?'); params.push(parseInt(plazas)); }
        if (color) { where.push('LOWER(v.color) LIKE LOWER(?)'); params.push(`%${color}%`); }
        let joinSql = ' JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario';
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
        // Admin: ordenar por concesionario, luego por ID
        // Empleado: ordenar solo por ID (ya solo ve su concesionario)
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
                mensaje: null,
                preferencias: request.session.preferencias || {}
            };

            // Si es AJAX, devolver la vista completa y el cliente extrae la tabla
            if (request.get('X-Requested-With') === 'XMLHttpRequest') {
                return response.render('vehiculos/lista_vehiculos', renderData);
            }
            return response.render('vehiculos/lista_vehiculos', renderData);
        });
    });
});

// Panel empleado: Vehículos de mi base (filtrados por concesionario asignado)
router.get('/mi-base/vehiculos', requireAuth, (request, response) => {
    const usuario = request.session.usuario;
    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Error al obtener conexión:", err);
            return response.render('vehiculos/lista_vehiculos', {
                vehiculos: [],
                mensaje: "Error en el servidor",
                preferencias: request.session.preferencias || {}
            });
        }
        const sql = `SELECT id_vehiculo AS id, matricula, marca, modelo, numero_plazas, autonomia_km, color, imagen, estado FROM Vehiculos WHERE id_concesionario = ?`;
        connection.query(sql, [usuario.id_concesionario || 1], (err, rows) => {
            connection.release();
            if (err) {
                console.error("Error en la consulta:", err);
                return response.render('vehiculos/lista_vehiculos', {
                    vehiculos: [],
                    mensaje: "Error en el servidor",
                    preferencias: request.session.preferencias || {}
                });
            }
            response.render('vehiculos/lista_vehiculos', {
                title: "Vehículos de mi base",
                vehiculos: rows,
                mensaje: null,
                preferencias: request.session.preferencias || {}
            });
        });
    });
});


// RUTA COMENTADA: Ya no es necesaria, se edita mediante modal en /vehiculos
// router.get('/vehiculos/:id/editar', requireAuth, requireAdmin, (request, response) => {
//     const vehiculoId = request.params.id;
//     pool.getConnection((err, connection) => {
//         if (err) {
//             console.error("Error en el servidor");
//             return response.redirect('/vehiculos');
//         }
//         let sql = "SELECT id_vehiculo AS id, matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, estado FROM Vehiculos WHERE id_vehiculo = ?";
//         connection.query(sql, [vehiculoId], (err, rows) => {
//             connection.release();
//             if (err) {
//                 console.error("Error en la consulta:", err);
//                 return response.redirect('/vehiculos');
//             }
//             console.log(`vehiculo editado`);
//             if (rows.length === 0) {
//                 console.log("Vehículo no encontrado");
//                 return response.redirect('/vehiculos');
//             }
//             response.render('vehiculos/editar', {
//                 title: "Editar Vehículo",
//                 mensaje: null,
//                 vehiculo: rows[0],
//                 preferencias: request.session.preferencias || {}
//             });
//         })
//     })
// });


// RUTA COMENTADA: Ya no es necesaria, se reserva mediante modal en /vehiculos
// router.get('/reservas/nuevo', requireAuth, async (req, res) => {
//     if (!req.session || !req.session.usuario || req.session.usuario.rol !== 'empleado') {
//         return res.redirect('/');
//     }
//     try {
//         const vehiculosDisponibles = [
//             { id: 1, nombre: 'Tesla Model 3', matricula: '1234 ABC', bateria: '80%' },
//             { id: 2, nombre: 'Nissan Leaf', matricula: '5678 DEF', bateria: '70%' },
//         ];
//         res.render('reservasformulario', {
//             title: 'Nueva Reserva de Vehículo',
//             usuario: req.session.usuario,
//             vehiculos: vehiculosDisponibles,
//             mensaje: null
//         });
//     } catch (error) {
//         console.error('Error al cargar el formulario de reserva:', error);
//         res.status(500).send('Error interno del servidor.');
//     }
// });

router.get('/reservas', requireAuth, async (req, res) => {
    try {
        const userId = req.session.usuario.id;

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error al obtener conexión en listar reservas:', err);
                return res.status(500).send('Error en el servidor');
            }

            const sql = `
                SELECT r.id_reserva AS id, r.fecha_inicio, r.fecha_fin, r.estado,
                       v.marca, v.modelo, v.matricula
                FROM Reservas r
                LEFT JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
                WHERE r.id_usuario = ? AND r.estado <> 'Cancelada'
                ORDER BY r.fecha_inicio DESC
            `;

            connection.query(sql, [userId], (err, rows) => {
                connection.release();
                if (err) {
                    console.error('Error en la consulta de reservas:', err);
                    // En entorno de desarrollo devolvemos el mensaje de error para ayudar al debug
                    return res.status(500).send('Error en la consulta de reservas: ' + (err.message || JSON.stringify(err)));
                }

                const misReservas = rows.map(r => {
                    // formatear fechas a 'YYYY-MM-DD HH:MM'
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

    } catch (error) {
        console.error('Error al listar reservas:', error);
        res.status(500).send('Error interno del servidor.');
    }
});



// Ruta para servir imagen de un vehículo (redirige a imagen o placeholder)
// Esta ruta ya no es necesaria ya que las imágenes se sirven directamente desde /images/vehiculos/
// pero la mantenemos por compatibilidad
router.get('/vehiculos/:id/imagen', (request, response) => {
    const vehiculoId = request.params.id;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error al obtener conexión para imagen:', err);
            return response.redirect('/images/no-image.png');
        }

        const sql = 'SELECT imagen FROM Vehiculos WHERE id_vehiculo = ?';
        connection.query(sql, [vehiculoId], (err, rows) => {
            connection.release();

            if (err) {
                console.error('Error al consultar imagen:', err);
                return response.redirect('/images/no-image.png');
            }

            if (rows.length === 0 || !rows[0].imagen) {
                return response.redirect('/images/no-image.png');
            }

            // Redirigir a la ruta de la imagen en el sistema de archivos
            response.redirect(rows[0].imagen);
        });
    });
});

module.exports = router;