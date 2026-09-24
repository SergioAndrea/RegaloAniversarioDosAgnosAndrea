# Regalo de aniversario — guía rápida

## Estructura del proyecto
```
regalo-aniversario/
├── index.html      → portada (un "2" hecho de fotos + "años" + botón para entrar)
├── historia.html   → toda la experiencia: hitos + minijuegos, por escenas
├── galeria.html    → galería final + mensaje de cierre (enlaza a la carta)
├── carta.html      → el sobre que se abre y la carta que escribes tú
├── css/style.css   → todos los estilos (colores, tipografía, componentes)
└── js/
    ├── main.js     → componentes reutilizables (letras de colores, pull-photo,
    │                  corazón, hilo decorativo) + ayudante desbloquearContinuar()
    ├── juego.js    → minijuegos (botón huidizo, memoria, máquina expendedora,
    │                  pizarra, deslizador de fotos, calendario, hilo rojo)
    └── escenas.js  → controla qué escena de historia.html se muestra
```

## Cómo funciona historia.html
Todo `historia.html` es una secuencia de pantallas (`<section class="escena">`), solo
una visible a la vez. Cada una tiene un botón "Continuar":
- Si el botón **no** lleva `disabled` en el HTML, se puede pasar sin más (escena de
  lectura/scroll).
- Si lleva `disabled`, es una escena de minijuego: el propio juego llama a
  `desbloquearContinuar()` cuando se gana, y el botón se habilita solo.

Para añadir un hito nuevo: duplica una escena de scroll y cambia el contenido.
Para añadir un minijuego nuevo: duplica la escena del componente más parecido
(máquina, corazón, hilo rojo...) y ajústalo.

## Componentes nuevos (v4)
Ninguno usa emojis: todos los iconos son `<svg>` escritos en el propio HTML.
- **Portada (`index.html`)**: el "2" son 10 recortes de foto. Pon sus URLs de R2 en el
  array `FOTOS_DOS` del script de `index.html` (una por trozo). `PIEZAS_DOS` define la
  posición de cada trozo en una cuadrícula de 6 x 10.
- **Pizarra "¿cuánto es 1 año?"** (`#pizarra`): cada `<li>` lleva `data-num-dos` (dato
  para 2 años) y, si cambia la unidad, `data-unidad-dos`. El borrador lo anima `initPizarra`.
- **Deslizador de fotos** (`.tira`): una foto por cada `<figure class="tira-foto">`; añade
  o quita las que quieras. Se desbloquea al llegar a la última.
- **Calendario** (`#calendario`): los años y etiquetas ("1 año", "2 años") están en la
  constante `PASOS` de `initCalendario`; el mes en `MES` (noviembre = 10).
- **Hilo rojo** (`#hilo-rojo`): el botón dibuja el hilo entre las dos fotos y las desbloquea;
  luego aparece la carta con "?" que se da la vuelta (texto de la leyenda editable en el HTML).
- **Carta (`carta.html`)**: escribe tu texto dentro de `<article id="carta">`, un `<p>` por párrafo.
- Las escenas con el botón "Continuar" deshabilitado (pizarra, deslizador, calendario, hilo)
  bloquean hasta completarse; si prefieres que no bloqueen, quita el `disabled` de su botón.

## Componentes nuevos (v5)
- **Laberinto en forma de corazón** (`.laberinto`): genera un recorrido válido distinto
  cada vez que se carga la página (un árbol de expansión aleatorio dentro de la silueta
  de corazón definida en `MASCARA_LABERINTO`, en `juego.js`). Se toca casilla a casilla;
  si una casilla no está conectada a la actual, tiembla en vez de moverse. Cambia
  `INICIO_LABERINTO`, `FIN_LABERINTO` o la propia máscara si quieres otra forma o tamaño.


## 1. Editar el contenido
- **historia.html**: cada hito y cada minijuego es una `<section class="escena">`. Duplica la que más se parezca a lo que quieras añadir.
- **galeria.html** y los `.polaroid` de `historia.html`: sustituye `<div class="ph-placeholder">...</div>` por `<img src="URL-DE-R2" alt="...">` cuando tengas las fotos subidas.
- Todo el texto marcado como "texto de ejemplo" o con un comentario `<!-- Sergio: ... -->` está pensado para que lo edites.

## 2. Subir fotos/vídeos a Cloudflare R2
1. Crea cuenta gratis en Cloudflare → sección **R2**.
2. Crea un bucket (ej. `recuerdos-aniversario`).
3. Sube tus fotos/vídeos al bucket.
4. Activa acceso público al bucket (o un dominio propio de R2.dev) para obtener una URL directa por archivo, tipo:
   `https://pub-xxxxxxxx.r2.dev/foto1.jpg`
5. Pega esa URL en el `src` de cada `<img>` o `<video>`.

## 3. Restringir el acceso con Cloudflare Access
1. En el panel de Cloudflare, ve a **Zero Trust → Access → Applications**.
2. Crea una aplicación apuntando al dominio donde publiques la web.
3. Añade como usuarios autorizados los emails que quieras (tu novia, quien tú decidas).
4. Cloudflare pedirá un código de verificación por email antes de dejar entrar — gratis hasta 50 usuarios.

## 4. Publicar en GitHub Pages
1. Crea un repositorio nuevo en GitHub y sube esta carpeta completa.
2. Ve a **Settings → Pages** del repositorio.
3. En "Source" elige la rama `main` y la carpeta raíz (`/`).
4. GitHub te dará una URL tipo `tuusuario.github.io/nombre-repo`.
5. Si conectas ese dominio con Cloudflare (como proxy), puedes activarle Access encima.

## 5. Generar el QR / grabar el NFC
- QR: cualquier generador gratuito online con la URL final.
- NFC: app "NFC Tools" (Android/iOS) para grabar esa misma URL en una tarjeta o pegatina NFC.

## Notas técnicas
- Todo el CSS usa variables (`:root` en `style.css`) — cambia colores globales desde ahí.
- El diseño es responsive: probado con media queries para móvil (≤640px) y pantallas grandes (≥900px).
- Las animaciones respetan `prefers-reduced-motion` por accesibilidad.
