/* Carga de datos estáticos (jugadores reales 2026, campeones y equipos). */
(function (RC) {
  const D = { players: [], champions: {}, teams: {}, champVersion: '', champRoles: {}, roleChamps: {} };
  const FIX = { LeBlanc: 'Leblanc', MFortune: 'MissFortune', Wukong: 'MonkeyKing', Nunu: 'Nunu', RenataGlasc: 'Renata', KhaZix: 'Khazix', ChoGath: 'Chogath', VelKoz: 'Velkoz', KaiSa: 'Kaisa', BelVeth: 'Belveth', KogMaw: 'KogMaw', RekSai: 'RekSai' };

  D.fixChamp = (id) => FIX[id] || id;
  D.champName = (id) => (D.champions[id] ? D.champions[id].name : id);
  D.champImg = (id) => 'assets/champions/' + id + '.png';

  D.load = async function () {
    const [pl, ch, tm] = await Promise.all([
      fetch('data/players.json').then((r) => r.json()),
      fetch('data/champions.json').then((r) => r.json()),
      fetch('data/teams.json').then((r) => r.json()),
    ]);
    D.champions = ch.champions;
    D.champVersion = ch.version;
    D.teams = tm;
    D.players = pl.map((p) => Object.assign({}, p, { pool: (p.pool || []).map(D.fixChamp).filter((c) => D.champions[c]) }));
    buildChampRoles();
  };

  // Rol(es) de cada campeón: se deduce de los pools reales por rol y, si no aparece, de sus etiquetas.
  function buildChampRoles() {
    const count = {};
    for (const p of D.players) {
      for (const c of p.pool) {
        count[c] = count[c] || {};
        count[c][p.role] = (count[c][p.role] || 0) + 1;
      }
    }
    const roleChamps = { Top: [], Jungle: [], Mid: [], ADC: [], Support: [] };
    for (const id of Object.keys(D.champions)) {
      let roles = [];
      const cnt = count[id];
      if (cnt) {
        const total = Object.values(cnt).reduce((a, b) => a + b, 0);
        roles = Object.keys(cnt).filter((r) => cnt[r] / total >= 0.2);
      }
      if (!roles.length) {
        const t = D.champions[id].tags;
        if (t.includes('Marksman')) roles.push('ADC');
        else if (t.includes('Support')) roles.push('Support');
        if (!roles.length && (t.includes('Assassin') || t.includes('Mage'))) roles.push('Mid');
        if (!t.includes('Marksman') && (t.includes('Fighter') || t.includes('Tank'))) roles.push('Top');
        if (t.includes('Fighter') && (t.includes('Assassin') || t.includes('Tank'))) roles.push('Jungle');
        if (!roles.length) roles.push('Mid');
      }
      D.champRoles[id] = roles;
      for (const r of roles) roleChamps[r].push({ id, pop: cnt ? cnt[r] || 0 : 0 });
    }
    for (const r of Object.keys(roleChamps)) {
      roleChamps[r].sort((a, b) => b.pop - a.pop || a.id.localeCompare(b.id));
    }
    D.roleChamps = roleChamps;
  }

  D.champsForRole = (role) => D.roleChamps[role].map((c) => c.id);

  // Genera un pool verosímil para un jugador sin datos
  D.randomPool = (role, n = 4) => {
    const list = D.roleChamps[role];
    const chosen = new Set();
    let guard = 0;
    while (chosen.size < n && guard++ < 200) {
      const c = RC.U.weighted(list, (x) => 1 + x.pop * 3);
      chosen.add(c.id);
    }
    return [...chosen];
  };

  RC.D = D;
})(window.RC);
