// Prueba sin interfaz: node tools/headless.js [pro|kid] [años] [estrategia]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { console, Math, Date, JSON, Promise, setTimeout, localStorage: { getItem: () => null, setItem: () => {} } };
ctx.window = ctx;
ctx.fetch = async (u) => ({ json: async () => JSON.parse(fs.readFileSync(path.join(root, u), 'utf8')) });
vm.createContext(ctx);
for (const f of ['util', 'constants', 'data', 'world', 'sim', 'season', 'career']) vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
const RC = ctx.RC;
(async () => {
  await RC.D.load();
  const mode = process.argv[2] || 'pro', years = +(process.argv[3] || 6), strat = process.argv[4] || 'good';
  const S = RC.P.newGame({ mode, name: 'Test', nation: 'ES', role: 'Mid', style: 'estratega', champs: RC.D.champsForRole('Mid').slice(0, 3) });
  if (S.startOffers) RC.P.startPro(S, S.startOffers[0]);
  const P = RC.P;
  const train = ['train_mec', 'train_farm', 'vods', 'map', 'mental', 'scrim', 'premade'];
  let lastYear = S.year;
  const log = () => console.log(S.year, 'edad', S.pl.age, 'OVR', P.ovr(S).toFixed(1), 'rango', P.rankInfo(S.pl.lp).name, 'equipo', P.team(S)?.name || '-', P.team(S) ? RC.C.LEAGUES[P.team(S).league].name : '', 'dinero', Math.round(S.pl.money), 'fans', S.pl.fans, 'títulos', S.pl.titles.length);
  log();
  let guard = 0;
  while (!S.over && S.year < lastYear + years && guard++ < 5000) {
    // compras y staff
    if (strat === 'good') {
      for (const g of RC.C.GEAR) { const l = P.gearLevel(S, g.id); if (l < 5 && S.pl.money > g.prices[l] * 2) P.buyGear(S, g.id); }
      if (!S.pl.staff.coach && S.pl.money > 6000) P.toggleStaff(S, 'coach');
      if (!S.pl.staff.nutri && S.pl.money > 8000) P.toggleStaff(S, 'nutri');
      if (!S.pl.staff.agente && S.pl.contract) P.toggleStaff(S, 'agente');
    }
    for (const so of S.sponsorOffers.slice()) P.acceptSponsor(S, so.id);
    while (P.actionsLeft(S) > 0) {
      let id;
      if (P.pendingPromos(S)) id = 'promo';
      else if (S.pl.energy < 30) id = 'rest';
      else {
        const opts = P.availableActions(S).filter(a => train.includes(a.id));
        const r = Math.random();
        if (strat === 'lazy') id = r < 0.5 ? 'stream' : r < 0.7 ? 'rest' : 'soloq';
        else id = r < 0.2 ? 'soloq' : r < 0.3 ? 'champ' : r < 0.36 ? 'stream' : opts.sort((a, b) => S.pl.attrs[a.stat] - S.pl.attrs[b.stat])[0].id;
      }
      const res = P.doAction(S, id, S.pl.pool[0]);
      if (!res.ok) { P.doAction(S, 'rest'); }
    }
    // ofertas: aceptar la de mejor liga
    if (S.offers.length) {
      const best = S.offers.slice().sort((a, b) => RC.C.LEAGUES[S.world.teams[a.teamId].league].tier - RC.C.LEAGUES[S.world.teams[b.teamId].league].tier)[0];
      const cur = P.team(S);
      const bt = RC.C.LEAGUES[S.world.teams[best.teamId].league].tier;
      if (!cur || bt < RC.C.LEAGUES[cur.league].tier || best.renewal || S.amateur) {
        const r = P.negotiate(S, best.id, best.salary * 1.15);
        if (!r.ok && !r.gone) P.acceptOffer(S, best.id);
        if (S.amateur === false && r.ok !== undefined) {}
      }
    }
    // ofrecerse
    if (!S.amateur && RC.Season.isWindowOpen(S)) {
      const tops = Object.values(S.world.teams).filter(t => RC.C.LEAGUES[t.league].tier < (P.team(S) ? RC.C.LEAGUES[P.team(S).league].tier : 9)).sort((a,b)=>RC.C.LEAGUES[a.league].tier-RC.C.LEAGUES[b.league].tier);
      for (const t of tops.slice(0, 2)) P.offerSelf(S, t.id);
    }
    const rep = P.advance(S);
    if (S.year !== lastYear) { log(); lastYear = S.year; }
  }
  log();
  console.log('títulos', S.pl.titles.map(t => t.name).join(' | '));
  console.log('premios', S.pl.awards.map(t => t.name).join(' | '));
  console.log('carrera', JSON.stringify(S.pl.stats.career), 'over', S.over, S.overReason || '');
  console.log('attrs', JSON.stringify(S.pl.attrs));
  console.log('tamaño guardado KB', Math.round(JSON.stringify(S).length / 1024));
})().catch(e => { console.error(e); process.exit(1); });
