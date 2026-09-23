/* =========================================================
   juego.js — lógica de todos los minijuegos usados en historia.html
   ========================================================= */

/* ---------- JUEGO: el botón "No" que huye ---------- */
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

  btnNo.addEventListener('mouseenter', moverBoton);
  btnNo.addEventListener('touchstart', (e) => { e.preventDefault(); moverBoton(); }, { passive: false });

  btnSi.addEventListener('click', () => {
    mensaje.textContent = 'Sabía que dirías que sí ❤';
    btnNo.style.display = 'none';
    btnSi.disabled = true;
    desbloquearContinuar(btnSi);
  });
}

/* ---------- JUEGO: memoria (encuentra las parejas) ---------- */
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
        desbloquearContinuar(tablero);
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

/* ---------- JUEGO: máquina expendedora ---------- */
// Pulsar el botón activa la animación; al terminar se revela el
// contenido de dentro de .resultado (duplica el bloque en el HTML
// para poner tu propia tira de fotos, mensaje, etc.)
function initMaquina() {
  document.querySelectorAll('.maquina').forEach((maquina) => {
    const boton = maquina.querySelector('.btn');
    const resultado = maquina.querySelector('.resultado');
    if (!boton) return;
    boton.addEventListener('click', () => {
      if (maquina.classList.contains('activada')) return;
      maquina.classList.add('activada');
      boton.disabled = true;
      setTimeout(() => {
        if (resultado) resultado.classList.add('show');
        desbloquearContinuar(maquina);
      }, 850); // coincide con la duración de la transición del "producto" en CSS
    });
  });
}

/* ---------- JUEGO: hilo para arrastrar (interruptor de cordón) ---------- */
// El usuario tiene que arrastrar el "asa" desde arriba hasta abajo del
// carril para revelar el mensaje. Funciona con ratón y con dedo.
function initHiloArrastrable() {
  document.querySelectorAll('.hilo-arrastrable').forEach((caja) => {
    const asa = caja.querySelector('.asa');
    if (!asa) return;
    const margen = 8;
    let arrastrando = false;

    function limites() {
      return { min: margen, max: caja.clientHeight - asa.offsetHeight - margen };
    }

    function posicionar(y) {
      const { min, max } = limites();
      const clamped = Math.min(max, Math.max(min, y));
      asa.style.top = clamped + 'px';
      return clamped >= max - 4;
    }

    function coordenadaY(evento) {
      const rect = caja.getBoundingClientRect();
      const clientY = evento.touches ? evento.touches[0].clientY : evento.clientY;
      return clientY - rect.top - asa.offsetHeight / 2;
    }

    function empezar() {
      arrastrando = true;
      asa.style.cursor = 'grabbing';
    }
    function mover(e) {
      if (!arrastrando) return;
      e.preventDefault();
      posicionar(coordenadaY(e));
    }
    function soltar() {
      if (!arrastrando) return;
      arrastrando = false;
      asa.style.cursor = 'grab';
      const { max } = limites();
      const actual = parseFloat(asa.style.top || '8');
      if (actual >= max - 4) {
        caja.classList.add('completo');
        desbloquearContinuar(caja);
      } else {
        posicionar(margen); // no llegó abajo del todo: vuelve arriba
      }
    }

    asa.addEventListener('mousedown', empezar);
    asa.addEventListener('touchstart', empezar, { passive: true });
    window.addEventListener('mousemove', mover);
    window.addEventListener('touchmove', mover, { passive: false });
    window.addEventListener('mouseup', soltar);
    window.addEventListener('touchend', soltar);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initBotonHuidizo();
  initMemoria();
  initMaquina();
  initHiloArrastrable();
});
