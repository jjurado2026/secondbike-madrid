/* =====================================================================
   SECONDBIKE — "Carril" (v2)
   Todo el contenido se lee sin JavaScript. Esto añade: la entrada del
   hero, la cadena que corre bajo la cabecera, el viaje de los servicios
   (el scroll vertical mueve la carretera en horizontal, la bici pedalea y
   cada persiana sube al llegar), el estado abierto/cerrado, el filtro de
   bicis, el cuentakilómetros, la batería, el desplegable del taller, la
   fachada del mapa, el menú y la barra fija en móvil.
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

  const cab = $('.cab');
  const cadena = $('.cab .cadena');
  const altoCab = () => (cab ? cab.getBoundingClientRect().height : 0);

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

  /* ---------- Servicios: el viaje por la carretera ----------
     La sección se alarga; su marco se queda fijo bajo la cabecera y el
     scroll vertical se convierte en avance horizontal. Cada tramo tiene
     una parada (la bici llega, la persiana sube) y un avance suave. */
  const servicios = $('[data-servicios]');
  let viaje = null;
  if (servicios && !quieto) {
    const marco = $('.servicios__marco', servicios);
    const pista = $('[data-pista-servicios]', servicios);
    const items = $$('.servicio', servicios);
    const hitos = $$('.hito', servicios);
    const bici = $('.ciclista', servicios);
    const actual = $('[data-actual]', servicios);
    const N = items.length;
    const suave = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let paso = 0, maxDesplaza = 0, recorrido = 1;

    servicios.classList.add('servicios--viaje');

    const medir = () => {
      paso = items[1].offsetLeft - items[0].offsetLeft;
      maxDesplaza = Math.max(0, pista.scrollWidth - marco.clientWidth);
      recorrido = Math.max(1, (N - 1) * innerHeight * (mqAncho.matches ? .62 : .55));
      servicios.style.setProperty('--alto-viaje', `${marco.offsetHeight + recorrido}px`);
    };
    const pintar = () => {
      const r = servicios.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (altoCab() - r.top) / recorrido));
      const f = p * (N - 1);
      const i = Math.min(N - 2, Math.floor(f));
      const local = f - i;
      // Un 30 % de cada tramo parado en el servicio; el resto, avance suave
      const pos = Math.min(N - 1, i + (local < .3 ? 0 : suave((local - .3) / .7)));
      const desplaza = pos * paso;
      const tx = Math.min(desplaza, maxDesplaza);
      pista.style.setProperty('--tx', `${-tx}px`);
      bici.style.setProperty('--bx', `${desplaza - tx}px`);
      bici.style.setProperty('--giro', `${pos * 540}deg`);
      const activo = Math.min(N - 1, Math.floor(pos + .12));
      items.forEach((it, k) => it.classList.toggle('abierto', k <= activo));
      hitos.forEach((h, k) => h.classList.toggle('pasado', k <= activo));
      if (actual) actual.textContent = activo + 1;
    };
    // Lleva el scroll hasta el servicio k (teclado, enlaces y ?servicio=)
    const irA = (k, suaveScroll = false) => {
      const tramo = recorrido / (N - 1);
      const y = scrollY + servicios.getBoundingClientRect().top - altoCab() + k * tramo + (k < N - 1 ? tramo * .12 : 0);
      scrollTo({ top: Math.round(y), behavior: suaveScroll ? 'smooth' : 'auto' });
    };
    items.forEach((it, k) => it.addEventListener('focusin', () => {
      if (!it.classList.contains('abierto') || Math.abs(it.getBoundingClientRect().left - items[0].getBoundingClientRect().left) > 2) irA(k);
    }));
    viaje = { medir, pintar };
    medir();
    pintar();
    const pedido = +new URLSearchParams(location.search).get('servicio');
    if (pedido >= 1 && pedido <= N) requestAnimationFrame(() => { irA(pedido - 1); pintar(); });
    if (document.fonts) document.fonts.ready.then(() => { medir(); pintar(); });
    addEventListener('load', () => { medir(); pintar(); });
  }

  /* ---------- Scroll: sombra de cabecera, cadena, viaje y batería ---------- */
  let pendiente = false;
  const alScroll = () => {
    pendiente = false;
    if (cab) cab.dataset.scroll = scrollY > 8 ? 'si' : 'no';
    // La cadena corre como si pedalearas: 28,8 px es el paso de un eslabón
    if (cadena && !quieto) cadena.style.setProperty('--c', `${((scrollY * .6) % 28.8).toFixed(2)}px`);
    if (viaje) viaje.pintar();
    bateria();
  };
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); } }, { passive: true });
  addEventListener('resize', () => { if (viaje) viaje.medir(); alScroll(); }, { passive: true });

  /* ---------- Bicis a la venta: filtro ----------
     Los recuentos son los de su tienda WooCommerce el 29-sep-2026.
     "Todas" enseña ocho; cada categoría, todas las que hay en el prototipo. */
  const TIENDA = {
    todas:     { n: 32, nombre: 'bicis',        url: 'https://www.secondbikemadrid.com/shop/' },
    montana:   { n: 7,  nombre: 'de montaña',   url: 'https://www.secondbikemadrid.com/categoria-producto/bicicletas-de-montana/' },
    urbana:    { n: 10, nombre: 'urbanas',      url: 'https://www.secondbikemadrid.com/categoria-producto/bicicletas-urbanas-de-segunda-mano/' },
    electrica: { n: 8,  nombre: 'eléctricas',   url: 'https://www.secondbikemadrid.com/categoria-producto/bicicletas-electrica-segunda-mano-madrid/' },
    carretera: { n: 6,  nombre: 'de carretera', url: 'https://www.secondbikemadrid.com/categoria-producto/bicicletas-de-carretera-de-segunda-mano-en-madrid/' },
    infantil:  { n: 5,  nombre: 'infantiles',   url: 'https://www.secondbikemadrid.com/categoria-producto/bicicletas-infantiles/' }
  };
  const escaparate = $('[data-escaparate]');
  if (escaparate) {
    const bicis = $$('.bici', escaparate);
    const mas = $('[data-mas]');
    const recuento = $('[data-recuento]');
    const filtros = $$('[data-filtro]');
    const filtrar = (tipo, animar = true) => {
      filtros.forEach(f => f.setAttribute('aria-pressed', String(f.dataset.filtro === tipo)));
      let i = 0;
      bicis.forEach(b => {
        const vale = (tipo === 'todas' ? i < 8 : b.dataset.tipo.split(' ').includes(tipo));
        b.hidden = !vale;
        b.classList.remove('entra');
        if (vale) {
          if (animar && !quieto) { void b.offsetWidth; b.style.setProperty('--i', i); b.classList.add('entra'); }
          i++;
        }
      });
      const t = TIENDA[tipo];
      $('[data-mas-num]', mas).textContent = t.n;
      $('[data-mas-tipo]', mas).textContent = t.nombre;
      mas.href = t.url;
      recuento.textContent = `${i} de ${t.n} ${tipo === 'todas' ? 'bicis en stock' : t.nombre + ' en stock'}`;
    };
    filtros.forEach(f => f.addEventListener('click', () => filtrar(f.dataset.filtro)));
    filtrar('todas', false);
  }

  /* ---------- Cuentakilómetros: cada cifra gira hasta su valor, una vez ---------- */
  const contadores = $$('.contador[data-valor]');
  contadores.forEach(c => {
    const valor = String(c.dataset.valor);
    const conPunto = valor.length > 3 ? valor.slice(0, -3) + '.' + valor.slice(-3) : valor;
    let k = 0;
    const html = [...conPunto].map(ch => {
      if (ch === '.') return '<span class="contador__punto">.</span>';
      const cinta = Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join('');
      return `<span class="rodillo"><span class="rodillo__cinta" style="--d:${+ch};transition-delay:${(k++) * 90}ms">${cinta}</span></span>`;
    }).join('');
    c.innerHTML = `<span aria-hidden="true" class="contador__cifras"><span class="contador__signo">+</span>${html}</span>`;
  });
  if (contadores.length) {
    const lista = $('.cifras');
    if (quieto || !('IntersectionObserver' in window)) lista.classList.add('gira');
    else {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { lista.classList.add('gira'); io.disconnect(); }
      }), { threshold: .45 });
      io.observe(lista);
    }
  }

  /* ---------- "Más sobre nuestro taller" ---------- */
  $$('[data-leer]').forEach(boton => {
    const bloque = document.getElementById(boton.getAttribute('aria-controls'));
    if (!bloque) return;
    bloque.hidden = true;
    boton.addEventListener('click', () => {
      const abrir = boton.getAttribute('aria-expanded') !== 'true';
      boton.setAttribute('aria-expanded', String(abrir));
      bloque.hidden = !abrir;
      bloque.classList.remove('abre');
      if (abrir && !quieto) {
        $$('p', bloque).forEach((p, i) => p.style.setProperty('--i', i));
        void bloque.offsetWidth; bloque.classList.add('abre');
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
    const p = (innerHeight * .85 - r.top) / (innerHeight * .55);
    relleno.style.setProperty('--carga', Math.min(1, Math.max(.04, p)).toFixed(3));
  }

  /* ---------- Barra fija y WhatsApp: aparecen cuando el hero sale ---------- */
  const hero = $('.hero');
  const flotantes = $$('[data-barra], [data-wa]');
  if (hero && flotantes.length && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => flotantes.forEach(f => (f.dataset.visible = e.isIntersecting ? 'no' : 'si')), { rootMargin: '-120px 0px 0px 0px' }).observe(hero);
  }

  alScroll();
})();
