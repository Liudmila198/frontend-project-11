/* eslint-env browser */
import axios from 'axios'
import * as yup from 'yup'
import i18next from 'i18next'
import { stateHelpers } from './state.js'

const createValidationSchema = existingUrls => yup.object().shape({
  url: yup
    .string()
    .required(i18next.t('errors.required'))
    .url(i18next.t('errors.url'))
    .notOneOf(existingUrls, i18next.t('errors.notOneOf')),
})

const parseRSS = (xmlString) => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

  const parseError = xmlDoc.querySelector('parsererror')
  if (parseError) {
    const error = new Error('Invalid RSS')
    error.type = 'invalidRss'
    throw error
  }

  const channel = xmlDoc.querySelector('channel')
  const feed = {
    title: channel.querySelector('title')?.textContent,
    description: channel.querySelector('description')?.textContent,
  }

  const items = xmlDoc.querySelectorAll('item')
  const posts = Array.from(items).map(item => ({
    title: item.querySelector('title')?.textContent,
    description: item.querySelector('description')?.textContent,
    link: item.querySelector('link')?.textContent,
    pubDate: item.querySelector('pubDate')?.textContent,
  }))

  return { feed, posts }
}

const loadRSS = (url) => {
  const proxyUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`

  return axios
    .get(proxyUrl, { timeout: 5000 })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Network error')
      }
      if (!response.data.contents) {
        throw new Error('Empty response')
      }
      return parseRSS(response.data.contents)
    })
    .catch((error) => {
      if (error.code === 'ECONNABORTED') {
        const networkError = new Error('Network timeout')
        networkError.type = 'network'
        throw networkError
      }
      if (error.message === 'Network Error') {
        error.type = 'network'
      }
      else if (!error.type) {
        error.type = 'network'
      }
      throw error
    })
}

const addDefaultValues = (data) => {
  return {
    feed: {
      title: (data.feed.title && data.feed.title.trim()) || i18next.t('defaults.feedTitle'),
      description: (data.feed.description && data.feed.description.trim()) || '',
    },
    posts: data.posts.map(post => ({
      title: (post.title && post.title.trim()) || i18next.t('defaults.postTitle'),
      description: (post.description && post.description.trim()) || '',
      link: (post.link && post.link.trim()) || '#',
      pubDate: (post.pubDate && post.pubDate.trim()) || '',
    }))
  }
}

export const createController = (state, view, elements) => {
  let updateInterval = null

  const handleFormSubmit = (e) => {
    e.preventDefault()

    const url = elements.urlInput.value.trim()
    if (!url) return

    state.form.url = url
    stateHelpers.updateFormStatus(state, 'validating')
    view.render(state)

    const existingUrls = stateHelpers.getFeedUrls(state)
    const schema = createValidationSchema(existingUrls)

    schema
      .validate({ url }, { abortEarly: false })
      .then(() => {
        stateHelpers.updateFormStatus(state, 'sending')
        view.render(state)

        return loadRSS(url)
      })
      .then(data => {
        // Добавляем значения по умолчанию после парсинга
        const { feed, posts } = addDefaultValues(data)
        const newFeed = stateHelpers.addFeed(state, { ...feed, url })
        stateHelpers.addPosts(state, posts, newFeed.id)

        stateHelpers.updateFormStatus(state, 'success')
        view.render(state)

        if (state.feeds.length === 1) {
          startAutoUpdate()
        }
      })
      .catch((error) => {
        if (error.name === 'ValidationError') {
          stateHelpers.setError(state, error.errors[0])
        }
        else {
          stateHelpers.setError(state, error)
        }
        view.render(state)
      })
  }

  const handlePostClick = (e) => {
    const link = e.target.closest('a[data-post-id]')
    if (link) {
      e.preventDefault()
      const postId = link.dataset.postId
      stateHelpers.markPostAsViewed(state, postId)
      view.render(state)
      const newTab = document.createElement('a')
      newTab.href = link.href
      newTab.target = '_blank'
      newTab.rel = 'noopener noreferrer'
      document.body.appendChild(newTab)
      newTab.click()
      document.body.removeChild(newTab)
    }
  }

  const handlePreviewClick = (e) => {
    const button = e.target.closest('button[data-post-id]')
    if (button) {
      const postId = button.dataset.postId
      const post = state.posts.find(p => p.id === postId)
      if (post) {
        stateHelpers.markPostAsViewed(state, postId)
        view.showPostModal(post)
        view.render(state)
      }
    }
  }

  const updateFeeds = () => {
    if (state.ui.loading || state.feeds.length === 0) return

    const updatePromises = state.feeds.map(feed =>
      loadRSS(feed.url)
        .then(data => {
          const posts  = addDefaultValues(data)
          stateHelpers.addPosts(state, posts, feed.id)
        })
        .catch((error) => {
          console.error(`Failed to update feed ${feed.url}:`, error)
        }))

    Promise.all(updatePromises)
      .then(() => {
        if (state.posts.length > 0) {
          view.render(state)
        }
      })
  }

  const startAutoUpdate = () => {
    if (updateInterval) {
      clearInterval(updateInterval)
    }

    updateInterval = setInterval(() => {
      updateFeeds()
    }, 5000)
  }

  const init = () => {
    elements.form.addEventListener('submit', handleFormSubmit)
    elements.postsContainer.addEventListener('click', (e) => {
      handlePostClick(e)
      handlePreviewClick(e)
    })

    if (elements.modal.element && elements.modal.element.modal) {
      elements.modal.element.addEventListener('hidden.bs.modal', () => {
        state.ui.currentPostId = null
      })
    }

    view.render(state)
  }

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
