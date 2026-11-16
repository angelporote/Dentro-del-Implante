/* =========================================================
   pasillo.js · El pasillo circular del hospital (3D)
   Un cilindro de 12 tramos de pared visto desde dentro (las 6 vitrinas repetidas 2 veces,
   para que el pasillo dé la vuelta completa). Cada tramo tiene una vitrina y, detrás,
   una sala en 3D que construye su módulo de js/salas/.
   ========================================================= */
import * as THREE from 'three';
import { gsap, D, estado, puntero, isMobile, mesh, std, basicGlow, bright, rrect, canvasPlane } from './util.js';
import { entorno } from './motor.js';

export const WIN_W = 5.0, WIN_H = 3.3, WIN_Y = 0.55, SEG_H = 8;   // tamaño de la vitrina, altura de pared
// Radio del pasillo: 11 como mínimo; crece si hay tantas vitrinas que los cristales no cabrían.
export let HR = 11;
export const HUB_FOV = () => isMobile() ? 60 : 32;

/* ---- Escena y cámara ---- */
export const hubScene = new THREE.Scene();
hubScene.background = new THREE.Color(0xC9D6DB);
hubScene.fog = new THREE.FogExp2(0xC9D6DB, 0.004);
hubScene.environment = entorno;
hubScene.environmentIntensity = 0.45;          // reflejos suaves: el entorno de estudio es muy blanco
export const hubCam = new THREE.PerspectiveCamera(HUB_FOV(), innerWidth/innerHeight, 0.05, 120);
hubCam.rotation.order = 'YXZ';
hubScene.add(hubCam);                          // la cámara lleva "pegada" la mesa del primer plano
hubScene.add(new THREE.HemisphereLight(0xFFFFFF, 0x9FB2BA, 0.85));
{ const sol=new THREE.DirectionalLight(0xFFFFFF, 0.55); sol.position.set(0,6,2); hubScene.add(sol); }

// Solo 3 luces puntuales para las salas: se recolocan en las vitrinas visibles (izquierda, centro, derecha).
// Tener una luz por sala (12) haría todos los materiales más costosos de dibujar.
const luces = [0,1,2].map(()=>{ const l=new THREE.PointLight(0xffffff, 0, 11, 1.6); hubScene.add(l); return l; });
const lucesSala = [];    // por tramo: { pos (posición en el mundo), color, intensidad }

/* ---- Materiales del pasillo ---- */
const wallMat = std(0xCFDCE0, { roughness:0.75 });                                         // pared clínica
const panelLineMat = std(0xC9D5DA, { roughness:0.6 });
const frameMat = std(0xD5DBE2, { metalness:0.85, roughness:0.25 });                                 // acero inoxidable ligero
const railMat = std(0xC49A6C, { roughness:0.45 });                                         // pasamanos de madera
export const stripeMat = std(0x23A894, { roughness:0.5 });                                 // franja de señalización
const glassMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.035, depthWrite:false });

// Señal de hospital: cartel blanco con bloque de color y texto oscuro
function cartel(num, texto){ const m = canvasPlane(2.6,0.42,780,126,(g,w,h)=>{ g.clearRect(0,0,w,h);
  g.fillStyle='#FFFFFF'; g.beginPath(); g.roundRect(3,3,w-6,h-6,16); g.fill();
  g.fillStyle='#1F6FB2'; g.beginPath(); g.roundRect(3,3,h-6,h-6,[16,0,0,16]); g.fill();
  g.fillStyle='#FFFFFF'; g.font='700 50px Sora, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(num,(h-6)/2+3,h/2+2);
  g.fillStyle='#1C2B3A'; g.font='600 34px Sora, sans-serif'; g.textAlign='left'; g.fillText(texto,h+22,h/2+2); });
  m.material.toneMapped=true; return m; }

/* =========================================================
   Construcción del pasillo a partir de los datos (vitrinas.json) y los módulos de sala
   ========================================================= */
export function crearPasillo(vitrinas, salas){
  const NR = vitrinas.length, HN = NR*2, HSTEP = 2*Math.PI/HN, STEP = 360/HN;
  HR = Math.max(11, (WIN_W + 0.7) / (2*Math.sin(Math.PI/HN)));   // cada tramo deja ~0,7 de pared entre cristales
  // Ancho de cada pared: el pasillo es un polígono, así que se usa la tangente y el radio de la cara trasera
  // para que los tramos se solapen y no quede rendija en las juntas
  const chord = 2*(HR+0.35)*Math.tan(HSTEP/2) + 0.02;

  // Geometrías compartidas por los 12 tramos
  const wallShape = rrect(chord, SEG_H, 0.001); wallShape.holes.push(rrect(WIN_W, WIN_H, 0.45, WIN_Y));
  const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth:0.35, bevelEnabled:false });
  const frameShape = rrect(WIN_W+0.34, WIN_H+0.34, 0.6, WIN_Y); frameShape.holes.push(rrect(WIN_W, WIN_H, 0.45, WIN_Y));
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth:0.5, bevelEnabled:true, bevelSize:0.04, bevelThickness:0.04, bevelSegments:3, curveSegments:16 });
  const glowShape = rrect(WIN_W+0.08, WIN_H+0.08, 0.48, WIN_Y); glowShape.holes.push(rrect(WIN_W, WIN_H, 0.45, WIN_Y));
  const glowGeo = new THREE.ShapeGeometry(glowShape, 16);

  // Suelo reflectante, techo y línea guía en el suelo
  mesh(new THREE.CircleGeometry(HR+0.6, 96), std(0xC4D2D8, { roughness:0.18, metalness:0.15 }), 0, -SEG_H/2, 0, hubScene).rotation.x = -Math.PI/2;
  mesh(new THREE.CircleGeometry(HR+0.6, 96), std(0xF2F6F7), 0, SEG_H/2, 0, hubScene).rotation.x = Math.PI/2;
  mesh(new THREE.RingGeometry(HR-1.6, HR-1.45, 200), stripeMat, 0, -SEG_H/2+0.01, 0, hubScene).rotation.x = -Math.PI/2;

  const glowMats = [], glassMeshes = [], anims = [], tramos = [];   // anims: { seg, f } → solo se ejecutan si el tramo se ve
  for(let i=0;i<HN;i++){
    const v=vitrinas[i%NR], g=new THREE.Group(); g.rotation.y = -i*HSTEP; hubScene.add(g);
    mesh(wallGeo, wallMat, 0,0,-HR-0.35, g);
    for(const x of [-chord/2+0.02, chord/2-0.02]) mesh(new THREE.BoxGeometry(0.05,SEG_H,0.04), panelLineMat, x,0,-HR+0.02, g);   // juntas entre paneles
    mesh(frameGeo, frameMat, 0,0,-HR-0.5, g);
    const gm = basicGlow(0x5FF2D2, 0.9); glowMats.push(gm); mesh(glowGeo, gm, 0,0,-HR+0.05, g);   // perfil de luz de la vitrina
    const glass = mesh(new THREE.PlaneGeometry(WIN_W,WIN_H), glassMat, 0,WIN_Y,-HR-0.2, g); glass.userData.seg=i; glassMeshes.push(glass);
    // franja de señalización, pasamanos de madera con soportes y zócalo
    mesh(new THREE.PlaneGeometry(chord,0.16), stripeMat, 0,-1.75,-HR+0.36, g);
    mesh(new THREE.CylinderGeometry(0.07,0.07,chord,16), railMat, 0,-1.45,-HR+0.5, g).rotation.z=Math.PI/2;
    for(const x of [-chord/3, chord/3]) mesh(new THREE.BoxGeometry(0.05,0.05,0.16), frameMat, x,-1.45,-HR+0.42, g);
    mesh(new THREE.BoxGeometry(chord,0.35,0.06), std(0x8FA3AC,{roughness:.4}), 0,-SEG_H/2+0.17,-HR+0.37, g);
    mesh(new THREE.PlaneGeometry(2.4,0.6), basicGlow(0xFFFFFF,1.6), 0,SEG_H/2-0.02,-HR+2.2, g).rotation.x=Math.PI/2;   // panel de luz del techo
    const pl = cartel(String(i%NR+1).padStart(2,'0'), v.titulo); pl.position.set(0, WIN_Y+WIN_H/2+0.55, -HR+0.37); g.add(pl);
    // La sala de detrás: la construye su módulo con estas ayudas
    const d = new THREE.Group(); d.scale.setScalar(1.3); d.position.set(0,WIN_Y-0.2,-HR-0.36); g.add(d);
    tramos.push({ g, d, seg:i });
    const ctx = {
      sala:(dd, color)=> mesh(new THREE.BoxGeometry(5.8, 4.8, 6.2), std(color,{ side:THREE.BackSide, roughness:0.85 }), 0, 0.15, -3.1, dd),
      luz:(dd, color, intensidad)=>{ g.updateMatrixWorld(true); const p=dd.localToWorld(new THREE.Vector3(0,1.5,-2.4)); lucesSala[i]={ pos:p, color:new THREE.Color(color), intensidad }; },
      anim:(f)=> anims.push({ seg:i, f })
    };
    (salas[v.id]?.construir || (()=>{}))(d, ctx);
  }

  /* ---- Navegación ---- */
  const ringWrap = document.getElementById('ringWrap');
  const dotsBox = document.getElementById('dots'), caption = document.getElementById('caption');
  vitrinas.forEach((v,i)=>{ const b=document.createElement('button'); b.setAttribute('aria-label',v.titulo); b.addEventListener('click',()=>goTo(i)); dotsBox.appendChild(b); });
  const state = { angle:0 };
  let current=-1, activeSeg=0, wasDrag=false, targetAngle=0;
  const norm = a => ((a%360)+540)%360-180;
  const segIdx = () => ((Math.round(state.angle/STEP)%HN)+HN)%HN;
  const snapAngle = a => Math.round(a/STEP)*STEP;
  const hooks = { mesa:null, entrar:()=>{} };    // los conecta main.js

  function renderRing(){
    activeSeg = segIdx();
    const room = activeSeg%NR;
    if(room!==current){
      current=room;
      caption.querySelector('h3').textContent=vitrinas[room].titulo;
      caption.querySelector('p').textContent=vitrinas[room].texto;
      dotsBox.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-current',j===room));
    }
  }
  function rotateTo(a, dur=.9){
    targetAngle = a;
    gsap.killTweensOf(state);
    gsap.to(state,{ angle:a, duration:D(dur), ease:'power3.out', onUpdate:renderRing, onComplete:renderRing });
  }
  function step(dd){ const base = gsap.isTweening(state) ? targetAngle : state.angle; rotateTo(snapAngle(base)+dd*STEP); }
  function goTo(room){   // por el camino más corto
    const idx=Math.round(state.angle/STEP); let best=null;
    for(let k=idx-HN;k<=idx+HN;k++) if(((k%NR)+NR)%NR===room && (best===null||Math.abs(k-idx)<Math.abs(best-idx))) best=k;
    rotateTo(best*STEP);
  }
  document.getElementById('prevDoor').addEventListener('click',()=>step(-1));
  document.getElementById('nextDoor').addEventListener('click',()=>step(1));
  document.getElementById('enterRoom').addEventListener('click',()=>hooks.entrar(current));

  // Arrastrar para girar (con inercia); tocar una vitrina para entrar; o coger algo de la mesa
  let dragRing=null;
  const pxPerStep = () => Math.min(innerWidth*0.5, 640);
  ringWrap.addEventListener('pointerdown',e=>{
    if(estado.enSala) return;
    if(hooks.mesa && hooks.mesa.pointerDown(e)) return;          // ¿has cogido un dispositivo de la mesa?
    gsap.killTweensOf(state); wasDrag=false;
    dragRing={x:e.clientX,a:state.angle,lastX:e.clientX,lastT:performance.now(),v:0};
    ringWrap.setPointerCapture(e.pointerId); ringWrap.classList.add('grabbing');
  });
  ringWrap.addEventListener('pointermove',e=>{
    if(hooks.mesa && hooks.mesa.agarrando()){ hooks.mesa.pointerMove(e); return; }
    if(!dragRing) return;
    const dx=e.clientX-dragRing.x; if(Math.abs(dx)>6) wasDrag=true;
    state.angle = dragRing.a - dx*(STEP/pxPerStep());
    const now=performance.now(); dragRing.v=(e.clientX-dragRing.lastX)/Math.max(1,now-dragRing.lastT); dragRing.lastX=e.clientX; dragRing.lastT=now;
    renderRing();
  });
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  ringWrap.addEventListener('pointerup',e=>{
    if(hooks.mesa && hooks.mesa.agarrando()){ hooks.mesa.pointerUp(); return; }
    if(!dragRing) return; ringWrap.classList.remove('grabbing');
    const v=dragRing.v; dragRing=null;
    if(wasDrag){ rotateTo(snapAngle(state.angle - v*260*(STEP/pxPerStep())), 1.1); return; }
    ptr.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1); ray.setFromCamera(ptr, hubCam);   // toque: ¿qué vitrina?
    const hit = ray.intersectObjects(glassMeshes)[0]; if(!hit) return;
    const rel = norm(hit.object.userData.seg*STEP - state.angle);
    if(Math.abs(rel) < STEP/2) hooks.entrar(hit.object.userData.seg%NR); else rotateTo(state.angle+rel);
  });
  ringWrap.addEventListener('pointercancel',()=>{
    if(hooks.mesa && hooks.mesa.agarrando()) hooks.mesa.pointerCancel?.();
    dragRing=null; ringWrap.classList.remove('grabbing');
  });
  let wheelT=null;
  ringWrap.addEventListener('wheel',e=>{
    if(estado.enSala) return; e.preventDefault(); gsap.killTweensOf(state);
    state.angle += (Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*0.03; renderRing();
    clearTimeout(wheelT); wheelT=setTimeout(()=>rotateTo(snapAngle(state.angle),.6),140);
  },{passive:false});

  /* ---- Cada fotograma ---- */
  const eje = new THREE.Vector3(0,1,0), tmp = new THREE.Vector3();
  function actualizar(t){
    // Cámara: mira hacia la vitrina según el ángulo, con un leve balanceo y paralaje del ratón
    hubCam.rotation.y = -THREE.MathUtils.degToRad(state.angle) - puntero.x*0.04 + Math.sin(t*0.3)*0.006;
    hubCam.rotation.x = -puntero.y*0.03 + Math.sin(t*0.4)*0.004;
    // Ocultamos los tramos y salas fuera de vista para evitar dibujarlos
    for(const tr of tramos){
      const rel=Math.abs(norm(tr.seg*STEP - state.angle));
      tr.g.visible = rel < 95;
      tr.d.visible = rel < 75;
    }
    // Animaciones de las salas: solo las de los tramos visibles (las pantallas no se repintan si no se ven)
    for(const a of anims){ const rel=Math.abs(norm(a.seg*STEP - state.angle)); if(rel < STEP*1.3) a.f(t); }
    // Las 3 luces se colocan en la vitrina activa y en sus dos vecinas
    [-1,0,1].forEach((k,j)=>{ const seg=((activeSeg+k)%HN+HN)%HN, L=lucesSala[seg], l=luces[j];
      if(L){ l.position.copy(L.pos); l.color.copy(L.color); l.intensity=L.intensidad; } else l.intensity=0; });
    // El título va dentro de la vitrina activa: proyectamos su centro 3D a la pantalla
    if(!estado.enSala){ const off=Math.abs(norm(state.angle - snapAngle(state.angle)))/(STEP/2);
      tmp.set(0,WIN_Y+0.35,-HR).applyAxisAngle(eje, -activeSeg*HSTEP).project(hubCam);
      caption.style.left=((tmp.x*0.5+0.5)*innerWidth)+'px'; caption.style.top=((-tmp.y*0.5+0.5)*innerHeight)+'px';
      caption.style.opacity = Math.max(0, 1-off*1.6); }
    glowMats.forEach((m,i)=>{ const target = i===activeSeg ? 2.2 : 0.7; const c=m.userData.k??0.9; const k=c+(target-c)*0.08; m.userData.k=k; m.color.copy(bright(0x5FF2D2,k)); });
  }

  return { state, STEP, HN, NR, HSTEP, renderRing, rotateTo, step, goTo, snapAngle, actualizar, hooks,
           ringWrap, get actual(){ return current; }, get tramoActivo(){ return activeSeg; } };
}
