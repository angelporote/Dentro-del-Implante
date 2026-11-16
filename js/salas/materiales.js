/* =========================================================
   Vitrina 2 · Materiales en bruto y mecánica
   Laboratorio: matraces, máquina de ensayo de tracción y pantalla con la curva σ–ε.
   Cada sala exporta construir(d, ctx): "d" es el grupo 3D detrás de la vitrina y "ctx"
   trae ayudas del pasillo: ctx.sala() (paredes), ctx.luz() (luz de la sala) y ctx.anim()
   (animación que solo se ejecuta cuando la vitrina se ve).
   ========================================================= */
import * as THREE from 'three';
import { mesh, std, basicGlow, bright, canvasPlane } from '../util.js';

// Vidrio ligero (sin "transmission", que obliga a renderizar la escena otra vez y es muy costoso)
const glassPhys = new THREE.MeshPhysicalMaterial({ color:0xEAF6FF, metalness:0, roughness:0.05, transparent:true, opacity:0.28, side:THREE.DoubleSide, depthWrite:false });
function flask(d, x, y, z, liquid, s=0.42){
  const g=new THREE.Group(); g.position.set(x,y,z); g.scale.setScalar(s); d.add(g);
  const prof=[[0,0],[0.55,0],[0.56,0.05],[0.2,0.75],[0.17,1.05],[0.21,1.1]].map(([a,b])=>new THREE.Vector2(a,b));
  mesh(new THREE.LatheGeometry(prof, 40), glassPhys, 0,0,0, g);
  const lq=[[0,0.02],[0.52,0.02],[0.36,0.36],[0,0.36]].map(([a,b])=>new THREE.Vector2(a,b));
  mesh(new THREE.LatheGeometry(lq, 40), basicGlow(liquid, 1.6), 0,0,0, g);
}
export function construir(d, ctx){
  ctx.sala(d, 0x9CCFCB); ctx.luz(d, 0xE8FFFB, 22);
  mesh(new THREE.BoxGeometry(4.9,0.25,1.4), std(0x1E5A5C,{roughness:.4}), 0,-1.35,-4.7, d);
  mesh(new THREE.BoxGeometry(4.9,0.08,0.6), std(0x2E7A7A), 0,1.1,-5.6, d);
  [0x5FF2D2,0xB07AFF,0xFFC86A,0x5FF2D2,0xFF7AA8].forEach((c,i)=>flask(d,-2+i*0.95,1.15,-5.6,c));
  // máquina de ensayo de tracción
  const mx=1.1, mz=-3.7, colM=std(0x6E83C8,{metalness:.8,roughness:.3});
  mesh(new THREE.CylinderGeometry(0.07,0.07,2.7,16), colM, mx-0.55,-0.05,mz, d); mesh(new THREE.CylinderGeometry(0.07,0.07,2.7,16), colM, mx+0.55,-0.05,mz, d);
  mesh(new THREE.BoxGeometry(1.5,0.25,0.4), std(0x8FA2E6,{metalness:.6,roughness:.3}), mx,1.35,mz, d);
  mesh(new THREE.BoxGeometry(1.6,0.3,0.6), std(0x4C5E9C,{metalness:.5}), mx,-1.35,mz, d);
  const cross = mesh(new THREE.BoxGeometry(1.3,0.16,0.32), std(0xA9B8F0,{metalness:.7,roughness:.25}), mx,0.4,mz, d);
  const spec = mesh(new THREE.CylinderGeometry(0.06,0.06,1,24), std(0xF2F2F6,{metalness:.9,roughness:.15}), mx,-0.5,mz, d);
  // pantalla con la curva tensión-deformación dibujándose
  const scr = canvasPlane(1.7, 1.05, 680, 420, (g, w, h, t) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(6,30,34,.92)';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(95,242,210,.15)';
    g.lineWidth = 2;
    for(let i = 1; i < 6; i++){ g.beginPath(); g.moveTo(i * w / 6, 0); g.lineTo(i * w / 6, h); g.stroke(); }
    for(let j = 1; j < 4; j++){ g.beginPath(); g.moveTo(0, j * h / 4); g.lineTo(w, j * h / 4); g.stroke(); }
    const padL = 48, padR = 40, padT = 36, padB = 46;
    g.strokeStyle = 'rgba(127,255,224,.45)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(padL, padT - 10);
    g.lineTo(padL, h - padB);
    g.lineTo(w - padR + 12, h - padB);
    g.stroke();
    g.fillStyle = 'rgba(127,255,224,.92)';
    g.font = '700 32px Sora, sans-serif';
    g.textAlign = 'left';
    g.textBaseline = 'top';
    g.fillText('σ', padL + 14, padT - 14);
    g.textAlign = 'right';
    g.textBaseline = 'bottom';
    g.fillText('ε', w - padR + 14, h - padB - 10);
    const k = (t * 0.25) % 1;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    g.strokeStyle = '#7FFFE0';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(padL, h - padB);
    for(let i = 0; i <= 90 * k; i++){
      const x = i / 90;
      const y = x < .18 ? x / .18 * .7 : .7 + .25 * (1 - Math.pow(1 - (x - .18) / .82, 2)) - (x > .85 ? (x - .85) * 1.2 : 0);
      g.lineTo(padL + x * plotW, h - padB - y * plotH);
    }
    g.stroke();
  });
  scr.position.set(-1.25,0.15,-4.0); d.add(scr);
  ctx.anim(t=>{ const e=(Math.sin(t*0.8)+1)/2; cross.position.y=0.25+e*0.35; spec.scale.y=0.8+e*0.35; spec.position.y=-0.6+e*0.17; if((t*30|0)%3===0) scr.userData.redraw(t); });
}
