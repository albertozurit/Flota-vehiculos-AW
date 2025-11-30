const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');


//MIDDLEWARE DE PROTECCION: sirven como para restringir rutas (para usarlos los ponemos en los get app.get('/reservas', requireAuth, (req, res))
//Middleware de proteccion auth
function requireAuth(request, response, next) {
    if (request.session.usuario) { //verifica si el user esta en la sesion
        next(); //pasa el control a lo siguiente que venga
    } else {
        console.log("Acceso denegado: usuario no registrado");
        response.redirect('/usuarios/login'); //revisar si es render o redirect TODO
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
            connection.query(sql, [usuario.nombre, usuario.email, usuario.password, usuario.rol, 1],
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
router.post('/register', (request, response) => {
    const { nombre, email, password } = request.body;
    const rol = 'empleado';
    const saltRounds = 10;
    if (password.length < 8) {
        return response.render('usuarios/register', {
            title: 'Registro de usuario',
            usuario: null,
            mensaje: "La contraseña debe tener mínimo 8 caracteres",
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
                    rol: rol
                };

                insertarUsuario(usuario, (err, newUserId) => {
                    connection.release();
                    if (!err) {
                        usuario.id = newUserId;
                        request.session.usuario = usuario;
                        response.redirect('/');
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






router.post('/login', (request, response) => {
    const { email, password, recordar } = request.body;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Error al obtener conexión:", err);
            return response.render('usuarios/login', { mensaje: "Error en el servidor" });
        }

    let sql = 'SELECT id_usuario AS id, nombre, correo AS email, contrasena AS password, rol FROM Usuarios WHERE correo = ?';
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
                    rol: user.rol
                };

                request.session.save((err) => {
                    if (err) {
                        console.error("Error al guardar sesión:", err);
                        return response.render('usuarios/login', { mensaje: "Error en el servidor" });
                    }
                    console.log("✅ Login correcto, sesión guardada por:", recordar ? "30 días" : "24 horas");
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
        response.clearCookie('connect.sid');
        response.redirect('usuarios/login');
    });
});




//Accesibilidad
router.post('/accesibilidad/guardar', requireAuth, (request, response) => {
    //TODO añadir validaciones si es necesario
    request.session.preferencias = {
        contraste: request.body.contraste === 'true',
        daltonismo: request.body.daltonismo === 'true',
        fontSize: parseInt(request.body.fontSize) || 100
    };

    request.session.save(() => {
        response.redirect(request.get('referer') || '/'); 
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
//TODO revisar si un empleado puede hacer las reservas o debe hacerlo también un admin
router.post('/reservas/guardar', requireAuth, async (req, res) => {
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
                return res.redirect('/reservas/listado');
            }

            // Usamos transacción para insertar reserva y actualizar estado del vehículo
            connection.beginTransaction(transactionErr => {
                if (transactionErr) {
                    console.error('Error iniciando transacción:', transactionErr);
                    connection.release();
                    req.session.mensaje = 'Error en el servidor al guardar la reserva';
                    return res.redirect('/reservas/listado');
                }

                const insertSql = `INSERT INTO Reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado) VALUES (?,?,?,?,?)`;
                const insertParams = [userId, vehiculoId, inicio, fin, 'activa'];

                connection.query(insertSql, insertParams, (insertErr, insertRes) => {
                    if (insertErr) {
                        console.error('Error insertando reserva:', insertErr);
                        return connection.rollback(() => {
                            connection.release();
                            req.session.mensaje = 'Error al guardar la reserva';
                            return res.redirect('/reservas/listado');
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
                                return res.redirect('/reservas/listado');
                            });
                        }

                        connection.commit(commitErr => {
                            if (commitErr) {
                                console.error('Error al confirmar transacción:', commitErr);
                                return connection.rollback(() => {
                                    connection.release();
                                    req.session.mensaje = 'Error al guardar la reserva';
                                    return res.redirect('/reservas/listado');
                                });
                            }

                            connection.release();
                            console.log(`Reserva creada para el vehículo ${vehiculoId} de ${inicio} a ${fin} (id_reserva=${insertRes.insertId})`);
                            req.session.mensaje = '¡Reserva realizada con éxito!';
                            return res.redirect('/reservas/listado');
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
    // console.log("📍 Usuario en sesión:", request.session.usuario);
    response.status(200);
    response.render('index', {
        title: "Pagina principal",
        usuario: request.session.usuario || null,
        preferencias: request.session.preferencias || {} 
    });
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

router.get('/register', function (request, response) {
    response.status(200);
    response.render('usuarios/register', {
        title: "Registro de usuario",
        usuario: request.session.usuario || null,
        mensaje: request.session.mensaje || null,
        preferencias: request.session.preferencias || {}
    });
    request.session.mensaje = null;
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

// Listar vehículos solo autenticados
router.get('/vehiculos', requireAuth, (request, response) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Error al obtener conexión:", err);
            return response.render('vehiculos/lista', {
                vehiculos: [],
                mensaje: "Error en el servidor",
                preferencias: request.session.preferencias || {}
            });
        }

    let sql = `SELECT id_vehiculo AS id, matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, estado FROM Vehiculos`;
    connection.query(sql, (err, rows) => {
            connection.release();

            if (err) {
                console.error("Error en la consulta:", err);
                return response.render('vehiculos/lista', {
                    vehiculos: [],
                    mensaje: "Error en el servidor",
                    preferencias: request.session.preferencias || {}
                });
            }

            console.log(`📋 ${rows.length} vehículos encontrados`);
            response.render('vehiculos/lista', {
                title: "Lista de Vehículos",
                vehiculos: rows,
                mensaje: null,
                preferencias: request.session.preferencias || {}
            });
        });
    });
});


//Formulario para editar un vehiculo pasando su id como argumento
router.get('/vehiculos/:id/editar', requireAuth, requireAdmin, (request, response) => {
    const vehiculoId = request.params.id;
    
    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Error en el servidor");
            return response.redirect('/vehiculos');
        }

    let sql = "SELECT id_vehiculo AS id, matricula, marca, modelo, anio_matriculacion, numero_plazas, autonomia_km, color, estado FROM Vehiculos WHERE id_vehiculo = ?";
    connection.query(sql, [vehiculoId], (err, rows) => {
            connection.release();

            if (err) {
                console.error("Error en la consulta:", err);
                return  response.redirect('/vehiculos');
            }

            console.log(`vehiculo editado`);
            if(rows.length === 0) {
                console.log("Vehículo no encontrado");
                return response.redirect('/vehiculos');
            }
            response.render('vehiculos/editar', {
                title: "Editar Vehículo",
                mensaje: null,
                vehiculo: rows[0],
                preferencias: request.session.preferencias || {}
            });
        })
    })

});


router.get('/reservas/nuevo', requireAuth, async (req, res) => {
    try {
        // **PASO 1:** Obtener la lista de vehículos disponibles desde la BD.
        // Ejemplo ficticio de datos:
        const vehiculosDisponibles = [
            { id: 1, nombre: 'Tesla Model 3', matricula: '1234 ABC', bateria: '80%' },
            { id: 2, nombre: 'Nissan Leaf', matricula: '5678 DEF', bateria: '70%' },
            // En una aplicación real, usarías: const vehiculos = await db.getVehiculosDisponibles();
        ];

        res.render('reservasformulario', {
            title: 'Nueva Reserva de Vehículo',
            usuario: req.session.usuario,
            vehiculos: vehiculosDisponibles,
            mensaje: null
        });
    } catch (error) {
        console.error('Error al cargar el formulario de reserva:', error);
        res.status(500).send('Error interno del servidor.');
    }
});

router.get('/reservas/listado', requireAuth, async (req, res) => {
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
                WHERE r.id_usuario = ?
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
                    const inicio = r.fecha_inicio ? new Date(r.fecha_inicio).toISOString().slice(0,16).replace('T',' ') : '';
                    const fin = r.fecha_fin ? new Date(r.fecha_fin).toISOString().slice(0,16).replace('T',' ') : '';
                    return {
                        id: r.id,
                        vehiculo: `${r.marca || ''} ${r.modelo || ''}`.trim(),
                        matricula: r.matricula || '',
                        inicio: inicio,
                        fin: fin,
                        estado: r.estado
                    };
                });

                res.render('reservas/listareservas', {
                    title: 'Mis Reservas',
                    usuario: req.session.usuario,
                    reservas: misReservas,
                    mensaje: req.session.mensaje
                });
                req.session.mensaje = null;
            });
        });

    } catch (error) {
        console.error('Error al listar reservas:', error);
        res.status(500).send('Error interno del servidor.');
    }
});




module.exports = router;