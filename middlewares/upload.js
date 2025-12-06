const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento en disco (para guardar en public/images/vehiculos)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'images', 'vehiculos'));
    },
    filename: function (req, file, cb) {
        // Nombre único: timestamp + número aleatorio + extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'vehiculo-' + uniqueSuffix + ext);
    }
});

// Filtro de archivos - solo imágenes
const fileFilter = function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
    }
};

// Configurar multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    },
    fileFilter: fileFilter
});

module.exports = upload;
