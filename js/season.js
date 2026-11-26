/* Calendario y competiciones: splits, playoffs, MSI, EMEA Masters y Worlds. */
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

  Season.buildCalendar = function (kid) {
    const cal = [];
    if (kid) {
      for (let m = 0; m < 12; m++) cal.push({ phase: 'amateur', round: m });
      return cal;
    }
    cal.push({ phase: 'pre', round: 0 }, { phase: 'pre', round: 1 });
    const split = (id) => {
      for (let r = 0; r < REG_ROUNDS; r++) cal.push({ phase: id, kind: 'reg', round: r });
      for (let r = 0; r < 3; r++) cal.push({ phase: id, kind: 'po', round: r });
    };
    split('winter');
    split('spring');
    for (let r = 0; r < 3; r++) cal.push({ phase: 'msi', round: r });
    split('summer');
    for (let r = 0; r < 6; r++) cal.push({ phase: 'worlds', round: r });
    for (let r = 0; r < 4; r++) cal.push({ phase: 'off', round: r });
    return cal;
  };

  Season.turnDate = function (S, idx = S.turn) {
    if (S.amateur) {
      return { day: 1, month: idx, text: C.MONTHS[idx] + ' de ' + S.year };
    }
    const d = new Date(S.year, 0, 6 + 7 * idx);
    return { day: d.getDate(), month: d.getMonth(), text: d.getDate() + ' de ' + C.MONTHS[d.getMonth()] + ' de ' + S.year };
  };

  Season.turnLabel = function (S, t = S.cal[S.turn]) {
    if (!t) return '';
    switch (t.phase) {
      case 'amateur': return 'Etapa amateur';
      case 'pre': return 'Pretemporada';
      case 'off': return 'Mercado de fichajes';
      case 'msi': return ['MSI · Cuartos', 'MSI · Semifinales', 'MSI · Final'][t.round];
      case 'worlds': return ['Worlds · Grupos J1', 'Worlds · Grupos J2', 'Worlds · Grupos J3', 'Worlds · Cuartos', 'Worlds · Semifinales', 'Worlds · Final'][t.round];
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
      leagues[lg] = { teams, sched: rounds.slice(0, REG_ROUNDS).map((r) => r.map(([a, b]) => ({ a, b, res: null }))), table, po: null, champion: null, place: null };
    }
    S.comp.split = { id: phase, leagues };
  }

  Season.sortedTable = function (L) {
    return Object.entries(L.table)
      .sort((x, y) => y[1].w - x[1].w || (y[1].gw - y[1].gl) - (x[1].gw - x[1].gl) || x[0].localeCompare(y[0]))
      .map(([tid, r]) => Object.assign({ tid }, r));
  };

  function mk(a, b, bo) { return { a, b, bo, res: null }; }

  function initPlayoffs(L) {
    const s = Season.sortedTable(L).map((r) => r.tid);
    L.po = { seeds: s.slice(0, 6), rounds: [[mk(s[2], s[5], 5), mk(s[3], s[4], 5)], [], []] };
  }

  function bracket8(seeds, bo = 5) {
    const s = seeds;
    return { seeds: s, rounds: [[mk(s[0], s[7], bo), mk(s[3], s[4], bo), mk(s[1], s[6], bo), mk(s[2], s[5], bo)], [], []] };
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

  // Juega una serie y avisa si participa el usuario
  function play(S, m, ctx, report) {
    const res = Sim.playSeries(S, m.a, m.b, m.bo);
    m.res = { winner: res.winner, loser: res.loser, sa: res.sa, sb: res.sb };
    const uid = S.pl.teamId;
    if (uid && (m.a === uid || m.b === uid)) {
      RC.P.recordSeries(S, res, ctx);
      report.user = Object.assign({ ctx }, res);
    }
    return res;
  }

  // Prepara la jornada actual: crea calendario, cuadros y cruces antes de jugarla,
  // para que el rival se vea con antelación. Es idempotente.
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
            const w = L.po.rounds[0].map((m) => m.res.winner);
            L.po.rounds[1] = [mk(L.po.seeds[0], w[1], 5), mk(L.po.seeds[1], w[0], 5)];
          }
          if (t.round >= 2 && !L.po.rounds[2].length) {
            const w = L.po.rounds[1].map((m) => m.res.winner);
            L.po.rounds[2] = [mk(w[0], w[1], 5)];
          }
        }
      }
    } else if (t.phase === 'msi') {
      if (!S.comp.msi) initMSI(S);
      for (const e of [S.comp.msi, S.comp.emea]) nextBracketRounds(e, t.round);
    } else if (t.phase === 'worlds') {
      if (!S.comp.worlds) initWorlds(S);
      const wd = S.comp.worlds;
      if (t.round >= 3) {
        if (!wd.rounds[0].length) {
          const gt = wd.groups.map((g) => Season.groupTable(wd, g).map((x) => x.tid));
          wd.rounds[0] = [mk(gt[0][0], gt[1][1], 5), mk(gt[2][0], gt[3][1], 5), mk(gt[1][0], gt[0][1], 5), mk(gt[3][0], gt[2][1], 5)];
        }
        nextBracketRounds(wd, t.round - 3);
      }
    }
    return ev;
  };

  function nextBracketRounds(e, round) {
    if (round >= 1 && !e.rounds[1].length) {
      const w = e.rounds[0].map((m) => m.res.winner);
      e.rounds[1] = [mk(w[0], w[1], 5), mk(w[2], w[3], 5)];
    }
    if (round >= 2 && !e.rounds[2].length) {
      const w = e.rounds[1].map((m) => m.res.winner);
      e.rounds[2] = [mk(w[0], w[1], 5)];
    }
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
      const all = t.phase === 'msi' ? [S.comp.msi, S.comp.emea] : [S.comp.worlds];
      for (const e of all) {
        if (!e) continue;
        const list = e.groups ? (t.round < 3 ? e.groupRounds[t.round] : e.rounds[t.round - 3]) : e.rounds[t.round];
        const m = find(list);
        if (m) return { a: m.a, b: m.b, bo: m.bo, label: e.name + ' · ' + label.split('· ')[1] };
      }
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
            m.bo = 1;
            const r = play(S, m, { comp: C.LEAGUES[lg].name, label: Season.turnLabel(S, t) }, report);
            const ta = L.table[m.a], tb = L.table[m.b];
            (r.winner === m.a ? ta : tb).w++;
            (r.winner === m.a ? tb : ta).l++;
            ta.gw += r.sa; ta.gl += r.sb; tb.gw += r.sb; tb.gl += r.sa;
          }
        }
      } else {
        for (const [lg, L] of Object.entries(S.comp.split.leagues)) {
          for (const m of L.po.rounds[t.round]) if (!m.res) play(S, m, { comp: C.LEAGUES[lg].name, label: Season.turnLabel(S, t), playoff: true }, report);
          if (t.round === 2 && !L.champion) finishSplit(S, t.phase, lg, L, report);
        }
      }
    } else if (t.phase === 'msi') {
      for (const ev of [S.comp.msi, S.comp.emea]) playBracketRound(S, ev, t.round, report);
    } else if (t.phase === 'worlds') {
      playWorldsRound(S, S.comp.worlds, t.round, report);
    }
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
    const uid = S.pl.teamId;
    if (uid && L.place[uid]) RC.P.onSplitEnd(S, phase, lg, L.place[uid]);
  }

  function rank(S, phase, lg) {
    const d = S.comp.done[phase] && S.comp.done[phase][lg];
    if (!d) return W.leagueTeams(S, lg).map((t) => t.id);
    return Object.entries(d.place).sort((a, b) => a[1] - b[1]).map(([t]) => t);
  }

  function initMSI(S) {
    const sp = (lg, n) => rank(S, 'spring', lg).slice(0, n);
    const msi = [sp('LCK', 1), sp('LPL', 1), sp('LEC', 1), sp('LCS', 1), sp('LCK', 2).slice(1), sp('LPL', 2).slice(1), sp('LEC', 2).slice(1), sp('LCP', 1)].flat();
    S.comp.msi = Object.assign(bracket8(msi), { name: 'MSI', id: 'msi' });
    const em = [sp('LES', 1), sp('LFL', 1), sp('PL', 1), sp('NLC', 1), sp('TCL', 1), sp('LES', 2).slice(1), sp('LFL', 2).slice(1), sp('PL', 2).slice(1)].flat();
    S.comp.emea = Object.assign(bracket8(U.shuffle(em)), { name: 'EMEA Masters', id: 'emea' });
  }

  function playBracketRound(S, ev, round, report) {
    for (const m of ev.rounds[round]) if (!m.res) play(S, m, { comp: ev.name, label: ev.name, playoff: true, intl: ev.id }, report);
    if (round === 2 && !ev.champion) {
      const f = ev.rounds[2][0].res;
      ev.champion = f.winner;
      report.headlines.push(`${S.world.teams[f.winner].name} se proclama campeón del ${ev.name}.`);
      const uid = S.pl.teamId;
      if (uid && ev.seeds.includes(uid)) {
        let place = 5;
        if (f.winner === uid) place = 1; else if (f.loser === uid) place = 2;
        else if (ev.rounds[1].some((m) => m.res.loser === uid)) place = 3;
        RC.P.onIntlEnd(S, ev.id, ev.name, place);
      }
    }
  }

  function initWorlds(S) {
    const pts = S.comp.points;
    const top = (lg, n) => W.leagueTeams(S, lg).map((t) => t.id)
      .sort((a, b) => (pts[b] || 0) - (pts[a] || 0) || ((S.comp.done.summer?.[lg]?.place[a] || 99) - (S.comp.done.summer?.[lg]?.place[b] || 99)))
      .slice(0, n);
    const lck = top('LCK', 4), lpl = top('LPL', 4), lec = top('LEC', 3), lcs = top('LCS', 2), lcp = top('LCP', 2), cbl = top('CBLOL', 1);
    const pots = [
      [lck[0], lpl[0], lec[0], lcs[0]],
      [lck[1], lpl[1], lec[1], lcp[0]],
      [lck[2], lpl[2], lec[2], cbl[0]],
      [lck[3], lpl[3], lcs[1], lcp[1]],
    ].map((p) => U.shuffle(p));
    const groups = [0, 1, 2, 3].map((g) => pots.map((p) => p[g]));
    const groupRounds = [0, 1, 2].map((r) => {
      const pairs = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]][r];
      return groups.flatMap((g) => pairs.map(([i, j]) => mk(g[i], g[j], 1)));
    });
    const table = {};
    groups.flat().forEach((t) => (table[t] = { w: 0, l: 0, gw: 0, gl: 0 }));
    S.comp.worlds = { name: 'Worlds', id: 'worlds', seeds: groups.flat(), groups, groupRounds, table, rounds: [[], [], []] };
  }

  Season.groupTable = function (ev, g) {
    return g.map((tid) => Object.assign({ tid }, ev.table[tid])).sort((a, b) => b.w - a.w || (b.gw - b.gl) - (a.gw - a.gl));
  };

  function playWorldsRound(S, ev, round, report) {
    const ctx = { comp: 'Worlds', label: 'Worlds', intl: 'worlds' };
    const uid = S.pl.teamId;
    if (round < 3) {
      for (const m of ev.groupRounds[round]) {
        if (m.res) continue;
        const r = play(S, m, Object.assign({}, ctx, { label: 'Worlds · Fase de grupos' }), report);
        const ta = ev.table[m.a], tb = ev.table[m.b];
        (r.winner === m.a ? ta : tb).w++;
        (r.winner === m.a ? tb : ta).l++;
        ta.gw += r.sa; ta.gl += r.sb; tb.gw += r.sb; tb.gl += r.sa;
      }
      if (round === 2 && uid && ev.seeds.includes(uid)) {
        const g = ev.groups.map((x) => Season.groupTable(ev, x).map((r) => r.tid)).find((x) => x.includes(uid));
        if (g.indexOf(uid) >= 2) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 9);
      }
      return;
    }
    const r = round - 3;
    for (const m of ev.rounds[r]) if (!m.res) play(S, m, Object.assign({}, ctx, { label: 'Worlds · ' + ['Cuartos', 'Semifinales', 'Final'][r], playoff: true }), report);
    if (r === 0 && uid && ev.rounds[0].some((m) => m.res.loser === uid)) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 5);
    if (r === 1 && uid && ev.rounds[1].some((m) => m.res.loser === uid)) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 3);
    if (r === 2 && !ev.champion) {
      const f = ev.rounds[2][0].res;
      ev.champion = f.winner;
      report.headlines.push(`${S.world.teams[f.winner].name} es CAMPEÓN DEL MUNDO ${S.year}.`);
      if (uid === f.winner) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 1);
      else if (uid === f.loser) RC.P.onIntlEnd(S, 'worlds', 'Worlds', 2);
    }
  }

  RC.Season = Season;
})(window.RC);
