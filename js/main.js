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

// --- Letras recortadas de periódico / pegatinas de burbuja ---
// Busca cada <span class="sticker-word" data-text="...">, la rellena con
// una letra por recorte. Dos estilos posibles según data-estilo:
//  - "periodico" (por defecto): papel de tono distinto, tipografía distinta
//    (mezcla de fuentes, como si vinieran de periódicos distintos), tamaño y
//    rotación ligeramente al azar, borde irregular tipo "papel rasgado".
//  - "burbuja": pegatinas de scrapbook infantiles, letra a letra en colores
//    del arcoíris (paleta --c1..--c5), forma redondeada tipo globo/burbuja
//    con sombra "puffy", como las letras troqueladas de "NAVIDAD" del álbum.
// Uso: <span class="sticker-word" data-text="FELIZ" data-estilo="burbuja"></span>
function initStickerWords() {
  const tonosPapel = ['#efe8d8', '#e6dfc9', '#f2ecdd', '#e3dcc6', '#eee6d1'];
  const fuentes = [
    "Georgia, 'Times New Roman', serif",
    "'Courier New', Courier, monospace",
    "Arial, Helvetica, sans-serif",
    "'Times New Roman', Times, serif",
    "'Trebuchet MS', sans-serif"
  ];
  const recortes = ['recorte-1', 'recorte-2', 'recorte-3'];
  const coloresBurbuja = ['#f4d35e', '#4ecdc4', '#ff6b9d', '#ff8c42', '#95e1b3'];

  document.querySelectorAll('.sticker-word').forEach((contenedor) => {
    const texto = contenedor.dataset.text || contenedor.textContent;
    const estilo = contenedor.dataset.estilo === 'burbuja' ? 'burbuja' : 'periodico';
    contenedor.textContent = '';
    contenedor.classList.add('sticker-word-' + estilo);

    let indiceColor = Math.floor(Math.random() * coloresBurbuja.length);
    [...texto].forEach((letra) => {
      const span = document.createElement('span');

      if (estilo === 'burbuja') {
        span.className = 'sticker-letter burbuja';
        span.textContent = letra === ' ' ? '\u00A0' : letra;
        if (letra !== ' ') {
          span.style.background = coloresBurbuja[indiceColor % coloresBurbuja.length];
          indiceColor++;
        } else {
          span.style.background = 'transparent';
          span.style.boxShadow = 'none';
        }
        const r1 = 8 + Math.random() * 10, r2 = 8 + Math.random() * 10;
        const r3 = 8 + Math.random() * 10, r4 = 8 + Math.random() * 10;
        span.style.borderRadius = `${r1}px ${r2}px ${r3}px ${r4}px`;
        const giro = (Math.random() * 14 - 7).toFixed(1);
        span.style.transform = `rotate(${giro}deg)`;
      } else {
        const recorte = recortes[Math.floor(Math.random() * recortes.length)];
        span.className = 'sticker-letter ' + recorte;
        span.textContent = letra === ' ' ? '\u00A0' : letra;
        span.style.background = tonosPapel[Math.floor(Math.random() * tonosPapel.length)];
        span.style.fontFamily = fuentes[Math.floor(Math.random() * fuentes.length)];
        span.style.fontWeight = Math.random() > 0.5 ? '700' : '400';
        span.style.fontStyle = Math.random() > 0.85 ? 'italic' : 'normal';
        const escala = (0.9 + Math.random() * 0.3).toFixed(2);
        const giro = (Math.random() * 16 - 8).toFixed(1);
        span.style.transform = `rotate(${giro}deg) scale(${escala})`;
      }
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

// --- Corazón para completar: puzzle de verdad ---
// Patrón de 7 columnas fijo; 1 = pieza del corazón (clicable), 0 = hueco.
// En vez de simples casillas cuadradas, cada pieza se dibuja como una
// pieza de puzzle real (con "lengüeta" hacia fuera o "hueco" hacia dentro
// en cada borde compartido con la pieza vecina, igual que un puzzle físico
// de cartón). El encaje es aleatorio cada vez que se carga la página, pero
// SIEMPRE es coherente entre dos piezas vecinas (si una saca lengüeta, la
// otra tiene el hueco a juego), gracias a SVG_TABS_AMPLITUD y a que el
// signo de cada borde se decide una sola vez y se reutiliza en ambos lados.
const PATRON_CORAZON_DEFECTO = [
  [0,1,0,0,0,1,0],
  [1,1,1,0,1,1,1],
  [1,1,1,1,1,1,1],
  [0,1,1,1,1,1,0],
  [0,0,1,1,1,0,0],
  [0,0,0,1,0,0,0]
];

// Dibuja el tramo de borde entre (x1,y1) y (x2,y2). signo 0 = recto (borde
// exterior); signo +1/-1 = lengüeta hacia un lado u otro del segmento.
function tramoPiezaPuzzle(x1, y1, x2, y2, signo, amplitud) {
  if (!signo) return ` L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  const dx = x2 - x1, dy = y2 - y1;
  const largo = Math.hypot(dx, dy);
  const ux = dx / largo, uy = dy / largo;
  const nx = -uy * signo, ny = ux * signo;
  const punto = (t) => [x1 + ux * largo * t, y1 + uy * largo * t];
  const offset = (p, k) => [p[0] + nx * amplitud * k, p[1] + ny * amplitud * k];
  const a = punto(0.38), medio = punto(0.5), b = punto(0.62);
  const c1 = offset(punto(0.44), 0.95);
  const cMedio = offset(medio, 1.05);
  const c2 = offset(punto(0.56), 0.95);
  return (
    ` L ${a[0].toFixed(2)} ${a[1].toFixed(2)}` +
    ` C ${offset(a, 0.55)[0].toFixed(2)} ${offset(a, 0.55)[1].toFixed(2)}, ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${cMedio[0].toFixed(2)} ${cMedio[1].toFixed(2)}` +
    ` C ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${offset(b, 0.55)[0].toFixed(2)} ${offset(b, 0.55)[1].toFixed(2)}, ${b[0].toFixed(2)} ${b[1].toFixed(2)}` +
    ` L ${x2.toFixed(2)} ${y2.toFixed(2)}`
  );
}

function initCorazonPuzzle() {
  document.querySelectorAll('.corazon-puzzle').forEach((contenedor) => {
    const patron = PATRON_CORAZON_DEFECTO;
    const filas = patron.length, cols = patron[0].length;
    const celda = 54; // tamaño lógico de cada pieza (el SVG luego se escala por CSS)
    const amplitud = celda * 0.15;
    const progreso = contenedor.parentElement.querySelector('.corazon-progreso');
    const mensaje = contenedor.parentElement.querySelector('.corazon-mensaje');

    const esHueco = (f, c) => f < 0 || f >= filas || c < 0 || c >= cols || patron[f][c] !== 1;

    // Un signo aleatorio por cada borde interno compartido (derecha / abajo
    // de cada pieza); el vecino usará el mismo signo invertido, así encajan.
    const signoDerecha = {}, signoAbajo = {};
    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < cols; c++) {
        if (patron[f][c] !== 1) continue;
        if (!esHueco(f, c + 1)) signoDerecha[f + ',' + c] = Math.random() > 0.5 ? 1 : -1;
        if (!esHueco(f + 1, c)) signoAbajo[f + ',' + c] = Math.random() > 0.5 ? 1 : -1;
      }
    }

    const svgNS = 'http://www.w3.org/2000/svg';
    const ancho = cols * celda, alto = filas * celda;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'Puzzle de corazón');

    let totalPiezas = 0, piezasLlenas = 0;

    patron.forEach((fila, f) => {
      fila.forEach((valor, c) => {
        if (valor !== 1) return;
        totalPiezas++;
        const x0 = c * celda, y0 = f * celda;
        const x1 = x0 + celda, y1 = y0;
        const x2 = x0 + celda, y2 = y0 + celda;
        const x3 = x0, y3 = y0 + celda;
        let d = `M ${x0} ${y0}`;
        // arriba
        d += esHueco(f - 1, c) ? ` L ${x1} ${y1}` : tramoPiezaPuzzle(x0, y0, x1, y1, -(signoAbajo[(f - 1) + ',' + c] || 0), amplitud);
        // derecha
        d += esHueco(f, c + 1) ? ` L ${x2} ${y2}` : tramoPiezaPuzzle(x1, y1, x2, y2, signoDerecha[f + ',' + c] || 0, amplitud);
        // abajo
        d += esHueco(f + 1, c) ? ` L ${x3} ${y3}` : tramoPiezaPuzzle(x2, y2, x3, y3, signoAbajo[f + ',' + c] || 0, amplitud);
        // izquierda + cierre
        d += esHueco(f, c - 1) ? ' Z' : tramoPiezaPuzzle(x3, y3, x0, y0, -(signoDerecha[f + ',' + (c - 1)] || 0), amplitud) + ' Z';

        const pieza = document.createElementNS(svgNS, 'path');
        pieza.setAttribute('d', d);
        pieza.setAttribute('class', 'corazon-pieza vacia');
        pieza.setAttribute('tabindex', '0');
        pieza.setAttribute('role', 'button');
        const activar = () => {
          if (pieza.classList.contains('llena')) return;
          pieza.classList.remove('vacia');
          pieza.classList.add('llena');
          piezasLlenas++;
          if (progreso) progreso.textContent = piezasLlenas + ' / ' + totalPiezas;
          if (piezasLlenas === totalPiezas && mensaje) {
            mensaje.classList.add('show');
            desbloquearContinuar(contenedor);
          }
        };
        pieza.addEventListener('click', activar);
        pieza.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activar(); }
        });
        svg.appendChild(pieza);
      });
    });

    contenedor.appendChild(svg);
    if (progreso) progreso.textContent = '0 / ' + totalPiezas;
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
      const path = entry.target.querySelector('.hilo-trazo');
      if (path && !path.dataset.dibujado) {
        const largo = path.getTotalLength();
        path.style.strokeDasharray = largo;
        path.style.strokeDashoffset = largo;
        path.getBoundingClientRect(); // fuerza reflow
        path.style.transition = 'stroke-dashoffset 1.4s ease';
        path.style.strokeDashoffset = '0';
        path.dataset.dibujado = 'true';
      }
      // [v7] las puntaditas y corazones del hilo se revelan justo después
      entry.target.classList.add('en-vista');
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
