/* =========================================================
   Vitrina 1 · Historia y definiciones
   Galería de museo: una línea temporal en la pared y las tres generaciones de biomateriales en pedestales.
   construir(d, ctx): "d" es el grupo 3D detrás de la vitrina; ctx.sala() pone paredes,
   ctx.luz() la luz de la sala y ctx.anim() animaciones que solo corren si la vitrina se ve.
   ========================================================= */
import * as THREE from 'three';
import { mesh, std, basicGlow, canvasPlane } from '../util.js';
import { esc, el, barajar, sinDatos, raiz } from '../ui.js';

// Materiales y geometrías compartidas en la galería de historia
const pedMat = std(0x3A2F6E,{roughness:.35,metalness:.3});
const ringGlow = basicGlow(0xFFD58A,1.8);
const coneMat = new THREE.MeshBasicMaterial({ color:0xFFE2A8, transparent:true, opacity:0.06, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
const bioMat = std(0x9FF5E2,{roughness:0.15,transparent:true,opacity:0.86,emissive:0x0E5E52,emissiveIntensity:0.4});
const granuloGeo = new THREE.IcosahedronGeometry(0.06,1);
const strutGeo = new THREE.CylinderGeometry(0.012,0.012,0.4,6);

// Pedestal de museo con foco cenital
function pedestal(d, x, z=-3.8){
  mesh(new THREE.CylinderGeometry(0.38,0.42,1.4,24), pedMat, x,-1.45,z, d);
  mesh(new THREE.CylinderGeometry(0.39,0.39,0.03,24), ringGlow, x,-0.74,z, d);
  mesh(new THREE.ConeGeometry(0.7,2.6,24,1,true), coneMat, x,0.55,z, d);
  const g=new THREE.Group(); g.position.set(x,-0.25,z); d.add(g); return g;
}
// Placa con texto pintado
function placa(d, texto, x, y, z, w=0.5){ const p=canvasPlane(w,0.16,320,100,(g,W,H)=>{ g.fillStyle='#F4EBD8'; g.fillRect(0,0,W,H); g.fillStyle='#3A2F1E'; g.font='700 46px Sora, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(texto,W/2,H/2); });
  p.material.toneMapped=true; p.position.set(x,y,z); d.add(p); return p; }

export function construir(d, ctx){
  ctx.sala(d, 0x2A2350); ctx.luz(d, 0xFFD58A, 16);
  // Línea temporal pintada en la pared del fondo
  const linea = canvasPlane(5.2,1.0,1560,300,(g,w,h)=>{ g.fillStyle='#1C1640'; g.fillRect(0,0,w,h);
    g.strokeStyle='#FFD58A'; g.lineWidth=6; g.beginPath(); g.moveTo(40,150); g.lineTo(w-40,150); g.stroke();
    const hitos=[['Antigüedad','suturas, dientes'],['1949','Ridley · PMMA'],['1960','Charnley · cadera'],['1969','Hench · Bioglass'],['1977','Brånemark'],['2018','Chengdu']];
    hitos.forEach(([a,b],i)=>{ const x=80+i*(w-160)/(hitos.length-1); g.fillStyle='#FFD58A'; g.beginPath(); g.arc(x,150,14,0,7); g.fill();
      g.fillStyle='#F4EBD8'; g.font='700 40px Sora, sans-serif'; g.textAlign='center'; g.fillText(a,x,100); g.font='400 30px Sora, sans-serif'; g.fillStyle='#CFC6FF'; g.fillText(b,x,215); }); });
  linea.position.set(0,1.1,-6.15); d.add(linea);
  // 1ª generación (bioinerte): tornillo de titanio · 2ª (bioactiva): gránulos de vidrio bioactivo · 3ª (regenerativa): andamio poroso
  const metal=new THREE.MeshPhysicalMaterial({ color:0xD8DDE8, metalness:1, roughness:0.18 });
  const [p1,p2,p3]=[-1.6,0,1.6].map(x=>pedestal(d,x));
  mesh(new THREE.CylinderGeometry(0.09,0.07,0.55,24), metal, 0,0,0, p1);
  for(let i=0;i<6;i++) mesh(new THREE.TorusGeometry(0.095,0.02,8,24), metal, 0,-0.22+i*0.08,0, p1).rotation.x=Math.PI/2;
  for(let i=0;i<18;i++){ const m=mesh(granuloGeo, bioMat, (Math.random()-.5)*0.4,(Math.random()-.5)*0.3,(Math.random()-.5)*0.3, p2); m.scale.setScalar(0.8+Math.random()*0.5); }
  const andamio=new THREE.Group(); p3.add(andamio);
  const strut=std(0xF2EBDD,{roughness:.7});
  for(let i=0;i<4;i++) for(let j=0;j<4;j++){ const a=-0.18+i*0.12, b=-0.18+j*0.12;
    mesh(strutGeo, strut, a,0,b, andamio);
    mesh(strutGeo, strut, a,b,0, andamio).rotation.z=Math.PI/2;
    mesh(strutGeo, strut, 0,a,b, andamio).rotation.x=Math.PI/2; }
  [['1ª',-1.6],['2ª',0],['3ª',1.6]].forEach(([t,x])=>placa(d,t+' generación',x,-0.9,-3.38,0.62));
  ctx.anim(t=>{ [p1,p2,p3].forEach((g,i)=>{ g.rotation.y=t*0.5+i; g.position.y=-0.25+Math.sin(t+i)*0.04; }); });
}

/* =========================================================
   Actividades de la sala (se abren en el visor con { datos, vitrina, avisar })
   Todo el contenido sale de datos/historia.json
   ========================================================= */

// Generación a la que pertenece un hito o tarjeta: 1, 2, 3 o 0 (antes de las generaciones)
function genDe(texto=''){ return /3ª/.test(texto) ? 3 : /2ª/.test(texto) ? 2 : /1ª/.test(texto) ? 1 : 0; }
const anioTxt = (a) => a<0 ? `${Math.abs(a)} a. C.` : a<1000 ? `${a} d. C.` : String(a);

/* ---- 1 · Línea temporal: hitos, consensos y conceptos ---- */
function lineaTemporal(contenedor, { datos }){
  const hitos = (datos.hitos||[]).slice().sort((a,b)=>a.anio-b.anio);
  if(!hitos.length) return sinDatos(contenedor, 'hitos');
  const r = raiz(contenedor, 'linea');
  const eras = [...new Set(hitos.map(h=>h.era))];
  let sel = 0;

  r.innerHTML = `
    <p class="actv-intro">Recorre los ${hitos.length} hitos con las flechas del teclado o tocando cada año. El color indica la generación de biomateriales.</p>
    <div class="lt-eras" role="group" aria-label="Saltar a una época">
      ${eras.map(e=>`<button class="chip" data-era="${esc(e)}">${esc(e)}</button>`).join('')}
    </div>
    <div class="lt-pista" role="listbox" aria-label="Hitos">
      ${hitos.map((h,k)=>`<button class="lt-hito g${genDe(h.generacion)}" role="option" data-k="${k}" aria-selected="false">
        <span class="punto"></span><b>${anioTxt(h.anio)}</b><span class="tit">${esc(h.titulo)}</span></button>`).join('')}
    </div>
    <div class="lt-leyenda" aria-hidden="true"><span class="g0">Antes de las generaciones</span><span class="g1">1ª generación</span><span class="g2">2ª generación</span><span class="g3">3ª generación</span></div>
    <article class="lt-ficha" aria-live="polite"></article>
    <div class="lt-nav"><button class="btn-secundario" id="ltPrev">Hito anterior</button><button class="btn-secundario" id="ltNext">Hito siguiente</button></div>
    ${(datos.normas||[]).length?`<h3 class="actv-sub">Las definiciones de consenso</h3>
    <div class="lt-normas">${datos.normas.map(n=>`<div class="lt-norma"><b>${esc(n.codigo)}</b><span>${esc(n.titulo)}</span><p>${esc(n.clave)}</p><p class="dim">${esc(n.alcance)}</p></div>`).join('')}</div>`:''}
    ${(datos.conceptos||[]).length?`<h3 class="actv-sub">Conceptos clave</h3>
    <div class="lt-conceptos">${datos.conceptos.map(c=>`<details><summary>${esc(c.titulo)}</summary>
      <p>${esc(c.definicion)}</p>${c.detalle?`<p class="dim">${esc(c.detalle)}</p>`:''}${c.ejemplo?`<p class="ej"><b>Ejemplo:</b> ${esc(c.ejemplo)}</p>`:''}</details>`).join('')}</div>`:''}`;

  const botones = [...r.querySelectorAll('.lt-hito')], ficha = r.querySelector('.lt-ficha');
  function elegir(k, desplazar=true){
    sel = Math.max(0, Math.min(hitos.length-1, k)); const h = hitos[sel];
    botones.forEach((b,j)=>{ b.classList.toggle('on', j===sel); b.setAttribute('aria-selected', j===sel); });
    if(desplazar) botones[sel].scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
    r.querySelectorAll('.lt-eras .chip').forEach(c=>c.classList.toggle('on', c.dataset.era===h.era));
    ficha.className = `lt-ficha g${genDe(h.generacion)}`;
    ficha.innerHTML = `
      <p class="lt-fecha">${esc(h.fecha)} <span class="etq">${esc(h.generacion)}</span></p>
      <h3>${esc(h.titulo)}</h3>
      <p>${esc(h.descripcion)}</p>
      <dl><div><dt>Protagonistas</dt><dd>${esc(h.protagonista)}</dd></div><div><dt>Material</dt><dd>${esc(h.material)}</dd></div></dl>`;
    r.querySelector('#ltPrev').disabled = sel===0; r.querySelector('#ltNext').disabled = sel===hitos.length-1;
  }
  botones.forEach((b,k)=>b.addEventListener('click',()=>elegir(k)));
  r.querySelectorAll('.lt-eras .chip').forEach(c=>c.addEventListener('click',()=>elegir(hitos.findIndex(h=>h.era===c.dataset.era))));
  r.querySelector('#ltPrev').addEventListener('click',()=>elegir(sel-1));
  r.querySelector('#ltNext').addEventListener('click',()=>elegir(sel+1));
  r.addEventListener('keydown',e=>{
    if(e.target.closest('details')) return;
    if(e.key==='ArrowRight'){ e.preventDefault(); elegir(sel+1); }
    if(e.key==='ArrowLeft'){ e.preventDefault(); elegir(sel-1); }
  });
  elegir(0, false); r.focus({ preventScroll:true });
}

/* ---- 2 · ¿Implante, prótesis o ambos? Clasificador en una matriz 2×2 ----
   Las casillas salen de los dos criterios del JSON: en_el_cuerpo y reemplaza_aumenta */
const CASILLAS = [
  { dentro:true,  reemplaza:true,  nombre:'Implante y prótesis' },
  { dentro:false, reemplaza:true,  nombre:'Prótesis (no implante)' },
  { dentro:true,  reemplaza:false, nombre:'Implante (no prótesis)' },
  { dentro:false, reemplaza:false, nombre:'Ni implante ni prótesis' }
];
function implanteOProtesis(contenedor, { datos }){
  const banco = (datos.datos||[]).filter(d=>d.dispositivo && typeof d.en_el_cuerpo==='boolean' && typeof d.reemplaza_aumenta==='boolean');
  if(!banco.length) return sinDatos(contenedor, 'dispositivos para clasificar');
  const r = raiz(contenedor, 'clasif');
  let orden, i, aciertos, respondido;
  const acierto = new Map();   // dispositivo → si se clasificó bien (sin tocar los datos en caché)

  function empezar(){ orden = barajar(banco); i = 0; aciertos = 0; acierto.clear(); pintar(); }
  function pintar(){
    respondido = false;
    r.innerHTML = `
      <p class="actv-intro">Coloca cada dispositivo en su casilla. Un <b>implante</b> se coloca a propósito dentro del cuerpo; una <b>prótesis</b> reemplaza o aumenta una parte del cuerpo. Puede ser las dos cosas, una o ninguna.</p>
      <div class="cl-cabecera">
        <div class="cl-carta"><span class="dim">Dispositivo ${i+1} de ${orden.length}</span><b>${esc(orden[i].dispositivo)}</b></div>
        <p class="cl-marcador">${aciertos} ${aciertos===1?'acierto':'aciertos'}</p>
      </div>
      <div class="cl-matriz">
        <span class="cl-eje x">¿Se coloca dentro del cuerpo?</span>
        <span class="cl-col c1">Sí</span><span class="cl-col c2">No</span>
        <span class="cl-eje y">¿Reemplaza o aumenta una parte del cuerpo?</span>
        <span class="cl-fila f1">Sí</span>
        ${CASILLAS.slice(0,2).map((c,k)=>`<button class="cl-casilla" data-k="${k}" style="grid-area:${'ab'[k]}"><span>${c.nombre}</span><div class="cl-fichas"></div></button>`).join('')}
        <span class="cl-fila f2">No</span>
        ${CASILLAS.slice(2).map((c,k)=>`<button class="cl-casilla" data-k="${k+2}" style="grid-area:${'cd'[k]}"><span>${c.nombre}</span><div class="cl-fichas"></div></button>`).join('')}
      </div>
      <div class="cl-feedback" aria-live="polite"></div>`;
    // Los dispositivos ya colocados se quedan en su casilla
    orden.slice(0,i).forEach(d=>ponerFicha(d, acierto.get(d)));
    r.querySelectorAll('.cl-casilla').forEach(b=>b.addEventListener('click',()=>responder(+b.dataset.k)));
    r.focus({ preventScroll:true });
  }
  const casillaDe = (d)=> CASILLAS.findIndex(c=>c.dentro===d.en_el_cuerpo && c.reemplaza===d.reemplaza_aumenta);
  function ponerFicha(d, ok){ r.querySelectorAll('.cl-casilla')[casillaDe(d)].querySelector('.cl-fichas').appendChild(el(`<span class="cl-ficha ${ok?'ok':'ko'}">${esc(d.dispositivo)}</span>`)); }
  function responder(k){
    if(respondido) return; respondido = true;
    const d = orden[i], buena = casillaDe(d), ok = k===buena;
    acierto.set(d, ok); if(ok) aciertos++;
    ponerFicha(d, ok);
    const cas = r.querySelectorAll('.cl-casilla');
    cas.forEach(b=>b.disabled=true);
    cas[buena].classList.add('buena'); if(!ok) cas[k].classList.add('mala');
    r.querySelector('.cl-marcador').textContent = `${aciertos} ${aciertos===1?'acierto':'aciertos'}`;
    const ultima = i===orden.length-1;
    const fb = r.querySelector('.cl-feedback');
    fb.innerHTML = `<div class="test-explica ${ok?'ok':'ko'}"><b>${ok?'Correcto':'No es esa casilla'}: ${esc(d.clasificacion || CASILLAS[buena].nombre)}.</b>${d.explicacion?`<p>${esc(d.explicacion)}</p>`:''}</div>
      <button class="btn-primario" id="clSigue">${ultima?'Ver resultado':'Siguiente dispositivo'}</button>`;
    const b = fb.querySelector('#clSigue'); b.focus({ preventScroll:true });
    fb.scrollIntoView({ block:'nearest', behavior:'smooth' });
    b.addEventListener('click',()=>{ if(ultima) final(); else { i++; pintar(); } });
  }
  function final(){
    const n = orden.length;
    r.querySelector('.cl-cabecera').innerHTML = `<div class="cl-carta"><span class="dim">Resultado</span><b>${aciertos} de ${n} bien clasificados</b></div>`;
    r.querySelector('.cl-feedback').innerHTML = `<p class="actv-intro">${aciertos===n?'Clasificación perfecta.':'Las fichas en rojo son las que fallaste: ya están en su casilla correcta.'}</p>
      <button class="btn-primario" id="clOtra">Volver a empezar</button>`;
    r.querySelector('#clOtra').addEventListener('click',empezar);
    r.querySelector('#clOtra').focus({ preventScroll:true });
  }
  empezar();
}

/* ---- 3 · Las tres generaciones: recorrido paso a paso y tabla comparativa ---- */
// «Primera generación: materiales bioinertes» → «Materiales bioinertes»
function nombreCorto(n=''){ const t = (n.split(':')[1] || n).trim(); return t.charAt(0).toUpperCase()+t.slice(1); }
function tresGeneraciones(contenedor, { datos }){
  const gens = (datos.generaciones||[]).slice().sort((a,b)=>a.numero-b.numero);
  if(!gens.length) return sinDatos(contenedor, 'generaciones');
  const r = raiz(contenedor, 'gens');
  let sel = 0, comparar = false;
  const lista = (arr)=> (arr||[]).map(t=>`<li>${esc(t)}</li>`).join('');

  r.innerHTML = `
    <div class="gn-pasos" role="tablist" aria-label="Generaciones">
      ${gens.map((g,k)=>`<button class="gn-paso g${g.numero}" role="tab" data-k="${k}"><span class="num">${g.numero}</span><span><b>${esc(nombreCorto(g.nombre))}</b><span class="dim">${esc(g.epoca)}</span></span></button>`).join('')}
    </div>
    <div class="gn-barra"><button class="btn-secundario" id="gnComparar" aria-pressed="false">Comparar las tres</button></div>
    <div class="gn-cuerpo" aria-live="polite"></div>`;
  const cuerpo = r.querySelector('.gn-cuerpo'), pasos = [...r.querySelectorAll('.gn-paso')];

  function ficha(){
    const g = gens[sel];
    cuerpo.innerHTML = `<article class="gn-ficha g${g.numero}">
      <h3>${esc(g.nombre)}</h3>
      <p class="gn-filo">${esc(g.filosofia)}</p>
      <div class="gn-rejilla">
        <section><h4>Objetivo biológico</h4><p>${esc(g.objetivo_biologico)}</p></section>
        <section><h4>Cómo lo consigue</h4><p>${esc(g.mecanismo)}</p></section>
        <section><h4>Materiales</h4><ul class="gn-chips">${lista(g.ejemplos_materiales)}</ul></section>
        <section><h4>Dispositivos</h4><ul class="gn-chips">${lista(g.ejemplos_dispositivos)}</ul></section>
        <section><h4>Limitación</h4><p>${esc(g.limitacion)}</p></section>
        <section><h4>Hoy</h4><p>${esc(g.matiz_actual)}</p></section>
      </div>
      <div class="lt-nav">
        <button class="btn-secundario" id="gnPrev" ${sel===0?'disabled':''}>Generación anterior</button>
        <button class="btn-primario" id="gnNext" ${sel===gens.length-1?'disabled':''}>Siguiente generación</button>
      </div></article>`;
    cuerpo.querySelector('#gnPrev').addEventListener('click',()=>ir(sel-1));
    cuerpo.querySelector('#gnNext').addEventListener('click',()=>ir(sel+1));
  }
  function tabla(){
    const filas = [['Filosofía','filosofia'],['Objetivo biológico','objetivo_biologico'],['Cómo lo consigue','mecanismo'],['Materiales','ejemplos_materiales'],['Limitación','limitacion']];
    cuerpo.innerHTML = `<div class="gn-tabla-wrap"><table class="gn-tabla">
      <thead><tr><th></th>${gens.map(g=>`<th class="g${g.numero}"><span class="num">${g.numero}</span> ${esc(g.epoca)}</th>`).join('')}</tr></thead>
      <tbody>${filas.map(([t,k])=>`<tr><th>${t}</th>${gens.map(g=>`<td>${Array.isArray(g[k])?`<ul>${lista(g[k])}</ul>`:esc(g[k])}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  }
  function ir(k){
    sel = Math.max(0, Math.min(gens.length-1, k)); comparar = false;
    pintar(); pasos[sel].focus({ preventScroll:true });
  }
  function pintar(){
    pasos.forEach((p,j)=>{ p.classList.toggle('on', !comparar && j===sel); p.setAttribute('aria-selected', !comparar && j===sel); });
    const b = r.querySelector('#gnComparar'); b.setAttribute('aria-pressed', comparar); b.textContent = comparar ? 'Volver al recorrido' : 'Comparar las tres';
    comparar ? tabla() : ficha();
  }
  pasos.forEach((p,k)=>p.addEventListener('click',()=>ir(k)));
  r.querySelector('#gnComparar').addEventListener('click',()=>{ comparar=!comparar; pintar(); });
  r.addEventListener('keydown',e=>{
    if(comparar) return;
    if(e.key==='ArrowRight'){ e.preventDefault(); ir(sel+1); }
    if(e.key==='ArrowLeft'){ e.preventDefault(); ir(sel-1); }
  });
  pintar(); r.focus({ preventScroll:true });
}

export const actividades = {
  'linea-temporal': lineaTemporal,
  'implante-o-protesis': implanteOProtesis,
  'tres-generaciones': tresGeneraciones
};
