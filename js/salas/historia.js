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

// Texturas procedimentales cacheadas una sola vez (256x256: rápidas y nítidas en cualquier visor WebGL)
const texHueso = (() => {
  const rng = crearRng(101);
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#E8D8B8'; g.fillRect(0, 0, w, h);
    for(let i = 0; i < 420; i++){
      const y = rng() * h, len = 24 + rng() * 90;
      g.fillStyle = rng() > 0.5 ? 'rgba(255,250,238,0.18)' : 'rgba(176,148,104,0.16)';
      g.fillRect(rng() * w, y, len, 1.5);
    }
    for(let i = 0; i < 240; i++){
      const x = rng() * w, y = rng() * h, r = 1 + rng() * 3.5;
      g.fillStyle = 'rgba(138,108,74,0.18)';
      g.beginPath(); g.ellipse(x, y, r * 1.4, r * 0.7, rng() * 0.5, 0, Math.PI * 2); g.fill();
    }
  });
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1.4, 1.4);
  return t;
})();

const texHuesoBump = (() => {
  const rng = crearRng(202);
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for(let i = 0; i < 450; i++){
      const x = rng() * w, y = rng() * h, r = 1.5 + rng() * 5.5;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, '#2A2A2A'); gr.addColorStop(0.7, '#646464'); gr.addColorStop(1, 'rgba(160,160,160,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  });
  t.repeat.set(1.4, 1.4);
  return t;
})();

const texTejido = (() => {
  const rng = crearRng(303);
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#EFE9DA'; g.fillRect(0, 0, w, h);
    for(let y = 0; y < h; y += 6){
      for(let x = 0; x < w; x += 6){
        const alt = ((x / 6 + y / 6) | 0) % 2;
        g.fillStyle = alt ? 'rgba(255,255,255,0.28)' : 'rgba(130,118,96,0.18)';
        g.fillRect(x, y, 5, 3);
        g.fillStyle = alt ? 'rgba(130,118,96,0.14)' : 'rgba(255,255,255,0.22)';
        g.fillRect(x + 1, y + 3, 4, 3);
      }
    }
    for(let i = 0; i < 300; i++){
      g.fillStyle = `rgba(90,80,65,${rng() * 0.08})`;
      g.fillRect(rng() * w, rng() * h, 2, 2);
    }
  });
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(4, 3);
  return t;
})();

const texMetalCepillado = (() => {
  const rng = crearRng(404);
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#D4DCE8'; g.fillRect(0, 0, w, h);
    for(let i = 0; i < 900; i++){
      const y = rng() * h, alpha = 0.05 + rng() * 0.14;
      g.fillStyle = rng() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(110,124,148,${alpha})`;
      g.fillRect(0, y, w, 1);
    }
  });
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(2, 2);
  return t;
})();

const texIris = (() => {
  const rng = crearRng(505);
  const t = canvasTex(256, 256, (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    g.fillStyle = '#1E4668'; g.fillRect(0, 0, w, h);
    const gr = g.createRadialGradient(cx, cy, 24, cx, cy, 128);
    gr.addColorStop(0, '#44A0B8'); gr.addColorStop(0.55, '#2A6B8F'); gr.addColorStop(1, '#122A45');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for(let i = 0; i < 160; i++){
      const a = (i / 160) * Math.PI * 2 + (rng() - 0.5) * 0.04;
      g.strokeStyle = rng() > 0.45 ? 'rgba(130,220,235,0.28)' : 'rgba(12,26,48,0.35)';
      g.lineWidth = 1.2 + rng() * 1.5;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32);
      g.lineTo(cx + Math.cos(a) * 124, cy + Math.sin(a) * 124);
      g.stroke();
    }
  });
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

// Materiales PBR de estudio
const matTi = new THREE.MeshPhysicalMaterial({ color:0xD4DCE8, metalness:0.94, roughness:0.22, clearcoat:0.18, map:texMetalCepillado, bumpMap:texMetalCepillado, bumpScale:0.008 });
const matCoCr = new THREE.MeshPhysicalMaterial({ color:0xE4EAF4, metalness:0.98, roughness:0.1, clearcoat:0.35, clearcoatRoughness:0.06 });
const matOro = new THREE.MeshPhysicalMaterial({ color:0xFFD278, metalness:0.94, roughness:0.18, clearcoat:0.2 });
const matHierroOx = new THREE.MeshPhysicalMaterial({ color:0x68483E, metalness:0.55, roughness:0.78 });
const matHerrumbre = new THREE.MeshStandardMaterial({ color:0x9E3E2A, roughness:0.92, metalness:0.08 });
const matHuesoCort = new THREE.MeshPhysicalMaterial({ color:0xEFE2C6, roughness:0.58, metalness:0.02, map:texHueso, bumpMap:texHuesoBump, bumpScale:0.015, clearcoat:0.08 });
const matHuesoTrab = new THREE.MeshPhysicalMaterial({ color:0xCCA47E, roughness:0.86, map:texHueso, bumpMap:texHuesoBump, bumpScale:0.038 });
const matEncia = new THREE.MeshPhysicalMaterial({ color:0xD66B7F, roughness:0.42, clearcoat:0.32, sheen:0.45, sheenColor:0xFFB8C6 });
const matEsmalte = new THREE.MeshPhysicalMaterial({ color:0xF8F3E6, roughness:0.15, clearcoat:0.85, clearcoatRoughness:0.1 });
const matNacar = new THREE.MeshPhysicalMaterial({ color:0xF2F7FF, roughness:0.12, metalness:0.14, clearcoat:1, clearcoatRoughness:0.05, sheen:0.9, sheenColor:0x7FF5DF, emissive:0x154E48, emissiveIntensity:0.2 });
const matVidrioBio = new THREE.MeshPhysicalMaterial({ color:0x5FF2D2, roughness:0.08, metalness:0.04, ior:1.52, clearcoat:1, transparent:true, opacity:0.74, emissive:0x0A4B42, emissiveIntensity:0.22 });
const matVidrioClaro = new THREE.MeshPhysicalMaterial({ color:0xE6F7FF, roughness:0.05, metalness:0.02, ior:1.5, clearcoat:1, transparent:true, opacity:0.34, side:THREE.DoubleSide, depthWrite:false });
const matHCA = new THREE.MeshPhysicalMaterial({ color:0x9FFAE5, roughness:0.26, metalness:0.05, clearcoat:0.6, emissive:0x1A7C6A, emissiveIntensity:0.32 });
const matPMMA = new THREE.MeshPhysicalMaterial({ color:0xD6F5FF, roughness:0.03, metalness:0.02, ior:1.49, clearcoat:1, clearcoatRoughness:0.02, transparent:true, opacity:0.74, side:THREE.DoubleSide });
const matCemento = new THREE.MeshPhysicalMaterial({ color:0xEADBA6, roughness:0.48, clearcoat:0.18, side:THREE.DoubleSide });
const matUHMWPE = new THREE.MeshPhysicalMaterial({ color:0xF7F3E8, roughness:0.26, clearcoat:0.32, sheen:0.4, sheenColor:0xFFF8E6, side:THREE.DoubleSide });
const matPyC = new THREE.MeshPhysicalMaterial({ color:0x232834, metalness:0.68, roughness:0.08, clearcoat:0.95, clearcoatRoughness:0.04 });
const matTejido = new THREE.MeshPhysicalMaterial({ color:0xF2ECDE, roughness:0.86, map:texTejido, bumpMap:texTejido, bumpScale:0.014, sheen:0.4, sheenColor:0xFFFFFF });
const matSilicona = new THREE.MeshPhysicalMaterial({ color:0xF47C8C, roughness:0.28, clearcoat:0.48, sheen:0.35, sheenColor:0xFFC2CA });
const matEpoxi = new THREE.MeshPhysicalMaterial({ color:0xE89D3C, roughness:0.08, ior:1.54, clearcoat:1, transparent:true, opacity:0.52, side:THREE.DoubleSide });
const matPLA = new THREE.MeshPhysicalMaterial({ color:0xF5C972, roughness:0.32, clearcoat:0.38, transparent:true, opacity:0.92 });
const matScaffold = new THREE.MeshPhysicalMaterial({ color:0xB6A4FF, roughness:0.4, clearcoat:0.25, sheen:0.3, sheenColor:0xDFD6FF });
const matVaso = new THREE.MeshPhysicalMaterial({ color:0xD9435A, roughness:0.36, clearcoat:0.42, sheen:0.4, sheenColor:0xFF9AA8 });
const matFibroso = new THREE.MeshPhysicalMaterial({ color:0xFF7B8E, roughness:0.5, transparent:true, opacity:0.52, side:THREE.DoubleSide });
const matColageno = new THREE.MeshPhysicalMaterial({ color:0xFFE0B4, roughness:0.45, sheen:0.45, sheenColor:0xFFF2DC });
const matLino = new THREE.MeshStandardMaterial({ color:0xE7D4A6, roughness:0.78 });

/* =========================================================
   Constructores geométricos biomédicos reutilizables
   ========================================================= */
function perfilTorneado(paresRY, segs = 36, phiStart = 0, phiLength = Math.PI * 2){
  const pts = paresRY.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y));
  return new THREE.LatheGeometry(pts, segs, phiStart, phiLength);
}

function tuboCurvo(puntos, rTubo, segs = 32, cerrado = false, radSegs = 8){
  const vecs = puntos.map(p => p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]));
  const curva = new THREE.CatmullRomCurve3(vecs, cerrado, 'catmullrom', 0.45);
  return new THREE.TubeGeometry(curva, segs, rTubo, radSegs, cerrado);
}

function heliceGeo(rFunc, h, vueltas, rTubo, segs = 96, radSegs = 7, axis = 'y'){
  const pts = [];
  for(let i = 0; i <= segs; i++){
    const u = i / segs;
    const ang = u * vueltas * Math.PI * 2;
    const r = typeof rFunc === 'function' ? rFunc(u) : rFunc;
    const pos = (u - 0.5) * h;
    if(axis === 'x') pts.push(new THREE.Vector3(pos, Math.cos(ang) * r, Math.sin(ang) * r));
    else pts.push(new THREE.Vector3(Math.cos(ang) * r, pos, Math.sin(ang) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, rTubo, radSegs, false);
}

function extruirCentrado(shape, depth, { bevelThickness = 0.025, bevelSize = 0.02, bevelSegments = 3, curveSegments = 20 } = {}){
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled:true, bevelThickness, bevelSize, bevelSegments, curveSegments });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function corrugadoGeo(rBase, amp, ondas, h, rWall = 0.018, segs = 36, phiLength = Math.PI * 2){
  const pts = [], steps = ondas * 6;
  for(let i = 0; i <= steps; i++){
    const u = i / steps;
    const r = rBase + Math.sin(u * ondas * Math.PI * 2) * amp;
    pts.push([r, (u - 0.5) * h]);
  }
  for(let i = steps; i >= 0; i--){
    const u = i / steps;
    const r = Math.max(0.01, rBase - rWall + Math.sin(u * ondas * Math.PI * 2) * amp * 0.6);
    pts.push([r, (u - 0.5) * h]);
  }
  pts.push(pts[0]);
  return perfilTorneado(pts, segs, 0, phiLength);
}

// Cuña / bloque curvo anatómico de hueso cortical + esponjoso con trabéculas internas
function huesoBloque(parent, w, h, d, { curva = 0.12, seed = 11, conTrabeculas = true, nTrab = 8 } = {}){
  const g = new THREE.Group();
  parent.add(g);
  const hw = w / 2, hh = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw, -hh);
  s.quadraticCurveTo(0, -hh - curva, hw, -hh);
  s.lineTo(hw, hh);
  s.quadraticCurveTo(0, hh + curva, -hw, hh);
  s.closePath();
  mesh(extruirCentrado(s, d, { bevelThickness:0.03, bevelSize:0.025, bevelSegments:3 }), matHuesoCort, 0, 0, 0, g);

  // Lecho trabecular esponjoso interior expuesto en el corte frontal (+Z)
  const st = new THREE.Shape();
  const iw = hw * 0.82, ih = hh * 0.62;
  st.moveTo(-iw, -ih);
  st.quadraticCurveTo(0, -ih - curva * 0.65, iw, -ih);
  st.lineTo(iw, ih);
  st.quadraticCurveTo(0, ih + curva * 0.65, -iw, ih);
  st.closePath();
  mesh(extruirCentrado(st, d + 0.055, { bevelThickness:0.01, bevelSize:0.01, bevelSegments:2 }), matHuesoTrab, 0, 0, 0, g);

  if(conTrabeculas) trabeculasGrupo(g, iw * 1.75, ih * 1.65, d + 0.08, nTrab, matHuesoCort, seed);
  return g;
}

function trabeculasGrupo(parent, ancho, alto, prof, cantidad, mat, seed = 1){
  const rng = crearRng(seed);
  for(let i = 0; i < cantidad; i++){
    const x0 = (rng() - 0.5) * ancho * 0.85;
    const y0 = (rng() - 0.5) * alto * 0.7;
    const z0 = (rng() > 0.5 ? 1 : -1) * (prof * 0.48);
    const x1 = x0 + (rng() - 0.5) * ancho * 0.45;
    const y1 = y0 + (rng() - 0.5) * alto * 0.55;
    const xm = (x0 + x1) * 0.5 + (rng() - 0.5) * 0.08;
    const ym = (y0 + y1) * 0.5 + (rng() - 0.5) * 0.08;
    mesh(tuboCurvo([[x0, y0, z0], [xm, ym, z0 * 1.03], [x1, y1, z0]], 0.013 + rng() * 0.008, 12, false, 6), mat, 0, 0, 0, parent);
  }
}

function tornilloBiomedico(parent, { rMax = 0.11, rTip = 0.055, hCuerpo = 0.78, vueltas = 6.5, rFilete = 0.02, hCuello = 0.16, rCuello = 0.115, tipoCabeza = 'hex', mat = matTi, matRosca = matTi } = {}){
  const g = new THREE.Group();
  parent.add(g);
  // Cuerpo cónico-cilíndrico torneado con cuello pulido
  const y0 = -hCuerpo / 2;
  const y1 = hCuerpo / 2;
  const perfil = [
    [0, y0 - 0.05], [rTip * 0.55, y0 - 0.03], [rTip, y0 + 0.05],
    [rMax * 0.92, y1 - 0.06], [rCuello, y1], [rCuello, y1 + hCuello * 0.75],
    [rCuello * 0.88, y1 + hCuello], [0, y1 + hCuello]
  ];
  mesh(perfilTorneado(perfil, 32), mat, 0, 0, 0, g);
  // Rosca helicoidal continua real (progresiva desde la punta autorroscante)
  const rFn = u => {
    const taper = u < 0.16 ? 0.55 + (u / 0.16) * 0.45 : (u > 0.9 ? 1 - (u - 0.9) * 2.5 : 1);
    return (rTip + (rMax - rTip) * Math.min(1, u * 1.15)) * taper + rFilete * 0.45;
  };
  mesh(heliceGeo(rFn, hCuerpo * 0.88, vueltas, rFilete, 108, 6), matRosca, 0, -0.02, 0, g);

  const yCab = y1 + hCuello;
  if(tipoCabeza === 'hex'){
    mesh(new THREE.CylinderGeometry(rCuello * 0.78, rCuello * 0.78, 0.11, 6), mat, 0, yCab + 0.055, 0, g);
    mesh(perfilTorneado([[rCuello * 0.25, yCab + 0.11], [rCuello * 0.45, yCab + 0.11], [rCuello * 0.45, yCab + 0.16], [0, yCab + 0.16]], 18), matCoCr, 0, 0, 0, g);
  } else if(tipoCabeza === 'ranura'){
    mesh(perfilTorneado([[0, yCab], [rCuello * 1.25, yCab], [rCuello * 1.28, yCab + 0.06], [rCuello * 0.95, yCab + 0.11], [0, yCab + 0.11]], 24), mat, 0, 0, 0, g);
    mesh(tuboCurvo([[-rCuello * 0.85, yCab + 0.105, 0], [0, yCab + 0.1, 0], [rCuello * 0.85, yCab + 0.105, 0]], 0.015, 8, false, 6), matPyC, 0, 0, 0, g);
  } else if(tipoCabeza === 'avellanada'){
    mesh(perfilTorneado([[0, yCab], [rCuello * 1.32, yCab + 0.03], [rCuello * 1.15, yCab + 0.08], [0, yCab + 0.08]], 24), mat, 0, 0, 0, g);
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
      const dx = (k % 2 ? 1 : -1) * paso * 0.36;
      pts.push(new THREE.Vector3(x0 + dx, Math.cos(a) * R, Math.sin(a) * R));
    }
    mesh(tuboCurvo(pts, rStrut, zigs * 6, true, 6), mat, 0, 0, 0, g);
    if(r < anillos - 1){
      for(let b = 0; b < 3; b++){
        const a = (b / 3) * Math.PI * 2 + r * 0.7;
        const pA = [x0 + paso * 0.25, Math.cos(a) * R, Math.sin(a) * R];
        const pB = [x0 + paso * 0.75, Math.cos(a + 0.12) * R, Math.sin(a + 0.12) * R];
        mesh(tuboCurvo([pA, [(pA[0] + pB[0]) * 0.5, Math.cos(a + 0.06) * R * 1.02, Math.sin(a + 0.06) * R * 1.02], pB], rStrut * 0.85, 8, false, 5), mat, 0, 0, 0, g);
      }
    }
  }
  return g;
}

function celulaAdherida(parent, x, y, z, r = 0.11, matMembrana, matNucleo, seed = 7){
  const rng = crearRng(seed);
  const cg = new THREE.Group();
  cg.position.set(x, y, z);
  parent.add(cg);
  const soma = mesh(new THREE.SphereGeometry(r, 20, 14), matMembrana, 0, 0, 0, cg);
  soma.scale.set(1.25, 0.58, 1.05);
  mesh(new THREE.SphereGeometry(r * 0.42, 14, 10), matNucleo, 0, r * 0.08, 0, cg);
  for(let i = 0; i < 4; i++){
    const a = (i / 4) * Math.PI * 2 + rng() * 0.5;
    const len = r * (1.7 + rng() * 0.8);
    mesh(tuboCurvo([[Math.cos(a) * r * 0.7, 0, Math.sin(a) * r * 0.7], [Math.cos(a) * len * 0.65, -r * 0.15, Math.sin(a) * len * 0.65], [Math.cos(a + 0.18) * len, -r * 0.35, Math.sin(a + 0.18) * len]], r * 0.12, 10, false, 5), matMembrana, 0, 0, 0, cg);
  }
  return cg;
}

function cristalHCA(parent, x, y, z, r = 0.024, h = 0.085, mat = matHCA, rx = 0, rz = 0){
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.set(rx, 0, rz);
  parent.add(g);
  mesh(new THREE.CylinderGeometry(r * 0.72, r, h, 6), mat, 0, h * 0.5, 0, g);
  mesh(new THREE.ConeGeometry(r * 0.72, h * 0.35, 6), mat, 0, h * 1.17, 0, g);
  return g;
}

/* =========================================================
   Vitrina 01 del pasillo: construir(d, ctx)
   ========================================================= */
const pedMat = std(0x3A2F6E, { roughness:.35, metalness:.3 });
const ringGlow = basicGlow(0xFFD58A, 1.8);
const coneMat = new THREE.MeshBasicMaterial({ color:0xFFE2A8, transparent:true, opacity:0.06, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });

function pedestal(d, x, z = -3.8){
  mesh(new THREE.CylinderGeometry(0.38, 0.42, 1.4, 24), pedMat, x, -1.45, z, d);
  mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.03, 24), ringGlow, x, -0.74, z, d);
  mesh(new THREE.ConeGeometry(0.7, 2.6, 24, 1, true), coneMat, x, 0.55, z, d);
  const g = new THREE.Group(); g.position.set(x, -0.25, z); d.add(g); return g;
}

function placa(d, texto, x, y, z, w = 0.5){
  const p = canvasPlane(w, 0.16, 320, 100, (g, W, H) => {
    g.fillStyle = '#F4EBD8'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#3A2F1E'; g.font = '700 46px Sora, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, W / 2, H / 2);
  });
  p.material.toneMapped = true; p.position.set(x, y, z); d.add(p); return p;
}

export function construir(d, ctx){
  ctx.sala(d, 0x2A2350); ctx.luz(d, 0xFFD58A, 16);
  // Línea temporal pintada en la pared del fondo
  const linea = canvasPlane(5.2, 1.0, 1560, 300, (g, w, h) => {
    g.fillStyle = '#1C1640'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#FFD58A'; g.lineWidth = 6; g.beginPath(); g.moveTo(40, 150); g.lineTo(w - 40, 150); g.stroke();
    const hitos = [['Antigüedad', 'suturas, dientes'], ['1949', 'Ridley · PMMA'], ['1960', 'Charnley · cadera'], ['1969', 'Hench · Bioglass'], ['1977', 'Brånemark'], ['2018', 'Chengdu']];
    hitos.forEach(([a, b], i) => {
      const x = 80 + i * (w - 160) / (hitos.length - 1);
      g.fillStyle = '#FFD58A'; g.beginPath(); g.arc(x, 150, 14, 0, 7); g.fill();
      g.fillStyle = '#F4EBD8'; g.font = '700 40px Sora, sans-serif'; g.textAlign = 'center'; g.fillText(a, x, 100);
      g.font = '400 30px Sora, sans-serif'; g.fillStyle = '#CFC6FF'; g.fillText(b, x, 215);
    });
  });
  linea.position.set(0, 1.1, -6.15); d.add(linea);

  const [p1, p2, p3] = [-1.6, 0, 1.6].map(x => pedestal(d, x));

  // Pedestal 1 (1ª generación · bioinerte): tornillo de titanio mecanizado con rosca helicoidal real
  tornilloBiomedico(p1, { rMax:0.095, rTip:0.048, hCuerpo:0.52, vueltas:6, rFilete:0.017, hCuello:0.11, rCuello:0.098, tipoCabeza:'hex', mat:matTi, matRosca:matCoCr });

  // Pedestal 2 (2ª generación · bioactiva): cápsula de ensayo con Bioglass 45S5, microcristales de HCA e iones
  const crisol = perfilTorneado([[0, -0.24], [0.22, -0.24], [0.27, -0.14], [0.25, 0.08], [0.23, 0.08], [0.24, -0.13], [0.19, -0.21], [0, -0.21]], 32);
  mesh(crisol, matVidrioClaro, 0, 0, 0, p2);
  const rng2 = crearRng(77);
  const granGeo = new THREE.DodecahedronGeometry(0.052, 0);
  for(let i = 0; i < 16; i++){
    const ang = rng2() * Math.PI * 2, rad = 0.03 + rng2() * 0.14, yy = -0.16 + (i % 3) * 0.055;
    const gm = mesh(granGeo, matVidrioBio, Math.cos(ang) * rad, yy, Math.sin(ang) * rad, p2);
    gm.rotation.set(rng2() * 3, rng2() * 3, rng2() * 3);
    gm.scale.setScalar(0.65 + rng2() * 0.55);
  }
  for(let i = 0; i < 10; i++){
    const ang = (i / 10) * Math.PI * 2 + 0.2, rad = 0.06 + (i % 2) * 0.08;
    cristalHCA(p2, Math.cos(ang) * rad, -0.02, Math.sin(ang) * rad, 0.016, 0.065, matHCA, (rng2() - 0.5) * 0.4, (rng2() - 0.5) * 0.4);
  }
  const ionesP2 = [];
  const ionGeo = new THREE.SphereGeometry(0.022, 10, 8);
  for(let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    const m = mesh(ionGeo, i % 2 ? matHCA : matOro, Math.cos(a) * 0.13, 0.05 + (i % 3) * 0.07, Math.sin(a) * 0.13, p2);
    ionesP2.push({ m, y0:0.06 + (i % 3) * 0.06, fase:i * 0.8 });
  }

  // Pedestal 3 (3ª generación · regenerativa): scaffold poroso cilíndrico 3D con angiogénesis y células
  const scG = new THREE.Group(); p3.add(scG);
  const rSc = 0.21;
  for(let k = 0; k < 4; k++){
    const yy = -0.21 + k * 0.14;
    mesh(new THREE.TorusGeometry(rSc, 0.015, 8, 28), matScaffold, 0, yy, 0, scG).rotation.x = Math.PI / 2;
    mesh(new THREE.TorusGeometry(rSc * 0.55, 0.012, 8, 20), matScaffold, 0, yy, 0, scG).rotation.x = Math.PI / 2;
  }
  for(let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    mesh(tuboCurvo([[Math.cos(a) * rSc, -0.21, Math.sin(a) * rSc], [Math.cos(a + 0.25) * rSc * 0.92, 0, Math.sin(a + 0.25) * rSc * 0.92], [Math.cos(a) * rSc, 0.21, Math.sin(a) * rSc]], 0.012, 14, false, 6), matScaffold, 0, 0, 0, scG);
  }
  // Capilar sanguíneo bifurcado atravesando el scaffold + células adheridas
  mesh(tuboCurvo([[-0.24, -0.18, 0.06], [-0.08, -0.04, 0.02], [0.06, 0.06, -0.03], [0.24, 0.22, -0.06]], 0.022, 20, false, 8), matVaso, 0, 0, 0, scG);
  mesh(tuboCurvo([[-0.04, 0, 0.01], [0.09, -0.09, 0.12], [0.22, -0.15, 0.16]], 0.014, 14, false, 6), matVaso, 0, 0, 0, scG);
  const matNuc = basicGlow(0x5FF2D2, 1.3);
  const matMem = new THREE.MeshPhysicalMaterial({ color:0xD6E8FF, roughness:0.3, clearcoat:0.6, transparent:true, opacity:0.86 });
  celulaAdherida(scG, 0.15, 0.08, 0.12, 0.042, matMem, matNuc, 12);
  celulaAdherida(scG, -0.14, -0.08, 0.14, 0.038, matMem, matNuc, 15);
  celulaAdherida(scG, 0.02, 0.18, -0.14, 0.038, matMem, matNuc, 19);

  [['1ª', -1.6], ['2ª', 0], ['3ª', 1.6]].forEach(([t, x]) => placa(d, t + ' generación', x, -0.9, -3.38, 0.62));
  ctx.anim(t => {
    [p1, p2, p3].forEach((g, i) => {
      g.rotation.y = t * 0.45 + i;
      g.position.y = -0.25 + Math.sin(t + i) * 0.04;
    });
    ionesP2.forEach(({ m, y0, fase }) => { m.position.y = y0 + Math.sin(t * 2.2 + fase) * 0.055; });
  });
}

/* =========================================================
   Actividades de la sala (se abren en el visor con { datos, vitrina, avisar })
   Todo el contenido sale de datos/historia.json
   ========================================================= */

function genDe(texto = ''){ return /3ª/.test(texto) ? 3 : /2ª/.test(texto) ? 2 : /1ª/.test(texto) ? 1 : 0; }
const anioTxt = (a) => a < 0 ? `${Math.abs(a)} a. C.` : a < 1000 ? `${a} d. C.` : String(a);

/* ---- Modelos 3D anatómicos y mecánicos para los 15 hitos ---- */
export function escenaHito3D(anio){
  return (grupo) => {

    // 1) Prehistoria (~7000 a. C.): bloque anatómico curvo de piel/dermis, sutura continua de lino, aguja ósea y punta lítica
    if(anio < 0){
      const pielShape = new THREE.Shape();
      pielShape.moveTo(-1.05, -0.22);
      pielShape.quadraticCurveTo(0, -0.34, 1.05, -0.22);
      pielShape.lineTo(1.05, 0.06);
      pielShape.quadraticCurveTo(0.18, 0.18, 0.04, 0.12);
      pielShape.lineTo(0, -0.02);
      pielShape.lineTo(-0.04, 0.12);
      pielShape.quadraticCurveTo(-0.18, 0.18, -1.05, 0.06);
      pielShape.closePath();

      const matDermis = new THREE.MeshPhysicalMaterial({ color:0x9B5468, roughness:0.65, clearcoat:0.25, sheen:0.4, sheenColor:0xE09AAE });
      const matSubcut = new THREE.MeshPhysicalMaterial({ color:0xD9A86A, roughness:0.78 });
      const tejido = new THREE.Group(); tejido.rotation.y = Math.PI / 2;
      mesh(extruirCentrado(pielShape, 1.55, { bevelThickness:0.03, bevelSize:0.025 }), matDermis, 0, -0.04, 0, tejido);
      // Capa subcutánea en la base
      const subShape = new THREE.Shape();
      subShape.moveTo(-1.02, -0.34); subShape.quadraticCurveTo(0, -0.45, 1.02, -0.34);
      subShape.lineTo(1.02, -0.22); subShape.quadraticCurveTo(0, -0.34, -1.02, -0.22); subShape.closePath();
      mesh(extruirCentrado(subShape, 1.52, { bevelThickness:0.015, bevelSize:0.015 }), matSubcut, 0, -0.04, 0, tejido);
      grupo.add(tejido);

      // Sutura continua cruzada de lino + nudos
      for(let i = -3; i <= 2; i++){
        const zA = i * 0.22, zB = (i + 1) * 0.22;
        mesh(tuboCurvo([[-0.18, 0.1, zA], [0, 0.24, (zA + zB) * 0.5], [0.18, 0.1, zB]], 0.022, 16, false, 6), matLino, 0, 0, 0, grupo);
        mesh(tuboCurvo([[0.18, 0.1, zA], [0, 0.22, zA]], 0.02, 12, false, 6), matLino, 0, 0, 0, grupo);
      }
      mesh(new THREE.TorusGeometry(0.045, 0.018, 8, 16), matLino, -0.18, 0.11, -0.66, grupo);
      // Aguja ósea curvada con ojo enhebrado
      const aguja = new THREE.Group(); aguja.position.set(0.35, 0.36, 0.62); aguja.rotation.set(0.25, -0.35, 0.45);
      mesh(tuboCurvo([[-0.32, 0.12, 0], [-0.08, 0.28, 0], [0.18, 0.18, 0], [0.34, 0.02, 0]], 0.022, 20, false, 8), matHuesoCort, 0, 0, 0, aguja);
      mesh(new THREE.ConeGeometry(0.022, 0.11, 10), matHuesoCort, 0.38, -0.02, 0, aguja).rotation.z = -2.25;
      mesh(tuboCurvo([[-0.32, 0.12, 0], [-0.48, -0.06, -0.05], [-0.36, -0.22, -0.12]], 0.016, 16, false, 6), matLino, 0, 0, 0, aguja);
      grupo.add(aguja);

      // Punta de lanza lítica (Kennewick) encajada en cresta ósea lateral
      const lanzaS = new THREE.Shape();
      lanzaS.moveTo(0, 0.56); lanzaS.quadraticCurveTo(0.18, 0.12, 0.13, -0.28);
      lanzaS.lineTo(-0.13, -0.28); lanzaS.quadraticCurveTo(-0.18, 0.12, 0, 0.56);
      const lanza = mesh(extruirCentrado(lanzaS, 0.06, { bevelThickness:0.025, bevelSize:0.03, bevelSegments:2 }), new THREE.MeshPhysicalMaterial({ color:0x666E7A, roughness:0.78, metalness:0.05 }), 0.72, 0.22, -0.32, grupo);
      lanza.rotation.set(0.25, -0.4, -0.45);
      mesh(new THREE.TorusGeometry(0.18, 0.045, 10, 24), matHuesoCort, 0.64, -0.05, -0.34, grupo).rotation.x = 1.2;

      return t => { grupo.rotation.y = Math.sin(t * 0.45) * 0.4; };
    }

    // 2) 200-600 d. C.: Arco mandibular curvo seccionado + dientes naturales + incisivo maya de nácar + implante de hierro romano + halo HCA
    if(anio === 200){
      // Arco mandibular curvo en sección
      const mandS = new THREE.Shape();
      mandS.absarc(0, -0.95, 1.35, 1.05, 2.09, false);
      mandS.absarc(0, -0.95, 0.85, 2.09, 1.05, true);
      mandS.closePath();
      const mand = mesh(extruirCentrado(mandS, 0.76, { bevelThickness:0.035, bevelSize:0.03, bevelSegments:3 }), matHuesoCort, 0, -0.25, 0, grupo);
      mand.rotation.x = Math.PI / 2;
      // Reborde gingival anatómico curvo
      const enciaGeo = tuboCurvo([[-0.76, -0.1, 0.12], [-0.38, -0.05, 0.25], [0, -0.03, 0.3], [0.38, -0.05, 0.25], [0.76, -0.1, 0.12]], 0.14, 28, false, 12);
      mesh(enciaGeo, matEncia, 0, 0, 0, grupo);
      mesh(tuboCurvo([[-0.74, -0.1, -0.12], [0, -0.05, 0.04], [0.74, -0.1, -0.12]], 0.12, 24, false, 10), matEncia, 0, 0, 0, grupo);
      trabeculasGrupo(grupo, 1.1, 0.25, 0.42, 7, matHuesoTrab, 21);

      // Dientes naturales adyacentes con corona torneada y raíz
      const perfilDiente = [[0, -0.34], [0.05, -0.22], [0.11, -0.02], [0.14, 0.08], [0.17, 0.28], [0.14, 0.42], [0.06, 0.45], [0, 0.42]];
      [-0.64, 0.64].forEach(x => {
        mesh(perfilTorneado(perfilDiente, 24), matEsmalte, x, 0.06, 0.14, grupo);
      });

      // Incisivo maya tallado en nácar (izquierda-centro) con muescas cervicales + halo cristalino HCA
      const perfilNacar = [[0, -0.32], [0.05, -0.22], [0.12, -0.08], [0.085, 0.02], [0.14, 0.16], [0.16, 0.38], [0.11, 0.47], [0, 0.48]];
      const maya = mesh(perfilTorneado(perfilNacar, 28), matNacar, -0.2, 0.08, 0.22, grupo);
      maya.scale.set(1.05, 1, 0.68);
      for(let i = 0; i < 8; i++){
        const a = (i / 8) * Math.PI * 2;
        cristalHCA(grupo, -0.2 + Math.cos(a) * 0.14, -0.06, 0.22 + Math.sin(a) * 0.11, 0.016, 0.075, matHCA, Math.sin(a) * 0.3, -Math.cos(a) * 0.3);
      }

      // Implante galorromano de hierro forjado (derecha-centro) con pátina oxidada
      const hierro = mesh(perfilTorneado([[0, -0.34], [0.04, -0.24], [0.1, -0.02], [0.13, 0.15], [0.14, 0.38], [0.08, 0.44], [0, 0.45]], 10), matHierroOx, 0.22, 0.06, 0.22, grupo);
      hierro.scale.set(0.95, 1, 0.72);
      mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 22), matHerrumbre, 0.22, 0.01, 0.22, grupo).rotation.x = Math.PI / 2;

      return t => { grupo.rotation.y = Math.sin(t * 0.35) * 0.55; };
    }

    // 3) 1829-1937: Diáfisis ósea con 3 lechos comparativos (Hierro corroído, Oro/Platino de Levert, Tornillo Vitallium de Strock 1937)
    if(anio === 1829){
      huesoBloque(grupo, 2.15, 0.68, 0.85, { curva:0.08, seed:33, nTrab:10 });

      // Izquierda: Hierro corroído (Zierold 1924) con cavidad osteolítica y herrumbre
      mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.12, 20), matHerrumbre, -0.68, 0.32, 0, grupo);
      mesh(perfilTorneado([[0, -0.28], [0.08, -0.26], [0.11, -0.05], [0.075, 0.08], [0.12, 0.26], [0.1, 0.56], [0, 0.62]], 18), matHierroOx, -0.68, 0.25, 0, grupo);
      for(let i = 0; i < 6; i++){
        const a = i * Math.PI / 3;
        mesh(new THREE.DodecahedronGeometry(0.05, 0), matHerrumbre, -0.68 + Math.cos(a) * 0.14, 0.36 + (i % 2) * 0.1, Math.sin(a) * 0.14, grupo);
      }

      // Centro: Alambre/clavija de Oro y Platino (Levert 1829) con cápsula fibrosa fina
      mesh(perfilTorneado([[0, -0.24], [0.06, -0.2], [0.09, 0.12], [0.13, 0.42], [0.09, 0.58], [0, 0.6]], 24), matOro, 0, 0.25, 0, grupo);
      mesh(tuboCurvo([[0, 0.82, 0], [0.12, 0.92, 0.05], [0.06, 0.84, -0.08]], 0.022, 16, false, 6), matCoCr, 0, 0, 0, grupo);
      mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.38, 20, 1, true), matFibroso, 0, 0.2, 0, grupo);

      // Derecha: Tornillo dental roscado de Vitallium (Co-Cr-Mo, Strock 1937) perfectamente osteointegrado
      const strock = tornilloBiomedico(grupo, { rMax:0.125, rTip:0.06, hCuerpo:0.75, vueltas:6, rFilete:0.022, hCuello:0.15, rCuello:0.12, tipoCabeza:'ranura', mat:matCoCr, matRosca:matCoCr });
      strock.position.set(0.68, 0.35, 0);

      return t => { grupo.rotation.y = Math.sin(t * 0.4) * 0.5; };
    }

    // 4) 1943-1960: Riñón artificial de tambor de Kolff (cubeta, soportes en A, listones, espiral de celofán de 11 vueltas) + shunt Scribner en U
    if(anio === 1943){
      // Cubeta semicircular esmaltada con baño dializador
      const cubS = new THREE.Shape();
      cubS.absarc(0, 0.1, 0.72, Math.PI, Math.PI * 2, false);
      cubS.absarc(0, 0.1, 0.64, Math.PI * 2, Math.PI, true);
      cubS.closePath();
      const cubeta = mesh(extruirCentrado(cubS, 1.52, { bevelThickness:0.02, bevelSize:0.015 }), new THREE.MeshPhysicalMaterial({ color:0xD8E4EE, roughness:0.25, metalness:0.18, clearcoat:0.6 }), 0, -0.1, -0.1, grupo);
      cubeta.rotation.y = Math.PI / 2;
      // Líquido dializador translúcido dentro de la cubeta
      const liqS = new THREE.Shape();
      liqS.absarc(0, 0.1, 0.62, Math.PI + 0.12, Math.PI * 2 - 0.12, false);
      liqS.closePath();
      const liq = mesh(extruirCentrado(liqS, 1.44, { bevelThickness:0.005, bevelSize:0.005 }), matVidrioClaro, 0, -0.1, -0.1, grupo);
      liq.rotation.y = Math.PI / 2;

      // Soportes laterales en A y eje metálico
      [-0.78, 0.78].forEach(x => {
        mesh(tuboCurvo([[x, -0.58, -0.45], [x, 0.25, -0.1], [x, -0.58, 0.25]], 0.032, 16, false, 8), matTi, 0, 0, 0, grupo);
        mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16), matCoCr, x, 0.25, -0.1, grupo).rotation.z = Math.PI / 2;
      });
      mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.72, 16), matCoCr, 0, 0.25, -0.1, grupo).rotation.z = Math.PI / 2;

      // Tambor giratorio de listones de madera/aluminio + espiral helicoidal continua de celofán (11 vueltas)
      const tambor = new THREE.Group(); tambor.position.set(0, 0.25, -0.1); grupo.add(tambor);
      [-0.62, 0.62].forEach(x => {
        mesh(new THREE.TorusGeometry(0.42, 0.025, 10, 28), matTi, x, 0, 0, tambor).rotation.y = Math.PI / 2;
      });
      for(let i = 0; i < 10; i++){
        const a = (i / 10) * Math.PI * 2;
        mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.28, 8), matHuesoCort, 0, Math.cos(a) * 0.4, Math.sin(a) * 0.4, tambor).rotation.z = Math.PI / 2;
      }
      const matCelofan = new THREE.MeshPhysicalMaterial({ color:0xFF7082, roughness:0.18, clearcoat:0.8, transparent:true, opacity:0.84 });
      mesh(heliceGeo(0.44, 1.18, 11, 0.026, 200, 6, 'x'), matCelofan, 0, 0, 0, tambor);

      // Shunt arteriovenoso en "U" de Scribner (1960) en primer plano: tubo Teflon/silicona + manguitos Dacron
      const shunt = tuboCurvo([[-0.52, -0.35, 0.62], [-0.46, -0.58, 0.72], [0, -0.66, 0.76], [0.46, -0.58, 0.72], [0.52, -0.35, 0.62]], 0.042, 32, false, 10);
      mesh(shunt, matPMMA, 0, 0, 0, grupo);
      mesh(tuboCurvo([[-0.52, -0.35, 0.62], [-0.46, -0.58, 0.72], [0, -0.66, 0.76], [0.46, -0.58, 0.72], [0.52, -0.35, 0.62]], 0.022, 28, false, 8), matVaso, 0, 0, 0, grupo);
      [-0.48, 0.48].forEach(x => {
        mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.14, 18), matTejido, x, -0.45, 0.68, grupo).rotation.z = x < 0 ? 0.3 : -0.3;
      });

      return t => { tambor.rotation.x = t * 1.15; grupo.rotation.y = Math.sin(t * 0.35) * 0.4; };
    }

    // 5) 1947-1952: Injerto vascular aorto-biilíaco corrugado (Vinyon-N / Dacron) con costura longitudinal y anastomosis aórtica
    if(anio === 1947){
      const injerto = new THREE.Group(); grupo.add(injerto);
      // Tramo superior de aorta nativa con pared rosada translúcida
      mesh(perfilTorneado([[0.27, 0.36], [0.29, 0.78], [0.23, 0.78], [0.21, 0.36], [0.27, 0.36]], 32), matVaso, 0, 0, 0, injerto);
      // Tronco principal corrugado de Dacron / Vinyon-N
      mesh(corrugadoGeo(0.24, 0.022, 10, 0.68, 0.022, 32), matTejido, 0, 0.04, 0, injerto);
      // Anastomosis con puntos quirúrgicos alrededor de y = 0.36
      for(let i = 0; i < 12; i++){
        const a = (i / 12) * Math.PI * 2;
        mesh(tuboCurvo([[Math.cos(a) * 0.24, 0.32, Math.sin(a) * 0.24], [Math.cos(a) * 0.29, 0.36, Math.sin(a) * 0.29], [Math.cos(a) * 0.24, 0.41, Math.sin(a) * 0.24]], 0.01, 8, false, 5), matPyC, 0, 0, 0, injerto);
      }
      // Costura longitudinal delantera hecha a máquina por Voorhees
      for(let k = 0; k < 7; k++){
        const y = -0.24 + k * 0.08;
        mesh(tuboCurvo([[-0.03, y, 0.26], [0.03, y + 0.03, 0.265], [-0.03, y + 0.06, 0.26]], 0.008, 8, false, 5), matPyC, 0, 0, 0, injerto);
      }
      // Dos ramas ilíacas bifurcadas curvas con anillos de crimpado
      [-1, 1].forEach(s => {
        const ptsRama = [[s * 0.08, -0.26, 0], [s * 0.24, -0.52, 0.06 * s], [s * 0.4, -0.82, 0.02 * s]];
        const curvaRama = new THREE.CatmullRomCurve3(ptsRama.map(p => new THREE.Vector3(...p)));
        mesh(new THREE.TubeGeometry(curvaRama, 24, 0.145, 20, false), matTejido, 0, 0, 0, injerto);
        for(let j = 1; j <= 8; j++){
          const u = j / 9;
          const pos = curvaRama.getPointAt(u), tan = curvaRama.getTangentAt(u);
          const ring = mesh(new THREE.TorusGeometry(0.152, 0.016, 8, 22), matTejido, pos.x, pos.y, pos.z, injerto);
          ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
        }
      });

      return t => {
        const pulso = 1 + Math.sin(t * 3.2) * 0.025;
        injerto.scale.set(pulso, 1, pulso);
        grupo.rotation.y = t * 0.35;
      };
    }

    // 6) 1949: Sección del segmento anterior del ojo con córnea, iris texturizado, saco capsular y lente biconvexa PMMA + hápticos
    if(anio === 1949){
      const ojo = new THREE.Group(); ojo.rotation.set(0.25, -0.35, 0); grupo.add(ojo);
      const phiL = Math.PI * 1.48;
      // Cúpula corneal transparente torneada (eje óptico Z -> rotamos X=PI/2)
      const corneaGeo = perfilTorneado([
        [0, 0.72], [0.35, 0.66], [0.68, 0.48], [0.92, 0.2], [0.98, -0.05],
        [0.92, -0.05], [0.85, 0.18], [0.63, 0.42], [0.32, 0.59], [0, 0.64]
      ], 36, 0, phiL);
      mesh(corneaGeo, matPMMA, 0, 0, 0, ojo).rotation.x = Math.PI / 2;

      // Anillo esclerocorneal y saco capsular posterior
      const escleraGeo = perfilTorneado([
        [0.98, -0.05], [1.02, -0.28], [0.9, -0.58], [0.65, -0.76], [0.58, -0.72], [0.83, -0.53], [0.92, -0.25], [0.92, -0.05]
      ], 36, 0, phiL);
      mesh(escleraGeo, new THREE.MeshPhysicalMaterial({ color:0xE4DCF4, roughness:0.42, clearcoat:0.35, side:THREE.DoubleSide }), 0, 0, 0, ojo).rotation.x = Math.PI / 2;

      // Iris texturizado radial con pupila abierta
      const irisGeo = new THREE.RingGeometry(0.38, 0.88, 40, 1, 0, phiL);
      const irisMat = new THREE.MeshPhysicalMaterial({ map:texIris, roughness:0.55, side:THREE.DoubleSide });
      mesh(irisGeo, irisMat, 0, 0, 0.08, ojo).rotation.z = -Math.PI / 2;

      // Lente intraocular biconvexa de PMMA (Ridley) con bisel periférico
      const iolPerfil = [
        [0, -0.13], [0.22, -0.105], [0.42, -0.04], [0.46, -0.025],
        [0.46, 0.025], [0.42, 0.04], [0.22, 0.105], [0, 0.13]
      ];
      const iol = mesh(perfilTorneado(iolPerfil, 40), matVidrioBio, 0, 0, -0.06, ojo);
      iol.rotation.x = Math.PI / 2;

      // Dos hápticos curvos en C/J de PMMA/prolene azul con bulbos terminales
      const matHapt = new THREE.MeshPhysicalMaterial({ color:0x60A4FF, roughness:0.18, clearcoat:0.8 });
      [-1, 1].forEach(s => {
        mesh(tuboCurvo([[s * 0.44, s * 0.08, -0.06], [s * 0.68, s * 0.36, -0.06], [s * 0.56, s * 0.72, -0.06], [s * 0.18, s * 0.82, -0.06]], 0.022, 24, false, 8), matHapt, 0, 0, 0, ojo);
        mesh(new THREE.SphereGeometry(0.032, 12, 10), matHapt, s * 0.18, s * 0.82, -0.06, ojo);
      });

      return t => { grupo.rotation.y = Math.sin(t * 0.5) * 0.55; };
    }

    // 7) 1952-1960: Válvula de bola y jaula Starr-Edwards + Marcapasos implantable en epoxi ámbar de Greatbatch (1959)
    if(anio === 1952){
      // Izquierda: Válvula cardíaca Starr-Edwards
      const val = new THREE.Group(); val.position.set(-0.56, -0.08, 0); grupo.add(val);
      // Anillo de sutura acolchado de Dacron torneado
      const anilloDacron = perfilTorneado([[0.42, -0.12], [0.58, -0.1], [0.64, 0], [0.58, 0.1], [0.42, 0.12], [0.39, 0]], 36);
      mesh(anilloDacron, matTejido, 0, -0.25, 0, val);
      // Asiento Venturi metálico pulido
      const asiento = perfilTorneado([[0.34, -0.11], [0.42, -0.11], [0.44, 0.1], [0.37, 0.13], [0.33, 0.02]], 36);
      mesh(asiento, matCoCr, 0, -0.25, 0, val);
      // Jaula de 4 montantes curvos soldados en ápex superior
      for(let i = 0; i < 4; i++){
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const c = Math.cos(a), s = Math.sin(a);
        mesh(tuboCurvo([[c * 0.4, -0.15, s * 0.4], [c * 0.46, 0.2, s * 0.46], [c * 0.24, 0.58, s * 0.24], [0, 0.68, 0]], 0.028, 22, false, 8), matCoCr, 0, 0, 0, val);
      }
      mesh(new THREE.SphereGeometry(0.055, 16, 12), matCoCr, 0, 0.68, 0, val);
      const bola = mesh(new THREE.SphereGeometry(0.31, 32, 24), matSilicona, 0, 0.1, 0, val);

      // Derecha: Marcapasos implantable Greatbatch/Chardack (1959) en epoxi ámbar translúcido
      const mp = new THREE.Group(); mp.position.set(0.64, -0.05, 0); mp.rotation.y = -0.35; grupo.add(mp);
      const cajaS = new THREE.Shape();
      cajaS.absarc(0, 0, 0.44, 0, Math.PI * 2, false);
      mesh(extruirCentrado(cajaS, 0.24, { bevelThickness:0.04, bevelSize:0.035, bevelSegments:4 }), matEpoxi, 0, 0, 0, mp);
      // Componentes internos visibles: 2 pilas de mercurio, condensador y transistores
      [-0.14, 0.14].forEach(x => {
        mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 20), matCoCr, x, -0.12, 0, mp).rotation.x = Math.PI / 2;
      });
      mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 16), new THREE.MeshPhysicalMaterial({ color:0x3C7CE8, roughness:0.35 }), -0.15, 0.16, 0, mp).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.08, 12), matOro, 0.06, 0.18, 0, mp).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.08, 12), matOro, 0.2, 0.14, 0, mp).rotation.x = Math.PI / 2;
      // Cabezal conector y cable-electrodo helicoidal
      mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.18, 16), matCoCr, 0, 0.48, 0, mp);
      mesh(tuboCurvo([[0, 0.56, 0], [0.06, 0.85, 0.08], [0.24, 0.96, -0.08], [0.42, 0.72, -0.18], [0.48, 0.25, -0.1]], 0.02, 32, false, 8), matUHMWPE, 0, 0, 0, mp);

      return t => {
        const s = Math.max(0, Math.sin(t * 3.1));
        bola.position.y = 0.02 + s * 0.24;
        grupo.rotation.y = Math.sin(t * 0.35) * 0.5;
      };
    }

    // 8) 1958-1961: Artroplastia total de cadera de Charnley (corte de fémur + manto PMMA + vástago monobloque + cabeza 22,2 mm + cotilo UHMWPE)
    if(anio === 1958){
      // Corte coronal del fémur proximal (silueta cortical exterior)
      const femS = new THREE.Shape();
      femS.moveTo(-0.56, -1.05); femS.lineTo(-0.48, -0.12);
      femS.quadraticCurveTo(-0.62, 0.15, -0.45, 0.35);
      femS.quadraticCurveTo(-0.28, 0.38, -0.16, 0.18);
      femS.lineTo(0.08, 0.32); femS.lineTo(0.18, 0.12);
      femS.lineTo(-0.08, -0.15); femS.lineTo(-0.18, -1.05); femS.closePath();
      mesh(extruirCentrado(femS, 0.36, { bevelThickness:0.03, bevelSize:0.025 }), matHuesoCort, 0, 0, -0.16, grupo);

      // Manto de cemento óseo PMMA alrededor del canal femoral
      const cemS = new THREE.Shape();
      cemS.moveTo(-0.42, -0.95); cemS.lineTo(-0.38, 0.12);
      cemS.lineTo(-0.18, 0.14); cemS.lineTo(-0.24, -0.95); cemS.closePath();
      mesh(extruirCentrado(cemS, 0.28, { bevelThickness:0.015, bevelSize:0.015 }), matCemento, 0, 0, -0.03, grupo);

      // Vástago femoral monobloque curvo de Charnley + collarín + cabeza pequeña 22.2 mm
      const vasS = new THREE.Shape();
      vasS.moveTo(-0.34, -0.88);
      vasS.quadraticCurveTo(-0.36, -0.25, -0.35, 0.08);
      vasS.quadraticCurveTo(-0.24, 0.24, -0.02, 0.34);
      vasS.lineTo(0.06, 0.2);
      vasS.quadraticCurveTo(-0.16, 0.06, -0.22, -0.88);
      vasS.closePath();
      mesh(extruirCentrado(vasS, 0.14, { bevelThickness:0.02, bevelSize:0.02, bevelSegments:3 }), matCoCr, 0, 0, 0.08, grupo);
      const cuelloDir = new THREE.Vector3(0.68, 0.72, 0).normalize();
      const cuello = mesh(new THREE.CylinderGeometry(0.058, 0.085, 0.42, 24), matCoCr, 0.12, 0.4, 0.08, grupo);
      cuello.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cuelloDir);
      // Collarín cervical en la base del cuello
      const collar = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 24), matCoCr, 0.0, 0.28, 0.08, grupo);
      collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cuelloDir);
      // Cabeza femoral pulida de baja fricción (22,2 mm)
      mesh(new THREE.SphereGeometry(0.17, 28, 20), matCoCr, 0.27, 0.56, 0.08, grupo);

      // Cotilo grueso de UHMWPE + surcos de retención + manto de cemento acetabular (corte frontal abierto hacia +Z)
      const cupG = new THREE.Group(); cupG.position.set(0.28, 0.57, 0.08); cupG.rotation.z = -0.78; grupo.add(cupG);
      const uhmwGeo = perfilTorneado([[0.18, 0], [0.18, 0.08], [0.14, 0.16], [0, 0.2], [0, 0.37], [0.24, 0.32], [0.36, 0.14], [0.37, 0], [0.18, 0]], 36, Math.PI * 0.25, Math.PI * 1.5);
      mesh(uhmwGeo, matUHMWPE, 0, 0, 0, cupG);
      mesh(new THREE.TorusGeometry(0.375, 0.014, 8, 28), matCoCr, 0, 0.02, 0, cupG).rotation.x = Math.PI / 2;
      const cemCupGeo = perfilTorneado([[0.37, 0], [0.36, 0.14], [0.24, 0.32], [0, 0.37], [0, 0.45], [0.29, 0.39], [0.44, 0.17], [0.45, 0], [0.37, 0]], 32, Math.PI * 0.25, Math.PI * 1.5);
      mesh(cemCupGeo, matCemento, 0, 0, 0, cupG);

      return t => { grupo.rotation.y = Math.sin(t * 0.4) * 0.55; };
    }

    // 9) 1960-1968: Válvula bivalva de carbono pirolítico (Bokros/Gott) + lente blanda de hidrogel PHEMA (Wichterle)
    if(anio === 1960){
      const val = new THREE.Group(); val.position.set(-0.28, 0.05, 0); val.rotation.x = 0.42; grupo.add(val);
      // Anillo textil de sutura de PET
      mesh(perfilTorneado([[0.58, -0.14], [0.76, -0.11], [0.82, 0], [0.76, 0.11], [0.58, 0.14], [0.54, 0]], 40), matTejido, 0, 0, 0, val);
      // Carcasa pulida espejo de carbono pirolítico con guardas de pivote biseladas
      mesh(perfilTorneado([[0.5, -0.17], [0.59, -0.14], [0.59, 0.14], [0.5, 0.17], [0.48, 0.06], [0.48, -0.06]], 40), matPyC, 0, 0, 0, val);
      const guardaS = new THREE.Shape();
      guardaS.moveTo(-0.08, -0.12); guardaS.lineTo(0.08, -0.12);
      guardaS.quadraticCurveTo(0.06, 0.12, 0, 0.14);
      guardaS.quadraticCurveTo(-0.06, 0.12, -0.08, -0.12);
      const guardaGeo = extruirCentrado(guardaS, 0.06, { bevelThickness:0.012, bevelSize:0.012, bevelSegments:2 });
      [-0.49, 0.49].forEach(z => {
        mesh(guardaGeo.clone(), matPyC, 0, 0.04, z, val);
      });
      // Dos valvas semilunares basculantes de PyC
      const valvaS = new THREE.Shape();
      valvaS.absarc(0, 0, 0.46, 0, Math.PI, false);
      valvaS.closePath();
      const vGeo = extruirCentrado(valvaS, 0.032, { bevelThickness:0.008, bevelSize:0.008, bevelSegments:2 });
      const pivL = new THREE.Group(); pivL.position.set(-0.04, 0, 0); val.add(pivL);
      const vL = mesh(vGeo, matPyC, 0, 0, 0, pivL); vL.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      const pivR = new THREE.Group(); pivR.position.set(0.04, 0, 0); val.add(pivR);
      const vR = mesh(vGeo, matPyC, 0, 0, 0, pivR); vR.rotation.set(Math.PI / 2, 0, -Math.PI / 2);

      // Lente de contacto blanda de hidrogel PHEMA (Wichterle 1960) en primer plano derecho
      const hidrogelMat = new THREE.MeshPhysicalMaterial({ color:0x86F4E8, roughness:0.04, ior:1.43, clearcoat:1, transparent:true, opacity:0.65, side:THREE.DoubleSide });
      const lenteGeo = perfilTorneado([[0, 0.14], [0.2, 0.12], [0.36, 0.05], [0.42, -0.02], [0.39, -0.03], [0.33, 0.03], [0.18, 0.095], [0, 0.11]], 36);
      const lente = mesh(lenteGeo, hidrogelMat, 0.92, -0.25, 0.42, grupo);
      lente.rotation.x = 0.35;
      mesh(perfilTorneado([[0, -0.2], [0.38, -0.2], [0.4, -0.14], [0.16, -0.08], [0, -0.08]], 28), matTi, 0.92, -0.26, 0.42, grupo);

      return t => {
        const ang = 0.25 + ((Math.sin(t * 3.1) + 1) * 0.5) * 0.85;
        pivL.rotation.z = ang;
        pivR.rotation.z = -ang;
        grupo.rotation.y = Math.sin(t * 0.35) * 0.45;
      };
    }

    // 10) 1952-1976: Osteointegración del titanio de Brånemark (cuña ósea cortical+esponjosa + implante roscado con cámara óptica/perforación apical + hexágono externo)
    if(anio === 1964){
      // Cuña anatómica de hueso cortical y trabecular con abertura frontal (220°)
      const matCortCut = matHuesoCort.clone(); matCortCut.side = THREE.DoubleSide;
      const matTrabCut = matHuesoTrab.clone(); matTrabCut.side = THREE.DoubleSide;
      const extGeo = perfilTorneado([[0.22, -0.68], [0.68, -0.68], [0.74, 0], [0.7, 0.35], [0.22, 0.35], [0.22, -0.68]], 32, 0.8, Math.PI * 1.35);
      mesh(extGeo, matCortCut, 0, -0.1, 0, grupo);
      const trabGeo = perfilTorneado([[0.18, -0.58], [0.56, -0.58], [0.6, 0.24], [0.18, 0.24], [0.18, -0.58]], 28, 0.84, Math.PI * 1.3);
      mesh(trabGeo, matTrabCut, 0, -0.1, 0, grupo);
      // Capilares y trabéculas óseas en contacto directo con la rosca (sin cápsula fibrosa)
      trabeculasGrupo(grupo, 0.9, 0.65, 0.7, 8, matHuesoCort, 64);
      mesh(tuboCurvo([[-0.52, -0.35, 0.25], [-0.32, -0.18, 0.28], [-0.18, -0.1, 0.16]], 0.016, 16, false, 6), matVaso, 0, 0, 0, grupo);

      // Implante Brånemark: rosca helicoidal continua + cuello pulido + hexágono externo + tornillo de pilar
      const imp = tornilloBiomedico(grupo, { rMax:0.18, rTip:0.145, hCuerpo:0.96, vueltas:7.5, rFilete:0.032, hCuello:0.16, rCuello:0.19, tipoCabeza:'hex', mat:matTi, matRosca:matCoCr });
      imp.position.y = 0.08;
      // Cámara/ventana apical transversal característica de los primeros implantes Brånemark
      mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.38, 16), matPyC, 0, -0.22, 0, imp).rotation.z = Math.PI / 2;

      return t => { grupo.rotation.y = t * 0.42; };
    }

    // 11) 1966-1971: Placa craneofacial biodegradable PLA/PLGA con 4 tornillos roscados sobre hueso + sutura trenzada PGA + lámina ePTFE
    if(anio === 1966){
      // Dos fragmentos óseos en consolidación
      const fragL = huesoBloque(grupo, 0.92, 0.46, 0.62, { curva:0.08, seed:71, nTrab:5 });
      fragL.position.set(-0.54, -0.22, 0); fragL.rotation.z = 0.04;
      const fragR = huesoBloque(grupo, 0.92, 0.46, 0.62, { curva:0.08, seed:72, nTrab:5 });
      fragR.position.set(0.54, -0.22, 0); fragR.rotation.z = -0.04;

      // Placa festoneada de osteosíntesis de PLA/PLGA con 4 lóbulos sobre el trazo de fractura
      const placaS = new THREE.Shape();
      placaS.moveTo(-0.82, -0.14);
      placaS.quadraticCurveTo(-0.52, -0.22, -0.24, -0.1);
      placaS.lineTo(0.24, -0.1);
      placaS.quadraticCurveTo(0.52, -0.22, 0.82, -0.14);
      placaS.quadraticCurveTo(0.92, 0, 0.82, 0.14);
      placaS.quadraticCurveTo(0.52, 0.22, 0.24, 0.1);
      placaS.lineTo(-0.24, 0.1);
      placaS.quadraticCurveTo(-0.52, 0.22, -0.82, 0.14);
      placaS.quadraticCurveTo(-0.92, 0, -0.82, -0.14);
      [-0.72, -0.34, 0.34, 0.72].forEach(hx => {
        const hole = new THREE.Path(); hole.absarc(hx, 0, 0.065, 0, Math.PI * 2, true); placaS.holes.push(hole);
      });
      const placaMesh = mesh(extruirCentrado(placaS, 0.075, { bevelThickness:0.015, bevelSize:0.015 }), matPLA, 0, 0.1, 0, grupo);
      placaMesh.rotation.x = Math.PI / 2;

      const tornillos = [-0.72, -0.34, 0.34, 0.72].map(x => {
        const tw = tornilloBiomedico(grupo, { rMax:0.055, rTip:0.032, hCuerpo:0.34, vueltas:4.5, rFilete:0.012, hCuello:0.05, rCuello:0.058, tipoCabeza:'avellanada', mat:matPLA, matRosca:matPLA });
        tw.position.set(x, -0.02, 0);
        return tw;
      });

      // Sutura multifilamento trenzada de PGA (triple hélice curva en arco posterior)
      const matPGA = new THREE.MeshPhysicalMaterial({ color:0xB48AFF, roughness:0.35, clearcoat:0.3 });
      for(let f = 0; f < 3; f++){
        const pts = [];
        for(let i = 0; i <= 32; i++){
          const u = i / 32, ang = u * Math.PI * 5 + (f * Math.PI * 2) / 3;
          pts.push([(u - 0.5) * 1.75, 0.45 + Math.sin(u * Math.PI) * 0.25 + Math.sin(ang) * 0.026, -0.46 + Math.cos(ang) * 0.026]);
        }
        mesh(tuboCurvo(pts, 0.016, 32, false, 6), matPGA, 0, 0, 0, grupo);
      }

      // Lámina microporosa de ePTFE expandido (nodos y fibrillas tensadas en primer plano lateral)
      const ptfe = new THREE.Group(); ptfe.position.set(0, -0.22, 0.56); ptfe.rotation.x = 0.32; grupo.add(ptfe);
      for(let nx = -2; nx <= 2; nx++){
        mesh(tuboCurvo([[nx * 0.22, -0.14, 0], [nx * 0.22 + 0.02, 0, 0.015], [nx * 0.22, 0.14, 0]], 0.022, 10, false, 6), matUHMWPE, 0, 0, 0, ptfe);
        if(nx < 2){
          for(let ny = -1; ny <= 1; ny++){
            mesh(tuboCurvo([[nx * 0.22, ny * 0.1, 0], [(nx + 0.5) * 0.22, ny * 0.1 + 0.015, 0.008], [(nx + 1) * 0.22, ny * 0.1, 0]], 0.007, 8, false, 5), matUHMWPE, 0, 0, 0, ptfe);
          }
        }
      }

      // Oligómeros ácidos liberándose por hidrólisis
      const oligo = [];
      const oGeo = new THREE.IcosahedronGeometry(0.035, 0);
      for(let i = 0; i < 10; i++){
        const m = mesh(oGeo, i % 2 ? matPLA : matVidrioClaro, -0.7 + i * 0.15, 0.24, (i % 3 - 1) * 0.18, grupo);
        oligo.push({ m, y0:0.22 + (i % 2) * 0.08, ph:i * 0.7 });
      }

      return t => {
        const s = 0.8 + 0.2 * Math.cos(t * 1.1);
        placaMesh.scale.set(1, 1, s);
        tornillos.forEach(tw => tw.scale.set(s, 1, s));
        oligo.forEach(({ m, y0, ph }) => { m.position.y = y0 + ((t * 0.18 + ph) % 0.35); m.rotation.x = t + ph; });
        grupo.rotation.y = t * 0.35;
      };
    }

    // 12) 1969: Bioglass 45S5 (Hench) — sección cilíndrica multicapa: vidrio 45S5, gel de sílice, capa cristalina HCA, colágeno mineralizado y hueso vivo + iones
    if(anio === 1969){
      // Base de Bioglass 45S5 torneada con red de sílice interna visible
      mesh(perfilTorneado([[0, -0.68], [0.76, -0.68], [0.78, -0.2], [0, -0.2]], 36), matVidrioBio, 0, 0, 0, grupo);
      // Red tetraédrica esquemática de SiO₂ dentro del vidrio
      for(let i = 0; i < 6; i++){
        const a = (i / 6) * Math.PI * 2;
        mesh(tuboCurvo([[0, -0.46, 0], [Math.cos(a) * 0.42, -0.44, Math.sin(a) * 0.42], [Math.cos(a + 0.5) * 0.52, -0.34, Math.sin(a + 0.5) * 0.52]], 0.015, 10, false, 6), matHCA, 0, 0, 0, grupo);
      }

      // Gel de sílice + capa policristalina de HCA
      mesh(perfilTorneado([[0, -0.2], [0.79, -0.2], [0.8, -0.04], [0, -0.04]], 36), matOro, 0, 0, 0, grupo);
      mesh(perfilTorneado([[0, -0.04], [0.8, -0.04], [0.79, 0.14], [0, 0.14]], 36), matHCA, 0, 0, 0, grupo);

      // Cristales hexagonales de HCA creciendo en la interfaz
      const rng12 = crearRng(1969);
      for(let i = 0; i < 16; i++){
        const a = rng12() * Math.PI * 2, r = 0.15 + rng12() * 0.54;
        cristalHCA(grupo, Math.cos(a) * r, 0.11, Math.sin(a) * r, 0.025, 0.11 + rng12() * 0.06, matHCA, (rng12() - 0.5) * 0.35, (rng12() - 0.5) * 0.35);
      }

      // Fibras de colágeno entrelazadas ancladas desde la HCA al hueso trabecular superior
      for(let i = 0; i < 8; i++){
        const a = (i / 8) * Math.PI * 2;
        const r = 0.48;
        mesh(tuboCurvo([[Math.cos(a) * r * 0.7, 0.06, Math.sin(a) * r * 0.7], [Math.cos(a + 0.2) * r, 0.24, Math.sin(a + 0.2) * r], [Math.cos(a - 0.1) * r * 0.85, 0.42, Math.sin(a - 0.1) * r * 0.85]], 0.02, 16, false, 6), matColageno, 0, 0, 0, grupo);
      }
      // Techo de hueso cortical/trabecular en sección arqueada para dejar ver la zona de enlace
      const huesoSup = huesoBloque(grupo, 1.48, 0.34, 1.15, { curva:0.1, seed:69, nTrab:9 });
      huesoSup.position.set(0, 0.58, 0);

      // Iones Ca2+ y PO4 3- dinámicos
      const iones = [];
      const ionGeo = new THREE.SphereGeometry(0.036, 12, 10);
      for(let i = 0; i < 12; i++){
        const a = (i / 12) * Math.PI * 2, r = 0.25 + (i % 3) * 0.22;
        const m = mesh(ionGeo, i % 2 ? matVidrioBio : matOro, Math.cos(a) * r, -0.05, Math.sin(a) * r, grupo);
        iones.push({ m, ph:i * 0.52 });
      }

      return t => {
        grupo.rotation.y = t * 0.38;
        iones.forEach(({ m, ph }) => { m.position.y = -0.15 + ((t * 0.22 + ph) % 0.48); });
      };
    }

    // 13) 1978-1986: Stent coronario expandible por balón de Palmaz dentro de arteria coronaria seccionada con placa aterosclerótica
    if(anio === 1978){
      const art = new THREE.Group(); art.rotation.y = 0.2; grupo.add(art);
      const phiArt = Math.PI * 1.38;
      // Capa externa adventicia/media de la arteria coronaria en corte longitudinal (abierta hacia +Y/+Z)
      const matVasoCut = matVaso.clone(); matVasoCut.side = THREE.DoubleSide;
      const wallGeo = perfilTorneado([[0.58, -0.92], [0.68, -0.92], [0.68, 0.92], [0.58, 0.92], [0.58, -0.92]], 36, 1.42, phiArt);
      mesh(wallGeo, matVasoCut, 0, 0, 0, art).rotation.z = Math.PI / 2;
      // Placa de ateroma lipídica comprimida en la íntima
      const ateromaMat = new THREE.MeshPhysicalMaterial({ color:0xEFC85C, roughness:0.55, clearcoat:0.2, side:THREE.DoubleSide });
      const placaGeo = perfilTorneado([[0.49, -0.55], [0.58, -0.62], [0.58, 0.62], [0.49, 0.55], [0.47, 0], [0.49, -0.55]], 28, 1.65, phiArt * 0.82);
      mesh(placaGeo, ateromaMat, 0, 0, 0, art).rotation.z = Math.PI / 2;

      // Malla real del stent coronario (zigzag rings + puentes conectores)
      const stent = stentCoronario3D(0.45, 1.38, 6, 8, 0.017, matCoCr, art);

      // Balón de angioplastia translúcido con extremos cónicos + catéter y guía metálica axial
      const balonGeo = perfilTorneado([[0.05, -0.82], [0.12, -0.68], [0.38, -0.54], [0.38, 0.54], [0.12, 0.68], [0.05, 0.82]], 32);
      const balon = mesh(balonGeo, matPMMA, 0, 0, 0, art);
      balon.rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.25, 16), matTi, 0, 0, 0, art).rotation.z = Math.PI / 2;

      return t => {
        const exp = 0.88 + 0.14 * (0.5 + 0.5 * Math.sin(t * 1.6));
        stent.scale.set(1, exp, exp);
        balon.scale.set(exp, 1, exp);
        grupo.rotation.y = Math.sin(t * 0.35) * 0.45;
      };
    }

    // 14) 1986-1993: Consenso de Chester e Ingeniería de Tejidos — Scaffold poroso 3D de PLGA + péptidos RGD + células + angiogénesis
    if(anio === 1986){
      const sc = new THREE.Group(); grupo.add(sc);
      // Anillos torneados y puntales helicoidales/entrelazados del scaffold poroso
      for(let k = -1; k <= 1; k++){
        mesh(new THREE.TorusGeometry(0.68, 0.03, 10, 36), matScaffold, 0, k * 0.38, 0, sc).rotation.x = Math.PI / 2;
        mesh(new THREE.TorusGeometry(0.36, 0.024, 8, 28), matScaffold, 0, k * 0.38, 0, sc).rotation.x = Math.PI / 2;
      }
      for(let i = 0; i < 8; i++){
        const a = (i / 8) * Math.PI * 2;
        mesh(tuboCurvo([[Math.cos(a) * 0.68, -0.45, Math.sin(a) * 0.68], [Math.cos(a + 0.35) * 0.64, 0, Math.sin(a + 0.35) * 0.64], [Math.cos(a) * 0.68, 0.45, Math.sin(a) * 0.68]], 0.024, 18, false, 6), matScaffold, 0, 0, 0, sc);
        if(i % 2 === 0){
          mesh(tuboCurvo([[Math.cos(a) * 0.36, -0.42, Math.sin(a) * 0.36], [Math.cos(a) * 0.68, 0, Math.sin(a) * 0.68], [Math.cos(a) * 0.36, 0.42, Math.sin(a) * 0.36]], 0.02, 16, false, 6), matScaffold, 0, 0, 0, sc);
        }
      }
      // Red vascular arborizada atravesando los poros del scaffold
      mesh(tuboCurvo([[-0.85, -0.35, 0.25], [-0.3, -0.08, 0.12], [0.22, 0.1, -0.06], [0.85, 0.36, -0.22]], 0.042, 24, false, 8), matVaso, 0, 0, 0, sc);
      mesh(tuboCurvo([[-0.18, -0.02, 0.08], [0.15, -0.28, 0.35], [0.58, -0.42, 0.45]], 0.026, 18, false, 7), matVaso, 0, 0, 0, sc);
      mesh(tuboCurvo([[0.12, 0.06, -0.02], [-0.15, 0.38, 0.28], [-0.52, 0.52, 0.36]], 0.024, 18, false, 7), matVaso, 0, 0, 0, sc);

      // Ligandos peptídicos RGD (marcadores dorados) + células osteoprogenitoras con núcleos brillantes
      const matNuc = basicGlow(0x5FF2D2, 1.35);
      const matMem = new THREE.MeshPhysicalMaterial({ color:0xD8ECFF, roughness:0.25, clearcoat:0.7, transparent:true, opacity:0.86 });
      [[0.46, 0.24, 0.48], [-0.48, -0.18, 0.46], [0.05, 0.42, -0.32], [-0.15, -0.38, -0.44], [0.52, -0.12, -0.38]].forEach(([x, y, z], i) => {
        celulaAdherida(sc, x, y, z, 0.11, matMem, matNuc, 80 + i);
      });
      for(let i = 0; i < 8; i++){
        const a = (i / 8) * Math.PI * 2 + 0.3;
        mesh(new THREE.OctahedronGeometry(0.036, 0), matOro, Math.cos(a) * 0.72, (i % 2 ? 0.18 : -0.18), Math.sin(a) * 0.72, sc);
      }

      return t => { grupo.rotation.y = t * 0.38; };
    }

    // 15) 2018-actualidad (Chengdu): Nanopartícula/vesícula inteligente en corte ecuatorial + doble hélice ARN/ADN + coronas PEG + anticuerpos en Y
    const nano = new THREE.Group(); nano.rotation.x = 0.22; grupo.add(nano);
    const phiNano = Math.PI * 1.42;
    // Bicapa lipídica/polimérica hueca abierta en cuña
    const extCap = perfilTorneado((() => {
      const p = [];
      for(let i = 0; i <= 18; i++){ const a = (i / 18) * Math.PI; p.push([Math.sin(a) * 0.64, -Math.cos(a) * 0.64]); }
      for(let i = 18; i >= 0; i--){ const a = (i / 18) * Math.PI; p.push([Math.sin(a) * 0.5, -Math.cos(a) * 0.5]); }
      return p;
    })(), 36, 0.4, phiNano);
    mesh(extCap, new THREE.MeshPhysicalMaterial({ color:0x7B68EE, roughness:0.25, clearcoat:0.65, transparent:true, opacity:0.86, side:THREE.DoubleSide }), 0, 0, 0, nano);
    const innerLayer = perfilTorneado((() => {
      const p = [];
      for(let i = 0; i <= 16; i++){ const a = (i / 16) * Math.PI; p.push([Math.sin(a) * 0.48, -Math.cos(a) * 0.48]); }
      for(let i = 16; i >= 0; i--){ const a = (i / 16) * Math.PI; p.push([Math.sin(a) * 0.42, -Math.cos(a) * 0.42]); }
      return p;
    })(), 32, 0.4, phiNano);
    mesh(innerLayer, matHCA, 0, 0, 0, nano);

    // Doble hélice terapéutica (ARN/ADN) + nanopartículas de fármaco dentro del núcleo
    const helixA = heliceGeo(0.14, 0.64, 2.2, 0.022, 48, 6);
    const helixB = heliceGeo(0.14, 0.64, 2.2, 0.022, 48, 6);
    mesh(helixA, matVidrioBio, 0, 0, 0, nano);
    mesh(helixB, matOro, 0, 0, 0, nano).rotation.y = Math.PI;
    for(let i = 0; i < 6; i++){
      const y = -0.24 + i * 0.095, ang = (i / 5) * 2.2 * Math.PI * 2;
      mesh(tuboCurvo([[Math.cos(ang) * 0.14, y, Math.sin(ang) * 0.14], [-Math.cos(ang) * 0.14, y, -Math.sin(ang) * 0.14]], 0.012, 6, false, 5), matEsmalte, 0, 0, 0, nano);
    }

    // Coronas poliméricas PEG y ligandos/anticuerpos en "Y" en la superficie exterior
    const cepillos = new THREE.Group(); nano.add(cepillos);
    const dirs = [[0, 1, 0], [0, -1, 0], [0.85, 0.5, 0], [-0.85, 0.4, 0.3], [0.3, -0.6, 0.72], [-0.6, -0.5, -0.6], [0.5, 0.45, -0.7], [-0.4, 0.65, -0.6]];
    dirs.forEach((dv, idx) => {
      const dir = new THREE.Vector3(...dv).normalize();
      const gAnt = new THREE.Group();
      gAnt.position.copy(dir.clone().multiplyScalar(0.64));
      gAnt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      cepillos.add(gAnt);
      if(idx % 2 === 0){
        // Anticuerpo en Y
        mesh(tuboCurvo([[0, 0, 0], [0, 0.16, 0]], 0.022, 6, false, 6), matOro, 0, 0, 0, gAnt);
        mesh(tuboCurvo([[0, 0.15, 0], [-0.11, 0.3, 0]], 0.02, 6, false, 6), matOro, 0, 0, 0, gAnt);
        mesh(tuboCurvo([[0, 0.15, 0], [0.11, 0.3, 0]], 0.02, 6, false, 6), matOro, 0, 0, 0, gAnt);
        mesh(new THREE.SphereGeometry(0.032, 10, 8), matHCA, -0.11, 0.31, 0, gAnt);
        mesh(new THREE.SphereGeometry(0.032, 10, 8), matHCA, 0.11, 0.31, 0, gAnt);
      } else {
        // Cepillo flexible de PEG
        mesh(tuboCurvo([[0, 0, 0], [0.05, 0.12, 0.03], [-0.04, 0.24, -0.02], [0.03, 0.35, 0.04]], 0.018, 12, false, 6), matVidrioBio, 0, 0, 0, gAnt);
      }
    });

    return t => {
      grupo.rotation.y = t * 0.35;
      cepillos.rotation.z = Math.sin(t * 1.2) * 0.04;
    };
  };
}

/* ---- Modelos 3D histológicos para "Las tres generaciones" ---- */
export function escenaGen3D(modoId){
  return (grupo) => {
    // Techo anatómico común: sección curvada de hueso cortical + esponjoso vivo
    const techo = huesoBloque(grupo, 2.05, 0.38, 1.12, { curva:0.08, seed:90, nTrab:10 });
    techo.position.set(0, 0.66, 0);

    // gen1: 1ª generación (bioinerte) — implante metálico mecanizado aislado por cápsula fibrosa de colágeno y fibroblastos
    if(modoId === 'gen1'){
      // Implante base de titanio con perfil biselado y micro-surcos mecanizados
      const impS = new THREE.Shape();
      impS.moveTo(-1.02, -0.58); impS.lineTo(1.02, -0.58);
      impS.lineTo(1.02, -0.05);
      for(let i = 4; i >= -4; i--){
        impS.lineTo(i * 0.2 + 0.06, -0.05);
        impS.lineTo(i * 0.2, 0.04);
        impS.lineTo(i * 0.2 - 0.06, -0.05);
      }
      impS.lineTo(-1.02, -0.05); impS.closePath();
      mesh(extruirCentrado(impS, 1.12, { bevelThickness:0.025, bevelSize:0.02 }), matTi, 0, -0.18, 0, grupo);

      // Cápsula fibrosa avascular interponiéndose entre hueso e implante
      const capS = new THREE.Shape();
      capS.moveTo(-1.0, 0.02); capS.quadraticCurveTo(0, -0.04, 1.0, 0.02);
      capS.lineTo(1.0, 0.28); capS.quadraticCurveTo(0, 0.34, -1.0, 0.28); capS.closePath();
      mesh(extruirCentrado(capS, 1.06, { bevelThickness:0.01, bevelSize:0.01 }), matFibroso, 0, 0.14, 0, grupo);

      // Haces ondulados de fibras de colágeno y fibroblastos aplanados paralelos a la interfaz
      const fibras = new THREE.Group(); grupo.add(fibras);
      for(let f = 0; f < 5; f++){
        const z = -0.38 + f * 0.19;
        const y = 0.21 + (f % 2) * 0.09;
        const pts = [];
        for(let i = 0; i <= 16; i++){
          const x = -0.95 + (i / 16) * 1.9;
          pts.push([x, y + Math.sin(i * 0.8 + f) * 0.025, z]);
        }
        mesh(tuboCurvo(pts, 0.015, 22, false, 6), matColageno, 0, 0, 0, fibras);
      }
      [-0.55, 0, 0.55].forEach((x, idx) => {
        const fb = mesh(new THREE.SphereGeometry(0.085, 14, 10), matSilicona, x, 0.26, (idx % 2 ? 0.24 : -0.24), grupo);
        fb.scale.set(2.1, 0.38, 0.85);
      });

      return t => {
        fibras.position.y = Math.sin(t * 1.6) * 0.015;
        grupo.rotation.y = Math.sin(t * 0.45) * 0.55;
      };
    }

    // gen2a: 2ª generación (bioactivo) — Bioglass 45S5 + gel de sílice + cristales hexagonales HCA + colágeno mineralizado
    if(modoId === 'gen2a'){
      const bgS = new THREE.Shape();
      bgS.moveTo(-1.02, -0.58); bgS.lineTo(1.02, -0.58);
      bgS.lineTo(1.02, -0.02); bgS.quadraticCurveTo(0, 0.06, -1.02, -0.02); bgS.closePath();
      mesh(extruirCentrado(bgS, 1.12, { bevelThickness:0.025, bevelSize:0.02 }), matVidrioBio, 0, -0.22, 0, grupo);

      // Capa de gel de sílice y capa continua de Hidroxiapatita Carbonatada (HCA)
      const gelS = new THREE.Shape();
      gelS.moveTo(-1.02, -0.04); gelS.quadraticCurveTo(0, 0.04, 1.02, -0.04);
      gelS.lineTo(1.02, 0.06); gelS.quadraticCurveTo(0, 0.14, -1.02, 0.06); gelS.closePath();
      mesh(extruirCentrado(gelS, 1.1, { bevelThickness:0.01, bevelSize:0.01 }), matOro, 0, -0.1, 0, grupo);

      const hcaS = new THREE.Shape();
      hcaS.moveTo(-1.02, 0.06); hcaS.quadraticCurveTo(0, 0.14, 1.02, 0.06);
      hcaS.lineTo(1.02, 0.2); hcaS.quadraticCurveTo(0, 0.28, -1.02, 0.2); hcaS.closePath();
      mesh(extruirCentrado(hcaS, 1.1, { bevelThickness:0.01, bevelSize:0.01 }), matHCA, 0, -0.04, 0, grupo);

      // Cristales hexagonales de apatita + fibras de colágeno ancladas en el hueso
      const rngG2 = crearRng(204);
      for(let i = 0; i < 18; i++){
        const x = -0.88 + rngG2() * 1.76, z = -0.44 + rngG2() * 0.88;
        cristalHCA(grupo, x, 0.14, z, 0.026, 0.11 + rngG2() * 0.07, matHCA, (rngG2() - 0.5) * 0.3, (rngG2() - 0.5) * 0.3);
      }
      for(let i = 0; i < 8; i++){
        const x = -0.78 + i * 0.22, z = (i % 2 ? 0.26 : -0.26);
        mesh(tuboCurvo([[x, 0.14, z], [x + 0.06, 0.32, z * 0.8], [x - 0.03, 0.49, z * 0.9]], 0.022, 12, false, 6), matColageno, 0, 0, 0, grupo);
      }
      const iones = [];
      const ionGeo = new THREE.SphereGeometry(0.032, 10, 8);
      for(let i = 0; i < 10; i++){
        const m = mesh(ionGeo, i % 2 ? matHCA : matOro, -0.82 + i * 0.18, 0.02, (i % 3 - 1) * 0.3, grupo);
        iones.push({ m, ph:i * 0.6 });
      }

      return t => {
        iones.forEach(({ m, ph }) => { m.position.y = -0.06 + ((t * 0.24 + ph) % 0.44); });
        grupo.rotation.y = Math.sin(t * 0.45) * 0.55;
      };
    }

    // gen2b: 2ª generación (biodegradable) — placa y puntales de PLA/PGA en hidrólisis gradual mientras hueso neoformado y capilares descienden
    if(modoId === 'gen2b'){
      const trozos = [];
      const strutS = new THREE.Shape();
      strutS.moveTo(-0.14, -0.22); strutS.lineTo(0.14, -0.22);
      strutS.quadraticCurveTo(0.18, 0, 0.12, 0.22);
      strutS.lineTo(-0.12, 0.22); strutS.quadraticCurveTo(-0.18, 0, -0.14, -0.22);
      const strutGeo = extruirCentrado(strutS, 0.84, { bevelThickness:0.03, bevelSize:0.025 });
      for(let i = -2; i <= 2; i++){
        const m = mesh(strutGeo.clone(), matPLA, i * 0.4, -0.16, 0, grupo);
        trozos.push(m);
      }
      // Tejido neoformado + brotes vasculares avanzando hacia la zona degradada
      const neo = new THREE.Group(); grupo.add(neo);
      trabeculasGrupo(neo, 1.7, 0.28, 0.85, 8, matHuesoCort, 88);
      [-0.55, 0.1, 0.62].forEach((x, i) => {
        mesh(tuboCurvo([[x, 0.48, (i - 1) * 0.2], [x + 0.08, 0.28, 0], [x - 0.06, 0.08, (1 - i) * 0.15]], 0.024, 14, false, 6), matVaso, 0, 0, 0, neo);
      });
      // Moléculas de oligómeros y agua
      const oligo = [];
      const oGeo = new THREE.DodecahedronGeometry(0.038, 0);
      for(let i = 0; i < 9; i++){
        const m = mesh(oGeo, i % 2 ? matPLA : matVidrioClaro, -0.75 + i * 0.19, 0.05, (i % 3 - 1) * 0.28, grupo);
        oligo.push({ m, ph:i * 0.55 });
      }

      return t => {
        const s = 0.62 + 0.38 * Math.cos(t * 1.15);
        trozos.forEach(m => m.scale.set(s, s, 1));
        neo.position.y = -0.12 * (1 - s);
        oligo.forEach(({ m, ph }) => { m.position.y = -0.05 + ((t * 0.2 + ph) % 0.45); m.rotation.y = t + ph; });
        grupo.rotation.y = Math.sin(t * 0.42) * 0.52;
      };
    }

    // gen3: 3ª generación (regenerativo) — Scaffold poroso 3D integrado + RGD + osteoblastos + árbol capilar angiogénico
    const sc = new THREE.Group(); sc.position.set(0, -0.06, 0); grupo.add(sc);
    for(let k = -1; k <= 1; k++){
      mesh(new THREE.TorusGeometry(0.74, 0.028, 10, 36), matScaffold, 0, k * 0.28, 0, sc).rotation.x = Math.PI / 2;
      mesh(new THREE.TorusGeometry(0.4, 0.022, 8, 28), matScaffold, 0, k * 0.28, 0, sc).rotation.x = Math.PI / 2;
    }
    for(let i = 0; i < 8; i++){
      const a = (i / 8) * Math.PI * 2;
      mesh(tuboCurvo([[Math.cos(a) * 0.74, -0.34, Math.sin(a) * 0.74], [Math.cos(a + 0.3) * 0.68, 0, Math.sin(a + 0.3) * 0.68], [Math.cos(a) * 0.74, 0.42, Math.sin(a) * 0.74]], 0.022, 16, false, 6), matScaffold, 0, 0, 0, sc);
    }
    // Árbol capilar bifurcado irrigando el interior del scaffold desde el hueso huésped
    mesh(tuboCurvo([[-0.85, 0.48, 0.15], [-0.35, 0.12, 0.08], [0.18, -0.05, -0.04], [0.82, -0.22, -0.18]], 0.044, 24, false, 8), matVaso, 0, 0, 0, sc);
    mesh(tuboCurvo([[-0.22, 0.06, 0.04], [0.12, -0.28, 0.32], [0.54, -0.38, 0.4]], 0.028, 16, false, 7), matVaso, 0, 0, 0, sc);
    mesh(tuboCurvo([[0.12, -0.02, -0.02], [-0.18, -0.3, -0.32], [-0.52, -0.4, -0.38]], 0.024, 16, false, 7), matVaso, 0, 0, 0, sc);

    // Células madre/osteoblastos con filopodios + ligandos RGD dorados + factores VEGF/BMP-2
    const matNuc = basicGlow(0x5FF2D2, 1.35);
    const matMem = new THREE.MeshPhysicalMaterial({ color:0xD8ECFF, roughness:0.25, clearcoat:0.7, transparent:true, opacity:0.86 });
    [[0.48, 0.12, 0.44], [-0.46, -0.1, 0.42], [0.04, 0.2, -0.36], [-0.14, -0.26, 0.08]].forEach(([x, y, z], i) => {
      celulaAdherida(sc, x, y, z, 0.1, matMem, matNuc, 120 + i);
    });
    for(let i = 0; i < 8; i++){
      const a = (i / 8) * Math.PI * 2 + 0.25;
      mesh(new THREE.OctahedronGeometry(0.036, 0), matOro, Math.cos(a) * 0.78, (i % 2 ? 0.14 : -0.14), Math.sin(a) * 0.78, sc);
    }

    return t => { grupo.rotation.y = t * 0.38; };
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
  const visorHito = montarVisor3D(r.querySelector('#lt3d'), escenaHito3D(hitos[0].anio), { camPos:[0.2, 0.9, 3.6] });
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
    const ctx2 = cv.getContext('2d'), t = reduceMotion ? 0.5 : ts * 0.001, W = cv.width, H = cv.height, m = modoDeSel();
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
    visor3d?.destruir(); visor3d = null;
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
      visor3d = montarVisor3D(stage, escenaGen3D(modoDeSel()), { camPos:[0.4, 1.1, 3.5] });
    } else {
      stage.innerHTML = '<canvas width="580" height="260"></canvas>';
      if(reduceMotion) dibujar2D(0, stage.firstElementChild);
      else raf = requestAnimationFrame(ts => dibujar2D(ts, stage.firstElementChild));
    }
    cuerpo.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { if(vista !== b.dataset.v){ vista = b.dataset.v; ficha(); cuerpo.querySelector(`[data-v="${vista}"]`)?.focus({ preventScroll:true }); } }));
    const g2Btns = [...cuerpo.querySelectorAll('[data-g2]')];
    g2Btns.forEach(b => b.addEventListener('click', () => {
      if(gen2Modo === b.dataset.g2) return;
      gen2Modo = b.dataset.g2;
      g2Btns.forEach(x => x.classList.toggle('on', x.dataset.g2 === gen2Modo));
      if(vista === '3d'){
        if(visor3d) visor3d.reemplazar(escenaGen3D(modoDeSel()));
      } else if(reduceMotion){
        dibujar2D(0, stage.firstElementChild);
      }
    }));
    cuerpo.querySelector('#gnPrev').addEventListener('click', () => ir(sel - 1));
    cuerpo.querySelector('#gnNext').addEventListener('click', () => ir(sel + 1));
  }
  function tabla(){
    cancelAnimationFrame(raf);
    visor3d?.destruir(); visor3d = null;
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
