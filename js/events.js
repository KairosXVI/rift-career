/* Decisiones, mensajes, estatus en el equipo, contactos con jugadores, peticiones de fichaje,
   rumores y momentos clave con minijuego. */
(function (RC) {
  const { U, C, D, W, P } = RC;
  const EV = {};

  // ---------- Utilidades ----------
  const addAttr = (S, id, v) => { S.pl.attrs[id] = U.round1(U.clamp(S.pl.attrs[id] + v * (v > 0 ? Math.max(0.15, (100 - S.pl.attrs[id]) / 30) : 1), 1, 99)); };
  const addAll = (S, v) => C.ATTRS.forEach((a) => addAttr(S, a.id, v));
  const morale = (S, v) => (S.pl.morale = U.clamp(S.pl.morale + v, 0, 100));
  const energy = (S, v) => (S.pl.energy = U.clamp(S.pl.energy + v, 0, 100));
  const rel = (S, v) => (S.pl.clubRel = U.clamp((S.pl.clubRel == null ? 55 : S.pl.clubRel) + v, 0, 100));
  const fansPct = (S, pct, min = 0) => { const n = Math.round(Math.max(min, S.pl.fans * pct)); S.pl.fans = Math.max(0, S.pl.fans + n); return n; };
  const money = (S, v) => { S.pl.money += v; if (v > 0) S.pl.earned += v; };
  const teammates = (S) => { const t = P.team(S); return t ? C.ROLES.filter((r) => t.roster[r] !== 'USER').map((r) => S.world.players[t.roster[r]]).filter(Boolean) : []; };
  const nowText = (S) => RC.Season.turnDate(S).text;

  // ---------- Estatus en el equipo ----------
  EV.STATUS = {
    promesa: { name: 'Promesa', w: 0.05, desc: 'Estás por debajo del nivel del equipo. El club no atiende peticiones de fichaje.' },
    titular: { name: 'Titular', w: 0.3, desc: 'Estás al nivel del equipo. El club atiende pocas peticiones.' },
    estrella: { name: 'Estrella', w: 0.6, desc: 'Eres de los mejores del equipo. El club te escucha y los jugadores aceptan más tus propuestas.' },
    capitan: { name: 'Capitán', w: 0.65, desc: 'Llevas tiempo en el club y tiras del vestuario: más moral y un pequeño extra del equipo en los partidos.' },
    franquicia: { name: 'Jugador franquicia', w: 0.88, desc: 'El equipo gira a tu alrededor. Te consultan los fichajes si van mal las cosas y casi siempre aceptan tus peticiones.' },
  };
  EV.status = function (S) {
    const team = P.team(S);
    if (!team) return null;
    const mates = teammates(S).map((p) => W.ovr(p));
    const me = P.ovr(S);
    const avg = U.avg(mates);
    const splits = S.pl.clubSplits || 0;
    let id;
    if (me >= Math.max(...mates) && splits >= 3 && S.pl.fans >= 30000) id = 'franquicia';
    else if (me >= avg - 3 && splits >= 6) id = 'capitan';
    else if (me > avg + 3) id = 'estrella';
    else if (me >= avg - 3) id = 'titular';
    else id = 'promesa';
    return Object.assign({ id, diff: me - avg }, EV.STATUS[id]);
  };
  EV.statusW = (S) => { const s = EV.status(S); return s ? s.w : 0; };

  // ---------- Bandeja de mensajes ----------
  EV.inbox = (S) => (S.inbox = S.inbox || []);
  EV.unread = (S) => EV.inbox(S).filter((m) => !m.read || (m.options && !m.resolved)).length;
  EV.pending = (S) => EV.inbox(S).filter((m) => m.options && !m.resolved);
  EV.msg = function (S, m) {
    const box = EV.inbox(S);
    const full = Object.assign({ id: U.uid(), clock: S.clock || 0, when: nowText(S), read: false, resolved: false }, m);
    box.unshift(full);
    if (box.length > 60) box.length = 60;
    return full;
  };

  // ---------- Catálogo de decisiones ----------
  // make(S) devuelve { from, title, text, options:[{label, hint, mg?}], data, def } o null.
  // apply(S, data, i, score) devuelve el texto del resultado.
  const H = { safe: 'Seguro', mid: 'Equilibrado', risk: 'Arriesgado' };
  const DEC = {
    // ----- Etapa amateur -----
    examen: {
      mode: 'kid', w: 3, cond: (S) => S.pl.age < 17,
      make: () => ({ from: { name: 'Tus padres', kind: 'family' }, title: 'Examen la semana que viene', text: 'Tienes un examen importante y tus padres te lo han recordado tres veces. ¿Qué haces?',
        options: [{ label: 'Estudiar a fondo', hint: H.safe }, { label: 'Estudiar lo justo', hint: H.mid }, { label: 'Seguir viciando', hint: H.risk }], def: 1 }),
      apply: (S, d, i) => {
        if (i === 0) { S.pl.nextTurnMod = (S.pl.nextTurnMod || 0) - 1; S.pl.allowanceBonus = Math.min(60, (S.pl.allowanceBonus || 0) + 15); return 'Sacas un 8,5. Tus padres te suben la paga 15 € al mes. El mes que viene tendrás una acción menos.'; }
        if (i === 1) { addAll(S, 0.3); if (U.chance(0.55)) return 'Apruebas con un 5,5. Ni premio ni castigo, y has podido seguir jugando algo.'; S.pl.noAllowanceUntil = (S.clock || 0) + 1; return 'Suspendes por poco. Un mes sin paga.'; }
        addAll(S, 0.8);
        if (U.chance(0.7)) { S.pl.noAllowanceUntil = (S.clock || 0) + 3; morale(S, -5); return 'Suspendes. Tres meses sin paga de castigo, pero tus estadísticas han mejorado (+0,8 a todo).'; }
        return '¡Apruebas por los pelos sin estudiar! Y encima has mejorado (+0,8 a todo).';
      },
    },
    torneo: {
      mode: 'kid', w: 2, cond: (S) => S.pl.age >= 11,
      make: () => ({ from: { name: 'Torneo online', kind: 'system' }, title: 'Final de un torneo amateur', text: 'Tu equipo de amigos ha llegado a la final de un torneo online. La jugada decisiva depende de ti.',
        options: [{ label: 'Jugar la final', hint: 'Minijuego', mg: true }, { label: 'Dejar el último mapa a un amigo', hint: H.safe }, { label: 'Retirarte para estudiar', hint: H.safe }], def: 1 }),
      apply: (S, d, i, score = 0.5) => {
        if (i === 0) {
          const g = U.round1(score * 2);
          addAttr(S, 'mecanicas', g * 0.6); addAttr(S, 'farmeo', g * 0.4);
          const f = Math.round(50 + score * 300); S.pl.fans += f;
          if (score >= 0.6) { money(S, 100); return `¡Ganáis la final! +100 €, +${f} seguidores y +${g} repartido entre Mecánicas y Farmeo.`; }
          return `Perdéis la final, pero aprendes: +${g} entre Mecánicas y Farmeo y +${f} seguidores.`;
        }
        if (i === 1) { addAttr(S, 'comunicacion', 0.4); return 'Tu amigo cierra la partida. Ganáis y mejoras tu comunicación (+0,4).'; }
        S.pl.allowanceBonus = Math.min(60, (S.pl.allowanceBonus || 0) + 5); return 'Tus padres valoran el gesto: +5 € de paga al mes.';
      },
    },
    streamer_kid: {
      mode: 'kid', w: 1.5, cond: (S) => S.pl.age >= 12,
      make: () => ({ from: { name: 'Streamer conocido', kind: 'player' }, title: 'Reto 1 contra 1 en directo', text: 'Un streamer con miles de espectadores te reta a un 1 contra 1 en su directo.',
        options: [{ label: 'Aceptar el reto', hint: 'Minijuego', mg: true }, { label: 'Proponer jugar un dúo', hint: H.safe }, { label: 'Ignorarle', hint: H.safe }], def: 2 }),
      apply: (S, d, i, score = 0.5) => {
        if (i === 0) { const f = Math.round(100 + score * 900); S.pl.fans += f; addAttr(S, 'mecanicas', score * 1.2); return score >= 0.6 ? `¡Le ganas en directo! +${f} seguidores y +${U.round1(score * 1.2)} Mecánicas.` : `Pierdes, pero das espectáculo: +${f} seguidores.`; }
        if (i === 1) { S.pl.fans += 150; addAttr(S, 'comunicacion', 0.3); return 'Jugáis un dúo muy divertido. +150 seguidores.'; }
        return 'Sigues a lo tuyo.';
      },
    },
    eloboost: {
      mode: 'kid', w: 1, cond: (S) => S.pl.lp >= 1200,
      make: () => ({ from: { name: 'Desconocido', kind: 'system' }, title: 'Te ofrecen dinero por subir cuentas', text: 'Alguien te ofrece 150 € por subir de rango cuentas ajenas. Está prohibido.',
        options: [{ label: 'Aceptar', hint: H.risk }, { label: 'Rechazar', hint: H.safe }, { label: 'Pedir consejo a un amigo', hint: H.safe }], def: 1 }),
      apply: (S, d, i) => {
        if (i === 0) { if (U.chance(0.35)) { S.pl.lp = Math.max(0, S.pl.lp - 400); morale(S, -15); return 'Riot detecta el elo boost y te sanciona: −400 LP y un buen susto.'; } money(S, 150); addAttr(S, 'mecanicas', 0.4); return 'Te sale bien: +150 € y algo de práctica.'; }
        if (i === 1) return 'Rechazas la oferta.';
        addAttr(S, 'comunicacion', 0.3); return 'Tu amigo te convence de que no merece la pena. +0,3 Comunicación.';
      },
    },
    vacaciones: {
      mode: 'kid', w: 1.5,
      make: () => ({ from: { name: 'Tus padres', kind: 'family' }, title: 'Vacaciones en familia', text: 'Tus padres quieren irse una semana a la playa, sin ordenador.',
        options: [{ label: 'Ir y desconectar', hint: H.safe }, { label: 'Ir con el portátil', hint: H.mid }, { label: 'Quedarte en casa entrenando', hint: H.risk }], def: 0 }),
      apply: (S, d, i) => {
        if (i === 0) { energy(S, 100); morale(S, 20); S.pl.nextTurnMod = (S.pl.nextTurnMod || 0) - 1; return 'Vuelves con la batería cargada: energía al máximo y +20 de moral. El mes que viene tendrás una acción menos.'; }
        if (i === 1) { energy(S, 25); morale(S, 8); addAll(S, 0.2); return 'Un poco de todo: +25 de energía, +8 de moral y +0,2 a todo.'; }
        addAll(S, 0.6); morale(S, -10); return 'Te quedas entrenando: +0,6 a todo, pero −10 de moral.';
      },
    },
    clash: {
      mode: 'kid', w: 1.5,
      make: () => ({ from: { name: 'Un amigo', kind: 'player' }, title: 'Equipo para Clash', text: 'Un amigo está montando un equipo para jugar Clash cada fin de semana.',
        options: [{ label: 'Unirte', hint: H.mid }, { label: 'Solo algún fin de semana', hint: H.safe }, { label: 'Seguir en SoloQ', hint: H.safe }], def: 1 }),
      apply: (S, d, i) => {
        if (i === 0) { addAttr(S, 'comunicacion', 1); addAttr(S, 'macro', 0.5); return 'Aprendes a jugar en equipo: +1 Comunicación y +0,5 Macro.'; }
        if (i === 1) { addAttr(S, 'comunicacion', 0.4); return '+0,4 Comunicación.'; }
        addAttr(S, 'mecanicas', 0.5); S.pl.lp += 40; return 'Sigues subiendo en SoloQ: +40 LP y +0,5 Mecánicas.';
      },
    },

    // ----- Etapa profesional -----
    entrevista: {
      mode: 'pro', w: 2, cond: (S) => !!S.pl.teamId,
      make: () => ({ from: { name: 'Medio de esports', kind: 'press' }, title: 'Entrevista incómoda', text: 'Un periodista te pregunta qué opinas del rendimiento de tu equipo en las últimas semanas.',
        options: [{ label: 'Decir lo que piensas', hint: H.risk }, { label: 'Respuesta diplomática', hint: H.safe }, { label: 'Rechazar la entrevista', hint: H.safe }], def: 1 }),
      apply: (S, d, i) => {
        if (i === 0) { const f = fansPct(S, U.rand(0.05, 0.12), 500); if (U.chance(0.5)) { rel(S, -15); morale(S, -5); return `La entrevista se hace viral (+${U.num(f)} seguidores), pero al club no le gusta nada: tu relación con la directiva baja.`; } return `La gente valora tu sinceridad: +${U.num(f)} seguidores.`; }
        if (i === 1) { const f = fansPct(S, 0.02, 100); rel(S, 3); return `Respuesta de manual. +${U.num(f)} seguidores y el club lo agradece.`; }
        fansPct(S, -0.01); return 'Rechazas la entrevista. Algunos fans lo critican.';
      },
    },
    fiesta: {
      mode: 'pro', w: 2, cond: (S) => !!S.pl.teamId,
      make: () => ({ from: { name: 'Un amigo', kind: 'player' }, title: 'Fiesta la noche antes del partido', text: 'Un amigo celebra su cumpleaños esta noche. Mañana tienes partido.',
        options: [{ label: 'Ir a la fiesta', hint: H.risk }, { label: 'Ir un rato y volver pronto', hint: H.mid }, { label: 'Quedarte descansando', hint: H.safe }], def: 2 }),
      apply: (S, d, i) => {
        if (i === 0) { morale(S, 15); energy(S, -30); if (U.chance(0.3)) { rel(S, -15); fansPct(S, -0.03); return 'Apareces en fotos de madrugada. El club te abre un expediente interno y llegas agotado (−30 de energía).'; } return 'Te lo pasas genial (+15 de moral), aunque llegas cansado (−30 de energía).'; }
        if (i === 1) { morale(S, 6); energy(S, -10); return '+6 de moral y −10 de energía.'; }
        energy(S, 15); return 'Duermes bien: +15 de energía.';
      },
    },
    gira: {
      mode: 'pro', w: 1.5, cond: (S) => S.pl.fans >= 10000,
      make: (S) => { const m = Math.round((2000 + Math.sqrt(S.pl.fans) * 40) / 100) * 100; return { from: { name: 'Agencia de eventos', kind: 'brand' }, title: 'Gira de streaming y eventos', text: `Te ofrecen ${U.money(m)} por una semana de eventos y streams patrocinados.`, data: { m },
        options: [{ label: 'Aceptar la gira completa', hint: H.mid }, { label: 'Solo un evento corto', hint: H.safe }, { label: 'Rechazar y entrenar', hint: H.safe }], def: 1 }; },
      apply: (S, d, i) => {
        if (i === 0) { money(S, d.m); const f = fansPct(S, 0.04, 800); S.pl.nextTurnMod = (S.pl.nextTurnMod || 0) - 2; rel(S, -5); return `+${U.money(d.m)} y +${U.num(f)} seguidores. La semana que viene tendrás 2 acciones menos.`; }
        if (i === 1) { money(S, Math.round(d.m / 3)); S.pl.nextTurnMod = (S.pl.nextTurnMod || 0) - 1; return `+${U.money(Math.round(d.m / 3))}. La semana que viene tendrás una acción menos.`; }
        addAll(S, 0.3); rel(S, 3); return 'El staff valora tu compromiso. +0,3 a todo.';
      },
    },
    pelea: {
      mode: 'pro', w: 1.5, cond: (S) => teammates(S).length > 0,
      make: (S) => { const t = U.pick(teammates(S)); return { from: { name: t.name, kind: 'player', teamId: S.pl.teamId }, title: 'Tensión con un compañero', text: `${t.name} te ha echado la culpa delante de todos de la última derrota en scrims.`, data: { name: t.name },
        options: [{ label: 'Hablarlo en privado', hint: H.mid }, { label: 'Contárselo al entrenador', hint: H.safe }, { label: 'Responderle en las scrims', hint: H.risk }], def: 0 }; },
      apply: (S, d, i) => {
        if (i === 0) { if (U.chance(0.7)) { morale(S, 8); rel(S, 5); addAttr(S, 'comunicacion', 0.5); return `Arregláis las cosas con ${d.name}. +8 de moral y +0,5 Comunicación.`; } morale(S, -6); return `${d.name} no quiere hablar. −6 de moral.`; }
        if (i === 1) { rel(S, 8); morale(S, -5); return 'El entrenador media. El club valora tu madurez, pero el vestuario queda tenso.'; }
        addAttr(S, 'mecanicas', 0.8); addAttr(S, 'comunicacion', -0.6);
        if (U.chance(0.4)) { rel(S, -10); return 'Le pasas por encima en las scrims (+0,8 Mecánicas), pero el ambiente se rompe y el club te llama la atención.'; }
        return 'Le pasas por encima en las scrims: +0,8 Mecánicas, −0,6 Comunicación.';
      },
    },
    amano: {
      mode: 'pro', w: 0.4, cond: (S) => !!S.pl.teamId && S.pl.age >= 18,
      make: () => ({ from: { name: 'Número oculto', kind: 'system' }, title: 'Una propuesta muy turbia', text: 'Alguien te ofrece 40.000 € por perder a propósito el próximo partido.',
        options: [{ label: 'Rechazar y denunciarlo', hint: H.safe }, { label: 'Rechazar sin decir nada', hint: H.safe }, { label: 'Aceptar', hint: 'Muy arriesgado' }], def: 1 }),
      apply: (S, d, i) => {
        if (i === 0) { rel(S, 15); const f = fansPct(S, 0.05, 1000); return `La liga investiga y te felicita públicamente. +${U.num(f)} seguidores y el club confía más en ti.`; }
        if (i === 1) return 'Bloqueas el número y sigues a lo tuyo.';
        if (U.chance(0.6)) {
          const fine = Math.max(50000, Math.round(S.pl.money * 0.3)); S.pl.money -= fine; fansPct(S, -0.4); morale(S, -40); rel(S, -60);
          const team = P.team(S); if (team) P.leaveTeam(S, `${team.name} rescinde tu contrato tras el escándalo de amaño.`);
          return `Te descubren. Multa de ${U.money(fine)}, pierdes el 40 % de tus seguidores y tu equipo rescinde tu contrato.`;
        }
        money(S, 40000); morale(S, -12); return 'Nadie se entera. +40.000 €, pero te cuesta dormir (−12 de moral).';
      },
    },
    familia: {
      mode: 'pro', w: 1.5,
      make: () => ({ from: { name: 'Tu familia', kind: 'family' }, title: 'Boda familiar', text: 'Tu prima se casa justo la semana de un bootcamp del equipo.',
        options: [{ label: 'Ir a la boda', hint: H.safe }, { label: 'Ir solo un día', hint: H.mid }, { label: 'Quedarte en el bootcamp', hint: H.mid }], def: 1 }),
      apply: (S, d, i) => {
        if (i === 0) { morale(S, 20); energy(S, 20); S.pl.nextTurnMod = (S.pl.nextTurnMod || 0) - 1; return '+20 de moral y +20 de energía. La semana que viene tendrás una acción menos.'; }
        if (i === 1) { morale(S, 8); return '+8 de moral.'; }
        addAll(S, 0.5); morale(S, -12); return '+0,5 a todo, pero tu familia no lo entiende (−12 de moral).';
      },
    },
    campeon_op: {
      mode: 'pro', w: 1.5, cond: (S) => !!S.patch,
      make: (S) => {
        const c = D.champsForRole(S.pl.role).filter((x) => !S.pl.pool.includes(x) && (S.patch.meta[x] || 0) >= 2);
        if (!c.length) return null;
        const ch = U.pick(c);
        return { from: { name: 'Tu entrenador', kind: 'club', teamId: S.pl.teamId }, title: `${D.champName(ch)} está rotísimo`, text: `${D.champName(ch)} domina el parche ${S.patch.ver}. ¿Lo metes en tu pool?`, data: { ch },
          options: [{ label: 'Aprenderlo ya', hint: H.mid }, { label: 'Probarlo en SoloQ', hint: H.safe }, { label: 'Seguir con tu pool', hint: H.safe }], def: 2 };
      },
      apply: (S, d, i) => {
        const add = (m) => { if (!S.pl.pool.includes(d.ch)) { if (S.pl.pool.length >= P.maxPool) S.pl.pool.sort((a, b) => P.mastery(S, b) - P.mastery(S, a)).pop(); S.pl.pool.push(d.ch); } S.pl.mastery[d.ch] = Math.max(P.mastery(S, d.ch), m); };
        if (i === 0) { add(40); S.pl.nextTurnMod = (S.pl.nextTurnMod || 0) - 1; return `${D.champName(d.ch)} entra en tu pool con maestría 40. La semana que viene tendrás una acción menos.`; }
        if (i === 1) { add(22); return `${D.champName(d.ch)} entra en tu pool con maestría 22.`; }
        return 'Confías en tus campeones de siempre.';
      },
    },
    burnout: {
      mode: 'any', w: 2, cond: (S) => S.pl.energy < 35 || S.pl.morale < 35,
      make: () => ({ from: { name: 'Tu cuerpo', kind: 'system' }, title: 'Estás quemado', text: 'Llevas semanas sin parar y lo notas: duermes mal y no disfrutas jugando.',
        options: [{ label: 'Tomarte unos días', hint: H.safe }, { label: 'Bajar el ritmo', hint: H.mid }, { label: 'Seguir apretando', hint: H.risk }], def: 1 }),
      apply: (S, d, i) => {
        if (i === 0) { energy(S, 100); morale(S, 20); S.pl.nextTurnMod = (S.pl.nextTurnMod || 0) - 2; return 'Energía al máximo y +20 de moral. El próximo turno tendrás 2 acciones menos.'; }
        if (i === 1) { energy(S, 30); morale(S, 8); S.pl.nextTurnMod = (S.pl.nextTurnMod || 0) - 1; return '+30 de energía y +8 de moral. El próximo turno tendrás una acción menos.'; }
        addAll(S, 0.4); morale(S, -15); if (U.chance(0.3)) { energy(S, -100); return 'Te quemas del todo: energía a cero.'; } return '+0,4 a todo, pero −15 de moral.';
      },
    },
    apuestas: {
      mode: 'pro', w: 1, cond: (S) => S.pl.fans >= 20000,
      make: (S) => { const m = Math.round((15000 + Math.sqrt(S.pl.fans) * 60) / 1000) * 1000; return { from: { name: 'Casa de apuestas', kind: 'brand' }, title: 'Patrocinio de una casa de apuestas', text: `Te ofrecen ${U.money(m)} por anunciarles en tus redes.`, data: { m },
        options: [{ label: 'Aceptar', hint: H.mid }, { label: 'Pedir más dinero', hint: H.risk }, { label: 'Rechazar', hint: H.safe }], def: 2 }; },
      apply: (S, d, i) => {
        if (i === 0) { money(S, d.m); rel(S, -12); fansPct(S, -0.03); return `+${U.money(d.m)}. Al club y a parte de tus fans no les gusta.`; }
        if (i === 1) { if (U.chance(0.5)) { const m = Math.round(d.m * 1.5); money(S, m); rel(S, -12); fansPct(S, -0.03); return `Aceptan: +${U.money(m)}. Al club no le gusta.`; } return 'Retiran la oferta.'; }
        rel(S, 5); return 'Rechazas. El club lo valora.';
      },
    },
    streamer_pro: {
      mode: 'pro', w: 1.2, cond: (S) => S.pl.fans >= 5000,
      make: (S) => { const r = U.pick(Object.values(S.world.players).filter((p) => p.team && p.role === S.pl.role && p.team !== S.pl.teamId && W.ovr(p) > 80)); if (!r) return null;
        return { from: { name: r.name, kind: 'player', teamId: r.team }, title: 'Reto 1 contra 1 en directo', text: `${r.name} te reta a un 1 contra 1 en su stream. Medio mundo lo va a ver.`, data: { name: r.name },
          options: [{ label: 'Aceptar el reto', hint: 'Minijuego', mg: true }, { label: 'Proponer un dúo', hint: H.safe }, { label: 'Ignorarle', hint: H.safe }], def: 2 }; },
      apply: (S, d, i, score = 0.5) => {
        if (i === 0) { const f = Math.round(1000 + score * Math.sqrt(S.pl.fans) * 30); S.pl.fans += f; morale(S, score >= 0.6 ? 10 : -5); addAttr(S, 'mecanicas', score * 0.8); return score >= 0.6 ? `¡Ganas a ${d.name} en directo! +${U.num(f)} seguidores.` : `${d.name} te gana, pero el directo arrasa: +${U.num(f)} seguidores.`; }
        if (i === 1) { const f = fansPct(S, 0.01, 300); return `Dúo divertido con ${d.name}: +${U.num(f)} seguidores.`; }
        return 'Pasas del reto.';
      },
    },
    coach_pick: {
      mode: 'pro', w: 1, cond: (S) => !!S.pl.teamId && !!S.patch,
      make: (S) => { const c = D.champsForRole(S.pl.role).filter((x) => !S.pl.pool.includes(x) && (S.patch.meta[x] || 0) >= 1); if (!c.length) return null; const ch = U.pick(c);
        return { from: { name: 'Tu entrenador', kind: 'club', teamId: S.pl.teamId }, title: 'El entrenador quiere que juegues otro campeón', text: `Quiere que metas a ${D.champName(ch)} para el próximo partido.`, data: { ch },
          options: [{ label: 'Aceptar', hint: H.mid }, { label: 'Negociar: lo practicas, pero sin prisas', hint: H.safe }, { label: 'Negarte', hint: H.risk }], def: 1 }; },
      apply: (S, d, i) => {
        if (i === 0) { rel(S, 8); if (!S.pl.pool.includes(d.ch) && S.pl.pool.length < P.maxPool) S.pl.pool.push(d.ch); S.pl.mastery[d.ch] = Math.max(P.mastery(S, d.ch), 28); return `El entrenador lo agradece. ${D.champName(d.ch)} entra en tu pool.`; }
        if (i === 1) { rel(S, 2); S.pl.mastery[d.ch] = Math.max(P.mastery(S, d.ch), 15); return 'Llegáis a un acuerdo.'; }
        rel(S, -10); morale(S, 5); return 'Te mantienes firme. Al entrenador no le hace gracia.';
      },
    },
    mentor: {
      mode: 'pro', w: 1, cond: (S) => !!S.pl.teamId && S.pl.age <= 20,
      make: (S) => { const v = teammates(S).sort((a, b) => b.age - a.age)[0]; if (!v || v.age < 22) return null;
        return { from: { name: v.name, kind: 'player', teamId: S.pl.teamId }, title: 'Un veterano se ofrece a enseñarte', text: `${v.name}, el más veterano del equipo, se ofrece a revisar partidas contigo.`, data: { name: v.name },
          options: [{ label: 'Aprender todo lo posible', hint: H.mid }, { label: 'Charlar de vez en cuando', hint: H.safe }, { label: 'Ir a tu aire', hint: H.safe }], def: 1 }; },
      apply: (S, d, i) => {
        if (i === 0) { addAttr(S, 'macro', 1); addAttr(S, 'mentalidad', 0.8); S.pl.nextTurnMod = (S.pl.nextTurnMod || 0) - 1; return '+1 Macro y +0,8 Mentalidad. La semana que viene tendrás una acción menos.'; }
        if (i === 1) { addAttr(S, 'macro', 0.4); return '+0,4 Macro.'; }
        return 'Prefieres aprender a tu manera.';
      },
    },
    rookie: {
      mode: 'pro', w: 1, cond: (S) => !!S.pl.teamId && S.pl.age >= 23,
      make: () => ({ from: { name: 'Un rookie de la academia', kind: 'player' }, title: 'Un rookie te pide consejo', text: 'Un chaval de la academia te pide que le ayudes a mejorar.',
        options: [{ label: 'Ayudarle', hint: H.mid }, { label: 'Mandarle al entrenador', hint: H.safe }, { label: 'No tienes tiempo', hint: H.safe }], def: 1 }),
      apply: (S, d, i) => {
        if (i === 0) { addAttr(S, 'comunicacion', 0.8); rel(S, 5); S.pl.nextTurnMod = (S.pl.nextTurnMod || 0) - 1; return '+0,8 Comunicación y el club lo valora. La semana que viene tendrás una acción menos.'; }
        if (i === 1) return 'Le mandas con el entrenador.';
        rel(S, -3); return 'El chaval se queda algo decepcionado.';
      },
    },
    fanevent: {
      mode: 'pro', w: 1, cond: (S) => S.pl.fans >= 15000,
      make: () => ({ from: { name: 'La liga', kind: 'club' }, title: 'Evento con fans', text: 'La liga organiza un encuentro con fans este fin de semana.',
        options: [{ label: 'Ir al evento', hint: H.mid }, { label: 'Firmar autógrafos online', hint: H.safe }, { label: 'No ir', hint: H.safe }], def: 1 }),
      apply: (S, d, i) => {
        if (i === 0) { const f = fansPct(S, 0.05, 500); energy(S, -20); morale(S, 8); return `+${U.num(f)} seguidores y +8 de moral, pero −20 de energía.`; }
        if (i === 1) { const f = fansPct(S, 0.02, 200); return `+${U.num(f)} seguidores.`; }
        return 'Descansas el fin de semana.';
      },
    },
  };
  EV.DEC = DEC;

  // ---------- Decisiones especiales (club, jugadores) ----------
  const SPECIAL = {
    // Un jugador de otro equipo quiere que vayas con ellos
    dm_recruit: {
      apply: (S, d, i) => {
        const team = S.world.teams[d.teamId];
        if (i === 0) {
          const w = P.wantsYou(S, team);
          if (!w.ok) return `${d.name} lo intenta, pero su club no lo ve claro. ${w.why}`;
          if (S.offers.some((o) => o.teamId === team.id)) return 'Su club ya te había enviado una oferta.';
          P.makeOffer(S, team.id, { ttl: 4 });
          return `${team.name} te envía una oferta. La tienes en Mercado.`;
        }
        if (i === 1) return EV.pitch(S, d.pid).msg;
        return `Le dices a ${d.name} que ahora no.`;
      },
    },
    // El club te consulta un fichaje
    club_consult: {
      apply: (S, d, i) => {
        const pid = d.cands[i];
        if (!pid) return 'Le dices al club que confías en la plantilla actual.';
        return EV.signPlayer(S, pid, 0.9).msg;
      },
    },
  };

  EV.resolve = function (S, msgId, i, score) {
    const m = EV.inbox(S).find((x) => x.id === msgId);
    if (!m || m.resolved) return { ok: false, msg: 'Esta decisión ya está tomada.' };
    const def = DEC[m.ev] || SPECIAL[m.ev];
    const txt = def ? def.apply(S, m.data || {}, i, score) : '';
    m.resolved = true;
    m.read = true;
    m.choice = i;
    m.answer = txt;
    if (txt) P.news(S, `${m.title}: ${txt}`);
    S.pl.peakOvr = Math.max(S.pl.peakOvr, P.ovr(S));
    return { ok: true, msg: txt };
  };

  function newDecision(S) {
    const mode = S.amateur ? 'kid' : 'pro';
    const list = Object.entries(DEC).filter(([, d]) => (d.mode === mode || d.mode === 'any') && (!d.cond || d.cond(S)));
    if (!list.length) return null;
    const recent = new Set((S.pl.recentEv || []).slice(-4));
    const pool = list.filter(([id]) => !recent.has(id));
    const [id, d] = U.weighted(pool.length ? pool : list, ([, x]) => x.w);
    const m = d.make(S);
    if (!m) return null;
    S.pl.recentEv = (S.pl.recentEv || []).concat([id]).slice(-6);
    return EV.msg(S, Object.assign({ ev: id, expires: (S.clock || 0) + 2 }, m));
  }

  // ---------- Turno: caducan decisiones, llegan nuevas ----------
  EV.tick = function (S, report) {
    const clock = S.clock || 0;
    for (const m of EV.pending(S)) {
      if (m.expires != null && clock >= m.expires) {
        const r = EV.resolve(S, m.id, m.def != null ? m.def : m.options.length - 1, 0.4);
        m.auto = true;
        report.events.push(`No respondiste a "${m.title}". Se aplica: ${m.options[m.choice].label}. ${r.msg}`);
      }
    }
    if (EV.pending(S).length < 2) {
      const p = S.amateur ? 0.3 : 0.17;
      if (U.chance(p)) { const m = newDecision(S); if (m) report.events.push(`Nueva decisión en Mensajes: ${m.title}.`); }
    }
    if (!S.amateur && S.world) {
      recruitDM(S, report);
      rumors(S);
    }
    // Interesados que caducan
    S.pl.interested = (S.pl.interested || []).filter((x) => x.until > clock && S.world && S.world.players[x.pid]);
  };

  function recruitDM(S, report) {
    if (EV.pending(S).some((m) => m.ev === 'dm_recruit')) return;
    const me = P.ovr(S);
    const chance = 0.03 + Math.max(0, me - 78) * 0.006;
    if (!U.chance(chance)) return;
    const cur = P.team(S);
    const teams = Object.values(S.world.teams).filter((t) => t.id !== S.pl.teamId && (!cur || C.LEAGUES[t.league].tier <= C.LEAGUES[cur.league].tier) && P.wantsYou(S, t).ok);
    if (!teams.length) return;
    const t = U.pick(teams);
    const p = S.world.players[U.pick(C.ROLES.filter((r) => r !== S.pl.role).map((r) => t.roster[r]))];
    if (!p) return;
    EV.msg(S, { ev: 'dm_recruit', expires: (S.clock || 0) + 3, def: 2, from: { name: p.name, kind: 'player', teamId: t.id }, title: `${p.name} quiere que vayas a ${t.short}`,
      text: `"Oye, en ${t.name} necesitamos a alguien como tú. Si te interesa, hablo con el club."`, data: { pid: p.id, name: p.name, teamId: t.id },
      options: [{ label: 'Me interesa, que me llamen', hint: 'Oferta' }, { label: 'Mejor vente tú a mi equipo', hint: 'Propuesta' }, { label: 'Ahora no', hint: H.safe }] });
    report.events.push(`${p.name} (${t.short}) te ha escrito.`);
  }

  // ---------- Rumores ----------
  function rumors(S) {
    S.rumors = S.rumors || [];
    const add = (text, aboutYou) => { S.rumors.unshift({ when: nowText(S), text, you: !!aboutYou }); if (S.rumors.length > 20) S.rumors.length = 20; };
    if (U.chance(0.12)) {
      const stars = Object.values(S.world.players).filter((p) => p.team && W.ovr(p) >= 86);
      const p = stars.length ? U.pick(stars) : null;
      const from = p ? S.world.teams[p.team] : null;
      const to = from ? U.pick(Object.values(S.world.teams).filter((t) => t.id !== from.id && C.LEAGUES[t.league].tier <= 2)) : null;
      if (p && from && to) add(`${p.name} (${from.short}) podría acabar en ${to.name}. ${U.pick(['Fuentes cercanas lo dan por hecho.', 'Lo publica un periodista fiable.', 'Rumor sin confirmar.', 'Su agente no lo desmiente.'])}`);
    }
    const st = EV.status(S);
    if (st && ['estrella', 'capitan', 'franquicia'].includes(st.id) && U.chance(0.05)) {
      const cur = P.team(S);
      const opts = Object.values(S.world.teams).filter((x) => x.id !== cur.id && C.LEAGUES[x.league].tier <= C.LEAGUES[cur.league].tier && P.wantsYou(S, x).ok);
      const t = opts.length ? U.pick(opts) : null;
      if (t) {
        S.pl.rumorTeams = (S.pl.rumorTeams || []).concat([t.id]).slice(-3);
        add(`${t.name} sigue de cerca a ${S.pl.name}. Podría hacer una oferta en la próxima ventana de fichajes.`, true);
        P.news(S, `Rumor: ${t.name} se interesa por ti.`);
      }
    }
  }

  // ---------- Hablar con jugadores ----------
  // Propuesta para que un jugador venga a tu equipo
  EV.pitch = function (S, pid) {
    const p = S.world.players[pid];
    const team = P.team(S);
    if (!p || !team) return { ok: false, msg: 'Necesitas tener equipo para proponerle venir.' };
    if (p.team === team.id) return { ok: false, msg: 'Ya es tu compañero.' };
    const his = p.team ? S.world.teams[p.team] : null;
    const diffTeam = W.teamAvgOvr(S, team) - (his ? W.teamAvgOvr(S, his) : 70);
    const tierDiff = his ? C.LEAGUES[his.league].tier - C.LEAGUES[team.league].tier : 2;
    const friend = (S.pl.friends || {})[pid] || 0;
    let prob = 0.3 + diffTeam * 0.05 + tierDiff * 0.12 + Math.min(0.25, S.pl.fans / 2000000) + EV.statusW(S) * 0.25 + friend / 200;
    prob = U.clamp(prob, 0.03, 0.92);
    if (U.chance(prob)) {
      S.pl.interested = (S.pl.interested || []).filter((x) => x.pid !== pid).concat([{ pid, until: (S.clock || 0) + 20 }]);
      EV.msg(S, { from: { name: p.name, kind: 'player', teamId: p.team }, title: `${p.name} se apunta`, text: `"Si ${team.name} me llama, voy." Aparecerá como opción cuando el club busque fichajes para el puesto de ${C.ROLE_ES[p.role]}.` });
      return { ok: true, msg: `${p.name} acepta: si ${team.name} le llama, irá. Lo tienes en "Interesados".` };
    }
    return { ok: false, msg: `${p.name} prefiere seguir en ${his ? his.name : 'su situación actual'}.` };
  };

  // Preguntar por su equipo: si quieres ir allí, su club te manda una oferta
  EV.askTeam = function (S, pid) {
    const p = S.world.players[pid];
    if (!p || !p.team) return { ok: false, msg: 'No tiene equipo ahora mismo.' };
    const t = S.world.teams[p.team];
    if (t.id === S.pl.teamId) return { ok: false, msg: 'Es de tu equipo.' };
    if (S.offers.some((o) => o.teamId === t.id)) return { ok: false, msg: `Ya tienes una oferta de ${t.name}.` };
    const w = P.wantsYou(S, t);
    const friend = (S.pl.friends || {})[pid] || 0;
    if (!w.ok) return { ok: false, msg: `${p.name} habla con su club, pero no lo ven claro. ${w.why}` };
    if (!U.chance(0.55 + friend / 150 + P.luck(S) / 100)) return { ok: false, msg: `${p.name} lo comenta en ${t.name}, pero de momento no se mueven.` };
    P.makeOffer(S, t.id, { ttl: 4 });
    return { ok: true, msg: `${p.name} habla con su club y ${t.name} te envía una oferta. La tienes en Mercado.` };
  };

  // Hacer amistad: mejora futuras propuestas con ese jugador
  EV.befriend = function (S, pid) {
    const p = S.world.players[pid];
    S.pl.friends = S.pl.friends || {};
    S.pl.friends[pid] = Math.min(60, (S.pl.friends[pid] || 0) + U.randInt(10, 20));
    morale(S, 2);
    return { ok: true, msg: `Charláis un rato y conectáis. ${p.name} te tendrá más en cuenta.` };
  };

  EV.canContact = (S, pid) => ((S.pl.contacted || {})[pid] || -99) < (S.clock || 0) - 3;
  EV.contact = function (S, pid, kind) {
    if (!EV.canContact(S, pid)) return { ok: false, msg: 'Ya hablaste con este jugador hace poco. Espera unas semanas.' };
    S.pl.contacted = S.pl.contacted || {};
    S.pl.contacted[pid] = S.clock || 0;
    return kind === 'pitch' ? EV.pitch(S, pid) : kind === 'ask' ? EV.askTeam(S, pid) : EV.befriend(S, pid);
  };

  // ---------- Fichajes del club ----------
  // Candidatos para un puesto: los interesados primero y luego los que el club puede pagar
  EV.candidates = function (S, role, n = 3) {
    const team = P.team(S);
    if (!team) return [];
    const L = C.LEAGUES[team.league];
    const cur = S.world.players[team.roster[role]];
    const curO = cur ? W.ovr(cur) : 60;
    const interested = (S.pl.interested || []).map((x) => S.world.players[x.pid]).filter((p) => p && p.role === role && p.team !== team.id);
    const pool = Object.values(S.world.players).filter((p) => p.role === role && p.team !== team.id && !interested.includes(p)).map((p) => {
      const t = p.team ? S.world.teams[p.team] : null;
      return { p, o: W.ovr(p), tier: t ? C.LEAGUES[t.league].tier : 9 };
    }).filter((x) => x.o > curO + 0.5 && x.o <= L.req + 9 && (x.tier >= L.tier || x.o < curO + 4));
    const picks = U.shuffle(pool).sort((a, b) => b.o - a.o).slice(0, 10);
    const out = interested.slice(0, n).map((p) => ({ pid: p.id, interested: true }));
    for (const x of U.shuffle(picks)) { if (out.length >= n) break; out.push({ pid: x.p.id }); }
    return out;
  };

  EV.signPlayer = function (S, pid, baseProb) {
    const team = P.team(S);
    const p = S.world.players[pid];
    if (!team || !p) return { ok: false, msg: 'Ese jugador ya no está disponible.' };
    const interested = (S.pl.interested || []).some((x) => x.pid === pid);
    const role = p.role;
    const his = p.team ? S.world.teams[p.team] : null;
    const stretch = Math.max(0, W.ovr(p) - C.LEAGUES[team.league].req - 4) * 0.04;
    const relB = ((S.pl.clubRel == null ? 55 : S.pl.clubRel) - 50) / 200;
    const prob = U.clamp(baseProb + (interested ? 0.2 : 0) + relB - stretch, 0.02, 0.97);
    if (!U.chance(prob)) {
      return { ok: false, msg: interested ? `El club lo intenta con ${p.name}, pero no llega a un acuerdo con ${his ? his.name : 'el jugador'}.` : `El club no consigue fichar a ${p.name}.` };
    }
    const out = S.world.players[team.roster[role]];
    if (his) his.roster[role] = null;
    if (out) {
      out.team = his ? his.id : null;
      if (his) his.roster[role] = out.id;
    }
    if (his && !his.roster[role]) { const r = W.newRookie(S.world, role, his.league); r.team = his.id; his.roster[role] = r.id; }
    team.roster[role] = p.id;
    p.team = team.id;
    S.pl.interested = (S.pl.interested || []).filter((x) => x.pid !== pid);
    P.news(S, `${team.name} ficha a ${p.name} (${C.ROLE_ES[role]})${out ? ` y ${out.name} sale del equipo` : ''}.`, 'good');
    return { ok: true, msg: `¡Hecho! ${p.name} es nuevo jugador de ${team.name}.` };
  };

  // Petición anual del jugador
  EV.canRequest = function (S) {
    const st = EV.status(S);
    if (!st) return { ok: false, why: 'Necesitas tener equipo.' };
    if (st.id === 'promesa') return { ok: false, why: 'Como promesa, el club no atiende tus peticiones de fichaje.' };
    if (S.pl.requestYear === S.year) return { ok: false, why: `Ya hiciste tu petición de ${S.year}. Podrás hacer otra la próxima temporada.` };
    return { ok: true };
  };
  EV.request = function (S, pid) {
    const c = EV.canRequest(S);
    if (!c.ok) return { ok: false, msg: c.why };
    S.pl.requestYear = S.year;
    const r = EV.signPlayer(S, pid, EV.statusW(S));
    if (!r.ok) rel(S, -3);
    EV.msg(S, { from: { name: 'Dirección deportiva', kind: 'club', teamId: S.pl.teamId }, title: r.ok ? 'Petición aceptada' : 'Petición rechazada', text: r.msg });
    return r;
  };

  // Al terminar un split: si el equipo va mal y eres franquicia (o estrella a veces), el club te consulta
  EV.afterSplit = function (S, phase, report) {
    const team = P.team(S);
    if (!team || !S.comp.done[phase] || !S.comp.done[phase][team.league]) return;
    const place = S.comp.done[phase][team.league].place[team.id];
    const n = W.leagueTeams(S, team.league).length;
    const st = EV.status(S);
    if (!st || place <= Math.ceil(n / 2)) return;
    if (!(st.id === 'franquicia' || (st.id === 'capitan' && U.chance(0.5)) || (st.id === 'estrella' && U.chance(0.3)))) return;
    const weak = C.ROLES.filter((r) => r !== S.pl.role).map((r) => ({ r, o: W.ovr(S.world.players[team.roster[r]] || { mech: 60, macro: 60, ment: 60 }) })).sort((a, b) => a.o - b.o)[0];
    const cands = EV.candidates(S, weak.r, 2);
    if (!cands.length) return;
    const lbl = (c) => { const p = S.world.players[c.pid]; const t = p.team ? S.world.teams[p.team] : null; return `${p.name} (${W.ovr(p).toFixed(0)}${t ? ' · ' + t.short : ''})${c.interested ? ' · ya dijo que sí' : ''}`; };
    EV.msg(S, { ev: 'club_consult', expires: (S.clock || 0) + 3, def: 2, from: { name: 'Dirección deportiva', kind: 'club', teamId: team.id },
      title: 'El club quiere reforzarse', text: `Tras quedar ${place}º, el club quiere mejorar el puesto de ${C.ROLE_ES[weak.r]}. Como ${st.name.toLowerCase()}, quieren tu opinión.`,
      data: { cands: cands.map((c) => c.pid), role: weak.r },
      options: cands.map((c) => ({ label: 'Fichar a ' + lbl(c), hint: 'Fichaje' })).concat([{ label: 'Confío en la plantilla actual', hint: H.safe }]) });
    report.events.push('El club te consulta un fichaje. Míralo en Mensajes.');
  };

  // ---------- Momentos clave con minijuego ----------
  EV.keyMoment = function (S) {
    if (S.amateur || !S.pl.teamId) return { key: false };
    if (S.keyCheck && S.keyCheck.clock === (S.clock || 0)) return S.keyCheck;
    const fx = RC.Season.userFixture(S);
    const t = S.cal[S.turn];
    let key = false, reason = '';
    if (fx && fx.a) {
      if (S.pl.debutPending) { key = true; reason = `Tu debut con ${P.team(S).name}`; }
      else if (t.phase === 'worlds' && t.round === 8) { key = true; reason = 'La final de los Worlds'; }
      else if (t.phase === 'msi' && t.round === 8) { key = true; reason = 'La Gran Final del MSI'; }
      else if (t.phase === 'worlds' && t.round === 7 && U.chance(0.5)) { key = true; reason = 'Semifinal de los Worlds'; }
      else if (t.phase === 'worlds' && t.round === 6 && U.chance(0.3)) { key = true; reason = 'Cuartos de final de los Worlds'; }
      else if (t.phase === 'msi' && t.round === 7 && U.chance(0.4)) { key = true; reason = 'Final del cuadro inferior del MSI'; }
      else if (t.phase === 'worlds' && t.round >= 1 && t.round <= 5 && S.comp.worlds && S.comp.worlds.swiss && (S.comp.worlds.swiss.rec[S.pl.teamId] || {}).w === 2 && (S.comp.worlds.swiss.rec[S.pl.teamId] || {}).l === 2 && U.chance(0.5)) { key = true; reason = 'Partido a vida o muerte en la fase suiza'; }
      else if (t.kind === 'po' && t.round === 2 && U.chance(0.65)) { key = true; reason = 'La final de liga'; }
      else if (t.kind === 'po' && t.round === 1 && U.chance(0.15)) { key = true; reason = 'Semifinal de liga'; }
      else if (t.phase === 'msi' && t.round === 2 && U.chance(0.25)) { key = true; reason = 'Partido decisivo del Play-In'; }
    }
    S.keyCheck = { clock: S.clock || 0, key, reason };
    return S.keyCheck;
  };

  RC.EV = EV;
})(window.RC);
