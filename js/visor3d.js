/* =========================================================
   visor3d.js · Mini-visor 3D reutilizable para dentro del visor de actividades
   Permite girar, hacer zoom e inspeccionar modelos 3D reales en cualquiera de las 6 vitrinas.
   Se pausa y libera automáticamente cuando se cierra el visor.
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gamaBaja, reduceMotion } from './util.js';

export function montarVisor3D(contenedor, construirEscena, { fondo=0x0E0C2A, camPos=[0, 1.1, 4.2], autoGiro=true }={}){
  contenedor.innerHTML = '<div class="v-3d-wrap"><canvas></canvas><span class="v-3d-hint">Arrastra para girar · Rueda/pellizco para zoom</span></div>';
  const wrap = contenedor.firstElementChild;
  const canvas = wrap.firstElementChild;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:!gamaBaja, alpha:false, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, gamaBaja ? 1 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();

  // Fondo de estudio con viñeteado radial sutil para dar profundidad a vidrios, metales y polímeros
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = 512; bgCanvas.height = 512;
  {
    const g = bgCanvas.getContext('2d');
    const cBase = new THREE.Color(fondo);
    const cCentro = fondo === 0x0E0C2A ? new THREE.Color(0x1E1848) : cBase.clone().lerp(new THREE.Color(0xFFFFFF), 0.08);
    const cBorde = fondo === 0x0E0C2A ? new THREE.Color(0x09081C) : cBase.clone().multiplyScalar(0.6);
    const gr = g.createRadialGradient(256, 224, 24, 256, 256, 360);
    gr.addColorStop(0, '#' + cCentro.getHexString());
    gr.addColorStop(0.52, '#' + cBase.getHexString());
    gr.addColorStop(1, '#' + cBorde.getHexString());
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 512);
  }
  const bgTex = new THREE.CanvasTexture(bgCanvas);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = bgTex;

  // Iluminación PBR real de estudio (RoomEnvironment + PMREMGenerator, calculada una vez por visor)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTex = pmrem.fromScene(roomEnv, 0.04).texture;
  roomEnv.dispose?.();
  pmrem.dispose();
  scene.environment = envTex;
  scene.environmentIntensity = 0.85;

  const w = Math.max(260, wrap.clientWidth || 340);
  const h = Math.max(220, wrap.clientHeight || 260);
  renderer.setSize(w, h, false);

  const camera = new THREE.PerspectiveCamera(36, w/h, 0.1, 50);
  camera.position.set(...camPos);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.8;
  controls.maxDistance = 8.5;
  controls.autoRotate = autoGiro && !reduceMotion;
  controls.autoRotateSpeed = 1.4;

  // Esquema de estudio de 4 puntos + luz hemisférica complementando el entorno PBR
  scene.add(new THREE.HemisphereLight(0xF4F6FF, 0x1A1538, 0.75));
  const key = new THREE.DirectionalLight(0xFFFBF2, 1.55); key.position.set(3.5, 5.5, 4.5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x5FF2D2, 1.0); rim.position.set(-4.5, 2.2, -3.5); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x9C83FF, 0.55); fill.position.set(-3.2, -2.5, 2.8); scene.add(fill);
  const warm = new THREE.DirectionalLight(0xFFD58A, 0.5); warm.position.set(2.5, -3.2, -2.2); scene.add(warm);

  const grupo = new THREE.Group();
  scene.add(grupo);
  const animRef = { fn: construirEscena(grupo, scene, camera) || (()=>{}) };

  const ro = new ResizeObserver(()=>{
    const nw = wrap.clientWidth, nh = wrap.clientHeight;
    if(!nw || !nh) return;
    renderer.setSize(nw, nh, false);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  });
  ro.observe(wrap);

  let raf = 0, destruido = false;
  const reloj = new THREE.Clock();
  function limpiarGrupo(){
    while(grupo.children.length){
      const ch = grupo.children[0];
      ch.traverse?.(o=>{
        o.geometry?.dispose?.();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m=>m?.dispose?.());
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
      animRef.fn = nuevaEscena(grupo, scene, camera) || (()=>{});
    },
    destruir,
    renderer,
    scene,
    camera
  };
}
