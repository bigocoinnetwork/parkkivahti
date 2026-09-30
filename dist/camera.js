// Kameralla otettava todistekuva. Käyttää suoraa kamerakuvaa (getUserMedia), joten galleriasta ei voi valita
// valmista kuvaa. Kuvaushetken sijainti ja aika tallennetaan erikseen ja leimataan kuvaan tarkastajaa varten.
// Vaatii HTTPS-yhteyden (tai localhostin) ja käyttäjän luvan kameraan ja sijaintiin.

const MAX_SIDE = 1600, QUALITY = 0.8;

export function cameraSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext !== false;
}

export function distanceM(a, b, c, d) {
  const R = 6371000, r = x => x * Math.PI / 180, dLat = r(c - a), dLon = r(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function position() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(Error('Laite ei kerro sijaintia. Kuvaa ei voi vahvistaa.'));
    navigator.geolocation.getCurrentPosition(p => res(p.coords), e => rej(Error(e.code === 1 ? 'Salli sijainti selaimen asetuksista. Sijainti tarvitaan kuvan vahvistamiseen.' : 'Sijaintia ei saatu. Siirry ulos ja yritä uudelleen.')),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  });
}

/** Avaa kameranäkymän. Palauttaa {blob, url, takenAt, lat, lon, accuracy} tai null, jos käyttäjä peruu. */
export function captureLivePhoto() {
  return new Promise(async (resolve, reject) => {
    if (!cameraSupported()) return reject(Error('Tämä selain tai sivu ei anna käyttää kameraa. Avaa Parkkivahti puhelimen selaimessa (https).'));
    const dlg = document.createElement('dialog'); dlg.className = 'cam-dialog';
    dlg.innerHTML = `<div class="cam-wrap"><video playsinline muted autoplay></video><canvas hidden></canvas><img alt="Otettu kuva" hidden>
      <p class="cam-hint">Kuvaa pysäköintipaikan liikennemerkki ja lisäkilvet niin, että teksti erottuu. Sijainti tallennetaan kuvaushetkellä.</p>
      <p class="cam-msg" role="status"></p>
      <div class="cam-actions"><button type="button" data-a="cancel" class="quiet">Peruuta</button><button type="button" data-a="shoot" class="cam-shoot" aria-label="Ota kuva"></button><button type="button" data-a="retake" hidden>Ota uusi</button><button type="button" data-a="use" class="action-btn" hidden>Käytä kuvaa</button></div></div>`;
    document.body.append(dlg); dlg.showModal();
    const v = dlg.querySelector('video'), cv = dlg.querySelector('canvas'), img = dlg.querySelector('img'), msg = dlg.querySelector('.cam-msg');
    const btn = a => dlg.querySelector(`[data-a=${a}]`);
    let stream = null, shot = null, posPromise = position();
    posPromise.catch(() => {});
    const stop = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
    const close = r => { stop(); dlg.close(); dlg.remove(); if (shot && r !== shot) URL.revokeObjectURL(shot.url); resolve(r); };
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      v.srcObject = stream; await v.play().catch(() => {});
    } catch (e) {
      stop(); dlg.close(); dlg.remove();
      return reject(Error(e && e.name === 'NotAllowedError' ? 'Salli kameran käyttö selaimen asetuksista. Ilmoitus vaatii kameralla otetun kuvan.' : 'Kameraa ei voitu avata.'));
    }
    btn('cancel').onclick = () => close(null);
    btn('shoot').onclick = async () => {
      if (!v.videoWidth) { msg.textContent = 'Kamera käynnistyy vielä…'; return; }
      btn('shoot').disabled = true; msg.textContent = 'Haetaan sijaintia…';
      const takenAt = new Date();
      const s = Math.min(1, MAX_SIDE / Math.max(v.videoWidth, v.videoHeight)), w = Math.round(v.videoWidth * s), h = Math.round(v.videoHeight * s);
      cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.drawImage(v, 0, 0, w, h);
      let c;
      try { c = await posPromise; } catch { try { c = await (posPromise = position()); } catch (e) { msg.textContent = e.message; btn('shoot').disabled = false; return; } }
      const stamp = `Parkkivahti · ${takenAt.toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' })} · ${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)} ±${Math.round(c.accuracy)} m`;
      const fs = Math.max(14, Math.round(w / 55)); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, h - fs * 1.8, w, fs * 1.8);
      g.fillStyle = '#fff'; g.font = `${fs}px system-ui,sans-serif`; g.fillText(stamp, fs * .6, h - fs * .6);
      const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', QUALITY));
      if (!blob) { msg.textContent = 'Kuvan tallennus epäonnistui.'; btn('shoot').disabled = false; return; }
      shot = { blob, url: URL.createObjectURL(blob), takenAt: takenAt.toISOString(), lat: c.latitude, lon: c.longitude, accuracy: c.accuracy };
      img.src = shot.url; img.hidden = false; v.hidden = true; stop();
      msg.textContent = c.accuracy > 150 ? `Sijainnin tarkkuus on heikko (±${Math.round(c.accuracy)} m). Voit silti lähettää, tarkastaja näkee tarkkuuden.` : '';
      btn('shoot').hidden = true; btn('retake').hidden = false; btn('use').hidden = false;
    };
    btn('retake').onclick = async () => {
      URL.revokeObjectURL(shot.url); shot = null; img.hidden = true; v.hidden = false; msg.textContent = '';
      btn('shoot').hidden = false; btn('shoot').disabled = false; btn('retake').hidden = true; btn('use').hidden = true; posPromise = position(); posPromise.catch(() => {});
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); v.srcObject = stream; await v.play().catch(() => {}); } catch { msg.textContent = 'Kameraa ei voitu avata uudelleen.'; }
    };
    btn('use').onclick = () => close(shot);
    dlg.addEventListener('cancel', e => { e.preventDefault(); close(null); });
  });
}
