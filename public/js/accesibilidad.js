document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    
    // Controles del Modal
    const contrasteSwitch = document.getElementById('switchContraste');
    const daltonismoSwitch = document.getElementById('switchDaltonismo');
    const fontSizeRange = document.getElementById('fontSizeRange');
    const formAccesibilidad = document.getElementById('formAccesibilidad');
    
    // --- 1. APLICAR ESTILOS AL INICIO DE LA CARGA ---
    const applyStylesFromStorage = () => {
        // Cargar Contraste
        if (sessionStorage.getItem('altoContraste') === 'true') {
            body.classList.add('alto-contraste');
            if (contrasteSwitch) contrasteSwitch.checked = true;
        } else if (contrasteSwitch) {
            body.classList.remove('alto-contraste');
            contrasteSwitch.checked = false;
        }

        // Cargar Daltonismo (CLASE CORREGIDA: 'daltonismo')
        if (sessionStorage.getItem('daltonismo') === 'true') {
            body.classList.add('daltonismo');
            if (daltonismoSwitch) daltonismoSwitch.checked = true;
        } else if (daltonismoSwitch) {
            body.classList.remove('daltonismo');
            daltonismoSwitch.checked = false;
        }

        // Cargar Tamaño de Fuente
        const savedSize = sessionStorage.getItem('fontSize');
        if (savedSize) {
            body.style.fontSize = savedSize + '%';
            if (fontSizeRange) fontSizeRange.value = savedSize;
        } else if (fontSizeRange) {
             body.style.fontSize = '100%'; // Valor por defecto
             fontSizeRange.value = 100;
        }
    };
    
    applyStylesFromStorage();
    

    // --- 2. MANEJAR CAMBIOS EN EL MODAL (Tiempo Real) ---
    
    // Listener para Alto Contraste
    if (contrasteSwitch) {
        contrasteSwitch.addEventListener('change', () => {
            if (contrasteSwitch.checked) {
                body.classList.add('alto-contraste');
                sessionStorage.setItem('altoContraste', 'true');
            } else {
                body.classList.remove('alto-contraste');
                sessionStorage.setItem('altoContraste', 'false');
            }
            // También aseguramos que no se superpongan visualmente
            if (contrasteSwitch.checked && daltonismoSwitch) {
                daltonismoSwitch.checked = false;
                body.classList.remove('daltonismo');
                sessionStorage.setItem('daltonismo', 'false');
            }
        });
    }

    // Listener para Daltonismo (CLASE CORREGIDA: 'daltonismo')
    if (daltonismoSwitch) {
        daltonismoSwitch.addEventListener('change', () => {
            if (daltonismoSwitch.checked) {
                body.classList.add('daltonismo');
                sessionStorage.setItem('daltonismo', 'true');
            } else {
                body.classList.remove('daltonismo');
                sessionStorage.setItem('daltonismo', 'false');
            }
            // También aseguramos que no se superpongan visualmente
            if (daltonismoSwitch.checked && contrasteSwitch) {
                contrasteSwitch.checked = false;
                body.classList.remove('alto-contraste');
                sessionStorage.setItem('altoContraste', 'false');
            }
        });
    }

    // Listener para Tamaño de Fuente (Input)
    if (fontSizeRange) {
        fontSizeRange.addEventListener('input', () => {
            const newSize = fontSizeRange.value;
            body.style.fontSize = newSize + '%';
            sessionStorage.setItem('fontSize', newSize); // Guardado temporal
        });
    }


    // --- 3. GUARDAR EN EL SERVIDOR AL ENVIAR FORMULARIO ---
    if (formAccesibilidad) {
        formAccesibilidad.addEventListener('submit', (e) => {
            // El formulario POST a /accesibilidad/guardar se encarga de guardar en la sesión del servidor.
            // Si el servidor redirecciona, las nuevas preferencias se cargan desde EJS y luego JS.
        });
    }
});