/* eslint-env node */
import { createInstance } from 'i18next'
import { createApp } from './app.js'
import resources from './locales/index.js'

export const initI18n = () => {
  const i18nInstance = createInstance()
  return i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  }).then(() => i18nInstance)
}

export const initApp = async () => {
  try {
    const i18nInstance = await initI18n()
    const app = createApp(i18nInstance)

    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      console.log('App initialized:', app)
    }

    return { app, i18nInstance }
  }
  catch (error) {
    console.error('Failed to initialize application:', error)
    throw error
  }
}

export default initApp
