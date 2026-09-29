/* =====================================================================
   SECONDBIKE — "Carril"
   Todo el contenido se lee sin JavaScript. Esto añade: la bici que
   recorre el carril al cargar y la que marca la lectura bajo la cabecera,
   el estado abierto/cerrado con su horario, el selector de las seis
   preguntas, el filtro de bicis a la venta, el cuentakilómetros, el
   "Leer todo", la fachada del mapa, la batería de la bici eléctrica, el
   menú y la barra fija en móvil.
   ===================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const captura  = location.search.includes('ss');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quieto   = captura || reducido;
  const mqAncho  = matchMedia('(min-width: 1000px)');
  if (captura) {
    document.documentElement.classList.add('captura');
    $$('img[loading="lazy"]').forEach(i => (i.loading = 'eager'));
  }

  /* ---------- Carga: una sola orquestación, en el hero ---------- */
  const arrancar = () => document.body.classList.add('cargada');
  if (document.fonts && document.fonts.ready && !quieto) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 700))]).then(() => requestAnimationFrame(arrancar));
  } else arrancar();

  // La bici del hero aparca al final del carril, a la altura del último dato
  const biciHero = $('.carril-raya__bici');
  const aparcar = () => {
    if (!biciHero) return;
    const pista = biciHero.parentElement.getBoundingClientRect();
    const env = $('.hero__carril .env');
    const der = env ? env.getBoundingClientRect().right - parseFloat(getComputedStyle(env).paddingRight) : pista.right - 24;
    biciHero.style.setProperty('--fin', `${Math.round(der - pista.left - biciHero.getBoundingClientRect().width)}px`);
  };
  aparcar();
  addEventListener('resize', aparcar, { passive: true });

  /* ---------- Cabecera: sombra y la bici que avanza con la lectura ---------- */
  const cab = $('.cab');
  const biciCab = $('.carril-cab__bici');
  const logo = $('.cab .logo');
  const acciones = $('.cab__acciones');
  let pendiente = false;
  const alScroll = () => {
    pendiente = false;
    if (cab) cab.dataset.scroll = scrollY > 8 ? 'si' : 'no';
    if (biciCab) {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      // Va del logo al botón del teléfono: nunca pisa la marca ni los botones
      const salida = logo ? logo.getBoundingClientRect().right + 14 : 0;
      const meta = acciones ? acciones.getBoundingClientRect().left - 14 : biciCab.parentElement.clientWidth;
      const recorrido = Math.max(0, meta - biciCab.getBoundingClientRect().width - salida);
      biciCab.style.setProperty('--x', `${(salida + p * recorrido).toFixed(1)}px`);
    }
    bateria();
  };
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); } }, { passive: true });
  addEventListener('resize', alScroll, { passive: true });

  /* ---------- Desplegable "Servicios" ---------- */
  $$('.nav__desp').forEach(desp => {
    const boton = $('.nav__boton', desp);
    const poner = abierto => { desp.classList.toggle('is-abierto', abierto); boton.setAttribute('aria-expanded', String(abierto)); };
    boton.addEventListener('click', () => poner(boton.getAttribute('aria-expanded') !== 'true'));
    desp.addEventListener('mouseenter', () => matchMedia('(hover:hover)').matches && poner(true));
    desp.addEventListener('mouseleave', () => matchMedia('(hover:hover)').matches && poner(false));
    desp.addEventListener('focusout', e => { if (!desp.contains(e.relatedTarget)) poner(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && desp.classList.contains('is-abierto')) { poner(false); boton.focus(); } });
    document.addEventListener('click', e => { if (!desp.contains(e.target)) poner(false); });
  });

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
    matchMedia('(min-width: 1240px)').addEventListener('change', e => e.matches && poner(false));
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

  /* ---------- Las seis preguntas ----------
     Escritorio: una respuesta siempre visible a la derecha; la rueda del
     logo baja por el carril hasta la pregunta elegida.
     Móvil: acordeón; se puede cerrar la que está abierta. */
  const selector = $('[data-selector]');
  if (selector) {
    const botones = $$('.selector__pregunta button', selector);
    const rueda = $('.selector__rueda', selector);
    const moverRueda = () => {
      const activo = botones.find(b => b.getAttribute('aria-expanded') === 'true');
      if (!rueda || !activo || !mqAncho.matches) return;
      const carril = rueda.parentElement.getBoundingClientRect();
      const b = activo.getBoundingClientRect();
      rueda.style.setProperty('--y', `${Math.round(b.top + b.height / 2 - carril.top - rueda.offsetHeight / 2)}px`);
    };
    const abrir = (boton, { animar = true } = {}) => {
      botones.forEach(b => {
        const panel = document.getElementById(b.getAttribute('aria-controls'));
        const es = b === boton;
        b.setAttribute('aria-expanded', String(es));
        panel.hidden = !es;
        panel.classList.remove('entra');
        if (es && animar && !quieto) { void panel.offsetWidth; panel.classList.add('entra'); }
      });
      moverRueda();
    };
    const cerrarTodo = () => botones.forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      document.getElementById(b.getAttribute('aria-controls')).hidden = true;
    });
    botones.forEach((b, i) => {
      b.addEventListener('click', () => {
        const yaAbierto = b.getAttribute('aria-expanded') === 'true';
        if (yaAbierto && !mqAncho.matches) { cerrarTodo(); return; }
        if (yaAbierto) return;
        abrir(b);
        if (!mqAncho.matches) {
          const top = b.getBoundingClientRect().top;
          const tapa = cab ? cab.getBoundingClientRect().bottom + 12 : 0;
          if (top < tapa) scrollTo({ top: scrollY + top - tapa, behavior: quieto ? 'auto' : 'smooth' });
        }
      });
      b.addEventListener('keydown', e => {
        const mover = { ArrowDown: 1, ArrowUp: -1 }[e.key];
        if (!mover) return;
        e.preventDefault();
        botones[(i + mover + botones.length) % botones.length].focus();
      });
    });
    // Parámetro de revisión: ?pregunta=3
    const pedida = +new URLSearchParams(location.search).get('pregunta');
    if (pedida >= 1 && pedida <= botones.length) abrir(botones[pedida - 1], { animar: false });
    mqAncho.addEventListener('change', e => {
      if (e.matches && !botones.some(b => b.getAttribute('aria-expanded') === 'true')) abrir(botones[0], { animar: false });
      moverRueda();
    });
    addEventListener('resize', moverRueda, { passive: true });
    if (document.fonts) document.fonts.ready.then(moverRueda);
    moverRueda();
  }

  /* ---------- Bicis a la venta: filtro y flechas ----------
     Los recuentos son los de su tienda WooCommerce el 29-sep-2026. */
  const TIENDA = {
    todas:     { n: 32, nombre: 'bicis',          url: 'https://www.secondbikemadrid.com/shop/' },
    montana:   { n: 7,  nombre: 'de montaña',     url: 'https://www.secondbikemadrid.com/categoria-producto/bicicletas-de-montana/' },
    urbana:    { n: 10, nombre: 'urbanas',        url: 'https://www.secondbikemadrid.com/categoria-producto/bicicletas-urbanas-de-segunda-mano/' },
    electrica: { n: 8,  nombre: 'eléctricas',     url: 'https://www.secondbikemadrid.com/categoria-producto/bicicletas-electrica-segunda-mano-madrid/' },
    carretera: { n: 6,  nombre: 'de carretera',   url: 'https://www.secondbikemadrid.com/categoria-producto/bicicletas-de-carretera-de-segunda-mano-en-madrid/' },
    infantil:  { n: 5,  nombre: 'infantiles',     url: 'https://www.secondbikemadrid.com/categoria-producto/bicicletas-infantiles/' }
  };
  const pista = $('[data-pista]');
  if (pista) {
    const bicis = $$('.bici:not(.bici--mas)', pista);
    const mas = $('[data-mas]', pista);
    const recuento = $('[data-recuento]');
    const flechas = $$('[data-mover]');
    const filtros = $$('[data-filtro]');
    const actualizarFlechas = () => {
      const fin = pista.scrollWidth - pista.clientWidth - 2;
      flechas.forEach(f => (f.disabled = +f.dataset.mover < 0 ? pista.scrollLeft <= 2 : pista.scrollLeft >= fin));
    };
    const filtrar = tipo => {
      filtros.forEach(f => f.setAttribute('aria-pressed', String(f.dataset.filtro === tipo)));
      let i = 0;
      bicis.forEach(b => {
        const vale = tipo === 'todas' || b.dataset.tipo.split(' ').includes(tipo);
        b.hidden = !vale;
        b.classList.remove('entra');
        if (vale && !quieto) { void b.offsetWidth; b.style.setProperty('--i', i++); b.classList.add('entra'); }
      });
      const t = TIENDA[tipo];
      const vistas = bicis.filter(b => !b.hidden).length;
      $('[data-mas-num]', mas).textContent = t.n;
      $('[data-mas-tipo]', mas).textContent = t.nombre;
      mas.href = t.url;
      recuento.textContent = `${vistas} de ${t.n} ${tipo === 'todas' ? 'bicis en stock' : t.nombre + ' en stock'}`;
      pista.scrollTo({ left: 0, behavior: 'auto' });
      actualizarFlechas();
    };
    filtros.forEach(f => f.addEventListener('click', () => filtrar(f.dataset.filtro)));
    flechas.forEach(f => f.addEventListener('click', () => {
      const paso = ($('.bici:not([hidden])', pista)?.offsetWidth || 300) + 18;
      pista.scrollBy({ left: +f.dataset.mover * paso * 2, behavior: quieto ? 'auto' : 'smooth' });
    }));
    pista.addEventListener('scroll', () => requestAnimationFrame(actualizarFlechas), { passive: true });
    addEventListener('resize', actualizarFlechas, { passive: true });
    actualizarFlechas();
  }

  /* ---------- Cuentakilómetros: cada cifra gira hasta su valor, una vez ---------- */
  const contadores = $$('.contador[data-valor]');
  contadores.forEach(c => {
    const valor = String(c.dataset.valor);
    const conPunto = valor.length > 3 ? valor.slice(0, -3) + '.' + valor.slice(-3) : valor;
    let k = 0;
    const html = [...conPunto].map(ch => {
      if (ch === '.') return '<span class="contador__punto">.</span>';
      const d = +ch;
      const cinta = Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join('');
      return `<span class="rodillo"><span class="rodillo__cinta" style="--d:${d};transition-delay:${(k++) * 90}ms">${cinta}</span></span>`;
    }).join('');
    c.innerHTML = `<span aria-hidden="true" class="contador__cifras"><span class="contador__signo">+</span>${html}</span>`;
  });
  if (contadores.length) {
    const lista = $('.cifras__lista');
    if (quieto || !('IntersectionObserver' in window)) lista.classList.add('gira');
    else {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { lista.classList.add('gira'); io.disconnect(); }
      }), { threshold: .45 });
      io.observe(lista);
    }
  }

  /* ---------- "Leer todo" en los textos largos ---------- */
  $$('[data-leer]').forEach(boton => {
    const bloque = document.getElementById(boton.getAttribute('aria-controls'));
    if (!bloque) return;
    bloque.classList.add('is-plegado');
    boton.hidden = false;
    boton.addEventListener('click', () => {
      const abrir = boton.getAttribute('aria-expanded') !== 'true';
      boton.setAttribute('aria-expanded', String(abrir));
      bloque.classList.toggle('is-plegado', !abrir);
      const extra = $$(':scope > p:nth-child(n+3)', bloque);
      extra.forEach((p, i) => { p.classList.remove('aparece'); if (abrir && !quieto) { p.style.setProperty('--i', i); void p.offsetWidth; p.classList.add('aparece'); } });
      if (!abrir) {
        const top = bloque.getBoundingClientRect().top;
        if (top < 0) scrollTo({ top: scrollY + top - 120, behavior: 'auto' });
      }
    });
  });

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

  /* ---------- Batería: se carga mientras se leen las cinco razones ---------- */
  const carga = $('[data-carga]');
  const relleno = $('.bateria__relleno');
  function bateria() {
    if (!carga || !relleno || !mqAncho.matches) return;
    if (quieto) { relleno.style.setProperty('--carga', 1); return; }
    const r = carga.getBoundingClientRect();
    const p = (innerHeight * .6 - r.top) / (r.height * .8);
    relleno.style.setProperty('--carga', Math.min(1, Math.max(.08, p)).toFixed(3));
  }

  /* ---------- Barra fija y WhatsApp: aparecen cuando el hero sale ---------- */
  const hero = $('.hero');
  const flotantes = $$('[data-barra], [data-wa]');
  if (hero && flotantes.length && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => flotantes.forEach(f => (f.dataset.visible = e.isIntersecting ? 'no' : 'si')), { rootMargin: '-120px 0px 0px 0px' }).observe(hero);
  }

  alScroll();
})();
