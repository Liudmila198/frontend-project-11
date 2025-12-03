import onChange from 'on-change'

// Создание состояния приложения
export const createState = () => {
  const initialState = {
    // Состояние формы
    form: {
      status: 'filling', // 'filling', 'validating', 'sending', 'success', 'error'
      error: null,
      valid: true,
      url: '',
    },
    
    // Данные
    feeds: [],
    posts: [],
    
    // UI состояние
    ui: {
      loading: false,
      currentPostId: null,
    },
    
    // Отслеживание состояния
    viewedPosts: new Set(),
    feedUrls: new Set(),
  }
  
  // Обертка для отслеживания изменений
  const state = onChange(initialState, (path, value) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('State changed:', path, value)
    }
  })
  
  return state
}

// Вспомогательные функции для работы с состоянием
export const stateHelpers = {
  // Добавление фида
  addFeed(state, feedData) {
    const feed = {
      ...feedData,
      id: Date.now(),
    }
    state.feeds.push(feed)
    state.feedUrls.add(feedData.url)
    return feed
  },
  
  // Добавление постов
  addPosts(state, postsData, feedId) {
    const newPosts = postsData.map((post) => ({
      ...post,
      id: `${feedId}-${post.link}`,
      feedId,
      isNew: true,
    }))
    
    // Фильтруем дубликаты
    const existingIds = new Set(state.posts.map((p) => p.id))
    const uniquePosts = newPosts.filter((post) => !existingIds.has(post.id))
    
    state.posts.unshift(...uniquePosts)
    return uniquePosts
  },
  
  // Отметка поста как просмотренного
  markPostAsViewed(state, postId) {
    state.viewedPosts.add(postId)
    const post = state.posts.find((p) => p.id === postId)
    if (post) {
      post.isNew = false
    }
  },
  
  // Сброс формы
  resetForm(state) {
    state.form.status = 'filling'
    state.form.error = null
    state.form.valid = true
    state.ui.loading = false
  },
  
  // Обновление статуса формы
  updateFormStatus(state, status) {
    state.form.status = status
    state.ui.loading = status === 'sending'
  },
  
  // Установка ошибки
  setError(state, error) {
    state.form.status = 'error'
    state.form.error = error
    state.ui.loading = false
  },
  
  // Получение URL фидов
  getFeedUrls(state) {
    return Array.from(state.feedUrls)
  },
  
  // Проверка существования URL
  hasFeedUrl(state, url) {
    return state.feedUrls.has(url)
  },
}