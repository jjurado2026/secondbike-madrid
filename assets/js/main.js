/* =====================================================================
   SECONDBIKE — "Carril" (v3)
   Todo el contenido se lee sin JavaScript. Esto añade: la entrada del
   hero, la cadena que corre bajo la cabecera, los desplegables del menú,
   la carretera de los servicios con la rueda del logo bajando por ella,
   el cuentakilómetros y la rueda que gira en "Un servicio de calidad", el
   carrusel de reseñas, el estado abierto/cerrado, la fachada del mapa, el
   menú móvil y la barra fija.
   ===================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const captura  = location.search.includes('ss');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quieto   = captura || reducido;
  if (captura) {
    document.documentElement.classList.add('captura');
    $$('img[loading="lazy"]').forEach(i => (i.loading = 'eager'));
  }

  /* ---------- Carga: una sola orquestación, en el hero ---------- */
  const arrancar = () => document.body.classList.add('cargada');
  if (document.fonts && document.fonts.ready && !quieto) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 700))]).then(() => requestAnimationFrame(arrancar));
  } else arrancar();

  const cab = $('.cab');
  const cadena = $('.cab .cadena');

  /* ---------- Desplegables del menú (Taller, Segunda mano) ---------- */
  const desplegables = $$('.nav__desp');
  const cerrarOtros = actual => desplegables.forEach(d => d !== actual && d.poner && d.poner(false));
  desplegables.forEach(desp => {
    const boton = $('.nav__boton', desp);
    let espera;
    desp.poner = abierto => {
      desp.classList.toggle('is-abierto', abierto);
      boton.setAttribute('aria-expanded', String(abierto));
      if (abierto) cerrarOtros(desp);
    };
    boton.addEventListener('click', () => desp.poner(boton.getAttribute('aria-expanded') !== 'true'));
    desp.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover)').matches) { clearTimeout(espera); desp.poner(true); } });
    desp.addEventListener('mouseleave', () => { if (matchMedia('(hover:hover)').matches) espera = setTimeout(() => desp.poner(false), 160); });
    desp.addEventListener('focusout', e => { if (!desp.contains(e.relatedTarget)) desp.poner(false); });
    desp.addEventListener('keydown', e => { if (e.key === 'Escape' && desp.classList.contains('is-abierto')) { desp.poner(false); boton.focus(); } });
  });
  document.addEventListener('click', e => desplegables.forEach(d => { if (!d.contains(e.target)) d.poner(false); }));

  /* ---------- Menú móvil ---------- */
  const menuBoton = $('.cab__menu');
  const menu = $('#menu-movil');
  if (menuBoton && menu) {
    const poner = abierto => {
      menuBoton.setAttribute('aria-expanded', String(abierto));
      menu.hidden = !abierto;
      menu.classList.toggle('is-abierto', abierto);
      document.documentElement.classList.toggle('menu-abierto', abierto);
      $('span', menuBoton).textContent = abierto ? 'Cerrar' : 'Menú';
      $('use', menuBoton).setAttribute('href', abierto ? '#i-cerrar' : '#i-menu');
      if (abierto) $('a', menu).focus();
    };
    menuBoton.addEventListener('click', () => poner(menuBoton.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', e => { if (e.target.closest('a')) poner(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { poner(false); menuBoton.focus(); } });
    matchMedia('(min-width: 1000px)').addEventListener('change', e => e.matches && poner(false));
  }

  /* ---------- Abierto / cerrado, con su horario publicado ----------
     L-V 10:00-14:00 y 17:00-20:00 · S 10:00-14:00 · D cerrado.
     No contempla festivos: en la web definitiva se leerá de su ficha de Google. */
  const HORARIO = { 1: [[600, 840], [1020, 1200]], 2: [[600, 840], [1020, 1200]], 3: [[600, 840], [1020, 1200]], 4: [[600, 840], [1020, 1200]], 5: [[600, 840], [1020, 1200]], 6: [[600, 840]], 0: [] };
  const DIAS = ['el domingo', 'el lunes', 'el martes', 'el miércoles', 'el jueves', 'el viernes', 'el sábado'];
  const hora = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const ahoraMadrid = () => {
    const partes = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const v = t => partes.find(p => p.type === t).value;
    const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(v('weekday'));
    return { dia, min: +v('hour') * 60 + +v('minute') };
  };
  const estado = () => {
    const { dia, min } = ahoraMadrid();
    const hoy = HORARIO[dia];
    const tramo = hoy.find(([a, c]) => min >= a && min < c);
    if (tramo) return { abierto: true, texto: `Abierto ahora, hasta las ${hora(tramo[1])}` };
    const siguienteHoy = hoy.find(([a]) => a > min);
    if (siguienteHoy) return { abierto: false, texto: `Cerrado, abre hoy a las ${hora(siguienteHoy[0])}` };
    for (let k = 1; k <= 7; k++) {
      const d = (dia + k) % 7;
      if (HORARIO[d].length) return { abierto: false, texto: `Cerrado, abre ${k === 1 ? 'mañana' : DIAS[d]} a las ${hora(HORARIO[d][0][0])}` };
    }
    return { abierto: false, texto: 'Cerrado' };
  };
  const pintarEstado = () => {
    const e = estado();
    $$('[data-estado]').forEach(el => {
      el.hidden = false;
      el.dataset.abierto = e.abierto ? 'si' : 'no';
      $('.estado__texto', el).textContent = e.texto;
    });
  };
  pintarEstado();
  setInterval(pintarEstado, 60000);

  /* ---------- Servicios: la carretera y la rueda que baja ----------
     La carretera pasa por el hito de cada servicio con curvas suaves; la
     rueda del logo baja por ella siguiendo la mitad de la pantalla. */
  const ruta = $('[data-ruta]');
  let carretera = null;
  if (ruta) {
    const svg = $('.ruta__trazo', ruta);
    const camino = $('.ruta__asfalto', ruta);
    const rueda = $('.ruta__rueda', ruta);
    const servicios = $$('.servicio', ruta);
    const hitos = servicios.map(s => $('.hito', s));
    let puntos = [], alturaHitos = [];

    const trazar = () => {
      const caja = ruta.getBoundingClientRect();
      const ancho = caja.width, alto = caja.height;
      svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
      const centros = hitos.map(h => {
        const r = h.getBoundingClientRect();
        return { x: r.left + r.width / 2 - caja.left, y: r.top + r.height / 2 - caja.top };
      });
      alturaHitos = centros.map(c => c.y);
      const onda = ancho > 900 ? 46 : 9;
      let d = `M${centros[0].x} ${Math.min(-40, centros[0].y - 260)} L${centros[0].x} ${centros[0].y}`;
      for (let i = 1; i < centros.length; i++) {
        const a = centros[i - 1], b = centros[i], tramo = b.y - a.y, s = i % 2 ? 1 : -1;
        d += ` C${a.x + onda * s} ${a.y + tramo * .38} ${b.x - onda * s} ${b.y - tramo * .38} ${b.x} ${b.y}`;
      }
      const ult = centros[centros.length - 1];
      d += ` L${ult.x} ${Math.max(alto, ult.y + 120)}`;
      camino.setAttribute('d', d);
      // Muestras del trazado para colocar la rueda por su altura
      const largo = camino.getTotalLength();
      puntos = [];
      for (let l = 0; l <= largo; l += 5) { const p = camino.getPointAtLength(l); puntos.push([p.x, p.y]); }
    };
    const colocar = () => {
      if (!puntos.length) return;
      const caja = ruta.getBoundingClientRect();
      const objetivo = quieto ? alturaHitos[0] : innerHeight * .52 - caja.top;
      const y = Math.max(puntos[0][1], Math.min(puntos[puntos.length - 1][1], objetivo));
      let lo = 0, hi = puntos.length - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (puntos[m][1] < y) lo = m + 1; else hi = m; }
      const [x, py] = puntos[lo];
      rueda.style.setProperty('--rx', `${x.toFixed(1)}px`);
      rueda.style.setProperty('--ry', `${py.toFixed(1)}px`);
      servicios.forEach((s, k) => s.classList.toggle('pasado', quieto || y >= alturaHitos[k] - 4));
    };
    carretera = { trazar, colocar };
    trazar(); colocar();
    if (document.fonts) document.fonts.ready.then(() => { trazar(); colocar(); });
    addEventListener('load', () => { trazar(); colocar(); });
    if ('ResizeObserver' in window) new ResizeObserver(() => { trazar(); colocar(); }).observe(ruta);
  }

  /* ---------- Un servicio de calidad: cuentakilómetros y rueda ---------- */
  const contadores = $$('.contador[data-valor]');
  contadores.forEach(c => {
    const valor = String(c.dataset.valor);
    const conPunto = valor.length > 3 ? valor.slice(0, -3) + '.' + valor.slice(-3) : valor;
    const signo = c.textContent.trim().startsWith('+') ? '<span class="contador__signo">+</span>' : '';
    let k = 0;
    const html = [...conPunto].map(ch => {
      if (ch === '.') return '<span class="contador__punto">.</span>';
      const cinta = Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join('');
      return `<span class="rodillo"><span class="rodillo__cinta" style="--d:${+ch};transition-delay:${(k++) * 110}ms">${cinta}</span></span>`;
    }).join('');
    c.innerHTML = `<span aria-hidden="true" class="contador__cifras">${signo}${html}</span>`;
  });
  const cifras = $('.cifras');
  if (cifras) {
    if (quieto || !('IntersectionObserver' in window)) cifras.classList.add('gira');
    else {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { cifras.classList.add('gira'); io.disconnect(); }
      }), { threshold: .15 });
      io.observe(cifras);
    }
  }
  const calidad = $('.calidad');
  const ruedaGrande = $('.calidad__rueda');

  /* ---------- Carrusel de reseñas ---------- */
  const carrusel = $('[data-carrusel]');
  let pintarCarrusel = () => {};
  if (carrusel) {
    const pista = $('.carrusel__pista', carrusel);
    const flechas = $$('[data-mover]');
    const barra = $('.carrusel__progreso');
    const tirador = barra && $('span', barra);
    pintarCarrusel = () => {
      const max = carrusel.scrollWidth - carrusel.clientWidth;
      flechas.forEach(f => (f.disabled = +f.dataset.mover < 0 ? carrusel.scrollLeft <= 2 : carrusel.scrollLeft >= max - 2));
      if (tirador) {
        const ancho = barra.clientWidth * (carrusel.clientWidth / carrusel.scrollWidth);
        tirador.style.setProperty('--ancho', `${ancho}px`);
        tirador.style.setProperty('--pos', `${max > 0 ? (carrusel.scrollLeft / max) * (barra.clientWidth - ancho) : 0}px`);
      }
    };
    flechas.forEach(f => f.addEventListener('click', () => {
      const paso = ($('.resena', pista)?.offsetWidth || 400) + 20;
      carrusel.scrollBy({ left: +f.dataset.mover * paso, behavior: quieto ? 'auto' : 'smooth' });
    }));
    carrusel.addEventListener('scroll', () => requestAnimationFrame(pintarCarrusel), { passive: true });
    addEventListener('resize', pintarCarrusel, { passive: true });
    pintarCarrusel();
  }

  /* ---------- Scroll: sombra de cabecera, cadena, carretera y rueda grande ---------- */
  let pendiente = false;
  const alScroll = () => {
    pendiente = false;
    if (cab) cab.dataset.scroll = scrollY > 8 ? 'si' : 'no';
    if (quieto) return;
    // La cadena corre como si pedalearas: 28,8 px es el paso de un eslabón
    if (cadena) cadena.style.setProperty('--c', `${((scrollY * .6) % 28.8).toFixed(2)}px`);
    if (carretera) carretera.colocar();
    if (calidad && ruedaGrande) {
      const r = calidad.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) ruedaGrande.style.setProperty('--giro', `${((innerHeight - r.top) * .25).toFixed(1)}deg`);
    }
  };
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); } }, { passive: true });
  addEventListener('resize', () => { if (carretera) { carretera.trazar(); carretera.colocar(); } alScroll(); }, { passive: true });

  /* ---------- Mapa: se carga al pulsar (no pesa en la carga) ---------- */
  $$('[data-mapa]').forEach(m => {
    const abrir = $('[data-mapa-abrir]', m);
    const marco = $('[data-mapa-marco]', m);
    abrir?.addEventListener('click', () => {
      if (!marco.firstChild) {
        const f = document.createElement('iframe');
        f.src = 'https://www.google.com/maps?q=Secondbike,+Calle+San+Germ%C3%A1n+70,+28020+Madrid&z=16&output=embed';
        f.title = 'Mapa: Secondbike, calle San Germán 70, Madrid';
        f.loading = 'lazy';
        f.referrerPolicy = 'no-referrer-when-downgrade';
        marco.appendChild(f);
      }
      marco.hidden = false;
      abrir.hidden = true;
      marco.firstChild.focus?.();
    });
  });

  /* ---------- Barra fija y WhatsApp: aparecen cuando el hero sale ---------- */
  const hero = $('.hero');
  const flotantes = $$('[data-barra], [data-wa]');
  if (hero && flotantes.length && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => flotantes.forEach(f => (f.dataset.visible = e.isIntersecting ? 'no' : 'si')), { rootMargin: '-120px 0px 0px 0px' }).observe(hero);
  }

  alScroll();
})();
