import { digest } from 'expo-crypto';

import { installWebCrypto } from './web-crypto';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digest: jest.fn(async () => new ArrayBuffer(32)),
  getRandomValues: jest.fn((array: Uint32Array) => array.fill(7)),
}));

describe('installWebCrypto', () => {
  it('adds random values and a SHA-256 digest where Web Crypto is missing', async () => {
    const host: { crypto?: object } = {};

    installWebCrypto(host);
    const webCrypto = host.crypto as Crypto;

    expect(webCrypto.getRandomValues(new Uint32Array(2))).toEqual(new Uint32Array([7, 7]));
    await webCrypto.subtle.digest('SHA-256', new Uint8Array([1]));
    expect(digest).toHaveBeenCalledWith('SHA-256', new Uint8Array([1]));
    await expect(webCrypto.subtle.digest('SHA-1', new Uint8Array([1]))).rejects.toThrow(
      'Unsupported digest algorithm',
    );
  });

  it('keeps an existing Web Crypto implementation', () => {
    const existing = { getRandomValues: jest.fn(), subtle: {} };
    const host = { crypto: existing };

    installWebCrypto(host);

    expect(host.crypto).toBe(existing);
    expect(host.crypto.getRandomValues).toBe(existing.getRandomValues);
    expect(host.crypto.subtle).toBe(existing.subtle);
  });
});
