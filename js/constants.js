/* Datos fijos de diseño del juego: ligas, nacionalidades, acciones, tienda, staff… */
(function (RC) {
  const C = {};

  C.ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
  C.ROLE_ES = { Top: 'Top', Jungle: 'Jungla', Mid: 'Mid', ADC: 'ADC', Support: 'Support' };

  // tier: 1 = élite. req = OVR mínimo para que te fichen. salary = sueldo anual medio (€).
  C.LEAGUES = {
    LCK:   { name: 'LCK', full: 'LCK (Corea)', region: 'Corea', tier: 1, req: 86, salary: 420000, major: true },
    LPL:   { name: 'LPL', full: 'LPL (China)', region: 'China', tier: 1, req: 84, salary: 460000, major: true },
    LEC:   { name: 'LEC', full: 'LEC (Europa)', region: 'Europa', tier: 2, req: 82, salary: 260000, major: true },
    LCS:   { name: 'LCS', full: 'LCS (Norteamérica)', region: 'Norteamérica', tier: 2, req: 81, salary: 300000, major: true },
    LCP:   { name: 'LCP', full: 'LCP (Asia-Pacífico)', region: 'Asia-Pacífico', tier: 3, req: 79, salary: 130000, major: true },
    CBLOL: { name: 'CBLOL', full: 'CBLOL (Brasil)', region: 'Brasil', tier: 3, req: 77, salary: 110000, major: true },
    LCKC:  { name: 'LCK CL', full: 'LCK Challengers (Corea)', region: 'Corea', tier: 4, req: 78, salary: 60000 },
    LDL:   { name: 'LDL', full: 'LDL (China)', region: 'China', tier: 4, req: 75, salary: 55000 },
    VCS:   { name: 'VCS', full: 'VCS (Vietnam)', region: 'Vietnam', tier: 4, req: 76, salary: 45000 },
    PCS:   { name: 'PCS', full: 'PCS (Taiwán/HK)', region: 'Asia-Pacífico', tier: 4, req: 75, salary: 42000 },
    NACL:  { name: 'NACL', full: 'NACL (Norteamérica)', region: 'Norteamérica', tier: 5, req: 73, salary: 45000 },
    LES:   { name: 'LES', full: 'Liga Española (LES)', region: 'Europa', tier: 5, req: 70, salary: 28000, erl: true },
    LFL:   { name: 'LFL', full: 'LFL (Francia)', region: 'Europa', tier: 5, req: 70, salary: 30000, erl: true },
    PL:    { name: 'Prime League', full: 'Prime League (DACH)', region: 'Europa', tier: 5, req: 70, salary: 28000, erl: true },
    NLC:   { name: 'NLC', full: 'NLC (Norte de Europa)', region: 'Europa', tier: 5, req: 70, salary: 24000, erl: true },
    TCL:   { name: 'TCL', full: 'TCL (Turquía)', region: 'Europa', tier: 5, req: 70, salary: 24000, erl: true },
    LLA:   { name: 'LLA', full: 'LLA (Latinoamérica)', region: 'Latinoamérica', tier: 5, req: 70, salary: 26000 },
  };
  C.LEAGUE_ORDER = ['LCK', 'LPL', 'LEC', 'LCS', 'LCP', 'CBLOL', 'LCKC', 'LDL', 'VCS', 'PCS', 'NACL', 'LES', 'LFL', 'PL', 'NLC', 'TCL', 'LLA'];
  // Ligas donde un extranjero necesita más nivel
  C.FOREIGN_EXTRA = { LCK: 3, LPL: 2, LCKC: 3, LDL: 2 };

  // Nacionalidades: liga de cantera y "región natal" (para saber si eres extranjero)
  C.NATIONS = [
    { id: 'ES', name: 'España', flag: '🇪🇸', home: 'LES', zone: 'EU' },
    { id: 'PT', name: 'Portugal', flag: '🇵🇹', home: 'LES', zone: 'EU' },
    { id: 'FR', name: 'Francia', flag: '🇫🇷', home: 'LFL', zone: 'EU' },
    { id: 'BE', name: 'Bélgica', flag: '🇧🇪', home: 'LFL', zone: 'EU' },
    { id: 'IT', name: 'Italia', flag: '🇮🇹', home: 'LFL', zone: 'EU' },
    { id: 'DE', name: 'Alemania', flag: '🇩🇪', home: 'PL', zone: 'EU' },
    { id: 'AT', name: 'Austria', flag: '🇦🇹', home: 'PL', zone: 'EU' },
    { id: 'CH', name: 'Suiza', flag: '🇨🇭', home: 'PL', zone: 'EU' },
    { id: 'PL', name: 'Polonia', flag: '🇵🇱', home: 'PL', zone: 'EU' },
    { id: 'CZ', name: 'Chequia', flag: '🇨🇿', home: 'PL', zone: 'EU' },
    { id: 'GB', name: 'Reino Unido', flag: '🇬🇧', home: 'NLC', zone: 'EU' },
    { id: 'IE', name: 'Irlanda', flag: '🇮🇪', home: 'NLC', zone: 'EU' },
    { id: 'DK', name: 'Dinamarca', flag: '🇩🇰', home: 'NLC', zone: 'EU' },
    { id: 'SE', name: 'Suecia', flag: '🇸🇪', home: 'NLC', zone: 'EU' },
    { id: 'NO', name: 'Noruega', flag: '🇳🇴', home: 'NLC', zone: 'EU' },
    { id: 'FI', name: 'Finlandia', flag: '🇫🇮', home: 'NLC', zone: 'EU' },
    { id: 'NL', name: 'Países Bajos', flag: '🇳🇱', home: 'NLC', zone: 'EU' },
    { id: 'TR', name: 'Turquía', flag: '🇹🇷', home: 'TCL', zone: 'EU' },
    { id: 'GR', name: 'Grecia', flag: '🇬🇷', home: 'TCL', zone: 'EU' },
    { id: 'KR', name: 'Corea del Sur', flag: '🇰🇷', home: 'LCKC', zone: 'KR' },
    { id: 'CN', name: 'China', flag: '🇨🇳', home: 'LDL', zone: 'CN' },
    { id: 'TW', name: 'Taiwán', flag: '🇹🇼', home: 'PCS', zone: 'AP' },
    { id: 'JP', name: 'Japón', flag: '🇯🇵', home: 'PCS', zone: 'AP' },
    { id: 'VN', name: 'Vietnam', flag: '🇻🇳', home: 'VCS', zone: 'AP' },
    { id: 'US', name: 'Estados Unidos', flag: '🇺🇸', home: 'NACL', zone: 'NA' },
    { id: 'CA', name: 'Canadá', flag: '🇨🇦', home: 'NACL', zone: 'NA' },
    { id: 'BR', name: 'Brasil', flag: '🇧🇷', home: 'CBLOL', zone: 'BR' },
    { id: 'MX', name: 'México', flag: '🇲🇽', home: 'LLA', zone: 'LA' },
    { id: 'AR', name: 'Argentina', flag: '🇦🇷', home: 'LLA', zone: 'LA' },
    { id: 'CL', name: 'Chile', flag: '🇨🇱', home: 'LLA', zone: 'LA' },
    { id: 'CO', name: 'Colombia', flag: '🇨🇴', home: 'LLA', zone: 'LA' },
    { id: 'PE', name: 'Perú', flag: '🇵🇪', home: 'LLA', zone: 'LA' },
  ];
  // Zona natural de cada liga (para la regla de extranjeros)
  C.LEAGUE_ZONE = { LCK: 'KR', LCKC: 'KR', LPL: 'CN', LDL: 'CN', LEC: 'EU', LES: 'EU', LFL: 'EU', PL: 'EU', NLC: 'EU', TCL: 'EU',
    LCS: 'NA', NACL: 'NA', CBLOL: 'BR', LLA: 'LA', LCP: 'AP', PCS: 'AP', VCS: 'AP' };

  // Atributos del jugador
  C.ATTRS = [
    { id: 'mecanicas', name: 'Mecánicas', group: 'mech', desc: 'Precisión, combos y reflejos en las peleas.' },
    { id: 'farmeo', name: 'Farmeo', group: 'mech', desc: 'Last hit, oro por minuto y control de oleadas.' },
    { id: 'macro', name: 'Macro', group: 'macro', desc: 'Rotaciones, objetivos y lectura de la partida.' },
    { id: 'vision', name: 'Visión', group: 'macro', desc: 'Control de wards y lectura del mapa.' },
    { id: 'mentalidad', name: 'Mentalidad', group: 'ment', desc: 'Resistencia al tilt y rendimiento bajo presión.' },
    { id: 'comunicacion', name: 'Comunicación', group: 'ment', desc: 'Coordinación y llamadas con el equipo.' },
  ];
  C.ATTR_NAME = Object.fromEntries(C.ATTRS.map((a) => [a.id, a.name]));

  C.STYLES = [
    { id: 'agresivo', name: 'Agresivo', attr: 'mecanicas', desc: '+3 Mecánicas. Más asesinatos y más muertes.' },
    { id: 'farmeador', name: 'Farmeador', attr: 'farmeo', desc: '+3 Farmeo. Más oro, partidas más seguras.' },
    { id: 'estratega', name: 'Estratega', attr: 'macro', desc: '+3 Macro. Lees la partida antes que nadie.' },
    { id: 'shotcaller', name: 'Shotcaller', attr: 'comunicacion', desc: '+3 Comunicación. Tu equipo juega mejor contigo.' },
    { id: 'frio', name: 'Sangre fría', attr: 'mentalidad', desc: '+3 Mentalidad. No te tilteas nunca.' },
  ];

  // Acciones diarias. energy = coste de energía. stat = atributo que mejora.
  C.ACTIONS = [
    { id: 'train_mec', name: 'Aim y mecánicas', stat: 'mecanicas', energy: 12, desc: 'Herramientas de práctica, combos y kiteo.' },
    { id: 'train_farm', name: 'Practicar farmeo', stat: 'farmeo', energy: 10, desc: 'Last hit en el campo de pruebas y gestión de oleadas.' },
    { id: 'vods', name: 'Revisar VODs', stat: 'macro', energy: 8, desc: 'Analiza partidas pro y tus errores.' },
    { id: 'map', name: 'Estudiar el mapa', stat: 'vision', energy: 8, desc: 'Rutas de warding, tiempos de objetivos.' },
    { id: 'mental', name: 'Trabajo mental', stat: 'mentalidad', energy: 6, desc: 'Meditación, rutina y control del tilt.' },
    { id: 'scrim', name: 'Scrim con el equipo', stat: 'comunicacion', energy: 12, desc: 'Practica llamadas y sinergias. También algo de macro.', needsTeam: true },
    { id: 'premade', name: 'Jugar con amigos', stat: 'comunicacion', energy: 8, desc: 'Flex y premades para aprender a comunicar.', kidOnly: true },
    { id: 'champ', name: 'Practicar campeón', stat: null, energy: 10, desc: 'Sube la maestría con un campeón de tu pool.' },
    { id: 'soloq', name: 'Jugar SoloQ', stat: null, energy: 12, desc: 'Sube de rango, gana maestría y un poco de todo.' },
    { id: 'stream', name: 'Hacer stream', stat: null, energy: 8, desc: 'Gana dinero y seguidores. No entrenas tanto.' },
    { id: 'rest', name: 'Descansar', stat: null, energy: -35, desc: 'Recupera energía y moral.' },
    { id: 'promo', name: 'Acción publicitaria', stat: null, energy: 6, desc: 'Cumple con un patrocinador.', needsPromo: true },
  ];

  // Tienda: 5 niveles por objeto
  C.GEAR = [
    { id: 'raton', name: 'Ratón', boost: { mecanicas: 0.08 }, match: 0.35, prices: [60, 180, 450, 3300, 16800],
      levels: ['Ratón de oficina', 'Ratón gaming básico', 'Ratón ligero 59 g', 'Ratón pro inalámbrico', 'Ratón de fibra de carbono a medida'] },
    { id: 'teclado', name: 'Teclado', boost: { farmeo: 0.08 }, match: 0.25, prices: [50, 150, 380, 2700, 13200],
      levels: ['Teclado de membrana', 'Mecánico básico', 'Mecánico TKL', 'Magnético de respuesta rápida', 'Custom de competición'] },
    { id: 'monitor', name: 'Monitor', boost: { vision: 0.07, mecanicas: 0.03 }, match: 0.3, prices: [120, 300, 700, 4500, 21000],
      levels: ['60 Hz', '144 Hz', '240 Hz', '360 Hz OLED', '540 Hz de torneo'] },
    { id: 'auriculares', name: 'Auriculares', boost: { comunicacion: 0.08 }, match: 0.2, prices: [40, 120, 300, 2100, 9600],
      levels: ['Cascos baratos', 'Headset gaming', 'Sonido envolvente', 'Inalámbricos pro', 'IEM de estudio'] },
    { id: 'silla', name: 'Silla', boost: {}, energySave: 0.06, match: 0, prices: [70, 220, 500, 3300, 14400],
      levels: ['Silla de cocina', 'Silla gaming', 'Silla ergonómica', 'Silla de oficina premium', 'Silla hecha a medida'] },
    { id: 'pc', name: 'PC', boost: { all: 0.03 }, luck: 1, match: 0.3, prices: [300, 800, 1600, 9000, 36000],
      levels: ['Portátil viejo', 'PC de gama media', 'PC gaming', 'PC de gama alta', 'Bestia de última generación'] },
    { id: 'internet', name: 'Conexión', boost: {}, luck: 2, match: 0.15, prices: [30, 100, 250, 1800, 8400],
      levels: ['WiFi compartido', 'Fibra 300 Mb', 'Fibra 1 Gb', 'Fibra simétrica + router gaming', 'Línea dedicada de baja latencia'] },
  ];

  // Staff personal (coste por semana). Tres niveles: Básico, Profesional y Élite.
  C.STAFF_TIERS = ['Básico', 'Profesional', 'Élite'];
  C.STAFF_TIER_COST = [1, 3.5, 9];
  C.STAFF = [
    { id: 'coach', name: 'Entrenador personal', cost: 400, eff: [0.10, 0.20, 0.30], desc: (v) => `+1 acción por semana y +${Math.round(v * 100)} % a todo el entrenamiento.` },
    { id: 'fisico', name: 'Preparador físico', cost: 300, eff: [5, 8, 12], dec: [0.25, 0.45, 0.65], desc: (v, t) => `+${v} de energía cada semana. Frena un ${Math.round(C.STAFF[1].dec[t] * 100)} % el declive por edad.` },
    { id: 'psico', name: 'Psicólogo deportivo', cost: 250, eff: [0.25, 0.45, 0.70], desc: (v) => `+${Math.round(v * 100)} % a Mentalidad. Las derrotas bajan menos la moral.` },
    { id: 'nutri', name: 'Nutricionista', cost: 180, eff: [12, 17, 22], desc: (v) => `+${v} de energía recuperada cada semana.` },
    { id: 'analista', name: 'Analista de vídeo', cost: 300, eff: [0.25, 0.45, 0.70], desc: (v) => `+${Math.round(v * 100)} % a Macro y Visión.` },
    { id: 'champcoach', name: 'Coach de campeones', cost: 220, eff: [0.40, 0.70, 1.00], desc: (v) => `+${Math.round(v * 100)} % de maestría al practicar campeones.` },
    { id: 'cm', name: 'Community manager', cost: 160, eff: [0.40, 0.70, 1.00], desc: (v) => `+${Math.round(v * 100)} % de seguidores en streams y más patrocinadores.` },
    { id: 'agente', name: 'Agente', cost: 0, pct: [0.08, 0.10, 0.12], eff: [0.12, 0.20, 0.30], desc: (v, t) => `Cobra el ${Math.round(C.STAFF[7].pct[t] * 100)} % de tu sueldo. +${Math.round(v * 100)} % en lo que pueden pagarte y más ofertas.` },
  ];

  // Experiencias: compras de un solo uso, una vez por split cada una
  C.EXPERIENCES = [
    { id: 'campus', name: 'Campus de verano para promesas', price: 600, gains: { mecanicas: 1.2, farmeo: 1 }, desc: 'Una semana de entrenamiento con otros jóvenes.' },
    { id: 'retiro', name: 'Retiro de concentración', price: 6000, gains: { mentalidad: 2, comunicacion: 1 }, morale: 20, desc: 'Desconectas y vuelves con la cabeza fría.' },
    { id: 'neuro', name: 'Programa de neuroentrenamiento', price: 15000, gains: { mecanicas: 2, farmeo: 1 }, desc: 'Tiempo de reacción y precisión en laboratorio.' },
    { id: 'analisis', name: 'Curso con un exanalista de la LCK', price: 18000, gains: { macro: 1.5, vision: 1.5 }, desc: 'Teoría de rotaciones, oleadas y visión de alto nivel.' },
    { id: 'bootcamp_cn', name: 'Bootcamp en China', price: 30000, gains: { all: 1 }, mastery: 3, desc: 'Dos semanas de SoloQ en servidor chino y scrims.' },
    { id: 'bootcamp_kr', name: 'Bootcamp en Corea', price: 45000, gains: { all: 1.3 }, mastery: 5, desc: 'Dos semanas en Seúl con scrims contra equipos de la LCK.' },
    { id: 'sede', name: 'Sala de entrenamiento en casa', price: 90000, once: true, desc: 'Una sola compra: +10 % a todo el entrenamiento para siempre.' },
  ];

  // Rangos de SoloQ. lp total: 100 por división (IV→I).
  C.TIERS = [
    { id: 'iron', name: 'Hierro', exp: 30 }, { id: 'bronze', name: 'Bronce', exp: 39 }, { id: 'silver', name: 'Plata', exp: 47 },
    { id: 'gold', name: 'Oro', exp: 54 }, { id: 'plat', name: 'Platino', exp: 60 }, { id: 'emerald', name: 'Esmeralda', exp: 65 },
    { id: 'diamond', name: 'Diamante', exp: 70 },
  ];
  C.APEX = [
    { id: 'master', name: 'Maestro', from: 0, exp: 75 },
    { id: 'gm', name: 'Gran Maestro', from: 350, exp: 80 },
    { id: 'chall', name: 'Challenger', from: 800, exp: 84 },
  ];

  // Marcas por nivel: 1 local, 2 nacional, 3 internacional, 4 global
  C.SPONSOR_LEVELS = ['', 'Local', 'Nacional', 'Internacional', 'Global'];
  C.SPONSOR_BRANDS = [
    { name: 'Cafetería Nexo', kind: 'Hostelería', level: 1 }, { name: 'PixelBox Informática', kind: 'Tienda de PC', level: 1 },
    { name: 'Gimnasio Ironcore', kind: 'Deporte', level: 1 }, { name: 'Pizzería Bianca', kind: 'Comida', level: 1 },
    { name: 'Nexwave Periféricos', kind: 'Periféricos', level: 2 }, { name: 'VoltRush', kind: 'Bebida energética', level: 2 },
    { name: 'Kairo Sillas', kind: 'Sillas gaming', level: 2 }, { name: 'Pulse Mobile', kind: 'Telefonía', level: 2 },
    { name: 'Fizzy Cola', kind: 'Refrescos', level: 2 },
    { name: 'Orbis PC', kind: 'Ordenadores', level: 3 }, { name: 'Lumen Wear', kind: 'Ropa', level: 3 },
    { name: 'TurboFood', kind: 'Comida a domicilio', level: 3 }, { name: 'NovaBank', kind: 'Banca', level: 3 },
    { name: 'Astra Motors', kind: 'Coches', level: 4 }, { name: 'Helix Energy', kind: 'Bebida energética', level: 4 },
    { name: 'Zenith Electronics', kind: 'Electrónica', level: 4 }, { name: 'Aurora Airlines', kind: 'Aerolínea', level: 4 },
    { name: 'Titan Watches', kind: 'Relojes de lujo', level: 4 },
  ];

  C.FAME = [
    { min: 0, name: 'Desconocido' }, { min: 2000, name: 'Promesa' }, { min: 15000, name: 'Conocido' },
    { min: 80000, name: 'Popular' }, { min: 300000, name: 'Estrella' }, { min: 1000000, name: 'Leyenda' },
  ];

  // Logros: cond recibe el estado; reward en dinero y seguidores
  C.ACHIEVEMENTS = [
    { id: 'pro', name: 'Profesional', desc: 'Firma tu primer contrato profesional.', money: 500, fans: 500 },
    { id: 'prodigy', name: 'Niño prodigio', desc: 'Debuta como profesional con 15 años o menos.', money: 2000, fans: 5000 },
    { id: 'win1', name: 'Primera victoria', desc: 'Gana tu primera serie oficial.', money: 300, fans: 300 },
    { id: 'g100', name: 'Centenario', desc: 'Juega 100 partidas oficiales.', money: 5000, fans: 5000 },
    { id: 'g500', name: 'Veterano', desc: 'Juega 500 partidas oficiales.', money: 25000, fans: 30000 },
    { id: 'penta', name: 'Pentakill', desc: 'Consigue un pentakill en un partido oficial.', money: 3000, fans: 20000 },
    { id: 'mvp10', name: 'Hombre partido', desc: 'Consigue 10 MVP de serie.', money: 5000, fans: 10000 },
    { id: 'title', name: 'Campeón', desc: 'Gana tu primer título.', money: 5000, fans: 10000 },
    { id: 'titles10', name: 'Coleccionista', desc: 'Gana 10 títulos.', money: 50000, fans: 100000 },
    { id: 'splitmvp', name: 'MVP de liga', desc: 'Gana un premio MVP de split.', money: 10000, fans: 20000 },
    { id: 'intl', name: 'Internacional', desc: 'Juega el MSI o los Worlds.', money: 5000, fans: 20000 },
    { id: 'msi', name: 'Rey del MSI', desc: 'Gana el MSI.', money: 20000, fans: 80000 },
    { id: 'worlds', name: 'Campeón del mundo', desc: 'Gana los Worlds.', money: 50000, fans: 200000 },
    { id: 'worlds3', name: 'Dinastía', desc: 'Gana 3 Worlds.', money: 200000, fans: 500000 },
    { id: 'major', name: 'Gran escenario', desc: 'Juega en la LCK, LPL, LEC o LCS.', money: 5000, fans: 15000 },
    { id: 'korea', name: 'Rumbo a Seúl', desc: 'Ficha por un equipo de la LCK.', money: 10000, fans: 30000 },
    { id: 'chall', name: 'Challenger', desc: 'Llega a Challenger en SoloQ.', money: 2000, fans: 10000 },
    { id: 'ovr80', name: 'Nivel profesional', desc: 'Alcanza 80 de media.', money: 2000, fans: 3000 },
    { id: 'ovr90', name: 'Clase mundial', desc: 'Alcanza 90 de media.', money: 10000, fans: 30000 },
    { id: 'ovr95', name: 'Leyenda viva', desc: 'Alcanza 95 de media.', money: 50000, fans: 100000 },
    { id: 'fans100k', name: 'Influencer', desc: 'Llega a 100.000 seguidores.', money: 5000, fans: 0 },
    { id: 'fans1m', name: 'Icono', desc: 'Llega a 1 millón de seguidores.', money: 50000, fans: 0 },
    { id: 'rich', name: 'Millonario', desc: 'Ten 1.000.000 € en la cuenta.', money: 0, fans: 50000 },
    { id: 'setup', name: 'Setup definitivo', desc: 'Todo el equipamiento al nivel máximo.', money: 0, fans: 20000 },
    { id: 'elite', name: 'Staff de élite', desc: 'Ten 3 miembros del staff en nivel Élite.', money: 0, fans: 20000 },
  ];

  // Academias y su primer equipo
  C.ACADEMY = {
    'GIANTX Pride': 'GIANTX', 'KC Blue Stars': 'Karmine Corp', 'Vitality Bee': 'Team Vitality', 'Vitality Rising Bees': 'Team Vitality',
    'MKOI Fenix': 'Movistar KOI', 'Los Heretics': 'Team Heretics', 'G2 NORD': 'G2 Esports',
    'BNK FearX Youth': 'BNK FearX', 'DN SOOPers Challengers': 'DN SOOPers', 'DRX Challengers': 'KIWOOM DRX', 'Dplus KIA Challengers': 'Dplus KIA',
    'Gen.G Global Academy': 'Gen.G', 'HANJIN BRION Challengers': 'HANJIN BRION', 'Hanwha Life Esports Challengers': 'Hanwha Life Esports',
    'KT Rolster Challengers': 'KT Rolster', 'Nongshim Esports Academy': 'Nongshim RedForce', 'T1 Esports Academy': 'T1',
    "Anyone's Legend Young": "Anyone's Legend", 'Bilibili Gaming Junior': 'Bilibili Gaming', 'EDG Youth': 'EDward Gaming', 'IG Youth': 'Invictus Gaming',
    'JDG Youth': 'JD Gaming', 'LGD Gaming Youth Team': 'LGD Gaming', 'LNG Esports Academy': 'LNG Esports', 'Oh My God Academy': 'Oh My God',
    'TT Gaming Young': 'ThunderTalk Gaming', 'Team WE Academy': 'Team WE', 'Top Esports Challenger': 'TOP Esports', 'UP Academy': 'Ultra Prime',
    'Weibo Gaming Youth Team': 'Weibo Gaming',
  };

  C.MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  RC.C = C;
})(window.RC);
