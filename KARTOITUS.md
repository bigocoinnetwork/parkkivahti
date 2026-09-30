# Lähdekartoitus 29.9.2026

Kartoitus yhdistää kolme koneellista pysäköintilähdettä ja valikoitujen viranomaissivujen tarkistuksen. Se ei ole kaikkien 308 kunnan verkkosivujen tai kaikkien Suomen pysäköintipaikkojen täydellinen inventointi.

## Poiminnan laatu

| Lähde | Kohteet | Aikaraja puuttuu | Osoite puuttuu | Nimi puuttui lähteestä |
|---|---:|---:|---:|---:|
| helsinki | 2031 | 372 | 0 | 2031 |
| liipi | 173 | 116 | 131 | 0 |
| osm | 13004 | 11704 | 12610 | 12151 |

Helsingin lähteessä ei ole kohteen nimeä tai osoitetta. Lähimmän kadun nimi on laskettu OSM:n katugeometriasta 200 metrin enimmäisetäisyydellä. Se on merkitty arvioksi; kohteelle ei keksitty talonumeroa. OSM:n nimetön alue näkyy nimellä Pysäköintialue ja lähdetunniste erottaa kohteet.

## Lähderekisteri

### Helsingin kaupunki – pysäköintipaikat
[Alkuperäinen lähde](https://avoindata.suomi.fi/data/en_GB/dataset/helsingin-kantakaupungin-ja-asukaspysakointivyohykkeiden-pysakointipaikat)

Kantakaupunki ja asukaspysäköintivyöhykkeet. Mukana vain nimenomaisesti maksuttomat luokat 1, 2 ja 8, yleiskäyttöiset kohteet. Aineiston päivitys 25.9.2026. Kadunnimet on arvioitu läheisistä OSM-kaduista.

Rooli: data. Tarkistettu verkosta 29.9.2026. Lisenssi: CC BY 4.0; katujen nimien sijaintiapu © OpenStreetMap, ODbL

### Fintraffic / Digitraffic – LIIPI
[Alkuperäinen lähde](https://parking.fintraffic.fi/docs/index.html)

Valtakunnallinen liityntäpysäköintiaineisto. Mukana henkilöautokohteet hinnoitteluluokissa FREE_10H, FREE_12H ja PARK_AND_RIDE_247_FREE. Mukana myös suljettuja kohteita, joiden tila näytetään erikseen. Polkupyöräkohteita tai epäselvää CUSTOM-hinnoittelua ei ole tulkittu ilmaiseksi.

Rooli: data. Tarkistettu verkosta 29.9.2026. Lisenssi: CC BY 4.0

### OpenStreetMap ja sen tekijät
[Alkuperäinen lähde](https://www.openstreetmap.org/copyright)

Suomen kuntarajojen sisällä olevat amenity=parking + fee=no -kohteet. Yksityiset, luvanvaraiset ja kielletyt kohteet rajattu pois; asiakaspaikat merkitty ehdollisiksi. Osa saariston tai rajaseudun kohteista voi jäädä yleistettyjen kuntarajojen ulkopuolelle. Kadunvarsien erilliset parking:left/right/both-tagit eivät sisälly tähän poimintaan.

Rooli: data. Tarkistettu verkosta 29.9.2026. Lisenssi: ODbL 1.0 – muunnettu, jaettava tietokanta

### Tilastokeskus – kuntarajat 2026
[Alkuperäinen lähde](https://stat.fi/fi/palvelut/tilastodatapalvelut/paikkatietoaineistot/tilastointialueet/kuntapohjaiset-tilastointialueet)

308 kunnan yleistetyt 1:1 000 000 tilastointialueet. Kuntaliitos määräytyy karttapisteen sijainnista; rajojen läheisyydessä mahdollisia puutteita.

Rooli: support. Tarkistettu verkosta 29.9.2026. Lisenssi: CC BY 4.0

### HSL – pysäköintitietojen siirtyminen Fintrafficille
[Alkuperäinen lähde](https://www.hsl.fi/hsl/avoin-data)

HSL:n vanhan LIIPI-palvelun ylläpito päättyi; valtakunnallinen Fintraffic-palvelu korvasi sen 20.5.2024. Sovellus käyttää nykyistä rajapintaa.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

### Metsähallitus – maksullisuuskokeilu 1.9.2026 alkaen
[Alkuperäinen lähde](https://www.metsa.fi/tiedotteet/maksullisen-pysakoinnin-kokeilu-kaynnistyy-viidessa-metsahallituksen-retkikohteessa-1-9-2026/)

Tietyt Sipoonkorven, Kolin, Kiilopään, Riisitunturin ja Korouoman alueet ovat muuttuneet maksullisiksi. Maksuaika 9–18, ensimmäiset 30 min ilmaisia. Tunnistetut ristiriitaiset OSM-kohteet merkitty tarkistettaviksi. Kaikkien kokeilualueiden karttakohteita ei ole yksilöity tässä poiminnassa.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

### Helsinki – hinnat ja maksullisuusajat
[Alkuperäinen lähde](https://www.hel.fi/fi/kaupunkiymparisto-ja-liikenne/pysakointi/pysakointipaikat-hinnat-ja-maksutavat)

Yleisiä maksuvyöhykkeitä ei muuteta yksittäisiksi ilmaiskohteiksi. Kadun liikennemerkki ja sen ajat ratkaisevat; arkipyhinä sunnuntain rajoitukset.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

### Tampere – kaupungin pysäköintiaineisto
[Alkuperäinen lähde](https://data.tampere.fi/data/dataset/tampereen-keskustan-maksulliset-pysakointialueet)

Kaupungin löydetty avoin aineisto kuvaa maksullisia keskusta-alueita, joten siitä ei päätellä ilmaisia paikkoja. Kartan Tampere-kohteet perustuvat LIIPIin ja OSM:ään.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

### Turku – pysäköintialueet ja maksut
[Alkuperäinen lähde](https://www.turku.fi/liikenne-kadut-ja-kunnossapito/pysakointialueet-ja-maksut)

Kaupungin ohje ja palvelukartta löytyivät. Paikkakohtaisten ilmaisehtojen erillistä tuontia ei toteutettu; kartan kohteet LIIPIstä ja OSM:stä.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

### Oulu – pysäköinnin ohjeistus
[Alkuperäinen lähde](https://www.ouka.fi/asiakaspalvelu)

Kaupunki kuvaa sekä aikarajoitettuja että rajoittamattomia paikkoja. Yleiskuvauksesta ei päätellä yksittäisen kohteen ehtoja. Oulun karttakohteet OSM:stä ja mahdolliset LIIPI-kohteet erikseen.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

### Lahti – pysäköinnin usein kysytyt kysymykset
[Alkuperäinen lähde](https://www.lahti.fi/asuminen-ja-ymparisto/liikenne-ja-kadut/pysakointi/pysakoinnin-usein-kysytyt-kysymykset/)

Keskustan opaskartta ja maksukäytännöt löytyivät. Karttaoppaan viivoja ei ole digitoitu kohteiksi. LIIPI- ja OSM-kohteet muodostavat osittaisen kattavuuden.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

### Jyväskylä – vuoden 2026 pysäköintisuunnitelmat
[Alkuperäinen lähde](https://www.jyvaskyla.fi/uutinen/2026-06-11_jyvaskylan-kasvua-ja-kehitysta-tuetaan-maankaytolla-ja-kaavoituksella)

Maksullisuuden muutoksia käsittelevä suunnitelma löytyi. Suunnitelman sanamuotoa ei käsitellä toteutuneena liikennemerkkinä.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

### Kuopio – yleistä pysäköinnistä
[Alkuperäinen lähde](https://www.kuopio.fi/asuminen-ja-ymparisto/liikenne/pysakointi/yleista-pysakoinnista/)

Yleinen kaupungin ohjeistus ja maksuvyöhykkeet. Sovelluksen paikkakohtaiset tiedot tulevat OSM:stä ja LIIPIstä; täydellistä kunnallista ilmaiskohdeluetteloa ei vahvistettu.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

### Rovaniemi – liikenne ja pysäköinti
[Alkuperäinen lähde](https://www.rovaniemi.fi/Asuminen-ja-ymparisto/Liikenne-ja-pysakointi)

Kaupunki julkaisee maksuvyöhykkeen ajat ja pysäköintioppaan. Sovelluksessa ei yleistetä maksuttomuutta kaikille kartalla näkyville kaduille.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

### Fintraffic – PETI-kehitys ja LIIPI-tietojen migrointi
[Alkuperäinen lähde](https://www.fintraffic.fi/fi/digitaalisetpalvelut/fintrafficin-datapalvelut/liikkumisen-tietopalvelut/peti)

LIIPI-tietojen migrointi uuteen palveluun on kehityssuunnitelmassa Q3–Q4/2026. Päivittäjän tulee seurata rajapinnan jatkuvuutta; nyt käytetty LIIPI vastasi onnistuneesti.

Rooli: research. Tarkistettu verkosta 29.9.2026. Lisenssi: Ohjesivun tosiasiat; ei koko sivun uudelleenjulkaisua.

## Keruun rajat ja prioriteetit

1. Kuntien kadunvarsia koskevat viralliset liikennemerkki- ja rajoitusrajapinnat ovat tärkein seuraava laajennus. Pelkkä maksuvyöhykkeen puuttuminen ei todista maksutonta pysäköintiä.
2. OSM:n parking:left/right/both ja ehdollisesti maksuttomat fee=yes-kohteet on jätetty tästä versiosta pois. Niille tarvitaan oma turvallinen sääntötulkinta.
3. Yritysten, kauppakeskusten, sairaaloiden ja tapahtumien ehdot voivat edellyttää asiakkuutta, sovelluksen aktivointia tai lupaa. Näitä ei yleistetä julkisiksi paikoiksi.
4. Metsähallituksen vuoden 2026 maksullisuuskokeilu tunnistettiin. Riisitunturi ja Tasakalliontie P1 on yksilöity OSM-lähdetunnisteella ja merkitty ristiriitaisiksi. Muiden kokeilukohteiden täsmällinen yhdistäminen karttageometrioihin on jatkotyötä.
5. Yleistetty kuntaraja jättää osan rajaseudun ja saariston kohteista pois. 6 247 ladatun OSM-kohteen poissulku sisältää myös naapurimaiden kohteet, koska suorituskyvyn vuoksi haku tehtiin suorakaiteena ja leikattiin kuntarajoihin.
6. Lähteiden välisiä päällekkäisyyksiä ei yhdistetä ilman kohdevarmistusta. Kohdeluvut ovat lähderivejä, eivät uniikkeja ruutuja.
7. Tilapäisiä liikennemerkkejä, lumenpoistoa, työmaita, tapahtumia ja käyttöastetta ei seurata reaaliajassa.

## Kuntakohtaiset lähdekohteet

| Kunta | Helsinki | LIIPI | OSM | Kattavuus |
|---|---:|---:|---:|---|
| Akaa | 0 | 1 | 7 | Osittainen |
| Alajärvi | 0 | 0 | 10 | Osittainen |
| Alavieska | 0 | 0 | 0 | Ei poimittuja kohteita |
| Alavus | 0 | 0 | 30 | Osittainen |
| Asikkala | 0 | 0 | 29 | Osittainen |
| Askola | 0 | 0 | 1 | Osittainen |
| Aura | 0 | 0 | 12 | Osittainen |
| Brändö | 0 | 0 | 0 | Ei poimittuja kohteita |
| Eckerö | 0 | 0 | 5 | Osittainen |
| Enonkoski | 0 | 0 | 10 | Osittainen |
| Enontekiö | 0 | 0 | 94 | Osittainen |
| Espoo | 0 | 19 | 702 | Osittainen |
| Eura | 0 | 0 | 3 | Osittainen |
| Eurajoki | 0 | 0 | 17 | Osittainen |
| Evijärvi | 0 | 0 | 0 | Ei poimittuja kohteita |
| Finström | 0 | 0 | 7 | Osittainen |
| Forssa | 0 | 0 | 11 | Osittainen |
| Föglö | 0 | 0 | 1 | Osittainen |
| Geta | 0 | 0 | 6 | Osittainen |
| Haapajärvi | 0 | 0 | 8 | Osittainen |
| Haapavesi | 0 | 0 | 7 | Osittainen |
| Hailuoto | 0 | 0 | 12 | Osittainen |
| Halsua | 0 | 0 | 0 | Ei poimittuja kohteita |
| Hamina | 0 | 0 | 45 | Osittainen |
| Hammarland | 0 | 0 | 7 | Osittainen |
| Hankasalmi | 0 | 0 | 20 | Osittainen |
| Hanko | 0 | 0 | 10 | Osittainen |
| Harjavalta | 0 | 0 | 2 | Osittainen |
| Hartola | 0 | 0 | 25 | Osittainen |
| Hattula | 0 | 0 | 19 | Osittainen |
| Hausjärvi | 0 | 0 | 10 | Osittainen |
| Heinola | 0 | 0 | 85 | Osittainen |
| Heinävesi | 0 | 0 | 22 | Osittainen |
| Helsinki | 2031 | 40 | 829 | Osittainen |
| Hirvensalmi | 0 | 0 | 10 | Osittainen |
| Hollola | 0 | 0 | 19 | Osittainen |
| Huittinen | 0 | 0 | 7 | Osittainen |
| Humppila | 0 | 0 | 2 | Osittainen |
| Hyrynsalmi | 0 | 0 | 17 | Osittainen |
| Hyvinkää | 0 | 2 | 289 | Osittainen |
| Hämeenkyrö | 0 | 0 | 3 | Osittainen |
| Hämeenlinna | 0 | 0 | 126 | Osittainen |
| Ii | 0 | 0 | 16 | Osittainen |
| Iisalmi | 0 | 0 | 45 | Osittainen |
| Iitti | 0 | 0 | 34 | Osittainen |
| Ikaalinen | 0 | 0 | 10 | Osittainen |
| Ilmajoki | 0 | 0 | 3 | Osittainen |
| Ilomantsi | 0 | 0 | 16 | Osittainen |
| Imatra | 0 | 0 | 82 | Osittainen |
| Inari | 0 | 0 | 141 | Osittainen |
| Inkoo | 0 | 0 | 19 | Osittainen |
| Isojoki | 0 | 0 | 4 | Osittainen |
| Isokyrö | 0 | 0 | 10 | Osittainen |
| Janakkala | 0 | 0 | 54 | Osittainen |
| Joensuu | 0 | 0 | 174 | Osittainen |
| Jokioinen | 0 | 0 | 3 | Osittainen |
| Jomala | 0 | 0 | 27 | Osittainen |
| Joroinen | 0 | 0 | 14 | Osittainen |
| Joutsa | 0 | 0 | 21 | Osittainen |
| Juuka | 0 | 0 | 28 | Osittainen |
| Juupajoki | 0 | 0 | 2 | Osittainen |
| Juva | 0 | 0 | 23 | Osittainen |
| Jyväskylä | 0 | 0 | 395 | Osittainen |
| Jämijärvi | 0 | 0 | 7 | Osittainen |
| Jämsä | 0 | 0 | 35 | Osittainen |
| Järvenpää | 0 | 13 | 49 | Osittainen |
| Kaarina | 0 | 0 | 51 | Osittainen |
| Kaavi | 0 | 0 | 4 | Osittainen |
| Kajaani | 0 | 1 | 38 | Osittainen |
| Kalajoki | 0 | 0 | 18 | Osittainen |
| Kangasala | 0 | 2 | 68 | Osittainen |
| Kangasniemi | 0 | 0 | 17 | Osittainen |
| Kankaanpää | 0 | 0 | 3 | Osittainen |
| Kannonkoski | 0 | 0 | 0 | Ei poimittuja kohteita |
| Kannus | 0 | 0 | 4 | Osittainen |
| Karijoki | 0 | 0 | 0 | Ei poimittuja kohteita |
| Karkkila | 0 | 0 | 10 | Osittainen |
| Karstula | 0 | 0 | 2 | Osittainen |
| Karvia | 0 | 0 | 1 | Osittainen |
| Kaskinen | 0 | 0 | 0 | Ei poimittuja kohteita |
| Kauhajoki | 0 | 0 | 2 | Osittainen |
| Kauhava | 0 | 0 | 10 | Osittainen |
| Kauniainen | 0 | 2 | 33 | Osittainen |
| Kaustinen | 0 | 0 | 2 | Osittainen |
| Keitele | 0 | 0 | 9 | Osittainen |
| Kemi | 0 | 0 | 7 | Osittainen |
| Kemijärvi | 0 | 0 | 47 | Osittainen |
| Keminmaa | 0 | 0 | 42 | Osittainen |
| Kemiönsaari | 0 | 0 | 23 | Osittainen |
| Kempele | 0 | 0 | 18 | Osittainen |
| Kerava | 0 | 7 | 134 | Osittainen |
| Keuruu | 0 | 0 | 33 | Osittainen |
| Kihniö | 0 | 0 | 2 | Osittainen |
| Kinnula | 0 | 0 | 0 | Ei poimittuja kohteita |
| Kirkkonummi | 0 | 18 | 118 | Osittainen |
| Kitee | 0 | 0 | 14 | Osittainen |
| Kittilä | 0 | 0 | 80 | Osittainen |
| Kiuruvesi | 0 | 0 | 22 | Osittainen |
| Kivijärvi | 0 | 0 | 0 | Ei poimittuja kohteita |
| Kokemäki | 0 | 0 | 4 | Osittainen |
| Kokkola | 0 | 0 | 64 | Osittainen |
| Kolari | 0 | 1 | 92 | Osittainen |
| Konnevesi | 0 | 0 | 3 | Osittainen |
| Kontiolahti | 0 | 0 | 22 | Osittainen |
| Korsnäs | 0 | 0 | 1 | Osittainen |
| Koski Tl | 0 | 0 | 1 | Osittainen |
| Kotka | 0 | 0 | 88 | Osittainen |
| Kouvola | 0 | 2 | 488 | Osittainen |
| Kristiinankaupunki | 0 | 0 | 6 | Osittainen |
| Kruunupyy | 0 | 0 | 4 | Osittainen |
| Kuhmo | 0 | 0 | 67 | Osittainen |
| Kuhmoinen | 0 | 0 | 5 | Osittainen |
| Kumlinge | 0 | 0 | 0 | Ei poimittuja kohteita |
| Kuopio | 0 | 0 | 257 | Osittainen |
| Kuortane | 0 | 0 | 0 | Ei poimittuja kohteita |
| Kurikka | 0 | 0 | 18 | Osittainen |
| Kustavi | 0 | 0 | 15 | Osittainen |
| Kuusamo | 0 | 0 | 70 | Osittainen |
| Kyyjärvi | 0 | 0 | 6 | Osittainen |
| Kärkölä | 0 | 0 | 14 | Osittainen |
| Kärsämäki | 0 | 0 | 33 | Osittainen |
| Kökar | 0 | 0 | 4 | Osittainen |
| Lahti | 0 | 0 | 132 | Osittainen |
| Laihia | 0 | 0 | 1 | Osittainen |
| Laitila | 0 | 0 | 6 | Osittainen |
| Lapinjärvi | 0 | 0 | 4 | Osittainen |
| Lapinlahti | 0 | 0 | 19 | Osittainen |
| Lappajärvi | 0 | 0 | 5 | Osittainen |
| Lappeenranta | 0 | 0 | 108 | Osittainen |
| Lapua | 0 | 0 | 13 | Osittainen |
| Laukaa | 0 | 0 | 33 | Osittainen |
| Lemi | 0 | 0 | 11 | Osittainen |
| Lemland | 0 | 0 | 13 | Osittainen |
| Lempäälä | 0 | 3 | 35 | Osittainen |
| Leppävirta | 0 | 0 | 25 | Osittainen |
| Lestijärvi | 0 | 0 | 0 | Ei poimittuja kohteita |
| Lieksa | 0 | 0 | 66 | Osittainen |
| Lieto | 0 | 7 | 6 | Osittainen |
| Liminka | 0 | 0 | 13 | Osittainen |
| Liperi | 0 | 0 | 25 | Osittainen |
| Lohja | 0 | 1 | 66 | Osittainen |
| Loimaa | 0 | 0 | 13 | Osittainen |
| Loppi | 0 | 0 | 13 | Osittainen |
| Loviisa | 0 | 0 | 42 | Osittainen |
| Luhanka | 0 | 0 | 2 | Osittainen |
| Lumijoki | 0 | 0 | 0 | Ei poimittuja kohteita |
| Lumparland | 0 | 0 | 2 | Osittainen |
| Luoto | 0 | 0 | 0 | Ei poimittuja kohteita |
| Luumäki | 0 | 0 | 18 | Osittainen |
| Maalahti | 0 | 0 | 7 | Osittainen |
| Maarianhamina - Mariehamn | 0 | 0 | 50 | Osittainen |
| Marttila | 0 | 0 | 1 | Osittainen |
| Masku | 0 | 0 | 7 | Osittainen |
| Merijärvi | 0 | 0 | 0 | Ei poimittuja kohteita |
| Merikarvia | 0 | 0 | 0 | Ei poimittuja kohteita |
| Miehikkälä | 0 | 0 | 9 | Osittainen |
| Mikkeli | 0 | 0 | 117 | Osittainen |
| Muhos | 0 | 0 | 46 | Osittainen |
| Multia | 0 | 0 | 10 | Osittainen |
| Muonio | 0 | 0 | 52 | Osittainen |
| Mustasaari | 0 | 0 | 38 | Osittainen |
| Muurame | 0 | 0 | 19 | Osittainen |
| Mynämäki | 0 | 0 | 1 | Osittainen |
| Myrskylä | 0 | 0 | 5 | Osittainen |
| Mäntsälä | 0 | 3 | 28 | Osittainen |
| Mänttä-Vilppula | 0 | 0 | 19 | Osittainen |
| Mäntyharju | 0 | 0 | 51 | Osittainen |
| Naantali | 0 | 0 | 17 | Osittainen |
| Nakkila | 0 | 0 | 1 | Osittainen |
| Nivala | 0 | 0 | 26 | Osittainen |
| Nokia | 0 | 1 | 71 | Osittainen |
| Nousiainen | 0 | 0 | 6 | Osittainen |
| Nurmes | 0 | 0 | 65 | Osittainen |
| Nurmijärvi | 0 | 7 | 91 | Osittainen |
| Närpiö | 0 | 0 | 4 | Osittainen |
| Orimattila | 0 | 0 | 31 | Osittainen |
| Oripää | 0 | 0 | 1 | Osittainen |
| Orivesi | 0 | 0 | 31 | Osittainen |
| Oulainen | 0 | 2 | 5 | Osittainen |
| Oulu | 0 | 0 | 403 | Osittainen |
| Outokumpu | 0 | 0 | 15 | Osittainen |
| Padasjoki | 0 | 0 | 11 | Osittainen |
| Paimio | 0 | 0 | 7 | Osittainen |
| Paltamo | 0 | 0 | 29 | Osittainen |
| Parainen | 0 | 0 | 57 | Osittainen |
| Parikkala | 0 | 1 | 18 | Osittainen |
| Parkano | 0 | 0 | 5 | Osittainen |
| Pedersören kunta | 0 | 3 | 2 | Osittainen |
| Pelkosenniemi | 0 | 0 | 31 | Osittainen |
| Pello | 0 | 0 | 30 | Osittainen |
| Perho | 0 | 0 | 10 | Osittainen |
| Petäjävesi | 0 | 0 | 10 | Osittainen |
| Pieksämäki | 0 | 1 | 35 | Osittainen |
| Pielavesi | 0 | 0 | 0 | Ei poimittuja kohteita |
| Pietarsaari | 0 | 0 | 31 | Osittainen |
| Pihtipudas | 0 | 0 | 29 | Osittainen |
| Pirkkala | 0 | 1 | 60 | Osittainen |
| Polvijärvi | 0 | 0 | 1 | Osittainen |
| Pomarkku | 0 | 0 | 0 | Ei poimittuja kohteita |
| Pori | 0 | 0 | 72 | Osittainen |
| Pornainen | 0 | 0 | 1 | Osittainen |
| Porvoo | 0 | 1 | 51 | Osittainen |
| Posio | 0 | 0 | 27 | Osittainen |
| Pudasjärvi | 0 | 0 | 40 | Osittainen |
| Pukkila | 0 | 0 | 0 | Ei poimittuja kohteita |
| Punkalaidun | 0 | 0 | 2 | Osittainen |
| Puolanka | 0 | 0 | 21 | Osittainen |
| Puumala | 0 | 0 | 34 | Osittainen |
| Pyhtää | 0 | 0 | 16 | Osittainen |
| Pyhäjoki | 0 | 0 | 3 | Osittainen |
| Pyhäjärvi | 0 | 0 | 43 | Osittainen |
| Pyhäntä | 0 | 0 | 8 | Osittainen |
| Pyhäranta | 0 | 0 | 2 | Osittainen |
| Pälkäne | 0 | 0 | 7 | Osittainen |
| Pöytyä | 0 | 0 | 2 | Osittainen |
| Raahe | 0 | 0 | 36 | Osittainen |
| Raasepori | 0 | 0 | 71 | Osittainen |
| Raisio | 0 | 0 | 34 | Osittainen |
| Rantasalmi | 0 | 0 | 9 | Osittainen |
| Ranua | 0 | 0 | 20 | Osittainen |
| Rauma | 0 | 0 | 26 | Osittainen |
| Rautalampi | 0 | 0 | 25 | Osittainen |
| Rautavaara | 0 | 0 | 19 | Osittainen |
| Rautjärvi | 0 | 0 | 16 | Osittainen |
| Reisjärvi | 0 | 0 | 4 | Osittainen |
| Riihimäki | 0 | 0 | 62 | Osittainen |
| Ristijärvi | 0 | 0 | 11 | Osittainen |
| Rovaniemi | 0 | 0 | 233 | Osittainen |
| Ruokolahti | 0 | 0 | 9 | Osittainen |
| Ruovesi | 0 | 0 | 24 | Osittainen |
| Rusko | 0 | 0 | 5 | Osittainen |
| Rääkkylä | 0 | 0 | 49 | Osittainen |
| Saarijärvi | 0 | 0 | 21 | Osittainen |
| Salla | 0 | 0 | 30 | Osittainen |
| Salo | 0 | 0 | 94 | Osittainen |
| Saltvik | 0 | 0 | 2 | Osittainen |
| Sastamala | 0 | 0 | 34 | Osittainen |
| Sauvo | 0 | 0 | 2 | Osittainen |
| Savitaipale | 0 | 0 | 24 | Osittainen |
| Savonlinna | 0 | 0 | 85 | Osittainen |
| Savukoski | 0 | 0 | 23 | Osittainen |
| Seinäjoki | 0 | 0 | 98 | Osittainen |
| Sievi | 0 | 0 | 8 | Osittainen |
| Siikainen | 0 | 0 | 1 | Osittainen |
| Siikajoki | 0 | 0 | 19 | Osittainen |
| Siikalatva | 0 | 0 | 41 | Osittainen |
| Siilinjärvi | 0 | 0 | 56 | Osittainen |
| Simo | 0 | 0 | 5 | Osittainen |
| Sipoo | 0 | 5 | 51 | Osittainen |
| Siuntio | 0 | 1 | 6 | Osittainen |
| Sodankylä | 0 | 0 | 88 | Osittainen |
| Soini | 0 | 0 | 0 | Ei poimittuja kohteita |
| Somero | 0 | 0 | 5 | Osittainen |
| Sonkajärvi | 0 | 0 | 23 | Osittainen |
| Sotkamo | 0 | 0 | 72 | Osittainen |
| Sottunga | 0 | 0 | 0 | Ei poimittuja kohteita |
| Sulkava | 0 | 0 | 9 | Osittainen |
| Sund | 0 | 0 | 15 | Osittainen |
| Suomussalmi | 0 | 0 | 66 | Osittainen |
| Suonenjoki | 0 | 0 | 50 | Osittainen |
| Sysmä | 0 | 0 | 10 | Osittainen |
| Säkylä | 0 | 0 | 5 | Osittainen |
| Taipalsaari | 0 | 0 | 8 | Osittainen |
| Taivalkoski | 0 | 0 | 31 | Osittainen |
| Taivassalo | 0 | 0 | 0 | Ei poimittuja kohteita |
| Tammela | 0 | 0 | 18 | Osittainen |
| Tampere | 0 | 6 | 390 | Osittainen |
| Tervo | 0 | 0 | 1 | Osittainen |
| Tervola | 0 | 0 | 20 | Osittainen |
| Teuva | 0 | 0 | 0 | Ei poimittuja kohteita |
| Tohmajärvi | 0 | 0 | 4 | Osittainen |
| Toholampi | 0 | 0 | 0 | Ei poimittuja kohteita |
| Toivakka | 0 | 0 | 12 | Osittainen |
| Tornio | 0 | 0 | 29 | Osittainen |
| Turku | 0 | 0 | 1112 | Osittainen |
| Tuusniemi | 0 | 0 | 2 | Osittainen |
| Tuusula | 0 | 10 | 113 | Osittainen |
| Tyrnävä | 0 | 0 | 4 | Osittainen |
| Ulvila | 0 | 0 | 39 | Osittainen |
| Urjala | 0 | 0 | 3 | Osittainen |
| Utajärvi | 0 | 0 | 27 | Osittainen |
| Utsjoki | 0 | 0 | 56 | Osittainen |
| Uurainen | 0 | 0 | 1 | Osittainen |
| Uusikaarlepyy | 0 | 0 | 3 | Osittainen |
| Uusikaupunki | 0 | 0 | 24 | Osittainen |
| Vaala | 0 | 0 | 24 | Osittainen |
| Vaasa | 0 | 0 | 122 | Osittainen |
| Valkeakoski | 0 | 0 | 41 | Osittainen |
| Vantaa | 0 | 3 | 549 | Osittainen |
| Varkaus | 0 | 0 | 16 | Osittainen |
| Vehmaa | 0 | 0 | 2 | Osittainen |
| Vesanto | 0 | 0 | 2 | Osittainen |
| Vesilahti | 0 | 0 | 4 | Osittainen |
| Veteli | 0 | 0 | 2 | Osittainen |
| Vieremä | 0 | 0 | 9 | Osittainen |
| Vihti | 0 | 5 | 57 | Osittainen |
| Viitasaari | 0 | 0 | 31 | Osittainen |
| Vimpeli | 0 | 0 | 1 | Osittainen |
| Virolahti | 0 | 0 | 21 | Osittainen |
| Virrat | 0 | 0 | 14 | Osittainen |
| Vårdö | 0 | 0 | 6 | Osittainen |
| Vöyri | 0 | 0 | 7 | Osittainen |
| Ylitornio | 0 | 0 | 37 | Osittainen |
| Ylivieska | 0 | 1 | 50 | Osittainen |
| Ylöjärvi | 0 | 3 | 33 | Osittainen |
| Ypäjä | 0 | 0 | 0 | Ei poimittuja kohteita |
| Ähtäri | 0 | 0 | 52 | Osittainen |
| Äänekoski | 0 | 0 | 33 | Osittainen |