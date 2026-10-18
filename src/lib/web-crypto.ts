import { CryptoDigestAlgorithm, digest, getRandomValues } from 'expo-crypto';

type WebCryptoHost = { crypto?: object };

function randomValues<T extends ArrayBufferView | null>(array: T): T {
  if (array === null) {
    return array;
  }
  getRandomValues(array as unknown as Uint8Array);
  return array;
}

const subtle: Pick<SubtleCrypto, 'digest'> = {
  async digest(algorithm, data) {
    const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
    if (name.toUpperCase() !== CryptoDigestAlgorithm.SHA256) {
      throw new Error(`Unsupported digest algorithm: ${name}`);
    }
    return digest(CryptoDigestAlgorithm.SHA256, data);
  },
};

function define(target: object, key: string, value: unknown) {
  Object.defineProperty(target, key, { value, configurable: true, writable: true });
}

/**
 * supabase-js uses Web Crypto for PKCE: a random code verifier and its SHA-256 challenge.
 * Hermes has no Web Crypto, and supabase-js then falls back to Math.random and the weaker
 * "plain" challenge. This adds just those two functions, backed by expo-crypto, and leaves an
 * existing implementation untouched.
 */
export function installWebCrypto(host: WebCryptoHost): void {
  if (!host.crypto) {
    define(host, 'crypto', {});
  }
  const webCrypto = host.crypto as Partial<Crypto>;
  if (typeof webCrypto.getRandomValues !== 'function') {
    define(webCrypto, 'getRandomValues', randomValues);
  }
  if (!webCrypto.subtle) {
    define(webCrypto, 'subtle', subtle);
  }
}
