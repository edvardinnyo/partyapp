// The OAuth redirect (…/auth/callback) is consumed by WebBrowser.openAuthSessionAsync;
// when Android also delivers it as a deep link, send it to the root instead of a missing screen.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return path.includes('auth/callback') ? '/' : path;
}
