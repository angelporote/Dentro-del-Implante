/* =========================================================
   main.js · El director de orquesta
   Carga los datos, crea cada parte (portada, pasillo, mesa, actividades), gestiona el viaje
   de la portada al pasillo y ejecuta el bucle de dibujo (~60 veces por segundo).
   ========================================================= */
import * as THREE from 'three';
import { gsap, D, estado } from './util.js';
import { renderer, dibujar, redimensionar, vigilarRendimiento } from './motor.js';
import * as portada from './portada.js';
import { hubScene, hubCam, HUB_FOV, crearPasillo } from './pasillo.js';
import { crearMesa, conectarAvisos } from './mesa.js';
import { crearActividades, avisar } from './actividades.js';
// Cada vitrina tiene su módulo de sala (la clave coincide con el "id" de datos/vitrinas.json)
import * as historia from './salas/historia.js';
import * as materiales from './salas/materiales.js';
import * as interfaz from './salas/interfaz.js';
import * as ortopedia from './salas/ortopedia.js';
import * as cardio from './salas/cardio.js';
import * as normativa from './salas/normativa.js';
const SALAS = { historia, materiales, interfaz, ortopedia, cardio, normativa };

const datos = await fetch('datos/vitrinas.json').then(r=>r.json());

/* ---- Bucle de dibujo ---- */
let pasillo=null, mesa=null;
const reloj = new THREE.Clock();
let primero = true;
renderer.setAnimationLoop(()=>{
  const dt = reloj.getDelta();
  const t = reloj.elapsedTime;
  if(estado.visorAbierto) return;   // mientras el usuario lee o hace un test, el 3D del fondo descansa
  vigilarRendimiento(dt, pr => mesa && mesa.bajarResolucion && mesa.bajarResolucion(pr));
  if(estado.enPasillo && pasillo){
    pasillo.actualizar(t);
    dibujar(hubScene, hubCam, { fuerza:0.3, umbral:1.3, radio:0.5, exposicion:0.9 });
    mesa.actualizar(t);
  } else {
    portada.actualizarPortada(t);
    dibujar(portada.scene, portada.camera, { fuerza:0.35, umbral:0.85, radio:0.6, exposicion:1.05 });
  }
  if(primero){ primero=false; requestAnimationFrame(arrancar); }
});

// Tras el primer fotograma: animación de entrada y, sin bloquear, el trabajo pesado
// (texturas pintadas con código y construcción del pasillo y de la mesa)
function arrancar(){
  portada.intro();
  setTimeout(()=>{
    portada.generarTexturas();
    setTimeout(()=>{
      pasillo = crearPasillo(datos.vitrinas, SALAS);
      conectarAvisos(avisar);
      mesa = crearMesa();
      const actividades = crearActividades({ vitrinas:datos.vitrinas, salas:SALAS, pasillo, mesa });
      pasillo.hooks.mesa = mesa;
      pasillo.hooks.entrar = actividades.entrar;
      renderer.compile(hubScene, hubCam);     // prepara los shaders del pasillo ahora, no al llegar
    }, 50);
  }, 300);
}

/* ---- Viaje de la portada al pasillo ---- */
const hub=document.getElementById('hub'), flash=document.getElementById('flash'), intro=document.getElementById('intro'), introText=document.getElementById('introText'), skipBtn=document.getElementById('skip');
let viaje=null;
function mostrarPasillo(){
  if(viaje){ viaje.kill(); viaje=null; }
  if(!pasillo){ setTimeout(mostrarPasillo,100); return; }   // por si aún se está construyendo
  estado.enPasillo=true;
  gsap.to([intro,skipBtn],{autoAlpha:0,duration:D(.3)}); skipBtn.style.pointerEvents='none';
  gsap.set(hub,{autoAlpha:1}); gsap.set('.top',{autoAlpha:0}); hubCam.position.set(0,0.3,0);
  // Aparecemos en el pasillo girando hasta la primera vitrina
  pasillo.state.angle = -pasillo.STEP*1.4; pasillo.renderRing(); pasillo.rotateTo(0, 2.2);
  gsap.fromTo(hubCam,{fov:HUB_FOV()+30},{fov:HUB_FOV(),duration:D(2.2),ease:'power3.out',onUpdate:()=>hubCam.updateProjectionMatrix()});
  gsap.to(flash,{opacity:0,duration:D(1.1),delay:D(.1)});
  mesa.dibujar();
  document.getElementById('prevDoor').focus({preventScroll:true});
}
function empezarRecorrido(){
  if(viaje) return;
  const cabeza = portada.prepararViaje();
  // La cámara vuela hacia la cabeza femoral, todo se funde en blanco y aparecen las frases
  viaje=gsap.timeline();
  viaje.to(portada.look,{x:cabeza.x,y:cabeza.y,z:cabeza.z,duration:D(1.6),ease:'power2.inOut'},0)
    .to(portada.camera.position,{x:cabeza.x,y:cabeza.y,z:cabeza.z+2.2,duration:D(1.8),ease:'power3.in'},0.1)
    .to(flash,{opacity:1,duration:D(.5)},D(1.4))
    .add(()=>{ skipBtn.style.pointerEvents='auto'; },D(1.6))
    .to(skipBtn,{autoAlpha:1,duration:D(.4)},D(1.6));
  datos.frasesIntro.forEach((f,i)=>{
    viaje.add(()=>{introText.textContent=f;},D(1.9+i*2.3))
      .fromTo(intro,{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:D(.6)},D(1.9+i*2.3))
      .to(intro,{autoAlpha:0,y:-10,duration:D(.5)},D(1.9+i*2.3+1.8));
  });
  viaje.add(mostrarPasillo, D(1.9+datos.frasesIntro.length*2.3));
}
function volverAPortada(){
  if(viaje){ viaje.kill(); viaje=null; }
  estado.enPasillo=false;
  gsap.killTweensOf([hub,'.top',flash,intro,skipBtn]);
  gsap.set([intro,skipBtn],{autoAlpha:0}); skipBtn.style.pointerEvents='none';
  gsap.set(flash,{opacity:0});
  gsap.to(hub,{autoAlpha:0,duration:D(.5)}); gsap.to('.top',{autoAlpha:1,duration:D(.5)});
  portada.volverAPortada();
}
document.getElementById('visit').addEventListener('click',empezarRecorrido);
document.getElementById('visit2').addEventListener('click',empezarRecorrido);
skipBtn.addEventListener('click',mostrarPasillo);
document.getElementById('home').addEventListener('click',volverAPortada);
addEventListener('keydown',e=>{
  if(!estado.enPasillo || estado.enSala || !pasillo) return;
  if(e.key==='ArrowRight') pasillo.step(1);
  if(e.key==='ArrowLeft') pasillo.step(-1);
  if(e.key==='Enter' && document.activeElement===document.body) pasillo.hooks.entrar(pasillo.actual);
});

/* ---- Tamaño de pantalla ---- */
function alRedimensionar(){
  const w=innerWidth, h=innerHeight;
  redimensionar(w,h);
  hubCam.aspect=w/h; hubCam.fov = HUB_FOV() + (estado.enSala ? 6 : 0); hubCam.updateProjectionMatrix();
  if(mesa) mesa.redimensionar(w,h);
}
addEventListener('resize', alRedimensionar);
alRedimensionar();
