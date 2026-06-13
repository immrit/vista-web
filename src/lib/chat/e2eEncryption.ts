/**
 * E2EE compatible with Flutter `E2EEncryptionService` (X25519 + AES-GCM).
 * Client-only — private keys stay in localStorage on this device.
 */

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const privKeyStorage = (userId: string) => `e2e_priv_${userId}`;
const pubKeyStorage = (userId: string) => `e2e_pub_${userId}`;
export const peerPubKeyStorage = (conversationId: string) => `e2e_peer_pub_${conversationId}`;

export function isE2EESupported(): boolean {
  return typeof window !== 'undefined' && typeof crypto !== 'undefined' && !!crypto.subtle?.deriveBits;
}

export function getPeerPublicKeyBase64(conversationId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(peerPubKeyStorage(conversationId));
}

export function setPeerPublicKeyBase64(conversationId: string, value: string): void {
  localStorage.setItem(peerPubKeyStorage(conversationId), value);
}

export async function generateAndSaveKeyPair(userId: string): Promise<void> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'X25519', namedCurve: 'X25519' },
    true,
    ['deriveBits'],
  );
  const privBytes = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
  const pubBytes = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
  localStorage.setItem(privKeyStorage(userId), bytesToBase64(privBytes));
  localStorage.setItem(pubKeyStorage(userId), bytesToBase64(pubBytes));
}

async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const stored = localStorage.getItem(privKeyStorage(userId));
  if (!stored) return null;
  try {
    return crypto.subtle.importKey(
      'pkcs8',
      base64ToBytes(stored),
      { name: 'X25519', namedCurve: 'X25519' },
      true,
      ['deriveBits'],
    );
  } catch {
    return null;
  }
}

export async function ensureKeyPair(userId: string): Promise<void> {
  if (!(await getPrivateKey(userId))) {
    await generateAndSaveKeyPair(userId);
  }
}

export async function getPublicKeyBytes(userId: string): Promise<Uint8Array | null> {
  await ensureKeyPair(userId);
  const stored = localStorage.getItem(pubKeyStorage(userId));
  return stored ? base64ToBytes(stored) : null;
}

export async function computeSharedAesKey(userId: string, peerPublicKeyBase64: string): Promise<CryptoKey | null> {
  const privateKey = await getPrivateKey(userId);
  if (!privateKey) return null;

  const peerBytes = base64ToBytes(peerPublicKeyBase64);
  const peerPublicKey = await crypto.subtle.importKey(
    'raw',
    peerBytes,
    { name: 'X25519', namedCurve: 'X25519' },
    false,
    [],
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'X25519', public: peerPublicKey },
    privateKey,
    256,
  );

  return crypto.subtle.importKey('raw', sharedBits, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptMessage(plainText: string, aesKey: CryptoKey): Promise<string> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, tagLength: 128 },
      aesKey,
      new TextEncoder().encode(plainText),
    ),
  );

  const tagLength = 16;
  const cipherText = encrypted.slice(0, -tagLength);
  const mac = encrypted.slice(-tagLength);

  const out = new Uint8Array(1 + nonce.length + 1 + mac.length + cipherText.length);
  let offset = 0;
  out[offset++] = nonce.length;
  out.set(nonce, offset);
  offset += nonce.length;
  out[offset++] = mac.length;
  out.set(mac, offset);
  offset += mac.length;
  out.set(cipherText, offset);

  return bytesToBase64(out);
}

export async function decryptMessage(encryptedBase64: string, aesKey: CryptoKey): Promise<string> {
  try {
    const bytes = base64ToBytes(encryptedBase64);
    let offset = 0;
    const nonceLength = bytes[offset++]!;
    const nonce = bytes.slice(offset, offset + nonceLength);
    offset += nonceLength;
    const macLength = bytes[offset++]!;
    const macBytes = bytes.slice(offset, offset + macLength);
    offset += macLength;
    const cipherText = bytes.slice(offset);

    const combined = new Uint8Array(cipherText.length + macBytes.length);
    combined.set(cipherText);
    combined.set(macBytes, cipherText.length);

    const clear = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce, tagLength: 128 },
      aesKey,
      combined,
    );
    return new TextDecoder().decode(clear);
  } catch {
    return '🔒 [پیام رمزگشایی نشد]';
  }
}

export function looksEncryptedSecretPayload(raw: string): boolean {
  const text = raw.trim();
  if (!text) return false;
  if (text.startsWith('e2ee:v1:')) return true;
  if (text.startsWith('{') || text.includes(' ') || text.includes('\n')) return false;
  return text.length >= 32 && /^[A-Za-z0-9+/=]+$/.test(text);
}

export function isKeyExchangeMessage(messageType?: string | null): boolean {
  const type = (messageType || '').toLowerCase();
  return type === 'exchange_key' || type === 'exchange_key_reply';
}
