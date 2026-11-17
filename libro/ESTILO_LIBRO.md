# Guía editorial del libro de texto · *Dentro del implante*

Este documento define el estándar editorial, gráfico, tipográfico y didáctico de los **6 capítulos descargables** (`libro/Capitulo_0X_*.pdf`), asociados a las 6 vitrinas del museo 3D interactivo. Todos los capítulos se compilan enlazando [plantilla.css](plantilla.css) mediante un flujo multi-agente orquestado con `run_workflow`.

---

## 1. Filosofía editorial: tratado ilustrado de referencia (no apuntes de examen)

- **Público objetivo:** cualquier lector, profesional o estudiante de ingeniería biomédica o ciencias de la salud que utilice la web como **fuente de estudio autónoma y completa**.
- **Prohibido el lenguaje escolar o de examen:** quedan excluidas muletillas como *«trampa de examen»*, *«chuleta»*, *«esto entra en el parcial»* o referencias a asignaturas o cursos locales concretos.
- **Extensión objetivo:** **8 a 10 páginas A4 completas y equilibradas** por capítulo, sin compresión artificial ni páginas finales semivacías.
- **Profundidad explicativa:** cada sección desarrolla el *porqué* físico, químico, histológico, histórico y clínico de los fenómenos desde primeros principios, combinando narrativa rigurosa con gráficos de nivel editorial.

## 2. Tipografía, retícula y paleta

- **Soporte:** A4 vertical (`16 mm` arriba, `17 mm` abajo, `15 mm` laterales), cabecera superior con el título de la obra y del capítulo, pie de página con autoría y licencia `CC BY-NC-SA 4.0`.
- **Sistema tipográfico y justificación:**
  - **Títulos, portadilla, insignias de sección, cabeceras de tabla y rótulos de figura:** `Sora` (pesos 600–800), alineados a la izquierda.
  - **Cuerpo narrativo:** serifa editorial de alta legibilidad **`Source Serif 4`** (`Georgia`/`Cambria` en Word) a `9.4–10 pt`, interlineado `1.50`, **siempre justificado (`text-align: justify` con guionado automático en español)** para lograr una mancha tipográfica de libro impreso sin ríos de espacio en blanco.
  - **Tablas, recuadros, glosario y pies de figura:** **`Inter`** (`Segoe UI`/`Calibri` en Word, `7.8–8.5 pt`), con textos descriptivos, recuadros, glosario, bibliografía y pies de figura también justificados.
- **Formatos entregables:** cada capítulo se genera tanto en **Word editable (`.docx`)** como en **PDF (`.pdf`)** sincronizados, manteniendo exactamente la misma calidad gráfica, infografías multipanel y atlas 3D.
- **Retícula mixta (inspirada en *Biomaterials Science* y *Nature Reviews Primers*):**
  - **Doble columna (`.two-col`)** con filete vertical sutil para el texto narrativo continuo (~60 caracteres por línea).
  - **Bandas de ancho completo** para portadilla, hojas de ruta, tablas comparativas, infografías vectoriales SVG multipanel (`.nature-fig`) y atlas de modelos 3D (`.atlas-panel`).
- **Cuatro recuadros editoriales fijos (`.callout`):**
  - **Azul (`.callout.concept`):** *Fundamento científico y consenso internacional*.
  - **Ámbar (`.callout.history`):** *Crónica experimental e historia*.
  - **Verde turquesa (`.callout.clinic`):** *En el quirófano y en el paciente*.
  - **Violeta (`.callout.eng`):** *Análisis de ingeniería aplicado*.

## 3. Estándar gráfico: Atlas 3D completo + infografías SVG multipanel

Cada capítulo combina dos familias visuales complementarias y obligatorias:

1. **Atlas 3D real completo (`.atlas-panel` con `.atlas-grid-4` / `.atlas-grid-3`):** capturas PNG en alta resolución exportadas directamente desde las escenas WebGL PBR (`RoomEnvironment`) de la vitrina correspondiente. Cada tarjeta muestra insignia cronológica/categoría, título, material principal y explicación técnica.
2. **Infografías vectoriales SVG multipanel propias (`.nature-fig`):** diagramas científicos con paneles codificados (**a**, **b**, **c**), esquemas químicos/histológicos, curvas mecánicas o cinéticas de degradación y árboles de decisión sobre fondo blanco/gris claro (`#ffffff` / `#f8fafc`).

## 4. Estructura uniforme de cada capítulo

1. **Portadilla + Hoja de ruta (`.cover-band` + `.chapter-roadmap`)**: resumen temático y objetivos conceptuales del capítulo.
2. **Fundamentos y taxonomía**: definiciones de consenso, criterios de clasificación, diagramas de relaciones y marcos normativos.
3. **Desarrollo científico, histórico o mecánico + Atlas 3D real**: narrativa por bloques temáticos con las piezas 3D reales de la vitrina documentadas.
4. **Mecanismos interfaciales / fenómenos avanzados + Infografías SVG multipanel**.
5. **Del material en bruto al implante clínico**: influencia del procesado, esterilización, biomecánica y análisis de casos reales.
6. **Cierre de tratado**: **Glosario técnico fundamental** (`.glossary-grid`), **Problemas de reflexión aplicada** (`.qa-box`) y **Bibliografía comentada** (`.bib-box`).

## 5. Flujo multi-agente para los Capítulos 1 a 6

1. **Captura 3D completa (`capture_atlas_vitrina0X.mjs`)**: renderizado de todas las escenas 3D de la vitrina con Edge Headless + WebGL (`visor3d.js`) e inspección visual previa.
2. **Orquestación en paralelo (`run_workflow`)**: tres agentes redactan e ilustran en paralelo los bloques HTML/SVG (Fundamentos/SVG, Historia/Atlas 3D o Familias/Ensayos, y Mecanismos/Traslación/Glosario).
3. **Ensamblado, compilación y revisión visual**: generación del PDF en A4 con Edge Headless y verificación página a página con `read_file`.
