/* =========================================================
   mesa.js · La mesa de acero del primer plano del pasillo
   Cinco dispositivos biomédicos con física real (motor cannon-es): bisturí, stent, prótesis
   de cadera, válvula tricúspide y desfibrilador con palas sujetas por su cable.
   La mesa va "pegada" a la cámara y se dibuja en un segundo lienzo, por encima de los textos.
   ========================================================= */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { estado, gamaBaja, mesh, std, basicGlow, canvasTex, canvasPlane, shell } from './util.js';
import { pixelRatio } from './motor.js';
import { hubCam, hubScene, stripeMat } from './pasillo.js';
import { M, s, neckDir } from './portada.js';

let avisar = ()=>{};        // función para mostrar avisos (la conecta main.js)
let listo = false;
export function conectarAvisos(f){ avisar = f; }

// La mesa se construye cuando main.js lo pide (después de generar las texturas de la prótesis,
// porque la prótesis pequeña de la mesa reutiliza sus materiales)
export function crearMesa(){
const counter = new THREE.Group(); hubCam.add(counter);
// ---- Texturas de la mesa ----
// Acero inoxidable cepillado: miles de trazos horizontales finos pintados en un canvas
const brushed = canvasTex(1024,256,(g,w,h)=>{ g.fillStyle='#bcbcbc'; g.fillRect(0,0,w,h);
  for(let i=0;i<5000;i++){ const y=Math.random()*h, v=170+Math.random()*70|0; g.fillStyle=`rgba(${v},${v},${v},${Math.random()*.2})`; g.fillRect(Math.random()*w-200,y,200+Math.random()*600,1); } });
brushed.repeat.set(2,1);
const brushedC = brushed.clone(); brushedC.colorSpace=THREE.SRGBColorSpace; brushedC.needsUpdate=true;
// Paño quirúrgico azul: trama de tejido
const weave = canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#2F6C96'; g.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=4) for(let x=0;x<w;x+=4){ const on=((x>>2)+(y>>2))%2; g.fillStyle=on?'rgba(255,255,255,.07)':'rgba(0,0,0,.09)'; g.fillRect(x,y,4,2); g.fillRect(x+(on?2:0),y+2,2,2); }
  for(let i=0;i<900;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*.06})`; g.fillRect(Math.random()*w,Math.random()*h,1,1); } });
weave.colorSpace=THREE.SRGBColorSpace; weave.repeat.set(10,4);
// Moleteado (grip) del mango del bisturí
const knurl = canvasTex(128,128,(g,w,h)=>{ g.fillStyle='#808080'; g.fillRect(0,0,w,h); g.strokeStyle='#e0e0e0'; g.lineWidth=2;
  for(let k=-w;k<w*2;k+=8){ g.beginPath(); g.moveTo(k,0); g.lineTo(k+h,h); g.stroke(); g.beginPath(); g.moveTo(k,h); g.lineTo(k+h,0); g.stroke(); } });
knurl.repeat.set(6,1);
// Tejido del anillo de sutura de la válvula (poliéster)
const fabric = canvasTex(128,64,(g,w,h)=>{ g.fillStyle='#EFE8DA'; g.fillRect(0,0,w,h); for(let x=0;x<w;x+=3){ g.fillStyle='rgba(0,0,0,.08)'; g.fillRect(x,0,1,h); } for(let y=0;y<h;y+=3){ g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(0,y,w,1); } });
fabric.colorSpace=THREE.SRGBColorSpace; fabric.repeat.set(12,1);

const alu = new THREE.MeshPhysicalMaterial({ color:0xFFFFFF, map:brushedC, metalness:1, roughness:0.38, roughnessMap:brushed, clearcoat:0.25, clearcoatRoughness:0.2 });
const steel = new THREE.MeshPhysicalMaterial({ color:0xE9EDF2, metalness:1, roughness:0.12 });
const TOP = -0.5, DZ0 = -3.05, DZ1 = -2.15;                      // superficie de la mesa (coordenadas de la cámara)
mesh(new RoundedBoxGeometry(7,0.045,DZ1-DZ0+0.12,3,0.015), alu, 0,TOP-0.022,(DZ0+DZ1)/2, counter);        // tablero de acero cepillado
mesh(new RoundedBoxGeometry(7,0.035,0.035,3,0.012), alu, 0,TOP+0.01,DZ1+0.05, counter);                  // reborde delantero
mesh(new RoundedBoxGeometry(7,0.035,0.035,3,0.012), alu, 0,TOP+0.01,DZ0-0.04, counter);                  // reborde trasero
mesh(new THREE.BoxGeometry(7,0.7,0.03), new THREE.MeshPhysicalMaterial({ color:0xFFFFFF, map:brushedC, metalness:1, roughness:0.45, roughnessMap:brushed }), 0,TOP-0.37,DZ1+0.06, counter);   // frontal
mesh(new THREE.BoxGeometry(7,0.018,0.035), stripeMat, 0,TOP-0.09,DZ1+0.08, counter);            // franja turquesa
// paño quirúrgico estéril bajo el instrumental, con un pliegue
{ const drape=mesh(new THREE.PlaneGeometry(2.3,0.62,40,6), new THREE.MeshStandardMaterial({ map:weave, roughness:1 }), -0.12,TOP+0.002,-2.53, counter); drape.rotation.x=-Math.PI/2;
  const pa=drape.geometry.attributes.position; for(let k=0;k<pa.count;k++){ const x=pa.getX(k); pa.setZ(k, Math.max(0,Math.sin((x+1.15)*9))*0.003); } drape.geometry.computeVertexNormals(); }

const deskItems=[];   // objetos que se recolocan en horizontal según el ancho de pantalla: {obj, x}

// ---- Los cinco dispositivos ----
// ---- Mundo físico (cannon-es). Todo en coordenadas de la mesa ----
const world = new CANNON.World({ gravity: new CANNON.Vec3(0,-9.82,0) });
world.allowSleep = true;
const matTable = new CANNON.Material('mesa'), matObj = new CANNON.Material('objeto');
world.addContactMaterial(new CANNON.ContactMaterial(matTable, matObj, { friction:0.6, restitution:0.12, contactEquationStiffness:1e7, contactEquationRelaxation:4 }));
world.addContactMaterial(new CANNON.ContactMaterial(matObj, matObj, { friction:0.35, restitution:0.15 }));
const v3 = v => new CANNON.Vec3(v.x, v.y, v.z);
function staticBox(hx,hy,hz, x,y,z){ const b=new CANNON.Body({ mass:0, material:matTable, shape:new CANNON.Box(new CANNON.Vec3(hx,hy,hz)) }); b.position.set(x,y,z); world.addBody(b); return b; }
// la mesa es un sólido: el tablero, el desfibrilador y unas paredes invisibles para que nada se salga de la vista
staticBox(3.5,0.0225,(DZ1-DZ0+0.12)/2, 0,TOP-0.0225,(DZ0+DZ1)/2);
staticBox(3.5,0.4,0.03, 0,TOP+0.4,DZ0-0.07);          // pared invisible trasera
staticBox(3.5,0.4,0.03, 0,TOP+0.4,DZ1+0.09);          // delantera
staticBox(3.5,0.03,1, 0,0.3,(DZ0+DZ1)/2);             // techo
const sideWalls=[staticBox(0.03,0.4,1, -1,TOP+0.4,(DZ0+DZ1)/2), staticBox(0.03,0.4,1, 1,TOP+0.4,(DZ0+DZ1)/2)];

const deskBodies=[];
// Cada dispositivo: su forma de choque es una caja que lo envuelve (o la forma que le pasemos)
function deskBody(obj, name, info, x, z, halfH, r, rest, shapes, mass=0.3){
  obj.scale.setScalar(obj.userData.big||1); obj.updateMatrixWorld(true);
  const body=new CANNON.Body({ mass, material:matObj, linearDamping:0.15, angularDamping:0.65, sleepSpeedLimit:0.08, sleepTimeLimit:0.4 });
  // El truco de la portada: cada objeto vive en un plano 2D. Se mueve en horizontal y en vertical,
  // pero nunca en profundidad, y solo gira dentro de ese plano (alrededor del eje de profundidad).
  body.linearFactor.set(1,1,0); body.angularFactor.set(0,0,1);
  if(shapes) shapes.forEach(([sh,off])=>body.addShape(sh, off||new CANNON.Vec3()));
  else { const bb=new THREE.Box3().setFromObject(obj), c=bb.getCenter(new THREE.Vector3()), h=bb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    body.addShape(new CANNON.Box(new CANNON.Vec3(Math.max(h.x,0.006),Math.max(h.y,0.006),Math.max(h.z,0.006))), v3(c)); }
  counter.add(obj);
  const restQ=new THREE.Quaternion().setFromEuler(rest||new THREE.Euler());
  const b={ obj, body, name, info, halfH, restQ, homeX:x, homeZ:z };
  obj.traverse(o=>{ if(o.isMesh) o.userData.deskBody=b; });
  world.addBody(body); deskBodies.push(b); return b;
}
// 1) Bisturí: mango plano tipo Bard-Parker con zona moleteada y hoja curva de acero pulido
{ const g=new THREE.Group();
  const hs=new THREE.Shape(); hs.moveTo(-0.13,-0.009); hs.lineTo(0.06,-0.011); hs.quadraticCurveTo(0.075,-0.011,0.08,-0.006); hs.lineTo(0.09,-0.004); hs.lineTo(0.09,0.004); hs.lineTo(0.08,0.006);
  hs.quadraticCurveTo(0.075,0.011,0.06,0.011); hs.lineTo(-0.13,0.009); hs.quadraticCurveTo(-0.14,0,-0.13,-0.009);
  const handle=mesh(new THREE.ExtrudeGeometry(hs,{depth:0.006,bevelEnabled:true,bevelThickness:0.0015,bevelSize:0.0015,bevelSegments:2}), steel, 0,0,0, g); handle.rotation.x=-Math.PI/2;
  const grip=mesh(new THREE.BoxGeometry(0.09,0.0085,0.016), new THREE.MeshPhysicalMaterial({ color:0xD8DDE4, metalness:1, roughness:0.35, bumpMap:knurl, bumpScale:2, roughnessMap:knurl }), -0.05,0.0005,0, g);
  const bs=new THREE.Shape(); bs.moveTo(0,-0.004); bs.lineTo(0.035,-0.004); bs.quadraticCurveTo(0.075,-0.002,0.085,0.012); bs.quadraticCurveTo(0.06,0.014,0.03,0.008); bs.lineTo(0,0.006); bs.closePath();
  const bl=mesh(new THREE.ExtrudeGeometry(bs,{depth:0.0012,bevelEnabled:false}), new THREE.MeshPhysicalMaterial({ color:0xF8FAFD, metalness:1, roughness:0.03 }), 0.088,0.003,0, g); bl.rotation.x=-Math.PI/2;
  g.userData.big=1.25;
  deskBody(g,'Bisturí','acero inoxidable martensítico, duro y afilable. Instrumental quirúrgico, no implantable.', -1.02,-2.36, 0.006, 0.14, new THREE.Euler(Math.PI/2,0,0),   // apoyado de canto: se ve su perfil (mango y hoja)
    [[new CANNON.Box(new CANNON.Vec3(0.19,0.011,0.022)), new CANNON.Vec3(0.025,0,0)]], 0.08); }
// 2) Stent: anillos de puntales en zigzag unidos por conectores, montado sobre un balón (toca para expandirlo)
{ const g=new THREE.Group(), strut=new THREE.MeshPhysicalMaterial({ color:0xD9DEE6, metalness:1, roughness:0.15 });
  const mesh_g=new THREE.Group(); g.add(mesh_g);
  const R=0.03, L=0.2, rings=7, zig=8;
  for(let r=0;r<rings;r++){
    const y0=-L/2+r*(L/rings)+L/rings/2, pts=[];
    for(let k=0;k<=zig*2;k++){ const a=k/(zig*2)*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(a)*R, y0+(k%2?1:-1)*L/rings*0.38, Math.sin(a)*R)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true,'catmullrom',0.1),zig*8,0.0016,5,true), strut, 0,0,0, mesh_g);
    if(r<rings-1) for(let k=0;k<3;k++){ const a=k/3*Math.PI*2+r*0.6; mesh(new THREE.CylinderGeometry(0.0013,0.0013,L/rings*0.3,5), strut, Math.cos(a)*R, y0+L/rings*0.5, Math.sin(a)*R, mesh_g); }
  }
  const balloon=mesh(new THREE.CapsuleGeometry(0.026,0.19,6,20), new THREE.MeshPhysicalMaterial({ color:0x7FA8FF, roughness:0.15, transparent:true, opacity:0.45, clearcoat:1 }), 0,0,0, g);
  mesh(new THREE.CylinderGeometry(0.006,0.006,0.14,10), std(0x3A6FD8,{roughness:.4}), 0,-0.17,0, g);   // catéter
  const b=deskBody(g,'Stent coronario','malla de cromo-cobalto o nitinol; el balón la expande para mantener abierta la arteria. Tócalo otra vez para plegarlo.', -0.5,-2.5, 0.03, 0.12, new THREE.Euler(0,0.45,Math.PI/2),
    [[new CANNON.Cylinder(0.033,0.033,0.22,12)],[new CANNON.Cylinder(0.008,0.008,0.14,6), new CANNON.Vec3(0,-0.17,0)]], 0.15);
  b.tap=()=>{ b.expanded=!b.expanded; const k=b.expanded?1.6:1;
    gsap.to([mesh_g.scale, balloon.scale],{ x:k, z:k, duration:D(.7), ease:'back.out(1.6)' });
    // la forma de choque también crece: el cilindro se sustituye por uno más ancho
    const old=b.body.shapes[0]; b.body.removeShape(old); b.body.addShape(new CANNON.Cylinder(0.033*k,0.033*k,0.22,12)); b.body.wakeUp(); }; }
// 3) Prótesis de cadera: un único sólido rígido con las mismas texturas que la grande
{ const g=new THREE.Group(), inner=new THREE.Group(), sc=0.052; g.add(inner);
  const stemMat=M.stem.clone(); stemMat.transparent=false; stemMat.opacity=1;
  const sb=mesh(new THREE.ExtrudeGeometry(s,{ depth:0.42, bevelEnabled:true, bevelThickness:0.14, bevelSize:0.12, bevelSegments:4, curveSegments:24 }), stemMat, 0,0,-0.21*sc, inner); sb.scale.setScalar(sc);
  const nk=mesh(new THREE.CylinderGeometry(0.24*sc,0.34*sc,1.75*sc,24), steel, 0,0,0, inner);
  nk.position.copy(neckDir.clone().multiplyScalar(0.95*sc)); nk.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), neckDir.clone().negate());
  const headMat=M.head.clone(); headMat.transparent=false; mesh(new THREE.SphereGeometry(sc,40,28), headMat, 0,0,0, inner);
  const linerMat=M.liner.clone(); linerMat.transmission=0; linerMat.transparent=false;
  mesh(shell(1.04*sc,1.26*sc,48), linerMat, 0,0,0, inner).rotation.z=0.62;
  const cupIn=M.cup.clone(); cupIn.transparent=false; mesh(shell(1.28*sc,1.48*sc,48), cupIn, 0,0,0, inner).rotation.z=0.62;
  const cupOut=M.cupOuter.clone(); cupOut.transparent=false; cupOut.map=null; cupOut.roughnessMap=null; cupOut.roughness=0.75; cupOut.color.set(0xC3C9D2); cupOut.bumpScale=1.5; mesh(new THREE.SphereGeometry(1.492*sc,64,24,0,Math.PI*2,0,Math.PI/2), cupOut, 0,0,0, inner).rotation.z=0.62;
  const bb=new THREE.Box3().setFromObject(inner), c=bb.getCenter(new THREE.Vector3()); inner.position.sub(c);   // centro del sólido en su origen
  // forma de choque compuesta: una esfera para cabeza + cotilo y una caja para el vástago
  g.updateMatrixWorld(true);
  const sbb=new THREE.Box3().setFromObject(sb), sc2=sbb.getCenter(new THREE.Vector3()), sh2=sbb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  const hipShapes=[[new CANNON.Sphere(1.49*sc), v3(inner.position)], [new CANNON.Box(new CANNON.Vec3(sh2.x,sh2.y,sh2.z)), v3(sc2)]];
  deskBody(g,'Prótesis total de cadera','vástago de Ti-6Al-4V con recubrimiento de hidroxiapatita, cabeza cerámica, inserto de UHMWPE y cotilo poroso, unidos como un solo sólido.', -0.1,-2.48, 0.04, 0.2, new THREE.Euler(-Math.PI/2,0,Math.PI/2-0.35), hipShapes, 0.35); }
// 4) Válvula tricúspide biológica: anillo de sutura, tres postes y tres velos de pericardio.
//    Cada velo es una superficie cosida al anillo y a los postes (sin huecos) cuyo borde libre se mueve con el latido.
const valveLeaves=[];
{ const g=new THREE.Group(), R=0.072, HP=0.05;                         // radio del anillo y altura de los postes
  mesh(new THREE.TorusGeometry(R+0.006,0.013,14,56), new THREE.MeshStandardMaterial({ map:fabric, roughness:1 }), 0,0,0, g).rotation.x=Math.PI/2;
  const frameM=new THREE.MeshPhysicalMaterial({ color:0xF2EFE8, roughness:0.5, clearcoat:0.3 });
  mesh(new THREE.TorusGeometry(R,0.004,8,56), frameM, 0,0.004,0, g).rotation.x=Math.PI/2;
  for(let k=0;k<3;k++){ const a=k*2*Math.PI/3; mesh(new THREE.CapsuleGeometry(0.0045,HP,4,8), frameM, Math.cos(a)*R,HP/2+0.004,Math.sin(a)*R, g); }
  const tissue=new THREE.MeshPhysicalMaterial({ color:0xF0D8BC, roughness:0.55, sheen:0.8, sheenColor:0xFFEAD2, clearcoat:0.2, side:THREE.DoubleSide });
  const NU=18, NV=10;
  for(let k=0;k<3;k++){
    const a0=k*2*Math.PI/3, a1=a0+2*Math.PI/3;
    const geo=new THREE.PlaneGeometry(1,1,NU,NV);                          // la rejilla se deforma cada fotograma
    const leaf=mesh(geo, tissue, 0,0,0, g); leaf.frustumCulled=false;
    valveLeaves.push({ geo, a0, a1, R, HP, NU, NV });
  }
  deskBody(g,'Válvula tricúspide','bioprótesis con tres velos de pericardio cosidos al anillo y a los postes; se abren y se cierran con cada latido.', 0.33,-2.5, 0.03, 0.1, new THREE.Euler(0,0,0),
    [[new CANNON.Cylinder(0.092,0.092,0.03,16)],[new CANNON.Cylinder(0.075,0.075,0.05,8), new CANNON.Vec3(0,0.035,0)]], 0.12);
  // la válvula se queda siempre tumbada: el anillo apoyado en la mesa; solo puede girar sobre su eje vertical
  deskBodies[deskBodies.length-1].body.angularFactor.set(0,1,0); }
// Posición de cada punto del velo: base = arco del anillo (cosido), borde libre = curva entre las puntas de dos postes
function updateValve(open){
  const P=new THREE.Vector3(), B=new THREE.Vector3(), F=new THREE.Vector3();
  for(const L of valveLeaves){
    const { geo, a0, a1, R, HP, NU, NV } = L, pos=geo.attributes.position;
    const am=(a0+a1)/2;
    // punto medio del borde libre: cerrado → en el centro (los tres velos coaptan); abierto → pegado a la pared, entre los postes
    const mClosed=new THREE.Vector3(Math.cos(am)*0.004, HP*0.55, Math.sin(am)*0.004);
    const mOpen=new THREE.Vector3(Math.cos(am)*R*0.92, HP*1.05, Math.sin(am)*R*0.92);
    const M=mClosed.clone().lerp(mOpen, open);
    const p0=new THREE.Vector3(Math.cos(a0)*R, HP+0.004, Math.sin(a0)*R), p1=new THREE.Vector3(Math.cos(a1)*R, HP+0.004, Math.sin(a1)*R);
    let idx=0;
    for(let j=0;j<=NV;j++){ const v=j/NV;
      for(let i=0;i<=NU;i++){ const u=i/NU, a=a0+(a1-a0)*u;
        B.set(Math.cos(a)*R, 0.006 + Math.sin(Math.PI*u)*0 , Math.sin(a)*R);                       // base cosida al anillo
        // los extremos de la base suben por los postes (comisuras)
        const side=Math.pow(Math.abs(u-0.5)*2, 6); B.y += side*(HP);
        F.copy(p0).multiplyScalar((1-u)*(1-u)).addScaledVector(M, 2*u*(1-u)).addScaledVector(p1, u*u);   // borde libre (Bézier)
        P.copy(B).lerp(F, v);
        // vientre del velo: se abomba hacia abajo cuando está cerrado
        P.y -= Math.sin(Math.PI*v)*Math.sin(Math.PI*u)*0.012*(1-open);
        pos.setXYZ(idx++, P.x, P.y, P.z);
      } }
    pos.needsUpdate=true; geo.computeVertexNormals();
  }
}
updateValve(0);
// 5) Desfibrilador-monitor de hospital (diseño inspirado en los equipos de carro de paradas):
//    carcasa de plástico gris claro, frontal oscuro con pantalla grande a la izquierda y mandos a la derecha,
//    asa de transporte, palas acopladas en alojamientos de la parte superior e impresora de ECG en el lateral.
const defib=new THREE.Group(); defib.position.set(0.86,TOP,-2.6); counter.add(defib); deskItems.push({obj:defib,x:0.86});
const DW=0.32, DH=0.2, DD=0.26;
const plastic=new THREE.MeshPhysicalMaterial({ color:0xDCE0E5, roughness:0.55, clearcoat:0.2 });
const darkM=new THREE.MeshPhysicalMaterial({ color:0x1E252D, roughness:0.4, clearcoat:0.3 });
const rubber=new THREE.MeshStandardMaterial({ color:0x2B3138, roughness:0.95 });
const accent=new THREE.MeshPhysicalMaterial({ color:0xF2B21B, roughness:0.4, clearcoat:0.4 });
mesh(new RoundedBoxGeometry(DW,DH,DD,4,0.028), plastic, 0,DH/2,0, defib);                                    // carcasa
mesh(new RoundedBoxGeometry(DW-0.014,DH-0.03,0.014,3,0.012), darkM, 0,DH/2-0.004,DD/2, defib);              // frontal
mesh(new THREE.BoxGeometry(DW+0.004,0.012,DD+0.004), accent, 0,0.02,0, defib);                               // banda de color en la base
for(const sx of [-1,1]) for(const sz of [-1,1]) mesh(new THREE.CapsuleGeometry(0.012,DH-0.06,4,8), rubber, sx*(DW/2-0.004),DH/2,sz*(DD/2-0.004), defib);   // topes de goma
// pantalla grande (ECG, energía y SpO2)
const dScreen=canvasPlane(0.17,0.12,340,240,(g,w,h,t)=>{ g.fillStyle='#02100C'; g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(95,242,210,.12)'; for(let y=20;y<h;y+=20){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); }
  const trace=(y0,col,f,amp)=>{ g.strokeStyle=col; g.lineWidth=2.5; g.beginPath(); for(let x=0;x<w;x+=2){ const p=(((x/w)*2-t*0.5*f)%1+1)%1; let y=y0;
      if(col==='#5FF2D2'){ if(p>.45&&p<.48)y-=amp; else if(p>.48&&p<.51)y+=amp*.35; else if(p>.6&&p<.7)y-=amp*.15; } else y=y0-Math.max(0,Math.sin(p*Math.PI*2))*amp*.6;
      x?g.lineTo(x,y):g.moveTo(x,y);} g.stroke(); };
  trace(70,'#5FF2D2',1,46); trace(140,'#7FB6FF',1,30);
  g.fillStyle='#5FF2D2'; g.font='700 30px Sora, sans-serif'; g.fillText('72',w-62,40);
  g.fillStyle='#7FB6FF'; g.font='700 22px Sora, sans-serif'; g.fillText('98%',w-62,128);
  g.fillStyle='#FFD25A'; g.font='700 34px Sora, sans-serif'; g.fillText('150 J',12,h-18);
  g.font='600 16px Sora, sans-serif'; g.fillText('BIFÁSICO · MANUAL',118,h-22); });
dScreen.position.set(-0.05,DH/2+0.01,DD/2+0.0075); defib.add(dScreen);
// teclas bajo la pantalla
for(let k=0;k<4;k++) mesh(new RoundedBoxGeometry(0.03,0.011,0.006,2,0.003), new THREE.MeshPhysicalMaterial({ color:0x3A444F, roughness:0.5 }), -0.11+k*0.04,0.03,DD/2+0.008, defib);
// mando de energía (con estrías), botón de carga y botón de descarga
const knob=new THREE.Group(); knob.position.set(0.1,DH/2+0.035,DD/2+0.008); knob.rotation.x=Math.PI/2; defib.add(knob);
mesh(new THREE.CylinderGeometry(0.022,0.024,0.014,24), darkM, 0,0.007,0, knob);
for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; mesh(new THREE.BoxGeometry(0.003,0.014,0.004), new THREE.MeshPhysicalMaterial({ color:0x4A5560 }), Math.cos(a)*0.023,0.007,Math.sin(a)*0.023, knob); }
mesh(new THREE.BoxGeometry(0.003,0.002,0.016), accent, 0,0.0145,-0.007, knob);
const chargeBtn=mesh(new THREE.CylinderGeometry(0.012,0.012,0.007,20), basicGlow(0xF2B21B,1.2), 0.08,0.035,DD/2+0.009, defib); chargeBtn.rotation.x=Math.PI/2;
const shockBtn=mesh(new THREE.CylinderGeometry(0.014,0.014,0.007,20), basicGlow(0xE5484D,1.3), 0.118,0.035,DD/2+0.009, defib); shockBtn.rotation.x=Math.PI/2;
// asa de transporte
for(const sx of [-0.1,0.1]) mesh(new THREE.BoxGeometry(0.018,0.035,0.03), plastic, sx,DH+0.016,-DD/2+0.045, defib);
const hdl=mesh(new THREE.CapsuleGeometry(0.011,0.18,6,12), darkM, 0,DH+0.038,-DD/2+0.045, defib); hdl.rotation.z=Math.PI/2;
// alojamientos de las palas en la parte superior
for(const sx of [-1,1]) mesh(new RoundedBoxGeometry(0.115,0.012,0.12,2,0.005), darkM, sx*0.075,DH+0.001,0.04, defib);
// impresora de ECG en el lateral, con su tira de papel
mesh(new RoundedBoxGeometry(0.012,0.05,0.12,2,0.004), darkM, DW/2+0.002,DH/2+0.02,0, defib);
const paper=mesh(new THREE.PlaneGeometry(0.1,0.035), new THREE.MeshStandardMaterial({ color:0xF7F5EE, roughness:0.9, side:THREE.DoubleSide }), DW/2+0.012,DH/2+0.02,0, defib); paper.rotation.y=Math.PI/2; paper.rotation.x=0.25;
// rejillas de ventilación en el otro lateral
for(let k=0;k<6;k++) mesh(new THREE.BoxGeometry(0.004,0.008,0.1), darkM, -DW/2-0.001,0.06+k*0.017,0, defib);
// conectores del cable de terapia
for(const sx of [-0.04,0.04]) mesh(new THREE.CylinderGeometry(0.01,0.01,0.02,14), darkM, sx,0.06,-DD/2-0.004, defib).rotation.x=Math.PI/2;

const paddles=[];
[-1,1].forEach((sgn,k)=>{
  const g=new THREE.Group();
  mesh(new RoundedBoxGeometry(0.085,0.008,0.062,2,0.004), steel, 0,0,0, g);                                          // electrodo
  mesh(new RoundedBoxGeometry(0.075,0.03,0.055,3,0.012), plastic, 0,0.018,0, g);                                    // carcasa aislante
  const grip=mesh(new THREE.CapsuleGeometry(0.013,0.055,6,12), darkM, 0,0.048,0, g); grip.rotation.z=Math.PI/2;    // empuñadura
  mesh(new THREE.BoxGeometry(0.008,0.02,0.02), darkM, -0.03,0.038,0, g); mesh(new THREE.BoxGeometry(0.008,0.02,0.02), darkM, 0.03,0.038,0, g);
  mesh(new THREE.CylinderGeometry(0.007,0.007,0.006,14), basicGlow(k?0xE5484D:0xF2B21B,1.6), 0.022,0.064,0, g);        // botón (descarga en ápex, carga en esternón)
  mesh(new THREE.BoxGeometry(0.03,0.002,0.012), new THREE.MeshBasicMaterial({ color:k?0xE5484D:0x1F6FB2 }), -0.012,0.0335,0.0276, g);   // etiqueta de color
  const b=deskBody(g, k?'Pala de ápex':'Pala de esternón', 'electrodo de acero con empuñadura aislante; la de ápex lleva el botón de descarga. Puedes sacarla hasta donde llega el cable.', 0.86+sgn*0.075, -2.56, 0.012, 0.06, null, null, 0.25);
  b.paddle=k; paddles.push(b);
});
const cableMat=new THREE.MeshPhysicalMaterial({ color:0x20262D, roughness:0.4, clearcoat:0.6 }), cables=paddles.map(()=>{ const m=new THREE.Mesh(new THREE.BufferGeometry(), cableMat); counter.add(m); return m; });
const CABLE=0.62;   // longitud máxima del cable

// Coloca todo según el ancho de la pantalla (en móvil, más juntos)
let deskK=1, defibBody=null;
function halfWidthAt(z){ const vf=THREE.MathUtils.degToRad(hubCam.fov)/2; return Math.abs(z)*Math.tan(vf)*hubCam.aspect*0.9; }
function layoutDesk(){
  deskK = THREE.MathUtils.clamp((innerWidth/innerHeight)/1.6, 0.42, 1);
  deskItems.forEach(it=>{ it.obj.position.x = it.x*deskK; });
  if(!defibBody) defibBody=staticBox(DW/2+0.01,DH/2,DD/2+0.01, 0,0,0);
  defibBody.position.set(defib.position.x, TOP+DH/2, defib.position.z);
  const hw=halfWidthAt(-2.6); sideWalls[0].position.x=-hw; sideWalls[1].position.x=hw;
  deskBodies.forEach(resetBody);
}
function paddleAnchor(b){ return new THREE.Vector3(defib.position.x + (b.paddle? 0.04:-0.04), TOP+0.06, defib.position.z-DD/2-0.012); }
function restSpot(b){ return new THREE.Vector3(defib.position.x + (b.paddle? 0.075:-0.075), TOP+DH+0.016, defib.position.z+0.04); }
function resetBody(b){
  const p = b.paddle!==undefined ? restSpot(b) : new THREE.Vector3(b.homeX*deskK, TOP+0.06, b.homeZ);
  b.body.position.set(p.x,p.y,p.z); b.body.quaternion.set(b.restQ.x,b.restQ.y,b.restQ.z,b.restQ.w);
  b.body.velocity.setZero(); b.body.angularVelocity.setZero(); b.body.wakeUp();
  b.obj.position.copy(b.body.position); b.obj.quaternion.copy(b.body.quaternion);
}
// Los cables solo se reconstruyen si alguna pala se ha movido (rehacer un tubo cada fotograma es costoso)
const ultimaPala = paddles.map(()=>new THREE.Vector3(1e9,0,0));
function updateCables(forzar){
  paddles.forEach((b,i)=>{ if(!forzar && b.obj.position.distanceToSquared(ultimaPala[i])<1e-8) return; ultimaPala[i].copy(b.obj.position);
    const a=paddleAnchor(b), p=b.obj.localToWorld(new THREE.Vector3(0,0.04,0)); counter.worldToLocal(p);
    const dist=a.distanceTo(p), slack=Math.max(0,CABLE-dist);
    const mid=a.clone().lerp(p,0.5); mid.y-=0.02+slack*0.35; mid.y=Math.max(mid.y,TOP+0.006);
    const curve=new THREE.CatmullRomCurve3([a, a.clone().lerp(mid,0.6), mid, p.clone().lerp(mid,0.4), p]);
    cables[i].geometry.dispose(); cables[i].geometry=new THREE.TubeGeometry(curve,20,0.006,6); });
}


// ---- Segunda capa de dibujo para la mesa (por delante de los textos HTML) ----
// "Capas" de Three.js: la mesa vive en la capa 1; el pasillo se dibuja con la capa 0 y la mesa aparte.
const deskRenderer = new THREE.WebGLRenderer({ canvas:document.getElementById('deskLayer'), antialias:!gamaBaja, alpha:true });
deskRenderer.setPixelRatio(pixelRatio); deskRenderer.setSize(innerWidth,innerHeight,false);
deskRenderer.toneMapping = THREE.ACESFilmicToneMapping; deskRenderer.toneMappingExposure = 0.9;
// cada lienzo WebGL necesita su propio entorno (no se pueden compartir texturas entre lienzos); se calcula una vez
const deskEnv = new THREE.PMREMGenerator(deskRenderer).fromScene(new RoomEnvironment(), 0.04).texture;
counter.traverse(o=>o.layers.set(1));
hubScene.traverse(o=>{ if(o.isLight) o.layers.enable(1); });
function renderDeskLayer(){
  const bg=hubScene.background, env=hubScene.environment, fog=hubScene.fog;
  hubScene.background=null; hubScene.environment=deskEnv; hubScene.fog=null;
  hubCam.layers.set(1); deskRenderer.render(hubScene, hubCam); hubCam.layers.set(0);
  hubScene.background=bg; hubScene.environment=env; hubScene.fog=fog;
}

// ---- Cada fotograma ----
// La capa de la mesa solo se redibuja cuando algo cambia: objetos en movimiento, arrastre,
// latido de la válvula (a 30 fps) o la mesa animándose al entrar o salir de una sala.
const tmpV=new THREE.Vector3();
let deskLastT=0, ultimoLatido=-1, ultimoY=null, forzarDibujo=true;
function actualizar(t){
  const dt=Math.min(Math.max(t-(deskLastT||t),0),1/15); deskLastT=t;
  let cambia = forzarDibujo; forzarDibujo=false;
  if(counter.position.y!==ultimoY){ ultimoY=counter.position.y; cambia=true; }
  if(estado.enSala){ if(cambia) renderDeskLayer(); return; }        // dentro de una sala no hay física ni latido
  // latido de la válvula y pantalla del desfibrilador, a 18 fotogramas por segundo
  const tick=Math.floor(t*18);
  if(tick!==ultimoLatido){ ultimoLatido=tick;
    const fase=(t*1.1)%1, open = fase<0.4 ? Math.sin(fase/0.4*Math.PI) : 0;
    updateValve(open); dScreen.userData.redraw(t); cambia=true; }
  const hayActivos = deskGrab || deskBodies.some(b=>b.body.sleepState!==CANNON.Body.SLEEPING);
  if(hayActivos){
    if(deskGrab) jointBody.position.copy(deskGrab.target);
    world.step(1/120, dt, 6);
    // el cable de las palas actúa como una cuerda: no deja que se alejen más de su longitud
    for(const b of paddles){ const a=paddleAnchor(b), P=b.body.position; tmpV.set(P.x-a.x,P.y-a.y,P.z-a.z); const L=tmpV.length();
      if(L>CABLE){ const z0=P.z; tmpV.multiplyScalar(CABLE/L); P.set(a.x+tmpV.x,a.y+tmpV.y,z0); const n=tmpV.normalize(), V=b.body.velocity, vn=V.x*n.x+V.y*n.y+V.z*n.z;
        if(vn>0){ V.x-=n.x*vn; V.y-=n.y*vn; V.z-=n.z*vn; } } }
    for(const b of deskBodies){
      if(b.body.sleepState===CANNON.Body.SLEEPING && !deskGrab) continue;   // quieto: nada que hacer
      const V=b.body.velocity, sp=V.length(); if(sp>3.5) V.scale(3.5/sp, V);  // límite de velocidad ante tirones bruscos
      const W=b.body.angularVelocity; if(Math.abs(W.z)>12) W.z=Math.sign(W.z)*12;
      if(b.body.position.y<TOP-0.6) resetBody(b);                            // si algo se escapa, vuelve a su sitio
      b.obj.position.copy(b.body.position); b.obj.quaternion.copy(b.body.quaternion); cambia=true;
    }
    updateCables();
  }
  if(cambia) renderDeskLayer();
}
function redimensionar(w,h){ deskRenderer.setSize(w,h,false); layoutDesk(); updateCables(true); forzarDibujo=true; }
layoutDesk(); updateCables(true);
// ---- Coger, arrastrar y lanzar (con un "muelle" que une el ratón y el objeto) ----
let deskGrab=null;
const jointBody=new CANNON.Body({ mass:0 }); jointBody.collisionFilterGroup=0; jointBody.collisionFilterMask=0; world.addBody(jointBody);
const deskRay=new THREE.Raycaster(), deskPtr=new THREE.Vector2();
deskRay.layers.enableAll();   // la mesa está en la capa 1
function deskSetRay(e){ deskPtr.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1); deskRay.setFromCamera(deskPtr, hubCam); }
function deskPointerDown(e){
  if(!listo) return false;
  hubCam.updateMatrixWorld(); deskSetRay(e);
  const hit=deskRay.intersectObjects(deskBodies.map(b=>b.obj), true)[0]; if(!hit) return false;
  const b=hit.object.userData.deskBody; if(!b) return false;
  const local=counter.worldToLocal(hit.point.clone());
  jointBody.position.copy(v3(local));
  const pivot=b.body.pointToLocalFrame(v3(local));
  const c=new CANNON.PointToPointConstraint(b.body, pivot, jointBody, new CANNON.Vec3(0,0,0), 12);
  world.addConstraint(c); b.body.wakeUp();
  deskGrab={ b, c, start:{x:e.clientX,y:e.clientY}, moved:false, zLock:local.z, target:local.clone() };
  document.getElementById('ringWrap').setPointerCapture(e.pointerId); document.getElementById('ringWrap').classList.add('grabbing');
  return true;
}
function deskPointerMove(e){
  const g=deskGrab; if(!g) return;
  if(Math.hypot(e.clientX-g.start.x,e.clientY-g.start.y)>5) g.moved=true;
  deskSetRay(e);
  const o=counter.worldToLocal(deskRay.ray.origin.clone()), dir=counter.worldToLocal(deskRay.ray.origin.clone().add(deskRay.ray.direction)).sub(o).normalize();
  if(Math.abs(dir.z)<1e-4) return;
  // el ratón se proyecta sobre el plano vertical del objeto (su profundidad no cambia)
  const k=(g.zLock-o.z)/dir.z; const target=o.clone().addScaledVector(dir,k);
  target.z=g.zLock; target.y=THREE.MathUtils.clamp(target.y,TOP+0.02,0.25);
  const hw=halfWidthAt(-2.6)-0.05; target.x=THREE.MathUtils.clamp(target.x,-hw,hw);
  g.target.copy(target);
}
function deskPointerUp(cancelar=false){
  const g=deskGrab; if(!g) return;
  const b=g.b; world.removeConstraint(g.c); document.getElementById('ringWrap').classList.remove('grabbing'); deskGrab=null;
  if(!cancelar && !g.moved){ if(b.tap) b.tap(); avisar(b.name+': '+b.info); }
}


listo = true;
return { contador:counter, actualizar, redimensionar, dibujar:()=>{ forzarDibujo=true; },
         bajarResolucion:(pr)=>{ deskRenderer.setPixelRatio(pr); deskRenderer.setSize(innerWidth,innerHeight,false); forzarDibujo=true; },
         pointerDown:deskPointerDown, pointerMove:deskPointerMove, pointerUp:deskPointerUp, pointerCancel:()=>deskPointerUp(true), agarrando:()=>!!deskGrab };
}
