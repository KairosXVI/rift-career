"""Empaqueta iconos de campeones y logos de equipos en dos JSON con data URIs (WebP),
para cargar todo en dos peticiones y funcionar en cualquier alojamiento."""
import base64, io, json, os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def uri(path):
    im = Image.open(path).convert('RGBA')
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=82, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()

champs = {}
d = os.path.join(ROOT, 'assets/champions')
for f in sorted(os.listdir(d)):
    champs[f[:-4]] = uri(os.path.join(d, f))
teams = {}
d = os.path.join(ROOT, 'assets/teams')
for f in sorted(os.listdir(d)):
    teams['assets/teams/' + f] = uri(os.path.join(d, f))
json.dump(champs, open(os.path.join(ROOT, 'data/champ_icons.json'), 'w'), separators=(',', ':'))
json.dump(teams, open(os.path.join(ROOT, 'data/team_logos.json'), 'w'), separators=(',', ':'))
print(len(champs), len(teams))
