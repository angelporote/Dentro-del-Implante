/* =========================================================
   Vitrina 1 · Historia y definiciones
   Galería de museo: una línea temporal en la pared y las tres generaciones de biomateriales en pedestales.
   construir(d, ctx): "d" es el grupo 3D detrás de la vitrina; ctx.sala() pone paredes,
   ctx.luz() la luz de la sala y ctx.anim() animaciones que solo corren si la vitrina se ve.
   ========================================================= */
import * as THREE from 'three';
import { mesh, std, basicGlow, canvasPlane } from '../util.js';
import { esc, el, barajar, sinDatos, raiz } from '../ui.js';
import { montarVisor3D } from '../visor3d.js';

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

/* ---- Modelos 3D giratorios para los hitos y generaciones ---- */
function escenaHito3D(anio){
  return (grupo)=>{
    const ti = std(0xC2CBDC,{metalness:0.85,roughness:0.22});
    const vidrio = std(0x5FF2D2,{roughness:0.15,metalness:0.05,transparent:true,opacity:0.78});
    const hueso = std(0xE8D8B8,{roughness:0.75});
    const oro = std(0xFFD58A,{metalness:0.8,roughness:0.25});

    if(anio < 0){
      mesh(new THREE.BoxGeometry(2.1,0.55,1.25), std(0x5A2E4C,{roughness:0.7}), 0,-0.25,0, grupo);
      mesh(new THREE.BoxGeometry(1.9,0.06,0.06), std(0x140E2A,{roughness:0.9}), 0,0.04,0, grupo);
      for(let i=-3;i<=3;i++) mesh(new THREE.TorusGeometry(0.18,0.025,8,20,Math.PI), oro, i*0.26,0.05,0, grupo).rotation.y = Math.PI/2;
      return t => { grupo.rotation.y = Math.sin(t*0.4)*0.35; };
    }
    if(anio === 200){
      mesh(new THREE.BoxGeometry(2.2,0.6,0.9), hueso, 0,-0.45,0, grupo);
      const nacar = std(0xF6F2FF,{roughness:0.18,metalness:0.15,emissive:0x1A6B62,emissiveIntensity:0.25});
      [-0.55,0,0.55].forEach((x,i)=>{
        mesh(new THREE.ConeGeometry(0.18,0.62,16), i===1?nacar:hueso, x,0.05,0, grupo).rotation.z = Math.PI;
        mesh(new THREE.CylinderGeometry(0.19,0.16,0.34,16), i===1?nacar:hueso, x,0.38,0, grupo);
      });
      mesh(new THREE.TorusGeometry(0.24,0.025,8,24), vidrio, 0,-0.02,0, grupo).rotation.x = Math.PI/2;
      return t => { grupo.rotation.y = t*0.35; };
    }
    if(anio === 1829){
      [[-0.65,0xD95353,0.45],[0,0xFFD58A,0.62],[0.65,0xD4DEEE,0.85]].forEach(([x,c,m])=>{
        mesh(new THREE.CylinderGeometry(0.18,0.18,1.15,20), std(c,{metalness:m,roughness:0.28}), x,0,0, grupo);
      });
      return t => { grupo.rotation.y = t*0.4; };
    }
    if(anio === 1943){
      mesh(new THREE.BoxGeometry(2.1,0.45,1.25), std(0x1E2F5C,{transparent:true,opacity:0.55,roughness:0.2}), 0,-0.45,0, grupo);
      const tambor = new THREE.Group(); tambor.position.set(0,0.15,0); grupo.add(tambor);
      mesh(new THREE.CylinderGeometry(0.52,0.52,1.35,16,1,true), std(0x9FB4FF,{roughness:0.4,wireframe:true}), 0,0,0, tambor).rotation.z = Math.PI/2;
      for(let i=-4;i<=4;i++) mesh(new THREE.TorusGeometry(0.55,0.032,8,28), vidrio, i*0.14,0,0, tambor).rotation.y = Math.PI/2;
      return t => { tambor.rotation.x = t*1.2; };
    }
    if(anio === 1947){
      const tubo = new THREE.Group(); grupo.add(tubo);
      mesh(new THREE.CylinderGeometry(0.46,0.46,1.65,24,1,true), std(0xE8E2FF,{roughness:0.55,side:THREE.DoubleSide}), 0,0,0, tubo).rotation.z = Math.PI/2;
      for(let i=-5;i<=5;i++) mesh(new THREE.TorusGeometry(0.47,0.02,8,28), vidrio, i*0.14,0,0, tubo).rotation.y = Math.PI/2;
      return t => { tubo.rotation.y = Math.sin(t*0.5)*0.5; tubo.rotation.x = t*0.3; };
    }
    if(anio === 1949){
      mesh(new THREE.TorusGeometry(0.95,0.09,14,36), std(0x6C8EFF,{roughness:0.35}), 0,0,0, grupo);
      mesh(new THREE.TorusGeometry(0.62,0.05,12,32), std(0x302A66,{roughness:0.5}), 0,0,0, grupo);
      const lente = mesh(new THREE.SphereGeometry(0.46,24,18), std(0x9FF5E2,{roughness:0.06,metalness:0.05,transparent:true,opacity:0.78}), 0,0,0, grupo);
      lente.scale.set(1,1,0.38);
      [-1,1].forEach(s=>{
        const haptica = mesh(new THREE.TorusGeometry(0.42,0.025,8,20,Math.PI*0.75), oro, s*0.35,0,0, grupo);
        haptica.rotation.z = s>0 ? -0.6 : 2.5;
      });
      return t => { grupo.rotation.y = Math.sin(t*0.6)*0.65; };
    }
    if(anio === 1952){
      mesh(new THREE.TorusGeometry(0.62,0.08,14,32), ti, 0,-0.25,0, grupo).rotation.x = Math.PI/2;
      for(let i=0;i<3;i++){
        const arco = mesh(new THREE.TorusGeometry(0.62,0.035,10,24,Math.PI), ti, 0,-0.25,0, grupo);
        arco.rotation.y = i*Math.PI/3;
      }
      const bola = mesh(new THREE.SphereGeometry(0.36,24,18), std(0xFF8A96,{roughness:0.35}), 0,0,0, grupo);
      return t => { bola.position.y = 0.08 + Math.sin(t*3)*0.16; grupo.rotation.y = t*0.4; };
    }
    if(anio === 1958){
      const tallo = mesh(new THREE.CylinderGeometry(0.14,0.06,1.35,20), ti, -0.22,-0.32,0, grupo);
      tallo.rotation.z = -0.18;
      mesh(new THREE.CylinderGeometry(0.075,0.095,0.48,16), ti, 0.04,0.4,0, grupo).rotation.z = -0.68;
      mesh(new THREE.SphereGeometry(0.2,24,18), ti, 0.25,0.58,0, grupo);
      const cotilo = mesh(new THREE.SphereGeometry(0.36,24,16,0,Math.PI*2,0,Math.PI*0.58), std(0xFFFFFF,{roughness:0.3}), 0.34,0.68,0, grupo);
      cotilo.rotation.z = -0.7; cotilo.rotation.x = Math.PI;
      const cemento = mesh(new THREE.SphereGeometry(0.43,20,14,0,Math.PI*2,0,Math.PI*0.55), oro, 0.38,0.72,0, grupo);
      cemento.rotation.z = -0.7; cemento.rotation.x = Math.PI;
      return t => { grupo.rotation.y = t*0.45; };
    }
    if(anio === 1960){
      mesh(new THREE.TorusGeometry(0.68,0.08,14,32), ti, 0,0,0, grupo).rotation.x = Math.PI/2;
      const disco = mesh(new THREE.CylinderGeometry(0.55,0.55,0.08,28), std(0x1B1D26,{metalness:0.5,roughness:0.12}), 0,0.05,0, grupo);
      return t => { disco.rotation.x = 0.35 + Math.sin(t*3)*0.32; grupo.rotation.y = t*0.35; };
    }
    if(anio === 1964){
      mesh(new THREE.CylinderGeometry(0.65,0.65,0.95,24,1,false,0,Math.PI*1.35), std(0xE8D8B8,{roughness:0.8,transparent:true,opacity:0.55}), 0,-0.25,0, grupo).rotation.y = 0.8;
      mesh(new THREE.CylinderGeometry(0.24,0.18,1.55,24), ti, 0,0.05,0, grupo);
      for(let i=0;i<7;i++) mesh(new THREE.TorusGeometry(0.24,0.04,8,24), oro, 0,-0.52+i*0.18,0, grupo).rotation.x = Math.PI/2;
      mesh(new THREE.CylinderGeometry(0.32,0.28,0.22,6), ti, 0,0.88,0, grupo);
      return t => { grupo.rotation.y = t*0.5; };
    }
    if(anio === 1966){
      const trozos = [];
      for(let i=-2;i<=2;i++) trozos.push(mesh(new THREE.BoxGeometry(0.3,0.34,0.55), oro, i*0.36,0,0, grupo));
      return t => {
        const s = 0.65 + 0.35*Math.cos(t*1.2);
        trozos.forEach((m,i)=>{ m.scale.setScalar(s); m.position.y = Math.sin(t*2+i)*0.08; });
        grupo.rotation.y = t*0.35;
      };
    }
    if(anio === 1969){
      mesh(new THREE.BoxGeometry(1.4,0.55,1.1), vidrio, 0,-0.45,0, grupo);
      mesh(new THREE.BoxGeometry(1.44,0.16,1.14), oro, 0,-0.08,0, grupo);
      mesh(new THREE.BoxGeometry(1.4,0.55,1.1), hueso, 0,0.32,0, grupo);
      const iones = [];
      for(let i=0;i<10;i++){
        const m = mesh(new THREE.SphereGeometry(0.055,10,10), i%2?vidrio:oro, (Math.random()-.5)*1.2, -0.2+Math.random()*0.4, (Math.random()-.5)*0.9, grupo);
        iones.push([m, i]);
      }
      return t => {
        grupo.rotation.y = t*0.4;
        iones.forEach(([m,i])=>{ m.position.y = -0.15 + Math.sin(t*2.4+i)*0.12; });
      };
    }
    if(anio === 1978){
      mesh(new THREE.CylinderGeometry(0.62,0.62,1.65,24,1,true), std(0xFF7A88,{transparent:true,opacity:0.25,roughness:0.4,side:THREE.DoubleSide}), 0,0,0, grupo).rotation.z = Math.PI/2;
      const stent = mesh(new THREE.CylinderGeometry(0.5,0.5,1.45,12,6,true), ti, 0,0,0, grupo);
      stent.material = std(0xD8E2F4,{metalness:0.9,roughness:0.18,wireframe:true});
      stent.rotation.z = Math.PI/2;
      return t => { stent.rotation.x = t*0.5; grupo.rotation.y = Math.sin(t*0.4)*0.45; };
    }
    if(anio === 1986){
      const strut = std(0xB8A6FF,{roughness:0.5});
      for(let x=-0.6;x<=0.61;x+=0.4) for(let z=-0.4;z<=0.41;z+=0.4) mesh(new THREE.CylinderGeometry(0.03,0.03,1.0,8), strut, x,0,z, grupo);
      for(let y=-0.4;y<=0.41;y+=0.4) for(let z=-0.4;z<=0.41;z+=0.4){ const b=mesh(new THREE.CylinderGeometry(0.028,0.028,1.3,8), strut, 0,y,z, grupo); b.rotation.z=Math.PI/2; }
      for(let i=0;i<6;i++) mesh(new THREE.SphereGeometry(0.11,12,10), vidrio, -0.4+(i%3)*0.4, i<3?-0.2:0.2, i%2?0.2:-0.2, grupo);
      return t => { grupo.rotation.y = t*0.4; grupo.rotation.x = 0.25; };
    }
    // 2018 (Chengdu / sistema material-anfitrión)
    const core = mesh(new THREE.IcosahedronGeometry(0.42,1), ti, 0,0,0, grupo);
    const r1 = mesh(new THREE.TorusGeometry(0.85,0.03,10,36), vidrio, 0,0,0, grupo);
    const r2 = mesh(new THREE.TorusGeometry(0.85,0.03,10,36), oro, 0,0,0, grupo);
    r1.rotation.x = 0.8; r2.rotation.y = 0.9;
    for(let i=0;i<6;i++){
      const ang = i*Math.PI/3;
      mesh(new THREE.SphereGeometry(0.11,14,12), i%2?vidrio:hueso, Math.cos(ang)*0.95, Math.sin(ang)*0.3, Math.sin(ang)*0.95, grupo);
    }
    return t => { core.rotation.y = t*0.6; r1.rotation.z = t*0.7; r2.rotation.x = -t*0.55; grupo.rotation.y = t*0.25; };
  };
}

function escenaGen3D(modoId){
  return (grupo)=>{
    const hueso = std(0xE8D8B8,{roughness:0.75});
    const vidrio = std(0x5FF2D2,{roughness:0.2,transparent:true,opacity:0.85});
    const oro = std(0xFFD58A,{roughness:0.35});
    mesh(new THREE.BoxGeometry(2.1,0.38,1.2), hueso, 0,0.68,0, grupo);
    if(modoId === 'gen1'){
      mesh(new THREE.BoxGeometry(2.15,0.22,1.25), std(0xFF7A88,{transparent:true,opacity:0.65,roughness:0.6}), 0,0.28,0, grupo);
      mesh(new THREE.BoxGeometry(2.1,0.55,1.2), std(0x6D7AB0,{metalness:0.7,roughness:0.3}), 0,-0.25,0, grupo);
      return t => { grupo.rotation.y = Math.sin(t*0.5)*0.55; };
    }
    if(modoId === 'gen2a'){
      mesh(new THREE.BoxGeometry(2.12,0.14,1.22), oro, 0,0.42,0, grupo);
      mesh(new THREE.BoxGeometry(2.1,0.58,1.2), vidrio, 0,0.02,0, grupo);
      return t => { grupo.rotation.y = Math.sin(t*0.5)*0.55; };
    }
    if(modoId === 'gen2b'){
      const trozos = [];
      for(let i=-2;i<=2;i++) trozos.push(mesh(new THREE.BoxGeometry(0.32,0.42,0.95), oro, i*0.4,0.05,0, grupo));
      return t => { const s=0.65+0.35*Math.cos(t*1.2); trozos.forEach(m=>m.scale.set(s,s,1)); grupo.rotation.y = Math.sin(t*0.45)*0.55; };
    }
    const strutMat = std(0xB8A6FF,{roughness:0.5});
    for(let x=-0.75;x<=0.76;x+=0.5) for(let z=-0.4;z<=0.41;z+=0.4) mesh(new THREE.CylinderGeometry(0.035,0.035,0.9,8), strutMat, x,-0.02,z, grupo);
    for(let y=-0.35;y<=0.36;y+=0.35) for(let z=-0.4;z<=0.41;z+=0.4){ const b=mesh(new THREE.CylinderGeometry(0.03,0.03,1.7,8), strutMat, 0,y,z, grupo); b.rotation.z=Math.PI/2; }
    for(let i=0;i<6;i++) mesh(new THREE.SphereGeometry(0.11,12,10), vidrio, -0.5+(i%3)*0.5, i<3?-0.15:0.15, (i%2?0.2:-0.2), grupo);
    mesh(new THREE.TorusGeometry(0.55,0.045,8,24,Math.PI), std(0xFF6B84,{roughness:0.4}), 0,-0.22,0.1, grupo).rotation.x = 0.4;
    return t => { grupo.rotation.y = t*0.45; };
  };
}

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
    <article class="lt-ficha" aria-live="polite"><div class="lt-split"><div id="lt3d"></div><div class="lt-info"></div></div></article>
    <div class="lt-nav"><button class="btn-secundario" id="ltPrev">Hito anterior</button><button class="btn-secundario" id="ltNext">Hito siguiente</button></div>
    ${(datos.normas||[]).length?`<h3 class="actv-sub">Las definiciones de consenso</h3>
    <div class="lt-normas">${datos.normas.map(n=>`<div class="lt-norma"><b>${esc(n.codigo)}</b><span>${esc(n.titulo)}</span><p>${esc(n.clave)}</p><p class="dim">${esc(n.alcance)}</p></div>`).join('')}</div>`:''}
    ${(datos.conceptos||[]).length?`<h3 class="actv-sub">Conceptos clave</h3>
    <div class="lt-conceptos">${datos.conceptos.map(c=>`<details><summary>${esc(c.titulo)}</summary>
      <p>${esc(c.definicion)}</p>${c.detalle?`<p class="dim">${esc(c.detalle)}</p>`:''}${c.ejemplo?`<p class="ej"><b>Ejemplo:</b> ${esc(c.ejemplo)}</p>`:''}</details>`).join('')}</div>`:''}`;

  const botones = [...r.querySelectorAll('.lt-hito')], ficha = r.querySelector('.lt-ficha'), info = r.querySelector('.lt-info');
  const visorHito = montarVisor3D(r.querySelector('#lt3d'), escenaHito3D(hitos[0].anio), { camPos:[0.2, 0.9, 3.6] });
  function elegir(k, desplazar=true){
    sel = Math.max(0, Math.min(hitos.length-1, k)); const h = hitos[sel];
    botones.forEach((b,j)=>{ b.classList.toggle('on', j===sel); b.setAttribute('aria-selected', j===sel); });
    if(desplazar) botones[sel].scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
    r.querySelectorAll('.lt-eras .chip').forEach(c=>c.classList.toggle('on', c.dataset.era===h.era));
    ficha.className = `lt-ficha g${genDe(h.generacion)}`;
    visorHito.reemplazar(escenaHito3D(h.anio));
    info.innerHTML = `
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
  let sel = 0, comparar = false, vista = '3d', gen2Modo = 'gen2a', raf = 0;
  const lista = (arr)=> (arr||[]).map(t=>`<li>${esc(t)}</li>`).join('');
  const modoDeSel = () => gens[sel]?.numero===1 ? 'gen1' : gens[sel]?.numero===2 ? gen2Modo : 'gen3';

  function dibujar2D(ts, cv){
    if(!cv || !document.body.contains(cv)){ cancelAnimationFrame(raf); return; }
    const ctx2 = cv.getContext('2d'), t = ts*0.001, W = cv.width, H = cv.height, m = modoDeSel();
    ctx2.fillStyle = '#0B0A24'; ctx2.fillRect(0,0,W,H);
    ctx2.fillStyle = 'rgba(230,215,184,0.16)'; ctx2.fillRect(0,0,W,105);
    ctx2.fillStyle = '#E6D7B8'; ctx2.font = '600 13px Sora, sans-serif';
    ctx2.fillText('TEJIDO HUÉSPED / HUESO VIVO', 16, 24);
    if(m==='gen1'){
      ctx2.fillStyle = '#4A588A'; ctx2.fillRect(0,165,W,95);
      ctx2.fillStyle = '#9FB4FF'; ctx2.fillText('IMPLANTE BIOINERTE (Ti / Al₂O₃)', 16, 238);
      ctx2.fillStyle = 'rgba(255,140,154,0.22)'; ctx2.fillRect(0,110,W,50);
      ctx2.strokeStyle = '#FF9AA5'; ctx2.lineWidth = 2.5;
      for(let row=0;row<3;row++){ ctx2.beginPath(); for(let x=0;x<=W;x+=12){ const y=122+row*13+Math.sin(x*0.04+t*1.5+row)*3; x?ctx2.lineTo(x,y):ctx2.moveTo(x,y); } ctx2.stroke(); }
      ctx2.fillStyle = '#FFB6BE'; ctx2.fillText('Cápsula fibrosa aislante (sin enlace químico)', 16, 140);
    } else if(m==='gen2a'){
      ctx2.fillStyle = '#144D47'; ctx2.fillRect(0,160,W,100);
      ctx2.fillStyle = '#5FF2D2'; ctx2.fillText('VIDRIO BIOACTIVO 45S5 / HA', 16, 238);
      ctx2.fillStyle = 'rgba(95,242,210,0.48)'; ctx2.fillRect(0,136,W,22);
      ctx2.fillStyle = '#0B0A24'; ctx2.font = '700 12px Sora, sans-serif';
      ctx2.fillText('CAPA HCA (enlace químico directo con el hueso)', 16, 151);
      for(let i=0;i<14;i++){ ctx2.fillStyle=i%2?'#FFD98A':'#5FF2D2'; ctx2.beginPath(); ctx2.arc((i*44+t*22)%W, 158-((t*32+i*17)%42), 3.5, 0, 7); ctx2.fill(); }
    } else if(m==='gen2b'){
      const prog = (Math.sin(t*0.8)+1)/2;
      ctx2.fillStyle = 'rgba(230,215,184,0.28)'; ctx2.fillRect(0,105,W,42*prog);
      for(let i=0;i<9;i++){ ctx2.fillStyle='#FFD98A'; ctx2.fillRect(22+i*64, 156+prog*14, Math.max(14,48*(1-prog*0.6)), 54*(1-prog*0.5)); }
      for(let i=0;i<12;i++){ ctx2.fillStyle='#7FB6FF'; ctx2.beginPath(); ctx2.arc((i*50+t*30)%W, 125+Math.sin(t*2+i)*20, 4, 0, 7); ctx2.fill(); }
      ctx2.fillStyle = '#FFD98A'; ctx2.fillText('PLA / PGA: hidrólisis gradual → tejido neoformado ocupa su lugar', 16, 238);
    } else {
      ctx2.strokeStyle = '#9C83FF'; ctx2.lineWidth = 4;
      for(let x=40;x<W;x+=75){ ctx2.beginPath(); ctx2.moveTo(x,110); ctx2.lineTo(x,225); ctx2.stroke(); }
      for(let y=135;y<=205;y+=35){ ctx2.beginPath(); ctx2.moveTo(20,y); ctx2.lineTo(W-20,y); ctx2.stroke(); }
      for(let i=0;i<10;i++){ ctx2.fillStyle='#5FF2D2'; ctx2.beginPath(); ctx2.ellipse(65+(i%5)*105+Math.sin(t+i)*5, 145+Math.floor(i/5)*45+Math.cos(t+i)*4, 15, 8, 0, 0, 7); ctx2.fill(); }
      ctx2.strokeStyle = '#FF7A88'; ctx2.lineWidth = 3; ctx2.beginPath(); ctx2.moveTo(20,105); ctx2.bezierCurveTo(160,175,360,150,W-25,200); ctx2.stroke();
      ctx2.fillStyle = '#D7C6FF'; ctx2.fillText('Scaffold 3D + péptidos RGD + angiogénesis', 16, 244);
    }
    raf = requestAnimationFrame(nt => dibujar2D(nt, cv));
  }

  r.innerHTML = `
    <div class="gn-pasos" role="tablist" aria-label="Generaciones">
      ${gens.map((g,k)=>`<button class="gn-paso g${g.numero}" role="tab" data-k="${k}"><span class="num">${g.numero}</span><span><b>${esc(nombreCorto(g.nombre))}</b><span class="dim">${esc(g.epoca)}</span></span></button>`).join('')}
    </div>
    <div class="gn-barra"><button class="btn-secundario" id="gnComparar" aria-pressed="false">Comparar las tres</button></div>
    <div class="gn-cuerpo" aria-live="polite"></div>`;
  const cuerpo = r.querySelector('.gn-cuerpo'), pasos = [...r.querySelectorAll('.gn-paso')];

  function ficha(){
    cancelAnimationFrame(raf);
    const g = gens[sel];
    cuerpo.innerHTML = `<article class="gn-ficha g${g.numero}">
      <h3>${esc(g.nombre)}</h3>
      <p class="gn-filo">${esc(g.filosofia)}</p>
      <div class="gn-visual">
        <div id="gnStage"></div>
        <div class="gn-visual-bar">
          <div class="gn-chips-modo">${g.numero===2?`
            <button class="chip ${gen2Modo==='gen2a'?'on':''}" data-g2="gen2a">Bioactivo (45S5 → HCA)</button>
            <button class="chip ${gen2Modo==='gen2b'?'on':''}" data-g2="gen2b">Biodegradable (PLA/PGA)</button>`:''}
          </div>
          <div class="gn-chips-modo">
            <button class="chip ${vista==='3d'?'on':''}" data-v="3d">Modelo 3D giratorio</button>
            <button class="chip ${vista==='2d'?'on':''}" data-v="2d">Simulador 2D en vivo</button>
          </div>
        </div>
      </div>
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
    const stage = cuerpo.querySelector('#gnStage');
    if(vista === '3d'){
      montarVisor3D(stage, escenaGen3D(modoDeSel()), { camPos:[0.4,1.1,3.5] });
    } else {
      stage.innerHTML = '<canvas width="580" height="260"></canvas>';
      raf = requestAnimationFrame(ts => dibujar2D(ts, stage.firstElementChild));
    }
    cuerpo.querySelectorAll('[data-v]').forEach(b=>b.addEventListener('click',()=>{ if(vista!==b.dataset.v){ vista=b.dataset.v; ficha(); } }));
    cuerpo.querySelectorAll('[data-g2]').forEach(b=>b.addEventListener('click',()=>{ if(gen2Modo!==b.dataset.g2){ gen2Modo=b.dataset.g2; ficha(); } }));
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
