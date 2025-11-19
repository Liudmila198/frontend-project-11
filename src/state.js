const createState = () => {
  return {
    // Статус приложения
    status: 'idle', // idle, loading, success, error
    
    // Данные формы
    form: {
      url: '',
      error: null,
      valid: true,
    },
    
    // Коллекции данных
    feeds: [],
    posts: [],
    
    // UI состояние
    ui: {
      visitedUrls: new Set(),
      modal: {
        isOpen: false,
        postId: null,
      },
    },
  }
}

// Геттер для получения всех URL фидов
const getFeedUrls = (state) => {
  return state.feeds.map(feed => feed.url)
}

// Обновление состояния формы
const updateFormState = (state, updates) => {
  state.form = { ...state.form, ...updates }
}

// Добавление фида
const addFeed = (state, feed) => {
  state.feeds.push(feed);
  state.ui.visitedUrls.add(feed.url)
}

// Сброс формы
const resetForm = (state) => {
  state.form.url = ''
  state.form.error = null
  state.form.valid = true
  state.status = 'idle'
}

export { createState, getFeedUrls, updateFormState, addFeed, resetForm }