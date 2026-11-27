/* Calendario y competiciones: splits, playoffs, MSI, EMEA Masters y Worlds.
   Formatos internacionales actuales:
   - MSI: Play-In con dos grupos de doble eliminación (GSL, Bo3) y Bracket Stage de 8 equipos a doble eliminación (Bo5).
   - Worlds: Play-In (4º de LCK contra 4º de LPL, Bo5), fase suiza de 16 equipos (Bo1; Bo3 si hay clasificación
     o eliminación en juego) y eliminatorias de 8 equipos (Bo5). */
(function (RC) {
  const { U, C, W, Sim } = RC;
  const Season = {};

  const SPLITS = [
    { id: 'winter', name: 'Winter Split', mult: 0.6 },
    { id: 'spring', name: 'Spring Split', mult: 1.0 },
    { id: 'summer', name: 'Summer Split', mult: 1.4 },
  ];
  Season.SPLITS = SPLITS;
  Season.SPLIT_NAME = { winter: 'Winter Split', spring: 'Spring Split', summer: 'Summer Split' };
  const REG_ROUNDS = 9;
  Season.MSI_ROUNDS = 9;
  Season.WORLDS_ROUNDS = 9;

  // Cada turno dura `days` días: las semanas de liga son de 7 días y los internacionales van más rápidos.
  Season.buildCalendar = function (kid) {
    const cal = [];
    if (kid) {
      for (let m = 0; m < 12; m++) cal.push({ phase: 'amateur', round: m, days: 30 });
      return cal;
    }
    cal.push({ phase: 'pre', round: 0, days: 7 }, { phase: 'pre', round: 1, days: 7 });
    const split = (id) => {
      for (let r = 0; r < REG_ROUNDS; r++) cal.push({ phase: id, kind: 'reg', round: r, days: 7 });
      for (let r = 0; r < 3; r++) cal.push({ phase: id, kind: 'po', round: r, days: 7 });
    };
    split('winter');
    split('spring');
    for (let r = 0; r < Season.MSI_ROUNDS; r++) cal.push({ phase: 'msi', round: r, days: 3 });
    split('summer');
    for (let r = 0; r < Season.WORLDS_ROUNDS; r++) cal.push({ phase: 'worlds', round: r, days: 4 });
    for (let r = 0; r < 4; r++) cal.push({ phase: 'off', round: r, days: 7 });
    return cal;
  };
  Season.turnDays = (S, idx = S.turn) => (S.cal[idx] && S.cal[idx].days) || 7;

  Season.turnDate = function (S, idx = S.turn) {
    if (S.amateur) return { day: 1, month: idx, text: C.MONTHS[idx] + ' de ' + S.year };
    let days = 0;
    for (let i = 0; i < idx; i++) days += Season.turnDays(S, i);
    const d = new Date(S.year, 0, 6 + days);
    return { day: d.getDate(), month: d.getMonth(), text: d.getDate() + ' de ' + C.MONTHS[d.getMonth()] + ' de ' + S.year };
  };

  const MSI_LABELS = ['Play-In · Apertura', 'Play-In · Ganadores y eliminación', 'Play-In · Partido decisivo',
    'Bracket · Cuartos del cuadro superior', 'Bracket · Semis superior y ronda 1 inferior', 'Bracket · Final superior y ronda 2 inferior',
    'Bracket · Ronda 3 del cuadro inferior', 'Bracket · Final del cuadro inferior', 'Gran Final'];
  const WORLDS_LABELS = ['Play-In', 'Fase suiza · Ronda 1', 'Fase suiza · Ronda 2', 'Fase suiza · Ronda 3', 'Fase suiza · Ronda 4',
    'Fase suiza · Ronda 5', 'Cuartos de final', 'Semifinales', 'Final'];

  Season.turnLabel = function (S, t = S.cal[S.turn]) {
    if (!t) return '';
    switch (t.phase) {
      case 'amateur': return 'Etapa amateur';
      case 'pre': return 'Pretemporada';
      case 'off': return 'Mercado de fichajes';
      case 'msi': return 'MSI · ' + MSI_LABELS[t.round];
      case 'worlds': return 'Worlds · ' + WORLDS_LABELS[t.round];
      default:
        return Season.SPLIT_NAME[t.phase] + ' · ' + (t.kind === 'reg' ? 'Jornada ' + (t.round + 1) : ['Playoffs · Cuartos', 'Playoffs · Semifinales', 'Playoffs · Final'][t.round]);
    }
  };

  Season.isWindowOpen = function (S) {
    const t = S.cal[S.turn];
    return !t || ['pre', 'off', 'msi'].includes(t.phase);
  };

  function circle(ids) {
    const list = ids.slice();
    if (list.length % 2) list.push(null);
    const n = list.length;
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const m = [];
      for (let i = 0; i < n / 2; i++) {
        const a = list[i], b = list[n - 1 - i];
        if (a && b) m.push(r % 2 ? [b, a] : [a, b]);
      }
      rounds.push(m);
      list.splice(1, 0, list.pop());
    }
    return rounds;
  }

  Season.newComp = function (S) {
    S.comp = { year: S.year, split: null, points: {}, done: {}, msi: null, emea: null, worlds: null };
  };

  function initSplit(S, phase) {
    const leagues = {};
    for (const lg of C.LEAGUE_ORDER) {
      const teams = W.leagueTeams(S, lg).map((t) => t.id);
      let rounds = circle(U.shuffle(teams));
      while (rounds.length < REG_ROUNDS) rounds = rounds.concat(rounds.map((r) => r.map(([a, b]) => [b, a])));
      const table = {};
      teams.forEach((t) => (table[t] = { w: 0, l: 0, gw: 0, gl: 0 }));
      leagues[lg] = { stats: {}, teams, sched: rounds.slice(0, REG_ROUNDS).map((r) => r.map(([a, b]) => ({ a, b, bo: 1, res: null }))), table, po: null, champion: null, place: null };
    }
    S.comp.split = { id: phase, leagues };
  }

  Season.sortedTable = function (L) {
    return Object.entries(L.table)
      .sort((x, y) => y[1].w - x[1].w || (y[1].gw - y[1].gl) - (x[1].gw - x[1].gl) || x[0].localeCompare(y[0]))
      .map(([tid, r]) => Object.assign({ tid }, r));
  };

  function mk(a, b, bo, lbl) { return { a, b, bo, res: null, lbl: lbl || '' }; }
  const Wn = (m) => m.res.winner;
  const Ls = (m) => m.res.loser;

  function initPlayoffs(L) {
    const s = Season.sortedTable(L).map((r) => r.tid);
    L.po = { seeds: s.slice(0, 6), rounds: [[mk(s[2], s[5], 5), mk(s[3], s[4], 5)], [], []] };
  }

  function bracket8(seeds, bo = 5) {
    const s = seeds;
    return { seeds: s, rounds: [[mk(s[0], s[7], bo), mk(s[3], s[4], bo), mk(s[1], s[6], bo), mk(s[2], s[5], bo)], [], []] };
  }
  function nextBracketRounds(e, round) {
    if (round >= 1 && !e.rounds[1].length) e.rounds[1] = [mk(Wn(e.rounds[0][0]), Wn(e.rounds[0][1]), 5), mk(Wn(e.rounds[0][2]), Wn(e.rounds[0][3]), 5)];
    if (round >= 2 && !e.rounds[2].length) e.rounds[2] = [mk(Wn(e.rounds[1][0]), Wn(e.rounds[1][1]), 5)];
  }

  function placeFromPlayoffs(L) {
    const place = {};
    const po = L.po;
    const fin = po.rounds[2][0].res;
    place[fin.winner] = 1;
    place[fin.loser] = 2;
    let p = 3;
    po.rounds[1].forEach((m) => (place[m.res.loser] = p++));
    p = 5;
    po.rounds[0].forEach((m) => (place[m.res.loser] = p++));
    p = 7;
    for (const r of Season.sortedTable(L)) if (!place[r.tid]) place[r.tid] = p++;
    return place;
  }

  const PTS = (place) => [0, 90, 70, 50, 40, 25, 25, 10, 10][place] || 0;

  // ---------- Grupo GSL (doble eliminación de 4) ----------
  function gsl(name, teams) {
    const [a, b, c, d] = teams;
    return { name, teams, m: { oa: mk(a, d, 3, 'Apertura'), ob: mk(b, c, 3, 'Apertura'), win: null, elim: null, dec: null }, first: null, second: null };
  }
  function gslPrepare(g, r) {
    if (r >= 1 && !g.m.win) {
      g.m.win = mk(Wn(g.m.oa), Wn(g.m.ob), 3, 'Ganadores');
      g.m.elim = mk(Ls(g.m.oa), Ls(g.m.ob), 3, 'Eliminación');
    }
    if (r >= 2 && !g.m.dec) g.m.dec = mk(Ls(g.m.win), Wn(g.m.elim), 3, 'Decisivo');
  }
  const gslMatches = (g, r) => [[g.m.oa, g.m.ob], [g.m.win, g.m.elim], [g.m.dec]][r].filter(Boolean);

  // ---------- Doble eliminación de 8 ----------
  function dePrepare(de, r) {
    const u = de.ub, l = de.lb;
    if (r >= 1 && !u[1].length) {
      u[1] = [mk(Wn(u[0][0]), Wn(u[0][1]), 5, 'Semis superior'), mk(Wn(u[0][2]), Wn(u[0][3]), 5, 'Semis superior')];
      l[0] = [mk(Ls(u[0][0]), Ls(u[0][1]), 5, 'Inferior · R1'), mk(Ls(u[0][2]), Ls(u[0][3]), 5, 'Inferior · R1')];
    }
    if (r >= 2 && !u[2].length) {
      u[2] = [mk(Wn(u[1][0]), Wn(u[1][1]), 5, 'Final superior')];
      l[1] = [mk(Wn(l[0][0]), Ls(u[1][1]), 5, 'Inferior · R2'), mk(Wn(l[0][1]), Ls(u[1][0]), 5, 'Inferior · R2')];
    }
    if (r >= 3 && !l[2].length) l[2] = [mk(Wn(l[1][0]), Wn(l[1][1]), 5, 'Inferior · R3')];
    if (r >= 4 && !l[3].length) l[3] = [mk(Wn(l[2][0]), Ls(u[2][0]), 5, 'Final inferior')];
    if (r >= 5 && !de.gf) de.gf = mk(Wn(u[2][0]), Wn(l[3][0]), 5, 'Gran Final');
  }
  const deMatches = (de, r) => [de.ub[0], de.ub[1].concat(de.lb[0]), de.ub[2].concat(de.lb[1]), de.lb[2], de.lb[3], de.gf ? [de.gf] : []][r] || [];

  // ---------- Fase suiza ----------
  function swissPrepare(S, sw, r) {
    if (sw.rounds[r]) return;
    const active = sw.teams.filter((t) => sw.rec[t].w < 3 && sw.rec[t].l < 3);
    const groups = {};
    for (const t of active) (groups[sw.rec[t].w + '-' + sw.rec[t].l] = groups[sw.rec[t].w + '-' + sw.rec[t].l] || []).push(t);
    const played = (a, b) => sw.rounds.some((rd) => rd && rd.some((m) => (m.a === a && m.b === b) || (m.a === b && m.b === a)));
    const lg = (t) => S.world.teams[t].league;
    const list = [];
    for (const [rec, ts] of Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))) {
      const pool = U.shuffle(ts);
      while (pool.length > 1) {
        const a = pool.shift();
        let idx = pool.findIndex((b) => !played(a, b) && (r > 0 || lg(a) !== lg(b)));
        if (idx < 0) idx = pool.findIndex((b) => !played(a, b));
        if (idx < 0) idx = 0;
        const b = pool.splice(idx, 1)[0];
        const [w, l] = rec.split('-').map(Number);
        list.push(mk(a, b, w === 2 || l === 2 ? 3 : 1, rec));
      }
    }
    sw.rounds[r] = list;
  }
  function swissAfter(sw, r) {
    for (const m of sw.rounds[r]) {
      sw.rec[Wn(m)].w++;
      sw.rec[Ls(m)].l++;
      if (sw.rec[Wn(m)].w === 3) sw.qualified.push(Wn(m));
      if (sw.rec[Ls(m)].l === 3) sw.out.push(Ls(m));
    }
  }

  // Acumula las estadísticas de cada jugador en el split (o torneo)
  function addStats(stats, res) {
    for (const b of res.boards || []) {
      const win = { A: res.a, B: res.b };
      for (const side of ['A', 'B']) {
        for (const r of b[side]) {
          if (!r.pid) continue;
          const x = (stats[r.pid] = stats[r.pid] || { g: 0, w: 0, k: 0, d: 0, a: 0, cs: 0, r: 0, team: win[side], role: r.role });
          x.g++; x.k += r.k; x.d += r.d; x.a += r.a; x.cs += r.cs; x.r += r.rating; x.team = win[side];
        }
      }
    }
  }
  Season.statRows = function (S, stats, minG = 1) {
    return Object.entries(stats || {}).filter(([, x]) => x.g >= minG).map(([pid, x]) => {
      const p = pid === 'USER' ? null : S.world.players[pid];
      return { pid, name: pid === 'USER' ? S.pl.name : p ? p.name : '?', role: x.role, team: x.team, g: x.g, k: x.k, d: x.d, a: x.a,
        kda: (x.k + x.a) / Math.max(1, x.d), kpg: x.k / x.g, cs: x.cs / x.g, r: x.r / x.g, user: pid === 'USER' };
    });
  };

  // Juega una serie y avisa si participa el usuario
  function play(S, m, ctx, report) {
    const res = Sim.playSeries(S, m.a, m.b, m.bo);
    m.res = { winner: res.winner, loser: res.loser, sa: res.sa, sb: res.sb };
    if (ctx.stats) addStats(ctx.stats, res);
    const uid = S.pl.teamId;
    if (uid && (m.a === uid || m.b === uid)) {
      RC.P.recordSeries(S, res, ctx);
      report.user = Object.assign({ ctx }, res);
    }
    return res;
  }

  function rank(S, phase, lg) {
    const d = S.comp.done[phase] && S.comp.done[phase][lg];
    if (!d) return W.leagueTeams(S, lg).map((t) => t.id).sort((a, b) => W.teamAvgOvr(S, S.world.teams[b]) - W.teamAvgOvr(S, S.world.teams[a]));
    return Object.entries(d.place).sort((a, b) => a[1] - b[1]).map(([t]) => t);
  }

  // Clasificados a cada torneo (también sirve para mostrarlos antes de que empiece)
  Season.msiField = function (S) {
    const sp = (lg) => rank(S, 'spring', lg);
    const direct = [sp('LCK')[0], sp('LPL')[0], sp('LEC')[0], sp('LCS')[0]];
    const playin = [sp('LCK')[1], sp('LPL')[1], sp('LEC')[1], sp('LCS')[1], sp('LCP')[0], sp('LCP')[1], sp('CBLOL')[0], sp('CBLOL')[1]];
    return { direct, playin };
  };
  Season.worldsField = function (S) {
    const pts = S.comp.points;
    const top = (lg, n) => W.leagueTeams(S, lg).map((t) => t.id)
      .sort((a, b) => (pts[b] || 0) - (pts[a] || 0) || ((S.comp.done.summer?.[lg]?.place[a] || 99) - (S.comp.done.summer?.[lg]?.place[b] || 99)) || W.teamAvgOvr(S, S.world.teams[b]) - W.teamAvgOvr(S, S.world.teams[a]))
      .slice(0, n);
    const lck = top('LCK', 4), lpl = top('LPL', 4);
    const direct = [lck[0], lpl[0], top('LEC', 1)[0], top('LCS', 1)[0], lck[1], lpl[1], top('LEC', 2)[1], top('LCP', 1)[0],
      lck[2], lpl[2], top('LEC', 3)[2], top('LCS', 2)[1], top('LCS', 3)[2], top('LCP', 2)[1], top('CBLOL', 1)[0]];
    return { direct, playin: [lck[3], lpl[3]] };
  };

  function initMSI(S) {
    const f = Season.msiField(S);
    // Bombo 1 (2º de las grandes ligas) y bombo 2 (resto)
    const strong = U.shuffle(f.playin.slice(0, 4)), weak = U.shuffle(f.playin.slice(4));
    S.comp.msi = {
      id: 'msi', name: 'MSI', direct: U.shuffle(f.direct),
      groups: [gsl('Grupo A', [strong[0], strong[1], weak[0], weak[1]]), gsl('Grupo B', [strong[2], strong[3], weak[2], weak[3]])],
      de: null, champion: null,
    };
    const emea = ['LES', 'LFL', 'PL', 'NLC', 'TCL'].map((lg) => rank(S, 'spring', lg)[0]).concat(['LES', 'LFL', 'PL'].map((lg) => rank(S, 'spring', lg)[1]));
    S.comp.emea = Object.assign(bracket8(U.shuffle(emea)), { name: 'EMEA Masters', id: 'emea' });
  }

  function initWorlds(S) {
    const f = Season.worldsField(S);
    S.comp.worlds = { id: 'worlds', name: 'Worlds', direct: f.direct, playin: mk(f.playin[0], f.playin[1], 5, 'Play-In'), swiss: null, ko: null, champion: null };
  }

  // Prepara la jornada actual (cuadros y cruces) antes de jugarla. Es idempotente.
  Season.prepareTurn = function (S) {
    const t = S.cal[S.turn];
    const ev = [];
    if (!t || t.phase === 'amateur' || !S.world) return ev;
    if (!S.comp || S.comp.year !== S.year) Season.newComp(S);
    if (['winter', 'spring', 'summer'].includes(t.phase)) {
      if (t.kind === 'reg') {
        if (!S.comp.split || S.comp.split.id !== t.phase) {
          RC.P.newPatch(S);
          ev.push(`Nuevo parche ${S.patch.ver}: revisa el meta en Campeones.`);
          initSplit(S, t.phase);
        }
      } else {
        for (const L of Object.values(S.comp.split.leagues)) {
          if (!L.po) initPlayoffs(L);
          if (t.round >= 1 && !L.po.rounds[1].length) {
            const w = L.po.rounds[0].map(Wn);
            L.po.rounds[1] = [mk(L.po.seeds[0], w[1], 5), mk(L.po.seeds[1], w[0], 5)];
          }
          if (t.round >= 2 && !L.po.rounds[2].length) L.po.rounds[2] = [mk(Wn(L.po.rounds[1][0]), Wn(L.po.rounds[1][1]), 5)];
        }
      }
    } else if (t.phase === 'msi') {
      if (!S.comp.msi || !S.comp.msi.groups) initMSI(S);
      const e = S.comp.msi;
      if (t.round < 3) {
        e.groups.forEach((g) => gslPrepare(g, t.round));
        nextBracketRounds(S.comp.emea, t.round);
      } else {
        if (!e.de) {
          const [A, B] = e.groups;
          const d = e.direct;
          e.de = { ub: [[mk(d[0], B.second, 5, 'Cuartos superior'), mk(d[1], A.second, 5, 'Cuartos superior'), mk(d[2], B.first, 5, 'Cuartos superior'), mk(d[3], A.first, 5, 'Cuartos superior')], [], []], lb: [[], [], [], []], gf: null };
        }
        dePrepare(e.de, t.round - 3);
      }
    } else if (t.phase === 'worlds') {
      if (!S.comp.worlds || !S.comp.worlds.playin) initWorlds(S);
      const e = S.comp.worlds;
      if (t.round >= 1 && t.round <= 5) {
        if (!e.swiss) {
          const teams = e.direct.concat([Wn(e.playin)]);
          const rec = {};
          teams.forEach((x) => (rec[x] = { w: 0, l: 0 }));
          e.swiss = { teams, rec, rounds: [], qualified: [], out: [] };
        }
        swissPrepare(S, e.swiss, t.round - 1);
      }
      if (t.round >= 6) {
        if (!e.ko) {
          const q = e.swiss.qualified.slice().sort((a, b) => e.swiss.rec[a].l - e.swiss.rec[b].l);
          e.ko = bracket8(q);
        }
        nextBracketRounds(e.ko, t.round - 6);
      }
    }
    return ev;
  };

  // Partidos de la jornada actual en torneos internacionales, con su contexto
  function intlMatches(S, t) {
    const out = [];
    if (t.phase === 'msi') {
      const e = S.comp.msi;
      if (!e) return out;
      if (t.round < 3) {
        e.groups.forEach((g) => gslMatches(g, t.round).forEach((m) => out.push({ m, ev: e, stage: 'Play-In · ' + g.name })));
        if (S.comp.emea) S.comp.emea.rounds[t.round].forEach((m) => out.push({ m, ev: S.comp.emea, stage: ['Cuartos', 'Semifinales', 'Final'][t.round] }));
      } else if (e.de) deMatches(e.de, t.round - 3).forEach((m) => out.push({ m, ev: e, stage: 'Bracket · ' + m.lbl }));
    } else if (t.phase === 'worlds') {
      const e = S.comp.worlds;
      if (!e) return out;
      if (t.round === 0) out.push({ m: e.playin, ev: e, stage: 'Play-In' });
      else if (t.round <= 5) (e.swiss && e.swiss.rounds[t.round - 1] || []).forEach((m) => out.push({ m, ev: e, stage: 'Fase suiza · ' + m.lbl }));
      else if (e.ko) e.ko.rounds[t.round - 6].forEach((m) => out.push({ m, ev: e, stage: WORLDS_LABELS[t.round] }));
    }
    return out;
  }

  Season.userFixture = function (S, t = S.cal[S.turn]) {
    const uid = S.pl.teamId;
    if (!uid || !t || !S.comp) return null;
    const team = S.world.teams[uid];
    const find = (list) => (list || []).find((m) => m.a === uid || m.b === uid);
    const label = Season.turnLabel(S, t);
    if (['winter', 'spring', 'summer'].includes(t.phase)) {
      const L = S.comp.split && S.comp.split.id === t.phase && S.comp.split.leagues[team.league];
      if (!L) return null;
      if (t.kind === 'reg') {
        const m = find(L.sched[t.round]);
        return m ? { a: m.a, b: m.b, bo: 1, label } : null;
      }
      const m = L.po && find(L.po.rounds[t.round]);
      if (m) return { a: m.a, b: m.b, bo: 5, label };
      if (t.round === 0 && L.po && L.po.seeds.slice(0, 2).includes(uid)) return { bye: true, label };
      return null;
    }
    if (t.phase === 'msi' || t.phase === 'worlds') {
      const x = intlMatches(S, t).find((o) => o.m.a === uid || o.m.b === uid);
      if (x) return { a: x.m.a, b: x.m.b, bo: x.m.bo, label: x.ev.name + ' · ' + x.stage };
    }
    return null;
  };

  // Juega la jornada actual para todo el mundo
  Season.playTurn = function (S) {
    const t = S.cal[S.turn];
    const report = { user: null, headlines: [], events: [] };
    if (!t || t.phase === 'amateur') return report;
    report.events = Season.prepareTurn(S);
    W.tickForm(S);
    if (['winter', 'spring', 'summer'].includes(t.phase)) {
      if (t.kind === 'reg') {
        for (const [lg, L] of Object.entries(S.comp.split.leagues)) {
          for (const m of L.sched[t.round]) {
            if (m.res) continue;
            const r = play(S, m, { comp: C.LEAGUES[lg].name, label: Season.turnLabel(S, t), stats: L.stats }, report);
            const ta = L.table[m.a], tb = L.table[m.b];
            (r.winner === m.a ? ta : tb).w++;
            (r.winner === m.a ? tb : ta).l++;
            ta.gw += r.sa; ta.gl += r.sb; tb.gw += r.sb; tb.gl += r.sa;
          }
        }
      } else {
        for (const [lg, L] of Object.entries(S.comp.split.leagues)) {
          for (const m of L.po.rounds[t.round]) if (!m.res) play(S, m, { comp: C.LEAGUES[lg].name, label: Season.turnLabel(S, t), playoff: true, stats: L.stats }, report);
          if (t.round === 2 && !L.champion) finishSplit(S, t.phase, lg, L, report);
        }
      }
      return report;
    }
    if (t.phase !== 'msi' && t.phase !== 'worlds') return report;
    for (const x of intlMatches(S, t)) {
      if (!x.m.res) play(S, x.m, { comp: x.ev.name, label: x.ev.name + ' · ' + x.stage, playoff: x.m.bo > 1, intl: x.ev.id, stats: (x.ev.stats = x.ev.stats || {}) }, report);
    }
    if (t.phase === 'msi') afterMSI(S, t.round, report);
    else afterWorlds(S, t.round, report);
    return report;
  };

  function finishSplit(S, phase, lg, L, report) {
    L.place = placeFromPlayoffs(L);
    L.champion = L.po.rounds[2][0].res.winner;
    const mult = SPLITS.find((s) => s.id === phase).mult;
    for (const [tid, pl] of Object.entries(L.place)) S.comp.points[tid] = (S.comp.points[tid] || 0) + PTS(pl) * mult;
    S.comp.done[phase] = S.comp.done[phase] || {};
    S.comp.done[phase][lg] = { champion: L.champion, place: L.place, table: Season.sortedTable(L).map((r) => r.tid) };
    const champ = S.world.teams[L.champion];
    if (C.LEAGUES[lg].major) report.headlines.push(`${champ.name} gana el ${Season.SPLIT_NAME[phase]} de la ${C.LEAGUES[lg].name}.`);
    // MVP (mejor nota media con al menos 6 partidas, con bonus por posición) y equipo ideal por rol
    const rows = Season.statRows(S, L.stats, 6);
    const place = (r) => L.place[r.team] || 9;
    const score = (r) => r.r + (place(r) <= 2 ? 0.25 : place(r) <= 4 ? 0.1 : 0);
    if (rows.length) {
      const mvp = rows.slice().sort((a, b) => score(b) - score(a))[0];
      L.mvp = mvp.pid;
      L.allPro = {};
      for (const role of C.ROLES) { const best = rows.filter((r) => r.role === role).sort((a, b) => score(b) - score(a))[0]; if (best) L.allPro[role] = best.pid; }
      if (C.LEAGUES[lg].tier <= 2 && !mvp.user) report.headlines.push(`${mvp.name} es el MVP del ${Season.SPLIT_NAME[phase]} de la ${C.LEAGUES[lg].name}.`);
    }
    const uid = S.pl.teamId;
    if (uid && L.place[uid]) RC.P.onSplitEnd(S, phase, lg, L.place[uid], L);
  }

  const lostIn = (list, uid) => (list || []).some((m) => m && m.res && m.res.loser === uid);

  function afterMSI(S, r, report) {
    const e = S.comp.msi, uid = S.pl.teamId;
    const em = S.comp.emea;
    if (r === 2) {
      for (const g of e.groups) {
        g.first = Wn(g.m.win);
        g.second = Wn(g.m.dec);
        if (uid && g.teams.includes(uid) && g.first !== uid && g.second !== uid) RC.P.onIntlEnd(S, 'msi', 'MSI', 9, 'el Play-In');
      }
      if (!em.champion) {
        em.champion = Wn(em.rounds[2][0]);
        report.headlines.push(`${S.world.teams[em.champion].name} gana las EMEA Masters.`);
        if (em.seeds.includes(uid)) {
          const f = em.rounds[2][0].res;
          RC.P.onIntlEnd(S, 'emea', 'EMEA Masters', f.winner === uid ? 1 : f.loser === uid ? 2 : lostIn(em.rounds[1], uid) ? 3 : 5);
        }
      }
    }
    if (r >= 3 && uid) {
      const d = e.de;
      const k = r - 3;
      if (k === 1 && lostIn(d.lb[0], uid)) RC.P.onIntlEnd(S, 'msi', 'MSI', 7);
      if (k === 2 && lostIn(d.lb[1], uid)) RC.P.onIntlEnd(S, 'msi', 'MSI', 5);
      if (k === 3 && lostIn(d.lb[2], uid)) RC.P.onIntlEnd(S, 'msi', 'MSI', 4);
      if (k === 4 && lostIn(d.lb[3], uid)) RC.P.onIntlEnd(S, 'msi', 'MSI', 3);
    }
    if (r === 8 && !e.champion) {
      const f = e.de.gf.res;
      e.champion = f.winner;
      report.headlines.push(`${S.world.teams[f.winner].name} se proclama campeón del MSI ${S.year}.`);
      if (uid === f.winner) RC.P.onIntlEnd(S, 'msi', 'MSI', 1);
      else if (uid === f.loser) RC.P.onIntlEnd(S, 'msi', 'MSI', 2);
    }
  }

  function afterWorlds(S, r, report) {
    const e = S.comp.worlds, uid = S.pl.teamId;
    if (r === 0 && uid && e.playin.res.loser === uid) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 17, 'el Play-In');
    if (r >= 1 && r <= 5) {
      const sw = e.swiss;
      if (!sw.done) sw.done = [];
      if (!sw.done[r - 1]) {
        swissAfter(sw, r - 1);
        sw.done[r - 1] = true;
        if (uid && sw.rounds[r - 1].some((m) => m.res.loser === uid) && sw.rec[uid] && sw.rec[uid].l === 3) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 9, 'la fase suiza');
      }
    }
    if (r === 6 && uid && lostIn(e.ko.rounds[0], uid)) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 5);
    if (r === 7 && uid && lostIn(e.ko.rounds[1], uid)) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 3);
    if (r === 8 && !e.champion) {
      const f = e.ko.rounds[2][0].res;
      e.champion = f.winner;
      report.headlines.push(`${S.world.teams[f.winner].name} es CAMPEÓN DEL MUNDO ${S.year}.`);
      if (uid === f.winner) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 1);
      else if (uid === f.loser) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 2);
    }
  }

  // Partidas guardadas con el formato antiguo de MSI/Worlds
  Season.migrate = function (S) {
    if (S.amateur || !S.cal) return;
    const msiLen = S.cal.filter((t) => t.phase === 'msi').length;
    if (msiLen === Season.MSI_ROUNDS && S.cal[0].days) return;
    const old = S.cal[S.turn];
    const cal = Season.buildCalendar(false);
    let idx = cal.findIndex((t) => t.phase === old.phase && t.kind === old.kind && t.round === old.round);
    if (old.phase === 'msi' || old.phase === 'worlds') {
      idx = cal.findIndex((t) => t.phase === old.phase);
      if (S.comp) { S.comp.msi = old.phase === 'msi' ? null : S.comp.msi; S.comp.emea = old.phase === 'msi' ? null : S.comp.emea; S.comp.worlds = null; }
    }
    if (S.comp && S.comp.msi && !S.comp.msi.groups) S.comp.msi = Object.assign(S.comp.msi, { legacy: true });
    S.cal = cal;
    S.turn = Math.max(0, idx);
  };

  RC.Season = Season;
})(window.RC);
