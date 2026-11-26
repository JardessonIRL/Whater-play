// =========================================
// NOTIFICATION TEXT
//
// Built per subscription, in the language the
// phone chose in the app. Subscriptions saved
// before languages existed have no `lang`:
// those were the original Portuguese phones.
// =========================================

const TEXT = {

  en: {
    scored: '{name} scored +{points}!',
    test: 'Test notification ✓'
  },

  pt: {
    scored: '{name} marcou +{points}!',
    test: 'Notificação de teste ✓'
  },

  es: {
    scored: '¡{name} sumó +{points}!',
    test: 'Notificación de prueba ✓'
  },

  fr: {
    scored: '{name} a marqué +{points} !',
    test: 'Notification test ✓'
  }

};


export const PUSH_LANGUAGES =
  Object.keys(TEXT);


export function pushText(lang, key, vars = {}) {

  const strings =
    TEXT[lang] || TEXT.pt;

  return strings[key].replace(
    /\{(\w+)\}/g,
    (match, name) =>
      name in vars ? String(vars[name]) : match
  );

}
