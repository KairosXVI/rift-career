/* Interfaz: todas las pantallas del juego. */
(function (RC) {
  const { U, C, D, W, P, Season } = RC;
  const G = (RC.G = { S: null, tab: 'inicio', create: null, compLeague: null, marketLeague: null, champQuery: '', champRole: null, modal: null, negAmount: {}, importText: '', confirmNew: false, slot: 1, impSlot: 1 });
  // Tres espacios de guardado. La partida del formato antiguo pasa al espacio 1.
  const OLD_KEY = 'rc_save_v1';
  RC.SLOTS = [1, 2, 3];
  const slotKey = (n) => 'rc_slot_' + n;
  try { if (localStorage.getItem(OLD_KEY) && !localStorage.getItem(slotKey(1))) { localStorage.setItem(slotKey(1), localStorage.getItem(OLD_KEY)); localStorage.removeItem(OLD_KEY); } } catch (e) { /* sin almacenamiento */ }
  const $app = () => document.getElementById('app');
  const esc = U.esc;

  // ---------- Guardado ----------
  RC.save = function () {
    if (!G.S) return;
    try { localStorage.setItem(slotKey(G.slot), JSON.stringify(G.S)); } catch (e) { toast('No se ha podido guardar en este navegador.', true); }
  };
  RC.loadSave = function (n = G.slot) {
    try { const raw = localStorage.getItem(slotKey(n)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  };
  RC.clearSave = function (n = G.slot) { try { localStorage.removeItem(slotKey(n)); } catch (e) { /* nada */ } };
  RC.firstEmptySlot = () => RC.SLOTS.find((n) => !RC.loadSave(n));

  // ---------- Iconos ----------
  const ICON = {
    coin: '<svg viewBox="0 0 24 24" fill="none" stroke="#F5D08A" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.7 0-2.5 1-2.5 2s1 1.6 2.5 2 2.5 1 2.5 2-1 2-2.5 2c-1.1 0-2-.5-2.5-1.5M12 6v2m0 8v2"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="#19D3F3"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="#F5576C"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>',
    fans: '<svg viewBox="0 0 24 24" fill="none" stroke="#9FB0C3" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.4 0 4.2 1.5 4.6 4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="#F5D08A"><path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21.1l1.4-7L2 9.3l7-.8z"/></svg>',
  };

  // ---------- Piezas ----------
  const teamLogo = (team, s = 36) => {
    if (!team) return `<div class="logo-txt" style="--s:${s}px;background:#223">?</div>`;
    const src = team.logo && D.logo(team.logo);
    if (src) return `<img class="logo" style="--s:${s}px" src="${src}" alt="${esc(team.short)}">`;
    return `<div class="logo-txt" style="--s:${s}px;background:${team.color}">${esc(team.short.slice(0, 4))}</div>`;
  };
  const champImg = (id, s = 40) => `<img class="champ" style="--s:${s}px" src="${D.champImg(id)}" alt="${esc(D.champName(id))}" title="${esc(D.champName(id))}">`;
  const bar = (v, max = 100, cls = '') => `<div class="bar ${cls}"><i style="width:${U.clamp((v / max) * 100, 0, 100)}%"></i></div>`;
  const tierBadge = (champ) => { const t = P.tierOf(P.meta(G.S, champ)); return `<span class="tier tier-${t}" title="Tier ${t} en el parche">${t}</span>`; };
  // Logo de un equipo a partir de su nombre (sirve para el historial y el Salón de la fama)
  const logoByName = (name, s = 20) => {
    const t = D.teams[name];
    if (!t) return '';
    const src = t.logo && D.logo(t.logo);
    return src ? `<img class="logo" style="--s:${s}px" src="${src}" alt="">` : `<div class="logo-txt" style="--s:${s}px;background:${U.hashColor(name)}">${esc(t.short.slice(0, 3))}</div>`;
  };
  const NAMES_BY_LEN = () => (NAMES_BY_LEN.c = NAMES_BY_LEN.c || Object.keys(D.teams).sort((a, b) => b.length - a.length));
  const logosInText = (text) => { const found = []; let rest = text; for (const n of NAMES_BY_LEN()) { if (rest.includes(n)) { found.push(n); rest = rest.split(n).join(''); } } return found.map((n) => logoByName(n, 22)).join(''); };
  const leagueName = (lg) => (C.LEAGUES[lg] ? C.LEAGUES[lg].name : lg);
  const teamName = (tid) => (G.S.world.teams[tid] ? G.S.world.teams[tid].name : '?');
  const flag = (id) => (C.NATIONS.find((n) => n.id === id) || {}).flag || '';

  function toast(msg, err) {
    if (!msg) return;
    let el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
    el.className = 'toast' + (err ? ' err' : '');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (el.hidden = true), 3200);
  }
  RC.toast = toast;

  // ---------- Render principal ----------
  RC.render = function () {
    const S = G.S;
    let html;
    if (!S) html = G.create ? viewCreate() : viewMenu();
    else if (S.startOffers) html = viewStartOffers();
    else if (S.over) html = viewEnd();
    else html = viewGame();
    const y = window.scrollY;
    $app().innerHTML = html + (G.modal ? `<div class="modal-bg" data-act="closeModalBg"><div class="modal" role="dialog" aria-modal="true">${G.modal()}</div></div>` : '');
    window.scrollTo(0, y);
  };

  // ---------- Menú ----------
  function viewMenu() {
    let hof = [];
    try { hof = JSON.parse(localStorage.getItem('rc_hof') || '[]'); } catch (e) { /* nada */ }
    return `<div class="wrap">
      <section class="hero">
        <div class="badge gold">Simulador de carrera · League of Legends</div>
        <h1>RIFT <span>CAREER</span></h1>
        <p>No eres el mánager: eres el jugador. Entrena, mejora tu equipo, elige tus campeones, negocia contratos y llega desde la academia hasta los Worlds.</p>
      </section>
      <h2 style="text-align:center;margin-bottom:12px">Partidas guardadas</h2>
      <div class="slots">${RC.SLOTS.map(slotCard).join('')}</div>
      <h2 style="text-align:center;margin:32px 0 12px">Modos de juego</h2>
      <div class="mode-cards">
        <button class="mode" data-act="newMode" data-mode="pro">
          <span class="yr">2026 · 16 años</span>
          <h3>Fichaje de academia</h3>
          <span>Una academia de tu país te quiere. Empiezas en la liga regional con plantillas reales de 2026 y tienes que ganarte el salto a las grandes ligas.</span>
        </button>
        <button class="mode" data-act="newMode" data-mode="kid">
          <span class="yr">2018 · 10 años</span>
          <h3>Desde Hierro</h3>
          <span>Empiezas en Hierro con 10 años. Sube en SoloQ, aprovecha los eventos y consigue que una academia te fiche entre los 14 y los 18 años.</span>
        </button>
      </div>
      <div class="row" style="justify-content:center;margin-top:24px">
        <button class="btn" data-act="importOpen">Importar partida</button>
      </div>
      ${hof.length ? `<section class="panel" style="max-width:860px;margin:32px auto 0"><h2>Salón de la fama</h2>${hofTable(hof)}</section>` : ''}
      <p class="small muted" style="text-align:center;margin-top:40px">Proyecto personal sin ánimo de lucro. League of Legends y sus campeones son de Riot Games; los logos son de sus equipos. Plantillas basadas en MyRiftManager y Leaguepedia.</p>
    </div>`;
  }

  function slotCard(n) {
    const S = RC.loadSave(n);
    if (!S || !S.pl) {
      return `<div class="slot empty"><span class="slot-n">Espacio ${n}</span><b>Vacío</b>
        <div class="stack" style="gap:6px;margin-top:auto"><button class="btn primary sm" data-act="slotNew" data-v="${n}" data-mode="pro">Academia (2026)</button><button class="btn sm" data-act="slotNew" data-v="${n}" data-mode="kid">Desde Hierro (2018)</button></div></div>`;
    }
    const pl = S.pl;
    const team = pl.teamId && S.world && S.world.teams[pl.teamId];
    const ovr = W.ovr({ mech: 0.6 * pl.attrs.mecanicas + 0.4 * pl.attrs.farmeo, macro: 0.6 * pl.attrs.macro + 0.4 * pl.attrs.vision, ment: 0.6 * pl.attrs.mentalidad + 0.4 * pl.attrs.comunicacion });
    const confirm = G.confirmDel === n;
    return `<div class="slot"><span class="slot-n">Espacio ${n}${S.over ? ' · Terminada' : ''}</span>
      <div class="row" style="gap:10px">${team ? teamLogo(team, 40) : '<span class="av">' + esc(pl.name.slice(0, 1)) + '</span>'}<div style="min-width:0"><b class="slot-name">${flag(pl.nation)} ${esc(pl.name)}</b><span class="small muted">${C.ROLE_ES[pl.role]} · ${pl.age} años · ${S.year}</span></div><span class="ovr sm" style="margin-left:auto">${ovr.toFixed(0)}</span></div>
      <span class="small">${team ? esc(team.name) + ' · ' + esc(C.LEAGUES[team.league].name) : S.amateur ? 'Etapa amateur' : 'Sin equipo'} · ${pl.titles.length} título${pl.titles.length === 1 ? '' : 's'}</span>
      ${confirm ? `<div class="alert red small">¿Borrar esta partida? No se puede deshacer.</div><div class="row"><button class="btn danger sm" data-act="slotDelYes" data-v="${n}">Sí, borrar</button><button class="btn sm" data-act="slotDelNo">Cancelar</button></div>`
        : `<div class="row" style="margin-top:auto"><button class="btn primary sm" data-act="slotPlay" data-v="${n}">Continuar</button><button class="btn danger sm" data-act="slotDel" data-v="${n}">Borrar</button></div>`}</div>`;
  }

  function hofTable(list) {
    const rows = list.slice().sort((a, b) => b.titles - a.titles || b.peak - a.peak).map((e) => `<tr><td>${flag(e.nation)} <b class="gold">${esc(e.name)}</b> <span class="muted small">${C.ROLE_ES[e.role]}</span><div class="row" style="gap:4px;margin-top:3px">${(e.teams || []).map((n) => logoByName(n, 20)).join('')}</div></td><td>${esc(e.years)}</td><td class="r num">${e.peak}</td><td class="r num">${e.titles}</td><td class="r num">${e.worlds}</td><td class="r num">${e.games}</td><td class="r num">${e.winrate}%</td></tr>`).join('');
    return `<div class="tbl-wrap"><table><thead><tr><th>Jugador</th><th>Años</th><th class="r">Pico</th><th class="r">Títulos</th><th class="r">Worlds</th><th class="r">Partidas</th><th class="r">% vict.</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  // ---------- Creación ----------
  function viewCreate() {
    const c = G.create;
    const champs = D.champsForRole(c.role);
    return `<div class="wrap content">
      <div class="panel" style="max-width:920px;margin:0 auto">
        <div class="panel-h"><h2>Crea tu jugador · ${c.mode === 'kid' ? 'Desde Hierro (2018)' : 'Fichaje de academia (2026)'}</h2><button class="btn sm" data-act="backMenu">Volver</button></div>
        <div class="grid g2">
          <label class="f">Nombre de invocador<input class="input" id="c-name" data-bind="name" maxlength="16" value="${esc(c.name)}" placeholder="Tu nick"></label>
          <label class="f">Nacionalidad<select class="input" id="c-nation" data-bind="nation">${C.NATIONS.map((n) => `<option value="${n.id}" ${n.id === c.nation ? 'selected' : ''}>${n.flag} ${n.name}</option>`).join('')}</select>
            <span class="small muted" style="text-transform:none;letter-spacing:0;font-weight:400">Empiezas en: ${esc(C.LEAGUES[(C.NATIONS.find((n) => n.id === c.nation) || C.NATIONS[0]).home].full)}</span></label>
        </div>
        <h3 style="margin:18px 0 8px">Rol</h3>
        <div class="opt-grid">${C.ROLES.map((r) => `<button class="opt ${r === c.role ? 'on' : ''}" data-act="cRole" data-v="${r}"><b>${C.ROLE_ES[r]}</b></button>`).join('')}</div>
        <h3 style="margin:18px 0 8px">Estilo de juego</h3>
        <div class="opt-grid">${C.STYLES.map((s) => `<button class="opt ${s.id === c.style ? 'on' : ''}" data-act="cStyle" data-v="${s.id}"><b>${s.name}</b><small>${s.desc}</small></button>`).join('')}</div>
        <h3 style="margin:18px 0 4px">Tus 3 campeones principales <span class="muted small">(${c.champs.length}/3)</span></h3>
        <p class="small muted" style="margin:0 0 10px">Podrás cambiar tu pool más adelante, cuando los parches cambien el meta.</p>
        <div class="champ-grid">${champs.map((id) => `<button class="cg ${c.champs.includes(id) ? 'on' : ''}" data-act="cChamp" data-v="${id}">${champImg(id, 48)}<span>${esc(D.champName(id))}</span></button>`).join('')}</div>
        <div class="row" style="margin-top:20px;justify-content:flex-end">
          <button class="btn primary lg" data-act="createGo" ${c.name.trim().length < 2 || c.champs.length !== 3 ? 'disabled' : ''}>Empezar carrera</button>
        </div>
      </div></div>`;
  }

  function viewStartOffers() {
    const S = G.S;
    return `<div class="wrap content"><div class="panel" style="max-width:920px;margin:0 auto">
      <h2>Ofertas de academia</h2>
      <p>Tres equipos de la ${esc(C.LEAGUES[P.nation(S).home].full)} quieren ficharte. Elige dónde empieza tu carrera.</p>
      <div class="grid g3" style="margin-top:12px">${S.startOffers.map((o, i) => {
        const t = S.world.teams[o.teamId];
        return `<div class="panel" style="background:var(--panel2)"><div class="team-cell">${teamLogo(t, 52)}<div><div class="nm">${esc(t.name)}</div><div class="small muted">${leagueName(t.league)} · media <span class="num">${W.teamAvgOvr(S, t).toFixed(0)}</span></div></div></div>
          <div class="kv" style="margin:12px 0"><div><small>Sueldo / año</small><b>${U.money(o.salary)}</b></div><div><small>Duración</small><b>${o.years} años</b></div></div>
          ${rosterMini(S, t)}
          <button class="btn primary block" style="margin-top:12px" data-act="startPick" data-i="${i}">Firmar</button></div>`;
      }).join('')}</div></div></div>`;
  }

  function rosterMini(S, t) {
    return `<table><tbody>${C.ROLES.map((r) => {
      const pid = t.roster[r];
      if (pid === 'USER') return `<tr class="me"><td class="small muted">${C.ROLE_ES[r]}</td><td><b class="gold">${esc(S.pl.name)}</b></td><td class="r num">${P.ovr(S).toFixed(0)}</td></tr>`;
      const p = S.world.players[pid];
      return `<tr ${r === S.pl.role ? 'style="opacity:.55"' : ''}><td class="small muted">${C.ROLE_ES[r]}</td><td>${p ? esc(p.name) : '—'}${r === S.pl.role ? ' <span class="small muted">(tu puesto)</span>' : ''}</td><td class="r num">${p ? W.ovr(p).toFixed(0) : ''}</td></tr>`;
    }).join('')}</tbody></table>`;
  }

  // ---------- Juego ----------
  const TABS = [
    ['inicio', 'Inicio'], ['mensajes', 'Mensajes'], ['jugador', 'Jugador'], ['campeones', 'Campeones'], ['tienda', 'Tienda'], ['staff', 'Staff'],
    ['equipo', 'Equipo'], ['competicion', 'Competición'], ['mundo', 'Mundo'], ['mercado', 'Mercado'], ['patrocinios', 'Patrocinios'], ['carrera', 'Carrera'], ['partida', 'Partida'],
  ];

  function viewGame() {
    const S = G.S;
    const pl = S.pl;
    const date = Season.turnDate(S);
    const team = P.team(S);
    const alerts = { mercado: S.offers.length > 0, patrocinios: S.sponsorOffers.length > 0, mensajes: RC.EV.unread(S) > 0 };
    let tabs = TABS;
    if (S.amateur) tabs = TABS.filter(([id]) => !['equipo', 'competicion', 'mundo'].includes(id));
    if (!tabs.some(([id]) => id === G.tab)) G.tab = 'inicio';
    const body = { inicio: tabInicio, jugador: tabJugador, campeones: tabCampeones, tienda: tabTienda, staff: tabStaff, equipo: tabEquipo, competicion: tabCompeticion, mundo: tabMundo, mensajes: tabMensajes, mercado: tabMercado, patrocinios: tabPatrocinios, carrera: tabCarrera, partida: tabPartida }[G.tab]();
    return `<header class="topbar"><div class="wrap">
      <div class="topbar-in">
        <div class="brand">RIFT <span>CAREER</span></div>
        <div class="when"><b>${esc(date.text)}</b><small>${esc(Season.turnLabel(S))}${team ? ' · ' + esc(team.short) : ''}</small></div>
        <div class="chips">
          <div class="chip" title="Media">${ICON.star}<b>${P.ovr(S).toFixed(1)}</b></div>
          <div class="chip" title="Dinero">${ICON.coin}<b>${U.money(pl.money)}</b></div>
          <div class="chip" title="Energía">${ICON.bolt}<div class="minibar"><i style="width:${pl.energy}%"></i></div><b>${Math.round(pl.energy)}</b></div>
          <div class="chip" title="Moral">${ICON.heart}<div class="minibar"><i style="width:${pl.morale}%;background:var(--loss)"></i></div><b>${Math.round(pl.morale)}</b></div>
          <div class="chip" title="Seguidores">${ICON.fans}<b>${U.num(pl.fans)}</b></div>
        </div>
      </div>
      <nav class="tabs" aria-label="Secciones">${tabs.map(([id, n]) => `<button class="tab ${G.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}">${n}${alerts[id] ? '<span class="dot"></span>' : ''}</button>`).join('')}</nav>
    </div></header>
    <main class="wrap content">${body}</main>`;
  }

  // ----- Inicio -----
  function tabInicio() {
    const S = G.S, pl = S.pl;
    const left = P.actionsLeft(S);
    const acts = P.availableActions(S);
    const fx = S.amateur ? null : Season.userFixture(S);
    let match;
    if (S.amateur) {
      const rk = P.rankInfo(pl.lp);
      match = `<div class="panel"><div class="panel-h"><h2>Etapa amateur</h2><span class="badge blue">${pl.age} años</span></div>
        <div class="kv"><div><small>Rango SoloQ</small><b>${esc(rk.name)}</b></div><div><small>LP</small><b>${rk.lp}</b></div><div><small>Media</small><b>${P.ovr(S).toFixed(1)}</b></div></div>
        <p class="small muted" style="margin:12px 0 0">${scoutHint(S)}</p></div>`;
    } else {
      match = `<div class="panel"><div class="panel-h"><h2>${fx && !fx.bye && !fx.pending ? 'Próximo partido' : 'Esta semana'}</h2><span class="badge gold">${esc(Season.turnLabel(S))}</span></div>${fixtureHtml(S, fx)}</div>`;
    }
    const offersAlert = S.offers.length ? `<div class="alert">Tienes ${S.offers.length} oferta${S.offers.length > 1 ? 's' : ''} de contrato. <button class="btn sm" data-act="tab" data-v="mercado">Ver ofertas</button></div>` : '';
    const sponsorAlert = S.sponsorOffers.length ? `<div class="alert blue">${S.sponsorOffers.length} marca${S.sponsorOffers.length > 1 ? 's quieren' : ' quiere'} patrocinarte. <button class="btn sm" data-act="tab" data-v="patrocinios">Ver</button></div>` : '';
    const promo = P.pendingPromos(S) ? `<div class="alert red">Te quedan ${P.pendingPromos(S)} acciones publicitarias este split. Si no las cumples, el patrocinador se irá.</div>` : '';
    return `${S.amateur ? '' : seasonStrip(S)}<div class="main-grid" style="margin-top:16px">
      <div class="stack">
        ${match}
        <div class="panel">
          <div class="panel-h"><h2>${S.amateur ? 'Acciones del mes' : 'Acciones de la semana'}</h2>
            <div class="row"><span class="small muted">Quedan</span><div class="pips">${Array.from({ length: P.actionsPerTurn(S) }, (_, i) => `<i class="${i < left ? 'on' : ''}"></i>`).join('')}</div></div></div>
          <div class="actions-grid">${acts.map((a) => actionCard(S, a, left)).join('')}</div>
          <div class="row" style="margin-top:16px;justify-content:space-between">
            <span class="small muted">${left > 0 ? `Te quedan ${left} acciones. Puedes avanzar igualmente.` : 'Has usado todas tus acciones.'}</span>
            <button class="btn primary lg" data-act="advance">${S.amateur ? 'Avanzar mes' : fx && !fx.bye && fx.a ? 'Jugar jornada' : 'Avanzar semana'}</button>
          </div>
        </div>
      </div>
      <div class="stack">
        ${RC.EV.pending(S).length ? `<div class="alert red">Tienes ${RC.EV.pending(S).length} decisión${RC.EV.pending(S).length > 1 ? 'es' : ''} pendiente${RC.EV.pending(S).length > 1 ? 's' : ''}. Si no respondes, se elige por ti. <button class="btn sm" data-act="tab" data-v="mensajes">Responder</button></div>` : ''}
        ${offersAlert}${sponsorAlert}${promo}
        <div class="panel"><div class="panel-h"><h2>Estado</h2></div>
          <div class="attr"><span>Energía</span>${bar(pl.energy, 100, 'blue')}<span class="v">${Math.round(pl.energy)}</span></div>
          <div class="attr"><span>Moral</span>${bar(pl.morale, 100, 'red')}<span class="v">${Math.round(pl.morale)}</span></div>
          <div class="attr"><span>Rango</span><span class="small">${esc(P.rankInfo(pl.lp).name)}</span><span class="v small">${P.rankInfo(pl.lp).lp} LP</span></div>
          <div class="attr"><span>Fama</span><span class="small">${esc(P.fame(S).name)}</span><span class="v small">${U.num(pl.fans)}</span></div>
        </div>
        ${budgetPanel(S)}
        <div class="panel"><div class="panel-h"><h2>Noticias</h2></div>
          <div class="feed">${S.news.slice(0, 14).map((n) => `<div class="${n.kind}"><small>${esc(n.when)}</small>${esc(n.text)}</div>`).join('') || '<div class="muted">Sin noticias todavía.</div>'}</div></div>
      </div>
    </div>`;
  }

  function seasonStrip(S) {
    if (S.amateur) {
      return `<div class="panel"><h2 style="margin-bottom:10px">${S.year} · ${S.pl.age} años</h2><div class="strip">${C.MONTHS.map((m, i) => `<div class="st ${i < S.turn ? 'past' : i === S.turn ? 'now' : ''}" style="flex:1"><span>${m.slice(0, 3)}</span></div>`).join('')}</div></div>`;
    }
    const parts = [['pre', 'Pre'], ['winter', 'Winter'], ['spring', 'Spring'], ['msi', 'MSI'], ['summer', 'Summer'], ['worlds', 'Worlds'], ['off', 'Mercado']];
    const t = S.cal[S.turn];
    return `<div class="strip">${parts.map(([ph, n]) => {
      const idx = S.cal.map((x, i) => (x.phase === ph ? i : -1)).filter((i) => i >= 0);
      const days = U.sum(idx.map((i) => S.cal[i].days));
      const now = t.phase === ph, past = S.turn > idx[idx.length - 1];
      const pct = now ? ((S.turn - idx[0]) / idx.length) * 100 : past ? 100 : 0;
      return `<div class="st ${now ? 'now' : past ? 'past' : ''} ${ph}" style="flex:${days}"><i style="width:${pct}%"></i><span>${n}</span></div>`;
    }).join('')}</div>`;
  }

  function budgetPanel(S) {
    const b = P.budget(S);
    const row = (i) => `<div class="row between small" style="padding:4px 0;border-bottom:1px solid var(--line2)"><span>${esc(i.label)}</span><span class="num ${i.amount >= 0 ? 'good' : 'bad'}">${i.amount >= 0 ? '+' : '−'}${U.money(Math.abs(i.amount))}</span></div>`;
    return `<div class="panel"><div class="panel-h"><h2>Economía</h2><span class="small muted">por ${b.unit}</span></div>
      ${b.items.length ? b.items.map(row).join('') : '<p class="small muted">Sin ingresos ni gastos fijos.</p>'}
      <div class="row between" style="padding-top:8px"><b style="color:var(--bright)">Balance</b><b class="num ${b.net >= 0 ? 'good' : 'bad'}">${b.net >= 0 ? '+' : '−'}${U.money(Math.abs(b.net))}</b></div>
      ${b.net < 0 ? `<p class="small bad" style="margin:6px 0 0">Pierdes dinero cada ${b.unit}. Con tu saldo actual aguantas ${Math.max(0, Math.floor(S.pl.money / -b.net))} ${b.unit === 'mes' ? 'meses' : 'semanas'}.</p>` : ''}</div>`;
  }

  function scoutHint(S) {
    const a = S.pl.age;
    if (a < 14) return 'Los ojeadores de academias empiezan a fijarse en jugadores de 14 años. Sube tu media y tu rango de SoloQ.';
    const T = { 14: 64, 15: 61, 16: 58, 17: 54 }[a];
    const R = { 14: 'Diamante IV', 15: 'Esmeralda II', 16: 'Esmeralda IV', 17: 'Platino IV' }[a];
    if (!T) return 'Con 18 años, algún equipo te dará una oportunidad.';
    return `Para que te ojeen con ${a} años necesitas media ${T}+ y rango ${R} o superior.`;
  }

  function fixtureHtml(S, fx) {
    if (!S.pl.teamId) return `<p>No tienes equipo. Busca ofertas en el <button class="btn sm" data-act="tab" data-v="mercado">Mercado</button> o sigue entrenando.</p>`;
    if (!fx) {
      const t = S.cal[S.turn];
      const msg = t.phase === 'pre' ? 'Pretemporada: no hay partidos. Aprovecha para entrenar.' : t.phase === 'off' ? 'Temporada terminada. Es momento de fichajes y descanso.' : 'Tu equipo no juega esta semana.';
      return `<p>${msg}</p>`;
    }
    if (fx.bye) return '<p>Tu equipo está clasificado directamente para las semifinales. Esta semana descansáis.</p>';
    if (fx.pending) return `<p>${esc(fx.label)}: el rival se decide esta semana.</p>`;
    const A = S.world.teams[fx.a], B = S.world.teams[fx.b];
    return `<div class="match">
      <div class="side">${teamLogo(A, 64)}<span class="nm">${esc(A.name)}</span><span class="num small">${W.teamAvgOvr(S, A).toFixed(1)}</span></div>
      <div class="side"><span class="vs">VS</span><span class="badge">Bo${fx.bo}</span></div>
      <div class="side">${teamLogo(B, 64)}<span class="nm">${esc(B.name)}</span><span class="num small">${W.teamAvgOvr(S, B).toFixed(1)}</span></div>
    </div><p class="small muted" style="margin:10px 0 0">${esc(fx.label)} · ${leagueName(A.league) === leagueName(B.league) ? leagueName(A.league) : 'Internacional'}</p>`;
  }

  function actionCard(S, a, left) {
    const cost = P.energyCost(S, a);
    const dis = left <= 0 || (cost > 0 && S.pl.energy < cost);
    let tag = a.stat ? `<span class="badge gold">+${C.ATTR_NAME[a.stat]}</span>` : '';
    if (a.id === 'champ') tag = '<span class="badge gold">+Maestría</span>';
    if (a.id === 'soloq') tag = '<span class="badge gold">+LP</span>';
    if (a.id === 'stream') tag = '<span class="badge gold">+Dinero · +Fans</span>';
    if (a.id === 'rest') tag = '<span class="badge win">+35 energía</span>';
    if (a.id === 'promo') tag = `<span class="badge blue">${P.pendingPromos(S)} pendiente(s)</span>`;
    return `<button class="card-btn" data-act="${a.id === 'champ' ? 'champPick' : 'do'}" data-v="${a.id}" ${dis ? 'disabled' : ''}>
      <span class="t">${a.name}</span><span class="d">${a.desc}</span>
      <span class="m">${tag}${cost > 0 ? `<span class="badge">${cost} energía</span>` : ''}</span></button>`;
  }

  // ----- Jugador -----
  function playerCard(S) {
    const pl = S.pl, team = P.team(S);
    const ab = { mecanicas: 'MEC', farmeo: 'FAR', macro: 'MAC', vision: 'VIS', mentalidad: 'MEN', comunicacion: 'COM' };
    return `<div class="pcard"><div class="pc-top"><div class="pc-ovr"><b>${P.ovr(S).toFixed(0)}</b><span>${C.ROLE_ES[pl.role]}</span><span class="pc-flag">${flag(pl.nation)}</span>${team ? teamLogo(team, 34) : ''}</div>
      <div class="pc-champ">${pl.pool[0] ? champImg(pl.pool[0], 96) : ''}</div></div>
      <div class="pc-name">${esc(pl.name)}</div>
      <div class="pc-attrs">${C.ATTRS.map((a) => `<span><b>${Math.floor(pl.attrs[a.id])}</b>${ab[a.id]}</span>`).join('')}</div></div>`;
  }

  function tabJugador() {
    const S = G.S, pl = S.pl;
    const sub = P.sub(S);
    const team = P.team(S);
    const rk = P.rankInfo(pl.lp);
    const style = C.STYLES.find((s) => s.id === pl.style);
    const yr = Object.entries(pl.stats.seasons).filter(([k]) => k.startsWith(S.year + ' ')).map(([, v]) => v);
    const ys = { g: U.sum(yr.map((x) => x.g)), w: U.sum(yr.map((x) => x.w)), k: U.sum(yr.map((x) => x.k)), d: U.sum(yr.map((x) => x.d)), a: U.sum(yr.map((x) => x.a)), r: U.sum(yr.map((x) => x.r)), mvp: U.sum(yr.map((x) => x.mvp)) };
    const rec = pl.recent || [];
    return `<div class="player-top">${playerCard(S)}<div class="stack" style="flex:1;min-width:0">${seasonStrip(S)}
      <div class="panel"><div class="panel-h"><h2>Temporada ${S.year}</h2>${team ? `<span class="row small">${teamLogo(team, 22)} ${esc(team.name)}</span>` : ''}</div>
        <div class="kv"><div><small>Partidas</small><b>${ys.g}</b></div><div><small>% victorias</small><b>${ys.g ? Math.round((ys.w / ys.g) * 100) : 0}%</b></div><div><small>KDA</small><b>${ys.d ? ((ys.k + ys.a) / ys.d).toFixed(2) : '—'}</b></div><div><small>Nota media</small><b>${ys.g ? (ys.r / ys.g).toFixed(2) : '—'}</b></div><div><small>MVP</small><b>${ys.mvp}</b></div></div>
        <h3 style="margin:14px 0 8px">Forma reciente</h3>
        ${rec.length ? `<div class="form">${rec.map((x) => `<div class="fb ${x.w ? 'w' : 'l'}" title="${esc(D.champName(x.c))} · ${x.r.toFixed(1)}"><i style="height:${Math.max(8, (x.r / 10) * 100)}%"></i><span>${x.r.toFixed(1)}</span></div>`).join('')}</div>` : '<p class="small muted">Aún no has jugado partidos oficiales.</p>'}
      </div></div></div><div class="grid g2" style="margin-top:16px">
      <div class="panel">
        <div class="panel-h"><h2>Perfil</h2></div>
        <div class="row" style="gap:16px;align-items:flex-start">
          <div style="min-width:0">
            <div class="row small">${flag(pl.nation)} ${esc(P.nation(S).name)} · ${C.ROLE_ES[pl.role]} · ${pl.age} años · ${style ? style.name : ''}</div>
            <div class="row small muted" style="margin-top:4px">${team ? teamLogo(team, 22) + ' ' + esc(team.name) + ' · ' + leagueName(team.league) : S.amateur ? 'Jugador amateur' : 'Agente libre'}</div>
          </div>
        </div>
        <div class="kv" style="margin-top:16px">
          <div><small>Mecánica</small><b>${sub.mech.toFixed(1)}</b></div>
          <div><small>Macro</small><b>${sub.macro.toFixed(1)}</b></div>
          <div><small>Mental</small><b>${sub.ment.toFixed(1)}</b></div>
          <div><small>Suerte</small><b>${P.luck(S)}</b></div>
        </div>
        <p class="small muted" style="margin:12px 0 0">La media pesa un 40 % la mecánica, un 35 % la macro y un 25 % la mentalidad. Es la misma escala que usan los jugadores profesionales del juego.</p>
      </div>
      <div class="panel"><div class="panel-h"><h2>Atributos</h2><span class="small muted">Edad: entrenas al ${Math.round(P.ageMult(pl.age) * 100)} %</span></div>
        ${C.ATTRS.map((a) => `<div class="attr" title="${esc(a.desc)}"><span>${a.name}</span>${bar(pl.attrs[a.id])}<span class="v">${pl.attrs[a.id].toFixed(1)}</span></div>`).join('')}
      </div>
      <div class="panel"><div class="panel-h"><h2>SoloQ</h2><span class="badge blue">${esc(rk.name)}</span></div>
        <div class="kv"><div><small>Rango</small><b>${esc(rk.name)}</b></div><div><small>LP</small><b>${rk.lp}</b></div><div><small>Nivel esperado</small><b>${rk.exp.toFixed(0)}</b></div></div>
        <p class="small muted" style="margin:12px 0 0">Si tu media supera el nivel esperado de tu rango, ganarás más de lo que pierdes.</p>
      </div>
      <div class="panel"><div class="panel-h"><h2>Equipamiento y staff</h2></div>
        ${C.GEAR.map((g) => `<div class="attr"><span>${g.name}</span><span class="small">${P.gearLevel(S, g.id) ? esc(g.levels[P.gearLevel(S, g.id) - 1]) : '<span class="muted">Sin mejorar</span>'}</span><span class="v small">${P.gearLevel(S, g.id)}/5</span></div>`).join('')}
        <p class="small" style="margin:10px 0 0">Staff: ${Object.keys(pl.staff).map((id) => C.STAFF.find((s) => s.id === id).name).join(', ') || '<span class="muted">ninguno</span>'}</p>
      </div>
    </div>`;
  }

  // ----- Campeones -----
  function tabCampeones() {
    const S = G.S, pl = S.pl;
    const role = G.champRole || pl.role;
    const q = G.champQuery.toLowerCase();
    const list = (q ? Object.keys(D.champions) : D.champsForRole(role)).filter((c) => !q || D.champName(c).toLowerCase().includes(q));
    const pool = pl.pool.map((c) => `<div class="panel" style="background:var(--panel2);padding:12px">
        <div class="row">${champImg(c, 48)}<div style="flex:1;min-width:0"><div class="row between"><b style="color:var(--bright)">${esc(D.champName(c))}</b>${tierBadge(c)}</div>
        <div class="small muted">Maestría ${P.mastery(S, c).toFixed(0)} · ${pl.stats.champs[c] || 0} partidas pro</div>${bar(P.mastery(S, c))}</div></div>
        <div class="row" style="margin-top:10px"><button class="btn sm" data-act="champTrain" data-v="${c}" ${P.actionsLeft(S) <= 0 ? 'disabled' : ''}>Practicar (1 acción)</button><button class="btn sm danger" data-act="champRemove" data-v="${c}">Quitar</button></div></div>`).join('');
    const pt = S.patch;
    return `<div class="stack">
      <div class="panel"><div class="panel-h"><h2>Tu pool · ${pl.pool.length}/${P.maxPool}</h2><span class="small muted">El draft es automático: se elige tu mejor opción según maestría y meta.</span></div>
        <div class="grid g3">${pool || '<p class="muted">Tu pool está vacío. Añade campeones abajo.</p>'}</div></div>
      <div class="grid g2">
        <div class="panel"><div class="panel-h"><h2>Parche ${esc(pt.ver)}</h2><span class="small muted">Cambia al inicio de cada split</span></div>
          <h3 class="good" style="margin-bottom:8px">Más fuertes</h3><div class="row">${pt.buffs.map((c) => `<span title="${esc(D.champName(c))}">${champImg(c, 36)}</span>`).join('') || '<span class="muted">—</span>'}</div>
          <h3 class="bad" style="margin:14px 0 8px">Más débiles</h3><div class="row">${pt.nerfs.map((c) => `<span title="${esc(D.champName(c))}">${champImg(c, 36)}</span>`).join('') || '<span class="muted">—</span>'}</div>
        </div>
        <div class="panel"><div class="panel-h"><h2>Cómo influye</h2></div>
          <p class="small">En cada partida el campeón suma o resta a tu nivel. La maestría aporta hasta ±3,3 puntos (50 es neutro) y el tier del parche, de −1,6 (D) a +1,6 (S). Un campeón nuevo empieza con maestría 10, así que cambiar tu pool a mitad de split cuesta acciones de práctica.</p>
          <div class="row small"><span class="tier tier-S">S</span><span class="tier tier-A">A</span><span class="tier tier-B">B</span><span class="tier tier-C">C</span><span class="tier tier-D">D</span><span class="muted">de mejor a peor</span></div>
        </div>
      </div>
      <div class="panel"><div class="panel-h"><h2>Añadir campeones</h2>
        <div class="row"><select class="input" id="ch-role" data-bind="champRole">${C.ROLES.map((r) => `<option value="${r}" ${r === role ? 'selected' : ''}>${C.ROLE_ES[r]}</option>`).join('')}</select>
        <input class="input" id="ch-q" data-bind="champQuery" placeholder="Buscar campeón" value="${esc(G.champQuery)}"></div></div>
        <div class="champ-grid">${list.map((c) => `<button class="cg ${pl.pool.includes(c) ? 'on' : ''}" data-act="champAdd" data-v="${c}" title="${pl.pool.includes(c) ? 'Ya está en tu pool' : 'Añadir al pool'}">${champImg(c, 48)}${tierBadge(c)}<span>${esc(D.champName(c))}</span><span class="muted">${P.mastery(S, c) ? 'M ' + P.mastery(S, c).toFixed(0) : ''}</span></button>`).join('')}</div>
      </div>
    </div>`;
  }

  // ----- Tienda -----
  function tabTienda() {
    const S = G.S;
    return `<div class="stack"><div class="panel"><div class="panel-h"><h2>Tienda de equipamiento</h2><span class="chip">${ICON.coin}<b>${U.money(S.pl.money)}</b></span></div>
      <p class="small muted" style="margin:0">Cada mejora acelera el entrenamiento de un atributo y da un pequeño extra en las partidas. Las compras son permanentes.</p></div>
      <div class="grid g3">${C.GEAR.map((g) => {
        const l = P.gearLevel(S, g.id);
        const next = l < 5 ? g.prices[l] : null;
        const eff = [];
        for (const [k, v] of Object.entries(g.boost)) eff.push(k === 'all' ? `+${Math.round(v * 100)} % a todo el entrenamiento` : `+${Math.round(v * 100)} % a ${C.ATTR_NAME[k]}`);
        if (g.energySave) eff.push(`−${Math.round(g.energySave * 100)} % de energía al entrenar`);
        if (g.luck) eff.push(`+${g.luck} de suerte`);
        if (g.match) eff.push('Pequeño extra en partida');
        return `<div class="panel">
          <div class="panel-h"><h3>${g.name}</h3><div class="pips">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div></div>
          <div class="small">Actual: <b class="gold">${l ? esc(g.levels[l - 1]) : 'Ninguno'}</b></div>
          <div class="small muted" style="margin:6px 0 10px">Por nivel: ${eff.join(' · ')}</div>
          ${next != null ? `<button class="btn ${S.pl.money >= next ? 'primary' : ''} block" data-act="buy" data-v="${g.id}" ${S.pl.money < next ? 'disabled' : ''}>${esc(g.levels[l])} · ${U.money(next)}</button>` : '<span class="badge gold">Nivel máximo</span>'}
        </div>`;
      }).join('')}</div>
      <div class="panel"><div class="panel-h"><h2>Experiencias</h2><span class="small muted">Cada una se puede hacer una vez por split</span></div>
        <div class="grid g3">${C.EXPERIENCES.map((e) => {
          const av = P.expAvailable(S, e.id);
          const gains = Object.entries(e.gains || {}).map(([k, v]) => `${k === 'all' ? 'Todo' : C.ATTR_NAME[k]} +${v}`).concat(e.mastery ? [`Maestría del pool +${e.mastery}`] : [], e.morale ? [`Moral +${e.morale}`] : []);
          return `<div class="panel" style="background:var(--panel2)"><h3>${e.name}</h3><p class="small muted" style="margin:6px 0">${e.desc}</p>
            ${gains.length ? `<div class="row" style="margin-bottom:10px">${gains.map((g) => `<span class="badge gold">${g}</span>`).join('')}</div>` : ''}
            <button class="btn block ${av && S.pl.money >= e.price ? 'primary' : ''}" data-act="exp" data-v="${e.id}" ${!av || S.pl.money < e.price ? 'disabled' : ''}>${!av ? (e.once ? 'Ya la tienes' : 'Hecha este split') : U.money(e.price)}</button></div>`;
        }).join('')}</div>
        <p class="small muted" style="margin:10px 0 0">Las mejoras rinden menos cuanto más alto tienes el atributo.</p></div></div>`;
  }

  // ----- Staff -----
  function tabStaff() {
    const S = G.S;
    const unit = S.amateur ? 'mes' : 'semana';
    const total = U.sum(Object.keys(S.pl.staff).map((id) => P.staffCost(S, id)));
    return `<div class="stack"><div class="panel"><div class="panel-h"><h2>Staff personal</h2><span class="small">Gasto: <b class="num gold">${U.money(total)}</b> / ${unit}</span></div>
      <p class="small muted" style="margin:0">Cada miembro tiene tres niveles: Básico, Profesional y Élite. Se paga cada ${unit}. Si te quedas sin dinero, el staff se marcha.${S.pl.contract ? ` Tus ingresos: ${U.money(P.budget(S).income)} / semana (sueldo y patrocinios).` : ''}</p></div>
      <div class="grid g3">${C.STAFF.map((s) => {
        const tier = P.staffTier(S, s.id);
        const shown = tier || 1;
        return `<div class="panel" ${tier ? 'style="border-color:var(--gold-d)"' : ''}><div class="panel-h"><h3>${s.name}</h3>${tier ? `<span class="badge win">${C.STAFF_TIERS[tier - 1]}</span>` : ''}</div>
          <p class="small" style="margin:0 0 10px">${s.desc(s.eff[shown - 1], shown - 1)}</p>
          <div class="stack" style="gap:6px">${[1, 2, 3].map((t) => `<button class="btn sm ${tier === t ? 'primary' : ''}" data-act="staffSet" data-v="${s.id}" data-t="${t}" ${tier === t ? 'disabled' : ''} style="justify-content:space-between"><span>${C.STAFF_TIERS[t - 1]}</span><span class="num">${s.pct ? Math.round(s.pct[t - 1] * 100) + ' % · ' : ''}${U.money(P.staffCost(S, s.id, t))} / ${unit}</span></button>`).join('')}
          ${tier ? `<button class="btn sm danger" data-act="staffSet" data-v="${s.id}" data-t="0">Despedir</button>` : ''}</div></div>`;
      }).join('')}</div></div>`;
  }

  // ----- Equipo -----
  function tabEquipo() {
    const S = G.S;
    const team = P.team(S);
    if (!team) return `<div class="panel"><h2>Sin equipo</h2><p>Eres agente libre desde hace ${S.pl.freeTurns} semanas. Si pasas un año entero sin equipo, tu carrera termina.</p><button class="btn primary" data-act="tab" data-v="mercado">Ir al mercado</button></div>`;
    const c = S.pl.contract;
    const left = c.endYear - S.year + 1;
    const st = RC.EV.status(S);
    const relV = S.pl.clubRel == null ? 55 : S.pl.clubRel;
    const req = RC.EV.canRequest(S);
    const inter = (S.pl.interested || []).map((x) => S.world.players[x.pid]).filter(Boolean);
    const b = P.budget(S);
    return `<div class="grid g2">
      <div class="panel"><div class="row" style="gap:16px">${teamLogo(team, 80)}<div><h1 style="font-size:24px">${esc(team.name)}</h1><div class="small muted">${esc(C.LEAGUES[team.league].full)} · media <span class="num">${W.teamAvgOvr(S, team).toFixed(1)}</span></div></div></div>
        <div class="contract"><div class="ct-big"><b class="num">${left}</b><span>${left === 1 ? 'temporada<br>de contrato' : 'temporadas<br>de contrato'}</span></div>
          <div class="kv" style="flex:1"><div><small>Termina</small><b>Fin de ${c.endYear}</b></div><div><small>Sueldo / año</small><b>${U.money(c.salary)}</b></div><div><small>Cláusula</small><b>${U.money(c.buyout || c.salary * 2)}</b></div></div></div>
        <div class="kv" style="margin-top:10px"><div><small>Sueldo / semana</small><b>${U.money(c.salary / 52)}</b></div><div><small>Patrocinios / semana</small><b>${U.money(U.sum(S.pl.sponsors.map((x) => x.pay)))}</b></div><div><small>Ingresos totales</small><b class="good">${U.money(b.income)}</b></div></div>
        ${left <= 1 ? '<p class="small gold" style="margin:10px 0 0">Último año de contrato: tras los Worlds el club decidirá si te renueva.</p>' : ''}</div>
      <div class="panel"><div class="panel-h"><h2>Tu papel</h2>${st ? `<span class="badge gold">${st.name}</span>` : ''}</div>
        <div class="status-steps">${['promesa', 'titular', 'estrella', 'capitan', 'franquicia'].map((id) => `<span class="${st && st.id === id ? 'on' : ''}">${RC.EV.STATUS[id].name}</span>`).join('')}</div>
        <p class="small" style="margin:10px 0">${st ? esc(st.desc) : ''}</p>
        <div class="attr"><span>Relación con el club</span>${bar(relV, 100, relV < 30 ? 'red' : 'green')}<span class="v">${Math.round(relV)}</span></div>
        <div class="attr"><span>Diferencia con el equipo</span><span class="small">Tu media frente a la de tus compañeros</span><span class="v ${st && st.diff >= 0 ? 'good' : 'bad'}">${st ? (st.diff >= 0 ? '+' : '') + st.diff.toFixed(1) : ''}</span></div>
        <div class="row between" style="margin-top:12px"><span class="small muted">${req.ok ? `Te queda 1 petición de fichaje en ${S.year}.` : esc(req.why)}</span><button class="btn ${req.ok ? 'primary' : ''} sm" data-act="reqOpen" ${req.ok ? '' : 'disabled'}>Pedir un fichaje</button></div></div>
      <div class="panel"><div class="panel-h"><h2>Plantilla</h2></div>${rosterMini(S, team)}</div>
      <div class="panel"><div class="panel-h"><h2>Interesados en venir</h2><span class="small muted">Jugadores que aceptaron tu propuesta</span></div>
        ${inter.length ? inter.map((p) => `<div class="attr" style="grid-template-columns:1fr auto auto"><span><b style="color:var(--bright)">${esc(p.name)}</b> <span class="small muted">${C.ROLE_ES[p.role]}${p.team ? ' · ' + esc(S.world.teams[p.team].short) : ''}</span></span><span class="ovr sm">${W.ovr(p).toFixed(0)}</span><span class="badge win">Ya dijo que sí</span></div>`).join('') : '<p class="small muted">Habla con jugadores desde la pestaña Mundo. Si aceptan, saldrán como opción cuando pidas un fichaje o el club te consulte.</p>'}</div>
    </div>`;
  }

  // ----- Competición -----
  function tabCompeticion() {
    const S = G.S;
    const views = [['liga', 'Ligas'], ['msi', 'MSI'], ['emea', 'EMEA Masters'], ['worlds', 'Worlds'], ['calendario', 'Calendario']];
    const v = G.compView || 'liga';
    let html = `<div class="seg" role="tablist">${views.map(([id, n]) => `<button class="seg-b ${v === id ? 'on' : ''}" data-act="compView" data-v="${id}">${n}</button>`).join('')}</div>`;
    if (v === 'liga') html += viewLiga(S);
    else if (v === 'msi') html += viewMSI(S);
    else if (v === 'emea') html += viewEMEA(S);
    else if (v === 'worlds') html += viewWorlds(S);
    else html += viewCalendar(S);
    return html;
  }

  function viewLiga(S) {
    const myLg = P.team(S) ? P.team(S).league : 'LEC';
    const lg = G.compLeague || myLg;
    const sp = S.comp && S.comp.split;
    const L = sp ? sp.leagues[lg] : null;
    let html = `<div class="panel"><div class="panel-h"><h2>${sp ? Season.SPLIT_NAME[sp.id] + ' ' + S.year : 'Temporada ' + S.year}</h2>
      <select class="input" id="comp-lg" data-bind="compLeague">${C.LEAGUE_ORDER.map((x) => `<option value="${x}" ${x === lg ? 'selected' : ''}>${esc(C.LEAGUES[x].full)}</option>`).join('')}</select></div>`;
    if (!L) {
      html += '<p class="muted">El split todavía no ha empezado. Aquí verás la clasificación y los resultados.</p>';
      html += `<h3 style="margin:12px 0 8px">Equipos</h3><div class="grid g3">${W.leagueTeams(S, lg).sort((a, b) => W.teamAvgOvr(S, b) - W.teamAvgOvr(S, a)).map((t) => `<div class="team-cell">${teamLogo(t, 30)}<span class="nm">${esc(t.name)}</span><span class="num small muted">${W.teamAvgOvr(S, t).toFixed(1)}</span></div>`).join('')}</div></div>`;
      return html;
    }
    const rows = Season.sortedTable(L).map((r, i) => {
      const t = S.world.teams[r.tid];
      return `<tr class="${r.tid === S.pl.teamId ? 'me' : ''}"><td class="num"><span class="pos ${i < 6 ? 'po' : ''}">${i + 1}</span></td><td><div class="team-cell">${teamLogo(t, 24)}<span class="nm">${esc(t.name)}</span></div></td><td class="c num">${r.w}</td><td class="c num">${r.l}</td><td class="c num muted">${r.gw - r.gl > 0 ? '+' : ''}${r.gw - r.gl}</td><td class="r num muted">${W.teamAvgOvr(S, t).toFixed(1)}</td></tr>`;
    }).join('');
    const firstOpen = L.sched.findIndex((r) => !r[0].res);
    const showRound = G.ligaRound != null ? G.ligaRound : Math.max(0, Math.min(8, (firstOpen === -1 ? 9 : firstOpen) - 1));
    html += `<div class="grid g2"><div class="tbl-wrap"><table><thead><tr><th>#</th><th>Equipo</th><th class="c">V</th><th class="c">D</th><th class="c">Dif.</th><th class="r">Media</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="small muted">Los 6 primeros juegan los playoffs. Los dos primeros empiezan en semifinales.</p></div>
      <div><div class="row between" style="margin-bottom:8px"><h3>Jornada ${showRound + 1}</h3><div class="row">${L.sched.map((_, i) => `<button class="rd ${i === showRound ? 'on' : ''}" data-act="ligaRound" data-v="${i}">${i + 1}</button>`).join('')}</div></div>
      ${L.sched[showRound].map((m) => resultLine(S, m)).join('')}</div></div>`;
    if (L.po) html += `<h3 style="margin:18px 0 10px">Playoffs</h3>${bracketHtml(S, L.po.rounds, [2, 2, 1])}`;
    return html + '</div>';
  }

  // Tarjeta de partido para cuadros
  function mcard(S, m, label) {
    if (!m || !m.a) return `<div class="mc empty">${label ? `<span class="mc-l">${esc(label)}</span>` : ''}<div class="ln muted">Por decidir</div><div class="ln muted">Por decidir</div></div>`;
    const uid = S.pl.teamId;
    const line = (tid, sc) => `<div class="ln ${m.res && m.res.winner === tid ? 'w' : m.res ? 'l' : ''}">${teamLogo(S.world.teams[tid], 22)}<span class="nm">${esc(S.world.teams[tid].short)}</span><span class="num sc">${m.res ? sc : ''}</span></div>`;
    return `<div class="mc ${m.a === uid || m.b === uid ? 'me' : ''}">${label !== false ? `<span class="mc-l">${esc(label || m.lbl || '')}<span>Bo${m.bo}</span></span>` : ''}${line(m.a, m.res && m.res.sa)}${line(m.b, m.res && m.res.sb)}</div>`;
  }

  function teamChips(S, ids, note) {
    return `<div class="chips-grid">${ids.filter(Boolean).map((t) => `<div class="tchip ${t === S.pl.teamId ? 'me' : ''}">${teamLogo(S.world.teams[t], 26)}<span><b>${esc(S.world.teams[t].short)}</b><small>${esc(C.LEAGUES[S.world.teams[t].league].name)}</small></span></div>`).join('')}</div>${note ? `<p class="small muted" style="margin:8px 0 0">${note}</p>` : ''}`;
  }

  function intlHeader(name, ev, S, sub) {
    return `<div class="intl-hero ${ev && ev.id}"><div><span class="badge gold">${S.year}</span><h1>${name}</h1><p>${sub}</p></div>
      ${ev && ev.champion ? `<div class="champ-box">${teamLogo(S.world.teams[ev.champion], 64)}<span><small>Campeón</small><b>${esc(S.world.teams[ev.champion].name)}</b></span></div>` : ''}</div>`;
  }

  function viewMSI(S) {
    const e = S.comp && S.comp.msi;
    let html = intlHeader('Mid-Season Invitational', e, S, 'Play-In con dos grupos de doble eliminación (Bo3) y Bracket Stage de 8 equipos a doble eliminación (Bo5).');
    if (!e || !e.groups) {
      if (e && e.legacy) return html + `<div class="panel">${bracketHtml(S, e.rounds)}</div>`;
      const f = S.comp ? Season.msiField(S) : null;
      const done = S.comp && S.comp.done.spring;
      html += `<div class="grid g2"><div class="panel"><h2>Directos al Bracket Stage</h2>${f ? teamChips(S, f.direct) : ''}</div>
        <div class="panel"><h2>Play-In</h2>${f ? teamChips(S, f.playin) : ''}</div></div>
        <p class="small muted">${done ? 'Clasificados según el Spring Split.' : 'Previsión: los clasificados se deciden en los playoffs del Spring Split (campeón y subcampeón de LCK, LPL, LEC y LCS; dos plazas para LCP y CBLOL).'}</p>`;
      return html;
    }
    html += `<h2 class="sec">Play-In</h2><div class="grid g2">${e.groups.map((g) => `<div class="panel"><div class="panel-h"><h3>${g.name}</h3>${g.first ? `<span class="small">Pasan: <b class="gold">${esc(teamName(g.first))}</b> y <b class="gold">${esc(teamName(g.second))}</b></span>` : ''}</div>
      <div class="bk bk3"><div class="bk-col">${mcard(S, g.m.oa)}${mcard(S, g.m.ob)}</div><div class="bk-col">${mcard(S, g.m.win, 'Ganadores')}${mcard(S, g.m.elim, 'Eliminación')}</div><div class="bk-col">${mcard(S, g.m.dec, 'Decisivo')}</div></div></div>`).join('')}</div>`;
    const d = e.de;
    const pad = (arr, n, lbl) => Array.from({ length: n }, (_, i) => mcard(S, arr && arr[i], lbl)).join('');
    html += `<h2 class="sec">Bracket Stage</h2><div class="panel">${!d ? teamChips(S, e.direct, 'Estos cuatro equipos esperan a los clasificados del Play-In.') : `
      <h3 class="bk-t">Cuadro superior</h3>
      <div class="bk bk4"><div class="bk-col">${pad(d.ub[0], 4, 'Cuartos superior')}</div><div class="bk-col">${pad(d.ub[1], 2, 'Semis superior')}</div><div class="bk-col">${pad(d.ub[2], 1, 'Final superior')}</div><div class="bk-col gf">${mcard(S, d.gf, 'Gran Final')}</div></div>
      <h3 class="bk-t">Cuadro inferior</h3>
      <div class="bk bk4"><div class="bk-col">${pad(d.lb[0], 2, 'Inferior · R1')}</div><div class="bk-col">${pad(d.lb[1], 2, 'Inferior · R2')}</div><div class="bk-col">${pad(d.lb[2], 1, 'Inferior · R3')}</div><div class="bk-col">${pad(d.lb[3], 1, 'Final inferior')}</div></div>`}</div>`;
    return html;
  }

  function viewEMEA(S) {
    const e = S.comp && S.comp.emea;
    let html = intlHeader('EMEA Masters', e, S, 'El torneo de las ligas regionales europeas: campeones de LES, LFL, Prime League, NLC y TCL, y subcampeones de LES, LFL y Prime League. Eliminatorias a Bo5.');
    if (!e) return html + '<div class="panel"><p class="muted">Se juega durante el MSI con los mejores equipos del Spring Split de las ligas regionales.</p></div>';
    return html + `<div class="panel">${bracketHtml(S, e.rounds)}</div>`;
  }

  function viewWorlds(S) {
    const e = S.comp && S.comp.worlds;
    let html = intlHeader('World Championship', e, S, 'Play-In (4º de LCK contra 4º de LPL), fase suiza de 16 equipos (Bo1; Bo3 cuando hay clasificación o eliminación en juego) y eliminatorias a Bo5.');
    if (!e || !e.playin) {
      if (e && e.legacy) return html;
      const f = S.comp ? Season.worldsField(S) : null;
      html += `<div class="grid g2"><div class="panel"><h2>Fase suiza</h2>${f ? teamChips(S, f.direct) : ''}</div><div class="panel"><h2>Play-In</h2>${f ? teamChips(S, f.playin) : ''}</div></div>
        <p class="small muted">Previsión según los puntos de la temporada: Winter cuenta ×0,6, Spring ×1 y Summer ×1,4. LCK y LPL tienen 4 plazas, LEC y LCS 3, LCP 2 y CBLOL 1.</p>`;
      return html;
    }
    html += `<h2 class="sec">Play-In</h2><div class="panel" style="max-width:340px">${mcard(S, e.playin, 'Play-In · Bo5')}</div>`;
    const sw = e.swiss;
    if (sw) {
      const cols = sw.rounds.map((rd, i) => {
        const groups = {};
        rd.forEach((m) => (groups[m.lbl] = groups[m.lbl] || []).push(m));
        return `<div class="sw-col"><span class="sw-h">Ronda ${i + 1}</span>${Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([rec, ms]) => `<div class="sw-g"><span class="sw-rec">${rec}</span>${ms.map((m) => mcard(S, m, false)).join('')}</div>`).join('')}</div>`;
      }).join('');
      const byRec = (list) => list.map((t) => `<div class="tchip ${t === S.pl.teamId ? 'me' : ''}">${teamLogo(S.world.teams[t], 22)}<span><b>${esc(S.world.teams[t].short)}</b><small>${sw.rec[t].w}-${sw.rec[t].l}</small></span></div>`).join('');
      html += `<h2 class="sec">Fase suiza</h2><div class="panel"><div class="sw">${cols}</div>
        <div class="grid g2" style="margin-top:14px"><div><h3 class="good" style="margin-bottom:8px">Clasificados (3 victorias)</h3><div class="chips-grid">${byRec(sw.qualified) || '<span class="muted small">Todavía ninguno</span>'}</div></div>
        <div><h3 class="bad" style="margin-bottom:8px">Eliminados (3 derrotas)</h3><div class="chips-grid">${byRec(sw.out) || '<span class="muted small">Todavía ninguno</span>'}</div></div></div></div>`;
    }
    if (e.ko) html += `<h2 class="sec">Eliminatorias</h2><div class="panel">${bracketHtml(S, e.ko.rounds)}</div>`;
    return html;
  }

  function viewCalendar(S) {
    const groups = [];
    S.cal.forEach((t, i) => {
      const key = t.phase + (t.kind || '');
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.end = i; else groups.push({ key, t, start: i, end: i });
    });
    const name = (t) => ({ pre: 'Pretemporada', off: 'Mercado de fichajes', msi: 'MSI y EMEA Masters', worlds: 'Worlds' }[t.phase] || (Season.SPLIT_NAME[t.phase] + (t.kind === 'po' ? ' · Playoffs' : ' · Liga regular')));
    return `<div class="panel"><h2 style="margin-bottom:12px">Calendario ${S.year}</h2><div class="cal">${groups.map((g) => {
      const now = S.turn >= g.start && S.turn <= g.end, past = S.turn > g.end;
      return `<div class="cal-r ${now ? 'now' : past ? 'past' : ''}"><span class="cal-d">${esc(Season.turnDate(S, g.start).text.replace(' de ' + S.year, ''))}</span><b>${name(g.t)}</b><span class="small muted">${g.end - g.start + 1} jornada${g.end > g.start ? 's' : ''}</span>${now ? '<span class="badge gold">Ahora</span>' : ''}</div>`;
    }).join('')}</div></div>`;
  }

  function resultLine(S, m) {
    const A = S.world.teams[m.a], B = S.world.teams[m.b];
    const me = m.a === S.pl.teamId || m.b === S.pl.teamId;
    const r = m.res;
    return `<div class="rl ${me ? 'me' : ''}">
      <div class="team-cell" style="flex:1">${teamLogo(A, 24)}<span class="nm ${r && r.winner === m.a ? 'gold' : ''}">${esc(A.short)}</span></div>
      <span class="num">${r ? `${r.sa} - ${r.sb}` : 'vs'}</span>
      <div class="team-cell" style="flex:1;justify-content:flex-end"><span class="nm ${r && r.winner === m.b ? 'gold' : ''}">${esc(B.short)}</span>${teamLogo(B, 24)}</div></div>`;
  }

  function bracketHtml(S, rounds, n = [4, 2, 1]) {
    const names = ['Cuartos', 'Semifinales', 'Final'];
    return `<div class="bk bk3">${rounds.map((ms, i) => `<div class="bk-col">${Array.from({ length: Math.max(ms.length, n[i] || 1) }, (_, j) => mcard(S, ms[j], names[i])).join('')}</div>`).join('')}</div>`;
  }

  // ----- Mensajes -----
  const FROM_ICON = { family: 'Familia', press: 'Prensa', brand: 'Marca', club: 'Club', player: 'Jugador', system: 'Aviso' };
  function tabMensajes() {
    const S = G.S;
    const box = RC.EV.inbox(S);
    if (!box.length) return '<div class="panel"><h2>Mensajes</h2><p class="muted">Aquí te escribirán jugadores, clubes, tu familia y la prensa. Algunos mensajes son decisiones: eliges entre 3 opciones.</p></div>';
    const sel = box.find((m) => m.id === G.msgSel) || RC.EV.pending(S)[0] || box[0];
    sel.read = true;
    const fromLogo = (m) => (m.from && m.from.teamId && S.world && S.world.teams[m.from.teamId] ? teamLogo(S.world.teams[m.from.teamId], 30) : `<span class="av">${esc((m.from && m.from.name || '?').slice(0, 1))}</span>`);
    const list = box.map((m) => `<button class="msg ${m.id === sel.id ? 'on' : ''} ${m.options && !m.resolved ? 'pend' : ''} ${!m.read ? 'unread' : ''}" data-act="msgSel" data-v="${m.id}">${fromLogo(m)}<span class="msg-b"><b>${esc(m.title)}</b><small>${esc(m.from ? m.from.name : '')} · ${esc(m.when)}</small></span>${m.options && !m.resolved ? '<span class="badge loss">Decidir</span>' : ''}</button>`).join('');
    const hintCls = (h) => (/Arriesg|Muy/.test(h) ? 'loss' : /Seguro/.test(h) ? 'win' : /Minijuego/.test(h) ? 'gold' : 'blue');
    const detail = `<div class="msg-head">${fromLogo(sel)}<div><h3>${esc(sel.title)}</h3><span class="small muted">${esc(sel.from ? sel.from.name : '')} · ${FROM_ICON[sel.from && sel.from.kind] || ''} · ${esc(sel.when)}</span></div></div>
      <p class="msg-text">${esc(sel.text)}</p>
      ${sel.options ? (sel.resolved
        ? `<div class="alert ${sel.auto ? 'red' : ''}"><b>${sel.auto ? 'Se eligió por ti' : 'Elegiste'}:</b> ${esc(sel.options[sel.choice].label)}<br>${esc(sel.answer || '')}</div>`
        : `<div class="stack" style="gap:8px">${sel.options.map((o, i) => `<button class="opt-btn" data-act="decide" data-v="${sel.id}" data-i="${i}"><span>${esc(o.label)}</span><span class="badge ${hintCls(o.hint || '')}">${esc(o.hint || '')}</span></button>`).join('')}</div>
           ${sel.expires != null ? `<p class="small muted" style="margin:8px 0 0">Si no respondes en ${Math.max(1, sel.expires - (S.clock || 0))} ${S.amateur ? 'mes(es)' : 'semana(s)'}, se elegirá "${esc(sel.options[sel.def != null ? sel.def : sel.options.length - 1].label)}".</p>` : ''}`) : ''}`;
    return `<div class="msgs"><div class="panel msg-list">${list}</div><div class="panel msg-detail">${detail}</div></div>`;
  }

  // ----- Mundo: rankings -----
  function tabMundo() {
    const S = G.S;
    const role = G.mundoRole || 'all';
    const me = { id: 'USER', name: S.pl.name, role: S.pl.role, age: S.pl.age, team: S.pl.teamId, ovr: P.ovr(S), user: true };
    const all = Object.values(S.world.players).filter((p) => p.team).map((p) => ({ id: p.id, name: p.name, role: p.role, age: p.age, team: p.team, ovr: W.ovr(p) })).concat([me]);
    const list = all.filter((p) => role === 'all' || p.role === role).sort((a, b) => b.ovr - a.ovr);
    const myPos = list.findIndex((p) => p.user) + 1;
    const top = list.slice(0, 25);
    const teams = Object.values(S.world.teams).map((t) => ({ t, o: W.teamAvgOvr(S, t) })).sort((a, b) => b.o - a.o).slice(0, 20);
    const row = (p, i) => { const t = S.world.teams[p.team]; return `<tr class="${p.user ? 'me' : ''}"><td class="num">${i + 1}</td><td><b style="color:var(--bright)">${esc(p.name)}</b></td><td class="small">${C.ROLE_ES[p.role]}</td><td>${t ? `<div class="team-cell">${teamLogo(t, 22)}<span class="small">${esc(t.short)} · ${esc(C.LEAGUES[t.league].name)}</span></div>` : '<span class="muted">Libre</span>'}</td><td class="r num">${p.age}</td><td class="r"><span class="ovr sm">${p.ovr.toFixed(0)}</span></td><td class="r">${p.user || p.team === S.pl.teamId ? '' : `<button class="btn sm" data-act="talk" data-v="${p.id}">Hablar</button>`}</td></tr>`; };
    return `<div class="grid g2" style="align-items:start">
      <div class="panel"><div class="panel-h"><h2>Mejores jugadores</h2><div class="seg sm">${[['all', 'Todos']].concat(C.ROLES.map((r) => [r, C.ROLE_ES[r]])).map(([id, n]) => `<button class="seg-b ${role === id ? 'on' : ''}" data-act="mundoRole" data-v="${id}">${n}</button>`).join('')}</div></div>
        <p class="small" style="margin:0 0 10px">Tu posición: <b class="gold num">${myPos}º</b> de ${list.length}${role === 'all' ? '' : ' en tu rol'}.</p>
        <div class="tbl-wrap"><table><thead><tr><th>#</th><th>Jugador</th><th>Rol</th><th>Equipo</th><th class="r">Edad</th><th class="r">Media</th><th></th></tr></thead><tbody>${top.map(row).join('')}${myPos > 25 ? `<tr><td colspan="7" class="c muted">…</td></tr>${row(me, myPos - 1)}` : ''}</tbody></table></div></div>
      <div class="panel"><div class="panel-h"><h2>Power ranking</h2><span class="small muted">Media de la plantilla</span></div>
        <div class="tbl-wrap"><table><tbody>${teams.map((x, i) => `<tr class="${x.t.id === S.pl.teamId ? 'me' : ''}"><td class="num">${i + 1}</td><td><div class="team-cell">${teamLogo(x.t, 26)}<span class="nm">${esc(x.t.name)}</span></div></td><td class="small muted">${esc(C.LEAGUES[x.t.league].name)}</td><td class="r num">${x.o.toFixed(1)}</td></tr>`).join('')}</tbody></table></div></div>
    </div>`;
  }

  // ----- Mercado -----
  function tabMercado() {
    const S = G.S;
    const offers = S.offers.map((o) => offerCard(S, o)).join('');
    let html = `<div class="panel"><div class="panel-h"><h2>Ofertas recibidas</h2>${S.amateur ? '' : `<span class="badge ${Season.isWindowOpen(S) ? 'win' : 'loss'}">${Season.isWindowOpen(S) ? 'Mercado abierto' : 'Mercado cerrado'}</span>`}</div>
      ${offers ? `<div class="grid g2">${offers}</div>` : `<p class="muted">${S.amateur ? scoutHint(S) : 'No tienes ofertas ahora mismo. El mercado abre en pretemporada, durante el MSI y tras los Worlds. Si juegas bien, los equipos vendrán a por ti.'}</p>`}</div>`;
    if (S.amateur) return html;
    const rum = S.rumors || [];
    html += `<div class="panel" style="margin-top:16px"><div class="panel-h"><h2>Rumores</h2></div>${rum.length ? `<div class="feed">${rum.slice(0, 10).map((r) => `<div class="${r.you ? 'good' : ''}"><small>${esc(r.when)}</small>${esc(r.text)}</div>`).join('')}</div>` : '<p class="small muted">Sin rumores por ahora.</p>'}</div>`;
    const lg = G.marketLeague || (P.team(S) ? P.team(S).league : P.nation(S).home);
    const req = P.leagueReq(S, lg);
    const me = P.ovr(S);
    html += `<div class="panel" style="margin-top:16px"><div class="panel-h"><h2>Ofrecerte a un equipo</h2>
      <select class="input" id="mk-lg" data-bind="marketLeague">${C.LEAGUE_ORDER.map((x) => `<option value="${x}" ${x === lg ? 'selected' : ''}>${esc(C.LEAGUES[x].full)} · mín. ${P.leagueReq(S, x)}</option>`).join('')}</select></div>
      <p class="small">Mínimo para la ${esc(C.LEAGUES[lg].name)}: <b class="num ${me >= req ? 'good' : 'bad'}">${req}</b>${P.isForeign(S, lg) && C.FOREIGN_EXTRA[lg] ? ` (incluye +${C.FOREIGN_EXTRA[lg]} por ser extranjero)` : ''} · Tu media: <b class="num">${me.toFixed(1)}</b>. Puedes ofrecerte a 2 equipos por semana.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Equipo</th><th>Tu rival por el puesto</th><th class="r">Media</th><th></th></tr></thead><tbody>${W.leagueTeams(S, lg).sort((a, b) => W.teamAvgOvr(S, b) - W.teamAvgOvr(S, a)).map((t) => {
        const pid = t.roster[S.pl.role];
        const p = pid && pid !== 'USER' ? S.world.players[pid] : null;
        const mine = pid === 'USER';
        return `<tr class="${mine ? 'me' : ''}"><td><div class="team-cell">${teamLogo(t, 26)}<span class="nm">${esc(t.name)}</span></div></td><td>${mine ? '<b class="gold">Tú</b>' : p ? esc(p.name) + ` <span class="num muted">${W.ovr(p).toFixed(0)}</span>` : '—'}</td><td class="r num">${W.teamAvgOvr(S, t).toFixed(1)}</td>
          <td class="r">${mine ? '' : `<button class="btn sm" data-act="offerSelf" data-v="${t.id}">Ofrecerme</button>`}</td></tr>`;
      }).join('')}</tbody></table></div></div>`;
    return html;
  }

  function offerCard(S, o) {
    const t = S.world.teams[o.teamId];
    const hi = Math.round((o.salary * 1.5) / 500) * 500;
    const val = G.negAmount[o.id] || Math.round((o.salary * 1.15) / 500) * 500;
    return `<div class="panel" style="background:var(--panel2)">
      <div class="team-cell">${teamLogo(t, 48)}<div style="min-width:0"><div class="nm">${esc(t.name)}</div><div class="small muted">${esc(C.LEAGUES[t.league].full)} · media ${W.teamAvgOvr(S, t).toFixed(1)}</div></div></div>
      <div class="row" style="margin:8px 0">${o.renewal ? '<span class="badge blue">Renovación</span>' : ''}${o.academy ? '<span class="badge gold">Academia</span>' : ''}<span class="badge">${o.years} año${o.years > 1 ? 's' : ''}</span><span class="badge">Caduca en ${Math.max(1, o.expires - S.turn)} ${S.amateur ? 'mes(es)' : 'semana(s)'}</span>${o.buyout ? `<span class="badge gold">Pagan tu cláusula: ${U.money(o.buyout)}</span>` : ''}</div>
      <div class="kv"><div><small>Oferta / año</small><b>${U.money(o.salary)}</b></div><div><small>Intentos</small><b>${o.attempts}/3</b></div></div>
      <label class="f" style="margin-top:12px">Pedir sueldo (rango ${U.money(o.salary)} – ${U.money(hi)})
        <input type="range" id="neg-${o.id}" min="${o.salary}" max="${hi}" step="500" value="${val}" data-neg="${o.id}">
        <span class="num gold" style="font-size:16px" id="negv-${o.id}">${U.money(val)}</span></label>
      <div class="row" style="margin-top:10px"><button class="btn primary sm" data-act="accept" data-v="${o.id}">Aceptar ${U.money(o.salary)}</button><button class="btn blue sm" data-act="negotiate" data-v="${o.id}">Negociar</button><button class="btn sm danger" data-act="reject" data-v="${o.id}">Rechazar</button></div>
    </div>`;
  }

  // ----- Patrocinios -----
  function tabPatrocinios() {
    const S = G.S, pl = S.pl;
    const fame = P.fame(S);
    const nextFame = C.FAME.find((f) => f.min > pl.fans);
    return `<div class="grid g2">
      <div class="panel"><div class="panel-h"><h2>Fama</h2><span class="badge gold">${esc(fame.name)}</span></div>
        <div class="kv"><div><small>Seguidores</small><b>${U.num(pl.fans)}</b></div><div><small>Streams este split</small><b>${pl.streams}</b></div></div>
        ${nextFame ? `<p class="small" style="margin:12px 0 6px">Siguiente nivel: ${esc(nextFame.name)} (${U.num(nextFame.min)})</p>${bar(pl.fans - fame.min, nextFame.min - fame.min, 'blue')}` : ''}
        <p class="small muted" style="margin:12px 0 0">Ganas seguidores con victorias, MVPs, títulos y streams. Con 3 o más streams en un split, tus patrocinadores pagan un 10 % más. A partir de 3.000 seguidores empiezan a llegar marcas.</p></div>
      <div class="panel"><div class="panel-h"><h2>Tu valor comercial</h2><span class="badge blue">${C.SPONSOR_LEVELS[P.sponsorLevel(P.sponsorValue(S))]}</span></div>
        <div class="kv"><div><small>Una marca pagaría</small><b>${U.money(P.sponsorValue(S))}/sem</b></div><div><small>Ingresos por patrocinio</small><b>${U.money(U.sum(pl.sponsors.map((x) => x.pay)))}/sem</b></div></div>
        <div class="lvls">${[1, 2, 3, 4].map((l) => `<span class="${P.sponsorLevel(P.sponsorValue(S)) >= l ? 'on' : ''}">${C.SPONSOR_LEVELS[l]}</span>`).join('')}</div>
        <p class="small muted" style="margin:10px 0 0">El valor sube con la liga en la que juegas, tu media, tus seguidores y tus títulos. Al subir de nivel llegan marcas más grandes, y las que ya tienes mejoran el contrato al terminar cada split si has crecido.</p></div>
      <div class="panel"><div class="panel-h"><h2>Patrocinadores · ${pl.sponsors.length}/${P.maxSponsors(S)}</h2></div>
        ${pl.sponsors.map((s) => `<div class="attr" style="grid-template-columns:1fr auto auto"><span><b style="color:var(--bright)">${esc(s.name)}</b> <span class="small muted">${esc(s.kind)} · ${C.SPONSOR_LEVELS[s.level || 2]} · ${s.splits} split(s)</span></span><span class="num gold">${U.money(s.pay)}/sem</span><span class="badge ${s.done >= s.promos ? 'win' : 'loss'}">${s.done}/${s.promos} acciones</span></div>`).join('') || '<p class="muted">Sin patrocinadores todavía.</p>'}
      </div>
      <div class="panel"><div class="panel-h"><h2>Ofertas de marcas</h2></div>
        ${S.sponsorOffers.map((o) => `<div class="panel" style="background:var(--panel2);margin-bottom:10px"><div class="row between"><div><b style="color:var(--bright)">${esc(o.name)}</b><div class="small muted">${esc(o.kind)} · <span class="gold">${C.SPONSOR_LEVELS[o.level || 2]}</span></div></div><span class="num gold">${U.money(o.pay)} / semana</span></div>
          <p class="small" style="margin:8px 0">Duración: ${o.splits} splits. Exige ${o.promos} acción(es) publicitaria(s) por split.</p>
          <div class="row"><button class="btn sm primary" data-act="spAccept" data-v="${o.id}">Aceptar</button><button class="btn sm danger" data-act="spDecline" data-v="${o.id}">Rechazar</button></div></div>`).join('') || '<p class="muted">Ninguna ahora mismo.</p>'}
      </div>
    </div>`;
  }

  // ----- Carrera -----
  function tabCarrera() {
    const S = G.S, pl = S.pl;
    const c = pl.stats.career;
    const kda = c.d ? ((c.k + c.a) / c.d).toFixed(2) : (c.k + c.a).toFixed(0);
    const seasons = Object.entries(pl.stats.seasons).reverse();
    const topChamps = Object.entries(pl.stats.champs).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return `<div class="stack">
      <div class="panel"><div class="panel-h"><h2>Resumen de carrera</h2>${P.canRetire(S) ? '<button class="btn sm danger" data-act="retireAsk">Retirarse</button>' : ''}</div>
        <div class="kv">
          <div><small>Partidas</small><b>${c.g}</b></div><div><small>% victorias</small><b>${c.g ? Math.round((c.w / c.g) * 100) : 0}%</b></div>
          <div><small>KDA</small><b>${kda}</b></div><div><small>Nota media</small><b>${c.g ? (c.r / c.g).toFixed(2) : '—'}</b></div>
          <div><small>MVP de partido</small><b>${c.mvp}</b></div><div><small>Títulos</small><b>${pl.titles.length}</b></div>
          <div><small>Media máxima</small><b>${pl.peakOvr.toFixed(1)}</b></div><div><small>Ganado</small><b>${U.money(pl.earned)}</b></div>
          <div><small>Pentakills</small><b>${c.penta || 0}</b></div><div><small>Premios</small><b>${pl.awards.length}</b></div>
        </div></div>
      <div class="grid g2">
        <div class="panel"><div class="panel-h"><h2>Títulos</h2></div>${pl.titles.length ? pl.titles.slice().reverse().map((t) => `<div class="attr" style="grid-template-columns:auto 1fr">${ICON.star.replace('<svg', '<svg width="16" height="16"')}<span><b class="gold">${esc(t.name)}</b></span></div>`).join('') : '<p class="muted">Todavía ninguno.</p>'}
          <h3 style="margin:16px 0 8px">Premios individuales</h3>${pl.awards.length ? pl.awards.slice().reverse().map((a) => `<div class="small" style="padding:4px 0">${esc(a.name)}</div>`).join('') : '<p class="muted small">Ninguno todavía.</p>'}</div>
        <div class="panel"><div class="panel-h"><h2>Campeones más jugados</h2></div>${topChamps.length ? `<div class="row">${topChamps.map(([id, n]) => `<div style="text-align:center">${champImg(id, 44)}<div class="small num">${n}</div></div>`).join('')}</div>` : '<p class="muted">Sin partidas profesionales todavía.</p>'}</div>
      </div>
      <div class="panel"><div class="panel-h"><h2>Logros</h2><span class="small muted">${Object.keys(pl.ach || {}).length}/${C.ACHIEVEMENTS.length}</span></div>
        <div class="ach-grid">${C.ACHIEVEMENTS.map((a) => { const y = (pl.ach || {})[a.id]; return `<div class="ach ${y ? 'on' : ''}" title="${esc(a.desc)}">${ICON.star}<span><b>${esc(a.name)}</b><small>${y ? 'Conseguido en ' + y : esc(a.desc)}</small></span></div>`; }).join('')}</div></div>
      <div class="panel"><div class="panel-h"><h2>Por temporada</h2></div>${seasons.length ? `<div class="tbl-wrap"><table><thead><tr><th>Competición</th><th>Equipo</th><th class="r">Part.</th><th class="r">V-D</th><th class="r">KDA</th><th class="r">CS/min</th><th class="r">Nota</th><th class="r">MVP</th><th class="r">Puesto</th></tr></thead><tbody>${seasons.map(([k, s]) => `<tr><td>${esc(k)}</td><td><div class="team-cell">${logoByName(s.team, 22)}<span>${esc(s.team)}</span></div></td><td class="r num">${s.g}</td><td class="r num">${s.w}-${s.g - s.w}</td><td class="r num">${s.d ? ((s.k + s.a) / s.d).toFixed(1) : '—'}</td><td class="r num">${s.g ? (s.cs / s.g).toFixed(1) : '—'}</td><td class="r num">${s.g ? (s.r / s.g).toFixed(1) : '—'}</td><td class="r num">${s.mvp}</td><td class="r num">${s.place ? s.place + 'º' : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Aún no has jugado como profesional.</p>'}</div>
      <div class="panel"><div class="panel-h"><h2>Historia</h2></div><div class="timeline">${pl.history.slice().reverse().map((h) => `<div class="tl"><b>${h.year}</b><span class="tl-logos">${logosInText(h.text)}</span><span>${esc(h.text)}</span></div>`).join('') || '<p class="muted">Tu historia empieza ahora.</p>'}</div></div>
    </div>`;
  }

  // ----- Partida -----
  function tabPartida() {
    const S = G.S;
    return `<div class="grid g2">
      <div class="panel"><div class="panel-h"><h2>Guardado</h2></div>
        <p class="small">La partida se guarda sola en este navegador después de cada acción. Para no perderla (o pasarla a otro dispositivo), expórtala.</p>
        <div class="row"><button class="btn blue" data-act="exportCopy">Copiar partida</button><button class="btn" data-act="exportDl">Descargar archivo</button></div>
        <p class="small muted" style="margin:10px 0 0">Si la descarga no funciona en tu navegador, usa "Copiar partida" y guarda el texto en un archivo.</p>
      </div>
      <div class="panel"><div class="panel-h"><h2>Importar</h2></div>${importForm()}</div>
      <div class="panel"><div class="panel-h"><h2>Nueva carrera</h2></div>
        <p class="small">Estás jugando en el <b class="gold">espacio ${G.slot}</b>. Tus otras partidas siguen guardadas en sus espacios.</p>
        <button class="btn" data-act="toMenu">Volver al menú de partidas</button>
        <h3 style="margin:16px 0 8px">Guardar una copia en otro espacio</h3>
        <p class="small muted" style="margin:0 0 8px">Útil para probar una decisión sin arriesgar tu partida.</p>
        <div class="row">${RC.SLOTS.filter((n) => n !== G.slot).map((n) => { const o = RC.loadSave(n); return G.confirmCopy === n ? `<span class="small bad">¿Sobrescribir la partida de ${esc(o.pl.name)}?</span><button class="btn danger sm" data-act="copyYes" data-v="${n}">Sí</button><button class="btn sm" data-act="copyNo">No</button>` : `<button class="btn sm" data-act="copySlot" data-v="${n}">Espacio ${n}${o && o.pl ? ' (' + esc(o.pl.name) + ')' : ' (vacío)'}</button>`; }).join('')}</div>
      </div>
      <div class="panel"><div class="panel-h"><h2>Datos</h2></div><p class="small">Parche de iconos de Riot: ${esc(D.champVersion)} · ${Object.keys(D.champions).length} campeones · ${S.world ? Object.keys(S.world.teams).length + ' equipos' : ''}</p></div>
    </div>`;
  }

  function importForm() {
    const pick = !G.S ? `<label class="f" style="margin-bottom:8px">Espacio de destino<select class="input" id="imp-slot" data-bind="impSlot">${RC.SLOTS.map((n) => { const o = RC.loadSave(n); return `<option value="${n}" ${n === G.impSlot ? 'selected' : ''}>Espacio ${n}${o && o.pl ? ' · sobrescribe a ' + esc(o.pl.name) : ' · vacío'}</option>`; }).join('')}</select></label>` : `<p class="small muted">Se cargará en el espacio ${G.slot} y sustituirá a la partida actual.</p>`;
    return `${pick}<p class="small">Elige un archivo de partida o pega el texto exportado.</p>
      <input type="file" id="imp-file" accept=".json,application/json,text/plain" class="input" style="width:100%">
      <textarea class="input" id="imp-text" rows="4" style="width:100%;margin-top:8px" placeholder="Pega aquí tu partida">${esc(G.importText)}</textarea>
      <button class="btn blue" style="margin-top:8px" data-act="importText">Cargar desde el texto</button>`;
  }

  // ---------- Fin de carrera ----------
  function viewEnd() {
    const S = G.S, pl = S.pl, c = pl.stats.career;
    let hof = [];
    try { hof = JSON.parse(localStorage.getItem('rc_hof') || '[]'); } catch (e) { /* nada */ }
    return `<div class="wrap content"><section class="hero" style="padding-top:24px"><div class="badge gold">Fin de la carrera</div><h1 style="font-size:clamp(28px,6vw,48px)">${esc(pl.name)}</h1><p>${esc(S.overReason || '')}</p></section>
      <div class="panel" style="max-width:900px;margin:0 auto"><div class="kv">
        <div><small>Años</small><b>${S.startYear}–${S.year}</b></div><div><small>Títulos</small><b>${pl.titles.length}</b></div><div><small>Worlds</small><b>${pl.titles.filter((t) => t.name.startsWith('Worlds')).length}</b></div>
        <div><small>Media máxima</small><b>${pl.peakOvr.toFixed(1)}</b></div><div><small>Partidas</small><b>${c.g}</b></div><div><small>% victorias</small><b>${c.g ? Math.round((c.w / c.g) * 100) : 0}%</b></div>
        <div><small>Premios</small><b>${pl.awards.length}</b></div><div><small>Seguidores</small><b>${U.num(pl.fans)}</b></div></div>
        <div class="timeline" style="margin-top:16px">${pl.history.map((h) => `<div class="tl"><b>${h.year}</b><span class="tl-logos">${logosInText(h.text)}</span><span>${esc(h.text)}</span></div>`).join('')}</div>
        <div class="row" style="margin-top:16px;justify-content:center"><button class="btn primary lg" data-act="toMenu">Volver al menú</button></div></div>
      ${hof.length ? `<section class="panel" style="max-width:900px;margin:24px auto 0"><h2>Salón de la fama</h2>${hofTable(hof)}</section>` : ''}</div>`;
  }

  // ---------- Modales ----------
  function scoreboard(S, g, A, B) {
    if (!g.board) return '';
    const side = (T, rows, win) => `<div class="sb-side"><div class="sb-h ${win ? 'w' : 'l'}">${teamLogo(T, 22)}<b>${esc(T.short)}</b><span class="badge ${win ? 'win' : 'loss'}">${win ? 'Victoria' : 'Derrota'}</span></div>
      ${rows.map((r) => `<div class="sb-r ${r.user ? 'me' : ''}">${champImg(r.champ, 28)}<span class="sb-n"><b>${esc(r.name)}</b><small>${C.ROLE_ES[r.role]}</small></span><span class="num">${r.k}/${r.d}/${r.a}</span><span class="num hide-s">${r.cs}</span><span class="rt num ${r.rating >= 8 ? 'hi' : r.rating < 5.5 ? 'lo' : ''}">${r.rating.toFixed(1)}</span></div>`).join('')}</div>`;
    const userA = g.board.A.some((r) => r.user);
    const aWin = userA ? g.win : !g.win;
    return `<div class="sb">${side(A, g.board.A, aWin)}${side(B, g.board.B, !aWin)}</div>`;
  }

  function reportModal(rep) {
    const S = G.S;
    G.repGame = 0;
    return () => {
      let h = `<h2>${esc(rep.label)}</h2><p class="small muted" style="margin:0 0 14px">${esc(rep.date)}</p>`;
      const u = rep.user;
      if (u) {
        const A = S.world.teams[u.a], B = S.world.teams[u.b];
        const won = u.winner === S.pl.teamId;
        const gi = Math.min(G.repGame || 0, u.games.length - 1);
        const g = u.games[gi];
        h += `<div class="match ${won ? 'won' : 'lost'}"><div class="side">${teamLogo(A, 60)}<span class="nm">${esc(A.name)}</span></div><div class="side"><span class="score">${u.sa} - ${u.sb}</span><span class="badge ${won ? 'win' : 'loss'}">${won ? 'Victoria' : 'Derrota'}</span></div><div class="side">${teamLogo(B, 60)}<span class="nm">${esc(B.name)}</span></div></div>
          <div class="row" style="margin:12px 0 6px">${u.mvp ? '<span class="badge gold">MVP de la serie</span>' : ''}${u.games.some((x) => x.penta) ? '<span class="badge gold">¡Pentakill!</span>' : ''}<span class="small">+${U.num(u.fans || 0)} seguidores</span></div>
          ${u.clutch ? `<div class="alert ${u.clutch.won ? '' : 'red'}" style="margin-bottom:8px"><b>Jugada clave (${esc(u.clutch.reason)}):</b> ${Math.round(u.clutch.score * 100)} % en el minijuego. ${u.clutch.won ? 'Ganáis ese mapa.' : 'No basta para ganar ese mapa.'}</div>` : ''}
          ${u.games.length > 1 ? `<div class="seg sm">${u.games.map((x, i) => `<button class="seg-b ${i === gi ? 'on' : ''}" data-act="repGame" data-v="${i}">Partida ${i + 1} <span class="${x.win ? 'good' : 'bad'}">${x.win ? 'V' : 'D'}</span></button>`).join('')}</div>` : ''}
          <div class="game-line">${champImg(g.champ, 44)}<div><b style="color:var(--bright)">${esc(D.champName(g.champ))}</b>${g.penta ? ' <span class="badge gold">Pentakill</span>' : ''}<div class="small muted">contra ${esc(g.opp)}${g.oppChamp ? ' (' + esc(D.champName(g.oppChamp)) + ')' : ''}</div></div><span class="num">${g.k}/${g.d}/${g.a}</span><span class="num hide-s">${g.cs} CS/m</span><span class="ovr sm">${g.rating.toFixed(1)}</span></div>
          ${scoreboard(S, g, A, B)}`;
      } else if (!S.amateur) {
        h += '<p class="muted">Sin partido para ti esta jornada.</p>';
      }
      if (rep.events.length) h += `<h3 style="margin:16px 0 6px">Novedades</h3>${rep.events.map((e) => `<div class="alert ${/^Logro/.test(e) ? '' : 'blue'}" style="margin-bottom:6px">${esc(e)}</div>`).join('')}`;
      if (rep.headlines.length) h += `<h3 style="margin:16px 0 6px">Titulares</h3><div class="feed">${rep.headlines.map((x) => `<div>${esc(x)}</div>`).join('')}</div>`;
      h += `<p class="small muted" style="margin-top:12px">Ingresos: <span class="good">${U.money(rep.income)}</span> · Gastos: <span class="bad">${U.money(Math.abs(rep.costs))}</span></p>`;
      h += '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" data-act="closeModal">Continuar</button></div>';
      return h;
    };
  }

  function champPickModal() {
    const S = G.S;
    return `<h2>Practicar campeón</h2><p class="small muted">Elige con quién entrenar. Gasta 1 acción.</p>
      <div class="champ-grid" style="margin-top:10px">${S.pl.pool.map((c) => `<button class="cg" data-act="champTrain" data-v="${c}">${champImg(c, 56)}${tierBadge(c)}<span>${esc(D.champName(c))}</span><span class="num small">${P.mastery(S, c).toFixed(0)}</span></button>`).join('') || '<p>Tu pool está vacío.</p>'}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="closeModal">Cancelar</button></div>`;
  }

  // ---------- Acciones de la interfaz ----------
  function after(res) {
    if (res && res.msg) toast(res.msg, !res.ok);
    RC.save();
    RC.render();
  }

  const handlers = {
    tab: (d) => { G.tab = d.v; G.confirmNew = false; RC.render(); window.scrollTo(0, 0); },
    slotPlay: (d) => { G.slot = +d.v; G.S = RC.migrate(RC.loadSave(G.slot)); G.tab = 'inicio'; G.confirmDel = null; RC.render(); window.scrollTo(0, 0); },
    slotNew: (d) => { G.slot = +d.v; G.create = { mode: d.mode, name: '', nation: 'ES', role: 'Mid', style: 'estratega', champs: [] }; RC.render(); window.scrollTo(0, 0); },
    slotDel: (d) => { G.confirmDel = +d.v; RC.render(); },
    slotDelNo: () => { G.confirmDel = null; RC.render(); },
    slotDelYes: (d) => { RC.clearSave(+d.v); G.confirmDel = null; RC.render(); toast(`Espacio ${d.v} borrado.`); },
    toMenu: () => { RC.save(); G.S = null; G.modal = null; G.create = null; G.confirmCopy = null; RC.render(); window.scrollTo(0, 0); },
    copySlot: (d) => { const n = +d.v; if (RC.loadSave(n)) { G.confirmCopy = n; RC.render(); return; } copyTo(n); },
    copyYes: (d) => copyTo(+d.v),
    copyNo: () => { G.confirmCopy = null; RC.render(); },
    newMode: (d) => {
      const n = RC.firstEmptySlot();
      if (!n) { toast('Los 3 espacios están ocupados. Borra uno para empezar otra carrera.', true); return; }
      G.slot = n; G.create = { mode: d.mode, name: '', nation: 'ES', role: 'Mid', style: 'estratega', champs: [] }; RC.render(); },
    backMenu: () => { G.create = null; RC.render(); },
    cRole: (d) => { G.create.role = d.v; G.create.champs = []; RC.render(); },
    cStyle: (d) => { G.create.style = d.v; RC.render(); },
    cChamp: (d) => {
      const c = G.create.champs;
      if (c.includes(d.v)) G.create.champs = c.filter((x) => x !== d.v);
      else if (c.length < 3) c.push(d.v);
      RC.render();
    },
    createGo: () => {
      const c = G.create;
      if (c.name.trim().length < 2 || c.champs.length !== 3) return;
      G.S = P.newGame(c);
      G.create = null;
      G.tab = 'inicio';
      RC.save();
      RC.render();
      window.scrollTo(0, 0);
    },
    startPick: (d) => { P.startPro(G.S, G.S.startOffers[+d.i]); RC.save(); RC.render(); },
    do: (d) => after(P.doAction(G.S, d.v)),
    champPick: () => { G.modal = champPickModal; RC.render(); },
    champTrain: (d) => { G.modal = null; after(P.doAction(G.S, 'champ', d.v)); },
    champAdd: (d) => { const r = P.addChamp(G.S, d.v); if (G.S.pl.pool.includes(d.v) && !r) { after({ ok: true, msg: 'Ya está en tu pool.' }); return; } after(r || { ok: true, msg: `${D.champName(d.v)} añadido a tu pool.` }); },
    champRemove: (d) => { P.removeChamp(G.S, d.v); after(); },
    buy: (d) => after(P.buyGear(G.S, d.v)),
    staffSet: (d) => after(P.setStaff(G.S, d.v, +d.t)),
    exp: (d) => after(P.buyExperience(G.S, d.v)),
    advance: () => {
      const S = G.S;
      const km = RC.EV.keyMoment(S);
      if (km.key && !S.pl.clutch) {
        RC.playMinigame({ title: 'Momento clave', reason: km.reason, sub: 'Tu jugada decidirá el mapa decisivo de la serie.', onDone: (score) => { S.pl.clutch = { score, reason: km.reason }; doAdvance(); } });
        return;
      }
      doAdvance();
    },
    msgSel: (d) => { G.msgSel = d.v; RC.render(); },
    decide: (d) => {
      const S = G.S;
      const m = RC.EV.inbox(S).find((x) => x.id === d.v);
      if (!m) return;
      const o = m.options[+d.i];
      if (o.mg) {
        RC.playMinigame({ title: m.title, reason: o.label, onDone: (score) => { const r = RC.EV.resolve(S, m.id, +d.i, score); G.modal = null; after(r); } });
        return;
      }
      after(RC.EV.resolve(S, m.id, +d.i));
    },
    talk: (d) => { G.modal = talkModal(d.v); RC.render(); },
    talkDo: (d) => { G.modal = null; after(RC.EV.contact(G.S, d.v, d.k)); },
    reqOpen: () => { G.reqCands = {}; G.reqRole = C.ROLES.find((r) => r !== G.S.pl.role); G.modal = reqModal; RC.render(); },
    reqRole: (d) => { G.reqRole = d.v; RC.render(); },
    reqDo: (d) => { G.modal = null; after(RC.EV.request(G.S, d.v)); },
    mgStart: () => startMinigame(),
    mgSim: () => { const sc = RC.MG.simScore(G.S); finishMinigame(sc, true); },
    mgDone: () => { const cb = G.mg && G.mg.onDone; const sc = G.mg ? G.mg.score : 0.5; G.mg = null; G.modal = null; if (cb) cb(sc); },
    closeModal: () => { G.modal = null; RC.render(); },
    compView: (d) => { G.compView = d.v; RC.render(); },
    ligaRound: (d) => { G.ligaRound = +d.v; RC.render(); },
    repGame: (d) => { G.repGame = +d.v; RC.render(); },
    mundoRole: (d) => { G.mundoRole = d.v; RC.render(); },
    closeModalBg: (d, el, ev) => { if (ev.target === el && !G.mg) { G.modal = null; RC.render(); } },
    accept: (d) => { const wasAm = G.S.amateur; const r = P.acceptOffer(G.S, d.v); if (wasAm && !G.S.amateur) G.tab = 'equipo'; after(r); },
    reject: (d) => { P.rejectOffer(G.S, d.v); after({ ok: true, msg: 'Oferta rechazada.' }); },
    negotiate: (d) => {
      const amount = G.negAmount[d.v] || Math.round((G.S.offers.find((o) => o.id === d.v).salary * 1.15) / 500) * 500;
      const wasAm = G.S.amateur;
      const r = P.negotiate(G.S, d.v, amount);
      if (wasAm && !G.S.amateur) G.tab = 'equipo';
      after(r);
    },
    offerSelf: (d) => after(P.offerSelf(G.S, d.v)),
    spAccept: (d) => after(P.acceptSponsor(G.S, d.v)),
    spDecline: (d) => { P.declineSponsor(G.S, d.v); after(); },
    retireAsk: () => {
      G.modal = () => `<h2>¿Retirarte?</h2><p>Tu carrera terminará ahora y pasarás al Salón de la fama.</p><div class="row" style="justify-content:flex-end"><button class="btn" data-act="closeModal">Seguir jugando</button><button class="btn danger" data-act="retireGo">Retirarme</button></div>`;
      RC.render();
    },
    retireGo: () => { G.modal = null; P.retire(G.S); RC.save(); RC.render(); },
    exportCopy: () => {
      const txt = JSON.stringify(G.S);
      const ok = () => toast('Partida copiada al portapapeles.');
      try {
        navigator.clipboard.writeText(txt).then(ok, () => showExportText(txt));
      } catch (e) { showExportText(txt); }
    },
    exportDl: () => {
      try {
        const blob = new Blob([JSON.stringify(G.S)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `rift-career-${U.slug(G.S.pl.name)}-${G.S.year}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) { showExportText(JSON.stringify(G.S)); }
    },
    importOpen: () => { G.modal = () => `<h2>Importar partida</h2>${importForm()}<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="closeModal">Cerrar</button></div>`; RC.render(); },
    importText: () => { const el = document.getElementById('imp-text'); doImport(el ? el.value : ''); },

  };

  function doAdvance() {
    const wasAmateur = G.S.amateur;
    const rep = P.advance(G.S);
    RC.save();
    if (!G.S.over) G.modal = reportModal(rep);
    if (wasAmateur && !G.S.amateur) G.tab = 'equipo';
    RC.render();
  }

  // ---------- Minijuegos ----------
  RC.playMinigame = function (opts) {
    const S = G.S;
    const type = RC.MG.pick(S);
    G.mg = Object.assign({ type, ease: RC.MG.ease(S, type), score: null }, opts);
    G.modal = mgModal;
    RC.render();
  };
  function mgModal() {
    const m = G.mg;
    const T = RC.MG.TYPES[m.type];
    return `<div class="mg-head"><span class="badge gold">${esc(m.title || 'Minijuego')}</span><h2>${esc(T.name)}</h2>${m.reason ? `<p class="small" style="margin:4px 0 0">${esc(m.reason)}</p>` : ''}</div>
      <div id="mg-box"><p>${esc(T.help)}</p>${m.sub ? `<p class="small muted">${esc(m.sub)}</p>` : ''}
        <p class="small muted">Dificultad según tu ${esc(C.ATTR_NAME[T.attr])}: ${m.ease >= 1.05 ? 'algo más fácil' : m.ease <= 0.95 ? 'algo más difícil' : 'normal'}.</p>
        <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="mgSim">Simular sin jugar</button><button class="btn primary" data-act="mgStart">Empezar</button></div></div>`;
  }
  function startMinigame() {
    const box = document.getElementById('mg-box');
    if (!box) return;
    box.innerHTML = '<canvas id="mg-canvas" class="mg-canvas" aria-label="Minijuego"></canvas>';
    const cv = document.getElementById('mg-canvas');
    let n = 3;
    const ctx = cv.getContext('2d');
    const count = () => {
      cv.width = 640; cv.height = 360;
      ctx.fillStyle = '#0B1526'; ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = '#F5D08A'; ctx.font = '800 72px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(n), 320, 205);
      if (n-- > 0) setTimeout(count, 550); else RC.MG.start(cv, G.mg.type, G.mg.ease, (sc) => finishMinigame(sc, false));
    };
    count();
  }
  function finishMinigame(score, simulated) {
    G.mg.score = score;
    const box = document.getElementById('mg-box');
    if (!box) return;
    const pct = Math.round(score * 100);
    const verdict = pct >= 85 ? '¡Jugada perfecta!' : pct >= 60 ? 'Buena jugada' : pct >= 35 ? 'Regular' : 'Mala jugada';
    box.innerHTML = `<div class="mg-res"><span class="num">${pct} %</span><b>${verdict}</b>${simulated ? '<small class="muted">Resultado simulado según tu nivel.</small>' : ''}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" data-act="mgDone">Continuar</button></div>`;
  }

  // ---------- Hablar con jugadores ----------
  function talkModal(pid) {
    return () => {
      const S = G.S;
      const p = S.world.players[pid];
      const t = p.team ? S.world.teams[p.team] : null;
      const can = RC.EV.canContact(S, pid);
      const mine = P.team(S);
      return `<div class="row" style="gap:12px">${t ? teamLogo(t, 48) : ''}<div><h2>${esc(p.name)}</h2><span class="small muted">${C.ROLE_ES[p.role]} · ${p.age} años · media ${W.ovr(p).toFixed(0)}${t ? ' · ' + esc(t.name) : ''}</span></div></div>
        <p class="small" style="margin:12px 0">¿Qué le dices?${can ? '' : ' <b class="bad">Hablaste con él hace poco: espera unas semanas.</b>'}</p>
        <div class="stack" style="gap:8px">
          <button class="opt-btn" data-act="talkDo" data-v="${pid}" data-k="pitch" ${can && mine ? '' : 'disabled'}><span>Proponerle venir a ${mine ? esc(mine.name) : 'tu equipo'}</span><span class="badge blue">Fichaje</span></button>
          <button class="opt-btn" data-act="talkDo" data-v="${pid}" data-k="ask" ${can && t ? '' : 'disabled'}><span>Preguntarle si en ${t ? esc(t.name) : 'su equipo'} te querrían</span><span class="badge gold">Oferta</span></button>
          <button class="opt-btn" data-act="talkDo" data-v="${pid}" data-k="friend" ${can ? '' : 'disabled'}><span>Charlar y hacer buenas migas</span><span class="badge win">Relación</span></button>
        </div>
        <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="closeModal">Cerrar</button></div>`;
    };
  }

  // ---------- Petición de fichaje ----------
  function reqModal() {
    const S = G.S;
    const role = G.reqRole;
    G.reqCands[role] = G.reqCands[role] || RC.EV.candidates(S, role, 3);
    const team = P.team(S);
    const cur = S.world.players[team.roster[role]];
    const st = RC.EV.status(S);
    return `<h2>Pedir un fichaje</h2><p class="small muted" style="margin:4px 0 12px">Solo puedes hacer una petición por temporada. Como ${st.name.toLowerCase()}, el club ${st.w >= 0.8 ? 'casi siempre te hará caso' : st.w >= 0.5 ? 'suele hacerte caso' : 'rara vez te hará caso'}.</p>
      <div class="seg sm">${C.ROLES.filter((r) => r !== S.pl.role).map((r) => `<button class="seg-b ${r === role ? 'on' : ''}" data-act="reqRole" data-v="${r}">${C.ROLE_ES[r]}</button>`).join('')}</div>
      <p class="small">Ahora mismo: <b style="color:var(--bright)">${cur ? esc(cur.name) : '—'}</b> ${cur ? `<span class="num muted">${W.ovr(cur).toFixed(0)}</span>` : ''}</p>
      <div class="stack" style="gap:8px">${G.reqCands[role].length ? G.reqCands[role].map((c) => { const p = S.world.players[c.pid]; const t = p.team ? S.world.teams[p.team] : null;
        return `<button class="opt-btn" data-act="reqDo" data-v="${p.id}"><span class="team-cell">${t ? teamLogo(t, 26) : ''}<span><b>${esc(p.name)}</b> <span class="small muted">${p.age} años${t ? ' · ' + esc(t.short) + ' (' + esc(C.LEAGUES[t.league].name) + ')' : ' · libre'}</span></span></span><span class="row">${c.interested ? '<span class="badge win">Ya dijo que sí</span>' : ''}<span class="ovr sm">${W.ovr(p).toFixed(0)}</span></span></button>`; }).join('') : '<p class="muted">El club no encuentra a nadie mejor que pueda pagar para ese puesto.</p>'}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="closeModal">Cancelar</button></div>`;
  }

  function showExportText(txt) {
    G.modal = () => `<h2>Tu partida</h2><p class="small">Selecciona todo el texto y guárdalo en un archivo.</p><textarea class="input" rows="8" style="width:100%" readonly onclick="this.select()">${esc(txt)}</textarea><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="closeModal">Cerrar</button></div>`;
    RC.render();
  }

  function copyTo(n) {
    try { localStorage.setItem(slotKey(n), JSON.stringify(Object.assign({}, G.S, { id: U.uid() }))); toast(`Copia guardada en el espacio ${n}.`); } catch (e) { toast('No se ha podido guardar la copia.', true); }
    G.confirmCopy = null;
    RC.render();
  }

  function doImport(text) {
    try {
      const S = JSON.parse(text);
      if (!S || !S.pl || !S.cal) throw new Error('formato');
      if (!G.S) G.slot = G.impSlot || 1;
      G.S = RC.migrate(S);
      G.modal = null;
      G.importText = '';
      G.tab = 'inicio';
      RC.save();
      RC.render();
      toast('Partida cargada.');
    } catch (e) {
      toast('El texto no es una partida válida de Rift Career.', true);
    }
  }

  RC.migrate = (S) => {
    if (S && S.world && !S.world.target) S.world.target = W.topMean(S.world);
    if (S && !S.amateur && S.world && S.cal) { Season.migrate(S); Season.prepareTurn(S); }
    return S;
  };

  RC.bindEvents = function () {
    document.addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-act]');
      if (!el || el.disabled) return;
      const fn = handlers[el.dataset.act];
      if (fn) fn(el.dataset, el, ev);
    });
    document.addEventListener('input', (ev) => {
      const el = ev.target;
      if (el.dataset.neg) {
        G.negAmount[el.dataset.neg] = +el.value;
        const out = document.getElementById('negv-' + el.dataset.neg);
        if (out) out.textContent = U.money(+el.value);
        return;
      }
      const b = el.dataset.bind;
      if (!b) return;
      if (G.create && ['name', 'nation'].includes(b)) {
        G.create[b] = el.value;
        if (b === 'name') {
          const btn = document.querySelector('[data-act="createGo"]');
          if (btn) btn.disabled = G.create.name.trim().length < 2 || G.create.champs.length !== 3;
          return;
        }
        RC.render();
        return;
      }
      if (b === 'champQuery') {
        G.champQuery = el.value;
        RC.render();
        const q = document.getElementById('ch-q');
        if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
        return;
      }
      if (b === 'champRole') { G.champRole = el.value; G.champQuery = ''; }
      if (b === 'compLeague') { G.compLeague = el.value; G.ligaRound = null; }
      if (b === 'marketLeague') G.marketLeague = el.value;
      if (b === 'impSlot') { G.impSlot = +el.value; return; }
      RC.render();
    });
    document.addEventListener('change', (ev) => {
      const el = ev.target;
      if (el.id === 'imp-file' && el.files && el.files[0]) {
        const r = new FileReader();
        r.onload = () => doImport(String(r.result));
        r.readAsText(el.files[0]);
      }
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && G.modal && !G.mg) { G.modal = null; RC.render(); }
    });
  };
})(window.RC);
