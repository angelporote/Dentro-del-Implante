/* =========================================================
   Vitrina 6 · Validación, ensayos y normativa
   Sala de ensayos y certificación: archivo de normas, máquina de fatiga en marcha, placas de cultivo y el marcado CE.
   construir(d, ctx): "d" es el grupo 3D detrás de la vitrina; ctx.sala() pone paredes,
   ctx.luz() la luz de la sala y ctx.anim() animaciones que solo corren si la vitrina se ve.
   ========================================================= */
import * as THREE from 'three';
import { mesh, std, basicGlow, canvasPlane } from '../util.js';


const bookCols = [0x1F6FB2,0xE5484D,0x23A894,0xF2B21B,0x7A4FA6].map(c=>std(c,{roughness:.6}));
const bookGeo = new THREE.BoxGeometry(0.2,0.5,0.4);
const dishMat = new THREE.MeshStandardMaterial({ color:0xFFFFFF, transparent:true, opacity:0.4, roughness:0.1 });
const dishGeo = new THREE.CylinderGeometry(0.16,0.16,0.04,20);
const agarGeo = new THREE.CylinderGeometry(0.14,0.14,0.02,20);
const agarOk = std(0xF29BB5,{roughness:.3});
const agarWarn = std(0xF4D35E,{roughness:.3});

export function construir(d, ctx){
  ctx.sala(d, 0xD8DEE6); ctx.luz(d, 0xFFFFFF, 18);
  // Estantería con archivadores de colores (normas)
  mesh(new THREE.BoxGeometry(2.4,0.06,0.5), std(0x8A95A3), -1.4,1.2,-5.7, d);
  mesh(new THREE.BoxGeometry(2.4,0.06,0.5), std(0x8A95A3), -1.4,0.5,-5.7, d);
  for(let f=0;f<2;f++) for(let i=0;i<9;i++) mesh(bookGeo, bookCols[(i+f*2)%5], -2.45+i*0.25,0.78+f*0.7,-5.7, d);
  // Carteles: marcado CE e ISO 10993
  const ce = canvasPlane(0.9, 0.6, 720, 480, (g, w, h) => {
    g.fillStyle = '#0E2433';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#5FF2D2';
    g.font = '800 280px Sora, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('CE', w / 2, h / 2 - 28);
    let tamSub = 50;
    g.font = `600 ${tamSub}px Sora, sans-serif`;
    while(tamSub > 24 && g.measureText('MDR (UE) 2017/745').width > w - 64){
      tamSub -= 2;
      g.font = `600 ${tamSub}px Sora, sans-serif`;
    }
    g.fillText('MDR (UE) 2017/745', w / 2, h - 62);
  });
  ce.position.set(1.0, 1.25, -6.1); d.add(ce);
  const iso = canvasPlane(0.9, 0.6, 720, 480, (g, w, h) => {
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1C2B3A';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let tamTit = 108;
    g.font = `700 ${tamTit}px Sora, sans-serif`;
    while(tamTit > 48 && g.measureText('ISO 10993').width > w - 64){
      tamTit -= 2;
      g.font = `700 ${tamTit}px Sora, sans-serif`;
    }
    g.fillText('ISO 10993', w / 2, 148);
    let tamTxt = 48;
    const lineas = ['Evaluación biológica', 'ISO 14971 · ISO 13485'];
    g.font = `400 ${tamTxt}px Sora, sans-serif`;
    while(tamTxt > 24 && Math.max(...lineas.map(s => g.measureText(s).width)) > w - 64){
      tamTxt -= 2;
      g.font = `400 ${tamTxt}px Sora, sans-serif`;
    }
    g.fillText(lineas[0], w / 2, 276);
    g.fillText(lineas[1], w / 2, 366);
  });
  iso.material.toneMapped = true; iso.position.set(2.05, 1.25, -6.1); d.add(iso);
  document.fonts?.ready?.then(() => { ce.userData.redraw(0); iso.userData.redraw(0); });
  // Máquina de ensayo de fatiga: el actuador sube y baja sin parar (millones de ciclos)
  const mx=1.35, mz=-3.6, colM=std(0x6E83C8,{metalness:.8,roughness:.3});
  for(const dx of [-0.45,0.45]) mesh(new THREE.CylinderGeometry(0.06,0.06,2.4,16), colM, mx+dx,-0.2,mz, d);
  mesh(new THREE.BoxGeometry(1.2,0.22,0.35), std(0x8FA2E6,{metalness:.6,roughness:.3}), mx,1.05,mz, d);
  mesh(new THREE.BoxGeometry(1.3,0.3,0.55), std(0x4C5E9C,{metalness:.5}), mx,-1.4,mz, d);
  const act=mesh(new THREE.CylinderGeometry(0.08,0.08,0.5,16), std(0xD8DDE8,{metalness:.9,roughness:.2}), mx,-0.9,mz, d);
  const probeta=mesh(new THREE.BoxGeometry(0.14,0.6,0.14), std(0xE4E7EE,{metalness:1,roughness:.3}), mx,-0.3,mz, d);
  const contador = canvasPlane(0.8, 0.3, 640, 240, (g, w, h, t) => {
    g.fillStyle = '#03140F';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#5FF2D2';
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    const num = String(Math.floor(t * 15)).padStart(7, '0');
    let tamNum = 86;
    g.font = `700 ${tamNum}px Sora, sans-serif`;
    while(tamNum > 40 && g.measureText(num).width > w - 68){
      tamNum -= 2;
      g.font = `700 ${tamNum}px Sora, sans-serif`;
    }
    g.fillText(num, 34, 92);
    let tamLbl = 42;
    g.font = `400 ${tamLbl}px Sora, sans-serif`;
    while(tamLbl > 20 && g.measureText('ciclos · ISO 7206').width > w - 68){
      tamLbl -= 2;
      g.font = `400 ${tamLbl}px Sora, sans-serif`;
    }
    g.fillText('ciclos · ISO 7206', 36, 184);
  });
  contador.position.set(mx,0.55,mz+0.2); d.add(contador);
  // Mesa de laboratorio con placas de cultivo (citotoxicidad)
  mesh(new THREE.BoxGeometry(2.2,0.08,1.0), std(0xF2F4F6,{roughness:.4}), -1.1,-1.0,-3.4, d);
  for(let i=0;i<5;i++){ mesh(dishGeo, dishMat, -1.9+i*0.4,-0.93,-3.3, d);
    mesh(agarGeo, i===3?agarWarn:agarOk, -1.9+i*0.4,-0.94,-3.3, d); }
  ctx.anim(t=>{ const y=Math.sin(t*6)*0.05; act.position.y=-0.9+y; probeta.scale.y=1+y*0.15; if((t*20|0)%3===0) contador.userData.redraw(t); });
}
