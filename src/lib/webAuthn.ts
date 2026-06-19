'use client';

const CREDENTIAL_ID_KEY = 'vista_webauthn_credential_id';

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.PublicKeyCredential) &&
    Boolean(navigator.credentials)
  );
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64 + padding);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(array: Uint8Array): string {
  const binary = Array.from(array).map(b => String.fromCharCode(b)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  return uint8ArrayToBase64Url(new Uint8Array(buffer));
}

export async function registerWebAuthn(): Promise<boolean> {
  if (!isWebAuthnSupported()) throw new Error('WebAuthn پشتیبانی نمیشود');

  const beginRes = await fetch('/api/backend/v1/auth/webauthn/register/begin', {
    method: 'POST',
    credentials: 'include',
  });
  if (!beginRes.ok) throw new Error('خطا در شروع ثبت WebAuthn');

  const options = await beginRes.json();

  const publicKey: PublicKeyCredentialCreationOptions = {
    ...options,
    challenge: base64UrlToUint8Array(options.challenge),
    user: {
      ...options.user,
      id: base64UrlToUint8Array(options.user.id),
    },
    excludeCredentials: (options.excludeCredentials || []).map((c: { id: string; type: string; transports?: string[] }) => ({
      ...c,
      id: base64UrlToUint8Array(c.id),
    })),
  };

  const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
  if (!credential) throw new Error('اعتبارسنجی ایجاد نشد');

  const response = credential.response as AuthenticatorAttestationResponse;

  const completePayload = {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
    },
  };

  const completeRes = await fetch('/api/backend/v1/auth/webauthn/register/complete', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(completePayload),
  });
  if (!completeRes.ok) throw new Error('خطا در تکمیل ثبت WebAuthn');

  localStorage.setItem(CREDENTIAL_ID_KEY, credential.id);
  return true;
}

export async function authenticateWebAuthn(): Promise<boolean> {
  if (!isWebAuthnSupported()) throw new Error('WebAuthn پشتیبانی نمیشود');

  const beginRes = await fetch('/api/backend/v1/auth/webauthn/login/begin', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!beginRes.ok) throw new Error('خطا در شروع ورود WebAuthn');

  const options = await beginRes.json();

  const storedId = localStorage.getItem(CREDENTIAL_ID_KEY);

  const publicKey: PublicKeyCredentialRequestOptions = {
    ...options,
    challenge: base64UrlToUint8Array(options.challenge),
    allowCredentials: storedId
      ? [{ id: base64UrlToUint8Array(storedId), type: 'public-key' as const }]
      : (options.allowCredentials || []).map((c: { id: string; type: string }) => ({
          ...c,
          id: base64UrlToUint8Array(c.id),
        })),
  };

  const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
  if (!assertion) throw new Error('احراز هویت لغو شد');

  const response = assertion.response as AuthenticatorAssertionResponse;

  const completePayload = {
    id: assertion.id,
    rawId: arrayBufferToBase64Url(assertion.rawId),
    type: assertion.type,
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      signature: arrayBufferToBase64Url(response.signature),
      userHandle: response.userHandle ? arrayBufferToBase64Url(response.userHandle) : null,
    },
  };

  const completeRes = await fetch('/api/backend/v1/auth/webauthn/login/complete', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(completePayload),
  });
  if (!completeRes.ok) throw new Error('ورود WebAuthn ناموفق بود');

  return true;
}

export function hasRegisteredCredential(): boolean {
  return Boolean(localStorage.getItem(CREDENTIAL_ID_KEY));
}

export function removeCredential(): void {
  localStorage.removeItem(CREDENTIAL_ID_KEY);
}
