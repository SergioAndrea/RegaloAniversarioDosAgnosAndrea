/* =========================================================
   juego.js — lógica de los mini-juegos de juegos.html
   ========================================================= */

/* ---------- JUEGO 1: el botón "No" que huye ---------- */
// Cada vez que el cursor/dedo se acerca al botón "No", lo movemos
// a una posición aleatoria dentro de su contenedor.
function initBotonHuidizo() {
  const zona = document.getElementById('zona-boton');
  const btnNo = document.getElementById('btn-no');
  const btnSi = document.getElementById('btn-si');
  const mensaje = document.getElementById('mensaje-pregunta');
  if (!zona || !btnNo || !btnSi) return;

  let intentos = 0;
  const frasesEscape = [
    'Ni lo intentes 😏',
    'No tan rápido...',
    '¿Otra vez?',
    'Eh, quieta esa mano',
    'Esto no va a pasar'
  ];

  function moverBoton() {
    const maxX = zona.clientWidth - btnNo.offsetWidth - 16;
    const maxY = zona.clientHeight - btnNo.offsetHeight - 16;
    const x = Math.max(0, Math.random() * maxX);
    const y = Math.max(0, Math.random() * maxY);
    btnNo.style.left = x + 'px';
    btnNo.style.top = y + 'px';
    intentos++;
    if (intentos > 2) {
      mensaje.textContent = frasesEscape[Math.min(intentos - 3, frasesEscape.length - 1)];
    }
  }

  // Escritorio: huye al pasar el ratón cerca. Móvil: huye al tocar.
  btnNo.addEventListener('mouseenter', moverBoton);
  btnNo.addEventListener('touchstart', (e) => { e.preventDefault(); moverBoton(); }, { passive: false });

  btnSi.addEventListener('click', () => {
    mensaje.textContent = 'Sabía que dirías que sí ❤';
    btnNo.style.display = 'none';
    btnSi.disabled = true;
  });
}

/* ---------- JUEGO 2: memoria (encuentra las parejas) ---------- */
// 8 cartas = 4 parejas. Sustituye las etiquetas por fotos reales (R2) cuando las tengas.
function initMemoria() {
  const tablero = document.getElementById('tablero-memoria');
  if (!tablero) return;

  // Sergio: cambia estas 4 etiquetas por 4 URLs de foto de R2 si quieres usar fotos reales
  const simbolos = ['01', '02', '03', '04'];
  let cartas = [...simbolos, ...simbolos]
    .map((valor, i) => ({ valor, id: i }))
    .sort(() => Math.random() - 0.5);

  let primeraCarta = null;
  let bloqueado = false;
  let parejasEncontradas = 0;
  const totalParejas = simbolos.length;
  const contador = document.getElementById('contador-memoria');

  tablero.innerHTML = '';
  cartas.forEach((carta) => {
    const el = document.createElement('button');
    el.className = 'carta-memoria';
    el.setAttribute('aria-label', 'Carta boca abajo');
    el.dataset.valor = carta.valor;
    el.innerHTML = '<span class="cara cara-atras">?</span><span class="cara cara-frente">' + carta.valor + '</span>';
    el.addEventListener('click', () => manejarClick(el));
    tablero.appendChild(el);
  });

  function manejarClick(el) {
    if (bloqueado || el.classList.contains('volteada') || el.classList.contains('encontrada')) return;
    el.classList.add('volteada');

    if (!primeraCarta) {
      primeraCarta = el;
      return;
    }

    if (primeraCarta.dataset.valor === el.dataset.valor) {
      primeraCarta.classList.add('encontrada');
      el.classList.add('encontrada');
      primeraCarta = null;
      parejasEncontradas++;
      if (contador) contador.textContent = parejasEncontradas + ' / ' + totalParejas;
      if (parejasEncontradas === totalParejas) {
        const final = document.getElementById('memoria-final');
        if (final) final.classList.add('show');
      }
    } else {
      bloqueado = true;
      setTimeout(() => {
        primeraCarta.classList.remove('volteada');
        el.classList.remove('volteada');
        primeraCarta = null;
        bloqueado = false;
      }, 700);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initBotonHuidizo();
  initMemoria();
});
