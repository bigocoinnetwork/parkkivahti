import pathlib,json,sys
root=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path(__file__).resolve().parents[1]/'dist'/'data'
m=json.loads((root/'manifest.json').read_text(encoding='utf-8'));ids=set();n=0
for source in ('helsinki','liipi','osm'):
 rows=json.loads((root/(source+'.json')).read_text(encoding='utf-8'))
 assert rows,'Missing required source: '+source
 assert len(rows)==m['sources'][source]['records']
 for p in rows:
  assert p['id'] not in ids;ids.add(p['id'])
  assert 59.5<=p['lat']<=70.2 and 19<=p['lon']<=31.7
  assert p['sourceId']==source and p['sourceUrl'].startswith('https://')
  assert p['fetchedAt'] and p['name'] and p['municipalityCode']
  assert p['maxStayMinutes'] is None or isinstance(p['maxStayMinutes'],int) and p['maxStayMinutes']>=0
  assert p['verifiedOnSiteAt'] is None
  for field in ('openingSchedule','limitSchedule'):
   for r in p[field] or []:
    assert 0<=r['start']<1440 and 0<=r['end']<=1440
    assert r['days'] and all(0<=d<=6 for d in r['days'])
 n+=len(rows)
assert n==m['totalRecords']
c=json.loads((root/'cities.json').read_text(encoding='utf-8'))
assert sum(sum(x['counts'].values()) for x in c)==n
print('Validated',n,'source records and',len(c),'municipalities.')
