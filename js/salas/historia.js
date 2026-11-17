/* =========================================================
   Vitrina 1 · Historia y definiciones
   Galería de museo: una línea temporal en la pared y las tres generaciones de biomateriales en pedestales.
   construir(d, ctx): "d" es el grupo 3D detrás de la vitrina; ctx.sala() pone paredes,
   ctx.luz() la luz de la sala y ctx.anim() animaciones que solo corren si la vitrina se ve.
   ========================================================= */
import * as THREE from 'three';
import { mesh, std, basicGlow, canvasPlane, canvasTex, reduceMotion } from '../util.js';
import { esc, el, barajar, sinDatos, raiz } from '../ui.js';
import { montarVisor3D } from '../visor3d.js';

/* =========================================================
   Texturas procedimentales y materiales PBR compartidos
   ========================================================= */
function crearRng(seed = 1){
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

let texHueso = null;
let texHuesoBump = null;
let texTejido = null;
let texMetalCepillado = null;
let texIris = null;
let texPiel = null;
let texturasListas = false;

// Materiales PBR de estudio calibrados (las texturas se enlazan perezosamente en asegurarTexturas() para no bloquear el arranque)
const matTi = new THREE.MeshPhysicalMaterial({ color:0xD4DCE8, metalness:0.95, roughness:0.2, clearcoat:0.22, bumpScale:0.008 });
const matCoCr = new THREE.MeshPhysicalMaterial({ color:0xE8EEF6, metalness:0.98, roughness:0.08, clearcoat:0.4, clearcoatRoughness:0.05 });
const matOro = new THREE.MeshPhysicalMaterial({ color:0xFFD278, metalness:0.95, roughness:0.16, clearcoat:0.25 });
const matHierroOx = new THREE.MeshPhysicalMaterial({ color:0x5F4239, metalness:0.52, roughness:0.82, bumpScale:0.025 });
const matHerrumbre = new THREE.MeshStandardMaterial({ color:0x9B3C26, roughness:0.94, metalness:0.06, bumpScale:0.03 });
const matHuesoCort = new THREE.MeshPhysicalMaterial({ color:0xEFE2C6, roughness:0.56, metalness:0.02, bumpScale:0.016, clearcoat:0.1, side:THREE.DoubleSide });
const matHuesoTrab = new THREE.MeshPhysicalMaterial({ color:0xC99F78, roughness:0.86, bumpScale:0.042, side:THREE.DoubleSide });
const matEncia = new THREE.MeshPhysicalMaterial({ color:0xD86C82, roughness:0.4, clearcoat:0.36, sheen:0.45, sheenColor:0xFFB8C6 });
const matCiliar = new THREE.MeshPhysicalMaterial({ color:0xC85A72, roughness:0.44, clearcoat:0.32, sheen:0.42, sheenColor:0xFFB8C6, side:THREE.DoubleSide });
const matEsmalte = new THREE.MeshPhysicalMaterial({ color:0xF9F4E8, roughness:0.12, clearcoat:0.9, clearcoatRoughness:0.08 });
const matNacar = new THREE.MeshPhysicalMaterial({ color:0xF4F8FF, roughness:0.1, metalness:0.16, clearcoat:1, clearcoatRoughness:0.04, sheen:0.95, sheenColor:0x7FF5DF, emissive:0x144A44, emissiveIntensity:0.22 });
const matVidrioBio = new THREE.MeshPhysicalMaterial({ color:0x5FF2D2, roughness:0.06, metalness:0.04, ior:1.52, clearcoat:1, transparent:true, opacity:0.76, emissive:0x0A4B42, emissiveIntensity:0.24 });
const matVidrioClaro = new THREE.MeshPhysicalMaterial({ color:0xE6F7FF, roughness:0.04, metalness:0.02, ior:1.5, clearcoat:1, transparent:true, opacity:0.32, side:THREE.DoubleSide, depthWrite:false });
const matHCA = new THREE.MeshPhysicalMaterial({ color:0x9FFAE5, roughness:0.22, metalness:0.05, clearcoat:0.65, emissive:0x1A7C6A, emissiveIntensity:0.34 });
const matPMMA = new THREE.MeshPhysicalMaterial({ color:0xD8F6FF, roughness:0.03, metalness:0.02, ior:1.49, clearcoat:1, clearcoatRoughness:0.02, transparent:true, opacity:0.72, side:THREE.DoubleSide });
const matCemento = new THREE.MeshPhysicalMaterial({ color:0xECE0B2, roughness:0.46, clearcoat:0.2, bumpScale:0.008, side:THREE.DoubleSide });
const matUHMWPE = new THREE.MeshPhysicalMaterial({ color:0xF7F3E8, roughness:0.22, clearcoat:0.36, sheen:0.4, sheenColor:0xFFF8E6, side:THREE.DoubleSide });
const matPyC = new THREE.MeshPhysicalMaterial({ color:0x222734, metalness:0.72, roughness:0.07, clearcoat:0.96, clearcoatRoughness:0.03 });
const matTejido = new THREE.MeshPhysicalMaterial({ color:0xF2ECDE, roughness:0.84, bumpScale:0.015, sheen:0.42, sheenColor:0xFFFFFF, side:THREE.DoubleSide });
const matSilicona = new THREE.MeshPhysicalMaterial({ color:0xF47C8C, roughness:0.26, clearcoat:0.5, sheen:0.35, sheenColor:0xFFC2CA });
const matEpoxi = new THREE.MeshPhysicalMaterial({ color:0xE89D3C, roughness:0.07, ior:1.54, clearcoat:1, transparent:true, opacity:0.48, side:THREE.DoubleSide });
const matPLA = new THREE.MeshPhysicalMaterial({ color:0xF5C972, roughness:0.28, clearcoat:0.42, transparent:true, opacity:0.9 });
const matScaffold = new THREE.MeshPhysicalMaterial({ color:0xB6A4FF, roughness:0.38, clearcoat:0.28, sheen:0.32, sheenColor:0xDFD6FF });
const matVaso = new THREE.MeshPhysicalMaterial({ color:0xD9435A, roughness:0.34, clearcoat:0.46, sheen:0.4, sheenColor:0xFF9AA8, side:THREE.DoubleSide });
const matFibroso = new THREE.MeshPhysicalMaterial({ color:0xFF8396, roughness:0.48, transparent:true, opacity:0.48, side:THREE.DoubleSide });
const matColageno = new THREE.MeshPhysicalMaterial({ color:0xFFE2B8, roughness:0.42, sheen:0.45, sheenColor:0xFFF4E0 });
const matLino = new THREE.MeshStandardMaterial({ color:0xE7D4A6, roughness:0.76 });
const matDermis = new THREE.MeshPhysicalMaterial({ color:0xB66C79, roughness:0.6, clearcoat:0.28, sheen:0.4, sheenColor:0xEBAAB4, bumpScale:0.01 });
const matSubcut = new THREE.MeshPhysicalMaterial({ color:0xE0B06A, roughness:0.72, bumpScale:0.025 });
const matPGA = new THREE.MeshPhysicalMaterial({ color:0xB48AFF, roughness:0.32, clearcoat:0.35 });
const matHapt = new THREE.MeshPhysicalMaterial({ color:0x5AA0FF, roughness:0.16, clearcoat:0.85 });
const matAteroma = new THREE.MeshPhysicalMaterial({ color:0xF0C858, roughness:0.52, clearcoat:0.24, bumpScale:0.02, side:THREE.DoubleSide });
const matMembrana = new THREE.MeshPhysicalMaterial({ color:0xD8ECFF, roughness:0.24, clearcoat:0.7, transparent:true, opacity:0.86 });
const matNucleo = basicGlow(0x5FF2D2, 1.35);
const matIris = new THREE.MeshPhysicalMaterial({ roughness:0.52, side:THREE.DoubleSide });
const matEsclera = new THREE.MeshPhysicalMaterial({ color:0xEAE4F6, roughness:0.38, clearcoat:0.38, side:THREE.DoubleSide });
const matHidrogel = new THREE.MeshPhysicalMaterial({ color:0x8BF6EB, roughness:0.04, ior:1.43, clearcoat:1, transparent:true, opacity:0.62, side:THREE.DoubleSide });
const matNanoExt = new THREE.MeshPhysicalMaterial({ color:0x7B68EE, roughness:0.22, clearcoat:0.7, transparent:true, opacity:0.86, side:THREE.DoubleSide });
const matCelofan = new THREE.MeshPhysicalMaterial({ color:0xFF6B7E, roughness:0.16, clearcoat:0.85, transparent:true, opacity:0.86 });
// Materiales añadidos en la TAREA 01 (modelos de hitos y pedestales)
const matPlatino = new THREE.MeshPhysicalMaterial({ color:0xB9C2D0, metalness:1, roughness:0.18, clearcoat:0.5 });
const matSilastic = new THREE.MeshPhysicalMaterial({ color:0xEDE3CF, roughness:0.32, clearcoat:0.55, sheen:0.3, sheenColor:0xFFF6E2 });
const matAdventicia = new THREE.MeshPhysicalMaterial({ color:0xE9B9A6, roughness:0.62, sheen:0.4, sheenColor:0xFFE0D2, bumpScale:0.012, side:THREE.DoubleSide });
const matMedia = new THREE.MeshPhysicalMaterial({ color:0xC8455A, roughness:0.42, clearcoat:0.3, sheen:0.35, sheenColor:0xFF9AA8, side:THREE.DoubleSide });
const matIntima = new THREE.MeshPhysicalMaterial({ color:0xF6D6D8, roughness:0.18, clearcoat:0.8, side:THREE.DoubleSide });
const matLipido = new THREE.MeshPhysicalMaterial({ color:0xEFC56A, roughness:0.46, clearcoat:0.3, bumpScale:0.03, side:THREE.DoubleSide });
const matCalcio = new THREE.MeshPhysicalMaterial({ color:0xF7F3EA, roughness:0.5, clearcoat:0.2 });
const matCoral = new THREE.MeshPhysicalMaterial({ color:0xFF6F61, roughness:0.3, clearcoat:0.5, emissive:0x5A1410, emissiveIntensity:0.55 });
const matVenosa = new THREE.MeshPhysicalMaterial({ color:0x7A2140, roughness:0.3, clearcoat:0.6 });
const matDializado = new THREE.MeshPhysicalMaterial({ color:0xBFE6F2, roughness:0.05, ior:1.33, clearcoat:1, transparent:true, opacity:0.45, depthWrite:false, side:THREE.DoubleSide });
const matCabezaLip = new THREE.MeshPhysicalMaterial({ color:0x8F7BFF, roughness:0.28, clearcoat:0.6, side:THREE.DoubleSide });
const matColaLip = new THREE.MeshPhysicalMaterial({ color:0xF3E2B0, roughness:0.5, side:THREE.DoubleSide });
const matBaseA = new THREE.MeshPhysicalMaterial({ color:0xFF8FA3, roughness:0.3, clearcoat:0.5 });
const matBaseB = new THREE.MeshPhysicalMaterial({ color:0x8FD3FF, roughness:0.3, clearcoat:0.5 });
const matPLAPlaca = new THREE.MeshPhysicalMaterial({ color:0xE2A63C, roughness:0.22, clearcoat:0.7, transparent:true, opacity:0.92 });
const matEPTFE = new THREE.MeshPhysicalMaterial({ color:0xF8F8FA, roughness:0.7, bumpScale:0.01, transparent:true, opacity:0.62, side:THREE.DoubleSide, depthWrite:false });
const matHCAFrente = new THREE.MeshPhysicalMaterial({ color:0xB8FFF0, roughness:0.15, metalness:0.05, clearcoat:0.9, emissive:0x2FD6B4, emissiveIntensity:0.85 });
const matPCB = new THREE.MeshStandardMaterial({ color:0x1E5448, roughness:0.6 });
const matCeramica = new THREE.MeshPhysicalMaterial({ color:0x2A2A30, roughness:0.4, metalness:0.2 });

[
  matTi, matCoCr, matOro, matHierroOx, matHerrumbre, matHuesoCort, matHuesoTrab, matEncia, matCiliar, matEsmalte,
  matNacar, matVidrioBio, matVidrioClaro, matHCA, matPMMA, matCemento, matUHMWPE, matPyC, matTejido, matSilicona,
  matEpoxi, matPLA, matScaffold, matVaso, matFibroso, matColageno, matLino, matDermis, matSubcut, matPGA, matHapt,
  matAteroma, matMembrana, matNucleo, matIris, matEsclera, matHidrogel, matNanoExt, matCelofan, matPlatino, matSilastic,
  matAdventicia, matMedia, matIntima, matLipido, matCalcio, matCoral, matVenosa, matDializado, matCabezaLip, matColaLip,
  matBaseA, matBaseB, matPLAPlaca, matEPTFE, matHCAFrente, matPCB, matCeramica
].forEach(m => { m.userData.compartido = true; });

export function asegurarTexturas(){
  if(texturasListas) return;
  texturasListas = true;

  {
    const rng = crearRng(101);
    texHueso = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#EAE0C6'; g.fillRect(0, 0, w, h);
      for(let i = 0; i < 1200; i++){
        const y = rng() * h, len = 20 + rng() * 140;
        g.fillStyle = rng() > 0.45 ? 'rgba(255,252,242,0.16)' : 'rgba(165,134,92,0.15)';
        g.fillRect(rng() * w, y, len, 1.5);
      }
      for(let i = 0; i < 650; i++){
        const x = rng() * w, y = rng() * h, r = 1.2 + rng() * 5;
        g.fillStyle = 'rgba(135,102,68,0.16)';
        g.beginPath(); g.ellipse(x, y, r * 1.5, r * 0.75, rng() * 0.6, 0, Math.PI * 2); g.fill();
      }
    });
    texHueso.colorSpace = THREE.SRGBColorSpace;
    texHueso.repeat.set(1.5, 1.5);
  }
  {
    const rng = crearRng(202);
    texHuesoBump = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#848484'; g.fillRect(0, 0, w, h);
      for(let i = 0; i < 950; i++){
        const x = rng() * w, y = rng() * h, r = 2 + rng() * 9;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, '#222222'); gr.addColorStop(0.65, '#686868'); gr.addColorStop(1, 'rgba(160,160,160,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    });
    texHuesoBump.repeat.set(1.5, 1.5);
  }
  {
    const rng = crearRng(303);
    texTejido = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#EFE9DA'; g.fillRect(0, 0, w, h);
      for(let y = 0; y < h; y += 6){
        for(let x = 0; x < w; x += 6){
          const alt = ((x / 6 + y / 6) | 0) % 2;
          g.fillStyle = alt ? 'rgba(255,255,255,0.32)' : 'rgba(118,104,84,0.2)';
          g.fillRect(x, y, 5, 3);
          g.fillStyle = alt ? 'rgba(118,104,84,0.16)' : 'rgba(255,255,255,0.24)';
          g.fillRect(x + 1, y + 3, 4, 3);
        }
      }
      for(let i = 0; i < 700; i++){
        g.fillStyle = `rgba(80,70,58,${rng() * 0.08})`;
        g.fillRect(rng() * w, rng() * h, 2, 2);
      }
    });
    texTejido.colorSpace = THREE.SRGBColorSpace;
    texTejido.repeat.set(5, 4);
  }
  {
    const rng = crearRng(404);
    texMetalCepillado = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#D8E0EB'; g.fillRect(0, 0, w, h);
      for(let i = 0; i < 1800; i++){
        const y = rng() * h, alpha = 0.04 + rng() * 0.13;
        g.fillStyle = rng() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(104,118,142,${alpha})`;
        g.fillRect(0, y, w, 1);
      }
    });
    texMetalCepillado.colorSpace = THREE.SRGBColorSpace;
    texMetalCepillado.repeat.set(2, 2);
  }
  {
    const rng = crearRng(505);
    texIris = canvasTex(512, 512, (g, w, h) => {
      const cx = w / 2, cy = h / 2;
      g.fillStyle = '#1B3F60'; g.fillRect(0, 0, w, h);
      const gr = g.createRadialGradient(cx, cy, 48, cx, cy, 256);
      gr.addColorStop(0, '#58B6C8'); gr.addColorStop(0.28, '#2F799E'); gr.addColorStop(0.75, '#1D496E'); gr.addColorStop(1, '#0F223A');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for(let i = 0; i < 320; i++){
        const a = (i / 320) * Math.PI * 2 + (rng() - 0.5) * 0.03;
        g.strokeStyle = rng() > 0.42 ? 'rgba(150,232,245,0.32)' : 'rgba(10,24,46,0.38)';
        g.lineWidth = 1.4 + rng() * 2;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62);
        g.lineTo(cx + Math.cos(a) * 246, cy + Math.sin(a) * 246);
        g.stroke();
      }
    });
    texIris.colorSpace = THREE.SRGBColorSpace;
  }
  {
    const rng = crearRng(606);
    texPiel = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#B8727E'; g.fillRect(0, 0, w, h);
      for(let i = 0; i < 1200; i++){
        const x = rng() * w, y = rng() * h;
        g.fillStyle = rng() > 0.5 ? 'rgba(235,180,185,0.14)' : 'rgba(95,42,56,0.16)';
        g.fillRect(x, y, 2.5, 2.5);
      }
    });
    texPiel.colorSpace = THREE.SRGBColorSpace;
    texPiel.repeat.set(2, 2);
  }

  [texHueso, texHuesoBump, texTejido, texMetalCepillado, texIris, texPiel].forEach(t => { t.userData.compartida = true; });
  matTi.map = texMetalCepillado; matTi.bumpMap = texMetalCepillado; matTi.needsUpdate = true;
  matHierroOx.bumpMap = texHuesoBump; matHierroOx.needsUpdate = true;
  matHerrumbre.bumpMap = texHuesoBump; matHerrumbre.needsUpdate = true;
  matHuesoCort.map = texHueso; matHuesoCort.bumpMap = texHuesoBump; matHuesoCort.needsUpdate = true;
  matHuesoTrab.map = texHueso; matHuesoTrab.bumpMap = texHuesoBump; matHuesoTrab.needsUpdate = true;
  matCemento.bumpMap = texHuesoBump; matCemento.needsUpdate = true;
  matTejido.map = texTejido; matTejido.bumpMap = texTejido; matTejido.needsUpdate = true;
  matDermis.map = texPiel; matDermis.bumpMap = texPiel; matDermis.needsUpdate = true;
  matSubcut.bumpMap = texHuesoBump; matSubcut.needsUpdate = true;
  matIris.map = texIris; matIris.needsUpdate = true;
  matAdventicia.map = texTejido; matAdventicia.bumpMap = texTejido; matAdventicia.needsUpdate = true;
  matLipido.bumpMap = texHuesoBump; matLipido.needsUpdate = true;
  matAteroma.bumpMap = texHuesoBump; matAteroma.needsUpdate = true;
  matEPTFE.map = texTejido; matEPTFE.bumpMap = texTejido; matEPTFE.needsUpdate = true;
}

/* =========================================================
   Constructores geométricos biomédicos de alta definición
   ========================================================= */
function perfilTorneado(paresRY, segs = 48, phiStart = 0, phiLength = Math.PI * 2){
  const pts = paresRY.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y));
  return new THREE.LatheGeometry(pts, segs, phiStart, phiLength);
}

// Tubo curvo con radio variable a lo largo de la curva (Parallel Transport estable)
function tuboVariable(puntos, rFn, segsT = 40, segsR = 14, cerrado = false){
  const vecs = puntos.map(p => p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vecs, cerrado, 'catmullrom', 0.45);
  const frames = curve.computeFrenetFrames(segsT, cerrado);
  const pos = [], uvs = [], idx = [];
  const stride = segsR + 1;

  for(let i = 0; i <= segsT; i++){
    const u = i / segsT;
    const P = curve.getPointAt(u);
    const N = frames.normals[i], B = frames.binormals[i];
    const r = Math.max(0.001, typeof rFn === 'function' ? rFn(u) : rFn);
    for(let j = 0; j <= segsR; j++){
      const v = j / segsR, th = v * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      pos.push(P.x + (N.x * c + B.x * s) * r, P.y + (N.y * c + B.y * s) * r, P.z + (N.z * c + B.z * s) * r);
      uvs.push(u, v);
    }
  }
  for(let i = 0; i < segsT; i++){
    for(let j = 0; j < segsR; j++){
      const a = i * stride + j, b = (i + 1) * stride + j;
      const c = (i + 1) * stride + j + 1, d = i * stride + j + 1;
      idx.push(a, b, d, b, c, d);
    }
  }
  if(!cerrado){
    const p0 = curve.getPointAt(0), p1 = curve.getPointAt(1);
    const cStart = pos.length / 3; pos.push(p0.x, p0.y, p0.z); uvs.push(0, 0.5);
    const cEnd = pos.length / 3; pos.push(p1.x, p1.y, p1.z); uvs.push(1, 0.5);
    for(let j = 0; j < segsR; j++){
      idx.push(cStart, j + 1, j);
      const off = segsT * stride;
      idx.push(cEnd, off + j, off + j + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function tuboCurvo(puntos, rTubo, segs = 36, cerrado = false, radSegs = 12){
  return tuboVariable(puntos, rTubo, segs, radSegs, cerrado);
}

function heliceGeo(rFunc, h, vueltas, rTubo, segs = 140, radSegs = 10, axis = 'y'){
  const pts = [];
  for(let i = 0; i <= segs; i++){
    const u = i / segs;
    const ang = u * vueltas * Math.PI * 2;
    const r = typeof rFunc === 'function' ? rFunc(u) : rFunc;
    const pos = (u - 0.5) * h;
    if(axis === 'x') pts.push(new THREE.Vector3(pos, Math.cos(ang) * r, Math.sin(ang) * r));
    else pts.push(new THREE.Vector3(Math.cos(ang) * r, pos, Math.sin(ang) * r));
  }
  return tuboVariable(pts, rTubo, segs, radSegs, false);
}

// Rosca helicoidal trapezoidal/triangular real mecanizada (con caras planas y biseles nítidos)
function roscaRealGeo(rBaseFn, rCrestaFn, h, vueltas, segs = 180){
  const pitch = h / vueltas;
  const pos = [], uvs = [], idx = [];
  // 3 tiras continuas independientes: flanco inferior, cresta plana y flanco superior
  const tiras = [[0, 1], [1, 2], [2, 3]];

  for(const [pA, pB] of tiras){
    const baseIdx = pos.length / 3;
    for(let i = 0; i <= segs; i++){
      const u = i / segs;
      const ang = u * vueltas * Math.PI * 2;
      const yc = (u - 0.5) * h;
      const rb = typeof rBaseFn === 'function' ? rBaseFn(u) : rBaseFn;
      const rcMax = typeof rCrestaFn === 'function' ? rCrestaFn(u) : rCrestaFn;
      const runout = Math.min(1, u / 0.08) * Math.min(1, (1 - u) / 0.08);
      const rc = rb + (rcMax - rb) * runout;
      const perfil = [
        [rb - 0.005, yc - pitch * 0.40],
        [rc,          yc - pitch * 0.11],
        [rc,          yc + pitch * 0.11],
        [rb - 0.005, yc + pitch * 0.40]
      ];
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for(const k of [pA, pB]){
        const [rr, yy] = perfil[k];
        pos.push(ca * rr, yy, sa * rr);
        uvs.push(u * vueltas, k / 3);
      }
    }
    for(let i = 0; i < segs; i++){
      const a0 = baseIdx + i * 2, b0 = a0 + 1;
      const a1 = baseIdx + (i + 1) * 2, b1 = a1 + 1;
      idx.push(a0, b0, a1, b0, b1, a1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Malla orgánica interpolada entre secciones transversales (Loft 3D)
function mallaLoft(secciones, segsR = 32, cerrarTapas = true){
  const pos = [], uvs = [], idx = [];
  const stride = segsR + 1;
  const euler = new THREE.Euler(), q = new THREE.Quaternion(), v = new THREE.Vector3();

  secciones.forEach((sec, i) => {
    const u = i / Math.max(1, secciones.length - 1);
    euler.set(sec.rotX || 0, sec.rotY || 0, sec.rotZ || 0);
    q.setFromEuler(euler);
    for(let j = 0; j <= segsR; j++){
      const th = (j / segsR) * Math.PI * 2;
      const mult = sec.shapeFn ? sec.shapeFn(th) : 1;
      v.set(Math.cos(th) * sec.rx * mult, Math.sin(th) * sec.ry * mult, 0).applyQuaternion(q);
      pos.push(sec.pos[0] + v.x, sec.pos[1] + v.y, sec.pos[2] + v.z);
      uvs.push(j / segsR, u);
    }
  });

  for(let i = 0; i < secciones.length - 1; i++){
    for(let j = 0; j < segsR; j++){
      const a = i * stride + j, b = i * stride + j + 1;
      const c = (i + 1) * stride + j, d = (i + 1) * stride + j + 1;
      idx.push(a, b, c, b, d, c);
    }
  }

  if(cerrarTapas){
    const s0 = secciones[0], s1 = secciones[secciones.length - 1];
    const i0 = pos.length / 3; pos.push(...s0.pos); uvs.push(0.5, 0);
    const i1 = pos.length / 3; pos.push(...s1.pos); uvs.push(0.5, 1);
    for(let j = 0; j < segsR; j++){
      idx.push(i0, j + 1, j);
      const off = (secciones.length - 1) * stride;
      idx.push(i1, off + j, off + j + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Bloque anatómico sólido con topografía orgánica superior e inferior esculpida
function superficieOrganica(w, d, segX, segZ, topFn, botFn){
  const pos = [], uvs = [], idx = [];
  const cols = segX + 1;
  const topGrid = [], botGrid = [];

  for(let iz = 0; iz <= segZ; iz++){
    const z = (iz / segZ - 0.5) * d;
    for(let ix = 0; ix <= segX; ix++){
      const x = (ix / segX - 0.5) * w;
      topGrid.push([x, topFn(x, z), z, ix / segX, iz / segZ]);
      botGrid.push([x, botFn ? botFn(x, z) : -0.2, z, ix / segX, iz / segZ]);
    }
  }

  // Cara superior
  const topOff = 0;
  topGrid.forEach(p => { pos.push(p[0], p[1], p[2]); uvs.push(p[3], p[4]); });
  for(let iz = 0; iz < segZ; iz++) for(let ix = 0; ix < segX; ix++){
    const a = topOff + iz * cols + ix, b = a + 1, c = a + cols, d2 = c + 1;
    idx.push(a, c, b, b, c, d2);
  }
  // Cara inferior
  const botOff = pos.length / 3;
  botGrid.forEach(p => { pos.push(p[0], p[1], p[2]); uvs.push(p[3], p[4]); });
  for(let iz = 0; iz < segZ; iz++) for(let ix = 0; ix < segX; ix++){
    const a = botOff + iz * cols + ix, b = a + 1, c = a + cols, d2 = c + 1;
    idx.push(a, b, c, b, d2, c);
  }
  // Faldas perimetrales con vértices propios para bordes limpios
  function pared(listaPts, invertir){
    const off = pos.length / 3;
    listaPts.forEach(([pt, pb], k) => {
      const u = k / Math.max(1, listaPts.length - 1);
      pos.push(pt[0], pt[1], pt[2], pb[0], pb[1], pb[2]);
      uvs.push(u, 1, u, 0);
    });
    for(let k = 0; k < listaPts.length - 1; k++){
      const t0 = off + k * 2, b0 = t0 + 1, t1 = t0 + 2, b1 = t0 + 3;
      if(invertir) idx.push(t0, t1, b0, t1, b1, b0);
      else idx.push(t0, b0, t1, t1, b0, b1);
    }
  }
  const front = [], back = [], left = [], right = [];
  for(let ix = 0; ix <= segX; ix++){
    const iF = segZ * cols + ix, iB = ix;
    front.push([topGrid[iF], botGrid[iF]]);
    back.push([topGrid[iB], botGrid[iB]]);
  }
  for(let iz = 0; iz <= segZ; iz++){
    const iL = iz * cols, iR = iz * cols + segX;
    left.push([topGrid[iL], botGrid[iL]]);
    right.push([topGrid[iR], botGrid[iR]]);
  }
  pared(front, false); pared(back, true); pared(left, true); pared(right, false);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function extruirCentrado(shape, depth, { bevelThickness = 0.025, bevelSize = 0.02, bevelSegments = 4, curveSegments = 28 } = {}){
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled:true, bevelThickness, bevelSize, bevelSegments, curveSegments });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function corrugadoGeo(rBase, amp, ondas, h, rWall = 0.016, segs = 48, phiLength = Math.PI * 2){
  const pts = [], steps = ondas * 6;
  for(let i = 0; i <= steps; i++){
    const u = i / steps;
    const r = rBase + Math.sin(u * ondas * Math.PI * 2) * amp;
    pts.push([r, (u - 0.5) * h]);
  }
  for(let i = steps; i >= 0; i--){
    const u = i / steps;
    const r = Math.max(0.01, rBase - rWall + Math.sin(u * ondas * Math.PI * 2) * amp * 0.65);
    pts.push([r, (u - 0.5) * h]);
  }
  pts.push(pts[0]);
  return perfilTorneado(pts, segs, 0, phiLength);
}

// Bloque óseo anatómico esculpido con cara cortical abombada + esponjosa trabecular
function huesoBloque(parent, w, h, d, { curva = 0.08, seed = 11, conTrabeculas = true, nTrab = 10 } = {}){
  const g = new THREE.Group();
  parent.add(g);
  const topFn = (x, z) => h * 0.5 + curva * Math.cos((x / w) * Math.PI) * 0.8 + Math.sin(x * 5 + z * 4) * 0.014;
  const botFn = (x, z) => -h * 0.5 - curva * Math.cos((x / w) * Math.PI) * 0.8 + Math.cos(x * 4 - z * 5) * 0.014;
  mesh(superficieOrganica(w, d, 22, 14, topFn, botFn), matHuesoCort, 0, 0, 0, g);

  const st = superficieOrganica(w * 0.86, d + 0.02, 16, 10,
    (x, z) => h * 0.34 + Math.sin(x * 7 + z * 6) * 0.016,
    (x, z) => -h * 0.34 + Math.cos(x * 6 - z * 7) * 0.016);
  mesh(st, matHuesoTrab, 0, 0, 0, g);

  if(conTrabeculas) trabeculasGrupo(g, w * 0.8, h * 0.58, d + 0.03, nTrab, matHuesoCort, seed);
  return g;
}

function trabeculasGrupo(parent, ancho, alto, prof, cantidad, mat, seed = 1){
  const rng = crearRng(seed);
  for(let i = 0; i < cantidad; i++){
    const x0 = (rng() - 0.5) * ancho * 0.85;
    const y0 = (rng() - 0.5) * alto * 0.68;
    const z0 = (rng() > 0.5 ? 1 : -1) * (prof * 0.49);
    const x1 = x0 + (rng() - 0.5) * ancho * 0.42;
    const y1 = y0 + (rng() - 0.5) * alto * 0.52;
    const xm = (x0 + x1) * 0.5 + (rng() - 0.5) * 0.07;
    const ym = (y0 + y1) * 0.5 + (rng() - 0.5) * 0.07;
    const r0 = 0.01 + rng() * 0.007;
    mesh(tuboVariable([[x0, y0, z0], [xm, ym, z0 * 1.02], [x1, y1, z0]], u => r0 * (1.2 - 0.4 * Math.sin(u * Math.PI)), 12, 8), mat, 0, 0, 0, parent);
  }
}

// Tornillo biomédico CNC con rosca trapezoidal real, ranuras apicales y cuello mecanizado
function tornilloBiomedico(parent, { rMax = 0.11, rTip = 0.055, hCuerpo = 0.78, vueltas = 7, rFilete = 0.025, hCuello = 0.16, rCuello = 0.115, tipoCabeza = 'hex', mat = matTi, matRosca = matTi } = {}){
  const g = new THREE.Group();
  parent.add(g);
  const y0 = -hCuerpo / 2, y1 = hCuerpo / 2;
  const perfil = [
    [0, y0 - 0.045], [rTip * 0.5, y0 - 0.03], [rTip, y0 + 0.045],
    [rMax * 0.88, y1 - 0.06], [rCuello * 0.94, y1],
    [rCuello, y1 + hCuello * 0.3], [rCuello * 0.96, y1 + hCuello * 0.35], [rCuello, y1 + hCuello * 0.4],
    [rCuello, y1 + hCuello * 0.72], [rCuello * 0.95, y1 + hCuello * 0.77], [rCuello, y1 + hCuello * 0.82],
    [rCuello * 0.9, y1 + hCuello], [0, y1 + hCuello]
  ];
  mesh(perfilTorneado(perfil, 40), mat, 0, 0, 0, g);

  const rBaseFn = u => rTip + (rMax * 0.88 - rTip) * Math.min(1, u * 1.15);
  const rCrestaFn = u => rBaseFn(u) + rFilete;
  mesh(roscaRealGeo(rBaseFn, rCrestaFn, hCuerpo * 0.88, vueltas, 180), matRosca, 0, -0.015, 0, g);

  const yCab = y1 + hCuello;
  if(tipoCabeza === 'hex'){
    mesh(new THREE.CylinderGeometry(rCuello * 0.76, rCuello * 0.78, 0.1, 6), mat, 0, yCab + 0.05, 0, g);
    mesh(perfilTorneado([[rCuello * 0.24, yCab + 0.1], [rCuello * 0.44, yCab + 0.1], [rCuello * 0.44, yCab + 0.155], [0, yCab + 0.155]], 24), matCoCr, 0, 0, 0, g);
  } else if(tipoCabeza === 'ranura'){
    mesh(perfilTorneado([[0, yCab], [rCuello * 1.28, yCab], [rCuello * 1.32, yCab + 0.055], [rCuello * 0.95, yCab + 0.11], [0, yCab + 0.11]], 32), mat, 0, 0, 0, g);
    mesh(tuboCurvo([[-rCuello * 0.82, yCab + 0.105, 0], [0, yCab + 0.098, 0], [rCuello * 0.82, yCab + 0.105, 0]], 0.013, 10, false, 8), matPyC, 0, 0, 0, g);
  } else if(tipoCabeza === 'avellanada'){
    mesh(perfilTorneado([[0, yCab], [rCuello * 1.35, yCab + 0.03], [rCuello * 1.15, yCab + 0.085], [0, yCab + 0.085]], 28), mat, 0, 0, 0, g);
  }
  return g;
}

function stentCoronario3D(R, L, anillos, zigs, rStrut, mat, parent){
  const g = new THREE.Group();
  parent.add(g);
  const paso = L / anillos;
  for(let r = 0; r < anillos; r++){
    const x0 = -L / 2 + (r + 0.5) * paso;
    const pts = [];
    for(let k = 0; k < zigs * 2; k++){
      const a = (k / (zigs * 2)) * Math.PI * 2;
      const dx = (k % 2 ? 1 : -1) * paso * 0.38;
      pts.push(new THREE.Vector3(x0 + dx, Math.cos(a) * R, Math.sin(a) * R));
    }
    mesh(tuboCurvo(pts, rStrut, zigs * 8, true, 8), mat, 0, 0, 0, g);
    if(r < anillos - 1){
      for(let b = 0; b < 4; b++){
        const a = (b / 4) * Math.PI * 2 + r * 0.55;
        const pA = [x0 + paso * 0.28, Math.cos(a) * R, Math.sin(a) * R];
        const pM = [x0 + paso * 0.5, Math.cos(a + 0.08) * R * 1.01, Math.sin(a + 0.08) * R * 1.01];
        const pB = [x0 + paso * 0.72, Math.cos(a + 0.04) * R, Math.sin(a + 0.04) * R];
        mesh(tuboCurvo([pA, pM, pB], rStrut * 0.82, 10, false, 6), mat, 0, 0, 0, g);
      }
    }
  }
  return g;
}

function celulaAdherida(parent, x, y, z, r = 0.1, matMem = matMembrana, matNuc = matNucleo, seed = 7){
  const rng = crearRng(seed);
  const cg = new THREE.Group();
  cg.position.set(x, y, z);
  parent.add(cg);
  const soma = mesh(new THREE.SphereGeometry(r, 24, 18), matMem, 0, 0, 0, cg);
  soma.scale.set(1.28, 0.52, 1.08);
  const nuc = mesh(new THREE.SphereGeometry(r * 0.4, 16, 12), matNuc, 0, r * 0.08, 0, cg);
  nuc.scale.set(1.1, 0.72, 1);
  for(let i = 0; i < 5; i++){
    const a = (i / 5) * Math.PI * 2 + rng() * 0.4;
    const len = r * (1.85 + rng() * 0.9);
    mesh(tuboVariable([
      [Math.cos(a) * r * 0.68, 0, Math.sin(a) * r * 0.68],
      [Math.cos(a) * len * 0.62, -r * 0.14, Math.sin(a) * len * 0.62],
      [Math.cos(a + 0.22) * len, -r * 0.34, Math.sin(a + 0.22) * len]
    ], u => r * (0.14 * (1 - u * 0.75)), 12, 7), matMem, 0, 0, 0, cg);
  }
  return cg;
}

function cristalHCA(parent, x, y, z, r = 0.022, h = 0.085, mat = matHCA, rx = 0, rz = 0){
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.set(rx, 0, rz);
  parent.add(g);
  mesh(new THREE.CylinderGeometry(r * 0.68, r, h, 6), mat, 0, h * 0.5, 0, g);
  mesh(new THREE.ConeGeometry(r * 0.68, h * 0.36, 6), mat, 0, h * 1.18, 0, g);
  return g;
}

// Marca una malla o grupo como parte inspeccionable (chips de enfoque de la línea temporal)
function P(obj, id){ obj.userData.parte = id; return obj; }

// Andamio poroso tipo espuma: nodos repartidos al azar dentro de un elipsoide y unidos a sus vecinos
// con trabéculas de grosor variable (evoca los scaffolds de PLGA/PGA de Langer y Vacanti)
function andamioPoroso(parent, { rx = 0.7, ry = 0.5, rz = 0.5, n = 70, enlaces = 3, grosor = 0.026, mat = matScaffold, seed = 5, radSegs = 6, sep = 0.24, maxLargo = 2.2 } = {}){
  const rng = crearRng(seed), nodos = [];
  let intentos = 0;
  while(nodos.length < n && intentos++ < n * 40){
    const p = new THREE.Vector3((rng() * 2 - 1) * rx, (rng() * 2 - 1) * ry, (rng() * 2 - 1) * rz);
    if((p.x / rx) ** 2 + (p.y / ry) ** 2 + (p.z / rz) ** 2 > 1) continue;
    if(nodos.some(q => q.distanceTo(p) < Math.min(rx, ry, rz) * sep)) continue;   // poros abiertos
    nodos.push(p);
  }
  const g = new THREE.Group(); parent.add(g);
  const hechos = new Set(), grado = new Array(nodos.length).fill(0);
  nodos.forEach((p, i) => {
    const dMin = Math.min(rx, ry, rz) * sep;
    nodos.map((q, j) => [j, p.distanceTo(q)]).filter(([j, dd]) => j !== i && dd < dMin * maxLargo).sort((a, b) => a[1] - b[1]).slice(0, enlaces).forEach(([j]) => {
      const clave = i < j ? i + '-' + j : j + '-' + i;
      if(hechos.has(clave)) return; hechos.add(clave); grado[i]++; grado[j]++;
      const q = nodos[j], m = p.clone().lerp(q, 0.5).add(new THREE.Vector3((rng() - 0.5) * 0.04, (rng() - 0.5) * 0.04, (rng() - 0.5) * 0.04));
      const r0 = grosor * (0.75 + rng() * 0.5);
      mesh(tuboVariable([p, m, q], u => r0 * (1.25 - 0.45 * Math.sin(u * Math.PI)), 8, radSegs), mat, 0, 0, 0, g);
    });
  });
  // uniones redondeadas en los nodos (los aislados no se dibujan)
  nodos.forEach((p, i) => { if(grado[i]) mesh(new THREE.IcosahedronGeometry(grosor * 1.12, 1), mat, p.x, p.y, p.z, g); });
  g.userData.nodos = nodos;
  return g;
}

// Bloque óseo alargado en X con sección anatómica (cortical + esponjosa) y la cara delantera cortada en z = 0
// para ver el interior: el corte deja la cortical como anillo alrededor de la esponjosa
function huesoCortado(parent, { largo = 1.7, seccion, segsX = 28, segsT = 40, ondula = 0.025 } = {}){
  const g = new THREE.Group(); parent.add(g);
  const capa = (escala, mat, zFrente) => {
    const pos = [], idx = [], stride = segsT + 1;
    for(let i = 0; i <= segsX; i++){
      const x = (i / segsX - 0.5) * largo;
      for(let j = 0; j <= segsT; j++){
        const th = (j / segsT) * Math.PI * 2;
        const [y, z] = seccion(th, x);
        const yc = -0.1, ys = yc + (y - yc) * escala;
        pos.push(x, ys + Math.sin(x * 3.2 + th) * ondula * escala, Math.min(zFrente, z * escala));
      }
    }
    for(let i = 0; i < segsX; i++) for(let j = 0; j < segsT; j++){
      const a = i * stride + j, b = a + 1, c = a + stride, d2 = c + 1;
      idx.push(a, c, b, b, c, d2);
    }
    // tapas en los extremos
    [0, segsX].forEach((i, k) => {
      const centro = pos.length / 3;
      pos.push((i / segsX - 0.5) * largo, -0.1, Math.min(zFrente, 0) - 0.05);
      for(let j = 0; j < segsT; j++){ const a = i * stride + j; k ? idx.push(centro, a, a + 1) : idx.push(centro, a + 1, a); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    // UV planar para que la textura de hueso se vea en la cara de corte
    const uv = []; for(let k = 0; k < pos.length; k += 3) uv.push(pos[k] * 0.6 + 0.5, pos[k + 1] * 0.6 + 0.5);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return mesh(geo, mat, 0, 0, 0, g);
  };
  capa(1, matHuesoCort, 0);
  capa(0.8, matHuesoTrab, 0.006);
  return g;
}

/* =========================================================
   Vitrina 01 del pasillo: construir(d, ctx)
   ========================================================= */
const pedMat = std(0x3A2F6E, { roughness:.35, metalness:.3 });
const ringGlow = basicGlow(0xFFD58A, 1.8);
const coneMat = new THREE.MeshBasicMaterial({ color:0xFFE2A8, transparent:true, opacity:0.06, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
const pedCylGeo = new THREE.CylinderGeometry(0.38, 0.42, 1.4, 28);
const pedRingGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.03, 28);
const pedConeGeo = new THREE.ConeGeometry(0.7, 2.6, 28, 1, true);
const placasCache = new Map();
let lineaCache = null;

function pedestal(d, x, z = -3.8){
  mesh(pedCylGeo, pedMat, x, -1.45, z, d);
  mesh(pedRingGeo, ringGlow, x, -0.74, z, d);
  mesh(pedConeGeo, coneMat, x, 0.55, z, d);
  const g = new THREE.Group(); g.position.set(x, -0.25, z); d.add(g); return g;
}

function placa(d, texto, x, y, z, w = 0.5){
  const clave = `${texto}|${w}`;
  let proto = placasCache.get(clave);
  if(!proto){
    proto = canvasPlane(w, 0.16, 640, 180, (g, W, H) => {
      g.fillStyle = '#F4EBD8'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(58,47,30,0.26)'; g.lineWidth = 5; g.strokeRect(5, 5, W - 10, H - 10);
      let sz = 72;
      g.font = `700 ${sz}px Sora, sans-serif`;
      const maxW = W - 64;
      while(sz > 30 && g.measureText(texto).width > maxW){
        sz -= 2;
        g.font = `700 ${sz}px Sora, sans-serif`;
      }
      g.fillStyle = '#3A2F1E';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(texto, W / 2, H / 2 + 2);
    });
    proto.material.toneMapped = true;
    placasCache.set(clave, proto);
  }
  const p = new THREE.Mesh(proto.geometry, proto.material);
  p.position.set(x, y, z); d.add(p); return p;
}

export function construir(d, ctx){
  asegurarTexturas();
  ctx.sala(d, 0x2A2350); ctx.luz(d, 0xFFD58A, 16);
  if(!lineaCache){
    lineaCache = canvasPlane(5.2, 1.0, 2400, 460, (g, w, h) => {
      g.fillStyle = '#1C1640'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#FFD58A'; g.lineWidth = 9; g.beginPath(); g.moveTo(80, 230); g.lineTo(w - 80, 230); g.stroke();
      const hitos = [['Antigüedad', 'suturas, dientes'], ['1949', 'Ridley · PMMA'], ['1960', 'Charnley · cadera'], ['1969', 'Hench · Bioglass'], ['1977', 'Brånemark'], ['2018', 'Chengdu']];
      hitos.forEach(([a, b], i) => {
        const x = 220 + i * (w - 440) / (hitos.length - 1);
        g.fillStyle = '#FFD58A'; g.beginPath(); g.arc(x, 230, 21, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#F4EBD8'; g.font = '700 58px Sora, sans-serif'; g.textAlign = 'center'; g.fillText(a, x, 154);
        g.font = '400 42px Sora, sans-serif'; g.fillStyle = '#CFC6FF'; g.fillText(b, x, 330);
      });
    });
  }
  const linea = new THREE.Mesh(lineaCache.geometry, lineaCache.material);
  linea.position.set(0, 1.1, -6.15); d.add(linea);

  const [p1, p2, p3] = [-1.6, 0, 1.6].map(x => pedestal(d, x));

  // Pedestal 1 (1ª gen · bioinerte): tornillo de titanio pulido clavado en un disco de hueso (cortical + esponjosa)
  // con la fina cápsula fibrosa translúcida que lo aísla del hueso
  mesh(perfilTorneado([[0, -0.3], [0.2, -0.3], [0.22, -0.26], [0.22, -0.16], [0.2, -0.13], [0, -0.13]], 32), matHuesoCort, 0, 0, 0, p1);
  mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.006, 28), matHuesoTrab, 0, -0.127, 0, p1);
  tornilloBiomedico(p1, { rMax:0.085, rTip:0.045, hCuerpo:0.46, vueltas:6, rFilete:0.02, hCuello:0.1, rCuello:0.088, tipoCabeza:'hex', mat:matTi, matRosca:matCoCr }).position.y = -0.02;
  mesh(new THREE.CylinderGeometry(0.118, 0.1, 0.3, 24, 1, true), matFibroso, 0, -0.1, 0, p1);

  // Pedestal 2 (2ª gen · bioactiva): crisol con gránulos de Bioglass 45S5 y, encima, su frente brillante de HCA
  const crisol = perfilTorneado([[0, -0.25], [0.21, -0.25], [0.25, -0.18], [0.26, 0.14], [0.28, 0.16], [0.24, 0.16], [0.23, -0.17], [0.18, -0.22], [0, -0.22]], 40);
  mesh(crisol, matVidrioClaro, 0, 0, 0, p2);
  const rng2 = crearRng(77);
  const granulos = [];
  for(let capa = 0; capa < 3; capa++){
    const n = [9, 8, 5][capa];
    for(let i = 0; i < n; i++){
      const a = (i / n) * Math.PI * 2 + capa * 0.5, rad = capa === 2 ? 0.07 : 0.06 + (i % 2) * 0.08;
      const gr = mesh(new THREE.IcosahedronGeometry(0.045 + rng2() * 0.02, 0), matVidrioBio, Math.cos(a) * rad, -0.17 + capa * 0.065, Math.sin(a) * rad, p2);
      gr.rotation.set(rng2() * 3, rng2() * 3, rng2() * 3); granulos.push(gr);
    }
  }
  // frente de hidroxiapatita: costra de cristales emisivos sobre los gránulos superiores
  for(let i = 0; i < 18; i++){
    const a = (i / 18) * Math.PI * 2, rad = 0.02 + (i % 3) * 0.06;
    cristalHCA(p2, Math.cos(a) * rad, 0.0, Math.sin(a) * rad, 0.019, 0.07 + rng2() * 0.05, matHCAFrente, (rng2() - 0.5) * 0.7, (rng2() - 0.5) * 0.7);
  }
  const ionesP2 = [];
  const ionGeo = new THREE.SphereGeometry(0.016, 10, 8);
  for(let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    const m = mesh(ionGeo, i % 2 ? matHCA : matOro, Math.cos(a) * 0.13, 0.1 + (i % 3) * 0.03, Math.sin(a) * 0.13, p2);
    ionesP2.push({ m, y0:0.1 + (i % 3) * 0.03, fase:i * 0.8 });
  }

  // Pedestal 3 (3ª gen · regenerativa): andamio trabecular poroso con un brote angiogénico coral que lo atraviesa
  const scG = new THREE.Group(); p3.add(scG);
  // retícula regular con aristas redondeadas: a distancia se lee mejor que una espuma aleatoria
  const nR = 4, paso = 0.13, idxR = (i, j, k) => (i * nR + j) * nR + k, puntosR = [];
  for(let i = 0; i < nR; i++) for(let j = 0; j < nR; j++) for(let k = 0; k < nR; k++){
    const v = new THREE.Vector3((i - 1.5) * paso, (j - 1.5) * paso, (k - 1.5) * paso);
    puntosR.push(v.multiplyScalar(1 - 0.12 * (Math.abs(i - 1.5) + Math.abs(j - 1.5) + Math.abs(k - 1.5)) / 4.5));
  }
  const nodoGeo = new THREE.IcosahedronGeometry(0.018, 1);
  for(let i = 0; i < nR; i++) for(let j = 0; j < nR; j++) for(let k = 0; k < nR; k++){
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(([a, b, c]) => {
      if(i + a < nR && j + b < nR && k + c < nR){
        const p0 = puntosR[idxR(i, j, k)], p1 = puntosR[idxR(i + a, j + b, k + c)];
        mesh(tuboVariable([p0, p0.clone().lerp(p1, 0.5), p1], u => 0.014 * (1.25 - 0.4 * Math.sin(u * Math.PI)), 6, 5), matScaffold, 0, 0, 0, scG);
      }
    });
    const q = puntosR[idxR(i, j, k)]; mesh(nodoGeo, matScaffold, q.x, q.y, q.z, scG);
  }
  mesh(tuboVariable([[-0.26, -0.2, 0.06], [-0.08, -0.05, 0.03], [0.05, 0.06, -0.02], [0.2, 0.2, -0.05]], u => 0.026 * (1 - u * 0.45), 24, 10), matCoral, 0, 0, 0, scG);
  mesh(tuboVariable([[-0.06, -0.03, 0.03], [0.08, -0.12, 0.13], [0.18, -0.17, 0.17]], u => 0.016 * (1 - u * 0.55), 14, 8), matCoral, 0, 0, 0, scG);
  mesh(new THREE.SphereGeometry(0.03, 14, 10), matCoral, 0.2, 0.2, -0.05, scG);   // yema del brote
  celulaAdherida(scG, 0.14, 0.09, 0.12, 0.034, matMembrana, matNucleo, 12);
  celulaAdherida(scG, -0.14, -0.08, 0.13, 0.032, matMembrana, matNucleo, 15);

  [['1ª', -1.6], ['2ª', 0], ['3ª', 1.6]].forEach(([t, x]) => placa(d, t + ' generación', x, -0.9, -3.38, 0.62));
  ctx.anim(t => {
    [p1, p2, p3].forEach((g, i) => {
      g.rotation.y = t * 0.18 + i;
      g.position.y = -0.25 + Math.sin(t * 0.9 + i) * 0.03;
    });
    ionesP2.forEach(({ m, y0, fase }) => { m.position.y = y0 + Math.sin(t * 1.8 + fase) * 0.04; });
  });
}

/* =========================================================
   Actividades de la sala (se abren en el visor con { datos, vitrina, avisar })
   Todo el contenido sale de datos/historia.json
   ========================================================= */

function genDe(texto = ''){ return /3ª/.test(texto) ? 3 : /2ª/.test(texto) ? 2 : /1ª/.test(texto) ? 1 : 0; }
const anioTxt = (a) => a < 0 ? `${Math.abs(a)} a. C.` : a < 1000 ? `${a} d. C.` : String(a);

/* ---- Modelos 3D anatómicos y mecánicos para los 15 hitos (estáticos al abrir, sin giro automático) ---- */
export function escenaHito3D(anio){
  return (grupo) => {
    asegurarTexturas();

    // 1) Prehistoria (~7000 a. C.): almohadilla anatómica centrada de dermis y tejido subcutáneo con incisión longitudinal, sutura continua de lino y aguja ósea curvada con ojo enhebrado
    if(anio < 0){
      const woundX = z => -Math.sin(z * 1.6) * 0.045;
      const topDerm = (x, z) => {
        const dWound = Math.abs(x - woundX(z));
        const lip = Math.exp(-Math.pow((dWound - 0.105) / 0.085, 2)) * 0.08;
        const cleft = -Math.exp(-Math.pow(dWound / 0.042, 2)) * 0.13;
        const domo = Math.cos((x / 1.66) * Math.PI) * 0.075 * Math.cos((z / 1.42) * Math.PI);
        return 0.08 + domo + lip + cleft;
      };
      const yDerm = (x, z) => topDerm(x, z) - 0.08;
      const dermGeo = superficieOrganica(1.66, 1.42, 34, 26, topDerm,
        (x, z) => -0.14 + Math.sin(x * 3 + z * 2) * 0.014);
      P(mesh(dermGeo, matDermis, 0, -0.08, 0, grupo), 'piel');

      // Capa subcutánea adiposa orgánica bajo la dermis
      const subGeo = superficieOrganica(1.60, 1.36, 22, 16,
        (x, z) => -0.12 + Math.sin(x * 5 + z * 4) * 0.014,
        (x, z) => -0.30 + Math.cos(x * 4 - z * 5) * 0.014);
      P(mesh(subGeo, matSubcut, 0, -0.08, 0, grupo), 'piel');

      // Puntos de sutura de lino bien apoyados cruzando los labios de la herida y nudo inicial
      const zPuntos = [-0.46, -0.26, -0.06, 0.14, 0.34];
      const cx0 = woundX(zPuntos[0]), xNudo = cx0 - 0.14;
      const nudo = mesh(new THREE.TorusGeometry(0.03, 0.011, 10, 20), matLino, xNudo, yDerm(xNudo, zPuntos[0]) + 0.012, zPuntos[0], grupo);
      nudo.rotation.x = Math.PI / 2;

      for(let i = 0; i < zPuntos.length; i++){
        const zA = zPuntos[i], cx = woundX(zA);
        const xL = cx - 0.135, xR = cx + 0.135;
        const yL = yDerm(xL, zA), yR = yDerm(xR, zA);
        const yCrest = Math.max(yL, yR) + 0.026;
        P(mesh(tuboVariable([
          [xL, yL - 0.016, zA],
          [cx - 0.065, yL + 0.016, zA],
          [cx, yCrest, zA],
          [cx + 0.065, yR + 0.016, zA],
          [xR, yR - 0.016, zA]
        ], 0.014, 18, 8), matLino, 0, 0, 0, grupo), 'sutura');
        if(i < zPuntos.length - 1){
          const zB = zPuntos[i + 1], cxB = woundX(zB), xLNext = cxB - 0.135;
          const zM = (zA + zB) * 0.5, cxM = woundX(zM);
          mesh(tuboVariable([
            [xR, yR - 0.016, zA],
            [cxM, yDerm(cxM, zM) - 0.045, zM],
            [xLNext, yDerm(xLNext, zB) - 0.016, zB]
          ], 0.012, 12, 7), matLino, 0, 0, 0, grupo);
        }
      }

      // Aguja ósea curvada con ojo ovalado y hebra continua enhebrada desde el último punto
      const aguja = new THREE.Group();
      aguja.position.set(0.18, 0.32, 0.36);
      aguja.rotation.set(0.24, -0.32, 0.28);
      grupo.add(aguja); P(aguja, 'aguja');
      mesh(tuboVariable([[-0.24, 0.10, 0], [0.0, 0.23, 0], [0.22, 0.13, 0], [0.38, -0.02, 0]], u => 0.023 * (1 - Math.pow(u, 2.1) * 0.93), 30, 12), matHuesoCort, 0, 0, 0, aguja);
      const ojoAguja = mesh(new THREE.TorusGeometry(0.032, 0.011, 10, 22), matHuesoCort, -0.255, 0.088, 0, aguja);
      ojoAguja.scale.set(1.45, 0.85, 0.85);
      ojoAguja.rotation.z = 0.55;

      aguja.updateMatrix();
      const ojoGrupo = new THREE.Vector3(-0.265, 0.082, 0).applyMatrix4(aguja.matrix);
      const colaGrupo = new THREE.Vector3(-0.35, 0.01, -0.05).applyMatrix4(aguja.matrix);
      const zUlt = zPuntos[zPuntos.length - 1], xUlt = woundX(zUlt) + 0.135, yUlt = yDerm(xUlt, zUlt);
      mesh(tuboVariable([
        [xUlt, yUlt - 0.01, zUlt],
        [xUlt + 0.03, yUlt + 0.08, zUlt + 0.02],
        [(xUlt + ojoGrupo.x) * 0.5, ojoGrupo.y - 0.04, (zUlt + ojoGrupo.z) * 0.5 + 0.03],
        [ojoGrupo.x, ojoGrupo.y, ojoGrupo.z],
        [colaGrupo.x, colaGrupo.y, colaGrupo.z]
      ], 0.012, 24, 8), matLino, 0, 0, 0, grupo);

      grupo.rotation.set(0.20, -0.32, 0);
      return;
    }

    // 2) 200-600 d. C.: Segmento mandibular anterior anatómico con encía festoneada y arcada continua de 5 dientes anteriores (naturales, nácar + HCA e hierro forjado)
    if(anio === 200){
      const R = 1.05, zOff = -0.90;
      const mandSecs = [];
      for(let i = 0; i <= 18; i++){
        const u = i / 18;
        const a = -0.84 + u * 1.68;
        mandSecs.push({
          pos: [Math.sin(a) * R, -0.31 - Math.cos(a) * 0.02, Math.cos(a) * R + zOff],
          rx: 0.22, ry: 0.36,
          rotY: a + Math.PI / 2,
          shapeFn: th => 1.0 - 0.14 * Math.sin(th)
        });
      }
      mesh(mallaLoft(mandSecs, 28, true), matHuesoCort, 0, 0, 0, grupo);

      const angulos = [-0.56, -0.28, 0, 0.28, 0.56];
      // Encía festoneada con papilas interdentales rodeando la arcada continua de 5 dientes
      const enciaSecs = [];
      for(let i = 0; i <= 48; i++){
        const a = -0.74 + (i / 48) * 1.48;
        const dMin = Math.min(...angulos.map(ag => Math.abs(a - ag)));
        const f = Math.min(1, dMin / 0.14);
        const papila = Math.pow(f, 1.35) * 0.075;
        const recesion = Math.exp(-Math.pow((a - 0.28) / 0.11, 2)) * 0.022;
        enciaSecs.push({
          pos: [Math.sin(a) * R, -0.03 + papila * 0.45 - recesion * 0.5, Math.cos(a) * R + zOff],
          rx: 0.142 - 0.018 * f,
          ry: 0.075 + papila * 0.55 - recesion * 0.3,
          rotY: a + Math.PI / 2
        });
      }
      mesh(mallaLoft(enciaSecs, 20, true), matEncia, 0, 0, 0, grupo);

      // Arcada continua de 5 dientes anteriores con raíces alojadas dentro del alvéolo mandibular
      angulos.forEach((a, k) => {
        const gD = new THREE.Group();
        gD.position.set(Math.sin(a) * R, 0, Math.cos(a) * R + zOff);
        gD.rotation.y = a;
        grupo.add(gD);

        if(k === 0 || k === 4){
          // Caninos naturales (raíz alojada dentro del alvéolo + corona de esmalte)
          mesh(mallaLoft([
            { pos:[0, -0.35, 0], rx:0.022, ry:0.020, rotX:-Math.PI / 2 },
            { pos:[0, -0.14, 0], rx:0.068, ry:0.056, rotX:-Math.PI / 2 },
            { pos:[0,  0.02, 0], rx:0.095, ry:0.068, rotX:-Math.PI / 2 }
          ], 22, true), matHuesoCort, 0, 0, 0, gD);
          mesh(mallaLoft([
            { pos:[0, 0.00, 0.00], rx:0.098, ry:0.070, rotX:-Math.PI / 2 },
            { pos:[0, 0.14, 0.01], rx:0.130, ry:0.076, rotX:-Math.PI / 2 },
            { pos:[0, 0.34, 0.015], rx:0.112, ry:0.048, rotX:-Math.PI / 2 },
            { pos:[0, 0.48, 0.015], rx:0.036, ry:0.018, rotX:-Math.PI / 2 }
          ], 28, true), matEsmalte, 0, 0, 0, gD);
        } else if(k === 1 || k === 2){
          // Incisivo lateral y central maya tallados en nácar con anillo cervical de osteointegración (HCA)
          const ancho = k === 2 ? 0.136 : 0.126;
          const alto = k === 2 ? 0.45 : 0.43;
          mesh(mallaLoft([
            { pos:[0, -0.34, 0.00], rx:0.026, ry:0.022, rotX:-Math.PI / 2 },
            { pos:[0, -0.12, 0.00], rx:0.078, ry:0.060, rotX:-Math.PI / 2 },
            { pos:[0,  0.03, 0.005], rx:0.092, ry:0.064, rotX:-Math.PI / 2 },
            { pos:[0,  0.20, 0.012], rx:ancho, ry:0.072, rotX:-Math.PI / 2 },
            { pos:[0,  alto - 0.05, 0.016], rx:ancho * 1.04, ry:0.038, rotX:-Math.PI / 2 },
            { pos:[0,  alto, 0.016], rx:ancho * 0.88, ry:0.016, rotX:-Math.PI / 2 }
          ], 30, true), matNacar, 0, 0, 0, gD).userData.parte = 'nacar';
          const anilloHCA = mesh(perfilTorneado([
            [0.088, 0.012], [0.122, 0.026], [0.126, 0.052], [0.104, 0.068], [0.086, 0.055], [0.088, 0.012]
          ], 32), matHCA, 0, 0, 0, gD);
          anilloHCA.scale.set(1.16, 1, 0.82); P(anilloHCA, 'hca');
        } else {
          // Cuña galorromana de hierro oxidado para contraste histórico
          P(gD, 'hierro');
          mesh(mallaLoft([
            { pos:[0, -0.33, 0.00], rx:0.024, ry:0.022, rotX:-Math.PI / 2 },
            { pos:[0, -0.10, 0.00], rx:0.076, ry:0.062, rotX:-Math.PI / 2 },
            { pos:[0,  0.04, 0.005], rx:0.092, ry:0.068, rotX:-Math.PI / 2 },
            { pos:[0,  0.22, 0.010], rx:0.120, ry:0.072, rotX:-Math.PI / 2 },
            { pos:[0,  0.42, 0.012], rx:0.104, ry:0.042, rotX:-Math.PI / 2 }
          ], 10, true), matHierroOx, 0, 0, 0, gD);
          const oxRing = mesh(new THREE.TorusGeometry(0.105, 0.018, 10, 24), matHerrumbre, 0, 0.032, 0, gD);
          oxRing.rotation.x = Math.PI / 2;
          oxRing.scale.set(1.08, 0.82, 1);
        }
      });

      grupo.rotation.set(0.12, -0.32, 0);
      return;
    }

    // 3) 1829-1937: Diáfisis seccionada con tres implantes de la época: placa de hierro corroída (osteólisis),
    //    cerclaje de platino con nudo y fina cápsula fibrosa, y placa compacta de Vitallium (Co-Cr-Mo) bien tolerada
    if(anio === 1829){
      // Hueso: anillo cortical + médula esponjosa, con una cuña frontal-superior retirada para ver el interior
      const L = 1.05, rOut = y => 0.4 + 0.045 * (y / L) ** 2 + Math.sin(y * 4.2) * 0.008;
      const perfilAnillo = [];
      for(let i = 0; i <= 24; i++){ const y = -L + (i / 24) * 2 * L; perfilAnillo.push([rOut(y), y]); }
      for(let i = 24; i >= 0; i--){ const y = -L + (i / 24) * 2 * L; perfilAnillo.push([rOut(y) - 0.1, y]); }
      perfilAnillo.push(perfilAnillo[0]);
      const phi0 = Math.PI * 0.45, phiL = Math.PI * 1.4;
      const hueso = new THREE.Group(); hueso.rotation.z = Math.PI / 2; grupo.add(hueso);
      mesh(perfilTorneado(perfilAnillo, 56, phi0, phiL), matHuesoCort, 0, 0, 0, hueso);
      const medula = [[0, -L]]; for(let i = 0; i <= 24; i++){ const y = -L + (i / 24) * 2 * L; medula.push([rOut(y) - 0.102, y]); } medula.push([0, L]);
      mesh(perfilTorneado(medula, 48, phi0, phiL), matHuesoTrab, 0, 0, 0, hueso);
      // Caras planas del corte (tapan el interior del torno y muestran cortical + esponjosa)
      [phi0, phi0 + phiL].forEach(ph => {
        const corteC = new THREE.Shape(), corteT = new THREE.Shape();
        corteC.moveTo(rOut(-L) - 0.1, -L);
        for(let i = 0; i <= 24; i++){ const y = -L + (i / 24) * 2 * L; corteC.lineTo(rOut(y), y); }
        for(let i = 24; i >= 0; i--){ const y = -L + (i / 24) * 2 * L; corteC.lineTo(rOut(y) - 0.1, y); }
        corteT.moveTo(0, -L); for(let i = 0; i <= 24; i++){ const y = -L + (i / 24) * 2 * L; corteT.lineTo(rOut(y) - 0.1, y); } corteT.lineTo(0, L);
        [[corteC, matHuesoCort], [corteT, matHuesoTrab]].forEach(([sh, mt]) => {
          const m = mesh(new THREE.ShapeGeometry(sh, 4), mt, 0, 0, 0, hueso);
          m.rotation.y = ph - Math.PI / 2;
        });
      });
      const topY = x => rOut(-x);   // altura de la superficie ósea superior en cada x del mundo

      // Placa curva que abraza la diáfisis (torno parcial alrededor del eje del hueso)
      const placaCurva = (x0, ancho, arco, grosor, mat) => {
        const y0 = -x0;   // coordenada a lo largo del eje del hueso (local)
        const r = rOut(y0) + 0.004;
        const g = mesh(perfilTorneado([[r, y0 - ancho / 2], [r + grosor, y0 - ancho / 2 + 0.01], [r + grosor, y0 + ancho / 2 - 0.01], [r, y0 + ancho / 2]], 24, Math.PI / 2 - arco / 2, arco), mat, 0, 0, 0, hueso);
        return g;
      };
      const tornilloEn = (x, mat, h = 0.4, cabeza = 'avellanada') => {
        const t = tornilloBiomedico(grupo, { rMax:0.046, rTip:0.026, hCuerpo:h, vueltas:5, rFilete:0.012, hCuello:0.03, rCuello:0.048, tipoCabeza:cabeza, mat, matRosca:mat });
        t.position.set(x, topY(x) + 0.03 - (h / 2 + 0.03), 0);
        return t;
      };

      // 1) Hierro (Zierold, 1924): placa picada, tornillos corroídos y halo de osteólisis
      const hierro = P(new THREE.Group(), 'hierro'); grupo.add(hierro);
      P(placaCurva(-0.66, 0.42, Math.PI * 0.32, 0.03, matHierroOx), 'hierro');   // queda en el marco girado del hueso
      [-0.8, -0.52].forEach(x => {
        hierro.add(tornilloEn(x, matHierroOx));
        // hueco de reabsorción alrededor del tornillo y mancha de herrumbre en la entrada
        mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.34, 18, 1, true), matFibroso, x, topY(x) - 0.17, 0, hierro);
        const halo = mesh(new THREE.TorusGeometry(0.07, 0.016, 8, 22), matHerrumbre, x, topY(x) + 0.006, 0, hierro);
        halo.rotation.x = Math.PI / 2;
      });
      const rngH = crearRng(1924);
      for(let i = 0; i < 9; i++){
        const x = -0.66 + (rngH() - 0.5) * 0.46, a = (rngH() - 0.5) * 0.9;
        mesh(new THREE.DodecahedronGeometry(0.014 + rngH() * 0.014, 0), matHerrumbre, x, Math.cos(a) * (topY(x) + 0.02), Math.sin(a) * (topY(x) + 0.02), hierro);
      }

      // 2) Platino (Levert, 1829): cerclaje de alambre con nudo retorcido y cápsula fibrosa fina
      const platino = P(new THREE.Group(), 'platino'); grupo.add(platino);
      const rW = topY(0) + 0.012;
      const aro = new THREE.Group(); aro.rotation.y = Math.PI / 2; platino.add(aro);
      const alambre = mesh(new THREE.TorusGeometry(rW, 0.015, 10, 80, Math.PI * 1.4), matPlatino, 0, 0, 0, aro); alambre.rotation.z = Math.PI * 1.15;   // el arco solo rodea el hueso que queda tras el corte
      const capsula = mesh(new THREE.TorusGeometry(rW, 0.026, 12, 80, Math.PI * 1.4), matFibroso, 0, 0, 0, aro); capsula.rotation.z = alambre.rotation.z;
      // nudo: dos cabos retorcidos que suben desde lo alto del hueso y se doblan hacia atrás
      [0, Math.PI].forEach(f => mesh(heliceGeo(0.011, 0.13, 2.5, 0.008, 70, 6), matPlatino, 0, rW + 0.065, 0, platino).rotation.y = f);
      mesh(tuboCurvo([[0, rW + 0.13, 0], [0.03, rW + 0.17, -0.03], [0.1, rW + 0.15, -0.09]], 0.008, 12, false, 6), matPlatino, 0, 0, 0, platino);

      // 3) Vitallium (Venable y Stuck, 1937): placa compacta con dos tornillos, sin reacción alrededor
      const vit = P(new THREE.Group(), 'vitallium'); grupo.add(vit);
      P(placaCurva(0.66, 0.4, Math.PI * 0.26, 0.026, matCoCr), 'vitallium');
      [0.54, 0.78].forEach(x => vit.add(tornilloEn(x, matCoCr, 0.42, 'ranura')));

      grupo.rotation.set(0.32, -0.32, 0);
      return;
    }

    // 4) 1943-1960: Riñón artificial de tambor rotatorio de Kolff conectado a un shunt arteriovenoso de Scribner
    //    en el antebrazo: línea arterial (roja) al tambor y línea venosa (oscura) de vuelta
    if(anio === 1943){
      const maq = P(new THREE.Group(), 'tambor'); grupo.add(maq);
      // Batea semicircular esmaltada con reborde
      const cubS = new THREE.Shape();
      cubS.absarc(0, 0.08, 0.72, Math.PI, Math.PI * 2, false);
      cubS.lineTo(0.78, 0.08); cubS.lineTo(0.78, 0.13); cubS.lineTo(0.65, 0.13);
      cubS.absarc(0, 0.08, 0.65, Math.PI * 2, Math.PI, true);
      cubS.lineTo(-0.78, 0.13); cubS.lineTo(-0.78, 0.08); cubS.closePath();
      const cubeta = mesh(extruirCentrado(cubS, 1.54, { bevelThickness:0.018, bevelSize:0.014, curveSegments:48 }), new THREE.MeshPhysicalMaterial({ color:0xDCE6F0, roughness:0.22, metalness:0.22, clearcoat:0.7 }), 0, -0.08, -0.1, maq);
      cubeta.rotation.y = Math.PI / 2;

      // Baño de dializado: volumen translúcido con bordes biselados redondeados (sin aristas vivas)
      const nivel = 0.02, rIn = 0.645;
      const liqS = new THREE.Shape();
      const aN = Math.asin((0.08 - nivel) / rIn);
      liqS.absarc(0, 0.08, rIn - 0.004, Math.PI + aN, Math.PI * 2 - aN, false);
      liqS.closePath();
      mesh(extruirCentrado(liqS, 1.5, { bevelThickness:0.02, bevelSize:0.012, bevelSegments:5, curveSegments:48 }), matDializado, 0, -0.08, -0.1, maq).rotation.y = Math.PI / 2;
      // Soportes en A, eje motor, poleas y juntas rotatorias en los dos extremos del eje
      [-0.79, 0.79].forEach(x => {
        mesh(tuboCurvo([[x, -0.62, -0.46], [x, 0.25, -0.1], [x, -0.62, 0.26]], 0.03, 18, false, 10), matTi, 0, 0, 0, maq);
        mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 20), matCoCr, x, 0.25, -0.1, maq).rotation.z = Math.PI / 2;
      });
      mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.84, 18), matCoCr, 0, 0.25, -0.1, maq).rotation.z = Math.PI / 2;
      [-0.9, 0.9].forEach(x => {
        mesh(perfilTorneado([[0.02, -0.04], [0.05, -0.04], [0.05, 0.04], [0.035, 0.05], [0.02, 0.05]], 20), matTi, x, 0.25, -0.1, maq).rotation.z = Math.PI / 2;
      });
      mesh(perfilTorneado([[0.03, -0.03], [0.16, -0.03], [0.14, -0.01], [0.14, 0.01], [0.16, 0.03], [0.03, 0.03]], 28), matTi, -0.84, 0.25, -0.1, maq).rotation.z = Math.PI / 2;

      // Tambor: tapas con buje y 6 radios, listones longitudinales y espiral de celofán de 14 vueltas
      const tambor = new THREE.Group(); tambor.position.set(0, 0.25, -0.1); maq.add(tambor);
      [-0.62, 0.62].forEach(x => {
        mesh(new THREE.TorusGeometry(0.41, 0.022, 12, 40), matTi, x, 0, 0, tambor).rotation.y = Math.PI / 2;
        mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20), matCoCr, x, 0, 0, tambor).rotation.z = Math.PI / 2;
        for(let k = 0; k < 6; k++){
          const a = (k / 6) * Math.PI * 2;
          mesh(tuboCurvo([[x, Math.cos(a) * 0.06, Math.sin(a) * 0.06], [x, Math.cos(a) * 0.4, Math.sin(a) * 0.4]], 0.011, 4, false, 6), matTi, 0, 0, 0, tambor);
        }
      });
      for(let i = 0; i < 12; i++){
        const a = (i / 12) * Math.PI * 2;
        mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.28, 10), matHuesoCort, 0, Math.cos(a) * 0.39, Math.sin(a) * 0.39, tambor).rotation.z = Math.PI / 2;
      }
      mesh(heliceGeo(0.425, 1.18, 14, 0.022, 260, 8, 'x'), matCelofan, 0, 0, 0, tambor);

      // Antebrazo con el shunt de Scribner: dos cánulas de teflón entran en la arteria y la vena radiales
      const brazo = P(new THREE.Group(), 'shunt'); grupo.add(brazo);
      // antebrazo: vientre muscular cerca del codo, se estrecha en la muñeca y termina en el dorso de la mano
      const perfilBrazo = [
        [-0.86, 0.13, 0.11], [-0.7, 0.16, 0.13], [-0.45, 0.165, 0.125], [-0.15, 0.15, 0.11], [0.15, 0.13, 0.095],
        [0.42, 0.115, 0.08], [0.56, 0.11, 0.07], [0.64, 0.13, 0.06], [0.76, 0.145, 0.055], [0.86, 0.13, 0.05], [0.92, 0.07, 0.035]
      ];
      const secs = perfilBrazo.map(([x, rz, ry]) => ({ pos:[x, -0.78, 0.7], rx:rz, ry, rotY:Math.PI / 2, shapeFn:th => 1 - 0.08 * Math.sin(th) }));
      mesh(mallaLoft(secs, 32, true), matDermis, 0, 0, 0, brazo);
      const yPiel = -0.78 + 0.13;
      const lineas = [
        { x:-0.32, mat:matVaso, fin:[-0.9, 0.25, -0.1] },     // arterial: sale de la arteria hacia el tambor
        { x:0.32, mat:matVenosa, fin:[0.9, 0.25, -0.1] }      // venosa: vuelve del tambor a la vena
      ];
      lineas.forEach(({ x, mat, fin }) => {
        const s = Math.sign(x);
        // cánula de teflón bajo la piel y manguito de silicona en la salida
        mesh(tuboVariable([[x - s * 0.18, yPiel - 0.05, 0.7], [x - s * 0.05, yPiel - 0.03, 0.72], [x, yPiel + 0.03, 0.74]], 0.018, 12, 8), matPMMA, 0, 0, 0, brazo);
        mesh(perfilTorneado([[0.026, -0.03], [0.036, -0.02], [0.036, 0.03], [0.026, 0.04]], 16), matSilicona, x, yPiel + 0.03, 0.74, brazo);
        // conector metálico y línea flexible hasta la junta rotatoria del tambor
        mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 14), matCoCr, x, yPiel + 0.12, 0.74, brazo);
        mesh(tuboVariable([
          [x, yPiel + 0.15, 0.74], [x + s * 0.1, yPiel + 0.42, 0.66], [fin[0] - s * 0.05, fin[1] - 0.45, 0.32],
          [fin[0] + s * 0.06, fin[1] - 0.12, 0.05], [fin[0], fin[1], fin[2]]
        ], 0.022, 60, 10), mat, 0, 0, 0, brazo);
      });

      grupo.rotation.set(0.16, -0.3, 0);
      return t => { tambor.rotation.x = t * 0.38; };
    }

    // 5) 1947-1952: Injerto aorto-biilíaco de Voorhees (tela Vinyon-N): aorta nativa → anastomosis suturada →
    //    tronco corrugado continuo → bifurcación en Y suave → ramas ilíacas que se unen a las arterias nativas
    if(anio === 1947){
      const corr = (u, n, amp, ramp = 0.06) => amp * Math.min(1, u / ramp) * Math.sin(u * n * Math.PI * 2);

      // Aorta nativa: pared con grosor visible arriba, se ensancha ligeramente hacia el corte
      const aorta = P(new THREE.Group(), 'aorta'); grupo.add(aorta);
      const perfA = [];
      for(let i = 0; i <= 12; i++){ const y = 0.33 + (i / 12) * 0.55; perfA.push([0.262 + (i / 12) * 0.012, y]); }
      for(let i = 12; i >= 0; i--){ const y = 0.33 + (i / 12) * 0.55; perfA.push([0.222 + (i / 12) * 0.012, y]); }
      perfA.push(perfA[0]);
      mesh(perfilTorneado(perfA, 56), matVaso, 0, 0, 0, aorta);
      // Sutura continua de la anastomosis término-terminal
      const ptsSut = [];
      for(let i = 0; i < 160; i++){
        const a = (i / 160) * Math.PI * 2;
        ptsSut.push([Math.cos(a) * 0.268, 0.345 + 0.02 * Math.sin(a * 18), Math.sin(a) * 0.268]);
      }
      mesh(tuboCurvo(ptsSut, 0.006, 320, true, 5), matPyC, 0, 0, 0, aorta);

      // Tronco del injerto: corrugado que nace liso dentro de la aorta y se estrecha hacia la bifurcación
      const injerto = P(new THREE.Group(), 'injerto'); grupo.add(injerto);
      const yTop = 0.4, yBot = -0.16, nTr = 11;
      const rTr = y => { const u = (yTop - y) / (yTop - yBot); return 0.232 - 0.03 * u * u + corr(u, nTr, 0.013); };
      const perfT = [];
      for(let i = 0; i <= 110; i++){ const y = yTop - (i / 110) * (yTop - yBot); perfT.push([rTr(y), y]); }
      for(let i = 110; i >= 0; i--){ const y = yTop - (i / 110) * (yTop - yBot); perfT.push([rTr(y) - 0.018, y]); }
      perfT.push(perfT[0]);
      mesh(perfilTorneado(perfT, 56), matTejido, 0, 0, 0, injerto);
      // Costura longitudinal cosida a máquina (Voorhees cosía la tela en tubo)
      for(let k = 0; k < 9; k++){
        const y = 0.26 - k * 0.05, r = rTr(y) + 0.004;
        mesh(tuboCurvo([[-0.025, y, r - 0.006], [0, y + 0.02, r + 0.004], [0.025, y + 0.04, r - 0.006]], 0.006, 8, false, 5), matPyC, 0, 0, 0, injerto);
      }

      // Ramas ilíacas: nacen dentro del tronco (ocultando la unión) y se separan en una Y redondeada
      [-1, 1].forEach(s => {
        const pts = [[s * 0.07, -0.02, 0], [s * 0.11, -0.2, 0.01], [s * 0.22, -0.44, 0.03 * s], [s * 0.33, -0.7, 0.02 * s], [s * 0.38, -0.86, 0.01 * s]];
        mesh(tuboVariable(pts, u => 0.138 - 0.022 * u + corr(u, 13, 0.011, 0.12), 150, 22), matTejido, 0, 0, 0, injerto);
        // arteria ilíaca nativa que continúa la rama tras la anastomosis distal
        P(mesh(tuboVariable([[s * 0.375, -0.84, 0.01 * s], [s * 0.42, -0.98, 0.0], [s * 0.47, -1.12, -0.01 * s]], u => 0.112 - 0.01 * u, 20, 18), matVaso, 0, 0, 0, grupo), 'aorta');
      });
      // Carina: rellena el ángulo entre las dos ramas para que la bifurcación sea continua
      const carina = mesh(new THREE.SphereGeometry(0.1, 24, 18), matTejido, 0, -0.17, 0, injerto);
      carina.scale.set(1.15, 1.25, 1.05);

      grupo.rotation.set(0.1, -0.28, 0);
      return;
    }

    // 6) 1949: Segmento anterior ocular anatómico seccionado + iris texturizado + cuerpos ciliares + LIO biconvexa PMMA + hápticos finos
    if(anio === 1949){
      const ojo = new THREE.Group(); ojo.rotation.set(0.2, -0.4, 0); grupo.add(ojo);
      const phiL = Math.PI * 1.48;
      // Córnea transparente de grosor realista
      const corneaGeo = perfilTorneado([
        [0, 0.72], [0.34, 0.66], [0.66, 0.48], [0.88, 0.22], [0.95, -0.02],
        [0.88, -0.02], [0.81, 0.2], [0.6, 0.43], [0.31, 0.59], [0, 0.64]
      ], 48, 0, phiL);
      mesh(corneaGeo, matPMMA, 0, 0, 0, ojo).rotation.x = Math.PI / 2;

      // Esclerótica y cuerpo ciliar con procesos ciliares
      const escleraGeo = perfilTorneado([
        [0.95, -0.02], [0.99, -0.28], [0.88, -0.58], [0.64, -0.76], [0.57, -0.71], [0.81, -0.52], [0.9, -0.25], [0.88, -0.02]
      ], 44, 0, phiL);
      mesh(escleraGeo, matEsclera, 0, 0, 0, ojo).rotation.x = Math.PI / 2;

      // Cuerpo ciliar anular continuo ondulado con procesos ciliares (con phiL)
      const ciliarGeo = perfilTorneado([
        [0.88, -0.01], [0.895, -0.14], [0.89, -0.24], [0.79, -0.23],
        [0.74, -0.17], [0.77, -0.12], [0.73, -0.07], [0.79, -0.02], [0.88, -0.01]
      ], 96, 0, phiL);
      const cPos = ciliarGeo.attributes.position;
      for(let i = 0; i < cPos.count; i++){
        const vx = cPos.getX(i), vz = cPos.getZ(i);
        const r = Math.hypot(vx, vz);
        if(r > 0.01 && r < 0.84){
          const ang = Math.atan2(vx, vz);
          const wave = 1 + 0.042 * Math.sin(ang * 32);
          cPos.setX(i, vx * wave);
          cPos.setZ(i, vz * wave);
        }
      }
      ciliarGeo.computeVertexNormals();
      mesh(ciliarGeo, matCiliar, 0, 0, 0, ojo).rotation.x = Math.PI / 2;

      // Iris 3D biselado con relieve y mapeo UV radial
      const irisGeo = perfilTorneado([
        [0.85, 0.0], [0.85, 0.042], [0.64, 0.092], [0.41, 0.112],
        [0.36, 0.102], [0.36, 0.072], [0.41, 0.062], [0.64, 0.048], [0.85, 0.0]
      ], 56, 0, phiL);
      const iPos = irisGeo.attributes.position, iUv = irisGeo.attributes.uv;
      for(let i = 0; i < iPos.count; i++){
        iUv.setXY(i, 0.5 + iPos.getX(i) * (0.48 / 0.86), 0.5 + iPos.getZ(i) * (0.48 / 0.86));
      }
      P(mesh(irisGeo, matIris, 0, 0, 0, ojo), 'iris').rotation.x = Math.PI / 2;

      // Lente intraocular biconvexa de PMMA (Ridley) con bisel óptico
      const iolPerfil = [
        [0, -0.125], [0.2, -0.102], [0.39, -0.042], [0.43, -0.024],
        [0.43, 0.024], [0.39, 0.042], [0.2, 0.102], [0, 0.125]
      ];
      P(mesh(perfilTorneado(iolPerfil, 48), matVidrioBio, 0, 0, -0.06, ojo), 'optica').rotation.x = Math.PI / 2;

      // Hápticos finos en C/J de PMMA azul con simetría puntual real
      [-1, 1].forEach(s => {
        mesh(tuboVariable([
          [s * 0.42, s * 0.08, -0.06],
          [s * 0.68, s * 0.36, -0.06],
          [s * 0.56, s * 0.68, -0.06],
          [s * 0.16, s * 0.78, -0.06]
        ], u => 0.018 + (u > 0.88 ? 0.01 : 0), 28, 10), matHapt, 0, 0, 0, ojo).userData.parte = 'hapticos';
      });
      return;
    }

    // 7) 1952-1960: Válvula de bola Starr-Edwards (anillo de sutura, asiento pulido, jaula de 3 montantes que se unen
    //    suavemente en el vértice, bola de Silastic) + marcapasos Chardack-Greatbatch en epoxi con su interior real
    if(anio === 1952){
      const val = P(new THREE.Group(), 'jaula'); val.position.set(-0.56, -0.06, 0); grupo.add(val);
      // anillo de sutura de tela con relieve de punto
      const anillo = mesh(perfilTorneado([[0.42, -0.11], [0.57, -0.09], [0.62, 0], [0.57, 0.09], [0.42, 0.11], [0.39, 0]], 64), matTejido, 0, -0.24, 0, val);
      // asiento metálico pulido (orificio de paso de la sangre)
      mesh(perfilTorneado([[0.31, -0.12], [0.43, -0.11], [0.45, 0.08], [0.4, 0.13], [0.33, 0.1], [0.3, 0.02], [0.31, -0.12]], 64), matCoCr, 0, -0.24, 0, val);
      // 3 montantes: nacen del asiento, se abren alrededor de la bola y convergen tangentes en el vértice
      const vertice = new THREE.Vector3(0, 0.62, 0);
      for(let i = 0; i < 3; i++){
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6, c = Math.cos(a), s = Math.sin(a);
        mesh(tuboVariable([[c * 0.39, -0.16, s * 0.39], [c * 0.44, 0.08, s * 0.44], [c * 0.38, 0.38, s * 0.38], [c * 0.18, 0.58, s * 0.18], [c * 0.02, 0.62, s * 0.02]],
          u => 0.03 - 0.008 * Math.sin(u * Math.PI), 40, 12), matCoCr, 0, 0, 0, val);
      }
      const nudoV = mesh(new THREE.SphereGeometry(0.042, 24, 16), matCoCr, vertice.x, vertice.y, vertice.z, val);
      nudoV.scale.set(1, 0.7, 1);
      const bola = P(mesh(new THREE.SphereGeometry(0.29, 40, 30), matSilastic, 0, 0.02, 0, val), 'bola');

      // Marcapasos implantable Chardack-Greatbatch (1960): todo encapsulado en un disco de epoxi
      const mp = P(new THREE.Group(), 'marcapasos'); mp.position.set(0.62, -0.04, 0); mp.rotation.y = -0.25; grupo.add(mp);
      const cajaS = new THREE.Shape(); cajaS.absarc(0, 0, 0.44, 0, Math.PI * 2, false);
      mesh(extruirCentrado(cajaS, 0.22, { bevelThickness:0.045, bevelSize:0.04, bevelSegments:5, curveSegments:48 }), matEpoxi, 0, 0, 0, mp);
      // 10 pilas de mercurio-zinc en arco, juntas y soldadas en serie
      for(let k = 0; k < 10; k++){
        const a = Math.PI * (1.08 + k * 0.084);
        const x = Math.cos(a) * 0.3, y = Math.sin(a) * 0.3;
        const pila = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.11, 22), matCoCr, x, y, 0, mp); pila.rotation.x = Math.PI / 2;
        mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.115, 16), matOro, x, y, 0, mp).rotation.x = Math.PI / 2;
      }
      // placa de circuito con 2 transistores, resistencias y la bobina toroidal del oscilador
      mesh(new THREE.BoxGeometry(0.34, 0.2, 0.014), matPCB, 0, 0.1, -0.03, mp);
      [-0.08, 0.04].forEach(x => {
        mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 16), matCoCr, x, 0.12, 0.005, mp).rotation.x = Math.PI / 2;
        [-0.012, 0, 0.012].forEach(dx => mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 4), matOro, x + dx, 0.08, -0.01, mp));
      });
      [0.12, 0.155].forEach(x => { const r = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.07, 8), matCeramica, x, 0.11, 0.0, mp); });
      mesh(new THREE.TorusGeometry(0.045, 0.018, 10, 24), matOro, -0.2, 0.12, -0.005, mp);
      // conector superior: cuello metálico + manguito de silicona que sella la salida del electrodo
      mesh(perfilTorneado([[0.05, -0.04], [0.065, -0.03], [0.065, 0.06], [0.05, 0.07]], 24), matCoCr, 0, 0.47, 0, mp);
      mesh(perfilTorneado([[0.04, 0.0], [0.07, 0.02], [0.065, 0.14], [0.03, 0.2]], 24), matSilicona, 0, 0.5, 0, mp);
      // electrodo: cable en curva suave y punta helicoidal que se atornilla en el miocardio (hacia el vértice)
      const cable = [[0, 0.7, 0], [0.06, 0.88, 0.04], [0.26, 0.9, -0.06], [0.42, 0.6, -0.12], [0.44, 0.22, -0.08], [0.4, -0.02, -0.04]];
      mesh(tuboVariable(cable, 0.02, 60, 10), matUHMWPE, 0, 0, 0, mp);
      mesh(heliceGeo(0.022, 0.13, 3.2, 0.006, 90, 6), matPlatino, 0.4, -0.09, -0.04, mp);

      grupo.rotation.set(0.12, -0.18, 0);
      return t => {
        const s = Math.max(0, Math.sin(t * 2.2));
        bola.position.y = 0.0 + s * 0.2;
      };
    }

    // 8) 1958-1961: Artroplastia total de cadera de Charnley con corte frontal (+Z), fémur proximal alineado + manto PMMA + vástago curvo + cotilo UHMWPE
    if(anio === 1958){
      const bowX = y => -0.25 - 0.06 * Math.pow(Math.max(0, (y + 0.55) / 0.85), 1.6);
      const yOsteo = x => 0.15 - 0.65 * (x + 0.16);
      const adaptarFemur = (geo, yTopOrig, offsetTop = 0) => {
        const p = geo.attributes.position;
        for(let i = 0; i < p.count; i++){
          const x0 = p.getX(i), y0 = p.getY(i);
          const x = x0 + bowX(y0);
          p.setX(i, x);
          if(y0 > -0.25){
            const t = Math.min(1, (y0 + 0.25) / (yTopOrig + 0.25));
            p.setY(i, y0 + t * (yOsteo(x) + offsetTop - yTopOrig));
          }
        }
        geo.computeVertexNormals();
        return geo;
      };

      const femurGeo = adaptarFemur(perfilTorneado([
        [0, -0.96], [0.24, -0.96], [0.27, -0.45], [0.32, -0.05], [0.38, 0.22],
        [0.37, 0.42], [0.24, 0.42], [0.21, 0.16], [0.18, -0.35],
        [0.14, -0.90], [0, -0.90]
      ], 36, Math.PI * 0.45, Math.PI * 1.10), 0.42, 0);
      mesh(femurGeo, matHuesoCort, 0, 0, 0, grupo);

      const medulaGeo = adaptarFemur(perfilTorneado([
        [0, -0.90], [0.14, -0.90], [0.18, -0.30], [0.24, 0.16], [0.24, 0.41],
        [0.14, 0.41], [0.125, -0.25], [0.095, -0.84], [0, -0.84]
      ], 32, Math.PI * 0.47, Math.PI * 1.06), 0.41, -0.006);
      mesh(medulaGeo, matHuesoTrab, 0, 0, 0, grupo);

      // Manto orgánico continuo de cemento PMMA adaptado al canal medular (abertura hacia +Z)
      const cemFemGeo = adaptarFemur(perfilTorneado([
        [0, -0.86], [0.095, -0.86], [0.125, -0.28], [0.175, 0.16], [0.175, 0.40],
        [0, 0.40], [0, -0.86]
      ], 32, Math.PI * 0.48, Math.PI * 1.04), 0.40, -0.012);
      P(mesh(cemFemGeo, matCemento, 0, 0, 0, grupo), 'cemento');

      // Vástago femoral monobloque curvo de Charnley alojado dentro del manto PMMA y canal medular
      const vasS = new THREE.Shape();
      vasS.moveTo(-0.28, -0.78);
      vasS.quadraticCurveTo(-0.32, -0.28, -0.37, 0.16);
      vasS.quadraticCurveTo(-0.38, 0.29, -0.29, 0.30);
      vasS.quadraticCurveTo(-0.19, 0.23, -0.12, 0.18);
      vasS.lineTo(-0.16, 0.14);
      vasS.quadraticCurveTo(-0.20, -0.25, -0.22, -0.78);
      vasS.closePath();
      P(mesh(extruirCentrado(vasS, 0.068, { bevelThickness:0.014, bevelSize:0.012, bevelSegments:4 }), matCoCr, 0, 0, -0.01, grupo), 'vastago');

      const cuelloDir = new THREE.Vector3(0.68, 0.72, 0).normalize();
      const collar = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.024, 28), matCoCr, -0.17, 0.21, -0.01, grupo);
      collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cuelloDir); P(collar, 'vastago');
      const cuello = mesh(new THREE.CylinderGeometry(0.050, 0.078, 0.38, 28), matCoCr, -0.04, 0.35, -0.01, grupo);
      cuello.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cuelloDir); P(cuello, 'vastago');
      P(mesh(new THREE.SphereGeometry(0.165, 36, 28), matCoCr, 0.09, 0.49, -0.01, grupo), 'vastago');

      // Cotilo grueso de UHMWPE + marcador radiopaco + manto PMMA + reborde óseo acetabular abiertos hacia +Z
      const cupG = new THREE.Group(); cupG.position.set(0.09, 0.49, -0.01); cupG.rotation.z = -0.78; grupo.add(cupG);
      const uhmwGeo = perfilTorneado([[0.172, 0], [0.172, 0.07], [0.13, 0.14], [0, 0.175], [0, 0.35], [0.22, 0.3], [0.34, 0.14], [0.34, 0.1], [0.32, 0.08], [0.34, 0.05], [0.35, 0], [0.172, 0]], 40, Math.PI * 0.38, Math.PI * 1.24);
      P(mesh(uhmwGeo, matUHMWPE, 0, 0, 0, cupG), 'cotilo');
      const marc = mesh(new THREE.TorusGeometry(0.355, 0.011, 10, 32, Math.PI * 1.24), matCoCr, 0, 0.015, 0, cupG);
      marc.rotation.set(Math.PI / 2, 0, -Math.PI * 1.12);
      const cemCupGeo = perfilTorneado([[0.35, 0], [0.34, 0.14], [0.22, 0.3], [0, 0.35], [0, 0.42], [0.27, 0.36], [0.41, 0.16], [0.42, 0], [0.35, 0]], 36, Math.PI * 0.38, Math.PI * 1.24);
      P(mesh(cemCupGeo, matCemento, 0, 0, 0, cupG), 'cemento');
      const pelvisGeo = perfilTorneado([[0.42, 0], [0.41, 0.16], [0.27, 0.36], [0, 0.42], [0, 0.51], [0.33, 0.43], [0.49, 0.19], [0.5, 0], [0.42, 0]], 32, Math.PI * 0.40, Math.PI * 1.20);
      mesh(pelvisGeo, matHuesoCort, 0, 0, 0, cupG);

      grupo.rotation.set(0.08, -0.22, 0);
      return;
    }

    // 9) 1960-1968: Válvula bivalva de carbono pirolítico (PyC) + lente de contacto blanda de hidrogel PHEMA
    if(anio === 1960){
      const val = P(new THREE.Group(), 'pyc'); val.position.set(-0.44, 0.08, -0.12); val.rotation.x = 0.45; grupo.add(val);
      mesh(perfilTorneado([[0.58, -0.14], [0.76, -0.11], [0.82, 0], [0.76, 0.11], [0.58, 0.14], [0.54, 0]], 48), matTejido, 0, 0, 0, val);
      mesh(perfilTorneado([[0.5, -0.16], [0.59, -0.13], [0.59, 0.13], [0.5, 0.16], [0.48, 0.06], [0.48, -0.06]], 48), matPyC, 0, 0, 0, val);
      const guardaS = new THREE.Shape();
      guardaS.moveTo(-0.08, -0.11); guardaS.lineTo(0.08, -0.11);
      guardaS.quadraticCurveTo(0.06, 0.11, 0, 0.135);
      guardaS.quadraticCurveTo(-0.06, 0.11, -0.08, -0.11);
      const guardaGeo = extruirCentrado(guardaS, 0.055, { bevelThickness:0.012, bevelSize:0.012, bevelSegments:3 });
      [-0.465, 0.465].forEach(z => mesh(guardaGeo.clone(), matPyC, 0, 0.04, z, val));

      const valvaS = new THREE.Shape();
      valvaS.absarc(0, 0, 0.43, 0, Math.PI, false);
      valvaS.lineTo(-0.43, -0.028);
      valvaS.lineTo(0.43, -0.028);
      valvaS.closePath();
      const vGeo = extruirCentrado(valvaS, 0.026, { bevelThickness:0.007, bevelSize:0.007, bevelSegments:3 });
      const pivL = new THREE.Group(); pivL.position.set(-0.032, 0.04, 0); val.add(pivL);
      mesh(vGeo, matPyC, 0, 0, 0, pivL).rotation.set(Math.PI / 2, 0, Math.PI / 2);
      const pivR = new THREE.Group(); pivR.position.set(0.032, 0.04, 0); val.add(pivR);
      mesh(vGeo, matPyC, 0, 0, 0, pivR).rotation.set(Math.PI / 2, 0, -Math.PI / 2);

      const lenteGeo = perfilTorneado([[0, 0.14], [0.2, 0.12], [0.36, 0.05], [0.42, -0.02], [0.39, -0.03], [0.33, 0.03], [0.18, 0.095], [0, 0.11]], 44);
      P(mesh(lenteGeo, matHidrogel, 0.62, -0.22, 0.36, grupo), 'lente').rotation.x = 0.35;
      mesh(perfilTorneado([[0, -0.2], [0.38, -0.2], [0.4, -0.14], [0.16, -0.08], [0, -0.08]], 36), matTi, 0.62, -0.23, 0.36, grupo);

      grupo.rotation.set(0.1, -0.25, 0);
      return t => {
        const ang = -0.38 + ((Math.sin(t * 2.2) + 1) * 0.5) * 1.78;
        pivL.rotation.z = -ang; pivR.rotation.z = ang;
      };
    }

    // 10) 1952-1976: Osteointegración de Brånemark: corte transversal de cuerpo mandibular (cortical que rodea a la
    //     esponjosa, continua hasta las roscas) con implante de titanio puro, y muestra de hueso de conejo con la
    //     cámara óptica de titanio (ventana y reborde) con la que descubrió que el hueso se adhería al metal
    if(anio === 1964){
      const hueso = P(new THREE.Group(), 'hueso'); grupo.add(hueso);
      // Sección en lágrima: base ancha y redondeada, cresta alveolar estrecha
      const seccion = (esc) => {
        const sh = new THREE.Shape();
        for(let i = 0; i <= 72; i++){
          const th = Math.PI / 2 + (i / 72) * Math.PI * 2, s = Math.sin(th), c = Math.cos(th);
          const y = -0.1 + (s * 0.46 - (s < 0 ? s * s * 0.06 : 0)) * esc;
          const x = c * (0.34 - 0.09 * Math.max(0, s) + 0.02 * Math.max(0, -s)) * esc + Math.sin(th * 3) * 0.006;
          i ? sh.lineTo(x, y) : sh.moveTo(x, y);
        }
        return sh;
      };
      const prof = 0.8, frente = prof / 2;
      mesh(extruirCentrado(seccion(1), prof, { bevelThickness:0.02, bevelSize:0.016, bevelSegments:3, curveSegments:72 }), matHuesoCort, 0, 0, 0, hueso);
      mesh(extruirCentrado(seccion(0.8), prof + 0.05, { bevelThickness:0.004, bevelSize:0.004, bevelSegments:1, curveSegments:72 }), matHuesoTrab, 0, -0.02, 0, hueso);
      // trabéculas en la cara de corte, más densas en contacto con el implante (sin cápsula fibrosa)
      const zF = frente + 0.034, rngB = crearRng(1964);
      for(let i = 0; i < 14; i++){
        const x0 = (rngB() - 0.5) * 0.4, y0 = -0.5 + rngB() * 0.6;
        if(Math.abs(x0) < 0.17 && y0 > -0.42) continue;
        const x1 = x0 + (rngB() - 0.5) * 0.18, y1 = y0 + (rngB() - 0.5) * 0.16;
        mesh(tuboVariable([[x0, y0, zF], [(x0 + x1) / 2, (y0 + y1) / 2 + 0.015, zF + 0.003], [x1, y1, zF]], 0.009, 10, 6), matHuesoCort, 0, 0, 0, hueso);
      }
      for(let k = 0; k < 8; k++){
        const y = -0.38 + k * 0.08;
        [-1, 1].forEach(s => mesh(tuboVariable([[s * 0.13, y, zF], [s * 0.18, y + 0.012, zF + 0.003], [s * 0.24, y - 0.01, zF]], 0.009, 8, 6), matHuesoCort, 0, 0, 0, hueso));
      }
      // mucosa que rodea el cuello del implante sobre la cresta
      const muc = mesh(perfilTorneado([[0.13, 0.3], [0.2, 0.3], [0.22, 0.33], [0.17, 0.37], [0.13, 0.37]], 40, Math.PI / 2, Math.PI), matEncia, 0, 0, frente, hueso);

      // Implante roscado de titanio comercialmente puro, con su eje en el plano de corte
      const imp = P(tornilloBiomedico(grupo, { rMax:0.12, rTip:0.085, hCuerpo:0.72, vueltas:9, rFilete:0.026, hCuello:0.1, rCuello:0.125, tipoCabeza:'hex', mat:matTi, matRosca:matTi }), 'implante');
      imp.position.set(0, -0.08, frente + 0.02);

      // Muestra de hueso largo de conejo con la cámara óptica de titanio atornillada de lado a lado
      const cam = P(new THREE.Group(), 'camara'); cam.position.set(0.78, -0.3, 0.05); grupo.add(cam);
      const fib = mesh(perfilTorneado([[0.13, -0.32], [0.15, 0], [0.13, 0.32], [0.075, 0.32], [0.075, -0.32], [0.13, -0.32]], 32), matHuesoCort, 0, 0, 0, cam);
      fib.rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.074, 0.074, 0.63, 24), matHuesoTrab, 0, 0, 0, cam).rotation.z = Math.PI / 2;
      const cuerpo = new THREE.Group(); cuerpo.rotation.x = Math.PI / 2; cam.add(cuerpo);   // eje de la cámara hacia el visor
      mesh(perfilTorneado([[0.085, -0.2], [0.098, -0.2], [0.098, 0.16], [0.13, 0.18], [0.13, 0.23], [0.075, 0.23], [0.075, -0.2]], 36), matTi, 0, 0, 0, cuerpo);
      mesh(new THREE.TorusGeometry(0.1, 0.014, 12, 36), matCoCr, 0, 0.23, 0, cuerpo).rotation.x = Math.PI / 2;     // reborde óptico
      mesh(perfilTorneado([[0, 0.245], [0.05, 0.24], [0.076, 0.232], [0.076, 0.215], [0, 0.215]], 32), matPMMA, 0, 0, 0, cuerpo);   // ventana-lente
      mesh(new THREE.CylinderGeometry(0.074, 0.074, 0.01, 24), matHuesoTrab, 0, 0.02, 0, cuerpo);                   // fondo de la cámara
      const rngC = crearRng(52);
      for(let i = 0; i < 4; i++){
        const a = rngC() * Math.PI, y = 0.06 + i * 0.035;
        mesh(tuboVariable([[Math.cos(a) * 0.065, y, Math.sin(a) * 0.065], [0, y + 0.015, 0], [-Math.cos(a) * 0.065, y - 0.01, -Math.sin(a) * 0.065]], 0.007, 10, 6), matVaso, 0, 0, 0, cuerpo);
      }

      grupo.rotation.set(0.2, -0.34, 0);
      return;
    }

    // 11) 1966-1971: Fractura fijada con material biodegradable: dos fragmentos óseos que encajan por la línea de
    //     fractura, placa de PLA/PLGA con 4 tornillos reabsorbibles, membrana de ePTFE sobre el foco y sutura de PGA
    if(anio === 1966){
      const fractura = z => Math.sin(z * 13) * 0.045 + Math.sin(z * 29 + 1) * 0.02;   // perfil dentado de la rotura
      const w = 0.86, h = 0.44, d = 0.62, hueco = 0.018;
      const fragmento = (lado) => {
        const g = new THREE.Group(); grupo.add(g);
        const capa = (escW, escH, escD, mat, top, bot) => {
          const geo = superficieOrganica(w * escW, d * escD, 24, 16, top, bot);
          const p = geo.attributes.position, borde = w * escW / 2 - 0.001;
          for(let i = 0; i < p.count; i++){
            const x = p.getX(i);
            // el borde que mira a la fractura sigue el perfil dentado (el otro fragmento usa el mismo → encajan)
            if(lado < 0 ? x > borde : x < -borde) p.setX(i, x + fractura(p.getZ(i)) + lado * hueco);
          }
          geo.computeVertexNormals();
          return mesh(geo, mat, lado * w * escW / 2, 0, 0, g);
        };
        capa(1, 1, 1, matHuesoCort,
          (x, z) => h / 2 + Math.cos(z * 2.4) * 0.03 + Math.sin(x * 5 + z * 4) * 0.008,
          (x, z) => -h / 2 - Math.cos(z * 2.4) * 0.03 + Math.cos(x * 4 - z * 5) * 0.008);
        capa(0.995, 1, 1.03, matHuesoTrab,
          (x, z) => h * 0.3 + Math.sin(x * 7 + z * 6) * 0.014,
          (x, z) => -h * 0.3 + Math.cos(x * 6 - z * 7) * 0.014);
        return g;
      };
      const huesoG = P(new THREE.Group(), 'hueso'); grupo.add(huesoG);
      huesoG.add(fragmento(-1), fragmento(1));
      // pequeño hematoma en la línea de fractura
      mesh(tuboVariable(Array.from({ length:9 }, (_, i) => { const z = -0.28 + i * 0.07; return [fractura(z), h / 2 + Math.cos(z * 2.4) * 0.03 - 0.004, z]; }), 0.012, 24, 6), matVaso, 0, 0, 0, huesoG);

      // Placa de PLA/PLGA atornillada sobre la cara superior, cruzando la fractura
      const placa = P(new THREE.Group(), 'placa'); grupo.add(placa);
      const placaS = new THREE.Shape();
      placaS.moveTo(-0.72, -0.1);
      placaS.quadraticCurveTo(-0.48, -0.16, -0.22, -0.075); placaS.lineTo(0.22, -0.075);
      placaS.quadraticCurveTo(0.48, -0.16, 0.72, -0.1);
      placaS.quadraticCurveTo(0.8, 0, 0.72, 0.1);
      placaS.quadraticCurveTo(0.48, 0.16, 0.22, 0.075); placaS.lineTo(-0.22, 0.075);
      placaS.quadraticCurveTo(-0.48, 0.16, -0.72, 0.1);
      placaS.quadraticCurveTo(-0.8, 0, -0.72, -0.1);
      const xs = [-0.6, -0.3, 0.3, 0.6];
      xs.forEach(hx => { const ho = new THREE.Path(); ho.absarc(hx, 0, 0.046, 0, Math.PI * 2, true); placaS.holes.push(ho); });
      const yTop = h / 2 + 0.03;
      mesh(extruirCentrado(placaS, 0.05, { bevelThickness:0.012, bevelSize:0.012 }), matPLAPlaca, 0, yTop + 0.025, -0.06, placa).rotation.x = Math.PI / 2;
      xs.forEach(x => {
        const tw = tornilloBiomedico(placa, { rMax:0.04, rTip:0.024, hCuerpo:0.3, vueltas:5, rFilete:0.011, hCuello:0.03, rCuello:0.044, tipoCabeza:'avellanada', mat:matPLAPlaca, matRosca:matPLAPlaca });
        tw.position.set(x, yTop + 0.01 - 0.18, -0.06);
      });

      // Membrana de ePTFE cubriendo el foco de fractura por la cara frontal (curvada sobre el hueso)
      const memb = P(new THREE.Group(), 'eptfe'); grupo.add(memb);
      const zF = d / 2 + 0.012;
      const membGeo = superficieOrganica(0.62, 0.34, 20, 12, (x, z) => 0.006 + Math.sin(x * 22) * 0.0025, () => -0.004);
      const mM = mesh(membGeo, matEPTFE, 0, -0.02, zF, memb); mM.rotation.x = Math.PI / 2;

      // Sutura de PGA (violeta) fijando las 4 esquinas de la membrana al periostio
      const sut = P(new THREE.Group(), 'sutura'); grupo.add(sut);
      [[-0.27, 0.12], [0.27, 0.12], [-0.27, -0.16], [0.27, -0.16]].forEach(([x, y]) => {
        mesh(tuboCurvo([[x - 0.035, y, zF - 0.02], [x - 0.02, y + 0.012, zF + 0.025], [x + 0.02, y + 0.012, zF + 0.025], [x + 0.035, y, zF - 0.02]], 0.007, 16, false, 6), matPGA, 0, 0, 0, sut);
        const nudo = mesh(new THREE.TorusGeometry(0.012, 0.0055, 6, 14), matPGA, x, y + 0.02, zF + 0.026, sut);
        mesh(tuboCurvo([[x + 0.008, y + 0.026, zF + 0.028], [x + 0.03, y + 0.055, zF + 0.04]], 0.005, 6, false, 5), matPGA, 0, 0, 0, sut);
      });

      grupo.rotation.set(0.32, -0.36, 0);
      return;
    }

    // 12) 1969: Bioglass 45S5 (Hench) — cilindro multicapa orgánico con red de sílice, gel SiO2, alfombra de cristales HCA y colágeno mineralizado en hueso vivo
    if(anio === 1969){
      P(mesh(perfilTorneado([[0, -0.66], [0.76, -0.66], [0.78, -0.2], [0, -0.2]], 44), matVidrioBio, 0, 0, 0, grupo), 'vidrio');
      for(let i = 0; i < 6; i++){
        const a = (i / 6) * Math.PI * 2;
        mesh(tuboCurvo([[0, -0.46, 0], [Math.cos(a) * 0.42, -0.44, Math.sin(a) * 0.42], [Math.cos(a + 0.5) * 0.54, -0.34, Math.sin(a + 0.5) * 0.54]], 0.014, 12, false, 8), matHCA, 0, 0, 0, grupo);
      }

      mesh(perfilTorneado([[0, -0.2], [0.79, -0.2], [0.8, -0.05], [0, -0.05]], 44), matOro, 0, 0, 0, grupo);
      P(mesh(perfilTorneado([[0, -0.05], [0.8, -0.05], [0.79, 0.12], [0, 0.12]], 44), matHCA, 0, 0, 0, grupo), 'hca');

      const rng12 = crearRng(1969);
      for(let i = 0; i < 24; i++){
        const a = rng12() * Math.PI * 2, r = 0.1 + rng12() * 0.6;
        cristalHCA(grupo, Math.cos(a) * r, 0.1, Math.sin(a) * r, 0.02, 0.09 + rng12() * 0.07, matHCA, (rng12() - 0.5) * 0.45, (rng12() - 0.5) * 0.45);
      }
      for(let i = 0; i < 10; i++){
        const a = (i / 10) * Math.PI * 2, r = 0.46;
        mesh(tuboVariable([[Math.cos(a) * r * 0.72, 0.08, Math.sin(a) * r * 0.72], [Math.cos(a + 0.22) * r, 0.25, Math.sin(a + 0.22) * r], [Math.cos(a - 0.1) * r * 0.85, 0.44, Math.sin(a - 0.1) * r * 0.85]], 0.018, 16, 8), matColageno, 0, 0, 0, grupo);
      }
      // Sección cilíndrica orgánica de hueso esponjoso trabecular + cortical curvada sobre la capa HCA mineralizada
      const trabecGeo = perfilTorneado([
        [0, 0.36], [0.71, 0.37], [0.75, 0.46], [0.73, 0.56], [0, 0.56]
      ], 44);
      const tPos = trabecGeo.attributes.position;
      for(let i = 0; i < tPos.count; i++){
        const vx = tPos.getX(i), vy = tPos.getY(i), vz = tPos.getZ(i);
        if(Math.hypot(vx, vz) > 0.05){
          const dr = 1 + Math.sin(vx * 7 + vz * 5) * 0.024;
          tPos.setX(i, vx * dr); tPos.setZ(i, vz * dr);
        }
        tPos.setY(i, vy + Math.sin(vx * 5 + vz * 6) * 0.018);
      }
      trabecGeo.computeVertexNormals();
      P(mesh(trabecGeo, matHuesoTrab, 0, 0, 0, grupo), 'hueso');

      const cortGeo = perfilTorneado([
        [0, 0.55], [0.74, 0.55], [0.78, 0.64], [0.72, 0.72], [0.42, 0.77], [0, 0.79]
      ], 44);
      const cPos = cortGeo.attributes.position;
      for(let i = 0; i < cPos.count; i++){
        const vx = cPos.getX(i), vy = cPos.getY(i), vz = cPos.getZ(i);
        if(Math.hypot(vx, vz) > 0.05){
          const dr = 1 + Math.cos(vx * 6 - vz * 5) * 0.018;
          cPos.setX(i, vx * dr); cPos.setZ(i, vz * dr);
        }
        cPos.setY(i, vy + Math.cos(vx * 4 - vz * 5) * 0.016);
      }
      cortGeo.computeVertexNormals();
      P(mesh(cortGeo, matHuesoCort, 0, 0, 0, grupo), 'hueso');

      const rng69 = crearRng(69);
      for(let i = 0; i < 12; i++){
        const a0 = (i / 12) * Math.PI * 2 + rng69() * 0.25;
        const a1 = a0 + (rng69() - 0.5) * 0.45;
        const am = (a0 + a1) * 0.5;
        const y0 = 0.37 + rng69() * 0.06, y1 = 0.53 + rng69() * 0.04;
        mesh(tuboVariable([
          [Math.cos(a0) * 0.74, y0, Math.sin(a0) * 0.74],
          [Math.cos(am) * 0.77, (y0 + y1) * 0.5, Math.sin(am) * 0.77],
          [Math.cos(a1) * 0.75, y1, Math.sin(a1) * 0.75]
        ], u => 0.013 * (1.2 - 0.35 * Math.sin(u * Math.PI)), 10, 7), matHuesoCort, 0, 0, 0, grupo);
      }

      grupo.rotation.set(0.16, -0.3, 0);
      return;
    }

    // 13) 1978-1986: Arteria coronaria con sus 3 capas (adventicia, media e íntima), placa de ateroma orgánica
    //     con núcleo lipídico y calcio comprimida por un stent expandido de anillos sinusoidales, y guía con punta en J
    if(anio === 1978){
      const art = P(new THREE.Group(), 'pared'); art.rotation.z = Math.PI / 2; grupo.add(art);
      const L = 0.95, phi0 = Math.PI * 0.5, phiL = Math.PI * 1.4;
      const capaPared = (rIn, rOut, mat) => {
        const pts = [[rIn, -L], [rOut, -L], [rOut, L], [rIn, L], [rIn, -L]];
        mesh(perfilTorneado(pts, 64, phi0, phiL), mat, 0, 0, 0, art);
        // caras del corte para ver el grosor de cada capa
        [phi0, phi0 + phiL].forEach(ph => {
          const sh = new THREE.Shape(); sh.moveTo(rIn, -L); sh.lineTo(rOut, -L); sh.lineTo(rOut, L); sh.lineTo(rIn, L); sh.closePath();
          mesh(new THREE.ShapeGeometry(sh), mat, 0, 0, 0, art).rotation.y = ph - Math.PI / 2;
        });
      };
      capaPared(0.555, 0.66, matAdventicia);
      capaPared(0.445, 0.555, matMedia);
      capaPared(0.425, 0.445, matIntima);

      // Placa de ateroma excéntrica (pared trasera-inferior): grosor que se desvanece en los bordes
      const placaG = P(new THREE.Group(), 'placa'); art.add(placaG);
      const phC = Math.PI * 1.25, anchoPh = Math.PI * 0.42, Lp = 0.62;
      const espesor = (ph, y) => {
        const a = Math.max(0, 1 - ((ph - phC) / anchoPh) ** 2), b = Math.max(0, 1 - (y / Lp) ** 2);
        return 0.07 * Math.pow(a * b, 0.8) * (1 + 0.15 * Math.sin(ph * 9 + y * 7));
      };
      const perfP = []; for(let i = 0; i <= 30; i++){ const y = -Lp + (i / 30) * 2 * Lp; perfP.push([0.43, y]); }
      const placaGeo = perfilTorneado(perfP, 48, phC - anchoPh, anchoPh * 2);
      const pp = placaGeo.attributes.position;
      for(let i = 0; i < pp.count; i++){
        const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), ph = Math.atan2(x, z) < 0 ? Math.atan2(x, z) + Math.PI * 2 : Math.atan2(x, z);
        const r = 0.43 - espesor(ph, y);
        pp.setX(i, Math.sin(ph) * r); pp.setZ(i, Math.cos(ph) * r);
      }
      placaGeo.computeVertexNormals();
      mesh(placaGeo, matLipido, 0, 0, 0, placaG);
      // nódulos de calcio dentro de la placa
      const rngP = crearRng(1978);
      for(let i = 0; i < 7; i++){
        const ph = phC + (rngP() - 0.5) * anchoPh * 0.9, y = (rngP() - 0.5) * Lp * 1.2, r = 0.43 - espesor(ph, y) * 0.55;
        mesh(new THREE.DodecahedronGeometry(0.012 + rngP() * 0.012, 0), matCalcio, Math.sin(ph) * r, y, Math.cos(ph) * r, placaG);
      }

      // Stent expandido: anillos sinusoidales desfasados unidos por puentes cortos (malla continua)
      const stent = P(new THREE.Group(), 'stent'); grupo.add(stent);
      const nAn = 8, picos = 9, Ls = 1.36, paso = Ls / nAn, A = paso * 0.36;
      const rS = (x, a) => {   // radio local: el stent se hunde en la placa donde esta abulta
        const ph = ((Math.PI / 2 - a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);   // ángulo equivalente en el torno de la pared
        return 0.415 - espesor(ph, -x) * 0.75;
      };
      for(let k = 0; k < nAn; k++){
        const x0 = -Ls / 2 + (k + 0.5) * paso, fase = k % 2 ? Math.PI / picos : 0, pts = [];
        for(let i = 0; i < picos * 10; i++){
          const a = (i / (picos * 10)) * Math.PI * 2, x = x0 + A * Math.cos(picos * (a - fase)), r = rS(x, a);
          pts.push(new THREE.Vector3(x, Math.cos(a) * r, Math.sin(a) * r));
        }
        mesh(tuboCurvo(pts, 0.012, picos * 10, true, 6), matCoCr, 0, 0, 0, stent);
        if(k < nAn - 1){
          for(let b = 0; b < picos; b += 3){
            const a = fase + (b / picos) * Math.PI * 2 + (k % 2 ? 0 : 0), xA = x0 + A, xB = x0 + paso - A;
            mesh(tuboCurvo([[xA, Math.cos(a) * rS(xA, a), Math.sin(a) * rS(xA, a)], [xB, Math.cos(a) * rS(xB, a), Math.sin(a) * rS(xB, a)]], 0.01, 4, false, 6), matCoCr, 0, 0, 0, stent);
          }
        }
      }
      // Guía de angioplastia: recorre la luz y termina en una punta flexible en J
      const guia = [[-1.12, -0.02, 0.0], [-0.4, -0.04, 0.02], [0.4, -0.02, 0.0], [0.98, 0.0, 0.0], [1.12, 0.05, 0.0], [1.18, 0.14, 0.0], [1.13, 0.22, 0.0], [1.06, 0.2, 0.0]];
      mesh(tuboVariable(guia, u => u > 0.82 ? 0.009 : 0.011, 90, 8), matPlatino, 0, 0, 0, stent);

      grupo.rotation.set(0.3, -0.3, 0);
      return;
    }

    // 14) 1986-1993: Ingeniería de tejidos (Langer y Vacanti): andamio poroso de PLGA tipo espuma trabecular,
    //     red capilar ramificada que invade los poros y células (condrocitos/osteoblastos) adheridas a las trabéculas
    if(anio === 1986){
      const sc = P(andamioPoroso(grupo, { rx:0.8, ry:0.58, rz:0.58, n:95, enlaces:4, grosor:0.03, seed:1986, sep:0.23, maxLargo:2.0, radSegs:6 }), 'andamio');
      const nodos = sc.userData.nodos;

      // Red capilar: tronco que entra por un lado y se ramifica en dos niveles a través de los poros
      const vasos = P(new THREE.Group(), 'vasos'); grupo.add(vasos);
      const rama = (pts, r0, r1) => mesh(tuboVariable(pts, u => r0 + (r1 - r0) * u, 32, 10), matVaso, 0, 0, 0, vasos);
      rama([[-1.02, -0.2, 0.1], [-0.6, -0.1, 0.06], [-0.2, 0.0, 0.02], [0.12, 0.04, -0.02]], 0.05, 0.036);
      [[0.12, 0.04, -0.02]].forEach(o => {
        rama([o, [0.34, 0.2, 0.12], [0.56, 0.32, 0.22], [0.74, 0.3, 0.3]], 0.034, 0.016);
        rama([o, [0.32, -0.16, -0.14], [0.52, -0.3, -0.2], [0.7, -0.26, -0.3]], 0.032, 0.016);
      });
      rama([[-0.5, -0.12, 0.05], [-0.42, 0.14, 0.24], [-0.3, 0.36, 0.3]], 0.026, 0.012);
      rama([[-0.2, 0.0, 0.02], [-0.12, -0.24, 0.3], [0.0, -0.38, 0.38]], 0.024, 0.012);
      rama([[0.34, 0.2, 0.12], [0.3, 0.42, -0.06], [0.2, 0.5, -0.2]], 0.018, 0.01);

      // Células adheridas a nodos del andamio repartidos por todo el volumen
      const cel = P(new THREE.Group(), 'celulas'); grupo.add(cel);
      const elegidos = nodos.filter((_, i) => i % 6 === 0).slice(0, 10);
      elegidos.forEach((p, i) => celulaAdherida(cel, p.x, p.y + 0.045, p.z, 0.065, matMembrana, matNucleo, 80 + i));

      grupo.rotation.set(0.24, -0.4, 0);
      return;
    }

    // 15) 2018-actualidad (Chengdu): Nanopartícula lipídica con corte de 240°: bicapa de fosfolípidos visible en las
    //     caras del corte (cabezas hacia fuera y hacia dentro, colas enfrentadas), ARN de doble hélice en el núcleo,
    //     cepillo de PEG y anticuerpos de reconocimiento en la superficie
    const nano = new THREE.Group(); nano.rotation.set(0.2, -0.25, 0); grupo.add(nano);
    const phi0 = Math.PI * 0.25, phiL = Math.PI * 4 / 3;
    const R1 = 0.64, R2 = 0.6, R3 = 0.5, R4 = 0.46;      // cabezas ext. | colas | cabezas int.
    const casquete = (rA, rB, mat) => {
      const p = [];
      for(let i = 0; i <= 32; i++){ const a = (i / 32) * Math.PI; p.push([Math.sin(a) * rA, -Math.cos(a) * rA]); }
      for(let i = 32; i >= 0; i--){ const a = (i / 32) * Math.PI; p.push([Math.sin(a) * rB, -Math.cos(a) * rB]); }
      return mesh(perfilTorneado(p, 64, phi0, phiL), mat, 0, 0, 0, nano);
    };
    const bicapa = P(new THREE.Group(), 'bicapa'); nano.add(bicapa);
    bicapa.add(casquete(R1, R2, matCabezaLip), casquete(R2, R3, matColaLip), casquete(R3, R4, matCabezaLip));
    // Caras del corte: semicoronas con las tres bandas y fosfolípidos dibujados encima
    [phi0, phi0 + phiL].forEach((ph, cara) => {
      const plano = new THREE.Group(); plano.rotation.y = ph - Math.PI / 2; bicapa.add(plano);
      const banda = (rA, rB, mat) => {
        const sh = new THREE.Shape();
        sh.absarc(0, 0, rA, -Math.PI / 2, Math.PI / 2, false); sh.absarc(0, 0, rB, Math.PI / 2, -Math.PI / 2, true);
        mesh(new THREE.ShapeGeometry(sh, 32), mat, 0, 0, 0, plano);
      };
      banda(R1, R2, matCabezaLip); banda(R2, R3, matColaLip); banda(R3, R4, matCabezaLip);
      const off = cara ? -0.006 : 0.006;   // ligeramente fuera de cada cara para que se vean
      const n = 18, cabeza = new THREE.SphereGeometry(0.02, 10, 8);
      for(let i = 0; i <= n; i++){
        const a = -Math.PI / 2 + (i / n) * Math.PI, c = Math.cos(a), s = Math.sin(a);
        [[R1 - 0.02, R2 - 0.005], [R4 + 0.02, R3 + 0.005]].forEach(([rc, rt]) => {
          mesh(cabeza, matCabezaLip, c * rc, s * rc, off, plano);
          [-0.012, 0.012].forEach(da => {
            const aa = a + da / rc;
            mesh(tuboCurvo([[Math.cos(aa) * (rc + (rt - rc) * 0.25), Math.sin(aa) * (rc + (rt - rc) * 0.25), off], [Math.cos(aa) * rt, Math.sin(aa) * rt, off]], 0.006, 4, false, 5), matColaLip, 0, 0, 0, plano);
          });
        });
      }
    });

    // ARN de doble hélice: dos hebras antiparalelas y pares de bases que se tocan en el eje, sin tocar la pared
    const arn = P(new THREE.Group(), 'arn'); nano.add(arn);
    const H = 0.6, vueltas = 1.8, rH = 0.13;
    mesh(heliceGeo(rH, H, vueltas, 0.02, 120, 8), matVidrioBio, 0, 0, 0, arn);
    const hebra2 = mesh(heliceGeo(rH, H, vueltas, 0.02, 120, 8), matOro, 0, 0, 0, arn); hebra2.rotation.y = Math.PI;
    const nPares = 13;
    for(let i = 1; i < nPares; i++){
      const u = i / nPares, ang = u * vueltas * Math.PI * 2, y = (u - 0.5) * H;
      const p1 = [Math.cos(ang) * (rH - 0.012), y, Math.sin(ang) * (rH - 0.012)];
      const p2 = [-p1[0], y, -p1[2]];
      mesh(tuboCurvo([p1, [p1[0] * 0.04, y, p1[2] * 0.04]], 0.009, 4, false, 6), i % 2 ? matBaseA : matBaseB, 0, 0, 0, arn);
      mesh(tuboCurvo([p2, [p2[0] * 0.04, y, p2[2] * 0.04]], 0.009, 4, false, 6), i % 2 ? matBaseB : matBaseA, 0, 0, 0, arn);
    }

    // Superficie: cadenas de PEG y anticuerpos en Y, solo donde la cáscara existe (fuera del hueco del corte)
    const sup = P(new THREE.Group(), 'superficie'); nano.add(sup);
    const enCascara = dir => { let ph = Math.atan2(dir.x, dir.z); if(ph < phi0) ph += Math.PI * 2; return ph >= phi0 + 0.12 && ph <= phi0 + phiL - 0.12; };
    const rngN = crearRng(2018);
    let colocados = 0;
    for(let k = 0; k < 60 && colocados < 14; k++){
      const dir = new THREE.Vector3(rngN() * 2 - 1, rngN() * 2 - 1, rngN() * 2 - 1).normalize();
      if(!enCascara(dir)) continue;
      const gAnt = new THREE.Group(); gAnt.position.copy(dir.clone().multiplyScalar(R1 - 0.005));
      gAnt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); sup.add(gAnt);
      if(colocados % 2 === 0){
        mesh(tuboVariable([[0, 0, 0], [0, 0.15, 0]], 0.02, 8, 8), matOro, 0, 0, 0, gAnt);
        mesh(tuboVariable([[0, 0.14, 0], [-0.1, 0.28, 0]], 0.017, 8, 8), matOro, 0, 0, 0, gAnt);
        mesh(tuboVariable([[0, 0.14, 0], [0.1, 0.28, 0]], 0.017, 8, 8), matOro, 0, 0, 0, gAnt);
      } else {
        mesh(tuboVariable([[0, 0, 0], [0.04, 0.1, 0.02], [-0.03, 0.2, -0.02], [0.02, 0.29, 0.03]], u => 0.014 * (1 - u * 0.35), 14, 6), matVidrioBio, 0, 0, 0, gAnt);
      }
      colocados++;
    }
  };
}

/* ---- Modelos 3D histológicos para "Las tres generaciones" (quietos al abrir) ---- */
export function escenaGen3D(modoId){
  return (grupo) => {
    asegurarTexturas();
    const techo = huesoBloque(grupo, 2.02, 0.36, 1.12, { curva:0.07, seed:90, nTrab:12 });
    techo.position.set(0, 0.54, 0);

    // gen1: 1ª generación (bioinerte) — titanio mecanizado con micro-surcos + cápsula fibrosa de colágeno + fibroblastos fusiformes
    if(modoId === 'gen1'){
      const impGeo = superficieOrganica(2.02, 1.12, 36, 14,
        (x) => -0.02 + Math.abs(((x + 1.01) * 4.5) % 0.25 - 0.125) * 0.45,
        () => -0.44);
      mesh(impGeo, matTi, 0, 0, 0, grupo);

      const capGeo = superficieOrganica(1.98, 1.06, 28, 14,
        (x, z) => 0.35 + Math.sin(x * 4 + z * 3) * 0.018,
        (x, z) => -0.02 + Math.cos(x * 4 - z * 3) * 0.014);
      mesh(capGeo, matFibroso, 0, 0, 0, grupo);

      for(let f = 0; f < 6; f++){
        const z = -0.4 + f * 0.16;
        const y = 0.12 + (f % 2) * 0.09;
        const pts = [];
        for(let i = 0; i <= 18; i++){
          const x = -0.94 + (i / 18) * 1.88;
          pts.push([x, y + Math.sin(i * 0.75 + f) * 0.022, z]);
        }
        mesh(tuboCurvo(pts, 0.014, 24, false, 8), matColageno, 0, 0, 0, grupo);
      }
      [-0.55, 0, 0.55].forEach((x, idx) => {
        const fb = mesh(new THREE.SphereGeometry(0.08, 18, 12), matSilicona, x, 0.16, (idx % 2 ? 0.24 : -0.24), grupo);
        fb.scale.set(2.15, 0.36, 0.82);
      });
      grupo.rotation.set(0.14, -0.28, 0);
      return;
    }

    // gen2a: 2ª generación (bioactivo) — Bioglass 45S5 + gel SiO2 + capa cristalina HCA + colágeno mineralizado
    if(modoId === 'gen2a'){
      mesh(superficieOrganica(2.02, 1.12, 24, 14, (x, z) => -0.06 + Math.sin(x * 3 + z * 3) * 0.018, () => -0.46), matVidrioBio, 0, 0, 0, grupo);
      mesh(superficieOrganica(2.0, 1.08, 24, 14, (x, z) => 0.06 + Math.sin(x * 4 + z * 3) * 0.02, (x, z) => -0.065 + Math.sin(x * 3 + z * 3) * 0.018), matOro, 0, 0, 0, grupo);
      mesh(superficieOrganica(2.0, 1.08, 24, 14, (x, z) => 0.22 + Math.cos(x * 5 - z * 4) * 0.022, (x, z) => 0.055 + Math.sin(x * 4 + z * 3) * 0.02), matHCA, 0, 0, 0, grupo);

      const rngG2 = crearRng(204);
      for(let i = 0; i < 26; i++){
        const x = -0.88 + rngG2() * 1.76, z = -0.44 + rngG2() * 0.88;
        cristalHCA(grupo, x, 0.19, z, 0.022, 0.095 + rngG2() * 0.065, matHCA, (rngG2() - 0.5) * 0.35, (rngG2() - 0.5) * 0.35);
      }
      for(let i = 0; i < 10; i++){
        const x = -0.8 + i * 0.175, z = (i % 2 ? 0.25 : -0.25);
        mesh(tuboVariable([[x, 0.18, z], [x + 0.06, 0.30, z * 0.8], [x - 0.03, 0.42, z * 0.9]], 0.019, 14, 8), matColageno, 0, 0, 0, grupo);
      }
      grupo.rotation.set(0.14, -0.28, 0);
      return;
    }

    // gen2b: 2ª generación (biodegradable) — puntales porosos de PLA/PGA erosionados mientras descienden trabéculas y vasos sanguíneos
    if(modoId === 'gen2b'){
      for(let i = -2; i <= 2; i++){
        const pit = superficieOrganica(0.28, 0.86, 12, 14,
          (x, z) => 0.24 - Math.exp(-Math.pow((x - 0.04 * i) / 0.08, 2)) * 0.07 + Math.sin(z * 8 + i) * 0.02,
          () => -0.30);
        mesh(pit, matPLA, i * 0.4, -0.14, 0, grupo);
      }
      const trabBridge = new THREE.Group();
      trabBridge.position.set(0, 0.18, 0);
      grupo.add(trabBridge);
      trabeculasGrupo(trabBridge, 1.75, 0.34, 0.86, 12, matHuesoCort, 88);
      [-0.56, 0.08, 0.62].forEach((x, i) => {
        mesh(tuboVariable([[x, 0.40, (i - 1) * 0.2], [x + 0.08, 0.18, 0], [x - 0.06, -0.02, (1 - i) * 0.15]], u => 0.026 * (1 - u * 0.45), 18, 10), matVaso, 0, 0, 0, grupo);
      });
      const oGeo = new THREE.DodecahedronGeometry(0.034, 0);
      for(let i = 0; i < 10; i++){
        mesh(oGeo, i % 2 ? matPLA : matVidrioClaro, -0.76 + i * 0.17, 0.04 + (i % 3) * 0.08, (i % 3 - 1) * 0.28, grupo);
      }
      grupo.rotation.set(0.14, -0.28, 0);
      return;
    }

    // gen3: 3ª generación (regenerativo) — Scaffold 3D + árbol capilar angiogénico + osteoblastos + RGD
    const sc = new THREE.Group(); sc.position.set(0, -0.04, 0); grupo.add(sc);
    for(let k = -1; k <= 1; k++){
      mesh(new THREE.TorusGeometry(0.74, 0.024, 12, 42), matScaffold, 0, k * 0.27, 0, sc).rotation.x = Math.PI / 2;
      mesh(new THREE.TorusGeometry(0.4, 0.019, 10, 32), matScaffold, 0, k * 0.27, 0, sc).rotation.x = Math.PI / 2;
    }
    for(let i = 0; i < 8; i++){
      const a = (i / 8) * Math.PI * 2;
      mesh(tuboCurvo([[Math.cos(a) * 0.74, -0.35, Math.sin(a) * 0.74], [Math.cos(a + 0.3) * 0.68, 0, Math.sin(a + 0.3) * 0.68], [Math.cos(a) * 0.74, 0.40, Math.sin(a) * 0.74]], 0.02, 18, false, 8), matScaffold, 0, 0, 0, sc);
    }
    mesh(tuboVariable([[-0.85, 0.44, 0.15], [-0.35, 0.12, 0.08], [0.18, -0.05, -0.04], [0.82, -0.22, -0.18]], u => 0.044 * (1 - u * 0.35), 26, 12), matVaso, 0, 0, 0, sc);
    mesh(tuboVariable([[-0.22, 0.06, 0.04], [0.12, -0.26, 0.32], [0.54, -0.36, 0.4]], u => 0.028 * (1 - u * 0.5), 18, 10), matVaso, 0, 0, 0, sc);
    mesh(tuboVariable([[0.12, -0.02, -0.02], [-0.18, -0.28, -0.32], [-0.52, -0.38, -0.38]], u => 0.024 * (1 - u * 0.5), 18, 10), matVaso, 0, 0, 0, sc);

    [[0.48, 0.12, 0.44], [-0.46, -0.1, 0.42], [0.04, 0.2, -0.36], [-0.14, -0.24, 0.08]].forEach(([x, y, z], i) => {
      celulaAdherida(sc, x, y, z, 0.095, matMembrana, matNucleo, 120 + i);
    });
    for(let i = 0; i < 10; i++){
      const a = (i / 10) * Math.PI * 2 + 0.25;
      mesh(new THREE.OctahedronGeometry(0.032, 0), matOro, Math.cos(a) * 0.78, (i % 2 ? 0.14 : -0.14), Math.sin(a) * 0.78, sc);
    }
    grupo.rotation.set(0.14, -0.28, 0);
  };
}

/* ---- Partes inspeccionables de cada hito (chips de enfoque bajo el modelo 3D) ----
   id = userData.parte en la escena · nota = por qué importa esa pieza (una línea) */
const PARTES_HITO = {
  [-7000]: [
    { id:'sutura', label:'Sutura de lino', nota:'Fibra natural: aproxima los bordes de la herida, pero inflama y puede infectarse.' },
    { id:'aguja', label:'Aguja de hueso', nota:'Instrumento de hueso tallado; el ojo permite enhebrar la fibra.' },
    { id:'piel', label:'Dermis y subcutáneo', nota:'El tejido que hay que cerrar: cicatriza mejor cuanto mejor se juntan los bordes.' }
  ],
  200: [
    { id:'nacar', label:'Nácar (CaCO₃)', nota:'Dientes de concha tallada que el hueso maxilar llegó a integrar.' },
    { id:'hca', label:'Anillo de HCA', nota:'El carbonato del nácar pudo transformarse en hidroxiapatita, como un bioactivo actual.' },
    { id:'hierro', label:'Hierro oxidado', nota:'Implante galorromano: la corrosión del hierro lo hace poco estable en el cuerpo.' }
  ],
  1829: [
    { id:'hierro', label:'Placa de hierro', nota:'Se corroe en el medio fisiológico: la herrumbre y la reabsorción ósea aflojan los tornillos.' },
    { id:'platino', label:'Cerclaje de platino', nota:'Levert vio en perros que el platino era el mejor tolerado: solo una fina cápsula fibrosa.' },
    { id:'vitallium', label:'Vitallium (Co-Cr-Mo)', nota:'Aleación resistente a la corrosión (1937): el primer metal fiable para fijaciones duraderas.' }
  ],
  1943: [
    { id:'tambor', label:'Tambor de celofán', nota:'La sangre recorre el tubo de celofán, una membrana semipermeable que deja pasar la urea al baño.' },
    { id:'shunt', label:'Shunt de Scribner', nota:'Cánulas de teflón fijas en arteria y vena: permitieron dializar una y otra vez (1960).' }
  ],
  1947: [
    { id:'aorta', label:'Aorta y anastomosis', nota:'Sutura término-terminal entre la arteria nativa y la prótesis textil.' },
    { id:'injerto', label:'Injerto de Vinyon-N', nota:'La tela porosa se cubría de tejido del paciente: nacen las prótesis vasculares textiles.' }
  ],
  1949: [
    { id:'optica', label:'Óptica de PMMA', nota:'Ridley eligió el PMMA porque las astillas de cabina en los ojos de los pilotos no inflamaban.' },
    { id:'hapticos', label:'Hápticos en J', nota:'Brazos que centran la lente en el saco capsular, añadidos en diseños posteriores.' },
    { id:'iris', label:'Iris y córnea', nota:'La lente sustituye al cristalino opacificado, detrás del iris.' }
  ],
  1952: [
    { id:'jaula', label:'Jaula y asiento', nota:'Montantes de aleación de cobalto que limitan el recorrido de la bola.' },
    { id:'bola', label:'Bola de Silastic', nota:'Al subir abre el orificio y al bajar lo cierra: flujo en un solo sentido.' },
    { id:'marcapasos', label:'Marcapasos', nota:'Pilas y circuito sellados en epoxi y silicona para aislarlos de los fluidos corporales.' }
  ],
  1958: [
    { id:'vastago', label:'Vástago metálico', nota:'Cabeza femoral de 22 mm: pequeña para reducir el par de fricción (artroplastia de baja fricción).' },
    { id:'cotilo', label:'Cotilo UHMWPE', nota:'Tras el fracaso del PTFE, Charnley adoptó el polietileno de ultra alto peso molecular (1962).' },
    { id:'cemento', label:'Cemento PMMA', nota:'Rellena el hueco y reparte la carga entre implante y hueso: no es un pegamento.' }
  ],
  1960: [
    { id:'pyc', label:'Válvula de PyC', nota:'El carbono pirolítico resultó muy poco trombogénico: sigue en las válvulas mecánicas.' },
    { id:'lente', label:'Lente de PHEMA', nota:'Hidrogel de Wichterle y Lím: absorbe agua y queda blando y transparente.' }
  ],
  1964: [
    { id:'implante', label:'Implante de titanio', nota:'Titanio comercialmente puro: el hueso crece en contacto directo con su capa de óxido.' },
    { id:'hueso', label:'Cortical y esponjosa', nota:'No hay cápsula fibrosa entre hueso e implante: eso es la osteointegración.' },
    { id:'camara', label:'Cámara óptica', nota:'Brånemark no pudo retirarla del hueso del conejo: el hueso se había unido al titanio.' }
  ],
  1966: [
    { id:'placa', label:'Placa y tornillos de PLA', nota:'Se degradan por hidrólisis y el hueso recupera la carga poco a poco: no hay que retirarlos.' },
    { id:'eptfe', label:'Membrana de ePTFE', nota:'Politetrafluoroetileno expandido: poroso, inerte y no degradable.' },
    { id:'sutura', label:'Sutura de PGA', nota:'Ácido poliglicólico: la primera sutura sintética reabsorbible (Dexon, 1970).' }
  ],
  1969: [
    { id:'vidrio', label:'Vidrio 45S5', nota:'45 % SiO₂, 24,5 % Na₂O, 24,5 % CaO y 6 % P₂O₅ (en peso).' },
    { id:'hca', label:'Capa HCA', nota:'En contacto con el fluido se forma hidroxiapatita carbonatada que se une al hueso.' },
    { id:'hueso', label:'Hueso vivo', nota:'Se une químicamente al vidrio sin cápsula fibrosa: el primer material bioactivo.' }
  ],
  1978: [
    { id:'pared', label:'Pared arterial', nota:'Tres capas: adventicia (externa), media (músculo liso) e íntima (endotelio).' },
    { id:'placa', label:'Placa de ateroma', nota:'Núcleo lipídico con calcio que estrecha la luz; el stent la comprime contra la pared.' },
    { id:'stent', label:'Stent y guía', nota:'Malla metálica expandida con balón que mantiene abierta la arteria (Palmaz).' }
  ],
  1986: [
    { id:'andamio', label:'Andamio poroso', nota:'Poros interconectados para que entren células y vasos; se reabsorbe mientras crece el tejido.' },
    { id:'vasos', label:'Red capilar', nota:'Sin vasos no llega oxígeno: la vascularización limita el grosor del tejido fabricado.' },
    { id:'celulas', label:'Células sembradas', nota:'Langer y Vacanti sembraron células sobre polímeros degradables.' }
  ],
  2018: [
    { id:'bicapa', label:'Bicapa lipídica', nota:'Cabezas polares hacia el agua y colas hidrófobas enfrentadas en el centro.' },
    { id:'arn', label:'ARN en el núcleo', nota:'La carga terapéutica viaja protegida dentro de la partícula.' },
    { id:'superficie', label:'PEG y anticuerpos', nota:'El PEG retrasa su eliminación y los anticuerpos la dirigen a su célula diana.' }
  ]
};

/* ---- 1 · Línea temporal: hitos, consensos y conceptos ---- */
function lineaTemporal(contenedor, { datos }){
  const hitos = (datos.hitos || []).slice().sort((a, b) => a.anio - b.anio);
  if(!hitos.length) return sinDatos(contenedor, 'hitos');
  const r = raiz(contenedor, 'linea');
  const eras = [...new Set(hitos.map(h => h.era))];
  let sel = 0;

  r.innerHTML = `
    <p class="actv-intro">Recorre los ${hitos.length} hitos con las flechas del teclado o tocando cada año. El color indica la generación de biomateriales.</p>
    <div class="lt-eras" role="group" aria-label="Saltar a una época">
      ${eras.map(e => `<button class="chip" data-era="${esc(e)}">${esc(e)}</button>`).join('')}
    </div>
    <div class="lt-pista" role="listbox" aria-label="Hitos">
      ${hitos.map((h, k) => `<button class="lt-hito g${genDe(h.generacion)}" role="option" data-k="${k}" aria-selected="false">
        <span class="punto"></span><b>${anioTxt(h.anio)}</b><span class="tit">${esc(h.titulo)}</span></button>`).join('')}
    </div>
    <div class="lt-leyenda" aria-hidden="true"><span class="g0">Antes de las generaciones</span><span class="g1">1ª generación</span><span class="g2">2ª generación</span><span class="g3">3ª generación</span></div>
    <article class="lt-ficha" aria-live="polite"><div class="lt-split"><div class="lt-izq"><div id="lt3d"></div><div class="lt-partes" role="group" aria-label="Inspeccionar partes del modelo"></div><p class="lt-parte-nota"></p></div><div class="lt-info"></div></div></article>
    <div class="lt-nav"><button class="btn-secundario" id="ltPrev">Hito anterior</button><button class="btn-secundario" id="ltNext">Hito siguiente</button></div>
    ${(datos.normas || []).length ? `<h3 class="actv-sub">Las definiciones de consenso</h3>
    <div class="lt-normas">${datos.normas.map(n => `<div class="lt-norma"><b>${esc(n.codigo)}</b><span>${esc(n.titulo)}</span><p>${esc(n.clave)}</p><p class="dim">${esc(n.alcance)}</p></div>`).join('')}</div>` : ''}
    ${(datos.conceptos || []).length ? `<h3 class="actv-sub">Conceptos clave</h3>
    <div class="lt-conceptos">${datos.conceptos.map(c => `<details><summary>${esc(c.titulo)}</summary>
      <p>${esc(c.definicion)}</p>${c.detalle ? `<p class="dim">${esc(c.detalle)}</p>` : ''}${c.ejemplo ? `<p class="ej"><b>Ejemplo:</b> ${esc(c.ejemplo)}</p>` : ''}</details>`).join('')}</div>` : ''}`;

  const botones = [...r.querySelectorAll('.lt-hito')], ficha = r.querySelector('.lt-ficha'), info = r.querySelector('.lt-info');
  const visorHito = montarVisor3D(r.querySelector('#lt3d'), escenaHito3D(hitos[0].anio), { camPos:[0.2, 0.85, 3.45], autoGiro:false });
  const barraPartes = r.querySelector('.lt-partes'), notaParte = r.querySelector('.lt-parte-nota');
  const NOTA_GENERAL = 'Toca una pieza para acercarte a ella.';
  function pintarPartes(anio){
    const partes = PARTES_HITO[anio] || [];
    barraPartes.hidden = notaParte.hidden = !partes.length;
    barraPartes.innerHTML = [{ id:'', label:'Vista general' }, ...partes]
      .map((p, k) => `<button class="chip${k ? '' : ' on'}" data-parte="${esc(p.id)}" aria-pressed="${k ? 'false' : 'true'}">${esc(p.label)}</button>`).join('');
    notaParte.textContent = NOTA_GENERAL;
    barraPartes.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
      const parte = partes.find(p => p.id === c.dataset.parte);
      if(parte) visorHito.enfocarParte(parte.id); else visorHito.vistaGeneral();
      barraPartes.querySelectorAll('.chip').forEach(o => { o.classList.toggle('on', o === c); o.setAttribute('aria-pressed', o === c); });
      notaParte.textContent = parte ? parte.nota : NOTA_GENERAL;
    }));
  }
  function elegir(k, desplazar = true){
    sel = Math.max(0, Math.min(hitos.length - 1, k)); const h = hitos[sel];
    botones.forEach((b, j) => { b.classList.toggle('on', j === sel); b.setAttribute('aria-selected', j === sel); });
    if(desplazar) botones[sel].scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
    r.querySelectorAll('.lt-eras .chip').forEach(c => c.classList.toggle('on', c.dataset.era === h.era));
    ficha.className = `lt-ficha g${genDe(h.generacion)}`;
    visorHito.reemplazar(escenaHito3D(h.anio));
    pintarPartes(h.anio);
    info.innerHTML = `
      <p class="lt-contador">Hito ${sel + 1} de ${hitos.length}</p>
      <p class="lt-fecha">${esc(h.fecha)} <span class="etq">${esc(h.era)}</span> <span class="etq">${esc(h.generacion)}</span></p>
      <h3>${esc(h.titulo)}</h3>
      <p>${esc(h.descripcion)}</p>
      <dl><div><dt>Protagonistas</dt><dd>${esc(h.protagonista)}</dd></div><div><dt>Material</dt><dd>${esc(h.material)}</dd></div></dl>`;
    const prevBtn = r.querySelector('#ltPrev'), nextBtn = r.querySelector('#ltNext');
    prevBtn.disabled = sel === 0; nextBtn.disabled = sel === hitos.length - 1;
    if(document.activeElement === prevBtn && prevBtn.disabled) nextBtn.focus({ preventScroll:true });
    else if(document.activeElement === nextBtn && nextBtn.disabled) prevBtn.focus({ preventScroll:true });
  }
  botones.forEach((b, k) => b.addEventListener('click', () => elegir(k)));
  r.querySelectorAll('.lt-eras .chip').forEach(c => c.addEventListener('click', () => {
    const idxEra = hitos.findIndex(h => h.era === c.dataset.era);
    if(idxEra >= 0) elegir(idxEra);
  }));
  r.querySelector('#ltPrev').addEventListener('click', () => elegir(sel - 1));
  r.querySelector('#ltNext').addEventListener('click', () => elegir(sel + 1));
  r.addEventListener('keydown', e => {
    if(e.target.closest('details')) return;
    if(e.key === 'ArrowRight'){ e.preventDefault(); elegir(sel + 1); }
    if(e.key === 'ArrowLeft'){ e.preventDefault(); elegir(sel - 1); }
  });
  elegir(0, false); r.focus({ preventScroll:true });
}

/* ---- 2 · ¿Implante, prótesis o ambos? Clasificador en una matriz 2×2 ---- */
const SEMAFORO = { rojo:'#FF7A8A', ambar:'#FFD98A', verde:'#5FF2D2' };
const semaforoDe = (s) => SEMAFORO[s] ? s : 'verde';

// Silueta humana frontal (viewBox 0..100) con un punto en la zona del dispositivo.
// El punto es neutro hasta que se responde; después toma el color del semáforo regulatorio.
function svgSilueta(xy, semaforo){
  const [x, y] = Array.isArray(xy) && xy.length === 2 ? xy.map(Number) : [50, 50];
  const color = semaforo ? (SEMAFORO[semaforo] || 'var(--bio)') : '#F4EFFF';
  return `<svg class="cl-silueta" viewBox="0 0 100 100" aria-hidden="true">
    <g class="cuerpo">
      <circle cx="50" cy="10.5" r="5.6"/>
      <path d="M47.6 15.6 L47.6 18 M52.4 15.6 L52.4 18"/>
      <path d="M44 18.2 Q50 16.6 56 18.2 L61.5 20.6 Q64 21.8 64.4 25 L66.4 43.5 L68.6 51.5 Q69 53.8 67.4 53.6 L65.6 52.6 L62.4 44.8 L60.8 31.5 L60 47 Q61 52 60.2 56 L58.2 92.8 Q58 95 55.8 95 L53.4 95 Q52 95 51.9 93.2 L51 59.6 L49 59.6 L48.1 93.2 Q48 95 46.6 95 L44.2 95 Q42 95 41.8 92.8 L39.8 56 Q39 52 40 47 L39.2 31.5 L37.6 44.8 L34.4 52.6 L32.6 53.6 Q31 53.8 31.4 51.5 L33.6 43.5 L35.6 25 Q36 21.8 38.5 20.6 Z"/>
    </g>
    <circle class="halo" cx="${x}" cy="${y}" r="5" fill="${color}"/>
    <circle cx="${x}" cy="${y}" r="2.1" fill="${color}"/>
  </svg>`;
}

// Icono lineal (24×24, color del texto) según el tipo de dispositivo
function svgIconoDispositivo(nombre = ''){
  const n = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const trazos = [
    ['cadera', '<circle cx="15.5" cy="6" r="3.2"/><path d="M13.4 8.4 9.6 11.8 8.4 21h3l1.2-8.2 3-3.2"/>'],
    ['dentadura', '<path d="M4 9.5Q12 3 20 9.5l-1 5.5Q12 19.5 5 15z"/><path d="M8.5 7.6v5.2M12 6.6v6.4M15.5 7.6v5.2"/>'],
    ['tornillo', '<path d="M8.5 3h7v3h-7z"/><path d="M10 6v12.5l2 2.5 2-2.5V6"/><path d="M10 9.5l4-1.6M10 13l4-1.6M10 16.5l4-1.6"/>'],
    ['piercing', '<path d="M7.5 12h9"/><circle cx="5.2" cy="12" r="2.3"/><circle cx="18.8" cy="12" r="2.3"/>'],
    ['stent', '<path d="M3 7.5h18M3 16.5h18"/><path d="M4.5 7.5l2 9 2-9 2 9 2-9 2 9 2-9 2 9 2-9"/>'],
    ['marcapasos', '<rect x="3.5" y="9" width="11.5" height="11" rx="4.5"/><path d="M15 12.5Q20.5 11 20 3.5"/><path d="M6 14.8h2l1.2-2.2 1.6 4.4 1.2-2.2h1.5"/>'],
    ['lente', '<circle cx="12" cy="12" r="4.8"/><path d="M7.4 10.6Q3.6 8 6.2 3.6M16.6 13.4q3.8 2.6 1.2 7"/>'],
    ['valvula', '<ellipse cx="12" cy="19" rx="7.5" ry="2.2"/><path d="M5.6 18.4Q6.6 6 12 3.6q5.4 2.4 6.4 14.8"/><circle cx="12" cy="13" r="3"/>'],
    ['pierna', '<path d="M9 3h6v5.5l-1.6 2.2V18M10.6 10.7V18"/><path d="M7.6 18h8.6l1.2 3H6.4z"/>'],
    ['bisturi', '<path d="M3.5 20.5l9.5-9.5"/><path d="M13 11l7.5-7.5c0 4.6-3 7.5-7.5 7.5z"/>']
  ];
  const t = (trazos.find(([k]) => n.includes(k)) || [null, '<circle cx="12" cy="12" r="7"/>'])[1];
  return `<svg class="cl-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t}</svg>`;
}
const CASILLAS = [
  { dentro:true,  reemplaza:true,  nombre:'Implante y prótesis' },
  { dentro:false, reemplaza:true,  nombre:'Prótesis (no implante)' },
  { dentro:true,  reemplaza:false, nombre:'Implante (no prótesis)' },
  { dentro:false, reemplaza:false, nombre:'Ni implante ni prótesis' }
];
function implanteOProtesis(contenedor, { datos }){
  const banco = (datos.datos || []).filter(d => d.dispositivo && typeof d.en_el_cuerpo === 'boolean' && typeof d.reemplaza_aumenta === 'boolean');
  if(!banco.length) return sinDatos(contenedor, 'dispositivos para clasificar');
  const r = raiz(contenedor, 'clasif');
  let orden, i, aciertos, respondido;
  const acierto = new Map();

  function empezar(){ orden = barajar(banco); i = 0; aciertos = 0; acierto.clear(); pintar(); }
  function pintar(){
    respondido = false;
    r.innerHTML = `
      <div class="test-progreso"><span style="width:${Math.round((i / orden.length) * 100)}%"></span></div>
      <p class="actv-intro">Coloca cada dispositivo en su casilla. Un <b>implante</b> se coloca a propósito dentro del cuerpo; una <b>prótesis</b> reemplaza o aumenta una parte del cuerpo. Puede ser las dos cosas, una o ninguna.</p>
      <div class="cl-cabecera">
        <div class="cl-ficha-dispositivo">
          ${svgSilueta(orden[i].silueta_xy, null)}
          <div class="cl-carta"><span class="dim">Dispositivo ${i + 1} de ${orden.length}</span>
            <b>${svgIconoDispositivo(orden[i].dispositivo)}${esc(orden[i].dispositivo)}</b>
            ${orden[i].zona_anatomica ? `<span class="cl-zona">${esc(orden[i].zona_anatomica)}</span>` : ''}</div>
        </div>
        <p class="cl-marcador">${aciertos} ${aciertos === 1 ? 'acierto' : 'aciertos'}</p>
      </div>
      <div class="cl-matriz">
        <span class="cl-eje x">¿Se coloca dentro del cuerpo?</span>
        <span class="cl-col c1">Sí</span><span class="cl-col c2">No</span>
        <span class="cl-eje y">¿Reemplaza o aumenta una parte del cuerpo?</span>
        <span class="cl-fila f1">Sí</span>
        ${CASILLAS.slice(0, 2).map((c, k) => `<button class="cl-casilla" data-k="${k}" style="grid-area:${'ab'[k]}"><span>${c.nombre}</span><div class="cl-fichas"></div></button>`).join('')}
        <span class="cl-fila f2">No</span>
        ${CASILLAS.slice(2).map((c, k) => `<button class="cl-casilla" data-k="${k + 2}" style="grid-area:${'cd'[k]}"><span>${c.nombre}</span><div class="cl-fichas"></div></button>`).join('')}
      </div>
      <div class="cl-feedback" aria-live="polite"></div>`;
    orden.slice(0, i).forEach(d => ponerFicha(d, acierto.get(d)));
    r.querySelectorAll('.cl-casilla').forEach(b => b.addEventListener('click', () => responder(+b.dataset.k)));
    r.focus({ preventScroll:true });
  }
  const casillaDe = (d) => CASILLAS.findIndex(c => c.dentro === d.en_el_cuerpo && c.reemplaza === d.reemplaza_aumenta);
  function ponerFicha(d, ok){ r.querySelectorAll('.cl-casilla')[casillaDe(d)].querySelector('.cl-fichas').appendChild(el(`<span class="cl-ficha ${ok ? 'ok' : 'ko'}">${esc(d.dispositivo)}</span>`)); }
  function responder(k){
    if(respondido) return; respondido = true;
    const d = orden[i], buena = casillaDe(d), ok = k === buena;
    acierto.set(d, ok); if(ok) aciertos++;
    ponerFicha(d, ok);
    const cas = r.querySelectorAll('.cl-casilla');
    cas.forEach(b => b.disabled = true);
    cas[buena].classList.add('buena'); if(!ok) cas[k].classList.add('mala');
    r.querySelector('.cl-marcador').textContent = `${aciertos} ${aciertos === 1 ? 'acierto' : 'aciertos'}`;
    const sil = r.querySelector('.cl-silueta');
    if(sil) sil.outerHTML = svgSilueta(d.silueta_xy, semaforoDe(d.semaforo));
    const ultima = i === orden.length - 1;
    const fb = r.querySelector('.cl-feedback');
    fb.innerHTML = `<p class="dim">¿Dentro del cuerpo?: <b>${d.en_el_cuerpo ? 'Sí' : 'No'}</b> · ¿Reemplaza o aumenta?: <b>${d.reemplaza_aumenta ? 'Sí' : 'No'}</b></p>
      <div class="test-explica ${ok ? 'ok' : 'ko'}"><b>${ok ? 'Correcto' : 'No es esa casilla'}: ${esc(d.clasificacion || CASILLAS[buena].nombre)}.</b>${d.explicacion ? `<p>${esc(d.explicacion)}</p>` : ''}</div>
      ${d.clase_mdr || d.exigencia_iso10993 ? `<div class="cl-regula sem-${semaforoDe(d.semaforo)}">
        <p class="cl-regula-cab"><span class="punto" aria-hidden="true"></span>${d.clase_mdr ? `<span class="clase">${esc(d.clase_mdr)}</span>` : ''}<span class="iso">ISO 10993</span></p>
        ${d.exigencia_iso10993 ? `<p>${esc(d.exigencia_iso10993)}</p>` : ''}
      </div>` : ''}
      <button class="btn-primario" id="clSigue">${ultima ? 'Ver resultado' : 'Siguiente dispositivo'}</button>`;
    const b = fb.querySelector('#clSigue'); b.focus({ preventScroll:true });
    fb.scrollIntoView({ block:'nearest', behavior:'smooth' });
    b.addEventListener('click', () => { if(ultima) final(); else { i++; pintar(); } });
  }
  function final(){
    const n = orden.length;
    const prog = r.querySelector('.test-progreso span');
    if(prog) prog.style.width = '100%';
    r.querySelector('.cl-cabecera').innerHTML = `<div class="cl-carta"><span class="dim">Resultado</span><b>${aciertos} de ${n} bien clasificados</b></div>`;
    r.querySelector('.cl-feedback').innerHTML = `<p class="actv-intro">${aciertos === n ? 'Clasificación perfecta.' : 'Las fichas en rojo son las que fallaste: ya están en su casilla correcta.'}</p>
      <button class="btn-primario" id="clOtra">Volver a empezar</button>`;
    r.querySelector('#clOtra').addEventListener('click', empezar);
    r.querySelector('#clOtra').focus({ preventScroll:true });
  }
  r.addEventListener('keydown', e => {
    if(respondido && e.key === 'Enter' && !e.target.closest('button')){
      const sig = r.querySelector('#clSigue');
      if(sig){ e.preventDefault(); sig.click(); }
      return;
    }
    if(!respondido && !e.ctrlKey && !e.metaKey && !e.altKey){
      const k = ['1', '2', '3', '4'].indexOf(e.key);
      if(k >= 0 && r.querySelector(`.cl-casilla[data-k="${k}"]:not(:disabled)`)){
        e.preventDefault();
        responder(k);
      }
    }
  });
  empezar();
}

/* ---- 3 · Las tres generaciones: recorrido paso a paso y tabla comparativa ---- */
function nombreCorto(n = ''){ const t = (n.split(':')[1] || n).trim(); return t.charAt(0).toUpperCase() + t.slice(1); }
function tresGeneraciones(contenedor, { datos }){
  const gens = (datos.generaciones || []).slice().sort((a, b) => a.numero - b.numero);
  if(!gens.length) return sinDatos(contenedor, 'generaciones');
  const r = raiz(contenedor, 'gens');
  let sel = 0, comparar = false, vista = '3d', gen2Modo = 'gen2a', raf = 0, visor3d = null;
  const lista = (arr) => (arr || []).map(t => `<li>${esc(t)}</li>`).join('');
  const modoDeSel = () => gens[sel]?.numero === 1 ? 'gen1' : gens[sel]?.numero === 2 ? gen2Modo : 'gen3';
  const ROTULOS_2D = {
    gen1:  { texto:'Reacción a cuerpo extraño · fibroblastos', color:'#FFB6BE' },
    gen2a: { texto:'Intercambio Ca²⁺ / PO₄³⁻ → apatita HCA',  color:'#5FF2D2' },
    gen2b: { texto:'Escisión hidrolítica de enlaces éster',    color:'#FFD98A' },
    gen3:  { texto:'Adhesión integrina–RGD + VEGF',            color:'#D7C6FF' }
  };

  function dibujar2D(ts, cv){
    if(!cv || !document.body.contains(cv)){ cancelAnimationFrame(raf); return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 580, H = 260;
    if(cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)){
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    const ctx2 = cv.getContext('2d');
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = reduceMotion ? 0.5 : ts * 0.001, m = modoDeSel();
    ctx2.fillStyle = '#0B0A24'; ctx2.fillRect(0, 0, W, H);
    ctx2.fillStyle = 'rgba(230,215,184,0.16)'; ctx2.fillRect(0, 0, W, 105);
    ctx2.textAlign = 'left';
    ctx2.fillStyle = '#E6D7B8'; ctx2.font = '600 13px Sora, sans-serif';
    ctx2.fillText('TEJIDO HUÉSPED / HUESO VIVO', 16, 24);
    const rot = ROTULOS_2D[m];
    if(rot){
      ctx2.save();
      ctx2.font = '500 12px Sora, sans-serif';
      ctx2.textAlign = 'right';
      ctx2.fillStyle = rot.color;
      ctx2.fillText(rot.texto, W - 16, 24);
      ctx2.restore();
    }
    if(m === 'gen1'){
      ctx2.fillStyle = '#4A588A'; ctx2.fillRect(0, 165, W, 95);
      ctx2.fillStyle = '#9FB4FF'; ctx2.fillText('IMPLANTE BIOINERTE (Ti / Al₂O₃)', 16, 238);
      ctx2.fillStyle = 'rgba(255,140,154,0.22)'; ctx2.fillRect(0, 110, W, 50);
      ctx2.strokeStyle = '#FF9AA5'; ctx2.lineWidth = 2.5;
      for(let row = 0; row < 3; row++){ ctx2.beginPath(); for(let x = 0; x <= W; x += 12){ const y = 122 + row * 13 + Math.sin(x * 0.04 + t * 1.5 + row) * 3; x ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y); } ctx2.stroke(); }
      ctx2.fillStyle = '#FFB6BE'; ctx2.fillText('Cápsula fibrosa aislante (sin enlace químico)', 16, 140);
    } else if(m === 'gen2a'){
      ctx2.fillStyle = '#144D47'; ctx2.fillRect(0, 160, W, 100);
      ctx2.fillStyle = '#5FF2D2'; ctx2.fillText('VIDRIO BIOACTIVO 45S5 / HA', 16, 238);
      ctx2.fillStyle = 'rgba(95,242,210,0.48)'; ctx2.fillRect(0, 136, W, 22);
      ctx2.fillStyle = '#0B0A24'; ctx2.font = '700 12px Sora, sans-serif';
      ctx2.fillText('CAPA HCA (enlace químico directo con el hueso)', 16, 151);
      for(let i = 0; i < 14; i++){ ctx2.fillStyle = i % 2 ? '#FFD98A' : '#5FF2D2'; ctx2.beginPath(); ctx2.arc((i * 44 + t * 22) % W, 158 - ((t * 32 + i * 17) % 42), 3.5, 0, 7); ctx2.fill(); }
    } else if(m === 'gen2b'){
      const prog = (Math.sin(t * 0.8) + 1) / 2;
      ctx2.fillStyle = 'rgba(230,215,184,0.28)'; ctx2.fillRect(0, 105, W, 42 * prog);
      for(let i = 0; i < 9; i++){ ctx2.fillStyle = '#FFD98A'; ctx2.fillRect(22 + i * 64, 156 + prog * 14, Math.max(14, 48 * (1 - prog * 0.6)), 54 * (1 - prog * 0.5)); }
      for(let i = 0; i < 12; i++){ ctx2.fillStyle = '#7FB6FF'; ctx2.beginPath(); ctx2.arc((i * 50 + t * 30) % W, 125 + Math.sin(t * 2 + i) * 20, 4, 0, 7); ctx2.fill(); }
      ctx2.fillStyle = '#FFD98A'; ctx2.fillText('PLA / PGA: hidrólisis gradual → tejido neoformado ocupa su lugar', 16, 238);
    } else {
      ctx2.strokeStyle = '#9C83FF'; ctx2.lineWidth = 4;
      for(let x = 40; x < W; x += 75){ ctx2.beginPath(); ctx2.moveTo(x, 110); ctx2.lineTo(x, 225); ctx2.stroke(); }
      for(let y = 135; y <= 205; y += 35){ ctx2.beginPath(); ctx2.moveTo(20, y); ctx2.lineTo(W - 20, y); ctx2.stroke(); }
      for(let i = 0; i < 10; i++){ ctx2.fillStyle = '#5FF2D2'; ctx2.beginPath(); ctx2.ellipse(65 + (i % 5) * 105 + Math.sin(t + i) * 5, 145 + Math.floor(i / 5) * 45 + Math.cos(t + i) * 4, 15, 8, 0, 0, 7); ctx2.fill(); }
      ctx2.strokeStyle = '#FF7A88'; ctx2.lineWidth = 3; ctx2.beginPath(); ctx2.moveTo(20, 105); ctx2.bezierCurveTo(160, 175, 360, 150, W - 25, 200); ctx2.stroke();
      ctx2.fillStyle = '#D7C6FF'; ctx2.fillText('Scaffold 3D + péptidos RGD + angiogénesis', 16, 244);
    }
    if(!reduceMotion) raf = requestAnimationFrame(nt => dibujar2D(nt, cv));
  }

  r.innerHTML = `
    <div class="gn-pasos" role="tablist" aria-label="Generaciones">
      ${gens.map((g, k) => `<button class="gn-paso g${g.numero}" role="tab" data-k="${k}"><span class="num">${g.numero}</span><span><b>${esc(nombreCorto(g.nombre))}</b><span class="dim">${esc(g.epoca)}</span></span></button>`).join('')}
    </div>
    <div class="gn-barra"><button class="btn-secundario" id="gnComparar" aria-pressed="false">Comparar las tres</button></div>
    <div class="gn-cuerpo" aria-live="polite"></div>`;
  const cuerpo = r.querySelector('.gn-cuerpo'), pasos = [...r.querySelectorAll('.gn-paso')];

  function ficha(){
    cancelAnimationFrame(raf);
    visor3d?.destruir?.(); visor3d = null;
    const g = gens[sel];
    cuerpo.innerHTML = `<article class="gn-ficha g${g.numero}">
      <h3>${esc(g.nombre)}</h3>
      <p class="gn-filo">${esc(g.filosofia)}</p>
      <div class="gn-visual">
        <div id="gnStage"></div>
        <div class="gn-visual-bar">
          <div class="gn-chips-modo">${g.numero === 2 ? `
            <button class="chip ${gen2Modo === 'gen2a' ? 'on' : ''}" data-g2="gen2a">Bioactivo (45S5 → HCA)</button>
            <button class="chip ${gen2Modo === 'gen2b' ? 'on' : ''}" data-g2="gen2b">Biodegradable (PLA/PGA)</button>` : ''}
          </div>
          <div class="gn-chips-modo">
            <button class="chip ${vista === '3d' ? 'on' : ''}" data-v="3d">Modelo 3D giratorio</button>
            <button class="chip ${vista === '2d' ? 'on' : ''}" data-v="2d">Simulador 2D en vivo</button>
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
        <button class="btn-secundario" id="gnPrev" ${sel === 0 ? 'disabled' : ''}>Generación anterior</button>
        <button class="btn-primario" id="gnNext" ${sel === gens.length - 1 ? 'disabled' : ''}>Siguiente generación</button>
      </div></article>`;
    const stage = cuerpo.querySelector('#gnStage');
    if(vista === '3d'){
      visor3d = montarVisor3D(stage, escenaGen3D(modoDeSel()), { camPos:[0.35, 1.0, 3.4], autoGiro:false });
    } else {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      stage.innerHTML = `<canvas width="${Math.round(580 * dpr)}" height="${Math.round(260 * dpr)}"></canvas>`;
      if(reduceMotion) dibujar2D(0, stage.firstElementChild);
      else raf = requestAnimationFrame(ts => dibujar2D(ts, stage.firstElementChild));
    }
    cuerpo.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => {
      if(vista !== b.dataset.v){
        vista = b.dataset.v;
        ficha();
        cuerpo.querySelector(`[data-v="${vista}"]`)?.focus({ preventScroll:true });
      }
    }));
    const g2Btns = [...cuerpo.querySelectorAll('[data-g2]')];
    g2Btns.forEach(b => b.addEventListener('click', () => {
      if(gen2Modo === b.dataset.g2) return;
      gen2Modo = b.dataset.g2;
      g2Btns.forEach(x => x.classList.toggle('on', x.dataset.g2 === gen2Modo));
      if(vista === '3d'){
        visor3d?.reemplazar(escenaGen3D(modoDeSel()));
      } else if(reduceMotion){
        dibujar2D(0, stage.firstElementChild);
      }
    }));
    cuerpo.querySelector('#gnPrev').addEventListener('click', () => ir(sel - 1));
    cuerpo.querySelector('#gnNext').addEventListener('click', () => ir(sel + 1));
  }
  function tabla(){
    cancelAnimationFrame(raf);
    visor3d?.destruir?.(); visor3d = null;
    const filas = [['Filosofía', 'filosofia'], ['Objetivo biológico', 'objetivo_biologico'], ['Cómo lo consigue', 'mecanismo'], ['Materiales', 'ejemplos_materiales'], ['Limitación', 'limitacion']];
    cuerpo.innerHTML = `<div class="gn-tabla-wrap"><table class="gn-tabla">
      <thead><tr><th></th>${gens.map(g => `<th class="g${g.numero}"><span class="num">${g.numero}</span> ${esc(g.epoca)}</th>`).join('')}</tr></thead>
      <tbody>${filas.map(([t, k]) => `<tr><th>${t}</th>${gens.map(g => `<td>${Array.isArray(g[k]) ? `<ul>${lista(g[k])}</ul>` : esc(g[k])}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  }
  function ir(k){
    sel = Math.max(0, Math.min(gens.length - 1, k)); comparar = false;
    pintar(); pasos[sel].focus({ preventScroll:true });
  }
  function pintar(){
    pasos.forEach((p, j) => { p.classList.toggle('on', !comparar && j === sel); p.setAttribute('aria-selected', !comparar && j === sel); });
    const b = r.querySelector('#gnComparar'); b.setAttribute('aria-pressed', comparar); b.textContent = comparar ? 'Volver al recorrido' : 'Comparar las tres';
    comparar ? tabla() : ficha();
  }
  pasos.forEach((p, k) => p.addEventListener('click', () => ir(k)));
  r.querySelector('#gnComparar').addEventListener('click', () => { comparar = !comparar; pintar(); });
  r.addEventListener('keydown', e => {
    if(comparar) return;
    if(e.key === 'ArrowRight'){ e.preventDefault(); ir(sel + 1); }
    if(e.key === 'ArrowLeft'){ e.preventDefault(); ir(sel - 1); }
  });
  pintar(); r.focus({ preventScroll:true });
}

export const actividades = {
  'linea-temporal': lineaTemporal,
  'implante-o-protesis': implanteOProtesis,
  'tres-generaciones': tresGeneraciones
};

/* Utilidades de modelado compartidas con otras salas (p. ej. ortopedia.js): mismas texturas,
   materiales y generadores de geometría para que todos los implantes del recorrido se vean igual */
export {
  crearRng, perfilTorneado, tuboVariable, tuboCurvo, mallaLoft, superficieOrganica, extruirCentrado,
  tornilloBiomedico, texHueso, texHuesoBump, texMetalCepillado,
  matTi, matCoCr, matUHMWPE, matCemento, matHuesoCort, matHuesoTrab, matEncia, matEsmalte, matHCA, matPMMA
};
