import { getLocales } from 'expo-localization';
import { AppState } from 'react-native';

import { getLang, resolveLang, setLang, type LangPref } from '@/i18n';

import { getKv, setKv } from './repo';

const PREF_KEY = 'language';

export function getLanguagePref(): LangPref {
  const value = getKv(PREF_KEY);
  return value === 'es' || value === 'en' ? value : 'system';
}

const deviceLanguage = () => getLocales()[0]?.languageCode ?? null;

function apply() {
  setLang(resolveLang(getLanguagePref(), deviceLanguage()));
}

export function setLanguagePref(pref: LangPref) {
  setKv(PREF_KEY, pref);
  apply();
}

/**
 * Fija el idioma al arrancar. En Android cambiar el idioma del sistema no reinicia la app,
 * así que se vuelve a leer al volver a primer plano.
 */
export function initLanguage(): () => void {
  apply();
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') apply();
  });
  return () => sub.remove();
}

export { getLang };
