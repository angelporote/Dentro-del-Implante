/* =========================================================
   Vitrina 5 · Implantes II: cardiología, oftalmología y tejidos blandos
   Vitrina con cuatro pedestales: stent, válvula cardiaca, marcapasos con su cable y lente intraocular.
   construir(d, ctx): "d" es el grupo 3D detrás de la vitrina; ctx.sala() pone paredes,
   ctx.luz() la luz de la sala y ctx.anim() animaciones que solo corren si la vitrina se ve.
   ========================================================= */
import * as THREE from 'three';
import { mesh, std, basicGlow, canvasPlane } from '../util.js';

// Pedestal de museo con foco cenital
function pedestal(d, x, z=-3.8){
  mesh(new THREE.CylinderGeometry(0.38,0.42,1.4,32), std(0x3A2F6E,{roughness:.35,metalness:.3}), x,-1.45,z, d);
  mesh(new THREE.CylinderGeometry(0.39,0.39,0.03,32), basicGlow(0xFFD58A,1.8), x,-0.74,z, d);
  mesh(new THREE.ConeGeometry(0.7,2.6,32,1,true), new THREE.MeshBasicMaterial({ color:0xFFE2A8, transparent:true, opacity:0.06, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide }), x,0.55,z, d);
  const g=new THREE.Group(); g.position.set(x,-0.25,z); d.add(g); return g;
}
// Placa con texto pintado
function placa(d, texto, x, y, z, w=0.5){ const p=canvasPlane(w,0.16,320,100,(g,W,H)=>{ g.fillStyle='#F4EBD8'; g.fillRect(0,0,W,H); g.fillStyle='#3A2F1E'; g.font='700 46px Sora, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(texto,W/2,H/2); });
  p.material.toneMapped=true; p.position.set(x,y,z); d.add(p); return p; }

export function construir(d, ctx){
  ctx.sala(d, 0x3A1A2E); ctx.luz(d, 0xFFC2C8, 16);
  const metal=new THREE.MeshPhysicalMaterial({ color:0xD8DDE8, metalness:1, roughness:0.18 });
  const ps=[-1.8,-0.6,0.6,1.8].map(x=>pedestal(d,x));
  // stent (malla)
  mesh(new THREE.CylinderGeometry(0.15,0.15,0.6,12,7,true), new THREE.MeshStandardMaterial({ color:0xE0E5F0, metalness:1, roughness:.2, wireframe:true }), 0,0,0, ps[0]);
  // válvula: anillo de sutura y tres velos
  mesh(new THREE.TorusGeometry(0.17,0.03,12,40), std(0xEDE6D6,{roughness:.9}), 0,0,0, ps[1]).rotation.x=Math.PI/2;
  for(let k=0;k<3;k++){ const a=k*2*Math.PI/3; const v=mesh(new THREE.CircleGeometry(0.16,24,a,2*Math.PI/3), new THREE.MeshPhysicalMaterial({ color:0xF0D8BC, roughness:.55, sheen:.6, side:THREE.DoubleSide }), 0,0.01,0, ps[1]); v.rotation.x=-Math.PI/2+0.25; }
  // marcapasos con su cable
  const pm=mesh(new THREE.CapsuleGeometry(0.17,0.12,8,24), metal, 0,0.05,0, ps[2]); pm.scale.z=0.38;
  const cable=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-0.12,0),new THREE.Vector3(0.14,-0.3,0.04),new THREE.Vector3(-0.08,-0.42,0),new THREE.Vector3(0.04,-0.48,0)]);
  mesh(new THREE.TubeGeometry(cable,30,0.016,8), basicGlow(0x9FB4FF,1.3), 0,0,0, ps[2]);
  // lente intraocular: óptica transparente y dos hápticos curvos
  const lente=new THREE.Group(); ps[3].add(lente); lente.rotation.x=1.2;
  mesh(new THREE.SphereGeometry(0.13,32,16), new THREE.MeshPhysicalMaterial({ color:0xEAF6FF, roughness:0.02, transparent:true, opacity:0.55, clearcoat:1 }), 0,0,0, lente).scale.z=0.3;
  for(const sgn of [-1,1]){ const c=new THREE.EllipseCurve(0,0,0.24,0.24, sgn>0?0:Math.PI, (sgn>0?0:Math.PI)+1.6);
    const pts=c.getPoints(20).map(p=>new THREE.Vector3(p.x,p.y,0)); mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,0.01,6), std(0x9FB4FF), 0,0,0, lente); }
  ctx.anim(t=>{ ps.forEach((g,i)=>{ g.rotation.y=t*0.5+i; g.position.y=-0.25+Math.sin(t+i)*0.04; }); });
}
