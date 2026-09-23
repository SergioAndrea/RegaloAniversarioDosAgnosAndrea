# Regalo de aniversario — guía rápida

## Estructura del proyecto
```
regalo-aniversario/
├── index.html      → portada (sobre que se abre)
├── historia.html   → toda la experiencia: hitos + minijuegos, por escenas
├── galeria.html    → galería final + mensaje de cierre
├── css/style.css   → todos los estilos (colores, tipografía, componentes)
└── js/
    ├── main.js     → componentes reutilizables (letras de colores, pull-photo,
    │                  corazón, hilo decorativo) + ayudante desbloquearContinuar()
    ├── juego.js    → minijuegos (botón huidizo, memoria, máquina expendedora,
    │                  hilo para arrastrar)
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
(máquina, corazón, hilo arrastrable...) y ajústalo.


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
