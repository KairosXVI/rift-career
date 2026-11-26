# Rift Career

Simulador de carrera de un **jugador** profesional de League of Legends, inspirado en el estilo de MyRiftManager. No llevas un equipo: eres el jugador. Entrenas, compras equipamiento, contratas staff, eliges tus campeones, negocias contratos y subes desde una academia hasta los Worlds.

Proyecto personal sin ánimo de lucro.

## Cómo jugar

Abre `index.html` desde un servidor web (GitHub Pages o, en local, `python3 -m http.server`). Abrir el archivo directamente con doble clic no funciona porque el juego carga sus datos con `fetch`.

### Modos
- **Fichaje de academia (2026, 16 años):** eliges entre tres ofertas de equipos de la liga de tu país.
- **Desde Hierro (2018, 10 años):** etapa amateur por meses. Sube en SoloQ y aprovecha los eventos hasta que te fiche una academia, normalmente entre los 14 y los 18 años. El mundo profesional usa las plantillas reales de 2026.

### Cada semana
- 4 acciones (5 si contratas un entrenador personal): entrenar un atributo, practicar un campeón, SoloQ, stream, descansar o cumplir con un patrocinador.
- Al avanzar se juega la jornada de todas las ligas. Todo se simula: draft, partida y estadísticas.

### Temporada
Pretemporada → Winter Split → Spring Split → MSI (y EMEA Masters para las ERL) → Summer Split → Worlds → mercado de fichajes. Cada split tiene 9 jornadas y playoffs a mejor de 5 con los 6 primeros. Al inicio de cada split sale un parche que cambia el meta.

- **MSI:** Play-In con dos grupos de doble eliminación (Bo3) y Bracket Stage de 8 equipos a doble eliminación (Bo5).
- **Worlds:** Play-In (4º de LCK contra 4º de LPL), fase suiza de 16 equipos y eliminatorias a Bo5.

### Extras
Marcador completo de los 10 jugadores en cada partida, ranking mundial de jugadores y equipos, logros, patrocinadores por niveles (local, nacional, internacional y global), staff con tres niveles y experiencias de pago como bootcamps.

### Mercado
Las ofertas llegan en pretemporada, durante el MSI y después de los Worlds. Puedes negociar el sueldo con 3 intentos dentro de un rango, o ofrecerte tú a cualquier equipo de las 17 ligas si cumples su nivel mínimo. Los extranjeros necesitan más nivel en Corea y China.

### Fin de la carrera
Puedes retirarte desde los 27 años. A partir de esa edad los atributos bajan cada año. Si pasas un año entero sin equipo, la carrera termina. Las carreras acabadas se guardan en el Salón de la fama.

## Datos
- Plantillas y valoraciones (mecánica, macro, mentalidad) de 889 jugadores: MyRiftManager.
- Iconos de campeones: Riot Data Dragon.
- Logos de equipos: Leaguepedia.

`tools/fetch_assets.py` vuelve a descargarlo todo. `tools/headless.js` simula carreras completas sin interfaz para comprobar el equilibrio:

```bash
node tools/headless.js pro 6 good
```

League of Legends y sus campeones son marcas de Riot Games. Los logos pertenecen a sus equipos.
