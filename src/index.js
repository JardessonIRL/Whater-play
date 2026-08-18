import webpush from "web-push";

export class ScoreRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sockets = new Set();
  }

  async getData() {
    const saved =
      await this.state.storage.get(
        'data'
      );

    if (saved) {
      return saved;
    }

    const initial = {
      players: [
        {
          id: 'p1',
          name: 'Player 1'
        },
        {
          id: 'p2',
          name: 'Player 2'
        }
      ],

      today: {
        date:
          this.todayKey(),

        scores: {
          p1: 0,
          p2: 0
        },

        events: []
      },

      history: []
    };

    await this.state.storage.put(
      'data',
      initial
    );

    return initial;
  }

  async getPushSubscriptions() {
    return (
      await this.state.storage.get(
        'pushSubscriptions'
      )
    ) || [];
  }

  async savePushSubscriptions(
    subscriptions
  ) {
    await this.state.storage.put(
      'pushSubscriptions',
      subscriptions
    );
  }

  todayKey() {
    return new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'Europe/Dublin',
        year:
          'numeric',
        month:
          '2-digit',
        day:
          '2-digit'
      }
    ).format(
      new Date()
    );
  }

  async normalizeDay(
    data
  ) {
    const today =
      this.todayKey();

    if (
      data.today.date !==
      today
    ) {
      if (
        (
          data.today.scores.p1
          ||
          0
        ) > 0
        ||
        (
          data.today.scores.p2
          ||
          0
        ) > 0
        ||
        data.today.events.length
      ) {
        data.history.push({
          ...data.today,

          closedAt:
            new Date()
              .toISOString()
        });
      }

      data.today = {
        date:
          today,

        scores: {
          p1: 0,
          p2: 0
        },

        events: []
      };

      await this.state.storage.put(
        'data',
        data
      );
    }

    return data;
  }

  broadcast(
    payload
  ) {
    const text =
      JSON.stringify(
        payload
      );

    for (
      const ws
      of
      this.sockets
    ) {
      try {
        ws.send(
          text
        );
      }
      catch (_) {
        this.sockets.delete(
          ws
        );
      }
    }
  }

  async sendPushToOpponent(
    data,
    scoringPlayerId,
    room,
    points
  ) {
    if (
      !this.env.VAPID_PUBLIC_KEY
      ||
      !this.env.VAPID_PRIVATE_KEY
    ) {
      console.log(
        'Push skipped: VAPID configuration missing.'
      );

      return;
    }

    const opponentId =
      scoringPlayerId === 'p1'
        ?
        'p2'
        :
        'p1';

    const scorer =
      data.players.find(
        player =>
          player.id ===
          scoringPlayerId
      );

    const p1 =
      data.players.find(
        player =>
          player.id ===
          'p1'
      );

    const p2 =
      data.players.find(
        player =>
          player.id ===
          'p2'
      );

    const subscriptions =
      await this.getPushSubscriptions();

    const opponentSubscriptions =
      subscriptions.filter(
        entry =>
          entry.playerId ===
          opponentId
      );

    if (
      !opponentSubscriptions.length
    ) {
      return;
    }

    const amount =
      points === 2
        ?
        2
        :
        1;

    const payload =
      JSON.stringify({
        title:
          '💧 Water Play',

        body:
          `${scorer?.name || 'Opponent'} marcou +${amount}! `
          +
          `${p1?.name || 'Player 1'} `
          +
          `${data.today.scores.p1} × ${data.today.scores.p2} `
          +
          `${p2?.name || 'Player 2'}`,

        url:
          '/?room='
          +
          encodeURIComponent(
            room
          ),

        timestamp:
          Date.now()
      });

    const deadEndpoints =
      new Set();

    for (
      const entry
      of
      opponentSubscriptions
    ) {
      try {
        await webpush.sendNotification(
          entry.subscription,
          payload,
          {
            vapidDetails: {
              subject:
                this.env.VAPID_SUBJECT
                ||
                'mailto:ontheroadrivein@gmail.com',

              publicKey:
                this.env.VAPID_PUBLIC_KEY,

              privateKey:
                this.env.VAPID_PRIVATE_KEY
            },

            TTL:
              3600,

            urgency:
              'high'
          }
        );
      }

      catch (err) {
        console.error(
          'Push error:',
          err
        );

        const status =
          err?.statusCode
          ||
          err?.status;

        if (
          status === 404
          ||
          status === 410
        ) {
          deadEndpoints.add(
            entry.subscription.endpoint
          );
        }
      }
    }

    if (
      deadEndpoints.size
    ) {
      const cleaned =
        subscriptions.filter(
          entry =>
            !deadEndpoints.has(
              entry.subscription.endpoint
            )
        );

      await this.savePushSubscriptions(
        cleaned
      );
    }
  }

  async fetch(
    request
  ) {
    const url =
      new URL(
        request.url
      );

    const room =
      url.searchParams.get(
        'room'
      )
      ||
      'default-room';

    // =========================================
    // WEBSOCKET
    // =========================================

    if (
      url.pathname ===
      '/ws'
    ) {
      const pair =
        new WebSocketPair();

      const client =
        pair[0];

      const server =
        pair[1];

      server.accept();

      this.sockets.add(
        server
      );

      server.addEventListener(
        'close',
        () =>
          this.sockets.delete(
            server
          )
      );

      server.addEventListener(
        'error',
        () =>
          this.sockets.delete(
            server
          )
      );

      const data =
        await this.normalizeDay(
          await this.getData()
        );

      server.send(
        JSON.stringify({
          type:
            'state',

          data
        })
      );

      return new Response(
        null,
        {
          status:
            101,

          webSocket:
            client
        }
      );
    }

    // =========================================
    // STATE
    // =========================================

    if (
      url.pathname ===
        '/state'
      &&
      request.method ===
        'GET'
    ) {
      const data =
        await this.normalizeDay(
          await this.getData()
        );

      return Response.json({
        ok: true,
        data
      });
    }

    // =========================================
    // PUSH PUBLIC KEY
    // =========================================

    if (
      url.pathname ===
        '/push-key'
      &&
      request.method ===
        'GET'
    ) {
      return Response.json({
        ok: true,

        publicKey:
          this.env.VAPID_PUBLIC_KEY
          ||
          ''
      });
    }

    // =========================================
    // PUSH SUBSCRIBE
    // =========================================

    if (
      url.pathname ===
        '/subscribe'
      &&
      request.method ===
        'POST'
    ) {
      const body =
        await request.json();

      if (
        ![
          'p1',
          'p2'
        ].includes(
          body.playerId
        )
      ) {
        return Response.json(
          {
            ok: false,

            error:
              'Invalid player'
          },
          {
            status:
              400
          }
        );
      }

      if (
        !body.subscription
        ||
        !body.subscription.endpoint
      ) {
        return Response.json(
          {
            ok: false,

            error:
              'Invalid push subscription'
          },
          {
            status:
              400
          }
        );
      }

      let subscriptions =
        await this.getPushSubscriptions();

      subscriptions =
        subscriptions.filter(
          entry =>
            entry.subscription.endpoint
            !==
            body.subscription.endpoint
        );

      subscriptions.push({
        playerId:
          body.playerId,

        subscription:
          body.subscription,

        addedAt:
          new Date()
            .toISOString()
      });

      await this.savePushSubscriptions(
        subscriptions
      );

      return Response.json({
        ok: true
      });
    }

    // =========================================
    // PUSH UNSUBSCRIBE
    // =========================================

    if (
      url.pathname ===
        '/unsubscribe'
      &&
      request.method ===
        'POST'
    ) {
      const body =
        await request.json();

      const subscriptions =
        await this.getPushSubscriptions();

      const cleaned =
        subscriptions.filter(
          entry =>
            entry.subscription.endpoint
            !==
            body.endpoint
        );

      await this.savePushSubscriptions(
        cleaned
      );

      return Response.json({
        ok: true
      });
    }

    // =========================================
    // ADD POINTS
    //
    // Glass  = 1
    // Bottle = 2
    // =========================================

    if (
      url.pathname ===
        '/point'
      &&
      request.method ===
        'POST'
    ) {
      const body =
        await request.json();

      if (
        ![
          'p1',
          'p2'
        ].includes(
          body.playerId
        )
      ) {
        return Response.json(
          {
            ok: false,

            error:
              'Invalid player'
          },
          {
            status:
              400
          }
        );
      }

      const points =
        Number(
          body.points
        ) === 2
          ?
          2
          :
          1;

      const data =
        await this.normalizeDay(
          await this.getData()
        );

      data.today.scores[
        body.playerId
      ] =
        (
          data.today.scores[
            body.playerId
          ]
          ||
          0
        )
        +
        points;

      data.today.events.push({
        id:
          crypto.randomUUID(),

        playerId:
          body.playerId,

        points:
          points,

        at:
          new Date()
            .toISOString()
      });

      await this.state.storage.put(
        'data',
        data
      );

      this.broadcast({
        type:
          'state',

        data
      });

      try {
        await this.sendPushToOpponent(
          data,
          body.playerId,
          room,
          points
        );
      }

      catch (err) {
        console.error(
          'Push notification failed:',
          err
        );
      }

      return Response.json({
        ok: true,

        pointsAdded:
          points,

        data
      });
    }

    // =========================================
    // UNDO
    //
    // Old events without "points" = 1 point.
    // =========================================

    if (
      url.pathname ===
        '/undo'
      &&
      request.method ===
        'POST'
    ) {
      const data =
        await this.normalizeDay(
          await this.getData()
        );

      const last =
        data.today.events.pop();

      if (
        last
      ) {
        const pointsToRemove =
          Number(
            last.points
          ) === 2
            ?
            2
            :
            1;

        data.today.scores[
          last.playerId
        ] =
          Math.max(
            0,
            (
              data.today.scores[
                last.playerId
              ]
              ||
              0
            )
            -
            pointsToRemove
          );

        await this.state.storage.put(
          'data',
          data
        );

        this.broadcast({
          type:
            'state',

          data
        });
      }

      return Response.json({
        ok: true,

        data
      });
    }

    // =========================================
    // CLOSE DAY
    // =========================================

    if (
      url.pathname ===
        '/close-day'
      &&
      request.method ===
        'POST'
    ) {
      const data =
        await this.normalizeDay(
          await this.getData()
        );

      data.history.push({
        ...data.today,

        closedAt:
          new Date()
            .toISOString()
      });

      data.today = {
        date:
          this.todayKey(),

        scores: {
          p1: 0,
          p2: 0
        },

        events: []
      };

      await this.state.storage.put(
        'data',
        data
      );

      this.broadcast({
        type:
          'state',

        data
      });

      return Response.json({
        ok: true,

        data
      });
    }

    // =========================================
    // NAMES
    // =========================================

    if (
      url.pathname ===
        '/settings'
      &&
      request.method ===
        'POST'
    ) {
      const body =
        await request.json();

      const data =
        await this.normalizeDay(
          await this.getData()
        );

      if (
        typeof body.p1 ===
          'string'
        &&
        body.p1.trim()
      ) {
        data.players[0].name =
          body.p1
            .trim()
            .slice(
              0,
              30
            );
      }

      if (
        typeof body.p2 ===
          'string'
        &&
        body.p2.trim()
      ) {
        data.players[1].name =
          body.p2
            .trim()
            .slice(
              0,
              30
            );
      }

      await this.state.storage.put(
        'data',
        data
      );

      this.broadcast({
        type:
          'state',

        data
      });

      return Response.json({
        ok: true,

        data
      });
    }

    return Response.json(
      {
        ok: false,

        error:
          'Not found'
      },
      {
        status:
          404
      }
    );
  }
}


// =============================================
// MAIN WORKER
// =============================================

export default {
  async fetch(
    request,
    env
  ) {
    const url =
      new URL(
        request.url
      );

    if (
      url.pathname.startsWith(
        '/api/'
      )
    ) {
      const room =
        url.searchParams.get(
          'room'
        )
        ||
        'default-room';

      const id =
        env.SCORE_ROOM
          .idFromName(
            room
          );

      const stub =
        env.SCORE_ROOM
          .get(
            id
          );

      const forward =
        new URL(
          request.url
        );

      forward.pathname =
        url.pathname.replace(
          /^\/api/,
          ''
        )
        ||
        '/';

      return stub.fetch(
        new Request(
          forward.toString(),
          request
        )
      );
    }

    return env.ASSETS.fetch(
      request
    );
  }
};