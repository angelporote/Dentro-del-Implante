# Guía editorial del libro de texto · *Dentro del implante*

Este documento fija el criterio visual, tipográfico y didáctico común para los **6 capítulos descargables** (`libro/Capitulo_0X_*.pdf`), asociados a las 6 vitrinas de la web 3D. Todo capítulo nuevo —y la revisión del Capítulo 1— debe compilarse enlazando [plantilla.css](plantilla.css).

---

## 1. Formato, tipografía y paleta

- **Soporte:** A4 vertical (`18 mm` arriba, `19 mm` abajo, `17 mm` laterales).
- **Extensión objetivo:** **4 a 6 páginas completas y equilibradas** por capítulo (evitar que la última página quede por debajo del ~50 % de ocupación).
- **Tipografía:**
  - **Títulos, portadilla, etiquetas, cabeceras de tabla y rótulos de figura:** `Sora` (pesos 600–800).
  - **Cuerpo de texto y listas:** `Inter` / `Segoe UI` a `9.7 pt`, interlineado `1.52`, **alineación a la izquierda** (`text-align: left`) para evitar espacios irregulares en términos largos (*osteointegración*, *hidroxiapatita*, *polimetilmetacrilato*).
- **Paleta en papel (coherente con el museo 3D oscuro):**
  - Portadilla: degradado `#0b0a22 → #1e1b4b → #134e4a` con subtítulo `#5eead4`.
  - Tinta principal: `#1e293b` / encabezados `#0f172a`.
  - Cajas semánticas fijas en los 6 capítulos:
    - **Azul (`.box.def`):** Definiciones de consenso, ecuaciones o normas clave.
    - **Rojo (`.box.warn`):** *Ojo · Trampa frecuente de examen*.
    - **Verde bioactivo (`.box.bio`):** *Del laboratorio al paciente* (criterio clínico).
    - **Violeta (`.box.lab`):** *Caso práctico o problema numérico resuelto* (mecánica, selección de material, etc.).

## 2. Estructura uniforme de cada capítulo

1. **Portadilla superior (`.cover-band`)**: etiqueta del capítulo (`Capítulo X · Vitrina 0X`), título directo y una introducción breve de 2–3 líneas que conecte con el hilo *"del material en bruto al implante"*. *(Sin instrucciones meta sobre cómo usar la web: el documento se lee como un libro de texto autónomo).*
2. **Barra de metadatos (`.meta-bar`)**: asignaturas de referencia (UVigo 3º *Biomateriales* / 4º *Biocompatibilidad y comportamiento mecánico*), autoría y licencia `CC BY-NC-SA 4.0`.
3. **Bloques teóricos numerados (`X.1` a `X.4`)**:
   - Fundamentos y definiciones clave.
   - Tablas comparativas con parámetros reales y unidades (`GPa`, `MPa`, `%`, `g/cm³`).
   - Mecanismos biológicos o de fallo + aplicación clínica.
4. **Cierre estándar (`X.5`)**:
   - **Ideas clave de repaso (chuleta)** + **Autoevaluación rápida** (3–4 preguntas con respuesta concisa) + **Bibliografía de referencia** (Wagner 2020, apuntes UVigo, normas ISO/ASTM citadas).

## 3. Criterio de imágenes y figuras

Cada capítulo incluye **como mínimo 2 elementos gráficos** numerados como `Figura X.1`, `Figura X.2`, etc. (y `Tabla X.1` para tablas principales):

1. **Diagramas vectoriales SVG propios** (`.diagram`): esquemas explicativos de mecanismos, curvas esfuerzo–deformación, diagramas de flujo o interfaces, con fondos claros (`#f8fafc` / `#ffffff`) y la misma paleta de acentos (`#0f766e`, `#1d4ed8`, `#6d28d9`, `#b45309`, `#b91c1c`).
2. **Mini-renders 3D reales capturados de la vitrina web** (`.render-panel` / `.render-cards`): tarjetas oscuras (`#0b0a22`) con renders PNG exportados directamente de las escenas 3D mejoradas de cada vitrina, de modo que lo que el estudiante ve en el libro coincida exactamente con la pieza que gira en 3D en la web.

## 4. Hoja de ruta acordada (afinación antes de avanzar)

1. **Vitrina 01 · Mejora de modelado 3D (`js/visor3d.js` + `js/salas/historia.js`):** añadir iluminación de estudio PBR (`RoomEnvironment`) y sustituir las figuras geométricas simples por modelos 3D anatómicos/mecánicos trabajados (`LatheGeometry`, `TubeGeometry`, `ExtrudeGeometry`, mallas helicoidales y texturas procedimentales).
2. **Capítulo 1 · Remaquetación con plantilla definitiva:** compilar `libro/Capitulo_01_Historia_y_Fundamentos.pdf` sobre `libro/plantilla.css` incorporando los mini-renders 3D reales ya mejorados de la Vitrina 01 y verificando que cierre en 4 páginas completas y equilibradas.
3. **Siguientes vitrinas y capítulos (`02` → `06`):** repetir el ciclo *Modelos 3D trabajados + Simulador interactivo web → Capturas 3D + SVG + PDF en `plantilla.css`* en `materiales`, `interfaz`, `ortopedia`, `cardio` y `normativa`.
