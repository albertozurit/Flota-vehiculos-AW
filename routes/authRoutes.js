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

router.post('/login', async (request, response) => { //TODO revisar si el async iria aqui
     const {email, password} = request.body;
     const saltRounds = 10;


     try {
        const {emailBD, passwordBD} = await pool.execute('SELECT email, password FROM  users where email = ?', [email]);

        if(emailBD === email && passwordBD === await bcrypt.hash(password, saltRounds)) {
            request.session.mensaje = "Login  realizado con éxito";
            response.redirect('/');
        } else {
            console.log ("Compruebe sus credenciales");
        }

     } catch (error) {
        console.log("error al iniciar sesion");
     }
    
});



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