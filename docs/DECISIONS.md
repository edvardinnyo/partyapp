# Döntésnapló

A jóváhagyott és elutasított javaslatok, a megválaszolt nyitott kérdések (Q-lista) és az implementációs döntések.

---

## Jóváhagyott javaslatok

### D-001 — Kézi ízlésválasztás a streaming-szinkron alternatívájaként

- **Dátum:** 2026-10-06
- **Érintett:** F1, F6, Q4, Q5
- **Háttér:** A Spotify Web API Development Mode-ban legfeljebb 5 felhasználót enged; az Extended Quota Mode-hoz bejegyzett szervezet és legalább 250 000 havi aktív felhasználó kell. A kézi választás nem függ külső szolgáltatás felhasználói korlátjától.
- **Döntések:**
  1. A felhasználó streaming-szinkron helyett kézileg is megadhatja az ízlését. A kézi választás **végleges, teljes értékű funkció**, nem ideiglenes kerülőmegoldás.
  2. Több műfaj is választható, emellett kedvenc előadók és zenék is megadhatók. A top 3 műfajt az app számolja ki a kiválasztott műfajokból, előadókból és zenékből.
  3. Az előadók és zenék forrása az Apple Music API katalógusa. A katalógusban kereséshez nem kell felhasználói hitelesítés vagy Apple Music-előfizetés, csak a backenden tárolt developer token (Apple Developer Program-tagsággal).
  4. Az ízlés később módosítható: a **saját profil oldalon egy „Beállítások” menüpontban** (új felületi elem, kifejezetten jóváhagyva).
  5. Ha a felhasználó utólag streaming-fiókot is összeköt, a kézi és a streamingből számolt ízlés **fele-fele arányban keveredik**.
  6. Mennyiségi korlát: **legalább 3, legfeljebb 10 műfaj**. Az előadók és zenék megadása opcionális.
  7. A kedvenc előadók (kézi vagy streaming forrásból) **közvetlenül is számítanak az eseményajánlásban**, nemcsak a műfajok kiszámításában (Q5 részválasz).
  8. Az opcionális előadókból és zenékből **legfeljebb 20–20** adható meg.

### D-002 — Téma és nyelv: automatikus, kézi felülírással

- **Dátum:** 2026-10-13
- **Érintett:** Q22, D-001 (Beállítások)
- **Döntések:**
  1. **Téma:** alapból a telefon beállítását követi (sötét vagy világos). A Beállításokban kézzel is választható.
  2. **Nyelv:** magyar nyelvű telefonon magyar, minden más nyelvű telefonon angol. A Beállításokban kézzel is választható.
  3. A kezdetleges Figma-terv egyelőre **nem** kiindulási alap; a felület helykitöltő marad, amíg nincs végleges terv.

### D-003 — Expo Go a fejlesztés elején, development build később

- **Dátum:** 2026-10-13
- **Érintett:** CLAUDE.md 3.2 (development build), 1. fázis (EAS)
- **Döntés:** Egyelőre **Expo Go**-val fejlesztünk és tesztelünk, iOS-en és Androidon is. Az Apple Developer Program-tagság az első kiadáskor kerül szóba.
- **Következmények:**
  - Az EAS-profilok (development, preview, production) konfigurálva vannak, de buildet még nem futtatunk; az `expo-dev-client` csomag még nincs telepítve.
  - Ha egy funkcióhoz olyan natív modul kell, amely nincs az Expo Go-ban (pl. a natív Google-belépés gomb), előtte jelzem, és döntést kérek. Androidon a development build ingyenes.
  - Az Expo Go mindig csak a legfrissebb Expo SDK-t támogatja. Amikor az SDK 58 stabil lesz, frissíteni kell (külön `chore/` ágon), különben az Expo Go nem nyitja meg a projektet.

---

## Elutasított javaslatok

_Még nincs._

---

## Megválaszolt nyitott kérdések

### Q1 — Név és azonosítók

- **Megválaszolva (2026-10-13):** Az app neve (munkacím): **Nocturnal**. iOS bundle identifier és Android package name: **`hu.nocturnal.app`** (az első store-feltöltés után nem változtatható). Logó még nincs; addig az Expo alapértelmezett ikonja a helykitöltő.

### Q2 — Backend

- **Megválaszolva (2026-10-13):** **Supabase**, EU (Frankfurt) régióval.
- **Lekérdezési réteg:** **Drizzle ORM**, egy Supabase Edge Functionben futó API-ban (`PHASE0.md`, 2.1 fejezet). Az app az adatokat ezen az API-n keresztül éri el; közvetlenül csak a belépéshez (Auth), az élő üzenetek fogadásához (Realtime) és a képfeltöltéshez (Storage) kapcsolódik a Supabase-hez.

### Q5 — Ízlés-algoritmus (részben)

- **Megválaszolva (2026-10-06):** Az előadók is számítanak, és közvetlenül befolyásolják az eseményajánlást (pl. a kedvenc előadó koncertje).
- **Még nyitott:** az „utóbbi idő” időablaka; a playlistek vagy a hallgatási előzmények számítsanak-e erősebben; az ízlésprofil frissítési gyakorisága.

### Q6 — Távolság (részben)

- **Megválaszolva (2026-10-06):** A keresési távolságot a felhasználó a **térképen egy csúszkával (slider)** állítja be (új felületi elem, kifejezetten jóváhagyva). A távolság a felhasználó aktuális pozíciójától számít, **legfeljebb 200 km**.
- **Csúszka értékei:** alapérték **25 km**, minimum **1 km**, maximum **200 km**, lépésköz **1 km**.
- A beállított távolság minden ajánlásra érvényes (Home rács és térkép is), az F1 szerint.

### Q21 — Navbar

- **Megválaszolva (2026-10-13):** Sorrend: balra a **csevegőtér**, középen a **Home**, jobbra a **profilkereső**. A belépés, regisztráció és szinkron képernyőkön **nincs navbar**, csak belépés után. Az első verzióra érvényes, később módosulhat.

### Q22 — Arculat és nyelv

- **Megválaszolva (2026-10-13):** Sötét és világos mód is lesz. A felület kétnyelvű (magyar és angol), elsősorban magyar. A részletek: D-002. Van egy kezdetleges Figma-terv, de egyelőre nem kiindulási alap. Logó és végleges arculat még nincs.

---

## Folyamat

### P-001 — A `main` ág védelme

- **Dátum:** 2026-10-13
- A repón ketten dolgoznak. A `main` ágra csak pull requesttel lehet bekerülni, **1 jóváhagyással**; a force push és az ág törlése tiltott, az adminokra is érvényes.
- A beállítást a repó adminja végzi a GitHubon (Settings → Rules → Rulesets), mert a GitHub CLI nincs telepítve, és a repó egy másik fiókhoz tartozik.
- A kötelező CI-ellenőrzés (typecheck, lint, tesztek) az 1. fázis CI-jának elkészülte után kerül a szabályba.

---

## Implementációs döntések

_Még nincs._
