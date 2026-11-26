/* Tu carrera: atributos, acciones, economía, contratos, patrocinadores y eventos. */
(function (RC) {
  const { U, C, D, W } = RC;
  const P = {};
  const TURNS_PRO = 51;

  // ---------- Cálculos básicos ----------
  P.sub = (S) => {
    const a = S.pl.attrs;
    return {
      mech: 0.6 * a.mecanicas + 0.4 * a.farmeo,
      macro: 0.6 * a.macro + 0.4 * a.vision,
      ment: 0.6 * a.mentalidad + 0.4 * a.comunicacion,
    };
  };
  P.ovr = (S) => W.ovr(P.sub(S));
  P.gearLevel = (S, id) => S.pl.gear[id] || 0;
  P.luck = (S) => U.sum(C.GEAR.map((g) => (g.luck || 0) * P.gearLevel(S, g.id))) + (S.pl.luckBonus || 0);
  P.hasStaff = (S, id) => !!S.pl.staff[id];
  P.actionsPerTurn = (S) => 4 + (P.hasStaff(S, 'coach') ? 1 : 0);
  P.actionsLeft = (S) => P.actionsPerTurn(S) - S.pl.actionsUsed;
  P.nation = (S) => C.NATIONS.find((n) => n.id === S.pl.nation) || C.NATIONS[0];
  P.fame = (S) => C.FAME.slice().reverse().find((f) => S.pl.fans >= f.min);
  P.team = (S) => (S.pl.teamId ? S.world.teams[S.pl.teamId] : null);
  P.isForeign = (S, lg) => C.LEAGUE_ZONE[lg] !== P.nation(S).zone;
  P.leagueReq = (S, lg) => C.LEAGUES[lg].req + (P.isForeign(S, lg) ? C.FOREIGN_EXTRA[lg] || 0 : 0) - (P.hasStaff(S, 'agente') ? 1 : 0);
  P.gearMatch = (S) => U.sum(C.GEAR.map((g) => g.match * P.gearLevel(S, g.id))) * 0.2;
  P.meta = (S, champ) => (S.patch && S.patch.meta[champ]) || 0;
  P.mastery = (S, champ) => S.pl.mastery[champ] || 0;
  P.champFactor = (S, champ) => (champ ? (P.mastery(S, champ) - 50) / 15 + P.meta(S, champ) * 0.8 : -4);

  P.ageMult = (age) => (age <= 13 ? 1.4 : age <= 17 ? 1.3 : age <= 21 ? 1.1 : age <= 24 ? 1.0 : age <= 27 ? 0.8 : age <= 29 ? 0.6 : 0.4);

  P.matchEff = function (S, champ) {
    const pl = S.pl;
    let e = P.ovr(S) + P.gearMatch(S) + P.champFactor(S, champ) + (pl.morale - 50) / 25;
    if (pl.energy < 30) e -= (30 - pl.energy) / 10;
    return e;
  };

  P.draftChamp = function (S) {
    const pool = S.pl.pool.length ? S.pl.pool : D.champsForRole(S.pl.role).slice(0, 3);
    const scored = pool.map((c) => ({ c, s: P.mastery(S, c) / 12 + P.meta(S, c) * 0.8 + U.gauss() * 0.5 })).sort((a, b) => b.s - a.s);
    if (scored.length > 1 && U.chance(0.2)) return scored[1].c; // baneado o counter
    return scored[0].c;
  };

  // ---------- Rango de SoloQ ----------
  P.rankInfo = function (lp) {
    if (lp < 2800) {
      const t = C.TIERS[Math.floor(lp / 400)];
      const div = 4 - Math.floor((lp % 400) / 100);
      return { tier: t.id, name: `${t.name} ${['I', 'II', 'III', 'IV'][div - 1]}`, lp: lp % 100, exp: t.exp + (4 - div) * ((t.id === 'diamond' ? 5 : 6) / 4) };
    }
    const x = lp - 2800;
    const a = C.APEX.slice().reverse().find((ap) => x >= ap.from);
    return { tier: a.id, name: a.name, lp: x, exp: a.exp + Math.min(4, x / 400) };
  };

  // ---------- Creación ----------
  P.newGame = function (o) {
    const kid = o.mode === 'kid';
    const base = kid ? 38 : 68;
    const attrs = {};
    for (const a of C.ATTRS) attrs[a.id] = U.round1(base + U.rand(-2.5, 2.5));
    const st = C.STYLES.find((s) => s.id === o.style);
    if (st) attrs[st.attr] += 3;
    const mastery = {};
    o.champs.forEach((c, i) => (mastery[c] = kid ? 35 - i * 4 : 62 - i * 4));
    const year = kid ? 2018 : 2026;
    const S = {
      v: 1, id: U.uid(), mode: o.mode, amateur: kid, year, turn: 0, startYear: year,
      cal: RC.Season.buildCalendar(kid), over: false,
      pl: {
        name: o.name.trim(), nation: o.nation, role: o.role, style: o.style, age: kid ? 10 : 16,
        attrs, energy: 100, morale: 65, money: kid ? 50 : 1500, fans: kid ? 10 : 400, lp: kid ? 150 : 2450,
        pool: o.champs.slice(), mastery, gear: {}, staff: {}, teamId: null, contract: null,
        actionsUsed: 0, freeTurns: 0, streams: 0, sponsors: [], promoUsed: 0,
        stats: { career: blank(), seasons: {}, champs: {} }, titles: [], awards: [], history: [], peakOvr: 0,
        selfOffersTurn: -1, selfOffersCount: 0, earned: 0,
      },
      world: kid ? null : W.init(), comp: null, patch: null, news: [], offers: [], sponsorOffers: [], lastReport: null, startOffers: null,
    };
    S.pl.peakOvr = P.ovr(S);
    P.newPatch(S, true);
    if (!kid) {
      RC.Season.newComp(S);
      S.startOffers = P.academyOffers(S);
    } else {
      news(S, `${S.pl.name} empieza a jugar a League of Legends con 10 años. Objetivo: llegar a una academia.`, 'good');
    }
    return S;
  };

  function blank() { return { g: 0, w: 0, k: 0, d: 0, a: 0, cs: 0, r: 0, mvp: 0 }; }

  function news(S, text, kind = '') {
    S.news.unshift({ when: RC.Season.turnDate(S).text, text, kind });
    if (S.news.length > 80) S.news.length = 80;
  }
  P.news = news;

  // Ofertas de academia para empezar (modo 16 años) o al dar el salto (modo 10 años)
  P.academyOffers = function (S) {
    if (!S.world) S.world = W.init();
    const home = P.nation(S).home;
    const pool = W.leagueTeams(S, home).sort((a, b) => W.teamAvgOvr(S, a) - W.teamAvgOvr(S, b));
    const picks = U.shuffle(pool.slice(0, Math.max(4, Math.ceil(pool.length * 0.6)))).slice(0, 3);
    const L = C.LEAGUES[home];
    return picks.map((t) => ({ teamId: t.id, salary: Math.round((L.salary * U.rand(0.35, 0.55)) / 500) * 500, years: 2 }));
  };

  // ---------- Equipo y contratos ----------
  P.joinTeam = function (S, tid, contract) {
    const old = P.team(S);
    const team = S.world.teams[tid];
    const role = S.pl.role;
    const displacedId = team.roster[role];
    const displaced = displacedId && displacedId !== 'USER' ? S.world.players[displacedId] : null;
    if (old && old.id !== tid) {
      old.roster[role] = null;
      if (displaced) { old.roster[role] = displaced.id; displaced.team = old.id; }
      else fillSlot(S, old);
    } else if (displaced) {
      displaced.team = null;
      // busca hueco en una liga inferior
      const lower = Object.values(S.world.teams).filter((t) => C.LEAGUES[t.league].tier > C.LEAGUES[team.league].tier && t.roster[role] !== 'USER');
      const dest = lower.length ? U.pick(lower) : null;
      if (dest && U.chance(0.6)) {
        const out = S.world.players[dest.roster[role]];
        if (out) out.team = null;
        dest.roster[role] = displaced.id;
        displaced.team = dest.id;
      }
    }
    team.roster[role] = 'USER';
    S.pl.teamId = tid;
    S.pl.contract = contract;
    S.pl.freeTurns = 0;
    if (displaced) news(S, `${displaced.name} deja su puesto en ${team.name} tras tu llegada.`);
  };

  function fillSlot(S, team) {
    const role = S.pl.role;
    const L = C.LEAGUES[team.league];
    const fa = Object.values(S.world.players).filter((p) => !p.team && p.role === role).sort((a, b) => W.ovr(b) - W.ovr(a))[0];
    const p = fa && W.ovr(fa) >= L.req - 6 ? fa : W.newRookie(S.world, role, team.league);
    p.team = team.id;
    team.roster[role] = p.id;
  }

  P.leaveTeam = function (S, reason) {
    const team = P.team(S);
    if (!team) return;
    fillSlot(S, team);
    news(S, reason || `Tu contrato con ${team.name} termina. Eres agente libre.`, 'bad');
    S.pl.history.push({ year: S.year, text: `Sale de ${team.name}.` });
    S.pl.teamId = null;
    S.pl.contract = null;
  };

  // Paso de amateur a profesional (modo 10 años)
  P.enterPro = function (S, offer) {
    const month = S.turn;
    S.amateur = false;
    if (!S.world) S.world = W.init();
    S.cal = RC.Season.buildCalendar(false);
    RC.Season.newComp(S);
    // Alcanza la fecha actual simulando el resto del mundo sin ti
    const target = U.clamp(Math.round((month / 12) * TURNS_PRO), 0, TURNS_PRO - 5);
    S.turn = 0;
    const saved = S.pl.teamId;
    S.pl.teamId = null;
    for (let i = 0; i < target; i++) {
      const t = S.cal[S.turn];
      if (t.kind === 'reg' && t.round === 0) P.newPatch(S);
      RC.Season.playTurn(S);
      S.turn++;
    }
    S.pl.teamId = saved;
    const t = S.cal[S.turn];
    const endYear = S.year + offer.years - (t.phase === 'off' ? 0 : 1);
    P.joinTeam(S, offer.teamId, { salary: offer.salary, endYear });
    S.offers = [];
    const team = P.team(S);
    news(S, `¡Firmas tu primer contrato profesional con ${team.name}! Con ${S.pl.age} años das el salto.`, 'good');
    S.pl.history.push({ year: S.year, text: `Primer contrato profesional: ${team.name} (${C.LEAGUES[team.league].name}) con ${S.pl.age} años.` });
  };

  P.startPro = function (S, offer) {
    P.joinTeam(S, offer.teamId, { salary: offer.salary, endYear: S.year + offer.years - 1 });
    S.startOffers = null;
    const team = P.team(S);
    news(S, `Firmas con ${team.name} (${C.LEAGUES[team.league].name}). Empieza tu carrera profesional.`, 'good');
    S.pl.history.push({ year: S.year, text: `Empieza su carrera en ${team.name} con 16 años.` });
  };

  // ---------- Acciones ----------
  P.availableActions = function (S) {
    return C.ACTIONS.filter((a) => {
      if (a.kidOnly && !S.amateur) return false;
      if (a.needsTeam && !S.pl.teamId) return false;
      if (a.needsPromo && !P.pendingPromos(S)) return false;
      return true;
    });
  };

  P.pendingPromos = (S) => U.sum(S.pl.sponsors.map((s) => Math.max(0, s.promos - s.done)));

  P.energyCost = function (S, a) {
    if (a.energy < 0) return a.energy;
    return Math.round(a.energy * (1 - 0.06 * P.gearLevel(S, 'silla')));
  };

  P.trainGain = function (S, attr, mult = 1) {
    const pl = S.pl;
    const v = pl.attrs[attr];
    let g = 0.12 * P.ageMult(pl.age) * (S.amateur ? 2.2 : 1);
    let gear = 1 + 0.03 * P.gearLevel(S, 'pc');
    for (const it of C.GEAR) if (it.boost[attr]) gear += it.boost[attr] * P.gearLevel(S, it.id);
    g *= gear;
    if (P.hasStaff(S, 'coach')) g *= 1.1;
    if (attr === 'mentalidad' && P.hasStaff(S, 'psico')) g *= 1.25;
    if ((attr === 'macro' || attr === 'vision') && P.hasStaff(S, 'analista')) g *= 1.25;
    const em = pl.energy >= 40 ? 1 : 0.5 + pl.energy / 80;
    g *= em * Math.max(0.03, Math.pow(Math.max(0, 100 - v) / 35, 1.3)) * U.rand(0.75, 1.25) * mult;
    pl.attrs[attr] = U.round1(Math.min(99, v + g));
    return g;
  };

  P.doAction = function (S, id, arg) {
    const pl = S.pl;
    if (S.over) return { ok: false, msg: 'La carrera ha terminado.' };
    if (P.actionsLeft(S) <= 0) return { ok: false, msg: 'No te quedan acciones esta semana.' };
    const a = C.ACTIONS.find((x) => x.id === id);
    if (!a) return { ok: false, msg: 'Acción desconocida.' };
    const cost = P.energyCost(S, a);
    if (cost > 0 && pl.energy < cost) return { ok: false, msg: 'Estás agotado. Descansa antes de entrenar.' };
    let msg = '';
    if (a.stat) {
      const g = P.trainGain(S, a.stat);
      msg = `${C.ATTR_NAME[a.stat]} +${g.toFixed(2)}`;
      if (id === 'scrim') {
        const g2 = P.trainGain(S, 'macro', 0.4);
        msg += ` · Macro +${g2.toFixed(2)}`;
      }
    } else if (id === 'champ') {
      const champ = arg && pl.pool.includes(arg) ? arg : pl.pool[0];
      if (!champ) return { ok: false, msg: 'Añade campeones a tu pool primero.' };
      const m = P.mastery(S, champ);
      let g = Math.max(0.6, 9 * (100 - m) / 60) * (P.hasStaff(S, 'champcoach') ? 1.4 : 1) * U.rand(0.8, 1.2) * (pl.energy >= 40 ? 1 : 0.6);
      pl.mastery[champ] = U.round1(Math.min(100, m + g));
      msg = `Maestría con ${D.champName(champ)} +${g.toFixed(1)}`;
    } else if (id === 'soloq') {
      msg = P.playSoloQ(S);
    } else if (id === 'stream') {
      const cm = P.hasStaff(S, 'cm') ? 1.4 : 1;
      const fans = Math.round((15 + P.ovr(S) * 0.5 + Math.sqrt(pl.fans) * 0.6) * U.rand(0.6, 1.4) * cm * (S.amateur ? 0.6 : 1) * (1 + P.luck(S) / 50));
      const money = Math.round(((S.amateur ? 10 : 30) + Math.min(2500, Math.sqrt(pl.fans) * 1.2) * (S.amateur ? 0.4 : 1)) * U.rand(0.8, 1.2));
      pl.fans += fans;
      pl.money += money;
      pl.earned += money;
      pl.morale = Math.min(100, pl.morale + 3);
      pl.streams++;
      msg = `+${U.num(fans)} seguidores · +${U.money(money)}`;
      if (U.chance(0.06 + P.luck(S) / 200)) {
        const extra = Math.round(Math.min(pl.fans * U.rand(0.02, 0.05), 40000) + 200);
        pl.fans += extra;
        msg += ` · ¡Clip viral! +${U.num(extra)}`;
      }
    } else if (id === 'rest') {
      pl.energy = Math.min(100, pl.energy + 35);
      pl.morale = Math.min(100, pl.morale + 8);
      msg = 'Energía +35 · Moral +8';
    } else if (id === 'promo') {
      const sp = pl.sponsors.find((s) => s.done < s.promos);
      if (!sp) return { ok: false, msg: 'No tienes acciones publicitarias pendientes.' };
      sp.done++;
      const fans = Math.round(Math.sqrt(pl.fans) * 2 + 50);
      pl.fans += fans;
      msg = `Cumples con ${sp.name} · +${U.num(fans)} seguidores`;
    }
    if (cost > 0) pl.energy = Math.max(0, pl.energy - cost);
    pl.actionsUsed++;
    pl.peakOvr = Math.max(pl.peakOvr, P.ovr(S));
    return { ok: true, msg: a.name + ': ' + msg };
  };

  P.playSoloQ = function (S) {
    const pl = S.pl;
    const games = S.amateur ? 10 : 4;
    let w = 0;
    const before = pl.lp;
    for (let i = 0; i < games; i++) {
      const rk = P.rankInfo(pl.lp);
      const eff = P.ovr(S) + P.gearMatch(S) * 0.8 + (pl.morale - 50) / 30 + U.gauss() * 3 + P.luck(S) / 10;
      if (Math.random() < U.logistic((eff - rk.exp) / 4)) { w++; pl.lp += U.randInt(18, 24); }
      else pl.lp = Math.max(0, pl.lp - U.randInt(15, 21));
    }
    for (const a of C.ATTRS) P.trainGain(S, a.id, S.amateur ? 0.3 : 0.25);
    if (pl.pool.length) {
      const c = U.pick(pl.pool);
      pl.mastery[c] = U.round1(Math.min(100, P.mastery(S, c) + U.rand(1, 3)));
    }
    const fanGain = Math.round((pl.lp >= 2800 ? 25 : 4) * U.rand(0.5, 1.5));
    pl.fans += fanGain;
    const diff = pl.lp - before;
    return `${w}V ${games - w}D · ${diff >= 0 ? '+' : ''}${diff} LP · ${P.rankInfo(pl.lp).name}`;
  };

  // ---------- Pool de campeones ----------
  P.maxPool = 6;
  P.addChamp = function (S, c) {
    if (S.pl.pool.includes(c)) return;
    if (S.pl.pool.length >= P.maxPool) return { ok: false, msg: `Tu pool tiene un máximo de ${P.maxPool} campeones.` };
    S.pl.pool.push(c);
    if (!S.pl.mastery[c]) S.pl.mastery[c] = 10;
    return { ok: true };
  };
  P.removeChamp = function (S, c) { S.pl.pool = S.pl.pool.filter((x) => x !== c); };

  // ---------- Parches ----------
  P.newPatch = function (S, first) {
    const old = (S.patch && S.patch.meta) || {};
    const meta = {};
    const ids = Object.keys(D.champions);
    for (const id of ids) {
      const r = Math.random();
      const shock = r < 0.08 ? -2 : r < 0.25 ? -1 : r < 0.75 ? 0 : r < 0.92 ? 1 : 2;
      meta[id] = U.clamp(Math.round((old[id] || 0) * 0.45 + shock), -2, 2);
    }
    const n = S.patch ? S.patch.n + 1 : 1;
    const buffs = ids.filter((c) => meta[c] > (old[c] || 0)).sort((a, b) => meta[b] - meta[a]);
    const nerfs = ids.filter((c) => meta[c] < (old[c] || 0)).sort((a, b) => meta[a] - meta[b]);
    S.patch = { n, ver: `${S.year % 100}.${n}`, meta, buffs: buffs.slice(0, 10), nerfs: nerfs.slice(0, 10) };
    if (!first) {
      news(S, `Nuevo parche ${S.patch.ver}: cambios en el meta. Revisa tu pool de campeones.`);
      const hit = S.pl.pool.filter((c) => meta[c] <= -1 && (old[c] || 0) > meta[c]);
      if (hit.length) news(S, `El parche ${S.patch.ver} debilita a ${hit.map(D.champName).join(', ')}.`, 'bad');
    }
  };
  P.tierOf = (v) => ({ 2: 'S', 1: 'A', 0: 'B', '-1': 'C', '-2': 'D' }[v]);

  // ---------- Partidos ----------
  P.splitKey = (S, ctx) => `${S.year} ${ctx && ctx.intl ? ctx.comp : RC.Season.SPLIT_NAME[S.cal[S.turn].phase] || ''}`;

  P.recordSeries = function (S, res, ctx) {
    const pl = S.pl;
    const key = P.splitKey(S, ctx);
    const team = P.team(S);
    const ss = (pl.stats.seasons[key] = pl.stats.seasons[key] || Object.assign(blank(), { team: team ? team.name : '', league: ctx.comp }));
    const won = res.winner === pl.teamId;
    let bestMvp = null;
    for (const g of res.games) {
      for (const st of [ss, pl.stats.career]) {
        st.g++; st.w += g.win ? 1 : 0; st.k += g.k; st.d += g.d; st.a += g.a; st.cs += g.cs; st.r += g.rating;
      }
      pl.stats.champs[g.champ] = (pl.stats.champs[g.champ] || 0) + 1;
      pl.mastery[g.champ] = U.round1(Math.min(100, P.mastery(S, g.champ) + 0.8));
      for (const a of C.ATTRS) pl.attrs[a.id] = U.round1(Math.min(99, pl.attrs[a.id] + 0.015 * P.ageMult(pl.age) * Math.max(0.1, (100 - pl.attrs[a.id]) / 30)));
      pl.energy = Math.max(0, pl.energy - 5);
      if (!bestMvp || g.rating > bestMvp.rating) bestMvp = g;
    }
    const avgR = U.avg(res.games.map((g) => g.rating));
    res.mvp = won && avgR >= 8.0;
    if (res.mvp) { ss.mvp++; pl.stats.career.mvp++; }
    const tierFans = [0, 1200, 800, 400, 220, 120][C.LEAGUES[team ? team.league : 'LES']?.tier || 5];
    const intlMult = ctx.intl ? 3 : ctx.playoff ? 1.6 : 1;
    const fans = Math.round((won ? tierFans : tierFans * 0.25) * (avgR / 7) * intlMult * (res.mvp ? 2 : 1) * U.rand(0.8, 1.2));
    pl.fans += fans;
    res.fans = fans;
    let dm = won ? 4 : -5;
    if (!won && P.hasStaff(S, 'psico')) dm = -2.5;
    if (res.mvp) dm += 4;
    pl.morale = U.clamp(pl.morale + dm, 0, 100);
  };

  P.addTitle = function (S, name, fans, prize) {
    S.pl.titles.push({ year: S.year, name });
    S.pl.fans += fans;
    S.pl.money += prize;
    S.pl.earned += prize;
    S.pl.morale = Math.min(100, S.pl.morale + 15);
    news(S, `¡CAMPEONES! Ganas ${name}. +${U.money(prize)} en premios.`, 'good');
    S.pl.history.push({ year: S.year, text: `Campeón: ${name}.` });
  };

  P.onSplitEnd = function (S, phase, lg, place) {
    const pl = S.pl;
    const L = C.LEAGUES[lg];
    const key = `${S.year} ${RC.Season.SPLIT_NAME[phase]}`;
    const st = pl.stats.seasons[key];
    const avg = st && st.g ? st.r / st.g : 0;
    const team = P.team(S);
    const splitName = `${L.name} ${RC.Season.SPLIT_NAME[phase].replace(' Split', '')} ${S.year}`;
    if (st) st.place = place;
    if (place === 1) P.addTitle(S, splitName, Math.round(25000 / L.tier), Math.round(L.salary * 0.15));
    else if (place === 2) { pl.money += Math.round(L.salary * 0.05); news(S, `Subcampeones de la ${L.name}.`); }
    if (st && st.g >= 6) {
      const mvpChance = U.clamp((avg - 7.4) * 0.5 + (place <= 2 ? 0.15 : 0) - (place > 4 ? 0.3 : 0), 0, 0.7);
      if (U.chance(mvpChance)) {
        pl.awards.push({ year: S.year, name: `MVP de la ${splitName}` });
        pl.fans += Math.round(15000 / L.tier);
        news(S, `Te nombran MVP de la ${splitName}.`, 'good');
      } else if (avg >= 7.1) {
        pl.awards.push({ year: S.year, name: `Equipo ideal de la ${splitName}` });
        news(S, `Entras en el equipo ideal de la ${splitName}.`, 'good');
      }
    }
    pl.history.push({ year: S.year, text: `${RC.Season.SPLIT_NAME[phase]}: ${place}º en la ${L.name} con ${team ? team.name : '—'}${st && st.g ? ` · nota media ${avg.toFixed(1)}` : ''}.` });
  };

  // Revisión de patrocinadores al terminar cada split (o cada 4 meses en la etapa amateur)
  P.checkSponsors = function (S) {
    const pl = S.pl;
    for (const sp of pl.sponsors.slice()) {
      if (sp.done < sp.promos) {
        pl.sponsors = pl.sponsors.filter((x) => x !== sp);
        pl.fans = Math.round(pl.fans * 0.96);
        pl.morale = Math.max(0, pl.morale - 8);
        news(S, `${sp.name} cancela tu patrocinio: no cumpliste con las acciones publicitarias.`, 'bad');
      } else {
        sp.done = 0;
        sp.splits--;
        if (sp.splits <= 0) {
          pl.sponsors = pl.sponsors.filter((x) => x !== sp);
          news(S, `Termina tu contrato con ${sp.name}.`);
        }
      }
    }
    pl.streams = 0;
  };

  P.onIntlEnd = function (S, id, name, place) {
    const pl = S.pl;
    const nm = `${name} ${S.year}`;
    if (place === 1) P.addTitle(S, nm, id === 'worlds' ? 400000 : id === 'msi' ? 150000 : 30000, id === 'worlds' ? 150000 : id === 'msi' ? 60000 : 8000);
    else news(S, `${name}: terminas en ${place === 2 ? 'segunda posición' : place <= 4 ? 'semifinales' : place <= 8 ? 'cuartos de final' : 'fase de grupos'}.`, place <= 2 ? 'good' : '');
    pl.history.push({ year: S.year, text: `${nm}: ${place === 1 ? 'campeón' : place === 2 ? 'finalista' : place <= 4 ? 'semifinales' : place <= 8 ? 'cuartos' : 'fase de grupos'}.` });
    if (id === 'worlds' && place === 1) {
      const st = pl.stats.seasons[`${S.year} Worlds`];
      if (st && st.g && st.r / st.g >= 7.4 && U.chance(0.5)) {
        pl.awards.push({ year: S.year, name: `MVP de las Worlds ${S.year}` });
        news(S, `¡Eres el MVP de las Worlds ${S.year}!`, 'good');
      }
    }
  };

  // ---------- Mercado ----------
  P.salaryFor = function (S, lg) {
    const L = C.LEAGUES[lg];
    const o = P.ovr(S);
    const fameB = 1 + Math.min(0.4, S.pl.fans / 1000000);
    return L.salary * (0.55 + U.clamp((o - L.req) / 12, 0, 1.2)) * fameB;
  };

  P.makeOffer = function (S, tid, opts = {}) {
    const team = S.world.teams[tid];
    const base = P.salaryFor(S, team.league);
    const offered = Math.round((base * U.rand(0.8, 0.95)) / 500) * 500;
    const max = base * U.rand(1.1, 1.35) * (P.hasStaff(S, 'agente') ? 1.12 : 1);
    const offer = {
      id: U.uid(), teamId: tid, salary: Math.max(500, offered), max, years: opts.years || U.randInt(1, 3),
      attempts: 3, expires: S.turn + (opts.ttl || 3), renewal: !!opts.renewal, academy: !!opts.academy, year: S.year,
    };
    S.offers.push(offer);
    return offer;
  };

  P.wantsYou = function (S, team) {
    const role = S.pl.role;
    const pid = team.roster[role];
    if (pid === 'USER') return { ok: false, why: 'Ya juegas aquí.' };
    const cur = S.world.players[pid];
    const o = P.ovr(S);
    const req = P.leagueReq(S, team.league);
    if (o < req) return { ok: false, why: `Tu nivel (${o.toFixed(0)}) no llega al mínimo de la ${C.LEAGUES[team.league].name} (${req})${P.isForeign(S, team.league) && C.FOREIGN_EXTRA[team.league] ? ', con el extra por ser extranjero' : ''}.` };
    if (cur && W.ovr(cur) > o + 1) return { ok: false, why: `Su ${C.ROLE_ES[role]} titular, ${cur.name} (${W.ovr(cur).toFixed(0)}), es mejor que tú.` };
    return { ok: true };
  };

  P.genOffers = function (S, n) {
    if (!S.world || S.amateur) return;
    const cur = P.team(S);
    const curTier = cur ? C.LEAGUES[cur.league].tier : 9;
    const contractRunning = S.pl.contract && S.pl.contract.endYear > S.year;
    const cands = Object.values(S.world.teams).filter((t) => {
      if (cur && t.id === cur.id) return false;
      if (S.offers.some((o) => o.teamId === t.id)) return false;
      const L = C.LEAGUES[t.league];
      if (contractRunning && L.tier >= curTier) return false;
      return P.wantsYou(S, t).ok;
    });
    for (let i = 0; i < n && cands.length; i++) {
      const t = U.weighted(cands, (x) => 1 / C.LEAGUES[x.league].tier ** 1.5);
      cands.splice(cands.indexOf(t), 1);
      P.makeOffer(S, t.id);
      news(S, `Oferta recibida de ${t.name} (${C.LEAGUES[t.league].name}).`, 'good');
    }
  };

  P.offerSelf = function (S, tid) {
    if (S.pl.selfOffersTurn !== S.turn) { S.pl.selfOffersTurn = S.turn; S.pl.selfOffersCount = 0; }
    if (S.pl.selfOffersCount >= 2) return { ok: false, msg: 'Solo puedes ofrecerte a 2 equipos por semana.' };
    if (!RC.Season.isWindowOpen(S) && S.pl.teamId) return { ok: false, msg: 'El mercado está cerrado. Abre en pretemporada, durante el MSI y tras los Worlds.' };
    if (S.offers.some((o) => o.teamId === tid)) return { ok: false, msg: 'Ya tienes una oferta de este equipo.' };
    S.pl.selfOffersCount++;
    const team = S.world.teams[tid];
    const w = P.wantsYou(S, team);
    if (!w.ok) return { ok: false, msg: `${team.name} rechaza tu ofrecimiento. ${w.why}` };
    if (!U.chance(0.75 + P.luck(S) / 100)) return { ok: false, msg: `${team.name} prefiere esperar a otro jugador. Prueba más adelante.` };
    P.makeOffer(S, tid);
    return { ok: true, msg: `${team.name} está interesado y te envía una oferta.` };
  };

  P.negotiate = function (S, offerId, amount) {
    const o = S.offers.find((x) => x.id === offerId);
    if (!o) return { ok: false, msg: 'La oferta ya no existe.' };
    if (amount <= o.max) return P.acceptOffer(S, offerId, Math.round(amount));
    o.attempts--;
    if (o.attempts <= 0) {
      S.offers = S.offers.filter((x) => x !== o);
      return { ok: false, gone: true, msg: `${S.world.teams[o.teamId].name} retira la oferta.` };
    }
    return { ok: false, msg: amount > o.max * 1.15 ? 'Muy por encima de lo que pueden pagar.' : 'Se acercan, pero no llegan a esa cifra.' };
  };

  P.acceptOffer = function (S, offerId, salary) {
    const o = S.offers.find((x) => x.id === offerId);
    if (!o) return { ok: false, msg: 'La oferta ya no existe.' };
    const team = S.world.teams[o.teamId];
    const sal = salary || o.salary;
    if (S.amateur) {
      P.enterPro(S, Object.assign({}, o, { salary: sal }));
      return { ok: true, msg: `Firmado con ${team.name}.` };
    }
    const t = S.cal[S.turn];
    const endYear = S.year + o.years - (t && t.phase === 'off' ? 0 : 1);
    if (o.renewal) {
      S.pl.contract = { salary: sal, endYear };
      news(S, `Renuevas con ${team.name} hasta ${endYear} por ${U.money(sal)} al año.`, 'good');
    } else {
      const prev = P.team(S);
      P.joinTeam(S, o.teamId, { salary: sal, endYear });
      news(S, `¡Fichas por ${team.name} (${C.LEAGUES[team.league].name})! ${U.money(sal)} al año hasta ${endYear}.`, 'good');
      S.pl.history.push({ year: S.year, text: `Ficha por ${team.name} (${C.LEAGUES[team.league].name})${prev ? ` desde ${prev.name}` : ''}.` });
    }
    S.offers = S.offers.filter((x) => x.id !== offerId && !(x.renewal && !o.renewal));
    return { ok: true, msg: `Firmado con ${team.name}.` };
  };

  P.rejectOffer = function (S, offerId) { S.offers = S.offers.filter((x) => x.id !== offerId); };

  // ---------- Tienda y staff ----------
  P.buyGear = function (S, id) {
    const g = C.GEAR.find((x) => x.id === id);
    const lvl = P.gearLevel(S, id);
    if (lvl >= 5) return { ok: false, msg: 'Ya tienes el mejor modelo.' };
    const price = g.prices[lvl];
    if (S.pl.money < price) return { ok: false, msg: 'No tienes dinero suficiente.' };
    S.pl.money -= price;
    S.pl.gear[id] = lvl + 1;
    return { ok: true, msg: `Compras: ${g.levels[lvl]}.` };
  };

  P.staffCost = function (S, id) {
    const s = C.STAFF.find((x) => x.id === id);
    if (s.pct) return Math.max(100, Math.round(((S.pl.contract ? S.pl.contract.salary : 0) / TURNS_PRO) * s.pct));
    return s.cost * (S.amateur ? 4 : 1);
  };

  P.toggleStaff = function (S, id) {
    if (S.pl.staff[id]) {
      delete S.pl.staff[id];
      return { ok: true, msg: 'Contrato rescindido.' };
    }
    const cost = P.staffCost(S, id);
    if (S.pl.money < cost) return { ok: false, msg: 'Necesitas al menos una semana de sueldo en la cuenta.' };
    S.pl.staff[id] = true;
    return { ok: true, msg: 'Contratado.' };
  };

  // ---------- Patrocinadores ----------
  P.maxSponsors = (S) => 3 + (P.hasStaff(S, 'cm') ? 1 : 0);
  P.genSponsorOffers = function (S) {
    const pl = S.pl;
    if (pl.fans < 3000 || pl.sponsors.length >= P.maxSponsors(S)) return;
    const have = new Set(pl.sponsors.map((s) => s.name).concat(S.sponsorOffers.map((s) => s.name)));
    const free = C.SPONSOR_BRANDS.filter((b) => !have.has(b.name));
    const chance = 0.35 + (P.hasStaff(S, 'cm') ? 0.15 : 0) + (P.hasStaff(S, 'agente') ? 0.1 : 0);
    if (!free.length || !U.chance(chance)) return;
    const b = U.pick(free);
    const mult = P.hasStaff(S, 'agente') ? 1.15 : 1;
    const pay = Math.round(Math.min(3000, 40 + pl.fans * 0.002) * U.rand(0.8, 1.2) * mult / 10) * 10;
    S.sponsorOffers.push({ id: U.uid(), name: b.name, kind: b.kind, pay, promos: pay > 800 ? 2 : 1, splits: U.randInt(2, 3), expires: S.turn + 4 });
    news(S, `${b.name} quiere patrocinarte.`, 'good');
  };
  P.acceptSponsor = function (S, id) {
    const o = S.sponsorOffers.find((x) => x.id === id);
    if (!o) return;
    if (S.pl.sponsors.length >= P.maxSponsors(S)) return { ok: false, msg: 'Ya tienes el máximo de patrocinadores.' };
    S.pl.sponsors.push({ name: o.name, kind: o.kind, pay: o.pay, promos: o.promos, done: 0, splits: o.splits });
    S.sponsorOffers = S.sponsorOffers.filter((x) => x !== o);
    return { ok: true, msg: `Firmas con ${o.name}.` };
  };
  P.declineSponsor = function (S, id) { S.sponsorOffers = S.sponsorOffers.filter((x) => x.id !== id); };

  // ---------- Eventos aleatorios ----------
  const KID_EVENTS = [
    { w: 3, f: (S) => { S.pl.fans += 150 + U.randInt(0, 300); return 'Un streamer famoso te ve en SoloQ y te menciona en directo. Ganas seguidores.'; } },
    { w: 2, ok: (S) => P.gearLevel(S, 'raton') < 3, f: (S) => { S.pl.gear.raton = P.gearLevel(S, 'raton') + 1; return 'Tus padres te regalan un ratón nuevo por tu buen rendimiento en el cole.'; } },
    { w: 2, ok: (S) => P.gearLevel(S, 'pc') < 2, f: (S) => { S.pl.gear.pc = P.gearLevel(S, 'pc') + 1; return 'Por tu cumpleaños te mejoran el ordenador.'; } },
    { w: 3, f: (S) => { S.pl.money += 80; S.pl.fans += 60; S.pl.attrs.comunicacion = Math.min(99, S.pl.attrs.comunicacion + 1); return 'Ganas un torneo amateur online con tus amigos. +80 € y +1 Comunicación.'; } },
    { w: 2, f: (S) => { S.pl.energy = Math.max(0, S.pl.energy - 30); return 'Semana de exámenes: llegas cansado al ordenador (-30 energía).'; } },
    { w: 2, ok: (S) => S.pl.age >= 13, f: (S) => { S.pl.attrs.macro = Math.min(99, S.pl.attrs.macro + 1.5); S.pl.attrs.vision = Math.min(99, S.pl.attrs.vision + 1); return 'Haces dúo con un jugador profesional y te explica cómo piensa la partida. +1,5 Macro, +1 Visión.'; } },
    { w: 2, ok: (S) => S.turn >= 6 && S.turn <= 8, f: (S) => { for (const a of C.ATTRS) S.pl.attrs[a.id] = Math.min(99, S.pl.attrs[a.id] + 0.8); return 'Vacaciones de verano: horas y horas de práctica. +0,8 a todo.'; } },
    { w: 2, f: (S) => { S.pl.morale = Math.max(0, S.pl.morale - 15); return 'Una racha de derrotas te tiltea. -15 moral.'; } },
    { w: 1, f: (S) => { const n = 400 + Math.round(Math.min(S.pl.fans * 0.3, 5000)); S.pl.fans += n; return `Un clip tuyo se hace viral. +${U.num(n)} seguidores.`; } },
    { w: 2, ok: (S) => S.pl.age >= 13 && P.ovr(S) >= 58, f: (S) => { S.pl.attrs.mecanicas = Math.min(99, S.pl.attrs.mecanicas + 1.2); S.pl.luckBonus = (S.pl.luckBonus || 0) + 1; return 'Un ojeador de una academia se fija en tus partidas. +1,2 Mecánicas y +1 de suerte.'; } },
  ];
  const PRO_EVENTS = [
    { w: 3, f: (S) => { const n = Math.round(Math.min(S.pl.fans * 0.015, 30000) + 300); S.pl.fans += n; return `Una entrevista tuya da la vuelta a las redes. +${U.num(n)} seguidores.`; } },
    { w: 2, ok: (S) => S.pl.teamId, f: (S) => { for (const a of C.ATTRS) S.pl.attrs[a.id] = Math.min(99, S.pl.attrs[a.id] + 0.4); return 'El equipo organiza un bootcamp intensivo. +0,4 a todo.'; } },
    { w: 2, ok: (S) => S.pl.teamId, f: (S) => { S.pl.morale = Math.max(0, S.pl.morale - 10); return 'Discusión con un compañero en una scrim. -10 moral.'; } },
    { w: 1, ok: (S) => P.gearLevel(S, 'raton') < 5, f: (S) => { S.pl.gear.raton = P.gearLevel(S, 'raton') + 1; return 'Una marca de periféricos te regala su ratón de gama alta.'; } },
    { w: 2, f: (S) => { S.pl.morale = Math.min(100, S.pl.morale + 10); return 'Los fans te mandan mensajes de apoyo. +10 moral.'; } },
    { w: 1, f: (S) => { S.pl.energy = Math.max(0, S.pl.energy - 20); return 'Un viaje largo con jet lag te deja agotado (-20 energía).'; } },
  ];
  function randomEvent(S) {
    const list = (S.amateur ? KID_EVENTS : PRO_EVENTS).filter((e) => !e.ok || e.ok(S));
    const p = S.amateur ? 0.35 : 0.12;
    if (!U.chance(p + P.luck(S) / 200)) return null;
    const e = U.weighted(list, (x) => x.w);
    return e.f(S);
  }

  // ---------- Modo 10 años: ojeadores de academias ----------
  function kidScouting(S) {
    const pl = S.pl;
    if (S.offers.length || pl.age < 14) return;
    const o = P.ovr(S);
    const T = { 14: 64, 15: 61, 16: 58, 17: 54 }[pl.age];
    const rankReq = { 14: 2400, 15: 2200, 16: 2000, 17: 1600 }[pl.age];
    const forced = pl.age >= 18 || (pl.age === 17 && S.turn >= 10);
    if (!forced && (o < T || pl.lp < rankReq)) return;
    if (!forced && !U.chance(0.35 + P.luck(S) / 60 + (o - T) * 0.04)) return;
    if (!S.world) S.world = W.init();
    const offers = P.academyOffers(S).slice(0, forced ? 1 : U.randInt(1, 2));
    for (const of of offers) {
      S.offers.push({ id: U.uid(), teamId: of.teamId, salary: of.salary, max: of.salary * U.rand(1.1, 1.3), years: 2, attempts: 3, expires: S.turn + 3, academy: true, year: S.year });
      news(S, `¡${S.world.teams[of.teamId].name} quiere ficharte para su proyecto de cantera!`, 'good');
    }
  }

  // ---------- Avanzar semana ----------
  P.advance = function (S) {
    const pl = S.pl;
    const report = { user: null, headlines: [], events: [], label: RC.Season.turnLabel(S), date: RC.Season.turnDate(S).text };
    const t = S.cal[S.turn];
    if (!S.amateur && t.kind === 'reg' && t.round === 0) {
      P.newPatch(S);
      report.events.push(`Nuevo parche ${S.patch.ver}.`);
    }
    // Partidos de todo el mundo
    if (!S.amateur) {
      const r = RC.Season.playTurn(S);
      report.user = r.user;
      report.headlines = r.headlines;
      if (t.kind === 'po' && t.round === 2) P.checkSponsors(S);
    } else if (S.turn % 4 === 3) P.checkSponsors(S);
    // Economía
    const weeks = S.amateur ? 4 : 1;
    let income = 0, costs = 0;
    if (pl.contract) income += pl.contract.salary / TURNS_PRO;
    if (S.amateur) income += 60;
    for (const sp of pl.sponsors) income += sp.pay * weeks * (pl.streams >= 3 ? 1.1 : 1);
    for (const id of Object.keys(pl.staff)) costs += P.staffCost(S, id);
    pl.money += income - costs;
    pl.earned += income;
    report.income = income; report.costs = costs;
    if (pl.money < 0) {
      const fired = Object.keys(pl.staff);
      if (fired.length) {
        pl.staff = {};
        report.events.push('No puedes pagar a tu staff: todos se marchan.');
        news(S, 'Te quedas sin dinero y tu staff se marcha.', 'bad');
      }
      pl.money = Math.max(pl.money, -2000);
    }
    // Energía y moral
    pl.energy = Math.min(100, pl.energy + (S.amateur ? 45 : 25) + (P.hasStaff(S, 'nutri') ? 12 : 0));
    pl.morale = U.clamp(pl.morale + (60 - pl.morale) * 0.05, 0, 100);
    pl.actionsUsed = 0;
    // Evento
    const ev = randomEvent(S);
    if (ev) { report.events.push(ev); news(S, ev); }
    // Caducan ofertas
    S.offers = S.offers.filter((o) => {
      if (o.expires > S.turn) return true;
      news(S, `Caduca la oferta de ${S.world ? S.world.teams[o.teamId].name : 'un equipo'}.`);
      return false;
    });
    S.sponsorOffers = S.sponsorOffers.filter((o) => o.expires > S.turn);

    // Siguiente turno
    S.turn++;
    if (S.amateur) {
      if (S.turn >= S.cal.length) {
        S.year++; S.turn = 0; pl.age++;
        S.offers.forEach((o) => (o.expires -= 12));
        S.sponsorOffers.forEach((o) => (o.expires -= 12));
        report.events.push(`Feliz año ${S.year}. Ahora tienes ${pl.age} años.`);
        news(S, `Empieza ${S.year}. Tienes ${pl.age} años.`);
      }
      kidScouting(S);
      if (S.turn % 3 === 0) P.genSponsorOffers(S);
    } else {
      proTurnStart(S, report);
    }
    pl.peakOvr = Math.max(pl.peakOvr, P.ovr(S));
    S.lastReport = report;
    return report;
  };

  function proTurnStart(S, report) {
    const pl = S.pl;
    if (S.turn >= S.cal.length) newYear(S, report);
    const t = S.cal[S.turn];
    // Sin equipo
    if (!pl.teamId) {
      pl.freeTurns++;
      if (pl.freeTurns % 3 === 1) P.genOffers(S, 1 + (P.hasStaff(S, 'agente') ? 1 : 0));
      if (pl.freeTurns >= TURNS_PRO) return endCareer(S, 'Llevas un año entero sin equipo. Ningún club apuesta por ti y te retiras.');
    }
    // Ventanas de mercado
    if (t.phase === 'off' || (t.phase === 'pre' && t.round === 0) || (t.phase === 'msi' && t.round === 0)) {
      if (pl.teamId) P.genOffers(S, U.randInt(0, 1) + (P.hasStaff(S, 'agente') ? 1 : 0) + (t.phase === 'off' && t.round === 0 ? 1 : 0));
    }
    // Renovación
    if (t.phase === 'off' && t.round === 0 && pl.contract && pl.contract.endYear <= S.year) {
      const team = P.team(S);
      const req = C.LEAGUES[team.league].req;
      if (P.ovr(S) >= req - 3) {
        P.makeOffer(S, team.id, { renewal: true, ttl: 4, years: U.randInt(1, 2) });
        news(S, `${team.name} te ofrece renovar.`, 'good');
      } else news(S, `${team.name} no cuenta contigo para la próxima temporada.`, 'bad');
    }
    // Último turno del año: fin de contratos
    if (t.phase === 'off' && t.round === 3 && pl.contract && pl.contract.endYear <= S.year) {
      // se resuelve al empezar el nuevo año si no renovó
    }
    if ((t.kind === 'reg' && t.round === 0) || (t.phase === 'pre' && t.round === 0)) P.genSponsorOffers(S);
    else if (U.chance(0.08)) P.genSponsorOffers(S);
    if (t.phase === 'pre' && t.round === 0) report.events.push(`Empieza la temporada ${S.year}.`);
  }

  function newYear(S, report) {
    const pl = S.pl;
    // Contrato acabado sin renovar
    if (pl.contract && pl.contract.endYear <= S.year) P.leaveTeam(S);
    S.year++;
    S.turn = 0;
    pl.age++;
    // Declive por edad
    const decl = pl.age < 27 ? 0 : [0.3, 0.6, 1.0, 1.4, 1.8, 2.3][pl.age - 27] || 3;
    if (decl) {
      for (const a of C.ATTRS) {
        const k = a.group === 'mech' ? 1.3 : a.group === 'ment' ? 0.5 : 0.9;
        pl.attrs[a.id] = U.round1(Math.max(30, pl.attrs[a.id] - U.rand(0.3, 1) * decl * k));
      }
      report.events.push(`Con ${pl.age} años tus reflejos empiezan a bajar.`);
    }
    const wn = W.yearEnd(S);
    wn.slice(0, 6).forEach((t) => report.headlines.push(t));
    S.comp = null;
    RC.Season.newComp(S);
    // Las ofertas viejas caducan con el cambio de año
    S.offers = S.offers.filter((o) => !o.renewal);
    S.offers.forEach((o) => (o.expires -= TURNS_PRO));
    S.sponsorOffers.forEach((o) => (o.expires -= TURNS_PRO));
    news(S, `Empieza ${S.year}. Tienes ${pl.age} años.`);
    if (pl.age >= 36) endCareer(S, 'Con 36 años decides colgar el ratón.');
  }

  function endCareer(S, why) {
    S.over = true;
    S.overReason = why;
    news(S, why, 'bad');
    P.saveHallOfFame(S);
  }

  P.canRetire = (S) => !S.amateur && S.pl.age >= 27 && !S.over;
  P.retire = function (S) {
    if (!P.canRetire(S)) return;
    if (S.pl.teamId) P.leaveTeam(S, `Anuncias tu retirada de ${P.team(S).name}.`);
    endCareer(S, `${S.pl.name} anuncia su retirada a los ${S.pl.age} años.`);
  };

  P.saveHallOfFame = function (S) {
    const pl = S.pl;
    const c = pl.stats.career;
    const entry = {
      id: S.id, name: pl.name, role: pl.role, nation: pl.nation, years: `${S.startYear}–${S.year}`, age: pl.age,
      peak: Math.round(pl.peakOvr), titles: pl.titles.length, worlds: pl.titles.filter((t) => t.name.startsWith('Worlds')).length,
      awards: pl.awards.length, games: c.g, winrate: c.g ? Math.round((c.w / c.g) * 100) : 0, earned: Math.round(pl.earned), fans: pl.fans,
      reason: S.overReason,
    };
    try {
      const list = JSON.parse(localStorage.getItem('rc_hof') || '[]').filter((e) => e.id !== entry.id);
      list.push(entry);
      localStorage.setItem('rc_hof', JSON.stringify(list));
    } catch (e) { /* sin almacenamiento */ }
  };

  RC.P = P;
})(window.RC);
