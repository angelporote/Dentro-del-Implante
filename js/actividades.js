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
import { pintarTest } from './test.js';

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
    const pdfBtn = document.getElementById('immPdf');
    if(pdfBtn){
      if(v.pdf){ pdfBtn.href = v.pdf; pdfBtn.hidden = false; }
      else { pdfBtn.hidden = true; pdfBtn.removeAttribute('href'); }
    }
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
     Cada actividad recibe el cuerpo del visor y { datos, vitrina, avisar }:
     - datos: el contenido de la sala (datos/<id>.json), cargado una sola vez y guardado en caché
     - vitrina: su entrada de datos/vitrinas.json
     Las actividades "test" usan el motor común (test.js); el resto, la función que exporte el módulo de la sala. */
  const cacheDatos = {};
  function cargarDatos(id){
    if(!cacheDatos[id]) cacheDatos[id] = fetch(`datos/${id}.json`).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
      .catch(e=>{ delete cacheDatos[id]; throw e; });   // si falla, se reintenta la próxima vez
    return cacheDatos[id];
  }
  function actividad(v,a){ return salas[v.id]?.actividades?.[a.clave] || (a.clave==='test' ? pintarTest : null); }
  function disponible(v,a){ return !!actividad(v,a); }
  let apertura = 0;   // evita que una carga lenta pinte una actividad que ya se cerró o cambió
  async function abrir(v,a){
    const f = actividad(v,a);
    if(!f){ avisar('Esta actividad está en construcción: la diseñaremos juntos.'); return; }
    const yo = ++apertura;
    visorTitulo.textContent=a.titulo; visorCuerpo.innerHTML='<p class="visor-carga">Cargando la sala…</p>';
    visor.dataset.sala = v.id;
    estado.visorAbierto=true;
    document.body.classList.add('visor-on');
    gsap.killTweensOf(visor);   // si se estaba cerrando, que el cierre no lo oculte después
    gsap.set(visor,{visibility:'visible'}); gsap.fromTo(visor,{opacity:0,y:20},{opacity:1,y:0,duration:D(.4)});
    let datosSala;
    try{ datosSala = await cargarDatos(v.id); }
    catch(e){ if(yo===apertura) visorCuerpo.innerHTML='<p class="visor-carga">No se ha podido cargar el contenido de esta sala. Comprueba la conexión y vuelve a abrir la actividad.</p>'; return; }
    if(yo!==apertura || !estado.visorAbierto) return;
    visorCuerpo.innerHTML=''; visorCuerpo.scrollTop=0;
    f(visorCuerpo, { datos:datosSala, vitrina:v, avisar });
  }
  function cerrarVisor(){ if(visor.style.visibility==='visible'){ estado.visorAbierto=false; apertura++; document.body.classList.remove('visor-on'); gsap.killTweensOf(visor); gsap.to(visor,{opacity:0,duration:D(.25),onComplete:()=>gsap.set(visor,{visibility:'hidden'})}); } }
  document.getElementById('visorCerrar').addEventListener('click',cerrarVisor);
  document.getElementById('immBack').addEventListener('click',salir);
  document.getElementById('immToggle').addEventListener('click',()=>{ const c=document.getElementById('immContent'); c.classList.toggle('collapsed'); document.getElementById('immToggle').textContent = c.classList.contains('collapsed') ? 'Ver actividades' : 'Ocultar panel'; });
  addEventListener('keydown',e=>{ if(estado.enSala && e.key==='Escape') (visor.style.visibility==='visible'?cerrarVisor():salir()); });

  return { entrar, salir };
}
