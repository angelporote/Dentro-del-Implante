# Formato de las fichas de estudio de los implantes (Vitrina 04)

**Para:** Antigravity (contenido) · **Lo pinta:** `js/salas/ortopedia.js` (Claude)
**Dónde se escribe:** `datos/ortopedia.json` → `implantes[i].apartados`

Cada implante de la mesa (cadera, rodilla, osteosíntesis, dental y columna) abre su propia página de estudio con
4 apartados fijos. Tú solo escribes datos en el JSON y la web los maqueta sola. No hace falta tocar código.

Mientras un apartado no tenga contenido, la web muestra un **esqueleto** con lo que irá en él. En cuanto rellenes
`intro`, `bloques`, `claves` o `preguntas`, el esqueleto desaparece y se pinta el contenido.

---

## 1. Estructura general

```json
{
  "id": "rodilla",                       // NO cambiar: lo usa el modelo 3D de la mesa
  "nombre": "Prótesis total de rodilla", // título de la página
  "etiqueta": "Prótesis mecánica",       // chip de color del menú lateral
  "subtitulo": "Artroplastia femorotibial y rotuliana",
  "resumen_mesa": "Una o dos frases que se leen bajo el menú.",
  "color": "#7FB2FF",                    // color del implante (botones, números, acentos)
  "pdf": "pdf/rodilla.pdf",              // opcional: si existe, «Descargar PDF» lo descarga; si no, imprime la ficha

  "apartados": {
    "historia":      { ...APARTADO... },
    "biomateriales": { ...APARTADO... },
    "biomecanica":   { ...APARTADO... },
    "quirurgico":    { ...APARTADO... }
  }
}
```

Las claves de `apartados` tienen que ser exactamente: `historia`, `biomateriales`, `biomecanica` y `quirurgico`.

## 2. Un APARTADO

Todos los campos son opcionales y aparecen en este orden:

```json
{
  "intro": "Párrafo de entrada (2–4 frases): de qué trata y por qué importa.",
  "bloques": [ BLOQUE, BLOQUE, ... ],
  "claves": ["Idea para memorizar 1", "Idea 2", "Idea 3"],
  "preguntas": [
    { "p": "Pregunta de repaso", "r": "Respuesta breve (se despliega al pulsar)" }
  ],
  "fuentes": ["Autor, título, año", "Norma ISO …"]
}
```

| Campo | Cómo se ve | Recomendación |
|---|---|---|
| `intro` | Párrafo grande bajo el título | 2–4 frases |
| `bloques` | El cuerpo de estudio (ver §3) | 3–6 bloques |
| `claves` | Recuadro «Para recordar» | 3–5 ideas, una línea cada una |
| `preguntas` | «Comprueba lo que sabes»: preguntas desplegables | 2–4 preguntas |
| `fuentes` | Lista numerada pequeña al final | Opcional |

## 3. Tipos de BLOQUE

Cada bloque lleva `"tipo"` y, opcionalmente, `"titulo"` (subtítulo del bloque).

### `texto`: párrafos
```json
{ "tipo": "texto", "titulo": "Contexto", "parrafos": ["Párrafo 1…", "Párrafo 2…"] }
```

### `lista`: viñetas o pasos numerados
```json
{ "tipo": "lista", "titulo": "Pasos de la técnica", "ordenada": true,
  "items": ["Abordaje parapatelar medial", "Cortes femorales con guía", "…"] }
```
Con `"ordenada": true` se pintan pasos con número en círculo; sin él, viñetas.

### `cronologia`: línea de tiempo
```json
{ "tipo": "cronologia", "titulo": "Evolución",
  "hitos": [
    { "fecha": "1968", "titulo": "Prótesis policéntrica de Gunston", "texto": "Primer uso sistemático de metal + UHMWPE." },
    { "fecha": "1974", "titulo": "Prótesis condilar total de Insall" }
  ] }
```

### `tarjetas`: piezas, materiales, robots…
```json
{ "tipo": "tarjetas", "titulo": "Piezas del implante",
  "tarjetas": [
    { "titulo": "Componente femoral", "material": "Co-Cr-Mo (ASTM F75)", "familia": "metal",
      "texto": "Alta dureza frente al desgaste del inserto." },
    { "titulo": "Inserto tibial", "material": "UHMWPE reticulado", "familia": "polimero", "texto": "…" },
    { "titulo": "ROSA Knee", "etiqueta": "Robot", "texto": "Planificación y control de cortes." }
  ] }
```
`familia` decide el color: `metal`, `ceramica`, `polimero`, `recubrimiento` o `hueso`. Si no la pones, se deduce de
`material`; si tampoco hay material, se usa el color del implante. `etiqueta` sustituye el texto pequeño de arriba.

### `tabla`: propiedades y comparativas
```json
{ "tipo": "tabla", "titulo": "Propiedades mecánicas",
  "columnas": ["Material", "E (GPa)", "σ_{y} (MPa)", "Densidad (g/cm^{3})"],
  "filas": [
    ["Ti-6Al-4V", "110", "880", "4,43"],
    ["Co-Cr-Mo", "210", "450–1500", "8,3"],
    ["Hueso cortical", "15–20", "~130", "1,9"]
  ],
  "nota": "Valores típicos; dependen del procesado." }
```
La primera columna sale en negrita (es el nombre de la fila). Usa coma decimal.

### `ecuacion`: fórmula con sus variables
```json
{ "tipo": "ecuacion", "titulo": "Tensión de contacto",
  "formula": "σ = F / A",
  "variables": [
    { "simbolo": "σ", "significado": "tensión normal", "unidad": "MPa" },
    { "simbolo": "F", "significado": "fuerza articular", "unidad": "N" },
    { "simbolo": "A", "significado": "área de contacto", "unidad": "mm^{2}" }
  ],
  "explicacion": "Si el área de contacto disminuye, la tensión se dispara: por eso importa la conformidad." }
```

### `destacado`: aviso o idea importante
```json
{ "tipo": "destacado", "nivel": "aviso", "titulo": "Ojo", "texto": "El apantallamiento de tensiones…" }
```
`nivel` es opcional y puede ser `aviso` (ámbar) o `peligro` (rojo). Sin `nivel`, usa el color del implante.

### `imagen`: figura
```json
{ "tipo": "imagen", "src": "img/implantes/rodilla-cortes.webp", "alt": "Cortes femorales", "pie": "Fig. 1. Secuencia de cortes." }
```
Las imágenes van en `img/implantes/`. Usa formato `.webp` y como máximo 1600 px de ancho.

### `calculadora`: laboratorio interactivo (pensado para Biomecánica)
```json
{ "tipo": "calculadora", "titulo": "Laboratorio: contacto en el inserto",
  "calculo": "rodilla",
  "controles": [
    { "id": "masa", "label": "Masa corporal (kg)", "min": 50, "max": 140, "step": 1, "valor": 75 },
    { "id": "material", "label": "Material", "opciones": [ { "val": "convencional", "label": "UHMWPE convencional" } ] }
  ] }
```
`calculo` elige el modelo físico ya programado: `cadera`, `rodilla`, `osteosintesis`, `dental` o `columna`. Los `id`
de los controles deben ser los que espera ese cálculo: son los mismos que ya tenía `biomecanica.calculadora.controles`
en el JSON actual. Si necesitas un cálculo nuevo, pídeselo a Claude con sus ecuaciones.

## 4. Formato dentro de los textos

En cualquier texto (`intro`, `parrafos`, `items`, `claves`, celdas…) puedes usar:

| Escribe | Se ve |
|---|---|
| `**palabra**` | **negrita** |
| `*palabra*` | *cursiva* |
| `TiO_{2}` | TiO₂ (subíndice) |
| `mm^{2}` | mm² (superíndice) |

Nada de HTML: se muestra tal cual, como texto.

## 5. Qué poner en cada apartado (guía de estudio)

| Apartado | Bloques recomendados |
|---|---|
| **1. Historia** | `intro` (el problema clínico), `cronologia` (5–8 hitos), `texto` (lecciones de los fracasos), `claves`, `preguntas` |
| **2. Biomateriales** | `intro`, `tarjetas` (una por pieza con su familia), `tabla` (E, resistencia, densidad, biocompatibilidad), `destacado` (por ejemplo, el apantallamiento de tensiones), `claves`, `preguntas` |
| **3. Biomecánica** | `intro` (cargas que soporta), `ecuacion` (1–3), `calculadora`, `lista` (zonas críticas), `claves`, `preguntas` |
| **4. Quirúrgico** | `intro` (indicaciones y abordaje), `lista` ordenada (pasos de la técnica), `tarjetas` (robots y navegación), `lista` (complicaciones), `claves`, `preguntas` |

## 6. Ejemplo mínimo completo (un apartado)

```json
"historia": {
  "intro": "La rodilla es una articulación **rodante-deslizante**: copiarla costó tres décadas.",
  "bloques": [
    { "tipo": "cronologia", "titulo": "Evolución", "hitos": [
      { "fecha": "1968", "titulo": "Gunston", "texto": "Prótesis policéntrica metal–UHMWPE." },
      { "fecha": "1974", "titulo": "Insall", "texto": "Prótesis condilar total." }
    ]},
    { "tipo": "texto", "titulo": "Qué aprendimos", "parrafos": ["Las bisagras rígidas se aflojaban porque…"] }
  ],
  "claves": ["La bisagra rígida fracasó por aflojamiento", "Insall fijó el diseño condilar moderno"],
  "preguntas": [ { "p": "¿Por qué fracasaron las prótesis en bisagra?", "r": "Transmitían todo el par al anclaje óseo." } ]
}
```

## 7. Comprobación antes de entregar

1. `python -c "import json; json.load(open('datos/ortopedia.json', encoding='utf-8'))"` no debe dar error.
2. No cambies los `id` de los implantes.
3. Los campos antiguos (`historia`, `biomateriales`, `biomecanica`, `quirurgico` fuera de `apartados`) ya no se usan.
   Puedes moverlos a este formato o borrarlos.
