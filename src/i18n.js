import i18n from 'i18next'

// Импорт ресурсов переводов
import ruTranslation from './locales/ru/translation.json'
import enTranslation from './locales/en/translation.json'

// Настройка i18next БЕЗ React
i18n.init({
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
  debug: false,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n