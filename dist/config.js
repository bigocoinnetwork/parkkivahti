// Parkkivahdin asetukset omalla palvelimella. Julkaisuversio (build_artifact.py) ei käytä tätä tiedostoa.
window.PV_CONFIG = {
  // Karttatiilet. OpenStreetMapin omat tiilet sopivat vain vähäiseen käyttöön (tile usage policy).
  // Julkiseen käyttöön vaihda palveluun, jolla on oma avain, esim. Maanmittauslaitoksen avoin rajapinta tai MapTiler.
  tiles: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  },
  // Käyttäjien ilmoitukset. Täytä Supabase-projektin URL ja julkinen anon-avain (ks. supabase/schema.sql ja README).
  // Tyhjänä ilmoituslomake kertoo, ettei ilmoittaminen ole käytössä.
  supabase: { url: 'https://zkmgrckxcjtfbcnhnwhh.supabase.co', anonKey: 'sb_publishable_qDshGCrYB3Y2J24HJPPJKg_gRsoy5xh' }
};
