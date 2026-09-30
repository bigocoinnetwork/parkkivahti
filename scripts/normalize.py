"""Source adapters. All times are Europe/Helsinki. Null always means unknown."""
import json, math, re, datetime, pathlib, collections, sys

ROOT=pathlib.Path(__file__).resolve().parents[1]
RAW=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'work'/'raw'
OUT=pathlib.Path(sys.argv[2]) if len(sys.argv)>2 else ROOT/'dist'/'data'
OUT.mkdir(parents=True,exist_ok=True)
def read(name): return json.loads((RAW/(name+'.json')).read_text(encoding='utf-8'))
def fetched(name): return datetime.datetime.fromtimestamp((RAW/(name+'.json')).stat().st_mtime,datetime.timezone.utc).isoformat()
def write(name,data): (OUT/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
def fi(v): return v.get('fi') or v.get('en') or v.get('sv') or '' if isinstance(v,dict) else v or ''
def points(c):
 if isinstance(c[0],(float,int)): yield c
 else:
  for v in c: yield from points(v)
def center(g):
 p=list(points(g['coordinates']));return [round((min(x[i] for x in p)+max(x[i] for x in p))/2,7) for i in (0,1)]
def bbox(g):
 p=list(points(g['coordinates']));return [min(x[0] for x in p),min(x[1] for x in p),max(x[0] for x in p),max(x[1] for x in p)]
def inring(x,y,p):
 inside=False;j=len(p)-1
 for i in range(len(p)):
  xi,yi=p[i][:2];xj,yj=p[j][:2]
  if (yi>y)!=(yj>y) and x<(xj-xi)*(y-yi)/(yj-yi)+xi:inside=not inside
  j=i
 return inside
mun=[]
for f in read('municipalities')['features']:
 g=f['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
 mun.append((bbox(g),polys,f['properties']))
def city(lon,lat):
 for b,polys,p in mun:
  if b[0]<=lon<=b[2] and b[1]<=lat<=b[3]:
   for rings in polys:
    if inring(lon,lat,rings[0]) and not any(inring(lon,lat,r) for r in rings[1:]):return p['nimi'],p['kunta']
 return None,None
def minutes(s):
 if not s:return None
 s=str(s).strip().lower()
 if s in ('none','no','unlimited','ei aikarajoitusta'):return 0
 m=re.fullmatch(r'(\d+(?:\.\d+)?)\s*(min|minutes?|h|hours?|days?)?',s)
 if not m:return None
 return int(float(m[1])* (60 if m[2] in ('h','hour','hours') else 1440 if m[2] in ('day','days') else 1))
def hel_schedule(s):
 s=(s or '').strip()
 # Only accept an unambiguous weekday / Saturday / Sunday sequence.
 m=re.fullmatch(r'(\d{1,2})\s*-\s*(\d{1,2})(?:\s*,?\s*\((\d{1,2})-(\d{1,2})\))?(?:\s*,\s*(\d{1,2})-(\d{1,2}))?',s)
 if not m:return None
 out=[]
 for i,days in [(1,[1,2,3,4,5]),(3,[6]),(5,[0])]:
  if m[i] is not None:
   a,b=int(m[i]),int(m[i+1])
   if not (0<=a<24 and 0<b<=24 and a!=b):return None
   out.append(dict(days=days,start=a*60,end=b*60))
 return out
def schedule_text(s):
 if s is None:return 'Voimassaolo puuttuu tai vaatii tarkistuksen'
 return ' · '.join(('ma–pe' if x['days']==[1,2,3,4,5] else 'la' if x['days']==[6] else 'su / pyhät' if x['days']==[0] else 'joka päivä')+' '+f"{x['start']//60:02d}:{x['start']%60:02d}–{x['end']//60:02d}:{x['end']%60:02d}" for x in s)
def liipi_schedule(d):
 if not d:return None
 out=[]
 for day,v in d.items():
  days={'BUSINESS_DAY':[1,2,3,4,5],'SATURDAY':[6],'SUNDAY':[0]}.get(day)
  if not days:return None
  def t(s):
   p=s.split(':');return int(p[0])*60+(int(p[1]) if len(p)>1 else 0)
  try:a,b=t(v['from']),t(v['until'])
  except (ValueError,KeyError,TypeError):return None
  if not(0<=a<1440 and 0<=b<=1440) or a==b:return None
  out.append(dict(days=days,start=a,end=b))
 return out
def common(id,source,lon,lat,name):
 c,code=city(lon,lat)
 return dict(id=id,sourceId=source,name=name,address=None,addressAccuracy='unknown',city=c,municipalityCode=code,lat=lat,lon=lon,coordinateAccuracy='area-center',fetchedAt=fetched(source),sourceUpdatedAt=None,verifiedOnSiteAt=None,fee='free',access='public',status='unknown',openingSchedule=None,limitSchedule=None,maxStayMinutes=None,disc=None,notes=[],unresolved=False,rawRules={})

def liipi():
 src=read('liipi');assert not src.get('hasMore'),'Incomplete LIIPI response'
 result=[];excluded=collections.Counter()
 for f in src['results']:
  meth=f.get('pricingMethod')
  if f.get('type')!='CAR':excluded['not_car']+=1;continue
  if f.get('deletedAt') or f.get('softDeletedAt'):excluded['deleted']+=1;continue
  if meth not in ('PARK_AND_RIDE_247_FREE','FREE_12H','FREE_10H'):excluded['price_not_verified_free']+=1;continue
  lon,lat=center(f['location']);p=common('liipi-'+str(f['id']),'liipi',lon,lat,fi(f['name']))
  p.update(sourceUrl=f"https://parking.fintraffic.fi/api/v1/facilities/{f['id']}.json",sourceUpdatedAt=f.get('modifiedAt'),status={'IN_OPERATION':'active','TEMPORARILY_CLOSED':'closed','INACTIVE':'closed','EXCEPTIONAL_SITUATION':'exceptional'}.get(f['status'],'unknown'),maxStayMinutes={'FREE_12H':720,'FREE_10H':600}.get(meth),openingSchedule=liipi_schedule(f.get('openingHours',{}).get('liipyByDayType') or f.get('openingHours',{}).get('byDayType')),kind='Liityntäpysäköinti')
  p['notes'].append('Liityntäpysäköinti: jatka matkaa joukkoliikenteellä. Tarkista mahdollinen lippu- ja kiekkovaatimus.')
  p['rawRules']={'pricingMethod':meth,'openingHours':f.get('openingHours'),'pricing':[v for v in f.get('pricing',[]) if v.get('capacityType')=='CAR'],'authenticationMethods':f.get('authenticationMethods',[]),'paymentInfo':f.get('paymentInfo')}
  for port in f.get('ports',[]):
   if port.get('entry') and not port.get('pedestrian'):
    a=port.get('address') or {};p['address']=fi(a.get('streetAddress')) or None
    if p['address']:p['addressAccuracy']='source'
    if port.get('location',{}).get('type')=='Point':p['entryCoordinates']=port['location']['coordinates']
    break
  if f.get('authenticationMethods'):p['access']='ticket';p['unresolved']=True;p['notes'].append('Edellyttää tunnistautumista / matkalippua: '+', '.join(f['authenticationMethods']))
  detail=fi((f.get('paymentInfo') or {}).get('detail'))
  if detail:
   p['notes'].append(detail)
   m=re.fullmatch(r'(?:Pysäköintikiekko max |)(\d+) h(?: aikarajoitus| rajoitus|\.)?',detail)
   if m:
    v=int(m[1])*60
    if p['maxStayMinutes'] is not None and p['maxStayMinutes']!=v:p['unresolved']=True
    p['maxStayMinutes']=v
    if 'kiekko' in detail:p['disc']=True
   else:p['unresolved']=True
  for v in [fi(f.get('statusDescription')),fi(f.get('openingHours',{}).get('info'))]:
   if v:p['notes'].append(v);p['unresolved']=True
  p['scheduleLabel']=schedule_text(p['openingSchedule']);p['limitAlways']=True;p['feeAlways']=True
  result.append(p)
 return result,dict(excluded),len(src['results'])

# Nearby road name is a search aid, never a verified street address.
roadgrid=collections.defaultdict(list)
if (RAW/'roads.json').exists():
 for r in read('roads').get('elements',[]):
  if r.get('tags',{}).get('highway') in ('footway','path','cycleway','steps','pedestrian'):continue
  g=r.get('geometry',[])
  for a,b in zip(g,g[1:]):
   v=(a['lon'],a['lat'],b['lon'],b['lat'],r['tags']['name'])
   for xx in range(int(min(v[0],v[2])*1000)-1,int(max(v[0],v[2])*1000)+2):
    for yy in range(int(min(v[1],v[3])*1000)-1,int(max(v[1],v[3])*1000)+2):roadgrid[xx,yy].append(v)
def road(x,y):
 best=(200,None)
 for a,b,c,d,name in roadgrid.get((int(x*1000),int(y*1000)),[]):
  ax=(a-x)*55000;ay=(b-y)*111000;bx=(c-x)*55000;by=(d-y)*111000;dx=bx-ax;dy=by-ay
  t=max(0,min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy))) if dx*dx+dy*dy else 0
  dist=math.hypot(ax+t*dx,ay+t*dy)
  if dist<best[0]:best=dist,name
 return best[1]
def helsinki():
 src=read('helsinki');assert len(src['features'])==src['numberMatched'],'Incomplete Helsinki WFS'
 out=[];excluded=collections.Counter()
 for f in src['features']:
  a=f['properties']
  if a.get('luokka') not in (1,2,8):excluded['not_explicitly_free']+=1;continue
  if a.get('tyyppi') not in ('',None,'0'):excluded['special_use']+=1;continue
  lon,lat=center(f['geometry']);near=road(lon,lat);p=common('hel-'+str(a['id']),'helsinki',lon,lat,near or 'Pysäköintialue '+str(a['id']))
  p.update(city='Helsinki',municipalityCode='091',address=(near+' (läheinen katu)') if near else None,addressAccuracy='nearest-road' if near else 'unknown',sourceUrl='https://kartta.hel.fi/ws/geoserver/avoindata/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=avoindata:Pysakointipaikat_alue&outputFormat=application/json&srsName=EPSG:4326&featureID='+f['id'],sourceUpdatedAt=a.get('paivitetty_tietopalveluun'),status='active',kind='Kadunvarsi / pysäköintialue',maxStayMinutes=minutes(a.get('kesto')),disc=True if a['luokka']==8 else None,limitSchedule=hel_schedule(a.get('voimassaolo')),feeAlways=True,limitAlways=False,rawRules=a)
  p['scheduleLabel']=schedule_text(p['limitSchedule'])
  p['notes'].append(a['luokka_nimi'])
  if p['address']:p['notes'].append('Kadunnimi on sijainnista arvioitu hakutieto. Karttapiste näyttää alueen keskipisteen; se ei ole sisäänajon osoite.')
  if p['limitSchedule'] is None:p['unresolved']=True
  if a.get('kausi'):p['notes'].append('Kausi: '+a['kausi']);p['unresolved']=True
  info=a.get('lisatieto') or ''
  if info and not re.fullmatch(r'[\d\s,-]+',info):p['notes'].append(info);p['unresolved']=True
  p['geometry']=f['geometry'];out.append(p)
 return out,dict(excluded),len(src['features'])

def osm():
 if not (RAW/'osm.json').exists():return [],{'unavailable':1},0
 src=read('osm');assert not src.get('remark'),'Overpass partial/error response'
 out=[];excluded=collections.Counter()
 for f in src['elements']:
  t=f.get('tags',{});g=f.get('center',f);lat,lon=g.get('lat'),g.get('lon')
  if lat is None:excluded['no_coordinates']+=1;continue
  c,code=city(lon,lat)
  if not c:excluded['outside_municipal_polygons']+=1;continue
  if t.get('access') in ('private','no','permit','residents') or t.get('motor_vehicle') in ('no','private') or t.get('motorcar') in ('no','private') or t.get('parking') in ('motorcycle','bicycle'):excluded['restricted']+=1;continue
  if any(t.get(k)=='yes' for k in ('disused','abandoned','construction')):excluded['inactive']+=1;continue
  p=common('osm-'+f['type']+'-'+str(f['id']),'osm',lon,lat,t.get('name:fi') or t.get('name') or t.get('ref') or 'Pysäköintialue')
  addr=' '.join(filter(None,[t.get('addr:street'),t.get('addr:housenumber')]))
  p.update(address=addr or None,addressAccuracy='source' if addr else 'unknown',sourceUrl=f"https://www.openstreetmap.org/{f['type']}/{f['id']}",sourceUpdatedAt=f.get('timestamp'),sourceSurveyDate=t.get('check_date:fee') or t.get('check_date') or t.get('survey:date'),status='unknown',access='public' if t.get('access') in ('yes','permissive') else 'customers' if t.get('access')=='customers' else 'unknown',maxStayMinutes=minutes(t.get('maxstay')),openingRaw=t.get('opening_hours'),limitAlways=True,feeAlways=not bool(t.get('fee:conditional')),disc=True if t.get('authentication:disc')=='yes' else None,kind='Pysäköintialue',rawRules=t)
  p['scheduleLabel']=t.get('opening_hours') or 'Aukioloaika puuttuu'
  p['notes'].append('Yhteisön ylläpitämä maksuttomuusmerkintä. Noutoaika ei tarkoita maastossa tarkistamista.')
  if p['access']=='customers':p['notes'].append('Vain asiakkaille.')
  for k in ('description:fi','description','note:fi','note'):
   if t.get(k):p['notes'].append(t[k])
  # Conditional restrictions are preserved but never guessed.
  if any('conditional' in k for k in t) or any(t.get(k) for k in ('seasonal','access:description','fee:description','restriction','parking:condition')):p['unresolved']=True
  if t.get('maxstay:conditional'):p['notes'].append('Ehdollinen aikaraja: '+t['maxstay:conditional'])
  if t.get('fee:conditional'):p['notes'].append('Ehdollinen maksu: '+t['fee:conditional'])
  for k in ('motorcar','motor_vehicle','vehicle'):
   if t.get(k) not in (None,'yes','permissive'):p['unresolved']=True
  p['rawRules']={k:v for k,v in t.items() if k not in ('source:geometry',)}
  if t.get('charge') not in (None,'0','0.00','0 EUR','0 EUR/hour'):
   p['unresolved']=True;p['notes'].append('Maksutiedoissa ristiriita: fee=no, mutta charge='+t['charge'])
  out.append(p)
 return out,dict(excluded),len(src['elements'])

if __name__=='__main__':
 report={};allplaces=[]
 overrides=json.loads((ROOT/'scripts'/'overrides.json').read_text(encoding='utf-8'))
 for name,adapter in [('liipi',liipi),('helsinki',helsinki),('osm',osm)]:
  records,excluded,total=adapter()
  for p in records:
   if p['id'] in overrides:p['conflict']=overrides[p['id']]
  write(name,records);allplaces+=records
  report[name]={'fetchedAt':fetched(name) if (RAW/(name+'.json')).exists() else None,'records':len(records),'inputRecords':total,'excluded':excluded,'status':'available' if records else 'unavailable'}
 cities=[]
 for b,polys,p in mun:
  cities.append(dict(name=p['nimi'],nameSv=p['namn'],code=p['kunta'],bounds=b,counts={s:sum(1 for x in allplaces if x['municipalityCode']==p['kunta'] and x['sourceId']==s) for s in report}))
 write('cities',cities)
 write('manifest',dict(schemaVersion=1,generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),sources=report,totalRecords=len(allplaces),coveredMunicipalities=sum(1 for c in cities if sum(c['counts'].values())),totalMunicipalities=len(cities),coverage='partial',note='Kohteet ovat alueita ja katuosuuksia, eivät yksittäisiä autopaikkoja. Lähteiden välillä voi olla päällekkäisyyksiä.'))
 print(json.dumps(report,ensure_ascii=True));print('Records:',len(allplaces))
