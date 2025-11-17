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
        response.redirect('/login'); //revisar si es render o redirect TODO
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
            let sql = "INSERT INTO USERS (nombre, email, password, rol) VALUES (?,?,?,?)";
            connection.query(sql, [vehiculo.marca, vehiculo.modelo, vehiculo.tipo, vehiculo.precioHora], 
                (err, results) => {
                    connection.release()
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
        if (err) {
            callback(err);

            
        } else {
            let sql = "INSERT INTO VEHICULOS (marca, modelo, tipo, precioHora) VALUES (?,?,?,?,?)";
            connection.query(sql);
            (err, results) => {
                connection.release();
                if (err) {
                    callback(err);
                } else {
                    callback(null, results.insertId); //TODO 
                }
            }
        }
    });
}

//RUTAS POST
router.post('/register', (request, response) => {
    const { nombre, email, password } = request.body;
    const rol = 'empleado';
    const saltRounds = 10;
    if (password.length < 8) {
        return response.render('register', {
            usuario: null,
            mensaje: "La contraseña debe tener mínimo 8 caracteres"
        });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Error al obtener conexión:", err);
            return response.render('register', {
                usuario: null,
                mensaje: "Error en el servidor"
            });
        }

        let sqlCheck = 'SELECT email FROM USERS WHERE email = ?';
        connection.query(sqlCheck, [email], (err, rows) => {
            if (err) {
                connection.release();
                console.error("Error al verificar email:", err);
                return response.render('register', {
                    usuario: null,
                    mensaje: "Error en el servidor"
                });
            }

            if (rows.length > 0) {
                connection.release();
                return response.render('register', {
                    usuario: null,
                    mensaje: "El correo electrónico ya está registrado"
                });
            }


            bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
                if (err) {
                    connection.release();
                    console.error("Error al hashear la contraseña", err);
                    return response.render('register', {
                        usuario: null,
                        mensaje: "Error al procesar la contraseña"
                    });
                }

                let usuario = {
                    nombre: nombre,
                    email: email,
                    password: hashedPassword
                };

                insertarUsuario(usuario, (err, newUserId) => {
                    connection.release();
                    if (!err) {
                        usuario.id = newUserId;
                        request.session.usuario = usuario;
                        response.redirect('/');
                    } else {
                        console.log("Error al insertar usuario", err);
                        response.render('register', {
                            usuario: null,
                            mensaje: "Error al crear el usuario"
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
            return response.render('login', { mensaje: "Error en el servidor" });
        }

        let sql = 'SELECT id, nombre, email, password, rol FROM USERS WHERE email = ?';
        connection.query(sql, [email], (err, rows) => {
            connection.release();

            if (err) {
                console.error("Error en la consulta:", err);
                return response.render('login', { mensaje: "Error en el servidor" });
            }

            if (rows.length === 0) {
                console.log("Usuario no encontrado");
                return response.render('login', { mensaje: "Usuario no encontrado" });
            }

            const user = rows[0];

            bcrypt.compare(password, user.password, (err, passwordOk) => {
                if (err) {
                    console.error("Error al comparar contraseñas:", err);
                    return response.render('login', { mensaje: "Error en el servidor" });
                }

                if (!passwordOk) {
                    console.log("Contraseña incorrecta");
                    return response.render('login', { mensaje: "Contraseña incorrecta" });
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
                        return response.render('login', { mensaje: "Error en el servidor" });
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
        response.redirect('/login');
    });
});


// Crear vehículo (solo admin)
router.post('/vehiculos/nuevo', requireAuth, requireAdmin, (request, response) => {
    const { marca, modelo, tipo, precioHora } = request.body;

    // Validaciones básicas
    if (!marca || !modelo || !precioHora) {
        return response.render('vehiculos/nuevo', {
            mensaje: "Por favor, completa todos los campos obligatorios"
        });
    }

    const vehiculo = {
        marca: marca,
        modelo: modelo,
        tipo: tipo || 'electrico',
        precioHora: precioHora
    };

    insertarVehiculo(vehiculo, (err, newVehicleId) => {
        if (!err) {
            console.log("✅ Vehículo creado con ID:", newVehicleId);
            response.redirect('/');
        } else {
            console.error("Error al insertar vehículo:", err);
            response.render('vehiculos/nuevo', {
                mensaje: "Error al crear el vehículo"
            });
        }
    });
});





//RUTAS GET
router.get('/', function (request, response) {
    console.log("📍 Usuario en sesión:", request.session.usuario);
    response.status(200);
    response.render('index', {
        title: "Pagina principal"
    });
});

router.get('/register', function (request, response) {
    response.status(200);
    response.render('register', {
        usuario: request.session.usuario || null,
        mensaje: request.session.mensaje || null
    });
    request.session.mensaje = null;
});

router.get('/login', function (request, response) {
    response.status(200);
    response.render('login');
});


// Formulario para crear vehículo (solo admin)
router.get('/vehiculos/nuevo', requireAuth, requireAdmin, (request, response) => {
    response.status(200);
    response.render('vehiculos/nuevo', {
        mensaje: null
    });
});

// Listar vehículos 
router.get('/vehiculos', requireAuth, (request, response) => {
    pool.getConnection((err, connection) => {
        if(err) {
            console.error("Error al obtener conexión:", err);
            return response.render('vehiculos/lista', {
                vehiculos: [],
                mensaje: "Error en el servidor"
            });
        }

        let sql = 'SELECT * FROM VEHICULOS';
        connection.query(sql, (err, rows) => {
            connection.release();
            
            if(err) {
                console.error("Error en la consulta:", err);
                return response.render('vehiculos/lista', {
                    vehiculos: [],
                    mensaje: "Error en el servidor"
                });
            }

            console.log(`📋 ${rows.length} vehículos encontrados`);
            response.render('vehiculos/lista', {
                vehiculos: rows,
                mensaje: null
            });
        });
    });
});



module.exports = router;