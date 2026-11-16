/* =========================================================
   Vitrina 1 · Historia y definiciones
   Galería de museo: una línea temporal en la pared y las tres generaciones de biomateriales en pedestales.
   construir(d, ctx): "d" es el grupo 3D detrás de la vitrina; ctx.sala() pone paredes,
   ctx.luz() la luz de la sala y ctx.anim() animaciones que solo corren si la vitrina se ve.
   ========================================================= */
import * as THREE from 'three';
import { mesh, std, basicGlow, canvasPlane } from '../util.js';
import { esc } from '../actividades.js';

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
   Actividades interactivas de Vitrina 01 (en el visor)
   ========================================================= */
export const actividades = {
  'linea-temporal': (contenedor, { datos }) => {
    const hitos = [...(datos.hitos || [])].sort((a,b)=>(a.anio??0)-(b.anio??0));
    const eras = ['Todas', ...new Set(hitos.map(h=>h.era).filter(Boolean))];
    let eraActiva = 'Todas', pestana = 'hitos';

    function pintar(){
      const lista = eraActiva === 'Todas' ? hitos : hitos.filter(h=>h.era === eraActiva);
      contenedor.innerHTML = `
        <div class="v-tabs">
          <button class="v-tab ${pestana==='hitos'?'on':''}" data-p="hitos">Cronología (${hitos.length} hitos)</button>
          <button class="v-tab ${pestana==='conceptos'?'on':''}" data-p="conceptos">Definiciones y Consenso (${(datos.conceptos||[]).length})</button>
          <button class="v-tab ${pestana==='fuentes'?'on':''}" data-p="fuentes">Bibliografía</button>
        </div>
        ${pestana==='hitos' ? `
          <div class="v-pills">${eras.map(e=>`<button class="v-pill ${e===eraActiva?'on':''}" data-e="${esc(e)}">${esc(e)}</button>`).join('')}</div>
          <div class="v-timeline">
            ${lista.map(h=>`
              <article class="v-tl-item">
                <div class="v-tl-dot"></div>
                <div class="v-tl-card">
                  <div class="v-tl-meta"><span class="v-badge">${esc(h.fecha)}</span><span class="v-tag">${esc(h.generacion)}</span></div>
                  <h3>${esc(h.titulo)}</h3>
                  <p class="v-meta-line"><b>Protagonistas:</b> ${esc(h.protagonista)} · <b>Materiales:</b> ${esc(h.material)}</p>
                  <p>${esc(h.descripcion)}</p>
                </div>
              </article>`).join('')}
          </div>` : ''}
        ${pestana==='conceptos' ? `
          <div class="v-grid-2">
            ${(datos.normas||[]).map(n=>`
              <article class="v-card v-card-accent">
                <span class="v-badge">${esc(n.codigo)}</span>
                <h3>${esc(n.titulo)}</h3>
                <p class="v-dim">${esc(n.alcance)}</p>
                <p><b>Idea clave:</b> ${esc(n.clave)}</p>
              </article>`).join('')}
            ${(datos.conceptos||[]).map(c=>`
              <article class="v-card">
                <h3>${esc(c.titulo)}</h3>
                <p>${esc(c.definicion)}</p>
                <p class="v-dim">${esc(c.detalle)}</p>
                <p class="v-ex"><b>Ejemplo:</b> ${esc(c.ejemplo)}</p>
              </article>`).join('')}
          </div>` : ''}
        ${pestana==='fuentes' ? `
          <div class="v-card">
            <h3>Referencias bibliográficas de esta vitrina</h3>
            <ul class="v-list">${(datos.fuentes||[]).map(f=>`<li>${esc(f)}</li>`).join('')}</ul>
          </div>` : ''}`;

      contenedor.querySelectorAll('.v-tab').forEach(b=>b.addEventListener('click',()=>{ pestana=b.dataset.p; pintar(); }));
      contenedor.querySelectorAll('.v-pill').forEach(b=>b.addEventListener('click',()=>{ eraActiva=b.dataset.e; pintar(); }));
    }
    pintar();
  },

  'implante-o-protesis': (contenedor, { datos }) => {
    const casos = datos.datos || [];
    const categorias = [
      'Implante y prótesis',
      'Implante (no prótesis)',
      'Prótesis (no implante)',
      'Dispositivo médico (ni implante ni prótesis)'
    ];
    let idx = 0, aciertos = 0;
    const historial = [];

    function pintar(){
      if(idx >= casos.length){
        contenedor.innerHTML = `
          <div class="v-result">
            <span class="v-badge">Clasificación completada</span>
            <h3>${aciertos} / ${casos.length} dispositivos clasificados correctamente</h3>
            <p>Recuerda la regla de oro de Chengdu: <b>implante</b> exige colocación dentro del cuerpo; <b>prótesis</b> exige reemplazar o aumentar una parte.</p>
            <button class="cta" id="ipRetry">Practicar otra vez</button>
          </div>
          <div class="v-table-wrap"><table class="v-table">
            <thead><tr><th>Dispositivo</th><th>¿Dentro del cuerpo?</th><th>¿Reemplaza parte?</th><th>Clasificación</th></tr></thead>
            <tbody>${casos.map(c=>`<tr><td><b>${esc(c.dispositivo)}</b></td><td>${c.en_el_cuerpo?'Sí':'No'}</td><td>${c.reemplaza_aumenta?'Sí':'No'}</td><td><span class="v-tag">${esc(c.clasificacion)}</span></td></tr>`).join('')}</tbody>
          </table></div>`;
        contenedor.querySelector('#ipRetry').addEventListener('click', ()=>{ idx=0; aciertos=0; historial.length=0; pintar(); });
        return;
      }

      const c = casos[idx];
      contenedor.innerHTML = `
        <div class="v-quiz">
          <div class="v-card v-legend">
            <span><b>Implante:</b> colocado intencionadamente, total o parcialmente, dentro del cuerpo.</span>
            <span><b>Prótesis:</b> reemplaza o aumenta una parte del cuerpo (puede estar fuera o dentro).</span>
          </div>
          <div class="v-quiz-top">
            <span class="v-badge">Caso ${idx+1} de ${casos.length}</span>
            <span class="v-dim">Aciertos: <b>${aciertos}</b></span>
          </div>
          <div class="v-progress"><i style="width:${(idx/casos.length)*100}%"></i></div>
          <h3 class="v-qtitle">¿Cómo clasificarías: <span style="color:var(--bio)">${esc(c.dispositivo)}</span>?</h3>
          <div class="v-grid-2">
            ${categorias.map((cat,k)=>`<button class="v-opt" data-cat="${esc(cat)}"><span class="v-letra">${k+1}</span><span>${esc(cat)}</span></button>`).join('')}
          </div>
          <div class="v-feedback" id="ipFb" hidden></div>
          <div class="v-quiz-foot"><button class="ghost" id="ipNext" hidden>${idx+1<casos.length?'Siguiente dispositivo →':'Ver tabla resumen'}</button></div>
        </div>`;

      const btns = [...contenedor.querySelectorAll('.v-opt')];
      const fb = contenedor.querySelector('#ipFb');
      const next = contenedor.querySelector('#ipNext');
      btns.forEach(b=>b.addEventListener('click', ()=>{
        const elegida = b.dataset.cat;
        const ok = elegida === c.clasificacion;
        if(ok) aciertos++;
        historial.push({ ...c, ok });
        btns.forEach(x=>{
          x.disabled = true;
          if(x.dataset.cat === c.clasificacion) x.classList.add('ok');
          else if(x.dataset.cat === elegida) x.classList.add('bad');
        });
        fb.hidden = false;
        fb.className = 'v-feedback ' + (ok?'ok':'bad');
        fb.innerHTML = `<b>${ok?'¡Exacto!':'Ojo con la definición'}</b>
          <p>¿Dentro del cuerpo? <b>${c.en_el_cuerpo?'Sí':'No'}</b> · ¿Reemplaza o aumenta? <b>${c.reemplaza_aumenta?'Sí':'No'}</b></p>
          <p>${esc(c.explicacion)}</p>`;
        next.hidden = false;
      }));
      next.addEventListener('click', ()=>{ idx++; pintar(); });
    }
    pintar();
  },

  'tres-generaciones': (contenedor, { datos }) => {
    const gens = datos.generaciones || [];
    let activa = 0; // 0, 1, 2 o 'todas'

    function pintar(){
      const g = typeof activa === 'number' ? gens[activa] : null;
      contenedor.innerHTML = `
        <div class="v-tabs">
          ${gens.map((item,i)=>`<button class="v-tab ${activa===i?'on':''}" data-g="${i}">${item.numero}ª Generación</button>`).join('')}
          <button class="v-tab ${activa==='todas'?'on':''}" data-g="todas">Comparar las 3</button>
        </div>
        ${g ? `
          <div class="v-card v-gen-hero">
            <div class="v-tl-meta"><span class="v-badge">${g.numero}ª Generación</span><span class="v-tag">${esc(g.epoca)}</span></div>
            <h3>${esc(g.nombre)}</h3>
            <p class="v-ex"><b>Filosofía:</b> ${esc(g.filosofia)}</p>
            <div class="v-grid-2">
              <div class="v-subbox"><b>Objetivo biológico</b><p>${esc(g.objetivo_biologico)}</p></div>
              <div class="v-subbox"><b>Mecanismo en la interfaz</b><p>${esc(g.mecanismo)}</p></div>
              <div class="v-subbox"><b>Materiales representativos</b><div class="v-chips">${(g.ejemplos_materiales||[]).map(m=>`<span>${esc(m)}</span>`).join('')}</div></div>
              <div class="v-subbox"><b>Dispositivos clave</b><div class="v-chips">${(g.ejemplos_dispositivos||[]).map(m=>`<span>${esc(m)}</span>`).join('')}</div></div>
            </div>
            <div class="v-grid-2" style="margin-top:.9rem">
              <div class="v-subbox warn"><b>Principal limitación</b><p>${esc(g.limitacion)}</p></div>
              <div class="v-subbox bio"><b>Cómo convive hoy</b><p>${esc(g.matiz_actual)}</p></div>
            </div>
          </div>` : `
          <div class="v-grid-3">
            ${gens.map(item=>`
              <article class="v-card">
                <span class="v-badge">${item.numero}ª Gen. · ${esc(item.epoca)}</span>
                <h3>${esc(item.nombre.replace(/^[^:]+:\s*/,''))}</h3>
                <p><b>Filosofía:</b> ${esc(item.filosofia)}</p>
                <p><b>Objetivo:</b> ${esc(item.objetivo_biologico)}</p>
                <p class="v-dim"><b>Limitación:</b> ${esc(item.limitacion)}</p>
              </article>`).join('')}
          </div>`}`;

      contenedor.querySelectorAll('.v-tab').forEach(b=>b.addEventListener('click', ()=>{
        activa = b.dataset.g === 'todas' ? 'todas' : +b.dataset.g;
        pintar();
      }));
    }
    pintar();
  }
};
