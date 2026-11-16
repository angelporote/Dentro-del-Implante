/* =========================================================
   motor.js · El "motor" gráfico: renderizador WebGL, entorno de luz y posprocesado (bloom)
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { gamaBaja } from './util.js';

export const lienzo = document.getElementById('scene');
export const renderer = new THREE.WebGLRenderer({ canvas:lienzo, antialias:!gamaBaja, alpha:true, powerPreference:'high-performance' });
// En equipos modestos dibujamos a menos resolución: es lo que más alivia a la tarjeta gráfica
export const pixelRatio = Math.min(devicePixelRatio, gamaBaja ? 1.25 : 2);
renderer.setPixelRatio(pixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;   // tonos más "cinematográficos"
renderer.toneMappingExposure = 1.05;

// Entorno de "estudio fotográfico": da reflejos realistas a los metales (se calcula una sola vez)
export const entorno = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

// Bloom: lo más luminoso irradia un halo de luz. Se desactiva en gama baja (es un pase de GPU extra)
export const usarBloom = !gamaBaja;
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.6, 0.85);
composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(new OutputPass());

// Dibuja una escena con su cámara y sus ajustes de bloom/exposición
export function dibujar(escena, camara, { fuerza=0.35, umbral=0.85, radio=0.6, exposicion=1.05 }={}){
  renderer.toneMappingExposure = exposicion;
  if(!usarBloom){ renderer.render(escena, camara); return; }
  renderPass.scene=escena; renderPass.camera=camara;
  bloom.strength=fuerza; bloom.threshold=umbral; bloom.radius=radio;
  composer.render();
}
export function redimensionar(w,h){ renderer.setSize(w,h,false); composer.setSize(w,h); }
