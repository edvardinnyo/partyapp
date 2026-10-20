import { type AuthChangeEvent, AuthApiError, type Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import type { Profile } from '@shared/contracts/profile';
import { useAuthStore } from '@/features/auth/auth-store';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import i18n from '@/i18n';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      verifyOtp: jest.fn(),
      resend: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock('@/lib/api', () => ({
  ApiError: jest.requireActual('@/lib/api').ApiError,
  api: {
    getMe: jest.fn(),
    isUsernameAvailable: jest.fn(),
    createAvatarUpload: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    getTaste: jest.fn(),
    saveTaste: jest.fn(),
    deleteAccount: jest.fn(),
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
};

type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void;
let emitAuth: AuthCallback = () => {};

function sessionFor(userId: string | null): Session | null {
  return userId ? ({ user: { id: userId } } as unknown as Session) : null;
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

beforeEach(async () => {
  jest.clearAllMocks();
  queryClient.clear();
  useAuthStore.setState({ status: 'loading', userId: null, isRecoveringPassword: false });
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

  it('signs up, then confirms the email with the 6-digit code (D-004)', async () => {
    startSignedInAs(null);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{}] } }, error: null } as never);
    auth.verifyOtp.mockImplementation(async () => {
      emitAuth('SIGNED_IN', sessionFor(USER_ID));
      return { data: {}, error: null } as never;
    });
    await renderRouter(APP_DIR, { initialUrl: '/register' });

    await fireEvent.changeText(screen.getByLabelText('E-mail-cím'), EMAIL);
    await fireEvent.changeText(screen.getByLabelText('Jelszó'), 'secret-password');
    await fireEvent.press(screen.getByText('Regisztráció'));

    expect(await screen.findByText(`Elküldtük a 6 jegyű kódot ide: ${EMAIL}`)).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Kód'), '123456');
    await fireEvent.press(screen.getByText('Megerősítés'));

    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: EMAIL, token: '123456', type: 'email' });
    expect(await screen.findByLabelText('Megjelenített név')).toBeOnTheScreen();
  });
});

describe('onboarding (D-004)', () => {
  it('creates the profile with the 18+ and privacy confirmations', async () => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    mockedApi.isUsernameAvailable.mockResolvedValue(true);
    mockedApi.createProfile.mockResolvedValue({
      profile: { ...readyProfile, tasteCompleted: false },
    });
    await renderRouter(APP_DIR);

    await fireEvent.changeText(await screen.findByLabelText('Megjelenített név'), 'Fekete Olivér');
    await fireEvent.changeText(screen.getByLabelText('Felhasználónév'), 'Oli.Fekete');
    expect(await screen.findByText('Szabad felhasználónév.')).toBeOnTheScreen();
    expect(mockedApi.isUsernameAvailable).toHaveBeenCalledWith('oli.fekete');

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
    expect(await screen.findByText('Inkább kiválasztom magam')).toBeOnTheScreen();
  });

  it('does not continue without the 18+ confirmation', async () => {
    startSignedInAs(USER_ID);
    mockedApi.getMe.mockResolvedValue({ profile: null });
    mockedApi.isUsernameAvailable.mockResolvedValue(true);
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
    await fireEvent.press(screen.getByText('Inkább kiválasztom magam'));
    await fireEvent.press(await screen.findByLabelText('Rock'));
    await fireEvent.press(screen.getByLabelText('Techno'));
    await fireEvent.press(screen.getByText('Tovább'));
    expect(mockedApi.saveTaste).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Jazz'));
    expect(screen.getByLabelText('Rock, 1. hely')).toBeOnTheScreen();
    expect(screen.getByText('legkedvencebb')).toBeOnTheScreen();
    expect(screen.getByText('simán csak kedvelt')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Tovább'));

    expect(mockedApi.saveTaste).toHaveBeenCalledWith(['rock', 'techno', 'jazz']);
    expect(await screen.findByText('Ajánlott események')).toBeOnTheScreen();
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

    expect(await screen.findByText(/^Térkép a pozícióddal/)).toBeOnTheScreen();
    expect(navbarLabels()).toEqual(['Csevegőtér', 'Home', 'Profilkereső']);
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
