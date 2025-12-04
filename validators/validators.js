/**
 * Validadores con express-validator
 * 
 * Uso: importar los validadores y usarlos como middleware en las rutas.
 * Ejemplo: router.post('/register', validarRegistro, handleValidationErrors, (req, res) => {...});
 */

const { body, param, validationResult } = require('express-validator');

// ============ CONSTANTES ============
const CORPORATE_DOMAIN = 'flotawei.com';

// ============ MIDDLEWARE HELPER ============

/**
 * Middleware que procesa los errores de validación.
 * Si hay errores, los pasa a la siguiente función con req.validationErrors
 * para que cada ruta decida cómo mostrarlos.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Guardar errores para que la ruta los use
        req.validationErrors = errors.array();
        // Crear mensaje unificado
        req.validationMessage = errors.array().map(e => e.msg).join('. ');
    }
    next();
};

// ============ VALIDADORES DE USUARIO ============

/**
 * Validador para registro de usuario
 */
const validarRegistro = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('email')
        .trim()
        .notEmpty().withMessage('El correo es obligatorio')
        .isEmail().withMessage('Formato de correo inválido')
        .custom((value) => {
            if (!value.toLowerCase().endsWith(`@${CORPORATE_DOMAIN}`)) {
                throw new Error(`El correo debe ser corporativo (@${CORPORATE_DOMAIN})`);
            }
            return true;
        }),

    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/\d/).withMessage('La contraseña debe contener al menos un número')
];

/**
 * Validador para login
 */
const validarLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('El correo es obligatorio')
        .isEmail().withMessage('Formato de correo inválido'),

    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria')
];

// ============ VALIDADORES DE RESERVAS ============

/**
 * Validador para crear reserva
 */
const validarReserva = [
    body('vehiculoId')
        .notEmpty().withMessage('Debe seleccionar un vehículo')
        .isInt({ min: 1 }).withMessage('ID de vehículo inválido'),

    body('fechaInicio')
        .notEmpty().withMessage('La fecha de inicio es obligatoria')
        .isDate().withMessage('Formato de fecha de inicio inválido'),

    body('horaInicio')
        .notEmpty().withMessage('La hora de inicio es obligatoria')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato de hora inválido (HH:MM)'),

    body('fechaFin')
        .notEmpty().withMessage('La fecha de fin es obligatoria')
        .isDate().withMessage('Formato de fecha de fin inválido')
        .custom((value, { req }) => {
            const inicio = new Date(`${req.body.fechaInicio}T${req.body.horaInicio}`);
            const fin = new Date(`${value}T${req.body.horaFin}`);
            if (fin <= inicio) {
                throw new Error('La fecha/hora de fin debe ser posterior a la de inicio');
            }
            return true;
        }),

    body('horaFin')
        .notEmpty().withMessage('La hora de fin es obligatoria')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato de hora inválido (HH:MM)')
];

// ============ VALIDADORES DE VEHÍCULOS ============

/**
 * Validador para crear/editar vehículo
 */
const validarVehiculo = [
    body('matricula')
        .trim()
        .notEmpty().withMessage('La matrícula es obligatoria')
        .isLength({ min: 2, max: 20 }).withMessage('Matrícula debe tener entre 2 y 20 caracteres'),

    body('marca')
        .trim()
        .notEmpty().withMessage('La marca es obligatoria')
        .isLength({ min: 1, max: 50 }).withMessage('Marca debe tener máximo 50 caracteres'),

    body('modelo')
        .trim()
        .notEmpty().withMessage('El modelo es obligatorio')
        .isLength({ min: 1, max: 50 }).withMessage('Modelo debe tener máximo 50 caracteres'),

    body('anio_matriculacion')
        .optional({ checkFalsy: true })
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage('Año de matriculación inválido'),

    body('numero_plazas')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 50 }).withMessage('Número de plazas debe ser entre 1 y 50'),

    body('autonomia_km')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 2000 }).withMessage('Autonomía debe ser entre 1 y 2000 km'),

    body('color')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 30 }).withMessage('Color debe tener máximo 30 caracteres')
];

// ============ VALIDADORES DE CONCESIONARIOS ============

/**
 * Validador para crear/editar concesionario
 */
const validarConcesionario = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre del concesionario es obligatorio')
        .isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),

    body('ciudad')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('Ciudad debe tener máximo 100 caracteres'),

    body('direccion')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 200 }).withMessage('Dirección debe tener máximo 200 caracteres'),

    body('telefono_contacto')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[0-9+\-\s()]{6,20}$/).withMessage('Formato de teléfono inválido')
];

// ============ VALIDADORES DE ADMIN ============

/**
 * Validador para cambiar rol de usuario
 */
const validarCambioRol = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de usuario inválido'),

    body('rol')
        .notEmpty().withMessage('El rol es obligatorio')
        .isIn(['admin', 'empleado']).withMessage('Rol debe ser admin o empleado')
];

/**
 * Validador para asignar concesionario base a usuario
 */
const validarAsignarBase = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de usuario inválido'),

    body('id_concesionario')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('ID de concesionario inválido')
];

// ============ EXPORTAR ============

module.exports = {
    // Middleware
    handleValidationErrors,

    // Validadores de usuario
    validarRegistro,
    validarLogin,

    // Validadores de reservas
    validarReserva,

    // Validadores de vehículos
    validarVehiculo,

    // Validadores de concesionarios
    validarConcesionario,

    // Validadores de admin
    validarCambioRol,
    validarAsignarBase
};
