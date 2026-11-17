/* =========================================================
   visor3d.js · Mini-visor 3D reutilizable para dentro del visor de actividades
   Permite girar, hacer zoom e inspeccionar modelos 3D reales en cualquiera de las 6 vitrinas.
   Se pausa y libera automáticamente cuando se cierra el visor.
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gamaBaja, reduceMotion } from './util.js';

function activarSombras(obj){
  obj.traverse?.(o => {
    if(!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    o.castShadow = mats.length > 0 && mats.every(m => m && !m.transparent && m.side !== THREE.DoubleSide);
    o.receiveShadow = true;
  });
}

// Distancia de cámara para que una esfera de radio dado quepa en pantalla (según fov y aspecto)
function distanciaPara(radio, camera, margen = 1.14){
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(0.5, camera.aspect));
  const minHalfFov = Math.min(vFov, hFov) * 0.5;
  return (radio / Math.sin(minHalfFov)) * margen;
}

function encuadrarGrupo(grupo, camera, controls, dirBase, conservarAngulo = false){
  const box = new THREE.Box3().setFromObject(grupo);
  if(box.isEmpty()) return;
  const centro = box.getCenter(new THREE.Vector3());
  grupo.position.sub(centro);
  const boxC = new THREE.Box3().setFromObject(grupo);
  const sphere = boxC.getBoundingSphere(new THREE.Sphere());
  const dir = conservarAngulo ? camera.position.clone().sub(controls.target) : dirBase.clone();
  if(dir.lengthSq() < 1e-6) dir.copy(dirBase);
  controls.target.set(0, 0, 0);
  const radius = Math.max(0.45, sphere.radius);
  const dist = Math.max(2.1, distanciaPara(radius, camera));
  camera.position.copy(dir.normalize().multiplyScalar(dist));
  camera.far = Math.max(50, dist * 4);
  camera.updateProjectionMatrix();
  controls.minDistance = dist * 0.55;
  controls.maxDistance = dist * 2.5;
  controls.update();
}

// Cache compartida: un único contexto WebGL reutilizable + su entorno PMREM y fondos por color.
// Evita recrear WebGLRenderer, compilar shaders PMREM/PBR y pintar texturas de fondo cada vez que se abre un visor.
let shared = null;
let sesionActiva = null;
const fondosCache = new Map();

function obtenerRenderer(){
  if(shared) return shared;
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:!gamaBaja, alpha:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, gamaBaja ? 1 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !gamaBaja;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTex = pmrem.fromScene(roomEnv, 0.04).texture;
  roomEnv.dispose?.();
  pmrem.dispose();

  canvas.addEventListener('webglcontextlost', () => {
    envTex.dispose();
    shared = null;
  }, { once: true });

  shared = { renderer, canvas, envTex };
  return shared;
}

function obtenerFondoTex(fondo){
  if(fondosCache.has(fondo)) return fondosCache.get(fondo);
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = 512; bgCanvas.height = 512;
  const g = bgCanvas.getContext('2d');
  const cBase = new THREE.Color(fondo);
  const cCentro = fondo === 0x0E0C2A ? new THREE.Color(0x1B1742) : cBase.clone().lerp(new THREE.Color(0xFFFFFF), 0.08);
  const cBorde = fondo === 0x0E0C2A ? new THREE.Color(0x070616) : cBase.clone().multiplyScalar(0.55);
  const gr = g.createRadialGradient(256, 224, 24, 256, 256, 360);
  gr.addColorStop(0, '#' + cCentro.getHexString());
  gr.addColorStop(0.54, '#' + cBase.getHexString());
  gr.addColorStop(1, '#' + cBorde.getHexString());
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 512);
  const bgTex = new THREE.CanvasTexture(bgCanvas);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  fondosCache.set(fondo, bgTex);
  return bgTex;
}

// transparente: sin fondo ni recuadro, el modelo flota sobre la página (página de estudio de los implantes)
export function montarVisor3D(contenedor, construirEscena, { fondo=0x0E0C2A, camPos=[0, 1.1, 4.2], autoGiro=false, transparente=false }={}){
  // Si había un visor anterior aún vivo (p.ej. cerrándose), lo limpiamos antes de reutilizar el lienzo
  if(sesionActiva) sesionActiva();

  contenedor.innerHTML = transparente
    ? '<div class="v-3d-wrap v-3d-libre"></div>'
    : '<div class="v-3d-wrap"><span class="v-3d-hint">Arrastra para girar · Rueda/pellizco para zoom</span></div>';
  const wrap = contenedor.firstElementChild;
  const { renderer, canvas, envTex } = obtenerRenderer();
  wrap.prepend(canvas);

  const scene = new THREE.Scene();
  if(transparente){
    renderer.setClearColor(0x000000, 0);
    scene.background = null;
  } else {
    renderer.setClearColor(fondo, 1);
    scene.background = obtenerFondoTex(fondo);
  }
  scene.environment = envTex;
  scene.environmentIntensity = 0.78;

  const cw = wrap.clientWidth, ch = wrap.clientHeight;
  const w = cw > 0 ? cw : 340, h = ch > 0 ? ch : 260;
  renderer.setSize(w, h, false);

  const camera = new THREE.PerspectiveCamera(35, w/h, 0.1, 50);
  camera.position.set(...camPos);
  const dirBase = new THREE.Vector3(...camPos);
  if(dirBase.lengthSq() < 1e-6) dirBase.set(0, 1.1, 4.2);
  dirBase.normalize();

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 7.5;
  controls.autoRotate = autoGiro && !reduceMotion;
  controls.autoRotateSpeed = 0.9;

  // Esquema de estudio de 4 puntos + sombras suaves reales sobre la geometría
  scene.add(new THREE.HemisphereLight(0xF6F8FF, 0x161230, 0.65));
  const key = new THREE.DirectionalLight(0xFFFBF2, 1.38);
  key.position.set(2.8, 4.4, 4.2);
  if(!gamaBaja){
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 14;
    key.shadow.camera.left = -2.2;
    key.shadow.camera.right = 2.2;
    key.shadow.camera.top = 2.2;
    key.shadow.camera.bottom = -2.2;
    key.shadow.bias = -0.0012;
    key.shadow.normalBias = 0.035;
  }
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xD8E6FF, 0.52); fill.position.set(-3.4, 1.6, 2.8); scene.add(fill);
  const rim = new THREE.DirectionalLight(0x68E8D4, 0.48); rim.position.set(-2.8, 2.8, -3.4); scene.add(rim);
  const warm = new THREE.DirectionalLight(0xFFE0A8, 0.28); warm.position.set(2.4, 0.8, -2.5); scene.add(warm);

  const grupo = new THREE.Group();
  scene.add(grupo);
  const animRef = { fn: construirEscena(grupo, scene, camera) || (()=>{}) };
  animRef.fn(0, grupo);
  activarSombras(grupo);

  let lastW = cw > 0 && ch > 0 ? cw : 0;
  let lastH = cw > 0 && ch > 0 ? ch : 0;
  let encuadradoInicial = cw > 0 && ch > 0;
  if(encuadradoInicial){
    encuadrarGrupo(grupo, camera, controls, dirBase, false);
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
  } else {
    renderer.compile(scene, camera);
  }

  let raf = 0, destruido = false;
  const reloj = new THREE.Clock();

  /* ---- Enfoque por partes ----
     Las escenas marcan sus piezas con obj.userData.parte = 'id'. enfocarParte(id) acerca la cámara
     a la caja de todas las mallas con ese id, sin cambiar el ángulo de vista; vistaGeneral() vuelve. */
  let vuelo = null;
  controls.addEventListener('start', () => { vuelo = null; });   // si el alumno arrastra, manda él
  function volarA(destinoTarget, destinoPos){
    if(reduceMotion){
      controls.target.copy(destinoTarget); camera.position.copy(destinoPos); controls.update(); return;
    }
    vuelo = { t0:reloj.getElapsedTime(), dur:0.8,
      desdeT:controls.target.clone(), hastaT:destinoTarget.clone(),
      desdeP:camera.position.clone(), hastaP:destinoPos.clone() };
  }
  function direccionActual(){
    const d = camera.position.clone().sub(controls.target);
    return d.lengthSq() < 1e-6 ? dirBase.clone() : d.normalize();
  }
  function cajaParte(id){
    const box = new THREE.Box3();
    grupo.updateMatrixWorld(true);
    grupo.traverse(o => { if(o.userData?.parte === id) box.expandByObject(o); });
    return box;
  }
  function enfocar(objetivo, radio){
    const dist = Math.max(0.55, distanciaPara(Math.max(0.12, radio), camera, 1.45));
    controls.minDistance = Math.min(controls.minDistance, dist * 0.6);
    volarA(objetivo, objetivo.clone().add(direccionActual().multiplyScalar(dist)));
  }
  function enfocarParte(id){
    const box = cajaParte(id);
    if(box.isEmpty()) return false;
    const esfera = box.getBoundingSphere(new THREE.Sphere());
    enfocar(esfera.center, esfera.radius);
    return true;
  }
  function vistaGeneral(){
    const box = new THREE.Box3().setFromObject(grupo);
    if(box.isEmpty()) return;
    const radio = Math.max(0.45, box.getBoundingSphere(new THREE.Sphere()).radius);
    const dist = Math.max(2.1, distanciaPara(radio, camera));
    controls.minDistance = dist * 0.55;
    volarA(new THREE.Vector3(0, 0, 0), direccionActual().multiplyScalar(dist));
  }
  const ro = new ResizeObserver(()=>{
    if(destruido) return;
    const nw = wrap.clientWidth, nh = wrap.clientHeight;
    if(!nw || !nh || (nw === lastW && nh === lastH)) return;
    lastW = nw; lastH = nh;
    renderer.setSize(nw, nh, false);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    encuadrarGrupo(grupo, camera, controls, dirBase, encuadradoInicial);
    if(!encuadradoInicial){
      encuadradoInicial = true;
      renderer.compile(scene, camera);
      renderer.render(scene, camera);
    }
  });
  ro.observe(wrap);

  function limpiarGrupo(){
    while(grupo.children.length){
      const ch = grupo.children[0];
      ch.traverse?.(o=>{
        if(o.geometry && !o.geometry.userData?.compartida) o.geometry.dispose?.();
        // No liberar materiales ni texturas marcados como compartidos (p.ej. con el pasillo o la caché)
        [].concat(o.material||[]).forEach(m=>{
          if(!m || m.userData?.compartido) return;
          Object.values(m).forEach(v=>{ if(v?.isTexture && !v.userData?.compartida) v.dispose(); });
          m.dispose?.();
        });
      });
      grupo.remove(ch);
    }
  }
  function destruir(){
    if(destruido) return;
    destruido = true;
    if(sesionActiva === destruir) sesionActiva = null;
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    limpiarGrupo();
    renderer.renderLists?.dispose?.();
  }
  sesionActiva = destruir;

  function bucle(){
    if(destruido || !document.body.contains(canvas)){
      destruir();
      return;
    }
    const t = reloj.getElapsedTime();
    if(vuelo){
      const k = Math.min(1, (t - vuelo.t0) / vuelo.dur), e = k * k * (3 - 2 * k);
      controls.target.lerpVectors(vuelo.desdeT, vuelo.hastaT, e);
      camera.position.lerpVectors(vuelo.desdeP, vuelo.hastaP, e);
      if(k >= 1) vuelo = null;
    }
    animRef.fn(t, grupo);
    controls.update();
    if(lastW > 0 && lastH > 0) renderer.render(scene, camera);
    raf = requestAnimationFrame(bucle);
  }
  raf = requestAnimationFrame(bucle);

  return {
    reemplazar(nuevaEscena){
      if(destruido) return;
      vuelo = null;
      limpiarGrupo();
      grupo.position.set(0,0,0);
      grupo.rotation.set(0,0,0);
      camera.position.set(...camPos);
      controls.target.set(0,0,0);
      controls.update();
      animRef.fn = nuevaEscena(grupo, scene, camera) || (()=>{});
      animRef.fn(0, grupo);
      activarSombras(grupo);
      encuadrarGrupo(grupo, camera, controls, dirBase, false);
      renderer.compile(scene, camera);
      if(lastW > 0 && lastH > 0) renderer.render(scene, camera);
    },
    enfocar,
    enfocarParte,
    vistaGeneral,
    destruir,
    renderer,
    scene,
    camera,
    controls
  };
}
