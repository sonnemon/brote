import { useSyncExternalStore } from 'react';

import { en } from './en';
import { es, type Strings } from './es';

export type Lang = 'es' | 'en';
/** Lo que elige el usuario en Ajustes; "system" sigue el idioma del celular. */
export type LangPref = 'system' | Lang;

export type { Strings };

const DICTS: Record<Lang, Strings> = { es, en };

/** Español para los hablantes de español; inglés para todo lo demás. */
export function resolveLang(pref: LangPref, deviceLanguageCode: string | null | undefined): Lang {
  if (pref !== 'system') return pref;
  return deviceLanguageCode?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

let current: Lang = 'es';
const listeners = new Set<() => void>();

export function setLang(lang: Lang) {
  if (lang === current) return;
  current = lang;
  listeners.forEach((listener) => listener());
}

export const getLang = (): Lang => current;

/** Textos del idioma activo, para código fuera de React (formatos, notificaciones, CSV). */
export const strings = (): Strings => DICTS[current];

export function subscribeLang(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Textos del idioma activo; el componente se vuelve a pintar al cambiar el idioma. */
export function useStrings(): Strings {
  return DICTS[useSyncExternalStore(subscribeLang, getLang)];
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang);
}
