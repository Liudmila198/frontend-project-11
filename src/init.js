/* eslint-env node */
import i18next from 'i18next'
import { createApp } from './app.js'
import resources from './locales/index.js'

const createI18nInstance = () => {
  return i18next.createInstance()
}

const initI18n = async (i18nInstance = i18next) => {
  return i18nInstance.init({
    lng: 'ru',
    debug: process.env.NODE_ENV === 'development',
    resources,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  })
}

const initApp = async () => {
  try {
    await initI18n()
    if (!i18next.isInitialized) {
      throw new Error('i18next failed to initialize')
    }
    const app = createApp()
    if (process.env.NODE_ENV !== 'production' && typeof globalThis !== 'undefined') {
      globalThis.__DEBUG_APP__ = app
      globalThis.__DEBUG_I18N__ = i18next
    }

    return app
  }
  catch (error) {
    console.error('Failed to initialize application:', error)
    throw error
  }
}

export default initApp
export { createI18nInstance, initI18n }
