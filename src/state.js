import onChange from 'on-change'

let idCounter = 0
export const generateId = () => {
  idCounter += 1
  return idCounter
}

export const initialState = {
  feeds: [],
  posts: [],
  form: {
    status: 'filling',
    error: null,
    field: {
      url: '',
    },
  },
  ui: {
    feedback: '',
    modal: null,
    visitedPosts: new Set(),
  },
  loading: {
    process: 'idle',
    error: null,
  },
  updates: {
    lastUpdate: null,
    newPostsCount: 0,
  },
}

export const updatePosts = (state, newPosts) => {
  const existingLinks = new Set(state.posts.map(post => post.link))
  const uniqueNewPosts = newPosts.filter(post => !existingLinks.has(post.link))
  
  if (uniqueNewPosts.length > 0) {
    state.updates.newPostsCount = uniqueNewPosts.length
    state.updates.lastUpdate = new Date().toISOString()
  }
  
  return [...state.posts, ...uniqueNewPosts]
}

export const initState = (state, callback) => onChange(state, callback)