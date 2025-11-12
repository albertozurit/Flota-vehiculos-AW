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

//Middleware de administrador
function requireAdmin(request, response, next) {
    if (request.session.usuario && request.session.usuario.rol === 'admin') {
        next(); //si el usuario esta en la sesion y es de rol admin
    } else {
        console.log("Usuario sin permisos de administrador");
        response.redirect('/');
    }
}

//RUTAS POST

router.post('/register', async (request, response) => {
    const { nombre, email, password } = request.body; //TODO
    const rol = 'empleado';
    const saltRounds = 10; //para el tema del hash de la password

    const sendErrors = (mensaje) => { //funcion para rediriger al register si ha habido algun error
        request.session.mensaje = mensaje;
        return response.redirect('/register');
    }

    if (password.length < 8) {
        return sendErrors("La contraseña tiene que tener al menos 8 digitos");
    }

    try {

        // dice el profe que no hay que usar await, usar callback despues del proceso que se ejecuta 
        // asi solo en un sistema asincrono
        const [existeUsuario] = await pool.execute('SELECT email FROM USERS where email = ?', [email]);

        if (existeUsuario.length > 0) {
            return sendErrors("Error: El correo electrónico ya está registrado.");
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await pool.execute('INSERT INTO USERS (nombre, email, password, rol) VALUES (?,?,?,?)', [nombre, email, hashedPassword, rol]);

        request.session.mensaje = 'Registro realizado con éxito';
        response.redirect('/login');

    } catch (error) {

        console.error("Error al registrar usuario", error);

        sendErrors("Error interno del servdidor. Inténtelo de nuevo");

    }



});
//TODO mejorar errores
router.post('/login', async (request, response) => {
  const { email, password } = request.body;

  try {
    // Buscar el usuario por email
    const [rows] = await pool.execute(
      'SELECT email, password FROM USERS WHERE email = ?',
      [email]
    );

    // Si no existe el usuario
    if (rows.length === 0) {
      console.log("Usuario no encontrado");
      return response.render('login', { mensaje: "Usuario no encontrado" });
    }

    const user = rows[0];

    // Comparar contraseñas
    const passwordOk = await bcrypt.compare(password, user.password);

    if (!passwordOk) {
      console.log("Contraseña incorrecta");
      return response.render('login', { mensaje: "Contraseña incorrecta" });
    }

    // Si todo va bien:
    request.session.mensaje = "Login realizado con éxito";
    request.session.usuario = user;
    console.log("✅ Login correcto");
    response.redirect('/');

  } catch (error) {
    console.error("⚠️ Error al iniciar sesión:", error);
    response.render('login', { mensaje: "Error en el servidor" });
  }
});

//logout 
router.post('/logout', (request, response) => {
    request.session.destroy((err) => {
        if(err){
            console.log("Erorr cerrando sesion: ", err);
            return response.redirect('/');
        }
        response.clearCookie('connect.sid');
        response.redirect('/login');
    });
});
//hay que añadir en la pagina principal un boton para salir de la sesion yo haria 
// un modal que se despliegue o añadir el boton en la cabecera del menu 
// <form action="/logout" method="POST";">
//<button type="submit" class="btn btn-danger">Cerrar sesion</button>
//</form>




//RUTAS GET
router.get('/', function (request, response) {
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


module.exports = router;