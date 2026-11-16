/* =========================================================
   ui.js · Ayudas para pintar las actividades del visor (HTML, no 3D)
   ========================================================= */

// Escapa texto para meterlo en HTML sin riesgo (los datos vienen de los JSON)
export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

// Crea un elemento a partir de un trozo de HTML
export function el(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

// Baraja una copia del array (Fisher-Yates)
export function barajar(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

// Mensaje cuando a una sala le faltan datos para una actividad
export function sinDatos(contenedor, que){
  contenedor.innerHTML = `<p class="visor-carga">Todavía no hay ${esc(que)} en los datos de esta sala.</p>`;
}

// Raíz de una actividad: recibe el teclado sin escuchar en toda la página
export function raiz(contenedor, clase){
  const r = el(`<div class="actv ${clase}" tabindex="-1"></div>`);
  contenedor.appendChild(r);
  return r;
}
