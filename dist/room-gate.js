/*
  Room gate: welcome, create room, join room,
  enter PIN and set PIN (for rooms created
  before PINs existed).

  Exposes window.RoomGate.show(mode, room, message)
  and the storage helpers used by index.html
  and push-ui.js.
*/
(() => {

  const ROOM_KEY =
    'duel_room';

  const pinKey =
    room =>
      'water_play_pin:' + room;

  const playerKey =
    room =>
      'water_play_device_player:' + room;


  function storageGet(key) {

    try {
      return localStorage.getItem(key) || '';
    }
    catch (err) {
      return '';
    }

  }


  function storageSet(key, value) {

    try {
      localStorage.setItem(key, value);
    }
    catch (err) {
      console.error(err);
    }

  }


  function storageRemove(key) {

    try {
      localStorage.removeItem(key);
    }
    catch (err) {
      console.error(err);
    }

  }


  function enterRoom(room, pin) {

    storageSet(ROOM_KEY, room);
    storageSet(pinKey(room), pin);

    location.replace('/');

  }


  function leaveRoom(room) {

    storageRemove(ROOM_KEY);

    if (room) {
      storageRemove(pinKey(room));
    }

    location.replace('/');

  }


  async function checkPin(room, pin) {

    const response =
      await fetch(
        '/api/state?room=' + encodeURIComponent(room),
        {
          headers: {
            'x-room-pin': pin
          }
        }
      );

    const result =
      await response.json().catch(() => ({}));

    return {
      ok: response.ok && result.ok,
      status: response.status,
      error: result.error
    };

  }


  function friendlyError(error) {

    switch (error) {

      case 'room_not_found':
        return 'Room not found. Check the code.';

      case 'invalid_pin':
        return 'Wrong PIN.';

      case 'pin_required':
        return 'Enter the room PIN.';

      default:
        return error || 'Something went wrong. Try again.';

    }

  }


  // =========================================
  // UI
  // =========================================

  const style =
    document.createElement('style');

  style.textContent = `
    #roomGate{
      position:fixed;
      inset:0;
      z-index:1000;
      overflow-y:auto;
      background:linear-gradient(180deg,#0b1020,#111827);
      color:var(--text,#f8fafc);
      font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;
      padding:max(28px, env(safe-area-inset-top)) 16px 32px;
    }
    #roomGate .gate{
      max-width:420px;
      margin:0 auto;
    }
    #roomGate .gate-logo{
      display:block;
      width:72px;
      height:72px;
      border-radius:18px;
      margin:8px auto 14px;
    }
    #roomGate h1{
      text-align:center;
      font-size:26px;
      margin:0 0 4px;
    }
    #roomGate .gate-sub{
      text-align:center;
      color:var(--muted,#94a3b8);
      margin:0 0 22px;
      line-height:1.5;
    }
    #roomGate .gate-card{
      background:var(--card,#151c30);
      border:1px solid var(--line,#28344f);
      border-radius:18px;
      padding:18px;
      margin-bottom:14px;
    }
    #roomGate h2{
      font-size:18px;
      margin:0 0 12px;
    }
    #roomGate label{
      display:block;
      font-size:13px;
      color:var(--muted,#94a3b8);
      margin:10px 0 6px;
    }
    #roomGate input{
      width:100%;
      background:#0f172a;
      border:1px solid var(--line,#28344f);
      color:var(--text,#f8fafc);
      border-radius:10px;
      padding:12px;
      font-size:16px;
    }
    #roomGate input.code{
      text-transform:uppercase;
      letter-spacing:4px;
      font-weight:700;
    }
    #roomGate .gate-btn{
      width:100%;
      margin-top:14px;
      padding:13px;
      border-radius:12px;
      border:1px solid var(--line,#28344f);
      background:var(--card2,#1d2740);
      color:var(--text,#f8fafc);
      font-size:16px;
      font-weight:700;
    }
    #roomGate .gate-btn.primary{
      background:var(--accent,#38bdf8);
      border-color:var(--accent,#38bdf8);
      color:#0b1020;
    }
    #roomGate .gate-btn:disabled{
      opacity:.6;
    }
    #roomGate .gate-link{
      display:block;
      margin:16px auto 0;
      background:none;
      border:0;
      color:var(--muted,#94a3b8);
      text-decoration:underline;
      font-size:14px;
    }
    #roomGate .gate-error{
      color:var(--accent2,#fb7185);
      min-height:20px;
      margin-top:10px;
      font-size:14px;
    }
    #roomGate .gate-code{
      text-align:center;
      font-size:40px;
      font-weight:800;
      letter-spacing:8px;
      margin:8px 0 4px;
      color:var(--accent,#38bdf8);
    }
    #roomGate .gate-note{
      color:var(--muted,#94a3b8);
      font-size:14px;
      line-height:1.5;
      text-align:center;
    }
  `;

  document.head.appendChild(style);


  function el(tag, attrs = {}, children = []) {

    const node =
      document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {

      if (key === 'text') {
        node.textContent = value;
      }
      else if (key === 'onclick') {
        node.addEventListener('click', value);
      }
      else {
        node.setAttribute(key, value);
      }

    }

    for (const child of children) {
      node.appendChild(child);
    }

    return node;

  }


  function pinInput(id, placeholder) {

    return el('input', {
      id,
      type: 'password',
      inputmode: 'numeric',
      pattern: '[0-9]*',
      maxlength: '8',
      autocomplete: 'off',
      placeholder
    });

  }


  function busy(button, isBusy, label) {

    button.disabled = isBusy;
    button.textContent = label;

  }


  function mount(children) {

    let root =
      document.getElementById('roomGate');

    if (!root) {
      root = el('div', { id: 'roomGate' });
      document.body.appendChild(root);
    }

    root.replaceChildren(
      el('div', { class: 'gate' }, [
        el('img', {
          class: 'gate-logo',
          src: '/notification-icon.png',
          alt: ''
        }),
        ...children
      ])
    );

    document.body.style.overflow = 'hidden';

  }


  // ---------- WELCOME ----------

  function showWelcome() {

    mount([
      el('h1', { text: 'Water Play' }),
      el('p', {
        class: 'gate-sub',
        text: 'A shared daily water score for two. Create a room or join one with its code and PIN.'
      }),
      el('button', {
        class: 'gate-btn primary',
        text: 'Create a room',
        onclick: showCreate
      }),
      el('button', {
        class: 'gate-btn',
        text: 'Join a room',
        onclick: () => showJoin()
      })
    ]);

  }


  // ---------- CREATE ----------

  function showCreate() {

    const error =
      el('div', { class: 'gate-error' });

    const button =
      el('button', {
        class: 'gate-btn primary',
        text: 'Create room'
      });

    mount([
      el('div', { class: 'gate-card' }, [
        el('h2', { text: 'Create a room' }),
        el('label', { text: 'Your name' }),
        el('input', { id: 'gateP1', maxlength: '30', placeholder: 'Player 1' }),
        el('label', { text: "The other player's name" }),
        el('input', { id: 'gateP2', maxlength: '30', placeholder: 'Player 2' }),
        el('label', { text: 'Room PIN (4 to 8 digits)' }),
        pinInput('gatePin', '••••'),
        el('label', { text: 'Confirm PIN' }),
        pinInput('gatePin2', '••••'),
        button,
        error
      ]),
      el('button', {
        class: 'gate-link',
        text: 'Back',
        onclick: showWelcome
      })
    ]);

    button.addEventListener('click', async () => {

      const pin =
        document.getElementById('gatePin').value.trim();

      const pin2 =
        document.getElementById('gatePin2').value.trim();

      error.textContent = '';

      if (!/^\d{4,8}$/.test(pin)) {
        error.textContent = 'The PIN must be 4 to 8 digits.';
        return;
      }

      if (pin !== pin2) {
        error.textContent = "The PINs don't match.";
        return;
      }

      busy(button, true, 'Creating…');

      try {

        const response =
          await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              pin,
              p1: document.getElementById('gateP1').value,
              p2: document.getElementById('gateP2').value
            })
          });

        const result =
          await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
          throw new Error(result.error || 'Could not create the room.');
        }

        // The creator is player 1 on this device
        storageSet(playerKey(result.room), 'p1');

        showCreated(result.room, pin);

      }
      catch (err) {

        error.textContent = err.message;
        busy(button, false, 'Create room');

      }

    });

  }


  function showCreated(room, pin) {

    const link =
      location.origin + '/?room=' + encodeURIComponent(room);

    const shareStatus =
      el('div', { class: 'gate-note' });

    mount([
      el('div', { class: 'gate-card' }, [
        el('h2', { text: 'Room created ✓' }),
        el('div', { class: 'gate-note', text: 'Room code' }),
        el('div', { class: 'gate-code', text: room }),
        el('p', {
          class: 'gate-note',
          text: 'Send the code to the other player and tell them the PIN. Save both: you will need them on a new phone.'
        }),
        el('button', {
          class: 'gate-btn',
          text: 'Share invite',
          onclick: async () => {

            const text =
              `Join my Water Play room! Code: ${room}`;

            try {

              if (navigator.share) {
                await navigator.share({ title: 'Water Play', text, url: link });
              }
              else {
                await navigator.clipboard.writeText(text + '\n' + link);
                shareStatus.textContent = 'Invite copied.';
              }

            }
            catch (err) {
              console.log(err);
            }

          }
        }),
        shareStatus,
        el('button', {
          class: 'gate-btn primary',
          text: 'Enter room',
          onclick: () => enterRoom(room, pin)
        })
      ])
    ]);

  }


  // ---------- JOIN ----------

  function showJoin(prefillRoom, message) {

    const error =
      el('div', { class: 'gate-error', text: message || '' });

    const button =
      el('button', {
        class: 'gate-btn primary',
        text: 'Join room'
      });

    const codeInput =
      el('input', {
        id: 'gateCode',
        class: 'code',
        maxlength: '64',
        autocomplete: 'off',
        autocapitalize: 'characters',
        placeholder: 'ABC123'
      });

    codeInput.value =
      prefillRoom || '';

    mount([
      el('div', { class: 'gate-card' }, [
        el('h2', { text: 'Join a room' }),
        el('label', { text: 'Room code' }),
        codeInput,
        el('label', { text: 'PIN' }),
        pinInput('gateJoinPin', '••••'),
        button,
        error
      ]),
      el('button', {
        class: 'gate-link',
        text: 'Back',
        onclick: () => {
          if (prefillRoom) {
            leaveRoom(prefillRoom);
          }
          else {
            showWelcome();
          }
        }
      })
    ]);

    button.addEventListener('click', async () => {

      const typed =
        codeInput.value.trim();

      // Generated codes are upper case; keep older
      // room names (like the original one) as typed.
      const room =
        typed === prefillRoom
          ? typed
          : typed.toUpperCase();

      const pin =
        document.getElementById('gateJoinPin').value.trim();

      error.textContent = '';

      if (!room) {
        error.textContent = 'Enter the room code.';
        return;
      }

      busy(button, true, 'Checking…');

      try {

        const result =
          await checkPin(room, pin);

        if (result.ok) {
          enterRoom(room, pin);
          return;
        }

        if (result.error === 'pin_not_set') {
          showSetPin(room);
          return;
        }

        error.textContent = friendlyError(result.error);

      }
      catch (err) {
        error.textContent = 'No connection. Try again.';
      }

      busy(button, false, 'Join room');

    });

  }


  // ---------- SET PIN (rooms created before PINs) ----------

  function showSetPin(room) {

    const error =
      el('div', { class: 'gate-error' });

    const button =
      el('button', {
        class: 'gate-btn primary',
        text: 'Save PIN'
      });

    mount([
      el('div', { class: 'gate-card' }, [
        el('h2', { text: 'Protect your room' }),
        el('p', {
          class: 'gate-note',
          text: `Room "${room}" doesn't have a PIN yet. Choose one now. The other player will need it once on their phone. Your scores are kept.`
        }),
        el('label', { text: 'New PIN (4 to 8 digits)' }),
        pinInput('gateNewPin', '••••'),
        el('label', { text: 'Confirm PIN' }),
        pinInput('gateNewPin2', '••••'),
        button,
        error
      ])
    ]);

    button.addEventListener('click', async () => {

      const pin =
        document.getElementById('gateNewPin').value.trim();

      const pin2 =
        document.getElementById('gateNewPin2').value.trim();

      error.textContent = '';

      if (!/^\d{4,8}$/.test(pin)) {
        error.textContent = 'The PIN must be 4 to 8 digits.';
        return;
      }

      if (pin !== pin2) {
        error.textContent = "The PINs don't match.";
        return;
      }

      busy(button, true, 'Saving…');

      try {

        const response =
          await fetch(
            '/api/set-pin?room=' + encodeURIComponent(room),
            {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'x-room-pin': pin
              },
              body: JSON.stringify({ pin })
            }
          );

        const result =
          await response.json().catch(() => ({}));

        if (response.ok && result.ok) {
          enterRoom(room, pin);
          return;
        }

        // Someone else set the PIN meanwhile
        if (
          result.error === 'invalid_pin' ||
          result.error === 'pin_required'
        ) {
          showJoin(room, 'This room already has a PIN. Enter it below.');
          return;
        }

        error.textContent = friendlyError(result.error);

      }
      catch (err) {
        error.textContent = 'No connection. Try again.';
      }

      busy(button, false, 'Save PIN');

    });

  }


  // =========================================
  // PUBLIC
  // =========================================

  window.RoomGate = {

    ROOM_KEY,

    pinKey,

    playerKey,

    getPin:
      room =>
        storageGet(pinKey(room)),

    show(mode, room, message) {

      switch (mode) {

        case 'setPin':
          showSetPin(room);
          break;

        case 'pin':
          showJoin(room, message);
          break;

        case 'notFound':
          showJoin('', 'Room not found. Check the code.');
          storageRemove(ROOM_KEY);
          break;

        default:
          showWelcome();

      }

    }

  };

})();
