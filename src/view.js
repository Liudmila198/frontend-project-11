import i18next from 'i18next'

// Создание представления
export const createView = (elements) => {
  // Вспомогательные функции
  const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  // Обновление состояния формы
  const updateFormState = (state) => {
    const { form, ui } = state
    const { urlInput, feedback } = elements
    const submitButton = elements.form.querySelector('button[type="submit"]')
    
    // Сброс классов
    urlInput.classList.remove('is-invalid', 'is-valid')
    feedback.classList.remove('text-danger', 'text-success')
    feedback.textContent = ''
    
    switch (form.status) {
      case 'validating':
        submitButton.disabled = true
        break
        
      case 'sending':
        submitButton.disabled = true
        urlInput.readOnly = true
        break
        
      case 'success':
        submitButton.disabled = false
        urlInput.readOnly = false
        urlInput.value = ''
        urlInput.classList.add('is-valid')
        feedback.classList.add('text-success')
        feedback.textContent = i18next.t('success.loaded')
        urlInput.focus()
        break
        
      case 'error':
        submitButton.disabled = false
        urlInput.readOnly = false
        urlInput.classList.add('is-invalid')
        feedback.classList.add('text-danger')
        if (form.error) {
          const errorKey = typeof form.error === 'string' ? form.error : form.error.type || 'unknown'
          feedback.textContent = i18next.t(`errors.${errorKey}`)
        }
        break
        
      default: // filling
        submitButton.disabled = false
        urlInput.readOnly = false
    }
  }
  
  // Рендеринг фидов
  const renderFeeds = (feeds) => {
    const { feedsContainer } = elements
    
    if (feeds.length === 0) {
      feedsContainer.innerHTML = `
        <div class="card">
          <div class="card-body text-center text-muted">
            <p class="mb-0">${i18next.t('ui.noFeeds')}</p>
          </div>
        </div>
      `
      return
    }
    
    const feedsHtml = feeds.map((feed) => `
      <div class="card mb-3 fade-in">
        <div class="card-body">
          <h3 class="card-title h5">${escapeHtml(feed.title)}</h3>
          <p class="card-text text-muted small">${escapeHtml(feed.description)}</p>
          <p class="card-text">
            <small class="text-muted">Добавлен: ${new Date(feed.id).toLocaleDateString()}</small>
          </p>
        </div>
      </div>
    `).join('')
    
    feedsContainer.innerHTML = `
      <h2 class="h4 mb-3">${i18next.t('ui.feeds')}</h2>
      ${feedsHtml}
    `
  }
  
  // Рендеринг постов
  const renderPosts = (posts, viewedPosts) => {
    const { postsContainer } = elements
    
    if (posts.length === 0) {
      postsContainer.innerHTML = `
        <div class="card">
          <div class="card-body text-center text-muted">
            <p class="mb-0">${i18next.t('ui.noPosts')}</p>
          </div>
        </div>
      `
      return
    }
    
    const postsHtml = posts.map((post) => {
      const isViewed = viewedPosts.has(post.id)
      return `
        <div class="card mb-3 fade-in">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <a 
                  href="${escapeHtml(post.link)}" 
                  class="${isViewed ? 'fw-normal' : 'fw-bold'}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-post-id="${post.id}"
                >
                  ${escapeHtml(post.title)}
                </a>
                ${post.pubDate ? `
                  <div class="text-muted small mt-1">
                    ${new Date(post.pubDate).toLocaleDateString()}
                  </div>
                ` : ''}
              </div>
              <button 
                type="button" 
                class="btn btn-outline-primary btn-sm ms-3" 
                data-post-id="${post.id}"
                data-bs-toggle="modal" 
                data-bs-target="#modal"
              >
                ${i18next.t('ui.preview')}
              </button>
            </div>
          </div>
        </div>
      `
    }).join('')
    
    postsContainer.innerHTML = `
      <h2 class="h4 mb-3">${i18next.t('ui.posts')}</h2>
      ${postsHtml}
    `
  }
  
  // Показать модальное окно с постом
  const showPostModal = (post) => {
    const { modal } = elements
    modal.title.textContent = post.title
    modal.body.textContent = post.description || 'Нет описания'
    modal.link.href = post.link
  }
  
  // Основной рендеринг
  const render = (state) => {
    updateFormState(state)
    renderFeeds(state.feeds)
    renderPosts(state.posts, state.viewedPosts)
  }
  
  return {
    render,
    showPostModal,
    escapeHtml,
  }
}