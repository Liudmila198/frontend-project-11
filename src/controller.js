import axios from 'axios'
import * as yup from 'yup'
import i18next from 'i18next'
import { stateHelpers } from './state.js'

// Создание схемы валидации
const createValidationSchema = (existingUrls) => {
  return yup.object().shape({
    url: yup
      .string()
      .required(i18next.t('errors.required'))
      .url(i18next.t('errors.url'))
      .notOneOf(existingUrls, i18next.t('errors.notOneOf')),
  })
}

// Парсинг RSS
const parseRSS = (xmlString) => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
  
  // Проверка на ошибки парсинга
  const parseError = xmlDoc.querySelector('parsererror')
  if (parseError) {
    const error = new Error('Invalid RSS')
    error.type = 'invalidRss'
    throw error
  }
  
  // Извлечение данных фида
  const channel = xmlDoc.querySelector('channel')
  const feed = {
    title: channel.querySelector('title')?.textContent?.trim() || 'Без названия',
    description: channel.querySelector('description')?.textContent?.trim() || '',
  }
  
  // Извлечение постов
  const items = xmlDoc.querySelectorAll('item')
  const posts = Array.from(items).map((item) => ({
    title: item.querySelector('title')?.textContent?.trim() || 'Без названия',
    description: item.querySelector('description')?.textContent?.trim() || '',
    link: item.querySelector('link')?.textContent?.trim() || '',
    pubDate: item.querySelector('pubDate')?.textContent?.trim() || '',
  }))
  
  return { feed, posts }
}

// Загрузка RSS через прокси
const loadRSS = (url) => {
  const proxyUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`
  
  return axios
    .get(proxyUrl, { timeout: 5000 })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Network error')
      }
      return parseRSS(response.data.contents)
    })
    .catch((error) => {
      if (error.code === 'ECONNABORTED') {
        const networkError = new Error('Network timeout')
        networkError.type = 'network'
        throw networkError
      }
      if (!error.type) {
        error.type = 'network'
      }
      throw error
    })
}

// Создание контроллера
export const createController = (state, view, elements) => {
  let updateInterval = null
  
  // Обработка отправки формы
  const handleFormSubmit = (e) => {
    e.preventDefault()
    
    const url = elements.urlInput.value.trim()
    if (!url) return
    
    // Обновляем состояние
    state.form.url = url
    stateHelpers.updateFormStatus(state, 'validating')
    view.render(state)
    
    // Валидация
    const existingUrls = stateHelpers.getFeedUrls(state)
    const schema = createValidationSchema(existingUrls)
    
    schema
      .validate({ url }, { abortEarly: false })
      .then(() => {
        // Начинаем загрузку
        stateHelpers.updateFormStatus(state, 'sending')
        view.render(state)
        
        return loadRSS(url)
      })
      .then(({ feed, posts }) => {
        // Добавляем фид и посты
        const newFeed = stateHelpers.addFeed(state, { ...feed, url })
        stateHelpers.addPosts(state, posts, newFeed.id)
        
        // Успех
        stateHelpers.updateFormStatus(state, 'success')
        view.render(state)
        
        // Запускаем автообновление, если это первый фид
        if (state.feeds.length === 1) {
          startAutoUpdate()
        }
      })
      .catch((error) => {
        // Обработка ошибок
        if (error.name === 'ValidationError') {
          stateHelpers.setError(state, error.errors[0])
        } else {
          stateHelpers.setError(state, error)
        }
        view.render(state)
      })
  }
  
  // Обработка клика по посту
  const handlePostClick = (e) => {
    const link = e.target.closest('a[data-post-id]')
    if (link) {
      const postId = link.dataset.postId
      stateHelpers.markPostAsViewed(state, postId)
      view.render(state)
    }
  }
  
  // Обработка клика по кнопке предпросмотра
  const handlePreviewClick = (e) => {
    const button = e.target.closest('button[data-post-id]')
    if (button) {
      const postId = button.dataset.postId
      const post = state.posts.find((p) => p.id === postId)
      if (post) {
        stateHelpers.markPostAsViewed(state, postId)
        view.showPostModal(post)
        view.render(state)
      }
    }
  }
  
  // Автообновление фидов
  const updateFeeds = () => {
    if (state.ui.loading || state.feeds.length === 0) return
    
    const updatePromises = state.feeds.map((feed) =>
      loadRSS(feed.url)
        .then(({ posts }) => {
          // Добавляем только новые посты
          stateHelpers.addPosts(state, posts, feed.id)
        })
        .catch((error) => {
          console.error(`Failed to update feed ${feed.url}:`, error)
        })
    )
    
    Promise.all(updatePromises)
      .then(() => {
        if (state.posts.length > 0) {
          view.render(state)
        }
      })
  }
  
  // Запуск автообновления
  const startAutoUpdate = () => {
    if (updateInterval) {
      clearInterval(updateInterval)
    }
    
    // Используем setTimeout для рекурсивного обновления вместо setInterval
    const scheduleUpdate = () => {
      updateFeeds()
      setTimeout(scheduleUpdate, 5000)
    }
    
    // Первое обновление через 5 секунд
    setTimeout(scheduleUpdate, 5000)
  }
  
  // Инициализация контроллера
  const init = () => {
    // Привязка событий
    elements.form.addEventListener('submit', handleFormSubmit)
    elements.postsContainer.addEventListener('click', (e) => {
      handlePostClick(e)
      handlePreviewClick(e)
    })
    
    // Обработка закрытия модального окна
    elements.modal.element.addEventListener('hidden.bs.modal', () => {
      state.ui.currentPostId = null
    })
    
    // Начальный рендеринг
    view.render(state)
  }
  
  // Очистка
  const destroy = () => {
    if (updateInterval) {
      clearInterval(updateInterval)
    }
    elements.form.removeEventListener('submit', handleFormSubmit)
  }
  
  return {
    init,
    destroy,
    updateFeeds,
  }
}