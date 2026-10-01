// =========================================
// ROOM ACCESS
//
// - Room codes are unique: a room can only be
//   created once (/create fails with 409 if
//   it already exists).
// - Every room has a PIN. Rooms created before
//   PINs existed ("legacy") keep their data and
//   ask for a PIN to be set on first access.
// - Wrong PINs are rate limited per room.
// =========================================

const PIN_PATTERN =
  /^\d{4,8}$/;

const MAX_FAILS =
  5;

const LOCK_MS =
  15 * 60 * 1000;

// Unambiguous characters (no I, O, 0, 1)
const CODE_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const CODE_LENGTH =
  6;


export function generateRoomCode() {

  const bytes =
    crypto.getRandomValues(
      new Uint8Array(CODE_LENGTH)
    );

  return Array.from(
    bytes,
    byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]
  ).join('');

}


export function isValidPin(pin) {

  return (
    typeof pin === 'string' &&
    PIN_PATTERN.test(pin)
  );

}


function toHex(buffer) {

  return Array.from(
    new Uint8Array(buffer),
    byte => byte.toString(16).padStart(2, '0')
  ).join('');

}


async function hashPin(pin, salt) {

  return toHex(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(salt + ':' + pin)
    )
  );

}


export async function makePinRecord(pin) {

  const salt =
    toHex(
      crypto.getRandomValues(
        new Uint8Array(16)
      )
    );

  return {
    salt,
    pinHash: await hashPin(pin, salt)
  };

}


function json(body, status = 200) {

  return Response.json(
    body,
    { status }
  );

}


/*
  Returns a Response when the request must stop
  here (room missing, PIN required, wrong PIN,
  or a /create or /set-pin request handled here).
  Returns null when the request may continue.
*/
export async function handleRoomAccess(
  storage,
  url,
  request,
  createInitialData
) {

  const path =
    url.pathname;

  // Public: needed before subscribing to push
  if (path === '/push-key') {
    return null;
  }

  const meta =
    await storage.get('meta');

  const exists =
    Boolean(meta) ||
    Boolean(await storage.get('data'));


  // ---------- CREATE ----------
  if (
    path === '/create' &&
    request.method === 'POST'
  ) {

    if (exists) {
      return json({ ok: false, error: 'room_exists' }, 409);
    }

    const body =
      await request.json().catch(() => ({}));

    if (!isValidPin(body.pin)) {
      return json({ ok: false, error: 'PIN must be 4 to 8 digits.' }, 400);
    }

    await storage.put('meta', {
      ...(await makePinRecord(body.pin)),
      createdAt: new Date().toISOString()
    });

    await storage.put(
      'data',
      createInitialData(body.p1, body.p2)
    );

    return json({ ok: true });

  }


  if (!exists) {
    return json({ ok: false, error: 'room_not_found' }, 404);
  }


  // ---------- LEGACY ROOM: SET FIRST PIN ----------
  if (!meta?.pinHash) {

    if (
      path === '/set-pin' &&
      request.method === 'POST'
    ) {

      const body =
        await request.json().catch(() => ({}));

      if (!isValidPin(body.pin)) {
        return json({ ok: false, error: 'PIN must be 4 to 8 digits.' }, 400);
      }

      await storage.put('meta', {
        ...(meta || {}),
        ...(await makePinRecord(body.pin)),
        pinSetAt: new Date().toISOString()
      });

      return json({ ok: true });

    }

    return json({ ok: false, error: 'pin_not_set' }, 428);

  }


  // ---------- CHECK PIN ----------
  const lock =
    (await storage.get('pinFails')) ||
    { count: 0, until: 0 };

  if (lock.until > Date.now()) {

    const minutes =
      Math.ceil((lock.until - Date.now()) / 60000);

    return json(
      {
        ok: false,
        error: `Too many wrong PINs. Try again in ${minutes} min.`
      },
      429
    );

  }

  const pin =
    request.headers.get('x-room-pin') ||
    url.searchParams.get('pin') ||
    '';

  // No PIN sent yet (first open): ask for it, don't count as a failure
  if (!pin) {
    return json({ ok: false, error: 'pin_required' }, 401);
  }

  const valid =
    isValidPin(pin) &&
    (await hashPin(pin, meta.salt)) === meta.pinHash;

  if (!valid) {

    const count =
      lock.count + 1;

    await storage.put(
      'pinFails',
      count >= MAX_FAILS
        ? { count: 0, until: Date.now() + LOCK_MS }
        : { count, until: 0 }
    );

    return json({ ok: false, error: 'invalid_pin' }, 401);

  }

  if (lock.count) {
    await storage.put('pinFails', { count: 0, until: 0 });
  }

  // A PIN can't be "set" again once it exists
  if (path === '/set-pin') {
    return json({ ok: true });
  }

  return null;

}
