# Secondbike — Propuesta de rediseño de la homepage

Prototipo de homepage para **Secondbike**, taller y tienda de bicicletas de segunda mano en la calle San Germán 70 (Tetuán, Madrid). Parte de su web actual —sus textos, sus fotos y sus colores (verde, negro y blanco)— reordenada en secciones claras. La propuesta está en el diseño, la jerarquía, el movimiento y en enseñar lo que hoy no se ve: las bicis que tienen a la venta.

**Dirección estética:** *"Carril"* (v3) — siete secciones: hero con sus datos a la vista, servicios, un servicio de calidad, reseñas, preguntas frecuentes, sobre nosotros y visítanos. Los siete servicios alternan foto y texto y los une una carretera por la que baja la rueda del logo al hacer scroll. Su verde de menú (#3F9104) en cabecera y CTAs. Saira ancha y en cursiva para los titulares, Red Hat Text para leer.

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
Parámetro útil para revisar: `?ss` (sin animaciones, para capturas).

## Caducidad del prototipo
La home es visible **10 días**: del 30-sep al 9-oct-2026 (hora de Madrid). Desde el **sábado 10-oct-2026 a las 00:00**, `index.html` envía a `caducada.html`: el mensaje de Juan y una miniatura de la home entera. Para enseñarla después, añadir `?acceso=jj` a la dirección. La fecha está en el primer `<script>` de `index.html`.

## Publicar
```bash
git subtree push --prefix=prototype origin gh-pages
```

---
Diseño y desarrollo: **Juan Jurado** · [jjuradogarciadelrio.com](https://jjuradogarciadelrio.com)
