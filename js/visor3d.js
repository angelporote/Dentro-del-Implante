/* =========================================================
   visor3d.js · Mini-visor 3D reutilizable para dentro del visor de actividades
   Permite girar, hacer zoom e inspeccionar modelos 3D reales en cualquiera de las 6 vitrinas.
   Se pausa y libera automáticamente cuando se cierra el visor.
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
  scene.background = new THREE.Color(fondo);

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

  // Iluminación de estudio limpia (sin coste de PMREM)
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0x26204A, 1.15));
  const key = new THREE.DirectionalLight(0xFFFFFF, 1.45); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x5FF2D2, 0.8); rim.position.set(-4, 2, -3); scene.add(rim);
  const warm = new THREE.DirectionalLight(0xFFD58A, 0.45); warm.position.set(2, -3, -2); scene.add(warm);

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

  let raf = 0;
  const reloj = new THREE.Clock();
  function bucle(){
    if(!document.body.contains(canvas)){
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
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
      while(grupo.children.length){
        const ch = grupo.children[0];
        ch.traverse?.(o=>{ o.geometry?.dispose?.(); });
        grupo.remove(ch);
      }
      grupo.rotation.set(0,0,0);
      animRef.fn = nuevaEscena(grupo, scene, camera) || (()=>{});
    }
  };
}
