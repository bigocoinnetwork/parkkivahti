"""Tuottaa julkaisuversion omat karttatiedostot: dist/data/basemap.json (kuntarajat, pääteiet, taajamanimet)
ja dist/data/streets.tsv (katuhakemisto osoitehakuun ilman ulkoista palvelua).

Vaatii: pip install shapely
Syötteet kansiossa work/offline/ (haetaan käsin, kyselyt alla):
  kunta.json   https://geo.stat.fi/geoserver/tilastointialueet/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=tilastointialueet:kunta4500k_2026&outputFormat=application/json&srsName=EPSG:4326
  roads.json   Overpass: [out:json];area["ISO3166-1"="FI"][admin_level=2]->.fi;way[highway~"^(motorway|trunk|primary)$"](area.fi);out geom;
  places.csv   Overpass: [out:csv(::lat,::lon,place,name;false;"|")];area["ISO3166-1"="FI"][admin_level=2]->.fi;node[place~"^(city|town|village|suburb|quarter|neighbourhood)$"][name](area.fi);out;
  streets.csv  Overpass: [out:csv(::lat,::lon,name;false;"|")];area["ISO3166-1"="FI"][admin_level=2]->.fi;way[highway~"^(residential|primary|secondary|tertiary|unclassified|living_street|pedestrian|trunk)$"][name](area.fi);out center;
"""
import csv, json, pathlib, re
from shapely.geometry import shape, LineString, Point
from shapely.ops import linemerge
from shapely.strtree import STRtree
ROOT = pathlib.Path(__file__).resolve().parents[1]; RAW = ROOT / 'work' / 'offline'; OUT = ROOT / 'dist' / 'data'
rc = lambda cs, nd=3: [[round(x, nd), round(y, nd)] for x, y in cs]
kf = json.loads((RAW / 'kunta.json').read_text(encoding='utf-8'))['features']
kg = [shape(f['geometry']) for f in kf]; kn = [f['properties']['nimi'] for f in kf]; tree = STRtree(kg)
def muni(lat, lon):
    p = Point(lon, lat)
    for i in tree.query(p):
        if kg[i].contains(p): return kn[i]
    return kn[tree.nearest(p)]
munis = []
for f, g in zip(kf, kg):
    g = g.simplify(0.004, preserve_topology=True); polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    munis.append({'n': f['properties']['nimi'], 'p': [[rc(p.exterior.coords)] for p in polys if p.area > 2e-5]})
lines = {'motorway': [], 'trunk': [], 'primary': []}
for e in json.loads((RAW / 'roads.json').read_text(encoding='utf-8'))['elements']:
    h = e.get('tags', {}).get('highway')
    if h in lines and len(e.get('geometry') or []) > 1: lines[h].append(LineString([(p['lon'], p['lat']) for p in e['geometry']]))
roads = {}
for h, ls in lines.items():
    m = linemerge(ls); gs = [m] if m.geom_type == 'LineString' else list(m.geoms)
    roads[h] = [rc(g.simplify(0.003).coords) for g in gs if g.length > 0.01]
labels = []
with open(RAW / 'places.csv', encoding='utf-8') as fh:
    for r in csv.reader(fh, delimiter='|'):
        if len(r) == 4 and r[2] in ('city', 'town'): labels.append([r[3], round(float(r[0]), 3), round(float(r[1]), 3), 1 if r[2] == 'city' else 2])
(OUT / 'basemap.json').write_text(json.dumps({'munis': munis, 'roads': roads, 'labels': labels}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
grid = {}
with open(RAW / 'streets.csv', encoding='utf-8') as fh:
    for r in csv.reader(fh, delimiter='|'):
        if len(r) != 3 or not r[2] or re.fullmatch(r'(Mt|Vt|Kt|St)\s*\d+', r[2]): continue
        a, b = float(r[0]), float(r[1]); v = grid.setdefault((r[2], round(a, 1), round(b / 2, 1)), [0, 0, 0]); v[0] += a; v[1] += b; v[2] += 1
best = {}
for (n, _, _), v in grid.items():
    la, lo = v[0] / v[2], v[1] / v[2]; k = (n, muni(la, lo))
    if k not in best or best[k][2] < v[2]: best[k] = (la, lo, v[2])
names = sorted(kn); mi = {m: i for i, m in enumerate(names)}
rows = ['#kunnat\t' + '\t'.join(names)] + [f'{n}\t{mi[m]}\t{la:.4f}\t{lo:.4f}' for (n, m), (la, lo, _) in best.items()]
(OUT / 'streets.tsv').write_text('\n'.join(rows), encoding='utf-8')
print('basemap.json ja streets.tsv:', len(rows) - 1, 'katua')
