/* Simulación de partidas. Todo automático: draft, partida y estadísticas. */
(function (RC) {
  const { U, C, W } = RC;
  const Sim = {};

  const BASE = {
    Top: { k: 2.6, d: 2.6, a: 4.5, cs: 8.0 },
    Jungle: { k: 3.0, d: 2.8, a: 7.0, cs: 5.6 },
    Mid: { k: 3.6, d: 2.4, a: 5.5, cs: 8.6 },
    ADC: { k: 4.5, d: 2.2, a: 5.0, cs: 9.6 },
    Support: { k: 0.8, d: 3.0, a: 10.0, cs: 1.2 },
  };

  function lineFor(S, team, role) {
    const pid = team.roster[role];
    if (pid === 'USER') return { user: true };
    return { p: S.world.players[pid] };
  }

  // Juega un mapa. Devuelve true si gana A, y la línea de estadísticas del usuario si participa.
  Sim.playGame = function (S, A, B) {
    const userIn = A.roster[S.pl.role] === 'USER' ? 'A' : B.roster[S.pl.role] === 'USER' ? 'B' : null;
    let perf = 0, userEff = 0, champ = null, oppP = null;
    if (userIn) {
      const opp = userIn === 'A' ? B : A;
      oppP = S.world.players[opp.roster[S.pl.role]];
      champ = RC.P.draftChamp(S);
      userEff = RC.P.matchEff(S, champ);
      const oppEff = oppP ? W.npcEff(S, oppP) : 75;
      perf = U.clamp((userEff - oppEff) / 5, -1.8, 1.8) + U.gauss() * 0.95 + RC.P.luck(S) / 40;
    }
    const eff = (T, side) => {
      const vals = C.ROLES.map((r) => {
        const l = lineFor(S, T, r);
        if (l.user) return userEff + perf * 1.2;
        return l.p ? W.npcEff(S, l.p) : 70;
      });
      let e = U.avg(vals);
      if (userIn === side && S.pl.style === 'shotcaller') e += 0.4;
      return e;
    };
    const diff = eff(A, 'A') - eff(B, 'B') + U.gauss() * 1.3;
    const aWins = Math.random() < U.logistic(diff / 3.2);
    let line = null;
    if (userIn) {
      const win = (userIn === 'A') === aWins;
      line = Sim.userLine(S, perf, win, champ, oppP);
    }
    return { aWins, line };
  };

  function around(mean) {
    return Math.max(0, Math.round(mean + U.gauss() * Math.sqrt(Math.max(0.3, mean)) * 0.8));
  }

  Sim.userLine = function (S, perf, win, champ, oppP) {
    const b = BASE[S.pl.role];
    const wk = win ? 1.35 : 0.65, wd = win ? 0.7 : 1.3;
    let km = b.k * wk * (1 + 0.25 * perf), dm = b.d * wd * Math.max(0.3, 1 - 0.2 * perf), am = b.a * wk * (1 + 0.12 * perf);
    if (S.pl.style === 'agresivo') { km *= 1.15; dm *= 1.15; }
    const k = around(km), d = around(dm), a = around(am);
    let cs = b.cs + perf * 0.4 + (S.pl.attrs.farmeo - 75) * 0.03 + U.gauss() * 0.35 + (win ? 0.3 : -0.3);
    if (S.pl.style === 'farmeador') cs += 0.4;
    cs = Math.max(S.pl.role === 'Support' ? 0.6 : 3.5, cs);
    const kda = (k + a) / Math.max(1, d);
    let rating = 6.4 + perf * 0.85 + (win ? 0.5 : -0.5) + U.clamp((kda - 3) * 0.15, -0.6, 0.8);
    rating = U.clamp(U.round1(rating), 2.5, 10);
    return { win, k, d, a, cs: U.round1(cs), rating, champ, opp: oppP ? oppP.name : '?', oppChamp: oppP ? U.pick(oppP.pool) : null };
  };

  // Serie al mejor de bo. Devuelve el resultado completo.
  Sim.playSeries = function (S, aId, bId, bo) {
    const A = S.world.teams[aId], B = S.world.teams[bId];
    const need = Math.ceil(bo / 2);
    let sa = 0, sb = 0;
    const games = [];
    while (sa < need && sb < need) {
      const g = Sim.playGame(S, A, B);
      if (g.aWins) sa++; else sb++;
      if (g.line) games.push(g.line);
    }
    return { a: aId, b: bId, sa, sb, winner: sa > sb ? aId : bId, loser: sa > sb ? bId : aId, bo, games };
  };

  RC.Sim = Sim;
})(window.RC);
