/* El mundo profesional: jugadores, equipos y su evolución año a año. */
(function (RC) {
  const { U, C, D } = RC;
  const W = {};

  W.ovr = (p) => 0.4 * p.mech + 0.35 * p.macro + 0.25 * p.ment;

  W.init = function () {
    const players = {};
    const teams = {};
    let n = 0;
    for (const t of Object.values(D.teams)) {
      teams[U.slug(t.name)] = {
        id: U.slug(t.name), name: t.name, short: t.short, league: t.league, logo: t.logo,
        color: U.hashColor(t.name), roster: {},
      };
    }
    const byTeam = {};
    for (const src of D.players) {
      const id = 'p' + n++;
      const p = {
        id, name: src.name, role: src.role, age: src.age, mech: src.mech, macro: src.macro, ment: src.ment,
        pool: src.pool.length ? src.pool.slice(0, 5) : D.randomPool(src.role), team: null, form: 0,
      };
      players[id] = p;
      const tid = U.slug(src.team);
      (byTeam[tid] = byTeam[tid] || []).push(p);
    }
    for (const [tid, list] of Object.entries(byTeam)) {
      const team = teams[tid];
      if (!team) continue;
      for (const role of C.ROLES) {
        const cands = list.filter((p) => p.role === role).sort((a, b) => W.ovr(b) - W.ovr(a));
        if (cands[0]) {
          team.roster[role] = cands[0].id;
          cands[0].team = tid;
        }
      }
    }
    const world = { players, teams, nextId: n, retired: [] };
    world.target = W.topMean(world);
    // Rellena huecos con jóvenes generados
    for (const team of Object.values(teams)) {
      for (const role of C.ROLES) {
        if (!team.roster[role]) {
          const p = W.newRookie(world, role, team.league);
          p.team = team.id;
          team.roster[role] = p.id;
        }
      }
    }
    return world;
  };

  const SYL_A = ['Kai', 'Zen', 'Rox', 'Vex', 'Nyx', 'Ryu', 'Lux', 'Tor', 'Mav', 'Shi', 'Jin', 'Kor', 'Fae', 'Dra', 'Vel', 'Sol', 'Hex', 'Ash', 'Bly', 'Cro', 'Rin', 'Yuk', 'Tae', 'Hyu', 'Min', 'Xia', 'Lan', 'Fen', 'Gal', 'Ori', 'Pip', 'Qin', 'Sky', 'Wen', 'Zed', 'Nox', 'Ivo', 'Kas', 'Leo', 'Mio'];
  const SYL_B = ['o', 'ix', 'er', 'ah', 'en', 'ra', 'on', 'is', 'us', 'ey', 'ko', 'ma', 'ru', 'an', 'ar', 'el', 'yn', 'ze', 'ki', 'ta', '', '', ''];
  // Media de los 200 mejores jugadores con equipo: sirve para mantener estable el nivel del mundo
  W.topMean = (world) => U.avg(Object.values(world.players).filter((p) => p.team).map(W.ovr).sort((a, b) => b - a).slice(0, 200));

  W.rookieName = function (world) {
    const used = new Set(Object.values(world.players).map((p) => p.name.toLowerCase()));
    for (let i = 0; i < 50; i++) {
      const name = U.pick(SYL_A) + U.pick(SYL_B) + (U.chance(0.12) ? U.pick(['X', 'Z', '7', '1', 'Q']) : '');
      if (!used.has(name.toLowerCase())) return name;
    }
    return 'Rookie' + U.randInt(100, 999);
  };

  W.newRookie = function (world, role, league) {
    const L = C.LEAGUES[league] || C.LEAGUES.LES;
    // Algunos jóvenes salen con mucho talento y crecerán rápido
    const talent = U.chance(0.12) ? U.rand(1.3, 1.7) : U.rand(0.8, 1.15);
    const base = L.req - U.rand(2, 7) + (talent > 1.2 ? 3 : 0);
    const id = 'p' + world.nextId++;
    const p = {
      id, name: W.rookieName(world), role, age: U.randInt(17, 19),
      mech: U.round1(base + U.rand(-3, 4)), macro: U.round1(base + U.rand(-4, 2)), ment: U.round1(base + U.rand(-3, 3)),
      pool: D.randomPool(role), team: null, form: 0, rookie: true, talent: U.round1(talent),
    };
    world.players[id] = p;
    return p;
  };

  W.teamOf = (S, tid) => S.world.teams[tid];
  W.leagueTeams = (S, league) => Object.values(S.world.teams).filter((t) => t.league === league);

  // Valor de un campeón para un jugador IA según el parche
  W.npcChampBonus = function (S, p) {
    const metas = p.pool.map((c) => S.patch.meta[c] || 0).sort((a, b) => b - a);
    return (metas[0] || 0) * 0.6 + (metas[1] || 0) * 0.2;
  };

  // Rendimiento efectivo de un jugador IA en un partido
  W.npcEff = (S, p) => W.ovr(p) + p.form + W.npcChampBonus(S, p);

  W.teamAvgOvr = function (S, team) {
    const vals = C.ROLES.map((r) => {
      const pid = team.roster[r];
      if (pid === 'USER') return RC.P.ovr(S);
      const p = S.world.players[pid];
      return p ? W.ovr(p) : 60;
    });
    return U.avg(vals);
  };

  // Cambios de forma de los jugadores IA (se llama cada jornada)
  W.tickForm = function (S) {
    for (const p of Object.values(S.world.players)) {
      if (!p.team) continue;
      p.form = U.clamp(p.form * 0.85 + U.gauss() * 0.6, -3, 3);
    }
  };

  // Fin de año: envejecimiento, retiradas, jóvenes y fichajes de la IA
  W.yearEnd = function (S) {
    const world = S.world;
    const news = [];
    for (const p of Object.values(world.players)) {
      p.age += 1;
      let d;
      if (p.age <= 20) d = U.rand(1, 4) * (p.talent || 1);
      else if (p.age <= 23) d = U.rand(0, 2.5) * (p.talent || 1);
      else if (p.age <= 26) d = U.rand(-1, 1);
      else if (p.age <= 28) d = U.rand(-2, 0.5);
      else d = U.rand(-3.5, 0);
      const cap = 99;
      p.mech = U.round1(U.clamp(p.mech + d * 1.2 + U.rand(-0.5, 0.5), 40, cap));
      p.macro = U.round1(U.clamp(p.macro + d * 0.8 + U.rand(-0.5, 0.5), 40, cap));
      p.ment = U.round1(U.clamp(p.ment + d * 0.9 + U.rand(-0.5, 0.5), 40, cap));
      p.form = 0;
    }
    // Retiradas
    for (const p of Object.values(world.players)) {
      const o = W.ovr(p);
      const retire = (p.age >= 29 && (o < 77 || U.chance(0.12 * (p.age - 28)))) || p.age >= 35 || (!p.team && p.age >= 27 && U.chance(0.5));
      if (retire) {
        if (p.team) {
          const t = world.teams[p.team];
          if (t && t.roster[p.role] === p.id) t.roster[p.role] = null;
          if (o >= 86) news.push(`${p.name} anuncia su retirada tras una gran carrera.`);
        }
        world.retired.push(p.name);
        delete world.players[p.id];
      }
    }
    // Fichajes de la IA: los mejores de ligas menores suben
    const order = C.LEAGUE_ORDER.slice().sort((a, b) => C.LEAGUES[a].tier - C.LEAGUES[b].tier);
    let moves = 0;
    for (const lg of order) {
      const L = C.LEAGUES[lg];
      for (const team of U.shuffle(W.leagueTeams(S, lg))) {
        for (const role of C.ROLES) {
          const curId = team.roster[role];
          if (curId === 'USER') continue;
          const cur = curId ? world.players[curId] : null;
          const curO = cur ? W.ovr(cur) : 0;
          if (cur && (moves > 60 || !U.chance(0.35))) continue;
          let best = null, bestO = curO + 2.5;
          for (const p of Object.values(world.players)) {
            if (p.role !== role || p.age > 28) continue;
            const pt = p.team ? world.teams[p.team] : null;
            if (pt && (C.LEAGUES[pt.league].tier <= L.tier)) continue;
            if (pt && pt.roster[role] === 'USER') continue;
            const o = W.ovr(p);
            if (o > bestO && (!pt || U.chance(0.7))) { best = p; bestO = o; }
          }
          if (best) {
            const fromTeam = best.team ? world.teams[best.team] : null;
            if (fromTeam) fromTeam.roster[role] = null;
            if (cur) {
              cur.team = null;
              if (fromTeam) { fromTeam.roster[role] = cur.id; cur.team = fromTeam.id; }
            }
            team.roster[role] = best.id;
            best.team = team.id;
            moves++;
            if (L.tier <= 2 && W.ovr(best) >= 84) news.push(`${team.name} ficha a ${best.name} (${C.ROLE_ES[role]}).`);
          } else if (!cur) {
            // hueco: agente libre o rookie
            const fa = Object.values(world.players).filter((p) => !p.team && p.role === role).sort((a, b) => W.ovr(b) - W.ovr(a))[0];
            const p = fa && W.ovr(fa) >= L.req - 6 ? fa : W.newRookie(world, role, lg);
            p.team = team.id;
            team.roster[role] = p.id;
          }
        }
      }
    }
    // Los huecos que queden se rellenan
    for (const team of Object.values(world.teams)) {
      for (const role of C.ROLES) {
        if (!team.roster[role]) {
          const p = W.newRookie(world, role, team.league);
          p.team = team.id;
          team.roster[role] = p.id;
        }
      }
    }
    // Limpia agentes libres antiguos para no inflar la partida guardada
    const fas = Object.values(world.players).filter((p) => !p.team);
    if (fas.length > 250) {
      fas.sort((a, b) => W.ovr(a) - W.ovr(b)).slice(0, fas.length - 250).forEach((p) => delete world.players[p.id]);
    }
    if (world.retired.length > 300) world.retired = world.retired.slice(-300);
    // Recalibra el nivel global para que el mundo no se debilite con los años
    if (world.target) {
      const gap = world.target - W.topMean(world);
      if (Math.abs(gap) > 0.2) {
        for (const p of Object.values(world.players)) {
          const k = p.age <= 25 ? 1 : 0.5;
          const g = gap * 0.8 * k;
          p.mech = U.round1(U.clamp(p.mech + g, 40, 99)); p.macro = U.round1(U.clamp(p.macro + g, 40, 99)); p.ment = U.round1(U.clamp(p.ment + g, 40, 99));
        }
      }
    }
    // Pools: algunos jugadores cambian un campeón
    for (const p of Object.values(world.players)) {
      if (U.chance(0.4)) {
        const extra = D.randomPool(p.role, 1)[0];
        if (!p.pool.includes(extra)) p.pool[U.randInt(0, p.pool.length - 1)] = extra;
      }
    }
    return news;
  };

  RC.W = W;
})(window.RC);
