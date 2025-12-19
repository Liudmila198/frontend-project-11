export const createState = () => ({
  form: {
    url: '',
    status: 'idle', // 'idle', 'validating', 'sending', 'success', 'error'
    error: null,
  },
  feeds: [],
  posts: [],
  viewedPosts: new Set(),
  ui: {
    loading: false,
    currentPostId: null,
  },
})

export const stateHelpers = {
  updateFormStatus(state, status) {
    state.form.status = status
  },

  setError(state, error) {
    state.form.error = error
  },

  addFeed(state, feed) {
    const newFeed = {
      ...feed,
      id: Date.now().toString(),
    }
    state.feeds.push(newFeed)
    return newFeed.id
  },

  addPosts(state, posts, feedId) {
    const existingLinks = new Set(state.posts.map(post => post.link))
    
    posts.forEach((post) => {
      if (post.link && !existingLinks.has(post.link)) {
        state.posts.push({
          ...post,
          id: Date.now().toString() + Math.random(),
          feedId,
        })
        existingLinks.add(post.link)
      }
    })
  },

  markPostAsViewed(state, postId) {
    state.viewedPosts.add(postId)
  },

  getFeedUrls(state) {
    return state.feeds.map(feed => feed.url)
  },
}