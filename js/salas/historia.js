/* =========================================================
   Vitrina 1 · Historia y definiciones
   Galería de museo: una línea temporal en la pared y las tres generaciones de biomateriales en pedestales.
   construir(d, ctx): "d" es el grupo 3D detrás de la vitrina; ctx.sala() pone paredes,
   ctx.luz() la luz de la sala y ctx.anim() animaciones que solo corren si la vitrina se ve.
   ========================================================= */
import * as THREE from 'three';
import { mesh, std, basicGlow, canvasPlane } from '../util.js';

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
