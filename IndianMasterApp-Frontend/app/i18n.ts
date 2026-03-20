import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';

const resources = {
    en: { translation: en },
    ta: { translation: ta },
    hi: { translation: hi },
};

i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v4',
        resources,
        lng: Localization.getLocales()[0].languageCode ?? 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;
