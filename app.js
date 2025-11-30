//BLOQUE DE IMPORTANCIONES
const express = require('express');
const session = require('express-session');
const pool = require('./config/database');

//CONFIGURACION SESION PARA LA BD
const mysqlSession = require ('express-mysql-session');
const MySQLStore = mysqlSession(session);
const sessionStore = new MySQLStore({}, pool);

const bcrypt = require('bcrypt');
const path = require('path');


//CONFIGURACIÓN INICIAL
const app = express();
const PORT = 3000;

//- Crear arrays vacíos para usuarios y reservas (almacenamiento temporal en memoria)


//CONFIGURACIÓN DE EXPRESS
app.set("view engine", "ejs"); //para usar ejs
app.set("views", path.join(__dirname, "views")); //de donde vamos a coger los ejs
app.use(express.urlencoded({ extended: true })); //Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); //para definir ruta archivos estaticos


//CONFIGURACIÓN DE SESIONES
const middlewareSession = session({
    resave: false, //fuerza a que se guarde el contenido de la sesion en la bd
    saveUninitialized: false, //no crea sesion para aquellos que no estan en la bd
    secret: "wei1234", //caddeza para firmar el "SID" que se ennvia al cliente
    cookie: {maxAge: 24 * 60 * 60 * 1000},
    store: sessionStore
});

app.use(middlewareSession);

//MIDDLEWARE GLOBAL: se usa para que en cada ejs podamos comprobar si el user esta logueado con un if(user)
app.use((request, response, next) => {
    response.locals.usuario = request.session.usuario || null;

    next(); //para que express continue con la sigueinte funcion
})


const autRoutes = require ('./routes/authRoutes');
const reservasRoutes = require('./routes/reservasRoutes');

app.use('/', autRoutes);
app.use('/reservas', reservasRoutes);


//INICIAR EL SERVIDOR
app.listen(PORT, function (err) {
    if (err) {
        console.error("Fallo el servidor" + err.message);
    } else {
        console.log("Servidor arrancado en el puerto 3000 http://localhost:3000");
    }
})



