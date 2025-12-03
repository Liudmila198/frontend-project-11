import i18next from 'i18next'
import { createApp } from './app.js'

const initI18n = () => i18next.init({
  lng: 'ru',
  debug: false,
  resources: {
    ru: {
      translation: {
        errors: {
          required: 'Не должно быть пустым',
          url: 'Ссылка должна быть валидным URL',
          notOneOf: 'RSS уже существует',
          network: 'Ошибка сети',
          invalidRss: 'Ресурс не содержит валидный RSS',
          unknown: 'Неизвестная ошибка. Попробуйте еще раз.',
        },
        success: {
          loaded: 'RSS успешно загружен',
        },
        ui: {
          add: 'Добавить',
          loading: 'Загрузка...',
          feeds: 'Фиды',
          posts: 'Посты',
          preview: 'Просмотр',
          readMore: 'Читать полностью',
          close: 'Закрыть',
          noFeeds: 'Фиды не добавлены',
          noPosts: 'Посты не найдены',
          example: 'Пример: https://lorem-rss.hexlet.app/feed',
        },
      },
    },
  },
})

const initApp = async () => {
  try {
    await initI18n()
    const app = createApp()

    if (process.env.NODE_ENV !== 'production') {
      window.app = app
    }

    return app
  } catch (error) {
    console.error('Failed to initialize application:', error)
    throw error
  }
}

export default initApp
