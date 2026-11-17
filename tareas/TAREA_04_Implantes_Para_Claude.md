# TAREA 04 · Vitrina interactiva por implantes (`ortopedia` · Implantes I)

> **Modo de trabajo:** Antigravity ha dejado estructurado todo el nuevo array `"implantes"` dentro de `datos/ortopedia.json` (conservando intactos `temas`, `conceptos`, `datos`, `hitos`, `normas`, `preguntas` y `fuentes`). Tu tarea como **Claude** es implementar esta nueva experiencia 3D interactiva en local (`C:\Users\User\Desktop\Dentro-del-Implante`) **sin hacer `git push`** hasta que el usuario lo pida.
>
> *Nota de numeración de vitrina:* en el boceto el usuario escribió «Vitrina 5», pero los dispositivos del dibujo (cadera, rodilla, osteosíntesis/tornillos, dental y columna) corresponden actualmente en `datos/vitrinas.json` a **Vitrina 04 (`id: "ortopedia"`)**. Implementa la arquitectura directamente en el módulo `js/salas/ortopedia.js` (y sus hooks de sala) dejando claro al usuario si desea más adelante reordenar Vitrina 04 y Vitrina 05 en `vitrinas.json`.

---

## Arquitectura visual deseada (según el boceto de iPad)

1. **Al entrar en la vitrina (`estado.enSala`):**
   - La sala cambia el comportamiento clásico de «lista lateral con actividades fijas» por una **mesa expositora con los 5 implantes flotando en 3D** detrás del cristal:
     1. `cadera` — Prótesis total de cadera
     2. `rodilla` — Prótesis total de rodilla
     3. `osteosintesis` — Fijaciones y tornillos de osteosíntesis (unificados en un único punto)
     4. `dental` — Implante dental osteointegrado *(destacado visualmente con aura/anillo bioactivo en el centro)*
     5. `columna` — Fijación vertebral y cajas de columna
   - El panel de inmersión (`#immContent`) en esta vitrina debe arrancar compacto (o con barra superior limpia de chips de acceso rápido + acceso al **Test de implantes ortopédicos** y **Ocultar panel**) para dejar libre y visible la mesa con los 5 implantes 3D flotantes.
   - **Clic directo 3D en la mesa:** al pasar el ratón por encima de un implante flotante dentro de la sala, el cursor pasa a `pointer`, el implante se ilumina suavemente y muestra su nombre flotante; al **clicar sobre él** (o sobre su chip de respaldo para teclado/móvil), se abre directamente el visor de estudio completo de **ese implante**.

---

## Paso 1 · Reemplazar la escena 3D simple de `js/salas/ortopedia.js`

Actualmente `js/salas/ortopedia.js` solo tiene una lámpara de quirófano, camilla y monitor ECG (27 líneas). Rediseña `construir(d, ctx)` y añade constructores 3D detallados (`escenaImplante3D(id)`):

1. **Escena de vitrina (`construir(d, ctx)`):**
   - Mantén un ambiente limpio de quirófano/laboratorio avanzado (`ctx.sala`, `ctx.luz`).
   - Construye una **mesa curva / expositor semicircular** delante del visitante en la sala (`z ≈ -3.55..-3.85`) con 5 puestos luminosos en las coordenadas de `posicion_mesa` (o coordenadas coherentes centradas sobre la mesa) donde floten con leve oscilación vertical (`ctx.anim`) los **5 modelos 3D representativos**:
     - `cadera`: vástago anatómico + cuello + cabeza cerámica + cotilo UHMWPE.
     - `rodilla`: componente femoral bicondíleo Co-Cr + inserto UHMWPE + bandeja tibial Ti con quilla.
     - `osteosintesis`: hueso largo seccionado con placa bloqueada curva, clavo intramedular y tornillos corticales roscados.
     - `dental` *(destacado)*: segmento mandibular/alveolar con implante roscado Ti, anillo cervical osteointegrado, pilar y corona anatómica.
     - `columna`: dos vértebras simplificadas con caja intersomática trabecular (con ventana central) y barras/tornillos pediculares posteriores.
   - Guarda `userData.implanteId = id` en cada grupo flotante y expón los grupos interactivos para el raycaster dentro de la sala.

2. **Conexión de clics 3D dentro de la sala (`js/actividades.js` + `js/pasillo.js` + `js/salas/ortopedia.js`):**
   - En `js/actividades.js`, cuando el usuario esté dentro de una sala (`estado.enSala && !estado.visorAbierto`) y mueva o pulse con el puntero sobre el `<canvas>` principal (`#scene`), proyecta un `THREE.Raycaster` con `hubCam` contra los objetos interactivos que registre `salas[v.id]` (si la sala define interactivos 3D, p. ej. `obtenerInteractivos()` o `userData.implanteId`):
     - Al hacer *hover*, cambia el cursor y resalta/muestra una etiqueta corta flotante.
     - Al hacer *clic* (sin arrastre), abre el visor del implante (`abrirImplante(id)` o `abrir` pasando `{ implanteId: id }`), garantizando limpieza total de listeners al `salir()` de la sala.
   - En `#immContent` / `#acts` para la vitrina `ortopedia`: además de la lista o chips por cada implante (para accesibilidad por teclado y pantalla táctil pequeña), deja bien visible el botón del **Test de implantes ortopédicos** (`pintarTest`).

---

## Paso 2 · Visor propio de cada implante (los 4 apartados + PDF + calculadora biomecánica)

Al abrir cualquier implante (`cadera`, `rodilla`, `osteosintesis`, `dental`, `columna`), carga `datos/ortopedia.json` (con la caché existente de `actividades.js`), busca el objeto en `datos.implantes` por `id` y construye la vista común dentro de `#visorCuerpo`:

### Cabecera del implante
- **Título (`imp.nombre`)**, etiqueta (`imp.etiqueta`), subtítulo (`imp.subtitulo`).
- **Botón `Descargar PDF`** visible arriba a la derecha:
  - Si `vitrina.pdf` o `imp.pdf` apunta a un archivo existente (`libro/Capitulo_04_...pdf`), úsalo como `<a href="..." download>`; mientras no exista todavía el Capítulo 04 compilado, añade clase `data-print-pdf` que genere/imprima limpiamente la **Ficha completa del implante en PDF** (con `@media print` limpio en `css/actividades.css` o ventana de impresión con todos los apartados y diagrama) para evitar enlaces rotos 404.
- **Panel visual superior (2 columnas en escritorio):**
  - Izquierda: **Mini-visor 3D giratorio (`montarVisor3D`)** mostrando la escena detallada de ese implante (`escenaImplante3D(imp.id)`).
  - Derecha: selector rápido para cambiar entre los 5 implantes sin cerrar el visor + resumen anatómico.

### Pestañas fijas de los 4 apartados por implante
Implementa navegación por pestañas (`role="tablist"`, teclado ←/→):

1. **`1. Historia`**
   - Muestra `imp.historia.hito_clave`, explicación `imp.historia.resumen` y línea evolutiva con los pasos de `imp.historia.evolucion`.
2. **`2. Biomateriales`**
   - Muestra `imp.biomateriales.resumen` y una tabla/tarjetas por componente (`imp.biomateriales.piezas[]`: `parte`, `material`, `motivo`) destacando visualmente el contraste metal / cerámica / polímero / recubrimiento.
3. **`3. Biomecánica (Estudio de cargas y sólidos deformables)`**
   - **IMPORTANTE (criterio explícito del usuario):** debe sentirse como un mini-laboratorio de **Biomecánica / Sólidos Deformables**, no texto genérico.
   - Muestra la ecuación gobernante destacada (`imp.biomecanica.ecuacion`), la explicación física (`imp.biomecanica.explicacion`) y los listados `dcl.cargas` + `dcl.zonas_criticas`.
   - **Dibuja un Diagrama de Cuerpo Libre (DCL) SVG o `<canvas>` dinámico** propio para cada tipo (`cadera`, `rodilla`, `osteosintesis`, `dental`, `columna`) con vectores de fuerza ($R, F_{\text{axial}}, F_{\text{lat}}$), brazo de palanca ($d / h$), momento flector $M$ y mapa de color en las zonas críticas según los parámetros elegidos.
   - **Conecta los controles interactivos de `imp.biomecanica.calculadora.controles`** para recalcular en tiempo real valores numéricos ingenieriles orientativos con sus unidades:
     - `cadera`: calcula fuerza articular $R = 3{,}5 \cdot m \cdot 9{,}81\,(\text{N})$, momento $M = R \cdot d\,(\text{N}\cdot\text{m})$, tensión máxima estimada $\sigma_{\text{máx}}\,(\text{MPa})$ y razón de rigidez $E_{\text{vástago}} / 18\,\text{GPa}$ (alerta visual de *stress shielding* si es Co-Cr 12,2× frente a Ti 6,1×).
     - `rodilla`: calcula fuerza pico $F = \text{gesto} \cdot m \cdot 9{,}81\,(\text{N})$, presión de contacto hertziana orientativa y advertencia frente al límite plástico/fatiga subsuperficial del UHMWPE ($\sim 22\,\text{MPa}$) al bajar espesor o subir carga.
     - `osteosintesis`: compara brazo excéntrico ($d \approx 18\,\text{mm}$ placa vs. $3\,\text{mm}$ clavo), factor multiplicador por conminución opuesta y porcentaje aproximado de carga asumida por el hueso según la fase de dinamización (`E_callo` $0{,}01 \to 0{,}5 \to 8\,\text{GPa}$).
     - `dental`: calcula $F_{\text{axial}} = F\cos\theta$, $F_{\text{lat}} = F\operatorname{sen}\theta$, momento crestal $M = F_{\text{lat}} \cdot h\,(\text{N}\cdot\text{mm})$ y tensión crestal estimada $\sigma_{\text{crestal}}\,(\text{MPa})$ comparándola visualmente al variar ángulo $\theta$ y altura $h$.
     - `columna`: calcula área de huella típica (diferenciando cervical/lumbar estándar $A \approx 350\text{--}450\,\text{mm}^2$), tensión en el platillo vertebral $\sigma = F / A\,(\text{MPa})$ y factor de seguridad frente a $\sigma_{\text{adm}}$ (`8 MPa` sano vs. `3 MPa` osteoporosis) señalando riesgo de **subsidencia** cuando $\sigma > \sigma_{\text{adm}}$ o se concentra por alta rigidez del Ti frente a PEEK.
4. **`4. Quirúrgico (Técnica y robótica actual)`**
   - Muestra el protocolo quirúrgico real (`imp.quirurgico.tecnica`) y tarjetas destacadas de los **robots quirúrgicos y navegación 3D actuales** (`imp.quirurgico.robots[]`: nombre + función intraoperatoria).

---

## Paso 3 · Estilos y actualización de `datos/vitrinas.json`

1. En **`datos/vitrinas.json` (`id: "ortopedia"`)**, actualiza la descripción/actividades si es necesario para reflejar el nuevo enfoque *«mesa por implantes»* (manteniendo `"clave": "test"` para el test común, y pudiendo mapear cada implante o una clave de entrada directa + fallback en `#acts`).
2. En **`css/actividades.css`**, añade estilos limpios con la paleta existente (`--bio`, `--metal`, `--polymer`, `--ceramic`, `--edge`, `--night`) para:
   - La barra/chips rápidos de implantes en el pasillo/sala y tooltip de *hover* 3D.
   - La ficha del implante: cabecera con botón de PDF, rejilla 3D + selector de implante, pestañas de 4 pilares, tarjetas de biomateriales, bloque de DCL + sliders de biomecánica + KPIs numéricos y tarjetas de robótica quirúrgica, más regla `@media print` limpia para imprimir la ficha en PDF.

---

## Verificación final (solo en local)
1. Ejecutar `node --check` sobre todos los archivos `.js` bajo `js/` (`0` errores).
2. Validar `datos/ortopedia.json` y `datos/vitrinas.json` con Python `json.load`.
3. Arrancar servidor local (`python -m http.server`) y comprobar:
   - Que al entrar en la Vitrina de ortopedia se ven los 5 implantes flotando sobre la mesa 3D.
   - Que hacer clic sobre cualquiera (en 3D o mediante chip accesible) abre su ficha con los 4 apartados (`Historia`, `Biomateriales`, `Biomecánica` con calculadora DCL interactiva y `Quirúrgico` con robots).
   - Que el botón **Descargar / Guardar PDF** no da 404 y que el **Test** sigue funcionando intacto.
4. **No ejecutar `git push`** salvo que el usuario lo indique expresamente.
