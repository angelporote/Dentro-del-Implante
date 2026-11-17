/* =========================================================
   Vitrina 04 · Implantes I: ortopedia y dental
   - construir(d, ctx): sala tipo laboratorio con una mesa expositora semicircular y los 5 implantes
     flotando sobre puestos luminosos (cadera, rodilla, osteosíntesis, dental —destacado— y columna)
   - mesaInteractiva: lo que necesita actividades.js para el clic 3D dentro de la sala
     (objetivos del raycaster, nombres cortos y resaltado al pasar el ratón)
   - escenaImplante3D(id): el modelo detallado de cada implante para el mini-visor 3D
   - actividades.implante: la ficha de estudio (Historia · Biomateriales · Biomecánica · Quirúrgico)
   ========================================================= */
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { gsap, mesh, std, basicGlow, isMobile, gamaBaja } from '../util.js';
import { esc, raiz, sinDatos } from '../ui.js';
import { montarVisor3D } from '../visor3d.js';
import {
  asegurarTexturas as asegurarTexturasHistoria,
  crearRng, perfilTorneado, tuboVariable, mallaLoft, superficieOrganica, extruirCentrado, tornilloBiomedico,
  texHuesoBump, matTi, matHuesoCort, matHuesoTrab, matEncia, matHCA
} from './historia.js';

const CALIDAD = gamaBaja ? 0.6 : 1;   // resolución de las mallas (menos polígonos en equipos modestos)

/* ---------- Texturas y materiales propios (lazy: se pintan al usar la sala o la ficha) ---------- */
const lienzoTex = (w, h, pintar) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; pintar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
};
const R_TEX = gamaBaja ? 0.5 : 1;
let texPoros = null, texVasC = null, texVasR = null, texturasListas = false;

const matVastago = new THREE.MeshPhysicalMaterial({ color:0xFFFFFF, metalness:1, roughness:1, bumpScale:0.4 });
const matTiPoroso = new THREE.MeshPhysicalMaterial({ color:0xB4BAC7, metalness:0.9, roughness:1, bumpScale:1.6 });
const matTiPulido = new THREE.MeshPhysicalMaterial({ color:0xC6CCD8, metalness:1, roughness:0.16 });
const matCoCrPulido = new THREE.MeshPhysicalMaterial({ color:0xEEF1F6, metalness:1, roughness:0.06, clearcoat:0.5, clearcoatRoughness:0.04 });
const matCeramica = new THREE.MeshPhysicalMaterial({ color:0xF6EAEF, roughness:0.08, clearcoat:1, clearcoatRoughness:0.03, ior:1.76, sheen:0.25, sheenColor:0xFFE3EA });
const matInserto = new THREE.MeshPhysicalMaterial({ color:0xF8F3E8, roughness:0.35, clearcoat:0.25, sheen:0.4, sheenColor:0xFFF6DE });
const matCorona = new THREE.MeshPhysicalMaterial({ color:0xFBF7EE, roughness:0.14, clearcoat:0.9, clearcoatRoughness:0.06, sheen:0.3, sheenColor:0xFFFFFF });
const matInjerto = new THREE.MeshPhysicalMaterial({ color:0xD9B48C, roughness:0.9, bumpScale:0.05 });

export function asegurarTexturas(){
  asegurarTexturasHistoria();
  if(texturasListas) return;
  texturasListas = true;
  // Titanio trabecular: celdas abiertas como una espuma metálica
  texPoros = lienzoTex(512 * R_TEX, 512 * R_TEX, (g, w, h) => {
    g.fillStyle = '#9c9c9c'; g.fillRect(0, 0, w, h);
    for(let i = 0; i < 1300 * R_TEX * R_TEX; i++){
      const x = Math.random() * w, y = Math.random() * h, r = (3 + Math.random() * 6) * R_TEX;
      const gr = g.createRadialGradient(x, y, r * .15, x, y, r); gr.addColorStop(0, '#1e1e1e'); gr.addColorStop(.65, '#4a4a4a'); gr.addColorStop(1, 'rgba(225,225,225,.6)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  });
  texPoros.repeat.set(3, 3);
  // Vástago: titanio cepillado con el recubrimiento rugoso de hidroxiapatita en el tercio superior
  const texVastago = (color) => lienzoTex(256 * R_TEX, 512 * R_TEX, (g, w, h) => {
    g.fillStyle = color ? '#E4E7EE' : '#2E2E2E'; g.fillRect(0, 0, w, h);
    for(let i = 0; i < 700 * R_TEX; i++){ const y = Math.random() * h; g.fillStyle = color ? `rgba(160,168,185,${Math.random() * .12})` : `rgba(110,110,110,${Math.random() * .3})`; g.fillRect(0, y, w, 1); }
    const ch = h * 0.36;
    g.fillStyle = color ? '#B9B3A4' : '#DADADA'; g.fillRect(0, 0, w, ch - 12 * R_TEX);
    const grd = g.createLinearGradient(0, ch - 14 * R_TEX, 0, ch + 6 * R_TEX);
    grd.addColorStop(0, color ? '#B9B3A4' : '#DADADA'); grd.addColorStop(1, color ? 'rgba(185,179,164,0)' : 'rgba(218,218,218,0)');
    g.fillStyle = grd; g.fillRect(0, ch - 14 * R_TEX, w, 22 * R_TEX);
    for(let i = 0; i < 9000 * R_TEX * R_TEX; i++){
      const y = Math.random() * (ch - 8 * R_TEX), v = Math.random();
      g.fillStyle = color ? `rgba(${v > .5 ? 250 : 120},${v > .5 ? 246 : 114},${v > .5 ? 235 : 102},.55)` : `rgba(${v > .5 ? 255 : 90},${v > .5 ? 255 : 90},${v > .5 ? 255 : 90},.6)`;
      g.fillRect(Math.random() * w, y, 2, 2);
    }
  });
  texVasC = texVastago(true); texVasR = texVastago(false);
  texVasC.colorSpace = THREE.SRGBColorSpace;
  const xmin = -0.145, xmax = 0.16, ymin = -0.83, ymax = 0.43;
  [texVasC, texVasR].forEach(t => { t.repeat.set(1 / (xmax - xmin), 1 / (ymax - ymin)); t.offset.set(-xmin / (xmax - xmin), -ymin / (ymax - ymin)); });
  [texPoros, texVasC, texVasR].forEach(t => { t.userData.compartida = true; });
  Object.assign(matVastago, { map:texVasC, roughnessMap:texVasR, bumpMap:texVasR });
  Object.assign(matTiPoroso, { map:texPoros, roughnessMap:texPoros, bumpMap:texPoros });
  matInjerto.bumpMap = texHuesoBump;
  matVastago.needsUpdate = matTiPoroso.needsUpdate = matInjerto.needsUpdate = true;
}

/* ---------- Herramientas de modelado suave ---------- */
// Torno deformable: un perfil (r, y) girado alrededor de Y cuyo contorno se escala según el ángulo
// (contorno(th) → factor radial) y cuya superficie se puede modelar con desplazar(x, y, z) → dy.
// Se sueldan los vértices repetidos para que las normales queden continuas (superficie lisa, sin costuras).
function tornoDeformado(perfil, { segs = 72, contorno = () => 1, desplazar = null, phiStart = 0, phiLength = Math.PI * 2, uv = 1.4 } = {}){
  let geo = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), Math.round(segs * CALIDAD), phiStart, phiLength);
  geo.deleteAttribute('uv'); geo.deleteAttribute('normal');
  geo = mergeVertices(geo, 1e-6);
  const p = geo.attributes.position, uvs = [];
  for(let i = 0; i < p.count; i++){
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = contorno(Math.atan2(x, z)); x *= k; z *= k;
    if(desplazar) y += desplazar(x, y, z);
    p.setXYZ(i, x, y, z);
    uvs.push((x + z) * uv + 0.5, y * uv + 0.5);
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}
// Perfil de una "pastilla" de bordes redondeados (radio normalizado a 1), útil para insertos, bandejas y cuerpos vertebrales
function perfilPastilla(yBot, yTop, { borde = 0.06, cintura = 0, pasos = 10 } = {}){
  const p = [[0, yBot]], h = (yTop - yBot) / 2, yc = (yBot + yTop) / 2, bv = Math.min(borde, h);
  for(let i = 0; i <= pasos; i++){ const a = -Math.PI / 2 + (i / pasos) * Math.PI / 2; p.push([1 - borde + Math.cos(a) * borde, yBot + bv + Math.sin(a) * bv]); }
  if(cintura) for(let i = 1; i < 8; i++){ const u = i / 8; p.push([1 - cintura * Math.sin(u * Math.PI), yBot + bv + u * (2 * h - 2 * bv)]); }
  for(let i = 0; i <= pasos; i++){ const a = (i / pasos) * Math.PI / 2; p.push([1 - borde + Math.cos(a) * borde, yTop - bv + Math.sin(a) * bv]); }
  p.push([0, yTop]);
  return p.map(([r, y]) => [Math.max(0, r), y]);
}
// Contorno elíptico (semiejes ML = a en X, AP = b en Z) para tornoDeformado
const elipse = (a, b) => th => (a * b) / Math.hypot(b * Math.sin(th), a * Math.cos(th));
const campana = (d2, s) => Math.exp(-d2 / s);

/* =========================================================
   Modelos 3D de los 5 implantes (≈ 1,2 unidades de alto, centrados en el origen)
   ========================================================= */

// Prótesis total de cadera (como la de la portada): vástago anatómico biselado con recubrimiento de HA,
// cuello con cono Morse, cabeza cerámica, cotilo de titanio trabecular e inserto de polietileno
function modeloCadera(g){
  g.userData.capasPropias = true;
  const capa = (despiece) => { const gr = new THREE.Group(); gr.userData.capa = true; gr.userData.despiece = despiece; g.add(gr); return gr; };
  const s = new THREE.Shape();
  s.moveTo(0.02, -0.8);
  s.bezierCurveTo(0.075, -0.78, 0.082, -0.5, 0.088, -0.28);
  s.bezierCurveTo(0.095, -0.02, 0.112, 0.16, 0.122, 0.27);
  s.bezierCurveTo(0.13, 0.36, 0.1, 0.4, 0.06, 0.4);
  s.lineTo(-0.02, 0.385);
  s.bezierCurveTo(-0.06, 0.36, -0.1, 0.27, -0.112, 0.17);
  s.bezierCurveTo(-0.098, 0.02, -0.06, -0.22, -0.042, -0.46);
  s.bezierCurveTo(-0.032, -0.66, -0.025, -0.8, 0.02, -0.8);
  const prof = 0.05, bev = { depth:prof, bevelEnabled:true, bevelThickness:0.034, bevelSize:0.03, bevelSegments:8, curveSegments:48 };
  const cuerpo = new THREE.ExtrudeGeometry(s, bev); cuerpo.translate(0, 0, -prof / 2);
  const gVast = capa(new THREE.Vector3(0.18, -0.32, 0));
  mesh(cuerpo, matVastago, 0, 0, 0, gVast);
  // cuello con transición suave hacia el hombro del vástago y cono Morse
  const dir = new THREE.Vector3(-0.71, 0.7, 0).normalize(), base = new THREE.Vector3(0.0, 0.35, 0);
  const gCuello = capa(new THREE.Vector3(-0.04, 0.04, 0));
  const cuello = mesh(perfilTorneado([[0, -0.03], [0.075, -0.03], [0.064, 0.02], [0.05, 0.09], [0.043, 0.2], [0.04, 0.24], [0.034, 0.3], [0.03, 0.33], [0, 0.335]], 56), matTiPulido, 0, 0, 0, gCuello);
  cuello.position.copy(base); cuello.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const centro = base.clone().add(dir.clone().multiplyScalar(0.36));
  const gCabeza = capa(dir.clone().multiplyScalar(0.28));
  mesh(new THREE.SphereGeometry(0.14, 64, 44), matCeramica, centro.x, centro.y, centro.z, gCabeza);
  // cotilo e inserto como capas coaxiales que se separan siguiendo el eje del cuello (≈ 45° de inclinación)
  const casquete = (r0, r1, labio = 0) => {
    const p = [];
    for(let i = 0; i <= 24; i++){ const a = (i / 24) * Math.PI / 2; p.push([Math.cos(a) * r1, Math.sin(a) * r1]); }
    for(let i = 24; i >= 0; i--){ const a = (i / 24) * Math.PI / 2; p.push([Math.cos(a) * r0, Math.sin(a) * r0 - (i === 0 ? labio : 0)]); }
    p.push([r1, -labio * 0.6]);
    return perfilTorneado(p, 72);
  };
  const gInserto = capa(dir.clone().multiplyScalar(0.56));
  gInserto.position.copy(centro); gInserto.rotation.z = 0.62;
  mesh(casquete(0.15, 0.198, 0.012), matInserto, 0, 0, 0, gInserto);
  const gCotilo = capa(dir.clone().multiplyScalar(0.86));
  gCotilo.position.copy(centro); gCotilo.rotation.z = 0.62;
  mesh(casquete(0.2, 0.226), matTiPulido, 0, 0, 0, gCotilo);
  mesh(new THREE.SphereGeometry(0.229, 72, 32, 0, Math.PI * 2, 0, Math.PI / 2), matTiPoroso, 0, 0, 0, gCotilo);
}

// Materiales anatómicos de contexto
const matTendon = new THREE.MeshPhysicalMaterial({ color:0xEFE3D2, roughness:0.45, sheen:0.6, sheenColor:0xFFFFFF, clearcoat:0.2 });
const matDisco = new THREE.MeshPhysicalMaterial({ color:0xDCE6EE, roughness:0.4, clearcoat:0.4, sheen:0.5, sheenColor:0xFFFFFF });
const matRanura = new THREE.MeshStandardMaterial({ color:0x3B2A22, roughness:0.9 });
const matSutura = new THREE.MeshStandardMaterial({ color:0x8A6A4E, roughness:0.9 });
const matEsmalteNat = new THREE.MeshPhysicalMaterial({ color:0xF2EBD9, roughness:0.16, clearcoat:0.85, clearcoatRoughness:0.08, sheen:0.25, sheenColor:0xFFFFFF });
const matRaiz = new THREE.MeshPhysicalMaterial({ color:0xE9D9B8, roughness:0.5, transparent:true, opacity:0.9 });
const matEnciaTr = new THREE.MeshPhysicalMaterial({ color:0xE07A8E, roughness:0.38, clearcoat:0.4, sheen:0.4, sheenColor:0xFFC2CC, transparent:true, opacity:0.62, depthWrite:false, side:THREE.DoubleSide });
const matHuesoTr = new THREE.MeshPhysicalMaterial({ color:0xEFE2C6, roughness:0.55, transparent:true, opacity:0.34, depthWrite:false, side:THREE.DoubleSide });
const orientar = (obj, dir) => obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
// Hueso largo por secciones horizontales (elipses con centro y radios propios): [y, rx, rz, z0]
const huesoLargo = (secs, mat, parent, shape = null) => mesh(mallaLoft(secs.map(([y, rx, rz, z0 = 0]) => ({ pos:[0, y, z0], rx, ry:rz, rotX:Math.PI / 2, shapeFn:shape })), Math.round(44 * CALIDAD), true), mat, 0, 0, 0, parent);

// Rodilla articular completa: fémur distal con componente femoral de Co-Cr, tibia con bandeja de titanio
// e inserto de UHMWPE, peroné, rótula con botón rotuliano y tendones; cada pieza se despieza en su eje anatómico
function modeloRodilla(g){
  g.userData.capasPropias = true;
  const capa = (parent, despiece) => { const gr = new THREE.Group(); gr.userData.capa = true; gr.userData.despiece = despiece; parent.add(gr); return gr; };
  const via = [];
  for(let i = 0; i <= 8; i++){ const u = i / 8; via.push([0.172 + u * 0.018, 0.25 - u * 0.22]); }
  for(let i = 1; i <= 52; i++){ const a = -(i / 52) * (Math.PI + 0.55); via.push([-0.02 + Math.cos(a) * 0.21, 0.03 + Math.sin(a) * 0.21]); }
  const supereli = n => th => Math.pow(Math.pow(Math.abs(Math.cos(th)), n) + Math.pow(Math.abs(Math.sin(th)), n), -1 / n);
  const barrido = (x0, puntos, rx, ry, n) => mallaLoft(puntos.map(([z, y], i) => {
    const [z0, y0] = puntos[Math.max(0, i - 1)], [z1, y1] = puntos[Math.min(puntos.length - 1, i + 1)], u = i / (puntos.length - 1);
    return { pos:[x0, y, z], rx:typeof rx === 'function' ? rx(u) : rx, ry, rotX:Math.atan2(-(y1 - y0), z1 - z0), shapeFn:supereli(n) };
  }), Math.round(48 * CALIDAD), true);

  // Fémur + componente femoral: giran juntos en flexión pero se despiezan por separado
  const eje = new THREE.Group(); eje.name = 'rod_eje'; eje.position.set(0, 0.03, -0.02); g.add(eje);
  const fem = new THREE.Group(); fem.position.set(0, -0.03, 0.02); eje.add(fem);
  const gFemHueso = capa(fem, new THREE.Vector3(0, 0.42, -0.04));
  huesoLargo([[1.05, 0.095, 0.095, -0.03], [0.8, 0.1, 0.1, -0.03], [0.55, 0.12, 0.11, -0.035], [0.4, 0.16, 0.13, -0.035], [0.29, 0.2, 0.15, -0.035], [0.19, 0.212, 0.168, -0.03], [0.1, 0.2, 0.17, -0.03], [0.035, 0.17, 0.15, -0.03]], matHuesoCort, gFemHueso);
  const gFemComp = capa(fem, new THREE.Vector3(0, 0.16, 0));
  [-0.1, 0.1].forEach(x => mesh(barrido(x, via, 0.072, 0.026, 2.6), matCoCrPulido, 0, 0, 0, gFemComp));
  mesh(barrido(0, via.slice(0, 16), u => 0.12 + 0.06 * Math.pow(u, 0.7), 0.024, 3.2), matCoCrPulido, 0, 0, 0, gFemComp);

  // Inserto UHMWPE, bandeja + quilla de Ti, tibia + peroné como capas verticales independientes
  const meseta = th => elipse(0.225, 0.158)(th) * (1 - 0.2 * campana((Math.abs(th) - Math.PI) ** 2, 0.05));
  const cubetas = (x, y, z) => y > -0.19 ? -0.03 * campana((Math.abs(x) - 0.1) ** 2, 0.0035) * campana(z * z, 0.012) : 0;
  const gInserto = capa(g, new THREE.Vector3(0, -0.05, 0));
  mesh(tornoDeformado(perfilPastilla(-0.25, -0.168, { borde:0.07, pasos:10 }), { segs:96, contorno:meseta, desplazar:cubetas }), matInserto, 0, 0, -0.01, gInserto);
  const gBandeja = capa(g, new THREE.Vector3(0, -0.24, 0));
  mesh(tornoDeformado(perfilPastilla(-0.285, -0.252, { borde:0.05, pasos:6 }), { segs:96, contorno:meseta }), matTiPulido, 0, 0, -0.01, gBandeja);
  mesh(perfilTorneado([[0, -0.56], [0.018, -0.558], [0.032, -0.54], [0.046, -0.34], [0.054, -0.28], [0, -0.28]], 48), matTiPulido, 0, 0, -0.01, gBandeja);
  const gTibia = capa(g, new THREE.Vector3(0, -0.50, 0)); gTibia.name = 'rod_gTibia';
  huesoLargo([[-0.285, 0.222, 0.155, -0.01], [-0.33, 0.21, 0.15, -0.01], [-0.42, 0.165, 0.135, 0.0], [-0.55, 0.11, 0.105, 0.0], [-0.78, 0.085, 0.085, -0.005], [-1.08, 0.08, 0.078, -0.01]], matHuesoCort, gTibia);
  mesh(new THREE.SphereGeometry(0.06, 32, 20), matHuesoCort, 0, -0.47, 0.105, gTibia).scale.set(1, 1.5, 0.8);
  mesh(tuboVariable([[0.2, -0.4, -0.07], [0.215, -0.7, -0.06], [0.21, -1.06, -0.05]], u => 0.04 - 0.012 * Math.sin(u * Math.PI), 40, 20), matHuesoCort, 0, 0, 0, gTibia);
  mesh(new THREE.SphereGeometry(0.058, 28, 18), matHuesoCort, 0.198, -0.4, -0.07, gTibia);
  const anclaTendon = new THREE.Object3D(); anclaTendon.name = 'rod_anclaTendon'; anclaTendon.position.set(0, -0.47, 0.15); gTibia.add(anclaTendon);

  // Rótula + tendón cuadricipital y botón rotuliano de UHMWPE despiezados hacia delante
  const rot = new THREE.Group(); rot.name = 'rod_rot'; eje.add(rot);
  const rotula = new THREE.Group(); rotula.position.set(0, 0.2, 0.305); rot.add(rotula);
  const perfilRot = [[0, -0.045], [0.08, -0.044], [0.1, -0.03], [0.104, -0.005], [0.09, 0.02], [0.055, 0.04], [0, 0.046]];
  const gRotHueso = capa(rotula, new THREE.Vector3(0, 0.05, 0.28)); gRotHueso.name = 'rod_gRotHueso';
  const rm = mesh(tornoDeformado(perfilRot, { segs:64, contorno:elipse(1, 1.2) }), matHuesoCort, 0, 0, 0, gRotHueso); rm.rotation.x = Math.PI / 2;
  mesh(tuboVariable([[0, 0.06, -0.045], [0, 0.25, -0.135], [0, 0.46, -0.205]], u => 0.05 - 0.015 * u, 30, 18), matTendon, 0, 0, 0, gRotHueso).scale.x = 1.5;
  const gBoton = capa(rotula, new THREE.Vector3(0, 0.01, 0.12));
  const boton = mesh(perfilTorneado([[0, -0.03], [0.062, -0.03], [0.064, -0.02], [0.05, 0.0], [0.025, 0.012], [0, 0.015]], 48), matInserto, 0, 0, -0.06, gBoton); boton.rotation.x = -Math.PI / 2;
  const tendon = mesh(new THREE.CylinderGeometry(0.028, 0.034, 1, 24), matTendon, 0, 0, 0, g); tendon.name = 'rod_tendon'; tendon.scale.x = 1.45;
  return crearAnimRodilla(g);
}

function crearAnimRodilla(g){
  const eje = g.getObjectByName('rod_eje');
  const rot = g.getObjectByName('rod_rot');
  const gRotHueso = g.getObjectByName('rod_gRotHueso');
  const gTibia = g.getObjectByName('rod_gTibia');
  const anclaTendon = g.getObjectByName('rod_anclaTendon');
  const tendon = g.getObjectByName('rod_tendon');
  if(!eje || !rot || !gRotHueso || !gTibia || !anclaTendon || !tendon) return null;
  const pA = new THREE.Vector3(), pB = new THREE.Vector3();
  let flexK = 1;
  return (t) => {
    flexK += ((g.userData.despiezado ? 0 : 1) - flexK) * 0.08;
    const flex = 0.18 + flexK * (0.17 + 0.3 * Math.sin(t * 0.55));
    eje.rotation.x = flex;
    rot.rotation.x = -flex * 0.35;
    gRotHueso.updateWorldMatrix(true, false);
    gTibia.updateWorldMatrix(true, false);
    pA.set(0, -0.08, 0); gRotHueso.localToWorld(pA); g.worldToLocal(pA);
    pB.set(0, 0, 0); anclaTendon.localToWorld(pB); g.worldToLocal(pB);
    tendon.position.copy(pA).lerp(pB, 0.5);
    orientar(tendon, pA.clone().sub(pB));
    tendon.scale.y = Math.max(0.05, pA.distanceTo(pB));
  };
}

// Osteosíntesis craneal: calota con una craneotomía parietal repuesta y fijada con miniplacas de titanio
// que se amoldan a la curvatura del hueso, sus tornillos de bajo perfil y una tapa de agujero de trépano
function modeloOsteosintesis(g){
  g.userData.capasPropias = true;
  const A = 0.52, B = 0.66, C = 0.60, grosor = 0.034;
  // Esculpido craneal: frente con arcos superciliares suaves, fosa temporal hendida, eminencia parietal y occipital
  const kThPh = (th, ph) => {
    const absT = Math.abs(th);
    const frente = -0.035 * campana(th * th, 0.35);
    const ceja = 0.038 * campana((absT - 0.34) ** 2, 0.11) * campana((ph + 0.06) ** 2, 0.035)
               + 0.022 * campana(th * th, 0.06) * campana((ph + 0.04) ** 2, 0.03);
    const fosaTemp = -0.052 * campana((absT - 1.28) ** 2, 0.15) * campana((ph + 0.02) ** 2, 0.12);
    const parietal = 0.04 * campana((absT - 1.48) ** 2, 0.24) * campana((ph - 0.52) ** 2, 0.22);
    const occip = 0.044 * campana((absT - Math.PI) ** 2, 0.36) * campana((ph - 0.02) ** 2, 0.16);
    return elipse(A, B)(th) * (1 + frente + ceja + fosaTemp + parietal + occip);
  };
  const phBase = th => {
    const absT = Math.abs(th);
    return -0.22 - 0.14 * Math.pow(absT / Math.PI, 1.3) + 0.07 * campana((absT - 1.25) ** 2, 0.18);
  };
  const P = (th, ph, dr = 0) => {
    const k = kThPh(th, ph) + dr, c = C + dr;
    return new THREE.Vector3(Math.cos(ph) * k * Math.sin(th), c * Math.sin(ph) - 0.08, Math.cos(ph) * k * Math.cos(th));
  };
  const N = (th, ph) => P(th, ph, 0.01).sub(P(th, ph)).normalize();

  // Ventana parietal real (colgajo óseo separable de la calota huésped)
  const thC = 0.92, phC = 0.60, dTh = 0.44, dPh = 0.28;
  const contorno = (u, esc = 1) => {
    const a = u * Math.PI * 2, c = Math.cos(a), s2 = Math.sin(a), n = 4;
    const f = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s2), n), -1 / n) * esc;
    return [thC + c * f * dTh, phC + s2 * f * dPh];
  };
  const rho = (th, ph) => Math.pow(Math.pow(Math.abs(th - thC) / dTh, 4) + Math.pow(Math.abs(ph - phC) / dPh, 4), 0.25);
  const aContorno = (th, ph) => {
    const a = Math.atan2((ph - phC) / dPh, (th - thC) / dTh);
    return a < 0 ? a / (Math.PI * 2) + 1 : a / (Math.PI * 2);
  };

  const nFlap = N(thC, phC);
  const capa = (despiece) => { const gr = new THREE.Group(); gr.userData.capa = true; gr.userData.despiece = despiece; g.add(gr); return gr; };
  const calotaGrp = capa(nFlap.clone().multiplyScalar(-0.04));
  const colgajoGrp = capa(nFlap.clone().multiplyScalar(0.32));
  const placasGrp = capa(nFlap.clone().multiplyScalar(0.56));
  const tornillosGrp = capa(nFlap.clone().multiplyScalar(0.78));

  // Calota huésped con ventana recortada (vértices interiores ajustados al contorno del corte)
  const nU = Math.round(124 * CALIDAD), nV = Math.round(54 * CALIDAD);
  const gridTh = [], gridPh = [], gridKeep = [], gridSnap = [];
  for(let j = 0; j <= nV; j++){
    const v = j / nV;
    for(let i = 0; i <= nU; i++){
      const th = (i / nU) * Math.PI * 2 - Math.PI, pb = phBase(th);
      const ph = pb + v * (Math.PI / 2 - pb);
      gridTh.push(th); gridPh.push(ph); gridSnap.push(false);
    }
  }
  const rhoKerf = 1.035;
  for(let j = 0; j < nV; j++) for(let i = 0; i < nU; i++){
    const a = j * (nU + 1) + i, b = a + 1, c = a + nU + 1, d = c + 1;
    const thMid = (gridTh[a] + gridTh[b]) * 0.5, phMid = (gridPh[a] + gridPh[c]) * 0.5;
    const avgR = (rho(gridTh[a], gridPh[a]) + rho(gridTh[b], gridPh[b]) + rho(gridTh[c], gridPh[c]) + rho(gridTh[d], gridPh[d])) * 0.25;
    if(rho(thMid, phMid) >= 1.015 && avgR >= 1.01){
      gridKeep.push([a, b, c, d]);
      [a, b, c, d].forEach(idx => { if(rho(gridTh[idx], gridPh[idx]) < rhoKerf) gridSnap[idx] = true; });
    }
  }
  for(let k = 0; k < gridTh.length; k++){
    if(gridSnap[k]){ const [st, sp] = contorno(aContorno(gridTh[k], gridPh[k]), rhoKerf); gridTh[k] = st; gridPh[k] = sp; }
  }
  const supCalota = (dr, invertir) => {
    const pos = [], idx = [];
    for(let k = 0; k < gridTh.length; k++){ const v = P(gridTh[k], gridPh[k], dr); pos.push(v.x, v.y, v.z); }
    for(const [a, b, c, d] of gridKeep) invertir ? idx.push(a, b, c, b, d, c) : idx.push(a, c, b, b, c, d);
    let geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    geo = mergeVertices(geo, 1e-6);
    const pp = geo.attributes.position, uv = [];
    for(let i = 0; i < pp.count; i++) uv.push((pp.getX(i) + pp.getZ(i)) * 1.2, pp.getY(i) * 1.2);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    return geo;
  };
  mesh(supCalota(0, false), matHuesoCort, 0, 0, 0, calotaGrp);
  mesh(supCalota(-grosor, true), matHuesoTrab, 0, 0, 0, calotaGrp);

  // Paredes de diploe: borde inferior anatómico + borde interno del corte de la craneotomía
  const hacerCinta = (ptsFn, nSeg, invWinding) => {
    const pts = [];
    for(let i = 0; i <= nSeg; i++){ const [t, p] = ptsFn(i / nSeg); pts.push(P(t, p, 0), P(t, p, -grosor)); }
    const geo = new THREE.BufferGeometry().setFromPoints(pts), idx = [];
    for(let i = 0; i < nSeg; i++){
      const a = i * 2;
      invWinding ? idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3) : idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  };
  mesh(hacerCinta(u => { const th = u * Math.PI * 2 - Math.PI; return [th, phBase(th)]; }, nU, false), matHuesoTrab, 0, 0, 0, calotaGrp);
  mesh(hacerCinta(u => contorno(u, rhoKerf), 144, true), matHuesoTrab, 0, 0, 0, calotaGrp);

  // Colgajo óseo parietal separado (tabla externa, interna y pared de diploe exterior)
  const nR = Math.round(12 * CALIDAD), nA = Math.round(120 * CALIDAD), rFlap = 0.965;
  const supFlap = (dr, invertir) => {
    const pos = [], idx = [];
    for(let j = 0; j <= nR; j++){
      const rf = (j / nR) * rFlap;
      for(let i = 0; i <= nA; i++){
        const [t, p] = contorno(i / nA, rf); const v = P(t, p, dr); pos.push(v.x, v.y, v.z);
      }
    }
    for(let j = 0; j < nR; j++) for(let i = 0; i < nA; i++){
      const a = j * (nA + 1) + i, b = a + 1, c = a + nA + 1, d = c + 1;
      invertir ? idx.push(a, c, b, b, c, d) : idx.push(a, b, c, b, d, c);
    }
    let geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    geo = mergeVertices(geo, 1e-6);
    const pp = geo.attributes.position, uv = [];
    for(let i = 0; i < pp.count; i++) uv.push((pp.getX(i) + pp.getZ(i)) * 1.2, pp.getY(i) * 1.2);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    return geo;
  };
  mesh(supFlap(0, false), matHuesoCort, 0, 0, 0, colgajoGrp);
  mesh(supFlap(-grosor, true), matHuesoTrab, 0, 0, 0, colgajoGrp);
  mesh(hacerCinta(u => contorno(u, rFlap), nA, false), matHuesoTrab, 0, 0, 0, colgajoGrp);

  // Suturas craneales (coronal, sagital y lambdoidea) repartidas limpiamente sin cruzar el corte abierto
  const proyectar = (d) => { const th = Math.atan2(d.x, d.z), ph = Math.atan2(d.y * kThPh(th, 0.35), Math.hypot(d.x, d.z) * C); return [th, ph]; };
  const sutura = (fn, n = 260) => {
    let tramoCalota = [], tramoFlap = [];
    const volcar = (pts, dest) => { if(pts.length >= 6) mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.0028, 5, false), matSutura, 0, 0, 0, dest); };
    for(let i = 0; i <= n; i++){
      const [th, ph] = proyectar(fn(i / n)), dien = 0.011 * Math.sin(i * 2.6) * (0.6 + 0.4 * Math.sin(i * 0.21));
      const t = th + dien, p = ph + dien * 0.6, rr = rho(t, p);
      if(p < phBase(t) + 0.03) continue;
      if(rr >= rhoKerf + 0.01){ volcar(tramoFlap, colgajoGrp); tramoFlap = []; tramoCalota.push(P(t, p, 0.0014)); }
      else if(rr <= rFlap - 0.01){ volcar(tramoCalota, calotaGrp); tramoCalota = []; tramoFlap.push(P(t, p, 0.0014)); }
      else { volcar(tramoCalota, calotaGrp); volcar(tramoFlap, colgajoGrp); tramoCalota = []; tramoFlap = []; }
    }
    volcar(tramoCalota, calotaGrp); volcar(tramoFlap, colgajoGrp);
  };
  sutura(u => { const b = -1.25 + u * 2.5; return new THREE.Vector3(Math.sin(b), Math.cos(b), 0.42); });             // coronal
  sutura(u => { const c = 0.42 + u * (Math.PI - 1.15); return new THREE.Vector3(0, Math.sin(c), Math.cos(c)); });    // sagital
  sutura(u => { const b = -1.15 + u * 2.3; return new THREE.Vector3(Math.sin(b), Math.cos(b) * 0.9, -0.75); });     // lambdoidea

  // Miniplacas en "hueso de perro" dobladas sobre la superficie + tornillos con vástago roscado visible al despiezar
  const placaGeo = (() => {
    const sh = new THREE.Shape(), r = 0.028, sep = 0.052, w = 0.011, al = Math.asin(w / r), cx = r * Math.cos(al);
    sh.moveTo(-sep + cx, w); sh.lineTo(sep - cx, w);
    sh.absarc(sep, 0, r, Math.PI - al, al - Math.PI, true);
    sh.lineTo(-sep + cx, -w);
    sh.absarc(-sep, 0, r, -al, al - Math.PI * 2, true);
    sh.closePath();
    [-sep, sep].forEach(x => { const h = new THREE.Path(); h.absarc(x, 0, 0.0115, 0, Math.PI * 2, true); sh.holes.push(h); });
    return new THREE.ExtrudeGeometry(sh, { depth:0.0045, bevelEnabled:true, bevelThickness:0.003, bevelSize:0.003, bevelSegments:3, curveSegments:28 });
  })();
  const tornilloMini = () => {
    const t = new THREE.Group();
    // Cabeza avellanada + cuello y vástago micro-roscado (-Y) que queda oculto en hueso y asoma al despiezar
    mesh(perfilTorneado([[0, -0.028], [0.0045, -0.024], [0.0065, -0.018], [0.0052, -0.014], [0.0068, -0.010], [0.0052, -0.006], [0.007, -0.002], [0.0128, 0], [0.0124, 0.0045], [0.0082, 0.0085], [0, 0.0095]], 28), matTiPulido, 0, 0, 0, t);
    [0, Math.PI / 2].forEach(r => { const m = mesh(new THREE.BoxGeometry(0.016, 0.003, 0.0028), matRanura, 0, 0.0088, 0, t); m.rotation.y = r; });
    return t;
  };
  const colocar = (geoPlana, th, ph, ang, alto = 0.0035) => {
    const geo = geoPlana.clone(), pp = geo.attributes.position;
    const c = P(th, ph), n = N(th, ph), e1 = P(th + 0.01, ph).sub(c).normalize(), e2 = new THREE.Vector3().crossVectors(n, e1).normalize();
    const u1 = e1.clone().multiplyScalar(Math.cos(ang)).add(e2.clone().multiplyScalar(Math.sin(ang))), u2 = new THREE.Vector3().crossVectors(n, u1);
    for(let i = 0; i < pp.count; i++){
      const q = c.clone().add(u1.clone().multiplyScalar(pp.getX(i))).add(u2.clone().multiplyScalar(pp.getY(i)));
      q.y += 0.08;
      const th2 = Math.atan2(q.x, q.z), qh = Math.hypot(q.x, q.z), ph2 = Math.atan2(q.y * kThPh(th2, Math.atan2(q.y, qh)), qh * C);
      const sP = P(th2, ph2), sN = N(th2, ph2);
      pp.setXYZ(i, sP.x + sN.x * (pp.getZ(i) + alto), sP.y + sN.y * (pp.getZ(i) + alto), sP.z + sN.z * (pp.getZ(i) + alto));
    }
    geo.computeVertexNormals();
    return { geo, c, n, u1 };
  };
  [0.08, 0.36, 0.62, 0.86].forEach(u => {
    const [th, ph] = contorno(u), [th2, ph2] = contorno(u + 0.004);
    const tang = P(th2, ph2).sub(P(th, ph)).normalize(), n = N(th, ph), e1 = P(th + 0.01, ph).sub(P(th, ph)).normalize(), e2 = new THREE.Vector3().crossVectors(n, e1);
    const cruce = Math.atan2(tang.dot(e2), tang.dot(e1)) + Math.PI / 2;
    const { geo, c, u1 } = colocar(placaGeo, th, ph, cruce);
    mesh(geo, matTiPulido, 0, 0, 0, placasGrp);
    [-0.052, 0.052].forEach(d => {
      const q = c.clone().add(u1.clone().multiplyScalar(d)); q.y += 0.08;
      const t2 = Math.atan2(q.x, q.z), qh = Math.hypot(q.x, q.z), p2 = Math.atan2(q.y * kThPh(t2, Math.atan2(q.y, qh)), qh * C);
      const tm = tornilloMini(); tm.position.copy(P(t2, p2, 0.008)); orientar(tm, N(t2, p2)); tornillosGrp.add(tm);
    });
  });
  // agujero de trépano con su tapa radial
  const [thT, phT] = [thC - dTh * 1.02, phC + dPh * 1.02];
  const tapa = new THREE.Shape(); tapa.absarc(0, 0, 0.046, 0, Math.PI * 2, false);
  const hT = new THREE.Path(); hT.absarc(0, 0, 0.012, 0, Math.PI * 2, true); tapa.holes.push(hT);
  const tapaGeo = new THREE.ExtrudeGeometry(tapa, { depth:0.0035, bevelEnabled:true, bevelThickness:0.002, bevelSize:0.002, bevelSegments:2, curveSegments:32 });
  mesh(colocar(tapaGeo, thT, phT, 0, 0.004).geo, matTiPulido, 0, 0, 0, placasGrp);
  for(let k = 0; k < 3; k++){
    const a = k / 3 * Math.PI * 2, { c, u1 } = colocar(tapaGeo, thT, phT, a);
    const q = c.clone().add(u1.clone().multiplyScalar(0.034)); q.y += 0.08;
    const t2 = Math.atan2(q.x, q.z), qh = Math.hypot(q.x, q.z), p2 = Math.atan2(q.y * kThPh(t2, Math.atan2(q.y, qh)), qh * C);
    const tm = tornilloMini(); tm.position.copy(P(t2, p2, 0.008)); orientar(tm, N(t2, p2)); tornillosGrp.add(tm);
  }
}

/* ---------- Dientes (coordenadas locales: X mesiodistal, Z vestíbulo-lingual, Y hacia oclusal) ---------- */
const MM = 0.0145;   // unidades por milímetro en la arcada
function corona(tipo, md, ll, alto, mat){
  const perfiles = {
    incisivo:[[0, 0], [0.8, 0], [0.96, 0.25], [1, 0.45], [0.95, 0.72], [0.82, 0.92], [0, 1]],
    canino:[[0, 0], [0.8, 0], [0.97, 0.22], [1, 0.42], [0.86, 0.72], [0.45, 0.93], [0, 1]],
    premolar:[[0, 0], [0.78, 0], [0.95, 0.25], [1, 0.5], [0.95, 0.75], [0.7, 0.92], [0, 0.96]],
    molar:[[0, 0], [0.8, 0], [0.95, 0.25], [1, 0.52], [0.97, 0.76], [0.8, 0.92], [0.4, 0.97], [0, 0.98]]
  };
  const relieve = (x, y, z) => {
    const yn = y / alto; if(yn < 0.8) return 0;
    const w = Math.min(1, (yn - 0.8) / 0.12), mx = md / 2, lz = ll / 2;
    let d = 0;
    if(tipo === 'molar'){
      [[-0.45, 0.4, 1], [0.05, 0.42, 0.95], [0.5, 0.36, 0.85], [-0.4, -0.4, 1], [0.35, -0.42, 0.95]].forEach(([cx, cz, h]) => { d += 0.16 * alto * h * campana(((x - cx * mx) / mx) ** 2 + ((z - cz * lz) / lz) ** 2, 0.09); });
      d -= 0.08 * alto * campana((z / lz) ** 2, 0.02) * (1 - (x / mx) ** 2);
    } else if(tipo === 'premolar'){
      d += 0.2 * alto * campana((x / mx) ** 2 + ((z - 0.38 * lz) / lz) ** 2, 0.12) + 0.1 * alto * campana((x / mx) ** 2 + ((z + 0.42 * lz) / lz) ** 2, 0.1);
      d -= 0.06 * alto * campana((z / lz) ** 2, 0.015);
    }
    return d * w;
  };
  let geo = tornoDeformado(perfiles[tipo].map(([r, y]) => [r, y * alto]), { segs:56, contorno:elipse(md / 2, ll / 2), desplazar:relieve });
  if(tipo === 'incisivo' || tipo === 'canino'){   // borde incisal: aplana la cara labio-lingual hacia arriba
    const pp = geo.attributes.position;
    for(let i = 0; i < pp.count; i++){ const yn = pp.getY(i) / alto; pp.setZ(i, pp.getZ(i) * (1 - (tipo === 'incisivo' ? 0.68 : 0.35) * Math.max(0, yn - 0.3) / 0.7)); }
    geo.computeVertexNormals();
  }
  return new THREE.Mesh(geo, mat);
}
function raizDental(len, r, x = 0){
  return mesh(perfilTorneado([[0, -len], [r * 0.25, -len + r * 0.3], [r * 0.7, -len * 0.55], [r, -len * 0.1], [r * 1.02, 0], [0, 0]], 28), matRaiz, x, 0, 0);
}

// Dentadura: arcada mandibular completa separada por capas reales (mandíbula, encía, dientes naturales e implante en torre)
function modeloDental(g){
  g.userData.capasPropias = true;
  const capa = (despiece) => { const gr = new THREE.Group(); gr.userData.capa = true; gr.userData.despiece = despiece; g.add(gr); return gr; };
  const lado = [[0, 0, 0.5], [0.13, 0, 0.47], [0.24, 0, 0.38], [0.31, 0, 0.24], [0.345, 0, 0.08], [0.365, 0, -0.1], [0.38, 0, -0.3]];
  const curva = new THREE.CatmullRomCurve3([...lado.slice(1).reverse().map(([x, y, z]) => new THREE.Vector3(-x, y, z)), ...lado.map(([x, y, z]) => new THREE.Vector3(x, y, z))], false, 'centripetal');
  const Lt = curva.getLength(), uMedio = 0.5;
  const tipos = [['incisivo', 5.2, 6, 9, 12.5], ['incisivo', 5.8, 6.4, 9.5, 14], ['canino', 7, 7.6, 11, 16], ['premolar', 7, 7.6, 8.5, 14], ['premolar', 7.2, 8, 8, 14.5], ['molar', 11, 10.4, 7.6, 13], ['molar', 10.6, 10, 7.2, 12.5]];
  const huecos = 0.25;
  const naturales = capa(new THREE.Vector3(0, 0.03, 0));
  const enciaGrp = capa(new THREE.Vector3(0, -0.08, 0));
  const huesoGrp = capa(new THREE.Vector3(0, -0.20, 0));
  [-1, 1].forEach(sx => {
    let acum = 0;
    tipos.forEach(([tipo, md, ll, alto, lr], k) => {
      const w = md * MM, centro = acum + w / 2 + huecos * MM; acum += w + huecos * MM;
      const u = uMedio + sx * centro / Lt, pos = curva.getPointAt(u), tan = curva.getTangentAt(u), yaw = Math.atan2(tan.x, tan.z) - Math.PI / 2;
      const implante = sx < 0 && k === 5;
      if(implante){
        const piezaImp = (dy) => { const c = capa(new THREE.Vector3(0, dy, 0)); c.position.copy(pos); c.rotation.y = yaw; return c; };
        const imp = tornilloBiomedico(piezaImp(0.10), { rMax:2.1 * MM, rTip:1.6 * MM, hCuerpo:10 * MM, vueltas:9, rFilete:0.45 * MM, hCuello:1.2 * MM, rCuello:2.15 * MM, tipoCabeza:'none', mat:matTi, matRosca:matTi });
        imp.position.y = -6.2 * MM - 1.2 * MM;
        const collar = mesh(new THREE.TorusGeometry(2.6 * MM, 0.3 * MM, 12, 48), matHCA, 0, -0.6 * MM, 0, piezaImp(0.24)); collar.rotation.x = Math.PI / 2;
        mesh(perfilTorneado([[0, -0.6 * MM], [2.2 * MM, -0.6 * MM], [2.3 * MM, 0.4 * MM], [1.6 * MM, 3 * MM], [0, 3.2 * MM]], 40), matTiPulido, 0, 0, 0, piezaImp(0.38));
        piezaImp(0.54).add(corona('molar', md * MM, ll * MM, alto * MM, matCorona));
      } else {
        const diente = new THREE.Group(); diente.position.copy(pos); diente.rotation.y = yaw; naturales.add(diente);
        diente.add(corona(tipo, md * MM, ll * MM, alto * MM, matEsmalteNat));
        if(tipo === 'molar') [-0.24, 0.24].forEach(x => diente.add(raizDental(lr * MM, 2.2 * MM, x * md * MM)));
        else diente.add(raizDental(lr * MM, Math.min(md, ll) * 0.36 * MM));
      }
    });
  });
  const nS = Math.round(120 * CALIDAD), secsE = [], secsH = [];
  for(let i = 0; i <= nS; i++){
    const u = 0.015 + (i / nS) * 0.97, p = curva.getPointAt(u), t = curva.getTangentAt(u), yaw = Math.atan2(t.x, t.z);
    const papila = 0.5 + 0.5 * Math.cos((Math.abs(u - uMedio) * Lt / (7.4 * MM)) * Math.PI * 2);
    secsE.push({ pos:[p.x, -0.012 + papila * 0.012, p.z], rx:5.8 * MM, ry:3.2 * MM + papila * 1.6 * MM, rotY:yaw, shapeFn:th => (Math.sin(th) < 0 ? 1.15 : 1) });
    secsH.push({ pos:[p.x, -0.13, p.z], rx:6.2 * MM, ry:0.135, rotY:yaw, shapeFn:th => 1 - 0.22 * Math.max(0, Math.sin(th)) + 0.08 * Math.max(0, -Math.sin(th)) });
  }
  const enciaM = mesh(mallaLoft(secsE, 40, true), matEnciaTr, 0, 0, 0, enciaGrp); enciaM.renderOrder = 2;
  const huesoM = mesh(mallaLoft(secsH, 40, true), matHuesoTr, 0, 0, 0, huesoGrp); huesoM.renderOrder = 1;
}

// Columna lumbar: 7 subconjuntos quirúrgicos separados axialmente y anteroposteriormente al despiezar
function modeloColumna(g){
  g.userData.capasPropias = true;
  const capa = (despiece, y0 = 0) => { const gr = new THREE.Group(); gr.position.y = y0; gr.userData.capa = true; gr.userData.despiece = despiece; g.add(gr); return gr; };
  const rinon = th => elipse(0.29, 0.205)(th) * (1 - 0.24 * campana((Math.abs(th) - Math.PI) ** 2, 0.3));
  const platillos = (x, y, z) => (Math.abs(y) > 0.12 ? -Math.sign(y) * 0.012 * campana(x * x + z * z, 0.03) : 0);
  const vertebra = (y0, despiece) => {
    const v = capa(despiece, y0);
    mesh(tornoDeformado(perfilPastilla(-0.14, 0.14, { borde:0.055, cintura:0.06, pasos:8 }), { segs:96, contorno:rinon, desplazar:platillos }), matHuesoCort, 0, 0, 0.04, v);
    const tubo = (pts, r0, r1, segs = 28) => mesh(tuboVariable(pts, u => r0 + (r1 - r0) * u, Math.round(segs * CALIDAD), Math.round(18 * CALIDAD)), matHuesoCort, 0, 0, 0, v);
    [-1, 1].forEach(s => {
      tubo([[s * 0.1, 0.03, -0.12], [s * 0.125, 0.04, -0.22], [s * 0.135, 0.03, -0.3]], 0.058, 0.05);
      tubo([[s * 0.14, 0.04, -0.3], [s * 0.26, 0.06, -0.33], [s * 0.37, 0.07, -0.33]], 0.04, 0.022);
      mesh(new THREE.SphereGeometry(0.025, 20, 14), matHuesoCort, s * 0.37, 0.07, -0.33, v);
      tubo([[s * 0.13, 0.05, -0.33], [s * 0.135, 0.13, -0.35], [s * 0.125, 0.18, -0.34]], 0.04, 0.03);
      tubo([[s * 0.1, -0.02, -0.38], [s * 0.098, -0.1, -0.4], [s * 0.09, -0.15, -0.39]], 0.036, 0.028);
    });
    tubo([[-0.14, 0.03, -0.32], [-0.06, 0.0, -0.4], [0.06, 0.0, -0.4], [0.14, 0.03, -0.32]], 0.046, 0.046, 36);
    tubo([[0, 0.0, -0.4], [0, -0.05, -0.52], [0, -0.1, -0.63], [0, -0.11, -0.68]], 0.052, 0.03).scale.x = 0.55;
    return v;
  };
  vertebra(0.4, new THREE.Vector3(0, 0.34, 0));
  vertebra(0, new THREE.Vector3(0, 0, 0));
  vertebra(-0.4, new THREE.Vector3(0, -0.34, 0));
  const discoGrp = capa(new THREE.Vector3(0, 0.17, 0));
  mesh(tornoDeformado(perfilPastilla(0.135, 0.265, { borde:0.06, cintura:-0.04, pasos:8 }), { segs:96, contorno:th => rinon(th) * 0.98 }), matDisco, 0, 0, 0.04, discoGrp);
  // Caja intersomática + injerto agrupados (salen hacia anterior)
  const cajaGrp = capa(new THREE.Vector3(0, -0.06, 0.36));
  const caja = new THREE.Shape();
  caja.absellipse(0, 0.04, 0.19, 0.135, 0, Math.PI * 2, false, 0);
  const vent = new THREE.Path(); vent.absellipse(0, 0.04, 0.075, 0.05, 0, Math.PI * 2, true, 0); caja.holes.push(vent);
  const cajaM = mesh(extruirCentrado(caja, 0.08, { bevelThickness:0.016, bevelSize:0.014, bevelSegments:5, curveSegments:64 }), matTiPoroso, 0, -0.2, 0, cajaGrp);
  cajaM.rotation.x = Math.PI / 2;
  const rng = crearRng(44);
  for(let i = 0; i < 12; i++) mesh(new THREE.IcosahedronGeometry(0.02 + rng() * 0.012, 1), matInjerto, (rng() - 0.5) * 0.11, -0.2 + (rng() - 0.5) * 0.07, 0.04 + (rng() - 0.5) * 0.07, cajaGrp);
  // Fijación posterior separada en plano de tornillos pediculares y plano de barras
  const tornillosGrp = capa(new THREE.Vector3(0, 0, -0.38));
  const barrasGrp = capa(new THREE.Vector3(0, 0, -0.66));
  [-1, 1].forEach(s => {
    [0.02, -0.38].forEach(y => {
      const t = tornilloBiomedico(tornillosGrp, { rMax:0.033, rTip:0.02, hCuerpo:0.4, vueltas:8, rFilete:0.01, hCuello:0.04, rCuello:0.034, tipoCabeza:'none', mat:matTi, matRosca:matTi });
      t.rotation.set(-Math.PI / 2, -s * 0.2, 0); t.position.set(s * 0.13, y, -0.12);
      const tul = new THREE.Group(); tul.position.set(s * 0.175, y, -0.42); tornillosGrp.add(tul);
      [0, Math.PI].forEach(r => { const m = mesh(new THREE.CylinderGeometry(0.046, 0.042, 0.1, 32, 1, false, r + 0.45, Math.PI - 0.9), matTiPulido, 0, 0, 0, tul); m.rotation.x = Math.PI / 2; });
      mesh(perfilTorneado([[0, -0.03], [0.04, -0.03], [0.044, -0.01], [0.04, 0.0], [0, 0.0]], 32), matTiPulido, 0, 0, -0.04, tul).rotation.x = -Math.PI / 2;
    });
    mesh(new THREE.CapsuleGeometry(0.02, 0.42, 10, 32), matCoCrPulido, s * 0.175, -0.18, -0.42, barrasGrp);
  });
}

const MODELOS = { cadera:modeloCadera, rodilla:modeloRodilla, osteosintesis:modeloOsteosintesis, dental:modeloDental, columna:modeloColumna };
const PROTOS = {};

function clonarNodo(src){
  const dst = src.isMesh
    ? new THREE.Mesh(src.geometry, src.material)
    : (src.isGroup ? new THREE.Group() : new THREE.Object3D());
  dst.name = src.name;
  dst.position.copy(src.position);
  dst.quaternion.copy(src.quaternion);
  dst.scale.copy(src.scale);
  dst.renderOrder = src.renderOrder;
  if(src.userData?.capa) dst.userData.capa = true;
  if(src.userData?.despiece) dst.userData.despiece = src.userData.despiece.clone();
  for(const ch of src.children) dst.add(clonarNodo(ch));
  return dst;
}

// Construye cada implante una sola vez (geometrías compartidas) y lo clona para pasillo y mini-visor
function instanciarModelo(id, destino){
  asegurarTexturas();
  const clave = MODELOS[id] ? id : 'cadera';
  let proto = PROTOS[clave];
  if(!proto){
    proto = new THREE.Group();
    MODELOS[clave](proto);
    proto.traverse(o => { if(o.geometry) o.geometry.userData.compartida = true; });
    PROTOS[clave] = proto;
  }
  if(proto.userData.capasPropias) destino.userData.capasPropias = true;
  for(const ch of proto.children) destino.add(clonarNodo(ch));
  return clave === 'rodilla' ? crearAnimRodilla(destino) : null;
}

// Escena del mini-visor 3D de la ficha (montarVisor3D)
export function escenaImplante3D(id){
  return (grupo) => {
    // pieza: el modelo; si no define sus propias subcapas quirúrgicas, envuelve cada hijo directo para despiezar
    const pieza = new THREE.Group(); grupo.add(pieza);
    const anim = instanciarModelo(id, pieza);
    if(!pieza.userData.capasPropias){
      [...pieza.children].forEach(c => { const capa = new THREE.Group(); capa.userData.capa = true; pieza.add(capa); capa.add(c); });
    }
    grupo.rotation.set(0.12, { columna:Math.PI - 0.7, rodilla:-0.85, osteosintesis:-0.6, dental:-0.25 }[id] ?? -0.35, 0);
    grupo.userData = { pieza, implanteId:id, extra:null };
    return (t, g) => { anim?.(t, g); grupo.userData.extra?.(t); };
  };
}

/* ---- El modelo reacciona al apartado que se estudia ----
   separar(on): despiece (cada capa se aleja del centro, como en la portada)
   modo('biomateriales'): piezas coloreadas por familia de material y tejidos en fantasma
   modo('biomecanica'): flechas de carga y de reacción que laten
   modo('quirurgico'): el hueso se vuelve translúcido para ver qué se implanta y dónde */
const FAMILIA_DE = new Map([
  [matVastago, 'metal'], [matTiPoroso, 'metal'], [matTiPulido, 'metal'], [matCoCrPulido, 'metal'], [matTi, 'metal'],
  [matCeramica, 'ceramica'], [matCorona, 'ceramica'],
  [matInserto, 'polimero'],
  [matHCA, 'recubrimiento']
]);
export const COLOR_FAMILIA = { metal:0x9FB4FF, ceramica:0xD7C6FF, polimero:0xFFD98A, recubrimiento:0x5FF2D2 };
const matsFamilia = Object.fromEntries(Object.entries(COLOR_FAMILIA).map(([k, c]) =>
  [k, new THREE.MeshStandardMaterial({ color:c, roughness:0.38, metalness:0.15, emissive:c, emissiveIntensity:0.18 })]));
const matFantasma = new THREE.MeshStandardMaterial({ color:0xE6D7B8, roughness:0.7, transparent:true, opacity:0.1, depthWrite:false });
const matHuesoQuir = new THREE.MeshStandardMaterial({ color:0xE6D7B8, roughness:0.7, transparent:true, opacity:0.22, depthWrite:false });
const matFlechaCarga = new THREE.MeshBasicMaterial({ color:0xFF7A8A, transparent:true, opacity:0.95, depthTest:false });
const matFlechaReaccion = new THREE.MeshBasicMaterial({ color:0x5FF2D2, transparent:true, opacity:0.95, depthTest:false });

[
  matVastago, matTiPoroso, matTiPulido, matCoCrPulido, matCeramica, matInserto, matCorona, matInjerto,
  matTendon, matDisco, matRanura, matSutura, matEsmalteNat, matRaiz, matEnciaTr, matHuesoTr,
  matFantasma, matHuesoQuir, matFlechaCarga, matFlechaReaccion, ...Object.values(matsFamilia)
].forEach(m => { m.userData.compartido = true; });

// Flechas de carga por implante, en coordenadas de la caja del modelo (0..1 en cada eje): [desde, hacia, tipo]
const CARGAS = {
  cadera:        [[[0.5, 1.45, 0.5], [0.5, 1.0, 0.5], 'carga'], [[0.5, -0.45, 0.5], [0.5, 0.0, 0.5], 'reaccion']],
  rodilla:       [[[0.5, 1.45, 0.5], [0.5, 1.0, 0.5], 'carga'], [[0.5, -0.45, 0.5], [0.5, 0.0, 0.5], 'reaccion']],
  columna:       [[[0.5, 1.45, 0.5], [0.5, 1.0, 0.5], 'carga'], [[0.5, -0.45, 0.5], [0.5, 0.0, 0.5], 'reaccion']],
  dental:        [[[0.3, 1.6, 0.5], [0.3, 1.0, 0.5], 'carga'], [[0.0, 1.3, 0.9], [0.22, 0.95, 0.6], 'carga']],
  osteosintesis: [[[-0.35, 0.6, 0.5], [0.02, 0.6, 0.5], 'carga'], [[1.35, 0.6, 0.5], [0.98, 0.6, 0.5], 'carga']]
};
function flecha(desde, hacia, tipo){
  const g = new THREE.Group(), dir = hacia.clone().sub(desde), L = dir.length();
  const mat = tipo === 'reaccion' ? matFlechaReaccion : matFlechaCarga;
  const r = L * 0.045;
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L * 0.72, 16), mat); cuerpo.position.y = L * 0.36;
  const punta = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, L * 0.28, 24), mat); punta.position.y = L * 0.86;
  g.add(cuerpo, punta); g.renderOrder = 10; cuerpo.renderOrder = punta.renderOrder = 10;
  g.position.copy(desde); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  g.userData = { base:desde.clone(), dir, L };
  return g;
}

export function controlModelo(visor){
  const grupo = visor.scene.children.find(c => c.userData?.pieza);
  if(!grupo) return { separar(){}, modo(){}, separado:false };
  const { pieza, implanteId } = grupo.userData;
  const capas = [];
  pieza.traverse(o => { if(o.userData?.capa) capas.push(o); });
  const mallas = []; pieza.traverse(o => { if(o.isMesh) mallas.push(o); });
  const originales = new Map(mallas.map(m => [m, m.material]));
  pieza.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(pieza), centro = caja.getCenter(new THREE.Vector3()), tam = caja.getSize(new THREE.Vector3());
  const escala = Math.max(tam.x, tam.y, tam.z);
  // posición de despiece de cada capa (en coordenadas de su propio padre)
  const inv = new THREE.Matrix4().copy(pieza.matrixWorld).invert();
  const destinos = capas.map(c => {
    c.userData.basePos = c.position.clone();
    if(c.userData.despiece) return c.userData.despiece.clone();
    const cc = new THREE.Box3().setFromObject(c).getCenter(new THREE.Vector3());
    const d = cc.clone().sub(centro);
    const lejos = d.length();
    const v = lejos < 1e-4 ? new THREE.Vector3() : d.multiplyScalar(0.55).add(d.clone().normalize().multiplyScalar(escala * 0.07));
    return v.applyMatrix4(new THREE.Matrix4().extractRotation(inv));
  });
  let separado = false, actual = null, flechas = null;

  function separar(on){
    separado = on;
    pieza.userData.despiezado = on;
    capas.forEach((c, i) => {
      const base = c.userData.basePos, d = destinos[i];
      gsap.to(c.position, { x:base.x + (on ? d.x : 0), y:base.y + (on ? d.y : 0), z:base.z + (on ? d.z : 0),
        duration:on ? 1.1 : 0.9, delay:on ? i * 0.025 : 0, ease:'power3.inOut', overwrite:true });
    });
  }
  function ponerFlechas(){
    flechas = new THREE.Group();
    const local = p => new THREE.Vector3(caja.min.x + p[0] * tam.x, caja.min.y + p[1] * tam.y, caja.min.z + p[2] * tam.z).applyMatrix4(inv);
    (CARGAS[implanteId] || CARGAS.cadera).forEach(([a, b, tipo]) =>
      flechas.add(flecha(local(a), local(b), tipo)));
    pieza.add(flechas);
    flechas.children.forEach(f => f.scale.setScalar(0.001));
    flechas.children.forEach((f, i) => gsap.to(f.scale, { x:1, y:1, z:1, duration:0.6, delay:0.15 + i * 0.12, ease:'back.out(1.6)' }));
  }
  function quitarFlechas(){
    if(!flechas) return;
    flechas.traverse(o => { o.geometry?.dispose(); });
    pieza.remove(flechas); flechas = null;
  }
  function modo(clave){
    if(clave === actual) return;
    actual = clave;
    quitarFlechas();
    mallas.forEach(m => {
      const orig = originales.get(m), fam = FAMILIA_DE.get(orig);
      if(clave === 'biomateriales') m.material = fam ? matsFamilia[fam] : matFantasma;
      else if(clave === 'quirurgico') m.material = fam ? orig : matHuesoQuir;
      else m.material = orig;
    });
    if(clave === 'biomecanica') ponerFlechas();
    visor.controls.autoRotate = clave === 'historia';
    visor.controls.autoRotateSpeed = 0.6;
  }
  // latido de las flechas y balanceo suave del modelo flotando
  grupo.userData.extra = t => {
    pieza.position.y = Math.sin(t * 0.9) * escala * 0.012;
    flechas?.children.forEach((f, i) => {
      const k = (Math.sin(t * 3 - i) + 1) / 2;
      f.position.copy(f.userData.base).addScaledVector(f.userData.dir, -k * f.userData.L * 0.12);
    });
  };
  // familias presentes en este implante (para la leyenda de Biomateriales)
  const familias = [...new Set(mallas.map(m => FAMILIA_DE.get(originales.get(m))).filter(Boolean))];
  return { separar, modo, familias, get separado(){ return separado; } };
}

/* =========================================================
   Sala: mesa expositora semicircular con los 5 implantes flotando
   ========================================================= */
// Orden de izquierda a derecha: el dental (destacado) ocupa el centro
const MESA = [
  { id:'cadera', nombre:'Cadera', ang:-37, color:0x9FB4FF },
  { id:'rodilla', nombre:'Rodilla', ang:-18.5, color:0x7FB6FF },
  { id:'dental', nombre:'Dental', ang:0, color:0x5FF2D2, destacado:true },
  { id:'osteosintesis', nombre:'Osteosíntesis', ang:18.5, color:0xFFD98A },
  { id:'columna', nombre:'Columna', ang:37, color:0xD7C6FF }
];
const objetivos = [];      // volúmenes de clic (uno por implante y por copia de la sala en el pasillo)
const flotantes = [];      // grupos flotantes (para el resaltado)

let salaCompartida = null;
function obtenerSalaCompartida(compacto, R, arco, yMesa){
  if(salaCompartida && salaCompartida.compacto === compacto) return salaCompartida;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(235,255,250,.55)'); gr.addColorStop(.6, 'rgba(235,255,250,.18)'); gr.addColorStop(1, 'rgba(235,255,250,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tCharco = new THREE.CanvasTexture(c); tCharco.colorSpace = THREE.SRGBColorSpace;
  const altoHaz = 1.88 - (yMesa + 0.02);
  const conoGeo = new THREE.ConeGeometry(1.75, altoHaz, 48, 6, true);
  const pos = conoGeo.attributes.position, col = [];
  for(let k = 0; k < pos.count; k++){ const v = 0.35 + 0.65 * (pos.getY(k) / altoHaz + 0.5); col.push(v, v, v); }
  conoGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const sector = new THREE.Shape();
  sector.absarc(0, 0, R + 0.42, -Math.PI / 2 - arco, -Math.PI / 2 + arco, false);
  sector.absarc(0, 0, R - 0.42, -Math.PI / 2 + arco, -Math.PI / 2 - arco, true);
  const faldon = new THREE.Shape();
  faldon.absarc(0, 0, R + 0.3, -Math.PI / 2 - arco * 0.97, -Math.PI / 2 + arco * 0.97, false);
  faldon.absarc(0, 0, R - 0.3, -Math.PI / 2 + arco * 0.97, -Math.PI / 2 - arco * 0.97, true);
  salaCompartida = {
    compacto,
    altoHaz,
    lampMastGeo: new THREE.CylinderGeometry(0.04, 0.04, 1, 8),
    lampMastMat: std(0x9FCFC8, { metalness:.8 }),
    lampTorusGeo: new THREE.TorusGeometry(0.62, 0.08, 16, 48),
    lampTorusMat: std(0xB8E6DF, { metalness:.7, roughness:.25 }),
    lampGlowGeo: new THREE.CircleGeometry(0.56, 48),
    lampGlowMat: basicGlow(0xF4FFFC, 3),
    conoGeo,
    charcoGeo: new THREE.CircleGeometry(1.75, 48),
    charcoMat: new THREE.MeshBasicMaterial({ map:tCharco, transparent:true, opacity:0.55, depthWrite:false, blending:THREE.AdditiveBlending }),
    tableroGeo: extruirCentrado(sector, 0.08, { bevelThickness:0.02, bevelSize:0.02, bevelSegments:3, curveSegments:48 }),
    tableroMat: std(0xEEF5F4, { roughness:.35, metalness:.05 }),
    cantoGeo: new THREE.TorusGeometry(R - 0.43, 0.012, 6, 80, arco * 2),
    cantoMat: basicGlow(0x5FF2D2, 1.4),
    pieGeo: extruirCentrado(faldon, 1.7, { bevelThickness:0.01, bevelSize:0.01, bevelSegments:1, curveSegments:40 }),
    pieMat: std(0x5C8C88, { roughness:.6, metalness:.3 }),
    discGeo: new THREE.CircleGeometry(0.27, 40),
    aroGeo: new THREE.TorusGeometry(0.28, 0.012, 8, 56),
    hitGeo: new THREE.CylinderGeometry(0.34, 0.34, 0.86, 16),
    hitMat: new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false, colorWrite:false })
  };
  return salaCompartida;
}

export function construir(d, ctx){
  asegurarTexturas();
  ctx.sala(d, 0x6FB3A8); ctx.luz(d, 0xF2FFFC, 18);
  // mesa a la altura de la cintura del visitante: queda por debajo de la vista y se ve desde arriba
  const compacto = isMobile();
  const R = compacto ? 1.5 : 2.55, cz = compacto ? -2.0 : -1.0, arco = THREE.MathUtils.degToRad(47), yMesa = -0.82;
  const sc = obtenerSalaCompartida(compacto, R, arco, yMesa);
  // lámpara de quirófano sobre la mesa
  const lamp = new THREE.Group(); lamp.position.set(0, 1.9, -3.45); d.add(lamp);
  mesh(sc.lampMastGeo, sc.lampMastMat, 0, 0.55, 0, lamp);
  mesh(sc.lampTorusGeo, sc.lampTorusMat, 0, 0, 0, lamp).rotation.x = Math.PI / 2;
  mesh(sc.lampGlowGeo, sc.lampGlowMat, 0, -0.02, 0, lamp).rotation.x = Math.PI / 2;
  // haz: nace en la lámpara y muere justo sobre el tablero, sin atravesar la mesa;
  // se desvanece hacia abajo para que no marque un borde duro
  const haz = mesh(sc.conoGeo, new THREE.MeshBasicMaterial({ color:0xE9FFF8, vertexColors:true, transparent:true, opacity:0.06, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.FrontSide }), 0, yMesa + 0.02 + sc.altoHaz / 2, -3.45, d);
  haz.scale.z = 0.24;   // base ovalada: cabe en la franja del tablero (≈0,84 de fondo) en vez de colgar por delante
  // mancha de luz sobre el tablero, donde acaba el haz
  const charco = mesh(sc.charcoGeo, sc.charcoMat, 0, yMesa + 0.09, -3.45, d);
  charco.rotation.x = -Math.PI / 2; charco.scale.y = 0.24;

  // mesa curva (sector de corona) con canto luminoso y faldón
  const tablero = mesh(sc.tableroGeo, sc.tableroMat, 0, yMesa, cz, d);
  tablero.rotation.x = Math.PI / 2;
  const canto = mesh(sc.cantoGeo, sc.cantoMat, 0, yMesa + 0.05, cz, d);
  canto.rotation.set(Math.PI / 2, 0, -Math.PI / 2 - arco);   // el arco recorre el borde delantero de la mesa
  const pie = mesh(sc.pieGeo, sc.pieMat, 0, yMesa - 0.92, cz, d);
  pie.rotation.x = Math.PI / 2;

  // los 5 puestos
  const locales = [];
  MESA.forEach((m, k) => {
    const a = THREE.MathUtils.degToRad(m.ang) * (compacto ? 1.12 : 1);
    const x = Math.sin(a) * R, z = cz - Math.cos(a) * R;
    const puesto = new THREE.Group(); puesto.position.set(x, yMesa + 0.06, z); d.add(puesto);
    const matAro = basicGlow(m.color, 1.1);
    mesh(sc.discGeo, basicGlow(m.color, 0.35), 0, 0.001, 0, puesto).rotation.x = -Math.PI / 2;
    const aro = mesh(sc.aroGeo, matAro, 0, 0.006, 0, puesto); aro.rotation.x = Math.PI / 2;

    const flot = new THREE.Group(); flot.position.y = 0.42; puesto.add(flot);
    const modelo = new THREE.Group(); flot.add(modelo);
    const pieza = new THREE.Group(); modelo.add(pieza);
    const animModelo = instanciarModelo(m.id, pieza);
    // cada escena tiene su tamaño: se centra y se escala para que todas ocupen lo mismo sobre la mesa
    const caja = new THREE.Box3().setFromObject(pieza), tam = caja.getSize(new THREE.Vector3()), cen = caja.getCenter(new THREE.Vector3());
    pieza.position.sub(cen);
    const escala = (m.destacado ? 0.66 : 0.56) / Math.max(tam.x, tam.y, tam.z) * (compacto ? 0.8 : 1);
    modelo.scale.setScalar(escala);
    modelo.rotation.y = { columna:Math.PI - 0.7, rodilla:-0.9, osteosintesis:-0.5, dental:-0.2 }[m.id] ?? -0.3 - a * 0.6;
    // volumen de clic (invisible) algo mayor que el modelo para acertar con facilidad
    const hit = mesh(sc.hitGeo, sc.hitMat, 0, 0.33, 0, puesto);
    hit.userData.implanteId = m.id; hit.userData.nombre = m.nombre; hit.userData.ancla = flot;
    puesto.userData.implanteId = m.id;
    objetivos.push(hit);
    const reg = { id:m.id, flot, modelo, matAro, colorBase:matAro.color.clone(), base:escala, k, resaltado:false, f:0, anim:animModelo, rotBase:modelo.rotation.y };
    flotantes.push(reg); locales.push(reg);
  });

  ctx.anim((t) => {
    haz.material.opacity = 0.05 + Math.sin(t * 1.5) * 0.01;
    locales.forEach(o => {
      o.f += ((o.resaltado ? 1 : 0) - o.f) * 0.15;
      o.flot.position.y = 0.42 + Math.sin(t * 1.1 + o.k * 1.3) * 0.035 + o.f * 0.04;
      o.modelo.rotation.y = o.rotBase + Math.sin(t * 0.35 + o.k) * 0.5 + o.f * Math.sin(t * 1.2) * 0.3;   // balanceo suave para verlo en 3D
      o.anim?.(t);
      o.modelo.scale.setScalar(o.base * (1 + o.f * 0.12));
      o.matAro.color.copy(o.colorBase).multiplyScalar(1 + o.f * 1.4);   // el aro se enciende al pasar el ratón
    });
  });
}

// Lo que usa actividades.js para el clic 3D dentro de la sala
export const mesaInteractiva = {
  items: MESA.map(({ id, nombre }) => ({ id, nombre })),
  objetivos: () => objetivos,
  resaltar(id){ flotantes.forEach(o => { o.resaltado = o.id === id; }); }
};

/* =========================================================
   Ficha de estudio de cada implante (se abre en el visor común)
   Cabecera + PDF · mini-visor 3D + selector · pestañas: Historia, Biomateriales, Biomecánica, Quirúrgico
   ========================================================= */
const nf = (x, dec = 0) => Number(x).toLocaleString('es-ES', { minimumFractionDigits:dec, maximumFractionDigits:dec });

// Familia de material de cada pieza (color de su etiqueta): recubrimiento, cerámica, polímero o metal
function familiaMaterial(txt = ''){
  const t = txt.toLowerCase();
  if(/hidroxiapatita|\bha\b|recubr|poros|trabecular|plasma/.test(t)) return ['recubrimiento', 'Recubrimiento'];
  if(/cer[aá]mic|al[uú]mina|circona|zro|al₂o₃|zirconia|disilicato/.test(t)) return ['ceramica', 'Cerámica'];
  if(/uhmwpe|peek|pmma|pla\b|plga|pol[ií]mer|pcu|polietileno|reabsorb|biodegrad/.test(t)) return ['polimero', 'Polímero'];
  return ['metal', 'Metal'];
}

// Color de "mapa de tensiones" para x en 0..1 (verde → ámbar → rojo)
function calor(x){
  const k = Math.max(0, Math.min(1, x));
  const a = [95, 242, 210], b = [255, 217, 138], c = [255, 122, 138];
  const [p, q, u] = k < 0.5 ? [a, b, k * 2] : [b, c, (k - 0.5) * 2];
  return `rgb(${p.map((v, i) => Math.round(v + (q[i] - v) * u)).join(',')})`;
}

/* ---- Calculadoras biomecánicas (valores orientativos de ingeniería) ----
   Cada una recibe los valores de los controles y devuelve { kpis:[{et, val, ud, nota, estado}], alerta:{nivel, texto}, dcl } */
const CALCULOS = {
  cadera(v){
    const m = +v.masa, d = +v.offset, E = +v.E_vastago;
    const R = 3.5 * m * 9.81, M = R * d / 1000;
    const D = 16, A = Math.PI * D * D / 4, I = Math.PI * D ** 4 / 64;          // sección del vástago supuesta: círculo de 16 mm
    const sigma = R / A + (R * d) * (D / 2) / I;
    const ratio = E / 18;
    return {
      kpis:[
        { et:'Fuerza articular R', val:nf(R), ud:'N', nota:'3,5 × peso corporal' },
        { et:'Momento flector M', val:nf(M, 1), ud:'N·m', nota:'M = R · d' },
        { et:'σ máx. en el vástago', val:nf(sigma), ud:'MPa', nota:'Sección Ø 16 mm sin apoyo óseo', estado:sigma > 350 ? 'aviso' : 'ok' },
        { et:'Rigidez frente a la cortical', val:'×' + nf(ratio, 1), ud:'', nota:`E = ${E} GPa / 18 GPa`, estado:ratio > 10 ? 'peligro' : 'aviso' }
      ],
      alerta: ratio > 10
        ? { nivel:'peligro', texto:'Stress shielding alto: el vástago de Co-Cr es 12,2 veces más rígido que la cortical, absorbe la carga y el calcar se reabsorbe (ley de Wolff).' }
        : { nivel:'aviso', texto:'El Ti-6Al-4V reduce el apantallamiento a la mitad, pero sigue siendo unas 6 veces más rígido que la cortical.' },
      dcl:{ R, M, d, sigma, ratio }
    };
  },
  rodilla(v){
    const m = +v.masa, gesto = +v.gesto, t = +v.espesor;
    const F = gesto * m * 9.81, Fc = F / 2;
    const Eest = 1270, Rrel = 200;                                     // UHMWPE (E ≈ 1 GPa, ν ≈ 0,46) sobre metal; conformidad R_rel ≈ 200 mm
    const a = Math.cbrt(3 * Fc * Rrel / (4 * Eest));
    const p0 = 1.5 * Fc / (Math.PI * a * a);
    const p = p0 * Math.pow(10 / t, 0.6);                              // un inserto delgado concentra la presión
    const tau = 0.31 * p, z = 0.48 * a;
    const nivel = p > 22 ? 'peligro' : p > 17 ? 'aviso' : 'ok';
    return {
      kpis:[
        { et:'Fuerza pico F', val:nf(F), ud:'N', nota:`${nf(gesto, 1)} × peso corporal` },
        { et:'Radio de contacto a', val:nf(a, 1), ud:'mm', nota:'Por cóndilo (F/2)' },
        { et:'Presión de contacto p', val:nf(p, 1), ud:'MPa', nota:'Hertz, corregida por espesor', estado:nivel },
        { et:'τ máx. subsuperficial', val:nf(tau, 1), ud:'MPa', nota:`A unos ${nf(z, 1)} mm de profundidad`, estado:nivel === 'peligro' ? 'aviso' : 'ok' }
      ],
      alerta: nivel === 'peligro'
        ? { nivel, texto:'Supera el límite elástico del UHMWPE (≈ 22 MPa): deformación plástica y riesgo de delaminación por fatiga bajo la superficie.' }
        : nivel === 'aviso'
          ? { nivel, texto:'Cerca del límite del UHMWPE (≈ 22 MPa). Un inserto más grueso o una actividad menos exigente aleja el riesgo.' }
          : { nivel, texto:'Presión por debajo del límite del UHMWPE: el inserto trabaja en régimen elástico.' },
      dcl:{ F, a, p, t, z }
    };
  },
  osteosintesis(v){
    const placa = v.dispositivo === 'placa', hueco = v.defecto === 'hueco', fase = +v.fase;
    const F = 700;                                                     // apoyo parcial de un adulto (N)
    const d = placa ? 18 : 3, k = hueco ? 1 : 0.4;
    const Ec = { 1:0.01, 2:0.5, 3:8 }[fase] || 0.01, Ac = hueco ? 250 : 450;
    const Ei = 110, Ai = placa ? 63 : 67;                              // placa 14 × 4,5 mm · clavo tubular Ø 11/6 mm (Ti-6Al-4V)
    const parteHueso = (Ec * Ac) / (Ec * Ac + Ei * Ai);
    const Fi = F * (1 - parteHueso), M = Fi * d * k;
    const I = placa ? 14 * 4.5 ** 3 / 12 : Math.PI * (11 ** 4 - 6 ** 4) / 64, y = placa ? 2.25 : 5.5;
    const sigma = M * y / I + Fi / Ai;
    const nivel = sigma > 200 ? 'peligro' : sigma > 100 ? 'aviso' : 'ok';
    return {
      kpis:[
        { et:'Brazo excéntrico d', val:nf(d), ud:'mm', nota:placa ? 'Placa lateral' : 'Clavo centrado' },
        { et:'Momento en el implante', val:nf(M), ud:'N·mm', nota:hueco ? 'Conminución: flexión ×2,5' : 'Cortical opuesta apoyada' },
        { et:'σ en el implante', val:nf(sigma), ud:'MPa', nota:'Ti-6Al-4V: fatiga ≈ 500 MPa', estado:nivel },
        { et:'Carga que asume el hueso', val:nf(parteHueso * 100, parteHueso < 0.01 ? 2 : 0), ud:'%', nota:`E callo ≈ ${nf(Ec, Ec < 1 ? 2 : 0)} GPa`, estado:fase === 3 ? 'ok' : 'aviso' }
      ],
      alerta: placa && hueco
        ? { nivel:'peligro', texto:'Sin apoyo de la cortical opuesta la placa trabaja sola a flexión: cada paso es un ciclo de fatiga y puede romperse antes de que consolide.' }
        : fase === 3
          ? { nivel:'ok', texto:'El callo mineral ya comparte la carga: es el momento de dinamizar (o retirar) para que el hueso se remodele.' }
          : { nivel:'aviso', texto:'Mientras el callo es blando, casi toda la carga pasa por el implante. ' + (placa ? 'El clavo centrado reduce el brazo de palanca a una sexta parte.' : 'El clavo centrado minimiza el brazo de palanca.') },
      dcl:{ placa, hueco, fase, sigma, parteHueso }
    };
  },
  dental(v){
    const F = +v.fuerza, th = +v.angulo, h = +v.altura;
    const rad = th * Math.PI / 180, Fa = F * Math.cos(rad), Fl = F * Math.sin(rad), M = Fl * h;
    const D = 4, A = Math.PI * D * D / 4, I = Math.PI * D ** 4 / 64;
    const sigma = Fa / A + M * (D / 2) / I, s0 = F / A, ratio = sigma / s0;
    const nivel = ratio > 8 ? 'peligro' : ratio > 4 ? 'aviso' : 'ok';
    return {
      kpis:[
        { et:'Componente axial', val:nf(Fa), ud:'N', nota:'F · cos θ' },
        { et:'Componente lateral', val:nf(Fl), ud:'N', nota:'F · sen θ' },
        { et:'Momento en la cresta', val:nf(M), ud:'N·mm', nota:'M = F lateral · h' },
        { et:'σ crestal', val:nf(sigma), ud:'MPa', nota:`×${nf(ratio, 1)} respecto a la carga axial pura`, estado:nivel }
      ],
      alerta: nivel === 'ok'
        ? { nivel, texto:'Carga casi axial: la tensión se reparte a lo largo de las roscas y protege el hueso crestal.' }
        : { nivel, texto:'La componente lateral y la altura de la corona multiplican la tensión en la cresta: riesgo de reabsorción ósea marginal alrededor del cuello.' },
      dcl:{ th, h, ratio, Fa, Fl }
    };
  },
  columna(v){
    const ti = v.material === 'ti', adm = +v.hueso, F = +v.carga;
    const A = 400, kConc = ti ? 1.4 : 1;                                // huella lumbar estándar (350–450 mm²)
    const sMed = F / A, sPico = sMed * kConc, FS = adm / sPico;
    const nivel = FS < 1 ? 'peligro' : FS < 1.5 ? 'aviso' : 'ok';
    return {
      kpis:[
        { et:'Área de huella A', val:nf(A), ud:'mm²', nota:'Caja lumbar estándar (350–450)' },
        { et:'σ media en el platillo', val:nf(sMed, 2), ud:'MPa', nota:'σ = F / A' },
        { et:'σ pico', val:nf(sPico, 2), ud:'MPa', nota:ti ? 'Ti rígido: picos en el borde ×1,4' : 'PEEK: reparto uniforme', estado:nivel },
        { et:'Factor de seguridad', val:nf(FS, 2), ud:'', nota:`σ admisible ≈ ${adm} MPa`, estado:nivel }
      ],
      alerta: nivel === 'peligro'
        ? { nivel, texto:'Riesgo de subsidencia: la tensión supera lo que aguanta el hueso esponjoso y la caja se hunde en el platillo vertebral.' }
        : nivel === 'aviso'
          ? { nivel, texto:'Margen justo frente a la subsidencia. Una caja de mayor huella o de PEEK reparte mejor la carga.' }
          : { nivel, texto:'El platillo soporta la carga con margen: la caja no debería hundirse.' },
      dcl:{ ti, sPico, adm, FS }
    };
  }
};

/* ---- Diagramas de cuerpo libre (SVG 320 × 240) ---- */
const FLECHAS = `<defs>
  <marker id="dclF" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#F1EEFF"/></marker>
  <marker id="dclC" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#9FB4FF"/></marker>
</defs>`;
const svgDCL = (cuerpo, titulo) => `<svg class="imp-dcl-svg" viewBox="0 0 320 240" role="img" aria-label="${esc(titulo)}">${FLECHAS}${cuerpo}</svg>`;
const etq = (x, y, t, anchor = 'start', clase = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${clase}">${t}</text>`;

const DIBUJOS = {
  cadera({ R, M, d, sigma, ratio }){
    const ax = 205, hx = ax - d * 2.1, hy = 62, L = 30 + Math.min(1, R / 4000) * 45, a = 16 * Math.PI / 180;
    return svgDCL(`
      <path d="M${ax - 14} 92 L${ax + 14} 92 L${ax + 9} 212 L${ax - 4} 222 L${ax - 9} 212 Z" class="dcl-solido"/>
      <path d="M${ax - 10} 96 L${ax - 10} 150" stroke="${calor(ratio / 12.2)}" stroke-width="6" stroke-linecap="round"/>
      <path d="M${ax + 13} 100 L${ax + 10} 190" stroke="${calor(sigma / 450)}" stroke-width="6" stroke-linecap="round"/>
      <line x1="${ax - 6}" y1="98" x2="${hx}" y2="${hy}" class="dcl-linea" stroke-width="9" stroke-linecap="round"/>
      <circle cx="${hx}" cy="${hy}" r="17" class="dcl-solido"/>
      <line x1="${hx - Math.sin(a) * L}" y1="${hy - 17 - Math.cos(a) * L}" x2="${hx - Math.sin(a) * 4}" y2="${hy - 19}" class="dcl-fuerza" marker-end="url(#dclF)"/>
      ${etq(hx + 14, Math.max(14, hy - 24), `R = ${nf(R)} N`, 'start', 'dcl-et fuerte')}
      <line x1="${hx}" y1="200" x2="${ax}" y2="200" class="dcl-cota" marker-start="url(#dclC)" marker-end="url(#dclC)"/>
      <line x1="${hx}" y1="${hy + 18}" x2="${hx}" y2="206" class="dcl-guia"/>
      ${etq((hx + ax) / 2, 194, `d = ${d} mm`, 'middle', 'dcl-et')}
      <path d="M${ax + 30} 132 A 22 22 0 1 1 ${ax + 30} 168" class="dcl-momento" marker-end="url(#dclF)"/>
      ${etq(ax + 20, 202, `M = ${nf(M, 1)} N·m`, 'start', 'dcl-et fuerte')}
      ${etq(ax + 22, 118, 'Tracción lateral', 'start', 'dcl-et')}
      ${etq(ax - 20, 120, 'Calcar', 'end', 'dcl-et')}
      <line x1="${ax}" y1="234" x2="${ax}" y2="226" class="dcl-fuerza" marker-end="url(#dclF)"/>`, 'Diagrama de cuerpo libre de la prótesis de cadera');
  },
  rodilla({ F, a, p, t, z }){
    const yI = 120, hI = t * 4.2, w = Math.max(10, a * 4.4);
    const c = calor((p - 10) / 14);
    return svgDCL(`
      <path d="M60 40 L60 80 A 48 48 0 0 0 156 80 L156 40 M164 40 L164 80 A 48 48 0 0 0 260 80 L260 40" class="dcl-solido" fill="none" stroke-width="10"/>
      <rect x="54" y="${yI}" width="212" height="${hI}" rx="6" class="dcl-polimero"/>
      <rect x="62" y="${yI + hI}" width="196" height="8" rx="2" class="dcl-metal"/>
      <path d="M150 ${yI + hI + 8} L170 ${yI + hI + 8} L164 ${yI + hI + 58} L156 ${yI + hI + 58} Z" class="dcl-metal"/>
      ${[108, 212].map(x => `
        <line x1="${x}" y1="14" x2="${x}" y2="38" class="dcl-fuerza" marker-end="url(#dclF)"/>
        <ellipse cx="${x}" cy="${yI + 2}" rx="${w}" ry="4" fill="${c}"/>
        <circle cx="${x}" cy="${yI + Math.min(hI - 4, z * 4.2)}" r="3.5" fill="${c}"/>`).join('')}
      ${etq(160, 9, `F/2 = ${nf(F / 2)} N por cóndilo`, 'middle', 'dcl-et fuerte')}
      ${etq(274, yI + hI / 2 + 4, `t = ${t} mm`, 'start', 'dcl-et')}
      ${etq(160, yI + hI / 2 + 4, `p = ${nf(p, 1)} MPa`, 'middle', 'dcl-et fuerte')}
      ${etq(8, 232, 'Punto: τ máx. subsuperficial', 'start', 'dcl-et')}`, 'Diagrama de cuerpo libre de la prótesis de rodilla');
  },
  osteosintesis({ placa, hueco, fase, sigma, parteHueso }){
    const cx = 150, colHueco = { 1:'#B8394E', 2:'#F2A7B4', 3:'#E6D7B8' }[fase];
    const ximp = placa ? 196 : cx, d = placa ? 46 : 8;
    return svgDCL(`
      <rect x="${cx - 32}" y="28" width="16" height="${hueco ? 84 : 86}" class="dcl-hueso"/><rect x="${cx + 16}" y="28" width="16" height="86" class="dcl-hueso"/>
      <rect x="${cx - 32}" y="${hueco ? 132 : 126}" width="16" height="${hueco ? 80 : 86}" class="dcl-hueso"/><rect x="${cx + 16}" y="126" width="16" height="86" class="dcl-hueso"/>
      <rect x="${cx - 32}" y="${hueco ? 112 : 114}" width="64" height="${hueco ? 20 : 12}" fill="${colHueco}" opacity=".85"/>
      ${hueco ? `<path d="M${cx - 34} 112 l8 6 -6 5 9 9" class="dcl-guia"/>` : ''}
      ${placa
        ? `<rect x="${ximp - 4}" y="40" width="9" height="160" rx="3" fill="${calor(sigma / 300)}"/>${[56, 80, 104, 140, 164, 188].map(y => `<line x1="${ximp + 6}" y1="${y}" x2="${cx + 18}" y2="${y}" class="dcl-tornillo"/>`).join('')}`
        : `<rect x="${cx - 6}" y="22" width="12" height="196" rx="5" fill="${calor(sigma / 300)}"/>`}
      <line x1="${cx}" y1="2" x2="${cx}" y2="24" class="dcl-fuerza" marker-end="url(#dclF)"/>
      <line x1="${cx}" y1="238" x2="${cx}" y2="216" class="dcl-fuerza" marker-end="url(#dclF)"/>
      ${etq(cx - 8, 14, 'F = 700 N', 'end', 'dcl-et fuerte')}
      ${placa ? `<line x1="${cx}" y1="230" x2="${ximp}" y2="230" class="dcl-cota" marker-start="url(#dclC)" marker-end="url(#dclC)"/>${etq((cx + ximp) / 2, 226, 'd ≈ 18 mm', 'middle', 'dcl-et')}` : etq(cx + 12, 232, 'd ≈ 3 mm', 'start', 'dcl-et')}
      <path d="M${cx - 60} 104 A 18 18 0 1 0 ${cx - 60} 136" class="dcl-momento" marker-end="url(#dclF)"/>
      ${etq(cx - 82, 124, 'M', 'end', 'dcl-et fuerte')}
      <rect x="252" y="40" width="16" height="160" rx="4" class="dcl-barra"/>
      <rect x="252" y="${40 + 160 * (1 - parteHueso)}" width="16" height="${Math.max(1.5, 160 * parteHueso)}" rx="4" fill="#E6D7B8"/>
      ${etq(260, 32, 'Hueso', 'middle', 'dcl-et')}
      ${etq(260, 214, `${nf(parteHueso * 100, parteHueso < 0.01 ? 2 : 0)} %`, 'middle', 'dcl-et fuerte')}`, 'Diagrama de cuerpo libre de la osteosíntesis');
  },
  dental({ th, h, ratio, Fa, Fl }){
    const yC = 130, hp = h * 6.2, rad = th * Math.PI / 180;
    const xT = 160, yT = yC - hp, c = calor((ratio - 1) / 8), L = Math.min(70, (yT - 16) / Math.max(0.5, Math.cos(rad)));
    const x0 = xT + Math.sin(rad) * L, y0 = yT - Math.cos(rad) * L;
    return svgDCL(`
      <rect x="40" y="${yC}" width="240" height="100" rx="10" class="dcl-hueso"/>
      <rect x="146" y="${yC - 4}" width="28" height="86" rx="6" class="dcl-metal"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<line x1="146" y1="${yC + 10 + i * 12}" x2="174" y2="${yC + 16 + i * 12}" class="dcl-rosca"/>`).join('')}
      <path d="M150 ${yC - 4} L152 ${yC - hp * 0.55} L168 ${yC - hp * 0.55} L170 ${yC - 4} Z" class="dcl-metal"/>
      <path d="M134 ${yC - hp * 0.5} Q160 ${yC - hp * 0.62} 186 ${yC - hp * 0.5} L190 ${yT + 6} Q160 ${yT - 6} 130 ${yT + 6} Z" class="dcl-corona"/>
      <path d="M122 ${yC} L146 ${yC} L146 ${yC + 22} Z" fill="${c}"/><path d="M198 ${yC} L174 ${yC} L174 ${yC + 22} Z" fill="${c}"/>
      <line x1="${x0}" y1="${y0}" x2="${xT}" y2="${yT}" class="dcl-fuerza" marker-end="url(#dclF)"/>
      ${th > 0 ? `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 + Math.cos(rad) * L * 0.8}" class="dcl-comp" marker-end="url(#dclC)"/>
      <line x1="${x0}" y1="${y0}" x2="${x0 - Math.sin(rad) * L * 0.9}" y2="${y0}" class="dcl-comp" marker-end="url(#dclC)"/>` : ''}
      ${etq(x0 + 8, y0 - 4, `F · θ = ${th}°`, 'start', 'dcl-et fuerte')}
      <line x1="232" y1="${yT}" x2="232" y2="${yC}" class="dcl-cota" marker-start="url(#dclC)" marker-end="url(#dclC)"/>
      ${etq(238, (yT + yC) / 2 + 4, `h = ${h} mm`, 'start', 'dcl-et')}
      <path d="M110 ${yC + 26} A 16 16 0 1 1 ${110} ${yC + 58}" class="dcl-momento" marker-end="url(#dclF)"/>
      ${etq(88, yC + 46, 'M', 'end', 'dcl-et fuerte')}
      ${etq(160, 228, 'Triángulos: tensión en la cresta ósea', 'middle', 'dcl-et')}`, 'Diagrama de cuerpo libre del implante dental');
  },
  columna({ ti, sPico, adm, FS }){
    const riesgo = FS < 1, baj = riesgo ? 7 : 0, c = calor(sPico / adm * 0.75);
    const barras = Array.from({ length:11 }, (_, i) => {
      const u = i / 10, borde = ti ? 0.45 + 0.9 * Math.pow(Math.abs(u - 0.5) * 2, 3) : 1;
      const hgt = Math.min(34, 6 + sPico * borde * 5);
      return `<rect x="${102 + i * 11.6}" y="${154 + baj}" width="7" height="${hgt}" fill="${c}" rx="2"/>`;
    }).join('');
    return svgDCL(`
      <rect x="84" y="34" width="152" height="72" rx="12" class="dcl-hueso"/>
      <rect x="84" y="${150}" width="152" height="72" rx="12" class="dcl-hueso"/>
      <rect x="104" y="${106 + baj}" width="112" height="${44}" rx="8" class="${ti ? 'dcl-metal' : 'dcl-polimero'}"/>
      <rect x="146" y="${116 + baj}" width="28" height="24" rx="5" class="dcl-injerto"/>
      ${riesgo ? `<rect x="104" y="106" width="112" height="44" rx="8" class="dcl-guia" fill="none"/>${etq(160, 244 - 6, 'Subsidencia: la caja se hunde', 'middle', 'dcl-et alerta')}` : ''}
      ${barras}
      <line x1="160" y1="2" x2="160" y2="30" class="dcl-fuerza" marker-end="url(#dclF)"/>
      ${etq(168, 16, `F → σ pico = ${nf(sPico, 2)} MPa`, 'start', 'dcl-et fuerte')}
      <line x1="270" y1="40" x2="270" y2="216" class="dcl-varilla"/>
      ${[70, 186].map(y => `<line x1="236" y1="${y}" x2="270" y2="${y}" class="dcl-tornillo"/>`).join('')}
      ${etq(276, 128, 'Barra', 'start', 'dcl-et')}
      ${etq(60, 196, `σ adm ${adm}`, 'end', 'dcl-et')}`, 'Diagrama de cuerpo libre de la columna con caja intersomática');
  }
};

// ---- Apartados de estudio de cada implante ----
// Orden fijo de la ficha. "esqueleto" es lo que se enseña mientras el apartado está vacío (guía de lo que irá).
const APARTADOS = [
  { clave:'historia', titulo:'Historia',
    esqueleto:['Introducción: el problema clínico que resolvió', 'Cronología de hitos (fecha, autor, avance)', 'Contexto y lecciones de los fracasos', 'Ideas clave y preguntas de repaso'] },
  { clave:'biomateriales', titulo:'Biomateriales',
    esqueleto:['Introducción: por qué esta combinación de materiales', 'Tarjetas por pieza (metal, cerámica, polímero, recubrimiento)', 'Tabla de propiedades (E, resistencia, densidad…)', 'Ideas clave y preguntas de repaso'] },
  { clave:'biomecanica', titulo:'Biomecánica',
    esqueleto:['Introducción: cargas que soporta el implante', 'Ecuaciones con sus variables y unidades', 'Calculadora interactiva con diagrama de cuerpo libre', 'Ideas clave y preguntas de repaso'] },
  { clave:'quirurgico', titulo:'Quirúrgico',
    esqueleto:['Introducción: indicaciones y abordaje', 'Pasos de la técnica quirúrgica', 'Robótica y navegación', 'Complicaciones, ideas clave y preguntas'] }
];
const PESTANAS = APARTADOS.map(a => a.titulo);

// Texto con formato mínimo: **negrita**, *cursiva*, x_{sub} y x^{sup}. Todo lo demás se escapa.
function fmt(t){
  return esc(t ?? '')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/_\{(.+?)\}/g, '<sub>$1</sub>')
    .replace(/\^\{(.+?)\}/g, '<sup>$1</sup>');
}
const FAMILIAS = { metal:'Metal', ceramica:'Cerámica', polimero:'Polímero', recubrimiento:'Recubrimiento', hueso:'Tejido' };

// Un bloque de contenido. Tipos: texto, lista, cronologia, tarjetas, tabla, ecuacion, destacado, imagen, calculadora
function bloqueHTML(b, uid){
  const tit = b.titulo ? `<h5 class="imp-bl-titulo">${fmt(b.titulo)}</h5>` : '';
  switch(b.tipo){
    case 'texto':
      return `<section class="imp-bl imp-bl-texto">${tit}${(b.parrafos || []).map(p => `<p>${fmt(p)}</p>`).join('')}</section>`;
    case 'lista': {
      const tag = b.ordenada ? 'ol' : 'ul';
      return `<section class="imp-bl imp-bl-lista">${tit}<${tag} class="${b.ordenada ? 'imp-pasos' : ''}">${(b.items || []).map(i => `<li>${fmt(i)}</li>`).join('')}</${tag}></section>`;
    }
    case 'cronologia':
      return `<section class="imp-bl">${tit}<ol class="imp-crono">${(b.hitos || []).map(h => `
        <li><span class="fecha">${fmt(h.fecha)}</span><b>${fmt(h.titulo)}</b>${h.texto ? `<p>${fmt(h.texto)}</p>` : ''}</li>`).join('')}</ol></section>`;
    case 'tarjetas':
      return `<section class="imp-bl">${tit}<div class="imp-piezas">${(b.tarjetas || []).map(t => {
        const fam = FAMILIAS[t.familia] ? t.familia : (t.material ? familiaMaterial(t.material)[0] : '');
        return `<article class="imp-pieza ${fam ? 'fam-' + fam : 'fam-neutra'}">
          ${t.etiqueta || FAMILIAS[fam] ? `<span class="fam">${fmt(t.etiqueta || FAMILIAS[fam])}</span>` : ''}
          <h5>${fmt(t.titulo)}</h5>${t.material ? `<p class="mat">${fmt(t.material)}</p>` : ''}${t.texto ? `<p>${fmt(t.texto)}</p>` : ''}</article>`; }).join('')}</div></section>`;
    case 'tabla':
      return `<section class="imp-bl">${tit}<div class="imp-tabla-caja"><table class="imp-tabla">
        <thead><tr>${(b.columnas || []).map(c => `<th scope="col">${fmt(c)}</th>`).join('')}</tr></thead>
        <tbody>${(b.filas || []).map(f => `<tr>${f.map((c, i) => i ? `<td>${fmt(c)}</td>` : `<th scope="row">${fmt(c)}</th>`).join('')}</tr>`).join('')}</tbody>
      </table></div>${b.nota ? `<p class="imp-nota">${fmt(b.nota)}</p>` : ''}</section>`;
    case 'ecuacion':
      return `<section class="imp-bl">${tit}<p class="imp-ecuacion">${fmt(b.formula)}</p>
        ${b.variables?.length ? `<dl class="imp-vars">${b.variables.map(v => `<div><dt>${fmt(v.simbolo)}</dt><dd>${fmt(v.significado)}${v.unidad ? ` <span>[${fmt(v.unidad)}]</span>` : ''}</dd></div>`).join('')}</dl>` : ''}
        ${b.explicacion ? `<p>${fmt(b.explicacion)}</p>` : ''}</section>`;
    case 'destacado':
      return `<aside class="imp-bl imp-destacado ${b.nivel || ''}">${tit}<p>${fmt(b.texto)}</p></aside>`;
    case 'imagen':
      return `<figure class="imp-bl imp-figura"><img src="${esc(b.src)}" alt="${esc(b.alt || b.pie || '')}" loading="lazy">${b.pie ? `<figcaption>${fmt(b.pie)}</figcaption>` : ''}</figure>`;
    case 'calculadora': {
      const ok = CALCULOS[b.calculo] && DIBUJOS[b.calculo];
      if(!ok) return `<p class="imp-nota">Calculadora «${esc(b.calculo)}» no disponible.</p>`;
      return `<section class="imp-bl" data-calculo="${esc(b.calculo)}" data-uid="${uid}">${tit}
        <div class="imp-lab">
          <figure class="imp-dcl"><div class="imp-dcl-lienzo"></div><figcaption>Diagrama de cuerpo libre: los colores marcan las zonas críticas</figcaption></figure>
          <div class="imp-calc">
            <div class="imp-ctls">${(b.controles || []).map(controlHTML).join('')}</div>
            <div class="imp-kpis" aria-live="polite"></div>
            <p class="imp-alerta" aria-live="polite"></p>
          </div>
        </div>
        <p class="imp-nota">Valores orientativos con geometrías simplificadas: sirven para comparar tendencias, no para dimensionar un implante real.</p></section>`;
    }
    default:
      return '';
  }
}
function montarCalculadora(caja){
  const f = CALCULOS[caja.dataset.calculo], dib = DIBUJOS[caja.dataset.calculo];
  const recalcular = () => {
    const v = {};
    caja.querySelectorAll('[data-id]').forEach(el => {
      v[el.dataset.id] = el.value;
      const out = el.closest('.imp-ctl')?.querySelector('output'); if(out) out.textContent = nf(el.value);
    });
    const res = f(v);
    caja.querySelector('.imp-dcl-lienzo').innerHTML = dib(res.dcl);
    caja.querySelector('.imp-kpis').innerHTML = res.kpis.map(k => `
      <div class="imp-kpi ${k.estado || ''}"><span>${esc(k.et)}</span><b>${esc(k.val)}<small>${esc(k.ud)}</small></b><em>${esc(k.nota)}</em></div>`).join('');
    const al = caja.querySelector('.imp-alerta');
    al.className = `imp-alerta ${res.alerta.nivel}`; al.textContent = res.alerta.texto;
  };
  caja.querySelectorAll('[data-id]').forEach(el => el.addEventListener('input', recalcular));
  recalcular();
}

// Controles de la calculadora (deslizadores o selectores, según el JSON)
function controlHTML(c){
  if(Array.isArray(c.opciones)){
    return `<label class="imp-ctl"><span>${esc(c.label)}</span>
      <select data-id="${esc(c.id)}">${c.opciones.map((o, i) => `<option value="${esc(o.val)}"${i === 0 ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>`;
  }
  return `<label class="imp-ctl"><span>${esc(c.label)} <output>${nf(c.valor)}</output></span>
    <input type="range" data-id="${esc(c.id)}" min="${c.min}" max="${c.max}" step="${c.step || 1}" value="${c.valor}"></label>`;
}

function fichaImplante(contenedor, { datos, vitrina, implanteId }){
  const lista = datos?.implantes || [];
  if(!lista.length) return sinDatos(contenedor, 'implantes');
  let imp = lista.find(i => i.id === implanteId) || lista[0], pestana = 0, visor3d = null;
  const titulo = document.getElementById('visorTitulo');
  const r = raiz(contenedor, 'imp');

  // Como la portada: a la derecha el implante flotando (se gira, se despieza y reacciona al apartado);
  // a la izquierda el nombre en grande y los 4 apartados. Al abrir uno, su contenido aparece a la izquierda.
  r.innerHTML = `
    <div class="imp-hero">
      <div class="imp-escena"><div class="imp-3d-lienzo"></div><img class="imp-captura" alt="" hidden>
        <div class="imp-escena-ui">
          <button class="imp-separar" type="button" aria-pressed="false">Separar piezas</button>
          <span class="imp-pista">Arrastra para girar · rueda para acercar</span>
        </div>
        <div class="imp-leyenda" hidden></div>
      </div>
      <div class="imp-lado">
        <div class="imp-cab">
          <span class="imp-etq"></span>
          <h3 class="imp-nombre"></h3>
          <p class="imp-sub"></p>
          <p class="imp-resumen"></p>
        </div>
        <div class="imp-tabs" role="tablist" aria-label="Apartados del implante">
          ${PESTANAS.map((p, k) => `<button role="tab" id="impTab${k}" aria-controls="impPanel${k}" data-k="${k}"><span class="num">${k + 1}</span><span class="txt">${p}</span></button>`).join('')}
        </div>
        <div class="imp-pdf"></div>
        <div class="imp-secciones" hidden>
          ${PESTANAS.map((p, k) => `<section class="imp-panel" role="tabpanel" id="impPanel${k}" aria-labelledby="impTab${k}" tabindex="0" hidden></section>`).join('')}
        </div>
      </div>
    </div>`;

  const tabs = [...r.querySelectorAll('[role="tab"]')], paneles = [...r.querySelectorAll('[role="tabpanel"]')];
  const secciones = r.querySelector('.imp-secciones'), lado = r.querySelector('.imp-lado');
  const btnSeparar = r.querySelector('.imp-separar'), leyenda = r.querySelector('.imp-leyenda');
  visor3d = montarVisor3D(r.querySelector('.imp-3d-lienzo'), escenaImplante3D(imp.id), { camPos:[0.3, 0.5, 3.4], transparente:true });
  const modelo = controlModelo(visor3d);
  pestana = -1;   // -1 = índice (nombre grande y los 4 apartados)

  const NOMBRE_FAM = { metal:'Metal', ceramica:'Cerámica', polimero:'Polímero', recubrimiento:'Recubrimiento bioactivo' };
  leyenda.innerHTML = modelo.familias.map(f => `<span style="--f:#${COLOR_FAMILIA[f].toString(16).padStart(6, '0')}">${NOMBRE_FAM[f]}</span>`).join('')
    + '<span class="tejido">Tejido (translúcido)</span>';

  function elegirPestana(k, foco = false){
    pestana = k;
    const indice = k < 0;
    tabs.forEach((t, j) => { const on = j === k; t.setAttribute('aria-selected', on); t.tabIndex = (on || (indice && j === 0)) ? 0 : -1; });
    paneles.forEach((p, j) => { p.hidden = j !== k; });
    secciones.hidden = indice;
    r.classList.toggle('con-seccion', !indice);
    lado.scrollTop = 0;
    modelo.modo(indice ? null : APARTADOS[k].clave);
    leyenda.hidden = indice || APARTADOS[k].clave !== 'biomateriales';
    if(foco) (indice ? tabs[0] : tabs[k]).focus();
  }
  tabs.forEach((t, k) => {
    t.addEventListener('click', () => elegirPestana(pestana === k ? -1 : k));
    t.addEventListener('keydown', e => {
      const n = PESTANAS.length, mov = { ArrowDown:1, ArrowRight:1, ArrowUp:-1, ArrowLeft:-1 }[e.key];
      if(mov){ e.preventDefault(); elegirPestana(((Math.max(pestana, mov > 0 ? -1 : 0) + mov) % n + n) % n, true); }
      if(e.key === 'Home'){ e.preventDefault(); elegirPestana(0, true); }
      if(e.key === 'End'){ e.preventDefault(); elegirPestana(n - 1, true); }
    });
  });
  btnSeparar.addEventListener('click', () => {
    const on = !modelo.separado; modelo.separar(on);
    btnSeparar.setAttribute('aria-pressed', on); btnSeparar.textContent = on ? 'Montar de nuevo' : 'Separar piezas';
  });

  // PDF: si existe el capítulo compilado se descarga; si no, se imprime la ficha completa (Guardar como PDF)
  function pintarPDF(){
    const caja = r.querySelector('.imp-pdf'), ruta = imp.pdf || vitrina?.pdf;
    caja.innerHTML = ruta
      ? `<a class="btn-secundario" href="${esc(ruta)}" download>Descargar PDF</a>`
      : `<button class="btn-secundario" data-print-pdf>Descargar PDF</button>`;
    caja.querySelector('[data-print-pdf]')?.addEventListener('click', imprimir);
  }
  function imprimir(){
    const img = r.querySelector('.imp-captura');
    try{ visor3d.renderer.render(visor3d.scene, visor3d.camera); img.src = visor3d.renderer.domElement.toDataURL('image/png'); img.hidden = false; }catch(e){ img.hidden = true; }
    document.body.classList.add('imprimiendo-ficha');
    const fin = () => { document.body.classList.remove('imprimiendo-ficha'); img.hidden = true; removeEventListener('afterprint', fin); };
    addEventListener('afterprint', fin);
    window.print();
  }

  // Cada apartado se pinta desde datos/ortopedia.json → implantes[i].apartados.<clave> (formato en APARTADOS más arriba
  // y en tareas/FORMATO_FICHAS_IMPLANTES.md). Si falta, se enseña el esqueleto con lo que irá en ese apartado.
  function pintarApartado(k){
    const def = APARTADOS[k], ap = imp.apartados?.[def.clave], panel = paneles[k];
    const tieneAlgo = ap && (ap.intro || ap.bloques?.length || ap.claves?.length || ap.preguntas?.length);
    if(!tieneAlgo){
      panel.innerHTML = `<h4 class="solo-print">${k + 1}. ${def.titulo}</h4>
        <div class="imp-vacio">
          <span class="num">${k + 1}</span><h4>${def.titulo}</h4>
          <p>Apartado en preparación. Aquí irá:</p>
          <ul class="imp-esqueleto">${def.esqueleto.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
        </div>`;
      return;
    }
    panel.innerHTML = `<h4 class="imp-ap-titulo"><span class="num">${k + 1}</span>${def.titulo}</h4>
      ${ap.intro ? `<p class="imp-intro">${fmt(ap.intro)}</p>` : ''}
      ${(ap.bloques || []).map((b, n) => bloqueHTML(b, `${k}-${n}`)).join('')}
      ${ap.claves?.length ? `<aside class="imp-claves"><h5>Para recordar</h5><ul>${ap.claves.map(c => `<li>${fmt(c)}</li>`).join('')}</ul></aside>` : ''}
      ${ap.preguntas?.length ? `<section class="imp-preguntas"><h5>Comprueba lo que sabes</h5>${ap.preguntas.map(q => `
        <details><summary>${fmt(q.p)}</summary><p>${fmt(q.r)}</p></details>`).join('')}</section>` : ''}
      ${ap.fuentes?.length ? `<footer class="imp-fuentes"><h5>Fuentes</h5><ol>${ap.fuentes.map(f => `<li>${fmt(f)}</li>`).join('')}</ol></footer>` : ''}`;
    panel.querySelectorAll('[data-calculo]').forEach(montarCalculadora);
  }

  function pintar(){
    if(titulo) titulo.textContent = imp.nombre;
    r.style.setProperty('--c', imp.color || '#5FF2D2');
    r.querySelector('.imp-etq').textContent = imp.etiqueta || '';
    r.querySelector('.imp-nombre').textContent = imp.nombre;
    r.querySelector('.imp-sub').textContent = imp.subtitulo || '';
    r.querySelector('.imp-resumen').textContent = imp.resumen_mesa || '';
    pintarPDF();
    APARTADOS.forEach((_, k) => pintarApartado(k));
    elegirPestana(pestana);
  }
  pintar();
  r.focus({ preventScroll:true });
}

export const actividades = { implante:fichaImplante };
