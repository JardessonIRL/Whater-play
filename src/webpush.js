// =========================================
// WEB PUSH (VAPID + aes128gcm) USING WEB CRYPTO
//
// Native implementation for Cloudflare Workers.
// The "web-push" npm package depends on Node APIs
// (https.request, crypto.createECDH) that do not
// work reliably inside Workers.
//
// RFC 8291 (message encryption) + RFC 8292 (VAPID)
// =========================================

const encoder =
  new TextEncoder();


function base64UrlToBytes(value) {

  const base64 =
    value
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    +
    '='.repeat((4 - value.length % 4) % 4);

  const raw =
    atob(base64);

  return Uint8Array.from(
    raw,
    character => character.charCodeAt(0)
  );

}


function bytesToBase64Url(bytes) {

  let raw = '';

  for (const byte of bytes) {
    raw += String.fromCharCode(byte);
  }

  return btoa(raw)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

}


function concat(...parts) {

  const total =
    parts.reduce(
      (sum, part) => sum + part.length,
      0
    );

  const out =
    new Uint8Array(total);

  let offset = 0;

  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;

}


async function hmac(key, data) {

  const cryptoKey =
    await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

  return new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      data
    )
  );

}


// HKDF with a single output block (length <= 32)
async function hkdf(salt, ikm, info, length) {

  const prk =
    await hmac(salt, ikm);

  const okm =
    await hmac(
      prk,
      concat(info, new Uint8Array([1]))
    );

  return okm.slice(0, length);

}


// =========================================
// VAPID JWT (ES256)
// =========================================

async function vapidAuthorization(
  endpoint,
  subject,
  publicKey,
  privateKey
) {

  const publicBytes =
    base64UrlToBytes(publicKey);

  if (
    publicBytes.length !== 65 ||
    publicBytes[0] !== 4
  ) {
    throw new Error('Invalid VAPID public key.');
  }

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToBase64Url(publicBytes.slice(1, 33)),
    y: bytesToBase64Url(publicBytes.slice(33, 65)),
    d: privateKey.replace(/["'\s]/g, ''),
    ext: true
  };

  let signingKey;

  try {

    signingKey =
      await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );

  }

  catch (err) {

    throw new Error(
      'VAPID_PRIVATE_KEY does not match VAPID_PUBLIC_KEY ' +
      `(server public key starts with ${publicKey.slice(0, 10)}…, ` +
      `private key has ${jwk.d.length} characters, expected 43).`
    );

  }

  const header =
    bytesToBase64Url(
      encoder.encode(
        JSON.stringify({ typ: 'JWT', alg: 'ES256' })
      )
    );

  const claims =
    bytesToBase64Url(
      encoder.encode(
        JSON.stringify({
          aud: new URL(endpoint).origin,
          exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
          sub: subject
        })
      )
    );

  const unsigned =
    header + '.' + claims;

  // Web Crypto returns the raw r||s signature, as JWS expects
  const signature =
    new Uint8Array(
      await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        signingKey,
        encoder.encode(unsigned)
      )
    );

  return (
    'vapid t=' +
    unsigned + '.' + bytesToBase64Url(signature) +
    ', k=' +
    publicKey
  );

}


// =========================================
// PAYLOAD ENCRYPTION (aes128gcm)
// =========================================

async function encryptPayload(
  subscription,
  payload
) {

  const clientPublic =
    base64UrlToBytes(subscription.keys.p256dh);

  const authSecret =
    base64UrlToBytes(subscription.keys.auth);

  const localKeys =
    await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );

  const localPublic =
    new Uint8Array(
      await crypto.subtle.exportKey(
        'raw',
        localKeys.publicKey
      )
    );

  const clientKey =
    await crypto.subtle.importKey(
      'raw',
      clientPublic,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

  const sharedSecret =
    new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'ECDH', public: clientKey },
        localKeys.privateKey,
        256
      )
    );

  const ikm =
    await hkdf(
      authSecret,
      sharedSecret,
      concat(
        encoder.encode('WebPush: info\0'),
        clientPublic,
        localPublic
      ),
      32
    );

  const salt =
    crypto.getRandomValues(new Uint8Array(16));

  const contentKey =
    await hkdf(
      salt,
      ikm,
      encoder.encode('Content-Encoding: aes128gcm\0'),
      16
    );

  const nonce =
    await hkdf(
      salt,
      ikm,
      encoder.encode('Content-Encoding: nonce\0'),
      12
    );

  const aesKey =
    await crypto.subtle.importKey(
      'raw',
      contentKey,
      'AES-GCM',
      false,
      ['encrypt']
    );

  // 0x02 = padding delimiter for the last (only) record
  const plaintext =
    concat(
      encoder.encode(payload),
      new Uint8Array([2])
    );

  const ciphertext =
    new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce },
        aesKey,
        plaintext
      )
    );

  const recordSize =
    new Uint8Array(4);

  new DataView(recordSize.buffer)
    .setUint32(0, 4096);

  return concat(
    salt,
    recordSize,
    new Uint8Array([localPublic.length]),
    localPublic,
    ciphertext
  );

}


// =========================================
// SEND
//
// Resolves with { statusCode, body }.
// Throws an error with .statusCode on failure.
// =========================================

export async function sendNotification(
  subscription,
  payload,
  options
) {

  const {
    vapidDetails,
    TTL = 3600,
    urgency = 'high'
  } = options;

  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    throw new Error('Invalid push subscription.');
  }

  const body =
    await encryptPayload(
      subscription,
      payload
    );

  const authorization =
    await vapidAuthorization(
      subscription.endpoint,
      vapidDetails.subject,
      vapidDetails.publicKey,
      vapidDetails.privateKey
    );

  const response =
    await fetch(
      subscription.endpoint,
      {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Encoding': 'aes128gcm',
          'Content-Type': 'application/octet-stream',
          TTL: String(TTL),
          Urgency: urgency
        },
        body
      }
    );

  const text =
    await response.text()
      .catch(() => '');

  if (!response.ok) {

    const err =
      new Error(
        `Push service responded ${response.status}: ${text}`
      );

    err.statusCode =
      response.status;

    err.body =
      text;

    throw err;

  }

  return {
    statusCode: response.status,
    body: text
  };

}


export default {
  sendNotification
};
