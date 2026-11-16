/* =========================================================
   test.js · Motor común de los tests (clave "test" en las 6 vitrinas)
   Lee datos.preguntas: [{ pregunta, opciones[4], correcta (índice), explicacion }]
   - Baraja el orden de las preguntas y de las opciones en cada intento
   - Corrige al momento y enseña la explicación
   - Al final: nota, repaso de los fallos y opción de repetir solo esos
   Teclado: 1-4 o A-D para responder, Intro para seguir.
   ========================================================= */
import { esc, el, barajar, sinDatos, raiz } from './ui.js';

const LETRAS = ['A','B','C','D','E','F'];

// Descarta preguntas mal formadas para que un error en el JSON no rompa el test
function validas(preguntas){
  return (preguntas||[]).filter(p => p && p.pregunta && Array.isArray(p.opciones) && p.opciones.length>=2
    && Number.isInteger(p.correcta) && p.correcta>=0 && p.correcta<p.opciones.length);
}

export function pintarTest(contenedor, { datos }){
  const banco = validas(datos?.preguntas);
  if(!banco.length) return sinDatos(contenedor, 'preguntas de test');
  const r = raiz(contenedor, 'test');
  let ronda, i, aciertos, fallos, respondida;

  function empezar(preguntas){
    // Cada pregunta guarda sus opciones barajadas y sabe cuál es la buena
    ronda = barajar(preguntas).map(p => {
      const orden = barajar(p.opciones.map((t,k)=>k));
      return { p, opciones: orden.map(k=>p.opciones[k]), buena: orden.indexOf(p.correcta) };
    });
    i = 0; aciertos = 0; fallos = []; pintarPregunta();
  }

  function pintarPregunta(){
    respondida = false;
    const q = ronda[i];
    r.innerHTML = `
      <div class="test-progreso" aria-hidden="true"><span style="width:${(i/ronda.length)*100}%"></span></div>
      <p class="test-cuenta">Pregunta ${i+1} de ${ronda.length} <span>${aciertos} ${aciertos===1?'acierto':'aciertos'}</span></p>
      <h3 class="test-pregunta">${esc(q.p.pregunta)}</h3>
      <div class="test-opciones" role="group" aria-label="Opciones">
        ${q.opciones.map((t,k)=>`<button class="test-op" data-k="${k}"><span class="letra">${LETRAS[k]}</span><span>${esc(t)}</span></button>`).join('')}
      </div>
      <div class="test-feedback" aria-live="polite"></div>`;
    r.querySelectorAll('.test-op').forEach(b=>b.addEventListener('click',()=>responder(+b.dataset.k)));
    r.focus({ preventScroll:true });
    r.closest('.cuerpo')?.scrollTo({ top:0 });
  }

  function responder(k){
    if(respondida) return; respondida = true;
    const q = ronda[i], ok = k===q.buena;
    if(ok) aciertos++; else fallos.push(q.p);
    r.querySelectorAll('.test-op').forEach((b,j)=>{
      b.disabled = true;
      if(j===q.buena) b.classList.add('buena');
      else if(j===k) b.classList.add('mala');
    });
    const ultima = i===ronda.length-1;
    const fb = r.querySelector('.test-feedback');
    fb.innerHTML = `<div class="test-explica ${ok?'ok':'ko'}">
        <b>${ok?'Correcto.':`No es esa. La respuesta es la ${LETRAS[q.buena]}.`}</b>
        ${q.p.explicacion?`<p>${esc(q.p.explicacion)}</p>`:''}
      </div>
      <button class="btn-primario" id="testSigue">${ultima?'Ver resultado':'Siguiente pregunta'}</button>`;
    const sigue = fb.querySelector('#testSigue');
    sigue.addEventListener('click',()=>{ if(ultima) pintarFinal(); else { i++; pintarPregunta(); } });
    sigue.focus({ preventScroll:true });
    fb.scrollIntoView({ block:'nearest', behavior:'smooth' });
  }

  function pintarFinal(){
    const n = ronda.length, nota = Math.round(aciertos/n*100);
    const frase = nota===100 ? 'Todo bien. Te lo sabes.'
      : nota>=70 ? 'Buen resultado. Repasa los fallos y lo tienes.'
      : nota>=50 ? 'Aprobado justo. Merece la pena repasar los fallos.'
      : 'Toca repasar. Vuelve a la sala y repite el test.';
    r.innerHTML = `
      <div class="test-final">
        <p class="test-nota"><b>${aciertos}</b><span>/${n}</span></p>
        <p class="test-frase">${frase}</p>
        <div class="test-botones">
          ${fallos.length?'<button class="btn-primario" id="testFallos">Repetir solo los fallos</button>':''}
          <button class="btn-secundario" id="testOtra">Repetir el test completo</button>
        </div>
      </div>
      ${fallos.length?`<h4 class="test-repaso-tit">Para repasar</h4><ol class="test-repaso">${fallos.map(p=>`
        <li><b>${esc(p.pregunta)}</b><p class="resp">${esc(p.opciones[p.correcta])}</p>${p.explicacion?`<p>${esc(p.explicacion)}</p>`:''}</li>`).join('')}</ol>`:''}`;
    const repaso = fallos.slice();
    r.querySelector('#testFallos')?.addEventListener('click',()=>empezar(repaso));
    r.querySelector('#testOtra').addEventListener('click',()=>empezar(banco));
    (r.querySelector('#testFallos')||r.querySelector('#testOtra')).focus({ preventScroll:true });
  }

  // Teclado: solo mientras el foco está dentro del test
  r.addEventListener('keydown', e=>{
    if(!ronda || !r.querySelector('.test-op')) return;
    if(respondida && e.key==='Enter' && !e.target.closest('button')){
      e.preventDefault(); r.querySelector('#testSigue')?.click(); return;
    }
    const k = '123456'.indexOf(e.key)>=0 ? +e.key-1 : 'abcdef'.indexOf(e.key.toLowerCase());
    if(k>=0 && k<ronda[i].opciones.length && !respondida && !e.ctrlKey && !e.metaKey && !e.altKey){ e.preventDefault(); responder(k); }
  });

  empezar(banco);
}
