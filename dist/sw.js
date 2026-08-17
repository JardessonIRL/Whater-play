self.addEventListener(
  'push',
  event => {

    let data = {};


    try {

      data =
        event.data
          ?
          event.data.json()
          :
          {};

    }

    catch (err) {

      data = {

        title:
          '💧 Water Play',

        body:
          event.data
            ?
            event.data.text()
            :
            'New point!'

      };

    }


    const title =
      data.title
      ||
      '💧 Water Play';


    const options = {

      body:
        data.body
        ||
        'New point!',

      icon:
        '/icon-192.png',

      badge:
        '/icon-192.png',

      data: {

        url:
          data.url
          ||
          '/'

      },

      timestamp:
        data.timestamp
        ||
        Date.now(),

      vibrate: [
        100,
        60,
        100
      ]

    };


    event.waitUntil(

      self.registration
        .showNotification(
          title,
          options
        )

    );

  }
);


self.addEventListener(
  'notificationclick',
  event => {

    event.notification.close();


    const targetUrl =
      event.notification.data?.url
      ||
      '/';


    event.waitUntil(

      clients
        .matchAll({
          type:
            'window',

          includeUncontrolled:
            true
        })

        .then(
          windows => {

            for (
              const client
              of
              windows
            ) {

              if (
                'focus'
                in
                client
              ) {

                client.navigate(
                  targetUrl
                );

                return client.focus();

              }

            }


            if (
              clients.openWindow
            ) {

              return clients.openWindow(
                targetUrl
              );

            }

          }
        )

    );

  }
);