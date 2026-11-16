/* =========================================================
   actividades.js · Dentro de una sala
   - La inmersión: la cámara cruza el cristal de la vitrina y entra en la sala 3D
   - El panel de la sala con sus actividades (salen de datos/vitrinas.json)
   - El visor: una ventana común donde se abre cada actividad (plantilla para las 6 salas)
   - Los avisos breves (toast)
   ========================================================= */
import * as THREE from 'three';
import { gsap, D, estado } from './util.js';
import { hubCam, HR, HUB_FOV } from './pasillo.js';

// Iconos de cada tipo de actividad
const ICONOS = {
  teoria:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z"/></svg>',
  practica:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/></svg>',
  simulacion:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/></svg>',
  test:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12l5 5L20 6"/></svg>',
  caso:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4v2h6V4M9 11h6M9 15h4"/></svg>',
  pieza:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="4"/><path d="M11.5 11l5 9"/></svg>',
  linea:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h18M6 8v8M12 6v12M18 9v6"/></svg>'
};

const immerseEl=document.getElementById('immerse'), acts=document.getElementById('acts'), toast=document.getElementById('toast');
const visor=document.getElementById('visor'), visorTitulo=document.getElementById('visorTitulo'), visorCuerpo=document.getElementById('visorCuerpo');

// Avisos breves en la parte de abajo
export function avisar(t){ toast.textContent=t; gsap.killTweensOf(toast); gsap.fromTo(toast,{opacity:0,y:10},{opacity:1,y:0,duration:D(.3)}); gsap.to(toast,{opacity:0,duration:D(.4),delay:D(2.6)}); }

export function crearActividades({ vitrinas, salas, pasillo, mesa }){
  const { state, snapAngle, rotateTo } = pasillo;
  const ocultables = ['.hub-head','.caption','.hub-nav','#home','.arrow.side'];
  let salaActual=null;

  function entrar(i){
    if(estado.enSala) return; estado.enSala=true;
    rotateTo(snapAngle(state.angle), .4);
    const v=vitrinas[i]; salaActual=v;
    document.getElementById('immPlate').textContent=`Vitrina ${String(i+1).padStart(2,'0')}`;
    document.getElementById('immTitle').textContent=v.titulo;
    document.getElementById('immText').textContent=v.texto;
    acts.innerHTML = v.actividades.map((a,k)=>`<button class="act" data-k="${k}"><span class="ico">${ICONOS[a.tipo]||ICONOS.teoria}</span><span><b>${a.titulo}</b><span>${a.texto}</span>${disponible(v,a)?'':'<em>Próximamente</em>'}</span></button>`).join('');
    acts.querySelectorAll('.act').forEach(b=>b.addEventListener('click',()=>abrir(v, v.actividades[+b.dataset.k])));
    // La cámara cruza el cristal (justo al otro lado se ve la sala entera) y aparece el panel
    const yaw = -THREE.MathUtils.degToRad(snapAngle(state.angle)), dist = HR+0.25;
    gsap.set(immerseEl,{visibility:'visible'}); gsap.set('.imm-content > *, .imm-shade, #immBack',{opacity:0});
    gsap.timeline()
      .to(ocultables,{autoAlpha:0,duration:D(.35)},0)
      .to(hubCam.position,{ x:-Math.sin(yaw)*dist, z:-Math.cos(yaw)*dist, y:-0.05, duration:D(1.7), ease:'power2.inOut' },0.1)
      .to(mesa.contador.position,{ y:-1.2, duration:D(1), ease:'power2.in' },0.1)
      .to(hubCam,{ fov:HUB_FOV()+6, duration:D(1.7), ease:'power2.inOut', onUpdate:()=>hubCam.updateProjectionMatrix() },0.1)
      .to('.imm-shade',{opacity:1,duration:D(.8)},D(1.1))
      .to('.imm-content > *, #immBack',{opacity:1,y:0,duration:D(.6),stagger:D(.06),ease:'power3.out'},D(1.3))
      .add(()=>document.getElementById('immBack').focus({preventScroll:true}));
  }
  function salir(){
    if(!estado.enSala) return;
    cerrarVisor();
    gsap.timeline({ onComplete:()=>{ gsap.set(immerseEl,{visibility:'hidden'}); estado.enSala=false; } })
      .to('.imm-content > *, .imm-shade, #immBack',{opacity:0,duration:D(.35)},0)
      .to(hubCam.position,{ x:0, y:0.3, z:0, duration:D(1.4), ease:'power2.inOut' },0.15)
      .to(mesa.contador.position,{ y:0, duration:D(1), ease:'power2.out' },0.6)
      .to(hubCam,{ fov:HUB_FOV(), duration:D(1.4), ease:'power2.inOut', onUpdate:()=>hubCam.updateProjectionMatrix() },0.15)
      .to(ocultables,{autoAlpha:1,duration:D(.5)},D(1.2));
  }

  /* ---- Visor de actividades: plantilla común ----
     Si el módulo de la sala exporta una función para esa actividad (salas[id].actividades[clave]),
     se le pasa el cuerpo del visor para que pinte su contenido. Si no, la actividad está en construcción. */
  function disponible(v,a){ return !!(salas[v.id]?.actividades?.[a.clave]); }
  function abrir(v,a){
    const f = salas[v.id]?.actividades?.[a.clave];
    if(!f){ avisar('Esta actividad está en construcción: la diseñaremos juntos.'); return; }
    visorTitulo.textContent=a.titulo; visorCuerpo.innerHTML='';
    gsap.set(visor,{visibility:'visible'}); gsap.fromTo(visor,{opacity:0,y:20},{opacity:1,y:0,duration:D(.4)});
    f(visorCuerpo, { datos:v, avisar });
  }
  function cerrarVisor(){ if(visor.style.visibility==='visible') gsap.to(visor,{opacity:0,duration:D(.25),onComplete:()=>gsap.set(visor,{visibility:'hidden'})}); }
  document.getElementById('visorCerrar').addEventListener('click',cerrarVisor);
  document.getElementById('immBack').addEventListener('click',salir);
  document.getElementById('immToggle').addEventListener('click',()=>{ const c=document.getElementById('immContent'); c.classList.toggle('collapsed'); document.getElementById('immToggle').textContent = c.classList.contains('collapsed') ? 'Ver actividades' : 'Ocultar panel'; });
  addEventListener('keydown',e=>{ if(estado.enSala && e.key==='Escape') (visor.style.visibility==='visible'?cerrarVisor():salir()); });

  return { entrar, salir };
}
