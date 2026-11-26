/* Interfaz: todas las pantallas del juego. */
(function (RC) {
  const { U, C, D, W, P, Season } = RC;
  const G = (RC.G = { S: null, tab: 'inicio', create: null, compLeague: null, marketLeague: null, champQuery: '', champRole: null, modal: null, negAmount: {}, importText: '', confirmNew: false });
  const SAVE_KEY = 'rc_save_v1';
  const $app = () => document.getElementById('app');
  const esc = U.esc;

  // ---------- Guardado ----------
  RC.save = function () {
    if (!G.S) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.S)); } catch (e) { /* sin almacenamiento */ }
  };
  RC.loadSave = function () {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  };
  RC.clearSave = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ } };

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
    const has = RC.loadSave();
    let hof = [];
    try { hof = JSON.parse(localStorage.getItem('rc_hof') || '[]'); } catch (e) { /* nada */ }
    return `<div class="wrap">
      <section class="hero">
        <div class="badge gold">Simulador de carrera · League of Legends</div>
        <h1>RIFT <span>CAREER</span></h1>
        <p>No eres el mánager: eres el jugador. Entrena, mejora tu equipo, elige tus campeones, negocia contratos y llega desde la academia hasta los Worlds.</p>
        ${has && has.pl ? `<div class="row" style="justify-content:center"><button class="btn primary lg" data-act="continue">Continuar carrera</button></div>
          <p class="small muted">${esc(has.pl.name)} · ${has.pl.age} años · ${has.year}${has.pl.teamId && has.world && has.world.teams[has.pl.teamId] ? ' · ' + esc(has.world.teams[has.pl.teamId].name) : ''}</p>` : ''}
      </section>
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

  function hofTable(list) {
    const rows = list.slice().sort((a, b) => b.titles - a.titles || b.peak - a.peak).map((e) => `<tr><td>${flag(e.nation)} <b class="gold">${esc(e.name)}</b> <span class="muted small">${C.ROLE_ES[e.role]}</span></td><td>${esc(e.years)}</td><td class="r num">${e.peak}</td><td class="r num">${e.titles}</td><td class="r num">${e.worlds}</td><td class="r num">${e.games}</td><td class="r num">${e.winrate}%</td></tr>`).join('');
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
    ['inicio', 'Inicio'], ['jugador', 'Jugador'], ['campeones', 'Campeones'], ['tienda', 'Tienda'], ['staff', 'Staff'],
    ['equipo', 'Equipo'], ['competicion', 'Competición'], ['mercado', 'Mercado'], ['patrocinios', 'Patrocinios'], ['carrera', 'Carrera'], ['partida', 'Partida'],
  ];

  function viewGame() {
    const S = G.S;
    const pl = S.pl;
    const date = Season.turnDate(S);
    const team = P.team(S);
    const alerts = { mercado: S.offers.length > 0, patrocinios: S.sponsorOffers.length > 0 };
    let tabs = TABS;
    if (S.amateur) tabs = TABS.filter(([id]) => !['equipo', 'competicion'].includes(id));
    if (!tabs.some(([id]) => id === G.tab)) G.tab = 'inicio';
    const body = { inicio: tabInicio, jugador: tabJugador, campeones: tabCampeones, tienda: tabTienda, staff: tabStaff, equipo: tabEquipo, competicion: tabCompeticion, mercado: tabMercado, patrocinios: tabPatrocinios, carrera: tabCarrera, partida: tabPartida }[G.tab]();
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
    return `<div class="main-grid">
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
  function tabJugador() {
    const S = G.S, pl = S.pl;
    const sub = P.sub(S);
    const team = P.team(S);
    const rk = P.rankInfo(pl.lp);
    const style = C.STYLES.find((s) => s.id === pl.style);
    return `<div class="grid g2">
      <div class="panel">
        <div class="row" style="gap:16px;align-items:flex-start">
          <div class="ovr" style="height:72px;min-width:72px;font-size:30px">${P.ovr(S).toFixed(0)}</div>
          <div style="min-width:0">
            <h1 style="font-size:26px">${esc(pl.name)}</h1>
            <div class="row small" style="margin-top:4px">${flag(pl.nation)} ${esc(P.nation(S).name)} · ${C.ROLE_ES[pl.role]} · ${pl.age} años · ${style ? style.name : ''}</div>
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
      <p class="small muted" style="margin:0">Cada miembro tiene tres niveles: Básico, Profesional y Élite. Se paga cada ${unit}. Si te quedas sin dinero, el staff se marcha.${S.pl.contract ? ` Tu sueldo: ${U.money(S.pl.contract.salary / 51)} / semana.` : ''}</p></div>
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
    return `<div class="grid g2">
      <div class="panel"><div class="row" style="gap:16px">${teamLogo(team, 80)}<div><h1 style="font-size:24px">${esc(team.name)}</h1><div class="small muted">${esc(C.LEAGUES[team.league].full)} · media <span class="num">${W.teamAvgOvr(S, team).toFixed(1)}</span></div></div></div>
        <div class="kv" style="margin-top:16px"><div><small>Sueldo / año</small><b>${U.money(c.salary)}</b></div><div><small>Contrato hasta</small><b>${c.endYear}</b></div><div><small>Por semana</small><b>${U.money(c.salary / 51)}</b></div></div></div>
      <div class="panel"><div class="panel-h"><h2>Plantilla</h2></div>${rosterMini(S, team)}</div>
    </div>`;
  }

  // ----- Competición -----
  function tabCompeticion() {
    const S = G.S;
    const myLg = P.team(S) ? P.team(S).league : 'LEC';
    const lg = G.compLeague || myLg;
    const sp = S.comp && S.comp.split;
    const L = sp ? sp.leagues[lg] : null;
    let html = `<div class="panel"><div class="panel-h"><h2>${sp ? Season.SPLIT_NAME[sp.id] + ' ' + S.year : 'Temporada ' + S.year}</h2>
      <select class="input" id="comp-lg" data-bind="compLeague">${C.LEAGUE_ORDER.map((x) => `<option value="${x}" ${x === lg ? 'selected' : ''}>${esc(C.LEAGUES[x].full)}</option>`).join('')}</select></div>`;
    if (!L) {
      html += '<p class="muted">El split todavía no ha empezado. Aquí verás la clasificación y los resultados.</p>';
      html += `<h3 style="margin:12px 0 8px">Equipos</h3><div class="grid g3">${W.leagueTeams(S, lg).sort((a, b) => W.teamAvgOvr(S, b) - W.teamAvgOvr(S, a)).map((t) => `<div class="team-cell">${teamLogo(t, 30)}<span class="nm">${esc(t.name)}</span><span class="num small muted">${W.teamAvgOvr(S, t).toFixed(1)}</span></div>`).join('')}</div></div>`;
    } else {
      const rows = Season.sortedTable(L).map((r, i) => {
        const t = S.world.teams[r.tid];
        return `<tr class="${r.tid === S.pl.teamId ? 'me' : ''}"><td class="num">${i + 1}</td><td><div class="team-cell">${teamLogo(t, 24)}<span class="nm">${esc(t.name)}</span></div></td><td class="c num">${r.w}</td><td class="c num">${r.l}</td><td class="r num muted">${W.teamAvgOvr(S, t).toFixed(1)}</td></tr>`;
      }).join('');
      const showRound = Math.max(0, Math.min(8, (L.sched.findIndex((r) => !r[0].res) === -1 ? 9 : L.sched.findIndex((r) => !r[0].res)) - 1));
      html += `<div class="grid g2"><div class="tbl-wrap"><table><thead><tr><th>#</th><th>Equipo</th><th class="c">V</th><th class="c">D</th><th class="r">Media</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="small muted">Los 6 primeros juegan los playoffs.</p></div>
        <div><h3 style="margin-bottom:8px">Jornada ${showRound + 1}</h3>${L.sched[showRound].map((m) => resultLine(S, m)).join('')}</div></div>`;
      if (L.po) html += `<h3 style="margin:18px 0 10px">Playoffs</h3>${bracketHtml(S, L.po.rounds)}`;
      html += '</div>';
    }
    // Internacionales
    for (const ev of [S.comp && S.comp.msi, S.comp && S.comp.emea]) {
      if (ev) html += `<div class="panel" style="margin-top:16px"><div class="panel-h"><h2>${esc(ev.name)} ${S.year}</h2>${ev.champion ? `<span class="badge gold">Campeón: ${esc(teamName(ev.champion))}</span>` : ''}</div>${bracketHtml(S, ev.rounds)}</div>`;
    }
    const wd = S.comp && S.comp.worlds;
    if (wd) {
      html += `<div class="panel" style="margin-top:16px"><div class="panel-h"><h2>Worlds ${S.year}</h2>${wd.champion ? `<span class="badge gold">Campeón: ${esc(teamName(wd.champion))}</span>` : ''}</div>
        <div class="grid g3">${wd.groups.map((g, i) => `<div><h3 style="margin-bottom:6px">Grupo ${'ABCD'[i]}</h3><table><tbody>${Season.groupTable(wd, g).map((r) => `<tr class="${r.tid === S.pl.teamId ? 'me' : ''}"><td><div class="team-cell">${teamLogo(S.world.teams[r.tid], 22)}<span class="nm">${esc(teamName(r.tid))}</span></div></td><td class="r num">${r.w}-${r.l}</td></tr>`).join('')}</tbody></table></div>`).join('')}</div>
        ${wd.rounds[0].length ? `<h3 style="margin:16px 0 10px">Eliminatorias</h3>${bracketHtml(S, wd.rounds)}` : ''}</div>`;
    }
    return html;
  }

  function resultLine(S, m) {
    const A = S.world.teams[m.a], B = S.world.teams[m.b];
    const me = m.a === S.pl.teamId || m.b === S.pl.teamId;
    const r = m.res;
    return `<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--line2);${me ? 'background:rgba(200,155,60,.08)' : ''}">
      <div class="team-cell" style="flex:1">${teamLogo(A, 22)}<span class="nm ${r && r.winner === m.a ? 'gold' : ''}">${esc(A.short)}</span></div>
      <span class="num">${r ? `${r.sa} - ${r.sb}` : 'vs'}</span>
      <div class="team-cell" style="flex:1;justify-content:flex-end"><span class="nm ${r && r.winner === m.b ? 'gold' : ''}">${esc(B.short)}</span>${teamLogo(B, 22)}</div></div>`;
  }

  function bracketHtml(S, rounds) {
    const names = rounds.length === 3 ? ['Cuartos', 'Semifinales', 'Final'] : [];
    return `<div class="bracket">${rounds.map((ms, i) => `<div class="col"><span class="small muted">${names[i] || ''}</span>${(ms.length ? ms : [null]).map((m) => {
      if (!m) return '<div class="bm"><div class="ln muted">Por decidir</div><div class="ln muted">&nbsp;</div></div>';
      const line = (tid, sc) => `<div class="ln ${m.res && m.res.winner === tid ? 'w' : ''} ${tid === S.pl.teamId ? 'me' : ''}"><span class="team-cell">${teamLogo(S.world.teams[tid], 20)}<span class="nm">${esc(S.world.teams[tid].short)}</span></span><span class="num">${m.res ? sc : ''}</span></div>`;
      return `<div class="bm">${line(m.a, m.res && m.res.sa)}${line(m.b, m.res && m.res.sb)}</div>`;
    }).join('')}</div>`).join('')}</div>`;
  }

  // ----- Mercado -----
  function tabMercado() {
    const S = G.S;
    const offers = S.offers.map((o) => offerCard(S, o)).join('');
    let html = `<div class="panel"><div class="panel-h"><h2>Ofertas recibidas</h2>${S.amateur ? '' : `<span class="badge ${Season.isWindowOpen(S) ? 'win' : 'loss'}">${Season.isWindowOpen(S) ? 'Mercado abierto' : 'Mercado cerrado'}</span>`}</div>
      ${offers ? `<div class="grid g2">${offers}</div>` : `<p class="muted">${S.amateur ? scoutHint(S) : 'No tienes ofertas ahora mismo. El mercado abre en pretemporada, durante el MSI y tras los Worlds. Si juegas bien, los equipos vendrán a por ti.'}</p>`}</div>`;
    if (S.amateur) return html;
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
      <div class="row" style="margin:8px 0">${o.renewal ? '<span class="badge blue">Renovación</span>' : ''}${o.academy ? '<span class="badge gold">Academia</span>' : ''}<span class="badge">${o.years} año${o.years > 1 ? 's' : ''}</span><span class="badge">Caduca en ${Math.max(1, o.expires - S.turn)} ${S.amateur ? 'mes(es)' : 'semana(s)'}</span></div>
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
      <div class="panel"><div class="panel-h"><h2>Patrocinadores · ${pl.sponsors.length}/${P.maxSponsors(S)}</h2></div>
        ${pl.sponsors.map((s) => `<div class="attr" style="grid-template-columns:1fr auto auto"><span><b style="color:var(--bright)">${esc(s.name)}</b> <span class="small muted">${esc(s.kind)} · ${s.splits} split(s)</span></span><span class="num gold">${U.money(s.pay)}/sem</span><span class="badge ${s.done >= s.promos ? 'win' : 'loss'}">${s.done}/${s.promos} acciones</span></div>`).join('') || '<p class="muted">Sin patrocinadores todavía.</p>'}
      </div>
      <div class="panel"><div class="panel-h"><h2>Ofertas de marcas</h2></div>
        ${S.sponsorOffers.map((o) => `<div class="panel" style="background:var(--panel2);margin-bottom:10px"><div class="row between"><div><b style="color:var(--bright)">${esc(o.name)}</b><div class="small muted">${esc(o.kind)}</div></div><span class="num gold">${U.money(o.pay)} / semana</span></div>
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
        </div></div>
      <div class="grid g2">
        <div class="panel"><div class="panel-h"><h2>Títulos</h2></div>${pl.titles.length ? pl.titles.slice().reverse().map((t) => `<div class="attr" style="grid-template-columns:auto 1fr">${ICON.star.replace('<svg', '<svg width="16" height="16"')}<span><b class="gold">${esc(t.name)}</b></span></div>`).join('') : '<p class="muted">Todavía ninguno.</p>'}
          <h3 style="margin:16px 0 8px">Premios individuales</h3>${pl.awards.length ? pl.awards.slice().reverse().map((a) => `<div class="small" style="padding:4px 0">${esc(a.name)}</div>`).join('') : '<p class="muted small">Ninguno todavía.</p>'}</div>
        <div class="panel"><div class="panel-h"><h2>Campeones más jugados</h2></div>${topChamps.length ? `<div class="row">${topChamps.map(([id, n]) => `<div style="text-align:center">${champImg(id, 44)}<div class="small num">${n}</div></div>`).join('')}</div>` : '<p class="muted">Sin partidas profesionales todavía.</p>'}</div>
      </div>
      <div class="panel"><div class="panel-h"><h2>Por temporada</h2></div>${seasons.length ? `<div class="tbl-wrap"><table><thead><tr><th>Competición</th><th>Equipo</th><th class="r">Part.</th><th class="r">V-D</th><th class="r">KDA</th><th class="r">CS/min</th><th class="r">Nota</th><th class="r">MVP</th><th class="r">Puesto</th></tr></thead><tbody>${seasons.map(([k, s]) => `<tr><td>${esc(k)}</td><td>${esc(s.team)}</td><td class="r num">${s.g}</td><td class="r num">${s.w}-${s.g - s.w}</td><td class="r num">${s.d ? ((s.k + s.a) / s.d).toFixed(1) : '—'}</td><td class="r num">${s.g ? (s.cs / s.g).toFixed(1) : '—'}</td><td class="r num">${s.g ? (s.r / s.g).toFixed(1) : '—'}</td><td class="r num">${s.mvp}</td><td class="r num">${s.place ? s.place + 'º' : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Aún no has jugado como profesional.</p>'}</div>
      <div class="panel"><div class="panel-h"><h2>Historia</h2></div><div class="timeline">${pl.history.slice().reverse().map((h) => `<div><b>${h.year}</b>${esc(h.text)}</div>`).join('') || '<p class="muted">Tu historia empieza ahora.</p>'}</div></div>
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
        ${G.confirmNew ? `<div class="alert red">Se perderá la partida actual si no la has exportado. ¿Seguro?</div><div class="row" style="margin-top:10px"><button class="btn danger" data-act="newConfirm">Sí, empezar de nuevo</button><button class="btn" data-act="newCancel">Cancelar</button></div>` : '<button class="btn danger" data-act="newAsk">Empezar una carrera nueva</button>'}
      </div>
      <div class="panel"><div class="panel-h"><h2>Datos</h2></div><p class="small">Parche de iconos de Riot: ${esc(D.champVersion)} · ${Object.keys(D.champions).length} campeones · ${S.world ? Object.keys(S.world.teams).length + ' equipos' : ''}</p></div>
    </div>`;
  }

  function importForm() {
    return `<p class="small">Elige un archivo de partida o pega el texto exportado.</p>
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
        <div class="timeline" style="margin-top:16px">${pl.history.map((h) => `<div><b>${h.year}</b>${esc(h.text)}</div>`).join('')}</div>
        <div class="row" style="margin-top:16px;justify-content:center"><button class="btn primary lg" data-act="newConfirm">Nueva carrera</button></div></div>
      ${hof.length ? `<section class="panel" style="max-width:900px;margin:24px auto 0"><h2>Salón de la fama</h2>${hofTable(hof)}</section>` : ''}</div>`;
  }

  // ---------- Modales ----------
  function reportModal(rep) {
    const S = G.S;
    return () => {
      let h = `<h2>${esc(rep.label)}</h2><p class="small muted" style="margin:0 0 14px">${esc(rep.date)}</p>`;
      const u = rep.user;
      if (u) {
        const A = S.world.teams[u.a], B = S.world.teams[u.b];
        const won = u.winner === S.pl.teamId;
        h += `<div class="match"><div class="side">${teamLogo(A, 56)}<span class="nm">${esc(A.short)}</span></div><div class="side"><span class="score">${u.sa} - ${u.sb}</span><span class="badge ${won ? 'win' : 'loss'}">${won ? 'Victoria' : 'Derrota'}</span></div><div class="side">${teamLogo(B, 56)}<span class="nm">${esc(B.short)}</span></div></div>
          <div style="margin-top:10px">${u.games.map((g, i) => `<div class="game-line">${champImg(g.champ, 40)}<div><b style="color:var(--bright)">Partida ${i + 1}</b> <span class="badge ${g.win ? 'win' : 'loss'}">${g.win ? 'V' : 'D'}</span><div class="small muted">vs ${esc(g.opp)}${g.oppChamp ? ' (' + esc(D.champName(g.oppChamp)) + ')' : ''}</div></div><span class="num">${g.k}/${g.d}/${g.a}</span><span class="num hide-s">${g.cs} CS/m</span><span class="ovr sm ${g.rating >= 8 ? '' : ''}">${g.rating.toFixed(1)}</span></div>`).join('')}</div>
          <div class="row" style="margin-top:10px">${u.mvp ? '<span class="badge gold">MVP de la serie</span>' : ''}<span class="small">+${U.num(u.fans || 0)} seguidores</span></div>`;
      } else if (!S.amateur) {
        h += '<p class="muted">Sin partido para ti esta semana.</p>';
      }
      if (rep.events.length) h += `<h3 style="margin:16px 0 6px">Tu semana</h3>${rep.events.map((e) => `<div class="alert blue" style="margin-bottom:6px">${esc(e)}</div>`).join('')}`;
      if (rep.headlines.length) h += `<h3 style="margin:16px 0 6px">Titulares</h3><div class="feed">${rep.headlines.map((x) => `<div>${esc(x)}</div>`).join('')}</div>`;
      h += `<p class="small muted" style="margin-top:12px">Ingresos: <span class="good">${U.money(rep.income)}</span> · Gastos: <span class="bad">${U.money(rep.costs)}</span></p>`;
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
    continue: () => { G.S = RC.migrate(RC.loadSave()); G.tab = 'inicio'; RC.render(); },
    newMode: (d) => { G.create = { mode: d.mode, name: '', nation: 'ES', role: 'Mid', style: 'estratega', champs: [] }; RC.render(); },
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
      const wasAmateur = G.S.amateur;
      const rep = P.advance(G.S);
      RC.save();
      if (!G.S.over) G.modal = reportModal(rep);
      if (wasAmateur && !G.S.amateur) G.tab = 'equipo';
      RC.render();
    },
    closeModal: () => { G.modal = null; RC.render(); },
    closeModalBg: (d, el, ev) => { if (ev.target === el) { G.modal = null; RC.render(); } },
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
    newAsk: () => { G.confirmNew = true; RC.render(); },
    newCancel: () => { G.confirmNew = false; RC.render(); },
    newConfirm: () => { RC.clearSave(); G.S = null; G.confirmNew = false; G.modal = null; G.create = null; RC.render(); },
  };

  function showExportText(txt) {
    G.modal = () => `<h2>Tu partida</h2><p class="small">Selecciona todo el texto y guárdalo en un archivo.</p><textarea class="input" rows="8" style="width:100%" readonly onclick="this.select()">${esc(txt)}</textarea><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="closeModal">Cerrar</button></div>`;
    RC.render();
  }

  function doImport(text) {
    try {
      const S = JSON.parse(text);
      if (!S || !S.pl || !S.cal) throw new Error('formato');
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
    if (S && !S.amateur && S.world && S.cal) Season.prepareTurn(S);
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
      if (b === 'compLeague') G.compLeague = el.value;
      if (b === 'marketLeague') G.marketLeague = el.value;
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
      if (ev.key === 'Escape' && G.modal) { G.modal = null; RC.render(); }
    });
  };
})(window.RC);
