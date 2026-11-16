/* =========================================================
   util.js · Utilidades compartidas por todos los módulos
   (estado global, ayudas de modelado 3D, texturas pintadas con código)
   ========================================================= */
import * as THREE from 'three';

export const gsap = window.gsap;                                       // GSAP se carga como script clásico en index.html

// ¿El usuario prefiere menos movimiento? (ajuste de accesibilidad del sistema)
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isMobile = () => innerWidth < 760;
// "Gama baja": móvil o equipo con pocos núcleos / poca memoria → desactivamos lo más costoso
export const gamaBaja = isMobile() || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
export const D = d => reduceMotion ? 0 : d;                            // duración de animación (0 si se pide menos movimiento)
export const rand = (a,b) => a + Math.random()*(b-a);

// Estado global de la web: en qué parte estamos
export const estado = { enPasillo:false, enSala:false, visorAbierto:false };

// Posición del ratón normalizada (-0,5 a 0,5), para efectos de paralaje
export const puntero = { x:0, y:0 };
addEventListener('pointermove', e=>{ puntero.x=e.clientX/innerWidth-0.5; puntero.y=e.clientY/innerHeight-0.5; });

// ---- Ayudas de modelado ----
export function mesh(geo, mat, x=0,y=0,z=0, parent){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); parent&&parent.add(m); return m; }
export const std = (color, o={}) => new THREE.MeshStandardMaterial({ color, roughness:0.6, metalness:0.1, ...o });
export const bright = (hex, k) => new THREE.Color(hex).multiplyScalar(k);                       // colores > 1: brillan con el bloom
export const basicGlow = (hex,k=2) => new THREE.MeshBasicMaterial({ color:bright(hex,k), toneMapped:false });
// Rectángulo con esquinas redondeadas (como forma 2D para extruir o recortar)
export function rrect(w,h,r,cy=0){ const s=new THREE.Shape(), x=-w/2, y=-h/2+cy;
  s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y); return s; }
// Casquete esférico hueco: se genera girando un perfil 2D (LatheGeometry)
export function shell(rIn, rOut, seg=96){
  const pts=[];
  for(let i=0;i<=24;i++){ const a=i/24*Math.PI/2; pts.push(new THREE.Vector2(Math.sin(a)*rOut, Math.cos(a)*rOut)); }
  for(let i=24;i>=0;i--){ const a=i/24*Math.PI/2; pts.push(new THREE.Vector2(Math.sin(a)*rIn, Math.cos(a)*rIn)); }
  pts.push(pts[0].clone());
  return new THREE.LatheGeometry(pts, seg);
}

// ---- Texturas pintadas con código en un <canvas> ----
export function canvasTex(w,h,draw){
  const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
// Pantalla: un plano con una textura de canvas que se puede repintar (redraw) cuando haga falta
export function canvasPlane(w,h,pw,ph,draw){
  const c=document.createElement('canvas'); c.width=pw; c.height=ph; const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ map:tex, transparent:true, toneMapped:false }));
  m.userData.redraw=(t)=>{ draw(c.getContext('2d'),pw,ph,t); tex.needsUpdate=true; }; m.userData.redraw(0); return m;
}
