# Secondbike — Propuesta de rediseño de la homepage

Prototipo de homepage para **Secondbike**, taller y tienda de bicicletas de segunda mano en la calle San Germán 70 (Tetuán, Madrid). Parte de su web actual —sus textos, sus fotos y sus colores (verde, negro y blanco)— reordenada en secciones claras. La propuesta está en el diseño, la jerarquía, el movimiento y en enseñar lo que hoy no se ve: las bicis que tienen a la venta.

**Dirección estética:** *"Carril"* (v2) — la home está ordenada en secciones claras: servicios, calidad, revisiones, bicis a la venta, bici eléctrica y visítanos. Los servicios son una carretera horizontal ligada al scroll: la bici del logo pedalea y cada servicio levanta su persiana metálica al llegar. La cadena de la bici, bajo la cabecera, corre al hacer scroll. Las bicis a la venta llevan etiqueta de precio colgada, como en su tienda. Saira ancha y en cursiva para los titulares, Red Hat Text para leer.

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
Parámetros útiles para revisar: `?ss` (sin animaciones, para capturas: los servicios se ven como fila deslizable) y `?servicio=3` (lleva el scroll hasta el tercer servicio).

## Publicar
```bash
git subtree push --prefix=prototype origin gh-pages
```

---
Diseño y desarrollo: **Juan Jurado** · [jjuradogarciadelrio.com](https://jjuradogarciadelrio.com)
