// Starts the dev server on the local network under a nip.io name, e.g. 192.168.0.170.nip.io,
// which public DNS resolves back to that same address. Supabase never redirects to a bare IP
// address, so Google sign-in in Expo Go needs a host name; this avoids the slower ngrok tunnel.
const { spawn } = require('node:child_process');
const os = require('node:os');

const PRIVATE_RANGES = [/^192\.168\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./];

function lanAddress() {
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((address) => address && address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);
  for (const range of PRIVATE_RANGES) {
    const match = addresses.find((address) => range.test(address));
    if (match) {
      return match;
    }
  }
  return null;
}

const address = lanAddress();
if (!address) {
  console.error('No local network address found. Use `npm run start:tunnel` instead.');
  process.exit(1);
}

const hostname = `${address}.nip.io`;
console.log(`Dev server host: ${hostname}`);

const child = spawn('npx', ['expo', 'start', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: hostname },
});
child.on('exit', (code) => process.exit(code ?? 0));
