import onChange from 'on-change'

export const createState = () => {
  const initialState = {
    form: {
      status: 'filling',
      error: null,
      valid: true,
      url: '',
    },
    feeds: [],
    posts: [],
    ui: {
      loading: false,
      currentPostId: null,
    },
    viewedPosts: new Set(),
    feedUrls: new Set(),
  }

  const state = onChange(initialState, (path, value) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('State changed:', path, value)
    }
  })

  return state
}

export const stateHelpers = {
  addFeed(state, feedData) {
    const feed = {
      ...feedData,
      id: Date.now(),
    }
    state.feeds.unshift(feed)
    state.feedUrls.add(feedData.url)
    return feed
  },

  addPosts(state, postsData, feedId) {
    const newPosts = postsData.map(post => ({
      ...post,
      id: `${Date.now()}-${Math.random()}`,
      feedId,
    }))

    const existingLinks = new Set(state.posts.map(p => p.link))
    const uniquePosts = newPosts.filter(post => !existingLinks.has(post.link))

    state.posts.unshift(...uniquePosts)
    return uniquePosts
  },

  markPostAsViewed(state, postId) {
    state.viewedPosts.add(postId)
  },

  resetForm(state) {
    state.form.status = 'filling'
    state.form.error = null
    state.form.valid = true
    state.ui.loading = false
  },

  updateFormStatus(state, status) {
    state.form.status = status
    state.ui.loading = status === 'sending'
  },

  setError(state, error) {
    state.form.status = 'error'
    state.form.error = error
    state.ui.loading = false
  },

  getFeedUrls(state) {
    return Array.from(state.feedUrls)
  },

  hasFeedUrl(state, url) {
    return state.feedUrls.has(url)
  },
}
