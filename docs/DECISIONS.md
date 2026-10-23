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
- **Kiegészítés (2026-10-18, D-004 alapján):** egyelőre **mindkét platformon Expo Go** marad. A natív Google-gombhoz development build kellene, de nincs Android telefonunk a teszteléshez, és iPhone-ra Apple Developer-tagság nélkül nem készíthető.

### D-004 — Belépés és regisztráció (2. fázis)

- **Dátum:** 2026-10-18
- **Érintett:** F6, Q4, Q20, Q23
- **Döntések:**
  1. **E-mail és jelszó.** Az e-mail-címet a Supabase által küldött 6 jegyű kóddal kell megerősíteni; a jelszó-visszaállítás is kóddal történik.
  2. **Google-belépés:** a cél a natív gomb, de amíg nincs development build (Android telefon, illetve Apple Developer-tagság), **mindkét platformon a böngészős Google-belépés** működik. A natív változat később, development builddel készül el; a felhasználó ugyanazt a gombot látja.
  3. **Sign in with Apple** az iOS-kiadás előtt kerül működésbe. A gomb már most elkészül, **csak iOS-en** látszik, és addig koppintásra „Hamarosan elérhető” üzenetet mutat.
  4. Regisztrációkor kötelező a **megjelenített név** és a **felhasználónév**; a **profilkép opcionális**, alapértelmezettként semleges sziluettel, amíg nincs arculat. A profilkeresőben (F4) **mindkét név alapján** lehet keresni.
     - A felhasználónév szabályai: 3–20 karakter; kisbetű, szám, pont és aláhúzás; egyedi (kis- és nagybetűtől függetlenül); egyelőre nem módosítható.
  5. A Home előtt **kötelező megadni az ízlést**; jelenleg ez a kézi választást jelenti.
  6. **Beállítások:** a saját profilról nyílik, **navbar nélkül**, egyszerű felülettel és bal felső visszanyíllal a profilra. Tartalma: kijelentkezés, téma- és nyelvváltó (D-002), fióktörlés, az ízlés módosítása (D-001).
  7. Regisztrációkor kötelező **elfogadni az adatvédelmi tájékoztatót** (a végleges szövegig helykitöltővel). **Fióktörlés** a Beállításokban.
  8. **E-mail-küldés:** a teszteléshez a Supabase beépített szolgáltatása; a saját e-mail-szolgáltatóra később visszatérünk.
  9. **Meg nem erősített e-mail-cím:** nem lehet vele belépni; belépési kísérletkor az app a kód beírására visz, és új kód kérhető. A felhasználónév és a profil csak a megerősítés után jön létre. A meg nem erősített regisztrációt **7 nap után automatikusan töröljük**.
  10. **Minimális életkor: 18 év**, egyszerű „Elmúltam 18 éves” jelölőnégyzettel, születési dátum nélkül (Q23 c). A jogi megfelelést a kiadás előtt jogásszal ellenőrizni kell.

### D-005 — A 3. fázis hatóköre (részben)

- **Dátum:** 2026-10-20
- **Érintett:** F1, D-001, Q4, Q5
- **Döntések:**
  1. A kézi ízlésválasztásban **egyelőre csak műfajok** választhatók. Az előadók és zenék (Apple Music katalógus, D-001/3) az Apple Developer-tagság megvásárlása után kerülnek be.
  2. **A közös műfajlista (22 elem, 2026-10-20):** Techno, House, Drum & bass, Trance, Hardstyle, Bass/dubstep, EDM, Hip-hop/rap, R&B/soul, Pop, Rock, Metal, Punk, Indie/alternatív, Jazz, Funk/disco, Reggae/dancehall, Latin/reggaeton, Klasszikus, Folk/népzene, Mulatós, Retró (80-as, 90-es évek). Ugyanezt a listát használják majd az események is (Q3).
  3. **A Spotify-szinkron egyelőre elmarad** (2026-10-20). A 3. fázisban csak a kézi műfajválasztás és az ízlésprofil számítása készül el; más streaming-szolgáltatás sem kerül be (Q4).
  4. **Hallgatási előzményt nem tárolunk**, csak a kiszámolt ízlésprofilt (műfajok pontszámmal). Ez a későbbi streaming-szinkronra is érvényes.
  5. **A választás sorrendje számít**, és a képernyő ki is írja („Fontossági sorrend”): az 1. a „Leginkább kedvelt”, az utolsó a „Kevésbé kedvelt”; az első három a top 3.
  6. **A „Streaming-szinkron” képernyő megmarad** a beléptetésben, „Spotify összekötése – hamarosan” jelzéssel és a „Műfajok kiválasztása” gombbal.

### D-006 — Profil szerkesztése regisztráció után

- **Dátum:** 2026-10-20
- **Érintett:** F4, D-004
- **Döntés:** a saját profilon a profilképre vagy a névre koppintva megnyílik a **„Profil szerkesztése”** képernyő (az Instagraméhoz hasonlóan), navbar nélkül, visszanyíllal. Itt a **profilkép** módosítható vagy eltávolítható, és a **megjelenített név** is szerkeszthető. A felhasználónév nem módosítható (D-004).
- A lecserélt vagy eltávolított profilkép azonnal törlődik a tárhelyről.
- A 7. fázis (profil) előtt, külön kérésre készült el.

### D-007 — Események, ajánlás, Home-rács és térkép (4. fázis)

- **Dátum:** 2026-10-20
- **Érintett:** F1, F5, Q3, Q7, Q8, Q19, P-01, P-03
- **Döntések:**
  1. **Eseményforrás (Q3, P-03; 2026-10-23-án felülírta a D-008):** egyelőre a csapat tölti fel az eseményeket táblázatból (CSV), **Budapesttel** indulunk. A rendszer úgy épül, hogy később a partnercégek (jegyértékesítők) adatfolyamára **csak forrást kelljen váltani**: minden forrás ugyanabba az egységes formába alakítja az eseményeit, és ugyanazon az úton kerülnek az adatbázisba.
  2. **„Live” megjelenítés:** mindig a friss, éppen zajló és közelgő események látszanak; a Home és a térkép automatikusan frissül, és egy új vagy módosított esemény azonnal megjelenik.
  3. **Home-rács (Q7):** az ajánlott zajló és közelgő események, egyezés szerint rendezve, egyenlő egyezésnél a korábbi kezdés előre. **Kb. minden 6. esemény után egy teljes szélességű hirdetési banner**; egyelőre helykitöltő, a hirdetések forrása később külön döntés.
  4. **Eseményoldal (Q8):** helyszín, időpont, műfajok, fellépők, „Megnyitás a térképen”, valamint egy **„Jegyvásárlás”** gomb. Ez egyelőre „Hamarosan elérhető” üzenetet ad; a partnerségek után a partner jegyoldalára visz.
  5. **Barátok a térképen (Q19):** igen, a javaslat szerint, **a 7. fázisban** (követési rendszerrel): önkéntes bekapcsolás, csak kölcsönös követők, hely szintű pontosság, csak nyitott appnál frissül, pár óra után eltűnik, előzmény nélkül. A 4. fázis térképe úgy készül, hogy ez utólag beköthető legyen.
  6. **Térkép (P-01):** a közeli eseményjelölők számozott csoportba vonódnak.
- **Kiegészítés (2026-10-21), a 4. fázis jelentésére adott válaszok:**
  7. **Üres rács (P-02):** ha nincs ajánlott esemény, ez áll: „A beállított távolságon belül most nincs neked ajánlott esemény. Növeld a távolságot a térképen.” A második mondat csak addig, amíg a távolság 200 km alatt van.
  8. **Helyadat-engedély:** az app a Home első megnyitásakor kéri (nem a térképnél), mert az ajánlás már ott a pozíciótól függ.
  9. **„Közelgő” esemény:** a következő 7 napban kezdődő.
  10. **Távolság-kör a térképen** (jóváhagyott javaslat): a beállított távolság körként látszik a pozíciód körül, és a csúszkával együtt változik.
  11. **„Vissza a pozíciómhoz” gomb a térképen** (jóváhagyott javaslat): mindkét platformon ugyanaz a saját gomb (az Android beépített gombja ki van kapcsolva); a pozíciódra áll vissza, a beállított távolságnyi nézettel. Csak akkor látszik, ha ismert a pozíciód.

### D-008 — Partnerfiókok: a szervezők maguk töltik fel az eseményeiket (a 4. fázis átdolgozása)

- **Dátum:** 2026-10-23
- **Érintett:** F1, F4, F5, F6, Q3, Q15, D-007
- **Háttér:** az események forrása a csapat által feltöltött táblázat helyett a partnerek (cégek, szervezők) saját fiókja. A D-007/1 (CSV-import) ezzel megszűnik.
- **Döntések:**
  1. **Partnerregisztráció** a belépés és regisztráció képernyő alján lévő lehetőséggel, **csak e-maillel és jelszóval** (Google nélkül), a céges e-mail-cím ellenőrzése miatt.
  2. **Kért adatok:** cégnév, adószám, a kapcsolattartó neve és telefonszáma, a helyszín; opcionálisan weboldal vagy közösségi oldal.
  3. A **fióktípus** (magánszemély vagy partner) a regisztrációkor dől el, utólag nem változtatható. A partnerfiók külön fiók, külön e-mail-címmel.
  4. **Jóváhagyás:** a kérelem e-mailben megy a csapat partner-postafiókjára (Rackhost; a cím később). Az e-mailből egy kattintással jóváhagyható vagy elutasítható (aláírt, lejáró linkek), a döntésről a partner is e-mailt kap. Elutasításnál rövid indoklás jár, és a kérelem újra beadható. Jóváhagyásig a partner beléphet és kitöltheti a profilját, de eseményt nem tehet közzé („A kérelmed elbírálás alatt”). *Az elbírálás helye módosult: az appban történik (D-008/23).*
  5. **Megkülönböztetés:** „Hitelesített partner” pipa a profilon, az eseményeken és a keresőben; magánszemély nem kaphatja meg. Egy jóváhagyott partner nevét és felhasználónevét, illetve a nagyon hasonlókat más nem veheti fel.
  6. **Az esemény adatai:** cím, típus, kezdés és zárás, helyszín (a partner a címet adja meg, a térképre az app teszi), 1–3 műfaj a közös listából (ez határozza meg, kinek ajánljuk), fellépők, jegyár (bruttó, forintban), rövid leírás (legfeljebb 1000 karakter), borítókép.
  7. **Közzététel:** a jóváhagyott partner eseménye azonnal megjelenik. A feladó közzététel után **nem módosíthatja**; az adminok leszedhetik vagy módosíthatják. A felhasználók indoklással bejelenthetik az eseményt.
  8. Az **„Új esemény” gomb a partner Home képernyőjén** van, az eseményekkel egy helyen.
  9. **Képek:** a Home-on és az eseményoldalon a partner borítóképe látszik; a csevegőtér fejléce a csevegőtérben legutóbb megosztott kép (F2).
  10. **Partnerprofil:** logó, név pipával, rövid bemutatkozás, cím, követők, közelgő események és posztok; a 3 műfaj-„neuron” nem jelenik meg. A **partnerposztok a 7. fázisban** készülnek, a sima profilok posztjaival közös rendszerben.
  11. A partner **nem választ ízlést**; a Home-on látja az eseményeket (a versenytársakét is).
  12. **Partneri felhasználási feltételek:** egyelőre helykitöltő szöveg; kiadás előtt jogásszal kell rendezni (RELEASE_CHECKLIST).
  13. **Megszűnik:** a CSV-import és a mintaesemények. A jegyértékesítők adatfolyama később a partnerfiók mellett működhet; egyelőre a partnerfiók az egyetlen út.
  14. **Ütemezés:** 4a — partnerregisztráció, jóváhagyás, védett név; 4b — eseményfeltöltés, kép, ár, leírás, bejelentés.
  15. **Cél a jegyvásárlásnál:** az appon belül, a jegy Apple Walletbe kerül, és e-mailben (nyomtatható formában) is megérkezik. A megvalósítás külön tervezést igényel.
- **Kiegészítés (2026-10-23), a maradék kérdésekre adott válaszok:**
  16. **Közzététel előtt előnézet** „Közzététel után csak mi módosíthatjuk” figyelmeztetéssel; a tényleges közzététel gomb **5 másodpercig nem nyomható**, ezt animáció jelzi, hogy biztosan elolvassák. Utólagos javításhoz „Módosítás kérése” gomb (indoklással, e-mailben a csapatnak); **lemondani a partner maga tudja**.
  17. **Bejelentett esemény:** a csapat az e-mailből egy kattintással leszedheti; módosítani egyelőre a Supabase felületén lehet, külön admin-felület nélkül.
  18. **A partner Home-ja:** a távolságon belüli összes esemény, kezdés szerint, a sajátjai kiemelve.
  19. **Nyilvános név:** a partner nyilvános nevet (márkanevet) és felhasználónevet ad meg; a cégnevet és az adószámot csak a csapat látja.
  20. **Jelölőnégyzetek a partnerregisztrációnál:** a partneri feltételek és az adatvédelmi tájékoztató elfogadása, „Elmúltam 18 éves” nélkül.
  21. **Partner-postafiók:** `partner@nocturnal.hu`.
  22. **Az e-mail-megerősítés a partnerregisztráció végére kerül** (2026-10-23): előbb a belépési adatok és a teljes kérelem, utána a kód, és a kód után a kérelem magától beküldődik. A kód beírásáig a szerveren csak a megerősítetlen fiók van, így aki közben abbahagyja, később ugyanazzal a címmel újra regisztrálhat (a megerősítetlen regisztráció 7 nap után amúgy is törlődik, D-004/9).
- **Kiegészítés (2026-10-23, este):**
  23. **Elbírálás az appban**, a D-008/4 egy kattintásos e-mailes jóváhagyása helyett (a technikai korlátot lásd I-013-ban). A csapat fiókjai admin jogot kapnak, és a Beállításokban a „Partnerkérelmek” menüben látják a várakozó kérelmeket az ellenőrzendő adatokkal; jóváhagyás megerősítéssel, elutasítás csak indoklással. A döntésről a partner e-mailt kap (magyarul és angolul), az indoklást az appban is látja. Admin jogot csak SQL-lel lehet adni, az appban nincs rá felület (I-014).
  24. **A pin kézi igazítása:** igen, a 4b-ben. Az app a partner által megadott címből teszi le a pint, a partner szükség esetén odébb húzhatja.
  25. **Jegyvásárlás külön fázisban** (D-008/15): a 7. fázis után, a kiadás előtt. Addig az eseményen a jegyár látszik, a „Jegyvásárlás” gomb pedig „Hamarosan elérhető” üzenetet ad.
  26. **„Hirdetés”** = a Home hirdetési sávjai (D-007/3). Az eseményeket a partnerek hozzák létre, és ezek a Home eseményei között jelennek meg. A hirdetési sávok tartalma és működése még nyitott (4b előtt).

### D-009 — Magánszemély-regisztráció: az e-mail-kód a végén

- **Dátum:** 2026-10-23
- **Érintett:** F6, D-004, D-008/22
- **Döntés:** a magánszemélyek regisztrációja is a partnerekével azonos sorrendet követi. Előbb a belépési adatok és a profil (név, felhasználónév, profilkép, „Elmúltam 18 éves”, adatvédelmi tájékoztató), utána a szinkron-képernyő és a műfajválasztás, a 6 jegyű kód a végén; a kód beírása után a profil és az ízlés magától mentődik. A kódig csak a megerősítetlen fiók van a szerveren, így aki közben abbahagyja, később ugyanazzal a címmel újrakezdheti. A Google-belépés menete nem változott.

---

## Elutasított javaslatok

### E-001 — Bonyolultabb jelszószabály

- **Dátum:** 2026-10-20
- **Javaslat:** legalább 8 karakter, kisbetűvel, nagybetűvel és számmal (Supabase → Password Requirements).
- **Döntés:** elutasítva. Marad a **legalább 8 karakter**, karakterszabály nélkül. A jelszavakat a Supabase bcrypt-lenyomatként tárolja, olvasható formában sehol nincsenek meg.

### E-002 — Hamis profil bejelentése (leszedetési kérelem)

- **Dátum:** 2026-10-23
- **Javaslat:** „Hamis profil bejelentése” lehetőség minden profilon, e-mail az adminnak, felfüggesztési lehetőséggel.
- **Döntés:** elutasítva. A „Hitelesített partner” pipa elég megkülönböztető jel. (Az események bejelentése megmarad, D-008/7.) Megjegyzés: az App Store a felhasználói tartalomhoz bejelentést és letiltást kér (Q23 a); ezt a kiadás előtt újra elő kell venni.

### E-003 — A CSV-import és a mintaesemények megtartása

- **Dátum:** 2026-10-23
- **Javaslat:** a CSV-import maradjon admin-eszköznek, a mintaesemények pedig a teszteléshez, amíg nincs valódi partner.
- **Döntés:** elutasítva. Mindkettő megszűnik (D-008/13).

---

## Megválaszolt nyitott kérdések

### Q1 — Név és azonosítók

- **Megválaszolva (2026-10-13):** Az app neve (munkacím): **Nocturnal**. iOS bundle identifier és Android package name: **`hu.nocturnal.app`** (az első store-feltöltés után nem változtatható). Logó még nincs; addig az Expo alapértelmezett ikonja a helykitöltő.

### Q2 — Backend

- **Megválaszolva (2026-10-13):** **Supabase**, EU (Frankfurt) régióval.
- **Lekérdezési réteg:** **Drizzle ORM**, egy Supabase Edge Functionben futó API-ban (`PHASE0.md`, 2.1 fejezet). Az app az adatokat ezen az API-n keresztül éri el; közvetlenül csak a belépéshez (Auth), az élő üzenetek fogadásához (Realtime) és a képfeltöltéshez (Storage) kapcsolódik a Supabase-hez.

### Q3 — Esemény- és helyszínadatok forrása

- **Megválaszolva (2026-10-20):** D-007/1. Egyelőre a csapat tölti fel az eseményeket táblázatból (CSV), **Budapesttel** indulunk; később a partnercégek (jegyértékesítők) adatfolyama jön, úgy, hogy csak a forrást kelljen váltani. Az események a közös műfajlistából (D-005/2) kapják a műfajaikat, így közvetlenül összevethetők a felhasználók ízlésével.

### Q5 — Ízlés-algoritmus (részben)

- **Megválaszolva (2026-10-06):** Az előadók is számítanak, és közvetlenül befolyásolják az eseményajánlást (pl. a kedvenc előadó koncertje).
- **Megválaszolva (2026-10-20):** a `PHASE0.md` 7.2 (súlyok) és 7.6 (frissítés) pontja szerint: a legutóbbi kb. 4 hét hallgatása számít a legerősebben (1.0), a fél éves toplista közepesen (0.5), a saját playlistek a leggyengébben (0.3); a streaming-ízlés naponta egyszer frissül, a kézi azonnal.

### Q6 — Távolság (részben)

- **Megválaszolva (2026-10-06):** A keresési távolságot a felhasználó a **térképen egy csúszkával (slider)** állítja be (új felületi elem, kifejezetten jóváhagyva). A távolság a felhasználó aktuális pozíciójától számít, **legfeljebb 200 km**.
- **Csúszka értékei:** alapérték **25 km**, minimum **1 km**, maximum **200 km**, lépésköz **1 km**.
- A beállított távolság minden ajánlásra érvényes (Home rács és térkép is), az F1 szerint.

### Q7 — A Home-rács tartalma

- **Megválaszolva (2026-10-20):** D-007/3. Az ajánlott éppen zajló és közelgő események, egyezés szerint, egyenlő egyezésnél a korábbi kezdés előre; kb. minden 6. esemény után hirdetési banner.

### Q8 — Eseményre koppintás

- **Megválaszolva (2026-10-20):** D-007/4. Eseményoldal: helyszín, időpont, műfajok, fellépők, „Megnyitás a térképen” és „Jegyvásárlás” gomb (egyelőre „Hamarosan elérhető”).

### Q19 — Barátok a térképen

- **Megválaszolva (2026-10-20):** D-007/5. Igen, a 7. fázisban: önkéntes, csak kölcsönös követők, hely szintű pontosság, csak nyitott appnál frissül, pár óra után eltűnik, előzmény nélkül. Háttér-helymeghatározás ehhez sem kell.

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

### I-001 — Projektalap (1. fázis, 2026-10-13)

- **Expo SDK 57** (a legfrissebb stabil; az SDK 58 béta), React Native 0.86, React 19.2, TypeScript 6, `strict: true`.
- Csomagkezelő: **npm**; Node.js 22 (`.nvmrc`). Új függőség csak `npx expo install`-lal kerül be.
- Az útvonalak a **`src/app`** mappában vannak (az SDK 57 sablonjának konvenciója); ez felülírja a `PHASE0.md` 5. fejezetében szereplő gyökérszintű `app/` mappát. Útvonal-alias: `@/*` → `src/*`.
- A `react-dom`, a `react-native-reanimated` és a `react-native-worklets` közvetlen függőségként, az SDK 57-tel kompatibilis verzióra rögzítve szerepel. Ezek az Expo Router függőségei; e nélkül az npm inkompatibilis, túl új verziót telepít.
- Egységes LF sorvégek (`.gitattributes`), mert a csapat Windowson is dolgozik.

### I-002 — Kódstílus

- A kódban az elnevezések **és a kommentek** angolul vannak; a dokumentáció (README, `docs/`) magyarul.
- A felületi szövegek a `src/i18n/locales` mappában vannak. A `hu.ts` a forrás; az `en.ts`-nek a TypeScript kikényszeríti, hogy ugyanazokat a kulcsokat tartalmazza.
- ESLint (`eslint-config-expo`) és Prettier (szimpla idézőjel, 100 karakteres sor). A Markdown-fájlokat a Prettier nem formázza.

### I-003 — Navigációs váz (F5, F6, F7)

- A gyökérben egy Stack van, `Stack.Protected` védelemmel: kijelentkezve csak az `(auth)` csoport, belépve a `(tabs)` csoport és a profil érhető el.
- A `(tabs)` csoportban pontosan 3 fül van: csevegőtér, Home, profilkereső (Q21). Mindegyik fülnek saját Stackje van, így a fülön belül megnyitott képernyőkön (pl. térkép, csevegőtér, beszélgetés) a navbar látható marad (F7).
- A profil (`profile/[id]`) a fülek fölött van, ezért ott nincs navbar (F4, F7). A saját profil azonosítója `me`.
- A Home a középső fül, mégis az a kezdőképernyő: ezt a `Tabs` `initialRouteName` beállítása biztosítja (F5, F6).
- Belépés: Belépés → Home; Regisztráció → Streaming-szinkron (→ kézi ízlésválasztás) → Home.
- Az eseményrácsban a koppintás még nem csinál semmit (Q8; a 4. fázis óta az eseményoldalt nyitja meg, I-012), a lezárt események menüpontja még nincs a navigációban (Q13).

### I-004 — Helykitöltő munkamenet

- A 2. fázisig a belépés helykitöltő: memóriában tárolt állapot (Zustand). Az app újraindítása után újra a belépő képernyő jelenik meg; kijelentkezés gomb még nincs.

### I-005 — Téma és nyelv (D-002 alapján)

- Helykitöltő színpaletta világos és sötét módra, amíg nincs végleges arculat. A téma a telefon beállítását követi (`userInterfaceStyle: automatic`); ha a telefon nem ad meg semmit, világos.
- A nyelvet a telefon elsődleges nyelve dönti el (`expo-localization`). Ha a telefon nem ad nyelvi adatot, magyar.
- A kézi téma- és nyelvváltó a Beállítások képernyővel együtt készül el.

### I-006 — Tesztelés

- Jest (`jest-expo`), React Native Testing Library 14 és `expo-router/testing-library`.
- Az RNTL 14-ben a `render` és a `fireEvent` aszinkron, ezért a tesztekben `await`-tel hívjuk őket.
- A navigációs tesztek az F4–F7 elfogadási feltételeit ellenőrzik: 3 navbar-elem sorrendben, belépés után a Home, a profilon nincs navbar, a térképen van, a Követés/Kikövetés gomb váltása.

### I-007 — CI és EAS

- GitHub Actions: `npm ci` → typecheck → lint → tesztek, minden pull requesten és a `main`-re küldött commitokon.
- Az `eas.json` három profilt tartalmaz (`development`, `preview`, `production`). Az EAS Update csatornái az `expo-updates` telepítésekor kerülnek be.
- **EAS-projekt (2026-10-13):** `@nocturnal_app/nocturnal` (azonosító: `17317d02-8a22-4d6d-a425-4b1bc7862d57`), a csapat **`nocturnal_app`** Expo-szervezetében, nem személyes fiókban, hogy mindkét fejlesztő hozzáférjen. A projektazonosító és az `owner` az `app.config.ts`-ben van (nem titok; a dinamikus konfigurációba az `eas init` nem tud automatikusan írni).

### I-008 — Backend és API (2. fázis, 2026-10-18)

- **Supabase CLI** fejlesztői függőségként; a `supabase/` mappa össze van kötve a projekttel (`ryqbsalvqwvamhrcliht`, Frankfurt). A `supabase/config.toml` a helyi környezetet írja le, és dokumentálja a távoli Auth-beállításokat; a távoli beállítások a Supabase felületén élnek, a CLI nem írja felül őket.
- **Migrációk:** a `drizzle-kit` generálja őket a `supabase/migrations` mappába (Supabase-formátumú fájlnevekkel); a tárhely és az időzített feladat kézzel írt SQL-migráció. Felküldés: `npm run db:push` (a CLI ideiglenes belépési szerepet használ, adatbázis-jelszó nem kell).
- **Séma:** `profiles` tábla (azonosító = auth-felhasználó, felhasználónév egyedi és formátum-ellenőrzött, megjelenített név, profilkép útvonala, a 18+ megerősítés és az adatvédelmi elfogadás időpontja, a tájékoztató verziója, az ízléslépés időpontja). **RLS bekapcsolva, szabályok nélkül**: az appból közvetlenül nem olvasható, csak az API-n át.
- **API:** egyetlen `api` Edge Function. A logika az `app.ts`-ben van (Hono), az `index.ts` csak összeköt. Hitelesítés: `@supabase/server` `withSupabase({ auth: 'user' })` — a Hono-adapterét nem használjuk, mert 2026. december 1-jén megszűnik. Adatbázis: Drizzle és postgres.js a `SUPABASE_DB_URL`-lel (`prepare: false`, legfeljebb 3 kapcsolat). Tárhely- és felhasználó-törlés: a `supabaseAdmin` kliens.
- **Fontos:** az új API-kulcsokkal a platform JWT-ellenőrzése a token nélküli kéréseket is továbbengedi a függvényig, ezért a hitelesítést a függvényben futó `withSupabase` végzi. Ellenőrizve: token nélkül és érvénytelen tokennel is 401.
- **Közös kód:** `supabase/functions/_shared` (zod-adatszerződések és a Drizzle-séma). Az app a `@shared/*` aliasszal éri el. A Deno a relatív importokban megköveteli a `.ts` kiterjesztést, ezért a tsconfigban `allowImportingTsExtensions: true`. A Deno-specifikus `index.ts` kimarad az app típusellenőrzéséből.
- **Profilképek:** privát `avatars` tárhely (legfeljebb 2 MB, JPEG). Feltöltés az API által kiadott, aláírt feltöltési címre, a `<felhasználó-azonosító>/<véletlen azonosító>.jpg` útvonalra; megjelenítés 1 óráig érvényes, aláírt címmel. A telefonon 512 pixel szélesre kicsinyítve, JPEG-ként.
- **Adatvédelmi tájékoztató verziója:** `draft-2026-10`, az elfogadással együtt tárolva; a szöveg változásakor emelni kell.
- **Meg nem erősített regisztrációk:** `pg_cron` feladat naponta 03:00-kor (UTC) törli a 7 napnál régebbieket.

### I-009 — Belépés az appban (2. fázis)

- `supabase-js` **PKCE**-folyamattal. A munkamenet titkosítva tárolódik: az AES-kulcs a SecureStore-ban (Keychain / Keystore), a titkosított munkamenet az AsyncStorage-ban, mert a munkamenet nagyobb lehet a SecureStore méretkorlátjánál. A tokenfrissítés csak előtérben fut.
- **Állapotgép** (`resolveAppState`): betöltés → kijelentkezve → profil kell → ízlés kell → kész, valamint „nem elérhető”. A gyökér-Stack `Stack.Protected` szabályai ebből döntenek; a splash képernyő addig látszik, amíg az állapot ki nem derül. Hidegindításkor a közvetlen linkek a Home-on kötnek ki, mert a munkamenet aszinkron töltődik.
- **Jelszó-visszaállítás:** a kód ellenőrzése már bejelentkezteti a felhasználót, ezért egy jelző a belépő folyamatban tartja, amíg az új jelszó el nem mentődik; ha a mentés nem sikerül, kijelentkeztetjük.
- **Google (böngészős):** `signInWithOAuth` → `WebBrowser.openAuthSessionAsync` → `exchangeCodeForSession`. A visszairányítási cím `Linking.createURL('auth/callback')` (Expo Go-ban `exp://…`); a `+native-intent` a gyökérre irányítja, ha Android deep linkként is kézbesíti.
  - **Fiókválasztó (2026-10-20):** a Google mindig felajánlja a fiókválasztót (`prompt=select_account`), akkor is, ha a böngészőben már be van jelentkezve valaki; így több Google-fiók között lehet választani.
  - **Expo Go-ban tunnel mód kell** (`npm run start:tunnel`, 2026-10-19): a Supabase Auth IP-címes visszairányítási címet csak loopback (`127.0.0.1`) esetén fogad el, a listától függetlenül (`IsRedirectURLValid`). A helyi hálózati `exp://192.168.x.x` cím ezért mindig a Site URL-re esett vissza. Tunnel módban a cím hosztnév (`….exp.direct`), amit az `exp://**` lefed. Fejlesztői módban a terminál kiírja a használt címet.
  - **Kiegészítés (2026-10-20):** az ngrok-tunnel megbízhatatlan (az első kapcsolódást néha eldobja), ezért az ajánlott mód a `npm run start:lan`. Ez a helyi IP-címet nip.io névvel adja az Expónak (`REACT_NATIVE_PACKAGER_HOSTNAME`, pl. `192.168.0.170.nip.io`). Név, nem IP-cím, így a Supabase elfogadja, a telefon pedig közvetlenül a Wi-Fin csatlakozik. Ha a router nem engedi a helyi címre mutató nyilvános nevet, marad a tunnel.
- **PKCE Web Crypto-val:** a Hermesben nincs Web Crypto, ezért a `supabase-js` a PKCE-értéket `Math.random`-mal állította elő, és „plain” módszert használt. Az `expo-crypto` pótolja a két szükséges függvényt (`getRandomValues`, SHA-256 `digest`), így a PKCE biztonságos véletlennel és S256-tal működik.
- **Apple-gomb:** az Expo Go-ban nincs meg az Apple natív gombjának nézete, ezért addig saját gomb látszik (csak iOS-en, „Hamarosan elérhető”). A natív gomb és az `expo-apple-authentication` a valódi Apple-belépéssel együtt kerül vissza, development buildben.
- **Kijelentkezés:** csak ezen az eszközön (`scope: 'local'`). A profil létrehozása képernyőn is van kijelentkezés link, mert a beléptetés közben a Beállítások még nem érhető el (pl. ha valaki rossz Google-fiókkal lépett be).
- **„Nem elérhető” képernyő:** ha bejelentkezés után a profil nem tölthető be (pl. nincs internet), Újra és Kijelentkezés gombbal. Ez hibakezelés, nem új funkció.
- **Téma és nyelv** (D-002): eszközönként tárolva (Zustand + AsyncStorage); a „Rendszer” a telefont követi.
- **E-mail-sablonok:** kétnyelvűek (elöl magyar, alatta angol), mert a sablon a nyelvi adat hiányában nem tud megbízhatóan nyelvet váltani. A fájlok: `supabase/templates/`.
- **Engedélykérő szövegek:** az `app.config.ts`-ben angolul, iOS-re magyar fordítással (`src/i18n/native/hu.json`). Ezek csak saját buildben látszanak; az Expo Go a saját szövegeit mutatja.

### I-010 — Tesztelés (2. fázis)

- Az API tesztjei hamis adatbázissal és tárhellyel futnak (Hono `app.request`), valódi szerver nélkül.
- Az app folyamattesztjei hamis Supabase- és API-réteggel futnak: belépés, hibás jelszó, meg nem erősített e-mail, regisztráció kóddal, profil létrehozása, a 18+ nélküli tiltás, a kötelező ízléslépés, a navbar, a profilok, a Beállítások, a kijelentkezés és a nyelvváltás.
- Összesen 47 teszt; mellette `expo export` iOS-re és Androidra, valamint `expo-doctor`.

### I-011 — Kézi ízlés és ízlésprofil (3. fázis, 2026-10-20)

- **Műfajlista:** `supabase/functions/_shared/contracts/genres.ts` (a sorrend a megjelenítési sorrend), a feliratok az app i18n-fájljaiban (`genres.<azonosító>`). Az adatbázisban `genre` enum, ezt használják majd az események is; új műfajhoz migráció is kell.
- **Táblák:** `taste_genres` (a választás, `position` 0 = legkedvencebb) és `taste_profiles` (top 3 és az összes műfaj pontszáma). RLS bekapcsolva, szabályok nélkül; mentés egyetlen tranzakcióban.
- **Algoritmus:** `supabase/functions/_shared/taste/` — tiszta, determinisztikus függvény, egységtesztekkel. A súlyok a `config.ts`-ben (F1). Kézi műfaj: 1.0, a sorrend szerint lineárisan 0.5-ig csökkenve; forrásonként normalizálva; kézi és streaming együtt fele-fele (D-001/5); holtversenynél a műfajlista sorrendje dönt. Egy több műfajú jelzés (pl. előadó) a súlyát egyenlően osztja szét. A streaming-súlyok (PHASE0 7.2) a Spotify-szinkronnal kerülnek be.
- **API:** `GET /taste` (a választás sorrendben), `PUT /taste` (3–10 egyedi műfaj; kiszámolja a profilt, és első alkalommal lezárja a beléptetés ízléslépését). A profil válasza tartalmazza a top 3 műfajt. A helykitöltő `POST /onboarding/taste` megszűnt.
- **Tesztfelhasználók:** a migráció azoknál, akik a helykitöltő lépéssel jutottak át, újra megnyitja az ízléslépést.
- **App:** közös `GenrePicker` a beléptetésben és a Beállítások „Ízlés módosítása” képernyőjén (navbar nélkül). A saját profilon a top 3 műfaj látszik; a lebegő „neuron” animáció a 7. fázisban jön. A válaszokban a műfajok sima szövegként jönnek, így egy régebbi app sem omlik össze, ha később új műfaj kerül be.


### I-012 — Események, ajánlás, Home-rács és térkép (4. fázis, 2026-10-21)

- **Adatmodell:** `venues` (forrás, forráson belüli azonosító, név, cím, koordináták, és belőlük számolt PostGIS-pont térbeli indexszel), `events` (forrás és azonosító, helyszín, cím, típus, kezdés, zárás, műfajok a közös `genre` listából, fellépők, a partner jegyoldalának címe) és `user_settings` (keresési távolság, 1–200 km, a szerveren, így minden eszközön ugyanaz). RLS bekapcsolva, szabályok nélkül.
  - A típus (klub, bár, koncert, fesztivál) **az eseménynél** van, nem a helyszínnél, mint a CLAUDE.md 6. fejezetének vázlatában: ugyanaz a hely egyik este koncertet, másik este klubestet tarthat. A felületen egyelőre nem jelenik meg.
  - Az állapotot (közelgő, zajló, lezárt) nem tároljuk, mindig az időpontokból számolódik.
- **Egységes eseményforrás (D-007/1):** minden forrás ugyanabba a formába alakítja az eseményeit (`ImportedEvent`, `supabase/functions/_shared/contracts/events.ts`), és egyetlen adatbázis-függvény írja be őket (`public.import_events`).
  - A sorokat a (forrás, külső azonosító) pár azonosítja: újratöltéskor frissülnek, nem duplikálódnak, a változatlan sorokhoz nem nyúl.
  - A `--prune` a forrás azon, még le nem zárult eseményeit törli, amelyek hiányoznak a fájlból (pl. lemondott esemény). A múltbeli események megmaradnak a lezárt események részhez (F3).
  - Egy partner adatfolyamához csak egy új átalakító kell (később pl. egy ütemezett Edge Functionben); az adatbázis oldala változatlan. A függvényt az appok nem hívhatják.
- **CSV-import** (2026-10-23-án megszűnt, E-003): `npm run events:import -- <fájl.csv>`, a `--dry-run`, `--prune` és `--source=` kapcsolókkal. A leírás a README-ben van.
  - Az időpontok budapesti helyi idő szerint értendők (a nyári és a téli időszámítást is kezeli). A magyar Excel formátumát is elfogadja: pontosvessző, tizedesvessző, `2026. 10. 24. 22:00`.
  - Ha bármi hibás, semmit nem tölt fel, és soronként kiírja a hibákat. A Supabase CLI-n keresztül fut, adatbázis-jelszó nem kell hozzá.
  - **Mintaadat:** `data/events/budapest-sample.csv`, 42 kitalált „Minta” esemény 16 kitalált helyszínen Budapesten és környékén (2026. október 16. – november 9.). Ezek külön forrásként (`sample`) vannak az adatbázisban, így a valódi adatoktól függetlenül törölhetők.
- **Élő frissítés (D-007/2):** az `events` és a `venues` tábla minden változásakor egy trigger üzenetet küld a nyilvános `events` Realtime-csatornán. Az üzenet nem tartalmaz eseményadatot; az app ekkor újratölti az eseményeket (egy import több üzenetét egy frissítésbe vonja össze).
  - Ezen felül az app 5 percenként, az appba visszatéréskor és lefelé húzásra is frissít.
  - A „Most zajlik” jelzés és a lezárult események eltűnése 30 másodpercenként, letöltés nélkül frissül.
  - A Supabase az üzenetek tárolóját csak akkor hozza létre, amikor egy kliens csatlakozik. Ha senki nincs csatlakozva, az üzenet elvész, de akkor nincs is, akinek szólna.
- **API:** `GET` és `PUT /settings` (keresési távolság), `POST /events/nearby`, `GET /events/:id`.
  - A pozíció a kérés törzsében megy, nem a címben, így nem kerül hozzáférési naplóba.
  - A közeli események válasza: a zajló és a 7 napon belül kezdődő események a pozíciótól legfeljebb **200 km-re** (a térkép az összeset mutatja), mindegyik a távolságával és az ízlés-pontszámával, legfeljebb 500 darab, a legközelebbiek.
- **Ajánlás (F1):** pontszám = az esemény műfajainak pontszáma a felhasználó top 3 műfajában + a kedvenc előadó bónusza (D-001/7; előadók még nincsenek). Az esemény akkor ajánlott, ha a pontszáma nagyobb 0-nál, és a távolsága legfeljebb a beállított távolság. A súlyok egy helyen vannak: `supabase/functions/_shared/recommendation/score-event.ts`. Mivel a pontszámot a szerver adja, a csúszka mozgatásakor az app letöltés nélkül, azonnal átszínezi a térképet.
- **Helymeghatározás:** csak előtérben; háttérbeli helyadat-engedély nincs az app engedélyei között.
  - Az engedélyt az app a **Home első megnyitásakor** kéri, mert az ajánlás a pozíciótól függ (F1).
  - A pozíció csak a memóriában van, kb. 100 méterre kerekítve kerül az API-hoz, és sehol nem tárolódik.
  - Megtagadott engedélynél, vagy ha nincs helyadat, Budapest központjától számolunk, és ezt az app kiírja (F5).
- **Térkép:** `react-native-maps` (iOS-en Apple Maps, Androidon Google Maps).
  - A közeli jelölők a `supercluster` könyvtárral vonódnak számozott csoportba (P-01). A csoport ajánlott színű, ha van benne ajánlott esemény.
  - Az ugyanazon a helyszínen lévő események kb. 20 méterre szétterítve jelennek meg, hogy mindegyikre rá lehessen koppintani.
  - Koppintás: csoportra ránagyít, eseményre megnyitja az eseményoldalt.
  - A keresési távolság kör alakban látszik (D-007/10), és van „Vissza a pozíciómhoz” gomb (D-007/11).
  - A felúszó kártyák nem takarják a térkép logóját és jogi linkjét (az Apple és a Google feltétele).
  - Androidos buildhez Google Maps-kulcs kell (`GOOGLE_MAPS_ANDROID_API_KEY`, csak a build idején, EAS-környezeti változóként); az Expo Go-hoz nem kell.
- **Home-rács:** soronként 2 esemény; 6 esemény után egy teljes szélességű „Hirdetés” helykitöltő, de csak események között (D-007/3). Ha nincs ajánlott esemény, a D-007/7 szerinti üzenet jelenik meg.
- **Eseményoldal (Q8):** a Home fülön belül van, így a navbar látszik (F7). Tartalma: cím, „Most zajlik” jelzés, időpont, helyszín és cím, műfajok, fellépők, „Jegyvásárlás” („Hamarosan elérhető”) és „Megnyitás a térképen” (a térkép a helyszínre nagyít).
- **Tesztek:** egységtesztek a CSV-feldolgozásra, az időzóna-átváltásra, az ajánlási pontszámra, az életciklusra, a rács felosztására, a csoportosításra és a dátumformázásra; API-tesztek az új útvonalakra; folyamattesztek (rács hirdetéssel, eseményoldal jegygombbal, működés helyengedély nélkül, a csúszka). Összesen 119 teszt. A migrációkat egy visszagörgetett tranzakcióban a valódi adatbázison is kipróbáltam, mielőtt felkerültek.

### I-013 — Partnerfiókok, 4a (2026-10-23)

- **Adatmodell:** `profiles.account_type` (`person` vagy `partner`; a meglévő profilok magánszemélyek lettek). Az „Elmúltam 18 éves” megerősítés csak magánszemélynél kötelező, ezt az adatbázis is ellenőrzi. Új `partners` tábla: cégadatok, állapot (`pending`, `approved`, `rejected`), elutasítási indoklás, a partneri feltételek elfogadásának ideje és verziója (`draft-2026-10`), bemutatkozás. RLS bekapcsolva, szabályok nélkül.
- **Fióktípus a regisztrációnál:** a partnerregisztráció a Supabase-felhasználó adataiba írja a szándékot (`account_type: partner`), így a kód megerősítése után a partner-űrlap nyílik meg. A típus a profil létrejöttekor végleges; az API-nak nincs útja a módosítására.
- **API:** `POST /partner/application` (első kérelem: profil és partneradatok egy tranzakcióban), `PUT /partner/application` (csak elutasítás után). A profilválaszban `accountType`, `verified` és a saját partneradatok. A partner nem választhat ízlést, és a nyilvános nevét a profilszerkesztésben nem módosíthatja (csak a logót és a bemutatkozást); magánszemélynek nincs bemutatkozása.
- **Adószám:** formátum (8-1-2 számjegy), áfakód 1–5 és ellenőrző számjegy; valódi, nyilvános adószámokon tesztelve. A telefonszám és a weboldal is ellenőrzött; a weboldal elé az app `https://`-t tesz, ha hiányzik.
- **Védett nevek (D-008/5):** csak jóváhagyott partneré. Ütközik az ugyanolyan név bármilyen írásmóddal (kis- és nagybetű, ékezet és írásjelek nélkül), a legalább 5 karakteres partnernevet tartalmazó név, és a legalább 6 karakteres névtől egy betűben eltérő név. A felhasználónév-ellenőrzés `protected` okot ad vissza, a profil és a kérelem `name_protected` hibát. Visszamenőleg senkit nem nevez át.
- **E-mail a csapatnak:** a Resend HTTP API-n, `no-reply@nocturnal.hu` feladóval, a `PARTNER_REVIEW_EMAIL` címre; a válasz a partner fiókjának címére megy. A kérelmező minden adata HTML-escape-elve kerül az e-mailbe. Ha a küldés nem sikerül, a kérelem megmarad, a hibát a függvény adatok nélkül naplózza. A két secretet (`RESEND_API_KEY`, `PARTNER_REVIEW_EMAIL`) a csapat állítja be.
- **Elbírálás (átmenetileg; felváltotta az I-014):** a Supabase Table Editorban. Az e-mailes, egy kattintásos jóváhagyáshoz nyitott kérdés, hol legyen a gomb: a Supabase alapdomainjén az Edge Function nem szolgálhat ki HTML-oldalt (a `text/html` válasz `text/plain` lesz, csak fizetős egyedi domainnel működne), egy sima link pedig önmagában veszélyes, mert a levelezők linkellenőrzői megnyithatják.
- **App:** partnerregisztráció a belépés és a regisztráció alján; közös `useUsernameField` hook; ugyanaz a partner-űrlap az első kérelemhez és a javításhoz; a Home-on állapotkártya (elbírálás alatt, illetve elutasítva indoklással és „Kérelem javítása” gombbal). A partner a távolságon belüli összes eseményt látja kezdés szerint; a profilja pipával, bemutatkozással és címmel jelenik meg, „neuronok” és látogatott helyek nélkül; a Beállításokban nincs ízlés.
- **CSV-import kivezetve (E-003):** a script, a mintafájl, a CSV-feldolgozó és az időzóna-modul törölve; az `import_events` függvény és a mintaesemények az adatbázisból is (migráció). Az `events` és a `venues` tábla és az élő értesítés marad a 4b-hez.
- **Tesztek:** 133 (adószám, védett nevek, értesítő e-mail, az új API-útvonalak, a partnerregisztráció, az elutasítás és javítás, a hitelesített profil).
- **A megerősítés a végén (D-008/22, 2026-10-23):**
  - A kitöltött kérelem a kód beírásáig csak a telefon memóriájában van, a szerverre semmi nem kerül belőle. A kód után a partner-képernyő automatikusan elküldi (logóval együtt), ha a fiók e-mail-címe egyezik; ha a küldés nem sikerül, az űrlap kitöltve, a hibával jön vissza.
  - Ha a cím már egy korábbi, félbehagyott fiókhoz tartozik, az app belépésre küld; belépés után a most kitöltött kérelem megy el.
  - A felhasználónév ellenőrzése belépés nélkül is működik: `GET /api/public/usernames/:username`, csak az app nyilvános kulcsával (publishable key); a többi útvonal továbbra is bejelentkezést kér.
  - Összesen 138 teszt.

### I-014 — Elbírálás az appban (D-008/23, 2026-10-23)

- **Adatmodell:** új `admins` tábla (`user_id` → `profiles`, a profillal együtt törlődik), RLS bekapcsolva, szabályok nélkül. Admin jogot csak SQL-lel lehet adni (README), az API-nak nincs útja a módosítására.
- **API:** `GET /admin/partner-applications` — a várakozó kérelmek a legrégebbitől, a nyilvános profillal, a logóval és a fiók e-mail-címével (ezt az API az `auth.users` táblából olvassa). `POST /admin/partner-applications/:userId/decision` — `approve`, vagy `reject` 1–500 karakteres indoklással. Nem adminnak 403. Csak elbírálás alatt álló kérelemről lehet dönteni; a feltétel magában az adatbázis-módosításban van, így két egyidejű döntésből csak az egyik megy át, a másik 404-et kap, és második e-mail sem megy ki. A profilválasz új mezője: `isAdmin`.
- **E-mail a partnernek:** a döntésről, magyarul és angolul, a partner fiókjának címére; a válasz a `PARTNER_REVIEW_EMAIL` postafiókba érkezik. Az indoklás HTML-escape-elve kerül bele. Ha a küldés nem sikerül, a döntés megmarad (a partner az appban is látja). A csapatnak szóló e-mail mostantól az appba irányít: „Beállítások → Partnerkérelmek”.
- **App:** a Beállításokban „Nocturnal csapat” szakasz, csak adminnak. A „Partnerkérelmek” lista (logó, név, cégnév, a beküldés ideje) és a kérelem oldala: minden ellenőrzendő adat kijelölhető szövegként, ellenőrzési tipp, „Jóváhagyás” megerősítéssel, „Elutasítás” kötelező indoklással. Mindkettő navbar nélkül, mint a Beállítások. Ha a kérelemről közben már döntöttek, az app kiírja.
- **Tesztek:** összesen 154 (az új API-útvonalak jogosultsággal, kétszeri döntéssel és e-mail-hibával; a döntési e-mail; a menü csak adminnak; jóváhagyás és elutasítás az appban). A migrációt visszagörgetett tranzakcióban a valódi adatbázison is kipróbáltam.
