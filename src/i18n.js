import i18next from 'i18next'
import ruTranslation from './locales/ru/translation.json'

const initI18n = () => {
  return i18next.init({
    lng: 'ru',
    debug: false,
    resources: {
      ru: {
        translation: ruTranslation,
      },
    },
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  })
}

export default initI18n