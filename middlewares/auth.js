function requireAuth(request, response, next) {
    if (request.session.usuario) {
        next();
    } else {
        console.log("Acceso denegado: usuario no registrado");
        response.redirect('/login');
    }
}

function requireAdmin(request, response, next) {
    if (request.session.usuario && request.session.usuario.rol === 'admin') {
        next();
    } else {
        console.log("Usuario sin permisos de administrador");
        response.redirect('/');
    }
}

module.exports = { requireAuth, requireAdmin };
