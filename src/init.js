/* eslint-env node */
import i18next from 'i18next'
import { createApp } from './app.js'
import resources from './locales/index.js'

const createI18nInstance = () => {
  return i18next.createInstance()
}

const initI18n = async (i18nInstance) => {
  return i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  })
}

const initApp = async () => {
  try {
    // Создаем отдельный инстанс i18next вместо использования глобального
    const i18nInstance = createI18nInstance()
    await initI18n(i18nInstance)
    
    // Передаем инстанс i18next в приложение
    const app = createApp(i18nInstance)

    if (process.env.NODE_ENV !== 'production' && typeof globalThis !== 'undefined') {
      globalThis.__DEBUG_APP__ = app
      // Для отладки можно также экспортировать инстанс i18next
      globalThis.__DEBUG_I18N__ = i18nInstance
    }

    return app
  }
  catch (error) {
    console.error('Failed to initialize application:', error)
    throw error
  }
}

export default initApp
export { createI18nInstance } // Экспортируем для тестирования