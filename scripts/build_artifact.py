"""Rakentaa itsenäisen julkaisuversion (build/artifact), joka ei käytä ulkoisia karttatiiliä eikä osoitepalvelua.
Käyttö: python scripts/build_artifact.py
Tuottaa build/artifact/index.html (runko ilman <html>/<head>, julkaisualusta lisää sen) ja data/-kansion."""
import pathlib, re, shutil
ROOT = pathlib.Path(__file__).resolve().parents[1]
D = ROOT / 'dist'; OUT = ROOT / 'build' / 'artifact'
shutil.rmtree(OUT, ignore_errors=True); (OUT / 'data').mkdir(parents=True)
def mod(name):
    s = (D / name).read_text(encoding='utf-8')
    s = re.sub(r'^import .*?;\s*$', '', s, flags=re.M)
    return re.sub(r'^export ', '', s, flags=re.M)
html = (D / 'index.html').read_text(encoding='utf-8')
body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
css = (D / 'vendor' / 'leaflet.css').read_text(encoding='utf-8') + '\n' + (D / 'style.css').read_text(encoding='utf-8')
css += '\n:root{color-scheme:light}body{background:#fff;color:#18332f}\n'
page = ('<title>Parkkivahti</title>\n<meta name="description" content="Löydä Suomen maksuttomaksi merkityt pysäköintipaikat, aikarajat ja tietojen lähteet.">\n'
        f'<style>\n{css}\n</style>\n{body}\n'
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>\n'
        '<script>window.PV_OFFLINE=true;window.PV_BACKEND="claude";</script>\n'
        '<script type="module">\n' + mod('rules.js') + '\n' + mod('contrib.js') + '\n' + mod('camera.js') + '\n' + mod('report.js') + '\n' + mod('sources.js').replace('.json" download>Lataa lähdeaineiston muunnos', '.json" target="_blank" rel="noopener">Avaa lähdeaineiston muunnos') + '\n' + mod('app.js') + '\n</script>\n')
(OUT / 'index.html').write_text(page, encoding='utf-8')
shutil.rmtree(OUT / 'data'); shutil.copytree(D / 'data', OUT / 'data')
print('build/artifact valmis:', len(page), 'tavua sivu,', sum(1 for _ in (OUT / 'data').rglob('*.*')), 'datatiedostoa')
