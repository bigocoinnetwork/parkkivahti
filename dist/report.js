// Ilmoituslomake, omat ilmoitukset ja tarkastusjono (käyttöliittymä).
import { pickBackend, validateSubmission, scheduleFromForm, toRecord, FEE_TEXT, limitText, PHOTO_MAX_DIST_M } from './contrib.js';
import { captureLivePhoto, distanceM, cameraSupported } from './camera.js';

export function setupReports(ctx) {
  const $r = s => document.querySelector(s), h = ctx.esc;
  let backend = null, approved = [], openedAt = 0, picking = false, draft = null;

  const dlg = document.createElement('dialog'); dlg.id = 'report-dialog'; document.body.append(dlg);
  const modDlg = document.createElement('dialog'); modDlg.id = 'mod-dialog'; document.body.append(modDlg);
  const pickBar = document.createElement('div'); pickBar.className = 'pick-bar'; pickBar.hidden = true;
  pickBar.innerHTML = '<span>Siirrä karttaa niin, että risti on pysäköintipaikan kohdalla, tai napauta karttaa.</span><button id="pick-ok">Valitse tämä kohta</button><button id="pick-cancel" class="quiet">Peruuta</button>';
  const cross = document.createElement('div'); cross.className = 'pick-cross'; cross.hidden = true;
  $r('.map-section').append(pickBar, cross);

  // Painikkeet sivupalkkiin
  const bar = document.createElement('div'); bar.className = 'report-bar';
  bar.innerHTML = '<button id="add-place" class="report-btn">+ Ilmoita puuttuva paikka</button><button id="my-reports" class="quiet" hidden>Omat ilmoitukset</button><button id="mod-queue" class="mod-btn" hidden>Tarkastusjono</button><button id="mod-login" class="quiet" hidden>Ylläpito</button>';
  $r('.quick-cities').after(bar);
  $r('#add-place').onclick = () => openForm({ kind: 'new' });
  $r('#my-reports').onclick = showMine;
  $r('#mod-queue').onclick = showQueue;
  $r('#mod-login').onclick = () => backend && backend.moderator ? backend.logout().then(() => { $r('#mod-queue').hidden = true; $r('#mod-login').textContent = 'Ylläpito'; }) : showLogin();

  pickBackend().then(b => {
    backend = b;
    if (!b) return;
    if (b.kind === 'claude' && b.canSubmit) $r('#my-reports').hidden = false;
    if (b.canLogin) $r('#mod-login').hidden = false;
    if (b.moderator) { $r('#mod-queue').hidden = false; $r('#mod-login').textContent = 'Kirjaudu ulos'; refreshCount(); }
    b.onApproved(rows => { approved = rows; ctx.applyApproved(rows.map(a => ({ a, rec: null }))); });
  }).catch(() => {});

  async function refreshCount() { try { const n = (await backend.pending()).length; $r('#mod-queue').textContent = 'Tarkastusjono (' + n + ')'; } catch {} }

  // ---------- lomake ----------
  function openForm(opts) {
    const p = opts.kind === 'correction' ? ctx.getPlace(opts.targetId) : null;
    const c = ctx.map.getCenter();
    draft = draft && draft.kind === opts.kind && draft.targetId === (p && p.id) ? draft : {
      kind: opts.kind, targetId: p ? p.id : null, lat: p ? p.lat : c.lat, lon: p ? p.lon : c.lng,
      name: p ? p.name : '', address: p ? (p.address || '') : '', fee: 'free',
      maxStayMinutes: p ? (p.maxStayMinutes ?? '') : '', rows: [['', ''], ['', ''], ['', '']], disc: p ? !!p.disc : false, customersOnly: false,
      note: '', observedOn: new Date().toISOString().slice(0, 10), photo: null, locPicked: !!p
    };
    renderForm(p);
  }
  function renderForm(p) {
    const d = draft, off = !backend || !backend.canSubmit;
    const why = !backend ? 'Ilmoittaminen ei ole käytössä tässä versiossa. Ylläpitäjä voi ottaa sen käyttöön (ks. README: Käyttäjien ilmoitukset).' : backend.whyNot;
    const opt = (v, t) => `<option value="${v}"${String(d.maxStayMinutes) === String(v) ? ' selected' : ''}>${t}</option>`;
    const row = (i, label) => `<div class="sched-row"><span>${label}</span><input inputmode="decimal" id="rf-f${i}" placeholder="klo" value="${h(d.rows[i][0])}" aria-label="${label} alkaa"><span>–</span><input inputmode="decimal" id="rf-t${i}" placeholder="klo" value="${h(d.rows[i][1])}" aria-label="${label} päättyy"></div>`;
    dlg.innerHTML = `<form id="report-form" method="dialog" novalidate>
      <div class="dialog-heading"><h2>${d.kind === 'correction' ? 'Ilmoita virheestä' : 'Ilmoita puuttuva paikka'}</h2><button type="button" id="rf-close" aria-label="Sulje">×</button></div>
      <p class="subtext">Ilmoitukset tarkastetaan ennen kuin ne näkyvät kartalla. Kirjaa tiedot paikan liikennemerkin mukaan.</p>
      ${off ? `<p class="caution">${h(why)}</p>` : ''}
      ${p ? `<p class="rf-target"><strong>${h(p.name)}</strong><br><small>${h([p.city, p.address].filter(Boolean).join(' · '))} · nyt: ${h(ctx.formatLimit(p.maxStayMinutes))}</small></p>` : ''}
      <fieldset><legend>Sijainti</legend>
        <div class="rf-loc"><span id="rf-coords">${d.lat.toFixed(5)}, ${d.lon.toFixed(5)}</span><button type="button" id="rf-pick">Valitse kartalta</button></div>
        <label>Paikan nimi<input id="rf-name" maxlength="120" value="${h(d.name)}" placeholder="esim. Kirjaston pysäköintialue"></label>
        <label>Osoite tai katu<input id="rf-address" maxlength="160" value="${h(d.address)}" placeholder="esim. Kauppakatu 5"></label>
      </fieldset>
      <fieldset><legend>Ehdot liikennemerkin mukaan</legend>
        <div class="rf-radios" role="radiogroup" aria-label="Maksullisuus">${Object.entries(FEE_TEXT).map(([k, t]) => `<label class="chip"><input type="radio" name="rf-fee" value="${k}"${d.fee === k ? ' checked' : ''}> ${t}</label>`).join('')}</div>
        <label>Aikaraja<select id="rf-max">${opt('', 'En tiedä')}${opt(0, 'Ei aikarajaa')}${opt(15, '15 min')}${opt(30, '30 min')}${opt(60, '1 h')}${opt(120, '2 h')}${opt(180, '3 h')}${opt(240, '4 h')}${opt(360, '6 h')}${opt(720, '12 h')}${opt(1440, '24 h')}</select></label>
        <p class="subtext">Milloin aikaraja on voimassa? Jätä tyhjäksi, jos aina. Merkissä sulkeissa oleva aika on lauantai, punainen sunnuntai ja pyhät.</p>
        ${row(0, 'Arkisin ma–pe')}${row(1, 'Lauantaisin')}${row(2, 'Su ja pyhät')}
        <label class="check"><input type="checkbox" id="rf-disc"${d.disc ? ' checked' : ''}> Pysäköintikiekko pakollinen</label>
        <label class="check"><input type="checkbox" id="rf-cust"${d.customersOnly ? ' checked' : ''}> Vain asiakkaille</label>
      </fieldset>
      <fieldset><legend>Kuva liikennemerkistä (pakollinen)</legend>
        <p class="subtext">Kuva otetaan kameralla paikan päällä. Kuvaushetken sijainti ja aika tallennetaan, jotta tarkastaja voi varmistaa ilmoituksen. Älä kuvaa ihmisiä tai rekisterikilpiä tarpeettomasti.</p>
        ${d.photo ? `<div class="rf-photo"><img src="${d.photo.url}" alt="Otettu kuva"><div><strong>Kuva otettu</strong><br><small>±${Math.round(d.photo.accuracy)} m · ${Math.round(distanceM(d.photo.lat, d.photo.lon, d.lat, d.lon))} m ilmoitetusta paikasta</small><br><button type="button" id="rf-cam">Ota uusi kuva</button></div></div>` : `<button type="button" id="rf-cam" class="action-btn cam-open"${cameraSupported() ? '' : ' disabled'}>Avaa kamera</button>${cameraSupported() ? '' : '<p class="caution">Tämä selain ei anna käyttää kameraa. Avaa sivu puhelimen selaimessa https-osoitteesta.</p>'}`}
      </fieldset>
      <label>Lisätietoa tarkastajalle<textarea id="rf-note" maxlength="500" rows="3" placeholder="esim. kyltti vaihdettu syyskuussa, talvella kielto ke 8–12"></textarea></label>
      <label>Havaintopäivä<input type="date" id="rf-date" value="${h(d.observedOn)}"></label>
      <label class="hp" aria-hidden="true">Jätä tyhjäksi<input id="rf-web" tabindex="-1" autocomplete="off"></label>
      <label class="check"><input type="checkbox" id="rf-ok"> Tieto perustuu omaan havaintooni paikan liikennemerkistä.</label>
      <p id="rf-msg" class="rf-msg" role="status"></p>
      <div class="rf-actions"><button type="button" id="rf-cancel" class="quiet">Peruuta</button><button type="submit" id="rf-send" class="action-btn"${off ? ' disabled' : ''}>Lähetä tarkastettavaksi</button></div>
    </form>`;
    dlg.querySelector('#rf-note').value = d.note;
    if (!dlg.open) dlg.showModal();
    openedAt = Date.now();
    dlg.querySelector('#rf-close').onclick = dlg.querySelector('#rf-cancel').onclick = () => { draft = null; dlg.close(); };
    dlg.querySelector('#rf-pick').onclick = () => { saveDraft(); draft.locPicked = true; startPick(); };
    const cam = dlg.querySelector('#rf-cam');
    if (cam) cam.onclick = async () => {
      saveDraft(); dlg.close();
      try {
        const shot = await captureLivePhoto();
        if (shot) { if (draft.photo) URL.revokeObjectURL(draft.photo.url); draft.photo = shot; if (draft.kind === 'new' && !draft.locPicked) { draft.lat = shot.lat; draft.lon = shot.lon; const st = ctx.nearestStreet(shot.lat, shot.lon); if (st && !draft.address) draft.address = st; } }
      } catch (err) { ctx.toast(err.message); }
      renderForm(draft.targetId ? ctx.getPlace(draft.targetId) : null);
    };
    dlg.querySelector('#report-form').onsubmit = send;
  }
  function saveDraft() {
    const g = id => dlg.querySelector(id);
    Object.assign(draft, { name: g('#rf-name').value, address: g('#rf-address').value, fee: (g('input[name=rf-fee]:checked') || {}).value, maxStayMinutes: g('#rf-max').value,
      rows: [0, 1, 2].map(i => [g('#rf-f' + i).value, g('#rf-t' + i).value]), disc: g('#rf-disc').checked, customersOnly: g('#rf-cust').checked, note: g('#rf-note').value, observedOn: g('#rf-date').value });
  }
  async function send(e) {
    e.preventDefault(); saveDraft();
    const msg = dlg.querySelector('#rf-msg'), btn = dlg.querySelector('#rf-send');
    try {
      if (dlg.querySelector('#rf-web').value) throw Error('Lähetys estetty.');
      if (Date.now() - openedAt < 4000) throw Error('Tarkista tiedot ennen lähettämistä.');
      if (!dlg.querySelector('#rf-ok').checked) throw Error('Vahvista, että tieto perustuu omaan havaintoosi.');
      if (backend.needsPhoto && !draft.photo) throw Error('Ota kuva liikennemerkistä kameralla.');
      if (draft.photo) { const dist = distanceM(draft.photo.lat, draft.photo.lon, draft.lat, draft.lon); if (dist > PHOTO_MAX_DIST_M + Math.min(draft.photo.accuracy, 200)) throw Error(`Kuva on otettu ${Math.round(dist)} m päässä ilmoitetusta paikasta. Ota kuva paikan päällä tai korjaa sijainti.`); if (Date.now() - new Date(draft.photo.takenAt) > 25 * 60000) throw Error('Kuva on yli 25 minuuttia vanha. Ota uusi kuva.'); }
      const sched = scheduleFromForm([[[1, 2, 3, 4, 5], ...draft.rows[0]], [[6], ...draft.rows[1]], [[0], ...draft.rows[2]]]);
      const o = validateSubmission({ ...draft, limitSchedule: sched, maxStayMinutes: draft.maxStayMinutes });
      btn.disabled = true; msg.textContent = 'Lähetetään…';
      await backend.submit(o, draft.photo);
      if (draft.photo) URL.revokeObjectURL(draft.photo.url); draft = null; dlg.close(); ctx.toast('Kiitos! Ilmoitus on tarkastusjonossa. Se näkyy kartalla, kun tarkastaja on hyväksynyt sen.');
      if (backend.moderator) refreshCount();
    } catch (err) { msg.textContent = err.message || 'Lähetys epäonnistui.'; btn.disabled = false; }
  }
  // ---------- sijainnin valinta ----------
  function startPick() {
    dlg.close(); picking = true; pickBar.hidden = false; cross.hidden = false;
    ctx.map.setView([draft.lat, draft.lon], Math.max(ctx.map.getZoom(), 17));
    document.body.classList.remove('list-mode');
  }
  function endPick(ok, latlng) {
    picking = false; pickBar.hidden = true; cross.hidden = true;
    if (ok) { const c = latlng || ctx.map.getCenter(); draft.lat = c.lat; draft.lon = c.lng; const s = ctx.nearestStreet(c.lat, c.lng); if (s && !draft.address) draft.address = s; }
    renderForm(draft.targetId ? ctx.getPlace(draft.targetId) : null);
  }
  pickBar.querySelector('#pick-ok').onclick = () => endPick(true);
  pickBar.querySelector('#pick-cancel').onclick = () => endPick(false);
  ctx.map.on('click', e => { if (picking) endPick(true, e.latlng); });

  // ---------- omat ilmoitukset ----------
  async function showMine() {
    modDlg.innerHTML = '<div class="dialog-heading"><h2>Omat ilmoitukset</h2><button id="md-close" aria-label="Sulje">×</button></div><div id="md-body">Ladataan…</div>';
    modDlg.showModal(); modDlg.querySelector('#md-close').onclick = () => modDlg.close();
    try {
      const list = await backend.mine(), st = { pending: 'Odottaa tarkastusta', approved: 'Hyväksytty', rejected: 'Hylätty' };
      modDlg.querySelector('#md-body').innerHTML = list.length ? list.map(s => `<div class="mod-item"><span class="badge ${s.status === 'approved' ? 'free' : s.status === 'rejected' ? 'closed' : 'unknown'}">${st[s.status] || s.status}</span><h3>${h(s.name || s.address || 'Nimetön paikka')}</h3><p>${h(FEE_TEXT[s.fee])} · ${h(limitText(s))}<br><small>Lähetetty ${h(ctx.fmtDate(s.createdAt))}${s.reason ? ' · Perustelu: ' + h(s.reason) : ''}</small></p></div>`).join('') : '<p>Et ole vielä lähettänyt ilmoituksia.</p>';
    } catch { modDlg.querySelector('#md-body').textContent = 'Ilmoituksia ei voitu ladata.'; }
  }

  // ---------- tarkastusjono ----------
  async function showQueue() {
    modDlg.innerHTML = '<div class="dialog-heading"><h2>Tarkastusjono</h2><button id="md-close" aria-label="Sulje">×</button></div><p class="subtext">Hyväksytty ilmoitus näkyy heti kaikille kartalla lähteellä ”Käyttäjän ilmoitus (tarkastettu)”. Vertaa lähdetietoon ja ilmoittajan muihin ilmoituksiin ennen hyväksyntää.</p><div id="md-body">Ladataan…</div><h3>Hyväksytyt</h3><div id="md-approved"></div>';
    modDlg.showModal(); modDlg.querySelector('#md-close').onclick = () => modDlg.close();
    let items = [];
    try { items = await backend.pending(); } catch { modDlg.querySelector('#md-body').textContent = 'Jonoa ei voitu ladata.'; return; }
    const perUser = {}; items.forEach(i => perUser[i.uid] = (perUser[i.uid] || 0) + 1);
    const body = modDlg.querySelector('#md-body');
    body.innerHTML = items.length ? items.map((s, i) => {
      const t = s.targetId ? ctx.getPlace(s.targetId) : null, near = ctx.nearest(s.lat, s.lon);
      return `<div class="mod-item" data-i="${i}"><div class="place-top"><span class="badge unknown">${s.kind === 'correction' ? 'Korjaus' : 'Uusi paikka'}</span><small>${h(ctx.fmtDate(s.createdAt))} · ilmoittajalta jonossa ${perUser[s.uid]}</small></div>
        <h3>${h(s.name || s.address || 'Nimetön paikka')}</h3>
        <dl class="mod-dl"><dt>Ilmoitus</dt><dd>${h(FEE_TEXT[s.fee])} · ${h(limitText(s))}${s.disc ? ' · kiekko' : ''}${s.customersOnly ? ' · vain asiakkaille' : ''}</dd>
        ${t ? `<dt>Nykyinen lähdetieto</dt><dd>${h(t.name)} · ${h(ctx.formatLimit(t.maxStayMinutes))}${t.disc ? ' · kiekko' : ''} (${h(t.sourceId)})</dd>` : `<dt>Lähin lähdekohde</dt><dd>${near ? h(near.p.name) + ', ' + Math.round(near.d) + ' m' : 'ei lähellä'}</dd>`}
        <dt>Osoite</dt><dd>${h(s.address || '–')}</dd><dt>Havaittu</dt><dd>${h(s.observedOn)}</dd>${s.note ? `<dt>Lisätieto</dt><dd>${h(s.note)}</dd>` : ''}
        ${s.photoPath ? `<dt>Kuva</dt><dd>${photoMeta(s)}</dd>` : '<dt>Kuva</dt><dd>ei kuvaa</dd>'}</dl>
        ${s.photoPath ? `<a class="mod-photo" data-photo="${i}" target="_blank" rel="noopener noreferrer"><img alt="Ilmoittajan kuva" data-photo-img="${i}"></a>` : ''}
        <div class="mod-actions"><button data-a="show">Näytä kartalla</button><input data-a="reason" placeholder="Hylkäyksen syy (näkyy ilmoittajalle)" maxlength="200">${s.photoPath && backend.deletePhoto ? '<button data-a="delphoto" class="quiet">Poista kuva</button>' : ''}<button data-a="reject" class="quiet">Hylkää</button><button data-a="approve" class="action-btn">Hyväksy</button></div></div>`;
    }).join('') : '<p>Jono on tyhjä.</p>';
    items.forEach((s, i) => { if (s.photoPath && backend.photoUrl) backend.photoUrl(s).then(u => { const im = body.querySelector(`[data-photo-img="${i}"]`); if (u && im) { im.src = u; im.closest('a').href = u; } else if (im) im.alt = 'Kuvaa ei voitu ladata'; }); });
    body.onclick = async e => {
      const b = e.target.closest('button[data-a]'); if (!b) return; const box = b.closest('.mod-item'), s = items[+box.dataset.i];
      if (b.dataset.a === 'show') { modDlg.close(); ctx.map.setView([s.lat, s.lon], 18); ctx.flashPoint(s.lat, s.lon); return; }
      b.disabled = true;
      if (b.dataset.a === 'delphoto') { try { await backend.deletePhoto(s); s.photoPath = null; box.querySelector('.mod-photo')?.remove(); b.remove(); ctx.toast('Kuva poistettu.'); } catch { b.disabled = false; ctx.toast('Kuvan poisto epäonnistui.'); } return; }
      try {
        const near = ctx.nearest(s.lat, s.lon);
        await backend.decide(s, b.dataset.a === 'approve' ? 'approved' : 'rejected', box.querySelector('[data-a=reason]').value, { city: near ? near.p.city : null, municipalityCode: near ? near.p.municipalityCode : null });
        box.remove(); refreshCount(); ctx.toast(b.dataset.a === 'approve' ? 'Hyväksytty ja julkaistu kartalle.' : 'Hylätty.');
      } catch { b.disabled = false; ctx.toast('Tallennus epäonnistui. Yritä uudelleen.'); }
    };
    const ap = modDlg.querySelector('#md-approved');
    ap.innerHTML = approved.length ? approved.map((a, i) => `<div class="mod-item small"><strong>${h(a.name || a.address || 'Nimetön')}</strong> · ${h(FEE_TEXT[a.fee])} · ${h(limitText(a))} · hyväksytty ${h(ctx.fmtDate(a.reviewedAt))} <button data-w="${i}" class="quiet">Poista kartalta</button></div>`).join('') : '<p class="subtext">Ei hyväksyttyjä ilmoituksia.</p>';
    ap.onclick = async e => { const b = e.target.closest('button[data-w]'); if (!b) return; b.disabled = true; try { await backend.withdraw(approved[+b.dataset.w].id); b.closest('.mod-item').remove(); } catch { b.disabled = false; } };
  }

  function photoMeta(s) {
    const d = distanceM(s.photoLat, s.photoLon, s.lat, s.lon), age = (new Date(s.createdAt) - new Date(s.photoTakenAt)) / 60000;
    const warn = d > 150 || s.photoAccuracy > 150 || age > 20;
    return `<span class="${warn ? 'warn-text' : ''}">${Math.round(d)} m ilmoitetusta paikasta · tarkkuus ±${Math.round(s.photoAccuracy)} m · otettu ${h(ctx.fmtDate(s.photoTakenAt))} ${new Date(s.photoTakenAt).toLocaleTimeString('fi-FI', { timeZone: 'Europe/Helsinki', hour: '2-digit', minute: '2-digit' })} (${Math.max(0, Math.round(age))} min ennen lähetystä)</span>`;
  }
  function showLogin() {
    modDlg.innerHTML = `<form id="login-form" novalidate><div class="dialog-heading"><h2>Ylläpitäjän kirjautuminen</h2><button type="button" id="md-close" aria-label="Sulje">×</button></div>
      <p class="subtext">Tarkastajan tunnus luodaan Supabasessa (Authentication → Users) ja lisätään moderators-tauluun.</p>
      <label class="login-l">Sähköposti<input type="email" id="lg-email" autocomplete="username" required></label>
      <label class="login-l">Salasana<input type="password" id="lg-pass" autocomplete="current-password" required></label>
      <p class="rf-msg" id="lg-msg" role="status"></p><div class="rf-actions"><button type="submit" class="action-btn">Kirjaudu</button></div></form>`;
    modDlg.showModal(); modDlg.querySelector('#md-close').onclick = () => modDlg.close();
    modDlg.querySelector('#login-form').onsubmit = async e => {
      e.preventDefault(); const m = modDlg.querySelector('#lg-msg'); m.textContent = 'Kirjaudutaan…';
      try { await backend.login(modDlg.querySelector('#lg-email').value.trim(), modDlg.querySelector('#lg-pass').value); modDlg.close(); $r('#mod-queue').hidden = false; $r('#mod-login').textContent = 'Kirjaudu ulos'; refreshCount(); showQueue(); }
      catch (err) { m.textContent = err.message; }
    };
  }

  return { report: id => openForm({ kind: 'correction', targetId: id }), toRecord };
}
