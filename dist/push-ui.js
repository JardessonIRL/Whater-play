(() => {

  const LEGACY_STORAGE_PLAYER =
    'water_play_device_player';


  const params =
    new URLSearchParams(
      location.search
    );


  const room =
    (
      params.get('room')
      ||
      localStorage.getItem(
        'duel_room'
      )
      ||
      ''
    )
      .trim();


  /*
    "This device belongs to" is saved per room.
    The old global value is carried over once,
    so existing phones keep their choice.
  */
  const STORAGE_PLAYER =
    RoomGate.playerKey(
      room
    );


  if (
    room
    &&
    !localStorage.getItem(
      STORAGE_PLAYER
    )
    &&
    localStorage.getItem(
      LEGACY_STORAGE_PLAYER
    )
  ) {

    localStorage.setItem(
      STORAGE_PLAYER,
      localStorage.getItem(
        LEGACY_STORAGE_PLAYER
      )
    );

  }


  // Adds the room PIN to every request
  function apiFetch(
    url,
    options = {}
  ) {

    return fetch(
      url,
      {
        ...options,

        headers: {
          ...(
            options.headers
            ||
            {}
          ),

          'x-room-pin':
            RoomGate.getPin(
              room
            )
        }
      }
    );

  }


  function apiUrl(path) {

    return (
      '/api'
      +
      path
      +
      '?room='
      +
      encodeURIComponent(
        room
      )
    );

  }


  function urlBase64ToUint8Array(
    base64String
  ) {

    const padding =
      '='.repeat(
        (
          4
          -
          base64String.length % 4
        )
        %
        4
      );


    const base64 =
      (
        base64String
        +
        padding
      )
        .replace(
          /-/g,
          '+'
        )
        .replace(
          /_/g,
          '/'
        );


    const rawData =
      atob(
        base64
      );


    return Uint8Array.from(

      [...rawData].map(
        character =>
          character.charCodeAt(0)
      )

    );

  }


  function sameKey(
    applicationServerKey,
    publicKey
  ) {

    if (
      !applicationServerKey
    ) {

      return true;

    }


    const current =
      new Uint8Array(
        applicationServerKey
      );


    const expected =
      urlBase64ToUint8Array(
        publicKey
      );


    return (
      current.length ===
      expected.length
      &&
      current.every(
        (byte, index) =>
          byte ===
          expected[index]
      )
    );

  }


  async function getPlayers() {

    try {

      const response =
        await apiFetch(
          apiUrl(
            '/state'
          )
        );


      const result =
        await response.json();


      if (
        result.ok
        &&
        result.data
        &&
        Array.isArray(
          result.data.players
        )
      ) {

        return result.data.players;

      }

    }

    catch (err) {

      console.error(
        'Could not load players:',
        err
      );

    }


    return [

      {
        id:
          'p1',

        name:
          'Player 1'
      },

      {
        id:
          'p2',

        name:
          'Player 2'
      }

    ];

  }


  async function registerServiceWorker() {

    if (
      !(
        'serviceWorker'
        in
        navigator
      )
    ) {

      throw new Error(
        I18n.t('push.noServiceWorker')
      );

    }


    return navigator
      .serviceWorker
      .register(
        '/sw.js'
      );

  }


  async function getCurrentSubscription() {

    const registration =
      await navigator
        .serviceWorker
        .ready;


    return registration
      .pushManager
      .getSubscription();

  }


  async function updateStatus(
    element
  ) {

    if (
      !(
        'Notification'
        in
        window
      )
    ) {

      element.textContent =
        I18n.t('push.unsupportedDevice');

      return;

    }


    if (
      Notification.permission ===
      'denied'
    ) {

      element.textContent =
        I18n.t('push.blocked');

      return;

    }


    const subscription =
      await getCurrentSubscription()
        .catch(
          () => null
        );


    const playerId =
      localStorage.getItem(
        STORAGE_PLAYER
      );


    if (
      subscription
      &&
      playerId
    ) {

      element.textContent =
        I18n.t('push.enabledOnDevice');

    }

    else if (
      subscription
    ) {

      element.textContent =
        I18n.t('push.chooseOwner');

    }

    else {

      element.textContent =
        I18n.t('push.notEnabledYet');

    }

  }


  /*
    Subscribes this device with the server's
    current VAPID key and saves it on the server.

    force = always drop the existing browser
    subscription and create a fresh one.
  */
  async function subscribeDevice(
    playerId,
    force
  ) {

    const keyResponse =
      await apiFetch(
        apiUrl(
          '/push-key'
        )
      );


    const keyData =
      await keyResponse.json();


    if (
      !keyData.publicKey
    ) {

      throw new Error(
        I18n.t('push.noPublicKey')
      );

    }


    const registration =
      await navigator
        .serviceWorker
        .ready;


    let subscription =
      await registration
        .pushManager
        .getSubscription();


    let oldEndpoint =
      null;


    /*
      If the VAPID key changed, the old
      subscription can no longer receive
      pushes. Drop it and subscribe again.
    */
    if (
      subscription
      &&
      (
        force
        ||
        !sameKey(
          subscription.options
            ?.applicationServerKey,
          keyData.publicKey
        )
      )
    ) {

      oldEndpoint =
        subscription.endpoint;


      await subscription
        .unsubscribe()
        .catch(
          () => null
        );


      subscription =
        null;

    }


    if (
      !subscription
    ) {

      subscription =
        await registration
          .pushManager
          .subscribe({

            userVisibleOnly:
              true,

            applicationServerKey:
              urlBase64ToUint8Array(
                keyData.publicKey
              )

          });

    }


    const response =
      await apiFetch(
        apiUrl(
          '/subscribe'
        ),
        {

          method:
            'POST',

          headers: {

            'content-type':
              'application/json'

          },

          body:
            JSON.stringify({

              playerId,

              oldEndpoint,

              // Notifications arrive in this language
              lang:
                I18n.lang,

              subscription:
                subscription.toJSON()

            })

        }
      );


    const result =
      await response.json();


    if (
      !response.ok
      ||
      !result.ok
    ) {

      throw new Error(
        I18n.error(
          result.error,
          result
        )
      );

    }


    localStorage.setItem(
      STORAGE_PLAYER,
      playerId
    );


    return subscription;

  }


  async function enableNotifications(
    playerId,
    status,
    button
  ) {

    if (
      !playerId
    ) {

      alert(
        I18n.t('push.chooseFirst')
      );

      return;

    }


    button.disabled =
      true;


    button.textContent =
      I18n.t('push.enabling');


    try {

      if (
        !(
          'Notification'
          in
          window
        )
      ) {

        throw new Error(
          I18n.t('push.unsupportedBrowser')
        );

      }


      await registerServiceWorker();


      const permission =
        await Notification
          .requestPermission();


      if (
        permission !==
        'granted'
      ) {

        throw new Error(
          I18n.t('push.permissionDenied')
        );

      }


      await subscribeDevice(
        playerId,
        true
      );


      status.textContent =
        I18n.t('push.enabledNow');


      button.textContent =
        I18n.t('push.enabledButton');

    }

    catch (err) {

      console.error(
        err
      );


      status.textContent =
        err.message
        ||
        I18n.t('push.enableFailed');


      button.textContent =
        I18n.t('push.enable');

    }

    finally {

      button.disabled =
        false;

    }

  }


  async function sendTestNotification(
    status,
    button
  ) {

    button.disabled =
      true;


    try {

      let subscription =
        await getCurrentSubscription();


      const playerId =
        localStorage.getItem(
          STORAGE_PLAYER
        );


      if (
        !subscription
        ||
        !playerId
      ) {

        throw new Error(
          I18n.t('push.notEnabledDevice')
        );

      }


      const sendTest =
        async () => {

          const response =
            await apiFetch(
              apiUrl(
                '/test-push'
              ),
              {

                method:
                  'POST',

                headers: {

                  'content-type':
                    'application/json'

                },

                body:
                  JSON.stringify({

                    endpoint:
                      subscription.endpoint

                  })

              }
            );


          return {

            response,

            result:
              await response.json()

          };

        };


      let {
        response,
        result
      } =
        await sendTest();


      /*
        Subscription is stale (old key or
        expired). Recreate it and try again.
      */
      if (
        result.resubscribe
      ) {

        status.textContent =
          I18n.t('push.renewing');


        subscription =
          await subscribeDevice(
            playerId,
            true
          );


        (
          {
            response,
            result
          } =
            await sendTest()
        );

      }


      if (
        !response.ok
        ||
        !result.ok
      ) {

        throw new Error(
          I18n.error(
            result.error,
            result
          )
        );

      }


      status.textContent =
        I18n.t('push.testSent');

    }

    catch (err) {

      console.error(
        err
      );


      status.textContent =
        err.message
        ||
        I18n.t('push.testFailed');

    }

    finally {

      button.disabled =
        false;

    }

  }


  async function buildPushSettings() {

    const settingsCard =
      document.querySelector(
        '#settings .settings'
      );


    if (
      !settingsCard
    ) {

      console.error(
        'Settings card not found.'
      );

      return;

    }


    if (
      document.getElementById(
        'pushSettingsBox'
      )
    ) {

      return;

    }


    const players =
      await getPlayers();


    const wrapper =
      document.createElement(
        'div'
      );


    wrapper.id =
      'pushSettingsBox';


    wrapper.style.cssText =
      `
        margin-top:24px;
        padding-top:20px;
        border-top:1px solid var(--line);
      `;


    const title =
      document.createElement(
        'h3'
      );


    title.textContent =
      I18n.t('push.title');


    const description =
      document.createElement(
        'div'
      );


    description.className =
      'room';


    description.style.cssText =
      `
        margin-bottom:14px;
        line-height:1.5;
      `;


    description.textContent =
      I18n.t('push.description');


    const label =
      document.createElement(
        'label'
      );


    label.textContent =
      I18n.t('push.belongsTo');


    const select =
      document.createElement(
        'select'
      );


    select.id =
      'devicePlayerSelect';


    select.style.cssText =
      `
        width:100%;
        background:#0f172a;
        border:1px solid var(--line);
        color:var(--text);
        border-radius:10px;
        padding:12px;
        font-size:16px;
        margin-bottom:12px;
      `;


    const emptyOption =
      document.createElement(
        'option'
      );


    emptyOption.value =
      '';


    emptyOption.textContent =
      I18n.t('push.selectPlayer');


    select.appendChild(
      emptyOption
    );


    for (
      const player
      of
      players
    ) {

      const option =
        document.createElement(
          'option'
        );


      option.value =
        player.id;


      option.textContent =
        player.name;


      select.appendChild(
        option
      );

    }


    select.value =
      localStorage.getItem(
        STORAGE_PLAYER
      )
      ||
      '';


    select.addEventListener(
      'change',
      () => {

        if (
          select.value
        ) {

          localStorage.setItem(
            STORAGE_PLAYER,
            select.value
          );

        }

      }
    );


    const button =
      document.createElement(
        'button'
      );


    button.className =
      'btn';


    button.style.cssText =
      `
        width:100%;
        margin-top:4px;
      `;


    button.textContent =
      I18n.t('push.enable');


    const status =
      document.createElement(
        'div'
      );


    status.className =
      'status';


    status.style.marginTop =
      '10px';


    button.addEventListener(
      'click',
      () =>
        enableNotifications(
          select.value,
          status,
          button
        )
    );


    const testButton =
      document.createElement(
        'button'
      );


    testButton.className =
      'btn';


    testButton.style.cssText =
      `
        width:100%;
        margin-top:10px;
      `;


    testButton.textContent =
      I18n.t('push.test');


    testButton.addEventListener(
      'click',
      () =>
        sendTestNotification(
          status,
          testButton
        )
    );


    wrapper.append(

      title,

      description,

      label,

      select,

      button,

      testButton,

      status

    );


    settingsCard.appendChild(
      wrapper
    );


    try {

      await registerServiceWorker();

    }

    catch (err) {

      console.log(
        err
      );

    }


    /*
      Keep this device's subscription in sync
      with the server key (e.g. after a key change).
    */
    const savedPlayer =
      localStorage.getItem(
        STORAGE_PLAYER
      );


    if (
      savedPlayer
      &&
      'Notification'
      in
      window
      &&
      Notification.permission ===
      'granted'
    ) {

      await subscribeDevice(
        savedPlayer,
        false
      )
        .catch(
          err =>
            console.error(
              err
            )
        );

    }


    await updateStatus(
      status
    );

  }


  // No room yet: the welcome screen is showing
  if (
    !room
  ) {

    return;

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(

      'DOMContentLoaded',

      buildPushSettings

    );

  }

  else {

    buildPushSettings();

  }

})();