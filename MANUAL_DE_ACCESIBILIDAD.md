# Manual de Accesibilidad - FlotaWei

## Índice
1. [Introducción](#introducción)
2. [Principios de Accesibilidad](#principios-de-accesibilidad)
3. [Características de Accesibilidad](#características-de-accesibilidad)
4. [Modos de Visualización](#modos-de-visualización)
5. [Navegación por Teclado](#navegación-por-teclado)
6. [Tecnologías Asistivas](#tecnologías-asistivas)
7. [Configuración Personalizada](#configuración-personalizada)
8. [Estándares WCAG](#estándares-wcag)

---

## Introducción

**FlotaWei** ha sido diseñado siguiendo las pautas de accesibilidad web (WCAG 2.1 nivel AA) para garantizar que todas las personas puedan usar la aplicación de manera efectiva, independientemente de sus capacidades o del dispositivo que utilicen.

---

## Principios de Accesibilidad

### Perceptible
- Información y componentes de la interfaz presentados de forma que los usuarios puedan percibirlos
- Alternativas textuales para contenido no textual
- Contraste de color adecuado

### Operable
- Todas las funcionalidades disponibles mediante teclado
- Tiempo suficiente para leer y usar el contenido
- Navegación clara y consistente

### Comprensible
- Contenido textual legible y comprensible
- Páginas que aparecen y operan de manera predecible
- Ayuda a los usuarios a evitar y corregir errores

### Robusto
- Compatible con tecnologías asistivas actuales y futuras
- Código HTML semántico y válido

---

## Características de Accesibilidad

### 1. Contraste Visual

#### Modo Alto Contraste
- Fondo claro (#f5f5f5) con texto oscuro (#1a1a1a)
- Contraste mínimo 7:1 (AAA)
- Bordes y límites claramente definidos
- Iconos y botones resaltados

**Activar:**
1. Clic en icono de accesibilidad (esquina superior derecha)
2. Marcar "Alto contraste"
3. Guardar preferencias

### 2. Modo para Daltonismo

Paleta de colores adaptada para personas con deficiencia en la visión de colores (deuteranopia y protanopia):

- **Azul** (#0066CC) en lugar de verde para estados positivos
- **Naranja** (#FF9500) para resaltados y alertas
- **Magenta** (#CC0066) para errores/peligros
- Eliminación de colores problemáticos (rojo/verde)

**Activar:**
1. Clic en icono de accesibilidad
2. Marcar "Modo daltonismo"
3. Guardar preferencias

### 3. Tamaño de Fuente Personalizable

Ajustar el tamaño del texto para mejorar la legibilidad:

- **Rango**: 80% - 120%
- **Incrementos**: 10%
- **Por defecto**: 100%

**Configurar:**
1. Acceder a menú de accesibilidad
2. Usar control deslizante para ajustar tamaño
3. Guardar preferencias

### 4. Etiquetas ARIA

Todos los elementos interactivos incluyen etiquetas ARIA para lectores de pantalla:

```html
<button aria-label="Cerrar sesión">...</button>
<nav aria-label="Navegación principal">...</nav>
<form aria-labelledby="formTitle">...</form>
```

---

## Modos de Visualización

### Modo Normal (Por Defecto)
- Diseño estándar con paleta marrón (#3e2610)
- Contraste 4.5:1 (AA)
- Optimizado para visión normal

### Modo Alto Contraste
**Cambios visuales:**
- Navegación: Fondo gris claro (#f8f9fa) con texto marrón oscuro
- Botones: Bordes gruesos (2px) y rellenos sólidos
- Enlaces: Subrayados permanentes
- Formularios: Bordes oscuros bien definidos

**Uso recomendado:**
- Usuarios con baja visión
- Condiciones de iluminación desfavorables
- Preferencia personal por mayor contraste

### Modo Daltonismo
**Cambios visuales:**
- Navegación: Gradiente azul (#003d7a - #005ba3)
- Resaltados: Naranja (#FF9500)
- Estados:
  - Éxito/Disponible: Azul (#0099CC)
  - Advertencia: Amarillo (#FFCC00)
  - Error/Peligro: Naranja rojizo (#FF6600)

**Uso recomendado:**
- Usuarios con deuteranopia o protanopia
- Dificultad para distinguir rojo/verde

---

## Navegación por Teclado

### Atajos Globales (accesskey)

| Combinación | Función |
|-------------|---------|
| Alt + I | Ir a Inicio |
| Alt + V | Vehículos disponibles |
| Alt + H | Mis reservas (empleados) |
| Alt + A | Administración (admins) |

*Nota: En macOS usar Control + Option en lugar de Alt*

### Navegación Estándar

| Tecla | Función |
|-------|---------|
| Tab | Avanzar al siguiente elemento |
| Shift + Tab | Retroceder al elemento anterior |
| Enter | Activar botón/enlace |
| Espacio | Marcar checkbox o activar botón |
| Esc | Cerrar modal activo |
| Flechas ↑↓ | Navegar en menús desplegables |

### Orden de Tabulación

El orden de tabulación sigue un patrón lógico:
1. Logo/Inicio
2. Enlaces de navegación
3. Acciones de usuario (accesibilidad, perfil)
4. Contenido principal
5. Modales (cuando están abiertos)
6. Footer

### Indicadores de Foco

Todos los elementos enfocables muestran un borde de 2px en color temático:
- **Normal**: Azul claro (#c1d9ef)
- **Alto contraste**: Marrón oscuro (#3e2610)
- **Daltonismo**: Naranja (#FF9500)

---

## Tecnologías Asistivas

### Lectores de Pantalla

**Compatible con:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

**Elementos optimizados:**
- Encabezados jerárquicos (h1-h6)
- Landmarks ARIA (`<main>`, `<nav>`, `<header>`, `<footer>`)
- Roles ARIA explícitos
- Descripciones alternativas para imágenes
- Estados de formularios anunciados

### Navegación Semántica

Estructura HTML5 semántica:

```html
<header>
  <nav aria-label="Navegación principal">
    <ul>...</ul>
  </nav>
</header>

<main>
  <h1>Título de página</h1>
  <section aria-labelledby="section-title">
    <h2 id="section-title">Sección</h2>
    ...
  </section>
</main>

<footer>
  ...
</footer>
```

### Mensajes de Estado

Los cambios importantes se anuncian mediante regiones live:

```html
<div role="status" aria-live="polite">
  Reserva creada correctamente
</div>

<div role="alert" aria-live="assertive">
  Error: el vehículo no está disponible
</div>
```

---

## Configuración Personalizada

### Acceder al Panel de Accesibilidad
1. Hacer clic en el icono de accesibilidad universal (⚐)
2. Se abre el modal "Configuración de Accesibilidad"

### Opciones Disponibles

#### 1. Alto Contraste
- **Control**: Checkbox
- **Efecto**: Aplica inmediatamente el modo alto contraste
- **Persistencia**: Se guarda en la base de datos asociada al usuario

#### 2. Modo Daltonismo
- **Control**: Checkbox
- **Efecto**: Cambia la paleta de colores inmediatamente
- **Persistencia**: Se guarda en la base de datos

#### 3. Tamaño de Fuente
- **Control**: Slider (80% - 120%)
- **Efecto**: Ajusta el tamaño de todo el texto
- **Persistencia**: Se guarda en la base de datos

#### 4. Atajos Personalizados

**Atajo para Reservar:**
- Campo de texto para ingresar combinación (ej: "Ctrl+R")
- Se aplica en la página de vehículos disponibles

**Atajo para Mis Reservas:**
- Campo de texto para ingresar combinación (ej: "Ctrl+M")
- Navega directamente a la página de reservas

### Guardar Preferencias
1. Ajustar todas las opciones deseadas
2. Hacer clic en "Guardar preferencias"
3. Las configuraciones se aplican inmediatamente
4. Se guardan en el servidor y persisten entre sesiones

### Restablecer Configuración
Para volver a la configuración por defecto:
1. Desmarcar todos los checkboxes
2. Ajustar el slider a 100%
3. Borrar atajos personalizados
4. Guardar

---

## Estándares WCAG

FlotaWei cumple con **WCAG 2.1 Nivel AA**:

### Nivel A (Cumplido)
✅ 1.1.1 Contenido no textual: Alternativas textuales  
✅ 1.3.1 Información y relaciones: Estructura semántica  
✅ 2.1.1 Teclado: Toda funcionalidad accesible por teclado  
✅ 2.4.1 Omitir bloques: Landmarks y navegación  
✅ 3.1.1 Idioma de la página: `<html lang="es">`  
✅ 4.1.2 Nombre, función, valor: Roles y estados ARIA  

### Nivel AA (Cumplido)
✅ 1.4.3 Contraste mínimo: 4.5:1 (7:1 en modo alto contraste)  
✅ 1.4.5 Imágenes de texto: Mínimo uso, CSS preferido  
✅ 2.4.7 Foco visible: Indicador de 2px en todos los elementos  
✅ 3.2.3 Navegación consistente: Menú idéntico en todas las páginas  
✅ 3.3.3 Sugerencias ante errores: Mensajes descriptivos en formularios  

### Nivel AAA (Parcialmente cumplido)
⚠️ 1.4.6 Contraste mejorado: 7:1 solo en modo alto contraste  
✅ 2.4.8 Ubicación: Breadcrumbs y títulos claros  
✅ 3.3.5 Ayuda contextual: Tooltips y placeholders descriptivos  

---

## Pruebas de Accesibilidad

### Herramientas Utilizadas
- **WAVE**: Evaluación de accesibilidad web
- **axe DevTools**: Auditoría automatizada
- **Lighthouse**: Puntuación de accesibilidad de Chrome
- **Pruebas manuales**: Con lectores de pantalla y navegación por teclado

### Resultados
- **Lighthouse Accessibility Score**: 95+
- **WAVE**: 0 errores críticos
- **axe**: 0 violaciones de reglas WCAG

---

## Recomendaciones de Uso

### Para Usuarios con Baja Visión
1. Activar modo alto contraste
2. Aumentar tamaño de fuente al 110-120%
3. Usar zoom del navegador si es necesario (Ctrl/Cmd + +)

### Para Usuarios con Daltonismo
1. Activar modo daltonismo
2. Verificar que los estados son claramente distinguibles
3. Reportar cualquier confusión de colores al administrador

### Para Usuarios de Lectores de Pantalla
1. Utilizar navegación por landmarks (teclas de región)
2. Usar encabezados para saltar secciones (teclas H/1-6)
3. Escuchar anuncios de estado tras acciones importantes

### Para Usuarios con Movilidad Reducida
1. Configurar atajos de teclado personalizados
2. Usar solo teclado para navegar (Tab/Shift+Tab)
3. Aprovechar los atajos predeterminados (Alt + letra)

---

## Contacto y Retroalimentación

Si encuentras barreras de accesibilidad o tienes sugerencias de mejora, contacta con el administrador del sistema.

**Compromiso:**
Nos comprometemos a mantener y mejorar la accesibilidad de FlotaWei de forma continua.

---

**Versión del Manual**: 1.0  
**Última actualización**: Diciembre 2024  
**Estándar de referencia**: WCAG 2.1 Nivel AA
