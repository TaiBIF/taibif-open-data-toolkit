import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  defaultLocale,
  Locale,
  locales,
  messages,
  type AppMessages,
} from '../i18n/locales';

const LOCALE_STORAGE_KEY = 'odt.locale';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: AppMessages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const isLocale = (value: string): value is Locale => {
  return locales.includes(value as Locale);
};

const getInitialLocale = (): Locale => {
  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (savedLocale && isLocale(savedLocale)) return savedLocale;
  return defaultLocale;
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      messages: messages[locale],
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n 必須在 <I18nProvider> 中使用');
  return context;
};
