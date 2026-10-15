/* Asistente · pasos Equipo, Recompensas, Historia y Resumen. */
(function (g) {
  'use strict';
  const PJ = g.PJ;
  const { h, contador, puntos, barra, avisosLista, fila, descCorta, descEquipo, limpioTitulo, hrefEntrada, chipCoste } = PJ.ui;
  const D = () => PJ.datos();
  const W = PJ.wiz = PJ.wiz || {};
  const { botonSel, defDesbloqueado, divisa } = W;
  const redondea = n => Math.round(n * 100) / 100;
  const fmtAr = n => String(redondea(n)).replace('.', ',');
  const precioDe = id => { const e = PJ.datos().byId[id]; return (e && e.f && +e.f.precio_n) || 0; };
  const gastoEquipo = c => {
    let g = 0;
    if (c.armadura && !c.armaduraGratis) g += precioDe(c.armadura);
    c.armas.forEach(w => { if (w.ref && !w.gratis) g += precioDe(w.ref); });
    c.equipo.forEach(it => { if (it.ref && !it.gratis) g += precioDe(it.ref) * (it.cant || 1); });
    return redondea(g);
  };
  const iniDe = c => (c.arquillasIni != null ? c.arquillasIni : c.arquillas + gastoEquipo(c));
  const fijarArquillas = (c, ini) => { c.arquillasIni = Math.max(0, redondea(ini)); c.arquillas = Math.max(0, redondea(c.arquillasIni - gastoEquipo(c))); };
  const dadosKit = k => { const m = /(\d+)d(\d+)\s+(?:arquillas|marcos)/i.exec((k && k.body) || ''); return m ? [+m[1], +m[2]] : null; };
  // En Mistborn Era 2 el dinero inicial se multiplica por 10; en Stormlight no
  const factorDinero = c => (PJ.ambito(c) === 'Mistborn' && c.era === 2 ? 10 : 1);
  const tiraDados = (d, c) => { let t = 0; for (let i = 0; i < d[0]; i++) t += 1 + Math.floor(Math.random() * d[1]); return t * factorDinero(c); };

  // Contenido fijo de cada conjunto (el libro lo da en prosa). Lo que el libro deja "a tu elección" no se añade:
  // lo elige la persona jugadora. Los nombres son el slug del id; en Stormlight el id lleva "-stormlight-".
  const KIT_OBJETOS = {
    'equipo-inicial-de-artesano': { armadura: 'cuero', equipo: [['arcon'], ['ropa-comun'], ['suministros-quirurgicos'], ['antiseptico-debil-5-dosis'], ['calamo'], ['tinta-vial-de-30-ml'], ['papel-o-pergamino-1-hoja', 5], ['vela', 5], ['pedernal-y-acero'], ['botella-cristal', 3], ['diapason'], ['instrumento-musical'], ['balanza']] },
    'equipo-inicial-de-bajos-fondos': { armadura: 'cuero', equipo: [['mochila'], ['ropa-comun'], ['alcohol-botella'], ['nudilleras'], ['palanca'], ['ganzua'], ['cuerda-15-metros'], ['pedernal-y-acero'], ['linterna-aceite'], ['aceite-1-frasco'], ['comida-callejera-1-dia', 5]] },
    'equipo-inicial-de-noble': { armas: ['baston-de-duelo'], equipo: [['alcohol-botella'], ['ropa-buena']] },
    'equipo-inicial-de-fugitivo': { equipo: [['ropa-raida']] },
    'equipo-inicial-de-guardador': { equipo: [['ropa-buena']] },
    'equipo-inicial-de-indagador': { armas: era => [era === 1 ? 'cuchillo' : 'pistola-de-bota'], armadura: 'uniforme', equipo: [['mochila'], ['ropa-comun'], ['calamo'], ['tinta-vial-de-30-ml'], ['papel-o-pergamino-1-hoja', 20], ['linterna-aceite'], ['libro-referencia'], ['cerradura-y-llave']] },
    'equipo-inicial-de-mercenario': { armadura: 'coraza', equipo: [['mochila'], ['ropa-comun'], ['odre'], ['lupa'], ['palanca'], ['grilletes'], ['comida-racion-1-dia', 10]] },
    'equipo-stormlight-inicial-prisionero': { equipo: [['grilletes'], ['ropa-raida']] },
    'equipo-stormlight-inicial-bajos-fondos': { armadura: 'cuero', equipo: [['mochila'], ['ropa-comun'], ['alcohol-botella'], ['palanca'], ['ganzua'], ['cuerda-15-metros'], ['pedernal-y-acero'], ['linterna-aceite'], ['aceite-1-frasco'], ['comida-callejera-1-dia', 5]] },
    'equipo-stormlight-inicial-academico': { armadura: 'uniforme', equipo: [['mochila'], ['ropa-comun'], ['calamo'], ['tinta-vial-de-30-ml'], ['papel-o-pergamino-1-hoja', 10], ['vial-cristal', 3], ['cera-1-bloque'], ['libro-de-referencia'], ['veneno-debil-1-dosis']] },
    'equipo-stormlight-inicial-artesano': { armadura: 'cuero', equipo: [['arcon'], ['ropa-comun'], ['suministros-quirurgicos'], ['antiseptico-debil-5-dosis'], ['calamo'], ['tinta-vial-de-30-ml'], ['papel-o-pergamino-1-hoja', 5], ['vela', 5], ['pedernal-y-acero'], ['botella-cristal', 3], ['diapason'], ['instrumento-musical'], ['balanza']] },
    'equipo-stormlight-inicial-militar': { armadura: 'malla', equipo: [['mochila'], ['ropa-comun'], ['odre'], ['pedernal-y-acero'], ['piedra-de-afilar'], ['manta'], ['comida-racion-1-dia', 10]] },
    'equipo-stormlight-inicial-cortesano': { equipo: [['alcohol-botella'], ['ropa-buena']] },
  };
  // Quita lo que añadió el conjunto anterior y añade el del nuevo (todo marcado como "del conjunto", gratis)
  const aplicaKit = (cc, id) => {
    const D = PJ.datos(), sl = !!id && id.includes('stormlight');
    const res = (cat, slug) => { const i = sl ? `${cat}-stormlight-${slug}` : `${cat}-${slug}`; return D.byId[i] ? i : null; };
    if (cc.armaduraKit) { cc.armadura = null; cc.armaduraKit = false; }
    cc.armas = cc.armas.filter(w => !w.delKit);
    cc.equipo = cc.equipo.filter(it => !it.delKit);
    const def = id && KIT_OBJETOS[id];
    if (!def) return;
    const a = def.armadura && !cc.armadura && res('armadura', def.armadura);
    if (a) { cc.armadura = a; cc.armaduraGratis = true; cc.armaduraKit = true; }
    (typeof def.armas === 'function' ? def.armas(cc.era) : def.armas || []).forEach(s => {
      const r = res('arma', s); if (r) cc.armas.push({ ref: r, nombre: D.byId[r].title, gratis: true, delKit: true });
    });
    (def.equipo || []).forEach(([s, n]) => {
      const r = res('equipo', s); if (r) cc.equipo.push({ ref: r, nombre: D.byId[r].title, cant: n || 1, gratis: true, delKit: true });
    });
  };

  // El estado de la interfaz (sección y filtros) vive aquí porque cambiar() reconstruye todo el asistente
  const eq = { sec: 'inicial', tipo: '', peso: '', cat: '', busca: '' };

  // El libro no clasifica el equipo: la categoría se deduce del nombre (único sitio donde se define)
  const CATS_EQUIPO = [
    ['Medicina y venenos', /anestesico|antiseptico|quirurgic|tonica|tratamiento|veneno/],
    ['Comida y bebida', /comida|alcohol/],
    ['Ropa', /\bropa\b/],
    ['Luz y fuego', /linterna|\bvela\b|pedernal|aceite|\bcera\b/],
    ['Contenedores', /arcon|barril|bolsa|botella|\bcubo\b|estuche|frasco|jarra|mochila|odre|\bsaco\b|\bvial\b/],
    ['Cuerdas y cierres', /cuerda|cadena|grilletes|cerradura|ganzua|garfio|polea/],
    ['Escritura y estudio', /calamo|tinta|libro|papel|pergamino|lupa|catalejo|balanza|diapason|trompetilla|espejo|instrumento/],
    ['Herramientas', /martillo|\bpala\b|palanca|\bpico\b|piedra de afilar|\bred\b|escalera/],
  ];
  const catEquipo = e => { const t = PJ.norm(e.title); const k = CATS_EQUIPO.find(([, re]) => re.test(t)); return k ? k[0] : 'Varios'; };

  const chipFiltro = (on, texto, onclick) => h('button', { type: 'button', class: 'chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick }, texto);

  // Lista completa con filtros: los filtros y la lista se repintan solos (sin reconstruir el asistente)
  function catalogoFiltrable({ items, barras, pasa, buscador, fila: pintaFila }) {
    const zonaBarras = h('div'), zonaLista = h('ul', { class: 'lista talentos resultados' }), cuenta = h('p', { class: 'nota' });
    const pintar = () => {
      const q = PJ.norm(eq.busca);
      const vis = items.filter(x => pasa(x) && (!q || PJ.norm(x.title).includes(q)));
      zonaBarras.innerHTML = ''; barras(pintar).forEach(b => zonaBarras.appendChild(b));
      zonaLista.innerHTML = ''; vis.forEach(x => zonaLista.appendChild(pintaFila(x)));
      cuenta.textContent = vis.length ? `${vis.length} de ${items.length}` : 'Nada coincide con los filtros.';
    };
    pintar();
    return h('div', null, zonaBarras,
      buscador ? h('input', { type: 'search', placeholder: 'Buscar por nombre…', value: eq.busca, oninput: e => { eq.busca = e.target.value; pintar(); } }) : null,
      cuenta, zonaLista);
  }

  function pasoEquipo({ c, d, cambiar, silencioso }) {
    const D = PJ.datos(), byId = D.byId;
    const refValida = r => (r && byId[r] ? r : null);
    const botonAnadir = alElegir => h('button', { type: 'button', class: 'btn small', onclick: alElegir }, 'Añadir');
    const grupo = (nombre, chips) => h('div', { class: 'chips', role: 'group', 'aria-label': nombre }, chips);
    // toda modificación del equipo pasa por aquí para que las arquillas restantes se recalculen
    const mut = fn => cambiar(cc => { const ini = iniDe(cc); const nuevo = fn(cc); fijarArquillas(cc, nuevo != null ? nuevo : ini); });
    const delConjunto = (marcado, alCambiar) => (c.kit
      ? h('label', { class: 'chk nota' }, h('input', { type: 'checkbox', checked: !!marcado, onchange: e => alCambiar(e.target.checked) }), 'Del conjunto (gratis)')
      : null);

    const secInicial = () => {
      const kits = D.base.filter(e => e.cat === 'equipo' && e.f && e.f.tipo === 'Equipo inicial' && PJ.ambCubre(c, e));
      const kit = c.kit && byId[c.kit];
      const dados = dadosKit(kit);
      const elegir = (id, libre) => cambiar(cc => {
        cc.kit = id; cc.equipoLibre = libre;
        cc.poderes.filter(p => p.origen === 'inicial').forEach(p => { p.desbloqueado = defDesbloqueado(cc, p.arte); });
        cc.armaduraGratis = false; cc.armas.forEach(w => { delete w.gratis; }); cc.equipo.forEach(it => { delete it.gratis; });
        aplicaKit(cc, id);
        if (id) { fijarArquillas(cc, dadosKit(byId[id]) ? tiraDados(dadosKit(byId[id]), cc) : 0); } else fijarArquillas(cc, 0);
      });
      const tirar = () => mut(cc => tiraDados(dados, cc));
      return h('div', null,
        h('ul', { class: 'lista talentos' },
          fila({
            titulo: 'Elección libre', on: !!c.equipoLibre,
            corta: 'No usas un conjunto inicial: eliges todo tu equipo y tú decides con cuántos ' + divisa(c).divisa + ' empiezas.',
            accion: botonSel(!!c.equipoLibre, 'Elegir', () => elegir(null, !c.equipoLibre)),
          }),
          kits.map(k => {
            const on = k.id === c.kit;
            return fila({
              ref: k.id, titulo: k.title.replace(/^Equipo inicial de /i, '').replace(/^./, s => s.toUpperCase()), corta: descCorta(k), on,
              accion: botonSel(on, 'Elegir', () => elegir(on ? null : k.id, false)),
            });
          })),
        c.kit || c.equipoLibre ? h('div', { class: 'form fila' },
          dados ? h('button', { type: 'button', class: 'btn', onclick: tirar }, `Tirar ${dados[0]}d${dados[1]}${factorDinero(c) > 1 ? ' × ' + factorDinero(c) : ''}`) : null,
          kit && !dados ? h('span', { class: 'nota' }, 'Este conjunto no incluye dinero.') : null) : h('p', { class: 'muted' }, 'Elige un conjunto o marca "Elección libre" para fijar tus ' + divisa(c).divisa + ' iniciales.'));
    };

    const resumen = () => {
      const kit = c.kit && byId[c.kit];
      const ini = iniDe(c), gasto = gastoEquipo(c), resto = redondea(ini - gasto);
      const cifra = (n, v, cls) => h('span', { class: 'cifra ' + (cls || '') }, h('span', { class: 'nota' }, n), h('b', null, fmtAr(v)));
      const lineas = kit ? String(kit.body || '').split('\n').map(l => l.replace(/^#+\s*/, '').trim())
        .filter(l => /^(armas|armadura|equipo|dinero|divisa|esferas|pericia|mente|conexi[oó]n)/i.test(l)).map(l => PJ.ui.plano(l).replace(/\s*era\s*(\d)\s*/gi, ' (era $1) ').replace(/\s+/g, ' ').trim()) : [];
      return h('div', { class: 'banda-equipo' },
        h('div', { class: 'be-fila' },
          h('span', null, h('b', null, 'Equipo inicial: '),
            kit ? kit.title.replace(/^Equipo inicial de /i, '').replace(/^./, s => s.toUpperCase()) : c.equipoLibre ? 'Elección libre' : 'sin elegir'),
          kit ? h('button', { type: 'button', class: 'btn small clic', onclick: () => PJ.ui.abrirPanel(kit.id) }, 'Ver conjunto') : null,
          h('span', { class: 'cifras' }, (kit || c.equipoLibre
            ? h('label', { class: 'cifra' }, h('span', { class: 'nota' }, divisa(c).Divisa + ' iniciales'),
              h('input', { type: 'number', min: 0, step: 'any', 'aria-label': divisa(c).Divisa + ' iniciales', value: ini, onchange: e => mut(() => Math.max(0, +e.target.value || 0)) }))
            : cifra(divisa(c).Divisa + ' iniciales', ini)), cifra('Gastadas', gasto), cifra('Restantes', resto, resto < 0 ? 'mal' : ''))),
        resto < 0 ? h('p', { class: 'mal nota' }, `Te pasas ${fmtAr(-resto)} ${divisa(c).divisa}.`) : null,
        lineas.length ? h('details', null, h('summary', null, 'Incluido en el conjunto'), h('ul', { class: 'lista' }, lineas.map(l => h('li', null, l)))) : null);
    };

    const secArmadura = () => h('div', null,
      c.kit && c.armadura ? h('p', null, delConjunto(c.armaduraGratis, v => mut(cc => { cc.armaduraGratis = v; }))) : null,
      h('ul', { class: 'lista talentos' }, D.base.filter(e => e.cat === 'armadura' && PJ.ambCubre(c, e)).map(a => {
        const on = a.id === c.armadura;
        return fila({
          ref: a.id, titulo: limpioTitulo(a.title), corta: descEquipo(a), on,
          accion: botonSel(on, 'Elegir', () => mut(cc => { cc.armadura = on ? null : a.id; cc.armaduraGratis = false; })),
        });
      })));

    const secArmas = () => {
      const lig = x => /ligero/.test(PJ.norm((x.f || {}).habilidad));
      const pes = x => /pesado/.test(PJ.norm((x.f || {}).habilidad));
      const pasaPeso = { lig, pes, otras: x => !lig(x) && !pes(x) };
      return h('div', null,
        h('h4', { class: 'titulo-grupo' }, 'Tus armas'),
        c.armas.length ? h('ul', { class: 'lista talentos' }, c.armas.map((w, i) => {
          const ref = refValida(w.ref);
          return fila({
            ref, titulo: w.nombre, corta: ref ? descEquipo(byId[ref]) : '', on: true,
            accion: [delConjunto(w.gratis, v => mut(cc => { cc.armas[i].gratis = v; })),
              h('button', { type: 'button', class: 'btn small', onclick: () => mut(cc => { cc.armas.splice(i, 1); }) }, 'Quitar')],
          });
        })) : h('p', { class: 'muted' }, 'Sin armas.'),
        h('h4', { class: 'titulo-grupo' }, 'Añadir un arma'),
        catalogoFiltrable({
          items: D.base.filter(e => e.cat === 'arma' && PJ.ambCubre(c, e)), buscador: true,
          barras: pintar => [
            grupo('Tipo', [['', 'Todas'], ['Cuerpo a cuerpo', 'Cuerpo a cuerpo'], ['A distancia', 'A distancia']].map(([v, t]) => chipFiltro(eq.tipo === v, t, () => { eq.tipo = v; pintar(); }))),
            grupo('Peso', [['', 'Cualquiera'], ['lig', 'Ligeras'], ['pes', 'Pesadas'], ['otras', 'Otras']].map(([v, t]) => chipFiltro(eq.peso === v, t, () => { eq.peso = v; pintar(); }))),
          ],
          pasa: x => (!eq.tipo || (x.f || {}).tipo === eq.tipo) && (!eq.peso || pasaPeso[eq.peso](x)),
          fila: x => {
            const n = c.armas.filter(w => w.ref === x.id).length;
            return fila({
              ref: x.id, titulo: limpioTitulo(x.title), corta: descEquipo(x),
              chips: n ? [h('span', { class: 'chip small soft' }, '×' + n)] : [],
              accion: botonAnadir(() => mut(cc => { cc.armas.push({ ref: x.id, nombre: x.title }); })),
            });
          },
        }));
    };

    const secObjetos = () => {
      const items = D.base.filter(e => e.cat === 'equipo' && PJ.ambCubre(c, e) && e.f.tipo !== 'Equipo inicial');
      const cats = [...new Set(items.map(catEquipo))].sort((a, b) => (a === 'Varios') - (b === 'Varios') || a.localeCompare(b, 'es'));
      let libre = '';
      return h('div', null,
        h('h4', { class: 'titulo-grupo' }, 'Tus objetos'),
        c.equipo.length ? h('ul', { class: 'lista talentos' }, c.equipo.map((it, i) => {
          const ref = refValida(it.ref);
          return fila({
            ref, titulo: it.nombre, corta: ref ? descEquipo(byId[ref]) : '', on: true,
            accion: [
              delConjunto(it.gratis, v => mut(cc => { cc.equipo[i].gratis = v; })),
              h('input', { type: 'number', min: 1, class: 'cant', 'aria-label': 'Cantidad de ' + it.nombre, value: it.cant || 1, onchange: e => mut(cc => { cc.equipo[i].cant = Math.max(1, +e.target.value || 1); }) }),
              h('button', { type: 'button', class: 'btn small', onclick: () => mut(cc => { cc.equipo.splice(i, 1); }) }, 'Quitar')],
          });
        })) : h('p', { class: 'muted' }, 'Sin objetos.'),
        h('h4', { class: 'titulo-grupo' }, 'Añadir un objeto'),
        catalogoFiltrable({
          items, buscador: true,
          barras: pintar => [grupo('Categoría', [['', 'Todos'], ...cats.map(k => [k, k])].map(([v, t]) => chipFiltro(eq.cat === v, t, () => { eq.cat = v; pintar(); })))],
          pasa: x => !eq.cat || catEquipo(x) === eq.cat,
          fila: x => {
            const n = c.equipo.filter(it => it.ref === x.id).reduce((s, it) => s + (it.cant || 1), 0);
            return fila({
              ref: x.id, titulo: limpioTitulo(x.title), corta: descEquipo(x),
              chips: n ? [h('span', { class: 'chip small soft' }, '×' + n)] : [],
              accion: botonAnadir(() => mut(cc => { cc.equipo.push({ ref: x.id, nombre: x.title, cant: 1 }); })),
            });
          },
        }),
        h('div', { class: 'form fila' }, h('label', null, 'Objeto libre', h('input', { type: 'text', oninput: e => { libre = e.target.value; } })),
          h('button', { type: 'button', class: 'btn', onclick: () => { if (libre.trim()) mut(cc => { cc.equipo.push({ nombre: libre.trim(), cant: 1 }); }); } }, 'Añadir')));
    };

    const SECCIONES = [
      ['inicial', 'Inicial', secInicial, c.kit || c.equipoLibre ? 1 : 0],
      ['armadura', 'Armadura', secArmadura, c.armadura ? 1 : 0],
      ['armas', 'Armas', secArmas, c.armas.length],
      ['objetos', 'Objetos', secObjetos, c.equipo.length],
    ];
    if (!SECCIONES.some(s => s[0] === eq.sec)) eq.sec = 'inicial';
    const activa = SECCIONES.find(s => s[0] === eq.sec);
    return h('div', { class: 'paso' },
      resumen(),
      h('nav', { class: 'pasos sub', 'aria-label': 'Secciones del equipo' }, SECCIONES.map(([k, nombre, , n]) =>
        h('button', { type: 'button', class: 'paso-tab' + (k === eq.sec ? ' on' : ''), 'aria-pressed': k === eq.sec ? 'true' : 'false', onclick: () => { eq.sec = k; cambiar(() => {}); } },
          nombre, n ? h('span', { class: 'cuenta' }, String(n)) : null))),
      activa[2]());
  }

  function pasoRecompensas({ c, d, cambiar, silencioso }) {
    const r = d.recompensasInicio;
    let texto = '', rango = 1;
    const contar = n => c.recompensas.filter(x => x.rango === n).length;
    return h('div', { class: 'paso' },
      h('p', { class: 'muted' }, 'Al empezar por encima del nivel 1 recibes recompensas ya ganadas. Anótalas aquí (el detalle de cada una está en el libro).'),
      r ? h('div', null,
        h('p', null, h('b', null, r.arquillas + ' ' + divisa(c).divisa), ' de dinero inicial ',
          h('button', { type: 'button', class: 'btn small', onclick: () => cambiar(c => { fijarArquillas(c, r.arquillas); }) }, 'Aplicar')),
        h('ul', { class: 'lista' }, Object.entries(r.recompensas).map(([n, cant]) => h('li', { class: contar(+n) > cant ? 'mal' : '' }, `Recompensas de rango ${n}: ${contar(+n)} / ${cant}`)))) : h('p', null, 'Empiezas en nivel 1: sin recompensas adicionales.'),
      h('ul', { class: 'lista' }, c.recompensas.map((x, i) => h('li', null, h('span', { class: 'chip small' }, 'R' + x.rango), ' ', x.texto,
        h('button', { type: 'button', class: 'btn small', onclick: () => cambiar(c => { c.recompensas.splice(i, 1); }) }, 'Quitar')))),
      h('div', { class: 'form fila' },
        h('label', null, 'Rango', h('select', { onchange: e => { rango = +e.target.value; } }, [1, 2, 3, 4, 5].map(n => h('option', { value: n }, 'Rango ' + n)))),
        h('label', null, 'Recompensa', h('input', { type: 'text', placeholder: 'Ej.: Pericia en arma, patrocinador, clavo hemalúrgico…', oninput: e => { texto = e.target.value; } })),
        h('button', { type: 'button', class: 'btn', onclick: () => { if (texto.trim()) cambiar(c => { c.recompensas.push({ texto: texto.trim(), rango }); }); } }, 'Añadir')),
      h('p', null, h('a', { href: 'index.html#/c/recompensa', target: '_blank', rel: 'noopener' }, 'Catálogo de recompensas en el buscador')));
  }

  function pasoHistoria({ c, cambiar, silencioso }) {
    return h('div', { class: 'paso' }, PJ.ui.historia(c, { cambiar, silencioso }));
  }

  function pasoResumen({ c, d, modo, ir }) {
    const pendientes = d.avisos.filter(a => a.tipo === 'pendiente');
    return h('div', { class: 'paso' },
      h('h3', null, `${c.nombre || 'Sin nombre'} · nivel ${d.nivel} (rango ${d.rango})`),
      h('div', { class: 'res' },
        h('div', null, h('b', null, 'Salud'), ' ', d.salud), h('div', null, h('b', null, 'Concentración'), ' ', d.concentracion),
        d.investidura !== null ? h('div', null, h('b', null, 'Investidura'), ' ', d.investidura) : null,
        h('div', null, h('b', null, 'Defensas'), ` ${d.defensas.fisica} / ${d.defensas.cognitiva} / ${d.defensas.espiritual}`),
        h('div', null, h('b', null, 'Camino'), ' ', PJ.ui.nombreCamino(c.camino) || '—'),
        d.radiante ? h('div', null, h('b', null, 'Orden radiante'), ' ', d.radiante.nombre, ` (${d.radiante.ideales} Ideal${d.radiante.ideales === 1 ? '' : 'es'})`) : null),
      pendientes.length ? h('div', null, h('h4', null, 'Pendiente de completar'), avisosLista(d.avisos)) :
        d.avisos.length ? avisosLista(d.avisos) : h('p', { class: 'bien' }, 'Todo en orden: no hay nada pendiente.'));
  }

  // Roshar: orden, Ideales (con los hitos de su meta) y potencias. Los Ideales que se pueden marcar son los de los talentos
  // de Ideal que ya tienes; pronunciar el Primer Ideal es lo que da las dos potencias (con 1 grado) a la hoja.

  Object.assign(W, { pasoEquipo, pasoHistoria, pasoRecompensas, pasoResumen });
})(window);
