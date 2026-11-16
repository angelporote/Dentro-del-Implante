/* =========================================================
   Vitrina 3 · Superficies, células y osteointegración
   Microscopía: células flotando sobre la superficie de un implante cubierta de proteínas.
   Cada sala exporta construir(d, ctx): "d" es el grupo 3D detrás de la vitrina y "ctx"
   trae ayudas del pasillo: ctx.sala() (paredes), ctx.luz() (luz de la sala) y ctx.anim()
   (animación que solo se ejecuta cuando la vitrina se ve).
   ========================================================= */
import * as THREE from 'three';
import { mesh, std, basicGlow, bright, canvasPlane } from '../util.js';

export function construir(d, ctx){
  ctx.sala(d, 0x0B1A44); ctx.luz(d, 0x7AA2FF, 20);
  mesh(new THREE.BoxGeometry(5.4,0.5,4.4), std(0x8FA6E0,{metalness:.9,roughness:.35}), 0,-1.95,-3.2, d);
  // proteínas sobre la superficie
  const prot = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06,10,8), new THREE.MeshStandardMaterial({ roughness:.4 }), 120);
  const mtx=new THREE.Matrix4(), cols=[0x5FF2D2,0xFFD98A,0xD7C6FF].map(c=>new THREE.Color(c));
  for(let i=0;i<120;i++){ mtx.setPosition(-2.5+Math.random()*5, -1.66, -1.2-Math.random()*4); prot.setMatrixAt(i,mtx); prot.setColorAt(i, cols[i%3]); }
  d.add(prot);
  const cellMat = new THREE.MeshPhysicalMaterial({ color:0xD6E6FF, roughness:0.35, transparent:true, opacity:0.82, clearcoat:0.6, emissive:0x10204A });
  const cells=[];
  [[-1.4,-0.3,-3.2,0.55,0x7A4FA6],[0.6,0.5,-4.1,0.7,0x2E64A8],[1.7,-0.6,-2.8,0.42,0x7A4FA6],[-0.3,0.9,-2.4,0.32,0x5FF2D2]].forEach(([x,y,z,r,nc],i)=>{
    const c=mesh(new THREE.SphereGeometry(r,48,32), cellMat, x,y,z, d);
    mesh(new THREE.SphereGeometry(r*0.42,24,16), basicGlow(nc,1.2), 0,0,0, c);
    cells.push({c,x,y,i});
  });
  const pts=new Float32Array(300*3); for(let i=0;i<300;i++){ pts[i*3]=-2.6+Math.random()*5.2; pts[i*3+1]=-1.5+Math.random()*3.6; pts[i*3+2]=-0.4-Math.random()*5.6; }
  const dustM=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(pts,3)), new THREE.PointsMaterial({ color:bright(0xA9C4FF,1.4), size:0.035, transparent:true, opacity:.8, depthWrite:false, toneMapped:false }));
  d.add(dustM);
  ctx.anim(t=>{ cells.forEach(({c,x,y,i})=>{ c.position.y=y+Math.sin(t*0.7+i)*0.12; c.position.x=x+Math.sin(t*0.4+i*2)*0.08;
    c.scale.set(1+Math.sin(t*1.3+i)*0.05, 1+Math.sin(t*1.1+i+1)*0.06, 1+Math.sin(t*0.9+i+2)*0.05); }); dustM.rotation.y=Math.sin(t*0.1)*0.1; });
}
