/* =========================================================
   juego.js — lógica de todos los minijuegos usados en historia.html
   ========================================================= */

// [v4] Corazón SVG para insertar dentro de textos (sustituye al emoji)
const ICONO_CORAZON = '<svg class="icono-inline" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C5 15.5 2 12.2 2 8.6 2 5.6 4.3 3.5 7 3.5c2 0 3.9 1.1 5 2.9 1.1-1.8 3-2.9 5-2.9 2.7 0 5 2.1 5 5.1 0 3.6-3 6.9-10 12.4z"/></svg>';

// [v4] Respeta "reducir movimiento" también en las animaciones hechas con JS
const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- JUEGO: el botón "No" que huye ---------- */
function initBotonHuidizo() {
  const zona = document.getElementById('zona-boton');
  const btnNo = document.getElementById('btn-no');
  const btnSi = document.getElementById('btn-si');
  const mensaje = document.getElementById('mensaje-pregunta');
  if (!zona || !btnNo || !btnSi) return;

  let intentos = 0;
  const frasesEscape = [
    'Ni lo intentes...',
    'No tan rápido...',
    '¿Otra vez?',
    'Eh, quieta esa mano',
    'Esto no va a pasar'
  ];

  // [v7] El "No" nunca debe caer encima del "Sí": se calcula el hueco que
  // ocupa el Sí dentro de la zona (con un margen) y se sortean posiciones
  // hasta encontrar una que no lo pise (o, si no hay suerte, la última
  // probada, que en la práctica casi siempre estará libre igualmente).
  function moverBoton() {
    const zonaRect = zona.getBoundingClientRect();
    const siRect = btnSi.getBoundingClientRect();
    const margen = 12;
    const siCaja = {
      left: siRect.left - zonaRect.left - margen,
      top: siRect.top - zonaRect.top - margen,
      right: siRect.right - zonaRect.left + margen,
      bottom: siRect.bottom - zonaRect.top + margen
    };

    const maxX = Math.max(0, zona.clientWidth - btnNo.offsetWidth - 16);
    const maxY = Math.max(0, zona.clientHeight - btnNo.offsetHeight - 16);

    let x, y, intentosColocar = 0;
    do {
      x = Math.random() * maxX;
      y = Math.random() * maxY;
      intentosColocar++;
    } while (
      intentosColocar < 25 &&
      x < siCaja.right && x + btnNo.offsetWidth > siCaja.left &&
      y < siCaja.bottom && y + btnNo.offsetHeight > siCaja.top
    );

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
    // [v7] Corazón blanco (el vuestro), no rosa
    mensaje.innerHTML = 'Sabía que dirías que sí ' + ICONO_CORAZON.replace('icono-inline', 'icono-inline icono-corazon-blanco');
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
// ---------- JUEGO: máquina expendedora ----------
// Secuencia al pulsar: 1) la moneda de 1€ se desliza hacia la ranura y
// desaparece (efecto "metida"), 2) el producto cae por dentro de la
// ventana, 3) la trampilla se abre, 4) la tira de fotos asoma en la boca
// de la máquina y, un instante después, se AMPLÍA a pantalla completa
// (como la carta de la leyenda del hilo rojo) para poder verla bien.
// El elemento .resultado se reutiliza tal cual: solo se traslada dentro
// del lightbox y se devuelve a su sitio original al cerrar.
function initMaquina() {
  document.querySelectorAll('.maquina').forEach((maquina) => {
    const boton = maquina.querySelector('.btn');
    const resultado = maquina.querySelector('.resultado');
    const moneda = maquina.querySelector('.moneda');
    if (!boton) return;

    const lightbox = document.getElementById('ticket-lightbox');
    const lightboxInterior = lightbox ? lightbox.querySelector('.ticket-lightbox-interior') : null;
    const btnCerrar = lightbox ? lightbox.querySelector('.ticket-cerrar') : null;
    let sitioOriginal = null; // { padre, siguiente } para devolver el resultado a su hueco

    function ampliarTicket() {
      if (!resultado || !lightbox || !lightboxInterior) return;
      sitioOriginal = { padre: resultado.parentElement, siguiente: resultado.nextSibling };
      lightboxInterior.appendChild(resultado);
      lightbox.classList.add('show');
      lightbox.setAttribute('aria-hidden', 'false');
    }
    // [v7] Al cerrar el ticket, la tira vuelve a su sitio pero se esconde
    // otra vez (antes se quedaba visible debajo de la máquina) y la propia
    // máquina se resetea para poder meter otra moneda y repetir el juego.
    function cerrarTicket() {
      if (!resultado || !lightbox) return;
      lightbox.classList.remove('show');
      lightbox.setAttribute('aria-hidden', 'true');
      if (sitioOriginal) {
        sitioOriginal.padre.insertBefore(resultado, sitioOriginal.siguiente);
      }
      resultado.classList.remove('show');
      maquina.classList.remove('activada', 'moneda-metida');
      boton.disabled = false;
    }
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarTicket);
    if (lightbox) {
      lightbox.addEventListener('click', (e) => { if (e.target === lightbox) cerrarTicket(); });
    }

    boton.addEventListener('click', () => {
      boton.disabled = true;

      // por si se repite el juego, se reinician las animaciones desde cero
      maquina.classList.remove('activada');
      void maquina.offsetWidth; // fuerza reflow para reiniciar las transiciones

      // 1) meter la moneda
      maquina.classList.add('moneda-metida');

      // 2) tras el tintineo de la moneda, dispara la caída del producto
      //    y, con retraso, la trampilla (ver CSS: .maquina.activada)
      setTimeout(() => {
        maquina.classList.add('activada');
      }, moneda ? 480 : 0);

      setTimeout(() => {
        if (resultado) resultado.classList.add('show');
        desbloquearContinuar(maquina);
        // 3) un momento después de asomar, se amplía para verla bien
        setTimeout(ampliarTicket, 750);
      }, (moneda ? 480 : 0) + 1250);
    });
  });
}

/* =========================================================
   [v4] JUEGOS Y COMPONENTES NUEVOS DE historia.html
   ========================================================= */

/* ---------- ESCENA: pizarra "¿Cuánto es 1 año?" ---------- */
// Al pulsar el botón, un borrador recorre la pizarra línea a línea
// (zigzag) borrando el texto con una máscara. Después se cambian los
// datos por los del 2º año (data-num-dos / data-unidad-dos de cada <li>)
// y se "reescriben" de izquierda a derecha, como con tiza.
function initPizarra() {
  const pizarra = document.getElementById('pizarra');
  const boton = document.getElementById('btn-borrar');
  if (!pizarra || !boton) return;

  const lineas = Array.from(pizarra.querySelectorAll('.pizarra-lista li'));
  const borrador = pizarra.querySelector('.borrador');
  const mensaje = pizarra.querySelector('.pizarra-mensaje');
  const n = lineas.length;
  const DUR_BORRAR = reducirMovimiento() ? 1 : 2400;   // ms
  const DUR_ESCRIBIR = reducirMovimiento() ? 1 : 1600; // ms

  const limitar = (v) => Math.min(1, Math.max(0, v));
  function aplicarMascara(li, css) { li.style.webkitMaskImage = css; li.style.maskImage = css; }
  function quitarMascara(li) { li.style.webkitMaskImage = ''; li.style.maskImage = ''; }

  // Ejecuta fotograma(t) con t de 0 a 1 durante "duracion" ms y devuelve una promesa
  function animar(duracion, fotograma) {
    return new Promise((resolver) => {
      const inicio = performance.now();
      function paso(ahora) {
        const t = limitar((ahora - inicio) / duracion);
        fotograma(t);
        if (t < 1) requestAnimationFrame(paso); else resolver();
      }
      requestAnimationFrame(paso);
    });
  }

  // Coloca el borrador sobre la línea actual; "avance" va de 0 a 1 dentro de esa línea
  function moverBorrador(li, avance, derechaAIzquierda) {
    const pz = pizarra.getBoundingClientRect();
    const r = li.getBoundingClientRect();
    const fraccion = derechaAIzquierda ? 1 - avance : avance;
    const x = r.left - pz.left - pizarra.clientLeft + fraccion * r.width - borrador.offsetWidth / 2;
    const y = r.top - pz.top - pizarra.clientTop + r.height / 2 - borrador.offsetHeight / 2;
    borrador.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + (derechaAIzquierda ? 8 : -8) + 'deg)';
  }

  boton.addEventListener('click', async () => {
    boton.disabled = true;
    borrador.classList.add('activo');

    // FASE 1 — borrar: las líneas pares de izquierda a derecha, las impares al revés
    await animar(DUR_BORRAR, (t) => {
      const global = t * n;
      const actual = Math.min(n - 1, Math.floor(global));
      lineas.forEach((li, k) => {
        const p = limitar(global - k) * 100;   // % ya borrado de esta línea
        aplicarMascara(li, k % 2 === 0
          ? 'linear-gradient(to right, transparent ' + p + '%, #000 ' + p + '%)'
          : 'linear-gradient(to right, #000 ' + (100 - p) + '%, transparent ' + (100 - p) + '%)');
      });
      moverBorrador(lineas[actual], limitar(global - actual), actual % 2 === 1);
    });
    borrador.classList.remove('activo');

    // Cambio de datos (siguen ocultos: la máscara aún los tapa del todo)
    lineas.forEach((li) => {
      li.querySelector('.num').textContent = li.dataset.numDos;
      if (li.dataset.unidadDos) li.querySelector('.unidad').textContent = li.dataset.unidadDos;
    });

    // FASE 2 — escribir el dato nuevo, línea a línea, de izquierda a derecha
    await animar(DUR_ESCRIBIR, (t) => {
      const global = t * n;
      lineas.forEach((li, k) => {
        const w = limitar(global - k) * 100;
        aplicarMascara(li, 'linear-gradient(to right, #000 ' + w + '%, transparent ' + w + '%)');
      });
    });
    lineas.forEach(quitarMascara);

    if (mensaje) mensaje.classList.add('show');
    boton.style.display = 'none';
    desbloquearContinuar(pizarra);
  });
}

/* ---------- ESCENA: deslizador de fotos "tira hacia abajo" ---------- */
// Según lo abajo que esté el asa en la pista, se muestra una foto u otra
// (una por tramo). Se desbloquea al llegar a la última. También se puede
// usar con teclado (flechas) porque el asa es un role="slider".
function initTiraFotos() {
  document.querySelectorAll('.tira').forEach((tira) => {
    const fotos = Array.from(tira.querySelectorAll('.tira-foto'));
    const pista = tira.querySelector('.tira-pista');
    const asa = tira.querySelector('.tira-asa');
    const cuenta = tira.closest('.escena').querySelector('.tira-cuenta');
    if (!fotos.length || !pista || !asa) return;

    const n = fotos.length;
    const ALTO_ASA = 46;   // px — debe coincidir con el alto de .tira-asa en el CSS
    let indice = -1;
    let llegoAlFinal = false;
    let arrastrando = false;
    let desfase = 0;       // distancia entre el dedo y el centro del asa al agarrarla

    // Una marca en la pista por cada foto
    pista.style.setProperty('--n', n);
    fotos.forEach((_, i) => {
      const marca = document.createElement('span');
      marca.className = 'tira-marca';
      marca.style.setProperty('--i', i);
      pista.appendChild(marca);
    });
    asa.setAttribute('aria-valuemax', n);

    function mostrar(nuevo) {
      if (nuevo === indice) return;
      indice = nuevo;
      fotos.forEach((foto, i) => {
        foto.classList.toggle('activa', i === indice);
        foto.classList.toggle('pasada', i < indice);
      });
      asa.setAttribute('aria-valuenow', indice + 1);
      if (cuenta) cuenta.textContent = (indice + 1) + ' / ' + n;
      if (indice === n - 1 && !llegoAlFinal) {
        llegoAlFinal = true;
        desbloquearContinuar(tira);
      }
    }

    function fijarProgreso(p) {
      p = Math.min(1, Math.max(0, p));
      pista.style.setProperty('--p', p);
      mostrar(Math.min(n - 1, Math.floor(p * n)));
    }

    function progresoDesdePuntero(e) {
      const r = pista.getBoundingClientRect();
      return (e.clientY - desfase - r.top - ALTO_ASA / 2) / (r.height - ALTO_ASA);
    }

    asa.addEventListener('pointerdown', (e) => {
      const r = asa.getBoundingClientRect();
      desfase = e.clientY - (r.top + r.height / 2);
      arrastrando = true;
      asa.setPointerCapture(e.pointerId);
      asa.classList.remove('sugerir');
      e.preventDefault();
    });
    asa.addEventListener('pointermove', (e) => { if (arrastrando) fijarProgreso(progresoDesdePuntero(e)); });
    const soltar = () => { arrastrando = false; };
    asa.addEventListener('pointerup', soltar);
    asa.addEventListener('pointercancel', soltar);

    // Teclado: flechas para pasar de foto en foto
    asa.addEventListener('keydown', (e) => {
      let destino = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') destino = Math.min(n - 1, indice + 1);
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') destino = Math.max(0, indice - 1);
      if (destino === null) return;
      e.preventDefault();
      asa.classList.remove('sugerir');
      fijarProgreso((destino + 0.5) / n);
    });

    fijarProgreso(0);
  });
}

/* ---------- ESCENA: calendario de noviembre ---------- */
// Pinta noviembre de cada año con el día 1 marcado con un corazón.
// Cada pulsación en la flecha pasa la hoja (animación) al año siguiente.
function initCalendario() {
  const cont = document.getElementById('calendario');
  if (!cont) return;
  const hoja = cont.querySelector('.cal-hoja');
  const anioEl = cont.querySelector('.cal-anio');
  const grid = cont.querySelector('.cal-grid');
  const etiqueta = cont.querySelector('.cal-etiqueta');
  const flecha = cont.querySelector('.cal-siguiente');
  if (!hoja || !grid || !flecha) return;

  const MES = 10;   // noviembre (enero = 0). Sergio: cambia aquí el mes si hace falta
  // Un paso por año: qué año se ve y qué etiqueta sale bajo el calendario
  const PASOS = [
    { anio: 2024, texto: '' },
    { anio: 2025, texto: '1 año' },
    { anio: 2026, texto: '2 años' }
  ];
  const CORAZON_CAL = '<svg class="cal-corazon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path pathLength="100" d="M12 21C5 15.5 2 12.2 2 8.6 2 5.6 4.3 3.5 7 3.5c2 0 3.9 1.1 5 2.9 1.1-1.8 3-2.9 5-2.9 2.7 0 5 2.1 5 5.1 0 3.6-3 6.9-10 12.4z"/></svg>';

  let paso = 0;
  let ocupado = false;

  function pintar() {
    const { anio, texto } = PASOS[paso];
    anioEl.textContent = anio;
    grid.innerHTML = '';
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach((letra, i) => {
      const el = document.createElement('div');
      el.className = 'cal-dia-semana' + (i >= 5 ? ' finde' : '');
      el.textContent = letra;
      grid.appendChild(el);
    });
    const primero = (new Date(anio, MES, 1).getDay() + 6) % 7;   // la semana empieza en lunes
    const dias = new Date(anio, MES + 1, 0).getDate();
    const hueco = () => { const v = document.createElement('div'); v.className = 'cal-dia'; return v; };   // celda vacía (con alto, para que la fila no colapse)
    for (let i = 0; i < primero; i++) grid.appendChild(hueco());
    for (let d = 1; d <= dias; d++) {
      const celda = document.createElement('div');
      celda.className = 'cal-dia' + (d === 1 ? ' marcado' : '');
      if (d === 1) celda.insertAdjacentHTML('afterbegin', CORAZON_CAL);
      const num = document.createElement('span');
      num.className = 'cal-num';
      num.textContent = d;
      celda.appendChild(num);
      grid.appendChild(celda);
    }
    // Relleno hasta 6 filas para que la hoja mida siempre lo mismo (si no, "salta" entre años)
    for (let i = 7 + primero + dias; i < 7 + 42; i++) grid.appendChild(hueco());
    if (etiqueta) {
      etiqueta.firstElementChild.textContent = texto;
      etiqueta.classList.toggle('show', !!texto);
    }
  }

  // Espera a que termine la animación de la propia hoja (ignora las de sus hijos,
  // como el dibujo del corazón, que también "suben" por el DOM)
  function alTerminar(el, fn) {
    const escucha = (e) => {
      if (e.target !== el) return;
      el.removeEventListener('animationend', escucha);
      fn();
    };
    el.addEventListener('animationend', escucha);
  }

  flecha.addEventListener('click', () => {
    if (ocupado || paso >= PASOS.length - 1) return;
    ocupado = true;
    if (etiqueta) etiqueta.classList.remove('show');
    hoja.classList.remove('entra');
    hoja.classList.add('sale');                       // la hoja actual se levanta...
    alTerminar(hoja, () => {
      paso++;
      pintar();                                       // ...y aparece la del año siguiente
      hoja.classList.remove('sale');
      hoja.classList.add('entra');
      alTerminar(hoja, () => {
        ocupado = false;
        if (etiqueta) etiqueta.classList.toggle('show', !!PASOS[paso].texto);
        if (paso === PASOS.length - 1) {
          flecha.disabled = true;
          desbloquearContinuar(cont);
        }
      });
    });
  });

  pintar();
}

/* ---------- ESCENA: hilo rojo (rediseñada, ya no se arrastra) ---------- */
// 1) El botón anima el hilo entre dos fotos bloqueadas; la 1ª se desbloquea
//    al empezar el hilo y la 2ª cuando llega. 2) Aparece una carta boca
//    abajo con "?"; al pulsarla se da la vuelta y muestra la leyenda.
function initHiloRojo() {
  const cont = document.getElementById('hilo-rojo');
  const boton = document.getElementById('btn-hilo');
  if (!cont || !boton) return;

  const svg = cont.querySelector('.hilo-rojo-svg');
  const trazo = svg.querySelector('path');
  const nudos = svg.querySelectorAll('.nudo');
  const fotoA = cont.querySelector('.hilo-foto-a');
  const fotoB = cont.querySelector('.hilo-foto-b');
  const escena = cont.closest('.escena');
  const carta = escena.querySelector('.carta-hilo');
  const giro = carta.querySelector('.carta-hilo-int');
  const DUR = reducirMovimiento() ? 1 : 2200;   // ms — el trazo tarda esto en dibujarse
  let dibujado = false;

  // Calcula el recorrido del hilo con la posición REAL de las fotos en pantalla
  // (por eso se hace al pulsar y al cambiar el tamaño, no antes: la escena
  // está oculta hasta que le toca y no se podría medir).
  function trazar() {
    const c = cont.getBoundingClientRect();
    const a = fotoA.getBoundingClientRect();
    const b = fotoB.getBoundingClientRect();
    const ax = a.left - c.left + a.width / 2, ay = a.bottom - c.top;   // sale del borde inferior de A
    const bx = b.left - c.left + b.width / 2, by = b.top - c.top;      // llega al borde superior de B
    const dy = by - ay;
    svg.setAttribute('viewBox', '0 0 ' + c.width + ' ' + c.height);
    trazo.setAttribute('d', 'M ' + ax + ' ' + ay + ' C ' + ax + ' ' + (ay + dy * 0.85) + ', ' + bx + ' ' + (by - dy * 0.85) + ', ' + bx + ' ' + by);
    nudos[0].setAttribute('cx', ax); nudos[0].setAttribute('cy', ay); nudos[0].setAttribute('r', 5);
    nudos[1].setAttribute('cx', bx); nudos[1].setAttribute('cy', by); nudos[1].setAttribute('r', 5);
    const largo = trazo.getTotalLength();
    trazo.style.strokeDasharray = largo;
    trazo.style.strokeDashoffset = dibujado ? 0 : largo;
  }

  boton.addEventListener('click', () => {
    boton.disabled = true;
    trazar();
    trazo.getBoundingClientRect();   // fuerza reflow para que la transición arranque
    trazo.style.transition = 'stroke-dashoffset ' + DUR + 'ms ease-in-out';
    nudos[0].classList.add('visible');
    fotoA.classList.add('desbloqueada');            // 1ª foto: al empezar el hilo
    trazo.style.strokeDashoffset = '0';
    dibujado = true;

    setTimeout(() => {                              // 2ª foto: cuando el hilo llega
      nudos[1].classList.add('visible');
      fotoB.classList.add('desbloqueada');
    }, DUR);

    setTimeout(() => {                              // después, la carta boca abajo
      boton.style.display = 'none';
      carta.classList.add('show');
      carta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, DUR + 1100);
  });

  // Si se gira el móvil o cambia el tamaño con el hilo ya dibujado, se recalcula sin animar
  window.addEventListener('resize', () => {
    if (!dibujado) return;
    trazo.style.transition = 'none';
    trazar();
  });

  function voltear() {
    if (carta.classList.contains('volteada')) return;
    carta.classList.add('volteada');
    giro.setAttribute('aria-label', 'Carta con la leyenda del hilo rojo');
    desbloquearContinuar(carta);
  }
  giro.addEventListener('click', voltear);
  giro.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); voltear(); }
  });
}


/* ---------- JUEGO: laberinto en forma de corazón ---------- */
// [v9] Antes la "máscara" (qué celdas de la cuadrícula interna cuentan como
// corazón) se escribía a mano, y el contorno de corazón se dibujaba aparte
// con la curva paramétrica real -- dos cosas distintas que casi nunca
// encajan del todo, así que sobresalían piedras fuera del contorno.
// Ahora se genera UNA sola vez la curva del corazón, y la máscara se
// calcula probando el centro de cada celda contra esa misma curva
// (dentro / fuera con el algoritmo de "ray casting"). Como los dos salen
// exactamente de los mismos puntos, ya no se pueden desalinear nunca,
// da igual la resolución de la cuadrícula que se elija.
const LABERINTO_COLS = 15;
const LABERINTO_FILAS = 15;
const LABERINTO_PASO = 24;          // separación entre centros de piedra
const LABERINTO_MARGEN = LABERINTO_PASO * 0.85; // aire alrededor de la curva

// Curva paramétrica clásica del corazón, en sus unidades matemáticas
// originales (sin escalar todavía).
function curvaCorazonCruda(N) {
  const puntos = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    puntos.push([
      16 * Math.sin(t) ** 3,
      13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    ]);
  }
  return puntos;
}

// Reescala los puntos crudos para que quepan en un lienzo anchoV x altoV,
// dejando "margen" de aire alrededor por los cuatro lados.
function escalarCurvaCorazon(puntos, anchoV, altoV, margen) {
  const xs = puntos.map((p) => p[0]), ys = puntos.map((p) => p[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const anchoUtil = anchoV - margen * 2, altoUtil = altoV - margen * 2;
  return puntos.map(([x, y]) => [
    margen + (x - xMin) / (xMax - xMin) * anchoUtil,
    margen + (yMax - y) / (yMax - yMin) * altoUtil   // y de SVG crece hacia abajo
  ]);
}

function pathDesdePuntos(puntos) {
  return puntos.map(([x, y], i) => (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ') + ' Z';
}

// ¿Está (x,y) dentro del polígono cerrado "puntos"? (ray casting clásico)
function puntoDentroDeCorazon(x, y, puntos) {
  let dentro = false;
  for (let i = 0, j = puntos.length - 1; i < puntos.length; j = i++) {
    const [xi, yi] = puntos[i], [xj, yj] = puntos[j];
    const cruza = (yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

// Construye la máscara (1 = piedra dentro del corazón, 0 = fuera) probando
// el CENTRO de cada celda contra la curva ya escalada al mismo lienzo.
function construirMascaraCorazon(cols, filas, paso, puntosCorazon) {
  const mascara = [];
  for (let f = 0; f < filas; f++) {
    const fila = [];
    for (let c = 0; c < cols; c++) {
      const cx = c * paso + paso / 2, cy = f * paso + paso / 2;
      fila.push(puntoDentroDeCorazon(cx, cy, puntosCorazon) ? 1 : 0);
    }
    mascara.push(fila);
  }
  return mascara;
}

// Entrada = arriba de uno de los dos lóbulos (primera fila con piedra,
// la más a la izquierda de esa fila). Salida = la punta de abajo (última
// fila con piedra, la del medio de esa fila).
function encontrarInicioYFin(mascara) {
  const indicesRellenos = (fila) => fila.reduce((acc, v, c) => (v === 1 ? acc.concat(c) : acc), []);
  let inicio = null, fin = null;
  for (let f = 0; f < mascara.length && !inicio; f++) {
    const idx = indicesRellenos(mascara[f]);
    if (idx.length) inicio = { f, c: idx[0] };
  }
  for (let f = mascara.length - 1; f >= 0 && !fin; f--) {
    const idx = indicesRellenos(mascara[f]);
    if (idx.length) fin = { f, c: idx[Math.floor(idx.length / 2)] };
  }
  return { inicio, fin };
}

function generarConexionesLaberinto(mascara, inicio) {
  const filas = mascara.length, cols = mascara[0].length;
  const visitado = Array.from({ length: filas }, () => Array(cols).fill(false));
  const conexiones = new Set();
  const clave = (f, c) => f + ',' + c;

  function vecinos(f, c) {
    return [[-1,0],[1,0],[0,-1],[0,1]]
      .map(([df, dc]) => [f + df, c + dc])
      .filter(([nf, nc]) => nf >= 0 && nf < filas && nc >= 0 && nc < cols && mascara[nf][nc] === 1);
  }
  function dfs(f, c) {
    visitado[f][c] = true;
    vecinos(f, c).sort(() => Math.random() - 0.5).forEach(([nf, nc]) => {
      if (!visitado[nf][nc]) {
        conexiones.add(clave(f, c) + '|' + clave(nf, nc));
        conexiones.add(clave(nf, nc) + '|' + clave(f, c));
        dfs(nf, nc);
      }
    });
  }
  dfs(inicio.f, inicio.c);
  return conexiones;
}

// Camino de "piedras" redondas dentro de la silueta de corazón: las piedras
// conectadas por el recorrido llevan un caminito de fondo entre ellas; las
// vecinas SIN conectar llevan una pequeña barrera perpendicular, así se ve
// por dónde se puede intentar avanzar sin que parezca un tablero de ajedrez.
function initLaberinto() {
  const contenedorSvg = document.querySelector('.laberinto');
  if (!contenedorSvg) return;
  const escena = contenedorSvg.closest('.escena') || contenedorSvg.parentElement;
  const mensajeFinal = escena.querySelector('.laberinto-final');

  const cols = LABERINTO_COLS, filas = LABERINTO_FILAS, paso = LABERINTO_PASO;
  const anchoTotal = cols * paso, altoTotal = filas * paso;
  const puntosCorazon = escalarCurvaCorazon(curvaCorazonCruda(160), anchoTotal, altoTotal, LABERINTO_MARGEN);
  const mascara = construirMascaraCorazon(cols, filas, paso, puntosCorazon);
  const { inicio, fin } = encontrarInicioYFin(mascara);
  if (!inicio || !fin) return; // seguridad, no debería ocurrir

  const conexiones = generarConexionesLaberinto(mascara, inicio);
  const clave = (f, c) => f + ',' + c;
  const radio = paso * 0.4;

  const esHueco = (f, c) => f < 0 || f >= filas || c < 0 || c >= cols || mascara[f][c] === 0;
  const centro = (f, c) => [c * paso + paso / 2, f * paso + paso / 2];

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${anchoTotal} ${altoTotal}`);
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', 'Laberinto en forma de corazón');

  // Capa 0: la silueta real del corazón, DETRÁS de todo lo demás (viene de
  // los MISMOS puntos que se usaron para decidir qué celdas son piedra).
  const silueta = document.createElementNS(svgNS, 'path');
  silueta.setAttribute('class', 'laberinto-corazon-silueta');
  silueta.setAttribute('d', pathDesdePuntos(puntosCorazon));
  // Capa 1: caminitos (líneas gruesas de fondo) entre piedras conectadas
  const capaCaminos = document.createElementNS(svgNS, 'g');
  // Capa 2: barreras entre piedras vecinas SIN conectar
  const capaBarreras = document.createElementNS(svgNS, 'g');
  // Capa 3: las piedras en sí (encima de todo lo anterior)
  const capaPiedras = document.createElementNS(svgNS, 'g');
  svg.append(silueta, capaCaminos, capaBarreras, capaPiedras);

  const piedras = {};
  mascara.forEach((fila, f) => {
    fila.forEach((valor, c) => {
      if (valor !== 1) return;
      const [x, y] = centro(f, c);

      [[0, 1], [1, 0]].forEach(([df, dc]) => {
        const nf = f + df, nc = c + dc;
        if (esHueco(nf, nc)) return;
        const [x2, y2] = centro(nf, nc);
        if (conexiones.has(clave(f, c) + '|' + clave(nf, nc))) {
          const linea = document.createElementNS(svgNS, 'line');
          linea.setAttribute('x1', x); linea.setAttribute('y1', y);
          linea.setAttribute('x2', x2); linea.setAttribute('y2', y2);
          linea.setAttribute('class', 'laberinto-conexion');
          capaCaminos.appendChild(linea);
        } else {
          const mx = (x + x2) / 2, my = (y + y2) / 2;
          const ux = (x2 - x) / paso, uy = (y2 - y) / paso;
          const nx = -uy, ny = ux;
          const largoBarrera = paso * 0.42;
          const barrera = document.createElementNS(svgNS, 'line');
          barrera.setAttribute('x1', mx - nx * largoBarrera / 2);
          barrera.setAttribute('y1', my - ny * largoBarrera / 2);
          barrera.setAttribute('x2', mx + nx * largoBarrera / 2);
          barrera.setAttribute('y2', my + ny * largoBarrera / 2);
          barrera.setAttribute('class', 'laberinto-gate');
          capaBarreras.appendChild(barrera);
        }
      });

      const piedra = document.createElementNS(svgNS, 'circle');
      piedra.setAttribute('cx', x); piedra.setAttribute('cy', y); piedra.setAttribute('r', radio);
      piedra.setAttribute('class', 'laberinto-pebble');
      piedra.setAttribute('tabindex', '0');
      piedra.setAttribute('role', 'button');
      if (f === inicio.f && c === inicio.c) piedra.classList.add('inicio');
      if (f === fin.f && c === fin.c) piedra.classList.add('fin');
      const mover = () => intentarMover(f, c);
      piedra.addEventListener('click', mover);
      piedra.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mover(); }
      });
      capaPiedras.appendChild(piedra);
      piedras[clave(f, c)] = piedra;
    });
  });

  contenedorSvg.appendChild(svg);

  let actualF = inicio.f, actualC = inicio.c;
  piedras[clave(actualF, actualC)].classList.add('actual', 'visitada');

  function intentarMover(f, c) {
    if (f === actualF && c === actualC) return;
    const permitido = conexiones.has(clave(actualF, actualC) + '|' + clave(f, c));
    if (!permitido) {
      const piedra = piedras[clave(f, c)];
      if (piedra) {
        piedra.classList.remove('denegado');
        void piedra.getBBox && piedra.getBBox(); // reinicia la animación si se repite
        piedra.classList.add('denegado');
      }
      return;
    }
    piedras[clave(actualF, actualC)].classList.remove('actual');
    actualF = f; actualC = c;
    const piedra = piedras[clave(actualF, actualC)];
    piedra.classList.add('actual', 'visitada');

    if (actualF === fin.f && actualC === fin.c) {
      if (mensajeFinal) mensajeFinal.classList.add('show');
      desbloquearContinuar(contenedorSvg);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initBotonHuidizo();
  initMemoria();
  initMaquina();
  initPizarra();      // [v4]
  initTiraFotos();    // [v4]
  initCalendario();   // [v4]
  initHiloRojo();      // [v4] (sustituye a initHiloArrastrable)
  initLaberinto();     // [v9] máscara generada desde la propia curva del corazón
});
