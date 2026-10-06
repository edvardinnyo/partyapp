# Claude Code feladatleírás — zenei ízlés alapú esemény- és közösségi mobilapp

**Munkacím:** `[APP_NÉV]` (lásd Q1)

> **Kezdő utasítás Claude Code-nak:** Olvasd végig ezt a dokumentumot teljes egészében, mielőtt bármit csinálsz. Az első lépésed **nem** kódírás, hanem a 9. fejezet 0. fázisa: tisztázó kérdések és architektúra-javaslat. Kódot csak a jóváhagyásom után írsz.
>
> A dokumentum végén (Függelék A) szó szerint szerepel a megrendelő eredeti koncepciója. Ha a feldolgozott fejezetek és a Függelék között eltérést látsz, **a Függelék az irányadó**, és kérdezz.

---

## 1. Alapszabályok — ezek mindennél előrébb valók

1. **Hatókör-zár.** Csak azt építed meg, ami a 4. fejezetben (és a Függelékben) szerepel. Nem adsz hozzá új funkciót, képernyőt, menüpontot, gombot, beállítást, értesítést (push sem), gamifikációt vagy viselkedést — akkor sem, ha szerinted hasznos lenne.
2. **Az eredeti koncepciót nem módosítod.** Nem egyszerűsítesz, nem vonsz össze képernyőket, nem nevezel át menüpontokat, nem változtatsz a navbar felépítésén vagy a képernyők elrendezésén. Ha a leírás és egy technikai korlát ütközik, nem „oldod meg csendben” — jelzed, és kérdezel.
3. **Ha valami nem egyértelmű: kérdezz, ne találgass.** A 8. fejezet nyitott kérdéseire az érintett rész megkezdése előtt választ kell kapnod. Ha munka közben új kérdés merül fel, gyűjtsd össze, és tedd fel egyben; addig azon a részen ne haladj tovább (más, nem érintett részen igen).
4. **Ötletelni szabad, és kifejezetten kérem — de csak javaslatként.** Minden ötletet külön jelölj, így:
   > 💡 **Javaslat (jóváhagyásra vár):** mi · miért · mekkora munka · milyen kockázat

   Javaslatot csak az én kifejezett „jóváhagyom” válaszom után valósítasz meg. A jóváhagyott és elutasított javaslatokat vezesd a `docs/DECISIONS.md` fájlban.
5. **Termékdöntés vs. implementációs részlet.**
   - *Implementációs részlet* — dönthetsz, de dokumentáld a `docs/DECISIONS.md`-ben: mappaszerkezet, komponensbontás, belső elnevezések, segédkönyvtár a jóváhagyott stacken belül, tesztek felépítése.
   - *Termékdöntés* — mindig kérdezz: bármi, amit a felhasználó lát vagy tapasztal; adatkezelés és adatvédelem; külső vagy fizetős szolgáltatás bevezetése; a backend kiválasztása.
6. **Platform- és jogi követelmények.** Ha az App Store, a Google Play vagy a GDPR olyan elemet követel meg, ami nincs a koncepcióban (pl. fióktörlés, tartalom jelentése, letiltás), ne építsd be magadtól: jelezd, magyarázd el, miért kell, és várd a döntésemet (lásd Q23).
7. **Titkok.** API-kulcs, client secret, token soha nem kerül a repóba. Használj `.env`-et, `app.config.ts`-t és EAS Secrets-et; a kulcsneveket egy `.env.example` fájl sorolja fel.

---

## 2. A termék röviden

**Probléma:** az emberek hétvégén, szabadidejükben szívesen szórakoznak, de nehéz eltalálni, melyik hely lesz számukra megfelelő. Gyakori probléma az is, hogy egy buliban, koncerten megismerünk vagy meglátunk valakit, aki szimpatikus, és utólag Facebook-csoportokban vagy Instagramon próbáljuk megtalálni.

**Megoldás:** mobilalkalmazás, amely
- a felhasználó zenei ízlése (összekötött streaming szolgáltatás) alapján ajánl eseményeket — klubokat, bárokat, koncerteket, fesztiválokat — a felhasználó által megadott távolságon belül, és térképen is megmutatja őket;
- az éppen zajló eseményekhez csevegőteret ad, ahol a már ott lévők valós idejű képeket oszthatnak meg bentről a hangulatról, atmoszféráról;
- az események lezárása után teret ad a „keresek egy embert” bejegyzéseknek;
- profil- és követési rendszerrel köti össze a felhasználókat.

---

## 3. Technológiai keretek

### 3.1 Rögzített (nem változtatható)

| Terület | Választás |
|---|---|
| Verziókezelés | GitHub |
| Keretrendszer | React Native |
| Nyelv | TypeScript (`strict: true`, `any` kerülendő) |
| Folyamatos tesztelés és kiadás | Expo (EAS Build, EAS Submit, EAS Update) |
| Platformok | iOS és Android, egyenrangú támogatással — minden funkciót mindkettőn tesztelni kell |

### 3.2 Javasolt, de a 0. fázisban jóvá kell hagyatni

- **Expo SDK:** a legfrissebb stabil verzió (munkakezdéskor ellenőrizd az expo.dev-en). Mivel natív modulok kellenek (térkép, kamera, streaming-hitelesítés), **development buildet** (`expo-dev-client`) használj, ne csak Expo Go-t.
- **Navigáció:** Expo Router.
- **Backend (Q2):** a koncepció nem rögzíti. Szükséges képességek: hitelesítés (email + Google), adatbázis térbeli lekérdezéssel (távolság szerinti szűrés), valós idejű csevegés, képtárolás, időzített feladatok (esemény-lezárás). Készíts összehasonlítást legalább ezekről: Supabase (Postgres + PostGIS, Realtime, Storage, Auth), Firebase (Firestore + geohash, Storage, Auth), saját Node.js backend. Ajánlj egyet indoklással és költségbecsléssel — és várd a döntésemet.
- **Kliensoldali adatkezelés:** pl. TanStack Query (szerveradat) + egy könnyű store (pl. Zustand) a kliensállapotra.
- **Térkép:** `react-native-maps` (iOS: Apple Maps, Android: Google Maps) vagy Mapbox — hasonlítsd össze.
- **Animáció (profil „neuron” effekt):** `react-native-reanimated` + `react-native-svg` vagy Skia.
- **Biztonságos tokentárolás:** `expo-secure-store`.
- **Tesztelés:** Jest + React Native Testing Library. Az üzleti logikára (ízlés-algoritmus, távolságszűrés, esemény-életciklus) egységtesztek kötelezők.

---

## 4. Funkcionális specifikáció

A számozás az eredeti koncepcióét követi (F1–F7). Minden funkciónál: **Eredeti leírás** (a koncepció hű összefoglalása), **Elfogadási feltételek** (ezeket fogom ellenőrizni), **Nyitott kérdések** (hivatkozás a 8. fejezetre).

### F1 — Zenei ízlés és eseményajánlás

**Eredeti leírás:** A streaming alkalmazással (pl. Spotify) összekötve az app a felhasználó playlistjeiből vagy az utóbbi időben leghallgatottabb stílusaiból („On Repeat” vagy havi rendszeresség) egy algoritmussal meghatározza a 3 legkedveltebb műfaját (és előadóját), és ezek alapján ajánl eseményeket (klubok, bárok, koncertek, fesztiválok) **a felhasználó által megadott távolságon belül**.

**Elfogadási feltételek:**
- Összekötött fiók után kiszámolódik és eltárolódik a felhasználó 3 legkedveltebb műfaja (Q5 döntése szerint az előadói is).
- Ajánlott esemény csak a felhasználó által megadott távolságon belül lehet, az aktuális pozícióhoz mérve.
- Az ajánlás a műfajok (és Q5 szerint az előadók) egyezésén alapul.
- Az algoritmus determinisztikus, egységtesztelt, a súlyozása egy helyen konfigurálható.
- Hiányos streaming-adatnál (pl. egy előadónak nincs műfaja) az app nem omlik össze, hanem kezeli a helyzetet.

**Algoritmus — kiinduló terv (a 0. fázisban véglegesítendő):**
1. Adatgyűjtés (Spotify példáján): top előadók és top számok rövid távon (`short_term`, kb. az utolsó 4 hét — ez áll legközelebb a „havi rendszerességhez”) és közép távon; legutóbb lejátszott számok; a felhasználó saját playlistjeinek tartalma.
2. Az előadókhoz tartozó műfajok lekérése, gyorsítótárazással.
3. Műfajok pontozása (helyezés és forrás szerinti súlyozással), majd normalizálás egy közös műfaj-taxonómiára, amelyet az események is használnak (Q3, Q5).
4. Kimenet: top 3 műfaj (+ Q5 szerint top előadók), meghatározott frissítési gyakorisággal (Q5).

**Nyitott kérdések:** Q3, Q4, Q5, Q6

### F2 — Csevegőterek (éppen zajló események)

**Eredeti leírás:** Egy külön ablakban az éppen zajló, a felhasználónak ajánlott események csevegőterei találhatók. A térbe belépve lehet csevegni, képet megosztani egymással és „linkelni” emberekkel. Az eseményen legutóbb ott készült kép megjelenhet az esemény fejléceként. A cél, hogy a már ott lévő emberek valós idejű képeket készíthessenek bentről a hangulatról, atmoszféráról (a koncepció bevezetője ezt „belső partychat”-ként említi).

**Elfogadási feltételek:**
- A lista az éppen zajló és a felhasználónak ajánlott események csevegőtereit mutatja.
- Valós idejű üzenetküldés: az új üzenetek újratöltés nélkül jelennek meg, iOS-en és Androidon is.
- Képmegosztás a csevegőtérben.
- Az esemény fejléce a legutóbb ott megosztott kép.
- A kamerához/fotókhoz szükséges engedélykérések mindkét platformon helyes, érthető szöveggel jelennek meg.

**Nyitott kérdések:** Q9, Q10, Q11, Q12

### F3 — Lezárt események: „Keresek egy embert”

**Eredeti leírás:** Az F2-ben említett események lezárása után az esemény átkerül egy másik menüpontba. Itt a „keresek egy embert” problémára adunk megoldást: a felhasználók bejegyzést tehetnek ki az adott eseményhez, erre mások reagálhatnak, segíthetnek — így emberi kapcsolatok alakulhatnak ki.

**Elfogadási feltételek:**
- Lezáráskor az esemény automatikusan átkerül ebbe a menüpontba (Q12 szabálya szerint).
- Bejegyzés létrehozható egy adott lezárt eseményhez.
- Mások reagálhatnak a bejegyzésre (Q14 szerint).
- A bejegyzések eseményenként böngészhetők.

**Nyitott kérdések:** Q12, Q13, Q14

### F4 — Profilrendszer, profilkereső, hírfolyam, beszélgetések

**Eredeti leírás:**
- Minden felhasználónak van személyes tere (profilja). A profilokra név alapján lehet rákeresni egy külön menüpontban; a profilok megtekinthetők, a felhasználók követhetik egymást.
- **Profilkereső képernyő:** a keresőmező a kijelző tetején; alatta görgethető tér, ahol a követett emberek bejegyzései láthatók. A kereső melletti menüpontban érhetők el a barátokkal folytatott beszélgetések.
- **Profil képernyő** (külön ablak, **navbar nélkül**):
  - a profilkép (pozíciója: Q18); a profilkép körül a 3 leghallgatottabb stílus „neuronként” kötődik a profilképhez, lebegő animációval;
  - a profilkép alatt 3 külön mezőben: a **legtöbbet látogatott** hely, a **legjobban értékelt** hely, a **legutóbb meglátogatott** hely;
  - alatta kicsivel: **követők száma**, **követettek száma**;
  - más felhasználó profilján ugyanezek láthatók, plusz egy **Követés** gomb, amely **Kikövetés**-re vált, ha már követed;
  - legalul görgethető rész a felhasználó saját bejegyzéseivel.

**Elfogadási feltételek:**
- Név szerinti keresés a felhasználók között (részleges egyezéssel is).
- Követés/kikövetés azonnal frissíti a gombot és a számlálókat.
- A hírfolyam csak a követett felhasználók bejegyzéseit mutatja, görgethetően (lapozással).
- A „neuron” animáció folyamatos és mindkét platformon gördülékeny (60 fps cél), nem akadályozza a görgetést.
- A saját és a más profil ugyanazt a képernyő-felépítést követi; csak a Követés/Kikövetés gomb tér el.
- A barátokkal folytatott beszélgetések valós idejűek.

**Nyitott kérdések:** Q15, Q16, Q17, Q18

### F5 — Home screen és térkép

**Eredeti leírás:**
- Ez a képernyő jelenik meg először a profil elkészítése után, illetve meglévő profillal belépve.
- A felső részen (pl. középen) a felhasználó profilképe, amelyre koppintva megnyílik a profil.
- A profil alatt görgethető rácsos szerkezet (grid) az aktuális, a felhasználónak ajánlott eseményekkel.
- A felső szekcióban található a térkép ikon, ami megnyitja a térképet a jelenlegi pozícióddal. A térképen az összes esemény látható, a neked ajánlottak külön színnel jelölve; láthatod a barátaidat is (Q19).

**Elfogadási feltételek:**
- Belépés után mindig a Home az első képernyő.
- A rács az F1 szerinti ajánlásokat mutatja.
- A térkép a felhasználó pozíciójára áll (helyengedély után); megtagadott engedély esetén is használható marad, érthető üzenettel.
- Az ajánlott események jelölője más színű, mint a többi eseményé.

**Nyitott kérdések:** Q7, Q8, Q19

### F6 — Kezdőképernyő: regisztráció/belépés és szinkronizálás

**Eredeti leírás:** Az app letöltése után ez a legelső képernyő. A felhasználó emaillel, Google-fiókkal (pl.) létrehoz egy profilt, amelyet ezután szinkronizálhat streaming alkalmazásokkal (Spotify, Apple Music, YouTube Music stb.).

**Elfogadási feltételek:**
- Regisztráció és belépés emaillel és Google-fiókkal, iOS-en és Androidon.
- A munkamenet megmarad az app újraindítása után; a kijelentkezés működik.
- Streaming-összekötés OAuth-tal (Spotify: Authorization Code + PKCE), a tokenek biztonságos tárolása és frissítése.
- Sikeres belépés után a Home jelenik meg (F5).

**Nyitott kérdések:** Q4, Q20

### F7 — Navbar

**Eredeti leírás:** Minden ablak alján — a megnyitott profil kivételével — navbar található, amely az alkalmazás fő ablakai között navigál. 3 részből áll: középen a Home, mellette a csevegőtér és a profilkereső.

**Elfogadási feltételek:**
- Pontosan 3 elem, a Home középen.
- A megnyitott profilon (sajáton és máséén is) nincs navbar.
- Minden más képernyőn látható. Ha ez egy képernyőn technikailag problémás (pl. billentyűzet a csevegőben), kérdezz, ne dönts helyettem.

**Nyitott kérdések:** Q21

---

## 5. Navigációs térkép (a koncepció alapján)

```
Indítás
├─ Nincs bejelentkezve → [F6] Regisztráció / Belépés → Streaming-szinkron → Home
└─ Be van jelentkezve  → Home

Fő nézet — navbar (F7):  [ Csevegőtér ]  [ Home ]  [ Profilkereső ]
                         (a két oldalsó elem sorrendje: Q21)
├─ Home (F5)
│   ├─ Profilkép  → Saját profil (F4, navbar nélkül)
│   ├─ Térkép ikon → Térkép (F5)
│   └─ Eseményrács → ? (Q8)
├─ Csevegőtér (F2)
│   └─ Éppen zajló, ajánlott események listája → Esemény csevegőtere
└─ Profilkereső (F4)
    ├─ Keresőmező (fent) → találatok → Más profil (navbar nélkül; Követés/Kikövetés)
    ├─ Kereső melletti menüpont → Beszélgetések a barátokkal → Beszélgetés
    └─ Követettek bejegyzései (görgethető)

Lezárt események / „Keresek egy embert” (F3) — a helye a navigációban nyitott kérdés (Q13)
```

---

## 6. Adatmodell — kiinduló vázlat

Csak a leírt funkciókhoz szükséges entitások. A 0. fázisban, a backend kiválasztásával együtt véglegesítendő.

| Entitás | Fő mezők | Megjegyzés |
|---|---|---|
| `User` | id, név, profilkép, email, létrehozva | regisztrációs mezők: Q20 |
| `StreamingConnection` | userId, provider (`spotify` \| `apple_music` \| `youtube_music`), tokenek, utolsó szinkron | tokenek biztonságosan; Q4 |
| `TasteProfile` | userId, top 3 műfaj pontszámmal, (top előadók), számítás ideje | Q5 |
| `UserSettings` | userId, keresési távolság (km) | Q6 |
| `Venue` | id, név, típus (klub / bár / koncerthelyszín / fesztivál), koordináták, cím | Q3 |
| `Event` | id, venueId, cím, kezdés, zárás, műfajcímkék, (előadók), státusz (közelgő / éppen zajló / lezárt), fejléckép | Q3, Q12 |
| `ChatMessage` | id, eventId, userId, szöveg, kép, hivatkozott felhasználók, időbélyeg | Q10, Q11 |
| `LookingForPost` | id, eventId, userId, tartalom, időbélyeg | „keresek egy embert”; Q14 |
| `LookingForReply` | id, postId, userId, tartalom | Q14 |
| `Post` | profil-bejegyzés | lehet, hogy azonos a `LookingForPost`-tal — Q15 |
| `Follow` | followerId, followeeId, időbélyeg | |
| `Conversation`, `DirectMessage` | résztvevők, üzenetek | Q16 |
| `Visit` | userId, venueId / eventId, időpont, forrás | Q17 |
| `Rating` | userId, venueId, érték | Q17 |

Barátok helyének megjelenítése a térképen: csak Q19 döntése után kerül be bármilyen adat.

---

## 7. Külső szolgáltatások — ismert korlátok

Állapot: 2026. október. **Munkakezdéskor ellenőrizd újra a hivatalos dokumentációban**, és ha változott, jelezd.

### Spotify Web API
- **Felhasználói korlát:** Development Mode-ban legfeljebb 5 hitelesített felhasználó használhatja az appot, és az app tulajdonosának aktív Premium-előfizetés kell. Az Extended Quota Mode-ot 2025. május 15. óta csak bejegyzett szervezetek kérhetik, és az egyik feltétel a legalább 250 000 havi aktív felhasználó. **→ Nyilvános indulás előtt ez blokkoló kockázat; a 0. fázisban jelezd, és kérj döntést (Q4).**
- Development Mode-ban is elérhető: `GET /me/top/{type}` (top előadók/számok időablakkal), `GET /me/player/recently-played`, `GET /me/playlists`, `GET /artists/{id}`.
- A playlistek tartalma (`items`) csak a felhasználó saját vagy közös playlistjeinél érhető el. A Spotify által generált listák (pl. „On Repeat”) tartalma így nem olvasható ki → az „On Repeat / havi rendszeresség” logikát a `short_term` top elemekkel kell közelíteni.
- A tömeges lekérő végpontok (pl. `GET /artists?ids=…`) Development Mode-ban megszűntek → előadónként egyenként kell lekérni, gyorsítótárazással, a rate limitre figyelve.
- Az előadó `popularity` és `followers` mezője Development Mode-ban nem érhető el. A `genres` mező megvan, de sok előadónál üres lehet — kezelendő.
- Hitelesítés: Authorization Code + PKCE (az implicit grant elavult).
- Élesítés előtt a Spotify Developer Terms és Developer Policy szerinti megfelelést ellenőrizni kell.

### Apple Music
- Apple Music API / MusicKit: fizetős Apple Developer Program-tagság kell. iOS-en natív MusicKit, Androidon a MusicKit for Android könyvtár; natív modult igényel (development build, config plugin). A pontos végpontokat (pl. legutóbb lejátszott, „heavy rotation”, műfajnevek) a 0. fázisban ellenőrizd.

### YouTube Music
- Nincs hivatalos, nyilvános API a hallgatási előzményekhez. A létező könyvtárak nem hivatalosak (a webes kliens kéréseit utánozzák a felhasználó cookie-adataival) — ez felhasználási feltételekkel kapcsolatos és stabilitási kockázat. **Ne építs rá a jóváhagyásom nélkül (Q4).**

### Expo
- Az Expo SDK 56 2026 májusában jelent meg (React Native 0.85, React 19.2). Munkakezdéskor nézd meg, van-e újabb stabil verzió.

---

## 8. Nyitott kérdések (Q-lista)

Ezekre az érintett rész megkezdése előtt választ kell kapnod. A már megválaszolt kérdéseket a válasszal együtt vezesd át a `docs/DECISIONS.md`-be.

### Általános
- **Q1 — Név és azonosítók:** Mi az app neve, iOS bundle identifier, Android package name? Van-e ikon/logó?
- **Q2 — Backend:** melyik backend legyen (a 0. fázis összehasonlítása alapján)?
- **Q3 — Esemény- és helyszínadatok forrása:** honnan kerülnek az appba az események és helyszínek (szervezők töltik fel? külső API? kézi feltöltés?), milyen adatokkal (kezdés, zárás, koordináták, műfajcímkék, előadók)? Hogyan kap egy esemény olyan műfajt, ami összevethető a felhasználó ízlésével? Melyik városban/régióban indulunk? *Blokkolja: F1, F2, F3, F5.*
- **Q4 — Streaming szolgáltatások az első verzióban:** csak Spotify, vagy Apple Music is? YouTube Music (nem hivatalos API)? Mi a terv a Spotify 5 felhasználós korlátjával? Kötelező-e a szinkronizálás, vagy átugorható? *Blokkolja: F1, F6.*
- **Q5 — Ízlés-algoritmus:** csak műfaj, vagy a „(előadóját)” is számít (pl. koncertajánlásnál)? Milyen időablak az „utóbbi idő”? A playlistek vagy a hallgatási előzmények számítsanak-e erősebben? Milyen gyakran frissüljön az ízlésprofil? *Blokkolja: F1.*
- **Q6 — Távolság:** hol és hogyan adja meg a felhasználó (regisztrációkor? később?), mi az alapérték és a tartomány? *Blokkolja: F1.*

### Home és térkép (F5)
- **Q7 — Rács tartalma:** az „aktuális” ajánlott események csak az éppen zajlók, vagy a közelgők is (ma este, hétvégén)? Milyen sorrendben?
- **Q8 — Eseményre koppintás:** mi nyílik meg, ha a felhasználó egy eseményre koppint a rácsban vagy a térképen? Milyen adatok látszanak az eseményről?
- **Q19 — Barátok a térképen:** része-e az első verziónak? Ha igen: önkéntes (opt-in) helymegosztás? Valós idejű vagy utolsó ismert hely? Kik láthatják?

### Csevegőterek (F2)
- **Q9 — Hozzáférés:** csak a fizikailag ott lévők léphetnek be / oszthatnak meg képet (helyalapú ellenőrzés)? Beléphet-e valaki egy nem neki ajánlott esemény csevegőterébe (pl. a térképről)?
- **Q10 — „Linkelni emberekkel”:** mit jelent pontosan? (@-említés? profil megosztása? követés közvetlenül a csevegőből?)
- **Q11 — Képek forrása:** csak az appon belüli kamerával készülhetnek, vagy galériából is feltölthetők?
- **Q12 — Esemény lezárása:** mikor számít egy esemény lezártnak (a zárási időpontkor? utána valamennyivel?), mi lesz a csevegőtér tartalmával lezárás után (olvasható archívum? törlődik?), és meddig marad az esemény a „keresek egy embert” részben?

### Lezárt események (F3)
- **Q13 — Hely a navigációban:** a navbar 3 elemű (Home, csevegőtér, profilkereső). Hol érhető el a lezárt események / „keresek egy embert” menüpont?
- **Q14 — Bejegyzések és reakciók:** mit tartalmazhat egy „keresek egy embert” bejegyzés (szöveg? kép?), és mit jelent a „reagálni” (hozzászólás? emoji-reakció? privát üzenet a posztolónak?)

### Profil (F4)
- **Q15 — Bejegyzések:** a profilon és a követettek hírfolyamában látható „bejegyzések” ugyanazok, mint a „keresek egy embert” bejegyzések, vagy külön, általános posztok? Ha külön: hol és hogyan hozza létre őket a felhasználó, mit tartalmazhatnak?
- **Q16 — Barátok:** ki számít „barátnak” a beszélgetések szempontjából — kölcsönös követés? Bárkinek lehet privát üzenetet küldeni?
- **Q17 — Látogatás és értékelés:** hogyan rögzítjük, hogy valaki „járt” egy helyen (csevegőtérbe lépés? helyalapú bejelentkezés? kézi jelölés?) Ki és hogyan értékel egy helyet — az értékelés felülete nincs leírva a koncepcióban. A „legjobban értékelt hely” a felhasználó saját legmagasabbra értékelt helye?
- **Q18 — Profil elrendezése:** az eredeti szövegből itt hiányzik egy szó („a kijelző … találod a profilképed”) — a profilkép a kijelző közepén vagy tetején legyen? Van-e vizuális referencia a „neuron” animációhoz? Csak a 3 műfaj kapcsolódik, vagy előadó is?

### Belépés (F6)
- **Q20 — Belépési módok és regisztrációs adatok:** email + Google. Az Apple App Store irányelvei (4.8) szerint ha van Google-belépés, általában kell egy egyenértékű, adatvédelmi feltételeknek megfelelő alternatíva is (tipikusan Sign in with Apple) — ellenőrizd az aktuális irányelvet. Felvegyük? Milyen adatokat kérünk regisztrációkor (név, felhasználónév, profilkép — melyik kötelező)?

### Navbar (F7)
- **Q21 — Sorrend és láthatóság:** melyik oldalon legyen a csevegőtér, melyiken a profilkereső? A regisztráció/belépés/szinkron képernyőkön is legyen navbar, vagy csak belépés után?

### Design és nyelv
- **Q22 — Arculat:** van-e meglévő arculat vagy Figma-terv (színek, betűtípus, logó, sötét/világos mód)? Milyen nyelvű a felület (csak magyar, vagy többnyelvű)?

### Platform- és jogi követelmények (beépítés csak jóváhagyással)
- **Q23 —** Az alábbiak a store-ba kerüléshez vagy jogilag szükségesek lehetnek, de nincsenek a koncepcióban:
  - (a) felhasználói tartalom moderálása: tartalom jelentése, felhasználó letiltása, szűrés (App Store 1.2, Google Play felhasználói tartalomra vonatkozó szabályai);
  - (b) fiók törlése az appon belül (App Store 5.1.1(v));
  - (c) korhatár: bárok, klubok, alkohol miatt kell-e 18+ ellenőrzés;
  - (d) GDPR: adatvédelmi tájékoztató, hozzájárulás a helyadatok és képek kezeléséhez, adattárolás helye (EU).

---

## 9. Munkamenet és fázisok

### 0. fázis — Felderítés (kód nélkül)
1. Olvasd el a teljes dokumentumot és a Függeléket.
2. Tedd fel a 8. fejezet még nyitott kérdéseit csoportosítva, és ha a leírásban bármi mást félreérthetőnek látsz, azt is.
3. Készíts architektúra-javaslatot: backend-összehasonlítás és ajánlás (Q2), könyvtárlista, mappaszerkezet, véglegesített adatmodell (6. fejezet), az ízlés-algoritmus és az esemény-életciklus terve.
4. Az ötleteidet az 1. fejezet 4. szabálya szerinti formában, külön blokkban.
5. Várd meg a jóváhagyásomat.

### 1. fázis — Projektváz
- Expo + TypeScript (strict), Expo Router, ESLint + Prettier, path aliasok, környezeti változók kezelése (`.env.example`).
- Az 5. fejezet szerinti navigációs váz üres (placeholder) képernyőkkel és működő navbarral (F7).
- EAS-konfiguráció (`development`, `preview`, `production` profil), development build iOS-re és Androidra.
- GitHub Actions CI: typecheck, lint, tesztek minden PR-ra.
- `README.md` (indítás, build, környezeti változók) és `docs/DECISIONS.md`.

### További fázisok
| Fázis | Tartalom |
|---|---|
| 2. | F6 — regisztráció, belépés, profil létrehozása |
| 3. | F6 + F1 — streaming-szinkron, ízlésprofil számítása |
| 4. | F1 + F5 — események, ajánlás, Home rács, térkép |
| 5. | F2 — csevegőterek, képmegosztás, fejléckép |
| 6. | F3 — lezárt események, „keresek egy embert” |
| 7. | F4 — profil, „neuron” animáció, kereső, követés, hírfolyam, beszélgetések |
| 8. | Stabilizálás — hibajavítás, teljesítmény, tesztelés mindkét platformon, store-előkészítés (csak a Q23-ban jóváhagyott elemekkel) |

### Minden fázis végén
- Rövid összefoglaló: mi készült el, mi nem, és miért.
- Tesztelési útmutató: melyik build, milyen lépésekkel ellenőrizzem iOS-en és Androidon.
- Új nyitott kérdések és javaslatok, külön jelölve.
- Pull Request a `main` ágra. A következő fázist csak a jóváhagyásom után kezded.

---

## 10. Git és kódminőség

- A `main` védett ág; minden munka külön ágon: `feature/f2-event-chat`, `fix/…`, `chore/…`.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`), kicsi, logikailag egységes commitok.
- A PR-leírásban: melyik F-pontot és Q-t érinti, képernyőképek mindkét platformról, tesztelési lépések.
- A kódban angol elnevezések; a felületi szövegek egy helyen gyűjtve (Q22 nyelvi döntése szerint).
- Engedélykérések (helyadat, kamera, fotók) szövegei az app-konfigurációban; az engedélyt akkor kérd, amikor a funkció először kell. Háttérbeli helyadatot csak Q19 jóváhagyása után kérhetsz.
- Nincs hardkódolt kulcs, és érzékeny adat nem kerül naplóba.

---

## Függelék A — Az eredeti koncepció (szó szerint, változtatás nélkül)

> Van egy applikáció koncepciónk amit megakarunk valósítani. Az applikáció egy valós életbeni problémára nyújtana megoldást, az emberek hétvégente vagy a szabadidejükben szeretnek szórakozni de nehéz eltalálni számukra melyik hely lehet a megfelelő. Az app segítene nekik megtalálni a helyeket egy térkép alapján, illetve a zenei ízlésük alapján ajánlana helyeket elsőkörben. Azt hogy a bulira, koncertre, bárba akárhova elmenjenek a már ottlévő emberek tudnak valós idejű képeket készíteni bentről, a hangulatról, atmoszféráról és esetleg lenne belső partychat. Illetve gyakori probléma hogy ott megismerünk vagy látunk embereket akik szimpatikusak és gyakran látjuk hogy akár facebook csoportokba vagy instagrammon keresik az emberek egymást, itt is tudnánk segíteni. Az app funkciói:
>
> 1.: Streaming alkalmazással (spotify)  összekötve az alkalmazásból a felhasználó playlistjeiből vagy az utóbbi időben leghalgatottab stilusaibol (on repeat vagy havi rendszeresség) egy algoritmussal meghatározza a 3 legkedveltebb műfaját, (előadóját) és ezek alapján ajánl eseményeket (klubbok,bárok,koncertek,fesztiválok). A felhasználó által megadott távon belül!
>
> 2.:  egy másik ablakban azz éppen zajló, neked ajánlott események csevegőterei találhatóak, a térbe belépve lehet csevegni valamint képet megosztani egymással és linkelni emberekkel , egy aktuális legutóbbi ott készített kép megjelenhet az esemény fejléceként.
>
> 3.: Az előbbi pontban említett események lezárása után, az esemény átkerül egy másik menüpontba ahol a fent definiált "keresek egy embert" problémára tudunk megoldást nyujtani azzal a felhasználók rakhatnak ki bejegyzést az adott eseményhez, erre tudnak mások reagálni, segíteni, ezzel is kialakítva emberi kapcsolatokat.
>
> 4.: Profil rendszer: Minden felhasználónak van egy személyes tere, a profilokra rákereshetnek névvel egy külön menüpontban, megtekinthetik, követhetik a felhasználók egymás profilját. Ebben a menüpontban a keresőmező a kijelző tetején jelenne meg, alatta egy görgethető tér található ahol az általad követett emberek bejegyzéseit látod. A kereső mellet található menüpontban található a barátaiddal való beszélgetések rész. A profilodat megnyitva egy külön ablakban ahol a kijelző találod a profilképed, a profilkép körül a 3 leghalgatottabb stílus mint egy neuron kötődik a profiilképedhez animációval lebegve, láthatod a profilképed alatt 3 külünböző mezőbrn a legtöbbet látogatott helyed, a legjobban értékelt helyed és a helyet ahol legutóbb jártál. alatta kicsivel látod a követőszámod, azt hogy hány embert követsz. Más felhasznló profilján is ezeket látod plusz egy bekövetési gomb lehetőség, ami kikövetésre változik ha épp már követed. Ezek alatt lesz egy görgethető rész ahol a saját bejegyzéseidet tekintheted meg.
>
> 5.: Home screen: Ez a képernyő ami a profil elkészítése után vagy a meglévő profilba belépve először megjelenik. A home-ban a felső részen pl középen található a felhasználó profilképe ahol megnyithatja a profil szekciót. A profil alatt egy görgethető rácsos szerkezet (grid) található ahol az aktuális neked ajánlott események jelennek meg. A felső szekcióban található a térkép ikon is ami megnyitja a jelenleghi pozíciódat, a térképen látod az összes  eseményt, a neked ajánlottak külön szinnel lesznek jelölve, láthatod a barátaid akár stb.
>
> 6.: Sync screen and login/register: Ez a legelső képernyő ami megjelenik az app letöltése után, emaillel, google fiókkal pl. a felhasznláó készít egy profilt amit utána szinkronizálhat streaming alkalmazásokkal (Spotify, Apple Music, Youtube Music stb).
>
> 7.: Minden ablakon (kivéve a megnyitott profil) alján megtalálható egy navbar ami az egész alkalmazás főbb ablakai közt navigál. 3 részből áll, középen a home, mellete a csevegőtér és a profilkereső ablak.
>
> BuildStack: Az app Githubbal van verziókezelve, React Native a könyvtárszerkezetünk, TypeScript nyelven iródik és az Expo-t használjuk a folyamatos tesztelésre, kiadásra, A mobilalkalmazának kompatibilisnek kell lennie mind IOS-el, mind Androiddal egyaránt.
