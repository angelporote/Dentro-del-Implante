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
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(0.5, camera.aspect));
  const minHalfFov = Math.min(vFov, hFov) * 0.5;
  const radius = Math.max(0.45, sphere.radius);
  const dist = Math.max(2.1, (radius / Math.sin(minHalfFov)) * 1.22);
  camera.position.copy(dir.normalize().multiplyScalar(dist));
  camera.far = Math.max(50, dist * 4);
  camera.updateProjectionMatrix();
  controls.minDistance = dist * 0.55;
  controls.maxDistance = dist * 2.5;
  controls.update();
}

export function montarVisor3D(contenedor, construirEscena, { fondo=0x0E0C2A, camPos=[0, 1.1, 4.2], autoGiro=false }={}){
  contenedor.innerHTML = '<div class="v-3d-wrap"><canvas></canvas><span class="v-3d-hint">Arrastra para girar · Rueda/pellizco para zoom</span></div>';
  const wrap = contenedor.firstElementChild;
  const canvas = wrap.firstElementChild;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:!gamaBaja, alpha:false, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, gamaBaja ? 1 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !gamaBaja;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  // Fondo de estudio con viñeteado radial sutil para dar profundidad a vidrios, metales y polímeros
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = 512; bgCanvas.height = 512;
  {
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
  }
  const bgTex = new THREE.CanvasTexture(bgCanvas);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = bgTex;

  // Iluminación PBR real de estudio (RoomEnvironment + PMREMGenerator, calculada una sola vez)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTex = pmrem.fromScene(roomEnv, 0.04).texture;
  roomEnv.dispose?.();
  pmrem.dispose();
  scene.environment = envTex;
  scene.environmentIntensity = 0.78;

  const w = Math.max(260, wrap.clientWidth || 340);
  const h = Math.max(220, wrap.clientHeight || 260);
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
  activarSombras(grupo);
  encuadrarGrupo(grupo, camera, controls, dirBase, false);

  let raf = 0, destruido = false;
  const reloj = new THREE.Clock();
  const ro = new ResizeObserver(()=>{
    if(destruido) return;
    const nw = wrap.clientWidth, nh = wrap.clientHeight;
    if(!nw || !nh) return;
    renderer.setSize(nw, nh, false);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    encuadrarGrupo(grupo, camera, controls, dirBase, true);
  });
  ro.observe(wrap);

  function limpiarGrupo(){
    while(grupo.children.length){
      const ch = grupo.children[0];
      ch.traverse?.(o=>{
        o.geometry?.dispose?.();
        // materiales y sus texturas también ocupan memoria de la GPU
        [].concat(o.material||[]).forEach(m=>{ Object.values(m).forEach(v=>v?.isTexture && v.dispose()); m.dispose?.(); });
      });
      grupo.remove(ch);
    }
  }
  function destruir(){
    if(destruido) return;
    destruido = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    limpiarGrupo();
    envTex.dispose();
    bgTex.dispose();
    renderer.dispose();
    // dispose() no libera el contexto WebGL: sin esto se acumulan y el navegador (máx. ~16)
    // acaba cerrando el más antiguo, que es el del pasillo, y la escena principal se queda en negro
    renderer.forceContextLoss();
  }
  function bucle(){
    if(destruido || !document.body.contains(canvas)){
      destruir();
      return;
    }
    const t = reloj.getElapsedTime();
    animRef.fn(t, grupo);
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(bucle);
  }
  raf = requestAnimationFrame(bucle);

  return {
    reemplazar(nuevaEscena){
      if(destruido) return;
      limpiarGrupo();
      grupo.position.set(0,0,0);
      grupo.rotation.set(0,0,0);
      camera.position.set(...camPos);
      controls.target.set(0,0,0);
      controls.update();
      animRef.fn = nuevaEscena(grupo, scene, camera) || (()=>{});
      activarSombras(grupo);
      encuadrarGrupo(grupo, camera, controls, dirBase, false);
    },
    destruir,
    renderer,
    scene,
    camera
  };
}
