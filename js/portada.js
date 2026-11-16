/* =========================================================
   portada.js · La prótesis de cadera interactiva de la portada
   - Modelo 3D hecho con código (cabeza, inserto, cotilo y vástago)
   - Piezas magnéticas: se sacan, flotan y vuelven a encajar
   - Despiece con etiquetas y fichas de cada material
   ========================================================= */
import * as THREE from 'three';
import { gsap, reduceMotion, isMobile, gamaBaja, D, rand, estado, puntero, canvasTex, shell } from './util.js';
import { entorno, lienzo } from './motor.js';

/* =========================================================
   1. CONTENIDO: datos de cada pieza
   ========================================================= */
const PARTS = {
  stem:{ name:'Vástago femoral', short:'Ti-6Al-4V', fam:'Metal', c:'var(--metal)',
    mat:'Aleación de titanio Ti-6Al-4V (o CoCrMo y acero 316L en vástagos cementados)',
    stats:[['E','110 GPa'],['σ rotura','≈ 950 MPa'],['Densidad','4,4 g/cm³']],
    points:[
      'Debe resistir la <strong>fatiga</strong>: del orden de un millón de ciclos de carga al año, con varias veces el peso corporal en cada paso.',
      'Una capa pasiva de <strong>TiO₂</strong> lo protege de la corrosión y favorece la unión con el hueso.',
      'Su módulo es la mitad que el del CoCrMo, pero aún unas seis veces el del hueso cortical: de ahí el <strong>apantallamiento de tensiones</strong>.',
      'Se fija <strong>sin cemento</strong> (superficie porosa o con hidroxiapatita para que el hueso crezca sobre ella) o <strong>con cemento</strong> de PMMA.' ]},
  head:{ name:'Cabeza femoral', short:'Cerámica de alúmina', fam:'Cerámica', c:'var(--ceramic)',
    mat:'Alúmina o alúmina reforzada con circona (también existen de CoCrMo)',
    stats:[['E','≈ 380 GPa'],['σ flexión','≈ 450 MPa'],['Dureza','muy alta']],
    points:[
      'Es una superficie de <strong>desgaste</strong>: necesita gran dureza y un pulido casi perfecto.',
      'Las cerámicas son bioinertes y generan muy pocas partículas de desgaste.',
      'Su punto débil es la <strong>fragilidad</strong>: baja tenacidad a fractura, así que un defecto pequeño puede propagarse y romper la pieza.',
      'Las de CoCrMo no se rompen, pero su desgaste libera iones metálicos.' ]},
  liner:{ name:'Inserto', short:'UHMWPE', fam:'Polímero', c:'var(--polymer)',
    mat:'Polietileno de ultra alto peso molecular, normalmente altamente reticulado',
    stats:[['E','≈ 0,9 GPa'],['σ rotura','≈ 40 MPa'],['Alargamiento','> 300 %']],
    points:[
      'Hace de cojinete entre cabeza y copa: <strong>baja fricción</strong> y absorción de impactos.',
      'Sus <strong>partículas de desgaste</strong> activan a los macrófagos, que liberan mediadores que reabsorben hueso (osteólisis): una causa clásica del aflojamiento aséptico.',
      'La reticulación por radiación reduce el desgaste; la vitamina E lo protege de la oxidación.' ]},
  cup:{ name:'Cotilo (copa acetabular)', short:'Titanio poroso', fam:'Metal', c:'var(--metal)',
    mat:'Titanio o aleación de Ti con superficie porosa o trabecular',
    stats:[['Porosidad','60–80 %'],['Fijación','press-fit'],['Unión','biológica']],
    points:[
      'Junto con el inserto forma el <strong>cotilo</strong>, la parte que sustituye al acetábulo de la pelvis.',
      'Se encaja a presión en la pelvis, a veces con tornillos.',
      'Su cara externa es rugosa o porosa para que el hueso crezca hacia dentro: <strong>osteointegración</strong>.',
      'Algunas llevan recubrimiento de <strong>hidroxiapatita</strong>, una cerámica parecida al mineral del hueso, que acelera la unión.' ]}
};


/* =========================================================
   2. ESCENA, CÁMARA Y LUCES
   ========================================================= */
export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x15103D, 15, 34);
scene.environment = entorno;
export const camera = new THREE.PerspectiveCamera(35, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 17);

// Fondo: un degradado pintado en un canvas (así el "bloom" funciona sobre un fondo real)
const bgCanvas=document.createElement('canvas'); bgCanvas.width=1024; bgCanvas.height=640;
{ const g=bgCanvas.getContext('2d'); const gr=g.createRadialGradient(665,256,0,665,256,720);
  gr.addColorStop(0,'#2B1F66'); gr.addColorStop(.42,'#15103D'); gr.addColorStop(1,'#0B0A22'); g.fillStyle=gr; g.fillRect(0,0,1024,640); }
const bgTex=new THREE.CanvasTexture(bgCanvas); bgTex.colorSpace=THREE.SRGBColorSpace; scene.background=bgTex;

// Luces: una principal cálida y dos de contorno de color (violeta y turquesa)
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 8); scene.add(key);
const rimV = new THREE.PointLight(0x8B6CFF, 60, 30); rimV.position.set(-6, 3, -4); scene.add(rimV);
const rimT = new THREE.PointLight(0x5FF2D2, 40, 30); rimT.position.set(6, -5, -3); scene.add(rimT);
scene.add(new THREE.AmbientLight(0x6E5FD0, 0.35));

/* =========================================================
   MATERIALES (PBR: basados en física)
   metalness y roughness imitan cómo refleja la luz cada material real.
   Las texturas pintadas con código (poros, cepillado) son costosas: se generan
   DESPUÉS del primer fotograma con generarTexturas(), para que la página abra sin bloquearse.
   ========================================================= */
export const M = {
  stem:  new THREE.MeshPhysicalMaterial({ color:0xE4E7EE, metalness:1, roughness:0.3, anisotropy:0.6, transparent:true }),
  cup:   new THREE.MeshPhysicalMaterial({ color:0xC6CCD8, metalness:1, roughness:0.16, transparent:true }),                 // interior y borde pulidos
  cupOuter: new THREE.MeshPhysicalMaterial({ color:0xB4BAC7, metalness:0.9, roughness:0.8, transparent:true }),            // exterior poroso
  // Sin "transmission": evita dibujar la escena entera dos veces por fotograma
  liner: new THREE.MeshPhysicalMaterial({ color:0xF8F3E8, metalness:0, roughness:0.35, clearcoat:0.25, sheen:0.4, sheenColor:0xFFF6DE, transparent:true, opacity:0.88 }),
  head:  new THREE.MeshPhysicalMaterial({ color:0xF6EAEF, metalness:0, roughness:0.08, clearcoat:1, clearcoatRoughness:0.03, ior:1.76, sheen:0.25, sheenColor:0xFFE3EA, transparent:true })
};
// Materiales de cada pieza (la copa tiene dos: interior pulido y exterior poroso)
export const MATS = { stem:[M.stem], cup:[M.cup,M.cupOuter], liner:[M.liner], head:[M.head] };

export const texturas = {};   // aquí quedan las texturas para que otros módulos (la mesa) las reutilicen
export function generarTexturas(){
  const T = gamaBaja ? 0.5 : 1;     // en gama baja, texturas a mitad de resolución
  // Titanio trabecular (copa): celdas abiertas, como una espuma metálica
  const poresTex = canvasTex(1024*T,1024*T,(g,w,h)=>{
    g.fillStyle='#9c9c9c'; g.fillRect(0,0,w,h);
    for(let i=0;i<2400*T*T;i++){ const x=Math.random()*w, y=Math.random()*h, r=(5+Math.random()*10)*T;
      const gr=g.createRadialGradient(x,y,r*.15,x,y,r); gr.addColorStop(0,'#1e1e1e'); gr.addColorStop(.65,'#4a4a4a'); gr.addColorStop(1,'rgba(225,225,225,.6)');
      g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); }
    for(let i=0;i<12000*T*T;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*.3})`; g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5); }
  });
  poresTex.repeat.set(5,2.5); poresTex.colorSpace = THREE.SRGBColorSpace;
  // Vástago: titanio cepillado (trazos finos) y, arriba, recubrimiento rugoso de hidroxiapatita
  const COAT = 0.36;   // fracción superior del vástago con recubrimiento
  const stemCanvas = isColor => canvasTex(512*T,1024*T,(g,w,h)=>{
    g.fillStyle = isColor ? '#E4E7EE' : '#2E2E2E'; g.fillRect(0,0,w,h);            // pulido: claro / poco rugoso
    for(let i=0;i<1400*T;i++){ const y=Math.random()*h; g.fillStyle = isColor?`rgba(160,168,185,${Math.random()*.12})`:`rgba(110,110,110,${Math.random()*.3})`; g.fillRect(0,y,w,1); } // cepillado
    const ch=h*COAT;
    const grd=g.createLinearGradient(0,ch-30*T,0,ch+10*T); grd.addColorStop(0,isColor?'#B9B3A4':'#DADADA'); grd.addColorStop(1,isColor?'rgba(185,179,164,0)':'rgba(218,218,218,0)');
    g.fillStyle=isColor?'#B9B3A4':'#DADADA'; g.fillRect(0,0,w,ch-30*T); g.fillStyle=grd; g.fillRect(0,ch-30*T,w,40*T);
    for(let i=0;i<26000*T*T;i++){ const y=Math.random()*(ch-20*T); const v=Math.random();
      g.fillStyle = isColor ? `rgba(${v>.5?250:120},${v>.5?246:114},${v>.5?235:102},.55)` : `rgba(${v>.5?255:90},${v>.5?255:90},${v>.5?255:90},.6)`;
      g.fillRect(Math.random()*w,y,2,2); }
  });
  const stemColor=stemCanvas(true), stemRough=stemCanvas(false);
  // Las caras del vástago extruido usan como UV sus coordenadas (x, y): ajustamos para que el canvas cubra la silueta
  [stemColor,stemRough].forEach(t=>{ t.repeat.set(1/1.7, 1/5.75); t.offset.set(-0.35/1.7, 6.65/5.75); t.colorSpace = t===stemColor ? THREE.SRGBColorSpace : THREE.NoColorSpace; });
  Object.assign(M.stem, { color:new THREE.Color(0xFFFFFF), map:stemColor, roughness:1, roughnessMap:stemRough, bumpMap:stemRough, bumpScale:0.6 });
  Object.assign(M.cupOuter, { map:poresTex, roughness:1, roughnessMap:poresTex, bumpMap:poresTex, bumpScale:3 });
  M.stem.needsUpdate = M.cupOuter.needsUpdate = true;
  Object.assign(texturas, { poresTex, stemColor, stemRough });
}

/* =========================================================
   3. GEOMETRÍA DE LA PRÓTESIS (modelada por código)
   ========================================================= */

const prosthesis = new THREE.Group();   // contiene las 4 piezas
const parts = {};                        // grupo de cada pieza (para moverlas al despiezar)
function addPart(key, mesh){ const g=new THREE.Group(); g.add(mesh); mesh.userData.part=key; g.userData.part=key; prosthesis.add(g); parts[key]=g; return g; }

// Cabeza: esfera pulida
addPart('head', new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), M.head));

// Inserto y copa: dos casquetes, orientados para que la abertura mire hacia el fémur
const linerMesh = new THREE.Mesh(shell(1.04, 1.26, 64), M.liner); linerMesh.rotation.z = 0.62;
const cupMesh   = new THREE.Mesh(shell(1.28, 1.48, 64), M.cup);   cupMesh.rotation.z = 0.62;
const cupOuter  = new THREE.Mesh(new THREE.SphereGeometry(1.492, 72, 32, 0, Math.PI*2, 0, Math.PI/2), M.cupOuter); cupOuter.rotation.z = 0.62;
addPart('liner', linerMesh);
addPart('cup', cupMesh);
cupOuter.userData.part='cup'; parts.cup.add(cupOuter);

// Vástago: un perfil 2D extruido con bisel + un cuello cilíndrico (cono Morse)
const stemGroup = new THREE.Group();
export const s = new THREE.Shape();   // silueta 2D del vástago (la reutiliza la mesa)
s.moveTo(0.55,-1.05);
s.lineTo(1.25,-1.18);
s.quadraticCurveTo(1.95,-1.35, 1.9,-2.0);
s.lineTo(1.62,-6.0);
s.quadraticCurveTo(1.45,-6.55, 1.22,-6.0);
s.lineTo(1.0,-3.4);
s.quadraticCurveTo(0.9,-2.0, 0.5,-1.55);
s.closePath();
const body = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth:0.42, bevelEnabled:true, bevelThickness:0.14, bevelSize:0.12, bevelSegments:6, curveSegments:32 }), M.stem);
body.position.z = -0.21;
export const neckDir = new THREE.Vector3(0.62,-0.78,0).normalize();
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.75, 48), M.stem);
neck.position.copy(neckDir.clone().multiplyScalar(0.95));
neck.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), neckDir.clone().negate());
stemGroup.add(body, neck);
stemGroup.traverse(o=>{ if(o.isMesh) o.userData.part='stem'; });
const stemPart = new THREE.Group(); stemPart.add(stemGroup); stemPart.userData.part='stem';
prosthesis.add(stemPart); parts.stem = stemPart;

// Centramos la prótesis y la inclinamos un poco hacia la cámara
prosthesis.position.set(-0.85, 2.6, 0);
const pivot = new THREE.Group();          // el pivote es lo que giramos
pivot.add(prosthesis);
pivot.rotation.set(0.12, -0.5, 0.08);
// Giro limitado: una orientación base (rot) + lo que gira el usuario (user) + un balanceo suave (sway)
const rot = { x:0.12, y:-0.5 };
let userX=0, userY=0, swayT=0, swayAmp=0;
const stage = new THREE.Group();          // el "escenario" se desplaza a la derecha en portada
stage.add(pivot); scene.add(stage);

// Puntos de anclaje de las etiquetas (en coordenadas de cada pieza)
const ANCHORS = { cup:new THREE.Vector3(-1.05,1.05,0.3), liner:new THREE.Vector3(-0.2,1.2,0.7), head:new THREE.Vector3(0.55,0.2,0.9), stem:new THREE.Vector3(1.55,-4.2,0.4) };
// En móvil hay menos sitio: anclajes alternativos para que las etiquetas no se pisen
const ANCHORS_M = { cup:new THREE.Vector3(-0.5,1.6,0), liner:new THREE.Vector3(-1.05,-0.3,0.6), head:new THREE.Vector3(0.55,0.2,0.9), stem:new THREE.Vector3(1.0,-4.2,0.4) };
// Posiciones despiezadas
const EXPLODE = { cup:new THREE.Vector3(-1.75,1.45,-0.5), liner:new THREE.Vector3(-0.85,0.72,0.35), head:new THREE.Vector3(0.05,0,1.0), stem:new THREE.Vector3(0.9,-1.05,0) };

/* =========================================================
   4. AMBIENTE: cristales de hidroxiapatita, fragmentos de hueso y partículas
   ========================================================= */
const field = new THREE.Group(); scene.add(field);
const crystalGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 6);          // prisma hexagonal
const fragGeo = new THREE.IcosahedronGeometry(0.6, 0);
const crystalMats = [
  new THREE.MeshStandardMaterial({ color:0x5FF2D2, roughness:0.18, metalness:0.05, transparent:true, opacity:0.78, flatShading:true, emissive:0x0E5E52, emissiveIntensity:0.45 }),
  new THREE.MeshStandardMaterial({ color:0x9C83FF, roughness:0.22, flatShading:true, emissive:0x2A1A7A, emissiveIntensity:0.5 })
];
const fragMat = new THREE.MeshStandardMaterial({ color:0x5A4C8E, roughness:0.9, flatShading:true });
const floaters = [];
for(let i=0;i<46;i++){
  const isCrystal = i%3===0;
  const m = new THREE.Mesh(isCrystal?crystalGeo:fragGeo, isCrystal?crystalMats[i%2]:fragMat);
  // Distribuidos en un cascarón alrededor del centro, sin tapar la prótesis
  const r = rand(7,20), th = rand(0,Math.PI*2), ph = rand(0.3,Math.PI-0.3);
  m.position.set(r*Math.sin(ph)*Math.cos(th), r*Math.cos(ph)*0.7, -Math.abs(r*Math.sin(ph)*Math.sin(th))*0.9 - 3);
  // Zona del texto de portada (izquierda): empujamos los objetos hacia el fondo para no ensuciar la lectura
  if(m.position.x < -2 && m.position.x > -14 && Math.abs(m.position.y) < 6) m.position.z -= 9;
  const sc = isCrystal ? rand(0.3,0.8) : rand(0.3,1.2); m.scale.set(sc, sc*rand(0.7,1.4), sc);
  m.rotation.set(rand(0,6),rand(0,6),rand(0,6));
  m.userData.spin = new THREE.Vector3(rand(-.3,.3),rand(-.3,.3),rand(-.3,.3));
  m.userData.bob = rand(0,6);
  field.add(m); floaters.push(m);
}
// Partículas finas (como proteínas en suspensión)
const N=900, pos=new Float32Array(N*3);
for(let i=0;i<N;i++){ pos[i*3]=rand(-22,22); pos[i*3+1]=rand(-13,13); pos[i*3+2]=rand(-20,6); }
const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos,3)),
  new THREE.PointsMaterial({ color:0xB9A8FF, size:0.05, transparent:true, opacity:0.7, depthWrite:false, blending:THREE.AdditiveBlending }));
scene.add(dust);

/* =========================================================
   5. GIRO Y TAMAÑO DE PANTALLA
   ========================================================= */
// Giramos la prótesis sobre su propio eje (no la cámara), así el encuadre no cambia
export const look = new THREE.Vector3(0,0,0);     // punto al que mira la cámara
let autoRotate = !reduceMotion, spin = null;

let mode = 'hero';   // 'hero' (portada) o 'explore' (despiezada)
let selected = null; // pieza seleccionada
function layout(){
  const w=innerWidth, h=innerHeight;
  camera.aspect=w/h; camera.updateProjectionMatrix();
  // En portada, la prótesis se va a la derecha para dejar sitio al texto; en móvil, arriba
  const target = mode==='hero'
    ? (isMobile()? {x:0.2,y:1.9,s:0.56} : {x:3.3,y:0.3,s:1})
    : (isMobile()? {x:0.7,y:(selected?3.6:0.6),s:0.5} : {x:(selected?-2.6:0.2), y:-0.6, s:0.82});
  return target;
}
function moveStage(instant){
  const t = layout();
  gsap.to(stage.position,{ x:t.x, y:t.y, duration:instant||reduceMotion?0:1.4, ease:'power3.inOut' });
  gsap.to(stage.scale,{ x:t.s, y:t.s, z:t.s, duration:instant||reduceMotion?0:1.4, ease:'power3.inOut' });
}
addEventListener('resize', ()=>moveStage(true));
moveStage(true);

/* =========================================================
   6. ETIQUETAS HTML QUE SIGUEN A LAS PIEZAS
   ========================================================= */
const labelBox = document.getElementById('labels');
const labels = {};
for(const k of ['cup','liner','head','stem']){
  const b = document.createElement('button');
  b.className='label'+(k==='cup'?' left':'')+((k==='stem'||k==='liner')?' m-left':''); b.style.setProperty('--c', PARTS[k].c);
  b.innerHTML = `<span class="dot"></span><span class="txt"><b>${PARTS[k].name}</b><em>${PARTS[k].short}</em></span>`;
  b.addEventListener('click', ()=>select(k));
  labelBox.appendChild(b); labels[k]=b;
}
const tmp = new THREE.Vector3();
function placeLabels(){
  for(const k in labels){
    tmp.copy((isMobile()?ANCHORS_M:ANCHORS)[k]); parts[k].localToWorld(tmp);   // punto 3D de la pieza → mundo
    tmp.project(camera);                                // mundo → pantalla (-1 a 1)
    const x=(tmp.x*0.5+0.5)*innerWidth, y=(-tmp.y*0.5+0.5)*innerHeight;
    labels[k].style.left = x+'px'; labels[k].style.top = y+'px';
  }
}

/* =========================================================
   7. INTERACCIÓN: despiezar, seleccionar, piezas magnéticas
   ========================================================= */
const hero = document.getElementById('hero');
const exploreUi = document.getElementById('exploreUi');
const card = document.getElementById('card');
const cardBody = document.getElementById('cardBody');

function explode(){
  resetDetached();
  mode='explore';
  gsap.killTweensOf(hero);   // por si la animación de entrada aún no ha terminado
  gsap.to(hero,{ autoAlpha:0, y:20, duration:D(.5) });
  moveStage();
  Object.entries(EXPLODE).forEach(([k,v],i)=> gsap.to(parts[k].position,{ x:v.x, y:v.y, z:v.z, duration:D(1.3), delay:D(.15+i*.06), ease:'power3.inOut' }));
  gsap.to(rot,{ x:0.08, y:-0.25, duration:D(1.4), ease:'power3.inOut' });
  gsap.to(exploreUi,{ autoAlpha:1, duration:D(.5), delay:D(1.1), onStart:()=>exploreUi.style.pointerEvents='auto' });
  Object.values(labels).forEach((l,i)=>{ gsap.to(l,{ opacity:1, duration:D(.4), delay:D(1.2+i*.08) }); l.style.pointerEvents='auto'; });
}
function assemble(){
  resetDetached();
  deselect(); mode='hero'; autoRotate=!reduceMotion;
  Object.values(labels).forEach(l=>{ gsap.to(l,{opacity:0,duration:D(.25)}); l.style.pointerEvents='none'; });
  gsap.to(exploreUi,{ autoAlpha:0, duration:D(.3) }); exploreUi.style.pointerEvents='none';
  Object.keys(parts).forEach(k=> gsap.to(parts[k].position,{ x:0,y:0,z:0, duration:D(1.1), ease:'power3.inOut' }));
  gsap.to(rot,{ x:0.12, y:-0.5, duration:D(1.2), ease:'power3.inOut' });
  moveStage();
  gsap.to(hero,{ autoAlpha:1, y:0, duration:D(.6), delay:D(.8) });
}
function select(k){
  if(mode!=='explore') explode();
  selected=k; const p=PARTS[k];
  // Las demás piezas se vuelven translúcidas para destacar la elegida
  Object.keys(parts).forEach(o=> gsap.to(MATS[o],{ opacity:o===k?1:0.18, duration:D(.4) }));
  Object.entries(labels).forEach(([o,l])=>l.classList.toggle('on',o===k));
  card.style.setProperty('--c', p.c);
  cardBody.innerHTML = `<span class="fam">${p.fam}</span><h2>${p.name}</h2><div class="mat">${p.mat}</div>
    <div class="stat">${p.stats.map(([a,b])=>`<div><b>${b}</b>${a}</div>`).join('')}</div>
    <ul>${p.points.map(t=>`<li>${t}</li>`).join('')}</ul>`;
  card.classList.add('open');
  moveStage();
}
function deselect(){
  selected=null; card.classList.remove('open');
  Object.keys(parts).forEach(o=> gsap.to(MATS[o],{ opacity:1, duration:D(.4) }));
  Object.values(labels).forEach(l=>l.classList.remove('on'));
  if(mode==='explore') moveStage();
}
document.getElementById('start').addEventListener('click', explode);
document.getElementById('back').addEventListener('click', assemble);
document.getElementById('close').addEventListener('click', deselect);
addEventListener('keydown', e=>{ if(estado.enPasillo) return; if(e.key==='Escape') selected?deselect():(mode==='explore'&&assemble()); });

// =========================================================
// PIEZAS MAGNÉTICAS: arrastrar para separar, acercar para encajar
// - Cerca de su sitio, la pieza "se resiste" (como un imán): se estira y vuelve.
// - Si tiras con fuerza o lejos, se suelta con un pequeño "pop" y queda flotando.
// - Si la acercas de nuevo a su sitio, brilla en turquesa y al soltarla encaja.
// =========================================================
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
const dragPlane = new THREE.Plane(), hitPoint = new THREE.Vector3();
const detached = { stem:false, head:false, liner:false, cup:false };   // suelta y flotando
const rides    = { stem:null,  head:null,  liner:null,  cup:null  };   // enganchada a otra pieza que está fuera
const settling = {};                                                    // pieza en plena animación de encaje
// Qué piezas encajan entre sí, como en la prótesis real: vástago–cabeza, cabeza–inserto, inserto–copa
const LINKS = { stem:['head'], head:['stem','liner'], liner:['head','cup'], cup:['liner'] };
const BREAK = 1.2, ATTRACT = 1.9, SNAP = 0.5;   // soltar · empieza a atraer · encaja (en radios de la cabeza)
let drag = null, downAt = null, hovered = null;

const home     = k => mode==='explore' ? EXPLODE[k] : new THREE.Vector3();   // sitio de cada pieza en la prótesis
const anchorOf = k => rides[k] ? parts[rides[k]].position : home(k);          // a qué está unida ahora mismo
const isFree   = k => detached[k] || !!rides[k];                              // fuera de su sitio
const chainHas = (k,target) => { let n=rides[k], i=0; while(n && i++<5){ if(n===target) return true; n=rides[n]; } return false; };

function setPointer(ev){ mouse.set(ev.clientX/innerWidth*2-1, -(ev.clientY/innerHeight)*2+1); ray.setFromCamera(mouse, camera); }
function pick(ev){ setPointer(ev); const hit = ray.intersectObjects(prosthesis.children, true)[0]; return hit ? {k:hit.object.userData.part, p:hit.point} : null; }
function glow(k, hex){ MATS[k].forEach(m=>m.emissive.setHex(hex)); }
function flashGlow(k){ glow(k,0x2FBFA4); gsap.to(MATS[k].map(m=>m.emissive),{ r:0,g:0,b:0, duration:D(.6), delay:D(.15) }); }

// Las piezas se arrastran en un plano 2D (el plano de la prótesis), así siempre puedes devolverlas a su sitio
function setDragPlane(k){
  prosthesis.updateMatrixWorld();
  const n = new THREE.Vector3(0,0,1).transformDirection(prosthesis.matrixWorld);
  dragPlane.setFromNormalAndCoplanarPoint(n, prosthesis.localToWorld(new THREE.Vector3(0,0,home(k).z)));
}
function pointerLocal(){ return ray.ray.intersectPlane(dragPlane, hitPoint) ? prosthesis.worldToLocal(hitPoint.clone()) : null; }

// El encaje más cercano para una pieza suelta: su sitio, o una pieza compatible que también esté fuera
function nearestSlot(k, pos){
  let best = { d:pos.distanceTo(home(k)), pos:home(k).clone(), to:null };
  for(const n of LINKS[k]){
    if(!isFree(n) || chainHas(n,k)) continue;
    const d = pos.distanceTo(parts[n].position);
    if(d < best.d) best = { d, pos:parts[n].position.clone(), to:n };
  }
  return best;
}

function settle(k, p, ease, dur, done){
  settling[k]=true; gsap.killTweensOf(parts[k].position);
  gsap.to(parts[k].position,{ x:p.x, y:p.y, z:p.z, duration:D(dur), ease, onComplete:()=>{ settling[k]=false; done&&done(); } });
}
function connect(k, t){
  detached[k]=false; rides[k]=t.to;                     // to = null → vuelve a su sitio en la prótesis
  gsap.killTweensOf(parts[k].rotation);
  gsap.to(parts[k].rotation,{ x:0, y:0, z:0, duration:D(.35), ease:'power3.out' });
  settle(k, t.to ? parts[t.to].position : home(k), 'back.out(2.4)', .38);
  flashGlow(k);
}
// Cada fotograma, las piezas enganchadas a otra que está fuera la siguen
function updateRides(){
  for(const k of ['stem','head','liner','cup']){
    const n = rides[k]; if(!n || settling[k] || (drag && drag.k===k)) continue;
    if(!isFree(n) && !settling[n]){ rides[k]=null; settle(k, home(k), 'power3.out', .5); continue; }  // la otra volvió a su sitio
    parts[k].position.copy(parts[n].position); parts[k].rotation.copy(parts[n].rotation);
  }
}

lienzo.addEventListener('pointerdown', e=>{
  downAt={x:e.clientX,y:e.clientY};
  const h = pick(e);
  if(!h){ spin={x:e.clientX,y:e.clientY,uy:userY,ux:userX}; lienzo.setPointerCapture(e.pointerId); return; }
  const k=h.k;
  gsap.killTweensOf(parts[k].position); gsap.killTweensOf(parts[k].rotation); settling[k]=false;
  setDragPlane(k); setPointer(e);
  const lp = pointerLocal() || parts[k].position.clone();
  drag = { k, offset: lp.sub(parts[k].position), last:{x:e.clientX,y:e.clientY,t:performance.now()}, speed:0, moved:false };
  lienzo.setPointerCapture(e.pointerId);
});

lienzo.addEventListener('pointermove', e=>{
  if(spin){
    // Giro limitado: como mucho unos 40° a cada lado
    userY = THREE.MathUtils.clamp(spin.uy + (e.clientX-spin.x)*0.005, -0.7, 0.7);
    userX = THREE.MathUtils.clamp(spin.ux + (e.clientY-spin.y)*0.003, -0.3, 0.3);
    return;
  }
  if(drag){
    setPointer(e);
    const lp = pointerLocal(); if(!lp) return;
    const k = drag.k, target = lp.sub(drag.offset); target.z = home(k).z;
    const now=performance.now(), dt=Math.max(1,now-drag.last.t);
    drag.speed = Math.hypot(e.clientX-drag.last.x, e.clientY-drag.last.y)/dt;   // px por ms
    drag.last={x:e.clientX,y:e.clientY,t:now};
    if(Math.hypot(e.clientX-downAt.x, e.clientY-downAt.y)>6) drag.moved=true;
    if(!detached[k]){
      // Enganchada: se estira con resistencia; se suelta si tiras lejos o de golpe
      const a=anchorOf(k), pull=target.clone().sub(a), d=pull.length();
      if(d>BREAK || (d>0.45 && drag.speed>1.6)){
        detached[k]=true; rides[k]=null;
        gsap.fromTo(parts[k].scale,{x:1.1,y:1.1,z:1.1},{x:1,y:1,z:1,duration:D(.5),ease:'elastic.out(1,.4)'});
        if(k==='cup' && !isFree('liner')) rides.liner='cup';   // el cotilo sale entero (copa + inserto)
        parts[k].position.copy(target);
      } else parts[k].position.copy(a).add(pull.multiplyScalar(0.28));
    } else {
      // Suelta: al acercarse a un encaje, el imán la atrae cada vez más fuerte y, muy cerca, encaja sola
      const t = nearestSlot(k, target);
      if(t.d < SNAP){ glow(k,0); connect(k,t); drag=null; return; }
      if(t.d < ATTRACT){ target.lerp(t.pos, Math.pow(1-t.d/ATTRACT,2)*0.7); glow(k,0x0E6B5C); } else glow(k,0);
      parts[k].position.copy(target);
    }
    return;
  }
  if(e.pointerType!=='mouse') return;
  const h = pick(e), k = h&&h.k; lienzo.style.cursor = k ? 'grab' : 'ew-resize';
  if(k!==hovered){ hovered=k; Object.keys(MATS).forEach(o=>glow(o, o===k?0x1B1440:0x000000)); }
});

function endDrag(){
  spin=null;
  if(!drag){ downAt=null; return; }
  const k=drag.k; glow(k,0);
  if(!drag.moved) select(k);                                              // fue un toque: abrir ficha
  else if(!detached[k]) settle(k, anchorOf(k).clone(), 'elastic.out(1,.45)', .7);   // vuelve como una goma
  else {
    const t = nearestSlot(k, parts[k].position);
    if(t.d < ATTRACT) connect(k,t);                                       // cerca: el imán termina de encajarla
    else float(k);                                                        // lejos: se queda flotando
  }
  drag=null; downAt=null;
}
lienzo.addEventListener('pointerup', e=>{
  if(!drag && downAt && Math.hypot(e.clientX-downAt.x, e.clientY-downAt.y)<6 && selected) deselect();
  endDrag();
});
lienzo.addEventListener('pointercancel', endDrag);

function float(k){
  // Flota en su plano con un balanceo lento, sin dar vueltas
  if(reduceMotion) return;
  gsap.to(parts[k].rotation,{ z:'+='+rand(-0.12,0.12), duration:4.5, ease:'sine.inOut', yoyo:true, repeat:-1 });
  gsap.to(parts[k].position,{ y:'+=0.16', duration:2.6, ease:'sine.inOut', yoyo:true, repeat:-1 });
}
function resetDetached(){
  Object.keys(parts).forEach(k=>{
    if(isFree(k) || settling[k]){ detached[k]=false; rides[k]=null; settling[k]=false;
      gsap.killTweensOf(parts[k].position); gsap.killTweensOf(parts[k].rotation);
      gsap.to(parts[k].rotation,{x:0,y:0,z:0,duration:D(.6)}); }
  });
}

/* =========================================================
   8. ENTRADA: la prótesis se monta sola
   ========================================================= */
const START = { cup:[-5,6,-6], liner:[-4,4,4], head:[0,6,6], stem:[4,-9,-3] };
Object.entries(START).forEach(([k,[x,y,z]])=>{ parts[k].position.set(x,y,z); parts[k].rotation.set(rand(-1,1),rand(-1,1),rand(-1,1)); });
gsap.set(hero,{ autoAlpha:0, y:24 });
gsap.set(exploreUi,{ autoAlpha:0 });

export function intro(){
  document.getElementById('loader').classList.add('done');
  const tl = gsap.timeline({ defaults:{ ease:'expo.out' } });
  ['stem','cup','liner','head'].forEach((k,i)=>{
    tl.to(parts[k].position,{ x:0,y:0,z:0, duration:D(2.2) }, D(i*0.22));
    tl.to(parts[k].rotation,{ x:0,y:0,z:0, duration:D(2.2) }, D(i*0.22));
  });
  tl.from(camera.position,{ z:26, duration:D(2.8), ease:'power3.out' }, 0);
  tl.to(hero,{ autoAlpha:1, y:0, duration:D(1) }, D(1.4));
}

/* =========================================================
   ACTUALIZACIÓN DE CADA FOTOGRAMA (la llama main.js)
   ========================================================= */
export function actualizarPortada(t){
  if(!reduceMotion){
    floaters.forEach(m=>{ m.rotation.x+=m.userData.spin.x*0.01; m.rotation.y+=m.userData.spin.y*0.01; m.position.y+=Math.sin(t*0.6+m.userData.bob)*0.0025; });
    dust.rotation.y = t*0.01;
    // Paralaje: el fondo se mueve un poco con el ratón
    field.position.x += (puntero.x*1.2 - field.position.x)*0.03;
    field.position.y += (-puntero.y*0.8 - field.position.y)*0.03;
  }
  updateRides();
  // Balanceo suave en lugar de un giro completo; lo que gire el usuario vuelve poco a poco al centro
  if(!spin){ userY*=0.985; userX*=0.985; }
  if(!drag && !reduceMotion) swayT += 1/60;
  swayAmp += ((autoRotate && !reduceMotion ? (mode==='hero'?1:0.4) : 0) - swayAmp)*0.03;
  pivot.rotation.y = rot.y + userY + Math.sin(swayT*0.45)*0.26*swayAmp;
  pivot.rotation.x = rot.x + userX + Math.sin(swayT*0.3)*0.04*swayAmp;
  camera.lookAt(look);
  if(mode==='explore') placeLabels();
}

/* ---- Para el viaje al pasillo (main.js) ---- */
// Prepara la portada para el viaje: monta la prótesis, para el balanceo y oculta los textos
export function prepararViaje(){
  if(mode==='explore') assemble();
  autoRotate=false;
  gsap.killTweensOf(hero);
  gsap.to(hero,{autoAlpha:0,duration:D(.4)}); gsap.to(exploreUi,{autoAlpha:0,duration:D(.3)});
  Object.values(labels).forEach(l=>{l.style.opacity=0;l.style.pointerEvents='none'});
  const cabeza=new THREE.Vector3(); parts.head.getWorldPosition(cabeza); return cabeza;
}
// Vuelve a dejar la portada como al principio
export function volverAPortada(){
  look.set(0,0,0); camera.position.set(0,0.6,17);
  mode='hero'; autoRotate=!reduceMotion; moveStage(true);
  gsap.to(hero,{autoAlpha:1,y:0,duration:D(.6),delay:D(.3)});
}
