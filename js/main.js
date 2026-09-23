/* =========================================================
   main.js — lógica compartida entre todas las páginas
   ========================================================= */

// Marca el enlace de navegación correspondiente a la página actual
(function marcarNavActiva() {
  const aqui = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach((enlace) => {
    if (enlace.getAttribute('href') === aqui) {
      enlace.classList.add('active');
    }
  });
})();

// Pequeño fundido de entrada al cargar cada página (evita el "salto" brusco)
(function fundidoEntrada() {
  document.documentElement.style.opacity = '0';
  window.addEventListener('DOMContentLoaded', () => {
    document.documentElement.style.transition = 'opacity 0.5s ease';
    requestAnimationFrame(() => {
      document.documentElement.style.opacity = '1';
    });
  });
})();

/* =========================================================
   Componentes estilo scrapbook — reutilizables en cualquier página
   ========================================================= */

// --- Letras de colores tipo pegatina ---
// Busca cada <span class="sticker-word" data-text="...">, la rellena
// con una letra por bloque, color aleatorio de la paleta y ligera rotación.
function initStickerWords() {
  const paleta = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
  document.querySelectorAll('.sticker-word').forEach((contenedor) => {
    const texto = contenedor.dataset.text || contenedor.textContent;
    contenedor.textContent = '';
    [...texto].forEach((letra) => {
      const span = document.createElement('span');
      span.className = 'sticker-letter';
      span.textContent = letra === ' ' ? '\u00A0' : letra;
      const color = paleta[Math.floor(Math.random() * paleta.length)];
      span.style.background = `var(--${color})`;
      span.style.transform = `rotate(${(Math.random() * 10 - 5).toFixed(1)}deg)`;
      contenedor.appendChild(span);
    });
  });
}

// --- Tira de fotos "tira hacia abajo" ---
// Cualquier .pull-photo con un .pull-tab dentro se abre/cierra al hacer clic.
function initPullPhoto() {
  document.querySelectorAll('.pull-photo').forEach((caja) => {
    const tab = caja.querySelector('.pull-tab');
    if (!tab) return;
    tab.addEventListener('click', () => caja.classList.toggle('open'));
  });
}

// --- Corazón para completar ---
// Patrón de 7 columnas fijo; 1 = celda del corazón (clicable), 0 = hueco.
// Se puede reutilizar tantas veces como quieras en la misma página:
// cada .corazon-puzzle del HTML necesita su propio patrón vía data-patron
// (opcional) o usa el patrón por defecto de abajo.
const PATRON_CORAZON_DEFECTO = [
  [0,1,0,0,0,1,0],
  [1,1,1,0,1,1,1],
  [1,1,1,1,1,1,1],
  [0,1,1,1,1,1,0],
  [0,0,1,1,1,0,0],
  [0,0,0,1,0,0,0]
];

function initCorazonPuzzle() {
  document.querySelectorAll('.corazon-puzzle').forEach((grid) => {
    const patron = PATRON_CORAZON_DEFECTO;
    const progreso = grid.parentElement.querySelector('.corazon-progreso');
    const mensaje = grid.parentElement.querySelector('.corazon-mensaje');
    let totalCeldas = 0;
    let celdasLlenas = 0;

    patron.forEach((fila) => {
      fila.forEach((valor) => {
        const celda = document.createElement('div');
        if (valor === 1) {
          celda.className = 'corazon-celda vacia';
          totalCeldas++;
          celda.addEventListener('click', () => {
            if (celda.classList.contains('llena')) return;
            celda.classList.remove('vacia');
            celda.classList.add('llena');
            celdasLlenas++;
            if (progreso) progreso.textContent = celdasLlenas + ' / ' + totalCeldas;
            if (celdasLlenas === totalCeldas && mensaje) {
              mensaje.classList.add('show');
              desbloquearContinuar(grid);
            }
          });
        } else {
          celda.className = 'corazon-celda hueco';
        }
        grid.appendChild(celda);
      });
    });
    if (progreso) progreso.textContent = '0 / ' + totalCeldas;
  });
}

// --- Hilo animado que conecta dos elementos ---
// El <path> dentro de .hilo-svg se dibuja solo cuando la zona entra en pantalla.
function initHilo() {
  const zonas = document.querySelectorAll('.hilo-zona');
  if (!zonas.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const path = entry.target.querySelector('.hilo-svg path');
      if (path && !path.dataset.dibujado) {
        const largo = path.getTotalLength();
        path.style.strokeDasharray = largo;
        path.style.strokeDashoffset = largo;
        path.getBoundingClientRect(); // fuerza reflow
        path.style.transition = 'stroke-dashoffset 1.4s ease';
        path.style.strokeDashoffset = '0';
        path.dataset.dibujado = 'true';
      }
    });
  }, { threshold: 0.4 });
  zonas.forEach((z) => io.observe(z));
}

document.addEventListener('DOMContentLoaded', () => {
  initStickerWords();
  initPullPhoto();
  initCorazonPuzzle();
  initHilo();
});

/* --- Ayudante compartido: desbloquea el botón "Continuar" de la escena
   a la que pertenece un elemento, cuando se completa un minijuego. --- */
function desbloquearContinuar(elementoDentroDeEscena) {
  const escena = elementoDentroDeEscena.closest('.escena');
  if (!escena) return;
  const boton = escena.querySelector('.continuar');
  if (boton) boton.removeAttribute('disabled');
  const pista = escena.querySelector('.pista-bloqueo');
  if (pista) pista.style.display = 'none';
}
