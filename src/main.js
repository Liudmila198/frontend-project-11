import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './i18n.js'
import { createView } from './view.js'
import { createRssSchema, getValidationError } from './validation.js'
import { loadRssFeed } from './rss.js'
import i18n from './i18n.js'

const createApp = () => {
  const state = {
    form: {
      status: 'filling',
      errors: {},
      values: { url: '' },
      valid: false,
    },
    feeds: [],
    posts: [],
    ui: {
      language: 'ru',
      loading: false,
    },
    updater: {
      status: 'stopped',
      lastUpdate: null,
    },
    readPosts: new Set(),
  }

  // Функция для проверки дубликатов по URL
  const hasFeedWithUrl = (url) => state.feeds.some(feed => feed.url === url)

  // Функция для нормализации и добавления данных
  const addFeedData = (feedData) => {
    const { feed, posts } = feedData
    
    // Проверяем, нет ли уже такого фида (на случай параллельных запросов)
    if (hasFeedWithUrl(feed.url)) {
      throw new Error('RSS уже существует')
    }

    // Добавляем фид
    state.feeds.push(feed)
    
    // Добавляем посты
    state.posts.push(...posts)
    
    // Сортируем посты по дате публикации (новые сначала)
    state.posts.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
  }

  const handlers = {
    onFormSubmit: (url) => {
      const existingUrls = state.feeds.map(feed => feed.url)
      const schema = createRssSchema(existingUrls)
      
      state.form.status = 'validating'
      state.form.values.url = url
      state.ui.loading = true

      // Композиция операций через Promise
      schema.validate({ url }, { abortEarly: false })
        .then(() => loadRssFeed(url))
        .then((feedData) => {
          addFeedData(feedData)
          state.form.status = 'valid'
          state.form.errors = {}
          state.form.valid = true
          state.form.values.url = ''
          showTemporarySuccess(i18n.t('ui.success'))
        })
        .catch((error) => {
          state.form.status = 'invalid'
          state.form.errors = { url: getValidationError(error) }
          state.form.valid = false
        })
        .finally(() => {
          state.ui.loading = false
        });
    },

    onInputChange: () => {
      state.form.status = 'filling'
      state.form.errors = {}
    },

    onChangeLanguage: (language) => {
      state.ui.language = language
    },
  }

  const showTemporarySuccess = (message) => {
    const feedback = document.querySelector('.feedback')
    feedback.textContent = message
    feedback.classList.add('text-success')
    feedback.classList.remove('text-danger')
    
    setTimeout(() => {
      feedback.textContent = ''
      feedback.classList.remove('text-success')
    }, 5000)
  }

  return createView(state, handlers)
}

document.addEventListener('DOMContentLoaded', () => {
  createApp()
})