import i18n from 'i18next'
import ruTranslation from './locales/ru/translation.json'
import enTranslation from './locales/en/translation.json'

i18n.init({
  resources: {
    ru: {
      translation: ruTranslation,
    },
    en: {
      translation: enTranslation,
    },
  },
  lng: 'ru', 
  fallbackLng: 'ru',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n