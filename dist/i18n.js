/*
  Translations: English, Português (BR), Español, Français.

  Language = saved choice, else the phone's language,
  else English. Exposes window.I18n.
*/
(() => {

  const STORAGE_KEY =
    'water_play_lang';

  const LANGUAGES = [
    { code: 'en', locale: 'en-GB', label: '🇬🇧 English' },
    { code: 'pt', locale: 'pt-BR', label: '🇧🇷 Português' },
    { code: 'es', locale: 'es-ES', label: '🇪🇸 Español' },
    { code: 'fr', locale: 'fr-FR', label: '🇫🇷 Français' }
  ];


  const STRINGS = {

    en: {
      // app
      'app.room': 'Room: {room}',
      'conn.connecting': 'connecting…',
      'conn.live': 'live',
      'conn.reconnecting': 'reconnecting…',
      'conn.error': 'connection error',
      'conn.offline': 'offline',
      'add.glass': 'Glass',
      'add.bottle': 'Bottle',
      'add.one': '+1 point',
      'add.two': '+2 points',
      'add.oneAria': 'Add one point',
      'add.twoAria': 'Add two points',
      'btn.undo': 'Undo last point',
      'btn.closeDay': 'Close day',
      'today.none': 'No points yet today.',
      'today.last': 'Last: {name} +{points} · {time}',
      'general.title': 'Overall score',
      'general.totalPoints': '{name} total points',
      'general.daysWon': '{name} days won',
      'history.title': 'History',
      'history.empty': 'No closed days yet.',
      'history.winner': 'Winner: {name}',
      'history.tie': 'Tie',
      'charts.weekly': 'Weekly',
      'charts.monthly': 'Monthly',
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.p1': 'Player 1 name',
      'settings.p2': 'Player 2 name',
      'settings.save': 'Save names',
      'nav.today': 'Today',
      'nav.general': 'General',
      'nav.history': 'History',
      'nav.charts': 'Charts',
      'nav.settings': 'Settings',
      'toast.addFailed': 'Could not add points',
      'toast.connError': 'Connection error',
      'toast.undone': 'Last score removed',
      'toast.undoFailed': 'Undo failed',
      'toast.dayClosed': 'Day closed',
      'toast.namesSaved': 'Names saved',
      'confirm.closeDay': 'Close today?',

      // room gate
      'gate.tagline': 'A shared daily water score for two. Create a room or join one with its code and PIN.',
      'gate.create': 'Create a room',
      'gate.join': 'Join a room',
      'gate.createRoom': 'Create room',
      'gate.yourName': 'Your name',
      'gate.otherName': "The other player's name",
      'gate.pinLabel': 'Room PIN (4 to 8 digits)',
      'gate.confirmPin': 'Confirm PIN',
      'gate.back': 'Back',
      'gate.pinFormat': 'The PIN must be 4 to 8 digits.',
      'gate.pinMismatch': "The PINs don't match.",
      'gate.creating': 'Creating…',
      'gate.created': 'Room created ✓',
      'gate.roomCode': 'Room code',
      'gate.createdNote': 'Send the code to the other player and tell them the PIN. Save both: you will need them on a new phone.',
      'gate.share': 'Share invite',
      'gate.inviteText': 'Join my Water Play room! Code: {room}',
      'gate.inviteCopied': 'Invite copied.',
      'gate.enter': 'Enter room',
      'gate.joinRoom': 'Join room',
      'gate.pin': 'PIN',
      'gate.enterCode': 'Enter the room code.',
      'gate.checking': 'Checking…',
      'gate.protectTitle': 'Protect your room',
      'gate.protectNote': 'Room "{room}" doesn\'t have a PIN yet. Choose one now. The other player will need it once on their phone. Your scores are kept.',
      'gate.newPin': 'New PIN (4 to 8 digits)',
      'gate.savePin': 'Save PIN',
      'gate.saving': 'Saving…',
      'gate.alreadyHasPin': 'This room already has a PIN. Enter it below.',
      'gate.pinChanged': 'The room PIN changed or is wrong. Enter it again.',
      'gate.noConnection': 'No connection. Try again.',

      // server error codes
      'err.room_not_found': 'Room not found. Check the code.',
      'err.invalid_pin': 'Wrong PIN.',
      'err.pin_required': 'Enter the room PIN.',
      'err.pin_format': 'The PIN must be 4 to 8 digits.',
      'err.too_many_attempts': 'Too many wrong PINs. Try again in {minutes} min.',
      'err.invalid_player': 'Invalid player.',
      'err.invalid_subscription': 'Invalid notification subscription.',
      'err.vapid_missing': 'Notifications are not configured on the server.',
      'err.device_not_registered': 'This device is not registered. Tap "Enable notifications" again.',
      'err.create_failed': 'Could not create a room. Try again.',
      'err.push_failed': 'The notification service refused the message.',
      'err.invalid_response': 'Invalid server response',
      'err.generic': 'Something went wrong. Try again.',

      // notifications section
      'push.title': 'Notifications',
      'push.description': 'Choose who owns this phone. When the other player scores, this device will receive a notification.',
      'push.belongsTo': 'This device belongs to',
      'push.selectPlayer': 'Select player',
      'push.enable': 'Enable notifications',
      'push.enabling': 'Enabling…',
      'push.enabledButton': 'Notifications enabled',
      'push.enabledNow': '✓ Notifications enabled for this device.',
      'push.test': 'Send test notification',
      'push.testSent': '✓ Test sent. It should arrive in a few seconds.',
      'push.testFailed': 'Test notification failed.',
      'push.renewing': 'Renewing this device registration…',
      'push.unsupportedDevice': 'Notifications are not supported on this device.',
      'push.unsupportedBrowser': 'Notifications are not supported by this browser.',
      'push.noServiceWorker': 'This browser does not support Service Workers.',
      'push.blocked': 'Notifications are blocked in browser settings.',
      'push.enabledOnDevice': 'Notifications enabled on this device.',
      'push.chooseOwner': 'Push is enabled. Choose who owns this device.',
      'push.notEnabledYet': 'Notifications are not enabled yet.',
      'push.chooseFirst': 'Choose who owns this device first.',
      'push.permissionDenied': 'Notification permission was not granted.',
      'push.noPublicKey': 'Notifications are not configured on the server.',
      'push.saveFailed': 'Could not save notification subscription.',
      'push.enableFailed': 'Could not enable notifications.',
      'push.notEnabledDevice': 'Notifications are not enabled on this device yet.'
    },

    pt: {
      'app.room': 'Sala: {room}',
      'conn.connecting': 'conectando…',
      'conn.live': 'ao vivo',
      'conn.reconnecting': 'reconectando…',
      'conn.error': 'erro de conexão',
      'conn.offline': 'sem conexão',
      'add.glass': 'Copo',
      'add.bottle': 'Garrafa',
      'add.one': '+1 ponto',
      'add.two': '+2 pontos',
      'add.oneAria': 'Adicionar um ponto',
      'add.twoAria': 'Adicionar dois pontos',
      'btn.undo': 'Desfazer último ponto',
      'btn.closeDay': 'Fechar o dia',
      'today.none': 'Nenhum ponto hoje ainda.',
      'today.last': 'Último: {name} +{points} · {time}',
      'general.title': 'Placar geral',
      'general.totalPoints': 'Pontos de {name}',
      'general.daysWon': 'Dias vencidos por {name}',
      'history.title': 'Histórico',
      'history.empty': 'Nenhum dia fechado ainda.',
      'history.winner': 'Vencedor: {name}',
      'history.tie': 'Empate',
      'charts.weekly': 'Semanal',
      'charts.monthly': 'Mensal',
      'settings.title': 'Configurações',
      'settings.language': 'Idioma',
      'settings.p1': 'Nome do jogador 1',
      'settings.p2': 'Nome do jogador 2',
      'settings.save': 'Salvar nomes',
      'nav.today': 'Hoje',
      'nav.general': 'Geral',
      'nav.history': 'Histórico',
      'nav.charts': 'Gráficos',
      'nav.settings': 'Ajustes',
      'toast.addFailed': 'Não foi possível adicionar pontos',
      'toast.connError': 'Erro de conexão',
      'toast.undone': 'Último ponto removido',
      'toast.undoFailed': 'Não foi possível desfazer',
      'toast.dayClosed': 'Dia fechado',
      'toast.namesSaved': 'Nomes salvos',
      'confirm.closeDay': 'Fechar o dia de hoje?',

      'gate.tagline': 'Um placar diário de água para duas pessoas. Crie uma sala ou entre em uma com o código e o PIN.',
      'gate.create': 'Criar uma sala',
      'gate.join': 'Entrar numa sala',
      'gate.createRoom': 'Criar sala',
      'gate.yourName': 'Seu nome',
      'gate.otherName': 'Nome do outro jogador',
      'gate.pinLabel': 'PIN da sala (4 a 8 dígitos)',
      'gate.confirmPin': 'Confirme o PIN',
      'gate.back': 'Voltar',
      'gate.pinFormat': 'O PIN deve ter de 4 a 8 dígitos.',
      'gate.pinMismatch': 'Os PINs não são iguais.',
      'gate.creating': 'Criando…',
      'gate.created': 'Sala criada ✓',
      'gate.roomCode': 'Código da sala',
      'gate.createdNote': 'Envie o código para o outro jogador e diga o PIN. Guarde os dois: você vai precisar deles num celular novo.',
      'gate.share': 'Compartilhar convite',
      'gate.inviteText': 'Entre na minha sala do Water Play! Código: {room}',
      'gate.inviteCopied': 'Convite copiado.',
      'gate.enter': 'Entrar na sala',
      'gate.joinRoom': 'Entrar',
      'gate.pin': 'PIN',
      'gate.enterCode': 'Digite o código da sala.',
      'gate.checking': 'Verificando…',
      'gate.protectTitle': 'Proteja sua sala',
      'gate.protectNote': 'A sala "{room}" ainda não tem PIN. Escolha um agora. O outro jogador vai precisar digitá-lo uma vez no celular. Seu placar é mantido.',
      'gate.newPin': 'Novo PIN (4 a 8 dígitos)',
      'gate.savePin': 'Salvar PIN',
      'gate.saving': 'Salvando…',
      'gate.alreadyHasPin': 'Esta sala já tem PIN. Digite-o abaixo.',
      'gate.pinChanged': 'O PIN da sala mudou ou está errado. Digite de novo.',
      'gate.noConnection': 'Sem conexão. Tente de novo.',

      'err.room_not_found': 'Sala não encontrada. Confira o código.',
      'err.invalid_pin': 'PIN errado.',
      'err.pin_required': 'Digite o PIN da sala.',
      'err.pin_format': 'O PIN deve ter de 4 a 8 dígitos.',
      'err.too_many_attempts': 'Muitos PINs errados. Tente de novo em {minutes} min.',
      'err.invalid_player': 'Jogador inválido.',
      'err.invalid_subscription': 'Inscrição de notificação inválida.',
      'err.vapid_missing': 'As notificações não estão configuradas no servidor.',
      'err.device_not_registered': 'Este aparelho não está registrado. Toque em "Ativar notificações" de novo.',
      'err.create_failed': 'Não foi possível criar a sala. Tente de novo.',
      'err.push_failed': 'O serviço de notificações recusou a mensagem.',
      'err.invalid_response': 'Resposta inválida do servidor',
      'err.generic': 'Algo deu errado. Tente de novo.',

      'push.title': 'Notificações',
      'push.description': 'Escolha de quem é este celular. Quando o outro jogador pontuar, este aparelho recebe uma notificação.',
      'push.belongsTo': 'Este aparelho é de',
      'push.selectPlayer': 'Escolha o jogador',
      'push.enable': 'Ativar notificações',
      'push.enabling': 'Ativando…',
      'push.enabledButton': 'Notificações ativadas',
      'push.enabledNow': '✓ Notificações ativadas neste aparelho.',
      'push.test': 'Enviar notificação de teste',
      'push.testSent': '✓ Teste enviado. Deve chegar em alguns segundos.',
      'push.testFailed': 'A notificação de teste falhou.',
      'push.renewing': 'Renovando o registro deste aparelho…',
      'push.unsupportedDevice': 'Este aparelho não suporta notificações.',
      'push.unsupportedBrowser': 'Este navegador não suporta notificações.',
      'push.noServiceWorker': 'Este navegador não suporta Service Workers.',
      'push.blocked': 'As notificações estão bloqueadas nas configurações do navegador.',
      'push.enabledOnDevice': 'Notificações ativadas neste aparelho.',
      'push.chooseOwner': 'Notificações ativadas. Escolha de quem é este aparelho.',
      'push.notEnabledYet': 'As notificações ainda não estão ativadas.',
      'push.chooseFirst': 'Primeiro escolha de quem é este aparelho.',
      'push.permissionDenied': 'A permissão de notificação não foi concedida.',
      'push.noPublicKey': 'As notificações não estão configuradas no servidor.',
      'push.saveFailed': 'Não foi possível salvar a inscrição de notificação.',
      'push.enableFailed': 'Não foi possível ativar as notificações.',
      'push.notEnabledDevice': 'As notificações ainda não estão ativadas neste aparelho.'
    },

    es: {
      'app.room': 'Sala: {room}',
      'conn.connecting': 'conectando…',
      'conn.live': 'en vivo',
      'conn.reconnecting': 'reconectando…',
      'conn.error': 'error de conexión',
      'conn.offline': 'sin conexión',
      'add.glass': 'Vaso',
      'add.bottle': 'Botella',
      'add.one': '+1 punto',
      'add.two': '+2 puntos',
      'add.oneAria': 'Sumar un punto',
      'add.twoAria': 'Sumar dos puntos',
      'btn.undo': 'Deshacer último punto',
      'btn.closeDay': 'Cerrar el día',
      'today.none': 'Aún no hay puntos hoy.',
      'today.last': 'Último: {name} +{points} · {time}',
      'general.title': 'Marcador general',
      'general.totalPoints': 'Puntos de {name}',
      'general.daysWon': 'Días ganados por {name}',
      'history.title': 'Historial',
      'history.empty': 'Aún no hay días cerrados.',
      'history.winner': 'Ganador: {name}',
      'history.tie': 'Empate',
      'charts.weekly': 'Semanal',
      'charts.monthly': 'Mensual',
      'settings.title': 'Ajustes',
      'settings.language': 'Idioma',
      'settings.p1': 'Nombre del jugador 1',
      'settings.p2': 'Nombre del jugador 2',
      'settings.save': 'Guardar nombres',
      'nav.today': 'Hoy',
      'nav.general': 'General',
      'nav.history': 'Historial',
      'nav.charts': 'Gráficos',
      'nav.settings': 'Ajustes',
      'toast.addFailed': 'No se pudieron sumar puntos',
      'toast.connError': 'Error de conexión',
      'toast.undone': 'Último punto eliminado',
      'toast.undoFailed': 'No se pudo deshacer',
      'toast.dayClosed': 'Día cerrado',
      'toast.namesSaved': 'Nombres guardados',
      'confirm.closeDay': '¿Cerrar el día de hoy?',

      'gate.tagline': 'Un marcador diario de agua para dos. Crea una sala o únete a una con su código y PIN.',
      'gate.create': 'Crear una sala',
      'gate.join': 'Unirse a una sala',
      'gate.createRoom': 'Crear sala',
      'gate.yourName': 'Tu nombre',
      'gate.otherName': 'Nombre del otro jugador',
      'gate.pinLabel': 'PIN de la sala (4 a 8 dígitos)',
      'gate.confirmPin': 'Confirma el PIN',
      'gate.back': 'Volver',
      'gate.pinFormat': 'El PIN debe tener de 4 a 8 dígitos.',
      'gate.pinMismatch': 'Los PIN no coinciden.',
      'gate.creating': 'Creando…',
      'gate.created': 'Sala creada ✓',
      'gate.roomCode': 'Código de la sala',
      'gate.createdNote': 'Envía el código al otro jugador y dile el PIN. Guarda ambos: los necesitarás en un teléfono nuevo.',
      'gate.share': 'Compartir invitación',
      'gate.inviteText': '¡Únete a mi sala de Water Play! Código: {room}',
      'gate.inviteCopied': 'Invitación copiada.',
      'gate.enter': 'Entrar en la sala',
      'gate.joinRoom': 'Unirse',
      'gate.pin': 'PIN',
      'gate.enterCode': 'Escribe el código de la sala.',
      'gate.checking': 'Comprobando…',
      'gate.protectTitle': 'Protege tu sala',
      'gate.protectNote': 'La sala "{room}" aún no tiene PIN. Elige uno ahora. El otro jugador lo necesitará una vez en su teléfono. Tu marcador se conserva.',
      'gate.newPin': 'Nuevo PIN (4 a 8 dígitos)',
      'gate.savePin': 'Guardar PIN',
      'gate.saving': 'Guardando…',
      'gate.alreadyHasPin': 'Esta sala ya tiene PIN. Escríbelo abajo.',
      'gate.pinChanged': 'El PIN de la sala cambió o es incorrecto. Escríbelo de nuevo.',
      'gate.noConnection': 'Sin conexión. Inténtalo de nuevo.',

      'err.room_not_found': 'Sala no encontrada. Revisa el código.',
      'err.invalid_pin': 'PIN incorrecto.',
      'err.pin_required': 'Escribe el PIN de la sala.',
      'err.pin_format': 'El PIN debe tener de 4 a 8 dígitos.',
      'err.too_many_attempts': 'Demasiados PIN incorrectos. Inténtalo en {minutes} min.',
      'err.invalid_player': 'Jugador no válido.',
      'err.invalid_subscription': 'Suscripción de notificaciones no válida.',
      'err.vapid_missing': 'Las notificaciones no están configuradas en el servidor.',
      'err.device_not_registered': 'Este dispositivo no está registrado. Toca "Activar notificaciones" de nuevo.',
      'err.create_failed': 'No se pudo crear la sala. Inténtalo de nuevo.',
      'err.push_failed': 'El servicio de notificaciones rechazó el mensaje.',
      'err.invalid_response': 'Respuesta no válida del servidor',
      'err.generic': 'Algo salió mal. Inténtalo de nuevo.',

      'push.title': 'Notificaciones',
      'push.description': 'Elige de quién es este teléfono. Cuando el otro jugador sume puntos, este dispositivo recibirá una notificación.',
      'push.belongsTo': 'Este dispositivo es de',
      'push.selectPlayer': 'Elige el jugador',
      'push.enable': 'Activar notificaciones',
      'push.enabling': 'Activando…',
      'push.enabledButton': 'Notificaciones activadas',
      'push.enabledNow': '✓ Notificaciones activadas en este dispositivo.',
      'push.test': 'Enviar notificación de prueba',
      'push.testSent': '✓ Prueba enviada. Llegará en unos segundos.',
      'push.testFailed': 'La notificación de prueba falló.',
      'push.renewing': 'Renovando el registro de este dispositivo…',
      'push.unsupportedDevice': 'Este dispositivo no admite notificaciones.',
      'push.unsupportedBrowser': 'Este navegador no admite notificaciones.',
      'push.noServiceWorker': 'Este navegador no admite Service Workers.',
      'push.blocked': 'Las notificaciones están bloqueadas en los ajustes del navegador.',
      'push.enabledOnDevice': 'Notificaciones activadas en este dispositivo.',
      'push.chooseOwner': 'Notificaciones activadas. Elige de quién es este dispositivo.',
      'push.notEnabledYet': 'Las notificaciones aún no están activadas.',
      'push.chooseFirst': 'Primero elige de quién es este dispositivo.',
      'push.permissionDenied': 'No se concedió el permiso de notificaciones.',
      'push.noPublicKey': 'Las notificaciones no están configuradas en el servidor.',
      'push.saveFailed': 'No se pudo guardar la suscripción de notificaciones.',
      'push.enableFailed': 'No se pudieron activar las notificaciones.',
      'push.notEnabledDevice': 'Las notificaciones aún no están activadas en este dispositivo.'
    },

    fr: {
      'app.room': 'Salle : {room}',
      'conn.connecting': 'connexion…',
      'conn.live': 'en direct',
      'conn.reconnecting': 'reconnexion…',
      'conn.error': 'erreur de connexion',
      'conn.offline': 'hors ligne',
      'add.glass': 'Verre',
      'add.bottle': 'Bouteille',
      'add.one': '+1 point',
      'add.two': '+2 points',
      'add.oneAria': 'Ajouter un point',
      'add.twoAria': 'Ajouter deux points',
      'btn.undo': 'Annuler le dernier point',
      'btn.closeDay': 'Clôturer la journée',
      'today.none': "Aucun point aujourd'hui.",
      'today.last': 'Dernier : {name} +{points} · {time}',
      'general.title': 'Score général',
      'general.totalPoints': 'Points de {name}',
      'general.daysWon': 'Jours gagnés par {name}',
      'history.title': 'Historique',
      'history.empty': 'Aucune journée clôturée.',
      'history.winner': 'Gagnant : {name}',
      'history.tie': 'Égalité',
      'charts.weekly': 'Semaine',
      'charts.monthly': 'Mois',
      'settings.title': 'Réglages',
      'settings.language': 'Langue',
      'settings.p1': 'Nom du joueur 1',
      'settings.p2': 'Nom du joueur 2',
      'settings.save': 'Enregistrer les noms',
      'nav.today': "Aujourd'hui",
      'nav.general': 'Général',
      'nav.history': 'Historique',
      'nav.charts': 'Graphiques',
      'nav.settings': 'Réglages',
      'toast.addFailed': "Impossible d'ajouter des points",
      'toast.connError': 'Erreur de connexion',
      'toast.undone': 'Dernier point supprimé',
      'toast.undoFailed': "Impossible d'annuler",
      'toast.dayClosed': 'Journée clôturée',
      'toast.namesSaved': 'Noms enregistrés',
      'confirm.closeDay': "Clôturer la journée d'aujourd'hui ?",

      'gate.tagline': "Un score d'eau quotidien à deux. Créez une salle ou rejoignez-en une avec son code et son PIN.",
      'gate.create': 'Créer une salle',
      'gate.join': 'Rejoindre une salle',
      'gate.createRoom': 'Créer la salle',
      'gate.yourName': 'Votre nom',
      'gate.otherName': "Nom de l'autre joueur",
      'gate.pinLabel': 'PIN de la salle (4 à 8 chiffres)',
      'gate.confirmPin': 'Confirmez le PIN',
      'gate.back': 'Retour',
      'gate.pinFormat': 'Le PIN doit contenir 4 à 8 chiffres.',
      'gate.pinMismatch': 'Les PIN ne correspondent pas.',
      'gate.creating': 'Création…',
      'gate.created': 'Salle créée ✓',
      'gate.roomCode': 'Code de la salle',
      'gate.createdNote': "Envoyez le code à l'autre joueur et donnez-lui le PIN. Gardez les deux : vous en aurez besoin sur un nouveau téléphone.",
      'gate.share': "Partager l'invitation",
      'gate.inviteText': 'Rejoins ma salle Water Play ! Code : {room}',
      'gate.inviteCopied': 'Invitation copiée.',
      'gate.enter': 'Entrer dans la salle',
      'gate.joinRoom': 'Rejoindre',
      'gate.pin': 'PIN',
      'gate.enterCode': 'Saisissez le code de la salle.',
      'gate.checking': 'Vérification…',
      'gate.protectTitle': 'Protégez votre salle',
      'gate.protectNote': "La salle « {room} » n'a pas encore de PIN. Choisissez-en un maintenant. L'autre joueur devra le saisir une fois sur son téléphone. Vos scores sont conservés.",
      'gate.newPin': 'Nouveau PIN (4 à 8 chiffres)',
      'gate.savePin': 'Enregistrer le PIN',
      'gate.saving': 'Enregistrement…',
      'gate.alreadyHasPin': 'Cette salle a déjà un PIN. Saisissez-le ci-dessous.',
      'gate.pinChanged': 'Le PIN de la salle a changé ou est incorrect. Saisissez-le à nouveau.',
      'gate.noConnection': 'Pas de connexion. Réessayez.',

      'err.room_not_found': 'Salle introuvable. Vérifiez le code.',
      'err.invalid_pin': 'PIN incorrect.',
      'err.pin_required': 'Saisissez le PIN de la salle.',
      'err.pin_format': 'Le PIN doit contenir 4 à 8 chiffres.',
      'err.too_many_attempts': 'Trop de PIN incorrects. Réessayez dans {minutes} min.',
      'err.invalid_player': 'Joueur invalide.',
      'err.invalid_subscription': 'Abonnement aux notifications invalide.',
      'err.vapid_missing': 'Les notifications ne sont pas configurées sur le serveur.',
      'err.device_not_registered': "Cet appareil n'est pas enregistré. Touchez à nouveau « Activer les notifications ».",
      'err.create_failed': 'Impossible de créer la salle. Réessayez.',
      'err.push_failed': 'Le service de notifications a refusé le message.',
      'err.invalid_response': 'Réponse du serveur invalide',
      'err.generic': "Une erreur s'est produite. Réessayez.",

      'push.title': 'Notifications',
      'push.description': "Choisissez à qui appartient ce téléphone. Quand l'autre joueur marque, cet appareil reçoit une notification.",
      'push.belongsTo': 'Cet appareil appartient à',
      'push.selectPlayer': 'Choisissez le joueur',
      'push.enable': 'Activer les notifications',
      'push.enabling': 'Activation…',
      'push.enabledButton': 'Notifications activées',
      'push.enabledNow': '✓ Notifications activées sur cet appareil.',
      'push.test': 'Envoyer une notification test',
      'push.testSent': '✓ Test envoyé. Il devrait arriver dans quelques secondes.',
      'push.testFailed': 'La notification test a échoué.',
      'push.renewing': "Renouvellement de l'enregistrement de cet appareil…",
      'push.unsupportedDevice': 'Cet appareil ne prend pas en charge les notifications.',
      'push.unsupportedBrowser': 'Ce navigateur ne prend pas en charge les notifications.',
      'push.noServiceWorker': 'Ce navigateur ne prend pas en charge les Service Workers.',
      'push.blocked': 'Les notifications sont bloquées dans les réglages du navigateur.',
      'push.enabledOnDevice': 'Notifications activées sur cet appareil.',
      'push.chooseOwner': 'Notifications activées. Choisissez à qui appartient cet appareil.',
      'push.notEnabledYet': 'Les notifications ne sont pas encore activées.',
      'push.chooseFirst': "Choisissez d'abord à qui appartient cet appareil.",
      'push.permissionDenied': "L'autorisation de notification n'a pas été accordée.",
      'push.noPublicKey': 'Les notifications ne sont pas configurées sur le serveur.',
      'push.saveFailed': "Impossible d'enregistrer l'abonnement aux notifications.",
      'push.enableFailed': "Impossible d'activer les notifications.",
      'push.notEnabledDevice': 'Les notifications ne sont pas encore activées sur cet appareil.'
    }

  };


  function savedLang() {

    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    }
    catch (err) {
      return '';
    }

  }


  function detectLang() {

    const saved =
      savedLang();

    if (STRINGS[saved]) {
      return saved;
    }

    const wanted =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || 'en'];

    for (const tag of wanted) {

      const code =
        String(tag).toLowerCase().split('-')[0];

      if (STRINGS[code]) {
        return code;
      }

    }

    return 'en';

  }


  const lang =
    detectLang();

  const locale =
    LANGUAGES.find(item => item.code === lang).locale;

  document.documentElement.lang =
    locale;


  function t(key, vars = {}) {

    const template =
      STRINGS[lang][key] ??
      STRINGS.en[key] ??
      key;

    return template.replace(
      /\{(\w+)\}/g,
      (match, name) =>
        name in vars ? String(vars[name]) : match
    );

  }


  // Server error code -> message (unknown codes: generic)
  function error(code, vars) {

    if (!code) {
      return t('err.generic');
    }

    const key =
      'err.' + code;

    const message =
      key in STRINGS.en
        ? t(key, vars)
        : t('err.generic');

    // Technical detail from the push service, kept for diagnosis
    return vars && vars.detail
      ? `${message} (${vars.detail})`
      : message;

  }


  /*
    <span data-i18n="key">  -> textContent
    data-i18n-aria="key"    -> aria-label
  */
  function apply(root = document) {

    root.querySelectorAll('[data-i18n]').forEach(node => {
      node.textContent = t(node.dataset.i18n);
    });

    root.querySelectorAll('[data-i18n-aria]').forEach(node => {
      node.setAttribute('aria-label', t(node.dataset.i18nAria));
    });

  }


  function setLang(code) {

    if (!STRINGS[code] || code === lang) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, code);
    }
    catch (err) {
      console.error(err);
    }

    location.reload();

  }


  // Ready-made language <select>
  function picker(extraStyle = '') {

    const select =
      document.createElement('select');

    select.setAttribute('aria-label', t('settings.language'));

    select.style.cssText = extraStyle;

    for (const item of LANGUAGES) {

      const option =
        document.createElement('option');

      option.value = item.code;
      option.textContent = item.label;
      option.selected = item.code === lang;

      select.appendChild(option);

    }

    select.addEventListener('change', () => setLang(select.value));

    return select;

  }


  window.I18n = {
    lang,
    locale,
    languages: LANGUAGES,
    strings: STRINGS,
    t,
    error,
    apply,
    setLang,
    picker
  };

})();
