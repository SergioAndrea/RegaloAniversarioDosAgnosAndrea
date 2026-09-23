/* =========================================================
   escenas.js — controla el avance pantalla a pantalla de historia.html
   Cada <section class="escena"> es una pantalla. Solo una está
   visible a la vez. Los botones con clase .continuar avanzan a la
   siguiente. Si un botón .continuar tiene el atributo "disabled" en
   el HTML, permanece bloqueado hasta que el minijuego de esa escena
   llame a desbloquearContinuar() (definida en main.js).
   ========================================================= */

(function () {
  const escenas = Array.from(document.querySelectorAll('.escena'));
  if (!escenas.length) return;

  const contador = document.createElement('div');
  contador.className = 'escena-contador';
  document.body.appendChild(contador);

  let indice = 0;

  function mostrar(nuevoIndice) {
    indice = Math.max(0, Math.min(nuevoIndice, escenas.length - 1));
    escenas.forEach((esc, i) => esc.classList.toggle('activa', i === indice));
    contador.textContent = (indice + 1) + ' / ' + escenas.length;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  escenas.forEach((esc) => {
    esc.querySelectorAll('.continuar').forEach((btn) => {
      btn.addEventListener('click', () => mostrar(indice + 1));
    });
  });

  mostrar(0);
})();
