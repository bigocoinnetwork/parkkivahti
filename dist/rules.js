export const TZ='Europe/Helsinki';
let cachedMinute=null,cachedTime=null;
export function helsinkiTime(date=new Date()){
 const minuteKey=Math.floor(date.getTime()/60000);if(minuteKey===cachedMinute)return cachedTime;
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
 const y=+p.year,m=+p.month,d=+p.day,weekday=new Date(Date.UTC(y,m-1,d)).getUTCDay();
 cachedMinute=minuteKey;cachedTime={year:y,month:m,day:d,weekday,minute:+p.hour*60+(+p.minute),iso:`${p.year}-${p.month}-${p.day}`,holiday:isHoliday(y,m,d)};return cachedTime;
}
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;return new Date(Date.UTC(y,Math.floor(n/31)-1,n%31+1));}
export function isHoliday(y,m,d){
 if(['1-1','1-6','5-1','12-6','12-25','12-26'].includes(`${m}-${d}`))return true;
 const date=new Date(Date.UTC(y,m-1,d)),day=date.getUTCDay(),delta=(date-easter(y))/86400000;
 return [-2,0,1,39,49].includes(delta)||(m===6&&d>=20&&d<=26&&day===6)||(((m===10&&d===31)||(m===11&&d<=6))&&day===6);
}
export function inSchedule(schedule,time){
 if(!Array.isArray(schedule))return null;
 const dow=time.holiday?0:time.weekday;
 const prev=new Date(Date.UTC(time.year,time.month-1,time.day-1));
 const prevDow=isHoliday(prev.getUTCFullYear(),prev.getUTCMonth()+1,prev.getUTCDate())?0:prev.getUTCDay();
 return schedule.some(r=>r.start<r.end?r.days.includes(dow)&&time.minute>=r.start&&time.minute<r.end:(r.days.includes(dow)&&time.minute>=r.start)||(r.days.includes(prevDow)&&time.minute<r.end));
}
export function parseOpening(raw){
 if(!raw)return null;if(raw==='24/7')return [{days:[0,1,2,3,4,5,6],start:0,end:1440}];
 const names=['Su','Mo','Tu','We','Th','Fr','Sa'];const out=[];
 for(const piece of raw.split(';')){
  const m=piece.trim().match(/^(?:(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\s+)?(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if(!m)return null;
  let days=[0,1,2,3,4,5,6];if(m[1]){days=[names.indexOf(m[1])];if(m[2]){while(days.at(-1)!==names.indexOf(m[2])&&days.length<7)days.push((days.at(-1)+1)%7);}}
  const start=+m[3]*60+(+m[4]),end=+m[5]*60+(+m[6]);if(+m[4]>59||+m[6]>59||start>=1440||end>1440||start===end)return null;
  out.push({days,start,end});
 }return out;
}
export function formatLimit(n){return n===null||n===undefined?'Aikaraja puuttuu':n===0?'Ei ilmoitettua aikarajaa':n%60===0?`${n/60} h`:`${n} min`;}
export function evaluate(p,date=new Date()){
 const time=helsinkiTime(date),age=(date-new Date(p.fetchedAt))/86400000;
 const result=(state,reason,currentLimit=p.maxStayMinutes)=>({state,reason,currentLimit,alwaysFree:false});
 if(p.fee!=='free')return result('unknown','Maksuttomuutta ei ole vahvistettu lähteessä.');
 if(!Number.isFinite(age)||age<0)return result('unknown','Noutoajankohta on epäselvä.');
 if(p.conflict)return result('unknown','Lähteissä ristiriita: maksullisuus on muuttunut.');
 if(age>(p.sourceId==='user'?365:30))return result('unknown',p.sourceId==='user'?'Käyttäjän ilmoitus on yli vuoden vanha. Tarkista liikennemerkit.':'Aineiston noudosta on yli 30 päivää. Tarkista alkuperäinen lähde.');
 if(p.status==='closed')return result('closed','Lähteen mukaan pois käytöstä.');
 if(p.status==='exceptional')return result('unknown','Lähde ilmoittaa poikkeustilanteesta.');
 if(p.access!=='public')return result('unknown',p.access==='customers'?'Vain asiakkaille. Tarkista käyttöehdot.':p.access==='ticket'?'Edellyttää lippua tai tunnistautumista.':'Yleinen käyttöoikeus ei ole tiedossa.');
 if(p.unresolved)return result('unknown','Kaikkia ehtoja ei voida tulkita varmasti.');
 if(p.sourceId==='osm'){
  const last=p.sourceSurveyDate||p.sourceUpdatedAt;
  const lastAge=date-new Date(last);
  if(!last||!Number.isFinite(lastAge)||lastAge<0||lastAge>365*86400000)return result('unknown','Karttatieto on yli vuoden vanha tai tarkistusajankohta puuttuu.');
  if((p.notes||[]).length>1)return result('unknown','Lähteessä on lisäehtoja. Tarkista paikan tiedot.');
 }
 const schedule=p.openingSchedule||(p.sourceId==='osm'?parseOpening(p.openingRaw):null);
 if(p.sourceId!=='helsinki'&&p.sourceId!=='user'){
  if(p.sourceId==='osm'&&time.holiday&&p.openingRaw!=='24/7')return result('unknown','Pyhäpäivän aukioloa ei ole vahvistettu.');
  const open=inSchedule(schedule,time);if(open===null)return result('unknown','Aukioloaika puuttuu tai sen tulkinta on epävarma.');if(!open)return result('closed','Ei avoinna lähteen aukioloaikojen mukaan.');
 }
 let current=p.maxStayMinutes;
 if(p.sourceId==='helsinki'||p.sourceId==='user'){
  if(current===null||p.limitSchedule===null)return result('unknown','Aikaraja tai sen voimassaoloaika puuttuu.');
  if(!inSchedule(p.limitSchedule,time))current=0;
 }
 const r=result('free','Maksuton lähteen sääntöjen perusteella. Tarkista liikennemerkit.',current);
 r.alwaysFree=p.feeAlways===true&&!!schedule&&[0,1,2,3,4,5,6].every(d=>schedule.some(r=>r.days.includes(d)&&r.start===0&&r.end===1440));
 return r;
}
export function matchesFilters(p,s,f){
 if(f.active&&s.state!=='free')return false;
 if(f.always&&!s.alwaysFree)return false;
 if(f.source==='official'&&p.sourceId==='osm'||f.source==='osm'&&p.sourceId!=='osm')return false;
 const n=p.maxStayMinutes;
 if(f.limit==='unknown'&&n!==null)return false;
 if(f.limit==='unlimited'&&n!==0)return false;
 if(f.limit==='long'&&!(n>240))return false;
 if(['30','120','240'].includes(f.limit)&&!(n>0&&n<=Number(f.limit)))return false;
 return true;
}
export function normalizeSearch(s){return s.toLocaleLowerCase('fi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
