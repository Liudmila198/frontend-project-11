import i18next from 'i18next'

const renderForm = (elements, state) => {
  const { form } = state
  const { input, feedback, submitButton } = elements

  input.value = form.field.url
  submitButton.disabled = form.status === 'validating'

  switch (form.status) {
    case 'validating':
      input.classList.remove('is-invalid')
      feedback.textContent = i18next.t('status.validating')
      feedback.classList.remove('text-danger')
      feedback.classList.add('text-warning')
      break

    case 'invalid':
      input.classList.add('is-invalid')
      feedback.textContent = form.error
      feedback.classList.remove('text-warning')
      feedback.classList.add('text-danger')
      break

    case 'valid':
      input.classList.remove('is-invalid')
      feedback.textContent = i18next.t('status.success')
      feedback.classList.remove('text-danger', 'text-warning')
      feedback.classList.add('text-success')
      setTimeout(() => {
        feedback.textContent = ''
      }, 3000)
      break

    case 'filling':
    default:
      input.classList.remove('is-invalid')
      feedback.textContent = ''
      break
  }
}

const renderFeeds = (elements, state) => {
  const { feedsContainer } = elements
  const { feeds } = state

  if (feeds.length === 0) {
    feedsContainer.innerHTML = ''
    return
  }

  const feedsHTML = `
    <div class="card">
      <div class="card-body">
        <h2 class="card-title h4">${i18next.t('ui.feeds')}</h2>
        <ul class="list-group list-group-flush">
          ${feeds.map(feed => `
            <li class="list-group-item">
              <h3 class="h6">${feed.title}</h3>
              <p class="m-0 small text-muted">${feed.description}</p>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `

  feedsContainer.innerHTML = feedsHTML
}

const renderPosts = (elements, state) => {
  const { postsContainer } = elements
  const { posts, ui } = state

  if (posts.length === 0) {
    postsContainer.innerHTML = ''
    return
  }

  const postsHTML = `
    <div class="card">
      <div class="card-body">
        <h2 class="card-title h4">${i18next.t('ui.posts')}</h2>
        <ul class="list-group list-group-flush">
          ${posts.map(post => {
            const isVisited = ui.visitedPosts.has(post.id)
            const fontWeightClass = isVisited ? 'fw-normal' : 'fw-bold'
            
            return `
            <li class="list-group-item d-flex justify-content-between align-items-start">
              <div>
                <a 
                  href="${post.link}" 
                  class="${fontWeightClass}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-id="${post.id}"
                >
                  ${post.title}
                </a>
                <p class="mb-0 mt-1 small text-muted">${post.description}</p>
              </div>
              <button 
                type="button" 
                class="btn btn-outline-primary btn-sm" 
                data-id="${post.id}"
                data-bs-toggle="modal" 
                data-bs-target="#modal"
              >
                ${i18next.t('ui.view')}
              </button>
            </li>
          `}).join('')}
        </ul>
      </div>
    </div>
  `

  postsContainer.innerHTML = postsHTML
}

const updateModal = (elements, state) => {
  const { modal } = elements
  const modalTitle = modal.querySelector('.modal-title')
  const modalBody = modal.querySelector('.modal-body')
  const fullArticleLink = modal.querySelector('.full-article')
  const closeButton = modal.querySelector('.btn-secondary')

  if (state.ui.modal) {
    const post = state.posts.find(p => p.id === state.ui.modal)
    if (post) {
      modalTitle.textContent = post.title
      modalBody.innerHTML = post.description
      fullArticleLink.href = post.link
      fullArticleLink.textContent = i18next.t('ui.readMore')
      closeButton.textContent = i18next.t('ui.close')
    }
  }
}

const markPostAsVisited = (state, postId) => {
  state.ui.visitedPosts.add(postId)
}

const initPostsHandlers = (elements, state) => {
  const { postsContainer, modal } = elements

  postsContainer.addEventListener('click', (e) => {
    const target = e.target
    
    const postLink = target.closest('a[data-id]')
    if (postLink) {
      const postId = parseInt(postLink.dataset.id, 10)
      markPostAsVisited(state, postId)
    }

    const previewBtn = target.closest('button[data-id]')
    if (previewBtn) {
      e.preventDefault()
      const postId = parseInt(previewBtn.dataset.id, 10)
      markPostAsVisited(state, postId)
      state.ui.modal = postId
    }

    const externalLink = target.closest('a[target="_blank"]')
    if (externalLink && externalLink.dataset.id) {
      const postId = parseInt(externalLink.dataset.id, 10)
      markPostAsVisited(state, postId)
    }
  })

  modal.addEventListener('hidden.bs.modal', () => {
    state.ui.modal = null
  })
}

export const render = (elements, state, path) => {
  switch (path) {
    case 'form':
    case 'form.status':
    case 'form.error':
    case 'form.field.url':
      renderForm(elements, state)
      break

    case 'feeds':
      renderFeeds(elements, state)
      break

    case 'posts':
    case 'ui.visitedPosts':
      renderPosts(elements, state)
      break

    case 'ui.modal':
      updateModal(elements, state)
      break

    default:
      renderForm(elements, state)
      renderFeeds(elements, state)
      renderPosts(elements, state)
      break
  }
}

export { initPostsHandlers, markPostAsVisited }