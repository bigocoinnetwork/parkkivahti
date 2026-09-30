"""Download a complete snapshot, normalize, validate, and only then replace public data.
Usage: python scripts/update.py
No external packages. A failed download leaves the published snapshot untouched.
"""
import datetime,json,pathlib,urllib.request,urllib.parse,subprocess,sys,os,time
OVERPASS_MIRRORS=['https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter']
ROOT=pathlib.Path(__file__).resolve().parents[1]
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
run=ROOT/'work'/'updates'/stamp
raw=run/'raw';stage=run/'normalized'
raw.mkdir(parents=True);stage.mkdir()
config=json.loads((ROOT/'scripts'/'source-config.json').read_text(encoding='utf-8'))
try:
 for name,cfg in config.items():
  # Overpass-kyselyille kokeillaan varapalvelimia, jos pääpalvelin on ruuhkautunut.
  urls=[cfg['url']] if cfg.get('url') else [e+'?data='+urllib.parse.quote(cfg['query']) for e in [cfg['endpoint']]+OVERPASS_MIRRORS]
  body=None;last=None
  for attempt,url in enumerate(urls*2):
   try:
    request=urllib.request.Request(url,headers={'User-Agent':'Parkkivahti/1.0 (+https://parkkivahti.netlify.app)','Digitraffic-User':'parkkivahti','Accept':'application/json'})
    with urllib.request.urlopen(request,timeout=300) as r:body=r.read()
    d=json.loads(body)
    if d.get('remark'):raise ValueError(name+': incomplete API response: '+str(d.get('remark'))[:120])
    break
   except Exception as e:
    last=e;body=None;print(name+': attempt '+str(attempt+1)+' failed: '+str(e)[:160],flush=True);time.sleep(20)
  if body is None:raise ValueError(name+': all sources failed: '+str(last))
  if d.get('remark') or d.get('hasMore') is True:raise ValueError(name+': incomplete API response')
  if name in ('helsinki','municipalities') and d.get('numberMatched')!=len(d.get('features',[])):raise ValueError(name+': truncated WFS response')
  (raw/(name+'.json')).write_bytes(body)
  print(name+': downloaded '+str(len(body))+' bytes',flush=True)
 subprocess.run([sys.executable,str(ROOT/'scripts'/'normalize.py'),str(raw),str(stage)],check=True)
 subprocess.run([sys.executable,str(ROOT/'scripts'/'validate.py'),str(stage)],check=True)
 # All normalization and validation must succeed before replacing any public files.
 target=ROOT/'dist'/'data'
 for path in stage.glob('*.json'):
  if path.name!='manifest.json':os.replace(path,target/path.name)
 os.replace(stage/'manifest.json',target/'manifest.json')
 print('Snapshot updated. Review source changes, run npm test, then publish the site.')
except Exception as e:
 print('Update failed. Previous public snapshot preserved: '+str(e),file=sys.stderr);sys.exit(1)
