import {evaluate,formatLimit,matchesFilters,normalizeSearch,TZ} from './rules.js';
import {sourceDialog} from './sources.js';
import {setupReports} from './report.js';
import {toRecord} from './contrib.js';
export const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const sourceNames={liipi:'Fintraffic · LIIPI',helsinki:'Helsingin kaupunki',osm:'OpenStreetMap',user:'Käyttäjän ilmoitus (tarkastettu)'};
export const safeURL=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'#';}catch{return '#';}};
export const fmtDate=v=>{if(!v||!Number.isFinite(new Date(v).getTime()))return 'Ei ilmoitettu';return new Intl.DateTimeFormat('fi-FI',{timeZone:TZ,dateStyle:'medium'}).format(new Date(v));};
let data=[],cities=[],manifest,registry=[],selected=null,cityCode=null,query='',limit=80,statuses=new Map(),current=[],map,layer,outline,searchMarker,searchAbort,searchSequence=0,lastRequest=0;
const OFFLINE=!!window.PV_OFFLINE;let baseRenderer=null;let reports=null,originals=new Map(),tileCache=new Map(),tileLayers=new Map(),tileIndex=null,flash=null;let streets=null,streetsLoading=null,baseReady=false,labelLayer=null,streetLabelLayer=null,baseData=null;
function loadStreets(){if(streets)return Promise.resolve(streets);if(streetsLoading)return streetsLoading;streetsLoading=fetch('data/streets.tsv').then(r=>{if(!r.ok)throw Error('streets');return r.text();}).then(t=>{const lines=t.split('\n'),kunnat=lines[0].split('\t').slice(1);streets=lines.slice(1).filter(Boolean).map(l=>{const p=l.split('\t');return [p[0],kunnat[+p[1]],+p[2],+p[3],normalizeSearch(p[0])];});updateBaseLabels();return streets;}).catch(()=>{streetsLoading=null;return null;});return streetsLoading;}
async function streetSearch(text){
 const list=await loadStreets();if(!list)return null;
 let [a,b]=text.split(',');a=a.trim();let town=b?normalizeSearch(b):null;
 if(!town){const words=a.split(/\s+/);for(let i=words.length-1;i>0;i--){const t=normalizeSearch(words.slice(i).join(' '));if(cities.some(c=>normalizeSearch(c.name)===t||normalizeSearch(c.nameSv||'')===t)){town=t;a=words.slice(0,i).join(' ');break;}}}
 const street=normalizeSearch(a.replace(/\s+\d+\s*[a-zA-Z]?(\s*[-–]\s*\d+)?\s*$/,''));if(street.length<3)return null;
 const ok=s=>!town||normalizeSearch(s[1]).startsWith(town);
 return list.find(s=>s[4]===street&&ok(s))||list.find(s=>s[4].startsWith(street)&&ok(s))||null;
}
async function loadBasemap(){
 try{const r=await fetch('data/basemap.json');if(!r.ok)return;baseData=await r.json();}catch{return;}
 map.createPane('base');map.getPane('base').style.zIndex=150;map.createPane('baselabels');map.getPane('baselabels').style.zIndex=390;map.getPane('baselabels').style.pointerEvents='none';
 const rend=L.canvas({pane:'base',padding:.3});baseRenderer=rend;
 for(const m of baseData.munis)for(const poly of m.p)L.polygon(poly.map(r=>r.map(c=>[c[1],c[0]])),{pane:'base',renderer:rend,color:'#aebdb6',weight:.8,fillColor:'#f6f5f0',fillOpacity:1,interactive:false}).addTo(map);
 for(const [k,col,w] of [['primary','#d9c9a3',1.3],['trunk','#e0a458',1.9],['motorway','#d98c3a',2.7]])for(const l of baseData.roads[k])L.polyline(l.map(c=>[c[1],c[0]]),{pane:'base',renderer:rend,color:col,weight:w,interactive:false}).addTo(map);
 labelLayer=L.layerGroup().addTo(map);streetLabelLayer=L.layerGroup().addTo(map);baseReady=true;map.on('moveend',updateBaseLabels);updateBaseLabels();
}
function updateStreetTiles(){
 if(!baseReady||!document.body.classList.contains('offline-base'))return;const z=map.getZoom();
 if(z<12||!tileIndex){for(const l of tileLayers.values())map.removeLayer(l);tileLayers.clear();if(z>=12&&!tileIndex)fetch('data/tiles/index.json').then(r=>r.ok?r.json():null).then(j=>{if(j){tileIndex=j;tileIndex.set=new Set(j.tiles);updateStreetTiles();}}).catch(()=>{});return;}
 const b=map.getBounds(),T=tileIndex,want=new Set();
 for(let r=Math.floor((b.getSouth()-T.lat0)/T.dlat);r<=Math.floor((b.getNorth()-T.lat0)/T.dlat);r++)for(let c=Math.floor((b.getWest()-T.lon0)/T.dlon);c<=Math.floor((b.getEast()-T.lon0)/T.dlon);c++){const k=r+'_'+c;if(T.set.has(k))want.add(k);}
 for(const [k,l] of tileLayers)if(!want.has(k)){map.removeLayer(l);tileLayers.delete(k);}
 for(const k of want){if(tileLayers.has(k))continue;tileLayers.set(k,L.layerGroup());
  (tileCache.get(k)||(tileCache.set(k,fetch('data/tiles/'+k+'.json').then(r=>r.json()).then(rows=>{const g=[[],[]];for(const row of rows){let x=0,y=0;const pts=[];for(let i=1;i<row.length;i+=2){x+=row[i];y+=row[i+1];pts.push([y/T.q,x/T.q]);}g[row[0]===1?0:1].push(pts);}return g;})),tileCache.get(k))).then(g=>{const grp=tileLayers.get(k);if(!grp)return;grp.clearLayers();const rend=baseRenderer;L.polyline(g[1],{pane:'base',renderer:rend,color:'#d6d1c4',weight:map.getZoom()>=15?2.2:1.2,interactive:false}).addTo(grp);L.polyline(g[0],{pane:'base',renderer:rend,color:'#e7c27e',weight:map.getZoom()>=15?3:1.8,interactive:false}).addTo(grp);grp.addTo(map);}).catch(()=>{tileCache.delete(k);tileLayers.delete(k);});}
}
function updateBaseLabels(){
 updateStreetTiles();
 if(!baseReady||!document.body.classList.contains('offline-base'))return;labelLayer.clearLayers();streetLabelLayer.clearLayers();
 const z=map.getZoom(),b=map.getBounds().pad(.1),lab=(t,cls)=>L.divIcon({className:'',html:`<span class="base-label ${cls}">${esc(t)}</span>`,iconSize:[0,0]});
 for(const l of baseData.labels)if(((l[3]===1&&z>=6)||(l[3]===2&&z>=9))&&b.contains([l[1],l[2]]))L.marker([l[1],l[2]],{pane:'baselabels',icon:lab(l[0],l[3]===1?'city':'town'),interactive:false,keyboard:false}).addTo(labelLayer);
 if(z>=15){if(!streets){loadStreets();return;}let n=0;for(const s of streets){if(n>=150)break;if(b.contains([s[2],s[3]])){n++;L.marker([s[2],s[3]],{pane:'baselabels',icon:lab(s[0],'street'),interactive:false,keyboard:false}).addTo(streetLabelLayer);}}}
}
function nearest(lat,lon){let best=null;for(const p of data){const d=Math.hypot((p.lat-lat)*111320,(p.lon-lon)*111320*Math.cos(lat*Math.PI/180));if(!best||d<best.d)best={p,d};}return best&&best.d<3000?best:null;}
function nearestStreet(lat,lon){if(!streets)return null;let best=null,bd=1e9;for(const s of streets){const d=Math.hypot((s[2]-lat)*111320,(s[3]-lon)*55000);if(d<bd){bd=d;best=s;}}return best&&bd<300?best[0]:null;}
function flashPoint(lat,lon){if(flash)map.removeLayer(flash);flash=L.circleMarker([lat,lon],{radius:14,color:'#265dd4',weight:3,fillOpacity:.1}).addTo(map);setTimeout(()=>{if(flash){map.removeLayer(flash);flash=null;}},6000);}
function applyApproved(rows){
 for(const [id,orig] of originals){const i=data.findIndex(p=>p.id===id);if(i>=0)data[i]=orig;}originals.clear();
 data=data.filter(p=>!(p.sourceId==='user'&&p.id.startsWith('user-')));
 for(const {a} of rows){
  if(a.kind==='correction'&&a.targetId){const i=data.findIndex(p=>p.id===a.targetId);if(i<0)continue;originals.set(a.targetId,data[i]);const r=toRecord(a,data[i]);r.search=data[i].search;data[i]=r;}
  else{const near=nearest(a.lat,a.lon),r=toRecord({...a,city:a.city||near?.p.city||null,municipalityCode:a.municipalityCode||near?.p.municipalityCode||'user'});r.search=normalizeSearch([r.name,r.city,r.address].filter(Boolean).join(' '));data.push(r);}
 }
 statusClock();render();if(selected)showPlace(selected,false);
}
const labels={free:'Ilmainen nyt*',unknown:'Tarkista ehdot',closed:'Ei aktiivinen'};
function toast(s){$('#toast').textContent=s;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,6000);}
function filters(){return {active:$('#active').checked,always:$('#always').checked,limit:$('#limit').value,source:$('#source-filter').value};}
function distance(p,center){return Math.hypot((p.lat-center.lat)*111,(p.lon-center.lng)*111*Math.cos(center.lat*Math.PI/180));}
function statusClock(){const now=new Date();$('#clock').textContent=new Intl.DateTimeFormat('fi-FI',{timeZone:TZ,weekday:'short',hour:'2-digit',minute:'2-digit'}).format(now)+' · Suomen aika';statuses=new Map(data.map(p=>[p.id,evaluate(p,now)]));}
function render(){
 if(!map)return;const f=filters(),bounds=map.getBounds(),center=map.getCenter(),terms=normalizeSearch(query).split(/\s+/).filter(Boolean);
 const filtered=data.filter(p=>(!cityCode||p.municipalityCode===cityCode)&&terms.every(t=>p.search.includes(t))&&matchesFilters(p,statuses.get(p.id),f));
 current=filtered.filter(p=>bounds.contains([p.lat,p.lon])).sort((a,b)=>Number(a.sourceId==='osm')-Number(b.sourceId==='osm')||distance(a,center)-distance(b,center));
 $('#count').textContent=`${current.length.toLocaleString('fi-FI')} kohdetta`;
 $('#scope').textContent=`Kartan alueella · ${filtered.length.toLocaleString('fi-FI')} sopii rajauksiin`;
 $('#results').innerHTML=current.length?current.slice(0,limit).map(p=>{const s=statuses.get(p.id);return `<button class="place" data-id="${p.id}" aria-pressed="${p.id===selected}"><div class="place-top"><span class="badge ${s.state}">${labels[s.state]}</span><span class="source-label">${esc(sourceNames[p.sourceId])}</span></div><h3>${esc(p.name)}</h3><p>${esc([p.city,p.address&&p.address!==p.name?p.address:null].filter(Boolean).join(' · ')||'Osoite puuttuu')}</p><div class="rule-row"><span>${esc(formatLimit(p.maxStayMinutes))}${p.disc?' · kiekko':''}</span><span>${distance(p,center).toFixed(1)} km kartan keskeltä</span></div></button>`;}).join('')+(current.length>limit?'<button class="more" id="show-more">Näytä lisää kohteita</button>':''):'<div class="empty"><strong>Ei kohteita tällä rajauksella</strong>Siirrä karttaa, muuta suodattimia tai hae toista kaupunkia. Tyhjä kartta ei tarkoita, ettei alueella ole maksutonta pysäköintiä.</div>';
 $('#results').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>showPlace(b.dataset.id));
 if($('#show-more'))$('#show-more').onclick=()=>{limit+=80;render();};
 layer.clearLayers();const groups=new Map(),zoom=map.getZoom(),cell=zoom>=17?28:65;
 for(const p of current){const pt=map.project([p.lat,p.lon],zoom),key=`${Math.floor(pt.x/cell)},${Math.floor(pt.y/cell)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 for(const group of groups.values()){
  if(group.length>1&&zoom<18){const lat=group.reduce((s,p)=>s+p.lat,0)/group.length,lon=group.reduce((s,p)=>s+p.lon,0)/group.length;L.marker([lat,lon],{icon:L.divIcon({className:'cluster',html:String(group.length),iconSize:[38,38]}),title:`${group.length} kohdetta, lähennä`}).on('click',()=>map.setView([lat,lon],Math.min(18,zoom+2))).addTo(layer);}
  else for(const p of group){const s=statuses.get(p.id);L.marker([p.lat,p.lon],{icon:L.divIcon({className:`pin ${s.state}${p.id===selected?' selected':''}`,html:s.state==='unknown'?'?':'P',iconSize:[28,30]}),title:`${p.name}: ${labels[s.state]}`,keyboard:true}).on('click',()=>showPlace(p.id)).addTo(layer);}
 }
}
function showPlace(id,move=true){
 const p=data.find(x=>x.id===id);if(!p)return;selected=id;
 if(document.body.classList.contains('list-mode'))toggleMobile(false);
 if(move)map.setView([p.lat,p.lon],Math.max(map.getZoom(),16));
 const s=statuses.get(id);$('#detail').hidden=false;
 const rawDuration=p.rawRules?.kesto||p.rawRules?.maxstay||null,dest=p.entryCoordinates||[p.lon,p.lat];
 $('#detail').innerHTML=`<button class="detail-close" id="close-detail" aria-label="Sulje paikan tiedot">×</button><span class="badge ${s.state}">${labels[s.state]}</span><h2 tabindex="-1" id="place-heading">${esc(p.name)}</h2><p class="subtext">${esc([p.city,p.address].filter(Boolean).join(' · ')||'Osoite ei tiedossa')}</p><p>${esc(s.reason)}</p><div class="rule-big"><strong>${esc(formatLimit(p.maxStayMinutes))}</strong><span>${esc(p.sourceId==='helsinki'||p.sourceId==='user'?'Aikarajan voimassaolo: ':'Aukiolo: ')}${esc(p.scheduleLabel)}</span>${p.disc?'<p>Käytä pysäköintikiekkoa.</p>':''}${s.state==='free'&&p.sourceId==='helsinki'&&s.currentLimit===0?'<p>Aikarajoitus ei ole juuri nyt voimassa lähteen mukaan.</p>':''}</div>${p.maxStayMinutes===null?'<p class="caution">Aikaraja puuttuu. Maksuttomuus ei tarkoita, että auton saa jättää määräämättömäksi ajaksi.</p>':''}${p.conflict?`<p class="caution">${esc(p.conflict.message)}${p.conflict.url?` <a href="${safeURL(p.conflict.url)}" target="_blank" rel="noopener noreferrer">Uudempi lähde</a>`:''}</p>`:''}${p.userInfo?`<p class="user-note"><strong>Käyttäjän ilmoitus, tarkastettu ${esc(fmtDate(p.userInfo.reviewedAt))}.</strong> Havaittu paikalla ${esc(fmtDate(p.userInfo.observedOn))}.${p.userInfo.original?` Alkuperäinen lähdetieto (${esc(sourceNames[p.userInfo.original.sourceId])}): ${esc(formatLimit(p.userInfo.original.maxStayMinutes))}.`:''}</p>`:''}<a class="action" href="https://www.google.com/maps/dir/?api=1&destination=${dest[1]},${dest[0]}&travelmode=driving" target="_blank" rel="noopener noreferrer">Avaa reittiohje</a><div class="maplinks"><span>Avaa myös:</span><a href="https://www.google.com/maps/search/?api=1&query=${dest[1]},${dest[0]}" target="_blank" rel="noopener noreferrer">Google Maps</a><a href="https://maps.apple.com/?daddr=${dest[1]},${dest[0]}" target="_blank" rel="noopener noreferrer">Apple Kartat</a><a href="https://waze.com/ul?ll=${dest[1]},${dest[0]}&navigate=yes" target="_blank" rel="noopener noreferrer">Waze</a><a href="https://www.openstreetmap.org/?mlat=${dest[1]}&mlon=${dest[0]}#map=18/${dest[1]}/${dest[0]}" target="_blank" rel="noopener noreferrer">OpenStreetMap</a></div><button id="report-place" class="report-btn wide">Ilmoita virheestä tai puuttuvasta tiedosta</button><p class="subtext">Reittiohje avautuu Google Mapsiin. Alueen keskipiste ei aina ole sisäänajo.</p><dl><dt>Tietolähde</dt><dd>${p.sourceUrl?`<a href="${safeURL(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(sourceNames[p.sourceId])} · avaa alkuperäinen tieto</a>`:esc(sourceNames[p.sourceId])}</dd><dt>Lähde haettu / tarkistettu verkosta</dt><dd>${fmtDate(p.fetchedAt)} · ei maastotarkistus</dd><dt>Lähteen ilmoittama päivitys</dt><dd>${fmtDate(p.sourceUpdatedAt)}${p.sourceId==='osm'?' (kohteen muokkaus, ei välttämättä pysäköintiehdon tarkistus)':''}</dd>${p.sourceSurveyDate?`<dt>Lähteen tarkistusmerkintä</dt><dd>${esc(p.sourceSurveyDate)}</dd>`:''}<dt>Sijainti (WGS84)</dt><dd>${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}<br>Alueen keskipiste${p.addressAccuracy==='nearest-road'?'<br>Kadunnimi arvioitu lähimmästä kadusta.':''}</dd>${rawDuration?`<dt>Aikaraja alkuperäisessä lähteessä</dt><dd>${esc(rawDuration)}</dd>`:''}<dt>Lisätiedot ja käyttöehdot</dt><dd>${p.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</dd></dl><p class="caution">Tarkista liikennemerkit, väliaikaiset kiellot ja mahdollinen asiakkuus- tai lippuvaatimus. Ilmainen nyt ei tarkoita vapaata parkkiruutua.</p><details><summary>Alkuperäiset rajoitustiedot</summary><pre style="white-space:pre-wrap;font-size:12px;overflow-wrap:anywhere">${esc(JSON.stringify(p.rawRules,null,2))}</pre></details>`;
 $('#close-detail').onclick=closePlace;$('#report-place').onclick=()=>reports?reports.report(p.id):toast('Ilmoitukset latautuvat vielä.');if(outline)map.removeLayer(outline);if(p.geometry)outline=L.geoJSON(p.geometry,{style:{color:'#163e32',weight:3,fillOpacity:.2}}).addTo(map);
 render();if(move)$('#place-heading').focus({preventScroll:true});
}
function closePlace(){selected=null;$('#detail').hidden=true;if(outline){map.removeLayer(outline);outline=null;}render();$('#search').focus({preventScroll:true});}
function toggleMobile(force){const v=force??!document.body.classList.contains('list-mode');document.body.classList.toggle('list-mode',v);$('#mobile-toggle').textContent=v?'Näytä kartta':'Näytä lista';if(v){$('#mobile-toggle').style.position='fixed';document.body.append($('#mobile-toggle'));}else{$('.map-section').append($('#mobile-toggle'));$('#mobile-toggle').style.position='';setTimeout(()=>map.invalidateSize(),0);}}
function selectCity(c){cityCode=c.code;query='';limit=80;$('#search').value=c.name;$('#search-message').textContent=`${c.name}: ${Object.values(c.counts).reduce((a,b)=>a+b,0).toLocaleString('fi-FI')} lähdekohdetta. Kattavuus on osittainen.`;$('#map-title').textContent=c.name;map.fitBounds([[c.bounds[1],c.bounds[0]],[c.bounds[3],c.bounds[2]]],{maxZoom:12,padding:[20,20]});render();}
async function search(value){
 const seq=++searchSequence;searchAbort?.abort();const text=value.trim();if(!text){reset();return;}
 const q=normalizeSearch(text),c=cities.find(c=>normalizeSearch(c.name)===q||normalizeSearch(c.nameSv)===q);
 if(c){selectCity(c);return;}
 const terms=q.split(/\s+/),local=data.filter(p=>terms.every(t=>p.search.includes(t)));
 if(local.length){cityCode=null;query=text;limit=80;$('#map-title').textContent=text;$('#search-message').textContent=`${local.length.toLocaleString('fi-FI')} hakutulosta aineistosta`;map.fitBounds(L.latLngBounds(local.map(p=>[p.lat,p.lon])),{maxZoom:15,padding:[35,35]});render();return;}
 const hit=await streetSearch(text);if(seq!==searchSequence)return;
 if(hit){cityCode=null;query='';limit=80;map.setView([hit[2],hit[3]],16);if(searchMarker)map.removeLayer(searchMarker);searchMarker=L.circleMarker([hit[2],hit[3]],{radius:9,color:'#265dd4',fillColor:'#fff',fillOpacity:1,weight:4}).bindTooltip(esc(hit[0]+', '+hit[1])).addTo(map);$('#map-title').textContent=hit[0]+', '+hit[1];$('#search-message').textContent='Katu löytyi sovelluksen omasta katuhakemistosta (OpenStreetMap). Kartta keskitetään kadun keskikohtaan; talonumeroa ei paikanneta.';render();return;}
 if(OFFLINE){$('#search-message').textContent='Osoitetta ei löytynyt. Kokeile muotoa ”katu, kunta”, kunnan nimeä tai paikan nimeä.';return;}
 if(Date.now()-lastRequest<1100){$('#search-message').textContent='Odota hetki ennen uutta osoitehakua.';return;}
 $('#search-message').textContent='Haetaan osoitetta Suomesta…';lastRequest=Date.now();const controller=new AbortController();searchAbort=controller;const timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=fi&limit=1&q=${encodeURIComponent(text)}`;
  let found;try{found=JSON.parse(sessionStorage.getItem('geocode:'+q)||'null');}catch{}
  if(!found){const r=await fetch(url,{signal:controller.signal,headers:{'Accept':'application/json'}});if(!r.ok)throw Error('geocoder');found=await r.json();try{sessionStorage.setItem('geocode:'+q,JSON.stringify(found));}catch{}}
  if(seq!==searchSequence)return;
  if(!found.length){$('#search-message').textContent='Osoitetta ei löytynyt. Lisää kunta tai kokeile paikan nimeä. Aiempi karttarajaus säilyy.';return;}
  const a=found[0];cityCode=null;query='';limit=80;map.setView([Number(a.lat),Number(a.lon)],15);if(searchMarker)map.removeLayer(searchMarker);searchMarker=L.circleMarker([+a.lat,+a.lon],{radius:9,color:'#265dd4',fillColor:'#fff',fillOpacity:1,weight:4}).bindTooltip(esc(text)).addTo(map);$('#map-title').textContent=text;$('#search-message').textContent='Osoite löytyi. Näytetään lähialueen pysäköintikohteet. Osoitehaku: OpenStreetMap / Nominatim.';render();
 }catch(e){if(seq===searchSequence)$('#search-message').textContent='Osoitepalvelu ei vastaa. Voit hakea kuntia ja aineiston paikannimiä tai siirtää karttaa.';}finally{clearTimeout(timeout);}
}
function reset(){searchSequence++;searchAbort?.abort();cityCode=null;query='';limit=80;$('#search').value='';$('#active').checked=false;$('#always').checked=false;$('#limit').value='all';$('#source-filter').value='all';$('#search-message').textContent='';$('#map-title').textContent='Suomen pysäköintikartta';if(searchMarker){map.removeLayer(searchMarker);searchMarker=null;}render();}
async function init(){
 try{
  if(typeof L==='undefined')throw Error('Karttakirjasto ei latautunut.');
  map=L.map('map',{zoomControl:false,preferCanvas:true}).setView([60.209,24.965],13);L.control.zoom({position:'topright'}).addTo(map);
  loadBasemap();if(!OFFLINE){let tileErrors=0;L.tileLayer((window.PV_CONFIG?.tiles?.url)||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:(window.PV_CONFIG?.tiles?.attribution)||'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:(window.PV_CONFIG?.tiles?.maxZoom)||19}).on('tileerror',()=>{if(++tileErrors===4){toast('Karttatiilet eivät lataudu. Näytetään kevyt taustakartta.');document.body.classList.add('offline-base');updateBaseLabels();}}).addTo(map);}else{document.body.classList.add('offline-base');L.control.attribution({prefix:false}).addAttribution('Kuntarajat © Tilastokeskus · © OpenStreetMap-avustajat').addTo(map);}layer=L.layerGroup().addTo(map);
  const get=async f=>{const r=await fetch(`data/${f}.json`,{cache:'no-cache'});if(!r.ok)throw Error(f);return r.json();};
  [manifest,cities,registry]=await Promise.all(['manifest','cities','sources'].map(get));
  const results=await Promise.allSettled(['helsinki','liipi','osm'].map(get));
  results.forEach((r,i)=>{if(r.status==='fulfilled')data.push(...r.value);else toast(`Lähteen ${['Helsinki','Fintraffic','OpenStreetMap'][i]} lataus epäonnistui. Muut lähteet ovat käytössä.`);});
  if(!data.length)throw Error('Pysäköintitietoja ei voitu ladata.');
  data.forEach(p=>p.search=normalizeSearch([p.name,p.city,p.address].filter(Boolean).join(' ')));
  statusClock();map.on('moveend',()=>{limit=80;render();});render();
  reports=setupReports({map,esc,toast,fmtDate,formatLimit,getPlace:id=>data.find(p=>p.id===id),nearest,nearestStreet,flashPoint,applyApproved});
  const gm=document.createElement('a');gm.id='gmaps';gm.target='_blank';gm.rel='noopener noreferrer';gm.textContent='Avaa alue Google Mapsissa';$('.map-toolbar').append(gm);const upd=()=>{const c=map.getCenter();gm.href=`https://www.google.com/maps/@${c.lat.toFixed(5)},${c.lng.toFixed(5)},${Math.round(map.getZoom())}z`;};map.on('moveend',upd);upd();
  $('#search-form').onsubmit=e=>{e.preventDefault();search($('#search').value);};
  document.querySelectorAll('[data-city]').forEach(b=>b.onclick=()=>{const c=cities.find(c=>c.name===b.dataset.city);if(c){searchSequence++;searchAbort?.abort();selectCity(c);}});
  ['#active','#always','#limit','#source-filter'].forEach(s=>$(s).onchange=()=>{limit=80;render();});$('#reset').onclick=reset;$('#finland').onclick=()=>{reset();map.fitBounds([[59.6,19.4],[70.1,31.6]]);};
  const showSources=()=>sourceDialog({manifest,cities,registry});$('#sources-button').onclick=showSources;$('#coverage-link').onclick=showSources;$('#close-sources').onclick=()=>$('#sources-dialog').close();
  $('#sources-dialog').onclick=e=>{if(e.target===$('#sources-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
  $('#mobile-toggle').onclick=()=>toggleMobile();
  $('#locate').onclick=()=>{if(!navigator.geolocation){toast('Selain ei tue paikannusta. Hae osoitteella.');return;}$('#locate').disabled=true;navigator.geolocation.getCurrentPosition(pos=>{reset();map.setView([pos.coords.latitude,pos.coords.longitude],14);$('#map-title').textContent='Lähelläsi';$('#locate').disabled=false;},()=>{toast('Sijaintia ei saatu. Salli paikannus selaimessa tai hae osoitteella.');$('#locate').disabled=false;},{enableHighAccuracy:false,timeout:10000,maximumAge:120000});};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#detail').hidden)closePlace();});
  setInterval(()=>{statusClock();render();if(selected)showPlace(selected,false);},60000);
  const shared=new URLSearchParams(location.search).get('place');if(shared)showPlace(shared);
  if(document.modelContext?.registerTool){try{document.modelContext.registerTool({name:'search_parking',title:'Hae pysäköintipaikkoja',description:'Hae kaupungin tai osoitteen pysäköintikohteet ja päivitä näkyvä kartta. Tulokset ovat osittaisia lähdetietoja.',inputSchema:{type:'object',properties:{query:{type:'string',minLength:1,maxLength:200}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async input=>{if(typeof input?.query!=='string'||!input.query.trim()||input.query.length>200)throw Error('Anna hakuteksti (1–200 merkkiä).');await search(input.query);return {count:current.length,coverage:'partial',message:$('#search-message').textContent,places:current.slice(0,5).map(p=>({id:p.id,name:p.name,state:statuses.get(p.id).state}))};}});}catch{}}
 }catch(e){console.error(e);$('#count').textContent='Lataus epäonnistui';$('#results').innerHTML='<div class="empty"><strong>Tietoja ei saatu ladattua</strong>Tarkista verkkoyhteys ja lataa sivu uudelleen.<br><button id="retry">Yritä uudelleen</button></div>';$('#retry').onclick=()=>location.reload();}
}
init();
