import i18n from 'i18next';
import { initReactI18next } from 'react-i18next'; // Несмотря на название, работает без React

// Импорт ресурсов переводов
import ruTranslation from './locales/ru/translation.json';
import enTranslation from './locales/en/translation.json';

// Настройка i18next
i18n
  .use(initReactI18next) // Инициализация
  .init({
    resources: {
      ru: {
        translation: ruTranslation,
      },
      en: {
        translation: enTranslation,
      },
    },
    lng: 'ru', // Язык по умолчанию
    fallbackLng: 'ru', // Резервный язык
    debug: process.env.NODE_ENV === 'development', // Отладка только в development
    interpolation: {
      escapeValue: false, // React уже экранирует значения
    },
  });

export default i18n;