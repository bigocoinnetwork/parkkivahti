# Parkkivahti

Suomen maksuttomaksi merkittyjen pysäköintikohteiden karttasovellus. Lähteet haettu 29.9.2026 Suomen ajassa.

## Käyttö

Hae kunta, paikan nimi tai osoite. Kuntahaku toimii myös ruotsinkielisellä nimellä. Osoitehaku käyttää Nominatimia vain käyttäjän lähettämästä hausta. Siirrä ja lähennä karttaa; listalla näkyvät kartan rajauksen kohteet. Puhelimessa vaihda kartan ja listan välillä alareunan painikkeesta. Valitse kohde avataksesi aikarajat, lähteet ja reittiohjeen.

- **Ilmainen nyt:** lähteiden ja Suomen kellonajan perusteella maksuton, ehdot tulkittavissa. Ei pysäköintilupa eikä tieto vapaasta ruudusta.
- **24/7 ilmainen:** lähde ilmoittaa ympärivuorokautisen aukiolon ja maksuttomuuden. Yksittäisellä pysäköinnillä voi silti olla aikaraja.
- **Aikaraja:** suodattaa lähteen ilmoittamaa pysäköinnin enimmäiskestoa. Puuttuva tieto ei ole rajaton pysäköinti.
- **Tarkista ehdot:** tieto puuttuu, on liian vanha, sisältää lisäehtoja tai lähteet ovat ristiriidassa.

## Kattavuus ja tuoreus

15 208 lähdekohdetta 283 kunnassa, 308 kunnan aluejaossa. Luvut eivät tarkoita yksittäisiä parkkiruutuja tai 283 kunnan täydellistä kartoitusta. Lähteiden välillä voi olla päällekkäisyyksiä.

| Lähde | Kohteita | Rajaus |
|---|---:|---|
| Helsingin kaupunki | 2 031 | Maksuttomat luokat 1, 2, 8; yleiskäyttöiset kohteet |
| Fintraffic / Digitraffic LIIPI | 173 | Maksuttomiksi luokitellut autoliityntäparkit, myös suljetut erikseen |
| OpenStreetMap | 13 004 | `amenity=parking`, `fee=no`; Suomen kuntarajojen sisällä |

Helsingin lähdeaineiston ilmoittama päivityspäivä on 25.9.2026. Muiden lähteiden päivitys- ja mahdollinen tarkistuspäivä säilytetään kohdekohtaisesti. Noutoaika on aina erillinen tieto. Mitään kohdetta ei ole maastotarkistettu tämän työn aikana.

Suuri osa OSM-kohteista ei sisällä aikarajaa tai aukioloaikaa. Niitä ei tulkita 24/7-kohteiksi. Erillisiä kadunvarsien `parking:left/right/both`-tageja, `fee=yes`-paikkojen ilmaistunteja, kuntien kaikkia kartta-PDF:iä tai yritysten asiakaspysäköintiä ei ole kattavasti kerätty. Kuntien yleistetty raja voi jättää saari- ja rajakohteita pois. Lähdekartoitus ja sen avoimet aukot: [KARTOITUS.md](KARTOITUS.md).

Kellonajan mukainen tilalaskenta päivittyy minuutin välein. **Lähdeaineisto ei päivity automaattisesti.** Yli 30 päivää vanha nouto ei pääse aktiivisten suodattimeen. OSM:n yli vuoden vanha muokkaus/tarkistus ei pääse aktiivisten joukkoon. Tämä varovaisuus ei ole takuu tuoreen tiedon oikeellisuudesta.

## Paikallinen käynnistys

Tarvitaan Python 3.10+; ei asennettavia Python-paketteja. Avaa pääte tämän kansion kohdalle:

```text
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Avaa selaimessa `http://127.0.0.1:4173`. Pelkkä HTML-tiedoston kaksoisnapsautus ei toimi, koska selain estää paikallisten JSON-tiedostojen lataamisen. Karttatiilet ja osoitehaku tarvitsevat internetyhteyden. Karttakirjasto toimitetaan mukana. Käyttö ei tarvitse API-avaimia.

## Päivitys

```text
python scripts/update.py
python scripts/validate.py
node --test tests/rules.test.mjs
```

Päivittäjä lataa julkiset lähteet, tarkistaa ettei vastaus ole katkennut, normalisoi tiedot väliaikaiseen kansioon ja validoi ne ennen julkisen otoksen korvaamista. Latauksen, muunnoksen tai validoinnin epäonnistuminen säilyttää vanhan julkisen otoksen. Raaka-aineistot tallentuvat `work/updates`-kansioon, jota ei julkaista. Onnistuneen paikallispäivityksen jälkeen sivusto on julkaistava uudelleen. Ajastusta ei ole asennettu.

Verkkopalvelut voivat rajoittaa latauksia. Odota ennen uusintayritystä; älä ohita virhettä tyhjällä aineistolla. Kuntarajojen vuosiluku ja mahdollinen LIIPI–PETI-siirtymä tarkistetaan vuosittain. Lähdekartoituksen käsin kirjoitetut merkinnät eivät päivity automaattisesti.

## Uusi kunta tai lähde

OSM- ja LIIPI-poiminnat ovat valtakunnallisia; niihin lisätyt kohteet tulevat mukaan seuraavalla päivityksellä, jos sisäänottokriteerit täyttyvät. Uusi kuntarajapinta lisätään näin:

1. Lisää päätepiste `scripts/source-config.json`-tiedostoon ja noutokäsittely tarvittaessa päivittäjään.
2. Lisää oma sovitin `scripts/normalize.py`-tiedostoon. Säilytä alkuperäiset rajoitukset `rawRules`-kentässä, lähdeosoite sekä nouto- ja päivitysajat. Tuntematon arvo on `null`, ei nolla.
3. Lisää lähde `dist/data/sources.json`-rekisteriin lisensseineen ja kattavuusrajauksineen, sovittimien ajolistaan, validointiin ja sovelluksen ladattaviin lähteisiin.
4. Lisää vain dokumentoidut säännöt `dist/rules.js`-tulkintaan sekä niitä todentava testi. Tunnistamaton ehto pysyy epävarmana.
5. Validoi uusi otos ja julkaise. Aineistot pidetään erillään lähteittäin. Älä yhdistä lähekkäisiä kohteita automaattisesti: viereisillä puolilla katua voi olla eri ehdot.

`scripts/overrides.json` sisältää tunnistetut lähderistiriidat lähdeviitteineen. Niiden tarkistus on osa päivitystä; niitä ei poisteta automaattisesti. Sovelluksen skeema on `dist/data/parking.schema.json`.

## Julkaisuversio ilman ulkoisia palveluja (lisätty 30.9.2026)

Sovellus toimii nyt myös ilman OpenStreetMapin karttatiiliä ja Nominatim-osoitehakua:

- **Oma taustakartta** `dist/data/basemap.json`: Tilastokeskuksen kuntarajat 2026, OSM:n pääteiet sekä kaupunkien ja taajamien nimet. Piirretään karttatiilien alle ja otetaan näkyviin, jos tiilet eivät lataudu. Lähikuvassa (zoom ≥ 15) näytetään katujen nimet.
- **Oma katuhakemisto** `dist/data/streets.tsv`: noin 180 000 katua kunnittain (OSM). Osoitehaku kokeilee ensin sitä (”Mannerheimintie, Helsinki”, ”Hämeenkatu 10 Tampere”) ja vasta sitten Nominatimia. Talonumeroa ei paikanneta; kartta keskitetään kadun keskikohtaan.
- **Julkaisuversio** `python scripts/build_artifact.py` → `build/artifact/`: yksi sivu, jossa tyylit ja skriptit on upotettu, `window.PV_OFFLINE=true` (ei tiiliä, ei Nominatimia). Aineistot ladataan `data/`-kansiosta.
- Taustakartan ja katuhakemiston päivitys: `scripts/offline_assets.py` (vaatii shapely-kirjaston; lähdekyselyt tiedoston alussa). Ei osa `update.py`:tä.

Lisätyt ristiriitamerkinnät (`scripts/overrides.json`, Metsähallituksen kokeilu 1.9.2026): Koli P1 (`osm-way-167079819`) ja kolme Kiilopääntien pään aluetta (`osm-way-79423636`, `osm-way-767828019`, `osm-way-1341511704`). Julkaistu `dist/data/osm.json` on päivitetty vastaamaan niitä. Korouoman Saukkovaaran aluetta ei ole otoksessa (jää yleistetyn kuntarajan ulkopuolelle), Sipoonkorven Kalkkiuunintien alueita ei löytynyt lähteistä.

Huomio: sovellus merkitsee kaikki kohteet tilaan ”Tarkista ehdot”, kun noudosta on yli 30 päivää (nykyisellä otoksella 29.10.2026 alkaen). Aja `update.py` ennen sitä.

## Käyttäjien ilmoitukset ja tarkastus (lisätty 30.9.2026)

Käyttäjä voi ilmoittaa virheestä (tietokortin painike *Ilmoita virheestä tai puuttuvasta tiedosta*) tai puuttuvasta paikasta (*+ Ilmoita puuttuva paikka*, sijainti valitaan kartalta). Lomake kysyy maksullisuuden, aikarajan, sen voimassaolon liikennemerkin tapaan (arki / lauantai / sunnuntai ja pyhät), kiekon, asiakasrajauksen, lisätiedon ja havaintopäivän.

**Mikään ilmoitus ei näy kartalla ennen tarkastusta.** Hyväksytty ilmoitus näkyy lähteellä *Käyttäjän ilmoitus (tarkastettu)*; korjaus korvaa kohteen tilan, ja alkuperäinen lähdetieto näytetään tietokortissa. Maksulliseksi tai poistuneeksi ilmoitettu paikka ei koskaan näy tilassa *Ilmainen nyt*. Yli vuoden vanha hyväksytty ilmoitus palautuu tilaan *Tarkista ehdot*.

Roskailmoitusten torjunta: pakollinen vahvistus omasta havainnosta, sijainnin oltava Suomessa, linkit estetty, havaintopäivä viimeisen vuoden ajalta, kenttien pituusrajat, piilokenttä boteille, lomakkeen täyttöaika vähintään 4 s, enintään 10 ilmoitusta / käyttäjä / vrk.

Taustapalvelu:

- **Claude-julkaisu** (`build_artifact.py`): ilmoittaminen on pois päältä, koska Claude-julkaisu ei saa käyttää kameraa. Aiempi artifactin tietokanta ja tarkastusjono säilyvät. Ilmoittaa voivat kirjautuneet käyttäjät, joilla on vähintään *Contributor*-oikeus; tarkastusjono näkyy omistajalle ja *Editor*-oikeuden saaneille. Ilmoitukset ovat yksityisiä (vain ilmoittaja ja tarkastajat näkevät ne), hyväksytyt julkisia kaikille katsojille. Huom: organisaation ulkopuoliset katsojat (julkinen linkki) voivat vain lukea, eivät ilmoittaa – se on alustan rajoitus.
- **Oma palvelin**: Supabase (ks. *Käyttöönotto* alla). Tarkastus sovelluksessa: *Ylläpito* → kirjautuminen → *Tarkastusjono*.

## Pakollinen kamerakuva (lisätty 30.9.2026)

Jokaiseen ilmoitukseen (uusi paikka tai korjaus) on otettava kuva liikennemerkistä sovelluksen omalla kameranäkymällä. Kuvaa ei voi valita galleriasta, koska sovellus lukee suoraan kameran kuvavirtaa (`dist/camera.js`, getUserMedia).

- Kuvaushetken GPS-sijainti, tarkkuus ja aika tallennetaan ja leimataan kuvaan.
- Uuden paikan sijainniksi tulee oletuksena kuvauspaikka.
- Sovellus estää lähetyksen, jos kuva on otettu yli 300 m päässä ilmoitetusta paikasta tai yli 25 minuuttia sitten. Tietokanta tarkistaa saman uudelleen (500 m, 30 min), eikä hyväksy ilmoitusta ilman tallennettua kuvaa. Samaa kuvaa ei voi käyttää kahdesti.
- Tarkastaja näkee kuvan, etäisyyden, tarkkuuden ja kuvausajan; epäilyttävät arvot korostetaan punaisella. Kuvat ovat yksityisessä säilössä (vain tarkastajat), eivätkä ne näy kartalla. *Poista kuva* poistaa kuvan tarkastuksen jälkeen.
- Rajoitukset: kamera toimii vain https-osoitteesta. Taitava huijari voi väärentää GPS-sijainnin tai kuvata näyttöä; siksi lopullinen varmistus on tarkastajan silmä. Kuvat ovat henkilötietoja, jos niissä näkyy ihmisiä tai rekisterikilpiä: tarvitset tietosuojaselosteen ja säilytysajan (suositus: poista kuva hyväksynnän tai hylkäyksen jälkeen).
- Automaattinen liikennemerkin tunnistus kuvasta (esim. tekoälyllä Supabase Edge Functionissa) on mahdollinen seuraava vaihe, mutta sitä ei ole toteutettu.

## Käyttöönotto: Supabase ja julkaisu

1. **Supabase-projekti.** Kirjaudu osoitteessa supabase.com → *New project*. Anna nimi (esim. parkkivahti), tietokannan salasana ja alue Pohjois-Eurooppa (Stockholm).
2. **Tietokanta.** *SQL Editor* → *New query* → liitä koko `supabase/schema.sql` → *Run*. Tiedosto luo taulut, oikeudet, tarkistukset ja yksityisen kuvasäilön `report-photos`.
3. **Tarkastajan tunnus.** *Authentication* → *Users* → *Add user* → *Create new user*: sähköposti, salasana, rastita *Auto Confirm User*.
4. **Tarkastajan oikeus.** *SQL Editor*: `insert into public.moderators (user_id) select id from auth.users where email = 'sinun@osoite.fi';`
5. **Avaimet sovellukseen.** *Project Settings* → *API* (tai *API Keys*): kopioi *Project URL* ja julkinen avain (*anon* / *publishable*) tiedostoon `dist/config.js` kohtiin `url` ja `anonKey`. Älä koskaan laita `service_role`- tai *secret*-avainta sovellukseen.
6. **Julkaisu https-osoitteeseen.** Esim. Netlify: app.netlify.com/drop → raahaa `dist`-kansio. Kamera ja sijainti toimivat vain https:llä.
7. **Testaa puhelimella:** *+ Ilmoita puuttuva paikka* → *Avaa kamera* → lähetä. Kirjaudu sitten *Ylläpito*-painikkeesta ja hyväksy ilmoitus *Tarkastusjonosta*.

Tietokannan säännöt on testattu PostgreSQL 16:lla (Supabasen auth- ja storage-rakenteiden jäljitelmällä): anon ei näe ilmoituksia eikä kuvia, ei voi hyväksyä omaa ilmoitustaan eikä ladata kuvaa muualle kuin `pending/`; liian kaukaa otettu, vanha tai puuttuva kuva hylätään; vain tarkastaja lukee ja hyväksyy.

## Karttapalvelut (lisätty 30.9.2026)

- Tietokortissa linkit Google Mapsiin, Apple Karttoihin, Wazeen ja OpenStreetMapiin, kartan yläkulmassa *Avaa alue Google Mapsissa*.
- Oma taustakartta sisältää nyt koko Suomen katuverkon (`dist/data/tiles/`, 165 ruutua, ladataan vain lähennettäessä, `scripts/streetgrid.py`).
- Oma palvelin käyttää `dist/config.js`:n karttatiiliä. OpenStreetMapin omat tiilet on tarkoitettu vain vähäiseen käyttöön; julkiseen palveluun vaihda avaimelliseen tiilipalveluun (esim. Maanmittauslaitoksen avoin rajapinta tai MapTiler).
- Google Mapsin karttaa ei voi upottaa sovellukseen ilman Googlen maksullista Maps JavaScript API -avainta, ja Claude-julkaisu estää kaikki ulkoiset karttapalvelut. Siksi integraatio tehdään linkeillä.

## Automaattinen päivitys (GitHub + Netlify)

- GitHub Actions ajaa `.github/workflows/update-data.yml`:n kuukauden 1. ja 15. päivä (02.17 UTC): `scripts/update.py` → validointi → testit → muuttunut `dist/data` tallennetaan repositorioon.
- Netlify linkitetään repositorioon (`netlify.toml`: julkaistaan `dist`), jolloin jokainen tallennus julkaistaan automaattisesti.
- Jos lähde ei vastaa tai validointi epäonnistuu, ajo päättyy virheeseen eikä vanhaa aineistoa korvata. GitHub lähettää virheestä sähköpostin.
- Käsin: GitHub → Actions → *Päivitä pysäköintiaineisto* → *Run workflow*.

## Rakenne

- `dist/`: suoraan julkaistava selainohjelma ja avoimet lähdekohtaiset tietokannat.
- `dist/rules.js`: konservatiivinen sääntötulkinta, Suomen aikavyöhyke ja pyhäpäivät.
- `scripts/`: päivitys, normalisointi, validointi ja lähdekohtaiset asetukset.
- `tests/`: kellonaikojen, puuttuvien ehtojen, aikarajojen ja suodattimien testit.

## Lisenssit ja yksityisyys

Helsingin kaupunki ja Fintraffic / Digitraffic: CC BY 4.0. Tilastokeskuksen kuntarajat: CC BY 4.0. OpenStreetMap ja sen tekijät: ODbL 1.0. OSM-johdannaiset (myös Helsingin arvioidut kadunnimet) ovat ODbL:n alaisia; alkuperäisten viranomaistietojen nimeämisvaatimukset säilyvät. Ladattavat tietokannat sisältävät normalisoitua, suodatettua dataa; alkuperäiset lähteet on linkitetty. Leaflet 1.9.4: BSD-2-Clause, ks. `dist/vendor/LICENSE-Leaflet.txt`. supabase-js 2.117.2: MIT, ks. `dist/vendor/LICENSE-supabase-js.txt`.

Ei käyttäjätiliä, analytiikkaa tai omaa palvelintietokantaa. Sijainti pyydetään vain käyttäjän painalluksesta ja pysyy selaimessa; karttatiilien pyyntöjen perusteella karttapalvelu näkee katsotun alueen. Osoitehaku lähettää haun Nominatimille ja säilyttää hakutuloksen saman selainistunnon välimuistissa. Reittiohje avaa valitun kohteen Google Mapsissa. Julkinen Nominatim ei sovellu suuren käyttäjämäärän palveluksi ilman erillistä palveluntarjoajaa ja yhteistä nopeusrajoitusta. Nykyinen yksityinen sovellus käyttää lähetettäviä hakuja, yli sekunnin paikallista rajoitusta ja istuntovälimuistia.

## Todennetut tarkistukset

15 208 tietueen koordinaatit, yksilölliset lähdetunnisteet, lähdeosoitteet, päivämääräkenttien olemassaolo sekä kuntasummat validoitu. Sääntötestit kattavat kesä-/talviajan, pyhäpäiviä, yön yli jatkuvan aikavälin, puuttuvat ja ristiriitaiset ehdot, 30 minuutin rajan ja suljettujen kohteiden suodatuksen. Selaimessa tarkistettu kuntahaku, osoitehaku, aktiivisuussuodatin, 30 min suodatin, 24/7-suodatin, tietokortti ja kattavuustaulukon haku. Testit eivät korvaa lähdetiedon tai liikennemerkin oikeellisuuden tarkistamista.
