import onChange from 'on-change'
import i18n from './i18n.js'

export const createView = (state, handlers) => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    submitButton: document.querySelector('button[type="submit"]'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    modal: {
      element: document.getElementById('modal'),
      title: document.querySelector('.modal-title'),
      body: document.querySelector('.modal-body'),
      fullArticle: document.querySelector('.full-article'),
      close: document.querySelector('.modal-footer .btn-secondary'),
    },
  }

  const renderForm = () => {
    const { form, ui } = state
    
    elements.input.value = form.values.url

    if (form.status === 'invalid') {
      elements.input.classList.add('is-invalid')
      elements.feedback.classList.add('text-danger')
      elements.feedback.textContent = form.errors.url || ''
    } else {
      elements.input.classList.remove('is-invalid')
      elements.feedback.classList.remove('text-danger')
      elements.feedback.textContent = ''
    }

    elements.submitButton.disabled = form.status === 'validating' || ui.loading
    elements.input.disabled = ui.loading
    
    if (form.status === 'validating' || ui.loading) {
      elements.submitButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ${i18n.t('ui.adding')}
      `
    } else {
      elements.submitButton.textContent = i18n.t('ui.add')
      elements.submitButton.innerHTML = i18n.t('ui.add')
    }

    if (form.status === 'valid') {
      elements.input.focus()
      elements.input.value = ''
    }
  }

  const renderFeeds = () => {
    const { feeds } = state
    
    elements.feedsContainer.innerHTML = ''

    if (feeds.length === 0) {
      elements.feedsContainer.innerHTML = `
        <div class="card">
          <div class="card-body text-center text-muted">
            <p class="mb-0">${i18n.t('ui.feeds')} (0)</p>
          </div>
        </div>
      `
      return
    }

    const feedsTitle = document.createElement('h2')
    feedsTitle.className = 'h4 mb-3'
    feedsTitle.textContent = `${i18n.t('titles.feeds')} (${feeds.length})`

    const feedsList = document.createElement('div')
    feedsList.className = 'row'

    feeds.forEach((feed) => {
      const feedElement = document.createElement('div')
      feedElement.className = 'col-12 mb-3'
      feedElement.innerHTML = `
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">${feed.title}</h5>
            <p class="card-text">${feed.description}</p>
            <small class="text-muted">${feed.url}</small>
          </div>
        </div>
      `
      feedsList.appendChild(feedElement)
    })

    elements.feedsContainer.appendChild(feedsTitle)
    elements.feedsContainer.appendChild(feedsList)
  }

  const renderPosts = () => {
    const { posts, readPosts } = state
    
    elements.postsContainer.innerHTML = ''

    if (posts.length === 0) {
      elements.postsContainer.innerHTML = `
        <div class="card">
          <div class="card-body text-center text-muted">
            <p class="mb-0">${i18n.t('ui.posts')} (0)</p>
          </div>
        </div>
      `
      return
    }

    const unreadCount = posts.filter(post => !readPosts.has(post.id)).length

    const postsTitle = document.createElement('h2')
    postsTitle.className = 'h4 mb-3'
    postsTitle.textContent = `${i18n.t('titles.posts')} (${posts.length}, новых: ${unreadCount})`

    const postsList = document.createElement('div')
    postsList.className = 'row'

    posts.forEach((post) => {
      const isRead = readPosts.has(post.id)
      
      const titleClass = isRead ? 'fw-normal' : 'fw-bold'
      const cardBorderClass = isRead ? 'border-light' : 'border-primary'
      const badge = isRead ? '' : '<span class="badge bg-primary ms-2">NEW</span>'
      
      const postDate = post.pubDate ? new Date(post.pubDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Дата не указана'

      const postElement = document.createElement('div')
      postElement.className = `col-12 mb-3 ${isRead ? '' : 'highlight-new'}`
      postElement.innerHTML = `
        <div class="card h-100 ${cardBorderClass}" data-post-id="${post.id}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title ${titleClass}">
              ${post.title}
              ${badge}
            </h5>
            <p class="card-text flex-grow-1">${post.description}</p>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <small class="text-muted">${postDate}</small>
              <div class="btn-group" role="group">
                <a href="${post.link}" 
                   class="btn btn-outline-primary btn-sm read-full"
                   target="_blank" 
                   rel="noopener noreferrer"
                   data-post-id="${post.id}">
                  ${i18n.t('ui.read')}
                </a>
                <button class="btn btn-outline-secondary btn-sm preview-btn" 
                        data-bs-toggle="modal" 
                        data-bs-target="#modal"
                        data-post-id="${post.id}">
                  ${i18n.t('ui.view')}
                </button>
              </div>
            </div>
          </div>
        </div>
      `
      postsList.appendChild(postElement)
    })

    elements.postsContainer.appendChild(postsTitle)
    elements.postsContainer.appendChild(postsList)
  }

  const setupModal = () => {
    elements.modal.fullArticle.textContent = i18n.t('ui.read')
    elements.modal.close.textContent = i18n.t('ui.close')

    document.addEventListener('click', (event) => {
      const previewBtn = event.target.closest('.preview-btn')
      const readFullBtn = event.target.closest('.read-full')
      
      if (previewBtn) {
        const postId = previewBtn.getAttribute('data-post-id')
        const post = state.posts.find(p => p.id === postId)
        
        if (post) {
          elements.modal.title.textContent = post.title
          elements.modal.body.textContent = post.description
          elements.modal.fullArticle.href = post.link
          elements.modal.fullArticle.setAttribute('data-post-id', postId)
          
          handlers.onPostRead(postId)
          handlers.onModalOpen(postId)
        }
      }
      
      if (readFullBtn && readFullBtn.getAttribute('data-post-id')) {
        const postId = readFullBtn.getAttribute('data-post-id')
        handlers.onPostRead(postId)
      }
    })

    elements.modal.fullArticle.addEventListener('click', (event) => {
      const postId = event.target.getAttribute('data-post-id')
      if (postId) {
        handlers.onPostRead(postId)
      }
    })

    // ИСПРАВЛЕНИЕ: удаляем неиспользуемую переменную postId
    elements.modal.element.addEventListener('show.bs.modal', (event) => {
      const button = event.relatedTarget
      if (button && button.classList.contains('preview-btn')) {
        // Удаляем неиспользуемое присваивание переменной postId
        button.getAttribute('data-post-id')
        // Эта строка теперь просто получает атрибут, но не сохраняет в переменную
      }
    })

    elements.modal.element.addEventListener('hidden.bs.modal', () => {
      handlers.onModalClose()
    })
  }

  const watchedState = onChange(state, (path, value) => {
    if (path.startsWith('form') || path === 'ui.loading') {
      renderForm()
    }
    
    if (path === 'feeds') {
      renderFeeds()
    }
    
    if (path === 'posts' || path === 'readPosts') {
      renderPosts()
    }
    
    if (path === 'ui.language') {
      i18n.changeLanguage(value).then(() => {
        renderForm()
        renderFeeds()
        renderPosts()
        setupModal()
      })
    }
  })

  const initEventListeners = () => {
    elements.form.addEventListener('submit', (e) => {
      e.preventDefault()
      const formData = new FormData(elements.form)
      const url = formData.get('url').trim()
      handlers.onFormSubmit(url)
    })

    elements.input.addEventListener('input', () => {
      if (state.form.status === 'invalid') {
        handlers.onInputChange()
      }
    })
  }

  initEventListeners()
  setupModal()
  renderForm()
  renderFeeds()
  renderPosts()

  return watchedState
}