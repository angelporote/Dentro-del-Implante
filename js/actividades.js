/* =========================================================
   actividades.js · Dentro de una sala
   - La inmersión: la cámara cruza el cristal de la vitrina y entra en la sala 3D
   - El panel de la sala con sus actividades (salen de datos/vitrinas.json)
   - El visor: una ventana común donde se abre cada actividad (plantilla para las 6 salas)
   - Los avisos breves (toast)
   ========================================================= */
import * as THREE from 'three';
import { gsap, D, estado } from './util.js';
import { esc } from './ui.js';
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
  const immContent = document.getElementById('immContent'), immToggle = document.getElementById('immToggle');
  let salaActual=null, transicion=null, saliendo=false;

  function entrar(i){
    if(estado.enSala) return; estado.enSala=true; saliendo=false;
    transicion?.kill();
    rotateTo(snapAngle(state.angle), .4);
    const v=vitrinas[i]; salaActual=v;
    cargarDatos(v.id).catch(()=>{});
    immContent?.classList.remove('collapsed');
    if(immToggle) immToggle.textContent='Ocultar panel';
    document.getElementById('immPlate').textContent=`Vitrina ${String(i+1).padStart(2,'0')}`;
    document.getElementById('immTitle').textContent=v.titulo;
    document.getElementById('immText').textContent=v.texto;
    const pdfBtn = document.getElementById('immPdf');
    if(pdfBtn){
      if(v.pdf){ pdfBtn.href = v.pdf; pdfBtn.hidden = false; }
      else { pdfBtn.hidden = true; pdfBtn.removeAttribute('href'); }
    }
    acts.innerHTML = v.actividades.map((a,k)=>`<button class="act" data-k="${k}"><span class="ico">${ICONOS[a.tipo]||ICONOS.teoria}</span><span><b>${esc(a.titulo)}</b><span>${esc(a.texto)}</span>${disponible(v,a)?'':'<em>Próximamente</em>'}</span></button>`).join('');
    acts.querySelectorAll('.act').forEach(b=>b.addEventListener('click',()=>abrir(v, v.actividades[+b.dataset.k])));
    activarMesa(v);
    gsap.killTweensOf(estado,'giroSala'); estado.giroSala = 0; pintarGiro();
    // La cámara cruza el cristal (justo al otro lado se ve la sala entera) y aparece el panel
    const yaw = -THREE.MathUtils.degToRad(snapAngle(state.angle)), dist = HR+0.25;
    gsap.set('.imm-content, #immBack, .sala-giro, .mesa-test',{clearProps:'opacity,visibility'});   // por si se salió desde la página de un implante
    gsap.set(immerseEl,{visibility:'visible'}); gsap.set('.imm-content > *, .imm-shade, #immBack',{opacity:0});
    transicion = gsap.timeline()
      .to(ocultables,{autoAlpha:0,duration:D(.35)},0)
      .to(hubCam.position,{ x:-Math.sin(yaw)*dist, z:-Math.cos(yaw)*dist, y:-0.05, duration:D(1.7), ease:'power2.inOut' },0.1)
      .to(mesa.contador.position,{ y:-1.2, duration:D(1), ease:'power2.in' },0.1)
      .to(hubCam,{ fov:HUB_FOV()+6, duration:D(1.7), ease:'power2.inOut', onUpdate:()=>hubCam.updateProjectionMatrix() },0.1)
      .to('.imm-shade',{opacity:1,duration:D(.8)},D(1.1))
      .to('.imm-content > *, #immBack',{opacity:1,y:0,duration:D(.6),stagger:D(.06),ease:'power3.out'},D(1.3))
      .add(()=>{ document.getElementById('immBack').focus({preventScroll:true}); if(mesa3D){ calcularLimites(); mostrarAyuda(); } });
  }
  function salir(){
    if(!estado.enSala || saliendo) return;
    saliendo=true;
    transicion?.kill();
    if(viaje){ viaje.kill(); viaje = null; } regreso = null;
    gsap.killTweensOf(telon); gsap.set(telon,{autoAlpha:0});
    cerrarVisor();
    desactivarMesa();
    transicion = gsap.timeline({ onComplete:()=>{ gsap.set(immerseEl,{visibility:'hidden'}); estado.enSala=false; saliendo=false; } })
      .to('.imm-content > *, .imm-shade, #immBack',{opacity:0,duration:D(.35)},0)
      .to(hubCam.position,{ x:0, y:0.3, z:0, duration:D(1.4), ease:'power2.inOut' },0.15)
      .to(estado,{ giroSala:0, duration:D(1), ease:'power2.inOut' },0)
      .to(mesa.contador.position,{ y:0, duration:D(1), ease:'power2.out' },0.6)
      .to(hubCam,{ fov:HUB_FOV(), duration:D(1.4), ease:'power2.inOut', onUpdate:()=>hubCam.updateProjectionMatrix() },0.15)
      .to(ocultables,{autoAlpha:1,duration:D(.5)},D(1.2));
  }

  /* ---- Mesa interactiva: clic directo sobre objetos 3D de la sala ----
     Una sala puede exportar mesaInteractiva = { items:[{id, nombre}], objetivos(), resaltar(id) }.
     Dentro de esa sala: el panel se compacta, aparecen chips de respaldo (teclado y móvil) y el puntero
     lanza un rayo desde hubCam contra objetivos(); pasar por encima resalta, hacer clic sin arrastrar abre la ficha. */
  const rayo = new THREE.Raycaster(), ndc = new THREE.Vector2(), proy = new THREE.Vector3();
  const tip = document.createElement('div'); tip.className = 'tip-3d'; tip.hidden = true; immerseEl.appendChild(tip);
  let mesa3D = null, salaMesa = null, sobre = null, pulsado = null;
  const ignorar = e => e.target.closest?.('.imm-content,.imm-back,.visor,.toast,button,a,input,select,label');
  function tocado(e){
    const objs = mesa3D.objetivos(); if(!objs.length) return null;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    rayo.setFromCamera(ndc, hubCam);
    return rayo.intersectObjects(objs, false)[0]?.object || null;
  }
  function marcar(obj){
    const id = obj?.userData.implanteId || null;
    if(id === (sobre?.userData.implanteId || null)){ if(obj) colocarTip(obj); return; }
    sobre = obj; mesa3D.resaltar(id);
    document.documentElement.classList.toggle('cursor-3d', !!obj);
    tip.hidden = !obj;
    if(obj){ tip.innerHTML = `<b>${esc(obj.userData.nombre)}</b><span>Pulsa para estudiarlo</span>`; colocarTip(obj); }
  }
  function colocarTip(obj){
    (obj.userData.ancla || obj).getWorldPosition(proy); proy.y += 0.55; proy.project(hubCam);
    tip.style.left = `${(proy.x + 1) / 2 * innerWidth}px`; tip.style.top = `${(1 - proy.y) / 2 * innerHeight}px`;
  }
  function alMover(e){
    if(pulsado && estado.enSala && !estado.visorAbierto){
      const dx = e.clientX - pulsado.x;
      if(!pulsado.mirando && Math.abs(dx) > 6){ pulsado.mirando = true; if(sobre) marcar(null); document.documentElement.classList.add('arrastrando-sala'); }
      if(pulsado.mirando){ girarA(pulsado.giro + dx / innerWidth * GIRO_ARRASTRE, 0); return; }
    }
    if(!estado.enSala || estado.visorAbierto || saliendo || ignorar(e)){ if(sobre) marcar(null); return; }
    marcar(tocado(e));
  }
  function alPulsar(e){ pulsado = (!ignorar(e) && estado.enSala && !estado.visorAbierto) ? { x:e.clientX, y:e.clientY, giro:estado.giroSala, mirando:false } : null; }
  function alSoltar(e){
    document.documentElement.classList.remove('arrastrando-sala');
    if(!pulsado || estado.visorAbierto) return;
    const lejos = Math.hypot(e.clientX - pulsado.x, e.clientY - pulsado.y) > 6; pulsado = null;
    if(lejos || ignorar(e)) return;
    const obj = tocado(e);
    if(obj){ marcar(null); abrirImplante(obj.userData.implanteId); }
  }
  /* Abrir un implante = viajar a él: la cámara vuela hacia la pieza, todo se funde y aparece su página de estudio
     a pantalla completa (como el vuelo a la cabeza femoral de la portada). Al volver, la cámara regresa a la mesa. */
  const telon = document.createElement('div'); telon.className = 'telon-implante'; document.body.appendChild(telon);
  let viaje = null, regreso = null;
  function piezaVisible(id){
    let mejor = null, dMin = Infinity;
    for(const o of mesa3D?.objetivos() || []){
      if(o.userData.implanteId !== id) continue;
      (o.userData.ancla || o).getWorldPosition(proy);
      const dd = proy.distanceTo(hubCam.position); if(dd < dMin){ dMin = dd; mejor = o; }
    }
    return mejor;
  }
  function abrirImplante(id){
    if(!salaMesa || viaje || estado.visorAbierto) return;
    const v = salaMesa, a = v.actividades.find(x => x.clave === 'implante') || { clave:'implante', titulo:'Ficha del implante' };
    cargarDatos(v.id).catch(()=>{});
    const obj = piezaVisible(id);
    if(sobre) marcar(null);
    if(!obj){ abrir(v, a, { implanteId:id, pagina:true }); return; }
    const destino = (obj.userData.ancla || obj).getWorldPosition(new THREE.Vector3());
    regreso = { pos:hubCam.position.clone(), giro:estado.giroSala };
    // girar la vista hasta tener la pieza de frente y acercarse por la misma línea
    const dir = destino.clone().sub(hubCam.position);
    const giroObjetivo = estado.giroSala + Math.atan2(Math.sin(Math.atan2(-dir.x, -dir.z) - hubCam.rotation.y), Math.cos(Math.atan2(-dir.x, -dir.z) - hubCam.rotation.y));
    const llegada = hubCam.position.clone().lerp(destino, 0.82); llegada.y = destino.y + 0.05;
    gsap.killTweensOf(estado, 'giroSala');
    gsap.killTweensOf(telon);
    const esteViaje = {
      tl: null,
      cancelado: false,
      kill(){ this.cancelado = true; this.tl?.kill(); gsap.killTweensOf(telon); }
    };
    viaje = esteViaje;
    esteViaje.tl = gsap.timeline()
      .to(estado, { giroSala:giroObjetivo, duration:D(.9), ease:'power2.inOut' }, 0)
      .to(hubCam.position, { x:llegada.x, y:llegada.y, z:llegada.z, duration:D(1.3), ease:'power3.in' }, 0.15)
      .to('.imm-content, #immBack, .sala-giro, .mesa-test', { autoAlpha:0, duration:D(.3) }, 0)
      .to(telon, { autoAlpha:1, duration:D(.45) }, D(1.0))
      .add(async () => {
        if(esteViaje.cancelado || saliendo) return;
        await abrir(v, a, { implanteId:id, pagina:true });
        if(esteViaje.cancelado || saliendo || !estado.visorAbierto) return;
        // Esperar un frame tras montar/compilar el visor 3D para que el primer fotograma esté pintado antes de levantar el telón
        requestAnimationFrame(() => {
          if(esteViaje.cancelado || saliendo || !estado.visorAbierto) return;
          gsap.to(telon, {
            autoAlpha:0,
            duration:D(.6),
            delay:D(.08),
            onComplete:() => { if(viaje === esteViaje) viaje = null; }
          });
        });
      }, D(1.45));
  }
  function volverDeImplante(){
    if(viaje){ viaje.kill(); viaje = null; }
    const r = regreso; regreso = null;
    gsap.timeline()
      .to(telon, { autoAlpha:1, duration:D(.35) }, 0)
      .add(() => { cerrarVisorYa(); if(r){ hubCam.position.copy(r.pos).lerp(hubCam.position, 0.35); } }, D(.35))
      .add(() => { if(r){ gsap.to(hubCam.position, { x:r.pos.x, y:r.pos.y, z:r.pos.z, duration:D(.9), ease:'power3.out' }); gsap.to(estado, { giroSala:r.giro, duration:D(.9), ease:'power2.out', onUpdate:pintarGiro }); } }, D(.4))
      .to(telon, { autoAlpha:0, duration:D(.5) }, D(.45))
      .to('.imm-content, #immBack, .sala-giro, .mesa-test', { autoAlpha:1, duration:D(.4), clearProps:'visibility' }, D(.8));
  }
  /* Mirar a los lados: arrastrar en vacío, flechas ‹ › en pantalla, teclas ←/→ o la rueda. Solo en salas con mesa. */
  // El giro posible depende del ancho de la ventana: solo se gira lo justo para ver el implante del extremo.
  // limites = [mínimo (mirar a la derecha), máximo (mirar a la izquierda)] en rad; [0,0] si todo cabe en pantalla.
  const GIRO_PASO = 0.28, GIRO_ARRASTRE = 1.65, GIRO_MIN = 0.35;
  let limites = [0, 0];
  function calcularLimites(){
    if(!mesa3D){ limites = [0, 0]; return; }
    hubCam.updateMatrixWorld();
    const base = hubCam.rotation.y - estado.giroSala;
    const hfov = Math.atan(Math.tan(THREE.MathUtils.degToRad(hubCam.fov) / 2) * hubCam.aspect) * 0.86;
    let izq = 0, der = 0;
    for(const it of mesa3D.items){
      const o = piezaVisible(it.id); if(!o) continue;
      const pt = (o.userData.ancla || o).getWorldPosition(new THREE.Vector3()), d = pt.sub(hubCam.position);
      let th = Math.atan2(-d.x, -d.z) - base; th = Math.atan2(Math.sin(th), Math.cos(th));
      const m = Math.atan2(0.46, Math.hypot(d.x, d.z));      // medio ancho del implante visto desde la cámara
      izq = Math.max(izq, th + m - hfov); der = Math.max(der, -th + m - hfov);
    }
    // siempre queda un margen para mirar a los lados (aunque todo quepa), y más si algún implante se sale de pantalla
    limites = [-Math.max(GIRO_MIN, der), Math.max(GIRO_MIN, izq)];
    if(estado.giroSala < limites[0] || estado.giroSala > limites[1]) girarA(estado.giroSala);
    pintarGiro();
  }
  function alRedimensionar(){ if(estado.enSala && mesa3D) requestAnimationFrame(calcularLimites); }
  const flechas = ['izq','der'].map(lado => {
    const b = document.createElement('button');
    b.className = `sala-giro ${lado}`; b.type = 'button'; b.hidden = true;
    b.setAttribute('aria-label', lado === 'izq' ? 'Mirar a la izquierda' : 'Mirar a la derecha');
    b.addEventListener('click', () => girarA(estado.giroSala + (lado === 'izq' ? GIRO_PASO : -GIRO_PASO)));
    immerseEl.appendChild(b); return b;
  });
  const mesaTest = document.createElement('button');
  mesaTest.className = 'ghost mesa-test'; mesaTest.type = 'button'; mesaTest.textContent = 'Hacer el test'; mesaTest.hidden = true;
  immerseEl.appendChild(mesaTest);
  const mesaAyuda = document.createElement('p'); mesaAyuda.className = 'mesa-ayuda'; mesaAyuda.hidden = true; immerseEl.appendChild(mesaAyuda);
  function mostrarAyuda(){
    mesaAyuda.textContent = 'Arrastra o usa las flechas para mirar a los lados · Toca un implante para estudiarlo';
    mesaAyuda.hidden = false;
    gsap.fromTo(mesaAyuda, { autoAlpha:0, y:8 }, { autoAlpha:1, y:0, duration:D(.5) });
    gsap.to(mesaAyuda, { autoAlpha:0, duration:D(.8), delay:D(4.5) });
  }
  function girarA(g, dur = .7){
    g = THREE.MathUtils.clamp(g, limites[0], limites[1]);
    gsap.killTweensOf(estado, 'giroSala');
    if(dur) gsap.to(estado, { giroSala:g, duration:D(dur), ease:'power2.out', onUpdate:pintarGiro });
    else { estado.giroSala = g; pintarGiro(); }
    if(sobre) marcar(null);
  }
  function pintarGiro(){
    const hace = limites[1] - limites[0] > 0.02;      // si todo cabe, no hay flechas
    flechas.forEach(f => { f.hidden = !mesa3D || !hace; });
    flechas[0].disabled = estado.giroSala >= limites[1] - 0.01;
    flechas[1].disabled = estado.giroSala <= limites[0] + 0.01;
  }
  function alRodar(e){
    if(!estado.enSala || estado.visorAbierto || ignorar(e)) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if(Math.abs(d) < 1) return;
    const paso = THREE.MathUtils.clamp(d, -120, 120) * 0.0026;
    girarA(estado.giroSala - paso, 0.22);
  }
  function alTecla(e){
    if(!estado.enSala || estado.visorAbierto || e.target.closest?.('input,select,textarea')) return;
    if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'){ e.preventDefault(); girarA(estado.giroSala + GIRO_PASO); }
    if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'){ e.preventDefault(); girarA(estado.giroSala - GIRO_PASO); }
  }
  function activarMesa(v){
    desactivarMesa();
    mesa3D = salas[v.id]?.mesaInteractiva || null;
    immContent?.classList.toggle('modo-mesa', !!mesa3D);
    const hint = document.getElementById('immHint');
    if(!mesa3D){ if(hint) hint.textContent = ''; return; }
    salaMesa = v;
    if(hint) hint.textContent = '';
    // Sin panel: la mesa ocupa la sala. Quedan «Volver al pasillo», el Test (arriba a la derecha) y, para teclado
    // y lectores de pantalla, una lista invisible de implantes que se hace visible al recibir el foco.
    document.body.classList.add('en-mesa');
    const test = v.actividades.find(x => x.clave === 'test');
    mesaTest.hidden = !test; mesaTest.onclick = () => test && abrir(v, test);
    immerseEl.querySelector('.mesa-chips')?.remove();
    immerseEl.insertAdjacentHTML('beforeend', `<div class="mesa-chips" role="group" aria-label="Implantes de la mesa">${
      mesa3D.items.map(it => `<button class="chip" data-impl="${esc(it.id)}">${esc(it.nombre)}</button>`).join('')}</div>`);
    immerseEl.querySelectorAll('[data-impl]').forEach(b => {
      b.addEventListener('click', () => abrirImplante(b.dataset.impl));
      b.addEventListener('mouseenter', () => mesa3D?.resaltar(b.dataset.impl));
      b.addEventListener('mouseleave', () => mesa3D?.resaltar(null));
      b.addEventListener('focus', () => mesa3D?.resaltar(b.dataset.impl));
      b.addEventListener('blur', () => mesa3D?.resaltar(null));
    });
    addEventListener('pointermove', alMover); addEventListener('pointerdown', alPulsar); addEventListener('pointerup', alSoltar);
    addEventListener('wheel', alRodar, { passive:true }); addEventListener('keydown', alTecla); addEventListener('resize', alRedimensionar);
    limites = [0, 0]; pintarGiro();
  }
  function desactivarMesa(){
    removeEventListener('pointermove', alMover); removeEventListener('pointerdown', alPulsar); removeEventListener('pointerup', alSoltar);
    removeEventListener('wheel', alRodar); removeEventListener('keydown', alTecla); removeEventListener('resize', alRedimensionar);
    mesaAyuda.hidden = true; mesaTest.hidden = true; document.body.classList.remove('en-mesa');
    flechas.forEach(f => { f.hidden = true; }); document.documentElement.classList.remove('arrastrando-sala');
    if(mesa3D){ mesa3D.resaltar(null); }
    immerseEl.querySelector('.mesa-chips')?.remove();
    immContent?.classList.remove('modo-mesa');
    document.documentElement.classList.remove('cursor-3d');
    tip.hidden = true; sobre = null; pulsado = null; mesa3D = null; salaMesa = null;
  }

  /* ---- Visor de actividades: plantilla común ----
     Cada actividad recibe el cuerpo del visor y { datos, vitrina, avisar }:
     - datos: el contenido de la sala (datos/<id>.json), cargado una sola vez y guardado en caché
     - vitrina: su entrada de datos/vitrinas.json
     Las actividades "test" usan el motor común (test.js); el resto, la función que exporte el módulo de la sala. */
  const cacheDatos = {}, cacheDatosResueltos = {};
  function cargarDatos(id){
    if(!cacheDatos[id]) cacheDatos[id] = fetch(`datos/${id}.json`).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => (cacheDatosResueltos[id] = d))
      .catch(e=>{ delete cacheDatos[id]; throw e; });   // si falla, se reintenta la próxima vez
    return cacheDatos[id];
  }
  function actividad(v,a){ return salas[v.id]?.actividades?.[a.clave] || (a.clave==='test' ? pintarTest : null); }
  function disponible(v,a){ return !!actividad(v,a); }
  let apertura = 0;   // evita que una carga lenta pinte una actividad que ya se cerró o cambió
  async function abrir(v,a,extra={}){
    const f = actividad(v,a);
    if(!f){ avisar('Esta actividad está en construcción: la diseñaremos juntos.'); return; }
    const yo = ++apertura;
    const yaCargado = cacheDatosResueltos[v.id];
    visorTitulo.textContent=a.titulo;
    if(!yaCargado) visorCuerpo.innerHTML='<p class="visor-carga">Cargando la sala…</p>';
    visor.dataset.sala = v.id;
    const pagina = !!extra.pagina;   // página de estudio a pantalla completa (implantes) en vez de ventana flotante
    visor.classList.toggle('visor-pagina', pagina);
    document.getElementById('visorCerrar').textContent = pagina ? 'Volver a la mesa' : 'Cerrar';
    estado.visorAbierto=true;
    if(sobre) marcar(null);
    document.body.classList.add('visor-on');
    gsap.killTweensOf(visor);   // si se estaba cerrando, que el cierre no lo oculte después
    gsap.set(visor,{visibility:'visible'});
    if(pagina) gsap.set(visor,{opacity:1,y:0}); else gsap.fromTo(visor,{opacity:0,y:20},{opacity:1,y:0,duration:D(.4)});
    let datosSala = yaCargado;
    if(!datosSala){
      try{ datosSala = await cargarDatos(v.id); }
      catch(e){ if(yo===apertura) visorCuerpo.innerHTML='<p class="visor-carga">No se ha podido cargar el contenido de esta sala. Comprueba la conexión y vuelve a abrir la actividad.</p>'; return; }
    }
    if(yo!==apertura || !estado.visorAbierto) return;
    visorCuerpo.innerHTML=''; visorCuerpo.scrollTop=0;
    f(visorCuerpo, { datos:datosSala, vitrina:v, avisar, ...extra });
  }
  function cerrarVisor(){
    if(visor.classList.contains('visor-pagina') && visor.style.visibility==='visible' && estado.enSala && !saliendo){ volverDeImplante(); return; }
    cerrarVisorAnimado();
  }
  function cerrarVisorYa(){
    estado.visorAbierto=false; apertura++; document.body.classList.remove('visor-on'); gsap.killTweensOf(visor);
    gsap.set(visor,{visibility:'hidden',opacity:0}); visorCuerpo.innerHTML=''; visor.classList.remove('visor-pagina');
  }
  function cerrarVisorAnimado(){ if(visor.style.visibility==='visible'){ estado.visorAbierto=false; apertura++; document.body.classList.remove('visor-on'); gsap.killTweensOf(visor); gsap.to(visor,{opacity:0,duration:D(.25),onComplete:()=>{ gsap.set(visor,{visibility:'hidden'}); visorCuerpo.innerHTML=''; visor.classList.remove('visor-pagina'); }}); } }
  document.getElementById('visorCerrar').addEventListener('click',cerrarVisor);
  document.getElementById('immBack').addEventListener('click',salir);
  immToggle?.addEventListener('click',()=>{ immContent.classList.toggle('collapsed'); immToggle.textContent = immContent.classList.contains('collapsed') ? 'Ver actividades' : 'Ocultar panel'; });
  addEventListener('keydown',e=>{ if(estado.enSala && e.key==='Escape') (estado.visorAbierto?cerrarVisor():salir()); });

  return { entrar, salir };
}
