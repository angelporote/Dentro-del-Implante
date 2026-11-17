# TAREA 01 · Mejora visual y pedagógica de la Vitrina 01 (para ejecutar por Claude)

> **Modo de trabajo:** Antigravity ha dejado estructurados los nuevos campos en `datos/historia.json` y definidas aquí las especificaciones exactas. Ejecuta estos 3 bloques sobre los archivos locales de `C:\Users\User\Desktop\Dentro-del-Implante` (sin hacer `git push` salvo indicación expresa del usuario).

---

## Bloque A · Enriquecer el clasificador 2×2 (`implanteOProtesis`) con silueta anatómica + semáforo regulatorio MDR / ISO 10993

### 1. Datos ya preparados en `datos/historia.json` (`datos[]`)
Cada uno de los 10 elementos de `datos` (líneas `91–222`) ya incluye cinco campos nuevos listos para consumir:
- `zona_anatomica` *(string)* — región corporal o tipo de contacto.
- `silueta_xy` *(array `[x, y]` en coordenadas `0..100` sobre `viewBox="0 0 100 100"`)* — punto de localización en la silueta humana (si es instrumental externo como el bisturí, apunta junto a la mano/zona quirúrgica).
- `clase_mdr` *(string)* — p. ej. `"Clase III (MDR)"`, `"Clase IIb (MDR)"`, `"Clase I (MDR)"`, `"Fuera de MDR (estético, reg. REACH Ni)"`.
- `semaforo` *(string)* — `"rojo"` | `"ambar"` | `"verde"`.
- `exigencia_iso10993` *(string)* — resumen de los ensayos biológicos requeridos.

### 2. Cambios en `js/salas/historia.js` (función `implanteOProtesis`, líneas `1527–1603`)
1. **Tarjeta superior con silueta SVG anatómica + marcador e icono vectorial del dispositivo:**
   - Crea un helper local `svgSilueta(xy, semaforo)` que devuelva un `<svg class="cl-silueta" viewBox="0 0 100 100" aria-hidden="true">` con:
     - Un contorno minimalista limpio del cuerpo humano centrado en `x = 50` (cabeza ~`cy=11`, torso/hombros `y=20..52`, brazos, pelvis `y=48..56`, piernas `y=55..94`).
     - Un halo pulsante y punto luminoso centrado en `cx = xy[0]`, `cy = xy[1]` coloreado según `semaforo` (`rojo -> #FF7A8A`, `ambar -> #FFD98A`, `verde -> #5FF2D2`, por defecto `var(--bio)`).
   - Crea otro helper local `svgIconoDispositivo(nombre)` (ligero, 24×24 con `stroke="currentColor"`) para acompañar el título del dispositivo actual (`cadera`, `dentadura`, `tornillo`, `piercing`, `stent`, `marcapasos`, `lente`, `válvula`, `pierna`, `bisturí`).
   - En `pintar()`, coloca dentro de `.cl-cabecera` (usando `.cl-ficha-dispositivo`) la silueta + la tarjeta de dispositivo con `esc(orden[i].dispositivo)`, icono y subtítulo `esc(orden[i].zona_anatomica || '')` (puedes alternar el detalle de la ubicación anatómica para ayudar visualmente al alumno sin regalar la respuesta de la matriz).
2. **Semáforo regulatorio MDR / ISO 10993 al responder (`responder(k)`):**
   - Mantén el desglose existente de criterios (`¿Dentro del cuerpo?` / `¿Reemplaza o aumenta?`) y `.test-explica`.
   - Añade justo debajo de `.test-explica` una caja compacta `.cl-regula` con la clase de color `.sem-${esc(d.semaforo || 'verde')}` que muestre:
     - Cabecera con punto semafórico + `esc(d.clase_mdr || '')` + etiqueta `ISO 10993`.
     - Texto con `esc(d.exigencia_iso10993 || '')` para reforzar el concepto del *«salto regulatorio al cruzar la barrera tisular»*.

### 3. Estilos en `css/actividades.css`
Añade estilos responsivos en el bloque `Historia · ¿Implante, prótesis o ambos?` para:
- `.cl-ficha-dispositivo` (`display:flex; align-items:center; gap:.9rem`)
- `.cl-silueta` (`width:68px; height:68px; flex:none; border-radius:12px; background:rgba(11,10,34,.55); border:1px solid var(--edge)`) y animación suave `@keyframes cl-pulso` (desactivable en `prefers-reduced-motion: reduce`)
- `.cl-regula` con variantes `.sem-rojo` (`#FF7A8A`), `.sem-ambar` (`#FFD98A`), `.sem-verde` (`#5FF2D2`) para borde izquierdo, chip de clase MDR y punto del semáforo.

---

## Bloque B · Pulir los modelos 3D restantes de `escenaHito3D` y añadir chips de enfoque/despiece en `lineaTemporal`

### 1. Diagnóstico y mejora geométrica en `escenaHito3D(anio)` (`js/salas/historia.js`, líneas `634–1355`)
En la revisión anterior ya quedaron bien encaminados Prehistoria (`-7000`), Mayas (`200`), Ridley IOL (`1949`), Charnley (`1958`), PyC+PHEMA (`1960`) y Bioglass (`1969`). Ahora **remata con detalle real anatómico/ingenieril** los 9 modelos que aún se ven algo esquemáticos o mecánicos simples:
1. **`1829` (Reactividad metálica, líneas `812–839`):** sustituye los 3 cilindros simples alineados en el hueso por un segmento óseo más orgánico con **3 placas/tornillos implantados reales**: placa de hierro picada con pérdida ósea osteolítica alrededor, alambre fino de platino con sutura anudada limpia y cápsula fibrosa delgada translucida, y el tornillo/placa de Vitallium (`Co-Cr-Mo`) integrado de forma compacta.
2. **`1943` (Dializador de Kolff + Shunt Scribner, líneas `841–886`):** detalla mejor el tambor con varillas de sujeción en las tapas, bocas de entrada/salida arterial-venosa del shunt en U conectadas visualmente mediante tubos flexibles y un menisco de líquido dializado realistas sin cortar bruscamente los bordes.
3. **`1947` (Injerto aorto-biilíaco de Voorhees, líneas `888–920`):** haz la transición entre la aorta nativa y el injerto más continua (eliminando aristas bruscas entre `perfilTorneado` y `corrugadoGeo`) y suaviza la bifurcación en Y con `mallaLoft` o unión anatómica limpia de ambas ramas ilíacas corrugadas.
4. **`1952` (Válvula Starr-Edwards + Marcapasos Greatbatch, líneas `988–1023`):** haz una jaula de 3 o 4 montantes unidos suavemente en el vértice con asiento metálico pulido, y sustituye los cilindros sueltos dentro del epoxi del marcapasos por un conjunto interior más compacto y creíble (baterías encapsuladas, bobina, placa electrónica y conector superior con cuello sellado de silicona y electrodo helicoidal hacia el vértice).
5. **`1964` (Brånemark · Osteointegración, líneas `1131–1145`):** dale al bloque de hueso cortical/trabecular forma anatómica real de corte de fémur/maxilar (siguiendo el estilo de `200`/`1958` con hueso cortical y esponjoso continuo hasta las roscas del implante) y haz que la cámara óptica transversal de titanio tenga ventana y reborde óptico real (cristal/lente en los extremos), no un simple cilindro negro sólido.
6. **`1966` (Fijación PLA/PLGA + PGA + ePTFE, líneas `1147–1196`):** unifica mejor el conjunto (ahora hay una placa partida + sutura flotando arriba + rejilla ePTFE delante); haz que los dos fragmentos óseos encajen a través de la línea de fractura real y une la placa osteosíntesis + lámina de ePTFE/sutura de PGA de modo coherente y compacto para el visor `Box3`.
7. **`1978` (Stent coronario de Palmaz, líneas `1266–1280`):** integra las 3 capas de la pared arterial (`adventicia`, `media`, `íntima`), haz la placa de ateroma menos bloque-amarillo y más orgánica compactada por los *struts* metálicos del stent expandido (malla continua romboidal/senoidal bien soldada y guía metálica con extremo en J suave).
8. **`1986` (Ingeniería de tejidos · Langer & Vacanti, líneas `1282–1310`):** cambia los 3 toros apilados por una verdadera arquitectura tipo oreja/cartílago o bloque de **espuma/lattice trabéculado 3D orgánico** que evoque los *scaffolds* de PLGA de Langer & Vacanti, con red capilar ramificada y osteoblastos/condrocitos bien distribuidos.
9. **`2018` (Chengdu · Biomaterial inteligente del s. XXI, líneas `1312–1354`):** perfecciona la doble capa lipídica/polimérica con cabezas fosfolipídicas visibles en el borde del corte 240°, bicapa definida y una doble hélice central de ARN/ADN limpia con pares de bases conectados sin atravesar la pared.

### 2. Añadir botones de inspección/enfoque por componente en `lineaTemporal` (`js/salas/historia.js`)
- En cada escena dentro de `escenaHito3D(anio)` (o mediante un mapa `PARTES_HITO` en `js/salas/historia.js`), etiqueta o devuelve metadatos de **2–3 partes clave** con:
  - `id` / `label` (p. ej. en `1958`: `Vástago Co-Cr`, `Cotilo UHMWPE`, `Cemento PMMA`; en `1949`: `Óptica PMMA`, `Hápticos en J`, `Iris y córnea`; en `1969`: `Vidrio 45S5`, `Capa HCA`, `Hueso vivo`; en `200`: `Nácar (CaCO₃)`, `Anillo HCA`, `Hierro oxidado`).
  - `focusPos` / `camOffset` (o referencia al grupo/malla dentro de `grupo`) y `nota` breve (1 línea pedagógica de por qué importa esa parte).
- **Conexión con `js/visor3d.js`:**
  - Si necesitas enfocar o resaltar un componente en `montarVisor3D`, puedes añadir opcionalmente en `js/visor3d.js` un método limpio `enfocar(targetVec, camOffset)` en el objeto retornado por `montarVisor3D` (con interpolación suave de `controls.target` y `camera.position` o `encuadrarGrupo(..., false)` para el botón *«Vista completa»*).
- En `lineaTemporal`, debajo o junto a `#lt3d`, renderiza una barra discreta de chips `.lt-partes`: `[Vista general] [Parte 1] [Parte 2] [Parte 3]`, mostrando en una línea `.lt-parte-nota` la explicación breve de la pieza enfocada. Al cambiar de hito, vuelve a *Vista general*.

---

## Bloque C · Afinar la escena 3D de la Vitrina 01 en el pasillo (`construir`, líneas `569–623`)

1. Mejora las 3 piezas sobre los pedestales dentro de `construir(d, ctx)` (`js/salas/historia.js`) sin disparar el número de polígonos (recuerda que se ve desde el pasillo hospitalario):
   - **Pedestal 1 (`1ª generación`):** acompaña el tornillo CNC con una base/hueso cortical esquemático y un fino halo de cápsula o rosca pulida para que se lea incluso a media distancia.
   - **Pedestal 2 (`2ª generación`):** haz más reconocibles los gránulos bioactivos 45S5 y el frente brillante de hidroxiapatita (`matHCA`) en el crisol de ensayo.
   - **Pedestal 3 (`3ª generación`):** limpia la silueta del andamio trabecular poroso con el brote angiogénico rojo coral destacado para que contraste con las luces cálidas de la vitrina.
2. Verifica que el mural de fondo (`linea`) y las 3 placas (`placa`) se leen nítidamente sin ningún texto recortado.

---

## Verificación final obligatoria (cuando Claude termine)
1. Ejecutar `node --check` en todos los `.js` modificados (`js/salas/historia.js`, `js/visor3d.js`, etc.) — `0` errores.
2. Validar `python -c "import json; json.load(open('datos/historia.json', encoding='utf-8'))"` — JSON válido.
3. Probar en navegador local (`python -m http.server` + abrir Vitrina 01) los 15 hitos con sus chips de partes 3D y el clasificador 2×2 con silueta + semáforo MDR/ISO 10993.
4. No hacer `git push` hasta que el usuario lo revise en local y dé el visto bueno.
