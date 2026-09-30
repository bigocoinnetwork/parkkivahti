// Käyttäjien ilmoitukset (korjaus / puuttuva paikka) ja tarkastusjono.
// Taustapalvelu valitaan ajossa:
//   - Claude-julkaisu: artifact-tietokanta (claude.use("db")), tarkastajana omistaja ja muokkaajat.
//   - Oma palvelin: Supabase (window.PV_CONFIG.supabase), tarkastus Supabasen hallintanäkymässä.
//   - Muuten ilmoituslomake kertoo, ettei ilmoittaminen ole käytössä.
// Mikään ilmoitus ei näy kartalla ennen kuin tarkastaja on hyväksynyt sen.

const DAY_LIMIT = 10;              // ilmoituksia / käyttäjä / vrk
const MIN_FILL_MS = 4000;          // lomakkeen täyttö nopeammin = todennäköisesti botti
const FI = { lat: [59.5, 70.2], lon: [19, 31.7] };

export function scheduleFromForm(rows) {
  const out = [];
  for (const [days, from, to] of rows) {
    if (from === '' && to === '') continue;
    const s = toMin(from), e = toMin(to);
    if (s === null || e === null || s === e) throw Error('Tarkista kellonajat (esim. 8 tai 8.30).');
    out.push({ days, start: s, end: e === 0 ? 1440 : e });
  }
  return out;
}
function toMin(v) {
  const m = String(v).trim().replace(':', '.').match(/^(\d{1,2})(?:\.(\d{2}))?$/);
  if (!m) return null; const h = +m[1], mi = +(m[2] || 0);
  if (h > 24 || mi > 59 || (h === 24 && mi)) return null; return h * 60 + mi;
}

/** Tarkistaa ilmoituksen kentät. Palauttaa puhdistetun olion tai heittää virheen suomeksi. */
export function validateSubmission(s) {
  const txt = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const o = {
    kind: s.kind === 'correction' ? 'correction' : 'new',
    targetId: s.kind === 'correction' ? txt(s.targetId, 80) : null,
    name: txt(s.name, 120), address: txt(s.address, 160),
    lat: +s.lat, lon: +s.lon,
    fee: ['free', 'paid', 'gone'].includes(s.fee) ? s.fee : null,
    maxStayMinutes: s.maxStayMinutes === '' || s.maxStayMinutes === null || s.maxStayMinutes === undefined ? null : Math.round(+s.maxStayMinutes),
    limitSchedule: Array.isArray(s.limitSchedule) ? s.limitSchedule.slice(0, 6) : [],
    disc: !!s.disc, customersOnly: !!s.customersOnly,
    note: txt(s.note, 500), observedOn: txt(s.observedOn, 10)
  };
  if (!o.fee) throw Error('Valitse, onko paikka ilmainen.');
  if (!(o.lat >= FI.lat[0] && o.lat <= FI.lat[1] && o.lon >= FI.lon[0] && o.lon <= FI.lon[1])) throw Error('Sijainti ei ole Suomessa. Valitse paikka kartalta.');
  if (o.kind === 'new' && o.name.length < 3 && o.address.length < 3) throw Error('Anna paikalle nimi tai osoite.');
  if (o.kind === 'correction' && !o.targetId) throw Error('Korjattava paikka puuttuu.');
  if (o.maxStayMinutes !== null && !(o.maxStayMinutes >= 0 && o.maxStayMinutes <= 10080)) throw Error('Aikaraja on virheellinen.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.observedOn)) throw Error('Anna havaintopäivä.');
  const age = (Date.now() - new Date(o.observedOn + 'T12:00:00Z')) / 864e5;
  if (age < -1 || age > 400) throw Error('Havaintopäivän pitää olla viimeisen vuoden ajalta.');
  if (/(https?:\/\/|www\.)/i.test(o.note + o.name + o.address)) throw Error('Linkkejä ei voi lisätä ilmoitukseen.');
  for (const r of o.limitSchedule) if (!Array.isArray(r.days) || !(r.start >= 0 && r.start < 1440 && r.end > 0 && r.end <= 1440)) throw Error('Aikarajan voimassaoloaika on virheellinen.');
  return o;
}

/** Hyväksytty ilmoitus sovelluksen kohdemuotoon (ks. parking.schema.json). */
export function toRecord(a, target) {
  const base = target ? { ...target } : {
    id: 'user-' + a.id, name: a.name || a.address || 'Käyttäjän ilmoittama paikka', address: a.address || null,
    addressAccuracy: 'user', city: a.city || null, municipalityCode: a.municipalityCode || 'user', lat: a.lat, lon: a.lon,
    coordinateAccuracy: 'user-pin', rawRules: {}, notes: [], sourceUrl: '', verifiedOnSiteAt: null
  };
  const limitSchedule = a.maxStayMinutes === null ? null : a.maxStayMinutes === 0 ? [] :
    (a.limitSchedule && a.limitSchedule.length ? a.limitSchedule : [{ days: [0, 1, 2, 3, 4, 5, 6], start: 0, end: 1440 }]);
  const rec = {
    ...base, sourceId: 'user', fee: a.fee === 'free' ? 'free' : 'paid', access: a.customersOnly ? 'customers' : 'public',
    status: 'active', openingSchedule: null, limitSchedule, maxStayMinutes: a.maxStayMinutes, disc: a.disc,
    fetchedAt: a.reviewedAt, sourceUpdatedAt: a.observedOn, sourceSurveyDate: a.observedOn, unresolved: false, conflict: null,
    notes: [a.note ? 'Ilmoittajan lisätieto: ' + a.note : 'Käyttäjän ilmoitus, tarkastettu ylläpidossa.'],
    scheduleLabel: a.maxStayMinutes === null ? 'ei tiedossa' : a.maxStayMinutes === 0 ? 'ei aikarajaa' : limitText(a).replace(/^[^(]*\(?/, '').replace(/\)$/, ''),
    userInfo: { reviewedAt: a.reviewedAt, observedOn: a.observedOn, kind: a.kind, fee: a.fee, original: target || null }
  };
  if (a.fee !== 'free') rec.conflict = { message: a.fee === 'gone' ? 'Käyttäjän tarkastetun ilmoituksen mukaan paikkaa ei enää ole tai pysäköinti on kielletty.' : 'Käyttäjän tarkastetun ilmoituksen mukaan paikka on maksullinen.', url: '' };
  if (target) rec.sourceUrl = target.sourceUrl;
  return rec;
}

// ---------- taustapalvelut ----------
async function claudeBackend() {
  if (!window.claude || typeof window.claude.use !== 'function') return null;
  const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
  if (!db) return null;
  const uid = user ? await user.id() : null;
  const moderator = user ? await user.canEdit() : false;
  const approvedCol = db.collection('approved');
  return {
    kind: 'claude', moderator, canSubmit: false, needsPhoto: true,
    whyNot: 'Ilmoitukseen tarvitaan kameralla otettu kuva, eikä tämä Claude-julkaisu saa käyttää kameraa. Tee ilmoitus Parkkivahdin julkisessa versiossa.',
    async submit(o) {
      try { return await this._submit(o); } catch (e) { if (e && (e.code === 'invalid_argument' || e.code === 'not_granted')) throw Error('Sinulla ei ole oikeutta lähettää ilmoituksia tässä julkaisussa. Pyydä ylläpitäjältä osallistujaoikeus (Contributor).'); if (e && e.code === 'quota_exceeded') throw Error('Ilmoitusten tallennustila on täynnä. Yritä myöhemmin uudelleen.'); throw e instanceof Error ? e : Error('Lähetys epäonnistui. Yritä uudelleen.'); }
    },
    async _submit(o) {
      const marker = db.doc('inbox/' + uid), m = await marker.get(), today = new Date().toISOString().slice(0, 10);
      const md = m.exists ? m.data() : {}; const n = md.day === today ? md.n || 0 : 0;
      if (n >= DAY_LIMIT) throw Error('Olet lähettänyt tänään jo ' + DAY_LIMIT + ' ilmoitusta. Yritä huomenna uudelleen.');
      const ref = db.collection('inbox/' + uid + '/subs').doc();
      await ref.set({ ...o, status: 'pending', createdAt: new Date().toISOString(), by: uid });
      await marker.set({ day: today, n: n + 1, last: new Date().toISOString(), pending: true });
      return ref.id;
    },
    async mine() {
      if (!uid) return [];
      const s = await db.collection('inbox/' + uid + '/subs').orderBy('createdAt', 'desc').limit(50).get();
      return s.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    onApproved(cb) { return approvedCol.limit(1000).onSnapshot(s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => cb([])); },
    async pending() {
      const users = await db.collection('inbox').limit(500).get(), out = [];
      for (const u of users.docs) {
        const s = await db.collection('inbox/' + u.id + '/subs').where('status', '==', 'pending').limit(100).get();
        s.docs.forEach(d => out.push({ id: d.id, uid: u.id, ...d.data() }));
      }
      return out.sort((a, b) => a.createdAt < b.createdAt ? -1 : 1);
    },
    async decide(item, status, reason, extra) {
      const ref = db.doc('inbox/' + item.uid + '/subs/' + item.id), now = new Date().toISOString();
      if (status === 'approved') {
        const { uid: _u, status: _s, by: _b, ...clean } = item;
        await db.doc('approved/' + item.id).set({ ...clean, ...extra, reviewedAt: now });
      }
      await ref.update({ status, reviewedAt: now, reason: reason || '' });
    },
    async withdraw(id) { await db.doc('approved/' + id).delete(); }
  };
}

function loadScript(src) {
  return new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = () => rej(Error('Kirjasto ei latautunut: ' + src)); document.head.append(el); });
}
export const PHOTO_MAX_DIST_M = 300;   // kuvaajan etäisyys ilmoitetusta paikasta (palvelin sallii 500 m)
const BUCKET = 'report-photos';

async function supabaseBackend(cfg) {
  if (!cfg || !cfg.url || !cfg.anonKey) return null;
  if (!window.supabase || !window.supabase.createClient) await loadScript('vendor/supabase.js');
  const sb = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, storageKey: 'pv-mod-auth' } });
  let device = null; try { device = localStorage.getItem('pv-client'); if (!device) { device = crypto.randomUUID(); localStorage.setItem('pv-client', device); } } catch { device = null; }
  const toRow = (o, photo, path) => ({ kind: o.kind, target_id: o.targetId, name: o.name, address: o.address, lat: o.lat, lon: o.lon, fee: o.fee, max_stay_minutes: o.maxStayMinutes, limit_schedule: o.limitSchedule, disc: o.disc, customers_only: o.customersOnly, note: o.note, observed_on: o.observedOn, client_hash: device,
    photo_path: path, photo_taken_at: photo.takenAt, photo_lat: photo.lat, photo_lon: photo.lon, photo_accuracy: Math.round(photo.accuracy) });
  const fromRow = r => ({ id: r.id, kind: r.kind, targetId: r.target_id, name: r.name, address: r.address, lat: r.lat, lon: r.lon, fee: r.fee, maxStayMinutes: r.max_stay_minutes, limitSchedule: r.limit_schedule || [], disc: r.disc, customersOnly: r.customers_only, note: r.note, observedOn: r.observed_on, reviewedAt: r.reviewed_at,
    createdAt: r.created_at, status: r.status, reason: r.moderator_note, uid: r.client_hash, photoPath: r.photo_path, photoTakenAt: r.photo_taken_at, photoLat: r.photo_lat, photoLon: r.photo_lon, photoAccuracy: r.photo_accuracy });
  const isMod = async () => { const { data } = await sb.auth.getSession(); if (!data.session) return false; const r = await sb.rpc('is_moderator'); return r.data === true; };
  const api = {
    kind: 'supabase', moderator: await isMod().catch(() => false), canSubmit: true, needsPhoto: true, whyNot: '', canLogin: true,
    async submit(o, photo) {
      if (!photo || !photo.blob) throw Error('Ota kuva liikennemerkistä kameralla.');
      const path = 'pending/' + crypto.randomUUID() + '.jpg';
      const up = await sb.storage.from(BUCKET).upload(path, photo.blob, { contentType: 'image/jpeg', upsert: false });
      if (up.error) throw Error('Kuvan lähetys epäonnistui: ' + up.error.message);
      const ins = await sb.from('submissions').insert(toRow(o, photo, path));
      if (ins.error) throw Error(ins.error.message || 'Ilmoituksen lähetys epäonnistui.');
    },
    async mine() { return []; },
    onApproved(cb) { sb.from('approved_submissions').select('*').limit(5000).then(r => cb(r.error ? [] : r.data.map(fromRow))).catch(() => cb([])); return () => {}; },
    async login(email, password) { const r = await sb.auth.signInWithPassword({ email, password }); if (r.error) throw Error('Kirjautuminen epäonnistui: ' + r.error.message); api.moderator = await isMod(); if (!api.moderator) { await sb.auth.signOut(); throw Error('Tunnuksella ei ole tarkastajan oikeuksia (lisää käyttäjä moderators-tauluun).'); } },
    async logout() { await sb.auth.signOut(); api.moderator = false; },
    async pending() { const r = await sb.from('submissions').select('*').eq('status', 'pending').order('created_at').limit(500); if (r.error) throw r.error; return r.data.map(fromRow); },
    async photoUrl(item) { if (!item.photoPath) return null; const r = await sb.storage.from(BUCKET).createSignedUrl(item.photoPath, 600); return r.error ? null : r.data.signedUrl; },
    async decide(item, status, reason) { const r = await sb.from('submissions').update({ status, moderator_note: reason || null }).eq('id', item.id); if (r.error) throw r.error; },
    async withdraw(id) { const r = await sb.from('submissions').update({ status: 'rejected', moderator_note: 'Poistettu kartalta' }).eq('id', id); if (r.error) throw r.error; },
    async deletePhoto(item) { const r = await sb.storage.from(BUCKET).remove([item.photoPath]); if (r.error) throw r.error; await sb.from('submissions').update({ photo_deleted: true }).eq('id', item.id); }
  };
  return api;
}

export async function pickBackend() {
  if (window.PV_BACKEND === 'claude') return await claudeBackend();
  return await supabaseBackend(window.PV_CONFIG && window.PV_CONFIG.supabase);
}

export const FEE_TEXT = { free: 'Ilmainen', paid: 'Maksullinen', gone: 'Paikkaa ei ole / pysäköinti kielletty' };
export function limitText(o) {
  if (o.maxStayMinutes === null) return 'aikaraja ei tiedossa';
  if (o.maxStayMinutes === 0) return 'ei aikarajaa';
  const d = o.maxStayMinutes, t = d % 60 ? d + ' min' : d / 60 + ' h';
  const names = { '1,2,3,4,5': 'ma–pe', '6': 'la', '0': 'su ja pyhät' }, hm = m => Math.floor(m / 60) + (m % 60 ? '.' + String(m % 60).padStart(2, '0') : '');
  const when = (o.limitSchedule || []).map(r => (names[r.days.join(',')] || r.days.join(',')) + ' ' + hm(r.start) + '–' + hm(r.end)).join(', ');
  return t + (when ? ' (' + when + ')' : ' (aina)');
}
