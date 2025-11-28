import './style.css'
import { Modal } from 'bootstrap'
import { initialState, initState, generateId, updatePosts } from './state.js'
import { validateForm } from './validator.js'
import { render, initPostsHandlers } from './view.js'
import initI18n from './i18n.js'
import { processRSS } from './parser.js'
import { updateAllFeeds, FeedUpdater } from './updater.js'
import i18next from 'i18next'

const app = () => {
  initI18n()

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    submitButton: document.querySelector('button[type="submit"]'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    modal: document.querySelector('#modal'),
  }

  const state = initState(initialState, (path) => {
    render(elements, state, path)
  })

  let modalInstance = null
  if (elements.modal) {
    modalInstance = new Modal(elements.modal, {
      backdrop: true,
      focus: true,
      keyboard: true
    })
  }

  const feedUpdater = new FeedUpdater()
  let isAutoUpdateStarted = false

  const performAutoUpdate = () => {
    if (state.feeds.length === 0) {
      return Promise.resolve()
    }

    return updateAllFeeds(state.feeds, state.posts)
      .then((newPosts) => {
        if (newPosts.length > 0) {
          state.posts = updatePosts(state, newPosts)
        }
      })
      .catch((error) => {
        console.error('Auto-update error:', error)
      })
  }

  const startAutoUpdateIfNeeded = () => {
    if (!isAutoUpdateStarted && state.feeds.length > 0) {
      feedUpdater.start(performAutoUpdate)
      isAutoUpdateStarted = true
    }
  }
const initPH = initPostsHandlers
  initPH(elements, state)
  
   const handleFormSubmit = (event) => {
    event.preventDefault()
    
    const formData = new FormData(event.target)
    const url = formData.get('url').trim()

    state.form.field.url = url
    state.form.status = 'validating'
    state.form.error = null

    const existingUrls = state.feeds.map(feed => feed.url)

    validateForm(url, existingUrls)
      .then((result) => {
        if (result.success) {
          state.form.status = 'sending'
          
          return processRSS(url)
            .then((rssData) => {
              const feedId = generateId()
              const newFeed = {
                id: feedId,
                url,
                title: rssData.feed.title,
                description: rssData.feed.description,
              }

              const newPosts = rssData.posts.map((post) => ({
                id: generateId(),
                feedId,
                title: post.title,
                link: post.link,
                description: post.description,
              }))

              state.feeds.push(newFeed)
              state.posts = updatePosts(state, newPosts)
              
              state.form.status = 'valid'
              state.form.field.url = ''
              elements.input.focus()

              startAutoUpdateIfNeeded()
            })
        } else {
          state.form.status = 'invalid'
          state.form.error = result.error
        }
      })
      .catch((error) => {
        state.form.status = 'invalid'
        if (error.message === 'network_error') {
          state.form.error = i18next.t('errors.networkError') 
        } else if (error.message === 'invalid_rss') { 
          state.form.error = i18next.t('errors.invalidRss') 
        } else {
          state.form.error = i18next.t('errors.networkError')
        }
      })
  }

  const handleInputChange = (event) => {
    if (state.form.status === 'invalid') { 
      state.form.status = 'filling' 
      state.form.error = null
    }
    state.form.field.url = event.target.value 
  }
  elements.form.addEventListener('submit', handleFormSubmit)
  elements.input.addEventListener('input', handleInputChange)

  render(elements, state)

  return () => {
    feedUpdater.stop()
    if (modalInstance) {
      modalInstance.dispose()
    }
  }
}

export default app