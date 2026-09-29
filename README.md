# Secondbike — Propuesta de rediseño de la homepage

Prototipo de homepage para **Secondbike**, taller y tienda de bicicletas de segunda mano en la calle San Germán 70 (Tetuán, Madrid). Es una **remaquetación** de su web actual: sus bloques, en su orden, con sus textos, sus fotos y sus colores (verde, negro y blanco). La propuesta está en el diseño, la jerarquía, el movimiento y en enseñar lo que hoy no se ve: las bicis que tienen a la venta.

**Dirección estética:** *"Carril"* — en su tienda hay un carril bici pintado para probar las bicis. La web lo usa como único adorno: bajo la cabecera marca lo que llevas leído, bajo el hero sostiene sus datos y en los servicios lleva la rueda del logo hasta la pregunta elegida. Saira ancha y en cursiva para los titulares, Red Hat Text para leer.

## Stack
HTML, CSS y JavaScript puro. Cero dependencias, cero build. Fuentes variables autoalojadas. Imágenes del cliente en AVIF/WebP con `srcset`.

## Estructura
```
prototype/          Prototipo navegable (se publica en gh-pages con git subtree)
  index.html
  assets/css/       global.css · home.css
  assets/js/        main.js
  assets/fonts/     saira · red-hat-text (woff2 variables, latino)
  assets/img/       fotos de la tienda, bicis del stock y logo del cliente
```

## Ver en local
```bash
cd prototype && python3 -m http.server 8000
```
Parámetros útiles para revisar: `?ss` (sin animaciones, para capturas) y `?pregunta=3` (abre la tercera de las seis preguntas).

## Publicar
```bash
git subtree push --prefix=prototype origin gh-pages
```

---
Diseño y desarrollo: **Juan Jurado** · [jjuradogarciadelrio.com](https://jjuradogarciadelrio.com)
