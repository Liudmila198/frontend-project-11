import i18next from 'i18next'

export const createView = (elements) => {
  const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const updateFormState = (state) => {
    const { form } = state
    const { urlInput, feedback } = elements
    const submitButton = elements.form.querySelector('button[type="submit"]')

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
        feedback.textContent = i18next.t('ui.loading')
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

      default:
        submitButton.disabled = false
        urlInput.readOnly = false
    }
  }

  const renderFeeds = (feeds) => {
    const { feedsContainer } = elements

    if (feeds.length === 0) {
      feedsContainer.innerHTML = ''
      return
    }

    const feedsHtml = `
      <div class="card border-0">
        <div class="card-body">
          <h2 class="card-title h4">${i18next.t('ui.feeds')}</h2>
        </div>
        <ul class="list-group border-0 rounded-0">
          ${feeds.map((feed) => `
            <li class="list-group-item border-0 border-end-0">
              <h3 class="h6 m-0">${escapeHtml(feed.title)}</h3>
              <p class="m-0 small text-black-50">${escapeHtml(feed.description)}</p>
            </li>
          `).join('')}
        </ul>
      </div>
    `

    feedsContainer.innerHTML = feedsHtml
  }

  const renderPosts = (posts, viewedPosts) => {
    const { postsContainer } = elements

    if (posts.length === 0) {
      postsContainer.innerHTML = ''
      return
    }

    const postsHtml = `
      <div class="card border-0">
        <div class="card-body">
          <h2 class="card-title h4">${i18next.t('ui.posts')}</h2>
        </div>
        <ul class="list-group border-0 rounded-0">
          ${posts.map((post) => {
    const isViewed = viewedPosts.has(post.id)
    return `
              <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
                <a 
                  href="${escapeHtml(post.link)}" 
                  class="${isViewed ? 'fw-normal' : 'fw-bold'}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-post-id="${post.id}"
                >
                  ${escapeHtml(post.title)}
                </a>
                <button 
                  type="button" 
                  class="btn btn-outline-primary btn-sm" 
                  data-post-id="${post.id}"
                  data-bs-toggle="modal" 
                  data-bs-target="#modal"
                >
                  ${i18next.t('ui.preview')}
                </button>
              </li>
            `
  }).join('')}
        </ul>
      </div>
    `

    postsContainer.innerHTML = postsHtml
  }

  const showPostModal = (post) => {
    const { modal } = elements
    modal.title.textContent = post.title
    modal.body.textContent = post.description || 'Нет описания'
    modal.link.href = post.link
  }

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