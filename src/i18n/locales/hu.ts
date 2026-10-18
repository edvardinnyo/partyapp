// Source of truth for UI strings: every other language must provide the same keys.
export const hu = {
  common: {
    placeholder: 'Helykitöltő',
    plannedPhase: 'Elkészül: {{phase}}. fázis',
    emptyValue: '—',
  },
  tabs: {
    chats: 'Csevegőtér',
    home: 'Home',
    search: 'Profilkereső',
  },
  auth: {
    welcome: 'Nocturnal',
    signIn: 'Belépés',
    register: 'Regisztráció',
    signInPlaceholder: 'Belépés és regisztráció emaillel és Google-fiókkal',
    syncTitle: 'Streaming-szinkron',
    syncPlaceholder: 'Spotify és más streaming-szolgáltatások összekötése',
    chooseManually: 'Inkább kiválasztom magam',
    tasteTitle: 'Zenei ízlés',
    tastePlaceholder: '3–10 műfaj, legfeljebb 20 előadó és 20 zene',
    continue: 'Tovább',
  },
  home: {
    openProfile: 'Profil megnyitása',
    openMap: 'Térkép megnyitása',
    recommendedEvents: 'Ajánlott események',
    eventTile: 'Esemény {{number}}',
  },
  map: {
    title: 'Térkép',
    placeholder: 'Térkép a pozícióddal, az összes eseménnyel és a távolság-csúszkával',
  },
  chats: {
    title: 'Csevegőtér',
    listPlaceholder: 'Az éppen zajló, neked ajánlott események csevegőterei',
    sampleEvent: 'Minta esemény',
    roomPlaceholder: 'Valós idejű csevegés és képmegosztás',
  },
  search: {
    inputPlaceholder: 'Keresés név alapján',
    conversations: 'Beszélgetések',
    feedTitle: 'Követettek bejegyzései',
    feedPlaceholder: 'Az általad követett emberek bejegyzései',
    results: 'Találatok',
    sampleUser: 'Minta felhasználó',
  },
  conversations: {
    title: 'Beszélgetések',
    listPlaceholder: 'Beszélgetések a barátaiddal',
    sampleConversation: 'Minta beszélgetés',
    threadPlaceholder: 'Valós idejű beszélgetés',
  },
  profile: {
    title: 'Profil',
    genre: 'Műfaj {{number}}',
    neuronPlaceholder: 'A 3 leghallgatottabb műfaj „neuronként”, lebegő animációval',
    mostVisited: 'Legtöbbet látogatott hely',
    topRated: 'Legjobban értékelt hely',
    lastVisited: 'Legutóbb meglátogatott hely',
    followers: 'Követők',
    following: 'Követettek',
    follow: 'Követés',
    unfollow: 'Kikövetés',
    posts: 'Bejegyzések',
    postsPlaceholder: 'A felhasználó saját bejegyzései',
  },
};

export type Translation = typeof hu;
