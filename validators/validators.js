/*VALIDACIONES CON EXPRESS-VALIDATOR*/

const { check, validationResult } = require('express-validator');

// Validación de login (simple)
const validarLogin = [
    check("email", "El correo es obligatorio").notEmpty(),
    check("email", "Formato de correo inválido").isEmail(),
    check("password", "La contraseña es obligatoria").notEmpty()
];

// Validación de registro
const validarRegistro = [
    check("nombre", "El nombre es obligatorio").notEmpty(),
    check("nombre", "El nombre debe tener entre 2 y 100 caracteres").isLength({ min: 2, max: 100 }),
    check("email", "El correo es obligatorio").notEmpty(),
    check("email", "Formato de correo inválido").isEmail(),
    check("email", "El correo debe ser corporativo (@flotawei.com)").matches(/@flotawei\.com$/i),
    check("password", "La contraseña debe tener mínimo 8 caracteres").isLength({ min: 8 }),
    check("password", "La contraseña debe contener al menos una mayúscula").matches(/[A-Z]/),
    check("password", "La contraseña debe contener al menos un número").matches(/\d/)
];

// Validación de vehículo
const validarVehiculo = [
    check("matricula", "La matrícula es obligatoria").notEmpty(),
    check("matricula", "La matrícula debe tener entre 2 y 20 caracteres").isLength({ min: 2, max: 20 }),
    check("marca", "La marca es obligatoria").notEmpty(),
    check("marca", "La marca debe tener máximo 50 caracteres").isLength({ max: 50 }),
    check("modelo", "El modelo es obligatorio").notEmpty(),
    check("modelo", "El modelo debe tener máximo 50 caracteres").isLength({ max: 50 }),
    check("anio_matriculacion", "Año de matriculación inválido").optional({ checkFalsy: true }).isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
    check("numero_plazas", "Número de plazas debe ser entre 1 y 50").optional({ checkFalsy: true }).isInt({ min: 1, max: 50 }),
    check("autonomia_km", "Autonomía debe ser entre 1 y 10000 km").optional({ checkFalsy: true }).isInt({ min: 1, max: 10000 }),
    check("color", "Color debe tener máximo 30 caracteres").optional({ checkFalsy: true }).isLength({ max: 30 })
];

// Validación de reserva
const validarReserva = [
    check("vehiculoId", "Debe seleccionar un vehículo").notEmpty(),
    check("vehiculoId", "ID de vehículo inválido").isInt({ min: 1 }),
    check("fechaInicio", "La fecha de inicio es obligatoria").notEmpty(),
    check("fechaInicio", "Formato de fecha de inicio inválido").isDate(),
    check("horaInicio", "La hora de inicio es obligatoria").notEmpty(),
    check("horaInicio", "Formato de hora inválido (HH:MM)").matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    check("fechaFin", "La fecha de fin es obligatoria").notEmpty(),
    check("fechaFin", "Formato de fecha de fin inválido").isDate(),
    check("horaFin", "La hora de fin es obligatoria").notEmpty(),
    check("horaFin", "Formato de hora inválido (HH:MM)").matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
];

// Validación de concesionario
const validarConcesionario = [
    check("nombre", "El nombre del concesionario es obligatorio").notEmpty(),
    check("nombre", "Nombre debe tener entre 2 y 100 caracteres").isLength({ min: 2, max: 100 }),
    check("ciudad", "Ciudad debe tener máximo 100 caracteres").optional({ checkFalsy: true }).isLength({ max: 100 }),
    check("direccion", "Dirección debe tener máximo 200 caracteres").optional({ checkFalsy: true }).isLength({ max: 200 }),
    check("telefono_contacto", "Formato de teléfono inválido").optional({ checkFalsy: true }).matches(/^[0-9+\-\s()]{6,20}$/)
];

// Validación de cambio de rol
const validarCambioRol = [
    check("rol", "El rol es obligatorio").notEmpty(),
    check("rol", "El rol debe ser 'admin' o 'empleado'").isIn(['admin', 'empleado'])
];

// Validación de asignar base
const validarAsignarBase = [
    check("id_concesionario", "ID de concesionario inválido").optional({ checkFalsy: true }).isInt({ min: 1 })
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.validationErrors = errors.array();
        req.validationMessage = errors.array().map(e => e.msg).join(', ');
        return next();
    }
    next();
};

module.exports = {
    // Middlewares
    validationResult, // Para usar en las rutas
    handleValidationErrors,

    // Validadores
    validarLogin,
    validarRegistro,
    validarVehiculo,
    validarReserva,
    validarConcesionario,
    validarCambioRol,
    validarAsignarBase
};
