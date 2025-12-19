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

const loadRSS = (url) => {
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
      return response.data.contents
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
    state.form.status = 'validating'
    state.form.error = null
    view.render(state)

    const existingUrls = state.feeds.map(feed => feed.url)
    const schema = createValidationSchema(existingUrls, i18n)

    schema
      .validate({ url }, { abortEarly: false })
      .then(() => {
        state.form.status = 'sending'
        view.render(state)

        return loadRSS(url)
      })
      .then((xmlString) => {
        const parsedData = parseRSS(xmlString)
        const { feed, posts } = applyDefaults(parsedData, i18n)
        
        const feedId = stateHelpers.addFeed(state, { ...feed, url })
        stateHelpers.addPosts(state, posts, feedId)

        state.form.status = 'success'
        state.form.error = null
        view.render(state)

        if (state.feeds.length === 1) {
          startAutoUpdate()
        }
      })
      .catch((error) => {
        console.error('Form submit error:', error)
        
        if (error.name === 'ValidationError') {
          state.form.error = error.errors[0]
        } else {
          state.form.error = error.type || 'unknown'
        }
        
        state.form.status = 'error'
        view.render(state)
      })
  }

  const handlePostClick = (e) => {
    const link = e.target.closest('a[data-post-id]')
    if (!link) return
    
    const postId = link.dataset.postId
    state.viewedPosts.add(postId)
    view.render(state)
  }

  const handlePreviewClick = (e) => {
    const button = e.target.closest('button[data-post-id]')
    if (button) {
      e.preventDefault()
      const postId = button.dataset.postId
      const post = state.posts.find(p => p.id === postId)
      if (post) {
        state.viewedPosts.add(postId)
        view.showPostModal(post)
        view.render(state)
      }
    }
  }

  const updateFeeds = () => {
    if (state.feeds.length === 0) {
      scheduleNextUpdate()
      return
    }

    const updatePromises = state.feeds.map(feed =>
      loadRSS(feed.url)
        .then((xmlString) => {
          const parsedData = parseRSS(xmlString)
          const { posts } = applyDefaults(parsedData, i18n)
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
  }

  return {
    init,
    destroy,
    updateFeeds,
  }
}