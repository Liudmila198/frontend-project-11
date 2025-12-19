/* eslint-env browser */
import axios from 'axios'
import * as yup from 'yup'
import { stateHelpers } from './state.js'

const createValidationSchema = (existingUrls, i18n) => yup.object().shape({
  url: yup
    .string()
    .required(i18n.t('errors.required'))
    .url(i18n.t('errors.url'))
    .notOneOf(existingUrls, i18n.t('errors.notOneOf')),
})

// Чистая функция парсера - только извлекает данные
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
    title: channel.querySelector('title')?.textContent?.trim(),
    description: channel.querySelector('description')?.textContent?.trim(),
  }

  const items = xmlDoc.querySelectorAll('item')
  const posts = Array.from(items).map(item => ({
    title: item.querySelector('title')?.textContent?.trim(),
    description: item.querySelector('description')?.textContent?.trim(),
    link: item.querySelector('link')?.textContent?.trim(),
    pubDate: item.querySelector('pubDate')?.textContent?.trim(),
  }))

  return { feed, posts }
}

// Функция для добавления дефолтных значений (отдельно от парсера)
const applyDefaults = (data, i18n) => {
  return {
    feed: {
      ...data.feed,
      title: data.feed.title || i18n.t('defaults.feedTitle'),
      description: data.feed.description || '',
    },
    posts: data.posts.map(post => ({
      ...post,
      title: post.title || i18n.t('defaults.postTitle'),
      description: post.description || '',
      link: post.link || '',
      pubDate: post.pubDate || '',
    }))
  }
}

const loadRSS = (url, i18n) => {
  const proxyUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`

  return axios
    .get(proxyUrl, { 
      timeout: 5000,
      validateStatus: (status) => status === 200 
    })
    .then((response) => {
      if (!response.data.contents) {
        const error = new Error('Empty response')
        error.type = 'emptyResponse'
        throw error
      }
      
      const parsedData = parseRSS(response.data.contents)
      return applyDefaults(parsedData, i18n)
    })
    .catch((error) => {
      if (error.code === 'ECONNABORTED') {
        const timeoutError = new Error('Network timeout')
        timeoutError.type = 'network'
        throw timeoutError
      }
      
      if (error.isAxiosError) {
        error.type = 'network'
      } else if (!error.type) {
        error.type = 'unknown'
      }
      
      throw error
    })
}

export const createController = (state, view, elements, i18n) => {
  let updateTimeout = null

  const handleFormSubmit = (e) => {
    e.preventDefault()

    const url = elements.urlInput.value.trim()
    if (!url) return

    state.form.url = url
    stateHelpers.updateFormStatus(state, 'validating')
    view.render(state)

    const existingUrls = stateHelpers.getFeedUrls(state)
    const schema = createValidationSchema(existingUrls, i18n)

    schema
      .validate({ url }, { abortEarly: false })
      .then(() => {
        stateHelpers.updateFormStatus(state, 'sending')
        view.render(state)

        return loadRSS(url, i18n)
      })
      .then(({ feed, posts }) => {
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
        } else {
          stateHelpers.setError(state, error)
        }
        stateHelpers.updateFormStatus(state, 'error')
        view.render(state)
      })
  }

  const handlePostClick = (e) => {
    const link = e.target.closest('a[data-post-id]')
    if (!link) return
    
    // Позволяем браузеру обработать переход по ссылке
    // Уже есть target="_blank" в HTML
    const postId = link.dataset.postId
    stateHelpers.markPostAsViewed(state, postId)
    view.render(state)
  }

  const handlePreviewClick = (e) => {
    const button = e.target.closest('button[data-post-id]')
    if (button) {
      e.preventDefault()
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
    if (state.ui.loading || state.feeds.length === 0) {
      scheduleNextUpdate()
      return
    }

    const updatePromises = state.feeds.map(feed =>
      loadRSS(feed.url, i18n)
        .then(({ posts }) => {
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
      .finally(() => {
        scheduleNextUpdate()
      })
  }

  const scheduleNextUpdate = () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }
    
    updateTimeout = setTimeout(() => {
      updateFeeds()
    }, 5000)
  }

  const startAutoUpdate = () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }
    
    updateFeeds()
  }

  const init = () => {
    elements.form.addEventListener('submit', handleFormSubmit)
    elements.postsContainer.addEventListener('click', (e) => {
      handlePostClick(e)
      handlePreviewClick(e)
    })

    elements.modal.element.addEventListener('hidden.bs.modal', () => {
      state.ui.currentPostId = null
    })

    view.render(state)
  }

  const destroy = () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }
    elements.form.removeEventListener('submit', handleFormSubmit)
    elements.postsContainer.removeEventListener('click', handlePostClick)
    elements.postsContainer.removeEventListener('click', handlePreviewClick)
  }

  return {
    init,
    destroy,
    updateFeeds,
  }
}