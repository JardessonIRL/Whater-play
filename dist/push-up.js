(() => {

  const STORAGE_PLAYER =
    'water_play_device_player';


  const params =
    new URLSearchParams(
      location.search
    );


  const room =
    params.get(
      'room'
    )
    ||
    localStorage.getItem(
      'duel_room'
    )
    ||
    'DUX-8427';


  function apiUrl(
    path
  ) {

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
          base64String.length
          %
          4
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
      [
        ...rawData
      ]
        .map(
          character =>
            character.charCodeAt(
              0
            )
        )
    );

  }


  async function getPlayers() {

    try {

      const response =
        await fetch(
          apiUrl(
            '/state'
          )
        );


      const result =
        await response.json();


      if (
        result.ok &&
        result.data?.players
      ) {

        return result.data.players;

      }

    }

    catch (err) {

      console.error(
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
        'This browser does not support Service Workers.'
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
        'Notifications are not supported on this device.';

      return;

    }


    if (
      Notification.permission ===
      'denied'
    ) {

      element.textContent =
        'Notifications are blocked in browser settings.';

      return;

    }


    const subscription =
      await getCurrentSubscription()
        .catch(
          () => null
        );


    if (
      subscription
    ) {

      const playerId =
        localStorage.getItem(
          STORAGE_PLAYER
        );


      element.textContent =
        playerId
          ?
          'Notifications enabled on this device.'
          :
          'Push subscription exists. Select this device owner below.';

    }

    else {

      element.textContent =
        'Notifications are not enabled yet.';

    }

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
        'Choose who owns this device first.'
      );

      return;

    }


    button.disabled =
      true;


    button.textContent =
      'Enabling…';


    try {

      if (
        !(
          'Notification'
          in
          window
        )
      ) {

        throw new Error(
          'Notifications are not supported by this browser.'
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
          'Notification permission was not granted.'
        );

      }


      const keyResponse =
        await fetch(
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
          'VAPID public key is not configured.'
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
        await fetch(
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

                subscription:
                  subscription.toJSON()

              })

          }
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        !result.ok
      ) {

        throw new Error(
          result.error
          ||
          'Could not save notification subscription.'
        );

      }


      localStorage.setItem(
        STORAGE_PLAYER,
        playerId
      );


      status.textContent =
        '✓ Notifications enabled for this device.';


      button.textContent =
        'Notifications enabled';

    }

    catch (err) {

      console.error(
        err
      );


      status.textContent =
        err.message
        ||
        'Could not enable notifications.';


      button.textContent =
        'Enable notifications';

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
      )
      ||
      document.querySelector(
        '#settings .card'
      );


    if (
      !settingsCard
    ) {

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
        margin-top:22px;
        padding-top:18px;
        border-top:1px solid var(--line);
      `;


    const title =
      document.createElement(
        'h3'
      );


    title.textContent =
      'Notifications';


    const description =
      document.createElement(
        'div'
      );


    description.className =
      'room';


    description.style.marginBottom =
      '14px';


    description.textContent =
      'Choose who owns this phone. When the other player scores, this device will receive a notification.';


    const label =
      document.createElement(
        'label'
      );


    label.textContent =
      'This device belongs to';


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
      'Select player';


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


    button.style.width =
      '100%';


    button.textContent =
      'Enable notifications';


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


    wrapper.append(
      title,
      description,
      label,
      select,
      button,
      status
    );


    settingsCard.appendChild(
      wrapper
    );


    await registerServiceWorker()
      .catch(
        err =>
          console.log(
            err
          )
      );


    await updateStatus(
      status
    );

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