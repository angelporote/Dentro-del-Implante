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

const texHueso = (() => {
  const rng = crearRng(101);
  const t = canvasTex(512, 512, (g, w, h) => {
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
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1.5, 1.5);
  return t;
})();

const texHuesoBump = (() => {
  const rng = crearRng(202);
  const t = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#848484'; g.fillRect(0, 0, w, h);
    for(let i = 0; i < 950; i++){
      const x = rng() * w, y = rng() * h, r = 2 + rng() * 9;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, '#222222'); gr.addColorStop(0.65, '#686868'); gr.addColorStop(1, 'rgba(160,160,160,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  });
  t.repeat.set(1.5, 1.5);
  return t;
})();

const texTejido = (() => {
  const rng = crearRng(303);
  const t = canvasTex(512, 512, (g, w, h) => {
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
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(5, 4);
  return t;
})();

const texMetalCepillado = (() => {
  const rng = crearRng(404);
  const t = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#D8E0EB'; g.fillRect(0, 0, w, h);
    for(let i = 0; i < 1800; i++){
      const y = rng() * h, alpha = 0.04 + rng() * 0.13;
      g.fillStyle = rng() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(104,118,142,${alpha})`;
      g.fillRect(0, y, w, 1);
    }
  });
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(2, 2);
  return t;
})();

const texIris = (() => {
  const rng = crearRng(505);
  const t = canvasTex(512, 512, (g, w, h) => {
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
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

const texPiel = (() => {
  const rng = crearRng(606);
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#B8727E'; g.fillRect(0, 0, w, h);
    for(let i = 0; i < 1200; i++){
      const x = rng() * w, y = rng() * h;
      g.fillStyle = rng() > 0.5 ? 'rgba(235,180,185,0.14)' : 'rgba(95,42,56,0.16)';
      g.fillRect(x, y, 2.5, 2.5);
    }
  });
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(2, 2);
  return t;
})();

// Materiales PBR de estudio calibrados
const matTi = new THREE.MeshPhysicalMaterial({ color:0xD4DCE8, metalness:0.95, roughness:0.2, clearcoat:0.22, map:texMetalCepillado, bumpMap:texMetalCepillado, bumpScale:0.008 });
const matCoCr = new THREE.MeshPhysicalMaterial({ color:0xE8EEF6, metalness:0.98, roughness:0.08, clearcoat:0.4, clearcoatRoughness:0.05 });
const matOro = new THREE.MeshPhysicalMaterial({ color:0xFFD278, metalness:0.95, roughness:0.16, clearcoat:0.25 });
const matHierroOx = new THREE.MeshPhysicalMaterial({ color:0x5F4239, metalness:0.52, roughness:0.82, bumpMap:texHuesoBump, bumpScale:0.025 });
const matHerrumbre = new THREE.MeshStandardMaterial({ color:0x9B3C26, roughness:0.94, metalness:0.06, bumpMap:texHuesoBump, bumpScale:0.03 });
const matHuesoCort = new THREE.MeshPhysicalMaterial({ color:0xEFE2C6, roughness:0.56, metalness:0.02, map:texHueso, bumpMap:texHuesoBump, bumpScale:0.016, clearcoat:0.1, side:THREE.DoubleSide });
const matHuesoTrab = new THREE.MeshPhysicalMaterial({ color:0xC99F78, roughness:0.86, map:texHueso, bumpMap:texHuesoBump, bumpScale:0.042, side:THREE.DoubleSide });
const matEncia = new THREE.MeshPhysicalMaterial({ color:0xD86C82, roughness:0.4, clearcoat:0.36, sheen:0.45, sheenColor:0xFFB8C6 });
const matCiliar = new THREE.MeshPhysicalMaterial({ color:0xC85A72, roughness:0.44, clearcoat:0.32, sheen:0.42, sheenColor:0xFFB8C6, side:THREE.DoubleSide });
const matEsmalte = new THREE.MeshPhysicalMaterial({ color:0xF9F4E8, roughness:0.12, clearcoat:0.9, clearcoatRoughness:0.08 });
const matNacar = new THREE.MeshPhysicalMaterial({ color:0xF4F8FF, roughness:0.1, metalness:0.16, clearcoat:1, clearcoatRoughness:0.04, sheen:0.95, sheenColor:0x7FF5DF, emissive:0x144A44, emissiveIntensity:0.22 });
const matVidrioBio = new THREE.MeshPhysicalMaterial({ color:0x5FF2D2, roughness:0.06, metalness:0.04, ior:1.52, clearcoat:1, transparent:true, opacity:0.76, emissive:0x0A4B42, emissiveIntensity:0.24 });
const matVidrioClaro = new THREE.MeshPhysicalMaterial({ color:0xE6F7FF, roughness:0.04, metalness:0.02, ior:1.5, clearcoat:1, transparent:true, opacity:0.32, side:THREE.DoubleSide, depthWrite:false });
const matHCA = new THREE.MeshPhysicalMaterial({ color:0x9FFAE5, roughness:0.22, metalness:0.05, clearcoat:0.65, emissive:0x1A7C6A, emissiveIntensity:0.34 });
const matPMMA = new THREE.MeshPhysicalMaterial({ color:0xD8F6FF, roughness:0.03, metalness:0.02, ior:1.49, clearcoat:1, clearcoatRoughness:0.02, transparent:true, opacity:0.72, side:THREE.DoubleSide });
const matCemento = new THREE.MeshPhysicalMaterial({ color:0xECE0B2, roughness:0.46, clearcoat:0.2, bumpMap:texHuesoBump, bumpScale:0.008, side:THREE.DoubleSide });
const matUHMWPE = new THREE.MeshPhysicalMaterial({ color:0xF7F3E8, roughness:0.22, clearcoat:0.36, sheen:0.4, sheenColor:0xFFF8E6, side:THREE.DoubleSide });
const matPyC = new THREE.MeshPhysicalMaterial({ color:0x222734, metalness:0.72, roughness:0.07, clearcoat:0.96, clearcoatRoughness:0.03 });
const matTejido = new THREE.MeshPhysicalMaterial({ color:0xF2ECDE, roughness:0.84, map:texTejido, bumpMap:texTejido, bumpScale:0.015, sheen:0.42, sheenColor:0xFFFFFF, side:THREE.DoubleSide });
const matSilicona = new THREE.MeshPhysicalMaterial({ color:0xF47C8C, roughness:0.26, clearcoat:0.5, sheen:0.35, sheenColor:0xFFC2CA });
const matEpoxi = new THREE.MeshPhysicalMaterial({ color:0xE89D3C, roughness:0.07, ior:1.54, clearcoat:1, transparent:true, opacity:0.48, side:THREE.DoubleSide });
const matPLA = new THREE.MeshPhysicalMaterial({ color:0xF5C972, roughness:0.28, clearcoat:0.42, transparent:true, opacity:0.9 });
const matScaffold = new THREE.MeshPhysicalMaterial({ color:0xB6A4FF, roughness:0.38, clearcoat:0.28, sheen:0.32, sheenColor:0xDFD6FF });
const matVaso = new THREE.MeshPhysicalMaterial({ color:0xD9435A, roughness:0.34, clearcoat:0.46, sheen:0.4, sheenColor:0xFF9AA8, side:THREE.DoubleSide });
const matFibroso = new THREE.MeshPhysicalMaterial({ color:0xFF8396, roughness:0.48, transparent:true, opacity:0.48, side:THREE.DoubleSide });
const matColageno = new THREE.MeshPhysicalMaterial({ color:0xFFE2B8, roughness:0.42, sheen:0.45, sheenColor:0xFFF4E0 });
const matLino = new THREE.MeshStandardMaterial({ color:0xE7D4A6, roughness:0.76 });
const matDermis = new THREE.MeshPhysicalMaterial({ color:0xB66C79, roughness:0.6, clearcoat:0.28, sheen:0.4, sheenColor:0xEBAAB4, map:texPiel, bumpMap:texPiel, bumpScale:0.01 });
const matSubcut = new THREE.MeshPhysicalMaterial({ color:0xE0B06A, roughness:0.72, bumpMap:texHuesoBump, bumpScale:0.025 });
const matPGA = new THREE.MeshPhysicalMaterial({ color:0xB48AFF, roughness:0.32, clearcoat:0.35 });
const matHapt = new THREE.MeshPhysicalMaterial({ color:0x5AA0FF, roughness:0.16, clearcoat:0.85 });
const matAteroma = new THREE.MeshPhysicalMaterial({ color:0xF0C858, roughness:0.52, clearcoat:0.24, bumpMap:texHuesoBump, bumpScale:0.02, side:THREE.DoubleSide });
const matMembrana = new THREE.MeshPhysicalMaterial({ color:0xD8ECFF, roughness:0.24, clearcoat:0.7, transparent:true, opacity:0.86 });
const matNucleo = basicGlow(0x5FF2D2, 1.35);
const matIris = new THREE.MeshPhysicalMaterial({ map:texIris, roughness:0.52, side:THREE.DoubleSide });
const matEsclera = new THREE.MeshPhysicalMaterial({ color:0xEAE4F6, roughness:0.38, clearcoat:0.38, side:THREE.DoubleSide });
const matHidrogel = new THREE.MeshPhysicalMaterial({ color:0x8BF6EB, roughness:0.04, ior:1.43, clearcoat:1, transparent:true, opacity:0.62, side:THREE.DoubleSide });
const matNanoExt = new THREE.MeshPhysicalMaterial({ color:0x7B68EE, roughness:0.22, clearcoat:0.7, transparent:true, opacity:0.86, side:THREE.DoubleSide });
const matCelofan = new THREE.MeshPhysicalMaterial({ color:0xFF6B7E, roughness:0.16, clearcoat:0.85, transparent:true, opacity:0.86 });

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

/* =========================================================
   Vitrina 01 del pasillo: construir(d, ctx)
   ========================================================= */
const pedMat = std(0x3A2F6E, { roughness:.35, metalness:.3 });
const ringGlow = basicGlow(0xFFD58A, 1.8);
const coneMat = new THREE.MeshBasicMaterial({ color:0xFFE2A8, transparent:true, opacity:0.06, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });

function pedestal(d, x, z = -3.8){
  mesh(new THREE.CylinderGeometry(0.38, 0.42, 1.4, 28), pedMat, x, -1.45, z, d);
  mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.03, 28), ringGlow, x, -0.74, z, d);
  mesh(new THREE.ConeGeometry(0.7, 2.6, 28, 1, true), coneMat, x, 0.55, z, d);
  const g = new THREE.Group(); g.position.set(x, -0.25, z); d.add(g); return g;
}

function placa(d, texto, x, y, z, w = 0.5){
  const p = canvasPlane(w, 0.16, 640, 180, (g, W, H) => {
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
  p.material.toneMapped = true; p.position.set(x, y, z); d.add(p); return p;
}

export function construir(d, ctx){
  ctx.sala(d, 0x2A2350); ctx.luz(d, 0xFFD58A, 16);
  const linea = canvasPlane(5.2, 1.0, 2400, 460, (g, w, h) => {
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
  linea.position.set(0, 1.1, -6.15); d.add(linea);

  const [p1, p2, p3] = [-1.6, 0, 1.6].map(x => pedestal(d, x));

  // Pedestal 1 (1ª gen · bioinerte): tornillo CNC de titanio con rosca trapezoidal real
  tornilloBiomedico(p1, { rMax:0.092, rTip:0.048, hCuerpo:0.52, vueltas:6.5, rFilete:0.022, hCuello:0.12, rCuello:0.095, tipoCabeza:'hex', mat:matTi, matRosca:matCoCr });

  // Pedestal 2 (2ª gen · bioactiva): vaso de laboratorio con Bioglass 45S5, lecho cristalino HCA e iones
  const crisol = perfilTorneado([[0, -0.25], [0.21, -0.25], [0.25, -0.18], [0.26, 0.14], [0.28, 0.16], [0.24, 0.16], [0.23, -0.17], [0.18, -0.22], [0, -0.22]], 40);
  mesh(crisol, matVidrioClaro, 0, 0, 0, p2);
  mesh(perfilTorneado([[0, -0.21], [0.19, -0.21], [0.22, -0.14], [0.22, 0.04], [0, 0.04]], 32), matVidrioBio, 0, 0, 0, p2);
  const rng2 = crearRng(77);
  for(let i = 0; i < 14; i++){
    const ang = (i / 14) * Math.PI * 2, rad = 0.05 + (i % 3) * 0.055;
    cristalHCA(p2, Math.cos(ang) * rad, 0.03, Math.sin(ang) * rad, 0.015, 0.055 + rng2() * 0.03, matHCA, (rng2() - 0.5) * 0.45, (rng2() - 0.5) * 0.45);
  }
  const ionesP2 = [];
  const ionGeo = new THREE.SphereGeometry(0.018, 12, 10);
  for(let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    const m = mesh(ionGeo, i % 2 ? matHCA : matOro, Math.cos(a) * 0.12, 0.09 + (i % 3) * 0.03, Math.sin(a) * 0.12, p2);
    ionesP2.push({ m, y0:0.09 + (i % 3) * 0.03, fase:i * 0.8 });
  }

  // Pedestal 3 (3ª gen · regenerativa): scaffold trabecular 3D curvo con capilar ramificado de calibre variable y células
  const scG = new THREE.Group(); p3.add(scG);
  const rSc = 0.21;
  for(let k = 0; k < 4; k++){
    const yy = -0.2 + k * 0.135;
    mesh(new THREE.TorusGeometry(rSc, 0.013, 12, 36), matScaffold, 0, yy, 0, scG).rotation.x = Math.PI / 2;
    mesh(new THREE.TorusGeometry(rSc * 0.54, 0.01, 10, 28), matScaffold, 0, yy, 0, scG).rotation.x = Math.PI / 2;
  }
  for(let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    mesh(tuboCurvo([[Math.cos(a) * rSc, -0.2, Math.sin(a) * rSc], [Math.cos(a + 0.35) * rSc * 0.9, 0, Math.sin(a + 0.35) * rSc * 0.9], [Math.cos(a) * rSc, 0.205, Math.sin(a) * rSc]], 0.011, 16, false, 8), matScaffold, 0, 0, 0, scG);
  }
  mesh(tuboVariable([[-0.24, -0.18, 0.06], [-0.07, -0.03, 0.02], [0.06, 0.06, -0.03], [0.24, 0.22, -0.06]], u => 0.022 * (1 - u * 0.4), 24, 10), matVaso, 0, 0, 0, scG);
  mesh(tuboVariable([[-0.03, 0, 0.01], [0.1, -0.09, 0.12], [0.21, -0.15, 0.15]], u => 0.014 * (1 - u * 0.55), 16, 8), matVaso, 0, 0, 0, scG);
  celulaAdherida(scG, 0.15, 0.08, 0.12, 0.038, matMembrana, matNucleo, 12);
  celulaAdherida(scG, -0.14, -0.08, 0.14, 0.036, matMembrana, matNucleo, 15);
  celulaAdherida(scG, 0.02, 0.17, -0.14, 0.036, matMembrana, matNucleo, 19);

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
      mesh(dermGeo, matDermis, 0, -0.08, 0, grupo);

      // Capa subcutánea adiposa orgánica bajo la dermis
      const subGeo = superficieOrganica(1.60, 1.36, 22, 16,
        (x, z) => -0.12 + Math.sin(x * 5 + z * 4) * 0.014,
        (x, z) => -0.30 + Math.cos(x * 4 - z * 5) * 0.014);
      mesh(subGeo, matSubcut, 0, -0.08, 0, grupo);

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
        mesh(tuboVariable([
          [xL, yL - 0.016, zA],
          [cx - 0.065, yL + 0.016, zA],
          [cx, yCrest, zA],
          [cx + 0.065, yR + 0.016, zA],
          [xR, yR - 0.016, zA]
        ], 0.014, 18, 8), matLino, 0, 0, 0, grupo);
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
      grupo.add(aguja);
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
          ], 30, true), matNacar, 0, 0, 0, gD);
          const anilloHCA = mesh(perfilTorneado([
            [0.088, 0.012], [0.122, 0.026], [0.126, 0.052], [0.104, 0.068], [0.086, 0.055], [0.088, 0.012]
          ], 32), matHCA, 0, 0, 0, gD);
          anilloHCA.scale.set(1.16, 1, 0.82);
        } else {
          // Cuña galorromana de hierro oxidado para contraste histórico
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

    // 3) 1829-1937: Diáfisis femoral tubular seccionada con 3 lechos metálicos (Hierro corroído, Oro/Platino Levert, Tornillo Vitallium Strock 1937)
    if(anio === 1829){
      // Diáfisis ósea cilíndrica abierta en canal longitudinal
      mesh(perfilTorneado([[0.32, -0.26], [0.54, -0.26], [0.56, 0.22], [0.32, 0.22], [0.32, -0.26]], 40, Math.PI * 0.3, Math.PI * 1.4), matHuesoCort, 0, -0.24, 0, grupo).rotation.z = Math.PI / 2;
      mesh(superficieOrganica(2.05, 0.66, 26, 12,
        (x, z) => -0.08 + Math.sin(x * 6 + z * 5) * 0.015 - (Math.abs(x + 0.68) < 0.22 ? 0.11 : 0),
        () => -0.32), matHuesoTrab, 0, -0.12, 0, grupo);
      trabeculasGrupo(grupo, 1.85, 0.24, 0.56, 10, matHuesoCort, 34);

      // 1) Hierro (Zierold 1924): barra picada por corrosión + anillo osteolítico de herrumbre
      mesh(perfilTorneado([[0, -0.26], [0.075, -0.24], [0.1, -0.08], [0.068, 0.06], [0.105, 0.22], [0.09, 0.56], [0, 0.62]], 24), matHierroOx, -0.68, 0.14, 0, grupo);
      mesh(new THREE.TorusGeometry(0.17, 0.035, 10, 26), matHerrumbre, -0.68, -0.1, 0, grupo).rotation.x = Math.PI / 2;
      for(let i = 0; i < 7; i++){
        const a = (i / 7) * Math.PI * 2;
        mesh(new THREE.DodecahedronGeometry(0.042, 0), matHerrumbre, -0.68 + Math.cos(a) * 0.13, -0.04 + (i % 2) * 0.06, Math.sin(a) * 0.13, grupo);
      }

      // 2) Oro y Platino (Levert 1829): lazo de alambre noble con fina cápsula translúcida
      mesh(perfilTorneado([[0, -0.22], [0.065, -0.18], [0.088, 0.16], [0.11, 0.44], [0.08, 0.58], [0, 0.6]], 32), matOro, 0, 0.14, 0, grupo);
      mesh(tuboCurvo([[0, 0.72, 0], [0.13, 0.86, 0.05], [0.04, 0.78, -0.08]], 0.02, 20, false, 10), matCoCr, 0, 0, 0, grupo);
      mesh(new THREE.CylinderGeometry(0.135, 0.125, 0.36, 24, 1, true), matFibroso, 0, 0.05, 0, grupo);

      // 3) Vitallium Co-Cr-Mo (Strock 1937): tornillo dental con rosca trapezoidal real
      const strock = tornilloBiomedico(grupo, { rMax:0.115, rTip:0.055, hCuerpo:0.74, vueltas:6.5, rFilete:0.024, hCuello:0.15, rCuello:0.115, tipoCabeza:'ranura', mat:matCoCr, matRosca:matCoCr });
      strock.position.set(0.68, 0.22, 0);

      grupo.rotation.set(0.18, -0.28, 0);
      return;
    }

    // 4) 1943-1960: Riñón artificial de tambor rotatorio de Kolff + shunt arteriovenoso en U de Scribner
    if(anio === 1943){
      // Batea semicircular esmaltada con reborde y patas
      const cubS = new THREE.Shape();
      cubS.absarc(0, 0.08, 0.72, Math.PI, Math.PI * 2, false);
      cubS.lineTo(0.78, 0.08); cubS.lineTo(0.78, 0.13); cubS.lineTo(0.65, 0.13);
      cubS.absarc(0, 0.08, 0.65, Math.PI * 2, Math.PI, true);
      cubS.lineTo(-0.78, 0.13); cubS.lineTo(-0.78, 0.08); cubS.closePath();
      const cubeta = mesh(extruirCentrado(cubS, 1.54, { bevelThickness:0.018, bevelSize:0.014 }), new THREE.MeshPhysicalMaterial({ color:0xDCE6F0, roughness:0.22, metalness:0.22, clearcoat:0.7 }), 0, -0.08, -0.1, grupo);
      cubeta.rotation.y = Math.PI / 2;

      const liqS = new THREE.Shape();
      liqS.absarc(0, 0.08, 0.63, Math.PI + 0.14, Math.PI * 2 - 0.14, false);
      liqS.closePath();
      mesh(extruirCentrado(liqS, 1.48, { bevelThickness:0.004, bevelSize:0.004 }), matVidrioClaro, 0, -0.08, -0.1, grupo).rotation.y = Math.PI / 2;

      // Soportes en A, eje motor y polea
      [-0.79, 0.79].forEach(x => {
        mesh(tuboCurvo([[x, -0.62, -0.46], [x, 0.25, -0.1], [x, -0.62, 0.26]], 0.03, 18, false, 10), matTi, 0, 0, 0, grupo);
        mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 20), matCoCr, x, 0.25, -0.1, grupo).rotation.z = Math.PI / 2;
      });
      mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.76, 18), matCoCr, 0, 0.25, -0.1, grupo).rotation.z = Math.PI / 2;
      mesh(perfilTorneado([[0.03, -0.03], [0.16, -0.03], [0.14, -0.01], [0.14, 0.01], [0.16, 0.03], [0.03, 0.03]], 28), matTi, -0.84, 0.25, -0.1, grupo).rotation.z = Math.PI / 2;

      // Tambor de listones + espiral helicoidal continua de celofán (14 vueltas)
      const tambor = new THREE.Group(); tambor.position.set(0, 0.25, -0.1); grupo.add(tambor);
      [-0.62, 0.62].forEach(x => {
        mesh(new THREE.TorusGeometry(0.41, 0.022, 12, 36), matTi, x, 0, 0, tambor).rotation.y = Math.PI / 2;
      });
      for(let i = 0; i < 12; i++){
        const a = (i / 12) * Math.PI * 2;
        mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.28, 10), matHuesoCort, 0, Math.cos(a) * 0.39, Math.sin(a) * 0.39, tambor).rotation.z = Math.PI / 2;
      }
      mesh(heliceGeo(0.425, 1.18, 14, 0.022, 240, 8, 'x'), matCelofan, 0, 0, 0, tambor);

      // Shunt arteriovenoso en U de Scribner-Quinton (Teflon + silicona + manguitos Dacron)
      const shuntPts = [[-0.54, -0.34, 0.6], [-0.46, -0.58, 0.72], [0, -0.66, 0.76], [0.46, -0.58, 0.72], [0.54, -0.34, 0.6]];
      mesh(tuboVariable(shuntPts, u => (u < 0.1 || u > 0.9) ? 0.028 : 0.04, 36, 12), matPMMA, 0, 0, 0, grupo);
      mesh(tuboVariable(shuntPts, 0.02, 36, 10), matVaso, 0, 0, 0, grupo);
      [-0.48, 0.48].forEach(x => {
        mesh(perfilTorneado([[0.04, -0.07], [0.062, -0.06], [0.062, 0.06], [0.04, 0.07]], 24), matTejido, x, -0.45, 0.67, grupo).rotation.z = x < 0 ? 0.32 : -0.32;
      });

      grupo.rotation.set(0.14, -0.3, 0);
      return t => { tambor.rotation.x = t * 0.38; };
    }

    // 5) 1947-1952: Injerto vascular aorto-biilíaco corrugado fino (Vinyon-N / Dacron) con sutura a máquina y anastomosis aórtica
    if(anio === 1947){
      const injerto = new THREE.Group(); grupo.add(injerto);
      // Aorta nativa superior trilaminar translúcida
      mesh(perfilTorneado([[0.25, 0.36], [0.27, 0.78], [0.22, 0.78], [0.2, 0.36], [0.25, 0.36]], 44), matVaso, 0, 0, 0, injerto);
      // Tronco principal con corrugado fino de alta densidad
      mesh(corrugadoGeo(0.23, 0.015, 16, 0.68, 0.02, 44), matTejido, 0, 0.04, 0, injerto);

      // Puntos de sutura quirúrgica en la anastomosis superior
      for(let i = 0; i < 16; i++){
        const a = (i / 16) * Math.PI * 2;
        mesh(tuboCurvo([[Math.cos(a) * 0.22, 0.32, Math.sin(a) * 0.22], [Math.cos(a) * 0.27, 0.36, Math.sin(a) * 0.27], [Math.cos(a) * 0.22, 0.4, Math.sin(a) * 0.22]], 0.008, 8, false, 6), matPyC, 0, 0, 0, injerto);
      }
      // Costura longitudinal cosida a máquina (Voorhees)
      for(let k = 0; k < 10; k++){
        const y = -0.24 + k * 0.055;
        mesh(tuboCurvo([[-0.025, y, 0.245], [0.025, y + 0.024, 0.25], [-0.025, y + 0.048, 0.245]], 0.007, 8, false, 6), matPyC, 0, 0, 0, injerto);
      }
      // Dos ramas ilíacas curvadas y corrugadas
      [-1, 1].forEach(s => {
        const ptsRama = [[s * 0.07, -0.26, 0], [s * 0.22, -0.52, 0.04 * s], [s * 0.38, -0.82, 0.02 * s]];
        const curvaRama = new THREE.CatmullRomCurve3(ptsRama.map(p => new THREE.Vector3(...p)));
        mesh(tuboVariable(ptsRama, u => 0.135 + Math.sin(u * 14 * Math.PI * 2) * 0.01, 44, 20), matTejido, 0, 0, 0, injerto);
        for(let j = 1; j <= 10; j++){
          const pos = curvaRama.getPointAt(j / 11), tan = curvaRama.getTangentAt(j / 11);
          const ring = mesh(new THREE.TorusGeometry(0.142, 0.009, 8, 26), matTejido, pos.x, pos.y, pos.z, injerto);
          ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
        }
      });

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
      mesh(irisGeo, matIris, 0, 0, 0, ojo).rotation.x = Math.PI / 2;

      // Lente intraocular biconvexa de PMMA (Ridley) con bisel óptico
      const iolPerfil = [
        [0, -0.125], [0.2, -0.102], [0.39, -0.042], [0.43, -0.024],
        [0.43, 0.024], [0.39, 0.042], [0.2, 0.102], [0, 0.125]
      ];
      mesh(perfilTorneado(iolPerfil, 48), matVidrioBio, 0, 0, -0.06, ojo).rotation.x = Math.PI / 2;

      // Hápticos finos en C/J de PMMA azul con simetría puntual real
      [-1, 1].forEach(s => {
        mesh(tuboVariable([
          [s * 0.42, s * 0.08, -0.06],
          [s * 0.68, s * 0.36, -0.06],
          [s * 0.56, s * 0.68, -0.06],
          [s * 0.16, s * 0.78, -0.06]
        ], u => 0.018 + (u > 0.88 ? 0.01 : 0), 28, 10), matHapt, 0, 0, 0, ojo);
      });
      return;
    }

    // 7) 1952-1960: Válvula Starr-Edwards (anillo Dacron, asiento Venturi, 4 montantes parabólicos, bola Silastic) + Marcapasos Greatbatch en epoxi ámbar
    if(anio === 1952){
      const val = new THREE.Group(); val.position.set(-0.56, -0.06, 0); grupo.add(val);
      mesh(perfilTorneado([[0.42, -0.11], [0.57, -0.09], [0.62, 0], [0.57, 0.09], [0.42, 0.11], [0.39, 0]], 44), matTejido, 0, -0.24, 0, val);
      mesh(perfilTorneado([[0.33, -0.1], [0.42, -0.1], [0.44, 0.09], [0.37, 0.12], [0.32, 0.02]], 44), matCoCr, 0, -0.24, 0, val);
      for(let i = 0; i < 4; i++){
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const c = Math.cos(a), s = Math.sin(a);
        mesh(tuboVariable([[c * 0.39, -0.14, s * 0.39], [c * 0.45, 0.2, s * 0.45], [c * 0.22, 0.56, s * 0.22], [0, 0.66, 0]], u => 0.026 * (1 - u * 0.2), 26, 10), matCoCr, 0, 0, 0, val);
      }
      mesh(new THREE.SphereGeometry(0.05, 20, 14), matCoCr, 0, 0.66, 0, val);
      const bola = mesh(new THREE.SphereGeometry(0.29, 36, 28), matSilicona, 0, 0.06, 0, val);

      // Marcapasos implantable Greatbatch-Chardack (1959)
      const mp = new THREE.Group(); mp.position.set(0.62, -0.04, 0); mp.rotation.y = -0.25; grupo.add(mp);
      const cajaS = new THREE.Shape();
      cajaS.absarc(0, 0, 0.44, 0, Math.PI * 2, false);
      mesh(extruirCentrado(cajaS, 0.22, { bevelThickness:0.045, bevelSize:0.04, bevelSegments:5, curveSegments:36 }), matEpoxi, 0, 0, 0, mp);
      // Placa base PCB + 2 pilas mercurio-zinc + transformador toroidal + 2 transistores
      mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 28), new THREE.MeshStandardMaterial({ color:0x1E5448, roughness:0.6 }), 0, 0, -0.02, mp).rotation.x = Math.PI / 2;
      [-0.14, 0.14].forEach(x => {
        mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.13, 24), matCoCr, x, -0.12, 0.01, mp).rotation.x = Math.PI / 2;
        mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.145, 16), matOro, x, -0.12, 0.01, mp).rotation.x = Math.PI / 2;
      });
      mesh(new THREE.TorusGeometry(0.065, 0.022, 10, 22), matOro, -0.14, 0.16, 0.02, mp);
      mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.08, 16), matOro, 0.06, 0.18, 0.02, mp).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.08, 16), matOro, 0.2, 0.14, 0.02, mp).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.048, 0.065, 0.16, 20), matCoCr, 0, 0.48, 0, mp);
      mesh(tuboVariable([[0, 0.55, 0], [0.06, 0.82, 0.06], [0.22, 0.92, -0.08], [0.4, 0.68, -0.16], [0.46, 0.25, -0.1]], 0.018, 32, 10), matUHMWPE, 0, 0, 0, mp);

      grupo.rotation.set(0.12, -0.18, 0);
      return t => {
        const s = Math.max(0, Math.sin(t * 2.2));
        bola.position.y = 0.02 + s * 0.22;
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
      mesh(cemFemGeo, matCemento, 0, 0, 0, grupo);

      // Vástago femoral monobloque curvo de Charnley alojado dentro del manto PMMA y canal medular
      const vasS = new THREE.Shape();
      vasS.moveTo(-0.28, -0.78);
      vasS.quadraticCurveTo(-0.32, -0.28, -0.37, 0.16);
      vasS.quadraticCurveTo(-0.38, 0.29, -0.29, 0.30);
      vasS.quadraticCurveTo(-0.19, 0.23, -0.12, 0.18);
      vasS.lineTo(-0.16, 0.14);
      vasS.quadraticCurveTo(-0.20, -0.25, -0.22, -0.78);
      vasS.closePath();
      mesh(extruirCentrado(vasS, 0.068, { bevelThickness:0.014, bevelSize:0.012, bevelSegments:4 }), matCoCr, 0, 0, -0.01, grupo);

      const cuelloDir = new THREE.Vector3(0.68, 0.72, 0).normalize();
      const collar = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.024, 28), matCoCr, -0.17, 0.21, -0.01, grupo);
      collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cuelloDir);
      const cuello = mesh(new THREE.CylinderGeometry(0.050, 0.078, 0.38, 28), matCoCr, -0.04, 0.35, -0.01, grupo);
      cuello.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cuelloDir);
      mesh(new THREE.SphereGeometry(0.165, 36, 28), matCoCr, 0.09, 0.49, -0.01, grupo);

      // Cotilo grueso de UHMWPE + marcador radiopaco + manto PMMA + reborde óseo acetabular abiertos hacia +Z
      const cupG = new THREE.Group(); cupG.position.set(0.09, 0.49, -0.01); cupG.rotation.z = -0.78; grupo.add(cupG);
      const uhmwGeo = perfilTorneado([[0.172, 0], [0.172, 0.07], [0.13, 0.14], [0, 0.175], [0, 0.35], [0.22, 0.3], [0.34, 0.14], [0.34, 0.1], [0.32, 0.08], [0.34, 0.05], [0.35, 0], [0.172, 0]], 40, Math.PI * 0.38, Math.PI * 1.24);
      mesh(uhmwGeo, matUHMWPE, 0, 0, 0, cupG);
      const marc = mesh(new THREE.TorusGeometry(0.355, 0.011, 10, 32, Math.PI * 1.24), matCoCr, 0, 0.015, 0, cupG);
      marc.rotation.set(Math.PI / 2, 0, -Math.PI * 1.12);
      const cemCupGeo = perfilTorneado([[0.35, 0], [0.34, 0.14], [0.22, 0.3], [0, 0.35], [0, 0.42], [0.27, 0.36], [0.41, 0.16], [0.42, 0], [0.35, 0]], 36, Math.PI * 0.38, Math.PI * 1.24);
      mesh(cemCupGeo, matCemento, 0, 0, 0, cupG);
      const pelvisGeo = perfilTorneado([[0.42, 0], [0.41, 0.16], [0.27, 0.36], [0, 0.42], [0, 0.51], [0.33, 0.43], [0.49, 0.19], [0.5, 0], [0.42, 0]], 32, Math.PI * 0.40, Math.PI * 1.20);
      mesh(pelvisGeo, matHuesoCort, 0, 0, 0, cupG);

      grupo.rotation.set(0.08, -0.22, 0);
      return;
    }

    // 9) 1960-1968: Válvula bivalva de carbono pirolítico (PyC) + lente de contacto blanda de hidrogel PHEMA
    if(anio === 1960){
      const val = new THREE.Group(); val.position.set(-0.44, 0.08, -0.12); val.rotation.x = 0.45; grupo.add(val);
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
      mesh(lenteGeo, matHidrogel, 0.62, -0.22, 0.36, grupo).rotation.x = 0.35;
      mesh(perfilTorneado([[0, -0.2], [0.38, -0.2], [0.4, -0.14], [0.16, -0.08], [0, -0.08]], 36), matTi, 0.62, -0.23, 0.36, grupo);

      grupo.rotation.set(0.1, -0.25, 0);
      return t => {
        const ang = -0.38 + ((Math.sin(t * 2.2) + 1) * 0.5) * 1.78;
        pivL.rotation.z = -ang; pivR.rotation.z = ang;
      };
    }

    // 10) 1952-1976: Osteointegración del titanio de Brånemark (cuña ósea anatómica + microvasos + implante CNC con rosca trapezoidal y cámara apical)
    if(anio === 1964){
      mesh(perfilTorneado([[0.22, -0.68], [0.68, -0.68], [0.74, 0], [0.7, 0.35], [0.22, 0.35], [0.22, -0.68]], 40, 0.85, Math.PI * 1.32), matHuesoCort, 0, -0.1, 0, grupo);
      mesh(perfilTorneado([[0.18, -0.58], [0.56, -0.58], [0.6, 0.24], [0.18, 0.24], [0.18, -0.58]], 36, 0.88, Math.PI * 1.28), matHuesoTrab, 0, -0.1, 0, grupo);
      trabeculasGrupo(grupo, 0.9, 0.65, 0.7, 10, matHuesoCort, 64);
      mesh(tuboVariable([[-0.52, -0.35, 0.24], [-0.32, -0.18, 0.28], [-0.18, -0.1, 0.16]], u => 0.018 * (1 - u * 0.35), 18, 8), matVaso, 0, 0, 0, grupo);

      const imp = tornilloBiomedico(grupo, { rMax:0.175, rTip:0.14, hCuerpo:0.95, vueltas:8, rFilete:0.034, hCuello:0.16, rCuello:0.185, tipoCabeza:'hex', mat:matTi, matRosca:matCoCr });
      imp.position.y = 0.08;
      // Cámara óptica transversal en la zona apical
      mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.36, 20), matPyC, 0, -0.22, 0, imp).rotation.z = Math.PI / 2;

      grupo.rotation.set(0.16, -0.25, 0);
      return;
    }

    // 11) 1966-1971: Placa craneofacial biodegradable PLA/PLGA con 4 tornillos roscados sobre hueso fracturado + sutura trenzada PGA + malla ePTFE
    if(anio === 1966){
      const fragL = huesoBloque(grupo, 0.9, 0.44, 0.62, { curva:0.07, seed:71, nTrab:6 });
      fragL.position.set(-0.52, -0.22, 0); fragL.rotation.z = 0.04;
      const fragR = huesoBloque(grupo, 0.9, 0.44, 0.62, { curva:0.07, seed:72, nTrab:6 });
      fragR.position.set(0.52, -0.22, 0); fragR.rotation.z = -0.04;

      const placaS = new THREE.Shape();
      placaS.moveTo(-0.82, -0.13);
      placaS.quadraticCurveTo(-0.52, -0.21, -0.24, -0.09); placaS.lineTo(0.24, -0.09);
      placaS.quadraticCurveTo(0.52, -0.21, 0.82, -0.13);
      placaS.quadraticCurveTo(0.92, 0, 0.82, 0.13);
      placaS.quadraticCurveTo(0.52, 0.21, 0.24, 0.09); placaS.lineTo(-0.24, 0.09);
      placaS.quadraticCurveTo(-0.52, 0.21, -0.82, 0.13);
      placaS.quadraticCurveTo(-0.92, 0, -0.82, -0.13);
      [-0.72, -0.34, 0.34, 0.72].forEach(hx => {
        const hole = new THREE.Path(); hole.absarc(hx, 0, 0.062, 0, Math.PI * 2, true); placaS.holes.push(hole);
      });
      const placaMesh = mesh(extruirCentrado(placaS, 0.07, { bevelThickness:0.015, bevelSize:0.015 }), matPLA, 0, 0.08, 0, grupo);
      placaMesh.rotation.x = Math.PI / 2;

      [-0.72, -0.34, 0.34, 0.72].forEach(x => {
        const tw = tornilloBiomedico(grupo, { rMax:0.052, rTip:0.03, hCuerpo:0.32, vueltas:5, rFilete:0.013, hCuello:0.04, rCuello:0.056, tipoCabeza:'avellanada', mat:matPLA, matRosca:matPLA });
        tw.position.set(x, -0.02, 0);
      });

      // Sutura multifilamento trenzada de PGA (triple hélice curva)
      for(let f = 0; f < 3; f++){
        const pts = [];
        for(let i = 0; i <= 36; i++){
          const u = i / 36, ang = u * Math.PI * 6 + (f * Math.PI * 2) / 3;
          pts.push([(u - 0.5) * 1.72, 0.44 + Math.sin(u * Math.PI) * 0.24 + Math.sin(ang) * 0.024, -0.44 + Math.cos(ang) * 0.024]);
        }
        mesh(tuboCurvo(pts, 0.015, 36, false, 8), matPGA, 0, 0, 0, grupo);
      }

      // Lámina microporosa de ePTFE (nodos y densas fibrillas paralelas)
      const ptfe = new THREE.Group(); ptfe.position.set(0, -0.22, 0.56); ptfe.rotation.x = 0.34; grupo.add(ptfe);
      for(let nx = -2; nx <= 2; nx++){
        mesh(tuboVariable([[nx * 0.22, -0.14, 0], [nx * 0.22 + 0.02, 0, 0.015], [nx * 0.22, 0.14, 0]], 0.02, 12, 8), matUHMWPE, 0, 0, 0, ptfe);
        if(nx < 2){
          for(let ny = -2; ny <= 2; ny++){
            mesh(tuboVariable([[nx * 0.22, ny * 0.055, 0], [(nx + 0.5) * 0.22, ny * 0.055 + 0.012, 0.008], [(nx + 1) * 0.22, ny * 0.055, 0]], 0.0055, 8, 6), matUHMWPE, 0, 0, 0, ptfe);
          }
        }
      }

      grupo.rotation.set(0.18, -0.32, 0);
      return;
    }

    // 12) 1969: Bioglass 45S5 (Hench) — cilindro multicapa orgánico con red de sílice, gel SiO2, alfombra de cristales HCA y colágeno mineralizado en hueso vivo
    if(anio === 1969){
      mesh(perfilTorneado([[0, -0.66], [0.76, -0.66], [0.78, -0.2], [0, -0.2]], 44), matVidrioBio, 0, 0, 0, grupo);
      for(let i = 0; i < 6; i++){
        const a = (i / 6) * Math.PI * 2;
        mesh(tuboCurvo([[0, -0.46, 0], [Math.cos(a) * 0.42, -0.44, Math.sin(a) * 0.42], [Math.cos(a + 0.5) * 0.54, -0.34, Math.sin(a + 0.5) * 0.54]], 0.014, 12, false, 8), matHCA, 0, 0, 0, grupo);
      }

      mesh(perfilTorneado([[0, -0.2], [0.79, -0.2], [0.8, -0.05], [0, -0.05]], 44), matOro, 0, 0, 0, grupo);
      mesh(perfilTorneado([[0, -0.05], [0.8, -0.05], [0.79, 0.12], [0, 0.12]], 44), matHCA, 0, 0, 0, grupo);

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
      mesh(trabecGeo, matHuesoTrab, 0, 0, 0, grupo);

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
      mesh(cortGeo, matHuesoCort, 0, 0, 0, grupo);

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

    // 13) 1978-1986: Arteria coronaria tricapa en corte limpio con placa aterosclerótica orgánica + stent de 8 anillos × 10 picos + balón y guía
    if(anio === 1978){
      const art = new THREE.Group(); grupo.add(art);
      const phiArt = Math.PI * 1.38;
      mesh(perfilTorneado([[0.58, -0.94], [0.69, -0.94], [0.69, 0.94], [0.58, 0.94], [0.58, -0.94]], 44, 1.42, phiArt), matVaso, 0, 0, 0, art).rotation.z = Math.PI / 2;
      mesh(perfilTorneado([[0.5, -0.62], [0.58, -0.68], [0.58, 0.68], [0.5, 0.62], [0.46, 0], [0.5, -0.62]], 36, 1.68, phiArt * 0.82), matAteroma, 0, 0, 0, art).rotation.z = Math.PI / 2;

      stentCoronario3D(0.45, 1.42, 8, 10, 0.014, matCoCr, art);
      mesh(perfilTorneado([[0.045, -0.84], [0.12, -0.68], [0.37, -0.54], [0.37, 0.54], [0.12, 0.68], [0.045, 0.84]], 40), matPMMA, 0, 0, 0, art).rotation.z = Math.PI / 2;
      [-0.52, 0.52].forEach(x => mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 20), matOro, x, 0, 0, art).rotation.y = Math.PI / 2);
      mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.28, 16), matTi, 0, 0, 0, art).rotation.z = Math.PI / 2;

      grupo.rotation.set(0.16, -0.3, 0);
      return;
    }

    // 14) 1986-1993: Scaffold poroso 3D de PLGA + árbol angiogénico de calibre decreciente + osteoblastos con filopodios + RGD
    if(anio === 1986){
      const sc = new THREE.Group(); grupo.add(sc);
      for(let k = -1; k <= 1; k++){
        mesh(new THREE.TorusGeometry(0.68, 0.026, 12, 44), matScaffold, 0, k * 0.36, 0, sc).rotation.x = Math.PI / 2;
        mesh(new THREE.TorusGeometry(0.36, 0.02, 10, 32), matScaffold, 0, k * 0.36, 0, sc).rotation.x = Math.PI / 2;
      }
      for(let i = 0; i < 8; i++){
        const a = (i / 8) * Math.PI * 2;
        mesh(tuboCurvo([[Math.cos(a) * 0.68, -0.44, Math.sin(a) * 0.68], [Math.cos(a + 0.35) * 0.64, 0, Math.sin(a + 0.35) * 0.64], [Math.cos(a) * 0.68, 0.44, Math.sin(a) * 0.68]], 0.022, 20, false, 8), matScaffold, 0, 0, 0, sc);
        if(i % 2 === 0){
          mesh(tuboCurvo([[Math.cos(a) * 0.36, -0.4, Math.sin(a) * 0.36], [Math.cos(a) * 0.68, 0, Math.sin(a) * 0.68], [Math.cos(a) * 0.36, 0.4, Math.sin(a) * 0.36]], 0.018, 18, false, 8), matScaffold, 0, 0, 0, sc);
        }
      }
      mesh(tuboVariable([[-0.85, -0.35, 0.24], [-0.3, -0.08, 0.12], [0.22, 0.1, -0.06], [0.85, 0.36, -0.22]], u => 0.044 * (1 - u * 0.35), 28, 12), matVaso, 0, 0, 0, sc);
      mesh(tuboVariable([[-0.18, -0.02, 0.08], [0.15, -0.28, 0.35], [0.58, -0.42, 0.45]], u => 0.028 * (1 - u * 0.55), 20, 10), matVaso, 0, 0, 0, sc);
      mesh(tuboVariable([[0.12, 0.06, -0.02], [-0.15, 0.38, 0.28], [-0.52, 0.52, 0.36]], u => 0.026 * (1 - u * 0.55), 20, 10), matVaso, 0, 0, 0, sc);

      [[0.46, 0.22, 0.46], [-0.46, -0.16, 0.44], [0.05, 0.4, -0.32], [-0.15, -0.36, -0.42], [0.5, -0.1, -0.36]].forEach(([x, y, z], i) => {
        celulaAdherida(sc, x, y, z, 0.1, matMembrana, matNucleo, 80 + i);
      });
      for(let i = 0; i < 10; i++){
        const a = (i / 10) * Math.PI * 2 + 0.3;
        mesh(new THREE.OctahedronGeometry(0.032, 0), matOro, Math.cos(a) * 0.72, (i % 2 ? 0.16 : -0.16), Math.sin(a) * 0.72, sc);
      }

      grupo.rotation.set(0.18, -0.35, 0);
      return;
    }

    // 15) 2018-actualidad (Chengdu): Nanopartícula lipídica/polimérica inteligente en corte 240° con doble hélice ARN/ADN, cepillos PEG y anticuerpos en Y
    const nano = new THREE.Group(); nano.rotation.set(0.2, -0.25, 0); grupo.add(nano);
    const phiNano = Math.PI * 1.42;
    const extCap = perfilTorneado((() => {
      const p = [];
      for(let i = 0; i <= 24; i++){ const a = (i / 24) * Math.PI; p.push([Math.sin(a) * 0.64, -Math.cos(a) * 0.64]); }
      for(let i = 24; i >= 0; i--){ const a = (i / 24) * Math.PI; p.push([Math.sin(a) * 0.5, -Math.cos(a) * 0.5]); }
      return p;
    })(), 44, 0.4, phiNano);
    mesh(extCap, matNanoExt, 0, 0, 0, nano);
    const innerLayer = perfilTorneado((() => {
      const p = [];
      for(let i = 0; i <= 20; i++){ const a = (i / 20) * Math.PI; p.push([Math.sin(a) * 0.48, -Math.cos(a) * 0.48]); }
      for(let i = 20; i >= 0; i--){ const a = (i / 20) * Math.PI; p.push([Math.sin(a) * 0.42, -Math.cos(a) * 0.42]); }
      return p;
    })(), 40, 0.4, phiNano);
    mesh(innerLayer, matHCA, 0, 0, 0, nano);

    mesh(heliceGeo(0.14, 0.64, 2.2, 0.02, 72, 8), matVidrioBio, 0, 0, 0, nano);
    mesh(heliceGeo(0.14, 0.64, 2.2, 0.02, 72, 8), matOro, 0, 0, 0, nano).rotation.y = Math.PI;
    for(let i = 0; i < 7; i++){
      const y = -0.25 + i * 0.083, ang = (i / 6) * 2.2 * Math.PI * 2;
      mesh(tuboCurvo([[Math.cos(ang) * 0.14, y, Math.sin(ang) * 0.14], [-Math.cos(ang) * 0.14, y, -Math.sin(ang) * 0.14]], 0.011, 8, false, 6), matEsmalte, 0, 0, 0, nano);
    }

    const dirs = [[0, 1, 0], [0, -1, 0], [0.85, 0.5, 0], [-0.85, 0.4, 0.3], [0.3, -0.6, 0.72], [-0.6, -0.5, -0.6], [0.5, 0.45, -0.7], [-0.4, 0.65, -0.6]];
    dirs.forEach((dv, idx) => {
      const dir = new THREE.Vector3(...dv).normalize();
      const gAnt = new THREE.Group();
      gAnt.position.copy(dir.clone().multiplyScalar(0.64));
      gAnt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      nano.add(gAnt);
      if(idx % 2 === 0){
        mesh(tuboVariable([[0, 0, 0], [0, 0.16, 0]], 0.021, 8, 8), matOro, 0, 0, 0, gAnt);
        mesh(tuboVariable([[0, 0.15, 0], [-0.11, 0.3, 0]], 0.018, 8, 8), matOro, 0, 0, 0, gAnt);
        mesh(tuboVariable([[0, 0.15, 0], [0.11, 0.3, 0]], 0.018, 8, 8), matOro, 0, 0, 0, gAnt);
        mesh(new THREE.SphereGeometry(0.03, 12, 10), matHCA, -0.11, 0.31, 0, gAnt);
        mesh(new THREE.SphereGeometry(0.03, 12, 10), matHCA, 0.11, 0.31, 0, gAnt);
      } else {
        mesh(tuboVariable([[0, 0, 0], [0.05, 0.12, 0.03], [-0.04, 0.24, -0.02], [0.03, 0.35, 0.04]], u => 0.016 * (1 - u * 0.35), 14, 8), matVidrioBio, 0, 0, 0, gAnt);
      }
    });
  };
}

/* ---- Modelos 3D histológicos para "Las tres generaciones" (quietos al abrir) ---- */
export function escenaGen3D(modoId){
  return (grupo) => {
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
    <article class="lt-ficha" aria-live="polite"><div class="lt-split"><div id="lt3d"></div><div class="lt-info"></div></div></article>
    <div class="lt-nav"><button class="btn-secundario" id="ltPrev">Hito anterior</button><button class="btn-secundario" id="ltNext">Hito siguiente</button></div>
    ${(datos.normas || []).length ? `<h3 class="actv-sub">Las definiciones de consenso</h3>
    <div class="lt-normas">${datos.normas.map(n => `<div class="lt-norma"><b>${esc(n.codigo)}</b><span>${esc(n.titulo)}</span><p>${esc(n.clave)}</p><p class="dim">${esc(n.alcance)}</p></div>`).join('')}</div>` : ''}
    ${(datos.conceptos || []).length ? `<h3 class="actv-sub">Conceptos clave</h3>
    <div class="lt-conceptos">${datos.conceptos.map(c => `<details><summary>${esc(c.titulo)}</summary>
      <p>${esc(c.definicion)}</p>${c.detalle ? `<p class="dim">${esc(c.detalle)}</p>` : ''}${c.ejemplo ? `<p class="ej"><b>Ejemplo:</b> ${esc(c.ejemplo)}</p>` : ''}</details>`).join('')}</div>` : ''}`;

  const botones = [...r.querySelectorAll('.lt-hito')], ficha = r.querySelector('.lt-ficha'), info = r.querySelector('.lt-info');
  const visorHito = montarVisor3D(r.querySelector('#lt3d'), escenaHito3D(hitos[0].anio), { camPos:[0.2, 0.85, 3.45], autoGiro:false });
  function elegir(k, desplazar = true){
    sel = Math.max(0, Math.min(hitos.length - 1, k)); const h = hitos[sel];
    botones.forEach((b, j) => { b.classList.toggle('on', j === sel); b.setAttribute('aria-selected', j === sel); });
    if(desplazar) botones[sel].scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
    r.querySelectorAll('.lt-eras .chip').forEach(c => c.classList.toggle('on', c.dataset.era === h.era));
    ficha.className = `lt-ficha g${genDe(h.generacion)}`;
    visorHito.reemplazar(escenaHito3D(h.anio));
    info.innerHTML = `
      <p class="lt-fecha">${esc(h.fecha)} <span class="etq">${esc(h.era)}</span> <span class="etq">${esc(h.generacion)}</span> <span class="dim" aria-label="Hito ${sel + 1} de ${hitos.length}">· ${sel + 1}/${hitos.length}</span></p>
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
        <div class="cl-carta"><span class="dim">Dispositivo ${i + 1} de ${orden.length}</span><b>${esc(orden[i].dispositivo)}</b></div>
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
    const ultima = i === orden.length - 1;
    const fb = r.querySelector('.cl-feedback');
    fb.innerHTML = `<p class="dim">¿Dentro del cuerpo?: <b>${d.en_el_cuerpo ? 'Sí' : 'No'}</b> · ¿Reemplaza o aumenta?: <b>${d.reemplaza_aumenta ? 'Sí' : 'No'}</b></p>
      <div class="test-explica ${ok ? 'ok' : 'ko'}"><b>${ok ? 'Correcto' : 'No es esa casilla'}: ${esc(d.clasificacion || CASILLAS[buena].nombre)}.</b>${d.explicacion ? `<p>${esc(d.explicacion)}</p>` : ''}</div>
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
