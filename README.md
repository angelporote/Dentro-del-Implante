# Dentro del implante

*Biomateriales e implantología, de la historia al quirófano.*

**Web:** https://angelporote.github.io/Dentro-del-Implante/

Web interactiva en 3D para estudiar biomateriales e implantología. Interactúa y recorre todo el temario referente a biomateriales y biocompatibilidad (historia, materiales, interfaz, ortopedia, cardio y normativa) y entra en cada sala para practicar. Para estudiantes de ingeniería biomédica o ciencias de la salud que quieran aprender sobre biomateriales e implantología.

Hilo narrativo: *del material en bruto al implante que llega al paciente*.

## Estructura

```
index.html            esqueleto: textos, botones y lienzos 3D
css/estilos.css       aspecto de toda la web
css/actividades.css   aspecto de las actividades del visor
js/main.js            arranque, viaje portada → pasillo → salas y bucle de dibujo
js/motor.js           renderizador WebGL, entorno de luz y bloom
js/util.js            estado global y ayudas compartidas
js/portada.js         prótesis de cadera interactiva con piezas magnéticas
js/pasillo.js         pasillo circular de hospital (2 tramos por vitrina; se adapta al número de vitrinas)
js/mesa.js            mesa con física (cannon-es) y 5 dispositivos
js/actividades.js     inmersión en las salas, visor común y carga de datos/<sala>.json
js/test.js            motor común de los tests (clave "test" en todas las salas)
js/ui.js              ayudas para pintar las actividades del visor
js/salas/*.js         interior 3D de cada vitrina (y sus actividades)
datos/vitrinas.json   títulos, textos y actividades de las 6 vitrinas
datos/<sala>.json     contenido de cada sala
```

## Añadir una actividad

1. Describe la actividad en `datos/vitrinas.json` (con una `clave`).
2. En el módulo de la sala (`js/salas/<sala>.js`) exporta una función con esa clave:

```js
export const actividades = {
  'clave-de-la-actividad': (contenedor, { datos, vitrina, avisar }) => { /* pinta la actividad en el visor */ }
};
```

- `datos`: el contenido de la sala (`datos/<sala>.json`). Se descarga la primera vez que se abre una actividad y queda en caché.
- `vitrina`: la entrada de la sala en `datos/vitrinas.json`.
- `avisar(texto)`: muestra un aviso breve.

En cuanto existe esa función, la tarjeta deja de mostrar «Próximamente» y abre el visor. Las ayudas para pintar HTML (`esc`, `el`, `barajar`…) están en `js/ui.js` y los estilos de las actividades en `css/actividades.css`.

**Tests:** las actividades con `clave: "test"` no necesitan código. Las monta el motor común (`js/test.js`) con `datos.preguntas`, que es una lista de `{ pregunta, opciones, correcta, explicacion }`, donde `correcta` es la posición de la opción buena empezando en 0.

## Probarla en local

Como usa módulos y carga archivos JSON, hay que servirla (no basta con abrir el archivo):

```
python3 -m http.server
```

y abrir `http://localhost:8000`.

## Tecnología

[Three.js](https://threejs.org) para el 3D, [GSAP](https://gsap.com) para las animaciones y [cannon-es](https://github.com/pmndrs/cannon-es) para la física de la mesa. Todo se carga desde CDN: no hay que instalar nada ni compilar.

## Licencia

- **Código:** MIT (ver `LICENSE`).
- **Contenido educativo:** CC BY-NC-SA 4.0 (ver `LICENSE-CONTENIDO.md`).

Autor: Ángel Portela Otero.
