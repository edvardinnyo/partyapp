import { type AuthChangeEvent, AuthApiError, type Session } from '@supabase/supabase-js';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import type { PartnerApplication } from '@shared/contracts/admin';
import type { EventDetail, EventSummary } from '@shared/contracts/events';
import type { PartnerInfo, Profile } from '@shared/contracts/profile';
import { useAuthStore } from '@/features/auth/auth-store';
import { useLocationStore } from '@/features/location/location-store';
import { LAUNCH_CITY_CENTER } from '@/features/location/position';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import i18n from '@/i18n';
import { useRegistrationStore } from '@/features/auth/registration-store';
import { api, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => {
  const channel = { on: jest.fn(), subscribe: jest.fn() };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  return {
    supabase: {
      auth: {
        onAuthStateChange: jest.fn(),
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        verifyOtp: jest.fn(),
        resend: jest.fn(),
        signOut: jest.fn(),
        updateUser: jest.fn(async () => ({ data: {}, error: null })),
      },
      channel: jest.fn(() => channel),
      removeChannel: jest.fn(),
    },
  };
});

jest.mock('@/lib/api', () => ({
  ApiError: jest.requireActual('@/lib/api').ApiError,
  api: {
    getMe: jest.fn(),
    checkUsername: jest.fn(),
    submitPartnerApplication: jest.fn(),
    resubmitPartnerApplication: jest.fn(),
    getPartnerApplications: jest.fn(),
    decidePartnerApplication: jest.fn(),
    createAvatarUpload: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    getTaste: jest.fn(),
    saveTaste: jest.fn(),
    deleteAccount: jest.fn(),
    getSettings: jest.fn(),
    saveSettings: jest.fn(),
    getNearbyEvents: jest.fn(),
    getEvent: jest.fn(),
  },
}));

const APP_DIR = 'src/app';
const NAVBAR_LABELS = /^(Csevegőtér|Home|Profilkereső)$/;
const USER_ID = 'user-1';
const EMAIL = 'oli@example.com';

const auth = jest.mocked(supabase.auth);
const mockedApi = jest.mocked(api);

const readyProfile: Profile = {
  id: USER_ID,
  username: 'oli.fekete',
  displayName: 'Fekete Olivér',
  avatarUrl: null,
  tasteCompleted: true,
  topGenres: ['techno', 'house', 'pop'],
  accountType: 'person',
  verified: false,
  partner: null,
  isAdmin: false,
};

type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void;
let emitAuth: AuthCallback = () => {};

function sessionFor(userId: string | null, accountType = 'person', email = EMAIL): Session | null {
  return userId
    ? ({
        user: { id: userId, email, user_metadata: { account_type: accountType } },
      } as unknown as Session)
    : null;
}

/** The session Supabase "restores" at startup. */
function startSignedInAs(userId: string | null) {
  auth.onAuthStateChange.mockImplementation((callback) => {
    emitAuth = callback as AuthCallback;
    emitAuth('INITIAL_SESSION', sessionFor(userId));
    return { data: { subscription: { unsubscribe: jest.fn() } } } as unknown as ReturnType<
      typeof supabase.auth.onAuthStateChange
    >;
  });
}

function navbarLabels() {
  return screen.queryAllByText(NAVBAR_LABELS).map((element) => element.props.children);
}

const HOUR_MS = 3600 * 1000;

/** A live event 2 km away that matches the taste, unless the overrides say otherwise. */
function eventSummary(id: string, overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id,
    title: `Minta esemény ${id}`,
    kind: 'club',
    startsAt: new Date(Date.now() - HOUR_MS).toISOString(),
    endsAt: new Date(Date.now() + 3 * HOUR_MS).toISOString(),
    venue: {
      name: 'Minta Klub',
      address: '1072 Budapest, Minta utca 1.',
      lat: 47.4987,
      lng: 19.0634,
    },
    genres: ['techno'],
    distanceKm: 2,
    score: 0.4,
    ...overrides,
  };
}

beforeEach(async () => {
  jest.clearAllMocks();
  queryClient.clear();
  useAuthStore.setState({ status: 'loading', userId: null, isRecoveringPassword: false });
  useLocationStore.setState({ status: 'checking', position: null });
  useRegistrationStore.setState({ pending: null });
  // clearAllMocks keeps answers set by a test, so the default (location allowed) is set again.
  jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({
    status: Location.PermissionStatus.GRANTED,
    granted: true,
    canAskAgain: true,
    expires: 'never',
  });
  mockedApi.getSettings.mockResolvedValue({ searchRadiusKm: 25 });
  mockedApi.getNearbyEvents.mockResolvedValue([]);
  // The test phone's language is English; the assertions use the Hungarian UI.
  usePreferencesStore.setState({ theme: 'system', language: 'hu' });
  await i18n.changeLanguage('hu');
});

describe('sign-in flow (F6)', () => {
  it('starts on the sign-in screen when signed out, without a navbar (Q21)', async () => {
    startSignedInAs(null);
    await renderRouter(APP_DIR);

    expect(screen.getByText('Belépés')).toBeOnTheScreen();
    expect(screen.getByText('Folytatás Google-fiókkal')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual([]);
  });

  it('signs in with email and password and opens Home (F5)', async () => {
    startSignedInAs(null);
    mockedApi.getMe.mockResolvedValue({ profile: readyProfile });
    auth.signInWithPassword.mockImplementation(async () => {
      emitAuth('SIGNED_IN', sessionFor(USER_ID));
      return { data: {}, error: null } as never;
    });
    await renderRouter(APP_DIR);

    await fireEvent.changeText(screen.getByLabelText('E-mail-cím'), EMAIL);
    await fireEvent.changeText(screen.getByLabelText('Jelszó'), 'secret-password');
    await fireEvent.press(screen.getByText('Belépés'));

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: EMAIL,
      password: 'secret-password',
    });
    expect(await screen.findByText('Ajánlott események')).toBeOnTheScreen();
  });

  it('shows a readable error for wrong credentials', async () => {
    startSignedInAs(null);
    auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'),
    } as never);
    await renderRouter(APP_DIR);

    await fireEvent.changeText(screen.getByLabelText('E-mail-cím'), EMAIL);
    await fireEvent.changeText(screen.getByLabelText('Jelszó'), 'wrong');
    await fireEvent.press(screen.getByText('Belépés'));

    expect(await screen.findByText('Hibás e-mail-cím vagy jelszó.')).toBeOnTheScreen();
  });

  it('sends a user with an unconfirmed email to the code screen (D-004)', async () => {
    startSignedInAs(null);
    auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: new AuthApiError('Email not confirmed', 400, 'email_not_confirmed'),
    } as never);
    await renderRouter(APP_DIR);

    await fireEvent.changeText(screen.getByLabelText('E-mail-cím'), EMAIL);
    await fireEvent.changeText(screen.getByLabelText('Jelszó'), 'secret-password');
    await fireEvent.press(screen.getByText('Belépés'));

    expect(await screen.findByText(/még nincs megerősítve/)).toBeOnTheScreen();
  });

  it('registers a person: profile and taste first, the email code last (D-009)', async () => {
    startSignedInAs(null);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    mockedApi.checkUsername.mockResolvedValue('available');
    mockedApi.createProfile.mockResolvedValue({
      profile: { ...readyProfile, tasteCompleted: false, topGenres: [] },
    });
    mockedApi.saveTaste.mockResolvedValue({
      profile: { ...readyProfile, topGenres: ['rock', 'techno', 'jazz'] },
    });
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{}] } }, error: null } as never);
    auth.verifyOtp.mockImplementation(async () => {
      emitAuth('SIGNED_IN', sessionFor(USER_ID));
      return { data: {}, error: null } as never;
    });
    await renderRouter(APP_DIR, { initialUrl: '/register' });

    await fireEvent.changeText(screen.getByLabelText('E-mail-cím'), EMAIL);
    await fireEvent.changeText(screen.getByLabelText('Jelszó'), 'secret-password');
    await fireEvent.changeText(screen.getByLabelText('Megjelenített név'), 'Fekete Olivér');
    await fireEvent.changeText(screen.getByLabelText('Felhasználónév'), 'oli.fekete');
    expect(await screen.findByText('Szabad felhasználónév.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Elmúltam 18 éves'));
    await fireEvent.press(screen.getByText('Elfogadom az adatvédelmi tájékoztatót'));
    await fireEvent.press(screen.getByText('Tovább'));

    await fireEvent.press(await screen.findByText('Műfajok kiválasztása'));
    await fireEvent.press(await screen.findByLabelText('Rock'));
    await fireEvent.press(screen.getByLabelText('Techno'));
    await fireEvent.press(screen.getByLabelText('Jazz'));
    // Nothing reaches the server before the code.
    expect(auth.signUp).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Tovább: e-mail-cím megerősítése'));

    expect(auth.signUp).toHaveBeenCalledWith({
      email: EMAIL,
      password: 'secret-password',
      options: { data: { account_type: 'person' } },
    });
    expect(await screen.findByText(`Elküldtük a 6 jegyű kódot ide: ${EMAIL}`)).toBeOnTheScreen();
    expect(mockedApi.createProfile).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Kód'), '123456');
    await fireEvent.press(screen.getByText('Megerősítés'));

    // The code completes the registration: the profile and the taste are saved on their own.
    expect(await screen.findByText('Ajánlott események')).toBeOnTheScreen();
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: EMAIL, token: '123456', type: 'email' });
    expect(mockedApi.createProfile).toHaveBeenCalledWith({
      displayName: 'Fekete Olivér',
      username: 'oli.fekete',
      avatarPath: null,
      adultConfirmed: true,
      privacyAccepted: true,
    });
    expect(mockedApi.saveTaste).toHaveBeenCalledWith(['rock', 'techno', 'jazz']);
    // A second sign-up of an unconfirmed address keeps the latest password and account type.
    expect(auth.updateUser).toHaveBeenCalledWith({ data: { account_type: 'person' } });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'secret-password' });
  });

  it('saves the profile after signing in to an earlier, unfinished registration (D-009)', async () => {
    startSignedInAs(null);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    mockedApi.checkUsername.mockResolvedValue('available');
    mockedApi.createProfile.mockResolvedValue({
      profile: { ...readyProfile, tasteCompleted: false, topGenres: [] },
    });
    mockedApi.saveTaste.mockResolvedValue({ profile: readyProfile });
    // Supabase answers an existing, confirmed address without identities.
    auth.signUp.mockResolvedValue({ data: { user: { identities: [] } }, error: null } as never);
    auth.signInWithPassword.mockImplementation(async () => {
      emitAuth('SIGNED_IN', sessionFor(USER_ID));
      return { data: {}, error: null } as never;
    });
    await renderRouter(APP_DIR, { initialUrl: '/register' });

    await fireEvent.changeText(screen.getByLabelText('E-mail-cím'), EMAIL);
    await fireEvent.changeText(screen.getByLabelText('Jelszó'), 'secret-password');
    await fireEvent.changeText(screen.getByLabelText('Megjelenített név'), 'Fekete Olivér');
    await fireEvent.changeText(screen.getByLabelText('Felhasználónév'), 'oli.fekete');
    await screen.findByText('Szabad felhasználónév.');
    await fireEvent.press(screen.getByText('Elmúltam 18 éves'));
    await fireEvent.press(screen.getByText('Elfogadom az adatvédelmi tájékoztatót'));
    await fireEvent.press(screen.getByText('Tovább'));
    await fireEvent.press(await screen.findByText('Műfajok kiválasztása'));
    await fireEvent.press(await screen.findByLabelText('Rock'));
    await fireEvent.press(screen.getByLabelText('Techno'));
    await fireEvent.press(screen.getByLabelText('Jazz'));
    await fireEvent.press(screen.getByText('Tovább: e-mail-cím megerősítése'));

    expect(
      await screen.findByText(/^Ezzel az e-mail-címmel már van fiók\. Ha korábban/),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Belépés'));
    await fireEvent.changeText(await screen.findByLabelText('E-mail-cím'), EMAIL);
    await fireEvent.changeText(screen.getByLabelText('Jelszó'), 'secret-password');
    await fireEvent.press(screen.getByText('Belépés'));

    expect(await screen.findByText('Ajánlott események')).toBeOnTheScreen();
    expect(mockedApi.saveTaste).toHaveBeenCalledWith(['rock', 'techno', 'jazz']);
  });
});

describe('onboarding (D-004)', () => {
  it('creates the profile with the 18+ and privacy confirmations', async () => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    mockedApi.checkUsername.mockResolvedValue('available');
    mockedApi.createProfile.mockResolvedValue({
      profile: { ...readyProfile, tasteCompleted: false },
    });
    await renderRouter(APP_DIR);

    await fireEvent.changeText(await screen.findByLabelText('Megjelenített név'), 'Fekete Olivér');
    await fireEvent.changeText(screen.getByLabelText('Felhasználónév'), 'Oli.Fekete');
    expect(await screen.findByText('Szabad felhasználónév.')).toBeOnTheScreen();
    expect(mockedApi.checkUsername).toHaveBeenCalledWith('oli.fekete');

    await fireEvent.press(screen.getByText('Elmúltam 18 éves'));
    await fireEvent.press(screen.getByText('Elfogadom az adatvédelmi tájékoztatót'));
    await fireEvent.press(screen.getByText('Tovább'));

    expect(mockedApi.createProfile).toHaveBeenCalledWith({
      displayName: 'Fekete Olivér',
      username: 'oli.fekete',
      avatarPath: null,
      adultConfirmed: true,
      privacyAccepted: true,
    });
    expect(await screen.findByText('Műfajok kiválasztása')).toBeOnTheScreen();
  });

  it('does not continue without the 18+ confirmation', async () => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    mockedApi.checkUsername.mockResolvedValue('available');
    await renderRouter(APP_DIR);

    await fireEvent.changeText(await screen.findByLabelText('Megjelenített név'), 'Oli');
    await fireEvent.changeText(screen.getByLabelText('Felhasználónév'), 'oli');
    await screen.findByText('Szabad felhasználónév.');
    await fireEvent.press(screen.getByText('Elfogadom az adatvédelmi tájékoztatót'));
    await fireEvent.press(screen.getByText('Tovább'));

    expect(mockedApi.createProfile).not.toHaveBeenCalled();
  });

  it('requires choosing 3–10 genres in order before Home (D-001, D-005)', async () => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({ profile: { ...readyProfile, tasteCompleted: false } });
    mockedApi.saveTaste.mockResolvedValue({
      profile: { ...readyProfile, topGenres: ['rock', 'techno', 'jazz'] },
    });
    await renderRouter(APP_DIR);

    expect(navbarLabels()).toEqual([]);
    expect(await screen.findByText('Spotify összekötése – hamarosan')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Műfajok kiválasztása'));
    await fireEvent.press(await screen.findByLabelText('Rock'));
    await fireEvent.press(screen.getByLabelText('Techno'));
    await fireEvent.press(screen.getByText('Tovább'));
    expect(mockedApi.saveTaste).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Jazz'));
    expect(screen.getByLabelText('Rock, 1. hely')).toBeOnTheScreen();
    expect(screen.getByText('Leginkább kedvelt')).toBeOnTheScreen();
    expect(screen.getByText('Kevésbé kedvelt')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Tovább'));

    expect(mockedApi.saveTaste).toHaveBeenCalledWith(['rock', 'techno', 'jazz']);
    expect(await screen.findByText('Ajánlott események')).toBeOnTheScreen();
  });
});

describe('partner accounts (D-008)', () => {
  const partnerInfo: PartnerInfo = {
    status: 'pending',
    rejectionReason: null,
    companyName: 'Fogasház Kft.',
    taxNumber: '10773381-2-44',
    contactName: 'Kiss Anna',
    contactPhone: '+36 30 123 4567',
    address: '1073 Budapest, Akácfa utca 51.',
    website: null,
    bio: null,
  };
  const partnerProfile = (partner: Partial<PartnerInfo> = {}, verified = false): Profile => ({
    id: USER_ID,
    username: 'fogashaz',
    displayName: 'Fogasház',
    avatarUrl: null,
    tasteCompleted: false,
    topGenres: [],
    accountType: 'partner',
    verified,
    partner: { ...partnerInfo, ...partner },
    isAdmin: false,
  });

  /** The whole partner sign-up form: the sign-in details and the application. */
  async function fillPartnerSignup() {
    await fireEvent.press(screen.getByText('Partnerregisztráció'));
    await fireEvent.changeText(
      await screen.findByLabelText('Céges e-mail-cím'),
      'info@fogashaz.hu',
    );
    await fireEvent.changeText(screen.getByLabelText('Jelszó'), 'secret-password');
    await fireEvent.changeText(screen.getByLabelText('Nyilvános név'), 'Fogasház');
    await fireEvent.changeText(screen.getByLabelText('Felhasználónév'), 'fogashaz');
    await fireEvent.changeText(screen.getByLabelText('Cégnév'), 'Fogasház Kft.');
    await fireEvent.changeText(screen.getByLabelText('Adószám'), '12345676-2-42');
    await fireEvent.changeText(screen.getByLabelText('Kapcsolattartó neve'), 'Kiss Anna');
    await fireEvent.changeText(
      screen.getByLabelText('Kapcsolattartó telefonszáma'),
      '+36 30 123 4567',
    );
    await fireEvent.changeText(
      screen.getByLabelText('A helyszín címe'),
      '1073 Budapest, Akácfa utca 51.',
    );
    expect(await screen.findByText('Szabad felhasználónév.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Elfogadom a partneri feltételeket'));
    await fireEvent.press(screen.getByText('Elfogadom az adatvédelmi tájékoztatót'));
  }

  const expectedApplication = {
    displayName: 'Fogasház',
    username: 'fogashaz',
    avatarPath: null,
    companyName: 'Fogasház Kft.',
    taxNumber: '12345676-2-42',
    contactName: 'Kiss Anna',
    contactPhone: '+36 30 123 4567',
    address: '1073 Budapest, Akácfa utca 51.',
    website: null,
    termsAccepted: true,
    privacyAccepted: true,
  };

  function codeSignsInAsPartner() {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{}] } }, error: null } as never);
    auth.verifyOtp.mockImplementation(async () => {
      emitAuth('SIGNED_IN', sessionFor(USER_ID, 'partner', 'info@fogashaz.hu'));
      return { data: {}, error: null } as never;
    });
  }

  it('registers a partner: the application first, the email code last (D-008/22)', async () => {
    startSignedInAs(null);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    mockedApi.checkUsername.mockResolvedValue('available');
    mockedApi.submitPartnerApplication.mockResolvedValue({ profile: partnerProfile() });
    codeSignsInAsPartner();
    await renderRouter(APP_DIR);

    await fillPartnerSignup();
    // No 18+ box for a company, and nothing is sent before the code.
    expect(screen.queryByText('Elmúltam 18 éves')).toBeNull();
    await fireEvent.press(screen.getByText('Tovább: e-mail-cím megerősítése'));
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'info@fogashaz.hu',
      password: 'secret-password',
      options: { data: { account_type: 'partner' } },
    });
    expect(mockedApi.submitPartnerApplication).not.toHaveBeenCalled();

    await fireEvent.changeText(await screen.findByLabelText('Kód'), '123456');
    await fireEvent.press(screen.getByText('Megerősítés'));

    // The code completes the sign-up: the application goes out on its own.
    expect(await screen.findByText('A partnerkérelmed elbírálás alatt')).toBeOnTheScreen();
    expect(mockedApi.submitPartnerApplication).toHaveBeenCalledWith(expectedApplication);
    expect(screen.getByText('Események a közelben')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual(['Csevegőtér', 'Home', 'Profilkereső']);
  });

  it('brings the form back, filled in, when sending fails after the code', async () => {
    startSignedInAs(null);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    mockedApi.checkUsername.mockResolvedValue('available');
    mockedApi.submitPartnerApplication.mockRejectedValue(new ApiError('name_protected', 409));
    codeSignsInAsPartner();
    await renderRouter(APP_DIR);

    await fillPartnerSignup();
    await fireEvent.press(screen.getByText('Tovább: e-mail-cím megerősítése'));
    await fireEvent.changeText(await screen.findByLabelText('Kód'), '123456');
    await fireEvent.press(screen.getByText('Megerősítés'));

    expect(
      await screen.findByText('Ez a név egy hitelesített partneré, vagy nagyon hasonlít hozzá.'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Cégnév').props.value).toBe('Fogasház Kft.');
    expect(screen.getByText('Kérelem beküldése')).toBeOnTheScreen();
  });

  it('sends the application after signing in to an earlier, unfinished account', async () => {
    startSignedInAs(null);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    mockedApi.checkUsername.mockResolvedValue('available');
    mockedApi.submitPartnerApplication.mockResolvedValue({ profile: partnerProfile() });
    // Supabase answers an existing, confirmed address without identities.
    auth.signUp.mockResolvedValue({ data: { user: { identities: [] } }, error: null } as never);
    auth.signInWithPassword.mockImplementation(async () => {
      emitAuth('SIGNED_IN', sessionFor(USER_ID, 'partner', 'info@fogashaz.hu'));
      return { data: {}, error: null } as never;
    });
    await renderRouter(APP_DIR);

    await fillPartnerSignup();
    await fireEvent.press(screen.getByText('Tovább: e-mail-cím megerősítése'));
    expect(
      await screen.findByText(/^Ezzel az e-mail-címmel már van fiók\. Ha korábban/),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Belépés'));

    await fireEvent.changeText(await screen.findByLabelText('E-mail-cím'), 'info@fogashaz.hu');
    await fireEvent.changeText(screen.getByLabelText('Jelszó'), 'secret-password');
    await fireEvent.press(screen.getByText('Belépés'));

    expect(await screen.findByText('A partnerkérelmed elbírálás alatt')).toBeOnTheScreen();
    expect(mockedApi.submitPartnerApplication).toHaveBeenCalledWith(expectedApplication);
  });

  it('explains a wrong tax number, and accepts the example it shows', async () => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    auth.onAuthStateChange.mockImplementation((callback) => {
      emitAuth = callback as AuthCallback;
      emitAuth('INITIAL_SESSION', sessionFor(USER_ID, 'partner'));
      return { data: { subscription: { unsubscribe: jest.fn() } } } as never;
    });
    await renderRouter(APP_DIR);
    const field = await screen.findByLabelText('Adószám');
    expect(screen.getByText('Például 12345676-2-42. Csak mi látjuk.')).toBeOnTheScreen();

    // No complaint while typing; then a check digit that cannot be right.
    await fireEvent.changeText(field, '1234567');
    expect(screen.queryByText(/^Az adószám formája/)).toBeNull();
    await fireEvent.changeText(field, '12345678-2-44');
    expect(screen.getByText(/^Ilyen adószám nem létezhet/)).toBeOnTheScreen();

    // The example under the field is valid, so it also works as test data.
    await fireEvent.changeText(field, '12345676-2-42');
    expect(screen.queryByText(/^Ilyen adószám nem létezhet/)).toBeNull();

    // A wrong shape gets its own explanation once the field is left.
    await fireEvent.changeText(field, '1234-5');
    await fireEvent(field, 'blur');
    expect(screen.getByText(/^Az adószám formája/)).toBeOnTheScreen();
  });

  it('shows a rejected partner the reason and takes a corrected application', async () => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({
      profile: partnerProfile({ status: 'rejected', rejectionReason: 'Hibás adószám' }),
    });
    mockedApi.resubmitPartnerApplication.mockResolvedValue({ profile: partnerProfile() });
    await renderRouter(APP_DIR);

    expect(await screen.findByText('A partnerkérelmedet elutasítottuk')).toBeOnTheScreen();
    expect(screen.getByText('Indoklás: Hibás adószám')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Kérelem javítása'));

    const phone = await screen.findByLabelText('Kapcsolattartó telefonszáma');
    expect(screen.getByLabelText('Cégnév').props.value).toBe('Fogasház Kft.');
    expect(navbarLabels()).toEqual([]);
    await fireEvent.changeText(phone, '+36 30 765 4321');
    await fireEvent.press(screen.getByText('Kérelem újbóli beküldése'));

    expect(mockedApi.resubmitPartnerApplication).toHaveBeenCalledWith({
      displayName: 'Fogasház',
      companyName: 'Fogasház Kft.',
      taxNumber: '10773381-2-44',
      contactName: 'Kiss Anna',
      contactPhone: '+36 30 765 4321',
      address: '1073 Budapest, Akácfa utca 51.',
      website: null,
    });
    expect(await screen.findByText('A partnerkérelmed elbírálás alatt')).toBeOnTheScreen();
  });

  it('gives an approved partner the badge and a profile without genres or taste', async () => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({
      profile: partnerProfile({ status: 'approved', bio: 'Klub a VII. kerületben.' }, true),
    });
    await renderRouter(APP_DIR);
    await screen.findByText('Események a közelben');
    expect(screen.queryByText('A partnerkérelmed elbírálás alatt')).toBeNull();

    await act(() => router.push('/profile/me'));

    expect(await screen.findByLabelText('Hitelesített partner')).toBeOnTheScreen();
    expect(screen.getByText('Klub a VII. kerületben.')).toBeOnTheScreen();
    expect(screen.getByText('1073 Budapest, Akácfa utca 51.')).toBeOnTheScreen();
    expect(screen.queryByText('Legtöbbet látogatott hely')).toBeNull();

    await act(() => router.push('/settings'));
    expect(await screen.findByText('Kijelentkezés')).toBeOnTheScreen();
    expect(screen.queryByText('Ízlés módosítása')).toBeNull();
  });

  it('does not let a person take a name too close to a verified partner’s (D-008/5)', async () => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    mockedApi.checkUsername.mockResolvedValue('protected');
    await renderRouter(APP_DIR);

    await fireEvent.changeText(await screen.findByLabelText('Felhasználónév'), 'fogashaz.official');

    expect(
      await screen.findByText('Ez a név egy hitelesített partneré, vagy nagyon hasonlít hozzá.'),
    ).toBeOnTheScreen();
  });
});

describe('partner application review (D-008/23)', () => {
  const application: PartnerApplication = {
    userId: '7b6f1d2e-0000-4000-8000-000000000009',
    displayName: 'Fogasház',
    username: 'fogashaz',
    avatarUrl: null,
    accountEmail: 'info@fogashaz.hu',
    companyName: 'Fogasház Kft.',
    taxNumber: '10773381-2-44',
    contactName: 'Kiss Anna',
    contactPhone: '+36 30 123 4567',
    address: '1073 Budapest, Akácfa utca 51.',
    website: null,
    submittedAt: '2026-10-23T18:30:00.000Z',
  };

  beforeEach(() => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({ profile: { ...readyProfile, isAdmin: true } });
    mockedApi.getPartnerApplications.mockResolvedValue([application]);
    mockedApi.decidePartnerApplication.mockResolvedValue(undefined);
  });

  /** Settings → Partner applications → the application. */
  async function openApplication() {
    await renderRouter(APP_DIR);
    await screen.findByText('Ajánlott események');
    await act(() => router.push('/settings'));
    await fireEvent.press(await screen.findByText('Partnerkérelmek'));
    await fireEvent.press(await screen.findByText('Fogasház'));
    expect(await screen.findByText('10773381-2-44')).toBeOnTheScreen();
    expect(screen.getByText('info@fogashaz.hu')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual([]);
  }

  it('shows the menu to the team’s accounts only', async () => {
    mockedApi.getMe.mockResolvedValue({ profile: readyProfile });
    await renderRouter(APP_DIR);
    await screen.findByText('Ajánlott események');
    await act(() => router.push('/settings'));

    expect(await screen.findByText('Kijelentkezés')).toBeOnTheScreen();
    expect(screen.queryByText('Partnerkérelmek')).toBeNull();
  });

  it('approves an application after a confirmation', async () => {
    const alert = jest
      .spyOn(Alert, 'alert')
      .mockImplementationOnce((_title, _message, buttons) =>
        buttons?.find((button) => button.text === 'Jóváhagyás')?.onPress?.(),
      );
    await openApplication();
    mockedApi.getPartnerApplications.mockResolvedValue([]);

    await fireEvent.press(screen.getByText('Jóváhagyás'));

    expect(alert).toHaveBeenCalledWith(
      'Jóváhagyod a kérelmet?',
      expect.any(String),
      expect.any(Array),
    );
    expect(mockedApi.decidePartnerApplication).toHaveBeenCalledWith(application.userId, {
      decision: 'approve',
    });
    expect(await screen.findByText('Nincs elbírálásra váró partnerkérelem.')).toBeOnTheScreen();
  });

  it('rejects an application only with a reason', async () => {
    await openApplication();

    await fireEvent.press(screen.getByText('Elutasítás'));
    await fireEvent.press(screen.getByText('Elutasítás elküldése'));
    expect(screen.getByText('Írd le, miért utasítod el a kérelmet.')).toBeOnTheScreen();
    expect(mockedApi.decidePartnerApplication).not.toHaveBeenCalled();

    await fireEvent.changeText(
      screen.getByLabelText('Az elutasítás indoklása'),
      '  Az adószám nem a cégé.  ',
    );
    await fireEvent.press(screen.getByText('Elutasítás elküldése'));

    expect(mockedApi.decidePartnerApplication).toHaveBeenCalledWith(application.userId, {
      decision: 'reject',
      reason: 'Az adószám nem a cégé.',
    });
  });

  it('says so when the application was decided meanwhile', async () => {
    mockedApi.decidePartnerApplication.mockRejectedValue(new ApiError('not_found', 404));
    await openApplication();
    mockedApi.getPartnerApplications.mockResolvedValue([]);

    await fireEvent.press(screen.getByText('Elutasítás'));
    await fireEvent.changeText(screen.getByLabelText('Az elutasítás indoklása'), 'Hibás adatok');
    await fireEvent.press(screen.getByText('Elutasítás elküldése'));

    expect(await screen.findByText('Ezt a kérelmet közben már elbírálták.')).toBeOnTheScreen();
  });
});

describe('signed-in app (F4, F5, F7)', () => {
  beforeEach(() => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({ profile: readyProfile });
  });

  /** Opens the app (which starts on Home), then navigates like the user would. */
  async function openFromHome(path: string) {
    await renderRouter(APP_DIR);
    await screen.findByText('Ajánlott események');
    await act(() => router.push(path));
  }

  it('has exactly three navbar items in order, with Home opened first (Q21)', async () => {
    await renderRouter(APP_DIR);

    expect(await screen.findByText('Ajánlott események')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual(['Csevegőtér', 'Home', 'Profilkereső']);
  });

  it('keeps the navbar on screens opened inside a tab', async () => {
    await openFromHome('/map');

    expect(await screen.findByText('Távolság: 25 km')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual(['Csevegőtér', 'Home', 'Profilkereső']);
  });

  it('shows the recommended events in a grid, with an ad banner after six (F5, D-007/3)', async () => {
    mockedApi.getNearbyEvents.mockResolvedValue([
      ...['1', '2', '3', '4', '5', '6', '7'].map((id) =>
        eventSummary(id, { score: 0.5 - Number(id) / 100 }),
      ),
      eventSummary('no-match', { score: 0 }),
      eventSummary('too-far', { distanceKm: 40 }),
      eventSummary('ended', { endsAt: new Date(Date.now() - HOUR_MS).toISOString() }),
    ]);
    await renderRouter(APP_DIR);

    expect(await screen.findByText('Minta esemény 1')).toBeOnTheScreen();
    expect(screen.getByText('Minta esemény 7')).toBeOnTheScreen();
    expect(screen.getAllByText('Most zajlik')).toHaveLength(7);
    expect(screen.getAllByText('Hirdetés')).toHaveLength(1);
    for (const hidden of ['no-match', 'too-far', 'ended']) {
      expect(screen.queryByText(`Minta esemény ${hidden}`)).toBeNull();
    }
    // F1: measured from the phone's position, rounded to about 100 m.
    expect(mockedApi.getNearbyEvents).toHaveBeenCalledWith({ lat: 47.498, lng: 19.04 });
  });

  it('opens the event page with the ticket button, keeping the navbar (Q8, D-007/4)', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const summary = eventSummary('1');
    const detail: EventDetail = {
      id: summary.id,
      title: summary.title,
      kind: summary.kind,
      startsAt: summary.startsAt,
      endsAt: summary.endsAt,
      venue: summary.venue,
      genres: ['techno', 'house'],
      performers: ['Minta DJ'],
    };
    mockedApi.getNearbyEvents.mockResolvedValue([summary]);
    mockedApi.getEvent.mockResolvedValue(detail);
    await renderRouter(APP_DIR);

    await fireEvent.press(await screen.findByText('Minta esemény 1'));

    expect(await screen.findByText('Minta DJ')).toBeOnTheScreen();
    expect(mockedApi.getEvent).toHaveBeenCalledWith('1');
    expect(screen.getByText('1072 Budapest, Minta utca 1.')).toBeOnTheScreen();
    expect(screen.getByText('House')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual(['Csevegőtér', 'Home', 'Profilkereső']);

    await fireEvent.press(screen.getByText('Jegyvásárlás'));
    expect(alert).toHaveBeenCalledWith('Hamarosan elérhető', expect.any(String));
    expect(screen.getByText('Megnyitás a térképen')).toBeOnTheScreen();
  });

  it('measures from the centre of Budapest without location access, and says so (F5)', async () => {
    jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({
      status: Location.PermissionStatus.DENIED,
      granted: false,
      canAskAgain: false,
      expires: 'never',
    });
    await renderRouter(APP_DIR);

    expect(await screen.findByText(/^Nem ismerjük a helyzeted/)).toBeOnTheScreen();
    expect(mockedApi.getNearbyEvents).toHaveBeenCalledWith(LAUNCH_CITY_CENTER);
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        'A beállított távolságon belül most nincs neked ajánlott esemény. Növeld a távolságot a térképen.',
      ),
    ).toBeOnTheScreen();

    // The map measures from the same centre, and there is no own position to go back to.
    await act(() => router.push('/map'));
    expect(await screen.findByText('Távolság: 25 km')).toBeOnTheScreen();
    expect(screen.getByTestId('map-circle').props.center).toEqual({
      latitude: LAUNCH_CITY_CENTER.lat,
      longitude: LAUNCH_CITY_CENTER.lng,
    });
    expect(screen.queryByLabelText('Vissza a pozíciómhoz')).toBeNull();
  });

  it('suggests a larger distance only while the slider can still grow (P-02)', async () => {
    mockedApi.getSettings.mockResolvedValue({ searchRadiusKm: 200 });
    await renderRouter(APP_DIR);

    expect(
      await screen.findByText('A beállított távolságon belül most nincs neked ajánlott esemény.'),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/Növeld a távolságot/)).toBeNull();
  });

  it('saves the distance from the map’s slider, and the grid follows it (Q6)', async () => {
    mockedApi.getNearbyEvents.mockResolvedValue([eventSummary('far', { distanceKm: 40 })]);
    mockedApi.saveSettings.mockResolvedValue({ searchRadiusKm: 60 });
    await openFromHome('/map');

    expect(await screen.findByLabelText(/^Minta esemény far, Minta Klub$/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Vissza a pozíciómhoz')).toBeOnTheScreen();
    expect(screen.getByTestId('map-circle').props.radius).toBe(25_000);

    const slider = screen.getByLabelText('Keresési távolság');
    await fireEvent(slider, 'valueChange', 60);
    expect(screen.getByText('Távolság: 60 km')).toBeOnTheScreen();
    // The circle follows the slider while it moves.
    expect(screen.getByTestId('map-circle').props.radius).toBe(60_000);
    await fireEvent(slider, 'slidingComplete', 60);

    expect(mockedApi.saveSettings).toHaveBeenCalledWith({ searchRadiusKm: 60 });
    expect(
      await screen.findByLabelText(/^Minta esemény far, Minta Klub, ajánlott$/),
    ).toBeOnTheScreen();

    // Back on Home, the 40 km away event is now within the distance, so it is recommended.
    await act(() => router.back());
    expect(await screen.findByText('Minta esemény far')).toBeOnTheScreen();
  });

  it('hides the navbar on another profile and toggles Follow/Unfollow', async () => {
    await openFromHome('/profile/sample-user');

    await fireEvent.press(await screen.findByText('Követés'));

    expect(navbarLabels()).toEqual([]);
    expect(screen.getByText('Kikövetés')).toBeOnTheScreen();
    expect(screen.getByText('1 Követők')).toBeOnTheScreen();
  });

  it('shows the own profile with its names and without a Follow button', async () => {
    await openFromHome('/profile/me');

    expect(await screen.findByText('Fekete Olivér')).toBeOnTheScreen();
    expect(screen.getByText('@oli.fekete')).toBeOnTheScreen();
    for (const genre of ['Techno', 'House', 'Pop']) {
      expect(screen.getByText(genre)).toBeOnTheScreen();
    }
    expect(screen.queryByText('Követés')).toBeNull();
    expect(navbarLabels()).toEqual([]);
  });

  it('edits the own profile after tapping it, without a navbar (D-006)', async () => {
    mockedApi.updateProfile.mockResolvedValue({
      profile: { ...readyProfile, displayName: 'Oli' },
    });
    await openFromHome('/profile/me');

    await fireEvent.press(await screen.findByLabelText('Profil szerkesztése'));
    const nameField = await screen.findByLabelText('Megjelenített név');
    expect(screen.getByText('A felhasználónév nem módosítható.')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual([]);

    await fireEvent.changeText(nameField, 'Oli');
    await fireEvent.press(screen.getByText('Mentés'));

    expect(mockedApi.updateProfile).toHaveBeenCalledWith({ displayName: 'Oli' });
    expect(await screen.findByText('Oli')).toBeOnTheScreen();
  });

  it('changes the taste order from Settings (D-001/4)', async () => {
    mockedApi.getTaste.mockResolvedValue(['techno', 'house', 'pop']);
    mockedApi.saveTaste.mockResolvedValue({ profile: readyProfile });
    await openFromHome('/settings');

    await fireEvent.press(await screen.findByText('Ízlés módosítása'));
    expect(await screen.findByLabelText('Techno, 1. hely')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual([]);

    await fireEvent.press(screen.getByLabelText('Pop, 3. hely'));
    await fireEvent.press(screen.getByLabelText('Rock'));
    await fireEvent.press(screen.getByText('Mentés'));

    expect(mockedApi.saveTaste).toHaveBeenCalledWith(['techno', 'house', 'rock']);
  });

  it('opens Settings without a navbar and signs out from there (D-004)', async () => {
    auth.signOut.mockImplementation(async () => {
      emitAuth('SIGNED_OUT', null);
      return { error: null };
    });
    await openFromHome('/settings');

    await fireEvent.press(await screen.findByText('Kijelentkezés'));

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(await screen.findByText('Belépés')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual([]);
  });

  it('switches the language from Settings (D-002)', async () => {
    await openFromHome('/settings');

    await fireEvent.press(await screen.findByText('English'));

    expect(usePreferencesStore.getState().language).toBe('en');
    expect(await screen.findByText('Sign out')).toBeOnTheScreen();
  });
});
