/* eslint-env node */
import i18next from 'i18next'
import { createApp } from './app.js'
import resources from './locales/index.js'

export const initI18n = () => {
  const instance = i18next.createInstance()
  return instance.init({
    lng: 'ru',
    debug: false,
    resources,
  }).then(() => instance)
}

export const initApp = async () => {
  try {
    const i18nInstance = await initI18n()
    const app = createApp(i18nInstance)

    // Для отладки в development mode
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      window.app = app
    }

    return app
  } catch (error) {
    console.error('Failed to initialize application:', error)
    throw error
  }
}

export default initApp