import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { useSessionStore } from '@/features/auth/session-store';
import i18n from '@/i18n';

const APP_DIR = 'src/app';
const NAVBAR_LABELS = /^(Csevegőtér|Home|Profilkereső)$/;

function navbarLabels() {
  return screen.queryAllByText(NAVBAR_LABELS).map((element) => element.props.children);
}

beforeAll(async () => {
  await i18n.changeLanguage('hu');
});

beforeEach(() => {
  useSessionStore.setState({ isSignedIn: false });
});

describe('navigation skeleton', () => {
  it('starts on the sign-in screen when signed out, without a navbar (F6, Q21)', async () => {
    await renderRouter(APP_DIR);

    expect(screen.getByText('Belépés')).toBeOnTheScreen();
    expect(screen.getByText('Regisztráció')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual([]);
  });

  it('opens Home after signing in (F5, F6)', async () => {
    await renderRouter(APP_DIR);

    await fireEvent.press(screen.getByText('Belépés'));

    // The protected-route redirect happens asynchronously.
    expect(await screen.findByText('Ajánlott események')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual(['Csevegőtér', 'Home', 'Profilkereső']);
  });

  it('goes through the streaming sync after signing up (F6)', async () => {
    await renderRouter(APP_DIR);

    await fireEvent.press(screen.getByText('Regisztráció'));

    expect(screen.getByText('Inkább kiválasztom magam')).toBeOnTheScreen();
    expect(navbarLabels()).toEqual([]);
  });

  it('has exactly three navbar items in order, with Home opened first (F7, Q21)', async () => {
    useSessionStore.setState({ isSignedIn: true });
    await renderRouter(APP_DIR);

    expect(navbarLabels()).toEqual(['Csevegőtér', 'Home', 'Profilkereső']);
    expect(screen.getByText('Ajánlott események')).toBeOnTheScreen();
  });

  it('keeps the navbar on screens opened inside a tab (F7)', async () => {
    useSessionStore.setState({ isSignedIn: true });
    await renderRouter(APP_DIR, { initialUrl: '/map' });

    expect(screen.getByText(/^Térkép a pozícióddal/)).toBeOnTheScreen();
    expect(navbarLabels()).toEqual(['Csevegőtér', 'Home', 'Profilkereső']);
  });

  it('hides the navbar on another profile and toggles Follow/Unfollow (F4, F7)', async () => {
    useSessionStore.setState({ isSignedIn: true });
    await renderRouter(APP_DIR, { initialUrl: '/profile/sample-user' });

    expect(navbarLabels()).toEqual([]);

    await fireEvent.press(screen.getByText('Követés'));

    expect(screen.getByText('Kikövetés')).toBeOnTheScreen();
    expect(screen.getByText('1 Követők')).toBeOnTheScreen();
  });

  it('shows the same layout without a Follow button on the own profile (F4)', async () => {
    useSessionStore.setState({ isSignedIn: true });
    await renderRouter(APP_DIR, { initialUrl: '/profile/me' });

    expect(navbarLabels()).toEqual([]);
    expect(screen.getByText('Legtöbbet látogatott hely')).toBeOnTheScreen();
    expect(screen.queryByText('Követés')).toBeNull();
  });
});
