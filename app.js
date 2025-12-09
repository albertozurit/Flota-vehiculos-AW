//BLOQUE DE IMPORTANCIONES
const express = require('express');
const session = require('express-session');
const pool = require('./config/config');

//CONFIGURACION SESION PARA LA BD
const mysqlSession = require('express-mysql-session');
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
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    store: sessionStore
});

app.use(middlewareSession);

//MIDDLEWARE GLOBAL: se usa para que en cada ejs podamos comprobar si el user esta logueado con un if(user)
app.use((request, response, next) => {
    response.locals.usuario = request.session.usuario || null;

    next(); //para que express continue con la sigueinte funcion
})


const authRoutes = require('./routes/authRoutes');
const reservasRoutes = require('./routes/reservasRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/', authRoutes);
app.use('/reservas', reservasRoutes);
app.use('/admin', adminRoutes);

//Pagina de error 404 cuando no se encuentra la ruta
app.use((request, response) => {
    response.status(404).render('404', { titulo: "Página no encontrada" });
});

//Pagina cuando hay error
app.use((err, request, response, next) => {
    console.error(err.stack);
    response.status(500).render('500', { titulo: "Error en el servidor" });
});



//SISTEMA AUTOMÁTICO DE LIBERACIÓN DE VEHÍCULOS
function liberarVehiculosExpirados() {
    // Primero actualizamos el estado de las reservas expiradas
    pool.query(`
        UPDATE Reservas 
        SET estado = 'finalizada'
        WHERE fecha_fin < NOW() 
        AND estado = 'confirmada'
    `, (errRes, resultRes) => {
        if (errRes) {
            return;
        }

        if (resultRes.affectedRows > 0) {
        }

        // Luego liberamos los vehículos cuyas reservas activas ya expiraron
        pool.query(`
            UPDATE Vehiculos v
            SET v.estado = 'disponible'
            WHERE v.estado = 'reservado'
            AND NOT EXISTS (
                SELECT 1 FROM Reservas r 
                WHERE r.id_vehiculo = v.id_vehiculo 
                AND r.estado = 'confirmada'
                AND r.fecha_inicio <= NOW()
                AND r.fecha_fin > NOW()
            )
        `, (errVeh, resultVeh) => {
            // Silencioso
        });
    });
}

// Ejecutar cada 30 segundos para pruebas (cambiar a 5 minutos en producción)
setInterval(liberarVehiculosExpirados, 30 * 1000);

// Ejecutar inmediatamente al iniciar
liberarVehiculosExpirados();

// Ejecutar al iniciar el servidor
liberarVehiculosExpirados();

//INICIAR EL SERVIDOR
app.listen(PORT, function (err) {
    if (err) {
        console.error("Fallo el servidor" + err.message);
    } else {
        console.log("Servidor arrancado en http://localhost:3000");
    }
})



