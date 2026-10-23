# Kiadás előtti teendők

Gyűjtőlista azokról a feladatokról, amelyeket a nyilvános kiadás (8. fázis) előtt el kell végezni. Új tételnél jelöld, honnan ered (döntés vagy kérdés azonosítója).

## Belépés (F6, D-004)

- [ ] **Supabase → URL Configuration → Redirect URLs:** az `exp://**` törlése. Csak az Expo Go-s fejlesztéshez kell; a kiadott app a `nocturnal://**` címre tér vissza.
- [ ] **Supabase → URL Configuration → Site URL:** a `http://localhost:3000` cseréje valódi címre (pl. `https://nocturnal.hu`).
- [ ] **Natív Google-gomb development buildben** (D-004/2):
  - iOS- és Android-kliens a Google Cloudban (Androidhoz a csomagnév és az EAS aláírókulcsának SHA-1 ujjlenyomata);
  - az új Client ID-k felvétele a Supabase Google-szolgáltatójába.
- [ ] **Google Cloud → Google Auth Platform:** az alkalmazás közzététele („Testing” helyett „In production”). Amíg ez nem történik meg, csak a tesztelőként felvett fiókok tudnak belépni. Ehhez kell: adatvédelmi tájékoztató URL, kezdőlap a saját domainen, és a domain igazolása.
- [ ] **Sign in with Apple** (D-004/3): Apple Developer-tagság, development build, az Apple natív gombja (`expo-apple-authentication`) és a Supabase Apple-szolgáltatója.
- [ ] Megfontolandó: universal link / app link (`https://nocturnal.hu/auth/callback`) a `nocturnal://` séma helyett, a visszairányítás további védelméhez.

## E-mail (D-004/8)

- [ ] **Resend:** a `nocturnal.hu` domain „Verified” állapotban, a Supabase egyedi SMTP-je beállítva, a két sablon (`supabase/templates/`) bemásolva.
- [ ] A Supabase e-mail-küldési korlátja (Authentication → Rate Limits) a várható forgalomhoz igazítva.

## Események és térkép (F1, F5, D-007)

- [ ] **Google Maps-kulcs Androidra:** Google Cloudban „Maps SDK for Android” kulcs, a `hu.nocturnal.app` csomagnévre és az EAS aláírókulcsának SHA-1 ujjlenyomatára korlátozva, `GOOGLE_MAPS_ANDROID_API_KEY` néven EAS-környezeti változóként. Nélküle a térkép az androidos buildben üres.
- [ ] A helyadat-engedély szövegének (iOS: magyarul és angolul) átnézése a végleges arculattal; az adatvédelmi tájékoztatóban a helyadat kezelésének leírása (csak előtérben, kerekítve, tárolás nélkül).
- [ ] **Hirdetések forrása** (D-007/3): saját hirdetők vagy hirdetési hálózat. Az AdMob development buildet, GDPR-hozzájáruláskérést és iOS-en követési engedélyt (ATT) igényel.

## Jog és adatvédelem (Q23)

- [ ] Végleges adatvédelmi tájékoztató (jogásszal), nyilvános URL-en is (App Store, Google Play, Google Auth Platform). Szövegváltozáskor a `PRIVACY_POLICY_VERSION` emelése az API-ban.
- [ ] Az adatfeldolgozók felsorolása (Supabase, Resend, Google) és az adatfeldolgozási szerződések (DPA).
- [ ] A 18+ szabály (D-004/10) jogi ellenőrzése.
- [ ] **Partneri felhasználási feltételek** (D-008/12): a helykitöltő szöveg cseréje jogász által írt feltételekre (ki felel az esemény tartalmáért és a feltöltött képekért, az adminok leszedési és módosítási joga). **Emlékeztetőt kértetek rá a kiadás előtt.**
- [ ] **Tartalombejelentés és letiltás** (Q23 a, E-002): az App Store felhasználói tartalomnál megköveteli; a profilok bejelentését elutasítottuk, ezt a kiadás előtt újra el kell dönteni.

## Áruházak

- [ ] iPad-támogatás eldöntése (`supportsTablet` az `app.config.ts`-ben).
- [ ] Végleges ikon, splash képernyő és arculat (Q22).
