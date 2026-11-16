/* =========================================================
   Vitrina 4 · Implantes I: cadera, rodilla, columna y dental
   Quirófano: lámpara con su haz de luz, mesa de operaciones y monitor con ECG.
   Cada sala exporta construir(d, ctx): "d" es el grupo 3D detrás de la vitrina y "ctx"
   trae ayudas del pasillo: ctx.sala() (paredes), ctx.luz() (luz de la sala) y ctx.anim()
   (animación que solo se ejecuta cuando la vitrina se ve).
   ========================================================= */
import * as THREE from 'three';
import { mesh, std, basicGlow, bright, canvasPlane } from '../util.js';

export function construir(d, ctx){
  ctx.sala(d, 0x6FB3A8); ctx.luz(d, 0xF2FFFC, 18);
  const lamp=new THREE.Group(); lamp.position.set(0,1.75,-3.1); d.add(lamp);
  mesh(new THREE.CylinderGeometry(0.04,0.04,1,8), std(0x9FCFC8,{metalness:.8}), 0,0.55,0, lamp);
  mesh(new THREE.TorusGeometry(0.72,0.09,16,48), std(0xB8E6DF,{metalness:.7,roughness:.25}), 0,0,0, lamp).rotation.x=Math.PI/2;
  mesh(new THREE.CircleGeometry(0.66,48), basicGlow(0xF4FFFC,3), 0,-0.02,0, lamp).rotation.x=Math.PI/2;
  const beam = mesh(new THREE.ConeGeometry(1.7,3.0,40,1,true), new THREE.MeshBasicMaterial({ color:0xE9FFF8, transparent:true, opacity:0.07, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide }), 0,0.25,-3.1, d);
  mesh(new THREE.BoxGeometry(3.0,0.18,1.15), std(0x8FC9C2,{metalness:.5,roughness:.3}), 0,-1.05,-3.1, d);
  mesh(new THREE.CylinderGeometry(0.15,0.25,1.2,16), std(0x5C8C88,{metalness:.6}), 0,-1.75,-3.1, d);
  mesh(new THREE.BoxGeometry(2.6,0.22,1.05), std(0x2F8A80,{roughness:.9}), 0.15,-0.85,-3.1, d);
  mesh(new THREE.SphereGeometry(0.2,24,16), std(0xE6D7B8), -1.2,-0.72,-3.1, d);
  mesh(new THREE.BoxGeometry(1.1,0.75,0.08), std(0x0A1E1C,{metalness:.4}), 1.95,0.55,-4.4, d);
  const ecg = canvasPlane(1.0,0.65,260,170,(g,w,h,t)=>{ g.fillStyle='#04201C'; g.fillRect(0,0,w,h); g.strokeStyle='#5FF2D2'; g.lineWidth=4; g.beginPath();
    for(let x=0;x<=w;x+=4){ const ph=((x/w)*2 - t*0.6)%1, p=(ph+1)%1; let y=h*0.6; if(p>.45&&p<.5)y-=h*.42; else if(p>.5&&p<.54)y+=h*.2; else if(p>.6&&p<.7)y-=h*.08; x?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); });
  ecg.position.set(1.95,0.55,-4.35); d.add(ecg);
  ctx.anim(t=>{ beam.material.opacity=0.06+Math.sin(t*1.5)*0.012; if((t*30|0)%2===0) ecg.userData.redraw(t); });
}
