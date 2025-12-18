/* eslint-env node */
import i18next from 'i18next'
import { createApp } from './app.js'
import resources from './locales/index.js'

export const initI18n = () => i18next.init({
  lng: 'ru',
  debug: false,
  resources,
})

export const initApp = async () => {
  try {
    await initI18n()
    const app = createApp(i18next)

    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      // Для совместимости с тестами оставляем window.app
      window.app = app
    }

    return app
  }
  catch (error) {
    console.error('Failed to initialize application:', error)
    throw error
  }
}

export default initApp
