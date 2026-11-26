"""Descarga datos y recursos para Rift Career.

Uso: python3 tools/fetch_assets.py
 - data/players.json   (plantillas 2026, de myriftmanager.com)
 - assets/champions/*.png + data/champions.json (Riot Data Dragon)
 - assets/teams/*.png + data/teams.json (Leaguepedia)
"""
import io, json, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "rift-career-fan-game/1.0"}


def get(url, binary=False, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                b = r.read()
                return b if binary else b.decode("utf-8")
        except Exception as e:
            if i == tries - 1:
                raise
            time.sleep(1.5 * (i + 1))


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def save_img(raw, path, size):
    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    im.thumbnail((size, size), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2), im)
    canvas.save(path, "PNG", optimize=True)


def players():
    raw = get("https://myriftmanager.com/data/players.json")
    data = json.loads(raw)
    out = []
    for p in data:
        out.append({
            "name": p["name"], "role": p["role"], "team": p["team"], "league": p["league"],
            "age": p.get("age", 22), "mech": p.get("mech", 70), "macro": p.get("macro", 70),
            "ment": p.get("ment", 70), "pool": p.get("champPool") or [],
        })
    json.dump(out, open(os.path.join(ROOT, "data/players.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    return out


def champions():
    ver = json.loads(get("https://ddragon.leagueoflegends.com/api/versions.json"))[0]
    champs = json.loads(get(f"https://ddragon.leagueoflegends.com/cdn/{ver}/data/es_ES/champion.json"))["data"]
    os.makedirs(os.path.join(ROOT, "assets/champions"), exist_ok=True)
    out = {}
    for cid, c in champs.items():
        path = os.path.join(ROOT, "assets/champions", cid + ".png")
        if not os.path.exists(path):
            raw = get(f"https://ddragon.leagueoflegends.com/cdn/{ver}/img/champion/{cid}.png", binary=True)
            save_img(raw, path, 64)
        out[cid] = {"name": c["name"], "tags": c["tags"]}
    json.dump({"version": ver, "champions": out}, open(os.path.join(ROOT, "data/champions.json"), "w"),
              ensure_ascii=False, separators=(",", ":"))
    print("campeones:", len(out), "version", ver)


API = "https://lol.fandom.com/api.php?"


def cargo_teams(names):
    res = {}
    for i in range(0, len(names), 20):
        chunk = names[i:i + 20]
        where = " OR ".join('Name="%s"' % n.replace('"', '\\"') for n in chunk)
        q = urllib.parse.urlencode({"action": "cargoquery", "tables": "Teams", "fields": "Name,Short,Image",
                                    "where": where, "limit": 100, "format": "json"})
        for row in json.loads(get(API + q)).get("cargoquery", []):
            t = row["title"]
            res[t["Name"]] = t
        time.sleep(0.5)
    return res


def image_urls(files):
    res = {}
    for i in range(0, len(files), 40):
        chunk = files[i:i + 40]
        q = urllib.parse.urlencode({"action": "query", "titles": "|".join("File:" + f for f in chunk),
                                    "prop": "imageinfo", "iiprop": "url", "iiurlwidth": 128, "format": "json"})
        js = json.loads(get(API + q))
        norm = {n["to"]: n["from"] for n in js["query"].get("normalized", [])}
        for pg in js["query"]["pages"].values():
            if "imageinfo" in pg:
                title = norm.get(pg["title"], pg["title"])
                res[title[5:]] = pg["imageinfo"][0].get("thumburl") or pg["imageinfo"][0]["url"]
        time.sleep(0.5)
    return res


def teams(pl):
    names = sorted({p["team"] for p in pl})
    league_of = {p["team"]: p["league"] for p in pl}
    info = cargo_teams(names)
    want = {}
    for n in names:
        cands = [n + "logo square.png"]
        if n in info and info[n].get("Image"):
            cands.append(info[n]["Image"].replace("profile", "square"))
            cands.append(info[n]["Image"])
        want[n] = cands
    urls = image_urls(sorted({f for c in want.values() for f in c}))
    os.makedirs(os.path.join(ROOT, "assets/teams"), exist_ok=True)
    out, missing = {}, []
    for n in names:
        short = (info.get(n) or {}).get("Short") or "".join(w[0] for w in n.split()[:3]).upper()
        entry = {"name": n, "short": short, "league": league_of[n], "logo": None}
        for f in want[n]:
            if f in urls:
                path = os.path.join("assets/teams", slug(n) + ".png")
                try:
                    if not os.path.exists(os.path.join(ROOT, path)):
                        save_img(get(urls[f], binary=True), os.path.join(ROOT, path), 64)
                    entry["logo"] = path
                    break
                except Exception as e:
                    print("fallo", n, e)
        if not entry["logo"]:
            missing.append(n)
        out[n] = entry
    json.dump(out, open(os.path.join(ROOT, "data/teams.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print("equipos:", len(out), "sin logo:", len(missing), missing)


if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    pl = players()
    print("jugadores:", len(pl))
    champions()
    teams(pl)
