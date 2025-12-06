# Carrusel Hero - Página de Inicio

## 🎨 Características Estilo BMW

### **Diseño Premium**
- ✅ Carrusel a pantalla completa (75vh)
- ✅ Transiciones suaves con efecto fade
- ✅ 5 slides con los vehículos premium de la flota
- ✅ Cambio automático cada 4 segundos
- ✅ Controles manuales (flechas + indicadores)

---

## 🚗 Vehículos Destacados

### **Slide 1: Tesla Model 3**
- Imagen: `/images/vehiculos/tesla-model-3.jpg`
- Texto: "El futuro de la movilidad eléctrica. Hasta 580 km de autonomía"

### **Slide 2: BMW iX3**
- Imagen: `/images/vehiculos/bmw-iX3.png`
- Texto: "Placer de conducir eléctrico. 460 km de autonomía pura"

### **Slide 3: Audi e-tron GT**
- Imagen: `/images/vehiculos/audi-e-tron-GT.png`
- Texto: "Rendimiento deportivo con cero emisiones. 488 km de autonomía"

### **Slide 4: Porsche Taycan**
- Imagen: `/images/vehiculos/porsche-taycan.jpg`
- Texto: "El alma deportiva se vuelve eléctrica. 484 km de rendimiento puro"

### **Slide 5: Mercedes-Benz EQC**
- Imagen: `/images/vehiculos/Mercedez-Benz-EQC.png`
- Texto: "Lujo eléctrico redefinido. 417 km de elegancia sostenible"

---

## 🎯 Efectos y Animaciones

### **Overlay Gradient**
- Gradiente oscuro en la parte inferior para mejor legibilidad
- Filtro de brillo en las imágenes (75%)
- Texto con sombra para destacar sobre cualquier fondo

### **Animaciones CSS**
- **fadeInUp**: Entrada de texto desde abajo con fade
- **pulse**: Iconos de características con efecto de pulso
- **hover-lift**: Tarjetas se elevan al pasar el ratón

### **Botones CTA**
- Estilo uppercase con tracking de letras
- Hover con borde transparente
- Transición suave con elevación

---

## 📐 Responsive Design

### **Desktop (> 768px)**
- Altura: 75vh (mínimo 500px)
- Título: Display-4
- Botones lado a lado

### **Tablet (768px - 576px)**
- Altura: 60vh (mínimo 400px)
- Título: 2rem
- Texto reducido

### **Mobile (< 576px)**
- Altura: 50vh (mínimo 350px)
- Título: 1.75rem
- Botones apilados verticalmente

---

## 🔧 Componentes Adicionales

### **Panel de Bienvenida**
- Diseño compacto y centrado
- Botones adaptados según rol de usuario:
  - **No autenticado**: "Iniciar Sesión"
  - **Empleado**: "Ver Vehículos" + "Mis Reservas"
  - **Admin**: "Panel de Administración"

### **Tarjetas de Características**
- 3 columnas en desktop
- Iconos SVG animados
- Efecto hover con elevación
- Colores diferenciados:
  - 🔵 Azul: Reservas (Primary)
  - 🟢 Verde: Accesibilidad (Success)
  - 🟡 Amarillo: Panel Admin (Warning)

---

## 📁 Archivos Modificados

```
views/
├── index.ejs          ← Carrusel + layout actualizado

public/css/
└── styles.css         ← Nuevos estilos del carrusel
```

---

## 🎨 Paleta de Colores

- **Overlay**: rgba(0,0,0,0.8) → rgba(0,0,0,0)
- **Botones**: Blanco (#ffffff)
- **Hover**: Transparente con borde blanco
- **Sombras**: rgba(0,0,0,0.5) para texto

---

## 🚀 Experiencia de Usuario

1. **Primera Impresión**: Carrusel hero con imágenes premium
2. **Engagement**: Botones CTA claros y visibles
3. **Información**: Panel de bienvenida conciso
4. **Features**: 3 características clave destacadas
5. **Navegación**: Acceso rápido según rol del usuario

---

## ✨ Mejores Prácticas Implementadas

- ✅ Lazy loading implícito de imágenes
- ✅ Alt text en todas las imágenes
- ✅ Controles accesibles (aria-labels)
- ✅ Transiciones suaves
- ✅ Performance optimizado
- ✅ Mobile-first responsive
- ✅ Contraste WCAG AA compliant

---

## 🎯 Inspiración BMW

El diseño sigue los principios de BMW:
- **Minimalismo**: Texto claro y directo
- **Premium**: Imágenes de alta calidad
- **Elegancia**: Transiciones suaves
- **Funcionalidad**: Navegación intuitiva
- **Lujo**: Detalles cuidados

