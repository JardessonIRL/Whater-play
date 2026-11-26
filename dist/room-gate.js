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
      error: result.error,
      minutes: result.minutes
    };

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
    #roomGate .gate-lang{
      display:block;
      margin:0 0 0 auto;
      background:var(--card,#151c30);
      border:1px solid var(--line,#28344f);
      color:var(--text,#f8fafc);
      border-radius:10px;
      padding:8px 10px;
      font-size:15px;
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

    const language =
      I18n.picker();

    language.className =
      'gate-lang';

    root.replaceChildren(
      el('div', { class: 'gate' }, [
        language,
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
        text: I18n.t('gate.tagline')
      }),
      el('button', {
        class: 'gate-btn primary',
        text: I18n.t('gate.create'),
        onclick: showCreate
      }),
      el('button', {
        class: 'gate-btn',
        text: I18n.t('gate.join'),
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
        text: I18n.t('gate.createRoom')
      });

    mount([
      el('div', { class: 'gate-card' }, [
        el('h2', { text: I18n.t('gate.create') }),
        el('label', { text: I18n.t('gate.yourName') }),
        el('input', { id: 'gateP1', maxlength: '30', placeholder: 'Player 1' }),
        el('label', { text: I18n.t('gate.otherName') }),
        el('input', { id: 'gateP2', maxlength: '30', placeholder: 'Player 2' }),
        el('label', { text: I18n.t('gate.pinLabel') }),
        pinInput('gatePin', '••••'),
        el('label', { text: I18n.t('gate.confirmPin') }),
        pinInput('gatePin2', '••••'),
        button,
        error
      ]),
      el('button', {
        class: 'gate-link',
        text: I18n.t('gate.back'),
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
        error.textContent = I18n.t('gate.pinFormat');
        return;
      }

      if (pin !== pin2) {
        error.textContent = I18n.t('gate.pinMismatch');
        return;
      }

      busy(button, true, I18n.t('gate.creating'));

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
          throw new Error(I18n.error(result.error));
        }

        // The creator is player 1 on this device
        storageSet(playerKey(result.room), 'p1');

        showCreated(result.room, pin);

      }
      catch (err) {

        error.textContent = err.message;
        busy(button, false, I18n.t('gate.createRoom'));

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
        el('h2', { text: I18n.t('gate.created') }),
        el('div', { class: 'gate-note', text: I18n.t('gate.roomCode') }),
        el('div', { class: 'gate-code', text: room }),
        el('p', {
          class: 'gate-note',
          text: I18n.t('gate.createdNote')
        }),
        el('button', {
          class: 'gate-btn',
          text: I18n.t('gate.share'),
          onclick: async () => {

            const text =
              I18n.t('gate.inviteText', { room });

            try {

              if (navigator.share) {
                await navigator.share({ title: 'Water Play', text, url: link });
              }
              else {
                await navigator.clipboard.writeText(text + '\n' + link);
                shareStatus.textContent = I18n.t('gate.inviteCopied');
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
          text: I18n.t('gate.enter'),
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
        text: I18n.t('gate.joinRoom')
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
        el('h2', { text: I18n.t('gate.join') }),
        el('label', { text: I18n.t('gate.roomCode') }),
        codeInput,
        el('label', { text: I18n.t('gate.pin') }),
        pinInput('gateJoinPin', '••••'),
        button,
        error
      ]),
      el('button', {
        class: 'gate-link',
        text: I18n.t('gate.back'),
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
        error.textContent = I18n.t('gate.enterCode');
        return;
      }

      busy(button, true, I18n.t('gate.checking'));

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

        error.textContent = I18n.error(result.error, result);

      }
      catch (err) {
        error.textContent = I18n.t('gate.noConnection');
      }

      busy(button, false, I18n.t('gate.joinRoom'));

    });

  }


  // ---------- SET PIN (rooms created before PINs) ----------

  function showSetPin(room) {

    const error =
      el('div', { class: 'gate-error' });

    const button =
      el('button', {
        class: 'gate-btn primary',
        text: I18n.t('gate.savePin')
      });

    mount([
      el('div', { class: 'gate-card' }, [
        el('h2', { text: I18n.t('gate.protectTitle') }),
        el('p', {
          class: 'gate-note',
          text: I18n.t('gate.protectNote', { room })
        }),
        el('label', { text: I18n.t('gate.newPin') }),
        pinInput('gateNewPin', '••••'),
        el('label', { text: I18n.t('gate.confirmPin') }),
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
        error.textContent = I18n.t('gate.pinFormat');
        return;
      }

      if (pin !== pin2) {
        error.textContent = I18n.t('gate.pinMismatch');
        return;
      }

      busy(button, true, I18n.t('gate.saving'));

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
          showJoin(room, I18n.t('gate.alreadyHasPin'));
          return;
        }

        error.textContent = I18n.error(result.error, result);

      }
      catch (err) {
        error.textContent = I18n.t('gate.noConnection');
      }

      busy(button, false, I18n.t('gate.savePin'));

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
          showJoin('', I18n.error('room_not_found'));
          storageRemove(ROOM_KEY);
          break;

        default:
          showWelcome();

      }

    }

  };

})();
