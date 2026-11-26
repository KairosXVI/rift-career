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
    { id: 'raton', name: 'Ratón', boost: { mecanicas: 0.08 }, match: 0.35, prices: [60, 180, 450, 1100, 2800],
      levels: ['Ratón de oficina', 'Ratón gaming básico', 'Ratón ligero 59 g', 'Ratón pro inalámbrico', 'Ratón de fibra de carbono a medida'] },
    { id: 'teclado', name: 'Teclado', boost: { farmeo: 0.08 }, match: 0.25, prices: [50, 150, 380, 900, 2200],
      levels: ['Teclado de membrana', 'Mecánico básico', 'Mecánico TKL', 'Magnético de respuesta rápida', 'Custom de competición'] },
    { id: 'monitor', name: 'Monitor', boost: { vision: 0.07, mecanicas: 0.03 }, match: 0.3, prices: [120, 300, 700, 1500, 3500],
      levels: ['60 Hz', '144 Hz', '240 Hz', '360 Hz OLED', '540 Hz de torneo'] },
    { id: 'auriculares', name: 'Auriculares', boost: { comunicacion: 0.08 }, match: 0.2, prices: [40, 120, 300, 700, 1600],
      levels: ['Cascos baratos', 'Headset gaming', 'Sonido envolvente', 'Inalámbricos pro', 'IEM de estudio'] },
    { id: 'silla', name: 'Silla', boost: {}, energySave: 0.06, match: 0, prices: [70, 220, 500, 1100, 2400],
      levels: ['Silla de cocina', 'Silla gaming', 'Silla ergonómica', 'Silla de oficina premium', 'Silla hecha a medida'] },
    { id: 'pc', name: 'PC', boost: { all: 0.03 }, luck: 1, match: 0.3, prices: [300, 800, 1600, 3000, 6000],
      levels: ['Portátil viejo', 'PC de gama media', 'PC gaming', 'PC de gama alta', 'Bestia de última generación'] },
    { id: 'internet', name: 'Conexión', boost: {}, luck: 2, match: 0.15, prices: [30, 100, 250, 600, 1400],
      levels: ['WiFi compartido', 'Fibra 300 Mb', 'Fibra 1 Gb', 'Fibra simétrica + router gaming', 'Línea dedicada de baja latencia'] },
  ];

  // Staff personal (coste por semana)
  C.STAFF = [
    { id: 'coach', name: 'Entrenador personal', cost: 350, desc: '+1 acción por semana y +10 % a todo el entrenamiento.' },
    { id: 'psico', name: 'Psicólogo deportivo', cost: 200, desc: '+25 % a Mentalidad. Las derrotas bajan la mitad de moral.' },
    { id: 'nutri', name: 'Nutricionista y fisio', cost: 160, desc: '+12 de energía recuperada cada semana.' },
    { id: 'analista', name: 'Analista de vídeo', cost: 260, desc: '+25 % a Macro y Visión.' },
    { id: 'champcoach', name: 'Coach de campeones', cost: 180, desc: '+40 % de maestría al practicar campeones.' },
    { id: 'cm', name: 'Community manager', cost: 140, desc: '+40 % de seguidores en streams y más interés de patrocinadores.' },
    { id: 'agente', name: 'Agente', cost: 0, pct: 0.08, desc: 'Cobra el 8 % de tu sueldo. Mejores contratos y más ofertas.' },
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

  C.SPONSOR_BRANDS = [
    { name: 'Nexwave Periféricos', kind: 'Periféricos' }, { name: 'VoltRush', kind: 'Bebida energética' },
    { name: 'Kairo Sillas', kind: 'Sillas gaming' }, { name: 'Pulse Mobile', kind: 'Telefonía' },
    { name: 'Orbis PC', kind: 'Ordenadores' }, { name: 'Lumen Wear', kind: 'Ropa' },
    { name: 'NovaBank', kind: 'Banco' }, { name: 'Fizzy Cola', kind: 'Refrescos' },
    { name: 'TurboFood', kind: 'Comida a domicilio' }, { name: 'Astra Motors', kind: 'Coches' },
  ];

  C.FAME = [
    { min: 0, name: 'Desconocido' }, { min: 2000, name: 'Promesa' }, { min: 15000, name: 'Conocido' },
    { min: 80000, name: 'Popular' }, { min: 300000, name: 'Estrella' }, { min: 1000000, name: 'Leyenda' },
  ];

  C.MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  RC.C = C;
})(window.RC);
