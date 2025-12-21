/* eslint-env node */
import i18next from 'i18next'
import { createApp } from './app.js'
import resources from './locales/index.js'

const initI18n = () => i18next.init({
  lng: 'ru',
  debug: false,
  resources,
})

const initApp = async () => {
  try {
    await initI18n()
    const app = createApp()

  if (process.env.NODE_ENV !== 'production' && typeof globalThis !== 'undefined') {
  globalThis.__DEBUG_APP__ = app
  }

    return app
  }
  catch (error) {
    console.error('Failed to initialize application:', error)
    throw error
  }
}

export default initApp
